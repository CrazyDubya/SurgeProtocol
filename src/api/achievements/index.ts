/**
 * Surge Protocol - Achievements System Routes
 *
 * Thin API layer delegating to AchievementService.
 *
 * Endpoints:
 * - GET / - List achievements
 * - GET /categories - List categories
 * - GET /:id - Get achievement details
 * - GET /character - Character progress
 * - GET /character/recent - Recent unlocks
 * - POST /:id/progress - Update progress
 * - POST /:id/unlock - Unlock achievement
 * - GET /milestones - List milestones
 * - GET /milestones/character - Character milestones
 * - GET /leaderboards - Leaderboard types
 * - GET /leaderboards/:type - Leaderboard entries
 */

import { Hono } from 'hono';
import type { AuthVariables } from '../../middleware/auth';
import { AchievementService } from '../../services/achievements';

type Bindings = { DB: D1Database; CACHE: KVNamespace; JWT_SECRET: string };

export const achievementRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// --- Achievement Definitions ---

achievementRoutes.get('/', async (c) => {
  const service = new AchievementService({ db: c.env.DB });
  const data = await service.listAchievements({
    category: c.req.query('category'), type: c.req.query('type'),
    rarity: c.req.query('rarity'), seriesId: c.req.query('seriesId'),
    includeHidden: c.req.query('includeHidden') === 'true',
    limit: parseInt(c.req.query('limit') || '50'),
    offset: parseInt(c.req.query('offset') || '0'),
  });
  return c.json({ success: true, data });
});

achievementRoutes.get('/categories', async (c) => {
  const service = new AchievementService({ db: c.env.DB });
  const categories = await service.getCategories();
  return c.json({ success: true, data: { categories, count: categories.length } });
});

achievementRoutes.get('/character', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) return c.json({ success: false, errors: [{ code: 'MISSING_CHARACTER', message: 'characterId query param is required' }] }, 400);
  const service = new AchievementService({ db: c.env.DB });
  return c.json({ success: true, data: await service.getCharacterProgress(characterId, { status: c.req.query('status'), category: c.req.query('category') }) });
});

achievementRoutes.get('/character/recent', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) return c.json({ success: false, errors: [{ code: 'MISSING_CHARACTER', message: 'characterId query param is required' }] }, 400);
  const service = new AchievementService({ db: c.env.DB });
  const recent = await service.getRecentUnlocks(characterId, parseInt(c.req.query('limit') || '10'));
  return c.json({ success: true, data: { characterId, recent, count: recent.length } });
});

achievementRoutes.post('/:id/progress', async (c) => {
  let body: { characterId: string; incrementBy?: number; setTo?: number };
  try { body = await c.req.json(); } catch { return c.json({ success: false, errors: [{ code: 'INVALID_JSON', message: 'Invalid JSON body' }] }, 400); }
  if (!body.characterId) return c.json({ success: false, errors: [{ code: 'MISSING_CHARACTER', message: 'characterId is required' }] }, 400);
  const service = new AchievementService({ db: c.env.DB });
  try {
    const data = await service.updateProgress(c.req.param('id'), body.characterId, { incrementBy: body.incrementBy, setTo: body.setTo });
    return c.json({ success: true, data });
  } catch (e: any) {
    const code = e.message.includes('not found') ? 'NOT_FOUND' : 'NOT_COUNTER';
    const status = e.message.includes('not found') ? 404 : 400;
    return c.json({ success: false, errors: [{ code, message: e.message }] }, status);
  }
});

achievementRoutes.post('/:id/unlock', async (c) => {
  let body: { characterId: string };
  try { body = await c.req.json(); } catch { return c.json({ success: false, errors: [{ code: 'INVALID_JSON', message: 'Invalid JSON body' }] }, 400); }
  if (!body.characterId) return c.json({ success: false, errors: [{ code: 'MISSING_CHARACTER', message: 'characterId is required' }] }, 400);
  const service = new AchievementService({ db: c.env.DB });
  try {
    const data = await service.unlockAchievement(c.req.param('id'), body.characterId);
    return c.json({ success: true, data }, 201);
  } catch (e: any) {
    if (e.message.includes('already')) return c.json({ success: false, errors: [{ code: 'ALREADY_UNLOCKED', message: e.message }] }, 409);
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: e.message }] }, 404);
  }
});

achievementRoutes.get('/:id', async (c) => {
  const service = new AchievementService({ db: c.env.DB });
  const data = await service.getAchievement(c.req.param('id'));
  if (!data) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Achievement not found' }] }, 404);
  return c.json({ success: true, data });
});

// --- Milestones ---

achievementRoutes.get('/milestones', async (c) => {
  const service = new AchievementService({ db: c.env.DB });
  const milestones = await service.listMilestones(c.req.query('category'));
  return c.json({ success: true, data: { milestones, count: milestones.length } });
});

achievementRoutes.get('/milestones/character', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) return c.json({ success: false, errors: [{ code: 'MISSING_CHARACTER', message: 'characterId query param is required' }] }, 400);
  const service = new AchievementService({ db: c.env.DB });
  return c.json({ success: true, data: { characterId, milestones: await service.getCharacterMilestones(characterId) } });
});

// --- Leaderboards ---

achievementRoutes.get('/leaderboards', async (c) => {
  const service = new AchievementService({ db: c.env.DB });
  const leaderboards = service.getLeaderboardTypes();
  return c.json({ success: true, data: { leaderboards, count: leaderboards.length } });
});

achievementRoutes.get('/leaderboards/:type', async (c) => {
  const service = new AchievementService({ db: c.env.DB });
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');
  try {
    const entries = await service.getLeaderboard(c.req.param('type'), limit, offset);
    return c.json({ success: true, data: { type: c.req.param('type'), entries, count: entries.length, pagination: { limit, offset } } });
  } catch (e: any) {
    return c.json({ success: false, errors: [{ code: 'INVALID_TYPE', message: e.message }] }, 400);
  }
});

export default achievementRoutes;
