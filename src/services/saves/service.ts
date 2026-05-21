/**
 * Surge Protocol - Save Service
 *
 * Manages save slots, quicksaves, auto-saves, checkpoints, and character
 * state capture / restoration.
 */

import { BaseService } from '../base/index';
import type { SaveGame, DifficultyLevel } from '../../db/types';
import { createSaveSerializer } from '../../game/saves/serializer';
import { createSaveLoader } from '../../game/saves/loader';

// =============================================================================
// CONSTANTS
// =============================================================================

export const MAX_MANUAL_SAVES = 10;
export const MAX_AUTO_SAVES = 3;
export const QUICKSAVE_SLOT = -1;
export const MAX_CHECKPOINTS_PER_SAVE = 10;

// =============================================================================
// TYPES
// =============================================================================

export interface CharacterStateSnapshot {
    characterName: string;
    characterTier: number;
    characterTrack: string | null;
    currentLocationId: string | null;
    currentLocationName: string | null;
    storyProgress: number;
    mainArcName: string | null;
    mainMissionName: string | null;
    totalMissionsCompleted: number;
    totalCreditsEarned: number;
    totalDistanceKm: number;
    playtimeSeconds: number;
    difficulty: DifficultyLevel | null;
}

export interface CreateSaveInput {
    saveName?: string;
    saveSlot?: number;
    saveType: 'MANUAL' | 'AUTO' | 'QUICK' | 'CHECKPOINT';
}

export interface CheckpointInput {
    saveId: string;
    characterId: string;
    checkpointType: 'MISSION_START' | 'KEY_MOMENT' | 'AUTO' | 'MANUAL';
    triggerSource: string;
    description?: string;
    locationId?: string;
    coordinates?: { lat: number; lng: number };
    criticalState?: Record<string, unknown>;
    expiresInMinutes?: number;
    isPersistent?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

// =============================================================================
// SAVE SERVICE
// =============================================================================

export class SaveService extends BaseService {

    // ---------------------------------------------------------------------------
    // CHARACTER STATE CAPTURE
    // ---------------------------------------------------------------------------

    async captureCharacterState(characterId: string): Promise<CharacterStateSnapshot> {
        const character = await this.db
            .prepare(`SELECT c.legal_name, c.street_name, c.current_tier, c.track_id,
                       c.current_location_id, c.total_playtime_seconds, t.name as track_name
                FROM characters c LEFT JOIN tracks t ON c.track_id = t.id WHERE c.id = ?`)
            .bind(characterId)
            .first<{ legal_name: string; street_name: string | null; current_tier: number; track_id: string | null; current_location_id: string | null; total_playtime_seconds: number; track_name: string | null }>();

        if (!character) throw new Error('Character not found');

        let locationName: string | null = null;
        if (character.current_location_id) {
            const loc = await this.db.prepare('SELECT name FROM locations WHERE id = ?').bind(character.current_location_id).first<{ name: string }>();
            locationName = loc?.name ?? null;
        }

        const missionStats = await this.db.prepare(
            `SELECT COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
              SUM(CASE WHEN status = 'COMPLETED' THEN credits_earned ELSE 0 END) as credits
       FROM character_missions WHERE character_id = ?`
        ).bind(characterId).first<{ completed: number; credits: number }>();

        const vehicleStats = await this.db.prepare(
            'SELECT SUM(total_distance_km) as total_distance FROM character_vehicles WHERE character_id = ?'
        ).bind(characterId).first<{ total_distance: number }>();

        const storyState = await this.db.prepare(
            'SELECT current_main_arc_id, story_progress_percent FROM character_story_state WHERE character_id = ?'
        ).bind(characterId).first<{ current_main_arc_id: string | null; story_progress_percent: number | null }>();

        let arcName: string | null = null;
        if (storyState?.current_main_arc_id) {
            const arc = await this.db.prepare('SELECT name FROM story_arcs WHERE id = ?').bind(storyState.current_main_arc_id).first<{ name: string }>();
            arcName = arc?.name ?? null;
        }

        const activeMission = await this.db.prepare(
            `SELECT md.name FROM character_missions cm JOIN mission_definitions md ON cm.mission_id = md.id
       WHERE cm.character_id = ? AND cm.status IN ('ACCEPTED', 'IN_PROGRESS') ORDER BY cm.accepted_at DESC LIMIT 1`
        ).bind(characterId).first<{ name: string }>();

        return {
            characterName: character.street_name || character.legal_name,
            characterTier: character.current_tier,
            characterTrack: character.track_name,
            currentLocationId: character.current_location_id,
            currentLocationName: locationName,
            storyProgress: storyState?.story_progress_percent ?? 0,
            mainArcName: arcName,
            mainMissionName: activeMission?.name ?? null,
            totalMissionsCompleted: missionStats?.completed ?? 0,
            totalCreditsEarned: missionStats?.credits ?? 0,
            totalDistanceKm: vehicleStats?.total_distance ?? 0,
            playtimeSeconds: character.total_playtime_seconds,
            difficulty: null,
        };
    }

