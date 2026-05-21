import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { StoryService } from '../../services/story';
import type { CharacterEventHistory } from '../../services/story';
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { authMiddleware, requireCharacterMiddleware } from '../../middleware/auth';

const triggerEventSchema = z.object({
  choiceMade: z.string().optional(),
});

const completeEventSchema = z.object({
  characterId: z.string().min(1, 'characterId is required').optional(), // characterId is often from middleware
  outcome: z.string().optional(),
});

const setFlagSchema = z.object({
  flagCode: z.string().min(1, 'flagCode is required'),
  value: z.unknown().optional(),
  isPermanent: z.boolean().optional(),
});

const advanceProgressSchema = z.object({
  arcId: z.string().optional(),
  chapterId: z.string().optional(),
});

const completeArcSchema = z.object({
  arcId: z.string().min(1, 'arcId is required'),
  endingId: z.string().optional(),
});

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

// =============================================================================
// ROUTER SETUP
// =============================================================================

export const storyRoutes = new Hono<{ Bindings: Bindings }>();

// Apply auth middleware to all routes
storyRoutes.use('*', authMiddleware());

// -----------------------------------------------------------------------------
// STORY ARCS
// -----------------------------------------------------------------------------

/**
 * GET /story/arcs
 * List story arcs with filtering
 */
storyRoutes.get('/arcs', async (c) => {
  const service = new StoryService(c.env.DB);
  const { arc_type, is_main_story } = c.req.query();

  const arcs = await service.listArcs({
    type: arc_type,
    isMain: is_main_story !== undefined ? is_main_story === 'true' : undefined
  });

  return c.json({
    success: true,
    data: {
      arcs,
      count: arcs.length,
    },
  });
});

/**
 * GET /story/arcs/main
 * Get main story arc with its chapters
 */
storyRoutes.get('/arcs/main', async (c) => {
  const service = new StoryService(c.env.DB);
  const result = await service.getMainStoryArc();

  if (!result) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Main story arc not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: result,
  });
});

/**
 * GET /story/arcs/:id
 * Get specific arc with its chapters
 */
storyRoutes.get('/arcs/:id', async (c) => {
  const arcIdOrCode = c.req.param('id');
  const service = new StoryService(c.env.DB);
  const result = await service.getArc(arcIdOrCode);

  if (!result) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Story arc not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: result,
  });
});

// -----------------------------------------------------------------------------
// CHAPTERS
// -----------------------------------------------------------------------------

/**
 * GET /story/chapters
 * List chapters with filtering
 */
storyRoutes.get('/chapters', async (c) => {
  const service = new StoryService(c.env.DB);
  const { arc_id, has_point_of_no_return } = c.req.query();

  const chapters = await service.listChapters({
    arcId: arc_id,
    hasPONR: has_point_of_no_return !== undefined ? has_point_of_no_return === 'true' : undefined
  });

  return c.json({
    success: true,
    data: {
      chapters,
      count: chapters.length,
    },
  });
});

/**
 * GET /story/arcs/:arcId/chapters
 * Get chapters for an arc (legacy/alias route)
 */
storyRoutes.get('/arcs/:arcId/chapters', async (c) => {
  const arcId = c.req.param('arcId');
  const service = new StoryService(c.env.DB);
  const chapters = await service.listChapters({ arcId });

  return c.json({
    success: true,
    data: {
      chapters,
      count: chapters.length,
    },
  });
});

/**
 * GET /story/chapters/:id
 * Get specific chapter details
 */
storyRoutes.get('/chapters/:id', async (c) => {
  const chapterId = c.req.param('id');
  const service = new StoryService(c.env.DB);
  const result = await service.getChapter(chapterId);

  if (!result) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Chapter not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: result,
  });
});

// =============================================================================
// NARRATIVE EVENT ENDPOINTS
// =============================================================================

/**
 * GET /story/events
 * List narrative events
 */
storyRoutes.get('/events', async (c) => {
  const service = new StoryService(c.env.DB);
  const { event_type, min_priority, is_skippable, limit, offset } = c.req.query();

  const events = await service.listEvents({
    type: event_type,
    minPriority: min_priority ? parseInt(min_priority, 10) : undefined,
    isSkippable: is_skippable !== undefined ? is_skippable === 'true' : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
    offset: offset ? parseInt(offset, 10) : undefined,
  });

  return c.json({
    success: true,
    data: {
      events,
      count: events.length,
    },
  });
});

/**
 * GET /story/events/pending
 * Get pending narrative events for character
 */
storyRoutes.get('/events/pending', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId');
  const service = new StoryService(c.env.DB);

  const events = await service.getPendingEvents(characterId!);

  return c.json({
    success: true,
    data: {
      events,
      count: events.length,
    },
  });
});

/**
 * GET /story/events/:id
 * Get event details
 */
storyRoutes.get('/events/:id', async (c) => {
  const eventIdOrCode = c.req.param('id');
  const service = new StoryService(c.env.DB);
  const event = await service.getEvent(eventIdOrCode!);

  if (!event) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Narrative event not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: event,
  });
});

/**
 * POST /story/events/:id/trigger
 * Trigger a narrative event
 */
