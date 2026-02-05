/**
 * Surge Protocol - Leaderboards System Routes
 *
 * Endpoints for global and periodic leaderboards.
 *
 * Endpoints:
 * - GET /leaderboards - List all leaderboards
 * - GET /leaderboards/:id - Get leaderboard details and top entries
 * - GET /leaderboards/:id/rank - Get player's rank on a leaderboard
 * - GET /leaderboards/:id/nearby - Get entries near player's rank
 * - GET /leaderboards/:id/history - Get player's historical rankings
 * - POST /leaderboards/:id/submit - Submit a score (internal use)
 * - GET /leaderboards/my-rankings - Get player's rankings across all leaderboards
 * - GET /leaderboards/categories - Get leaderboard categories
 * - GET /leaderboards/periods - Get available time periods
 * - GET /leaderboards/rewards - Get leaderboard reward info
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

interface LeaderboardRow {
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

interface EntryRow {
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

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const submitScoreSchema = z.object({
  score: z.number().int(),
  characterName: z.string().optional(),
  characterTier: z.number().int().min(1).max(10).optional(),
  characterTrack: z.string().optional(),
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

function formatLeaderboard(row: LeaderboardRow) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    type: row.leaderboard_type,
    scope: row.scope,
    trackedStat: row.tracked_stat,
    sortDirection: row.sort_direction,
    resetFrequency: row.reset_frequency,
    currentPeriod: {
      start: row.current_period_start,
      end: row.current_period_end,
    },
    display: {
      topN: row.display_top_n,
      showPlayerRank: row.show_player_rank === 1,
      showNearbyRanks: row.show_nearby_ranks,
    },
    requirements: {
      minimumPlaytime: row.minimum_playtime,
      minimumTier: row.minimum_tier,
    },
    rewards: parseJsonField<Record<string, unknown> | null>(row.period_end_rewards, null),
    isVisible: row.visible === 1,
  };
}

function formatEntry(row: EntryRow, playerProfile?: { display_name: string | null }) {
  return {
    id: row.id,
    playerId: row.player_id,
    playerName: playerProfile?.display_name || null,
    characterName: row.character_name,
    characterTier: row.character_tier,
    characterTrack: row.character_track,
    score: row.score,
    rank: row.rank,
    rankChange: row.rank_change,
    firstEntry: row.first_entry,
    lastUpdate: row.last_update,
    isVerified: row.verified === 1,
  };
}

function getCurrentPeriodId(resetFrequency: string | null): string {
  const now = new Date();
  switch (resetFrequency) {
    case 'DAILY':
      return now.toISOString().split('T')[0] as string;
    case 'WEEKLY':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return `W${weekStart.toISOString().split('T')[0]}`;
    case 'MONTHLY':
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    case 'SEASONAL':
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      return `${now.getFullYear()}-Q${quarter}`;
    case 'YEARLY':
      return `${now.getFullYear()}`;
    default:
      return 'ALL_TIME';
  }
}

// =============================================================================
// ROUTES
// =============================================================================

export const leaderboardRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Apply auth middleware to all routes
leaderboardRoutes.use('*', authMiddleware());

/**
 * GET /leaderboards
 * List all visible leaderboards.
 */
leaderboardRoutes.get('/', async (c) => {
  const type = c.req.query('type');
  const scope = c.req.query('scope');

  let query = 'SELECT * FROM leaderboard_definitions WHERE visible = 1';
  const params: string[] = [];

  if (type) {
    query += ' AND leaderboard_type = ?';
    params.push(type);
  }

  if (scope) {
    query += ' AND scope = ?';
    params.push(scope);
  }

  query += ' ORDER BY leaderboard_type, name';

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all<LeaderboardRow>();

  // Group by type
  const byType: Record<string, ReturnType<typeof formatLeaderboard>[]> = {};
  for (const row of result.results) {
    const leaderboard = formatLeaderboard(row);
    const type = leaderboard.type || 'OTHER';
    if (!byType[type]) byType[type] = [];
    byType[type]!.push(leaderboard);
  }

  return c.json({
    success: true,
    data: {
      leaderboards: result.results.map(formatLeaderboard),
      byType,
      count: result.results.length,
    },
  });
});

/**
 * GET /leaderboards/categories
 * Get leaderboard categories and types.
 */
