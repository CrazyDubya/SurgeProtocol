/**
 * Surge Protocol - Character Services Unit Tests
 *
 * Tests for:
 * - StatelessProgressionCalculator
 * - StatelessHumanityCalculator
 */

import { describe, test, expect } from 'vitest';
import {
  StatelessProgressionCalculator,
  TIER_DEFINITIONS,
} from '../../src/services/character/progression';
import {
  StatelessHumanityCalculator,
  HUMANITY_THRESHOLDS,
} from '../../src/services/character/humanity';

// =============================================================================
// PROGRESSION CALCULATOR TESTS
// =============================================================================

describe('StatelessProgressionCalculator', () => {
  const calc = new StatelessProgressionCalculator();

  describe('getTierDefinition', () => {
    test('returns correct tier for each tier number', () => {
      expect(calc.getTierDefinition(1)?.name).toBe('Probationary');
      expect(calc.getTierDefinition(5)?.name).toBe('Professional');
      expect(calc.getTierDefinition(10)?.name).toBe('Transcendent');
    });

    test('returns undefined for invalid tier', () => {
      expect(calc.getTierDefinition(0)).toBeUndefined();
      expect(calc.getTierDefinition(11)).toBeUndefined();
      expect(calc.getTierDefinition(-1)).toBeUndefined();
    });
  });

  describe('getAllTiers', () => {
    test('returns all 10 tiers', () => {
      const tiers = calc.getAllTiers();
      expect(tiers.length).toBe(10);
    });

    test('tiers are in order', () => {
      const tiers = calc.getAllTiers();
      for (let i = 0; i < tiers.length; i++) {
        expect(tiers[i].tier_number).toBe(i + 1);
      }
    });
  });

  describe('getXPForTier', () => {
    test('returns correct XP requirements', () => {
      expect(calc.getXPForTier(1)).toBe(0);
      expect(calc.getXPForTier(2)).toBe(100);
      expect(calc.getXPForTier(3)).toBe(300);
      expect(calc.getXPForTier(5)).toBe(1000);
      expect(calc.getXPForTier(10)).toBe(5500);
    });

    test('returns 0 for invalid tier', () => {
      expect(calc.getXPForTier(0)).toBe(0);
      expect(calc.getXPForTier(15)).toBe(0);
    });
  });

  describe('getTierForXP', () => {
    test('returns tier 1 for 0 XP', () => {
      expect(calc.getTierForXP(0)).toBe(1);
    });

    test('returns tier 1 for XP below tier 2 threshold', () => {
      expect(calc.getTierForXP(50)).toBe(1);
      expect(calc.getTierForXP(99)).toBe(1);
    });

    test('returns tier 2 at threshold', () => {
      expect(calc.getTierForXP(100)).toBe(2);
    });

    test('returns correct tier for various XP values', () => {
      expect(calc.getTierForXP(300)).toBe(3);
      expect(calc.getTierForXP(600)).toBe(4);
      expect(calc.getTierForXP(1000)).toBe(5);
      expect(calc.getTierForXP(2500)).toBe(7);
      expect(calc.getTierForXP(5500)).toBe(10);
    });

    test('returns tier 10 for very high XP', () => {
      expect(calc.getTierForXP(10000)).toBe(10);
      expect(calc.getTierForXP(100000)).toBe(10);
    });
  });

  describe('getProgressToNextTier', () => {
    test('returns 0% at tier start', () => {
      expect(calc.getProgressToNextTier(0, 1)).toBe(0);
      expect(calc.getProgressToNextTier(100, 2)).toBe(0);
    });

    test('returns 50% at midpoint', () => {
      // Tier 1 to 2: 0 to 100 XP, midpoint is 50
      expect(calc.getProgressToNextTier(50, 1)).toBe(50);
    });

    test('returns 100% when at next tier threshold', () => {
      expect(calc.getProgressToNextTier(100, 1)).toBe(100);
    });

    test('returns 100% at max tier', () => {
      expect(calc.getProgressToNextTier(5500, 10)).toBe(100);
      expect(calc.getProgressToNextTier(10000, 10)).toBe(100);
    });
  });

  describe('getPayMultiplier', () => {
    test('returns 1.0 for tier 1', () => {
      expect(calc.getPayMultiplier(1)).toBe(1.0);
    });

    test('returns increasing multipliers for higher tiers', () => {
      expect(calc.getPayMultiplier(2)).toBe(1.2);
      expect(calc.getPayMultiplier(5)).toBe(2.2);
      expect(calc.getPayMultiplier(10)).toBe(10.0);
    });

    test('returns 1.0 for invalid tier', () => {
      expect(calc.getPayMultiplier(0)).toBe(1.0);
      expect(calc.getPayMultiplier(15)).toBe(1.0);
    });
  });

  describe('getMaxAttribute', () => {
    test('returns correct max attribute for each tier', () => {
      expect(calc.getMaxAttribute(1)).toBe(15);
      expect(calc.getMaxAttribute(3)).toBe(16);
      expect(calc.getMaxAttribute(5)).toBe(17);
      expect(calc.getMaxAttribute(7)).toBe(18);
      expect(calc.getMaxAttribute(10)).toBe(20);
    });
  });

  describe('getMaxSkill', () => {
    test('returns correct max skill for each tier', () => {
      expect(calc.getMaxSkill(1)).toBe(5);
      expect(calc.getMaxSkill(3)).toBe(6);
      expect(calc.getMaxSkill(5)).toBe(7);
      expect(calc.getMaxSkill(7)).toBe(8);
      expect(calc.getMaxSkill(10)).toBe(10);
    });
  });

  describe('hasUnlock', () => {
    test('tier 1 has basic unlocks', () => {
      expect(calc.hasUnlock(1, 'basic_missions')).toBe(true);
      expect(calc.hasUnlock(1, 'standard_delivery')).toBe(true);
    });

    test('tier 1 does not have higher tier unlocks', () => {
      expect(calc.hasUnlock(1, 'track_selection')).toBe(false);
      expect(calc.hasUnlock(1, 'combat_missions')).toBe(false);
    });

    test('higher tiers inherit lower tier unlocks', () => {
      expect(calc.hasUnlock(5, 'basic_missions')).toBe(true);
      expect(calc.hasUnlock(10, 'express_missions')).toBe(true);
    });

    test('tier 3 has track selection', () => {
      expect(calc.hasUnlock(3, 'track_selection')).toBe(true);
    });

    test('tier 5 has combat missions', () => {
      expect(calc.hasUnlock(5, 'combat_missions')).toBe(true);
    });

    test('tier 10 has transcendence content', () => {
      expect(calc.hasUnlock(10, 'endgame_content')).toBe(true);
      expect(calc.hasUnlock(10, 'algorithm_communion')).toBe(true);
    });
  });

  describe('getUnlocksAtTier', () => {
    test('tier 1 has 2 unlocks', () => {
      const unlocks = calc.getUnlocksAtTier(1);
      expect(unlocks).toContain('basic_missions');
      expect(unlocks).toContain('standard_delivery');
      expect(unlocks.length).toBe(2);
    });

    test('tier 10 has all unlocks', () => {
      const unlocks = calc.getUnlocksAtTier(10);
      expect(unlocks.length).toBeGreaterThan(20);
      expect(unlocks).toContain('basic_missions');
      expect(unlocks).toContain('endgame_content');
    });

    test('unlocks are unique', () => {
      const unlocks = calc.getUnlocksAtTier(10);
      const uniqueUnlocks = [...new Set(unlocks)];
      expect(unlocks.length).toBe(uniqueUnlocks.length);
    });
  });
});

