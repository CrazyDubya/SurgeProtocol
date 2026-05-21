
/**
 * Surge Protocol - Crafting/Fabrication System Routes
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireCharacterMiddleware, type AuthVariables } from '../../middleware/auth';
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { CraftingService } from '../../services/crafting/crafting';

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

const craftSchema = z.object({
  recipeId: z.string(),
  componentIds: z.array(z.string()).min(1),
});

export const craftingRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

craftingRoutes.use('*', authMiddleware());

/**
 * GET /crafting/recipes
 */
craftingRoutes.get('/recipes', async (c) => {
  const service = new CraftingService(c.env.DB, c.env.CACHE);
  const category = c.req.query('category');
  const rarity = c.req.query('rarity');
  const maxTier = c.req.query('maxTier') ? parseInt(c.req.query('maxTier')!) : undefined;

  const recipes = await service.getRecipes({ category, rarity, maxTier });
  return c.json({ success: true, data: { recipes } });
});

/**
 * GET /crafting/recipes/:id
 */
craftingRoutes.get('/recipes/:id', async (c) => {
  const service = new CraftingService(c.env.DB, c.env.CACHE);
  const recipe = await service.getRecipe(c.req.param('id'));

  if (!recipe) return c.json({ success: false, errors: [{ message: 'Recipe not found' }] }, 404);

  return c.json({ success: true, data: { recipe } });
});

/**
 * POST /crafting/craft
 */
craftingRoutes.post('/craft', requireCharacterMiddleware(), zValidator('json', craftSchema), async (c) => {
  const characterId = c.get('characterId')!;
  const { recipeId, componentIds } = c.req.valid('json');
  const service = new CraftingService(c.env.DB, c.env.CACHE);

  try {
    const result = await service.craftItem(characterId, recipeId, componentIds);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, errors: [{ message: err.message }] }, 400);
  }
});

// Deprecated/Placeholder routes for now pending full implementation of workbench
craftingRoutes.get('/workbench', (c) => c.json({ success: true, data: { slots: [] } }));
craftingRoutes.get('/available', (c) => c.json({ success: true, data: { recipes: [] } }));
