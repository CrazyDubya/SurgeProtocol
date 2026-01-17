/**
 * Persistence Utilities - LocalStorage management for stores
 *
 * Provides:
 * - Type-safe storage operations
 * - Automatic JSON serialization
 * - Versioned storage with migration support
 * - Compression for large data (optional)
 */

// =============================================================================
// TYPES
// =============================================================================

export interface StorageOptions {
  version?: number;
  compress?: boolean;
  ttl?: number; // Time to live in milliseconds
}

interface StoredData<T> {
  data: T;
  version: number;
  timestamp: number;
  ttl?: number;
}

// =============================================================================
// STORAGE KEYS
// =============================================================================

export const STORAGE_KEYS = {
  // Auth (managed by authStore)
  AUTH_ACCESS_TOKEN: 'surge_access_token',
  AUTH_REFRESH_TOKEN: 'surge_refresh_token',
  AUTH_USER: 'surge_user',
  AUTH_CHARACTER_ID: 'surge_character_id',

  // UI preferences
  UI_THEME: 'surge_theme',
  UI_SIDEBAR_COLLAPSED: 'surge_sidebar_collapsed',

  // Cache
  CACHE_CHARACTER: 'surge_cache_character',
  CACHE_MISSIONS: 'surge_cache_missions',
  CACHE_INVENTORY: 'surge_cache_inventory',

  // App state
  APP_LAST_ROUTE: 'surge_last_route',
  APP_DISMISSED_BANNERS: 'surge_dismissed_banners',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// =============================================================================
// CURRENT VERSION
// =============================================================================

const CURRENT_VERSION = 1;

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Check if storage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a value from localStorage with type safety
 */
export function getStoredValue<T>(
  key: string,
  defaultValue: T,
  options: StorageOptions = {}
): T {
  if (!isStorageAvailable()) {
    return defaultValue;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return defaultValue;
    }

    const stored: StoredData<T> = JSON.parse(raw);

    // Check version
    const expectedVersion = options.version ?? CURRENT_VERSION;
    if (stored.version !== expectedVersion) {
      // Version mismatch - clear old data
      localStorage.removeItem(key);
      return defaultValue;
    }

    // Check TTL
    if (stored.ttl) {
      const age = Date.now() - stored.timestamp;
      if (age > stored.ttl) {
        localStorage.removeItem(key);
        return defaultValue;
      }
    }

    return stored.data;
  } catch {
    // Invalid data - clear it
    localStorage.removeItem(key);
    return defaultValue;
  }
}

/**
 * Set a value in localStorage with metadata
 */
export function setStoredValue<T>(
  key: string,
  value: T,
  options: StorageOptions = {}
): boolean {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    const stored: StoredData<T> = {
      data: value,
      version: options.version ?? CURRENT_VERSION,
      timestamp: Date.now(),
      ttl: options.ttl,
    };

    localStorage.setItem(key, JSON.stringify(stored));
    return true;
  } catch (error) {
    // Storage might be full
    console.error('Failed to store value:', error);
    return false;
  }
}

/**
 * Remove a value from localStorage
 */
export function removeStoredValue(key: string): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
}

/**
 * Clear all app storage
 */
export function clearAllStorage(): void {
  if (!isStorageAvailable()) {
    return;
  }

  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

/**
 * Get storage usage info
 */
export function getStorageUsage(): { used: number; available: number } {
  if (!isStorageAvailable()) {
    return { used: 0, available: 0 };
  }

  let used = 0;
  for (const key of Object.keys(localStorage)) {
    const value = localStorage.getItem(key);
    if (value) {
      used += key.length + value.length;
    }
  }

  // Approximate available (5MB typical limit)
  const available = 5 * 1024 * 1024 - used;

  return { used, available: Math.max(0, available) };
}

// =============================================================================
// CACHE HELPERS
// =============================================================================

const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Cache data with TTL
 */
export function cacheData<T>(key: string, data: T, ttl = DEFAULT_CACHE_TTL): void {
  setStoredValue(key, data, { ttl });
}

/**
 * Get cached data if still valid
 */
export function getCachedData<T>(key: string): T | null {
  return getStoredValue<T | null>(key, null);
}

/**
 * Clear specific cache
 */
export function clearCache(key: string): void {
  removeStoredValue(key);
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  Object.entries(STORAGE_KEYS)
    .filter(([k]) => k.startsWith('CACHE_'))
    .forEach(([, v]) => removeStoredValue(v));
}

// =============================================================================
// PREFERENCE HELPERS
// =============================================================================

/**
 * Save a user preference
 */
export function savePreference<T>(key: string, value: T): void {
  setStoredValue(key, value);
}

/**
 * Get a user preference
 */
export function getPreference<T>(key: string, defaultValue: T): T {
  return getStoredValue(key, defaultValue);
}

// =============================================================================
// EXPORT
// =============================================================================

export const persistence = {
  // Core
  isStorageAvailable,
  getStoredValue,
  setStoredValue,
  removeStoredValue,
  clearAllStorage,
  getStorageUsage,

  // Cache
  cacheData,
  getCachedData,
  clearCache,
  clearAllCaches,

  // Preferences
  savePreference,
  getPreference,

  // Keys
  KEYS: STORAGE_KEYS,
};

export default persistence;
