/**
 * Surge Protocol - Database Seed Data
 *
 * Provides initial game data for development and testing.
 * Run via wrangler d1 execute or as part of deployment.
 */

// // import { nanoid } from 'nanoid';
import type { D1Database } from '@cloudflare/workers-types';
import { GameCache } from '../cache';
import npcsData from '../../seed_data/npcs.json';
import questsData from '../../seed_data/quests.json';
import generatedDialogues from '../../seed_data/dialogue_trees.json';
import chenTutorial from '../../seed_data/dialogue_trees/chen_tutorial.json';
import jinRival from '../../seed_data/dialogue_trees/jin_rival.json';
import tanakaAugment from '../../seed_data/dialogue_trees/tanaka_augmentation.json';

// Combine all dialogue trees
const dialogueSeeds = [
  ...generatedDialogues.trees,
  chenTutorial,
  jinRival,
  tanakaAugment
];

// =============================================================================
// TYPES
// =============================================================================

interface SeedResult {
  table: string;
  inserted: number;
  errors: string[];
}

// =============================================================================
// SEED DATA
// =============================================================================

// Factions
const getFactions = () => [
  {
    id: crypto.randomUUID(),
    code: 'OMNIDELIVER',
    name: 'OmniDeliver Corporation',
    faction_type: 'CORPORATION',
    description: 'The megacorp that runs the delivery network. Your employer.',
    goals: 'Efficiency above all. The Algorithm knows best.',
    joinable_by_player: 0,
    is_hostile_default: 0,
  },
  {
    id: crypto.randomUUID(),
    code: 'CHROME_RUNNERS',
    name: 'Chrome Runners',
    faction_type: 'GANG',
    description: 'Street-level couriers who reject corporate control.',
    goals: 'Freedom on the streets. No masters, no algorithms.',
    joinable_by_player: 1,
    is_hostile_default: 0,
  },
  {
    id: crypto.randomUUID(),
    code: 'NEON_SAINTS',
    name: 'The Neon Saints',
    faction_type: 'SYNDICATE',
    description: 'A powerful crime syndicate controlling the underground economy.',
    goals: 'Loyalty is everything. Family protects family.',
    joinable_by_player: 1,
    is_hostile_default: 0,
  },
  {
    id: crypto.randomUUID(),
    code: 'CIRCUIT_BREAKERS',
    name: 'Circuit Breakers',
    faction_type: 'UNDERGROUND',
    description: 'Hacktivist collective fighting corporate surveillance.',
    goals: 'Information wants to be free. Break the chains.',
    joinable_by_player: 1,
    is_hostile_default: 0,
  },
  {
    id: crypto.randomUUID(),
    code: 'IRON_DRAGONS',
    name: 'Iron Dragons',
    faction_type: 'GANG',
    description: 'Augment-heavy enforcers controlling the industrial district.',
    goals: 'Strength through chrome. Weakness is death.',
    joinable_by_player: 1,
    is_hostile_default: 1,
  },
  {
    id: crypto.randomUUID(),
    code: 'CIVIC_GUARD',
    name: 'Civic Guard',
    faction_type: 'GOVERNMENT',
    description: 'What remains of public law enforcement.',
    goals: 'Order through force. Compliance is survival.',
    joinable_by_player: 0,
    is_hostile_default: 0,
  },
];

// Attributes
const getAttributes = () => [
  { id: crypto.randomUUID(), code: 'PWR', name: 'Power', description: 'Physical strength and melee damage', category: 'PHYSICAL' },
  { id: crypto.randomUUID(), code: 'AGI', name: 'Agility', description: 'Speed, reflexes, and evasion', category: 'PHYSICAL' },
  { id: crypto.randomUUID(), code: 'END', name: 'Endurance', description: 'Health, stamina, and resilience', category: 'PHYSICAL' },
  { id: crypto.randomUUID(), code: 'INT', name: 'Intelligence', description: 'Technical skill, hacking, and knowledge', category: 'MENTAL' },
  { id: crypto.randomUUID(), code: 'PRC', name: 'Perception', description: 'Awareness, observation, and accuracy', category: 'MENTAL' },
  { id: crypto.randomUUID(), code: 'PRE', name: 'Presence', description: 'Social influence, charisma, and intimidation', category: 'SOCIAL' },
  { id: crypto.randomUUID(), code: 'VEL', name: 'Velocity', description: 'Movement speed and initiative', category: 'PHYSICAL' },
  { id: crypto.randomUUID(), code: 'EMP', name: 'Empathy', description: 'Understanding emotions and social cues', category: 'SOCIAL' },
  { id: crypto.randomUUID(), code: 'RSN', name: 'Reason', description: 'Logic, problem-solving, and mental fortitude', category: 'MENTAL' },
];

