# SurgeProtocol

Cyberpunk text-based async MMO backend built on Cloudflare Workers.

## Quick Start for New Agents

1. **First Read**: `INFRASTRUCTURE_EXAMINATION.md` - Complete overview of what's built
2. **Next**: `REALTIME_MONITORING_GUIDE.md` - Quick reference and troubleshooting
3. **For APIs**: `API_SPECIFICATION.md` - Full endpoint documentation
4. **To Build**: `IMPLEMENTATION_PLAN.md` - 8-week development roadmap
5. **Setup**: `Claude.md` - Development guidelines and setup instructions

## Project Status

- **Design**: ✅ 100% Complete (11 comprehensive schema docs)
- **Architecture**: ✅ 100% Complete (Cloudflare edge infrastructure configured)
- **Database**: ✅ 100% Complete (270 tables, 10 migrations ready)
- **Code**: 🚫 0% (Ready to begin implementation)

## Key Resources

### Main Documentation (Start Here)
- `INFRASTRUCTURE_EXAMINATION.md` - Complete 360° analysis
- `REALTIME_MONITORING_GUIDE.md` - Commands, monitoring, troubleshooting
- `API_SPECIFICATION.md` - Full API design
- `IMPLEMENTATION_PLAN.md` - 8-week roadmap
- `Claude.md` - Development guidelines
- `RULES_ENGINE.md` - Game mechanics (2d6 system)

### Reference Documentation
- `documentation/schema/` - Detailed schema files (11 files, for deep dives)
- `migrations/` - D1 database migrations (10 files, 270 tables)

### Scripts
- `scripts/realtime-monitor.sh` - Quick status check
- `scripts/validate-schema.js` - Schema validation
- `scripts/setup-hooks.sh` - Pre-commit hook setup

## Cloudflare Infrastructure

- **Workers**: surge-protocol-api (Hono v4.0.0)
- **D1 Database**: surge-protocol-db (SQLite, 270 tables)
- **KV Namespace**: CACHE (session/game data)
- **R2 Bucket**: surge-protocol-assets (character data)
- **Durable Objects**: 3 classes for real-time features

## Game Overview

**Genre**: Cyberpunk courier RPG
**Setting**: Dystopian megacity, 2037
**Core Mechanic**: 2d6 dice + attributes vs. target numbers
**Tension**: Chrome (power) vs. Humanity (sanity)
**Multiplayer**: Async MMO with faction warfare

Key systems: Character progression, augmentations, combat, economy, factions, missions, narrative, consciousness splitting.

## Getting Started

```bash
# Install dependencies
npm install

# Local development
npm run dev

# Run schema validation
npm run lint:schema

# Apply database migrations (when ready)
npm run db:migrate

# Deploy
npm run deploy:staging
npm run deploy:production
```

## Repository Structure

```
├── migrations/                  # D1 database migrations (10 files)
├── scripts/                     # Utility scripts
├── tests/                       # Test suite
├── documentation/
│   └── schema/                  # Detailed schema reference docs
├── src/                         # API handlers (to be created)
├── wrangler.toml               # Cloudflare Workers config
├── package.json                # Dependencies
├── INFRASTRUCTURE_EXAMINATION.md    # Primary read
├── REALTIME_MONITORING_GUIDE.md    # Quick reference
├── API_SPECIFICATION.md        # Full API design
├── IMPLEMENTATION_PLAN.md      # 8-week roadmap
├── Claude.md                   # Development guide
└── RULES_ENGINE.md             # Game mechanics
```

## Next Steps

When ready to develop:

1. Create `src/index.ts` with Hono router
2. Implement JWT authentication middleware
3. Apply database migrations (`npm run db:migrate`)
4. Build character creation endpoint
5. Implement mission system
6. Add combat mechanics (2d6 dice)
7. Deploy Durable Objects for real-time features
8. Comprehensive testing and optimization

See `IMPLEMENTATION_PLAN.md` for detailed Phase 1-4 breakdown.

---

**Current Branch**: claude/explore-repo-architecture-LcbHq
**Status**: Infrastructure examined, ready for implementation phase
**Last Updated**: 2026-01-16
