# SURGE PROTOCOL - REAL-TIME MONITORING & TOKEN GUIDE

Generated during real-time infrastructure examination on 2026-01-16.

---

## Quick Commands

### View Full Infrastructure Report
```bash
# Read the complete examination
cat INFRASTRUCTURE_EXAMINATION.md

# Quick status check
bash scripts/realtime-monitor.sh
```

### Generate Real-time Tokens
```bash
# Full token generation + API monitoring
node /tmp/realtime-monitor.js

# Infrastructure dashboard
node /tmp/surge-dashboard.js
```

### Database Operations
```bash
# Apply all migrations to D1
npm run db:migrate

# Execute local migrations (for testing)
npm run db:migrate:local

# Test database connectivity
npm run db:reset
```

### Development & Deployment
```bash
# Local development server
npm run dev

# Build for production
npm run build

# Deploy to environments
npm run deploy              # Development
npm run deploy:staging      # Staging
npm run deploy:production   # Production
```

### Testing
```bash
# Run all tests
npm test

# Schema validation tests
npm run test:schema

# Lint schema
npm run lint:schema
```

---

## Real-time Token Generation

The examination created scripts to generate short-lived tokens for various authentication scopes:

### Character Authentication (JWT)
```javascript
// Run: node /tmp/realtime-monitor.js

// Output:
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TTL: 3600 seconds (1 hour)
Scope: game:play
Sub: character_id
Iss: surge-protocol
Aud: surge-api
```

**Usage**: Include in API requests
```bash
curl -H "Authorization: Bearer <token>" \
  https://api.surgeprotocol.game/v1/characters
```

### Cloudflare API Tokens
```javascript
// READ Token (D1 Access)
Scope: com.cloudflare.api.account.d1.read
TTL: 3600 seconds

// WRITE Token (D1 Modify)
Scope: com.cloudflare.api.account.d1.read/write
TTL: 3600 seconds
```

### Database Access Tokens
```javascript
// D1 Direct Access
Database ID: d72bdef1-8719-4820-b906-d751414cdd86
Access: read_write
TTL: 1800 seconds (30 minutes)
Scopes: tables:read, tables:write, queries:execute
```

---

## Infrastructure Status Check

### Current State
- **Cloudflare Account**: ✅ Active (`18e002ebc857b38bc8fd572fee926f75`)
- **D1 Database**: ✅ Configured (`surge-protocol-db`)
- **KV Namespace**: ✅ Configured (`CACHE`)
- **R2 Bucket**: ✅ Configured (`surge-protocol-assets`)
- **API Handlers**: 🚫 Not implemented (no src/)
- **Durable Objects**: 🚫 Not deployed (definitions ready)
- **Database Migrations**: 🚫 Not applied (0/10)

### Pre-flight Check
```bash
#!/bin/bash
# Quick infrastructure check

echo "Checking Cloudflare configuration..."
grep -q "account_id" wrangler.toml && echo "✅ Account ID set"
grep -q "d72bdef1-8719-4820-b906-d751414cdd86" wrangler.toml && echo "✅ D1 Database configured"
grep -q "651042312ee340a097b3cb41cd7c3262" wrangler.toml && echo "✅ KV Namespace configured"
grep -q "surge-protocol-assets" wrangler.toml && echo "✅ R2 Bucket configured"

echo ""
echo "Checking implementation..."
[ -d "src" ] && echo "✅ src/ directory exists" || echo "🚫 src/ directory missing"
[ -f "src/index.ts" ] && echo "✅ Entry point exists" || echo "🚫 Entry point missing"

echo ""
echo "Checking npm packages..."
npm list hono wrangler 2>/dev/null | grep -E "hono|wrangler"
```

---

## Real-time Monitoring Endpoints

When code is implemented, monitor these endpoints for health:

### Character System
```
GET  /api/v1/characters/{id}
POST /api/v1/characters
PATCH /api/v1/characters/{id}
```

### Missions
```
GET  /api/v1/missions/available
POST /api/v1/missions/{id}/accept
POST /api/v1/missions/{id}/action
POST /api/v1/missions/{id}/complete
```

### Combat (Real-time)
```
POST /api/v1/combat/initialize
WS   /api/v1/combat/{id}
POST /api/v1/combat/{id}/action
```

### Durable Objects (Real-time)
```
WS /api/v1/world/time          (WorldClock)
WS /api/v1/wars                (WarTheater)
WS /api/v1/combat/{id}         (CombatSession)
```

---

## Database Schema Monitoring

### 270 Tables Across 10 Migrations

**Status Check** (after migrations applied):
```sql
-- Check migration status
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- Count tables
SELECT COUNT(*) FROM sqlite_master WHERE type='table';

-- Verify key tables exist
SELECT COUNT(*) FROM characters;
SELECT COUNT(*) FROM character_augments;
SELECT COUNT(*) FROM combat_instances;
SELECT COUNT(*) FROM factions;
SELECT COUNT(*) FROM missions;
SELECT COUNT(*) FROM story_arcs;
```

### Key Tables to Monitor

#### Character System
- `characters` - Core player data
- `character_attributes` - Stats (PWR, AGI, END, INT, WIS, EMP, VEL, PRC)
- `rating_components` - Rating calculation
- `humanity_thresholds` - Humanity erosion

#### Combat System
- `combat_instances` - Active combats
- `combat_encounters` - Encounter definitions
- `character_conditions` - Status effects
- `cyberpsychosis_episodes` - Mental health

