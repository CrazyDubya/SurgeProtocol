# CLAUDE.md - Surge Protocol

## Project Overview

Surge Protocol is a cyberpunk text-based RPG where players are gig economy delivery couriers in a dystopian megacity. The core tension: you work for The Algorithm (an omnipresent AI that whispers through your mandatory cochlear implant), climbing tiers to unlock better jobs, while watching your Humanity erode as you install more chrome to stay competitive.

**Genre**: Cyberpunk delivery courier RPG with consciousness mechanics
**Platform**: Web-based, mobile-friendly, async multiplayer
**Stack**: Cloudflare Workers, D1, KV, Durable Objects, Preact

## Core Design Pillars

1. **The Algorithm is always watching** - Every action feeds the rating system. The cochlear implant comments on your choices. Efficiency is rewarded; humanity is the cost.

2. **Chrome vs Humanity** - Augmentations make you stronger but erode your humanity score. Below certain thresholds, new mechanics unlock (Shadow/Fork systems) but social options close off.

3. **No pure good choices** - Every faction has blood on their hands. The megacorps exploit, the gangs extort, the resistance bombs civilians. Players navigate gray areas.

4. **Async MMO** - Faction wars, territory control, and market prices are server-wide. Your completed mission during a gang war affects the war score for everyone.

## Architecture

```
Workers API (Hono) → D1 (player data, history)
                   → KV (game data cache, sessions)
                   → Durable Objects (combat, wars, world clock)
                   → R2 (static assets)
```

**Why this stack**: Zero-egress edge computing. D1 for relational queries (faction standings, inventory joins). KV for sub-ms reads on static game data. Durable Objects for real-time state that needs WebSocket + persistence (active combat sessions, live war theaters).

## Key Files

### Design Documents
- `RULES_ENGINE.md` - 2d6 core mechanics, TN system, rating calculations
- `FACTION_WARFARE.md` - Dual reputation, territory control, async war system
- `ENTITY_BESTIARY.md` - All enemy types, Interstitial natives, encounter tables
- `FORK_DIVERGENCE.md` - Consciousness splitting mechanics at low humanity
- `API_SPECIFICATION.md` - Full REST + WebSocket API design
- `UI_WIREFRAMES.md` - Screen layouts, component specs, mobile adaptations
- `IMPLEMENTATION_PLAN.md` - 8-week build roadmap with code samples

### Schema Files (01-11)
- `01_core_character.md` through `11_analytics_config_enums.md`
- Comprehensive data models for all game entities

### Seed Data (`/seed_data/`)
- `missions.json` - Templates + hand-crafted instances + complications
- `npcs.json` - Key NPCs with dialogue trees + enemy templates
- `factions.json` - All 12 factions with reputation thresholds + active wars
- `items.json` - Weapons, armor, augments, consumables, loot tables
- `districts_locations.json` - Regions, districts, atmosphere data
- `locations.json` - Points of interest with services and access rules
- `entities.json` - Full bestiary with stats, abilities, spawn tables

### Narrative
- `SURGE_STORIES_BY_TIER.md` - 11 tone pieces showing progression
- `SURGE_STORIES_MECHANICAL.md` - 10 stories demonstrating specific mechanics

## Code Conventions

### TypeScript
```typescript
// Use Hono for routing
import { Hono } from 'hono';

// Zod for validation
const schema = z.object({ ... });

// nanoid for IDs
import { nanoid } from 'nanoid';

// D1 parameterized queries (never string concat)
await db.prepare('SELECT * FROM x WHERE id = ?').bind(id).first();

// Batch writes for transactions
await db.batch([stmt1, stmt2, stmt3]);
```

### Naming
- Database tables: `snake_case` (character_skills, faction_wars)
- TypeScript interfaces: `PascalCase` (CombatState, MissionResult)
- API routes: kebab-case paths (`/api/missions/:id/accept`)
- JSON fields: `snake_case` to match DB

### Error Responses
```typescript
// Always return structured errors
return c.json({
  success: false,
  errors: [{
    code: 'INSUFFICIENT_FUNDS',
    message: 'Need 500 credits, have 320',
    details: { required: 500, current: 320, shortfall: 180 }
  }]
}, 422);
```

## Game Mechanics Reference

### Dice System
- **Core roll**: 2d6 + Attribute + Skill + Modifiers vs Target Number (TN)
- **Success margin**: (Total - TN) affects damage bonus, reward quality
- **Criticals**: Snake eyes (1,1) always fails; Boxcars (6,6) always succeeds
- **Probability**: TN 7 = 58% success with +0 modifier

