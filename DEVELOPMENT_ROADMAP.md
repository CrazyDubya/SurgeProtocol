# Surge Protocol - Development Roadmap

## Schedule Pattern (Weekly Cycle)

| Day | Focus | Theme |
|-----|-------|-------|
| **1** | Gaps 2-5 | Services, Validation, Tests, DO Integration |
| **2** | Gap 1 | Seed Data from surge-narrative/ |
| **3** | Gaps 2-5 | Services, Validation, Tests, DO Integration |
| **4** | Gap 1 | Seed Data from surge-narrative/ |
| **5** | Gaps 2-5 | Services, Validation, Tests, DO Integration |
| **6** | Testing | Integration testing, bug fixes, verification |
| **7** | Off/Catch-up | Rest, corrections, unfinished work |

---

## MONTH 1: Foundation & Core Systems

### Week 1: Authentication, Core Services & Tutorial Content

#### Day 1 (Mon) - Services Foundation
- [ ] Create `src/services/base/` - Service base classes and interfaces
- [ ] Implement `src/services/rating/calculator.ts` - Encapsulate rating.ts logic
- [ ] Implement `src/services/rating/decay.ts` - Rating decay service
- [ ] Add Zod validation to `src/api/admin/index.ts` (**CRITICAL**)
- [ ] Add Zod validation to `src/api/tokens.ts` (**CRITICAL**)
- [ ] Write unit tests for rating service

#### Day 2 (Tue) - Seed Data: Core Definitions
Source: `documentation/schema/`, game design docs
- [ ] Create `seed_data/` directory structure
- [ ] Create `seed_data/attributes.json` (10 core attributes from RULES_ENGINE.md)
  ```json
  ["STR", "AGI", "VEL", "TGH", "INT", "WIS", "CHA", "EMP", "LCK", "EDG"]
  ```
- [ ] Create `seed_data/skills.json` (all skill definitions)
- [ ] Create `seed_data/tier_definitions.json` (tiers 1-10 thresholds)
- [ ] Create `seed_data/difficulty_levels.json`
- [ ] Create seed data loader script `scripts/seed-db.ts`

#### Day 3 (Wed) - Character Service & Validation
- [ ] Implement `src/services/character/progression.ts`
  - XP gain calculation
  - Tier advancement logic
  - Attribute point allocation
- [ ] Implement `src/services/character/humanity.ts`
  - Humanity tracking
  - Threshold effect application
  - Cyberpsychosis triggers
- [ ] Add Zod validation to `src/api/settings/index.ts`
- [ ] Add Zod validation to `src/api/status/index.ts`
- [ ] Write unit tests for character services

#### Day 4 (Thu) - Seed Data: Tutorial NPCs & Locations
Source: `surge-narrative/01_CHARACTERS/tier_0_npcs/`, `surge-narrative/05_WORLD_TEXT/`
- [ ] Parse `dispatcher_chen.md` → `seed_data/npcs/chen.json`
- [ ] Create `seed_data/locations/the_hollows.json` (from `the_hollows.md`)
- [ ] Create `seed_data/factions.json` (12 factions from FACTION_WARFARE.md)
- [ ] Create `seed_data/regions.json` (districts)
- [ ] Create `seed_data/dialogue_trees/chen_tutorial.json`

#### Day 5 (Fri) - Mission Service & Combat Validation
- [ ] Implement `src/services/mission/lifecycle.ts`
  - Accept mission
  - Update progress
  - Complete/fail mission
  - Apply rewards/penalties
- [ ] Implement `src/services/mission/generator.ts`
  - Procedural mission generation using templates
- [ ] Add Zod validation to `src/api/combat/index.ts`
- [ ] Add Zod validation to `src/api/crafting/index.ts`
- [ ] Write integration tests for mission lifecycle

#### Day 6 (Sat) - Week 1 Testing
- [x] Run full test suite, fix failures
- [x] Test seed data loading end-to-end
- [x] Verify rating service integration with mission completion
- [x] Test character progression flows
- [x] Document any issues for Day 7

**Day 6 Results:**
- Node tests: 83 pass, 0 fail
- Vitest tests: 611 pass, 34 fail (pre-existing dialogue integration issues)
- Created comprehensive `tests/seed-data.test.js` (44 tests validating all 10 seed data files)
- Fixed test expectations to match actual data structures
- All mission integration tests pass (15/15)
- All character service tests pass (63/63)
- All rating service tests pass

