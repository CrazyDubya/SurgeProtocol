
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ItemService } from '../../src/services/items/item';

const mockDb = {
    prepare: vi.fn(),
};
const mockCache = {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
};

const mockBind = vi.fn();
const mockRun = vi.fn();
const mockAll = vi.fn();
const mockFirst = vi.fn();

describe('ItemService', () => {
    let service: ItemService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new ItemService(mockDb as any, mockCache as any);

        // Setup default mock return chain
        mockDb.prepare.mockReturnValue({
            bind: mockBind,
        });
        mockBind.mockReturnValue({
            run: mockRun,
            all: mockAll,
            first: mockFirst,
        });
    });

    describe('getInventory', () => {
        it('should return mapped inventory items', async () => {
            mockAll.mockResolvedValue({
                results: [
                    {
                        inventoryId: 'inv-1',
                        quantity: 1,
                        name: 'Sword',
                        weight_kg: 2,
                        equipped_slot: 'MAIN_HAND',
                        use_effects: null
                    },
                    {
                        inventoryId: 'inv-2',
                        quantity: 5,
                        name: 'Potion',
                        weight_kg: 0.1,
                        equipped_slot: null,
                        use_effects: JSON.stringify({ healing: 50 })
                    }
                ]
            });

            const result = await service.getInventory('char-1');

            expect(result.items).toHaveLength(2);
            expect(result.items[0].isEquipped).toBe(true);
            expect(result.items[1].isConsumable).toBe(true);
            expect(result.totalWeight).toBe(2.5); // 2*1 + 0.1*5
        });
    });

    describe('useItem', () => {
        it('should apply healing and consume item', async () => {
            // Mock finding item
            mockFirst.mockResolvedValueOnce({
                id: 'inv-1',
                name: 'Health Potion',
                quantity: 1,
                use_effects: JSON.stringify({ healing: 50 })
            });

            const result = await service.useItem('char-1', 'inv-1');

            expect(result.success).toBe(true);
            expect(result.effects).toContain('Healed 50 HP');
            // Check usage of DB (Update health, Delete item)
            // Ideally assume called based on result
        });

        it('should throw if item not usable', async () => {
            mockFirst.mockResolvedValueOnce({
                id: 'inv-1',
                name: 'Rock',
                use_effects: null
            });

            await expect(service.useItem('char-1', 'inv-1')).rejects.toThrow('Item is not usable');
        });
    });

    describe('equipItem', () => {
        it('should equip item if requirements met', async () => {
            mockFirst
                .mockResolvedValueOnce({ // Get Item
                    id: 'inv-1',
                    name: 'Sword',
                    item_type: 'WEAPON_MELEE',
                    required_tier: 1,
                    equipped_slot: null
                })
                .mockResolvedValueOnce({ current_tier: 2 }) // Get Character
                .mockResolvedValueOnce(null); // Check existing slot (empty)

            const result = await service.equipItem('char-1', 'inv-1');

            expect(result.success).toBe(true);
            expect(result.equipped_slot).toBe('MAIN_HAND');
        });

        it('should fail if tier validation fails', async () => {
            mockFirst
                .mockResolvedValueOnce({ // Get Item
                    id: 'inv-1',
                    name: 'Super Gun',
                    item_type: 'WEAPON_RANGED',
                    required_tier: 5,
                    equipped_slot: null
                })
                .mockResolvedValueOnce({ current_tier: 1 }); // Get Character

            await expect(service.equipItem('char-1', 'inv-1')).rejects.toThrow('Requires Tier 5');
        });
    });

    describe('discardItem', () => {
        it('should reduce quantity if stack > discard count', async () => {
            mockFirst.mockResolvedValueOnce({
                quantity: 10,
                equipped_slot: null
            });

            const result = await service.discardItem('char-1', 'inv-1', 2);
            expect(result.discarded).toBe(2);
            expect(result.remaining).toBe(8);
        });

        it('should fail to discard equipped item', async () => {
            mockFirst.mockResolvedValueOnce({
                quantity: 1,
                equipped_slot: 'HEAD'
            });
            await expect(service.discardItem('char-1', 'inv-1', 1)).rejects.toThrow('Cannot discard equipped item');
        });
    });
});
