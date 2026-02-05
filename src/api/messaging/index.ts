/**
 * Surge Protocol - Messaging & Notifications System Routes
 *
 * Endpoints for player messages and notifications.
 *
 * MESSAGE ENDPOINTS:
 * - GET /messaging/inbox - Get inbox messages
 * - GET /messaging/sent - Get sent messages
 * - GET /messaging/:id - Get message details
 * - POST /messaging/send - Send a message
 * - POST /messaging/:id/reply - Reply to a message
 * - PATCH /messaging/:id/read - Mark message as read
 * - DELETE /messaging/:id - Delete a message
 * - GET /messaging/threads - Get message threads
 * - GET /messaging/threads/:threadId - Get thread messages
 *
 * NOTIFICATION ENDPOINTS:
 * - GET /messaging/notifications - Get notifications
 * - GET /messaging/notifications/unread-count - Get unread count
 * - PATCH /messaging/notifications/:id/read - Mark notification as read
 * - PATCH /messaging/notifications/read-all - Mark all as read
 * - DELETE /messaging/notifications/:id - Dismiss notification
 * - DELETE /messaging/notifications/dismiss-all - Dismiss all
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  authMiddleware,
  type AuthVariables,
} from '../../middleware/auth';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

interface MessageRow {
  id: string;
  created_at: string;
  sender_id: string | null;
  recipient_id: string | null;
  recipient_crew_id: string | null;
  message_type: string;
  subject: string | null;
  body: string | null;
  attachments: string | null;
  is_read: number;
  read_at: string | null;
  is_deleted_sender: number;
  is_deleted_recipient: number;
  thread_id: string | null;
  reply_to_id: string | null;
  is_reported: number;
  is_moderated: number;
  moderation_action: string | null;
}

interface NotificationRow {
  id: string;
  player_id: string;
  created_at: string;
  notification_type: string | null;
  title: string | null;
  body: string | null;
  icon: string | null;
  action_url: string | null;
  action_data: string | null;
  is_read: number;
  read_at: string | null;
  is_dismissed: number;
  priority: number;
  expires_at: string | null;
  push_sent: number;
  email_sent: number;
  in_game_shown: number;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const sendMessageSchema = z.object({
  recipientId: z.string().optional(),
  recipientCrewId: z.string().optional(),
  subject: z.string().max(100).optional(),
  body: z.string().min(1).max(5000),
  attachments: z.array(z.object({
    type: z.string(),
    id: z.string(),
    name: z.string(),
  })).optional(),
}).refine(data => data.recipientId || data.recipientCrewId, {
  message: 'Either recipientId or recipientCrewId must be provided',
});

const replySchema = z.object({
  body: z.string().min(1).max(5000),
  attachments: z.array(z.object({
    type: z.string(),
    id: z.string(),
    name: z.string(),
  })).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function parseJsonField<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

function formatMessage(
  row: MessageRow,
  senderProfile?: { display_name: string | null },
  recipientProfile?: { display_name: string | null }
) {
  return {
    id: row.id,
    createdAt: row.created_at,
    type: row.message_type,
    subject: row.subject,
    body: row.body,
    attachments: parseJsonField<unknown[]>(row.attachments, []),
    sender: {
      id: row.sender_id,
      displayName: senderProfile?.display_name || null,
    },
    recipient: {
      id: row.recipient_id,
      crewId: row.recipient_crew_id,
      displayName: recipientProfile?.display_name || null,
    },
    isRead: row.is_read === 1,
    readAt: row.read_at,
    threadId: row.thread_id,
    replyToId: row.reply_to_id,
    isReported: row.is_reported === 1,
    isModerated: row.is_moderated === 1,
  };
}

function formatNotification(row: NotificationRow) {
  return {
    id: row.id,
    createdAt: row.created_at,
    type: row.notification_type,
    title: row.title,
    body: row.body,
    icon: row.icon,
    actionUrl: row.action_url,
    actionData: parseJsonField<Record<string, unknown> | null>(row.action_data, null),
    isRead: row.is_read === 1,
    readAt: row.read_at,
    isDismissed: row.is_dismissed === 1,
    priority: row.priority,
    expiresAt: row.expires_at,
  };
}

// =============================================================================
// ROUTES
// =============================================================================

export const messagingRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Apply auth middleware to all routes
messagingRoutes.use('*', authMiddleware());

// -----------------------------------------------------------------------------
// MESSAGE ENDPOINTS
// -----------------------------------------------------------------------------

/**
 * GET /messaging/inbox
 * Get inbox messages.
 */
