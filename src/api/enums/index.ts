/**
 * Enums API
 *
 * Provides access to all enum/reference tables for client-side
 * validation, dropdowns, and type checking.
 */

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

export const enumRoutes = new Hono<{ Bindings: Bindings }>();

// All enum table names
const ENUM_TABLES = [
  'enum_access_type',
  'enum_attribute_category',
  'enum_augment_category',
  'enum_blood_type',
  'enum_cargo_type',
  'enum_combat_status',
  'enum_condition_type',
  'enum_consciousness_state',
  'enum_contract_status',
  'enum_convergence_path',
  'enum_corporate_standing',
  'enum_currency_type',
  'enum_damage_type',
  'enum_debt_status',
  'enum_dialogue_tone',
  'enum_difficulty_level',
  'enum_drone_state',
  'enum_equipment_slot',
  'enum_faction_type',
  'enum_item_type',
  'enum_location_type',
  'enum_mission_status',
  'enum_mission_type',
  'enum_npc_type',
  'enum_origin_type',
  'enum_privacy_level',
  'enum_quest_status',
  'enum_quest_type',
  'enum_rarity',
  'enum_region_type',
  'enum_reputation_tier',
  'enum_save_type',
  'enum_sex_type',
  'enum_skill_category',
  'enum_transaction_type',
  'enum_vehicle_class',
  'enum_weapon_class',
] as const;

type EnumTableName = typeof ENUM_TABLES[number];

/**
 * GET /enums
 * List all available enum types.
 */
enumRoutes.get('/', async (c) => {
  return c.json({
    success: true,
    data: {
      enumTypes: ENUM_TABLES.map((table) => ({
        name: table,
        endpoint: `/api/enums/${table.replace('enum_', '')}`,
      })),
      total: ENUM_TABLES.length,
    },
  });
});

/**
 * GET /enums/all
 * Get all enum values in one request (useful for caching).
 */
enumRoutes.get('/all', async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;

  // Try cache first
  const cached = await cache.get('enums:all', 'json');
  if (cached) {
    return c.json({
      success: true,
      data: { enums: cached, cached: true },
    });
  }

  const enums: Record<string, string[]> = {};

  for (const table of ENUM_TABLES) {
    const result = await db.prepare(`SELECT value FROM ${table} ORDER BY value`).all();
    const shortName = table.replace('enum_', '');
    enums[shortName] = result.results.map((row) => row.value as string);
  }

  // Cache for 1 hour
  await cache.put('enums:all', JSON.stringify(enums), { expirationTtl: 3600 });

  return c.json({
    success: true,
    data: { enums, cached: false },
  });
});

/**
 * GET /enums/:enumType
 * Get values for a specific enum type.
 */
enumRoutes.get('/:enumType', async (c) => {
  const db = c.env.DB;
  const enumType = c.req.param('enumType');
  const tableName = `enum_${enumType}` as EnumTableName;

  if (!ENUM_TABLES.includes(tableName)) {
    return c.json({
      success: false,
      errors: [{
        code: 'INVALID_ENUM',
        message: `Unknown enum type: ${enumType}. Valid types: ${ENUM_TABLES.map(t => t.replace('enum_', '')).join(', ')}`
      }],
    }, 404);
  }

  const result = await db.prepare(`SELECT value FROM ${tableName} ORDER BY value`).all();
  const values = result.results.map((row) => row.value as string);

  return c.json({
    success: true,
    data: {
      enumType,
      values,
      total: values.length,
    },
  });
});

export default enumRoutes;
