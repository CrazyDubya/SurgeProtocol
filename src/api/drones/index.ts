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

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

interface DroneDefinition {
  id: string;
  code: string;
  name: string;
  manufacturer: string | null;
  description: string | null;
  drone_class: string;
  drone_role: string;
  size_category: string;
  rarity: string;
  max_speed_kmh: number;
  acceleration: number;
  maneuverability: number;
  hover_capable: number;
  max_altitude_m: number;
  noise_level: number;
  max_hull_points: number;
  armor_rating: number;
  emp_resistance: number;
  battery_capacity_minutes: number;
  recharge_time_minutes: number;
  solar_capable: number;
  max_payload_kg: number;
  cargo_volume_liters: number;
  weapon_mounts: number;
  tool_mounts: number;
  sensor_suite: string | null;
  stealth_detection: number;
  targeting_accuracy: number;
  autonomous_level: number;
  control_range_km: number;
  requires_neural_link: number;
  swarm_compatible: number;
  max_swarm_size: number;
  required_tier: number;
  required_track: string | null;
  required_skill: string | null;
  required_skill_level: number | null;
  base_price: number | null;
  created_at: string;
  updated_at: string;
}

interface CharacterDrone {
  id: string;
  character_id: string;
  drone_definition_id: string;
  acquired_at: string;
  custom_name: string | null;
  serial_number: string | null;
  paint_scheme: string | null;
  current_state: string;
  current_location_id: string | null;
  current_coordinates: string | null;
  altitude_m: number | null;
  current_hull_points: number;
  current_battery: number;
  is_deployed: number;
  is_autonomous: number;
  equipped_weapons: string | null;
  equipped_tools: string | null;
  current_cargo: string | null;
  swarm_id: string | null;
  swarm_role: string | null;
  formation_position: number | null;
  total_flight_hours: number;
  total_missions: number;
  successful_missions: number;
  times_destroyed: number;
  created_at: string;
  updated_at: string;
}

interface DroneSwarm {
  id: string;
  character_id: string;
  name: string;
  swarm_type: string | null;
  max_size: number;
  current_size: number;
  homogeneous: number;
  current_state: string;
  current_formation: string | null;
  center_coordinates: string | null;
  formation_radius_m: number | null;
  current_behavior: string | null;
  target_id: string | null;
  target_type: string | null;
  coordination_bonus: number;
  sensor_coverage_bonus: number;
  intimidation_factor: number;
  effective_speed: number | null;
  effective_range: number | null;
  sync_quality: number;
  created_at: string;
  updated_at: string;
}

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

function formatDroneDefinition(row: DroneDefinition) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    manufacturer: row.manufacturer,
    description: row.description,
    classification: {
      class: row.drone_class,
      role: row.drone_role,
      size: row.size_category,
      rarity: row.rarity,
    },
    performance: {
      max_speed_kmh: row.max_speed_kmh,
      acceleration: row.acceleration,
      maneuverability: row.maneuverability,
      hover_capable: Boolean(row.hover_capable),
      max_altitude_m: row.max_altitude_m,
      noise_level: row.noise_level,
    },
    durability: {
      max_hull_points: row.max_hull_points,
      armor_rating: row.armor_rating,
      emp_resistance: row.emp_resistance,
    },
    power: {
      battery_capacity_minutes: row.battery_capacity_minutes,
      recharge_time_minutes: row.recharge_time_minutes,
      solar_capable: Boolean(row.solar_capable),
    },
    payload: {
      max_payload_kg: row.max_payload_kg,
      cargo_volume_liters: row.cargo_volume_liters,
      weapon_mounts: row.weapon_mounts,
      tool_mounts: row.tool_mounts,
    },
    sensors: {
      suite: parseJsonField(row.sensor_suite, null),
      stealth_detection: row.stealth_detection,
      targeting_accuracy: row.targeting_accuracy,
    },
    control: {
      autonomous_level: row.autonomous_level,
      control_range_km: row.control_range_km,
      requires_neural_link: Boolean(row.requires_neural_link),
      swarm_compatible: Boolean(row.swarm_compatible),
      max_swarm_size: row.max_swarm_size,
    },
    requirements: {
      tier: row.required_tier,
      track: row.required_track,
      skill: row.required_skill,
      skill_level: row.required_skill_level,
    },
    base_price: row.base_price,
  };
}

