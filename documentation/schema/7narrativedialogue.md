# SURGE PROTOCOL: Complete Data Architecture

## Part 7: Narrative, Dialogue & Story Systems

-----

# 18. NARRATIVE & STORY SYSTEM

## 18.1 Story Arcs

```sql
TABLE: story_arcs
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
├── description: TEXT
│
├── ## TYPE
├── arc_type: ENUM(arc_type)
├── is_main_story: BOOLEAN
├── is_repeatable: BOOLEAN
│
├── ## STRUCTURE
├── chapters: JSONB
├── parallel_arcs: JSONB
├── prerequisite_arcs: JSONB
├── mutually_exclusive_arcs: JSONB
│
├── ## CHARACTERS
├── protagonist_npcs: JSONB
├── antagonist_npcs: JSONB
├── supporting_npcs: JSONB
│
├── ## THEMES
├── themes: JSONB
├── tone: VARCHAR(50)
├── moral_questions: JSONB
│
├── ## ENDINGS
├── possible_endings: JSONB
├── default_ending_id: UUID
│
├── ## META
├── estimated_playtime_hours: DECIMAL(4,1)
├── difficulty_rating: INT [1-10]
└── player_agency_level: INT [1-10]
```

### SEED: Main Story Arc Structure

|Arc    |Name            |Chapters|Theme                         |
|-------|----------------|--------|------------------------------|
|MAIN   |The Delivery    |10      |What are you willing to trade?|
|CORP   |Corporate Ladder|5       |Is optimization liberation?   |
|ROGUE  |Burn Notice     |5       |Freedom vs. Security          |
|UNION  |Solidarity      |4       |Collective vs. Individual     |
|NETWORK|Convergence     |4       |Human vs. Algorithm           |
|ASCEND |Transcendence   |3       |Death vs. Transformation      |

## 18.2 Story Chapters

```sql
TABLE: story_chapters
├── id: UUID [PK]
├── arc_id: FK -> story_arcs
├── sequence_order: INT
├── name: VARCHAR(100)
├── description: TEXT
│
├── ## STRUCTURE
├── missions: JSONB
├── parallel_missions: JSONB
├── optional_missions: JSONB
│
├── ## TRIGGERS
├── unlock_conditions: JSONB
├── auto_start: BOOLEAN
├── start_event_id: FK -> narrative_events
│
├── ## COMPLETION
├── completion_conditions: JSONB
├── completion_event_id: FK -> narrative_events
├── rewards: JSONB
│
├── ## VARIATIONS
├── branch_points: JSONB
├── variations: JSONB
│
├── ## PACING
├── estimated_time_minutes: INT
├── has_point_of_no_return: BOOLEAN
├── point_of_no_return_warning: TEXT
│
├── ## NARRATIVE
├── chapter_summary_text: TEXT
├── recap_dialogue_id: FK -> dialogue_trees
└── end_chapter_cutscene_id: FK -> cutscenes
```

## 18.3 Narrative Events

```sql
TABLE: narrative_events
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
├── description: TEXT
│
├── ## TYPE
├── event_type: ENUM(narrative_event_type)
├── priority: INT
├── is_skippable: BOOLEAN
├── is_repeatable: BOOLEAN
│
├── ## TRIGGERS
├── trigger_type: ENUM(trigger_type)
├── trigger_conditions: JSONB
├── trigger_location_id: FK -> locations
├── trigger_time: JSONB
│
├── ## CONTENT
├── dialogue_tree_id: FK -> dialogue_trees
├── cutscene_id: FK -> cutscenes
├── animation_sequence: JSONB
├── ambient_event: BOOLEAN
│
├── ## PARTICIPANTS
├── required_npcs: JSONB
├── optional_npcs: JSONB
├── spawns_npcs: JSONB
│
├── ## CONSEQUENCES
├── state_changes: JSONB
├── flag_sets: JSONB
├── unlocks_content: JSONB
├── reputation_changes: JSONB
├── item_grants: JSONB
├── relationship_changes: JSONB
│
├── ## BRANCHING
├── choices: JSONB
├── default_choice: UUID
├── timeout_choice: UUID
├── timeout_seconds: INT
│
├── ## AUDIO/VISUAL
├── background_music_id: VARCHAR(100)
├── ambient_audio_id: VARCHAR(100)
├── weather_override: ENUM(weather_type)
└── time_override: ENUM(time_of_day)
```

