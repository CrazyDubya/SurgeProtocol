/**
 * Surge Protocol - Rating Decay Service
 *
 * The Algorithm never forgets. Inactive accounts decay.
 *
 * This service handles:
 * - Daily rating decay for inactive accounts
 * - Decay protection for premium/special accounts
 * - Batch processing for scheduled decay jobs
 */

import {
  BaseService,
  type ServiceContext,
  type ServiceResponse,
  ErrorCodes,
} from '../base';

import {
  calculateDecay,
  getTierFromRating,
} from '../../game/mechanics/rating';

// =============================================================================
// TYPES
// =============================================================================

export interface DecayResult {
  characterId: string;
  previousRating: number;
  newRating: number;
  decayAmount: number;
  daysInactive: number;
  tierChanged: boolean;
  previousTier: number;
  newTier: number;
}

export interface BatchDecayResult {
  processed: number;
  decayed: number;
  protected: number;
  errors: number;
  results: DecayResult[];
}

export interface DecayConfig {
  /** Days before decay starts (default: 7) */
  gracePeriodDays: number;
  /** Daily decay rate (default: 0.1) */
  dailyDecayRate: number;
  /** Maximum decay as percentage of rating (default: 0.1 = 10%) */
  maxDecayPercentage: number;
  /** Minimum rating floor (default: 0) */
  minimumRating: number;
}

export interface InactiveCharacter {
  id: string;
  user_id: string;
  name: string;
  overall_rating: number;
  tier: number;
  last_activity_at: string;
  decay_protection_until: string | null;
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_DECAY_CONFIG: DecayConfig = {
  gracePeriodDays: 7,
  dailyDecayRate: 0.1,
  maxDecayPercentage: 0.1,
  minimumRating: 0,
};

// =============================================================================
// RATING DECAY SERVICE
// =============================================================================

export class RatingDecayService extends BaseService {
  private readonly config: DecayConfig;

  constructor(context: ServiceContext, config?: Partial<DecayConfig>) {
    super(context);
    this.config = { ...DEFAULT_DECAY_CONFIG, ...config };
  }

  /**
   * Process decay for a single character.
   */
  async processCharacterDecay(
    characterId: string
  ): Promise<ServiceResponse<DecayResult | null>> {
    try {
      const character = await this.query<InactiveCharacter>(
        `SELECT id, user_id, name, overall_rating, tier, last_activity_at, decay_protection_until
         FROM characters WHERE id = ?`,
        characterId
      );

      if (!character) {
        return this.error(
          ErrorCodes.CHARACTER_NOT_FOUND,
          'Character not found'
        );
      }

      const result = await this.applyDecay(character);
      return this.success(result);
    } catch (error) {
      this.log('error', 'Failed to process character decay', {
        characterId,
        error: String(error),
      });
      return this.error(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to process decay'
      );
    }
  }

  /**
   * Process decay for all inactive characters.
   * Designed to be run as a scheduled job (e.g., daily cron).
   */
  async processBatchDecay(
    limit: number = 1000
  ): Promise<ServiceResponse<BatchDecayResult>> {
    try {
      const now = new Date();
      const gracePeriodMs = this.config.gracePeriodDays * 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(now.getTime() - gracePeriodMs);

      // Find inactive characters
      const inactiveCharacters = await this.queryAll<InactiveCharacter>(
        `SELECT id, user_id, name, overall_rating, tier, last_activity_at, decay_protection_until
         FROM characters
         WHERE last_activity_at < ?
           AND overall_rating > ?
           AND is_active = 1
         ORDER BY last_activity_at ASC
         LIMIT ?`,
        cutoffDate.toISOString(),
        this.config.minimumRating,
        limit
      );

      const results: DecayResult[] = [];
      let processed = 0;
      let decayed = 0;
      let protected_ = 0;
      let errors = 0;

      for (const character of inactiveCharacters) {
        processed++;

        try {
          const result = await this.applyDecay(character);
          if (result) {
            if (result.decayAmount > 0) {
              decayed++;
            } else {
              protected_++;
            }
            results.push(result);
          } else {
            protected_++;
          }
        } catch (error) {
          errors++;
          this.log('error', 'Decay failed for character', {
            characterId: character.id,
            error: String(error),
          });
        }
      }

      this.log('info', 'Batch decay completed', {
        processed,
        decayed,
        protected: protected_,
        errors,
      });

      return this.success({
        processed,
        decayed,
        protected: protected_,
        errors,
        results,
      });
    } catch (error) {
      this.log('error', 'Batch decay failed', { error: String(error) });
      return this.error(
        ErrorCodes.INTERNAL_ERROR,
        'Batch decay processing failed'
      );
    }
  }

  /**
   * Grant decay protection to a character.
   */
  async grantDecayProtection(
    characterId: string,
    durationDays: number
  ): Promise<ServiceResponse<{ protectedUntil: string }>> {
    try {
      const protectedUntil = new Date(
        Date.now() + durationDays * 24 * 60 * 60 * 1000
      ).toISOString();

      await this.execute(
        `UPDATE characters SET decay_protection_until = ?, updated_at = ? WHERE id = ?`,
        protectedUntil,
        new Date().toISOString(),
        characterId
      );

      this.log('info', 'Decay protection granted', {
        characterId,
        durationDays,
        protectedUntil,
      });

      return this.success({ protectedUntil });
    } catch (error) {
      return this.error(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to grant decay protection'
      );
    }
  }

