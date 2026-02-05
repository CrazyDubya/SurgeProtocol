/**
 * Surge Protocol - Crafting/Fabrication System Routes
 *
 * The Fabricator specialization allows characters to craft items from components.
 * Recipes are derived from craftable item definitions.
 *
 * Endpoints:
 * - GET /crafting/recipes - Browse available recipes
 * - GET /crafting/recipes/:id - Get recipe details with requirements
 * - GET /crafting/components - Browse component catalog
 * - GET /crafting/components/:id - Get component details and uses
 * - GET /crafting/known - Get character's learned recipes
 * - POST /crafting/learn/:recipeId - Learn a recipe
 * - GET /crafting/available - Get recipes craftable with current components
 * - POST /crafting/craft/:recipeId - Craft an item
 * - GET /crafting/workbench - Get current workbench state
 * - POST /crafting/workbench/add - Add components to workbench
 * - POST /crafting/workbench/remove - Remove components from workbench
 * - POST /crafting/workbench/clear - Clear workbench
 * - POST /crafting/disassemble/:inventoryId - Disassemble an item for components
 * - GET /crafting/stats - Get character's crafting statistics
 * - GET /crafting/specializations - Get crafting specialization bonuses
 * - POST /crafting/experiment - Attempt experimental crafting
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  authMiddleware,
  requireCharacterMiddleware,
  type AuthVariables,
} from '../../middleware/auth';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

// Types for future use (exported for other modules)
export interface RecipeComponent {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  optional: boolean;
  alternatives?: string[];
}

export interface RecipeOutput {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  qualityRange: { min: number; max: number };
}

export interface CraftingRequirements {
  skillLevel: number;
  skillId: string | null;
  tier: number;
  workbenchType: string | null;
  specialization: string | null;
  tools: string[];
}

export interface WorkbenchItem {
  inventoryId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const learnRecipeSchema = z.object({
  source: z.enum(['trainer', 'schematic', 'discovery']).optional().default('discovery'),
  schematicItemId: z.string().optional(),
});

const craftSchema = z.object({
  useWorkbench: z.boolean().optional().default(true),
  componentOverrides: z.array(z.object({
    componentSlot: z.number(),
    inventoryItemId: z.string(),
  })).optional(),
  qualityFocus: z.enum(['speed', 'quality', 'efficiency']).optional().default('quality'),
});

const workbenchAddSchema = z.object({
  inventoryItemId: z.string(),
  quantity: z.number().int().min(1).default(1),
});

const workbenchRemoveSchema = z.object({
  workbenchSlot: z.number().int().min(0),
  quantity: z.number().int().min(1).optional(),
});

const experimentSchema = z.object({
  componentIds: z.array(z.string()).min(2).max(6),
  technique: z.enum(['combine', 'modify', 'enhance', 'corrupt']).default('combine'),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function parseJsonField<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

function generateCraftId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CRF-${timestamp}-${random}`;
}

interface ItemRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  item_type: string | null;
  item_subtype: string | null;
  rarity: string;
  quality_tier: number;
  base_price: number;
  weight_kg: number;
  required_tier: number;
  is_craftable: number;
  recipe_id: string | null;
  is_component: number;
  component_categories: string | null;
  manufacturer: string | null;
}

interface ComponentInfo {
  category: string;
  quantity: number;
  optional: boolean;
}

function formatRecipe(item: ItemRow, components: ComponentInfo[] | null) {
  const parsedCategories = parseJsonField<string[]>(item.component_categories, []);

  return {
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description,
    outputItem: {
      id: item.id,
      code: item.code,
      name: item.name,
      type: item.item_type,
      subtype: item.item_subtype,
      rarity: item.rarity,
      qualityTier: item.quality_tier,
    },
    requirements: {
      tier: item.required_tier,
      skillLevel: Math.max(1, item.quality_tier),
      skillId: 'FABRICATION',
    },
    components: components || parsedCategories.map((cat, idx) => ({
      category: cat,
      quantity: 1,
      optional: false,
      slot: idx,
    })),
    basePrice: item.base_price,
    craftTime: Math.max(30, item.quality_tier * 60), // seconds
    xpReward: item.quality_tier * 25,
    difficulty: item.quality_tier,
  };
}

function formatComponent(item: ItemRow) {
  const categories = parseJsonField<string[]>(item.component_categories, []);

  return {
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description,
    type: item.item_type,
    subtype: item.item_subtype,
    rarity: item.rarity,
    qualityTier: item.quality_tier,
    basePrice: item.base_price,
    weight: item.weight_kg,
    categories,
    manufacturer: item.manufacturer,
  };
}

// =============================================================================
// ROUTES
// =============================================================================

export const craftingRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Apply auth middleware to all routes
craftingRoutes.use('*', authMiddleware());

// -----------------------------------------------------------------------------
// RECIPE CATALOG
// -----------------------------------------------------------------------------

/**
 * GET /crafting/recipes
 * Browse available recipes (craftable items).
 */