**Known Issues for Day 7:**
- 34 dialogue integration tests failing (pre-existing from DialogueService mock issues)
- These require dialogue service updates to fix mock compatibility

#### Day 7 (Sun) - Off/Catch-up
- [ ] Address any critical issues from Day 6
- [ ] Review and refactor if needed
- [ ] Prepare for Week 2

---

### Week 2: Economy, NPCs & Early Game Content

#### Day 8 (Mon) - Economy Service & Validation
- [ ] Implement `src/services/economy/transaction.ts`
  - Credit transfers
  - Purchase validation
  - Debt management
- [ ] Implement `src/services/economy/vendor.ts`
  - Vendor inventory management
  - Price calculation with reputation modifiers
- [ ] Add Zod validation to `src/api/contracts/index.ts`
- [ ] Add Zod validation to `src/api/drones/index.ts`
- [ ] Write tests for economy service

#### Day 9 (Tue) - Seed Data: Tier 1-3 NPCs
Source: `surge-narrative/01_CHARACTERS/tier_1-3_npcs/`
- [ ] Parse `dr_yuki_tanaka.md` → `seed_data/npcs/tanaka.json`
- [ ] Parse `jin_rival_courier.md` → `seed_data/npcs/jin.json`
- [ ] Create dialogue trees for early NPCs
- [ ] Create `seed_data/items/weapons_tier1-3.json`
- [ ] Create `seed_data/items/armor_tier1-3.json`
- [ ] Create `seed_data/items/consumables.json`

#### Day 10 (Wed) - Combat Service & DO Integration
- [ ] Implement `src/services/combat/resolver.ts`
  - Bridge between API and CombatSession DO
  - Turn resolution
  - Damage calculation using combat.ts
- [ ] Create `/api/combat/session/*` WebSocket endpoints
  - POST `/api/combat/session/create` - Create combat DO
  - GET `/api/combat/session/:id/connect` - WebSocket upgrade
  - POST `/api/combat/session/:id/action` - Submit action
- [ ] Add Zod validation to `src/api/dialogue/index.ts`
- [ ] Add Zod validation to `src/api/story/index.ts`
- [ ] Write integration tests for combat session creation

#### Day 11 (Thu) - Seed Data: Tutorial & Tier 1 Quests
Source: `surge-narrative/03_QUESTS/main_story/`
- [ ] Parse `tier_0_tutorial.md` → `seed_data/quests/tutorial.json`
- [ ] Parse `tier_1_fresh_meat.md` → `seed_data/quests/tier1_main.json`
- [ ] Create `seed_data/missions/tutorial_missions.json`
- [ ] Create `seed_data/complications/tier1.json` (from complications_library.md)
- [ ] Create `seed_data/algorithm_voice/tier1.json` (from algorithm_voice_complete.md)

#### Day 12 (Fri) - Narrative Service & Tests
- [ ] Implement `src/services/narrative/engine.ts`
  - Dialogue tree traversal
  - Flag management
  - Condition evaluation (humanity, tier, faction rep)
- [ ] Implement `src/services/narrative/algorithm.ts`
  - Algorithm voice generation
  - Tier-appropriate commentary
- [ ] Add Zod validation to `src/api/npc/index.ts`
- [ ] Add Zod validation to `src/api/achievements/index.ts`
- [ ] Write tests for dialogue engine

#### Day 13 (Sat) - Week 2 Testing
- [ ] Test complete tutorial flow end-to-end
- [ ] Verify NPC interactions with dialogue trees
- [ ] Test economy transactions
- [ ] Test combat session WebSocket connectivity
- [ ] Run full regression suite

#### Day 14 (Sun) - Off/Catch-up
- [ ] Address Week 2 issues
- [ ] Review service layer architecture
- [ ] Prepare for Week 3

---

### Week 3: World State, Factions & Mid-Game Content

#### Day 15 (Mon) - World State DO Integration
- [ ] Create `/api/worldclock/*` endpoints
  - GET `/api/worldclock/time` - Current game time
  - POST `/api/worldclock/advance` - Admin time control
  - GET `/api/worldclock/weather` - Current weather
- [ ] Create `/api/war/*` endpoints
  - GET `/api/war/active` - Active faction wars
  - POST `/api/war/:id/contribute` - Player contribution
  - GET `/api/war/:id/status` - War progress
