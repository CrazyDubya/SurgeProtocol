/**
 * Integration tests for vehicle management.
 *
 * Tests: catalog → purchase → list owned → select → customize → refuel → repair → sell
 */

import { describe, it, expect, beforeEach } from 'vitest';
import app from '../../src/index';
import { createMockEnv, createTestRequest, parseJsonResponse, type MockEnv } from '../helpers/mock-env';
import { SignJWT } from 'jose';

// Helper to create a valid JWT for testing
async function createTestToken(
  userId: string,
  characterId?: string,
  secret: string = 'test-jwt-secret-key-for-testing-only'
): Promise<string> {
  const key = new TextEncoder().encode(secret);
  const token = await new SignJWT({
    sub: userId,
    characterId,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
  return token;
}

describe('Vehicle Management Integration', () => {
  let env: MockEnv;
  let authToken: string;
  const testUserId = 'test-user-123';
  const testCharacterId = 'test-char-456';

  // Sample vehicle definitions
  const sampleVehicles = [
    {
      id: 'veh_bike_courier',
      code: 'COURIER_BIKE',
      name: 'OmniDeliver Courier Bike',
      manufacturer: 'OmniDeliver',
      model_year: 2087,
      description: 'Standard-issue electric bicycle for new couriers.',
      vehicle_class: 'BIKE',
      vehicle_type: 'ELECTRIC_BICYCLE',
      size_category: 'SMALL',
      rarity: 'COMMON',
      top_speed_kmh: 35,
      acceleration_0_100_seconds: 8.0,
      handling_rating: 70,
      braking_rating: 60,
      offroad_capability: 20,
      max_hull_points: 30,
      armor_rating: 0,
      passenger_capacity: 1,
      cargo_capacity_kg: 15,
      cargo_volume_liters: 25,
      towing_capacity_kg: 0,
      power_source: 'ELECTRIC',
      fuel_capacity: 20.0,
      fuel_consumption_per_km: 0.02,
      range_km: 1000,
      recharge_time_hours: 2.0,
      required_tier: 1,
      required_skill_id: null,
      required_skill_level: 0,
      license_required: null,
      base_price: 500,
      insurance_cost_monthly: 10,
      maintenance_cost_monthly: 5,
      autopilot_level: 0,
      network_connected: 1,
      stealth_capable: 0,
      centaur_compatible: 0,
      neural_interface_required: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'veh_van_small',
      code: 'THORTON_GALENA',
      name: 'Thorton Galena',
      manufacturer: 'Thorton',
      model_year: 2086,
      description: 'Compact cargo van. The workhorse of urban delivery.',
      vehicle_class: 'VAN',
      vehicle_type: 'CARGO_VAN',
      size_category: 'LARGE',
      rarity: 'COMMON',
      top_speed_kmh: 130,
      acceleration_0_100_seconds: 10.0,
      handling_rating: 50,
      braking_rating: 55,
      offroad_capability: 25,
      max_hull_points: 150,
      armor_rating: 4,
      passenger_capacity: 2,
      cargo_capacity_kg: 500,
      cargo_volume_liters: 2000,
      towing_capacity_kg: 1000,
      power_source: 'ELECTRIC',
      fuel_capacity: 100.0,
      fuel_consumption_per_km: 0.12,
      range_km: 830,
      recharge_time_hours: 2.0,
      required_tier: 2,
      required_skill_id: null,
      required_skill_level: 1,
      license_required: null,
      base_price: 25000,
      insurance_cost_monthly: 250,
      maintenance_cost_monthly: 125,
      autopilot_level: 2,
      network_connected: 1,
      stealth_capable: 0,
      centaur_compatible: 0,
      neural_interface_required: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    env = createMockEnv();

    // Create auth token with character ID
    authToken = await createTestToken(testUserId, testCharacterId);

    // Seed players table
    env.DB._seed('players', [
      {
        id: testUserId,
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date().toISOString(),
      },
    ]);

    // Seed characters table
    env.DB._seed('characters', [
      {
        id: testCharacterId,
        player_id: testUserId,
        legal_name: 'Test Character',
        street_name: 'TestRunner',
        handle: 'testrunner',
        current_tier: 2,
        carrier_rating: 3.5,
        is_active: 1,
        active_vehicle_id: null,
        created_at: new Date().toISOString(),
      },
    ]);

    // Seed character finances
    env.DB._seed('character_finances', [
      {
        id: 'fin-1',
        character_id: testCharacterId,
        primary_currency_balance: 50000,
        created_at: new Date().toISOString(),
      },
    ]);

    // Seed vehicle definitions
    env.DB._seed('vehicle_definitions', sampleVehicles);

    // Seed character_vehicles (empty initially)
    env.DB._seed('character_vehicles', []);

    // Seed financial_transactions (empty initially)
    env.DB._seed('financial_transactions', []);
  });

  describe('GET /api/vehicles/catalog', () => {
    it('should return all vehicle definitions', async () => {
      const request = createTestRequest('GET', '/api/vehicles/catalog', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { vehicles: unknown[]; count: number; byClass: Record<string, unknown[]> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.vehicles).toHaveLength(2);
      expect(data.data?.byClass?.BIKE).toHaveLength(1);
      expect(data.data?.byClass?.VAN).toHaveLength(1);
    });

    it('should filter by vehicle class', async () => {
      const request = createTestRequest('GET', '/api/vehicles/catalog?class=BIKE', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { vehicles: unknown[]; count: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.vehicles).toHaveLength(1);
    });

    it('should filter by max tier', async () => {
      const request = createTestRequest('GET', '/api/vehicles/catalog?maxTier=1', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { vehicles: unknown[]; count: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Only the bike requires tier 1
      expect(data.data?.vehicles).toHaveLength(1);
    });
  });

  describe('GET /api/vehicles/catalog/:id', () => {
    it('should return vehicle details by ID', async () => {
      const request = createTestRequest('GET', '/api/vehicles/catalog/veh_bike_courier', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { name: string; base_price: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.name).toBe('OmniDeliver Courier Bike');
      expect(data.data?.base_price).toBe(500);
    });

    it('should return 404 for unknown vehicle', async () => {
      const request = createTestRequest('GET', '/api/vehicles/catalog/unknown_vehicle', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/vehicles/purchase', () => {
    it('should purchase a vehicle successfully', async () => {
      const request = createTestRequest('POST', '/api/vehicles/purchase', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          vehicleDefinitionId: 'veh_bike_courier',
          customName: 'My First Bike',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { vehicleId: string; pricePaid: number; newBalance: number };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data?.vehicleId).toBeDefined();
      expect(data.data?.pricePaid).toBe(500);
      expect(data.data?.newBalance).toBe(49500);
    });

    it('should reject purchase if tier requirement not met', async () => {
      // Re-seed all data to ensure consistency
      env.DB._seed('characters', [
        {
          id: testCharacterId,
          player_id: testUserId,
          legal_name: 'Test Character',
          street_name: 'TestRunner',
          handle: 'testrunner',
          current_tier: 1, // Tier 1, but van requires tier 2
          carrier_rating: 3.5,
          is_active: 1,
          active_vehicle_id: null,
          created_at: new Date().toISOString(),
        },
      ]);

      env.DB._seed('character_finances', [
        {
          id: 'fin-1',
          character_id: testCharacterId,
          primary_currency_balance: 50000,
          created_at: new Date().toISOString(),
        },
      ]);

      // Re-seed vehicle definitions
      env.DB._seed('vehicle_definitions', sampleVehicles);

      const request = createTestRequest('POST', '/api/vehicles/purchase', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          vehicleDefinitionId: 'veh_van_small', // Requires tier 2
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.errors?.[0]?.code).toBe('TIER_REQUIREMENT_NOT_MET');
    });

    it('should reject purchase if insufficient credits', async () => {
      // Set credits to 100
      env.DB._updateWhere('character_finances', { character_id: testCharacterId }, { primary_currency_balance: 100 });

      const request = createTestRequest('POST', '/api/vehicles/purchase', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          vehicleDefinitionId: 'veh_bike_courier', // Costs 500
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.errors?.[0]?.code).toBe('INSUFFICIENT_CREDITS');
    });
  });

  describe('GET /api/vehicles/owned', () => {
    it('should return empty list when no vehicles owned', async () => {
      const request = createTestRequest('GET', '/api/vehicles/owned', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { vehicles: unknown[]; count: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.vehicles).toHaveLength(0);
    });

    it('should return owned vehicles', async () => {
      // Seed an owned vehicle
      env.DB._seed('character_vehicles', [
        {
          id: 'cv-1',
          character_id: testCharacterId,
          vehicle_definition_id: 'veh_bike_courier',
          custom_name: 'Test Bike',
          license_plate: 'ABC-1234',
          vin: 'TEST123456789',
          is_registered: 1,
          current_hull_points: 30,
          current_fuel: 20,
          odometer_km: 100,
          is_damaged: 0,
          paint_color_primary: '#FF0000',
          paint_color_secondary: '#000000',
          ownership_type: 'PURCHASED',
          owned_outright: 1,
          insured: 0,
          corporate_issued: 0,
          corporate_tracked: 0,
          transponder_disabled: 0,
          total_deliveries: 10,
          total_distance_km: 100,
          accidents: 0,
          acquired_at: new Date().toISOString(),
        },
      ]);

      const request = createTestRequest('GET', '/api/vehicles/owned', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { vehicles: Array<{ custom_name: string }>; count: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.vehicles).toHaveLength(1);
      expect(data.data?.vehicles[0]?.custom_name).toBe('Test Bike');
    });
  });

  describe('POST /api/vehicles/:id/select', () => {
    beforeEach(() => {
      // Seed an owned vehicle
      env.DB._seed('character_vehicles', [
        {
          id: 'cv-1',
          character_id: testCharacterId,
          vehicle_definition_id: 'veh_bike_courier',
          custom_name: 'Test Bike',
          license_plate: 'ABC-1234',
          vin: 'TEST123456789',
          is_registered: 1,
          current_hull_points: 30,
          current_fuel: 20,
          odometer_km: 100,
          is_damaged: 0,
          ownership_type: 'PURCHASED',
          owned_outright: 1,
          acquired_at: new Date().toISOString(),
        },
      ]);
    });

    it('should select a vehicle as active', async () => {
      const request = createTestRequest('POST', '/api/vehicles/cv-1/select', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { activeVehicleId: string };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.activeVehicleId).toBe('cv-1');
    });

    it('should reject selecting a damaged vehicle', async () => {
      env.DB._updateWhere('character_vehicles', { id: 'cv-1' }, { is_damaged: 1 });

      const request = createTestRequest('POST', '/api/vehicles/cv-1/select', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(422);
      expect(data.errors?.[0]?.code).toBe('VEHICLE_DAMAGED');
    });

    it('should reject selecting a vehicle with no fuel', async () => {
      env.DB._updateWhere('character_vehicles', { id: 'cv-1' }, { current_fuel: 0 });

      const request = createTestRequest('POST', '/api/vehicles/cv-1/select', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(422);
      expect(data.errors?.[0]?.code).toBe('VEHICLE_NO_FUEL');
    });
  });

  describe('POST /api/vehicles/:id/refuel', () => {
    beforeEach(() => {
      // Seed an owned vehicle with low fuel
      env.DB._seed('character_vehicles', [
        {
          id: 'cv-1',
          character_id: testCharacterId,
          vehicle_definition_id: 'veh_bike_courier',
          custom_name: 'Test Bike',
          current_hull_points: 30,
          current_fuel: 5, // Low fuel
          is_damaged: 0,
          acquired_at: new Date().toISOString(),
        },
      ]);
    });

    it('should refuel to full tank', async () => {
      const request = createTestRequest('POST', '/api/vehicles/cv-1/refuel', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {},
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { fuelAdded: number; newFuelLevel: number; cost: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.fuelAdded).toBe(15); // 20 - 5 = 15
      expect(data.data?.newFuelLevel).toBe(20);
      expect(data.data?.cost).toBe(30); // 15 * 2 credits per liter
    });

    it('should refuel partial amount', async () => {
      const request = createTestRequest('POST', '/api/vehicles/cv-1/refuel', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: { amount: 5 },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { fuelAdded: number; cost: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.fuelAdded).toBe(5);
      expect(data.data?.cost).toBe(10);
    });
  });

  describe('POST /api/vehicles/:id/repair', () => {
    beforeEach(() => {
      // Seed a damaged vehicle
      env.DB._seed('character_vehicles', [
        {
          id: 'cv-1',
          character_id: testCharacterId,
          vehicle_definition_id: 'veh_bike_courier',
          custom_name: 'Damaged Bike',
          current_hull_points: 15, // 50% damage
          current_fuel: 20,
          is_damaged: 1,
          acquired_at: new Date().toISOString(),
        },
      ]);
    });

    it('should repair a damaged vehicle', async () => {
      const request = createTestRequest('POST', '/api/vehicles/cv-1/repair', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { hullRestored: number; repairCost: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.hullRestored).toBe(15);
      // Repair cost = 500 * 0.5 (damage%) * 0.5 = 125
      expect(data.data?.repairCost).toBe(125);
    });
  });

  describe('POST /api/vehicles/:id/sell', () => {
    beforeEach(() => {
      // Seed a vehicle
      env.DB._seed('character_vehicles', [
        {
          id: 'cv-1',
          character_id: testCharacterId,
          vehicle_definition_id: 'veh_bike_courier',
          custom_name: 'Sell Me',
          current_hull_points: 30,
          current_fuel: 20,
          odometer_km: 500,
          is_damaged: 0,
          acquired_at: new Date().toISOString(),
        },
      ]);
    });

    it('should sell a vehicle', async () => {
      const request = createTestRequest('POST', '/api/vehicles/cv-1/sell', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { sellPrice: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Base: 500 * 50% = 250, minus mileage deduction
      expect(data.data?.sellPrice).toBeGreaterThan(0);
      expect(data.data?.sellPrice).toBeLessThanOrEqual(250);
    });

    it('should not sell active vehicle', async () => {
      // Set as active vehicle
      env.DB._updateWhere('characters', { id: testCharacterId }, { active_vehicle_id: 'cv-1' });

      const request = createTestRequest('POST', '/api/vehicles/cv-1/sell', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(422);
      expect(data.errors?.[0]?.code).toBe('CANNOT_SELL_ACTIVE');
    });
  });

  describe('PATCH /api/vehicles/:id', () => {
    beforeEach(() => {
      env.DB._seed('character_vehicles', [
        {
          id: 'cv-1',
          character_id: testCharacterId,
          vehicle_definition_id: 'veh_bike_courier',
          custom_name: 'Original Name',
          paint_color_primary: '#000000',
          current_hull_points: 30,
          current_fuel: 20,
          acquired_at: new Date().toISOString(),
        },
      ]);
    });

    it('should customize vehicle name and colors', async () => {
      const request = createTestRequest('PATCH', '/api/vehicles/cv-1', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          customName: 'New Name',
          paintPrimary: '#FF0000',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
