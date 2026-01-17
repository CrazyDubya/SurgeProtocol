/**
 * Surge Protocol - Quest Routes
 *
 * Endpoints:
 * - GET /quests - List all available quest definitions
 * - GET /quests/:id - Get quest details
 * - GET /quests/character - Get current character's quests
 * - GET /quests/character/:questId - Get specific quest progress
 * - POST /quests/:questId/accept - Accept a quest
 * - POST /quests/:questId/abandon - Abandon a quest
 * - POST /quests/:questId/complete - Complete a quest and claim rewards
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import {
  authMiddleware,
  requireCharacterMiddleware,
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

interface QuestDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  summary: string | null;
  quest_type: string | null;
  quest_category: string | null;
  priority: number;
  difficulty_rating: number;
  quest_giver_npc_id: string | null;
  quest_giver_location_id: string | null;
  required_tier: number;
  required_quests: string | null;
  required_reputation: string | null;
  objectives: string | null;
  is_linear: number;
  has_time_limit: number;
  time_limit_hours: number | null;
  xp_reward: number;
  credit_reward: number;
  item_rewards: string | null;
  reputation_rewards: string | null;
  can_fail: number;
  is_hidden: number;
  repeatable: number;
}

interface QuestObjective {
  id: string;
  quest_definition_id: string;
  sequence_order: number;
  title: string;
  description: string | null;
  objective_type: string | null;
  is_optional: number;
  is_hidden: number;
  target_quantity: number;
  completion_xp: number;
  completion_creds: number;
}

interface CharacterQuest {
  id: string;
  character_id: string;
  quest_definition_id: string;
  accepted_at: string;
  status: string;
  current_stage: number;
  current_objectives: string | null;
  objectives_completed: string | null;
  objectives_failed: string | null;
  completed_at: string | null;
  rewards_claimed: number;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const acceptQuestSchema = z.object({
  tracked: z.boolean().default(true),
});

const updateProgressSchema = z.object({
  objectiveId: z.string(),
  progress: z.number().int().min(0),
});

// =============================================================================
// ROUTES
// =============================================================================

export const questRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Apply auth middleware to all routes
questRoutes.use('*', authMiddleware());

/**
 * GET /quests
 * List all available quest definitions (catalog).
 */
questRoutes.get('/', async (c) => {
  const result = await c.env.DB
    .prepare(
      `SELECT id, code, name, description, summary, quest_type, quest_category,
              priority, difficulty_rating, required_tier, xp_reward, credit_reward,
              is_hidden, repeatable
       FROM quest_definitions
       WHERE is_hidden = 0
       ORDER BY required_tier ASC, priority DESC, name ASC`
    )
    .all<QuestDefinition>();

  // Group by category
  const byCategory: Record<string, typeof result.results> = {};
  for (const quest of result.results) {
    const cat = quest.quest_category || 'Misc';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(quest);
  }

  return c.json({
    success: true,
    data: {
      quests: result.results,
      byCategory,
      count: result.results.length,
    },
  });
});

/**
 * GET /quests/:id
 * Get detailed quest information including objectives.
 */
