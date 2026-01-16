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

// =============================================================================
// COMBAT QUERIES
// =============================================================================

/** Combat attributes for a character */
export interface CharacterCombatData {
  id: string;
  name: string;
  currentHealth: number;
  maxHealth: number;
  currentTier: number;
  attributes: {
    PWR: number;
    AGI: number;
    END: number;
    VEL: number;
    PRC: number;
  };
  skills: {
    melee: number;
    firearms: number;
  };
  equippedWeapon: {
    id: string;
    name: string;
    type: 'MELEE' | 'RANGED';
    baseDamage: string;
    attackMod: number;
  } | null;
  equippedArmor: {
    id: string;
    name: string;
    value: number;
    agiPenalty: number;
  } | null;
}

/**
 * Get character's combat-relevant data.
 */
export async function getCharacterCombatData(
  db: D1Database,
  characterId: string
): Promise<CharacterCombatData | null> {
  // Get base character data
  const character = await db
    .prepare(
      `SELECT id, street_name, legal_name, current_health, max_health, current_tier
       FROM characters WHERE id = ?`
    )
    .bind(characterId)
    .first<{
      id: string;
      street_name: string | null;
      legal_name: string;
      current_health: number;
      max_health: number;
      current_tier: number;
    }>();

  if (!character) return null;

  // Get attributes
  const attributes = await db
    .prepare(
      `SELECT ad.code, ca.current_value + ca.bonus_from_augments + ca.bonus_from_items +
              ca.bonus_from_conditions + ca.temporary_modifier as value
       FROM character_attributes ca
       JOIN attribute_definitions ad ON ca.attribute_id = ad.id
       WHERE ca.character_id = ? AND ad.code IN ('PWR', 'AGI', 'END', 'VEL', 'PRC')`
    )
    .bind(characterId)
    .all<{ code: string; value: number }>();

  const attrMap: Record<string, number> = {};
  for (const attr of attributes.results) {
    attrMap[attr.code] = attr.value;
  }

  // Get combat skills
  const skills = await db
    .prepare(
      `SELECT sd.code, cs.current_level
       FROM character_skills cs
       JOIN skill_definitions sd ON cs.skill_id = sd.id
       WHERE cs.character_id = ? AND sd.code IN ('melee_combat', 'firearms')`
    )
    .bind(characterId)
    .all<{ code: string; current_level: number }>();

  const skillMap: Record<string, number> = { melee: 0, firearms: 0 };
  for (const skill of skills.results) {
    if (skill.code === 'melee_combat') skillMap.melee = skill.current_level;
    if (skill.code === 'firearms') skillMap.firearms = skill.current_level;
  }

  // Get equipped weapon
  const weapon = await db
    .prepare(
      `SELECT id.id, id.name, id.item_type, id.base_value,
              COALESCE(json_extract(id.properties, '$.damage'), '1d6') as damage,
              COALESCE(json_extract(id.properties, '$.attackMod'), 0) as attackMod
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_id = id.id
       WHERE ci.character_id = ? AND ci.is_equipped = 1
       AND id.item_type IN ('WEAPON_MELEE', 'WEAPON_RANGED')
       LIMIT 1`
    )
    .bind(characterId)
    .first<{
      id: string;
      name: string;
      item_type: string;
      base_value: number;
      damage: string;
      attackMod: number;
    }>();

  // Get equipped armor
  const armor = await db
    .prepare(
      `SELECT id.id, id.name,
              COALESCE(json_extract(id.properties, '$.armorValue'), 0) as armorValue,
              COALESCE(json_extract(id.properties, '$.agiPenalty'), 0) as agiPenalty
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_id = id.id
       WHERE ci.character_id = ? AND ci.is_equipped = 1
       AND id.item_type = 'ARMOR'
       LIMIT 1`
    )
    .bind(characterId)
    .first<{
      id: string;
      name: string;
      armorValue: number;
      agiPenalty: number;
    }>();

  return {
    id: character.id,
    name: character.street_name || character.legal_name,
    currentHealth: character.current_health ?? character.max_health ?? 30,
    maxHealth: character.max_health ?? 30,
    currentTier: character.current_tier,
    attributes: {
      PWR: attrMap.PWR ?? 10,
      AGI: attrMap.AGI ?? 10,
      END: attrMap.END ?? 10,
      VEL: attrMap.VEL ?? 10,
      PRC: attrMap.PRC ?? 10,
    },
    skills: skillMap as { melee: number; firearms: number },
    equippedWeapon: weapon
      ? {
          id: weapon.id,
          name: weapon.name,
          type: weapon.item_type === 'WEAPON_MELEE' ? 'MELEE' : 'RANGED',
          baseDamage: weapon.damage,
          attackMod: weapon.attackMod,
        }
      : null,
    equippedArmor: armor
      ? {
          id: armor.id,
          name: armor.name,
          value: armor.armorValue,
          agiPenalty: armor.agiPenalty,
        }
      : null,
  };
}

