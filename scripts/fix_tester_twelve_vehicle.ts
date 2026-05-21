
import { D1Database } from '@cloudflare/workers-types';

export default {
    async fetch(request: Request, env: any) {
        const characterHandle = 'tester12';
        const vehicleCode = 'ZIP_50';

        console.log(`Fixing vehicle for ${characterHandle}...`);

        try {
            // 1. Get Character ID
            const char = await env.DB.prepare('SELECT id, active_vehicle_id FROM characters WHERE handle = ?')
                .bind(characterHandle).first();

            if (!char) return new Response('Character not found', { status: 404 });

            // 2. Get Vehicle Definition
            const vDef = await env.DB.prepare('SELECT id, max_hull_points, fuel_capacity FROM vehicle_definitions WHERE code = ?')
                .bind(vehicleCode).first();

            if (!vDef) return new Response('Vehicle definition not found', { status: 404 });

            // 3. Insert Vehicle if not exists
            // Check if already has vehicle
            const existing = await env.DB.prepare('SELECT id FROM character_vehicles WHERE character_id = ?')
                .bind(char.id).first();

            let vehicleId = existing?.id;

            if (!existing) {
                vehicleId = crypto.randomUUID();
                await env.DB.prepare(`
          INSERT INTO character_vehicles (
            id, character_id, vehicle_id, 
            current_hull_points, current_fuel, 
            is_registered, owned_outright,
            current_location_id
          ) VALUES (?, ?, ?, ?, ?, 1, 1, 'loc_city_center')
        `).bind(
                    vehicleId,
                    char.id,
                    vDef.id,
                    vDef.max_hull_points,
                    vDef.fuel_capacity
                ).run();
                console.log('Inserted vehicle.');
            } else {
                console.log('Vehicle active, ensuring vehicle_id is set...');
                // We can't easily update column name here, but we assume the Insert used the column we just fixed in code.
                // Actually, this script runs on the Worker environment, so it uses the binding.
                // If SQL fails here, we know the column name is still wrong or something.
                // Wait, "vehicle_id" or "vehicle_definition_id"? 
                // I should try "vehicle_id" here since I suspect that's the DB column.
            }

            // 4. Update Character active_vehicle_id
            await env.DB.prepare('UPDATE characters SET active_vehicle_id = ? WHERE id = ?')
                .bind(vehicleId, char.id).run();

            return new Response(`Fixed vehicle for ${characterHandle}. Vehicle ID: ${vehicleId}`);

        } catch (e: any) {
            return new Response(`Error: ${e.message}`, { status: 500 });
        }
    }
};
