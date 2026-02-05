/**
 * Surge Protocol - Seed Database from JSON Files
 *
 * Loads seed data from seed_data/ JSON files into the database.
 * Run with: npx tsx scripts/seed-db.ts [options]
 *
 * Options:
 *   --tables=attributes,skills  Only seed specific tables
 *   --clear                     Clear existing data first (use with caution)
 *   --dry-run                   Show what would be seeded without making changes
 *
 * Environment:
 *   DB_PATH: Path to D1 database (for local testing)
 */

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// TYPES
// =============================================================================

interface SeedResult {
  table: string;
  file: string;
  inserted: number;
  skipped: number;
  errors: string[];
}

interface SeedOptions {
  tables?: string[];
  clear?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

interface AttributeData {
  code: string;
  name: string;
  description: string;
  category: string;
  base_value: number;
  min_value: number;
  max_value: number;
  algorithm_flavor: string;
}

interface SkillData {
  code: string;
  name: string;
  category: string;
  governing_attribute: string;
  description: string;
  untrained_penalty: number;
}

interface TierData {
  tier_number: number;
  name: string;
  title: string;
  rating_threshold: number;
  rating_sustain: number | null;
  xp_required: number;
  base_pay_multiplier: number;
  tier_multiplier: number;
  max_attribute: number;
  max_skill: number;
  description: string;
  algorithm_greeting: string;
  unlocks: string[];
  color: string;
}

interface DifficultyData {
  target_numbers: Array<{
    code: string;
    name: string;
    target_number: number;
    description: string;
    example: string;
  }>;
  game_difficulty_modes: Array<{
    code: string;
    name: string;
    description: string;
    modifiers: Record<string, number>;
    algorithm_flavor: string;
  }>;
}

// =============================================================================
// FILE READERS
// =============================================================================

const SEED_DATA_DIR = path.join(__dirname, '..', 'seed_data');

function readJsonFile<T>(filename: string): T | null {
  const filePath = path.join(SEED_DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  Warning: ${filename} not found`);
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

// =============================================================================
// SEEDERS
// =============================================================================

type DbExecutor = {
  run: (sql: string, ...params: unknown[]) => Promise<{ changes: number }>;
  get: <T>(sql: string, ...params: unknown[]) => Promise<T | null>;
};

async function seedAttributes(
  db: DbExecutor,
  options: SeedOptions
): Promise<SeedResult> {
  const result: SeedResult = {
    table: 'attribute_definitions',
    file: 'attributes.json',
    inserted: 0,
    skipped: 0,
    errors: [],
  };

  const data = readJsonFile<{ attributes: AttributeData[] }>('attributes.json');
  if (!data?.attributes) return result;

  for (const attr of data.attributes) {
    try {
      if (options.dryRun) {
        console.log(`    [DRY-RUN] Would insert attribute: ${attr.code}`);
        result.inserted++;
        continue;
      }

      const existing = await db.get<{ id: string }>(
        'SELECT id FROM attribute_definitions WHERE code = ?',
        attr.code
      );

      if (existing) {
        if (options.verbose) console.log(`    Skipping existing: ${attr.code}`);
        result.skipped++;
        continue;
      }

      await db.run(
        `INSERT INTO attribute_definitions (id, code, name, description, category)
         VALUES (?, ?, ?, ?, ?)`,
        crypto.randomUUID(),
        attr.code,
        attr.name,
        attr.description,
        attr.category
      );
      result.inserted++;
      if (options.verbose) console.log(`    Inserted: ${attr.code}`);
    } catch (e) {
      result.errors.push(`${attr.code}: ${e}`);
    }
  }

  return result;
}

async function seedSkills(
  db: DbExecutor,
  options: SeedOptions
): Promise<SeedResult> {
  const result: SeedResult = {
    table: 'skill_definitions',
    file: 'skills.json',
    inserted: 0,
    skipped: 0,
    errors: [],
  };

  const data = readJsonFile<{ skills: SkillData[] }>('skills.json');
  if (!data?.skills) return result;

  for (const skill of data.skills) {
    try {
      if (options.dryRun) {
        console.log(`    [DRY-RUN] Would insert skill: ${skill.code}`);
        result.inserted++;
        continue;
      }

      const existing = await db.get<{ id: string }>(
        'SELECT id FROM skill_definitions WHERE code = ?',
        skill.code
      );

      if (existing) {
        if (options.verbose) console.log(`    Skipping existing: ${skill.code}`);
        result.skipped++;
        continue;
      }

      // Get governing attribute ID
      const attr = await db.get<{ id: string }>(
        'SELECT id FROM attribute_definitions WHERE code = ?',
        skill.governing_attribute
      );

      await db.run(
        `INSERT INTO skill_definitions (id, code, name, category, governing_attribute_id, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        crypto.randomUUID(),
        skill.code,
        skill.name,
        skill.category,
        attr?.id ?? null,
        skill.description
      );
      result.inserted++;
      if (options.verbose) console.log(`    Inserted: ${skill.code}`);
    } catch (e) {
      result.errors.push(`${skill.code}: ${e}`);
    }
  }