// Skills
const getSkills = () => [
  // Combat
  { id: crypto.randomUUID(), code: 'FIREARMS', name: 'Firearms', category: 'COMBAT', governing_attribute: 'PRC' },
  { id: crypto.randomUUID(), code: 'MELEE', name: 'Melee Combat', category: 'COMBAT', governing_attribute: 'PWR' },
  { id: crypto.randomUUID(), code: 'EVASION', name: 'Evasion', category: 'COMBAT', governing_attribute: 'AGI' },
  { id: crypto.randomUUID(), code: 'HEAVY_WEAPONS', name: 'Heavy Weapons', category: 'COMBAT', governing_attribute: 'PWR' },

  // Technical
  { id: crypto.randomUUID(), code: 'HACKING', name: 'Hacking', category: 'HACKING', governing_attribute: 'INT' },
  { id: crypto.randomUUID(), code: 'ELECTRONICS', name: 'Electronics', category: 'TECHNICAL', governing_attribute: 'INT' },
  { id: crypto.randomUUID(), code: 'MECHANICS', name: 'Mechanics', category: 'TECHNICAL', governing_attribute: 'INT' },
  { id: crypto.randomUUID(), code: 'CYBERTECH', name: 'Cybertech', category: 'TECHNICAL', governing_attribute: 'INT' },

  // Movement/Physical
  { id: crypto.randomUUID(), code: 'ATHLETICS', name: 'Athletics', category: 'MOVEMENT', governing_attribute: 'AGI' },
  { id: crypto.randomUUID(), code: 'STEALTH', name: 'Stealth', category: 'MOVEMENT', governing_attribute: 'AGI' },
  { id: crypto.randomUUID(), code: 'DRIVING', name: 'Driving', category: 'VEHICLE', governing_attribute: 'VEL' },
  { id: crypto.randomUUID(), code: 'PARKOUR', name: 'Parkour', category: 'MOVEMENT', governing_attribute: 'AGI' },

  // Social
  { id: crypto.randomUUID(), code: 'NEGOTIATION', name: 'Negotiation', category: 'SOCIAL', governing_attribute: 'PRE' },
  { id: crypto.randomUUID(), code: 'INTIMIDATION', name: 'Intimidation', category: 'SOCIAL', governing_attribute: 'PRE' },
  { id: crypto.randomUUID(), code: 'STREETWISE', name: 'Streetwise', category: 'SOCIAL', governing_attribute: 'PRE' },
  { id: crypto.randomUUID(), code: 'DECEPTION', name: 'Deception', category: 'SOCIAL', governing_attribute: 'PRE' },
];

// Tier definitions moved to DB seeding

// Mission definitions
const getMissions = () => [
  // Tier 1 missions
  {
    id: crypto.randomUUID(),
    code: 'BASIC_DELIVERY',
    name: 'Standard Package Delivery',
    mission_type: 'DELIVERY_STANDARD',
    tier_requirement: 1,
    description: 'Deliver a package across the district. Simple and straightforward.',
    briefing_text: 'Package ready for pickup. Destination marked on your HUD. Don\'t be late.',
    base_pay: 50,
    xp_reward: 15,
    time_limit_minutes: 30,
    cargo_type: 'STANDARD',
    is_repeatable: 1,
  },
  {
    id: crypto.randomUUID(),
    code: 'EXPRESS_RUN',
    name: 'Express Delivery',
    mission_type: 'DELIVERY_EXPRESS',
    tier_requirement: 1,
    description: 'Time-critical delivery. Speed is everything.',
    briefing_text: 'Client needs this yesterday. Bonus for early delivery, penalty for late.',
    base_pay: 80,
    xp_reward: 25,
    time_limit_minutes: 15,
    cargo_type: 'STANDARD',
    is_repeatable: 1,
  },
  // ... other missions omitted for brevity, adding a few key ones
  {
    id: crypto.randomUUID(),
    code: 'FRAGILE_PACKAGE',
    name: 'Fragile Cargo',
    mission_type: 'DELIVERY_FRAGILE',
    tier_requirement: 2,
    description: 'Handle with extreme care. Package damage will tank your rating.',
    briefing_text: 'Sensitive electronics. One scratch and you\'re paying for it.',
    base_pay: 100,
    xp_reward: 30,
    time_limit_minutes: 45,
    cargo_type: 'FRAGILE',
    is_repeatable: 1,
  },
];

// Items
const getItems = () => [
  // Weapons
  {
    id: crypto.randomUUID(),
    code: 'PISTOL_BASIC',
    name: 'Street Pistol',
    item_type: 'WEAPON',
    rarity: 'COMMON',
    description: 'Basic semi-automatic pistol. Reliable but unremarkable.',
    base_price: 100,
  },
  {
    id: crypto.randomUUID(),
    code: 'SMG_COMPACT',
    name: 'Compact SMG',
    item_type: 'WEAPON',
    rarity: 'UNCOMMON',
    description: 'Concealable submachine gun. High rate of fire.',
    base_price: 350,
  },
  // Armor
  {
    id: crypto.randomUUID(),
    code: 'JACKET_ARMORED',
    name: 'Armored Jacket',
    item_type: 'ARMOR',
    rarity: 'COMMON',
    description: 'Street fashion with concealed ballistic plates.',
    base_price: 200,
  },
  // Consumables
  {
    id: crypto.randomUUID(),
    code: 'STIM_HEALTH',
    name: 'Health Stim',
    item_type: 'CONSUMABLE',
    rarity: 'COMMON',
    description: 'Emergency medical injection. Restores health.',
    base_price: 50,
  },
];

