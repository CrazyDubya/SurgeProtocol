/**
 * Surge Protocol - Analytics Service
 *
 * Manages telemetry events and play session tracking.
 */

import { BaseService } from '../base/index';

// =============================================================================
// TYPES
// =============================================================================

export interface AnalyticsEvent {
    id: string;
    sessionId: string | null;
    playerId: string | null;
    characterId: string | null;
    occurredAt: string;
    eventType: string | null;
    eventCategory: string | null;
    eventName: string | null;
    eventData: Record<string, unknown> | null;
    locationId: string | null;
    missionId: string | null;
    coordinates: { x: number; y: number; z?: number } | null;
    sessionTimeSeconds: number | null;
    playtimeTotalSeconds: number | null;
    clientVersion: string | null;
    platform: string | null;
    isDebug: boolean;
}

export interface PlaySession {
    id: string;
    playerId: string | null;
    characterId: string | null;
    startedAt: string;
    endedAt: string | null;
    durationSeconds: number;
    activeDurationSeconds: number;
    idleDurationSeconds: number;
    missionsStarted: number;
    missionsCompleted: number;
    deliveriesCompleted: number;
    creditsEarned: number;
    creditsSpent: number;
    xpEarned: number;
    distanceTraveledKm: number;
    enemiesDefeated: number;
    deaths: number;
    tierAtStart: number | null;
    tierAtEnd: number | null;
    ratingAtStart: number | null;
    ratingAtEnd: number | null;
    averageFps: number | null;
    crashes: number;
    loadTimeAverageSeconds: number | null;
    clientVersion: string | null;
    platform: string | null;
    sessionQualityScore: number;
}

// =============================================================================
// HELPERS
// =============================================================================

function parseJsonField<T>(value: unknown, defaultValue: T): T {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'string') { try { return JSON.parse(value) as T; } catch { return defaultValue; } }
    return value as T;
}

const SESSION_FIELD_MAP: Record<string, string> = {
    durationSeconds: 'duration_seconds', activeDurationSeconds: 'active_duration_seconds',
    idleDurationSeconds: 'idle_duration_seconds', missionsStarted: 'missions_started',
    missionsCompleted: 'missions_completed', deliveriesCompleted: 'deliveries_completed',
    creditsEarned: 'credits_earned', creditsSpent: 'credits_spent', xpEarned: 'xp_earned',
    distanceTraveledKm: 'distance_traveled_km', enemiesDefeated: 'enemies_defeated',
    deaths: 'deaths', averageFps: 'average_fps', crashes: 'crashes',
    loadTimeAverageSeconds: 'load_time_average_seconds', sessionQualityScore: 'session_quality_score',
};

function mapRowToEvent(row: Record<string, unknown>): AnalyticsEvent {
    return {
        id: row.id as string, sessionId: row.session_id as string | null,
        playerId: row.player_id as string | null, characterId: row.character_id as string | null,
        occurredAt: row.occurred_at as string, eventType: row.event_type as string | null,
        eventCategory: row.event_category as string | null, eventName: row.event_name as string | null,
        eventData: parseJsonField<Record<string, unknown> | null>(row.event_data, null),
        locationId: row.location_id as string | null, missionId: row.mission_id as string | null,
        coordinates: parseJsonField<{ x: number; y: number; z?: number } | null>(row.coordinates, null),
        sessionTimeSeconds: row.session_time_seconds as number | null,
        playtimeTotalSeconds: row.playtime_total_seconds as number | null,
        clientVersion: row.client_version as string | null, platform: row.platform as string | null,
        isDebug: (row.is_debug as number) === 1,
    };
}

