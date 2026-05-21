/**
 * Surge Protocol - Admin Routes
 *
 * Thin API layer delegating to AdminService.
 *
 * POST /seed, /cache/warm, /query
 * DELETE /cache
 * GET /diagnostics, /stats, /config, /config/:key
 * PUT /config/:key
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { adminMiddleware, requireNonProduction } from '../../middleware/admin';
import { AdminService } from '../../services/admin';

type Bindings = { DB: D1Database; CACHE: KVNamespace; ENVIRONMENT: string; CF_MASTER_TOKEN: string; JWT_SECRET: string };
type Variables = { userId?: string; isAdmin?: boolean };

const seedSchema = z.object({ tables: z.array(z.string()).optional(), clearExisting: z.boolean().optional().default(false) }).optional();
const cacheWarmSchema = z.object({ prefixes: z.array(z.string()).optional(), ttlSeconds: z.number().min(60).max(86400).optional().default(3600) }).optional();
const cacheClearSchema = z.object({ prefixes: z.array(z.string()).optional(), pattern: z.string().optional() }).optional();
const querySchema = z.object({ sql: z.string().min(1).max(5000), params: z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional() });
const configUpdateSchema = z.object({ value: z.union([z.string(), z.number(), z.boolean(), z.record(z.unknown())]), description: z.string().max(500).optional() });

export const adminRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();
adminRoutes.use('*', adminMiddleware());

const svc = (c: any) => new AdminService({ db: c.env.DB, cache: c.env.CACHE, environment: c.env.ENVIRONMENT });

adminRoutes.post('/seed', requireNonProduction(), zValidator('json', seedSchema), async (c) => {
  try {
    let { tables } = c.req.valid('json') || {};
    if (!tables && c.req.query('tables')) {
      tables = c.req.query('tables')!.split(',');
    }
    return c.json({ success: true, data: await svc(c).seed(tables) });
  } catch (error) { return c.json({ success: false, errors: [{ code: 'SEED_ERROR', message: error instanceof Error ? error.message : 'Seeding failed' }] }, 500); }
});

adminRoutes.post('/cache/warm', zValidator('json', cacheWarmSchema), async (c) => {
  try { c.req.valid('json'); return c.json({ success: true, data: await svc(c).warmCache() }); }
  catch (error) { return c.json({ success: false, errors: [{ code: 'CACHE_ERROR', message: error instanceof Error ? error.message : 'Cache warming failed' }] }, 500); }
});

adminRoutes.delete('/cache', requireNonProduction(), zValidator('json', cacheClearSchema), async (c) => {
  try { c.req.valid('json'); return c.json({ success: true, data: await svc(c).clearCache() }); }
  catch (error) { return c.json({ success: false, errors: [{ code: 'CACHE_ERROR', message: error instanceof Error ? error.message : 'Cache clear failed' }] }, 500); }
});

adminRoutes.get('/diagnostics', async (c) => c.json({ success: true, data: await svc(c).getDiagnostics() }));

adminRoutes.get('/stats', async (c) => {
  try { return c.json({ success: true, data: await svc(c).getStats() }); }
  catch (error) { return c.json({ success: false, errors: [{ code: 'STATS_ERROR', message: error instanceof Error ? error.message : 'Failed to get stats' }] }, 500); }
});

adminRoutes.post('/query', requireNonProduction(), zValidator('json', querySchema), async (c) => {
  const { sql, params } = c.req.valid('json');
  try { return c.json({ success: true, data: await svc(c).executeQuery(sql, params) }); }
  catch (error) {
    const msg = error instanceof Error ? error.message : 'Query execution failed';
    const code = msg.includes('Only SELECT') || msg.includes('dangerous') ? 400 : 500;
    return c.json({ success: false, errors: [{ code: code === 400 ? 'INVALID_QUERY' : 'QUERY_ERROR', message: msg }] }, code);
  }
});

adminRoutes.put('/config/:key', zValidator('json', configUpdateSchema), async (c) => {
  const key = c.req.param('key');
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) return c.json({ success: false, errors: [{ code: 'INVALID_KEY', message: 'Config key must start with a letter and contain only alphanumeric characters and underscores' }] }, 400);
  try { const { value, description } = c.req.valid('json'); return c.json({ success: true, data: await svc(c).updateConfig(key, value, description) }); }
  catch (error) { return c.json({ success: false, errors: [{ code: 'CONFIG_ERROR', message: error instanceof Error ? error.message : 'Config update failed' }] }, 500); }
});

adminRoutes.get('/config/:key', async (c) => {
  try {
    const result = await svc(c).getConfig(c.req.param('key'));
    if (!result) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: `Config key '${c.req.param('key')}' not found` }] }, 404);
    return c.json({ success: true, data: result });
  } catch (error) { return c.json({ success: false, errors: [{ code: 'CONFIG_ERROR', message: error instanceof Error ? error.message : 'Config retrieval failed' }] }, 500); }
});

adminRoutes.get('/config', async (c) => {
  try { return c.json({ success: true, data: await svc(c).listConfig() }); }
  catch (error) { return c.json({ success: false, errors: [{ code: 'CONFIG_ERROR', message: error instanceof Error ? error.message : 'Config listing failed' }] }, 500); }
});

export default adminRoutes;