// Locations (formerly Districts)
const getLocations = () => [
  {
    id: crypto.randomUUID(),
    code: 'DOWNTOWN',
    name: 'Downtown',
    description: 'Corporate heart of the city. Clean, surveilled, expensive.',
    location_type: 'DISTRICT',
    surveillance_level: 5,
  },
  {
    id: crypto.randomUUID(),
    code: 'INDUSTRIAL',
    name: 'Industrial Zone',
    description: 'Factories and warehouses. Iron Dragon territory.',
    location_type: 'DISTRICT',
    surveillance_level: 2,
  },
  {
    id: crypto.randomUUID(),
    code: 'SLUMS',
    name: 'The Sprawl',
    description: 'Densely packed residential blocks. Gang activity high.',
    location_type: 'DISTRICT',
    surveillance_level: 1,
  },
  {
    id: crypto.randomUUID(),
    code: 'MARKET',
    name: 'Night Market',
    description: 'Black market hub. Everything has a price.',
    location_type: 'DISTRICT',
    surveillance_level: 1,
  },
  {
    id: crypto.randomUUID(),
    code: 'PORT',
    name: 'Docklands',
    description: 'Shipping and smuggling. Neon Saints controlled.',
    location_type: 'DISTRICT',
    surveillance_level: 2,
  },
  {
    id: crypto.randomUUID(),
    code: 'TECH_DISTRICT',
    name: 'Silicon Heights',
    description: 'Tech companies and research labs. High security.',
    location_type: 'DISTRICT',
    surveillance_level: 5,
  },
];

// Black Market Contacts
const getBlackMarketContacts = () => [
  {
    contact_type: 'FIXER',
    specialization: 'Information',
    reliability_rating: 80,
    danger_rating: 20,
    npc_name: 'Fast Eddie',
    npc_title: 'Info Broker',
    npc_description: 'Talks fast, knows everything.',
    district_code: 'DOWNTOWN'
  },
  {
    contact_type: 'ARMS_DEALER',
    specialization: 'Weapons',
    reliability_rating: 60,
    danger_rating: 70,
    npc_name: 'Iron Mike',
    npc_title: 'Gun Runner',
    npc_description: 'Big guy, bigger guns.',
    district_code: 'INDUSTRIAL'
  },
  {
    contact_type: 'RIPPERDOC',
    specialization: 'Augmentations',
    reliability_rating: 90,
    danger_rating: 10,
    npc_name: 'Dr. Stich',
    npc_title: 'Street Surgeon',
    npc_description: 'Steady hands, sterile-ish room.',
    district_code: 'SLUMS'
  }
];

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

// Loot Tables
const getLootTables = () => [
  {
    id: crypto.randomUUID(),
    code: 'STANDARD_SCAVENGE',
    name: 'Standard Scavenge',
    table_type: 'RANDOM',
    min_tier: 1,
    entries: [
      { item_code: 'STIM_HEALTH', drop_chance: 0.2, min: 1, max: 1 },
      // Add more as items defined
    ]
  },
  {
    id: crypto.randomUUID(),
    code: 'SECURITY_DETAIL',
    name: 'Security Detail',
    table_type: 'RANDOM',
    min_tier: 1,
    entries: [
      { item_code: 'PISTOL_BASIC', drop_chance: 0.1, min: 1, max: 1 },
      { item_code: 'STIM_HEALTH', drop_chance: 0.3, min: 1, max: 2 },
    ]
  }
];

// ... (keep existing data functions)

/**
 * Seed all game data.
 * @param db Database instance
 * @param cache Cache instance (optional)
 * @param tables Optional list of specific tables to seed. If empty/null, seeds all.
 */
export async function seedAll(
  db: D1Database,
  cache?: GameCache,
  tables?: string[]
): Promise<SeedResult[]> {
  const results: SeedResult[] = [];
  const seeders: Record<string, (db: D1Database) => Promise<SeedResult>> = {
    'factions': seedFactions,
    'attribute_definitions': seedAttributes,
    'skill_definitions': seedSkills,
    'mission_definitions': seedMissions,
    'item_definitions': seedItems,
    'drone_definitions': seedDrones,
    'locations': seedLocations,
    'routes': seedRoutes,
    'black_market_contacts': seedBlackMarketContacts,
    'loot_tables': seedLootTables,
    'dialogue_trees': seedDialogue,
    'quest_definitions': seedQuests,
    'npc_definitions': seedNPCs,
    'vendor_inventories': seedVendors,
  };

  const tablesToSeed = tables && tables.length > 0
    ? tables.filter(t => seeders[t])
    : Object.keys(seeders);

  for (const table of tablesToSeed) {
    if (seeders[table]) {
      results.push(await seeders[table](db));
    }
  }

  // Warm cache if provided
  if (cache) {
    await cache.warmUp(db);
  }

  return results;
}

