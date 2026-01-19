/**
 * Procedural Generation API
 *
 * Manages generation templates and loot tables for dynamic content.
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware, type AuthVariables } from '../../middleware/auth';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  return value as T;
}

export const proceduralRoutes = new Hono<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>();

// ============================================
// GENERATION TEMPLATES
// ============================================

interface GenerationTemplate {
  id: string;
  code: string;
  name: string;
  templateType: string | null;
  parameterRanges: Record<string, unknown> | null;
  requiredTags: string[] | null;
  excludedTags: string[] | null;
  weightModifiers: Record<string, number> | null;
  tierRange: { min: number; max: number } | null;
  difficultyRange: { min: number; max: number } | null;
  factionAffinityId: string | null;
  regionAffinityId: string | null;
  scalesWithTier: boolean;
  scalingFormula: string | null;
  variationCount: number;
  combinationRules: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// List all generation templates
proceduralRoutes.get('/templates', async (c) => {
  const db = c.env.DB;
  const templateType = c.req.query('type');

  let query = 'SELECT * FROM generation_templates';
  const params: string[] = [];

  if (templateType) {
    query += ' WHERE template_type = ?';
    params.push(templateType);
  }

  query += ' ORDER BY template_type, name';

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();

  const templates: GenerationTemplate[] = result.results.map((row) => ({
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    templateType: row.template_type as string | null,
    parameterRanges: parseJsonField<Record<string, unknown> | null>(row.parameter_ranges, null),
    requiredTags: parseJsonField<string[] | null>(row.required_tags, null),
    excludedTags: parseJsonField<string[] | null>(row.excluded_tags, null),
    weightModifiers: parseJsonField<Record<string, number> | null>(row.weight_modifiers, null),
    tierRange: parseJsonField<{ min: number; max: number } | null>(row.tier_range, null),
    difficultyRange: parseJsonField<{ min: number; max: number } | null>(row.difficulty_range, null),
    factionAffinityId: row.faction_affinity_id as string | null,
    regionAffinityId: row.region_affinity_id as string | null,
    scalesWithTier: (row.scales_with_tier as number) === 1,
    scalingFormula: row.scaling_formula as string | null,
    variationCount: row.variation_count as number,
    combinationRules: parseJsonField<Record<string, unknown> | null>(row.combination_rules, null),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));

  // Group by type
  const grouped = templates.reduce(
    (acc, t) => {
      const type = t.templateType || 'unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(t);
      return acc;
    },
    {} as Record<string, GenerationTemplate[]>
  );

  return c.json({
    success: true,
    data: {
      templates: templateType ? templates : grouped,
      total: templates.length,
    },
  });
});

// Get specific template
proceduralRoutes.get('/templates/:code', async (c) => {
  const db = c.env.DB;
  const code = c.req.param('code');

  const result = await db
    .prepare('SELECT * FROM generation_templates WHERE code = ?')
    .bind(code)
    .first();

  if (!result) {
    throw new HTTPException(404, { message: 'Template not found' });
  }

  const template: GenerationTemplate = {
    id: result.id as string,
    code: result.code as string,
    name: result.name as string,
    templateType: result.template_type as string | null,
    parameterRanges: parseJsonField<Record<string, unknown> | null>(result.parameter_ranges, null),
    requiredTags: parseJsonField<string[] | null>(result.required_tags, null),
    excludedTags: parseJsonField<string[] | null>(result.excluded_tags, null),
    weightModifiers: parseJsonField<Record<string, number> | null>(result.weight_modifiers, null),
    tierRange: parseJsonField<{ min: number; max: number } | null>(result.tier_range, null),
    difficultyRange: parseJsonField<{ min: number; max: number } | null>(result.difficulty_range, null),
    factionAffinityId: result.faction_affinity_id as string | null,
    regionAffinityId: result.region_affinity_id as string | null,
    scalesWithTier: (result.scales_with_tier as number) === 1,
    scalingFormula: result.scaling_formula as string | null,
    variationCount: result.variation_count as number,
    combinationRules: parseJsonField<Record<string, unknown> | null>(result.combination_rules, null),
    createdAt: result.created_at as string,
    updatedAt: result.updated_at as string,
  };

  return c.json({
    success: true,
    data: { template },
  });
});

// Create generation template
proceduralRoutes.post('/templates', authMiddleware, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  if (!body.code || !body.name) {
    throw new HTTPException(400, { message: 'code and name are required' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO generation_templates (
        id, code, name, template_type, parameter_ranges, required_tags,
        excluded_tags, weight_modifiers, tier_range, difficulty_range,
        faction_affinity_id, region_affinity_id, scales_with_tier,
        scaling_formula, variation_count, combination_rules, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      body.code,
      body.name,
      body.templateType || null,
      body.parameterRanges ? JSON.stringify(body.parameterRanges) : null,
      body.requiredTags ? JSON.stringify(body.requiredTags) : null,
      body.excludedTags ? JSON.stringify(body.excludedTags) : null,
      body.weightModifiers ? JSON.stringify(body.weightModifiers) : null,
      body.tierRange ? JSON.stringify(body.tierRange) : null,
      body.difficultyRange ? JSON.stringify(body.difficultyRange) : null,
      body.factionAffinityId || null,
      body.regionAffinityId || null,
      body.scalesWithTier !== false ? 1 : 0,
      body.scalingFormula || null,
      body.variationCount || 1,
      body.combinationRules ? JSON.stringify(body.combinationRules) : null,
      now,
      now
    )
    .run();

  return c.json(
    {
      success: true,
      data: { id, code: body.code },
    },
    201
  );
});

// Generate content using a template
proceduralRoutes.post('/templates/:code/generate', async (c) => {
  const db = c.env.DB;
  const code = c.req.param('code');
  const body = await c.req.json();

  const template = await db
    .prepare('SELECT * FROM generation_templates WHERE code = ?')
    .bind(code)
    .first();

  if (!template) {
    throw new HTTPException(404, { message: 'Template not found' });
  }

  const tierRange = parseJsonField<{ min: number; max: number } | null>(template.tier_range, null);
  const paramRanges = parseJsonField<Record<string, { min: number; max: number }> | null>(
    template.parameter_ranges,
    null
  );
  const weightMods = parseJsonField<Record<string, number> | null>(template.weight_modifiers, null);

  // Determine effective tier
  const requestedTier = body.tier || 1;
  let effectiveTier = requestedTier;
  if (tierRange) {
    effectiveTier = Math.max(tierRange.min, Math.min(tierRange.max, requestedTier));
  }

  // Generate random values for each parameter
  const generatedParams: Record<string, number> = {};
  if (paramRanges) {
    for (const [param, range] of Object.entries(paramRanges)) {
      const min = range.min || 0;
      const max = range.max || 100;
      let value = Math.random() * (max - min) + min;

      // Apply tier scaling if enabled
      if ((template.scales_with_tier as number) === 1) {
        value *= 1 + (effectiveTier - 1) * 0.1;
      }

      // Apply weight modifiers
      if (weightMods && weightMods[param]) {
        value *= weightMods[param];
      }

      generatedParams[param] = Math.round(value * 100) / 100;
    }
  }

  // Generate variations
  const variationCount = body.variations || template.variation_count || 1;
  const variations: Array<{ seed: string; params: Record<string, number> }> = [];

  for (let i = 0; i < variationCount; i++) {
    const varParams: Record<string, number> = {};
    for (const [param, value] of Object.entries(generatedParams)) {
      // Add small random variance for each variation
      const variance = (Math.random() - 0.5) * 0.2;
      varParams[param] = Math.round(value * (1 + variance) * 100) / 100;
    }
    variations.push({
      seed: crypto.randomUUID().slice(0, 8),
      params: varParams,
    });
  }

  return c.json({
    success: true,
    data: {
      templateCode: code,
      templateType: template.template_type,
      requestedTier,
      effectiveTier,
      baseParams: generatedParams,
      variations,
      metadata: {
        requiredTags: parseJsonField<string[] | null>(template.required_tags, null),
        excludedTags: parseJsonField<string[] | null>(template.excluded_tags, null),
        scalesWithTier: (template.scales_with_tier as number) === 1,
      },
    },
  });
});

// ============================================
// LOOT TABLES
// ============================================

interface LootTable {
  id: string;
  code: string;
  name: string;
  sourceType: string | null;
  sourceTierRange: { min: number; max: number } | null;
  guaranteedItems: Array<{ itemId: string; quantity: number }> | null;
  randomItems: Array<{ itemId: string; weight: number; quantityRange: { min: number; max: number } }> | null;
  currencyRange: { min: number; max: number } | null;
  luckAffects: boolean;
  tierScaling: boolean;
  factionModifiers: Record<string, number> | null;
  regionModifiers: Record<string, number> | null;
  legendaryChance: number;
  nothingChance: number;
  nestedTables: string[] | null;
  mutuallyExclusive: string[] | null;
  createdAt: string;
  updatedAt: string;
}

// List all loot tables
proceduralRoutes.get('/loot', async (c) => {
  const db = c.env.DB;
  const sourceType = c.req.query('source');

  let query = 'SELECT * FROM loot_tables';
  const params: string[] = [];

  if (sourceType) {
    query += ' WHERE source_type = ?';
    params.push(sourceType);
  }

  query += ' ORDER BY source_type, name';

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();

  const tables: LootTable[] = result.results.map((row) => ({
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    sourceType: row.source_type as string | null,
    sourceTierRange: parseJsonField<{ min: number; max: number } | null>(row.source_tier_range, null),
    guaranteedItems: parseJsonField<Array<{ itemId: string; quantity: number }> | null>(row.guaranteed_items, null),
    randomItems: parseJsonField<Array<{ itemId: string; weight: number; quantityRange: { min: number; max: number } }> | null>(row.random_items, null),
    currencyRange: parseJsonField<{ min: number; max: number } | null>(row.currency_range, null),
    luckAffects: (row.luck_affects as number) === 1,
    tierScaling: (row.tier_scaling as number) === 1,
    factionModifiers: parseJsonField<Record<string, number> | null>(row.faction_modifiers, null),
    regionModifiers: parseJsonField<Record<string, number> | null>(row.region_modifiers, null),
    legendaryChance: row.legendary_chance as number,
    nothingChance: row.nothing_chance as number,
    nestedTables: parseJsonField<string[] | null>(row.nested_tables, null),
    mutuallyExclusive: parseJsonField<string[] | null>(row.mutually_exclusive, null),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));

  return c.json({
    success: true,
    data: {
      tables,
      total: tables.length,
    },
  });
});

// Get specific loot table
proceduralRoutes.get('/loot/:code', async (c) => {
  const db = c.env.DB;
  const code = c.req.param('code');

  const result = await db
    .prepare('SELECT * FROM loot_tables WHERE code = ?')
    .bind(code)
    .first();

  if (!result) {
    throw new HTTPException(404, { message: 'Loot table not found' });
  }

  const table: LootTable = {
    id: result.id as string,
    code: result.code as string,
    name: result.name as string,
    sourceType: result.source_type as string | null,
    sourceTierRange: parseJsonField<{ min: number; max: number } | null>(result.source_tier_range, null),
    guaranteedItems: parseJsonField<Array<{ itemId: string; quantity: number }> | null>(result.guaranteed_items, null),
    randomItems: parseJsonField<Array<{ itemId: string; weight: number; quantityRange: { min: number; max: number } }> | null>(result.random_items, null),
    currencyRange: parseJsonField<{ min: number; max: number } | null>(result.currency_range, null),
    luckAffects: (result.luck_affects as number) === 1,
    tierScaling: (result.tier_scaling as number) === 1,
    factionModifiers: parseJsonField<Record<string, number> | null>(result.faction_modifiers, null),
    regionModifiers: parseJsonField<Record<string, number> | null>(result.region_modifiers, null),
    legendaryChance: result.legendary_chance as number,
    nothingChance: result.nothing_chance as number,
    nestedTables: parseJsonField<string[] | null>(result.nested_tables, null),
    mutuallyExclusive: parseJsonField<string[] | null>(result.mutually_exclusive, null),
    createdAt: result.created_at as string,
    updatedAt: result.updated_at as string,
  };

  return c.json({
    success: true,
    data: { table },
  });
});

// Create loot table
proceduralRoutes.post('/loot', authMiddleware, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  if (!body.code || !body.name) {
    throw new HTTPException(400, { message: 'code and name are required' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO loot_tables (
        id, code, name, source_type, source_tier_range,
        guaranteed_items, random_items, currency_range,
        luck_affects, tier_scaling, faction_modifiers, region_modifiers,
        legendary_chance, nothing_chance, nested_tables, mutually_exclusive,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      body.code,
      body.name,
      body.sourceType || null,
      body.sourceTierRange ? JSON.stringify(body.sourceTierRange) : null,
      body.guaranteedItems ? JSON.stringify(body.guaranteedItems) : null,
      body.randomItems ? JSON.stringify(body.randomItems) : null,
      body.currencyRange ? JSON.stringify(body.currencyRange) : null,
      body.luckAffects !== false ? 1 : 0,
      body.tierScaling !== false ? 1 : 0,
      body.factionModifiers ? JSON.stringify(body.factionModifiers) : null,
      body.regionModifiers ? JSON.stringify(body.regionModifiers) : null,
      body.legendaryChance || 0.001,
      body.nothingChance || 0.1,
      body.nestedTables ? JSON.stringify(body.nestedTables) : null,
      body.mutuallyExclusive ? JSON.stringify(body.mutuallyExclusive) : null,
      now,
      now
    )
    .run();

  return c.json(
    {
      success: true,
      data: { id, code: body.code },
    },
    201
  );
});

// Roll on a loot table
proceduralRoutes.post('/loot/:code/roll', async (c) => {
  const db = c.env.DB;
  const code = c.req.param('code');
  const body = await c.req.json();

  const result = await db
    .prepare('SELECT * FROM loot_tables WHERE code = ?')
    .bind(code)
    .first();

  if (!result) {
    throw new HTTPException(404, { message: 'Loot table not found' });
  }

  const luckBonus = body.luck || 0;
  const tier = body.tier || 1;
  const factionId = body.factionId;
  const regionId = body.regionId;

  // Check for nothing roll
  let nothingChance = result.nothing_chance as number;
  if ((result.luck_affects as number) === 1) {
    nothingChance = Math.max(0, nothingChance - luckBonus * 0.01);
  }

  if (Math.random() < nothingChance) {
    return c.json({
      success: true,
      data: {
        tableCode: code,
        rolled: 'nothing',
        items: [],
        currency: 0,
        legendary: false,
      },
    });
  }

  const items: Array<{ itemId: string; quantity: number; isLegendary: boolean }> = [];
  let totalCurrency = 0;
  let gotLegendary = false;

  // Guaranteed items
  const guaranteed = parseJsonField<Array<{ itemId: string; quantity: number }> | null>(result.guaranteed_items, null);
  if (guaranteed) {
    for (const item of guaranteed) {
      let quantity = item.quantity || 1;
      if ((result.tier_scaling as number) === 1) {
        quantity = Math.ceil(quantity * (1 + (tier - 1) * 0.2));
      }
      items.push({ itemId: item.itemId, quantity, isLegendary: false });
    }
  }

  // Random items
  const randomItems = parseJsonField<Array<{ itemId: string; weight: number; quantityRange?: { min: number; max: number } }> | null>(result.random_items, null);
  if (randomItems && randomItems.length > 0) {
    // Calculate total weight
    let totalWeight = randomItems.reduce((sum, item) => sum + (item.weight || 1), 0);

    // Apply modifiers
    const factionMods = parseJsonField<Record<string, number> | null>(result.faction_modifiers, null);
    const regionMods = parseJsonField<Record<string, number> | null>(result.region_modifiers, null);

    if (factionId && factionMods && factionMods[factionId]) {
      totalWeight *= factionMods[factionId];
    }
    if (regionId && regionMods && regionMods[regionId]) {
      totalWeight *= regionMods[regionId];
    }

    // Roll for random item
    const roll = Math.random() * totalWeight;
    let accumulated = 0;

    for (const item of randomItems) {
      accumulated += item.weight || 1;
      if (roll <= accumulated) {
        const range = item.quantityRange || { min: 1, max: 1 };
        let quantity = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        if ((result.tier_scaling as number) === 1) {
          quantity = Math.ceil(quantity * (1 + (tier - 1) * 0.2));
        }
        items.push({ itemId: item.itemId, quantity, isLegendary: false });
        break;
      }
    }
  }

  // Currency
  const currencyRange = parseJsonField<{ min: number; max: number } | null>(result.currency_range, null);
  if (currencyRange) {
    totalCurrency = Math.floor(Math.random() * (currencyRange.max - currencyRange.min + 1)) + currencyRange.min;
    if ((result.tier_scaling as number) === 1) {
      totalCurrency = Math.ceil(totalCurrency * (1 + (tier - 1) * 0.3));
    }
  }

  // Legendary check
  let legendaryChance = result.legendary_chance as number;
  if ((result.luck_affects as number) === 1) {
    legendaryChance *= 1 + luckBonus * 0.1;
  }
  if (Math.random() < legendaryChance) {
    gotLegendary = true;
    // Mark last item as legendary or add bonus
    const lastItem = items[items.length - 1];
    if (lastItem) {
      lastItem.isLegendary = true;
    }
  }

  return c.json({
    success: true,
    data: {
      tableCode: code,
      rolled: 'success',
      items,
      currency: totalCurrency,
      legendary: gotLegendary,
      modifiers: {
        luck: luckBonus,
        tier,
        factionId,
        regionId,
      },
    },
  });
});

// Analyze loot table drop rates
proceduralRoutes.get('/loot/:code/analyze', async (c) => {
  const db = c.env.DB;
  const code = c.req.param('code');
  // simulations query param reserved for future Monte Carlo analysis

  const result = await db
    .prepare('SELECT * FROM loot_tables WHERE code = ?')
    .bind(code)
    .first();

  if (!result) {
    throw new HTTPException(404, { message: 'Loot table not found' });
  }

  const nothingChance = result.nothing_chance as number;
  const legendaryChance = result.legendary_chance as number;
  const guaranteed = parseJsonField<Array<{ itemId: string; quantity: number }> | null>(result.guaranteed_items, null);
  const randomItems = parseJsonField<Array<{ itemId: string; weight: number }> | null>(result.random_items, null);
  const currencyRange = parseJsonField<{ min: number; max: number } | null>(result.currency_range, null);

  // Calculate theoretical probabilities
  const itemProbabilities: Record<string, number> = {};

  if (guaranteed) {
    for (const item of guaranteed) {
      itemProbabilities[item.itemId] = (1 - nothingChance) * 100;
    }
  }

  if (randomItems && randomItems.length > 0) {
    const totalWeight = randomItems.reduce((sum, item) => sum + (item.weight || 1), 0);
    for (const item of randomItems) {
      const chance = ((item.weight || 1) / totalWeight) * (1 - nothingChance) * 100;
      itemProbabilities[item.itemId] = Math.round(chance * 100) / 100;
    }
  }

  return c.json({
    success: true,
    data: {
      tableCode: code,
      analysis: {
        nothingChance: nothingChance * 100,
        legendaryChance: legendaryChance * 100,
        itemProbabilities,
        guaranteedItemCount: guaranteed?.length || 0,
        randomItemPoolSize: randomItems?.length || 0,
        currencyRange: currencyRange || null,
        averageCurrency: currencyRange
          ? Math.round((currencyRange.min + currencyRange.max) / 2)
          : 0,
      },
      metadata: {
        luckAffects: (result.luck_affects as number) === 1,
        tierScaling: (result.tier_scaling as number) === 1,
        hasNestedTables: !!parseJsonField<string[] | null>(result.nested_tables, null),
      },
    },
  });
});

export default proceduralRoutes;
