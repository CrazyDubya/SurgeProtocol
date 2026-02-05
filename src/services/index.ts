/**
 * Service exports for Surge Protocol
 */

// Base Service Classes
export {
  BaseService,
  CharacterService,
  AppError,
  ErrorCodes,
} from './base';

export type {
  ServiceContext,
  ServiceResult,
  ServiceError,
  ServiceResponse,
  CharacterData,
  CharacterUpdateData,
  ErrorCode,
} from './base';

// Cloudflare Token Service
export {
  CFTokenService,
  CFTokenError,
  TOKEN_PROFILES,
} from './cf-token-service';

export type {
  TokenServiceConfig,
  CreateTokenOptions,
  TokenResult,
} from './cf-token-service';

// Rating Services
export {
  RatingCalculatorService,
  StatelessRatingCalculator,
  RatingDecayService,
  createDecayJob,
  getDecayAlgorithmMessage,
} from './rating';

export type {
  RatingComponentRecord,
  RatingUpdateResult,
  RatingSnapshot,
  MissionHistory,
  DecayResult,
  BatchDecayResult,
  DecayConfig,
  InactiveCharacter,
} from './rating';

// Character Services
export {
  CharacterProgressionService,
  StatelessProgressionCalculator,
  HumanityService,
  StatelessHumanityCalculator,
  TIER_DEFINITIONS,
  HUMANITY_THRESHOLDS,
} from './character';

export type {
  TierDefinition,
  XPGainResult,
  XPGainSource,
  XPMultiplier,
  TierAdvancementResult,
  AttributeAllocation,
  AllocationResult,
  ProgressionSnapshot,
  HumanityThreshold,
  ThresholdEffect,
  HumanitySnapshot,
  HumanityChangeResult,
  HumanityChangeSource,
  AugmentHumanityCost,
} from './character';

// Mission Services
export {
  MissionLifecycleService,
  MissionGeneratorService,
} from './mission';

export type {
  MissionStatus,
  MissionType,
  MissionDefinition,
  MissionObjective,
  ActiveMission,
  MissionAcceptResult,
  MissionProgressUpdate,
  MissionProgressResult,
  MissionCompletionResult,
  MissionAbandonResult,
  MissionDifficulty,
  MissionTemplate,
  DifficultyModifiers,
  ObjectiveTemplate,
  VariableSlot,
  RewardFormula,
  GeneratedMission,
  GeneratedObjective,
  GenerationOptions,
  GenerationResult,
} from './mission';

// Economy Services
export {
  TransactionService,
  VendorService,
} from './economy';

export type {
  CharacterFinances,
  TransactionRecord,
  BalanceSummary,
  AccountType,
  PaymentMethod,
  TransferParams,
  PurchaseParams,
  DebtCreateParams,
  DebtPaymentParams,
  VendorInfo,
  ItemDefinition,
  BuyResult,
  SellResult,
  HaggleResult,
} from './economy';

// Combat Services
export {
  CombatResolverService,
} from './combat';

export type {
  CombatSessionConfig,
  CombatParticipant,
  CombatSessionResult,
  ActionResult,
  CombatEndResult,
  CombatPhase,
  CombatEndReason,
  CombatActionType,
  CombatState,
  Combatant,
  Weapon,
  Armor,
  AttackResult,
} from './combat';
