/**
 * Surge Protocol - Rating Calculator Service
 *
 * The Algorithm tracks everything. Your rating determines your tier,
 * your access, your worth.
 *
 * This service encapsulates all rating calculation logic and provides
 * database integration for persistent rating management.
 */

import {
  CharacterService,
  type ServiceContext,
  type ServiceResponse,
  ErrorCodes,
} from '../base';

import {
  calculateRating,
  calculateDeliverySuccessRate,
  calculateSpeedPerformance,
  calculateCustomerSatisfaction,
  calculatePackageIntegrity,
  calculateIncidentScore,
  getTierFromRating,
  getTierRatingRange,
  applyDeathSpiralProtection,
  isNearTierUp,
  getAlgorithmCommentary,
  type RatingBreakdown,
  type RatingChange,
  type MissionResult,
  TIER_THRESHOLDS,
  RATING_WEIGHTS,
} from '../../game/mechanics/rating';

// =============================================================================
// TYPES
// =============================================================================

export interface RatingComponentRecord {
  character_id: string;
  component_code: string;
  score: number;
  updated_at: string;
}

export interface RatingUpdateResult {
  change: RatingChange;
  breakdown: RatingBreakdown;
  algorithmMessage: string;
  newTier: number;
  tierChanged: boolean;
}

export interface RatingSnapshot {
  characterId: string;
  rating: number;
  tier: number;
  breakdown: RatingBreakdown;
  components: Map<string, number>;
  nearTierUp: boolean;
  tierProgress: {
    current: number;
    min: number;
    max: number;
    percentage: number;
  };
}

export interface MissionHistory {
  successful: number;
  total: number;
}

// =============================================================================
// RATING CALCULATOR SERVICE
// =============================================================================

export class RatingCalculatorService extends CharacterService {
  constructor(context: ServiceContext) {
    super(context);
  }

  /**
   * Get the current rating snapshot for the character.
   */
  async getRatingSnapshot(): Promise<ServiceResponse<RatingSnapshot>> {
    try {
      const character = await this.getCharacter();
      const components = await this.loadComponents();
      const breakdown = calculateRating(components, character.tier);

      const tierRange = getTierRatingRange(character.tier);
      const percentage = Math.min(
        100,
        ((character.overall_rating - tierRange.min) /
          (tierRange.max - tierRange.min)) *
          100
      );

      return this.success({
        characterId: this.requiredCharacterId,
        rating: character.overall_rating,
        tier: character.tier,
        breakdown,
        components,
        nearTierUp: isNearTierUp(character.overall_rating),
        tierProgress: {
          current: character.overall_rating,
          min: tierRange.min,
          max: tierRange.max,
          percentage: Math.round(percentage * 10) / 10,
        },
      });
    } catch (error) {
      this.log('error', 'Failed to get rating snapshot', { error: String(error) });
      return this.error(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to get rating snapshot'
      );
    }
  }

  /**
   * Update rating based on mission completion.
   */
  async updateFromMission(
    result: MissionResult
  ): Promise<ServiceResponse<RatingUpdateResult>> {
    try {
      const character = await this.getCharacter();
      const currentComponents = await this.loadComponents();
      const history = await this.getMissionHistory();

      // Calculate the rating change
      const change = this.calculateMissionRatingChange(
        currentComponents,
        character.tier,
        result,
        history
      );

      // Apply death spiral protection if needed
      let finalDelta = change.delta;
      if (finalDelta < 0) {
        finalDelta = applyDeathSpiralProtection(
          character.overall_rating,
          finalDelta
        );
      }

      // Calculate new rating
      const newRating = Math.max(
        0,
        Math.min(1000, character.overall_rating + finalDelta)
      );
      const newTier = getTierFromRating(newRating);

      // Persist the changes
      await this.persistRatingUpdate(change, newRating, newTier);

      const breakdown = calculateRating(
        await this.loadComponents(),
        newTier
      );

      const algorithmMessage = getAlgorithmCommentary({
        ...change,
        delta: finalDelta,
        newRating,
        newTier,
        tierChanged: newTier !== character.tier,
      });

      this.log('info', 'Rating updated from mission', {
        previousRating: character.overall_rating,
        newRating,
        delta: finalDelta,
        tierChanged: newTier !== character.tier,
      });

      return this.success({
        change: {
          ...change,
          delta: finalDelta,
          newRating,
          newTier,
          tierChanged: newTier !== character.tier,
        },
        breakdown,
        algorithmMessage,
        newTier,
        tierChanged: newTier !== character.tier,
      });
    } catch (error) {
      this.log('error', 'Failed to update rating from mission', {
        error: String(error),
      });
      return this.error(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to update rating'
      );
    }
  }

