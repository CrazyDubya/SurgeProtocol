# SURGE PROTOCOL: Complete Data Architecture

## Part 3: Skills, Abilities & Equipment

-----

# 5. SKILLS & ABILITIES

## 5.1 Skill Definitions

```sql
TABLE: skill_definitions
├── id: UUID [PK]
├── code: VARCHAR(30) [UNIQUE]
├── name: VARCHAR(50)
├── description: TEXT
├── governing_attribute_id: FK -> attribute_definitions
├── category: ENUM(skill_category)
│
├── ## PROGRESSION
├── max_level: INT [default 10]
├── xp_per_level: JSONB
├── training_available: BOOLEAN
├── requires_teacher: BOOLEAN
│
├── ## REQUIREMENTS
├── prerequisite_skills: JSONB
├── required_tier: INT
├── required_track: FK -> tracks
│
├── ## MECHANICS
├── check_difficulty_base: INT
├── critical_success_threshold: INT
├── critical_failure_threshold: INT
├── can_assist: BOOLEAN
├── can_retry: BOOLEAN
├── retry_penalty: INT
│
├── ## SPECIALIZATIONS
├── has_specializations: BOOLEAN
└── specialization_definitions: JSONB
```

### SEED: Skill Definitions

#### COMBAT SKILLS

|Code    |Name        |Attribute|Description              |
|--------|------------|---------|-------------------------|
|FIREARMS|Firearms    |VEL      |Ranged weapon proficiency|
|MELEE   |Melee Combat|PWR      |Close combat with weapons|
|BRAWLING|Brawling    |PWR      |Unarmed combat           |
|EVASION |Evasion     |AGI      |Dodging attacks          |
|TACTICS |Tactics     |INT      |Combat planning          |

#### MOVEMENT SKILLS

|Code      |Name      |Attribute|Description               |
|----------|----------|---------|--------------------------|
|ATHLETICS |Athletics |END      |Running, jumping, climbing|
|ACROBATICS|Acrobatics|AGI      |Parkour, tumbling         |
|STEALTH   |Stealth   |AGI      |Moving unseen             |
|DRIVING   |Driving   |VEL      |Ground vehicles           |
|PILOTING  |Piloting  |VEL      |Aircraft/drones           |

#### TECHNICAL SKILLS

|Code       |Name       |Attribute|Description              |
|-----------|-----------|---------|-------------------------|
|HACKING    |Hacking    |INT      |Network intrusion        |
|ELECTRONICS|Electronics|INT      |Devices, systems         |
|MECHANICS  |Mechanics  |INT      |Vehicles, machines       |
|CYBERTECH  |Cybertech  |INT      |Augment install/repair   |
|SECURITY   |Security   |PRC      |Physical security systems|

#### SOCIAL SKILLS

|Code         |Name        |Attribute|Description        |
|-------------|------------|---------|-------------------|
|PERSUASION   |Persuasion  |PRE      |Convincing others  |
|DECEPTION    |Deception   |PRE      |Lying, misdirection|
|INTIMIDATION |Intimidation|PRE      |Threatening        |
|EMPATHY_SKILL|Empathy     |EMP      |Reading emotions   |
|STREETWISE   |Streetwise  |EMP      |Criminal underworld|
|ETIQUETTE    |Etiquette   |EMP      |Social navigation  |
|NEGOTIATION  |Negotiation |PRE      |Deal-making        |

#### KNOWLEDGE SKILLS

|Code      |Name               |Attribute|Description                 |
|----------|-------------------|---------|----------------------------|
|CORPORATE |Corporate Knowledge|INT      |Corp culture, politics      |
|MEDICAL   |Medical            |INT      |Medicine, first aid         |
|SCIENCE   |Science            |INT      |General scientific knowledge|
|LOCAL_AREA|Local Area         |PRC      |Geography, routes           |
|LAW       |Law                |INT      |Legal knowledge             |

#### VEHICLE SKILLS

|Code       |Name          |Attribute|Description              |
|-----------|--------------|---------|-------------------------|
|BIKE       |Bikes         |AGI      |Motorcycles, e-bikes     |
|CAR        |Cars          |VEL      |Standard vehicles        |
|TRUCK      |Trucks        |VEL      |Large vehicles           |
|VTOL       |VTOL          |INT      |Vertical takeoff aircraft|
|DRONE_PILOT|Drone Piloting|INT      |Remote drone operation   |