messagingRoutes.get('/inbox', async (c) => {
  const userId = c.get('userId');
  const type = c.req.query('type');
  const unreadOnly = c.req.query('unread') === 'true';
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  let query = `
    SELECT m.*, ps.display_name as sender_name
    FROM messages m
    LEFT JOIN player_profiles ps ON m.sender_id = ps.id
    WHERE m.recipient_id = ? AND m.is_deleted_recipient = 0
  `;

  const params: (string | number)[] = [userId];

  if (type) {
    query += ' AND m.message_type = ?';
    params.push(type);
  }

  if (unreadOnly) {
    query += ' AND m.is_read = 0';
  }

  query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const messages = await c.env.DB
    .prepare(query)
    .bind(...params)
    .all<MessageRow & { sender_name: string | null }>();

  // Get unread count
  const unreadCount = await c.env.DB
    .prepare(
      `SELECT COUNT(*) as count FROM messages
       WHERE recipient_id = ? AND is_deleted_recipient = 0 AND is_read = 0`
    )
    .bind(userId)
    .first<{ count: number }>();

  return c.json({
    success: true,
    data: {
      messages: messages.results.map(m => formatMessage(m, { display_name: m.sender_name })),
      unreadCount: unreadCount?.count || 0,
      pagination: {
        limit,
        offset,
        count: messages.results.length,
      },
    },
  });
});

/**
 * GET /messaging/sent
 * Get sent messages.
 */
