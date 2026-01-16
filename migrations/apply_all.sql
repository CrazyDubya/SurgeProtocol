-- SURGE PROTOCOL: Database Schema Migration
-- Part 1: Setup and Enum Tables
-- Generated from schema documentation

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================
-- ENUM REFERENCE TABLES
-- SQLite doesn't support ENUMs natively, so we use reference tables
-- ============================================

-- Character Enums
CREATE TABLE IF NOT EXISTS enum_sex_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_sex_type (value) VALUES
    ('MALE'), ('FEMALE'), ('INTERSEX'), ('NONE');

CREATE TABLE IF NOT EXISTS enum_blood_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_blood_type (value) VALUES
    ('O_POS'), ('O_NEG'), ('A_POS'), ('A_NEG'), ('B_POS'), ('B_NEG'),
    ('AB_POS'), ('AB_NEG'), ('SYNTHETIC'), ('UNKNOWN');

CREATE TABLE IF NOT EXISTS enum_consciousness_state (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_consciousness_state (value) VALUES
    ('NORMAL'), ('FRAGMENTED'), ('NETWORKED'), ('ASCENDED'), ('ROGUE'), ('DORMANT'), ('DEAD');

CREATE TABLE IF NOT EXISTS enum_corporate_standing (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_corporate_standing (value) VALUES
    ('EXEMPLARY'), ('GOOD'), ('NEUTRAL'), ('PROBATION'), ('SUSPENDED'), ('TERMINATED'), ('ROGUE');

CREATE TABLE IF NOT EXISTS enum_origin_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_origin_type (value) VALUES
    ('STREET_KID'), ('CORPO_DROPOUT'), ('IMMIGRANT'), ('MILITARY_VET'), ('ACADEMIC'),
    ('CRIMINAL'), ('INHERITED_DEBT'), ('REFUGEE'), ('IDEALIST');

CREATE TABLE IF NOT EXISTS enum_convergence_path (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_convergence_path (value) VALUES
    ('ASCENSION'), ('ROGUE'), ('UNDECIDED'), ('REFUSED');

-- Attribute & Skill Enums
CREATE TABLE IF NOT EXISTS enum_attribute_category (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_attribute_category (value) VALUES
    ('PHYSICAL'), ('MENTAL'), ('SOCIAL'), ('TECHNICAL'), ('METAPHYSICAL'), ('DERIVED');

CREATE TABLE IF NOT EXISTS enum_skill_category (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_skill_category (value) VALUES
    ('COMBAT'), ('MOVEMENT'), ('TECHNICAL'), ('SOCIAL'), ('KNOWLEDGE'),
    ('SURVIVAL'), ('VEHICLE'), ('HACKING'), ('MEDICAL'), ('CRAFT'), ('PERFORMANCE');

-- Item & Equipment Enums
CREATE TABLE IF NOT EXISTS enum_rarity (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_rarity (value) VALUES
    ('COMMON'), ('UNCOMMON'), ('RARE'), ('EPIC'), ('LEGENDARY'), ('UNIQUE'), ('PROTOTYPE'), ('CORRUPTED');

CREATE TABLE IF NOT EXISTS enum_item_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_item_type (value) VALUES
    ('WEAPON'), ('ARMOR'), ('CLOTHING'), ('TOOL'), ('CONSUMABLE'), ('COMPONENT'),
    ('DATA'), ('KEY_ITEM'), ('JUNK'), ('CONTAINER'), ('CURRENCY'), ('VEHICLE_PART'),
    ('SOFTWARE'), ('CONTRABAND');

CREATE TABLE IF NOT EXISTS enum_equipment_slot (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_equipment_slot (value) VALUES
    ('HEAD'), ('FACE'), ('EYES'), ('EARS'), ('NECK'), ('TORSO'), ('BACK'),
    ('ARMS'), ('HANDS'), ('WAIST'), ('LEGS'), ('FEET'), ('WEAPON_PRIMARY'),
    ('WEAPON_SECONDARY'), ('WEAPON_MELEE'), ('TOOL_1'), ('TOOL_2');

CREATE TABLE IF NOT EXISTS enum_weapon_class (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_weapon_class (value) VALUES
    ('PISTOL'), ('SMG'), ('ASSAULT_RIFLE'), ('SHOTGUN'), ('SNIPER'), ('LMG'),
    ('MELEE_BLADE'), ('MELEE_BLUNT'), ('THROWN'), ('BOW'), ('LAUNCHER'), ('ENERGY'), ('EXOTIC');

CREATE TABLE IF NOT EXISTS enum_damage_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_damage_type (value) VALUES
    ('KINETIC'), ('ENERGY'), ('THERMAL'), ('ELECTRICAL'), ('CHEMICAL'),
    ('EMP'), ('SONIC'), ('RADIATION'), ('NEURAL'), ('BLEED'), ('TRUE');

-- Mission Enums
CREATE TABLE IF NOT EXISTS enum_mission_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_mission_type (value) VALUES
    ('DELIVERY_STANDARD'), ('DELIVERY_EXPRESS'), ('DELIVERY_FRAGILE'), ('DELIVERY_HAZMAT'),
    ('DELIVERY_COVERT'), ('DELIVERY_CONTESTED'), ('ESCORT_PERSON'), ('ESCORT_VEHICLE'),
    ('EXTRACTION'), ('INSERTION'), ('DATA_TRANSFER'), ('DEAD_DROP'), ('INTERCEPTION'),
    ('SURVEILLANCE'), ('STORY_MISSION');

CREATE TABLE IF NOT EXISTS enum_mission_status (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_mission_status (value) VALUES
    ('AVAILABLE'), ('ACCEPTED'), ('IN_PROGRESS'), ('CARGO_ACQUIRED'), ('EN_ROUTE'),
    ('AT_DESTINATION'), ('COMPLETED_SUCCESS'), ('COMPLETED_PARTIAL'), ('FAILED'),
    ('ABANDONED'), ('EXPIRED');

CREATE TABLE IF NOT EXISTS enum_cargo_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_cargo_type (value) VALUES
    ('PACKAGE_SMALL'), ('PACKAGE_MEDIUM'), ('PACKAGE_LARGE'), ('DOCUMENT'),
    ('DATA_PHYSICAL'), ('DATA_DIGITAL'), ('FOOD_HOT'), ('FOOD_COLD'),
    ('MEDICAL_SUPPLIES'), ('MEDICAL_URGENT'), ('BIOLOGICALS'), ('ORGAN_TRANSPORT'),
    ('WEAPONS'), ('CONTRABAND'), ('PERSON_VIP'), ('PERSON_COVERT'), ('UNKNOWN_SEALED');

-- World Enums
CREATE TABLE IF NOT EXISTS enum_region_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_region_type (value) VALUES
    ('METROPOLITAN'), ('URBAN'), ('SUBURBAN'), ('INDUSTRIAL'), ('COMMERCIAL'),
    ('RESIDENTIAL'), ('SLUM'), ('CORPORATE_ZONE'), ('GOVERNMENT'), ('MILITARY'),
    ('UNDERGROUND'), ('OFFSHORE');

CREATE TABLE IF NOT EXISTS enum_location_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_location_type (value) VALUES
    ('DISTRICT'), ('STREET'), ('BUILDING_RESIDENTIAL'), ('BUILDING_COMMERCIAL'),
    ('BUILDING_CORPORATE'), ('WAREHOUSE'), ('RESTAURANT'), ('BAR'), ('CLUB'),
    ('SHOP_GENERAL'), ('SHOP_WEAPONS'), ('SHOP_AUGMENTS'), ('CLINIC'), ('SAFE_HOUSE'),
    ('GARAGE'), ('TRANSIT_STATION'), ('ROOFTOP'), ('TUNNEL'), ('BLACK_MARKET'),
    ('INTERSTITIAL_NODE');

CREATE TABLE IF NOT EXISTS enum_access_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_access_type (value) VALUES
    ('PUBLIC'), ('SEMI_PUBLIC'), ('PRIVATE_RESIDENTIAL'), ('PRIVATE_COMMERCIAL'),
    ('CORPORATE_RESTRICTED'), ('GOVERNMENT_RESTRICTED'), ('FACTION_ONLY'),
    ('VIP_ONLY'), ('CRIMINAL_CONTROLLED'), ('INTERSTITIAL');

-- NPC & Faction Enums
CREATE TABLE IF NOT EXISTS enum_npc_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_npc_type (value) VALUES
    ('UNIQUE_STORY'), ('UNIQUE_SIDE'), ('RECURRING'), ('GENERIC_NAMED'),
    ('GENERIC_UNNAMED'), ('PROCEDURAL'), ('FACTION_LEADER'), ('VENDOR'),
    ('TRAINER'), ('QUEST_GIVER'), ('CONTACT'), ('ENEMY'), ('CIVILIAN');

CREATE TABLE IF NOT EXISTS enum_faction_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_faction_type (value) VALUES
    ('MEGACORP'), ('CORPORATION'), ('GOVERNMENT'), ('LAW_ENFORCEMENT'), ('MILITARY'),
    ('GANG'), ('SYNDICATE'), ('CULT'), ('MOVEMENT'), ('COLLECTIVE'), ('GUILD'), ('MERCENARY_GROUP');

CREATE TABLE IF NOT EXISTS enum_reputation_tier (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_reputation_tier (value) VALUES
    ('EXALTED'), ('REVERED'), ('HONORED'), ('FRIENDLY'), ('NEUTRAL'),
    ('UNFRIENDLY'), ('HOSTILE'), ('HATED'), ('NEMESIS');

-- Combat Enums
CREATE TABLE IF NOT EXISTS enum_condition_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_condition_type (value) VALUES
    ('BUFF'), ('DEBUFF'), ('DOT'), ('HOT'), ('CROWD_CONTROL'), ('MOVEMENT_IMPAIR'),
    ('MENTAL'), ('PHYSICAL'), ('ENVIRONMENTAL'), ('MEDICAL'), ('ADDICTION'),
    ('CYBERPSYCHOSIS'), ('HACKING');

CREATE TABLE IF NOT EXISTS enum_combat_status (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_combat_status (value) VALUES
    ('INITIALIZING'), ('PLAYER_TURN'), ('ENEMY_TURN'), ('PROCESSING'),
    ('PAUSED'), ('VICTORY'), ('DEFEAT'), ('RETREAT'), ('INTERRUPTED');

-- Quest & Narrative Enums
CREATE TABLE IF NOT EXISTS enum_quest_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_quest_type (value) VALUES
    ('MAIN_STORY'), ('MAJOR_SIDE'), ('MINOR_SIDE'), ('FACTION'), ('DAILY'),
    ('WEEKLY'), ('BOUNTY'), ('EXPLORATION'), ('COLLECTION'), ('TUTORIAL'), ('SECRET');

CREATE TABLE IF NOT EXISTS enum_quest_status (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_quest_status (value) VALUES
    ('AVAILABLE'), ('ACCEPTED'), ('IN_PROGRESS'), ('READY_TO_TURN_IN'),
    ('COMPLETED'), ('FAILED'), ('ABANDONED'), ('EXPIRED');

CREATE TABLE IF NOT EXISTS enum_dialogue_tone (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_dialogue_tone (value) VALUES
    ('NEUTRAL'), ('FRIENDLY'), ('PROFESSIONAL'), ('AGGRESSIVE'), ('THREATENING'),
    ('SYMPATHETIC'), ('SARCASTIC'), ('FLIRTATIOUS'), ('CONFIDENT'), ('HUMOROUS');

-- Economy Enums
CREATE TABLE IF NOT EXISTS enum_currency_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_currency_type (value) VALUES
    ('STANDARD'), ('CORPORATE'), ('FACTION'), ('CRYPTO'), ('PHYSICAL'), ('REWARD'), ('SPECIAL');

CREATE TABLE IF NOT EXISTS enum_transaction_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_transaction_type (value) VALUES
    ('DELIVERY_PAYMENT'), ('MISSION_REWARD'), ('PURCHASE'), ('SALE'), ('REPAIR'),
    ('MEDICAL'), ('INSURANCE_PREMIUM'), ('TAX_PAYMENT'), ('FINE'), ('BRIBE'),
    ('DEBT_PAYMENT'), ('THEFT_LOSS'), ('GAMBLING_WIN'), ('BLACK_MARKET');

CREATE TABLE IF NOT EXISTS enum_contract_status (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_contract_status (value) VALUES
    ('OFFERED'), ('UNDER_REVIEW'), ('ACTIVE'), ('PROBATION'), ('SUSPENDED'),
    ('BREACHED'), ('TERMINATED'), ('COMPLETED'), ('EXPIRED');

CREATE TABLE IF NOT EXISTS enum_debt_status (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_debt_status (value) VALUES
    ('CURRENT'), ('LATE'), ('DELINQUENT'), ('DEFAULT'), ('IN_COLLECTION'),
    ('RESTRUCTURED'), ('FORGIVEN'), ('PAID_OFF');

-- Meta/System Enums
CREATE TABLE IF NOT EXISTS enum_difficulty_level (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_difficulty_level (value) VALUES
    ('STORY'), ('EASY'), ('NORMAL'), ('HARD'), ('NIGHTMARE'), ('IRONMAN'), ('CUSTOM');

CREATE TABLE IF NOT EXISTS enum_save_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_save_type (value) VALUES
    ('MANUAL'), ('AUTO'), ('QUICK'), ('CHECKPOINT'), ('IRONMAN'), ('BACKUP'), ('CLOUD');

CREATE TABLE IF NOT EXISTS enum_privacy_level (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_privacy_level (value) VALUES
    ('PUBLIC'), ('FRIENDS_ONLY'), ('PRIVATE'), ('INVISIBLE');

-- Augmentation Enums
CREATE TABLE IF NOT EXISTS enum_augment_category (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_augment_category (value) VALUES
    ('NEURAL'), ('SENSORY'), ('SKELETAL'), ('MUSCULAR'), ('DERMAL'), ('ORGAN'),
    ('LIMB'), ('CIRCULATORY'), ('ENDOCRINE'), ('INTERFACE'), ('COSMETIC'), ('EXPERIMENTAL');

-- Vehicle Enums
CREATE TABLE IF NOT EXISTS enum_vehicle_class (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_vehicle_class (value) VALUES
    ('BIKE'), ('CAR'), ('TRUCK'), ('VAN'), ('SUV'), ('MOTORCYCLE'), ('SCOOTER'),
    ('QUADCOPTER'), ('VTOL'), ('BOAT'), ('MECH_LIGHT'), ('MECH_HEAVY'), ('EXOTIC');

CREATE TABLE IF NOT EXISTS enum_drone_state (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_drone_state (value) VALUES
    ('STORED'), ('DEPLOYED'), ('HOVERING'), ('MOVING'), ('ATTACKING'), ('DEFENDING'),
    ('RETURNING'), ('CHARGING'), ('DAMAGED'), ('DESTROYED'), ('LOST'), ('HIJACKED');
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
-- SURGE PROTOCOL: Database Schema Migration
-- Part 4: Skills, Abilities & Equipment
-- Tables: skills, abilities, items, weapons, armor, vehicles, drones

-- ============================================
-- SKILL DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS skill_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    governing_attribute_id TEXT REFERENCES attribute_definitions(id),
    category TEXT REFERENCES enum_skill_category(value),

    -- Progression
    max_level INTEGER DEFAULT 10,
    xp_per_level TEXT, -- JSON
    training_available INTEGER DEFAULT 1, -- BOOLEAN
    requires_teacher INTEGER DEFAULT 0, -- BOOLEAN

    -- Requirements
    prerequisite_skills TEXT, -- JSON
    required_tier INTEGER DEFAULT 1,
    required_track_id TEXT REFERENCES tracks(id),

    -- Mechanics
    check_difficulty_base INTEGER DEFAULT 10,
    critical_success_threshold INTEGER DEFAULT 20,
    critical_failure_threshold INTEGER DEFAULT 1,
    can_assist INTEGER DEFAULT 1, -- BOOLEAN
    can_retry INTEGER DEFAULT 1, -- BOOLEAN
    retry_penalty INTEGER DEFAULT 2,

    -- Specializations
    has_specializations INTEGER DEFAULT 0, -- BOOLEAN
    specialization_definitions TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER SKILLS
-- ============================================

CREATE TABLE IF NOT EXISTS character_skills (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL REFERENCES skill_definitions(id),

    -- Level
    current_level INTEGER DEFAULT 0,
    current_xp INTEGER DEFAULT 0,
    xp_to_next_level INTEGER,

    -- Modifiers
    bonus_from_augments INTEGER DEFAULT 0,
    bonus_from_items INTEGER DEFAULT 0,
    temporary_bonus INTEGER DEFAULT 0,
    temporary_penalty INTEGER DEFAULT 0,

    -- Tracking
    times_used INTEGER DEFAULT 0,
    successes INTEGER DEFAULT 0,
    failures INTEGER DEFAULT 0,
    critical_successes INTEGER DEFAULT 0,
    critical_failures INTEGER DEFAULT 0,
    last_used TEXT,

    -- Specializations
    specializations_unlocked TEXT, -- JSON
    specialization_levels TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    UNIQUE(character_id, skill_id)
);

-- ============================================
-- ABILITY DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS ability_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    detailed_description TEXT,
    flavor_text TEXT,

    -- Classification
    ability_type TEXT,
    category TEXT,
    is_signature INTEGER DEFAULT 0, -- BOOLEAN
    is_ultimate INTEGER DEFAULT 0, -- BOOLEAN

    -- Source
    source_type TEXT,
    source_track_id TEXT REFERENCES tracks(id),
    source_specialization_id TEXT REFERENCES specializations(id),
    source_augment_id TEXT REFERENCES augment_definitions(id),
    source_item_id TEXT,

    -- Requirements
    required_tier INTEGER DEFAULT 1,
    required_level INTEGER DEFAULT 1,
    prerequisite_abilities TEXT, -- JSON
    required_attributes TEXT, -- JSON
    required_skills TEXT, -- JSON

    -- Costs
    resource_cost TEXT, -- JSON
    cooldown_seconds INTEGER DEFAULT 0,
    charges INTEGER,
    charge_recovery TEXT,
    humanity_cost INTEGER DEFAULT 0,

    -- Activation
    activation_type TEXT,
    activation_time TEXT,
    range_desc TEXT,
    area_of_effect TEXT, -- JSON
    duration TEXT,
    concentration_required INTEGER DEFAULT 0, -- BOOLEAN

    -- Effects
    primary_effect TEXT, -- JSON
    secondary_effects TEXT, -- JSON
    scaling TEXT, -- JSON
    synergies TEXT, -- JSON

    -- Upgrades
    has_ranks INTEGER DEFAULT 0, -- BOOLEAN
    max_rank INTEGER DEFAULT 1,
    rank_effects TEXT, -- JSON
    upgrade_cost TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER ABILITIES
-- ============================================

CREATE TABLE IF NOT EXISTS character_abilities (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    ability_id TEXT NOT NULL REFERENCES ability_definitions(id),
    acquired_at TEXT DEFAULT (datetime('now')),

    -- State
    is_unlocked INTEGER DEFAULT 1, -- BOOLEAN
    is_equipped INTEGER DEFAULT 0, -- BOOLEAN
    current_rank INTEGER DEFAULT 1,
    current_charges INTEGER,
    cooldown_remaining REAL DEFAULT 0,
    is_on_cooldown INTEGER DEFAULT 0, -- BOOLEAN

    -- Modifications
    custom_name TEXT,
    modifier_augments TEXT, -- JSON
    modifier_items TEXT, -- JSON
    effectiveness_multiplier REAL DEFAULT 1.0,

    -- Tracking
    times_used INTEGER DEFAULT 0,
    successful_uses INTEGER DEFAULT 0,
    damage_dealt_total INTEGER DEFAULT 0,
    targets_affected_total INTEGER DEFAULT 0,
    last_used TEXT,

    -- XP
    xp_invested INTEGER DEFAULT 0,
    xp_to_next_rank INTEGER,

    UNIQUE(character_id, ability_id)
);

-- ============================================
-- PASSIVE DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS passive_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Source
    source_type TEXT,
    source_id TEXT,

    -- Requirements
    required_tier INTEGER DEFAULT 1,
    prerequisite_passives TEXT, -- JSON
    required_condition TEXT,

    -- Effects
    effect_type TEXT,
    effect_target TEXT,
    effect_value REAL,
    effect_is_percentage INTEGER DEFAULT 0, -- BOOLEAN
    stacks INTEGER DEFAULT 0, -- BOOLEAN
    max_stacks INTEGER DEFAULT 1,

    -- Triggering
    trigger_condition TEXT,
    trigger_chance REAL DEFAULT 1.0,
    internal_cooldown INTEGER DEFAULT 0,

    -- Meta
    is_hidden INTEGER DEFAULT 0, -- BOOLEAN
    conflicts_with TEXT, -- JSON
    synergizes_with TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- ITEM DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS item_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    flavor_text TEXT,
    manufacturer TEXT,

    -- Classification
    item_type TEXT REFERENCES enum_item_type(value),
    item_subtype TEXT,
    rarity TEXT DEFAULT 'COMMON' REFERENCES enum_rarity(value),
    quality_tier INTEGER DEFAULT 1,
    is_unique INTEGER DEFAULT 0, -- BOOLEAN
    is_quest_item INTEGER DEFAULT 0, -- BOOLEAN
    is_illegal INTEGER DEFAULT 0, -- BOOLEAN
    illegality_level INTEGER DEFAULT 0,

    -- Physical
    weight_kg REAL DEFAULT 0.1,
    size_category TEXT,
    dimensions_cm TEXT, -- JSON
    is_foldable INTEGER DEFAULT 0, -- BOOLEAN
    folded_dimensions_cm TEXT, -- JSON

    -- Requirements
    required_tier INTEGER DEFAULT 1,
    required_attributes TEXT, -- JSON
    required_skills TEXT, -- JSON
    required_augments TEXT, -- JSON
    required_license TEXT,

    -- Economy
    base_price INTEGER DEFAULT 100,
    street_price_modifier REAL DEFAULT 1.0,
    black_market_price_modifier REAL DEFAULT 1.5,
    is_fenceable INTEGER DEFAULT 1, -- BOOLEAN
    fence_value_modifier REAL DEFAULT 0.5,

    -- Inventory
    max_stack_size INTEGER DEFAULT 1,
    is_consumable INTEGER DEFAULT 0, -- BOOLEAN
    is_equippable INTEGER DEFAULT 0, -- BOOLEAN
    equipment_slot TEXT REFERENCES enum_equipment_slot(value),
    quick_slot_eligible INTEGER DEFAULT 0, -- BOOLEAN

    -- Durability
    has_durability INTEGER DEFAULT 0, -- BOOLEAN
    max_durability INTEGER DEFAULT 100,
    repair_skill_id TEXT REFERENCES skill_definitions(id),
    repair_difficulty INTEGER DEFAULT 5,
    repair_cost_base INTEGER DEFAULT 50,

    -- Effects
    passive_effects TEXT, -- JSON
    use_effects TEXT, -- JSON
    equip_effects TEXT, -- JSON

    -- Crafting
    is_craftable INTEGER DEFAULT 0, -- BOOLEAN
    recipe_id TEXT,
    is_component INTEGER DEFAULT 0, -- BOOLEAN
    component_categories TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- WEAPON DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS weapon_definitions (
    id TEXT PRIMARY KEY,
    item_id TEXT UNIQUE NOT NULL REFERENCES item_definitions(id),

    -- Classification
    weapon_class TEXT REFERENCES enum_weapon_class(value),
    weapon_type TEXT,
    damage_type TEXT REFERENCES enum_damage_type(value),
    is_melee INTEGER DEFAULT 0, -- BOOLEAN
    is_ranged INTEGER DEFAULT 0, -- BOOLEAN
    is_throwable INTEGER DEFAULT 0, -- BOOLEAN
    is_smart_weapon INTEGER DEFAULT 0, -- BOOLEAN
    is_tech_weapon INTEGER DEFAULT 0, -- BOOLEAN

    -- Damage
    base_damage_dice TEXT,
    base_damage_flat INTEGER DEFAULT 0,
    damage_scaling_attribute_id TEXT REFERENCES attribute_definitions(id),
    damage_scaling_factor REAL DEFAULT 0.5,
    critical_multiplier REAL DEFAULT 2.0,
    critical_threshold INTEGER DEFAULT 20,
    armor_penetration INTEGER DEFAULT 0,

    -- Range
    range_short_m INTEGER,
    range_medium_m INTEGER,
    range_long_m INTEGER,
    range_penalty_medium INTEGER DEFAULT 2,
    range_penalty_long INTEGER DEFAULT 4,

    -- Rate of Fire
    fire_modes TEXT, -- JSON
    rate_of_fire INTEGER DEFAULT 1,
    burst_size INTEGER DEFAULT 3,
    auto_damage_bonus INTEGER DEFAULT 0,

    -- Ammunition
    ammo_type TEXT,
    magazine_size INTEGER DEFAULT 10,
    reload_time_actions INTEGER DEFAULT 1,
    chambered_round INTEGER DEFAULT 0, -- BOOLEAN

    -- Handling
    accuracy_modifier INTEGER DEFAULT 0,
    recoil INTEGER DEFAULT 0,
    handling_speed INTEGER DEFAULT 50,
    required_hands INTEGER DEFAULT 1,
    required_strength INTEGER DEFAULT 1,

    -- Attachments
    attachment_slots TEXT, -- JSON
    integrated_attachments TEXT, -- JSON

    -- Special
    special_properties TEXT, -- JSON
    smart_link_compatible INTEGER DEFAULT 0, -- BOOLEAN
    tech_charge_shots INTEGER DEFAULT 0,
    unique_mechanics TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- ARMOR DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS armor_definitions (
    id TEXT PRIMARY KEY,
    item_id TEXT UNIQUE NOT NULL REFERENCES item_definitions(id),

    -- Protection
    armor_value INTEGER DEFAULT 0,
    damage_reduction_flat INTEGER DEFAULT 0,
    damage_reduction_percent REAL DEFAULT 0,
    damage_type_resistances TEXT, -- JSON
    damage_type_weaknesses TEXT, -- JSON

    -- Coverage
    body_locations_covered TEXT, -- JSON
    coverage_percentage INTEGER DEFAULT 100,
    vital_protection INTEGER DEFAULT 0, -- BOOLEAN

    -- Mobility Impact
    speed_penalty REAL DEFAULT 0,
    agility_penalty INTEGER DEFAULT 0,
    noise_level INTEGER DEFAULT 0,
    swim_penalty REAL DEFAULT 0,

    -- Properties
    is_powered INTEGER DEFAULT 0, -- BOOLEAN
    power_consumption INTEGER DEFAULT 0,
    environmental_protection TEXT, -- JSON
    special_properties TEXT, -- JSON

    -- Style
    armor_style TEXT,
    concealment INTEGER DEFAULT 0,
    intimidation_bonus INTEGER DEFAULT 0,
    fashion_rating INTEGER DEFAULT 0,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER INVENTORY
-- ============================================

CREATE TABLE IF NOT EXISTS character_inventory (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_definition_id TEXT NOT NULL REFERENCES item_definitions(id),
    acquired_at TEXT DEFAULT (datetime('now')),

    -- Location
    storage_location TEXT,
    container_id TEXT REFERENCES character_inventory(id),
    equipped_slot TEXT REFERENCES enum_equipment_slot(value),
    quick_slot INTEGER,

    -- Quantity
    quantity INTEGER DEFAULT 1,
    is_stack INTEGER DEFAULT 0, -- BOOLEAN

    -- State
    current_durability INTEGER,
    current_charges INTEGER,
    current_ammo INTEGER,
    is_damaged INTEGER DEFAULT 0, -- BOOLEAN
    is_broken INTEGER DEFAULT 0, -- BOOLEAN
    is_jammed INTEGER DEFAULT 0, -- BOOLEAN

    -- Customization
    custom_name TEXT,
    custom_description TEXT,
    cosmetic_skin TEXT,
    attachments TEXT, -- JSON
    modifications TEXT, -- JSON

    -- Provenance
    acquired_from TEXT,
    acquired_from_id TEXT,
    original_owner TEXT,
    is_stolen INTEGER DEFAULT 0, -- BOOLEAN
    is_contraband INTEGER DEFAULT 0, -- BOOLEAN

    -- Tracking
    times_used INTEGER DEFAULT 0,
    kills_with INTEGER DEFAULT 0,
    damage_dealt INTEGER DEFAULT 0,

    -- Flags
    is_favorite INTEGER DEFAULT 0, -- BOOLEAN
    is_locked INTEGER DEFAULT 0, -- BOOLEAN
    is_quest_item INTEGER DEFAULT 0, -- BOOLEAN
    sort_order INTEGER DEFAULT 0
);

-- ============================================
-- VEHICLE DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS vehicle_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    manufacturer TEXT,
    model_year INTEGER,
    description TEXT,

    -- Classification
    vehicle_class TEXT REFERENCES enum_vehicle_class(value),
    vehicle_type TEXT,
    size_category TEXT,
    rarity TEXT DEFAULT 'COMMON' REFERENCES enum_rarity(value),

    -- Performance
    top_speed_kmh INTEGER DEFAULT 100,
    acceleration_0_100_seconds REAL DEFAULT 10.0,
    handling_rating INTEGER DEFAULT 50,
    braking_rating INTEGER DEFAULT 50,
    offroad_capability INTEGER DEFAULT 0,

    -- Durability
    max_hull_points INTEGER DEFAULT 100,
    armor_rating INTEGER DEFAULT 0,
    damage_resistances TEXT, -- JSON

    -- Capacity
    passenger_capacity INTEGER DEFAULT 1,
    cargo_capacity_kg REAL DEFAULT 50.0,
    cargo_volume_liters REAL DEFAULT 100.0,
    towing_capacity_kg REAL DEFAULT 0,

    -- Power
    power_source TEXT,
    fuel_capacity REAL DEFAULT 50.0,
    fuel_consumption_per_km REAL DEFAULT 0.1,
    range_km INTEGER DEFAULT 500,
    recharge_time_hours REAL DEFAULT 1.0,

    -- Requirements
    required_tier INTEGER DEFAULT 1,
    required_skill_id TEXT REFERENCES skill_definitions(id),
    required_skill_level INTEGER DEFAULT 1,
    license_required TEXT,

    -- Economy
    base_price INTEGER DEFAULT 10000,
    insurance_cost_monthly INTEGER DEFAULT 100,
    maintenance_cost_monthly INTEGER DEFAULT 50,

    -- Features
    autopilot_level INTEGER DEFAULT 0,
    network_connected INTEGER DEFAULT 1, -- BOOLEAN
    stealth_capable INTEGER DEFAULT 0, -- BOOLEAN
    centaur_compatible INTEGER DEFAULT 0, -- BOOLEAN
    neural_interface_required INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER VEHICLES
-- ============================================

CREATE TABLE IF NOT EXISTS character_vehicles (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    vehicle_definition_id TEXT NOT NULL REFERENCES vehicle_definitions(id),
    acquired_at TEXT DEFAULT (datetime('now')),

    -- Identity
    custom_name TEXT,
    license_plate TEXT,
    vin TEXT,
    is_registered INTEGER DEFAULT 1, -- BOOLEAN

    -- State
    current_location_id TEXT,
    current_coordinates TEXT, -- JSON {lat, lng}
    current_hull_points INTEGER,
    current_fuel REAL,
    odometer_km REAL DEFAULT 0,
    is_damaged INTEGER DEFAULT 0, -- BOOLEAN

    -- Customization
    paint_color_primary TEXT,
    paint_color_secondary TEXT,
    installed_mods TEXT, -- JSON

    -- Ownership
    ownership_type TEXT,
    owned_outright INTEGER DEFAULT 1, -- BOOLEAN
    loan_id TEXT,
    insured INTEGER DEFAULT 0, -- BOOLEAN

    -- Corporate
    corporate_issued INTEGER DEFAULT 0, -- BOOLEAN
    corporate_tracked INTEGER DEFAULT 0, -- BOOLEAN
    transponder_disabled INTEGER DEFAULT 0, -- BOOLEAN

    -- Tracking
    total_deliveries INTEGER DEFAULT 0,
    total_distance_km REAL DEFAULT 0,
    accidents INTEGER DEFAULT 0
);

-- ============================================
-- DRONE DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS drone_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    manufacturer TEXT,
    description TEXT,

    -- Classification
    drone_class TEXT,
    drone_role TEXT,
    size_category TEXT,
    rarity TEXT DEFAULT 'COMMON' REFERENCES enum_rarity(value),

    -- Performance
    max_speed_kmh INTEGER DEFAULT 50,
    acceleration INTEGER DEFAULT 50,
    maneuverability INTEGER DEFAULT 50,
    hover_capable INTEGER DEFAULT 1, -- BOOLEAN
    max_altitude_m INTEGER DEFAULT 100,
    noise_level INTEGER DEFAULT 50,

    -- Durability
    max_hull_points INTEGER DEFAULT 20,
    armor_rating INTEGER DEFAULT 0,
    emp_resistance INTEGER DEFAULT 0,

    -- Power
    battery_capacity_minutes INTEGER DEFAULT 30,
    recharge_time_minutes INTEGER DEFAULT 60,
    solar_capable INTEGER DEFAULT 0, -- BOOLEAN

    -- Payload
    max_payload_kg REAL DEFAULT 1.0,
    cargo_volume_liters REAL DEFAULT 2.0,
    weapon_mounts INTEGER DEFAULT 0,
    tool_mounts INTEGER DEFAULT 1,

    -- Sensors
    sensor_suite TEXT, -- JSON
    stealth_detection INTEGER DEFAULT 0,
    targeting_accuracy INTEGER DEFAULT 50,

    -- Control
    autonomous_level INTEGER DEFAULT 1,
    control_range_km REAL DEFAULT 1.0,
    requires_neural_link INTEGER DEFAULT 0, -- BOOLEAN
    swarm_compatible INTEGER DEFAULT 0, -- BOOLEAN
    max_swarm_size INTEGER DEFAULT 0,

    -- Requirements
    required_tier INTEGER DEFAULT 1,
    required_track_id TEXT REFERENCES tracks(id),
    required_skill_id TEXT REFERENCES skill_definitions(id),
    required_skill_level INTEGER DEFAULT 1,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER DRONES
-- ============================================

CREATE TABLE IF NOT EXISTS character_drones (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    drone_definition_id TEXT NOT NULL REFERENCES drone_definitions(id),
    acquired_at TEXT DEFAULT (datetime('now')),

    -- Identity
    custom_name TEXT,
    serial_number TEXT,
    paint_scheme TEXT, -- JSON

    -- State
    current_state TEXT DEFAULT 'STORED' REFERENCES enum_drone_state(value),
    current_location_id TEXT,
    current_coordinates TEXT, -- JSON
    altitude_m INTEGER DEFAULT 0,
    current_hull_points INTEGER,
    current_battery INTEGER DEFAULT 100,
    is_deployed INTEGER DEFAULT 0, -- BOOLEAN
    is_autonomous INTEGER DEFAULT 0, -- BOOLEAN

    -- Loadout
    equipped_weapons TEXT, -- JSON
    equipped_tools TEXT, -- JSON
    current_cargo TEXT, -- JSON

    -- Swarm
    swarm_id TEXT,
    swarm_role TEXT,
    formation_position INTEGER,

    -- Tracking
    total_flight_hours REAL DEFAULT 0,
    total_missions INTEGER DEFAULT 0,
    successful_missions INTEGER DEFAULT 0,
    times_destroyed INTEGER DEFAULT 0
);

-- ============================================
-- CONSUMABLE DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS consumable_definitions (
    id TEXT PRIMARY KEY,
    item_id TEXT UNIQUE NOT NULL REFERENCES item_definitions(id),

    -- Type
    consumable_type TEXT,
    consumption_method TEXT,
    consumption_time_seconds INTEGER DEFAULT 1,

    -- Effects
    immediate_effects TEXT, -- JSON
    over_time_effects TEXT, -- JSON
    effect_duration_seconds INTEGER DEFAULT 0,
    stacks_with_self INTEGER DEFAULT 0, -- BOOLEAN
    max_stacks INTEGER DEFAULT 1,

    -- Addiction
    addiction_type_id TEXT,
    addiction_risk REAL DEFAULT 0,
    addiction_severity_increase REAL DEFAULT 0,

    -- Overdose
    overdose_threshold INTEGER DEFAULT 10,
    overdose_effects TEXT, -- JSON
    overdose_time_window_hours INTEGER DEFAULT 24,

    -- Detection
    detectable_in_blood INTEGER DEFAULT 1, -- BOOLEAN
    detection_window_hours INTEGER DEFAULT 24,
    is_illegal INTEGER DEFAULT 0, -- BOOLEAN
    illegality_varies_by_location INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_skill_defs_category ON skill_definitions(category);
CREATE INDEX IF NOT EXISTS idx_char_skills_char ON character_skills(character_id);
CREATE INDEX IF NOT EXISTS idx_ability_defs_source ON ability_definitions(source_track_id);
CREATE INDEX IF NOT EXISTS idx_char_abilities_char ON character_abilities(character_id);
CREATE INDEX IF NOT EXISTS idx_item_defs_type ON item_definitions(item_type);
CREATE INDEX IF NOT EXISTS idx_item_defs_rarity ON item_definitions(rarity);
CREATE INDEX IF NOT EXISTS idx_char_inventory_char ON character_inventory(character_id);
CREATE INDEX IF NOT EXISTS idx_char_inventory_equipped ON character_inventory(equipped_slot);
CREATE INDEX IF NOT EXISTS idx_char_vehicles_char ON character_vehicles(character_id);
CREATE INDEX IF NOT EXISTS idx_char_drones_char ON character_drones(character_id);
CREATE INDEX IF NOT EXISTS idx_weapon_defs_class ON weapon_definitions(weapon_class);
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
-- SURGE PROTOCOL: Database Schema Migration
-- Part 6: Economy, Contracts & Black Market
-- Tables: currencies, finances, contracts, debts, black market

-- ============================================
-- CURRENCY DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS currency_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT,
    description TEXT,

    -- Type
    currency_type TEXT REFERENCES enum_currency_type(value),
    is_primary INTEGER DEFAULT 0, -- BOOLEAN
    is_tradeable INTEGER DEFAULT 1, -- BOOLEAN
    is_physical INTEGER DEFAULT 0, -- BOOLEAN

    -- Conversion
    exchange_rate_to_primary REAL DEFAULT 1.0,
    exchange_rate_volatile INTEGER DEFAULT 0, -- BOOLEAN
    exchange_rate_range TEXT, -- JSON {min, max}

    -- Restrictions
    faction_specific_id TEXT REFERENCES factions(id),
    region_specific_id TEXT REFERENCES regions(id),
    tier_required INTEGER DEFAULT 1,
    illegal INTEGER DEFAULT 0, -- BOOLEAN

    -- Limits
    max_carry_physical INTEGER,
    max_account_balance INTEGER,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER FINANCES
-- ============================================

CREATE TABLE IF NOT EXISTS character_finances (
    id TEXT PRIMARY KEY,
    character_id TEXT UNIQUE NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

    -- Balances
    primary_currency_balance INTEGER DEFAULT 0,
    currency_balances TEXT, -- JSON {currency_id: amount}
    physical_currency_on_person TEXT, -- JSON

    -- Accounts
    bank_accounts TEXT, -- JSON
    crypto_wallets TEXT, -- JSON
    hidden_stashes TEXT, -- JSON

    -- Income
    total_earned_career INTEGER DEFAULT 0,
    income_this_month INTEGER DEFAULT 0,
    income_sources TEXT, -- JSON
    average_delivery_pay INTEGER DEFAULT 0,

    -- Expenses
    total_spent_career INTEGER DEFAULT 0,
    expenses_this_month INTEGER DEFAULT 0,
    recurring_expenses TEXT, -- JSON

    -- Debt
    total_debt INTEGER DEFAULT 0,
    active_debts TEXT, -- JSON
    debt_to_income_ratio REAL DEFAULT 0,

    -- Credit
    credit_score INTEGER DEFAULT 500,
    credit_limit INTEGER DEFAULT 1000,
    credit_utilized INTEGER DEFAULT 0,

    -- Insurance
    health_insurance_active INTEGER DEFAULT 0, -- BOOLEAN
    vehicle_insurance_active INTEGER DEFAULT 0, -- BOOLEAN
    insurance_monthly_cost INTEGER DEFAULT 0,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- FINANCIAL TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS financial_transactions (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    occurred_at TEXT DEFAULT (datetime('now')),

    -- Transaction
    transaction_type TEXT REFERENCES enum_transaction_type(value),
    currency_id TEXT REFERENCES currency_definitions(id),
    amount INTEGER NOT NULL,
    is_income INTEGER DEFAULT 0, -- BOOLEAN
    balance_after INTEGER,

    -- Source/Destination
    source_type TEXT,
    source_id TEXT,
    source_name TEXT,
    destination_type TEXT,
    destination_id TEXT,
    destination_name TEXT,

    -- Details
    description TEXT,
    category TEXT,
    receipt_number TEXT,
    tax_relevant INTEGER DEFAULT 0, -- BOOLEAN

    -- Traceability
    is_anonymous INTEGER DEFAULT 0, -- BOOLEAN
    is_legal INTEGER DEFAULT 1, -- BOOLEAN
    traceable INTEGER DEFAULT 1, -- BOOLEAN
    corporate_visible INTEGER DEFAULT 1, -- BOOLEAN

    -- Related
    related_mission_id TEXT REFERENCES mission_definitions(id),
    related_item_id TEXT REFERENCES item_definitions(id),
    related_npc_id TEXT REFERENCES npc_definitions(id),
    related_contract_id TEXT
);

-- ============================================
-- VENDOR INVENTORIES
-- ============================================

CREATE TABLE IF NOT EXISTS vendor_inventories (
    id TEXT PRIMARY KEY,
    vendor_npc_id TEXT REFERENCES npc_definitions(id),
    location_id TEXT REFERENCES locations(id),

    -- Type
    vendor_type TEXT,
    specialization TEXT,
    quality_tier_min INTEGER DEFAULT 1,
    quality_tier_max INTEGER DEFAULT 3,

    -- Inventory
    base_inventory TEXT, -- JSON
    rotating_inventory TEXT, -- JSON
    limited_stock TEXT, -- JSON
    black_market_inventory TEXT, -- JSON

    -- Pricing
    buy_price_modifier REAL DEFAULT 1.0,
    sell_price_modifier REAL DEFAULT 0.5,
    haggle_difficulty INTEGER DEFAULT 5,
    accepts_stolen INTEGER DEFAULT 0, -- BOOLEAN
    accepts_contraband INTEGER DEFAULT 0, -- BOOLEAN

    -- Requirements
    reputation_required INTEGER DEFAULT 0,
    faction_required_id TEXT REFERENCES factions(id),
    tier_required INTEGER DEFAULT 1,

    -- Refresh
    restock_frequency_hours INTEGER DEFAULT 24,
    last_restock TEXT,
    restock_seed INTEGER,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CONTRACT DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS contract_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    legal_text TEXT,

    -- Type
    contract_type TEXT,
    issuer_type TEXT,
    issuer_faction_id TEXT REFERENCES factions(id),

    -- Terms
    duration_type TEXT,
    duration_value INTEGER,
    renewable INTEGER DEFAULT 0, -- BOOLEAN
    termination_conditions TEXT, -- JSON
    early_termination_penalty INTEGER DEFAULT 0,

    -- Obligations
    player_obligations TEXT, -- JSON
    issuer_obligations TEXT, -- JSON
    performance_metrics TEXT, -- JSON

    -- Benefits
    compensation TEXT, -- JSON
    benefits_granted TEXT, -- JSON
    access_granted TEXT, -- JSON
    discounts_granted TEXT, -- JSON

    -- Restrictions
    exclusivity_clauses TEXT, -- JSON
    non_compete_clauses TEXT, -- JSON
    restricted_activities TEXT, -- JSON
    required_availability INTEGER DEFAULT 0,

    -- Tracking
    has_tracking_requirements INTEGER DEFAULT 0, -- BOOLEAN
    gps_tracking_required INTEGER DEFAULT 0, -- BOOLEAN
    performance_reviews_frequency INTEGER DEFAULT 0,

    -- Fine Print
    hidden_clauses TEXT, -- JSON
    hidden_reveal_condition TEXT,
    corporate_override_clause INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER CONTRACTS
-- ============================================

CREATE TABLE IF NOT EXISTS character_contracts (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    contract_definition_id TEXT NOT NULL REFERENCES contract_definitions(id),
    signed_at TEXT DEFAULT (datetime('now')),

    -- Parties
    issuer_npc_id TEXT REFERENCES npc_definitions(id),
    issuer_faction_id TEXT REFERENCES factions(id),

    -- Terms
    custom_terms TEXT, -- JSON
    start_date TEXT,
    end_date TEXT,
    auto_renew INTEGER DEFAULT 0, -- BOOLEAN

    -- State
    status TEXT DEFAULT 'ACTIVE' REFERENCES enum_contract_status(value),
    current_performance_score INTEGER DEFAULT 100,
    violations_count INTEGER DEFAULT 0,
    warnings_count INTEGER DEFAULT 0,

    -- Payments
    total_paid_to_player INTEGER DEFAULT 0,
    total_paid_by_player INTEGER DEFAULT 0,
    next_payment_date TEXT,
    next_payment_amount INTEGER DEFAULT 0,

    -- Reviews
    last_review_date TEXT,
    next_review_date TEXT,
    review_score INTEGER,

    -- Termination
    terminated_at TEXT,
    termination_reason TEXT,
    termination_initiated_by TEXT,
    termination_penalty_paid INTEGER DEFAULT 0,

    -- Hidden
    hidden_clauses_revealed TEXT, -- JSON
    corporate_override_invoked INTEGER DEFAULT 0 -- BOOLEAN
);

-- ============================================
-- DEBTS
-- ============================================

CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),

    -- Creditor
    creditor_type TEXT,
    creditor_npc_id TEXT REFERENCES npc_definitions(id),
    creditor_faction_id TEXT REFERENCES factions(id),
    creditor_name TEXT,

    -- Principal
    original_amount INTEGER NOT NULL,
    current_balance INTEGER NOT NULL,
    currency_id TEXT REFERENCES currency_definitions(id),

    -- Terms
    interest_rate_annual REAL DEFAULT 0.1,
    interest_type TEXT,
    payment_frequency TEXT,
    minimum_payment INTEGER DEFAULT 0,
    payment_due_day INTEGER DEFAULT 1,

    -- Collateral
    is_secured INTEGER DEFAULT 0, -- BOOLEAN
    collateral_type TEXT,
    collateral_item_id TEXT REFERENCES character_inventory(id),
    collateral_value INTEGER DEFAULT 0,

    -- State
    status TEXT DEFAULT 'CURRENT' REFERENCES enum_debt_status(value),
    payments_made INTEGER DEFAULT 0,
    payments_missed INTEGER DEFAULT 0,
    total_paid INTEGER DEFAULT 0,
    total_interest_paid INTEGER DEFAULT 0,

    -- Dates
    start_date TEXT,
    maturity_date TEXT,
    last_payment_date TEXT,
    next_payment_due TEXT,

    -- Consequences
    collection_started INTEGER DEFAULT 0, -- BOOLEAN
    collection_agency TEXT,
    legal_action_pending INTEGER DEFAULT 0, -- BOOLEAN
    garnishment_active INTEGER DEFAULT 0, -- BOOLEAN
    garnishment_percentage REAL DEFAULT 0,

    -- Forgiveness
    partial_forgiveness INTEGER DEFAULT 0,
    forgiveness_conditions TEXT,
    can_be_worked_off INTEGER DEFAULT 0 -- BOOLEAN
);

-- ============================================
-- BLACK MARKET CONTACTS
-- ============================================

CREATE TABLE IF NOT EXISTS black_market_contacts (
    id TEXT PRIMARY KEY,
    npc_id TEXT REFERENCES npc_definitions(id),
    location_id TEXT REFERENCES locations(id),

    -- Type
    contact_type TEXT,
    specialization TEXT,
    reliability_rating INTEGER DEFAULT 50,
    danger_rating INTEGER DEFAULT 50,

    -- Requirements
    discovery_method TEXT,
    required_tier INTEGER DEFAULT 3,
    required_reputation TEXT, -- JSON
    introduction_needed INTEGER DEFAULT 1, -- BOOLEAN
    introduction_npc_id TEXT REFERENCES npc_definitions(id),
    trust_threshold INTEGER DEFAULT 0,

    -- Inventory
    inventory_tier_min INTEGER DEFAULT 1,
    inventory_tier_max INTEGER DEFAULT 3,
    specialization_items TEXT, -- JSON
    has_prototype_access INTEGER DEFAULT 0, -- BOOLEAN
    has_corrupted_access INTEGER DEFAULT 0, -- BOOLEAN

    -- Services
    services_offered TEXT, -- JSON
    installs_augments INTEGER DEFAULT 0, -- BOOLEAN
    install_quality_range TEXT, -- JSON
    removes_tracking INTEGER DEFAULT 0, -- BOOLEAN
    fences_goods INTEGER DEFAULT 0, -- BOOLEAN
    fence_rate REAL DEFAULT 0.3,

    -- Pricing
    base_price_modifier REAL DEFAULT 1.5,
    accepts_alternative_payment TEXT, -- JSON
    extends_credit INTEGER DEFAULT 0, -- BOOLEAN
    credit_terms TEXT, -- JSON

    -- Risks
    raid_chance_base REAL DEFAULT 0.01,
    informant_chance REAL DEFAULT 0.01,
    scam_chance REAL DEFAULT 0.01,
    corporate_monitored INTEGER DEFAULT 0, -- BOOLEAN

    -- State
    is_available INTEGER DEFAULT 1, -- BOOLEAN
    availability_schedule TEXT, -- JSON
    last_inventory_refresh TEXT,
    heat_level INTEGER DEFAULT 0,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- BLACK MARKET INVENTORIES
-- ============================================

CREATE TABLE IF NOT EXISTS black_market_inventories (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL REFERENCES black_market_contacts(id),
    generated_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,
    seed INTEGER,

    -- Items
    available_items TEXT, -- JSON array

    -- Services
    available_services TEXT, -- JSON array

    -- Special
    special_offers TEXT, -- JSON
    whispered_rumors TEXT, -- JSON
    upcoming_shipments TEXT -- JSON
);

-- ============================================
-- BLACK MARKET TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS black_market_transactions (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    contact_id TEXT NOT NULL REFERENCES black_market_contacts(id),
    occurred_at TEXT DEFAULT (datetime('now')),

    -- Transaction
    transaction_type TEXT,
    items_involved TEXT, -- JSON
    services_rendered TEXT, -- JSON
    total_price INTEGER DEFAULT 0,
    payment_method TEXT,

    -- Outcome
    outcome TEXT,
    items_received TEXT, -- JSON
    services_completed TEXT, -- JSON
    complications TEXT, -- JSON

    -- Risk Results
    detected_by_corporate INTEGER DEFAULT 0, -- BOOLEAN
    detected_by_police INTEGER DEFAULT 0, -- BOOLEAN
    rating_penalty REAL DEFAULT 0,
    heat_generated INTEGER DEFAULT 0,

    -- Relationship
    trust_change INTEGER DEFAULT 0,
    contact_satisfaction INTEGER DEFAULT 50,
    future_discount_earned REAL DEFAULT 0
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_char_finances_char ON character_finances(character_id);
CREATE INDEX IF NOT EXISTS idx_fin_trans_char ON financial_transactions(character_id);
CREATE INDEX IF NOT EXISTS idx_fin_trans_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_vendor_inv_loc ON vendor_inventories(location_id);
CREATE INDEX IF NOT EXISTS idx_char_contracts_char ON character_contracts(character_id);
CREATE INDEX IF NOT EXISTS idx_char_contracts_status ON character_contracts(status);
CREATE INDEX IF NOT EXISTS idx_debts_char ON debts(character_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_bm_contacts_loc ON black_market_contacts(location_id);
CREATE INDEX IF NOT EXISTS idx_bm_trans_char ON black_market_transactions(character_id);
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
-- SURGE PROTOCOL: Database Schema Migration
-- Part 8: Narrative, Dialogue & Quest Systems
-- Tables: story_arcs, dialogue, quests, achievements

-- ============================================
-- STORY ARCS
-- ============================================

CREATE TABLE IF NOT EXISTS story_arcs (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Type
    arc_type TEXT,
    is_main_story INTEGER DEFAULT 0, -- BOOLEAN
    is_repeatable INTEGER DEFAULT 0, -- BOOLEAN

    -- Structure
    chapters TEXT, -- JSON
    parallel_arcs TEXT, -- JSON
    prerequisite_arcs TEXT, -- JSON
    mutually_exclusive_arcs TEXT, -- JSON

    -- Characters
    protagonist_npcs TEXT, -- JSON
    antagonist_npcs TEXT, -- JSON
    supporting_npcs TEXT, -- JSON

    -- Themes
    themes TEXT, -- JSON
    tone TEXT,
    moral_questions TEXT, -- JSON

    -- Endings
    possible_endings TEXT, -- JSON
    default_ending_id TEXT,

    -- Meta
    estimated_playtime_hours REAL DEFAULT 1.0,
    difficulty_rating INTEGER DEFAULT 5,
    player_agency_level INTEGER DEFAULT 5,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- STORY CHAPTERS
-- ============================================

CREATE TABLE IF NOT EXISTS story_chapters (
    id TEXT PRIMARY KEY,
    arc_id TEXT NOT NULL REFERENCES story_arcs(id),
    sequence_order INTEGER DEFAULT 0,
    name TEXT NOT NULL,
    description TEXT,

    -- Structure
    missions TEXT, -- JSON
    parallel_missions TEXT, -- JSON
    optional_missions TEXT, -- JSON

    -- Triggers
    unlock_conditions TEXT, -- JSON
    auto_start INTEGER DEFAULT 0, -- BOOLEAN
    start_event_id TEXT,

    -- Completion
    completion_conditions TEXT, -- JSON
    completion_event_id TEXT,
    rewards TEXT, -- JSON

    -- Variations
    branch_points TEXT, -- JSON
    variations TEXT, -- JSON

    -- Pacing
    estimated_time_minutes INTEGER DEFAULT 60,
    has_point_of_no_return INTEGER DEFAULT 0, -- BOOLEAN
    point_of_no_return_warning TEXT,

    -- Narrative
    chapter_summary_text TEXT,
    recap_dialogue_id TEXT,
    end_chapter_cutscene_id TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- NARRATIVE EVENTS
-- ============================================

CREATE TABLE IF NOT EXISTS narrative_events (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Type
    event_type TEXT,
    priority INTEGER DEFAULT 5,
    is_skippable INTEGER DEFAULT 1, -- BOOLEAN
    is_repeatable INTEGER DEFAULT 0, -- BOOLEAN

    -- Triggers
    trigger_type TEXT,
    trigger_conditions TEXT, -- JSON
    trigger_location_id TEXT REFERENCES locations(id),
    trigger_time TEXT, -- JSON

    -- Content
    dialogue_tree_id TEXT,
    cutscene_id TEXT,
    animation_sequence TEXT, -- JSON
    ambient_event INTEGER DEFAULT 0, -- BOOLEAN

    -- Participants
    required_npcs TEXT, -- JSON
    optional_npcs TEXT, -- JSON
    spawns_npcs TEXT, -- JSON

    -- Consequences
    state_changes TEXT, -- JSON
    flag_sets TEXT, -- JSON
    unlocks_content TEXT, -- JSON
    reputation_changes TEXT, -- JSON
    item_grants TEXT, -- JSON
    relationship_changes TEXT, -- JSON

    -- Branching
    choices TEXT, -- JSON
    default_choice TEXT,
    timeout_choice TEXT,
    timeout_seconds INTEGER,

    -- Audio/Visual
    background_music_id TEXT,
    ambient_audio_id TEXT,
    weather_override TEXT,
    time_override TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- STORY FLAGS
-- ============================================

CREATE TABLE IF NOT EXISTS story_flags (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,

    -- Type
    flag_type TEXT,
    default_value TEXT,

    -- Scope
    is_global INTEGER DEFAULT 0, -- BOOLEAN
    arc_specific_id TEXT REFERENCES story_arcs(id),
    mission_specific_id TEXT REFERENCES mission_definitions(id),

    -- Persistence
    persists_after_arc INTEGER DEFAULT 1, -- BOOLEAN
    resets_on_new_game INTEGER DEFAULT 1, -- BOOLEAN

    -- Effects
    triggers_events TEXT, -- JSON
    unlocks_dialogue TEXT, -- JSON
    unlocks_missions TEXT, -- JSON
    affects_ending INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER STORY STATE
-- ============================================

CREATE TABLE IF NOT EXISTS character_story_state (
    id TEXT PRIMARY KEY,
    character_id TEXT UNIQUE NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

    -- Arc Progress
    current_main_arc_id TEXT REFERENCES story_arcs(id),
    current_main_chapter_id TEXT REFERENCES story_chapters(id),
    completed_arcs TEXT, -- JSON
    active_arcs TEXT, -- JSON
    failed_arcs TEXT, -- JSON

    -- Flags
    story_flags TEXT, -- JSON
    permanent_flags TEXT, -- JSON

    -- Choices
    major_choices_made TEXT, -- JSON
    pending_consequences TEXT, -- JSON

    -- Endings
    endings_seen TEXT, -- JSON
    current_ending_track TEXT,
    ending_points TEXT, -- JSON

    -- Meta
    story_completion_percent REAL DEFAULT 0,
    total_story_choices INTEGER DEFAULT 0,
    time_in_story_content_hours REAL DEFAULT 0,
    cutscenes_watched TEXT, -- JSON
    cutscenes_skipped TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- DIALOGUE TREES
-- ============================================

CREATE TABLE IF NOT EXISTS dialogue_trees (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Context
    npc_id TEXT REFERENCES npc_definitions(id),
    location_id TEXT REFERENCES locations(id),
    mission_id TEXT REFERENCES mission_definitions(id),
    arc_id TEXT REFERENCES story_arcs(id),

    -- Structure
    root_node_id TEXT,
    greeting_node_id TEXT,
    farewell_node_id TEXT,

    -- Conditions
    availability_conditions TEXT, -- JSON
    one_time_only INTEGER DEFAULT 0, -- BOOLEAN
    cooldown_hours INTEGER DEFAULT 0,

    -- State
    tracks_completion INTEGER DEFAULT 0, -- BOOLEAN
    marks_npc_exhausted INTEGER DEFAULT 0, -- BOOLEAN

    -- Audio
    ambient_audio_id TEXT,
    music_id TEXT,

    -- Meta
    estimated_duration_minutes INTEGER DEFAULT 5,
    has_skill_checks INTEGER DEFAULT 0, -- BOOLEAN
    has_reputation_gates INTEGER DEFAULT 0, -- BOOLEAN
    has_romance_content INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- DIALOGUE NODES
-- ============================================

CREATE TABLE IF NOT EXISTS dialogue_nodes (
    id TEXT PRIMARY KEY,
    tree_id TEXT NOT NULL REFERENCES dialogue_trees(id),
    node_type TEXT,

    -- Content
    speaker_type TEXT,
    speaker_npc_id TEXT REFERENCES npc_definitions(id),
    speaker_name_override TEXT,
    text TEXT,
    text_variations TEXT, -- JSON

    -- Audio
    voice_clip_id TEXT,
    voice_emotion TEXT,

    -- Display
    portrait_expression TEXT,
    animation_id TEXT,
    camera_angle TEXT,

    -- Flow
    next_node_id TEXT REFERENCES dialogue_nodes(id),
    responses TEXT, -- JSON
    auto_advance INTEGER DEFAULT 0, -- BOOLEAN
    advance_delay_seconds REAL DEFAULT 0,

    -- Conditions
    display_conditions TEXT, -- JSON
    skip_conditions TEXT, -- JSON

    -- Effects
    on_display_effects TEXT, -- JSON
    flag_changes TEXT, -- JSON
    relationship_changes TEXT, -- JSON

    -- Meta
    is_hub INTEGER DEFAULT 0, -- BOOLEAN
    is_exit INTEGER DEFAULT 0, -- BOOLEAN
    debug_notes TEXT,
    localization_key TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- DIALOGUE RESPONSES
-- ============================================

CREATE TABLE IF NOT EXISTS dialogue_responses (
    id TEXT PRIMARY KEY,
    node_id TEXT NOT NULL REFERENCES dialogue_nodes(id),
    display_order INTEGER DEFAULT 0,

    -- Content
    text TEXT NOT NULL,
    text_short TEXT,
    text_tooltip TEXT,

    -- Style
    tone TEXT REFERENCES enum_dialogue_tone(value),
    is_aggressive INTEGER DEFAULT 0, -- BOOLEAN
    is_flirtatious INTEGER DEFAULT 0, -- BOOLEAN
    is_humorous INTEGER DEFAULT 0, -- BOOLEAN
    is_honest INTEGER DEFAULT 1, -- BOOLEAN

    -- Conditions
    display_conditions TEXT, -- JSON
    greyed_conditions TEXT, -- JSON
    locked_reason_text TEXT,

    -- Requirements
    required_skill_id TEXT REFERENCES skill_definitions(id),
    required_skill_level INTEGER DEFAULT 0,
    required_attribute_id TEXT REFERENCES attribute_definitions(id),
    required_attribute_level INTEGER DEFAULT 0,
    required_item_id TEXT REFERENCES item_definitions(id),
    required_credits INTEGER DEFAULT 0,
    required_reputation TEXT, -- JSON
    required_flags TEXT, -- JSON

    -- Skill Check
    is_skill_check INTEGER DEFAULT 0, -- BOOLEAN
    skill_check_skill_id TEXT REFERENCES skill_definitions(id),
    skill_check_difficulty INTEGER DEFAULT 10,
    skill_check_hidden INTEGER DEFAULT 0, -- BOOLEAN
    success_node_id TEXT REFERENCES dialogue_nodes(id),
    failure_node_id TEXT REFERENCES dialogue_nodes(id),

    -- Destination
    leads_to_node_id TEXT REFERENCES dialogue_nodes(id),
    ends_conversation INTEGER DEFAULT 0, -- BOOLEAN
    starts_combat INTEGER DEFAULT 0, -- BOOLEAN
    triggers_event_id TEXT REFERENCES narrative_events(id),

    -- Effects
    relationship_change INTEGER DEFAULT 0,
    reputation_changes TEXT, -- JSON
    flag_changes TEXT, -- JSON
    grants_items TEXT, -- JSON
    removes_items TEXT, -- JSON
    grants_xp INTEGER DEFAULT 0,
    grants_credits INTEGER DEFAULT 0,

    -- Special
    is_lie INTEGER DEFAULT 0, -- BOOLEAN
    lie_consequences TEXT, -- JSON
    is_bribe INTEGER DEFAULT 0, -- BOOLEAN
    bribe_amount INTEGER DEFAULT 0,
    is_intimidation INTEGER DEFAULT 0, -- BOOLEAN
    is_seduction INTEGER DEFAULT 0, -- BOOLEAN
    has_voice_line INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- QUEST DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS quest_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    summary TEXT,

    -- Classification
    quest_type TEXT REFERENCES enum_quest_type(value),
    quest_category TEXT,
    priority INTEGER DEFAULT 5,
    difficulty_rating INTEGER DEFAULT 5,

    -- Source
    quest_giver_npc_id TEXT REFERENCES npc_definitions(id),
    quest_giver_location_id TEXT REFERENCES locations(id),
    discovery_method TEXT,
    auto_accept INTEGER DEFAULT 0, -- BOOLEAN

    -- Requirements
    required_tier INTEGER DEFAULT 1,
    required_quests TEXT, -- JSON
    required_reputation TEXT, -- JSON
    required_story_flags TEXT, -- JSON

    -- Structure
    objectives TEXT, -- JSON
    is_linear INTEGER DEFAULT 1, -- BOOLEAN
    has_time_limit INTEGER DEFAULT 0, -- BOOLEAN
    time_limit_hours REAL,
    fail_on_timeout INTEGER DEFAULT 0, -- BOOLEAN

    -- Stages
    stages TEXT, -- JSON
    current_stage_description INTEGER DEFAULT 1, -- BOOLEAN

    -- Rewards
    xp_reward INTEGER DEFAULT 0,
    credit_reward INTEGER DEFAULT 0,
    item_rewards TEXT, -- JSON
    reputation_rewards TEXT, -- JSON
    unlocks_quests TEXT, -- JSON

    -- Failure
    can_fail INTEGER DEFAULT 1, -- BOOLEAN
    failure_conditions TEXT, -- JSON
    failure_consequences TEXT, -- JSON
    restartable_after_failure INTEGER DEFAULT 0, -- BOOLEAN

    -- Narrative
    arc_id TEXT REFERENCES story_arcs(id),
    start_dialogue_id TEXT REFERENCES dialogue_trees(id),
    end_dialogue_id TEXT REFERENCES dialogue_trees(id),
    affects_ending INTEGER DEFAULT 0, -- BOOLEAN

    -- Meta
    is_hidden INTEGER DEFAULT 0, -- BOOLEAN
    is_secret INTEGER DEFAULT 0, -- BOOLEAN
    repeatable INTEGER DEFAULT 0, -- BOOLEAN
    cooldown_hours INTEGER DEFAULT 0,
    display_in_tracker INTEGER DEFAULT 1, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- QUEST OBJECTIVES
-- ============================================

CREATE TABLE IF NOT EXISTS quest_objectives (
    id TEXT PRIMARY KEY,
    quest_definition_id TEXT NOT NULL REFERENCES quest_definitions(id),
    sequence_order INTEGER DEFAULT 0,

    -- Content
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
    target_quantity INTEGER DEFAULT 1,
    target_coordinates TEXT, -- JSON

    -- Conditions
    completion_conditions TEXT, -- JSON
    failure_conditions TEXT, -- JSON
    time_limit_seconds INTEGER,

    -- Rewards
    completion_xp INTEGER DEFAULT 0,
    completion_creds INTEGER DEFAULT 0,
    completion_items TEXT, -- JSON

    -- Flow
    leads_to_objectives TEXT, -- JSON
    mutually_exclusive_with TEXT, -- JSON
    unlocks_dialogue_id TEXT REFERENCES dialogue_trees(id),

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER QUESTS
-- ============================================

CREATE TABLE IF NOT EXISTS character_quests (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    quest_definition_id TEXT NOT NULL REFERENCES quest_definitions(id),
    accepted_at TEXT DEFAULT (datetime('now')),

    -- State
    status TEXT DEFAULT 'ACCEPTED' REFERENCES enum_quest_status(value),
    current_stage INTEGER DEFAULT 0,
    current_objectives TEXT, -- JSON
    is_tracked INTEGER DEFAULT 1, -- BOOLEAN

    -- Progress
    objectives_completed TEXT, -- JSON
    objectives_failed TEXT, -- JSON
    optional_objectives_completed TEXT, -- JSON
    choices_made TEXT, -- JSON

    -- Timing
    deadline TEXT,
    time_spent_seconds INTEGER DEFAULT 0,

    -- Instance
    seed INTEGER,
    instance_variables TEXT, -- JSON
    spawned_npcs TEXT, -- JSON

    -- Completion
    completed_at TEXT,
    completion_type TEXT,
    rewards_claimed INTEGER DEFAULT 0, -- BOOLEAN
    rewards_received TEXT, -- JSON

    -- Meta
    times_completed INTEGER DEFAULT 0,
    best_time_seconds INTEGER,
    notes TEXT
);

-- ============================================
-- ACHIEVEMENT DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS achievement_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    hidden_description TEXT,

    -- Classification
    achievement_type TEXT,
    category TEXT,
    difficulty INTEGER DEFAULT 1,
    rarity TEXT,
    points INTEGER DEFAULT 10,

    -- Requirements
    unlock_conditions TEXT, -- JSON
    counter_target INTEGER DEFAULT 1,
    counter_type TEXT,
    is_hidden INTEGER DEFAULT 0, -- BOOLEAN
    is_secret INTEGER DEFAULT 0, -- BOOLEAN

    -- Rewards
    xp_reward INTEGER DEFAULT 0,
    credit_reward INTEGER DEFAULT 0,
    item_reward_id TEXT REFERENCES item_definitions(id),
    title_reward TEXT,
    cosmetic_reward TEXT, -- JSON

    -- Series
    series_id TEXT,
    series_order INTEGER DEFAULT 0,
    prerequisite_achievement_id TEXT REFERENCES achievement_definitions(id),

    -- Display
    icon_asset TEXT,
    icon_locked_asset TEXT,
    banner_asset TEXT,

    -- Meta
    is_missable INTEGER DEFAULT 0, -- BOOLEAN
    is_one_per_playthrough INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER ACHIEVEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS character_achievements (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL REFERENCES achievement_definitions(id),

    -- Status
    status TEXT DEFAULT 'LOCKED',
    unlocked_at TEXT,

    -- Progress
    current_counter INTEGER DEFAULT 0,
    target_counter INTEGER,
    percent_complete REAL DEFAULT 0,

    -- Tracking
    first_progress_at TEXT,
    last_progress_at TEXT,

    -- Rewards
    rewards_claimed INTEGER DEFAULT 0, -- BOOLEAN
    rewards_claimed_at TEXT,

    -- Meta
    difficulty_at_unlock TEXT,
    playtime_at_unlock_hours REAL,
    is_new INTEGER DEFAULT 0, -- BOOLEAN

    UNIQUE(character_id, achievement_id)
);

-- ============================================
-- MILESTONE DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS milestone_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Type
    milestone_type TEXT,
    category TEXT,
    display_order INTEGER DEFAULT 0,

    -- Tracking
    tracked_stat TEXT,
    thresholds TEXT, -- JSON array of {value, name, reward}
    display_format TEXT,

    -- Rewards
    rewards_per_threshold TEXT, -- JSON

    -- Display
    icon_asset TEXT,
    show_on_profile INTEGER DEFAULT 1, -- BOOLEAN
    leaderboard_eligible INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_story_chapters_arc ON story_chapters(arc_id);
CREATE INDEX IF NOT EXISTS idx_narrative_events_loc ON narrative_events(trigger_location_id);
CREATE INDEX IF NOT EXISTS idx_char_story_state_char ON character_story_state(character_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_trees_npc ON dialogue_trees(npc_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_nodes_tree ON dialogue_nodes(tree_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_responses_node ON dialogue_responses(node_id);
CREATE INDEX IF NOT EXISTS idx_quest_defs_type ON quest_definitions(quest_type);
CREATE INDEX IF NOT EXISTS idx_quest_objs_quest ON quest_objectives(quest_definition_id);
CREATE INDEX IF NOT EXISTS idx_char_quests_char ON character_quests(character_id);
CREATE INDEX IF NOT EXISTS idx_char_quests_status ON character_quests(status);
CREATE INDEX IF NOT EXISTS idx_achievement_defs_category ON achievement_definitions(category);
CREATE INDEX IF NOT EXISTS idx_char_achievements_char ON character_achievements(character_id);
-- SURGE PROTOCOL: Database Schema Migration
-- Part 9: Persistence, Social Systems & Analytics
-- Tables: saves, profiles, crews, leaderboards, analytics

-- ============================================
-- SAVE GAMES
-- ============================================

CREATE TABLE IF NOT EXISTS save_games (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    -- Identity
    save_name TEXT,
    save_type TEXT REFERENCES enum_save_type(value),
    save_slot INTEGER,
    is_auto_save INTEGER DEFAULT 0, -- BOOLEAN
    is_quicksave INTEGER DEFAULT 0, -- BOOLEAN

    -- Character
    character_id TEXT REFERENCES characters(id),
    character_name TEXT,
    character_tier INTEGER,
    character_track TEXT,

    -- Progress
    playtime_seconds INTEGER DEFAULT 0,
    story_progress_percent REAL DEFAULT 0,
    main_arc_name TEXT,
    main_mission_name TEXT,

    -- Location
    current_location_id TEXT REFERENCES locations(id),
    current_location_name TEXT,
    current_coordinates TEXT, -- JSON

    -- Thumbnail
    screenshot_asset TEXT,
    thumbnail_asset TEXT,

    -- Version
    game_version TEXT,
    save_version INTEGER DEFAULT 1,
    compatible_versions TEXT, -- JSON

    -- State
    is_valid INTEGER DEFAULT 1, -- BOOLEAN
    is_corrupted INTEGER DEFAULT 0, -- BOOLEAN
    is_ironman INTEGER DEFAULT 0, -- BOOLEAN
    difficulty TEXT REFERENCES enum_difficulty_level(value),

    -- Metadata
    total_missions_completed INTEGER DEFAULT 0,
    total_credits_earned INTEGER DEFAULT 0,
    total_distance_km REAL DEFAULT 0,
    enemies_defeated INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,

    -- Cloud
    cloud_synced INTEGER DEFAULT 0, -- BOOLEAN
    cloud_sync_at TEXT,
    cloud_id TEXT,

    -- Integrity
    data_checksum TEXT,
    tamper_detected INTEGER DEFAULT 0 -- BOOLEAN
);

-- ============================================
-- SAVE DATA CHUNKS
-- ============================================

CREATE TABLE IF NOT EXISTS save_data_chunks (
    id TEXT PRIMARY KEY,
    save_id TEXT NOT NULL REFERENCES save_games(id) ON DELETE CASCADE,
    chunk_type TEXT NOT NULL,

    -- Data
    data TEXT, -- JSON compressed state
    data_version INTEGER DEFAULT 1,
    compressed INTEGER DEFAULT 0, -- BOOLEAN
    compressed_size_bytes INTEGER,
    uncompressed_size_bytes INTEGER,

    -- Integrity
    checksum TEXT,
    is_valid INTEGER DEFAULT 1, -- BOOLEAN

    -- Dependencies
    depends_on_chunks TEXT, -- JSON
    load_priority INTEGER DEFAULT 0,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHECKPOINTS
-- ============================================

CREATE TABLE IF NOT EXISTS checkpoints (
    id TEXT PRIMARY KEY,
    save_id TEXT NOT NULL REFERENCES save_games(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),

    -- Context
    checkpoint_type TEXT,
    trigger_source TEXT,
    description TEXT,

    -- Location
    location_id TEXT REFERENCES locations(id),
    coordinates TEXT, -- JSON

    -- State
    critical_state TEXT, -- JSON

    -- Limits
    expires_at TEXT,
    is_persistent INTEGER DEFAULT 0, -- BOOLEAN

    -- Meta
    replay_possible INTEGER DEFAULT 1, -- BOOLEAN
    restore_count INTEGER DEFAULT 0
);

-- ============================================
-- PLAYER PROFILES (Meta-Game)
-- ============================================

CREATE TABLE IF NOT EXISTS player_profiles (
    id TEXT PRIMARY KEY,
    external_id TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now')),
    last_seen TEXT,

    -- Identity
    display_name TEXT,
    display_name_history TEXT, -- JSON
    avatar_asset TEXT,
    bio TEXT,

    -- Privacy
    privacy_level TEXT DEFAULT 'PUBLIC' REFERENCES enum_privacy_level(value),
    show_online_status INTEGER DEFAULT 1, -- BOOLEAN
    allow_friend_requests INTEGER DEFAULT 1, -- BOOLEAN

    -- Stats
    total_playtime_hours REAL DEFAULT 0,
    achievement_points INTEGER DEFAULT 0,
    achievement_count INTEGER DEFAULT 0,
    characters_created INTEGER DEFAULT 0,
    highest_tier_reached INTEGER DEFAULT 1,

    -- Social
    friend_count INTEGER DEFAULT 0,
    crew_id TEXT,
    crew_rank TEXT,

    -- Moderation
    is_banned INTEGER DEFAULT 0, -- BOOLEAN
    ban_expires_at TEXT,
    warnings TEXT, -- JSON
    reputation_score INTEGER DEFAULT 100
);

-- ============================================
-- PLAYER SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS player_settings (
    id TEXT PRIMARY KEY,
    player_id TEXT UNIQUE NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,

    -- Display
    resolution TEXT,
    fullscreen_mode TEXT,
    vsync INTEGER DEFAULT 1, -- BOOLEAN
    frame_rate_limit INTEGER DEFAULT 60,
    brightness REAL DEFAULT 1.0,
    gamma REAL DEFAULT 1.0,

    -- Graphics
    quality_preset TEXT,
    texture_quality INTEGER DEFAULT 3,
    shadow_quality INTEGER DEFAULT 3,
    effects_quality INTEGER DEFAULT 3,
    draw_distance INTEGER DEFAULT 3,
    antialiasing TEXT,

    -- Audio
    master_volume REAL DEFAULT 1.0,
    music_volume REAL DEFAULT 0.8,
    sfx_volume REAL DEFAULT 1.0,
    voice_volume REAL DEFAULT 1.0,
    ambient_volume REAL DEFAULT 0.7,

    -- Controls
    mouse_sensitivity REAL DEFAULT 1.0,
    invert_y INTEGER DEFAULT 0, -- BOOLEAN
    controller_vibration INTEGER DEFAULT 1, -- BOOLEAN
    key_bindings TEXT, -- JSON
    controller_bindings TEXT, -- JSON

    -- Gameplay
    auto_save_frequency INTEGER DEFAULT 5,
    difficulty_default TEXT REFERENCES enum_difficulty_level(value),
    tutorial_enabled INTEGER DEFAULT 1, -- BOOLEAN
    hints_enabled INTEGER DEFAULT 1, -- BOOLEAN
    subtitles_enabled INTEGER DEFAULT 1, -- BOOLEAN
    subtitle_size INTEGER DEFAULT 2,

    -- Accessibility
    colorblind_mode TEXT,
    screen_shake REAL DEFAULT 1.0,
    motion_blur INTEGER DEFAULT 1, -- BOOLEAN
    flash_reduction INTEGER DEFAULT 0, -- BOOLEAN
    text_to_speech INTEGER DEFAULT 0, -- BOOLEAN

    -- Language
    language_ui TEXT DEFAULT 'en',
    language_audio TEXT DEFAULT 'en',
    language_subtitles TEXT DEFAULT 'en',

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- FRIENDSHIPS
-- ============================================

CREATE TABLE IF NOT EXISTS friendships (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    friend_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),

    -- Status
    status TEXT DEFAULT 'PENDING_SENT',
    initiated_by TEXT REFERENCES player_profiles(id),

    -- Categorization
    nickname TEXT,
    group_name TEXT,
    favorite INTEGER DEFAULT 0, -- BOOLEAN

    -- Interaction
    last_interaction TEXT,
    interaction_count INTEGER DEFAULT 0,
    times_played_together INTEGER DEFAULT 0,

    -- Permissions
    can_join_session INTEGER DEFAULT 1, -- BOOLEAN
    can_see_location INTEGER DEFAULT 1, -- BOOLEAN
    can_send_items INTEGER DEFAULT 1, -- BOOLEAN
    notification_level TEXT DEFAULT 'ALL',

    UNIQUE(player_id, friend_id)
);

-- ============================================
-- CREWS (Guilds)
-- ============================================

CREATE TABLE IF NOT EXISTS crews (
    id TEXT PRIMARY KEY,
    created_at TEXT DEFAULT (datetime('now')),

    -- Identity
    name TEXT UNIQUE NOT NULL,
    tag TEXT UNIQUE,
    description TEXT,
    motto TEXT,
    emblem_asset TEXT,
    colors TEXT, -- JSON {primary, secondary}

    -- Leadership
    founder_id TEXT REFERENCES player_profiles(id),
    leader_id TEXT REFERENCES player_profiles(id),
    officers TEXT, -- JSON

    -- Membership
    member_count INTEGER DEFAULT 1,
    max_members INTEGER DEFAULT 50,
    recruitment_status TEXT DEFAULT 'OPEN',
    requirements TEXT, -- JSON
    application_questions TEXT, -- JSON

    -- Stats
    total_deliveries INTEGER DEFAULT 0,
    total_credits_earned INTEGER DEFAULT 0,
    average_tier REAL DEFAULT 1.0,
    competition_wins INTEGER DEFAULT 0,
    crew_rating INTEGER DEFAULT 0,

    -- Resources
    crew_bank_balance INTEGER DEFAULT 0,
    shared_inventory TEXT, -- JSON

    -- Settings
    privacy TEXT DEFAULT 'PUBLIC' REFERENCES enum_privacy_level(value),
    member_permissions TEXT, -- JSON
    rank_definitions TEXT, -- JSON
    is_active INTEGER DEFAULT 1 -- BOOLEAN
);

-- ============================================
-- CREW MEMBERSHIPS
-- ============================================

CREATE TABLE IF NOT EXISTS crew_memberships (
    id TEXT PRIMARY KEY,
    crew_id TEXT NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    joined_at TEXT DEFAULT (datetime('now')),

    -- Rank
    rank TEXT DEFAULT 'MEMBER',
    rank_order INTEGER DEFAULT 0,
    custom_title TEXT,

    -- Permissions
    can_invite INTEGER DEFAULT 0, -- BOOLEAN
    can_kick INTEGER DEFAULT 0, -- BOOLEAN
    can_promote INTEGER DEFAULT 0, -- BOOLEAN
    can_edit_settings INTEGER DEFAULT 0, -- BOOLEAN
    can_access_bank INTEGER DEFAULT 0, -- BOOLEAN
    bank_withdraw_limit INTEGER DEFAULT 0,

    -- Contribution
    deliveries_for_crew INTEGER DEFAULT 0,
    credits_contributed INTEGER DEFAULT 0,
    events_participated INTEGER DEFAULT 0,
    recruitment_count INTEGER DEFAULT 0,

    -- Status
    is_active INTEGER DEFAULT 1, -- BOOLEAN
    last_active TEXT,
    on_probation INTEGER DEFAULT 0, -- BOOLEAN
    notes TEXT,

    UNIQUE(crew_id, player_id)
);

-- ============================================
-- LEADERBOARD DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS leaderboard_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Type
    leaderboard_type TEXT,
    scope TEXT,
    tracked_stat TEXT NOT NULL,
    sort_direction TEXT DEFAULT 'DESC',

    -- Timing
    reset_frequency TEXT,
    current_period_start TEXT,
    current_period_end TEXT,

    -- Display
    visible INTEGER DEFAULT 1, -- BOOLEAN
    display_top_n INTEGER DEFAULT 100,
    show_player_rank INTEGER DEFAULT 1, -- BOOLEAN
    show_nearby_ranks INTEGER DEFAULT 5,

    -- Rewards
    period_end_rewards TEXT, -- JSON

    -- Integrity
    anti_cheat_rules TEXT, -- JSON
    minimum_playtime INTEGER DEFAULT 0,
    minimum_tier INTEGER DEFAULT 1,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- LEADERBOARD ENTRIES
-- ============================================

CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id TEXT PRIMARY KEY,
    leaderboard_id TEXT NOT NULL REFERENCES leaderboard_definitions(id),
    player_id TEXT NOT NULL REFERENCES player_profiles(id),
    period_id TEXT,

    -- Score
    score INTEGER DEFAULT 0,
    rank INTEGER,
    rank_change INTEGER DEFAULT 0,

    -- Details
    character_name TEXT,
    character_tier INTEGER,
    character_track TEXT,

    -- Timing
    first_entry TEXT,
    last_update TEXT,

    -- Verification
    verified INTEGER DEFAULT 0, -- BOOLEAN
    flagged_for_review INTEGER DEFAULT 0, -- BOOLEAN

    UNIQUE(leaderboard_id, player_id, period_id)
);

-- ============================================
-- MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    created_at TEXT DEFAULT (datetime('now')),

    -- Participants
    sender_id TEXT REFERENCES player_profiles(id),
    recipient_id TEXT REFERENCES player_profiles(id),
    recipient_crew_id TEXT REFERENCES crews(id),

    -- Content
    message_type TEXT DEFAULT 'DIRECT',
    subject TEXT,
    body TEXT,
    attachments TEXT, -- JSON

    -- State
    is_read INTEGER DEFAULT 0, -- BOOLEAN
    read_at TEXT,
    is_deleted_sender INTEGER DEFAULT 0, -- BOOLEAN
    is_deleted_recipient INTEGER DEFAULT 0, -- BOOLEAN

    -- Threading
    thread_id TEXT,
    reply_to_id TEXT REFERENCES messages(id),

    -- Moderation
    is_reported INTEGER DEFAULT 0, -- BOOLEAN
    is_moderated INTEGER DEFAULT 0, -- BOOLEAN
    moderation_action TEXT
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),

    -- Content
    notification_type TEXT,
    title TEXT,
    body TEXT,
    icon TEXT,
    action_url TEXT,
    action_data TEXT, -- JSON

    -- State
    is_read INTEGER DEFAULT 0, -- BOOLEAN
    read_at TEXT,
    is_dismissed INTEGER DEFAULT 0, -- BOOLEAN

    -- Priority
    priority INTEGER DEFAULT 3,
    expires_at TEXT,

    -- Delivery
    push_sent INTEGER DEFAULT 0, -- BOOLEAN
    email_sent INTEGER DEFAULT 0, -- BOOLEAN
    in_game_shown INTEGER DEFAULT 0 -- BOOLEAN
);

-- ============================================
-- ANALYTICS EVENTS
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    player_id TEXT,
    character_id TEXT REFERENCES characters(id),
    occurred_at TEXT DEFAULT (datetime('now')),

    -- Event
    event_type TEXT,
    event_category TEXT,
    event_name TEXT,
    event_data TEXT, -- JSON

    -- Context
    location_id TEXT REFERENCES locations(id),
    mission_id TEXT REFERENCES mission_definitions(id),
    coordinates TEXT, -- JSON

    -- Session
    session_time_seconds INTEGER,
    playtime_total_seconds INTEGER,

    -- Meta
    client_version TEXT,
    platform TEXT,
    is_debug INTEGER DEFAULT 0 -- BOOLEAN
);

-- ============================================
-- PLAY SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS play_sessions (
    id TEXT PRIMARY KEY,
    player_id TEXT,
    character_id TEXT REFERENCES characters(id),
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT,

    -- Duration
    duration_seconds INTEGER DEFAULT 0,
    active_duration_seconds INTEGER DEFAULT 0,
    idle_duration_seconds INTEGER DEFAULT 0,

    -- Activity
    missions_started INTEGER DEFAULT 0,
    missions_completed INTEGER DEFAULT 0,
    deliveries_completed INTEGER DEFAULT 0,
    credits_earned INTEGER DEFAULT 0,
    credits_spent INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    distance_traveled_km REAL DEFAULT 0,
    enemies_defeated INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,

    -- Progression
    tier_at_start INTEGER,
    tier_at_end INTEGER,
    rating_at_start REAL,
    rating_at_end REAL,

    -- Technical
    average_fps REAL,
    crashes INTEGER DEFAULT 0,
    load_time_average_seconds REAL,

    -- Meta
    client_version TEXT,
    platform TEXT,
    session_quality_score INTEGER DEFAULT 100
);

-- ============================================
-- GAME CONFIGURATION
-- ============================================

CREATE TABLE IF NOT EXISTS game_config (
    id TEXT PRIMARY KEY,
    config_key TEXT UNIQUE NOT NULL,
    config_category TEXT,
    description TEXT,

    -- Value
    value_type TEXT,
    current_value TEXT,
    default_value TEXT,

    -- Constraints
    min_value TEXT,
    max_value TEXT,
    allowed_values TEXT, -- JSON

    -- Flags
    requires_restart INTEGER DEFAULT 0, -- BOOLEAN
    is_tunable INTEGER DEFAULT 1, -- BOOLEAN
    a_b_test_eligible INTEGER DEFAULT 0, -- BOOLEAN

    -- Overrides
    environment_overrides TEXT, -- JSON
    platform_overrides TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- DIFFICULTY DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS difficulty_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Combat Modifiers
    damage_to_player REAL DEFAULT 1.0,
    damage_from_player REAL DEFAULT 1.0,
    enemy_health REAL DEFAULT 1.0,
    enemy_accuracy REAL DEFAULT 1.0,
    enemy_aggression REAL DEFAULT 1.0,

    -- Economy
    credit_rewards REAL DEFAULT 1.0,
    xp_rewards REAL DEFAULT 1.0,
    loot_quality REAL DEFAULT 1.0,
    prices REAL DEFAULT 1.0,

    -- Survival
    healing_effectiveness REAL DEFAULT 1.0,
    humanity_loss_rate REAL DEFAULT 1.0,
    addiction_severity REAL DEFAULT 1.0,

    -- Progression
    rating_gain REAL DEFAULT 1.0,
    rating_loss REAL DEFAULT 1.0,

    -- Special
    permadeath INTEGER DEFAULT 0, -- BOOLEAN
    ironman_mode INTEGER DEFAULT 0, -- BOOLEAN
    achievement_eligible INTEGER DEFAULT 1, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- LOCALIZED STRINGS
-- ============================================

CREATE TABLE IF NOT EXISTS localized_strings (
    id TEXT PRIMARY KEY,
    string_key TEXT UNIQUE NOT NULL,
    category TEXT,
    context TEXT,

    -- Base
    base_language TEXT DEFAULT 'en',
    base_text TEXT NOT NULL,
    base_plural_forms TEXT, -- JSON

    -- Metadata
    character_limit INTEGER,
    has_variables INTEGER DEFAULT 0, -- BOOLEAN
    variable_definitions TEXT, -- JSON

    -- Status
    is_translatable INTEGER DEFAULT 1, -- BOOLEAN
    priority INTEGER DEFAULT 5,

    -- Versioning
    version INTEGER DEFAULT 1,
    last_updated TEXT DEFAULT (datetime('now')),
    requires_retranslation INTEGER DEFAULT 0 -- BOOLEAN
);

-- ============================================
-- TRANSLATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS translations (
    id TEXT PRIMARY KEY,
    string_id TEXT NOT NULL REFERENCES localized_strings(id),
    language_code TEXT NOT NULL,

    -- Content
    translated_text TEXT,
    plural_forms TEXT, -- JSON

    -- Status
    status TEXT DEFAULT 'PENDING',
    approved INTEGER DEFAULT 0, -- BOOLEAN
    approved_by TEXT,
    approved_at TEXT,

    -- Quality
    translator_notes TEXT,
    qa_notes TEXT,

    -- Audio
    has_voice INTEGER DEFAULT 0, -- BOOLEAN
    voice_asset TEXT,

    -- Versioning
    base_version INTEGER DEFAULT 1,
    translation_version INTEGER DEFAULT 1,
    last_updated TEXT DEFAULT (datetime('now')),

    UNIQUE(string_id, language_code)
);

-- ============================================
-- PROCEDURAL GENERATION
-- ============================================

CREATE TABLE IF NOT EXISTS generation_templates (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    template_type TEXT,

    -- Parameters
    parameter_ranges TEXT, -- JSON
    required_tags TEXT, -- JSON
    excluded_tags TEXT, -- JSON
    weight_modifiers TEXT, -- JSON

    -- Constraints
    tier_range TEXT, -- JSON {min, max}
    difficulty_range TEXT, -- JSON
    faction_affinity_id TEXT REFERENCES factions(id),
    region_affinity_id TEXT REFERENCES regions(id),

    -- Scaling
    scales_with_tier INTEGER DEFAULT 1, -- BOOLEAN
    scaling_formula TEXT,

    -- Variety
    variation_count INTEGER DEFAULT 1,
    combination_rules TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- LOOT TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS loot_tables (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,

    -- Source
    source_type TEXT,
    source_tier_range TEXT, -- JSON

    -- Entries
    guaranteed_items TEXT, -- JSON
    random_items TEXT, -- JSON
    currency_range TEXT, -- JSON

    -- Modifiers
    luck_affects INTEGER DEFAULT 1, -- BOOLEAN
    tier_scaling INTEGER DEFAULT 1, -- BOOLEAN
    faction_modifiers TEXT, -- JSON
    region_modifiers TEXT, -- JSON

    -- Special
    legendary_chance REAL DEFAULT 0.001,
    nothing_chance REAL DEFAULT 0.1,

    -- Nested
    nested_tables TEXT, -- JSON
    mutually_exclusive TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- WEATHER CONDITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS weather_conditions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Type
    weather_type TEXT,
    severity INTEGER DEFAULT 1,
    is_hazardous INTEGER DEFAULT 0, -- BOOLEAN

    -- Effects
    visibility_modifier REAL DEFAULT 1.0,
    speed_modifier REAL DEFAULT 1.0,
    handling_modifier REAL DEFAULT 1.0,
    stealth_modifier REAL DEFAULT 1.0,
    damage_per_minute INTEGER DEFAULT 0,

    -- Requirements
    special_equipment_needed TEXT, -- JSON
    vehicle_requirements TEXT, -- JSON

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- GAME TIME STATE
-- ============================================

CREATE TABLE IF NOT EXISTS game_time_state (
    id TEXT PRIMARY KEY,
    save_id TEXT REFERENCES save_games(id),

    -- Current Time
    current_timestamp TEXT,
    current_day_of_week INTEGER DEFAULT 0,
    current_hour INTEGER DEFAULT 8,
    current_minute INTEGER DEFAULT 0,

    -- Calendar
    current_day INTEGER DEFAULT 1,
    current_month INTEGER DEFAULT 1,
    current_year INTEGER DEFAULT 2087,
    days_elapsed INTEGER DEFAULT 0,

    -- Cycle
    time_of_day TEXT DEFAULT 'MORNING',
    is_rush_hour INTEGER DEFAULT 0, -- BOOLEAN
    is_night INTEGER DEFAULT 0, -- BOOLEAN

    -- Scaling
    time_scale REAL DEFAULT 1.0,
    time_paused INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_save_games_player ON save_games(player_id);
CREATE INDEX IF NOT EXISTS idx_save_games_char ON save_games(character_id);
CREATE INDEX IF NOT EXISTS idx_save_chunks_save ON save_data_chunks(save_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_save ON checkpoints(save_id);
CREATE INDEX IF NOT EXISTS idx_player_profiles_ext ON player_profiles(external_id);
CREATE INDEX IF NOT EXISTS idx_friendships_player ON friendships(player_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_crew_memberships_crew ON crew_memberships(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_memberships_player ON crew_memberships(player_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_lb ON leaderboard_entries(leaderboard_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_player ON leaderboard_entries(player_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_player ON notifications(player_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_player ON analytics_events(player_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_play_sessions_player ON play_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_translations_string ON translations(string_id);
CREATE INDEX IF NOT EXISTS idx_translations_lang ON translations(language_code);
-- SURGE PROTOCOL: Seed Data
-- Initial data for game configuration and definitions

-- ============================================
-- ATTRIBUTE DEFINITIONS
-- ============================================

INSERT OR IGNORE INTO attribute_definitions (id, code, name, abbreviation, description, category, base_value, display_order) VALUES
('attr-pwr', 'PWR', 'Power', 'PWR', 'Raw physical strength. Affects melee damage, carrying capacity, intimidation.', 'PHYSICAL', 5, 1),
('attr-end', 'END', 'Endurance', 'END', 'Physical stamina and resilience. Affects health, stamina pool, poison resistance.', 'PHYSICAL', 5, 2),
('attr-agi', 'AGI', 'Agility', 'AGI', 'Flexibility and fine motor control. Affects dodge, stealth, lockpicking.', 'PHYSICAL', 5, 3),
('attr-vel', 'VEL', 'Velocity', 'VEL', 'Speed and reaction time. Affects driving, initiative, attack speed.', 'PHYSICAL', 5, 4),
('attr-int', 'INT', 'Intelligence', 'INT', 'Raw cognitive ability. Affects hacking, crafting, knowledge skills.', 'MENTAL', 5, 5),
('attr-prc', 'PRC', 'Perception', 'PRC', 'Awareness and attention to detail. Affects spotting, tracking, investigation.', 'MENTAL', 5, 6),
('attr-rsn', 'RSN', 'Reason', 'RSN', 'Problem-solving under pressure. Affects tactical decisions, jury-rigging.', 'MENTAL', 5, 7),
('attr-pre', 'PRE', 'Presence', 'PRE', 'Force of personality. Affects persuasion, intimidation, performance.', 'SOCIAL', 5, 8),
('attr-emp', 'EMP', 'Empathy', 'EMP', 'Emotional intelligence. Affects reading people, relationships, humanity recovery.', 'SOCIAL', 5, 9);

-- ============================================
-- TRACKS
-- ============================================

INSERT OR IGNORE INTO tracks (id, code, name, tagline, description, philosophy, unlock_tier, color_primary) VALUES
('track-vector', 'VECTOR', 'Vector', 'Speed is survival', 'Masters of movement. Vectors prioritize getting packages where they need to go as fast as physically possible.', 'The shortest distance between two points is through whatever is in your way.', 3, '#00FF88'),
('track-sentinel', 'SENTINEL', 'Sentinel', 'The package is sacred', 'Protectors and defenders. Sentinels ensure cargo and people reach their destination intact, no matter what.', 'Nothing touches my cargo. Nothing.', 3, '#0088FF'),
('track-netweaver', 'NETWEAVER', 'Netweaver', 'Information wants to be free', 'Digital infiltrators. Netweavers specialize in data, hacking, and manipulating the network that runs everything.', 'The best route is the one no one else can see.', 3, '#8800FF'),
('track-interface', 'INTERFACE', 'Interface', 'Every deal is a delivery', 'Social engineers. Interfaces excel at negotiation, manipulation, and getting people to do what they want.', 'The package is just an excuse to have a conversation.', 3, '#FF8800'),
('track-machinist', 'MACHINIST', 'Machinist', 'Build it. Break it. Own it.', 'Technical specialists. Machinists maintain, modify, and weaponize vehicles, drones, and augments.', 'If it has moving parts, I can make it do something new.', 3, '#FF0088');

-- ============================================
-- SPECIALIZATIONS
-- ============================================

-- Vector Specializations
INSERT OR IGNORE INTO specializations (id, code, name, track_id, tagline, unlock_tier) VALUES
('spec-slipstream', 'SLIPSTREAM', 'Slipstream', 'track-vector', 'Traffic flows around you', 6),
('spec-parkour', 'PARKOUR_VECTOR', 'Parkour Vector', 'track-vector', 'Walls are just suggestions', 6),
('spec-pilot', 'PILOT', 'Pilot', 'track-vector', 'Why drive when you can fly?', 6);

-- Sentinel Specializations
INSERT OR IGNORE INTO specializations (id, code, name, track_id, tagline, unlock_tier) VALUES
('spec-bulwark', 'BULWARK', 'Bulwark', 'track-sentinel', 'Immovable object', 6),
('spec-shepherd', 'SHEPHERD', 'Shepherd', 'track-sentinel', 'VIP security specialist', 6),
('spec-hazmat', 'HAZMAT', 'Hazmat Handler', 'track-sentinel', 'Dangerous cargo expert', 6);

-- Netweaver Specializations
INSERT OR IGNORE INTO specializations (id, code, name, track_id, tagline, unlock_tier) VALUES
('spec-phantom', 'PHANTOM', 'Phantom', 'track-netweaver', 'Ghost in the machine', 6),
('spec-spider', 'SPIDER', 'Spider', 'track-netweaver', 'Web of access points', 6),
('spec-oracle', 'ORACLE', 'Oracle', 'track-netweaver', 'See the future in data', 6);

-- Interface Specializations
INSERT OR IGNORE INTO specializations (id, code, name, track_id, tagline, unlock_tier) VALUES
('spec-broker', 'BROKER', 'Broker', 'track-interface', 'Deals within deals', 6),
('spec-mask', 'MASK', 'Mask', 'track-interface', 'Anyone you need to be', 6),
('spec-handler', 'HANDLER', 'Handler', 'track-interface', 'Loyalty is a tool', 6);

-- Machinist Specializations
INSERT OR IGNORE INTO specializations (id, code, name, track_id, tagline, unlock_tier) VALUES
('spec-swarmlord', 'SWARM_LORD', 'Swarm Lord', 'track-machinist', 'Distributed presence', 6),
('spec-centaur', 'CENTAUR', 'Centaur', 'track-machinist', 'One with the vehicle', 6),
('spec-fabricator', 'FABRICATOR', 'Fabricator', 'track-machinist', 'Build anything from nothing', 6);

-- ============================================
-- TIER DEFINITIONS
-- ============================================

INSERT OR IGNORE INTO tier_definitions (id, tier_number, name, rating_minimum, rating_maximum, description, narrative_milestone, attribute_points_granted, skill_points_granted) VALUES
('tier-1', 1, 'Applicant', 0.0, 2.99, 'Fresh meat. Probationary status.', 'Joined Omnideliver', 0, 0),
('tier-2', 2, 'Provisional', 3.0, 3.49, 'Barely trusted with real deliveries.', 'First successful delivery', 1, 2),
('tier-3', 3, 'Courier', 3.5, 3.99, 'A real courier now. Choose your Track.', 'Track Selection', 2, 3),
('tier-4', 4, 'Runner', 4.0, 4.24, 'Trusted with sensitive cargo.', 'First classified delivery', 1, 2),
('tier-5', 5, 'Specialist', 4.25, 4.49, 'Access to the Interstitial Network.', 'Interstitial access granted', 2, 3),
('tier-6', 6, 'Elite', 4.5, 4.69, 'Choose your Specialization.', 'Specialization Selection', 2, 3),
('tier-7', 7, 'Prime', 4.7, 4.84, 'Top 10% of all couriers.', 'Corporate recognition', 2, 3),
('tier-8', 8, 'Apex', 4.85, 4.94, 'Near-mythical reputation.', 'Legend status achieved', 2, 3),
('tier-9', 9, 'Convergence', 4.95, 4.99, 'The Algorithm notices you.', 'The Convergence begins', 3, 4),
('tier-10', 10, 'Transcendent', 5.0, 5.0, 'Perfect. What comes next?', 'The Choice', 5, 5);

-- ============================================
-- CURRENCY DEFINITIONS
-- ============================================

INSERT OR IGNORE INTO currency_definitions (id, code, name, symbol, description, currency_type, is_primary) VALUES
('curr-cred', 'CRED', 'Credits', '₢', 'Universal digital currency', 'STANDARD', 1),
('curr-ocoin', 'OCOIN', 'OmniCoin', 'Ⓞ', 'Omnideliver internal corporate scrip', 'CORPORATE', 0),
('curr-ghost', 'GHOST', 'GhostCoin', 'Ǥ', 'Untraceable cryptocurrency', 'CRYPTO', 0),
('curr-karma', 'KARMA', 'Karma Points', '☯', 'Reputation-based reward points', 'REWARD', 0);

-- ============================================
-- FACTIONS
-- ============================================

INSERT OR IGNORE INTO factions (id, code, name, short_name, tagline, faction_type, alignment_corporate, alignment_law, joinable_by_player, colors_primary) VALUES
('fact-omni', 'OMNI', 'Omnideliver Corporation', 'Omni', 'Always On Time', 'MEGACORP', 100, 50, 0, '#FF6600'),
('fact-network', 'NETWORK', 'The Network', 'Network', 'All Nodes Connected', 'COLLECTIVE', 80, 30, 0, '#00FFFF'),
('fact-union', 'UNION', 'Courier''s Union', 'Union', 'Solidarity Forever', 'GUILD', -20, 20, 1, '#FF0000'),
('fact-circuit', 'CIRCUIT', 'Shadow Circuit', 'Circuit', 'What You Need, When You Need It', 'SYNDICATE', -80, -60, 1, '#8B00FF'),
('fact-collective', 'COLLECTIVE', 'Collective Flesh', 'Collective', 'Transcend the Meat', 'CULT', -100, -80, 0, '#00FF00'),
('fact-trauma', 'TRAUMA', 'Trauma Team International', 'Trauma', 'Your Life Is Our Priority', 'CORPORATION', 60, 70, 0, '#FF0000'),
('fact-ncpd', 'NCPD', 'Metro Police Department', 'NCPD', 'To Protect and Serve', 'LAW_ENFORCEMENT', 30, 100, 0, '#0000FF'),
('fact-tigers', 'TIGERS', 'Chrome Tigers', 'Tigers', 'Strength Through Steel', 'GANG', -50, -70, 1, '#FFD700'),
('fact-saints', 'SAINTS', 'Digital Saints', 'Saints', 'Free the Data', 'MOVEMENT', -60, -20, 1, '#FFFFFF'),
('fact-ascend', 'ASCEND', 'Church of Ascension', 'Ascension', 'The Algorithm Provides', 'CULT', 40, 10, 0, '#GOLD');

-- ============================================
-- HUMANITY THRESHOLDS
-- ============================================

INSERT OR IGNORE INTO humanity_thresholds (id, threshold_value, threshold_name, description, can_recover) VALUES
('hum-100', 100, 'Baseline Human', 'Normal human function, full emotional range', 1),
('hum-80', 80, 'Chrome-Touched', 'Mild dissociation, dreams occasionally glitch', 1),
('hum-60', 60, 'Wired', 'Emotional blunting, occasional aggression spikes', 1),
('hum-40', 40, 'Ghost in Shell', 'Identity confusion, paranoid thoughts', 1),
('hum-20', 20, 'Edge Case', 'Violent episodes, reality breaks', 1),
('hum-0', 0, 'Cyberpsycho', 'Full psychotic break, hostile NPC takeover', 0);

-- ============================================
-- DIFFICULTY DEFINITIONS
-- ============================================

INSERT OR IGNORE INTO difficulty_definitions (id, code, name, description, damage_to_player, damage_from_player, credit_rewards, xp_rewards, permadeath, achievement_eligible) VALUES
('diff-story', 'STORY', 'Story Mode', 'Focus on the narrative, minimal challenge', 0.5, 1.5, 1.0, 1.0, 0, 0),
('diff-easy', 'EASY', 'Easy', 'Casual experience, forgiving combat', 0.75, 1.25, 1.0, 1.0, 0, 1),
('diff-normal', 'NORMAL', 'Normal', 'Balanced challenge, default experience', 1.0, 1.0, 1.0, 1.0, 0, 1),
('diff-hard', 'HARD', 'Hard', 'Increased challenge, smarter enemies', 1.25, 0.85, 1.15, 1.15, 0, 1),
('diff-nightmare', 'NIGHTMARE', 'Nightmare', 'Brutal difficulty, every mistake costs', 1.5, 0.7, 1.3, 1.3, 0, 1),
('diff-ironman', 'IRONMAN', 'Ironman', 'One life, one save, total commitment', 1.0, 1.0, 1.5, 1.5, 1, 1);

-- ============================================
-- BODY LOCATIONS
-- ============================================

INSERT OR IGNORE INTO body_locations (id, code, name, augment_slots, critical_organ, surgery_risk_base) VALUES
('body-head', 'HEAD', 'Head', 2, 1, 30),
('body-brain', 'BRAIN', 'Brain', 3, 1, 50),
('body-eyes', 'EYES', 'Eyes', 2, 0, 20),
('body-ears', 'EARS', 'Ears', 2, 0, 10),
('body-spine', 'SPINE', 'Spine', 3, 1, 40),
('body-torso', 'TORSO', 'Torso', 4, 1, 25),
('body-heart', 'HEART', 'Heart', 1, 1, 60),
('body-arms', 'ARMS', 'Arms', 4, 0, 15),
('body-hands', 'HANDS', 'Hands', 2, 0, 10),
('body-legs', 'LEGS', 'Legs', 4, 0, 15),
('body-skin', 'SKIN', 'Skin', 2, 0, 15),
('body-nervous', 'NERVOUS_SYSTEM', 'Nervous System', 2, 1, 45);

-- ============================================
-- AUGMENT MANUFACTURERS
-- ============================================

INSERT OR IGNORE INTO augment_manufacturers (id, code, name, tagline, quality_rating, ethics_rating, price_tier, primary_category, is_corporate_approved) VALUES
('mfr-kiroshi', 'KIROSHI', 'Kiroshi Optics', 'See Everything', 90, 70, 4, 'SENSORY', 1),
('mfr-dynalar', 'DYNALAR', 'Dynalar Technologies', 'Move Beyond Limits', 85, 60, 4, 'SKELETAL', 1),
('mfr-biosig', 'BIOSIG', 'BioTech Sigma', 'Think Faster', 95, 50, 5, 'NEURAL', 1),
('mfr-militech', 'MILITECH', 'Militech Cybernetics', 'Superior Firepower', 85, 30, 4, 'MUSCULAR', 1),
('mfr-zetatech', 'ZETATECH', 'Zetatech Industries', 'Chrome for Everyone', 50, 40, 1, 'INTERFACE', 1),
('mfr-raven', 'RAVEN', 'Raven Microcybernetics', 'Unseen, Unheard', 80, 45, 4, 'NEURAL', 1),
('mfr-trauma', 'TRAUMA', 'Trauma Team Medical', 'Your Life, Our Priority', 95, 80, 5, 'ORGAN', 1),
('mfr-ghost', 'GHOST', 'Ghost Circuit', 'Off the Grid', 60, 10, 2, 'INTERFACE', 0),
('mfr-collective', 'COLLECTIVE', 'Collective Flesh', 'Embrace the Change', 40, 5, 3, 'EXPERIMENTAL', 0);

-- ============================================
-- WEATHER CONDITIONS
-- ============================================

INSERT OR IGNORE INTO weather_conditions (id, code, name, severity, is_hazardous, visibility_modifier, speed_modifier) VALUES
('weather-clear', 'CLEAR', 'Clear', 1, 0, 1.0, 1.0),
('weather-cloudy', 'CLOUDY', 'Cloudy', 1, 0, 0.95, 1.0),
('weather-fog', 'FOG', 'Fog', 2, 0, 0.5, 0.8),
('weather-rain-light', 'RAIN_LIGHT', 'Light Rain', 2, 0, 0.8, 0.9),
('weather-rain-heavy', 'RAIN_HEAVY', 'Heavy Rain', 3, 0, 0.6, 0.7),
('weather-thunderstorm', 'THUNDERSTORM', 'Thunderstorm', 4, 1, 0.4, 0.6),
('weather-smog', 'SMOG_HEAVY', 'Heavy Smog', 3, 1, 0.3, 0.8),
('weather-acid-rain', 'ACID_RAIN', 'Acid Rain', 4, 1, 0.7, 0.8),
('weather-em-storm', 'EM_STORM', 'Electromagnetic Storm', 5, 1, 0.9, 1.0);

-- ============================================
-- DAMAGE TYPES
-- ============================================

INSERT OR IGNORE INTO damage_type_definitions (id, code, name, is_physical, is_energy, armor_effectiveness) VALUES
('dmg-kinetic', 'KIN', 'Kinetic', 1, 0, 1.0),
('dmg-energy', 'ENERGY', 'Energy', 0, 1, 0.7),
('dmg-thermal', 'THERMAL', 'Thermal', 0, 1, 0.6),
('dmg-elec', 'ELEC', 'Electrical', 0, 1, 0.5),
('dmg-chem', 'CHEM', 'Chemical', 0, 0, 0.8),
('dmg-emp', 'EMP', 'EMP', 0, 1, 0.0),
('dmg-sonic', 'SONIC', 'Sonic', 0, 0, 0.4),
('dmg-rad', 'RAD', 'Radiation', 0, 0, 0.3),
('dmg-neural', 'NEURAL', 'Neural', 0, 0, 0.0),
('dmg-bleed', 'BLEED', 'Bleeding', 1, 0, 0.2),
('dmg-true', 'TRUE', 'True', 0, 0, 0.0);

-- ============================================
-- COMMON CONDITIONS
-- ============================================

INSERT OR IGNORE INTO condition_definitions (id, code, name, condition_type, severity, is_positive, default_duration_seconds) VALUES
('cond-stunned', 'STUNNED', 'Stunned', 'CROWD_CONTROL', 3, 0, 6),
('cond-suppressed', 'SUPPRESSED', 'Suppressed', 'DEBUFF', 2, 0, 12),
('cond-bleeding', 'BLEEDING', 'Bleeding', 'DOT', 2, 0, 30),
('cond-burning', 'BURNING', 'Burning', 'DOT', 3, 0, 12),
('cond-poisoned', 'POISONED', 'Poisoned', 'DOT', 2, 0, 60),
('cond-slowed', 'SLOWED', 'Slowed', 'MOVEMENT_IMPAIR', 2, 0, 15),
('cond-immobilized', 'IMMOBILIZED', 'Immobilized', 'MOVEMENT_IMPAIR', 4, 0, 6),
('cond-blind', 'BLIND', 'Blinded', 'DEBUFF', 4, 0, 10),
('cond-panicked', 'PANICKED', 'Panicked', 'MENTAL', 3, 0, 15),
('cond-enraged', 'ENRAGED', 'Enraged', 'MENTAL', 2, 0, 20),
('cond-withdrawal', 'WITHDRAWAL', 'Withdrawal', 'ADDICTION', 3, 0, 3600);
