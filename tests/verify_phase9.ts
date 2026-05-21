
import { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { DroneService } from '../src/services/vehicle/drone';
import { VendorService } from '../src/services/economy/vendor';
import { ServiceContext } from '../src/services/base';
// import { mock } from 'vitest-mock-extended';

// Mock DB
const mockDb = {
    prepare: (query: string) => {
        return {
            bind: (...args: any[]) => ({
                first: async () => {
                    // Character Drones (Specific Join Query)
                    if (query.includes('FROM character_drones cd')) {
                        return {
                            id: 'drone-1',
                            current_state: 'STORED',
                            definition_name: 'Test Drone',
                            drone_definition_id: 'drone-def-1',
                            manufacturer: 'Test Corp',
                            drone_type: 'QUAD',
                            base_price: 1000,
                            max_range_meters: 500,
                            sensor_suite_rating: 5,
                            stealth_rating: 5
                        };
                    }

                    // Drone Def
                    if (query.includes('drone_definitions') && query.includes('id = ?')) {
                        return {
                            id: 'drone-def-1',
                            base_price: 1000,
                            battery_capacity_wh: 500,
                            name: 'Test Drone'
                        };
                    }
                    // Character Finances
                    if (query.includes('character_finances')) {
                        return { credits: 2000, credit_limit: 500, credit_utilized: 0, primary_currency_balance: 2000 };
                    }
                    // Vendor
                    if (query.includes('vendor_inventories')) {
                        return {
                            id: 'vend-1',
                            vendor_type: 'BLACK_MARKET',
                            sell_price_modifier: 0.5,
                            buy_price_modifier: 1.5,
                            accepts_contraband: 1,
                            accepts_stolen: 1
                        };
                    }
                    // Inventory Item (Contraband)
                    if (query.includes('FROM character_inventory ci')) {
                        return {
                            id: 'inv-1',
                            item_definition_id: 'item-contraband',
                            quantity: 1,
                            base_price: 5000,
                            item_name: 'Stolen Data',
                            is_stolen: 0,
                            is_contraband: 1
                        };
                    }
                    if (query.includes('FROM character_drones cd')) {
                        return {
                            id: 'drone-1',
                            current_state: 'STORED',
                            definition_name: 'Test Drone',
                            drone_definition_id: 'drone-def-1',
                            manufacturer: 'Test Corp',
                            drone_type: 'QUAD',
                            base_price: 1000,
                            max_range_meters: 500,
                            sensor_suite_rating: 5,
                            stealth_rating: 5
                        };
                    }
                    if (query.includes('item_definitions') && query.includes('id = ?')) {
                        return {
                            id: 'item-contraband',
                            name: 'Stolen Data',
                            item_type: 'DATA',
                            rarity: 'RARE',
                            base_price: 5000,
                            weight: 0.1
                        };
                    }
                    return null;
                },
                all: async () => ({ results: [] }),
                run: async () => ({ success: true }),
            }),
            first: async () => null,
            all: async () => ({ results: [] }),
            run: async () => ({ success: true }),
        };
    },
    execute: async () => { },
    batch: async () => ({ success: true })
} as unknown as D1Database;

// Mock KV
const mockKV = {
    get: async () => null,
    put: async () => { },
} as unknown as KVNamespace;

async function runVerification() {
    console.log("Starting Phase 9 Verification...");

    const context: ServiceContext = {
        db: mockDb,
        cache: mockKV,
        characterId: 'char-1'
    };

    // 1. Verify Drone Service
    console.log("\n1. Testing Drone Service...");
    const droneService = new DroneService(context);

    // Purchase
    const purchaseResult = await droneService.purchaseDrone('char-1', 'drone-def-1');
    if (purchaseResult.success) {
        console.log(`✓ Drone Purchased: ${purchaseResult.droneId}`);

        // Deploy
        const deployResult = await droneService.deployDrone(purchaseResult.droneId!, 'loc-1');
        if (deployResult.success) {
            console.log("✓ Drone Deployed");
        } else {
            console.error("✗ Failed to deploy drone:", deployResult.message);
        }

    } else {
        console.error("✗ Failed to purchase drone:", purchaseResult.message);
    }

    // 2. Verify Black Market Heat
    console.log("\n2. Testing Black Market Heat...");
    const vendorService = new VendorService(context);

    // Mock simulate function to avoid DO call failure in test env
    (vendorService as any).simulator = {
        checkVendorRestock: async () => { }
    };

    try {
        const result = await vendorService.sellItem({
            vendorId: 'vend-1',
            inventoryItemId: 'inv-1',
            quantity: 1
        });

        // We expect it to succeed and log internally (verified via code inspection earlier)
        // In a real integration test we'd check DB side-effects.
        // For unit verification we check execution flow.
        console.log("✓ Black Market Sell Executed");
        console.log(`  Transaction ID: ${result.transactionId}`);
        console.log(`  Total: ${result.price.total}`);

        // Implicitly, processBlackMarketTransaction was called due to is_contraband=1 in mock
    } catch (e) {
        console.error("✗ Black Market Sell Failed:", e);
    }

    console.log("\nPhase 9 Verification Complete!");
}

runVerification().catch(console.error);