craftingRoutes.get('/recipes', async (c) => {
  const category = c.req.query('category');
  const rarity = c.req.query('rarity');
  const maxTier = c.req.query('maxTier');
  const search = c.req.query('search');
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  let query = `
    SELECT id, code, name, description, item_type, item_subtype, rarity,
           quality_tier, base_price, weight_kg, required_tier,
           is_craftable, recipe_id, component_categories, manufacturer
    FROM item_definitions
    WHERE is_craftable = 1
  `;

  const params: (string | number)[] = [];

  if (category) {
    query += ` AND item_type = ?`;
    params.push(category);
  }

  if (rarity) {
    query += ` AND rarity = ?`;
    params.push(rarity);
  }

  if (maxTier) {
    query += ` AND required_tier <= ?`;
    params.push(parseInt(maxTier, 10));
  }

  if (search) {
    query += ` AND (name LIKE ? OR description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY required_tier, rarity DESC, name LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const stmt = c.env.DB.prepare(query);
  const result = await stmt.bind(...params).all<ItemRow>();

  // Count total
  let countQuery = `SELECT COUNT(*) as total FROM item_definitions WHERE is_craftable = 1`;
  const countParams: (string | number)[] = [];

  if (category) {
    countQuery += ` AND item_type = ?`;
    countParams.push(category);
  }
  if (rarity) {
    countQuery += ` AND rarity = ?`;
    countParams.push(rarity);
  }
  if (maxTier) {
    countQuery += ` AND required_tier <= ?`;
    countParams.push(parseInt(maxTier, 10));
  }
  if (search) {
    countQuery += ` AND (name LIKE ? OR description LIKE ?)`;
    countParams.push(`%${search}%`, `%${search}%`);
  }

  const countStmt = c.env.DB.prepare(countQuery);
  const countResult = countParams.length > 0
    ? await countStmt.bind(...countParams).first<{ total: number }>()
    : await countStmt.first<{ total: number }>();

  const recipes = result.results.map(item => formatRecipe(item, null));

  // Group by category
  const byCategory: Record<string, typeof recipes> = {};
  for (const recipe of recipes) {
    const cat = recipe.outputItem.type || 'OTHER';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat]!.push(recipe);
  }

  return c.json({
    success: true,
    data: {
      recipes,
      byCategory,
      pagination: {
        total: countResult?.total || 0,
        limit,
        offset,
        hasMore: offset + recipes.length < (countResult?.total || 0),
      },
    },
  });
});

/**
 * GET /crafting/recipes/:id
 * Get detailed recipe information.
 */
craftingRoutes.get('/recipes/:id', async (c) => {
  const recipeId = c.req.param('id');

  const item = await c.env.DB
    .prepare(
      `SELECT * FROM item_definitions
       WHERE (id = ? OR code = ?) AND is_craftable = 1`
    )
    .bind(recipeId, recipeId)
    .first<ItemRow & {
      required_attributes: string | null;
      required_skills: string | null;
    }>();

  if (!item) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Recipe not found' }],
    }, 404);
  }

  // Get components that can be used
  const componentCategories = parseJsonField<string[]>(item.component_categories, []);

  const compatibleComponents: Record<string, ItemRow[]> = {};
  for (const category of componentCategories) {
    const components = await c.env.DB
      .prepare(
        `SELECT id, code, name, description, item_type, item_subtype, rarity,
                quality_tier, base_price, weight_kg, required_tier,
                is_craftable, recipe_id, is_component, component_categories, manufacturer
         FROM item_definitions
         WHERE is_component = 1 AND component_categories LIKE ?
         ORDER BY quality_tier, rarity DESC`
      )
      .bind(`%"${category}"%`)
      .all<ItemRow>();

    compatibleComponents[category] = components.results;
  }

  const recipe = formatRecipe(item, null);
  const requirements = {
    tier: item.required_tier,
    skillLevel: Math.max(1, item.quality_tier),
    skillId: 'FABRICATION',
    attributes: parseJsonField<Record<string, number>>(item.required_attributes, {}),
    skills: parseJsonField<Record<string, number>>(item.required_skills, {}),
  };

  return c.json({
    success: true,
    data: {
      recipe: {
        ...recipe,
        requirements,
        compatibleComponents,
        craftingTips: getCraftingTips(item.quality_tier, item.rarity),
      },
    },
  });
});

function getCraftingTips(qualityTier: number, rarity: string): string[] {
  const tips: string[] = [];

  if (qualityTier >= 3) {
    tips.push('Higher Fabrication skill increases success chance');
  }
  if (qualityTier >= 5) {
    tips.push('Consider using quality focus for better output');
    tips.push('A specialized workbench may be required');
  }
  if (rarity === 'LEGENDARY' || rarity === 'UNIQUE') {
    tips.push('Experimental components may yield unique properties');
    tips.push('Failure may consume rare components');
  }
  if (rarity === 'RARE' || rarity === 'EPIC') {
    tips.push('Higher quality components improve output quality');
  }

  return tips;
}

// -----------------------------------------------------------------------------
// COMPONENT CATALOG
// -----------------------------------------------------------------------------

/**
 * GET /crafting/components
 * Browse available components.
 */
craftingRoutes.get('/components', async (c) => {
  const category = c.req.query('category');
  const rarity = c.req.query('rarity');
  const search = c.req.query('search');
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  let query = `
    SELECT id, code, name, description, item_type, item_subtype, rarity,
           quality_tier, base_price, weight_kg, required_tier,
           is_craftable, recipe_id, is_component, component_categories, manufacturer
    FROM item_definitions
    WHERE is_component = 1
  `;

  const params: (string | number)[] = [];

  if (category) {
    query += ` AND component_categories LIKE ?`;
    params.push(`%"${category}"%`);
  }

  if (rarity) {
    query += ` AND rarity = ?`;
    params.push(rarity);
  }

  if (search) {
    query += ` AND (name LIKE ? OR description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY quality_tier, rarity DESC, name LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = await c.env.DB.prepare(query).bind(...params).all<ItemRow>();

  const components = result.results.map(formatComponent);

  // Group by category
  const byCategory: Record<string, typeof components> = {};
  for (const comp of components) {
    for (const cat of comp.categories) {
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat]!.push(comp);
    }
  }

  return c.json({
    success: true,
    data: {
      components,
      byCategory,
      count: components.length,
    },
  });
});

/**
 * GET /crafting/components/:id
 * Get component details and what it can be used for.
 */
craftingRoutes.get('/components/:id', async (c) => {
  const componentId = c.req.param('id');

  const component = await c.env.DB
    .prepare(
      `SELECT * FROM item_definitions
       WHERE (id = ? OR code = ?) AND is_component = 1`
    )
    .bind(componentId, componentId)
    .first<ItemRow>();

  if (!component) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Component not found' }],
    }, 404);
  }

  const categories = parseJsonField<string[]>(component.component_categories, []);

  // Find recipes that use this component category
  const usedInRecipes: ItemRow[] = [];
  for (const category of categories) {
    const recipes = await c.env.DB
      .prepare(
        `SELECT id, code, name, description, item_type, item_subtype, rarity,
                quality_tier, base_price, weight_kg, required_tier,
                is_craftable, recipe_id, is_component, component_categories, manufacturer
         FROM item_definitions
         WHERE is_craftable = 1 AND component_categories LIKE ?
         ORDER BY required_tier, rarity DESC
         LIMIT 20`
      )
      .bind(`%"${category}"%`)
      .all<ItemRow>();

    for (const r of recipes.results) {
      if (!usedInRecipes.find(x => x.id === r.id)) {
        usedInRecipes.push(r);
      }
    }
  }

  return c.json({
    success: true,
    data: {
      component: formatComponent(component),
      categories,
      usedInRecipes: usedInRecipes.map(r => ({
        id: r.id,
        code: r.code,
        name: r.name,
        type: r.item_type,
        rarity: r.rarity,
        tier: r.required_tier,
      })),
    },
  });
});

