/**
 * Analytics API
 *
 * Manages telemetry events and play session tracking.
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware, type AuthVariables } from '../../middleware/auth';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  return value as T;
}

export const analyticsRoutes = new Hono<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>();

// ============================================
// ANALYTICS EVENTS
// ============================================

interface AnalyticsEvent {
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

// Log analytics event
analyticsRoutes.post('/events', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  if (!body.eventType || !body.eventName) {
    throw new HTTPException(400, { message: 'eventType and eventName are required' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO analytics_events (
        id, session_id, player_id, character_id, occurred_at,
        event_type, event_category, event_name, event_data,
        location_id, mission_id, coordinates,
        session_time_seconds, playtime_total_seconds,
        client_version, platform, is_debug
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      body.sessionId || null,
      body.playerId || null,
      body.characterId || null,
      body.occurredAt || now,
      body.eventType,
      body.eventCategory || null,
      body.eventName,
      body.eventData ? JSON.stringify(body.eventData) : null,
      body.locationId || null,
      body.missionId || null,
      body.coordinates ? JSON.stringify(body.coordinates) : null,
      body.sessionTimeSeconds || null,
      body.playtimeTotalSeconds || null,
      body.clientVersion || null,
      body.platform || null,
      body.isDebug ? 1 : 0
    )
    .run();

  return c.json(
    {
      success: true,
      data: { id },
    },
    201
  );
});

// Batch log events
analyticsRoutes.post('/events/batch', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  if (!Array.isArray(body.events) || body.events.length === 0) {
    throw new HTTPException(400, { message: 'events array is required' });
  }

  if (body.events.length > 100) {
    throw new HTTPException(400, { message: 'Maximum 100 events per batch' });
  }

  const now = new Date().toISOString();
  const ids: string[] = [];

  const stmt = db.prepare(
    `INSERT INTO analytics_events (
      id, session_id, player_id, character_id, occurred_at,
      event_type, event_category, event_name, event_data,
      location_id, mission_id, coordinates,
      session_time_seconds, playtime_total_seconds,
      client_version, platform, is_debug
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const batch = body.events.map((event: Record<string, unknown>) => {
    const id = crypto.randomUUID();
    ids.push(id);
    return stmt.bind(
      id,
      event.sessionId || null,
      event.playerId || null,
      event.characterId || null,
      (event.occurredAt as string) || now,
      event.eventType || null,
      event.eventCategory || null,
      event.eventName || null,
      event.eventData ? JSON.stringify(event.eventData) : null,
      event.locationId || null,
      event.missionId || null,
      event.coordinates ? JSON.stringify(event.coordinates) : null,
      event.sessionTimeSeconds || null,
      event.playtimeTotalSeconds || null,
      event.clientVersion || null,
      event.platform || null,
      event.isDebug ? 1 : 0
    );
  });

  await db.batch(batch);

  return c.json(
    {
      success: true,
      data: {
        inserted: ids.length,
        ids,
      },
    },
    201
  );
});

// Query events (admin/analytics)
analyticsRoutes.get('/events', authMiddleware, async (c) => {
  const db = c.env.DB;
  const eventType = c.req.query('type');
  const eventCategory = c.req.query('category');
  const playerId = c.req.query('playerId');
  const sessionId = c.req.query('sessionId');
  const since = c.req.query('since');
  const limit = Math.min(parseInt(c.req.query('limit') || '100'), 1000);
  const offset = parseInt(c.req.query('offset') || '0');

  let query = 'SELECT * FROM analytics_events WHERE 1=1';
  const params: unknown[] = [];

  if (eventType) {
    query += ' AND event_type = ?';
    params.push(eventType);
  }
  if (eventCategory) {
    query += ' AND event_category = ?';
    params.push(eventCategory);
  }
  if (playerId) {
    query += ' AND player_id = ?';
    params.push(playerId);
  }
  if (sessionId) {
    query += ' AND session_id = ?';
    params.push(sessionId);
  }
  if (since) {
    query += ' AND occurred_at >= ?';
    params.push(since);
  }

  query += ' ORDER BY occurred_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();

  const events: AnalyticsEvent[] = result.results.map((row) => ({
    id: row.id as string,
    sessionId: row.session_id as string | null,
    playerId: row.player_id as string | null,
    characterId: row.character_id as string | null,
    occurredAt: row.occurred_at as string,
    eventType: row.event_type as string | null,
    eventCategory: row.event_category as string | null,
    eventName: row.event_name as string | null,
    eventData: parseJsonField<Record<string, unknown> | null>(row.event_data, null),
    locationId: row.location_id as string | null,
    missionId: row.mission_id as string | null,
    coordinates: parseJsonField<{ x: number; y: number; z?: number } | null>(row.coordinates, null),
    sessionTimeSeconds: row.session_time_seconds as number | null,
    playtimeTotalSeconds: row.playtime_total_seconds as number | null,
    clientVersion: row.client_version as string | null,
    platform: row.platform as string | null,
    isDebug: (row.is_debug as number) === 1,
  }));

  return c.json({
    success: true,
    data: {
      events,
      pagination: { limit, offset },
    },
  });
});

// Get event aggregations
analyticsRoutes.get('/events/aggregate', authMiddleware, async (c) => {
  const db = c.env.DB;
  const groupBy = c.req.query('groupBy') || 'event_type';
  const since = c.req.query('since');

  const validGroupBy = ['event_type', 'event_category', 'event_name', 'platform'];
  if (!validGroupBy.includes(groupBy)) {
    throw new HTTPException(400, { message: `groupBy must be one of: ${validGroupBy.join(', ')}` });
  }

  let query = `SELECT ${groupBy}, COUNT(*) as count FROM analytics_events WHERE 1=1`;
  const params: unknown[] = [];

  if (since) {
    query += ' AND occurred_at >= ?';
    params.push(since);
  }

  query += ` GROUP BY ${groupBy} ORDER BY count DESC LIMIT 50`;

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();

  const aggregations = result.results.map((row) => ({
    value: row[groupBy] as string,
    count: row.count as number,
  }));

  return c.json({
    success: true,
    data: {
      groupBy,
      aggregations,
    },
  });
});

// ============================================
// PLAY SESSIONS
// ============================================

interface PlaySession {
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

// Start a new play session
analyticsRoutes.post('/sessions/start', authMiddleware, async (c) => {
  const { userId } = c.var;
  const db = c.env.DB;
  const body = await c.req.json();

  // Get player_id from user
  const player = await db
    .prepare('SELECT id FROM player_profiles WHERE user_id = ?')
    .bind(userId)
    .first();

  const playerId = player ? (player.id as string) : null;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO play_sessions (
        id, player_id, character_id, started_at,
        tier_at_start, rating_at_start, client_version, platform
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      playerId,
      body.characterId || null,
      now,
      body.tierAtStart || null,
      body.ratingAtStart || null,
      body.clientVersion || null,
      body.platform || null
    )
    .run();

  return c.json(
    {
      success: true,
      data: { sessionId: id, startedAt: now },
    },
    201
  );
});

// Update session (during gameplay)
analyticsRoutes.put('/sessions/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();

  const existing = await db
    .prepare('SELECT id FROM play_sessions WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    throw new HTTPException(404, { message: 'Session not found' });
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  const fields: Record<string, string> = {
    durationSeconds: 'duration_seconds',
    activeDurationSeconds: 'active_duration_seconds',
    idleDurationSeconds: 'idle_duration_seconds',
    missionsStarted: 'missions_started',
    missionsCompleted: 'missions_completed',
    deliveriesCompleted: 'deliveries_completed',
    creditsEarned: 'credits_earned',
    creditsSpent: 'credits_spent',
    xpEarned: 'xp_earned',
    distanceTraveledKm: 'distance_traveled_km',
    enemiesDefeated: 'enemies_defeated',
    deaths: 'deaths',
    averageFps: 'average_fps',
    crashes: 'crashes',
    loadTimeAverageSeconds: 'load_time_average_seconds',
    sessionQualityScore: 'session_quality_score',
  };

  for (const [jsKey, dbKey] of Object.entries(fields)) {
    if (body[jsKey] !== undefined) {
      updates.push(`${dbKey} = ?`);
      values.push(body[jsKey]);
    }
  }

  if (updates.length > 0) {
    values.push(id);
    await db
      .prepare(`UPDATE play_sessions SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  return c.json({
    success: true,
    data: { message: 'Session updated' },
  });
});

// End session
analyticsRoutes.post('/sessions/:id/end', authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();

  const session = await db
    .prepare('SELECT started_at FROM play_sessions WHERE id = ?')
    .bind(id)
    .first();

  if (!session) {
    throw new HTTPException(404, { message: 'Session not found' });
  }

  const now = new Date().toISOString();
  const startedAt = new Date(session.started_at as string);
  const endedAt = new Date(now);
  const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

  await db
    .prepare(
      `UPDATE play_sessions SET
        ended_at = ?,
        duration_seconds = ?,
        tier_at_end = ?,
        rating_at_end = ?,
        missions_completed = COALESCE(?, missions_completed),
        credits_earned = COALESCE(?, credits_earned),
        xp_earned = COALESCE(?, xp_earned),
        deaths = COALESCE(?, deaths),
        session_quality_score = COALESCE(?, session_quality_score)
       WHERE id = ?`
    )
    .bind(
      now,
      durationSeconds,
      body.tierAtEnd || null,
      body.ratingAtEnd || null,
      body.missionsCompleted || null,
      body.creditsEarned || null,
      body.xpEarned || null,
      body.deaths || null,
      body.sessionQualityScore || null,
      id
    )
    .run();

  return c.json({
    success: true,
    data: {
      sessionId: id,
      endedAt: now,
      durationSeconds,
    },
  });
});

// Get session by ID
analyticsRoutes.get('/sessions/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  const result = await db
    .prepare('SELECT * FROM play_sessions WHERE id = ?')
    .bind(id)
    .first();

  if (!result) {
    throw new HTTPException(404, { message: 'Session not found' });
  }

  const session: PlaySession = {
    id: result.id as string,
    playerId: result.player_id as string | null,
    characterId: result.character_id as string | null,
    startedAt: result.started_at as string,
    endedAt: result.ended_at as string | null,
    durationSeconds: result.duration_seconds as number,
    activeDurationSeconds: result.active_duration_seconds as number,
    idleDurationSeconds: result.idle_duration_seconds as number,
    missionsStarted: result.missions_started as number,
    missionsCompleted: result.missions_completed as number,
    deliveriesCompleted: result.deliveries_completed as number,
    creditsEarned: result.credits_earned as number,
    creditsSpent: result.credits_spent as number,
    xpEarned: result.xp_earned as number,
    distanceTraveledKm: result.distance_traveled_km as number,
    enemiesDefeated: result.enemies_defeated as number,
    deaths: result.deaths as number,
    tierAtStart: result.tier_at_start as number | null,
    tierAtEnd: result.tier_at_end as number | null,
    ratingAtStart: result.rating_at_start as number | null,
    ratingAtEnd: result.rating_at_end as number | null,
    averageFps: result.average_fps as number | null,
    crashes: result.crashes as number,
    loadTimeAverageSeconds: result.load_time_average_seconds as number | null,
    clientVersion: result.client_version as string | null,
    platform: result.platform as string | null,
    sessionQualityScore: result.session_quality_score as number,
  };

  return c.json({
    success: true,
    data: { session },
  });
});

// Get player's session history
analyticsRoutes.get('/sessions', authMiddleware, async (c) => {
  const { userId } = c.var;
  const db = c.env.DB;
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  // Get player_id from user
  const player = await db
    .prepare('SELECT id FROM player_profiles WHERE user_id = ?')
    .bind(userId)
    .first();

  if (!player) {
    return c.json({
      success: true,
      data: { sessions: [], total: 0 },
    });
  }

  const playerId = player.id as string;

  const countResult = await db
    .prepare('SELECT COUNT(*) as count FROM play_sessions WHERE player_id = ?')
    .bind(playerId)
    .first();

  const total = (countResult?.count as number) || 0;

  const result = await db
    .prepare(
      `SELECT * FROM play_sessions
       WHERE player_id = ?
       ORDER BY started_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(playerId, limit, offset)
    .all();

  const sessions = result.results.map((row) => ({
    id: row.id as string,
    startedAt: row.started_at as string,
    endedAt: row.ended_at as string | null,
    durationSeconds: row.duration_seconds as number,
    missionsCompleted: row.missions_completed as number,
    creditsEarned: row.credits_earned as number,
    xpEarned: row.xp_earned as number,
    deaths: row.deaths as number,
    platform: row.platform as string | null,
    sessionQualityScore: row.session_quality_score as number,
  }));

  return c.json({
    success: true,
    data: {
      sessions,
      total,
      pagination: { limit, offset },
    },
  });
});

// Get player stats aggregated from sessions
analyticsRoutes.get('/sessions/stats', authMiddleware, async (c) => {
  const { userId } = c.var;
  const db = c.env.DB;

  // Get player_id from user
  const player = await db
    .prepare('SELECT id FROM player_profiles WHERE user_id = ?')
    .bind(userId)
    .first();

  if (!player) {
    return c.json({
      success: true,
      data: { stats: null },
    });
  }

  const playerId = player.id as string;

  const result = await db
    .prepare(
      `SELECT
        COUNT(*) as total_sessions,
        SUM(duration_seconds) as total_playtime_seconds,
        AVG(duration_seconds) as avg_session_seconds,
        MAX(duration_seconds) as longest_session_seconds,
        SUM(missions_started) as total_missions_started,
        SUM(missions_completed) as total_missions_completed,
        SUM(deliveries_completed) as total_deliveries,
        SUM(credits_earned) as total_credits_earned,
        SUM(credits_spent) as total_credits_spent,
        SUM(xp_earned) as total_xp_earned,
        SUM(distance_traveled_km) as total_distance_km,
        SUM(enemies_defeated) as total_enemies_defeated,
        SUM(deaths) as total_deaths,
        AVG(average_fps) as avg_fps,
        SUM(crashes) as total_crashes,
        AVG(session_quality_score) as avg_quality_score
       FROM play_sessions WHERE player_id = ?`
    )
    .bind(playerId)
    .first();

  if (!result || !result.total_sessions) {
    return c.json({
      success: true,
      data: { stats: null },
    });
  }

  const stats = {
    totalSessions: result.total_sessions as number,
    totalPlaytimeSeconds: result.total_playtime_seconds as number,
    totalPlaytimeHours: Math.round(((result.total_playtime_seconds as number) / 3600) * 10) / 10,
    avgSessionMinutes: Math.round(((result.avg_session_seconds as number) / 60) * 10) / 10,
    longestSessionMinutes: Math.round(((result.longest_session_seconds as number) / 60) * 10) / 10,
    totalMissionsStarted: result.total_missions_started as number,
    totalMissionsCompleted: result.total_missions_completed as number,
    missionCompletionRate:
      (result.total_missions_started as number) > 0
        ? Math.round(
            ((result.total_missions_completed as number) /
              (result.total_missions_started as number)) *
              100
          )
        : 0,
    totalDeliveries: result.total_deliveries as number,
    totalCreditsEarned: result.total_credits_earned as number,
    totalCreditsSpent: result.total_credits_spent as number,
    netCredits: (result.total_credits_earned as number) - (result.total_credits_spent as number),
    totalXpEarned: result.total_xp_earned as number,
    totalDistanceKm: Math.round((result.total_distance_km as number) * 10) / 10,
    totalEnemiesDefeated: result.total_enemies_defeated as number,
    totalDeaths: result.total_deaths as number,
    kdRatio:
      (result.total_deaths as number) > 0
        ? Math.round(
            ((result.total_enemies_defeated as number) / (result.total_deaths as number)) * 100
          ) / 100
        : result.total_enemies_defeated as number,
    avgFps: Math.round((result.avg_fps as number) * 10) / 10,
    totalCrashes: result.total_crashes as number,
    avgQualityScore: Math.round((result.avg_quality_score as number) * 10) / 10,
  };

  return c.json({
    success: true,
    data: { stats },
  });
});

export default analyticsRoutes;
