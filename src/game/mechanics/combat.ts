/**
 * Surge Protocol - Combat Calculations
 *
 * Implements combat mechanics from RULES_ENGINE.md:
 * - Initiative
 * - Attack resolution (melee/ranged)
 * - Damage calculation with armor
 * - Wound thresholds
 * - Cover system
 */

import {
  roll2d6,
  rollExpression,
  getAttributeModifier,
  performSkillCheck,
  type DiceRoll,
  type SkillCheckResult,
} from './dice';

/** Character attributes used in combat */
export interface CombatAttributes {
  PWR: number; // Power - melee damage, HP
  AGI: number; // Agility - defense
  END: number; // Endurance - HP
  VEL: number; // Velocity - ranged, initiative
  PRC: number; // Perception - initiative, ranged
}

/** Weapon definition */
export interface Weapon {
  id: string;
  name: string;
  type: 'MELEE' | 'RANGED';
  subtype: 'LIGHT_PISTOL' | 'HEAVY_PISTOL' | 'SMG' | 'ASSAULT_RIFLE' | 'SHOTGUN' | 'SNIPER' | 'LIGHT_MELEE' | 'HEAVY_MELEE' | 'UNARMED';
  baseDamage: string; // e.g., "2d6+2"
  scalingAttribute: 'PWR' | 'VEL' | 'PRC';
  scalingDivisor: number; // e.g., 2 means attr/2
  attackMod: number; // Weapon accuracy/mod bonus
  ranges?: {
    short: number;
    medium: number;
    long: number;
  };
}

/** Armor definition */
export interface Armor {
  id: string;
  name: string;
  value: number;
  agiPenalty: number;
  velPenalty: number;
}

/** Cover type */
export interface Cover {
  type: 'NONE' | 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'FULL';
  defenseBonus: number;
  hp: number;
}

/** Combatant state */
export interface Combatant {
  id: string;
  name: string;
  attributes: CombatAttributes;
  skills: {
    melee: number;
    firearms: number;
  };
  hp: number;
  hpMax: number;
  armor: Armor | null;
  weapon: Weapon | null;
  cover: Cover | null;
  augmentBonuses: {
    initiative: number;
    attack: number;
    defense: number;
    damage: number;
  };
  conditions: string[];
  position: { x: number; y: number };
  items?: Array<{ id: string; name: string; description?: string; quantity: number }>;
  abilities?: Array<{ id: string; name: string; description?: string; apCost?: number }>;
}

/** Initiative result */
export interface InitiativeResult {
  combatantId: string;
  roll: DiceRoll;
  velMod: number;
  prcMod: number;
  augmentBonus: number;
  total: number;
}

/** Attack result */
export interface AttackResult {
  attacker: string;
  defender: string;
  attackType: 'MELEE' | 'RANGED';
  roll: SkillCheckResult;
  hit: boolean;
  damage?: DamageResult;
  narrative: string;
}

/** Damage calculation result */
export interface DamageResult {
  weaponDamage: number;
  marginBonus: number;
  attributeScaling: number;
  rawDamage: number;
  armorReduction: number;
  finalDamage: number;
  breakdown: string[];
}

/** Wound status */
export type WoundStatus = 'HEALTHY' | 'WOUNDED' | 'BADLY_WOUNDED' | 'CRITICAL' | 'DOWN' | 'DEAD';

// =============================================================================
// COVER DEFINITIONS
// =============================================================================

export const COVER_TYPES: Record<string, Cover> = {
  NONE: { type: 'NONE', defenseBonus: 0, hp: 0 },
  LIGHT: { type: 'LIGHT', defenseBonus: 2, hp: 10 },
  MEDIUM: { type: 'MEDIUM', defenseBonus: 4, hp: 25 },
  HEAVY: { type: 'HEAVY', defenseBonus: 6, hp: 50 },
  FULL: { type: 'FULL', defenseBonus: 999, hp: 999 }, // Cannot be targeted
};

// =============================================================================
// INITIATIVE
// =============================================================================

/**
 * Calculate initiative for a combatant.
 * Initiative = 2d6 + VEL mod + PRC mod + Augment bonuses
 */