questRoutes.get('/:id', async (c) => {
  const questId = c.req.param('id');

  const quest = await c.env.DB
    .prepare(
      `SELECT qd.*,
              nd.name as quest_giver_name, nd.npc_type as quest_giver_type,
              l.name as quest_giver_location_name
       FROM quest_definitions qd
       LEFT JOIN npc_definitions nd ON qd.quest_giver_npc_id = nd.id
       LEFT JOIN locations l ON qd.quest_giver_location_id = l.id
       WHERE qd.id = ? OR qd.code = ?`
    )
    .bind(questId, questId)
    .first<QuestDefinition & {
      quest_giver_name: string | null;
      quest_giver_type: string | null;
      quest_giver_location_name: string | null;
    }>();

  if (!quest) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Quest not found' }],
    }, 404);
  }

  // Get objectives
  const objectives = await c.env.DB
    .prepare(
      `SELECT * FROM quest_objectives
       WHERE quest_definition_id = ?
       ORDER BY sequence_order ASC`
    )
    .bind(quest.id)
    .all<QuestObjective>();

  // Parse JSON fields
  const requiredQuests = quest.required_quests ? JSON.parse(quest.required_quests) : [];
  const requiredReputation = quest.required_reputation ? JSON.parse(quest.required_reputation) : [];
  const itemRewards = quest.item_rewards ? JSON.parse(quest.item_rewards) : [];
  const reputationRewards = quest.reputation_rewards ? JSON.parse(quest.reputation_rewards) : [];

  return c.json({
    success: true,
    data: {
      quest: {
        ...quest,
        objectives: objectives.results.map(obj => ({
          ...obj,
          isOptional: obj.is_optional === 1,
          isHidden: obj.is_hidden === 1,
        })),
        requiredQuests,
        requiredReputation,
        itemRewards,
        reputationRewards,
        isLinear: quest.is_linear === 1,
        hasTimeLimit: quest.has_time_limit === 1,
        canFail: quest.can_fail === 1,
        isHidden: quest.is_hidden === 1,
        isRepeatable: quest.repeatable === 1,
        questGiver: quest.quest_giver_npc_id
          ? {
              id: quest.quest_giver_npc_id,
              name: quest.quest_giver_name,
              type: quest.quest_giver_type,
              locationId: quest.quest_giver_location_id,
              locationName: quest.quest_giver_location_name,
            }
          : null,
      },
    },
  });
});

/**
 * GET /quests/character
 * Get current character's active and completed quests.
 * Requires character to be selected.
 */
questRoutes.get('/character', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;

  // Get all character quests with definition info
  const quests = await c.env.DB
    .prepare(
      `SELECT cq.*, qd.code, qd.name, qd.description, qd.summary,
              qd.quest_type, qd.quest_category, qd.difficulty_rating,
              qd.xp_reward, qd.credit_reward, qd.has_time_limit, qd.time_limit_hours
       FROM character_quests cq
       JOIN quest_definitions qd ON cq.quest_definition_id = qd.id
       WHERE cq.character_id = ?
       ORDER BY
         CASE cq.status
           WHEN 'IN_PROGRESS' THEN 1
           WHEN 'ACCEPTED' THEN 2
           WHEN 'COMPLETED' THEN 3
           WHEN 'FAILED' THEN 4
           ELSE 5
         END,
         cq.accepted_at DESC`
    )
    .bind(characterId)
    .all<CharacterQuest & QuestDefinition>();

  // Separate by status
  const active = quests.results.filter(q => q.status === 'IN_PROGRESS' || q.status === 'ACCEPTED');
  const completed = quests.results.filter(q => q.status === 'COMPLETED');
  const failed = quests.results.filter(q => q.status === 'FAILED' || q.status === 'ABANDONED');

  // Calculate deadline for time-limited quests
  const enhancedActive = active.map(quest => {
    let deadline: string | null = null;
    let isOverdue = false;

    if (quest.has_time_limit && quest.time_limit_hours) {
      const acceptedTime = new Date(quest.accepted_at).getTime();
      const deadlineTime = acceptedTime + (quest.time_limit_hours * 60 * 60 * 1000);
      deadline = new Date(deadlineTime).toISOString();
      isOverdue = Date.now() > deadlineTime;
    }

    return {
      ...quest,
      currentObjectives: quest.current_objectives ? JSON.parse(quest.current_objectives) : [],
      objectivesCompleted: quest.objectives_completed ? JSON.parse(quest.objectives_completed) : [],
      deadline,
      isOverdue,
    };
  });

  return c.json({
    success: true,
    data: {
      active: enhancedActive,
      completed: completed.map(q => ({
        ...q,
        objectivesCompleted: q.objectives_completed ? JSON.parse(q.objectives_completed) : [],
      })),
      failed,
      counts: {
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: quests.results.length,
      },
    },
  });
});

