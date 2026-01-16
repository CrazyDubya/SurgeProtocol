/**
 * API - Centralized API layer for Surge Protocol
 *
 * Services:
 * - authService: Authentication (login, register, refresh)
 * - characterService: Character management
 * - missionService: Mission operations
 * - economyService: Trading and finances
 * - factionService: Faction interactions and wars
 */

// =============================================================================
// CLIENT
// =============================================================================

export {
  api,
  ApiError,
  AuthError,
  NetworkError,
  type ApiResponse,
} from './client';

// =============================================================================
// AUTH SERVICE
// =============================================================================

export { authService } from './authService';

// =============================================================================
// CHARACTER SERVICE
// =============================================================================

export {
  characterService,
  // Types
  type CreateCharacterRequest,
  type UpdateCharacterRequest,
  type CharacterSummary,
  type CharacterDetail,
  type CharacterStats,
  type EquippedItem,
  type CharacterCondition,
  type InventoryResponse,
  type InventoryItem,
  type FactionStanding,
  type SelectCharacterResponse,
} from './characterService';

// =============================================================================
// MISSION SERVICE
// =============================================================================

export {
  missionService,
  // Types
  type MissionType,
  type MissionStatus,
  type DifficultyLevel,
  type RiskLevel,
  type MissionDefinition,
  type MissionInstance,
  type MissionCheckpoint,
  type ActiveMission,
  type MissionRewards,
  type AvailableMissionsResponse,
  type ActiveMissionResponse,
  type MissionDetailsResponse,
  type AcceptMissionResponse,
  type MissionActionType,
  type MissionActionRequest,
  type MissionActionResponse,
  type CompleteMissionRequest,
  type CompleteMissionResponse,
  type AbandonMissionResponse,
} from './missionService';

// =============================================================================
// ECONOMY SERVICE
// =============================================================================

export {
  economyService,
  // Types
  type Currency,
  type Wallet,
  type BalanceResponse,
  type TransactionType,
  type Transaction,
  type TransactionHistoryResponse,
  type VendorType,
  type VendorSummary,
  type VendorDetail,
  type VendorItem,
  type VendorInventory,
  type VendorDetailsResponse,
  type PaymentMethod,
  type BuyRequest,
  type BuyResponse,
  type SellRequest,
  type SellResponse,
  type HaggleRequest,
  type HaggleResult,
  type HaggleResponse,
  type TransferRequest,
  type TransferResponse,
} from './economyService';

// =============================================================================
// FACTION SERVICE
// =============================================================================

export {
  factionService,
  // Types
  type FactionType,
  type ReputationTier,
  type FactionSummary,
  type FactionDetail,
  type FactionRelationship,
  type FactionStats,
  type PlayerStanding,
  type FactionPerk,
  type NextTierInfo,
  type StandingResponse,
  type FactionMember,
  type MembersResponse,
  type WarStatus,
  type FactionWar,
  type WarObjective,
  type WarDetailResponse,
  type ContributionType,
  type ContributeRequest,
  type ContributeResponse,
  type JoinFactionResponse,
  type LeaveFactionResponse,
} from './factionService';
