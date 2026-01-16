# SURGE PROTOCOL: Complete Data Architecture

## Part 6: Combat System & Status Effects

-----

# 16. COMBAT SYSTEM

## 16.1 Combat Encounters

```sql
TABLE: combat_encounters
├── id: UUID [PK]
├── name: VARCHAR(100)
├── description: TEXT
│
├── ## TYPE
├── encounter_type: ENUM(encounter_type)
├── difficulty_rating: INT [1-10]
├── is_scripted: BOOLEAN
├── is_avoidable: BOOLEAN
│
├── ## LOCATION
├── location_id: FK -> locations
├── combat_arena_id: FK -> combat_arenas
├── environment_modifiers: JSONB
│
├── ## ENEMIES
├── enemy_spawn_groups: JSONB
/* Structure:
{
  npc_definition_id: UUID,
  count_min: INT,
  count_max: INT,
  spawn_point: POINT,
  spawn_delay: INT,
  reinforcement_trigger: VARCHAR
}
*/
├── boss_npc_id: FK -> npcs
│
├── ## OBJECTIVES
├── primary_objective: ENUM(combat_objective)
├── optional_objectives: JSONB
├── failure_conditions: JSONB
├── time_limit_seconds: INT
│
├── ## REWARDS
├── xp_reward: INT
├── cred_reward: INT
├── item_drops: JSONB
├── special_rewards: JSONB
│
├── ## CONSEQUENCES
├── retreat_possible: BOOLEAN
├── retreat_penalty: JSONB
├── death_consequence: ENUM(death_consequence)
├── narrative_impact: JSONB
│
├── ## AI SETTINGS
├── enemy_ai_profile: VARCHAR(50)
├── enemy_coordination: INT [0-100]
├── enemy_morale_enabled: BOOLEAN
└── surrender_possible: BOOLEAN
```

### SEED: Encounter Types

|Type              |Description              |Avoidable      |
|------------------|-------------------------|---------------|
|AMBUSH            |Surprise attack on player|No             |
|DEFENSE           |Hold position            |Sometimes      |
|ASSAULT           |Attack enemy position    |Yes            |
|SKIRMISH          |Random encounter         |Yes            |
|DUEL              |One-on-one               |Sometimes      |
|BOSS_FIGHT        |Major enemy              |No             |
|CHASE             |Pursuit combat           |Escape possible|
|STEALTH_GONE_WRONG|Cover blown              |N/A            |

### SEED: Combat Objectives

|Objective       |Description         |
|----------------|--------------------|
|ELIMINATE_ALL   |Kill all enemies    |
|ELIMINATE_TARGET|Kill specific target|
|SURVIVE_TIME    |Last X seconds      |
|REACH_LOCATION  |Get to extraction   |
|PROTECT_TARGET  |Keep NPC alive      |
|RETRIEVE_ITEM   |Grab and escape     |
|ESCAPE          |Get out alive       |
|DISABLE_TARGET  |Non-lethal takedown |
|HOLD_POSITION   |Defend area         |

## 16.2 Combat Arenas

```sql
TABLE: combat_arenas
├── id: UUID [PK]
├── location_id: FK -> locations
├── name: VARCHAR(100)
│
├── ## DIMENSIONS
├── width_m: INT
├── height_m: INT
├── grid_size_m: DECIMAL(3,2)
│
├── ## TERRAIN
├── terrain_map: JSONB
├── elevation_map: JSONB
├── cover_points: JSONB
/* Structure:
{
  position: POINT,
  cover_type: ENUM,
  durability: INT,
  destructible: BOOLEAN
}
*/
├── hazard_zones: JSONB
/* Structure:
{
  position: POINT,
  size: DECIMAL,
  type: ENUM,
  damage_per_second: INT
}
*/
│
├── ## SPAWNS
├── player_spawn_points: JSONB
├── enemy_spawn_points: JSONB
├── reinforcement_points: JSONB
│
├── ## INTERACTABLES
├── interactable_objects: JSONB
├── destructibles: JSONB
├── hackable_objects: JSONB
│
├── ## ENVIRONMENT
├── lighting_level: INT [0-100]
├── ambient_hazards: JSONB
├── weather_effects: JSONB
├── noise_level: INT
│
├── ## VERTICAL
├── has_multiple_levels: BOOLEAN
├── level_connections: JSONB
├── fall_damage_enabled: BOOLEAN
│
├── ## AI HINTS
├── patrol_routes: JSONB
├── sniper_positions: JSONB
├── flanking_routes: JSONB
└── retreat_routes: JSONB
```

## 16.3 Combat Action Definitions

