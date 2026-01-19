/**
 * Surge Protocol - Character Services
 *
 * Services for character management including:
 * - Progression (XP, tiers, attribute allocation)
 * - Humanity (thresholds, cyberpsychosis, shadow)
 */

export {
  CharacterProgressionService,
  StatelessProgressionCalculator,
  TIER_DEFINITIONS,
  type TierDefinition,
  type XPGainResult,
  type XPGainSource,
  type XPMultiplier,
  type TierAdvancementResult,
  type AttributeAllocation,
  type AllocationResult,
  type ProgressionSnapshot,
} from './progression';

export {
  HumanityService,
  StatelessHumanityCalculator,
  HUMANITY_THRESHOLDS,
  type HumanityThreshold,
  type ThresholdEffect,
  type HumanitySnapshot,
  type HumanityChangeResult,
  type HumanityChangeSource,
  type AugmentHumanityCost,
} from './humanity';
