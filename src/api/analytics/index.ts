/**
 * Analytics API
 *
 * Thin API layer delegating to AnalyticsService.
 *
 * EVENTS: POST /events, /events/batch, GET /events, /events/aggregate
 * SESSIONS: POST /sessions/start, /sessions/:id/end, PUT /sessions/:id,
 *           GET /sessions/:id, /sessions, /sessions/stats
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware, type AuthVariables } from '../../middleware/auth';
import { AnalyticsService } from '../../services/analytics';

type Bindings = { DB: D1Database; CACHE: KVNamespace; JWT_SECRET: string };

export const analyticsRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// --- Events ---

analyticsRoutes.post('/events', async (c) => {
  const body = await c.req.json();
  if (!body.eventType || !body.eventName) throw new HTTPException(400, { message: 'eventType and eventName are required' });
  const service = new AnalyticsService({ db: c.env.DB });
  const id = await service.logEvent(body);
  return c.json({ success: true, data: { id } }, 201);
});

analyticsRoutes.post('/events/batch', async (c) => {
  const body = await c.req.json();
  if (!Array.isArray(body.events) || body.events.length === 0) throw new HTTPException(400, { message: 'events array is required' });
  if (body.events.length > 100) throw new HTTPException(400, { message: 'Maximum 100 events per batch' });
  const service = new AnalyticsService({ db: c.env.DB });
  const ids = await service.logEventBatch(body.events);
  return c.json({ success: true, data: { inserted: ids.length, ids } }, 201);
});

analyticsRoutes.get('/events', authMiddleware, async (c) => {
  const service = new AnalyticsService({ db: c.env.DB });
  return c.json({ success: true, data: await service.queryEvents({ type: c.req.query('type'), category: c.req.query('category'), playerId: c.req.query('playerId'), sessionId: c.req.query('sessionId'), since: c.req.query('since'), limit: parseInt(c.req.query('limit') || '100'), offset: parseInt(c.req.query('offset') || '0') }) });
});

analyticsRoutes.get('/events/aggregate', authMiddleware, async (c) => {
  const service = new AnalyticsService({ db: c.env.DB });
  try {
    const aggregations = await service.aggregateEvents(c.req.query('groupBy') || 'event_type', c.req.query('since'));
    return c.json({ success: true, data: { groupBy: c.req.query('groupBy') || 'event_type', aggregations } });
  } catch (e: any) {
    throw new HTTPException(400, { message: e.message });
  }
});

// --- Sessions ---

analyticsRoutes.post('/sessions/start', authMiddleware, async (c) => {
  const service = new AnalyticsService({ db: c.env.DB });
  return c.json({ success: true, data: await service.startSession(c.var.userId, await c.req.json()) }, 201);
});

analyticsRoutes.put('/sessions/:id', authMiddleware, async (c) => {
  const service = new AnalyticsService({ db: c.env.DB });
  try {
    await service.updateSession(c.req.param('id'), await c.req.json());
    return c.json({ success: true, data: { message: 'Session updated' } });
  } catch (e: any) {
    throw new HTTPException(404, { message: e.message });
  }
});

analyticsRoutes.post('/sessions/:id/end', authMiddleware, async (c) => {
  const service = new AnalyticsService({ db: c.env.DB });
  try {
    return c.json({ success: true, data: await service.endSession(c.req.param('id'), await c.req.json()) });
  } catch (e: any) {
    throw new HTTPException(404, { message: e.message });
  }
});

analyticsRoutes.get('/sessions/:id', authMiddleware, async (c) => {
  const service = new AnalyticsService({ db: c.env.DB });
  const session = await service.getSession(c.req.param('id'));
  if (!session) throw new HTTPException(404, { message: 'Session not found' });
  return c.json({ success: true, data: { session } });
});

analyticsRoutes.get('/sessions/stats', authMiddleware, async (c) => {
  const service = new AnalyticsService({ db: c.env.DB });
  const stats = await service.getSessionStats(c.var.userId);
  return c.json({ success: true, data: { stats } });
});

analyticsRoutes.get('/sessions', authMiddleware, async (c) => {
  const service = new AnalyticsService({ db: c.env.DB });
  return c.json({ success: true, data: await service.getSessionHistory(c.var.userId, { limit: parseInt(c.req.query('limit') || '20'), offset: parseInt(c.req.query('offset') || '0') }) });
});

export default analyticsRoutes;
