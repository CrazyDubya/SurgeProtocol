# SURGE PROTOCOL: Complete Data Architecture

## Part 1: Core Character & Progression Systems

-----

# 1. CORE CHARACTER SYSTEM

## 1.1 Characters (Primary Entity)

```sql
TABLE: characters
├── id: UUID [PK]
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
├── deleted_at: TIMESTAMP [soft delete]
│
├── ## IDENTITY
├── legal_name: VARCHAR(100)
├── street_name: VARCHAR(50)
├── current_alias: VARCHAR(50)
├── callsign: VARCHAR(20)
├── biometric_hash: VARCHAR(256)
│
├── ## DEMOGRAPHICS
├── birth_date: DATE
├── apparent_age: INT
├── biological_sex: ENUM(sex_type)
├── gender_identity: VARCHAR(50)
├── ethnicity: VARCHAR(100)
├── height_cm: INT
├── weight_kg: DECIMAL(5,2)
├── blood_type: ENUM(blood_type)
│
├── ## PHYSICAL DESCRIPTION
├── natural_hair_color: VARCHAR(30)
├── current_hair_color: VARCHAR(30)
├── eye_color_left: VARCHAR(30)
├── eye_color_right: VARCHAR(30)
├── skin_tone: VARCHAR(30)
├── distinguishing_marks: TEXT
├── physical_description: TEXT
├── augment_visibility_score: INT [0-100]
│
├── ## CORE PROGRESSION
├── carrier_rating: DECIMAL(7,3) [0.000 - 1000.000]
├── current_tier: INT [1-10]
├── tier_progress: DECIMAL(5,4) [0.0000 - 1.0000]
├── track_id: FK -> tracks [NULL until Tier 3]
├── specialization_id: FK -> specializations [NULL until Tier 6]
├── convergence_path: ENUM(convergence_path) [NULL until Tier 9]
│
├── ## STATUS
├── is_active: BOOLEAN
├── is_rogue: BOOLEAN
├── is_ascended: BOOLEAN
├── consciousness_state: ENUM(consciousness_state)
├── corporate_standing: ENUM(corporate_standing)
├── wanted_level: INT [0-5]
│
├── ## LOCATION
├── current_location_id: FK -> locations
├── home_location_id: FK -> locations
├── last_known_coordinates: POINT
├── location_spoofed: BOOLEAN
│
├── ## META
├── total_playtime_seconds: BIGINT
├── total_deliveries_completed: INT
├── total_distance_traveled_km: DECIMAL(12,2)
├── permadeath_enabled: BOOLEAN
└── difficulty_setting: ENUM(difficulty_level)
```

## 1.2 Character Backstory

```sql
TABLE: character_backstories
├── id: UUID [PK]
├── character_id: FK -> characters [UNIQUE]
│
├── ## ORIGIN
├── origin_type: ENUM(origin_type)
├── origin_location_id: FK -> locations
├── origin_narrative: TEXT
│
├── ## FAMILY
├── family_status: ENUM(family_status)
├── family_description: TEXT
├── has_dependents: BOOLEAN
├── dependent_count: INT
│
├── ## HISTORY
├── previous_occupation: VARCHAR(100)
├── education_level: ENUM(education_level)
├── military_service: BOOLEAN
├── criminal_record: BOOLEAN
├── corporate_history: TEXT
│
├── ## MOTIVATION
├── primary_motivation: ENUM(motivation_type)
├── secondary_motivation: ENUM(motivation_type)
├── personal_goal: TEXT
├── deepest_fear: TEXT
├── moral_code: TEXT
│
├── ## INCITING INCIDENT
├── why_became_courier: TEXT
├── first_delivery_story: TEXT
└── defining_moment: TEXT
```

## 1.3 Character Psychology

```sql
TABLE: character_psychology
├── id: UUID [PK]
├── character_id: FK -> characters [UNIQUE]
│
├── ## PERSONALITY (BIG FIVE)
├── openness: DECIMAL(3,2) [0.00-1.00]
├── conscientiousness: DECIMAL(3,2)
├── extraversion: DECIMAL(3,2)
├── agreeableness: DECIMAL(3,2)
├── neuroticism: DECIMAL(3,2)
│
├── ## MORAL ALIGNMENT (2D AXES)
├── lawful_chaotic: DECIMAL(3,2) [-1.00 to 1.00]
├── good_evil: DECIMAL(3,2) [-1.00 to 1.00]
├── corporate_rebel: DECIMAL(3,2) [-1.00 to 1.00]
├── human_machine: DECIMAL(3,2) [-1.00 to 1.00]
│
├── ## MENTAL STATE
├── humanity_score: INT [0-100]
├── identity_coherence: INT [0-100]
├── stress_level: INT [0-100]
├── trauma_index: INT [0-100]
├── addiction_susceptibility: DECIMAL(3,2)
│
├── ## CONDITIONS
├── active_conditions: JSONB
├── suppressed_memories: JSONB
├── identity_fragments: INT
└── last_psychological_eval: TIMESTAMP
```