    // ---------------------------------------------------------------------------
    // SAVE CRUD
    // ---------------------------------------------------------------------------

    async listSaves(userId: string) {
        const saves = await this.db.prepare('SELECT * FROM save_games WHERE player_id = ? ORDER BY updated_at DESC').bind(userId).all<SaveGame>();
        const manualSaves = saves.results.filter(s => s.save_type === 'MANUAL');
        const autoSaves = saves.results.filter(s => s.save_type === 'AUTO');
        const quicksave = saves.results.find(s => s.save_type === 'QUICK');
        return {
            saves: saves.results, count: saves.results.length,
            manualSaves, autoSaves, quicksave,
            limits: { maxManualSlots: MAX_MANUAL_SAVES, maxAutoSaves: MAX_AUTO_SAVES, usedManualSlots: manualSaves.length, usedAutoSlots: autoSaves.length },
        };
    }

    async getSave(saveId: string, userId: string): Promise<SaveGame | null> {
        return this.db.prepare('SELECT * FROM save_games WHERE id = ? AND player_id = ?').bind(saveId, userId).first<SaveGame>();
    }

    async createSave(userId: string, characterId: string, input: CreateSaveInput) {
        if (input.saveType === 'MANUAL') {
            const existing = await this.db.prepare("SELECT COUNT(*) as count FROM save_games WHERE player_id = ? AND save_type = 'MANUAL'").bind(userId).first<{ count: number }>();
            if (existing && existing.count >= MAX_MANUAL_SAVES) throw new Error(`Maximum ${MAX_MANUAL_SAVES} manual saves allowed. Delete an existing save first.`);
        }
        if (input.saveSlot) {
            const slot = await this.db.prepare("SELECT id FROM save_games WHERE player_id = ? AND save_slot = ? AND save_type = 'MANUAL'").bind(userId, input.saveSlot).first();
            if (slot) throw new Error(`Save slot ${input.saveSlot} is already in use. Delete it first or choose another slot.`);
        }

        const state = await this.captureCharacterState(characterId);
        const saveId = crypto.randomUUID();
        const saveData = JSON.stringify({ characterId, characterState: state, timestamp: Date.now() });
        const checksum = generateChecksum(saveData);
        const saveName = input.saveName ||
            (input.saveType === 'AUTO' ? `Auto Save - ${new Date().toLocaleDateString()}` :
                input.saveType === 'QUICK' ? 'Quicksave' : `Save ${input.saveSlot || 'New'}`);

        await this.db.prepare(
            `INSERT INTO save_games (
        id, player_id, created_at, updated_at,
        save_name, save_type, save_slot, is_auto_save, is_quicksave,
        character_id, character_name, character_tier, character_track,
        playtime_seconds, story_progress_percent, main_arc_name, main_mission_name,
        current_location_id, current_location_name,
        game_version, save_version, is_valid,
        total_missions_completed, total_credits_earned, total_distance_km,
        difficulty, data_checksum
      ) VALUES (?, ?, datetime('now'), datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            saveId, userId,
            saveName, input.saveType, input.saveSlot ?? null, input.saveType === 'AUTO' ? 1 : 0, input.saveType === 'QUICK' ? 1 : 0,
            characterId, state.characterName, state.characterTier, state.characterTrack,
            state.playtimeSeconds, state.storyProgress, state.mainArcName, state.mainMissionName,
            state.currentLocationId, state.currentLocationName,
            '0.1.0', 1, 1,
            state.totalMissionsCompleted, state.totalCreditsEarned, state.totalDistanceKm,
            state.difficulty, checksum
        ).run();

        // Serialize chunks
        try {
            const serializer = createSaveSerializer(this.db);
            const chunks = await serializer.serializeCharacterState(characterId, saveId);
            await serializer.storeChunks(chunks);
        } catch (err) { console.error('Failed to serialize save chunks:', err); }

        return this.db.prepare('SELECT * FROM save_games WHERE id = ?').bind(saveId).first<SaveGame>();
    }

    async deleteSave(saveId: string, userId: string): Promise<void> {
        const save = await this.getSave(saveId, userId);
        if (!save) throw new Error('Save not found');
        if (save.is_ironman) throw new Error('Cannot delete ironman saves');
        await this.db.prepare('DELETE FROM save_data_chunks WHERE save_id = ?').bind(saveId).run();
        await this.db.prepare('DELETE FROM checkpoints WHERE save_id = ?').bind(saveId).run();
        await this.db.prepare('DELETE FROM save_games WHERE id = ?').bind(saveId).run();
    }

    async renameSave(saveId: string, userId: string, newName: string): Promise<SaveGame | null> {
        const save = await this.getSave(saveId, userId);
        if (!save) throw new Error('Save not found');
        await this.db.prepare("UPDATE save_games SET save_name = ?, updated_at = datetime('now') WHERE id = ?").bind(newName, saveId).run();
        return this.db.prepare('SELECT * FROM save_games WHERE id = ?').bind(saveId).first<SaveGame>();
    }

    // ---------------------------------------------------------------------------
    // QUICKSAVE
    // ---------------------------------------------------------------------------

    async quickSave(userId: string, characterId: string) {
        await this.db.prepare("DELETE FROM save_games WHERE player_id = ? AND save_type = 'QUICK'").bind(userId).run();
        const state = await this.captureCharacterState(characterId);
        const saveId = crypto.randomUUID();
        const checksum = generateChecksum(JSON.stringify({ characterId, characterState: state, timestamp: Date.now() }));

        await this.db.prepare(
            `INSERT INTO save_games (
        id, player_id, created_at, updated_at,
        save_name, save_type, save_slot, is_auto_save, is_quicksave,
        character_id, character_name, character_tier, character_track,
        playtime_seconds, story_progress_percent, main_arc_name, main_mission_name,
        current_location_id, current_location_name,
        game_version, save_version, is_valid,
        total_missions_completed, total_credits_earned, total_distance_km,
        difficulty, data_checksum
      ) VALUES (?, ?, datetime('now'), datetime('now'), 'Quicksave', 'QUICK', ?, 0, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            saveId, userId, QUICKSAVE_SLOT,
            characterId, state.characterName, state.characterTier, state.characterTrack,
            state.playtimeSeconds, state.storyProgress, state.mainArcName, state.mainMissionName,
            state.currentLocationId, state.currentLocationName,
            '0.1.0', 1, 1,
            state.totalMissionsCompleted, state.totalCreditsEarned, state.totalDistanceKm,
            state.difficulty, checksum
        ).run();

        try {
            const serializer = createSaveSerializer(this.db);
            const chunks = await serializer.serializeCharacterState(characterId, saveId);
            await serializer.storeChunks(chunks);
        } catch (err) { console.error('Failed to serialize quicksave chunks:', err); }

        return this.db.prepare('SELECT * FROM save_games WHERE id = ?').bind(saveId).first<SaveGame>();
    }

    // ---------------------------------------------------------------------------
    // AUTO-SAVE
    // ---------------------------------------------------------------------------

    async autoSave(userId: string, characterId: string) {
        // Rotate old auto-saves
        const existing = await this.db.prepare("SELECT id FROM save_games WHERE player_id = ? AND save_type = 'AUTO' ORDER BY created_at DESC").bind(userId).all<{ id: string }>();
        if (existing.results.length >= MAX_AUTO_SAVES) {
            for (const old of existing.results.slice(MAX_AUTO_SAVES - 1)) {
                await this.db.prepare('DELETE FROM save_data_chunks WHERE save_id = ?').bind(old.id).run();
                await this.db.prepare('DELETE FROM checkpoints WHERE save_id = ?').bind(old.id).run();
                await this.db.prepare('DELETE FROM save_games WHERE id = ?').bind(old.id).run();
            }
        }

        const state = await this.captureCharacterState(characterId);
        const saveId = crypto.randomUUID();
        const checksum = generateChecksum(JSON.stringify({ characterId, characterState: state, timestamp: Date.now() }));

        await this.db.prepare(
            `INSERT INTO save_games (
        id, player_id, created_at, updated_at,
        save_name, save_type, is_auto_save, is_quicksave,
        character_id, character_name, character_tier, character_track,
        playtime_seconds, story_progress_percent, main_arc_name, main_mission_name,
        current_location_id, current_location_name,
        game_version, save_version, is_valid,
        total_missions_completed, total_credits_earned, total_distance_km,
        difficulty, data_checksum
      ) VALUES (?, ?, datetime('now'), datetime('now'), ?, 'AUTO', 1, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            saveId, userId, `Auto Save - ${new Date().toLocaleString()}`,
            characterId, state.characterName, state.characterTier, state.characterTrack,
            state.playtimeSeconds, state.storyProgress, state.mainArcName, state.mainMissionName,
            state.currentLocationId, state.currentLocationName,
            '0.1.0', 1, 1,
            state.totalMissionsCompleted, state.totalCreditsEarned, state.totalDistanceKm,
            state.difficulty, checksum
        ).run();

        try {
            const serializer = createSaveSerializer(this.db);
            const chunks = await serializer.serializeCharacterState(characterId, saveId);
            await serializer.storeChunks(chunks);
        } catch (err) { console.error('Failed to serialize auto-save chunks:', err); }

        return this.db.prepare('SELECT * FROM save_games WHERE id = ?').bind(saveId).first<SaveGame>();
    }

    // ---------------------------------------------------------------------------
    // CHUNKS & LOADING
    // ---------------------------------------------------------------------------

    async getSaveChunks(saveId: string, userId: string) {
        const save = await this.db.prepare('SELECT id FROM save_games WHERE id = ? AND player_id = ?').bind(saveId, userId).first();
        if (!save) throw new Error('Save not found');
        const serializer = createSaveSerializer(this.db);
        const chunks = await serializer.loadChunks(saveId);
        return chunks.map(chunk => ({
            id: chunk.id, chunk_type: chunk.chunk_type, data_version: chunk.data_version,
            compressed: chunk.compressed === 1, compressed_size_bytes: chunk.compressed_size_bytes,
            uncompressed_size_bytes: chunk.uncompressed_size_bytes, is_valid: chunk.is_valid === 1,
            load_priority: chunk.load_priority, checksum: chunk.checksum,
        }));
    }

    async loadSave(saveId: string, userId: string, characterId: string) {
        const save = await this.getSave(saveId, userId);
        if (!save) throw new Error('Save not found');
        const loader = createSaveLoader(this.db);
        const validation = await loader.validateSave(saveId);
        if (!validation.isValid) return { success: false, errors: validation.errors, warnings: validation.warnings };
        const loadResult = await loader.loadSave(saveId);
        if (!loadResult.success) return { success: false, errors: ['Failed to load save data'], warnings: loadResult.warnings };
        const { restored, changes } = await loader.restoreCharacterState(characterId, loadResult);
        if (!restored) return { success: false, errors: ['Failed to restore character state'], warnings: [] };
        return { success: true, saveId, characterId, loadedChunks: loadResult.loadedChunks, failedChunks: loadResult.failedChunks, restoredSections: changes, warnings: loadResult.warnings };
    }

    async validateSave(saveId: string, userId: string) {
        const save = await this.db.prepare('SELECT id FROM save_games WHERE id = ? AND player_id = ?').bind(saveId, userId).first();
        if (!save) throw new Error('Save not found');
        const loader = createSaveLoader(this.db);
        return loader.validateSave(saveId);
    }

    // ---------------------------------------------------------------------------
    // CHECKPOINTS
    // ---------------------------------------------------------------------------

    async createCheckpoint(userId: string, input: CheckpointInput) {
        const save = await this.db.prepare('SELECT id FROM save_games WHERE id = ? AND player_id = ?').bind(input.saveId, userId).first();
        if (!save) throw new Error('Save not found');
        const loader = createSaveLoader(this.db);
        await loader.cleanupExpiredCheckpoints();

        const count = await this.db.prepare('SELECT COUNT(*) as count FROM checkpoints WHERE save_id = ? AND is_persistent = 0').bind(input.saveId).first<{ count: number }>();
        if (count && count.count >= MAX_CHECKPOINTS_PER_SAVE && !input.isPersistent) {
            const oldest = await this.db.prepare('SELECT id FROM checkpoints WHERE save_id = ? AND is_persistent = 0 ORDER BY created_at ASC LIMIT 1').bind(input.saveId).first<{ id: string }>();
            if (oldest) {
                await this.db.prepare('DELETE FROM save_data_chunks WHERE chunk_type LIKE ?').bind(`CHECKPOINT_${oldest.id}_%`).run();
                await this.db.prepare('DELETE FROM checkpoints WHERE id = ?').bind(oldest.id).run();
            }
        }

        return loader.createCheckpoint({
            saveId: input.saveId, characterId: input.characterId,
            checkpointType: input.checkpointType, triggerSource: input.triggerSource,
            description: input.description, locationId: input.locationId,
            coordinates: input.coordinates, criticalState: input.criticalState,
            expiresAt: input.expiresInMinutes ? new Date(Date.now() + input.expiresInMinutes * 60 * 1000) : undefined,
            isPersistent: input.isPersistent,
        });
    }

    async listCheckpoints(saveId: string, userId: string) {
        const save = await this.db.prepare('SELECT id FROM save_games WHERE id = ? AND player_id = ?').bind(saveId, userId).first();
        if (!save) throw new Error('Save not found');
        const loader = createSaveLoader(this.db);
        return loader.listCheckpoints(saveId);
    }

    async restoreCheckpoint(saveId: string, checkpointId: string, characterId: string, userId: string) {
        const save = await this.db.prepare('SELECT id FROM save_games WHERE id = ? AND player_id = ?').bind(saveId, userId).first();
        if (!save) throw new Error('Save not found');
        const loader = createSaveLoader(this.db);
        return loader.restoreFromCheckpoint(checkpointId, characterId);
    }

    async deleteCheckpoint(saveId: string, checkpointId: string, userId: string) {
        const save = await this.db.prepare('SELECT id FROM save_games WHERE id = ? AND player_id = ?').bind(saveId, userId).first();
        if (!save) throw new Error('Save not found');
        const cp = await this.db.prepare('SELECT id FROM checkpoints WHERE id = ? AND save_id = ?').bind(checkpointId, saveId).first<{ id: string }>();
        if (!cp) throw new Error('Checkpoint not found');
        await this.db.prepare('DELETE FROM save_data_chunks WHERE chunk_type LIKE ?').bind(`CHECKPOINT_${checkpointId}_%`).run();
        await this.db.prepare('DELETE FROM checkpoints WHERE id = ?').bind(checkpointId).run();
    }

    async cleanupExpiredCheckpoints(userId: string) {
        const saves = await this.db.prepare('SELECT id FROM save_games WHERE player_id = ?').bind(userId).all<{ id: string }>();
        const loader = createSaveLoader(this.db);
        const totalCleaned = await loader.cleanupExpiredCheckpoints();
        return { expiredCheckpointsRemoved: totalCleaned, savesChecked: saves.results.length };
    }
}
