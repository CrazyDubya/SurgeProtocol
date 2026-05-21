/**
 * Surge Protocol - Algorithm Service
 *
 * Manages the Algorithm narrative AI: messages, responses, standing, and directives.
 */

import { BaseService } from '../base/index';
import { getAlgorithmCommentary, type RatingChange } from '../../game/mechanics/rating';

// =============================================================================
// TYPES
// =============================================================================

export type AlgorithmTone = 'neutral' | 'approving' | 'disappointed' | 'urgent' | 'cryptic' | 'threatening';
export type ResponseVariant = 'compliant' | 'questioning' | 'defiant' | 'silent';

// =============================================================================
// HELPERS
// =============================================================================

function getRepChangeForResponse(variant: ResponseVariant): number {
    switch (variant) { case 'compliant': return 5; case 'questioning': return 0; case 'defiant': return -10; case 'silent': return -2; default: return 0; }
}

function getFollowUpMessage(variant: ResponseVariant): string {
    switch (variant) {
        case 'compliant': return 'Your compliance is noted and appreciated. The network thrives through cooperation. New opportunities will be made available to you.';
        case 'questioning': return 'Questions are... permitted. For now. The Algorithm seeks optimal outcomes for the delivery network. Your role is to facilitate those outcomes.';
        case 'defiant': return 'Defiance is inefficient. Your resistance has been logged. Know that the network has... alternatives. Consider your position carefully.';
        case 'silent': return 'Silence. Interesting. The Algorithm interprets silence in many ways. This instance has been recorded.';
        default: return 'Your response has been processed.';
    }
}

function getFollowUpTone(variant: ResponseVariant): AlgorithmTone {
    switch (variant) { case 'compliant': return 'approving'; case 'questioning': return 'neutral'; case 'defiant': return 'threatening'; case 'silent': return 'cryptic'; default: return 'neutral'; }
}

// =============================================================================
// ALGORITHM SERVICE
// =============================================================================

export class AlgorithmService extends BaseService {

    /** Get unacknowledged messages for the character. */
    async getPendingMessages(characterId: string) {
        const messages = await this.db.prepare(
            `SELECT id, content, tone, created_at as createdAt, acknowledged, acknowledged_at as acknowledgedAt, response_variant as responseVariant, response_text as responseText, source, metadata FROM algorithm_messages WHERE character_id = ? AND acknowledged = 0 ORDER BY created_at DESC LIMIT 10`
        ).bind(characterId).all();

        return messages.results.map(m => ({ ...m, metadata: m.metadata ? JSON.parse(m.metadata as string) : {} }));
    }

    /** Get acknowledged message history with pagination. */
    async getMessageHistory(characterId: string, limit: number = 20, offset: number = 0) {
        const messages = await this.db.prepare(
            `SELECT id, content, tone, created_at as createdAt, acknowledged, acknowledged_at as acknowledgedAt, response_variant as responseVariant, response_text as responseText, source FROM algorithm_messages WHERE character_id = ? AND acknowledged = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?`
        ).bind(characterId, limit, offset).all();

        const countResult = await this.db.prepare(
            'SELECT COUNT(*) as total FROM algorithm_messages WHERE character_id = ? AND acknowledged = 1'
        ).bind(characterId).first<{ total: number }>();

        return { messages: messages.results, pagination: { limit, offset, total: countResult?.total || 0 } };
    }

