# SURGE PROTOCOL: Complete Data Architecture

## Part 10: Multiplayer & Social Systems

-----

# 18. SOCIAL SYSTEMS

## 18.1 Friendships

```sql
TABLE: friendships
├── id: UUID [PK]
├── player_id: FK -> player_profiles
├── friend_id: FK -> player_profiles
├── created_at: TIMESTAMP
│
├── ## STATUS
├── status: ENUM(friendship_status)
├── initiated_by: FK -> player_profiles
│
├── ## CATEGORIZATION
├── nickname: VARCHAR(50)
├── group_name: VARCHAR(50)
├── favorite: BOOLEAN
│
├── ## INTERACTION
├── last_interaction: TIMESTAMP
├── interaction_count: INT
├── times_played_together: INT
│
├── ## PERMISSIONS
├── can_join_session: BOOLEAN
├── can_see_location: BOOLEAN
├── can_send_items: BOOLEAN
└── notification_level: ENUM(notification_level)
```

### SEED: Friendship Statuses

|Status          |Description                    |
|----------------|-------------------------------|
|PENDING_SENT    |Request sent, awaiting response|
|PENDING_RECEIVED|Request received               |
|ACCEPTED        |Active friendship              |
|BLOCKED         |Blocked by this player         |
|REMOVED         |Previously friends             |

## 18.2 Crews (Guilds)

```sql
TABLE: crews
├── id: UUID [PK]
├── created_at: TIMESTAMP
│
├── ## IDENTITY
├── name: VARCHAR(50) [UNIQUE]
├── tag: VARCHAR(5) [UNIQUE]
├── description: TEXT
├── motto: VARCHAR(200)
├── emblem_asset: VARCHAR(200)
├── colors: JSONB -- {primary, secondary}
│
├── ## LEADERSHIP
├── founder_id: FK -> player_profiles
├── leader_id: FK -> player_profiles
├── officers: JSONB
│
├── ## MEMBERSHIP
├── member_count: INT
├── max_members: INT
├── recruitment_status: ENUM(recruitment_status)
├── requirements: JSONB
├── application_questions: JSONB
│
├── ## STATS
├── total_deliveries: BIGINT
├── total_credits_earned: BIGINT
├── average_tier: DECIMAL(3,1)
├── competition_wins: INT
├── crew_rating: INT
│
├── ## RESOURCES
├── crew_bank_balance: BIGINT
├── shared_inventory: JSONB
│
├── ## SETTINGS
├── privacy: ENUM(privacy_level)
├── member_permissions: JSONB
├── rank_definitions: JSONB
└── is_active: BOOLEAN
```

## 18.3 Crew Membership

```sql
TABLE: crew_memberships
├── id: UUID [PK]
├── crew_id: FK -> crews
├── player_id: FK -> player_profiles
├── joined_at: TIMESTAMP
│
├── ## RANK
├── rank: VARCHAR(50)
├── rank_order: INT
├── custom_title: VARCHAR(50)
│
├── ## PERMISSIONS
├── can_invite: BOOLEAN
├── can_kick: BOOLEAN
├── can_promote: BOOLEAN
├── can_edit_settings: BOOLEAN
├── can_access_bank: BOOLEAN
├── bank_withdraw_limit: INT
│
├── ## CONTRIBUTION
├── deliveries_for_crew: INT
├── credits_contributed: BIGINT
├── events_participated: INT
├── recruitment_count: INT
│
├── ## STATUS
├── is_active: BOOLEAN
├── last_active: TIMESTAMP
├── on_probation: BOOLEAN
└── notes: TEXT
```

## 18.4 Leaderboards

```sql
TABLE: leaderboard_definitions
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
├── description: TEXT
│
├── ## TYPE
├── leaderboard_type: ENUM(leaderboard_type)
├── scope: ENUM(leaderboard_scope)
├── tracked_stat: VARCHAR(100)
├── sort_direction: ENUM(sort_direction)
│
├── ## TIMING
├── reset_frequency: ENUM(reset_frequency)
├── current_period_start: TIMESTAMP
├── current_period_end: TIMESTAMP
│
├── ## DISPLAY
├── visible: BOOLEAN
├── display_top_n: INT
├── show_player_rank: BOOLEAN
├── show_nearby_ranks: INT
│
├── ## REWARDS
├── period_end_rewards: JSONB
│
├── ## INTEGRITY
├── anti_cheat_rules: JSONB
├── minimum_playtime: INT
└── minimum_tier: INT
```

