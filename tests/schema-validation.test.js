#!/usr/bin/env node

/**
 * SURGE PROTOCOL - Schema Validation Tests
 *
 * Comprehensive tests to ensure schema integrity across migrations.
 * Run with: npm test
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, beforeAll } from 'node:test';
import assert from 'node:assert';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const MIGRATIONS_DIR = join(ROOT_DIR, 'migrations');
const DOCS_DIR = ROOT_DIR;

// Schema documentation files
const SCHEMA_DOCS = [
  '1CoreCharacter.md',
  '2Augmentation.md',
  '3SkillsEquipment.md',
  '4MissionWorldNPC.md',
  '5Economy.md',
  '6Combat.md',
  '7Narrative.md',
  '8MetaSystems.md',
  '9Persistence.md',
  '10MultiplayerSocial.md',
  '11AnalyticsConfigEnum.md'
];

// Expected tables from schema documentation
const EXPECTED_TABLES = {
  core: [
    'attribute_definitions', 'tracks', 'specializations', 'tier_definitions',
    'characters', 'character_attributes', 'rating_components', 'character_backstory',
    'character_memories'
  ],
  augmentation: [
    'body_locations', 'augment_manufacturers', 'augment_definitions',
    'character_augments', 'augment_sets', 'humanity_thresholds', 'humanity_events',
    'black_market_payment_types'
  ],
  skills: [
    'skill_definitions', 'character_skills', 'ability_definitions', 'character_abilities',
    'passive_definitions', 'item_definitions', 'weapon_definitions', 'armor_definitions',
    'character_inventory', 'vehicle_definitions', 'character_vehicles',
    'drone_definitions', 'character_drones', 'consumable_definitions'
  ],
  missions: [
    'regions', 'locations', 'routes', 'factions', 'npc_definitions', 'npc_instances',
    'character_reputations', 'mission_definitions', 'mission_objectives',
    'complication_definitions', 'character_missions'
  ],
  economy: [
    'currency_definitions', 'character_finances', 'financial_transactions',
    'vendor_inventories', 'contract_definitions', 'character_contracts', 'debts',
    'black_market_contacts', 'black_market_inventories', 'black_market_transactions'
  ],
  combat: [
    'damage_type_definitions', 'combat_arenas', 'combat_encounters',
    'combat_action_definitions', 'combat_instances', 'condition_definitions',
    'character_conditions', 'addiction_types', 'character_addictions',
    'cyberpsychosis_episodes'
  ],
  narrative: [
    'story_arcs', 'story_chapters', 'narrative_events', 'story_flags',
    'character_story_state', 'dialogue_trees', 'dialogue_nodes', 'dialogue_responses',
    'quest_definitions', 'quest_objectives', 'character_quests',
    'achievement_definitions', 'character_achievements', 'milestone_definitions'
  ],
  persistence: [
    'save_games', 'save_data_chunks', 'checkpoints', 'player_profiles',
    'player_settings', 'friendships', 'crews', 'crew_memberships',
    'leaderboard_definitions', 'leaderboard_entries', 'messages', 'notifications',
    'analytics_events', 'play_sessions', 'game_config', 'difficulty_definitions',
    'localized_strings', 'translations', 'generation_templates', 'loot_tables',
    'weather_conditions', 'game_time_state'
  ]
};

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

// Helper functions
function extractTablesFromSQL(sql) {
  const tables = [];
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi;
  let match;
  while ((match = tableRegex.exec(sql)) !== null) {
    tables.push(match[1].toLowerCase());
  }
  return tables;
}

function extractIndexesFromSQL(sql) {
  const indexes = [];
  const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi;
  let match;
  while ((match = indexRegex.exec(sql)) !== null) {
    indexes.push(match[1].toLowerCase());
  }
  return indexes;
}

function extractForeignKeysFromSQL(sql) {
  const fks = [];
  const fkRegex = /FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)/gi;
  let match;
  while ((match = fkRegex.exec(sql)) !== null) {
    fks.push({
      column: match[1],
      referencesTable: match[2],
      referencesColumn: match[3]
    });
  }
  return fks;
}

function extractColumnsFromSQL(sql, tableName) {
  // Find the CREATE TABLE block for this table
  const tableRegex = new RegExp(
    `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?${tableName}\\s*\\(([^;]+?)\\)\\s*;`,
    'gis'
  );
  const match = tableRegex.exec(sql);
  if (!match) return [];

  const tableBody = match[1];
  const columns = [];

  // Extract column definitions (skip constraints)
  const lines = tableBody.split(',').map(l => l.trim());
  for (const line of lines) {
    // Skip constraint lines
    if (/^\s*(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)/i.test(line)) continue;

    const colMatch = line.match(/^(\w+)\s+/);
    if (colMatch) {
      columns.push(colMatch[1].toLowerCase());
    }
  }

  return columns;
}

function readAllMigrations() {
  if (!existsSync(MIGRATIONS_DIR)) return '';

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

function extractTablesFromDoc(docPath) {
  if (!existsSync(docPath)) return [];

  const content = readFileSync(docPath, 'utf8');
  const tables = [];
  const tableRegex = /TABLE:\s+(\w+)/g;
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    tables.push(match[1].toLowerCase());
  }
  return tables;
}

// Test suite
let allSQL = '';
let foundTables = [];
let foundIndexes = [];

describe('Schema Validation Tests', () => {

  beforeAll(() => {
    allSQL = readAllMigrations();
    foundTables = extractTablesFromSQL(allSQL);
    foundIndexes = extractIndexesFromSQL(allSQL);
  });

  describe('Migration Files', () => {

    it('should have migrations directory', () => {
      assert.ok(existsSync(MIGRATIONS_DIR), 'Migrations directory should exist');
    });

    it('should have numbered migration files', () => {
      const files = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'));
      assert.ok(files.length >= 10, 'Should have at least 10 migration files');

      // Check numbering pattern
      const hasProperNaming = files.every(f => /^\d{4}_/.test(f));
      assert.ok(hasProperNaming, 'All migrations should follow NNNN_name.sql pattern');
    });

    it('should have sequential migration numbers', () => {
      const files = readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort();

      let lastNum = 0;
      for (const file of files) {
        const num = parseInt(file.substring(0, 4), 10);
        assert.ok(num > lastNum, `Migration ${file} should have sequential number`);
        lastNum = num;
      }
    });
  });

  describe('Core Character Tables', () => {

    it('should have all core character tables', () => {
      for (const table of EXPECTED_TABLES.core) {
        assert.ok(
          foundTables.includes(table.toLowerCase()),
          `Missing core table: ${table}`
        );
      }
    });

    it('should have characters table with required columns', () => {
      const columns = extractColumnsFromSQL(allSQL, 'characters');
      const required = ['id', 'player_id', 'name', 'tier', 'track'];
      for (const col of required) {
        assert.ok(
          columns.includes(col.toLowerCase()),
          `characters table missing column: ${col}`
        );
      }
    });
  });

  describe('Augmentation Tables', () => {

    it('should have all augmentation tables', () => {
      for (const table of EXPECTED_TABLES.augmentation) {
        assert.ok(
          foundTables.includes(table.toLowerCase()),
          `Missing augmentation table: ${table}`
        );
      }
    });
  });

  describe('Skills & Equipment Tables', () => {

    it('should have all skills and equipment tables', () => {
      for (const table of EXPECTED_TABLES.skills) {
        assert.ok(
          foundTables.includes(table.toLowerCase()),
          `Missing skills/equipment table: ${table}`
        );
      }
    });
  });

  describe('Mission & World Tables', () => {

    it('should have all mission and world tables', () => {
      for (const table of EXPECTED_TABLES.missions) {
        assert.ok(
          foundTables.includes(table.toLowerCase()),
          `Missing mission/world table: ${table}`
        );
      }
    });
  });

  describe('Economy Tables', () => {

    it('should have all economy tables', () => {
      for (const table of EXPECTED_TABLES.economy) {
        assert.ok(
          foundTables.includes(table.toLowerCase()),
          `Missing economy table: ${table}`
        );
      }
    });
  });

  describe('Combat Tables', () => {

    it('should have all combat tables', () => {
      for (const table of EXPECTED_TABLES.combat) {
        assert.ok(
          foundTables.includes(table.toLowerCase()),
          `Missing combat table: ${table}`
        );
      }
    });
  });

  describe('Narrative Tables', () => {

    it('should have all narrative tables', () => {
      for (const table of EXPECTED_TABLES.narrative) {
        assert.ok(
          foundTables.includes(table.toLowerCase()),
          `Missing narrative table: ${table}`
        );
      }
    });
  });

  describe('Persistence & Social Tables', () => {

    it('should have all persistence and social tables', () => {
      for (const table of EXPECTED_TABLES.persistence) {
        assert.ok(
          foundTables.includes(table.toLowerCase()),
          `Missing persistence/social table: ${table}`
        );
      }
    });
  });

  describe('Enum Reference Tables', () => {

    it('should have all enum tables', () => {
      for (const enumTable of EXPECTED_ENUMS) {
        assert.ok(
          foundTables.includes(enumTable.toLowerCase()),
          `Missing enum table: ${enumTable}`
        );
      }
    });

    it('should have enum tables with code column', () => {
      // Sample a few enum tables
      const sampleEnums = ['enum_rarity', 'enum_mission_type', 'enum_damage_type'];
      for (const enumTable of sampleEnums) {
        if (foundTables.includes(enumTable)) {
          const columns = extractColumnsFromSQL(allSQL, enumTable);
          assert.ok(
            columns.includes('code'),
            `Enum table ${enumTable} missing code column`
          );
        }
      }
    });
  });

  describe('Foreign Key Integrity', () => {

    it('should have valid foreign key references', () => {
      const fks = extractForeignKeysFromSQL(allSQL);
      for (const fk of fks) {
        // Check that referenced table exists
        assert.ok(
          foundTables.includes(fk.referencesTable.toLowerCase()),
          `Foreign key references non-existent table: ${fk.referencesTable}`
        );
      }
    });
  });

  describe('Index Coverage', () => {

    it('should have indexes defined', () => {
      assert.ok(foundIndexes.length > 0, 'Should have at least some indexes defined');
    });

    it('should have indexes on foreign key columns', () => {
      // Check that major foreign keys have indexes
      const criticalIndexPatterns = [
        'idx_.*_character_id',
        'idx_.*_player_id',
        'idx_.*_location_id'
      ];

      for (const pattern of criticalIndexPatterns) {
        const regex = new RegExp(pattern, 'i');
        const hasIndex = foundIndexes.some(idx => regex.test(idx));
        assert.ok(hasIndex, `Should have indexes matching pattern: ${pattern}`);
      }
    });
  });

  describe('Schema Documentation Consistency', () => {

    it('should have all schema documentation files', () => {
      for (const doc of SCHEMA_DOCS) {
        const docPath = join(DOCS_DIR, doc);
        assert.ok(existsSync(docPath), `Missing schema doc: ${doc}`);
      }
    });

    it('should have tables documented in schema docs', () => {
      let documentedTables = [];
      for (const doc of SCHEMA_DOCS) {
        const docPath = join(DOCS_DIR, doc);
        if (existsSync(docPath)) {
          documentedTables = documentedTables.concat(extractTablesFromDoc(docPath));
        }
      }

      // Check that most documented tables exist in migrations
      const missingInMigrations = documentedTables.filter(
        t => !foundTables.includes(t.toLowerCase())
      );

      // Allow some flexibility but most should match
      const coveragePercent = ((documentedTables.length - missingInMigrations.length) / documentedTables.length) * 100;
      assert.ok(
        coveragePercent >= 80,
        `Schema coverage should be at least 80%. Missing: ${missingInMigrations.slice(0, 10).join(', ')}`
      );
    });
  });

  describe('SQL Syntax Validation', () => {

    it('should have valid CREATE TABLE statements', () => {
      const createTableCount = (allSQL.match(/CREATE\s+TABLE/gi) || []).length;
      assert.ok(createTableCount > 50, 'Should have many CREATE TABLE statements');
    });

    it('should have matching parentheses in CREATE TABLE', () => {
      // Basic check - count opening and closing parens in each table definition
      const tableBlocks = allSQL.split(/CREATE\s+TABLE/i).slice(1);
      for (let i = 0; i < Math.min(tableBlocks.length, 10); i++) {
        const block = tableBlocks[i].split(';')[0];
        const opens = (block.match(/\(/g) || []).length;
        const closes = (block.match(/\)/g) || []).length;
        assert.strictEqual(opens, closes, `Table block ${i} has mismatched parentheses`);
      }
    });

    it('should not have dangerous SQL patterns', () => {
      const dangerousPatterns = [
        /DROP\s+DATABASE/i,
        /TRUNCATE\s+TABLE\s+(?!IF\s+EXISTS)/i,
        /DELETE\s+FROM\s+\w+\s*;/i  // DELETE without WHERE
      ];

      for (const pattern of dangerousPatterns) {
        assert.ok(
          !pattern.test(allSQL),
          `Found dangerous SQL pattern: ${pattern}`
        );
      }
    });
  });

  describe('Table Count Validation', () => {

    it('should have expected total table count', () => {
      const allExpected = [
        ...Object.values(EXPECTED_TABLES).flat(),
        ...EXPECTED_ENUMS
      ];

      const expectedCount = allExpected.length;
      const actualCount = foundTables.length;

      // Should have at least the expected number
      assert.ok(
        actualCount >= expectedCount * 0.9,
        `Expected at least ${expectedCount * 0.9} tables, found ${actualCount}`
      );
    });
  });
});

// Run tests if executed directly
const args = process.argv.slice(2);
if (args.includes('--run')) {
  console.log('Running schema validation tests...\n');
}