```sql
TABLE: combat_action_definitions
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(50)
├── description: TEXT
│
├── ## TYPE
├── action_type: ENUM(combat_action_type)
├── action_cost: INT
├── is_free_action: BOOLEAN
├── is_reaction: BOOLEAN
│
├── ## REQUIREMENTS
├── requires_weapon_type: JSONB
├── requires_ability: FK -> ability_definitions
├── requires_augment: FK -> augment_definitions
├── min_attribute: JSONB
├── requires_stance: ENUM(combat_stance)
│
├── ## TARGETING
├── target_type: ENUM(target_type)
├── target_count: INT
├── range_min_m: INT
├── range_max_m: INT
├── requires_los: BOOLEAN
├── area_of_effect: JSONB
│
├── ## EFFECTS
├── damage_formula: VARCHAR(100)
├── damage_type: ENUM(damage_type)
├── status_effects: JSONB
├── knockback: INT
├── special_effects: JSONB
│
├── ## MODIFIERS
├── accuracy_modifier: INT
├── critical_chance_modifier: INT
├── critical_damage_modifier: DECIMAL(3,2)
│
├── ## ANIMATION
├── animation_id: VARCHAR(100)
├── sound_effect_id: VARCHAR(100)
└── visual_effect_id: VARCHAR(100)
```

### SEED: Combat Action Types

|Type          |Cost      |Description              |
|--------------|----------|-------------------------|
|ATTACK_MELEE  |1         |Close combat strike      |
|ATTACK_RANGED |1         |Firearm/thrown attack    |
|ATTACK_SPECIAL|1-2       |Ability-based attack     |
|RELOAD        |1         |Reload weapon            |
|MOVE          |1 per zone|Change position          |
|SPRINT        |2         |Double movement          |
|TAKE_COVER    |0         |Enter cover (if adjacent)|
|LEAVE_COVER   |0         |Exit cover               |
|USE_ITEM      |1         |Consumable, tool         |
|USE_ABILITY   |Varies    |Active ability           |
|INTERACT      |1         |Environment interaction  |
|HACK          |1-3       |Network attack           |
|OVERWATCH     |2         |Reaction shot setup      |
|DEFEND        |1         |Defensive stance         |
|AIM           |1         |+accuracy next attack    |
|SUPPRESS      |2         |Debuff enemy actions     |
|GRAPPLE       |1         |Grab enemy               |
|DISENGAGE     |1         |Safe retreat             |

## 16.4 Combat Instances (Active)

```sql
TABLE: combat_instances
├── id: UUID [PK]
├── character_id: FK -> characters
├── encounter_id: FK -> combat_encounters
├── started_at: TIMESTAMP
│
├── ## STATE
├── status: ENUM(combat_status)
├── current_round: INT
├── current_turn_entity_id: UUID
├── turn_order: JSONB
│
├── ## PARTICIPANTS
├── player_participants: JSONB
├── enemy_participants: JSONB
├── neutral_participants: JSONB
├── reinforcements_called: BOOLEAN
│
├── ## TRACKING
├── damage_dealt_by_player: INT
├── damage_taken_by_player: INT
├── enemies_defeated: INT
├── allies_lost: INT
├── rounds_elapsed: INT
├── time_elapsed_seconds: INT
│
├── ## RESOURCES USED
├── ammo_expended: JSONB
├── items_used: JSONB
├── abilities_used: JSONB
├── health_items_used: INT
│
├── ## OUTCOME
├── ended_at: TIMESTAMP
├── outcome: ENUM(combat_outcome)
├── objectives_completed: JSONB
├── loot_dropped: JSONB
├── xp_earned: INT
├── special_achievements: JSONB
│
├── ## REPLAY
├── action_log: JSONB
└── replay_seed: BIGINT
```

## 16.5 Damage Types

```sql
TABLE: damage_type_definitions
├── id: UUID [PK]
├── code: VARCHAR(20) [UNIQUE]
├── name: VARCHAR(50)
├── description: TEXT
│
├── ## PROPERTIES
├── is_physical: BOOLEAN
├── is_energy: BOOLEAN
├── is_elemental: BOOLEAN
├── is_exotic: BOOLEAN
│
├── ## ARMOR INTERACTION
├── armor_effectiveness: DECIMAL(3,2)
├── shield_effectiveness: DECIMAL(3,2)
│
├── ## SPECIAL
├── can_crit: BOOLEAN
├── leaves_status: FK -> condition_definitions
├── environmental_source: BOOLEAN
│
├── ## RESISTANCE SOURCE
└── common_resistances: JSONB
```

### SEED: Damage Types