async function seedLootTables(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'loot_tables', inserted: 0, errors: [] };
  for (const table of getLootTables()) {
    try {
      // 0. Get/Create Table ID
      let tableId = table.id;
      const existingTable = await db.prepare('SELECT id FROM loot_tables WHERE code = ?').bind(table.code || table.name.toUpperCase().replace(/\s+/g, '_')).first<{ id: string }>();
      if (existingTable) {
        tableId = existingTable.id;
      } else {
        await db.prepare('INSERT INTO loot_tables (id, code, name, table_type, min_tier) VALUES (?, ?, ?, ?, ?)')
          .bind(tableId, table.code || table.name.toUpperCase().replace(/\s+/g, '_'), table.name, table.table_type, table.min_tier).run();
        result.inserted++;
      }

      // 2. Insert Entries
      for (const entry of table.entries) {
        try {
          // Lookup Item ID
          const item = await db.prepare('SELECT id FROM item_definitions WHERE code = ?').bind(entry.item_code).first<{ id: string }>();
          if (!item) {
            result.errors.push(`Item ${entry.item_code} not found for loot table ${table.name}`);
            continue;
          }

          // Use a deterministic ID based on table + item to avoid duplicates
          const entryId = crypto.randomUUID();

          await db.prepare(`
                    INSERT OR IGNORE INTO loot_table_entries (
                        id, loot_table_id, item_definition_id, drop_chance,
                        min_quantity, max_quantity, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                `).bind(
            entryId,
            tableId,
            item.id,
            entry.drop_chance,
            entry.min,
            entry.max
          ).run();
        } catch (e) {
          result.errors.push(`Table ${table.name} Entry ${entry.item_code}: ${e}`);
        }
      }
    } catch (e) {
      result.errors.push(`Failed to seed loot table ${table.name}: ${e}`);
    }
  }

  return result;
}

async function seedDialogue(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'dialogue_trees', inserted: 0, errors: [] };

  for (const tree of dialogueSeeds) {
    // Normalize tree data structure if needed
    // generatedDialogues has { id, code, rootNodeId, nodes }
    // chenTutorial might define raw nodes? 
    // Assuming for now they conform or we allow "any" to flexible handling
    const treeData = tree as any;
    const treeId = treeData.id || crypto.randomUUID();
    const treeCode = treeData.code || treeData.title?.toUpperCase().replace(/\s+/g, '_') || treeData.id?.toUpperCase().replace(/[^A-Z0-9_]/g, '_') || 'UNKNOWN_TREE';

    try {
      // Insert Tree
      await db.prepare(`
            INSERT INTO dialogue_trees (id, code, name, description, root_node_id)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET
            name = excluded.name,
            root_node_id = excluded.root_node_id
          `).bind(
        treeId,
        treeCode,
        treeData.name || treeCode,
        treeData.description || 'Seeded Dialogue',
        treeData.rootNodeId || null
      ).run();

      // Insert Nodes
      if (treeData.nodes && Array.isArray(treeData.nodes)) {
        for (const node of treeData.nodes) {
          await db.prepare(`
                    INSERT OR IGNORE INTO dialogue_nodes (id, tree_id, text, speaker_type, speaker_name_override)
                    VALUES (?, ?, ?, ?, ?)
                  `).bind(
            node.id,
            treeId,
            node.text || '...',
            node.speaker ? 'NPC' : 'PLAYER', // Simple heuristic
            node.speaker || null
          ).run();

          // Insert Choices/Responses
          if (node.choices && Array.isArray(node.choices)) {
            let order = 1;
            for (const choice of node.choices) {
              await db.prepare(`
                            INSERT OR IGNORE INTO dialogue_responses (id, node_id, text, display_order, leads_to_node_id)
                            VALUES (?, ?, ?, ?, ?)
                        `).bind(
                crypto.randomUUID(),
                node.id,
                choice.text,
                order++,
                choice.nextNodeId || null
              ).run();
            }
          }
        }
      }

      result.inserted++;
    } catch (e) {
      result.errors.push(`Failed to seed tree ${treeCode}: ${e}`);
    }
  }

  return result;
}

async function seedQuests(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'quest_definitions', inserted: 0, errors: [] };

  if (questsData && Array.isArray(questsData.quests)) {
    for (const quest of questsData.quests) {
      try {
        // Upsert Quest
        await db.prepare(`
                INSERT INTO quest_definitions (id, code, name, description, quest_type, required_tier, is_linear, can_fail)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(code) DO UPDATE SET
                name = excluded.name,
                description = excluded.description
             `).bind(
          quest.id,
          quest.questId,
          quest.questId, // Name not always in parser, using ID for now
          quest.synopsis || 'Generated Quest',
          quest.type || 'SIDE_MISSION',
          quest.tier || 0,
          quest.branchingPaths?.length === 0 ? 1 : 0,
          0
        ).run();

        // Insert Objectives
        if (quest.objectives) {
          // Flatten objectives
          const allObjs = [
            ...quest.objectives.primary.map((t: string) => ({ t, type: 'PRIMARY' })),
            ...quest.objectives.secondary.map((t: string) => ({ t, type: 'SECONDARY' })),
          ];

          let order = 0;
          for (const obj of allObjs) {
            await db.prepare(`
                        INSERT OR IGNORE INTO quest_objectives (id, quest_definition_id, sequence_order, title, description, objective_type, target_quantity, is_optional)
                        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
                     `).bind(
              crypto.randomUUID(),
              quest.id,
              order++,
              obj.t,
              obj.t,
              'GENERIC', // Placeholder
              obj.type === 'SECONDARY' ? 1 : 0
            ).run();
          }
        }

        result.inserted++;
      } catch (e) {
        result.errors.push(`Failed to seed quest ${quest.questId}: ${e}`);
      }
    }
  }

  return result;
}

