/**
 * Surge Protocol - Faction Routes
 *
 * Endpoints:
 * - GET /factions - List all factions
 * - GET /factions/:id - Get faction details
 * - GET /factions/:id/standing - Get player's standing with faction
 * - GET /factions/wars/active - Get active wars
 * - POST /factions/wars/:id/contribute - Submit war contribution
 * - GET /factions/:id/members - Get faction members (leaderboard)
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  authMiddleware,
  type AuthVariables,
} from '../../middleware/auth';
import {
  getAllFactions,
  getFactionReputation,
  updateFactionReputation,
} from '../../db';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  WAR_THEATER: DurableObjectNamespace;
  JWT_SECRET: string;
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const contributeSchema = z.object({
  contributionType: z.enum(['COMBAT', 'SUPPLY', 'INTEL', 'SABOTAGE', 'MISSION']),
  value: z.number().int().min(1).max(1000),
  objectiveId: z.string().optional(),
  characterName: z.string().optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

export const factionRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

/**
 * GET /factions
 * List all factions with basic info.
 */
factionRoutes.get('/', async (c) => {
  // Try to get from cache first
  const cached = await c.env.CACHE.get('factions:all', 'json');
  if (cached) {
    return c.json({
      success: true,
      data: { factions: cached, cached: true },
    });
  }

  const factions = await getAllFactions(c.env.DB);

  // Get war involvement for each faction
  const factionsWithWars = await Promise.all(
    factions.map(async (faction) => {
      const activeWars = await c.env.DB
        .prepare(
          `SELECT COUNT(*) as count FROM faction_wars
           WHERE (attacker_faction_id = ? OR defender_faction_id = ?)
           AND status = 'ACTIVE'`
        )
        .bind(faction.id, faction.id)
        .first<{ count: number }>();

      return {
        id: faction.id,
        code: faction.code,
        name: faction.name,
        factionType: faction.faction_type,
        description: faction.description,
        isJoinable: faction.is_joinable === 1,
        isHostileDefault: faction.is_hostile_default === 1,
        activeWars: activeWars?.count ?? 0,
      };
    })
  );

  // Cache for 5 minutes
  await c.env.CACHE.put('factions:all', JSON.stringify(factionsWithWars), {
    expirationTtl: 300,
  });

  return c.json({
    success: true,
    data: {
      factions: factionsWithWars,
      count: factionsWithWars.length,
    },
  });
});

/**
 * GET /factions/wars/active
 * Get all active faction wars.
 */
factionRoutes.get('/wars/active', async (c) => {
  const wars = await c.env.DB
    .prepare(
      `SELECT fw.*,
              af.name as attacker_name,
              df.name as defender_name
       FROM faction_wars fw
       JOIN factions af ON fw.attacker_faction_id = af.id
       JOIN factions df ON fw.defender_faction_id = df.id
       WHERE fw.status = 'ACTIVE'
       ORDER BY fw.started_at DESC`
    )
    .all();

  return c.json({
    success: true,
    data: {
      wars: wars.results,
      count: wars.results.length,
    },
  });
});

/**
 * GET /factions/:id
 * Get detailed faction information.
 */