export function rollInitiative(combatant: Combatant): InitiativeResult {
  const roll = roll2d6();
  const velMod = getAttributeModifier(combatant.attributes.VEL);
  const prcMod = getAttributeModifier(combatant.attributes.PRC);
  const augmentBonus = combatant.augmentBonuses.initiative;

  return {
    combatantId: combatant.id,
    roll,
    velMod,
    prcMod,
    augmentBonus,
    total: roll.total + velMod + prcMod + augmentBonus,
  };
}

/**
 * Sort combatants by initiative, handling ties.
 * Ties broken by: 1) Higher VEL, 2) Higher PRC, 3) Keep original order
 */
export function sortByInitiative(
  results: InitiativeResult[],
  combatants: Map<string, Combatant>
): string[] {
  return results
    .sort((a, b) => {
      // Primary: Total initiative
      if (b.total !== a.total) return b.total - a.total;

      // Tiebreaker 1: Higher VEL
      const combatantA = combatants.get(a.combatantId);
      const combatantB = combatants.get(b.combatantId);
      if (combatantA && combatantB) {
        if (combatantB.attributes.VEL !== combatantA.attributes.VEL) {
          return combatantB.attributes.VEL - combatantA.attributes.VEL;
        }
        // Tiebreaker 2: Higher PRC
        if (combatantB.attributes.PRC !== combatantA.attributes.PRC) {
          return combatantB.attributes.PRC - combatantA.attributes.PRC;
        }
      }

      // Tiebreaker 3: Maintain order (simultaneous)
      return 0;
    })
    .map((r) => r.combatantId);
}

// =============================================================================
// DEFENSE CALCULATION
// =============================================================================

/**
 * Calculate a combatant's defense value.
 * Defense = 10 + AGI mod + armor bonus + cover bonus + augment bonus - wound penalty
 */
export function calculateDefense(combatant: Combatant): number {
  const agiMod = getAttributeModifier(combatant.attributes.AGI);
  const armorBonus = combatant.armor?.value ?? 0;
  const coverBonus = combatant.cover?.defenseBonus ?? 0;
  const augmentBonus = combatant.augmentBonuses.defense;
  const woundPenalty = getWoundPenalty(combatant.hp, combatant.hpMax);

  // Apply armor AGI penalty
  const armorAgiPenalty = combatant.armor?.agiPenalty ?? 0;
  const effectiveAgi = Math.max(agiMod - armorAgiPenalty, -5);

  return 10 + effectiveAgi + armorBonus + coverBonus + augmentBonus - woundPenalty;
}

// =============================================================================
// ATTACK RESOLUTION
// =============================================================================

/**
 * Calculate range penalty for ranged attacks.
 */
export function getRangePenalty(distance: number, weapon: Weapon): number {
  if (!weapon.ranges) return 0;

  if (distance <= 2) return -2; // Point blank = +2 bonus (return as negative penalty)
  if (distance <= weapon.ranges.short) return 0;
  if (distance <= weapon.ranges.medium) return 2;
  if (distance <= weapon.ranges.long) return 4;
  return 6; // Extreme range
}

/**
 * Perform an attack roll.
 */
export function performAttack(
  attacker: Combatant,
  defender: Combatant,
  distance: number = 0
): AttackResult {
  const weapon = attacker.weapon;
  if (!weapon) {
    // Unarmed attack
    return performMeleeAttack(attacker, defender, {
      id: 'unarmed',
      name: 'Unarmed',
      type: 'MELEE',
      subtype: 'UNARMED',
      baseDamage: '1d6-1',
      scalingAttribute: 'PWR',
      scalingDivisor: 2,
      attackMod: 0,
    });
  }

  if (weapon.type === 'MELEE') {
    return performMeleeAttack(attacker, defender, weapon);
  } else {
    return performRangedAttack(attacker, defender, weapon, distance);
  }
}

/**
 * Perform a melee attack.
 * Roll: 2d6 + PWR mod + Melee skill + weapon mod
 * TN: Target's Defense
 */
