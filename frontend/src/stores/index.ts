/**
 * Stores - Centralized state management with Preact Signals
 *
 * Architecture:
 * - Each store manages a specific domain (auth, character, missions, etc.)
 * - State is held in signals for reactivity
 * - Computed values derive from state signals
 * - Actions modify state
 * - Persistence utilities handle localStorage
 */

// =============================================================================
// AUTH STORE
// =============================================================================

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

// =============================================================================
// CHARACTER STORE
// =============================================================================

export {
  characterStore,
  // State
  character,
  attributes,
  skills,
  factions,
  finances,
  conditions,
  equipped,
  isLoadingCharacter,
  isLoadingStats,
  characterError,
  // Computed
  healthPercent,
  humanityPercent,
  isHealthCritical,
  isHumanityLow,
  getAttributeByCode,
  primaryAttributes,
  totalCredits,
  displayName,
  activeConditions,
  // Actions
  setCharacter,
  setAttributes,
  setSkills,
  setFactions,
  setFinances,
  setConditions,
  setEquipped,
  updateHealth,
  updateHumanity,
  setLoadingCharacter,
  setLoadingStats,
  setCharacterError,
  clearCharacterData,
  // Types
  type CharacterData,
  type CharacterAttribute,
  type CharacterSkill,
  type FactionStanding,
  type CharacterFinances,
  type CharacterCondition,
  type EquippedItem,
} from './characterStore';

// =============================================================================
// MISSION STORE
// =============================================================================

export {
  missionStore,
  // State
  availableMissions,
  activeMission,
  missionHistory,
  currentTier,
  carrierRating,
  canAcceptNew,
  missionFilter,
  isLoadingMissions,
  isLoadingActive,
  missionError,
  // Computed
  filteredMissions,
  hasActiveMission,
  activeMissionProgress,
  timeRemaining,
  isTimeCritical,
  missionStats,
  availableMissionTypes,
  // Actions
  setAvailableMissions,
  setActiveMission,
  setMissionHistory,
  setMissionFilter,
  clearMissionFilter,
  setTierInfo,
  completeCheckpoint,
  setLoadingMissions,
  setLoadingActive,
  setMissionError,
  clearMissionData,
  removeMissionFromAvailable,
  // Types
  type MissionDefinition,
  type MissionInstance,
  type MissionCheckpoint,
  type ActiveMission,
  type MissionStatus,
  type MissionFilter,
} from './missionStore';

// =============================================================================
// INVENTORY STORE
// =============================================================================

export {
  inventoryStore,
  // State
  items,
  selectedItemId,
  currentWeight,
  maxWeight,
  inventoryFilter,
  inventorySortBy,
  inventorySortOrder,
  isLoadingInventory,
  inventoryError,
  // Computed
  filteredItems,
  equippedItems,
  selectedItem,
  weightPercent,
  isOverEncumbered,
  isNearCapacity,
  itemCountsByType,
  totalInventoryValue,
  availableItemTypes,
  // Actions
  setItems,
  addItem,
  removeItem,
  updateItemQuantity,
  equipItem,
  unequipItem,
  selectItem,
  setInventoryFilter,
  clearInventoryFilter,
  setInventorySort,
  toggleSortOrder,
  setWeightCapacity,
  recalculateWeight,
  setLoadingInventory,
  setInventoryError,
  clearInventoryData,
  // Types
  type InventoryItem,
  type ItemEffect,
  type ItemStat,
  type ItemType,
  type ItemRarity,
  type InventoryFilter,
  type InventorySortBy,
  type SortOrder,
} from './inventoryStore';

// =============================================================================
// UI STORE
// =============================================================================

export {
  uiStore,
  // State
  toasts,
  modals,
  confirmDialog,
  globalLoading,
  globalLoadingMessage,
  isSidebarCollapsed,
  isMobileMenuOpen,
  currentRoute,
  isDetailPanelOpen,
  detailPanelContent,
  isOnline,
  connectionStatus,
  // Computed
  hasToasts,
  hasModals,
  topModal,
  isAnyLoading,
  showOfflineBanner,
  // Toast actions
  showToast,
  dismissToast,
  dismissAllToasts,
  toast,
  // Modal actions
  openModal,
  closeModal,
  closeTopModal,
  closeAllModals,
  showConfirm,
  closeConfirm,
  // Loading actions
  setGlobalLoading,
  // Navigation actions
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileMenu,
  closeMobileMenu,
  setCurrentRoute,
  // Panel actions
  openDetailPanel,
  closeDetailPanel,
  // Connection actions
  setOnlineStatus,
  setConnectionStatus,
  // Types
  type Toast,
  type ToastType,
  type ToastAction,
  type Modal,
  type ConfirmDialog,
} from './uiStore';

// =============================================================================
// PERSISTENCE
// =============================================================================

export {
  persistence,
  // Core functions
  isStorageAvailable,
  getStoredValue,
  setStoredValue,
  removeStoredValue,
  clearAllStorage,
  getStorageUsage,
  // Cache helpers
  cacheData,
  getCachedData,
  clearCache,
  clearAllCaches,
  // Preference helpers
  savePreference,
  getPreference,
  // Keys
  STORAGE_KEYS,
  // Types
  type StorageOptions,
  type StorageKey,
} from './persistence';
