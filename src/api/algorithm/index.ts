/**
 * Algorithm API Routes
 *
 * Thin API layer delegating to AlgorithmService.
 *
 * Endpoints:
 * - GET /messages - Pending messages
 * - GET /history - Message history
 * - POST /messages/:id/respond - Respond to message
 * - GET /standing - Algorithm standing
 * - GET /directives - Active directives
 */

import { Hono } from 'hono';
import { authMiddleware, type AuthVariables } from '../../middleware/auth';
import { AlgorithmService, type ResponseVariant } from '../../services/algorithm';

type Bindings = { DB: D1Database; CACHE: KVNamespace; };
type Variables = AuthVariables;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
app.use('*', authMiddleware());

app.get('/messages', async (c) => {
  const characterId = c.get('characterId');
  if (!characterId) return c.json({ success: false, error: 'No active character' }, 400);
  const service = new AlgorithmService({ db: c.env.DB });
  return c.json({ success: true, messages: await service.getPendingMessages(characterId) });
});

app.get('/history', async (c) => {
  const characterId = c.get('characterId');
  if (!characterId) return c.json({ success: false, error: 'No active character' }, 400);
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const offset = parseInt(c.req.query('offset') || '0');
  const service = new AlgorithmService({ db: c.env.DB });
  const data = await service.getMessageHistory(characterId, limit, offset);
  return c.json({ success: true, ...data });
});

app.post('/messages/:id/respond', async (c) => {
  const characterId = c.get('characterId');
  if (!characterId) return c.json({ success: false, error: 'No active character' }, 400);
  const body = await c.req.json<{ variant: ResponseVariant; text?: string }>();
  const service = new AlgorithmService({ db: c.env.DB });
  try {
    const result = await service.respondToMessage(characterId, c.req.param('id'), body.variant, body.text);
    return c.json({ success: true, ...result });
  } catch (error: any) {
    const status = error.message === 'Message not found' ? 404 : error.message === 'Not your message' ? 403 : 400;
    return c.json({ success: false, error: error.message }, status);
  }
});

app.get('/standing', async (c) => {
  const characterId = c.get('characterId');
  if (!characterId) return c.json({ success: false, error: 'No active character' }, 400);
  const service = new AlgorithmService({ db: c.env.DB });
  const data = await service.getStanding(characterId);
  return c.json({ success: true, ...data });
});

app.get('/directives', async (c) => {
  const characterId = c.get('characterId');
  if (!characterId) return c.json({ success: false, error: 'No active character' }, 400);
  const service = new AlgorithmService({ db: c.env.DB });
  return c.json({ success: true, directives: await service.getDirectives(characterId) });
});

export const algorithmRoutes = app;
