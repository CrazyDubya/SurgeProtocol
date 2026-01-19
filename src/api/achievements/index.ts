/**
 * Surge Protocol - Achievements System Routes
 *
 * Endpoints:
 *
 * Achievement Definitions:
 * - GET /achievements - List all achievements with filtering
 * - GET /achievements/categories - List achievement categories
 * - GET /achievements/:id - Get achievement details
 *
 * Character Progress:
 * - GET /achievements/character - Get character's achievement progress
 * - GET /achievements/character/recent - Get recently unlocked
 * - POST /achievements/:id/check - Check if achievement criteria met
 * - POST /achievements/:id/unlock - Unlock an achievement
 * - POST /achievements/:id/progress - Update progress counter
 *
 * Milestones:
 * - GET /achievements/milestones - List milestone definitions
 * - GET /achievements/milestones/character - Get character milestone progress
 *
 * Leaderboards:
 * - GET /achievements/leaderboards - List leaderboard types
 * - GET /achievements/leaderboards/:type - Get leaderboard entries
 */

import { Hono } from 'hono';
import type { AuthVariables } from '../../middleware/auth';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

interface AchievementDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  hidden_description: string | null;
  achievement_type: string | null;
  category: string | null;
  difficulty: number;
  rarity: string | null;
  points: number;
  unlock_conditions: string | null;
  counter_target: number | null;
  counter_type: string | null;
  is_hidden: number;
  is_secret: number;
  xp_reward: number | null;
  credit_reward: number | null;
  item_reward_id: string | null;
  title_reward: string | null;
  cosmetic_reward: string | null;
  series_id: string | null;
  series_order: number | null;
  prerequisite_achievement_id: string | null;
  icon_asset: string | null;
  icon_locked_asset: string | null;
  banner_asset: string | null;
  is_missable: number;
  is_one_per_playthrough: number;
  created_at: string;
  updated_at: string;
}

interface CharacterAchievement {
  id: string;
  character_id: string;
  achievement_id: string;
  status: string;
  unlocked_at: string | null;
  current_counter: number;
  target_counter: number;
  percent_complete: number;
  first_progress_at: string | null;
  last_progress_at: string | null;
  rewards_claimed: number;
  rewards_claimed_at: string | null;
  difficulty_at_unlock: string | null;
  playtime_at_unlock_hours: number | null;
  is_new: number;
}

interface MilestoneDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  milestone_type: string | null;
  category: string | null;
  display_order: number;
  tracked_stat: string;
  thresholds: string | null;
  display_format: string | null;
  rewards_per_threshold: string | null;
  icon_asset: string | null;
  show_on_profile: number;
  leaderboard_eligible: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatAchievement(ach: AchievementDefinition, includeHidden = false) {
  const isHidden = ach.is_hidden === 1 || ach.is_secret === 1;

  return {
    id: ach.id,
    code: ach.code,
    name: isHidden && !includeHidden ? '???' : ach.name,
    description: isHidden && !includeHidden ? ach.hidden_description || '???' : ach.description,
    classification: {
      type: ach.achievement_type,
      category: ach.category,
      difficulty: ach.difficulty,
      rarity: ach.rarity,
      points: ach.points,
    },
    tracking: {
      counterTarget: ach.counter_target,
      counterType: ach.counter_type,
      unlockConditions: !isHidden || includeHidden
        ? (ach.unlock_conditions ? JSON.parse(ach.unlock_conditions) : null)
        : null,
    },
    visibility: {
      isHidden: ach.is_hidden === 1,
      isSecret: ach.is_secret === 1,
    },
    rewards: {
      xp: ach.xp_reward,
      credits: ach.credit_reward,
      itemId: ach.item_reward_id,
      title: ach.title_reward,
      cosmetic: ach.cosmetic_reward ? JSON.parse(ach.cosmetic_reward) : null,
    },
    series: ach.series_id ? {
      id: ach.series_id,
      order: ach.series_order,
      prerequisiteId: ach.prerequisite_achievement_id,
    } : null,
    assets: {
      icon: ach.icon_asset,
      iconLocked: ach.icon_locked_asset,
      banner: ach.banner_asset,
    },
    meta: {
      isMissable: ach.is_missable === 1,
      isOnePerPlaythrough: ach.is_one_per_playthrough === 1,
    },
  };
}

