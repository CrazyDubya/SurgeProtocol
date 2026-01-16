# Surge Protocol: Implementation Plan

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLOUDFLARE EDGE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Workers   │    │     D1      │    │     KV      │    │     R2      │  │
│  │   (API)     │◄──►│  (SQLite)   │    │  (Cache)    │    │  (Assets)   │  │
│  └──────┬──────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│         │                                                                   │
│         │           ┌─────────────────────────────────────┐                │
│         └──────────►│         Durable Objects             │                │
│                     │  ┌─────────┐ ┌─────────┐ ┌───────┐  │                │
│                     │  │ Combat  │ │  War    │ │ World │  │                │
│                     │  │ Session │ │ Theater │ │ Clock │  │                │
│                     │  └─────────┘ └─────────┘ └───────┘  │                │
│                     └─────────────────────────────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▲
                                      │ WebSocket + REST
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Pages/Static)                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Preact + HTM (no build step) OR Vite + React (if you prefer)       │   │
│  │  ├── State: Zustand or signals                                      │   │
│  │  ├── Styling: Tailwind (CDN or compiled)                            │   │
│  │  └── WebSocket: Native API with reconnection                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack Decision

### Recommended: Zero-Build Edge Stack
```
Backend:  Cloudflare Workers (TypeScript)
Database: D1 (SQLite at edge)
Cache:    KV (sessions, computed data)
Realtime: Durable Objects (combat, wars, world state)
Storage:  R2 (character portraits, assets)
Frontend: Preact + HTM + Tailwind CDN (no build step)
          OR Cloudflare Pages with Vite (minimal build)
```

### Why This Stack
- **D1**: Perfect for turn-based RPG—relational data, complex queries, ACID transactions
- **KV**: Sub-millisecond reads for hot data (active missions, session tokens)
- **Durable Objects**: WebSocket + state co-location for real-time features
- **Preact/HTM**: ~4KB runtime, JSX-like syntax, no build step needed
- **Zero egress**: Everything stays on Cloudflare's network

---

## Phase 0: Foundation (Week 1)

### 0.1 Project Setup
```bash
# Create project
npm create cloudflare@latest surge-protocol -- --template worker-typescript
cd surge-protocol

# Add dependencies
npm install hono zod nanoid
npm install -D @cloudflare/workers-types wrangler

# Structure
mkdir -p src/{api,game,db,realtime,utils}
mkdir -p src/api/{auth,character,mission,combat,world,economy,faction}
mkdir -p src/game/{mechanics,narrative,ai}
mkdir -p src/realtime/{combat,war,world}
```

### 0.2 wrangler.toml Configuration
```toml
name = "surge-protocol"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "development"

[[d1_databases]]
binding = "DB"
database_name = "surge-protocol-db"
database_id = "YOUR_DB_ID"

[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_ID"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "surge-assets"

[[durable_objects.bindings]]
name = "COMBAT_SESSION"
class_name = "CombatSession"

[[durable_objects.bindings]]
name = "WAR_THEATER"
class_name = "WarTheater"

[[durable_objects.bindings]]
name = "WORLD_CLOCK"
class_name = "WorldClock"

[[migrations]]
tag = "v1"
new_classes = ["CombatSession", "WarTheater", "WorldClock"]
```

### 0.3 Database Schema Migration

Create `migrations/0001_initial.sql`:

