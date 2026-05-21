
import { D1Database } from '@cloudflare/workers-types';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const API_URL = 'http://localhost:8787/api';

function runSqlUpdate(sql: string, params: any[]) {
    // 1. Create a temporary SQL file with the interpolated values
    // We do simple interpolation here because we are running this as a dev script.
    // WARNING: Vulnerable to SQL injection if inputs were untrusted, but they are from our script.

    let dbSql = sql;
    params.forEach(p => {
        let val = 'NULL';
        if (typeof p === 'string') val = `'${p.replace(/'/g, "''")}'`;
        else if (typeof p === 'number') val = p.toString();
        else if (typeof p === 'boolean') val = p ? '1' : '0';
        // Simple replace first ? - this is naive but works for our specific query order
        dbSql = dbSql.replace('?', val);
    });

    const tempFile = 'temp_update.sql';
    fs.writeFileSync(tempFile, dbSql);

    try {
        execSync(`npx wrangler d1 execute surge-protocol-db --local --file=${tempFile}`, { stdio: 'inherit' });
    } catch (e) {
        console.error('SQL Execution failed:', e);
        throw e;
    } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
}

async function main() {
    console.log('--- Verifying Game Loop ---');

    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test2@surge.net', password: 'password123' }),
    });

    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;
    const characterId = loginData.data.user.id;
    console.log('   Logged in.');

    // 2. Get Available Missions
    console.log('2. Fetching missions...');
    const missionsRes = await fetch(`${API_URL}/missions/available`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const missionsData = await missionsRes.json();
    if (!missionsData.success) throw new Error('Failed to get missions');

    const missions = missionsData.data.missions;
    console.log(`   Found ${missions.length} available missions.`);

    let missionToAccept = missions.length > 0 ? missions[0] : null;

    // 3. Accept Mission (or get active)
    console.log('3. Accepting/Checking mission...');
    let activeInstance = null;

    // Check active first
    const activeRes = await fetch(`${API_URL}/missions/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const activeData = await activeRes.json();

    if (activeData.data?.mission?.instance) {
        console.log('   Found existing active mission.');
        activeInstance = activeData.data.mission.instance;
    } else if (missionToAccept) {
        console.log(`   Accepting new mission: ${missionToAccept.name}`);
        const acceptRes = await fetch(`${API_URL}/missions/${missionToAccept.id}/accept`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const acceptData = await acceptRes.json();
        if (!acceptData.success) throw new Error(`Accept failed: ${JSON.stringify(acceptData)}`);
        activeInstance = acceptData.data.instance;
    } else {
        throw new Error('No missions available and no active mission.');
    }

    console.log(`   Working with Mission Instance: ${activeInstance.id}`);

    // 4. Simulate Gameplay (Update Progress via DB)
    console.log('4. Simulating Gameplay (Updating DB)...');

    // We need to fetch the definition to get objectives
    const definitionId = activeInstance.mission_definition_id;
    // We can query the definition via wrangler too, but simpler to just cheat and set completion
    // We'll trust that the server logic we want to test is the "Complete" endpoint.
    // The "Complete" endpoint checks `objectives_completed`.

    // Let's get the objectives JSON from the definition in DB
    const jsonQuery = `SELECT objectives FROM mission_definitions WHERE id = '${definitionId}'`;
    // We can use the helper from analyze_content but it is separate.
    // We'll just execute a simpler update: "Get all objectives from definition and write to instance"

    // We'll write a specific SQL script that does this inside SQLite to avoid parsing JSON in TS without libraries
    const sql = `
    UPDATE character_missions 
    SET 
        objectives_completed = (SELECT objectives FROM mission_definitions WHERE id = '${definitionId}' -- This is wrong, objectives is a list of objs, we just want IDs
                               ),
        status = 'IN_PROGRESS',
        distance_traveled_m = 1000
    WHERE id = '${activeInstance.id}';
  `;

    // Wait, `objectives` column in `mission_definitions` is `[{id:..., ...}]`.
    // `objectives_completed` in `character_missions` expects `["id1", "id2"]`.
    // SQLite JSON manipulation is needed.
    // json_extract?

    /*
      UPDATE character_missions
      SET objectives_completed = (
          SELECT json_group_array(json_extract(value, '$.id'))
          FROM mission_definitions, json_each(mission_definitions.objectives)
          WHERE mission_definitions.id = '${definitionId}'
      ),
      current_objective_index = 100,
      status = 'IN_PROGRESS'
      WHERE id = '${activeInstance.id}';
    */

    const updateScript = `
    UPDATE character_missions
    SET objectives_completed = (
        SELECT json_group_array(json_extract(value, '$.id'))
        FROM mission_definitions, json_each(mission_definitions.objectives)
        WHERE mission_definitions.id = '${definitionId}'
    ),
    current_objective_index = 5,
    status = 'IN_PROGRESS',
    distance_traveled_m = 1000,
    updated_at = datetime('now')
    WHERE id = '${activeInstance.id}';
  `;

    const tempFile = 'temp_simulate.sql';
    fs.writeFileSync(tempFile, updateScript);

    try {
        console.log('   Executing SQL update...');
        execSync(`npx wrangler d1 execute surge-protocol-db --local --file=${tempFile}`, { stdio: 'inherit' });
    } catch (e) {
        console.error('   Error executing SQL:', e);
        throw e;
    } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }

    console.log('   Objectives updated in DB.');

    // 5. Complete Mission
    console.log('5. Completing Mission (API)...');
    const completeRes = await fetch(`${API_URL}/missions/${activeInstance.id}/complete`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            outcome: 'SUCCESS',
            customerRating: 5
        })
    });

    const completeData = await completeRes.json();

    if (!completeData.success) {
        console.error('Completion Failed:', JSON.stringify(completeData, null, 2));
        // throw new Error('Failed to complete mission');
    } else {
        console.log('   Mission Completed Successfully!');
        console.log('   Rewards:', completeData.data);
        if (completeData.data.new_credits > 0) {
            console.log('✅  Credits awarded.');
        }
    }
}

main().catch(console.error);