- [ ] Add Zod validation to `src/api/social/index.ts`
- [ ] Add Zod validation to `src/api/leaderboards/index.ts`
- [ ] Write tests for war contribution system

#### Day 16 (Tue) - Seed Data: Mid-Game NPCs & Locations
Source: `surge-narrative/01_CHARACTERS/tier_4-6_npcs/`, `surge-narrative/05_WORLD_TEXT/`
- [ ] Parse `delilah_fixer.md` → `seed_data/npcs/delilah.json`
- [ ] Parse `union_organizer_lopez.md` → `seed_data/npcs/lopez.json`
- [ ] Create `seed_data/locations/red_harbor.json`
- [ ] Create `seed_data/locations/uptown_corporate.json`
- [ ] Create `seed_data/items/weapons_tier4-6.json`
- [ ] Create `seed_data/augments/tier4-6.json`

#### Day 17 (Wed) - Faction Service & Reputation
- [ ] Implement `src/services/faction/reputation.ts`
  - Reputation gain/loss calculation
  - Threshold crossing effects
  - Dual reputation tracking
- [ ] Implement `src/services/faction/territory.ts`
  - Territory control state
  - War impact on territories
- [ ] Add Zod validation to `src/api/messaging/index.ts`
- [ ] Add Zod validation to `src/api/blackmarket/index.ts`
- [ ] Write tests for reputation system

#### Day 18 (Thu) - Seed Data: Mid-Game Quests & Side Content
Source: `surge-narrative/03_QUESTS/`
- [ ] Parse `tier_2_provisional.md` → `seed_data/quests/tier2_main.json`
- [ ] Parse `tier_3_the_whisper.md` → `seed_data/quests/tier3_main.json`
- [ ] Parse `tier_4_gray.md` → `seed_data/quests/tier4_main.json`
- [ ] Parse side quests: `chrome_saints_initiation.md`, `hollows_market_mystery.md`
- [ ] Create `seed_data/complications/tier2-4.json`
- [ ] Create `seed_data/algorithm_voice/tier2-4.json`

#### Day 19 (Fri) - Addiction & Status Effect Services
- [ ] Implement `src/services/status/addiction.ts`
  - Addiction progression
  - Withdrawal effects
  - Treatment/recovery
- [ ] Implement `src/services/status/condition.ts`
  - Condition application
  - Duration tracking
  - Effect stacking
- [ ] Add Zod validation to `src/api/progression/index.ts`
- [ ] Add Zod validation to `src/api/procedural/index.ts`
- [ ] Write tests for addiction mechanics

#### Day 20 (Sat) - Week 3 Testing
- [ ] Test faction reputation crossing thresholds
- [ ] Test war contribution and progress
- [ ] Test addiction/withdrawal effects
- [ ] Test mid-game quest chains
- [ ] Full regression suite

#### Day 21 (Sun) - Off/Catch-up
- [ ] Address Week 3 issues
- [ ] Refactor service integrations
- [ ] Prepare for Week 4

---

### Week 4: Late-Game Systems & Advanced Content

#### Day 22 (Mon) - Procedural Generation Service
- [ ] Implement `src/services/procedural/mission.ts`
  - Template interpolation
  - Variable substitution
  - Difficulty scaling
- [ ] Implement `src/services/procedural/loot.ts`
  - Loot table rolls
  - Rarity weighting
  - Legendary generation
- [ ] Add Zod validation to `src/api/analytics/index.ts`
- [ ] Add Zod validation to `src/api/worldstate/index.ts`
- [ ] Add Zod validation to `src/api/enums/index.ts`
- [ ] Write tests for procedural generation

#### Day 23 (Tue) - Seed Data: Late-Game NPCs
Source: `surge-narrative/01_CHARACTERS/tier_7-9_npcs/`
- [ ] Parse `okonkwo_interstitial_guide.md` → `seed_data/npcs/okonkwo.json`
- [ ] Parse `phantom_ghost_network.md` → `seed_data/npcs/phantom.json`
- [ ] Parse `solomon_saint_germain_third_path.md` → `seed_data/npcs/solomon.json`
- [ ] Parse `yamada_corpo_recruiter.md` → `seed_data/npcs/yamada.json`
- [ ] Create `seed_data/locations/nakamura_tower.json`
- [ ] Create `seed_data/locations/interstitial.json`