#### CRAFT SKILLS

|Code       |Name       |Attribute|Description      |
|-----------|-----------|---------|-----------------|
|FABRICATION|Fabrication|INT      |Making things    |
|JURY_RIG   |Jury-Rig   |RSN      |Emergency repairs|

## 5.2 Character Skills

```sql
TABLE: character_skills
├── id: UUID [PK]
├── character_id: FK -> characters
├── skill_id: FK -> skill_definitions
│
├── ## LEVEL
├── current_level: INT
├── current_xp: INT
├── xp_to_next_level: INT
│
├── ## MODIFIERS
├── bonus_from_augments: INT
├── bonus_from_items: INT
├── temporary_bonus: INT
├── temporary_penalty: INT
│
├── ## TRACKING
├── times_used: INT
├── successes: INT
├── failures: INT
├── critical_successes: INT
├── critical_failures: INT
├── last_used: TIMESTAMP
│
├── ## SPECIALIZATIONS
├── specializations_unlocked: JSONB
└── specialization_levels: JSONB
```

## 5.3 Ability Definitions

```sql
TABLE: ability_definitions
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(50)
├── description: TEXT
├── detailed_description: TEXT
├── flavor_text: TEXT
│
├── ## CLASSIFICATION
├── ability_type: ENUM(ability_type)
├── category: ENUM(ability_category)
├── is_signature: BOOLEAN
├── is_ultimate: BOOLEAN
│
├── ## SOURCE
├── source_type: ENUM(ability_source_type)
├── source_track_id: FK -> tracks
├── source_specialization_id: FK -> specializations
├── source_augment_id: FK -> augment_definitions
├── source_item_id: FK -> item_definitions
│
├── ## REQUIREMENTS
├── required_tier: INT
├── required_level: INT
├── prerequisite_abilities: JSONB
├── required_attributes: JSONB
├── required_skills: JSONB
│
├── ## COSTS
├── resource_cost: JSONB
├── cooldown_seconds: INT
├── charges: INT
├── charge_recovery: VARCHAR(100)
├── humanity_cost: INT
│
├── ## ACTIVATION
├── activation_type: ENUM(activation_type)
├── activation_time: VARCHAR(50)
├── range: VARCHAR(50)
├── area_of_effect: JSONB
├── duration: VARCHAR(50)
├── concentration_required: BOOLEAN
│
├── ## EFFECTS
├── primary_effect: JSONB
├── secondary_effects: JSONB
├── scaling: JSONB
├── synergies: JSONB
│
├── ## UPGRADES
├── has_ranks: BOOLEAN
├── max_rank: INT
├── rank_effects: JSONB
└── upgrade_cost: JSONB
```

### SEED: Signature Abilities by Specialization

|Spec          |Ability             |Description                                 |
|--------------|--------------------|--------------------------------------------|
|Slipstream    |Ghost Lane          |Tap traffic control to create gaps          |
|Parkour Vector|Vertical Escape     |Building-to-building traversal              |
|Pilot         |Swarm Carry         |Coordinate drones to lift you over obstacles|
|Bulwark       |Fortress Protocol   |Immobile but near-invulnerable lockdown     |
|Shepherd      |Threat Radius       |Feel danger to protectee before it manifests|
|Hazmat        |Containment         |Internal compartments for hazardous cargo   |
|Phantom       |Nobody              |Erase yourself from all networked systems   |
|Spider        |Web                 |Leave dormant access points everywhere      |
|Oracle        |Probability Storm   |Model outcomes in real-time                 |
|Broker        |Terms & Conditions  |Implant subconscious contract compliance    |
|Mask          |Skinwalk            |Become someone else completely              |
|Handler       |Loyalty Protocol    |Build genuine (or induced) loyalty          |
|Swarm Lord    |Distributed Presence|Experience world through dozens of nodes    |
|Centaur       |Full Integration    |Vehicle IS your body                        |
|Fabricator    |Jury-Rig            |Build functional tech from scrap            |

## 5.4 Character Abilities

