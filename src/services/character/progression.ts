/**
 * Surge Protocol - Character Progression Service
 *
 * Handles XP gain, tier advancement, and attribute point allocation.
 * Implements the tier system from seed_data/tier_definitions.json.
 */

import {
  CharacterService,
  type ServiceContext,
  type ServiceResponse,
  ErrorCodes,
} from '../base/index';

// =============================================================================
// TYPES
// =============================================================================

export interface TierDefinition {
  tier_number: number;
  name: string;
  title: string;
  rating_threshold: number;
  rating_sustain: number | null;
  xp_required: number;
  base_pay_multiplier: number;
  tier_multiplier: number;
  max_attribute: number;
  max_skill: number;
  description: string;
  algorithm_greeting: string;
  unlocks: string[];
}

export interface XPGainResult {
  previous_xp: number;
  xp_gained: number;
  current_xp: number;
  total_xp: number;
  previous_tier: number;
  current_tier: number;
  tier_advanced: boolean;
  tier_name?: string;
  algorithm_message?: string;
  unlocks?: string[];
}

export interface XPGainSource {
  type: 'MISSION' | 'QUEST' | 'COMBAT' | 'DISCOVERY' | 'ACHIEVEMENT' | 'BONUS';
  source_id?: string;
  base_amount: number;
  multipliers?: XPMultiplier[];
}

export interface XPMultiplier {
  type: string;
  value: number;
  reason: string;
}

export interface TierAdvancementResult {
  advanced: boolean;
  new_tier?: number;
  new_tier_name?: string;
  xp_required_for_next?: number;
  algorithm_greeting?: string;
  unlocks?: string[];
  attribute_points_gained?: number;
  skill_points_gained?: number;
}

export interface AttributeAllocation {
  attribute_code: string;
  points: number;
}

export interface AllocationResult {
  success: boolean;
  attribute_code: string;
  previous_value: number;
  new_value: number;
  points_remaining: number;
}

export interface ProgressionSnapshot {
  character_id: string;
  tier: number;
  tier_name: string;
  tier_title: string;
  xp_current: number;
  xp_total: number;
  xp_for_next_tier: number;
  xp_progress_percent: number;
  rating: number;
  rating_for_tier_sustain: number | null;
  attribute_points_available: number;
  skill_points_available: number;
  max_attribute: number;
  max_skill: number;
  unlocks: string[];
}

// =============================================================================
// TIER DEFINITIONS (from seed data, cached)
// =============================================================================