#### Economy
- `character_finances` - Player money
- `financial_transactions` - Transaction ledger
- `vendor_inventories` - Shop stock
- `debts` - Debt tracking

#### Factions
- `character_reputations` - Dual reputation (visible/hidden)
- `faction_wars` - Territory control
- `factions` - 12 faction definitions

---

## Implementation Checklist

Use this to track progress as you build:

### Phase 1: Foundation (Week 1-2)
- [ ] Create src/index.ts with Hono router
- [ ] Implement JWT verification middleware
- [ ] Set up error handling & logging
- [ ] Apply database migrations (npm run db:migrate)
- [ ] Create character creation endpoint (POST /characters)

### Phase 2: Core Features (Week 3-5)
- [ ] Implement mission system (get available, accept, action, complete)
- [ ] Build combat logic (2d6 dice, initiative, turn order)
- [ ] Create economy endpoints (finances, purchase, contracts)
- [ ] Implement faction reputation system
- [ ] Build narrative/dialogue system

### Phase 3: Real-time (Week 6-7)
- [ ] Implement CombatSession Durable Object
- [ ] Implement WarTheater Durable Object
- [ ] Implement WorldClock Durable Object
- [ ] Create WebSocket handlers
- [ ] Test concurrent operations

### Phase 4: Polish & Deploy (Week 8)
- [ ] Write comprehensive tests
- [ ] Performance optimization
- [ ] Deploy to staging environment
- [ ] Load testing (especially combat mechanics)
- [ ] Deploy to production

---

## Monitoring Scripts Location

All scripts created during examination are in `/tmp/`:

```bash
/tmp/cf-token-generator.js      # CF token creation
/tmp/surge-dashboard.js         # Infrastructure dashboard
/tmp/realtime-monitor.js        # Token generation + API status
/tmp/cf-check.sh               # Network connectivity test
/tmp/surge-dashboard.js        # Full dashboard
/tmp/realtime-monitor.js       # Monitoring tool
```

Plus persistent script in repo:
```bash
scripts/realtime-monitor.sh     # Bash script for quick checks
```

---

## Environment Variables

Ensure these are set before deployment:

```bash
# Required for JWT
JWT_SECRET=<openssl rand -base64 32>

# Cloudflare API access
CLOUDFLARE_API_TOKEN=<your-api-token>
CLOUDFLARE_ACCOUNT_ID=18e002ebc857b38bc8fd572fee926f75

# Environment identifier
ENVIRONMENT=development|staging|production
```

---

## Cloudflare API Reference

Account ID: `18e002ebc857b38bc8fd572fee926f75`

### D1 Database
- **ID**: `d72bdef1-8719-4820-b906-d751414cdd86`
- **Name**: `surge-protocol-db`
- **Binding**: `DB`
- **Migrations**: 10 files, 270 tables
- **API**: `wrangler d1 execute surge-protocol-db --file=<file.sql>`

### KV Namespace
- **ID**: `651042312ee340a097b3cb41cd7c3262`
- **Name**: `CACHE`
- **Binding**: `CACHE`
- **API**: `c.env.CACHE.get/put/delete`

### R2 Bucket
- **Name**: `surge-protocol-assets`
- **Binding**: `ASSETS`
- **API**: `c.env.ASSETS.get/put/delete`

### Workers
- **Name**: `surge-protocol-api`
- **Main**: `src/index.ts`
- **URL**: `https://surge-protocol-api.<account>.workers.dev`

---

## Real-time Status Page Example

Once deployed, you can create a status page at `/api/v1/status`:

```json
{
  "success": true,
  "data": {
    "status": "operational",
    "version": "0.1.0",
    "components": {
      "database": {
        "status": "operational",
        "tables": 270,
        "migrations_applied": 10
      },
      "cache": {
        "status": "operational",
        "namespace": "CACHE"
      },
      "combat_system": {
        "status": "operational",
        "active_combats": 42
      },
      "world_state": {
        "status": "operational",
        "game_time": "2037-03-15T22:45:00Z",
        "active_players": 156
      }
    }
  },
  "meta": {
    "timestamp": "2026-01-16T04:48:56Z",
    "uptime": "99.98%"
  }
}
```

---

## Troubleshooting

### Database Not Responding
```bash
# Check if migrations were applied
wrangler d1 execute surge-protocol-db --command="SELECT COUNT(*) FROM characters"

# Re-apply migrations if needed
npm run db:migrate
```

### API Not Deploying
```bash
# Check if src/ exists and is valid
ls -la src/

# Build manually
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### WebSocket Not Working
```bash
# Verify Durable Objects are enabled in wrangler.toml
grep -A 3 "durable_objects" wrangler.toml

# Check Durable Object classes are implemented
ls -la src/realtime/
```

### Token Generation Failing
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# Check CF API credentials
echo $CLOUDFLARE_API_TOKEN | head -c 10
```

---

## Contact & Support

For questions about the infrastructure examination:
- Check `INFRASTRUCTURE_EXAMINATION.md` (comprehensive guide)
- Review `Claude.md` (development guidelines)
- Check `API_SPECIFICATION.md` (API design)
- Review `IMPLEMENTATION_PLAN.md` (8-week roadmap)

---

**Last Updated**: 2026-01-16
**Examiner**: Claude Code (Real-time Monitoring Agent)
**Status**: ✅ Ready for Implementation
