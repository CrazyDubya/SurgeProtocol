# SurgeProtocol - Week 2 Development Plan

**Focus: System Integration & API Completion**

The infrastructure is solid - all core mechanics, routes, and real-time systems are built. This week focuses on **wiring systems together** and **completing missing API routes** to make the game playable end-to-end.

---

## Task 1: Integrate Combat into Missions

**Priority:** Critical | **Complexity:** High | **Files:** 3-4

**Goal:** Enable the `COMBAT` mission action to create real combat sessions using the existing Combat Durable Object.

**Current State:**
- Combat DO fully implemented (`src/realtime/combat.ts`)
- Mission action `COMBAT` returns stub success
- No integration path between missions and combat

**Implementation:**
1. Add combat initialization endpoint in mission routes
2. Create enemy combatant definitions from NPC data
3. Scale enemy stats by mission tier
4. Return WebSocket connection info for real-time combat
5. Handle combat completion → mission checkpoint update

**Files to modify:**
- `src/api/mission/index.ts` - Add `processCombatAction()` handler
- `src/db/queries.ts` - Add NPC/enemy queries
- `src/realtime/combat.ts` - Add mission context to combat state

**Acceptance Criteria:**
- [ ] POST `/missions/:id/action { actionType: 'COMBAT' }` creates combat session
- [ ] Combat outcome updates mission state
- [ ] Victory advances checkpoint; defeat fails mission or allows retry

---

## Task 2: Integrate Dialogue into Missions

**Priority:** Critical | **Complexity:** Medium | **Files:** 2-3

**Goal:** Enable the `DIALOGUE` mission action to use the dialogue system with effects that modify game state.

**Current State:**
- Dialogue engine fully implemented (`src/game/dialogue/index.ts`)
- Mission action `DIALOGUE` is a stub
- Dialogue effects defined but never applied

**Implementation:**
1. Add dialogue action processor in mission routes
2. Load NPC dialogue trees from database or seed data
3. Apply dialogue effects to character state (items, rep, flags)
4. Check if dialogue outcomes complete mission objectives

**Files to modify:**
- `src/api/mission/index.ts` - Add `processDialogueAction()` handler
- `src/game/dialogue/index.ts` - Add effect application functions
- `src/db/queries.ts` - Add dialogue state queries

**Acceptance Criteria:**
- [ ] POST `/missions/:id/action { actionType: 'DIALOGUE', npcId, choiceId }` works
- [ ] Dialogue effects modify character inventory/reputation/flags
- [ ] Mission objectives can require specific dialogue outcomes

---

## Task 3: Apply District Events to Missions

**Priority:** High | **Complexity:** Medium | **Files:** 2

**Goal:** Make district events affect mission difficulty, rewards, and availability.

**Current State:**
- District events system complete with 15 event types
- Event modifiers exist (ROUTE_DANGER, MISSION_REWARD, etc.)
- Missions don't check district events

**Implementation:**
1. Query active events when listing available missions
2. Apply event modifiers to mission requirements/rewards
3. Filter missions based on event restrictions (e.g., CORPORATE_LOCKDOWN blocks certain areas)
4. Show event warnings in mission details

**Files to modify:**
- `src/api/mission/index.ts` - Add event modifier application
- `src/game/events/district.ts` - Add mission modifier helpers

**Acceptance Criteria:**
- [ ] GET `/missions/available` applies district event modifiers
- [ ] Mission danger levels increase during GANG_ACTIVITY
- [ ] Mission rewards modified by EVENT_MODIFIER_MISSION_REWARD
- [ ] Some missions unavailable during lockdown events

---

## Task 4: Implement Attribute-Based Skill Checks

**Priority:** High | **Complexity:** Medium | **Files:** 2-3

**Goal:** Make character attributes and skills actually affect skill check outcomes.

**Current State:**
- Attributes stored on characters
- Skill definitions in database
- Skill checks use hardcoded modifiers (0)

