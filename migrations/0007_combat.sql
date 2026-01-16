-- SURGE PROTOCOL: Database Schema Migration
-- Part 7: Combat System & Status Effects
-- Tables: combat, conditions, addictions, cyberpsychosis

-- ============================================
-- DAMAGE TYPE DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS damage_type_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Properties
    is_physical INTEGER DEFAULT 0, -- BOOLEAN
    is_energy INTEGER DEFAULT 0, -- BOOLEAN
    is_elemental INTEGER DEFAULT 0, -- BOOLEAN
    is_exotic INTEGER DEFAULT 0, -- BOOLEAN

    -- Armor Interaction
    armor_effectiveness REAL DEFAULT 1.0,
    shield_effectiveness REAL DEFAULT 1.0,

    -- Special
    can_crit INTEGER DEFAULT 1, -- BOOLEAN
    leaves_status_id TEXT,
    environmental_source INTEGER DEFAULT 0, -- BOOLEAN

    -- Resistance Source
    common_resistances TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- COMBAT ARENAS
-- ============================================

CREATE TABLE IF NOT EXISTS combat_arenas (
    id TEXT PRIMARY KEY,
    location_id TEXT REFERENCES locations(id),
    name TEXT,

    -- Dimensions
    width_m INTEGER DEFAULT 50,
    height_m INTEGER DEFAULT 50,
    grid_size_m REAL DEFAULT 1.0,

    -- Terrain
    terrain_map TEXT, -- JSON
    elevation_map TEXT, -- JSON
    cover_points TEXT, -- JSON
    hazard_zones TEXT, -- JSON

    -- Spawns
    player_spawn_points TEXT, -- JSON
    enemy_spawn_points TEXT, -- JSON
    reinforcement_points TEXT, -- JSON

    -- Interactables
    interactable_objects TEXT, -- JSON
    destructibles TEXT, -- JSON
    hackable_objects TEXT, -- JSON

    -- Environment
    lighting_level INTEGER DEFAULT 50,
    ambient_hazards TEXT, -- JSON
    weather_effects TEXT, -- JSON
    noise_level INTEGER DEFAULT 50,

    -- Vertical
    has_multiple_levels INTEGER DEFAULT 0, -- BOOLEAN
    level_connections TEXT, -- JSON
    fall_damage_enabled INTEGER DEFAULT 1, -- BOOLEAN

    -- AI Hints
    patrol_routes TEXT, -- JSON
    sniper_positions TEXT, -- JSON
    flanking_routes TEXT, -- JSON
    retreat_routes TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- COMBAT ENCOUNTERS
-- ============================================

CREATE TABLE IF NOT EXISTS combat_encounters (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,

    -- Type
    encounter_type TEXT,
    difficulty_rating INTEGER DEFAULT 5,
    is_scripted INTEGER DEFAULT 0, -- BOOLEAN
    is_avoidable INTEGER DEFAULT 1, -- BOOLEAN

    -- Location
    location_id TEXT REFERENCES locations(id),
    combat_arena_id TEXT REFERENCES combat_arenas(id),
    environment_modifiers TEXT, -- JSON

    -- Enemies
    enemy_spawn_groups TEXT, -- JSON
    boss_npc_id TEXT REFERENCES npc_definitions(id),

    -- Objectives
    primary_objective TEXT,
    optional_objectives TEXT, -- JSON
    failure_conditions TEXT, -- JSON
    time_limit_seconds INTEGER,

    -- Rewards
    xp_reward INTEGER DEFAULT 0,
    cred_reward INTEGER DEFAULT 0,
    item_drops TEXT, -- JSON
    special_rewards TEXT, -- JSON

    -- Consequences
    retreat_possible INTEGER DEFAULT 1, -- BOOLEAN
    retreat_penalty TEXT, -- JSON
    death_consequence TEXT,
    narrative_impact TEXT, -- JSON

    -- AI Settings
    enemy_ai_profile TEXT,
    enemy_coordination INTEGER DEFAULT 50,
    enemy_morale_enabled INTEGER DEFAULT 1, -- BOOLEAN
    surrender_possible INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- COMBAT ACTION DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS combat_action_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Type
    action_type TEXT,
    action_cost INTEGER DEFAULT 1,
    is_free_action INTEGER DEFAULT 0, -- BOOLEAN
    is_reaction INTEGER DEFAULT 0, -- BOOLEAN

    -- Requirements
    requires_weapon_type TEXT, -- JSON
    requires_ability_id TEXT REFERENCES ability_definitions(id),
    requires_augment_id TEXT REFERENCES augment_definitions(id),
    min_attribute TEXT, -- JSON
    requires_stance TEXT,

    -- Targeting
    target_type TEXT,
    target_count INTEGER DEFAULT 1,
    range_min_m INTEGER DEFAULT 0,
    range_max_m INTEGER,
    requires_los INTEGER DEFAULT 1, -- BOOLEAN
    area_of_effect TEXT, -- JSON

    -- Effects
    damage_formula TEXT,
    damage_type TEXT REFERENCES enum_damage_type(value),
    status_effects TEXT, -- JSON
    knockback INTEGER DEFAULT 0,
    special_effects TEXT, -- JSON

    -- Modifiers
    accuracy_modifier INTEGER DEFAULT 0,
    critical_chance_modifier INTEGER DEFAULT 0,
    critical_damage_modifier REAL DEFAULT 1.0,

    -- Animation
    animation_id TEXT,
    sound_effect_id TEXT,
    visual_effect_id TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- COMBAT INSTANCES (Active)
-- ============================================

CREATE TABLE IF NOT EXISTS combat_instances (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    encounter_id TEXT REFERENCES combat_encounters(id),
    started_at TEXT DEFAULT (datetime('now')),

    -- State
    status TEXT DEFAULT 'INITIALIZING' REFERENCES enum_combat_status(value),
    current_round INTEGER DEFAULT 1,
    current_turn_entity_id TEXT,
    turn_order TEXT, -- JSON

    -- Participants
    player_participants TEXT, -- JSON
    enemy_participants TEXT, -- JSON
    neutral_participants TEXT, -- JSON
    reinforcements_called INTEGER DEFAULT 0, -- BOOLEAN

    -- Tracking
    damage_dealt_by_player INTEGER DEFAULT 0,
    damage_taken_by_player INTEGER DEFAULT 0,
    enemies_defeated INTEGER DEFAULT 0,
    allies_lost INTEGER DEFAULT 0,
    rounds_elapsed INTEGER DEFAULT 0,
    time_elapsed_seconds INTEGER DEFAULT 0,

    -- Resources Used
    ammo_expended TEXT, -- JSON
    items_used TEXT, -- JSON
    abilities_used TEXT, -- JSON
    health_items_used INTEGER DEFAULT 0,

    -- Outcome
    ended_at TEXT,
    outcome TEXT,
    objectives_completed TEXT, -- JSON
    loot_dropped TEXT, -- JSON
    xp_earned INTEGER DEFAULT 0,
    special_achievements TEXT, -- JSON

    -- Replay
    action_log TEXT, -- JSON
    replay_seed INTEGER
);

-- ============================================
-- CONDITION DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS condition_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon_asset TEXT,

    -- Classification
    condition_type TEXT REFERENCES enum_condition_type(value),
    severity INTEGER DEFAULT 1,
    is_positive INTEGER DEFAULT 0, -- BOOLEAN
    is_visible INTEGER DEFAULT 1, -- BOOLEAN
    is_dispellable INTEGER DEFAULT 1, -- BOOLEAN

    -- Duration
    duration_type TEXT,
    default_duration_seconds INTEGER DEFAULT 60,
    can_stack_duration INTEGER DEFAULT 0, -- BOOLEAN

    -- Stacking
    stacks INTEGER DEFAULT 0, -- BOOLEAN
    max_stacks INTEGER DEFAULT 1,
    stack_behavior TEXT,

    -- Effects
    stat_modifiers TEXT, -- JSON
    attribute_modifiers TEXT, -- JSON
    damage_over_time TEXT, -- JSON
    healing_over_time TEXT, -- JSON
    movement_modifier REAL DEFAULT 1.0,
    action_restrictions TEXT, -- JSON
    special_effects TEXT, -- JSON

    -- Triggers
    on_apply_effect TEXT, -- JSON
    on_expire_effect TEXT, -- JSON
    on_tick_effect TEXT, -- JSON
    on_stack_effect TEXT, -- JSON

    -- Removal
    removal_conditions TEXT, -- JSON
    cleanse_types TEXT, -- JSON
    immunity_after_removal INTEGER DEFAULT 0,

    -- Sources
    typical_sources TEXT, -- JSON
    augment_mitigation TEXT, -- JSON
    skill_mitigation_id TEXT REFERENCES skill_definitions(id),

    -- Visuals
    visual_effect_on_character TEXT,
    screen_effect TEXT,
    audio_effect TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER CONDITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS character_conditions (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    condition_id TEXT NOT NULL REFERENCES condition_definitions(id),
    applied_at TEXT DEFAULT (datetime('now')),

    -- State
    current_stacks INTEGER DEFAULT 1,
    duration_remaining_seconds REAL,
    is_paused INTEGER DEFAULT 0, -- BOOLEAN

    -- Source
    source_type TEXT,
    source_id TEXT,
    source_name TEXT,

    -- Tracking
    times_ticked INTEGER DEFAULT 0,
    total_damage_dealt INTEGER DEFAULT 0,
    total_healing_done INTEGER DEFAULT 0,
    times_refreshed INTEGER DEFAULT 0
);

-- ============================================
-- ADDICTION TYPES
-- ============================================

CREATE TABLE IF NOT EXISTS addiction_types (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    substance_id TEXT REFERENCES item_definitions(id),

    -- Progression
    stages TEXT, -- JSON array of stage definitions
    tolerance_rate REAL DEFAULT 0.1,
    dependence_rate REAL DEFAULT 0.1,
    decay_rate_per_day REAL DEFAULT 0.05,

    -- Withdrawal
    withdrawal_onset_hours INTEGER DEFAULT 12,
    withdrawal_peak_hours INTEGER DEFAULT 48,
    withdrawal_duration_hours INTEGER DEFAULT 72,
    withdrawal_effects TEXT, -- JSON
    withdrawal_lethality REAL DEFAULT 0.01,

    -- Treatment
    treatment_methods TEXT, -- JSON
    treatment_cost INTEGER DEFAULT 1000,
    treatment_duration_days INTEGER DEFAULT 7,
    relapse_risk REAL DEFAULT 0.2,

    -- Cravings
    craving_triggers TEXT, -- JSON
    craving_strength_base INTEGER DEFAULT 50,
    craving_response_options TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER ADDICTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS character_addictions (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    addiction_type_id TEXT NOT NULL REFERENCES addiction_types(id),
    started_at TEXT DEFAULT (datetime('now')),

    -- State
    current_stage INTEGER DEFAULT 1,
    tolerance_level REAL DEFAULT 0,
    dependence_level REAL DEFAULT 0,
    last_use TEXT,
    times_used_total INTEGER DEFAULT 0,

    -- Withdrawal
    in_withdrawal INTEGER DEFAULT 0, -- BOOLEAN
    withdrawal_stage INTEGER DEFAULT 0,
    withdrawal_started TEXT,

    -- Treatment
    in_treatment INTEGER DEFAULT 0, -- BOOLEAN
    treatment_progress REAL DEFAULT 0,
    treatment_start TEXT,
    treatment_method TEXT,

    -- History
    recovery_attempts INTEGER DEFAULT 0,
    relapses INTEGER DEFAULT 0,
    clean_streaks TEXT, -- JSON
    longest_clean_streak_hours INTEGER DEFAULT 0,

    -- Cravings
    current_craving_strength INTEGER DEFAULT 0,
    last_craving TEXT,
    cravings_resisted INTEGER DEFAULT 0,
    cravings_succumbed INTEGER DEFAULT 0,

    UNIQUE(character_id, addiction_type_id)
);

-- ============================================
-- CYBERPSYCHOSIS EPISODES
-- ============================================

CREATE TABLE IF NOT EXISTS cyberpsychosis_episodes (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    occurred_at TEXT DEFAULT (datetime('now')),

    -- Trigger
    trigger_type TEXT,
    trigger_source_id TEXT,
    humanity_at_trigger INTEGER,

    -- Episode
    severity INTEGER DEFAULT 1,
    duration_minutes INTEGER DEFAULT 5,
    episode_type TEXT,

    -- Effects
    actions_during TEXT, -- JSON
    npcs_harmed TEXT, -- JSON
    property_destroyed TEXT, -- JSON
    memories_lost TEXT, -- JSON

    -- Resolution
    resolution_method TEXT,
    resolved_by_npc_id TEXT REFERENCES npc_definitions(id),
    humanity_after INTEGER,
    permanent_effects TEXT, -- JSON

    -- Consequences
    legal_consequences TEXT, -- JSON
    reputation_impacts TEXT, -- JSON
    relationship_impacts TEXT, -- JSON
    narrative_flags_set TEXT -- JSON
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_combat_arenas_loc ON combat_arenas(location_id);
CREATE INDEX IF NOT EXISTS idx_combat_encounters_loc ON combat_encounters(location_id);
CREATE INDEX IF NOT EXISTS idx_combat_instances_char ON combat_instances(character_id);
CREATE INDEX IF NOT EXISTS idx_combat_instances_status ON combat_instances(status);
CREATE INDEX IF NOT EXISTS idx_condition_defs_type ON condition_definitions(condition_type);
CREATE INDEX IF NOT EXISTS idx_char_conditions_char ON character_conditions(character_id);
CREATE INDEX IF NOT EXISTS idx_char_addictions_char ON character_addictions(character_id);
CREATE INDEX IF NOT EXISTS idx_cyberpsychosis_char ON cyberpsychosis_episodes(character_id);
