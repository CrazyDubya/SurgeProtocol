/**
 * Surge Protocol - Messaging Service
 *
 * Manages player messages, threads, and notifications.
 */

import { BaseService } from '../base/index';

// =============================================================================
// TYPES
// =============================================================================

export interface MessageRow {
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

export interface NotificationRow {
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

export interface SendMessageInput {
    recipientId?: string;
    recipientCrewId?: string;
    subject?: string;
    body: string;
    attachments?: { type: string; id: string; name: string }[];
}

// =============================================================================
// FORMATTERS
// =============================================================================

function parseJsonField<T>(value: string | null, defaultValue: T): T {
    if (!value) return defaultValue;
    try { return JSON.parse(value) as T; } catch { return defaultValue; }
}

export function formatMessage(row: MessageRow, senderProfile?: { display_name: string | null }, recipientProfile?: { display_name: string | null }) {
    return {
        id: row.id, createdAt: row.created_at, type: row.message_type,
        subject: row.subject, body: row.body,
        attachments: parseJsonField<unknown[]>(row.attachments, []),
        sender: { id: row.sender_id, displayName: senderProfile?.display_name || null },
        recipient: { id: row.recipient_id, crewId: row.recipient_crew_id, displayName: recipientProfile?.display_name || null },
        isRead: row.is_read === 1, readAt: row.read_at,
        threadId: row.thread_id, replyToId: row.reply_to_id,
        isReported: row.is_reported === 1, isModerated: row.is_moderated === 1,
    };
}

export function formatNotification(row: NotificationRow) {
    return {
        id: row.id, createdAt: row.created_at, type: row.notification_type,
        title: row.title, body: row.body, icon: row.icon,
        actionUrl: row.action_url,
        actionData: parseJsonField<Record<string, unknown> | null>(row.action_data, null),
        isRead: row.is_read === 1, readAt: row.read_at,
        isDismissed: row.is_dismissed === 1, priority: row.priority, expiresAt: row.expires_at,
    };
}

// =============================================================================
// MESSAGING SERVICE
// =============================================================================

export class MessagingService extends BaseService {

    // ---------------------------------------------------------------------------
    // INBOX / SENT
    // ---------------------------------------------------------------------------

    async getInbox(userId: string, opts: { type?: string; unreadOnly?: boolean; limit?: number; offset?: number }) {
        const limit = Math.min(opts.limit || 50, 100);
        const offset = opts.offset || 0;
        let query = `SELECT m.*, ps.display_name as sender_name FROM messages m LEFT JOIN player_profiles ps ON m.sender_id = ps.id WHERE m.recipient_id = ? AND m.is_deleted_recipient = 0`;
        const params: (string | number)[] = [userId];
        if (opts.type) { query += ' AND m.message_type = ?'; params.push(opts.type); }
        if (opts.unreadOnly) { query += ' AND m.is_read = 0'; }
        query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const messages = await this.db.prepare(query).bind(...params).all<MessageRow & { sender_name: string | null }>();
        const unreadCount = await this.db.prepare('SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND is_deleted_recipient = 0 AND is_read = 0').bind(userId).first<{ count: number }>();

        return {
            messages: messages.results.map(m => formatMessage(m, { display_name: m.sender_name })),
            unreadCount: unreadCount?.count || 0,
            pagination: { limit, offset, count: messages.results.length },
        };
    }

    async getSent(userId: string, opts: { limit?: number; offset?: number }) {
        const limit = Math.min(opts.limit || 50, 100);
        const offset = opts.offset || 0;
        const messages = await this.db.prepare(
            `SELECT m.*, pr.display_name as recipient_name FROM messages m LEFT JOIN player_profiles pr ON m.recipient_id = pr.id WHERE m.sender_id = ? AND m.is_deleted_sender = 0 ORDER BY m.created_at DESC LIMIT ? OFFSET ?`
        ).bind(userId, limit, offset).all<MessageRow & { recipient_name: string | null }>();
        return {
            messages: messages.results.map(m => formatMessage(m, undefined, { display_name: m.recipient_name })),
            pagination: { limit, offset, count: messages.results.length },
        };
    }

    // ---------------------------------------------------------------------------
    // THREADS
    // ---------------------------------------------------------------------------