**Implementation:**
1. Fetch character's relevant skill level for checks
2. Calculate attribute modifier from base attribute
3. Apply equipment bonuses to checks
4. Apply condition penalties (wounded, etc.)

**Files to modify:**
- `src/api/mission/index.ts` - Update `processSkillCheck()`
- `src/db/queries.ts` - Add skill/attribute query with bonuses
- `src/game/mechanics/dice.ts` - Ensure modifier application

**Acceptance Criteria:**
- [ ] Skill checks use character's actual skill level
- [ ] Attribute modifiers applied (INT for hacking, REF for driving, etc.)
- [ ] Equipped items provide skill bonuses
- [ ] Wounded characters have penalties

---

## Task 5: Add Skills Training API

**Priority:** Medium | **Complexity:** Medium | **Files:** 2

**Goal:** Allow characters to view and train skills using XP.

**Current State:**
- `skills_definitions` table exists
- `character_skills` table exists
- No API routes for skills

**Implementation:**
1. GET `/characters/:id/skills` - List all skills with current levels
2. POST `/characters/:id/skills/:skillId/train` - Spend XP to increase skill
3. Calculate XP cost per level (exponential scaling)
4. Validate skill prerequisites

**New file:**
- `src/api/skills/index.ts`

**Files to modify:**
- `src/index.ts` - Register skills routes
- `src/db/queries.ts` - Add skill training queries

**Acceptance Criteria:**
- [ ] GET `/characters/:id/skills` returns skill list with levels
- [ ] POST train endpoint increases skill level
- [ ] XP cost scales with level (e.g., level * 100 XP)
- [ ] Cannot exceed skill max level

---

## Task 6: Add Quest System API

**Priority:** Medium | **Complexity:** Medium | **Files:** 2-3

**Goal:** Implement quest tracking that spans multiple missions.

**Current State:**
- `quest_definitions` table exists
- `character_quests` table exists
- Dialogue can trigger quests but no tracking

**Implementation:**
1. GET `/characters/:id/quests` - List active/completed quests
2. GET `/characters/:id/quests/:questId` - Quest details with objectives
3. Internal quest progress update functions
4. Quest completion rewards (credits, items, reputation)

**New file:**
- `src/api/quests/index.ts`

**Files to modify:**
- `src/index.ts` - Register quest routes
- `src/db/queries.ts` - Add quest queries
- `src/game/dialogue/index.ts` - Wire up START_QUEST effect

**Acceptance Criteria:**
- [ ] GET `/characters/:id/quests` returns quest list
- [ ] Quests have multiple objectives
- [ ] Mission completion can advance quest objectives
- [ ] Quest completion grants rewards

---

## Task 7: Add Location/Movement API

**Priority:** Medium | **Complexity:** Medium | **Files:** 2

**Goal:** Enable characters to move between locations in the city.

**Current State:**
- `locations` table exists
- `location_connections` table exists (travel routes)
- `district_definitions` table exists
- No movement API

**Implementation:**
1. GET `/world/locations` - List all locations in current district
2. GET `/world/locations/:id` - Location details (vendors, NPCs, connections)
3. POST `/characters/:id/move` - Travel to connected location
4. Apply travel time and district event effects
5. Update character's current location

**New file:**
- `src/api/world/index.ts`

**Files to modify:**
- `src/index.ts` - Register world routes
- `src/db/queries.ts` - Add location queries

**Acceptance Criteria:**
- [ ] GET `/world/locations` returns location list
- [ ] POST move validates connection exists
- [ ] Travel time affected by district events
- [ ] Character location updates in database

---

## Task 8: Add API Integration Tests

**Priority:** High | **Complexity:** Medium | **Files:** 4-5

**Goal:** Add integration tests for critical API flows.

**Current State:**
- Only unit tests for dice/combat/rating mechanics
- Zero API route tests
- Zero integration tests

**Implementation:**
1. Set up test harness with mock Cloudflare bindings
2. Test auth flow: register → login → refresh → logout
3. Test character flow: create → select → get stats
4. Test mission flow: list → accept → action → complete
5. Test economy flow: balance → buy → sell → transfer

