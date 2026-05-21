/**
 * Procedural Generation API
 *
 * Thin API layer delegating to ProceduralService.
 *
 * TEMPLATES: GET /templates, /templates/:code, POST /templates, /templates/:code/generate
 * LOOT: GET /loot, /loot/:code, /loot/:code/analyze, POST /loot, /loot/:code/roll
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware, type AuthVariables } from '../../middleware/auth';
import { ProceduralService } from '../../services/procedural';

type Bindings = { DB: D1Database; CACHE: KVNamespace; JWT_SECRET: string };

export const proceduralRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// --- Templates ---

proceduralRoutes.get('/templates', async (c) => {
  const service = new ProceduralService({ db: c.env.DB });
  return c.json({ success: true, data: await service.listTemplates(c.req.query('type')) });
});

proceduralRoutes.get('/templates/:code', async (c) => {
  const service = new ProceduralService({ db: c.env.DB });
  const template = await service.getTemplate(c.req.param('code'));
  if (!template) throw new HTTPException(404, { message: 'Template not found' });
  return c.json({ success: true, data: { template } });
});

proceduralRoutes.post('/templates', authMiddleware, async (c) => {
  const body = await c.req.json();
  if (!body.code || !body.name) throw new HTTPException(400, { message: 'code and name are required' });
  const service = new ProceduralService({ db: c.env.DB });
  return c.json({ success: true, data: await service.createTemplate(body) }, 201);
});

proceduralRoutes.post('/templates/:code/generate', async (c) => {
  const service = new ProceduralService({ db: c.env.DB });
  const result = await service.generateFromTemplate(c.req.param('code'), await c.req.json());
  if (!result) throw new HTTPException(404, { message: 'Template not found' });
  return c.json({ success: true, data: result });
});

// --- Loot Tables ---

proceduralRoutes.get('/loot', async (c) => {
  const service = new ProceduralService({ db: c.env.DB });
  return c.json({ success: true, data: await service.listLootTables(c.req.query('source')) });
});

proceduralRoutes.get('/loot/:code', async (c) => {
  const service = new ProceduralService({ db: c.env.DB });
  const table = await service.getLootTable(c.req.param('code'));
  if (!table) throw new HTTPException(404, { message: 'Loot table not found' });
  return c.json({ success: true, data: { table } });
});

proceduralRoutes.post('/loot', authMiddleware, async (c) => {
  const body = await c.req.json();
  if (!body.code || !body.name) throw new HTTPException(400, { message: 'code and name are required' });
  const service = new ProceduralService({ db: c.env.DB });
  return c.json({ success: true, data: await service.createLootTable(body) }, 201);
});

proceduralRoutes.post('/loot/:code/roll', async (c) => {
  const service = new ProceduralService({ db: c.env.DB });
  const result = await service.rollLootTable(c.req.param('code'), await c.req.json());
  if (!result) throw new HTTPException(404, { message: 'Loot table not found' });
  return c.json({ success: true, data: result });
});

proceduralRoutes.get('/loot/:code/analyze', async (c) => {
  const service = new ProceduralService({ db: c.env.DB });
  const result = await service.analyzeLootTable(c.req.param('code'));
  if (!result) throw new HTTPException(404, { message: 'Loot table not found' });
  return c.json({ success: true, data: result });
});

export default proceduralRoutes;