function formatCharacterDrone(row: CharacterDrone, definition?: DroneDefinition) {
  const base = {
    id: row.id,
    character_id: row.character_id,
    drone_definition_id: row.drone_definition_id,
    acquired_at: row.acquired_at,
    identity: {
      custom_name: row.custom_name,
      serial_number: row.serial_number,
      paint_scheme: parseJsonField(row.paint_scheme, null),
    },
    state: {
      current_state: row.current_state,
      location_id: row.current_location_id,
      coordinates: row.current_coordinates,
      altitude_m: row.altitude_m,
      hull_points: row.current_hull_points,
      battery_percent: row.current_battery,
      is_deployed: Boolean(row.is_deployed),
      is_autonomous: Boolean(row.is_autonomous),
    },
    loadout: {
      weapons: parseJsonField<object[]>(row.equipped_weapons, []),
      tools: parseJsonField<object[]>(row.equipped_tools, []),
      cargo: parseJsonField<object[]>(row.current_cargo, []),
    },
    swarm: row.swarm_id ? {
      id: row.swarm_id,
      role: row.swarm_role,
      formation_position: row.formation_position,
    } : null,
    stats: {
      total_flight_hours: row.total_flight_hours,
      total_missions: row.total_missions,
      successful_missions: row.successful_missions,
      success_rate: row.total_missions > 0 ? row.successful_missions / row.total_missions : 0,
      times_destroyed: row.times_destroyed,
    },
  };

  if (definition) {
    return {
      ...base,
      definition: formatDroneDefinition(definition),
    };
  }

  return base;
}

function formatSwarm(row: DroneSwarm, drones?: CharacterDrone[]) {
  return {
    id: row.id,
    character_id: row.character_id,
    name: row.name,
    composition: {
      type: row.swarm_type,
      max_size: row.max_size,
      current_size: row.current_size,
      homogeneous: Boolean(row.homogeneous),
    },
    state: {
      current_state: row.current_state,
      formation: row.current_formation,
      center_coordinates: row.center_coordinates,
      formation_radius_m: row.formation_radius_m,
    },
    behavior: {
      current: row.current_behavior,
      target_id: row.target_id,
      target_type: row.target_type,
    },
    bonuses: {
      coordination: row.coordination_bonus,
      sensor_coverage: row.sensor_coverage_bonus,
      intimidation: row.intimidation_factor,
    },
    performance: {
      effective_speed: row.effective_speed,
      effective_range: row.effective_range,
      sync_quality: row.sync_quality,
    },
    drones: drones ? drones.map(d => ({
      id: d.id,
      name: d.custom_name,
      role: d.swarm_role,
      position: d.formation_position,
      state: d.current_state,
      hull_percent: d.current_hull_points,
      battery_percent: d.current_battery,
    })) : undefined,
  };
}