leaderboardRoutes.get('/categories', async (c) => {
  const result = await c.env.DB
    .prepare(
      `SELECT leaderboard_type, scope, COUNT(*) as count
       FROM leaderboard_definitions
       WHERE visible = 1
       GROUP BY leaderboard_type, scope`
    )
    .all<{ leaderboard_type: string | null; scope: string | null; count: number }>();

  const types: Record<string, number> = {};
  const scopes: Record<string, number> = {};

  for (const row of result.results) {
    const t = row.leaderboard_type || 'OTHER';
    const s = row.scope || 'GLOBAL';
    types[t] = (types[t] || 0) + row.count;
    scopes[s] = (scopes[s] || 0) + row.count;
  }

  return c.json({
    success: true,
    data: {
      types,
      scopes,
    },
  });
});

/**
 * GET /leaderboards/periods
 * Get available time periods for leaderboards.
 */
leaderboardRoutes.get('/periods', async (c) => {
  const now = new Date();

  return c.json({
    success: true,
    data: {
      current: {
        daily: getCurrentPeriodId('DAILY'),
        weekly: getCurrentPeriodId('WEEKLY'),
        monthly: getCurrentPeriodId('MONTHLY'),
        seasonal: getCurrentPeriodId('SEASONAL'),
        yearly: getCurrentPeriodId('YEARLY'),
        allTime: 'ALL_TIME',
      },
      serverTime: now.toISOString(),
    },
  });
});

/**
 * GET /leaderboards/rewards
 * Get upcoming leaderboard rewards.
 */
leaderboardRoutes.get('/rewards', async (c) => {
  const leaderboards = await c.env.DB
    .prepare(
      `SELECT id, code, name, reset_frequency, current_period_end, period_end_rewards
       FROM leaderboard_definitions
       WHERE visible = 1 AND period_end_rewards IS NOT NULL
       ORDER BY current_period_end`
    )
    .all<{
      id: string;
      code: string;
      name: string;
      reset_frequency: string | null;
      current_period_end: string | null;
      period_end_rewards: string | null;
    }>();

  const rewards = leaderboards.results.map(lb => ({
    leaderboardId: lb.id,
    leaderboardCode: lb.code,
    leaderboardName: lb.name,
    resetFrequency: lb.reset_frequency,
    periodEnd: lb.current_period_end,
    rewards: parseJsonField<Record<string, unknown>>(lb.period_end_rewards, {}),
  }));

  return c.json({
    success: true,
    data: {
      upcomingRewards: rewards,
    },
  });
});

/**
 * GET /leaderboards/my-rankings
 * Get player's rankings across all leaderboards.
 */
leaderboardRoutes.get('/my-rankings', async (c) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  const entries = await c.env.DB
    .prepare(
      `SELECT le.*, ld.code, ld.name as leaderboard_name, ld.leaderboard_type
       FROM leaderboard_entries le
       JOIN leaderboard_definitions ld ON le.leaderboard_id = ld.id
       WHERE le.player_id = ?
       ORDER BY le.rank ASC`
    )
    .bind(userId)
    .all<EntryRow & { code: string; leaderboard_name: string; leaderboard_type: string | null }>();

  const rankings = entries.results.map(e => ({
    leaderboard: {
      id: e.leaderboard_id,
      code: e.code,
      name: e.leaderboard_name,
      type: e.leaderboard_type,
    },
    score: e.score,
    rank: e.rank,
    rankChange: e.rank_change,
    characterName: e.character_name,
    lastUpdate: e.last_update,
  }));

  // Summary stats
  const totalLeaderboards = rankings.length;
  const topTenCount = rankings.filter(r => (r.rank || 999) <= 10).length;
  const topHundredCount = rankings.filter(r => (r.rank || 999) <= 100).length;
  const bestRank = rankings.length > 0
    ? Math.min(...rankings.map(r => r.rank || 999))
    : null;

  return c.json({
    success: true,
    data: {
      rankings,
      summary: {
        totalLeaderboards,
        topTenCount,
        topHundredCount,
        bestRank,
      },
    },
  });
});

/**
 * GET /leaderboards/:id
 * Get leaderboard details and top entries.
 */
