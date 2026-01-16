/**
 * Surge Protocol - Database Query Utilities
 *
 * Type-safe query helpers for D1 database operations.
 * All queries use parameterized statements to prevent SQL injection.
 */

import { nanoid } from 'nanoid';
import type {
  Character,
  CharacterAttribute,
  RatingComponents,
  MissionDefinition,
  CharacterMission,
  Faction,
  CharacterReputation,
  CharacterInventory,
  MissionStatus,
  ReputationTier,
} from './types';

// =============================================================================
// TRANSACTION HELPER
// =============================================================================

/**
 * Execute multiple statements in a batch (transaction-like).
 * D1 executes batched statements atomically.
 */
export async function batch(
  db: D1Database,
  statements: D1PreparedStatement[]
): Promise<D1Result[]> {
  return db.batch(statements);
}

/**
 * Generate a new ID for database records.
 */
export function generateId(): string {
  return nanoid();
}

// =============================================================================
// CHARACTER QUERIES
// =============================================================================

/**
 * Get a character by ID.
 */
export async function getCharacter(
  db: D1Database,
  characterId: string
): Promise<Character | null> {
  return db
    .prepare('SELECT * FROM characters WHERE id = ?')
    .bind(characterId)
    .first<Character>();
}

/**
 * Get a character by player ID.
 */
export async function getCharacterByPlayer(
  db: D1Database,
  playerId: string
): Promise<Character | null> {
  return db
    .prepare('SELECT * FROM characters WHERE player_id = ? AND is_active = 1')
    .bind(playerId)
    .first<Character>();
}

/**
 * Get a character by handle (unique username).
 */
export async function getCharacterByHandle(
  db: D1Database,
  handle: string
): Promise<Character | null> {
  return db
    .prepare('SELECT * FROM characters WHERE handle = ?')
    .bind(handle)
    .first<Character>();
}

/**
 * Create a new character.
 */
