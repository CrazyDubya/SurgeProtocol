# Surge Protocol - API Reference

## Base URL
```
Production: https://surge-protocol.workers.dev
Development: http://localhost:8787
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format
All responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-01-20T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "errors": [
    {
      "code": "ERROR_CODE",
      "message": "Human-readable message",
      "field": "optional_field_name"
    }
  ],
  "timestamp": "2026-01-20T12:00:00.000Z"
}
```

---

## Health Check

### GET /health
Check API status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-20T12:00:00.000Z",
  "environment": "development"
}
```

---

## Authentication

### POST /api/auth/register
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": { "id": "user_abc123", "email": "user@example.com" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### POST /api/auth/login
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { "id": "user_abc123", "email": "user@example.com" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### POST /api/auth/refresh
Refresh an expired access token.

**Request Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ..."
  }
}
```

### POST /api/auth/logout
Invalidate current session.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

### GET /api/auth/me
Get current user info.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { "id": "user_abc123", "email": "user@example.com" },
    "characterId": "char_xyz789"
  }
}
```

---

## Characters

### POST /api/characters
Create a new character.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "legalName": "John Doe",
  "streetName": "Ghost",
  "handle": "ghost_runner",
  "sex": "MALE",
  "age": 28,
  "attributes": {
    "STR": 10, "AGI": 12, "VIT": 10,
    "INT": 10, "PRC": 10, "CHA": 8,
    "WIL": 10, "VEL": 10
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "character": {
      "id": "char_xyz789",
      "handle": "ghost_runner",
      "omnideliverId": "OD-A1B2C3D4"
    }
  }
}
```

### GET /api/characters
List all characters for current user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "characters": [
      { "id": "char_xyz789", "handle": "ghost_runner", "current_tier": 1 }
    ],
    "count": 1
  }
}
```

### GET /api/characters/:id
Get character details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "character": {
      "id": "char_xyz789",
      "handle": "ghost_runner",
      "carrier_rating": 75.5,
      "current_tier": 3,
      "current_xp": 450
    }
  }
}
```

### POST /api/characters/:id/select
Select a character for the current session.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "character": { "id": "char_xyz789" }
  }
}
```

### GET /api/characters/:id/stats
Get character statistics.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "attributes": { "STR": 10, "AGI": 12, ... },
    "skills": { "FIREARMS": 3, "STEALTH": 5, ... },
    "rating": {
      "current": 75.5,
      "tier": 3,
      "totalDeliveries": 42
    }
  }
}
```

### GET /api/characters/:id/inventory
Get character inventory.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "inventory": [
      {
        "id": "inv_123",
        "itemId": "item_pistol",
        "name": "Street Pistol",
        "quantity": 1,
        "isEquipped": true
      }
    ],
    "capacity": { "used": 5, "max": 20 }
  }
}
```

### GET /api/characters/:id/factions
Get character faction standings.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "factions": [
      {
        "factionId": "faction_chrome",
        "name": "Chrome Runners",
        "reputation": 45,
        "tier": "FRIENDLY",
        "isMember": true
      }
    ]
  }
}
```

---

## Missions

### GET /api/missions/available
List available missions for character's tier.

**Headers:** `Authorization: Bearer <token>` (with character)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "missions": [
      {
        "id": "mission_basic",
        "name": "Standard Package Delivery",
        "type": "STANDARD",
        "baseCredits": 50,
        "baseXp": 15,
        "timeLimit": 30
      }
    ],
    "canAcceptNew": true,
    "currentTier": 3
  }
}
```

### GET /api/missions/active
Get current active mission.

**Headers:** `Authorization: Bearer <token>` (with character)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "mission": {
      "instance": { "id": "inst_456", "status": "IN_PROGRESS" },
      "definition": { "name": "Express Delivery" },
      "checkpoints": []
    }
  }
}
```

### GET /api/missions/:id
Get mission details.

**Headers:** `Authorization: Bearer <token>` (with character)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "mission": { ... },
    "requirements": [],
    "rewards": [],
    "isAccessible": true
  }
}
```

### POST /api/missions/:id/accept
Accept a mission.

**Headers:** `Authorization: Bearer <token>` (with character)

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "instance": { "id": "inst_456" },
    "mission": { "name": "Standard Delivery" },
    "message": "Mission accepted. Good luck, courier."
  }
}
```

### POST /api/missions/:id/action
Take an action during a mission.

**Headers:** `Authorization: Bearer <token>` (with character)

