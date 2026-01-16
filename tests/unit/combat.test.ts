/**
 * Unit tests for combat system.
 *
 * Run with: npm run test:unit
 */

import { describe, it, expect } from 'vitest';
import {
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
  COVER_TYPES,
  type Combatant,
  type Weapon,
  type Armor,
} from '../../src/game/mechanics/combat';
import { getAttributeModifier } from '../../src/game/mechanics/dice';

// Test fixtures
function createTestCombatant(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: 'test-combatant',
    name: 'Test Fighter',
    attributes: {
      PWR: 10,
      AGI: 10,
      END: 10,
      VEL: 10,
      PRC: 10,
    },
    skills: {
      melee: 0,
      firearms: 0,
    },
    hp: 100,
    hpMax: 100,
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
  };
}

function createTestWeapon(overrides: Partial<Weapon> = {}): Weapon {
  return {
    id: 'test-weapon',
    name: 'Test Pistol',
    type: 'RANGED',
    subtype: 'LIGHT_PISTOL',
    baseDamage: '1d6+1',
    scalingAttribute: 'VEL',
    scalingDivisor: 3,
    attackMod: 0,
    ranges: {
      short: 10,
      medium: 25,
      long: 50,
    },
    ...overrides,
  };
}

function createTestArmor(overrides: Partial<Armor> = {}): Armor {
  return {
    id: 'test-armor',
    name: 'Test Armor',
    value: 4,
    agiPenalty: 0,
    velPenalty: 0,
    ...overrides,
  };
}

describe('Initiative', () => {
  describe('rollInitiative', () => {
    it('should include VEL and PRC modifiers', () => {
      const combatant = createTestCombatant({
        attributes: { PWR: 10, AGI: 10, END: 10, VEL: 14, PRC: 12 },
      });

      const result = rollInitiative(combatant);

      expect(result.velMod).toBe(getAttributeModifier(14)); // +2
      expect(result.prcMod).toBe(getAttributeModifier(12)); // +1
    });

    it('should include augment bonuses', () => {
      const combatant = createTestCombatant({
        augmentBonuses: { initiative: 3, attack: 0, defense: 0, damage: 0 },
      });

      const result = rollInitiative(combatant);

      expect(result.augmentBonus).toBe(3);
    });

    it('should calculate total correctly', () => {
      const combatant = createTestCombatant({
        attributes: { PWR: 10, AGI: 10, END: 10, VEL: 14, PRC: 12 },
        augmentBonuses: { initiative: 2, attack: 0, defense: 0, damage: 0 },
      });

      const result = rollInitiative(combatant);

      const expectedTotal = result.roll.total + result.velMod + result.prcMod + result.augmentBonus;
      expect(result.total).toBe(expectedTotal);
    });
  });

  describe('sortByInitiative', () => {
    it('should sort by total descending', () => {
      const combatants = new Map<string, Combatant>([
        ['a', createTestCombatant({ id: 'a', attributes: { PWR: 10, AGI: 10, END: 10, VEL: 10, PRC: 10 } })],
        ['b', createTestCombatant({ id: 'b', attributes: { PWR: 10, AGI: 10, END: 10, VEL: 14, PRC: 14 } })],
      ]);

      const results = [
        { combatantId: 'a', roll: { dice: [3, 3], total: 6, isSnakeEyes: false, isBoxcars: false }, velMod: 0, prcMod: 0, augmentBonus: 0, total: 6 },
        { combatantId: 'b', roll: { dice: [4, 4], total: 8, isSnakeEyes: false, isBoxcars: false }, velMod: 2, prcMod: 2, augmentBonus: 0, total: 12 },
      ];

      const order = sortByInitiative(results, combatants);

      expect(order[0]).toBe('b');
      expect(order[1]).toBe('a');
    });

    it('should break ties by VEL, then PRC', () => {
      const combatants = new Map<string, Combatant>([
        ['a', createTestCombatant({ id: 'a', attributes: { PWR: 10, AGI: 10, END: 10, VEL: 12, PRC: 10 } })],
        ['b', createTestCombatant({ id: 'b', attributes: { PWR: 10, AGI: 10, END: 10, VEL: 14, PRC: 10 } })],
      ]);

      // Same total
      const results = [
        { combatantId: 'a', roll: { dice: [5, 5], total: 10, isSnakeEyes: false, isBoxcars: false }, velMod: 1, prcMod: 0, augmentBonus: 0, total: 11 },
        { combatantId: 'b', roll: { dice: [4, 4], total: 8, isSnakeEyes: false, isBoxcars: false }, velMod: 2, prcMod: 1, augmentBonus: 0, total: 11 },
      ];

      const order = sortByInitiative(results, combatants);

      // b has higher VEL, so should go first
      expect(order[0]).toBe('b');
    });
  });
});

