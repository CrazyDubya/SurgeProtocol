/**
 * Surge Protocol - Save Data Loader
 *
 * Handles loading and restoring game state from saved chunks.
 * Supports:
 * - Integrity validation
 * - Chunk deserialization
 * - Character state restoration
 * - Checkpoint management
 */

import { nanoid } from 'nanoid';
import type {
  SaveGame,
  SaveDataChunk,
  Checkpoint,
} from '../../db/types';
import {
  SaveDataSerializer,
  verifyChecksum,
  decompressData,
  type CharacterCoreData,
  type InventoryChunkData,
  type MissionsChunkData,
  type ReputationChunkData,
  type SkillsChunkData,
  type VehiclesChunkData,
} from './serializer';

// =============================================================================
// TYPES
// =============================================================================

export interface LoadResult {
  success: boolean;
  saveId: string;
  characterId: string | null;
  loadedChunks: string[];
  failedChunks: string[];
  warnings: string[];
  restoredData: {
    character: CharacterCoreData | null;
    inventory: InventoryChunkData | null;
    missions: MissionsChunkData | null;
    reputation: ReputationChunkData | null;
    skills: SkillsChunkData | null;
    vehicles: VehiclesChunkData | null;
  };
}

export interface CheckpointCreateOptions {
  saveId: string;
  characterId: string;
  checkpointType: 'MISSION_START' | 'KEY_MOMENT' | 'AUTO' | 'MANUAL';
  triggerSource: string;
  description?: string;
  locationId?: string;
  coordinates?: { lat: number; lng: number };
  criticalState?: Record<string, unknown>;
  expiresAt?: Date;
  isPersistent?: boolean;
}

export interface CheckpointInfo {
  id: string;
  checkpointType: string;
  triggerSource: string;
  description: string | null;
  createdAt: string;
  replayPossible: boolean;
  restoreCount: number;
}

// =============================================================================
// LOADER CLASS
// =============================================================================

export class SaveDataLoader {
  private db: D1Database;
  private serializer: SaveDataSerializer;

  constructor(db: D1Database) {
    this.db = db;
    this.serializer = new SaveDataSerializer(db);
  }

