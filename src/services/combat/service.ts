
import type { D1Database } from '@cloudflare/workers-types';

export interface CombatCatalogFilters {
    search?: string;
    type?: string;
    limit?: number;
    offset?: number;
}

export class CombatService {
    constructor(private db: D1Database) { }

    /**
     * Damage Types
     */
    async listDamageTypes(filters: { physical?: boolean, energy?: boolean, elemental?: boolean, exotic?: boolean } = {}) {
        const { physical, energy, elemental, exotic } = filters;
        let query = `
            SELECT id, code, name, description,
                   is_physical, is_energy, is_elemental, is_exotic,
                   armor_effectiveness, shield_effectiveness,
                   can_crit, leaves_status_id, environmental_source
            FROM damage_type_definitions
            WHERE 1=1
        `;
        const params: any[] = [];

        if (physical !== undefined) {
            query += ` AND is_physical = ?`;
            params.push(physical ? 1 : 0);
        }
        if (energy !== undefined) {
            query += ` AND is_energy = ?`;
            params.push(energy ? 1 : 0);
        }
        if (elemental !== undefined) {
            query += ` AND is_elemental = ?`;
            params.push(elemental ? 1 : 0);
        }
        if (exotic !== undefined) {
            query += ` AND is_exotic = ?`;
            params.push(exotic ? 1 : 0);
        }

        query += ` ORDER BY name ASC`;
        const result = await this.db.prepare(query).bind(...params).all();

        return (result.results || []).map((dt: any) => ({
            id: dt.id,
            code: dt.code,
            name: dt.name,
            description: dt.description,
            classification: {
                isPhysical: dt.is_physical === 1,
                isEnergy: dt.is_energy === 1,
                isElemental: dt.is_elemental === 1,
                isExotic: dt.is_exotic === 1,
            },
            effectiveness: {
                armor: dt.armor_effectiveness,
                shield: dt.shield_effectiveness,
            },
            canCrit: dt.can_crit === 1,
            leavesStatusId: dt.leaves_status_id,
            isEnvironmental: dt.environmental_source === 1,
        }));
    }

    async getDamageTypeDetails(idOrCode: string) {
        const dt = await this.db.prepare(
            `SELECT * FROM damage_type_definitions WHERE id = ? OR code = ?`
        ).bind(idOrCode, idOrCode).first<any>();

        if (!dt) return null;

        let statusEffect = null;
        if (dt.leaves_status_id) {
            statusEffect = await this.db.prepare(
                `SELECT id, code, name, description, condition_type, severity
                 FROM condition_definitions WHERE id = ?`
            ).bind(dt.leaves_status_id).first<any>();
        }

        return {
            id: dt.id,
            code: dt.code,
            name: dt.name,
            description: dt.description,
            classification: {
                isPhysical: dt.is_physical === 1,
                isEnergy: dt.is_energy === 1,
                isElemental: dt.is_elemental === 1,
                isExotic: dt.is_exotic === 1,
            },
            effectiveness: {
                armor: dt.armor_effectiveness,
                shield: dt.shield_effectiveness,
            },
            canCrit: dt.can_crit === 1,
            isEnvironmental: dt.environmental_source === 1,
            statusEffect: statusEffect ? {
                id: statusEffect.id,
                code: statusEffect.code,
                name: statusEffect.name,
                description: statusEffect.description,
                type: statusEffect.condition_type,
                severity: statusEffect.severity,
            } : null,
            commonResistances: dt.common_resistances ? JSON.parse(dt.common_resistances) : [],
        };
    }

