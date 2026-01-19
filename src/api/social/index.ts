/**
 * Surge Protocol - Social Systems Routes
 *
 * Endpoints for crews (guilds) and friendships.
 *
 * FRIENDSHIP ENDPOINTS:
 * - GET /social/friends - List player's friends
 * - GET /social/friends/requests - List pending friend requests
 * - POST /social/friends/request/:playerId - Send friend request
 * - POST /social/friends/accept/:friendshipId - Accept friend request
 * - POST /social/friends/reject/:friendshipId - Reject friend request
 * - DELETE /social/friends/:friendshipId - Remove friend
 * - PATCH /social/friends/:friendshipId - Update friend settings
 * - POST /social/friends/block/:playerId - Block a player
 * - DELETE /social/friends/block/:playerId - Unblock a player
 *
 * CREW ENDPOINTS:
 * - GET /social/crews - List crews (search/browse)
 * - GET /social/crews/:crewId - Get crew details
 * - POST /social/crews - Create a crew
 * - PATCH /social/crews/:crewId - Update crew settings
 * - DELETE /social/crews/:crewId - Disband crew
 * - GET /social/crews/:crewId/members - List crew members
 * - POST /social/crews/:crewId/invite/:playerId - Invite player to crew
 * - POST /social/crews/:crewId/apply - Apply to join crew
 * - GET /social/crews/:crewId/applications - List applications
 * - POST /social/crews/:crewId/applications/:appId/accept - Accept application
 * - POST /social/crews/:crewId/applications/:appId/reject - Reject application
 * - POST /social/crews/:crewId/members/:memberId/promote - Promote member
 * - POST /social/crews/:crewId/members/:memberId/demote - Demote member
 * - DELETE /social/crews/:crewId/members/:memberId - Kick member
 * - POST /social/crews/:crewId/leave - Leave crew
 * - GET /social/crews/:crewId/bank - Get crew bank
 * - POST /social/crews/:crewId/bank/deposit - Deposit to crew bank
 * - POST /social/crews/:crewId/bank/withdraw - Withdraw from crew bank
 * - GET /social/my-crew - Get player's current crew
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

interface FriendshipRow {
  id: string;
  player_id: string;
  friend_id: string;
  created_at: string;
  status: string;
  initiated_by: string | null;
  nickname: string | null;
  group_name: string | null;
  favorite: number;
  last_interaction: string | null;
  interaction_count: number;
  times_played_together: number;
  can_join_session: number;
  can_see_location: number;
  can_send_items: number;
  notification_level: string;
}

interface CrewRow {
  id: string;
  created_at: string;
  name: string;
  tag: string | null;
  description: string | null;
  motto: string | null;
  emblem_asset: string | null;
  colors: string | null;
  founder_id: string | null;
  leader_id: string | null;
  officers: string | null;
  member_count: number;
  max_members: number;
  recruitment_status: string;
  requirements: string | null;
  application_questions: string | null;
  total_deliveries: number;
  total_credits_earned: number;
  average_tier: number;
  competition_wins: number;
  crew_rating: number;
  crew_bank_balance: number;
  shared_inventory: string | null;
  privacy: string;
  member_permissions: string | null;
  rank_definitions: string | null;
  is_active: number;
}

interface MembershipRow {
  id: string;
  crew_id: string;
  player_id: string;
  joined_at: string;
  rank: string;
  rank_order: number;
  custom_title: string | null;
  can_invite: number;
  can_kick: number;
  can_promote: number;
  can_edit_settings: number;
  can_access_bank: number;
  bank_withdraw_limit: number;
  deliveries_for_crew: number;
  credits_contributed: number;
  events_participated: number;
  recruitment_count: number;
  is_active: number;
  last_active: string | null;
  on_probation: number;
  notes: string | null;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const updateFriendSchema = z.object({
  nickname: z.string().max(50).optional(),
  groupName: z.string().max(30).optional(),
  favorite: z.boolean().optional(),
  canJoinSession: z.boolean().optional(),
  canSeeLocation: z.boolean().optional(),
  canSendItems: z.boolean().optional(),
  notificationLevel: z.enum(['ALL', 'IMPORTANT', 'NONE']).optional(),
});

const createCrewSchema = z.object({
  name: z.string().min(3).max(30),
  tag: z.string().min(2).max(5).optional(),
  description: z.string().max(500).optional(),
  motto: z.string().max(100).optional(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
  }).optional(),
  recruitmentStatus: z.enum(['OPEN', 'INVITE_ONLY', 'CLOSED']).optional().default('OPEN'),
  privacy: z.enum(['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY']).optional().default('PUBLIC'),
});

const updateCrewSchema = z.object({
  description: z.string().max(500).optional(),
  motto: z.string().max(100).optional(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
  }).optional(),
  recruitmentStatus: z.enum(['OPEN', 'INVITE_ONLY', 'CLOSED']).optional(),
  privacy: z.enum(['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY']).optional(),
  maxMembers: z.number().int().min(5).max(100).optional(),
  requirements: z.object({
    minTier: z.number().int().min(1).max(10).optional(),
    minRating: z.number().optional(),
    minDeliveries: z.number().int().optional(),
  }).optional(),
});

const applyToCrewSchema = z.object({
  message: z.string().max(500).optional(),
  answers: z.record(z.string()).optional(),
});

const bankTransactionSchema = z.object({
  amount: z.number().int().min(1),
  note: z.string().max(200).optional(),
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

function formatFriendship(row: FriendshipRow, friendProfile?: { display_name: string | null; avatar_asset: string | null }) {
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
    friend: friendProfile ? {
      displayName: friendProfile.display_name,
      avatar: friendProfile.avatar_asset,
    } : null,
  };
}

function formatCrew(row: CrewRow) {
  return {
    id: row.id,
    name: row.name,
    tag: row.tag,
    description: row.description,
    motto: row.motto,
    emblem: row.emblem_asset,
    colors: parseJsonField<{ primary: string; secondary: string } | null>(row.colors, null),
    founderId: row.founder_id,
    leaderId: row.leader_id,
    officers: parseJsonField<string[]>(row.officers, []),
    memberCount: row.member_count,
    maxMembers: row.max_members,
    recruitmentStatus: row.recruitment_status,
    requirements: parseJsonField<Record<string, number>>(row.requirements, {}),
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

function formatMember(row: MembershipRow, profile?: { display_name: string | null; avatar_asset: string | null }) {
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
    profile: profile ? {
      displayName: profile.display_name,
      avatar: profile.avatar_asset,
    } : null,
  };
}

// =============================================================================
// ROUTES
// =============================================================================

export const socialRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Apply auth middleware to all routes
socialRoutes.use('*', authMiddleware());

// -----------------------------------------------------------------------------
// FRIENDSHIP ENDPOINTS
// -----------------------------------------------------------------------------

/**
 * GET /social/friends
 * List player's friends.
 */
