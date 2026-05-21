
/**
 * Surge Protocol - Drone System Routes
 *
 * Endpoints:
 *
 * Drone Definitions:
 * - GET /drones - List drone definitions
 * - GET /drones/:id - Get drone details
 * - GET /drones/by-role/:role - Filter by role (scout, support, attack, cargo)
 * - GET /drones/by-class/:class - Filter by class (micro, mini, standard, heavy)
 *
 * Character Drones:
 * - GET /drones/character - List character's drones
 * - GET /drones/character/:id - Get individual drone state
 * - POST /drones/character/acquire - Purchase/acquire new drone
 * - PATCH /drones/character/:id - Customize drone (name, paint, loadout)
 * - POST /drones/character/:id/deploy - Deploy/recall drone
 * - POST /drones/character/:id/repair - Repair drone damage
 * - DELETE /drones/character/:id - Scrap/sell drone
 *
 * Swarms:
 * - GET /drones/swarms - List character's swarms
 * - GET /drones/swarms/:id - Get swarm details
 * - POST /drones/swarms - Create swarm
 * - PATCH /drones/swarms/:id - Update swarm (composition, formation, name)
 * - POST /drones/swarms/:id/deploy - Deploy entire swarm
 * - POST /drones/swarms/:id/recall - Recall swarm
 * - POST /drones/swarms/:id/command - Issue swarm command (formation, behavior, target)
 * - DELETE /drones/swarms/:id - Disband swarm
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { DroneService, type CreateSwarmDTO } from '../../services/vehicle/drone';
import { authMiddleware, type AuthVariables } from '../../middleware/auth';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const acquireDroneSchema = z.object({
  characterId: z.string().min(1, 'characterId is required'),
  drone_definition_id: z.string().min(1, 'drone_definition_id is required'),
  custom_name: z.string().max(100).optional(),
});

const customizeDroneSchema = z.object({
  characterId: z.string().min(1, 'characterId is required'),
  custom_name: z.string().max(100).optional(),
  paint_scheme: z.record(z.unknown()).optional(),
  equipped_weapons: z.array(z.record(z.unknown())).optional(),
  equipped_tools: z.array(z.record(z.unknown())).optional(),
});

const deployDroneSchema = z.object({
  characterId: z.string().min(1, 'characterId is required'),
  deploy: z.boolean(),
  autonomous: z.boolean().default(false),
  location_id: z.string().optional(),
});

const repairDroneSchema = z.object({
  characterId: z.string().min(1, 'characterId is required'),
  repair_amount: z.number().positive().optional(),
  full_repair: z.boolean().optional(),
}).refine(
  data => data.repair_amount !== undefined || data.full_repair !== undefined,
  { message: 'Must specify repair_amount or full_repair' }
);

const createSwarmSchema = z.object({
  characterId: z.string().min(1, 'characterId is required'),
  name: z.string().min(1, 'name is required').max(100),
  drone_ids: z.array(z.string()).min(2, 'At least 2 drones required for a swarm'),
  swarm_type: z.string().optional(),
  formation: z.string().optional(),
});

const swarmCommandSchema = z.object({
  characterId: z.string().min(1, 'characterId is required'),
  command: z.enum(['formation', 'behavior', 'target']),
  value: z.string(),
  target_type: z.string().optional(),
});

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

// =============================================================================
// HELPER
// =============================================================================

function getService(c: any): DroneService {
  const userId = c.get('userId');
  if (!userId) {
    console.warn('[DroneAPI] Warning: No userId found in context, defaulting to system');
  }

  return new DroneService({
    db: c.env.DB,
    cache: c.env.CACHE,
    userId: userId || 'system',
    characterId: c.req.query('characterId') // Optional context
  });
}

// =============================================================================
// ROUTES
// =============================================================================

export const droneRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Require authentication for all drone routes
droneRoutes.use('*', authMiddleware());

// =============================================================================
// DRONE DEFINITION ENDPOINTS
// =============================================================================

/**
 * GET /drones
 * List drone definitions with optional filtering
 */
droneRoutes.get('/', async (c) => {
  try {
    const role = c.req.query('role');
    const tier = c.req.query('tier');
    const swarmCompatible = c.req.query('swarm_compatible');

    console.log('Fetching drone definitions...');
    const service = getService(c);
    const drones = await service.getDroneDefinitions({
      role,
      tier: tier ? parseInt(tier, 10) : undefined,
      swarmCompatible: swarmCompatible === 'true'
    });
    console.log(`Found ${drones.length} drones`);

    return c.json({
      success: true,
      data: {
        drones,
        total: drones.length,
      },
    });
  } catch (err) {
    console.error('Error in GET /drones:', err);
    return c.json({ success: false, error: String(err) }, 500);
  }
});

/**
 * GET /drones/by-role/:role
 * Filter drones by role
 */
droneRoutes.get('/by-role/:role', async (c) => {
  const { role } = c.req.param();
  const service = getService(c);
  const drones = await service.getDroneDefinitions({ role });

  return c.json({
    success: true,
    data: {
      role,
      drones,
      total: drones.length,
    },
  });
});

/**
 * GET /drones/by-class/:class
 * Filter drones by class (Stubbed for now as service doesn't filter class yet implicitly)
 */