**Request Body:**
```json
{
  "actionType": "MOVE",
  "parameters": { "destination": "DOWNTOWN" }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "result": { "success": true, "outcome": "MOVED" },
    "remainingObjectives": 2
  }
}
```

### POST /api/missions/:id/complete
Complete a mission.

**Headers:** `Authorization: Bearer <token>` (with character)

**Request Body:**
```json
{
  "outcome": "SUCCESS",
  "customerRating": 5
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "outcome": "SUCCESS",
    "rewards": {
      "credits": 55,
      "xp": 15,
      "ratingChange": 3
    }
  }
}
```

### POST /api/missions/:id/abandon
Abandon a mission.

**Headers:** `Authorization: Bearer <token>` (with character)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Mission abandoned. Rating penalty applied.",
    "ratingPenalty": -5
  }
}
```

---

## Factions

### GET /api/factions
List all factions.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "factions": [
      {
        "id": "faction_chrome",
        "code": "CHROME_RUNNERS",
        "name": "Chrome Runners",
        "factionType": "GANG",
        "isJoinable": true,
        "activeWars": 1
      }
    ]
  }
}
```

### GET /api/factions/:id
Get faction details.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "faction": { ... },
    "relationships": [],
    "activeWars": [],
    "topContributors": [],
    "stats": { "total_members": 150 }
  }
}
```

### GET /api/factions/:id/standing
Get player's standing with faction.

**Headers:** `Authorization: Bearer <token>` (with character)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "standing": {
      "reputationValue": 45,
      "reputationTier": "FRIENDLY",
      "isMember": false
    },
    "perks": [],
    "nextTier": { "tier": "ALLIED", "requiredReputation": 60 }
  }
}
```

### GET /api/factions/:id/members
Get faction leaderboard.

**Query Params:** `?limit=20&offset=0`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "members": [],
    "total": 150,
    "pagination": { "limit": 20, "offset": 0, "hasMore": true }
  }
}
```

### GET /api/factions/wars/active
Get active faction wars.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "wars": [
      {
        "id": "war_123",
        "attacker_name": "Chrome Runners",
        "defender_name": "Iron Dragons",
        "status": "ACTIVE"
      }
    ]
  }
}
```

### POST /api/factions/wars/:warId/contribute
Submit war contribution.

**Headers:** `Authorization: Bearer <token>` (with character)

**Request Body:**
```json
{
  "contributionType": "COMBAT",
  "value": 50,
  "objectiveId": "obj_123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "contribution": { ... },
    "factionScore": 1500,
    "reputationGained": 5
  }
}
```

### POST /api/factions/:id/join
Join a faction.

**Headers:** `Authorization: Bearer <token>` (with character)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Welcome to Chrome Runners",
    "rank": "INITIATE"
  }
}
```

### POST /api/factions/:id/leave
Leave a faction.

**Headers:** `Authorization: Bearer <token>` (with character)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "You have left the faction",
    "reputationPenalty": -10
  }
}
```

---

## Durable Objects (Real-time)

### WebSocket Endpoints

#### WS /ws/combat/:combatId
Connect to a combat session.

**Query Params:** `?characterId=xxx`

#### WS /ws/war/:warId
Connect to a faction war.

**Query Params:** `?characterId=xxx&factionId=xxx`

#### WS /ws/world
Connect to world clock updates.

### REST Endpoints for Durable Objects

#### POST /api/combat/:combatId/init
Initialize a combat session.

#### GET /api/combat/:combatId/state
Get combat state.

#### POST /api/wars/:warId/init
Initialize a faction war.

#### GET /api/wars/:warId/state
Get war state.

#### GET /api/world/state
Get world state (time, weather).

---

## Internal/Admin Routes

> ⚠️ These endpoints should be protected in production.

### POST /internal/admin/seed
Seed database with game data.

### POST /internal/admin/cache/warm
Warm cache with static data.

### DELETE /internal/admin/cache
Clear all cache entries.

### GET /internal/admin/diagnostics
Get system diagnostics.

### GET /internal/admin/stats
Get game statistics.

### POST /internal/tokens/create
Create a scoped CF API token.

### POST /internal/tokens/revoke
Revoke a CF API token.

---

## Economy