```sql
-- Core character tables
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  
  -- Tier & Rating
  tier INTEGER DEFAULT 1,
  rating REAL DEFAULT 100.0,
  rating_delivery REAL DEFAULT 100.0,
  rating_speed REAL DEFAULT 100.0,
  rating_satisfaction REAL DEFAULT 100.0,
  rating_integrity REAL DEFAULT 100.0,
  
  -- Attributes (stored as JSON for flexibility)
  attributes TEXT NOT NULL DEFAULT '{"PWR":0,"AGI":0,"END":0,"VEL":0,"INT":0,"WIS":0,"EMP":0,"PRC":0}',
  
  -- Resources
  hp_current INTEGER DEFAULT 20,
  hp_max INTEGER DEFAULT 20,
  humanity INTEGER DEFAULT 100,
  xp_current INTEGER DEFAULT 0,
  xp_total INTEGER DEFAULT 0,
  credits INTEGER DEFAULT 50,
  
  -- Status
  origin TEXT,
  track TEXT,
  home_district TEXT,
  current_location TEXT,
  status TEXT DEFAULT 'IDLE',
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_active TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_characters_user ON characters(user_id);
CREATE INDEX idx_characters_status ON characters(status);

-- Character skills
CREATE TABLE character_skills (
  character_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  level INTEGER DEFAULT 0,
  xp_invested INTEGER DEFAULT 0,
  PRIMARY KEY (character_id, skill_id),
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Character augments
CREATE TABLE character_augments (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  augment_id TEXT NOT NULL,
  slot TEXT NOT NULL,
  installed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  condition INTEGER DEFAULT 100,
  enabled INTEGER DEFAULT 1,
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

CREATE INDEX idx_augments_character ON character_augments(character_id);

-- Character inventory
CREATE TABLE character_inventory (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  condition INTEGER DEFAULT 100,
  equipped INTEGER DEFAULT 0,
  slot TEXT,
  metadata TEXT,
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Faction standings
CREATE TABLE character_faction_standing (
  character_id TEXT NOT NULL,
  faction_id TEXT NOT NULL,
  reputation_visible INTEGER DEFAULT 0,
  reputation_hidden INTEGER DEFAULT 0,
  last_interaction TEXT,
  PRIMARY KEY (character_id, faction_id),
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- NPC relationships
CREATE TABLE character_npc_relations (
  character_id TEXT NOT NULL,
  npc_id TEXT NOT NULL,
  disposition INTEGER DEFAULT 50,
  trust INTEGER DEFAULT 0,
  interactions INTEGER DEFAULT 0,
  flags TEXT DEFAULT '[]',
  PRIMARY KEY (character_id, npc_id),
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Active missions
CREATE TABLE active_missions (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  mission_template_id TEXT,
  mission_instance_id TEXT,
  
  -- Generated mission data
  mission_data TEXT NOT NULL,  -- Full JSON of generated mission
  
  -- Progress tracking
  status TEXT DEFAULT 'ACCEPTED',
  current_phase TEXT DEFAULT 'PICKUP',
  current_waypoint INTEGER DEFAULT 0,
  
  -- Cargo state
  cargo_condition INTEGER DEFAULT 100,
  cargo_temperature REAL,
  
  -- Time tracking
  accepted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deadline_at TEXT NOT NULL,
  completed_at TEXT,
  
  -- Results (filled on completion)
  result TEXT,
  rewards_granted TEXT,
  
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

CREATE INDEX idx_missions_character ON active_missions(character_id);
CREATE INDEX idx_missions_status ON active_missions(status);

-- Mission history
CREATE TABLE mission_history (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  mission_type TEXT NOT NULL,
  result TEXT NOT NULL,
  rating_change REAL,
  credits_earned INTEGER,
  xp_earned INTEGER,
  completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  duration_minutes INTEGER,
  details TEXT,
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Combat encounters (for persistence between sessions)
CREATE TABLE combat_encounters (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  mission_id TEXT,
  
  -- Combat state
  battlefield TEXT NOT NULL,  -- JSON: grid, cover, positions
  combatants TEXT NOT NULL,   -- JSON: all combatant states
  turn_order TEXT NOT NULL,   -- JSON: initiative order
  current_turn INTEGER DEFAULT 0,
  round INTEGER DEFAULT 1,
  
  -- Metadata
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'ACTIVE',
  
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- World state (server-wide)
CREATE TABLE world_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- District control
CREATE TABLE district_control (
  district_id TEXT PRIMARY KEY,
  controlling_faction TEXT,
  control_percentage INTEGER DEFAULT 0,
  contested INTEGER DEFAULT 0,
  alert_level TEXT DEFAULT 'NORMAL',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Active wars
CREATE TABLE faction_wars (
  id TEXT PRIMARY KEY,
  attacker_id TEXT NOT NULL,
  defender_id TEXT NOT NULL,
  contested_territory TEXT NOT NULL,
  
  attacker_score INTEGER DEFAULT 0,
  defender_score INTEGER DEFAULT 0,
  
  phase TEXT DEFAULT 'ESCALATION',
  day INTEGER DEFAULT 1,
  
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  ended_at TEXT,
  winner TEXT
);

-- War contributions
CREATE TABLE war_contributions (
  id TEXT PRIMARY KEY,
  war_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  faction_side TEXT NOT NULL,
  contribution_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  contributed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (war_id) REFERENCES faction_wars(id),
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Transaction log (economy)
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  source TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

CREATE INDEX idx_transactions_character ON transactions(character_id);

-- User accounts
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT
);

-- Sessions
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 0.4 Seed Data Import Script

```typescript
// scripts/seed.ts
async function seedDatabase(db: D1Database, cache: KVNamespace) {
  // Load seed files (from /seed_data/)
  const missions = await import('../seed_data/missions.json');
  const npcs = await import('../seed_data/npcs.json');
  const factions = await import('../seed_data/factions.json');
  const items = await import('../seed_data/items.json');
  const districts = await import('../seed_data/districts_locations.json');
  const entities = await import('../seed_data/entities.json');

  // Store static game data in KV for fast access
  await cache.put('game:missions', JSON.stringify(missions));
  await cache.put('game:npcs', JSON.stringify(npcs));
  await cache.put('game:factions', JSON.stringify(factions));
  await cache.put('game:items', JSON.stringify(items));
  await cache.put('game:districts', JSON.stringify(districts));
  await cache.put('game:entities', JSON.stringify(entities));
  
  // Seed initial world state
  for (const district of districts.districts) {
    await db.prepare(`
      INSERT INTO district_control (district_id, controlling_faction, control_percentage)
      VALUES (?, ?, ?)
    `).bind(
      district.id,
      district.controlling_faction,
      district.control_percentage || 0
    ).run();
  }
  
  // Seed active war from faction data
  for (const war of factions.active_wars) {
    await db.prepare(`
      INSERT INTO faction_wars (id, attacker_id, defender_id, contested_territory, phase, day)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      war.id,
      war.attacker_id,
      war.defender_id,
      war.contested_territory,
      war.phase,
      war.current_day
    ).run();
  }
  
  console.log('Seed complete!');
}
```

---

## Phase 1: Core Game Loop (Weeks 2-3)

### 1.1 API Router Setup

```typescript
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

import { authRoutes } from './api/auth';
import { characterRoutes } from './api/character';
import { missionRoutes } from './api/mission';
import { combatRoutes } from './api/combat';
import { worldRoutes } from './api/world';
import { economyRoutes } from './api/economy';

// Durable Object exports
export { CombatSession } from './realtime/combat';
export { WarTheater } from './realtime/war';
export { WorldClock } from './realtime/world';

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  ASSETS: R2Bucket;
  COMBAT_SESSION: DurableObjectNamespace;
  WAR_THEATER: DurableObjectNamespace;
  WORLD_CLOCK: DurableObjectNamespace;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', cors());
app.use('/api/*', async (c, next) => {
  if (c.req.path.startsWith('/api/auth')) return next();
  return jwt({ secret: c.env.JWT_SECRET })(c, next);
});

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/characters', characterRoutes);
app.route('/api/missions', missionRoutes);
app.route('/api/combat', combatRoutes);
app.route('/api/world', worldRoutes);
app.route('/api/economy', economyRoutes);

// WebSocket upgrade for Durable Objects
app.get('/ws/combat/:combatId', async (c) => {
  const id = c.env.COMBAT_SESSION.idFromName(c.req.param('combatId'));
  const stub = c.env.COMBAT_SESSION.get(id);
  return stub.fetch(c.req.raw);
});

app.get('/ws/war/:warId', async (c) => {
  const id = c.env.WAR_THEATER.idFromName(c.req.param('warId'));
  const stub = c.env.WAR_THEATER.get(id);
  return stub.fetch(c.req.raw);
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default app;
```

### 1.2 Dice & Mechanics Engine

```typescript
// src/game/mechanics/dice.ts

export interface DiceRoll {
  dice: number[];
  total: number;
}

export interface SkillCheck {
  roll: DiceRoll;
  modifiers: { name: string; value: number }[];
  total: number;
  tn: number;
  success: boolean;
  margin: number;
  critical?: 'SUCCESS' | 'FAILURE';
}

export function rollDice(count: number, sides: number): DiceRoll {
  const dice: number[] = [];
  for (let i = 0; i < count; i++) {
    dice.push(Math.floor(Math.random() * sides) + 1);
  }
  return { dice, total: dice.reduce((a, b) => a + b, 0) };
}

export function performSkillCheck(
  attributeModifier: number,
  skillLevel: number,
  bonuses: { name: string; value: number }[],
  penalties: { name: string; value: number }[],
  tn: number
): SkillCheck {
  const roll = rollDice(2, 6);
  
  const modifiers = [
    { name: 'Attribute', value: attributeModifier },
    { name: 'Skill', value: skillLevel },
    ...bonuses,
    ...penalties.map(p => ({ name: p.name, value: -p.value }))
  ];
  
  const totalModifier = modifiers.reduce((sum, m) => sum + m.value, 0);
  const total = roll.total + totalModifier;
  const success = total >= tn;
  const margin = total - tn;
  
  // Check for criticals (snake eyes / boxcars)
  let critical: 'SUCCESS' | 'FAILURE' | undefined;
  if (roll.dice[0] === 6 && roll.dice[1] === 6) critical = 'SUCCESS';
  else if (roll.dice[0] === 1 && roll.dice[1] === 1) critical = 'FAILURE';
  
  return {
    roll,
    modifiers,
    total,
    tn,
    success: critical === 'SUCCESS' ? true : critical === 'FAILURE' ? false : success,
    margin,
    critical
  };
}

// Combat damage calculation
export function calculateDamage(
  baseDamage: string,  // e.g., "2d6+2"
  margin: number,
  strengthBonus: number,
  targetArmor: number
): { raw: number; final: number; breakdown: string[] } {
  const match = baseDamage.match(/(\d+)d(\d+)([+-]\d+)?/);
  if (!match) throw new Error(`Invalid damage string: ${baseDamage}`);
  
  const [_, count, sides, bonus] = match;
  const roll = rollDice(parseInt(count), parseInt(sides));
  const baseBonus = bonus ? parseInt(bonus) : 0;
  
  const breakdown: string[] = [];
  breakdown.push(`Base: ${roll.dice.join('+')} = ${roll.total}`);
  
  let raw = roll.total + baseBonus;
  if (baseBonus !== 0) breakdown.push(`Weapon bonus: ${baseBonus > 0 ? '+' : ''}${baseBonus}`);
  
  const marginBonus = Math.min(Math.max(margin, 0), 5);
  if (marginBonus > 0) {
    raw += marginBonus;
    breakdown.push(`Hit margin: +${marginBonus}`);
  }
  
  if (strengthBonus > 0) {
    raw += strengthBonus;
    breakdown.push(`Strength: +${strengthBonus}`);
  }
  
  const final = Math.max(raw - targetArmor, 0);
  if (targetArmor > 0) breakdown.push(`Armor: -${targetArmor}`);
  breakdown.push(`Final: ${final}`);
  
  return { raw, final, breakdown };
}

// Success probability calculator (for UI)
export function calculateSuccessProbability(
  attributeModifier: number,
  skillLevel: number,
  bonuses: number,
  penalties: number,
  tn: number
): number {
  const totalMod = attributeModifier + skillLevel + bonuses - penalties;
  const target = tn - totalMod;
  
  // 2d6 probability table
  const probabilities: Record<number, number> = {
    2: 100, 3: 97.2, 4: 91.7, 5: 83.3, 6: 72.2,
    7: 58.3, 8: 41.7, 9: 27.8, 10: 16.7, 11: 8.3, 12: 2.8
  };
  
  if (target <= 2) return 100;
  if (target > 12) return 0;
  return probabilities[target] || 0;
}
```

### 1.3 Character Routes

```typescript
// src/api/character/index.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const characterRoutes = new Hono();

const CreateCharacterSchema = z.object({
  name: z.string().min(2).max(32),
  origin: z.enum(['STREET_KID', 'CORPORATE_EXILE', 'TECH_REFUGEE', 'MILITARY_DROPOUT', 'ACADEMIC_OUTCAST']),
  attributes: z.object({
    PWR: z.number().min(-2).max(3),
    AGI: z.number().min(-2).max(3),
    END: z.number().min(-2).max(3),
    VEL: z.number().min(-2).max(3),
    INT: z.number().min(-2).max(3),
    WIS: z.number().min(-2).max(3),
    EMP: z.number().min(-2).max(3),
    PRC: z.number().min(-2).max(3),
  }),
  background: z.object({
    debt_reason: z.string().optional(),
    home_district: z.string(),
  }),
});

// POST /characters - Create new character
characterRoutes.post('/', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const body = await c.req.json();
  
  const validation = CreateCharacterSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, errors: validation.error.errors }, 400);
  }
  
  const data = validation.data;
  const characterId = nanoid();
  const hpMax = 20 + (data.attributes.END * 5);
  
  await c.env.DB.prepare(`
    INSERT INTO characters (id, user_id, name, origin, attributes, hp_current, hp_max, home_district, current_location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(characterId, userId, data.name, data.origin, JSON.stringify(data.attributes), hpMax, hpMax, data.background.home_district, data.background.home_district).run();
  
  // Initialize faction standings, apply origin bonuses, etc.
  await initializeFactionStandings(c.env.DB, characterId);
  
  const character = await getFullCharacter(c.env.DB, c.env.CACHE, characterId);
  return c.json({ success: true, data: character }, 201);
});

// GET /characters/:id - Get character details
characterRoutes.get('/:id', async (c) => {
  const characterId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;
  
  const character = await getFullCharacter(c.env.DB, c.env.CACHE, characterId);
  if (!character) return c.json({ success: false, errors: [{ code: 'NOT_FOUND' }] }, 404);
  if (character.user_id !== userId) return c.json({ success: false, errors: [{ code: 'FORBIDDEN' }] }, 403);
  
  return c.json({ success: true, data: character });
});

async function getFullCharacter(db: D1Database, cache: KVNamespace, characterId: string) {
  const char = await db.prepare('SELECT * FROM characters WHERE id = ?').bind(characterId).first();
  if (!char) return null;
  
  const [skills, augments, factions, inventory] = await Promise.all([
    db.prepare('SELECT * FROM character_skills WHERE character_id = ?').bind(characterId).all(),
    db.prepare('SELECT * FROM character_augments WHERE character_id = ?').bind(characterId).all(),
    db.prepare('SELECT * FROM character_faction_standing WHERE character_id = ?').bind(characterId).all(),
    db.prepare('SELECT * FROM character_inventory WHERE character_id = ?').bind(characterId).all(),
  ]);
  
  return {
    ...char,
    attributes: JSON.parse(char.attributes as string),
    skills: skills.results,
    augments: augments.results,
    faction_standings: factions.results,
    inventory: inventory.results,
  };
}

export { characterRoutes };
```

### 1.4 Mission Routes

```typescript
// src/api/mission/index.ts
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { performSkillCheck } from '../../game/mechanics/dice';

const missionRoutes = new Hono();

// GET /missions/available
missionRoutes.get('/available', async (c) => {
  const characterId = c.req.query('character_id');
  
  const character = await getCharacter(c.env.DB, characterId);
  const missionData = JSON.parse(await c.env.CACHE.get('game:missions') || '{}');
  const districtData = JSON.parse(await c.env.CACHE.get('game:districts') || '{}');
  
  const missions = generateAvailableMissions(missionData, districtData, character, 5);
  return c.json({ success: true, data: { missions } });
});

// POST /missions/:id/accept
missionRoutes.post('/:id/accept', async (c) => {
  const missionId = c.req.param('id');
  const { character_id } = await c.req.json();
  
  // Create active mission with deadline
  const activeMissionId = nanoid();
  const deadline = new Date(Date.now() + 45 * 60 * 1000); // Example: 45 min
  
  await c.env.DB.prepare(`
    INSERT INTO active_missions (id, character_id, mission_data, status, deadline_at)
    VALUES (?, ?, ?, 'ACTIVE', ?)
  `).bind(activeMissionId, character_id, JSON.stringify({}), deadline.toISOString()).run();
  
  await c.env.DB.prepare('UPDATE characters SET status = ? WHERE id = ?').bind('ON_MISSION', character_id).run();
  
  return c.json({ success: true, data: { active_mission_id: activeMissionId, deadline: deadline.toISOString() } });
});

// POST /missions/:id/action - Execute navigation, resolve complications
missionRoutes.post('/:id/action', async (c) => {
  const activeMissionId = c.req.param('id');
  const { action, choice } = await c.req.json();
  
  const mission = await c.env.DB.prepare('SELECT * FROM active_missions WHERE id = ?').bind(activeMissionId).first();
  if (!mission) return c.json({ success: false, errors: [{ code: 'MISSION_NOT_FOUND' }] }, 404);
  
  // Check deadline
  if (new Date(mission.deadline_at as string) < new Date()) {
    return await failMission(c, mission, 'TIME_EXPIRED');
  }
  
  const character = await getFullCharacter(c.env.DB, c.env.CACHE, mission.character_id as string);
  
  switch (action) {
    case 'navigate':
      return handleNavigation(c, mission, character);
    case 'resolve_complication':
      return handleComplication(c, mission, character, choice);
    case 'complete_delivery':
      return handleDeliveryComplete(c, mission, character);
    default:
      return c.json({ success: false, errors: [{ code: 'INVALID_ACTION' }] }, 400);
  }
});

async function handleNavigation(c: any, mission: any, character: any) {
  const tn = 10; // Would come from mission data
  const attrMod = character.attributes.PRC || 0;
  const skillLevel = character.skills.find((s: any) => s.skill_id === 'navigation')?.level || 0;
  
  const result = performSkillCheck(attrMod, skillLevel, [], [], tn);
  
  // Generate narrative based on result
  const narrative = result.success 
    ? "You weave through traffic with practiced ease. Algorithm whispers shortcuts."
    : "A wrong turn costs you time. The Algorithm recalculates.";
  
  return c.json({
    success: true,
    data: {
      roll: result,
      narrative,
      consequences: { time_lost: result.success ? 0 : 3 }
    }
  });
}

export { missionRoutes };
```

---

## Phase 2: Combat System (Week 4)

### 2.1 Combat Durable Object

```typescript
// src/realtime/combat.ts
import { DurableObject } from 'cloudflare:workers';

interface Combatant {
  id: string;
  name: string;
  type: 'PLAYER' | 'NPC' | 'ENEMY';
  hp: number;
  hp_max: number;
  defense: number;
  position: { x: number; y: number };
  initiative: number;
  conditions: string[];
  equipment: { weapon?: any; armor?: any };
}

interface CombatState {
  id: string;
  status: 'INITIALIZING' | 'ACTIVE' | 'RESOLVED';
  round: number;
  currentTurn: number;
  turnOrder: string[];
  combatants: Map<string, Combatant>;
  battlefield: {
    width: number;
    height: number;
    cover: { x: number; y: number; type: string; hp: number; defense_bonus: number }[];
    escapeRoutes: { x: number; y: number; tn: number; direction: string }[];
  };
  log: { round: number; turn: number; action: string; result: any }[];
}

export class CombatSession extends DurableObject {
  private state: CombatState | null = null;
  private connections: Set<WebSocket> = new Set();
  
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      
      this.connections.add(server);
      server.accept();
      
      server.addEventListener('message', (event) => {
        this.handleMessage(server, JSON.parse(event.data as string));
      });
      
      server.addEventListener('close', () => {
        this.connections.delete(server);
      });
      
      if (this.state) {
        server.send(JSON.stringify({ type: 'state', data: this.serializeState() }));
      }
      
      return new Response(null, { status: 101, webSocket: client });
    }
    
    // REST endpoints
    if (request.method === 'POST' && url.pathname.endsWith('/initialize')) {
      return this.initializeCombat(await request.json());
    }
    
    if (request.method === 'POST' && url.pathname.endsWith('/action')) {
      return this.handleAction(await request.json());
    }
    
    return new Response('Not found', { status: 404 });
  }
  
  private async initializeCombat(data: { player: any; enemies: any[] }): Promise<Response> {
    const battlefield = this.generateBattlefield();
    const combatants = new Map<string, Combatant>();
    
    // Add player
    const playerInit = this.roll2d6().total + (data.player.attributes?.VEL || 0);
    combatants.set(data.player.id, {
      id: data.player.id,
      name: data.player.name,
      type: 'PLAYER',
      hp: data.player.hp_current,
      hp_max: data.player.hp_max,
      defense: 8 + (data.player.attributes?.AGI || 0),
      position: { x: 0, y: Math.floor(battlefield.height / 2) },
      initiative: playerInit,
      conditions: [],
      equipment: data.player.equipment
    });
    
    // Add enemies
    for (let i = 0; i < data.enemies.length; i++) {
      const enemy = data.enemies[i];
      combatants.set(enemy.id, {
        id: enemy.id,
        name: enemy.name,
        type: 'ENEMY',
        hp: enemy.hp,
        hp_max: enemy.hp,
        defense: enemy.defense,
        position: { x: battlefield.width - 1, y: i + 1 },
        initiative: this.roll2d6().total + (enemy.initiative_bonus || 0),
        conditions: [],
        equipment: enemy.equipment
      });
    }
    
    // Sort by initiative
    const turnOrder = Array.from(combatants.entries())
      .sort((a, b) => b[1].initiative - a[1].initiative)
      .map(([id]) => id);
    
    this.state = {
      id: crypto.randomUUID(),
      status: 'ACTIVE',
      round: 1,
      currentTurn: 0,
      turnOrder,
      combatants,
      battlefield,
      log: []
    };
    
    await this.ctx.storage.put('state', this.serializeState());
    this.broadcast({ type: 'combat_started', data: this.serializeState() });
    
    return Response.json({ success: true, data: this.serializeState() });
  }
  
  private async handleAction(data: { combatantId: string; action: string; target?: string; position?: { x: number; y: number } }): Promise<Response> {
    if (!this.state || this.state.status !== 'ACTIVE') {
      return Response.json({ success: false, error: 'Combat not active' }, { status: 400 });
    }
    
    const currentId = this.state.turnOrder[this.state.currentTurn];
    if (data.combatantId !== currentId) {
      return Response.json({ success: false, error: 'Not your turn' }, { status: 400 });
    }
    
    const combatant = this.state.combatants.get(data.combatantId);
    if (!combatant) return Response.json({ success: false, error: 'Combatant not found' }, { status: 404 });
    
    let result: any;
    
    switch (data.action) {
      case 'attack':
        result = this.handleAttack(combatant, data.target!);
        break;
      case 'move':
        result = this.handleMove(combatant, data.position!);
        break;
      case 'defend':
        combatant.conditions.push('DEFENDING');
        result = { success: true, effect: '+2 Defense until next turn' };
        break;
      case 'disengage':
        result = this.handleDisengage(combatant);
        break;
      default:
        return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
    
    this.state.log.push({ round: this.state.round, turn: this.state.currentTurn, action: data.action, result });
    this.advanceTurn();
    
    const combatEnd = this.checkCombatEnd();
    if (combatEnd) {
      this.state.status = 'RESOLVED';
      result.combat_end = combatEnd;
    }
    
    await this.ctx.storage.put('state', this.serializeState());
    this.broadcast({ type: 'action_result', data: result, state: this.serializeState() });
    
    return Response.json({ success: true, data: result, state: this.serializeState() });
  }
  
  private handleAttack(attacker: Combatant, targetId: string) {
    const target = this.state!.combatants.get(targetId);
    if (!target) throw new Error('Target not found');
    
    const roll = this.roll2d6();
    const attackBonus = attacker.equipment.weapon?.attack_bonus || 0;
    const total = roll.total + attackBonus;
    const targetDef = target.defense + (this.getCoverBonus(target) || 0);
    const hit = total >= targetDef;
    const margin = total - targetDef;
    
    const result: any = { attacker: attacker.id, target: target.id, roll, total, target_defense: targetDef, hit, margin };
    
    if (hit) {
      const damageRoll = this.rollDamage(attacker.equipment.weapon?.damage || '1d6');
      const marginBonus = Math.min(Math.max(margin, 0), 5);
      const armor = target.equipment.armor?.armor_value || 0;
      const finalDamage = Math.max(damageRoll + marginBonus - armor, 0);
      
      target.hp -= finalDamage;
      result.damage = { roll: damageRoll, margin_bonus: marginBonus, armor_reduction: armor, final: finalDamage };
      
      if (target.hp <= 0) {
        target.hp = 0;
        target.conditions.push('INCAPACITATED');
        result.incapacitated = true;
      }
    }
    
    return result;
  }
  
  private handleMove(combatant: Combatant, newPos: { x: number; y: number }) {
    const distance = Math.sqrt(Math.pow(newPos.x - combatant.position.x, 2) + Math.pow(newPos.y - combatant.position.y, 2));
    if (distance > 3) return { success: false, reason: 'Too far' };
    
    combatant.position = newPos;
    return { success: true, new_position: newPos };
  }
  
  private handleDisengage(combatant: Combatant) {
    const escape = this.state!.battlefield.escapeRoutes[0];
    if (!escape) return { success: false, reason: 'No escape route' };
    
    const roll = this.roll2d6();
    if (roll.total >= escape.tn) {
      combatant.conditions.push('ESCAPED');
      return { success: true, escaped: true, roll, tn: escape.tn };
    }
    return { success: false, roll, tn: escape.tn };
  }
  
  private advanceTurn() {
    this.state!.currentTurn++;
    while (this.state!.currentTurn < this.state!.turnOrder.length) {
      const c = this.state!.combatants.get(this.state!.turnOrder[this.state!.currentTurn]);
      if (c && !c.conditions.includes('INCAPACITATED') && !c.conditions.includes('ESCAPED')) break;
      this.state!.currentTurn++;
    }
    
    if (this.state!.currentTurn >= this.state!.turnOrder.length) {
      this.state!.round++;
      this.state!.currentTurn = 0;
      for (const c of this.state!.combatants.values()) {
        c.conditions = c.conditions.filter(cond => cond !== 'DEFENDING');
      }
    }
  }
  
  private checkCombatEnd(): { winner: string; reason: string } | null {
    const player = Array.from(this.state!.combatants.values()).find(c => c.type === 'PLAYER');
    if (player?.conditions.includes('INCAPACITATED')) return { winner: 'ENEMIES', reason: 'Player incapacitated' };
    if (player?.conditions.includes('ESCAPED')) return { winner: 'ESCAPE', reason: 'Player escaped' };
    
    const activeEnemies = Array.from(this.state!.combatants.values())
      .filter(c => c.type === 'ENEMY' && !c.conditions.includes('INCAPACITATED'));
    if (activeEnemies.length === 0) return { winner: 'PLAYER', reason: 'All enemies defeated' };
    
    return null;
  }
  
  // Helpers
  private roll2d6() {
    const dice = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
    return { dice, total: dice[0] + dice[1] };
  }
  
  private rollDamage(str: string): number {
    const match = str.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) return 0;
    let total = 0;
    for (let i = 0; i < parseInt(match[1]); i++) total += Math.floor(Math.random() * parseInt(match[2])) + 1;
    return total + (match[3] ? parseInt(match[3]) : 0);
  }
  
  private generateBattlefield() {
    return {
      width: 6, height: 4,
      cover: [
        { x: 2, y: 0, type: 'CONCRETE_BARRIER', hp: 50, defense_bonus: 4 },
        { x: 3, y: 2, type: 'DUMPSTER', hp: 25, defense_bonus: 2 },
      ],
      escapeRoutes: [{ x: 0, y: 2, tn: 12, direction: 'SOUTH' }]
    };
  }
  
  private getCoverBonus(combatant: Combatant): number {
    const cover = this.state!.battlefield.cover.find(c => c.x === combatant.position.x && c.y === combatant.position.y);
    return cover?.defense_bonus || 0;
  }
  
  private serializeState() {
    return this.state ? { ...this.state, combatants: Object.fromEntries(this.state.combatants) } : null;
  }
  
  private broadcast(message: any) {
    const data = JSON.stringify(message);
    for (const ws of this.connections) {
      try { ws.send(data); } catch { this.connections.delete(ws); }
    }
  }
  
  private handleMessage(ws: WebSocket, msg: any) {
    if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
  }
}
```

---

## Phase 3: World & Economy (Week 5)

### 3.1 World Clock Durable Object

```typescript
// src/realtime/world.ts
export class WorldClock extends DurableObject {
  private gameTime: Date = new Date('2037-03-15T00:00:00Z');
  private realTimeRatio: number = 60; // 1 real second = 60 game seconds
  
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname.endsWith('/time')) {
      return Response.json({ 
        game_time: this.gameTime.toISOString(),
        time_of_day: this.getTimeOfDay(),
        weather: this.getCurrentWeather()
      });
    }
    
    return new Response('Not found', { status: 404 });
  }
  
  private getTimeOfDay(): string {
    const hour = this.gameTime.getHours();
    if (hour >= 6 && hour < 12) return 'MORNING';
    if (hour >= 12 && hour < 18) return 'AFTERNOON';
    if (hour >= 18 && hour < 22) return 'EVENING';
    return 'NIGHT';
  }
  
  private getCurrentWeather() {
    return {
      condition: 'LIGHT_RAIN',
      visibility_modifier: -1,
      handling_modifier: -1,
      danger_modifier: 0.15,
      delivery_pay_modifier: 0.20
    };
  }
}
```

### 3.2 Economy Routes

```typescript
// src/api/economy/index.ts
import { Hono } from 'hono';
import { nanoid } from 'nanoid';

