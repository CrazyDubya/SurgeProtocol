/**
 * Surge Protocol - Vehicle Routes
 *
 * Endpoints:
 * - GET /vehicles/catalog - Browse vehicle definitions
 * - GET /vehicles/catalog/:id - Get vehicle details
 * - GET /vehicles/owned - Get character's vehicles
 * - GET /vehicles/active - Get active vehicle
 * - POST /vehicles/purchase - Buy a vehicle
 * - POST /vehicles/:id/select - Set active vehicle
 * - PATCH /vehicles/:id - Customize vehicle (name, colors)
 * - POST /vehicles/:id/refuel - Refuel vehicle
 * - POST /vehicles/:id/repair - Repair damaged vehicle
 * - POST /vehicles/:id/sell - Sell a vehicle
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import {
  authMiddleware,
  requireCharacterMiddleware,
  type AuthVariables,
} from '../../middleware/auth';
import type { VehicleDefinition, CharacterVehicle } from '../../db/types';

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

const purchaseSchema = z.object({
  vehicleDefinitionId: z.string().min(1),
  customName: z.string().max(50).optional(),
  paintPrimary: z.string().max(7).optional(),
  paintSecondary: z.string().max(7).optional(),
});

const customizeSchema = z.object({
  customName: z.string().max(50).optional(),
  paintPrimary: z.string().max(7).optional(),
  paintSecondary: z.string().max(7).optional(),
});

const refuelSchema = z.object({
  amount: z.number().min(1).max(1000).optional(), // liters, or full tank if not specified
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  return vin;
}

function generateLicensePlate(): string {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const numbers = '0123456789';
  return (
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    '-' +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)]
  );
}

// =============================================================================
// ROUTES
// =============================================================================

export const vehicleRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Apply auth middleware to all routes
vehicleRoutes.use('*', authMiddleware());

/**
 * GET /vehicles/catalog
 * Browse vehicle catalog with optional filters.
 */
vehicleRoutes.get('/catalog', async (c) => {
  const vehicleClass = c.req.query('class');
  const maxTier = c.req.query('maxTier');
  const maxPrice = c.req.query('maxPrice');
  const manufacturer = c.req.query('manufacturer');

  let query = `
    SELECT id, code, name, manufacturer, model_year, description,
           vehicle_class, vehicle_type, size_category, rarity,
           top_speed_kmh, acceleration_0_100_seconds, handling_rating,
           cargo_capacity_kg, cargo_volume_liters, passenger_capacity,
           fuel_capacity, range_km,
           required_tier, base_price
    FROM vehicle_definitions
    WHERE 1=1
  `;

  const params: (string | number)[] = [];

  if (vehicleClass) {
    query += ` AND vehicle_class = ?`;
    params.push(vehicleClass);
  }

  if (maxTier) {
    query += ` AND required_tier <= ?`;
    params.push(parseInt(maxTier, 10));
  }

  if (maxPrice) {
    query += ` AND base_price <= ?`;
    params.push(parseInt(maxPrice, 10));
  }

  if (manufacturer) {
    query += ` AND manufacturer = ?`;
    params.push(manufacturer);
  }

  query += ` ORDER BY vehicle_class, required_tier, base_price LIMIT 100`;

  const stmt = c.env.DB.prepare(query);
  const result = params.length > 0
    ? await stmt.bind(...params).all()
    : await stmt.all();

  // Group by class
  const byClass: Record<string, typeof result.results> = {};
  for (const vehicle of result.results) {
    const vClass = (vehicle.vehicle_class as string) || 'OTHER';
    if (!byClass[vClass]) byClass[vClass] = [];
    byClass[vClass]!.push(vehicle);
  }

  // Get unique manufacturers for filtering
  const manufacturers = [...new Set(result.results.map(v => v.manufacturer).filter(Boolean))];

  return c.json({
    success: true,
    data: {
      vehicles: result.results,
      byClass,
      manufacturers,
      count: result.results.length,
    },
  });
});

/**
 * GET /vehicles/catalog/:id
 * Get detailed vehicle information.
 */