```sql
TABLE: character_abilities
├── id: UUID [PK]
├── character_id: FK -> characters
├── ability_id: FK -> ability_definitions
├── acquired_at: TIMESTAMP
│
├── ## STATE
├── is_unlocked: BOOLEAN
├── is_equipped: BOOLEAN
├── current_rank: INT
├── current_charges: INT
├── cooldown_remaining: DECIMAL(10,3)
├── is_on_cooldown: BOOLEAN
│
├── ## MODIFICATIONS
├── custom_name: VARCHAR(50)
├── modifier_augments: JSONB
├── modifier_items: JSONB
├── effectiveness_multiplier: DECIMAL(3,2)
│
├── ## TRACKING
├── times_used: INT
├── successful_uses: INT
├── damage_dealt_total: INT
├── targets_affected_total: INT
├── last_used: TIMESTAMP
│
├── ## XP
├── xp_invested: INT
└── xp_to_next_rank: INT
```

## 5.5 Passive Definitions

```sql
TABLE: passive_definitions
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(50)
├── description: TEXT
│
├── ## SOURCE
├── source_type: ENUM(ability_source_type)
├── source_id: UUID
│
├── ## REQUIREMENTS
├── required_tier: INT
├── prerequisite_passives: JSONB
├── required_condition: VARCHAR(200)
│
├── ## EFFECTS
├── effect_type: ENUM(passive_effect_type)
├── effect_target: VARCHAR(50)
├── effect_value: DECIMAL(10,3)
├── effect_is_percentage: BOOLEAN
├── stacks: BOOLEAN
├── max_stacks: INT
│
├── ## TRIGGERING
├── trigger_condition: VARCHAR(200)
├── trigger_chance: DECIMAL(5,4)
├── internal_cooldown: INT
│
├── ## META
├── is_hidden: BOOLEAN
├── conflicts_with: JSONB
└── synergizes_with: JSONB
```

-----

# 6. EQUIPMENT & GEAR

## 6.1 Item Definitions

```sql
TABLE: item_definitions
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
├── description: TEXT
├── flavor_text: TEXT
├── manufacturer: VARCHAR(100)
│
├── ## CLASSIFICATION
├── item_type: ENUM(item_type)
├── item_subtype: VARCHAR(50)
├── rarity: ENUM(rarity)
├── quality_tier: INT [1-5]
├── is_unique: BOOLEAN
├── is_quest_item: BOOLEAN
├── is_illegal: BOOLEAN
├── illegality_level: INT [0-5]
│
├── ## PHYSICAL
├── weight_kg: DECIMAL(8,3)
├── size_category: ENUM(size_category)
├── dimensions_cm: JSONB
├── is_foldable: BOOLEAN
├── folded_dimensions_cm: JSONB
│
├── ## REQUIREMENTS
├── required_tier: INT
├── required_attributes: JSONB
├── required_skills: JSONB
├── required_augments: JSONB
├── required_license: VARCHAR(50)
│
├── ## ECONOMY
├── base_price: INT
├── street_price_modifier: DECIMAL(3,2)
├── black_market_price_modifier: DECIMAL(3,2)
├── is_fenceable: BOOLEAN
├── fence_value_modifier: DECIMAL(3,2)
│
├── ## INVENTORY
├── max_stack_size: INT
├── is_consumable: BOOLEAN
├── is_equippable: BOOLEAN
├── equipment_slot: ENUM(equipment_slot)
├── quick_slot_eligible: BOOLEAN
│
├── ## DURABILITY
├── has_durability: BOOLEAN
├── max_durability: INT
├── repair_skill: FK -> skill_definitions
├── repair_difficulty: INT
├── repair_cost_base: INT
│
├── ## EFFECTS
├── passive_effects: JSONB
├── use_effects: JSONB
├── equip_effects: JSONB
│
├── ## CRAFTING
├── is_craftable: BOOLEAN
├── recipe_id: FK -> recipes
├── is_component: BOOLEAN
└── component_categories: JSONB
```

## 6.2 Weapon Definitions