droneRoutes.get('/by-class/:class', async (c) => {
  // Falls back to generic list for now, or strictly filtering in memory if needed
  // But for refactor parity, we'll keep it simple
  return c.json({ success: true, message: 'Endpoint deprecated in favor of /drones?class=X' });
});

/**
 * GET /drones/character
 * List character's drones
 */
droneRoutes.get('/character', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);

  const service = getService(c);
  const drones = await service.getPlayerDrones(characterId);

  return c.json({
    success: true,
    data: {
      drones,
      total: drones.length,
    },
  });
});

/**
 * GET /drones/character/:id
 * Get individual drone state
 */
droneRoutes.get('/character/:id', async (c) => {
  const { id } = c.req.param();
  const service = getService(c);
  const drone = await service.getDroneDetails(id);

  if (!drone) return c.json({ success: false, errors: [{ message: 'Drone not found' }] }, 404);

  return c.json({ success: true, data: { drone } });
});

/**
 * POST /drones/character/acquire
 * Purchase a drone
 */
droneRoutes.post('/character/acquire', zValidator('json', acquireDroneSchema), async (c) => {
  const data = c.req.valid('json');
  const service = getService(c);

  const result = await service.purchaseDrone(data.characterId, data.drone_definition_id, data.custom_name);

  if (!result.success) {
    return c.json({ success: false, errors: [{ message: result.message }] }, 400);
  }

  return c.json({ success: true, data: { droneId: result.droneId, message: result.message } });
});

/**
 * PATCH /drones/character/:id
 * Customize drone
 */
droneRoutes.patch('/character/:id', zValidator('json', customizeDroneSchema), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid('json');
  const service = getService(c);

  await service.customizeDrone(id, {
    name: data.custom_name,
    paint: data.paint_scheme
  });

  return c.json({ success: true, message: 'Drone updated' });
});

/**
 * POST /drones/character/:id/deploy
 * Deploy/Recall drone
 */
droneRoutes.post('/character/:id/deploy', zValidator('json', deployDroneSchema), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid('json');
  const service = getService(c);

  if (data.deploy) {
    if (!data.location_id) return c.json({ success: false, message: 'location_id required for deployment' }, 400);
    const result = await service.deployDrone(id, data.location_id);
    return c.json(result);
  } else {
    const result = await service.recallDrone(id);
    return c.json(result);
  }
});

/**
 * POST /drones/character/:id/repair
 * Repair drone
 */
droneRoutes.post('/character/:id/repair', zValidator('json', repairDroneSchema), async (c) => {
  const { id } = c.req.param();
  const service = getService(c);

  // Ignoring repair_amount for now, strictly full repair as per service impl
  const result = await service.repairDrone(id);
  return c.json(result);
});


// =============================================================================
// SWARM ENDPOINTS
// =============================================================================

/**
 * GET /drones/swarms
 * List character's swarms
 */
droneRoutes.get('/swarms', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);

  const service = getService(c);
  // Service.getPlayerSwarms currently returns just swarms, we might want to enrich it
  // But for now, we follow the service contract
  const swarms = await service.getPlayerSwarms(characterId);

  return c.json({
    success: true,
    data: {
      swarms,
      total: swarms.length,
    },
  });
});

/**
 * GET /drones/swarms/:id
 * Get swarm details
 */
droneRoutes.get('/swarms/:id', async (c) => {
  const { id } = c.req.param();
  const service = getService(c);
  const swarm = await service.getSwarmDetails(id);

  if (!swarm) return c.json({ success: false, errors: [{ message: 'Swarm not found' }] }, 404);

  return c.json({ success: true, data: { swarm } });
});

/**
 * POST /drones/swarms
 * Create Swarm
 */
droneRoutes.post('/swarms', zValidator('json', createSwarmSchema), async (c) => {
  const data = c.req.valid('json');
  const service = getService(c);

  const dto: CreateSwarmDTO = {
    name: data.name,
    characterId: data.characterId,
    droneIds: data.drone_ids,
    swarmType: data.swarm_type,
    formation: data.formation
  };

  const result = await service.createSwarm(dto);
  if (!result.success) return c.json({ success: false, message: result.message }, 400);

  return c.json({ success: true, data: { swarmId: result.swarmId } });
});

/**
 * POST /drones/swarms/:id/command
 * Command Swarm
 */
droneRoutes.post('/swarms/:id/command', zValidator('json', swarmCommandSchema), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid('json');
  const service = getService(c);

  // Map command enum to service expectations
  const result = await service.commandSwarm(id, data.command, data.value);

  return c.json(result);
});

/**
 * DELETE /drones/swarms/:id
 * Disband Swarm
 */
droneRoutes.delete('/swarms/:id', async (c) => {
  const { id } = c.req.param();
  const service = getService(c);

  await service.disbandSwarm(id);
  return c.json({ success: true, message: 'Swarm disbanded' });
});

// =============================================================================
// INDIVIDUAL DRONE DEFINITION
// =============================================================================

/**
 * GET /drones/:id
 * Get drone definition details
 */
droneRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  const service = getService(c);
  const drone = await service.getDroneDefinition(id);

  if (!drone) return c.json({ success: false, errors: [{ message: 'Drone not found' }] }, 404);

  return c.json({ success: true, data: { drone } });
});
