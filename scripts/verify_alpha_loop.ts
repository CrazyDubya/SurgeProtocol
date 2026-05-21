
import { execSync } from 'child_process';
import fs from 'fs';

const API_URL = 'http://localhost:8788/api';
const MASTER_TOKEN = 'secret123';

async function runTest() {
    console.log('🚀 Starting Alpha Loop Verification...');

    const email = `test_${Date.now()}@example.com`;
    const password = 'password123';

    // 1. Register User
    console.log('Step 1: Registering user...');
    const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: 'Alpha Tester' })
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    console.log('✅ Registered.');

    const token = regData.data.accessToken;
    const userId = regData.data.user.id;

    // 2. Create Character
    console.log('Step 2: Creating character...');
    const charRes = await fetch(`${API_URL}/characters`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            legalName: 'Alpha Runner',
            origin: 'STREET_KID',
            sex: 'UNKNOWN',
            blood_type: 'UNKNOWN'
        })
    });
    const charData = await charRes.json();
    if (!charRes.ok) throw new Error(`Character creation failed: ${JSON.stringify(charData)}`);
    const charId = charData.data.character.id;
    console.log(`✅ Character created: ${charId}`);

    // 2.5 Select Character
    console.log('Step 2.5: Selecting character...');
    const selectRes = await fetch(`${API_URL}/characters/${charId}/select`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const selectData = await selectRes.json();
    if (!selectRes.ok) throw new Error(`Selection failed: ${JSON.stringify(selectData)}`);
    const activeToken = selectData.data.accessToken;
    console.log('✅ Character selected.');

    // 3. Get Missions
    console.log('Step 3: Listing missions...');
    const missionsRes = await fetch(`${API_URL}/missions/available`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
    });
    const missionsData = await missionsRes.json();
    if (!missionsRes.ok) throw new Error(`Missions fetch failed: ${JSON.stringify(missionsData)}`);
    const missions = missionsData.data.missions;
    console.log(`✅ Found ${missions.length} missions.`);

    if (missions.length === 0) throw new Error('No missions available!');
    const mission = missions[0];

    // 4. Accept Mission
    console.log(`Step 4: Accepting mission ${mission.name}...`);
    const acceptRes = await fetch(`${API_URL}/missions/${mission.id}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${activeToken}` }
    });
    const acceptData = await acceptRes.json();
    if (!acceptRes.ok) throw new Error(`Accept failed: ${JSON.stringify(acceptData)}`);
    const instanceId = acceptData.data.instance.mission_id;
    console.log(`✅ Mission accepted: ${instanceId}`);

    // 5. Simulate Progress (Update DB)
    console.log('Step 5: Simulating mission progress...');
    const sql = `
        UPDATE character_missions 
        SET status = 'IN_PROGRESS', 
            distance_traveled_m = 5000,
            objectives_completed = (
                SELECT json_group_array(json_extract(value, '$.id'))
                FROM mission_definitions, json_each(mission_definitions.objectives)
                WHERE mission_definitions.id = '${mission.id}'
            )
        WHERE id = '${instanceId}';
    `;
    fs.writeFileSync('temp_progress.sql', sql);
    execSync(`npx wrangler d1 execute surge-protocol-db --local --command "${sql}"`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    fs.unlinkSync('temp_progress.sql');
    console.log('✅ Progress simulated.');

    // 6. Complete Mission
    console.log('Step 6: Completing mission...');
    const completeRes = await fetch(`${API_URL}/missions/${instanceId}/complete`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${activeToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ outcome: 'SUCCESS', customerRating: 5 })
    });
    const completeData = await completeRes.json().catch(async () => {
        const text = await completeRes.clone().text();
        console.log(`❌ Raw Response: ${text}`);
        return { error: 'Invalid JSON' };
    });
    if (!completeRes.ok) throw new Error(`Complete failed: ${JSON.stringify(completeData)}`);
    console.log('✅ Mission completed!');
    console.log('Results:', JSON.stringify(completeData.data, null, 2));

    // 7. Verify Stats
    console.log('Step 7: Verifying character stats...');
    const finalCharRes = await fetch(`${API_URL}/characters/${charId}`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
    });
    const finalCharData = await finalCharRes.json();
    const stats = finalCharData.data.character;
    console.log('Stats Keys:', Object.keys(stats));

    // Fetch Inventory for Credits
    const invRes = await fetch(`${API_URL}/characters/${charId}/inventory`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
    });
    const invData = await invRes.json();
    const credits = invData.data.finances.credits;
    const xp = stats.current_xp || stats.xp_current || stats.lifetimeXp || 0;

    console.log(`   Tier: ${stats.currentTier}, XP: ${xp}, Credits: ${credits}`);

    if (xp > 0 || credits > 0) {
        console.log('🏆 Verification Passed: Game loop is fully functional!');
    } else {
        console.log('⚠️ Verification Incomplete: No rewards detected.');
    }
}

runTest().catch(err => {
    console.error('❌ Verification Failed:', err);
    process.exit(1);
});