describe('Defense Calculation', () => {
  describe('calculateDefense', () => {
    it('should start with base 10', () => {
      const combatant = createTestCombatant();
      const defense = calculateDefense(combatant);
      expect(defense).toBe(10); // Base 10 + 0 AGI mod
    });

    it('should add AGI modifier', () => {
      const combatant = createTestCombatant({
        attributes: { PWR: 10, AGI: 14, END: 10, VEL: 10, PRC: 10 },
      });
      const defense = calculateDefense(combatant);
      expect(defense).toBe(12); // 10 + 2 AGI mod
    });

    it('should add armor value', () => {
      const combatant = createTestCombatant({
        armor: createTestArmor({ value: 4, agiPenalty: 0 }),
      });
      const defense = calculateDefense(combatant);
      expect(defense).toBe(14); // 10 + 0 + 4
    });

    it('should subtract armor AGI penalty', () => {
      const combatant = createTestCombatant({
        attributes: { PWR: 10, AGI: 14, END: 10, VEL: 10, PRC: 10 },
        armor: createTestArmor({ value: 6, agiPenalty: 2 }),
      });
      const defense = calculateDefense(combatant);
      // 10 + (2 AGI - 2 penalty) + 6 armor = 16
      expect(defense).toBe(16);
    });

    it('should add cover bonus', () => {
      const combatant = createTestCombatant({
        cover: COVER_TYPES.MEDIUM,
      });
      const defense = calculateDefense(combatant);
      expect(defense).toBe(14); // 10 + 0 + 4 cover
    });

    it('should add augment defense bonus', () => {
      const combatant = createTestCombatant({
        augmentBonuses: { initiative: 0, attack: 0, defense: 3, damage: 0 },
      });
      const defense = calculateDefense(combatant);
      expect(defense).toBe(13); // 10 + 3
    });

    it('should subtract wound penalty', () => {
      const combatant = createTestCombatant({
        hp: 40,
        hpMax: 100,
      });
      const defense = calculateDefense(combatant);
      // At 40% HP = BADLY_WOUNDED = -2 penalty
      expect(defense).toBe(8); // 10 - 2
    });
  });
});

describe('Range System', () => {
  describe('getRangePenalty', () => {
    const weapon = createTestWeapon({
      ranges: { short: 10, medium: 25, long: 50 },
    });

    it('should give +2 bonus at point blank (≤2m)', () => {
      expect(getRangePenalty(1, weapon)).toBe(-2); // Negative = bonus
      expect(getRangePenalty(2, weapon)).toBe(-2);
    });

    it('should have no penalty at short range', () => {
      expect(getRangePenalty(5, weapon)).toBe(0);
      expect(getRangePenalty(10, weapon)).toBe(0);
    });

    it('should have -2 penalty at medium range', () => {
      expect(getRangePenalty(15, weapon)).toBe(2);
      expect(getRangePenalty(25, weapon)).toBe(2);
    });

    it('should have -4 penalty at long range', () => {
      expect(getRangePenalty(35, weapon)).toBe(4);
      expect(getRangePenalty(50, weapon)).toBe(4);
    });

    it('should have -6 penalty at extreme range', () => {
      expect(getRangePenalty(60, weapon)).toBe(6);
    });
  });
});