// =============================================================================
// HUMANITY CALCULATOR TESTS
// =============================================================================

describe('StatelessHumanityCalculator', () => {
  const calc = new StatelessHumanityCalculator();

  describe('getThreshold', () => {
    test('returns Fully Human for 100', () => {
      expect(calc.getThreshold(100).name).toBe('Fully Human');
    });

    test('returns Augmented for 80-99', () => {
      expect(calc.getThreshold(80).name).toBe('Augmented');
      expect(calc.getThreshold(99).name).toBe('Augmented');
    });

    test('returns Chromed for 60-79', () => {
      expect(calc.getThreshold(60).name).toBe('Chromed');
      expect(calc.getThreshold(79).name).toBe('Chromed');
    });

    test('returns Hollowed for 40-59', () => {
      expect(calc.getThreshold(40).name).toBe('Hollowed');
      expect(calc.getThreshold(59).name).toBe('Hollowed');
    });

    test('returns Borged for 20-39', () => {
      expect(calc.getThreshold(20).name).toBe('Borged');
      expect(calc.getThreshold(39).name).toBe('Borged');
    });

    test('returns Lost for 0-19', () => {
      expect(calc.getThreshold(0).name).toBe('Lost');
      expect(calc.getThreshold(19).name).toBe('Lost');
    });
  });

  describe('getAllThresholds', () => {
    test('returns 6 thresholds', () => {
      expect(calc.getAllThresholds().length).toBe(6);
    });

    test('thresholds are in descending order', () => {
      const thresholds = calc.getAllThresholds();
      for (let i = 0; i < thresholds.length - 1; i++) {
        expect(thresholds[i].level).toBeGreaterThan(thresholds[i + 1].level);
      }
    });
  });

  describe('getCyberpsychosisRisk', () => {
    test('returns NONE for high humanity', () => {
      expect(calc.getCyberpsychosisRisk(100)).toBe('NONE');
      expect(calc.getCyberpsychosisRisk(80)).toBe('NONE');
      expect(calc.getCyberpsychosisRisk(61)).toBe('NONE');
    });

    test('returns LOW for 41-60', () => {
      expect(calc.getCyberpsychosisRisk(60)).toBe('LOW');
      expect(calc.getCyberpsychosisRisk(41)).toBe('LOW');
    });

    test('returns MODERATE for 21-40', () => {
      expect(calc.getCyberpsychosisRisk(40)).toBe('MODERATE');
      expect(calc.getCyberpsychosisRisk(21)).toBe('MODERATE');
    });

    test('returns HIGH for 11-20', () => {
      expect(calc.getCyberpsychosisRisk(20)).toBe('HIGH');
      expect(calc.getCyberpsychosisRisk(11)).toBe('HIGH');
    });

    test('returns CRITICAL for 0-10', () => {
      expect(calc.getCyberpsychosisRisk(10)).toBe('CRITICAL');
      expect(calc.getCyberpsychosisRisk(0)).toBe('CRITICAL');
    });
  });

  describe('isShadowActive', () => {
    test('returns false for humanity above 60', () => {
      expect(calc.isShadowActive(100)).toBe(false);
      expect(calc.isShadowActive(61)).toBe(false);
    });

    test('returns true for humanity at or below 60', () => {
      expect(calc.isShadowActive(60)).toBe(true);
      expect(calc.isShadowActive(30)).toBe(true);
      expect(calc.isShadowActive(0)).toBe(true);
    });
  });

  describe('hasForkRisk', () => {
    test('returns false for humanity above 20', () => {
      expect(calc.hasForkRisk(100)).toBe(false);
      expect(calc.hasForkRisk(50)).toBe(false);
      expect(calc.hasForkRisk(21)).toBe(false);
    });

    test('returns true for humanity at or below 20', () => {
      expect(calc.hasForkRisk(20)).toBe(true);
      expect(calc.hasForkRisk(10)).toBe(true);
      expect(calc.hasForkRisk(0)).toBe(true);
    });
  });

  describe('getAlgorithmMessage', () => {
    test('returns appropriate message for each threshold', () => {
      expect(calc.getAlgorithmMessage(100)).toContain('BASELINE HUMAN');
      expect(calc.getAlgorithmMessage(80)).toContain('ACCEPTABLE');
      expect(calc.getAlgorithmMessage(60)).toContain('SHADOW PROTOCOLS');
      expect(calc.getAlgorithmMessage(40)).toContain('CRITICAL');
      expect(calc.getAlgorithmMessage(20)).toContain('FORK PROBABILITY');
      expect(calc.getAlgorithmMessage(0)).toContain('FORMER HUMAN');
    });
  });

  describe('estimateHumanityAfterAugment', () => {
    test('subtracts base cost with no existing augments', () => {
      expect(calc.estimateHumanityAfterAugment(100, 10, 0)).toBe(90);
    });

    test('applies modifier for existing augments', () => {
      // With 2 existing augments: modifier = 1 + (2 * 0.05) = 1.1
      // Cost = 10 * 1.1 = 11
      expect(calc.estimateHumanityAfterAugment(100, 10, 2)).toBe(89);
    });

    test('does not go below 0', () => {
      expect(calc.estimateHumanityAfterAugment(5, 20, 0)).toBe(0);
    });

    test('higher augment count increases cost', () => {
      const cost0 = 100 - calc.estimateHumanityAfterAugment(100, 10, 0);
      const cost5 = 100 - calc.estimateHumanityAfterAugment(100, 10, 5);
      const cost10 = 100 - calc.estimateHumanityAfterAugment(100, 10, 10);

      expect(cost5).toBeGreaterThan(cost0);
      expect(cost10).toBeGreaterThan(cost5);
    });
  });
});