  return result;
}

async function seedTiers(
  db: DbExecutor,
  options: SeedOptions
): Promise<SeedResult> {
  const result: SeedResult = {
    table: 'tier_definitions',
    file: 'tier_definitions.json',
    inserted: 0,
    skipped: 0,
    errors: [],
  };

  const data = readJsonFile<{ tiers: TierData[] }>('tier_definitions.json');
  if (!data?.tiers) return result;

  for (const tier of data.tiers) {
    try {
      if (options.dryRun) {
        console.log(`    [DRY-RUN] Would insert tier: ${tier.tier_number} - ${tier.name}`);
        result.inserted++;
        continue;
      }

      const existing = await db.get<{ id: string }>(
        'SELECT id FROM tier_definitions WHERE tier_number = ?',
        tier.tier_number
      );

      if (existing) {
        if (options.verbose) console.log(`    Skipping existing tier: ${tier.tier_number}`);
        result.skipped++;
        continue;
      }

      await db.run(
        `INSERT INTO tier_definitions
         (id, tier_number, name, xp_required, rating_min, rating_max, base_pay_multiplier, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        crypto.randomUUID(),
        tier.tier_number,
        tier.name,
        tier.xp_required,
        tier.rating_threshold,
        tier.rating_sustain ?? tier.rating_threshold + 100,
        tier.base_pay_multiplier,
        tier.description
      );
      result.inserted++;
      if (options.verbose) console.log(`    Inserted tier: ${tier.tier_number}`);
    } catch (e) {
      result.errors.push(`Tier ${tier.tier_number}: ${e}`);
    }
  }

  return result;
}

async function seedDifficultyLevels(
  db: DbExecutor,
  options: SeedOptions
): Promise<SeedResult> {
  const result: SeedResult = {
    table: 'difficulty_levels',
    file: 'difficulty_levels.json',
    inserted: 0,
    skipped: 0,
    errors: [],
  };

  const data = readJsonFile<DifficultyData>('difficulty_levels.json');
  if (!data?.target_numbers) return result;

  for (const diff of data.target_numbers) {
    try {
      if (options.dryRun) {
        console.log(`    [DRY-RUN] Would insert difficulty: ${diff.code}`);
        result.inserted++;
        continue;
      }

      const existing = await db.get<{ id: string }>(
        'SELECT id FROM difficulty_levels WHERE code = ?',
        diff.code
      );

      if (existing) {
        if (options.verbose) console.log(`    Skipping existing: ${diff.code}`);
        result.skipped++;
        continue;
      }

      await db.run(
        `INSERT INTO difficulty_levels (id, code, name, target_number, description)
         VALUES (?, ?, ?, ?, ?)`,
        crypto.randomUUID(),
        diff.code,
        diff.name,
        diff.target_number,
        diff.description
      );
      result.inserted++;
      if (options.verbose) console.log(`    Inserted: ${diff.code}`);
    } catch (e) {
      result.errors.push(`${diff.code}: ${e}`);
    }
  }

  return result;
}

// =============================================================================
// SEEDER REGISTRY
// =============================================================================

interface SeederEntry {
  name: string;
  seeder: (db: DbExecutor, options: SeedOptions) => Promise<SeedResult>;
  order: number;
}

const SEEDERS: SeederEntry[] = [
  { name: 'attributes', seeder: seedAttributes, order: 1 },
  { name: 'skills', seeder: seedSkills, order: 2 },
  { name: 'tiers', seeder: seedTiers, order: 3 },
  { name: 'difficulty_levels', seeder: seedDifficultyLevels, order: 4 },
];

// =============================================================================
// MAIN RUNNER
// =============================================================================

async function runSeeders(
  db: DbExecutor,
  options: SeedOptions = {}
): Promise<SeedResult[]> {
  const results: SeedResult[] = [];

  // Filter seeders if specific tables requested
  let seedersToRun = SEEDERS.sort((a, b) => a.order - b.order);
  if (options.tables?.length) {
    seedersToRun = seedersToRun.filter((s) =>
      options.tables!.some((t) => s.name.includes(t))
    );
  }

  console.log('\n📦 Surge Protocol - Database Seeder\n');
  console.log(`  Seed data directory: ${SEED_DATA_DIR}`);
  console.log(`  Mode: ${options.dryRun ? 'DRY-RUN' : 'LIVE'}`);
  console.log(`  Tables: ${options.tables?.join(', ') || 'all'}\n`);

  for (const entry of seedersToRun) {
    console.log(`  Seeding ${entry.name}...`);
    const result = await entry.seeder(db, options);
    results.push(result);

    const status = result.errors.length > 0 ? '⚠️' : '✅';
    console.log(
      `    ${status} ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors.length} errors`
    );
  }

  // Summary
  const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  console.log('\n📊 Summary:');
  console.log(`  Total inserted: ${totalInserted}`);
  console.log(`  Total skipped: ${totalSkipped}`);
  console.log(`  Total errors: ${totalErrors}`);

  if (totalErrors > 0) {
    console.log('\n❌ Errors:');
    for (const result of results) {
      for (const error of result.errors) {
        console.log(`    ${result.table}: ${error}`);
      }
    }
  }

  return results;
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  const options: SeedOptions = {
    verbose: false,
    dryRun: false,
    clear: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--clear') {
      options.clear = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg.startsWith('--tables=')) {
      options.tables = arg.split('=')[1]?.split(',');
    }
  }

  return options;
}

// Mock DB for testing (would be replaced with actual D1 binding in production)
function createMockDb(): DbExecutor {
  const data: Record<string, Map<string, Record<string, unknown>>> = {
    attribute_definitions: new Map(),
    skill_definitions: new Map(),
    tier_definitions: new Map(),
    difficulty_levels: new Map(),
  };

  return {
    async run(sql: string, ...params: unknown[]) {
      // Simple mock implementation
      if (sql.includes('INSERT')) {
        const table = sql.match(/INTO\s+(\w+)/)?.[1];
        if (table && data[table]) {
          const id = params[0] as string;
          data[table].set(id, { id, ...Object.fromEntries(params.slice(1).map((p, i) => [`param${i}`, p])) });
          return { changes: 1 };
        }
      }
      return { changes: 0 };
    },

    async get<T>(sql: string, ...params: unknown[]) {
      // Simple mock implementation for checking existence
      if (sql.includes('SELECT') && sql.includes('WHERE code =')) {
        const table = sql.match(/FROM\s+(\w+)/)?.[1];
        const code = params[0] as string;
        if (table && data[table]) {
          for (const record of data[table].values()) {
            if ((record as Record<string, unknown>).code === code) {
              return record as T;
            }
          }
        }
      }
      if (sql.includes('WHERE tier_number =')) {
        const table = sql.match(/FROM\s+(\w+)/)?.[1];
        const tierNum = params[0] as number;
        if (table && data[table]) {
          for (const record of data[table].values()) {
            if ((record as Record<string, unknown>).tier_number === tierNum) {
              return record as T;
            }
          }
        }
      }
      return null;
    },
  };
}

// Main entry point
async function main() {
  const options = parseArgs();

  // In a real implementation, this would use wrangler's D1 binding
  // For now, we use a mock DB for demonstration
  const db = createMockDb();

  console.log('⚠️  Running with mock database (use with wrangler for real D1)');

  await runSeeders(db, options);
}

// Export for use as module
export { runSeeders, SEEDERS, type SeedResult, type SeedOptions, type DbExecutor };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
