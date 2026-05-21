
import type { D1Database } from '@cloudflare/workers-types';
import type {
    Friendship,
    Crew,
    CrewMembership,
    FriendRequestResult,
    CrewCreateRequest,
    CrewUpdateRequest
} from './types';

export class SocialService {
    constructor(private db: D1Database) { }

    /**
     * Parsing Helpers
     */
    private parseJson<T>(val: string | null): T | null {
        if (!val) return null;
        try {
            return JSON.parse(val) as T;
        } catch (e) {
            console.error('JSON parsing error:', e, val);
            return null;
        }
    }

    /**
     * Friendships
     */
    async listFriends(playerId: string): Promise<any[]> {
        const result = await this.db.prepare(`
            SELECT f.*, pp.display_name, pp.avatar_asset
            FROM friendships f
            LEFT JOIN player_profiles pp ON f.friend_id = pp.id
            WHERE f.player_id = ? AND f.status = 'ACCEPTED'
            ORDER BY f.favorite DESC, f.last_interaction DESC NULLS LAST
        `).bind(playerId).all<Friendship & { display_name: string | null; avatar_asset: string | null }>();

        return (result.results || []).map(row => this.formatFriendship(row));
    }

    async getFriendRequests(playerId: string) {
        const received = await this.db.prepare(`
            SELECT f.*, pp.display_name, pp.avatar_asset
            FROM friendships f
            LEFT JOIN player_profiles pp ON f.player_id = pp.id
            WHERE f.friend_id = ? AND f.status = 'PENDING_SENT'
            ORDER BY f.created_at DESC
        `).bind(playerId).all<Friendship & { display_name: string | null; avatar_asset: string | null }>();

        const sent = await this.db.prepare(`
            SELECT f.*, pp.display_name, pp.avatar_asset
            FROM friendships f
            LEFT JOIN player_profiles pp ON f.friend_id = pp.id
            WHERE f.player_id = ? AND f.status = 'PENDING_SENT'
            ORDER BY f.created_at DESC
        `).bind(playerId).all<Friendship & { display_name: string | null; avatar_asset: string | null }>();

        return {
            received: (received.results || []).map(row => ({
                id: row.id,
                fromPlayerId: row.player_id,
                fromPlayer: {
                    displayName: row.display_name,
                    avatar: row.avatar_asset,
                },
                sentAt: row.created_at,
            })),
            sent: (sent.results || []).map(row => ({
                id: row.id,
                toPlayerId: row.friend_id,
                toPlayer: {
                    displayName: row.display_name,
                    avatar: row.avatar_asset,
                },
                sentAt: row.created_at,
            })),
        };
    }

    async sendFriendRequest(fromPlayerId: string, targetPlayerId: string): Promise<FriendRequestResult> {
        if (fromPlayerId === targetPlayerId) throw new Error('Cannot add yourself as a friend');

        const target = await this.db.prepare('SELECT id, display_name, allow_friend_requests FROM player_profiles WHERE id = ?')
            .bind(targetPlayerId).first<{ id: string, display_name: string | null, allow_friend_requests: number }>();

        if (!target) throw new Error('Player not found');
        if (!target.allow_friend_requests) throw new Error('Player is not accepting friend requests');

        const existing = await this.db.prepare(`
            SELECT id, status FROM friendships
            WHERE (player_id = ? AND friend_id = ?) OR (player_id = ? AND friend_id = ?)
        `).bind(fromPlayerId, targetPlayerId, targetPlayerId, fromPlayerId).first<{ status: string }>();

        if (existing) {
            if (existing.status === 'ACCEPTED') throw new Error('Already friends');
            if (existing.status === 'PENDING_SENT') throw new Error('Friend request already pending');
            if (existing.status === 'BLOCKED') throw new Error('Cannot send friend request');
        }

        const friendshipId = crypto.randomUUID();
        await this.db.prepare(`
            INSERT INTO friendships (id, player_id, friend_id, status, initiated_by, created_at)
            VALUES (?, ?, ?, 'PENDING_SENT', ?, datetime('now'))
        `).bind(friendshipId, fromPlayerId, targetPlayerId, fromPlayerId).run();

        return {
            friendshipId,
            toPlayer: { id: target.id, displayName: target.display_name },
            message: `Friend request sent to ${target.display_name || 'player'}`
        };
    }