vehicleRoutes.get('/catalog/:id', async (c) => {
  const vehicleId = c.req.param('id');

  const vehicle = await c.env.DB
    .prepare(`SELECT * FROM vehicle_definitions WHERE id = ? OR code = ?`)
    .bind(vehicleId, vehicleId)
    .first();

  if (!vehicle) {
    return c.json({
      success: false,
      errors: [{ code: 'VEHICLE_NOT_FOUND', message: 'Vehicle definition not found' }],
    }, 404);
  }

  // Parse JSON fields
  const damageResistances = vehicle.damage_resistances
    ? JSON.parse(vehicle.damage_resistances as string)
    : null;

  return c.json({
    success: true,
    data: {
      ...vehicle,
      damage_resistances: damageResistances,
      // Calculated stats
      effective_range_km: Math.floor(
        (vehicle.fuel_capacity as number) / (vehicle.fuel_consumption_per_km as number)
      ),
    },
  });
});

/**
 * GET /vehicles/owned
 * Get character's owned vehicles.
 */
vehicleRoutes.get('/owned', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId');

  const result = await c.env.DB
    .prepare(`
      SELECT cv.*, vd.name as definition_name, vd.vehicle_class, vd.manufacturer,
             vd.top_speed_kmh, vd.cargo_capacity_kg, vd.fuel_capacity,
             vd.max_hull_points, vd.base_price
      FROM character_vehicles cv
      JOIN vehicle_definitions vd ON cv.vehicle_definition_id = vd.id
      WHERE cv.character_id = ?
      ORDER BY cv.acquired_at DESC
    `)
    .bind(characterId)
    .all();

  // Get active vehicle ID from character
  const character = await c.env.DB
    .prepare(`SELECT active_vehicle_id FROM characters WHERE id = ?`)
    .bind(characterId)
    .first();

  const activeVehicleId = character?.active_vehicle_id as string | null;

  return c.json({
    success: true,
    data: {
      vehicles: result.results.map(v => ({
        ...v,
        is_active: v.id === activeVehicleId,
        fuel_percent: Math.round(((v.current_fuel as number) / (v.fuel_capacity as number)) * 100),
        hull_percent: Math.round(((v.current_hull_points as number) / (v.max_hull_points as number)) * 100),
      })),
      activeVehicleId,
      count: result.results.length,
    },
  });
});

/**
 * GET /vehicles/active
 * Get character's currently active vehicle.
 */
vehicleRoutes.get('/active', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId');

  const character = await c.env.DB
    .prepare(`SELECT active_vehicle_id FROM characters WHERE id = ?`)
    .bind(characterId)
    .first();

  if (!character?.active_vehicle_id) {
    return c.json({
      success: true,
      data: { vehicle: null, message: 'No active vehicle selected' },
    });
  }

  const vehicle = await c.env.DB
    .prepare(`
      SELECT cv.*, vd.*,
             vd.name as definition_name, vd.id as definition_id
      FROM character_vehicles cv
      JOIN vehicle_definitions vd ON cv.vehicle_definition_id = vd.id
      WHERE cv.id = ? AND cv.character_id = ?
    `)
    .bind(character.active_vehicle_id, characterId)
    .first();

  if (!vehicle) {
    return c.json({
      success: true,
      data: { vehicle: null, message: 'Active vehicle not found' },
    });
  }

  return c.json({
    success: true,
    data: {
      vehicle: {
        ...vehicle,
        fuel_percent: Math.round(((vehicle.current_fuel as number) / (vehicle.fuel_capacity as number)) * 100),
        hull_percent: Math.round(((vehicle.current_hull_points as number) / (vehicle.max_hull_points as number)) * 100),
      },
    },
  });
});

/**
 * POST /vehicles/purchase
 * Purchase a new vehicle.
 */
