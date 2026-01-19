/**
 * Surge Protocol - Main Worker Entry Point
 *
 * Cloudflare Worker handling API requests for the cyberpunk delivery RPG.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { tokenRoutes } from './api/tokens';
import { authRoutes } from './api/auth';
import { characterRoutes } from './api/character';
import { missionRoutes } from './api/mission';
import { factionRoutes } from './api/faction';
import { skillRoutes } from './api/skills';
import { worldRoutes } from './api/world';
import { itemRoutes } from './api/items';
import { augmentationRoutes } from './api/augmentations';
import { adminRoutes } from './api/admin';
import { economyRoutes } from './api/economy';
import { questRoutes } from './api/quests';
import { vehicleRoutes } from './api/vehicles';
import { saveRoutes } from './api/saves';
import { combatRoutes } from './api/combat';
import { npcRoutes } from './api/npc';
import { dialogueRoutes } from './api/dialogue';
import { achievementRoutes } from './api/achievements';
import { blackmarketRoutes } from './api/blackmarket';
import { storyRoutes } from './api/story';
import { abilityRoutes } from './api/abilities';
import { progressionRoutes } from './api/progression';
import { droneRoutes } from './api/drones';
import { dynamicRateLimit, expensiveRateLimit } from './middleware/rateLimit';
import { loggingMiddleware, Logger, RequestTimer } from './utils/logger';

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

// Context variables set by middleware
type Variables = {
  requestId: string;
  logger: Logger;
  timer: RequestTimer;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Global middleware
app.use('*', cors());
app.use('*', loggingMiddleware());

// Rate limiting for API routes
app.use('/api/*', dynamicRateLimit());

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development',
  });
});

// Internal routes (should be protected in production)
app.route('/internal/tokens', tokenRoutes);
app.route('/internal/admin', adminRoutes);

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/characters', characterRoutes);
app.route('/api/missions', missionRoutes);
app.route('/api/factions', factionRoutes);
app.route('/api/skills', skillRoutes);
app.route('/api/world', worldRoutes);
app.route('/api/items', itemRoutes);
app.route('/api/augmentations', augmentationRoutes);
app.route('/api/quests', questRoutes);
app.route('/api/vehicles', vehicleRoutes);
app.route('/api/saves', saveRoutes);
app.route('/api/combat', combatRoutes);
app.route('/api/npcs', npcRoutes);
app.route('/api/dialogue', dialogueRoutes);
app.route('/api/achievements', achievementRoutes);

// Black market routes with stricter rate limiting for transactions
app.use('/api/blackmarket/buy', expensiveRateLimit());
app.use('/api/blackmarket/sell', expensiveRateLimit());
app.use('/api/blackmarket/service', expensiveRateLimit());
app.route('/api/blackmarket', blackmarketRoutes);

// Story and narrative routes
app.route('/api/story', storyRoutes);

// Abilities and skills routes
app.route('/api/abilities', abilityRoutes);

// Character progression routes (tracks, specializations, tiers, XP)
app.route('/api/progression', progressionRoutes);

// Drone system routes
app.route('/api/drones', droneRoutes);

// Economy routes with stricter rate limiting for transactions
app.use('/api/economy/vendors/*/buy', expensiveRateLimit());
app.use('/api/economy/vendors/*/sell', expensiveRateLimit());
app.use('/api/economy/vendors/*/haggle', expensiveRateLimit());
app.use('/api/economy/transfer', expensiveRateLimit());
app.route('/api/economy', economyRoutes);

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
  const requestId = c.get('requestId');

  return c.json(
    {
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Route not found' }],
      ...(requestId && { requestId }),
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  const logger = c.get('logger');
  const requestId = c.get('requestId');

  // Handle HTTPException (auth failures, validation errors, etc.) with correct status
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        errors: [{ code: 'HTTP_ERROR', message: err.message }],
        ...(requestId && { requestId }),
      },
      err.status
    );
  }

  // Log unexpected errors
  if (logger) {
    logger.error('Unhandled error', err instanceof Error ? err : new Error(String(err)));
  } else {
    console.error('Unhandled error:', err);
  }

  return c.json(
    {
      success: false,
      errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }],
      ...(requestId && { requestId }),
    },
    500
  );
});

export default app;

// Durable Object exports
export { CombatSession } from './realtime/combat';
export { WorldClock } from './realtime/world';
export { WarTheater } from './realtime/war';
