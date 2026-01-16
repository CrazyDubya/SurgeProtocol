# Work Plan: CF Token Creation Shard
## Week of Jan 16-22, 2026

### Current State
- **Completed**: CF Token Service (create/revoke/verify tokens)
- **Other Shard** (`claude/setup-cf-tokens-eWfdq`): Schema documentation (1CoreCharacter.md, 11AnalyticsConfigEnum.md, etc.)
- **Main Branch**: Contains CLAUDE.md, design docs

---

## Day 1 (Thu Jan 16) - Game Mechanics Engine

### Block 1: Dice & Resolution System
**Files**: `src/game/mechanics/dice.ts`, `src/game/mechanics/skill-check.ts`

- [ ] Implement 2d6 core roller with RNG
- [ ] Attribute modifier calculator (1-20 → -5 to +5)
- [ ] Skill check resolution (roll vs TN)
- [ ] Result classification (CATASTROPHE/MISS/GRAZE/HIT/PERFECT)
- [ ] Critical detection (snake eyes, boxcars)
- [ ] Opposed check resolution
- [ ] Extended check tracking

**Self-Review Checkpoint**:
```
□ All probability math verified against RULES_ENGINE.md
□ Edge cases: TN=2 (always succeed?), TN=20 (need boxcars?)
□ Randomness uses crypto.getRandomValues() not Math.random()
```

### Block 2: Combat Calculations
**Files**: `src/game/mechanics/combat.ts`

- [ ] Initiative calculation (2d6 + VEL + PRC + augments)
- [ ] Attack roll resolution
- [ ] Defense calculation (8 + AGI + armor + cover)
- [ ] Damage calculation (weapon dice + margin + STR - armor)
- [ ] Wound threshold tracking
- [ ] Status effect modifiers

**Self-Review Checkpoint**:
```
□ Damage floors at 0 (no negative damage)
□ Margin bonus capped at +5
□ Armor reduction applied correctly
```

### Block 3: Commit & Push
```
git add src/game/
git commit -m "Implement core game mechanics engine"
git push
```

---

## Day 2 (Fri Jan 17) - Durable Objects Foundation

### 🔄 SYNC POINT: Morning
```bash
git fetch origin
git log origin/claude/setup-cf-tokens-eWfdq --oneline -10
git log origin/main --oneline -5
# Review schema shard progress before proceeding
```

### Block 1: CombatSession Durable Object
**Files**: `src/realtime/combat.ts`

- [ ] Durable Object class structure
- [ ] WebSocket connection handling
- [ ] Combat state interface (combatants, battlefield, turn order)
- [ ] Initialize combat endpoint
- [ ] Action processing (attack, move, defend, disengage)
- [ ] Turn advancement logic
- [ ] Combat end detection (victory, defeat, escape)
- [ ] State persistence via ctx.storage

**Self-Review Checkpoint**:
```
□ All WebSocket messages have type discriminator
□ State serialization handles Map→Object conversion
□ Connection cleanup on close/error
□ Broadcast doesn't send to disconnected clients
```

### Block 2: WorldClock Durable Object
**Files**: `src/realtime/world.ts`

- [ ] Game time tracking (accelerated time)
- [ ] Time-of-day calculation (MORNING/AFTERNOON/EVENING/NIGHT)
- [ ] Weather system state
- [ ] Weather effects on gameplay (visibility, handling, pay modifiers)
- [ ] Alarm/scheduled event system

### Block 3: Commit & Push
```
git add src/realtime/
git commit -m "Implement CombatSession and WorldClock Durable Objects"
git push
```

---

## Day 3 (Sat Jan 18) - Database Layer

### 🔄 SYNC POINT: Critical - Schema Alignment
```bash
git fetch origin
# Check if schema shard has finalized data models
git show origin/claude/setup-cf-tokens-eWfdq:1CoreCharacter.md | head -100
git show origin/claude/setup-cf-tokens-eWfdq:11AnalyticsConfigEnum.md | head -100
# Align migrations with their schema definitions
```

### Block 1: Database Migrations
**Files**: `migrations/0001_initial.sql`

