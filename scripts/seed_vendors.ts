
import fs from 'fs';
import { execSync } from 'child_process';
import crypto from 'crypto';

function generateUUID() {
    return crypto.randomUUID();
}

function escapeSql(str: string) {
    return str.replace(/'/g, "''");
}

async function main() {
    console.log('--- Seeding Vendors ---');

    // 1. Get all Vendors
    console.log('Fetching vendors...');
    const vendorsJson = execSync(`npx wrangler d1 execute surge-protocol-db --local --json --command="SELECT * FROM npc_definitions WHERE is_vendor = 1"`).toString();
    const vendors = JSON.parse(vendorsJson)[0].results;

    console.log(`Found ${vendors.length} vendors.`);

    const sqlStatements: string[] = [];

    // Begin Transaction
    sqlStatements.push('BEGIN TRANSACTION;');

    for (const vendor of vendors) {
        let needsInventory = true;

        if (vendor.vendor_inventory_id) {
            // Check if inventory actually exists
            const checkInv = execSync(`npx wrangler d1 execute surge-protocol-db --local --json --command="SELECT id FROM vendor_inventories WHERE id = '${vendor.vendor_inventory_id}'"`).toString();
            const invResult = JSON.parse(checkInv)[0].results;
            if (invResult.length > 0) {
                console.log(`Skipping ${vendor.name} (already has VALID inventory)`);
                needsInventory = false;
            } else {
                console.log(`Fixing ${vendor.name} (has ID but missing inventory row)`);
            }
        }

        if (!needsInventory) continue;

        const inventoryId = vendor.vendor_inventory_id || generateUUID();
        console.log(`Generating inventory for ${vendor.name} (${inventoryId})`);

        // Create specific inventory based on NPC type/name
        let vendorType = 'GENERAL';
        let baseInventory = [];

        if (vendor.npc_category === 'WEAPON' || vendor.name.includes('Arms') || vendor.name.includes('Gun')) {
            vendorType = 'WEAPONS';
            baseInventory = [
                { item_id: 'sample-pistol', price: 500, stock: 5 },
                { item_id: 'ammo-9mm', price: 2, stock: 100 }
            ];
        } else if (vendor.npc_category === 'MEDICAL' || vendor.name.includes('Doc') || vendor.name.includes('Clinic')) {
            vendorType = 'MEDICAL';
            baseInventory = [
                { item_id: 'medkit-basic', price: 100, stock: 10 },
                { item_id: 'stimpack', price: 50, stock: 20 }
            ];
        } else {
            baseInventory = [
                { item_id: 'rations', price: 5, stock: 50 },
                { item_id: 'water', price: 2, stock: 50 }
            ];
        }

        // Insert Inventory
        // Schema: id, vendor_npc_id, location_id, vendor_type, base_inventory, rotating_inventory...
        sqlStatements.push(`
            INSERT INTO vendor_inventories (
                id, vendor_npc_id, location_id, vendor_type, 
                base_inventory, rotating_inventory, 
                created_at, updated_at
            ) VALUES (
                '${inventoryId}',
                '${vendor.id}',
                ${vendor.home_location_id ? `'${vendor.home_location_id}'` : 'NULL'},
                '${vendorType}',
                '${JSON.stringify(baseInventory)}',
                '[]',
                datetime('now'), datetime('now')
            );
        `);

        // Update NPC
        sqlStatements.push(`
            UPDATE npc_definitions 
            SET vendor_inventory_id = '${inventoryId}'
            WHERE id = '${vendor.id}';
        `);
    }

    sqlStatements.push('COMMIT;');

    if (sqlStatements.length > 2) {
        const sqlFile = 'temp_seed_vendors.sql';
        fs.writeFileSync(sqlFile, sqlStatements.join('\n'));

        console.log('Executing SQL...');
        execSync(`npx wrangler d1 execute surge-protocol-db --local --file=${sqlFile}`, { stdio: 'inherit' });
        fs.unlinkSync(sqlFile);
        console.log('Done.');
    } else {
        console.log('No updates needed.');
    }
}

main().catch(console.error);
