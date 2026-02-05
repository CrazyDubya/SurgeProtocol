# Database Usage Audit Report

## Summary

- **Total Schema Tables**: 98 (29 enum, 69 data)
- **Tables with Code Usage**: 32 tables (~33%)
- **Tables with Tests**: 14 tables (~14%)
- **Placeholder/Unused Tables**: 66 tables (~67%)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Complete implementation with CRUD operations |
| ⚠️ | Partial implementation (read-only or basic insert) |
| 🔲 | Schema defined, no code usage |
| 🧪 | Has test coverage |

---

## Core Character System

| Table | Status | File:Line | Test | Notes |
|-------|--------|-----------|------|-------|
| `characters` | ✅🧪 | `db/queries.ts:56,69,82,106,142,160,178,200,243` | character.test.ts | Full CRUD, XP, rating, location, health, humanity |
| `character_attributes` | ✅🧪 | `db/queries.ts:269-278,796-809` | character.test.ts | Join queries, effective values |
| `attribute_definitions` | ⚠️🧪 | `db/queries.ts:269,291` `cache/index.ts:230` | character.test.ts | Read-only, cached |
| `tracks` | ⚠️ | `cache/index.ts:257` | - | Read-only from cache as `track_definitions` |
| `specializations` | 🔲 | - | - | Schema only |
| `tier_definitions` | ⚠️ | `cache/index.ts:248` | - | Read-only from cache |
| `rating_components` | ✅🧪 | `db/queries.ts:125,646-706` | character.test.ts, mission.test.ts | Insert, update on mission complete |
| `character_backstory` | 🔲 | - | - | Schema only |
| `character_memories` | ⚠️ | `api/world/index.ts:511` | - | Insert only |

---

## Augmentation System

| Table | Status | File:Line | Test | Notes |
|-------|--------|-----------|------|-------|
| `body_locations` | ⚠️ | `api/augmentations/index.ts:589` | augmentation.test.ts | Read-only validation |
| `augment_definitions` | ⚠️ | `api/augmentations/index.ts:493` | augmentation.test.ts | Read by ID/code |
| `augment_manufacturers` | 🔲 | - | - | Schema only |
| `character_augments` | ✅🧪 | `api/augmentations/index.ts:699,874,1040` | augmentation.test.ts | Install, update state, remove |
| `augment_sets` | 🔲 | - | - | Schema only, synergy not implemented |
| `humanity_thresholds` | ⚠️ | `api/augmentations/index.ts:429,779,1157` | - | Read-only for threshold checks |
| `humanity_events` | ⚠️ | `api/augmentations/index.ts:737,792,1060` | - | Insert, partial update |
| `black_market_payment_types` | 🔲 | - | - | Schema only |

---

## Skills, Abilities & Equipment

| Table | Status | File:Line | Test | Notes |
|-------|--------|-----------|------|-------|
| `skill_definitions` | ⚠️🧪 | `db/queries.ts:813-827,1121-1136` `cache/index.ts:221` | mission.test.ts | Read-only, cached |
| `character_skills` | ✅🧪 | `db/queries.ts:813-827` `api/skills/index.ts:365,377` | mission.test.ts | Read, update level, insert new |
| `ability_definitions` | 🔲 | - | - | Schema only |
| `character_abilities` | 🔲 | - | - | Schema only |
| `passive_definitions` | 🔲 | - | - | Schema only |
| `item_definitions` | ⚠️ | `cache/index.ts:212` `api/items/index.ts:143` | - | Read-only, cached |
| `weapon_definitions` | 🔲 | - | - | Schema only, weapons use item_definitions.properties JSON |
| `armor_definitions` | 🔲 | - | - | Schema only, armor uses item_definitions.properties JSON |
| `character_inventory` | ✅🧪 | `db/queries.ts:539-637` `api/items/index.ts:404,413,524,538,611` | character.test.ts | Full CRUD, equip/unequip |
| `vehicle_definitions` | 🔲 | - | - | Schema only |
| `character_vehicles` | 🔲 | - | - | Schema only |
| `drone_definitions` | 🔲 | - | - | Schema only |
| `character_drones` | 🔲 | - | - | Schema only |
| `consumable_definitions` | 🔲 | - | - | Schema only |

---

## Missions, World & NPCs