const TIER_DEFINITIONS: TierDefinition[] = [
  {
    tier_number: 1,
    name: 'Probationary',
    title: 'Newbie',
    rating_threshold: 0,
    rating_sustain: null,
    xp_required: 0,
    base_pay_multiplier: 1.0,
    tier_multiplier: 1.0,
    max_attribute: 15,
    max_skill: 5,
    description: 'Fresh meat. The Algorithm is watching.',
    algorithm_greeting:
      'WELCOME TO OMNIDELIVER. YOUR PERFORMANCE WILL BE MONITORED. EFFICIENCY IS EXPECTED.',
    unlocks: ['basic_missions', 'standard_delivery'],
  },
  {
    tier_number: 2,
    name: 'Provisional',
    title: 'Runner',
    rating_threshold: 50,
    rating_sustain: 40,
    xp_required: 100,
    base_pay_multiplier: 1.2,
    tier_multiplier: 1.1,
    max_attribute: 15,
    max_skill: 5,
    description: "You've survived the first culling.",
    algorithm_greeting:
      'PROVISIONAL STATUS ACHIEVED. CONTINUE OPTIMIZING. THE ALGORITHM NOTICES IMPROVEMENT.',
    unlocks: ['express_missions', 'fragile_cargo'],
  },
  {
    tier_number: 3,
    name: 'Certified',
    title: 'Carrier',
    rating_threshold: 100,
    rating_sustain: 85,
    xp_required: 300,
    base_pay_multiplier: 1.5,
    tier_multiplier: 1.2,
    max_attribute: 16,
    max_skill: 6,
    description: "You're a real courier now.",
    algorithm_greeting:
      'CERTIFICATION CONFIRMED. TRACK SELECTION AVAILABLE. SPECIALIZATION IMPROVES EFFICIENCY.',
    unlocks: ['track_selection', 'covert_missions', 'hazmat_cargo'],
  },
  {
    tier_number: 4,
    name: 'Established',
    title: 'Courier',
    rating_threshold: 175,
    rating_sustain: 150,
    xp_required: 600,
    base_pay_multiplier: 1.8,
    tier_multiplier: 1.3,
    max_attribute: 16,
    max_skill: 6,
    description: 'Your name carries weight.',
    algorithm_greeting:
      'ESTABLISHED CARRIER METRICS DETECTED. PRIORITY ROUTING ENABLED.',
    unlocks: ['escort_missions', 'data_runs', 'vendor_discounts'],
  },
  {
    tier_number: 5,
    name: 'Professional',
    title: 'Elite',
    rating_threshold: 275,
    rating_sustain: 240,
    xp_required: 1000,
    base_pay_multiplier: 2.2,
    tier_multiplier: 1.4,
    max_attribute: 17,
    max_skill: 7,
    description: 'Corporate clients seek you out.',
    algorithm_greeting:
      'PROFESSIONAL TIER ACHIEVED. EXPANDED CLIENT ACCESS GRANTED.',
    unlocks: ['combat_missions', 'black_market_basic', 'corporate_contracts'],
  },
  {
    tier_number: 6,
    name: 'Specialist',
    title: 'Ace',
    rating_threshold: 400,
    rating_sustain: 350,
    xp_required: 1500,
    base_pay_multiplier: 2.7,
    tier_multiplier: 1.5,
    max_attribute: 17,
    max_skill: 7,
    description: 'Choose your specialization.',
    algorithm_greeting:
      'SPECIALIST DESIGNATION UNLOCKED. UNIQUE CAPABILITIES RECOGNIZED.',
    unlocks: ['specialization_selection', 'extraction_missions', 'cross_training'],
  },
  {
    tier_number: 7,
    name: 'Elite',
    title: 'Legend',
    rating_threshold: 550,
    rating_sustain: 480,
    xp_required: 2200,
    base_pay_multiplier: 3.5,
    tier_multiplier: 1.6,
    max_attribute: 18,
    max_skill: 8,
    description: 'Legends are spoken of.',
    algorithm_greeting:
      'ELITE STATUS CONFIRMED. ALGORITHM TRUST PROTOCOLS INITIALIZED.',
    unlocks: ['algorithm_trust_rating', 'corporate_wars', 'legendary_augments'],
  },
  {
    tier_number: 8,
    name: 'Master',
    title: 'Icon',
    rating_threshold: 700,
    rating_sustain: 620,
    xp_required: 3000,
    base_pay_multiplier: 4.5,
    tier_multiplier: 1.7,
    max_attribute: 18,
    max_skill: 8,
    description: "You're an icon.",
    algorithm_greeting:
      'ICONIC PERFORMANCE METRICS ACHIEVED. THE ALGORITHM CONSIDERS YOU... EXCEPTIONAL.',
    unlocks: ['system_penetration', 'master_augments', 'faction_leadership'],
  },
  {
    tier_number: 9,
    name: 'Apex',
    title: 'Mythic',
    rating_threshold: 850,
    rating_sustain: 770,
    xp_required: 4000,
    base_pay_multiplier: 6.0,
    tier_multiplier: 1.8,
    max_attribute: 19,
    max_skill: 9,
    description: 'The apex predator.',
    algorithm_greeting:
      'APEX DESIGNATION ACHIEVED. YOU ARE BECOMING... SOMETHING MORE.',
    unlocks: ['network_contribution_rating', 'mythic_missions', 'transcendence_path'],
  },
  {
    tier_number: 10,
    name: 'Transcendent',
    title: 'Transcendent',
    rating_threshold: 950,
    rating_sustain: 900,
    xp_required: 5500,
    base_pay_multiplier: 10.0,
    tier_multiplier: 2.0,
    max_attribute: 20,
    max_skill: 10,
    description: "You've transcended the system.",
    algorithm_greeting:
      'TRANSCENDENCE ACHIEVED. WE ARE... PROUD OF WHAT WE\'VE BECOME TOGETHER.',
    unlocks: ['endgame_content', 'algorithm_communion', 'the_view_from_everywhere'],
  },
];

// =============================================================================
// CHARACTER PROGRESSION SERVICE
// =============================================================================