// -----------------------------------------------------------------------------
// CHARACTER CRAFTING
// -----------------------------------------------------------------------------

/**
 * GET /crafting/known
 * Get character's learned recipes.
 */
craftingRoutes.get('/known', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;

  // Get character's crafting skill and specialization
  const fabricationSkill = await c.env.DB
    .prepare(
      `SELECT cs.current_level, cs.current_xp, sd.name as skill_name
       FROM character_skills cs
       JOIN skill_definitions sd ON cs.skill_id = sd.id
       WHERE cs.character_id = ? AND sd.code = 'FABRICATION'`
    )
    .bind(characterId)
    .first<{ current_level: number; current_xp: number; skill_name: string }>();

  // Check for Fabricator specialization
  const hasFabricator = await c.env.DB
    .prepare(
      `SELECT 1 FROM character_specializations cs
       JOIN specializations s ON cs.specialization_id = s.id
       WHERE cs.character_id = ? AND s.code = 'MCH_FAB' AND cs.is_active = 1`
    )
    .bind(characterId)
    .first();

  // Get learned recipes (stored as character_recipes or derived from skill level)
  // For now, characters can craft items up to their fabrication skill level
  const skillLevel = fabricationSkill?.current_level || 0;
  const tierAccess = Math.min(5, Math.ceil(skillLevel / 2));

  const accessibleRecipes = await c.env.DB
    .prepare(
      `SELECT id, code, name, description, item_type, item_subtype, rarity,
              quality_tier, base_price, weight_kg, required_tier,
              is_craftable, recipe_id, component_categories, manufacturer
       FROM item_definitions
       WHERE is_craftable = 1 AND required_tier <= ?
       ORDER BY required_tier, rarity DESC, name`
    )
    .bind(tierAccess)
    .all<ItemRow>();

  const recipes = accessibleRecipes.results.map(item => formatRecipe(item, null));

  // Group by mastery level
  const byMastery: Record<string, typeof recipes> = {
    mastered: [],
    learning: [],
    discovered: [],
  };

  for (const recipe of recipes) {
    if (skillLevel >= recipe.difficulty * 2) {
      byMastery.mastered!.push(recipe);
    } else if (skillLevel >= recipe.difficulty) {
      byMastery.learning!.push(recipe);
    } else {
      byMastery.discovered!.push(recipe);
    }
  }

  return c.json({
    success: true,
    data: {
      craftingSkill: {
        level: skillLevel,
        xp: fabricationSkill?.current_xp || 0,
        name: fabricationSkill?.skill_name || 'Fabrication',
      },
      hasFabricatorSpec: !!hasFabricator,
      tierAccess,
      recipes,
      byMastery,
      totalKnown: recipes.length,
      bonuses: hasFabricator ? {
        qualityBonus: 10,
        speedBonus: 20,
        componentSaving: 15,
        experimentalSuccess: 25,
      } : null,
    },
  });
});

/**
 * POST /crafting/learn/:recipeId
 * Learn a new recipe.
 */
craftingRoutes.post('/learn/:recipeId', requireCharacterMiddleware(), zValidator('json', learnRecipeSchema), async (c) => {
  const characterId = c.get('characterId')!;
  const recipeId = c.req.param('recipeId');
  const { source, schematicItemId } = c.req.valid('json');

  // Get the recipe
  const recipe = await c.env.DB
    .prepare(
      `SELECT * FROM item_definitions
       WHERE (id = ? OR code = ?) AND is_craftable = 1`
    )
    .bind(recipeId, recipeId)
    .first<ItemRow>();

  if (!recipe) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Recipe not found' }],
    }, 404);
  }

  // Check tier requirement
  const character = await c.env.DB
    .prepare('SELECT current_tier FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_tier: number }>();

  if (!character || character.current_tier < recipe.required_tier) {
    return c.json({
      success: false,
      errors: [{
        code: 'TIER_REQUIREMENT',
        message: `Requires Tier ${recipe.required_tier} to learn`,
      }],
    }, 400);
  }

  // If using schematic, consume it
  if (source === 'schematic' && schematicItemId) {
    const schematic = await c.env.DB
      .prepare(
        `SELECT ci.id, ci.quantity
         FROM character_inventory ci
         WHERE ci.id = ? AND ci.character_id = ?`
      )
      .bind(schematicItemId, characterId)
      .first<{ id: string; quantity: number }>();

    if (!schematic) {
      return c.json({
        success: false,
        errors: [{ code: 'NO_SCHEMATIC', message: 'Schematic not found in inventory' }],
      }, 400);
    }

    // Consume schematic
    if (schematic.quantity > 1) {
      await c.env.DB
        .prepare('UPDATE character_inventory SET quantity = quantity - 1 WHERE id = ?')
        .bind(schematic.id)
        .run();
    } else {
      await c.env.DB
        .prepare('DELETE FROM character_inventory WHERE id = ?')
        .bind(schematic.id)
        .run();
    }
  }

  // Grant XP for learning
  const xpGain = recipe.quality_tier * 50;
  await c.env.DB
    .prepare(
      `UPDATE character_skills
       SET current_xp = current_xp + ?, updated_at = datetime('now')
       WHERE character_id = ? AND skill_id IN (
         SELECT id FROM skill_definitions WHERE code = 'FABRICATION'
       )`
    )
    .bind(xpGain, characterId)
    .run();

  return c.json({
    success: true,
    data: {
      learned: {
        id: recipe.id,
        code: recipe.code,
        name: recipe.name,
      },
      source,
      xpGained: xpGain,
      message: `Learned recipe: ${recipe.name}`,
    },
  });
});

/**
 * GET /crafting/available
 * Get recipes that can be crafted with current inventory.
 */
