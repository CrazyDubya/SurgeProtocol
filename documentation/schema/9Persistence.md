# SURGE PROTOCOL: Complete Data Architecture

## Part 9: Persistence - Save System

-----

# 16. SAVE SYSTEM

## 16.1 Save Games

```sql
TABLE: save_games
├── id: UUID [PK]
├── player_id: UUID [external user ID]
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
│
├── ## IDENTITY
├── save_name: VARCHAR(100)
├── save_type: ENUM(save_type)
├── save_slot: INT
├── is_auto_save: BOOLEAN
├── is_quicksave: BOOLEAN
│
├── ## CHARACTER
├── character_id: FK -> characters
├── character_name: VARCHAR(100)
├── character_tier: INT
├── character_track: VARCHAR(50)
│
├── ## PROGRESS
├── playtime_seconds: BIGINT
├── story_progress_percent: DECIMAL(5,2)
├── main_arc_name: VARCHAR(100)
├── main_mission_name: VARCHAR(100)
│
├── ## LOCATION
├── current_location_id: FK -> locations
├── current_location_name: VARCHAR(100)
├── current_coordinates: POINT
│
├── ## THUMBNAIL
├── screenshot_asset: VARCHAR(200)
├── thumbnail_asset: VARCHAR(200)
│
├── ## VERSION
├── game_version: VARCHAR(20)
├── save_version: INT
├── compatible_versions: JSONB
│
├── ## STATE
├── is_valid: BOOLEAN
├── is_corrupted: BOOLEAN
├── is_ironman: BOOLEAN
├── difficulty: ENUM(difficulty_level)
│
├── ## METADATA
├── total_missions_completed: INT
├── total_credits_earned: BIGINT
├── total_distance_km: DECIMAL(12,2)
├── enemies_defeated: INT
├── deaths: INT
│
├── ## CLOUD
├── cloud_synced: BOOLEAN
├── cloud_sync_at: TIMESTAMP
├── cloud_id: VARCHAR(100)
│
├── ## INTEGRITY
├── data_checksum: VARCHAR(64)
└── tamper_detected: BOOLEAN
```

### SEED: Save Types

|Type      |Description              |
|----------|-------------------------|
|MANUAL    |Player-initiated save    |
|AUTO      |Automatic periodic save  |
|QUICK     |F5 quicksave             |
|CHECKPOINT|Mission/story checkpoint |
|IRONMAN   |Single overwriting save  |
|BACKUP    |Pre-major-decision backup|
|CLOUD     |Cloud sync copy          |

## 16.2 Save Data Chunks

```sql
TABLE: save_data_chunks
├── id: UUID [PK]
├── save_id: FK -> save_games
├── chunk_type: ENUM(save_chunk_type)
│
├── ## DATA
├── data: JSONB [compressed state]
├── data_version: INT
├── compressed: BOOLEAN
├── compressed_size_bytes: INT
├── uncompressed_size_bytes: INT
│
├── ## INTEGRITY
├── checksum: VARCHAR(64)
├── is_valid: BOOLEAN
│
├── ## DEPENDENCIES
├── depends_on_chunks: JSONB
└── load_priority: INT
```

### SEED: Save Chunk Types

|Chunk                  |Contents                |Est. Size|
|-----------------------|------------------------|---------|
|CHARACTER_CORE         |Base character data     |50 KB    |
|CHARACTER_INVENTORY    |All items               |100 KB   |
|CHARACTER_AUGMENTS     |Installed chrome        |20 KB    |
|CHARACTER_SKILLS       |Skills, abilities       |30 KB    |
|CHARACTER_RELATIONSHIPS|NPC relations           |50 KB    |
|WORLD_STATE            |Global flags            |50 KB    |
|LOCATION_STATES        |Location changes        |100 KB   |
|NPC_STATES             |NPC instances           |200 KB   |
|FACTION_STATES         |Faction standings       |50 KB    |
|MISSION_STATES         |Active/complete missions|100 KB   |
|QUEST_STATES           |Quest progress          |50 KB    |
|STORY_STATE            |Narrative flags         |50 KB    |
|VEHICLE_STATES         |Owned vehicles          |30 KB    |
|FINANCIAL_STATE        |Economy data            |20 KB    |
|SETTINGS               |Player preferences      |10 KB    |