### SEED: Narrative Event Types

|Type             |Description              |Skippable|
|-----------------|-------------------------|---------|
|STORY_MAJOR      |Key plot point           |No       |
|STORY_MINOR      |Supporting detail        |Sometimes|
|CHARACTER_MOMENT |NPC development          |Yes      |
|WORLD_EVENT      |City/world change        |No       |
|AMBIENT          |Background flavor        |Yes      |
|REACTION         |Response to player action|No       |
|CONSEQUENCE      |Delayed effect           |No       |
|REVELATION       |Major discovery          |No       |
|CONFRONTATION    |Key conflict             |No       |
|DREAM_SEQUENCE   |Subconscious content     |Yes      |
|FLASHBACK        |Past event               |Sometimes|
|ALGORITHM_WHISPER|Network contact          |Sometimes|

## 18.4 Story Flags

```sql
TABLE: story_flags
├── id: UUID [PK]
├── code: VARCHAR(100) [UNIQUE]
├── name: VARCHAR(100)
├── description: TEXT
├── category: VARCHAR(50)
│
├── ## TYPE
├── flag_type: ENUM(flag_type)
├── default_value: TEXT
│
├── ## SCOPE
├── is_global: BOOLEAN
├── arc_specific: FK -> story_arcs
├── mission_specific: FK -> missions
│
├── ## PERSISTENCE
├── persists_after_arc: BOOLEAN
├── resets_on_new_game: BOOLEAN
│
├── ## EFFECTS
├── triggers_events: JSONB
├── unlocks_dialogue: JSONB
├── unlocks_missions: JSONB
└── affects_ending: BOOLEAN
```

### SEED: Key Story Flags

|Flag                  |Type   |Description            |
|----------------------|-------|-----------------------|
|TIER_3_TRACK_CHOSEN   |String |Which track selected   |
|TIER_6_SPEC_CHOSEN    |String |Specialization         |
|TIER_9_PATH_CHOSEN    |String |Ascend/Rogue/Refuse    |
|KNEW_UPLOAD_TRUTH     |Boolean|Discovered before T9   |
|KILLED_FIRST_PERSON   |Boolean|First lethal action    |
|SPARED_RIVAL          |Boolean|Mercy to competitor    |
|TRUSTED_ALGORITHM     |Boolean|Followed Network advice|
|MET_ROGUE_NETWORK     |Boolean|Contacted resistance   |
|ROMANCE_ACTIVE        |String |Current romance NPC    |
|MAJOR_DEBT_CLEARED    |Boolean|Escaped debt trap      |
|FACTION_DESTROYED     |String |Which faction destroyed|
|CYBERPSYCHOSIS_EPISODE|Int    |Number of breaks       |

## 18.5 Character Story State

```sql
TABLE: character_story_state
├── id: UUID [PK]
├── character_id: FK -> characters [UNIQUE]
│
├── ## ARC PROGRESS
├── current_main_arc_id: FK -> story_arcs
├── current_main_chapter_id: FK -> story_chapters
├── completed_arcs: JSONB
├── active_arcs: JSONB
├── failed_arcs: JSONB
│
├── ## FLAGS
├── story_flags: JSONB
├── permanent_flags: JSONB
│
├── ## CHOICES
├── major_choices_made: JSONB
├── pending_consequences: JSONB
│
├── ## ENDINGS
├── endings_seen: JSONB
├── current_ending_track: VARCHAR(50)
├── ending_points: JSONB
│
├── ## META
├── story_completion_percent: DECIMAL(5,2)
├── total_story_choices: INT
├── time_in_story_content_hours: DECIMAL(8,2)
├── cutscenes_watched: JSONB
└── cutscenes_skipped: JSONB
```

-----

# 19. DIALOGUE SYSTEM

## 19.1 Dialogue Trees

