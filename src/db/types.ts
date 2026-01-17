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

export type VehicleClass = 'BIKE' | 'CAR' | 'TRUCK' | 'VAN' | 'SUV' | 'MOTORCYCLE' | 'SCOOTER' | 'QUADCOPTER' | 'VTOL' | 'BOAT' | 'MECH_LIGHT' | 'MECH_HEAVY' | 'EXOTIC';
export type SaveType = 'MANUAL' | 'AUTO' | 'QUICK' | 'CHECKPOINT' | 'IRONMAN' | 'BACKUP' | 'CLOUD';
export type DifficultyLevel = 'STORY' | 'EASY' | 'NORMAL' | 'HARD' | 'NIGHTMARE' | 'IRONMAN' | 'CUSTOM';

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

// =============================================================================
// VEHICLE TYPES
// =============================================================================

/** Vehicle definition from vehicle_definitions table */
export interface VehicleDefinition {
  id: string;
  code: string;
  name: string;
  manufacturer: string | null;
  model_year: number | null;
  description: string | null;

  // Classification
  vehicle_class: VehicleClass;
  vehicle_type: string | null;
  size_category: string | null;
  rarity: Rarity;

  // Performance
  top_speed_kmh: number;
  acceleration_0_100_seconds: number;
  handling_rating: number;
  braking_rating: number;
  offroad_capability: number;

  // Durability
  max_hull_points: number;
  armor_rating: number;
  damage_resistances: string | null; // JSON

  // Capacity
  passenger_capacity: number;
  cargo_capacity_kg: number;
  cargo_volume_liters: number;
  towing_capacity_kg: number;

  // Power
  power_source: string | null;
  fuel_capacity: number;
  fuel_consumption_per_km: number;
  range_km: number;
  recharge_time_hours: number;

  // Requirements
  required_tier: number;
  required_skill_id: string | null;
  required_skill_level: number;
  license_required: string | null;

  // Economy
  base_price: number;
  insurance_cost_monthly: number;
  maintenance_cost_monthly: number;

  // Features
  autopilot_level: number;
  network_connected: number; // boolean
  stealth_capable: number; // boolean
  centaur_compatible: number; // boolean
  neural_interface_required: number; // boolean

  created_at: string;
  updated_at: string;
}

/** Character's owned vehicle from character_vehicles table */
export interface CharacterVehicle {
  id: string;
  character_id: string;
  vehicle_definition_id: string;
  acquired_at: string;

  // Identity
  custom_name: string | null;
  license_plate: string | null;
  vin: string | null;
  is_registered: number; // boolean

  // State
  current_location_id: string | null;
  current_coordinates: string | null; // JSON {lat, lng}
  current_hull_points: number;
  current_fuel: number;
  odometer_km: number;
  is_damaged: number; // boolean

  // Customization
  paint_color_primary: string | null;
  paint_color_secondary: string | null;
  installed_mods: string | null; // JSON

  // Ownership
  ownership_type: string | null;
  owned_outright: number; // boolean
  loan_id: string | null;
  insured: number; // boolean

  // Corporate
  corporate_issued: number; // boolean
  corporate_tracked: number; // boolean
  transponder_disabled: number; // boolean

  // Tracking
  total_deliveries: number;
  total_distance_km: number;
  accidents: number;
}

/** Character vehicle with definition details */
export interface CharacterVehicleWithDetails extends CharacterVehicle {
  definition: VehicleDefinition;
}

// =============================================================================
// SAVE SYSTEM TYPES
// =============================================================================

/** Save game record from save_games table */
export interface SaveGame {
  id: string;
  player_id: string;
  created_at: string;
  updated_at: string;

  // Identity
  save_name: string | null;
  save_type: SaveType;
  save_slot: number | null;
  is_auto_save: number; // boolean
  is_quicksave: number; // boolean

  // Character
  character_id: string | null;
  character_name: string | null;
  character_tier: number | null;
  character_track: string | null;

  // Progress
  playtime_seconds: number;
  story_progress_percent: number;
  main_arc_name: string | null;
  main_mission_name: string | null;

  // Location
  current_location_id: string | null;
  current_location_name: string | null;
  current_coordinates: string | null; // JSON

  // Thumbnail
  screenshot_asset: string | null;
  thumbnail_asset: string | null;

  // Version
  game_version: string | null;
  save_version: number;
  compatible_versions: string | null; // JSON

  // State
  is_valid: number; // boolean
  is_corrupted: number; // boolean
  is_ironman: number; // boolean
  difficulty: DifficultyLevel | null;

  // Metadata
  total_missions_completed: number;
  total_credits_earned: number;
  total_distance_km: number;
  enemies_defeated: number;
  deaths: number;

  // Cloud
  cloud_synced: number; // boolean
  cloud_sync_at: string | null;
  cloud_id: string | null;

  // Integrity
  data_checksum: string | null;
  tamper_detected: number; // boolean
}

/** Save data chunk from save_data_chunks table */
export interface SaveDataChunk {
  id: string;
  save_id: string;
  chunk_type: string;

  // Data
  data: string; // JSON compressed state
  data_version: number;
  compressed: number; // boolean
  compressed_size_bytes: number | null;
  uncompressed_size_bytes: number | null;

  // Integrity
  checksum: string | null;
  is_valid: number; // boolean

  // Dependencies
  depends_on_chunks: string | null; // JSON
  load_priority: number;

  created_at: string;
  updated_at: string;
}

/** Checkpoint record from checkpoints table */
export interface Checkpoint {
  id: string;
  save_id: string;
  created_at: string;

  // Context
  checkpoint_type: string | null;
  trigger_source: string | null;
  description: string | null;

  // Location
  location_id: string | null;
  coordinates: string | null; // JSON

  // State
  critical_state: string | null; // JSON

  // Limits
  expires_at: string | null;
  is_persistent: number; // boolean

  // Meta
  replay_possible: number; // boolean
  restore_count: number;
}