```sql
TABLE: weapon_definitions
├── id: UUID [PK]
├── item_id: FK -> item_definitions [UNIQUE]
│
├── ## CLASSIFICATION
├── weapon_class: ENUM(weapon_class)
├── weapon_type: ENUM(weapon_type)
├── damage_type: ENUM(damage_type)
├── is_melee: BOOLEAN
├── is_ranged: BOOLEAN
├── is_throwable: BOOLEAN
├── is_smart_weapon: BOOLEAN
├── is_tech_weapon: BOOLEAN
│
├── ## DAMAGE
├── base_damage_dice: VARCHAR(20)
├── base_damage_flat: INT
├── damage_scaling_attribute: FK -> attribute_definitions
├── damage_scaling_factor: DECIMAL(3,2)
├── critical_multiplier: DECIMAL(3,2)
├── critical_threshold: INT
├── armor_penetration: INT
│
├── ## RANGE
├── range_short_m: INT
├── range_medium_m: INT
├── range_long_m: INT
├── range_penalty_medium: INT
├── range_penalty_long: INT
│
├── ## RATE OF FIRE
├── fire_modes: JSONB
├── rate_of_fire: INT
├── burst_size: INT
├── auto_damage_bonus: INT
│
├── ## AMMUNITION
├── ammo_type: ENUM(ammo_type)
├── magazine_size: INT
├── reload_time_actions: INT
├── chambered_round: BOOLEAN
│
├── ## HANDLING
├── accuracy_modifier: INT
├── recoil: INT
├── handling_speed: INT
├── required_hands: INT [1 or 2]
├── required_strength: INT
│
├── ## ATTACHMENTS
├── attachment_slots: JSONB
├── integrated_attachments: JSONB
│
├── ## SPECIAL
├── special_properties: JSONB
├── smart_link_compatible: BOOLEAN
├── tech_charge_shots: INT
└── unique_mechanics: TEXT
```

## 6.3 Armor Definitions

```sql
TABLE: armor_definitions
├── id: UUID [PK]
├── item_id: FK -> item_definitions [UNIQUE]
│
├── ## PROTECTION
├── armor_value: INT
├── damage_reduction_flat: INT
├── damage_reduction_percent: DECIMAL(5,4)
├── damage_type_resistances: JSONB
├── damage_type_weaknesses: JSONB
│
├── ## COVERAGE
├── body_locations_covered: JSONB
├── coverage_percentage: INT [0-100]
├── vital_protection: BOOLEAN
│
├── ## MOBILITY IMPACT
├── speed_penalty: DECIMAL(3,2)
├── agility_penalty: INT
├── noise_level: INT
├── swim_penalty: DECIMAL(3,2)
│
├── ## PROPERTIES
├── is_powered: BOOLEAN
├── power_consumption: INT
├── environmental_protection: JSONB
├── special_properties: JSONB
│
├── ## STYLE
├── armor_style: ENUM(armor_style)
├── concealment: INT [0-100]
├── intimidation_bonus: INT
└── fashion_rating: INT
```

## 6.4 Character Inventory

```sql
TABLE: character_inventory
├── id: UUID [PK]
├── character_id: FK -> characters
├── item_definition_id: FK -> item_definitions
├── acquired_at: TIMESTAMP
│
├── ## LOCATION
├── storage_location: ENUM(storage_location)
├── container_id: FK -> character_inventory
├── equipped_slot: ENUM(equipment_slot)
├── quick_slot: INT [1-8]
│
├── ## QUANTITY
├── quantity: INT
├── is_stack: BOOLEAN
│
├── ## STATE
├── current_durability: INT
├── current_charges: INT
├── current_ammo: INT
├── is_damaged: BOOLEAN
├── is_broken: BOOLEAN
├── is_jammed: BOOLEAN
│
├── ## CUSTOMIZATION
├── custom_name: VARCHAR(100)
├── custom_description: TEXT
├── cosmetic_skin: VARCHAR(50)
├── attachments: JSONB
├── modifications: JSONB
│
├── ## PROVENANCE
├── acquired_from: ENUM(acquisition_source)
├── acquired_from_id: UUID
├── original_owner: VARCHAR(100)
├── is_stolen: BOOLEAN
├── is_contraband: BOOLEAN
│
├── ## TRACKING
├── times_used: INT
├── kills_with: INT
├── damage_dealt: INT
│
├── ## FLAGS
├── is_favorite: BOOLEAN
├── is_locked: BOOLEAN
├── is_quest_item: BOOLEAN
└── sort_order: INT
```