// =============================================================================
// TIER DEFINITIONS TESTS
// =============================================================================

describe('TIER_DEFINITIONS', () => {
  test('has 10 tiers', () => {
    expect(TIER_DEFINITIONS.length).toBe(10);
  });

  test('XP requirements increase monotonically', () => {
    for (let i = 1; i < TIER_DEFINITIONS.length; i++) {
      expect(TIER_DEFINITIONS[i].xp_required).toBeGreaterThan(
        TIER_DEFINITIONS[i - 1].xp_required
      );
    }
  });

  test('rating thresholds increase monotonically', () => {
    for (let i = 1; i < TIER_DEFINITIONS.length; i++) {
      expect(TIER_DEFINITIONS[i].rating_threshold).toBeGreaterThan(
        TIER_DEFINITIONS[i - 1].rating_threshold
      );
    }
  });

  test('pay multipliers increase monotonically', () => {
    for (let i = 1; i < TIER_DEFINITIONS.length; i++) {
      expect(TIER_DEFINITIONS[i].base_pay_multiplier).toBeGreaterThanOrEqual(
        TIER_DEFINITIONS[i - 1].base_pay_multiplier
      );
    }
  });

  test('each tier has Algorithm greeting', () => {
    for (const tier of TIER_DEFINITIONS) {
      expect(tier.algorithm_greeting).toBeTruthy();
      expect(tier.algorithm_greeting.length).toBeGreaterThan(10);
    }
  });

  test('each tier has unlocks', () => {
    for (const tier of TIER_DEFINITIONS) {
      expect(tier.unlocks).toBeTruthy();
      expect(tier.unlocks.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// HUMANITY THRESHOLDS TESTS
// =============================================================================

describe('HUMANITY_THRESHOLDS', () => {
  test('has 6 thresholds', () => {
    expect(HUMANITY_THRESHOLDS.length).toBe(6);
  });

  test('threshold levels decrease from 100 to 0', () => {
    expect(HUMANITY_THRESHOLDS[0].level).toBe(100);
    expect(HUMANITY_THRESHOLDS[HUMANITY_THRESHOLDS.length - 1].level).toBe(0);
  });

  test('each threshold has Algorithm message', () => {
    for (const threshold of HUMANITY_THRESHOLDS) {
      expect(threshold.algorithm_message).toBeTruthy();
      expect(threshold.algorithm_message.length).toBeGreaterThan(10);
    }
  });

  test('low humanity thresholds have more effects', () => {
    const fullyHuman = HUMANITY_THRESHOLDS.find((t) => t.level === 100);
    const borged = HUMANITY_THRESHOLDS.find((t) => t.level === 20);

    expect(fullyHuman?.effects.length).toBeLessThan(borged?.effects.length || 0);
  });

  test('Borged threshold has fork risk unlock', () => {
    const borged = HUMANITY_THRESHOLDS.find((t) => t.level === 20);
    const forkUnlock = borged?.effects.find(
      (e) => e.type === 'UNLOCK' && e.target === 'fork_creation'
    );
    expect(forkUnlock).toBeTruthy();
  });

  test('Chromed threshold activates shadow dialogue', () => {
    const chromed = HUMANITY_THRESHOLDS.find((t) => t.level === 60);
    const shadowUnlock = chromed?.effects.find(
      (e) => e.type === 'UNLOCK' && e.target === 'shadow_dialogue'
    );
    expect(shadowUnlock).toBeTruthy();
  });
});