const economyRoutes = new Hono();

economyRoutes.get('/finances', async (c) => {
  const characterId = c.req.query('character_id');
  
  const character = await c.env.DB.prepare('SELECT credits FROM characters WHERE id = ?').bind(characterId).first();
  const transactions = await c.env.DB.prepare('SELECT * FROM transactions WHERE character_id = ? ORDER BY created_at DESC LIMIT 50').bind(characterId).all();
  
  return c.json({
    success: true,
    data: {
      current_balance: character?.credits || 0,
      recent_transactions: transactions.results
    }
  });
});

economyRoutes.post('/purchase', async (c) => {
  const { character_id, item_id, vendor_id } = await c.req.json();
  
  const items = JSON.parse(await c.env.CACHE.get('game:items') || '{}');
  const item = findItem(items, item_id);
  if (!item) return c.json({ success: false, errors: [{ code: 'ITEM_NOT_FOUND' }] }, 404);
  
  const character = await c.env.DB.prepare('SELECT credits FROM characters WHERE id = ?').bind(character_id).first();
  const price = item.base_price; // Could apply faction discounts here
  
  if ((character?.credits || 0) < price) {
    return c.json({
      success: false,
      errors: [{ code: 'INSUFFICIENT_FUNDS', details: { shortfall: price - (character?.credits || 0) } }]
    }, 422);
  }
  
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE characters SET credits = credits - ? WHERE id = ?').bind(price, character_id),
    c.env.DB.prepare('INSERT INTO character_inventory (id, character_id, item_id, quantity) VALUES (?, ?, ?, 1)').bind(nanoid(), character_id, item_id),
    c.env.DB.prepare('INSERT INTO transactions (id, character_id, type, amount, balance_after, source) VALUES (?, ?, ?, ?, ?, ?)').bind(nanoid(), character_id, 'PURCHASE', -price, (character?.credits || 0) - price, vendor_id)
  ]);
  
  return c.json({ success: true, data: { item, price_paid: price, new_balance: (character?.credits || 0) - price } });
});

