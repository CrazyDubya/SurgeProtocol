# Surge Protocol

A cyberpunk delivery courier MMORPG built on Cloudflare's edge infrastructure.

> *"The Algorithm sees all. Deliver efficiently."*

## Overview

Surge Protocol is a text-based multiplayer RPG where players take on the role of delivery couriers in a dystopian megacity. Navigate dangerous streets, build faction relationships, engage in real-time combat, and climb the corporate ladder—or burn it down.

### Core Features

- **Delivery Missions**: Accept contracts ranging from simple packages to high-risk extractions
- **10-Tier Rating System**: Your carrier rating affects job availability and pay
- **Faction Wars**: Real-time faction conflicts with territory control
- **Cyberpunk Combat**: Turn-based tactical combat with augments and gear
- **Character Progression**: Skills, attributes, and convergence paths
- **Consciousness Mechanics**: Humanity system with cyberpsychosis and consciousness splitting

## Tech Stack

- **Runtime**: Cloudflare Workers (Edge computing)
- **Database**: Cloudflare D1 (SQLite at edge)
- **Cache**: Cloudflare KV
- **Real-time**: Durable Objects (WebSocket support)
- **Storage**: Cloudflare R2
- **Framework**: Hono (Web framework)
- **Language**: TypeScript

## Documentation

### For New Developers

1. **Start here**: [INFRASTRUCTURE_EXAMINATION.md](./INFRASTRUCTURE_EXAMINATION.md) - Complete architectural overview
2. **Quick reference**: [REALTIME_MONITORING_GUIDE.md](./REALTIME_MONITORING_GUIDE.md) - Monitoring, tokens, troubleshooting
3. **API details**: [API_SPECIFICATION.md](./API_SPECIFICATION.md) - Full endpoint documentation
4. **Setup guide**: [Claude.md](./Claude.md) - Development guidelines

### Game Design & Rules

- [RULES_ENGINE.md](./RULES_ENGINE.md) - 2d6 system and game mechanics
- [ENTITY_BESTIARY.md](./ENTITY_BESTIARY.md) - NPC and creature definitions
- [FACTION_WARFARE.md](./FACTION_WARFARE.md) - War system mechanics
- [SURGE_STORIES_BY_TIER.md](./SURGE_STORIES_BY_TIER.md) - Narrative content by tier
- [FORK_DIVERGENCE.md](./FORK_DIVERGENCE.md) - Consciousness branching system
- [UI_WIREFRAMES.md](./UI_WIREFRAMES.md) - User interface designs

### Reference Documentation

- [documentation/schema/](./documentation/schema/) - Detailed system specifications (11 files)
- [API_ROUTES.md](./API_ROUTES.md) - Complete API route reference
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Development roadmap

## Project Structure

```
src/
├── api/                 # REST API routes
│   ├── auth/           # Authentication endpoints
│   ├── character/      # Character CRUD operations
│   ├── mission/        # Mission system
│   ├── faction/        # Faction & war system
│   └── admin/          # Internal admin routes
├── cache/              # KV caching layer
├── db/                 # Database queries & seeding
├── game/
│   └── mechanics/      # Core game systems
│       ├── dice.ts     # 2d6 resolution engine
│       ├── combat.ts   # Combat calculations
│       └── rating.ts   # Carrier rating system
├── middleware/         # Auth & validation
├── realtime/          # Durable Objects
│   ├── combat.ts      # CombatSession DO
│   ├── world.ts       # WorldClock DO
│   └── war.ts         # WarTheater DO
├── services/          # External services
│   └── cf-token-service.ts
├── utils/             # Utilities & helpers
└── index.ts           # Main entry point

migrations/            # D1 database migrations (270 tables, 10 files)
scripts/              # Development scripts
tests/                # Unit & integration tests
documentation/       # Design docs and architecture
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Installation

```bash
# Clone the repository
git clone https://github.com/CrazyDubya/SurgeProtocol.git
cd SurgeProtocol

# Install dependencies
npm install

# Login to Cloudflare
wrangler login
```

### Local Development

```bash
# Start development server
npm run dev

# Run with local D1 database
wrangler dev --local --persist
```

### Database Setup

```bash
# Create D1 database (if not exists)
wrangler d1 create surge-protocol-db

# Run migrations
wrangler d1 execute surge-protocol-db --local --file=migrations/apply_all.sql

# Seed development data
curl -X POST http://localhost:8787/internal/admin/seed
```

### Environment Variables

Create a `.dev.vars` file for local development:

```env
JWT_SECRET=your-development-secret-key-min-32-chars
CF_MASTER_TOKEN=your-cloudflare-api-token
CF_ACCOUNT_ID=your-cloudflare-account-id
ENVIRONMENT=development
```

## Configuration

### wrangler.toml

Key bindings configured in `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "development"

