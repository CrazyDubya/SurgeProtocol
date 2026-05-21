
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

describe('Seed Service - Dialogue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should seed dialogue trees when requested', async () => {
        const results = await seedAll(mockDb, undefined, ['dialogue_trees']);

        expect(results).toHaveLength(1);
        expect(results[0].table).toBe('dialogue_trees');
        expect(results[0].errors).toHaveLength(0);

        // verify prepare called for tree, nodes, responses
        // We expect at least one INSERT into dialogue_trees
        const insertTreeCalls = mockDb.prepare.mock.calls.filter((c: any) => c[0].includes('INSERT OR IGNORE INTO dialogue_trees'));
        expect(insertTreeCalls.length).toBeGreaterThan(0);
    });
});
