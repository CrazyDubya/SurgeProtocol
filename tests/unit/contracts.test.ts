
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContractService } from '../../src/services/contracts/contract';
import { DebtService } from '../../src/services/contracts/debt';

// Mock DB and Cache
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

describe('ContractService', () => {
    let service: ContractService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new ContractService(mockDb as any, mockCache as any);

        // Setup mock chain
        mockDb.prepare.mockReturnValue({
            bind: mockBind,
        });
        mockBind.mockReturnValue({
            run: mockRun,
            all: mockAll,
            first: mockFirst,
        });
    });

    describe('signContract', () => {
        it('should create contract if definition exists', async () => {
            mockFirst.mockResolvedValueOnce({
                id: 'def-1',
                name: 'Job Contract',
                duration_value: 30
            });

            const result = await service.signContract({
                characterId: 'char-1',
                definitionId: 'def-1'
            });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('signed_at');
            expect(mockRun).toHaveBeenCalled(); // Should insert
        });

        it('should throw if contract definition does not exist', async () => {
            mockFirst.mockResolvedValueOnce(null);

            await expect(service.signContract({
                characterId: 'char-1',
                definitionId: 'bad-id'
            })).rejects.toThrow('Contract definition not found');
        });
    });

    describe('terminateContract', () => {
        it('should terminate an active contract', async () => {
            mockFirst.mockResolvedValueOnce({
                id: 'con-1',
                character_id: 'char-1',
                status: 'ACTIVE'
            });

            const result = await service.terminateContract('char-1', 'con-1');

            expect(result).toBe(true);
            expect(mockRun).toHaveBeenCalled(); // Should update status
        });

        it('should fail if contract not found or not active', async () => {
            mockFirst.mockResolvedValueOnce(null);
            await expect(service.terminateContract('char-1', 'bad-id')).rejects.toThrow('Contract not found');
        });
    });
});

describe('DebtService', () => {
    let service: DebtService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new DebtService(mockDb as any, mockCache as any);

        mockDb.prepare.mockReturnValue({
            bind: mockBind,
        });
        mockBind.mockReturnValue({
            run: mockRun,
            all: mockAll,
            first: mockFirst,
        });
    });

    describe('makePayment', () => {
        it('should reduce balance and continue if partial payment', async () => {
            mockFirst.mockResolvedValueOnce({
                id: 'debt-1',
                current_balance: 1000,
                status: 'ACTIVE'
            });

            const result = await service.makePayment('char-1', 'debt-1', 200);

            expect(result.newBalance).toBe(800);
            expect(result.debtSettled).toBe(false);
            expect(mockRun).toHaveBeenCalled(); // Update
        });

        it('should settle debt if full payment made', async () => {
            mockFirst.mockResolvedValueOnce({
                id: 'debt-1',
                current_balance: 500,
                status: 'ACTIVE'
            });

            const result = await service.makePayment('char-1', 'debt-1', 500);

            expect(result.newBalance).toBe(0);
            expect(result.debtSettled).toBe(true);
            expect(mockRun).toHaveBeenCalled(); // Update status to PAID
        });

        it('should throw if debt not active', async () => {
            mockFirst.mockResolvedValueOnce({
                id: 'debt-1',
                status: 'PAID'
            });

            await expect(service.makePayment('char-1', 'debt-1', 10)).rejects.toThrow('Debt is not active');
        });
    });
});
