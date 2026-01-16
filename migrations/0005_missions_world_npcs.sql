-- SURGE PROTOCOL: Database Schema Migration
-- Part 5: Missions, World Geography, NPCs & Factions
-- Tables: missions, locations, npcs, factions

-- ============================================
-- REGIONS
-- ============================================

CREATE TABLE IF NOT EXISTS regions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    lore_description TEXT,

    -- Geography
    parent_region_id TEXT REFERENCES regions(id),
    region_type TEXT REFERENCES enum_region_type(value),
    area_sq_km REAL,
    bounding_box TEXT, -- JSON polygon
    center_coordinates TEXT, -- JSON {lat, lng}

    -- Governance
    controlling_faction_id TEXT,
    law_level INTEGER DEFAULT 5,
    corporate_presence INTEGER DEFAULT 50,
    police_response_time_minutes INTEGER DEFAULT 10,

    -- Demographics
    population INTEGER,
    population_density REAL,
    wealth_level INTEGER DEFAULT 5,
    crime_rate INTEGER DEFAULT 5,

    -- Services
    network_coverage INTEGER DEFAULT 90,
    medical_facility_tier INTEGER DEFAULT 3,
    augment_clinic_tier INTEGER DEFAULT 2,
    black_market_presence INTEGER DEFAULT 20,

    -- Atmosphere
    aesthetic_tags TEXT, -- JSON
    dominant_culture TEXT,
    ambient_danger_level INTEGER DEFAULT 5,
    delivery_demand_level INTEGER DEFAULT 5,

    -- Gameplay
    tier_requirement INTEGER DEFAULT 1,
    has_interstitial_access INTEGER DEFAULT 0, -- BOOLEAN
    restricted_access INTEGER DEFAULT 0, -- BOOLEAN
    access_requirements TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- LOCATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    flavor_text TEXT,

    -- Hierarchy
    region_id TEXT REFERENCES regions(id),
    parent_location_id TEXT REFERENCES locations(id),
    floor_level INTEGER DEFAULT 0,

    -- Geography
    location_type TEXT REFERENCES enum_location_type(value),
    coordinates TEXT, -- JSON {lat, lng}
    address TEXT,
    entrance_coordinates TEXT, -- JSON
    footprint TEXT, -- JSON polygon
    elevation_m INTEGER DEFAULT 0,

    -- Accessibility
    access_type TEXT REFERENCES enum_access_type(value),
    tier_requirement INTEGER DEFAULT 1,
    faction_requirement_id TEXT,
    reputation_requirement INTEGER DEFAULT 0,
    locked INTEGER DEFAULT 0, -- BOOLEAN
    lock_difficulty INTEGER DEFAULT 5,
    hackable_entrance INTEGER DEFAULT 0, -- BOOLEAN
    hack_difficulty INTEGER DEFAULT 5,

    -- Interior
    is_interior INTEGER DEFAULT 0, -- BOOLEAN
    has_interior INTEGER DEFAULT 0, -- BOOLEAN
    interior_size TEXT,
    sub_locations TEXT, -- JSON

    -- Services
    services_offered TEXT, -- JSON
    vendor_npcs TEXT, -- JSON
    quest_givers TEXT, -- JSON
    respawn_point INTEGER DEFAULT 0, -- BOOLEAN
    fast_travel_point INTEGER DEFAULT 0, -- BOOLEAN

    -- Activity
    hours_open TEXT, -- JSON
    npc_spawn_data TEXT, -- JSON
    ambient_population INTEGER DEFAULT 10,

    -- Corporate
    owning_corporation TEXT,
    security_level INTEGER DEFAULT 0,
    surveillance_level INTEGER DEFAULT 0,

    -- Interstitial
    interstitial_access_point INTEGER DEFAULT 0, -- BOOLEAN
    interstitial_connections TEXT, -- JSON
    interstitial_tier_required INTEGER DEFAULT 5,

    -- State (mutable)
    is_destroyed INTEGER DEFAULT 0, -- BOOLEAN
    current_owner_faction_id TEXT,
    contested INTEGER DEFAULT 0, -- BOOLEAN
    lockdown_active INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- ROUTES
-- ============================================

CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    name TEXT,

    -- Endpoints
    origin_location_id TEXT REFERENCES locations(id),
    destination_location_id TEXT REFERENCES locations(id),

    -- Path
    route_type TEXT,
    path_coordinates TEXT, -- JSON linestring
    waypoints TEXT, -- JSON
    distance_km REAL,
    elevation_change_m INTEGER DEFAULT 0,

    -- Requirements
    required_vehicle_class TEXT REFERENCES enum_vehicle_class(value),
    required_tier INTEGER DEFAULT 1,
    requires_interstitial INTEGER DEFAULT 0, -- BOOLEAN

    -- Timing
    base_travel_time_minutes REAL,
    traffic_multipliers TEXT, -- JSON by time of day
    optimal_hours TEXT, -- JSON

    -- Conditions
    surface_type TEXT,
    quality_rating INTEGER DEFAULT 5,
    hazard_level INTEGER DEFAULT 0,
    surveillance_level INTEGER DEFAULT 5,

    -- Features
    charging_stations TEXT, -- JSON
    ambush_points TEXT, -- JSON
    is_secret INTEGER DEFAULT 0, -- BOOLEAN
    discovery_tier INTEGER DEFAULT 1,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- FACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS factions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    short_name TEXT,
    tagline TEXT,
    description TEXT,
    history TEXT,
    goals TEXT,

    -- Classification
    faction_type TEXT REFERENCES enum_faction_type(value),
    faction_size TEXT,
    alignment_corporate INTEGER DEFAULT 0, -- -100 to 100
    alignment_law INTEGER DEFAULT 0, -- -100 to 100
    alignment_violence INTEGER DEFAULT 0, -- -100 to 100

    -- Territory
    headquarters_location_id TEXT REFERENCES locations(id),
    controlled_regions TEXT, -- JSON
    territory_influence TEXT, -- JSON

    -- Resources
    financial_power INTEGER DEFAULT 50,
    military_power INTEGER DEFAULT 50,
    political_power INTEGER DEFAULT 50,
    technological_level INTEGER DEFAULT 50,
    network_capability INTEGER DEFAULT 50,

    -- Relationships
    allied_factions TEXT, -- JSON
    enemy_factions TEXT, -- JSON

    -- Hierarchy
    parent_faction_id TEXT REFERENCES factions(id),
    leadership_structure TEXT,
    leader_npc_id TEXT,

    -- Gameplay
    joinable_by_player INTEGER DEFAULT 0, -- BOOLEAN
    reputation_unlocks TEXT, -- JSON
    exclusive_missions TEXT, -- JSON
    exclusive_vendors TEXT, -- JSON
    exclusive_augments TEXT, -- JSON

    -- Aesthetics
    colors_primary TEXT,
    colors_secondary TEXT,
    symbol_asset TEXT,
    can_be_destroyed INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- NPC DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS npc_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    title TEXT,
    description TEXT,
    background TEXT,

    -- Classification
    npc_type TEXT REFERENCES enum_npc_type(value),
    npc_category TEXT,
    is_unique INTEGER DEFAULT 0, -- BOOLEAN
    is_essential INTEGER DEFAULT 0, -- BOOLEAN
    is_procedural INTEGER DEFAULT 0, -- BOOLEAN

    -- Appearance
    gender TEXT,
    age INTEGER,
    ethnicity TEXT,
    height_cm INTEGER,
    build TEXT,
    distinguishing_features TEXT,
    portrait_asset TEXT,

    -- Personality
    personality_traits TEXT, -- JSON
    speech_patterns TEXT, -- JSON
    mannerisms TEXT,
    likes TEXT, -- JSON
    dislikes TEXT, -- JSON
    goals TEXT, -- JSON

    -- Affiliation
    faction_id TEXT REFERENCES factions(id),
    faction_rank TEXT,
    employer TEXT,
    occupation TEXT,

    -- Location
    home_location_id TEXT REFERENCES locations(id),
    work_location_id TEXT REFERENCES locations(id),
    hangout_locations TEXT, -- JSON
    schedule TEXT, -- JSON

    -- Capabilities
    combat_capable INTEGER DEFAULT 0, -- BOOLEAN
    combat_style TEXT,
    threat_level INTEGER DEFAULT 1,
    skills TEXT, -- JSON
    abilities TEXT, -- JSON
    augments TEXT, -- JSON
    typical_equipment TEXT, -- JSON

    -- Services
    is_vendor INTEGER DEFAULT 0, -- BOOLEAN
    vendor_inventory_id TEXT,
    is_quest_giver INTEGER DEFAULT 0, -- BOOLEAN
    available_quests TEXT, -- JSON
    is_trainer INTEGER DEFAULT 0, -- BOOLEAN
    trainable_skills TEXT, -- JSON

    -- Dialogue
    greeting_dialogue_id TEXT,
    ambient_dialogue TEXT, -- JSON

    -- Narrative
    story_importance INTEGER DEFAULT 0,
    romance_option INTEGER DEFAULT 0, -- BOOLEAN
    killable_by_player INTEGER DEFAULT 1, -- BOOLEAN
    death_consequence TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- NPC INSTANCES (Per Save)
