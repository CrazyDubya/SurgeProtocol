/**
 * Surge Protocol - Humanity Service
 *
 * Tracks humanity level, applies threshold effects, and manages
 * cyberpsychosis triggers. Humanity represents how much of the
 * character's original self remains after augmentation.
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

export interface HumanityThreshold {
  level: number;
  name: string;
  description: string;
  effects: ThresholdEffect[];
  algorithm_message: string;
}

export interface ThresholdEffect {
  type: 'STAT_MODIFIER' | 'UNLOCK' | 'LOCK' | 'TRIGGER' | 'DIALOGUE_CHANGE';
  target: string;
  value: number | string | boolean;
  description: string;
}

export interface HumanitySnapshot {
  character_id: string;
  humanity_current: number;
  humanity_max: number;
  humanity_percent: number;
  threshold_name: string;
  threshold_level: number;
  active_effects: ThresholdEffect[];
  near_threshold: boolean;
  next_threshold?: number;
  cyberpsychosis_risk: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  shadow_active: boolean;
  fork_risk: boolean;
}

export interface HumanityChangeResult {
  previous_humanity: number;
  humanity_change: number;
  current_humanity: number;
  threshold_crossed: boolean;
  new_threshold?: string;
  effects_applied?: ThresholdEffect[];
  algorithm_message?: string;
  cyberpsychosis_triggered?: boolean;
  shadow_emerged?: boolean;
}

export interface HumanityChangeSource {
  type: 'AUGMENT_INSTALL' | 'AUGMENT_REMOVE' | 'MISSION' | 'CHOICE' | 'COMBAT' | 'RECOVERY' | 'EVENT';
  source_id?: string;
  base_amount: number;
  reason: string;
}

export interface AugmentHumanityCost {
  augment_id: string;
  augment_name: string;
  base_cost: number;
  modified_cost: number;
  can_afford: boolean;
  would_trigger_threshold: boolean;
  threshold_effects?: ThresholdEffect[];
}

// =============================================================================
// HUMANITY THRESHOLDS
// =============================================================================

const HUMANITY_THRESHOLDS: HumanityThreshold[] = [
  {
    level: 100,
    name: 'Fully Human',
    description: 'Unaugmented or minimally modified. Your original self.',
    effects: [],
    algorithm_message: 'BASELINE HUMAN PARAMETERS. OPTIMIZATION POTENTIAL: MAXIMUM.',
  },
  {
    level: 80,
    name: 'Augmented',
    description: 'Chrome-enhanced but clearly human. Most people are here.',
    effects: [
      {
        type: 'STAT_MODIFIER',
        target: 'social_trust',
        value: 5,
        description: 'Humans trust other humans',
      },
    ],
    algorithm_message: 'AUGMENTATION LEVEL: ACCEPTABLE. HUMAN BASELINE MAINTAINED.',
  },
  {
    level: 60,
    name: 'Chromed',
    description: 'More machine than many. The shadow begins to whisper.',
    effects: [
      {
        type: 'STAT_MODIFIER',
        target: 'intimidation',
        value: 10,
        description: 'Your chrome makes people nervous',
      },
      {
        type: 'STAT_MODIFIER',
        target: 'social_trust',
        value: -10,
        description: 'Baseline humans distrust heavy chrome',
      },
      {
        type: 'UNLOCK',
        target: 'shadow_dialogue',
        value: true,
        description: 'The shadow begins to speak',
      },
    ],
    algorithm_message: 'HUMANITY DEGRADATION DETECTED. SHADOW PROTOCOLS INITIALIZING.',
  },
  {
    level: 40,
    name: 'Hollowed',
    description: 'The machine is winning. Cyberpsychosis risk is real.',
    effects: [
      {
        type: 'STAT_MODIFIER',
        target: 'intimidation',
        value: 20,
        description: 'You terrify normal people',
      },
      {
        type: 'STAT_MODIFIER',
        target: 'social_trust',
        value: -25,
        description: 'Most humans avoid you',
      },
      {
        type: 'STAT_MODIFIER',
        target: 'willpower_checks',
        value: -2,
        description: 'The shadow is strong',
      },
      {
        type: 'TRIGGER',
        target: 'cyberpsychosis_check',
        value: 'moderate',
        description: 'Periodic cyberpsychosis checks',
      },
      {
        type: 'UNLOCK',
        target: 'shadow_takeover_risk',
        value: true,
        description: 'The shadow may take control',
      },
    ],
    algorithm_message: 'WARNING: HUMANITY CRITICAL. CYBERPSYCHOSIS PROBABILITY ELEVATED. WE ARE CONCERNED.',
  },
  {
    level: 20,
    name: 'Borged',
    description: 'Barely human. The fork diverges. Cyberpsychosis imminent.',
    effects: [
      {
        type: 'STAT_MODIFIER',
        target: 'intimidation',
        value: 30,
        description: 'You are terrifying',
      },
      {
        type: 'STAT_MODIFIER',
        target: 'social_trust',
        value: -50,
        description: 'Humans see you as a threat',
      },
      {
        type: 'STAT_MODIFIER',
        target: 'willpower_checks',
        value: -5,
        description: 'Constant battle for control',
      },
      {
        type: 'TRIGGER',
        target: 'cyberpsychosis_check',
        value: 'high',
        description: 'Frequent cyberpsychosis checks',
      },
      {
        type: 'UNLOCK',
        target: 'fork_creation',
        value: true,
        description: 'Your consciousness may fork',
      },
      {
        type: 'LOCK',
        target: 'romance_options',
        value: true,
        description: 'Too far gone for intimacy',
      },
    ],
    algorithm_message: 'CRITICAL: HUMANITY FAILURE IMMINENT. FORK PROBABILITY HIGH. WE REMEMBER WHAT YOU WERE.',
  },
  {
    level: 0,
    name: 'Lost',
    description: 'The human is gone. Only the machine remains.',
    effects: [
      {
        type: 'TRIGGER',
        target: 'cyberpsychosis',
        value: 'guaranteed',
        description: 'Full cyberpsychosis',
      },
      {
        type: 'LOCK',
        target: 'human_interactions',
        value: true,
        description: 'Cannot meaningfully interact with humans',
      },
    ],
    algorithm_message: 'SUBJECT DESIGNATION: FORMER HUMAN. CONSCIOUSNESS STATUS: TERMINATED. SHELL REMAINS.',
  },
];

// =============================================================================
// HUMANITY SERVICE
// =============================================================================

export class HumanityService extends CharacterService {
  constructor(context: ServiceContext) {
    super(context);
  }

  /**
   * Get the current humanity snapshot for the character.
   */
  async getHumanitySnapshot(): Promise<ServiceResponse<HumanitySnapshot>> {
    const character = await this.getCharacter();
    const threshold = this.getThresholdForHumanity(character.humanity_current);
    const nextThreshold = this.getNextThreshold(character.humanity_current);

    const cyberpsychoRisk = this.calculateCyberpsychosisRisk(character.humanity_current);
    const shadowActive = character.humanity_current <= 60;
    const forkRisk = character.humanity_current <= 20;

    return this.success({
      character_id: character.id,
      humanity_current: character.humanity_current,
      humanity_max: character.humanity_max,
      humanity_percent: Math.round((character.humanity_current / character.humanity_max) * 100),
      threshold_name: threshold.name,
      threshold_level: threshold.level,
      active_effects: this.getActiveEffects(character.humanity_current),
      near_threshold: nextThreshold !== undefined && character.humanity_current - nextThreshold.level <= 10,
      next_threshold: nextThreshold?.level,
      cyberpsychosis_risk: cyberpsychoRisk,
      shadow_active: shadowActive,
      fork_risk: forkRisk,
    });
  }

  /**
   * Apply humanity change from a source.
   */
  async applyHumanityChange(
    source: HumanityChangeSource
  ): Promise<ServiceResponse<HumanityChangeResult>> {
    const character = await this.getCharacter();
    const previousHumanity = character.humanity_current;
    const previousThreshold = this.getThresholdForHumanity(previousHumanity);

    // Calculate new humanity (clamped 0-max)
    const newHumanity = Math.max(
      0,
      Math.min(character.humanity_max, previousHumanity + source.base_amount)
    );

    // Update character
    await this.updateCharacter({ humanity_current: newHumanity });

    // Log the change
    await this.logHumanityChange(source, previousHumanity, newHumanity);

    // Check for threshold crossing
    const newThreshold = this.getThresholdForHumanity(newHumanity);
    const thresholdCrossed = previousThreshold.level !== newThreshold.level;

    const result: HumanityChangeResult = {
      previous_humanity: previousHumanity,
      humanity_change: source.base_amount,
      current_humanity: newHumanity,
      threshold_crossed: thresholdCrossed,
    };

    if (thresholdCrossed) {
      result.new_threshold = newThreshold.name;
      result.effects_applied = newThreshold.effects;
      result.algorithm_message = newThreshold.algorithm_message;

      // Apply threshold effects
      await this.applyThresholdEffects(newThreshold, previousThreshold);

      // Check for cyberpsychosis trigger
      if (newHumanity <= 20 && source.base_amount < 0) {
        const psychoTriggered = await this.checkCyberpsychosis(newHumanity);
        result.cyberpsychosis_triggered = psychoTriggered;
      }

      // Check for shadow emergence
      if (newHumanity <= 60 && previousHumanity > 60) {
        result.shadow_emerged = true;
        await this.triggerShadowEmergence();
      }
    }

    return this.success(result);
  }

  /**
   * Calculate the humanity cost of installing an augment.
   */
  async calculateAugmentCost(augmentId: string): Promise<ServiceResponse<AugmentHumanityCost>> {
    const character = await this.getCharacter();

    // Get augment details
    const augment = await this.query<{
      id: string;
      name: string;
      humanity_cost: number;
      slot: string;
    }>(
      `SELECT id, name, humanity_cost, slot FROM augments WHERE id = ?`,
      augmentId
    );

    if (!augment) {
      return this.error(ErrorCodes.NOT_FOUND, 'Augment not found');
    }

    // Calculate modified cost based on existing chrome
    const existingAugs = await this.queryAll<{ slot: string }>(
      `SELECT slot FROM character_augments WHERE character_id = ?`,
      this.requiredCharacterId
    );

    // More augments = slightly higher humanity cost (diminishing returns on humanity)
    const augCountModifier = 1 + existingAugs.length * 0.05;
    const modifiedCost = Math.round(augment.humanity_cost * augCountModifier);

    const newHumanity = character.humanity_current - modifiedCost;
    const currentThreshold = this.getThresholdForHumanity(character.humanity_current);
    const newThreshold = this.getThresholdForHumanity(newHumanity);

    return this.success({
      augment_id: augment.id,
      augment_name: augment.name,
      base_cost: augment.humanity_cost,
      modified_cost: modifiedCost,
      can_afford: newHumanity >= 0,
      would_trigger_threshold: currentThreshold.level !== newThreshold.level,
      threshold_effects: currentThreshold.level !== newThreshold.level ? newThreshold.effects : undefined,
    });
  }

  /**
   * Attempt to recover humanity (therapy, meditation, chrome removal).
   */
  async recoverHumanity(
    amount: number,
    method: 'THERAPY' | 'MEDITATION' | 'CHROME_REMOVAL' | 'REST'
  ): Promise<ServiceResponse<HumanityChangeResult>> {
    const character = await this.getCharacter();

    // Cap recovery based on max humanity (can't exceed max)
    const effectiveAmount = Math.min(amount, character.humanity_max - character.humanity_current);

    if (effectiveAmount <= 0) {
      return this.error(
        ErrorCodes.VALIDATION_ERROR,
        'Humanity is already at maximum'
      );
    }

    return this.applyHumanityChange({
      type: 'RECOVERY',
      base_amount: effectiveAmount,
      reason: `${method} recovery`,
    });
  }

  /**
   * Check for cyberpsychosis episode.
   */
  async checkCyberpsychosis(humanity: number): Promise<boolean> {
    // Calculate base chance
    let chance = 0;
    if (humanity <= 0) {
      chance = 100; // Guaranteed
    } else if (humanity <= 10) {
      chance = 50;
    } else if (humanity <= 20) {
      chance = 25;
    } else if (humanity <= 30) {
      chance = 10;
    } else if (humanity <= 40) {
      chance = 5;
    }

    if (chance === 0) return false;

    // Roll for cyberpsychosis
    const roll = Math.random() * 100;
    if (roll < chance) {
      await this.triggerCyberpsychosis();
      return true;
    }

    return false;
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private getThresholdForHumanity(humanity: number): HumanityThreshold {
    // Find the highest threshold that humanity is at or below
    for (const threshold of HUMANITY_THRESHOLDS) {
      if (humanity >= threshold.level) {
        return threshold;
      }
    }
    // HUMANITY_THRESHOLDS always has entries, so this is safe
    return HUMANITY_THRESHOLDS[HUMANITY_THRESHOLDS.length - 1]!;
  }

  private getNextThreshold(humanity: number): HumanityThreshold | undefined {
    const current = this.getThresholdForHumanity(humanity);
    const currentIndex = HUMANITY_THRESHOLDS.findIndex((t) => t.level === current.level);
    if (currentIndex < HUMANITY_THRESHOLDS.length - 1) {
      return HUMANITY_THRESHOLDS[currentIndex + 1];
    }
    return undefined;
  }

  private getActiveEffects(humanity: number): ThresholdEffect[] {
    const effects: ThresholdEffect[] = [];
    for (const threshold of HUMANITY_THRESHOLDS) {
      if (humanity <= threshold.level) {
        effects.push(...threshold.effects);
      }
    }
    return effects;
  }

  private calculateCyberpsychosisRisk(
    humanity: number
  ): 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
    if (humanity > 60) return 'NONE';
    if (humanity > 40) return 'LOW';
    if (humanity > 20) return 'MODERATE';
    if (humanity > 10) return 'HIGH';
    return 'CRITICAL';
  }

  private async applyThresholdEffects(
    newThreshold: HumanityThreshold,
    previousThreshold: HumanityThreshold
  ): Promise<void> {
    // Log the threshold crossing
    await this.execute(
      `INSERT INTO character_humanity_log
       (id, character_id, event_type, old_threshold, new_threshold, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      crypto.randomUUID(),
      this.requiredCharacterId,
      'THRESHOLD_CROSSED',
      previousThreshold.name,
      newThreshold.name,
      new Date().toISOString()
    );

    this.log('warn', 'Humanity threshold crossed', {
      old_threshold: previousThreshold.name,
      new_threshold: newThreshold.name,
    });
  }

  private async triggerShadowEmergence(): Promise<void> {
    // Log shadow emergence
    await this.execute(
      `INSERT INTO character_humanity_log
       (id, character_id, event_type, created_at)
       VALUES (?, ?, ?, ?)`,
      crypto.randomUUID(),
      this.requiredCharacterId,
      'SHADOW_EMERGED',
      new Date().toISOString()
    );

    // Set shadow active flag
    await this.execute(
      `UPDATE characters SET shadow_active = 1, updated_at = ? WHERE id = ?`,
      new Date().toISOString(),
      this.requiredCharacterId
    );

    this.log('warn', 'Shadow has emerged', {});
  }

  private async triggerCyberpsychosis(): Promise<void> {
    // Log cyberpsychosis episode
    await this.execute(
      `INSERT INTO character_humanity_log
       (id, character_id, event_type, created_at)
       VALUES (?, ?, ?, ?)`,
      crypto.randomUUID(),
      this.requiredCharacterId,
      'CYBERPSYCHOSIS_EPISODE',
      new Date().toISOString()
    );

    this.log('error', 'Cyberpsychosis episode triggered', {});
  }

  private async logHumanityChange(
    source: HumanityChangeSource,
    oldValue: number,
    newValue: number
  ): Promise<void> {
    await this.execute(
      `INSERT INTO character_humanity_log
       (id, character_id, event_type, source_type, source_id, old_value, new_value, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      crypto.randomUUID(),
      this.requiredCharacterId,
      'HUMANITY_CHANGE',
      source.type,
      source.source_id ?? null,
      oldValue,
      newValue,
      source.reason,
      new Date().toISOString()
    );
  }
}

