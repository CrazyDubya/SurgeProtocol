/**
 * Surge Protocol - Leaderboard Service
 *
 * Manages leaderboard definitions, entries, rankings, and score submission.
 */

import { BaseService } from '../base/index';

// =============================================================================
// TYPES
// =============================================================================

export interface LeaderboardRow {
    id: string;
    code: string;
    name: string;
    description: string | null;
    leaderboard_type: string | null;
    scope: string | null;
    tracked_stat: string;
    sort_direction: string;
    reset_frequency: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    visible: number;
    display_top_n: number;
    show_player_rank: number;
    show_nearby_ranks: number;
    period_end_rewards: string | null;
    anti_cheat_rules: string | null;
    minimum_playtime: number;
    minimum_tier: number;
    created_at: string;
}

export interface EntryRow {
    id: string;
    leaderboard_id: string;
    player_id: string;
    period_id: string | null;
    score: number;
    rank: number | null;
    rank_change: number;
    character_name: string | null;
    character_tier: number | null;
    character_track: string | null;
    first_entry: string | null;
    last_update: string | null;
    verified: number;
    flagged_for_review: number;
}

export interface SubmitScoreInput {
    score: number;
    characterName?: string;
    characterTier?: number;
    characterTrack?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function parseJsonField<T>(value: string | null, defaultValue: T): T {
    if (!value) return defaultValue;
    try { return JSON.parse(value) as T; } catch { return defaultValue; }
}

export function formatLeaderboard(row: LeaderboardRow) {
    return {
        id: row.id, code: row.code, name: row.name, description: row.description,
        type: row.leaderboard_type, scope: row.scope,
        trackedStat: row.tracked_stat, sortDirection: row.sort_direction,
        resetFrequency: row.reset_frequency,
        currentPeriod: { start: row.current_period_start, end: row.current_period_end },
        display: { topN: row.display_top_n, showPlayerRank: row.show_player_rank === 1, showNearbyRanks: row.show_nearby_ranks },
        requirements: { minimumPlaytime: row.minimum_playtime, minimumTier: row.minimum_tier },
        rewards: parseJsonField<Record<string, unknown> | null>(row.period_end_rewards, null),
        isVisible: row.visible === 1,
    };
}

export function formatEntry(row: EntryRow, playerProfile?: { display_name: string | null }) {
    return {
        id: row.id, playerId: row.player_id, playerName: playerProfile?.display_name || null,
        characterName: row.character_name, characterTier: row.character_tier, characterTrack: row.character_track,
        score: row.score, rank: row.rank, rankChange: row.rank_change,
        firstEntry: row.first_entry, lastUpdate: row.last_update, isVerified: row.verified === 1,
    };
}

export function getCurrentPeriodId(resetFrequency: string | null): string {
    const now = new Date();
    switch (resetFrequency) {
        case 'DAILY': return now.toISOString().split('T')[0] as string;
        case 'WEEKLY': { const ws = new Date(now); ws.setDate(now.getDate() - now.getDay()); return `W${ws.toISOString().split('T')[0]}`; }
        case 'MONTHLY': return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        case 'SEASONAL': return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
        case 'YEARLY': return `${now.getFullYear()}`;
        default: return 'ALL_TIME';
    }
}

// =============================================================================
// LEADERBOARD SERVICE
// =============================================================================

export class LeaderboardService extends BaseService {

    // ---------------------------------------------------------------------------
    // DEFINITIONS
    // ---------------------------------------------------------------------------

    async listLeaderboards(opts: { type?: string; scope?: string }) {
        let query = 'SELECT * FROM leaderboard_definitions WHERE visible = 1';
        const params: string[] = [];
        if (opts.type) { query += ' AND leaderboard_type = ?'; params.push(opts.type); }
        if (opts.scope) { query += ' AND scope = ?'; params.push(opts.scope); }
        query += ' ORDER BY leaderboard_type, name';
        const result = await this.db.prepare(query).bind(...params).all<LeaderboardRow>();

        const byType: Record<string, ReturnType<typeof formatLeaderboard>[]> = {};
        for (const row of result.results) {
            const lb = formatLeaderboard(row);
            const t = lb.type || 'OTHER';
            if (!byType[t]) byType[t] = [];
            byType[t]!.push(lb);
        }
        return { leaderboards: result.results.map(formatLeaderboard), byType, count: result.results.length };
    }

