
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CombatResolverService, type CombatSessionConfig } from '../../src/services/combat/resolver';
import { ConditionService } from '../../src/services/status/condition';

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
        if (sql.includes('encounter_definitions')) return { enemy_template_ids: '[]' };
        if (sql.includes('characters')) return { id: 'char1', name: 'Hero', hp_current: 100, hp_max: 100 };
        if (sql.includes('condition_definitions')) return {
            code: 'STUNNED', condition_type: 'DEBUFF', severity: 5, default_duration_seconds: 10
        };
        if (sql.includes('combat_sessions WHERE id')) return { character_id: 'char1' };
        return null;
    }),
    all: vi.fn(async function () {
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

// Mock ConditionService
vi.mock('../../src/services/status/condition', async (importOriginal) => {
    const actual = await importOriginal<any>();
    const MockConditionService = vi.fn();
    MockConditionService.prototype.getActiveConditions = vi.fn();
    MockConditionService.prototype.addCondition = vi.fn();
    MockConditionService.prototype.removeCondition = vi.fn();
    return {
        ...actual,
        ConditionService: MockConditionService
    };
});

describe('CombatResolverService Refactor', () => {
    let service: CombatResolverService;
    let conditionService: any; // Mocked instance

    beforeEach(() => {
        vi.clearAllMocks();
        // Re-instantiate service
        service = new CombatResolverService({ db: mockDb, cache: mockCache }, mockDONamespace);
        conditionService = (service as any).conditionService; // Access private property
    });

    it('sanity check', () => {
        expect(conditionService).toBeDefined();
    });

    it('createSession should load active conditions', async () => {
        // Setup Mocks
        conditionService.getActiveConditions.mockResolvedValue([
            { id: 'cond1', name: 'Blinded', type: 'DEBUFF' }
        ]);

        mockDOStub.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

        // Execute
        const config: CombatSessionConfig = {
            combatId: 'combat1',
            characterId: 'char1',
            encounterId: 'enc1',
        };
        await service.createSession(config);

        // Verify
        expect(conditionService.getActiveConditions).toHaveBeenCalledWith('char1');

        // Check what was sent to DO
        const fetchCall = mockDOStub.fetch.mock.calls[0][0]; // Request object
        const body = await fetchCall.json();
        expect(body.combatants[0].conditions).toContain('Blinded');
    });

    it('endSession should sync conditions', async () => {
        // Setup
        const combatId = 'combat1';

        // Mock getSessionState
        mockDOStub.fetch.mockImplementation(async (req: Request) => {
            if (req.url.endsWith('/state')) {
                return {
                    ok: true,
                    json: async () => ({
                        startedAt: Date.now(),
                        round: 1,
                        combatants: [
                            ['player', { id: 'player', name: 'Hero', hp: 50, hpMax: 100, conditions: ['Blinded', 'Stunned'] }]
                        ],
                        turnOrder: [],
                        turnIndex: 0
                    })
                };
            }
            return { ok: true, json: async () => ({}) };
        });

        // Mock active conditions (Blinded exists, Stunned is new)
        conditionService.getActiveConditions.mockResolvedValue([
            { id: 'cond1', name: 'Blinded', type: 'DEBUFF' }
        ]);

        // Execute
        await service.endSession(combatId, 'VICTORY');

        // Verify
        // 1. Should fetch character_id (implicitly tested by logic proceeding)
        // 2. Should NOT remove Blinded (it's still there)
        expect(conditionService.removeCondition).not.toHaveBeenCalled();

        // 3. Should add Stunned
        expect(conditionService.addCondition).toHaveBeenCalledWith(expect.objectContaining({
            characterId: 'char1',
            name: 'Stunned',
            type: 'DEBUFF'
        }));
    });
});