## 1.4 Character Memories

```sql
TABLE: character_memories
├── id: UUID [PK]
├── character_id: FK -> characters
├── created_at: TIMESTAMP
│
├── ## CONTENT
├── memory_type: ENUM(memory_type)
├── title: VARCHAR(100)
├── description: TEXT
├── emotional_valence: INT [-100 to 100]
├── emotional_intensity: INT [0-100]
│
├── ## ASSOCIATIONS
├── associated_npc_ids: JSONB
├── associated_location_id: FK -> locations
├── associated_mission_id: FK -> missions
├── associated_item_ids: JSONB
│
├── ## STATE
├── is_suppressed: BOOLEAN
├── is_implanted: BOOLEAN
├── is_extracted: BOOLEAN
├── clarity: INT [0-100]
├── times_recalled: INT
│
├── ## EFFECTS
├── grants_skill_bonus: FK -> skills
├── triggers_condition: FK -> conditions
└── narrative_flag: VARCHAR(50)
```

-----

# 2. ATTRIBUTES & STATS

## 2.1 Attribute Definitions

```sql
TABLE: attribute_definitions
├── id: UUID [PK]
├── code: VARCHAR(10) [UNIQUE]
├── name: VARCHAR(50)
├── description: TEXT
├── category: ENUM(attribute_category)
├── min_value: INT
├── max_value: INT
├── default_value: INT
├── is_derived: BOOLEAN
├── derivation_formula: VARCHAR(500)
└── display_order: INT
```

## 2.2 SEED: Primary Attributes (10)

```
PHYSICAL:
├── VEL - Velocity: Reaction time, speed
├── END - Endurance: Stamina, resilience
├── PWR - Power: Strength, force
├── AGI - Agility: Flexibility, balance

MENTAL:
├── INT - Intelligence: Problem-solving
├── PRC - Perception: Awareness
├── WIL - Willpower: Mental fortitude
├── RSN - Resonance: Intuition

SOCIAL:
├── EMP - Empathy: Emotional intelligence
└── PRE - Presence: Charisma
```

## 2.3 SEED: Derived Attributes (12)

```
COMBAT:
├── INI - Initiative: (VEL + PRC) / 2
├── EVA - Evasion: (AGI + VEL) / 2
├── ARM - Armor Value: Equipment + Dermal
├── HP - Hit Points: END * 5 + PWR * 2

RESOURCE POOLS:
├── STA - Stamina: END * 10 + WIL * 2
├── FCS - Focus: INT * 5 + WIL * 5
├── CLM - Calm: EMP * 5 + RSN * 5

THRESHOLDS:
├── PAN - Panic: WIL * 2 + END
├── OVL - Overload: INT * 2 + WIL
├── ADD - Addiction: WIL * 2 + END
├── HUM - Humanity: EMP * 5 + RSN * 3

META:
└── LCK - Luck Pool: (RSN + PRC) / 2
```

## 2.4 Character Attributes

```sql
TABLE: character_attributes
├── id: UUID [PK]
├── character_id: FK -> characters
├── attribute_id: FK -> attribute_definitions
│
├── ## VALUES
├── base_value: INT
├── augmented_bonus: INT
├── temporary_bonus: INT
├── temporary_penalty: INT
├── effective_value: INT [COMPUTED]
│
├── ## ADVANCEMENT
├── times_tested: INT
├── critical_successes: INT
├── critical_failures: INT
└── last_used: TIMESTAMP
```

## 2.5 Track-Specific Attributes

```sql
TABLE: track_attribute_definitions
├── id: UUID [PK]
├── track_id: FK -> tracks
├── code: VARCHAR(20)
├── name: VARCHAR(50)
├── description: TEXT
├── base_derivation: VARCHAR(200)
├── unlocked_at_tier: INT
└── max_value: INT
```

### SEED: Track Attributes

