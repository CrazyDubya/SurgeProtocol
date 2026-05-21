/**
 * Surge Protocol - Augmentation System API
 *
 * Endpoints for browsing, installing, and managing cybernetic augmentations.
 * Handles humanity tracking and cyberpsychosis risk.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireCharacterMiddleware } from '../../middleware/auth';
import { AugmentationService, AUGMENT_CATEGORIES } from '../../services/augmentation';

// =============================================================================
// TYPES
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

type Variables = {
  userId: string;
  characterId: string;
};

// =============================================================================
// ROUTER
// =============================================================================

const augmentationRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// =============================================================================
// PUBLIC ENDPOINTS
// =============================================================================

/**
 * GET /augmentations/catalog
 * Browse available augmentation definitions.
 */
augmentationRoutes.get('/catalog', async (c) => {
  const service = new AugmentationService(c.env.DB);
  const maxTierParam = c.req.query('maxTier');
  const result = await service.getCatalog({
    category: c.req.query('category'),
    rarity: c.req.query('rarity'),
    maxTier: maxTierParam ? parseInt(maxTierParam) : undefined,
    manufacturer: c.req.query('manufacturer'),
    bodyLocation: c.req.query('bodyLocation'),
    limit: Math.min(parseInt(c.req.query('limit') || '50'), 100),
    offset: parseInt(c.req.query('offset') || '0'),
  });

  return c.json({ success: true, data: result });
});

/**
 * GET /augmentations/catalog/:id
 * Get detailed information about a specific augmentation.
 */
augmentationRoutes.get('/catalog/:id', async (c) => {
  const service = new AugmentationService(c.env.DB);
  const result = await service.getCatalogItem(c.req.param('id'));

  if (!result) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Augmentation not found' }],
    }, 404);
  }

  return c.json({ success: true, data: result });
});

/**
 * GET /augmentations/body-locations
 * List all body locations where augments can be installed.
 */
augmentationRoutes.get('/body-locations', async (c) => {
  const service = new AugmentationService(c.env.DB);
  const locations = await service.getBodyLocations();
  return c.json({ success: true, data: { locations } });
});

/**
 * GET /augmentations/manufacturers
 * List augmentation manufacturers.
 */
augmentationRoutes.get('/manufacturers', async (c) => {
  const service = new AugmentationService(c.env.DB);
  const manufacturers = await service.getManufacturers();
  return c.json({ success: true, data: { manufacturers } });
});

/**
 * GET /augmentations/categories
 * List available augmentation categories.
 */
augmentationRoutes.get('/categories', (c) => {
  return c.json({
    success: true,
    data: {
      categories: AUGMENT_CATEGORIES.map(cat => ({
        code: cat,
        name: cat.charAt(0) + cat.slice(1).toLowerCase(),
      })),
    },
  });
});

// =============================================================================
// AUTHENTICATED ENDPOINTS
// =============================================================================

augmentationRoutes.use('/*', authMiddleware());

/**
 * GET /augmentations/character
 * List augmentations installed on the current character.
 */
augmentationRoutes.get('/character', requireCharacterMiddleware(), async (c) => {
  const service = new AugmentationService(c.env.DB);
  const result = await service.getCharacterAugments(c.get('characterId'));
  return c.json({ success: true, data: result });
});

/**
 * POST /augmentations/install
 * Install an augmentation on the character.
 */
const installSchema = z.object({
  augmentId: z.string().min(1),
  bodyLocationId: z.string().optional(),
  installerId: z.string().optional(),
  useBlackMarket: z.boolean().default(false),
});

augmentationRoutes.post(
  '/install',
  requireCharacterMiddleware(),
  zValidator('json', installSchema),
  async (c) => {
    const service = new AugmentationService(c.env.DB);
    const result = await service.installAugment(c.get('characterId'), c.req.valid('json'));

    if (!result.success) {
      return c.json({
        success: false,
        errors: [{ code: (result as any).code, message: result.error }],
      }, (result as any).statusCode || 400);
    }

    return c.json({ success: true, data: result.data }, 201);
  }
);

/**
 * POST /augmentations/:id/toggle
 * Activate or deactivate an installed augment.
 */
augmentationRoutes.post('/:id/toggle', requireCharacterMiddleware(), async (c) => {
  const service = new AugmentationService(c.env.DB);
  const result = await service.toggleAugment(c.get('characterId'), c.req.param('id'));

  if (!result.success) {
    return c.json({
      success: false,
      errors: [{ code: (result as any).code, message: result.error }],
    }, (result as any).statusCode || 400);
  }

  return c.json({ success: true, data: result.data });
});

/**
 * POST /augmentations/:id/remove
 * Remove an installed augment (risky surgery).
 */
const removeSchema = z.object({
  surgeonId: z.string().optional(),
  useBlackMarket: z.boolean().default(false),
});

augmentationRoutes.post(
  '/:id/remove',
  requireCharacterMiddleware(),
  zValidator('json', removeSchema),
  async (c) => {
    const service = new AugmentationService(c.env.DB);
    const result = await service.removeAugment(c.get('characterId'), c.req.param('id'), c.req.valid('json'));

    if (!result.success) {
      return c.json({
        success: false,
        errors: [{ code: (result as any).code, message: result.error }],
      }, (result as any).statusCode || 400);
    }

    return c.json({ success: true, data: result.data });
  }
);

/**
 * GET /augmentations/humanity/history
 * Get humanity change history for the character.
 */
augmentationRoutes.get('/humanity/history', requireCharacterMiddleware(), async (c) => {
  const service = new AugmentationService(c.env.DB);
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const events = await service.getHumanityHistory(c.get('characterId'), limit);
  return c.json({ success: true, data: { events } });
});

/**
 * GET /augmentations/humanity/thresholds
 * Get all humanity thresholds and their effects.
 */
augmentationRoutes.get('/humanity/thresholds', async (c) => {
  const service = new AugmentationService(c.env.DB);
  const thresholds = await service.getHumanityThresholds();
  return c.json({ success: true, data: { thresholds } });
});

// =============================================================================
// AUGMENT SETS
// =============================================================================

/**
 * GET /augmentations/sets
 * List all augment sets and their bonuses.
 */
augmentationRoutes.get('/sets', async (c) => {
  const service = new AugmentationService(c.env.DB);
  const sets = await service.getAugmentSets(c.req.query('manufacturer'));
  return c.json({ success: true, data: { sets, total: sets.length } });
});

/**
 * GET /augmentations/sets/:code
 * Get specific augment set with full details.
 */
augmentationRoutes.get('/sets/:code', async (c) => {
  const service = new AugmentationService(c.env.DB);
  const result = await service.getAugmentSetDetails(c.req.param('code'));

  if (!result) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Augment set not found' }],
    }, 404);
  }

  return c.json({ success: true, data: result });
});

/**
 * GET /augmentations/sets/character/active
 * Get character's active set bonuses based on installed augments.
 */
augmentationRoutes.get('/sets/character/active', requireCharacterMiddleware(), async (c) => {
  const service = new AugmentationService(c.env.DB);
  const result = await service.getCharacterActiveSets(c.get('characterId')!);
  return c.json({ success: true, data: result });
});

export { augmentationRoutes };
