/**
 * Integration tests for quest system.
 *
 * Tests: list quests → accept → progress → complete
 */

import { describe, it, expect, beforeEach } from 'vitest';
import app from '../../src/index';
import { createMockEnv, createTestRequest, parseJsonResponse, type MockEnv } from '../helpers/mock-env';
import { SignJWT } from 'jose';

// Helper to create a valid JWT with character
async function createTestToken(userId: string, characterId: string, secret: string = 'test-jwt-secret-key-for-testing-only'): Promise<string> {
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

describe('Quest System Integration', () => {
  let env: MockEnv;
  let authToken: string;
  const testUserId = 'test-user-quest';
  const testCharacterId = 'test-char-quest';

  beforeEach(async () => {
    env = createMockEnv();

    // Create auth token with character
    authToken = await createTestToken(testUserId, testCharacterId);

    // Seed player
    env.DB._seed('players', [{
      id: testUserId,
      email: 'quest@example.com',
      username: 'questrunner',
      created_at: new Date().toISOString(),
    }]);

    // Seed character
    env.DB._seed('characters', [{
      id: testCharacterId,
      player_id: testUserId,
      legal_name: 'Quest Tester',
      street_name: 'Seeker',
      current_tier: 2,
      carrier_rating: 3.5,
      current_health: 30,
      max_health: 30,
      current_xp: 500,
      humanity: 80,
      current_location_id: 'downtown',
      is_active: 1,
      created_at: new Date().toISOString(),
    }]);

    // Seed character finances
    env.DB._seed('character_finances', [{
      id: 'fin-quest',
      character_id: testCharacterId,
      credits: 1000,
      created_at: new Date().toISOString(),
    }]);

    // Seed quest definitions
    env.DB._seed('quest_definitions', [
      {
        id: 'quest-1',
        code: 'find_lost_package',
        name: 'Find the Lost Package',
        description: 'A package went missing in the Hollows. Track it down.',
        summary: 'Track down a missing package',
        quest_type: 'FETCH',
        quest_category: 'Side Quest',
        priority: 5,
        difficulty_rating: 3,
        required_tier: 1,
        required_quests: null,
        required_reputation: null,
        objectives: '[]',
        is_linear: 1,
        has_time_limit: 0,
        time_limit_hours: null,
        xp_reward: 200,
        credit_reward: 500,
        item_rewards: null,
        reputation_rewards: null,
        can_fail: 1,
        is_hidden: 0,
        repeatable: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: 'quest-2',
        code: 'chrome_saints_favor',
        name: 'Chrome Saints Favor',
        description: 'Help the Chrome Saints with a problem.',
        summary: 'Assist Chrome Saints gang',
        quest_type: 'FACTION',
        quest_category: 'Faction Quest',
        priority: 7,
        difficulty_rating: 5,
        required_tier: 3,
        required_quests: null,
        required_reputation: JSON.stringify([{ factionId: 'chrome-saints', minRep: 50 }]),
        objectives: '[]',
        is_linear: 1,
        has_time_limit: 1,
        time_limit_hours: 24,
        xp_reward: 500,
        credit_reward: 1500,
        item_rewards: JSON.stringify([{ itemId: 'chrome-blade', quantity: 1 }]),
        reputation_rewards: JSON.stringify([{ factionId: 'chrome-saints', amount: 25 }]),
        can_fail: 1,
        is_hidden: 0,
        repeatable: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: 'quest-3',
        code: 'repeatable_courier',
        name: 'Courier Run',
        description: 'A basic courier task.',
        summary: 'Standard courier job',
        quest_type: 'DELIVERY',
        quest_category: 'Daily',
        priority: 3,
        difficulty_rating: 1,
        required_tier: 1,
        required_quests: null,
        required_reputation: null,
        objectives: '[]',
        is_linear: 1,
        has_time_limit: 0,
        time_limit_hours: null,
        xp_reward: 50,
        credit_reward: 100,
        item_rewards: null,
        reputation_rewards: null,
        can_fail: 0,
        is_hidden: 0,
        repeatable: 1,
        created_at: new Date().toISOString(),
      },
    ]);

    // Seed quest objectives
    env.DB._seed('quest_objectives', [
      {
        id: 'obj-1-1',
        quest_definition_id: 'quest-1',
        sequence_order: 0,
        title: 'Search the Hollows',
        description: 'Look for clues about the missing package',
        objective_type: 'SEARCH',
        is_optional: 0,
        is_hidden: 0,
        target_quantity: 3,
        completion_xp: 50,
        completion_creds: 0,
      },
      {
        id: 'obj-1-2',
        quest_definition_id: 'quest-1',
        sequence_order: 1,
        title: 'Retrieve the Package',
        description: 'Get the package from its location',
        objective_type: 'RETRIEVE',
        is_optional: 0,
        is_hidden: 0,
        target_quantity: 1,
        completion_xp: 100,
        completion_creds: 100,
      },
      {
        id: 'obj-1-3',
        quest_definition_id: 'quest-1',
        sequence_order: 2,
        title: 'Find Hidden Cache',
        description: 'Optional: Discover the hidden stash',
        objective_type: 'DISCOVER',
        is_optional: 1,
        is_hidden: 1,
        target_quantity: 1,
        completion_xp: 75,
        completion_creds: 200,
      },
    ]);

    // Seed character quests (empty initially)
    env.DB._seed('character_quests', []);

    // Seed faction standings
    env.DB._seed('character_faction_standing', []);
  });

  describe('GET /api/quests', () => {
    it('should return available quest definitions', async () => {
      const request = createTestRequest('GET', '/api/quests', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { quests: Array<{ id: string; name: string }>; count: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.quests).toBeDefined();
      expect(data.data?.count).toBeGreaterThan(0);
    });

    it('should group quests by category', async () => {
      const request = createTestRequest('GET', '/api/quests', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { byCategory: Record<string, Array<unknown>> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.byCategory).toBeDefined();
      expect(data.data?.byCategory['Side Quest']).toBeDefined();
    });
  });

  describe('GET /api/quests/:id', () => {
    it('should return quest details with objectives', async () => {
      const request = createTestRequest('GET', '/api/quests/quest-1', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { quest: { id: string; name: string; objectives: Array<{ title: string }> } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.quest.name).toBe('Find the Lost Package');
      expect(data.data?.quest.objectives).toBeDefined();
      expect(data.data?.quest.objectives.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent quest', async () => {
      const request = createTestRequest('GET', '/api/quests/nonexistent', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/quests/:questId/accept', () => {
    it('should accept a quest', async () => {
      const request = createTestRequest('POST', '/api/quests/quest-1/accept', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ tracked: true }),
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { questInstanceId: string; quest: { name: string } };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data?.questInstanceId).toBeDefined();
      expect(data.data?.quest.name).toBe('Find the Lost Package');
    });

    it('should reject accepting quest with insufficient tier', async () => {
      // quest-2 requires tier 3, character is tier 2
      const request = createTestRequest('POST', '/api/quests/quest-2/accept', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ tracked: true }),
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors?.[0]?.code).toBe('TIER_TOO_LOW');
    });

    it('should reject accepting already active quest', async () => {
      // First accept
      const firstRequest = createTestRequest('POST', '/api/quests/quest-1/accept', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ tracked: true }),
      });
      await app.fetch(firstRequest, env);

      // Try to accept again
      const secondRequest = createTestRequest('POST', '/api/quests/quest-1/accept', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ tracked: true }),
      });

      const response = await app.fetch(secondRequest, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('QUEST_ALREADY_ACTIVE');
    });
  });

  describe('GET /api/quests/character', () => {
    it('should return empty list initially', async () => {
      const request = createTestRequest('GET', '/api/quests/character', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { active: Array<unknown>; counts: { total: number } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.counts.total).toBe(0);
    });

    it('should return accepted quests', async () => {
      // Accept a quest first
      const acceptRequest = createTestRequest('POST', '/api/quests/quest-1/accept', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ tracked: true }),
      });
      await app.fetch(acceptRequest, env);

      // Get character quests
      const request = createTestRequest('GET', '/api/quests/character', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { active: Array<{ name: string }>; counts: { active: number } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.counts.active).toBe(1);
      expect(data.data?.active[0]?.name).toBe('Find the Lost Package');
    });
  });

  describe('POST /api/quests/:questId/progress', () => {
    it('should update objective progress', async () => {
      // Accept quest first
      const acceptRequest = createTestRequest('POST', '/api/quests/quest-1/accept', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ tracked: true }),
      });
      await app.fetch(acceptRequest, env);

      // Update progress
      const progressRequest = createTestRequest('POST', '/api/quests/find_lost_package/progress', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          objectiveId: 'obj-1-1',
          progress: 2,
        }),
      });

      const response = await app.fetch(progressRequest, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { objectiveId: string; newProgress: number; targetQuantity: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.newProgress).toBe(2);
      expect(data.data?.targetQuantity).toBe(3);
    });

    it('should mark objective complete when target reached', async () => {
      // Accept quest
      const acceptRequest = createTestRequest('POST', '/api/quests/quest-1/accept', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ tracked: true }),
      });
      await app.fetch(acceptRequest, env);

      // Complete objective
      const progressRequest = createTestRequest('POST', '/api/quests/find_lost_package/progress', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          objectiveId: 'obj-1-1',
          progress: 3,
        }),
      });

      const response = await app.fetch(progressRequest, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { justCompleted: boolean; rewards: { xp: number } | null };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.justCompleted).toBe(true);
      expect(data.data?.rewards?.xp).toBe(50);
    });
  });

  describe('POST /api/quests/:questId/complete', () => {
    it('should reject completion with incomplete objectives', async () => {
      // Accept quest
      const acceptRequest = createTestRequest('POST', '/api/quests/quest-1/accept', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ tracked: true }),
      });
      await app.fetch(acceptRequest, env);

      // Try to complete without finishing objectives
      const completeRequest = createTestRequest('POST', '/api/quests/find_lost_package/complete', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(completeRequest, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('OBJECTIVES_INCOMPLETE');
    });
  });

  describe('POST /api/quests/:questId/abandon', () => {
    it('should abandon an active quest', async () => {
      // Accept quest
      const acceptRequest = createTestRequest('POST', '/api/quests/quest-1/accept', {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ tracked: true }),
      });
      await app.fetch(acceptRequest, env);

      // Abandon quest
      const abandonRequest = createTestRequest('POST', '/api/quests/find_lost_package/abandon', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(abandonRequest, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { status: string };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.status).toBe('ABANDONED');
    });

    it('should return 404 for non-active quest', async () => {
      const abandonRequest = createTestRequest('POST', '/api/quests/quest-1/abandon', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const response = await app.fetch(abandonRequest, env);
      expect(response.status).toBe(404);
    });
  });
});

