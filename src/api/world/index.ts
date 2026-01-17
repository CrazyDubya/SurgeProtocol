/**
 * Surge Protocol - World & Location Routes
 *
 * Endpoints:
 * - GET /world/regions - List all regions
 * - GET /world/regions/:id - Get region details
 * - GET /world/locations - List locations (optionally filtered by region)
 * - GET /world/locations/:id - Get location details with connections
 * - POST /world/move - Move character to a connected location
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  authMiddleware,
  requireCharacterMiddleware,
  type AuthVariables,
} from '../../middleware/auth';
import {
  getActiveDistrictEvents,
  getEffectiveModifiers,
} from '../mission';

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
  const result = await c.env.DB
    .prepare(
      `SELECT id, code, name, description, region_type,
              parent_region_id, controlling_faction_id,
              law_level, corporate_presence, wealth_level, crime_rate
       FROM regions
       ORDER BY name`
    )
    .all<{
      id: string;
      code: string;
      name: string;
      description: string | null;
      region_type: string | null;
      parent_region_id: string | null;
      controlling_faction_id: string | null;
      law_level: number;
      corporate_presence: number;
      wealth_level: number;
      crime_rate: number;
    }>();

  // Build hierarchy
  const regions = result.results;
  const topLevel = regions.filter(r => !r.parent_region_id);
  const byParent: Record<string, typeof regions> = {};

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

  const region = await c.env.DB
    .prepare(
      `SELECT r.*, f.name as faction_name
       FROM regions r
       LEFT JOIN factions f ON r.controlling_faction_id = f.id
       WHERE r.id = ? OR r.code = ?`
    )
    .bind(regionId, regionId)
    .first();

  if (!region) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Region not found' }],
    }, 404);
  }

  // Get locations in this region
  const locations = await c.env.DB
    .prepare(
      `SELECT id, code, name, description, location_type,
              tier_requirement, access_type, fast_travel_point
       FROM locations
       WHERE region_id = ?
       ORDER BY name`
    )
    .bind(region.id as string)
    .all();

  // Get sub-regions
  const subRegions = await c.env.DB
    .prepare(
      `SELECT id, code, name, region_type
       FROM regions
       WHERE parent_region_id = ?`
    )
    .bind(region.id as string)
    .all();

  return c.json({
    success: true,
    data: {
      region,
      locations: locations.results,
      subRegions: subRegions.results,
    },
  });
});

/**
 * GET /world/locations
 * List locations, optionally filtered by region.
 */