function generateSerialNumber(): string {
  const prefix = 'DRN';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// =============================================================================
// ROUTES
// =============================================================================

export const droneRoutes = new Hono<{ Bindings: Bindings }>();

// =============================================================================
// DRONE DEFINITION ENDPOINTS
// =============================================================================

/**
 * GET /drones
 * List drone definitions with optional filtering
 */
droneRoutes.get('/', async (c) => {
  const role = c.req.query('role');
  const droneClass = c.req.query('class');
  const tier = c.req.query('tier');
  const swarmCompatible = c.req.query('swarm_compatible');

  let query = 'SELECT * FROM drone_definitions WHERE 1=1';
  const params: (string | number)[] = [];

  if (role) {
    query += ' AND drone_role = ?';
    params.push(role.toUpperCase());
  }

  if (droneClass) {
    query += ' AND drone_class = ?';
    params.push(droneClass.toUpperCase());
  }

  if (tier) {
    query += ' AND required_tier <= ?';
    params.push(parseInt(tier, 10));
  }

  if (swarmCompatible === 'true') {
    query += ' AND swarm_compatible = 1';
  }

  query += ' ORDER BY required_tier, drone_class, name';

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all<DroneDefinition>();

  return c.json({
    success: true,
    data: {
      drones: result.results.map(formatDroneDefinition),
      total: result.results.length,
    },
  });
});

/**
 * GET /drones/by-role/:role
 * Filter drones by role
 */
droneRoutes.get('/by-role/:role', async (c) => {
  const { role } = c.req.param();

  const result = await c.env.DB.prepare(
    'SELECT * FROM drone_definitions WHERE drone_role = ? ORDER BY required_tier, name'
  ).bind(role.toUpperCase()).all<DroneDefinition>();

  return c.json({
    success: true,
    data: {
      role,
      drones: result.results.map(formatDroneDefinition),
      total: result.results.length,
    },
  });
});

/**
 * GET /drones/by-class/:class
 * Filter drones by class
 */
droneRoutes.get('/by-class/:class', async (c) => {
  const droneClass = c.req.param('class');

  const result = await c.env.DB.prepare(
    'SELECT * FROM drone_definitions WHERE drone_class = ? ORDER BY required_tier, name'
  ).bind(droneClass.toUpperCase()).all<DroneDefinition>();

  return c.json({
    success: true,
    data: {
      class: droneClass,
      drones: result.results.map(formatDroneDefinition),
      total: result.results.length,
    },
  });
});

/**
 * GET /drones/character
 * List character's drones
 */
droneRoutes.get('/character', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const deployedOnly = c.req.query('deployed') === 'true';
  const availableOnly = c.req.query('available') === 'true';

  let query = `
    SELECT cd.*, dd.*,
           cd.id as cd_id, dd.id as dd_id
    FROM character_drones cd
    JOIN drone_definitions dd ON cd.drone_definition_id = dd.id
    WHERE cd.character_id = ?
  `;
  const params: (string | number)[] = [characterId];

  if (deployedOnly) {
    query += ' AND cd.is_deployed = 1';
  }

  if (availableOnly) {
    query += ' AND cd.is_deployed = 0 AND cd.current_state != ?';
    params.push('DESTROYED');
  }

  query += ' ORDER BY cd.is_deployed DESC, cd.custom_name, dd.name';

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all();

  const drones = result.results.map((row: Record<string, unknown>) => {
    const charDrone: CharacterDrone = {
      id: row.cd_id as string,
      character_id: row.character_id as string,
      drone_definition_id: row.drone_definition_id as string,
      acquired_at: row.acquired_at as string,
      custom_name: row.custom_name as string | null,
      serial_number: row.serial_number as string | null,
      paint_scheme: row.paint_scheme as string | null,
      current_state: row.current_state as string,
      current_location_id: row.current_location_id as string | null,
      current_coordinates: row.current_coordinates as string | null,
      altitude_m: row.altitude_m as number | null,
      current_hull_points: row.current_hull_points as number,
      current_battery: row.current_battery as number,
      is_deployed: row.is_deployed as number,
      is_autonomous: row.is_autonomous as number,
      equipped_weapons: row.equipped_weapons as string | null,
      equipped_tools: row.equipped_tools as string | null,
      current_cargo: row.current_cargo as string | null,
      swarm_id: row.swarm_id as string | null,
      swarm_role: row.swarm_role as string | null,
      formation_position: row.formation_position as number | null,
      total_flight_hours: row.total_flight_hours as number,
      total_missions: row.total_missions as number,
      successful_missions: row.successful_missions as number,
      times_destroyed: row.times_destroyed as number,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };

    const definition: DroneDefinition = {
      id: row.dd_id as string,
      code: row.code as string,
      name: row.name as string,
      manufacturer: row.manufacturer as string | null,
      description: row.description as string | null,
      drone_class: row.drone_class as string,
      drone_role: row.drone_role as string,
      size_category: row.size_category as string,
      rarity: row.rarity as string,
      max_speed_kmh: row.max_speed_kmh as number,
      acceleration: row.acceleration as number,
      maneuverability: row.maneuverability as number,
      hover_capable: row.hover_capable as number,
      max_altitude_m: row.max_altitude_m as number,
      noise_level: row.noise_level as number,
      max_hull_points: row.max_hull_points as number,
      armor_rating: row.armor_rating as number,
      emp_resistance: row.emp_resistance as number,
      battery_capacity_minutes: row.battery_capacity_minutes as number,
      recharge_time_minutes: row.recharge_time_minutes as number,
      solar_capable: row.solar_capable as number,
      max_payload_kg: row.max_payload_kg as number,
      cargo_volume_liters: row.cargo_volume_liters as number,
      weapon_mounts: row.weapon_mounts as number,
      tool_mounts: row.tool_mounts as number,
      sensor_suite: row.sensor_suite as string | null,
      stealth_detection: row.stealth_detection as number,
      targeting_accuracy: row.targeting_accuracy as number,
      autonomous_level: row.autonomous_level as number,
      control_range_km: row.control_range_km as number,
      requires_neural_link: row.requires_neural_link as number,
      swarm_compatible: row.swarm_compatible as number,
      max_swarm_size: row.max_swarm_size as number,
      required_tier: row.required_tier as number,
      required_track: row.required_track as string | null,
      required_skill: row.required_skill as string | null,
      required_skill_level: row.required_skill_level as number | null,
      base_price: row.base_price as number | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };

    return formatCharacterDrone(charDrone, definition);
  });

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
  const characterId = c.req.query('characterId');

  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const result = await c.env.DB.prepare(`
    SELECT cd.*, dd.*,
           cd.id as cd_id, dd.id as dd_id
    FROM character_drones cd
    JOIN drone_definitions dd ON cd.drone_definition_id = dd.id
    WHERE cd.id = ? AND cd.character_id = ?
  `).bind(id, characterId).first();

  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Drone not found' }] }, 404);
  }

  const row = result as Record<string, unknown>;
  const charDrone: CharacterDrone = {
    id: row.cd_id as string,
    character_id: row.character_id as string,
    drone_definition_id: row.drone_definition_id as string,
    acquired_at: row.acquired_at as string,
    custom_name: row.custom_name as string | null,
    serial_number: row.serial_number as string | null,
    paint_scheme: row.paint_scheme as string | null,
    current_state: row.current_state as string,
    current_location_id: row.current_location_id as string | null,
    current_coordinates: row.current_coordinates as string | null,
    altitude_m: row.altitude_m as number | null,
    current_hull_points: row.current_hull_points as number,
    current_battery: row.current_battery as number,
    is_deployed: row.is_deployed as number,
    is_autonomous: row.is_autonomous as number,
    equipped_weapons: row.equipped_weapons as string | null,
    equipped_tools: row.equipped_tools as string | null,
    current_cargo: row.current_cargo as string | null,
    swarm_id: row.swarm_id as string | null,
    swarm_role: row.swarm_role as string | null,
    formation_position: row.formation_position as number | null,
    total_flight_hours: row.total_flight_hours as number,
    total_missions: row.total_missions as number,
    successful_missions: row.successful_missions as number,
    times_destroyed: row.times_destroyed as number,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };

  const definition: DroneDefinition = {
    id: row.dd_id as string,
    code: row.code as string,
    name: row.name as string,
    manufacturer: row.manufacturer as string | null,
    description: row.description as string | null,
    drone_class: row.drone_class as string,
    drone_role: row.drone_role as string,
    size_category: row.size_category as string,
    rarity: row.rarity as string,
    max_speed_kmh: row.max_speed_kmh as number,
    acceleration: row.acceleration as number,
    maneuverability: row.maneuverability as number,
    hover_capable: row.hover_capable as number,
    max_altitude_m: row.max_altitude_m as number,
    noise_level: row.noise_level as number,
    max_hull_points: row.max_hull_points as number,
    armor_rating: row.armor_rating as number,
    emp_resistance: row.emp_resistance as number,
    battery_capacity_minutes: row.battery_capacity_minutes as number,
    recharge_time_minutes: row.recharge_time_minutes as number,
    solar_capable: row.solar_capable as number,
    max_payload_kg: row.max_payload_kg as number,
    cargo_volume_liters: row.cargo_volume_liters as number,
    weapon_mounts: row.weapon_mounts as number,
    tool_mounts: row.tool_mounts as number,
    sensor_suite: row.sensor_suite as string | null,
    stealth_detection: row.stealth_detection as number,
    targeting_accuracy: row.targeting_accuracy as number,
    autonomous_level: row.autonomous_level as number,
    control_range_km: row.control_range_km as number,
    requires_neural_link: row.requires_neural_link as number,
    swarm_compatible: row.swarm_compatible as number,
    max_swarm_size: row.max_swarm_size as number,
    required_tier: row.required_tier as number,
    required_track: row.required_track as string | null,
    required_skill: row.required_skill as string | null,
    required_skill_level: row.required_skill_level as number | null,
    base_price: row.base_price as number | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };

  return c.json({
    success: true,
    data: {
      drone: formatCharacterDrone(charDrone, definition),
    },
  });
});

