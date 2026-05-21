/**
 * Service exports for Surge Protocol
 */

// Base Service Classes
export {
  BaseService,
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
  CharacterService,
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
  MissionActionService,
  getActiveVehicle,
  validateVehicleForMission,
  calculateVehicleTimeBonus,
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
  MissionActionContext,
  ActiveVehicleInfo,
  MissionActionInput,
  MissionActionResult,
} from './mission';

// Economy Services
export {
  EconomyService,
} from './economy';

export type {
  CharacterFinances,
  AccountType,
  FinancialTransaction,
  VendorInventory,
  TransferRequest,
  VendorPurchaseRequest,
  VendorSaleRequest,
  HaggleRequest,
} from './economy';

// Combat Services
export {
  CombatResolverService,
  CombatService,
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

// Vehicle Services
export * from './vehicle/index';
export * from './vehicle/drone';

// World Services
export * from './world/index';

// Quest Services
export { QuestService } from './quest';
export type {
  QuestDefinition as QuestDef,
  QuestObjective as QuestObj,
  ActiveQuest,
  QuestStatus,
} from './quest';

// Skill Services
export { SkillService, calculateXPForLevel } from './skills';
export type {
  SkillDefinition,
  CharacterSkillRow,
  EnhancedCharacterSkill,
  TrainResult,
} from './skills';

// Algorithm Services
export { AlgorithmService } from './algorithm';
export type {
  AlgorithmTone,
  ResponseVariant,
} from './algorithm';

// Settings Services
export { SettingsService } from './settings';
export type {
  PlayerSettings,
  GameConfig,
  DifficultyDefinition,
  LocalizedString,
} from './settings';

// Save Services
export { SaveService } from './saves';
export type {
  CharacterStateSnapshot,
  CreateSaveInput,
  CheckpointInput,
} from './saves';

// Achievement Services
export { AchievementService, formatAchievement, formatCharacterAchievement, formatMilestone } from './achievements';
export type {
  AchievementDefinition,
  CharacterAchievement,
  MilestoneDefinition,
} from './achievements';

// Messaging Services
export { MessagingService, formatMessage, formatNotification } from './messaging';
export type {
  MessageRow,
  NotificationRow,
  SendMessageInput,
} from './messaging';

// Leaderboard Services
export { LeaderboardService, formatLeaderboard, formatEntry, getCurrentPeriodId } from './leaderboards';
export type {
  LeaderboardRow,
  EntryRow,
  SubmitScoreInput,
} from './leaderboards';

// Analytics Services
export { AnalyticsService } from './analytics';
export type {
  AnalyticsEvent,
  PlaySession,
} from './analytics';

// Procedural Services
export { ProceduralService } from './procedural';
export type {
  GenerationTemplate,
  LootTable,
} from './procedural';

// Worldstate Services
export { WorldstateService } from './worldstate';
export type {
  WeatherCondition,
  GameTimeState,
} from './worldstate';

// Admin Services
export { AdminService } from './admin';