factionRoutes.get('/:id', async (c) => {
  const factionId = c.req.param('id');

  const faction = await c.env.DB
    .prepare('SELECT * FROM factions WHERE id = ?')
    .bind(factionId)
    .first();

  if (!faction) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Faction not found' }],
    }, 404);
  }

  // Get faction relationships
  const relationships = await c.env.DB
    .prepare(
      `SELECT fr.*, f.name as target_faction_name
       FROM faction_relationships fr
       JOIN factions f ON fr.target_faction_id = f.id
       WHERE fr.source_faction_id = ?`
    )
    .bind(factionId)
    .all();

  // Get active wars
  const wars = await c.env.DB
    .prepare(
      `SELECT fw.*,
              af.name as attacker_name,
              df.name as defender_name
       FROM faction_wars fw
       JOIN factions af ON fw.attacker_faction_id = af.id
       JOIN factions df ON fw.defender_faction_id = df.id
       WHERE (fw.attacker_faction_id = ? OR fw.defender_faction_id = ?)
       AND fw.status = 'ACTIVE'`
    )
    .bind(factionId, factionId)
    .all();

  // Get top contributors
  const topContributors = await c.env.DB
    .prepare(
      `SELECT c.handle, c.street_name, cr.reputation_value, cr.missions_completed_for
       FROM character_reputations cr
       JOIN characters c ON cr.character_id = c.id
       WHERE cr.faction_id = ?
       ORDER BY cr.reputation_value DESC
       LIMIT 10`
    )
    .bind(factionId)
    .all();

  // Get faction stats
  const stats = await c.env.DB
    .prepare(
      `SELECT
         COUNT(*) as total_members,
         AVG(reputation_value) as avg_reputation,
         SUM(missions_completed_for) as total_missions
       FROM character_reputations
       WHERE faction_id = ? AND is_member = 1`
    )
    .bind(factionId)
    .first();

  return c.json({
    success: true,
    data: {
      faction,
      relationships: relationships.results,
      activeWars: wars.results,
      topContributors: topContributors.results,
      stats,
    },
  });
});

/**
 * GET /factions/:id/standing
 * Get the authenticated user's standing with a faction.
 */
factionRoutes.get('/:id/standing', authMiddleware(), async (c) => {
  const factionId = c.req.param('id');
  const characterId = c.get('characterId');

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_CHARACTER', message: 'No character selected' }],
    }, 400);
  }

  const reputation = await getFactionReputation(c.env.DB, characterId, factionId);

  if (!reputation) {
    // Return default standing for new characters
    return c.json({
      success: true,
      data: {
        standing: {
          factionId,
          characterId,
          reputationValue: 0,
          reputationTier: 'NEUTRAL',
          isMember: false,
          rankInFaction: null,
          missionsCompletedFor: 0,
          lifetimeReputationGained: 0,
          lifetimeReputationLost: 0,
          lastInteraction: null,
        },
      },
    });
  }

  // Get available perks for current tier
  const perks = await c.env.DB
    .prepare(
      `SELECT * FROM faction_perks
       WHERE faction_id = ?
       AND required_reputation_tier <= ?
       ORDER BY required_reputation_tier ASC`
    )
    .bind(factionId, reputation.reputation_tier)
    .all();

  // Get next tier requirements
  const nextTier = getNextTier(reputation.reputation_tier);
  const nextTierThreshold = getTierThreshold(nextTier);

  return c.json({
    success: true,
    data: {
      standing: {
        factionId,
        characterId,
        reputationValue: reputation.reputation_value,
        reputationTier: reputation.reputation_tier,
        isMember: reputation.is_member === 1,
        rankInFaction: reputation.rank_in_faction,
        missionsCompletedFor: reputation.missions_completed_for,
        lifetimeReputationGained: reputation.lifetime_reputation_gained,
        lifetimeReputationLost: reputation.lifetime_reputation_lost,
        lastInteraction: reputation.last_interaction,
      },
      perks: perks.results,
      nextTier: nextTier !== reputation.reputation_tier ? {
        tier: nextTier,
        requiredReputation: nextTierThreshold,
        progress: reputation.reputation_value / nextTierThreshold,
      } : null,
    },
  });
});

/**
 * GET /factions/:id/members
 * Get faction leaderboard/members.
 */
factionRoutes.get('/:id/members', async (c) => {
  const factionId = c.req.param('id');
  const limit = parseInt(c.req.query('limit') ?? '20');
  const offset = parseInt(c.req.query('offset') ?? '0');

  const members = await c.env.DB
    .prepare(
      `SELECT
         c.id, c.handle, c.street_name, c.carrier_rating, c.current_tier,
         cr.reputation_value, cr.reputation_tier, cr.rank_in_faction, cr.missions_completed_for
       FROM character_reputations cr
       JOIN characters c ON cr.character_id = c.id
       WHERE cr.faction_id = ?
       ORDER BY cr.reputation_value DESC
       LIMIT ? OFFSET ?`
    )
    .bind(factionId, limit, offset)
    .all();

  const totalCount = await c.env.DB
    .prepare(
      'SELECT COUNT(*) as count FROM character_reputations WHERE faction_id = ?'
    )
    .bind(factionId)
    .first<{ count: number }>();

  return c.json({
    success: true,
    data: {
      members: members.results,
      count: members.results.length,
      total: totalCount?.count ?? 0,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < (totalCount?.count ?? 0),
      },
    },
  });
});

