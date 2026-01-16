# SURGE PROTOCOL: Complete Data Architecture

## Part 4: Missions, World, NPCs & Factions

-----

# 9. MISSION & DELIVERY SYSTEM

## 9.1 Mission Definitions

```sql
TABLE: mission_definitions
├── id: UUID [PK]
├── code: VARCHAR(50)
├── name: VARCHAR(200)
├── description: TEXT
├── briefing_text: TEXT
├── debrief_success_text: TEXT
├── debrief_failure_text: TEXT
│
├── ## CLASSIFICATION
├── mission_type: ENUM(mission_type)
├── mission_category: ENUM(mission_category)
├── difficulty_rating: INT [1-10]
├── tier_requirement: INT
├── is_story_mission: BOOLEAN
├── is_repeatable: BOOLEAN
├── is_procedural: BOOLEAN
│
├── ## SOURCE
├── source_type: ENUM(mission_source)
├── source_faction_id: FK -> factions
├── source_npc_id: FK -> npcs
├── source_location_id: FK -> locations
│
├── ## LOCATION
├── origin_location_id: FK -> locations
├── destination_location_id: FK -> locations
├── waypoint_locations: JSONB
├── location_constraints: JSONB
│
├── ## TIME
├── time_limit_minutes: INT
├── optimal_time_minutes: INT
├── window_start_time: TIME
├── window_end_time: TIME
├── window_days: JSONB
│
├── ## CARGO
├── cargo_type: ENUM(cargo_type)
├── cargo_item_id: FK -> item_definitions
├── cargo_weight_kg: DECIMAL(8,3)
├── cargo_fragility: INT [0-100]
├── cargo_perishable: BOOLEAN
├── cargo_hazardous: BOOLEAN
├── cargo_illegal: BOOLEAN
├── cargo_value: INT
│
├── ## REQUIREMENTS
├── required_track: FK -> tracks
├── required_specialization: FK -> specializations
├── required_skills: JSONB
├── required_equipment: JSONB
├── required_vehicle_class: ENUM(vehicle_class)
├── required_reputation: JSONB
├── prerequisite_missions: JSONB
│
├── ## REWARDS
├── base_pay: INT
├── time_bonus_per_minute: INT
├── xp_reward: INT
├── rating_reward: DECIMAL(5,4)
├── reputation_rewards: JSONB
├── item_rewards: JSONB
│
├── ## PENALTIES
├── failure_rating_penalty: DECIMAL(5,4)
├── failure_reputation_penalty: JSONB
├── late_penalty_per_minute: INT
├── damage_penalty_per_percent: INT
│
├── ## COMPLICATIONS
├── possible_complications: JSONB
├── guaranteed_complications: JSONB
├── complication_scaling: DECIMAL(3,2)
│
├── ## FLAGS
├── affects_main_story: BOOLEAN
├── point_of_no_return: BOOLEAN
├── algorithm_assigns: BOOLEAN
└── hidden_until_discovered: BOOLEAN
```

### SEED: Mission Types

|Type              |Description                  |Tier Range|
|------------------|-----------------------------|----------|
|DELIVERY_STANDARD |Basic A-to-B delivery        |1-10      |
|DELIVERY_EXPRESS  |Time-critical delivery       |2-10      |
|DELIVERY_FRAGILE  |Damage-sensitive cargo       |2-10      |
|DELIVERY_HAZMAT   |Dangerous materials          |4-10      |
|DELIVERY_COVERT   |Illegal/secret cargo         |5-10      |
|DELIVERY_CONTESTED|Someone wants to stop you    |6-10      |
|ESCORT_PERSON     |VIP protection transport     |4-10      |
|ESCORT_VEHICLE    |Convoy protection            |5-10      |
|EXTRACTION        |Remove person from location  |6-10      |
|INSERTION         |Place person in location     |6-10      |
|DATA_TRANSFER     |Digital/physical data courier|3-10      |
|DEAD_DROP         |Leave package, no recipient  |4-10      |
|INTERCEPTION      |Stop another delivery        |7-10      |
|SURVEILLANCE      |Watch and report             |5-10      |