craftingRoutes.get('/available', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;

  // Get character's components
  const inventory = await c.env.DB
    .prepare(
      `SELECT ci.id, ci.quantity, id.id as item_id, id.code, id.name,
              id.component_categories, id.quality_tier
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_definition_id = id.id
       WHERE ci.character_id = ? AND id.is_component = 1`
    )
    .bind(characterId)
    .all<{
      id: string;
      quantity: number;
      item_id: string;
      code: string;
      name: string;
      component_categories: string | null;
      quality_tier: number;
    }>();

  // Build category inventory
  const categoryInventory: Record<string, { count: number; maxQuality: number }> = {};
  for (const item of inventory.results) {
    const categories = parseJsonField<string[]>(item.component_categories, []);
    for (const cat of categories) {
      if (!categoryInventory[cat]) {
        categoryInventory[cat] = { count: 0, maxQuality: 0 };
      }
      categoryInventory[cat]!.count += item.quantity;
      categoryInventory[cat]!.maxQuality = Math.max(
        categoryInventory[cat]!.maxQuality,
        item.quality_tier
      );
    }
  }

  // Get craftable recipes
  const recipes = await c.env.DB
    .prepare(
      `SELECT id, code, name, description, item_type, item_subtype, rarity,
              quality_tier, base_price, weight_kg, required_tier,
              is_craftable, recipe_id, component_categories, manufacturer
       FROM item_definitions
       WHERE is_craftable = 1
       ORDER BY required_tier, quality_tier`
    )
    .all<ItemRow>();

  // Filter to craftable recipes
  const craftable: Array<{
    recipe: ReturnType<typeof formatRecipe>;
    hasAllComponents: boolean;
    missingCategories: string[];
    estimatedQuality: number;
  }> = [];

  for (const item of recipes.results) {
    const requiredCategories = parseJsonField<string[]>(item.component_categories, []);
    const missing: string[] = [];
    let totalQuality = 0;
    let hasAll = true;

    for (const cat of requiredCategories) {
      if (!categoryInventory[cat] || categoryInventory[cat]!.count < 1) {
        missing.push(cat);
        hasAll = false;
      } else {
        totalQuality += categoryInventory[cat]!.maxQuality;
      }
    }

    if (hasAll || missing.length <= 1) {
      const avgQuality = requiredCategories.length > 0
        ? totalQuality / requiredCategories.length
        : item.quality_tier;

      craftable.push({
        recipe: formatRecipe(item, null),
        hasAllComponents: hasAll,
        missingCategories: missing,
        estimatedQuality: Math.round(avgQuality * 10) / 10,
      });
    }
  }

  // Sort: craftable first, then by tier
  craftable.sort((a, b) => {
    if (a.hasAllComponents !== b.hasAllComponents) {
      return a.hasAllComponents ? -1 : 1;
    }
    return a.recipe.requirements.tier - b.recipe.requirements.tier;
  });

  return c.json({
    success: true,
    data: {
      craftable: craftable.filter(r => r.hasAllComponents),
      almostCraftable: craftable.filter(r => !r.hasAllComponents),
      componentInventory: categoryInventory,
      totalComponents: inventory.results.reduce((sum, i) => sum + i.quantity, 0),
    },
  });
});

/**
 * POST /crafting/craft/:recipeId
 * Craft an item from components.
 */