/**
 * GET /drones/swarms
 * List character's swarms
 */
droneRoutes.get('/swarms', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const result = await c.env.DB.prepare(
    'SELECT * FROM drone_swarms WHERE character_id = ? ORDER BY name'
  ).bind(characterId).all<DroneSwarm>();

  // Get drones for each swarm
  const swarmsWithCounts = await Promise.all(
    result.results.map(async (swarm) => {
      const drones = await c.env.DB.prepare(
        'SELECT id, custom_name, swarm_role, formation_position, current_state, current_hull_points, current_battery FROM character_drones WHERE swarm_id = ?'
      ).bind(swarm.id).all<CharacterDrone>();
      return formatSwarm(swarm, drones.results);
    })
  );

  return c.json({
    success: true,
    data: {
      swarms: swarmsWithCounts,
      total: swarmsWithCounts.length,
    },
  });
});

/**
 * GET /drones/swarms/:id
 * Get swarm details with member drones
 */
droneRoutes.get('/swarms/:id', async (c) => {
  const { id } = c.req.param();
  const characterId = c.req.query('characterId');

  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const swarm = await c.env.DB.prepare(
    'SELECT * FROM drone_swarms WHERE id = ? AND character_id = ?'
  ).bind(id, characterId).first<DroneSwarm>();

  if (!swarm) {
    return c.json({ success: false, errors: [{ message: 'Swarm not found' }] }, 404);
  }

  const drones = await c.env.DB.prepare(
    'SELECT * FROM character_drones WHERE swarm_id = ? ORDER BY formation_position'
  ).bind(id).all<CharacterDrone>();

  return c.json({
    success: true,
    data: {
      swarm: formatSwarm(swarm, drones.results),
    },
  });
});

/**
 * GET /drones/:id
 * Get drone definition details
 */
droneRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();

  const result = await c.env.DB.prepare(
    'SELECT * FROM drone_definitions WHERE id = ?'
  ).bind(id).first<DroneDefinition>();

  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Drone not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: {
      drone: formatDroneDefinition(result),
    },
  });
});

// =============================================================================
// MUTATION ENDPOINTS
// =============================================================================

/**
 * POST /drones/character/acquire
 * Purchase/acquire a new drone
 */
droneRoutes.post('/character/acquire', async (c) => {
  const body = await c.req.json<{
    characterId: string;
    drone_definition_id: string;
    custom_name?: string;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (!body.drone_definition_id) {
    return c.json({ success: false, errors: [{ message: 'drone_definition_id is required' }] }, 400);
  }

  // Verify drone definition exists
  const definition = await c.env.DB.prepare(
    'SELECT * FROM drone_definitions WHERE id = ?'
  ).bind(body.drone_definition_id).first<DroneDefinition>();

  if (!definition) {
    return c.json({ success: false, errors: [{ message: 'Drone definition not found' }] }, 404);
  }

  const now = new Date().toISOString();
  const newId = crypto.randomUUID();
  const serialNumber = generateSerialNumber();

  await c.env.DB.prepare(`
    INSERT INTO character_drones (
      id, character_id, drone_definition_id, acquired_at,
      custom_name, serial_number, current_state,
      current_hull_points, current_battery, is_deployed, is_autonomous,
      total_flight_hours, total_missions, successful_missions, times_destroyed,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 100, 0, 0, 0, 0, 0, 0, ?, ?)
  `).bind(
    newId,
    body.characterId,
    body.drone_definition_id,
    now,
    body.custom_name || null,
    serialNumber,
    'DOCKED',
    definition.max_hull_points,
    now,
    now
  ).run();

  return c.json({
    success: true,
    data: {
      drone_id: newId,
      serial_number: serialNumber,
      drone_name: body.custom_name || definition.name,
    },
  }, 201);
});

/**
 * PATCH /drones/character/:id
 * Customize drone (name, paint, loadout)
 */
droneRoutes.patch('/character/:id', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    characterId: string;
    custom_name?: string;
    paint_scheme?: object;
    equipped_weapons?: object[];
    equipped_tools?: object[];
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  // Verify drone ownership
  const drone = await c.env.DB.prepare(
    'SELECT id FROM character_drones WHERE id = ? AND character_id = ?'
  ).bind(id, body.characterId).first();

  if (!drone) {
    return c.json({ success: false, errors: [{ message: 'Drone not found' }] }, 404);
  }

  const updates: string[] = [];
  const params: (string | null)[] = [];

  if (body.custom_name !== undefined) {
    updates.push('custom_name = ?');
    params.push(body.custom_name);
  }

  if (body.paint_scheme !== undefined) {
    updates.push('paint_scheme = ?');
    params.push(JSON.stringify(body.paint_scheme));
  }

  if (body.equipped_weapons !== undefined) {
    updates.push('equipped_weapons = ?');
    params.push(JSON.stringify(body.equipped_weapons));
  }

  if (body.equipped_tools !== undefined) {
    updates.push('equipped_tools = ?');
    params.push(JSON.stringify(body.equipped_tools));
  }

  if (updates.length === 0) {
    return c.json({ success: false, errors: [{ message: 'No updates provided' }] }, 400);
  }

  const now = new Date().toISOString();
  updates.push('updated_at = ?');
  params.push(now);
  params.push(id);

  await c.env.DB.prepare(`
    UPDATE character_drones SET ${updates.join(', ')} WHERE id = ?
  `).bind(...params).run();

  return c.json({
    success: true,
    data: {
      drone_id: id,
      updated: true,
    },
  });
});

/**
 * POST /drones/character/:id/deploy
 * Deploy or recall a drone
 */
droneRoutes.post('/character/:id/deploy', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    characterId: string;
    deploy: boolean;
    autonomous?: boolean;
    location_id?: string;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (typeof body.deploy !== 'boolean') {
    return c.json({ success: false, errors: [{ message: 'deploy must be a boolean' }] }, 400);
  }

  // Verify drone ownership and state
  const drone = await c.env.DB.prepare(
    'SELECT * FROM character_drones WHERE id = ? AND character_id = ?'
  ).bind(id, body.characterId).first<CharacterDrone>();

  if (!drone) {
    return c.json({ success: false, errors: [{ message: 'Drone not found' }] }, 404);
  }

  if (drone.current_state === 'DESTROYED') {
    return c.json({ success: false, errors: [{ message: 'Cannot deploy a destroyed drone' }] }, 400);
  }

  if (body.deploy && drone.current_battery < 10) {
    return c.json({ success: false, errors: [{ message: 'Insufficient battery to deploy' }] }, 400);
  }

  const now = new Date().toISOString();
  const newState = body.deploy ? 'FLYING' : 'DOCKED';

  await c.env.DB.prepare(`
    UPDATE character_drones SET
      is_deployed = ?,
      is_autonomous = ?,
      current_state = ?,
      current_location_id = ?,
      updated_at = ?
    WHERE id = ?
  `).bind(
    body.deploy ? 1 : 0,
    body.autonomous ? 1 : 0,
    newState,
    body.deploy ? body.location_id : null,
    now,
    id
  ).run();

  return c.json({
    success: true,
    data: {
      drone_id: id,
      is_deployed: body.deploy,
      current_state: newState,
    },
  });
});