#### Day 24 (Wed) - Fork/Shadow Mechanics
- [ ] Implement `src/services/character/fork.ts`
  - Fork creation at low humanity
  - Fork divergence tracking
  - Fork merging/conflict
- [ ] Implement `src/services/character/shadow.ts`
  - Shadow emergence (humanity < 60)
  - Shadow dialogue integration
- [ ] Write tests for fork mechanics
- [ ] Write tests for shadow emergence

#### Day 25 (Thu) - Seed Data: Late-Game Content
Source: `surge-narrative/03_QUESTS/main_story/`
- [ ] Parse `tier_5_the_space_between.md` → `seed_data/quests/tier5_main.json`
- [ ] Parse `tier_6_chrome_and_choice.md` → `seed_data/quests/tier6_main.json`
- [ ] Parse `tier_7_the_consultation.md` → `seed_data/quests/tier7_main.json`
- [ ] Parse side quests: `okonkwos_test.md`, `ghost_network_extraction.md`
- [ ] Create `seed_data/augments/tier7-9.json` (high-end chrome)
- [ ] Create `seed_data/algorithm_voice/tier5-7.json`

#### Day 26 (Fri) - Service Integration & API Refinement
- [ ] Review all services for consistent error handling
- [ ] Ensure all services use structured error responses
- [ ] Add missing service method logging
- [ ] Create service dependency injection pattern
- [ ] Write integration tests for cross-service workflows

#### Day 27 (Sat) - Month 1 Final Testing
- [ ] Complete end-to-end playthrough (Tier 0-7)
- [ ] Test all dialogue trees load correctly
- [ ] Test faction war participation
- [ ] Test fork/shadow mechanics at low humanity
- [ ] Performance testing of procedural generation
- [ ] Full regression suite

#### Day 28 (Sun) - Month 1 Review
- [ ] Document completed features
- [ ] List remaining gaps
- [ ] Plan Month 2 priorities
- [ ] REST

---

## MONTH 2: Polish, Advanced Features & Endgame

### Week 5: Vehicle Combat, Hacking & Tier 8-9 Content

#### Day 29 (Mon) - Vehicle Combat Implementation
- [ ] Implement `src/game/mechanics/vehicle-combat.ts`
  - Chase mechanics
  - Vehicle damage model
  - Ramming/collision
- [ ] Implement `src/services/combat/vehicle.ts`
  - Vehicle combat session management
- [ ] Add vehicle combat API endpoints
- [ ] Write unit tests for vehicle combat

#### Day 30 (Tue) - Seed Data: Endgame NPCs
Source: `surge-narrative/01_CHARACTERS/tier_10_npcs/`
- [ ] Parse `synthesis_ascended.md` → `seed_data/npcs/synthesis.json`
- [ ] Create `seed_data/locations/solomons_sanctum.json`
- [ ] Create `seed_data/items/legendary_weapons.json`
- [ ] Create `seed_data/augments/legendary.json`
- [ ] Create `seed_data/vehicles/all.json`

#### Day 31 (Wed) - Hacking/Netrunning System
- [ ] Implement `src/game/mechanics/hacking.ts`
  - ICE breaking
  - Data extraction
  - System control
- [ ] Implement `src/services/hacking/netrun.ts`
  - Netrunning session management
- [ ] Add hacking API endpoints
- [ ] Write tests for hacking mechanics

#### Day 32 (Thu) - Seed Data: Endgame Quests
Source: `surge-narrative/03_QUESTS/main_story/`
- [ ] Parse `tier_8_ghost_protocol.md` → `seed_data/quests/tier8_main.json`
- [ ] Parse `tier_9_the_convergence.md` → `seed_data/quests/tier9_main.json`
- [ ] Parse `tier_10_ascension.md` → `seed_data/quests/tier10_main.json`
- [ ] Parse `tier_10_third_path_ritual.md` → `seed_data/quests/tier10_third_path.json`
- [ ] Create `seed_data/algorithm_voice/tier8-10.json`
- [ ] Create `seed_data/complications/endgame.json`

#### Day 33 (Fri) - Stealth System
- [ ] Implement `src/game/mechanics/stealth.ts`
  - Detection mechanics
  - Cover usage in stealth
  - Silent takedowns
- [ ] Implement `src/services/stealth/awareness.ts`
  - NPC awareness tracking
  - Alert state management
- [ ] Add stealth API endpoints
- [ ] Write tests for stealth mechanics