function formatCharacterAchievement(
  ca: CharacterAchievement,
  definition?: AchievementDefinition
) {
  return {
    id: ca.id,
    achievementId: ca.achievement_id,
    status: ca.status,
    unlockedAt: ca.unlocked_at,
    progress: {
      current: ca.current_counter,
      target: ca.target_counter,
      percent: ca.percent_complete,
    },
    tracking: {
      firstProgressAt: ca.first_progress_at,
      lastProgressAt: ca.last_progress_at,
    },
    rewards: {
      claimed: ca.rewards_claimed === 1,
      claimedAt: ca.rewards_claimed_at,
    },
    unlockContext: ca.unlocked_at ? {
      difficulty: ca.difficulty_at_unlock,
      playtimeHours: ca.playtime_at_unlock_hours,
    } : null,
    isNew: ca.is_new === 1,
    definition: definition ? formatAchievement(definition, true) : undefined,
  };
}

function formatMilestone(milestone: MilestoneDefinition) {
  return {
    id: milestone.id,
    code: milestone.code,
    name: milestone.name,
    description: milestone.description,
    type: milestone.milestone_type,
    category: milestone.category,
    displayOrder: milestone.display_order,
    tracking: {
      stat: milestone.tracked_stat,
      thresholds: milestone.thresholds ? JSON.parse(milestone.thresholds) : [],
      displayFormat: milestone.display_format,
    },
    rewards: milestone.rewards_per_threshold
      ? JSON.parse(milestone.rewards_per_threshold)
      : null,
    display: {
      icon: milestone.icon_asset,
      showOnProfile: milestone.show_on_profile === 1,
      leaderboardEligible: milestone.leaderboard_eligible === 1,
    },
  };
}

// =============================================================================
// ROUTES
// =============================================================================

export const achievementRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// =============================================================================
// ACHIEVEMENT DEFINITION ENDPOINTS
// =============================================================================

/**
 * GET /achievements
 * List all achievements with filtering.
 */
achievementRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const category = c.req.query('category');
  const type = c.req.query('type');
  const rarity = c.req.query('rarity');
  const seriesId = c.req.query('seriesId');
  const includeHidden = c.req.query('includeHidden') === 'true';
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  let sql = `SELECT * FROM achievement_definitions WHERE 1=1`;
  const params: unknown[] = [];

  if (category) {
    sql += ` AND category = ?`;
    params.push(category);
  }

  if (type) {
    sql += ` AND achievement_type = ?`;
    params.push(type);
  }

  if (rarity) {
    sql += ` AND rarity = ?`;
    params.push(rarity);
  }

  if (seriesId) {
    sql += ` AND series_id = ?`;
    params.push(seriesId);
  }

  if (!includeHidden) {
    sql += ` AND is_hidden = 0 AND is_secret = 0`;
  }

  sql += ` ORDER BY category ASC, difficulty ASC, name ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<AchievementDefinition>();

  const achievements = result.results.map(a => formatAchievement(a, includeHidden));

  // Get total count
  let countSql = `SELECT COUNT(*) as total FROM achievement_definitions WHERE 1=1`;
  const countParams: unknown[] = [];

  if (category) {
    countSql += ` AND category = ?`;
    countParams.push(category);
  }
  if (type) {
    countSql += ` AND achievement_type = ?`;
    countParams.push(type);
  }
  if (rarity) {
    countSql += ` AND rarity = ?`;
    countParams.push(rarity);
  }
  if (seriesId) {
    countSql += ` AND series_id = ?`;
    countParams.push(seriesId);
  }
  if (!includeHidden) {
    countSql += ` AND is_hidden = 0 AND is_secret = 0`;
  }

  const countResult = await db
    .prepare(countSql)
    .bind(...countParams)
    .first<{ total: number }>();

  return c.json({
    success: true,
    data: {
      achievements,
      pagination: {
        total: countResult?.total || 0,
        limit,
        offset,
        hasMore: offset + achievements.length < (countResult?.total || 0),
      },
    },
  });
});

/**
 * GET /achievements/categories
 * List achievement categories with counts.
 */
achievementRoutes.get('/categories', async (c) => {
  const db = c.env.DB;

  const result = await db
    .prepare(`
      SELECT category, COUNT(*) as count, SUM(points) as total_points
      FROM achievement_definitions
      WHERE is_hidden = 0
      GROUP BY category
      ORDER BY category ASC
    `)
    .all<{ category: string; count: number; total_points: number }>();

  const categories = result.results.map(cat => ({
    name: cat.category,
    achievementCount: cat.count,
    totalPoints: cat.total_points,
  }));

  return c.json({
    success: true,
    data: {
      categories,
      count: categories.length,
    },
  });
});

/**
 * GET /achievements/:id
 * Get achievement details.
 */
achievementRoutes.get('/:id', async (c) => {
  const db = c.env.DB;
  const achId = c.req.param('id');

  let achievement = await db
    .prepare(`SELECT * FROM achievement_definitions WHERE id = ?`)
    .bind(achId)
    .first<AchievementDefinition>();

  if (!achievement) {
    achievement = await db
      .prepare(`SELECT * FROM achievement_definitions WHERE code = ?`)
      .bind(achId)
      .first<AchievementDefinition>();
  }

  if (!achievement) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Achievement not found' }],
    }, 404);
  }

  // Get prerequisite if any
  let prerequisite = null;
  if (achievement.prerequisite_achievement_id) {
    prerequisite = await db
      .prepare(`SELECT id, code, name FROM achievement_definitions WHERE id = ?`)
      .bind(achievement.prerequisite_achievement_id)
      .first();
  }

  // Get series siblings if any
  let seriesSiblings: { id: string; code: string; name: string; order: number }[] = [];
  if (achievement.series_id) {
    const siblingsResult = await db
      .prepare(`
        SELECT id, code, name, series_order as 'order'
        FROM achievement_definitions
        WHERE series_id = ?
        ORDER BY series_order ASC
      `)
      .bind(achievement.series_id)
      .all<{ id: string; code: string; name: string; order: number }>();

    seriesSiblings = siblingsResult.results;
  }

  // Get unlock statistics
  const unlockStats = await db
    .prepare(`
      SELECT COUNT(*) as unlocked_count
      FROM character_achievements
      WHERE achievement_id = ? AND status = 'UNLOCKED'
    `)
    .bind(achievement.id)
    .first<{ unlocked_count: number }>();

  return c.json({
    success: true,
    data: {
      ...formatAchievement(achievement, true),
      prerequisite,
      seriesSiblings,
      stats: {
        unlockedCount: unlockStats?.unlocked_count || 0,
      },
    },
  });
});

// =============================================================================
// CHARACTER PROGRESS ENDPOINTS
// =============================================================================

/**
 * GET /achievements/character
 * Get character's achievement progress.
 */
achievementRoutes.get('/character', async (c) => {
  const db = c.env.DB;
  const characterId = c.req.query('characterId');
  const status = c.req.query('status');
  const category = c.req.query('category');

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_CHARACTER', message: 'characterId query param is required' }],
    }, 400);
  }

  let sql = `
    SELECT ca.*, ad.*,
           ca.id as ca_id, ca.status as ca_status
    FROM character_achievements ca
    JOIN achievement_definitions ad ON ca.achievement_id = ad.id
    WHERE ca.character_id = ?
  `;
  const params: unknown[] = [characterId];

  if (status) {
    sql += ` AND ca.status = ?`;
    params.push(status);
  }

  if (category) {
    sql += ` AND ad.category = ?`;
    params.push(category);
  }

  sql += ` ORDER BY ca.unlocked_at DESC NULLS LAST, ad.name ASC`;

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all();

  const achievements = result.results.map((row: Record<string, unknown>) => {
    const ca: CharacterAchievement = {
      id: row.ca_id as string,
      character_id: row.character_id as string,
      achievement_id: row.achievement_id as string,
      status: row.ca_status as string,
      unlocked_at: row.unlocked_at as string | null,
      current_counter: row.current_counter as number,
      target_counter: row.target_counter as number,
      percent_complete: row.percent_complete as number,
      first_progress_at: row.first_progress_at as string | null,
      last_progress_at: row.last_progress_at as string | null,
      rewards_claimed: row.rewards_claimed as number,
      rewards_claimed_at: row.rewards_claimed_at as string | null,
      difficulty_at_unlock: row.difficulty_at_unlock as string | null,
      playtime_at_unlock_hours: row.playtime_at_unlock_hours as number | null,
      is_new: row.is_new as number,
    };

    const ad: AchievementDefinition = {
      id: row.achievement_id as string,
      code: row.code as string,
      name: row.name as string,
      description: row.description as string | null,
      hidden_description: row.hidden_description as string | null,
      achievement_type: row.achievement_type as string | null,
      category: row.category as string | null,
      difficulty: row.difficulty as number,
      rarity: row.rarity as string | null,
      points: row.points as number,
      unlock_conditions: row.unlock_conditions as string | null,
      counter_target: row.counter_target as number | null,
      counter_type: row.counter_type as string | null,
      is_hidden: row.is_hidden as number,
      is_secret: row.is_secret as number,
      xp_reward: row.xp_reward as number | null,
      credit_reward: row.credit_reward as number | null,
      item_reward_id: row.item_reward_id as string | null,
      title_reward: row.title_reward as string | null,
      cosmetic_reward: row.cosmetic_reward as string | null,
      series_id: row.series_id as string | null,
      series_order: row.series_order as number | null,
      prerequisite_achievement_id: row.prerequisite_achievement_id as string | null,
      icon_asset: row.icon_asset as string | null,
      icon_locked_asset: row.icon_locked_asset as string | null,
      banner_asset: row.banner_asset as string | null,
      is_missable: row.is_missable as number,
      is_one_per_playthrough: row.is_one_per_playthrough as number,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };

    return formatCharacterAchievement(ca, ad);
  });

  // Calculate summary
  const unlocked = achievements.filter(a => a.status === 'UNLOCKED').length;
  const inProgress = achievements.filter(a => a.status === 'IN_PROGRESS').length;
  const totalPoints = achievements
    .filter(a => a.status === 'UNLOCKED')
    .reduce((sum, a) => sum + (a.definition?.classification.points || 0), 0);

  return c.json({
    success: true,
    data: {
      characterId,
      achievements,
      summary: {
        total: achievements.length,
        unlocked,
        inProgress,
        totalPoints,
      },
    },
  });
});

/**
 * GET /achievements/character/recent
 * Get recently unlocked achievements.
 */
achievementRoutes.get('/character/recent', async (c) => {
  const db = c.env.DB;
  const characterId = c.req.query('characterId');
  const limit = parseInt(c.req.query('limit') || '10');

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_CHARACTER', message: 'characterId query param is required' }],
    }, 400);
  }

  const result = await db
    .prepare(`
      SELECT ca.*, ad.code, ad.name, ad.description, ad.category, ad.points, ad.icon_asset
      FROM character_achievements ca
      JOIN achievement_definitions ad ON ca.achievement_id = ad.id
      WHERE ca.character_id = ? AND ca.status = 'UNLOCKED'
      ORDER BY ca.unlocked_at DESC
      LIMIT ?
    `)
    .bind(characterId, limit)
    .all();

  const recent = result.results.map((row: Record<string, unknown>) => ({
    achievementId: row.achievement_id,
    code: row.code,
    name: row.name,
    description: row.description,
    category: row.category,
    points: row.points,
    icon: row.icon_asset,
    unlockedAt: row.unlocked_at,
    isNew: row.is_new === 1,
  }));

  return c.json({
    success: true,
    data: {
      characterId,
      recent,
      count: recent.length,
    },
  });
});

/**
 * POST /achievements/:id/progress
 * Update progress on a counter-based achievement.
 */
achievementRoutes.post('/:id/progress', async (c) => {
  const db = c.env.DB;
  const achId = c.req.param('id');

  let body: {
    characterId: string;
    incrementBy?: number;
    setTo?: number;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_JSON', message: 'Invalid JSON body' }],
    }, 400);
  }

  const { characterId, incrementBy, setTo } = body;

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_CHARACTER', message: 'characterId is required' }],
    }, 400);
  }

  // Get achievement definition
  let achievement = await db
    .prepare(`SELECT * FROM achievement_definitions WHERE id = ?`)
    .bind(achId)
    .first<AchievementDefinition>();

  if (!achievement) {
    achievement = await db
      .prepare(`SELECT * FROM achievement_definitions WHERE code = ?`)
      .bind(achId)
      .first<AchievementDefinition>();
  }

  if (!achievement) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Achievement not found' }],
    }, 404);
  }

  if (!achievement.counter_target) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_COUNTER', message: 'Achievement is not counter-based' }],
    }, 400);
  }

  // Get or create character achievement
  let charAch = await db
    .prepare(`SELECT * FROM character_achievements WHERE character_id = ? AND achievement_id = ?`)
    .bind(characterId, achievement.id)
    .first<CharacterAchievement>();

  const now = new Date().toISOString();

  if (!charAch) {
    // Create new tracking record
    const caId = `ca-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const initialCounter = setTo !== undefined ? setTo : (incrementBy || 1);

    await db
      .prepare(`INSERT INTO character_achievements (
        id, character_id, achievement_id, status, current_counter, target_counter,
        percent_complete, first_progress_at, last_progress_at, is_new
      ) VALUES (?, ?, ?, 'IN_PROGRESS', ?, ?, ?, ?, ?, 0)`)
      .bind(
        caId,
        characterId,
        achievement.id,
        initialCounter,
        achievement.counter_target,
        (initialCounter / achievement.counter_target) * 100,
        now,
        now
      )
      .run();

    charAch = await db
      .prepare(`SELECT * FROM character_achievements WHERE id = ?`)
      .bind(caId)
      .first<CharacterAchievement>();
  } else {
    // Update existing
    const newCounter = setTo !== undefined
      ? setTo
      : charAch.current_counter + (incrementBy || 1);

    const percent = Math.min(100, (newCounter / achievement.counter_target) * 100);
    const isComplete = newCounter >= achievement.counter_target;

    await db
      .prepare(`UPDATE character_achievements SET
        current_counter = ?,
        percent_complete = ?,
        status = ?,
        last_progress_at = ?,
        unlocked_at = ?
       WHERE id = ?`)
      .bind(
        newCounter,
        percent,
        isComplete ? 'UNLOCKED' : 'IN_PROGRESS',
        now,
        isComplete ? now : null,
        charAch.id
      )
      .run();

    charAch = await db
      .prepare(`SELECT * FROM character_achievements WHERE id = ?`)
      .bind(charAch.id)
      .first<CharacterAchievement>();
  }

  const justUnlocked = charAch!.status === 'UNLOCKED' && charAch!.unlocked_at === now;

  return c.json({
    success: true,
    data: {
      achievement: formatAchievement(achievement, true),
      progress: {
        current: charAch!.current_counter,
        target: achievement.counter_target,
        percent: charAch!.percent_complete,
      },
      status: charAch!.status,
      justUnlocked,
      rewards: justUnlocked ? {
        xp: achievement.xp_reward,
        credits: achievement.credit_reward,
        itemId: achievement.item_reward_id,
        title: achievement.title_reward,
      } : null,
    },
  });
});

