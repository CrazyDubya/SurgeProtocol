/**
 * Save Data Serializer Tests
 *
 * Tests for:
 * - Character data serialization into chunks
 * - Checksum calculation and verification
 * - Chunk storage and loading
 * - Integrity validation
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { SignJWT } from 'jose';
import { saveRoutes } from '../../src/api/saves';
import { createMockEnv, createTestRequest, parseJsonResponse } from '../helpers/mock-env';
import {
  SaveDataSerializer,
  createSaveSerializer,
  calculateChecksum,
  verifyChecksum,
  compressData,
  decompressData,
  type CharacterCoreData,
  type InventoryChunkData,
} from '../../src/game/saves/serializer';

// Helper to create a valid JWT for testing
async function createTestToken(userId: string, characterId: string): Promise<string> {
  const secret = new TextEncoder().encode('test-jwt-secret-key-for-testing-only');
  const token = await new SignJWT({
    sub: userId,
    characterId: characterId,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
  return token;
}

describe('Save Data Serializer', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let authToken: string;
  const testUserId = 'test-user-123';
  const testCharacterId = 'test-char-456';

  beforeAll(async () => {
    app = new Hono();
    app.route('/api/saves', saveRoutes);
    authToken = await createTestToken(testUserId, testCharacterId);
  });

  beforeEach(() => {
    env = createMockEnv();

    // Seed players table
    env.DB._seed('players', [
      {
        id: testUserId,
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date().toISOString(),
      },
    ]);

    // Seed comprehensive character data for serialization
    env.DB._seed('characters', [
      {
        id: testCharacterId,
        player_id: testUserId,
        legal_name: 'John Doe',
        street_name: 'Shadow',
        handle: '@shadow',
        sex: 'MALE',
        age: 28,
        blood_type: 'O_POS',
        omnideliver_id: 'OD-12345',
        corporate_standing: 'GOOD',
        employee_since: '2024-01-15',
        current_tier: 5,
        current_xp: 1500,
        lifetime_xp: 12500,
        convergence_path: 'HYBRID',
        carrier_rating: 4.8,
        total_deliveries: 150,
        perfect_deliveries: 120,
        failed_deliveries: 5,
        current_health: 85,
        max_health: 100,
        current_stamina: 70,
        max_stamina: 100,
        current_humanity: 65,
        max_humanity: 100,
        consciousness_state: 'NORMAL',
        network_integration_level: 30,
        fork_count: 0,
        current_location_id: 'loc-downtown',
        home_location_id: 'loc-apartment',
        total_playtime_seconds: 72000,
        is_active: 1,
        active_vehicle_id: 'cv-1',
        current_credits: 15000,
        created_at: new Date().toISOString(),
      },
    ]);

    // Seed inventory items
    env.DB._seed('character_inventory', [
      {
        id: 'inv-1',
        character_id: testCharacterId,
        item_id: 'item-pistol',
        quantity: 1,
        is_equipped: 1,
        equipped_slot: 'weapon_primary',
        durability_current: 80,
        durability_max: 100,
        custom_name: 'Lucky Shot',
        acquired_from: 'shop',
        acquired_at: new Date().toISOString(),
      },
      {
        id: 'inv-2',
        character_id: testCharacterId,
        item_id: 'item-medkit',
        quantity: 3,
        is_equipped: 0,
        equipped_slot: null,
        durability_current: null,
        durability_max: null,
        custom_name: null,
        acquired_from: 'mission-reward',
        acquired_at: new Date().toISOString(),
      },
    ]);

    // Seed missions
    env.DB._seed('character_missions', [
      {
        id: 'cm-1',
        character_id: testCharacterId,
        mission_id: 'mission-1',
        status: 'IN_PROGRESS',
        accepted_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        deadline: null,
        current_objective_index: 2,
        objectives_completed: JSON.stringify(['obj-1', 'obj-2']),
        complications_triggered: JSON.stringify([]),
      },
      {
        id: 'cm-2',
        character_id: testCharacterId,
        mission_id: 'mission-2',
        status: 'COMPLETED',
        accepted_at: new Date().toISOString(),
        started_at: null,
        deadline: null,
        current_objective_index: 0,
        objectives_completed: null,
        complications_triggered: null,
        credits_earned: 500,
      },
    ]);

    // Seed reputation
    env.DB._seed('character_reputation', [
      {
        id: 'rep-1',
        character_id: testCharacterId,
        faction_id: 'faction-corpo',
        reputation_value: 750,
        reputation_tier: 'FRIENDLY',
        is_member: 0,
        rank_in_faction: null,
        missions_completed_for: 12,
        lifetime_reputation_gained: 800,
        lifetime_reputation_lost: 50,
        last_interaction: new Date().toISOString(),
      },
    ]);

    // Seed attributes
    env.DB._seed('character_attributes', [
      {
        id: 'attr-1',
        character_id: testCharacterId,
        attribute_id: 'strength',
        base_value: 6,
        current_value: 7,
        bonus_from_augments: 1,
        bonus_from_items: 0,
        bonus_from_conditions: 0,
        temporary_modifier: 0,
        times_increased: 2,
        xp_invested: 500,
      },
      {
        id: 'attr-2',
        character_id: testCharacterId,
        attribute_id: 'reflex',
        base_value: 8,
        current_value: 9,
        bonus_from_augments: 0,
        bonus_from_items: 1,
        bonus_from_conditions: 0,
        temporary_modifier: 0,
        times_increased: 4,
        xp_invested: 1000,
      },
    ]);

    // Seed vehicles
    env.DB._seed('character_vehicles', [
      {
        id: 'cv-1',
        character_id: testCharacterId,
        vehicle_definition_id: 'veh-bike-1',
        custom_name: 'Lightning',
        license_plate: 'NC-2077',
        is_registered: 1,
        current_location_id: 'loc-garage',
        current_hull_points: 90,
        current_fuel: 75,
        odometer_km: 2500,
        is_damaged: 0,
        paint_color_primary: '#FF0000',
        paint_color_secondary: '#000000',
        installed_mods: JSON.stringify(['turbo', 'armor']),
        ownership_type: 'owned',
        owned_outright: 1,
        corporate_issued: 0,
        total_deliveries: 50,
        total_distance_km: 2500,
        accidents: 2,
      },
    ]);

    // Seed locations
    env.DB._seed('locations', [
      { id: 'loc-downtown', name: 'Downtown' },
    ]);

    env.DB._seed('tracks', [
      { id: 'track-1', name: 'Street Runner' },
    ]);

    // Seed empty tables
    env.DB._seed('save_games', []);
    env.DB._seed('save_data_chunks', []);
  });

  describe('Checksum Functions', () => {
    it('should calculate consistent checksums', () => {
      const data = 'test data for checksum';
      const checksum1 = calculateChecksum(data);
      const checksum2 = calculateChecksum(data);

      expect(checksum1).toBe(checksum2);
      expect(checksum1).toHaveLength(8);
    });

    it('should produce different checksums for different data', () => {
      const checksum1 = calculateChecksum('data one');
      const checksum2 = calculateChecksum('data two');

      expect(checksum1).not.toBe(checksum2);
    });

    it('should verify valid checksums', () => {
      const data = 'some test data';
      const checksum = calculateChecksum(data);

      expect(verifyChecksum(data, checksum)).toBe(true);
    });

    it('should reject invalid checksums', () => {
      const data = 'some test data';
      const wrongChecksum = 'deadbeef';

      expect(verifyChecksum(data, wrongChecksum)).toBe(false);
    });
  });

  describe('Compression Functions', () => {
    it('should compress and decompress data', () => {
      const original = 'This is some test data to compress';
      const { compressed, originalSize, compressedSize } = compressData(original);

      expect(originalSize).toBe(original.length);
      expect(compressedSize).toBeGreaterThan(0);

      const decompressed = decompressData(compressed);
      expect(decompressed).toBe(original);
    });
  });

  describe('Creating Saves with Chunks', () => {
    it('should create chunks when creating a manual save', async () => {
      const request = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          saveName: 'Test Save with Chunks',
          saveSlot: 1,
          saveType: 'MANUAL',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          save: { id: string };
          chunksCreated: boolean;
        };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.chunksCreated).toBe(true);

      // Verify chunks were created
      const chunks = env.DB._getTable('save_data_chunks');
      expect(chunks.length).toBeGreaterThan(0);

      // Verify chunk types
      const chunkTypes = chunks.map((c: Record<string, unknown>) => c.chunk_type);
      expect(chunkTypes).toContain('CHARACTER_CORE');
      expect(chunkTypes).toContain('INVENTORY');
      expect(chunkTypes).toContain('MISSIONS');
      expect(chunkTypes).toContain('REPUTATION');
    });

    it('should create chunks when creating a quicksave', async () => {
      const request = createTestRequest('POST', '/api/saves/quicksave', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          save: { id: string };
          chunksCreated: boolean;
        };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.chunksCreated).toBe(true);

      // Verify chunks exist
      const chunks = env.DB._getTable('save_data_chunks');
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should create chunks when creating an auto-save', async () => {
      const request = createTestRequest('POST', '/api/saves/auto', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          save: { id: string };
          chunksCreated: boolean;
        };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.chunksCreated).toBe(true);
    });
  });

  describe('GET /api/saves/:id/chunks', () => {
    it('should return chunk metadata for a save', async () => {
      // First create a save with chunks
      const createRequest = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          saveName: 'Test for Chunks',
          saveSlot: 1,
          saveType: 'MANUAL',
        },
      });

      const createResponse = await app.fetch(createRequest, env);
      const createData = await parseJsonResponse<{
        success: boolean;
        data: { save: { id: string } };
      }>(createResponse);

      const saveId = createData.data.save.id;

      // Now get the chunks
      const chunksRequest = createTestRequest('GET', `/api/saves/${saveId}/chunks`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const chunksResponse = await app.fetch(chunksRequest, env);
      const chunksData = await parseJsonResponse<{
        success: boolean;
        data: {
          saveId: string;
          chunks: Array<{
            id: string;
            chunk_type: string;
            is_valid: boolean;
            load_priority: number;
          }>;
          totalChunks: number;
          allValid: boolean;
        };
      }>(chunksResponse);

      expect(chunksResponse.status).toBe(200);
      expect(chunksData.success).toBe(true);
      expect(chunksData.data.saveId).toBe(saveId);
      expect(chunksData.data.totalChunks).toBeGreaterThan(0);
      expect(chunksData.data.allValid).toBe(true);

      // Verify chunk structure
      for (const chunk of chunksData.data.chunks) {
        expect(chunk).toHaveProperty('id');
        expect(chunk).toHaveProperty('chunk_type');
        expect(chunk).toHaveProperty('is_valid');
        expect(chunk).toHaveProperty('load_priority');
      }
    });

    it('should return 404 for non-existent save', async () => {
      const request = createTestRequest('GET', '/api/saves/nonexistent/chunks', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(404);
      expect(data.errors[0].code).toBe('NOT_FOUND');
    });
  });

  describe('Chunk Data Integrity', () => {
    it('should store valid checksums for each chunk', async () => {
      // Create a save
      const request = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          saveName: 'Integrity Test',
          saveSlot: 1,
          saveType: 'MANUAL',
        },
      });

      await app.fetch(request, env);

      // Check chunks have checksums
      const chunks = env.DB._getTable('save_data_chunks');
      for (const chunk of chunks) {
        expect(chunk.checksum).toBeTruthy();
        expect(typeof chunk.checksum).toBe('string');
        expect((chunk.checksum as string).length).toBe(8);

        // Verify checksum is valid for the data
        expect(verifyChecksum(chunk.data as string, chunk.checksum as string)).toBe(true);
      }
    });

    it('should mark all chunks as valid initially', async () => {
      const request = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          saveName: 'Valid Chunks Test',
          saveSlot: 1,
          saveType: 'MANUAL',
        },
      });

      await app.fetch(request, env);

      const chunks = env.DB._getTable('save_data_chunks');
      for (const chunk of chunks) {
        expect(chunk.is_valid).toBe(1);
      }
    });
  });

  describe('Chunk Serialization Content', () => {
    it('should serialize character core data correctly', async () => {
      const request = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          saveName: 'Core Data Test',
          saveSlot: 1,
          saveType: 'MANUAL',
        },
      });

      await app.fetch(request, env);

      const chunks = env.DB._getTable('save_data_chunks');
      const coreChunk = chunks.find((c: Record<string, unknown>) => c.chunk_type === 'CHARACTER_CORE');

      expect(coreChunk).toBeTruthy();

      // Parse and verify the data
      const coreData: CharacterCoreData = JSON.parse(coreChunk.data as string);
      expect(coreData.id).toBe(testCharacterId);
      expect(coreData.legal_name).toBe('John Doe');
      expect(coreData.street_name).toBe('Shadow');
      expect(coreData.current_tier).toBe(5);
      expect(coreData.current_health).toBe(85);
      expect(coreData.carrier_rating).toBe(4.8);
    });

    it('should serialize inventory data correctly', async () => {
      const request = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          saveName: 'Inventory Test',
          saveSlot: 1,
          saveType: 'MANUAL',
        },
      });

      await app.fetch(request, env);

      const chunks = env.DB._getTable('save_data_chunks');
      const invChunk = chunks.find((c: Record<string, unknown>) => c.chunk_type === 'INVENTORY');

      expect(invChunk).toBeTruthy();

      const invData: InventoryChunkData = JSON.parse(invChunk.data as string);
      expect(invData.items).toHaveLength(2);
      expect(invData.equippedItems).toContain('inv-1');
      expect(invData.credits).toBe(15000);

      // Verify specific item
      const pistol = invData.items.find(i => i.item_id === 'item-pistol');
      expect(pistol).toBeTruthy();
      expect(pistol?.custom_name).toBe('Lucky Shot');
      expect(pistol?.is_equipped).toBe(1);
    });
  });
});
