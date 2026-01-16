/**
 * Surge Protocol - Dice & Resolution System
 *
 * Core 2d6 engine as specified in RULES_ENGINE.md
 * All contested actions use: 2d6 + Modifiers vs Target Number (TN)
 */

/** Result of a dice roll */
export interface DiceRoll {
  /** Individual die values */
  dice: number[];
  /** Sum of all dice */
  total: number;
  /** Whether this was snake eyes (1,1) */
  isSnakeEyes: boolean;
  /** Whether this was boxcars (6,6) */
  isBoxcars: boolean;
}

/** Classification of roll result relative to TN */
export type ResultCategory =
  | 'CATASTROPHE' // TN - 5 or worse
  | 'MISS'        // TN - 4 to TN - 1
  | 'GRAZE'       // TN exactly
  | 'HIT'         // TN + 1 to TN + 4
  | 'PERFECT';    // TN + 5 or better

/** Full skill check result */
export interface SkillCheckResult {
  /** The raw dice roll */
  roll: DiceRoll;
  /** All modifiers applied */
  modifiers: Array<{ name: string; value: number }>;
  /** Total after all modifiers */
  total: number;
  /** Target number to beat */
  tn: number;
  /** Whether the check succeeded */
  success: boolean;
  /** Margin of success/failure (total - TN) */
  margin: number;
  /** Result classification */
  category: ResultCategory;
  /** If critical (snake eyes or boxcars), which one */
  critical?: 'AUTO_FAIL' | 'AUTO_SUCCESS';
}

/** Extended check progress tracker */
export interface ExtendedCheckState {
  /** Total successes accumulated */
  successes: number;
  /** Successes required to complete */
  required: number;
  /** Total failures accumulated */
  failures: number;
  /** Max failures before task fails */
  maxFailures: number;
  /** Individual attempt results */
  attempts: SkillCheckResult[];
  /** Current status */
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

/** Opposed check result */
export interface OpposedCheckResult {
  /** Attacker's roll result */
  attacker: SkillCheckResult;
  /** Defender's roll result */
  defender: SkillCheckResult;
  /** Who won */
  winner: 'ATTACKER' | 'DEFENDER' | 'TIE';
  /** Margin of victory */
  margin: number;
}

/**
 * Cryptographically secure random integer in range [min, max] inclusive.
 * Uses crypto.getRandomValues() for proper randomness in Workers environment.
 */
export function secureRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8) || 1;
  const maxValid = Math.floor(256 ** bytesNeeded / range) * range - 1;

  let value: number;
  const bytes = new Uint8Array(bytesNeeded);

  do {
    crypto.getRandomValues(bytes);
    value = bytes.reduce((acc, byte, i) => acc + byte * 256 ** i, 0);
  } while (value > maxValid);

  return min + (value % range);
}

/**
 * Roll a single die with the specified number of sides.
 */
export function rollDie(sides: number): number {
  return secureRandomInt(1, sides);
}

/**
 * Roll multiple dice and return individual results.
 */
export function rollDice(count: number, sides: number): DiceRoll {
  const dice: number[] = [];
  for (let i = 0; i < count; i++) {
    dice.push(rollDie(sides));
  }

  const total = dice.reduce((sum, d) => sum + d, 0);
  const isSnakeEyes = count === 2 && sides === 6 && dice[0] === 1 && dice[1] === 1;
  const isBoxcars = count === 2 && sides === 6 && dice[0] === 6 && dice[1] === 6;

  return { dice, total, isSnakeEyes, isBoxcars };
}

/**
 * Roll 2d6 - the core dice mechanic for Surge Protocol.
 */
export function roll2d6(): DiceRoll {
  return rollDice(2, 6);
}

/**
 * Classify a result based on margin relative to TN.
 */
export function classifyResult(margin: number): ResultCategory {
  if (margin <= -5) return 'CATASTROPHE';
  if (margin < 0) return 'MISS';
  if (margin === 0) return 'GRAZE';
  if (margin <= 4) return 'HIT';
  return 'PERFECT';
}

/**
 * Calculate attribute modifier from raw attribute value (1-20 scale).
 * Modifier = floor((attribute - 10) / 2)
 */
export function getAttributeModifier(attributeValue: number): number {
  // Clamp to valid range
  const clamped = Math.max(1, Math.min(20, attributeValue));
  return Math.floor((clamped - 10) / 2);
}

/**
 * Perform a standard skill check.
 *
 * Roll = 2d6 + Attribute Mod + Skill Level + Situational Modifiers
 * Compare to TN
 */
export function performSkillCheck(
  attributeValue: number,
  skillLevel: number,
  situationalModifiers: Array<{ name: string; value: number }>,
  tn: number
): SkillCheckResult {
  const roll = roll2d6();
  const attrMod = getAttributeModifier(attributeValue);

  const modifiers: Array<{ name: string; value: number }> = [
    { name: 'Attribute', value: attrMod },
    { name: 'Skill', value: skillLevel },
    ...situationalModifiers,
  ];

  const totalModifier = modifiers.reduce((sum, m) => sum + m.value, 0);
  const total = roll.total + totalModifier;
  const margin = total - tn;

  // Handle criticals - they override normal success/failure
  let success: boolean;
  let critical: 'AUTO_FAIL' | 'AUTO_SUCCESS' | undefined;

  if (roll.isSnakeEyes) {
    success = false;
    critical = 'AUTO_FAIL';
  } else if (roll.isBoxcars) {
    success = true;
    critical = 'AUTO_SUCCESS';
  } else {
    success = total >= tn;
  }

  return {
    roll,
    modifiers,
    total,
    tn,
    success,
    margin,
    category: classifyResult(margin),
    critical,
  };
}