function performMeleeAttack(
  attacker: Combatant,
  defender: Combatant,
  weapon: Weapon
): AttackResult {
  const targetDefense = calculateDefense(defender);
  const woundPenalty = getWoundPenalty(attacker.hp, attacker.hpMax);

  const modifiers = [
    { name: 'Weapon', value: weapon.attackMod },
    { name: 'Augment', value: attacker.augmentBonuses.attack },
    { name: 'Wounds', value: -woundPenalty },
  ];

  const roll = performSkillCheck(
    attacker.attributes.PWR,
    attacker.skills.melee,
    modifiers,
    targetDefense
  );

  const hit = roll.success;
  let damage: DamageResult | undefined;
  let narrative: string;

  if (hit) {
    damage = calculateDamage(attacker, defender, weapon, roll.margin);
    narrative = `${attacker.name} strikes ${defender.name} for ${damage.finalDamage} damage!`;
    if (roll.critical === 'AUTO_SUCCESS') {
      narrative = `CRITICAL! ${narrative}`;
    }
  } else {
    narrative = `${attacker.name}'s attack misses ${defender.name}.`;
    if (roll.critical === 'AUTO_FAIL') {
      narrative = `FUMBLE! ${narrative}`;
    }
  }

  return {
    attacker: attacker.id,
    defender: defender.id,
    attackType: 'MELEE',
    roll,
    hit,
    damage,
    narrative,
  };
}

/**
 * Perform a ranged attack.
 * Roll: 2d6 + VEL mod + Firearms skill + weapon accuracy
 * TN: Target's Defense + Range penalty
 */
function performRangedAttack(
  attacker: Combatant,
  defender: Combatant,
  weapon: Weapon,
  distance: number
): AttackResult {
  const baseDefense = calculateDefense(defender);
  const rangePenalty = getRangePenalty(distance, weapon);
  const targetDefense = baseDefense + rangePenalty;
  const woundPenalty = getWoundPenalty(attacker.hp, attacker.hpMax);

  const modifiers = [
    { name: 'Weapon', value: weapon.attackMod },
    { name: 'Augment', value: attacker.augmentBonuses.attack },
    { name: 'Wounds', value: -woundPenalty },
  ];

  const roll = performSkillCheck(
    attacker.attributes.VEL,
    attacker.skills.firearms,
    modifiers,
    targetDefense
  );

  const hit = roll.success;
  let damage: DamageResult | undefined;
  let narrative: string;

  if (hit) {
    damage = calculateDamage(attacker, defender, weapon, roll.margin);
    narrative = `${attacker.name} shoots ${defender.name} for ${damage.finalDamage} damage!`;
    if (roll.critical === 'AUTO_SUCCESS') {
      narrative = `CRITICAL HIT! ${narrative}`;
    }
  } else {
    narrative = `${attacker.name}'s shot misses ${defender.name}.`;
    if (roll.critical === 'AUTO_FAIL') {
      narrative = `JAM! ${narrative}`;
    }
  }

  return {
    attacker: attacker.id,
    defender: defender.id,
    attackType: 'RANGED',
    roll,
    hit,
    damage,
    narrative,
  };
}

// =============================================================================
// DAMAGE CALCULATION
// =============================================================================

/**
 * Calculate margin bonus damage.
 */
function getMarginBonus(margin: number): number {
  if (margin <= 0) return 0;
  if (margin <= 2) return 1;
  if (margin <= 4) return 2;
  if (margin <= 6) return 3;
  return 4; // 7+
}

/**
 * Calculate damage from a successful attack.
 * Damage = Weapon Base + Margin Bonus + Attribute Scaling - Armor
 */
