/**
 * World State API
 *
 * Thin API layer delegating to WorldstateService.
 *
 * WEATHER: GET /weather, /weather/:code, POST /weather, /weather/:code/calculate
 * TIME: GET /time, /time/cycles, POST /time, /time/:id/advance, /time/:id/pause, /time/:id/scale
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware, type AuthVariables } from '../../middleware/auth';
import { WorldstateService } from '../../services/worldstate';

type Bindings = { DB: D1Database; CACHE: KVNamespace; JWT_SECRET: string };

export const worldstateRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// --- Weather ---

worldstateRoutes.get('/weather', async (c) => {
  const service = new WorldstateService({ db: c.env.DB });
  return c.json({ success: true, data: await service.listWeather({ type: c.req.query('type'), hazardousOnly: c.req.query('hazardous') === 'true' }) });
});

worldstateRoutes.get('/weather/:code', async (c) => {
  const service = new WorldstateService({ db: c.env.DB });
  const condition = await service.getWeather(c.req.param('code'));
  if (!condition) throw new HTTPException(404, { message: 'Weather condition not found' });
  return c.json({ success: true, data: { condition } });
});

worldstateRoutes.post('/weather', authMiddleware, async (c) => {
  const body = await c.req.json();
  if (!body.code || !body.name) throw new HTTPException(400, { message: 'code and name are required' });
  const service = new WorldstateService({ db: c.env.DB });
  return c.json({ success: true, data: await service.createWeather(body) }, 201);
});

worldstateRoutes.post('/weather/:code/calculate', async (c) => {
  const service = new WorldstateService({ db: c.env.DB });
  const result = await service.calculateWeatherEffects(c.req.param('code'), await c.req.json());
  if (!result) throw new HTTPException(404, { message: 'Weather condition not found' });
  return c.json({ success: true, data: result });
});

// --- Game Time ---

worldstateRoutes.get('/time', async (c) => {
  const service = new WorldstateService({ db: c.env.DB });
  return c.json({ success: true, data: await service.getTime(c.req.query('saveId')) });
});

worldstateRoutes.get('/time/cycles', async (c) => {
  const service = new WorldstateService({ db: c.env.DB });
  return c.json({ success: true, data: service.getTimeCycles() });
});

worldstateRoutes.post('/time', authMiddleware, async (c) => {
  const service = new WorldstateService({ db: c.env.DB });
  const id = await service.createTime(await c.req.json());
  return c.json({ success: true, data: { id } }, 201);
});

worldstateRoutes.post('/time/:id/advance', authMiddleware, async (c) => {
  const service = new WorldstateService({ db: c.env.DB });
  try {
    const body = await c.req.json();
    const result = await service.advanceTime(c.req.param('id'), body.minutes || 1);
    if ('paused' in result) return c.json({ success: false, errors: [{ code: 'TIME_PAUSED', message: 'Game time is paused' }] });
    return c.json({ success: true, data: result });
  } catch (e: any) { throw new HTTPException(404, { message: e.message }); }
});

worldstateRoutes.post('/time/:id/pause', authMiddleware, async (c) => {
  const body = await c.req.json();
  const paused = body.paused !== false;
  const service = new WorldstateService({ db: c.env.DB });
  await service.pauseTime(c.req.param('id'), paused);
  return c.json({ success: true, data: { paused } });
});

worldstateRoutes.post('/time/:id/scale', authMiddleware, async (c) => {
  const body = await c.req.json();
  const service = new WorldstateService({ db: c.env.DB });
  const timeScale = await service.setTimeScale(c.req.param('id'), body.scale || 1.0);
  return c.json({ success: true, data: { timeScale } });
});

export default worldstateRoutes;
