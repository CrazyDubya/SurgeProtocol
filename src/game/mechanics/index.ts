/**
 * Surge Protocol - Game Mechanics
 *
 * Core mechanical systems for the delivery courier RPG.
 */

// Dice & Resolution
export {
  // Types
  type DiceRoll,
  type ResultCategory,
  type SkillCheckResult,
  type ExtendedCheckState,
  type OpposedCheckResult,
  // Functions
  secureRandomInt,
  rollDie,
  rollDice,
  roll2d6,
  classifyResult,
  getAttributeModifier,
  performSkillCheck,
  performOpposedCheck,
  createExtendedCheck,
  addExtendedCheckAttempt,
  calculateSuccessProbability,
  parseDiceExpression,
  rollExpression,
} from './dice';

// Combat
export {
  // Types
  type CombatAttributes,
  type Weapon,
  type Armor,
  type Cover,
  type Combatant,
  type InitiativeResult,
  type AttackResult,
  type DamageResult,
  type WoundStatus,
  // Constants
  COVER_TYPES,
  SPECIAL_ACTIONS,
  // Functions
  rollInitiative,
  sortByInitiative,
  calculateDefense,
  getRangePenalty,
  performAttack,
  calculateDamage,
  calculateMaxHP,
  getWoundStatus,
  getWoundPenalty,
  applyDamage,
  calculateRestHealing,
} from './combat';

// Rating System
export {
  // Types
  type RatingComponent,
  type RatingBreakdown,
  type RatingChange,
  type MissionResult,
  // Constants
  TIER_THRESHOLDS,
  TIER_MULTIPLIERS,
  RATING_WEIGHTS,
  // Functions
  getTierFromRating,
  getTierRatingRange,
  calculateRating,
  calculateDeliverySuccessRate,
  calculateSpeedPerformance,
  calculateCustomerSatisfaction,
  calculatePackageIntegrity,
  calculateIncidentScore,
  updateRatingFromMission,
  calculateDecay,
  applyDeathSpiralProtection,
  isNearTierUp,
  getAlgorithmCommentary,
} from './rating';