```sql
TABLE: dialogue_trees
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
├── description: TEXT
│
├── ## CONTEXT
├── npc_id: FK -> npcs
├── location_id: FK -> locations
├── mission_id: FK -> missions
├── arc_id: FK -> story_arcs
│
├── ## STRUCTURE
├── root_node_id: FK -> dialogue_nodes
├── greeting_node_id: FK -> dialogue_nodes
├── farewell_node_id: FK -> dialogue_nodes
│
├── ## CONDITIONS
├── availability_conditions: JSONB
├── one_time_only: BOOLEAN
├── cooldown_hours: INT
│
├── ## STATE
├── tracks_completion: BOOLEAN
├── marks_npc_exhausted: BOOLEAN
│
├── ## AUDIO
├── ambient_audio_id: VARCHAR(100)
├── music_id: VARCHAR(100)
│
├── ## META
├── estimated_duration_minutes: INT
├── has_skill_checks: BOOLEAN
├── has_reputation_gates: BOOLEAN
└── has_romance_content: BOOLEAN
```

## 19.2 Dialogue Nodes

```sql
TABLE: dialogue_nodes
├── id: UUID [PK]
├── tree_id: FK -> dialogue_trees
├── node_type: ENUM(dialogue_node_type)
│
├── ## CONTENT
├── speaker_type: ENUM(speaker_type)
├── speaker_npc_id: FK -> npcs
├── speaker_name_override: VARCHAR(50)
├── text: TEXT
├── text_variations: JSONB
│
├── ## AUDIO
├── voice_clip_id: VARCHAR(100)
├── voice_emotion: VARCHAR(30)
│
├── ## DISPLAY
├── portrait_expression: VARCHAR(30)
├── animation_id: VARCHAR(100)
├── camera_angle: VARCHAR(50)
│
├── ## FLOW
├── next_node_id: FK -> dialogue_nodes
├── responses: JSONB
├── auto_advance: BOOLEAN
├── advance_delay_seconds: DECIMAL(4,2)
│
├── ## CONDITIONS
├── display_conditions: JSONB
├── skip_conditions: JSONB
│
├── ## EFFECTS
├── on_display_effects: JSONB
├── flag_changes: JSONB
├── relationship_changes: JSONB
│
├── ## META
├── is_hub: BOOLEAN
├── is_exit: BOOLEAN
├── debug_notes: TEXT
└── localization_key: VARCHAR(100)
```

### SEED: Dialogue Node Types

|Type               |Description                |
|-------------------|---------------------------|
|NPC_LINE           |NPC speaks                 |
|PLAYER_RESPONSE_HUB|Player chooses response    |
|PLAYER_LINE        |Player speaks chosen line  |
|BARK               |Ambient, no UI             |
|NARRATION          |Non-character text         |
|SYSTEM_MESSAGE     |Game information           |
|SKILL_CHECK        |Test before continuing     |
|BRANCH             |Conditional routing        |
|HUB                |Returns here after branches|
|EXIT               |End conversation           |
|JUMP               |Go to different tree       |

## 19.3 Dialogue Responses

```sql
TABLE: dialogue_responses
├── id: UUID [PK]
├── node_id: FK -> dialogue_nodes
├── display_order: INT
│
├── ## CONTENT
├── text: TEXT
├── text_short: VARCHAR(100)
├── text_tooltip: TEXT
│
├── ## STYLE
├── tone: ENUM(dialogue_tone)
├── is_aggressive: BOOLEAN
├── is_flirtatious: BOOLEAN
├── is_humorous: BOOLEAN
├── is_honest: BOOLEAN
│
├── ## CONDITIONS
├── display_conditions: JSONB
├── greyed_conditions: JSONB
├── locked_reason_text: VARCHAR(200)
│
├── ## REQUIREMENTS
├── required_skill: FK -> skill_definitions
├── required_skill_level: INT
├── required_attribute: FK -> attribute_definitions
├── required_attribute_level: INT
├── required_item: FK -> item_definitions
├── required_credits: INT
├── required_reputation: JSONB
├── required_flags: JSONB
│
├── ## SKILL CHECK
├── is_skill_check: BOOLEAN
├── skill_check_skill: FK -> skill_definitions
├── skill_check_difficulty: INT
├── skill_check_hidden: BOOLEAN
├── success_node_id: FK -> dialogue_nodes
├── failure_node_id: FK -> dialogue_nodes
│
├── ## DESTINATION
├── leads_to_node_id: FK -> dialogue_nodes
├── ends_conversation: BOOLEAN
├── starts_combat: BOOLEAN
├── triggers_event_id: FK -> narrative_events
│
├── ## EFFECTS
├── relationship_change: INT
├── reputation_changes: JSONB
├── flag_changes: JSONB
├── grants_items: JSONB
├── removes_items: JSONB
├── grants_xp: INT
├── grants_credits: INT
│
├── ## SPECIAL
├── is_lie: BOOLEAN
├── lie_consequences: JSONB
├── is_bribe: BOOLEAN
├── bribe_amount: INT
├── is_intimidation: BOOLEAN
├── is_seduction: BOOLEAN
└── has_voice_line: BOOLEAN
```

