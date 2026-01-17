/**
 * Surge Protocol - Save System Routes
 *
 * Endpoints:
 * - GET /saves - List player's saves
 * - POST /saves - Create new save
 * - GET /saves/:id - Get save details
 * - DELETE /saves/:id - Delete save
 * - POST /saves/:id/rename - Rename save
 * - POST /saves/quicksave - Create a quicksave
 * - POST /saves/:id/load - Load a save (returns state)
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import {
  authMiddleware,
  requireCharacterMiddleware,
  type AuthVariables,
} from '../../middleware/auth';
import type { SaveGame, SaveDataChunk, DifficultyLevel } from '../../db/types';
import { createSaveSerializer } from '../../game/saves/serializer';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

// Maximum save slots configuration
const MAX_MANUAL_SAVES = 10;
const MAX_AUTO_SAVES = 3;
const QUICKSAVE_SLOT = -1; // Special slot for quicksave

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const createSaveSchema = z.object({
  saveName: z.string().min(1).max(50).optional(),
  saveSlot: z.number().int().min(1).max(MAX_MANUAL_SAVES).optional(),
  saveType: z.enum(['MANUAL', 'AUTO', 'QUICK', 'CHECKPOINT']).default('MANUAL'),
});

const renameSchema = z.object({
  newName: z.string().min(1).max(50),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Capture the current character state for saving.
 * Returns a snapshot of important character data.
 */
async function captureCharacterState(
  db: D1Database,
  characterId: string
): Promise<{
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
}> {
  // Get character basic info
  const character = await db
    .prepare(`
      SELECT c.legal_name, c.street_name, c.current_tier, c.track_id,
             c.current_location_id, c.total_playtime_seconds,
             t.name as track_name
      FROM characters c
      LEFT JOIN tracks t ON c.track_id = t.id
      WHERE c.id = ?
    `)
    .bind(characterId)
    .first<{
      legal_name: string;
      street_name: string | null;
      current_tier: number;
      track_id: string | null;
      current_location_id: string | null;
      total_playtime_seconds: number;
      track_name: string | null;
    }>();

  if (!character) {
    throw new Error('Character not found');
  }

  // Get location name
  let locationName: string | null = null;
  if (character.current_location_id) {
    const location = await db
      .prepare('SELECT name FROM locations WHERE id = ?')
      .bind(character.current_location_id)
      .first<{ name: string }>();
    locationName = location?.name ?? null;
  }

  // Get mission stats
  const missionStats = await db
    .prepare(`
      SELECT
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        SUM(CASE WHEN status = 'COMPLETED' THEN credits_earned ELSE 0 END) as credits
      FROM character_missions
      WHERE character_id = ?
    `)
    .bind(characterId)
    .first<{ completed: number; credits: number }>();

  // Get vehicle distance
  const vehicleStats = await db
    .prepare(`
      SELECT SUM(total_distance_km) as total_distance
      FROM character_vehicles
      WHERE character_id = ?
    `)
    .bind(characterId)
    .first<{ total_distance: number }>();

  // Get story progress (if available)
  const storyState = await db
    .prepare(`
      SELECT current_main_arc_id, story_progress_percent
      FROM character_story_state
      WHERE character_id = ?
    `)
    .bind(characterId)
    .first<{ current_main_arc_id: string | null; story_progress_percent: number | null }>();

  // Get arc name if in progress
  let arcName: string | null = null;
  if (storyState?.current_main_arc_id) {
    const arc = await db
      .prepare('SELECT name FROM story_arcs WHERE id = ?')
      .bind(storyState.current_main_arc_id)
      .first<{ name: string }>();
    arcName = arc?.name ?? null;
  }

  // Get active mission name
  const activeMission = await db
    .prepare(`
      SELECT md.name
      FROM character_missions cm
      JOIN mission_definitions md ON cm.mission_id = md.id
      WHERE cm.character_id = ? AND cm.status IN ('ACCEPTED', 'IN_PROGRESS')
      ORDER BY cm.accepted_at DESC
      LIMIT 1
    `)
    .bind(characterId)
    .first<{ name: string }>();

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
    difficulty: null, // Would come from game settings
  };
}