messagingRoutes.get('/sent', async (c) => {
  const userId = c.get('userId');
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  const messages = await c.env.DB
    .prepare(
      `SELECT m.*, pr.display_name as recipient_name
       FROM messages m
       LEFT JOIN player_profiles pr ON m.recipient_id = pr.id
       WHERE m.sender_id = ? AND m.is_deleted_sender = 0
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(userId, limit, offset)
    .all<MessageRow & { recipient_name: string | null }>();

  return c.json({
    success: true,
    data: {
      messages: messages.results.map(m => formatMessage(m, undefined, { display_name: m.recipient_name })),
      pagination: {
        limit,
        offset,
        count: messages.results.length,
      },
    },
  });
});

/**
 * GET /messaging/threads
 * Get message threads (grouped conversations).
 */
messagingRoutes.get('/threads', async (c) => {
  const userId = c.get('userId');
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 50);

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  // Get distinct threads with latest message
  const threads = await c.env.DB
    .prepare(
      `SELECT
         COALESCE(m.thread_id, m.id) as thread_id,
         MAX(m.created_at) as last_message_at,
         COUNT(*) as message_count,
         SUM(CASE WHEN m.recipient_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) as unread_count,
         (SELECT body FROM messages WHERE COALESCE(thread_id, id) = COALESCE(m.thread_id, m.id) ORDER BY created_at DESC LIMIT 1) as last_body,
         (SELECT sender_id FROM messages WHERE COALESCE(thread_id, id) = COALESCE(m.thread_id, m.id) ORDER BY created_at DESC LIMIT 1) as last_sender_id
       FROM messages m
       WHERE (m.sender_id = ? OR m.recipient_id = ?)
         AND ((m.sender_id = ? AND m.is_deleted_sender = 0) OR (m.recipient_id = ? AND m.is_deleted_recipient = 0))
       GROUP BY COALESCE(m.thread_id, m.id)
       ORDER BY last_message_at DESC
       LIMIT ?`
    )
    .bind(userId, userId, userId, userId, userId, limit)
    .all<{
      thread_id: string;
      last_message_at: string;
      message_count: number;
      unread_count: number;
      last_body: string | null;
      last_sender_id: string | null;
    }>();

  // Get participant info for each thread
  const formattedThreads = await Promise.all(
    threads.results.map(async (t) => {
      const participants = await c.env.DB
        .prepare(
          `SELECT DISTINCT
             CASE WHEN m.sender_id = ? THEN m.recipient_id ELSE m.sender_id END as other_id
           FROM messages m
           WHERE COALESCE(m.thread_id, m.id) = ?
             AND (m.sender_id = ? OR m.recipient_id = ?)`
        )
        .bind(userId, t.thread_id, userId, userId)
        .all<{ other_id: string | null }>();

      const otherIds = participants.results.map(p => p.other_id).filter(Boolean);
      let participantNames: string[] = [];

      if (otherIds.length > 0) {
        const profiles = await c.env.DB
          .prepare(
            `SELECT id, display_name FROM player_profiles WHERE id IN (${otherIds.map(() => '?').join(',')})`
          )
          .bind(...otherIds)
          .all<{ id: string; display_name: string | null }>();

        participantNames = profiles.results.map(p => p.display_name || 'Unknown');
      }

      return {
        threadId: t.thread_id,
        lastMessageAt: t.last_message_at,
        messageCount: t.message_count,
        unreadCount: t.unread_count,
        preview: t.last_body?.substring(0, 100) || '',
        participants: participantNames,
      };
    })
  );

  return c.json({
    success: true,
    data: {
      threads: formattedThreads,
      count: formattedThreads.length,
    },
  });
});

/**
 * GET /messaging/threads/:threadId
 * Get all messages in a thread.
 */
messagingRoutes.get('/threads/:threadId', async (c) => {
  const userId = c.get('userId');
  const threadId = c.req.param('threadId');
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  const messages = await c.env.DB
    .prepare(
      `SELECT m.*, ps.display_name as sender_name, pr.display_name as recipient_name
       FROM messages m
       LEFT JOIN player_profiles ps ON m.sender_id = ps.id
       LEFT JOIN player_profiles pr ON m.recipient_id = pr.id
       WHERE (m.thread_id = ? OR m.id = ?)
         AND (m.sender_id = ? OR m.recipient_id = ?)
       ORDER BY m.created_at ASC
       LIMIT ? OFFSET ?`
    )
    .bind(threadId, threadId, userId, userId, limit, offset)
    .all<MessageRow & { sender_name: string | null; recipient_name: string | null }>();

  // Mark unread messages as read
  await c.env.DB
    .prepare(
      `UPDATE messages SET is_read = 1, read_at = datetime('now')
       WHERE (thread_id = ? OR id = ?) AND recipient_id = ? AND is_read = 0`
    )
    .bind(threadId, threadId, userId)
    .run();

  return c.json({
    success: true,
    data: {
      threadId,
      messages: messages.results.map(m => formatMessage(
        m,
        { display_name: m.sender_name },
        { display_name: m.recipient_name }
      )),
      pagination: {
        limit,
        offset,
        count: messages.results.length,
      },
    },
  });
});

/**
 * GET /messaging/:id
 * Get a specific message.
 */
messagingRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const messageId = c.req.param('id');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  const message = await c.env.DB
    .prepare(
      `SELECT m.*, ps.display_name as sender_name, pr.display_name as recipient_name
       FROM messages m
       LEFT JOIN player_profiles ps ON m.sender_id = ps.id
       LEFT JOIN player_profiles pr ON m.recipient_id = pr.id
       WHERE m.id = ? AND (m.sender_id = ? OR m.recipient_id = ?)`
    )
    .bind(messageId, userId, userId)
    .first<MessageRow & { sender_name: string | null; recipient_name: string | null }>();

  if (!message) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Message not found' }],
    }, 404);
  }

  // Mark as read if recipient
  if (message.recipient_id === userId && !message.is_read) {
    await c.env.DB
      .prepare('UPDATE messages SET is_read = 1, read_at = datetime(\'now\') WHERE id = ?')
      .bind(messageId)
      .run();
  }

  return c.json({
    success: true,
    data: {
      message: formatMessage(
        message,
        { display_name: message.sender_name },
        { display_name: message.recipient_name }
      ),
    },
  });
});

/**
 * POST /messaging/send
 * Send a new message.
 */
messagingRoutes.post('/send', zValidator('json', sendMessageSchema), async (c) => {
  const userId = c.get('userId');
  const { recipientId, recipientCrewId, subject, body, attachments } = c.req.valid('json');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  // Validate recipient exists
  if (recipientId) {
    const recipient = await c.env.DB
      .prepare('SELECT id FROM player_profiles WHERE id = ?')
      .bind(recipientId)
      .first();

    if (!recipient) {
      return c.json({
        success: false,
        errors: [{ code: 'RECIPIENT_NOT_FOUND', message: 'Recipient not found' }],
      }, 404);
    }
  }

  if (recipientCrewId) {
    const crew = await c.env.DB
      .prepare('SELECT id FROM crews WHERE id = ? AND is_active = 1')
      .bind(recipientCrewId)
      .first();

    if (!crew) {
      return c.json({
        success: false,
        errors: [{ code: 'CREW_NOT_FOUND', message: 'Crew not found' }],
      }, 404);
    }
  }

  const { nanoid } = await import('nanoid');
  const messageId = nanoid();
  const threadId = nanoid();

  await c.env.DB
    .prepare(
      `INSERT INTO messages
       (id, sender_id, recipient_id, recipient_crew_id, message_type, subject, body, attachments, thread_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(
      messageId,
      userId,
      recipientId || null,
      recipientCrewId || null,
      recipientCrewId ? 'CREW' : 'DIRECT',
      subject || null,
      body,
      attachments ? JSON.stringify(attachments) : null,
      threadId
    )
    .run();

  return c.json({
    success: true,
    data: {
      messageId,
      threadId,
      message: 'Message sent successfully',
    },
  });
});

/**
 * POST /messaging/:id/reply
 * Reply to a message.
 */
messagingRoutes.post('/:id/reply', zValidator('json', replySchema), async (c) => {
  const userId = c.get('userId');
  const messageId = c.req.param('id');
  const { body, attachments } = c.req.valid('json');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  // Get original message
  const original = await c.env.DB
    .prepare(
      `SELECT id, sender_id, recipient_id, thread_id, subject
       FROM messages WHERE id = ? AND (sender_id = ? OR recipient_id = ?)`
    )
    .bind(messageId, userId, userId)
    .first<{
      id: string;
      sender_id: string | null;
      recipient_id: string | null;
      thread_id: string | null;
      subject: string | null;
    }>();

  if (!original) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Original message not found' }],
    }, 404);
  }

  // Determine recipient (other party in conversation)
  const recipientId = original.sender_id === userId ? original.recipient_id : original.sender_id;

  const { nanoid } = await import('nanoid');
  const replyId = nanoid();
  const threadId = original.thread_id || original.id;

  await c.env.DB
    .prepare(
      `INSERT INTO messages
       (id, sender_id, recipient_id, message_type, subject, body, attachments, thread_id, reply_to_id, created_at)
       VALUES (?, ?, ?, 'DIRECT', ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(
      replyId,
      userId,
      recipientId,
      original.subject ? `Re: ${original.subject}` : null,
      body,
      attachments ? JSON.stringify(attachments) : null,
      threadId,
      messageId
    )
    .run();

  return c.json({
    success: true,
    data: {
      messageId: replyId,
      threadId,
      message: 'Reply sent successfully',
    },
  });
});

/**
 * PATCH /messaging/:id/read
 * Mark message as read.
 */
messagingRoutes.patch('/:id/read', async (c) => {
  const userId = c.get('userId');
  const messageId = c.req.param('id');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  const result = await c.env.DB
    .prepare(
      `UPDATE messages SET is_read = 1, read_at = datetime('now')
       WHERE id = ? AND recipient_id = ?`
    )
    .bind(messageId, userId)
    .run();

  if (!result.meta.changes) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Message not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      message: 'Message marked as read',
    },
  });
});

/**
 * DELETE /messaging/:id
 * Delete a message (soft delete).
 */
messagingRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const messageId = c.req.param('id');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  // Check if user is sender or recipient
  const message = await c.env.DB
    .prepare('SELECT sender_id, recipient_id FROM messages WHERE id = ?')
    .bind(messageId)
    .first<{ sender_id: string | null; recipient_id: string | null }>();

  if (!message) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Message not found' }],
    }, 404);
  }

  if (message.sender_id === userId) {
    await c.env.DB
      .prepare('UPDATE messages SET is_deleted_sender = 1 WHERE id = ?')
      .bind(messageId)
      .run();
  } else if (message.recipient_id === userId) {
    await c.env.DB
      .prepare('UPDATE messages SET is_deleted_recipient = 1 WHERE id = ?')
      .bind(messageId)
      .run();
  } else {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PERMISSION', message: 'Not authorized to delete this message' }],
    }, 403);
  }

  return c.json({
    success: true,
    data: {
      message: 'Message deleted',
    },
  });
});

// -----------------------------------------------------------------------------
// NOTIFICATION ENDPOINTS
// -----------------------------------------------------------------------------

/**
 * GET /messaging/notifications
 * Get player's notifications.
 */
messagingRoutes.get('/notifications', async (c) => {
  const userId = c.get('userId');
  const type = c.req.query('type');
  const unreadOnly = c.req.query('unread') === 'true';
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  let query = `
    SELECT * FROM notifications
    WHERE player_id = ? AND is_dismissed = 0
      AND (expires_at IS NULL OR expires_at > datetime('now'))
  `;

  const params: (string | number)[] = [userId];

  if (type) {
    query += ' AND notification_type = ?';
    params.push(type);
  }

  if (unreadOnly) {
    query += ' AND is_read = 0';
  }

  query += ' ORDER BY priority ASC, created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const notifications = await c.env.DB
    .prepare(query)
    .bind(...params)
    .all<NotificationRow>();

  return c.json({
    success: true,
    data: {
      notifications: notifications.results.map(formatNotification),
      pagination: {
        limit,
        offset,
        count: notifications.results.length,
      },
    },
  });
});

/**
 * GET /messaging/notifications/unread-count
 * Get count of unread notifications.
 */
messagingRoutes.get('/notifications/unread-count', async (c) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  const result = await c.env.DB
    .prepare(
      `SELECT COUNT(*) as count FROM notifications
       WHERE player_id = ? AND is_read = 0 AND is_dismissed = 0
         AND (expires_at IS NULL OR expires_at > datetime('now'))`
    )
    .bind(userId)
    .first<{ count: number }>();

  // Also get unread message count
  const messageCount = await c.env.DB
    .prepare(
      `SELECT COUNT(*) as count FROM messages
       WHERE recipient_id = ? AND is_read = 0 AND is_deleted_recipient = 0`
    )
    .bind(userId)
    .first<{ count: number }>();

  return c.json({
    success: true,
    data: {
      notifications: result?.count || 0,
      messages: messageCount?.count || 0,
      total: (result?.count || 0) + (messageCount?.count || 0),
    },
  });
});

/**
 * PATCH /messaging/notifications/:id/read
 * Mark a notification as read.
 */
messagingRoutes.patch('/notifications/:id/read', async (c) => {
  const userId = c.get('userId');
  const notificationId = c.req.param('id');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  const result = await c.env.DB
    .prepare(
      `UPDATE notifications SET is_read = 1, read_at = datetime('now'), in_game_shown = 1
       WHERE id = ? AND player_id = ?`
    )
    .bind(notificationId, userId)
    .run();

  if (!result.meta.changes) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Notification not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      message: 'Notification marked as read',
    },
  });
});

/**
 * PATCH /messaging/notifications/read-all
 * Mark all notifications as read.
 */
messagingRoutes.patch('/notifications/read-all', async (c) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  const result = await c.env.DB
    .prepare(
      `UPDATE notifications SET is_read = 1, read_at = datetime('now'), in_game_shown = 1
       WHERE player_id = ? AND is_read = 0`
    )
    .bind(userId)
    .run();

  return c.json({
    success: true,
    data: {
      markedRead: result.meta.changes || 0,
      message: `Marked ${result.meta.changes || 0} notifications as read`,
    },
  });
});

/**
 * DELETE /messaging/notifications/:id
 * Dismiss a notification.
 */
messagingRoutes.delete('/notifications/:id', async (c) => {
  const userId = c.get('userId');
  const notificationId = c.req.param('id');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  const result = await c.env.DB
    .prepare('UPDATE notifications SET is_dismissed = 1 WHERE id = ? AND player_id = ?')
    .bind(notificationId, userId)
    .run();

  if (!result.meta.changes) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Notification not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      message: 'Notification dismissed',
    },
  });
});

/**
 * DELETE /messaging/notifications/dismiss-all
 * Dismiss all notifications.
 */
messagingRoutes.delete('/notifications/dismiss-all', async (c) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  const result = await c.env.DB
    .prepare('UPDATE notifications SET is_dismissed = 1 WHERE player_id = ? AND is_dismissed = 0')
    .bind(userId)
    .run();

  return c.json({
    success: true,
    data: {
      dismissed: result.meta.changes || 0,
      message: `Dismissed ${result.meta.changes || 0} notifications`,
    },
  });
});