function mapRowToSession(row: Record<string, unknown>): PlaySession {
    return {
        id: row.id as string, playerId: row.player_id as string | null,
        characterId: row.character_id as string | null, startedAt: row.started_at as string,
        endedAt: row.ended_at as string | null, durationSeconds: row.duration_seconds as number,
        activeDurationSeconds: row.active_duration_seconds as number,
        idleDurationSeconds: row.idle_duration_seconds as number,
        missionsStarted: row.missions_started as number, missionsCompleted: row.missions_completed as number,
        deliveriesCompleted: row.deliveries_completed as number,
        creditsEarned: row.credits_earned as number, creditsSpent: row.credits_spent as number,
        xpEarned: row.xp_earned as number, distanceTraveledKm: row.distance_traveled_km as number,
        enemiesDefeated: row.enemies_defeated as number, deaths: row.deaths as number,
        tierAtStart: row.tier_at_start as number | null, tierAtEnd: row.tier_at_end as number | null,
        ratingAtStart: row.rating_at_start as number | null, ratingAtEnd: row.rating_at_end as number | null,
        averageFps: row.average_fps as number | null, crashes: row.crashes as number,
        loadTimeAverageSeconds: row.load_time_average_seconds as number | null,
        clientVersion: row.client_version as string | null, platform: row.platform as string | null,
        sessionQualityScore: row.session_quality_score as number,
    };
}

// =============================================================================
// ANALYTICS SERVICE
// =============================================================================

export class AnalyticsService extends BaseService {

    // ---------------------------------------------------------------------------
    // EVENTS
    // ---------------------------------------------------------------------------

