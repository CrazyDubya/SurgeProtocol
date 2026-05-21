
const API_URL = 'http://localhost:8788';

async function main() {
    console.log('--- Giving Starter Vehicle ---');

    // 1. Login
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'test2@surge.net', password: 'password123' }),
        headers: { 'Content-Type': 'application/json' }
    });

    const loginData = await loginRes.json() as any;
    if (!loginData.success) {
        console.error('Login failed:', loginData);
        return;
    }
    const token = loginData.data.accessToken;
    const characterId = loginData.data.user.id; // Wait, user ID or character ID?
    // Login returns user object. We need character ID.

    // Login response: data: { user: {...}, accessToken: ... }
    // It doesn't seem to return character ID at top level in my previous log, but let's check.
    // Actually, I can get it from /api/auth/me or it might be in the token payload (but I don't want to decode JWT manually here).
    // Let's use /api/auth/me

    const meRes = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await meRes.json() as any;
    const charId = meData.data.character?.id;

    if (!charId) {
        console.error('No active character found for user.');
        return;
    }
    console.log(`Character ID: ${charId}`);

    // 2. Get a cheap vehicle definition (Scooter)
    const scootsDefId = 'ac14b9ad-168a-42fa-912f-98660cceeea7'; // From seed_vehicles_only.sql

    // 3. Purchase Vehicle? 
    // API endpoint: POST /api/vehicles/purchase
    // Body: { vehicleDefinitionId: string, colorPrimary: string, colorSecondary: string }
    // Requirements: Credits.

    // If character has no credits, purchase will fail.
    // CHECK CREDITS FIRST?
    // Or just try to force it via SQL since this is a debug script.
    // SQL is safer to guarantee success without grinding.

    console.log('Giving vehicle via SQL directly to bypass credit requirements...');

    // We'll output the SQL command to run, or try to run it if we had a way (we don't have direct DB access in this script easily without binding).
    // Actually, I can use `wrangler d1 execute` from the shell.

    const vehicleId = `veh-${Date.now()}`;
    const sql = `INSERT INTO character_vehicles (id, character_id, vehicle_definition_id, custom_name, current_hull_points, current_fuel, is_active, acquired_at) VALUES ('${vehicleId}', '${charId}', '${scootsDefId}', 'Debug Scooter', 50, 40, 1, datetime('now')); UPDATE characters SET active_vehicle_id = '${vehicleId}' WHERE id = '${charId}';`;

    console.log(`\nRun this command to give vehicle:\n`);
    console.log(`npx wrangler d1 execute surge-protocol-db --local --command "${sql}"`);
}

main().catch(console.error);