[[d1_databases]]
binding = "DB"
database_name = "surge-protocol-db"

[[kv_namespaces]]
binding = "CACHE"

[[r2_buckets]]
binding = "ASSETS"

[[durable_objects.bindings]]
name = "COMBAT_SESSION"
class_name = "CombatSession"

[[durable_objects.bindings]]
name = "WAR_THEATER"
class_name = "WarTheater"

[[durable_objects.bindings]]
name = "WORLD_CLOCK"
class_name = "WorldClock"
```

## API Reference

See [API_ROUTES.md](./API_ROUTES.md) for complete API documentation.

### Quick Reference

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Create account |
| `POST /api/auth/login` | Authenticate |
| `POST /api/characters` | Create character |
| `GET /api/missions/available` | List missions |
| `POST /api/missions/:id/accept` | Accept mission |
| `GET /api/factions` | List factions |
| `POST /api/factions/wars/:id/contribute` | War contribution |

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests (requires running server)
API_BASE_URL=http://localhost:8787 npx tsx scripts/test-flows.ts

# Run schema validation
npm run lint:schema
```

## Real-time Features

### Durable Objects

Three Durable Objects provide real-time game state:

1. **CombatSession** - Turn-based combat with WebSocket connections
   - Initiative calculation (2d6 + VEL)
   - Action resolution and logging
   - Real-time battlefield state

2. **WarTheater** - Server-wide faction warfare
   - Territory control tracking
   - War score calculations
   - Player contribution aggregation

3. **WorldClock** - Shared game time and environment
   - Game time progression (1 real second = 60 game seconds)
   - Dynamic weather system
   - Environmental effects on gameplay

## Deployment

### Deploy to Cloudflare

```bash
# Deploy to production
npm run deploy

# Deploy to staging
wrangler deploy --env staging
```

### Deployment Checklist

- [ ] All environment secrets configured in Cloudflare dashboard
- [ ] D1 database created and migrations applied
- [ ] KV namespace created
- [ ] R2 bucket created
- [ ] Durable Objects migrations complete
- [ ] Custom domain configured (optional)

## Database Schema

The project uses 270 tables across 10 D1 migrations covering:

- **Character System**: Progression, attributes, rating mechanics
- **Augmentation**: Cybernetics, humanity tracking
- **Combat**: Initiative, turns, conditions, status effects
- **Economy**: Currency, contracts, vendors, debts
- **Missions**: Objectives, complications, rewards
- **Factions**: Reputation, territory control, wars
- **Narrative**: Story arcs, dialogue trees, quests
- **Social**: Crews, leaderboards, analytics
- **Persistence**: Saves, profiles, game configuration

See [documentation/schema/](./documentation/schema/) for detailed specifications.

## Monitoring & Debugging

### Real-time Monitoring

```bash
# Quick infrastructure check
bash scripts/realtime-monitor.sh

# Full dashboard
node /tmp/realtime-monitor.js

# Infrastructure status page
node /tmp/surge-dashboard.js
```

See [REALTIME_MONITORING_GUIDE.md](./REALTIME_MONITORING_GUIDE.md) for detailed commands.

## Contributing

When adding features:

1. Create a feature branch from `main`
2. Name it: `claude/<feature-name>-<session-id>`
3. Implement with tests
4. Ensure all schema validations pass
5. Create PR with detailed description
6. Get code review approval
7. Squash and merge to main

## Development Phases

**Phase 1: Foundation** ✅ Complete
- D1 database schema (270 tables)
- Durable Objects architecture
- Core API handlers
- Authentication system

**Phase 2: Core Systems** ✅ Complete
- Character creation and progression
- Mission system with complications
- Combat mechanics (2d6, initiative)
- Economy and faction systems
- Narrative/dialogue

**Phase 3: Real-time Features** ✅ In Progress
- WebSocket integration
- Real-time combat
- Faction wars
- Dynamic world state

**Phase 4: Optimization & Scaling**
- Load testing
- Performance optimization
- Analytics implementation
- Production deployment

## License

Proprietary - Surge Protocol

## Support

For questions or issues:
- Check [INFRASTRUCTURE_EXAMINATION.md](./INFRASTRUCTURE_EXAMINATION.md) for architecture questions
- Review [REALTIME_MONITORING_GUIDE.md](./REALTIME_MONITORING_GUIDE.md) for operational questions
- See [Claude.md](./Claude.md) for development guidelines

---

**Current Status**: Implementation Phase
**Last Updated**: 2026-01-16
**Deployed Version**: TBD
