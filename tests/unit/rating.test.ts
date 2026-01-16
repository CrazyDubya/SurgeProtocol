/**
 * Unit tests for carrier rating system.
 *
 * Run with: npm run test:unit
 */

import { describe, it, expect } from 'vitest';
import {
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
  TIER_THRESHOLDS,
  TIER_MULTIPLIERS,
  RATING_WEIGHTS,
} from '../../src/game/mechanics/rating';

describe('Tier System', () => {
  describe('getTierFromRating', () => {
    it('should return tier 1 for ratings 0-49', () => {
      expect(getTierFromRating(0)).toBe(1);
      expect(getTierFromRating(25)).toBe(1);
      expect(getTierFromRating(49)).toBe(1);
    });

    it('should return tier 2 for ratings 50-99', () => {
      expect(getTierFromRating(50)).toBe(2);
      expect(getTierFromRating(75)).toBe(2);
      expect(getTierFromRating(99)).toBe(2);
    });

    it('should return correct tier for each threshold', () => {
      expect(getTierFromRating(100)).toBe(3);
      expect(getTierFromRating(150)).toBe(4);
      expect(getTierFromRating(200)).toBe(5);
      expect(getTierFromRating(250)).toBe(6);
      expect(getTierFromRating(300)).toBe(7);
      expect(getTierFromRating(350)).toBe(8);
      expect(getTierFromRating(400)).toBe(9);
      expect(getTierFromRating(450)).toBe(10);
    });

    it('should return tier 10 for max ratings', () => {
      expect(getTierFromRating(500)).toBe(10);
      expect(getTierFromRating(1000)).toBe(10);
    });
  });

  describe('getTierRatingRange', () => {
    it('should return correct min/max for each tier', () => {
      expect(getTierRatingRange(1)).toEqual({ min: 0, max: 49.999 });
      expect(getTierRatingRange(5)).toEqual({ min: 200, max: 249.999 });
      expect(getTierRatingRange(10)).toEqual({ min: 450, max: 1000 });
    });
  });

  describe('TIER_THRESHOLDS', () => {
    it('should have 10 thresholds', () => {
      expect(TIER_THRESHOLDS).toHaveLength(10);
    });

    it('should be in ascending order', () => {
      for (let i = 1; i < TIER_THRESHOLDS.length; i++) {
        expect(TIER_THRESHOLDS[i]).toBeGreaterThan(TIER_THRESHOLDS[i - 1]!);
      }
    });
  });

  describe('TIER_MULTIPLIERS', () => {
    it('should have 10 multipliers', () => {
      expect(TIER_MULTIPLIERS).toHaveLength(10);
    });

    it('should increase with tier', () => {
      for (let i = 1; i < TIER_MULTIPLIERS.length; i++) {
        expect(TIER_MULTIPLIERS[i]).toBeGreaterThan(TIER_MULTIPLIERS[i - 1]!);
      }
    });

    it('should have tier 10 multiplier of 2.0', () => {
      expect(TIER_MULTIPLIERS[9]).toBe(2.0);
    });
  });
});

describe('Rating Components', () => {
  describe('calculateDeliverySuccessRate', () => {
    it('should return 100 for new couriers', () => {
      expect(calculateDeliverySuccessRate(0, 0)).toBe(100);
    });

    it('should calculate percentage correctly', () => {
      expect(calculateDeliverySuccessRate(80, 100)).toBe(80);
      expect(calculateDeliverySuccessRate(95, 100)).toBe(95);
      expect(calculateDeliverySuccessRate(50, 100)).toBe(50);
    });
  });

  describe('calculateSpeedPerformance', () => {
    it('should return 100 for on-time delivery', () => {
      expect(calculateSpeedPerformance(30, 30)).toBe(100);
    });

    it('should return lower score for slow delivery', () => {
      expect(calculateSpeedPerformance(60, 30)).toBe(50);
    });

    it('should penalize suspiciously fast deliveries', () => {
      // More than 25% faster is suspicious
      expect(calculateSpeedPerformance(20, 30)).toBe(80);
    });

    it('should return 0 for zero actual time', () => {
      expect(calculateSpeedPerformance(0, 30)).toBe(0);
    });
  });

  describe('calculateCustomerSatisfaction', () => {
    it('should return 80 for new couriers', () => {
      expect(calculateCustomerSatisfaction([])).toBe(80);
    });

    it('should calculate score from star ratings', () => {
      // All 5 stars = 100%
      expect(calculateCustomerSatisfaction([5, 5, 5, 5, 5])).toBe(100);
      // All 1 stars = 20%
      expect(calculateCustomerSatisfaction([1, 1, 1, 1, 1])).toBe(20);
      // Mixed ratings
      expect(calculateCustomerSatisfaction([3, 3, 3, 3, 3])).toBe(60);
    });

    it('should only consider last N ratings', () => {
      const oldRatings = Array(100).fill(1); // 100 1-star ratings
      const newRatings = Array(50).fill(5); // 50 5-star ratings
      const allRatings = [...oldRatings, ...newRatings];

      const score = calculateCustomerSatisfaction(allRatings, 50);
      expect(score).toBe(100); // Only sees the 5-star ratings
    });
  });

  describe('calculatePackageIntegrity', () => {
    it('should start at 100 with no damage', () => {
      expect(calculatePackageIntegrity(0, 0)).toBe(100);
    });

    it('should subtract 5 per damage incident', () => {
      expect(calculatePackageIntegrity(1, 0)).toBe(95);
      expect(calculatePackageIntegrity(5, 0)).toBe(75);
    });

    it('should subtract 10 per fragile damage (doubled)', () => {
      expect(calculatePackageIntegrity(0, 1)).toBe(95); // 5 for incident + 5 extra for fragile
      expect(calculatePackageIntegrity(1, 1)).toBe(90);
    });

    it('should floor at 0', () => {
      expect(calculatePackageIntegrity(50, 0)).toBe(0);
    });
  });

  describe('calculateIncidentScore', () => {
    it('should start at 100 with no incidents', () => {
      expect(calculateIncidentScore(0)).toBe(100);
    });

    it('should subtract 10 per incident', () => {
      expect(calculateIncidentScore(1)).toBe(90);
      expect(calculateIncidentScore(5)).toBe(50);
    });

    it('should floor at 0', () => {
      expect(calculateIncidentScore(15)).toBe(0);
    });
  });
});

