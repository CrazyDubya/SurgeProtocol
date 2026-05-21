/**
 * Surge Protocol - Dialogue System Routes
 *
 * Endpoints:
 *
 * Dialogue Trees:
 * - GET /dialogue/trees - List dialogue trees with filtering
 * - GET /dialogue/trees/:id - Get tree with all nodes
 * - GET /dialogue/trees/by-npc/:npcId - Get trees for an NPC
 * - GET /dialogue/trees/by-location/:locationId - Get trees at location
 *
 * Dialogue Traversal:
 * - POST /dialogue/start - Start a conversation
 * - GET /dialogue/state/:stateId - Get current conversation state
 * - POST /dialogue/respond - Choose a response option
 * - POST /dialogue/exit - End conversation
 *
 * Character History:
 * - GET /dialogue/history - Get character's dialogue history
 * - GET /dialogue/flags - Get dialogue flags for character
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AuthVariables } from '../../middleware/auth';
import { NarrativeService } from '../../services/narrative/engine';
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const startConversationSchema = z.object({
  characterId: z.string().min(1, 'characterId is required'),
  treeId: z.string().min(1, 'treeId is required'),
  npcInstanceId: z.string().optional(),
});

const respondSchema = z.object({
  conversationId: z.string().min(1, 'conversationId is required'),
  responseId: z.string().min(1, 'responseId is required'),
  skillCheckResult: z.enum(['success', 'failure']).optional(),
});

const exitConversationSchema = z.object({
  conversationId: z.string().min(1, 'conversationId is required'),
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
// ROUTES
// =============================================================================

export const dialogueRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// =============================================================================
// DIALOGUE TREE ENDPOINTS
// =============================================================================

/**
 * GET /dialogue/trees
 * List dialogue trees with filtering.
 */
dialogueRoutes.get('/trees', async (c) => {
  const narrative = new NarrativeService(c.env.DB, c.env.CACHE);

  const filters = {
    npcId: c.req.query('npcId'),
    locationId: c.req.query('locationId'),
    missionId: c.req.query('missionId'),
    hasSkillChecks: c.req.query('hasSkillChecks') === 'true',
    limit: parseInt(c.req.query('limit') || '50'),
    offset: parseInt(c.req.query('offset') || '0'),
  };

  const result = await narrative.listTrees(filters);

  return c.json({
    success: true,
    data: result,
  });
});

/**
 * GET /dialogue/trees/by-npc/:npcId
 * Get all dialogue trees for a specific NPC.
 */
dialogueRoutes.get('/trees/by-npc/:npcId', async (c) => {
  const narrative = new NarrativeService(c.env.DB, c.env.CACHE);
  const npcId = c.req.param('npcId');

  const result = await narrative.listTrees({ npcId, limit: 100 });

  // Basic NPC check can happen here or inside service if needed
  // For now, listing trees is sufficient

  return c.json({
    success: true,
    data: {
      trees: result.trees,
      count: result.trees.length,
    },
  });
});

/**
 * GET /dialogue/trees/by-location/:locationId
 * Get all dialogue trees at a specific location.
 */
dialogueRoutes.get('/trees/by-location/:locationId', async (c) => {
  const narrative = new NarrativeService(c.env.DB, c.env.CACHE);
  const locationId = c.req.param('locationId');

  const result = await narrative.listTrees({ locationId, limit: 100 });

  return c.json({
    success: true,
    data: {
      locationId,
      trees: result.trees,
      count: result.trees.length,
    },
  });
});

/**
 * GET /dialogue/trees/:id
 * Get a dialogue tree with all its nodes and responses.
 */
dialogueRoutes.get('/trees/:id', async (c) => {
  const narrative = new NarrativeService(c.env.DB, c.env.CACHE);
  const treeId = c.req.param('id');

  const details = await narrative.getTreeDetails(treeId);

  if (!details) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Dialogue tree not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: details,
  });
});

// =============================================================================
// CONVERSATION STATE ENDPOINTS
// =============================================================================

/**
 * POST /dialogue/start
 * Start a new conversation.
 */
dialogueRoutes.post('/start', zValidator('json', startConversationSchema), async (c) => {
  const narrative = new NarrativeService(c.env.DB, c.env.CACHE);
  const { characterId, treeId, npcInstanceId } = c.req.valid('json');

  try {
    const result = await narrative.startConversation(characterId, treeId, npcInstanceId);
    return c.json({
      success: true,
      data: result,
    }, 201);
  } catch (error: any) {
    // Map errors
    const status = error.message.includes('not found') ? 404 :
      error.message.includes('already has') ? 409 : 500;

    return c.json({
      success: false,
      errors: [{ code: 'START_FAILED', message: error.message }],
    }, status);
  }
});

/**
 * GET /dialogue/state/:stateId
 * Get current conversation state.
 */
dialogueRoutes.get('/state/:stateId', async (c) => {
  const narrative = new NarrativeService(c.env.DB, c.env.CACHE);
  const stateId = c.req.param('stateId');

  const state = await narrative.getConversationState(stateId);

  if (!state) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Conversation not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: state,
  });
});

/**
 * POST /dialogue/respond
 * Choose a response in a conversation.
 */
dialogueRoutes.post('/respond', zValidator('json', respondSchema), async (c) => {
  const narrative = new NarrativeService(c.env.DB, c.env.CACHE);
  const { conversationId, responseId, skillCheckResult } = c.req.valid('json');

  try {
    const result = await narrative.submitResponse(conversationId, responseId, skillCheckResult as 'success' | 'failure');
    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 400;
    return c.json({
      success: false,
      errors: [{ code: 'RESPONSE_FAILED', message: error.message }],
    }, status);
  }
});

/**
 * POST /dialogue/exit
 * End conversation early.
 */
dialogueRoutes.post('/exit', zValidator('json', exitConversationSchema), async (c) => {
  const narrative = new NarrativeService(c.env.DB, c.env.CACHE);
  const { conversationId } = c.req.valid('json');

  try {
    const result = await narrative.exitConversation(conversationId);
    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json({
      success: false,
      errors: [{ code: 'EXIT_FAILED', message: error.message }],
    }, 400);
  }
});

// =============================================================================
// CHARACTER HISTORY ENDPOINTS
// =============================================================================

/**
 * GET /dialogue/history
 * Get character dialogue history.
 */
dialogueRoutes.get('/history', async (c) => {
  const narrative = new NarrativeService(c.env.DB, c.env.CACHE);
  const characterId = c.req.query('characterId');
  const treeId = c.req.query('tree_id');

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId is required' }],
    }, 400);
  }

  const result = await narrative.getHistory(characterId, treeId);

  return c.json({
    success: true,
    data: result,
  });
});

/**
 * GET /dialogue/flags
 * Get character dialogue flags.
 */
dialogueRoutes.get('/flags', async (c) => {
  const narrative = new NarrativeService(c.env.DB, c.env.CACHE);
  const characterId = c.req.query('characterId');

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId is required' }],
    }, 400);
  }

  const result = await narrative.getFlags(characterId);

  return c.json({
    success: true,
    data: result,
  });
});