-- ============================================

CREATE TABLE IF NOT EXISTS npc_instances (
    id TEXT PRIMARY KEY,
    npc_definition_id TEXT NOT NULL REFERENCES npc_definitions(id),
    save_id TEXT,

    -- State
    is_alive INTEGER DEFAULT 1, -- BOOLEAN
    is_active INTEGER DEFAULT 1, -- BOOLEAN
    current_health INTEGER,
    current_location_id TEXT REFERENCES locations(id),
    current_activity TEXT,

    -- Relationship
    relationship_with_player INTEGER DEFAULT 0, -- -100 to 100
    trust_level INTEGER DEFAULT 50,
    fear_level INTEGER DEFAULT 0,
    respect_level INTEGER DEFAULT 50,
    romantic_interest INTEGER DEFAULT 0,
    times_met INTEGER DEFAULT 0,
    last_interaction TEXT,

    -- Dialogue State
    dialogue_flags TEXT, -- JSON
    topics_discussed TEXT, -- JSON
    secrets_revealed TEXT, -- JSON
    favors_owed TEXT, -- JSON

    -- Quest State
    quests_given TEXT, -- JSON
    quests_completed TEXT, -- JSON

    -- Memory
    memories_of_player TEXT, -- JSON
    witnessed_events TEXT, -- JSON
    grudges TEXT, -- JSON
    gratitudes TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER REPUTATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS character_reputations (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    faction_id TEXT NOT NULL REFERENCES factions(id),

    -- Value
    current_value INTEGER DEFAULT 0, -- -100 to 100
    displayed_value INTEGER DEFAULT 0,
    hidden_value INTEGER DEFAULT 0,

    -- Thresholds
    current_tier TEXT REFERENCES enum_reputation_tier(value),
    xp_in_tier INTEGER DEFAULT 0,
    xp_to_next_tier INTEGER,

    -- History
    peak_value INTEGER DEFAULT 0,
    lowest_value INTEGER DEFAULT 0,
    total_gained INTEGER DEFAULT 0,
    total_lost INTEGER DEFAULT 0,
    last_change TEXT,

    -- Unlocks
    current_perks TEXT, -- JSON
    available_missions TEXT, -- JSON
    unlocked_vendors TEXT, -- JSON

    -- Status
    is_member INTEGER DEFAULT 0, -- BOOLEAN
    member_rank TEXT,
    marked_for_death INTEGER DEFAULT 0, -- BOOLEAN
    bounty_amount INTEGER DEFAULT 0,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    UNIQUE(character_id, faction_id)
);

-- ============================================
-- MISSION DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS mission_definitions (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    briefing_text TEXT,
    debrief_success_text TEXT,
    debrief_failure_text TEXT,

    -- Classification
    mission_type TEXT REFERENCES enum_mission_type(value),
    mission_category TEXT,
    difficulty_rating INTEGER DEFAULT 5,
    tier_requirement INTEGER DEFAULT 1,
    is_story_mission INTEGER DEFAULT 0, -- BOOLEAN
    is_repeatable INTEGER DEFAULT 0, -- BOOLEAN
    is_procedural INTEGER DEFAULT 0, -- BOOLEAN

    -- Source
    source_type TEXT,
    source_faction_id TEXT REFERENCES factions(id),
    source_npc_id TEXT REFERENCES npc_definitions(id),
    source_location_id TEXT REFERENCES locations(id),

    -- Location
    origin_location_id TEXT REFERENCES locations(id),
    destination_location_id TEXT REFERENCES locations(id),
    waypoint_locations TEXT, -- JSON
    location_constraints TEXT, -- JSON

    -- Time
    time_limit_minutes INTEGER,
    optimal_time_minutes INTEGER,
    window_start_time TEXT,
    window_end_time TEXT,
    window_days TEXT, -- JSON

    -- Cargo
    cargo_type TEXT REFERENCES enum_cargo_type(value),
    cargo_item_id TEXT REFERENCES item_definitions(id),
    cargo_weight_kg REAL,
    cargo_fragility INTEGER DEFAULT 0,
    cargo_perishable INTEGER DEFAULT 0, -- BOOLEAN
    cargo_hazardous INTEGER DEFAULT 0, -- BOOLEAN
    cargo_illegal INTEGER DEFAULT 0, -- BOOLEAN
    cargo_value INTEGER DEFAULT 0,

    -- Requirements
    required_track_id TEXT REFERENCES tracks(id),
    required_specialization_id TEXT REFERENCES specializations(id),
    required_skills TEXT, -- JSON
    required_equipment TEXT, -- JSON
    required_vehicle_class TEXT REFERENCES enum_vehicle_class(value),
    required_reputation TEXT, -- JSON
    prerequisite_missions TEXT, -- JSON

    -- Rewards
    base_pay INTEGER DEFAULT 100,
    time_bonus_per_minute INTEGER DEFAULT 0,
    xp_reward INTEGER DEFAULT 10,
    rating_reward REAL DEFAULT 0.01,
    reputation_rewards TEXT, -- JSON
    item_rewards TEXT, -- JSON

    -- Penalties
    failure_rating_penalty REAL DEFAULT 0.05,
    failure_reputation_penalty TEXT, -- JSON
    late_penalty_per_minute INTEGER DEFAULT 0,
    damage_penalty_per_percent INTEGER DEFAULT 0,

    -- Complications
    possible_complications TEXT, -- JSON
    guaranteed_complications TEXT, -- JSON
    complication_scaling REAL DEFAULT 1.0,

    -- Flags
    affects_main_story INTEGER DEFAULT 0, -- BOOLEAN
    point_of_no_return INTEGER DEFAULT 0, -- BOOLEAN
    algorithm_assigns INTEGER DEFAULT 1, -- BOOLEAN
    hidden_until_discovered INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- MISSION OBJECTIVES
-- ============================================

CREATE TABLE IF NOT EXISTS mission_objectives (
    id TEXT PRIMARY KEY,
    mission_definition_id TEXT NOT NULL REFERENCES mission_definitions(id),
    sequence_order INTEGER DEFAULT 0,

    -- Description
    title TEXT NOT NULL,
    description TEXT,
    hint_text TEXT,
    completion_text TEXT,

    -- Type
    objective_type TEXT,
    is_optional INTEGER DEFAULT 0, -- BOOLEAN
    is_hidden INTEGER DEFAULT 0, -- BOOLEAN
    is_bonus INTEGER DEFAULT 0, -- BOOLEAN

    -- Target
    target_location_id TEXT REFERENCES locations(id),
    target_npc_id TEXT REFERENCES npc_definitions(id),
    target_item_id TEXT REFERENCES item_definitions(id),
    target_coordinates TEXT, -- JSON
    target_quantity INTEGER DEFAULT 1,

    -- Conditions
    completion_conditions TEXT, -- JSON
    failure_conditions TEXT, -- JSON
    time_limit_seconds INTEGER,

    -- Rewards
    completion_xp INTEGER DEFAULT 0,
    completion_creds INTEGER DEFAULT 0,
    completion_items TEXT, -- JSON

    -- Branching
    leads_to_objectives TEXT, -- JSON
    mutually_exclusive_with TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- COMPLICATION DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS complication_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    announcement_text TEXT,

    -- Classification
    complication_type TEXT,
    severity INTEGER DEFAULT 3,
    is_combat INTEGER DEFAULT 0, -- BOOLEAN
    is_timed INTEGER DEFAULT 0, -- BOOLEAN

    -- Triggers
    trigger_condition TEXT,
    trigger_chance_base REAL DEFAULT 0.1,
    trigger_chance_modifiers TEXT, -- JSON
    min_tier INTEGER DEFAULT 1,
    max_tier INTEGER DEFAULT 10,

    -- Effects
    effects_on_trigger TEXT, -- JSON
    effects_on_resolve TEXT, -- JSON
    effects_on_fail TEXT, -- JSON
    time_limit_seconds INTEGER,

    -- Resolution
    resolution_options TEXT, -- JSON
    can_be_prevented INTEGER DEFAULT 1, -- BOOLEAN
    prevention_methods TEXT, -- JSON

    -- Impact
    rating_penalty_unresolved REAL DEFAULT 0.01,
    cargo_damage_risk INTEGER DEFAULT 0,
    time_penalty_minutes INTEGER DEFAULT 0,
    combat_encounter_id TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER MISSIONS (Active)
-- ============================================

CREATE TABLE IF NOT EXISTS character_missions (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    mission_definition_id TEXT NOT NULL REFERENCES mission_definitions(id),
    accepted_at TEXT DEFAULT (datetime('now')),

    -- State
    status TEXT DEFAULT 'ACCEPTED' REFERENCES enum_mission_status(value),
    current_stage INTEGER DEFAULT 0,
    current_objective_id TEXT REFERENCES mission_objectives(id),

    -- Location
    actual_origin_id TEXT REFERENCES locations(id),
    actual_destination_id TEXT REFERENCES locations(id),
    current_waypoint_index INTEGER DEFAULT 0,
    current_location_id TEXT REFERENCES locations(id),

    -- Cargo
    cargo_item_instance_id TEXT REFERENCES character_inventory(id),
    cargo_current_condition INTEGER DEFAULT 100,
    cargo_temperature REAL,

    -- Time
    deadline TEXT,
    time_remaining_seconds INTEGER,
    started_travel_at TEXT,
    actual_arrival TEXT,

    -- Complications
    active_complications TEXT, -- JSON
    resolved_complications TEXT, -- JSON
    complication_damage INTEGER DEFAULT 0,

    -- Outcome
    completed_at TEXT,
    completion_rating TEXT,
    final_pay INTEGER,
    bonus_earned INTEGER DEFAULT 0,
    penalties_incurred INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    rating_change REAL DEFAULT 0,

    -- Tracking
    distance_traveled_km REAL DEFAULT 0,
    time_elapsed_seconds INTEGER DEFAULT 0,
    fuel_consumed REAL DEFAULT 0,
    choices_made TEXT, -- JSON
    narrative_flags_set TEXT -- JSON
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_regions_parent ON regions(parent_region_id);
CREATE INDEX IF NOT EXISTS idx_regions_type ON regions(region_type);
CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(location_type);
CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_location_id);
CREATE INDEX IF NOT EXISTS idx_routes_origin ON routes(origin_location_id);
CREATE INDEX IF NOT EXISTS idx_routes_dest ON routes(destination_location_id);
CREATE INDEX IF NOT EXISTS idx_factions_type ON factions(faction_type);
CREATE INDEX IF NOT EXISTS idx_npc_defs_type ON npc_definitions(npc_type);
CREATE INDEX IF NOT EXISTS idx_npc_defs_faction ON npc_definitions(faction_id);
CREATE INDEX IF NOT EXISTS idx_npc_instances_def ON npc_instances(npc_definition_id);
CREATE INDEX IF NOT EXISTS idx_npc_instances_save ON npc_instances(save_id);
CREATE INDEX IF NOT EXISTS idx_char_reps_char ON character_reputations(character_id);
CREATE INDEX IF NOT EXISTS idx_char_reps_faction ON character_reputations(faction_id);
CREATE INDEX IF NOT EXISTS idx_mission_defs_type ON mission_definitions(mission_type);
CREATE INDEX IF NOT EXISTS idx_mission_defs_tier ON mission_definitions(tier_requirement);
CREATE INDEX IF NOT EXISTS idx_mission_objs_mission ON mission_objectives(mission_definition_id);
CREATE INDEX IF NOT EXISTS idx_char_missions_char ON character_missions(character_id);
CREATE INDEX IF NOT EXISTS idx_char_missions_status ON character_missions(status);
