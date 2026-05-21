import { BaseService, type ServiceContext, ErrorCodes } from '../base';
import type {
    AbilityDefinition, CharacterAbility,
    PassiveDefinition, SkillDefinition, CharacterSkill,
    AbilityFilters, SkillFilters, PassiveFilters
} from './types';

export class AbilityService extends BaseService {
    constructor(context: ServiceContext) {
        super(context);
    }

    // =============================================================================
    // HELPERS
    // =============================================================================

    private parseJsonField<T>(value: string | null, defaultValue: T): T {
        if (!value) return defaultValue;
        try {
            return JSON.parse(value) as T;
        } catch {
            return defaultValue;
        }
    }

    private formatAbilityDefinition(row: AbilityDefinition) {
        return {
            id: row.id,
            code: row.code,
            name: row.name,
            description: row.description,
            detailed_description: row.detailed_description,
            flavor_text: row.flavor_text,
            ability_type: row.ability_type,
            category: row.category,
            is_signature: Boolean(row.is_signature),
            is_ultimate: Boolean(row.is_ultimate),
            source: {
                type: row.source_type,
                track_id: row.source_track_id,
                specialization_id: row.source_specialization_id,
                augment_id: row.source_augment_id,
                item_id: row.source_item_id,
            },
            requirements: {
                tier: row.required_tier,
                level: row.required_level,
                prerequisite_abilities: this.parseJsonField<string[]>(row.prerequisite_abilities, []),
                attributes: this.parseJsonField<Record<string, number>>(row.required_attributes, {}),
                skills: this.parseJsonField<Record<string, number>>(row.required_skills, {}),
            },
            costs: {
                resources: this.parseJsonField<Record<string, number>>(row.resource_cost, {}),
                cooldown_seconds: row.cooldown_seconds,
                charges: row.charges,
                charge_recovery: row.charge_recovery,
                humanity_cost: row.humanity_cost,
            },
            activation: {
                type: row.activation_type,
                time: row.activation_time,
                range: row.range,
                area_of_effect: this.parseJsonField(row.area_of_effect, null),
                duration: row.duration,
                concentration_required: Boolean(row.concentration_required),
            },
            effects: {
                primary: this.parseJsonField(row.primary_effect, null),
                secondary: this.parseJsonField<object[]>(row.secondary_effects, []),
                scaling: this.parseJsonField(row.scaling, null),
                synergies: this.parseJsonField<string[]>(row.synergies, []),
            },
            upgrades: {
                has_ranks: Boolean(row.has_ranks),
                max_rank: row.max_rank,
                rank_effects: this.parseJsonField(row.rank_effects, null),
                upgrade_cost: this.parseJsonField(row.upgrade_cost, null),
            },
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }

    private formatCharacterAbility(row: CharacterAbility, definition?: AbilityDefinition) {
        const base = {
            id: row.id,
            character_id: row.character_id,
            ability_id: row.ability_id,
            acquired_at: row.acquired_at,
            is_unlocked: Boolean(row.is_unlocked),
            is_equipped: Boolean(row.is_equipped),
            current_rank: row.current_rank,
            current_charges: row.current_charges,
            cooldown: {
                remaining: row.cooldown_remaining,
                is_on_cooldown: Boolean(row.is_on_cooldown),
            },
            customization: {
                custom_name: row.custom_name,
                modifier_augments: this.parseJsonField<string[]>(row.modifier_augments, []),
                modifier_items: this.parseJsonField<string[]>(row.modifier_items, []),
                effectiveness_multiplier: row.effectiveness_multiplier,
            },
            stats: {
                times_used: row.times_used,
                successful_uses: row.successful_uses,
                damage_dealt_total: row.damage_dealt_total,
                targets_affected_total: row.targets_affected_total,
                last_used: row.last_used,
            },
            progression: {
                xp_invested: row.xp_invested,
                xp_to_next_rank: row.xp_to_next_rank,
            },
        };

        if (definition) {
            return {
                ...base,
                definition: this.formatAbilityDefinition(definition),
            };
        }

        return base;
    }

    private formatPassiveDefinition(row: PassiveDefinition) {
        return {
            id: row.id,
            code: row.code,
            name: row.name,
            description: row.description,
            source: {
                type: row.source_type,
                id: row.source_id,
            },
            requirements: {
                tier: row.required_tier,
                prerequisite_passives: this.parseJsonField<string[]>(row.prerequisite_passives, []),
                condition: row.required_condition,
            },
            effect: {
                type: row.effect_type,
                target: row.effect_target,
                value: row.effect_value,
                is_percentage: Boolean(row.effect_is_percentage),
                stacks: Boolean(row.stacks),
                max_stacks: row.max_stacks,
            },
            trigger: {
                condition: row.trigger_condition,
                chance: row.trigger_chance,
                internal_cooldown: row.internal_cooldown,
            },
            meta: {
                is_hidden: Boolean(row.is_hidden),
                conflicts_with: this.parseJsonField<string[]>(row.conflicts_with, []),
                synergizes_with: this.parseJsonField<string[]>(row.synergizes_with, []),
            },
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }

    private formatSkillDefinition(row: SkillDefinition) {
        return {
            id: row.id,
            code: row.code,
            name: row.name,
            description: row.description,
            governing_attribute_id: row.governing_attribute_id,
            category: row.category,
            progression: {
                max_level: row.max_level,
                xp_per_level: this.parseJsonField<number[]>(row.xp_per_level, []),
                training_available: Boolean(row.training_available),
                requires_teacher: Boolean(row.requires_teacher),
            },
            requirements: {
                prerequisite_skills: this.parseJsonField<string[]>(row.prerequisite_skills, []),
                tier: row.required_tier,
                track: row.required_track,
            },
            mechanics: {
                check_difficulty_base: row.check_difficulty_base,
                critical_success_threshold: row.critical_success_threshold,
                critical_failure_threshold: row.critical_failure_threshold,
                can_assist: Boolean(row.can_assist),
                can_retry: Boolean(row.can_retry),
                retry_penalty: row.retry_penalty,
            },
            specializations: {
                has_specializations: Boolean(row.has_specializations),
                definitions: this.parseJsonField(row.specialization_definitions, null),
            },
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }

    private formatCharacterSkill(row: CharacterSkill, definition?: SkillDefinition) {
        const base = {
            id: row.id,
            character_id: row.character_id,
            skill_id: row.skill_id,
            level: {
                current: row.current_level,
                xp: row.current_xp,
                xp_to_next: row.xp_to_next_level,
            },
            bonuses: {
                from_augments: row.bonus_from_augments,
                from_items: row.bonus_from_items,
                temporary: row.temporary_bonus,
                temporary_penalty: row.temporary_penalty,
                effective_level: row.current_level + row.bonus_from_augments + row.bonus_from_items + row.temporary_bonus - row.temporary_penalty,
            },
            stats: {
                times_used: row.times_used,
                successes: row.successes,
                failures: row.failures,
                critical_successes: row.critical_successes,
                critical_failures: row.critical_failures,
                last_used: row.last_used,
                success_rate: row.times_used > 0 ? (row.successes / row.times_used) : 0,
            },
            specializations: {
                unlocked: this.parseJsonField<string[]>(row.specializations_unlocked, []),
                levels: this.parseJsonField<Record<string, number>>(row.specialization_levels, {}),
            },
        };

        if (definition) {
            return {
                ...base,
                definition: this.formatSkillDefinition(definition),
            };
        }

        return base;
    }

    // =============================================================================
    // DEFINITIONS (CATALOGS)
    // =============================================================================

    async getAbilityDefinitions(filters: AbilityFilters = {}) {
        let query = 'SELECT * FROM ability_definitions WHERE 1=1';
        const params: (string | number)[] = [];

        if (filters.category) {
            query += ' AND category = ?';
            params.push(filters.category);
        }
        if (filters.type) {
            query += ' AND ability_type = ?';
            params.push(filters.type);
        }
        if (filters.sourceType) {
            query += ' AND source_type = ?';
            params.push(filters.sourceType);
        }
        if (filters.tier) {
            query += ' AND required_tier <= ?';
            params.push(filters.tier);
        }
        if (filters.isSignature) query += ' AND is_signature = 1';
        if (filters.isUltimate) query += ' AND is_ultimate = 1';

        query += ' ORDER BY category, required_tier, name';

        const result = await this.queryAll<AbilityDefinition>(query, ...params);
        return result.map(row => this.formatAbilityDefinition(row));
    }

    async getAbilityCategories() {
        const result = await this.queryAll<any>(`
      SELECT category, ability_type, COUNT(*) as count
      FROM ability_definitions
      GROUP BY category, ability_type
      ORDER BY category, ability_type
    `);

        const categories: Record<string, { types: Record<string, number>; total: number }> = {};
        for (const row of result) {
            if (!categories[row.category]) {
                categories[row.category] = { types: {}, total: 0 };
            }
            const cat = categories[row.category]!;
            cat.types[row.ability_type] = row.count;
            cat.total += row.count;
        }
        return categories;
    }

    async getAbilityDefinition(idOrCode: string) {
        const result = await this.query<AbilityDefinition>(
            'SELECT * FROM ability_definitions WHERE id = ? OR code = ?',
            idOrCode, idOrCode
        );
        return result ? this.formatAbilityDefinition(result) : null;
    }

    async getPassiveDefinitions(filters: PassiveFilters = {}) {
        let query = 'SELECT * FROM passive_definitions WHERE 1=1';
        const params: (string | number)[] = [];

        if (!filters.includeHidden) query += ' AND is_hidden = 0';
        if (filters.sourceType) {
            query += ' AND source_type = ?';
            params.push(filters.sourceType);
        }
        if (filters.effectType) {
            query += ' AND effect_type = ?';
            params.push(filters.effectType);
        }

        query += ' ORDER BY required_tier, name';

        const result = await this.queryAll<PassiveDefinition>(query, ...params);
        return result.map(row => this.formatPassiveDefinition(row));
    }

    async getPassiveDefinition(idOrCode: string) {
        const result = await this.query<PassiveDefinition>(
            'SELECT * FROM passive_definitions WHERE id = ? OR code = ?',
            idOrCode, idOrCode
        );
        return result ? this.formatPassiveDefinition(result) : null;
    }

    async getSkillDefinitions(filters: SkillFilters = {}) {
        let query = 'SELECT * FROM skill_definitions WHERE 1=1';
        const params: (string | number)[] = [];

        if (filters.category) {
            query += ' AND category = ?';
            params.push(filters.category);
        }
        if (filters.attributeId) {
            query += ' AND governing_attribute_id = ?';
            params.push(filters.attributeId);
        }

        query += ' ORDER BY category, name';

        const result = await this.queryAll<SkillDefinition>(query, ...params);
        return result.map(row => this.formatSkillDefinition(row));
    }

    async getSkillDefinition(idOrCode: string) {
        const result = await this.query<SkillDefinition>(
            'SELECT * FROM skill_definitions WHERE id = ? OR code = ?',
            idOrCode, idOrCode
        );
        return result ? this.formatSkillDefinition(result) : null;
    }

    // =============================================================================
    // CHARACTER DATA
    // =============================================================================

    async getCharacterAbilities(characterId: string, filters: { status?: 'unlocked' | 'equipped' | 'all'; category?: string } = {}) {
        let query = `
      SELECT ca.*, ad.*,
             ca.id as ca_id, ad.id as ad_id
      FROM character_abilities ca
      JOIN ability_definitions ad ON ca.ability_id = ad.id
      WHERE ca.character_id = ?
    `;
        const params: any[] = [characterId];

        if (filters.status === 'unlocked') {
            query += ' AND ca.is_unlocked = 1';
        } else if (filters.status === 'equipped') {
            query += ' AND ca.is_equipped = 1';
        }

        if (filters.category) {
            query += ' AND ad.category = ?';
            params.push(filters.category);
        }

        query += ' ORDER BY ca.is_equipped DESC, ad.category, ad.name';

        const rows = await this.queryAll<any>(query, ...params);
        return rows.map(row => {
            // Inline reconstruction to avoid duplication and handle SQL naming overlaps
            const charAbility: CharacterAbility = {
                id: row.ca_id,
                character_id: row.character_id,
                ability_id: row.ability_id,
                acquired_at: row.acquired_at,
                is_unlocked: row.is_unlocked,
                is_equipped: row.is_equipped,
                current_rank: row.current_rank,
                current_charges: row.current_charges,
                cooldown_remaining: row.cooldown_remaining,
                is_on_cooldown: row.is_on_cooldown,
                custom_name: row.custom_name,
                modifier_augments: row.modifier_augments,
                modifier_items: row.modifier_items,
                effectiveness_multiplier: row.effectiveness_multiplier,
                times_used: row.times_used,
                successful_uses: row.successful_uses,
                damage_dealt_total: row.damage_dealt_total,
                targets_affected_total: row.targets_affected_total,
                last_used: row.last_used,
                xp_invested: row.xp_invested,
                xp_to_next_rank: row.xp_to_next_rank,
                created_at: row.created_at,
                updated_at: row.updated_at,
            };

            const definition: AbilityDefinition = {
                id: row.ad_id,
                code: row.code,
                name: row.name,
                description: row.description,
                detailed_description: row.detailed_description,
                flavor_text: row.flavor_text,
                ability_type: row.ability_type,
                category: row.category,
                is_signature: row.is_signature,
                is_ultimate: row.is_ultimate,
                source_type: row.source_type,
                source_track_id: row.source_track_id,
                source_specialization_id: row.source_specialization_id,
                source_augment_id: row.source_augment_id,
                source_item_id: row.source_item_id,
                required_tier: row.required_tier,
                required_level: row.required_level,
                prerequisite_abilities: row.prerequisite_abilities,
                required_attributes: row.required_attributes,
                required_skills: row.required_skills,
                resource_cost: row.resource_cost,
                cooldown_seconds: row.cooldown_seconds,
                charges: row.charges,
                charge_recovery: row.charge_recovery,
                humanity_cost: row.humanity_cost,
                activation_type: row.activation_type,
                activation_time: row.activation_time,
                range: row.range,
                area_of_effect: row.area_of_effect,
                duration: row.duration,
                concentration_required: row.concentration_required,
                primary_effect: row.primary_effect,
                secondary_effects: row.secondary_effects,
                scaling: row.scaling,
                synergies: row.synergies,
                has_ranks: row.has_ranks,
                max_rank: row.max_rank,
                rank_effects: row.rank_effects,
                upgrade_cost: row.upgrade_cost,
                created_at: row.created_at,
                updated_at: row.updated_at,
            };

            return this.formatCharacterAbility(charAbility, definition);
        });
    }

    async getCharacterSkills(characterId: string, category?: string) {
        let query = `
      SELECT cs.*, sd.*,
             cs.id as cs_id, sd.id as sd_id
      FROM character_skills cs
      JOIN skill_definitions sd ON cs.skill_id = sd.id
      WHERE cs.character_id = ?
    `;
        const params: any[] = [characterId];

        if (category) {
            query += ' AND sd.category = ?';
            params.push(category);
        }

        query += ' ORDER BY sd.category, sd.name';

        const rows = await this.queryAll<any>(query, ...params);
        return rows.map(row => {
            const charSkill: CharacterSkill = {
                id: row.cs_id,
                character_id: row.character_id,
                skill_id: row.skill_id,
                current_level: row.current_level,
                current_xp: row.current_xp,
                xp_to_next_level: row.xp_to_next_level,
                bonus_from_augments: row.bonus_from_augments,
                bonus_from_items: row.bonus_from_items,
                temporary_bonus: row.temporary_bonus,
                temporary_penalty: row.temporary_penalty,
                times_used: row.times_used,
                successes: row.successes,
                failures: row.failures,
                critical_successes: row.critical_successes,
                critical_failures: row.critical_failures,
                last_used: row.last_used,
                specializations_unlocked: row.specializations_unlocked,
                specialization_levels: row.specialization_levels,
                created_at: row.created_at,
                updated_at: row.updated_at,
            };

            const definition: SkillDefinition = {
                id: row.sd_id,
                code: row.code,
                name: row.name,
                description: row.description,
                governing_attribute_id: row.governing_attribute_id,
                category: row.category,
                max_level: row.max_level,
                xp_per_level: row.xp_per_level,
                training_available: row.training_available,
                requires_teacher: row.requires_teacher,
                prerequisite_skills: row.prerequisite_skills,
                required_tier: row.required_tier,
                required_track: row.required_track,
                check_difficulty_base: row.check_difficulty_base,
                critical_success_threshold: row.critical_success_threshold,
                critical_failure_threshold: row.critical_failure_threshold,
                can_assist: row.can_assist,
                can_retry: row.can_retry,
                retry_penalty: row.retry_penalty,
                has_specializations: row.has_specializations,
                specialization_definitions: row.specialization_definitions,
                created_at: row.created_at,
                updated_at: row.updated_at,
            };

            return this.formatCharacterSkill(charSkill, definition);
        });
    }

    async getCharacterPassives(characterId: string) {
        const result = await this.queryAll<PassiveDefinition>(`
      SELECT pd.* FROM passive_definitions pd
      WHERE pd.id IN (
        -- Passives from equipped abilities
        SELECT pd2.id FROM passive_definitions pd2
        JOIN character_abilities ca ON pd2.source_id = ca.ability_id
        WHERE ca.character_id = ? AND ca.is_equipped = 1 AND pd2.source_type = 'ABILITY'
      )
      ORDER BY pd.name
    `, characterId);
        return result.map(row => this.formatPassiveDefinition(row));
    }

    // =============================================================================
    // ACTIONS
    // =============================================================================

    async unlockAbility(characterId: string, abilityId: string) {
        const ability = await this.query<AbilityDefinition>(
            'SELECT * FROM ability_definitions WHERE id = ? OR code = ?',
            abilityId, abilityId
        );
        this.assertExists(ability, ErrorCodes.INTERNAL_ERROR, 'Ability not found');

        const existing = await this.query(
            'SELECT id FROM character_abilities WHERE character_id = ? AND ability_id = ?',
            characterId, ability.id
        );
        if (existing) {
            return { success: false, error: 'Ability already unlocked', code: 'ALREADY_UNLOCKED' };
        }

        const newId = crypto.randomUUID();
        const now = new Date().toISOString();

        await this.execute(`
      INSERT INTO character_abilities (
        id, character_id, ability_id, acquired_at, is_unlocked, is_equipped,
        current_rank, current_charges, is_on_cooldown, effectiveness_multiplier,
        times_used, successful_uses, damage_dealt_total, targets_affected_total,
        xp_invested, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 1, 0, 1, ?, 0, 1.0, 0, 0, 0, 0, 0, ?, ?)
    `, newId, characterId, ability.id, now, ability.charges, now, now);

        return { success: true, characterAbilityId: newId };
    }

    async setAbilityEquipped(characterId: string, abilityId: string, equip: boolean) {
        const charAbility = await this.query(
            'SELECT id FROM character_abilities WHERE character_id = ? AND ability_id = ? AND is_unlocked = 1',
            characterId, abilityId
        );
        if (!charAbility) {
            return { success: false, error: 'Ability not unlocked', code: 'NOT_UNLOCKED' };
        }

        const now = new Date().toISOString();
        await this.execute(
            'UPDATE character_abilities SET is_equipped = ?, updated_at = ? WHERE character_id = ? AND ability_id = ?',
            equip ? 1 : 0, now, characterId, abilityId
        );

        return { success: true };
    }

    async upgradeAbility(characterId: string, abilityId: string, xpAmount: number = 0) {
        const result = await this.query<any>(`
      SELECT ca.*, ad.max_rank, ad.has_ranks
      FROM character_abilities ca
      JOIN ability_definitions ad ON ca.ability_id = ad.id
      WHERE ca.character_id = ? AND ca.ability_id = ? AND ca.is_unlocked = 1
    `, characterId, abilityId);

        if (!result) return { success: false, error: 'Ability not unlocked', code: 'NOT_UNLOCKED' };
        if (!result.has_ranks) return { success: false, error: 'Cannot upgrade this ability', code: 'NOT_UPGRADABLE' };
        if (result.current_rank >= result.max_rank) return { success: false, error: 'Already at max rank', code: 'MAX_RANK' };

        const now = new Date().toISOString();
        const newRank = result.current_rank + 1;

        await this.execute(`
      UPDATE character_abilities SET
        current_rank = ?,
        xp_invested = xp_invested + ?,
        updated_at = ?
      WHERE character_id = ? AND ability_id = ?
    `, newRank, xpAmount, now, characterId, abilityId);

        return { success: true, newRank, maxRank: result.max_rank };
    }

    async useAbility(characterId: string, abilityId: string, data: { successful?: boolean; damageDealt?: number; targetsAffected?: number }) {
        const charAbility = await this.query<CharacterAbility>(
            'SELECT id, times_used FROM character_abilities WHERE character_id = ? AND (ability_id = ? OR id = ?) AND is_unlocked = 1',
            characterId, abilityId, abilityId
        );
        if (!charAbility) return { success: false, error: 'Ability not unlocked', code: 'NOT_UNLOCKED' };

        const now = new Date().toISOString();
        const successful = data.successful !== false;

        await this.execute(`
      UPDATE character_abilities SET
        times_used = times_used + 1,
        successful_uses = successful_uses + ?,
        damage_dealt_total = damage_dealt_total + ?,
        targets_affected_total = targets_affected_total + ?,
        last_used = ?,
        updated_at = ?
      WHERE id = ?
    `,
            successful ? 1 : 0,
            data.damageDealt || 0,
            data.targetsAffected || 0,
            now, now, charAbility.id
        );

        return { success: true, timesUsed: charAbility.times_used + 1, successful };
    }

    async trainSkill(characterId: string, skillId: string, xpAmount: number) {
        if (xpAmount <= 0) return { success: false, error: 'XP must be positive', code: 'INVALID_XP' };

        let charSkill = await this.query<any>(
            'SELECT cs.*, sd.max_level FROM character_skills cs JOIN skill_definitions sd ON cs.skill_id = sd.id WHERE cs.character_id = ? AND (cs.skill_id = ? OR sd.code = ?)',
            characterId, skillId, skillId
        );

        const now = new Date().toISOString();

        if (!charSkill) {
            const skillDef = await this.query<SkillDefinition>(
                'SELECT * FROM skill_definitions WHERE id = ? OR code = ?',
                skillId, skillId
            );
            if (!skillDef) return { success: false, error: 'Skill not found', code: 'NOT_FOUND' };

            const newId = crypto.randomUUID();
            await this.execute(`
        INSERT INTO character_skills (
          id, character_id, skill_id, current_level, current_xp, xp_to_next_level,
          bonus_from_augments, bonus_from_items, temporary_bonus, temporary_penalty,
          times_used, successes, failures, critical_successes, critical_failures,
          created_at, updated_at
        ) VALUES (?, ?, ?, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?)
      `, newId, characterId, skillDef.id, now, now);

            charSkill = {
                id: newId,
                character_id: characterId,
                skill_id: skillDef.id,
                current_level: 0,
                current_xp: 0,
                xp_to_next_level: 100,
                max_level: skillDef.max_level
            };
        }

        let newXp = charSkill.current_xp + xpAmount;
        let newLevel = charSkill.current_level;
        let leveledUp = false;
        const xpToNext = charSkill.xp_to_next_level || 100;

        while (newXp >= xpToNext && newLevel < charSkill.max_level) {
            newXp -= xpToNext;
            newLevel++;
            leveledUp = true;
        }

        if (newLevel >= charSkill.max_level) {
            newLevel = charSkill.max_level;
            newXp = 0;
        }

        const newXpToNext = Math.floor(100 * Math.pow(1.5, newLevel));

        await this.execute(`
      UPDATE character_skills SET
        current_level = ?,
        current_xp = ?,
        xp_to_next_level = ?,
        updated_at = ?
      WHERE id = ?
    `, newLevel, newXp, newXpToNext, now, charSkill.id);

        return {
            success: true,
            currentLevel: newLevel,
            currentXp: newXp,
            xpToNext: newXpToNext,
            leveledUp,
            xpAdded: xpAmount
        };
    }

    async useSkill(characterId: string, skillId: string, result: 'success' | 'failure' | 'critical_success' | 'critical_failure') {
        const charSkill = await this.query<CharacterSkill>(
            'SELECT id, times_used FROM character_skills WHERE character_id = ? AND (skill_id = ? OR id = ?)',
            characterId, skillId, skillId
        );
        if (!charSkill) return { success: false, error: 'Skill not learned', code: 'NOT_FOUND' };

        const now = new Date().toISOString();
        const isSuccess = result === 'success' || result === 'critical_success';

        await this.execute(`
      UPDATE character_skills SET
        times_used = times_used + 1,
        successes = successes + ?,
        failures = failures + ?,
        critical_successes = critical_successes + ?,
        critical_failures = critical_failures + ?,
        last_used = ?,
        updated_at = ?
      WHERE id = ?
    `,
            isSuccess ? 1 : 0,
            !isSuccess ? 1 : 0,
            result === 'critical_success' ? 1 : 0,
            result === 'critical_failure' ? 1 : 0,
            now, now, charSkill.id
        );

        return { success: true, result, timesUsed: charSkill.times_used + 1 };
    }
}