### SEED: Cargo Types

|Type           |Description           |Special Requirements    |
|---------------|----------------------|------------------------|
|PACKAGE_SMALL  |Fits in pocket        |None                    |
|PACKAGE_MEDIUM |Backpack size         |None                    |
|PACKAGE_LARGE  |Needs vehicle         |Vehicle                 |
|FOOD_HOT       |Temperature sensitive |Thermal container       |
|FOOD_FROZEN    |Must stay frozen      |Cryo container          |
|MEDICAL_URGENT |Time-critical medicine|Speed                   |
|BIOLOGICALS    |Organs, tissue        |Medical cert            |
|ORGAN_TRANSPORT|Living organ in donor |Medical, Ethics decision|
|WEAPONS        |Firearms, explosives  |License or risk         |
|CONTRABAND     |Illegal goods         |Stealth, Black market   |
|PERSON_VIP     |Important passenger   |Protection              |
|PERSON_COVERT  |Hidden passenger      |Stealth                 |
|UNKNOWN_SEALED |Contents unknown      |Curiosity…              |

## 9.2 Mission Objectives

```sql
TABLE: mission_objectives
├── id: UUID [PK]
├── mission_definition_id: FK -> mission_definitions
├── sequence_order: INT
│
├── ## DESCRIPTION
├── title: VARCHAR(100)
├── description: TEXT
├── hint_text: TEXT
├── completion_text: TEXT
│
├── ## TYPE
├── objective_type: ENUM(objective_type)
├── is_optional: BOOLEAN
├── is_hidden: BOOLEAN
├── is_bonus: BOOLEAN
│
├── ## TARGET
├── target_location_id: FK -> locations
├── target_npc_id: FK -> npcs
├── target_item_id: FK -> item_definitions
├── target_coordinates: POINT
├── target_quantity: INT
│
├── ## CONDITIONS
├── completion_conditions: JSONB
├── failure_conditions: JSONB
├── time_limit_seconds: INT
│
├── ## REWARDS
├── completion_xp: INT
├── completion_creds: INT
├── completion_items: JSONB
│
├── ## BRANCHING
├── leads_to_objectives: JSONB
└── mutually_exclusive_with: JSONB
```

## 9.3 Mission Complications

```sql
TABLE: complication_definitions
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
├── description: TEXT
├── announcement_text: TEXT
│
├── ## CLASSIFICATION
├── complication_type: ENUM(complication_type)
├── severity: INT [1-5]
├── is_combat: BOOLEAN
├── is_timed: BOOLEAN
│
├── ## TRIGGERS
├── trigger_condition: VARCHAR(500)
├── trigger_chance_base: DECIMAL(5,4)
├── trigger_chance_modifiers: JSONB
├── min_tier: INT
├── max_tier: INT
│
├── ## EFFECTS
├── effects_on_trigger: JSONB
├── effects_on_resolve: JSONB
├── effects_on_fail: JSONB
├── time_limit_seconds: INT
│
├── ## RESOLUTION
├── resolution_options: JSONB
├── can_be_prevented: BOOLEAN
├── prevention_methods: JSONB
│
├── ## IMPACT
├── rating_penalty_unresolved: DECIMAL(5,4)
├── cargo_damage_risk: INT [0-100]
├── time_penalty_minutes: INT
└── combat_encounter_id: FK -> combat_encounters
```

### SEED: Complication Types

|Type               |Example                |Severity Range|
|-------------------|-----------------------|--------------|
|TRAFFIC_HAZARD     |Unexpected congestion  |1-2           |
|WEATHER_EVENT      |Sudden storm           |1-3           |
|VEHICLE_MALFUNCTION|Tire blowout           |2-3           |
|POLICE_ATTENTION   |Random checkpoint      |2-4           |
|GANG_INTERCEPT     |Territory dispute      |3-5           |
|CORPORATE_INTERCEPT|Asset recovery team    |3-5           |
|RIVAL_COURIER      |Competition sabotage   |2-4           |
|CUSTOMER_PROBLEM   |Wrong address, not home|1-2           |
|CARGO_ISSUE        |Package leaking        |2-4           |
|ROUTE_BLOCKED      |Road closed            |1-3           |
|AMBUSH             |Planned attack         |4-5           |
|THEFT_ATTEMPT      |Opportunistic grab     |3-4           |
|MORAL_DILEMMA      |Discover cargo is wrong|2-5           |

