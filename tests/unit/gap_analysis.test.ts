
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CombatResolverService } from '../../src/services/combat/resolver';
import { CharacterService } from '../../src/services/character/service';
import { WorldSimulator } from '../../src/services/world/simulator';
import { calculateMaxHP } from '../../src/game/mechanics/combat';

// Mock dependencies
const mockDb = {
    prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
            first: vi.fn(),
            all: vi.fn(),
            run: vi.fn(),
        })),
    })),
    batch: vi.fn(),
} as any;

const mockItemService = {
    generateLoot: vi.fn().mockResolvedValue([{ item_definition_id: 'item-1', quantity: 1 }]),
};

const mockVendorService = {
    checkAndRestock: vi.fn().mockResolvedValue(true),
};

describe('Gap Analysis Verification', () => {

    describe('CombatResolverService', () => {
        it('should use ItemService.generateLoot for rewards', async () => {
            const mockDurableObjectNamespace = {
                idFromName: vi.fn(),
                get: vi.fn(),
            } as any;

            const service = new CombatResolverService(
                {
                    db: mockDb,
                    itemService: mockItemService
                } as any,
                mockDurableObjectNamespace
            );

            const session = { encounter_id: 'enc-1' } as any;
            const encounterDef = { loot_table_id: 'lt_123', xp_reward: 100, credit_reward_min: 10, credit_reward_max: 50 };

            // Mock DB query for encounter
            const mockFirst = vi.fn().mockResolvedValue(encounterDef);
            const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
            const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
            mockDb.prepare = mockPrepare;

            const rewards = await (service as any).calculateRewards(session, 'VICTORY');

            expect(mockItemService.generateLoot).toHaveBeenCalledWith({
                lootTableId: 'lt_123',
                limit: 5
            });
            expect(rewards.loot).toEqual([{ itemId: 'item-1', quantity: 1 }]);
        });
    });

    describe('WorldSimulator', () => {
        it('should call VendorService.checkAndRestock in updateVendors', async () => {
            const simulator = new WorldSimulator(mockDb, mockVendorService as any);

            // Mock DB response for vendors
            mockDb.prepare.mockReturnValue({
                all: vi.fn().mockResolvedValue({ results: [{ id: 'vendor-1' }, { id: 'vendor-2' }] })
            });

            await simulator.updateVendors();

            expect(mockVendorService.checkAndRestock).toHaveBeenCalledWith('vendor-1');
            expect(mockVendorService.checkAndRestock).toHaveBeenCalledWith('vendor-2');
        });
    });

    describe('CharacterService', () => {
        let service: CharacterService;

        beforeEach(() => {
            service = new CharacterService(mockDb);
        });

        it('should calculate derived stats correctly', () => {
            // Access private method via any
            const stats = (service as any).calculateDerivedStats({
                PWR: 10,
                INT: 5,
                AGI: 6,
                PRC: 4,
                END: 8,
                VEL: 5
            }, 2); // Tier 2

            expect(stats.carryCapacity).toBeDefined();
            expect(stats.initiative).toBe(6 + 4);
            // Verify maxHp uses mechanics formula: (END * 5) + (PWR * 2) + (Tier * 3)
            // (8*5) + (10*2) + (2*3) = 40 + 20 + 6 = 66
            expect(stats.maxHp).toBe(66);
        });
    });
});
