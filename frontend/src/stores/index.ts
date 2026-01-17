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

// =============================================================================
// WORLD CLOCK STORE
// =============================================================================

export {
  worldClockStore,
  // State
  gameTimeMinutes,
  weather,
  paused,
  // connected (already exported from other stores with same name)
  lastSync,
  // Computed
  gameDay,
  gameHour,
  gameMinute,
  formattedTime,
  formattedDate,
  timeOfDay,
  weatherDescription,
  weatherIcon,
  isNight,
  isDangerousWeather,
  // Actions
  setGameTime,
  setWeather,
  setPaused,
  // setConnected (already exported)
  handleWorldClockMessage,
  // Types
  type TimeOfDay,
  type WeatherType,
  type WorldClockState,
} from './worldClockStore';

// =============================================================================
// COMBAT STORE
// =============================================================================

export {
  combatStore,
  // State
  combatId,
  phase,
  round,
  combatants,
  currentTurnId,
  actionLog,
  endReason,
  rewards,
  // connected (already exported)
  pendingAction,
  // Computed
  isInCombat,
  currentCombatant,
  isPlayerTurn,
  playerCombatant,
  enemyCombatants,
  allyCombatants,
  turnOrder,
  activeCombatants,
  recentActions,
  isVictory,
  isDefeat,
  // Actions
  startCombat,
  setCombatState,
  updateCombatant,
  addActionLog,
  // setConnected (already exported)
  setPendingAction,
  endCombat,
  handleCombatMessage,
  // Types
  type CombatPhase,
  type CombatEndReason,
  type CombatActionType,
  type Combatant,
  type ActionLogEntry,
  type CombatState,
} from './combatStore';

// =============================================================================
// WAR THEATER STORE
// =============================================================================

export {
  warTheaterStore,
  // State
  factions as warFactions,
  territories,
  wars,
  events,
  playerContribution,
  // connected (already exported)
  selectedTerritory,
  selectedWar,
  // Computed
  activeWars,
  brewingWars,
  contestedTerritories,
  territoriesByFaction,
  factionRankings,
  recentEvents,
  criticalEvents,
  selectedTerritoryDetails,
  selectedWarDetails,
  // Helpers
  getFaction,
  // Actions
  setFactions as setWarFactions,
  setTerritories,
  setWars,
  addEvent,
  updateTerritory,
  updateFaction,
  updateWar,
  setPlayerContribution,
  // setConnected (already exported)
  selectTerritory,
  selectWar,
  handleWarTheaterMessage,
  // Types
  type WarStatus,
  type TerritoryType,
  type Faction,
  type Territory,
  type War,
  type WarEvent,
  type PlayerContribution,
} from './warTheaterStore';