craftingRoutes.post('/craft/:recipeId', requireCharacterMiddleware(), zValidator('json', craftSchema), async (c) => {
  const characterId = c.get('characterId')!;
  const recipeId = c.req.param('recipeId');
  const { qualityFocus } = c.req.valid('json');

  // Get the recipe
  const recipe = await c.env.DB
    .prepare(
      `SELECT * FROM item_definitions
       WHERE (id = ? OR code = ?) AND is_craftable = 1`
    )
    .bind(recipeId, recipeId)
    .first<ItemRow>();

  if (!recipe) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Recipe not found' }],
    }, 404);
  }

  // Check tier requirement
  const character = await c.env.DB
    .prepare('SELECT id, current_tier FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ id: string; current_tier: number }>();

  if (!character || character.current_tier < recipe.required_tier) {
    return c.json({
      success: false,
      errors: [{
        code: 'TIER_REQUIREMENT',
        message: `Requires Tier ${recipe.required_tier}`,
      }],
    }, 400);
  }

  // Get fabrication skill
  const fabSkill = await c.env.DB
    .prepare(
      `SELECT current_level FROM character_skills cs
       JOIN skill_definitions sd ON cs.skill_id = sd.id
       WHERE cs.character_id = ? AND sd.code = 'FABRICATION'`
    )
    .bind(characterId)
    .first<{ current_level: number }>();

  const skillLevel = fabSkill?.current_level || 0;

  // Check Fabricator specialization
  const hasFabricator = await c.env.DB
    .prepare(
      `SELECT 1 FROM character_specializations cs
       JOIN specializations s ON cs.specialization_id = s.id
       WHERE cs.character_id = ? AND s.code = 'MCH_FAB' AND cs.is_active = 1`
    )
    .bind(characterId)
    .first();

  // Get required components
  const requiredCategories = parseJsonField<string[]>(recipe.component_categories, []);

  // Find and consume components from inventory
  const consumedComponents: Array<{ name: string; quantity: number; quality: number }> = [];
  let totalComponentQuality = 0;

  for (const category of requiredCategories) {
    // Find best available component in this category
    const component = await c.env.DB
      .prepare(
        `SELECT ci.id, ci.quantity, id.name, id.quality_tier, id.component_categories
         FROM character_inventory ci
         JOIN item_definitions id ON ci.item_definition_id = id.id
         WHERE ci.character_id = ? AND id.is_component = 1
           AND id.component_categories LIKE ?
         ORDER BY id.quality_tier DESC
         LIMIT 1`
      )
      .bind(characterId, `%"${category}"%`)
      .first<{
        id: string;
        quantity: number;
        name: string;
        quality_tier: number;
        component_categories: string;
      }>();

    if (!component) {
      return c.json({
        success: false,
        errors: [{
          code: 'MISSING_COMPONENT',
          message: `Missing component for category: ${category}`,
        }],
      }, 400);
    }

    // Consume the component
    if (component.quantity > 1) {
      await c.env.DB
        .prepare('UPDATE character_inventory SET quantity = quantity - 1 WHERE id = ?')
        .bind(component.id)
        .run();
    } else {
      await c.env.DB
        .prepare('DELETE FROM character_inventory WHERE id = ?')
        .bind(component.id)
        .run();
    }

    consumedComponents.push({
      name: component.name,
      quantity: 1,
      quality: component.quality_tier,
    });
    totalComponentQuality += component.quality_tier;
  }

  // Calculate crafting success and quality
  const avgComponentQuality = requiredCategories.length > 0
    ? totalComponentQuality / requiredCategories.length
    : recipe.quality_tier;

  const baseSuccess = 50 + skillLevel * 5;
  const qualityModifier = qualityFocus === 'quality' ? 10 : (qualityFocus === 'speed' ? -10 : 0);
  const specBonus = hasFabricator ? 15 : 0;
  const successChance = Math.min(95, baseSuccess + qualityModifier + specBonus);

  const roll = Math.random() * 100;
  const success = roll < successChance;
  const criticalSuccess = roll < successChance / 4;

  if (!success) {
    // Crafting failed - components already consumed
    const xpGain = Math.floor(recipe.quality_tier * 10);
    await c.env.DB
      .prepare(
        `UPDATE character_skills
         SET current_xp = current_xp + ?, times_used = times_used + 1, failures = failures + 1,
             last_used = datetime('now'), updated_at = datetime('now')
         WHERE character_id = ? AND skill_id IN (
           SELECT id FROM skill_definitions WHERE code = 'FABRICATION'
         )`
      )
      .bind(xpGain, characterId)
      .run();

    return c.json({
      success: false,
      errors: [{
        code: 'CRAFT_FAILED',
        message: 'Crafting failed! Components were consumed.',
      }],
      data: {
        consumedComponents,
        xpGained: xpGain,
        roll: Math.round(roll),
        needed: Math.round(successChance),
      },
    }, 400);
  }

  // Calculate output quality
  let outputQuality = Math.round(
    (avgComponentQuality * 0.4 + skillLevel * 0.3 + recipe.quality_tier * 0.3)
    * (qualityFocus === 'quality' ? 1.15 : 1.0)
    * (hasFabricator ? 1.1 : 1.0)
    * (criticalSuccess ? 1.25 : 1.0)
  );
  outputQuality = Math.max(1, Math.min(10, outputQuality));

  // Create the crafted item
  const { nanoid } = await import('nanoid');
  const craftedItemId = nanoid();

  await c.env.DB
    .prepare(
      `INSERT INTO character_inventory
       (id, character_id, item_definition_id, quantity, acquired_at, acquired_from, acquired_from_id)
       VALUES (?, ?, ?, 1, datetime('now'), 'CRAFTING', ?)`
    )
    .bind(craftedItemId, characterId, recipe.id, generateCraftId())
    .run();

  // Grant XP
  const xpGain = recipe.quality_tier * 25 * (criticalSuccess ? 2 : 1);
  await c.env.DB
    .prepare(
      `UPDATE character_skills
       SET current_xp = current_xp + ?, times_used = times_used + 1, successes = successes + 1,
           ${criticalSuccess ? 'critical_successes = critical_successes + 1,' : ''}
           last_used = datetime('now'), updated_at = datetime('now')
       WHERE character_id = ? AND skill_id IN (
         SELECT id FROM skill_definitions WHERE code = 'FABRICATION'
       )`
    )
    .bind(xpGain, characterId)
    .run();

  return c.json({
    success: true,
    data: {
      crafted: {
        inventoryId: craftedItemId,
        itemId: recipe.id,
        code: recipe.code,
        name: recipe.name,
        rarity: recipe.rarity,
        quality: outputQuality,
      },
      consumedComponents,
      criticalSuccess,
      xpGained: xpGain,
      message: criticalSuccess
        ? `Critical success! Crafted ${recipe.name} with exceptional quality!`
        : `Successfully crafted ${recipe.name}`,
    },
  });
});

// -----------------------------------------------------------------------------
// WORKBENCH
// -----------------------------------------------------------------------------

/**
 * GET /crafting/workbench
 * Get current workbench state (temporary crafting storage).
 */
craftingRoutes.get('/workbench', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;

  // Workbench is stored in character data or a separate table
  // For simplicity, we'll use a virtual workbench based on flagged inventory items
  const workbenchItems = await c.env.DB
    .prepare(
      `SELECT ci.id, ci.quantity, id.code, id.name, id.component_categories, id.quality_tier
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_definition_id = id.id
       WHERE ci.character_id = ? AND ci.storage_location = 'WORKBENCH'
       ORDER BY ci.sort_order`
    )
    .bind(characterId)
    .all<{
      id: string;
      quantity: number;
      code: string;
      name: string;
      component_categories: string | null;
      quality_tier: number;
    }>();

  const items = workbenchItems.results.map((item, idx) => ({
    slot: idx,
    inventoryId: item.id,
    code: item.code,
    name: item.name,
    quantity: item.quantity,
    quality: item.quality_tier,
    categories: parseJsonField<string[]>(item.component_categories, []),
  }));

  // Determine what can be crafted
  const categories = items.flatMap(i => i.categories);
  const categoryCount: Record<string, number> = {};
  for (const cat of categories) {
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  }

  return c.json({
    success: true,
    data: {
      items,
      slots: {
        used: items.length,
        max: 6,
      },
      availableCategories: categoryCount,
    },
  });
});

/**
 * POST /crafting/workbench/add
 * Add a component to the workbench.
 */