/**
 * POST /factions/wars/:warId/contribute
 * Submit a contribution to an active war.
 */
factionRoutes.post(
  '/wars/:warId/contribute',
  authMiddleware(),
  zValidator('json', contributeSchema),
  async (c) => {
    const warId = c.req.param('warId');
    const characterId = c.get('characterId');
    const contribution = c.req.valid('json');

    if (!characterId) {
      return c.json({
        success: false,
        errors: [{ code: 'NO_CHARACTER', message: 'No character selected' }],
      }, 400);
    }

    // Get character's faction affiliation for this war
    const war = await c.env.DB
      .prepare(
        `SELECT * FROM faction_wars WHERE id = ? AND status = 'ACTIVE'`
      )
      .bind(warId)
      .first<{
        id: string;
        attacker_faction_id: string;
        defender_faction_id: string;
        durable_object_id: string;
      }>();

    if (!war) {
      return c.json({
        success: false,
        errors: [{ code: 'WAR_NOT_FOUND', message: 'Active war not found' }],
      }, 404);
    }

    // Check character's faction standing
    const attackerRep = await getFactionReputation(
      c.env.DB,
      characterId,
      war.attacker_faction_id
    );
    const defenderRep = await getFactionReputation(
      c.env.DB,
      characterId,
      war.defender_faction_id
    );

    // Determine which side the character is on
    let factionId: string;
    if (attackerRep && attackerRep.is_member === 1) {
      factionId = war.attacker_faction_id;
    } else if (defenderRep && defenderRep.is_member === 1) {
      factionId = war.defender_faction_id;
    } else {
      // Allow mercenary contributions based on reputation
      const attackerValue = attackerRep?.reputation_value ?? 0;
      const defenderValue = defenderRep?.reputation_value ?? 0;

      if (attackerValue > defenderValue && attackerValue >= 20) {
        factionId = war.attacker_faction_id;
      } else if (defenderValue > attackerValue && defenderValue >= 20) {
        factionId = war.defender_faction_id;
      } else {
        return c.json({
          success: false,
          errors: [{
            code: 'NO_AFFILIATION',
            message: 'Must be a member or have FRIENDLY standing with a faction to contribute',
          }],
        }, 403);
      }
    }

    // Get character name
    const character = await c.env.DB
      .prepare('SELECT handle, street_name FROM characters WHERE id = ?')
      .bind(characterId)
      .first<{ handle: string | null; street_name: string | null }>();

    // Send contribution to WarTheater Durable Object
    const doId = c.env.WAR_THEATER.idFromName(war.durable_object_id || warId);
    const stub = c.env.WAR_THEATER.get(doId);

    const response = await stub.fetch(new Request('http://internal/contribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterId,
        characterName: contribution.characterName ??
          character?.street_name ??
          character?.handle ??
          'Unknown',
        factionId,
        contributionType: contribution.contributionType,
        value: contribution.value,
        objectiveId: contribution.objectiveId,
      }),
    }));

    const result = await response.json() as {
      success: boolean;
      contribution?: unknown;
      factionScore?: number;
      error?: string;
    };

    if (!result.success) {
      return c.json({
        success: false,
        errors: [{ code: 'CONTRIBUTION_FAILED', message: result.error ?? 'Failed to process contribution' }],
      }, 400);
    }

    // Update character's faction reputation
    await updateFactionReputation(c.env.DB, characterId, factionId, Math.ceil(contribution.value * 0.1));

    return c.json({
      success: true,
      data: {
        contribution: result.contribution,
        factionScore: result.factionScore,
        reputationGained: Math.ceil(contribution.value * 0.1),
      },
    });
  }
);