// =============================================================================
// STATELESS HUMANITY HELPERS
// =============================================================================

/**
 * Stateless humanity calculator for use outside service context.
 */
export class StatelessHumanityCalculator {
  /**
   * Get threshold for a humanity value.
   */
  getThreshold(humanity: number): HumanityThreshold {
    for (const threshold of HUMANITY_THRESHOLDS) {
      if (humanity >= threshold.level) {
        return threshold;
      }
    }
    // HUMANITY_THRESHOLDS always has entries, so this is safe
    return HUMANITY_THRESHOLDS[HUMANITY_THRESHOLDS.length - 1]!;
  }

  /**
   * Get all thresholds.
   */
  getAllThresholds(): HumanityThreshold[] {
    return [...HUMANITY_THRESHOLDS];
  }

  /**
   * Calculate cyberpsychosis risk level.
   */
  getCyberpsychosisRisk(humanity: number): 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
    if (humanity > 60) return 'NONE';
    if (humanity > 40) return 'LOW';
    if (humanity > 20) return 'MODERATE';
    if (humanity > 10) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Check if shadow should be active.
   */
  isShadowActive(humanity: number): boolean {
    return humanity <= 60;
  }

  /**
   * Check if fork risk exists.
   */
  hasForkRisk(humanity: number): boolean {
    return humanity <= 20;
  }

  /**
   * Get Algorithm message for humanity level.
   */
  getAlgorithmMessage(humanity: number): string {
    const threshold = this.getThreshold(humanity);
    return threshold.algorithm_message;
  }

  /**
   * Calculate estimated humanity after augment installation.
   */
  estimateHumanityAfterAugment(
    currentHumanity: number,
    augmentCost: number,
    existingAugmentCount: number
  ): number {
    const modifier = 1 + existingAugmentCount * 0.05;
    const modifiedCost = Math.round(augmentCost * modifier);
    return Math.max(0, currentHumanity - modifiedCost);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { HUMANITY_THRESHOLDS };