    async getCategories() {
        const result = await this.db.prepare('SELECT leaderboard_type, scope, COUNT(*) as count FROM leaderboard_definitions WHERE visible = 1 GROUP BY leaderboard_type, scope').all<{ leaderboard_type: string | null; scope: string | null; count: number }>();
        const types: Record<string, number> = {};
        const scopes: Record<string, number> = {};
        for (const row of result.results) {
            const t = row.leaderboard_type || 'OTHER';
            const s = row.scope || 'GLOBAL';
            types[t] = (types[t] || 0) + row.count;
            scopes[s] = (scopes[s] || 0) + row.count;
        }
        return { types, scopes };
    }

    getPeriods() {
        return {
            daily: getCurrentPeriodId('DAILY'), weekly: getCurrentPeriodId('WEEKLY'),
            monthly: getCurrentPeriodId('MONTHLY'), seasonal: getCurrentPeriodId('SEASONAL'),
            yearly: getCurrentPeriodId('YEARLY'), allTime: 'ALL_TIME',
        };
    }

    async getRewards() {
        const lbs = await this.db.prepare(
            "SELECT id, code, name, reset_frequency, current_period_end, period_end_rewards FROM leaderboard_definitions WHERE visible = 1 AND period_end_rewards IS NOT NULL ORDER BY current_period_end"
        ).all<{ id: string; code: string; name: string; reset_frequency: string | null; current_period_end: string | null; period_end_rewards: string | null }>();
        return lbs.results.map(lb => ({
            leaderboardId: lb.id, leaderboardCode: lb.code, leaderboardName: lb.name,
            resetFrequency: lb.reset_frequency, periodEnd: lb.current_period_end,
            rewards: parseJsonField<Record<string, unknown>>(lb.period_end_rewards, {}),
        }));
    }

    // ---------------------------------------------------------------------------
    // PLAYER RANKINGS
    // ---------------------------------------------------------------------------

    async getMyRankings(userId: string) {
        const entries = await this.db.prepare(
            'SELECT le.*, ld.code, ld.name as leaderboard_name, ld.leaderboard_type FROM leaderboard_entries le JOIN leaderboard_definitions ld ON le.leaderboard_id = ld.id WHERE le.player_id = ? ORDER BY le.rank ASC'
        ).bind(userId).all<EntryRow & { code: string; leaderboard_name: string; leaderboard_type: string | null }>();

        const rankings = entries.results.map(e => ({
            leaderboard: { id: e.leaderboard_id, code: e.code, name: e.leaderboard_name, type: e.leaderboard_type },
            score: e.score, rank: e.rank, rankChange: e.rank_change, characterName: e.character_name, lastUpdate: e.last_update,
        }));

        const topTenCount = rankings.filter(r => (r.rank || 999) <= 10).length;
        const topHundredCount = rankings.filter(r => (r.rank || 999) <= 100).length;
        const bestRank = rankings.length > 0 ? Math.min(...rankings.map(r => r.rank || 999)) : null;
        return { rankings, summary: { totalLeaderboards: rankings.length, topTenCount, topHundredCount, bestRank } };
    }

    // ---------------------------------------------------------------------------
    // SINGLE LEADERBOARD
    // ---------------------------------------------------------------------------

    private async getLeaderboard(idOrCode: string): Promise<LeaderboardRow | null> {
        return this.db.prepare('SELECT * FROM leaderboard_definitions WHERE id = ? OR code = ?').bind(idOrCode, idOrCode).first<LeaderboardRow>();
    }