/**
 * Perform an opposed check between two parties.
 * Both roll, higher total wins. Ties favor defender.
 */
export function performOpposedCheck(
  attackerAttr: number,
  attackerSkill: number,
  attackerMods: Array<{ name: string; value: number }>,
  defenderAttr: number,
  defenderSkill: number,
  defenderMods: Array<{ name: string; value: number }>
): OpposedCheckResult {
  // For opposed checks, TN is effectively the opponent's roll
  // We use TN=0 since we're comparing totals directly
  const attacker = performSkillCheck(attackerAttr, attackerSkill, attackerMods, 0);
  const defender = performSkillCheck(defenderAttr, defenderSkill, defenderMods, 0);

  let winner: 'ATTACKER' | 'DEFENDER' | 'TIE';
  let margin: number;

  // Handle criticals first
  if (attacker.critical === 'AUTO_SUCCESS' && defender.critical !== 'AUTO_SUCCESS') {
    winner = 'ATTACKER';
    margin = Math.max(attacker.total - defender.total, 1);
  } else if (defender.critical === 'AUTO_SUCCESS' && attacker.critical !== 'AUTO_SUCCESS') {
    winner = 'DEFENDER';
    margin = Math.max(defender.total - attacker.total, 1);
  } else if (attacker.critical === 'AUTO_FAIL' && defender.critical !== 'AUTO_FAIL') {
    winner = 'DEFENDER';
    margin = Math.max(defender.total - attacker.total, 1);
  } else if (defender.critical === 'AUTO_FAIL' && attacker.critical !== 'AUTO_FAIL') {
    winner = 'ATTACKER';
    margin = Math.max(attacker.total - defender.total, 1);
  } else {
    // Normal comparison - ties favor defender
    if (attacker.total > defender.total) {
      winner = 'ATTACKER';
      margin = attacker.total - defender.total;
    } else if (defender.total > attacker.total) {
      winner = 'DEFENDER';
      margin = defender.total - attacker.total;
    } else {
      winner = 'TIE'; // Status quo maintained
      margin = 0;
    }
  }

  return { attacker, defender, winner, margin };
}

/**
 * Create a new extended check tracker.
 */
export function createExtendedCheck(
  required: number,
  maxFailures: number
): ExtendedCheckState {
  return {
    successes: 0,
    required,
    failures: 0,
    maxFailures,
    attempts: [],
    status: 'IN_PROGRESS',
  };
}

/**
 * Add an attempt to an extended check.
 */
export function addExtendedCheckAttempt(
  state: ExtendedCheckState,
  result: SkillCheckResult
): ExtendedCheckState {
  const newState = { ...state, attempts: [...state.attempts, result] };

  if (result.success) {
    newState.successes++;
  } else {
    newState.failures++;
  }

  if (newState.successes >= newState.required) {
    newState.status = 'COMPLETED';
  } else if (newState.failures >= newState.maxFailures) {
    newState.status = 'FAILED';
  }

  return newState;
}

/**
 * Calculate success probability for a given check.
 * Returns probability as percentage (0-100).
 */
export function calculateSuccessProbability(
  attributeValue: number,
  skillLevel: number,
  totalSituationalMod: number,
  tn: number
): number {
  const attrMod = getAttributeModifier(attributeValue);
  const totalMod = attrMod + skillLevel + totalSituationalMod;
  const targetRoll = tn - totalMod;

  // 2d6 probability distribution
  // Probability of rolling >= target on 2d6
  const probabilities: Record<number, number> = {
    2: 100.0,
    3: 97.22,
    4: 91.67,
    5: 83.33,
    6: 72.22,
    7: 58.33,
    8: 41.67,
    9: 27.78,
    10: 16.67,
    11: 8.33,
    12: 2.78,
  };

  if (targetRoll <= 2) return 100;
  if (targetRoll > 12) return 0;
  return probabilities[targetRoll] ?? 0;
}

/**
 * Parse a dice expression like "2d6+3" or "1d8-1".
 */
export function parseDiceExpression(expr: string): { count: number; sides: number; bonus: number } {
  const match = expr.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) {
    throw new Error(`Invalid dice expression: ${expr}`);
  }

  return {
    count: parseInt(match[1]!, 10),
    sides: parseInt(match[2]!, 10),
    bonus: match[3] ? parseInt(match[3], 10) : 0,
  };
}

/**
 * Roll a dice expression and return the total.
 */
export function rollExpression(expr: string): { dice: number[]; bonus: number; total: number } {
  const { count, sides, bonus } = parseDiceExpression(expr);
  const roll = rollDice(count, sides);
  return {
    dice: roll.dice,
    bonus,
    total: roll.total + bonus,
  };
}