- [ ] Create migrations directory
- [ ] Core tables (users, sessions, characters)
- [ ] Character detail tables (skills, augments, inventory)
- [ ] Faction tables (standings, wars, contributions)
- [ ] Mission tables (active, history)
- [ ] Combat tables (encounters)
- [ ] World tables (state, district control)
- [ ] Economy tables (transactions)
- [ ] Proper indexes for common queries

**Self-Review Checkpoint**:
```
□ All foreign keys have ON DELETE behavior defined
□ Indexes on frequently queried columns
□ JSON columns have sensible defaults
□ Timestamps use TEXT with CURRENT_TIMESTAMP
□ Schema matches schema shard documentation
```

### Block 2: Database Utilities
**Files**: `src/db/queries.ts`, `src/db/utils.ts`

- [ ] Prepared statement builders
- [ ] Transaction wrapper
- [ ] Common query patterns (getCharacter, updateRating, etc.)
- [ ] Batch operation helpers

### Block 3: Commit & Push
```
git add migrations/ src/db/
git commit -m "Add database migrations and query utilities"
git push
```

---

## Day 4 (Sun Jan 19) - API Routes Scaffold

### 🔄 SYNC POINT: Check for Main Updates
```bash
git fetch origin
git log origin/main --oneline -5
# If main has updates, merge them
git merge origin/main --no-edit
```

### Block 1: Auth Routes
**Files**: `src/api/auth/index.ts`

- [ ] POST /auth/register (email/password)
- [ ] POST /auth/login (returns JWT + session token)
- [ ] POST /auth/logout (invalidate session)
- [ ] POST /auth/refresh (token refresh)
- [ ] JWT middleware for protected routes
- [ ] Password hashing (use crypto.subtle)

**Self-Review Checkpoint**:
```
□ Passwords never logged or returned
□ JWT expiry set appropriately (1h access, 7d refresh)
□ Rate limiting considerations documented
```

### Block 2: Character Routes
**Files**: `src/api/character/index.ts`

- [ ] POST /characters (create character)
- [ ] GET /characters/:id (full character data)
- [ ] PATCH /characters/:id (update allowed fields)
- [ ] GET /characters/:id/skills
- [ ] GET /characters/:id/inventory
- [ ] GET /characters/:id/factions
- [ ] Character creation validation (attribute point buy)

### Block 3: Mission Routes Scaffold
**Files**: `src/api/mission/index.ts`

- [ ] GET /missions/available (filtered by tier, location)
- [ ] POST /missions/:id/accept
- [ ] POST /missions/:id/action (navigate, resolve, complete)
- [ ] GET /missions/active (current mission state)
- [ ] POST /missions/:id/abandon

### Block 4: Commit & Push
```
git add src/api/
git commit -m "Scaffold auth, character, and mission API routes"
git push
```

---

## Day 5 (Mon Jan 20) - War Theater & Faction System

### Block 1: WarTheater Durable Object
**Files**: `src/realtime/war.ts`

- [ ] War state management (attacker, defender, scores)
- [ ] Contribution tracking
- [ ] Phase progression (ESCALATION → CONFLICT → RESOLUTION)
- [ ] WebSocket updates for war participants
- [ ] Objective completion handling

### Block 2: Faction Routes
**Files**: `src/api/faction/index.ts`