describe('Attack Resolution', () => {
  describe('performAttack', () => {
    it('should perform unarmed attack when no weapon equipped', () => {
      const attacker = createTestCombatant({ id: 'attacker' });
      const defender = createTestCombatant({ id: 'defender' });

      const result = performAttack(attacker, defender);

      expect(result.attackType).toBe('MELEE');
      expect(result.attacker).toBe('attacker');
      expect(result.defender).toBe('defender');
    });

    it('should perform melee attack with melee weapon', () => {
      const meleeWeapon = createTestWeapon({
        type: 'MELEE',
        subtype: 'LIGHT_MELEE',
        baseDamage: '1d6',
        scalingAttribute: 'PWR',
      });
      const attacker = createTestCombatant({ weapon: meleeWeapon });
      const defender = createTestCombatant();

      const result = performAttack(attacker, defender);

      expect(result.attackType).toBe('MELEE');
    });

    it('should perform ranged attack with ranged weapon', () => {
      const rangedWeapon = createTestWeapon({
        type: 'RANGED',
        subtype: 'LIGHT_PISTOL',
      });
      const attacker = createTestCombatant({ weapon: rangedWeapon });
      const defender = createTestCombatant();

      const result = performAttack(attacker, defender, 5);

      expect(result.attackType).toBe('RANGED');
    });

    it('should include damage result on hit', () => {
      const weapon = createTestWeapon({ attackMod: 10 }); // High accuracy for reliable hit
      const attacker = createTestCombatant({
        weapon,
        skills: { melee: 0, firearms: 5 },
        attributes: { PWR: 10, AGI: 10, END: 10, VEL: 14, PRC: 10 },
      });
      const defender = createTestCombatant();

      // Run multiple times to get a hit
      for (let i = 0; i < 20; i++) {
        const result = performAttack(attacker, defender, 5);
        if (result.hit) {
          expect(result.damage).toBeDefined();
          expect(result.damage!.finalDamage).toBeGreaterThanOrEqual(0);
          break;
        }
      }
    });
  });
});

describe('Damage Calculation', () => {
  describe('calculateDamage', () => {
    it('should roll weapon base damage', () => {
      const weapon = createTestWeapon({ baseDamage: '2d6+2' });
      const attacker = createTestCombatant({ weapon });
      const defender = createTestCombatant();

      const result = calculateDamage(attacker, defender, weapon, 0);

      expect(result.weaponDamage).toBeGreaterThanOrEqual(4); // 2+2+2
      expect(result.weaponDamage).toBeLessThanOrEqual(14); // 6+6+2
    });

    it('should apply margin bonus', () => {
      const weapon = createTestWeapon({ baseDamage: '1d6' });
      const attacker = createTestCombatant({ weapon });
      const defender = createTestCombatant();

      // Margin +1-2 = +1 bonus
      const result1 = calculateDamage(attacker, defender, weapon, 2);
      expect(result1.marginBonus).toBe(1);

      // Margin +3-4 = +2 bonus
      const result2 = calculateDamage(attacker, defender, weapon, 4);
      expect(result2.marginBonus).toBe(2);

      // Margin +5-6 = +3 bonus
      const result3 = calculateDamage(attacker, defender, weapon, 5);
      expect(result3.marginBonus).toBe(3);

      // Margin +7+ = +4 bonus
      const result4 = calculateDamage(attacker, defender, weapon, 10);
      expect(result4.marginBonus).toBe(4);
    });

    it('should apply armor reduction', () => {
      const weapon = createTestWeapon({ baseDamage: '2d6' });
      const attacker = createTestCombatant({ weapon });
      const defender = createTestCombatant({
        armor: createTestArmor({ value: 4 }),
      });

      const result = calculateDamage(attacker, defender, weapon, 0);

      expect(result.armorReduction).toBe(4);
      expect(result.finalDamage).toBe(Math.max(0, result.rawDamage - 4));
    });

    it('should ensure minimum 1 damage if any damage dealt', () => {
      const weapon = createTestWeapon({ baseDamage: '1d6' });
      const attacker = createTestCombatant({ weapon });
      const defender = createTestCombatant({
        armor: createTestArmor({ value: 20 }), // Very high armor
      });

      // Run multiple times
      for (let i = 0; i < 10; i++) {
        const result = calculateDamage(attacker, defender, weapon, 0);
        if (result.rawDamage > 0) {
          expect(result.finalDamage).toBeGreaterThanOrEqual(1);
        }
      }
    });
  });
});