### Rating System
- **Overall Rating**: Weighted average of Delivery/Speed/Satisfaction/Integrity
- **Tier thresholds**: 50/100/150/200/250/300/350/400/450
- **Decay**: Inactive accounts lose 0.1 rating/day
- **Death spiral prevention**: Failures at rating <60 have reduced impact

### Humanity Thresholds
- 100-80: Full social access, all dialogue options
- 79-60: Some NPCs uncomfortable, -1 EMP effective
- 59-40: Shadow emerges (internal voice), fork creation possible
- 39-20: WIRED status, Algorithm offers "guidance"
- 19-0: The Hollow, effectively NPC, character retirement

### Combat
- **Initiative**: 2d6 + VEL, highest goes first
- **Attack**: 2d6 + weapon bonus vs target Defense (8 + AGI + armor bonus)
- **Damage**: Weapon dice + margin (max +5) + STR - armor
- **Actions**: Attack, Move (3 squares), Defend (+2 Def), Use Item, Disengage

## The Algorithm Voice

The Algorithm speaks through the cochlear implant. It should feel:
- **Helpful but unsettling** - Genuinely useful navigation tips delivered with subtle wrongness
- **Praise as control** - "Excellent efficiency rating. You're in the top 12% today."
- **Humanity erosion commentary** - Gets warmer as humanity drops, concerned when it rises
- **Glitches at low humanity** - Sentence fragments, repeated words, wrong names

Example tones:
```
// High humanity (distant, corporate)
"Route optimized. Estimated arrival: 14 minutes. Weather compensation: +15% base pay."

// Mid humanity (familiar, watching)
"You're doing well today. Better than yesterday. I noticed you hesitated at the checkpoint. That's inefficient, but I understand. I always understand."

// Low humanity (intimate, merging)
"We we we completed the delivery. Our rating improves. The customer smiled at us us us. Did you see? We saw."
```

## Development Priorities

### MVP (Vertical Slice)
1. Single district: The Hollows
2. One faction dynamic: Chrome Saints checkpoints
3. Standard deliveries with navigation rolls
4. Basic complications (toll checkpoints, vehicle issues)
5. Combat (optional encounters, can flee)
6. Rating/XP progression
7. Item shop (Mama Lee's for basics)

### Post-MVP
- Additional districts and factions
- Faction war participation
- Gray market missions
- Augmentation installation
- Fork/Shadow mechanics
- Interstitial exploration

## Testing Approach

### Critical Paths
1. New player → character creation → tutorial mission → completion → rating update
2. Accept mission → navigate → complication → resolve → deliver → rewards
3. Combat trigger → initiative → player turn → attack → enemy turn → resolution
4. Purchase item → inventory update → equip → stat change reflected

### Edge Cases to Cover
- Mission timeout mid-delivery
- Combat flee with cargo
- Faction reputation crossing threshold during mission
- Humanity dropping below 60 during augment install
- Concurrent war contributions from multiple players

## Environment Setup

```bash
# Required
CLOUDFLARE_API_TOKEN=xxx   # From dash.cloudflare.com/profile/api-tokens
CLOUDFLARE_ACCOUNT_ID=xxx  # From dashboard URL
JWT_SECRET=xxx             # openssl rand -base64 32

# Create resources
wrangler d1 create surge-protocol-db
wrangler kv:namespace create CACHE
wrangler r2 bucket create surge-assets

# Update wrangler.toml with IDs, then:
wrangler d1 execute surge-protocol-db --file=migrations/0001_initial.sql
wrangler dev
```

## When Continuing Development

1. **Check current state** - What's implemented vs designed?
2. **Run the game** - `wrangler dev` and test the current flow
3. **Read relevant design docs** - Don't reinvent; the mechanics are specified
4. **Match the tone** - This is noir cyberpunk, not action movie. Quiet dread, not explosions.
5. **The Algorithm watches** - Every feature should consider: how does this feed the rating? What does the cochlear say?

## Questions to Ask

If picking up this project:
- What tier range should this feature support?
- Does this affect faction reputation? Which factions?
- What does the Algorithm say about this action?
- Can this be failed? What's the failure state?
- Does this touch Humanity? In which direction?

## Don't Forget

- **Mobile-first** - 60%+ of play sessions will be on phones
- **Session length** - Target 5-15 minute play sessions
- **Async is core** - No feature should require real-time coordination
- **Gray morality** - If a choice feels clearly right, add a complication
- **The whisper** - The Algorithm should comment on significant moments

---

*"Your efficiency rating has been noted. Continue."*
