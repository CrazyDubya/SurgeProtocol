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
