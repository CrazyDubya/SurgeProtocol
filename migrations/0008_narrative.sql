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
