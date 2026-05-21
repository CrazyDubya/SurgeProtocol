
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_DATA_DIR = path.join(__dirname, '..', 'seed_data');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function readJsonFiles(subdir: string): any[] {
    const dirPath = path.join(SEED_DATA_DIR, subdir);
    if (!fs.existsSync(dirPath)) {
        return [];
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
    const results: any[] = [];

    for (const file of files) {
        const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
        try {
            const json = JSON.parse(content);
            results.push(json);
        } catch (e) {
            console.error(`Error parsing ${subdir}/${file}:`, e);
        }
    }
    return results;
}

function generateUUID(): string {
    return crypto.randomUUID();
}

function escapeSql(str: string): string {
    return str.replace(/'/g, "''");
}

// =============================================================================
// SQL GENERATOR
// =============================================================================

class SqlGenerator {
    statements: string[] = [];

    add(sql: string, params: (string | number | boolean | null | undefined)[]) {
        let formattedSql = sql;
        for (const param of params) {
            let valStr = 'NULL';
            if (param !== null && param !== undefined) {
                if (typeof param === 'string') {
                    valStr = `'${escapeSql(param)}'`;
                } else if (typeof param === 'boolean') {
                    valStr = param ? '1' : '0';
                } else {
                    valStr = String(param);
                }
            }
            formattedSql = formattedSql.replace('?', valStr);
        }
        this.statements.push(formattedSql + ';');
    }

    writeToFile(filepath: string) {
        fs.writeFileSync(filepath, this.statements.join('\n'));
        console.log(`Generated SQL seed file at: ${filepath} (${this.statements.length} statements)`);
    }
}

// =============================================================================
// SEEDERS
// =============================================================================

async function seedFactions(sql: SqlGenerator) {
    const factionsPath = path.join(SEED_DATA_DIR, 'factions.json');
    if (!fs.existsSync(factionsPath)) {
        console.warn('Warning: factions.json not found');
        return;
    }

    try {
        const content = fs.readFileSync(factionsPath, 'utf-8');
        const data = JSON.parse(content);

        console.log(`Processing ${data.factions?.length || 0} factions...`);

        if (data.factions) {
            for (const faction of data.factions) {
                sql.add(`
                    INSERT OR REPLACE INTO factions (
                        id, code, name, description, faction_type,
                        headquarters_location_id,
                        created_at, updated_at
                    ) VALUES (
                        ?, ?, ?, ?, ?,
                        (SELECT id FROM locations WHERE name LIKE ? LIMIT 1),
                        datetime('now'), datetime('now')
                    )
                `, [
                    generateUUID(), faction.code, faction.name, faction.description, faction.faction_type,
                    `%${faction.headquarters}%`
                ]);
            }
        }
    } catch (e) {
        console.error('Error seeding factions:', e);
    }
}

async function seedLocations(sql: SqlGenerator) {
    const files = readJsonFiles('locations');
    console.log(`Processing ${files.length} location files...`);

    for (const fileData of files) {
        if (!fileData.districts) continue;

        for (const district of fileData.districts) {
            const districtId = generateUUID();

            // 1. Insert District
            sql.add(`
                INSERT OR IGNORE INTO locations (
                    id, code, name, location_type, description, 
                    surveillance_level, ambient_population,
                    current_owner_faction_id, created_at, updated_at
                ) SELECT 
                    ?, ?, ?, 'DISTRICT', ?,
                    ?, ?,
                    (SELECT id FROM factions WHERE code = ?), datetime('now'), datetime('now')
                WHERE TRUE
            `, [
                districtId, district.code, district.name, district.description,
                district.surveillance_level, district.population || 0,
                district.controlling_factions?.[0] || null
            ]);

            // 2. Insert Key Locations
            if (district.key_locations) {
                for (const loc of district.key_locations) {
                    sql.add(`
                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            ?, (SELECT id FROM locations WHERE code = ?), ?, ?, datetime('now'), datetime('now')
                        )
                    `, [generateUUID(), district.code, loc.name, 'POI']);
                }
            }
        }
    }
}

async function seedNPCs(sql: SqlGenerator) {
    const files = readJsonFiles('npcs');
    console.log(`Processing ${files.length} NPC files...`);

    for (const fileData of files) {
        const npc = fileData.npc;
        if (!npc) continue;

        sql.add(`
            INSERT OR REPLACE INTO npc_definitions (
                id, code, name, description,
                faction_id,
                home_location_id, 
                is_vendor, is_quest_giver, killable_by_player,
                created_at, updated_at
            ) SELECT 
                ?, ?, ?, ?,
                (SELECT id FROM factions WHERE code = ?),
                (SELECT id FROM locations WHERE name LIKE ? LIMIT 1),
                ?, ?, ?,
                datetime('now'), datetime('now')
            WHERE TRUE
        `, [
            generateUUID(), npc.code, npc.name, npc.physical_description?.appearance || '',
            npc.faction,
            `%${npc.location}%`, // Fuzzy match location name
            npc.is_merchant, npc.is_quest_giver, npc.can_die
        ]);
    }
}

async function seedDrones(sql: SqlGenerator) {
    const files = readJsonFiles('drones');
    console.log(`Processing ${files.length} drone files...`);

    for (const fileData of files) {
        if (!fileData.drones) continue;

        for (const drone of fileData.drones) {
            sql.add(`
                INSERT OR REPLACE INTO drone_definitions (
                    id, code, name, manufacturer, description,
                    drone_class, drone_role, size_category, rarity,
                    max_speed_kmh, acceleration, maneuverability, max_altitude_m,
                    max_hull_points, battery_capacity_minutes,
                    required_tier,
                    created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?,
                    ?,
                    datetime('now'), datetime('now')
                )
            `, [
                generateUUID(), drone.code, drone.name, drone.manufacturer, drone.description,
                drone.drone_class, drone.drone_role, drone.size_category, drone.rarity,
                drone.stats?.max_speed_kmh, drone.stats?.acceleration, drone.stats?.maneuverability, drone.stats?.max_altitude_m,
                drone.stats?.max_hull_points, drone.stats?.battery_capacity_minutes,
                drone.requirements?.tier || 1
            ]);
        }
    }
}

async function seedItems(sql: SqlGenerator) {
    const weaponFiles = readJsonFiles('items');
    console.log(`Processing ${weaponFiles.length} item files...`);

    for (const fileData of weaponFiles) {
        // WEAPONS
        if (fileData.weapons) {
            for (const entry of fileData.weapons) {
                const item = entry.item;
                const weapon = entry.weapon;
                const itemId = generateUUID();

                sql.add(`
                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?,
                        ?, ?, datetime('now')
                    )
                `, [
                    itemId, item.code, item.name, item.description, 'WEAPON',
                    item.rarity, item.quality_tier, item.base_price, item.weight_kg,
                    item.manufacturer, item.is_illegal || false
                ]);

                if (weapon) {
                    sql.add(`
                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            ?, ?, ?, ?, ?,
                            ?, ?,
                            datetime('now')
                        )
                    `, [
                        generateUUID(), itemId, weapon.weapon_class, weapon.weapon_type, weapon.damage_type,
                        weapon.is_melee || false, weapon.is_ranged || false
                    ]);
                }
            }
        }

        // CONSUMABLES
        if (fileData.consumables) {
            for (const item of fileData.consumables) {
                const itemId = generateUUID();

                sql.add(`
                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?,
                        ?, ?, ?, 1, datetime('now')
                    )
                `, [
                    itemId, item.code, item.name, item.description, 'CONSUMABLE',
                    item.rarity, item.quality_tier, item.base_price, item.weight_kg,
                    item.manufacturer, item.is_illegal || false, item.stack_size || 1
                ]);

                if (item.effects) {
                    sql.add(`
                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            ?, ?, ?,
                            ?,
                            datetime('now')
                        )
                    `, [
                        generateUUID(), itemId, item.item_subtype || 'GENERIC',
                        JSON.stringify(item.effects)
                    ]);
                }
            }
        }
    }
}

async function seedMissions(sql: SqlGenerator) {
    const files = readJsonFiles('missions');
    console.log(`Processing ${files.length} mission files...`);

    for (const fileData of files) {
        if (!fileData.missions) continue;

        for (const mission of fileData.missions) {
            const clientMatch = mission.client?.id ? `%${mission.client.id}%` : '%';

            // Map Mission Types
            let mType = mission.type;
            if (mType === 'DELIVERY') mType = 'DELIVERY_STANDARD';

            sql.add(`
                INSERT OR REPLACE INTO mission_definitions (
                    id, code, name, description, mission_type,
                    source_npc_id, tier_requirement,
                    is_repeatable,
                    created_at, updated_at
                ) SELECT 
                    ?, ?, ?, ?, ?,
                    (SELECT id FROM npc_definitions WHERE code LIKE ? OR code = ? LIMIT 1), ?,
                    ?,
                    datetime('now'), datetime('now')
                WHERE TRUE
            `, [
                generateUUID(), mission.code, mission.name, mission.description, mType,
                clientMatch, mission.client?.id || '', mission.tier,
                mission.metadata?.isRepeatable ? 1 : 0
            ]);
        }
    }
}


async function seedVehicles(sql: SqlGenerator) {
    const files = readJsonFiles('vehicles');
    console.log(`Processing ${files.length} vehicle files...`);

    for (const fileData of files) {
        if (!fileData.vehicles) continue;

        for (const vehicle of fileData.vehicles) {
            sql.add(`
                INSERT OR REPLACE INTO vehicle_definitions (
                    id, code, name, manufacturer, description,
                    vehicle_class, vehicle_type, base_price,
                    max_hull_points, fuel_capacity, cargo_capacity_kg,
                    top_speed_kmh, handling_rating,
                    created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?,
                    ?, ?,
                    datetime('now'), datetime('now')
                )
            `, [
                generateUUID(), vehicle.code, vehicle.name, vehicle.manufacturer, vehicle.description,
                vehicle.vehicle_class, vehicle.vehicle_type, vehicle.base_price,
                vehicle.max_hull_points, vehicle.fuel_capacity, vehicle.cargo_capacity_kg,
                vehicle.top_speed_kmh, vehicle.handling_rating
            ]);
        }
    }
}

async function main() {
    console.log('Generating Universal Seed SQL...');
    const sql = new SqlGenerator();

    sql.add('PRAGMA foreign_keys = OFF', []);
    sql.add('BEGIN TRANSACTION', []);

    // Validate Enums and Add Missing Values
    sql.add("INSERT OR IGNORE INTO enum_location_type (value) VALUES ('POI')", []);
    sql.add("INSERT OR IGNORE INTO enum_mission_type (value) VALUES ('RACE'), ('INTERACTION')", []);
    sql.add("INSERT OR IGNORE INTO enum_faction_type (value) VALUES ('RESISTANCE'), ('UNDERGROUND'), ('HACKTIVISTS'), ('TRANSCENDENT'), ('PROFESSIONAL')", []);
    sql.add("INSERT OR IGNORE INTO enum_vehicle_class (value) VALUES ('SCOOTER'), ('BIKE'), ('VAN'), ('CAR'), ('TRUCK'), ('SUV'), ('QUADCOPTER')", []);

    // Seeding Order: Factions -> Locations -> NPCs -> Others
    // Note: Factions and Locations have circular dependency (HQ vs Owner). 
    // Inserting Factions first (with HQ lookup) works if location exists. 
    // Inserting Locations first (with Owner lookup) works if faction exists.
    // If neither exists, NULL is inserted (allowed).
    // The script does both.

    await seedFactions(sql);
    await seedLocations(sql);
    await seedDrones(sql);
    await seedVehicles(sql);
    await seedNPCs(sql);
    await seedItems(sql);
    await seedMissions(sql);

    sql.add('COMMIT', []);
    sql.add('PRAGMA foreign_keys = ON', []);

    const outPath = path.join(__dirname, '..', 'migrations', 'seed_universal.sql');
    sql.writeToFile(outPath);
}

main().catch(console.error);