```
VECTOR:
├── VEC_VELOCITY: VEL * 2 + AGI
├── VEC_SPATIAL: PRC * 2 + INT
└── VEC_SYNC: RSN + AGI

SENTINEL:
├── SEN_ARMOR: END * 2 + PWR
├── SEN_THREAT: PRC * 2 + INT
└── SEN_ANCHOR: WIL + END

NETWEAVER:
├── NET_BANDWIDTH: INT * 2 + RSN
├── NET_INTRUSION: INT + PRC
└── NET_GHOST: AGI + RSN

INTERFACE:
├── INT_READ: EMP * 2 + PRC
├── INT_INFLUENCE: PRE * 2 + EMP
└── INT_MASK: WIL + PRE

MACHINIST:
├── MCH_EXTENSION: RSN * 2 + INT
├── MCH_DIAGNOSTIC: INT + PRC
└── MCH_SWARM: RSN + WIL
```

-----

# 3. TRACK & SPECIALIZATION SYSTEM

## 3.1 Tracks

```sql
TABLE: tracks
├── id: UUID [PK]
├── code: VARCHAR(10) [UNIQUE]
├── name: VARCHAR(50)
├── tagline: VARCHAR(200)
├── description: TEXT
├── lore_description: TEXT
│
├── ## REQUIREMENTS
├── unlocked_at_tier: INT [always 3]
├── prerequisite_attributes: JSONB
├── prerequisite_missions: JSONB
│
├── ## CORE MECHANICS
├── primary_attribute: FK -> attribute_definitions
├── secondary_attribute: FK -> attribute_definitions
├── resource_pool_type: ENUM(resource_pool_type)
├── signature_mechanic_description: TEXT
│
├── ## RELATIONSHIPS
├── natural_ally_tracks: JSONB [75% cross-train]
├── difficult_cross_tracks: JSONB [50% cross-train]
│
├── ## META
├── difficulty_rating: INT [1-5]
├── playstyle_tags: JSONB
├── recommended_for_new_players: BOOLEAN
└── display_order: INT
```

### SEED: Tracks

|Code|Name     |Primary|Secondary|Allies  |Difficult|
|----|---------|-------|---------|--------|---------|
|VEC |Vector   |VEL    |AGI      |MCH, NET|SEN, INT |
|SEN |Sentinel |END    |WIL      |INT, VEC|NET, MCH |
|NET |Netweaver|INT    |RSN      |MCH, INT|VEC, SEN |
|INT |Interface|EMP    |PRE      |SEN, NET|MCH, VEC |
|MCH |Machinist|RSN    |INT      |VEC, NET|INT, SEN |

## 3.2 Specializations

```sql
TABLE: specializations
├── id: UUID [PK]
├── track_id: FK -> tracks
├── code: VARCHAR(10) [UNIQUE]
├── name: VARCHAR(50)
├── tagline: VARCHAR(200)
├── description: TEXT
├── lore_description: TEXT
│
├── ## REQUIREMENTS
├── unlocked_at_tier: INT [always 6]
├── prerequisite_abilities: JSONB
├── prerequisite_augments: JSONB
├── prerequisite_missions: JSONB
│
├── ## SIGNATURE
├── signature_ability_id: FK -> abilities
├── signature_passive_id: FK -> passives
│
├── ## PLAYSTYLE FOCUS [0-100 each]
├── combat_focus: INT
├── stealth_focus: INT
├── social_focus: INT
├── technical_focus: INT
├── mobility_focus: INT
│
├── ## META
├── difficulty_rating: INT [1-5]
├── synergy_specs: JSONB
└── display_order: INT
```

### SEED: Specializations

|Code   |Track    |Name          |Focus                |
|-------|---------|--------------|---------------------|
|VEC_SLP|Vector   |Slipstream    |Highway speed mastery|
|VEC_PKR|Vector   |Parkour Vector|Urban acrobatics     |
|VEC_PLT|Vector   |Pilot         |Aerial/VTOL          |
|SEN_BLK|Sentinel |Bulwark       |Personal tank        |
|SEN_SHP|Sentinel |Shepherd      |Escort protection    |
|SEN_HZM|Sentinel |Hazmat        |Dangerous cargo      |
|NET_PHN|Netweaver|Phantom       |Network stealth      |
|NET_SPD|Netweaver|Spider        |Persistent access    |
|NET_ORC|Netweaver|Oracle        |Prediction systems   |
|INT_BRK|Interface|Broker        |Negotiation          |
|INT_MSK|Interface|Mask          |Identity assumption  |
|INT_HND|Interface|Handler       |Network building     |
|MCH_SWM|Machinist|Swarm Lord    |Many drones          |
|MCH_CNT|Machinist|Centaur       |Vehicle fusion       |
|MCH_FAB|Machinist|Fabricator    |Field repair         |

## 3.3 Tier Definitions

