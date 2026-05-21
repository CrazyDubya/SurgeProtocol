
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CraftingService } from '../../src/services/crafting/crafting';

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

describe('CraftingService', () => {
    let service: CraftingService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new CraftingService(mockDb as any, mockCache as any);
        mockDb.prepare.mockReturnValue({ bind: mockBind });
        mockBind.mockReturnValue({ run: mockRun, all: mockAll, first: mockFirst });
    });

    describe('getRecipes', () => {
        it('should return formatted recipes', async () => {
            mockAll.mockResolvedValue({
                results: [
                    {
                        id: 'rec-1',
                        name: 'Iron Sword',
                        required_tier: 1,
                        quality_tier: 1,
                        component_categories: '["metal", "wood"]'
                    }
                ]
            });

            const result = await service.getRecipes({});
            expect(result).toHaveLength(1);
            expect(result[0].components).toHaveLength(2);
        });
    });

    describe('craftItem', () => {
        it('should craft item if requirements met', async () => {
            // 1. Get Recipe
            mockFirst.mockResolvedValueOnce({
                id: 'rec-1',
                name: 'Iron Sword',
                required_tier: 1,
                quality_tier: 1,
                xp_reward: 100
            });

            // 2. check tier
            mockFirst.mockResolvedValueOnce({ current_tier: 2, current_level: 5 });

            // 3. check components
            mockAll.mockResolvedValueOnce({
                results: [
                    { id: 'comp-1', quantity: 5 },
                    { id: 'comp-2', quantity: 2 }
                ]
            });

            const result = await service.craftItem('char-1', 'rec-1', ['comp-1', 'comp-2']);

            expect(result.success).toBe(true);
            expect(result.xpGained).toBe(25); // calculated in service
            expect(mockRun).toHaveBeenCalled(); // update inventory, create item, grant xp
        });

        it('should fail if tier low', async () => {
            // 1. Get Recipe
            mockFirst.mockResolvedValueOnce({
                id: 'rec-1',
                name: 'Diamond Sword',
                required_tier: 5
            });

            // 2. check tier
            mockFirst.mockResolvedValueOnce({ current_tier: 1, current_level: 1 });

            await expect(service.craftItem('char-1', 'rec-1', [])).rejects.toThrow('Requires Tier 5');
        });

        it('should fail if missing components', async () => {
            // 1. Get Recipe
            mockFirst.mockResolvedValueOnce({ id: 'rec-1', required_tier: 1 });
            // 2. check tier
            mockFirst.mockResolvedValueOnce({ current_tier: 1 });
            // 3. check components (empty)
            mockAll.mockResolvedValueOnce({ results: [] });

            await expect(service.craftItem('char-1', 'rec-1', ['comp-1'])).rejects.toThrow('Some components not found');
        });
    });
});
