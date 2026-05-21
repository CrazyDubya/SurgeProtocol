
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { seedAll } from '../../src/db/seed';

// Mock DB
const mockDb = {
    prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
            run: vi.fn(),
            all: vi.fn().mockResolvedValue({ results: [] }),
            first: vi.fn().mockResolvedValue(null)
        })),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn()
    }))
} as any;

describe('Seed Service - Selective Seeding', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should seed all tables when no filter provided', async () => {
        const results = await seedAll(mockDb);
        // We have about 10 seeders
        expect(results.length).toBeGreaterThan(8);
        expect(results.find(r => r.table === 'loot_tables')).toBeDefined();
        expect(results.find(r => r.table === 'factions')).toBeDefined();
    });

    it('should seed only requested tables', async () => {
        const results = await seedAll(mockDb, undefined, ['loot_tables']);

        expect(results).toHaveLength(1);
        expect(results[0].table).toBe('loot_tables');

        // Ensure others didn't run
        expect(results.find(r => r.table === 'factions')).toBeUndefined();
    });

    it('should handle multiple tables', async () => {
        const results = await seedAll(mockDb, undefined, ['loot_tables', 'items']);

        // Note: 'items' in the filter maps to 'item_definitions' in the seeder map in seed.ts?
        // Let's check the map key in seed.ts. 
        // 'item_definitions': seedItems
        // So we must pass 'item_definitions'

        const results2 = await seedAll(mockDb, undefined, ['loot_tables', 'item_definitions']);
        expect(results2).toHaveLength(2);
        expect(results2.find(r => r.table === 'loot_tables')).toBeDefined();
        expect(results2.find(r => r.table === 'item_definitions')).toBeDefined();
    });

    it('should ignore invalid table names', async () => {
        const results = await seedAll(mockDb, undefined, ['invalid_table', 'loot_tables']);
        expect(results).toHaveLength(1);
        expect(results[0].table).toBe('loot_tables');
    });
});