```sql
TABLE: tier_definitions
├── id: UUID [PK]
├── tier_number: INT [1-10, UNIQUE]
├── name: VARCHAR(50)
├── subtitle: VARCHAR(100)
├── description: TEXT
│
├── ## REQUIREMENTS
├── min_rating: DECIMAL(7,3)
├── min_deliveries: INT
├── min_playtime_hours: INT
├── required_augments: INT
│
├── ## TITLES
├── corporate_title: VARCHAR(50)
├── street_title: VARCHAR(50)
├── algorithm_relationship: TEXT
│
├── ## MECHANICS
├── base_pay_multiplier: DECIMAL(4,2)
├── mission_access_level: INT
├── location_access_level: INT
├── augment_access_level: INT
├── black_market_access: BOOLEAN
├── interstitial_access: BOOLEAN
│
├── ## BENEFITS
├── health_insurance_tier: INT [0-5]
├── housing_subsidy_level: INT [0-5]
├── corporate_support_level: INT [0-5]
├── algorithm_consultation: BOOLEAN
│
├── ## SPECIAL
├── triggers_convergence_choice: BOOLEAN
├── ascension_eligible: BOOLEAN
├── rogue_path_available: BOOLEAN
└── display_color: VARCHAR(7)
```

### SEED: Tier Definitions

|Tier|Name        |Street Title  |Key Unlock         |
|----|------------|--------------|-------------------|
|1   |Probationary|Fresh Meat    |-                  |
|2   |Provisional |Legit         |Basic augments     |
|3   |Certified   |Tracked       |Track Selection    |
|4   |Established |Gray Runner   |Gray Market        |
|5   |Professional|Interstitial  |Interstitial Access|
|6   |Specialist  |Chrome        |Specialization     |
|7   |Elite       |Nomad         |Algorithm Consult  |
|8   |Master      |Ghost         |Black Market Full  |
|9   |Apex        |Convergent    |Final Choice       |
|10  |Transcendent|Ascended/Rogue|Endgame            |

## 3.4 Carrier Rating Components

```sql
TABLE: rating_components
├── id: UUID [PK]
├── code: VARCHAR(20) [UNIQUE]
├── name: VARCHAR(50)
├── description: TEXT
├── weight: DECIMAL(4,3)
├── min_value: DECIMAL(7,3)
├── max_value: DECIMAL(7,3)
├── decay_rate_per_day: DECIMAL(6,5)
├── is_public: BOOLEAN
└── affects_tier: BOOLEAN
```

### SEED: Rating Components

|Code         |Name                      |Weight|Decay|
|-------------|--------------------------|------|-----|
|DEL_SUCCESS  |Delivery Success Rate     |0.200 |0.001|
|DEL_SPEED    |Speed vs Expected         |0.150 |0.002|
|CUST_SAT     |Customer Satisfaction     |0.150 |0.001|
|PKG_INTEGRITY|Package Condition         |0.100 |0.001|
|ROUTE_EFF    |Route Efficiency          |0.100 |0.002|
|AVAILABILITY |Hours Online              |0.100 |0.005|
|INCIDENT     |Incident Rate (inverse)   |0.100 |0.000|
|SPECIAL      |Special Mission Completion|0.050 |0.001|
|ALGO_TRUST   |Algorithm Trust (T7+)     |0.025 |0.000|
|NET_CONTRIB  |Network Contribution (T9+)|0.025 |0.000|

## 3.5 Experience & Advancement

```sql
TABLE: character_experience
├── id: UUID [PK]
├── character_id: FK -> characters [UNIQUE]
│
├── ## TOTALS
├── total_xp_earned: BIGINT
├── total_xp_spent: BIGINT
├── available_xp: INT
│
├── ## BY CATEGORY
├── combat_xp: INT
├── delivery_xp: INT
├── social_xp: INT
├── technical_xp: INT
├── exploration_xp: INT
├── story_xp: INT
│
├── ## ADVANCEMENT POINTS
├── attribute_points_available: INT
├── skill_points_available: INT
├── ability_points_available: INT
├── augment_slots_available: INT
│
├── ## SPECIAL CURRENCIES
├── algorithm_favor: INT
├── street_cred: INT
├── network_tokens: INT
└── humanity_anchors: INT
```

## 3.6 Cross-Training Progress

```sql
TABLE: cross_training_progress
├── id: UUID [PK]
├── character_id: FK -> characters
├── source_track_id: FK -> tracks
├── target_track_id: FK -> tracks
│
├── ## PROGRESS
├── xp_invested: INT
├── xp_required: INT
├── current_effectiveness: DECIMAL(3,2)
├── max_effectiveness: DECIMAL(3,2)
│
├── ## UNLOCKS
├── abilities_unlocked: JSONB
├── passives_unlocked: JSONB
│
├── ## RESTRICTIONS
├── blocked_abilities: JSONB
└── requires_augment_compatibility: BOOLEAN
```