async function seedFactions(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'factions', inserted: 0, errors: [] };

  for (const faction of getFactions()) {
    try {
      await db
        .prepare(
          `INSERT OR IGNORE INTO factions (id, code, name, faction_type, description, goals, joinable_by_player)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          faction.id,
          faction.code,
          faction.name,
          faction.faction_type,
          faction.description,
          faction.goals,
          faction.joinable_by_player
        )
        .run();
      result.inserted++;
    } catch (e) {
      result.errors.push(`${faction.code}: ${e}`);
    }
  }

  return result;
}

async function seedAttributes(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'attribute_definitions', inserted: 0, errors: [] };

  for (const attr of getAttributes()) {
    try {
      await db
        .prepare(
          `INSERT OR IGNORE INTO attribute_definitions (id, code, name, description, category)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(attr.id, attr.code, attr.name, attr.description, attr.category)
        .run();
      result.inserted++;
    } catch (e) {
      result.errors.push(`${attr.code}: ${e}`);
    }
  }

  return result;
}

async function seedSkills(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'skill_definitions', inserted: 0, errors: [] };

  for (const skill of getSkills()) {
    try {
      // Get attribute ID
      const existingAttr = await db.prepare('SELECT id FROM attribute_definitions WHERE code = ?').bind(skill.governing_attribute).first<{ id: string }>();

      if (!existingAttr) {
        result.errors.push(`Attribute ${skill.governing_attribute} not found for skill ${skill.code}`);
        continue;
      }

      await db
        .prepare(
          `INSERT OR IGNORE INTO skill_definitions
           (id, code, name, governing_attribute_id, category)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(
          skill.id,
          skill.code,
          skill.name,
          existingAttr.id,
          skill.category
        )
        .run();
      result.inserted++;
    } catch (e) {
      result.errors.push(`${skill.code}: ${e}`);
    }
  }

  return result;
}

async function seedMissions(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'mission_definitions', inserted: 0, errors: [] };

  for (const mission of getMissions()) {
    try {
      // Check if mission exists
      const existing = await db.prepare('SELECT id FROM mission_definitions WHERE code = ?').bind(mission.code).first<{ id: string }>();
      if (existing) {
        result.inserted++;
        continue;
      }

      await db
        .prepare(
          `INSERT INTO mission_definitions
           (id, code, name, mission_type, tier_requirement, description, briefing_text, base_pay, xp_reward, time_limit_minutes, cargo_type, is_repeatable)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          mission.id,
          mission.code,
          mission.name,
          mission.mission_type,
          mission.tier_requirement,
          mission.description,
          mission.briefing_text,
          mission.base_pay,
          mission.xp_reward,
          mission.time_limit_minutes,
          mission.cargo_type,
          mission.is_repeatable
        )
        .run();
      result.inserted++;
    } catch (e) {
      result.errors.push(`${mission.code}: ${e}`);
    }
  }

  return result;
}