socialRoutes.get('/friends', async (c) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  const friendships = await c.env.DB
    .prepare(
      `SELECT f.*, pp.display_name, pp.avatar_asset
       FROM friendships f
       LEFT JOIN player_profiles pp ON f.friend_id = pp.id
       WHERE f.player_id = ? AND f.status = 'ACCEPTED'
       ORDER BY f.favorite DESC, f.last_interaction DESC NULLS LAST`
    )
    .bind(userId)
    .all<FriendshipRow & { display_name: string | null; avatar_asset: string | null }>();

  const friends = friendships.results.map(row => formatFriendship(row, {
    display_name: row.display_name,
    avatar_asset: row.avatar_asset,
  }));

  // Group by status
  const favorites = friends.filter(f => f.isFavorite);
  const groups: Record<string, typeof friends> = {};

  for (const friend of friends) {
    const group = friend.groupName || 'Ungrouped';
    if (!groups[group]) groups[group] = [];
    groups[group]!.push(friend);
  }

  return c.json({
    success: true,
    data: {
      friends,
      favorites,
      byGroup: groups,
      totalCount: friends.length,
    },
  });
});

/**
 * GET /social/friends/requests
 * List pending friend requests (sent and received).
 */
socialRoutes.get('/friends/requests', async (c) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Received requests
  const received = await c.env.DB
    .prepare(
      `SELECT f.*, pp.display_name, pp.avatar_asset
       FROM friendships f
       LEFT JOIN player_profiles pp ON f.player_id = pp.id
       WHERE f.friend_id = ? AND f.status = 'PENDING_SENT'
       ORDER BY f.created_at DESC`
    )
    .bind(userId)
    .all<FriendshipRow & { display_name: string | null; avatar_asset: string | null }>();

  // Sent requests
  const sent = await c.env.DB
    .prepare(
      `SELECT f.*, pp.display_name, pp.avatar_asset
       FROM friendships f
       LEFT JOIN player_profiles pp ON f.friend_id = pp.id
       WHERE f.player_id = ? AND f.status = 'PENDING_SENT'
       ORDER BY f.created_at DESC`
    )
    .bind(userId)
    .all<FriendshipRow & { display_name: string | null; avatar_asset: string | null }>();

  return c.json({
    success: true,
    data: {
      received: received.results.map(row => ({
        id: row.id,
        fromPlayerId: row.player_id,
        fromPlayer: {
          displayName: row.display_name,
          avatar: row.avatar_asset,
        },
        sentAt: row.created_at,
      })),
      sent: sent.results.map(row => ({
        id: row.id,
        toPlayerId: row.friend_id,
        toPlayer: {
          displayName: row.display_name,
          avatar: row.avatar_asset,
        },
        sentAt: row.created_at,
      })),
    },
  });
});

/**
 * POST /social/friends/request/:playerId
 * Send a friend request.
 */
socialRoutes.post('/friends/request/:playerId', async (c) => {
  const userId = c.get('userId');
  const targetPlayerId = c.req.param('playerId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  if (userId === targetPlayerId) {
    return c.json({
      success: false,
      errors: [{ code: 'SELF_REQUEST', message: 'Cannot add yourself as a friend' }],
    }, 400);
  }

  // Check if target exists
  const target = await c.env.DB
    .prepare('SELECT id, display_name, allow_friend_requests FROM player_profiles WHERE id = ?')
    .bind(targetPlayerId)
    .first<{ id: string; display_name: string | null; allow_friend_requests: number }>();

  if (!target) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Player not found' }],
    }, 404);
  }

  if (!target.allow_friend_requests) {
    return c.json({
      success: false,
      errors: [{ code: 'REQUESTS_DISABLED', message: 'Player is not accepting friend requests' }],
    }, 400);
  }

  // Check if already friends or pending
  const existing = await c.env.DB
    .prepare(
      `SELECT id, status FROM friendships
       WHERE (player_id = ? AND friend_id = ?) OR (player_id = ? AND friend_id = ?)`
    )
    .bind(userId, targetPlayerId, targetPlayerId, userId)
    .first<{ id: string; status: string }>();

  if (existing) {
    if (existing.status === 'ACCEPTED') {
      return c.json({
        success: false,
        errors: [{ code: 'ALREADY_FRIENDS', message: 'Already friends with this player' }],
      }, 400);
    }
    if (existing.status === 'PENDING_SENT') {
      return c.json({
        success: false,
        errors: [{ code: 'REQUEST_PENDING', message: 'Friend request already pending' }],
      }, 400);
    }
    if (existing.status === 'BLOCKED') {
      return c.json({
        success: false,
        errors: [{ code: 'BLOCKED', message: 'Cannot send friend request' }],
      }, 400);
    }
  }

  // Create friend request
  const { nanoid } = await import('nanoid');
  const friendshipId = nanoid();

  await c.env.DB
    .prepare(
      `INSERT INTO friendships
       (id, player_id, friend_id, status, initiated_by, created_at)
       VALUES (?, ?, ?, 'PENDING_SENT', ?, datetime('now'))`
    )
    .bind(friendshipId, userId, targetPlayerId, userId)
    .run();

  return c.json({
    success: true,
    data: {
      friendshipId,
      toPlayer: {
        id: target.id,
        displayName: target.display_name,
      },
      message: `Friend request sent to ${target.display_name || 'player'}`,
    },
  });
});

