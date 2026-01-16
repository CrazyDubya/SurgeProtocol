-- SURGE PROTOCOL: Database Schema Migration
-- Part 3: Augmentation System
-- Tables: body_locations, augments, humanity

-- ============================================
-- BODY LOCATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS body_locations (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    parent_location_id TEXT REFERENCES body_locations(id),

    -- Slots
    augment_slots INTEGER DEFAULT 1,
    critical_organ INTEGER DEFAULT 0, -- BOOLEAN
    visible_externally INTEGER DEFAULT 1, -- BOOLEAN
    symmetrical INTEGER DEFAULT 0, -- BOOLEAN

    -- Gameplay
    damage_multiplier REAL DEFAULT 1.0,
    natural_armor INTEGER DEFAULT 0,
    nerve_density INTEGER DEFAULT 50,

    -- Requirements
    min_tier_to_augment INTEGER DEFAULT 1,
    requires_surgery INTEGER DEFAULT 1, -- BOOLEAN
    surgery_risk_base INTEGER DEFAULT 10,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- AUGMENT MANUFACTURERS
-- ============================================

CREATE TABLE IF NOT EXISTS augment_manufacturers (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    headquarters_location_id TEXT,

    -- Reputation
    quality_rating INTEGER DEFAULT 50,
    reliability_rating INTEGER DEFAULT 50,
    innovation_rating INTEGER DEFAULT 50,
    ethics_rating INTEGER DEFAULT 50,
    price_tier INTEGER DEFAULT 3,

    -- Specialization
    primary_category TEXT REFERENCES enum_augment_category(value),
    secondary_categories TEXT, -- JSON
    signature_tech TEXT,

    -- Business
    is_corporate_approved INTEGER DEFAULT 1, -- BOOLEAN
    black_market_presence INTEGER DEFAULT 0,
    faction_alignment_id TEXT,

    -- Bonuses
    brand_bonus_effect TEXT, -- JSON
    warranty_terms TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- AUGMENT DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS augment_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    manufacturer TEXT,
    model TEXT,
    description TEXT,
    lore_description TEXT,
    flavor_text TEXT,

    -- Classification
    category TEXT REFERENCES enum_augment_category(value),
    subcategory TEXT,
    rarity TEXT DEFAULT 'COMMON' REFERENCES enum_rarity(value),
    quality_tier INTEGER DEFAULT 1,
    is_prototype INTEGER DEFAULT 0, -- BOOLEAN
    is_black_market INTEGER DEFAULT 0, -- BOOLEAN
    is_corrupted INTEGER DEFAULT 0, -- BOOLEAN

    -- Requirements
    required_tier INTEGER DEFAULT 1,
    required_track_id TEXT REFERENCES tracks(id),
    required_specialization_id TEXT REFERENCES specializations(id),
    required_augments TEXT, -- JSON
    incompatible_augments TEXT, -- JSON
    required_attributes TEXT, -- JSON

    -- Installation
    body_location_id TEXT REFERENCES body_locations(id),
    slots_consumed INTEGER DEFAULT 1,
    surgery_required INTEGER DEFAULT 1, -- BOOLEAN
    surgery_difficulty INTEGER DEFAULT 5,
    installation_time_hours REAL DEFAULT 2.0,
    recovery_time_days INTEGER DEFAULT 1,
    rejection_chance_base REAL DEFAULT 0.01,

    -- Costs
    base_price_creds INTEGER DEFAULT 1000,
    installation_cost_creds INTEGER DEFAULT 500,
    maintenance_cost_monthly INTEGER DEFAULT 100,
    power_consumption INTEGER DEFAULT 10,
    humanity_cost INTEGER DEFAULT 5,

    -- Effects
    attribute_modifiers TEXT, -- JSON
    stat_modifiers TEXT, -- JSON
    grants_abilities TEXT, -- JSON
    grants_passives TEXT, -- JSON
    special_effects TEXT, -- JSON

    -- Drawbacks
    side_effects TEXT, -- JSON
    maintenance_requirements TEXT, -- JSON
    malfunction_chance REAL DEFAULT 0.001,
    detection_signature INTEGER DEFAULT 20,

    -- Upgrade Path
    upgrade_from_id TEXT REFERENCES augment_definitions(id),
    upgrade_to TEXT, -- JSON
    upgrade_cost_multiplier REAL DEFAULT 1.5,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER AUGMENTS (Installed)
-- ============================================

CREATE TABLE IF NOT EXISTS character_augments (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    augment_definition_id TEXT NOT NULL REFERENCES augment_definitions(id),
    installed_at TEXT DEFAULT (datetime('now')),

    -- Installation
    body_location_id TEXT REFERENCES body_locations(id),
    installed_by_npc_id TEXT,
    installation_quality INTEGER DEFAULT 80,
    is_corporate_installed INTEGER DEFAULT 0, -- BOOLEAN
    has_corporate_backdoor INTEGER DEFAULT 0, -- BOOLEAN

    -- State
    is_active INTEGER DEFAULT 1, -- BOOLEAN
    is_damaged INTEGER DEFAULT 0, -- BOOLEAN
    damage_level INTEGER DEFAULT 0,
    is_malfunctioning INTEGER DEFAULT 0, -- BOOLEAN
    malfunction_type TEXT,
    charge_level INTEGER DEFAULT 100,

    -- Integration
    integration_level INTEGER DEFAULT 50,
    rejection_risk_current REAL DEFAULT 0.01,
    last_maintenance TEXT,
    maintenance_overdue INTEGER DEFAULT 0, -- BOOLEAN

    -- Customization
    custom_name TEXT,
    cosmetic_modifications TEXT, -- JSON
    software_version TEXT,
    firmware_modified INTEGER DEFAULT 0, -- BOOLEAN

    -- Tracking
    times_activated INTEGER DEFAULT 0,
    total_active_hours REAL DEFAULT 0,
    critical_activations INTEGER DEFAULT 0,
    malfunction_count INTEGER DEFAULT 0,

    -- Corporate
    corporate_tracked INTEGER DEFAULT 0, -- BOOLEAN
    warranty_expires TEXT,
    debt_attached_id TEXT,
    can_be_repossessed INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- AUGMENT SETS (Synergy Bonuses)
-- ============================================

CREATE TABLE IF NOT EXISTS augment_sets (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    manufacturer TEXT,

    -- Composition
    required_augments TEXT, -- JSON
    optional_augments TEXT, -- JSON
    min_augments_for_bonus INTEGER DEFAULT 2,

    -- Bonuses
    partial_bonus_effects TEXT, -- JSON
    full_set_bonus_effects TEXT, -- JSON
    grants_ability_id TEXT,
    grants_passive_id TEXT,

    -- Requirements
    required_tier INTEGER DEFAULT 1,
    required_track_id TEXT REFERENCES tracks(id),
    required_specialization_id TEXT REFERENCES specializations(id),

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- HUMANITY THRESHOLDS
-- ============================================

CREATE TABLE IF NOT EXISTS humanity_thresholds (
    id TEXT PRIMARY KEY,
    threshold_value INTEGER UNIQUE NOT NULL,
    threshold_name TEXT NOT NULL,
    description TEXT,

    -- Effects
    condition_id TEXT,
    behavioral_changes TEXT,
    dialogue_changes TEXT, -- JSON
    ability_unlocks TEXT, -- JSON
    ability_locks TEXT, -- JSON

    -- Recovery
    can_recover INTEGER DEFAULT 1, -- BOOLEAN
    recovery_methods TEXT, -- JSON
    permanent_effects TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- HUMANITY EVENTS
-- ============================================

CREATE TABLE IF NOT EXISTS humanity_events (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    occurred_at TEXT DEFAULT (datetime('now')),

    -- Change
    humanity_before INTEGER,
    humanity_after INTEGER,
    change_amount INTEGER,
    change_source TEXT,
    source_id TEXT,

    -- Threshold
    crossed_threshold INTEGER,
    triggered_condition_id TEXT,
    episode_severity INTEGER,

    -- Recovery
    therapy_applied INTEGER DEFAULT 0, -- BOOLEAN
    anchor_used INTEGER DEFAULT 0, -- BOOLEAN
    narrative_event_id TEXT
);

-- ============================================
-- BLACK MARKET PAYMENT TYPES
-- ============================================

CREATE TABLE IF NOT EXISTS black_market_payment_types (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Mechanics
    is_currency INTEGER DEFAULT 0, -- BOOLEAN
    is_service INTEGER DEFAULT 0, -- BOOLEAN
    is_permanent_loss INTEGER DEFAULT 0, -- BOOLEAN
    humanity_impact INTEGER DEFAULT 0,

    -- Conversion
    cred_equivalent_base INTEGER DEFAULT 0,
    conversion_variable INTEGER DEFAULT 0, -- BOOLEAN
    market_demand_modifier REAL DEFAULT 1.0,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_augment_defs_category ON augment_definitions(category);
CREATE INDEX IF NOT EXISTS idx_augment_defs_rarity ON augment_definitions(rarity);
CREATE INDEX IF NOT EXISTS idx_augment_defs_tier ON augment_definitions(required_tier);
CREATE INDEX IF NOT EXISTS idx_char_augments_char ON character_augments(character_id);
CREATE INDEX IF NOT EXISTS idx_char_augments_def ON character_augments(augment_definition_id);
CREATE INDEX IF NOT EXISTS idx_humanity_events_char ON humanity_events(character_id);
CREATE INDEX IF NOT EXISTS idx_body_locations_parent ON body_locations(parent_location_id);