/**
 * POST /drones/character/:id/repair
 * Repair drone damage
 */
droneRoutes.post('/character/:id/repair', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    characterId: string;
    repair_amount?: number;
    full_repair?: boolean;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  // Get drone with definition
  const result = await c.env.DB.prepare(`
    SELECT cd.*, dd.max_hull_points
    FROM character_drones cd
    JOIN drone_definitions dd ON cd.drone_definition_id = dd.id
    WHERE cd.id = ? AND cd.character_id = ?
  `).bind(id, body.characterId).first<CharacterDrone & { max_hull_points: number }>();

  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Drone not found' }] }, 404);
  }

  let newHullPoints: number;
  if (body.full_repair) {
    newHullPoints = result.max_hull_points;
  } else if (body.repair_amount) {
    newHullPoints = Math.min(result.max_hull_points, result.current_hull_points + body.repair_amount);
  } else {
    return c.json({ success: false, errors: [{ message: 'Must specify repair_amount or full_repair' }] }, 400);
  }

  const now = new Date().toISOString();
  const newState = result.current_state === 'DESTROYED' && newHullPoints > 0 ? 'DOCKED' : result.current_state;

  await c.env.DB.prepare(`
    UPDATE character_drones SET
      current_hull_points = ?,
      current_state = ?,
      updated_at = ?
    WHERE id = ?
  `).bind(newHullPoints, newState, now, id).run();

  return c.json({
    success: true,
    data: {
      drone_id: id,
      hull_points: newHullPoints,
      max_hull_points: result.max_hull_points,
      current_state: newState,
    },
  });
});

/**
 * DELETE /drones/character/:id
 * Scrap/sell a drone
 */
droneRoutes.delete('/character/:id', async (c) => {
  const { id } = c.req.param();
  const characterId = c.req.query('characterId');

  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  // Verify drone ownership
  const drone = await c.env.DB.prepare(
    'SELECT id, is_deployed, swarm_id FROM character_drones WHERE id = ? AND character_id = ?'
  ).bind(id, characterId).first<CharacterDrone>();

  if (!drone) {
    return c.json({ success: false, errors: [{ message: 'Drone not found' }] }, 404);
  }

  if (drone.is_deployed) {
    return c.json({ success: false, errors: [{ message: 'Cannot scrap a deployed drone. Recall it first.' }] }, 400);
  }

  if (drone.swarm_id) {
    return c.json({ success: false, errors: [{ message: 'Remove drone from swarm before scrapping' }] }, 400);
  }

  await c.env.DB.prepare(
    'DELETE FROM character_drones WHERE id = ?'
  ).bind(id).run();

  return c.json({
    success: true,
    data: {
      drone_id: id,
      scrapped: true,
    },
  });
});

// =============================================================================
// SWARM ENDPOINTS
// =============================================================================

/**
 * POST /drones/swarms
 * Create a new swarm
 */