/**
 * POST /factions/:id/join
 * Request to join a faction.
 */
factionRoutes.post('/:id/join', authMiddleware(), async (c) => {
  const factionId = c.req.param('id');
  const characterId = c.get('characterId');

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_CHARACTER', message: 'No character selected' }],
    }, 400);
  }

  // Check if faction is joinable
  const faction = await c.env.DB
    .prepare('SELECT * FROM factions WHERE id = ?')
    .bind(factionId)
    .first<{ id: string; is_joinable: number; name: string }>();

  if (!faction) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Faction not found' }],
    }, 404);
  }

  if (faction.is_joinable !== 1) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_JOINABLE', message: 'This faction is not accepting new members' }],
    }, 403);
  }

  // Check current standing
  const reputation = await getFactionReputation(c.env.DB, characterId, factionId);

  if (reputation?.is_member === 1) {
    return c.json({
      success: false,
      errors: [{ code: 'ALREADY_MEMBER', message: 'Already a member of this faction' }],
    }, 400);
  }

  // Check if meets minimum reputation (FRIENDLY = 20+)
  const repValue = reputation?.reputation_value ?? 0;
  if (repValue < 20) {
    return c.json({
      success: false,
      errors: [{
        code: 'INSUFFICIENT_REPUTATION',
        message: `Need FRIENDLY standing (20+) to join. Current: ${repValue}`,
      }],
    }, 403);
  }

  // Join the faction
  if (reputation) {
    await c.env.DB
      .prepare(
        `UPDATE character_reputations
         SET is_member = 1, rank_in_faction = 'INITIATE', updated_at = datetime('now')
         WHERE character_id = ? AND faction_id = ?`
      )
      .bind(characterId, factionId)
      .run();
  } else {
    const { nanoid } = await import('nanoid');
    await c.env.DB
      .prepare(
        `INSERT INTO character_reputations
         (id, character_id, faction_id, reputation_value, reputation_tier, is_member, rank_in_faction)
         VALUES (?, ?, ?, 20, 'FRIENDLY', 1, 'INITIATE')`
      )
      .bind(nanoid(), characterId, factionId)
      .run();
  }

  return c.json({
    success: true,
    data: {
      message: `Welcome to ${faction.name}`,
      rank: 'INITIATE',
    },
  });
});

/**
 * POST /factions/:id/leave
 * Leave a faction.
 */
factionRoutes.post('/:id/leave', authMiddleware(), async (c) => {
  const factionId = c.req.param('id');
  const characterId = c.get('characterId');

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_CHARACTER', message: 'No character selected' }],
    }, 400);
  }

  const reputation = await getFactionReputation(c.env.DB, characterId, factionId);

  if (!reputation || reputation.is_member !== 1) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_MEMBER', message: 'Not a member of this faction' }],
    }, 400);
  }

  // Leave the faction (reputation penalty)
  await c.env.DB
    .prepare(
      `UPDATE character_reputations
       SET is_member = 0, rank_in_faction = NULL, reputation_value = reputation_value - 10,
           updated_at = datetime('now')
       WHERE character_id = ? AND faction_id = ?`
    )
    .bind(characterId, factionId)
    .run();

  return c.json({
    success: true,
    data: {
      message: 'You have left the faction',
      reputationPenalty: -10,
    },
  });
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

type ReputationTier = 'HOSTILE' | 'UNFRIENDLY' | 'NEUTRAL' | 'FRIENDLY' | 'ALLIED' | 'REVERED';

function getNextTier(currentTier: ReputationTier): ReputationTier {
  const tiers: ReputationTier[] = ['HOSTILE', 'UNFRIENDLY', 'NEUTRAL', 'FRIENDLY', 'ALLIED', 'REVERED'];
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1]! : currentTier;
}

function getTierThreshold(tier: ReputationTier): number {
  const thresholds: Record<ReputationTier, number> = {
    HOSTILE: -60,
    UNFRIENDLY: -20,
    NEUTRAL: 0,
    FRIENDLY: 20,
    ALLIED: 60,
    REVERED: 90,
  };
  return thresholds[tier];
}
