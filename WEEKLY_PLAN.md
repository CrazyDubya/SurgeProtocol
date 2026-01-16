# Surge Protocol - Weekly Development Plan

**Week of**: January 2026
**Branch**: `claude/surge-weekly-plan-j8XrK`
**Focus**: Economy System, Production Hardening, Game Content

---

## Executive Summary

Building on the solid foundation of 16,958 lines across 43 files, this week focuses on:
1. **Economy System** - The commented-out TODO in `src/index.ts:60`
2. **Test Infrastructure** - Fixing vitest setup and ensuring tests pass
3. **Production Hardening** - Rate limiting, admin auth, logging
4. **Game Content** - Mission templates, NPC dialogue, district events

---

## Day 1: Foundation & Testing

### Priority 1: Fix Test Infrastructure
- [ ] Run `npm install` to install dev dependencies (vitest missing)
- [ ] Verify `npm run test:unit` executes correctly
- [ ] Run rating tests and fix any failures
- [ ] Ensure all 50+ rating test cases pass

### Priority 2: TypeScript Health Check
- [ ] Run `npm run typecheck` to verify type safety
- [ ] Fix any type errors discovered
- [ ] Ensure build completes: `npm run build`

**Files to touch:**
- `package.json` (verify scripts)
- `tests/unit/rating.test.ts` (if fixes needed)
- `vitest.config.ts` (if missing)

---

## Day 2: Economy System - Core Routes

### Create `src/api/economy/index.ts`
The database schema is complete in `migrations/0006_economy.sql`. Need to implement:

**Currency Endpoints:**
```
GET  /api/economy/currencies          - List available currencies
GET  /api/economy/currencies/:code    - Get currency details
POST /api/economy/exchange            - Convert between currencies
```

**Character Finances:**
```
GET  /api/economy/balance             - Get character's current balances
GET  /api/economy/transactions        - Transaction history (paginated)
POST /api/economy/transfer            - Transfer funds between accounts
```

**Key Tables to Query:**
- `currency_definitions` - Currency metadata
- `character_finances` - Character money
- `financial_transactions` - Transaction history

**Files to create:**
- `src/api/economy/index.ts` - Main economy routes
- `src/api/economy/types.ts` - Zod schemas for validation
- `src/api/economy/queries.ts` - D1 query helpers

---

## Day 3: Economy System - Vendors & Shops

### Vendor Endpoints:
```
GET  /api/economy/vendors                    - List nearby vendors
GET  /api/economy/vendors/:id                - Vendor details + inventory
GET  /api/economy/vendors/:id/inventory      - Paginated inventory
POST /api/economy/vendors/:id/buy            - Purchase item
POST /api/economy/vendors/:id/sell           - Sell item to vendor
POST /api/economy/vendors/:id/haggle         - Attempt to negotiate price
```

**Key Tables:**
- `vendor_inventories` - Shop inventories
- `item_definitions` - Item metadata
- `character_inventory` - Character items

**Game Mechanics:**
- Buy price modifier: `base_price * buy_price_modifier`
- Sell price modifier: `base_price * sell_price_modifier` (default 0.5)
- Haggle difficulty check vs character skill

---

## Day 4: Economy System - Contracts & Black Market

### Contract Endpoints:
```
GET  /api/economy/contracts                  - Available contracts
GET  /api/economy/contracts/:id              - Contract details
POST /api/economy/contracts/:id/sign         - Sign a contract
POST /api/economy/contracts/:id/terminate    - Early termination
GET  /api/economy/contracts/active           - Active contracts
```

### Black Market Endpoints (tier 3+ required):
```
GET  /api/economy/blackmarket/contacts       - Known contacts
GET  /api/economy/blackmarket/:id/inventory  - Contact's inventory
POST /api/economy/blackmarket/:id/buy        - Purchase (risk of detection)
POST /api/economy/blackmarket/:id/sell       - Fence goods
```

**Risk Mechanics:**
- `raid_chance_base` - Chance of police/corp raid
- `informant_chance` - Contact might inform on player
- `scam_chance` - Items might be fake/defective
- Detection adds to `heat_level`, affects rating

---

## Day 5: Production Hardening

### Priority 1: Rate Limiting Middleware

Create `src/middleware/rateLimit.ts`:
```typescript
// Sliding window rate limiter using KV
- 100 requests/minute for authenticated users
- 20 requests/minute for unauthenticated
- 10 requests/minute for expensive operations (combat, economy)
```

### Priority 2: Admin Route Authentication

Update `src/api/admin/index.ts`:
```typescript
// Add middleware to all admin routes
- Require valid CF_MASTER_TOKEN in header
- Or: Require JWT with admin role
- Log all admin actions with timestamp
```

### Priority 3: Structured Logging

