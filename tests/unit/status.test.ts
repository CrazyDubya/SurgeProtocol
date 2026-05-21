
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConditionService } from '../../src/services/status/condition';
import { AddictionService } from '../../src/services/status/addiction';

// Mock DB and Cache
const mockDb = {
    prepare: vi.fn(),
};
const mockCache = {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
};

describe('ConditionService', () => {
    let service: ConditionService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new ConditionService(mockDb as any, mockCache as any);
    });

    it('should add a condition', async () => {
        const mockRun = vi.fn();
        const mockFirst = vi.fn().mockReturnValue({
            id: 'cond-123',
            type: 'BUFF',
            name: 'Test Buff',
            expires_at: null,
            effects_data: '[]'
        });

        mockDb.prepare.mockReturnValue({ bind: vi.fn().mockReturnValue({ run: mockRun, first: mockFirst }) });

        const result = await service.addCondition({
            characterId: 'char-1',
            type: 'BUFF',
            name: 'Test Buff'
        });

        expect(mockRun).toHaveBeenCalled();
        expect(result?.name).toBe('Test Buff');
    });

    it('should calculate stat modifiers', async () => {
        const mockAll = vi.fn().mockReturnValue({
            results: [
                {
                    id: 'c1',
                    effects_data: JSON.stringify([{ type: 'STAT_MOD', target: 'strength', value: 5 }]),
                    expires_at: null
                },
                {
                    id: 'c2',
                    effects_data: JSON.stringify([{ type: 'STAT_MOD', target: 'strength', value: -2 }]),
                    expires_at: null
                }
            ]
        });

        // Mock delete (cleanup) then select
        mockDb.prepare.mockImplementation((sql: string) => {
            if (sql.includes('DELETE')) return { bind: () => ({ run: vi.fn() }) };
            if (sql.includes('SELECT')) return { bind: () => ({ all: mockAll }) };
            return { bind: () => ({ run: vi.fn() }) };
        });

        const mods = await service.getStatModifiers('char-1');
        expect(mods['strength']).toBe(3);
    });
});

describe('AddictionService', () => {
    let service: AddictionService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new AddictionService(mockDb as any, mockCache as any);
    });

    it('should start a new addiction', async () => {
        const mockRun = vi.fn();
        // First call returns null (not found), second returns new addiction
        const mockFirst = vi.fn()
            .mockReturnValueOnce(null)
            .mockReturnValueOnce({
                id: 'addict-new',
                character_id: 'char-1',
                substance_id: 'drug-x',
                usage_count: 1,
                stage: 'RECREATIONAL',
                is_in_withdrawal: 0
            });

        mockDb.prepare.mockImplementation((sql: string) => {
            if (sql.includes('SELECT')) return { bind: () => ({ first: mockFirst }) };
            return { bind: () => ({ run: mockRun }) };
        });

        const result = await service.consumeSubstance('char-1', 'drug-x');

        expect(mockRun).toHaveBeenCalled(); // Insert
        expect(result?.usage_count).toBe(1);
    });
});
