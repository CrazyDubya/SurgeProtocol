#!/usr/bin/env node

/**
 * SURGE PROTOCOL - Schema Validation Script
 *
 * This script validates the SQL migration files against the schema documentation.
 * Run before commits to ensure schema integrity.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const MIGRATIONS_DIR = join(ROOT_DIR, 'migrations');

// Expected tables from schema documentation
const EXPECTED_TABLES = [
  // Core Character (Part 1)
  'attribute_definitions', 'tracks', 'specializations', 'tier_definitions',
  'characters', 'character_attributes', 'rating_components', 'character_backstory',
  'character_memories',

  // Augmentation (Part 2)
  'body_locations', 'augment_manufacturers', 'augment_definitions',
  'character_augments', 'augment_sets', 'humanity_thresholds', 'humanity_events',
  'black_market_payment_types',

  // Skills & Equipment (Part 3)
  'skill_definitions', 'character_skills', 'ability_definitions', 'character_abilities',
  'passive_definitions', 'item_definitions', 'weapon_definitions', 'armor_definitions',
  'character_inventory', 'vehicle_definitions', 'character_vehicles',
  'drone_definitions', 'character_drones', 'consumable_definitions',

  // Missions, World, NPCs (Part 4)
  'regions', 'locations', 'routes', 'factions', 'npc_definitions', 'npc_instances',
  'character_reputations', 'mission_definitions', 'mission_objectives',
  'complication_definitions', 'character_missions',

  // Economy (Part 5)
  'currency_definitions', 'character_finances', 'financial_transactions',
  'vendor_inventories', 'contract_definitions', 'character_contracts', 'debts',
  'black_market_contacts', 'black_market_inventories', 'black_market_transactions',

  // Combat (Part 6)
  'damage_type_definitions', 'combat_arenas', 'combat_encounters',
  'combat_action_definitions', 'combat_instances', 'condition_definitions',
  'character_conditions', 'addiction_types', 'character_addictions',
  'cyberpsychosis_episodes',

  // Narrative (Part 7)
  'story_arcs', 'story_chapters', 'narrative_events', 'story_flags',
  'character_story_state', 'dialogue_trees', 'dialogue_nodes', 'dialogue_responses',
  'quest_definitions', 'quest_objectives', 'character_quests',
  'achievement_definitions', 'character_achievements', 'milestone_definitions',

  // Persistence & Social (Part 8)
  'save_games', 'save_data_chunks', 'checkpoints', 'player_profiles',
  'player_settings', 'friendships', 'crews', 'crew_memberships',
  'leaderboard_definitions', 'leaderboard_entries', 'messages', 'notifications',
  'analytics_events', 'play_sessions', 'game_config', 'difficulty_definitions',
  'localized_strings', 'translations', 'generation_templates', 'loot_tables',
  'weather_conditions', 'game_time_state'
];

// Required enum tables
const EXPECTED_ENUMS = [
  'enum_sex_type', 'enum_blood_type', 'enum_consciousness_state',
  'enum_corporate_standing', 'enum_origin_type', 'enum_convergence_path',
  'enum_attribute_category', 'enum_skill_category', 'enum_rarity',
  'enum_item_type', 'enum_equipment_slot', 'enum_weapon_class',
  'enum_damage_type', 'enum_mission_type', 'enum_mission_status',
  'enum_cargo_type', 'enum_region_type', 'enum_location_type',
  'enum_access_type', 'enum_npc_type', 'enum_faction_type',
  'enum_reputation_tier', 'enum_condition_type', 'enum_combat_status',
  'enum_quest_type', 'enum_quest_status', 'enum_dialogue_tone',
  'enum_currency_type', 'enum_transaction_type', 'enum_contract_status',
  'enum_debt_status', 'enum_difficulty_level', 'enum_save_type',
  'enum_privacy_level', 'enum_augment_category', 'enum_vehicle_class',
  'enum_drone_state'
];

function extractTablesFromSQL(sql) {
  const tables = [];
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi;
  let match;
  while ((match = tableRegex.exec(sql)) !== null) {
    tables.push(match[1].toLowerCase());
  }
  return tables;
}

function readMigrations() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  let allSQL = '';
  for (const file of files) {
    const content = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    allSQL += content + '\n';
  }
  return allSQL;
}

function validateSchema() {
  console.log('🔍 Validating Surge Protocol Schema...\n');

  if (!existsSync(MIGRATIONS_DIR)) {
    console.error('❌ Migrations directory not found!');
    process.exit(1);
  }

  const allSQL = readMigrations();
  const foundTables = extractTablesFromSQL(allSQL);

  // Check for expected tables
  const missingTables = [];
  const expectedAll = [...EXPECTED_TABLES, ...EXPECTED_ENUMS];

  for (const table of expectedAll) {
    if (!foundTables.includes(table.toLowerCase())) {
      missingTables.push(table);
    }
  }

  // Report results
  console.log(`📊 Found ${foundTables.length} tables in migrations`);
  console.log(`📋 Expected ${expectedAll.length} tables\n`);

  if (missingTables.length > 0) {
    console.log('❌ Missing tables:');
    missingTables.forEach(t => console.log(`   - ${t}`));
    console.log('');
  }

  // Check for extra tables (not necessarily an error)
  const extraTables = foundTables.filter(t =>
    !expectedAll.map(e => e.toLowerCase()).includes(t)
  );

  if (extraTables.length > 0) {
    console.log('ℹ️  Additional tables found (may be intentional):');
    extraTables.forEach(t => console.log(`   - ${t}`));
    console.log('');
  }

  // Validation result
  if (missingTables.length === 0) {
    console.log('✅ Schema validation PASSED!');
    console.log(`   All ${EXPECTED_TABLES.length} main tables found`);
    console.log(`   All ${EXPECTED_ENUMS.length} enum tables found`);
    return true;
  } else {
    console.log(`❌ Schema validation FAILED!`);
    console.log(`   ${missingTables.length} tables missing`);
    return false;
  }
}

// Run validation
const success = validateSchema();
process.exit(success ? 0 : 1);
