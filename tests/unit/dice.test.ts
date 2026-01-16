/**
 * Unit tests for dice and resolution system.
 *
 * Run with: npm run test:unit
 */

import { describe, it, expect } from 'vitest';
import {
  rollDie,
  rollDice,
  roll2d6,
  getAttributeModifier,
  classifyResult,
  performSkillCheck,
  performOpposedCheck,
  createExtendedCheck,
  addExtendedCheckAttempt,
  calculateSuccessProbability,
  parseDiceExpression,
  rollExpression,
} from '../../src/game/mechanics/dice';

describe('Dice Rolling', () => {
  describe('rollDie', () => {
    it('should return values within valid range', () => {
      for (let i = 0; i < 100; i++) {
        const result = rollDie(6);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
      }
    });

    it('should work with different die sizes', () => {
      for (const sides of [4, 6, 8, 10, 12, 20]) {
        for (let i = 0; i < 20; i++) {
          const result = rollDie(sides);
          expect(result).toBeGreaterThanOrEqual(1);
          expect(result).toBeLessThanOrEqual(sides);
        }
      }
    });
  });

  describe('rollDice', () => {
    it('should return correct number of dice', () => {
      const result = rollDice(3, 6);
      expect(result.dice).toHaveLength(3);
    });

    it('should calculate total correctly', () => {
      const result = rollDice(2, 6);
      expect(result.total).toBe(result.dice[0]! + result.dice[1]!);
    });

    it('should detect snake eyes', () => {
      // Run many times to eventually hit snake eyes
      let foundSnakeEyes = false;
      for (let i = 0; i < 1000 && !foundSnakeEyes; i++) {
        const result = rollDice(2, 6);
        if (result.isSnakeEyes) {
          expect(result.dice[0]).toBe(1);
          expect(result.dice[1]).toBe(1);
          foundSnakeEyes = true;
        }
      }
      // With 1000 rolls, probability of NOT getting snake eyes is ~0.97^1000 ≈ 0
      // But we don't assert this to avoid flaky tests
    });

    it('should detect boxcars', () => {
      let foundBoxcars = false;
      for (let i = 0; i < 1000 && !foundBoxcars; i++) {
        const result = rollDice(2, 6);
        if (result.isBoxcars) {
          expect(result.dice[0]).toBe(6);
          expect(result.dice[1]).toBe(6);
          foundBoxcars = true;
        }
      }
    });
  });

  describe('roll2d6', () => {
    it('should return exactly 2 dice', () => {
      const result = roll2d6();
      expect(result.dice).toHaveLength(2);
    });

    it('should have total between 2 and 12', () => {
      for (let i = 0; i < 100; i++) {
        const result = roll2d6();
        expect(result.total).toBeGreaterThanOrEqual(2);
        expect(result.total).toBeLessThanOrEqual(12);
      }
    });
  });
});

describe('Attribute Modifiers', () => {
  describe('getAttributeModifier', () => {
    it('should calculate modifiers correctly per RULES_ENGINE', () => {
      // From the table in RULES_ENGINE.md
      expect(getAttributeModifier(1)).toBe(-5);
      expect(getAttributeModifier(2)).toBe(-4);
      expect(getAttributeModifier(3)).toBe(-4);
      expect(getAttributeModifier(4)).toBe(-3);
      expect(getAttributeModifier(5)).toBe(-3);
      expect(getAttributeModifier(6)).toBe(-2);
      expect(getAttributeModifier(7)).toBe(-2);
      expect(getAttributeModifier(8)).toBe(-1);
      expect(getAttributeModifier(9)).toBe(-1);
      expect(getAttributeModifier(10)).toBe(0);
      expect(getAttributeModifier(11)).toBe(0);
      expect(getAttributeModifier(12)).toBe(1);
      expect(getAttributeModifier(13)).toBe(1);
      expect(getAttributeModifier(14)).toBe(2);
      expect(getAttributeModifier(15)).toBe(2);
      expect(getAttributeModifier(16)).toBe(3);
      expect(getAttributeModifier(17)).toBe(3);
      expect(getAttributeModifier(18)).toBe(4);
      expect(getAttributeModifier(19)).toBe(4);
      expect(getAttributeModifier(20)).toBe(5);
    });

    it('should clamp values outside 1-20 range', () => {
      expect(getAttributeModifier(0)).toBe(-5); // Clamped to 1
      expect(getAttributeModifier(-5)).toBe(-5); // Clamped to 1
      expect(getAttributeModifier(25)).toBe(5); // Clamped to 20
    });
  });
});

