/**
 * Surge Protocol - Database Types
 *
 * TypeScript types matching the D1 schema.
 */

// =============================================================================
// ENUMS (from enum tables)
// =============================================================================

export type SexType = 'MALE' | 'FEMALE' | 'NONBINARY' | 'SYNTHETIC' | 'UNKNOWN';
export type BloodType = 'A_POS' | 'A_NEG' | 'B_POS' | 'B_NEG' | 'AB_POS' | 'AB_NEG' | 'O_POS' | 'O_NEG' | 'SYNTHETIC';
export type ConsciousnessState = 'NORMAL' | 'FORKED' | 'MERGED' | 'FRAGMENTED' | 'TRANSCENDED';
export type CorporateStanding = 'EXEMPLARY' | 'GOOD' | 'NEUTRAL' | 'PROBATION' | 'TERMINATED';
export type ConvergencePath = 'UNDECIDED' | 'HUMAN' | 'HYBRID' | 'DIGITAL' | 'TRANSCENDENT';

export type MissionType = 'STANDARD' | 'EXPRESS' | 'HAZMAT' | 'COVERT' | 'COMBAT' | 'ESCORT' | 'EXTRACTION';
export type MissionStatus = 'AVAILABLE' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ABANDONED' | 'EXPIRED';
export type CargoType = 'STANDARD' | 'FRAGILE' | 'HAZMAT' | 'LIVING' | 'DATA' | 'CONTRABAND' | 'UNKNOWN';

export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'UNIQUE';
export type ItemType = 'WEAPON' | 'ARMOR' | 'AUGMENT' | 'CONSUMABLE' | 'KEY_ITEM' | 'JUNK' | 'CURRENCY';
export type WeaponClass = 'PISTOL' | 'SMG' | 'RIFLE' | 'SHOTGUN' | 'SNIPER' | 'MELEE' | 'UNARMED' | 'HEAVY';
export type DamageType = 'PHYSICAL' | 'ENERGY' | 'CHEMICAL' | 'EMP' | 'NEURAL' | 'FIRE' | 'COLD';

export type ReputationTier = 'HOSTILE' | 'UNFRIENDLY' | 'NEUTRAL' | 'FRIENDLY' | 'ALLIED' | 'REVERED';
export type FactionType = 'CORPORATION' | 'GANG' | 'SYNDICATE' | 'GOVERNMENT' | 'UNDERGROUND' | 'CULT' | 'INDEPENDENT';

// =============================================================================
// CORE ENTITIES
// =============================================================================

/** Character record from characters table */
export interface Character {
  id: string;
  player_id: string;
  created_at: string;
  updated_at: string;

  // Identity
  legal_name: string;
  street_name: string | null;
  handle: string | null;

  // Physical
  sex: SexType | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  blood_type: BloodType | null;

  // Visual
  appearance_data: string | null; // JSON
  portrait_asset: string | null;

  // Corporate Status
  omnideliver_id: string | null;
  corporate_standing: CorporateStanding;
  employee_since: string | null;

  // Progression
  current_tier: number;
  current_xp: number;
  xp_to_next_tier: number | null;
  lifetime_xp: number;

  // Track/Spec
  track_id: string | null;
  specialization_id: string | null;
  convergence_path: ConvergencePath;

  // Rating
  carrier_rating: number;
  rating_visible: number;
  rating_hidden_modifier: number;
  total_deliveries: number;
  perfect_deliveries: number;
  failed_deliveries: number;

  // Resources
  current_health: number;
  max_health: number;
  current_stamina: number;
  max_stamina: number;
  current_humanity: number;
  max_humanity: number;

  // Consciousness
  consciousness_state: ConsciousnessState;
  network_integration_level: number;
  fork_count: number;

  // Location
  current_location_id: string | null;
  home_location_id: string | null;

  // Status
  is_active: number; // 0 or 1 (boolean)
  is_dead: number; // 0 or 1 (boolean)
  death_timestamp: string | null;
  death_cause: string | null;

