/**
 * Surge Protocol - Leaderboards System Routes
 *
 * Thin API layer delegating to LeaderboardService.
 *
 * Endpoints:
 * - GET / - List leaderboards
 * - GET /categories, /periods, /rewards, /my-rankings
 * - GET /:id - Leaderboard entries
 * - GET /:id/rank, /:id/nearby, /:id/history
 * - POST /:id/submit - Submit score
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, type AuthVariables } from '../../middleware/auth';
import { LeaderboardService } from '../../services/leaderboards';

type Bindings = { DB: D1Database; CACHE: KVNamespace; JWT_SECRET: string };

const submitScoreSchema = z.object({
  score: z.number().int(),
  characterName: z.string().optional(),
  characterTier: z.number().int().min(1).max(10).optional(),
  characterTrack: z.string().optional(),
});

export const leaderboardRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();
leaderboardRoutes.use('*', authMiddleware());

leaderboardRoutes.get('/', async (c) => {
  const service = new LeaderboardService({ db: c.env.DB });
  return c.json({ success: true, data: await service.listLeaderboards({ type: c.req.query('type'), scope: c.req.query('scope') }) });
});

leaderboardRoutes.get('/categories', async (c) => {
  const service = new LeaderboardService({ db: c.env.DB });
  return c.json({ success: true, data: await service.getCategories() });
});

leaderboardRoutes.get('/periods', async (c) => {
  const service = new LeaderboardService({ db: c.env.DB });
  return c.json({ success: true, data: { current: service.getPeriods(), serverTime: new Date().toISOString() } });
});

leaderboardRoutes.get('/rewards', async (c) => {
  const service = new LeaderboardService({ db: c.env.DB });
  return c.json({ success: true, data: { upcomingRewards: await service.getRewards() } });
});

leaderboardRoutes.get('/my-rankings', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new LeaderboardService({ db: c.env.DB });
  return c.json({ success: true, data: await service.getMyRankings(userId) });
});

leaderboardRoutes.get('/:id', async (c) => {
  const service = new LeaderboardService({ db: c.env.DB });
  const data = await service.getLeaderboardEntries(c.req.param('id'), { period: c.req.query('period'), limit: parseInt(c.req.query('limit') || '100'), offset: parseInt(c.req.query('offset') || '0') });
  if (!data) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Leaderboard not found' }] }, 404);
  return c.json({ success: true, data });
});

leaderboardRoutes.get('/:id/rank', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new LeaderboardService({ db: c.env.DB });
  const data = await service.getPlayerRank(c.req.param('id'), userId, c.req.query('period'));
  if (!data) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Leaderboard not found' }] }, 404);
  return c.json({ success: true, data });
});

leaderboardRoutes.get('/:id/nearby', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new LeaderboardService({ db: c.env.DB });
  const data = await service.getNearbyEntries(c.req.param('id'), userId, { period: c.req.query('period'), range: parseInt(c.req.query('range') || '5') });
  if (!data) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Leaderboard not found' }] }, 404);
  return c.json({ success: true, data });
});

leaderboardRoutes.get('/:id/history', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new LeaderboardService({ db: c.env.DB });
  const data = await service.getHistory(c.req.param('id'), userId, parseInt(c.req.query('limit') || '10'));
  if (!data) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Leaderboard not found' }] }, 404);
  return c.json({ success: true, data });
});

leaderboardRoutes.post('/:id/submit', zValidator('json', submitScoreSchema), async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new LeaderboardService({ db: c.env.DB });
  try {
    return c.json({ success: true, data: await service.submitScore(c.req.param('id'), userId, c.req.valid('json')) });
  } catch (e: any) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: e.message }] }, 404);
  }
});

export default leaderboardRoutes;