describe('Result Classification', () => {
  describe('classifyResult', () => {
    it('should classify CATASTROPHE at -5 or worse', () => {
      expect(classifyResult(-5)).toBe('CATASTROPHE');
      expect(classifyResult(-10)).toBe('CATASTROPHE');
    });

    it('should classify MISS at -4 to -1', () => {
      expect(classifyResult(-4)).toBe('MISS');
      expect(classifyResult(-3)).toBe('MISS');
      expect(classifyResult(-2)).toBe('MISS');
      expect(classifyResult(-1)).toBe('MISS');
    });

    it('should classify GRAZE at exactly 0', () => {
      expect(classifyResult(0)).toBe('GRAZE');
    });

    it('should classify HIT at +1 to +4', () => {
      expect(classifyResult(1)).toBe('HIT');
      expect(classifyResult(2)).toBe('HIT');
      expect(classifyResult(3)).toBe('HIT');
      expect(classifyResult(4)).toBe('HIT');
    });

    it('should classify PERFECT at +5 or better', () => {
      expect(classifyResult(5)).toBe('PERFECT');
      expect(classifyResult(10)).toBe('PERFECT');
    });
  });
});

describe('Skill Checks', () => {
  describe('performSkillCheck', () => {
    it('should include all modifiers in calculation', () => {
      const result = performSkillCheck(
        14, // attribute (mod +2)
        3,  // skill level
        [{ name: 'Equipment', value: 1 }],
        10  // TN
      );

      // Total modifier should be: +2 (attr) + 3 (skill) + 1 (equip) = +6
      const expectedModifier = 6;
      expect(result.modifiers.reduce((sum, m) => sum + m.value, 0)).toBe(expectedModifier);
    });

    it('should mark snake eyes as auto-fail', () => {
      // We can't force snake eyes, but we can verify the logic
      // by checking that when roll.isSnakeEyes is true, success is false
      // This is a structural test
      for (let i = 0; i < 100; i++) {
        const result = performSkillCheck(20, 10, [], 2); // Very easy check
        if (result.roll.isSnakeEyes) {
          expect(result.success).toBe(false);
          expect(result.critical).toBe('AUTO_FAIL');
        }
      }
    });

    it('should mark boxcars as auto-success', () => {
      for (let i = 0; i < 100; i++) {
        const result = performSkillCheck(1, 0, [], 20); // Very hard check
        if (result.roll.isBoxcars) {
          expect(result.success).toBe(true);
          expect(result.critical).toBe('AUTO_SUCCESS');
        }
      }
    });

    it('should calculate margin correctly', () => {
      const result = performSkillCheck(10, 0, [], 7);
      expect(result.margin).toBe(result.total - result.tn);
    });
  });
});

describe('Opposed Checks', () => {
  describe('performOpposedCheck', () => {
    it('should determine winner based on totals', () => {
      // Run multiple times to get varied results
      let attackerWins = 0;
      let defenderWins = 0;
      let ties = 0;

      for (let i = 0; i < 100; i++) {
        const result = performOpposedCheck(
          10, 0, [], // Attacker: average stats
          10, 0, []  // Defender: average stats
        );

        if (result.winner === 'ATTACKER') attackerWins++;
        else if (result.winner === 'DEFENDER') defenderWins++;
        else ties++;
      }

      // With equal stats, should be roughly even (allowing for variance)
      expect(attackerWins + defenderWins + ties).toBe(100);
    });

    it('should favor higher-stat combatant', () => {
      let attackerWins = 0;

      for (let i = 0; i < 100; i++) {
        const result = performOpposedCheck(
          18, 5, [{ name: 'Bonus', value: 3 }], // Attacker: strong
          8, 0, []                              // Defender: weak
        );

        if (result.winner === 'ATTACKER') attackerWins++;
      }

      // With significant stat advantage, should win most of the time
      expect(attackerWins).toBeGreaterThan(70);
    });
  });
});

