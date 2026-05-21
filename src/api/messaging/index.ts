/**
 * Surge Protocol - Messaging & Notifications Routes
 *
 * Thin API layer delegating to MessagingService.
 *
 * MESSAGE ENDPOINTS:
 * - GET /inbox, /sent, /threads, /threads/:threadId, /:id
 * - POST /send, /:id/reply
 * - PATCH /:id/read
 * - DELETE /:id
 *
 * NOTIFICATION ENDPOINTS:
 * - GET /notifications, /notifications/unread-count
 * - PATCH /notifications/:id/read, /notifications/read-all
 * - DELETE /notifications/:id, /notifications/dismiss-all
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, type AuthVariables } from '../../middleware/auth';
import { MessagingService } from '../../services/messaging';

type Bindings = { DB: D1Database; CACHE: KVNamespace; JWT_SECRET: string };

const sendMessageSchema = z.object({
  recipientId: z.string().optional(),
  recipientCrewId: z.string().optional(),
  subject: z.string().max(100).optional(),
  body: z.string().min(1).max(5000),
  attachments: z.array(z.object({ type: z.string(), id: z.string(), name: z.string() })).optional(),
}).refine(data => data.recipientId || data.recipientCrewId, { message: 'Either recipientId or recipientCrewId must be provided' });

const replySchema = z.object({
  body: z.string().min(1).max(5000),
  attachments: z.array(z.object({ type: z.string(), id: z.string(), name: z.string() })).optional(),
});

export const messagingRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();
messagingRoutes.use('*', authMiddleware());

// --- Messages ---

messagingRoutes.get('/inbox', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new MessagingService({ db: c.env.DB });
  return c.json({ success: true, data: await service.getInbox(userId, { type: c.req.query('type'), unreadOnly: c.req.query('unread') === 'true', limit: parseInt(c.req.query('limit') || '50'), offset: parseInt(c.req.query('offset') || '0') }) });
});

messagingRoutes.get('/sent', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new MessagingService({ db: c.env.DB });
  return c.json({ success: true, data: await service.getSent(userId, { limit: parseInt(c.req.query('limit') || '50'), offset: parseInt(c.req.query('offset') || '0') }) });
});

messagingRoutes.get('/threads', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new MessagingService({ db: c.env.DB });
  const threads = await service.getThreads(userId, parseInt(c.req.query('limit') || '20'));
  return c.json({ success: true, data: { threads, count: threads.length } });
});

messagingRoutes.get('/threads/:threadId', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new MessagingService({ db: c.env.DB });
  const data = await service.getThread(userId, c.req.param('threadId'), { limit: parseInt(c.req.query('limit') || '50'), offset: parseInt(c.req.query('offset') || '0') });
  return c.json({ success: true, data: { threadId: c.req.param('threadId'), ...data } });
});

messagingRoutes.post('/send', zValidator('json', sendMessageSchema), async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new MessagingService({ db: c.env.DB });
  try {
    const result = await service.sendMessage(userId, c.req.valid('json'));
    return c.json({ success: true, data: { ...result, message: 'Message sent successfully' } });
  } catch (e: any) {
    const code = e.message.includes('Crew') ? 'CREW_NOT_FOUND' : 'RECIPIENT_NOT_FOUND';
    return c.json({ success: false, errors: [{ code, message: e.message }] }, 404);
  }
});

messagingRoutes.post('/:id/reply', zValidator('json', replySchema), async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new MessagingService({ db: c.env.DB });
  try {
    const result = await service.replyToMessage(userId, c.req.param('id'), c.req.valid('json').body, c.req.valid('json').attachments);
    return c.json({ success: true, data: { ...result, message: 'Reply sent successfully' } });
  } catch (e: any) {
    return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: e.message }] }, 404);
  }
});

messagingRoutes.patch('/:id/read', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new MessagingService({ db: c.env.DB });
  if (!await service.markAsRead(userId, c.req.param('id'))) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Message not found' }] }, 404);
  return c.json({ success: true, data: { message: 'Message marked as read' } });
});

messagingRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new MessagingService({ db: c.env.DB });
  try {
    await service.deleteMessage(userId, c.req.param('id'));
    return c.json({ success: true, data: { message: 'Message deleted' } });
  } catch (e: any) {
    const code = e.message.includes('authorized') ? 'NO_PERMISSION' : 'NOT_FOUND';
    const status = e.message.includes('authorized') ? 403 : 404;
    return c.json({ success: false, errors: [{ code, message: e.message }] }, status);
  }
});

messagingRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new MessagingService({ db: c.env.DB });
  const msg = await service.getMessage(userId, c.req.param('id'));
  if (!msg) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Message not found' }] }, 404);
  return c.json({ success: true, data: { message: msg } });
});

// --- Notifications ---

messagingRoutes.get('/notifications', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new MessagingService({ db: c.env.DB });
  return c.json({ success: true, data: await service.getNotifications(userId, { type: c.req.query('type'), unreadOnly: c.req.query('unread') === 'true', limit: parseInt(c.req.query('limit') || '50'), offset: parseInt(c.req.query('offset') || '0') }) });
});

messagingRoutes.get('/notifications/unread-count', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new MessagingService({ db: c.env.DB });
  return c.json({ success: true, data: await service.getUnreadCounts(userId) });
});

messagingRoutes.patch('/notifications/:id/read', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new MessagingService({ db: c.env.DB });
  if (!await service.markNotificationRead(userId, c.req.param('id'))) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Notification not found' }] }, 404);
  return c.json({ success: true, data: { message: 'Notification marked as read' } });
});

messagingRoutes.patch('/notifications/read-all', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new MessagingService({ db: c.env.DB });
  const count = await service.markAllNotificationsRead(userId);
  return c.json({ success: true, data: { markedRead: count, message: `Marked ${count} notifications as read` } });
});

messagingRoutes.delete('/notifications/:id', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new MessagingService({ db: c.env.DB });
  if (!await service.dismissNotification(userId, c.req.param('id'))) return c.json({ success: false, errors: [{ code: 'NOT_FOUND', message: 'Notification not found' }] }, 404);
  return c.json({ success: true, data: { message: 'Notification dismissed' } });
});

messagingRoutes.delete('/notifications/dismiss-all', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ success: false, errors: [{ code: 'NO_USER', message: 'Authentication required' }] }, 401);
  const service = new MessagingService({ db: c.env.DB });
  const count = await service.dismissAllNotifications(userId);
  return c.json({ success: true, data: { dismissed: count, message: `Dismissed ${count} notifications` } });
});

export default messagingRoutes;