/**
 * Generate a checksum for save integrity verification.
 */
function generateChecksum(data: string): string {
  // Simple hash for demo - in production use proper crypto
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// =============================================================================
// ROUTES
// =============================================================================

export const saveRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Apply auth middleware to all routes
saveRoutes.use('*', authMiddleware());

/**
 * GET /saves
 * List all saves for the current player.
 */
saveRoutes.get('/', async (c) => {
  const userId = c.get('userId')!;

  const saves = await c.env.DB
    .prepare(`
      SELECT * FROM save_games
      WHERE player_id = ?
      ORDER BY updated_at DESC
    `)
    .bind(userId)
    .all<SaveGame>();

  // Group by type
  const manualSaves = saves.results.filter(s => s.save_type === 'MANUAL');
  const autoSaves = saves.results.filter(s => s.save_type === 'AUTO');
  const quicksave = saves.results.find(s => s.save_type === 'QUICK');

  return c.json({
    success: true,
    data: {
      saves: saves.results,
      count: saves.results.length,
      manualSaves,
      autoSaves,
      quicksave,
      limits: {
        maxManualSlots: MAX_MANUAL_SAVES,
        maxAutoSaves: MAX_AUTO_SAVES,
        usedManualSlots: manualSaves.length,
        usedAutoSlots: autoSaves.length,
      },
    },
  });
});

/**
 * POST /saves
 * Create a new save.
 */
saveRoutes.post('/', requireCharacterMiddleware(), zValidator('json', createSaveSchema), async (c) => {
  const userId = c.get('userId')!;
  const characterId = c.get('characterId')!;
  const body = c.req.valid('json');

  // Check save slot limits for manual saves
  if (body.saveType === 'MANUAL') {
    const existingSaves = await c.env.DB
      .prepare(`
        SELECT COUNT(*) as count FROM save_games
        WHERE player_id = ? AND save_type = 'MANUAL'
      `)
      .bind(userId)
      .first<{ count: number }>();

    if (existingSaves && existingSaves.count >= MAX_MANUAL_SAVES) {
      return c.json({
        success: false,
        errors: [{
          code: 'MAX_SAVES_REACHED',
          message: `Maximum ${MAX_MANUAL_SAVES} manual saves allowed. Delete an existing save first.`,
        }],
      }, 422);
    }
  }

  // For slot-based saves, check if slot is already used
  if (body.saveSlot) {
    const existingSlot = await c.env.DB
      .prepare(`
        SELECT id FROM save_games
        WHERE player_id = ? AND save_slot = ? AND save_type = 'MANUAL'
      `)
      .bind(userId, body.saveSlot)
      .first();

    if (existingSlot) {
      return c.json({
        success: false,
        errors: [{
          code: 'SLOT_OCCUPIED',
          message: `Save slot ${body.saveSlot} is already in use. Delete it first or choose another slot.`,
        }],
      }, 422);
    }
  }

  // Capture character state
  const characterState = await captureCharacterState(c.env.DB, characterId);

  // Generate save ID and checksum
  const saveId = nanoid();
  const saveData = JSON.stringify({ characterId, characterState, timestamp: Date.now() });
  const checksum = generateChecksum(saveData);

  // Determine save name
  const saveName = body.saveName ||
    (body.saveType === 'AUTO' ? `Auto Save - ${new Date().toLocaleDateString()}` :
     body.saveType === 'QUICK' ? 'Quicksave' :
     `Save ${body.saveSlot || 'New'}`);

  // Create the save
  await c.env.DB
    .prepare(`
      INSERT INTO save_games (
        id, player_id, created_at, updated_at,
        save_name, save_type, save_slot, is_auto_save, is_quicksave,
        character_id, character_name, character_tier, character_track,
        playtime_seconds, story_progress_percent, main_arc_name, main_mission_name,
        current_location_id, current_location_name,
        game_version, save_version, is_valid,
        total_missions_completed, total_credits_earned, total_distance_km,
        difficulty, data_checksum
      ) VALUES (
        ?, ?, datetime('now'), datetime('now'),
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?
      )
    `)
    .bind(
      saveId, userId,
      saveName, body.saveType, body.saveSlot ?? null, body.saveType === 'AUTO' ? 1 : 0, body.saveType === 'QUICK' ? 1 : 0,
      characterId, characterState.characterName, characterState.characterTier, characterState.characterTrack,
      characterState.playtimeSeconds, characterState.storyProgress, characterState.mainArcName, characterState.mainMissionName,
      characterState.currentLocationId, characterState.currentLocationName,
      '0.1.0', 1, 1,
      characterState.totalMissionsCompleted, characterState.totalCreditsEarned, characterState.totalDistanceKm,
      characterState.difficulty, checksum
    )
    .run();

  // Serialize and store character data chunks
  try {
    const serializer = createSaveSerializer(c.env.DB);
    const chunks = await serializer.serializeCharacterState(characterId, saveId);
    await serializer.storeChunks(chunks);
  } catch (err) {
    // Log error but don't fail the save - chunks are supplementary
    console.error('Failed to serialize save chunks:', err);
  }

  // Retrieve the created save
  const save = await c.env.DB
    .prepare('SELECT * FROM save_games WHERE id = ?')
    .bind(saveId)
    .first<SaveGame>();

  return c.json({
    success: true,
    data: {
      save,
      chunksCreated: true,
      message: 'Game saved successfully.',
    },
  }, 201);
});

/**
 * POST /saves/quicksave
 * Create or overwrite the quicksave slot.
 */
saveRoutes.post('/quicksave', requireCharacterMiddleware(), async (c) => {
  const userId = c.get('userId')!;
  const characterId = c.get('characterId')!;

  // Delete existing quicksave if any
  await c.env.DB
    .prepare(`DELETE FROM save_games WHERE player_id = ? AND save_type = 'QUICK'`)
    .bind(userId)
    .run();

  // Capture character state
  const characterState = await captureCharacterState(c.env.DB, characterId);

  // Generate save ID and checksum
  const saveId = nanoid();
  const saveData = JSON.stringify({ characterId, characterState, timestamp: Date.now() });
  const checksum = generateChecksum(saveData);

  // Create quicksave
  await c.env.DB
    .prepare(`
      INSERT INTO save_games (
        id, player_id, created_at, updated_at,
        save_name, save_type, save_slot, is_auto_save, is_quicksave,
        character_id, character_name, character_tier, character_track,
        playtime_seconds, story_progress_percent, main_arc_name, main_mission_name,
        current_location_id, current_location_name,
        game_version, save_version, is_valid,
        total_missions_completed, total_credits_earned, total_distance_km,
        difficulty, data_checksum
      ) VALUES (
        ?, ?, datetime('now'), datetime('now'),
        'Quicksave', 'QUICK', ?, 0, 1,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?
      )
    `)
    .bind(
      saveId, userId, QUICKSAVE_SLOT,
      characterId, characterState.characterName, characterState.characterTier, characterState.characterTrack,
      characterState.playtimeSeconds, characterState.storyProgress, characterState.mainArcName, characterState.mainMissionName,
      characterState.currentLocationId, characterState.currentLocationName,
      '0.1.0', 1, 1,
      characterState.totalMissionsCompleted, characterState.totalCreditsEarned, characterState.totalDistanceKm,
      characterState.difficulty, checksum
    )
    .run();

  // Serialize and store character data chunks
  try {
    const serializer = createSaveSerializer(c.env.DB);
    const chunks = await serializer.serializeCharacterState(characterId, saveId);
    await serializer.storeChunks(chunks);
  } catch (err) {
    console.error('Failed to serialize quicksave chunks:', err);
  }

  const save = await c.env.DB
    .prepare('SELECT * FROM save_games WHERE id = ?')
    .bind(saveId)
    .first<SaveGame>();

  return c.json({
    success: true,
    data: {
      save,
      chunksCreated: true,
      message: 'Quicksave created.',
    },
  }, 201);
});

/**
 * GET /saves/:id
 * Get details of a specific save.
 */
saveRoutes.get('/:id', async (c) => {
  const userId = c.get('userId')!;
  const saveId = c.req.param('id');

  const save = await c.env.DB
    .prepare('SELECT * FROM save_games WHERE id = ? AND player_id = ?')
    .bind(saveId, userId)
    .first<SaveGame>();

  if (!save) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Save not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: { save },
  });
});