    /**
     * Conditions
     */
    async listConditions(filters: { type?: string, minSeverity?: number, maxSeverity?: number, positive?: boolean, dispellable?: boolean, limit?: number, offset?: number } = {}) {
        const { type, minSeverity, maxSeverity, positive, dispellable, limit = 50, offset = 0 } = filters;
        let query = `
            SELECT id, code, name, description, icon_asset,
                   condition_type, severity, is_positive, is_visible,
                   is_dispellable, duration_type, default_duration_seconds,
                   stacks, max_stacks, movement_modifier
            FROM condition_definitions
            WHERE 1=1
        `;
        const params: any[] = [];

        if (type) {
            query += ` AND condition_type = ?`;
            params.push(type);
        }
        if (minSeverity !== undefined) {
            query += ` AND severity >= ?`;
            params.push(minSeverity);
        }
        if (maxSeverity !== undefined) {
            query += ` AND severity <= ?`;
            params.push(maxSeverity);
        }
        if (positive !== undefined) {
            query += ` AND is_positive = ?`;
            params.push(positive ? 1 : 0);
        }
        if (dispellable !== undefined) {
            query += ` AND is_dispellable = ?`;
            params.push(dispellable ? 1 : 0);
        }

        const countResult = await this.db.prepare(query.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) as total FROM')).bind(...params).first<{ total: number }>();

        query += ` ORDER BY severity DESC, name ASC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const result = await this.db.prepare(query).bind(...params).all<any>();

        return {
            conditions: (result.results || []).map(cond => ({
                id: cond.id,
                code: cond.code,
                name: cond.name,
                description: cond.description,
                iconAsset: cond.icon_asset,
                type: cond.condition_type,
                severity: cond.severity,
                isPositive: cond.is_positive === 1,
                isVisible: cond.is_visible === 1,
                isDispellable: cond.is_dispellable === 1,
                duration: {
                    type: cond.duration_type,
                    defaultSeconds: cond.default_duration_seconds,
                },
                stacking: {
                    canStack: cond.stacks === 1,
                    maxStacks: cond.max_stacks,
                },
                movementModifier: cond.movement_modifier,
            })),
            total: countResult?.total || 0
        };
    }

    async getConditionDetails(idOrCode: string) {
        const cond = await this.db.prepare(
            `SELECT * FROM condition_definitions WHERE id = ? OR code = ?`
        ).bind(idOrCode, idOrCode).first<any>();

        if (!cond) return null;

        let skillMitigation = null;
        if (cond.skill_mitigation_id) {
            skillMitigation = await this.db.prepare(`SELECT id, code, name FROM skill_definitions WHERE id = ?`)
                .bind(cond.skill_mitigation_id).first<any>();
        }

        return {
            id: cond.id,
            code: cond.code,
            name: cond.name,
            description: cond.description,
            iconAsset: cond.icon_asset,
            classification: {
                type: cond.condition_type,
                severity: cond.severity,
                isPositive: cond.is_positive === 1,
                isVisible: cond.is_visible === 1,
                isDispellable: cond.is_dispellable === 1,
            },
            duration: {
                type: cond.duration_type,
                defaultSeconds: cond.default_duration_seconds,
                canStackDuration: cond.can_stack_duration === 1,
            },
            stacking: {
                canStack: cond.stacks === 1,
                maxStacks: cond.max_stacks,
                behavior: cond.stack_behavior,
            },
            effects: {
                statModifiers: cond.stat_modifiers ? JSON.parse(cond.stat_modifiers) : null,
                attributeModifiers: cond.attribute_modifiers ? JSON.parse(cond.attribute_modifiers) : null,
                damageOverTime: cond.damage_over_time ? JSON.parse(cond.damage_over_time) : null,
                healingOverTime: cond.healing_over_time ? JSON.parse(cond.healing_over_time) : null,
                movementModifier: cond.movement_modifier,
                actionRestrictions: cond.action_restrictions ? JSON.parse(cond.action_restrictions) : null,
                specialEffects: cond.special_effects ? JSON.parse(cond.special_effects) : null,
            },
            triggers: {
                onApply: cond.on_apply_effect ? JSON.parse(cond.on_apply_effect) : null,
                onExpire: cond.on_expire_effect ? JSON.parse(cond.on_expire_effect) : null,
                onTick: cond.on_tick_effect ? JSON.parse(cond.on_tick_effect) : null,
                onStack: cond.on_stack_effect ? JSON.parse(cond.on_stack_effect) : null,
            },
            removal: {
                conditions: cond.removal_conditions ? JSON.parse(cond.removal_conditions) : null,
                cleanseTypes: cond.cleanse_types ? JSON.parse(cond.cleanse_types) : null,
                immunityAfterRemoval: cond.immunity_after_removal,
            },
            mitigation: {
                skillMitigation: skillMitigation ? {
                    id: skillMitigation.id,
                    code: skillMitigation.code,
                    name: skillMitigation.name,
                } : null,
                augmentMitigation: cond.augment_mitigation ? JSON.parse(cond.augment_mitigation) : null,
            },
            typicalSources: cond.typical_sources ? JSON.parse(cond.typical_sources) : null,
            visuals: {
                characterEffect: cond.visual_effect_on_character,
                screenEffect: cond.screen_effect,
                audioEffect: cond.audio_effect,
            },
        };
    }

    /**
     * Combat Actions
     */
    async listActions(filters: { type?: string, weaponType?: string, damageType?: string, freeAction?: boolean, reaction?: boolean, limit?: number, offset?: number } = {}) {
        const { type, weaponType, damageType, freeAction, reaction, limit = 50, offset = 0 } = filters;
        let query = `
            SELECT id, code, name, description,
                   action_type, action_cost, is_free_action, is_reaction,
                   requires_weapon_type, target_type, target_count,
                   range_min_m, range_max_m, requires_los,
                   damage_formula, damage_type,
                   accuracy_modifier, critical_chance_modifier
            FROM combat_action_definitions
            WHERE 1=1
        `;
        const params: any[] = [];

        if (type) {
            query += ` AND action_type = ?`;
            params.push(type);
        }
        if (weaponType) {
            query += ` AND requires_weapon_type LIKE ?`;
            params.push(`%${weaponType}%`);
        }
        if (damageType) {
            query += ` AND damage_type = ?`;
            params.push(damageType);
        }
        if (freeAction !== undefined) {
            query += ` AND is_free_action = ?`;
            params.push(freeAction ? 1 : 0);
        }
        if (reaction !== undefined) {
            query += ` AND is_reaction = ?`;
            params.push(reaction ? 1 : 0);
        }

        const countResult = await this.db.prepare(query.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) as total FROM')).bind(...params).first<{ total: number }>();

        query += ` ORDER BY action_type, action_cost, name ASC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const result = await this.db.prepare(query).bind(...params).all<any>();

        return {
            actions: (result.results || []).map(action => ({
                id: action.id,
                code: action.code,
                name: action.name,
                description: action.description,
                type: action.action_type,
                cost: {
                    actionPoints: action.action_cost,
                    isFreeAction: action.is_free_action === 1,
                    isReaction: action.is_reaction === 1,
                },
                requirements: {
                    weaponType: action.requires_weapon_type ? JSON.parse(action.requires_weapon_type) : null,
                },
                targeting: {
                    type: action.target_type,
                    count: action.target_count,
                    rangeMin: action.range_min_m,
                    rangeMax: action.range_max_m,
                    requiresLineOfSight: action.requires_los === 1,
                },
                damage: action.damage_formula ? {
                    formula: action.damage_formula,
                    type: action.damage_type,
                } : null,
                modifiers: {
                    accuracy: action.accuracy_modifier,
                    criticalChance: action.critical_chance_modifier,
                },
            })),
            total: countResult?.total || 0
        };
    }