    async acceptFriendRequest(playerId: string, friendshipId: string) {
        const request = await this.db.prepare(`
            SELECT f.*, pp.display_name
            FROM friendships f
            LEFT JOIN player_profiles pp ON f.player_id = pp.id
            WHERE f.id = ? AND f.friend_id = ? AND f.status = 'PENDING_SENT'
        `).bind(friendshipId, playerId).first<Friendship & { display_name: string | null }>();

        if (!request) throw new Error('Friend request not found');

        await this.db.prepare(`
            UPDATE friendships SET status = 'ACCEPTED', last_interaction = datetime('now')
            WHERE id = ?
        `).bind(friendshipId).run();

        await this.db.prepare(`
            INSERT OR IGNORE INTO friendships
            (id, player_id, friend_id, status, initiated_by, created_at, last_interaction)
            VALUES (?, ?, ?, 'ACCEPTED', ?, datetime('now'), datetime('now'))
        `).bind(crypto.randomUUID(), playerId, request.player_id, request.initiated_by).run();

        return {
            id: request.player_id,
            displayName: request.display_name,
        };
    }

    async rejectFriendRequest(playerId: string, friendshipId: string) {
        const result = await this.db.prepare(`
            DELETE FROM friendships 
            WHERE id = ? AND friend_id = ? AND status = 'PENDING_SENT'
        `).bind(friendshipId, playerId).run();

        if (!result.meta.changes) throw new Error('Friend request not found');
    }

    async removeFriend(playerId: string, friendshipId: string) {
        const friendship = await this.db.prepare('SELECT friend_id FROM friendships WHERE id = ? AND player_id = ?')
            .bind(friendshipId, playerId).first<{ friend_id: string }>();

        if (!friendship) throw new Error('Friendship not found');

        await this.db.prepare(`
            DELETE FROM friendships
            WHERE (player_id = ? AND friend_id = ?) OR (player_id = ? AND friend_id = ?)
        `).bind(playerId, friendship.friend_id, friendship.friend_id, playerId).run();
    }

    async updateFriendSettings(playerId: string, friendshipId: string, updates: any) {
        const setClauses: string[] = [];
        const params: any[] = [];

        if (updates.nickname !== undefined) { setClauses.push('nickname = ?'); params.push(updates.nickname); }
        if (updates.groupName !== undefined) { setClauses.push('group_name = ?'); params.push(updates.groupName); }
        if (updates.favorite !== undefined) { setClauses.push('favorite = ?'); params.push(updates.favorite ? 1 : 0); }
        if (updates.canJoinSession !== undefined) { setClauses.push('can_join_session = ?'); params.push(updates.canJoinSession ? 1 : 0); }
        if (updates.canSeeLocation !== undefined) { setClauses.push('can_see_location = ?'); params.push(updates.canSeeLocation ? 1 : 0); }
        if (updates.canSendItems !== undefined) { setClauses.push('can_send_items = ?'); params.push(updates.canSendItems ? 1 : 0); }
        if (updates.notificationLevel !== undefined) { setClauses.push('notification_level = ?'); params.push(updates.notificationLevel); }

        if (setClauses.length === 0) return;

        params.push(friendshipId, playerId);
        const result = await this.db.prepare(`
            UPDATE friendships SET ${setClauses.join(', ')}
            WHERE id = ? AND player_id = ? AND status = 'ACCEPTED'
        `).bind(...params).run();

        if (!result.meta.changes) throw new Error('Friendship not found');
    }

    async blockPlayer(playerId: string, targetPlayerId: string) {
        await this.db.prepare(`
            DELETE FROM friendships
            WHERE (player_id = ? AND friend_id = ?) OR (player_id = ? AND friend_id = ?)
        `).bind(playerId, targetPlayerId, targetPlayerId, playerId).run();

        await this.db.prepare(`
            INSERT INTO friendships (id, player_id, friend_id, status, initiated_by, created_at)
            VALUES (?, ?, ?, 'BLOCKED', ?, datetime('now'))
        `).bind(crypto.randomUUID(), playerId, targetPlayerId, playerId).run();
    }

    async unblockPlayer(playerId: string, targetPlayerId: string) {
        const result = await this.db.prepare(`
            DELETE FROM friendships
            WHERE player_id = ? AND friend_id = ? AND status = 'BLOCKED'
        `).bind(playerId, targetPlayerId).run();

        if (!result.meta.changes) throw new Error('Block not found');
    }