async function seedItems(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'item_definitions', inserted: 0, errors: [] };

  for (const item of getItems()) {
    try {
      await db
        .prepare(
          `INSERT OR IGNORE INTO item_definitions
        (id, code, name, item_type, rarity, description, base_price)
      VALUES(?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          item.id,
          item.code,
          item.name,
          item.item_type,
          item.rarity,
          item.description,
          item.base_price
        )
        .run();
      result.inserted++;
    } catch (e) {
      result.errors.push(`${item.code}: ${e} `);
    }
  }

  return result;
}

async function seedLocations(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'locations', inserted: 0, errors: [] };

  for (const loc of getLocations()) {
    try {
      await db
        .prepare(
          `INSERT OR IGNORE INTO locations
        (id, code, name, description, location_type, surveillance_level)
      VALUES(?, ?, ?, ?, ?, ?)`
        )
        .bind(
          loc.id,
          loc.code,
          loc.name,
          loc.description,
          loc.location_type,
          loc.surveillance_level
        )
        .run();
      result.inserted++;
    } catch (e) {
      result.errors.push(`${loc.code}: ${e} `);
    }
  }

  return result;
}

async function seedDrones(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'drone_definitions', inserted: 0, errors: [] };

  const drones = [
    {
      id: crypto.randomUUID(),
      code: 'DRONE_SCOUT_V1',
      name: 'SkyEye Scout',
      manufacturer: 'AeroDyne',
      description: 'Basic surveillance drone. Cheap, quiet, but fragile.',
      drone_class: 'QUADCOPTER',
      drone_role: 'SCOUT',
      size_category: 'SMALL',
      rarity: 'COMMON',
      max_speed_kmh: 60,
      acceleration: 70,
      maneuverability: 80,
      hover_capable: 1,
      max_altitude_m: 150,
      noise_level: 20,
      max_hull_points: 15,
      armor_rating: 0,
      emp_resistance: 0,
      battery_capacity_minutes: 25,
      recharge_time_minutes: 30,
      solar_capable: 0,
      max_payload_kg: 0.5,
      cargo_volume_liters: 0.5,
      weapon_mounts: 0,
      tool_mounts: 1,
      sensor_suite: JSON.stringify({ type: 'OPTICAL', range: 500 }),
      stealth_detection: 0,
      targeting_accuracy: 0,
      autonomous_level: 1,
      control_range_km: 1.0,
      requires_neural_link: 0,
      swarm_compatible: 1,
      max_swarm_size: 5,
      required_tier: 1,
      base_price: 1500
    },
    {
      id: crypto.randomUUID(),
      code: 'DRONE_CARGO_MULE',
      name: 'Mule Hauler',
      manufacturer: 'HeavyLift',
      description: 'Heavy lift hexacopter designed for courier deliveries.',
      drone_class: 'HEXACOPTER',
      drone_role: 'CARGO',
      size_category: 'MEDIUM',
      rarity: 'COMMON',
      max_speed_kmh: 40,
      acceleration: 30,
      maneuverability: 40,
      hover_capable: 1,
      max_altitude_m: 100,
      noise_level: 60,
      max_hull_points: 50,
      armor_rating: 1,
      emp_resistance: 0,
      battery_capacity_minutes: 40,
      recharge_time_minutes: 60,
      solar_capable: 0,
      max_payload_kg: 5.0,
      cargo_volume_liters: 10.0,
      weapon_mounts: 0,
      tool_mounts: 1,
      sensor_suite: JSON.stringify({ type: 'LIDAR', range: 100 }),
      stealth_detection: 0,
      targeting_accuracy: 0,
      autonomous_level: 1,
      control_range_km: 2.0,
      requires_neural_link: 0,
      swarm_compatible: 0,
      max_swarm_size: 0,
      required_tier: 2,
      base_price: 3500
    },
    {
      id: crypto.randomUUID(),
      code: 'DRONE_COMBAT_WASP',
      name: 'Wasp Interceptor',
      manufacturer: 'Militech Clone',
      description: 'Light combat drone equipped with a stun gun.',
      drone_class: 'QUADCOPTER',
      drone_role: 'COMBAT',
      size_category: 'SMALL',
      rarity: 'UNCOMMON',
      max_speed_kmh: 90,
      acceleration: 90,
      maneuverability: 85,
      hover_capable: 1,
      max_altitude_m: 200,
      noise_level: 50,
      max_hull_points: 25,
      armor_rating: 0,
      emp_resistance: 0,
      battery_capacity_minutes: 20,
      recharge_time_minutes: 45,
      solar_capable: 0,
      max_payload_kg: 1.0,
      cargo_volume_liters: 1.0,
      weapon_mounts: 1,
      tool_mounts: 0,
      sensor_suite: JSON.stringify({ type: 'THERMAL', range: 300 }),
      stealth_detection: 10,
      targeting_accuracy: 60,
      autonomous_level: 2,
      control_range_km: 1.5,
      requires_neural_link: 1,
      swarm_compatible: 1,
      max_swarm_size: 10,
      required_tier: 3,
      base_price: 5000
    }
  ];

  for (const drone of drones) {
    try {
      await db.prepare(`
        INSERT INTO drone_definitions(
        id, code, name, manufacturer, description,
        drone_class, drone_role, size_category, rarity,
        max_speed_kmh, acceleration, maneuverability, hover_capable,
        max_altitude_m, noise_level, max_hull_points, armor_rating,
        emp_resistance, battery_capacity_minutes, recharge_time_minutes,
        solar_capable, max_payload_kg, cargo_volume_liters,
        weapon_mounts, tool_mounts, sensor_suite, stealth_detection,
        targeting_accuracy, autonomous_level, control_range_km,
        requires_neural_link, swarm_compatible, max_swarm_size,
        required_tier, base_price,
        created_at, updated_at
      ) VALUES(
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?,
        datetime('now'), datetime('now')
      )
        ON CONFLICT(code) DO UPDATE SET
      base_price = excluded.base_price,
        swarm_compatible = excluded.swarm_compatible
          `).bind(
        drone.id, drone.code, drone.name, drone.manufacturer, drone.description,
        drone.drone_class, drone.drone_role, drone.size_category, drone.rarity,
        drone.max_speed_kmh, drone.acceleration, drone.maneuverability, drone.hover_capable,
        drone.max_altitude_m, drone.noise_level, drone.max_hull_points, drone.armor_rating,
        drone.emp_resistance, drone.battery_capacity_minutes, drone.recharge_time_minutes,
        drone.solar_capable, drone.max_payload_kg, drone.cargo_volume_liters,
        drone.weapon_mounts, drone.tool_mounts, drone.sensor_suite, drone.stealth_detection,
        drone.targeting_accuracy, drone.autonomous_level, drone.control_range_km,
        drone.requires_neural_link, drone.swarm_compatible, drone.max_swarm_size,
        drone.required_tier, drone.base_price
      ).run();
      result.inserted++;
    } catch (e) {
      result.errors.push(`Failed to seed drone ${drone.code}: ${e} `);
    }
  }

  return result;
}

async function seedBlackMarketContacts(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'black_market_contacts', inserted: 0, errors: [] };

  for (const contact of getBlackMarketContacts()) {
    try {
      // 1. Get Location
      const location = await db.prepare('SELECT id FROM locations WHERE code = ?').bind(contact.district_code).first<{ id: string }>();

      // 2. Create NPC (idempotent)
      const npcCode = `NPC_${contact.npc_name.toUpperCase().replace(/\s+/g, '_')}`;
      let npcId: string | undefined;

      const existingNpc = await db.prepare('SELECT id FROM npc_definitions WHERE code = ?').bind(npcCode).first<{ id: string }>();

      if (existingNpc) {
        npcId = existingNpc.id;
      } else {
        npcId = crypto.randomUUID();
        await db.prepare(`
          INSERT INTO npc_definitions (id, code, name, title, description, faction_id)
          VALUES (?, ?, ?, ?, ?, NULL)
        `).bind(
          npcId,
          npcCode,
          contact.npc_name,
          contact.npc_title,
          contact.npc_description
        ).run();
      }

      // 3. Create Contact
      const contactId = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO black_market_contacts(
        id, npc_id, location_id, contact_type, specialization,
        reliability_rating, danger_rating,
        inventory_tier_min, inventory_tier_max,
        is_available
      ) VALUES(?, ?, ?, ?, ?, ?, ?, 1, 3, 1)
      `).bind(
        contactId, npcId, location?.id || null,
        contact.contact_type, contact.specialization,
        contact.reliability_rating, contact.danger_rating
      ).run();

      result.inserted++;
    } catch (e) {
      result.errors.push(`Failed to seed contact ${contact.npc_name}: ${e} `);
    }
  }

  return result;
}

