/**
 * World State API
 *
 * Manages weather conditions and in-game time state.
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

export const worldstateRoutes = new Hono<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>();

// ============================================
// WEATHER CONDITIONS
// ============================================

interface WeatherCondition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  weatherType: string | null;
  severity: number;
  isHazardous: boolean;
  visibilityModifier: number;
  speedModifier: number;
  handlingModifier: number;
  stealthModifier: number;
  damagePerMinute: number;
  specialEquipmentNeeded: string[] | null;
  vehicleRequirements: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// List all weather conditions
worldstateRoutes.get('/weather', async (c) => {
  const db = c.env.DB;
  const weatherType = c.req.query('type');
  const hazardousOnly = c.req.query('hazardous') === 'true';

  let query = 'SELECT * FROM weather_conditions WHERE 1=1';
  const params: unknown[] = [];

  if (weatherType) {
    query += ' AND weather_type = ?';
    params.push(weatherType);
  }

  if (hazardousOnly) {
    query += ' AND is_hazardous = 1';
  }

  query += ' ORDER BY severity DESC, name ASC';

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();

  const conditions: WeatherCondition[] = result.results.map((row) => ({
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    description: row.description as string | null,
    weatherType: row.weather_type as string | null,
    severity: row.severity as number,
    isHazardous: (row.is_hazardous as number) === 1,
    visibilityModifier: row.visibility_modifier as number,
    speedModifier: row.speed_modifier as number,
    handlingModifier: row.handling_modifier as number,
    stealthModifier: row.stealth_modifier as number,
    damagePerMinute: row.damage_per_minute as number,
    specialEquipmentNeeded: parseJsonField<string[] | null>(row.special_equipment_needed, null),
    vehicleRequirements: parseJsonField<Record<string, unknown> | null>(row.vehicle_requirements, null),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));

  return c.json({
    success: true,
    data: {
      conditions,
      total: conditions.length,
    },
  });
});

// Get specific weather condition
worldstateRoutes.get('/weather/:code', async (c) => {
  const db = c.env.DB;
  const code = c.req.param('code');

  const result = await db
    .prepare('SELECT * FROM weather_conditions WHERE code = ?')
    .bind(code)
    .first();

  if (!result) {
    throw new HTTPException(404, { message: 'Weather condition not found' });
  }

  const condition: WeatherCondition = {
    id: result.id as string,
    code: result.code as string,
    name: result.name as string,
    description: result.description as string | null,
    weatherType: result.weather_type as string | null,
    severity: result.severity as number,
    isHazardous: (result.is_hazardous as number) === 1,
    visibilityModifier: result.visibility_modifier as number,
    speedModifier: result.speed_modifier as number,
    handlingModifier: result.handling_modifier as number,
    stealthModifier: result.stealth_modifier as number,
    damagePerMinute: result.damage_per_minute as number,
    specialEquipmentNeeded: parseJsonField<string[] | null>(result.special_equipment_needed, null),
    vehicleRequirements: parseJsonField<Record<string, unknown> | null>(result.vehicle_requirements, null),
    createdAt: result.created_at as string,
    updatedAt: result.updated_at as string,
  };

  return c.json({
    success: true,
    data: { condition },
  });
});

// Create weather condition
worldstateRoutes.post('/weather', authMiddleware, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  if (!body.code || !body.name) {
    throw new HTTPException(400, { message: 'code and name are required' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO weather_conditions (
        id, code, name, description, weather_type, severity, is_hazardous,
        visibility_modifier, speed_modifier, handling_modifier, stealth_modifier,
        damage_per_minute, special_equipment_needed, vehicle_requirements,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      body.code,
      body.name,
      body.description || null,
      body.weatherType || null,
      body.severity || 1,
      body.isHazardous ? 1 : 0,
      body.visibilityModifier || 1.0,
      body.speedModifier || 1.0,
      body.handlingModifier || 1.0,
      body.stealthModifier || 1.0,
      body.damagePerMinute || 0,
      body.specialEquipmentNeeded ? JSON.stringify(body.specialEquipmentNeeded) : null,
      body.vehicleRequirements ? JSON.stringify(body.vehicleRequirements) : null,
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

// Calculate weather effects for a scenario
worldstateRoutes.post('/weather/:code/calculate', async (c) => {
  const db = c.env.DB;
  const code = c.req.param('code');
  const body = await c.req.json();

  const result = await db
    .prepare('SELECT * FROM weather_conditions WHERE code = ?')
    .bind(code)
    .first();

  if (!result) {
    throw new HTTPException(404, { message: 'Weather condition not found' });
  }

  const baseSpeed = body.baseSpeed || 100;
  const baseVisibility = body.baseVisibility || 100;
  const baseStealth = body.baseStealth || 50;
  const exposureMinutes = body.exposureMinutes || 0;

  const effectiveSpeed = baseSpeed * (result.speed_modifier as number);
  const effectiveVisibility = baseVisibility * (result.visibility_modifier as number);
  const effectiveStealth = baseStealth * (result.stealth_modifier as number);
  const damageFromExposure = exposureMinutes * (result.damage_per_minute as number);

  const specialEquipment = parseJsonField<string[] | null>(result.special_equipment_needed, null);
  const hasRequiredEquipment = body.equipment
    ? !specialEquipment || specialEquipment.every((eq: string) => body.equipment.includes(eq))
    : !specialEquipment;

  return c.json({
    success: true,
    data: {
      weatherCode: code,
      effects: {
        effectiveSpeed: Math.round(effectiveSpeed * 10) / 10,
        effectiveVisibility: Math.round(effectiveVisibility * 10) / 10,
        effectiveStealth: Math.round(effectiveStealth * 10) / 10,
        handlingPenalty: Math.round((1 - (result.handling_modifier as number)) * 100),
        damageFromExposure,
      },
      warnings: {
        isHazardous: (result.is_hazardous as number) === 1,
        requiresSpecialEquipment: !!specialEquipment,
        hasRequiredEquipment,
        missingEquipment: hasRequiredEquipment
          ? []
          : (specialEquipment || []).filter((eq: string) => !body.equipment?.includes(eq)),
      },
    },
  });
});

// ============================================
// GAME TIME STATE
// ============================================

interface GameTimeState {
  id: string;
  saveId: string | null;
  currentTimestamp: string | null;
  currentDayOfWeek: number;
  currentHour: number;
  currentMinute: number;
  currentDay: number;
  currentMonth: number;
  currentYear: number;
  daysElapsed: number;
  timeOfDay: string;
  isRushHour: boolean;
  isNight: boolean;
  timeScale: number;
  timePaused: boolean;
  createdAt: string;
  updatedAt: string;
}

// Get current game time (global or for save)
worldstateRoutes.get('/time', async (c) => {
  const db = c.env.DB;
  const saveId = c.req.query('saveId');

  let result;
  if (saveId) {
    result = await db
      .prepare('SELECT * FROM game_time_state WHERE save_id = ?')
      .bind(saveId)
      .first();
  } else {
    // Get global time state (first without save_id or most recent)
    result = await db
      .prepare('SELECT * FROM game_time_state WHERE save_id IS NULL ORDER BY updated_at DESC LIMIT 1')
      .first();
  }

  if (!result) {
    // Return default time
    return c.json({
      success: true,
      data: {
        timeState: null,
        default: {
          currentHour: 8,
          currentMinute: 0,
          currentDay: 1,
          currentMonth: 1,
          currentYear: 2087,
          timeOfDay: 'MORNING',
          isRushHour: true,
          isNight: false,
        },
      },
    });
  }

  const timeState: GameTimeState = {
    id: result.id as string,
    saveId: result.save_id as string | null,
    currentTimestamp: result.current_timestamp as string | null,
    currentDayOfWeek: result.current_day_of_week as number,
    currentHour: result.current_hour as number,
    currentMinute: result.current_minute as number,
    currentDay: result.current_day as number,
    currentMonth: result.current_month as number,
    currentYear: result.current_year as number,
    daysElapsed: result.days_elapsed as number,
    timeOfDay: result.time_of_day as string,
    isRushHour: (result.is_rush_hour as number) === 1,
    isNight: (result.is_night as number) === 1,
    timeScale: result.time_scale as number,
    timePaused: (result.time_paused as number) === 1,
    createdAt: result.created_at as string,
    updatedAt: result.updated_at as string,
  };

  return c.json({
    success: true,
    data: { timeState },
  });
});

// Create/initialize time state for a save
worldstateRoutes.post('/time', authMiddleware, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Determine time of day from hour
  const hour = body.currentHour || 8;
  let timeOfDay = 'MORNING';
  if (hour >= 5 && hour < 9) timeOfDay = 'MORNING';
  else if (hour >= 9 && hour < 12) timeOfDay = 'LATE_MORNING';
  else if (hour >= 12 && hour < 14) timeOfDay = 'NOON';
  else if (hour >= 14 && hour < 17) timeOfDay = 'AFTERNOON';
  else if (hour >= 17 && hour < 20) timeOfDay = 'EVENING';
  else if (hour >= 20 && hour < 23) timeOfDay = 'NIGHT';
  else timeOfDay = 'LATE_NIGHT';

  const isNight = hour >= 20 || hour < 5;
  const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);

  await db
    .prepare(
      `INSERT INTO game_time_state (
        id, save_id, current_timestamp, current_day_of_week,
        current_hour, current_minute, current_day, current_month, current_year,
        days_elapsed, time_of_day, is_rush_hour, is_night,
        time_scale, time_paused, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      body.saveId || null,
      body.currentTimestamp || now,
      body.currentDayOfWeek || 0,
      hour,
      body.currentMinute || 0,
      body.currentDay || 1,
      body.currentMonth || 1,
      body.currentYear || 2087,
      body.daysElapsed || 0,
      timeOfDay,
      isRushHour ? 1 : 0,
      isNight ? 1 : 0,
      body.timeScale || 1.0,
      body.timePaused ? 1 : 0,
      now,
      now
    )
    .run();

  return c.json(
    {
      success: true,
      data: { id },
    },
    201
  );
});

// Advance game time
worldstateRoutes.post('/time/:id/advance', authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();

  const current = await db
    .prepare('SELECT * FROM game_time_state WHERE id = ?')
    .bind(id)
    .first();

  if (!current) {
    throw new HTTPException(404, { message: 'Time state not found' });
  }

  if ((current.time_paused as number) === 1) {
    return c.json({
      success: false,
      errors: [{ code: 'TIME_PAUSED', message: 'Game time is paused' }],
    });
  }

  const minutesToAdvance = body.minutes || 1;
  let newMinute = (current.current_minute as number) + minutesToAdvance;
  let newHour = current.current_hour as number;
  let newDay = current.current_day as number;
  let newMonth = current.current_month as number;
  let newYear = current.current_year as number;
  let newDayOfWeek = current.current_day_of_week as number;
  let daysElapsed = current.days_elapsed as number;

  // Handle minute overflow
  while (newMinute >= 60) {
    newMinute -= 60;
    newHour++;
  }

  // Handle hour overflow
  while (newHour >= 24) {
    newHour -= 24;
    newDay++;
    newDayOfWeek = (newDayOfWeek + 1) % 7;
    daysElapsed++;
  }

  // Handle day overflow (simple 30-day months)
  while (newDay > 30) {
    newDay -= 30;
    newMonth++;
  }

  // Handle month overflow
  while (newMonth > 12) {
    newMonth -= 12;
    newYear++;
  }

  // Determine time of day
  let timeOfDay = 'MORNING';
  if (newHour >= 5 && newHour < 9) timeOfDay = 'MORNING';
  else if (newHour >= 9 && newHour < 12) timeOfDay = 'LATE_MORNING';
  else if (newHour >= 12 && newHour < 14) timeOfDay = 'NOON';
  else if (newHour >= 14 && newHour < 17) timeOfDay = 'AFTERNOON';
  else if (newHour >= 17 && newHour < 20) timeOfDay = 'EVENING';
  else if (newHour >= 20 && newHour < 23) timeOfDay = 'NIGHT';
  else timeOfDay = 'LATE_NIGHT';

  const isNight = newHour >= 20 || newHour < 5;
  const isRushHour = (newHour >= 7 && newHour <= 9) || (newHour >= 17 && newHour <= 19);

  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE game_time_state SET
        current_minute = ?, current_hour = ?, current_day = ?,
        current_month = ?, current_year = ?, current_day_of_week = ?,
        days_elapsed = ?, time_of_day = ?, is_rush_hour = ?, is_night = ?,
        updated_at = ?
       WHERE id = ?`
    )
    .bind(
      newMinute,
      newHour,
      newDay,
      newMonth,
      newYear,
      newDayOfWeek,
      daysElapsed,
      timeOfDay,
      isRushHour ? 1 : 0,
      isNight ? 1 : 0,
      now,
      id
    )
    .run();

  return c.json({
    success: true,
    data: {
      newTime: {
        hour: newHour,
        minute: newMinute,
        day: newDay,
        month: newMonth,
        year: newYear,
        dayOfWeek: newDayOfWeek,
        daysElapsed,
        timeOfDay,
        isRushHour,
        isNight,
      },
      advanced: {
        minutes: minutesToAdvance,
      },
    },
  });
});

// Pause/unpause game time
worldstateRoutes.post('/time/:id/pause', authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();

  const paused = body.paused !== false;

  await db
    .prepare('UPDATE game_time_state SET time_paused = ?, updated_at = ? WHERE id = ?')
    .bind(paused ? 1 : 0, new Date().toISOString(), id)
    .run();

  return c.json({
    success: true,
    data: { paused },
  });
});

// Set time scale
worldstateRoutes.post('/time/:id/scale', authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();

  const scale = Math.max(0.1, Math.min(10, body.scale || 1.0));

  await db
    .prepare('UPDATE game_time_state SET time_scale = ?, updated_at = ? WHERE id = ?')
    .bind(scale, new Date().toISOString(), id)
    .run();

  return c.json({
    success: true,
    data: { timeScale: scale },
  });
});

// Get time cycle information
worldstateRoutes.get('/time/cycles', async (c) => {
  return c.json({
    success: true,
    data: {
      timeOfDayCycles: [
        { name: 'LATE_NIGHT', startHour: 0, endHour: 5, description: 'Dead of night, minimal activity' },
        { name: 'MORNING', startHour: 5, endHour: 9, description: 'Early morning, city waking up' },
        { name: 'LATE_MORNING', startHour: 9, endHour: 12, description: 'Business hours begin' },
        { name: 'NOON', startHour: 12, endHour: 14, description: 'Midday, lunch rush' },
        { name: 'AFTERNOON', startHour: 14, endHour: 17, description: 'Peak business hours' },
        { name: 'EVENING', startHour: 17, endHour: 20, description: 'Rush hour, nightlife begins' },
        { name: 'NIGHT', startHour: 20, endHour: 24, description: 'Night scene active' },
      ],
      rushHours: [
        { startHour: 7, endHour: 9, type: 'MORNING', trafficMultiplier: 1.5 },
        { startHour: 17, endHour: 19, type: 'EVENING', trafficMultiplier: 1.8 },
      ],
      nightHours: { startHour: 20, endHour: 5 },
      daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    },
  });
});

export default worldstateRoutes;