### GET /api/economy/currencies
List all available currencies.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "currencies": [
      {
        "id": "curr_credits",
        "code": "CREDITS",
        "name": "Neo Credits",
        "symbol": "₡",
        "is_primary": 1,
        "exchange_rate_to_primary": 1.0
      }
    ]
  }
}
```

### GET /api/economy/balance
Get character's current balances. Requires character selection.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "wallet": { "primary": 1000, "currencies": {} },
    "bank": {},
    "crypto": {},
    "stashes": {},
    "stats": {
      "totalEarnedCareer": 0,
      "totalSpentCareer": 0,
      "totalDebt": 0,
      "creditScore": 500,
      "creditLimit": 1000,
      "creditUtilized": 0
    }
  }
}
```

### GET /api/economy/transactions
Get transaction history (paginated). Requires character selection.

**Query Parameters:**
- `limit` (optional): Number of results (1-100, default 20)
- `offset` (optional): Starting offset (default 0)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_abc123",
        "occurred_at": "2026-01-20T12:00:00.000Z",
        "transaction_type": "PURCHASE",
        "amount": 500,
        "is_income": 0,
        "description": "Purchased 1x Stim Pack"
      }
    ],
    "pagination": { "limit": 20, "offset": 0, "total": 1 }
  }
}
```

### POST /api/economy/transfer
Transfer funds between accounts. Requires character selection.

**Request Body:**
```json
{
  "amount": 500,
  "fromAccount": "wallet",
  "toAccount": "bank",
  "description": "Savings deposit"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_abc123",
    "amount": 500,
    "from": "wallet",
    "to": "bank",
    "message": "Transferred 500 credits from wallet to bank"
  }
}
```

### GET /api/economy/vendors
List vendors near character's location. Requires character selection.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "vendors": [
      {
        "id": "vendor_abc",
        "vendor_type": "GENERAL",
        "specialization": "Medical",
        "npc_name": "Doc Sully",
        "location_name": "Back Alley Clinic"
      }
    ],
    "location": "loc_downtown_01"
  }
}
```

### GET /api/economy/vendors/:id
Get vendor details and inventory. Requires character selection.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "vendor": {
      "id": "vendor_abc",
      "type": "GENERAL",
      "buyPriceModifier": 1.1,
      "sellPriceModifier": 0.5,
      "haggleDifficulty": 8,
      "acceptsStolen": false,
      "acceptsContraband": false,
      "npc": { "id": "npc_123", "name": "Doc Sully" }
    },
    "inventory": {
      "base": [{ "itemId": "item_001", "quantity": 10, "price": 55, "item": {...} }],
      "rotating": [],
      "limited": []
    }
  }
}
```

### POST /api/economy/vendors/:id/buy
Purchase item from vendor. Requires character selection.

**Request Body:**
```json
{
  "itemId": "item_001",
  "quantity": 2,
  "paymentMethod": "wallet"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_abc123",
    "inventoryId": "inv_xyz789",
    "item": { "id": "item_001", "name": "Stim Pack", "quantity": 2 },
    "price": { "unitPrice": 55, "quantity": 2, "total": 110 },
    "paymentMethod": "wallet"
  }
}
```

### POST /api/economy/vendors/:id/sell
Sell item to vendor. Requires character selection.

**Request Body:**
```json
{
  "inventoryItemId": "inv_xyz789",
  "quantity": 1
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_abc124",
    "item": { "id": "item_001", "name": "Stim Pack", "quantity": 1 },
    "price": { "unitPrice": 25, "quantity": 1, "total": 25 }
  }
}
```

### POST /api/economy/vendors/:id/haggle
Attempt to negotiate a better price. Requires character selection.

**Request Body:**
```json
{
  "itemId": "item_001",
  "action": "buy",
  "proposedPrice": 45
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "haggleResult": "SUCCESS",
    "roll": { "dice": 9, "modifier": 1, "total": 10, "target": 8 },
    "prices": { "original": 55, "proposed": 45, "final": 50, "discount": 5 },
    "vendorReaction": "The vendor sighs and nods reluctantly."
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Access denied |
| `INVALID_TOKEN` | JWT is invalid |
| `TOKEN_EXPIRED` | JWT has expired |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Input validation failed |
| `NO_CHARACTER` | No character selected |
| `TIER_TOO_LOW` | Character tier insufficient |
| `MISSION_ACTIVE` | Already have active mission |
| `INSUFFICIENT_REPUTATION` | Need higher faction reputation |
| `WAR_ENDED` | Faction war has concluded |
| `INTERNAL_ERROR` | Server error |

---

## Rate Limits

| Endpoint Category | Rate Limit |
|-------------------|------------|
| Authentication | 10 req/min |
| API Read | 60 req/min |
| API Write | 30 req/min |
| WebSocket | 1 connection/session |

---

*"The Algorithm sees all. Deliver efficiently."*
