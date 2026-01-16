/**
 * Integration tests for character management.
 *
 * Tests: create → list → get → select → stats
 */

import { describe, it, expect, beforeEach } from 'vitest';
import app from '../../src/index';
import { createMockEnv, createTestRequest, parseJsonResponse, type MockEnv } from '../helpers/mock-env';
import { SignJWT } from 'jose';

// Helper to create a valid JWT for testing
async function createTestToken(userId: string, characterId?: string, secret: string = 'test-jwt-secret-key-for-testing-only'): Promise<string> {
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

describe('Character Management Integration', () => {
  let env: MockEnv;
  let authToken: string;
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    env = createMockEnv();

    // Create auth token
    authToken = await createTestToken(testUserId);

    // Seed players table
    env.DB._seed('players', [{
      id: testUserId,
      email: 'test@example.com',
      username: 'testuser',
      created_at: new Date().toISOString(),
    }]);

    // Seed characters table (empty initially)
    env.DB._seed('characters', []);

    // Seed attribute definitions
    env.DB._seed('attribute_definitions', [
      { id: 'attr-pwr', code: 'PWR', name: 'Power' },
      { id: 'attr-agi', code: 'AGI', name: 'Agility' },
      { id: 'attr-end', code: 'END', name: 'Endurance' },
      { id: 'attr-vel', code: 'VEL', name: 'Velocity' },
      { id: 'attr-int', code: 'INT', name: 'Intelligence' },
      { id: 'attr-wis', code: 'WIS', name: 'Wisdom' },
      { id: 'attr-emp', code: 'EMP', name: 'Empathy' },
      { id: 'attr-prc', code: 'PRC', name: 'Perception' },
    ]);
  });

  describe('GET /api/characters', () => {
    it('should return empty list for new user', async () => {
      const request = createTestRequest('GET', '/api/characters', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { characters: unknown[]; count: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.characters).toHaveLength(0);
      expect(data.data?.count).toBe(0);
    });

    it('should return user characters', async () => {
      // Seed a character
      env.DB._seed('characters', [{
        id: 'char-1',
        player_id: testUserId,
        legal_name: 'Test Character',
        street_name: 'TestRunner',
        handle: 'testrunner',
        current_tier: 1,
        carrier_rating: 3.5,
        is_active: 1,
        created_at: new Date().toISOString(),
      }]);

      const request = createTestRequest('GET', '/api/characters', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { characters: Array<{ id: string }>; count: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.count).toBe(1);
      expect(data.data?.characters[0]?.id).toBe('char-1');
    });

    it('should not return other users characters', async () => {
      // Seed another user's character
      env.DB._seed('characters', [{
        id: 'other-char',
        player_id: 'other-user-id',
        legal_name: 'Other Character',
        created_at: new Date().toISOString(),
      }]);

      const request = createTestRequest('GET', '/api/characters', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { characters: unknown[]; count: number };
      }>(response);

      expect(data.data?.count).toBe(0);
    });
  });

  describe('POST /api/characters', () => {
    it('should create a new character', async () => {
      const request = createTestRequest('POST', '/api/characters', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          legalName: 'John Doe',
          streetName: 'Shadow',
          handle: 'shadow_runner',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { character: { id: string; legal_name: string } };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data?.character).toBeDefined();
    });

    it('should reject short legal name', async () => {
      const request = createTestRequest('POST', '/api/characters', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          legalName: 'X',
        },
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(400);
    });

    it('should reject duplicate handle', async () => {
      // Seed existing character with handle
      env.DB._seed('characters', [{
        id: 'existing-char',
        player_id: 'other-user',
        handle: 'taken_handle',
        legal_name: 'Existing',
        created_at: new Date().toISOString(),
      }]);

      const request = createTestRequest('POST', '/api/characters', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          legalName: 'New Character',
          handle: 'taken_handle',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(409);
      expect(data.errors?.[0]?.code).toBe('HANDLE_TAKEN');
    });

    it('should enforce character limit', async () => {
      // Seed 3 existing characters for this user
      env.DB._seed('characters', [
        { id: 'char-1', player_id: testUserId, legal_name: 'Char 1', created_at: new Date().toISOString() },
        { id: 'char-2', player_id: testUserId, legal_name: 'Char 2', created_at: new Date().toISOString() },
        { id: 'char-3', player_id: testUserId, legal_name: 'Char 3', created_at: new Date().toISOString() },
      ]);

      const request = createTestRequest('POST', '/api/characters', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          legalName: 'Fourth Character',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('CHARACTER_LIMIT');
    });
  });

  describe('GET /api/characters/:id', () => {
    beforeEach(() => {
      env.DB._seed('characters', [{
        id: 'char-1',
        player_id: testUserId,
        legal_name: 'Test Character',
        street_name: 'TestRunner',
        handle: 'testrunner',
        current_tier: 2,
        carrier_rating: 4.2,
        current_health: 25,
        max_health: 30,
        is_active: 1,
        created_at: new Date().toISOString(),
      }]);

      env.DB._seed('character_attributes', []);
      env.DB._seed('rating_components', []);
    });

    it('should return character details', async () => {
      const request = createTestRequest('GET', '/api/characters/char-1', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { character: { id: string } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.character).toBeDefined();
    });

    it('should return 404 for non-existent character', async () => {
      const request = createTestRequest('GET', '/api/characters/nonexistent', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(404);
      expect(data.errors?.[0]?.code).toBe('NOT_FOUND');
    });

    it('should not allow access to other user characters', async () => {
      env.DB._seed('characters', [{
        id: 'other-char',
        player_id: 'other-user',
        legal_name: 'Other Char',
        created_at: new Date().toISOString(),
      }]);

      const request = createTestRequest('GET', '/api/characters/other-char', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/characters/:id/select', () => {
    beforeEach(() => {
      env.DB._seed('characters', [
        {
          id: 'char-1',
          player_id: testUserId,
          legal_name: 'Character 1',
          is_active: 0,
          is_dead: 0,
          created_at: new Date().toISOString(),
        },
        {
          id: 'char-2',
          player_id: testUserId,
          legal_name: 'Character 2',
          is_active: 1,
          is_dead: 0,
          created_at: new Date().toISOString(),
        },
      ]);
    });

    it('should select a character and return new tokens', async () => {
      const request = createTestRequest('POST', '/api/characters/char-1/select', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { characterId: string; accessToken: string };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.characterId).toBe('char-1');
      expect(data.data?.accessToken).toBeDefined();
    });

    it('should not allow selecting a dead character', async () => {
      env.DB._seed('characters', [{
        id: 'dead-char',
        player_id: testUserId,
        legal_name: 'Dead Character',
        is_dead: 1,
        created_at: new Date().toISOString(),
      }]);

      const request = createTestRequest('POST', '/api/characters/dead-char/select', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('CHARACTER_DEAD');
    });
  });

  describe('GET /api/characters/:id/stats', () => {
    beforeEach(() => {
      env.DB._seed('characters', [{
        id: 'char-1',
        player_id: testUserId,
        legal_name: 'Test Character',
        created_at: new Date().toISOString(),
      }]);

      env.DB._seed('character_attributes', [
        { id: 'ca-1', character_id: 'char-1', attribute_id: 'attr-pwr', base_value: 12, current_value: 12 },
        { id: 'ca-2', character_id: 'char-1', attribute_id: 'attr-agi', base_value: 10, current_value: 10 },
      ]);

      env.DB._seed('character_skills', [
        { id: 'cs-1', character_id: 'char-1', skill_id: 'skill-firearms', current_level: 3 },
      ]);

      env.DB._seed('skill_definitions', [
        { id: 'skill-firearms', code: 'firearms', name: 'Firearms' },
      ]);

      env.DB._seed('character_inventory', []);
      env.DB._seed('character_conditions', []);
    });

    it('should return full character stats', async () => {
      const request = createTestRequest('GET', '/api/characters/char-1/stats', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          attributes: unknown[];
          skills: unknown[];
          equipped: unknown[];
          conditions: unknown[];
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.attributes).toBeDefined();
      expect(data.data?.skills).toBeDefined();
    });
  });

  describe('PATCH /api/characters/:id', () => {
    beforeEach(() => {
      env.DB._seed('characters', [{
        id: 'char-1',
        player_id: testUserId,
        legal_name: 'Test Character',
        street_name: 'OldName',
        handle: 'oldhandle',
        created_at: new Date().toISOString(),
      }]);
    });

    it('should update character street name', async () => {
      const request = createTestRequest('PATCH', '/api/characters/char-1', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          streetName: 'NewStreetName',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { character: { street_name: string } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject duplicate handle on update', async () => {
      env.DB._seed('characters', [{
        id: 'other-char',
        player_id: 'other-user',
        handle: 'taken',
        legal_name: 'Other',
        created_at: new Date().toISOString(),
      }]);

      const request = createTestRequest('PATCH', '/api/characters/char-1', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          handle: 'taken',
        },
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(409);
    });
  });
});
