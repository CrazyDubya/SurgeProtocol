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
