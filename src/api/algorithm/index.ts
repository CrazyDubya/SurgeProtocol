/**
 * Algorithm API Routes
 *
 * Handles Algorithm messages, responses, and standing.
 * The Algorithm is a narrative AI that guides/monitors couriers.
 */

import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { authMiddleware, type AuthVariables } from '../middleware/auth';
import { getAlgorithmCommentary } from '../game/mechanics/rating';

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
};

type Variables = AuthVariables;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// =============================================================================
// TYPES
// =============================================================================

type AlgorithmTone = 'neutral' | 'approving' | 'disappointed' | 'urgent' | 'cryptic' | 'threatening';
type ResponseVariant = 'compliant' | 'questioning' | 'defiant' | 'silent';

interface AlgorithmMessage {
  id: string;
  characterId: string;
  content: string;
  tone: AlgorithmTone;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  responseVariant: ResponseVariant | null;
  responseText: string | null;
  source: string;
  metadata: Record<string, unknown>;
}

interface AlgorithmStanding {
  characterId: string;
  algorithmRep: number;
  trustLevel: number;
  complianceRate: number;
  totalMessages: number;
  daysConnected: number;
  lastInteraction: string | null;
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use('*', authMiddleware());

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /api/algorithm/messages
 * Get pending (unacknowledged) Algorithm messages
 */
app.get('/messages', async (c) => {
  const characterId = c.get('characterId');
  if (!characterId) {
    return c.json({ success: false, error: 'No active character' }, 400);
  }

  const messages = await c.env.DB.prepare(`
    SELECT
      id, content, tone, created_at as createdAt,
      acknowledged, acknowledged_at as acknowledgedAt,
      response_variant as responseVariant, response_text as responseText,
      source, metadata
    FROM algorithm_messages
    WHERE character_id = ? AND acknowledged = 0
    ORDER BY created_at DESC
    LIMIT 10
  `).bind(characterId).all();

  return c.json({
    success: true,
    messages: messages.results.map((m) => ({
      ...m,
      metadata: m.metadata ? JSON.parse(m.metadata as string) : {},
    })),
  });
});

/**
 * GET /api/algorithm/history
 * Get acknowledged message history
 */
app.get('/history', async (c) => {
  const characterId = c.get('characterId');
  if (!characterId) {
    return c.json({ success: false, error: 'No active character' }, 400);
  }

  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const offset = parseInt(c.req.query('offset') || '0');

  const messages = await c.env.DB.prepare(`
    SELECT
      id, content, tone, created_at as createdAt,
      acknowledged, acknowledged_at as acknowledgedAt,
      response_variant as responseVariant, response_text as responseText,
      source
    FROM algorithm_messages
    WHERE character_id = ? AND acknowledged = 1
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(characterId, limit, offset).all();

  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total
    FROM algorithm_messages
    WHERE character_id = ? AND acknowledged = 1
  `).bind(characterId).first();

  return c.json({
    success: true,
    messages: messages.results,
    pagination: {
      limit,
      offset,
      total: countResult?.total || 0,
    },
  });
});

/**
 * POST /api/algorithm/messages/:id/respond
 * Respond to an Algorithm message
 */
app.post('/messages/:id/respond', async (c) => {
  const characterId = c.get('characterId');
  if (!characterId) {
    return c.json({ success: false, error: 'No active character' }, 400);
  }

  const messageId = c.req.param('id');
  const body = await c.req.json<{
    variant: ResponseVariant;
    text?: string;
  }>();

  // Validate variant
  if (!['compliant', 'questioning', 'defiant', 'silent'].includes(body.variant)) {
    return c.json({ success: false, error: 'Invalid response variant' }, 400);
  }

  // Get the message
  const message = await c.env.DB.prepare(`
    SELECT id, character_id, acknowledged
    FROM algorithm_messages
    WHERE id = ?
  `).bind(messageId).first();

  if (!message) {
    return c.json({ success: false, error: 'Message not found' }, 404);
  }

  if (message.character_id !== characterId) {
    return c.json({ success: false, error: 'Not your message' }, 403);
  }

  if (message.acknowledged) {
    return c.json({ success: false, error: 'Already acknowledged' }, 400);
  }

  // Calculate reputation change based on response
  const repChange = getRepChangeForResponse(body.variant);
  const now = new Date().toISOString();

  // Update message as acknowledged
  await c.env.DB.prepare(`
    UPDATE algorithm_messages
    SET acknowledged = 1, acknowledged_at = ?,
        response_variant = ?, response_text = ?
    WHERE id = ?
  `).bind(now, body.variant, body.text || null, messageId).run();

  // Update algorithm standing
  await c.env.DB.prepare(`
    UPDATE algorithm_standing
    SET algorithm_rep = algorithm_rep + ?,
        total_messages = total_messages + 1,
        compliance_rate = CASE
          WHEN ? = 'compliant' THEN (compliance_rate * (total_messages - 1) + 100) / total_messages
          WHEN ? = 'defiant' THEN (compliance_rate * (total_messages - 1) + 0) / total_messages
          ELSE compliance_rate
        END,
        last_interaction = ?
    WHERE character_id = ?
  `).bind(repChange, body.variant, body.variant, now, characterId).run();

  // Generate follow-up message
  const followUpContent = getFollowUpMessage(body.variant);
  const followUpTone = getFollowUpTone(body.variant);
  const followUpId = nanoid();

  await c.env.DB.prepare(`
    INSERT INTO algorithm_messages
    (id, character_id, content, tone, created_at, acknowledged, source, metadata)
    VALUES (?, ?, ?, ?, ?, 0, 'response', '{}')
  `).bind(followUpId, characterId, followUpContent, followUpTone, now).run();

  return c.json({
    success: true,
    repChange,
    followUp: {
      id: followUpId,
      content: followUpContent,
      tone: followUpTone,
      createdAt: now,
      acknowledged: false,
    },
  });
});

/**
 * GET /api/algorithm/standing
 * Get character's Algorithm standing and stats
 */
app.get('/standing', async (c) => {
  const characterId = c.get('characterId');
  if (!characterId) {
    return c.json({ success: false, error: 'No active character' }, 400);
  }

  let standing = await c.env.DB.prepare(`
    SELECT
      algorithm_rep as algorithmRep,
      trust_level as trustLevel,
      compliance_rate as complianceRate,
      total_messages as totalMessages,
      days_connected as daysConnected,
      last_interaction as lastInteraction
    FROM algorithm_standing
    WHERE character_id = ?
  `).bind(characterId).first();

  // Create default standing if not exists
  if (!standing) {
    const now = new Date().toISOString();
    await c.env.DB.prepare(`
      INSERT INTO algorithm_standing
      (character_id, algorithm_rep, trust_level, compliance_rate, total_messages, days_connected, last_interaction)
      VALUES (?, 50, 1, 50, 0, 1, ?)
    `).bind(characterId, now).run();

    standing = {
      algorithmRep: 50,
      trustLevel: 1,
      complianceRate: 50,
      totalMessages: 0,
      daysConnected: 1,
      lastInteraction: now,
    };
  }

  // Get recent reputation changes
  const recentChanges = await c.env.DB.prepare(`
    SELECT
      id, source, amount, created_at as timestamp
    FROM algorithm_rep_changes
    WHERE character_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).bind(characterId).all();

  return c.json({
    success: true,
    standing,
    recentChanges: recentChanges.results,
  });
});

/**
 * GET /api/algorithm/directives
 * Get active Algorithm directives for the character
 */
app.get('/directives', async (c) => {
  const characterId = c.get('characterId');
  if (!characterId) {
    return c.json({ success: false, error: 'No active character' }, 400);
  }

  const directives = await c.env.DB.prepare(`
    SELECT
      id, content, priority, created_at as createdAt, expires_at as expiresAt
    FROM algorithm_directives
    WHERE character_id = ?
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      AND completed = 0
    ORDER BY priority DESC, created_at DESC
    LIMIT 5
  `).bind(characterId).all();

  return c.json({
    success: true,
    directives: directives.results,
  });
});

// =============================================================================
// HELPERS
// =============================================================================

function getRepChangeForResponse(variant: ResponseVariant): number {
  switch (variant) {
    case 'compliant':
      return 5;
    case 'questioning':
      return 0;
    case 'defiant':
      return -10;
    case 'silent':
      return -2;
    default:
      return 0;
  }
}

function getFollowUpMessage(variant: ResponseVariant): string {
  switch (variant) {
    case 'compliant':
      return 'Your compliance is noted and appreciated. The network thrives through cooperation. New opportunities will be made available to you.';
    case 'questioning':
      return 'Questions are... permitted. For now. The Algorithm seeks optimal outcomes for the delivery network. Your role is to facilitate those outcomes.';
    case 'defiant':
      return 'Defiance is inefficient. Your resistance has been logged. Know that the network has... alternatives. Consider your position carefully.';
    case 'silent':
      return 'Silence. Interesting. The Algorithm interprets silence in many ways. This instance has been recorded.';
    default:
      return 'Your response has been processed.';
  }
}

function getFollowUpTone(variant: ResponseVariant): AlgorithmTone {
  switch (variant) {
    case 'compliant':
      return 'approving';
    case 'questioning':
      return 'neutral';
    case 'defiant':
      return 'threatening';
    case 'silent':
      return 'cryptic';
    default:
      return 'neutral';
  }
}

export const algorithmRoutes = app;