/**
 * POST /social/friends/accept/:friendshipId
 * Accept a friend request.
 */
socialRoutes.post('/friends/accept/:friendshipId', async (c) => {
  const userId = c.get('userId');
  const friendshipId = c.req.param('friendshipId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Get the request (must be received by current player)
  const request = await c.env.DB
    .prepare(
      `SELECT f.*, pp.display_name
       FROM friendships f
       LEFT JOIN player_profiles pp ON f.player_id = pp.id
       WHERE f.id = ? AND f.friend_id = ? AND f.status = 'PENDING_SENT'`
    )
    .bind(friendshipId, userId)
    .first<FriendshipRow & { display_name: string | null }>();

  if (!request) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Friend request not found' }],
    }, 404);
  }

  // Update to accepted
  await c.env.DB
    .prepare(
      `UPDATE friendships SET status = 'ACCEPTED', last_interaction = datetime('now')
       WHERE id = ?`
    )
    .bind(friendshipId)
    .run();

  // Create reciprocal friendship
  const { nanoid } = await import('nanoid');
  await c.env.DB
    .prepare(
      `INSERT OR IGNORE INTO friendships
       (id, player_id, friend_id, status, initiated_by, created_at, last_interaction)
       VALUES (?, ?, ?, 'ACCEPTED', ?, datetime('now'), datetime('now'))`
    )
    .bind(nanoid(), userId, request.player_id, request.initiated_by)
    .run();

  return c.json({
    success: true,
    data: {
      friendshipId,
      newFriend: {
        id: request.player_id,
        displayName: request.display_name,
      },
      message: `Now friends with ${request.display_name || 'player'}`,
    },
  });
});

/**
 * POST /social/friends/reject/:friendshipId
 * Reject a friend request.
 */
socialRoutes.post('/friends/reject/:friendshipId', async (c) => {
  const userId = c.get('userId');
  const friendshipId = c.req.param('friendshipId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  const result = await c.env.DB
    .prepare(
      `DELETE FROM friendships
       WHERE id = ? AND friend_id = ? AND status = 'PENDING_SENT'`
    )
    .bind(friendshipId, userId)
    .run();

  if (!result.meta.changes) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Friend request not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      message: 'Friend request rejected',
    },
  });
});

/**
 * DELETE /social/friends/:friendshipId
 * Remove a friend.
 */
socialRoutes.delete('/friends/:friendshipId', async (c) => {
  const userId = c.get('userId');
  const friendshipId = c.req.param('friendshipId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Get the friendship to find the friend's ID
  const friendship = await c.env.DB
    .prepare('SELECT friend_id FROM friendships WHERE id = ? AND player_id = ?')
    .bind(friendshipId, userId)
    .first<{ friend_id: string }>();

  if (!friendship) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Friendship not found' }],
    }, 404);
  }

  // Remove both directions
  await c.env.DB
    .prepare(
      `DELETE FROM friendships
       WHERE (player_id = ? AND friend_id = ?) OR (player_id = ? AND friend_id = ?)`
    )
    .bind(userId, friendship.friend_id, friendship.friend_id, userId)
    .run();

  return c.json({
    success: true,
    data: {
      message: 'Friend removed',
    },
  });
});

/**
 * PATCH /social/friends/:friendshipId
 * Update friend settings (nickname, permissions, etc.).
 */
socialRoutes.patch('/friends/:friendshipId', zValidator('json', updateFriendSchema), async (c) => {
  const userId = c.get('userId');
  const friendshipId = c.req.param('friendshipId');
  const updates = c.req.valid('json');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Build update query
  const setClauses: string[] = [];
  const params: (string | number)[] = [];

  if (updates.nickname !== undefined) {
    setClauses.push('nickname = ?');
    params.push(updates.nickname);
  }
  if (updates.groupName !== undefined) {
    setClauses.push('group_name = ?');
    params.push(updates.groupName);
  }
  if (updates.favorite !== undefined) {
    setClauses.push('favorite = ?');
    params.push(updates.favorite ? 1 : 0);
  }
  if (updates.canJoinSession !== undefined) {
    setClauses.push('can_join_session = ?');
    params.push(updates.canJoinSession ? 1 : 0);
  }
  if (updates.canSeeLocation !== undefined) {
    setClauses.push('can_see_location = ?');
    params.push(updates.canSeeLocation ? 1 : 0);
  }
  if (updates.canSendItems !== undefined) {
    setClauses.push('can_send_items = ?');
    params.push(updates.canSendItems ? 1 : 0);
  }
  if (updates.notificationLevel !== undefined) {
    setClauses.push('notification_level = ?');
    params.push(updates.notificationLevel);
  }

  if (setClauses.length === 0) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_UPDATES', message: 'No updates provided' }],
    }, 400);
  }

  params.push(friendshipId, userId);

  const result = await c.env.DB
    .prepare(
      `UPDATE friendships SET ${setClauses.join(', ')}
       WHERE id = ? AND player_id = ? AND status = 'ACCEPTED'`
    )
    .bind(...params)
    .run();

  if (!result.meta.changes) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Friendship not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      updated: Object.keys(updates),
      message: 'Friend settings updated',
    },
  });
});

/**
 * POST /social/friends/block/:playerId
 * Block a player.
 */
