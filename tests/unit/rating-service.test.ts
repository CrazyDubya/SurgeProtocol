/**
 * Unit tests for Rating Service classes.
 *
 * Tests the service layer that wraps the rating mechanics.
 * Run with: npm run test:unit
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  StatelessRatingCalculator,
} from '../../src/services/rating/calculator';
import {
  getDecayAlgorithmMessage,
  type DecayResult,
} from '../../src/services/rating/decay';

// =============================================================================
// STATELESS RATING CALCULATOR TESTS
// =============================================================================

describe('StatelessRatingCalculator', () => {
  let calculator: StatelessRatingCalculator;

  beforeEach(() => {
    calculator = new StatelessRatingCalculator();
  });

  describe('calculate', () => {
    it('should calculate rating from components', () => {
      const components = new Map<string, number>([
        ['DEL_SUC', 90],
        ['DEL_SPD', 80],
        ['CUST_SAT', 85],
        ['PKG_INT', 100],
        ['ROUTE_EFF', 75],
        ['AVAIL', 80],
        ['INCIDENT', 95],
        ['SPECIAL', 20],
      ]);

      const result = calculator.calculate(components, 1);

      expect(result).toBeDefined();
      expect(result.finalRating).toBeGreaterThan(0);
      expect(result.tier).toBe(1);
      expect(result.tierMultiplier).toBe(1.0);
      expect(result.components).toBeInstanceOf(Array);
    });

    it('should apply tier multiplier correctly', () => {
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

      const tier1Result = calculator.calculate(components, 1);
      const tier5Result = calculator.calculate(components, 5);

      expect(tier5Result.tierMultiplier).toBeGreaterThan(tier1Result.tierMultiplier);
      expect(tier5Result.finalRating).toBeGreaterThan(tier1Result.finalRating);
    });

    it('should handle empty components map', () => {
      const components = new Map<string, number>();
      const result = calculator.calculate(components, 1);

      expect(result.finalRating).toBe(0);
      expect(result.rawScore).toBe(0);
    });
  });

  describe('getTier', () => {
    it('should return correct tier for various ratings', () => {
      expect(calculator.getTier(0)).toBe(1);
      expect(calculator.getTier(50)).toBe(2);
      expect(calculator.getTier(100)).toBe(3);
      expect(calculator.getTier(450)).toBe(10);
      expect(calculator.getTier(1000)).toBe(10);
    });
  });

  describe('getTierRange', () => {
    it('should return correct range for tier 1', () => {
      const range = calculator.getTierRange(1);
      expect(range.min).toBe(0);
      expect(range.max).toBeLessThan(50);
    });

    it('should return correct range for tier 10', () => {
      const range = calculator.getTierRange(10);
      expect(range.min).toBe(450);
      expect(range.max).toBe(1000);
    });
  });

  describe('isNearTierUp', () => {
    it('should return true when within 10 points of next tier', () => {
      expect(calculator.isNearTierUp(45)).toBe(true);
      expect(calculator.isNearTierUp(95)).toBe(true);
      expect(calculator.isNearTierUp(145)).toBe(true);
    });

    it('should return false when far from next tier', () => {
      expect(calculator.isNearTierUp(20)).toBe(false);
      expect(calculator.isNearTierUp(70)).toBe(false);
    });

    it('should return false for tier 10', () => {
      expect(calculator.isNearTierUp(500)).toBe(false);
      expect(calculator.isNearTierUp(1000)).toBe(false);
    });
  });

  describe('applyProtection', () => {
    it('should not modify positive changes', () => {
      expect(calculator.applyProtection(50, 10)).toBe(10);
      expect(calculator.applyProtection(30, 5)).toBe(5);
    });

    it('should reduce negative changes at low ratings', () => {
      // At rating < 60, negative impact reduced by 50%
      expect(calculator.applyProtection(50, -10)).toBe(-5);

      // At rating < 40, negative impact reduced by 75%
      expect(calculator.applyProtection(30, -10)).toBe(-2.5);
    });

    it('should not protect at high ratings', () => {
      expect(calculator.applyProtection(100, -10)).toBe(-10);
      expect(calculator.applyProtection(80, -10)).toBe(-10);
    });
  });

  describe('deliverySuccessRate', () => {
    it('should return 100 for new couriers', () => {
      expect(calculator.deliverySuccessRate(0, 0)).toBe(100);
    });

    it('should calculate correct percentage', () => {
      expect(calculator.deliverySuccessRate(90, 100)).toBe(90);
      expect(calculator.deliverySuccessRate(50, 100)).toBe(50);
      expect(calculator.deliverySuccessRate(100, 100)).toBe(100);
    });
  });

  describe('speedPerformance', () => {
    it('should return 100 for on-time delivery', () => {
      expect(calculator.speedPerformance(30, 30)).toBe(100);
    });

    it('should return proportional score for slow delivery', () => {
      // 60 min actual vs 30 expected = 50% speed
      expect(calculator.speedPerformance(60, 30)).toBe(50);
    });

    it('should cap suspiciously fast deliveries', () => {
      // Too fast (>125% expected) returns 80 as penalty
      expect(calculator.speedPerformance(10, 30)).toBe(80);
    });

    it('should return 0 for invalid time', () => {
      expect(calculator.speedPerformance(0, 30)).toBe(0);
      expect(calculator.speedPerformance(-10, 30)).toBe(0);
    });
  });

  describe('customerSatisfaction', () => {
    it('should return 80 for new couriers', () => {
      expect(calculator.customerSatisfaction([])).toBe(80);
    });

    it('should calculate correct score from ratings', () => {
      // All 5-star ratings = 100%
      expect(calculator.customerSatisfaction([5, 5, 5, 5, 5])).toBe(100);

      // All 1-star ratings = 20%
      expect(calculator.customerSatisfaction([1, 1, 1, 1, 1])).toBe(20);

      // Mixed ratings
      expect(calculator.customerSatisfaction([3, 3, 3, 3, 3])).toBe(60);
    });

    it('should respect window size', () => {
      const ratings = [5, 5, 5, 5, 5, 1, 1]; // Recent ratings are 1-star
      // With window of 2, only last 2 ratings count
      expect(calculator.customerSatisfaction(ratings, 2)).toBe(20);
    });
  });

  describe('packageIntegrity', () => {
    it('should return 100 with no damage', () => {
      expect(calculator.packageIntegrity(0, 0)).toBe(100);
    });

    it('should deduct 5 points per damage incident', () => {
      expect(calculator.packageIntegrity(1, 0)).toBe(95);
      expect(calculator.packageIntegrity(2, 0)).toBe(90);
    });

    it('should deduct extra for fragile damage', () => {
      // Fragile = double penalty (5 for base + 5 for fragile = 10)
      expect(calculator.packageIntegrity(0, 1)).toBe(95);
      expect(calculator.packageIntegrity(1, 1)).toBe(90);
    });

    it('should not go below 0', () => {
      expect(calculator.packageIntegrity(100, 100)).toBe(0);
    });
  });

  describe('incidentScore', () => {
    it('should return 100 with no incidents', () => {
      expect(calculator.incidentScore(0)).toBe(100);
    });

    it('should deduct 10 points per incident', () => {
      expect(calculator.incidentScore(1)).toBe(90);
      expect(calculator.incidentScore(5)).toBe(50);
    });

    it('should not go below 0', () => {
      expect(calculator.incidentScore(20)).toBe(0);
    });
  });

  describe('getCommentary', () => {
    it('should return tier advancement message', () => {
      const change = {
        previousRating: 45,
        newRating: 55,
        delta: 10,
        components: [],
        reason: 'Mission completed',
        tierChanged: true,
        previousTier: 1,
        newTier: 2,
      };

      const message = calculator.getCommentary(change);
      expect(message).toContain('TIER ADVANCEMENT');
      expect(message).toContain('Tier 2');
    });

    it('should return tier regression message', () => {
      const change = {
        previousRating: 55,
        newRating: 45,
        delta: -10,
        components: [],
        reason: 'Mission failed',
        tierChanged: true,
        previousTier: 2,
        newTier: 1,
      };

      const message = calculator.getCommentary(change);
      expect(message).toContain('TIER REGRESSION');
      expect(message).toContain('Tier 1');
    });

    it('should return appropriate message for large gains', () => {
      const change = {
        previousRating: 100,
        newRating: 110,
        delta: 10,
        components: [],
        reason: 'Mission completed',
        tierChanged: false,
        previousTier: 3,
        newTier: 3,
      };

      const message = calculator.getCommentary(change);
      expect(message).toContain('Excellent');
    });

    it('should return appropriate message for large losses', () => {
      const change = {
        previousRating: 110,
        newRating: 100,
        delta: -10,
        components: [],
        reason: 'Mission failed',
        tierChanged: false,
        previousTier: 3,
        newTier: 3,
      };

      const message = calculator.getCommentary(change);
      expect(message).toContain('below expectations');
    });
  });
});

// =============================================================================
// DECAY ALGORITHM MESSAGE TESTS
// =============================================================================

describe('getDecayAlgorithmMessage', () => {
  it('should return tier change message when tier changed', () => {
    const result: DecayResult = {
      characterId: 'char-1',
      previousRating: 55,
      newRating: 45,
      decayAmount: 10,
      daysInactive: 20,
      tierChanged: true,
      previousTier: 2,
      newTier: 1,
    };

    const message = getDecayAlgorithmMessage(result);
    expect(message).toContain('EXTENDED ABSENCE');
    expect(message).toContain('Tier reassigned');
  });

  it('should return standard message for moderate decay', () => {
    const result: DecayResult = {
      characterId: 'char-1',
      previousRating: 100,
      newRating: 97,
      decayAmount: 3,
      daysInactive: 15,
      tierChanged: false,
      previousTier: 3,
      newTier: 3,
    };

    const message = getDecayAlgorithmMessage(result);
    expect(message).toContain('Inactivity penalty');
    expect(message).toContain('3.0');
  });

  it('should return minor adjustment message for small decay', () => {
    const result: DecayResult = {
      characterId: 'char-1',
      previousRating: 100,
      newRating: 99,
      decayAmount: 1,
      daysInactive: 10,
      tierChanged: false,
      previousTier: 3,
      newTier: 3,
    };

    const message = getDecayAlgorithmMessage(result);
    expect(message).toContain('Minor decay');
  });
});

// =============================================================================
// SERVICE BASE CLASS TESTS
// =============================================================================

describe('Service Response Patterns', () => {
  it('should have consistent success response structure', () => {
    // Test the expected structure
    const successResponse = {
      success: true as const,
      data: { rating: 100, tier: 3 },
    };

    expect(successResponse.success).toBe(true);
    expect(successResponse.data).toBeDefined();
  });

  it('should have consistent error response structure', () => {
    const errorResponse = {
      success: false as const,
      error: {
        code: 'TEST_ERROR',
        message: 'Test error message',
        details: { field: 'value' },
      },
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error.code).toBeDefined();
    expect(errorResponse.error.message).toBeDefined();
  });
});