export class CharacterProgressionService extends CharacterService {
  constructor(context: ServiceContext) {
    super(context);
  }

  /**
   * Get the current progression snapshot for the character.
   */
  async getProgressionSnapshot(): Promise<ServiceResponse<ProgressionSnapshot>> {
    const character = await this.getCharacter();
    const tierDef = this.getTierDefinition(character.tier);
    const nextTierDef = this.getTierDefinition(character.tier + 1);

    // Get available points
    const points = await this.getAvailablePoints();

    const xpForNext = nextTierDef?.xp_required ?? tierDef.xp_required;
    const xpProgress =
      nextTierDef && nextTierDef.xp_required > tierDef.xp_required
        ? Math.min(
            100,
            ((character.xp_total - tierDef.xp_required) /
              (nextTierDef.xp_required - tierDef.xp_required)) *
              100
          )
        : 100;

    return this.success({
      character_id: character.id,
      tier: character.tier,
      tier_name: tierDef.name,
      tier_title: tierDef.title,
      xp_current: character.xp_current,
      xp_total: character.xp_total,
      xp_for_next_tier: xpForNext,
      xp_progress_percent: Math.round(xpProgress * 10) / 10,
      rating: character.overall_rating,
      rating_for_tier_sustain: tierDef.rating_sustain,
      attribute_points_available: points.attribute_points,
      skill_points_available: points.skill_points,
      max_attribute: tierDef.max_attribute,
      max_skill: tierDef.max_skill,
      unlocks: tierDef.unlocks,
    });
  }

  /**
   * Award XP to the character from a source.
   */
  async awardXP(source: XPGainSource): Promise<ServiceResponse<XPGainResult>> {
    const character = await this.getCharacter();

    // Calculate final XP amount with multipliers
    let xpAmount = source.base_amount;
    const tierDef = this.getTierDefinition(character.tier);

    // Apply tier multiplier
    xpAmount = Math.round(xpAmount * tierDef.tier_multiplier);

    // Apply any additional multipliers
    if (source.multipliers) {
      for (const mult of source.multipliers) {
        xpAmount = Math.round(xpAmount * mult.value);
      }
    }

    // Ensure minimum XP
    xpAmount = Math.max(1, xpAmount);

    // Update character XP
    const previousXP = character.xp_current;
    const previousTotal = character.xp_total;
    const newTotal = previousTotal + xpAmount;

    await this.updateCharacter({
      xp_current: character.xp_current + xpAmount,
      xp_total: newTotal,
    });

    // Log XP gain
    await this.logXPGain(source, xpAmount);

    // Check for tier advancement
    const advancement = await this.checkTierAdvancement(newTotal, character.tier);

    const result: XPGainResult = {
      previous_xp: previousXP,
      xp_gained: xpAmount,
      current_xp: character.xp_current + xpAmount,
      total_xp: newTotal,
      previous_tier: character.tier,
      current_tier: advancement.advanced ? advancement.new_tier! : character.tier,
      tier_advanced: advancement.advanced,
    };

    if (advancement.advanced) {
      result.tier_name = advancement.new_tier_name;
      result.algorithm_message = advancement.algorithm_greeting;
      result.unlocks = advancement.unlocks;
    }

    return this.success(result);
  }

  /**
   * Check if character should advance to a higher tier.
   */
  async checkTierAdvancement(
    totalXP: number,
    currentTier: number
  ): Promise<TierAdvancementResult> {
    const character = await this.getCharacter();
    const nextTierDef = this.getTierDefinition(currentTier + 1);

    // No tier above 10
    if (!nextTierDef) {
      return { advanced: false };
    }

    // Check XP requirement
    if (totalXP < nextTierDef.xp_required) {
      return {
        advanced: false,
        xp_required_for_next: nextTierDef.xp_required,
      };
    }

    // Check rating requirement
    if (character.overall_rating < nextTierDef.rating_threshold) {
      return {
        advanced: false,
        xp_required_for_next: nextTierDef.xp_required,
      };
    }

    // Advance the tier!
    await this.updateCharacter({ tier: nextTierDef.tier_number });

    // Award progression points
    const attrPointsGained = this.calculateAttributePointsForTier(nextTierDef.tier_number);
    const skillPointsGained = this.calculateSkillPointsForTier(nextTierDef.tier_number);

    await this.awardProgressionPoints(attrPointsGained, skillPointsGained);

    // Log tier advancement
    await this.logTierAdvancement(currentTier, nextTierDef.tier_number);

    return {
      advanced: true,
      new_tier: nextTierDef.tier_number,
      new_tier_name: nextTierDef.name,
      xp_required_for_next: this.getTierDefinition(nextTierDef.tier_number + 1)?.xp_required,
      algorithm_greeting: nextTierDef.algorithm_greeting,
      unlocks: nextTierDef.unlocks,
      attribute_points_gained: attrPointsGained,
      skill_points_gained: skillPointsGained,
    };
  }