    /**
     * Crews
     */
    async listCrews(filters: { search?: string, status?: string, minRating?: number, limit?: number, offset?: number }): Promise<any[]> {
        const { search, status, minRating, limit = 20, offset = 0 } = filters;
        let query = `SELECT * FROM crews WHERE is_active = 1 AND privacy != 'PRIVATE'`;
        const params: any[] = [];

        if (search) {
            query += ` AND (name LIKE ? OR tag LIKE ? OR description LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (status) {
            query += ` AND recruitment_status = ?`;
            params.push(status);
        }
        if (minRating) {
            query += ` AND crew_rating >= ?`;
            params.push(minRating);
        }

        query += ` ORDER BY crew_rating DESC, member_count DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const result = await this.db.prepare(query).bind(...params).all<Crew>();
        return (result.results || []).map(row => this.formatCrew(row));
    }

    async getCrewDetails(crewId: string) {
        const crew = await this.db.prepare('SELECT * FROM crews WHERE id = ?')
            .bind(crewId).first<Crew>();

        if (!crew) return null;

        const topMembers = await this.db.prepare(`
            SELECT cm.*, pp.display_name, pp.avatar_asset
            FROM crew_memberships cm
            LEFT JOIN player_profiles pp ON cm.player_id = pp.id
            WHERE cm.crew_id = ? AND cm.is_active = 1
            ORDER BY cm.rank_order DESC, cm.credits_contributed DESC
            LIMIT 10
        `).bind(crewId).all<CrewMembership & { display_name: string | null; avatar_asset: string | null }>();

        const recentActivity = await this.db.prepare(`
            SELECT cm.player_id, cm.last_active, pp.display_name
            FROM crew_memberships cm
            LEFT JOIN player_profiles pp ON cm.player_id = pp.id
            WHERE cm.crew_id = ? AND cm.is_active = 1 AND cm.last_active IS NOT NULL
            ORDER BY cm.last_active DESC
            LIMIT 5
        `).bind(crewId).all<{ player_id: string; last_active: string; display_name: string | null }>();

        return {
            crew: this.formatCrew(crew),
            topMembers: (topMembers.results || []).map(m => this.formatMember(m)),
            recentActivity: (recentActivity.results || []).map(a => ({
                playerId: a.player_id,
                displayName: a.display_name,
                lastActive: a.last_active,
            })),
            applicationQuestions: this.parseJson<string[]>(crew.application_questions) || [],
            rankDefinitions: this.parseJson<Record<string, any>>(crew.rank_definitions) || {},
        };
    }

    async createCrew(userId: string, data: CrewCreateRequest) {
        const existing = await this.db.prepare('SELECT crew_id FROM crew_memberships WHERE player_id = ? AND is_active = 1')
            .bind(userId).first();
        if (existing) throw new Error('Must leave current crew before creating a new one');

        const nameCheck = await this.db.prepare('SELECT id FROM crews WHERE name = ? OR (tag = ? AND tag IS NOT NULL)')
            .bind(data.name, data.tag || null).first();
        if (nameCheck) throw new Error('Crew name or tag already taken');

        const crewId = crypto.randomUUID();
        const membershipId = crypto.randomUUID();

        await this.db.prepare(`
            INSERT INTO crews (id, name, tag, description, motto, colors, founder_id, leader_id, recruitment_status, privacy, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
            crewId, data.name, data.tag || null, data.description || null, data.motto || null,
            data.colors ? JSON.stringify(data.colors) : null, userId, userId,
            data.recruitmentStatus || 'OPEN', data.privacy || 'PUBLIC'
        ).run();

        await this.db.prepare(`
            INSERT INTO crew_memberships
            (id, crew_id, player_id, rank, rank_order, can_invite, can_kick, can_promote,
             can_edit_settings, can_access_bank, bank_withdraw_limit, joined_at, last_active)
            VALUES (?, ?, ?, 'LEADER', 100, 1, 1, 1, 1, 1, 999999999, datetime('now'), datetime('now'))
        `).bind(membershipId, crewId, userId).run();

        await this.db.prepare('UPDATE player_profiles SET crew_id = ?, crew_rank = ? WHERE id = ?')
            .bind(crewId, 'LEADER', userId).run();

        return { crewId, name: data.name, tag: data.tag };
    }

    async updateCrew(userId: string, crewId: string, updates: CrewUpdateRequest) {
        const membership = await this.db.prepare('SELECT can_edit_settings FROM crew_memberships WHERE crew_id = ? AND player_id = ? AND is_active = 1')
            .bind(crewId, userId).first<{ can_edit_settings: number }>();

        if (!membership?.can_edit_settings) throw new Error('No permission to edit crew settings');

        const setClauses: string[] = [];
        const params: any[] = [];

        if (updates.description !== undefined) { setClauses.push('description = ?'); params.push(updates.description); }
        if (updates.motto !== undefined) { setClauses.push('motto = ?'); params.push(updates.motto); }
        if (updates.colors !== undefined) { setClauses.push('colors = ?'); params.push(JSON.stringify(updates.colors)); }
        if (updates.recruitmentStatus !== undefined) { setClauses.push('recruitment_status = ?'); params.push(updates.recruitmentStatus); }
        if (updates.privacy !== undefined) { setClauses.push('privacy = ?'); params.push(updates.privacy); }
        if (updates.maxMembers !== undefined) { setClauses.push('max_members = ?'); params.push(updates.maxMembers); }
        if (updates.requirements !== undefined) { setClauses.push('requirements = ?'); params.push(JSON.stringify(updates.requirements)); }

        if (setClauses.length === 0) return;

        params.push(crewId);
        await this.db.prepare(`UPDATE crews SET ${setClauses.join(', ')} WHERE id = ?`).bind(...params).run();
    }

    async disbandCrew(userId: string, crewId: string) {
        const crew = await this.db.prepare('SELECT leader_id, name FROM crews WHERE id = ?')
            .bind(crewId).first<{ leader_id: string, name: string }>();

        if (!crew) throw new Error('Crew not found');
        if (crew.leader_id !== userId) throw new Error('Only the leader can disband the crew');

        await this.db.prepare('UPDATE crew_memberships SET is_active = 0 WHERE crew_id = ?').bind(crewId).run();
        await this.db.prepare('UPDATE player_profiles SET crew_id = NULL, crew_rank = NULL WHERE crew_id = ?').bind(crewId).run();
        await this.db.prepare('UPDATE crews SET is_active = 0 WHERE id = ?').bind(crewId).run();

        return crew.name;
    }

    async listCrewMembers(crewId: string) {
        const members = await this.db.prepare(`
            SELECT cm.*, pp.display_name, pp.avatar_asset
            FROM crew_memberships cm
            LEFT JOIN player_profiles pp ON cm.player_id = pp.id
            WHERE cm.crew_id = ? AND cm.is_active = 1
            ORDER BY cm.rank_order DESC, cm.joined_at
        `).bind(crewId).all<CrewMembership & { display_name: string | null; avatar_asset: string | null }>();

        return (members.results || []).map(m => this.formatMember(m));
    }

    async inviteMember(userId: string, crewId: string, targetPlayerId: string) {
        const membership = await this.db.prepare('SELECT can_invite FROM crew_memberships WHERE crew_id = ? AND player_id = ? AND is_active = 1')
            .bind(crewId, userId).first<{ can_invite: number }>();

        if (!membership?.can_invite) throw new Error('No permission to invite members');

        const crew = await this.db.prepare('SELECT member_count, max_members, name FROM crews WHERE id = ?')
            .bind(crewId).first<{ member_count: number; max_members: number; name: string }>();

        if (!crew) throw new Error('Crew not found');
        if (crew.member_count >= crew.max_members) throw new Error('Crew is at maximum capacity');

        const target = await this.db.prepare('SELECT id, display_name, crew_id FROM player_profiles WHERE id = ?')
            .bind(targetPlayerId).first<{ id: string, display_name: string | null, crew_id: string | null }>();

        if (!target) throw new Error('Player not found');
        if (target.crew_id) throw new Error('Player is already in a crew');

        // Simplified invitation
        return {
            invited: { id: target.id, displayName: target.display_name },
            crewName: crew.name
        };
    }

    async applyToCrew(userId: string, crewId: string, _message?: string) {
        const player = await this.db.prepare('SELECT crew_id FROM player_profiles WHERE id = ?').bind(userId).first<{ crew_id: string | null }>();
        if (player?.crew_id) throw new Error('Must leave current crew before applying');

        const crew = await this.db.prepare('SELECT recruitment_status, name FROM crews WHERE id = ? AND is_active = 1')
            .bind(crewId).first<{ recruitment_status: string, name: string }>();

        if (!crew) throw new Error('Crew not found');
        if (crew.recruitment_status === 'CLOSED') throw new Error('Crew is not accepting new members');

        if (crew.recruitment_status === 'OPEN') {
            const membershipId = crypto.randomUUID();
            await this.db.prepare(`
                INSERT INTO crew_memberships (id, crew_id, player_id, rank, rank_order, joined_at, last_active)
                VALUES (?, ?, ?, 'MEMBER', 0, datetime('now'), datetime('now'))
            `).bind(membershipId, crewId, userId).run();

            await this.db.prepare('UPDATE crews SET member_count = member_count + 1 WHERE id = ?').bind(crewId).run();
            await this.db.prepare('UPDATE player_profiles SET crew_id = ?, crew_rank = ? WHERE id = ?')
                .bind(crewId, 'MEMBER', userId).run();

            return { joined: true, crewName: crew.name };
        }

        // INVITE_ONLY logic... 
        return { joined: false, crewName: crew.name, message: 'Application submitted' };
    }

    async promoteMember(userId: string, crewId: string, memberId: string) {
        const currentMember = await this.db.prepare('SELECT can_promote, rank_order FROM crew_memberships WHERE crew_id = ? AND player_id = ? AND is_active = 1')
            .bind(crewId, userId).first<{ can_promote: number, rank_order: number }>();

        if (!currentMember?.can_promote) throw new Error('No permission to promote members');

        const target = await this.db.prepare(`
            SELECT cm.id, cm.rank_order, pp.display_name
            FROM crew_memberships cm
            LEFT JOIN player_profiles pp ON cm.player_id = pp.id
            WHERE cm.id = ? AND cm.crew_id = ? AND cm.is_active = 1
        `).bind(memberId, crewId).first<{ id: string, rank_order: number, display_name: string | null }>();

        if (!target) throw new Error('Member not found');
        if (target.rank_order >= currentMember.rank_order - 1) throw new Error('Cannot promote to equal or higher rank');

        const newRankOrder = target.rank_order + 10;
        const newRank = newRankOrder >= 50 ? 'OFFICER' : 'MEMBER';

        await this.db.prepare('UPDATE crew_memberships SET rank = ?, rank_order = ?, can_invite = ? WHERE id = ?')
            .bind(newRank, newRankOrder, newRank === 'OFFICER' ? 1 : 0, memberId).run();

        return { displayName: target.display_name, newRank };
    }

    async demoteMember(userId: string, crewId: string, memberId: string) {
        const currentMember = await this.db.prepare('SELECT can_promote, rank_order FROM crew_memberships WHERE crew_id = ? AND player_id = ? AND is_active = 1')
            .bind(crewId, userId).first<{ can_promote: number, rank_order: number }>();

        if (!currentMember?.can_promote) throw new Error('No permission to demote members');

        const target = await this.db.prepare(`
            SELECT cm.id, cm.rank_order, pp.display_name
            FROM crew_memberships cm
            LEFT JOIN player_profiles pp ON cm.player_id = pp.id
            WHERE cm.id = ? AND cm.crew_id = ? AND cm.is_active = 1
        `).bind(memberId, crewId).first<{ id: string, rank_order: number, display_name: string | null }>();

        if (!target) throw new Error('Member not found');
        if (target.rank_order >= currentMember.rank_order) throw new Error('Cannot demote higher ranked members');
        if (target.rank_order <= 0) throw new Error('Member is already at minimum rank');

        const newRankOrder = Math.max(0, target.rank_order - 10);
        const newRank = newRankOrder >= 50 ? 'OFFICER' : 'MEMBER';

        await this.db.prepare('UPDATE crew_memberships SET rank = ?, rank_order = ?, can_invite = 0, can_kick = 0, can_promote = 0 WHERE id = ?')
            .bind(newRank, newRankOrder, memberId).run();

        return { displayName: target.display_name, newRank };
    }

    async kickMember(userId: string, crewId: string, memberId: string) {
        const currentMember = await this.db.prepare('SELECT can_kick, rank_order FROM crew_memberships WHERE crew_id = ? AND player_id = ? AND is_active = 1')
            .bind(crewId, userId).first<{ can_kick: number, rank_order: number }>();

        if (!currentMember?.can_kick) throw new Error('No permission to kick members');

        const target = await this.db.prepare(`
            SELECT cm.id, cm.player_id, cm.rank_order, pp.display_name
            FROM crew_memberships cm
            LEFT JOIN player_profiles pp ON cm.player_id = pp.id
            WHERE cm.id = ? AND cm.crew_id = ? AND cm.is_active = 1
        `).bind(memberId, crewId).first<{ id: string, player_id: string, rank_order: number, display_name: string | null }>();

        if (!target) throw new Error('Member not found');
        if (target.rank_order >= currentMember.rank_order) throw new Error('Cannot kick higher ranked members');

        await this.db.prepare('UPDATE crew_memberships SET is_active = 0 WHERE id = ?').bind(memberId).run();
        await this.db.prepare('UPDATE crews SET member_count = member_count - 1 WHERE id = ?').bind(crewId).run();
        await this.db.prepare('UPDATE player_profiles SET crew_id = NULL, crew_rank = NULL WHERE id = ?').bind(target.player_id).run();

        return { playerId: target.player_id, displayName: target.display_name };
    }

    async leaveCrew(userId: string, crewId: string) {
        const membership = await this.db.prepare('SELECT id, rank FROM crew_memberships WHERE crew_id = ? AND player_id = ? AND is_active = 1')
            .bind(crewId, userId).first<{ id: string, rank: string }>();

        if (!membership) throw new Error('Not a member of this crew');
        if (membership.rank === 'LEADER') throw new Error('Leader must transfer leadership or disband crew');

        await this.db.prepare('UPDATE crew_memberships SET is_active = 0 WHERE id = ?').bind(membership.id).run();
        await this.db.prepare('UPDATE crews SET member_count = member_count - 1 WHERE id = ?').bind(crewId).run();
        await this.db.prepare('UPDATE player_profiles SET crew_id = NULL, crew_rank = NULL WHERE id = ?').bind(userId).run();
    }

    async getCrewBank(userId: string, crewId: string) {
        const membership = await this.db.prepare('SELECT can_access_bank, bank_withdraw_limit FROM crew_memberships WHERE crew_id = ? AND player_id = ? AND is_active = 1')
            .bind(crewId, userId).first<{ can_access_bank: number, bank_withdraw_limit: number }>();

        if (!membership) throw new Error('Not a member of this crew');

        const crew = await this.db.prepare('SELECT crew_bank_balance FROM crews WHERE id = ?').bind(crewId).first<{ crew_bank_balance: number }>();

        return {
            balance: crew?.crew_bank_balance || 0,
            canAccess: membership.can_access_bank === 1,
            withdrawLimit: membership.bank_withdraw_limit,
            recentTransactions: []
        };
    }

    async depositToCrewBank(userId: string, crewId: string, amount: number) {
        const membership = await this.db.prepare('SELECT id FROM crew_memberships WHERE crew_id = ? AND player_id = ? AND is_active = 1')
            .bind(crewId, userId).first<{ id: string }>();
        if (!membership) throw new Error('Not a member of this crew');

        await this.db.prepare('UPDATE crews SET crew_bank_balance = crew_bank_balance + ? WHERE id = ?').bind(amount, crewId).run();
        await this.db.prepare('UPDATE crew_memberships SET credits_contributed = credits_contributed + ? WHERE id = ?')
            .bind(amount, membership.id).run();
    }

    async withdrawFromCrewBank(userId: string, crewId: string, amount: number) {
        const membership = await this.db.prepare('SELECT can_access_bank, bank_withdraw_limit FROM crew_memberships WHERE crew_id = ? AND player_id = ? AND is_active = 1')
            .bind(crewId, userId).first<{ can_access_bank: number, bank_withdraw_limit: number }>();

        if (!membership?.can_access_bank) throw new Error('No permission to access crew bank');
        if (amount > membership.bank_withdraw_limit) throw new Error(`Withdrawal exceeds limit of ${membership.bank_withdraw_limit}`);

        const crew = await this.db.prepare('SELECT crew_bank_balance FROM crews WHERE id = ?').bind(crewId).first<{ crew_bank_balance: number }>();
        if (!crew || crew.crew_bank_balance < amount) throw new Error('Crew bank has insufficient funds');

        await this.db.prepare('UPDATE crews SET crew_bank_balance = crew_bank_balance - ? WHERE id = ?').bind(amount, crewId).run();

        return crew.crew_bank_balance - amount;
    }

    async getPlayerCrew(userId: string) {
        const membership = await this.db.prepare(`
            SELECT cm.*, c.*
            FROM crew_memberships cm
            JOIN crews c ON cm.crew_id = c.id
            WHERE cm.player_id = ? AND cm.is_active = 1 AND c.is_active = 1
        `).bind(userId).first<any>();

        if (!membership) {
            return {
                crew: null,
                membership: null,
                message: 'Not in a crew',
            };
        }

        return {
            crew: this.formatCrew(membership),
            membership: {
                rank: membership.rank,
                rankOrder: membership.rank_order,
                customTitle: membership.custom_title,
                permissions: {
                    canInvite: membership.can_invite === 1,
                    canKick: membership.can_kick === 1,
                    canPromote: membership.can_promote === 1,
                    canEditSettings: membership.can_edit_settings === 1,
                    canAccessBank: membership.can_access_bank === 1,
                    bankWithdrawLimit: membership.bank_withdraw_limit,
                },
                contribution: {
                    deliveries: membership.deliveries_for_crew,
                    creditsContributed: membership.credits_contributed,
                    eventsParticipated: membership.events_participated,
                    recruitments: membership.recruitment_count,
                },
                joinedAt: membership.joined_at,
            },
        };
    }

    private formatCrew(row: any) {
        return {
            id: row.id,
            name: row.name,
            tag: row.tag,
            description: row.description,
            motto: row.motto,
            emblem: row.emblem_asset,
            colors: this.parseJson(row.colors),
            founderId: row.founder_id,
            leaderId: row.leader_id,
            officers: this.parseJson(row.officers) || [],
            memberCount: row.member_count,
            maxMembers: row.max_members,
            recruitmentStatus: row.recruitment_status,
            requirements: this.parseJson(row.requirements) || {},
            stats: {
                totalDeliveries: row.total_deliveries,
                totalCreditsEarned: row.total_credits_earned,
                averageTier: row.average_tier,
                competitionWins: row.competition_wins,
                rating: row.crew_rating,
            },
            bankBalance: row.crew_bank_balance,
            privacy: row.privacy,
            isActive: row.is_active === 1,
            createdAt: row.created_at,
        };
    }

    private formatFriendship(row: any) {
        return {
            id: row.id,
            friendId: row.friend_id,
            status: row.status,
            createdAt: row.created_at,
            nickname: row.nickname,
            groupName: row.group_name,
            isFavorite: row.favorite === 1,
            lastInteraction: row.last_interaction,
            interactionCount: row.interaction_count,
            timesPlayedTogether: row.times_played_together,
            permissions: {
                canJoinSession: row.can_join_session === 1,
                canSeeLocation: row.can_see_location === 1,
                canSendItems: row.can_send_items === 1,
            },
            notificationLevel: row.notification_level,
            friend: {
                displayName: row.display_name,
                avatar: row.avatar_asset,
            }
        };
    }

    private formatMember(row: any) {
        return {
            id: row.id,
            playerId: row.player_id,
            rank: row.rank,
            rankOrder: row.rank_order,
            customTitle: row.custom_title,
            permissions: {
                canInvite: row.can_invite === 1,
                canKick: row.can_kick === 1,
                canPromote: row.can_promote === 1,
                canEditSettings: row.can_edit_settings === 1,
                canAccessBank: row.can_access_bank === 1,
                bankWithdrawLimit: row.bank_withdraw_limit,
            },
            contribution: {
                deliveries: row.deliveries_for_crew,
                creditsContributed: row.credits_contributed,
                eventsParticipated: row.events_participated,
                recruitments: row.recruitment_count,
            },
            joinedAt: row.joined_at,
            lastActive: row.last_active,
            isActive: row.is_active === 1,
            onProbation: row.on_probation === 1,
            profile: {
                displayName: row.display_name,
                avatar: row.avatar_asset,
            }
        };
    }
}
