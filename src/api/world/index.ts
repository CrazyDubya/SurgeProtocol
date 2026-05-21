/**
 * Surge Protocol - World & Location Routes
 *
 * Endpoints:
 * - GET /world/regions - List all regions
 * - GET /world/regions/:id - Get region details
 * - GET /world/locations - List locations (optionally filtered by region)
 * - GET /world/locations/:id - Get location details with connections
 * - POST /world/move - Move character to a connected location
 * - GET /world/current - Get current location
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  authMiddleware,
  requireCharacterMiddleware,
  type AuthVariables,
} from '../../middleware/auth';
import { WorldService } from '../../services/world';
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const moveSchema = z.object({
  destinationId: z.string().min(1),
  routeId: z.string().optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

export const worldRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Apply auth middleware to all routes
worldRoutes.use('*', authMiddleware());

/**
 * GET /world/regions
 * List all regions.
 */
worldRoutes.get('/regions', async (c) => {
  const worldService = new WorldService({
    db: c.env.DB,
    cache: c.env.CACHE,
    userId: c.get('userId'),
  });

  const regions = await worldService.getRegions();

  // Build hierarchy
  const topLevel = regions.filter(r => !r.parent_region_id);
  const byParent: Record<string, any[]> = {};

  for (const region of regions) {
    if (region.parent_region_id) {
      const parentId = region.parent_region_id;
      if (!byParent[parentId]) byParent[parentId] = [];
      byParent[parentId]!.push(region);
    }
  }

  return c.json({
    success: true,
    data: {
      regions,
      topLevel,
      byParent,
      count: regions.length,
    },
  });
});

/**
 * GET /world/regions/:id
 * Get region details with locations.
 */
worldRoutes.get('/regions/:id', async (c) => {
  const regionId = c.req.param('id');
  const worldService = new WorldService({
    db: c.env.DB,
    cache: c.env.CACHE,
    userId: c.get('userId'),
  });

  const details = await worldService.getRegionDetails(regionId);
  if (!details) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Region not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: details,
  });
});

/**
 * GET /world/locations
 * List locations, optionally filtered by region.
 */
worldRoutes.get('/locations', async (c) => {
  const regionId = c.req.query('region');
  const locationType = c.req.query('type');
  const worldService = new WorldService({
    db: c.env.DB,
    cache: c.env.CACHE,
    userId: c.get('userId'),
  });

  const locations = await worldService.getLocations({ regionId, type: locationType });

  return c.json({
    success: true,
    data: {
      locations,
      count: locations.length,
    },
  });
});

/**
 * GET /world/locations/:id
 * Get location details with connected routes.
 */
worldRoutes.get('/locations/:id', requireCharacterMiddleware(), async (c) => {
  const locationId = c.req.param('id');
  const characterId = c.get('characterId')!;
  const worldService = new WorldService({
    db: c.env.DB,
    cache: c.env.CACHE,
    userId: c.get('userId'),
    characterId,
  });

  const details = await worldService.getLocationDetails(locationId, characterId);
  if (!details) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Location not found' }],
    }, 404);
  }

  // Map to API format (renaming properties if needed)
  return c.json({
    success: true,
    data: {
      location: {
        ...details.location,
        servicesOffered: details.location.services_offered,
      },
      connections: details.connections,
      incomingRoutes: details.incomingRoutes,
      npcs: details.npcs,
      vendors: details.vendors,
      districtConditions: details.districtConditions,
      isCurrentLocation: details.isCurrentLocation,
    },
  });
});

/**
 * POST /world/move
 * Move character to a connected location.
 */
worldRoutes.post('/move', requireCharacterMiddleware(), zValidator('json', moveSchema), async (c) => {
  const characterId = c.get('characterId')!;
  const { destinationId, routeId } = c.req.valid('json');

  const worldService = new WorldService({
    db: c.env.DB,
    cache: c.env.CACHE,
    userId: c.get('userId'),
    characterId,
  });

  const result = await worldService.moveCharacter(characterId, destinationId, routeId);

  if (!result.success) {
    return c.json({
      success: false,
      errors: [{ code: result.code || 'MOVE_FAILED', message: result.error }],
    }, result.code === 'DESTINATION_NOT_FOUND' ? 404 : 403);
  }

  return c.json(result);
});

/**
 * GET /world/current
 * Get character's current location.
 */
worldRoutes.get('/current', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;
  const worldService = new WorldService({
    db: c.env.DB,
    cache: c.env.CACHE,
    userId: c.get('userId'),
    characterId,
  });

  const location = await worldService.getCurrentLocation(characterId);

  return c.json({
    success: true,
    data: {
      location,
      message: location ? undefined : 'No current location set',
    },
  });
});