| Table | Status | File:Line | Test | Notes |
|-------|--------|-----------|------|-------|
| `regions` | 🔲 | - | - | Schema only |
| `locations` | ⚠️🧪 | `api/world/index.ts:133,172,217,234,362,377,451,457,556,573` | mission.test.ts | Read-only queries |
| `routes` | 🔲 | - | - | Schema only |
| `factions` | ✅🧪 | `db/queries.ts:456-459` `api/faction/index.ts:144,491` `cache/index.ts:239` | - | Read-only, cached |
| `npc_definitions` | ⚠️ | `db/queries.ts:923-950` `api/faction/index.ts:422` | - | Read for combat data |
| `npc_instances` | 🔲 | - | - | Schema only |
| `character_reputations` | ✅ | `db/queries.ts:464-521` `api/faction/index.ts:535,545,589` | - | Full CRUD |
| `mission_definitions` | ⚠️🧪 | `db/queries.ts:309-340` `cache/index.ts:269` | mission.test.ts | Read-only |
| `mission_objectives` | 🔲 | - | - | Schema only, uses checkpoints instead |
| `complication_definitions` | 🔲 | - | - | Schema only |
| `character_missions` | ✅🧪 | `db/queries.ts:345-446` | mission.test.ts | Accept, update status |
| `mission_instances` | ✅🧪 | `api/mission/index.ts:401,456,482,504,706,807,948,969,1026,1490,1987,2202,2352` | mission.test.ts | Full lifecycle |
| `mission_checkpoints` | ✅ | `api/mission/index.ts:194,439,905,1046,1173,1843,2037,2220,2370` | - | Create, complete |
| `mission_log` | ✅ | `api/mission/index.ts:449,577,749,922,988` | - | Insert event logs |

---

## Economy Tables

| Table | Status | File:Line | Test | Notes |
|-------|--------|-----------|------|-------|
| `currency_definitions` | 🔲 | - | - | Schema only |
| `character_finances` | ✅ | `api/economy/index.ts:167,278,301,531,563,576,718` `api/quests/index.ts:662,793` | - | Balance operations |
| `financial_transactions` | ✅ | `api/economy/index.ts:309,601,731` | - | Transaction logging |
| `vendor_inventories` | ⚠️ | `api/economy/index.ts:500,646,774` | - | Read-only |
| `contract_definitions` | 🔲 | - | - | Schema only |
| `character_contracts` | 🔲 | - | - | Schema only |
| `debts` | 🔲 | - | - | Schema only |
| `black_market_contacts` | 🔲 | - | - | Schema only |
| `black_market_inventories` | 🔲 | - | - | Schema only |
| `black_market_transactions` | 🔲 | - | - | Schema only |

---

## Combat Tables

| Table | Status | File:Line | Test | Notes |
|-------|--------|-----------|------|-------|
| `damage_type_definitions` | 🔲 | - | - | Schema only, damage types hardcoded in combat.ts |
| `combat_arenas` | 🔲 | - | - | Schema only |
| `combat_encounters` | 🔲 | - | - | Schema only |
| `combat_action_definitions` | 🔲 | - | - | Schema only, actions hardcoded |
| `combat_instances` | 🔲 | - | - | Schema only, combat state in memory |
| `condition_definitions` | ⚠️ | `db/queries.ts:1221-1234` | - | Read for condition checks |
| `character_conditions` | ⚠️ | `api/items/index.ts:374,388` `db/queries.ts:1221` | - | Insert, update |
| `addiction_types` | 🔲 | - | - | Schema only |
| `character_addictions` | 🔲 | - | - | Schema only |
| `cyberpsychosis_episodes` | 🔲 | - | - | Schema only |

---

## Narrative System Tables

| Table | Status | File:Line | Test | Notes |
|-------|--------|-----------|------|-------|
| `story_arcs` | 🔲 | - | - | Schema only |
| `story_chapters` | 🔲 | - | - | Schema only |
| `narrative_events` | 🔲 | - | - | Schema only |
| `story_flags` | 🔲 | - | - | Schema only |
| `character_story_state` | 🔲 | - | - | Schema only |
| `dialogue_trees` | 🔲 | - | - | Schema only |
| `dialogue_nodes` | 🔲 | - | - | Schema only |
| `dialogue_responses` | ⚠️ | `api/mission/index.ts:1643` | - | Read-only for dialogue |
| `quest_definitions` | ⚠️🧪 | `api/quests/index.ts:434,1006` | quest.test.ts | Read-only |
| `quest_objectives` | ⚠️ | `api/quests/index.ts:180,330,616` | - | Read-only |
| `character_quests` | ✅🧪 | `api/quests/index.ts:556,673,849,898,978,1035` | quest.test.ts | Full lifecycle |
| `achievement_definitions` | 🔲 | - | - | Schema only |
| `character_achievements` | 🔲 | - | - | Schema only |
| `milestone_definitions` | 🔲 | - | - | Schema only |

---

## Persistence & Social Tables