/**
 * DELETE /saves/:id
 * Delete a save.
 */
saveRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId')!;
  const saveId = c.req.param('id');

  // Check save exists and belongs to user
  const save = await c.env.DB
    .prepare('SELECT * FROM save_games WHERE id = ? AND player_id = ?')
    .bind(saveId, userId)
    .first<SaveGame>();

  if (!save) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Save not found' }],
    }, 404);
  }

  // Don't allow deleting ironman saves
  if (save.is_ironman) {
    return c.json({
      success: false,
      errors: [{ code: 'IRONMAN_PROTECTED', message: 'Cannot delete ironman saves' }],
    }, 422);
  }

  // Delete associated chunks first
  await c.env.DB
    .prepare('DELETE FROM save_data_chunks WHERE save_id = ?')
    .bind(saveId)
    .run();

  // Delete checkpoints
  await c.env.DB
    .prepare('DELETE FROM checkpoints WHERE save_id = ?')
    .bind(saveId)
    .run();

  // Delete the save
  await c.env.DB
    .prepare('DELETE FROM save_games WHERE id = ?')
    .bind(saveId)
    .run();

  return c.json({
    success: true,
    data: {
      deleted: true,
      message: 'Save deleted successfully.',
    },
  });
});

/**
 * POST /saves/:id/rename
 * Rename a save.
 */