leaderboardRoutes.get('/:id', async (c) => {
  const leaderboardId = c.req.param('id');
  const period = c.req.query('period');
  const limit = Math.min(parseInt(c.req.query('limit') || '100', 10), 500);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  // Get leaderboard definition
  const leaderboard = await c.env.DB
    .prepare('SELECT * FROM leaderboard_definitions WHERE id = ? OR code = ?')
    .bind(leaderboardId, leaderboardId)
    .first<LeaderboardRow>();

  if (!leaderboard) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Leaderboard not found' }],
    }, 404);
  }

  // Determine period
  const periodId = period || getCurrentPeriodId(leaderboard.reset_frequency);

  // Get entries
  let entriesQuery = `
    SELECT le.*, pp.display_name
    FROM leaderboard_entries le
    LEFT JOIN player_profiles pp ON le.player_id = pp.id
    WHERE le.leaderboard_id = ?
  `;

  const params: (string | number)[] = [leaderboard.id];

  if (leaderboard.reset_frequency) {
    entriesQuery += ' AND le.period_id = ?';
    params.push(periodId);
  }

  entriesQuery += ` ORDER BY le.${leaderboard.sort_direction === 'ASC' ? 'score ASC' : 'score DESC'}, le.last_update ASC`;
  entriesQuery += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const entries = await c.env.DB
    .prepare(entriesQuery)
    .bind(...params)
    .all<EntryRow & { display_name: string | null }>();

  // Calculate ranks (if not stored)
  const rankedEntries = entries.results.map((e, idx) => ({
    ...formatEntry(e, { display_name: e.display_name }),
    rank: e.rank ?? offset + idx + 1,
  }));

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM leaderboard_entries WHERE leaderboard_id = ?';
  const countParams: string[] = [leaderboard.id];

  if (leaderboard.reset_frequency) {
    countQuery += ' AND period_id = ?';
    countParams.push(periodId);
  }

  const countResult = await c.env.DB
    .prepare(countQuery)
    .bind(...countParams)
    .first<{ total: number }>();

  return c.json({
    success: true,
    data: {
      leaderboard: formatLeaderboard(leaderboard),
      period: periodId,
      entries: rankedEntries,
      pagination: {
        total: countResult?.total || 0,
        limit,
        offset,
        hasMore: offset + rankedEntries.length < (countResult?.total || 0),
      },
    },
  });
});

/**
 * GET /leaderboards/:id/rank
 * Get player's rank on a specific leaderboard.
 */
leaderboardRoutes.get('/:id/rank', async (c) => {
  const leaderboardId = c.req.param('id');
  const userId = c.get('userId');
  const period = c.req.query('period');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  // Get leaderboard
  const leaderboard = await c.env.DB
    .prepare('SELECT * FROM leaderboard_definitions WHERE id = ? OR code = ?')
    .bind(leaderboardId, leaderboardId)
    .first<LeaderboardRow>();

  if (!leaderboard) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Leaderboard not found' }],
    }, 404);
  }

  const periodId = period || getCurrentPeriodId(leaderboard.reset_frequency);

  // Get player's entry
  let entryQuery = `
    SELECT le.*, pp.display_name
    FROM leaderboard_entries le
    LEFT JOIN player_profiles pp ON le.player_id = pp.id
    WHERE le.leaderboard_id = ? AND le.player_id = ?
  `;

  const params: string[] = [leaderboard.id, userId];

  if (leaderboard.reset_frequency) {
    entryQuery += ' AND le.period_id = ?';
    params.push(periodId);
  }

  const entry = await c.env.DB
    .prepare(entryQuery)
    .bind(...params)
    .first<EntryRow & { display_name: string | null }>();

  if (!entry) {
    return c.json({
      success: true,
      data: {
        leaderboard: {
          id: leaderboard.id,
          code: leaderboard.code,
          name: leaderboard.name,
        },
        period: periodId,
        entry: null,
        message: 'Not ranked on this leaderboard',
      },
    });
  }

  // Calculate rank if not stored
  let rank = entry.rank;
  if (!rank) {
    const rankQuery = leaderboard.sort_direction === 'ASC'
      ? 'SELECT COUNT(*) as better FROM leaderboard_entries WHERE leaderboard_id = ? AND score < ?'
      : 'SELECT COUNT(*) as better FROM leaderboard_entries WHERE leaderboard_id = ? AND score > ?';

    const rankResult = await c.env.DB
      .prepare(rankQuery)
      .bind(leaderboard.id, entry.score)
      .first<{ better: number }>();

    rank = (rankResult?.better || 0) + 1;
  }

  return c.json({
    success: true,
    data: {
      leaderboard: {
        id: leaderboard.id,
        code: leaderboard.code,
        name: leaderboard.name,
      },
      period: periodId,
      entry: {
        ...formatEntry(entry, { display_name: entry.display_name }),
        rank,
      },
    },
  });
});

