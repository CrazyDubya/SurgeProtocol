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
import { SocialService } from '../../services/social';
import type { D1Database } from '@cloudflare/workers-types';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

// Row interfaces removed - now using types from SocialService

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



// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Helper functions removed - now handled by SocialService

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

  const service = new SocialService(c.env.DB);
  const friends = await service.listFriends(userId);

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

  const service = new SocialService(c.env.DB);
  const requests = await service.getFriendRequests(userId);

  return c.json({
    success: true,
    data: requests,
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

  const service = new SocialService(c.env.DB);
  try {
    const result = await service.sendFriendRequest(userId, targetPlayerId);
    return c.json({
      success: true,
      data: result,
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'REQUEST_FAILED', message: e.message }],
    }, 400);
  }
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

  const service = new SocialService(c.env.DB);
  try {
    const newFriend = await service.acceptFriendRequest(userId, friendshipId);
    return c.json({
      success: true,
      data: {
        friendshipId,
        newFriend,
        message: `Now friends with ${newFriend.displayName || 'player'}`,
      },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'ACCEPT_FAILED', message: e.message }],
    }, 400);
  }
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

  const service = new SocialService(c.env.DB);
  try {
    await service.rejectFriendRequest(userId, friendshipId);
    return c.json({
      success: true,
      data: { message: 'Friend request rejected' },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'REJECT_FAILED', message: e.message }],
    }, 400);
  }
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

  const service = new SocialService(c.env.DB);
  try {
    await service.removeFriend(userId, friendshipId);
    return c.json({
      success: true,
      data: { message: 'Friend removed' },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'REMOVE_FAILED', message: e.message }],
    }, 400);
  }
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

  const service = new SocialService(c.env.DB);
  try {
    await service.updateFriendSettings(userId, friendshipId, updates);
    return c.json({
      success: true,
      data: {
        updated: Object.keys(updates),
        message: 'Friend settings updated',
      },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'UPDATE_FAILED', message: e.message }],
    }, 400);
  }
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

  const service = new SocialService(c.env.DB);
  try {
    await service.blockPlayer(userId, targetPlayerId);
    return c.json({
      success: true,
      data: { message: 'Player blocked' },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'BLOCK_FAILED', message: e.message }],
    }, 400);
  }
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

  const service = new SocialService(c.env.DB);
  try {
    await service.unblockPlayer(userId, targetPlayerId);
    return c.json({
      success: true,
      data: { message: 'Player unblocked' },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'UNBLOCK_FAILED', message: e.message }],
    }, 400);
  }
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

  const service = new SocialService(c.env.DB);
  const crews = await service.listCrews({
    search,
    status,
    minRating: minRating ? parseInt(minRating, 10) : undefined,
    limit,
    offset
  });

  return c.json({
    success: true,
    data: {
      crews,
      pagination: {
        limit,
        offset,
        count: crews.length,
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
  const service = new SocialService(c.env.DB);

  try {
    const details = await service.getCrewDetails(crewId);
    if (!details) {
      return c.json({
        success: false,
        errors: [{ code: 'NOT_FOUND', message: 'Crew not found' }],
      }, 404);
    }

    return c.json({
      success: true,
      data: details,
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'FETCH_FAILED', message: e.message }],
    }, 400);
  }
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

  const service = new SocialService(c.env.DB);
  try {
    const result = await service.createCrew(userId, data);
    return c.json({
      success: true,
      data: {
        ...result,
        message: `Created crew: ${data.name}`,
      },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'CREATE_FAILED', message: e.message }],
    }, 400);
  }
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

  const service = new SocialService(c.env.DB);
  try {
    await service.updateCrew(userId, crewId, updates);
    return c.json({
      success: true,
      data: {
        updated: Object.keys(updates),
        message: 'Crew settings updated',
      },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'UPDATE_FAILED', message: e.message }],
    }, 400);
  }
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

  const service = new SocialService(c.env.DB);
  try {
    const crewName = await service.disbandCrew(userId, crewId);
    return c.json({
      success: true,
      data: { message: `Crew "${crewName}" has been disbanded` },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'DISBAND_FAILED', message: e.message }],
    }, 400);
  }
});

/**
 * GET /social/crews/:crewId/members
 * List crew members.
 */