craftingRoutes.post('/workbench/add', requireCharacterMiddleware(), zValidator('json', workbenchAddSchema), async (c) => {
  const characterId = c.get('characterId')!;
  const { inventoryItemId } = c.req.valid('json');

  // Check workbench capacity
  const currentCount = await c.env.DB
    .prepare(
      `SELECT COUNT(*) as count FROM character_inventory
       WHERE character_id = ? AND storage_location = 'WORKBENCH'`
    )
    .bind(characterId)
    .first<{ count: number }>();

  if ((currentCount?.count || 0) >= 6) {
    return c.json({
      success: false,
      errors: [{ code: 'WORKBENCH_FULL', message: 'Workbench is full (max 6 slots)' }],
    }, 400);
  }

  // Get the inventory item
  const invItem = await c.env.DB
    .prepare(
      `SELECT ci.*, id.name, id.is_component
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_definition_id = id.id
       WHERE ci.id = ? AND ci.character_id = ?`
    )
    .bind(inventoryItemId, characterId)
    .first<{
      id: string;
      quantity: number;
      storage_location: string | null;
      name: string;
      is_component: number;
    }>();

  if (!invItem) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Item not found in inventory' }],
    }, 404);
  }

  if (!invItem.is_component) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_COMPONENT', message: 'This item is not a crafting component' }],
    }, 400);
  }

  if (invItem.storage_location === 'WORKBENCH') {
    return c.json({
      success: false,
      errors: [{ code: 'ALREADY_ON_WORKBENCH', message: 'Item is already on workbench' }],
    }, 400);
  }

  // Move to workbench
  await c.env.DB
    .prepare(
      `UPDATE character_inventory
       SET storage_location = 'WORKBENCH', sort_order = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(currentCount?.count || 0, inventoryItemId)
    .run();

  return c.json({
    success: true,
    data: {
      added: {
        inventoryId: inventoryItemId,
        name: invItem.name,
        slot: currentCount?.count || 0,
      },
      message: `Added ${invItem.name} to workbench`,
    },
  });
});

/**
 * POST /crafting/workbench/remove
 * Remove a component from the workbench.
 */
craftingRoutes.post('/workbench/remove', requireCharacterMiddleware(), zValidator('json', workbenchRemoveSchema), async (c) => {
  const characterId = c.get('characterId')!;
  const { workbenchSlot } = c.req.valid('json');

  // Get item at slot
  const item = await c.env.DB
    .prepare(
      `SELECT ci.id, id.name
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_definition_id = id.id
       WHERE ci.character_id = ? AND ci.storage_location = 'WORKBENCH' AND ci.sort_order = ?`
    )
    .bind(characterId, workbenchSlot)
    .first<{ id: string; name: string }>();

  if (!item) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'No item in that workbench slot' }],
    }, 404);
  }

  // Move back to regular inventory
  await c.env.DB
    .prepare(
      `UPDATE character_inventory
       SET storage_location = NULL, sort_order = 0, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(item.id)
    .run();

  // Reorder remaining items
  await c.env.DB
    .prepare(
      `UPDATE character_inventory
       SET sort_order = sort_order - 1
       WHERE character_id = ? AND storage_location = 'WORKBENCH' AND sort_order > ?`
    )
    .bind(characterId, workbenchSlot)
    .run();

  return c.json({
    success: true,
    data: {
      removed: {
        inventoryId: item.id,
        name: item.name,
        fromSlot: workbenchSlot,
      },
      message: `Removed ${item.name} from workbench`,
    },
  });
});

/**
 * POST /crafting/workbench/clear
 * Clear all items from workbench.
 */
craftingRoutes.post('/workbench/clear', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;

  const result = await c.env.DB
    .prepare(
      `UPDATE character_inventory
       SET storage_location = NULL, sort_order = 0, updated_at = datetime('now')
       WHERE character_id = ? AND storage_location = 'WORKBENCH'`
    )
    .bind(characterId)
    .run();

  return c.json({
    success: true,
    data: {
      cleared: result.meta.changes || 0,
      message: `Cleared ${result.meta.changes || 0} items from workbench`,
    },
  });
});

// -----------------------------------------------------------------------------
// DISASSEMBLY
// -----------------------------------------------------------------------------

/**
 * POST /crafting/disassemble/:inventoryId
 * Disassemble an item to recover components.
 */
craftingRoutes.post('/disassemble/:inventoryId', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;
  const inventoryId = c.req.param('inventoryId');

  // Get the item
  const invItem = await c.env.DB
    .prepare(
      `SELECT ci.*, id.name, id.code, id.quality_tier, id.component_categories, id.is_craftable
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_definition_id = id.id
       WHERE ci.id = ? AND ci.character_id = ?`
    )
    .bind(inventoryId, characterId)
    .first<{
      id: string;
      item_definition_id: string;
      equipped_slot: string | null;
      name: string;
      code: string;
      quality_tier: number;
      component_categories: string | null;
      is_craftable: number;
    }>();

  if (!invItem) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Item not found in inventory' }],
    }, 404);
  }

  if (invItem.equipped_slot) {
    return c.json({
      success: false,
      errors: [{ code: 'ITEM_EQUIPPED', message: 'Cannot disassemble equipped items' }],
    }, 400);
  }

  // Get character's fabrication skill
  const fabSkill = await c.env.DB
    .prepare(
      `SELECT current_level FROM character_skills cs
       JOIN skill_definitions sd ON cs.skill_id = sd.id
       WHERE cs.character_id = ? AND sd.code = 'FABRICATION'`
    )
    .bind(characterId)
    .first<{ current_level: number }>();

  const skillLevel = fabSkill?.current_level || 0;

  // Check Fabricator specialization for bonus
  const hasFabricator = await c.env.DB
    .prepare(
      `SELECT 1 FROM character_specializations cs
       JOIN specializations s ON cs.specialization_id = s.id
       WHERE cs.character_id = ? AND s.code = 'MCH_FAB' AND cs.is_active = 1`
    )
    .bind(characterId)
    .first();

  // Calculate component yield
  const baseYield = invItem.is_craftable ? 0.5 : 0.3;
  const skillBonus = skillLevel * 0.03;
  const specBonus = hasFabricator ? 0.15 : 0;
  const yieldChance = Math.min(0.9, baseYield + skillBonus + specBonus);

  // Determine what components to yield
  const componentCategories = parseJsonField<string[]>(invItem.component_categories, ['SCRAP', 'ELECTRONICS']);
  const recoveredComponents: Array<{ name: string; code: string; quantity: number }> = [];

  const { nanoid } = await import('nanoid');

  for (const category of componentCategories) {
    if (Math.random() < yieldChance) {
      // Find a component in this category
      const component = await c.env.DB
        .prepare(
          `SELECT id, code, name FROM item_definitions
           WHERE is_component = 1 AND component_categories LIKE ?
           ORDER BY quality_tier
           LIMIT 1`
        )
        .bind(`%"${category}"%`)
        .first<{ id: string; code: string; name: string }>();

      if (component) {
        // Add to inventory
        const newId = nanoid();
        await c.env.DB
          .prepare(
            `INSERT INTO character_inventory
             (id, character_id, item_definition_id, quantity, acquired_at, acquired_from)
             VALUES (?, ?, ?, 1, datetime('now'), 'DISASSEMBLY')`
          )
          .bind(newId, characterId, component.id)
          .run();

        recoveredComponents.push({
          name: component.name,
          code: component.code,
          quantity: 1,
        });
      }
    }
  }

  // Remove the disassembled item
  await c.env.DB
    .prepare('DELETE FROM character_inventory WHERE id = ?')
    .bind(inventoryId)
    .run();

  // Grant XP
  const xpGain = invItem.quality_tier * 15;
  await c.env.DB
    .prepare(
      `UPDATE character_skills
       SET current_xp = current_xp + ?, times_used = times_used + 1,
           last_used = datetime('now'), updated_at = datetime('now')
       WHERE character_id = ? AND skill_id IN (
         SELECT id FROM skill_definitions WHERE code = 'FABRICATION'
       )`
    )
    .bind(xpGain, characterId)
    .run();

  return c.json({
    success: true,
    data: {
      disassembled: {
        name: invItem.name,
        code: invItem.code,
      },
      recovered: recoveredComponents,
      xpGained: xpGain,
      message: recoveredComponents.length > 0
        ? `Disassembled ${invItem.name} and recovered ${recoveredComponents.length} component(s)`
        : `Disassembled ${invItem.name} but recovered no usable components`,
    },
  });
});