  /**
   * Get decay preview for a character.
   */
  async previewDecay(
    characterId: string
  ): Promise<
    ServiceResponse<{
      currentRating: number;
      daysInactive: number;
      projectedDecay: number;
      projectedRating: number;
      isProtected: boolean;
      protectedUntil: string | null;
    }>
  > {
    try {
      const character = await this.query<InactiveCharacter>(
        `SELECT id, overall_rating, tier, last_activity_at, decay_protection_until
         FROM characters WHERE id = ?`,
        characterId
      );

      if (!character) {
        return this.error(
          ErrorCodes.CHARACTER_NOT_FOUND,
          'Character not found'
        );
      }

      const daysInactive = this.calculateDaysInactive(character.last_activity_at);
      const isProtected = this.isProtectedFromDecay(character);

      let projectedDecay = 0;
      if (!isProtected && daysInactive > this.config.gracePeriodDays) {
        projectedDecay = this.calculateDecayAmount(
          character.overall_rating,
          daysInactive
        );
      }

      return this.success({
        currentRating: character.overall_rating,
        daysInactive,
        projectedDecay,
        projectedRating: Math.max(
          this.config.minimumRating,
          character.overall_rating - projectedDecay
        ),
        isProtected,
        protectedUntil: character.decay_protection_until,
      });
    } catch (error) {
      return this.error(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to preview decay'
      );
    }
  }

  /**
   * Update last activity timestamp (prevents decay).
   */
  async recordActivity(characterId: string): Promise<void> {
    await this.execute(
      `UPDATE characters SET last_activity_at = ?, updated_at = ? WHERE id = ?`,
      new Date().toISOString(),
      new Date().toISOString(),
      characterId
    );
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Apply decay to a character.
   */
  private async applyDecay(
    character: InactiveCharacter
  ): Promise<DecayResult | null> {
    // Check protection
    if (this.isProtectedFromDecay(character)) {
      return null;
    }

    const daysInactive = this.calculateDaysInactive(character.last_activity_at);

    // Check grace period
    if (daysInactive <= this.config.gracePeriodDays) {
      return null;
    }

    const decayAmount = this.calculateDecayAmount(
      character.overall_rating,
      daysInactive
    );

    if (decayAmount <= 0) {
      return null;
    }

    const newRating = Math.max(
      this.config.minimumRating,
      character.overall_rating - decayAmount
    );
    const newTier = getTierFromRating(newRating);

    // Persist the decay
    await this.execute(
      `UPDATE characters SET overall_rating = ?, tier = ?, updated_at = ? WHERE id = ?`,
      newRating,
      newTier,
      new Date().toISOString(),
      character.id
    );

    // Log the decay event
    await this.logDecayEvent(character.id, decayAmount, daysInactive);

    return {
      characterId: character.id,
      previousRating: character.overall_rating,
      newRating,
      decayAmount,
      daysInactive,
      tierChanged: newTier !== character.tier,
      previousTier: character.tier,
      newTier,
    };
  }

  /**
   * Check if character is protected from decay.
   */
  private isProtectedFromDecay(character: InactiveCharacter): boolean {
    if (!character.decay_protection_until) {
      return false;
    }

    const protectedUntil = new Date(character.decay_protection_until);
    return protectedUntil > new Date();
  }

  /**
   * Calculate days since last activity.
   */
  private calculateDaysInactive(lastActivityAt: string): number {
    const lastActivity = new Date(lastActivityAt);
    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    return Math.floor(diffMs / (24 * 60 * 60 * 1000));
  }

  /**
   * Calculate decay amount using configured rules.
   */
  private calculateDecayAmount(
    currentRating: number,
    daysInactive: number
  ): number {
    // Use the game mechanics decay function
    const baseDecay = calculateDecay(currentRating, daysInactive);

    // Apply configured maximum cap
    const maxDecay = currentRating * this.config.maxDecayPercentage;
    return Math.min(baseDecay, maxDecay);
  }

  /**
   * Log decay event for analytics.
   */
  private async logDecayEvent(
    characterId: string,
    decayAmount: number,
    daysInactive: number
  ): Promise<void> {
    try {
      await this.execute(
        `INSERT INTO analytics_events (id, character_id, event_type, event_data, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        crypto.randomUUID(),
        characterId,
        'RATING_DECAY',
        JSON.stringify({ decayAmount, daysInactive }),
        new Date().toISOString()
      );
    } catch (error) {
      // Non-critical, just log
      this.log('warn', 'Failed to log decay event', {
        characterId,
        error: String(error),
      });
    }
  }
}

// =============================================================================
// SCHEDULED JOB HELPER
// =============================================================================

/**
 * Factory function to create decay service for scheduled jobs.
 */
export function createDecayJob(
  db: D1Database,
  config?: Partial<DecayConfig>
): RatingDecayService {
  return new RatingDecayService({ db }, config);
}

/**
 * Get Algorithm message for decay notification.
 */
export function getDecayAlgorithmMessage(result: DecayResult): string {
  if (result.tierChanged) {
    return `EXTENDED ABSENCE DETECTED. Rating adjusted: -${result.decayAmount.toFixed(1)}. Tier reassigned to ${result.newTier}. The Algorithm waits, but does not forget.`;
  }

  if (result.decayAmount > 2) {
    return `Inactivity penalty applied: -${result.decayAmount.toFixed(1)} rating. Resume operations to halt decay. The Algorithm values presence.`;
  }

  return `Minor decay adjustment: -${result.decayAmount.toFixed(1)}. Regular activity prevents further erosion.`;
}