describe('Health & Wounds', () => {
  describe('calculateMaxHP', () => {
    it('should calculate HP correctly per formula', () => {
      // Max HP = (END × 5) + (PWR × 2) + (Tier × 3)
      expect(calculateMaxHP(10, 10, 1)).toBe(50 + 20 + 3); // 73
      expect(calculateMaxHP(14, 12, 1)).toBe(70 + 24 + 3); // 97
      expect(calculateMaxHP(10, 10, 5)).toBe(50 + 20 + 15); // 85
    });
  });

  describe('getWoundStatus', () => {
    it('should return HEALTHY at 76-100%', () => {
      expect(getWoundStatus(100, 100)).toBe('HEALTHY');
      expect(getWoundStatus(76, 100)).toBe('HEALTHY');
    });

    it('should return WOUNDED at 51-75%', () => {
      expect(getWoundStatus(75, 100)).toBe('WOUNDED');
      expect(getWoundStatus(51, 100)).toBe('WOUNDED');
    });

    it('should return BADLY_WOUNDED at 26-50%', () => {
      expect(getWoundStatus(50, 100)).toBe('BADLY_WOUNDED');
      expect(getWoundStatus(26, 100)).toBe('BADLY_WOUNDED');
    });

    it('should return CRITICAL at 1-25%', () => {
      expect(getWoundStatus(25, 100)).toBe('CRITICAL');
      expect(getWoundStatus(1, 100)).toBe('CRITICAL');
    });

    it('should return DOWN at 0', () => {
      expect(getWoundStatus(0, 100)).toBe('DOWN');
    });

    it('should return DEAD at -10 or below', () => {
      expect(getWoundStatus(-10, 100)).toBe('DEAD');
      expect(getWoundStatus(-15, 100)).toBe('DEAD');
    });
  });

  describe('getWoundPenalty', () => {
    it('should return correct penalties', () => {
      expect(getWoundPenalty(100, 100)).toBe(0); // HEALTHY
      expect(getWoundPenalty(60, 100)).toBe(1); // WOUNDED
      expect(getWoundPenalty(40, 100)).toBe(2); // BADLY_WOUNDED
      expect(getWoundPenalty(20, 100)).toBe(3); // CRITICAL
    });
  });

  describe('applyDamage', () => {
    it('should reduce HP by damage amount', () => {
      const combatant = createTestCombatant({ hp: 100, hpMax: 100 });
      const damaged = applyDamage(combatant, 30);
      expect(damaged.hp).toBe(70);
    });

    it('should allow negative HP', () => {
      const combatant = createTestCombatant({ hp: 10, hpMax: 100 });
      const damaged = applyDamage(combatant, 25);
      expect(damaged.hp).toBe(-15);
    });
  });

  describe('calculateRestHealing', () => {
    it('should return correct dice for short rest', () => {
      const result = calculateRestHealing('SHORT', 10);
      expect(result.dice).toBe('1d6+0');
    });

    it('should return correct dice for long rest', () => {
      const result = calculateRestHealing('LONG', 10);
      expect(result.dice).toBe('2d6+0');
    });

    it('should include END modifier', () => {
      const result = calculateRestHealing('SHORT', 14); // +2 mod
      expect(result.dice).toBe('1d6+2');
    });
  });
});

describe('Cover System', () => {
  it('should have correct defense bonuses', () => {
    expect(COVER_TYPES.NONE.defenseBonus).toBe(0);
    expect(COVER_TYPES.LIGHT.defenseBonus).toBe(2);
    expect(COVER_TYPES.MEDIUM.defenseBonus).toBe(4);
    expect(COVER_TYPES.HEAVY.defenseBonus).toBe(6);
    expect(COVER_TYPES.FULL.defenseBonus).toBe(999); // Cannot be targeted
  });

  it('should have HP values for destructible cover', () => {
    expect(COVER_TYPES.LIGHT.hp).toBe(10);
    expect(COVER_TYPES.MEDIUM.hp).toBe(25);
    expect(COVER_TYPES.HEAVY.hp).toBe(50);
  });
});