    async getActionDetails(idOrCode: string) {
        const action = await this.db.prepare(
            `SELECT * FROM combat_action_definitions WHERE id = ? OR code = ?`
        ).bind(idOrCode, idOrCode).first<any>();

        if (!action) return null;

        return {
            id: action.id,
            code: action.code,
            name: action.name,
            description: action.description,
            type: action.action_type,
            cost: {
                actionPoints: action.action_cost,
                isFreeAction: action.is_free_action === 1,
                isReaction: action.is_reaction === 1,
            },
            requirements: {
                weaponType: action.requires_weapon_type ? JSON.parse(action.requires_weapon_type) : null,
                abilityId: action.requires_ability_id,
                augmentId: action.requires_augment_id,
                minAttribute: action.min_attribute,
                requiredStance: action.requires_stance,
            },
            targeting: {
                type: action.target_type,
                count: action.target_count,
                rangeMin: action.range_min_m,
                rangeMax: action.range_max_m,
                requiresLineOfSight: action.requires_los === 1,
                aoe: action.area_of_effect ? JSON.parse(action.area_of_effect) : null,
            },
            damage: {
                formula: action.damage_formula,
                type: action.damage_type,
            },
            effects: {
                statusEffects: action.status_effects ? JSON.parse(action.status_effects) : null,
                knockback: action.knockback,
                specialEffects: action.special_effects ? JSON.parse(action.special_effects) : null,
            },
            modifiers: {
                accuracy: action.accuracy_modifier,
                criticalChance: action.critical_chance_modifier,
                criticalDamage: action.critical_damage_modifier,
            },
            visuals: {
                animationId: action.animation_id,
                soundEffectId: action.sound_effect_id,
                visualEffectId: action.visual_effect_id,
            },
        };
    }