/**
 * POST /achievements/:id/unlock
 * Directly unlock an achievement (for non-counter achievements).
 */
achievementRoutes.post('/:id/unlock', async (c) => {
  const db = c.env.DB;
  const achId = c.req.param('id');

  let body: { characterId: string };

  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_JSON', message: 'Invalid JSON body' }],
    }, 400);
  }

  const { characterId } = body;

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_CHARACTER', message: 'characterId is required' }],
    }, 400);
  }

  // Get achievement definition
  let achievement = await db
    .prepare(`SELECT * FROM achievement_definitions WHERE id = ?`)
    .bind(achId)
    .first<AchievementDefinition>();

  if (!achievement) {
    achievement = await db
      .prepare(`SELECT * FROM achievement_definitions WHERE code = ?`)
      .bind(achId)
      .first<AchievementDefinition>();
  }

  if (!achievement) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Achievement not found' }],
    }, 404);
  }

  // Check if already unlocked
  const existing = await db
    .prepare(`SELECT * FROM character_achievements WHERE character_id = ? AND achievement_id = ?`)
    .bind(characterId, achievement.id)
    .first<CharacterAchievement>();

  if (existing && existing.status === 'UNLOCKED') {
    return c.json({
      success: false,
      errors: [{ code: 'ALREADY_UNLOCKED', message: 'Achievement already unlocked' }],
    }, 409);
  }

  const now = new Date().toISOString();
  const caId = existing?.id || `ca-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  if (existing) {
    await db
      .prepare(`UPDATE character_achievements SET
        status = 'UNLOCKED',
        unlocked_at = ?,
        current_counter = target_counter,
        percent_complete = 100,
        is_new = 1
       WHERE id = ?`)
      .bind(now, existing.id)
      .run();
  } else {
    await db
      .prepare(`INSERT INTO character_achievements (
        id, character_id, achievement_id, status, unlocked_at,
        current_counter, target_counter, percent_complete, is_new
      ) VALUES (?, ?, ?, 'UNLOCKED', ?, ?, ?, 100, 1)`)
      .bind(
        caId,
        characterId,
        achievement.id,
        now,
        achievement.counter_target || 1,
        achievement.counter_target || 1
      )
      .run();
  }

  return c.json({
    success: true,
    data: {
      achievement: formatAchievement(achievement, true),
      unlockedAt: now,
      rewards: {
        xp: achievement.xp_reward,
        credits: achievement.credit_reward,
        itemId: achievement.item_reward_id,
        title: achievement.title_reward,
      },
    },
  }, 201);
});

// =============================================================================
// MILESTONE ENDPOINTS
// =============================================================================

/**
 * GET /achievements/milestones
 * List milestone definitions.
 */
achievementRoutes.get('/milestones', async (c) => {
  const db = c.env.DB;
  const category = c.req.query('category');

  let sql = `SELECT * FROM milestone_definitions WHERE 1=1`;
  const params: unknown[] = [];

  if (category) {
    sql += ` AND category = ?`;
    params.push(category);
  }

  sql += ` ORDER BY display_order ASC`;

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<MilestoneDefinition>();

  const milestones = result.results.map(formatMilestone);

  return c.json({
    success: true,
    data: {
      milestones,
      count: milestones.length,
    },
  });
});

/**
 * GET /achievements/milestones/character
 * Get character's milestone progress.
 */
achievementRoutes.get('/milestones/character', async (c) => {
  const db = c.env.DB;
  const characterId = c.req.query('characterId');

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_CHARACTER', message: 'characterId query param is required' }],
    }, 400);
  }

  // Get all milestones
  const milestonesResult = await db
    .prepare(`SELECT * FROM milestone_definitions ORDER BY display_order ASC`)
    .all<MilestoneDefinition>();

  // Get character stats (simplified - would need actual stats tracking)
  // Character data would be used for stats - currently placeholder
  await db
    .prepare(`SELECT id FROM characters WHERE id = ?`)
    .bind(characterId)
    .first();

  const milestones = milestonesResult.results.map(milestone => {
    const formatted = formatMilestone(milestone);

    // Calculate current progress based on tracked stat
    // This is simplified - real implementation would query actual stats
    const currentValue = 0; // Would come from character stats

    const thresholds = formatted.tracking.thresholds as number[];
    const currentThresholdIndex = thresholds.findIndex(t => currentValue < t);
    const currentThreshold = currentThresholdIndex === -1
      ? thresholds[thresholds.length - 1]
      : thresholds[currentThresholdIndex];
    const previousThreshold = currentThresholdIndex > 0
      ? thresholds[currentThresholdIndex - 1]
      : 0;

    return {
      ...formatted,
      progress: {
        currentValue,
        currentThreshold,
        previousThreshold,
        thresholdsReached: currentThresholdIndex === -1
          ? thresholds.length
          : currentThresholdIndex,
        totalThresholds: thresholds.length,
      },
    };
  });

  return c.json({
    success: true,
    data: {
      characterId,
      milestones,
    },
  });
});

// =============================================================================
// LEADERBOARD ENDPOINTS
// =============================================================================

/**
 * GET /achievements/leaderboards
 * List available leaderboard types.
 */
achievementRoutes.get('/leaderboards', async (c) => {
  // Predefined leaderboard types
  const leaderboards = [
    {
      type: 'TOTAL_POINTS',
      name: 'Achievement Points',
      description: 'Total achievement points earned',
    },
    {
      type: 'DELIVERIES',
      name: 'Total Deliveries',
      description: 'Total successful deliveries completed',
    },
    {
      type: 'CREDITS_EARNED',
      name: 'Credits Earned',
      description: 'Total credits earned lifetime',
    },
    {
      type: 'MISSIONS_COMPLETED',
      name: 'Missions Completed',
      description: 'Total missions completed',
    },
    {
      type: 'FASTEST_DELIVERY',
      name: 'Fastest Delivery',
      description: 'Fastest delivery time on record',
    },
  ];

  return c.json({
    success: true,
    data: {
      leaderboards,
      count: leaderboards.length,
    },
  });
});

/**
 * GET /achievements/leaderboards/:type
 * Get leaderboard entries for a specific type.
 */
achievementRoutes.get('/leaderboards/:type', async (c) => {
  const db = c.env.DB;
  const type = c.req.param('type');
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');

  // Different queries based on leaderboard type
  let sql = '';
  const params: unknown[] = [];

  switch (type) {
    case 'TOTAL_POINTS':
      sql = `
        SELECT c.id, c.name, c.tier,
               COALESCE(SUM(ad.points), 0) as score
        FROM characters c
        LEFT JOIN character_achievements ca ON c.id = ca.character_id AND ca.status = 'UNLOCKED'
        LEFT JOIN achievement_definitions ad ON ca.achievement_id = ad.id
        GROUP BY c.id
        ORDER BY score DESC
        LIMIT ? OFFSET ?
      `;
      params.push(limit, offset);
      break;

    case 'DELIVERIES':
    case 'CREDITS_EARNED':
    case 'MISSIONS_COMPLETED':
      // Simplified - would need actual stats tracking
      sql = `
        SELECT id, name, tier, 0 as score
        FROM characters
        ORDER BY tier DESC
        LIMIT ? OFFSET ?
      `;
      params.push(limit, offset);
      break;

    default:
      return c.json({
        success: false,
        errors: [{ code: 'INVALID_TYPE', message: 'Unknown leaderboard type' }],
      }, 400);
  }

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<{ id: string; name: string; tier: number; score: number }>();

  const entries = result.results.map((row, index) => ({
    rank: offset + index + 1,
    characterId: row.id,
    characterName: row.name,
    tier: row.tier,
    score: row.score,
  }));

  return c.json({
    success: true,
    data: {
      type,
      entries,
      count: entries.length,
      pagination: {
        limit,
        offset,
      },
    },
  });
});