describe('Mission Action Handlers Integration', () => {
  let env: MockEnv;
  let authToken: string;
  const testUserId = 'test-user-action';
  const testCharacterId = 'test-char-action';
  const testMissionInstanceId = 'mission-instance-1';

  beforeEach(async () => {
    env = createMockEnv();
    authToken = await createTestToken(testUserId, testCharacterId);

    // Seed player
    env.DB._seed('players', [{
      id: testUserId,
      email: 'action@example.com',
      username: 'actionrunner',
      created_at: new Date().toISOString(),
    }]);

    // Seed character
    env.DB._seed('characters', [{
      id: testCharacterId,
      player_id: testUserId,
      legal_name: 'Action Tester',
      street_name: 'Ghost',
      current_tier: 2,
      carrier_rating: 3.5,
      current_health: 30,
      max_health: 30,
      current_energy: 100,
      max_energy: 100,
      current_xp: 500,
      humanity: 80,
      current_location_id: 'downtown',
      is_active: 1,
      created_at: new Date().toISOString(),
    }]);

    // Seed character finances
    env.DB._seed('character_finances', [{
      id: 'fin-action',
      character_id: testCharacterId,
      credits: 1000,
      created_at: new Date().toISOString(),
    }]);

    // Seed mission instance
    env.DB._seed('mission_instances', [{
      id: testMissionInstanceId,
      mission_id: 'mission-1',
      character_id: testCharacterId,
      status: 'IN_PROGRESS',
      started_at: new Date().toISOString(),
      time_limit_minutes: 60,
      current_state: JSON.stringify({}),
    }]);

    // Seed mission definition
    env.DB._seed('mission_definitions', [{
      id: 'mission-1',
      code: 'test_mission',
      name: 'Test Mission',
      tier_minimum: 1,
      base_credits: 500,
      base_xp: 100,
    }]);

    // Seed mission checkpoints
    env.DB._seed('mission_checkpoints', [
      {
        id: 'checkpoint-dialogue',
        mission_instance_id: testMissionInstanceId,
        checkpoint_type: 'DIALOGUE',
        sequence_order: 0,
        is_completed: 0,
        checkpoint_data: JSON.stringify({ npcId: 'npc-1' }),
      },
      {
        id: 'checkpoint-stealth',
        mission_instance_id: testMissionInstanceId,
        checkpoint_type: 'STEALTH',
        sequence_order: 1,
        is_completed: 0,
        checkpoint_data: '{}',
      },
    ]);

    // Seed NPC
    env.DB._seed('npc_definitions', [{
      id: 'npc-1',
      code: 'test_vendor',
      name: 'Test Vendor',
      npc_type: 'VENDOR',
      is_quest_giver: 0,
      faction_id: null,
    }]);

    // Seed item for USE_ITEM tests
    env.DB._seed('item_definitions', [{
      id: 'item-medkit',
      code: 'medkit',
      name: 'Medkit',
      item_type: 'CONSUMABLE',
      subtype: 'HEALING',
      is_consumable: 1,
      use_effects: JSON.stringify([{ type: 'HEAL', amount: 20 }]),
      stack_limit: 5,
    }]);

    // Seed character inventory
    env.DB._seed('character_inventory', [{
      id: 'inv-1',
      character_id: testCharacterId,
      item_id: 'item-medkit',
      quantity: 3,
      created_at: new Date().toISOString(),
    }]);

    // Seed skill definitions
    env.DB._seed('skill_definitions', [{
      id: 'skill-stealth',
      code: 'STEALTH',
      name: 'Stealth',
      max_level: 10,
    }]);

    // Seed attribute definitions
    env.DB._seed('attribute_definitions', [{
      id: 'attr-agi',
      code: 'AGI',
      name: 'Agility',
    }]);

    // Seed character skills
    env.DB._seed('character_skills', [{
      id: 'cs-1',
      character_id: testCharacterId,
      skill_id: 'skill-stealth',
      current_level: 3,
    }]);

    // Seed character attributes
    env.DB._seed('character_attributes', [{
      id: 'ca-1',
      character_id: testCharacterId,
      attribute_id: 'attr-agi',
      effective_value: 14,
    }]);
  });

  describe('DIALOGUE action', () => {
    it('should process dialogue with NPC', async () => {
      const request = createTestRequest('POST', `/api/missions/${testMissionInstanceId}/action`, {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          actionType: 'DIALOGUE',
          targetId: 'npc-1',
          parameters: {},
        }),
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { result: { outcome: string; details: { npc: { name: string } } } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.result.outcome).toContain('DIALOGUE');
      expect(data.data?.result.details.npc.name).toBe('Test Vendor');
    });

    it('should require NPC target', async () => {
      const request = createTestRequest('POST', `/api/missions/${testMissionInstanceId}/action`, {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          actionType: 'DIALOGUE',
          parameters: {},
        }),
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { result: { success: boolean; outcome: string } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.result.success).toBe(false);
      expect(data.data?.result.outcome).toBe('NO_NPC_TARGET');
    });
  });

  describe('USE_ITEM action', () => {
    it('should use consumable item', async () => {
      const request = createTestRequest('POST', `/api/missions/${testMissionInstanceId}/action`, {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          actionType: 'USE_ITEM',
          parameters: { itemId: 'item-medkit' },
        }),
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { result: { outcome: string; details: { effects: Array<{ type: string }> } } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.result.outcome).toBe('ITEM_USED');
      expect(data.data?.result.details.effects.some(e => e.type === 'HEAL')).toBe(true);
    });

    it('should require item ID', async () => {
      const request = createTestRequest('POST', `/api/missions/${testMissionInstanceId}/action`, {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          actionType: 'USE_ITEM',
          parameters: {},
        }),
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { result: { success: boolean; outcome: string } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.result.success).toBe(false);
      expect(data.data?.result.outcome).toBe('NO_ITEM');
    });

    it('should fail for items not in inventory', async () => {
      const request = createTestRequest('POST', `/api/missions/${testMissionInstanceId}/action`, {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          actionType: 'USE_ITEM',
          parameters: { itemId: 'nonexistent-item' },
        }),
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { result: { success: boolean; outcome: string } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.result.success).toBe(false);
      expect(data.data?.result.outcome).toBe('ITEM_NOT_FOUND');
    });
  });

  describe('STEALTH action', () => {
    it('should process stealth check', async () => {
      const request = createTestRequest('POST', `/api/missions/${testMissionInstanceId}/action`, {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          actionType: 'STEALTH',
          parameters: { type: 'SNEAK' },
        }),
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { result: { outcome: string; details: { roll: number[]; stealthType: string } } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.result.outcome).toContain('STEALTH');
      expect(data.data?.result.details.roll).toHaveLength(2);
      expect(data.data?.result.details.stealthType).toBe('SNEAK');
    });

    it('should use character stealth skill', async () => {
      const request = createTestRequest('POST', `/api/missions/${testMissionInstanceId}/action`, {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          actionType: 'STEALTH',
          parameters: { type: 'HIDE' },
        }),
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { result: { details: { stealthSkill: number; agilityModifier: number } } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.result.details.stealthSkill).toBe(3);
      expect(data.data?.result.details.agilityModifier).toBe(2); // (14-10)/2 = 2
    });
  });

  describe('WAIT action', () => {
    it('should process wait action', async () => {
      const request = createTestRequest('POST', `/api/missions/${testMissionInstanceId}/action`, {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          actionType: 'WAIT',
          parameters: { duration: 5, reason: 'REST' },
        }),
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { result: { outcome: string; details: { duration: number; reason: string } } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.result.outcome).toBe('WAIT_COMPLETE');
      expect(data.data?.result.details.duration).toBe(5);
      expect(data.data?.result.details.reason).toBe('REST');
    });

    it('should reject wait longer than remaining time', async () => {
      // Update mission to have very short time limit
      env.DB._update('mission_instances', testMissionInstanceId, {
        time_limit_minutes: 1,
        started_at: new Date(Date.now() - 50000).toISOString(), // Started 50 seconds ago
      });

      const request = createTestRequest('POST', `/api/missions/${testMissionInstanceId}/action`, {
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          actionType: 'WAIT',
          parameters: { duration: 30 }, // 30 minutes, but only ~10 seconds remaining
        }),
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { result: { success: boolean; outcome: string } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.result.success).toBe(false);
      expect(data.data?.result.outcome).toBe('INSUFFICIENT_TIME');
    });
  });
});