    /**
     * Arenas
     */
    async listArenas(filters: { locationId?: string, multipleLevels?: boolean, minSize?: number, limit?: number, offset?: number } = {}) {
        const { locationId, multipleLevels, minSize, limit = 50, offset = 0 } = filters;
        let query = `
            SELECT ca.id, ca.name, ca.location_id,
                   ca.width_m, ca.height_m, ca.grid_size_m,
                   ca.lighting_level, ca.noise_level,
                   ca.has_multiple_levels, ca.fall_damage_enabled,
                   l.name as location_name, l.district_id
            FROM combat_arenas ca
            LEFT JOIN locations l ON ca.location_id = l.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (locationId) {
            query += ` AND ca.location_id = ?`;
            params.push(locationId);
        }
        if (multipleLevels !== undefined) {
            query += ` AND ca.has_multiple_levels = ?`;
            params.push(multipleLevels ? 1 : 0);
        }
        if (minSize) {
            query += ` AND (ca.width_m * ca.height_m) >= ?`;
            params.push(minSize);
        }

        const countQuery = query.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) as total FROM');
        const countResult = await this.db.prepare(countQuery).bind(...params).first<{ total: number }>();

        query += ` ORDER BY ca.name ASC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const result = await this.db.prepare(query).bind(...params).all<any>();

        return {
            arenas: (result.results || []).map(arena => ({
                id: arena.id,
                name: arena.name,
                location: arena.location_id ? {
                    id: arena.location_id,
                    name: arena.location_name,
                    districtId: arena.district_id,
                } : null,
                dimensions: {
                    width: arena.width_m,
                    height: arena.height_m,
                    gridSize: arena.grid_size_m,
                    area: arena.width_m * arena.height_m,
                },
                environment: {
                    lightingLevel: arena.lighting_level,
                    noiseLevel: arena.noise_level,
                },
                hasMultipleLevels: arena.has_multiple_levels === 1,
                fallDamageEnabled: arena.fall_damage_enabled === 1,
            })),
            total: countResult?.total || 0
        };
    }

    async getArenaDetails(id: string) {
        const arena = await this.db.prepare(
            `SELECT ca.*, l.name as location_name, l.district_id
             FROM combat_arenas ca
             LEFT JOIN locations l ON ca.location_id = l.id
             WHERE ca.id = ?`
        ).bind(id).first<any>();

        if (!arena) return null;

        return {
            id: arena.id,
            name: arena.name,
            location: arena.location_id ? {
                id: arena.location_id,
                name: arena.location_name,
                districtId: arena.district_id,
            } : null,
            dimensions: {
                width: arena.width_m,
                height: arena.height_m,
                gridSize: arena.grid_size_m,
                area: arena.width_m * arena.height_m,
            },
            terrain: {
                map: arena.terrain_map ? JSON.parse(arena.terrain_map) : null,
                elevation: arena.elevation_map ? JSON.parse(arena.elevation_map) : null,
                coverPoints: arena.cover_points ? JSON.parse(arena.cover_points) : [],
                hazardZones: arena.hazard_zones ? JSON.parse(arena.hazard_zones) : [],
            },
            spawns: {
                player: arena.player_spawn_points ? JSON.parse(arena.player_spawn_points) : [],
                enemy: arena.enemy_spawn_points ? JSON.parse(arena.enemy_spawn_points) : [],
                reinforcement: arena.reinforcement_points ? JSON.parse(arena.reinforcement_points) : [],
            },
            interactables: {
                objects: arena.interactable_objects ? JSON.parse(arena.interactable_objects) : [],
                destructibles: arena.destructibles ? JSON.parse(arena.destructibles) : [],
                hackable: arena.hackable_objects ? JSON.parse(arena.hackable_objects) : [],
            },
            environment: {
                lightingLevel: arena.lighting_level,
                noiseLevel: arena.noise_level,
                ambientHazards: arena.ambient_hazards ? JSON.parse(arena.ambient_hazards) : [],
                weatherEffects: arena.weather_effects ? JSON.parse(arena.weather_effects) : null,
            },
            vertical: {
                hasMultipleLevels: arena.has_multiple_levels === 1,
                levelConnections: arena.level_connections ? JSON.parse(arena.level_connections) : [],
                fallDamageEnabled: arena.fall_damage_enabled === 1,
            },
            aiHints: {
                patrolRoutes: arena.patrol_routes ? JSON.parse(arena.patrol_routes) : [],
                sniperPositions: arena.sniper_positions ? JSON.parse(arena.sniper_positions) : [],
                flankingRoutes: arena.flanking_routes ? JSON.parse(arena.flanking_routes) : [],
                retreatRoutes: arena.retreat_routes ? JSON.parse(arena.retreat_routes) : [],
            },
        };
    }

