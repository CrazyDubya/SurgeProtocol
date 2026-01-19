/**
 * Surge Protocol - Admin Routes
 *
 * Internal administration endpoints for:
 * - Database seeding
 * - Cache management
 * - System diagnostics
 *
 * All routes require admin authentication.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { seedAll } from '../../db/seed';
import { GameCache } from '../../cache';
import { adminMiddleware, requireNonProduction } from '../../middleware/admin';

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
  CF_MASTER_TOKEN: string;
  JWT_SECRET: string;
};

type Variables = {
  userId?: string;
  isAdmin?: boolean;
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const seedSchema = z.object({
  tables: z.array(z.string()).optional(),
  clearExisting: z.boolean().optional().default(false),
}).optional();

const cacheWarmSchema = z.object({
  prefixes: z.array(z.string()).optional(),
  ttlSeconds: z.number().min(60).max(86400).optional().default(3600),
}).optional();

const cacheClearSchema = z.object({
  prefixes: z.array(z.string()).optional(),
  pattern: z.string().optional(),
}).optional();

const querySchema = z.object({
  sql: z.string().min(1).max(5000),
  params: z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

const configUpdateSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.unknown())]),
  description: z.string().max(500).optional(),
});

export const adminRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply admin authentication to all routes
adminRoutes.use('*', adminMiddleware());

/**
 * POST /admin/seed
 * Seed the database with initial game data.
 * Requires non-production environment.
 */