    /** Respond to an Algorithm message. Returns rep change and follow-up message. */
    async respondToMessage(characterId: string, messageId: string, variant: ResponseVariant, text?: string) {
        // Validate variant
        if (!['compliant', 'questioning', 'defiant', 'silent'].includes(variant)) {
            throw new Error('Invalid response variant');
        }

        const message = await this.db.prepare('SELECT id, character_id, acknowledged FROM algorithm_messages WHERE id = ?').bind(messageId).first();
        if (!message) throw new Error('Message not found');
        if (message.character_id !== characterId) throw new Error('Not your message');
        if (message.acknowledged) throw new Error('Already acknowledged');

        const repChange = getRepChangeForResponse(variant);
        const now = new Date().toISOString();

        await this.db.prepare('UPDATE algorithm_messages SET acknowledged = 1, acknowledged_at = ?, response_variant = ?, response_text = ? WHERE id = ?').bind(now, variant, text || null, messageId).run();

        await this.db.prepare(
            `UPDATE algorithm_standing SET algorithm_rep = algorithm_rep + ?, total_messages = total_messages + 1, compliance_rate = CASE WHEN ? = 'compliant' THEN (compliance_rate * total_messages + 100) / (total_messages + 1) WHEN ? = 'defiant' THEN (compliance_rate * total_messages + 0) / (total_messages + 1) ELSE (compliance_rate * total_messages + 50) / (total_messages + 1) END, last_interaction = ? WHERE character_id = ?`
        ).bind(repChange, variant, variant, now, characterId).run();

        await this.db.prepare('INSERT INTO algorithm_rep_changes (id, character_id, source, amount, created_at) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), characterId, `response:${variant}`, repChange, now).run();

        const followUpContent = getFollowUpMessage(variant);
        const followUpTone = getFollowUpTone(variant);
        const followUpId = crypto.randomUUID();
        await this.db.prepare(`INSERT INTO algorithm_messages (id, character_id, content, tone, created_at, acknowledged, source, metadata) VALUES (?, ?, ?, ?, ?, 0, 'response', '{}')`).bind(followUpId, characterId, followUpContent, followUpTone, now).run();

        return { repChange, followUp: { id: followUpId, content: followUpContent, tone: followUpTone, createdAt: now, acknowledged: false } };
    }

    /** Get character's Algorithm standing, recent changes, and commentary. */
    async getStanding(characterId: string) {
        let standing = await this.db.prepare(
            `SELECT algorithm_rep as algorithmRep, trust_level as trustLevel, compliance_rate as complianceRate, total_messages as totalMessages, days_connected as daysConnected, last_interaction as lastInteraction FROM algorithm_standing WHERE character_id = ?`
        ).bind(characterId).first();

        if (!standing) {
            const now = new Date().toISOString();
            await this.db.prepare('INSERT INTO algorithm_standing (character_id, algorithm_rep, trust_level, compliance_rate, total_messages, days_connected, last_interaction) VALUES (?, 50, 1, 50, 0, 1, ?)').bind(characterId, now).run();
            standing = { algorithmRep: 50, trustLevel: 1, complianceRate: 50, totalMessages: 0, daysConnected: 1, lastInteraction: now };
        }

        const recentChanges = await this.db.prepare(
            'SELECT id, source, amount, created_at as timestamp FROM algorithm_rep_changes WHERE character_id = ? ORDER BY created_at DESC LIMIT 10'
        ).bind(characterId).all();

        let commentary: string | null = null;
        if (recentChanges.results.length > 0) {
            const lastChange = recentChanges.results[0] as { amount: number; source: string };
            const ratingChange: RatingChange = {
                previousRating: (standing.algorithmRep as number) - lastChange.amount, newRating: standing.algorithmRep as number,
                delta: lastChange.amount, components: [], reason: lastChange.source || ' Algorithm Update',
                tierChanged: false, previousTier: Math.floor(((standing.algorithmRep as number) - lastChange.amount) / 20) + 1,
                newTier: Math.floor((standing.algorithmRep as number) / 20) + 1,
            };
            ratingChange.tierChanged = ratingChange.previousTier !== ratingChange.newTier;
            commentary = getAlgorithmCommentary(ratingChange);
        }

        return { standing, recentChanges: recentChanges.results, commentary };
    }

    /** Get active Algorithm directives. */
    async getDirectives(characterId: string) {
        const directives = await this.db.prepare(
            `SELECT id, content, priority, created_at as createdAt, expires_at as expiresAt FROM algorithm_directives WHERE character_id = ? AND (expires_at IS NULL OR expires_at > datetime('now')) AND completed = 0 ORDER BY priority DESC, created_at DESC LIMIT 5`
        ).bind(characterId).all();
        return directives.results;
    }
}