vehicleRoutes.post('/purchase', requireCharacterMiddleware(), zValidator('json', purchaseSchema), async (c) => {
  const characterId = c.get('characterId');
  const body = c.req.valid('json');

  // Get vehicle definition
  const vehicleDef = await c.env.DB
    .prepare(`SELECT * FROM vehicle_definitions WHERE id = ?`)
    .bind(body.vehicleDefinitionId)
    .first() as VehicleDefinition | null;

  if (!vehicleDef) {
    return c.json({
      success: false,
      errors: [{ code: 'VEHICLE_NOT_FOUND', message: 'Vehicle definition not found' }],
    }, 404);
  }

  // Get character info
  const character = await c.env.DB
    .prepare(`
      SELECT c.id, c.current_tier, cf.primary_currency_balance as credits
      FROM characters c
      LEFT JOIN character_finances cf ON c.id = cf.character_id
      WHERE c.id = ?
    `)
    .bind(characterId)
    .first();

  if (!character) {
    return c.json({
      success: false,
      errors: [{ code: 'CHARACTER_NOT_FOUND', message: 'Character not found' }],
    }, 404);
  }

  // Check tier requirement
  if ((character.current_tier as number) < vehicleDef.required_tier) {
    return c.json({
      success: false,
      errors: [{
        code: 'TIER_REQUIREMENT_NOT_MET',
        message: `Requires Tier ${vehicleDef.required_tier}, you are Tier ${character.current_tier}`,
      }],
    }, 422);
  }

  // Check credits
  const credits = (character.credits as number) || 0;
  if (credits < vehicleDef.base_price) {
    return c.json({
      success: false,
      errors: [{
        code: 'INSUFFICIENT_CREDITS',
        message: `Need ${vehicleDef.base_price} credits, have ${credits}`,
        shortfall: vehicleDef.base_price - credits,
      }],
    }, 422);
  }

  // Create vehicle
  const vehicleId = nanoid();
  const vin = generateVIN();
  const licensePlate = generateLicensePlate();

  await c.env.DB.batch([
    // Deduct credits
    c.env.DB.prepare(`
      UPDATE character_finances
      SET primary_currency_balance = primary_currency_balance - ?
      WHERE character_id = ?
    `).bind(vehicleDef.base_price, characterId),

    // Create vehicle
    c.env.DB.prepare(`
      INSERT INTO character_vehicles (
        id, character_id, vehicle_definition_id, acquired_at,
        custom_name, license_plate, vin, is_registered,
        current_hull_points, current_fuel, odometer_km, is_damaged,
        paint_color_primary, paint_color_secondary,
        ownership_type, owned_outright, insured,
        corporate_issued, corporate_tracked, transponder_disabled,
        total_deliveries, total_distance_km, accidents
      ) VALUES (?, ?, ?, datetime('now'),
        ?, ?, ?, 1,
        ?, ?, 0, 0,
        ?, ?,
        'PURCHASED', 1, 0,
        0, 0, 0,
        0, 0, 0
      )
    `).bind(
      vehicleId, characterId, vehicleDef.id,
      body.customName || null, licensePlate, vin,
      vehicleDef.max_hull_points, vehicleDef.fuel_capacity,
      body.paintPrimary || '#333333', body.paintSecondary || '#666666'
    ),

    // Log transaction
    c.env.DB.prepare(`
      INSERT INTO financial_transactions (
        id, character_id, transaction_type, currency_id, amount,
        is_income, balance_after, source_type, source_name, description, occurred_at
      ) VALUES (?, ?, 'PURCHASE', 'CRED', ?, 0, ?, 'VENDOR', 'Vehicle Dealer', ?, datetime('now'))
    `).bind(
      nanoid(), characterId, vehicleDef.base_price,
      credits - vehicleDef.base_price,
      `Purchased ${vehicleDef.name}`
    ),
  ]);

  // If this is the first vehicle, set it as active
  const existingVehicles = await c.env.DB
    .prepare(`SELECT COUNT(*) as count FROM character_vehicles WHERE character_id = ?`)
    .bind(characterId)
    .first();

  if ((existingVehicles?.count as number) === 1) {
    await c.env.DB
      .prepare(`UPDATE characters SET active_vehicle_id = ? WHERE id = ?`)
      .bind(vehicleId, characterId)
      .run();
  }

  return c.json({
    success: true,
    data: {
      vehicleId,
      vin,
      licensePlate,
      pricePaid: vehicleDef.base_price,
      newBalance: credits - vehicleDef.base_price,
      message: `Successfully purchased ${vehicleDef.name}`,
    },
  }, 201);
});

/**
 * POST /vehicles/:id/select
 * Set a vehicle as the active vehicle.
 */