**New files:**
- `tests/integration/auth.test.ts`
- `tests/integration/character.test.ts`
- `tests/integration/mission.test.ts`
- `tests/integration/economy.test.ts`
- `tests/helpers/mock-env.ts`

**Acceptance Criteria:**
- [ ] Auth flow tests pass
- [ ] Character CRUD tests pass
- [ ] Mission lifecycle tests pass
- [ ] Economy transaction tests pass
- [ ] Tests run in CI (npm test)

---

## Task 9: Implement Item Effects System

**Priority:** Medium | **Complexity:** Medium | **Files:** 2-3

**Goal:** Make items have actual effects when equipped or used.

**Current State:**
- Items can be bought/sold
- Equipment slots exist
- Items have no gameplay effect

**Implementation:**
1. Define item effect schema (stat bonuses, abilities, consumable effects)
2. GET `/items/catalog` - Browse available items
3. POST `/characters/:id/inventory/:itemId/use` - Use consumable items
4. Apply equipped item bonuses to character stats
5. Apply item bonuses in skill checks and combat

**New file:**
- `src/api/items/index.ts`

**Files to modify:**
- `src/db/queries.ts` - Add item effect queries
- `src/api/mission/index.ts` - Add `processUseItemAction()`

**Acceptance Criteria:**
- [ ] GET `/items/catalog` returns item list with effects
- [ ] Consumable items can be used (healing, buffs)
- [ ] Equipped weapons affect combat damage
- [ ] Equipped armor affects defense

---

## Task 10: Add Augmentation System API

**Priority:** Low | **Complexity:** Medium | **Files:** 2

**Goal:** Allow characters to install and manage cybernetic augmentations.

**Current State:**
- `augmentations` table exists
- `augment_slots` table exists
- `character_augmentations` table exists
- No API routes

**Implementation:**
1. GET `/characters/:id/augmentations` - List installed augments
2. GET `/augmentations/catalog` - Browse available augments
3. POST `/characters/:id/augmentations/install` - Install augment (costs credits + humanity)
4. Apply augment bonuses to character stats
5. Track humanity cost and cyberpsychosis risk

**New file:**
- `src/api/augmentations/index.ts`

**Files to modify:**
- `src/index.ts` - Register augmentation routes
- `src/db/queries.ts` - Add augmentation queries

**Acceptance Criteria:**
- [ ] GET `/characters/:id/augmentations` returns installed list
- [ ] Install requires credits and reduces humanity
- [ ] Augment bonuses apply to character stats
- [ ] Low humanity triggers warnings/effects

---

## Priority Order

| # | Task | Priority | Dependencies |
|---|------|----------|--------------|
| 1 | Combat ↔ Missions | Critical | None |
| 2 | Dialogue ↔ Missions | Critical | None |
| 3 | District Events ↔ Missions | High | None |
| 4 | Attribute-Based Skill Checks | High | None |
| 5 | Skills Training API | Medium | Task 4 |
| 8 | API Integration Tests | High | Tasks 1-4 |
| 6 | Quest System API | Medium | Task 2 |
| 7 | Location/Movement API | Medium | Task 3 |
| 9 | Item Effects System | Medium | Task 4 |
| 10 | Augmentation System API | Low | Task 9 |

---

## Success Metrics

By end of week:
- [ ] Combat missions are playable end-to-end
- [ ] NPCs can be talked to with meaningful outcomes
- [ ] District events affect gameplay
- [ ] Character stats matter in skill checks
- [ ] At least 20 new integration tests
- [ ] 3+ new API route groups (skills, quests, world)

---

## Notes

- Tasks 1-4 are **integration work** (wiring existing systems)
- Tasks 5-7, 9-10 are **new API routes** (expanding functionality)
- Task 8 is **testing** (stability and confidence)
- Parallel work possible: Tasks 1-4 are independent; Tasks 5-7 are independent
- Combat integration (Task 1) is the highest-impact single task
