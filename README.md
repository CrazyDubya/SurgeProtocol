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

## Tech Stack

- **Runtime**: Cloudflare Workers (Edge computing)
- **Database**: Cloudflare D1 (SQLite at edge)
- **Cache**: Cloudflare KV
- **Real-time**: Durable Objects (WebSocket support)
- **Storage**: Cloudflare R2
- **Framework**: Hono (Web framework)
- **Language**: TypeScript

## Project Structure

```
src/
├── api/                 # REST API routes
│   ├── auth/           # Authentication
│   ├── character/      # Character management
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

migrations/            # D1 database migrations
scripts/              # Development scripts
tests/                # Unit & integration tests
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
```

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

### Post-Deployment

```bash
# Warm cache with game data
curl -X POST https://your-worker.workers.dev/internal/admin/cache/warm

# Verify deployment
curl https://your-worker.workers.dev/health
```

## Game Systems

### Dice Engine
Core resolution uses 2d6 + modifiers vs target number:
- **CATASTROPHE**: Snake eyes (1, 1)
- **MISS**: Below target by 5+
- **GRAZE**: Below target by 1-4
- **HIT**: Meet or exceed target
- **PERFECT**: Exceed by 5+ or boxcars (6, 6)

### Rating System
10-tier weighted scoring:
- Speed (20%): Delivery time efficiency
- Care (20%): Package condition
- Reliability (25%): Completion rate
- Customer (15%): User ratings
- Hidden (20%): Corporate compliance

### Combat
Turn-based tactical combat:
- Initiative: 2d6 + VEL + PRC
- Attack: 2d6 + skill vs Defense
- Defense: 8 + AGI + armor + cover
- Damage: Weapon dice + margin - armor

## Contributing

1. Create a feature branch from `main`
2. Write tests for new functionality
3. Ensure TypeScript compiles without errors
4. Run the test suite
5. Submit a pull request

## License

[License details here]

---

*"Efficiency rating: PENDING. Complete your deliveries."*