/**
 * GET /quests/character/:questId
 * Get detailed progress for a specific character quest.
 */
questRoutes.get('/character/:questId', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;
  const questId = c.req.param('questId');

  // Get character quest with full details
  const charQuest = await c.env.DB
    .prepare(
      `SELECT cq.*, qd.*
       FROM character_quests cq
       JOIN quest_definitions qd ON cq.quest_definition_id = qd.id
       WHERE cq.character_id = ? AND (cq.id = ? OR cq.quest_definition_id = ? OR qd.code = ?)`
    )
    .bind(characterId, questId, questId, questId)
    .first<CharacterQuest & QuestDefinition>();

  if (!charQuest) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Quest not found for this character' }],
    }, 404);
  }

  // Get all objectives for the quest
  const objectives = await c.env.DB
    .prepare(
      `SELECT * FROM quest_objectives
       WHERE quest_definition_id = ?
       ORDER BY sequence_order ASC`
    )
    .bind(charQuest.quest_definition_id)
    .all<QuestObjective>();

  // Parse progress data
  const currentObjectives = charQuest.current_objectives
    ? JSON.parse(charQuest.current_objectives) as Record<string, number>
    : {};
  const completedObjectives = charQuest.objectives_completed
    ? JSON.parse(charQuest.objectives_completed) as string[]
    : [];
  const failedObjectives = charQuest.objectives_failed
    ? JSON.parse(charQuest.objectives_failed) as string[]
    : [];

  // Build objective progress
  const objectiveProgress = objectives.results.map(obj => ({
    id: obj.id,
    title: obj.title,
    description: obj.description,
    type: obj.objective_type,
    isOptional: obj.is_optional === 1,
    isHidden: obj.is_hidden === 1 && !completedObjectives.includes(obj.id),
    targetQuantity: obj.target_quantity,
    currentProgress: currentObjectives[obj.id] ?? 0,
    isCompleted: completedObjectives.includes(obj.id),
    isFailed: failedObjectives.includes(obj.id),
    completionXp: obj.completion_xp,
    completionCredits: obj.completion_creds,
  }));

  // Calculate overall progress
  const requiredObjectives = objectiveProgress.filter(o => !o.isOptional);
  const completedRequired = requiredObjectives.filter(o => o.isCompleted).length;
  const progressPercent = requiredObjectives.length > 0
    ? Math.round((completedRequired / requiredObjectives.length) * 100)
    : 0;

  // Check deadline
  let deadline: string | null = null;
  let isOverdue = false;
  let timeRemaining: number | null = null;

  if (charQuest.has_time_limit && charQuest.time_limit_hours) {
    const acceptedTime = new Date(charQuest.accepted_at).getTime();
    const deadlineTime = acceptedTime + (charQuest.time_limit_hours * 60 * 60 * 1000);
    deadline = new Date(deadlineTime).toISOString();
    isOverdue = Date.now() > deadlineTime;
    timeRemaining = Math.max(0, deadlineTime - Date.now());
  }

  return c.json({
    success: true,
    data: {
      quest: {
        instanceId: charQuest.id,
        definitionId: charQuest.quest_definition_id,
        code: charQuest.code,
        name: charQuest.name,
        description: charQuest.description,
        status: charQuest.status,
        acceptedAt: charQuest.accepted_at,
        completedAt: charQuest.completed_at,
        currentStage: charQuest.current_stage,
      },
      progress: {
        objectives: objectiveProgress,
        completedCount: completedObjectives.length,
        totalRequired: requiredObjectives.length,
        progressPercent,
        canComplete: completedRequired >= requiredObjectives.length && charQuest.status !== 'COMPLETED',
      },
      timing: {
        hasTimeLimit: charQuest.has_time_limit === 1,
        deadline,
        isOverdue,
        timeRemainingMs: timeRemaining,
      },
      rewards: {
        xp: charQuest.xp_reward,
        credits: charQuest.credit_reward,
        items: charQuest.item_rewards ? JSON.parse(charQuest.item_rewards) : [],
        reputation: charQuest.reputation_rewards ? JSON.parse(charQuest.reputation_rewards) : [],
        claimed: charQuest.rewards_claimed === 1,
      },
    },
  });
});

