/**
 * Surge Protocol - Skills Routes
 *
 * Endpoints:
 * - GET /skills - List all skill definitions
 * - GET /skills/:id - Get skill details
 * - GET /skills/character - Get current character's skills
 * - POST /skills/:skillId/train - Train a skill (spend XP to level up)
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
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

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const trainSkillSchema = z.object({
  levels: z.number().int().min(1).max(5).default(1),
});

// =============================================================================
// ROUTES
// =============================================================================

export const skillRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// Apply auth middleware to all routes
skillRoutes.use('*', authMiddleware());

/**
 * GET /skills
 * List all skill definitions (catalog).
 */
skillRoutes.get('/', async (c) => {
  const result = await c.env.DB
    .prepare(
      `SELECT sd.id, sd.code, sd.name, sd.description, sd.category,
              sd.max_level, sd.training_available, sd.requires_teacher,
              sd.governing_attribute_id,
              ad.code as attribute_code, ad.name as attribute_name
       FROM skill_definitions sd
       LEFT JOIN attribute_definitions ad ON sd.governing_attribute_id = ad.id
       ORDER BY sd.category, sd.name`
    )
    .all<{
      id: string;
      code: string;
      name: string;
      description: string | null;
      category: string | null;
      max_level: number;
      training_available: number;
      requires_teacher: number;
      governing_attribute_id: string | null;
      attribute_code: string | null;
      attribute_name: string | null;
    }>();

  // Group by category
  const byCategory: Record<string, typeof result.results> = {};
  for (const skill of result.results) {
    const cat = skill.category || 'General';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(skill);
  }

  return c.json({
    success: true,
    data: {
      skills: result.results,
      byCategory,
      count: result.results.length,
    },
  });
});

/**
 * GET /skills/:id
 * Get detailed skill information.
 */
skillRoutes.get('/:id', async (c) => {
  const skillId = c.req.param('id');

  const skill = await c.env.DB
    .prepare(
      `SELECT sd.*, ad.code as attribute_code, ad.name as attribute_name
       FROM skill_definitions sd
       LEFT JOIN attribute_definitions ad ON sd.governing_attribute_id = ad.id
       WHERE sd.id = ? OR sd.code = ?`
    )
    .bind(skillId, skillId)
    .first<{
      id: string;
      code: string;
      name: string;
      description: string | null;
      category: string | null;
      max_level: number;
      training_available: number;
      requires_teacher: number;
      xp_per_level: string | null;
      prerequisite_skills: string | null;
      governing_attribute_id: string | null;
      attribute_code: string | null;
      attribute_name: string | null;
    }>();

  if (!skill) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Skill not found' }],
    }, 404);
  }

  // Parse JSON fields
  const xpPerLevel = skill.xp_per_level ? JSON.parse(skill.xp_per_level) : null;
  const prerequisites = skill.prerequisite_skills ? JSON.parse(skill.prerequisite_skills) : [];

  return c.json({
    success: true,
    data: {
      skill: {
        ...skill,
        xpPerLevel,
        prerequisites,
        governingAttribute: skill.attribute_code
          ? { code: skill.attribute_code, name: skill.attribute_name }
          : null,
      },
    },
  });
});

/**
 * GET /skills/character
 * Get current character's skills with levels.
 * Requires character to be selected.
 */