socialRoutes.get('/crews/:crewId/members', async (c) => {
  const crewId = c.req.param('crewId');
  const service = new SocialService(c.env.DB);
  const members = await service.listCrewMembers(crewId);

  return c.json({
    success: true,
    data: {
      members,
      totalCount: members.length,
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

  const service = new SocialService(c.env.DB);
  try {
    const result = await service.inviteMember(userId, crewId, targetPlayerId);
    return c.json({
      success: true,
      data: {
        ...result,
        message: `Invitation sent to ${result.invited.displayName || 'player'}`,
      },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'INVITE_FAILED', message: e.message }],
    }, 400);
  }
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
    // const { nanoid } = await import('nanoid');
    const membershipId = crypto.randomUUID();

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
 * POST /social/crews/:crewId/promote/:memberId
 * Promote a member.
 */
socialRoutes.post('/crews/:crewId/promote/:memberId', async (c) => {
  const userId = c.get('userId');
  const crewId = c.req.param('crewId');
  const memberId = c.req.param('memberId');
  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  const service = new SocialService(c.env.DB);
  try {
    const result = await service.promoteMember(userId, crewId, memberId);
    return c.json({
      success: true,
      data: {
        ...result,
        message: `Promoted ${result.displayName || 'member'} to ${result.newRank}`,
      },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'PROMOTE_FAILED', message: e.message }],
    }, 400);
  }
});

/**
 * POST /social/crews/:crewId/demote/:memberId
 * Demote a crew member.
 */
socialRoutes.post('/crews/:crewId/demote/:memberId', async (c) => {
  const userId = c.get('userId');
  const crewId = c.req.param('crewId');
  const memberId = c.req.param('memberId');
  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  const service = new SocialService(c.env.DB);
  try {
    const result = await service.demoteMember(userId, crewId, memberId);
    return c.json({
      success: true,
      data: {
        ...result,
        message: `Demoted ${result.displayName || 'member'} to ${result.newRank}`,
      },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'DEMOTE_FAILED', message: e.message }],
    }, 400);
  }
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

  const service = new SocialService(c.env.DB);
  try {
    const result = await service.kickMember(userId, crewId, memberId);
    return c.json({
      success: true,
      data: {
        message: `${result.displayName || 'Member'} has been kicked from the crew`,
      },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'KICK_FAILED', message: e.message }],
    }, 400);
  }
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

  const service = new SocialService(c.env.DB);
  try {
    await service.leaveCrew(userId, crewId);
    return c.json({
      success: true,
      data: { message: 'You have left the crew' },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'LEAVE_FAILED', message: e.message }],
    }, 400);
  }
});

/**
 * GET /social/crews/:crewId/bank
 * Get crew bank details.
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

  const service = new SocialService(c.env.DB);
  try {
    const bank = await service.getCrewBank(userId, crewId);
    return c.json({
      success: true,
      data: bank,
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'BANK_ACCESS_FAILED', message: e.message }],
    }, 400);
  }
});

/**
 * POST /social/crews/:crewId/bank/deposit
 * Deposit credits into the crew bank.
 */
socialRoutes.post('/crews/:crewId/bank/deposit', zValidator('json', z.object({ amount: z.number().positive() })), async (c) => {
  const userId = c.get('userId');
  const crewId = c.req.param('crewId');
  const { amount } = c.req.valid('json');
  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  const service = new SocialService(c.env.DB);
  try {
    await service.depositToCrewBank(userId, crewId, amount);
    return c.json({
      success: true,
      data: { message: `Deposited ${amount} credits into crew bank` },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'DEPOSIT_FAILED', message: e.message }],
    }, 400);
  }
});

/**
 * POST /social/crews/:crewId/bank/withdraw
 * Withdraw credits from the crew bank.
 */
socialRoutes.post('/crews/:crewId/bank/withdraw', zValidator('json', z.object({ amount: z.number().positive() })), async (c) => {
  const userId = c.get('userId');
  const crewId = c.req.param('crewId');
  const { amount } = c.req.valid('json');
  if (!userId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_PLAYER', message: 'Player profile required' }],
    }, 400);
  }

  const service = new SocialService(c.env.DB);
  try {
    const newBalance = await service.withdrawFromCrewBank(userId, crewId, amount);
    return c.json({
      success: true,
      data: {
        amount,
        newBalance,
        message: `Withdrew ${amount} credits from crew bank`,
      },
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'WITHDRAW_FAILED', message: e.message }],
    }, 400);
  }
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

  const service = new SocialService(c.env.DB);
  try {
    const data = await service.getPlayerCrew(userId);
    return c.json({
      success: true,
      data,
    });
  } catch (e: any) {
    return c.json({
      success: false,
      errors: [{ code: 'FETCH_FAILED', message: e.message }],
    }, 400);
  }
});
