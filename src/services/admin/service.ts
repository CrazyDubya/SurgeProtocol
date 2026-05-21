/**
 * Surge Protocol - Admin Service
 *
 * Business logic for administration: seeding, cache, diagnostics, stats, queries, config.
 */

import { seedAll } from '../../db/seed';
import { GameCache } from '../../cache';

// =============================================================================
// TYPES
// =============================================================================

interface AdminDeps {
    db: D1Database;
    cache: KVNamespace;
    environment?: string;
}

// =============================================================================
// ADMIN SERVICE
// =============================================================================

export class AdminService {
    private db: D1Database;
    private cache: KVNamespace;
    private environment: string;

    constructor(deps: AdminDeps) {
        this.db = deps.db;
        this.cache = deps.cache;
        this.environment = deps.environment || 'development';
    }

    // ---------------------------------------------------------------------------
    // SEEDING
    // ---------------------------------------------------------------------------

    async seed(tables?: string[]) {
        const gameCache = new GameCache(this.cache);
        const results = await seedAll(this.db, gameCache, tables);
        const totalInserted = results.reduce((sum: number, r: { inserted: number }) => sum + r.inserted, 0);
        const totalErrors = results.reduce((sum: number, r: { errors: unknown[] }) => sum + r.errors.length, 0);
        return { results, summary: { tablesSeeded: results.length, totalInserted, totalErrors } };
    }

    // ---------------------------------------------------------------------------
    // CACHE
    // ---------------------------------------------------------------------------

    async warmCache() {
        const gameCache = new GameCache(this.cache);
        const result = await gameCache.warmUp(this.db);
        return { loaded: result.loaded, errors: result.errors, loadedCount: result.loaded.length, errorCount: result.errors.length };
    }

    async clearCache() {
        const gameCache = new GameCache(this.cache);
        const prefixes = ['items:', 'skills:', 'attributes:', 'factions:', 'missions:', 'characters:', 'leaderboard:', 'world:'];
        let totalDeleted = 0;
        for (const prefix of prefixes) totalDeleted += await gameCache.deleteByPrefix(prefix);
        return { message: 'Cache cleared', keysDeleted: totalDeleted };
    }

    // ---------------------------------------------------------------------------
    // DIAGNOSTICS
    // ---------------------------------------------------------------------------

    async getDiagnostics() {
        const diagnostics: Record<string, unknown> = {
            timestamp: new Date().toISOString(),
            environment: this.environment,
            version: '0.1.0',
        };

        try {
            const result = await this.db.prepare('SELECT 1 as test').first();
            diagnostics.database = { status: 'ok', test: result };
        } catch (error) {
            diagnostics.database = { status: 'error', message: String(error) };
        }

        try {
            const testKey = 'diagnostics:test';
            await this.cache.put(testKey, 'ok', { expirationTtl: 60 });
            const value = await this.cache.get(testKey);
            await this.cache.delete(testKey);
            diagnostics.cache = { status: 'ok', test: value };
        } catch (error) {
            diagnostics.cache = { status: 'error', message: String(error) };
        }

        try {
            const tables = ['characters', 'factions', 'mission_definitions', 'item_definitions'];
            const counts: Record<string, number> = {};
            for (const table of tables) {
                try {
                    const result = await this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).first<{ count: number }>();
                    counts[table] = result?.count ?? 0;
                } catch { counts[table] = -1; }
            }
            diagnostics.tableCounts = counts;
        } catch (error) {
            diagnostics.tableCounts = { error: String(error) };
        }

        return diagnostics;
    }

    // ---------------------------------------------------------------------------
    // STATS
    // ---------------------------------------------------------------------------

    async getStats() {
        const [characterCount, activeCharacters, missionsCompleted, activeWars] = await Promise.all([
            this.db.prepare('SELECT COUNT(*) as count FROM characters').first<{ count: number }>(),
            this.db.prepare('SELECT COUNT(*) as count FROM characters WHERE is_active = 1').first<{ count: number }>(),
            this.db.prepare("SELECT COUNT(*) as count FROM character_missions WHERE status = 'COMPLETED'").first<{ count: number }>(),
            this.db.prepare("SELECT COUNT(*) as count FROM faction_wars WHERE status = 'ACTIVE'").first<{ count: number }>(),
        ]);
        return {
            characters: { total: characterCount?.count ?? 0, active: activeCharacters?.count ?? 0 },
            missions: { completed: missionsCompleted?.count ?? 0 },
            wars: { active: activeWars?.count ?? 0 },
            timestamp: new Date().toISOString(),
        };
    }

    // ---------------------------------------------------------------------------
    // QUERY (READ-ONLY)
    // ---------------------------------------------------------------------------

    async executeQuery(sql: string, params?: (string | number | boolean | null)[]) {
        const normalizedSql = sql.trim().toUpperCase();
        if (!normalizedSql.startsWith('SELECT')) throw new Error('Only SELECT queries are allowed');

        const dangerousPatterns = [/;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE)/i, /ATTACH\s+DATABASE/i, /DETACH\s+DATABASE/i];
        for (const pattern of dangerousPatterns) {
            if (pattern.test(sql)) throw new Error('Query contains potentially dangerous operations');
        }

        let stmt = this.db.prepare(sql);
        if (params && params.length > 0) stmt = stmt.bind(...params);
        const result = await stmt.all();
        return { results: result.results, meta: { rowCount: result.results?.length ?? 0, columns: result.results?.[0] ? Object.keys(result.results[0]) : [] } };
    }

    // ---------------------------------------------------------------------------
    // CONFIG
    // ---------------------------------------------------------------------------

    async getConfig(key: string) {
        const result = await this.db.prepare('SELECT key, value, description, updated_at FROM game_config WHERE key = ?')
            .bind(key).first<{ key: string; value: string; description: string | null; updated_at: string }>();
        if (!result) return null;
        return { key: result.key, value: JSON.parse(result.value), description: result.description, updatedAt: result.updated_at };
    }

    async listConfig() {
        const result = await this.db.prepare('SELECT key, value, description, updated_at FROM game_config ORDER BY key')
            .all<{ key: string; value: string; description: string | null; updated_at: string }>();
        const configs = (result.results ?? []).map(row => ({ key: row.key, value: JSON.parse(row.value), description: row.description, updatedAt: row.updated_at }));
        return { configs, count: configs.length };
    }

    async updateConfig(key: string, value: unknown, description?: string) {
        const now = new Date().toISOString();
        const jsonValue = JSON.stringify(value);
        await this.db.prepare(
            `INSERT INTO game_config (key, value, description, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value, description = COALESCE(excluded.description, game_config.description), updated_at = excluded.updated_at`
        ).bind(key, jsonValue, description ?? null, now).run();
        await this.cache.delete(`config:${key}`);
        return { key, value, updatedAt: now };
    }
}