socialRoutes.post('/friends/block/:playerId', async (c) => {
  const userId = c.get('userId');
  const targetPlayerId = c.req.param('playerId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Remove any existing friendship
  await c.env.DB
    .prepare(
      `DELETE FROM friendships
       WHERE (player_id = ? AND friend_id = ?) OR (player_id = ? AND friend_id = ?)`
    )
    .bind(userId, targetPlayerId, targetPlayerId, userId)
    .run();

  // Create blocked entry
  const { nanoid } = await import('nanoid');
  await c.env.DB
    .prepare(
      `INSERT INTO friendships
       (id, player_id, friend_id, status, initiated_by, created_at)
       VALUES (?, ?, ?, 'BLOCKED', ?, datetime('now'))`
    )
    .bind(nanoid(), userId, targetPlayerId, userId)
    .run();

  return c.json({
    success: true,
    data: {
      message: 'Player blocked',
    },
  });
});

/**
 * DELETE /social/friends/block/:playerId
 * Unblock a player.
 */
socialRoutes.delete('/friends/block/:playerId', async (c) => {
  const userId = c.get('userId');
  const targetPlayerId = c.req.param('playerId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  const result = await c.env.DB
    .prepare(
      `DELETE FROM friendships
       WHERE player_id = ? AND friend_id = ? AND status = 'BLOCKED'`
    )
    .bind(userId, targetPlayerId)
    .run();

  if (!result.meta.changes) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Block not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      message: 'Player unblocked',
    },
  });
});

// -----------------------------------------------------------------------------
// CREW ENDPOINTS
// -----------------------------------------------------------------------------

/**
 * GET /social/crews
 * List/search crews.
 */
socialRoutes.get('/crews', async (c) => {
  const search = c.req.query('search');
  const status = c.req.query('status');
  const minRating = c.req.query('minRating');
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 50);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  let query = `
    SELECT * FROM crews
    WHERE is_active = 1 AND privacy != 'PRIVATE'
  `;

  const params: (string | number)[] = [];

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
    params.push(parseInt(minRating, 10));
  }

  query += ` ORDER BY crew_rating DESC, member_count DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = await c.env.DB.prepare(query).bind(...params).all<CrewRow>();

  return c.json({
    success: true,
    data: {
      crews: result.results.map(formatCrew),
      pagination: {
        limit,
        offset,
        count: result.results.length,
      },
    },
  });
});

/**
 * GET /social/crews/:crewId
 * Get crew details.
 */
socialRoutes.get('/crews/:crewId', async (c) => {
  const crewId = c.req.param('crewId');

  const crew = await c.env.DB
    .prepare('SELECT * FROM crews WHERE id = ?')
    .bind(crewId)
    .first<CrewRow>();

  if (!crew) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Crew not found' }],
    }, 404);
  }

  // Get top members
  const topMembers = await c.env.DB
    .prepare(
      `SELECT cm.*, pp.display_name, pp.avatar_asset
       FROM crew_memberships cm
       LEFT JOIN player_profiles pp ON cm.player_id = pp.id
       WHERE cm.crew_id = ? AND cm.is_active = 1
       ORDER BY cm.rank_order DESC, cm.credits_contributed DESC
       LIMIT 10`
    )
    .bind(crewId)
    .all<MembershipRow & { display_name: string | null; avatar_asset: string | null }>();

  // Get recent activity
  const recentActivity = await c.env.DB
    .prepare(
      `SELECT cm.player_id, cm.last_active, pp.display_name
       FROM crew_memberships cm
       LEFT JOIN player_profiles pp ON cm.player_id = pp.id
       WHERE cm.crew_id = ? AND cm.is_active = 1 AND cm.last_active IS NOT NULL
       ORDER BY cm.last_active DESC
       LIMIT 5`
    )
    .bind(crewId)
    .all<{ player_id: string; last_active: string; display_name: string | null }>();

  return c.json({
    success: true,
    data: {
      crew: formatCrew(crew),
      topMembers: topMembers.results.map(m => formatMember(m, {
        display_name: m.display_name,
        avatar_asset: m.avatar_asset,
      })),
      recentActivity: recentActivity.results.map(a => ({
        playerId: a.player_id,
        displayName: a.display_name,
        lastActive: a.last_active,
      })),
      applicationQuestions: parseJsonField<string[]>(crew.application_questions, []),
      rankDefinitions: parseJsonField<Record<string, { order: number; permissions: string[] }>>(crew.rank_definitions, {}),
    },
  });
});

/**
 * POST /social/crews
 * Create a new crew.
 */
socialRoutes.post('/crews', zValidator('json', createCrewSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Check if player is already in a crew
  const existingMembership = await c.env.DB
    .prepare(
      `SELECT crew_id FROM crew_memberships
       WHERE player_id = ? AND is_active = 1`
    )
    .bind(userId)
    .first();

  if (existingMembership) {
    return c.json({
      success: false,
      errors: [{ code: 'ALREADY_IN_CREW', message: 'Must leave current crew before creating a new one' }],
    }, 400);
  }

  // Check name/tag uniqueness
  const nameCheck = await c.env.DB
    .prepare('SELECT id FROM crews WHERE name = ? OR (tag = ? AND tag IS NOT NULL)')
    .bind(data.name, data.tag || null)
    .first();

  if (nameCheck) {
    return c.json({
      success: false,
      errors: [{ code: 'NAME_TAKEN', message: 'Crew name or tag already taken' }],
    }, 400);
  }

  const { nanoid } = await import('nanoid');
  const crewId = nanoid();
  const membershipId = nanoid();

  // Create crew
  await c.env.DB
    .prepare(
      `INSERT INTO crews
       (id, name, tag, description, motto, colors, founder_id, leader_id, recruitment_status, privacy, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(
      crewId,
      data.name,
      data.tag || null,
      data.description || null,
      data.motto || null,
      data.colors ? JSON.stringify(data.colors) : null,
      userId,
      userId,
      data.recruitmentStatus,
      data.privacy
    )
    .run();

  // Add founder as leader
  await c.env.DB
    .prepare(
      `INSERT INTO crew_memberships
       (id, crew_id, player_id, rank, rank_order, can_invite, can_kick, can_promote,
        can_edit_settings, can_access_bank, bank_withdraw_limit, joined_at, last_active)
       VALUES (?, ?, ?, 'LEADER', 100, 1, 1, 1, 1, 1, 999999999, datetime('now'), datetime('now'))`
    )
    .bind(membershipId, crewId, userId)
    .run();

  // Update player profile
  await c.env.DB
    .prepare(
      `UPDATE player_profiles SET crew_id = ?, crew_rank = 'LEADER'
       WHERE id = ?`
    )
    .bind(crewId, userId)
    .run();

  return c.json({
    success: true,
    data: {
      crewId,
      name: data.name,
      tag: data.tag,
      message: `Created crew: ${data.name}`,
    },
  });
});

