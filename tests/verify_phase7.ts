
import { VehicleService } from '../src/services/vehicle';
import { WorldService } from '../src/services/world';
import type { ServiceContext } from '../src/services/base';

// Mock DB interactions since we can't easily connect to D1 in this script without miniflare setup
const mockDb = {
    prepare: (query: string) => {
        console.log(`[DB] Preparing: ${query.substring(0, 50)}...`);
        return {
            bind: (...args: any[]) => {
                console.log(`[DB] Binding: ${JSON.stringify(args)}`);
                return {
                    first: async () => {
                        if (query.includes('vehicle_definitions WHERE id')) return { id: 'veh_1', base_price: 1000, name: 'Test Car' };
                        if (query.includes('character_finances')) return { credits: 2000 };
                        if (query.includes('locations WHERE id')) return { id: 'loc_1', name: 'Test Loc' };
                        if (query.includes('routes')) return { id: 'route_1', distance_km: 10 };
                        return null;
                    },
                    all: async () => {
                        if (query.includes('regions')) return { results: [{ id: 'reg_1', name: 'Downtown' }] };
                        if (query.includes('locations')) return { results: [{ id: 'loc_1', name: 'Test Loc' }] };
                        return { results: [] };
                    },
                    run: async () => ({ success: true })
                };
            },
            // Handle case where bind is NOT called (BaseService might check arguments length)
            first: async () => null,
            all: async () => ({ results: [] })
        };
    }
};

const mockContext: ServiceContext = {
    db: mockDb as any,
    cache: undefined
};

async function verify() {
    console.log('--- Verifying Phase 7 Services ---');

    // 1. Vehicle Service
    console.log('\n[VehicleService]');
    const vehicleService = new VehicleService(mockContext);

    console.log('Test: Purchase Vehicle');
    const purchaseResult = await vehicleService.purchaseVehicle('char_1', 'veh_1');
    console.log('Purchase Result:', purchaseResult);

    if (purchaseResult.success) console.log('✅ Purchase Successful');
    else console.error('❌ Purchase Failed');

    // 2. World Service
    console.log('\n[WorldService]');
    const worldService = new WorldService(mockContext);

    console.log('Test: Get Regions');
    const regions = await worldService.getRegions();
    console.log('Regions:', regions);
    if (regions.length > 0) console.log('✅ Get Regions Successful');

    console.log('Test: Calculate Route');
    const route = await worldService.calculateRoute('loc_A', 'loc_B');
    console.log('Route:', route);
    if (route) console.log('✅ Calculate Route Successful');
    else console.log('⚠️ No Route Found (Expected with mock if not set)'); // Mock returns route_1 

    console.log('\n--- Verification Complete ---');
}

verify().catch(console.error);
