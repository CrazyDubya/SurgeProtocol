/**
 * Surge Protocol - Main Worker Entry Point
 *
 * Cloudflare Worker handling API requests for the cyberpunk delivery RPG.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { tokenRoutes } from './api/tokens';
import { authRoutes } from './api/auth';
import { characterRoutes } from './api/character';
import { missionRoutes } from './api/mission';
import { factionRoutes } from './api/faction';

// Environment bindings
type Bindings = {
  // Cloudflare resources
  DB: D1Database;
  CACHE: KVNamespace;
  ASSETS: R2Bucket;

  // Durable Objects
  COMBAT_SESSION: DurableObjectNamespace;
  WAR_THEATER: DurableObjectNamespace;
  WORLD_CLOCK: DurableObjectNamespace;

  // Secrets
  JWT_SECRET: string;
  CF_MASTER_TOKEN: string;
  CF_ACCOUNT_ID: string;

  // Config
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development',
  });
});

// Internal token management routes
// TODO: Add authentication middleware for these routes
app.route('/internal/tokens', tokenRoutes);

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/characters', characterRoutes);
app.route('/api/missions', missionRoutes);
app.route('/api/factions', factionRoutes);
// app.route('/api/economy', economyRoutes); // TODO: Implement

// WebSocket upgrade endpoints for Durable Objects
app.get('/ws/combat/:combatId', async (c) => {
  const id = c.env.COMBAT_SESSION.idFromName(c.req.param('combatId'));
  const stub = c.env.COMBAT_SESSION.get(id);
  return stub.fetch(c.req.raw);
});

app.get('/ws/war/:warId', async (c) => {
  const id = c.env.WAR_THEATER.idFromName(c.req.param('warId'));
  const stub = c.env.WAR_THEATER.get(id);
  return stub.fetch(c.req.raw);
});

app.get('/ws/world', async (c) => {
  const id = c.env.WORLD_CLOCK.idFromName('global');
  const stub = c.env.WORLD_CLOCK.get(id);
  return stub.fetch(c.req.raw);
});

// REST endpoints for Durable Objects
app.all('/api/combat/:combatId/*', async (c) => {
  const id = c.env.COMBAT_SESSION.idFromName(c.req.param('combatId'));
  const stub = c.env.COMBAT_SESSION.get(id);
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace(`/api/combat/${c.req.param('combatId')}`, '');
  return stub.fetch(new Request(url.toString(), c.req.raw));
});

app.all('/api/world/*', async (c) => {
  const id = c.env.WORLD_CLOCK.idFromName('global');
  const stub = c.env.WORLD_CLOCK.get(id);
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace('/api/world', '');
  return stub.fetch(new Request(url.toString(), c.req.raw));
});

app.all('/api/wars/:warId/*', async (c) => {
  const id = c.env.WAR_THEATER.idFromName(c.req.param('warId'));
  const stub = c.env.WAR_THEATER.get(id);
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace(`/api/wars/${c.req.param('warId')}`, '');
  return stub.fetch(new Request(url.toString(), c.req.raw));
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Route not found' }],
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      success: false,
      errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }],
    },
    500
  );
});

export default app;

// Durable Object exports
export { CombatSession } from './realtime/combat';
export { WorldClock } from './realtime/world';
export { WarTheater } from './realtime/war';