### SEED: Leaderboard Types

|Code           |Name              |Tracked Stat      |Reset  |
|---------------|------------------|------------------|-------|
|DELIVERY_WEEKLY|Weekly Deliveries |deliveries_count  |Weekly |
|RATING_ALL     |Top Carrier Rating|carrier_rating    |Never  |
|SPEED_DAILY    |Fastest Courier   |avg_delivery_time |Daily  |
|CREDITS_MONTHLY|Big Earners       |credits_earned    |Monthly|
|DISTANCE_ALL   |Road Warriors     |total_distance_km |Never  |
|PERFECT_WEEKLY |Perfectionist     |perfect_deliveries|Weekly |
|CREW_MONTHLY   |Top Crews         |crew_deliveries   |Monthly|

## 18.5 Leaderboard Entries

```sql
TABLE: leaderboard_entries
├── id: UUID [PK]
├── leaderboard_id: FK -> leaderboard_definitions
├── player_id: FK -> player_profiles
├── period_id: VARCHAR(20)
│
├── ## SCORE
├── score: BIGINT
├── rank: INT
├── rank_change: INT
│
├── ## DETAILS
├── character_name: VARCHAR(100)
├── character_tier: INT
├── character_track: VARCHAR(50)
│
├── ## TIMING
├── first_entry: TIMESTAMP
├── last_update: TIMESTAMP
│
├── ## VERIFICATION
├── verified: BOOLEAN
└── flagged_for_review: BOOLEAN
```

-----

# 19. MESSAGING & COMMUNICATION

## 19.1 Messages

```sql
TABLE: messages
├── id: UUID [PK]
├── created_at: TIMESTAMP
│
├── ## PARTICIPANTS
├── sender_id: FK -> player_profiles
├── recipient_id: FK -> player_profiles
├── recipient_crew_id: FK -> crews
│
├── ## CONTENT
├── message_type: ENUM(message_type)
├── subject: VARCHAR(200)
├── body: TEXT
├── attachments: JSONB
│
├── ## STATE
├── is_read: BOOLEAN
├── read_at: TIMESTAMP
├── is_deleted_sender: BOOLEAN
├── is_deleted_recipient: BOOLEAN
│
├── ## THREADING
├── thread_id: UUID
├── reply_to_id: FK -> messages
│
├── ## MODERATION
├── is_reported: BOOLEAN
├── is_moderated: BOOLEAN
└── moderation_action: VARCHAR(50)
```

### SEED: Message Types

|Type             |Description           |
|-----------------|----------------------|
|DIRECT           |Player to player      |
|CREW_ANNOUNCEMENT|Crew-wide message     |
|SYSTEM           |Game notifications    |
|FRIEND_REQUEST   |Friendship invitation |
|CREW_INVITE      |Crew membership invite|
|GIFT             |Item/credit gift      |
|CHALLENGE        |Competition invitation|

## 19.2 Notifications

```sql
TABLE: notifications
├── id: UUID [PK]
├── player_id: FK -> player_profiles
├── created_at: TIMESTAMP
│
├── ## CONTENT
├── notification_type: ENUM(notification_type)
├── title: VARCHAR(200)
├── body: TEXT
├── icon: VARCHAR(100)
├── action_url: VARCHAR(500)
├── action_data: JSONB
│
├── ## STATE
├── is_read: BOOLEAN
├── read_at: TIMESTAMP
├── is_dismissed: BOOLEAN
│
├── ## PRIORITY
├── priority: INT [1-5]
├── expires_at: TIMESTAMP
│
├── ## DELIVERY
├── push_sent: BOOLEAN
├── email_sent: BOOLEAN
└── in_game_shown: BOOLEAN
```