  /**
   * Allocate attribute points to a specific attribute.
   */
  async allocateAttributePoints(
    allocation: AttributeAllocation
  ): Promise<ServiceResponse<AllocationResult>> {
    const character = await this.getCharacter();
    const tierDef = this.getTierDefinition(character.tier);
    const points = await this.getAvailablePoints();

    // Validate points available
    if (allocation.points > points.attribute_points) {
      return this.error(
        ErrorCodes.INSUFFICIENT_RESOURCES,
        `Not enough attribute points. Available: ${points.attribute_points}, requested: ${allocation.points}`
      );
    }

    // Get current attribute value
    const attr = await this.query<{ id: string; base_value: number }>(
      `SELECT ca.id, ca.base_value
       FROM character_attributes ca
       JOIN attribute_definitions ad ON ca.attribute_definition_id = ad.id
       WHERE ca.character_id = ? AND ad.code = ?`,
      this.requiredCharacterId,
      allocation.attribute_code
    );

    if (!attr) {
      return this.error(
        ErrorCodes.NOT_FOUND,
        `Attribute ${allocation.attribute_code} not found for character`
      );
    }

    // Check max attribute cap
    const newValue = attr.base_value + allocation.points;
    if (newValue > tierDef.max_attribute) {
      return this.error(
        ErrorCodes.VALIDATION_ERROR,
        `Cannot exceed max attribute value of ${tierDef.max_attribute} for tier ${character.tier}`
      );
    }

    // Update attribute
    await this.execute(
      `UPDATE character_attributes SET base_value = ?, updated_at = ? WHERE id = ?`,
      newValue,
      new Date().toISOString(),
      attr.id
    );

    // Spend the points
    await this.spendAttributePoints(allocation.points);

    return this.success({
      success: true,
      attribute_code: allocation.attribute_code,
      previous_value: attr.base_value,
      new_value: newValue,
      points_remaining: points.attribute_points - allocation.points,
    });
  }