  /**
   * Update a specific rating component directly.
   */
  async updateComponent(
    code: string,
    delta: number
  ): Promise<ServiceResponse<{ previousScore: number; newScore: number }>> {
    try {
      const components = await this.loadComponents();
      const previousScore = components.get(code) ?? 0;
      const newScore = Math.max(0, Math.min(100, previousScore + delta));

      await this.saveComponent(code, newScore);

      // Recalculate overall rating
      components.set(code, newScore);
      const character = await this.getCharacter();
      const breakdown = calculateRating(components, character.tier);

      await this.updateCharacter({
        overall_rating: breakdown.finalRating,
      });

      return this.success({ previousScore, newScore });
    } catch (error) {
      this.log('error', 'Failed to update component', {
        code,
        delta,
        error: String(error),
      });
      return this.error(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to update rating component'
      );
    }
  }

  /**
   * Get all rating component definitions and weights.
   */
  getComponentDefinitions(): ServiceResponse<
    Array<{ code: string; name: string; weight: number }>
  > {
    const definitions = Object.entries(RATING_WEIGHTS).map(([code, weight]) => ({
      code,
      name: this.getComponentName(code),
      weight,
    }));
    return this.success(definitions);
  }

  /**
   * Check if character qualifies for tier-up bonus missions.
   */
  async checkTierUpEligibility(): Promise<
    ServiceResponse<{
      eligible: boolean;
      currentRating: number;
      nextThreshold: number;
      pointsNeeded: number;
    }>
  > {
    try {
      const character = await this.getCharacter();
      const nearTierUp = isNearTierUp(character.overall_rating);

      let nextThreshold = 1000;
      if (character.tier < 10) {
        nextThreshold = TIER_THRESHOLDS[character.tier] ?? 1000;
      }

      return this.success({
        eligible: nearTierUp,
        currentRating: character.overall_rating,
        nextThreshold,
        pointsNeeded: Math.max(0, nextThreshold - character.overall_rating),
      });
    } catch (error) {
      return this.error(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to check tier-up eligibility'
      );
    }
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Load rating components from database.
   */
  private async loadComponents(): Promise<Map<string, number>> {
    const records = await this.queryAll<RatingComponentRecord>(
      `SELECT component_code, score FROM rating_components WHERE character_id = ?`,
      this.requiredCharacterId
    );

    const components = new Map<string, number>();

    // Set defaults
    for (const code of Object.keys(RATING_WEIGHTS)) {
      components.set(code, this.getDefaultScore(code));
    }

    // Override with stored values
    for (const record of records) {
      components.set(record.component_code, record.score);
    }

    return components;
  }

  /**
   * Save a rating component to database.
   */
  private async saveComponent(code: string, score: number): Promise<void> {
    await this.execute(
      `INSERT INTO rating_components (character_id, component_code, score, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (character_id, component_code) DO UPDATE SET
         score = excluded.score,
         updated_at = excluded.updated_at`,
      this.requiredCharacterId,
      code,
      score,
      new Date().toISOString()
    );
  }

  /**
   * Get mission history for the character.
   */
  private async getMissionHistory(): Promise<MissionHistory> {
    const result = await this.query<{ successful: number; total: number }>(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as successful
       FROM character_missions
       WHERE character_id = ?`,
      this.requiredCharacterId
    );

    return {
      successful: result?.successful ?? 0,
      total: result?.total ?? 0,
    };
  }

  /**
   * Calculate rating change from mission result.
   */
  private calculateMissionRatingChange(
    currentComponents: Map<string, number>,
    currentTier: number,
    result: MissionResult,
    history: MissionHistory
  ): RatingChange {
    const newComponents = new Map(currentComponents);
    const componentChanges: RatingChange['components'] = [];

    // Update delivery success rate
    const newTotal = history.total + 1;
    const newSuccessful = history.successful + (result.success ? 1 : 0);
    const newDelSuc = calculateDeliverySuccessRate(newSuccessful, newTotal);
    this.trackComponentChange(
      newComponents,
      componentChanges,
      'DEL_SUC',
      newDelSuc
    );

    // Update speed performance
    if (result.success) {
      const speedScore = calculateSpeedPerformance(
        result.deliveryTimeActual,
        result.deliveryTimeExpected
      );
      const currentSpeed = currentComponents.get('DEL_SPD') ?? 80;
      const newSpeed = Math.round(currentSpeed * 0.9 + speedScore * 0.1);
      this.trackComponentChange(
        newComponents,
        componentChanges,
        'DEL_SPD',
        newSpeed
      );
    }

    // Update customer satisfaction
    if (result.customerRating !== undefined) {
      const currentSat = currentComponents.get('CUST_SAT') ?? 80;
      const ratingScore = result.customerRating * 20;
      const newSat = Math.round(currentSat * 0.95 + ratingScore * 0.05);
      this.trackComponentChange(
        newComponents,
        componentChanges,
        'CUST_SAT',
        newSat
      );
    }

    // Update package integrity
    if (result.packageDamaged) {
      const currentInt = currentComponents.get('PKG_INT') ?? 100;
      const penalty = result.packageFragile ? 10 : 5;
      this.trackComponentChange(
        newComponents,
        componentChanges,
        'PKG_INT',
        currentInt - penalty
      );
    }

    // Update route efficiency
    const currentEff = currentComponents.get('ROUTE_EFF') ?? 80;
    const newEff = Math.round(currentEff * 0.9 + result.routeEfficiency * 0.1);
    this.trackComponentChange(
      newComponents,
      componentChanges,
      'ROUTE_EFF',
      newEff
    );

    // Update incident score
    if (result.incidentOccurred) {
      const currentIncident = currentComponents.get('INCIDENT') ?? 100;
      this.trackComponentChange(
        newComponents,
        componentChanges,
        'INCIDENT',
        currentIncident - 10
      );
    }

    // Update special mission bonus
    if (result.isSpecialMission && result.success) {
      const currentSpecial = currentComponents.get('SPECIAL') ?? 0;
      this.trackComponentChange(
        newComponents,
        componentChanges,
        'SPECIAL',
        Math.min(100, currentSpecial + 5)
      );
    }

    // Calculate ratings
    const previousBreakdown = calculateRating(currentComponents, currentTier);
    const newBreakdown = calculateRating(newComponents, currentTier);

    const previousRating = previousBreakdown.finalRating;
    const newRating = newBreakdown.finalRating;
    const newTier = getTierFromRating(newRating);

    return {
      previousRating,
      newRating,
      delta: newRating - previousRating,
      components: componentChanges,
      reason: result.success ? 'Mission completed' : 'Mission failed',
      tierChanged: newTier !== currentTier,
      previousTier: currentTier,
      newTier,
    };
  }

  /**
   * Track a component change.
   */
  private trackComponentChange(
    components: Map<string, number>,
    changes: RatingChange['components'],
    code: string,
    newValue: number
  ): void {
    const clamped = Math.max(0, Math.min(100, newValue));
    const previous = components.get(code) ?? 0;

    if (clamped !== previous) {
      components.set(code, clamped);
      changes.push({
        code,
        previousScore: previous,
        newScore: clamped,
        delta: clamped - previous,
      });
    }
  }

  /**
   * Persist rating update to database.
   */
  private async persistRatingUpdate(
    change: RatingChange,
    newRating: number,
    newTier: number
  ): Promise<void> {
    const statements: D1PreparedStatement[] = [];

    // Update character rating and tier
    statements.push(
      this.db
        .prepare(
          `UPDATE characters SET overall_rating = ?, tier = ?, updated_at = ? WHERE id = ?`
        )
        .bind(
          newRating,
          newTier,
          new Date().toISOString(),
          this.requiredCharacterId
        )
    );

    // Update each changed component
    for (const comp of change.components) {
      statements.push(
        this.db
          .prepare(
            `INSERT INTO rating_components (character_id, component_code, score, updated_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT (character_id, component_code) DO UPDATE SET
               score = excluded.score,
               updated_at = excluded.updated_at`
          )
          .bind(
            this.requiredCharacterId,
            comp.code,
            comp.newScore,
            new Date().toISOString()
          )
      );
    }

    await this.batch(statements);
  }

  /**
   * Get default score for a component.
   */
  private getDefaultScore(code: string): number {
    const defaults: Record<string, number> = {
      DEL_SUC: 100, // New couriers start at 100%
      DEL_SPD: 80,
      CUST_SAT: 80,
      PKG_INT: 100,
      ROUTE_EFF: 80,
      AVAIL: 80,
      INCIDENT: 100,
      SPECIAL: 0,
      ALGO: 50,
      NET: 50,
    };
    return defaults[code] ?? 50;
  }

  /**
   * Get human-readable component name.
   */
  private getComponentName(code: string): string {
    const names: Record<string, string> = {
      DEL_SUC: 'Delivery Success Rate',
      DEL_SPD: 'Speed Performance',
      CUST_SAT: 'Customer Satisfaction',
      PKG_INT: 'Package Integrity',
      ROUTE_EFF: 'Route Efficiency',
      AVAIL: 'Availability Hours',
      INCIDENT: 'Safety Record',
      SPECIAL: 'Special Missions',
      ALGO: 'Algorithm Trust',
      NET: 'Network Contribution',
    };
    return names[code] ?? code;
  }
}

// =============================================================================
// STANDALONE CALCULATOR (NO DB REQUIRED)
// =============================================================================

/**
 * Stateless rating calculator for use without database.
 * Useful for previews, simulations, and testing.
 */
export class StatelessRatingCalculator {
  /**
   * Calculate rating from components.
   */
  calculate(components: Map<string, number>, tier: number): RatingBreakdown {
    return calculateRating(components, tier);
  }

  /**
   * Get tier from rating.
   */
  getTier(rating: number): number {
    return getTierFromRating(rating);
  }

  /**
   * Get tier range.
   */
  getTierRange(tier: number): { min: number; max: number } {
    return getTierRatingRange(tier);
  }

  /**
   * Check if near tier up.
   */
  isNearTierUp(rating: number): boolean {
    return isNearTierUp(rating);
  }

  /**
   * Apply death spiral protection.
   */
  applyProtection(currentRating: number, proposedChange: number): number {
    return applyDeathSpiralProtection(currentRating, proposedChange);
  }

  /**
   * Get Algorithm commentary.
   */
  getCommentary(change: RatingChange): string {
    return getAlgorithmCommentary(change);
  }

  /**
   * Calculate delivery success rate.
   */
  deliverySuccessRate(successful: number, total: number): number {
    return calculateDeliverySuccessRate(successful, total);
  }

  /**
   * Calculate speed performance.
   */
  speedPerformance(actualTime: number, expectedTime: number): number {
    return calculateSpeedPerformance(actualTime, expectedTime);
  }

  /**
   * Calculate customer satisfaction.
   */
  customerSatisfaction(ratings: number[], windowSize?: number): number {
    return calculateCustomerSatisfaction(ratings, windowSize);
  }

  /**
   * Calculate package integrity.
   */
  packageIntegrity(
    damageIncidents: number,
    fragileDamageIncidents: number
  ): number {
    return calculatePackageIntegrity(damageIncidents, fragileDamageIncidents);
  }

  /**
   * Calculate incident score.
   */
  incidentScore(incidents: number): number {
    return calculateIncidentScore(incidents);
  }
}