    async logEvent(body: Record<string, unknown>): Promise<string> {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.prepare(
            `INSERT INTO analytics_events (id, session_id, player_id, character_id, occurred_at, event_type, event_category, event_name, event_data, location_id, mission_id, coordinates, session_time_seconds, playtime_total_seconds, client_version, platform, is_debug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, body.sessionId || null, body.playerId || null, body.characterId || null,
            (body.occurredAt as string) || now, body.eventType || null, body.eventCategory || null, body.eventName || null,
            body.eventData ? JSON.stringify(body.eventData) : null, body.locationId || null, body.missionId || null,
            body.coordinates ? JSON.stringify(body.coordinates) : null, body.sessionTimeSeconds || null,
            body.playtimeTotalSeconds || null, body.clientVersion || null, body.platform || null, body.isDebug ? 1 : 0).run();
        return id;
    }

    async logEventBatch(events: Record<string, unknown>[]): Promise<string[]> {
        const now = new Date().toISOString();
        const ids: string[] = [];
        const stmt = this.db.prepare(
            `INSERT INTO analytics_events (id, session_id, player_id, character_id, occurred_at, event_type, event_category, event_name, event_data, location_id, mission_id, coordinates, session_time_seconds, playtime_total_seconds, client_version, platform, is_debug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        const batch = events.map(e => {
            const id = crypto.randomUUID();
            ids.push(id);
            return stmt.bind(id, e.sessionId || null, e.playerId || null, e.characterId || null,
                (e.occurredAt as string) || now, e.eventType || null, e.eventCategory || null, e.eventName || null,
                e.eventData ? JSON.stringify(e.eventData) : null, e.locationId || null, e.missionId || null,
                e.coordinates ? JSON.stringify(e.coordinates) : null, e.sessionTimeSeconds || null,
                e.playtimeTotalSeconds || null, e.clientVersion || null, e.platform || null, e.isDebug ? 1 : 0);
        });
        await this.db.batch(batch);
        return ids;
    }

    async queryEvents(opts: { type?: string; category?: string; playerId?: string; sessionId?: string; since?: string; limit?: number; offset?: number }) {
        const limit = Math.min(opts.limit || 100, 1000);
        const offset = opts.offset || 0;
        let query = 'SELECT * FROM analytics_events WHERE 1=1';
        const params: unknown[] = [];
        if (opts.type) { query += ' AND event_type = ?'; params.push(opts.type); }
        if (opts.category) { query += ' AND event_category = ?'; params.push(opts.category); }
        if (opts.playerId) { query += ' AND player_id = ?'; params.push(opts.playerId); }
        if (opts.sessionId) { query += ' AND session_id = ?'; params.push(opts.sessionId); }
        if (opts.since) { query += ' AND occurred_at >= ?'; params.push(opts.since); }
        query += ' ORDER BY occurred_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        const result = await this.db.prepare(query).bind(...params).all();
        return { events: result.results.map(r => mapRowToEvent(r as Record<string, unknown>)), pagination: { limit, offset } };
    }

    async aggregateEvents(groupBy: string, since?: string) {
        const validGroupBy = ['event_type', 'event_category', 'event_name', 'platform'];
        if (!validGroupBy.includes(groupBy)) throw new Error(`groupBy must be one of: ${validGroupBy.join(', ')}`);
        let query = `SELECT ${groupBy}, COUNT(*) as count FROM analytics_events WHERE 1=1`;
        const params: unknown[] = [];
        if (since) { query += ' AND occurred_at >= ?'; params.push(since); }
        query += ` GROUP BY ${groupBy} ORDER BY count DESC LIMIT 50`;
        const result = await this.db.prepare(query).bind(...params).all();
        return result.results.map(row => ({ value: (row as Record<string, unknown>)[groupBy] as string, count: (row as Record<string, unknown>).count as number }));
    }

    // ---------------------------------------------------------------------------
    // PLAY SESSIONS
    // ---------------------------------------------------------------------------

    async startSession(userId: string, body: Record<string, unknown>): Promise<{ sessionId: string; startedAt: string }> {
        const player = await this.db.prepare('SELECT id FROM player_profiles WHERE user_id = ?').bind(userId).first();
        const playerId = player ? (player.id as string) : null;
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.prepare(
            'INSERT INTO play_sessions (id, player_id, character_id, started_at, tier_at_start, rating_at_start, client_version, platform) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, playerId, body.characterId || null, now, body.tierAtStart || null, body.ratingAtStart || null, body.clientVersion || null, body.platform || null).run();
        return { sessionId: id, startedAt: now };
    }

    async updateSession(sessionId: string, body: Record<string, unknown>) {
        const existing = await this.db.prepare('SELECT id FROM play_sessions WHERE id = ?').bind(sessionId).first();
        if (!existing) throw new Error('Session not found');
        const updates: string[] = [];
        const values: unknown[] = [];
        for (const [jsKey, dbKey] of Object.entries(SESSION_FIELD_MAP)) {
            if (body[jsKey] !== undefined) { updates.push(`${dbKey} = ?`); values.push(body[jsKey]); }
        }
        if (updates.length > 0) {
            values.push(sessionId);
            await this.db.prepare(`UPDATE play_sessions SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
        }
    }

    async endSession(sessionId: string, body: Record<string, unknown>) {
        const session = await this.db.prepare('SELECT started_at FROM play_sessions WHERE id = ?').bind(sessionId).first();
        if (!session) throw new Error('Session not found');
        const now = new Date().toISOString();
        const durationSeconds = Math.floor((new Date(now).getTime() - new Date(session.started_at as string).getTime()) / 1000);
        await this.db.prepare(
            `UPDATE play_sessions SET ended_at = ?, duration_seconds = ?, tier_at_end = ?, rating_at_end = ?, missions_completed = COALESCE(?, missions_completed), credits_earned = COALESCE(?, credits_earned), xp_earned = COALESCE(?, xp_earned), deaths = COALESCE(?, deaths), session_quality_score = COALESCE(?, session_quality_score) WHERE id = ?`
        ).bind(now, durationSeconds, body.tierAtEnd || null, body.ratingAtEnd || null,
            body.missionsCompleted || null, body.creditsEarned || null, body.xpEarned || null,
            body.deaths || null, body.sessionQualityScore || null, sessionId).run();
        return { sessionId, endedAt: now, durationSeconds };
    }

    async getSession(sessionId: string): Promise<PlaySession | null> {
        const result = await this.db.prepare('SELECT * FROM play_sessions WHERE id = ?').bind(sessionId).first();
        if (!result) return null;
        return mapRowToSession(result as Record<string, unknown>);
    }

    async getSessionHistory(userId: string, opts: { limit?: number; offset?: number }) {
        const limit = Math.min(opts.limit || 20, 100);
        const offset = opts.offset || 0;
        const player = await this.db.prepare('SELECT id FROM player_profiles WHERE user_id = ?').bind(userId).first();
        if (!player) return { sessions: [], total: 0, pagination: { limit, offset } };
        const playerId = player.id as string;
        const countResult = await this.db.prepare('SELECT COUNT(*) as count FROM play_sessions WHERE player_id = ?').bind(playerId).first();
        const total = (countResult?.count as number) || 0;
        const result = await this.db.prepare('SELECT * FROM play_sessions WHERE player_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?').bind(playerId, limit, offset).all();
        const sessions = result.results.map(row => ({
            id: row.id as string, startedAt: row.started_at as string, endedAt: row.ended_at as string | null,
            durationSeconds: row.duration_seconds as number, missionsCompleted: row.missions_completed as number,
            creditsEarned: row.credits_earned as number, xpEarned: row.xp_earned as number,
            deaths: row.deaths as number, platform: row.platform as string | null, sessionQualityScore: row.session_quality_score as number,
        }));
        return { sessions, total, pagination: { limit, offset } };
    }

    async getSessionStats(userId: string) {
        const player = await this.db.prepare('SELECT id FROM player_profiles WHERE user_id = ?').bind(userId).first();
        if (!player) return null;
        const playerId = player.id as string;
        const r = await this.db.prepare(
            `SELECT COUNT(*) as total_sessions, SUM(duration_seconds) as total_playtime_seconds, AVG(duration_seconds) as avg_session_seconds, MAX(duration_seconds) as longest_session_seconds, SUM(missions_started) as total_missions_started, SUM(missions_completed) as total_missions_completed, SUM(deliveries_completed) as total_deliveries, SUM(credits_earned) as total_credits_earned, SUM(credits_spent) as total_credits_spent, SUM(xp_earned) as total_xp_earned, SUM(distance_traveled_km) as total_distance_km, SUM(enemies_defeated) as total_enemies_defeated, SUM(deaths) as total_deaths, AVG(average_fps) as avg_fps, SUM(crashes) as total_crashes, AVG(session_quality_score) as avg_quality_score FROM play_sessions WHERE player_id = ?`
        ).bind(playerId).first();
        if (!r || !r.total_sessions) return null;
        return {
            totalSessions: r.total_sessions as number,
            totalPlaytimeSeconds: r.total_playtime_seconds as number,
            totalPlaytimeHours: Math.round(((r.total_playtime_seconds as number) / 3600) * 10) / 10,
            avgSessionMinutes: Math.round(((r.avg_session_seconds as number) / 60) * 10) / 10,
            longestSessionMinutes: Math.round(((r.longest_session_seconds as number) / 60) * 10) / 10,
            totalMissionsStarted: r.total_missions_started as number,
            totalMissionsCompleted: r.total_missions_completed as number,
            missionCompletionRate: (r.total_missions_started as number) > 0 ? Math.round(((r.total_missions_completed as number) / (r.total_missions_started as number)) * 100) : 0,
            totalDeliveries: r.total_deliveries as number,
            totalCreditsEarned: r.total_credits_earned as number,
            totalCreditsSpent: r.total_credits_spent as number,
            netCredits: (r.total_credits_earned as number) - (r.total_credits_spent as number),
            totalXpEarned: r.total_xp_earned as number,
            totalDistanceKm: Math.round((r.total_distance_km as number) * 10) / 10,
            totalEnemiesDefeated: r.total_enemies_defeated as number,
            totalDeaths: r.total_deaths as number,
            kdRatio: (r.total_deaths as number) > 0 ? Math.round(((r.total_enemies_defeated as number) / (r.total_deaths as number)) * 100) / 100 : r.total_enemies_defeated as number,
            avgFps: Math.round((r.avg_fps as number) * 10) / 10,
            totalCrashes: r.total_crashes as number,
            avgQualityScore: Math.round((r.avg_quality_score as number) * 10) / 10,
        };
    }
}