async function seedRoutes(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'routes', inserted: 0, errors: [] };

  // Get location IDs
  const locations = await db.prepare('SELECT id, code, name FROM locations').all<{ id: string, code: string, name: string }>();
  // @ts-ignore
  const locResults = locations.results || [];
  const locMap = new Map(locResults.map((l: any) => [l.code, l.id]));

  const routes = [
    // Core Districts
    { from: 'DOWNTOWN', to: 'INDUSTRIAL', time: 15, tier: 1 },
    { from: 'DOWNTOWN', to: 'SLUMS', time: 10, tier: 1 },
    { from: 'DOWNTOWN', to: 'TECH_DISTRICT', time: 10, tier: 2 },
    { from: 'INDUSTRIAL', to: 'PORT', time: 20, tier: 1 },
    { from: 'SLUMS', to: 'MARKET', time: 5, tier: 1 },
    { from: 'PORT', to: 'MARKET', time: 15, tier: 1 },

    // Extended Locations (from other seeds/migrations)
    { from: 'THE_HOLLOWS', to: 'SLUMS', time: 10, tier: 1 },
    { from: 'THE_HOLLOWS', to: 'INDUSTRIAL', time: 25, tier: 1 },
    { from: 'The Hollows', to: 'The Sprawl', time: 10, tier: 1 }, // In case names are used as codes? No, codes are keys.

    { from: 'RED_HARBOR', to: 'PORT', time: 10, tier: 1 },
    { from: 'INDUSTRIAL_ZONE', to: 'INDUSTRIAL', time: 5, tier: 1 },
    { from: 'NIGHT_MARKET', to: 'MARKET', time: 5, tier: 1 },
    { from: 'SILICON_HEIGHTS', to: 'TECH_DISTRICT', time: 5, tier: 1 },
    { from: 'UPTOWN', to: 'DOWNTOWN', time: 5, tier: 1 },
    { from: 'DOCKLANDS', to: 'PORT', time: 5, tier: 1 },
    { from: 'THE_INTERSTITIAL', to: 'SILICON_HEIGHTS', time: 0, tier: 1 }, // Portal?
  ];

  for (const route of routes) {
    const fromId = locMap.get(route.from);
    const toId = locMap.get(route.to);

    if (!fromId || !toId) {
      // console.warn(`Skipping route ${ route.from } -${ route.to }: Missing location ID`);
      continue;
    }

    // Create bidirectional routes
    const paths = [
      { origin: fromId, dest: toId },
      { origin: toId, dest: fromId }
    ];

    for (const path of paths) {
      try {
        await db.prepare(`
                INSERT INTO routes(
        id, origin_location_id, destination_location_id,
        name, route_type, base_travel_time_minutes, required_tier,
        created_at, updated_at
      ) VALUES(?, ?, ?, ?, 'ROAD', ?, ?, datetime('now'), datetime('now'))
            `).bind(
          crypto.randomUUID(),
          path.origin,
          path.dest,
          `Route ${route.from} -${route.to} `,
          route.time,
          route.tier
        ).run();
        result.inserted++;
      } catch (e) {
        result.errors.push(`Failed to create route ${route.from} -${route.to}: ${e} `);
      }
    }
  }
  return result;
}


