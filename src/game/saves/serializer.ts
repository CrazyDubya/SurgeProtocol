/**
 * Surge Protocol - Save Data Serializer
 *
 * Handles serialization of game state into chunks for storage.
 * Supports:
 * - Character core data
 * - Inventory items
 * - Mission state
 * - Reputation/factions
 * - Skills and abilities
 * - World state
 */

import { nanoid } from 'nanoid';
import type {
  Character,
  CharacterAttribute,
  CharacterInventory,
  CharacterMission,
  CharacterReputation,
  CharacterVehicle,
  SaveDataChunk,
} from '../../db/types';

// =============================================================================
// CHUNK TYPES
// =============================================================================

export type ChunkType =
  | 'CHARACTER_CORE'
  | 'INVENTORY'
  | 'MISSIONS'
  | 'REPUTATION'
  | 'SKILLS'
  | 'VEHICLES'
  | 'WORLD_STATE'
  | 'CONTACTS'
  | 'QUEST_STATE';

// =============================================================================
// CHUNK DATA INTERFACES
// =============================================================================

/** Core character data serialized in CHARACTER_CORE chunk */
export interface CharacterCoreData {
  // Identity
  id: string;
  legal_name: string;
  street_name: string | null;
  handle: string | null;

  // Physical
  sex: string | null;
  age: number | null;
  blood_type: string | null;

  // Corporate
  omnideliver_id: string | null;
  corporate_standing: string;
  employee_since: string | null;

  // Progression
  current_tier: number;
  current_xp: number;
  lifetime_xp: number;
  convergence_path: string;

  // Rating
  carrier_rating: number;
  total_deliveries: number;
  perfect_deliveries: number;
  failed_deliveries: number;

  // Resources
  current_health: number;
  max_health: number;
  current_stamina: number;
  max_stamina: number;
  current_humanity: number;
  max_humanity: number;

  // Consciousness
  consciousness_state: string;
  network_integration_level: number;
  fork_count: number;

  // Location
  current_location_id: string | null;
  home_location_id: string | null;

  // Stats
  total_playtime_seconds: number;
}

/** Inventory data serialized in INVENTORY chunk */
export interface InventoryChunkData {
  items: Array<{
    id: string;
    item_id: string;
    quantity: number;
    is_equipped: number;
    equipped_slot: string | null;
    durability_current: number | null;
    durability_max: number | null;
    custom_name: string | null;
    acquired_from: string | null;
    acquired_at: string;
  }>;
  equippedItems: string[];
  credits: number;
}

/** Mission state data */
export interface MissionsChunkData {
  activeMissions: Array<{
    id: string;
    mission_id: string;
    status: string;
    accepted_at: string;
    started_at: string | null;
    deadline: string | null;
    current_objective_index: number;
    objectives_completed: string[];
    complications_triggered: string[];
  }>;
  completedMissionIds: string[];
  missionCooldowns: Record<string, string>; // mission_id -> cooldown_expires_at
}

/** Reputation with factions */
export interface ReputationChunkData {
  factions: Array<{
    faction_id: string;
    reputation_value: number;
    reputation_tier: string;
    is_member: number;
    rank_in_faction: string | null;
    missions_completed_for: number;
    lifetime_reputation_gained: number;
    lifetime_reputation_lost: number;
    last_interaction: string | null;
  }>;
}

/** Skills and abilities data */
export interface SkillsChunkData {
  attributes: Array<{
    attribute_id: string;
    base_value: number;
    current_value: number;
    bonus_from_augments: number;
    bonus_from_items: number;
    bonus_from_conditions: number;
    temporary_modifier: number;
    times_increased: number;
    xp_invested: number;
  }>;
  skills: Record<string, number>;
  abilities: string[];
  perks: string[];
}

/** Vehicles owned by character */
export interface VehiclesChunkData {
  vehicles: Array<{
    id: string;
    vehicle_definition_id: string;
    custom_name: string | null;
    license_plate: string | null;
    is_registered: number;
    current_location_id: string | null;
    current_hull_points: number;
    current_fuel: number;
    odometer_km: number;
    is_damaged: number;
    paint_color_primary: string | null;
    paint_color_secondary: string | null;
    installed_mods: string | null;
    ownership_type: string | null;
    owned_outright: number;
    corporate_issued: number;
    total_deliveries: number;
    total_distance_km: number;
    accidents: number;
  }>;
  activeVehicleId: string | null;
}

