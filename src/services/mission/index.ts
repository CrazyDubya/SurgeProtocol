/**
 * Surge Protocol - Mission Services
 *
 * Exports all mission-related services.
 */

export {
  MissionLifecycleService,
  type MissionStatus,
  type MissionType,
  type MissionDefinition,
  type MissionObjective,
  type ActiveMission,
  type MissionAcceptResult,
  type MissionProgressUpdate,
  type MissionProgressResult,
  type MissionCompletionResult,
  type MissionAbandonResult,
} from './lifecycle';

export {
  MissionGeneratorService,
  type MissionDifficulty,
  type MissionTemplate,
  type DifficultyModifiers,
  type ObjectiveTemplate,
  type VariableSlot,
  type RewardFormula,
  type GeneratedMission,
  type GeneratedObjective,
  type GenerationOptions,
  type GenerationResult,
} from './generator';
