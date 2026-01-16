/**
 * Surge Protocol - Carrier Rating System
 *
 * The Algorithm tracks everything. Your rating determines your tier,
 * your access, your worth.
 *
 * Rating = Σ(Component Score × Component Weight) × Tier Multiplier
 * Range: 0.000 to 1000.000
 */

/** Rating component with current value and weight */
export interface RatingComponent {
  code: string;
  name: string;
  weight: number;
  score: number; // 0-100
  maxScore: number;
}

/** Full rating breakdown */
export interface RatingBreakdown {
  components: RatingComponent[];
  rawScore: number;
  tierMultiplier: number;
  finalRating: number;
  tier: number;
}

/** Rating change event */
export interface RatingChange {
  previousRating: number;
  newRating: number;
  delta: number;
  components: Array<{
    code: string;
    previousScore: number;
    newScore: number;
    delta: number;
  }>;
  reason: string;
  tierChanged: boolean;
  previousTier: number;
  newTier: number;
}

/** Mission result for rating calculation */
export interface MissionResult {
  success: boolean;
  deliveryTimeActual: number; // minutes
  deliveryTimeExpected: number; // minutes
  customerRating?: number; // 1-5 stars
  packageDamaged: boolean;
  packageFragile: boolean;
  routeEfficiency: number; // 0-100, how optimal was the route
  incidentOccurred: boolean;
  isSpecialMission: boolean;
}

// =============================================================================
// TIER THRESHOLDS
// =============================================================================

/** Rating thresholds for each tier */
export const TIER_THRESHOLDS = [
  0,    // Tier 1: 0-49
  50,   // Tier 2: 50-99
  100,  // Tier 3: 100-149
  150,  // Tier 4: 150-199
  200,  // Tier 5: 200-249
  250,  // Tier 6: 250-299
  300,  // Tier 7: 300-349
  350,  // Tier 8: 350-399
  400,  // Tier 9: 400-449
  450,  // Tier 10: 450+
] as const;

/** Tier multipliers for rating calculation */
export const TIER_MULTIPLIERS = [
  1.0,  // Tier 1
  1.1,  // Tier 2
  1.2,  // Tier 3
  1.3,  // Tier 4
  1.4,  // Tier 5
  1.5,  // Tier 6
  1.6,  // Tier 7
  1.7,  // Tier 8
  1.8,  // Tier 9
  2.0,  // Tier 10
] as const;

// =============================================================================
// RATING COMPONENT WEIGHTS
// =============================================================================

export const RATING_WEIGHTS = {
  DEL_SUC: 0.20,    // Delivery Success Rate
  DEL_SPD: 0.15,    // Speed Performance
  CUST_SAT: 0.15,   // Customer Satisfaction
  PKG_INT: 0.10,    // Package Integrity
  ROUTE_EFF: 0.10,  // Route Efficiency
  AVAIL: 0.10,      // Availability Hours
  INCIDENT: 0.10,   // Incident Rate (inverse)
  SPECIAL: 0.05,    // Special Missions
  ALGO: 0.025,      // Algorithm Trust (T7+)
  NET: 0.025,       // Network Contribution (T9+)
} as const;

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Get tier from rating value.
 */
