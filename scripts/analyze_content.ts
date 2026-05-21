
import { D1Database } from '@cloudflare/workers-types';
// import { createClient } from '@libsql/client'; // Removed dependency
// import Table from 'cli-table3'; // Removed dependency

// Mock D1 for local execution via better-sqlite3 or just use logic to process json if I could but here we need DB access.
// Since we are running via `wrangler d1 execute`, we can just output SQL logic or use a script that queries.
// Actually, `wrangler d1 execute` output is JSON.
// So this script will be a wrapper that runs wrangler commands and formats output.

import { execSync } from 'child_process';

function runQuery(query: string): any {
    try {
        const cmd = `npx wrangler d1 execute surge-protocol-db --local --command "${query.replace(/"/g, '\\"')}"`;
        const output = execSync(cmd, { encoding: 'utf-8' });
        // Wrangler output is a bit messy, but usually contains JSON array at the end if we parse carefully or use --json (if supported? checking... wrangler d1 execute doesn't always support pure json output easily).
        // Actually, the output format is human readable table unless we parse the result array.
        // Let's assume the previous output format.
        // [
        //   {
        //     "results": [ ... ],
        //     "success": true,
        //     ...
        //   }
        // ]
        // We need to find the JSON array in the output.
        const jsonStart = output.indexOf('[');
        if (jsonStart === -1) return null;
        const jsonStr = output.slice(jsonStart);
        return JSON.parse(jsonStr)[0].results;
    } catch (e) {
        console.error('Error executing query:', e);
        return [];
    }
}

async function main() {
    console.log('--- Surge Protocol Content Analysis ---');

    // 1. Counts
    const counts = runQuery(`
    SELECT 'Regions' as type, COUNT(*) as count FROM regions
    UNION ALL SELECT 'Locations', COUNT(*) FROM locations
    UNION ALL SELECT 'Districts', COUNT(*) FROM locations WHERE location_type = 'DISTRICT'
    UNION ALL SELECT 'NPCs', COUNT(*) FROM npc_definitions
    UNION ALL SELECT 'Factions', COUNT(*) FROM factions
    UNION ALL SELECT 'Items', COUNT(*) FROM item_definitions
    UNION ALL SELECT 'Missions', COUNT(*) FROM mission_definitions
    UNION ALL SELECT 'Dialogue Trees', COUNT(*) FROM dialogue_trees
    UNION ALL SELECT 'Dialogue Nodes', COUNT(*) FROM dialogue_nodes
  `);

    console.log('Content Type       | Count');
    console.log('-------------------|-----');
    if (Array.isArray(counts)) {
        counts.forEach((row: any) => {
            console.log(`${row.type.padEnd(19)}| ${row.count}`);
        });
    } else {
        console.log('Error retrieving counts.');
    }

    // 2. Map Hierarchy
    console.log('\n--- World Map Hierarchy ---');
    const districts = runQuery(`SELECT id, name FROM locations WHERE location_type = 'DISTRICT' ORDER BY name`);

    for (const district of districts) {
        console.log(`\n📍 ${district.name} (District)`);
        const pois = runQuery(`SELECT name, description FROM locations WHERE parent_location_id = '${district.id}' ORDER BY name`);
        if (pois.length === 0) {
            console.log('   (No POIs)');
        } else {
            pois.forEach((poi: any) => {
                console.log(`   - ${poi.name}`);
            });
        }
    }

    // 3. Dialogue Stats (if any)
    console.log('\n--- Narrative Content ---');
    const dialogueCount = counts.find((c: any) => c.type === 'Dialogue Trees')?.count || 0;
    if (dialogueCount === 0) {
        console.log('⚠️  No narrative content (dialogue trees) found in database.');
        console.log('   Run a narrative seeder to populate story content.');
    } else {
        console.log(`✅  ${dialogueCount} Dialogue Trees found.`);
    }
}

main();
