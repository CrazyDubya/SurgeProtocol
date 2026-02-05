/**
 * Integration tests for Achievements System API.
 *
 * Tests for achievement definitions, progress tracking, and leaderboards.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import app from '../../src/index';
import { createMockEnv, createTestRequest, parseJsonResponse, type MockEnv } from '../helpers/mock-env';

describe('Achievements System Integration', () => {
  let env: MockEnv;

  beforeEach(async () => {
    env = createMockEnv();

    // Seed achievement definitions
    env.DB._seed('achievement_definitions', [
      {
        id: 'ach-first-blood',
        code: 'FIRST_BLOOD',
        name: 'First Blood',
        description: 'Win your first combat encounter',
        flavor_text: 'Everyone remembers their first.',
        category: 'COMBAT',
        achievement_type: 'INSTANT',
        rarity: 'COMMON',
        points: 10,
        icon_asset: 'achievements/first_blood.png',
        unlock_method: 'COMBAT_WIN',
        unlock_conditions: null,
        counter_target: null,
        counter_stat: null,
        is_secret: 0,
        is_progressive: 0,
        tier: 1,
        prerequisite_achievements: null,
        display_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ach-serial-killer',
        code: 'SERIAL_KILLER',
        name: 'Serial Killer',
        description: 'Defeat 100 enemies in combat',
        flavor_text: 'Some people just have a gift.',
        category: 'COMBAT',
        achievement_type: 'COUNTER',
        rarity: 'RARE',
        points: 50,
        icon_asset: 'achievements/serial_killer.png',
        unlock_method: 'COUNTER',
        unlock_conditions: JSON.stringify({ stat: 'enemies_killed', target: 100 }),
        counter_target: 100,
        counter_stat: 'enemies_killed',
        is_secret: 0,
        is_progressive: 1,
        tier: 2,
        prerequisite_achievements: JSON.stringify(['FIRST_BLOOD']),
        display_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ach-chrome-addict',
        code: 'CHROME_ADDICT',
        name: 'Chrome Addict',
        description: 'Install 10 different augmentations',
        flavor_text: 'More machine than human.',
        category: 'EXPLORATION',
        achievement_type: 'COUNTER',
        rarity: 'UNCOMMON',
        points: 25,
        icon_asset: 'achievements/chrome_addict.png',
        unlock_method: 'COUNTER',
        unlock_conditions: JSON.stringify({ stat: 'augments_installed', target: 10 }),
        counter_target: 10,
        counter_stat: 'augments_installed',
        is_secret: 0,
        is_progressive: 1,
        tier: 1,
        prerequisite_achievements: null,
        display_order: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ach-secret-ending',
        code: 'SECRET_ENDING',
        name: '???',
        description: 'Find the hidden ending',
        flavor_text: 'Some paths are not meant to be found.',
        category: 'STORY_PROGRESS',
        achievement_type: 'INSTANT',
        rarity: 'LEGENDARY',
        points: 100,
        icon_asset: 'achievements/secret_ending.png',
        unlock_method: 'EVENT',
        unlock_conditions: JSON.stringify({ event: 'secret_ending_found' }),
        counter_target: null,
        counter_stat: null,
        is_secret: 1,
        is_progressive: 0,
        tier: 3,
        prerequisite_achievements: null,
        display_order: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Seed characters
    env.DB._seed('characters', [
      {
        id: 'char-player-1',
        user_id: 'user-1',
        name: 'V',
        tier: 2,
      },
      {
        id: 'char-player-2',
        user_id: 'user-2',
        name: 'Johnny',
        tier: 3,
      },
    ]);

    // Seed character achievements
    env.DB._seed('character_achievements', [
      {
        id: 'ca-1',
        character_id: 'char-player-1',
        achievement_id: 'ach-first-blood',
        status: 'COMPLETED',
        unlocked_at: new Date(Date.now() - 86400000).toISOString(),
        progress_current: null,
        progress_target: null,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'ca-2',
        character_id: 'char-player-1',
        achievement_id: 'ach-serial-killer',
        status: 'IN_PROGRESS',
        unlocked_at: null,
        progress_current: 42,
        progress_target: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ca-3',
        character_id: 'char-player-2',
        achievement_id: 'ach-first-blood',
        status: 'COMPLETED',
        unlocked_at: new Date(Date.now() - 172800000).toISOString(),
        progress_current: null,
        progress_target: null,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 'ca-4',
        character_id: 'char-player-2',
        achievement_id: 'ach-serial-killer',
        status: 'COMPLETED',
        unlocked_at: new Date(Date.now() - 86400000).toISOString(),
        progress_current: 100,
        progress_target: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);

    // Seed milestone definitions
    env.DB._seed('milestone_definitions', [
      {
        id: 'mile-kills',
        code: 'TOTAL_KILLS',
        name: 'Kill Count',
        description: 'Track total enemies defeated',
        milestone_type: 'LIFETIME_STAT',
        tracked_stat: 'enemies_killed',
        thresholds: JSON.stringify([10, 50, 100, 500, 1000]),
        rewards_per_tier: JSON.stringify([10, 25, 50, 100, 250]),
        icon_asset: 'milestones/kills.png',
        display_order: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'mile-missions',
        code: 'MISSIONS_COMPLETED',
        name: 'Mission Master',
        description: 'Complete missions',
        milestone_type: 'LIFETIME_STAT',
        tracked_stat: 'missions_completed',
        thresholds: JSON.stringify([1, 10, 25, 50, 100]),
        rewards_per_tier: JSON.stringify([5, 15, 30, 75, 150]),
        icon_asset: 'milestones/missions.png',
        display_order: 2,
        created_at: new Date().toISOString(),
      },
    ]);

    // Seed leaderboard entries
    env.DB._seed('leaderboard_entries', [
      {
        id: 'lb-1',
        leaderboard_type: 'ACHIEVEMENT_POINTS',
        character_id: 'char-player-1',
        score: 60,
        rank: 2,
        recorded_at: new Date().toISOString(),
      },
      {
        id: 'lb-2',
        leaderboard_type: 'ACHIEVEMENT_POINTS',
        character_id: 'char-player-2',
        score: 160,
        rank: 1,
        recorded_at: new Date().toISOString(),
      },
      {
        id: 'lb-3',
        leaderboard_type: 'SPEEDRUN_MAIN',
        character_id: 'char-player-2',
        score: 3600000, // 1 hour in ms
        rank: 1,
        recorded_at: new Date().toISOString(),
      },
    ]);
  });

  // ==========================================================================
  // ACHIEVEMENT DEFINITION ENDPOINTS
  // ==========================================================================

  describe('GET /api/achievements', () => {
    it('should list all achievements', async () => {
      const req = createTestRequest('GET', '/api/achievements');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.achievements).toHaveLength(4);
    });

    it('should filter by category', async () => {
      const req = createTestRequest('GET', '/api/achievements?category=COMBAT');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.achievements).toHaveLength(2);
      expect(body.data.achievements[0].category).toBe('COMBAT');
    });

    it('should filter by rarity', async () => {
      const req = createTestRequest('GET', '/api/achievements?rarity=LEGENDARY');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.achievements).toHaveLength(1);
    });

    it('should exclude secret achievements by default', async () => {
      const req = createTestRequest('GET', '/api/achievements?include_secret=false');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.achievements).toHaveLength(3); // All except secret
    });
  });

  describe('GET /api/achievements/categories', () => {
    it('should list categories with counts', async () => {
      const req = createTestRequest('GET', '/api/achievements/categories');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.categories).toBeDefined();
    });
  });

  describe('GET /api/achievements/:id', () => {
    it('should return achievement details', async () => {
      const req = createTestRequest('GET', '/api/achievements/ach-first-blood');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.achievement.id).toBe('ach-first-blood');
      expect(body.data.achievement.name).toBe('First Blood');
    });

    it('should return 404 for non-existent achievement', async () => {
      const req = createTestRequest('GET', '/api/achievements/fake-achievement');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================================================
  // CHARACTER ACHIEVEMENT ENDPOINTS
  // ==========================================================================

  describe('GET /api/achievements/character', () => {
    it('should return character achievement progress', async () => {
      const req = createTestRequest('GET', '/api/achievements/character?characterId=char-player-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.achievements).toBeDefined();
    });

    it('should require characterId', async () => {
      const req = createTestRequest('GET', '/api/achievements/character');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(400);
    });

    it('should filter by status', async () => {
      const req = createTestRequest('GET', '/api/achievements/character?characterId=char-player-1&status=COMPLETED');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.achievements.every((a: { status: string }) => a.status === 'COMPLETED')).toBe(true);
    });
  });

  describe('GET /api/achievements/character/recent', () => {
    it('should return recently unlocked achievements', async () => {
      const req = createTestRequest('GET', '/api/achievements/character/recent?characterId=char-player-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.achievements).toBeDefined();
    });
  });

  describe('POST /api/achievements/:id/progress', () => {
    it('should update counter-based progress', async () => {
      const req = createTestRequest('POST', '/api/achievements/ach-serial-killer/progress', {
        body: {
          characterId: 'char-player-1',
          increment: 10,
        },
      });
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.progress.current).toBe(52); // 42 + 10
    });

    it('should unlock achievement when target reached', async () => {
      const req = createTestRequest('POST', '/api/achievements/ach-serial-killer/progress', {
        body: {
          characterId: 'char-player-1',
          increment: 100, // Will push over 100
        },
      });
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.unlocked).toBe(true);
    });
  });

  describe('POST /api/achievements/:id/unlock', () => {
    it('should directly unlock an achievement', async () => {
      const req = createTestRequest('POST', '/api/achievements/ach-chrome-addict/unlock', {
        body: {
          characterId: 'char-player-1',
        },
      });
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.unlocked).toBe(true);
    });

    it('should return conflict for already unlocked achievement', async () => {
      const req = createTestRequest('POST', '/api/achievements/ach-first-blood/unlock', {
        body: {
          characterId: 'char-player-1',
        },
      });
      const res = await app.fetch(req, env);

      expect(res.status).toBe(409);
    });
  });

  // ==========================================================================
  // MILESTONE ENDPOINTS
  // ==========================================================================

  describe('GET /api/achievements/milestones', () => {
    it('should list milestone definitions', async () => {
      const req = createTestRequest('GET', '/api/achievements/milestones');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.milestones).toHaveLength(2);
    });
  });

  describe('GET /api/achievements/milestones/character', () => {
    it('should return character milestone progress', async () => {
      const req = createTestRequest('GET', '/api/achievements/milestones/character?characterId=char-player-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.milestones).toBeDefined();
    });
  });

  // ==========================================================================
  // LEADERBOARD ENDPOINTS
  // ==========================================================================

  describe('GET /api/achievements/leaderboards', () => {
    it('should list leaderboard types', async () => {
      const req = createTestRequest('GET', '/api/achievements/leaderboards');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.leaderboards).toBeDefined();
    });
  });

  describe('GET /api/achievements/leaderboards/:type', () => {
    it('should return leaderboard entries', async () => {
      const req = createTestRequest('GET', '/api/achievements/leaderboards/ACHIEVEMENT_POINTS');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.entries).toHaveLength(2);
      expect(body.data.entries[0].rank).toBe(1);
    });

    it('should support pagination', async () => {
      const req = createTestRequest('GET', '/api/achievements/leaderboards/ACHIEVEMENT_POINTS?limit=1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.entries).toHaveLength(1);
    });
  });

  // ==========================================================================
  // STATS ENDPOINTS
  // ==========================================================================

  describe('GET /api/achievements/stats', () => {
    it('should return global achievement stats', async () => {
      const req = createTestRequest('GET', '/api/achievements/stats');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.total_achievements).toBeDefined();
    });
  });
});