export { economyRoutes };
```

---

## Phase 4: Frontend (Week 6)

### 4.1 Minimal Preact + HTM Setup (No Build)

```html
<!-- index.html - Single file, no build step -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Surge Protocol</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'surge-bg': '#0a0a0f',
            'surge-card': '#1a1a24',
            'surge-cyan': '#00d4ff',
            'surge-orange': '#ff6b35',
            'surge-red': '#ff3366',
            'surge-green': '#33ff88',
            'surge-purple': '#cc66ff',
            'surge-gold': '#ffd700',
          }
        }
      }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Orbitron:wght@700&display=swap" rel="stylesheet">
  <style>body { background: #0a0a0f; color: #e0e0e8; font-family: 'JetBrains Mono', monospace; }</style>
</head>
<body>
  <div id="app"></div>
  
  <script type="module">
    import { h, render } from 'https://esm.sh/preact';
    import { useState, useEffect } from 'https://esm.sh/preact/hooks';
    import htm from 'https://esm.sh/htm';
    
    const html = htm.bind(h);
    
    // API helper
    const api = {
      token: localStorage.getItem('token'),
      async get(path) {
        const res = await fetch('/api' + path, { headers: { 'Authorization': `Bearer ${this.token}` } });
        return res.json();
      },
      async post(path, data) {
        const res = await fetch('/api' + path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
          body: JSON.stringify(data)
        });
        return res.json();
      }
    };
    
    // HUD Component
    function HUD({ character }) {
      if (!character) return null;
      const hpPct = (character.hp_current / character.hp_max) * 100;
      
      return html`
        <div class="bg-surge-card rounded-lg p-4 space-y-3">
          <div class="flex justify-between">
            <div>
              <h2 class="text-surge-cyan font-bold">${character.name}</h2>
              <div class="text-sm text-gray-400">Tier ${character.tier} • Rating ${character.rating?.toFixed(1)}</div>
            </div>
            <div class="text-right">
              <div class="text-surge-gold">₡${character.credits?.toLocaleString()}</div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1"><span>HP</span><span>${character.hp_current}/${character.hp_max}</span></div>
            <div class="h-2 bg-gray-700 rounded-full"><div class="h-full rounded-full ${hpPct > 50 ? 'bg-surge-green' : 'bg-surge-red'}" style="width:${hpPct}%"></div></div>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1"><span class="text-surge-purple">Humanity</span><span>${character.humanity}</span></div>
            <div class="h-2 bg-gray-700 rounded-full"><div class="h-full bg-surge-purple rounded-full" style="width:${character.humanity}%"></div></div>
          </div>
        </div>
      `;
    }
    
    // Mission Card
    function MissionCard({ mission, onAccept }) {
      return html`
        <div class="bg-surge-card rounded-lg p-4 border border-gray-700 hover:border-surge-cyan">
          <h3 class="font-medium mb-2">${mission.name}</h3>
          <p class="text-sm text-gray-400 mb-3">${mission.description}</p>
          <div class="flex justify-between text-sm mb-3">
            <span class="text-surge-gold">₡${mission.base_pay}</span>
            <span>${mission.time_limit_minutes}min</span>
            <span>TN ${mission.tn}</span>
          </div>
          <button onClick=${() => onAccept(mission.id)} class="w-full py-2 bg-surge-cyan/20 hover:bg-surge-cyan/30 text-surge-cyan rounded">
            Accept
          </button>
        </div>
      `;
    }
    
    // Main App
    function App() {
      const [character, setCharacter] = useState(null);
      const [missions, setMissions] = useState([]);
      
      useEffect(() => {
        api.get('/characters/current').then(r => r.success && setCharacter(r.data));
      }, []);
      
      useEffect(() => {
        if (character) {
          api.get(`/missions/available?character_id=${character.id}`).then(r => r.success && setMissions(r.data.missions));
        }
      }, [character]);
      
      async function acceptMission(id) {
        const result = await api.post(`/missions/${id}/accept`, { character_id: character.id });
        if (result.success) alert('Mission accepted!');
      }
      
      return html`
        <div class="min-h-screen">
          <header class="border-b border-gray-800 p-4">
            <h1 class="text-surge-cyan text-xl font-bold">SURGE PROTOCOL</h1>
          </header>
          <div class="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div><${HUD} character=${character} /></div>
            <div class="lg:col-span-2">
              <h2 class="text-lg mb-4">Available Missions</h2>
              <div class="grid gap-4">
                ${missions.map(m => html`<${MissionCard} mission=${m} onAccept=${acceptMission} />`)}
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    render(html`<${App} />`, document.getElementById('app'));
  </script>
</body>
</html>
```

---

## Phase 5: Polish & Launch (Weeks 7-8)

### 5.1 Testing Checklist

```markdown
## Core Loop
- [ ] Character creation (all origins)
- [ ] Mission generation per tier
- [ ] Mission accept → navigate → complications → complete
- [ ] Combat flow (attack, move, defend, flee)
- [ ] Rating calculation
- [ ] XP and leveling

## Edge Cases
- [ ] Mission timeout
- [ ] Combat flee mid-mission
- [ ] Character death
- [ ] Multiple faction changes

## Integration
- [ ] WebSocket reconnection
- [ ] Durable Object persistence
- [ ] D1 transactions
```

### 5.2 Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          command: deploy
```

---

## Milestone Summary

| Week | Phase | Deliverable |
|------|-------|-------------|
| 1 | Foundation | Project setup, DB schema, seed import |
| 2-3 | Core Loop | Character, missions, dice mechanics |
| 4 | Combat | Durable Object combat system |
| 5 | World | Economy, world clock, factions |
| 6 | Frontend | Preact UI, WebSocket |
| 7-8 | Polish | Testing, deployment |

## Resource Estimates

| Resource | Free Limit | Expected |
|----------|------------|----------|
| Workers Requests | 100K/day | ~10K |
| D1 Reads | 5M/day | ~500K |
| D1 Writes | 100K/day | ~10K |
| KV Reads | 100K/day | ~50K |
| Durable Objects | 1M/month | ~100K |

**Fits comfortably in free tier for MVP.**

## Code Estimates

| Component | Lines |
|-----------|-------|
| API Routes | ~2,000 |
| Game Mechanics | ~1,500 |
| Durable Objects | ~1,000 |
| Frontend | ~2,500 |
| **Total** | ~7,000 |

---

## Next Steps

```bash
# 1. Create Cloudflare account
# 2. Initialize project
npm create cloudflare@latest surge-protocol -- --template worker-typescript

# 3. Create D1 database
wrangler d1 create surge-protocol-db

# 4. Run migration
wrangler d1 execute surge-protocol-db --file=migrations/0001_initial.sql

# 5. Import seed data
wrangler d1 execute surge-protocol-db --file=scripts/seed.sql

# 6. Start dev server
wrangler dev
```

**The foundation is solid. Time to build.**