    /**
     * Encounters
     */
    async listEncounters(filters: { type?: string, minDifficulty?: number, maxDifficulty?: number, locationId?: string, avoidable?: boolean, scripted?: boolean, limit?: number, offset?: number } = {}) {
        const { type, minDifficulty, maxDifficulty, locationId, avoidable, scripted, limit = 50, offset = 0 } = filters;
        let query = `
            SELECT ce.id, ce.name, ce.description,
                   ce.encounter_type, ce.difficulty_rating,
                   ce.is_scripted, ce.is_avoidable,
                   ce.location_id, ce.combat_arena_id,
                   ce.xp_reward, ce.cred_reward,
                   ce.retreat_possible, ce.surrender_possible,
                   l.name as location_name,
                   ca.name as arena_name
            FROM combat_encounters ce
            LEFT JOIN locations l ON ce.location_id = l.id
            LEFT JOIN combat_arenas ca ON ce.combat_arena_id = ca.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (type) {
            query += ` AND ce.encounter_type = ?`;
            params.push(type);
        }
        if (minDifficulty !== undefined) {
            query += ` AND ce.difficulty_rating >= ?`;
            params.push(minDifficulty);
        }
        if (maxDifficulty !== undefined) {
            query += ` AND ce.difficulty_rating <= ?`;
            params.push(maxDifficulty);
        }
        if (locationId) {
            query += ` AND ce.location_id = ?`;
            params.push(locationId);
        }
        if (avoidable !== undefined) {
            query += ` AND ce.is_avoidable = ?`;
            params.push(avoidable ? 1 : 0);
        }
        if (scripted !== undefined) {
            query += ` AND ce.is_scripted = ?`;
            params.push(scripted ? 1 : 0);
        }

        const countQuery = query.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) as total FROM');
        const countResult = await this.db.prepare(countQuery).bind(...params).first<{ total: number }>();

        query += ` ORDER BY ce.difficulty_rating ASC, ce.name ASC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const result = await this.db.prepare(query).bind(...params).all<any>();

        return {
            encounters: (result.results || []).map(enc => ({
                id: enc.id,
                name: enc.name,
                description: enc.description,
                type: enc.encounter_type,
                difficulty: enc.difficulty_rating,
                isScripted: enc.is_scripted === 1,
                isAvoidable: enc.is_avoidable === 1,
                location: enc.location_id ? {
                    id: enc.location_id,
                    name: enc.location_name,
                } : null,
                arena: enc.combat_arena_id ? {
                    id: enc.combat_arena_id,
                    name: enc.arena_name,
                } : null,
                rewards: {
                    xp: enc.xp_reward,
                    credits: enc.cred_reward,
                },
                options: {
                    canRetreat: enc.retreat_possible === 1,
                    canSurrender: enc.surrender_possible === 1,
                },
            })),
            total: countResult?.total || 0
        };
    }

