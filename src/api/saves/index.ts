/**
 * Surge Protocol - Save System Routes
 *
 * Thin API layer delegating to SaveService.
 *
 * Endpoints:
 * - GET /saves - List player's saves
 * - POST /saves - Create new save
 * - GET /saves/:id - Get save details
 * - DELETE /saves/:id - Delete save
 * - POST /saves/:id/rename - Rename save
 * - POST /saves/quicksave - Create a quicksave
 * - POST /saves/auto - Auto-save with rotation
 * - POST /saves/:id/load - Load a save
 * - POST /saves/:id/validate - Validate a save
 * - GET /saves/:id/chunks - Get save data chunks
 * - POST /saves/:id/checkpoints - Create checkpoint
 * - GET /saves/:id/checkpoints - List checkpoints
 * - POST /saves/:id/checkpoints/:checkpointId/restore - Restore checkpoint
 * - DELETE /saves/:id/checkpoints/:checkpointId - Delete checkpoint
 * - POST /saves/cleanup - Clean up expired checkpoints
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  authMiddleware,
  requireCharacterMiddleware,
  type AuthVariables,
} from '../../middleware/auth';
import { SaveService, MAX_MANUAL_SAVES } from '../../services/saves';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = { DB: D1Database; CACHE: KVNamespace; JWT_SECRET: string };

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const createSaveSchema = z.object({
  saveName: z.string().min(1).max(50).optional(),
  saveSlot: z.number().int().min(1).max(MAX_MANUAL_SAVES).optional(),
  saveType: z.enum(['MANUAL', 'AUTO', 'QUICK', 'CHECKPOINT']).default('MANUAL'),
});

const renameSchema = z.object({ newName: z.string().min(1).max(50) });

const checkpointSchema = z.object({
  checkpointType: z.enum(['MISSION_START', 'KEY_MOMENT', 'AUTO', 'MANUAL']),
  triggerSource: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
  locationId: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  criticalState: z.record(z.unknown()).optional(),
  expiresInMinutes: z.number().int().min(1).max(10080).optional(),
  isPersistent: z.boolean().optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

export const saveRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();
saveRoutes.use('*', authMiddleware());

// --- Save CRUD ---

saveRoutes.get('/', async (c) => {
  const service = new SaveService({ db: c.env.DB });
  return c.json({ success: true, data: await service.listSaves(c.get('userId')!) });
});

saveRoutes.post('/', requireCharacterMiddleware(), zValidator('json', createSaveSchema), async (c) => {
  const service = new SaveService({ db: c.env.DB });
  try {
    const save = await service.createSave(c.get('userId')!, c.get('characterId')!, c.req.valid('json'));
    return c.json({ success: true, data: { save, chunksCreated: true, message: 'Game saved successfully.' } }, 201);
  } catch (e: any) {
    return c.json({ success: false, errors: [{ code: e.message.includes('slot') ? 'SLOT_OCCUPIED' : 'MAX_SAVES_REACHED', message: e.message }] }, 422);
  }
});

saveRoutes.get('/:id', async (c) => {
  const service = new SaveService({ db: c.env.DB });
  const save = await service.getSave(c.req.param('id'), c.get('userId')!);
  if (!save) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Save not found' }] }, 404);
  return c.json({ success: true, data: { save } });
});

saveRoutes.delete('/:id', async (c) => {
  const service = new SaveService({ db: c.env.DB });
  try {
    await service.deleteSave(c.req.param('id'), c.get('userId')!);
    return c.json({ success: true, data: { deleted: true, message: 'Save deleted successfully.' } });
  } catch (e: any) {
    const code = e.message.includes('ironman') ? 'IRONMAN_PROTECTED' : 'NOT_FOUND';
    const status = e.message.includes('ironman') ? 422 : 404;
    return c.json({ success: false, errors: [{ code, message: e.message }] }, status);
  }
});

saveRoutes.post('/:id/rename', zValidator('json', renameSchema), async (c) => {
  const service = new SaveService({ db: c.env.DB });
  try {
    const save = await service.renameSave(c.req.param('id'), c.get('userId')!, c.req.valid('json').newName);
    return c.json({ success: true, data: { save, message: 'Save renamed successfully.' } });
  } catch (e: any) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: e.message }] }, 404);
  }
});

// --- Quicksave & Auto-save ---

saveRoutes.post('/quicksave', requireCharacterMiddleware(), async (c) => {
  const service = new SaveService({ db: c.env.DB });
  const save = await service.quickSave(c.get('userId')!, c.get('characterId')!);
  return c.json({ success: true, data: { save, chunksCreated: true, message: 'Quicksave created.' } }, 201);
});

saveRoutes.post('/auto', requireCharacterMiddleware(), async (c) => {
  const service = new SaveService({ db: c.env.DB });
  const save = await service.autoSave(c.get('userId')!, c.get('characterId')!);
  return c.json({ success: true, data: { save, chunksCreated: true, message: 'Auto-save created.' } }, 201);
});

// --- Chunks, Load & Validate ---

saveRoutes.get('/:id/chunks', async (c) => {
  const service = new SaveService({ db: c.env.DB });
  try {
    const chunks = await service.getSaveChunks(c.req.param('id'), c.get('userId')!);
    return c.json({ success: true, data: { saveId: c.req.param('id'), chunks, totalChunks: chunks.length, allValid: chunks.every(ch => ch.is_valid) } });
  } catch (e: any) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: e.message }] }, 404);
  }
});

saveRoutes.post('/:id/load', requireCharacterMiddleware(), async (c) => {
  const service = new SaveService({ db: c.env.DB });
  try {
    const result = await service.loadSave(c.req.param('id'), c.get('userId')!, c.get('characterId')!);
    if (!result.success) {
      const code = (result as any).errors?.[0]?.includes?.('validate') ? 'INVALID_SAVE' : 'LOAD_FAILED';
      return c.json({ success: false, errors: ((result as any).errors || []).map((e: string) => ({ code, message: e })), warnings: (result as any).warnings }, 422);
    }
    return c.json({ success: true, data: { loaded: true, ...result, message: 'Save loaded successfully.' } });
  } catch (e: any) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: e.message }] }, 404);
  }
});

saveRoutes.post('/:id/validate', async (c) => {
  const service = new SaveService({ db: c.env.DB });
  try {
    const validation = await service.validateSave(c.req.param('id'), c.get('userId')!);
    return c.json({ success: true, data: { saveId: c.req.param('id'), ...validation } });
  } catch (e: any) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: e.message }] }, 404);
  }
});

// --- Checkpoints ---

saveRoutes.post('/:id/checkpoints', requireCharacterMiddleware(), zValidator('json', checkpointSchema), async (c) => {
  const service = new SaveService({ db: c.env.DB });
  const body = c.req.valid('json');
  try {
    const checkpoint = await service.createCheckpoint(c.get('userId')!, {
      saveId: c.req.param('id'), characterId: c.get('characterId')!,
      ...body,
    });
    return c.json({
      success: true, data: {
        checkpoint: { id: checkpoint.id, checkpointType: checkpoint.checkpoint_type, triggerSource: checkpoint.trigger_source, description: checkpoint.description, createdAt: checkpoint.created_at },
        message: 'Checkpoint created.',
      }
    }, 201);
  } catch (e: any) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: e.message }] }, 404);
  }
});

saveRoutes.get('/:id/checkpoints', async (c) => {
  const service = new SaveService({ db: c.env.DB });
  try {
    const checkpoints = await service.listCheckpoints(c.req.param('id'), c.get('userId')!);
    return c.json({ success: true, data: { saveId: c.req.param('id'), checkpoints, count: checkpoints.length } });
  } catch (e: any) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: e.message }] }, 404);
  }
});

saveRoutes.post('/:id/checkpoints/:checkpointId/restore', requireCharacterMiddleware(), async (c) => {
  const service = new SaveService({ db: c.env.DB });
  try {
    const result = await service.restoreCheckpoint(c.req.param('id'), c.req.param('checkpointId'), c.get('characterId')!, c.get('userId')!);
    if (!result.success) return c.json({ success: false, errors: [{ code: 'RESTORE_FAILED', message: result.message }] }, 422);
    return c.json({ success: true, data: { restored: true, checkpointId: c.req.param('checkpointId'), message: result.message } });
  } catch (e: any) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: e.message }] }, 404);
  }
});

saveRoutes.delete('/:id/checkpoints/:checkpointId', async (c) => {
  const service = new SaveService({ db: c.env.DB });
  try {
    await service.deleteCheckpoint(c.req.param('id'), c.req.param('checkpointId'), c.get('userId')!);
    return c.json({ success: true, data: { deleted: true, checkpointId: c.req.param('checkpointId'), message: 'Checkpoint deleted.' } });
  } catch (e: any) {
    const code = e.message.includes('Checkpoint') ? 'CHECKPOINT_NOT_FOUND' : 'NOT_FOUND';
    return c.json({ success: false, errors: [{ code, message: e.message }] }, 404);
  }
});

saveRoutes.post('/cleanup', async (c) => {
  const service = new SaveService({ db: c.env.DB });
  const result = await service.cleanupExpiredCheckpoints(c.get('userId')!);
  return c.json({ success: true, data: { ...result, message: result.expiredCheckpointsRemoved > 0 ? `Cleaned up ${result.expiredCheckpointsRemoved} expired checkpoint(s).` : 'No expired checkpoints to clean up.' } });
});

export default saveRoutes;