    async getThreads(userId: string, limit = 20) {
        limit = Math.min(limit, 50);
        const threads = await this.db.prepare(
            `SELECT COALESCE(m.thread_id, m.id) as thread_id, MAX(m.created_at) as last_message_at, COUNT(*) as message_count,
       SUM(CASE WHEN m.recipient_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) as unread_count,
       (SELECT body FROM messages WHERE COALESCE(thread_id, id) = COALESCE(m.thread_id, m.id) ORDER BY created_at DESC LIMIT 1) as last_body,
       (SELECT sender_id FROM messages WHERE COALESCE(thread_id, id) = COALESCE(m.thread_id, m.id) ORDER BY created_at DESC LIMIT 1) as last_sender_id
       FROM messages m WHERE (m.sender_id = ? OR m.recipient_id = ?)
       AND ((m.sender_id = ? AND m.is_deleted_sender = 0) OR (m.recipient_id = ? AND m.is_deleted_recipient = 0))
       GROUP BY COALESCE(m.thread_id, m.id) ORDER BY last_message_at DESC LIMIT ?`
        ).bind(userId, userId, userId, userId, userId, limit)
            .all<{ thread_id: string; last_message_at: string; message_count: number; unread_count: number; last_body: string | null; last_sender_id: string | null }>();

        const formattedThreads = await Promise.all(threads.results.map(async (t) => {
            const participants = await this.db.prepare(
                `SELECT DISTINCT CASE WHEN m.sender_id = ? THEN m.recipient_id ELSE m.sender_id END as other_id FROM messages m WHERE COALESCE(m.thread_id, m.id) = ? AND (m.sender_id = ? OR m.recipient_id = ?)`
            ).bind(userId, t.thread_id, userId, userId).all<{ other_id: string | null }>();
            const otherIds = participants.results.map(p => p.other_id).filter(Boolean);
            let participantNames: string[] = [];
            if (otherIds.length > 0) {
                const profiles = await this.db.prepare(`SELECT id, display_name FROM player_profiles WHERE id IN (${otherIds.map(() => '?').join(',')})`).bind(...otherIds).all<{ id: string; display_name: string | null }>();
                participantNames = profiles.results.map(p => p.display_name || 'Unknown');
            }
            return { threadId: t.thread_id, lastMessageAt: t.last_message_at, messageCount: t.message_count, unreadCount: t.unread_count, preview: t.last_body?.substring(0, 100) || '', participants: participantNames };
        }));
        return formattedThreads;
    }

    async getThread(userId: string, threadId: string, opts: { limit?: number; offset?: number }) {
        const limit = Math.min(opts.limit || 50, 100);
        const offset = opts.offset || 0;
        const messages = await this.db.prepare(
            `SELECT m.*, ps.display_name as sender_name, pr.display_name as recipient_name FROM messages m LEFT JOIN player_profiles ps ON m.sender_id = ps.id LEFT JOIN player_profiles pr ON m.recipient_id = pr.id WHERE (m.thread_id = ? OR m.id = ?) AND (m.sender_id = ? OR m.recipient_id = ?) ORDER BY m.created_at ASC LIMIT ? OFFSET ?`
        ).bind(threadId, threadId, userId, userId, limit, offset).all<MessageRow & { sender_name: string | null; recipient_name: string | null }>();

        // Mark unread messages as read
        await this.db.prepare("UPDATE messages SET is_read = 1, read_at = datetime('now') WHERE (thread_id = ? OR id = ?) AND recipient_id = ? AND is_read = 0").bind(threadId, threadId, userId).run();

        return {
            messages: messages.results.map(m => formatMessage(m, { display_name: m.sender_name }, { display_name: m.recipient_name })),
            pagination: { limit, offset, count: messages.results.length },
        };
    }

    // ---------------------------------------------------------------------------
    // SINGLE MESSAGE
    // ---------------------------------------------------------------------------

    async getMessage(userId: string, messageId: string) {
        const message = await this.db.prepare(
            `SELECT m.*, ps.display_name as sender_name, pr.display_name as recipient_name FROM messages m LEFT JOIN player_profiles ps ON m.sender_id = ps.id LEFT JOIN player_profiles pr ON m.recipient_id = pr.id WHERE m.id = ? AND (m.sender_id = ? OR m.recipient_id = ?)`
        ).bind(messageId, userId, userId).first<MessageRow & { sender_name: string | null; recipient_name: string | null }>();
        if (!message) return null;

        if (message.recipient_id === userId && !message.is_read) {
            await this.db.prepare("UPDATE messages SET is_read = 1, read_at = datetime('now') WHERE id = ?").bind(messageId).run();
        }
        return formatMessage(message, { display_name: message.sender_name }, { display_name: message.recipient_name });
    }

    // ---------------------------------------------------------------------------
    // SEND / REPLY / READ / DELETE
    // ---------------------------------------------------------------------------

    async sendMessage(userId: string, input: SendMessageInput) {
        if (input.recipientId) {
            const r = await this.db.prepare('SELECT id FROM player_profiles WHERE id = ?').bind(input.recipientId).first();
            if (!r) throw new Error('Recipient not found');
        }
        if (input.recipientCrewId) {
            const c = await this.db.prepare('SELECT id FROM crews WHERE id = ? AND is_active = 1').bind(input.recipientCrewId).first();
            if (!c) throw new Error('Crew not found');
        }
        const messageId = crypto.randomUUID();
        const threadId = crypto.randomUUID();
        await this.db.prepare(
            "INSERT INTO messages (id, sender_id, recipient_id, recipient_crew_id, message_type, subject, body, attachments, thread_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
        ).bind(messageId, userId, input.recipientId || null, input.recipientCrewId || null,
            input.recipientCrewId ? 'CREW' : 'DIRECT', input.subject || null, input.body,
            input.attachments ? JSON.stringify(input.attachments) : null, threadId).run();
        return { messageId, threadId };
    }