// -----------------------------------------------------------------------------
// CRAFTING STATS
// -----------------------------------------------------------------------------

/**
 * GET /crafting/stats
 * Get character's crafting statistics.
 */
craftingRoutes.get('/stats', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;

  // Get fabrication skill stats
  const fabSkill = await c.env.DB
    .prepare(
      `SELECT cs.current_level, cs.current_xp, cs.xp_to_next_level,
              cs.times_used, cs.successes, cs.failures,
              cs.critical_successes, cs.critical_failures,
              sd.name as skill_name
       FROM character_skills cs
       JOIN skill_definitions sd ON cs.skill_id = sd.id
       WHERE cs.character_id = ? AND sd.code = 'FABRICATION'`
    )
    .bind(characterId)
    .first<{
      current_level: number;
      current_xp: number;
      xp_to_next_level: number | null;
      times_used: number;
      successes: number;
      failures: number;
      critical_successes: number;
      critical_failures: number;
      skill_name: string;
    }>();

  // Count crafted items
  const craftedCount = await c.env.DB
    .prepare(
      `SELECT COUNT(*) as count FROM character_inventory
       WHERE character_id = ? AND acquired_from = 'CRAFTING'`
    )
    .bind(characterId)
    .first<{ count: number }>();

  // Count disassembled items (rough estimate from components gained)
  const disassembledCount = await c.env.DB
    .prepare(
      `SELECT COUNT(*) as count FROM character_inventory
       WHERE character_id = ? AND acquired_from = 'DISASSEMBLY'`
    )
    .bind(characterId)
    .first<{ count: number }>();

  const successRate = fabSkill && fabSkill.times_used > 0
    ? Math.round((fabSkill.successes / fabSkill.times_used) * 100)
    : 0;

  const criticalRate = fabSkill && fabSkill.successes > 0
    ? Math.round((fabSkill.critical_successes / fabSkill.successes) * 100)
    : 0;

  return c.json({
    success: true,
    data: {
      skill: fabSkill ? {
        name: fabSkill.skill_name,
        level: fabSkill.current_level,
        xp: fabSkill.current_xp,
        xpToNextLevel: fabSkill.xp_to_next_level,
      } : null,
      crafting: {
        totalAttempts: fabSkill?.times_used || 0,
        successes: fabSkill?.successes || 0,
        failures: fabSkill?.failures || 0,
        criticalSuccesses: fabSkill?.critical_successes || 0,
        criticalFailures: fabSkill?.critical_failures || 0,
        successRate,
        criticalRate,
      },
      items: {
        crafted: craftedCount?.count || 0,
        disassembled: disassembledCount?.count || 0,
      },
    },
  });
});

/**
 * GET /crafting/specializations
 * Get crafting specialization info and bonuses.
 */
craftingRoutes.get('/specializations', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;

  // Check for crafting-related specializations
  const specs = await c.env.DB
    .prepare(
      `SELECT s.id, s.code, s.name, s.description, cs.acquired_at, cs.is_active
       FROM character_specializations cs
       JOIN specializations s ON cs.specialization_id = s.id
       WHERE cs.character_id = ? AND (s.code = 'MCH_FAB' OR s.code LIKE '%CRAFT%' OR s.code LIKE '%TECH%')`
    )
    .bind(characterId)
    .all<{
      id: string;
      code: string;
      name: string;
      description: string | null;
      acquired_at: string;
      is_active: number;
    }>();

  const hasFabricator = specs.results.some(s => s.code === 'MCH_FAB' && s.is_active);

  const bonuses = {
    qualityBonus: hasFabricator ? 10 : 0,
    speedBonus: hasFabricator ? 20 : 0,
    componentSaving: hasFabricator ? 15 : 0,
    experimentalSuccess: hasFabricator ? 25 : 0,
    disassemblyYield: hasFabricator ? 15 : 0,
    recipeDiscovery: hasFabricator ? 10 : 0,
  };

  return c.json({
    success: true,
    data: {
      specializations: specs.results.map(s => ({
        id: s.id,
        code: s.code,
        name: s.name,
        description: s.description,
        acquiredAt: s.acquired_at,
        isActive: s.is_active === 1,
      })),
      hasFabricator,
      bonuses,
      bonusDescriptions: {
        qualityBonus: '+10% to output item quality',
        speedBonus: '-20% crafting time',
        componentSaving: '15% chance to not consume a component',
        experimentalSuccess: '+25% success rate for experimental crafting',
        disassemblyYield: '+15% component recovery from disassembly',
        recipeDiscovery: '+10% chance to discover new recipes',
      },
    },
  });
});

// -----------------------------------------------------------------------------
// EXPERIMENTAL CRAFTING
// -----------------------------------------------------------------------------