/** World state snapshot */
export interface WorldStateChunkData {
  gameTime: string;
  weatherState: string | null;
  activeEvents: string[];
  discoveredLocations: string[];
  unlockedAreas: string[];
}

// =============================================================================
// CHECKSUM UTILITIES
// =============================================================================

/**
 * Calculate a checksum for data integrity verification.
 * Uses a simple FNV-1a hash for speed.
 */
export function calculateChecksum(data: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Verify data integrity against a checksum.
 */
export function verifyChecksum(data: string, checksum: string): boolean {
  return calculateChecksum(data) === checksum;
}

// =============================================================================
// COMPRESSION UTILITIES
// =============================================================================

/**
 * Compress data for storage (simple implementation).
 * In production, would use actual compression like gzip.
 */
export function compressData(data: string): { compressed: string; originalSize: number; compressedSize: number } {
  // For now, just return the data as-is (mock compression)
  // In production, would use CompressionStream or pako
  const compressed = data;
  return {
    compressed,
    originalSize: data.length,
    compressedSize: compressed.length,
  };
}

/**
 * Decompress data from storage.
 */
export function decompressData(data: string): string {
  // For now, just return as-is
  return data;
}

// =============================================================================
// SERIALIZER CLASS
// =============================================================================

export class SaveDataSerializer {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Serialize all character data into chunks for a save.
   */
  async serializeCharacterState(
    characterId: string,
    saveId: string
  ): Promise<SaveDataChunk[]> {
    const chunks: SaveDataChunk[] = [];

    // Serialize each chunk type
    chunks.push(await this.serializeCharacterCore(characterId, saveId));
    chunks.push(await this.serializeInventory(characterId, saveId));
    chunks.push(await this.serializeMissions(characterId, saveId));
    chunks.push(await this.serializeReputation(characterId, saveId));
    chunks.push(await this.serializeSkills(characterId, saveId));
    chunks.push(await this.serializeVehicles(characterId, saveId));

    return chunks;
  }

  /**
   * Serialize character core data.
   */
  async serializeCharacterCore(characterId: string, saveId: string): Promise<SaveDataChunk> {
    const character = await this.db
      .prepare('SELECT * FROM characters WHERE id = ?')
      .bind(characterId)
      .first<Character>();

    if (!character) {
      throw new Error(`Character not found: ${characterId}`);
    }

    const data: CharacterCoreData = {
      id: character.id,
      legal_name: character.legal_name,
      street_name: character.street_name,
      handle: character.handle,
      sex: character.sex,
      age: character.age,
      blood_type: character.blood_type,
      omnideliver_id: character.omnideliver_id,
      corporate_standing: character.corporate_standing,
      employee_since: character.employee_since,
      current_tier: character.current_tier,
      current_xp: character.current_xp,
      lifetime_xp: character.lifetime_xp,
      convergence_path: character.convergence_path,
      carrier_rating: character.carrier_rating,
      total_deliveries: character.total_deliveries,
      perfect_deliveries: character.perfect_deliveries,
      failed_deliveries: character.failed_deliveries,
      current_health: character.current_health,
      max_health: character.max_health,
      current_stamina: character.current_stamina,
      max_stamina: character.max_stamina,
      current_humanity: character.current_humanity,
      max_humanity: character.max_humanity,
      consciousness_state: character.consciousness_state,
      network_integration_level: character.network_integration_level,
      fork_count: character.fork_count,
      current_location_id: character.current_location_id,
      home_location_id: character.home_location_id,
      total_playtime_seconds: character.total_playtime_seconds,
    };

    return this.createChunk(saveId, 'CHARACTER_CORE', data, 0);
  }

  /**
   * Serialize inventory data.
   */
  async serializeInventory(characterId: string, saveId: string): Promise<SaveDataChunk> {
    const items = await this.db
      .prepare('SELECT * FROM character_inventory WHERE character_id = ?')
      .bind(characterId)
      .all<CharacterInventory>();

    // Get character credits
    const character = await this.db
      .prepare('SELECT current_credits FROM characters WHERE id = ?')
      .bind(characterId)
      .first<{ current_credits: number }>();

    const data: InventoryChunkData = {
      items: items.results.map(item => ({
        id: item.id,
        item_id: item.item_id,
        quantity: item.quantity,
        is_equipped: item.is_equipped,
        equipped_slot: item.equipped_slot,
        durability_current: item.durability_current,
        durability_max: item.durability_max,
        custom_name: item.custom_name,
        acquired_from: item.acquired_from,
        acquired_at: item.acquired_at,
      })),
      equippedItems: items.results
        .filter(i => i.is_equipped)
        .map(i => i.id),
      credits: character?.current_credits ?? 0,
    };

    return this.createChunk(saveId, 'INVENTORY', data, 1, ['CHARACTER_CORE']);
  }

  /**
   * Serialize mission state.
   */
  async serializeMissions(characterId: string, saveId: string): Promise<SaveDataChunk> {
    const missions = await this.db
      .prepare('SELECT * FROM character_missions WHERE character_id = ?')
      .bind(characterId)
      .all<CharacterMission>();

    const data: MissionsChunkData = {
      activeMissions: missions.results
        .filter(m => ['ACCEPTED', 'IN_PROGRESS'].includes(m.status))
        .map(m => ({
          id: m.id,
          mission_id: m.mission_id,
          status: m.status,
          accepted_at: m.accepted_at,
          started_at: m.started_at,
          deadline: m.deadline,
          current_objective_index: m.current_objective_index,
          objectives_completed: JSON.parse(m.objectives_completed || '[]'),
          complications_triggered: JSON.parse(m.complications_triggered || '[]'),
        })),
      completedMissionIds: missions.results
        .filter(m => m.status === 'COMPLETED')
        .map(m => m.mission_id),
      missionCooldowns: {}, // Would be populated from cooldown tracking
    };

    return this.createChunk(saveId, 'MISSIONS', data, 2, ['CHARACTER_CORE']);
  }

  /**
   * Serialize reputation data.
   */
  async serializeReputation(characterId: string, saveId: string): Promise<SaveDataChunk> {
    const reputation = await this.db
      .prepare('SELECT * FROM character_reputation WHERE character_id = ?')
      .bind(characterId)
      .all<CharacterReputation>();

    const data: ReputationChunkData = {
      factions: reputation.results.map(r => ({
        faction_id: r.faction_id,
        reputation_value: r.reputation_value,
        reputation_tier: r.reputation_tier,
        is_member: r.is_member,
        rank_in_faction: r.rank_in_faction,
        missions_completed_for: r.missions_completed_for,
        lifetime_reputation_gained: r.lifetime_reputation_gained,
        lifetime_reputation_lost: r.lifetime_reputation_lost,
        last_interaction: r.last_interaction,
      })),
    };

    return this.createChunk(saveId, 'REPUTATION', data, 3, ['CHARACTER_CORE']);
  }

  /**
   * Serialize skills and attributes.
   */
  async serializeSkills(characterId: string, saveId: string): Promise<SaveDataChunk> {
    const attributes = await this.db
      .prepare('SELECT * FROM character_attributes WHERE character_id = ?')
      .bind(characterId)
      .all<CharacterAttribute>();

    const data: SkillsChunkData = {
      attributes: attributes.results.map(a => ({
        attribute_id: a.attribute_id,
        base_value: a.base_value,
        current_value: a.current_value,
        bonus_from_augments: a.bonus_from_augments,
        bonus_from_items: a.bonus_from_items,
        bonus_from_conditions: a.bonus_from_conditions,
        temporary_modifier: a.temporary_modifier,
        times_increased: a.times_increased,
        xp_invested: a.xp_invested,
      })),
      skills: {}, // Would be populated from skills table
      abilities: [], // Would be populated from abilities table
      perks: [], // Would be populated from perks table
    };

    return this.createChunk(saveId, 'SKILLS', data, 4, ['CHARACTER_CORE']);
  }

  /**
   * Serialize vehicles.
   */
  async serializeVehicles(characterId: string, saveId: string): Promise<SaveDataChunk> {
    const vehicles = await this.db
      .prepare('SELECT * FROM character_vehicles WHERE character_id = ?')
      .bind(characterId)
      .all<CharacterVehicle>();

    // Get active vehicle from character
    const character = await this.db
      .prepare('SELECT active_vehicle_id FROM characters WHERE id = ?')
      .bind(characterId)
      .first<{ active_vehicle_id: string | null }>();

    const data: VehiclesChunkData = {
      vehicles: vehicles.results.map(v => ({
        id: v.id,
        vehicle_definition_id: v.vehicle_definition_id,
        custom_name: v.custom_name,
        license_plate: v.license_plate,
        is_registered: v.is_registered,
        current_location_id: v.current_location_id,
        current_hull_points: v.current_hull_points,
        current_fuel: v.current_fuel,
        odometer_km: v.odometer_km,
        is_damaged: v.is_damaged,
        paint_color_primary: v.paint_color_primary,
        paint_color_secondary: v.paint_color_secondary,
        installed_mods: v.installed_mods,
        ownership_type: v.ownership_type,
        owned_outright: v.owned_outright,
        corporate_issued: v.corporate_issued,
        total_deliveries: v.total_deliveries,
        total_distance_km: v.total_distance_km,
        accidents: v.accidents,
      })),
      activeVehicleId: character?.active_vehicle_id ?? null,
    };

    return this.createChunk(saveId, 'VEHICLES', data, 5, ['CHARACTER_CORE']);
  }

  /**
   * Create a chunk with proper metadata.
   */
  private createChunk(
    saveId: string,
    chunkType: ChunkType,
    data: unknown,
    priority: number,
    dependencies: string[] = []
  ): SaveDataChunk {
    const jsonData = JSON.stringify(data);
    const { compressed, originalSize, compressedSize } = compressData(jsonData);
    const checksum = calculateChecksum(compressed);

    return {
      id: nanoid(),
      save_id: saveId,
      chunk_type: chunkType,
      data: compressed,
      data_version: 1,
      compressed: compressedSize < originalSize ? 1 : 0,
      compressed_size_bytes: compressedSize,
      uncompressed_size_bytes: originalSize,
      checksum,
      is_valid: 1,
      depends_on_chunks: dependencies.length > 0 ? JSON.stringify(dependencies) : null,
      load_priority: priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Store chunks in the database.
   */
  async storeChunks(chunks: SaveDataChunk[]): Promise<void> {
    for (const chunk of chunks) {
      await this.db
        .prepare(`
          INSERT INTO save_data_chunks (
            id, save_id, chunk_type, data, data_version,
            compressed, compressed_size_bytes, uncompressed_size_bytes,
            checksum, is_valid, depends_on_chunks, load_priority,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          chunk.id,
          chunk.save_id,
          chunk.chunk_type,
          chunk.data,
          chunk.data_version,
          chunk.compressed,
          chunk.compressed_size_bytes,
          chunk.uncompressed_size_bytes,
          chunk.checksum,
          chunk.is_valid,
          chunk.depends_on_chunks,
          chunk.load_priority,
          chunk.created_at,
          chunk.updated_at
        )
        .run();
    }
  }

  /**
   * Load chunks for a save.
   */
  async loadChunks(saveId: string): Promise<SaveDataChunk[]> {
    const result = await this.db
      .prepare(`
        SELECT * FROM save_data_chunks
        WHERE save_id = ?
        ORDER BY load_priority ASC
      `)
      .bind(saveId)
      .all<SaveDataChunk>();

    // Verify checksums
    for (const chunk of result.results) {
      if (chunk.checksum && !verifyChecksum(chunk.data, chunk.checksum)) {
        chunk.is_valid = 0;
        // Mark as invalid in DB
        await this.db
          .prepare('UPDATE save_data_chunks SET is_valid = 0 WHERE id = ?')
          .bind(chunk.id)
          .run();
      }
    }

    return result.results;
  }

  /**
   * Deserialize a specific chunk type.
   */
  deserializeChunk<T>(chunk: SaveDataChunk): T {
    const data = chunk.compressed ? decompressData(chunk.data) : chunk.data;
    return JSON.parse(data) as T;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createSaveSerializer(db: D1Database): SaveDataSerializer {
  return new SaveDataSerializer(db);
}
