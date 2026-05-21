/**
 * Surge Protocol - Skill Service
 *
 * Handles skill catalog, character skill state, and XP-based training.
 */

import { BaseService } from '../base/index';

// =============================================================================
// TYPES
// =============================================================================

export interface SkillDefinition {
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: string | null;
    max_level: number;
    training_available: number;
    requires_teacher: number;
    xp_cost_base: number;
    xp_cost_scaling: number;
    governing_attribute_id: string | null;
}

export interface CharacterSkillRow {
    id: string;
    code: string;
    name: string;
    category: string | null;
    max_level: number;
    current_level: number;
    xp_invested: number;
    xp_to_next_level: number | null;
}

export interface EnhancedCharacterSkill extends CharacterSkillRow {
    xpToNextLevel: number;
    canTrain: boolean;
    isMaxLevel: boolean;
}

export interface TrainResult {
    skillId: string;
    skillName: string;
    previousLevel: number;
    newLevel: number;
    xpSpent: number;
    remainingXP: number;
    nextLevelCost: number | null;
    message: string;
}

// =============================================================================
// HELPER
// =============================================================================

/**
 * Calculate XP cost for reaching a specific level.
 * Uses exponential scaling: level * 100 XP base.
 */
export function calculateXPForLevel(level: number): number {
    if (level <= 0) return 0;
    // Each level costs level * 100 XP
    // Level 1 = 100, Level 2 = 200, Level 3 = 300, etc.
    return level * 100;
}

// =============================================================================
// SKILL SERVICE
// =============================================================================

export class SkillService extends BaseService {

    /**
     * List all skill definitions (catalog) with optional category grouping.
     */
    async listSkills(): Promise<{
        skills: Record<string, unknown>[];
        byCategory: Record<string, Record<string, unknown>[]>;
        count: number;
    }> {
        const result = await this.db
            .prepare(
                `SELECT sd.id, sd.code, sd.name, sd.description, sd.category,
                sd.max_level, sd.training_available, sd.requires_teacher,
                sd.xp_cost_base, sd.xp_cost_scaling, sd.governing_attribute_id,
                ad.code as attribute_code, ad.name as attribute_name
         FROM skill_definitions sd
         LEFT JOIN attribute_definitions ad ON sd.governing_attribute_id = ad.id
         ORDER BY sd.category, sd.name`
            )
            .all();

        const byCategory: Record<string, Record<string, unknown>[]> = {};
        for (const skill of result.results) {
            const cat = (skill.category as string) || 'Other';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(skill);
        }

        return { skills: result.results, byCategory, count: result.results.length };
    }

    /**
     * Get detailed skill information including prerequisites and XP table.
     */
    async getSkillDetails(skillId: string): Promise<Record<string, unknown> | null> {
        const skill = await this.db
            .prepare(
                `SELECT sd.*, ad.code as attribute_code, ad.name as attribute_name
         FROM skill_definitions sd
         LEFT JOIN attribute_definitions ad ON sd.governing_attribute_id = ad.id
         WHERE sd.id = ? OR sd.code = ?`
            )
            .bind(skillId, skillId)
            .first();

        if (!skill) return null;

        // Get XP costs per level
        const xpPerLevel: Record<number, number> = {};
        for (let i = 1; i <= (skill.max_level as number); i++) {
            xpPerLevel[i] = calculateXPForLevel(i);
        }

        // Get prerequisites
        const prereqResult = await this.db
            .prepare(
                `SELECT sp.required_skill_id, sp.required_level, sd.code, sd.name
         FROM skill_prerequisites sp
         JOIN skill_definitions sd ON sp.required_skill_id = sd.id
         WHERE sp.skill_id = ?`
            )
            .bind(skill.id)
            .all();

        const prerequisites = prereqResult.results.map((p) => ({
            skillId: p.required_skill_id,
            skillCode: p.code,
            skillName: p.name,
            requiredLevel: p.required_level,
        }));

        return {
            ...skill,
            xpPerLevel,
            prerequisites,
            governingAttribute: skill.attribute_code
                ? { code: skill.attribute_code, name: skill.attribute_name }
                : null,
        };
    }

    /**
     * Get character's skills with levels and training availability.
     */
    async getCharacterSkills(characterId: string): Promise<{
        skills: EnhancedCharacterSkill[];
        byCategory: Record<string, EnhancedCharacterSkill[]>;
        availableXP: number;
        totalSkills: number;
        learnedSkills: number;
    }> {
        const skills = await this.db
            .prepare(
                `SELECT sd.id, sd.code, sd.name, sd.category, sd.max_level,
                COALESCE(cs.current_level, 0) as current_level,
                COALESCE(cs.xp_invested, 0) as xp_invested,
                cs.xp_to_next_level
         FROM skill_definitions sd
         LEFT JOIN character_skills cs ON sd.id = cs.skill_id AND cs.character_id = ?
         ORDER BY sd.category, sd.name`
            )
            .bind(characterId)
            .all<CharacterSkillRow>();

        const character = await this.db
            .prepare('SELECT current_xp FROM characters WHERE id = ?')
            .bind(characterId)
            .first<{ current_xp: number }>();

        const enhancedSkills: EnhancedCharacterSkill[] = skills.results.map(skill => {
            const xpNeeded = calculateXPForLevel(skill.current_level + 1);
            return {
                ...skill,
                xpToNextLevel: skill.xp_to_next_level ?? xpNeeded,
                canTrain: skill.current_level < skill.max_level && (character?.current_xp ?? 0) >= xpNeeded,
                isMaxLevel: skill.current_level >= skill.max_level,
            };
        });

        const byCategory: Record<string, EnhancedCharacterSkill[]> = {};
        for (const skill of enhancedSkills) {
            const cat = skill.category || 'Other';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(skill);
        }

        return {
            skills: enhancedSkills,
            byCategory,
            availableXP: character?.current_xp ?? 0,
            totalSkills: enhancedSkills.length,
            learnedSkills: enhancedSkills.filter(s => s.current_level > 0).length,
        };
    }