droneRoutes.post('/swarms', async (c) => {
  const body = await c.req.json<{
    characterId: string;
    name: string;
    drone_ids: string[];
    swarm_type?: string;
    formation?: string;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (!body.name) {
    return c.json({ success: false, errors: [{ message: 'name is required' }] }, 400);
  }

  if (!body.drone_ids || body.drone_ids.length < 2) {
    return c.json({ success: false, errors: [{ message: 'At least 2 drones required for a swarm' }] }, 400);
  }

  // Verify all drones belong to character and are swarm-compatible
  const drones = await c.env.DB.prepare(`
    SELECT cd.id, cd.swarm_id, dd.swarm_compatible, dd.max_swarm_size
    FROM character_drones cd
    JOIN drone_definitions dd ON cd.drone_definition_id = dd.id
    WHERE cd.character_id = ? AND cd.id IN (${body.drone_ids.map(() => '?').join(',')})
  `).bind(body.characterId, ...body.drone_ids).all<{ id: string; swarm_id: string | null; swarm_compatible: number; max_swarm_size: number }>();

  if (drones.results.length !== body.drone_ids.length) {
    return c.json({ success: false, errors: [{ message: 'Some drones not found or not owned' }] }, 400);
  }

  const incompatible = drones.results.filter(d => !d.swarm_compatible);
  if (incompatible.length > 0) {
    return c.json({ success: false, errors: [{ message: 'Some drones are not swarm-compatible' }] }, 400);
  }

  const alreadyInSwarm = drones.results.filter(d => d.swarm_id);
  if (alreadyInSwarm.length > 0) {
    return c.json({ success: false, errors: [{ message: 'Some drones are already in a swarm' }] }, 400);
  }

  // Create swarm
  const now = new Date().toISOString();
  const swarmId = crypto.randomUUID();
  const maxSize = Math.max(...drones.results.map(d => d.max_swarm_size));

  await c.env.DB.prepare(`
    INSERT INTO drone_swarms (
      id, character_id, name, swarm_type, max_size, current_size, homogeneous,
      current_state, current_formation, coordination_bonus, sensor_coverage_bonus,
      intimidation_factor, sync_quality, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, 100, ?, ?)
  `).bind(
    swarmId,
    body.characterId,
    body.name,
    body.swarm_type || 'GENERAL',
    maxSize,
    body.drone_ids.length,
    'IDLE',
    body.formation || 'FORMATION_V',
    body.drone_ids.length * 5, // coordination bonus
    body.drone_ids.length * 10, // sensor coverage
    body.drone_ids.length * 3, // intimidation
    now,
    now
  ).run();

  // Update drones to be part of swarm
  for (let i = 0; i < body.drone_ids.length; i++) {
    await c.env.DB.prepare(`
      UPDATE character_drones SET
        swarm_id = ?,
        swarm_role = ?,
        formation_position = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(swarmId, i === 0 ? 'LEADER' : 'MEMBER', i, now, body.drone_ids[i]).run();
  }

  return c.json({
    success: true,
    data: {
      swarm_id: swarmId,
      name: body.name,
      size: body.drone_ids.length,
    },
  }, 201);
});

/**
 * PATCH /drones/swarms/:id
 * Update swarm configuration
 */
droneRoutes.patch('/swarms/:id', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    characterId: string;
    name?: string;
    formation?: string;
    add_drone_ids?: string[];
    remove_drone_ids?: string[];
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  // Verify swarm ownership
  const swarm = await c.env.DB.prepare(
    'SELECT * FROM drone_swarms WHERE id = ? AND character_id = ?'
  ).bind(id, body.characterId).first<DroneSwarm>();

  if (!swarm) {
    return c.json({ success: false, errors: [{ message: 'Swarm not found' }] }, 404);
  }

  const now = new Date().toISOString();
  let newSize = swarm.current_size;

  // Handle adding drones
  if (body.add_drone_ids && body.add_drone_ids.length > 0) {
    for (const droneId of body.add_drone_ids) {
      await c.env.DB.prepare(`
        UPDATE character_drones SET
          swarm_id = ?,
          swarm_role = 'MEMBER',
          formation_position = ?,
          updated_at = ?
        WHERE id = ? AND character_id = ? AND swarm_id IS NULL
      `).bind(id, newSize, now, droneId, body.characterId).run();
      newSize++;
    }
  }

  // Handle removing drones
  if (body.remove_drone_ids && body.remove_drone_ids.length > 0) {
    for (const droneId of body.remove_drone_ids) {
      await c.env.DB.prepare(`
        UPDATE character_drones SET
          swarm_id = NULL,
          swarm_role = NULL,
          formation_position = NULL,
          updated_at = ?
        WHERE id = ? AND swarm_id = ?
      `).bind(now, droneId, id).run();
      newSize--;
    }
  }

  // Update swarm properties
  const updates: string[] = ['current_size = ?', 'updated_at = ?'];
  const params: (string | number)[] = [newSize, now];

  if (body.name) {
    updates.push('name = ?');
    params.push(body.name);
  }

  if (body.formation) {
    updates.push('current_formation = ?');
    params.push(body.formation);
  }

  params.push(id);

  await c.env.DB.prepare(`
    UPDATE drone_swarms SET ${updates.join(', ')} WHERE id = ?
  `).bind(...params).run();

  return c.json({
    success: true,
    data: {
      swarm_id: id,
      current_size: newSize,
    },
  });
});

/**
 * POST /drones/swarms/:id/deploy
 * Deploy entire swarm
 */
droneRoutes.post('/swarms/:id/deploy', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    characterId: string;
    location_id?: string;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  // Verify swarm ownership
  const swarm = await c.env.DB.prepare(
    'SELECT * FROM drone_swarms WHERE id = ? AND character_id = ?'
  ).bind(id, body.characterId).first<DroneSwarm>();

  if (!swarm) {
    return c.json({ success: false, errors: [{ message: 'Swarm not found' }] }, 404);
  }

  const now = new Date().toISOString();

  // Deploy all drones in swarm
  await c.env.DB.prepare(`
    UPDATE character_drones SET
      is_deployed = 1,
      current_state = 'FLYING',
      current_location_id = ?,
      updated_at = ?
    WHERE swarm_id = ? AND current_state != 'DESTROYED' AND current_battery >= 10
  `).bind(body.location_id || null, now, id).run();

  // Update swarm state
  await c.env.DB.prepare(`
    UPDATE drone_swarms SET
      current_state = 'DEPLOYED',
      updated_at = ?
    WHERE id = ?
  `).bind(now, id).run();

  return c.json({
    success: true,
    data: {
      swarm_id: id,
      current_state: 'DEPLOYED',
    },
  });
});

/**
 * POST /drones/swarms/:id/recall
 * Recall entire swarm
 */
droneRoutes.post('/swarms/:id/recall', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{ characterId: string }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  // Verify swarm ownership
  const swarm = await c.env.DB.prepare(
    'SELECT id FROM drone_swarms WHERE id = ? AND character_id = ?'
  ).bind(id, body.characterId).first();

  if (!swarm) {
    return c.json({ success: false, errors: [{ message: 'Swarm not found' }] }, 404);
  }

  const now = new Date().toISOString();

  // Recall all drones
  await c.env.DB.prepare(`
    UPDATE character_drones SET
      is_deployed = 0,
      current_state = 'DOCKED',
      current_location_id = NULL,
      updated_at = ?
    WHERE swarm_id = ?
  `).bind(now, id).run();

  // Update swarm state
  await c.env.DB.prepare(`
    UPDATE drone_swarms SET
      current_state = 'IDLE',
      updated_at = ?
    WHERE id = ?
  `).bind(now, id).run();

  return c.json({
    success: true,
    data: {
      swarm_id: id,
      current_state: 'IDLE',
    },
  });
});

/**
 * POST /drones/swarms/:id/command
 * Issue swarm command
 */
droneRoutes.post('/swarms/:id/command', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    characterId: string;
    command: 'formation' | 'behavior' | 'target';
    value: string;
    target_type?: string;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (!['formation', 'behavior', 'target'].includes(body.command)) {
    return c.json({ success: false, errors: [{ message: 'Invalid command type' }] }, 400);
  }

  // Verify swarm ownership
  const swarm = await c.env.DB.prepare(
    'SELECT * FROM drone_swarms WHERE id = ? AND character_id = ?'
  ).bind(id, body.characterId).first<DroneSwarm>();

  if (!swarm) {
    return c.json({ success: false, errors: [{ message: 'Swarm not found' }] }, 404);
  }

  const now = new Date().toISOString();
  let updateQuery: string;
  let params: (string | null)[];

  switch (body.command) {
    case 'formation':
      updateQuery = 'UPDATE drone_swarms SET current_formation = ?, updated_at = ? WHERE id = ?';
      params = [body.value, now, id];
      break;
    case 'behavior':
      updateQuery = 'UPDATE drone_swarms SET current_behavior = ?, updated_at = ? WHERE id = ?';
      params = [body.value, now, id];
      break;
    case 'target':
      updateQuery = 'UPDATE drone_swarms SET target_id = ?, target_type = ?, updated_at = ? WHERE id = ?';
      params = [body.value, body.target_type || null, now, id];
      break;
    default:
      return c.json({ success: false, errors: [{ message: 'Invalid command' }] }, 400);
  }

  await c.env.DB.prepare(updateQuery).bind(...params).run();

  return c.json({
    success: true,
    data: {
      swarm_id: id,
      command: body.command,
      value: body.value,
    },
  });
});

/**
 * DELETE /drones/swarms/:id
 * Disband swarm
 */
droneRoutes.delete('/swarms/:id', async (c) => {
  const { id } = c.req.param();
  const characterId = c.req.query('characterId');

  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  // Verify swarm ownership
  const swarm = await c.env.DB.prepare(
    'SELECT id FROM drone_swarms WHERE id = ? AND character_id = ?'
  ).bind(id, characterId).first();

  if (!swarm) {
    return c.json({ success: false, errors: [{ message: 'Swarm not found' }] }, 404);
  }

  const now = new Date().toISOString();

  // Remove all drones from swarm
  await c.env.DB.prepare(`
    UPDATE character_drones SET
      swarm_id = NULL,
      swarm_role = NULL,
      formation_position = NULL,
      updated_at = ?
    WHERE swarm_id = ?
  `).bind(now, id).run();

  // Delete swarm
  await c.env.DB.prepare(
    'DELETE FROM drone_swarms WHERE id = ?'
  ).bind(id).run();

  return c.json({
    success: true,
    data: {
      swarm_id: id,
      disbanded: true,
    },
  });
});