## 9.4 Character Missions (Active)

```sql
TABLE: character_missions
├── id: UUID [PK]
├── character_id: FK -> characters
├── mission_definition_id: FK -> mission_definitions
├── accepted_at: TIMESTAMP
│
├── ## STATE
├── status: ENUM(mission_status)
├── current_stage: INT
├── current_objective_id: FK -> mission_objectives
│
├── ## LOCATION
├── actual_origin_id: FK -> locations
├── actual_destination_id: FK -> locations
├── current_waypoint_index: INT
├── current_location_id: FK -> locations
│
├── ## CARGO
├── cargo_item_instance_id: FK -> character_inventory
├── cargo_current_condition: INT [0-100]
├── cargo_temperature: DECIMAL(5,2)
│
├── ## TIME
├── deadline: TIMESTAMP
├── time_remaining_seconds: INT
├── started_travel_at: TIMESTAMP
├── actual_arrival: TIMESTAMP
│
├── ## COMPLICATIONS
├── active_complications: JSONB
├── resolved_complications: JSONB
├── complication_damage: INT
│
├── ## OUTCOME
├── completed_at: TIMESTAMP
├── completion_rating: ENUM(completion_rating)
├── final_pay: INT
├── bonus_earned: INT
├── penalties_incurred: INT
├── xp_earned: INT
├── rating_change: DECIMAL(5,4)
│
├── ## TRACKING
├── distance_traveled_km: DECIMAL(10,3)
├── time_elapsed_seconds: INT
├── fuel_consumed: DECIMAL(8,4)
├── choices_made: JSONB
└── narrative_flags_set: JSONB
```

-----

# 10. WORLD GEOGRAPHY

## 10.1 Regions

```sql
TABLE: regions
├── id: UUID [PK]
├── code: VARCHAR(30) [UNIQUE]
├── name: VARCHAR(100)
├── description: TEXT
├── lore_description: TEXT
│
├── ## GEOGRAPHY
├── parent_region_id: FK -> regions
├── region_type: ENUM(region_type)
├── area_sq_km: DECIMAL(12,3)
├── bounding_box: POLYGON
├── center_coordinates: POINT
│
├── ## GOVERNANCE
├── controlling_faction_id: FK -> factions
├── law_level: INT [0-10]
├── corporate_presence: INT [0-100]
├── police_response_time_minutes: INT
│
├── ## DEMOGRAPHICS
├── population: BIGINT
├── population_density: DECIMAL(10,2)
├── wealth_level: INT [1-10]
├── crime_rate: INT [1-10]
│
├── ## SERVICES
├── network_coverage: INT [0-100]
├── medical_facility_tier: INT [0-5]
├── augment_clinic_tier: INT [0-5]
├── black_market_presence: INT [0-100]
│
├── ## ATMOSPHERE
├── aesthetic_tags: JSONB
├── dominant_culture: VARCHAR(50)
├── ambient_danger_level: INT [1-10]
├── delivery_demand_level: INT [1-10]
│
├── ## GAMEPLAY
├── tier_requirement: INT
├── has_interstitial_access: BOOLEAN
├── restricted_access: BOOLEAN
└── access_requirements: JSONB
```

## 10.2 Locations

