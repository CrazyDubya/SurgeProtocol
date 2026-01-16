# SURGE PROTOCOL: Complete Data Architecture

## Part 8: Meta Systems - Achievements, Procedural Generation, Loot

-----

# 13. ACHIEVEMENTS & MILESTONES

## 13.1 Achievement Definitions

```sql
TABLE: achievement_definitions
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
├── description: TEXT
├── hidden_description: TEXT
│
├── ## CLASSIFICATION
├── achievement_type: ENUM(achievement_type)
├── category: VARCHAR(50)
├── difficulty: INT [1-5]
├── rarity: ENUM(achievement_rarity)
├── points: INT
│
├── ## REQUIREMENTS
├── unlock_conditions: JSONB
├── counter_target: INT
├── counter_type: VARCHAR(50)
├── is_hidden: BOOLEAN
├── is_secret: BOOLEAN
│
├── ## REWARDS
├── xp_reward: INT
├── credit_reward: INT
├── item_reward_id: FK -> item_definitions
├── title_reward: VARCHAR(50)
├── cosmetic_reward: JSONB
│
├── ## SERIES
├── series_id: VARCHAR(30)
├── series_order: INT
├── prerequisite_achievement_id: FK -> achievement_definitions
│
├── ## META
├── is_missable: BOOLEAN
└── is_one_per_playthrough: BOOLEAN
```

### SEED: Achievement Categories

|Category   |Examples                                                 |
|-----------|---------------------------------------------------------|
|STORY      |Complete Act 1, Reach Tier 10, Choose Ascension          |
|DELIVERY   |100 Deliveries, Perfect Rating Streak, Express Master    |
|COMBAT     |First Kill, Pacifist Run, Solo a Gang                    |
|EXPLORATION|Visit All Districts, Find Hidden Routes, Map Interstitial|
|SOCIAL     |Max NPC Relationship, Join Faction, Betray Faction       |
|COLLECTION |All Augments, All Vehicles, Full Chrome                  |
|CHALLENGE  |No Deaths, Speed Run, Ironman Complete                   |
|SECRET     |Easter Eggs, Hidden Endings, Dev References              |

## 13.2 Character Achievements

```sql
TABLE: character_achievements
├── id: UUID [PK]
├── character_id: FK -> characters
├── achievement_id: FK -> achievement_definitions
│
├── ## STATUS
├── status: ENUM(achievement_status)
├── unlocked_at: TIMESTAMP
│
├── ## PROGRESS
├── current_counter: INT
├── target_counter: INT
├── percent_complete: DECIMAL(5,2)
│
├── ## TRACKING
├── first_progress_at: TIMESTAMP
├── last_progress_at: TIMESTAMP
│
├── ## REWARDS
├── rewards_claimed: BOOLEAN
├── rewards_claimed_at: TIMESTAMP
│
├── ## META
├── difficulty_at_unlock: ENUM(difficulty_level)
├── playtime_at_unlock_hours: DECIMAL(10,2)
└── is_new: BOOLEAN
```

## 13.3 Milestone Definitions

```sql
TABLE: milestone_definitions
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
├── description: TEXT
│
├── ## TYPE
├── milestone_type: ENUM(milestone_type)
├── category: VARCHAR(50)
├── tracked_stat: VARCHAR(100)
│
├── ## THRESHOLDS
├── thresholds: JSONB -- [{value, name, reward}]
├── display_format: VARCHAR(50)
│
├── ## DISPLAY
├── show_on_profile: BOOLEAN
└── leaderboard_eligible: BOOLEAN
```

### SEED: Milestone Types

|Type              |Stat             |Thresholds              |
|------------------|-----------------|------------------------|
|DELIVERIES_TOTAL  |total_deliveries |10, 100, 500, 1000, 5000|
|DISTANCE_TRAVELED |total_km         |100, 1000, 5000, 10000  |
|CREDITS_EARNED    |lifetime_credits |10K, 100K, 1M, 10M      |
|PERFECT_DELIVERIES|perfect_count    |10, 50, 100, 500        |
|AUGMENTS_INSTALLED|augment_count    |5, 10, 15, 20           |
|HUMANITY_RECOVERED|humanity_restored|10, 50, 100             |
|FACTIONS_MAXED    |max_rep_factions |1, 3, 5, ALL            |

-----

# 14. PROCEDURAL GENERATION

## 14.1 Generation Templates

```sql
TABLE: generation_templates
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
├── template_type: ENUM(generation_type)
│
├── ## PARAMETERS
├── parameter_ranges: JSONB
├── required_tags: JSONB
├── excluded_tags: JSONB
├── weight_modifiers: JSONB
│
├── ## CONSTRAINTS
├── tier_range: JSONB -- {min, max}
├── difficulty_range: JSONB
├── faction_affinity: FK -> factions
├── region_affinity: FK -> regions
│
├── ## SCALING
├── scales_with_tier: BOOLEAN
├── scaling_formula: VARCHAR(200)
│
├── ## VARIETY
├── variation_count: INT
└── combination_rules: JSONB
```

## 14.2 Name Generation Pools

```sql
TABLE: name_generation_pools
├── id: UUID [PK]
├── pool_type: ENUM(name_pool_type)
├── category: VARCHAR(50)
├── culture: VARCHAR(50)
│
├── ## CONTENT
├── first_names: JSONB
├── last_names: JSONB
├── prefixes: JSONB
├── suffixes: JSONB
├── street_names: JSONB
├── business_names: JSONB
│
├── ## RULES
├── combination_rules: JSONB
├── syllable_patterns: JSONB
└── prohibited_combinations: JSONB
```