  // Meta
  total_playtime_seconds: number;
  last_played: string | null;
}

/** Character attribute record */
export interface CharacterAttribute {
  id: string;
  character_id: string;
  attribute_id: string;
  base_value: number;
  current_value: number;
  bonus_from_augments: number;
  bonus_from_items: number;
  bonus_from_conditions: number;
  temporary_modifier: number;
  times_increased: number;
  xp_invested: number;
  created_at: string;
  updated_at: string;
}

/** Rating components record */
export interface RatingComponents {
  id: string;
  character_id: string;

  // Speed
  avg_delivery_time_vs_estimate: number;
  express_deliveries_completed: number;
  late_deliveries: number;

  // Care
  packages_damaged: number;
  packages_lost: number;
  fragile_success_rate: number;

  // Reliability
  missions_accepted: number;
  missions_completed: number;
  missions_abandoned: number;
  consecutive_completions: number;

  // Customer
  five_star_ratings: number;
  one_star_ratings: number;
  complaints_received: number;
  compliments_received: number;

  // Hidden
  corporate_compliance_score: number;
  route_obedience: number;
  surveillance_cooperation: number;
  unauthorized_stops: number;

  created_at: string;
  updated_at: string;
}

/** Mission definition */
export interface MissionDefinition {
  id: string;
  code: string;
  name: string;
  mission_type: MissionType;
  tier_minimum: number;
  tier_maximum: number;
  description: string | null;
  briefing_text: string | null;
  base_credits: number;
  base_xp: number;
  time_limit_minutes: number | null;
  cargo_type: CargoType;
  is_repeatable: number;
  cooldown_hours: number | null;
  created_at: string;
  updated_at: string;
}

/** Active character mission */
export interface CharacterMission {
  id: string;
  character_id: string;
  mission_id: string;
  status: MissionStatus;
  accepted_at: string;
  started_at: string | null;
  completed_at: string | null;
  deadline: string | null;
  current_objective_index: number;
  objectives_completed: string | null; // JSON array
  complications_triggered: string | null; // JSON array
  final_rating: number | null;
  credits_earned: number | null;
  xp_earned: number | null;
  created_at: string;
  updated_at: string;
}

/** Faction record */
export interface Faction {
  id: string;
  code: string;
  name: string;
  faction_type: FactionType;
  description: string | null;
  philosophy: string | null;
  territory_description: string | null;
  leader_npc_id: string | null;
  headquarters_location_id: string | null;
  is_joinable: number;
  is_hostile_default: number;
  created_at: string;
  updated_at: string;
}

/** Character faction reputation */
export interface CharacterReputation {
  id: string;
  character_id: string;
  faction_id: string;
  reputation_value: number;
  reputation_tier: ReputationTier;
  is_member: number;
  rank_in_faction: string | null;
  missions_completed_for: number;
  lifetime_reputation_gained: number;
  lifetime_reputation_lost: number;
  last_interaction: string | null;
  created_at: string;
  updated_at: string;
}

/** Inventory item */
export interface CharacterInventory {
  id: string;
  character_id: string;
  item_id: string;
  quantity: number;
  is_equipped: number;
  equipped_slot: string | null;
  durability_current: number | null;
  durability_max: number | null;
  custom_name: string | null;
  acquired_from: string | null;
  acquired_at: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// QUERY RESULT TYPES
// =============================================================================

/** Character with computed stats */
export interface CharacterWithStats extends Character {
  attributes: Record<string, number>;
  skills: Record<string, number>;
  equipped_items: string[];
}

/** Mission with objective details */
export interface MissionWithObjectives extends MissionDefinition {
  objectives: Array<{
    id: string;
    description: string;
    order_index: number;
    is_optional: number;
  }>;
}

/** Leaderboard entry */
export interface LeaderboardEntry {
  rank: number;
  character_id: string;
  handle: string;
  carrier_rating: number;
  total_deliveries: number;
  perfect_deliveries: number;
}