```sql
TABLE: locations
├── id: UUID [PK]
├── code: VARCHAR(50)
├── name: VARCHAR(200)
├── description: TEXT
├── flavor_text: TEXT
│
├── ## HIERARCHY
├── region_id: FK -> regions
├── parent_location_id: FK -> locations
├── floor_level: INT
│
├── ## GEOGRAPHY
├── location_type: ENUM(location_type)
├── coordinates: POINT
├── address: VARCHAR(300)
├── entrance_coordinates: JSONB
├── footprint: POLYGON
├── elevation_m: INT
│
├── ## ACCESSIBILITY
├── access_type: ENUM(access_type)
├── tier_requirement: INT
├── faction_requirement: FK -> factions
├── reputation_requirement: INT
├── locked: BOOLEAN
├── lock_difficulty: INT
├── hackable_entrance: BOOLEAN
├── hack_difficulty: INT
│
├── ## INTERIOR
├── is_interior: BOOLEAN
├── has_interior: BOOLEAN
├── interior_size: ENUM(interior_size)
├── sub_locations: JSONB
│
├── ## SERVICES
├── services_offered: JSONB
├── vendor_npcs: JSONB
├── quest_givers: JSONB
├── respawn_point: BOOLEAN
├── fast_travel_point: BOOLEAN
│
├── ## ACTIVITY
├── hours_open: JSONB
├── npc_spawn_data: JSONB
├── ambient_population: INT
│
├── ## CORPORATE
├── owning_corporation: VARCHAR(100)
├── security_level: INT [0-10]
├── surveillance_level: INT [0-10]
│
├── ## INTERSTITIAL
├── interstitial_access_point: BOOLEAN
├── interstitial_connections: JSONB
├── interstitial_tier_required: INT
│
├── ## STATE
├── is_destroyed: BOOLEAN
├── current_owner_faction_id: FK -> factions
├── contested: BOOLEAN
└── lockdown_active: BOOLEAN
```

### SEED: Location Types

|Type                |Description           |Typical Access|
|--------------------|----------------------|--------------|
|DISTRICT            |Major city area       |Public        |
|STREET              |Road/pathway          |Public        |
|BUILDING_RESIDENTIAL|Apartments, housing   |Private       |
|BUILDING_COMMERCIAL |Offices, retail       |Semi-public   |
|BUILDING_CORPORATE  |Corp headquarters     |Restricted    |
|BUILDING_INDUSTRIAL |Factories             |Private       |
|WAREHOUSE           |Storage facilities    |Private       |
|RESTAURANT          |Food service          |Public        |
|BAR                 |Drinking establishment|Public        |
|CLUB                |Entertainment venue   |VIP areas     |
|SHOP_GENERAL        |General store         |Public        |
|SHOP_WEAPONS        |Arms dealer           |Licensed      |
|SHOP_AUGMENTS       |Chrome shop           |Public        |
|CLINIC              |Medical facility      |Public        |
|SAFE_HOUSE          |Hidden refuge         |Faction       |
|GARAGE              |Vehicle storage       |Private       |
|TRANSIT_STATION     |Public transport      |Public        |
|ROOFTOP             |Building top          |Varies        |
|TUNNEL              |Underground passage   |Interstitial  |
|BLACK_MARKET        |Underground commerce  |Criminal      |
|INTERSTITIAL_NODE   |Hidden infrastructure |Tier 5+       |

## 10.3 Routes

```sql
TABLE: routes
├── id: UUID [PK]
├── name: VARCHAR(100)
│
├── ## ENDPOINTS
├── origin_location_id: FK -> locations
├── destination_location_id: FK -> locations
│
├── ## PATH
├── route_type: ENUM(route_type)
├── path_coordinates: LINESTRING
├── waypoints: JSONB
├── distance_km: DECIMAL(8,3)
├── elevation_change_m: INT
│
├── ## REQUIREMENTS
├── required_vehicle_class: ENUM(vehicle_class)
├── required_tier: INT
├── requires_interstitial: BOOLEAN
│
├── ## TIMING
├── base_travel_time_minutes: DECIMAL(8,2)
├── traffic_multipliers: JSONB
├── optimal_hours: JSONB
│
├── ## CONDITIONS
├── surface_type: ENUM(surface_type)
├── quality_rating: INT [1-10]
├── hazard_level: INT [0-10]
├── surveillance_level: INT [0-10]
│
├── ## FEATURES
├── charging_stations: JSONB
├── ambush_points: JSONB
├── is_secret: BOOLEAN
└── discovery_tier: INT
```

