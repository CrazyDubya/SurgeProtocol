-- SURGE PROTOCOL: Database Schema Migration
-- Part 2: Core Character System
-- Tables: characters, attributes, tracks, specializations, tiers

-- ============================================
-- ATTRIBUTE DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS attribute_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL REFERENCES enum_attribute_category(value),

    -- Scaling
    base_value INTEGER DEFAULT 5,
    min_value INTEGER DEFAULT 1,
    max_value INTEGER DEFAULT 10,
    max_augmented_value INTEGER DEFAULT 15,

    -- Costs
    xp_cost_per_point TEXT, -- JSON array
    training_available INTEGER DEFAULT 1, -- BOOLEAN

    -- Effects
    derived_stats TEXT, -- JSON
    resource_pool_contribution TEXT, -- JSON

    -- Meta
    display_order INTEGER,
    icon_asset TEXT,
    color_hex TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- TRACKS (Career Paths)
-- ============================================

CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    philosophy TEXT,

    -- Requirements
    unlock_tier INTEGER DEFAULT 3,
    prerequisite_missions TEXT, -- JSON

    -- Bonuses
    attribute_bonuses TEXT, -- JSON
    skill_bonuses TEXT, -- JSON
    starting_equipment TEXT, -- JSON

    -- Features
    unique_mechanics TEXT,
    resource_pool_type TEXT,

    -- Display
    icon_asset TEXT,
    color_primary TEXT,
    color_secondary TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- SPECIALIZATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS specializations (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    track_id TEXT REFERENCES tracks(id),

    -- Description
    tagline TEXT,
    description TEXT,
    playstyle TEXT,

    -- Requirements
    unlock_tier INTEGER DEFAULT 6,
    required_skills TEXT, -- JSON
    required_reputation TEXT, -- JSON
    unlock_mission_id TEXT,

    -- Bonuses
    attribute_bonuses TEXT, -- JSON
    skill_bonuses TEXT, -- JSON
    ability_unlocks TEXT, -- JSON

    -- Signature
    signature_ability_id TEXT,
    signature_passive_id TEXT,

    -- Display
    icon_asset TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- TIER DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS tier_definitions (
    id TEXT PRIMARY KEY,
    tier_number INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    rating_minimum REAL NOT NULL,
    rating_maximum REAL NOT NULL,
    description TEXT,
    narrative_milestone TEXT,

    -- Unlocks
    unlocks_content TEXT, -- JSON
    attribute_points_granted INTEGER DEFAULT 0,
    skill_points_granted INTEGER DEFAULT 0,
    ability_points_granted INTEGER DEFAULT 0,

    -- Requirements
    missions_required INTEGER DEFAULT 0,
    special_requirements TEXT, -- JSON

    -- Rewards
    tier_reward_credits INTEGER DEFAULT 0,
    tier_reward_items TEXT, -- JSON

    -- Meta
    color_hex TEXT,
    badge_asset TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTERS (Main Player Data)
-- ============================================

CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    -- Identity
    legal_name TEXT NOT NULL,
    street_name TEXT,
    handle TEXT UNIQUE,

    -- Physical
    sex TEXT REFERENCES enum_sex_type(value),
    age INTEGER,
    height_cm INTEGER,
    weight_kg REAL,
    blood_type TEXT REFERENCES enum_blood_type(value),

    -- Visual
    appearance_data TEXT, -- JSON for character creation
    portrait_asset TEXT,

    -- Corporate Status
    omnideliver_id TEXT UNIQUE,
    corporate_standing TEXT DEFAULT 'NEUTRAL' REFERENCES enum_corporate_standing(value),
    employee_since TEXT,

    -- Progression
    current_tier INTEGER DEFAULT 1,
    current_xp INTEGER DEFAULT 0,
    xp_to_next_tier INTEGER,
    lifetime_xp INTEGER DEFAULT 0,

    -- Track/Spec
    track_id TEXT REFERENCES tracks(id),
    specialization_id TEXT REFERENCES specializations(id),
    convergence_path TEXT DEFAULT 'UNDECIDED' REFERENCES enum_convergence_path(value),

    -- Rating
    carrier_rating REAL DEFAULT 3.0,
    rating_visible REAL DEFAULT 3.0,
    rating_hidden_modifier REAL DEFAULT 0.0,
    total_deliveries INTEGER DEFAULT 0,
    perfect_deliveries INTEGER DEFAULT 0,
    failed_deliveries INTEGER DEFAULT 0,

    -- Resources
    current_health INTEGER DEFAULT 100,
    max_health INTEGER DEFAULT 100,
    current_stamina INTEGER DEFAULT 100,
    max_stamina INTEGER DEFAULT 100,
    current_humanity INTEGER DEFAULT 100,
    max_humanity INTEGER DEFAULT 100,

    -- Consciousness
    consciousness_state TEXT DEFAULT 'NORMAL' REFERENCES enum_consciousness_state(value),
    network_integration_level INTEGER DEFAULT 0,
    fork_count INTEGER DEFAULT 0,

    -- Location
    current_location_id TEXT,
    home_location_id TEXT,

    -- Status
    is_active INTEGER DEFAULT 1, -- BOOLEAN
    is_dead INTEGER DEFAULT 0, -- BOOLEAN
    death_timestamp TEXT,
    death_cause TEXT,

    -- Meta
    total_playtime_seconds INTEGER DEFAULT 0,
    last_played TEXT
);

-- ============================================
-- CHARACTER ATTRIBUTES (Per-Character Stats)
-- ============================================

CREATE TABLE IF NOT EXISTS character_attributes (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    attribute_id TEXT NOT NULL REFERENCES attribute_definitions(id),

    -- Values
    base_value INTEGER DEFAULT 5,
    current_value INTEGER DEFAULT 5,
    bonus_from_augments INTEGER DEFAULT 0,
    bonus_from_items INTEGER DEFAULT 0,
    bonus_from_conditions INTEGER DEFAULT 0,
    temporary_modifier INTEGER DEFAULT 0,

    -- Tracking
    times_increased INTEGER DEFAULT 0,
    xp_invested INTEGER DEFAULT 0,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    UNIQUE(character_id, attribute_id)
);

-- ============================================
-- RATING COMPONENTS
-- ============================================

CREATE TABLE IF NOT EXISTS rating_components (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

    -- Speed
    avg_delivery_time_vs_estimate REAL DEFAULT 1.0,
    express_deliveries_completed INTEGER DEFAULT 0,
    late_deliveries INTEGER DEFAULT 0,

    -- Care
    packages_damaged INTEGER DEFAULT 0,
    packages_lost INTEGER DEFAULT 0,
    fragile_success_rate REAL DEFAULT 1.0,

    -- Reliability
    missions_accepted INTEGER DEFAULT 0,
    missions_completed INTEGER DEFAULT 0,
    missions_abandoned INTEGER DEFAULT 0,
    consecutive_completions INTEGER DEFAULT 0,

    -- Customer
    five_star_ratings INTEGER DEFAULT 0,
    one_star_ratings INTEGER DEFAULT 0,
    complaints_received INTEGER DEFAULT 0,
    compliments_received INTEGER DEFAULT 0,

    -- Hidden (Algorithm tracking)
    corporate_compliance_score REAL DEFAULT 1.0,
    route_obedience REAL DEFAULT 1.0,
    surveillance_cooperation REAL DEFAULT 1.0,
    unauthorized_stops INTEGER DEFAULT 0,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER BACKSTORY
-- ============================================

CREATE TABLE IF NOT EXISTS character_backstory (
    id TEXT PRIMARY KEY,
    character_id TEXT UNIQUE NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

    -- Origin
    origin_type TEXT REFERENCES enum_origin_type(value),
    origin_location_id TEXT,
    origin_narrative TEXT,

    -- Family
    family_status TEXT,
    family_description TEXT,
    family_debt_amount INTEGER DEFAULT 0,

    -- Education
    education_level TEXT,
    education_institution TEXT,
    education_specialty TEXT,

    -- Pre-Courier
    previous_occupation TEXT,
    previous_employer TEXT,
    years_as_courier INTEGER DEFAULT 0,

    -- Motivation
    primary_motivation TEXT,
    secondary_motivation TEXT,
    long_term_goal TEXT,

    -- Secrets
    hidden_past TEXT,
    dark_secret TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER MEMORIES
-- ============================================

CREATE TABLE IF NOT EXISTS character_memories (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

    -- Memory
    memory_type TEXT,
    title TEXT,
    description TEXT,
    emotional_weight INTEGER, -- -100 to 100

    -- Source
    is_real INTEGER DEFAULT 1, -- BOOLEAN
    is_implanted INTEGER DEFAULT 0, -- BOOLEAN
    source_npc_id TEXT,
    source_mission_id TEXT,

    -- State
    is_locked INTEGER DEFAULT 0, -- BOOLEAN
    is_corrupted INTEGER DEFAULT 0, -- BOOLEAN
    is_sold INTEGER DEFAULT 0, -- BOOLEAN

    -- Value
    memory_value_creds INTEGER DEFAULT 0,

    -- Triggers
    trigger_conditions TEXT, -- JSON
    narrative_unlocks TEXT, -- JSON

    occurred_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_characters_player ON characters(player_id);
CREATE INDEX IF NOT EXISTS idx_characters_handle ON characters(handle);
CREATE INDEX IF NOT EXISTS idx_characters_rating ON characters(carrier_rating);
CREATE INDEX IF NOT EXISTS idx_characters_tier ON characters(current_tier);
CREATE INDEX IF NOT EXISTS idx_character_attributes_char ON character_attributes(character_id);
CREATE INDEX IF NOT EXISTS idx_specializations_track ON specializations(track_id);
CREATE INDEX IF NOT EXISTS idx_character_memories_char ON character_memories(character_id);