export async function createCharacter(
  db: D1Database,
  data: {
    playerId: string;
    legalName: string;
    streetName?: string;
    handle?: string;
    sex?: string;
    age?: number;
  }
): Promise<string> {
  const id = generateId();
  const omnideliverId = `OD-${nanoid(8).toUpperCase()}`;

  await db
    .prepare(
      `INSERT INTO characters (
        id, player_id, legal_name, street_name, handle,
        sex, age, omnideliver_id, employee_since
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(
      id,
      data.playerId,
      data.legalName,
      data.streetName ?? null,
      data.handle ?? null,
      data.sex ?? null,
      data.age ?? null,
      omnideliverId
    )
    .run();

  // Create rating components record
  await db
    .prepare('INSERT INTO rating_components (id, character_id) VALUES (?, ?)')
    .bind(generateId(), id)
    .run();

  return id;
}

/**
 * Update character location.
 */
export async function updateCharacterLocation(
  db: D1Database,
  characterId: string,
  locationId: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE characters
       SET current_location_id = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(locationId, characterId)
    .run();
}

/**
 * Update character health.
 */
export async function updateCharacterHealth(
  db: D1Database,
  characterId: string,
  currentHealth: number
): Promise<void> {
  await db
    .prepare(
      `UPDATE characters
       SET current_health = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(currentHealth, characterId)
    .run();
}

/**
 * Update character humanity.
 */
export async function updateCharacterHumanity(
  db: D1Database,
  characterId: string,
  currentHumanity: number
): Promise<void> {
  await db
    .prepare(
      `UPDATE characters
       SET current_humanity = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(currentHumanity, characterId)
    .run();
}

/**
 * Update character rating and delivery stats.
 */
export async function updateCharacterRating(
  db: D1Database,
  characterId: string,
  rating: number,
  deliveryResult: 'perfect' | 'completed' | 'failed'
): Promise<void> {
  const perfectIncrement = deliveryResult === 'perfect' ? 1 : 0;
  const failedIncrement = deliveryResult === 'failed' ? 1 : 0;

  await db
    .prepare(
      `UPDATE characters
       SET carrier_rating = ?,
           rating_visible = ?,
           total_deliveries = total_deliveries + 1,
           perfect_deliveries = perfect_deliveries + ?,
           failed_deliveries = failed_deliveries + ?,
           updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(rating, rating, perfectIncrement, failedIncrement, characterId)
    .run();
}

/**
 * Update character XP and check for tier up.
 */
export async function addCharacterXP(
  db: D1Database,
  characterId: string,
  xpAmount: number
): Promise<{ newXP: number; tierUp: boolean; newTier: number }> {
  const character = await getCharacter(db, characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  const newXP = character.current_xp + xpAmount;
  const newLifetimeXP = character.lifetime_xp + xpAmount;

  // Check tier thresholds (simplified - should use tier_definitions table)
  const tierThresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];
  let newTier = character.current_tier;
  for (let i = tierThresholds.length - 1; i >= 0; i--) {
    if (newLifetimeXP >= tierThresholds[i]!) {
      newTier = i + 1;
      break;
    }
  }

  const tierUp = newTier > character.current_tier;

  await db
    .prepare(
      `UPDATE characters
       SET current_xp = ?,
           lifetime_xp = ?,
           current_tier = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(newXP, newLifetimeXP, newTier, characterId)
    .run();

  return { newXP, tierUp, newTier };
}

// =============================================================================
// ATTRIBUTE QUERIES
// =============================================================================

/**
 * Get all attributes for a character.
 */
export async function getCharacterAttributes(
  db: D1Database,
  characterId: string
): Promise<CharacterAttribute[]> {
  const result = await db
    .prepare(
      `SELECT ca.*, ad.code as attribute_code, ad.name as attribute_name
       FROM character_attributes ca
       JOIN attribute_definitions ad ON ca.attribute_id = ad.id
       WHERE ca.character_id = ?`
    )
    .bind(characterId)
    .all<CharacterAttribute & { attribute_code: string; attribute_name: string }>();

  return result.results;
}

/**
 * Get effective attribute value (base + all bonuses).
 */
export async function getEffectiveAttribute(
  db: D1Database,
  characterId: string,
  attributeCode: string
): Promise<number> {
  const result = await db
    .prepare(
      `SELECT ca.current_value + ca.bonus_from_augments + ca.bonus_from_items +
              ca.bonus_from_conditions + ca.temporary_modifier as effective_value
       FROM character_attributes ca
       JOIN attribute_definitions ad ON ca.attribute_id = ad.id
       WHERE ca.character_id = ? AND ad.code = ?`
    )
    .bind(characterId, attributeCode)
    .first<{ effective_value: number }>();

  return result?.effective_value ?? 5; // Default attribute value
}

// =============================================================================
// MISSION QUERIES
// =============================================================================

/**
 * Get a mission definition by ID.
 */
export async function getMission(
  db: D1Database,
  missionId: string
): Promise<MissionDefinition | null> {
  return db
    .prepare('SELECT * FROM mission_definitions WHERE id = ?')
    .bind(missionId)
    .first<MissionDefinition>();
}

/**
 * Get available missions for a character's tier.
 */
export async function getAvailableMissions(
  db: D1Database,
  tier: number,
  _rating: number,
  limit: number = 10
): Promise<MissionDefinition[]> {
  const result = await db
    .prepare(
      `SELECT * FROM mission_definitions
       WHERE tier_minimum <= ? AND tier_maximum >= ?
       AND is_repeatable = 1
       ORDER BY base_credits DESC
       LIMIT ?`
    )
    .bind(tier, tier, limit)
    .all<MissionDefinition>();

  return result.results;
}

/**
 * Get a character's active mission.
 */
export async function getActiveMission(
  db: D1Database,
  characterId: string
): Promise<CharacterMission | null> {
  return db
    .prepare(
      `SELECT * FROM character_missions
       WHERE character_id = ? AND status IN ('ACCEPTED', 'IN_PROGRESS')
       ORDER BY accepted_at DESC
       LIMIT 1`
    )
    .bind(characterId)
    .first<CharacterMission>();
}

/**
 * Accept a mission.
 */
export async function acceptMission(
  db: D1Database,
  characterId: string,
  missionId: string,
  deadlineMinutes?: number
): Promise<string> {
  const id = generateId();
  const deadline = deadlineMinutes
    ? `datetime('now', '+${deadlineMinutes} minutes')`
    : null;

  await db
    .prepare(
      `INSERT INTO character_missions (
        id, character_id, mission_id, status, accepted_at, deadline
      ) VALUES (?, ?, ?, 'ACCEPTED', datetime('now'), ${deadline ? deadline : 'NULL'})`
    )
    .bind(id, characterId, missionId)
    .run();

  return id;
}

/**
 * Create a mission instance (for mission_instances table).
 */
export async function createMissionInstance(
  db: D1Database,
  data: {
    missionId: string;
    characterId: string;
    timeLimit?: number;
  }
): Promise<string> {
  const id = generateId();

  await db
    .prepare(
      `INSERT INTO mission_instances (
        id, mission_id, character_id, status, time_limit_minutes, started_at
      ) VALUES (?, ?, ?, 'IN_PROGRESS', ?, datetime('now'))`
    )
    .bind(id, data.missionId, data.characterId, data.timeLimit ?? null)
    .run();

  return id;
}

/**
 * Update mission status.
 */
export async function updateMissionStatus(
  db: D1Database,
  missionInstanceId: string,
  status: MissionStatus,
  result?: {
    rating?: number;
    creditsEarned?: number;
    xpEarned?: number;
  }
): Promise<void> {
  const completedAt = ['COMPLETED', 'FAILED', 'ABANDONED'].includes(status)
    ? "datetime('now')"
    : 'NULL';

  await db
    .prepare(
      `UPDATE character_missions
       SET status = ?,
           completed_at = ${completedAt},
           final_rating = COALESCE(?, final_rating),
           credits_earned = COALESCE(?, credits_earned),
           xp_earned = COALESCE(?, xp_earned),
           updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(
      status,
      result?.rating ?? null,
      result?.creditsEarned ?? null,
      result?.xpEarned ?? null,
      missionInstanceId
    )
    .run();
}

// =============================================================================
// FACTION QUERIES
// =============================================================================

/**
 * Get all factions.
 */
export async function getAllFactions(db: D1Database): Promise<Faction[]> {
  const result = await db.prepare('SELECT * FROM factions').all<Faction>();
  return result.results;
}

/**
 * Get character's reputation with a faction.
 */
export async function getFactionReputation(
  db: D1Database,
  characterId: string,
  factionId: string
): Promise<CharacterReputation | null> {
  return db
    .prepare(
      `SELECT * FROM character_reputations
       WHERE character_id = ? AND faction_id = ?`
    )
    .bind(characterId, factionId)
    .first<CharacterReputation>();
}

/**
 * Update faction reputation.
 */
export async function updateFactionReputation(
  db: D1Database,
  characterId: string,
  factionId: string,
  reputationChange: number
): Promise<{ newValue: number; newTier: ReputationTier }> {
  let rep = await getFactionReputation(db, characterId, factionId);

  if (!rep) {
    // Create new reputation record
    const id = generateId();
    await db
      .prepare(
        `INSERT INTO character_reputations (id, character_id, faction_id, reputation_value, reputation_tier)
         VALUES (?, ?, ?, 0, 'NEUTRAL')`
      )
      .bind(id, characterId, factionId)
      .run();
    rep = await getFactionReputation(db, characterId, factionId);
  }

  const newValue = Math.max(-100, Math.min(100, (rep?.reputation_value ?? 0) + reputationChange));
  const newTier = calculateReputationTier(newValue);

  const gainedCol = reputationChange > 0 ? 'lifetime_reputation_gained' : 'lifetime_reputation_lost';

  await db
    .prepare(
      `UPDATE character_reputations
       SET reputation_value = ?,
           reputation_tier = ?,
           ${gainedCol} = ${gainedCol} + ?,
           last_interaction = datetime('now'),
           updated_at = datetime('now')
       WHERE character_id = ? AND faction_id = ?`
    )
    .bind(newValue, newTier, Math.abs(reputationChange), characterId, factionId)
    .run();

  return { newValue, newTier };
}

function calculateReputationTier(value: number): ReputationTier {
  if (value <= -60) return 'HOSTILE';
  if (value <= -20) return 'UNFRIENDLY';
  if (value < 20) return 'NEUTRAL';
  if (value < 60) return 'FRIENDLY';
  if (value < 90) return 'ALLIED';
  return 'REVERED';
}

// =============================================================================
// INVENTORY QUERIES
// =============================================================================

/**
 * Get character's inventory.
 */
export async function getCharacterInventory(
  db: D1Database,
  characterId: string
): Promise<CharacterInventory[]> {
  const result = await db
    .prepare(
      `SELECT ci.*, id.name as item_name, id.item_type, id.rarity
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_id = id.id
       WHERE ci.character_id = ?
       ORDER BY ci.is_equipped DESC, id.item_type, id.name`
    )
    .bind(characterId)
    .all<CharacterInventory & { item_name: string; item_type: string; rarity: string }>();

  return result.results;
}

/**
 * Add item to inventory.
 */
export async function addToInventory(
  db: D1Database,
  characterId: string,
  itemId: string,
  quantity: number = 1,
  acquiredFrom?: string
): Promise<string> {
  // Check if item already exists in inventory
  const existing = await db
    .prepare(
      `SELECT id, quantity FROM character_inventory
       WHERE character_id = ? AND item_id = ? AND is_equipped = 0`
    )
    .bind(characterId, itemId)
    .first<{ id: string; quantity: number }>();

  if (existing) {
    // Stack the item
    await db
      .prepare(
        `UPDATE character_inventory
         SET quantity = quantity + ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(quantity, existing.id)
      .run();
    return existing.id;
  }

  // Add new inventory entry
  const id = generateId();
  await db
    .prepare(
      `INSERT INTO character_inventory (
        id, character_id, item_id, quantity, acquired_from, acquired_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(id, characterId, itemId, quantity, acquiredFrom ?? null)
    .run();

  return id;
}

/**
 * Remove item from inventory.
 */
export async function removeFromInventory(
  db: D1Database,
  inventoryId: string,
  quantity: number = 1
): Promise<boolean> {
  const item = await db
    .prepare('SELECT quantity FROM character_inventory WHERE id = ?')
    .bind(inventoryId)
    .first<{ quantity: number }>();

  if (!item) return false;

  if (item.quantity <= quantity) {
    // Remove entirely
    await db
      .prepare('DELETE FROM character_inventory WHERE id = ?')
      .bind(inventoryId)
      .run();
  } else {
    // Reduce quantity
    await db
      .prepare(
        `UPDATE character_inventory
         SET quantity = quantity - ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(quantity, inventoryId)
      .run();
  }

  return true;
}

// =============================================================================
// RATING COMPONENT QUERIES
// =============================================================================

/**
 * Get rating components for a character.
 */
export async function getRatingComponents(
  db: D1Database,
  characterId: string
): Promise<RatingComponents | null> {
  return db
    .prepare('SELECT * FROM rating_components WHERE character_id = ?')
    .bind(characterId)
    .first<RatingComponents>();
}

/**
 * Update rating components after mission completion.
 */
export async function updateRatingComponents(
  db: D1Database,
  characterId: string,
  updates: Partial<{
    lateDelivery: boolean;
    packageDamaged: boolean;
    expressCompleted: boolean;
    missionCompleted: boolean;
    missionAbandoned: boolean;
    customerRating: 1 | 2 | 3 | 4 | 5;
  }>
): Promise<void> {
  const setClauses: string[] = ["updated_at = datetime('now')"];
  const values: (number | string)[] = [];

  if (updates.lateDelivery) {
    setClauses.push('late_deliveries = late_deliveries + 1');
  }
  if (updates.packageDamaged) {
    setClauses.push('packages_damaged = packages_damaged + 1');
  }
  if (updates.expressCompleted) {
    setClauses.push('express_deliveries_completed = express_deliveries_completed + 1');
  }
  if (updates.missionCompleted) {
    setClauses.push('missions_completed = missions_completed + 1');
    setClauses.push('consecutive_completions = consecutive_completions + 1');
  }
  if (updates.missionAbandoned) {
    setClauses.push('missions_abandoned = missions_abandoned + 1');
    setClauses.push('consecutive_completions = 0');
  }
  if (updates.customerRating === 5) {
    setClauses.push('five_star_ratings = five_star_ratings + 1');
  }
  if (updates.customerRating === 1) {
    setClauses.push('one_star_ratings = one_star_ratings + 1');
  }

  values.push(characterId);

  await db
    .prepare(
      `UPDATE rating_components SET ${setClauses.join(', ')} WHERE character_id = ?`
    )
    .bind(...values)
    .run();
}

// =============================================================================
// LEADERBOARD QUERIES
// =============================================================================

/**
 * Get top carriers by rating.
 */
export async function getTopCarriers(
  db: D1Database,
  limit: number = 10
): Promise<Array<{ handle: string; carrier_rating: number; total_deliveries: number }>> {
  const result = await db
    .prepare(
      `SELECT handle, carrier_rating, total_deliveries
       FROM characters
       WHERE is_active = 1 AND handle IS NOT NULL
       ORDER BY carrier_rating DESC
       LIMIT ?`
    )
    .bind(limit)
    .all<{ handle: string; carrier_rating: number; total_deliveries: number }>();

  return result.results;
}