-----

# 11. NPC SYSTEM

## 11.1 NPC Definitions

```sql
TABLE: npc_definitions
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
├── title: VARCHAR(100)
├── description: TEXT
├── background: TEXT
│
├── ## CLASSIFICATION
├── npc_type: ENUM(npc_type)
├── npc_category: ENUM(npc_category)
├── is_unique: BOOLEAN
├── is_essential: BOOLEAN
├── is_procedural: BOOLEAN
│
├── ## APPEARANCE
├── gender: VARCHAR(20)
├── age: INT
├── ethnicity: VARCHAR(50)
├── height_cm: INT
├── build: VARCHAR(30)
├── distinguishing_features: TEXT
├── portrait_asset: VARCHAR(200)
│
├── ## PERSONALITY
├── personality_traits: JSONB
├── speech_patterns: JSONB
├── mannerisms: TEXT
├── likes: JSONB
├── dislikes: JSONB
├── goals: JSONB
│
├── ## AFFILIATION
├── faction_id: FK -> factions
├── faction_rank: VARCHAR(50)
├── employer: VARCHAR(100)
├── occupation: VARCHAR(100)
│
├── ## LOCATION
├── home_location_id: FK -> locations
├── work_location_id: FK -> locations
├── hangout_locations: JSONB
├── schedule: JSONB
│
├── ## CAPABILITIES
├── combat_capable: BOOLEAN
├── combat_style: VARCHAR(50)
├── threat_level: INT [1-10]
├── skills: JSONB
├── abilities: JSONB
├── augments: JSONB
├── typical_equipment: JSONB
│
├── ## SERVICES
├── is_vendor: BOOLEAN
├── vendor_inventory_id: FK -> vendor_inventories
├── is_quest_giver: BOOLEAN
├── available_quests: JSONB
├── is_trainer: BOOLEAN
├── trainable_skills: JSONB
│
├── ## DIALOGUE
├── greeting_dialogue_id: FK -> dialogue_trees
├── ambient_dialogue: JSONB
│
├── ## NARRATIVE
├── story_importance: INT [0-100]
├── romance_option: BOOLEAN
├── killable_by_player: BOOLEAN
└── death_consequence: TEXT
```

## 11.2 NPC Instances (Per Save)

```sql
TABLE: npc_instances
├── id: UUID [PK]
├── npc_definition_id: FK -> npc_definitions
├── save_id: FK -> save_games
│
├── ## STATE
├── is_alive: BOOLEAN
├── is_active: BOOLEAN
├── current_health: INT
├── current_location_id: FK -> locations
├── current_activity: VARCHAR(100)
│
├── ## RELATIONSHIP
├── relationship_with_player: INT [-100 to 100]
├── trust_level: INT [0-100]
├── fear_level: INT [0-100]
├── respect_level: INT [0-100]
├── romantic_interest: INT [0-100]
├── times_met: INT
├── last_interaction: TIMESTAMP
│
├── ## DIALOGUE STATE
├── dialogue_flags: JSONB
├── topics_discussed: JSONB
├── secrets_revealed: JSONB
├── favors_owed: JSONB
│
├── ## QUEST STATE
├── quests_given: JSONB
├── quests_completed: JSONB
│
├── ## MEMORY
├── memories_of_player: JSONB
├── witnessed_events: JSONB
├── grudges: JSONB
└── gratitudes: JSONB
```

-----

# 12. FACTION SYSTEM

## 12.1 Faction Definitions