### SEED: Dialogue Tones

|Tone        |Description         |NPC Reaction        |
|------------|--------------------|--------------------|
|NEUTRAL     |Default             |Normal              |
|FRIENDLY    |Warm, kind          |+Relationship       |
|PROFESSIONAL|Business-like       |Neutral             |
|AGGRESSIVE  |Hostile, threatening|Risk combat         |
|THREATENING |Intimidation attempt|Fear or fight       |
|SYMPATHETIC |Understanding       |+Trust              |
|SARCASTIC   |Mocking             |-Relationship       |
|FLIRTATIOUS |Romantic interest   |Varies              |
|DESPERATE   |Begging             |Pity or contempt    |
|CONFIDENT   |Self-assured        |Respect or annoyance|
|NERVOUS     |Uncertain           |Suspicion           |
|MYSTERIOUS  |Cryptic             |Curiosity           |

-----

# 20. QUEST SYSTEM

## 20.1 Quest Definitions

```sql
TABLE: quest_definitions
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
├── description: TEXT
├── summary: TEXT
│
├── ## CLASSIFICATION
├── quest_type: ENUM(quest_type)
├── quest_category: ENUM(quest_category)
├── priority: INT
├── difficulty_rating: INT [1-10]
│
├── ## SOURCE
├── quest_giver_npc_id: FK -> npcs
├── quest_giver_location_id: FK -> locations
├── discovery_method: ENUM(quest_discovery)
├── auto_accept: BOOLEAN
│
├── ## REQUIREMENTS
├── required_tier: INT
├── required_quests: JSONB
├── required_reputation: JSONB
├── required_story_flags: JSONB
│
├── ## STRUCTURE
├── objectives: JSONB
├── is_linear: BOOLEAN
├── has_time_limit: BOOLEAN
├── time_limit_hours: DECIMAL(8,2)
├── fail_on_timeout: BOOLEAN
│
├── ## STAGES
├── stages: JSONB
├── current_stage_description: BOOLEAN
│
├── ## REWARDS
├── xp_reward: INT
├── credit_reward: INT
├── item_rewards: JSONB
├── reputation_rewards: JSONB
├── unlocks_quests: JSONB
│
├── ## FAILURE
├── can_fail: BOOLEAN
├── failure_conditions: JSONB
├── failure_consequences: JSONB
├── restartable_after_failure: BOOLEAN
│
├── ## NARRATIVE
├── arc_id: FK -> story_arcs
├── start_dialogue_id: FK -> dialogue_trees
├── end_dialogue_id: FK -> dialogue_trees
├── affects_ending: BOOLEAN
│
├── ## META
├── is_hidden: BOOLEAN
├── is_secret: BOOLEAN
├── repeatable: BOOLEAN
├── cooldown_hours: INT
└── display_in_tracker: BOOLEAN
```

### SEED: Quest Types

|Type        |Description         |Tracking              |
|------------|--------------------|----------------------|
|MAIN_STORY  |Critical path       |Always visible        |
|MAJOR_SIDE  |Significant optional|Visible               |
|MINOR_SIDE  |Small optional      |Visible               |
|FACTION     |Faction-specific    |If discovered         |
|DAILY       |Repeating daily     |Visible               |
|BOUNTY      |Target elimination  |If accepted           |
|EXPLORATION |Discovery-based     |Hidden until found    |
|COLLECTION  |Gather items        |Visible               |
|RELATIONSHIP|NPC-focused         |If relationship exists|
|SECRET      |Hidden content      |Never visible         |

