/**
 * Save Loader and Checkpoint Tests
 *
 * Tests for:
 * - Save validation
 * - Loading save data
 * - Character state restoration
 * - Checkpoint creation
 * - Checkpoint restoration
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { SignJWT } from 'jose';
import { saveRoutes } from '../../src/api/saves';
import { createMockEnv, createTestRequest, parseJsonResponse } from '../helpers/mock-env';

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

describe('Save Loader and Checkpoints', () => {
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

    // Seed required tables
    env.DB._seed('players', [
      {
        id: testUserId,
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date().toISOString(),
      },
    ]);

    env.DB._seed('characters', [
      {
        id: testCharacterId,
        player_id: testUserId,
        legal_name: 'Test Character',
        street_name: 'TestRunner',
        handle: '@test',
        sex: 'MALE',
        age: 25,
        blood_type: 'A_POS',
        corporate_standing: 'NEUTRAL',
        current_tier: 3,
        current_xp: 500,
        lifetime_xp: 2500,
        convergence_path: 'UNDECIDED',
        carrier_rating: 4.5,
        total_deliveries: 50,
        perfect_deliveries: 40,
        failed_deliveries: 2,
        current_health: 100,
        max_health: 100,
        current_stamina: 100,
        max_stamina: 100,
        current_humanity: 80,
        max_humanity: 100,
        consciousness_state: 'NORMAL',
        network_integration_level: 10,
        fork_count: 0,
        current_location_id: 'loc-downtown',
        home_location_id: 'loc-apt',
        total_playtime_seconds: 3600,
        is_active: 1,
        active_vehicle_id: null,
        current_credits: 5000,
        created_at: new Date().toISOString(),
      },
    ]);

    env.DB._seed('character_inventory', [
      {
        id: 'inv-1',
        character_id: testCharacterId,
        item_id: 'item-1',
        quantity: 1,
        is_equipped: 1,
        equipped_slot: 'weapon',
        durability_current: 80,
        durability_max: 100,
        custom_name: null,
        acquired_from: 'shop',
        acquired_at: new Date().toISOString(),
      },
    ]);

    env.DB._seed('character_attributes', [
      {
        id: 'attr-1',
        character_id: testCharacterId,
        attribute_id: 'strength',
        base_value: 5,
        current_value: 5,
        bonus_from_augments: 0,
        bonus_from_items: 0,
        bonus_from_conditions: 0,
        temporary_modifier: 0,
        times_increased: 0,
        xp_invested: 0,
      },
    ]);

    env.DB._seed('character_missions', []);
    env.DB._seed('character_reputation', []);
    env.DB._seed('character_vehicles', []);
    env.DB._seed('locations', [{ id: 'loc-downtown', name: 'Downtown' }]);
    env.DB._seed('tracks', []);
    env.DB._seed('save_games', []);
    env.DB._seed('save_data_chunks', []);
    env.DB._seed('checkpoints', []);
  });

  describe('POST /api/saves/:id/validate', () => {
    it('should validate a valid save', async () => {
      // Create a save first
      const createRequest = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: { saveName: 'Validation Test', saveSlot: 1, saveType: 'MANUAL' },
      });
      const createResponse = await app.fetch(createRequest, env);
      const createData = await parseJsonResponse<{
        data: { save: { id: string } };
      }>(createResponse);
      const saveId = createData.data.save.id;

      // Validate the save
      const request = createTestRequest('POST', `/api/saves/${saveId}/validate`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          saveId: string;
          isValid: boolean;
          errors: string[];
          warnings: string[];
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.isValid).toBe(true);
      expect(data.data.errors).toHaveLength(0);
    });

    it('should return 404 for non-existent save', async () => {
      const request = createTestRequest('POST', '/api/saves/nonexistent/validate', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/saves/:id/load', () => {
    it('should load a valid save and restore character state', async () => {
      // Create a save with modified character data
      const createRequest = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: { saveName: 'Load Test', saveSlot: 1, saveType: 'MANUAL' },
      });
      const createResponse = await app.fetch(createRequest, env);
      const createData = await parseJsonResponse<{
        data: { save: { id: string } };
      }>(createResponse);
      const saveId = createData.data.save.id;

      // Modify character state after save
      env.DB._updateWhere('characters', { id: testCharacterId }, {
        current_health: 50,
        current_xp: 1000,
      });

      // Load the save (should restore original values)
      const request = createTestRequest('POST', `/api/saves/${saveId}/load`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          loaded: boolean;
          saveId: string;
          loadedChunks: string[];
          restoredSections: string[];
          message: string;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.loaded).toBe(true);
      expect(data.data.loadedChunks).toContain('CHARACTER_CORE');
      expect(data.data.restoredSections).toContain('character_core');
    });

    it('should return 404 for non-existent save', async () => {
      const request = createTestRequest('POST', '/api/saves/nonexistent/load', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/saves/:id/checkpoints', () => {
    it('should create a checkpoint', async () => {
      // Create a save first
      const createRequest = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: { saveName: 'Checkpoint Test', saveSlot: 1, saveType: 'MANUAL' },
      });
      const createResponse = await app.fetch(createRequest, env);
      const createData = await parseJsonResponse<{
        data: { save: { id: string } };
      }>(createResponse);
      const saveId = createData.data.save.id;

      // Create a checkpoint
      const request = createTestRequest('POST', `/api/saves/${saveId}/checkpoints`, {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          checkpointType: 'MISSION_START',
          triggerSource: 'mission_accept',
          description: 'Before starting delivery mission',
          isPersistent: false,
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          checkpoint: {
            id: string;
            checkpointType: string;
            triggerSource: string;
            description: string;
          };
          message: string;
        };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.checkpoint.checkpointType).toBe('MISSION_START');
      expect(data.data.checkpoint.triggerSource).toBe('mission_accept');
      expect(data.data.checkpoint.description).toBe('Before starting delivery mission');
    });

    it('should create checkpoint with expiration', async () => {
      // Create a save
      const createRequest = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: { saveName: 'Expiring Checkpoint', saveSlot: 1, saveType: 'MANUAL' },
      });
      const createResponse = await app.fetch(createRequest, env);
      const createData = await parseJsonResponse<{
        data: { save: { id: string } };
      }>(createResponse);
      const saveId = createData.data.save.id;

      // Create checkpoint with 60 minute expiration
      const request = createTestRequest('POST', `/api/saves/${saveId}/checkpoints`, {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          checkpointType: 'AUTO',
          triggerSource: 'auto_checkpoint',
          expiresInMinutes: 60,
        },
      });

      const response = await app.fetch(request, env);
      expect(response.status).toBe(201);

      // Verify checkpoint was created in database
      const checkpoints = env.DB._getTable('checkpoints');
      expect(checkpoints.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/saves/:id/checkpoints', () => {
    it('should list checkpoints for a save', async () => {
      // Create save
      const createRequest = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: { saveName: 'List Checkpoints Test', saveSlot: 1, saveType: 'MANUAL' },
      });
      const createResponse = await app.fetch(createRequest, env);
      const createData = await parseJsonResponse<{
        data: { save: { id: string } };
      }>(createResponse);
      const saveId = createData.data.save.id;

      // Create two checkpoints
      await app.fetch(
        createTestRequest('POST', `/api/saves/${saveId}/checkpoints`, {
          headers: { Authorization: `Bearer ${authToken}` },
          body: { checkpointType: 'MISSION_START', triggerSource: 'mission_1' },
        }),
        env
      );

      await app.fetch(
        createTestRequest('POST', `/api/saves/${saveId}/checkpoints`, {
          headers: { Authorization: `Bearer ${authToken}` },
          body: { checkpointType: 'KEY_MOMENT', triggerSource: 'boss_fight' },
        }),
        env
      );

      // List checkpoints
      const request = createTestRequest('GET', `/api/saves/${saveId}/checkpoints`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          saveId: string;
          checkpoints: Array<{
            id: string;
            checkpointType: string;
            triggerSource: string;
          }>;
          count: number;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.count).toBe(2);
      expect(data.data.checkpoints).toHaveLength(2);
    });

    it('should return empty list when no checkpoints exist', async () => {
      // Create save
      const createRequest = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: { saveName: 'No Checkpoints', saveSlot: 1, saveType: 'MANUAL' },
      });
      const createResponse = await app.fetch(createRequest, env);
      const createData = await parseJsonResponse<{
        data: { save: { id: string } };
      }>(createResponse);
      const saveId = createData.data.save.id;

      // List checkpoints (should be empty)
      const request = createTestRequest('GET', `/api/saves/${saveId}/checkpoints`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: { checkpoints: unknown[]; count: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data.count).toBe(0);
      expect(data.data.checkpoints).toHaveLength(0);
    });
  });

  describe('POST /api/saves/:id/checkpoints/:checkpointId/restore', () => {
    it('should restore from a checkpoint', async () => {
      // Create save
      const createRequest = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: { saveName: 'Restore Test', saveSlot: 1, saveType: 'MANUAL' },
      });
      const createResponse = await app.fetch(createRequest, env);
      const createData = await parseJsonResponse<{
        data: { save: { id: string } };
      }>(createResponse);
      const saveId = createData.data.save.id;

      // Create checkpoint
      const checkpointResponse = await app.fetch(
        createTestRequest('POST', `/api/saves/${saveId}/checkpoints`, {
          headers: { Authorization: `Bearer ${authToken}` },
          body: { checkpointType: 'MANUAL', triggerSource: 'player_request' },
        }),
        env
      );
      const checkpointData = await parseJsonResponse<{
        data: { checkpoint: { id: string } };
      }>(checkpointResponse);
      const checkpointId = checkpointData.data.checkpoint.id;

      // Modify character state
      env.DB._updateWhere('characters', { id: testCharacterId }, {
        current_health: 10,
        current_xp: 9999,
      });

      // Restore from checkpoint
      const request = createTestRequest(
        'POST',
        `/api/saves/${saveId}/checkpoints/${checkpointId}/restore`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const response = await app.fetch(request, env);

      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          restored: boolean;
          checkpointId: string;
          message: string;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.restored).toBe(true);
      expect(data.data.checkpointId).toBe(checkpointId);
    });

    it('should return 404 for non-existent checkpoint', async () => {
      // Create save
      const createRequest = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: { saveName: 'No Checkpoint Test', saveSlot: 1, saveType: 'MANUAL' },
      });
      const createResponse = await app.fetch(createRequest, env);
      const createData = await parseJsonResponse<{
        data: { save: { id: string } };
      }>(createResponse);
      const saveId = createData.data.save.id;

      // Try to restore non-existent checkpoint
      const request = createTestRequest(
        'POST',
        `/api/saves/${saveId}/checkpoints/nonexistent/restore`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const response = await app.fetch(request, env);
      expect(response.status).toBe(422);
    });
  });

  describe('Load/Restore Roundtrip', () => {
    it('should correctly restore character state after load', async () => {
      // Record initial state
      const initialHealth = 100;
      const initialXP = 500;

      // Create save with initial state
      const createRequest = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: { saveName: 'Roundtrip Test', saveSlot: 1, saveType: 'MANUAL' },
      });
      await app.fetch(createRequest, env);

      // Modify character significantly
      env.DB._updateWhere('characters', { id: testCharacterId }, {
        current_health: 25,
        current_xp: 2000,
        current_tier: 5,
      });

      // Create another save with modified state
      const modifiedSaveRequest = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: { saveName: 'Modified Save', saveSlot: 2, saveType: 'MANUAL' },
      });
      const modifiedSaveResponse = await app.fetch(modifiedSaveRequest, env);
      const modifiedSaveData = await parseJsonResponse<{
        data: { save: { id: string } };
      }>(modifiedSaveResponse);
      const modifiedSaveId = modifiedSaveData.data.save.id;

      // Modify again
      env.DB._updateWhere('characters', { id: testCharacterId }, {
        current_health: 10,
        current_xp: 3000,
      });

      // Load the modified save
      const loadRequest = createTestRequest('POST', `/api/saves/${modifiedSaveId}/load`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const loadResponse = await app.fetch(loadRequest, env);
      const loadData = await parseJsonResponse<{
        success: boolean;
        data: { loaded: boolean };
      }>(loadResponse);

      expect(loadData.success).toBe(true);
      expect(loadData.data.loaded).toBe(true);

      // Verify character state was restored to modified save values
      const characters = env.DB._getTable('characters');
      const character = characters.find((c: Record<string, unknown>) => c.id === testCharacterId);

      // Should be restored to what was saved (25 health, 2000 xp, tier 5)
      expect(character?.current_health).toBe(25);
      expect(character?.current_xp).toBe(2000);
      expect(character?.current_tier).toBe(5);
    });
  });
});