describe('Overall Rating Calculation', () => {
  describe('calculateRating', () => {
    it('should calculate weighted average', () => {
      const components = new Map<string, number>([
        ['DEL_SUC', 100],
        ['DEL_SPD', 100],
        ['CUST_SAT', 100],
        ['PKG_INT', 100],
        ['ROUTE_EFF', 100],
        ['AVAIL', 100],
        ['INCIDENT', 100],
        ['SPECIAL', 100],
      ]);

      const result = calculateRating(components, 1);

      // At tier 1 (1.0 multiplier), max weighted score is 100
      expect(result.rawScore).toBe(100);
      expect(result.tierMultiplier).toBe(1.0);
      expect(result.finalRating).toBe(100);
    });

    it('should apply tier multiplier', () => {
      const components = new Map<string, number>([
        ['DEL_SUC', 100],
        ['DEL_SPD', 100],
        ['CUST_SAT', 100],
        ['PKG_INT', 100],
        ['ROUTE_EFF', 100],
        ['AVAIL', 100],
        ['INCIDENT', 100],
        ['SPECIAL', 100],
      ]);

      const tier5Result = calculateRating(components, 5);
      expect(tier5Result.tierMultiplier).toBe(1.4);
      expect(tier5Result.finalRating).toBe(140); // 100 * 1.4
    });

    it('should only include T7+ components at high tiers', () => {
      const components = new Map<string, number>([
        ['DEL_SUC', 100],
        ['DEL_SPD', 100],
        ['CUST_SAT', 100],
        ['PKG_INT', 100],
        ['ROUTE_EFF', 100],
        ['AVAIL', 100],
        ['INCIDENT', 100],
        ['SPECIAL', 100],
        ['ALGO', 100], // T7+ only
        ['NET', 100],  // T9+ only
      ]);

      const tier1Result = calculateRating(components, 1);
      const tier7Result = calculateRating(components, 7);
      const tier9Result = calculateRating(components, 9);

      // ALGO weight is 0.025, NET weight is 0.025
      // Tier 1 shouldn't include either
      // Tier 7 should include ALGO
      // Tier 9 should include both
      expect(tier7Result.components.some(c => c.code === 'ALGO')).toBe(true);
      expect(tier7Result.components.some(c => c.code === 'NET')).toBe(false);
      expect(tier9Result.components.some(c => c.code === 'ALGO')).toBe(true);
      expect(tier9Result.components.some(c => c.code === 'NET')).toBe(true);
    });
  });

  describe('RATING_WEIGHTS', () => {
    it('should sum to approximately 1.0', () => {
      const totalWeight = Object.values(RATING_WEIGHTS).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBeCloseTo(1.0, 5);
    });
  });
});

describe('Mission Rating Updates', () => {
  describe('updateRatingFromMission', () => {
    const baseComponents = new Map<string, number>([
      ['DEL_SUC', 80],
      ['DEL_SPD', 80],
      ['CUST_SAT', 80],
      ['PKG_INT', 100],
      ['ROUTE_EFF', 80],
      ['AVAIL', 80],
      ['INCIDENT', 100],
      ['SPECIAL', 0],
    ]);

    it('should update components on successful mission', () => {
      const result = updateRatingFromMission(
        baseComponents,
        1,
        {
          success: true,
          deliveryTimeActual: 30,
          deliveryTimeExpected: 30,
          customerRating: 5,
          packageDamaged: false,
          packageFragile: false,
          routeEfficiency: 90,
          incidentOccurred: false,
          isSpecialMission: false,
        },
        { successful: 80, total: 100 }
      );

      expect(result.newRating).toBeGreaterThanOrEqual(result.previousRating);
      expect(result.components.length).toBeGreaterThan(0);
    });

    it('should track tier changes', () => {
      // Start near tier threshold
      const nearThresholdComponents = new Map<string, number>([
        ['DEL_SUC', 49],
        ['DEL_SPD', 49],
        ['CUST_SAT', 49],
        ['PKG_INT', 49],
        ['ROUTE_EFF', 49],
        ['AVAIL', 49],
        ['INCIDENT', 49],
        ['SPECIAL', 49],
      ]);

      const result = updateRatingFromMission(
        nearThresholdComponents,
        1,
        {
          success: true,
          deliveryTimeActual: 20,
          deliveryTimeExpected: 30,
          customerRating: 5,
          packageDamaged: false,
          packageFragile: false,
          routeEfficiency: 100,
          incidentOccurred: false,
          isSpecialMission: true,
        },
        { successful: 49, total: 50 }
      );

      expect(result.tierChanged !== undefined).toBe(true);
    });
  });
});

