/**
 * Stores - Centralized state management with Preact Signals
 */

// Auth store
export {
  authStore,
  // State signals
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
  // Types
  type User,
  type Character,
  type AuthTokens,
} from './authStore';