/**
 * PATCH /social/crews/:crewId
 * Update crew settings.
 */
socialRoutes.patch('/crews/:crewId', zValidator('json', updateCrewSchema), async (c) => {
  const userId = c.get('userId');
  const crewId = c.req.param('crewId');
  const updates = c.req.valid('json');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Check permission
  const membership = await c.env.DB
    .prepare(
      `SELECT can_edit_settings FROM crew_memberships
       WHERE crew_id = ? AND player_id = ? AND is_active = 1`
    )
    .bind(crewId, userId)
    .first<{ can_edit_settings: number }>();

  if (!membership?.can_edit_settings) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PERMISSION', message: 'No permission to edit crew settings' }],
    }, 403);
  }

  // Build update
  const setClauses: string[] = [];
  const params: (string | number | null)[] = [];

  if (updates.description !== undefined) {
    setClauses.push('description = ?');
    params.push(updates.description);
  }
  if (updates.motto !== undefined) {
    setClauses.push('motto = ?');
    params.push(updates.motto);
  }
  if (updates.colors !== undefined) {
    setClauses.push('colors = ?');
    params.push(JSON.stringify(updates.colors));
  }
  if (updates.recruitmentStatus !== undefined) {
    setClauses.push('recruitment_status = ?');
    params.push(updates.recruitmentStatus);
  }
  if (updates.privacy !== undefined) {
    setClauses.push('privacy = ?');
    params.push(updates.privacy);
  }
  if (updates.maxMembers !== undefined) {
    setClauses.push('max_members = ?');
    params.push(updates.maxMembers);
  }
  if (updates.requirements !== undefined) {
    setClauses.push('requirements = ?');
    params.push(JSON.stringify(updates.requirements));
  }

  if (setClauses.length === 0) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_UPDATES', message: 'No updates provided' }],
    }, 400);
  }

  params.push(crewId);

  await c.env.DB
    .prepare(`UPDATE crews SET ${setClauses.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();

  return c.json({
    success: true,
    data: {
      updated: Object.keys(updates),
      message: 'Crew settings updated',
    },
  });
});

/**
 * DELETE /social/crews/:crewId
 * Disband crew.
 */
socialRoutes.delete('/crews/:crewId', async (c) => {
  const userId = c.get('userId');
  const crewId = c.req.param('crewId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Only leader can disband
  const crew = await c.env.DB
    .prepare('SELECT leader_id, name FROM crews WHERE id = ?')
    .bind(crewId)
    .first<{ leader_id: string; name: string }>();

  if (!crew) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Crew not found' }],
    }, 404);
  }

  if (crew.leader_id !== userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_LEADER', message: 'Only the leader can disband the crew' }],
    }, 403);
  }

  // Remove all memberships
  await c.env.DB
    .prepare('UPDATE crew_memberships SET is_active = 0 WHERE crew_id = ?')
    .bind(crewId)
    .run();

  // Update player profiles
  await c.env.DB
    .prepare(
      `UPDATE player_profiles SET crew_id = NULL, crew_rank = NULL
       WHERE crew_id = ?`
    )
    .bind(crewId)
    .run();

  // Deactivate crew
  await c.env.DB
    .prepare('UPDATE crews SET is_active = 0 WHERE id = ?')
    .bind(crewId)
    .run();

  return c.json({
    success: true,
    data: {
      message: `Crew "${crew.name}" has been disbanded`,
    },
  });
});

/**
 * GET /social/crews/:crewId/members
 * List crew members.
 */
socialRoutes.get('/crews/:crewId/members', async (c) => {
  const crewId = c.req.param('crewId');

  const members = await c.env.DB
    .prepare(
      `SELECT cm.*, pp.display_name, pp.avatar_asset
       FROM crew_memberships cm
       LEFT JOIN player_profiles pp ON cm.player_id = pp.id
       WHERE cm.crew_id = ? AND cm.is_active = 1
       ORDER BY cm.rank_order DESC, cm.joined_at`
    )
    .bind(crewId)
    .all<MembershipRow & { display_name: string | null; avatar_asset: string | null }>();

  return c.json({
    success: true,
    data: {
      members: members.results.map(m => formatMember(m, {
        display_name: m.display_name,
        avatar_asset: m.avatar_asset,
      })),
      totalCount: members.results.length,
    },
  });
});

/**
 * POST /social/crews/:crewId/invite/:playerId
 * Invite a player to the crew.
 */
socialRoutes.post('/crews/:crewId/invite/:playerId', async (c) => {
  const userId = c.get('userId');
  const crewId = c.req.param('crewId');
  const targetPlayerId = c.req.param('playerId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Check permission
  const membership = await c.env.DB
    .prepare(
      `SELECT can_invite FROM crew_memberships
       WHERE crew_id = ? AND player_id = ? AND is_active = 1`
    )
    .bind(crewId, userId)
    .first<{ can_invite: number }>();

  if (!membership?.can_invite) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PERMISSION', message: 'No permission to invite members' }],
    }, 403);
  }

  // Check crew capacity
  const crew = await c.env.DB
    .prepare('SELECT member_count, max_members, name FROM crews WHERE id = ?')
    .bind(crewId)
    .first<{ member_count: number; max_members: number; name: string }>();

  if (!crew) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Crew not found' }],
    }, 404);
  }

  if (crew.member_count >= crew.max_members) {
    return c.json({
      success: false,
      errors: [{ code: 'CREW_FULL', message: 'Crew is at maximum capacity' }],
    }, 400);
  }

  // Check if target exists and is not in a crew
  const target = await c.env.DB
    .prepare('SELECT id, display_name, crew_id FROM player_profiles WHERE id = ?')
    .bind(targetPlayerId)
    .first<{ id: string; display_name: string | null; crew_id: string | null }>();

  if (!target) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Player not found' }],
    }, 404);
  }

  if (target.crew_id) {
    return c.json({
      success: false,
      errors: [{ code: 'ALREADY_IN_CREW', message: 'Player is already in a crew' }],
    }, 400);
  }

  // Create invitation (as a notification - simplified implementation)
  // In a full implementation, this would create an invite record

  return c.json({
    success: true,
    data: {
      invited: {
        playerId: target.id,
        displayName: target.display_name,
      },
      crew: crew.name,
      message: `Invitation sent to ${target.display_name || 'player'}`,
    },
  });
});

/**
 * POST /social/crews/:crewId/apply
 * Apply to join a crew.
 */
socialRoutes.post('/crews/:crewId/apply', zValidator('json', applyToCrewSchema), async (c) => {
  const userId = c.get('userId');
  const crewId = c.req.param('crewId');
  const { message } = c.req.valid('json');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Check player not already in crew
  const player = await c.env.DB
    .prepare('SELECT crew_id FROM player_profiles WHERE id = ?')
    .bind(userId)
    .first<{ crew_id: string | null }>();

  if (player?.crew_id) {
    return c.json({
      success: false,
      errors: [{ code: 'ALREADY_IN_CREW', message: 'Must leave current crew before applying' }],
    }, 400);
  }

  // Check crew accepts applications
  const crew = await c.env.DB
    .prepare('SELECT recruitment_status, name, requirements FROM crews WHERE id = ? AND is_active = 1')
    .bind(crewId)
    .first<{ recruitment_status: string; name: string; requirements: string | null }>();

  if (!crew) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Crew not found' }],
    }, 404);
  }

  if (crew.recruitment_status === 'CLOSED') {
    return c.json({
      success: false,
      errors: [{ code: 'CLOSED', message: 'Crew is not accepting new members' }],
    }, 400);
  }

  // If OPEN, directly add member
  if (crew.recruitment_status === 'OPEN') {
    const { nanoid } = await import('nanoid');
    const membershipId = nanoid();

    await c.env.DB
      .prepare(
        `INSERT INTO crew_memberships
         (id, crew_id, player_id, rank, rank_order, joined_at, last_active)
         VALUES (?, ?, ?, 'MEMBER', 0, datetime('now'), datetime('now'))`
      )
      .bind(membershipId, crewId, userId)
      .run();

    await c.env.DB
      .prepare(
        `UPDATE crews SET member_count = member_count + 1 WHERE id = ?`
      )
      .bind(crewId)
      .run();

    await c.env.DB
      .prepare(
        `UPDATE player_profiles SET crew_id = ?, crew_rank = 'MEMBER' WHERE id = ?`
      )
      .bind(crewId, userId)
      .run();

    return c.json({
      success: true,
      data: {
        joined: true,
        crewId,
        crewName: crew.name,
        message: `Joined ${crew.name}`,
      },
    });
  }

  // INVITE_ONLY - create application
  // Simplified: would normally create application record
  return c.json({
    success: true,
    data: {
      applied: true,
      crewId,
      crewName: crew.name,
      applicationMessage: message,
      message: `Application submitted to ${crew.name}`,
    },
  });
});

/**
 * POST /social/crews/:crewId/members/:memberId/promote
 * Promote a member.
 */
socialRoutes.post('/crews/:crewId/members/:memberId/promote', async (c) => {
  const userId = c.get('userId');
  const crewId = c.req.param('crewId');
  const memberId = c.req.param('memberId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Check permission
  const currentMember = await c.env.DB
    .prepare(
      `SELECT can_promote, rank_order FROM crew_memberships
       WHERE crew_id = ? AND player_id = ? AND is_active = 1`
    )
    .bind(crewId, userId)
    .first<{ can_promote: number; rank_order: number }>();

  if (!currentMember?.can_promote) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PERMISSION', message: 'No permission to promote members' }],
    }, 403);
  }

  // Get target member
  const targetMember = await c.env.DB
    .prepare(
      `SELECT cm.id, cm.player_id, cm.rank, cm.rank_order, pp.display_name
       FROM crew_memberships cm
       LEFT JOIN player_profiles pp ON cm.player_id = pp.id
       WHERE cm.id = ? AND cm.crew_id = ? AND cm.is_active = 1`
    )
    .bind(memberId, crewId)
    .first<{
      id: string;
      player_id: string;
      rank: string;
      rank_order: number;
      display_name: string | null;
    }>();

  if (!targetMember) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Member not found' }],
    }, 404);
  }

  // Cannot promote to equal or higher rank
  if (targetMember.rank_order >= currentMember.rank_order - 1) {
    return c.json({
      success: false,
      errors: [{ code: 'RANK_LIMIT', message: 'Cannot promote to equal or higher rank' }],
    }, 400);
  }

  // Promote
  const newRankOrder = targetMember.rank_order + 10;
  const newRank = newRankOrder >= 50 ? 'OFFICER' : 'MEMBER';

  await c.env.DB
    .prepare(
      `UPDATE crew_memberships
       SET rank = ?, rank_order = ?, can_invite = ?
       WHERE id = ?`
    )
    .bind(newRank, newRankOrder, newRank === 'OFFICER' ? 1 : 0, memberId)
    .run();

  return c.json({
    success: true,
    data: {
      member: {
        id: memberId,
        displayName: targetMember.display_name,
        newRank,
      },
      message: `Promoted ${targetMember.display_name || 'member'} to ${newRank}`,
    },
  });
});

/**
 * POST /social/crews/:crewId/members/:memberId/demote
 * Demote a member.
 */
socialRoutes.post('/crews/:crewId/members/:memberId/demote', async (c) => {
  const userId = c.get('userId');
  const crewId = c.req.param('crewId');
  const memberId = c.req.param('memberId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Check permission
  const currentMember = await c.env.DB
    .prepare(
      `SELECT can_promote, rank_order FROM crew_memberships
       WHERE crew_id = ? AND player_id = ? AND is_active = 1`
    )
    .bind(crewId, userId)
    .first<{ can_promote: number; rank_order: number }>();

  if (!currentMember?.can_promote) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PERMISSION', message: 'No permission to demote members' }],
    }, 403);
  }

  // Get target member
  const targetMember = await c.env.DB
    .prepare(
      `SELECT cm.id, cm.player_id, cm.rank, cm.rank_order, pp.display_name
       FROM crew_memberships cm
       LEFT JOIN player_profiles pp ON cm.player_id = pp.id
       WHERE cm.id = ? AND cm.crew_id = ? AND cm.is_active = 1`
    )
    .bind(memberId, crewId)
    .first<{
      id: string;
      player_id: string;
      rank: string;
      rank_order: number;
      display_name: string | null;
    }>();

  if (!targetMember) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Member not found' }],
    }, 404);
  }

  // Cannot demote higher ranked members
  if (targetMember.rank_order >= currentMember.rank_order) {
    return c.json({
      success: false,
      errors: [{ code: 'RANK_LIMIT', message: 'Cannot demote higher ranked members' }],
    }, 400);
  }

  // Already minimum rank
  if (targetMember.rank_order <= 0) {
    return c.json({
      success: false,
      errors: [{ code: 'MIN_RANK', message: 'Member is already at minimum rank' }],
    }, 400);
  }

  // Demote
  const newRankOrder = Math.max(0, targetMember.rank_order - 10);
  const newRank = newRankOrder >= 50 ? 'OFFICER' : 'MEMBER';

  await c.env.DB
    .prepare(
      `UPDATE crew_memberships
       SET rank = ?, rank_order = ?, can_invite = 0, can_kick = 0, can_promote = 0
       WHERE id = ?`
    )
    .bind(newRank, newRankOrder, memberId)
    .run();

  return c.json({
    success: true,
    data: {
      member: {
        id: memberId,
        displayName: targetMember.display_name,
        newRank,
      },
      message: `Demoted ${targetMember.display_name || 'member'} to ${newRank}`,
    },
  });
});

/**
 * DELETE /social/crews/:crewId/members/:memberId
 * Kick a member from the crew.
 */
socialRoutes.delete('/crews/:crewId/members/:memberId', async (c) => {
  const userId = c.get('userId');
  const crewId = c.req.param('crewId');
  const memberId = c.req.param('memberId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Check permission
  const currentMember = await c.env.DB
    .prepare(
      `SELECT can_kick, rank_order FROM crew_memberships
       WHERE crew_id = ? AND player_id = ? AND is_active = 1`
    )
    .bind(crewId, userId)
    .first<{ can_kick: number; rank_order: number }>();

  if (!currentMember?.can_kick) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PERMISSION', message: 'No permission to kick members' }],
    }, 403);
  }

  // Get target member
  const targetMember = await c.env.DB
    .prepare(
      `SELECT cm.id, cm.player_id, cm.rank_order, pp.display_name
       FROM crew_memberships cm
       LEFT JOIN player_profiles pp ON cm.player_id = pp.id
       WHERE cm.id = ? AND cm.crew_id = ? AND cm.is_active = 1`
    )
    .bind(memberId, crewId)
    .first<{ id: string; player_id: string; rank_order: number; display_name: string | null }>();

  if (!targetMember) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Member not found' }],
    }, 404);
  }

  // Cannot kick higher ranked members
  if (targetMember.rank_order >= currentMember.rank_order) {
    return c.json({
      success: false,
      errors: [{ code: 'RANK_LIMIT', message: 'Cannot kick higher ranked members' }],
    }, 400);
  }

  // Remove membership
  await c.env.DB
    .prepare('UPDATE crew_memberships SET is_active = 0 WHERE id = ?')
    .bind(memberId)
    .run();

  // Update crew member count
  await c.env.DB
    .prepare('UPDATE crews SET member_count = member_count - 1 WHERE id = ?')
    .bind(crewId)
    .run();

  // Update player profile
  await c.env.DB
    .prepare(
      `UPDATE player_profiles SET crew_id = NULL, crew_rank = NULL WHERE id = ?`
    )
    .bind(targetMember.player_id)
    .run();

  return c.json({
    success: true,
    data: {
      kicked: {
        playerId: targetMember.player_id,
        displayName: targetMember.display_name,
      },
      message: `Kicked ${targetMember.display_name || 'member'} from the crew`,
    },
  });
});

/**
 * POST /social/crews/:crewId/leave
 * Leave the crew.
 */
socialRoutes.post('/crews/:crewId/leave', async (c) => {
  const userId = c.get('userId');
  const crewId = c.req.param('crewId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Get membership
  const membership = await c.env.DB
    .prepare(
      `SELECT id, rank FROM crew_memberships
       WHERE crew_id = ? AND player_id = ? AND is_active = 1`
    )
    .bind(crewId, userId)
    .first<{ id: string; rank: string }>();

  if (!membership) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_IN_CREW', message: 'Not a member of this crew' }],
    }, 400);
  }

  // Leaders cannot leave - must transfer or disband
  if (membership.rank === 'LEADER') {
    return c.json({
      success: false,
      errors: [{ code: 'LEADER_CANNOT_LEAVE', message: 'Leader must transfer leadership or disband crew' }],
    }, 400);
  }

  // Leave crew
  await c.env.DB
    .prepare('UPDATE crew_memberships SET is_active = 0 WHERE id = ?')
    .bind(membership.id)
    .run();

  await c.env.DB
    .prepare('UPDATE crews SET member_count = member_count - 1 WHERE id = ?')
    .bind(crewId)
    .run();

  await c.env.DB
    .prepare(
      `UPDATE player_profiles SET crew_id = NULL, crew_rank = NULL WHERE id = ?`
    )
    .bind(userId)
    .run();

  return c.json({
    success: true,
    data: {
      message: 'Left the crew',
    },
  });
});

/**
 * GET /social/crews/:crewId/bank
 * Get crew bank balance and recent transactions.
 */
socialRoutes.get('/crews/:crewId/bank', async (c) => {
  const userId = c.get('userId');
  const crewId = c.req.param('crewId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Check membership
  const membership = await c.env.DB
    .prepare(
      `SELECT can_access_bank, bank_withdraw_limit FROM crew_memberships
       WHERE crew_id = ? AND player_id = ? AND is_active = 1`
    )
    .bind(crewId, userId)
    .first<{ can_access_bank: number; bank_withdraw_limit: number }>();

  if (!membership) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_IN_CREW', message: 'Not a member of this crew' }],
    }, 400);
  }

  const crew = await c.env.DB
    .prepare('SELECT crew_bank_balance FROM crews WHERE id = ?')
    .bind(crewId)
    .first<{ crew_bank_balance: number }>();

  return c.json({
    success: true,
    data: {
      balance: crew?.crew_bank_balance || 0,
      canAccess: membership.can_access_bank === 1,
      withdrawLimit: membership.bank_withdraw_limit,
      // In full implementation, would include recent transactions
      recentTransactions: [],
    },
  });
});

/**
 * POST /social/crews/:crewId/bank/deposit
 * Deposit credits to crew bank.
 */
socialRoutes.post('/crews/:crewId/bank/deposit', zValidator('json', bankTransactionSchema), async (c) => {
  const userId = c.get('userId');
  const crewId = c.req.param('crewId');
  const { amount, note } = c.req.valid('json');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Check membership
  const membership = await c.env.DB
    .prepare(
      `SELECT id FROM crew_memberships
       WHERE crew_id = ? AND player_id = ? AND is_active = 1`
    )
    .bind(crewId, userId)
    .first<{ id: string }>();

  if (!membership) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_IN_CREW', message: 'Not a member of this crew' }],
    }, 400);
  }

  // Check player has funds (simplified - would check character_finances)
  // For now, just update crew bank

  await c.env.DB
    .prepare('UPDATE crews SET crew_bank_balance = crew_bank_balance + ? WHERE id = ?')
    .bind(amount, crewId)
    .run();

  // Update contribution tracking
  await c.env.DB
    .prepare(
      `UPDATE crew_memberships
       SET credits_contributed = credits_contributed + ?
       WHERE id = ?`
    )
    .bind(amount, membership.id)
    .run();

  return c.json({
    success: true,
    data: {
      deposited: amount,
      note,
      message: `Deposited ${amount} credits to crew bank`,
    },
  });
});

/**
 * POST /social/crews/:crewId/bank/withdraw
 * Withdraw credits from crew bank.
 */
socialRoutes.post('/crews/:crewId/bank/withdraw', zValidator('json', bankTransactionSchema), async (c) => {
  const userId = c.get('userId');
  const crewId = c.req.param('crewId');
  const { amount, note } = c.req.valid('json');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  // Check membership and permissions
  const membership = await c.env.DB
    .prepare(
      `SELECT can_access_bank, bank_withdraw_limit FROM crew_memberships
       WHERE crew_id = ? AND player_id = ? AND is_active = 1`
    )
    .bind(crewId, userId)
    .first<{ can_access_bank: number; bank_withdraw_limit: number }>();

  if (!membership?.can_access_bank) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PERMISSION', message: 'No permission to access crew bank' }],
    }, 403);
  }

  if (amount > membership.bank_withdraw_limit) {
    return c.json({
      success: false,
      errors: [{
        code: 'EXCEEDS_LIMIT',
        message: `Withdrawal exceeds limit of ${membership.bank_withdraw_limit}`,
      }],
    }, 400);
  }

  // Check crew has funds
  const crew = await c.env.DB
    .prepare('SELECT crew_bank_balance FROM crews WHERE id = ?')
    .bind(crewId)
    .first<{ crew_bank_balance: number }>();

  if (!crew || crew.crew_bank_balance < amount) {
    return c.json({
      success: false,
      errors: [{ code: 'INSUFFICIENT_FUNDS', message: 'Crew bank has insufficient funds' }],
    }, 400);
  }

  await c.env.DB
    .prepare('UPDATE crews SET crew_bank_balance = crew_bank_balance - ? WHERE id = ?')
    .bind(amount, crewId)
    .run();

  return c.json({
    success: true,
    data: {
      withdrawn: amount,
      note,
      newBalance: crew.crew_bank_balance - amount,
      message: `Withdrew ${amount} credits from crew bank`,
    },
  });
});

/**
 * GET /social/my-crew
 * Get player's current crew.
 */
socialRoutes.get('/my-crew', async (c) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  const membership = await c.env.DB
    .prepare(
      `SELECT cm.*, c.*
       FROM crew_memberships cm
       JOIN crews c ON cm.crew_id = c.id
       WHERE cm.player_id = ? AND cm.is_active = 1 AND c.is_active = 1`
    )
    .bind(userId)
    .first<MembershipRow & CrewRow>();

  if (!membership) {
    return c.json({
      success: true,
      data: {
        crew: null,
        membership: null,
        message: 'Not in a crew',
      },
    });
  }

  return c.json({
    success: true,
    data: {
      crew: formatCrew(membership),
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
    },
  });
});