    async getLeaderboardEntries(idOrCode: string, opts: { period?: string; limit?: number; offset?: number }) {
        const lb = await this.getLeaderboard(idOrCode);
        if (!lb) return null;
        const periodId = opts.period || getCurrentPeriodId(lb.reset_frequency);
        const limit = Math.min(opts.limit || 100, 500);
        const offset = opts.offset || 0;

        let entriesQuery = 'SELECT le.*, pp.display_name FROM leaderboard_entries le LEFT JOIN player_profiles pp ON le.player_id = pp.id WHERE le.leaderboard_id = ?';
        const params: (string | number)[] = [lb.id];
        if (lb.reset_frequency) { entriesQuery += ' AND le.period_id = ?'; params.push(periodId); }
        entriesQuery += ` ORDER BY le.${lb.sort_direction === 'ASC' ? 'score ASC' : 'score DESC'}, le.last_update ASC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const entries = await this.db.prepare(entriesQuery).bind(...params).all<EntryRow & { display_name: string | null }>();
        const rankedEntries = entries.results.map((e, idx) => ({ ...formatEntry(e, { display_name: e.display_name }), rank: e.rank ?? offset + idx + 1 }));

        let countQuery = 'SELECT COUNT(*) as total FROM leaderboard_entries WHERE leaderboard_id = ?';
        const countParams: string[] = [lb.id];
        if (lb.reset_frequency) { countQuery += ' AND period_id = ?'; countParams.push(periodId); }
        const countResult = await this.db.prepare(countQuery).bind(...countParams).first<{ total: number }>();

        return {
            leaderboard: formatLeaderboard(lb), period: periodId, entries: rankedEntries,
            pagination: { total: countResult?.total || 0, limit, offset, hasMore: offset + rankedEntries.length < (countResult?.total || 0) },
        };
    }

    async getPlayerRank(idOrCode: string, userId: string, period?: string) {
        const lb = await this.getLeaderboard(idOrCode);
        if (!lb) return null;
        const periodId = period || getCurrentPeriodId(lb.reset_frequency);

        let entryQuery = 'SELECT le.*, pp.display_name FROM leaderboard_entries le LEFT JOIN player_profiles pp ON le.player_id = pp.id WHERE le.leaderboard_id = ? AND le.player_id = ?';
        const params: string[] = [lb.id, userId];
        if (lb.reset_frequency) { entryQuery += ' AND le.period_id = ?'; params.push(periodId); }

        const entry = await this.db.prepare(entryQuery).bind(...params).first<EntryRow & { display_name: string | null }>();
        if (!entry) return { leaderboard: { id: lb.id, code: lb.code, name: lb.name }, period: periodId, entry: null, message: 'Not ranked on this leaderboard' };

        let rank = entry.rank;
        if (!rank) {
            const rankQuery = lb.sort_direction === 'ASC'
                ? 'SELECT COUNT(*) as better FROM leaderboard_entries WHERE leaderboard_id = ? AND score < ?'
                : 'SELECT COUNT(*) as better FROM leaderboard_entries WHERE leaderboard_id = ? AND score > ?';
            const rr = await this.db.prepare(rankQuery).bind(lb.id, entry.score).first<{ better: number }>();
            rank = (rr?.better || 0) + 1;
        }
        return { leaderboard: { id: lb.id, code: lb.code, name: lb.name }, period: periodId, entry: { ...formatEntry(entry, { display_name: entry.display_name }), rank } };
    }

    async getNearbyEntries(idOrCode: string, userId: string, opts: { period?: string; range?: number }) {
        const lb = await this.getLeaderboard(idOrCode);
        if (!lb) return null;
        const periodId = opts.period || getCurrentPeriodId(lb.reset_frequency);
        const range = Math.min(opts.range || 5, 20);

        const playerEntry = await this.db.prepare(
            `SELECT score FROM leaderboard_entries WHERE leaderboard_id = ? AND player_id = ?${lb.reset_frequency ? ' AND period_id = ?' : ''}`
        ).bind(lb.id, userId, ...(lb.reset_frequency ? [periodId] : [])).first<{ score: number }>();

        if (!playerEntry) return { leaderboard: { id: lb.id, code: lb.code, name: lb.name }, period: periodId, entries: [], playerRank: null, message: 'Not ranked on this leaderboard' };

        const sortDir = lb.sort_direction === 'ASC' ? 'ASC' : 'DESC';
        const compareOp = sortDir === 'ASC' ? '<=' : '>=';
        const nearbyQuery = `SELECT le.*, pp.display_name, (SELECT COUNT(*) + 1 FROM leaderboard_entries WHERE leaderboard_id = le.leaderboard_id AND score ${sortDir === 'ASC' ? '<' : '>'} le.score) as calculated_rank FROM leaderboard_entries le LEFT JOIN player_profiles pp ON le.player_id = pp.id WHERE le.leaderboard_id = ? ${lb.reset_frequency ? 'AND le.period_id = ?' : ''} AND le.score ${compareOp} ? + ${range * 100} AND le.score ${sortDir === 'ASC' ? '>=' : '<='} ? - ${range * 100} ORDER BY le.score ${sortDir} LIMIT ${range * 2 + 1}`;
        const nearbyParams = [lb.id, ...(lb.reset_frequency ? [periodId] : []), playerEntry.score, playerEntry.score];
        const nearby = await this.db.prepare(nearbyQuery).bind(...nearbyParams).all<EntryRow & { display_name: string | null; calculated_rank: number }>();
        const entries = nearby.results.map(e => ({ ...formatEntry(e, { display_name: e.display_name }), rank: e.rank || e.calculated_rank, isCurrentPlayer: e.player_id === userId }));
        return { leaderboard: { id: lb.id, code: lb.code, name: lb.name }, period: periodId, entries, playerRank: entries.find(e => e.isCurrentPlayer)?.rank || null };
    }

    async getHistory(idOrCode: string, userId: string, limit = 10) {
        const lb = await this.db.prepare('SELECT id, code, name FROM leaderboard_definitions WHERE id = ? OR code = ?').bind(idOrCode, idOrCode).first<{ id: string; code: string; name: string }>();
        if (!lb) return null;
        const history = await this.db.prepare(
            'SELECT period_id, score, rank, rank_change, character_name, last_update FROM leaderboard_entries WHERE leaderboard_id = ? AND player_id = ? ORDER BY period_id DESC LIMIT ?'
        ).bind(lb.id, userId, Math.min(limit, 50)).all<{ period_id: string | null; score: number; rank: number | null; rank_change: number; character_name: string | null; last_update: string | null }>();
        return {
            leaderboard: lb,
            history: history.results.map(h => ({ period: h.period_id, score: h.score, rank: h.rank, rankChange: h.rank_change, characterName: h.character_name, lastUpdate: h.last_update })),
        };
    }

    // ---------------------------------------------------------------------------
    // SCORE SUBMISSION
    // ---------------------------------------------------------------------------

    async submitScore(idOrCode: string, userId: string, input: SubmitScoreInput) {
        const lb = await this.getLeaderboard(idOrCode);
        if (!lb) throw new Error('Leaderboard not found');
        const periodId = getCurrentPeriodId(lb.reset_frequency);
        const now = new Date().toISOString();

        const existing = await this.db.prepare(
            `SELECT id, score, rank FROM leaderboard_entries WHERE leaderboard_id = ? AND player_id = ?${lb.reset_frequency ? ' AND period_id = ?' : ''}`
        ).bind(lb.id, userId, ...(lb.reset_frequency ? [periodId] : [])).first<{ id: string; score: number; rank: number | null }>();

        if (existing) {
            const isBetter = lb.sort_direction === 'ASC' ? input.score < existing.score : input.score > existing.score;
            if (isBetter) {
                await this.db.prepare('UPDATE leaderboard_entries SET score = ?, character_name = ?, character_tier = ?, character_track = ?, last_update = ? WHERE id = ?')
                    .bind(input.score, input.characterName || null, input.characterTier || null, input.characterTrack || null, now, existing.id).run();
                return { updated: true, previousScore: existing.score, newScore: input.score, improvement: lb.sort_direction === 'ASC' ? existing.score - input.score : input.score - existing.score, message: 'New personal best!' };
            }
            return { updated: false, currentScore: existing.score, attemptedScore: input.score, message: 'Score not higher than current best' };
        }

        const entryId = crypto.randomUUID();
        await this.db.prepare(
            'INSERT INTO leaderboard_entries (id, leaderboard_id, player_id, period_id, score, character_name, character_tier, character_track, first_entry, last_update) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(entryId, lb.id, userId, lb.reset_frequency ? periodId : null, input.score, input.characterName || null, input.characterTier || null, input.characterTrack || null, now, now).run();
        return { created: true, entryId, score: input.score, period: periodId, message: 'Score submitted successfully' };
    }
}
