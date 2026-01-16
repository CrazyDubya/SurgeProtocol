/**
 * Surge Protocol - KV Cache Layer
 *
 * Caching utilities for game data using Cloudflare KV.
 * Provides fast reads for frequently accessed data.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface CacheOptions {
  /** Time-to-live in seconds */
  ttl?: number;
  /** Cache key prefix */
  prefix?: string;
}

export interface CachedData<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
}

// Default TTLs for different data types
export const CACHE_TTL = {
  /** Static game data (items, skills, etc.) - 1 hour */
  STATIC: 3600,
  /** Semi-static data (factions, NPCs) - 5 minutes */
  SEMI_STATIC: 300,
  /** Dynamic data (leaderboards, war state) - 30 seconds */
  DYNAMIC: 30,
  /** Session data - 1 hour */
  SESSION: 3600,
  /** Character data - 1 minute */
  CHARACTER: 60,
} as const;

// =============================================================================
// CACHE KEYS
// =============================================================================

export const CACHE_KEYS = {
  // Static game data
  allItems: () => 'items:all',
  item: (id: string) => `items:${id}`,
  allSkills: () => 'skills:all',
  skill: (id: string) => `skills:${id}`,
  allAttributes: () => 'attributes:all',
  allTiers: () => 'tiers:all',
  allTracks: () => 'tracks:all',

  // Faction data
  allFactions: () => 'factions:all',
  faction: (id: string) => `factions:${id}`,
  factionWars: (id: string) => `factions:${id}:wars`,
  activeWars: () => 'wars:active',
  war: (id: string) => `wars:${id}`,

  // Mission data
  missionTemplates: (tier: number) => `missions:templates:tier${tier}`,
  mission: (id: string) => `missions:${id}`,
  availableMissions: (tier: number) => `missions:available:tier${tier}`,

  // Character data (short TTL)
  character: (id: string) => `characters:${id}`,
  characterStats: (id: string) => `characters:${id}:stats`,
  characterInventory: (id: string) => `characters:${id}:inventory`,
  characterSkills: (id: string) => `characters:${id}:skills`,

  // Leaderboards
  topCarriers: () => 'leaderboard:carriers',
  factionLeaderboard: (factionId: string) => `leaderboard:faction:${factionId}`,

  // World state
  worldTime: () => 'world:time',
  worldWeather: () => 'world:weather',
  districtControl: () => 'world:districts',

  // Sessions
  session: (id: string) => `sessions:${id}`,
  userSessions: (userId: string) => `users:${userId}:sessions`,
} as const;

// =============================================================================
// CACHE CLASS
// =============================================================================

export class GameCache {
  constructor(private kv: KVNamespace) {}

  /**
   * Get a value from cache.
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.kv.get(key, 'json');
    return value as T | null;
  }

  /**
   * Get a value with metadata.
   */
  async getWithMetadata<T>(key: string): Promise<CachedData<T> | null> {
    const result = await this.kv.getWithMetadata<CachedData<T>>(key, 'json');
    if (!result.value) return null;

    return {
      data: result.value as unknown as T,
      cachedAt: (result.metadata as { cachedAt?: string })?.cachedAt ?? new Date().toISOString(),
      expiresAt: (result.metadata as { expiresAt?: string })?.expiresAt ?? new Date().toISOString(),
    };
  }

  /**
   * Set a value in cache.
   */
  async set<T>(key: string, value: T, ttl: number = CACHE_TTL.SEMI_STATIC): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    await this.kv.put(key, JSON.stringify(value), {
      expirationTtl: ttl,
      metadata: {
        cachedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
    });
  }

  /**
   * Delete a value from cache.
   */
  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  /**
   * Delete multiple keys matching a prefix.
   */
  async deleteByPrefix(prefix: string): Promise<number> {
    const list = await this.kv.list({ prefix });
    let deleted = 0;

    for (const key of list.keys) {
      await this.kv.delete(key.name);
      deleted++;
    }

    return deleted;
  }

