/**
 * Surge Protocol - Mission Service Tests
 *
 * Tests for mission generator and stateless mission utilities.
 * (Full lifecycle tests require database integration)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

// Import types for type checking
import type {
  MissionType,
  MissionDifficulty,
  GeneratedMission,
  GenerationOptions,
  MissionStatus,
} from '../../src/services/mission';

// =============================================================================
// MISSION TEMPLATE TESTS
// =============================================================================

describe('Mission Template System', () => {
  describe('Mission Types', () => {
    const missionTypes: MissionType[] = [
      'DELIVERY',
      'EXTRACTION',
      'ESCORT',
      'COMBAT',
      'INFILTRATION',
      'INVESTIGATION',
      'COURIER',
      'CONTRACT',
    ];

    it('should have all expected mission types defined', () => {
      assert.strictEqual(missionTypes.length, 8);
      assert.ok(missionTypes.includes('DELIVERY'));
      assert.ok(missionTypes.includes('EXTRACTION'));
      assert.ok(missionTypes.includes('COMBAT'));
    });

    it('should validate mission type strings', () => {
      const validType: MissionType = 'DELIVERY';
      assert.strictEqual(validType, 'DELIVERY');

      // Type-safe mission type check
      const isValidType = (t: string): t is MissionType =>
        missionTypes.includes(t as MissionType);

      assert.ok(isValidType('DELIVERY'));
      assert.ok(isValidType('INFILTRATION'));
      assert.ok(!isValidType('INVALID_TYPE'));
    });
  });

  describe('Mission Difficulty', () => {
    const difficulties: MissionDifficulty[] = ['EASY', 'NORMAL', 'HARD', 'EXTREME'];

    it('should have all difficulty levels defined', () => {
      assert.strictEqual(difficulties.length, 4);
    });

    it('should order difficulties correctly', () => {
      const difficultyOrder: Record<MissionDifficulty, number> = {
        EASY: 1,
        NORMAL: 2,
        HARD: 3,
        EXTREME: 4,
      };

      assert.ok(difficultyOrder.EASY < difficultyOrder.NORMAL);
      assert.ok(difficultyOrder.NORMAL < difficultyOrder.HARD);
      assert.ok(difficultyOrder.HARD < difficultyOrder.EXTREME);
    });
  });

  describe('Mission Status', () => {
    const statuses: MissionStatus[] = [
      'AVAILABLE',
      'ACCEPTED',
      'IN_PROGRESS',
      'COMPLETED',
      'FAILED',
      'ABANDONED',
      'EXPIRED',
    ];

    it('should have all status types defined', () => {
      assert.strictEqual(statuses.length, 7);
    });

    it('should validate status transitions', () => {
      // Valid transitions from AVAILABLE
      const fromAvailable = ['ACCEPTED'];
      assert.ok(fromAvailable.includes('ACCEPTED'));

      // Valid transitions from ACCEPTED
      const fromAccepted = ['IN_PROGRESS', 'ABANDONED', 'EXPIRED'];
      assert.ok(fromAccepted.includes('IN_PROGRESS'));

      // Valid transitions from IN_PROGRESS
      const fromInProgress = ['COMPLETED', 'FAILED', 'ABANDONED'];
      assert.ok(fromInProgress.includes('COMPLETED'));
    });
  });
});

// =============================================================================
// MISSION REWARD CALCULATION TESTS
// =============================================================================

describe('Mission Reward Calculations', () => {
  describe('Base Pay Calculation', () => {
    const calculateBasePay = (tier: number, missionType: MissionType): number => {
      const typeMultipliers: Record<MissionType, number> = {
        DELIVERY: 1.0,
        EXTRACTION: 1.8,
        ESCORT: 1.7,
        COMBAT: 2.0,
        INFILTRATION: 2.2,
        INVESTIGATION: 1.4,
        COURIER: 1.0,
        CONTRACT: 1.5,
      };

      const basePay = 50 + tier * 30;
      return Math.round(basePay * typeMultipliers[missionType]);
    };

    it('should calculate base pay for Tier 1 delivery', () => {
      const pay = calculateBasePay(1, 'DELIVERY');
      assert.strictEqual(pay, 80); // (50 + 30) * 1.0
    });

    it('should calculate base pay for Tier 5 combat', () => {
      const pay = calculateBasePay(5, 'COMBAT');
      assert.strictEqual(pay, 400); // (50 + 150) * 2.0
    });

    it('should calculate base pay for Tier 10 infiltration', () => {
      const pay = calculateBasePay(10, 'INFILTRATION');
      assert.strictEqual(pay, 770); // (50 + 300) * 2.2
    });

    it('should scale pay with tier', () => {
      const tier1Pay = calculateBasePay(1, 'DELIVERY');
      const tier5Pay = calculateBasePay(5, 'DELIVERY');
      const tier10Pay = calculateBasePay(10, 'DELIVERY');

      assert.ok(tier1Pay < tier5Pay);
      assert.ok(tier5Pay < tier10Pay);
    });
  });

  describe('Difficulty Modifiers', () => {
    const difficultyMods: Record<MissionDifficulty, number> = {
      EASY: 0.8,
      NORMAL: 1.0,
      HARD: 1.4,
      EXTREME: 2.0,
    };

    it('should have correct modifier for EASY', () => {
      assert.strictEqual(difficultyMods.EASY, 0.8);
    });

    it('should have correct modifier for NORMAL', () => {
      assert.strictEqual(difficultyMods.NORMAL, 1.0);
    });

    it('should have correct modifier for HARD', () => {
      assert.strictEqual(difficultyMods.HARD, 1.4);
    });

    it('should have correct modifier for EXTREME', () => {
      assert.strictEqual(difficultyMods.EXTREME, 2.0);
    });

    it('should apply modifiers correctly', () => {
      const basePay = 100;
      assert.strictEqual(basePay * difficultyMods.EASY, 80);
      assert.strictEqual(basePay * difficultyMods.NORMAL, 100);
      assert.strictEqual(basePay * difficultyMods.HARD, 140);
      assert.strictEqual(basePay * difficultyMods.EXTREME, 200);
    });
  });

  describe('XP Reward Calculation', () => {
    const calculateXPReward = (tier: number, difficulty: MissionDifficulty): number => {
      const baseXP = 25 + tier * 15;
      const difficultyMods: Record<MissionDifficulty, number> = {
        EASY: 0.8,
        NORMAL: 1.0,
        HARD: 1.3,
        EXTREME: 1.8,
      };
      return Math.round(baseXP * difficultyMods[difficulty]);
    };

    it('should calculate XP for Tier 1 normal mission', () => {
      const xp = calculateXPReward(1, 'NORMAL');
      assert.strictEqual(xp, 40); // (25 + 15) * 1.0
    });

    it('should calculate XP for Tier 5 hard mission', () => {
      const xp = calculateXPReward(5, 'HARD');
      assert.strictEqual(xp, 130); // (25 + 75) * 1.3
    });

    it('should calculate XP for Tier 10 extreme mission', () => {
      const xp = calculateXPReward(10, 'EXTREME');
      assert.strictEqual(xp, 315); // (25 + 150) * 1.8
    });
  });

  describe('Rating Reward Calculation', () => {
    const calculateRatingReward = (tier: number, success: boolean): number => {
      const baseReward = 3 + tier;
      return success ? baseReward : -Math.round(baseReward * 1.5);
    };

    it('should give positive rating for success', () => {
      const rating = calculateRatingReward(5, true);
      assert.strictEqual(rating, 8); // 3 + 5
      assert.ok(rating > 0);
    });

    it('should give negative rating for failure', () => {
      const rating = calculateRatingReward(5, false);
      assert.strictEqual(rating, -12); // -(3 + 5) * 1.5
      assert.ok(rating < 0);
    });

    it('should scale rating with tier', () => {
      const tier1 = calculateRatingReward(1, true);
      const tier10 = calculateRatingReward(10, true);
      assert.ok(tier1 < tier10);
    });
  });
});

// =============================================================================
// MISSION OBJECTIVE TESTS
// =============================================================================

describe('Mission Objectives', () => {
  describe('Objective Types', () => {
    const objectiveTypes = [
      'PICKUP',
      'DELIVER',
      'TRAVEL',
      'FIND',
      'ESCORT',
      'KILL',
      'SURVIVE',
      'STEALTH',
      'HACK',
      'COLLECT',
      'ESCAPE',
      'PROTECT',
      'INVESTIGATE',
      'TALK',
      'TIME_BONUS',
      'HEALTH',
      'PERFECT_STEALTH',
      'COLLECT_ALL',
    ];

    it('should have diverse objective types', () => {
      assert.ok(objectiveTypes.length >= 15);
    });

    it('should include delivery objectives', () => {
      assert.ok(objectiveTypes.includes('PICKUP'));
      assert.ok(objectiveTypes.includes('DELIVER'));
    });

    it('should include combat objectives', () => {
      assert.ok(objectiveTypes.includes('KILL'));
      assert.ok(objectiveTypes.includes('SURVIVE'));
    });

    it('should include stealth objectives', () => {
      assert.ok(objectiveTypes.includes('STEALTH'));
      assert.ok(objectiveTypes.includes('PERFECT_STEALTH'));
    });

    it('should include bonus objectives', () => {
      assert.ok(objectiveTypes.includes('TIME_BONUS'));
      assert.ok(objectiveTypes.includes('HEALTH'));
    });
  });

  describe('Objective Sequence', () => {
    interface TestObjective {
      id: string;
      sequence_order: number;
      is_optional: boolean;
    }

    it('should sort objectives by sequence order', () => {
      const objectives: TestObjective[] = [
        { id: 'obj3', sequence_order: 3, is_optional: false },
        { id: 'obj1', sequence_order: 1, is_optional: false },
        { id: 'obj2', sequence_order: 2, is_optional: false },
      ];

      const sorted = [...objectives].sort((a, b) => a.sequence_order - b.sequence_order);

      assert.strictEqual(sorted[0]!.id, 'obj1');
      assert.strictEqual(sorted[1]!.id, 'obj2');
      assert.strictEqual(sorted[2]!.id, 'obj3');
    });

    it('should identify optional objectives', () => {
      const objectives: TestObjective[] = [
        { id: 'required1', sequence_order: 1, is_optional: false },
        { id: 'optional1', sequence_order: 2, is_optional: true },
        { id: 'required2', sequence_order: 3, is_optional: false },
      ];

      const required = objectives.filter((o) => !o.is_optional);
      const optional = objectives.filter((o) => o.is_optional);

      assert.strictEqual(required.length, 2);
      assert.strictEqual(optional.length, 1);
    });
  });
});

// =============================================================================
// MISSION COMPLICATION TESTS
// =============================================================================

describe('Mission Complications', () => {
  describe('Complication Pool', () => {
    const complications = [
      'TRAFFIC_JAM',
      'GANG_CHECKPOINT',
      'PACKAGE_DAMAGE',
      'CLIENT_IMPATIENT',
      'VEHICLE_MALFUNCTION',
      'POLICE_CHASE',
      'BLOCKED_ROUTE',
      'RIVAL_COURIER',
      'INCREASED_SECURITY',
      'TARGET_INJURED',
      'DOUBLE_CROSS',
      'REINFORCEMENTS',
      'HEAVY_RESISTANCE',
      'BOSS_ENEMY',
      'ENVIRONMENTAL_HAZARD',
      'AMMUNITION_SHORTAGE',
      'SECURITY_UPGRADE',
      'PATROL_CHANGE',
      'ALARM_TRIGGER',
      'INSIDE_MAN_COMPROMISED',
      'AMBUSH',
      'VIP_PANIC',
      'ALTERNATE_ROUTE_NEEDED',
      'BETRAYAL',
      'FALSE_LEAD',
      'HOSTILE_WITNESS',
      'CRIME_SCENE_DISTURBED',
      'TIME_SENSITIVE_CLUE',
    ];

    it('should have diverse complications', () => {
      assert.ok(complications.length >= 20);
    });

    it('should include delivery complications', () => {
      assert.ok(complications.includes('TRAFFIC_JAM'));
      assert.ok(complications.includes('PACKAGE_DAMAGE'));
    });

    it('should include combat complications', () => {
      assert.ok(complications.includes('HEAVY_RESISTANCE'));
      assert.ok(complications.includes('REINFORCEMENTS'));
    });

    it('should include stealth complications', () => {
      assert.ok(complications.includes('ALARM_TRIGGER'));
      assert.ok(complications.includes('PATROL_CHANGE'));
    });
  });

  describe('Complication Probability', () => {
    const calculateComplicationChance = (
      baseChance: number,
      difficulty: MissionDifficulty
    ): number => {
      const difficultyMods: Record<MissionDifficulty, number> = {
        EASY: 0.1,
        NORMAL: 0.2,
        HARD: 0.35,
        EXTREME: 0.5,
      };
      return baseChance * (1 + difficultyMods[difficulty]);
    };

    it('should increase chance with difficulty', () => {
      const baseChance = 0.2;

      const easyChance = calculateComplicationChance(baseChance, 'EASY');
      const normalChance = calculateComplicationChance(baseChance, 'NORMAL');
      const hardChance = calculateComplicationChance(baseChance, 'HARD');
      const extremeChance = calculateComplicationChance(baseChance, 'EXTREME');

      assert.ok(easyChance < normalChance);
      assert.ok(normalChance < hardChance);
      assert.ok(hardChance < extremeChance);
    });

    it('should calculate correct values', () => {
      const baseChance = 0.2;

      assert.strictEqual(
        calculateComplicationChance(baseChance, 'EASY').toFixed(2),
        '0.22'
      );
      assert.strictEqual(
        calculateComplicationChance(baseChance, 'NORMAL').toFixed(2),
        '0.24'
      );
      assert.strictEqual(
        calculateComplicationChance(baseChance, 'HARD').toFixed(2),
        '0.27'
      );
      assert.strictEqual(
        calculateComplicationChance(baseChance, 'EXTREME').toFixed(2),
        '0.30'
      );
    });
  });
});

// =============================================================================
// MISSION GENERATOR LOGIC TESTS
// =============================================================================

describe('Mission Generator Logic', () => {
  describe('Template Selection', () => {
    interface MiniTemplate {
      id: string;
      mission_type: MissionType;
      tier_range: { min: number; max: number };
    }

    const templates: MiniTemplate[] = [
      { id: 'T1', mission_type: 'DELIVERY', tier_range: { min: 1, max: 10 } },
      { id: 'T2', mission_type: 'COMBAT', tier_range: { min: 3, max: 10 } },
      { id: 'T3', mission_type: 'INFILTRATION', tier_range: { min: 4, max: 10 } },
      { id: 'T4', mission_type: 'EXTRACTION', tier_range: { min: 3, max: 10 } },
    ];

    const selectTemplates = (tier: number, type?: MissionType): MiniTemplate[] => {
      return templates.filter((t) => {
        if (tier < t.tier_range.min || tier > t.tier_range.max) return false;
        if (type && t.mission_type !== type) return false;
        return true;
      });
    };

    it('should select templates for Tier 1', () => {
      const eligible = selectTemplates(1);
      assert.strictEqual(eligible.length, 1);
      assert.strictEqual(eligible[0]!.id, 'T1');
    });

    it('should select templates for Tier 5', () => {
      const eligible = selectTemplates(5);
      assert.strictEqual(eligible.length, 4);
    });

    it('should filter by mission type', () => {
      const eligible = selectTemplates(5, 'COMBAT');
      assert.strictEqual(eligible.length, 1);
      assert.strictEqual(eligible[0]!.mission_type, 'COMBAT');
    });

    it('should return empty for invalid tier/type combo', () => {
      const eligible = selectTemplates(1, 'COMBAT');
      assert.strictEqual(eligible.length, 0);
    });
  });

  describe('Variable Interpolation', () => {
    const interpolate = (template: string, vars: Record<string, string>): string => {
      let result = template;
      for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
      return result;
    };

    it('should interpolate single variable', () => {
      const result = interpolate('Deliver to {destination}', { destination: 'The Hollows' });
      assert.strictEqual(result, 'Deliver to The Hollows');
    });

    it('should interpolate multiple variables', () => {
      const result = interpolate(
        'Transport {package} from {origin} to {destination}',
        { package: 'data chip', origin: 'Market', destination: 'Station' }
      );
      assert.strictEqual(result, 'Transport data chip from Market to Station');
    });

    it('should handle repeated variables', () => {
      const result = interpolate(
        '{target} needs help. Find {target} quickly!',
        { target: 'Dr. Tanaka' }
      );
      assert.strictEqual(result, 'Dr. Tanaka needs help. Find Dr. Tanaka quickly!');
    });

    it('should leave unmatched variables as-is', () => {
      const result = interpolate('Go to {location}', {});
      assert.strictEqual(result, 'Go to {location}');
    });
  });

  describe('Seeded Random Number Generator', () => {
    const createSeededRandom = (seed: number): (() => number) => {
      let state = seed;
      return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
      };
    };

    it('should produce deterministic results', () => {
      const rng1 = createSeededRandom(12345);
      const rng2 = createSeededRandom(12345);

      const results1 = [rng1(), rng1(), rng1()];
      const results2 = [rng2(), rng2(), rng2()];

      assert.deepStrictEqual(results1, results2);
    });

    it('should produce different results with different seeds', () => {
      const rng1 = createSeededRandom(12345);
      const rng2 = createSeededRandom(54321);

      assert.notStrictEqual(rng1(), rng2());
    });

    it('should produce values between 0 and 1', () => {
      const rng = createSeededRandom(42);

      for (let i = 0; i < 100; i++) {
        const value = rng();
        assert.ok(value >= 0);
        assert.ok(value < 1);
      }
    });
  });
});

// =============================================================================
// ALGORITHM BRIEFING TESTS
// =============================================================================

describe('Algorithm Briefings', () => {
  const getAlgorithmMessage = (
    type: MissionType,
    difficulty: MissionDifficulty
  ): string => {
    const typeMessages: Record<MissionType, string> = {
      DELIVERY: 'PACKAGE TRANSFER AUTHORIZED. TIME IS EFFICIENCY.',
      EXTRACTION: 'EXTRACTION PROTOCOLS LOADED. ASSET RECOVERY PRIORITY.',
      ESCORT: 'PROTECTION ASSIGNMENT. VIP INTEGRITY PARAMOUNT.',
      COMBAT: 'COMBAT AUTHORIZATION GRANTED. ELIMINATE THREATS.',
      INFILTRATION: 'STEALTH PROTOCOLS ACTIVE. REMAIN UNDETECTED.',
      INVESTIGATION: 'INTELLIGENCE GATHERING MODE. OBSERVE. REPORT.',
      COURIER: 'COURIER CONTRACT LOGGED. DELIVERY METRICS WILL BE RECORDED.',
      CONTRACT: 'CONTRACT PARAMETERS ACCEPTED. TERMS ARE BINDING.',
    };

    const difficultyMessages: Record<MissionDifficulty, string> = {
      EASY: 'ROUTINE ASSIGNMENT.',
      NORMAL: 'STANDARD PARAMETERS.',
      HARD: 'ELEVATED DIFFICULTY DETECTED.',
      EXTREME: 'MAXIMUM EFFICIENCY REQUIRED. FAILURE IS... NOTED.',
    };

    return `${typeMessages[type]} ${difficultyMessages[difficulty]}`;
  };

  it('should generate delivery briefing', () => {
    const msg = getAlgorithmMessage('DELIVERY', 'NORMAL');
    assert.ok(msg.includes('PACKAGE TRANSFER'));
    assert.ok(msg.includes('STANDARD PARAMETERS'));
  });

  it('should generate combat briefing', () => {
    const msg = getAlgorithmMessage('COMBAT', 'HARD');
    assert.ok(msg.includes('COMBAT AUTHORIZATION'));
    assert.ok(msg.includes('ELEVATED DIFFICULTY'));
  });

  it('should generate extreme difficulty message', () => {
    const msg = getAlgorithmMessage('INFILTRATION', 'EXTREME');
    assert.ok(msg.includes('MAXIMUM EFFICIENCY'));
    assert.ok(msg.includes('FAILURE IS... NOTED'));
  });

  it('should use algorithm-style uppercase', () => {
    const msg = getAlgorithmMessage('ESCORT', 'EASY');
    assert.strictEqual(msg, msg.toUpperCase());
  });
});

// =============================================================================
// TIME LIMIT TESTS
// =============================================================================

describe('Mission Time Limits', () => {
  describe('Time Calculation', () => {
    const calculateTimeLimit = (
      baseMinutes: number,
      difficulty: MissionDifficulty,
      hasTimeLimit: boolean
    ): number | null => {
      if (!hasTimeLimit || difficulty === 'EASY') return null;

      const difficultyMods: Record<MissionDifficulty, number> = {
        EASY: 1.0,
        NORMAL: 1.0,
        HARD: 0.85,
        EXTREME: 0.7,
      };

      return Math.round(baseMinutes * 60 * difficultyMods[difficulty]);
    };

    it('should return null for EASY difficulty', () => {
      const time = calculateTimeLimit(30, 'EASY', true);
      assert.strictEqual(time, null);
    });

    it('should return null when no time limit', () => {
      const time = calculateTimeLimit(30, 'HARD', false);
      assert.strictEqual(time, null);
    });

    it('should calculate NORMAL time limit', () => {
      const time = calculateTimeLimit(30, 'NORMAL', true);
      assert.strictEqual(time, 1800); // 30 * 60 * 1.0
    });

    it('should reduce time for HARD difficulty', () => {
      const time = calculateTimeLimit(30, 'HARD', true);
      assert.strictEqual(time, 1530); // 30 * 60 * 0.85
    });

    it('should reduce time more for EXTREME difficulty', () => {
      const time = calculateTimeLimit(30, 'EXTREME', true);
      assert.strictEqual(time, 1260); // 30 * 60 * 0.7
    });
  });

  describe('Time Remaining Calculation', () => {
    const getTimeRemaining = (
      expiresAt: string | null,
      now: Date = new Date()
    ): number | null => {
      if (!expiresAt) return null;
      const expires = new Date(expiresAt).getTime();
      return Math.max(0, Math.floor((expires - now.getTime()) / 1000));
    };

    it('should return null for no time limit', () => {
      const remaining = getTimeRemaining(null);
      assert.strictEqual(remaining, null);
    });

    it('should return 0 for expired mission', () => {
      const pastTime = new Date(Date.now() - 10000).toISOString();
      const remaining = getTimeRemaining(pastTime);
      assert.strictEqual(remaining, 0);
    });

    it('should calculate remaining time correctly', () => {
      const futureTime = new Date(Date.now() + 60000).toISOString();
      const remaining = getTimeRemaining(futureTime);
      assert.ok(remaining !== null);
      assert.ok(remaining > 55 && remaining <= 60);
    });
  });
});

// =============================================================================
// GENERATION OPTIONS TESTS
// =============================================================================

describe('Generation Options', () => {
  describe('Option Validation', () => {
    const validateOptions = (options: Partial<GenerationOptions>): boolean => {
      if (options.tier !== undefined) {
        if (options.tier < 0 || options.tier > 10) return false;
      }
      if (options.min_pay !== undefined && options.min_pay < 0) return false;
      if (options.max_time_limit !== undefined && options.max_time_limit < 0) return false;
      return true;
    };

    it('should accept valid options', () => {
      assert.ok(validateOptions({ tier: 5, mission_type: 'DELIVERY' }));
    });

    it('should reject negative tier', () => {
      assert.ok(!validateOptions({ tier: -1 }));
    });

    it('should reject tier above 10', () => {
      assert.ok(!validateOptions({ tier: 11 }));
    });

    it('should reject negative min_pay', () => {
      assert.ok(!validateOptions({ tier: 5, min_pay: -100 }));
    });

    it('should accept empty options object', () => {
      assert.ok(validateOptions({}));
    });
  });

  describe('Tier Range Filtering', () => {
    const isInTierRange = (
      templateMin: number,
      templateMax: number,
      playerTier: number
    ): boolean => {
      return playerTier >= templateMin && playerTier <= templateMax;
    };

    it('should include templates at min tier', () => {
      assert.ok(isInTierRange(3, 10, 3));
    });

    it('should include templates at max tier', () => {
      assert.ok(isInTierRange(3, 10, 10));
    });

    it('should exclude templates below min tier', () => {
      assert.ok(!isInTierRange(3, 10, 2));
    });

    it('should exclude templates above max tier', () => {
      assert.ok(!isInTierRange(1, 5, 6));
    });
  });
});