/**
 * GET /leaderboards/:id/nearby
 * Get entries near player's rank.
 */
leaderboardRoutes.get('/:id/nearby', async (c) => {
  const leaderboardId = c.req.param('id');
  const userId = c.get('userId');
  const period = c.req.query('period');
  const range = Math.min(parseInt(c.req.query('range') || '5', 10), 20);

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  // Get leaderboard
  const leaderboard = await c.env.DB
    .prepare('SELECT * FROM leaderboard_definitions WHERE id = ? OR code = ?')
    .bind(leaderboardId, leaderboardId)
    .first<LeaderboardRow>();

  if (!leaderboard) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Leaderboard not found' }],
    }, 404);
  }

  const periodId = period || getCurrentPeriodId(leaderboard.reset_frequency);

  // Get player's entry
  const playerEntry = await c.env.DB
    .prepare(
      `SELECT score FROM leaderboard_entries
       WHERE leaderboard_id = ? AND player_id = ?${leaderboard.reset_frequency ? ' AND period_id = ?' : ''}`
    )
    .bind(leaderboard.id, userId, ...(leaderboard.reset_frequency ? [periodId] : []))
    .first<{ score: number }>();

  if (!playerEntry) {
    return c.json({
      success: true,
      data: {
        leaderboard: {
          id: leaderboard.id,
          code: leaderboard.code,
          name: leaderboard.name,
        },
        period: periodId,
        entries: [],
        playerRank: null,
        message: 'Not ranked on this leaderboard',
      },
    });
  }

  // Get nearby entries
  const sortDir = leaderboard.sort_direction === 'ASC' ? 'ASC' : 'DESC';
  const compareOp = sortDir === 'ASC' ? '<=' : '>=';

  const nearbyQuery = `
    SELECT le.*, pp.display_name,
           (SELECT COUNT(*) + 1 FROM leaderboard_entries
            WHERE leaderboard_id = le.leaderboard_id
            AND score ${sortDir === 'ASC' ? '<' : '>'} le.score) as calculated_rank
    FROM leaderboard_entries le
    LEFT JOIN player_profiles pp ON le.player_id = pp.id
    WHERE le.leaderboard_id = ?
      ${leaderboard.reset_frequency ? 'AND le.period_id = ?' : ''}
      AND le.score ${compareOp} ? + ${range * 100}
      AND le.score ${sortDir === 'ASC' ? '>=' : '<='} ? - ${range * 100}
    ORDER BY le.score ${sortDir}
    LIMIT ${range * 2 + 1}
  `;

  const nearbyParams = [
    leaderboard.id,
    ...(leaderboard.reset_frequency ? [periodId] : []),
    playerEntry.score,
    playerEntry.score,
  ];

  const nearby = await c.env.DB
    .prepare(nearbyQuery)
    .bind(...nearbyParams)
    .all<EntryRow & { display_name: string | null; calculated_rank: number }>();

  const entries = nearby.results.map(e => ({
    ...formatEntry(e, { display_name: e.display_name }),
    rank: e.rank || e.calculated_rank,
    isCurrentPlayer: e.player_id === userId,
  }));

  const playerRankEntry = entries.find(e => e.isCurrentPlayer);

  return c.json({
    success: true,
    data: {
      leaderboard: {
        id: leaderboard.id,
        code: leaderboard.code,
        name: leaderboard.name,
      },
      period: periodId,
      entries,
      playerRank: playerRankEntry?.rank || null,
    },
  });
});

/**
 * GET /leaderboards/:id/history
 * Get player's historical rankings on a leaderboard.
 */
