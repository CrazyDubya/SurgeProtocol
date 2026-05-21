
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CombatResolverService, type CombatSessionConfig } from '../../src/services/combat/resolver';

// Mocks
const mockDb = {
    _sql: '',
    prepare: vi.fn(function (this: any, sql: string) {
        this._sql = sql;
        return this;
    }),
    bind: vi.fn(function (this: any) {
        return this;
    }),
    first: vi.fn(async function (this: any) {
        const sql = this._sql;
        // Mock Encounter with Loot Table
        if (sql.includes('encounter_definitions')) {
            return {
                id: 'enc_loot',
                xp_reward: 100,
                credit_reward_min: 10,
                credit_reward_max: 20,
                loot_table_id: 'lt1'
            };
        }
        // Mock Session
        if (sql.includes('combat_sessions WHERE id')) {
            return { encounter_id: 'enc_loot', character_id: 'char1' };
        }
        return null;
    }),
    all: vi.fn(async function (this: any) {
        const sql = this._sql;
        // Mock Loot Table Entries
        if (sql.includes('loot_table_entries')) {
            return {
                results: [
                    { item_definition_id: 'item_A', drop_chance: 1.0, min_quantity: 1, max_quantity: 1 }, // Always drops
                    { item_definition_id: 'item_B', drop_chance: 0.0, min_quantity: 1, max_quantity: 1 }  // Never drops
                ]
            };
        }
        return { results: [] };
    }),
    run: vi.fn(async function () {
        return { success: true };
    }),
    batch: vi.fn(),
} as any;

const mockCache = {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
} as any;

const mockDOStub = {
    fetch: vi.fn(),
} as any;

const mockDONamespace = {
    idFromName: vi.fn(() => 'mock-id'),
    get: vi.fn(() => mockDOStub),
} as any;

// Mock ConditionService to avoid dependency issues
vi.mock('../../src/services/status/condition', async (importOriginal) => {
    const MockConditionService = vi.fn();
    MockConditionService.prototype.getActiveConditions = vi.fn().mockResolvedValue([]);
    MockConditionService.prototype.addCondition = vi.fn();
    MockConditionService.prototype.removeCondition = vi.fn();

    return {
        ConditionService: MockConditionService
    };
});

describe('Combat Loot Generation', () => {
    let service: CombatResolverService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new CombatResolverService({ db: mockDb, cache: mockCache }, mockDONamespace);
    });

    it('should generate loot based on loot table', async () => {
        const combatId = 'combat_loot_test';

        // Mock DO State
        mockDOStub.fetch.mockImplementation(async (req: Request) => {
            return {
                ok: true,
                json: async () => ({
                    startedAt: Date.now(),
                    round: 1,
                    combatants: [['player', { id: 'player', hp: 100, hpMax: 100, conditions: [] }]]
                })
            };
        });

        const result = await service.endSession(combatId, 'VICTORY');

        // Verify loot
        expect(result.loot).toBeDefined();
        // Item A has 100% chance
        expect(result.loot).toContainEqual(expect.objectContaining({ itemId: 'item_A', quantity: 1 }));
        // Item B has 0% chance
        const itemB = result.loot.find(l => l.itemId === 'item_B');
        expect(itemB).toBeUndefined();
    });
});