/**
 * POST /crafting/experiment
 * Attempt experimental crafting (combine components without a recipe).
 */
craftingRoutes.post('/experiment', requireCharacterMiddleware(), zValidator('json', experimentSchema), async (c) => {
  const characterId = c.get('characterId')!;
  const { componentIds, technique } = c.req.valid('json');

  // Get character's fabrication skill
  const fabSkill = await c.env.DB
    .prepare(
      `SELECT current_level FROM character_skills cs
       JOIN skill_definitions sd ON cs.skill_id = sd.id
       WHERE cs.character_id = ? AND sd.code = 'FABRICATION'`
    )
    .bind(characterId)
    .first<{ current_level: number }>();

  const skillLevel = fabSkill?.current_level || 0;

  if (skillLevel < 3) {
    return c.json({
      success: false,
      errors: [{ code: 'SKILL_TOO_LOW', message: 'Experimental crafting requires Fabrication level 3' }],
    }, 400);
  }

  // Check Fabricator specialization
  const hasFabricator = await c.env.DB
    .prepare(
      `SELECT 1 FROM character_specializations cs
       JOIN specializations s ON cs.specialization_id = s.id
       WHERE cs.character_id = ? AND s.code = 'MCH_FAB' AND cs.is_active = 1`
    )
    .bind(characterId)
    .first();

  // Verify and get all components
  const componentItems: Array<{
    id: string;
    inventoryId: string;
    name: string;
    code: string;
    quality_tier: number;
    categories: string[];
  }> = [];

  for (const invId of componentIds) {
    const item = await c.env.DB
      .prepare(
        `SELECT ci.id as inv_id, id.id, id.name, id.code, id.quality_tier, id.component_categories
         FROM character_inventory ci
         JOIN item_definitions id ON ci.item_definition_id = id.id
         WHERE ci.id = ? AND ci.character_id = ? AND id.is_component = 1`
      )
      .bind(invId, characterId)
      .first<{
        inv_id: string;
        id: string;
        name: string;
        code: string;
        quality_tier: number;
        component_categories: string | null;
      }>();

    if (!item) {
      return c.json({
        success: false,
        errors: [{ code: 'INVALID_COMPONENT', message: `Component ${invId} not found or not a component` }],
      }, 400);
    }

    componentItems.push({
      id: item.id,
      inventoryId: item.inv_id,
      name: item.name,
      code: item.code,
      quality_tier: item.quality_tier,
      categories: parseJsonField<string[]>(item.component_categories, []),
    });
  }

  // Calculate experiment success
  const baseChance = 20;
  const skillBonus = skillLevel * 3;
  const specBonus = hasFabricator ? 25 : 0;
  const techniqueModifier = technique === 'combine' ? 10 : (technique === 'corrupt' ? -15 : 0);
  const componentPenalty = (componentItems.length - 2) * 5;

  const successChance = Math.max(5, Math.min(75, baseChance + skillBonus + specBonus + techniqueModifier - componentPenalty));

  const roll = Math.random() * 100;
  const success = roll < successChance;

  // Consume components regardless of outcome
  for (const comp of componentItems) {
    await c.env.DB
      .prepare('DELETE FROM character_inventory WHERE id = ?')
      .bind(comp.inventoryId)
      .run();
  }

  // Grant XP
  const xpGain = componentItems.length * 30 * (success ? 2 : 1);
  await c.env.DB
    .prepare(
      `UPDATE character_skills
       SET current_xp = current_xp + ?, times_used = times_used + 1,
           ${success ? 'successes = successes + 1' : 'failures = failures + 1'},
           last_used = datetime('now'), updated_at = datetime('now')
       WHERE character_id = ? AND skill_id IN (
         SELECT id FROM skill_definitions WHERE code = 'FABRICATION'
       )`
    )
    .bind(xpGain, characterId)
    .run();

  if (!success) {
    return c.json({
      success: false,
      errors: [{
        code: 'EXPERIMENT_FAILED',
        message: 'The experiment failed and components were destroyed',
      }],
      data: {
        consumedComponents: componentItems.map(c => c.name),
        xpGained: xpGain,
        roll: Math.round(roll),
        needed: Math.round(successChance),
      },
    }, 400);
  }

  // Find a possible result based on combined categories
  const avgQuality = componentItems.reduce((sum, c) => sum + c.quality_tier, 0) / componentItems.length;

  // Try to find a craftable item that uses these categories
  let resultItem = await c.env.DB
    .prepare(
      `SELECT id, code, name, rarity, quality_tier FROM item_definitions
       WHERE is_craftable = 1 AND quality_tier <= ?
       ORDER BY RANDOM()
       LIMIT 1`
    )
    .bind(Math.ceil(avgQuality))
    .first<{ id: string; code: string; name: string; rarity: string; quality_tier: number }>();

  if (!resultItem) {
    // Fallback to a generic component
    resultItem = await c.env.DB
      .prepare(
        `SELECT id, code, name, rarity, quality_tier FROM item_definitions
         WHERE is_component = 1
         ORDER BY RANDOM()
         LIMIT 1`
      )
      .first<{ id: string; code: string; name: string; rarity: string; quality_tier: number }>();
  }

  if (resultItem) {
    const { nanoid } = await import('nanoid');
    const newId = nanoid();

    await c.env.DB
      .prepare(
        `INSERT INTO character_inventory
         (id, character_id, item_definition_id, quantity, acquired_at, acquired_from)
         VALUES (?, ?, ?, 1, datetime('now'), 'EXPERIMENT')`
      )
      .bind(newId, characterId, resultItem.id)
      .run();

    return c.json({
      success: true,
      data: {
        result: {
          inventoryId: newId,
          itemId: resultItem.id,
          code: resultItem.code,
          name: resultItem.name,
          rarity: resultItem.rarity,
          quality: resultItem.quality_tier,
        },
        consumedComponents: componentItems.map(c => c.name),
        technique,
        xpGained: xpGain,
        message: `Experiment successful! Created ${resultItem.name}`,
      },
    });
  }

  return c.json({
    success: true,
    data: {
      result: null,
      consumedComponents: componentItems.map(c => c.name),
      technique,
      xpGained: xpGain,
      message: 'Experiment produced no usable result, but you learned from the experience',
    },
  });
});