|Code   |Name      |Physical|Armor Effect      |
|-------|----------|--------|------------------|
|KIN    |Kinetic   |Yes     |Full              |
|ENERGY |Energy    |No      |Partial           |
|THERMAL|Thermal   |No      |Partial           |
|ELEC   |Electrical|No      |Shields block     |
|CHEM   |Chemical  |No      |Varies            |
|EMP    |EMP       |No      |Electronics only  |
|SONIC  |Sonic     |No      |Ignores some armor|
|RAD    |Radiation |No      |Special resist    |
|NEURAL |Neural    |No      |Mental resist     |
|BLEED  |Bleed     |Yes     |Penetrating       |
|TRUE   |True      |N/A     |Ignores all       |

-----

# 17. STATUS EFFECTS & CONDITIONS

## 17.1 Condition Definitions

```sql
TABLE: condition_definitions
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(50)
├── description: TEXT
├── icon_asset: VARCHAR(200)
│
├── ## CLASSIFICATION
├── condition_type: ENUM(condition_type)
├── severity: INT [1-5]
├── is_positive: BOOLEAN
├── is_visible: BOOLEAN
├── is_dispellable: BOOLEAN
│
├── ## DURATION
├── duration_type: ENUM(duration_type)
├── default_duration_seconds: INT
├── can_stack_duration: BOOLEAN
│
├── ## STACKING
├── stacks: BOOLEAN
├── max_stacks: INT
├── stack_behavior: ENUM(stack_behavior)
│
├── ## EFFECTS
├── stat_modifiers: JSONB
├── attribute_modifiers: JSONB
├── damage_over_time: JSONB
├── healing_over_time: JSONB
├── movement_modifier: DECIMAL(3,2)
├── action_restrictions: JSONB
├── special_effects: JSONB
│
├── ## TRIGGERS
├── on_apply_effect: JSONB
├── on_expire_effect: JSONB
├── on_tick_effect: JSONB
├── on_stack_effect: JSONB
│
├── ## REMOVAL
├── removal_conditions: JSONB
├── cleanse_types: JSONB
├── immunity_after_removal: INT
│
├── ## SOURCES
├── typical_sources: JSONB
├── augment_mitigation: JSONB
├── skill_mitigation: FK -> skill_definitions
│
├── ## VISUALS
├── visual_effect_on_character: VARCHAR(100)
├── screen_effect: VARCHAR(100)
└── audio_effect: VARCHAR(100)
```

### SEED: Condition Types

|Type           |Description          |Example         |
|---------------|---------------------|----------------|
|BUFF           |Positive enhancement |Adrenaline Rush |
|DEBUFF         |Negative impairment  |Suppressed      |
|DOT            |Damage over time     |Bleeding        |
|HOT            |Healing over time    |Regeneration    |
|CROWD_CONTROL  |Movement/action limit|Stunned         |
|MOVEMENT_IMPAIR|Speed reduction      |Slowed          |
|MENTAL         |Psychological effect |Panicked        |
|PHYSICAL       |Body condition       |Exhausted       |
|ENVIRONMENTAL  |External source      |Burning         |
|MEDICAL        |Health condition     |Poisoned        |
|ADDICTION      |Substance dependency |Surge Withdrawal|
|CYBERPSYCHOSIS |Humanity crisis      |Dissociating    |
|HACKING        |Network attack       |ICE Locked      |

### SEED: Common Conditions

|Code        |Name           |Type     |Effect                      |
|------------|---------------|---------|----------------------------|
|STUNNED     |Stunned        |CC       |No actions 1 round          |
|SUPPRESSED  |Suppressed     |Debuff   |-50% accuracy               |
|BLEEDING    |Bleeding       |DOT      |5 dmg/round                 |
|BURNING     |Burning        |DOT      |10 dmg/round, spread        |
|POISONED    |Poisoned       |DOT      |3 dmg/round, -1 all stats   |
|SLOWED      |Slowed         |Movement |-50% speed                  |
|IMMOBILIZED |Immobilized    |Movement |Cannot move                 |
|BLIND       |Blinded        |Debuff   |-75% accuracy, no perception|
|DEAF        |Deafened       |Debuff   |No audio awareness          |
|PANICKED    |Panicked       |Mental   |Random movement             |
|ENRAGED     |Enraged        |Mental   |+damage, -defense, -judgment|
|OVERLOADED  |Neural Overload|Cyber    |Augments offline            |
|WITHDRAWAL  |Withdrawal     |Addiction|Various penalties           |
|DISSOCIATING|Dissociating   |Cyber    |-humanity checks            |

## 17.2 Character Conditions

```sql
TABLE: character_conditions
├── id: UUID [PK]
├── character_id: FK -> characters
├── condition_id: FK -> condition_definitions
├── applied_at: TIMESTAMP
│
├── ## STATE
├── current_stacks: INT
├── duration_remaining_seconds: DECIMAL(10,3)
├── is_paused: BOOLEAN
│
├── ## SOURCE
├── source_type: VARCHAR(50)
├── source_id: UUID
├── source_name: VARCHAR(100)
│
├── ## TRACKING
├── times_ticked: INT
├── total_damage_dealt: INT
├── total_healing_done: INT
└── times_refreshed: INT
```