/**
 * POST /quests/:questId/accept
 * Accept a quest.
 */
questRoutes.post('/:questId/accept', requireCharacterMiddleware(), zValidator('json', acceptQuestSchema), async (c) => {
  const characterId = c.get('characterId')!;
  const questId = c.req.param('questId');
  const { tracked } = c.req.valid('json');

  // Get quest definition
  const quest = await c.env.DB
    .prepare(
      `SELECT * FROM quest_definitions WHERE id = ? OR code = ?`
    )
    .bind(questId, questId)
    .first<QuestDefinition>();

  if (!quest) {
    return c.json({
      success: false,
      errors: [{ code: 'QUEST_NOT_FOUND', message: 'Quest not found' }],
    }, 404);
  }

  // Check if already accepted
  const existing = await c.env.DB
    .prepare(
      `SELECT id, status FROM character_quests
       WHERE character_id = ? AND quest_definition_id = ?`
    )
    .bind(characterId, quest.id)
    .first<{ id: string; status: string }>();

  if (existing) {
    if (existing.status === 'IN_PROGRESS' || existing.status === 'ACCEPTED') {
      return c.json({
        success: false,
        errors: [{ code: 'QUEST_ALREADY_ACTIVE', message: 'Quest already in progress' }],
      }, 400);
    }

    if (!quest.repeatable && existing.status === 'COMPLETED') {
      return c.json({
        success: false,
        errors: [{ code: 'QUEST_ALREADY_COMPLETED', message: 'Quest already completed and is not repeatable' }],
      }, 400);
    }
  }

  // Check tier requirement
  const character = await c.env.DB
    .prepare('SELECT current_tier FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_tier: number }>();

  if (!character || character.current_tier < quest.required_tier) {
    return c.json({
      success: false,
      errors: [{
        code: 'TIER_TOO_LOW',
        message: `Requires tier ${quest.required_tier}, you are tier ${character?.current_tier ?? 0}`,
      }],
    }, 400);
  }

  // Check prerequisite quests
  if (quest.required_quests) {
    const prereqs = JSON.parse(quest.required_quests) as string[];

    for (const prereqCode of prereqs) {
      const prereqComplete = await c.env.DB
        .prepare(
          `SELECT cq.status FROM character_quests cq
           JOIN quest_definitions qd ON cq.quest_definition_id = qd.id
           WHERE cq.character_id = ? AND (qd.id = ? OR qd.code = ?) AND cq.status = 'COMPLETED'`
        )
        .bind(characterId, prereqCode, prereqCode)
        .first();

      if (!prereqComplete) {
        return c.json({
          success: false,
          errors: [{
            code: 'PREREQUISITE_NOT_MET',
            message: `Requires completion of quest: ${prereqCode}`,
          }],
        }, 400);
      }
    }
  }

  // Check faction reputation requirements
  if (quest.required_reputation) {
    const reqs = JSON.parse(quest.required_reputation) as Array<{ factionId: string; minRep: number }>;

    for (const req of reqs) {
      const rep = await c.env.DB
        .prepare(
          `SELECT reputation FROM character_faction_standing
           WHERE character_id = ? AND faction_id = ?`
        )
        .bind(characterId, req.factionId)
        .first<{ reputation: number }>();

      if (!rep || rep.reputation < req.minRep) {
        return c.json({
          success: false,
          errors: [{
            code: 'REPUTATION_TOO_LOW',
            message: `Requires ${req.minRep} reputation with faction ${req.factionId}`,
          }],
        }, 400);
      }
    }
  }

  // Get initial objectives
  const objectives = await c.env.DB
    .prepare(
      `SELECT id FROM quest_objectives
       WHERE quest_definition_id = ? AND sequence_order = 0`
    )
    .bind(quest.id)
    .all<{ id: string }>();

  const initialObjectives: Record<string, number> = {};
  for (const obj of objectives.results) {
    initialObjectives[obj.id] = 0;
  }

  // Create character quest entry
  const instanceId = nanoid();
  await c.env.DB
    .prepare(
      `INSERT INTO character_quests (
        id, character_id, quest_definition_id, accepted_at, status,
        current_stage, current_objectives, is_tracked, seed
      ) VALUES (?, ?, ?, datetime('now'), 'ACCEPTED', 0, ?, ?, ?)`
    )
    .bind(
      instanceId,
      characterId,
      quest.id,
      JSON.stringify(initialObjectives),
      tracked ? 1 : 0,
      Math.floor(Math.random() * 1000000)
    )
    .run();

  return c.json({
    success: true,
    data: {
      questInstanceId: instanceId,
      quest: {
        id: quest.id,
        code: quest.code,
        name: quest.name,
        description: quest.description,
      },
      message: `Quest accepted: ${quest.name}`,
    },
  }, 201);
});

/**
 * POST /quests/:questId/progress
 * Update progress on a quest objective.
 */
questRoutes.post('/:questId/progress', requireCharacterMiddleware(), zValidator('json', updateProgressSchema), async (c) => {
  const characterId = c.get('characterId')!;
  const questId = c.req.param('questId');
  const { objectiveId, progress } = c.req.valid('json');

  // Get character quest
  const charQuest = await c.env.DB
    .prepare(
      `SELECT cq.* FROM character_quests cq
       JOIN quest_definitions qd ON cq.quest_definition_id = qd.id
       WHERE cq.character_id = ? AND (cq.id = ? OR qd.code = ?)
       AND cq.status IN ('ACCEPTED', 'IN_PROGRESS')`
    )
    .bind(characterId, questId, questId)
    .first<CharacterQuest>();

  if (!charQuest) {
    return c.json({
      success: false,
      errors: [{ code: 'QUEST_NOT_FOUND', message: 'Active quest not found' }],
    }, 404);
  }

  // Get objective
  const objective = await c.env.DB
    .prepare(
      `SELECT * FROM quest_objectives WHERE id = ? AND quest_definition_id = ?`
    )
    .bind(objectiveId, charQuest.quest_definition_id)
    .first<QuestObjective>();

  if (!objective) {
    return c.json({
      success: false,
      errors: [{ code: 'OBJECTIVE_NOT_FOUND', message: 'Objective not found for this quest' }],
    }, 404);
  }

  // Parse current state
  const currentObjectives = charQuest.current_objectives
    ? JSON.parse(charQuest.current_objectives) as Record<string, number>
    : {};
  const completedObjectives = charQuest.objectives_completed
    ? JSON.parse(charQuest.objectives_completed) as string[]
    : [];

  // Check if already completed
  if (completedObjectives.includes(objectiveId)) {
    return c.json({
      success: false,
      errors: [{ code: 'OBJECTIVE_ALREADY_COMPLETE', message: 'Objective already completed' }],
    }, 400);
  }

  // Update progress
  const newProgress = Math.min(progress, objective.target_quantity);
  currentObjectives[objectiveId] = newProgress;

  // Check if objective is now complete
  const justCompleted = newProgress >= objective.target_quantity;
  if (justCompleted) {
    completedObjectives.push(objectiveId);

    // Award objective completion rewards
    if (objective.completion_xp > 0) {
      await c.env.DB
        .prepare(`UPDATE characters SET current_xp = current_xp + ? WHERE id = ?`)
        .bind(objective.completion_xp, characterId)
        .run();
    }
    if (objective.completion_creds > 0) {
      await c.env.DB
        .prepare(`UPDATE character_finances SET credits = credits + ? WHERE character_id = ?`)
        .bind(objective.completion_creds, characterId)
        .run();
    }
  }

  // Update quest status to IN_PROGRESS if just started
  const newStatus = charQuest.status === 'ACCEPTED' ? 'IN_PROGRESS' : charQuest.status;

  await c.env.DB
    .prepare(
      `UPDATE character_quests
       SET current_objectives = ?, objectives_completed = ?, status = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(
      JSON.stringify(currentObjectives),
      JSON.stringify(completedObjectives),
      newStatus,
      charQuest.id
    )
    .run();

  // Check if all required objectives are complete
  const allObjectives = await c.env.DB
    .prepare(
      `SELECT id, is_optional FROM quest_objectives WHERE quest_definition_id = ?`
    )
    .bind(charQuest.quest_definition_id)
    .all<{ id: string; is_optional: number }>();

  const requiredObjectives = allObjectives.results.filter(o => o.is_optional === 0);
  const allRequiredComplete = requiredObjectives.every(o => completedObjectives.includes(o.id));

  return c.json({
    success: true,
    data: {
      objectiveId,
      previousProgress: currentObjectives[objectiveId] ?? 0,
      newProgress,
      targetQuantity: objective.target_quantity,
      justCompleted,
      rewards: justCompleted ? {
        xp: objective.completion_xp,
        credits: objective.completion_creds,
      } : null,
      questStatus: newStatus,
      canCompleteQuest: allRequiredComplete,
    },
  });
});

/**
 * POST /quests/:questId/complete
 * Complete a quest and claim rewards.
 */
questRoutes.post('/:questId/complete', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;
  const questId = c.req.param('questId');

  // Get character quest with definition
  const charQuest = await c.env.DB
    .prepare(
      `SELECT cq.*, qd.name, qd.xp_reward, qd.credit_reward, qd.item_rewards, qd.reputation_rewards
       FROM character_quests cq
       JOIN quest_definitions qd ON cq.quest_definition_id = qd.id
       WHERE cq.character_id = ? AND (cq.id = ? OR qd.code = ?)
       AND cq.status IN ('ACCEPTED', 'IN_PROGRESS')`
    )
    .bind(characterId, questId, questId)
    .first<CharacterQuest & {
      name: string;
      xp_reward: number;
      credit_reward: number;
      item_rewards: string | null;
      reputation_rewards: string | null;
    }>();

  if (!charQuest) {
    return c.json({
      success: false,
      errors: [{ code: 'QUEST_NOT_FOUND', message: 'Active quest not found' }],
    }, 404);
  }

  // Check all required objectives are complete
  const completedObjectives = charQuest.objectives_completed
    ? JSON.parse(charQuest.objectives_completed) as string[]
    : [];

  const requiredObjectives = await c.env.DB
    .prepare(
      `SELECT id, title FROM quest_objectives
       WHERE quest_definition_id = ? AND is_optional = 0`
    )
    .bind(charQuest.quest_definition_id)
    .all<{ id: string; title: string }>();

  const incompleteObjectives = requiredObjectives.results.filter(
    o => !completedObjectives.includes(o.id)
  );

  if (incompleteObjectives.length > 0) {
    return c.json({
      success: false,
      errors: [{
        code: 'OBJECTIVES_INCOMPLETE',
        message: `Incomplete objectives: ${incompleteObjectives.map(o => o.title).join(', ')}`,
      }],
    }, 400);
  }

  // Award rewards
  const rewards = {
    xp: charQuest.xp_reward,
    credits: charQuest.credit_reward,
    items: [] as Array<{ id: string; quantity: number }>,
    reputation: [] as Array<{ factionId: string; change: number }>,
  };

  // Award XP
  if (rewards.xp > 0) {
    await c.env.DB
      .prepare(`UPDATE characters SET current_xp = current_xp + ? WHERE id = ?`)
      .bind(rewards.xp, characterId)
      .run();
  }

  // Award credits
  if (rewards.credits > 0) {
    await c.env.DB
      .prepare(`UPDATE character_finances SET credits = credits + ? WHERE character_id = ?`)
      .bind(rewards.credits, characterId)
      .run();
  }

  // Award items
  if (charQuest.item_rewards) {
    const itemRewards = JSON.parse(charQuest.item_rewards) as Array<{ itemId: string; quantity: number }>;
    for (const item of itemRewards) {
      // Check if character already has this item
      const existing = await c.env.DB
        .prepare(
          `SELECT id, quantity FROM character_inventory WHERE character_id = ? AND item_id = ?`
        )
        .bind(characterId, item.itemId)
        .first<{ id: string; quantity: number }>();

      if (existing) {
        await c.env.DB
          .prepare(`UPDATE character_inventory SET quantity = quantity + ? WHERE id = ?`)
          .bind(item.quantity, existing.id)
          .run();
      } else {
        await c.env.DB
          .prepare(
            `INSERT INTO character_inventory (id, character_id, item_id, quantity, created_at)
             VALUES (?, ?, ?, ?, datetime('now'))`
          )
          .bind(nanoid(), characterId, item.itemId, item.quantity)
          .run();
      }

      rewards.items.push({ id: item.itemId, quantity: item.quantity });
    }
  }

  // Award reputation
  if (charQuest.reputation_rewards) {
    const repRewards = JSON.parse(charQuest.reputation_rewards) as Array<{ factionId: string; amount: number }>;
    for (const rep of repRewards) {
      await c.env.DB
        .prepare(
          `INSERT INTO character_faction_standing (id, character_id, faction_id, reputation)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(character_id, faction_id) DO UPDATE SET reputation = reputation + ?`
        )
        .bind(nanoid(), characterId, rep.factionId, rep.amount, rep.amount)
        .run();

      rewards.reputation.push({ factionId: rep.factionId, change: rep.amount });
    }
  }

  // Update quest status
  await c.env.DB
    .prepare(
      `UPDATE character_quests
       SET status = 'COMPLETED', completed_at = datetime('now'),
           rewards_claimed = 1, rewards_received = ?
       WHERE id = ?`
    )
    .bind(JSON.stringify(rewards), charQuest.id)
    .run();

  return c.json({
    success: true,
    data: {
      questId: charQuest.id,
      questName: charQuest.name,
      status: 'COMPLETED',
      rewards,
      message: `Quest complete: ${charQuest.name}`,
    },
  });
});

/**
 * POST /quests/:questId/abandon
 * Abandon a quest.
 */
questRoutes.post('/:questId/abandon', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;
  const questId = c.req.param('questId');

  // Get character quest
  const charQuest = await c.env.DB
    .prepare(
      `SELECT cq.*, qd.name FROM character_quests cq
       JOIN quest_definitions qd ON cq.quest_definition_id = qd.id
       WHERE cq.character_id = ? AND (cq.id = ? OR qd.code = ?)
       AND cq.status IN ('ACCEPTED', 'IN_PROGRESS')`
    )
    .bind(characterId, questId, questId)
    .first<CharacterQuest & { name: string }>();

  if (!charQuest) {
    return c.json({
      success: false,
      errors: [{ code: 'QUEST_NOT_FOUND', message: 'Active quest not found' }],
    }, 404);
  }

  // Update quest status
  await c.env.DB
    .prepare(
      `UPDATE character_quests
       SET status = 'ABANDONED', completed_at = datetime('now')
       WHERE id = ?`
    )
    .bind(charQuest.id)
    .run();

  return c.json({
    success: true,
    data: {
      questId: charQuest.id,
      questName: charQuest.name,
      status: 'ABANDONED',
      message: `Quest abandoned: ${charQuest.name}`,
    },
  });
});

// =============================================================================
// HELPER FUNCTIONS - For use by other modules
// =============================================================================

/**
 * Update quest objective progress. Called by mission actions, dialogue effects, etc.
 */
export async function updateQuestProgress(
  db: D1Database,
  characterId: string,
  objectiveType: string,
  targetId: string,
  increment: number = 1
): Promise<{ questsUpdated: string[]; objectivesCompleted: string[] }> {
  const result = {
    questsUpdated: [] as string[],
    objectivesCompleted: [] as string[],
  };

  // Find matching objectives in active quests
  const matchingObjectives = await db
    .prepare(
      `SELECT qo.*, cq.id as quest_instance_id, cq.current_objectives, cq.objectives_completed
       FROM quest_objectives qo
       JOIN character_quests cq ON qo.quest_definition_id = cq.quest_definition_id
       WHERE cq.character_id = ?
       AND cq.status IN ('ACCEPTED', 'IN_PROGRESS')
       AND qo.objective_type = ?
       AND (qo.target_item_id = ? OR qo.target_npc_id = ? OR qo.target_location_id = ?)`
    )
    .bind(characterId, objectiveType, targetId, targetId, targetId)
    .all<QuestObjective & {
      quest_instance_id: string;
      current_objectives: string | null;
      objectives_completed: string | null;
    }>();

  for (const obj of matchingObjectives.results) {
    const currentObjectives = obj.current_objectives
      ? JSON.parse(obj.current_objectives) as Record<string, number>
      : {};
    const completedObjectives = obj.objectives_completed
      ? JSON.parse(obj.objectives_completed) as string[]
      : [];

    // Skip if already completed
    if (completedObjectives.includes(obj.id)) continue;

    // Update progress
    const oldProgress = currentObjectives[obj.id] ?? 0;
    const newProgress = Math.min(oldProgress + increment, obj.target_quantity);
    currentObjectives[obj.id] = newProgress;

    // Check completion
    if (newProgress >= obj.target_quantity) {
      completedObjectives.push(obj.id);
      result.objectivesCompleted.push(obj.id);
    }

    // Save
    await db
      .prepare(
        `UPDATE character_quests
         SET current_objectives = ?, objectives_completed = ?,
             status = 'IN_PROGRESS', updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(
        JSON.stringify(currentObjectives),
        JSON.stringify(completedObjectives),
        obj.quest_instance_id
      )
      .run();

    result.questsUpdated.push(obj.quest_instance_id);
  }

  return result;
}

/**
 * Start a quest from dialogue or other triggers.
 */
export async function startQuestFromTrigger(
  db: D1Database,
  characterId: string,
  questCode: string
): Promise<{ success: boolean; questInstanceId?: string; error?: string }> {
  // Get quest definition
  const quest = await db
    .prepare(`SELECT * FROM quest_definitions WHERE code = ?`)
    .bind(questCode)
    .first<QuestDefinition>();

  if (!quest) {
    return { success: false, error: 'Quest not found' };
  }

  // Check if already have this quest
  const existing = await db
    .prepare(
      `SELECT id, status FROM character_quests
       WHERE character_id = ? AND quest_definition_id = ?`
    )
    .bind(characterId, quest.id)
    .first<{ id: string; status: string }>();

  if (existing && (existing.status === 'IN_PROGRESS' || existing.status === 'ACCEPTED')) {
    return { success: false, error: 'Quest already active' };
  }

  if (existing && existing.status === 'COMPLETED' && !quest.repeatable) {
    return { success: false, error: 'Quest already completed' };
  }

  // Create quest entry
  const instanceId = nanoid();
  await db
    .prepare(
      `INSERT INTO character_quests (
        id, character_id, quest_definition_id, accepted_at, status,
        current_stage, current_objectives, is_tracked, seed
      ) VALUES (?, ?, ?, datetime('now'), 'ACCEPTED', 0, '{}', 1, ?)`
    )
    .bind(instanceId, characterId, quest.id, Math.floor(Math.random() * 1000000))
    .run();

  return { success: true, questInstanceId: instanceId };
}