  /**
   * Validate a save's integrity before loading.
   */
  async validateSave(saveId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check save exists
    const save = await this.db
      .prepare('SELECT * FROM save_games WHERE id = ?')
      .bind(saveId)
      .first<SaveGame>();

    if (!save) {
      return { isValid: false, errors: ['Save not found'], warnings };
    }

    // Check save integrity flags
    if (save.is_corrupted) {
      errors.push('Save file is marked as corrupted');
    }

    if (!save.is_valid) {
      errors.push('Save file is marked as invalid');
    }

    if (save.tamper_detected) {
      errors.push('Save file tampering detected');
    }

    // Check chunks
    const chunks = await this.db
      .prepare(`
        SELECT * FROM save_data_chunks
        WHERE save_id = ?
        ORDER BY load_priority ASC
      `)
      .bind(saveId)
      .all<SaveDataChunk>();

    if (chunks.results.length === 0) {
      warnings.push('No data chunks found - save may be incomplete');
    }

    // Verify chunk checksums
    for (const chunk of chunks.results) {
      if (chunk.checksum) {
        const data = chunk.compressed ? decompressData(chunk.data) : chunk.data;
        if (!verifyChecksum(chunk.data, chunk.checksum)) {
          errors.push(`Chunk ${chunk.chunk_type} has invalid checksum`);
        }
      }

      if (!chunk.is_valid) {
        errors.push(`Chunk ${chunk.chunk_type} is marked as invalid`);
      }
    }

    // Check for required chunks
    const chunkTypes = chunks.results.map(c => c.chunk_type);
    if (!chunkTypes.includes('CHARACTER_CORE')) {
      errors.push('Missing required CHARACTER_CORE chunk');
    }

    // Check version compatibility
    if (save.save_version && save.save_version > 1) {
      warnings.push(`Save version ${save.save_version} may require migration`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Load a save and restore game state.
   */
  async loadSave(saveId: string): Promise<LoadResult> {
    const result: LoadResult = {
      success: false,
      saveId,
      characterId: null,
      loadedChunks: [],
      failedChunks: [],
      warnings: [],
      restoredData: {
        character: null,
        inventory: null,
        missions: null,
        reputation: null,
        skills: null,
        vehicles: null,
      },
    };

    // Validate first
    const validation = await this.validateSave(saveId);
    if (!validation.isValid) {
      result.warnings.push(...validation.errors);
      return result;
    }
    result.warnings.push(...validation.warnings);

    // Get save metadata
    const save = await this.db
      .prepare('SELECT * FROM save_games WHERE id = ?')
      .bind(saveId)
      .first<SaveGame>();

    if (!save) {
      return result;
    }

    result.characterId = save.character_id;

    // Load chunks in priority order
    const chunks = await this.serializer.loadChunks(saveId);

    for (const chunk of chunks) {
      try {
        await this.loadChunk(chunk, result);
        result.loadedChunks.push(chunk.chunk_type);
      } catch (error) {
        result.failedChunks.push(chunk.chunk_type);
        result.warnings.push(`Failed to load chunk ${chunk.chunk_type}: ${error}`);
      }
    }

    // Consider it successful if we loaded at least CHARACTER_CORE
    result.success = result.loadedChunks.includes('CHARACTER_CORE');

    return result;
  }

  /**
   * Load a specific chunk into the result.
   */
  private async loadChunk(chunk: SaveDataChunk, result: LoadResult): Promise<void> {
    const data = chunk.compressed ? decompressData(chunk.data) : chunk.data;
    const parsed = JSON.parse(data);

    switch (chunk.chunk_type) {
      case 'CHARACTER_CORE':
        result.restoredData.character = parsed as CharacterCoreData;
        break;
      case 'INVENTORY':
        result.restoredData.inventory = parsed as InventoryChunkData;
        break;
      case 'MISSIONS':
        result.restoredData.missions = parsed as MissionsChunkData;
        break;
      case 'REPUTATION':
        result.restoredData.reputation = parsed as ReputationChunkData;
        break;
      case 'SKILLS':
        result.restoredData.skills = parsed as SkillsChunkData;
        break;
      case 'VEHICLES':
        result.restoredData.vehicles = parsed as VehiclesChunkData;
        break;
      default:
        result.warnings.push(`Unknown chunk type: ${chunk.chunk_type}`);
    }
  }

  /**
   * Restore character state from loaded data to the database.
   */
  async restoreCharacterState(
    characterId: string,
    loadResult: LoadResult
  ): Promise<{ restored: boolean; changes: string[] }> {
    const changes: string[] = [];

    if (!loadResult.success || !loadResult.restoredData.character) {
      return { restored: false, changes };
    }

    const char = loadResult.restoredData.character;

    // Update character core data
    await this.db
      .prepare(`
        UPDATE characters SET
          current_tier = ?,
          current_xp = ?,
          lifetime_xp = ?,
          carrier_rating = ?,
          total_deliveries = ?,
          perfect_deliveries = ?,
          failed_deliveries = ?,
          current_health = ?,
          max_health = ?,
          current_stamina = ?,
          max_stamina = ?,
          current_humanity = ?,
          max_humanity = ?,
          consciousness_state = ?,
          network_integration_level = ?,
          fork_count = ?,
          current_location_id = ?,
          total_playtime_seconds = ?
        WHERE id = ?
      `)
      .bind(
        char.current_tier,
        char.current_xp,
        char.lifetime_xp,
        char.carrier_rating,
        char.total_deliveries,
        char.perfect_deliveries,
        char.failed_deliveries,
        char.current_health,
        char.max_health,
        char.current_stamina,
        char.max_stamina,
        char.current_humanity,
        char.max_humanity,
        char.consciousness_state,
        char.network_integration_level,
        char.fork_count,
        char.current_location_id,
        char.total_playtime_seconds,
        characterId
      )
      .run();
    changes.push('character_core');

    // Restore inventory if available
    if (loadResult.restoredData.inventory) {
      // Delete current inventory
      await this.db
        .prepare('DELETE FROM character_inventory WHERE character_id = ?')
        .bind(characterId)
        .run();

      // Re-insert inventory items
      for (const item of loadResult.restoredData.inventory.items) {
        await this.db
          .prepare(`
            INSERT INTO character_inventory (
              id, character_id, item_id, quantity, is_equipped, equipped_slot,
              durability_current, durability_max, custom_name, acquired_from, acquired_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            item.id,
            characterId,
            item.item_id,
            item.quantity,
            item.is_equipped,
            item.equipped_slot,
            item.durability_current,
            item.durability_max,
            item.custom_name,
            item.acquired_from,
            item.acquired_at
          )
          .run();
      }
      changes.push('inventory');
    }

    // Restore skills/attributes if available
    if (loadResult.restoredData.skills) {
      for (const attr of loadResult.restoredData.skills.attributes) {
        await this.db
          .prepare(`
            UPDATE character_attributes SET
              base_value = ?,
              current_value = ?,
              bonus_from_augments = ?,
              bonus_from_items = ?,
              bonus_from_conditions = ?,
              temporary_modifier = ?,
              times_increased = ?,
              xp_invested = ?
            WHERE character_id = ? AND attribute_id = ?
          `)
          .bind(
            attr.base_value,
            attr.current_value,
            attr.bonus_from_augments,
            attr.bonus_from_items,
            attr.bonus_from_conditions,
            attr.temporary_modifier,
            attr.times_increased,
            attr.xp_invested,
            characterId,
            attr.attribute_id
          )
          .run();
      }
      changes.push('attributes');
    }

    // Restore reputation if available
    if (loadResult.restoredData.reputation) {
      for (const rep of loadResult.restoredData.reputation.factions) {
        await this.db
          .prepare(`
            UPDATE character_reputation SET
              reputation_value = ?,
              reputation_tier = ?,
              is_member = ?,
              rank_in_faction = ?,
              missions_completed_for = ?,
              lifetime_reputation_gained = ?,
              lifetime_reputation_lost = ?,
              last_interaction = ?
            WHERE character_id = ? AND faction_id = ?
          `)
          .bind(
            rep.reputation_value,
            rep.reputation_tier,
            rep.is_member,
            rep.rank_in_faction,
            rep.missions_completed_for,
            rep.lifetime_reputation_gained,
            rep.lifetime_reputation_lost,
            rep.last_interaction,
            characterId,
            rep.faction_id
          )
          .run();
      }
      changes.push('reputation');
    }

    return { restored: true, changes };
  }

  // ===========================================================================
  // CHECKPOINT SYSTEM
  // ===========================================================================

  /**
   * Create a checkpoint for a save.
   */
  async createCheckpoint(options: CheckpointCreateOptions): Promise<Checkpoint> {
    const checkpointId = nanoid();
    const now = new Date().toISOString();

    await this.db
      .prepare(`
        INSERT INTO checkpoints (
          id, save_id, created_at,
          checkpoint_type, trigger_source, description,
          location_id, coordinates, critical_state,
          expires_at, is_persistent, replay_possible, restore_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        checkpointId,
        options.saveId,
        now,
        options.checkpointType,
        options.triggerSource,
        options.description ?? null,
        options.locationId ?? null,
        options.coordinates ? JSON.stringify(options.coordinates) : null,
        options.criticalState ? JSON.stringify(options.criticalState) : null,
        options.expiresAt?.toISOString() ?? null,
        options.isPersistent ? 1 : 0,
        1, // replay_possible
        0  // restore_count
      )
      .run();

    // Also serialize current state into checkpoint-specific chunks
    const serializer = new SaveDataSerializer(this.db);
    const chunks = await serializer.serializeCharacterState(options.characterId, options.saveId);

    // Store chunks with checkpoint reference (as a separate chunk type)
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
          nanoid(),
          options.saveId,
          `CHECKPOINT_${checkpointId}_${chunk.chunk_type}`,
          chunk.data,
          chunk.data_version,
          chunk.compressed,
          chunk.compressed_size_bytes,
          chunk.uncompressed_size_bytes,
          chunk.checksum,
          chunk.is_valid,
          chunk.depends_on_chunks,
          chunk.load_priority,
          now,
          now
        )
        .run();
    }

    return {
      id: checkpointId,
      save_id: options.saveId,
      created_at: now,
      checkpoint_type: options.checkpointType,
      trigger_source: options.triggerSource,
      description: options.description ?? null,
      location_id: options.locationId ?? null,
      coordinates: options.coordinates ? JSON.stringify(options.coordinates) : null,
      critical_state: options.criticalState ? JSON.stringify(options.criticalState) : null,
      expires_at: options.expiresAt?.toISOString() ?? null,
      is_persistent: options.isPersistent ? 1 : 0,
      replay_possible: 1,
      restore_count: 0,
    };
  }

  /**
   * List checkpoints for a save.
   */
  async listCheckpoints(saveId: string): Promise<CheckpointInfo[]> {
    const result = await this.db
      .prepare(`
        SELECT id, checkpoint_type, trigger_source, description,
               created_at, replay_possible, restore_count
        FROM checkpoints
        WHERE save_id = ?
        ORDER BY created_at DESC
      `)
      .bind(saveId)
      .all<{
        id: string;
        checkpoint_type: string;
        trigger_source: string;
        description: string | null;
        created_at: string;
        replay_possible: number;
        restore_count: number;
      }>();

    return result.results.map(cp => ({
      id: cp.id,
      checkpointType: cp.checkpoint_type,
      triggerSource: cp.trigger_source,
      description: cp.description,
      createdAt: cp.created_at,
      replayPossible: cp.replay_possible === 1,
      restoreCount: cp.restore_count,
    }));
  }

  /**
   * Restore from a checkpoint.
   */
  async restoreFromCheckpoint(
    checkpointId: string,
    characterId: string
  ): Promise<{ success: boolean; message: string }> {
    // Get checkpoint
    const checkpoint = await this.db
      .prepare('SELECT * FROM checkpoints WHERE id = ?')
      .bind(checkpointId)
      .first<Checkpoint>();

    if (!checkpoint) {
      return { success: false, message: 'Checkpoint not found' };
    }

    if (!checkpoint.replay_possible) {
      return { success: false, message: 'Checkpoint cannot be replayed' };
    }

    // Find checkpoint chunks
    const pattern = `CHECKPOINT_${checkpointId}_%`;

    const chunks = await this.db
      .prepare(`
        SELECT * FROM save_data_chunks
        WHERE save_id = ? AND chunk_type LIKE ?
        ORDER BY load_priority ASC
      `)
      .bind(checkpoint.save_id, pattern)
      .all<SaveDataChunk>();

    if (chunks.results.length === 0) {
      return { success: false, message: 'No checkpoint data found' };
    }

    // Build a load result from checkpoint chunks
    const loadResult: LoadResult = {
      success: true,
      saveId: checkpoint.save_id,
      characterId,
      loadedChunks: [],
      failedChunks: [],
      warnings: [],
      restoredData: {
        character: null,
        inventory: null,
        missions: null,
        reputation: null,
        skills: null,
        vehicles: null,
      },
    };

    for (const chunk of chunks.results) {
      // Extract original chunk type from CHECKPOINT_xxx_TYPE format
      // nanoid default length is 21 characters (uses a-zA-Z0-9_-)
      // Format: CHECKPOINT_<21-char-nanoid>_<CHUNK_TYPE>
      const typeMatch = chunk.chunk_type.match(/^CHECKPOINT_(.{21})_(.+)$/);
      if (!typeMatch) {
        continue;
      }

      const originalType = typeMatch[2]; // Group 2 is the chunk type (after the ID)
      const data = chunk.compressed ? decompressData(chunk.data) : chunk.data;
      const parsed = JSON.parse(data);

      switch (originalType) {
        case 'CHARACTER_CORE':
          loadResult.restoredData.character = parsed;
          loadResult.loadedChunks.push('CHARACTER_CORE');
          break;
        case 'INVENTORY':
          loadResult.restoredData.inventory = parsed;
          loadResult.loadedChunks.push('INVENTORY');
          break;
        case 'MISSIONS':
          loadResult.restoredData.missions = parsed;
          loadResult.loadedChunks.push('MISSIONS');
          break;
        case 'REPUTATION':
          loadResult.restoredData.reputation = parsed;
          loadResult.loadedChunks.push('REPUTATION');
          break;
        case 'SKILLS':
          loadResult.restoredData.skills = parsed;
          loadResult.loadedChunks.push('SKILLS');
          break;
        case 'VEHICLES':
          loadResult.restoredData.vehicles = parsed;
          loadResult.loadedChunks.push('VEHICLES');
          break;
      }
    }

    // Restore character state
    const { restored, changes } = await this.restoreCharacterState(characterId, loadResult);

    if (!restored) {
      return { success: false, message: 'Failed to restore character state' };
    }

    // Increment restore count
    await this.db
      .prepare('UPDATE checkpoints SET restore_count = restore_count + 1 WHERE id = ?')
      .bind(checkpointId)
      .run();

    return {
      success: true,
      message: `Restored from checkpoint. Changes: ${changes.join(', ')}`,
    };
  }

  /**
   * Delete expired checkpoints.
   */
  async cleanupExpiredCheckpoints(): Promise<number> {
    const now = new Date().toISOString();

    // Get expired checkpoints
    const expired = await this.db
      .prepare(`
        SELECT id, save_id FROM checkpoints
        WHERE expires_at IS NOT NULL
        AND expires_at < ?
        AND is_persistent = 0
      `)
      .bind(now)
      .all<{ id: string; save_id: string }>();

    // Delete associated chunks
    for (const cp of expired.results) {
      await this.db
        .prepare('DELETE FROM save_data_chunks WHERE chunk_type LIKE ?')
        .bind(`CHECKPOINT_${cp.id}_%`)
        .run();
    }

    // Delete checkpoints
    const result = await this.db
      .prepare(`
        DELETE FROM checkpoints
        WHERE expires_at IS NOT NULL
        AND expires_at < ?
        AND is_persistent = 0
      `)
      .bind(now)
      .run();

    return expired.results.length;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createSaveLoader(db: D1Database): SaveDataLoader {
  return new SaveDataLoader(db);
}