- [ ] GET /factions (all faction summaries)
- [ ] GET /factions/:id (faction details)
- [ ] GET /factions/:id/standing (player's standing)
- [ ] GET /factions/wars/active (current wars)
- [ ] POST /wars/:id/contribute (submit war contribution)

### Block 3: Rating System
**Files**: `src/game/mechanics/rating.ts`

- [ ] Rating calculation (weighted average)
- [ ] Rating decay (inactive accounts)
- [ ] Death spiral prevention
- [ ] Tier threshold checks
- [ ] Rating change on mission complete/fail

**Self-Review Checkpoint**:
```
□ Rating never goes below 0 or above 500
□ Decay only applies after inactivity threshold
□ Death spiral protection activates below 60
```

### Block 4: Commit & Push
```
git add src/realtime/war.ts src/api/faction/ src/game/mechanics/rating.ts
git commit -m "Implement WarTheater DO and faction/rating systems"
git push
```

---

## Day 6 (Tue Jan 21) - Integration & Testing

### 🔄 SYNC POINT: Pre-Integration Check
```bash
git fetch origin
# Review ALL branches for potential conflicts
git log origin/main --oneline -10
git log origin/claude/setup-cf-tokens-eWfdq --oneline -10

# Check what schema shard has that we need
git diff HEAD origin/claude/setup-cf-tokens-eWfdq --stat
```

### Block 1: Integration Work
- [ ] Wire all API routes into main index.ts
- [ ] Add authentication middleware to protected routes
- [ ] Connect Durable Objects to API routes
- [ ] Add KV caching layer for game data
- [ ] Error handling standardization

### Block 2: Seed Data Loader
**Files**: `src/db/seed.ts`

- [ ] Load mission templates from seed files
- [ ] Load NPC data
- [ ] Load faction data with initial war states
- [ ] Load item/equipment catalogs
- [ ] Load district/location data
- [ ] KV population for fast reads

### Block 3: Test Scripts
**Files**: `scripts/test-flow.ts`

- [ ] Character creation flow test
- [ ] Mission accept/navigate/complete flow test
- [ ] Combat initialization test
- [ ] Token creation/validation test

### Block 4: Commit & Push
```
git add .
git commit -m "Integration: wire routes, add seeding, test flows"
git push
```

---

## Day 7 (Wed Jan 22) - Polish & Merge Preparation

### 🔄 SYNC POINT: Merge Coordination
```bash
git fetch origin

# 1. Check main for any updates
git log origin/main --oneline -5

# 2. Check schema shard status
git log origin/claude/setup-cf-tokens-eWfdq --oneline -5

# 3. If schema shard is complete and merged to main:
git merge origin/main --no-edit

# 4. If schema shard NOT merged, coordinate:
#    - Review their changes
#    - Identify conflicts
#    - Plan merge order
```

### Block 1: Documentation
- [ ] Update README with setup instructions
- [ ] Document all API endpoints in API_ROUTES.md
- [ ] Add environment variable reference
- [ ] Deployment checklist

### Block 2: Code Review & Cleanup
- [ ] Run TypeScript strict checks
- [ ] Remove any TODO comments that are complete
- [ ] Ensure consistent error response format
- [ ] Verify all imports are used

### Block 3: Final Self-Review
```
□ All Durable Objects export from index.ts
□ wrangler.toml has all bindings
□ No hardcoded secrets
□ All D1 queries use parameterized statements
□ WebSocket error handling complete
□ Token service integrated with auth flow
```

### 🎯 MERGE TO MAIN: Request PR Review
```bash
# Create PR
gh pr create --title "CF Token Service + Core Game Infrastructure" --body "$(cat <<'EOF'
## Summary
- CF Token Service for scoped API tokens
- Core game mechanics (dice, combat, rating)
- Durable Objects (CombatSession, WorldClock, WarTheater)
- Database migrations and query utilities
- API routes (auth, character, mission, faction)
- Seed data loading

## Test Plan
- [ ] Token creation/revocation works
- [ ] Dice rolls produce correct distribution
- [ ] Combat session WebSocket connects
- [ ] Character creation validates properly
- [ ] Mission flow completes end-to-end

## Sync Notes
- Aligned with schema shard (claude/setup-cf-tokens-eWfdq) for data models
- Database migrations match their schema docs
EOF
)"
```

---

## Sync Points Summary

| Day | Type | Action |
|-----|------|--------|
| Day 2 AM | Check | Review schema shard progress |
| Day 3 AM | **Critical** | Align DB migrations with schema docs |
| Day 4 AM | Check | Merge any main updates |
| Day 6 AM | Check | Pre-integration review of all branches |
| Day 7 AM | **Critical** | Merge coordination before PR |

## Merge Strategy

1. **Schema shard should merge first** - They define the data models
2. **This shard merges second** - We implement the logic using those models
3. **If conflicts**: Schema definitions win, we adapt implementation

## Risk Areas

| Risk | Mitigation |
|------|------------|
| Schema changes break migrations | Day 3 sync point, keep migrations flexible |
| Durable Object API changes | Check CF docs for latest patterns |
| Combat math incorrect | Self-review against RULES_ENGINE.md |
| Token service permissions wrong | Test with minimal permissions first |

---

*"Efficiency rating: PENDING. Complete your deliveries."*