vehicleRoutes.post('/:id/select', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId');
  const vehicleId = c.req.param('id');

  // Verify ownership
  const vehicle = await c.env.DB
    .prepare(`
      SELECT cv.*, vd.name as definition_name
      FROM character_vehicles cv
      JOIN vehicle_definitions vd ON cv.vehicle_definition_id = vd.id
      WHERE cv.id = ? AND cv.character_id = ?
    `)
    .bind(vehicleId, characterId)
    .first();

  if (!vehicle) {
    return c.json({
      success: false,
      errors: [{ code: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found or not owned' }],
    }, 404);
  }

  // Check if vehicle is damaged
  if (vehicle.is_damaged) {
    return c.json({
      success: false,
      errors: [{ code: 'VEHICLE_DAMAGED', message: 'Cannot select a damaged vehicle. Repair it first.' }],
    }, 422);
  }

  // Check fuel
  if ((vehicle.current_fuel as number) <= 0) {
    return c.json({
      success: false,
      errors: [{ code: 'VEHICLE_NO_FUEL', message: 'Vehicle has no fuel. Refuel it first.' }],
    }, 422);
  }

  // Set as active
  await c.env.DB
    .prepare(`UPDATE characters SET active_vehicle_id = ? WHERE id = ?`)
    .bind(vehicleId, characterId)
    .run();

  return c.json({
    success: true,
    data: {
      activeVehicleId: vehicleId,
      vehicleName: vehicle.custom_name || vehicle.definition_name,
      message: `${vehicle.custom_name || vehicle.definition_name} is now your active vehicle`,
    },
  });
});

/**
 * PATCH /vehicles/:id
 * Customize a vehicle (name, colors).
 */
vehicleRoutes.patch('/:id', requireCharacterMiddleware(), zValidator('json', customizeSchema), async (c) => {
  const characterId = c.get('characterId');
  const vehicleId = c.req.param('id');
  const body = c.req.valid('json');

  // Verify ownership
  const vehicle = await c.env.DB
    .prepare(`SELECT * FROM character_vehicles WHERE id = ? AND character_id = ?`)
    .bind(vehicleId, characterId)
    .first();

  if (!vehicle) {
    return c.json({
      success: false,
      errors: [{ code: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found or not owned' }],
    }, 404);
  }

  // Build update query
  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (body.customName !== undefined) {
    updates.push('custom_name = ?');
    values.push(body.customName || null);
  }
  if (body.paintPrimary !== undefined) {
    updates.push('paint_color_primary = ?');
    values.push(body.paintPrimary);
  }
  if (body.paintSecondary !== undefined) {
    updates.push('paint_color_secondary = ?');
    values.push(body.paintSecondary);
  }

  if (updates.length === 0) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_UPDATES', message: 'No customization options provided' }],
    }, 400);
  }

  values.push(vehicleId);

  await c.env.DB
    .prepare(`UPDATE character_vehicles SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  return c.json({
    success: true,
    data: { message: 'Vehicle customized successfully' },
  });
});

/**
 * POST /vehicles/:id/refuel
 * Refuel a vehicle.
 */
vehicleRoutes.post('/:id/refuel', requireCharacterMiddleware(), zValidator('json', refuelSchema), async (c) => {
  const characterId = c.get('characterId');
  const vehicleId = c.req.param('id');
  const body = c.req.valid('json');

  // Get vehicle with definition
  const vehicle = await c.env.DB
    .prepare(`
      SELECT cv.*, vd.fuel_capacity, vd.fuel_consumption_per_km, vd.name as definition_name
      FROM character_vehicles cv
      JOIN vehicle_definitions vd ON cv.vehicle_definition_id = vd.id
      WHERE cv.id = ? AND cv.character_id = ?
    `)
    .bind(vehicleId, characterId)
    .first();

  if (!vehicle) {
    return c.json({
      success: false,
      errors: [{ code: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found or not owned' }],
    }, 404);
  }

  const currentFuel = vehicle.current_fuel as number;
  const maxFuel = vehicle.fuel_capacity as number;
  const fuelNeeded = body.amount
    ? Math.min(body.amount, maxFuel - currentFuel)
    : maxFuel - currentFuel;

  if (fuelNeeded <= 0) {
    return c.json({
      success: true,
      data: { message: 'Tank is already full', fuelAdded: 0, newFuelLevel: currentFuel },
    });
  }

  // Fuel cost: 2 credits per liter
  const FUEL_COST_PER_LITER = 2;
  const totalCost = Math.ceil(fuelNeeded * FUEL_COST_PER_LITER);

  // Get character credits
  const finances = await c.env.DB
    .prepare(`SELECT primary_currency_balance as credits FROM character_finances WHERE character_id = ?`)
    .bind(characterId)
    .first();

  const credits = (finances?.credits as number) || 0;

  if (credits < totalCost) {
    // Calculate how much fuel they can afford
    const affordableFuel = Math.floor(credits / FUEL_COST_PER_LITER);
    if (affordableFuel <= 0) {
      return c.json({
        success: false,
        errors: [{
          code: 'INSUFFICIENT_CREDITS',
          message: `Need ${totalCost} credits for fuel, have ${credits}`,
        }],
      }, 422);
    }

    return c.json({
      success: false,
      errors: [{
        code: 'INSUFFICIENT_CREDITS',
        message: `Can only afford ${affordableFuel}L of fuel (${affordableFuel * FUEL_COST_PER_LITER} credits)`,
        affordableFuel,
        affordableCost: affordableFuel * FUEL_COST_PER_LITER,
      }],
    }, 422);
  }

  // Refuel
  const newFuelLevel = currentFuel + fuelNeeded;

  await c.env.DB.batch([
    c.env.DB.prepare(`
      UPDATE character_vehicles SET current_fuel = ? WHERE id = ?
    `).bind(newFuelLevel, vehicleId),

    c.env.DB.prepare(`
      UPDATE character_finances SET primary_currency_balance = primary_currency_balance - ? WHERE character_id = ?
    `).bind(totalCost, characterId),

    c.env.DB.prepare(`
      INSERT INTO financial_transactions (
        id, character_id, transaction_type, currency_id, amount,
        is_income, balance_after, source_type, source_name, description, occurred_at
      ) VALUES (?, ?, 'PURCHASE', 'CRED', ?, 0, ?, 'VENDOR', 'Fuel Station', ?, datetime('now'))
    `).bind(
      nanoid(), characterId, totalCost, credits - totalCost,
      `Refueled ${vehicle.custom_name || vehicle.definition_name} (${fuelNeeded.toFixed(1)}L)`
    ),
  ]);

  return c.json({
    success: true,
    data: {
      fuelAdded: fuelNeeded,
      newFuelLevel,
      fuelPercent: Math.round((newFuelLevel / maxFuel) * 100),
      cost: totalCost,
      newBalance: credits - totalCost,
    },
  });
});

/**
 * POST /vehicles/:id/repair
 * Repair a damaged vehicle.
 */
vehicleRoutes.post('/:id/repair', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId');
  const vehicleId = c.req.param('id');

  // Get vehicle with definition
  const vehicle = await c.env.DB
    .prepare(`
      SELECT cv.*, vd.max_hull_points, vd.base_price, vd.name as definition_name
      FROM character_vehicles cv
      JOIN vehicle_definitions vd ON cv.vehicle_definition_id = vd.id
      WHERE cv.id = ? AND cv.character_id = ?
    `)
    .bind(vehicleId, characterId)
    .first();

  if (!vehicle) {
    return c.json({
      success: false,
      errors: [{ code: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found or not owned' }],
    }, 404);
  }

  const currentHull = vehicle.current_hull_points as number;
  const maxHull = vehicle.max_hull_points as number;
  const damageToRepair = maxHull - currentHull;

  if (damageToRepair <= 0) {
    return c.json({
      success: true,
      data: { message: 'Vehicle is not damaged', repairCost: 0 },
    });
  }

  // Repair cost: 5% of vehicle price per 10% hull damage
  const damagePercent = damageToRepair / maxHull;
  const repairCost = Math.ceil((vehicle.base_price as number) * damagePercent * 0.5);

  // Get character credits
  const finances = await c.env.DB
    .prepare(`SELECT primary_currency_balance as credits FROM character_finances WHERE character_id = ?`)
    .bind(characterId)
    .first();

  const credits = (finances?.credits as number) || 0;

  if (credits < repairCost) {
    return c.json({
      success: false,
      errors: [{
        code: 'INSUFFICIENT_CREDITS',
        message: `Repair costs ${repairCost} credits, have ${credits}`,
        repairCost,
        shortfall: repairCost - credits,
      }],
    }, 422);
  }

  // Repair vehicle
  await c.env.DB.batch([
    c.env.DB.prepare(`
      UPDATE character_vehicles SET current_hull_points = ?, is_damaged = 0 WHERE id = ?
    `).bind(maxHull, vehicleId),

    c.env.DB.prepare(`
      UPDATE character_finances SET primary_currency_balance = primary_currency_balance - ? WHERE character_id = ?
    `).bind(repairCost, characterId),

    c.env.DB.prepare(`
      INSERT INTO financial_transactions (
        id, character_id, transaction_type, currency_id, amount,
        is_income, balance_after, source_type, source_name, description, occurred_at
      ) VALUES (?, ?, 'REPAIR', 'CRED', ?, 0, ?, 'VENDOR', 'Mechanic Shop', ?, datetime('now'))
    `).bind(
      nanoid(), characterId, repairCost, credits - repairCost,
      `Repaired ${vehicle.custom_name || vehicle.definition_name} (${Math.round(damagePercent * 100)}% damage)`
    ),
  ]);

  return c.json({
    success: true,
    data: {
      hullRestored: damageToRepair,
      newHullPoints: maxHull,
      repairCost,
      newBalance: credits - repairCost,
      message: 'Vehicle fully repaired',
    },
  });
});

/**
 * POST /vehicles/:id/sell
 * Sell a vehicle.
 */
vehicleRoutes.post('/:id/sell', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId');
  const vehicleId = c.req.param('id');

  // Get vehicle with definition
  const vehicle = await c.env.DB
    .prepare(`
      SELECT cv.*, vd.base_price, vd.name as definition_name
      FROM character_vehicles cv
      JOIN vehicle_definitions vd ON cv.vehicle_definition_id = vd.id
      WHERE cv.id = ? AND cv.character_id = ?
    `)
    .bind(vehicleId, characterId)
    .first();

  if (!vehicle) {
    return c.json({
      success: false,
      errors: [{ code: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found or not owned' }],
    }, 404);
  }

  // Check if it's the active vehicle
  const character = await c.env.DB
    .prepare(`SELECT active_vehicle_id FROM characters WHERE id = ?`)
    .bind(characterId)
    .first();

  if (character?.active_vehicle_id === vehicleId) {
    return c.json({
      success: false,
      errors: [{ code: 'CANNOT_SELL_ACTIVE', message: 'Cannot sell your active vehicle. Select a different vehicle first.' }],
    }, 422);
  }

  // Calculate sell price (50% of base, reduced by damage and mileage)
  const basePrice = vehicle.base_price as number;
  const hullPercent = (vehicle.current_hull_points as number) / (vehicle.max_hull_points as number || 100);
  const mileageDeduction = Math.min((vehicle.odometer_km as number) / 10000 * 0.05, 0.2); // Up to 20% for mileage
  const sellPrice = Math.floor(basePrice * 0.5 * hullPercent * (1 - mileageDeduction));

  // Get current balance for transaction log
  const finances = await c.env.DB
    .prepare(`SELECT primary_currency_balance as credits FROM character_finances WHERE character_id = ?`)
    .bind(characterId)
    .first();

  const credits = (finances?.credits as number) || 0;

  // Sell vehicle
  await c.env.DB.batch([
    c.env.DB.prepare(`DELETE FROM character_vehicles WHERE id = ?`).bind(vehicleId),

    c.env.DB.prepare(`
      UPDATE character_finances SET primary_currency_balance = primary_currency_balance + ? WHERE character_id = ?
    `).bind(sellPrice, characterId),

    c.env.DB.prepare(`
      INSERT INTO financial_transactions (
        id, character_id, transaction_type, currency_id, amount,
        is_income, balance_after, source_type, source_name, description, occurred_at
      ) VALUES (?, ?, 'SALE', 'CRED', ?, 1, ?, 'VENDOR', 'Vehicle Dealer', ?, datetime('now'))
    `).bind(
      nanoid(), characterId, sellPrice, credits + sellPrice,
      `Sold ${vehicle.custom_name || vehicle.definition_name}`
    ),
  ]);

  return c.json({
    success: true,
    data: {
      sellPrice,
      newBalance: credits + sellPrice,
      message: `Sold ${vehicle.custom_name || vehicle.definition_name} for ${sellPrice} credits`,
    },
  });
});