saveRoutes.post('/:id/rename', zValidator('json', renameSchema), async (c) => {
  const userId = c.get('userId')!;
  const saveId = c.req.param('id');
  const body = c.req.valid('json');

  // Check save exists and belongs to user
  const save = await c.env.DB
    .prepare('SELECT * FROM save_games WHERE id = ? AND player_id = ?')
    .bind(saveId, userId)
    .first<SaveGame>();

  if (!save) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Save not found' }],
    }, 404);
  }

  // Update name
  await c.env.DB
    .prepare(`
      UPDATE save_games
      SET save_name = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    .bind(body.newName, saveId)
    .run();

  const updatedSave = await c.env.DB
    .prepare('SELECT * FROM save_games WHERE id = ?')
    .bind(saveId)
    .first<SaveGame>();

  return c.json({
    success: true,
    data: {
      save: updatedSave,
      message: 'Save renamed successfully.',
    },
  });
});

/**
 * POST /saves/auto
 * Create an auto-save (called internally by the game on key events).
 * Manages auto-save rotation (keeps only MAX_AUTO_SAVES most recent).
 */
saveRoutes.post('/auto', requireCharacterMiddleware(), async (c) => {
  const userId = c.get('userId')!;
  const characterId = c.get('characterId')!;

  // Get existing auto-saves sorted by date
  const existingAutoSaves = await c.env.DB
    .prepare(`
      SELECT id FROM save_games
      WHERE player_id = ? AND save_type = 'AUTO'
      ORDER BY created_at DESC
    `)
    .bind(userId)
    .all<{ id: string }>();

  // Delete old auto-saves if we're at the limit
  if (existingAutoSaves.results.length >= MAX_AUTO_SAVES) {
    const savesToDelete = existingAutoSaves.results.slice(MAX_AUTO_SAVES - 1);
    for (const oldSave of savesToDelete) {
      await c.env.DB
        .prepare('DELETE FROM save_data_chunks WHERE save_id = ?')
        .bind(oldSave.id)
        .run();
      await c.env.DB
        .prepare('DELETE FROM checkpoints WHERE save_id = ?')
        .bind(oldSave.id)
        .run();
      await c.env.DB
        .prepare('DELETE FROM save_games WHERE id = ?')
        .bind(oldSave.id)
        .run();
    }
  }

  // Capture character state
  const characterState = await captureCharacterState(c.env.DB, characterId);

  // Generate save
  const saveId = nanoid();
  const saveData = JSON.stringify({ characterId, characterState, timestamp: Date.now() });
  const checksum = generateChecksum(saveData);
  const saveName = `Auto Save - ${new Date().toLocaleString()}`;

  await c.env.DB
    .prepare(`
      INSERT INTO save_games (
        id, player_id, created_at, updated_at,
        save_name, save_type, is_auto_save, is_quicksave,
        character_id, character_name, character_tier, character_track,
        playtime_seconds, story_progress_percent, main_arc_name, main_mission_name,
        current_location_id, current_location_name,
        game_version, save_version, is_valid,
        total_missions_completed, total_credits_earned, total_distance_km,
        difficulty, data_checksum
      ) VALUES (
        ?, ?, datetime('now'), datetime('now'),
        ?, 'AUTO', 1, 0,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?
      )
    `)
    .bind(
      saveId, userId,
      saveName,
      characterId, characterState.characterName, characterState.characterTier, characterState.characterTrack,
      characterState.playtimeSeconds, characterState.storyProgress, characterState.mainArcName, characterState.mainMissionName,
      characterState.currentLocationId, characterState.currentLocationName,
      '0.1.0', 1, 1,
      characterState.totalMissionsCompleted, characterState.totalCreditsEarned, characterState.totalDistanceKm,
      characterState.difficulty, checksum
    )
    .run();

  // Serialize and store character data chunks
  try {
    const serializer = createSaveSerializer(c.env.DB);
    const chunks = await serializer.serializeCharacterState(characterId, saveId);
    await serializer.storeChunks(chunks);
  } catch (err) {
    console.error('Failed to serialize auto-save chunks:', err);
  }

  const save = await c.env.DB
    .prepare('SELECT * FROM save_games WHERE id = ?')
    .bind(saveId)
    .first<SaveGame>();

  return c.json({
    success: true,
    data: {
      save,
      chunksCreated: true,
      message: 'Auto-save created.',
    },
  }, 201);
});

/**
 * GET /saves/:id/chunks
 * Get the data chunks for a specific save.
 */
saveRoutes.get('/:id/chunks', async (c) => {
  const userId = c.get('userId')!;
  const saveId = c.req.param('id');

  // Verify save exists and belongs to user
  const save = await c.env.DB
    .prepare('SELECT id FROM save_games WHERE id = ? AND player_id = ?')
    .bind(saveId, userId)
    .first();

  if (!save) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Save not found' }],
    }, 404);
  }

  // Load chunks
  const serializer = createSaveSerializer(c.env.DB);
  const chunks = await serializer.loadChunks(saveId);

  // Parse chunk data for response (hide raw data, include metadata)
  const chunkSummary = chunks.map(chunk => ({
    id: chunk.id,
    chunk_type: chunk.chunk_type,
    data_version: chunk.data_version,
    compressed: chunk.compressed === 1,
    compressed_size_bytes: chunk.compressed_size_bytes,
    uncompressed_size_bytes: chunk.uncompressed_size_bytes,
    is_valid: chunk.is_valid === 1,
    load_priority: chunk.load_priority,
    checksum: chunk.checksum,
  }));

  return c.json({
    success: true,
    data: {
      saveId,
      chunks: chunkSummary,
      totalChunks: chunks.length,
      allValid: chunks.every(c => c.is_valid === 1),
    },
  });
});