worldRoutes.get('/locations', async (c) => {
  const regionId = c.req.query('region');
  const locationType = c.req.query('type');

  let query = `
    SELECT l.id, l.code, l.name, l.description, l.location_type,
           l.tier_requirement, l.access_type, l.fast_travel_point,
           l.region_id, r.name as region_name
    FROM locations l
    LEFT JOIN regions r ON l.region_id = r.id
    WHERE 1=1
  `;

  const params: string[] = [];

  if (regionId) {
    query += ` AND (l.region_id = ? OR r.code = ?)`;
    params.push(regionId, regionId);
  }

  if (locationType) {
    query += ` AND l.location_type = ?`;
    params.push(locationType);
  }

  query += ` ORDER BY r.name, l.name`;

  const stmt = c.env.DB.prepare(query);
  const result = params.length > 0
    ? await stmt.bind(...params).all()
    : await stmt.all();

  return c.json({
    success: true,
    data: {
      locations: result.results,
      count: result.results.length,
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

  const location = await c.env.DB
    .prepare(
      `SELECT l.*, r.name as region_name, r.code as region_code,
              f.name as faction_name
       FROM locations l
       LEFT JOIN regions r ON l.region_id = r.id
       LEFT JOIN factions f ON l.faction_requirement_id = f.id
       WHERE l.id = ? OR l.code = ?`
    )
    .bind(locationId, locationId)
    .first();

  if (!location) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Location not found' }],
    }, 404);
  }

  // Get character for tier/faction checks
  const character = await c.env.DB
    .prepare('SELECT current_tier, current_location_id FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_tier: number; current_location_id: string | null }>();

  // Get connected locations via routes (outgoing)
  const outgoingRoutes = await c.env.DB
    .prepare(
      `SELECT rt.*, loc.name as destination_name, loc.code as destination_code,
              loc.location_type as destination_type, loc.tier_requirement as dest_tier
       FROM routes rt
       JOIN locations loc ON rt.destination_location_id = loc.id
       WHERE rt.origin_location_id = ?`
    )
    .bind(location.id as string)
    .all<{
      id: string;
      name: string | null;
      destination_location_id: string;
      destination_name: string;
      destination_code: string | null;
      destination_type: string | null;
      dest_tier: number;
      distance_km: number | null;
      base_travel_time_minutes: number | null;
      required_tier: number;
    }>();

  // Get connected locations via routes (incoming - bidirectional travel)
  const incomingRoutes = await c.env.DB
    .prepare(
      `SELECT rt.*, loc.name as origin_name, loc.code as origin_code,
              loc.location_type as origin_type, loc.tier_requirement as origin_tier
       FROM routes rt
       JOIN locations loc ON rt.origin_location_id = loc.id
       WHERE rt.destination_location_id = ?`
    )
    .bind(location.id as string)
    .all();

  // Get active district events if this location is in current region
  const regionId = location.region_id as string;
  const activeEvents = regionId
    ? await getActiveDistrictEvents(c.env.CACHE, regionId)
    : [];
  const modifiers = getEffectiveModifiers(activeEvents);
  const timeMod = modifiers.get('ROUTE_TIME') || 1.0;

  // Format routes with accessibility info
  const connections = outgoingRoutes.results.map(route => {
    const baseTime = route.base_travel_time_minutes ?? 10;
    const effectiveTime = Math.round(baseTime * timeMod);
    const canTravel = (character?.current_tier ?? 1) >= route.required_tier;

    return {
      routeId: route.id,
      routeName: route.name,
      destination: {
        id: route.destination_location_id,
        name: route.destination_name,
        code: route.destination_code,
        type: route.destination_type,
        tierRequired: route.dest_tier,
      },
      distance_km: route.distance_km,
      baseTravelTime: route.base_travel_time_minutes,
      effectiveTravelTime: effectiveTime,
      tierRequired: route.required_tier,
      canTravel,
      reason: !canTravel ? `Requires Tier ${route.required_tier}` : null,
    };
  });

  // Get NPCs at this location
  const npcs = await c.env.DB
    .prepare(
      `SELECT ni.id, nd.name, nd.npc_type, nd.is_vendor, nd.is_quest_giver
       FROM npc_instances ni
       JOIN npc_definitions nd ON ni.npc_definition_id = nd.id
       WHERE ni.current_location_id = ?`
    )
    .bind(location.id as string)
    .all();

  // Get vendors at this location
  const vendors = await c.env.DB
    .prepare(
      `SELECT v.id, v.name, v.vendor_type, v.specialty
       FROM vendors v
       WHERE v.location_id = ?`
    )
    .bind(location.id as string)
    .all();

  // Parse JSON fields
  const servicesOffered = location.services_offered
    ? JSON.parse(location.services_offered as string)
    : [];

  return c.json({
    success: true,
    data: {
      location: {
        ...location,
        servicesOffered,
      },
      connections,
      incomingRoutes: incomingRoutes.results.length,
      npcs: npcs.results,
      vendors: vendors.results,
      districtConditions: activeEvents.length > 0 ? {
        activeEvents: activeEvents.map(e => ({ name: e.name, type: e.type })),
        travelTimeMultiplier: timeMod,
      } : null,
      isCurrentLocation: character?.current_location_id === location.id,
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

  // Get character's current location and tier
  const character = await c.env.DB
    .prepare('SELECT current_tier, current_location_id FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_tier: number; current_location_id: string | null }>();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'CHARACTER_NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  const currentLocationId = character.current_location_id;

  // Get destination location
  const destination = await c.env.DB
    .prepare('SELECT id, name, code, tier_requirement, locked, region_id FROM locations WHERE id = ? OR code = ?')
    .bind(destinationId, destinationId)
    .first<{
      id: string;
      name: string;
      code: string | null;
      tier_requirement: number;
      locked: number;
      region_id: string | null;
    }>();

  if (!destination) {
    return c.json({
      success: false,
      errors: [{ code: 'DESTINATION_NOT_FOUND', message: 'Destination not found' }],
    }, 404);
  }

  // Check if destination is locked
  if (destination.locked) {
    return c.json({
      success: false,
      errors: [{ code: 'LOCATION_LOCKED', message: 'This location is currently locked' }],
    }, 403);
  }

  // Check tier requirement
  if (character.current_tier < destination.tier_requirement) {
    return c.json({
      success: false,
      errors: [{
        code: 'TIER_REQUIREMENT',
        message: `Requires Tier ${destination.tier_requirement}, you are Tier ${character.current_tier}`,
      }],
    }, 403);
  }

  // Find a valid route if not specified
  let route: { id: string; base_travel_time_minutes: number | null; distance_km: number | null; required_tier: number } | null = null;

  if (currentLocationId) {
    if (routeId) {
      route = await c.env.DB
        .prepare(
          `SELECT id, base_travel_time_minutes, distance_km, required_tier
           FROM routes
           WHERE id = ? AND origin_location_id = ? AND destination_location_id = ?`
        )
        .bind(routeId, currentLocationId, destination.id)
        .first();

      if (!route) {
        return c.json({
          success: false,
          errors: [{ code: 'INVALID_ROUTE', message: 'Route does not connect these locations' }],
        }, 400);
      }
    } else {
      // Find any route connecting these locations
      route = await c.env.DB
        .prepare(
          `SELECT id, base_travel_time_minutes, distance_km, required_tier
           FROM routes
           WHERE (origin_location_id = ? AND destination_location_id = ?)
              OR (origin_location_id = ? AND destination_location_id = ?)`
        )
        .bind(currentLocationId, destination.id, destination.id, currentLocationId)
        .first();
    }
  }

  // If no route exists and we have a current location, check if fast travel is available
  if (!route && currentLocationId) {
    const currentLocation = await c.env.DB
      .prepare('SELECT fast_travel_point FROM locations WHERE id = ?')
      .bind(currentLocationId)
      .first<{ fast_travel_point: number }>();

    const destFastTravel = destination.region_id
      ? await c.env.DB
          .prepare('SELECT fast_travel_point FROM locations WHERE id = ?')
          .bind(destination.id)
          .first<{ fast_travel_point: number }>()
      : null;

    if (currentLocation?.fast_travel_point && destFastTravel?.fast_travel_point) {
      // Fast travel allowed between fast travel points
      route = {
        id: 'fast_travel',
        base_travel_time_minutes: 5, // Fast travel is quick
        distance_km: null,
        required_tier: 1,
      };
    } else {
      return c.json({
        success: false,
        errors: [{ code: 'NO_ROUTE', message: 'No route connects your location to the destination' }],
      }, 400);
    }
  }

  // Check route tier requirement
  if (route && character.current_tier < route.required_tier) {
    return c.json({
      success: false,
      errors: [{
        code: 'ROUTE_TIER_REQUIREMENT',
        message: `This route requires Tier ${route.required_tier}`,
      }],
    }, 403);
  }

  // Calculate effective travel time with district modifiers
  const regionId = destination.region_id || 'downtown';
  const activeEvents = await getActiveDistrictEvents(c.env.CACHE, regionId);
  const modifiers = getEffectiveModifiers(activeEvents);
  const timeMod = modifiers.get('ROUTE_TIME') || 1.0;

  const baseTravelTime = route?.base_travel_time_minutes ?? 10;
  const effectiveTravelTime = Math.round(baseTravelTime * timeMod);

  // Update character's location
  await c.env.DB
    .prepare(
      `UPDATE characters
       SET current_location_id = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(destination.id, characterId)
    .run();

  // Log the travel (could be used for tracking/achievements)
  await c.env.DB
    .prepare(
      `INSERT INTO character_memories (id, character_id, memory_type, content, importance, created_at)
       VALUES (?, ?, 'LOCATION_VISIT', ?, 1, datetime('now'))`
    )
    .bind(
      crypto.randomUUID(),
      characterId,
      JSON.stringify({
        locationId: destination.id,
        locationName: destination.name,
        fromLocationId: currentLocationId,
        travelTime: effectiveTravelTime,
      })
    )
    .run();

  return c.json({
    success: true,
    data: {
      previousLocation: currentLocationId,
      newLocation: {
        id: destination.id,
        name: destination.name,
        code: destination.code,
      },
      travelTime: effectiveTravelTime,
      distance: route?.distance_km,
      routeUsed: route?.id !== 'fast_travel' ? route?.id : null,
      fastTravel: route?.id === 'fast_travel',
      districtConditions: activeEvents.length > 0 ? {
        activeEvents: activeEvents.map(e => e.name),
        travelTimeMultiplier: timeMod,
      } : null,
      message: `Arrived at ${destination.name}.`,
    },
  });
});

/**
 * GET /world/current
 * Get character's current location.
 */
worldRoutes.get('/current', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;

  const character = await c.env.DB
    .prepare('SELECT current_location_id FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_location_id: string | null }>();

  if (!character?.current_location_id) {
    return c.json({
      success: true,
      data: {
        location: null,
        message: 'No current location set',
      },
    });
  }

  const location = await c.env.DB
    .prepare(
      `SELECT l.*, r.name as region_name
       FROM locations l
       LEFT JOIN regions r ON l.region_id = r.id
       WHERE l.id = ?`
    )
    .bind(character.current_location_id)
    .first();

  return c.json({
    success: true,
    data: {
      location,
    },
  });
});