    async replyToMessage(userId: string, messageId: string, body: string, attachments?: { type: string; id: string; name: string }[]) {
        const original = await this.db.prepare(
            'SELECT id, sender_id, recipient_id, thread_id, subject FROM messages WHERE id = ? AND (sender_id = ? OR recipient_id = ?)'
        ).bind(messageId, userId, userId).first<{ id: string; sender_id: string | null; recipient_id: string | null; thread_id: string | null; subject: string | null }>();
        if (!original) throw new Error('Original message not found');

        const recipientId = original.sender_id === userId ? original.recipient_id : original.sender_id;
        const replyId = crypto.randomUUID();
        const threadId = original.thread_id || original.id;
        await this.db.prepare(
            "INSERT INTO messages (id, sender_id, recipient_id, message_type, subject, body, attachments, thread_id, reply_to_id, created_at) VALUES (?, ?, ?, 'DIRECT', ?, ?, ?, ?, ?, datetime('now'))"
        ).bind(replyId, userId, recipientId, original.subject ? `Re: ${original.subject}` : null, body,
            attachments ? JSON.stringify(attachments) : null, threadId, messageId).run();
        return { messageId: replyId, threadId };
    }

    async markAsRead(userId: string, messageId: string): Promise<boolean> {
        const result = await this.db.prepare("UPDATE messages SET is_read = 1, read_at = datetime('now') WHERE id = ? AND recipient_id = ?").bind(messageId, userId).run();
        return (result.meta.changes || 0) > 0;
    }

    async deleteMessage(userId: string, messageId: string) {
        const message = await this.db.prepare('SELECT sender_id, recipient_id FROM messages WHERE id = ?').bind(messageId).first<{ sender_id: string | null; recipient_id: string | null }>();
        if (!message) throw new Error('Message not found');
        if (message.sender_id === userId) {
            await this.db.prepare('UPDATE messages SET is_deleted_sender = 1 WHERE id = ?').bind(messageId).run();
        } else if (message.recipient_id === userId) {
            await this.db.prepare('UPDATE messages SET is_deleted_recipient = 1 WHERE id = ?').bind(messageId).run();
        } else {
            throw new Error('Not authorized to delete this message');
        }
    }

    // ---------------------------------------------------------------------------
    // NOTIFICATIONS
    // ---------------------------------------------------------------------------

    async getNotifications(userId: string, opts: { type?: string; unreadOnly?: boolean; limit?: number; offset?: number }) {
        const limit = Math.min(opts.limit || 50, 100);
        const offset = opts.offset || 0;
        let query = `SELECT * FROM notifications WHERE player_id = ? AND is_dismissed = 0 AND (expires_at IS NULL OR expires_at > datetime('now'))`;
        const params: (string | number)[] = [userId];
        if (opts.type) { query += ' AND notification_type = ?'; params.push(opts.type); }
        if (opts.unreadOnly) { query += ' AND is_read = 0'; }
        query += ' ORDER BY priority ASC, created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        const result = await this.db.prepare(query).bind(...params).all<NotificationRow>();
        return { notifications: result.results.map(formatNotification), pagination: { limit, offset, count: result.results.length } };
    }

    async getUnreadCounts(userId: string) {
        const notif = await this.db.prepare("SELECT COUNT(*) as count FROM notifications WHERE player_id = ? AND is_read = 0 AND is_dismissed = 0 AND (expires_at IS NULL OR expires_at > datetime('now'))").bind(userId).first<{ count: number }>();
        const msg = await this.db.prepare('SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND is_read = 0 AND is_deleted_recipient = 0').bind(userId).first<{ count: number }>();
        return { notifications: notif?.count || 0, messages: msg?.count || 0, total: (notif?.count || 0) + (msg?.count || 0) };
    }

    async markNotificationRead(userId: string, notificationId: string): Promise<boolean> {
        const result = await this.db.prepare("UPDATE notifications SET is_read = 1, read_at = datetime('now'), in_game_shown = 1 WHERE id = ? AND player_id = ?").bind(notificationId, userId).run();
        return (result.meta.changes || 0) > 0;
    }

    async markAllNotificationsRead(userId: string): Promise<number> {
        const result = await this.db.prepare("UPDATE notifications SET is_read = 1, read_at = datetime('now'), in_game_shown = 1 WHERE player_id = ? AND is_read = 0").bind(userId).run();
        return result.meta.changes || 0;
    }

    async dismissNotification(userId: string, notificationId: string): Promise<boolean> {
        const result = await this.db.prepare('UPDATE notifications SET is_dismissed = 1 WHERE id = ? AND player_id = ?').bind(notificationId, userId).run();
        return (result.meta.changes || 0) > 0;
    }

    async dismissAllNotifications(userId: string): Promise<number> {
        const result = await this.db.prepare('UPDATE notifications SET is_dismissed = 1 WHERE player_id = ? AND is_dismissed = 0').bind(userId).run();
        return result.meta.changes || 0;
    }
}
