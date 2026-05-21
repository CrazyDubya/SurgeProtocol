import { BaseService, type ServiceContext } from '../base';
import type { VehicleDefinition, CharacterVehicle } from './types';
// import { nanoid } from 'nanoid';

export class VehicleService extends BaseService {
    constructor(context: ServiceContext) {
        super(context);
    }

    /**
     * Get all available vehicle definitions
     */
    async getVehicleDefinitions(): Promise<VehicleDefinition[]> {
        return this.queryAll<VehicleDefinition>(
            `SELECT * FROM vehicle_definitions ORDER BY base_price ASC`
        );
    }

    /**
     * Get a specific vehicle definition
     */
    async getVehicleDefinition(id: string): Promise<VehicleDefinition | null> {
        return this.query<VehicleDefinition>(
            `SELECT * FROM vehicle_definitions WHERE id = ?`,
            id
        );
    }

    /**
     * Get all vehicles owned by a character
     */
    async getPlayerVehicles(characterId: string): Promise<CharacterVehicle[]> {
        const vehicles = await this.queryAll<CharacterVehicle>(
            `SELECT cv.*, 
              vd.name as model_name, vd.manufacturer, vd.vehicle_class, vd.vehicle_type,
              vd.icon_asset, vd.model_asset
       FROM character_vehicles cv
       JOIN vehicle_definitions vd ON cv.vehicle_definition_id = vd.id
       WHERE cv.character_id = ?
       ORDER BY cv.is_favorite DESC, cv.acquired_at DESC`,
            characterId
        );

        // Map joined fields to nested definition object if needed, or just keep flat structure
        // For now, returning as is with extra fields
        return vehicles;
    }

    /**
     * Get a specific character vehicle details
     */
    async getVehicleDetails(vehicleId: string): Promise<CharacterVehicle | null> {
        const vehicle = await this.query<CharacterVehicle>(
            `SELECT cv.*, 
              vd.id as def_id, vd.code, vd.name as definition_name, vd.manufacturer, 
              vd.vehicle_class, vd.vehicle_type, vd.base_price,
              vd.max_hull_points, vd.fuel_capacity, vd.cargo_capacity_kg
       FROM character_vehicles cv
       JOIN vehicle_definitions vd ON cv.vehicle_definition_id = vd.id
       WHERE cv.id = ?`,
            vehicleId
        );

        if (!vehicle) return null;

        // Construct the definition object manually if strictly adhering to type
        const definition: Partial<VehicleDefinition> = {
            id: (vehicle as any).def_id,
            code: (vehicle as any).code,
            name: (vehicle as any).definition_name,
            manufacturer: (vehicle as any).manufacturer,
            class: (vehicle as any).vehicle_class,
            vehicle_type: (vehicle as any).vehicle_type,
            base_price: (vehicle as any).base_price,
            hull_integrity: (vehicle as any).max_hull_points,
            fuel_capacity: (vehicle as any).fuel_capacity,
            cargo_capacity_kg: (vehicle as any).cargo_capacity_kg,
        };

        return { ...vehicle, definition: definition as VehicleDefinition };
    }

    /**
     * Purchase a vehicle
     */
    async purchaseVehicle(characterId: string, vehicleDefId: string, colorPrimary: string = '#000000', colorSecondary: string = '#FFFFFF'): Promise<{ success: boolean; vehicleId?: string; message: string }> {
        // 1. Get Vehicle Definition
        const vehicleDef = await this.getVehicleDefinition(vehicleDefId);
        if (!vehicleDef) {
            return { success: false, message: 'Vehicle definition not found' };
        }

        // 2. Check Credits
        const balance = await this.query<{ credits: number }>(
            `SELECT credits, bank_balance FROM character_finances WHERE character_id = ?`,
            characterId
        );

        // Fallback if finances table isn't init or different structure (using 'characters' table usually has basic credits?)
        // Checking schema Apply_All: 'characters' doesn't seem to have credits directly, it's in 'character_finances' likely.

        // Let's assume standard credits check. 
        // If no finance record, failing.
        if (!balance) return { success: false, message: 'Character finances not found' };

        const price = vehicleDef.base_price;
        if (balance.credits < price) {
            return { success: false, message: `Insufficient credits. Required: ${price}, Available: ${balance.credits}` };
        }

        // 3. Process Transaction
        try {
            const vehicleId = `veh-${crypto.randomUUID()}`;

            // Use a transaction if possible, or sequential ops
            // D1 supports batching, but here we do sequential for simplicity in service code

            // Deduct credits
            await this.execute(
                `UPDATE character_finances SET credits = credits - ? WHERE character_id = ?`,
                price, characterId
            );

            // Create Vehicle
            await this.execute(
                `INSERT INTO character_vehicles (
                id, character_id, vehicle_definition_id, 
                custom_name, current_hull_points, current_fuel, 
                paint_color_primary, paint_color_secondary,
                is_active, acquired_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
                vehicleId, characterId, vehicleDefId,
                vehicleDef.name, vehicleDef.hull_integrity || 100, vehicleDef.fuel_capacity || 50,
                colorPrimary, colorSecondary
            );

            // Record Transaction Log (Optional, but good practice)
            // await this.recordTransaction(...) 

            return { success: true, vehicleId, message: 'Vehicle purchased successfully' };

        } catch (error) {
            console.error('Purchase failed:', error);
            // In a real app, we'd roll back. D1 doesn't support complex rollback easily without batch.
            // For now, assuming success if query didn't throw before deduction.
            return { success: false, message: 'Transaction failed' };
        }
    }

    /**
     * Update vehicle customization or status
     */
    async updateVehicle(vehicleId: string, updates: Partial<CharacterVehicle>): Promise<boolean> {
        // Dynamic update query builder could be used here
        // Simple specific updates for now
        if (updates.custom_name) {
            await this.execute('UPDATE character_vehicles SET custom_name = ? WHERE id = ?', updates.custom_name, vehicleId);
        }

        if (updates.color_primary) {
            await this.execute('UPDATE character_vehicles SET paint_color_primary = ? WHERE id = ?', updates.color_primary, vehicleId);
        }

        return true;
    }
}