export function calculateDamage(
  attacker: Combatant,
  defender: Combatant,
  weapon: Weapon,
  margin: number
): DamageResult {
  const breakdown: string[] = [];

  // Roll weapon base damage
  const weaponRoll = rollExpression(weapon.baseDamage);
  breakdown.push(`Weapon: ${weaponRoll.dice.join('+')}${weaponRoll.bonus >= 0 ? '+' : ''}${weaponRoll.bonus} = ${weaponRoll.total}`);

  // Margin bonus (capped at +4)
  const marginBonus = getMarginBonus(margin);
  if (marginBonus > 0) {
    breakdown.push(`Margin (+${margin}): +${marginBonus}`);
  }

  // Attribute scaling
  const scalingAttr = attacker.attributes[weapon.scalingAttribute];
  const attributeScaling = Math.floor(getAttributeModifier(scalingAttr) / weapon.scalingDivisor);
  if (attributeScaling !== 0) {
    breakdown.push(`${weapon.scalingAttribute} scaling: ${attributeScaling >= 0 ? '+' : ''}${attributeScaling}`);
  }

  // Augment damage bonus
  const augmentDamage = attacker.augmentBonuses.damage;
  if (augmentDamage > 0) {
    breakdown.push(`Augment: +${augmentDamage}`);
  }

  // Calculate raw damage
  const rawDamage = weaponRoll.total + marginBonus + attributeScaling + augmentDamage;
  breakdown.push(`Raw total: ${rawDamage}`);

  // Armor reduction
  const armorValue = defender.armor?.value ?? 0;
  if (armorValue > 0) {
    breakdown.push(`Armor: -${armorValue}`);
  }

  // Final damage (minimum 1 unless completely blocked)
  let finalDamage = rawDamage - armorValue;
  if (finalDamage < 0) finalDamage = 0;
  if (finalDamage === 0 && rawDamage > 0) finalDamage = 1; // Minimum 1 if any damage dealt
  breakdown.push(`Final: ${finalDamage}`);

  return {
    weaponDamage: weaponRoll.total,
    marginBonus,
    attributeScaling,
    rawDamage,
    armorReduction: armorValue,
    finalDamage,
    breakdown,
  };
}

// =============================================================================
// HEALTH & WOUNDS
// =============================================================================

/**
 * Calculate max HP.
 * Max HP = (END × 5) + (PWR × 2) + (Tier × 3)
 */
export function calculateMaxHP(end: number, pwr: number, tier: number): number {
  return (end * 5) + (pwr * 2) + (tier * 3);
}

/**
 * Get wound status based on current HP.
 */
export function getWoundStatus(currentHP: number, maxHP: number): WoundStatus {
  if (currentHP <= -10) return 'DEAD';
  if (currentHP <= 0) return 'DOWN';

  const percent = (currentHP / maxHP) * 100;
  if (percent >= 76) return 'HEALTHY';
  if (percent >= 51) return 'WOUNDED';
  if (percent >= 26) return 'BADLY_WOUNDED';
  return 'CRITICAL';
}

/**
 * Get wound penalty for rolls.
 */
export function getWoundPenalty(currentHP: number, maxHP: number): number {
  const status = getWoundStatus(currentHP, maxHP);
  switch (status) {
    case 'HEALTHY': return 0;
    case 'WOUNDED': return 1;
    case 'BADLY_WOUNDED': return 2;
    case 'CRITICAL': return 3;
    case 'DOWN':
    case 'DEAD':
      return 999; // Cannot act
  }
}

/**
 * Apply damage to a combatant.
 */
export function applyDamage(combatant: Combatant, damage: number): Combatant {
  return {
    ...combatant,
    hp: combatant.hp - damage,
  };
}

/**
 * Calculate HP healed from rest.
 */
export function calculateRestHealing(
  restType: 'SHORT' | 'LONG',
  endurance: number
): { dice: string; expected: number } {
  const endMod = getAttributeModifier(endurance);

  if (restType === 'SHORT') {
    return {
      dice: `1d6+${endMod}`,
      expected: 3.5 + endMod,
    };
  } else {
    return {
      dice: `2d6+${endMod * 2}`,
      expected: 7 + (endMod * 2),
    };
  }
}

// =============================================================================
// SPECIAL ACTIONS
// =============================================================================

/** Special combat action modifiers */
export const SPECIAL_ACTIONS = {
  AIM: { attackBonus: 2, defenseBonus: 0, cost: 'STANDARD' },
  ALL_OUT_ATTACK: { attackBonus: 2, defenseBonus: -2, cost: 'STANDARD' },
  DEFENSIVE_STANCE: { attackBonus: -999, defenseBonus: 2, cost: 'STANDARD' },
  DISENGAGE: { attackBonus: 0, defenseBonus: 0, cost: 'MOVE_AND_STANDARD' },
  OVERWATCH: { attackBonus: 0, defenseBonus: 0, cost: 'STANDARD_HELD' },
  SUPPRESSIVE_FIRE: { attackBonus: 0, defenseBonus: 0, cost: 'STANDARD_PLUS_AMMO' },
} as const;