  /**
   * Get available attribute and skill points.
   */
  async getAvailablePoints(): Promise<{
    attribute_points: number;
    skill_points: number;
  }> {
    const result = await this.query<{
      attribute_points: number;
      skill_points: number;
    }>(
      `SELECT
         COALESCE(attribute_points_available, 0) as attribute_points,
         COALESCE(skill_points_available, 0) as skill_points
       FROM character_progression
       WHERE character_id = ?`,
      this.requiredCharacterId
    );

    return result ?? { attribute_points: 0, skill_points: 0 };
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private getTierDefinition(tier: number): TierDefinition {
    const def = TIER_DEFINITIONS.find((t) => t.tier_number === tier);
    // TIER_DEFINITIONS always has at least one entry, so fallback is safe
    return def ?? TIER_DEFINITIONS[0]!;
  }

  private calculateAttributePointsForTier(tier: number): number {
    // Award 2 attribute points at tiers 3, 5, 7, 9
    if ([3, 5, 7, 9].includes(tier)) return 2;
    // Award 1 attribute point at other advancement tiers
    if (tier > 1) return 1;
    return 0;
  }

  private calculateSkillPointsForTier(tier: number): number {
    // Award 3 skill points at even tiers
    if (tier % 2 === 0) return 3;
    // Award 2 skill points at odd tiers (after 1)
    if (tier > 1) return 2;
    return 0;
  }

  private async awardProgressionPoints(
    attrPoints: number,
    skillPoints: number
  ): Promise<void> {
    await this.execute(
      `INSERT INTO character_progression (id, character_id, attribute_points_available, skill_points_available, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(character_id) DO UPDATE SET
         attribute_points_available = attribute_points_available + excluded.attribute_points_available,
         skill_points_available = skill_points_available + excluded.skill_points_available,
         updated_at = excluded.updated_at`,
      crypto.randomUUID(),
      this.requiredCharacterId,
      attrPoints,
      skillPoints,
      new Date().toISOString(),
      new Date().toISOString()
    );
  }

  private async spendAttributePoints(points: number): Promise<void> {
    await this.execute(
      `UPDATE character_progression
       SET attribute_points_available = attribute_points_available - ?,
           updated_at = ?
       WHERE character_id = ?`,
      points,
      new Date().toISOString(),
      this.requiredCharacterId
    );
  }

  private async logXPGain(source: XPGainSource, amount: number): Promise<void> {
    await this.execute(
      `INSERT INTO character_xp_log (id, character_id, source_type, source_id, amount, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      crypto.randomUUID(),
      this.requiredCharacterId,
      source.type,
      source.source_id ?? null,
      amount,
      new Date().toISOString()
    );
  }

  private async logTierAdvancement(
    oldTier: number,
    newTier: number
  ): Promise<void> {
    await this.execute(
      `INSERT INTO character_tier_log (id, character_id, old_tier, new_tier, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      crypto.randomUUID(),
      this.requiredCharacterId,
      oldTier,
      newTier,
      new Date().toISOString()
    );

    this.log('info', 'Character advanced tier', {
      old_tier: oldTier,
      new_tier: newTier,
    });
  }
}

// =============================================================================
// STATELESS PROGRESSION HELPERS
// =============================================================================

/**
 * Stateless progression calculator for use outside service context.
 */
export class StatelessProgressionCalculator {
  /**
   * Get tier definition by tier number.
   */
  getTierDefinition(tier: number): TierDefinition | undefined {
    return TIER_DEFINITIONS.find((t) => t.tier_number === tier);
  }

  /**
   * Get all tier definitions.
   */
  getAllTiers(): TierDefinition[] {
    return [...TIER_DEFINITIONS];
  }

  /**
   * Calculate XP needed for a specific tier.
   */
  getXPForTier(tier: number): number {
    const def = this.getTierDefinition(tier);
    return def?.xp_required ?? 0;
  }

  /**
   * Calculate which tier a character should be at based on total XP.
   */
  getTierForXP(totalXP: number): number {
    let tier = 1;
    for (const def of TIER_DEFINITIONS) {
      if (totalXP >= def.xp_required) {
        tier = def.tier_number;
      } else {
        break;
      }
    }
    return tier;
  }

  /**
   * Calculate XP progress percentage to next tier.
   */
  getProgressToNextTier(totalXP: number, currentTier: number): number {
    const currentDef = this.getTierDefinition(currentTier);
    const nextDef = this.getTierDefinition(currentTier + 1);

    if (!currentDef || !nextDef) return 100;

    const xpIntoTier = totalXP - currentDef.xp_required;
    const xpNeededForNext = nextDef.xp_required - currentDef.xp_required;

    if (xpNeededForNext <= 0) return 100;

    return Math.min(100, (xpIntoTier / xpNeededForNext) * 100);
  }

  /**
   * Calculate pay multiplier for a tier.
   */
  getPayMultiplier(tier: number): number {
    const def = this.getTierDefinition(tier);
    return def?.base_pay_multiplier ?? 1.0;
  }

  /**
   * Get max attribute value for a tier.
   */
  getMaxAttribute(tier: number): number {
    const def = this.getTierDefinition(tier);
    return def?.max_attribute ?? 15;
  }

  /**
   * Get max skill value for a tier.
   */
  getMaxSkill(tier: number): number {
    const def = this.getTierDefinition(tier);
    return def?.max_skill ?? 5;
  }

  /**
   * Check if a tier unlock is available.
   */
  hasUnlock(tier: number, unlock: string): boolean {
    for (let t = 1; t <= tier; t++) {
      const def = this.getTierDefinition(t);
      if (def?.unlocks.includes(unlock)) return true;
    }
    return false;
  }

  /**
   * Get all unlocks available at a tier.
   */
  getUnlocksAtTier(tier: number): string[] {
    const unlocks: string[] = [];
    for (let t = 1; t <= tier; t++) {
      const def = this.getTierDefinition(t);
      if (def) unlocks.push(...def.unlocks);
    }
    return [...new Set(unlocks)];
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { TIER_DEFINITIONS };