## 6.5 Consumable Definitions

```sql
TABLE: consumable_definitions
├── id: UUID [PK]
├── item_id: FK -> item_definitions [UNIQUE]
│
├── ## TYPE
├── consumable_type: ENUM(consumable_type)
├── consumption_method: ENUM(consumption_method)
├── consumption_time_seconds: INT
│
├── ## EFFECTS
├── immediate_effects: JSONB
├── over_time_effects: JSONB
├── effect_duration_seconds: INT
├── stacks_with_self: BOOLEAN
├── max_stacks: INT
│
├── ## ADDICTION
├── addiction_type: FK -> addiction_types
├── addiction_risk: DECIMAL(5,4)
├── addiction_severity_increase: DECIMAL(5,4)
│
├── ## OVERDOSE
├── overdose_threshold: INT
├── overdose_effects: JSONB
├── overdose_time_window_hours: INT
│
├── ## DETECTION
├── detectable_in_blood: BOOLEAN
├── detection_window_hours: INT
├── is_illegal: BOOLEAN
└── illegality_varies_by_location: BOOLEAN
```

-----

# 7. VEHICLES

## 7.1 Vehicle Definitions

```sql
TABLE: vehicle_definitions
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
├── manufacturer: VARCHAR(100)
├── model_year: INT
├── description: TEXT
│
├── ## CLASSIFICATION
├── vehicle_class: ENUM(vehicle_class)
├── vehicle_type: ENUM(vehicle_type)
├── size_category: ENUM(vehicle_size)
├── rarity: ENUM(rarity)
│
├── ## PERFORMANCE
├── top_speed_kmh: INT
├── acceleration_0_100_seconds: DECIMAL(4,2)
├── handling_rating: INT [1-100]
├── braking_rating: INT [1-100]
├── offroad_capability: INT [0-100]
│
├── ## DURABILITY
├── max_hull_points: INT
├── armor_rating: INT
├── damage_resistances: JSONB
│
├── ## CAPACITY
├── passenger_capacity: INT
├── cargo_capacity_kg: DECIMAL(8,2)
├── cargo_volume_liters: DECIMAL(8,2)
├── towing_capacity_kg: DECIMAL(8,2)
│
├── ## POWER
├── power_source: ENUM(power_source_type)
├── fuel_capacity: DECIMAL(6,2)
├── fuel_consumption_per_km: DECIMAL(6,4)
├── range_km: INT
├── recharge_time_hours: DECIMAL(4,2)
│
├── ## REQUIREMENTS
├── required_tier: INT
├── required_skill: FK -> skill_definitions
├── required_skill_level: INT
├── license_required: VARCHAR(50)
│
├── ## ECONOMY
├── base_price: INT
├── insurance_cost_monthly: INT
├── maintenance_cost_monthly: INT
│
├── ## FEATURES
├── autopilot_level: INT [0-5]
├── network_connected: BOOLEAN
├── stealth_capable: BOOLEAN
├── centaur_compatible: BOOLEAN
└── neural_interface_required: BOOLEAN
```

## 7.2 Character Vehicles

```sql
TABLE: character_vehicles
├── id: UUID [PK]
├── character_id: FK -> characters
├── vehicle_definition_id: FK -> vehicle_definitions
├── acquired_at: TIMESTAMP
│
├── ## IDENTITY
├── custom_name: VARCHAR(100)
├── license_plate: VARCHAR(20)
├── vin: VARCHAR(50)
├── is_registered: BOOLEAN
│
├── ## STATE
├── current_location_id: FK -> locations
├── current_coordinates: POINT
├── current_hull_points: INT
├── current_fuel: DECIMAL(6,2)
├── odometer_km: DECIMAL(10,2)
├── is_damaged: BOOLEAN
│
├── ## CUSTOMIZATION
├── paint_color_primary: VARCHAR(7)
├── paint_color_secondary: VARCHAR(7)
├── installed_mods: JSONB
│
├── ## OWNERSHIP
├── ownership_type: ENUM(ownership_type)
├── owned_outright: BOOLEAN
├── loan_id: FK -> debts
├── insured: BOOLEAN
│
├── ## CORPORATE
├── corporate_issued: BOOLEAN
├── corporate_tracked: BOOLEAN
├── transponder_disabled: BOOLEAN
│
├── ## TRACKING
├── total_deliveries: INT
├── total_distance_km: DECIMAL(12,2)
└── accidents: INT
```

