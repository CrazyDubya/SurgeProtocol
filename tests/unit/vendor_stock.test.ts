
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VendorService } from '../../src/services/economy/vendor';
import { ErrorCodes } from '../../src/services/base';

// Mock DB
const mockDb = {
    prepare: vi.fn(() => mockDb),
    bind: vi.fn(() => mockDb),
    first: vi.fn(),
    all: vi.fn(),
    run: vi.fn(),
    batch: vi.fn(),
};

// Mock Cache
const mockCache = {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
};

describe('VendorService - Stock Management', () => {
    let service: VendorService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new VendorService({
            db: mockDb as any,
            cache: mockCache as any,
            userId: 'test-user',
            characterId: 'test-char'
        });
    });

    describe('generateVendorStock', () => {
        it('should generate stock for a vendor', async () => {
            // Mock getVendor (which calls checkAndRestock, so we mock that too or stub getVendor)
            // Ideally we mock getVendor internal call, but it's part of the class.
            // We can spy on it.

            // To avoid getVendor calling checkAndRestock which calls generateVendorStock (cyle in test),
            // we should mock query for getVendor directly.

            // BUT getVendor calls checkAndRestock... 
            // We'll mock checkAndRestock to do nothing for this test
            vi.spyOn(service, 'checkAndRestock').mockResolvedValue(undefined);

            // Mock getVendor query response
            mockDb.prepare.mockReturnValue({
                bind: vi.fn().mockReturnValue({
                    first: vi.fn().mockResolvedValue({
                        id: 'v1',
                        vendor_type: 'SHOP',
                        specialization: 'WEAPONS',
                        quality_tier_min: 1,
                        quality_tier_max: 5,
                        buy_price_modifier: 1,
                        sell_price_modifier: 0.5,
                        haggle_difficulty: 5,
                        tier_required: 1,
                        accepts_stolen: 0,
                        accepts_contraband: 0
                    })
                })
            } as any);

            // Mock item fetch
            // service.query is protected, but we can mock db.prepare which it uses.
            // Items query
            (mockDb.prepare as any).mockImplementation((sql: string) => {
                if (sql.includes('SELECT id, base_price FROM item_definitions')) {
                    return {
                        bind: vi.fn().mockReturnValue({
                            all: vi.fn().mockResolvedValue({
                                results: [
                                    { id: 'item1', base_price: 100 },
                                    { id: 'item2', base_price: 200 }
                                ]
                            })
                        })
                    } as any;
                }
                // Vendor query override
                if (sql.includes('SELECT') && sql.includes('vendor_inventories')) {
                    return {
                        bind: vi.fn().mockReturnValue({
                            first: vi.fn().mockResolvedValue({
                                id: 'v1',
                                vendor_type: 'SHOP',
                                specialization: 'WEAPONS'
                            })
                        })
                    } as any;
                }
                return {
                    bind: vi.fn().mockReturnValue({
                        first: vi.fn(),
                        all: vi.fn(),
                        run: vi.fn()
                    })
                } as any;
            });

            await service.generateVendorStock('v1');

            // Expect delete old stock
            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM vendor_items'));

            // Expect batch insert
            expect(mockDb.batch).toHaveBeenCalled();
            // We can check batch contents if we want, but calling it is enough coverage for now
        });
    });

    describe('checkAndRestock', () => {
        it('should trigger restock if time elapsed', async () => {
            const now = new Date();
            const lastRestock = new Date(now.getTime() - (25 * 60 * 60 * 1000)); // 25 hours ago

            mockDb.prepare.mockReturnValue({
                bind: vi.fn().mockReturnValue({
                    first: vi.fn().mockResolvedValue({
                        id: 'v1',
                        last_restock: lastRestock.toISOString(),
                        restock_frequency_hours: 24
                    }),
                    run: vi.fn()
                })
            } as any);

            // Spy on generateVendorStock
            const generateSpy = vi.spyOn(service, 'generateVendorStock').mockResolvedValue(undefined);

            await service.checkAndRestock('v1');

            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE vendor_inventories'));
            expect(generateSpy).toHaveBeenCalledWith('v1');
        });

        it('should NOT trigger restock if not time', async () => {
            const now = new Date();
            const lastRestock = new Date(now.getTime() - (1 * 60 * 60 * 1000)); // 1 hour ago

            mockDb.prepare.mockReturnValue({
                bind: vi.fn().mockReturnValue({
                    first: vi.fn().mockResolvedValue({
                        id: 'v1',
                        last_restock: lastRestock.toISOString(),
                        restock_frequency_hours: 24
                    })
                })
            } as any);

            const generateSpy = vi.spyOn(service, 'generateVendorStock').mockResolvedValue(undefined);

            await service.checkAndRestock('v1');

            expect(generateSpy).not.toHaveBeenCalled();
        });
    });
});