adminRoutes.post('/seed', requireNonProduction(), zValidator('json', seedSchema), async (c) => {
  // Validation ensures request body matches schema (tables, clearExisting)
  // TODO: Use options for selective seeding when needed
  c.req.valid('json');

  try {
    const cache = new GameCache(c.env.CACHE);
    const results = await seedAll(c.env.DB, cache);

    const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    return c.json({
      success: true,
      data: {
        results,
        summary: {
          tablesSeeded: results.length,
          totalInserted,
          totalErrors,
        },
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return c.json({
      success: false,
      errors: [{
        code: 'SEED_ERROR',
        message: error instanceof Error ? error.message : 'Seeding failed',
      }],
    }, 500);
  }
});

/**
 * POST /admin/cache/warm
 * Warm up the cache with static game data.
 */
adminRoutes.post('/cache/warm', zValidator('json', cacheWarmSchema), async (c) => {
  // Validation ensures request body matches schema (prefixes, ttlSeconds)
  c.req.valid('json');

  try {
    const cache = new GameCache(c.env.CACHE);
    const result = await cache.warmUp(c.env.DB);

    return c.json({
      success: true,
      data: {
        loaded: result.loaded,
        errors: result.errors,
        loadedCount: result.loaded.length,
        errorCount: result.errors.length,
      },
    });
  } catch (error) {
    console.error('Cache warm error:', error);
    return c.json({
      success: false,
      errors: [{
        code: 'CACHE_ERROR',
        message: error instanceof Error ? error.message : 'Cache warming failed',
      }],
    }, 500);
  }
});

/**
 * DELETE /admin/cache
 * Clear all cache entries.
 * Requires non-production environment.
 */
adminRoutes.delete('/cache', requireNonProduction(), zValidator('json', cacheClearSchema), async (c) => {
  // Validation ensures request body matches schema (prefixes, pattern)
  c.req.valid('json');

  try {
    const cache = new GameCache(c.env.CACHE);

    // Clear common prefixes
    const prefixes = ['items:', 'skills:', 'attributes:', 'factions:', 'missions:', 'characters:', 'leaderboard:', 'world:'];
    let totalDeleted = 0;

    for (const prefix of prefixes) {
      const deleted = await cache.deleteByPrefix(prefix);
      totalDeleted += deleted;
    }

    return c.json({
      success: true,
      data: {
        message: 'Cache cleared',
        keysDeleted: totalDeleted,
      },
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return c.json({
      success: false,
      errors: [{
        code: 'CACHE_ERROR',
        message: error instanceof Error ? error.message : 'Cache clear failed',
      }],
    }, 500);
  }
});

/**
 * GET /admin/diagnostics
 * Get system diagnostics.
 */
adminRoutes.get('/diagnostics', async (c) => {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development',
    version: '0.1.0',
  };

  // Test database connection
  try {
    const result = await c.env.DB.prepare('SELECT 1 as test').first();
    diagnostics.database = { status: 'ok', test: result };
  } catch (error) {
    diagnostics.database = { status: 'error', message: String(error) };
  }

  // Test cache
  try {
    const testKey = 'diagnostics:test';
    await c.env.CACHE.put(testKey, 'ok', { expirationTtl: 60 });
    const value = await c.env.CACHE.get(testKey);
    await c.env.CACHE.delete(testKey);
    diagnostics.cache = { status: 'ok', test: value };
  } catch (error) {
    diagnostics.cache = { status: 'error', message: String(error) };
  }

  // Get table counts
  try {
    const tables = ['characters', 'factions', 'mission_definitions', 'item_definitions'];
    const counts: Record<string, number> = {};

    for (const table of tables) {
      try {
        const result = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM ${table}`).first<{ count: number }>();
        counts[table] = result?.count ?? 0;
      } catch {
        counts[table] = -1;
      }
    }

    diagnostics.tableCounts = counts;
  } catch (error) {
    diagnostics.tableCounts = { error: String(error) };
  }

  return c.json({
    success: true,
    data: diagnostics,
  });
});

/**
 * GET /admin/stats
 * Get game statistics.
 */
adminRoutes.get('/stats', async (c) => {
  try {
    const [
      characterCount,
      activeCharacters,
      missionsCompleted,
      activeWars,
    ] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM characters').first<{ count: number }>(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM characters WHERE is_active = 1').first<{ count: number }>(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM character_missions WHERE status = 'COMPLETED'").first<{ count: number }>(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM faction_wars WHERE status = 'ACTIVE'").first<{ count: number }>(),
    ]);

    return c.json({
      success: true,
      data: {
        characters: {
          total: characterCount?.count ?? 0,
          active: activeCharacters?.count ?? 0,
        },
        missions: {
          completed: missionsCompleted?.count ?? 0,
        },
        wars: {
          active: activeWars?.count ?? 0,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return c.json({
      success: false,
      errors: [{
        code: 'STATS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get stats',
      }],
    }, 500);
  }
});

/**
 * POST /admin/query
 * Execute a read-only SQL query (SELECT only).
 * Requires non-production environment.
 */
adminRoutes.post('/query', requireNonProduction(), zValidator('json', querySchema), async (c) => {
  const { sql, params } = c.req.valid('json');

  // Security: Only allow SELECT queries
  const normalizedSql = sql.trim().toUpperCase();
  if (!normalizedSql.startsWith('SELECT')) {
    return c.json({
      success: false,
      errors: [{
        code: 'INVALID_QUERY',
        message: 'Only SELECT queries are allowed',
      }],
    }, 400);
  }

  // Security: Block dangerous patterns
  const dangerousPatterns = [
    /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE)/i,
    /ATTACH\s+DATABASE/i,
    /DETACH\s+DATABASE/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sql)) {
      return c.json({
        success: false,
        errors: [{
          code: 'DANGEROUS_QUERY',
          message: 'Query contains potentially dangerous operations',
        }],
      }, 400);
    }
  }

  try {
    let stmt = c.env.DB.prepare(sql);
    if (params && params.length > 0) {
      stmt = stmt.bind(...params);
    }

    const result = await stmt.all();

    return c.json({
      success: true,
      data: {
        results: result.results,
        meta: {
          rowCount: result.results?.length ?? 0,
          columns: result.results?.[0] ? Object.keys(result.results[0]) : [],
        },
      },
    });
  } catch (error) {
    console.error('Query error:', error);
    return c.json({
      success: false,
      errors: [{
        code: 'QUERY_ERROR',
        message: error instanceof Error ? error.message : 'Query execution failed',
      }],
    }, 500);
  }
});

/**
 * PUT /admin/config/:key
 * Update a game configuration value.
 */
adminRoutes.put('/config/:key', zValidator('json', configUpdateSchema.omit({ key: true })), async (c) => {
  const key = c.req.param('key');
  const { value, description } = c.req.valid('json');

  // Validate key format
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
    return c.json({
      success: false,
      errors: [{
        code: 'INVALID_KEY',
        message: 'Config key must start with a letter and contain only alphanumeric characters and underscores',
      }],
    }, 400);
  }

  try {
    const now = new Date().toISOString();
    const jsonValue = JSON.stringify(value);

    await c.env.DB.prepare(
      `INSERT INTO game_config (key, value, description, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (key) DO UPDATE SET
         value = excluded.value,
         description = COALESCE(excluded.description, game_config.description),
         updated_at = excluded.updated_at`
    ).bind(key, jsonValue, description ?? null, now).run();

    // Invalidate cache
    await c.env.CACHE.delete(`config:${key}`);

    return c.json({
      success: true,
      data: {
        key,
        value,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error('Config update error:', error);
    return c.json({
      success: false,
      errors: [{
        code: 'CONFIG_ERROR',
        message: error instanceof Error ? error.message : 'Config update failed',
      }],
    }, 500);
  }
});

/**
 * GET /admin/config/:key
 * Get a game configuration value.
 */
adminRoutes.get('/config/:key', async (c) => {
  const key = c.req.param('key');

  try {
    const result = await c.env.DB.prepare(
      'SELECT key, value, description, updated_at FROM game_config WHERE key = ?'
    ).bind(key).first<{ key: string; value: string; description: string | null; updated_at: string }>();

    if (!result) {
      return c.json({
        success: false,
        errors: [{
          code: 'NOT_FOUND',
          message: `Config key '${key}' not found`,
        }],
      }, 404);
    }

    return c.json({
      success: true,
      data: {
        key: result.key,
        value: JSON.parse(result.value),
        description: result.description,
        updatedAt: result.updated_at,
      },
    });
  } catch (error) {
    console.error('Config get error:', error);
    return c.json({
      success: false,
      errors: [{
        code: 'CONFIG_ERROR',
        message: error instanceof Error ? error.message : 'Config retrieval failed',
      }],
    }, 500);
  }
});

/**
 * GET /admin/config
 * List all configuration values.
 */
adminRoutes.get('/config', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT key, value, description, updated_at FROM game_config ORDER BY key'
    ).all<{ key: string; value: string; description: string | null; updated_at: string }>();

    const configs = (result.results ?? []).map(row => ({
      key: row.key,
      value: JSON.parse(row.value),
      description: row.description,
      updatedAt: row.updated_at,
    }));

    return c.json({
      success: true,
      data: {
        configs,
        count: configs.length,
      },
    });
  } catch (error) {
    console.error('Config list error:', error);
    return c.json({
      success: false,
      errors: [{
        code: 'CONFIG_ERROR',
        message: error instanceof Error ? error.message : 'Config listing failed',
      }],
    }, 500);
  }
});