-----

# 8. DRONES

## 8.1 Drone Definitions

```sql
TABLE: drone_definitions
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
├── manufacturer: VARCHAR(100)
├── description: TEXT
│
├── ## CLASSIFICATION
├── drone_class: ENUM(drone_class)
├── drone_role: ENUM(drone_role)
├── size_category: ENUM(drone_size)
├── rarity: ENUM(rarity)
│
├── ## PERFORMANCE
├── max_speed_kmh: INT
├── acceleration: INT [1-100]
├── maneuverability: INT [1-100]
├── hover_capable: BOOLEAN
├── max_altitude_m: INT
├── noise_level: INT [1-100]
│
├── ## DURABILITY
├── max_hull_points: INT
├── armor_rating: INT
├── emp_resistance: INT [0-100]
│
├── ## POWER
├── battery_capacity_minutes: INT
├── recharge_time_minutes: INT
├── solar_capable: BOOLEAN
│
├── ## PAYLOAD
├── max_payload_kg: DECIMAL(6,3)
├── cargo_volume_liters: DECIMAL(6,3)
├── weapon_mounts: INT
├── tool_mounts: INT
│
├── ## SENSORS
├── sensor_suite: JSONB
├── stealth_detection: INT [0-100]
├── targeting_accuracy: INT [0-100]
│
├── ## CONTROL
├── autonomous_level: INT [0-5]
├── control_range_km: DECIMAL(6,2)
├── requires_neural_link: BOOLEAN
├── swarm_compatible: BOOLEAN
├── max_swarm_size: INT
│
├── ## REQUIREMENTS
├── required_tier: INT
├── required_track: FK -> tracks
├── required_skill: FK -> skill_definitions
└── required_skill_level: INT
```

## 8.2 Character Drones

```sql
TABLE: character_drones
├── id: UUID [PK]
├── character_id: FK -> characters
├── drone_definition_id: FK -> drone_definitions
├── acquired_at: TIMESTAMP
│
├── ## IDENTITY
├── custom_name: VARCHAR(100)
├── serial_number: VARCHAR(50)
├── paint_scheme: JSONB
│
├── ## STATE
├── current_state: ENUM(drone_state)
├── current_location_id: FK -> locations
├── current_coordinates: POINT
├── altitude_m: INT
├── current_hull_points: INT
├── current_battery: INT [0-100]
├── is_deployed: BOOLEAN
├── is_autonomous: BOOLEAN
│
├── ## LOADOUT
├── equipped_weapons: JSONB
├── equipped_tools: JSONB
├── current_cargo: JSONB
│
├── ## SWARM
├── swarm_id: FK -> drone_swarms
├── swarm_role: VARCHAR(30)
├── formation_position: INT
│
├── ## TRACKING
├── total_flight_hours: DECIMAL(10,2)
├── total_missions: INT
├── successful_missions: INT
└── times_destroyed: INT
```

## 8.3 Drone Swarms

```sql
TABLE: drone_swarms
├── id: UUID [PK]
├── character_id: FK -> characters
├── name: VARCHAR(100)
│
├── ## COMPOSITION
├── swarm_type: ENUM(swarm_type)
├── max_size: INT
├── current_size: INT
├── homogeneous: BOOLEAN
│
├── ## STATE
├── current_state: ENUM(swarm_state)
├── current_formation: ENUM(swarm_formation)
├── center_coordinates: POINT
├── formation_radius_m: DECIMAL(6,2)
│
├── ## BEHAVIOR
├── current_behavior: ENUM(swarm_behavior)
├── target_id: UUID
├── target_type: VARCHAR(30)
│
├── ## BONUSES
├── coordination_bonus: INT
├── sensor_coverage_bonus: INT
├── intimidation_factor: INT
│
├── ## PERFORMANCE
├── effective_speed: INT
├── effective_range: INT
└── sync_quality: INT [0-100]
```