## 20.2 Quest Objectives

```sql
TABLE: quest_objectives
├── id: UUID [PK]
├── quest_definition_id: FK -> quest_definitions
├── sequence_order: INT
│
├── ## CONTENT
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
├── target_quantity: INT
├── target_coordinates: POINT
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
├── ## FLOW
├── leads_to_objectives: JSONB
├── mutually_exclusive_with: JSONB
└── unlocks_dialogue: FK -> dialogue_trees
```

## 20.3 Character Quests

```sql
TABLE: character_quests
├── id: UUID [PK]
├── character_id: FK -> characters
├── quest_definition_id: FK -> quest_definitions
├── accepted_at: TIMESTAMP
│
├── ## STATE
├── status: ENUM(quest_status)
├── current_stage: INT
├── current_objectives: JSONB
├── is_tracked: BOOLEAN
│
├── ## PROGRESS
├── objectives_completed: JSONB
├── objectives_failed: JSONB
├── optional_objectives_completed: JSONB
├── choices_made: JSONB
│
├── ## TIMING
├── deadline: TIMESTAMP
├── time_spent_seconds: INT
│
├── ## INSTANCE
├── seed: BIGINT
├── instance_variables: JSONB
├── spawned_npcs: JSONB
│
├── ## COMPLETION
├── completed_at: TIMESTAMP
├── completion_type: ENUM(completion_type)
├── rewards_claimed: BOOLEAN
├── rewards_received: JSONB
│
├── ## META
├── times_completed: INT
├── best_time_seconds: INT
└── notes: TEXT
```

-----

# 21. ACHIEVEMENT SYSTEM

## 21.1 Achievement Definitions

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
├── ## DISPLAY
├── icon_asset: VARCHAR(200)
├── icon_locked_asset: VARCHAR(200)
├── banner_asset: VARCHAR(200)
│
├── ## META
├── is_missable: BOOLEAN
└── is_one_per_playthrough: BOOLEAN
```

### SEED: Achievement Categories

|Category   |Description           |Examples                 |
|-----------|----------------------|-------------------------|
|STORY      |Story completion      |“Finished Chapter 1”     |
|PROGRESSION|Tier/rating milestones|“Reached Tier 5”         |
|DELIVERY   |Delivery records      |“1000 Deliveries”        |
|COMBAT     |Combat feats          |“10 Kills One Mission”   |
|EXPLORATION|Discovery             |“Found All Interstitials”|
|SOCIAL     |Relationships         |“Max Relationship”       |
|COLLECTION |Gathering             |“All Augment Types”      |
|CHALLENGE  |Difficulty            |“Ironman Complete”       |
|SECRET     |Hidden                |“???”                    |
|ENDINGS    |Conclusion            |“Achieved Ascension”     |

## 21.2 Character Achievements

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

## 21.3 Milestone Tracking

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
├── display_order: INT
│
├── ## TRACKING
├── tracked_stat: VARCHAR(100)
├── thresholds: JSONB
├── display_format: VARCHAR(50)
│
├── ## REWARDS
├── rewards_per_threshold: JSONB
│
├── ## DISPLAY
├── icon_asset: VARCHAR(200)
├── show_on_profile: BOOLEAN
└── leaderboard_eligible: BOOLEAN
```

### SEED: Milestones

|Stat              |Thresholds              |Rewards          |
|------------------|------------------------|-----------------|
|Total Deliveries  |10, 100, 500, 1000, 5000|Titles, Cosmetics|
|Distance Traveled |100km, 1000km, 10000km  |Vehicle unlocks  |
|Credits Earned    |10k, 100k, 1M, 10M      |Financial perks  |
|Enemies Defeated  |10, 50, 100, 500        |Combat bonuses   |
|Perfect Deliveries|5, 25, 100, 500         |Rating multiplier|
|Time Played       |10h, 50h, 100h, 500h    |Veteran rewards  |