## 17.3 Addiction System

```sql
TABLE: addiction_types
├── id: UUID [PK]
├── code: VARCHAR(30) [UNIQUE]
├── name: VARCHAR(50)
├── description: TEXT
├── substance_id: FK -> item_definitions
│
├── ## PROGRESSION
├── stages: JSONB
/* Structure per stage:
{
  stage_name: VARCHAR,
  threshold: INT,
  effects: JSONB,
  withdrawal: JSONB
}
*/
├── tolerance_rate: DECIMAL(5,4)
├── dependence_rate: DECIMAL(5,4)
├── decay_rate_per_day: DECIMAL(5,4)
│
├── ## WITHDRAWAL
├── withdrawal_onset_hours: INT
├── withdrawal_peak_hours: INT
├── withdrawal_duration_hours: INT
├── withdrawal_effects: JSONB
├── withdrawal_lethality: DECIMAL(5,4)
│
├── ## TREATMENT
├── treatment_methods: JSONB
├── treatment_cost: INT
├── treatment_duration_days: INT
├── relapse_risk: DECIMAL(5,4)
│
├── ## CRAVINGS
├── craving_triggers: JSONB
├── craving_strength_base: INT
└── craving_response_options: JSONB
```

### SEED: Addiction Types

|Substance|Onset|Peak|Duration|Lethality|
|---------|-----|----|--------|---------|
|Surge    |6h   |24h |72h     |0.01     |
|Ironblood|12h  |48h |120h    |0.05     |
|Synapse  |4h   |12h |48h     |0.02     |
|Drift    |8h   |36h |96h     |0.03     |
|Numb     |24h  |72h |168h    |0.10     |

## 17.4 Character Addictions

```sql
TABLE: character_addictions
├── id: UUID [PK]
├── character_id: FK -> characters
├── addiction_type_id: FK -> addiction_types
├── started_at: TIMESTAMP
│
├── ## STATE
├── current_stage: INT
├── tolerance_level: DECIMAL(4,3)
├── dependence_level: DECIMAL(4,3)
├── last_use: TIMESTAMP
├── times_used_total: INT
│
├── ## WITHDRAWAL
├── in_withdrawal: BOOLEAN
├── withdrawal_stage: INT
├── withdrawal_started: TIMESTAMP
│
├── ## TREATMENT
├── in_treatment: BOOLEAN
├── treatment_progress: DECIMAL(4,3)
├── treatment_start: TIMESTAMP
├── treatment_method: VARCHAR(100)
│
├── ## HISTORY
├── recovery_attempts: INT
├── relapses: INT
├── clean_streaks: JSONB
├── longest_clean_streak_hours: INT
│
├── ## CRAVINGS
├── current_craving_strength: INT [0-100]
├── last_craving: TIMESTAMP
├── cravings_resisted: INT
└── cravings_succumbed: INT
```

## 17.5 Cyberpsychosis Events

```sql
TABLE: cyberpsychosis_episodes
├── id: UUID [PK]
├── character_id: FK -> characters
├── occurred_at: TIMESTAMP
│
├── ## TRIGGER
├── trigger_type: ENUM(cyberpsychosis_trigger)
├── trigger_source_id: UUID
├── humanity_at_trigger: INT
│
├── ## EPISODE
├── severity: INT [1-5]
├── duration_minutes: INT
├── episode_type: ENUM(episode_type)
│
├── ## EFFECTS
├── actions_during: JSONB
├── npcs_harmed: JSONB
├── property_destroyed: JSONB
├── memories_lost: JSONB
│
├── ## RESOLUTION
├── resolution_method: VARCHAR(100)
├── resolved_by_npc_id: FK -> npcs
├── humanity_after: INT
├── permanent_effects: JSONB
│
├── ## CONSEQUENCES
├── legal_consequences: JSONB
├── reputation_impacts: JSONB
├── relationship_impacts: JSONB
└── narrative_flags_set: JSONB
```

### SEED: Episode Types

|Type           |Description               |Severity Range|
|---------------|--------------------------|--------------|
|DISSOCIATION   |Lost time, confusion      |1-2           |
|PARANOIA       |Everyone is a threat      |2-3           |
|FUGUE          |Act without memory        |2-4           |
|RAGE           |Uncontrolled violence     |3-5           |
|IDENTITY_CRISIS|Who am I?                 |2-4           |
|MACHINE_MERGE  |Becoming the augments     |3-5           |
|FULL_BREAK     |Complete psychotic episode|5             |