#### Day 34 (Sat) - Week 5 Testing
- [ ] Test vehicle combat scenarios
- [ ] Test hacking encounters
- [ ] Test stealth missions
- [ ] Test endgame quests load correctly
- [ ] Full regression suite

#### Day 35 (Sun) - Off/Catch-up

---

### Week 6: Romance, Side Content & Epilogues

#### Day 36 (Mon) - Relationship System Service
- [ ] Implement `src/services/social/relationship.ts`
  - Friendship progression
  - Romance arc tracking
  - Rivalry mechanics
- [ ] Implement `src/services/social/crew.ts`
  - Crew formation
  - Crew bonuses
  - Crew missions
- [ ] Write tests for relationship system

#### Day 37 (Tue) - Seed Data: Romance & Relationships
Source: `surge-narrative/01_CHARACTERS/romance_characters/`
- [ ] Parse `romance_mechanic_rosa.md` → `seed_data/npcs/rosa_romance.json`
- [ ] Create `seed_data/quests/romance_rosa.json`
- [ ] Create `seed_data/dialogue_trees/romance/` (romance dialogue)
- [ ] Create `seed_data/quests/side/` (all remaining side quests)

#### Day 38 (Wed) - Achievement & Leaderboard Services
- [ ] Implement `src/services/achievements/tracker.ts`
  - Achievement condition checking
  - Progress tracking
  - Reward distribution
- [ ] Implement `src/services/leaderboards/rankings.ts`
  - Score calculation
  - Rank computation
  - Period management
- [ ] Write tests for achievements

#### Day 39 (Thu) - Seed Data: Epilogues & Faction Quests
Source: `surge-narrative/03_QUESTS/`
- [ ] Parse `epilogue_rogue.md` → `seed_data/quests/epilogue.json`
- [ ] Create faction quest seed data from `surge-narrative/03_QUESTS/faction_quests/`
- [ ] Create `seed_data/achievements.json` (all achievement definitions)
- [ ] Create `seed_data/milestones.json`

#### Day 40 (Fri) - Analytics & Monitoring Services
- [ ] Implement `src/services/analytics/events.ts`
  - Event recording
  - Session tracking
  - Metric aggregation
- [ ] Implement `src/services/monitoring/health.ts`
  - System health checks
  - Performance metrics
- [ ] Write tests for analytics

#### Day 41 (Sat) - Week 6 Testing
- [ ] Test romance progression
- [ ] Test achievement unlocks
- [ ] Test leaderboard rankings
- [ ] Test all epilogue paths
- [ ] Full regression suite

#### Day 42 (Sun) - Off/Catch-up

---

### Week 7: Integration, Performance & Content Completion

#### Day 43 (Mon) - Service Layer Polish
- [ ] Review all services for consistency
- [ ] Add transaction support where needed
- [ ] Implement service-level caching
- [ ] Add comprehensive error codes
- [ ] Document all service APIs

#### Day 44 (Tue) - Seed Data: Final Content
- [ ] Complete any remaining NPC data
- [ ] Complete any remaining quest data
- [ ] Create `seed_data/loot_tables.json`
- [ ] Create `seed_data/generation_templates.json`
- [ ] Verify all seed data loads without errors

#### Day 45 (Wed) - Performance Optimization
- [ ] Profile database queries
- [ ] Add indexes where needed
- [ ] Implement query result caching
- [ ] Optimize DO message passing
- [ ] Add batch operations for bulk updates

#### Day 46 (Thu) - Seed Data: Voice & Localization
Source: `surge-narrative/08_VOICE_ACTING/`, localization
- [ ] Create `seed_data/voice_lines.json` (key lines for TTS/VA)
- [ ] Create `seed_data/localization/en.json`
- [ ] Prepare localization structure for future languages
- [ ] Document content pipeline

#### Day 47 (Fri) - API Documentation & Cleanup
- [ ] Generate OpenAPI spec from Zod schemas
- [ ] Document all endpoints
- [ ] Add request/response examples
- [ ] Create API changelog
- [ ] Remove dead code

#### Day 48 (Sat) - Week 7 Testing
- [ ] Full end-to-end playthrough (all tiers)
- [ ] Load testing with seed data
- [ ] API response time testing
- [ ] Memory usage profiling
- [ ] Full regression suite

#### Day 49 (Sun) - Off/Catch-up

---