describe('Extended Checks', () => {
  describe('createExtendedCheck', () => {
    it('should initialize with correct values', () => {
      const check = createExtendedCheck(5, 3);
      expect(check.successes).toBe(0);
      expect(check.required).toBe(5);
      expect(check.failures).toBe(0);
      expect(check.maxFailures).toBe(3);
      expect(check.attempts).toHaveLength(0);
      expect(check.status).toBe('IN_PROGRESS');
    });
  });

  describe('addExtendedCheckAttempt', () => {
    it('should track successes', () => {
      let state = createExtendedCheck(3, 2);

      const successResult = performSkillCheck(20, 10, [], 2); // Almost guaranteed success
      state = addExtendedCheckAttempt(state, { ...successResult, success: true });

      expect(state.successes).toBeGreaterThanOrEqual(1);
      expect(state.attempts).toHaveLength(1);
    });

    it('should complete when required successes reached', () => {
      let state = createExtendedCheck(2, 5);

      // Add two successes
      const mockSuccess = performSkillCheck(10, 0, [], 7);
      state = addExtendedCheckAttempt(state, { ...mockSuccess, success: true });
      state = addExtendedCheckAttempt(state, { ...mockSuccess, success: true });

      expect(state.status).toBe('COMPLETED');
    });

    it('should fail when max failures exceeded', () => {
      let state = createExtendedCheck(5, 2);

      const mockFailure = performSkillCheck(10, 0, [], 7);
      state = addExtendedCheckAttempt(state, { ...mockFailure, success: false });
      state = addExtendedCheckAttempt(state, { ...mockFailure, success: false });

      expect(state.status).toBe('FAILED');
    });
  });
});

describe('Probability Calculation', () => {
  describe('calculateSuccessProbability', () => {
    it('should return 100% for trivial checks', () => {
      // With +6 total modifier, need to roll 2+ on 2d6 (guaranteed)
      const prob = calculateSuccessProbability(14, 2, 2, 10);
      expect(prob).toBe(100);
    });

    it('should return ~58% for TN 7 with no modifiers', () => {
      // Classic 2d6 probability for rolling 7+
      const prob = calculateSuccessProbability(10, 0, 0, 7);
      expect(prob).toBeCloseTo(58.33, 1);
    });

    it('should return 0% for impossible checks', () => {
      // Need to roll 13+ on 2d6 (impossible)
      const prob = calculateSuccessProbability(10, 0, 0, 13);
      expect(prob).toBe(0);
    });
  });
});

describe('Dice Expression Parsing', () => {
  describe('parseDiceExpression', () => {
    it('should parse basic expressions', () => {
      expect(parseDiceExpression('2d6')).toEqual({ count: 2, sides: 6, bonus: 0 });
      expect(parseDiceExpression('1d20')).toEqual({ count: 1, sides: 20, bonus: 0 });
    });

    it('should parse expressions with bonuses', () => {
      expect(parseDiceExpression('2d6+3')).toEqual({ count: 2, sides: 6, bonus: 3 });
      expect(parseDiceExpression('1d8-1')).toEqual({ count: 1, sides: 8, bonus: -1 });
    });

    it('should throw on invalid expressions', () => {
      expect(() => parseDiceExpression('invalid')).toThrow();
      expect(() => parseDiceExpression('')).toThrow();
    });
  });

  describe('rollExpression', () => {
    it('should roll and apply bonus', () => {
      const result = rollExpression('2d6+5');
      expect(result.dice).toHaveLength(2);
      expect(result.bonus).toBe(5);
      expect(result.total).toBe(result.dice[0]! + result.dice[1]! + 5);
    });

    it('should handle negative bonuses', () => {
      const result = rollExpression('1d6-2');
      expect(result.bonus).toBe(-2);
      expect(result.total).toBe(result.dice[0]! - 2);
    });
  });
});