export function getTierFromRating(rating: number): number {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (rating >= TIER_THRESHOLDS[i]!) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get rating range for a tier.
 */
export function getTierRatingRange(tier: number): { min: number; max: number } {
  const index = Math.max(0, Math.min(tier - 1, TIER_THRESHOLDS.length - 1));
  const min = TIER_THRESHOLDS[index]!;
  const max = index < TIER_THRESHOLDS.length - 1
    ? TIER_THRESHOLDS[index + 1]! - 0.001
    : 1000;
  return { min, max };
}

/**
 * Calculate overall rating from components.
 */
export function calculateRating(
  components: Map<string, number>,
  tier: number
): RatingBreakdown {
  const ratingComponents: RatingComponent[] = [];
  let rawScore = 0;

  // Process each component
  for (const [code, weight] of Object.entries(RATING_WEIGHTS)) {
    const score = components.get(code) ?? 0;

    // T7+ components only count at high tiers
    if (code === 'ALGO' && tier < 7) continue;
    if (code === 'NET' && tier < 9) continue;

    ratingComponents.push({
      code,
      name: getComponentName(code),
      weight,
      score: Math.min(100, Math.max(0, score)),
      maxScore: 100,
    });

    rawScore += score * weight;
  }

  const tierMultiplier = TIER_MULTIPLIERS[Math.min(tier - 1, TIER_MULTIPLIERS.length - 1)]!;
  const finalRating = Math.min(1000, Math.max(0, rawScore * tierMultiplier));

  return {
    components: ratingComponents,
    rawScore,
    tierMultiplier,
    finalRating,
    tier,
  };
}

/**
 * Get human-readable component name.
 */
function getComponentName(code: string): string {
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

// =============================================================================
// COMPONENT CALCULATIONS
// =============================================================================

/**
 * Calculate delivery success rate.
 * Score = (Successful Deliveries / Total Deliveries) × 100
 * Rolling window: Last 100 deliveries
 */
export function calculateDeliverySuccessRate(
  successful: number,
  total: number
): number {
  if (total === 0) return 100; // New couriers start at 100
  return Math.round((successful / total) * 100);
}

/**
 * Calculate speed performance.
 * Score = Average(Expected Time / Actual Time) × 100
 * Capped at 100, penalty below 80% (suspicion of cheating)
 */
export function calculateSpeedPerformance(
  actualTime: number,
  expectedTime: number
): number {
  if (actualTime <= 0) return 0;

  const ratio = expectedTime / actualTime;

  // Too fast is suspicious
  if (ratio > 1.25) return 80; // Penalty for being suspiciously fast

  // Normal calculation
  const score = Math.min(100, ratio * 100);
  return Math.round(score);
}

/**
 * Calculate customer satisfaction from star ratings.
 * Score = (Σ Star Ratings / Max Possible Stars) × 100
 */
export function calculateCustomerSatisfaction(
  ratings: number[], // Array of 1-5 star ratings
  windowSize: number = 50
): number {
  if (ratings.length === 0) return 80; // Default for new couriers

  const recent = ratings.slice(-windowSize);
  const totalStars = recent.reduce((sum, r) => sum + r, 0);
  const maxStars = recent.length * 5;

  return Math.round((totalStars / maxStars) * 100);
}

/**
 * Calculate package integrity score.
 * Score = 100 - (Damage Incidents × 5)
 * Fragile penalties doubled
 */
export function calculatePackageIntegrity(
  damageIncidents: number,
  fragileDamageIncidents: number
): number {
  const penalty = (damageIncidents * 5) + (fragileDamageIncidents * 5); // Fragile = double
  return Math.max(0, 100 - penalty);
}

/**
 * Calculate incident rate (inverse - higher is better).
 * Score = 100 - (Incidents × 10)
 */
export function calculateIncidentScore(incidents: number): number {
  return Math.max(0, 100 - (incidents * 10));
}

// =============================================================================
// RATING UPDATES
// =============================================================================

/**
 * Update rating based on mission completion.
 */
export function updateRatingFromMission(
  currentComponents: Map<string, number>,
  currentTier: number,
  result: MissionResult,
  missionHistory: { successful: number; total: number }
): RatingChange {
  const newComponents = new Map(currentComponents);
  const componentChanges: RatingChange['components'] = [];

  // Update delivery success rate
  const newTotal = missionHistory.total + 1;
  const newSuccessful = missionHistory.successful + (result.success ? 1 : 0);
  const newDelSuc = calculateDeliverySuccessRate(newSuccessful, newTotal);
  updateComponent(newComponents, componentChanges, 'DEL_SUC', newDelSuc);

  // Update speed performance (rolling average approximation)
  if (result.success) {
    const speedScore = calculateSpeedPerformance(
      result.deliveryTimeActual,
      result.deliveryTimeExpected
    );
    const currentSpeed = currentComponents.get('DEL_SPD') ?? 80;
    const newSpeed = Math.round((currentSpeed * 0.9) + (speedScore * 0.1));
    updateComponent(newComponents, componentChanges, 'DEL_SPD', newSpeed);
  }

  // Update customer satisfaction if rated
  if (result.customerRating !== undefined) {
    const currentSat = currentComponents.get('CUST_SAT') ?? 80;
    const ratingScore = result.customerRating * 20; // 1-5 → 20-100
    const newSat = Math.round((currentSat * 0.95) + (ratingScore * 0.05));
    updateComponent(newComponents, componentChanges, 'CUST_SAT', newSat);
  }

  // Update package integrity
  if (result.packageDamaged) {
    const currentInt = currentComponents.get('PKG_INT') ?? 100;
    const penalty = result.packageFragile ? 10 : 5;
    updateComponent(newComponents, componentChanges, 'PKG_INT', currentInt - penalty);
  }

  // Update route efficiency
  const currentEff = currentComponents.get('ROUTE_EFF') ?? 80;
  const newEff = Math.round((currentEff * 0.9) + (result.routeEfficiency * 0.1));
  updateComponent(newComponents, componentChanges, 'ROUTE_EFF', newEff);

  // Update incident score
  if (result.incidentOccurred) {
    const currentIncident = currentComponents.get('INCIDENT') ?? 100;
    updateComponent(newComponents, componentChanges, 'INCIDENT', currentIncident - 10);
  }

  // Update special mission bonus
  if (result.isSpecialMission && result.success) {
    const currentSpecial = currentComponents.get('SPECIAL') ?? 0;
    updateComponent(newComponents, componentChanges, 'SPECIAL', Math.min(100, currentSpecial + 5));
  }

  // Calculate new rating
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

function updateComponent(
  components: Map<string, number>,
  changes: RatingChange['components'],
  code: string,
  newValue: number
): void {
  const clamped = Math.min(100, Math.max(0, newValue));
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

// =============================================================================
// DECAY & DEATH SPIRAL PREVENTION
// =============================================================================

/**
 * Calculate rating decay for inactive accounts.
 * Decay: 0.1 rating per day after 7 days inactive
 */
export function calculateDecay(
  currentRating: number,
  daysInactive: number
): number {
  if (daysInactive <= 7) return 0;

  const decayDays = daysInactive - 7;
  const decay = decayDays * 0.1;

  return Math.min(decay, currentRating * 0.1); // Cap at 10% of current rating
}

/**
 * Apply death spiral protection.
 * At low ratings (<60), failures have reduced impact.
 */
export function applyDeathSpiralProtection(
  currentRating: number,
  proposedChange: number
): number {
  if (proposedChange >= 0) return proposedChange; // Only protect against losses

  if (currentRating < 60) {
    // Reduce negative impact by 50% when struggling
    return proposedChange * 0.5;
  }

  if (currentRating < 40) {
    // Reduce negative impact by 75% when critically low
    return proposedChange * 0.25;
  }

  return proposedChange;
}

/**
 * Check if rating qualifies for tier-up bonus missions.
 */
export function isNearTierUp(rating: number): boolean {
  const currentTier = getTierFromRating(rating);
  if (currentTier >= 10) return false;

  const nextThreshold = TIER_THRESHOLDS[currentTier]!;
  return (nextThreshold - rating) <= 10;
}

// =============================================================================
// ALGORITHM VOICE HOOKS
// =============================================================================

/**
 * Get Algorithm commentary on rating change.
 * Used for the cochlear implant narrative.
 */
export function getAlgorithmCommentary(change: RatingChange): string {
  if (change.tierChanged && change.newTier > change.previousTier) {
    return `TIER ADVANCEMENT DETECTED. Welcome to Tier ${change.newTier}. New opportunities await. Your efficiency has been... noted.`;
  }

  if (change.tierChanged && change.newTier < change.previousTier) {
    return `TIER REGRESSION. You have been reassigned to Tier ${change.newTier}. Performance improvement required. The Algorithm is patient.`;
  }

  if (change.delta > 5) {
    return `Excellent performance. Rating improved by ${change.delta.toFixed(1)}. You are in the top ${Math.round(100 - change.newRating / 10)}% today.`;
  }

  if (change.delta < -5) {
    return `Performance below expectations. Rating decreased by ${Math.abs(change.delta).toFixed(1)}. Corrective action recommended.`;
  }

  if (change.delta > 0) {
    return `Rating updated: +${change.delta.toFixed(1)}. Continue.`;
  }

  if (change.delta < 0) {
    return `Rating adjusted: ${change.delta.toFixed(1)}. Room for improvement detected.`;
  }

  return `Rating stable. The Algorithm watches.`;
}