| Table | Status | File:Line | Test | Notes |
|-------|--------|-----------|------|-------|
| `save_games` | 🔲 | - | - | Schema only |
| `save_data_chunks` | 🔲 | - | - | Schema only |
| `checkpoints` | 🔲 | - | - | Schema only |
| `player_profiles` | 🔲 | - | - | Schema only |
| `player_settings` | 🔲 | - | - | Schema only |
| `friendships` | 🔲 | - | - | Schema only |
| `crews` | 🔲 | - | - | Schema only |
| `crew_memberships` | 🔲 | - | - | Schema only |
| `leaderboard_definitions` | 🔲 | - | - | Schema only |
| `leaderboard_entries` | 🔲 | - | - | Schema only |
| `messages` | 🔲 | - | - | Schema only |
| `notifications` | 🔲 | - | - | Schema only |
| `users` | ✅🧪 | `api/auth/index.ts:102,196` | auth.test.ts | Insert, update login |

---

## Analytics & Config Tables

| Table | Status | File:Line | Test | Notes |
|-------|--------|-----------|------|-------|
| `analytics_events` | 🔲 | - | - | Schema only |
| `play_sessions` | 🔲 | - | - | Schema only |
| `game_config` | 🔲 | - | - | Schema only |
| `difficulty_definitions` | 🔲 | - | - | Schema only |
| `localized_strings` | 🔲 | - | - | Schema only |
| `translations` | 🔲 | - | - | Schema only |
| `generation_templates` | 🔲 | - | - | Schema only |
| `loot_tables` | 🔲 | - | - | Schema only |
| `weather_conditions` | 🔲 | - | - | Schema only |
| `game_time_state` | 🔲 | - | - | Schema only |
| `admin_audit_log` | ⚠️ | `middleware/admin.ts:95` | - | Insert only |

---

## Additional Tables Used (Not in Primary Schema)

| Table | Status | File:Line | Test | Notes |
|-------|--------|-----------|------|-------|
| `players` | ⚠️🧪 | Tests only | auth.test.ts | Referenced in tests, linked to users |
| `faction_perks` | ⚠️ | `api/faction/index.ts:260` | - | Read-only |
| `faction_wars` | ⚠️ | `api/faction/index.ts:365` | - | Read-only |
| `character_faction_standing` | ✅ | `api/quests/index.ts:835` `api/mission/index.ts:1727` | - | Upsert operations |
| `mission_requirements` | ⚠️ | `api/mission/index.ts:243,370` | - | Read-only |
| `mission_rewards` | ⚠️ | `api/mission/index.ts:249` | - | Read-only |
| `mission_checkpoint_definitions` | ⚠️ | `api/mission/index.ts:429` | - | Read-only |

---

## Implementation Gaps Analysis

### Completely Unused Systems (Schema Only)
1. **Vehicles & Drones** - No code for vehicle/drone management
2. **Combat Arenas/Encounters** - Combat runs in-memory, no persistence
3. **Full Narrative System** - story_arcs, chapters, events unused
4. **Save System** - No save/load functionality
5. **Social Features** - crews, friendships, messages unused
6. **Leaderboards** - Schema exists, no implementation
7. **Contracts & Debts** - Economic contracts not implemented
8. **Black Market** - Tables exist but no API endpoints
9. **Addiction System** - character_addictions unused
10. **Achievement System** - No tracking implemented
11. **Weather/Time** - No dynamic world state
12. **Localization** - No i18n implementation
13. **Analytics** - No event tracking

### Partial Implementations
1. **Augment Sets** - Individual augments work, set bonuses don't
2. **Weapon/Armor Definitions** - Use JSON in item_definitions instead
3. **NPC Instances** - NPCs are stateless (no per-save state)
4. **Dialogue System** - Basic response reads, no full tree traversal
5. **Conditions** - Can add conditions, no tick/decay logic

---

## Test Coverage Summary

| Area | Test File | Tables Covered |
|------|-----------|----------------|
| Auth | `auth.test.ts` | users, players |
| Character | `character.test.ts` | characters, character_attributes, rating_components, character_inventory |
| Mission | `mission.test.ts` | mission_definitions, mission_instances, locations |
| Augmentation | `augmentation.test.ts` | augment_definitions, character_augments, body_locations |
| Quest | `quest.test.ts` | quest_definitions, character_quests |
| Combat | `combat.test.ts` | Unit tests only (dice, formulas) |
| Rating | `rating.test.ts` | Unit tests only (calculation) |

---

## Recommendations

### Priority 1 - Core Functionality Gaps
- Implement save/load system using `save_games`, `save_data_chunks`
- Add vehicle management for delivery gameplay
- Complete dialogue tree traversal

### Priority 2 - Feature Enhancement
- Implement augment set bonuses
- Add condition tick/decay system
- Create black market API endpoints

### Priority 3 - Long-term
- Social features (crews, leaderboards)
- Achievement tracking
- Analytics pipeline
- Full narrative system