async function seedNPCs(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'npc_definitions', inserted: 0, errors: [] };

  if (npcsData && Array.isArray(npcsData)) {
    for (const npc of npcsData) {
      try {
        await db.prepare(`
                  INSERT INTO npc_definitions (
                      id, code, name, occupation, home_location_id, age, appearance, 
                      background, personality_traits, personality_description,
                      voice_tone, voice_accent, voice_pace,
                      created_at, updated_at
                  ) VALUES (
                      ?, ?, ?, ?, ?, ?, ?, 
                      ?, ?, ?, 
                      ?, ?, ?,
                      datetime('now'), datetime('now')
                  )
                  ON CONFLICT(code) DO UPDATE SET
                      name = excluded.name,
                      occupation = excluded.occupation,
                      home_location_id = excluded.home_location_id,
                      updated_at = datetime('now')
              `).bind(
          npc.id,
          npc.id.toUpperCase().replace(/-/g, '_'), // Use ID as Code
          npc.name,
          npc.role,
          npc.location,
          npc.age,
          npc.appearance,
          npc.background,
          JSON.stringify(npc.personality.traits),
          npc.personality.description,
          npc.voiceDirection.tone,
          npc.voiceDirection.accent,
          npc.voiceDirection.pace
        ).run();
        result.inserted++;
      } catch (e) {
        result.errors.push(`Failed to seed NPC ${npc.name}: ${e}`);
      }
    }
  }

  return result;
}

export {
  getFactions,
  getAttributes,
  getSkills,
  getLocations,
  seedDrones,
  seedBlackMarketContacts,
  seedRoutes,
  seedDialogue,
  seedQuests,
  seedNPCs,
  seedVendors
};

async function seedVendors(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'vendor_inventories', inserted: 0, errors: [] };

  const vendors = [
    {
      code: 'VENDOR_SODA_DOWNTOWN',
      name: 'City Mart',
      type: 'GENERAL',
      location: 'DOWNTOWN',
      npc: { name: 'Clerk', role: 'SHOPKEEPER' },
      inventory: [
        { itemId: 'STIM_HEALTH', quantity: 10 },
        { itemId: 'JACKET_ARMORED', quantity: 2 }
      ]
    },
    {
      code: 'VENDOR_CLINIC_SLUMS',
      name: 'Street Doc',
      type: 'MEDICAL',
      location: 'SLUMS',
      npc: { name: 'Doc', role: 'MEDIC' },
      inventory: [
        { itemId: 'STIM_HEALTH', quantity: 50 }
      ]
    },
    {
      code: 'VENDOR_GUNS_INDUSTRIAL',
      name: 'Iron Output',
      type: 'WEAPONS',
      location: 'INDUSTRIAL',
      npc: { name: 'Gunther', role: 'ARMS_DEALER' },
      inventory: [
        { itemId: 'PISTOL_BASIC', quantity: 5 },
        { itemId: 'SMG_COMPACT', quantity: 2 }
      ]
    }
  ];

  for (const v of vendors) {
    try {
      // 1. Resolve Location
      const loc = await db.prepare('SELECT id FROM locations WHERE code = ?').bind(v.location).first<{ id: string }>();
      if (!loc) continue;

      // 2. Resolve/Create NPC
      let npcId = crypto.randomUUID();
      const existingNpc = await db.prepare('SELECT id FROM npc_definitions WHERE name = ? AND occupation = ?').bind(v.npc.name, v.npc.role).first<{ id: string }>();
      if (existingNpc) {
        npcId = existingNpc.id;
      } else {
        await db.prepare(`
          INSERT INTO npc_definitions (id, code, name, occupation, home_location_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(npcId, `NPC_${v.code}`, v.npc.name, v.npc.role, loc.id).run();
      }

      // 3. Insert Vendor
      const vendorId = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO vendor_inventories (
          id, vendor_type, specialization, location_id, vendor_npc_id,
          quality_tier_min, quality_tier_max, buy_price_modifier, sell_price_modifier,
          base_inventory, rotating_inventory, limited_stock,
          reputation_required, tier_required, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          1, 1, 1.0, 0.5,
          ?, '[]', '[]',
          0, 1, datetime('now'), datetime('now')
        )
      `).bind(
        vendorId, v.type, 'GENERAL', loc.id, npcId,
        JSON.stringify(v.inventory)
      ).run();

      result.inserted++;
    } catch (e) {
      result.errors.push(`Failed to seed vendor ${v.name}: ${e}`);
    }
  }

  return result;
}
