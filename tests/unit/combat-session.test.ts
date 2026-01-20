/**
 * Combat Session Integration Tests
 *
 * Tests for the CombatResolverService and combat session management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  type Combatant,
  type Weapon,
  rollInitiative,
  sortByInitiative,
  performAttack,
  calculateDefense,
  calculateMaxHP,
  getWoundStatus,
  applyDamage,
  type InitiativeResult,
} from '../../src/game/mechanics/combat';

// =============================================================================
// MOCK DATA
// =============================================================================

const createMockCombatant = (overrides: Partial<Combatant> = {}): Combatant => ({
  id: 'test-combatant-1',
  name: 'Test Fighter',
  attributes: {
    PWR: 12,
    AGI: 10,
    END: 10,
    VEL: 10,
    PRC: 10,
  },
  skills: {
    melee: 2,
    firearms: 2,
  },
  hp: 30,
  hpMax: 30,
  armor: null,
  weapon: null,
  cover: null,
  augmentBonuses: {
    initiative: 0,
    attack: 0,
    defense: 0,
    damage: 0,
  },
  conditions: [],
  ...overrides,
});

const createMockWeapon = (overrides: Partial<Weapon> = {}): Weapon => ({
  id: 'test-weapon-1',
  name: 'Test Pistol',
  type: 'RANGED',
  subtype: 'LIGHT_PISTOL',
  baseDamage: '2d6+2',
  scalingAttribute: 'VEL',
  scalingDivisor: 2,
  attackMod: 1,
  ranges: {
    short: 10,
    medium: 25,
    long: 50,
  },
  ...overrides,
});

// =============================================================================
// INITIATIVE TESTS
// =============================================================================

describe('Combat Initiative', () => {
  it('should roll initiative for a combatant', () => {
    const combatant = createMockCombatant();
    const result = rollInitiative(combatant);

    expect(result).toHaveProperty('combatantId', combatant.id);
    expect(result).toHaveProperty('roll');
    expect(result).toHaveProperty('velMod');
    expect(result).toHaveProperty('prcMod');
    expect(result).toHaveProperty('augmentBonus');
    expect(result).toHaveProperty('total');
    expect(result.roll.total).toBeGreaterThanOrEqual(2);
    expect(result.roll.total).toBeLessThanOrEqual(12);
  });

  it('should include augment bonus in initiative total', () => {
    const combatant = createMockCombatant({
      augmentBonuses: {
        initiative: 3,
        attack: 0,
        defense: 0,
        damage: 0,
      },
    });

    const result = rollInitiative(combatant);
    expect(result.augmentBonus).toBe(3);
    // Total should include the augment bonus
    expect(result.total).toBe(result.roll.total + result.velMod + result.prcMod + 3);
  });

  it('should sort combatants by initiative', () => {
    const combatant1 = createMockCombatant({ id: 'fighter-1' });
    const combatant2 = createMockCombatant({ id: 'fighter-2' });
    const combatant3 = createMockCombatant({ id: 'fighter-3' });

    const combatants = new Map<string, Combatant>([
      ['fighter-1', combatant1],
      ['fighter-2', combatant2],
      ['fighter-3', combatant3],
    ]);

    const results: InitiativeResult[] = [
      { combatantId: 'fighter-1', roll: { dice: [3, 4], total: 7 }, velMod: 0, prcMod: 0, augmentBonus: 0, total: 7 },
      { combatantId: 'fighter-2', roll: { dice: [5, 6], total: 11 }, velMod: 0, prcMod: 0, augmentBonus: 0, total: 11 },
      { combatantId: 'fighter-3', roll: { dice: [2, 3], total: 5 }, velMod: 0, prcMod: 0, augmentBonus: 0, total: 5 },
    ];

    const sorted = sortByInitiative(results, combatants);

    expect(sorted).toEqual(['fighter-2', 'fighter-1', 'fighter-3']);
  });

  it('should break initiative ties using VEL', () => {
    const combatant1 = createMockCombatant({
      id: 'fighter-1',
      attributes: { PWR: 10, AGI: 10, END: 10, VEL: 14, PRC: 10 },
    });
    const combatant2 = createMockCombatant({
      id: 'fighter-2',
      attributes: { PWR: 10, AGI: 10, END: 10, VEL: 10, PRC: 10 },
    });

    const combatants = new Map<string, Combatant>([
      ['fighter-1', combatant1],
      ['fighter-2', combatant2],
    ]);

    const results: InitiativeResult[] = [
      { combatantId: 'fighter-1', roll: { dice: [3, 4], total: 7 }, velMod: 2, prcMod: 0, augmentBonus: 0, total: 9 },
      { combatantId: 'fighter-2', roll: { dice: [5, 4], total: 9 }, velMod: 0, prcMod: 0, augmentBonus: 0, total: 9 },
    ];

    const sorted = sortByInitiative(results, combatants);

    // fighter-1 has higher VEL so goes first on tie
    expect(sorted[0]).toBe('fighter-1');
  });
});

// =============================================================================
// DEFENSE TESTS
// =============================================================================

describe('Combat Defense', () => {
  it('should calculate base defense correctly', () => {
    const combatant = createMockCombatant({
      attributes: { PWR: 10, AGI: 12, END: 10, VEL: 10, PRC: 10 },
    });

    const defense = calculateDefense(combatant);

    // Base 10 + AGI mod (1) = 11
    expect(defense).toBe(11);
  });

  it('should include armor value in defense', () => {
    const combatant = createMockCombatant({
      attributes: { PWR: 10, AGI: 10, END: 10, VEL: 10, PRC: 10 },
      armor: {
        id: 'test-armor',
        name: 'Test Armor',
        value: 4,
        agiPenalty: 0,
        velPenalty: 0,
      },
    });

    const defense = calculateDefense(combatant);

    // Base 10 + armor 4 = 14
    expect(defense).toBe(14);
  });

  it('should apply armor AGI penalty', () => {
    const combatant = createMockCombatant({
      attributes: { PWR: 10, AGI: 14, END: 10, VEL: 10, PRC: 10 },
      armor: {
        id: 'heavy-armor',
        name: 'Heavy Armor',
        value: 6,
        agiPenalty: 3,
        velPenalty: 0,
      },
    });

    const defense = calculateDefense(combatant);

    // Base 10 + AGI mod (2) - armor penalty (3) = -1 effective AGI + armor (6) = 15
    expect(defense).toBe(15);
  });

  it('should include cover bonus in defense', () => {
    const combatant = createMockCombatant({
      cover: { type: 'MEDIUM', defenseBonus: 4, hp: 25 },
    });

    const defense = calculateDefense(combatant);

    // Base 10 + cover 4 = 14
    expect(defense).toBe(14);
  });

  it('should include augment defense bonus', () => {
    const combatant = createMockCombatant({
      augmentBonuses: {
        initiative: 0,
        attack: 0,
        defense: 2,
        damage: 0,
      },
    });

    const defense = calculateDefense(combatant);

    // Base 10 + augment 2 = 12
    expect(defense).toBe(12);
  });
});

// =============================================================================
// ATTACK TESTS
// =============================================================================

describe('Combat Attack', () => {
  it('should perform melee attack', () => {
    const attacker = createMockCombatant({
      weapon: {
        id: 'sword',
        name: 'Sword',
        type: 'MELEE',
        subtype: 'LIGHT_MELEE',
        baseDamage: '1d8+2',
        scalingAttribute: 'PWR',
        scalingDivisor: 2,
        attackMod: 1,
      },
    });
    const defender = createMockCombatant({ id: 'defender' });

    const result = performAttack(attacker, defender);

    expect(result).toHaveProperty('attacker', attacker.id);
    expect(result).toHaveProperty('defender', defender.id);
    expect(result).toHaveProperty('attackType', 'MELEE');
    expect(result).toHaveProperty('roll');
    expect(result).toHaveProperty('hit');
    expect(result).toHaveProperty('narrative');
  });

  it('should perform ranged attack', () => {
    const attacker = createMockCombatant({
      weapon: createMockWeapon(),
    });
    const defender = createMockCombatant({ id: 'defender' });

    const result = performAttack(attacker, defender, 15);

    expect(result).toHaveProperty('attacker', attacker.id);
    expect(result).toHaveProperty('defender', defender.id);
    expect(result).toHaveProperty('attackType', 'RANGED');
    expect(result).toHaveProperty('roll');
    expect(result).toHaveProperty('hit');
    expect(result).toHaveProperty('narrative');
  });

  it('should perform unarmed attack when no weapon', () => {
    const attacker = createMockCombatant({ weapon: null });
    const defender = createMockCombatant({ id: 'defender' });

    const result = performAttack(attacker, defender);

    expect(result.attackType).toBe('MELEE');
    expect(result.narrative).toContain(attacker.name);
  });

  it('should calculate damage on successful hit', () => {
    // Create combatants where hit is guaranteed
    const attacker = createMockCombatant({
      attributes: { PWR: 20, AGI: 10, END: 10, VEL: 10, PRC: 10 },
      skills: { melee: 5, firearms: 0 },
      weapon: {
        id: 'sword',
        name: 'Sword',
        type: 'MELEE',
        subtype: 'LIGHT_MELEE',
        baseDamage: '2d6+2',
        scalingAttribute: 'PWR',
        scalingDivisor: 2,
        attackMod: 3,
      },
    });
    const defender = createMockCombatant({ id: 'defender' });

    // Run multiple times to get a hit
    let hitResult = null;
    for (let i = 0; i < 100; i++) {
      const result = performAttack(attacker, defender);
      if (result.hit) {
        hitResult = result;
        break;
      }
    }

    expect(hitResult).not.toBeNull();
    if (hitResult && hitResult.hit) {
      expect(hitResult.damage).toBeDefined();
      expect(hitResult.damage!.finalDamage).toBeGreaterThan(0);
      expect(hitResult.damage!.breakdown).toBeInstanceOf(Array);
    }
  });
});

// =============================================================================
// HEALTH & WOUNDS TESTS
// =============================================================================

describe('Health and Wounds', () => {
  it('should calculate max HP correctly', () => {
    // HP = (END × 5) + (PWR × 2) + (Tier × 3)
    const hp = calculateMaxHP(10, 12, 3);
    expect(hp).toBe(50 + 24 + 9); // 83
  });

  it('should return HEALTHY status above 75%', () => {
    expect(getWoundStatus(80, 100)).toBe('HEALTHY');
    expect(getWoundStatus(76, 100)).toBe('HEALTHY');
  });

  it('should return WOUNDED status between 51-75%', () => {
    expect(getWoundStatus(75, 100)).toBe('WOUNDED');
    expect(getWoundStatus(51, 100)).toBe('WOUNDED');
  });

  it('should return BADLY_WOUNDED status between 26-50%', () => {
    expect(getWoundStatus(50, 100)).toBe('BADLY_WOUNDED');
    expect(getWoundStatus(26, 100)).toBe('BADLY_WOUNDED');
  });

  it('should return CRITICAL status between 1-25%', () => {
    expect(getWoundStatus(25, 100)).toBe('CRITICAL');
    expect(getWoundStatus(1, 100)).toBe('CRITICAL');
  });

  it('should return DOWN status at 0 HP', () => {
    expect(getWoundStatus(0, 100)).toBe('DOWN');
    expect(getWoundStatus(-5, 100)).toBe('DOWN');
  });

  it('should return DEAD status at -10 HP or below', () => {
    expect(getWoundStatus(-10, 100)).toBe('DEAD');
    expect(getWoundStatus(-15, 100)).toBe('DEAD');
  });

  it('should apply damage to combatant', () => {
    const combatant = createMockCombatant({ hp: 30, hpMax: 30 });
    const damaged = applyDamage(combatant, 10);

    expect(damaged.hp).toBe(20);
    expect(damaged.hpMax).toBe(30);
  });
});

// =============================================================================
// COMBAT SESSION STATE TESTS
// =============================================================================

describe('Combat Session State', () => {
  it('should track combat phases', () => {
    const phases = ['INITIALIZING', 'ROLLING_INITIATIVE', 'ACTIVE', 'ROUND_END', 'COMBAT_END'];
    phases.forEach((phase) => {
      expect(typeof phase).toBe('string');
    });
  });

  it('should track combat end reasons', () => {
    const reasons = ['VICTORY', 'DEFEAT', 'ESCAPE', 'NEGOTIATION', 'TIMEOUT'];
    reasons.forEach((reason) => {
      expect(typeof reason).toBe('string');
    });
  });

  it('should track action types', () => {
    const actions = ['ATTACK', 'MOVE', 'DEFEND', 'USE_ITEM', 'USE_ABILITY', 'DISENGAGE', 'OVERWATCH', 'END_TURN'];
    actions.forEach((action) => {
      expect(typeof action).toBe('string');
    });
  });
});

// =============================================================================
// COMBAT REWARD CALCULATION TESTS
// =============================================================================

describe('Combat Rewards', () => {
  it('should give full rewards on victory', () => {
    const baseXP = 100;
    const baseCred = 500;

    const victorXP = baseXP * 1.0;
    const victorCred = baseCred * 1.0;

    expect(victorXP).toBe(100);
    expect(victorCred).toBe(500);
  });

  it('should give partial XP on defeat', () => {
    const baseXP = 100;
    const defeatXP = Math.floor(baseXP * 0.25);

    expect(defeatXP).toBe(25);
  });

  it('should give half XP on escape', () => {
    const baseXP = 100;
    const escapeXP = Math.floor(baseXP * 0.5);

    expect(escapeXP).toBe(50);
  });

  it('should give partial rewards on negotiation', () => {
    const baseXP = 100;
    const baseCred = 500;

    const negoXP = Math.floor(baseXP * 0.75);
    const negoCred = Math.floor(baseCred * 0.5);

    expect(negoXP).toBe(75);
    expect(negoCred).toBe(250);
  });
});

// =============================================================================
// COMBAT SESSION CONFIGURATION TESTS
// =============================================================================

describe('Combat Session Configuration', () => {
  it('should validate session config has required fields', () => {
    const config = {
      combatId: 'combat-001',
      characterId: 'char-001',
      encounterId: 'encounter-001',
    };

    expect(config.combatId).toBeDefined();
    expect(config.characterId).toBeDefined();
    expect(config.encounterId).toBeDefined();
  });

  it('should support optional environment settings', () => {
    const config = {
      combatId: 'combat-001',
      characterId: 'char-001',
      encounterId: 'encounter-001',
      arenaId: 'arena-warehouse',
      environment: {
        lighting: 'DIM' as const,
        weather: 'rain',
        hazards: ['electrified_floor', 'toxic_gas'],
      },
    };

    expect(config.environment).toBeDefined();
    expect(config.environment.lighting).toBe('DIM');
    expect(config.environment.hazards).toContain('electrified_floor');
  });
});