leaderboardRoutes.get('/:id/history', async (c) => {
  const leaderboardId = c.req.param('id');
  const userId = c.get('userId');
  const limit = Math.min(parseInt(c.req.query('limit') || '10', 10), 50);

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  // Get leaderboard
  const leaderboard = await c.env.DB
    .prepare('SELECT id, code, name FROM leaderboard_definitions WHERE id = ? OR code = ?')
    .bind(leaderboardId, leaderboardId)
    .first<{ id: string; code: string; name: string }>();

  if (!leaderboard) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Leaderboard not found' }],
    }, 404);
  }

  // Get historical entries
  const history = await c.env.DB
    .prepare(
      `SELECT period_id, score, rank, rank_change, character_name, last_update
       FROM leaderboard_entries
       WHERE leaderboard_id = ? AND player_id = ?
       ORDER BY period_id DESC
       LIMIT ?`
    )
    .bind(leaderboard.id, userId, limit)
    .all<{
      period_id: string | null;
      score: number;
      rank: number | null;
      rank_change: number;
      character_name: string | null;
      last_update: string | null;
    }>();

  return c.json({
    success: true,
    data: {
      leaderboard: {
        id: leaderboard.id,
        code: leaderboard.code,
        name: leaderboard.name,
      },
      history: history.results.map(h => ({
        period: h.period_id,
        score: h.score,
        rank: h.rank,
        rankChange: h.rank_change,
        characterName: h.character_name,
        lastUpdate: h.last_update,
      })),
    },
  });
});

/**
 * POST /leaderboards/:id/submit
 * Submit a score to a leaderboard (internal use).
 */
leaderboardRoutes.post('/:id/submit', zValidator('json', submitScoreSchema), async (c) => {
  const leaderboardId = c.req.param('id');
  const userId = c.get('userId');
  const { score, characterName, characterTier, characterTrack } = c.req.valid('json');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_USER', message: 'Authentication required' }],
    }, 401);
  }

  // Get leaderboard
  const leaderboard = await c.env.DB
    .prepare('SELECT * FROM leaderboard_definitions WHERE id = ? OR code = ?')
    .bind(leaderboardId, leaderboardId)
    .first<LeaderboardRow>();

  if (!leaderboard) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Leaderboard not found' }],
    }, 404);
  }

  const periodId = getCurrentPeriodId(leaderboard.reset_frequency);

  // Check for existing entry
  const existing = await c.env.DB
    .prepare(
      `SELECT id, score, rank FROM leaderboard_entries
       WHERE leaderboard_id = ? AND player_id = ?${leaderboard.reset_frequency ? ' AND period_id = ?' : ''}`
    )
    .bind(leaderboard.id, userId, ...(leaderboard.reset_frequency ? [periodId] : []))
    .first<{ id: string; score: number; rank: number | null }>();

  const now = new Date().toISOString();

  if (existing) {
    // Update if new score is better
    const isBetter = leaderboard.sort_direction === 'ASC'
      ? score < existing.score
      : score > existing.score;

    if (isBetter) {
      await c.env.DB
        .prepare(
          `UPDATE leaderboard_entries
           SET score = ?, character_name = ?, character_tier = ?, character_track = ?, last_update = ?
           WHERE id = ?`
        )
        .bind(score, characterName || null, characterTier || null, characterTrack || null, now, existing.id)
        .run();

      return c.json({
        success: true,
        data: {
          updated: true,
          previousScore: existing.score,
          newScore: score,
          improvement: leaderboard.sort_direction === 'ASC'
            ? existing.score - score
            : score - existing.score,
          message: 'New personal best!',
        },
      });
    }

    return c.json({
      success: true,
      data: {
        updated: false,
        currentScore: existing.score,
        attemptedScore: score,
        message: 'Score not higher than current best',
      },
    });
  }

  // Create new entry
  const { nanoid } = await import('nanoid');
  const entryId = nanoid();

  await c.env.DB
    .prepare(
      `INSERT INTO leaderboard_entries
       (id, leaderboard_id, player_id, period_id, score, character_name, character_tier, character_track, first_entry, last_update)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      entryId,
      leaderboard.id,
      userId,
      leaderboard.reset_frequency ? periodId : null,
      score,
      characterName || null,
      characterTier || null,
      characterTrack || null,
      now,
      now
    )
    .run();

  return c.json({
    success: true,
    data: {
      created: true,
      entryId,
      score,
      period: periodId,
      message: 'Score submitted successfully',
    },
  });
});
