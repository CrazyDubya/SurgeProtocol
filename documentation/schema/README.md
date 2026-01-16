# Schema Documentation Index

This directory contains detailed design documentation for each game system. These are comprehensive reference materials created during the design phase and have been superseded by consolidated guides.

## Quick Navigation

For new agents:
- **Start with**: `INFRASTRUCTURE_EXAMINATION.md` (main repo root)
- **Then read**: `REALTIME_MONITORING_GUIDE.md` (main repo root)
- **API details**: `API_SPECIFICATION.md` (main repo root)
- **Implementation**: `IMPLEMENTATION_PLAN.md` (main repo root)

## Detailed Schema Files (Reference Only)

These files contain granular details about each system if you need deep dives:

1. **1CoreCharacter.md** - Character progression, attributes, rating system
2. **2Augmentation.md** - Cybernetics, body locations, humanity system
3. **3SkillsEquipment.md** - Skills, weapons, armor, vehicles, drones
4. **4MissionWorldNPC.md** - Missions, complications, locations, NPCs
5. **5EconomyContracts.md** - Currency, vendors, contracts, debts
6. **6CombatStatus.md** - Combat mechanics, conditions, addictions, status effects
7. **7narrativedialogue.md** - Story arcs, dialogue trees, quests, achievements
8. **8MetaSystems.md** - Game configuration, time, weather, localization
9. **9Persistence.md** - Save systems, player profiles, analytics
10. **10MultiplayerSocial.md** - Crews, friendships, leaderboards, messaging
11. **11AnalyticsConfigEnum.md** - Enums and analytics configuration

## When to Use These Files

Only refer to these files if you need:
- Detailed field-level database schema information
- Specific enum values and constants
- Deep implementation details for a particular system

For most work, the consolidated guides in the main directory are more efficient.

## Database Tables by Category

Quick mapping to find which file has your table:

**Character System** (1) - 9 tables
- characters, character_attributes, character_skills, etc.

**Augmentation** (2) - 8 tables
- augment_definitions, character_augments, humanity_thresholds, etc.

**Equipment** (3) - 14 tables
- weapon_definitions, armor_definitions, vehicle_definitions, etc.

**Missions & World** (4) - 11 tables
- mission_definitions, locations, npc_definitions, factions, etc.

**Economy** (5) - 10 tables
- currency_definitions, vendor_inventories, contracts, debts, etc.

**Combat** (6) - 10 tables
- combat_instances, damage_type_definitions, conditions, addictions, etc.

**Narrative** (7) - 13 tables
- story_arcs, dialogue_trees, quests, achievements, etc.

**Game Configuration** (8) - game_config, game_time_state, weather_conditions

**Persistence & Social** (9) - 18 tables
- save_games, player_profiles, crews, leaderboards, analytics, etc.

**Multiplayer/Social** (10) - messaging, notifications, crew systems

**Enums & Analytics** (11) - 36 enum tables + analytics setup

---

**Archived**: These files were organized into `/documentation/schema/` to declutter the main repository and prevent automatic inclusion in onboarding checklists. Refer to consolidated guides in the main directory for current development.