```sql
TABLE: factions
├── id: UUID [PK]
├── code: VARCHAR(30) [UNIQUE]
├── name: VARCHAR(100)
├── short_name: VARCHAR(30)
├── tagline: VARCHAR(200)
├── description: TEXT
├── history: TEXT
├── goals: TEXT
│
├── ## CLASSIFICATION
├── faction_type: ENUM(faction_type)
├── faction_size: ENUM(faction_size)
├── alignment_corporate: INT [-100 to 100]
├── alignment_law: INT [-100 to 100]
├── alignment_violence: INT [-100 to 100]
│
├── ## TERRITORY
├── headquarters_location_id: FK -> locations
├── controlled_regions: JSONB
├── territory_influence: JSONB
│
├── ## RESOURCES
├── financial_power: INT [1-100]
├── military_power: INT [1-100]
├── political_power: INT [1-100]
├── technological_level: INT [1-100]
├── network_capability: INT [1-100]
│
├── ## RELATIONSHIPS
├── allied_factions: JSONB
├── enemy_factions: JSONB
│
├── ## HIERARCHY
├── parent_faction_id: FK -> factions
├── leadership_structure: ENUM(leadership_type)
├── leader_npc_id: FK -> npcs
│
├── ## GAMEPLAY
├── joinable_by_player: BOOLEAN
├── reputation_unlocks: JSONB
├── exclusive_missions: JSONB
├── exclusive_vendors: JSONB
├── exclusive_augments: JSONB
│
├── ## AESTHETICS
├── colors_primary: VARCHAR(7)
├── colors_secondary: VARCHAR(7)
├── symbol_asset: VARCHAR(200)
└── can_be_destroyed: BOOLEAN
```

### SEED: Major Factions

|Code   |Name            |Type         |Alignment       |
|-------|----------------|-------------|----------------|
|OMNI   |Omnideliver     |Megacorp     |Corp+100, Law+50|
|NTWORK |The Network     |AI Collective|Corp+80, Law+30 |
|UNION  |Courier’s Union |Guild        |Corp-20, Law+20 |
|CIRCUIT|Shadow Circuit  |Syndicate    |Corp-80, Law-60 |
|COLLECT|Collective Flesh|Cult         |Corp-100, Law-80|
|TRAUMA |Trauma Team     |Corporation  |Corp+60, Law+70 |
|NCPD   |Metro Police    |Government   |Corp+30, Law+100|
|TIGERS |Chrome Tigers   |Gang         |Corp-50, Law-70 |
|SAINTS |Digital Saints  |Movement     |Corp-60, Law-20 |
|ASCEND |Ascension Church|Cult         |Corp+40, Law+10 |

## 12.2 Character Reputations

```sql
TABLE: character_reputations
├── id: UUID [PK]
├── character_id: FK -> characters
├── faction_id: FK -> factions
│
├── ## VALUE
├── current_value: INT [-100 to 100]
├── displayed_value: INT
├── hidden_value: INT
│
├── ## THRESHOLDS
├── current_tier: ENUM(reputation_tier)
├── xp_in_tier: INT
├── xp_to_next_tier: INT
│
├── ## HISTORY
├── peak_value: INT
├── lowest_value: INT
├── total_gained: INT
├── total_lost: INT
├── last_change: TIMESTAMP
│
├── ## UNLOCKS
├── current_perks: JSONB
├── available_missions: JSONB
├── unlocked_vendors: JSONB
│
├── ## STATUS
├── is_member: BOOLEAN
├── member_rank: VARCHAR(50)
├── marked_for_death: BOOLEAN
└── bounty_amount: INT
```

### SEED: Reputation Tiers

|Value Range|Tier|Name      |Effect             |
|-----------|----|----------|-------------------|
|90-100     |9   |Exalted   |Inner circle access|
|70-89      |8   |Revered   |Elite missions     |
|50-69      |7   |Honored   |Best prices        |
|30-49      |6   |Friendly  |Discount           |
|10-29      |5   |Neutral+  |Normal service     |
|-9 to 9    |4   |Neutral   |Default            |
|-29 to -10 |3   |Unfriendly|Price markup       |
|-49 to -30 |2   |Hostile   |Refused service    |
|-69 to -50 |1   |Hated     |Active opposition  |
|-100 to -70|0   |Nemesis   |Kill on sight      |