  /**
   * Get or set pattern - returns cached value or fetches and caches.
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.SEMI_STATIC
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate character cache.
   */
  async invalidateCharacter(characterId: string): Promise<void> {
    await Promise.all([
      this.delete(CACHE_KEYS.character(characterId)),
      this.delete(CACHE_KEYS.characterStats(characterId)),
      this.delete(CACHE_KEYS.characterInventory(characterId)),
      this.delete(CACHE_KEYS.characterSkills(characterId)),
    ]);
  }

  /**
   * Invalidate faction cache.
   */
  async invalidateFaction(factionId: string): Promise<void> {
    await Promise.all([
      this.delete(CACHE_KEYS.faction(factionId)),
      this.delete(CACHE_KEYS.factionWars(factionId)),
      this.delete(CACHE_KEYS.allFactions()),
    ]);
  }

  /**
   * Invalidate war cache.
   */
  async invalidateWar(warId: string): Promise<void> {
    await Promise.all([
      this.delete(CACHE_KEYS.war(warId)),
      this.delete(CACHE_KEYS.activeWars()),
    ]);
  }

  /**
   * Warm up cache with static game data.
   */
  async warmUp(db: D1Database): Promise<{ loaded: string[]; errors: string[] }> {
    const loaded: string[] = [];
    const errors: string[] = [];

    // Load all items
    try {
      const items = await db.prepare('SELECT * FROM item_definitions').all();
      await this.set(CACHE_KEYS.allItems(), items.results, CACHE_TTL.STATIC);
      loaded.push('items');
    } catch (e) {
      errors.push(`items: ${e}`);
    }

    // Load all skills
    try {
      const skills = await db.prepare('SELECT * FROM skill_definitions').all();
      await this.set(CACHE_KEYS.allSkills(), skills.results, CACHE_TTL.STATIC);
      loaded.push('skills');
    } catch (e) {
      errors.push(`skills: ${e}`);
    }

    // Load all attributes
    try {
      const attributes = await db.prepare('SELECT * FROM attribute_definitions').all();
      await this.set(CACHE_KEYS.allAttributes(), attributes.results, CACHE_TTL.STATIC);
      loaded.push('attributes');
    } catch (e) {
      errors.push(`attributes: ${e}`);
    }

    // Load all factions
    try {
      const factions = await db.prepare('SELECT * FROM factions').all();
      await this.set(CACHE_KEYS.allFactions(), factions.results, CACHE_TTL.SEMI_STATIC);
      loaded.push('factions');
    } catch (e) {
      errors.push(`factions: ${e}`);
    }

    // Load tier definitions
    try {
      const tiers = await db.prepare('SELECT * FROM tier_definitions ORDER BY tier_number').all();
      await this.set(CACHE_KEYS.allTiers(), tiers.results, CACHE_TTL.STATIC);
      loaded.push('tiers');
    } catch (e) {
      errors.push(`tiers: ${e}`);
    }

    // Load track definitions
    try {
      const tracks = await db.prepare('SELECT * FROM track_definitions').all();
      await this.set(CACHE_KEYS.allTracks(), tracks.results, CACHE_TTL.STATIC);
      loaded.push('tracks');
    } catch (e) {
      errors.push(`tracks: ${e}`);
    }

    // Load available missions by tier
    for (let tier = 1; tier <= 10; tier++) {
      try {
        const missions = await db
          .prepare(
            `SELECT * FROM mission_definitions
             WHERE tier_minimum <= ? AND tier_maximum >= ?
             AND is_repeatable = 1`
          )
          .bind(tier, tier)
          .all();
        await this.set(CACHE_KEYS.availableMissions(tier), missions.results, CACHE_TTL.SEMI_STATIC);
        loaded.push(`missions:tier${tier}`);
      } catch (e) {
        errors.push(`missions:tier${tier}: ${e}`);
      }
    }

    return { loaded, errors };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a cache instance from KV namespace.
 */
export function createCache(kv: KVNamespace): GameCache {
  return new GameCache(kv);
}
