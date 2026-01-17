/**
 * Save System Integration Tests
 *
 * Tests for:
 * - Listing saves
 * - Creating manual saves
 * - Quicksave functionality
 * - Auto-save with rotation
 * - Deleting saves
 * - Renaming saves
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { SignJWT } from 'jose';
import { saveRoutes } from '../../src/api/saves';
import { createMockEnv, createTestRequest, parseJsonResponse } from '../helpers/mock-env';

// Helper to create a valid JWT for testing (must match mock-env JWT_SECRET)
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

describe('Save System Integration', () => {
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

    // Seed players table (required for auth)
    env.DB._seed('players', [
      {
        id: testUserId,
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date().toISOString(),
      },
    ]);

    // Seed test data
    env.DB._seed('characters', [
      {
        id: testCharacterId,
        player_id: testUserId,
        legal_name: 'Test Character',
        street_name: 'TestRunner',
        current_tier: 3,
        track_id: 'track-1',
        current_location_id: 'loc-downtown',
        total_playtime_seconds: 7200,
        is_active: 1,
        created_at: new Date().toISOString(),
      },
    ]);

    env.DB._seed('locations', [
      {
        id: 'loc-downtown',
        name: 'Downtown',
      },
    ]);

    env.DB._seed('tracks', [
      {
        id: 'track-1',
        name: 'Street Runner',
      },
    ]);

    env.DB._seed('character_missions', [
      {
        id: 'cm-1',
        character_id: testCharacterId,
        mission_id: 'mission-1',
        status: 'COMPLETED',
        credits_earned: 500,
      },
      {
        id: 'cm-2',
        character_id: testCharacterId,
        mission_id: 'mission-2',
        status: 'COMPLETED',
        credits_earned: 750,
      },
    ]);

    env.DB._seed('character_vehicles', [
      {
        id: 'cv-1',
        character_id: testCharacterId,
        total_distance_km: 150,
      },
    ]);

    env.DB._seed('save_games', []);
    env.DB._seed('save_data_chunks', []);
    env.DB._seed('checkpoints', []);
  });

  describe('GET /api/saves', () => {
    it('should return empty list when no saves exist', async () => {
      const request = createTestRequest('GET', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          saves: unknown[];
          count: number;
          manualSaves: unknown[];
          autoSaves: unknown[];
          quicksave: unknown | null;
          limits: { maxManualSlots: number };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.saves).toHaveLength(0);
      expect(data.data.count).toBe(0);
      expect(data.data.limits.maxManualSlots).toBe(10);
    });

    it('should return all user saves grouped by type', async () => {
      // Seed some saves
      env.DB._seed('save_games', [
        {
          id: 'save-1',
          player_id: testUserId,
          save_name: 'Manual Save 1',
          save_type: 'MANUAL',
          save_slot: 1,
          character_id: testCharacterId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'save-2',
          player_id: testUserId,
          save_name: 'Auto Save',
          save_type: 'AUTO',
          is_auto_save: 1,
          character_id: testCharacterId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'save-3',
          player_id: testUserId,
          save_name: 'Quicksave',
          save_type: 'QUICK',
          is_quicksave: 1,
          character_id: testCharacterId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const request = createTestRequest('GET', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          saves: unknown[];
          count: number;
          manualSaves: unknown[];
          autoSaves: unknown[];
          quicksave: { id: string } | null;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.saves).toHaveLength(3);
      expect(data.data.manualSaves).toHaveLength(1);
      expect(data.data.autoSaves).toHaveLength(1);
      expect(data.data.quicksave).not.toBeNull();
      expect(data.data.quicksave?.id).toBe('save-3');
    });
  });

  describe('POST /api/saves', () => {
    it('should create a new manual save', async () => {
      const request = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          saveName: 'My Test Save',
          saveSlot: 1,
          saveType: 'MANUAL',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          save: {
            id: string;
            save_name: string;
            save_type: string;
            save_slot: number;
            character_name: string;
            character_tier: number;
          };
          message: string;
        };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.save.save_name).toBe('My Test Save');
      expect(data.data.save.save_type).toBe('MANUAL');
      expect(data.data.save.save_slot).toBe(1);
      expect(data.data.save.character_name).toBe('TestRunner');
      expect(data.data.save.character_tier).toBe(3);
    });

    it('should reject when save slot is occupied', async () => {
      // Seed an existing save in slot 1
      env.DB._seed('save_games', [
        {
          id: 'existing-save',
          player_id: testUserId,
          save_name: 'Existing Save',
          save_type: 'MANUAL',
          save_slot: 1,
          character_id: testCharacterId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const request = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          saveName: 'New Save',
          saveSlot: 1,
          saveType: 'MANUAL',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.errors[0].code).toBe('SLOT_OCCUPIED');
    });

    it('should reject when max manual saves reached', async () => {
      // Seed 10 manual saves
      const manySaves = Array.from({ length: 10 }, (_, i) => ({
        id: `save-${i}`,
        player_id: testUserId,
        save_name: `Save ${i}`,
        save_type: 'MANUAL',
        save_slot: i + 1,
        character_id: testCharacterId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      env.DB._seed('save_games', manySaves);

      const request = createTestRequest('POST', '/api/saves', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          saveName: 'One More Save',
          saveType: 'MANUAL',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.errors[0].code).toBe('MAX_SAVES_REACHED');
    });
  });

  describe('POST /api/saves/quicksave', () => {
    it('should create a quicksave', async () => {
      const request = createTestRequest('POST', '/api/saves/quicksave', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          save: {
            id: string;
            save_name: string;
            save_type: string;
            is_quicksave: number;
          };
        };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.save.save_name).toBe('Quicksave');
      expect(data.data.save.save_type).toBe('QUICK');
      expect(data.data.save.is_quicksave).toBe(1);
    });

    it('should overwrite existing quicksave', async () => {
      // Seed an existing quicksave
      env.DB._seed('save_games', [
        {
          id: 'old-quicksave',
          player_id: testUserId,
          save_name: 'Quicksave',
          save_type: 'QUICK',
          is_quicksave: 1,
          character_id: testCharacterId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const request = createTestRequest('POST', '/api/saves/quicksave', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          save: { id: string };
        };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.save.id).not.toBe('old-quicksave'); // New ID generated
    });
  });

  describe('GET /api/saves/:id', () => {
    it('should return save details', async () => {
      env.DB._seed('save_games', [
        {
          id: 'save-to-get',
          player_id: testUserId,
          save_name: 'My Save',
          save_type: 'MANUAL',
          save_slot: 1,
          character_id: testCharacterId,
          character_name: 'TestRunner',
          character_tier: 3,
          playtime_seconds: 7200,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const request = createTestRequest('GET', '/api/saves/save-to-get', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          save: {
            id: string;
            save_name: string;
            character_tier: number;
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.save.id).toBe('save-to-get');
      expect(data.data.save.save_name).toBe('My Save');
    });

    it('should return 404 for non-existent save', async () => {
      const request = createTestRequest('GET', '/api/saves/nonexistent', {
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

  describe('DELETE /api/saves/:id', () => {
    it('should delete a save', async () => {
      env.DB._seed('save_games', [
        {
          id: 'save-to-delete',
          player_id: testUserId,
          save_name: 'Delete Me',
          save_type: 'MANUAL',
          character_id: testCharacterId,
          is_ironman: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const request = createTestRequest('DELETE', '/api/saves/save-to-delete', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: { deleted: boolean };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.deleted).toBe(true);
    });

    it('should not delete ironman saves', async () => {
      env.DB._seed('save_games', [
        {
          id: 'ironman-save',
          player_id: testUserId,
          save_name: 'Ironman Save',
          save_type: 'IRONMAN',
          character_id: testCharacterId,
          is_ironman: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const request = createTestRequest('DELETE', '/api/saves/ironman-save', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(422);
      expect(data.errors[0].code).toBe('IRONMAN_PROTECTED');
    });
  });

  describe('POST /api/saves/:id/rename', () => {
    it('should rename a save', async () => {
      env.DB._seed('save_games', [
        {
          id: 'save-to-rename',
          player_id: testUserId,
          save_name: 'Old Name',
          save_type: 'MANUAL',
          character_id: testCharacterId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const request = createTestRequest('POST', '/api/saves/save-to-rename/rename', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: { newName: 'New Name' },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          save: { save_name: string };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.save.save_name).toBe('New Name');
    });
  });

  describe('POST /api/saves/auto', () => {
    it('should create an auto-save', async () => {
      const request = createTestRequest('POST', '/api/saves/auto', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          save: {
            save_type: string;
            is_auto_save: number;
          };
        };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.save.save_type).toBe('AUTO');
      expect(data.data.save.is_auto_save).toBe(1);
    });

    it('should rotate old auto-saves when at limit', async () => {
      // Seed 3 auto-saves (at limit)
      const oldAutoSaves = Array.from({ length: 3 }, (_, i) => ({
        id: `auto-${i}`,
        player_id: testUserId,
        save_name: `Auto Save ${i}`,
        save_type: 'AUTO',
        is_auto_save: 1,
        character_id: testCharacterId,
        created_at: new Date(Date.now() - (i + 1) * 1000).toISOString(), // Oldest first
        updated_at: new Date(Date.now() - (i + 1) * 1000).toISOString(),
      }));
      env.DB._seed('save_games', oldAutoSaves);

      const request = createTestRequest('POST', '/api/saves/auto', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data: {
          save: { id: string };
        };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      // New auto-save created with new ID
      expect(data.data.save.id).not.toMatch(/^auto-/);
    });
  });
});