    async getEncounterDetails(id: string) {
        const encounter = await this.db.prepare(
            `SELECT ce.*, l.name as location_name, ca.name as arena_name,
                    npc.name as boss_name, npc.npc_type as boss_type
             FROM combat_encounters ce
             LEFT JOIN locations l ON ce.location_id = l.id
             LEFT JOIN combat_arenas ca ON ce.combat_arena_id = ca.id
             LEFT JOIN npc_definitions npc ON ce.boss_npc_id = npc.id
             WHERE ce.id = ?`
        ).bind(id).first<any>();

        if (!encounter) return null;

        return {
            id: encounter.id,
            name: encounter.name,
            description: encounter.description,
            type: encounter.encounter_type,
            difficulty: encounter.difficulty_rating,
            isScripted: encounter.is_scripted === 1,
            isAvoidable: encounter.is_avoidable === 1,
            location: encounter.location_id ? {
                id: encounter.location_id,
                name: encounter.location_name,
            } : null,
            arena: encounter.combat_arena_id ? {
                id: encounter.combat_arena_id,
                name: encounter.arena_name,
            } : null,
            environmentModifiers: encounter.environment_modifiers ? JSON.parse(encounter.environment_modifiers) : null,
            enemies: {
                spawnGroups: encounter.enemy_spawn_groups ? JSON.parse(encounter.enemy_spawn_groups) : [],
                boss: encounter.boss_npc_id ? {
                    id: encounter.boss_npc_id,
                    name: encounter.boss_name,
                    type: encounter.boss_type,
                } : null,
            },
            objectives: {
                primary: encounter.primary_objective,
                optional: encounter.optional_objectives ? JSON.parse(encounter.optional_objectives) : [],
                failureConditions: encounter.failure_conditions ? JSON.parse(encounter.failure_conditions) : [],
                timeLimit: encounter.time_limit_seconds,
            },
            rewards: {
                xp: encounter.xp_reward,
                credits: encounter.cred_reward,
                itemDrops: encounter.item_drops ? JSON.parse(encounter.item_drops) : [],
                special: encounter.special_rewards ? JSON.parse(encounter.special_rewards) : [],
            },
            consequences: {
                canRetreat: encounter.retreat_possible === 1,
                retreatPenalty: encounter.retreat_penalty ? JSON.parse(encounter.retreat_penalty) : null,
                deathConsequence: encounter.death_consequence,
                narrativeImpact: encounter.narrative_impact ? JSON.parse(encounter.narrative_impact) : null,
            },
            ai: {
                profile: encounter.enemy_ai_profile,
                coordination: encounter.enemy_coordination,
                moraleEnabled: encounter.enemy_morale_enabled === 1,
                canSurrender: encounter.surrender_possible === 1,
            },
        };
    }

    async getEncounterPreview(id: string) {
        const encounter = await this.db.prepare(
            `SELECT ce.id, ce.name, ce.description,
                    ce.encounter_type, ce.difficulty_rating,
                    ce.is_avoidable, ce.retreat_possible,
                    ce.xp_reward, ce.cred_reward,
                    ce.time_limit_seconds,
                    l.name as location_name
             FROM combat_encounters ce
             LEFT JOIN locations l ON ce.location_id = l.id
             WHERE ce.id = ?`
        ).bind(id).first<any>();

        if (!encounter) return null;

        let difficultyLabel = 'Unknown';
        if (encounter.difficulty_rating <= 2) difficultyLabel = 'Easy';
        else if (encounter.difficulty_rating <= 4) difficultyLabel = 'Normal';
        else if (encounter.difficulty_rating <= 6) difficultyLabel = 'Hard';
        else if (encounter.difficulty_rating <= 8) difficultyLabel = 'Very Hard';
        else difficultyLabel = 'Extreme';

        return {
            id: encounter.id,
            name: encounter.name,
            description: encounter.description,
            type: encounter.encounter_type,
            difficulty: {
                rating: encounter.difficulty_rating,
                label: difficultyLabel,
            },
            location: encounter.location_name,
            options: {
                canAvoid: encounter.is_avoidable === 1,
                canRetreat: encounter.retreat_possible === 1,
            },
            hasTimeLimit: encounter.time_limit_seconds !== null,
            estimatedRewards: {
                xp: encounter.xp_reward,
                credits: encounter.cred_reward,
            },
            warnings: [
                ...(encounter.difficulty_rating >= 7 ? ['High difficulty - prepare carefully'] : []),
                ...(encounter.time_limit_seconds ? ['Time-limited encounter'] : []),
                ...(encounter.is_avoidable === 0 ? ['Cannot be avoided'] : []),
                ...(encounter.retreat_possible === 0 ? ['No retreat possible'] : []),
            ],
        };
    }
}