skillRoutes.get('/character', requireCharacterMiddleware(), async (c) => {
  const characterId = c.get('characterId')!;

  // Get all skills with character's current levels
  const skills = await c.env.DB
    .prepare(
      `SELECT sd.id, sd.code, sd.name, sd.description, sd.category,
              sd.max_level, sd.training_available,
              ad.code as attribute_code, ad.name as attribute_name,
              COALESCE(cs.current_level, 0) as current_level,
              COALESCE(cs.current_xp, 0) as current_xp,
              cs.xp_to_next_level
       FROM skill_definitions sd
       LEFT JOIN attribute_definitions ad ON sd.governing_attribute_id = ad.id
       LEFT JOIN character_skills cs ON cs.skill_id = sd.id AND cs.character_id = ?
       ORDER BY sd.category, sd.name`
    )
    .bind(characterId)
    .all<{
      id: string;
      code: string;
      name: string;
      description: string | null;
      category: string | null;
      max_level: number;
      training_available: number;
      attribute_code: string | null;
      attribute_name: string | null;
      current_level: number;
      current_xp: number;
      xp_to_next_level: number | null;
    }>();

  // Get character's available XP
  const character = await c.env.DB
    .prepare('SELECT current_xp FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_xp: number }>();

  // Calculate XP needed for each skill's next level
  const enhancedSkills = skills.results.map(skill => {
    const xpNeeded = calculateXPForLevel(skill.current_level + 1);
    return {
      ...skill,
      xpToNextLevel: skill.xp_to_next_level ?? xpNeeded,
      canTrain: skill.training_available === 1 &&
                skill.current_level < skill.max_level &&
                (character?.current_xp ?? 0) >= xpNeeded,
      governingAttribute: skill.attribute_code
        ? { code: skill.attribute_code, name: skill.attribute_name }
        : null,
    };
  });

  // Group by category
  const byCategory: Record<string, typeof enhancedSkills> = {};
  for (const skill of enhancedSkills) {
    const cat = skill.category || 'General';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(skill);
  }

  return c.json({
    success: true,
    data: {
      skills: enhancedSkills,
      byCategory,
      availableXP: character?.current_xp ?? 0,
      totalSkills: enhancedSkills.length,
      learnedSkills: enhancedSkills.filter(s => s.current_level > 0).length,
    },
  });
});

/**
 * POST /skills/:skillId/train
 * Train a skill by spending XP.
 * Requires character to be selected.
 */
skillRoutes.post('/:skillId/train', requireCharacterMiddleware(), zValidator('json', trainSkillSchema), async (c) => {
  const skillId = c.req.param('skillId');
  const characterId = c.get('characterId')!;
  const { levels } = c.req.valid('json');

  // Get skill definition
  const skill = await c.env.DB
    .prepare(
      `SELECT id, code, name, max_level, training_available, requires_teacher, prerequisite_skills
       FROM skill_definitions
       WHERE id = ? OR code = ?`
    )
    .bind(skillId, skillId)
    .first<{
      id: string;
      code: string;
      name: string;
      max_level: number;
      training_available: number;
      requires_teacher: number;
      prerequisite_skills: string | null;
    }>();

  if (!skill) {
    return c.json({
      success: false,
      errors: [{ code: 'SKILL_NOT_FOUND', message: 'Skill not found' }],
    }, 404);
  }

  // Check if skill can be trained
  if (!skill.training_available) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_TRAINABLE', message: 'This skill cannot be trained' }],
    }, 400);
  }

  // Check if teacher is required (would need to be at specific location/NPC)
  // For now, we'll skip this check - can be added later
  // if (skill.requires_teacher) { ... }

  // Get character's current skill level and XP
  let charSkill = await c.env.DB
    .prepare(
      `SELECT id, current_level, current_xp FROM character_skills
       WHERE character_id = ? AND skill_id = ?`
    )
    .bind(characterId, skill.id)
    .first<{ id: string; current_level: number; current_xp: number }>();

  const currentLevel = charSkill?.current_level ?? 0;
  const targetLevel = currentLevel + levels;

  // Check max level
  if (targetLevel > skill.max_level) {
    return c.json({
      success: false,
      errors: [{
        code: 'MAX_LEVEL',
        message: `Cannot exceed max level ${skill.max_level}. Current: ${currentLevel}`,
      }],
    }, 400);
  }

  // Check prerequisites
  if (skill.prerequisite_skills) {
    const prereqs = JSON.parse(skill.prerequisite_skills) as Array<{ skillCode: string; level: number }>;

    for (const prereq of prereqs) {
      const prereqLevel = await c.env.DB
        .prepare(
          `SELECT cs.current_level FROM character_skills cs
           JOIN skill_definitions sd ON cs.skill_id = sd.id
           WHERE cs.character_id = ? AND sd.code = ?`
        )
        .bind(characterId, prereq.skillCode)
        .first<{ current_level: number }>();

      if (!prereqLevel || prereqLevel.current_level < prereq.level) {
        return c.json({
          success: false,
          errors: [{
            code: 'PREREQUISITE_NOT_MET',
            message: `Requires ${prereq.skillCode} at level ${prereq.level}`,
          }],
        }, 400);
      }
    }
  }

  // Calculate total XP cost for leveling
  let totalXPCost = 0;
  for (let lvl = currentLevel + 1; lvl <= targetLevel; lvl++) {
    totalXPCost += calculateXPForLevel(lvl);
  }

  // Check character has enough XP
  const character = await c.env.DB
    .prepare('SELECT current_xp FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_xp: number }>();

  const availableXP = character?.current_xp ?? 0;

  if (availableXP < totalXPCost) {
    return c.json({
      success: false,
      errors: [{
        code: 'INSUFFICIENT_XP',
        message: `Requires ${totalXPCost} XP, you have ${availableXP}`,
      }],
    }, 400);
  }

  // Deduct XP from character
  await c.env.DB
    .prepare(
      `UPDATE characters SET current_xp = current_xp - ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(totalXPCost, characterId)
    .run();

  // Update or create skill record
  const xpToNextLevel = calculateXPForLevel(targetLevel + 1);

  if (charSkill) {
    await c.env.DB
      .prepare(
        `UPDATE character_skills
         SET current_level = ?, xp_invested = xp_invested + ?, xp_to_next_level = ?,
             updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(targetLevel, totalXPCost, xpToNextLevel, charSkill.id)
      .run();
  } else {
    // Create new skill record
    const { nanoid } = await import('nanoid');
    await c.env.DB
      .prepare(
        `INSERT INTO character_skills (id, character_id, skill_id, current_level, current_xp, xp_invested, xp_to_next_level, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, ?, datetime('now'), datetime('now'))`
      )
      .bind(nanoid(), characterId, skill.id, targetLevel, totalXPCost, xpToNextLevel)
      .run();
  }

  // Get updated XP
  const updatedCharacter = await c.env.DB
    .prepare('SELECT current_xp FROM characters WHERE id = ?')
    .bind(characterId)
    .first<{ current_xp: number }>();

  return c.json({
    success: true,
    data: {
      skill: {
        code: skill.code,
        name: skill.name,
        previousLevel: currentLevel,
        newLevel: targetLevel,
        levelsGained: levels,
      },
      xpSpent: totalXPCost,
      remainingXP: updatedCharacter?.current_xp ?? 0,
      nextLevelCost: targetLevel < skill.max_level ? calculateXPForLevel(targetLevel + 1) : null,
      message: `${skill.name} increased to level ${targetLevel}!`,
    },
  });
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate XP cost for reaching a specific level.
 * Uses exponential scaling: level * 100 XP base.
 */
function calculateXPForLevel(level: number): number {
  if (level <= 0) return 0;
  // Level 1: 100, Level 2: 200, Level 3: 300, etc.
  // Total to reach level 3: 100 + 200 + 300 = 600
  return level * 100;
}