Create `src/utils/logger.ts`:
```typescript
// Structured JSON logging for production
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  requestId?: string;
  userId?: string;
  characterId?: string;
}
```

**Files to create/modify:**
- `src/middleware/rateLimit.ts` - New rate limiter
- `src/middleware/admin.ts` - Admin authentication
- `src/utils/logger.ts` - Structured logging
- `src/api/admin/index.ts` - Apply admin middleware
- `src/index.ts` - Apply rate limiting globally

---

## Day 6: Game Content - Missions

### Create Mission Templates

Expand seed data with 10+ new mission templates across categories:

**Standard Deliveries (Tier 1-3):**
- `PACKAGE_STANDARD` - Basic courier run
- `PACKAGE_FRAGILE` - Handle with care
- `PACKAGE_EXPRESS` - Time critical

**Specialty Jobs (Tier 4-6):**
- `PACKAGE_HAZMAT` - Dangerous goods
- `PACKAGE_LIVING` - Organ transport
- `CARGO_BULK` - Large delivery
- `DATA_COURIER` - Digital payload

**High-Risk (Tier 7-10):**
- `CONTRABAND_BASIC` - Illegal goods
- `CONTRABAND_HIGH` - Hot merchandise
- `VIP_TRANSPORT` - Person escort
- `CORPORATE_ESPIONAGE` - Data theft

**Files to modify:**
- `src/db/seed/missions.ts` - New mission definitions
- `migrations/` - Add mission_definitions data

---

## Day 7: Game Content - NPCs & Events

### NPC Dialogue Foundation

Create `src/game/dialogue/index.ts`:
```typescript
interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
  conditions?: DialogueCondition[];
  effects?: DialogueEffect[];
}

// Support for:
// - Conditional dialogue based on faction standing
// - Skill checks in conversation
// - Reputation changes from dialogue
// - Quest/mission triggers
```

### District Events System

Create `src/game/events/district.ts`:
```typescript
type DistrictEventType =
  | 'GANG_ACTIVITY'
  | 'POLICE_RAID'
  | 'CORPORATE_LOCKDOWN'
  | 'STREET_FESTIVAL'
  | 'POWER_OUTAGE'
  | 'TRAFFIC_JAM'
  | 'WEATHER_HAZARD';

// Events affect:
// - Route efficiency
// - Mission difficulty
// - NPC availability
// - Shop prices
```

---

## Technical Debt Addressed

### Test Coverage Goals
- [ ] Economy routes: 80%+ coverage
- [ ] Rate limiting: Unit tests for limits
- [ ] Admin auth: Security test cases

### Documentation Updates
- [ ] Update `API_ROUTES.md` with economy endpoints
- [ ] Add rate limit headers to docs
- [ ] Document black market mechanics

---

## Files Summary

### New Files to Create:
```
src/api/economy/
├── index.ts              # Main router
├── types.ts              # Zod validation schemas
├── queries.ts            # D1 queries
├── vendor.ts             # Vendor operations
├── blackmarket.ts        # Black market logic
└── contracts.ts          # Contract management

src/middleware/
├── rateLimit.ts          # Rate limiting
└── admin.ts              # Admin authentication

src/utils/
└── logger.ts             # Structured logging

src/game/
├── dialogue/
│   ├── index.ts          # Dialogue engine
│   └── types.ts          # Dialogue types
└── events/
    ├── district.ts       # District events
    └── types.ts          # Event types
```

### Files to Modify:
```
src/index.ts              # Wire up economy routes, rate limiting
src/api/admin/index.ts    # Add auth middleware
src/db/seed/missions.ts   # New mission templates
package.json              # Verify test scripts
```

---

## Success Criteria

By end of week:
1. ✅ All tests pass (`npm run test:unit`)
2. ✅ Economy system fully functional with vendors
3. ✅ Admin routes secured with auth
4. ✅ Rate limiting protects all endpoints
5. ✅ 10+ new mission templates in database
6. ✅ NPC dialogue foundation ready
7. ✅ District events can modify gameplay

---

## Notes for Future Shards

- **CF Token**: Use `/internal/tokens/create` to generate scoped short-lived tokens for specific operations
- **Database**: All economy tables already exist in `migrations/0006_economy.sql`
- **Rating Integration**: Hook mission completion to `updateRatingFromMission()` from `src/game/mechanics/rating.ts`
- **Durable Objects**: CombatSession, WorldClock, WarTheater infrastructure exists but handlers need implementation

---

## Quick Reference

```bash
# Development
npm run dev                    # Start local server
npm run test:unit              # Run vitest tests
npm run typecheck              # TypeScript check
npm run build                  # Build for deploy

# Database
npm run db:migrate:local       # Apply migrations locally
npm run db:migrate             # Apply to D1

# Deploy
npm run deploy:staging         # Deploy to staging
npm run deploy:production      # Deploy to production
```