/** NPC combat data from definitions */
export interface NPCCombatData {
  id: string;
  code: string;
  name: string;
  threatLevel: number;
  combatStyle: string | null;
  skills: Record<string, number>;
  equipment: Array<{ type: string; name: string; stats: Record<string, unknown> }>;
}

/**
 * Get NPC definition for combat.
 */
export async function getNPCCombatData(
  db: D1Database,
  npcCode: string
): Promise<NPCCombatData | null> {
  const npc = await db
    .prepare(
      `SELECT id, code, name, threat_level, combat_style, skills, typical_equipment
       FROM npc_definitions
       WHERE code = ? AND combat_capable = 1`
    )
    .bind(npcCode)
    .first<{
      id: string;
      code: string;
      name: string;
      threat_level: number;
      combat_style: string | null;
      skills: string | null;
      typical_equipment: string | null;
    }>();

  if (!npc) return null;

  return {
    id: npc.id,
    code: npc.code,
    name: npc.name,
    threatLevel: npc.threat_level,
    combatStyle: npc.combat_style,
    skills: npc.skills ? JSON.parse(npc.skills) : {},
    equipment: npc.typical_equipment ? JSON.parse(npc.typical_equipment) : [],
  };
}

/** Weapon subtype union */
type WeaponSubtype = 'LIGHT_PISTOL' | 'HEAVY_PISTOL' | 'SMG' | 'ASSAULT_RIFLE' | 'SHOTGUN' | 'SNIPER' | 'LIGHT_MELEE' | 'HEAVY_MELEE' | 'UNARMED';

/** Generated enemy combatant */
export interface GeneratedEnemy {
  id: string;
  name: string;
  attributes: { PWR: number; AGI: number; END: number; VEL: number; PRC: number };
  skills: { melee: number; firearms: number };
  hp: number;
  hpMax: number;
  armor: { id: string; name: string; value: number; agiPenalty: number; velPenalty: number } | null;
  weapon: {
    id: string;
    name: string;
    type: 'MELEE' | 'RANGED';
    subtype: WeaponSubtype;
    baseDamage: string;
    scalingAttribute: 'PWR' | 'VEL';
    scalingDivisor: number;
    attackMod: number;
  };
  cover: null;
  augmentBonuses: { initiative: number; attack: number; defense: number; damage: number };
  conditions: string[];
}

/**
 * Generate a procedural enemy combatant based on mission tier.
 * Used when no specific NPC is defined for the encounter.
 */