### Week 8: Final Polish & Production Prep

#### Day 50 (Mon) - Error Handling & Edge Cases
- [ ] Audit all error responses
- [ ] Add graceful degradation
- [ ] Handle network failures
- [ ] Add retry logic where appropriate
- [ ] Test all error paths

#### Day 51 (Tue) - Seed Data: Quality Assurance
- [ ] Verify all NPCs have dialogue
- [ ] Verify all quests are completable
- [ ] Verify all items are obtainable
- [ ] Check for data inconsistencies
- [ ] Balance review of numbers

#### Day 52 (Wed) - Security Audit
- [ ] Review all admin endpoints
- [ ] Audit token generation
- [ ] Check for injection vulnerabilities
- [ ] Review rate limiting
- [ ] Test authentication edge cases

#### Day 53 (Thu) - Seed Data: Final Validation
- [ ] Run seed data integrity checks
- [ ] Verify foreign key relationships
- [ ] Test full game flow with seed data
- [ ] Create seed data version tracking
- [ ] Document seed data format

#### Day 54 (Fri) - Production Preparation
- [ ] Update wrangler.toml for production
- [ ] Configure production D1/KV/DO
- [ ] Set up monitoring/alerting
- [ ] Create deployment scripts
- [ ] Write runbook

#### Day 55 (Sat) - Month 2 Final Testing
- [ ] Complete game playthrough all paths
- [ ] Stress testing
- [ ] Security testing
- [ ] Performance benchmarks
- [ ] Sign-off checklist

#### Day 56 (Sun) - Month 2 Review & Launch Prep
- [ ] Final documentation
- [ ] Launch checklist
- [ ] Rollback procedures
- [ ] REST

---

## MONTH 3: Launch, Iteration & Extended Content

### Week 9-10: Launch & Stabilization
- Deploy to production
- Monitor for issues
- Hot-fix critical bugs
- Gather player feedback
- Tune balance based on data

### Week 11-12: Post-Launch Content
- Additional side quests
- New faction missions
- Seasonal events
- Community-requested features
- Additional localization

---

## Deliverables Summary

### End of Month 1
- [ ] All services implemented (rating, mission, combat, economy, narrative, faction, status)
- [ ] All API validation complete (Zod on all 34 modules)
- [ ] Durable Object API integration complete
- [ ] Seed data for Tiers 0-7 (NPCs, quests, items, locations)
- [ ] Test coverage for all new services
- [ ] Playable game through Tier 7

### End of Month 2
- [ ] Vehicle combat system
- [ ] Hacking/netrunning system
- [ ] Stealth system
- [ ] Fork/shadow mechanics
- [ ] Complete seed data (all tiers, all content)
- [ ] Full test coverage
- [ ] Performance optimized
- [ ] Production ready

### End of Month 3
- [ ] Production deployment
- [ ] Live game with players
- [ ] Post-launch content pipeline
- [ ] Localization foundation
- [ ] Analytics dashboard

---

## Source Content Mapping

| Narrative Source | Seed Data Target |
|-----------------|------------------|
| `surge-narrative/01_CHARACTERS/tier_X_npcs/*.md` | `seed_data/npcs/*.json` |
| `surge-narrative/03_QUESTS/main_story/*.md` | `seed_data/quests/main/*.json` |
| `surge-narrative/03_QUESTS/side_quests/*.md` | `seed_data/quests/side/*.json` |
| `surge-narrative/04_COMPLICATIONS/*.md` | `seed_data/complications/*.json` |
| `surge-narrative/05_WORLD_TEXT/locations/*.md` | `seed_data/locations/*.json` |
| `surge-narrative/06_ALGORITHM_VOICE/*.md` | `seed_data/algorithm_voice/*.json` |
| `RULES_ENGINE.md` | `seed_data/attributes.json`, `seed_data/skills.json` |
| `FACTION_WARFARE.md` | `seed_data/factions.json` |
| `ENTITY_BESTIARY.md` | `seed_data/enemies/*.json` |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Seed data parsing errors | Create robust markdown parser with error reporting |
| Service integration complexity | Define clear service interfaces early |
| DO WebSocket issues | Test WebSocket connectivity early in Week 2 |
| Performance at scale | Add caching and optimize queries in Week 7 |
| Content inconsistencies | Run validation scripts on seed data daily |

---

*"The Algorithm has scheduled your optimization. Compliance is efficiency."*
