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

export const adminRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply admin authentication to all routes
adminRoutes.use('*', adminMiddleware());

/**
 * POST /admin/seed
 * Seed the database with initial game data.
 * Requires non-production environment.
 */
adminRoutes.post('/seed', requireNonProduction(), async (c) => {

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
adminRoutes.post('/cache/warm', async (c) => {
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
adminRoutes.delete('/cache', requireNonProduction(), async (c) => {
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
      c.env.DB.prepare("SELECT COUNT(*) as count FROM mission_instances WHERE status = 'COMPLETED'").first<{ count: number }>(),
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
