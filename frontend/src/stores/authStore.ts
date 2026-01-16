/**
 * Auth Store - JWT token management and authentication state
 *
 * Uses Preact Signals for reactive state management
 */

import { signal, computed } from '@preact/signals';

// =============================================================================
// TYPES
// =============================================================================

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Character {
  id: string;
  legalName: string;
  streetName?: string;
  handle?: string;
  currentTier: number;
  carrierRating: number;
  currentHealth: number;
  maxHealth: number;
  isActive: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// =============================================================================
// STORAGE KEYS
// =============================================================================

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'surge_access_token',
  REFRESH_TOKEN: 'surge_refresh_token',
  USER: 'surge_user',
  CHARACTER_ID: 'surge_character_id',
} as const;

// =============================================================================
// HELPERS
// =============================================================================

function getStoredValue<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function setStoredValue(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error('Failed to store value:', key);
  }
}

function removeStoredValue(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    console.error('Failed to remove value:', key);
  }
}

// =============================================================================
// STATE SIGNALS
// =============================================================================

// Core auth state
export const accessToken = signal<string | null>(
  localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
);

export const refreshToken = signal<string | null>(
  localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
);

export const user = signal<User | null>(
  getStoredValue<User>(STORAGE_KEYS.USER)
);

export const activeCharacterId = signal<string | null>(
  localStorage.getItem(STORAGE_KEYS.CHARACTER_ID)
);

export const characters = signal<Character[]>([]);

// Loading states
export const isLoading = signal(false);
export const isRefreshing = signal(false);
export const authError = signal<string | null>(null);

// =============================================================================
// COMPUTED VALUES
// =============================================================================

export const isAuthenticated = computed(() => !!accessToken.value && !!user.value);

export const hasCharacter = computed(() => !!activeCharacterId.value);

export const activeCharacter = computed(() =>
  characters.value.find((c) => c.id === activeCharacterId.value) || null
);

export const needsCharacterSelection = computed(
  () => isAuthenticated.value && !hasCharacter.value
);

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Set tokens after successful login/refresh
 */
export function setTokens(tokens: AuthTokens): void {
  accessToken.value = tokens.accessToken;
  refreshToken.value = tokens.refreshToken;

  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
}

/**
 * Set user data after successful login
 */
export function setUser(userData: User): void {
  user.value = userData;
  setStoredValue(STORAGE_KEYS.USER, userData);
}

/**
 * Set active character
 */
export function setActiveCharacter(characterId: string, newTokens?: AuthTokens): void {
  activeCharacterId.value = characterId;
  localStorage.setItem(STORAGE_KEYS.CHARACTER_ID, characterId);

  if (newTokens) {
    setTokens(newTokens);
  }
}

/**
 * Set character list
 */
export function setCharacters(charList: Character[]): void {
  characters.value = charList;
}

/**
 * Clear all auth state (logout)
 */
export function clearAuth(): void {
  accessToken.value = null;
  refreshToken.value = null;
  user.value = null;
  activeCharacterId.value = null;
  characters.value = [];
  authError.value = null;

  removeStoredValue(STORAGE_KEYS.ACCESS_TOKEN);
  removeStoredValue(STORAGE_KEYS.REFRESH_TOKEN);
  removeStoredValue(STORAGE_KEYS.USER);
  removeStoredValue(STORAGE_KEYS.CHARACTER_ID);
}

/**
 * Set auth error
 */
export function setAuthError(error: string | null): void {
  authError.value = error;
}

/**
 * Set loading state
 */
export function setLoading(loading: boolean): void {
  isLoading.value = loading;
}

/**
 * Set refreshing state
 */
export function setRefreshing(refreshing: boolean): void {
  isRefreshing.value = refreshing;
}

// =============================================================================
// STORE EXPORT
// =============================================================================

export const authStore = {
  // State
  accessToken,
  refreshToken,
  user,
  activeCharacterId,
  characters,
  isLoading,
  isRefreshing,
  authError,

  // Computed
  isAuthenticated,
  hasCharacter,
  activeCharacter,
  needsCharacterSelection,

  // Actions
  setTokens,
  setUser,
  setActiveCharacter,
  setCharacters,
  clearAuth,
  setAuthError,
  setLoading,
  setRefreshing,
};

export default authStore;