describe('Decay System', () => {
  describe('calculateDecay', () => {
    it('should return 0 for active players (≤7 days)', () => {
      expect(calculateDecay(100, 0)).toBe(0);
      expect(calculateDecay(100, 7)).toBe(0);
    });

    it('should apply 0.1 decay per day after 7 days', () => {
      expect(calculateDecay(100, 8)).toBe(0.1);
      expect(calculateDecay(100, 17)).toBe(1.0);
    });

    it('should cap decay at 10% of current rating', () => {
      expect(calculateDecay(100, 1000)).toBe(10); // 10% of 100
      expect(calculateDecay(50, 1000)).toBe(5); // 10% of 50
    });
  });
});

describe('Death Spiral Protection', () => {
  describe('applyDeathSpiralProtection', () => {
    it('should not affect positive changes', () => {
      expect(applyDeathSpiralProtection(50, 5)).toBe(5);
      expect(applyDeathSpiralProtection(30, 10)).toBe(10);
    });

    it('should not affect losses above rating 60', () => {
      expect(applyDeathSpiralProtection(80, -10)).toBe(-10);
      expect(applyDeathSpiralProtection(60, -5)).toBe(-5);
    });

    it('should reduce losses by 50% below rating 60', () => {
      expect(applyDeathSpiralProtection(50, -10)).toBe(-5);
      expect(applyDeathSpiralProtection(45, -8)).toBe(-4);
    });

    it('should reduce losses by 75% below rating 40', () => {
      expect(applyDeathSpiralProtection(30, -10)).toBe(-2.5);
      expect(applyDeathSpiralProtection(20, -8)).toBe(-2);
    });
  });
});

describe('Tier Proximity', () => {
  describe('isNearTierUp', () => {
    it('should return true when within 10 points of next tier', () => {
      expect(isNearTierUp(42)).toBe(true); // 8 away from 50
      expect(isNearTierUp(95)).toBe(true); // 5 away from 100
    });

    it('should return false when more than 10 points away', () => {
      expect(isNearTierUp(30)).toBe(false); // 20 away from 50
      expect(isNearTierUp(60)).toBe(false); // 40 away from 100
    });

    it('should return false at tier 10', () => {
      expect(isNearTierUp(500)).toBe(false);
      expect(isNearTierUp(1000)).toBe(false);
    });
  });
});

describe('Algorithm Commentary', () => {
  describe('getAlgorithmCommentary', () => {
    it('should acknowledge tier advancement', () => {
      const change = {
        previousRating: 48,
        newRating: 52,
        delta: 4,
        components: [],
        reason: 'Mission completed',
        tierChanged: true,
        previousTier: 1,
        newTier: 2,
      };

      const commentary = getAlgorithmCommentary(change);
      expect(commentary).toContain('TIER ADVANCEMENT');
      expect(commentary).toContain('Tier 2');
    });

    it('should note tier regression', () => {
      const change = {
        previousRating: 52,
        newRating: 45,
        delta: -7,
        components: [],
        reason: 'Mission failed',
        tierChanged: true,
        previousTier: 2,
        newTier: 1,
      };

      const commentary = getAlgorithmCommentary(change);
      expect(commentary).toContain('TIER REGRESSION');
    });

    it('should praise significant improvements', () => {
      const change = {
        previousRating: 50,
        newRating: 58,
        delta: 8,
        components: [],
        reason: 'Mission completed',
        tierChanged: false,
        previousTier: 2,
        newTier: 2,
      };

      const commentary = getAlgorithmCommentary(change);
      expect(commentary).toContain('Excellent');
    });

    it('should note significant declines', () => {
      const change = {
        previousRating: 50,
        newRating: 42,
        delta: -8,
        components: [],
        reason: 'Mission failed',
        tierChanged: false,
        previousTier: 1,
        newTier: 1,
      };

      const commentary = getAlgorithmCommentary(change);
      expect(commentary).toContain('below expectations');
    });

    it('should have default message for stable rating', () => {
      const change = {
        previousRating: 50,
        newRating: 50,
        delta: 0,
        components: [],
        reason: 'No change',
        tierChanged: false,
        previousTier: 2,
        newTier: 2,
      };

      const commentary = getAlgorithmCommentary(change);
      expect(commentary).toContain('Algorithm watches');
    });
  });
});