storyRoutes.post('/events/:id/trigger', requireCharacterMiddleware(), zValidator('json', triggerEventSchema), async (c) => {
  const eventId = c.req.param('id');
  const { choiceMade } = c.req.valid('json');
  const characterId = c.get('characterId');
  const service = new StoryService(c.env.DB);

  try {
    const result = await service.triggerEvent(characterId!, eventId!, choiceMade);
    return c.json({
      success: true,
      data: result,
    }, 201);
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'TRIGGER_FAILED', message: e.message }],
    }, 400);
  }
});

/**
 * POST /story/events/:id/complete
 * Mark event as completed
 */
storyRoutes.post('/events/:id/complete', zValidator('json', completeEventSchema), async (c) => {
  const eventId = c.req.param('id');
  const db = c.env.DB;
  const body = c.req.valid('json');

  // Find the triggered event
  const history = await db.prepare(`
    SELECT * FROM character_event_history
    WHERE character_id = ? AND event_id = ? AND completed_at IS NULL
    ORDER BY triggered_at DESC LIMIT 1
  `).bind(body.characterId, eventId).first<CharacterEventHistory>();

  if (!history) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'No pending event trigger found' }],
    }, 404);
  }

  const now = new Date().toISOString();

  await db.prepare(`
    UPDATE character_event_history
    SET completed_at = ?, outcome = ?
    WHERE id = ?
  `).bind(now, body.outcome || 'completed', history.id).run();

  return c.json({
    success: true,
    data: {
      message: 'Event completed',
      historyId: history.id,
      completedAt: now,
      outcome: body.outcome || 'completed',
    },
  });
});

// -----------------------------------------------------------------------------
// STORY FLAGS
// -----------------------------------------------------------------------------

/**
 * GET /story/flags
 * List flag definitions
 */
storyRoutes.get('/flags', async (c) => {
  const service = new StoryService(c.env.DB);
  const flags = await service.listFlagDefinitions();

  // Group by category for convenience
  const byCategory: Record<string, any[]> = {};
  for (const flag of flags) {
    const cat = flag.category || 'uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(flag);
  }

  return c.json({
    success: true,
    data: {
      flags,
      byCategory,
      count: flags.length,
    },
  });
});

/**
 * GET /story/flags/character
 * Get character's story flags
 */
storyRoutes.get('/flags/character', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId');
  const service = new StoryService(c.env.DB);
  const state = await service.getCharacterStoryState(characterId!);

  return c.json({
    success: true,
    data: {
      characterId,
      storyFlags: typeof state!.story_flags === 'string' ? JSON.parse(state!.story_flags) : state!.story_flags || {},
      permanentFlags: typeof state!.permanent_flags === 'string' ? JSON.parse(state!.permanent_flags) : state!.permanent_flags || {},
    },
  });
});

/**
 * POST /story/flags/character
 * Set a story flag
 */
storyRoutes.post('/flags/character', requireCharacterMiddleware(), zValidator('json', setFlagSchema), async (c) => {
  const { flagCode, value, isPermanent } = c.req.valid('json');
  const characterId = c.get('characterId');
  const service = new StoryService(c.env.DB);

  await service.setCharacterStoryFlag(characterId!, flagCode, value, isPermanent);

  return c.json({
    success: true,
    data: {
      message: 'Flag set successfully',
      flagCode,
      value,
    },
  });
});

// -----------------------------------------------------------------------------
// CHARACTER STORY STATE & PROGRESS
// -----------------------------------------------------------------------------

/**
 * GET /story/progress
 * Get character's story progress
 */
storyRoutes.get('/progress', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId');
  const service = new StoryService(c.env.DB);
  const state = await service.getCharacterStoryState(characterId!);

  return c.json({
    success: true,
    data: {
      characterId,
      hasStarted: !!state!.current_main_arc_id,
      progress: {
        currentArcId: state!.current_main_arc_id,
        currentChapterId: state!.current_main_chapter_id,
        completedArcs: typeof state!.completed_arcs === 'string' ? JSON.parse(state!.completed_arcs) : state!.completed_arcs || [],
        activeArcs: typeof state!.active_arcs === 'string' ? JSON.parse(state!.active_arcs) : state!.active_arcs || [],
        failedArcs: typeof state!.failed_arcs === 'string' ? JSON.parse(state!.failed_arcs) : state!.failed_arcs || [],
        completionPercent: state!.story_completion_percent,
        totalChoices: state!.total_story_choices,
        playtimeHours: state!.time_in_story_content_hours,
      },
    },
  });
});

/**
 * POST /story/progress/advance
 * Advance to next chapter or set specific progress
 */
storyRoutes.post('/progress/advance', requireCharacterMiddleware(), zValidator('json', advanceProgressSchema), async (c) => {
  const { arcId, chapterId } = c.req.valid('json');
  const characterId = c.get('characterId');
  const service = new StoryService(c.env.DB);

  const result = await service.advanceStoryProgress(characterId!, arcId, chapterId);

  return c.json({
    success: true,
    data: {
      message: 'Story progress updated',
      ...result
    },
  });
});

/**
 * POST /story/progress/complete-arc
 * Complete a story arc
 */
storyRoutes.post('/progress/complete-arc', requireCharacterMiddleware(), zValidator('json', completeArcSchema), async (c) => {
  const { arcId, endingId } = c.req.valid('json');
  const characterId = c.get('characterId');
  const service = new StoryService(c.env.DB);

  const result = await service.completeStoryArc(characterId!, arcId, endingId);

  return c.json({
    success: true,
    data: {
      message: 'Arc completed',
      ...result
    },
  });
});