    /**
     * Train a skill by spending XP. Validates prerequisites, max level, and XP cost.
     */
    async trainSkill(characterId: string, skillId: string, levels: number = 1): Promise<TrainResult> {
        // Get skill definition
        const skill = await this.db
            .prepare(
                `SELECT sd.*, ad.code as attribute_code
         FROM skill_definitions sd
         LEFT JOIN attribute_definitions ad ON sd.governing_attribute_id = ad.id
         WHERE sd.id = ? OR sd.code = ?`
            )
            .bind(skillId, skillId)
            .first<SkillDefinition & { attribute_code: string | null }>();

        if (!skill) throw new Error('Skill not found');
        if (!skill.training_available) throw new Error(`${skill.name} is not available for training`);

        // Check prerequisites
        const prereqs = await this.db
            .prepare(
                `SELECT sp.required_level, sd.name, cs.current_level
         FROM skill_prerequisites sp
         JOIN skill_definitions sd ON sp.required_skill_id = sd.id
         LEFT JOIN character_skills cs ON sp.required_skill_id = cs.skill_id AND cs.character_id = ?
         WHERE sp.skill_id = ?`
            )
            .bind(characterId, skill.id)
            .all<{ required_level: number; name: string; current_level: number | null }>();

        for (const prereq of prereqs.results) {
            if ((prereq.current_level ?? 0) < prereq.required_level) {
                throw new Error(`Requires ${prereq.name} level ${prereq.required_level}`);
            }
        }

        // Get current character skill state
        const charSkill = await this.db
            .prepare(
                `SELECT id, current_level, current_xp FROM character_skills
         WHERE character_id = ? AND skill_id = ?`
            )
            .bind(characterId, skill.id)
            .first<{ id: string; current_level: number; current_xp: number }>();

        const currentLevel = charSkill?.current_level ?? 0;
        const targetLevel = currentLevel + levels;

        if (targetLevel > skill.max_level) {
            throw new Error(`Max level is ${skill.max_level}, targeting ${targetLevel}`);
        }

        // Calculate total XP cost
        let totalXPCost = 0;
        for (let lvl = currentLevel + 1; lvl <= targetLevel; lvl++) {
            totalXPCost += calculateXPForLevel(lvl);
        }

        // Check character has enough XP
        const character = await this.db
            .prepare('SELECT current_xp FROM characters WHERE id = ?')
            .bind(characterId)
            .first<{ current_xp: number }>();

        const availableXP = character?.current_xp ?? 0;
        if (availableXP < totalXPCost) {
            throw new Error(`Need ${totalXPCost} XP, have ${availableXP}`);
        }

        // Deduct XP
        await this.db
            .prepare('UPDATE characters SET current_xp = current_xp - ?, updated_at = datetime(\'now\') WHERE id = ?')
            .bind(totalXPCost, characterId)
            .run();

        // Update or create skill record
        const xpToNextLevel = targetLevel < skill.max_level ? calculateXPForLevel(targetLevel + 1) : 0;

        if (charSkill) {
            await this.db
                .prepare(
                    `UPDATE character_skills
           SET current_level = ?, xp_invested = xp_invested + ?, xp_to_next_level = ?,
               updated_at = datetime('now')
           WHERE id = ?`
                )
                .bind(targetLevel, totalXPCost, xpToNextLevel, charSkill.id)
                .run();
        } else {
            await this.db
                .prepare(
                    `INSERT INTO character_skills (id, character_id, skill_id, current_level, xp_invested, xp_to_next_level, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
                )
                .bind(crypto.randomUUID(), characterId, skill.id, targetLevel, totalXPCost, xpToNextLevel)
                .run();
        }

        // Return updated XP
        const updatedCharacter = await this.db
            .prepare('SELECT current_xp FROM characters WHERE id = ?')
            .bind(characterId)
            .first<{ current_xp: number }>();

        return {
            skillId: skill.id,
            skillName: skill.name,
            previousLevel: currentLevel,
            newLevel: targetLevel,
            xpSpent: totalXPCost,
            remainingXP: updatedCharacter?.current_xp ?? 0,
            nextLevelCost: targetLevel < skill.max_level ? calculateXPForLevel(targetLevel + 1) : null,
            message: `${skill.name} increased to level ${targetLevel}!`,
        };
    }
}