export function generateProceduralEnemy(
  missionTier: number,
  enemyType: 'GANGER' | 'CORPORATE' | 'DRONE' | 'BEAST' | 'BOSS' = 'GANGER'
): GeneratedEnemy {
  // Base stats scale with tier
  const baseAttr = 8 + Math.floor(missionTier * 0.5);
  const baseSkill = Math.floor(missionTier * 0.8);
  const baseHP = 15 + missionTier * 5;

  // Enemy type modifiers
  const gangerNames = ['Street Punk', 'Gang Enforcer', 'Crew Lieutenant', 'Gang Boss'] as const;
  const corpNames = ['Security Guard', 'Corporate Soldier', 'Elite Operative', 'Black Ops Agent'] as const;
  const droneNames = ['Patrol Drone', 'Combat Drone', 'Hunter-Killer', 'Assault Platform'] as const;
  const beastNames = ['Cyber-Rat', 'Street Hound', 'Mutant Beast', 'Apex Predator'] as const;
  const bossNames = ['Gang Leader', 'Corporate Executive', 'Cyberpsycho', 'Legendary Fixer'] as const;

  const nameIndex = Math.min(Math.floor(missionTier / 3), 3);

  const typeConfigs = {
    GANGER: {
      name: gangerNames[nameIndex],
      attrMod: { PWR: 1, AGI: 0, END: 0, VEL: 0, PRC: -1 },
      weapon: { name: 'Street Iron', type: 'RANGED' as const, damage: '2d6', attackMod: 0, subtype: 'HEAVY_PISTOL' as const },
      armor: missionTier >= 3 ? { name: 'Leather Jacket', value: 1, agiPenalty: 0 } : null,
    },
    CORPORATE: {
      name: corpNames[nameIndex],
      attrMod: { PWR: 0, AGI: 1, END: 0, VEL: 1, PRC: 1 },
      weapon: { name: 'Militech Sidearm', type: 'RANGED' as const, damage: '2d6+1', attackMod: 1, subtype: 'HEAVY_PISTOL' as const },
      armor: { name: 'Corporate Armor', value: 2 + Math.floor(missionTier / 3), agiPenalty: 1 },
    },
    DRONE: {
      name: droneNames[nameIndex],
      attrMod: { PWR: 2, AGI: -1, END: 2, VEL: 0, PRC: 2 },
      weapon: { name: 'Integrated Weapon', type: 'RANGED' as const, damage: '2d6+2', attackMod: 2, subtype: 'SMG' as const },
      armor: { name: 'Armor Plating', value: 3 + Math.floor(missionTier / 2), agiPenalty: 0 },
    },
    BEAST: {
      name: beastNames[nameIndex],
      attrMod: { PWR: 2, AGI: 2, END: 1, VEL: 1, PRC: 0 },
      weapon: { name: 'Claws/Fangs', type: 'MELEE' as const, damage: '2d6+1', attackMod: 1, subtype: 'UNARMED' as const },
      armor: null,
    },
    BOSS: {
      name: bossNames[nameIndex],
      attrMod: { PWR: 2, AGI: 2, END: 2, VEL: 2, PRC: 2 },
      weapon: { name: 'Custom Weapon', type: 'RANGED' as const, damage: '3d6', attackMod: 2, subtype: 'ASSAULT_RIFLE' as const },
      armor: { name: 'Heavy Armor', value: 4 + Math.floor(missionTier / 2), agiPenalty: 2 },
    },
  };

  const config = typeConfigs[enemyType];
  const enemyId = `enemy_${enemyType.toLowerCase()}_${generateId()}`;
  const enemyName = config.name ?? 'Unknown Enemy';

  const attributes = {
    PWR: baseAttr + config.attrMod.PWR,
    AGI: baseAttr + config.attrMod.AGI,
    END: baseAttr + config.attrMod.END,
    VEL: baseAttr + config.attrMod.VEL,
    PRC: baseAttr + config.attrMod.PRC,
  };

  const hpMax = baseHP + (enemyType === 'BOSS' ? missionTier * 10 : 0);

  return {
    id: enemyId,
    name: enemyName,
    attributes,
    skills: {
      melee: baseSkill + (config.weapon.type === 'MELEE' ? 2 : 0),
      firearms: baseSkill + (config.weapon.type === 'RANGED' ? 2 : 0),
    },
    hp: hpMax,
    hpMax,
    armor: config.armor
      ? {
          id: `armor_${enemyId}`,
          name: config.armor.name,
          value: config.armor.value,
          agiPenalty: config.armor.agiPenalty,
          velPenalty: 0,
        }
      : null,
    weapon: {
      id: `weapon_${enemyId}`,
      name: config.weapon.name,
      type: config.weapon.type,
      subtype: config.weapon.subtype,
      baseDamage: config.weapon.damage,
      scalingAttribute: config.weapon.type === 'MELEE' ? 'PWR' : 'VEL',
      scalingDivisor: 2,
      attackMod: config.weapon.attackMod,
    },
    cover: null,
    augmentBonuses: {
      initiative: enemyType === 'BOSS' ? 2 : 0,
      attack: enemyType === 'BOSS' ? 1 : 0,
      defense: enemyType === 'DRONE' ? 1 : 0,
      damage: enemyType === 'BOSS' ? 1 : 0,
    },
    conditions: [],
  };
}