### SEED: Name Pool Types

|Type             |Use                        |
|-----------------|---------------------------|
|PERSON_LEGAL     |Full legal names           |
|PERSON_STREET    |Courier aliases, gang names|
|CORPORATION      |Company names              |
|GANG             |Gang/crew names            |
|LOCATION_STREET  |Street names               |
|LOCATION_BUSINESS|Shop/bar names             |
|PRODUCT          |Item brand names           |
|DRUG             |Street drug names          |
|AUGMENT          |Chrome model names         |

## 14.3 Loot Tables

```sql
TABLE: loot_tables
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
│
├── ## SOURCE
├── source_type: ENUM(loot_source)
├── source_tier_range: JSONB
│
├── ## ENTRIES
├── guaranteed_items: JSONB -- [{item_id, quantity_range}]
├── random_items: JSONB -- [{item_id, weight, quantity_range}]
├── currency_range: JSONB -- {min, max, currency_id}
│
├── ## MODIFIERS
├── luck_affects: BOOLEAN
├── tier_scaling: BOOLEAN
├── faction_modifiers: JSONB
├── region_modifiers: JSONB
│
├── ## SPECIAL
├── legendary_chance: DECIMAL(6,5)
├── nothing_chance: DECIMAL(5,4)
│
├── ## NESTED
├── nested_tables: JSONB -- [{table_id, rolls, weight}]
└── mutually_exclusive: JSONB
```

### SEED: Loot Sources

|Source          |Description            |
|----------------|-----------------------|
|ENEMY_KILL      |Defeated NPCs          |
|CONTAINER       |Boxes, lockers, stashes|
|MISSION_REWARD  |Completion bonus       |
|VENDOR_RESTOCK  |Shop inventory refresh |
|CRAFTING_RESULT |Made items             |
|RANDOM_ENCOUNTER|World events           |
|EXPLORATION     |Hidden finds           |
|THEFT           |Pickpocket/burglary    |
|GAMBLING        |Games of chance        |

-----

# 15. TIME & WEATHER

## 15.1 Game Time State

```sql
TABLE: game_time_state
├── id: UUID [PK]
├── save_id: FK -> save_games
│
├── ## CURRENT TIME
├── current_timestamp: TIMESTAMP
├── current_day_of_week: INT [0-6]
├── current_hour: INT [0-23]
├── current_minute: INT [0-59]
│
├── ## CALENDAR
├── current_day: INT [1-31]
├── current_month: INT [1-12]
├── current_year: INT
├── days_elapsed: INT
│
├── ## CYCLE
├── time_of_day: ENUM(time_of_day)
├── is_rush_hour: BOOLEAN
├── is_night: BOOLEAN
│
├── ## SCALING
├── time_scale: DECIMAL(4,2)
└── time_paused: BOOLEAN
```

## 15.2 Weather Conditions

```sql
TABLE: weather_conditions
├── id: UUID [PK]
├── code: VARCHAR(30) [UNIQUE]
├── name: VARCHAR(50)
├── description: TEXT
│
├── ## TYPE
├── weather_type: ENUM(weather_type)
├── severity: INT [1-5]
├── is_hazardous: BOOLEAN
│
├── ## EFFECTS
├── visibility_modifier: DECIMAL(3,2)
├── speed_modifier: DECIMAL(3,2)
├── handling_modifier: DECIMAL(3,2)
├── stealth_modifier: DECIMAL(3,2)
├── damage_per_minute: INT
│
├── ## REQUIREMENTS
├── special_equipment_needed: JSONB
└── vehicle_requirements: JSONB
```

### SEED: Weather Types

|Type        |Visibility|Speed|Hazard     |
|------------|----------|-----|-----------|
|CLEAR       |1.0       |1.0  |No         |
|CLOUDY      |0.95      |1.0  |No         |
|FOG         |0.5       |0.8  |No         |
|RAIN_LIGHT  |0.8       |0.9  |No         |
|RAIN_HEAVY  |0.6       |0.7  |Minor      |
|THUNDERSTORM|0.4       |0.6  |Yes        |
|SMOG_HEAVY  |0.3       |0.8  |Yes        |
|ACID_RAIN   |0.7       |0.8  |Yes        |
|EM_STORM    |0.9       |1.0  |Electronics|

## 15.3 Scheduled Events

```sql
TABLE: scheduled_events
├── id: UUID [PK]
├── character_id: FK -> characters
│
├── ## EVENT
├── event_type: ENUM(scheduled_event_type)
├── event_name: VARCHAR(100)
├── reference_id: UUID
│
├── ## TIMING
├── scheduled_time: TIMESTAMP
├── duration_minutes: INT
├── is_flexible: BOOLEAN
├── is_recurring: BOOLEAN
├── recurrence_rule: VARCHAR(100)
│
├── ## LOCATION
├── location_id: FK -> locations
│
├── ## IMPORTANCE
├── priority: INT [1-10]
├── missable: BOOLEAN
├── miss_consequence: TEXT
│
├── ## STATE
├── status: ENUM(event_status)
├── reminder_sent: BOOLEAN
└── outcome: TEXT
```