## 16.3 Checkpoints

```sql
TABLE: checkpoints
├── id: UUID [PK]
├── save_id: FK -> save_games
├── created_at: TIMESTAMP
│
├── ## CONTEXT
├── checkpoint_type: ENUM(checkpoint_type)
├── trigger_source: VARCHAR(100)
├── description: TEXT
│
├── ## LOCATION
├── location_id: FK -> locations
├── coordinates: POINT
│
├── ## STATE
├── critical_state: JSONB
│
├── ## LIMITS
├── expires_at: TIMESTAMP
├── is_persistent: BOOLEAN
│
├── ## META
├── replay_possible: BOOLEAN
└── restore_count: INT
```

### SEED: Checkpoint Types

|Type           |Trigger                   |
|---------------|--------------------------|
|MISSION_START  |Beginning any mission     |
|MISSION_STAGE  |Mission objective complete|
|STORY_BEAT     |Major narrative moment    |
|LOCATION_CHANGE|Entering new area         |
|COMBAT_START   |Before combat encounter   |
|SAFE_ZONE      |Entering safe area        |
|PRE_CHOICE     |Before major decision     |

-----

# 17. PLAYER PROFILES (Meta-Game)

## 17.1 Player Profiles

```sql
TABLE: player_profiles
├── id: UUID [PK]
├── external_id: VARCHAR(100)
├── created_at: TIMESTAMP
├── last_seen: TIMESTAMP
│
├── ## IDENTITY
├── display_name: VARCHAR(50)
├── display_name_history: JSONB
├── avatar_asset: VARCHAR(200)
├── bio: TEXT
│
├── ## PRIVACY
├── privacy_level: ENUM(privacy_level)
├── show_online_status: BOOLEAN
├── allow_friend_requests: BOOLEAN
│
├── ## STATS
├── total_playtime_hours: DECIMAL(10,2)
├── achievement_points: INT
├── achievement_count: INT
├── characters_created: INT
├── highest_tier_reached: INT
│
├── ## SOCIAL
├── friend_count: INT
├── crew_id: FK -> crews
├── crew_rank: VARCHAR(30)
│
├── ## MODERATION
├── is_banned: BOOLEAN
├── ban_expires_at: TIMESTAMP
├── warnings: JSONB
└── reputation_score: INT
```

## 17.2 Player Settings

```sql
TABLE: player_settings
├── id: UUID [PK]
├── player_id: FK -> player_profiles [UNIQUE]
│
├── ## DISPLAY
├── resolution: VARCHAR(20)
├── fullscreen_mode: ENUM(fullscreen_mode)
├── vsync: BOOLEAN
├── frame_rate_limit: INT
├── brightness: DECIMAL(3,2)
├── gamma: DECIMAL(3,2)
│
├── ## GRAPHICS
├── quality_preset: ENUM(quality_preset)
├── texture_quality: INT [1-5]
├── shadow_quality: INT [1-5]
├── effects_quality: INT [1-5]
├── draw_distance: INT [1-5]
├── antialiasing: VARCHAR(20)
│
├── ## AUDIO
├── master_volume: DECIMAL(3,2)
├── music_volume: DECIMAL(3,2)
├── sfx_volume: DECIMAL(3,2)
├── voice_volume: DECIMAL(3,2)
├── ambient_volume: DECIMAL(3,2)
│
├── ## CONTROLS
├── mouse_sensitivity: DECIMAL(4,2)
├── invert_y: BOOLEAN
├── controller_vibration: BOOLEAN
├── key_bindings: JSONB
├── controller_bindings: JSONB
│
├── ## GAMEPLAY
├── auto_save_frequency: INT
├── difficulty_default: ENUM(difficulty_level)
├── tutorial_enabled: BOOLEAN
├── hints_enabled: BOOLEAN
├── subtitles_enabled: BOOLEAN
├── subtitle_size: INT
│
├── ## ACCESSIBILITY
├── colorblind_mode: ENUM(colorblind_mode)
├── screen_shake: DECIMAL(3,2)
├── motion_blur: BOOLEAN
├── flash_reduction: BOOLEAN
├── text_to_speech: BOOLEAN
│
├── ## LANGUAGE
├── language_ui: VARCHAR(10)
├── language_audio: VARCHAR(10)
└── language_subtitles: VARCHAR(10)
```
