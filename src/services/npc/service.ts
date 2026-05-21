/**
 * NPC Service
 *
 * Handles all NPC-related data access: definitions, instances,
 * interactions, and state management.
 */

import type { D1Database } from '@cloudflare/workers-types';
import type {
    NpcDefinitionRow,
    NpcInstanceRow,
    NpcListFilters,
    NpcInstanceFilters,
    NpcInstanceUpdate,
    NpcInteraction,
} from './types';

// =============================================================================
// FORMATTERS
// =============================================================================

export function formatNpcDefinition(npc: NpcDefinitionRow) {
    return {
        id: npc.id,
        code: npc.code,
        name: npc.name,
        title: npc.title,
        description: npc.description,
        background: npc.background,
        classification: {
            type: npc.npc_type,
            category: npc.npc_category,
            isUnique: npc.is_unique === 1,
            isEssential: npc.is_essential === 1,
            isProcedural: npc.is_procedural === 1,
        },
        appearance: {
            gender: npc.gender,
            age: npc.age,
            ethnicity: npc.ethnicity,
            heightCm: npc.height_cm,
            build: npc.build,
            distinguishingFeatures: npc.distinguishing_features,
            portraitAsset: npc.portrait_asset,
        },
        personality: {
            traits: npc.personality_traits ? JSON.parse(npc.personality_traits) : [],
            speechPatterns: npc.speech_patterns ? JSON.parse(npc.speech_patterns) : [],
            mannerisms: npc.mannerisms,
            likes: npc.likes ? JSON.parse(npc.likes) : [],
            dislikes: npc.dislikes ? JSON.parse(npc.dislikes) : [],
            goals: npc.goals ? JSON.parse(npc.goals) : [],
        },
        affiliation: {
            factionId: npc.faction_id,
            factionRank: npc.faction_rank,
            employer: npc.employer,
            occupation: npc.occupation,
        },
        locations: {
            homeLocationId: npc.home_location_id,
            workLocationId: npc.work_location_id,
            hangoutLocations: npc.hangout_locations ? JSON.parse(npc.hangout_locations) : [],
            schedule: npc.schedule ? JSON.parse(npc.schedule) : null,
        },
        combat: {
            capable: npc.combat_capable === 1,
            style: npc.combat_style,
            threatLevel: npc.threat_level,
            skills: npc.skills ? JSON.parse(npc.skills) : [],
            abilities: npc.abilities ? JSON.parse(npc.abilities) : [],
            augments: npc.augments ? JSON.parse(npc.augments) : [],
            typicalEquipment: npc.typical_equipment ? JSON.parse(npc.typical_equipment) : [],
        },
        services: {
            isVendor: npc.is_vendor === 1,
            vendorInventoryId: npc.vendor_inventory_id,
            isQuestGiver: npc.is_quest_giver === 1,
            availableQuests: npc.available_quests ? JSON.parse(npc.available_quests) : [],
            isTrainer: npc.is_trainer === 1,
            trainableSkills: npc.trainable_skills ? JSON.parse(npc.trainable_skills) : [],
        },
        dialogue: {
            greetingDialogueId: npc.greeting_dialogue_id,
            ambientDialogue: npc.ambient_dialogue ? JSON.parse(npc.ambient_dialogue) : [],
        },
        narrative: {
            storyImportance: npc.story_importance,
            romanceOption: npc.romance_option === 1,
            killableByPlayer: npc.killable_by_player === 1,
            deathConsequence: npc.death_consequence,
        },
    };
}

export function formatNpcInstance(instance: NpcInstanceRow, definition?: NpcDefinitionRow) {
    return {
        id: instance.id,
        definitionId: instance.npc_definition_id,
        saveId: instance.save_id,
        definition: definition ? {
            code: definition.code,
            name: definition.name,
            title: definition.title,
            portraitAsset: definition.portrait_asset,
        } : null,
        state: {
            isAlive: instance.is_alive === 1,
            isActive: instance.is_active === 1,
            currentHealth: instance.current_health,
            currentLocationId: instance.current_location_id,
            currentActivity: instance.current_activity,
        },
        relationship: {
            overall: instance.relationship_with_player,
            trust: instance.trust_level,
            fear: instance.fear_level,
            respect: instance.respect_level,
            romanticInterest: instance.romantic_interest,
            timesMet: instance.times_met,
            lastInteraction: instance.last_interaction,
        },
        dialogue: {
            flags: instance.dialogue_flags ? JSON.parse(instance.dialogue_flags) : {},
            topicsDiscussed: instance.topics_discussed ? JSON.parse(instance.topics_discussed) : [],
            secretsRevealed: instance.secrets_revealed ? JSON.parse(instance.secrets_revealed) : [],
            favorsOwed: instance.favors_owed ? JSON.parse(instance.favors_owed) : [],
        },
        quests: {
            given: instance.quests_given ? JSON.parse(instance.quests_given) : [],
            completed: instance.quests_completed ? JSON.parse(instance.quests_completed) : [],
        },
        memory: {
            memoriesOfPlayer: instance.memories_of_player ? JSON.parse(instance.memories_of_player) : [],
            witnessedEvents: instance.witnessed_events ? JSON.parse(instance.witnessed_events) : [],
            grudges: instance.grudges ? JSON.parse(instance.grudges) : [],
            gratitudes: instance.gratitudes ? JSON.parse(instance.gratitudes) : [],
        },
    };
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class NpcService {
    constructor(private db: D1Database) { }

    // ---------------------------------------------------------------------------
    // NPC DEFINITIONS
    // ---------------------------------------------------------------------------

    async listNpcs(filters: NpcListFilters) {
        let sql = `SELECT * FROM npc_definitions WHERE 1=1`;
        const params: unknown[] = [];

        if (filters.npcType) { sql += ` AND npc_type = ?`; params.push(filters.npcType); }
        if (filters.category) { sql += ` AND npc_category = ?`; params.push(filters.category); }
        if (filters.factionId) { sql += ` AND faction_id = ?`; params.push(filters.factionId); }
        if (filters.isVendor) sql += ` AND is_vendor = 1`;
        if (filters.isQuestGiver) sql += ` AND is_quest_giver = 1`;
        if (filters.isTrainer) sql += ` AND is_trainer = 1`;
        if (filters.combatCapable) sql += ` AND combat_capable = 1`;
        if (filters.isUnique) sql += ` AND is_unique = 1`;

        sql += ` ORDER BY story_importance DESC, name ASC LIMIT ? OFFSET ?`;
        params.push(filters.limit, filters.offset);

        const result = await this.db.prepare(sql).bind(...params).all<NpcDefinitionRow>();
        const npcs = result.results.map(formatNpcDefinition);

        // Count query (same filters, no limit/offset)
        let countSql = `SELECT COUNT(*) as total FROM npc_definitions WHERE 1=1`;
        const countParams: unknown[] = [];
        if (filters.npcType) { countSql += ` AND npc_type = ?`; countParams.push(filters.npcType); }
        if (filters.category) { countSql += ` AND npc_category = ?`; countParams.push(filters.category); }
        if (filters.factionId) { countSql += ` AND faction_id = ?`; countParams.push(filters.factionId); }
        if (filters.isVendor) countSql += ` AND is_vendor = 1`;
        if (filters.isQuestGiver) countSql += ` AND is_quest_giver = 1`;
        if (filters.isTrainer) countSql += ` AND is_trainer = 1`;
        if (filters.combatCapable) countSql += ` AND combat_capable = 1`;
        if (filters.isUnique) countSql += ` AND is_unique = 1`;

        const countResult = await this.db.prepare(countSql).bind(...countParams).first<{ total: number }>();

        return {
            npcs,
            pagination: {
                total: countResult?.total || 0,
                limit: filters.limit,
                offset: filters.offset,
                hasMore: filters.offset + npcs.length < (countResult?.total || 0),
            },
        };
    }

    async getNpcById(id: string) {
        let npc = await this.db.prepare(`SELECT * FROM npc_definitions WHERE id = ?`)
            .bind(id).first<NpcDefinitionRow>();
        if (!npc) {
            npc = await this.db.prepare(`SELECT * FROM npc_definitions WHERE code = ?`)
                .bind(id).first<NpcDefinitionRow>();
        }
        return npc;
    }

    async getNpcDetails(id: string) {
        const npc = await this.getNpcById(id);
        if (!npc) return null;

        let faction = null;
        if (npc.faction_id) {
            faction = await this.db.prepare(`SELECT id, code, name FROM factions WHERE id = ?`)
                .bind(npc.faction_id).first<{ id: string; code: string; name: string }>();
        }

        const locations: Record<string, unknown> = {};
        if (npc.home_location_id) {
            locations.home = await this.db.prepare(`SELECT id, code, name FROM locations WHERE id = ?`)
                .bind(npc.home_location_id).first<{ id: string; code: string; name: string }>();
        }
        if (npc.work_location_id) {
            locations.work = await this.db.prepare(`SELECT id, code, name FROM locations WHERE id = ?`)
                .bind(npc.work_location_id).first<{ id: string; code: string; name: string }>();
        }

        return {
            ...formatNpcDefinition(npc),
            faction,
            locationDetails: locations,
        };
    }

    async getVendors(locationId?: string) {
        let sql = `SELECT * FROM npc_definitions WHERE is_vendor = 1`;
        const params: unknown[] = [];
        if (locationId) {
            sql += ` AND (home_location_id = ? OR work_location_id = ?)`;
            params.push(locationId, locationId);
        }
        sql += ` ORDER BY name ASC`;

        const result = await this.db.prepare(sql).bind(...params).all<NpcDefinitionRow>();
        return result.results.map(npc => ({
            ...formatNpcDefinition(npc),
            vendorInfo: { inventoryId: npc.vendor_inventory_id },
        }));
    }

    async getQuestGivers(locationId?: string) {
        let sql = `SELECT * FROM npc_definitions WHERE is_quest_giver = 1`;
        const params: unknown[] = [];
        if (locationId) {
            sql += ` AND (home_location_id = ? OR work_location_id = ?)`;
            params.push(locationId, locationId);
        }
        sql += ` ORDER BY story_importance DESC, name ASC`;

        const result = await this.db.prepare(sql).bind(...params).all<NpcDefinitionRow>();
        return result.results.map(npc => ({
            ...formatNpcDefinition(npc),
            questInfo: { availableQuests: npc.available_quests ? JSON.parse(npc.available_quests) : [] },
        }));
    }

    async getTrainers(locationId?: string, skillId?: string) {
        let sql = `SELECT * FROM npc_definitions WHERE is_trainer = 1`;
        const params: unknown[] = [];
        if (locationId) {
            sql += ` AND (home_location_id = ? OR work_location_id = ?)`;
            params.push(locationId, locationId);
        }
        sql += ` ORDER BY name ASC`;

        const result = await this.db.prepare(sql).bind(...params).all<NpcDefinitionRow>();
        let trainers = result.results.map(npc => ({
            ...formatNpcDefinition(npc),
            trainerInfo: { trainableSkills: npc.trainable_skills ? JSON.parse(npc.trainable_skills) : [] },
        }));

        if (skillId) {
            trainers = trainers.filter(t =>
                t.trainerInfo.trainableSkills.some((s: { skillId?: string; id?: string }) =>
                    s.skillId === skillId || s.id === skillId
                )
            );
        }

        return trainers;
    }

    async getNpcsByLocation(locationId: string) {
        const result = await this.db.prepare(`
      SELECT * FROM npc_definitions
      WHERE home_location_id = ?
         OR work_location_id = ?
         OR hangout_locations LIKE ?
      ORDER BY story_importance DESC, name ASC
    `).bind(locationId, locationId, `%"${locationId}"%`).all<NpcDefinitionRow>();

        return result.results.map(npc => ({
            ...formatNpcDefinition(npc),
            locationRole: npc.home_location_id === locationId ? 'resident' :
                npc.work_location_id === locationId ? 'worker' : 'visitor',
        }));
    }

    async getNpcsByFaction(factionId: string) {
        const result = await this.db.prepare(`
      SELECT * FROM npc_definitions
      WHERE faction_id = ?
      ORDER BY faction_rank DESC, story_importance DESC, name ASC
    `).bind(factionId).all<NpcDefinitionRow>();

        const npcs = result.results.map(formatNpcDefinition);

        const byRank: Record<string, typeof npcs> = {};
        for (const npc of npcs) {
            const rank = npc.affiliation.factionRank || 'Member';
            if (!byRank[rank]) byRank[rank] = [];
            byRank[rank].push(npc);
        }

        return { npcs, byRank };
    }

    // ---------------------------------------------------------------------------
    // NPC INSTANCES
    // ---------------------------------------------------------------------------

    async listInstances(filters: NpcInstanceFilters) {
        let sql = `
      SELECT ni.*, nd.code, nd.name, nd.title, nd.portrait_asset
      FROM npc_instances ni
      JOIN npc_definitions nd ON ni.npc_definition_id = nd.id
      WHERE 1=1
    `;
        const params: unknown[] = [];

        if (filters.saveId) { sql += ` AND ni.save_id = ?`; params.push(filters.saveId); }
        if (filters.locationId) { sql += ` AND ni.current_location_id = ?`; params.push(filters.locationId); }
        if (filters.isAlive === true) sql += ` AND ni.is_alive = 1`;
        else if (filters.isAlive === false) sql += ` AND ni.is_alive = 0`;
        if (filters.minRelationship !== undefined) {
            sql += ` AND ni.relationship_with_player >= ?`;
            params.push(filters.minRelationship);
        }
        sql += ` ORDER BY nd.story_importance DESC, nd.name ASC`;

        const result = await this.db.prepare(sql).bind(...params)
            .all<NpcInstanceRow & { code: string; name: string; title: string | null; portrait_asset: string | null }>();

        return result.results.map(inst => ({
            id: inst.id,
            definitionId: inst.npc_definition_id,
            saveId: inst.save_id,
            definition: {
                code: inst.code,
                name: inst.name,
                title: inst.title,
                portraitAsset: inst.portrait_asset,
            },
            state: {
                isAlive: inst.is_alive === 1,
                isActive: inst.is_active === 1,
                currentHealth: inst.current_health,
                currentLocationId: inst.current_location_id,
                currentActivity: inst.current_activity,
            },
            relationship: {
                overall: inst.relationship_with_player,
                trust: inst.trust_level,
                fear: inst.fear_level,
                respect: inst.respect_level,
                timesMet: inst.times_met,
                lastInteraction: inst.last_interaction,
            },
        }));
    }

    async getInstancesAtLocation(locationId: string, saveId?: string) {
        let sql = `
      SELECT ni.*, nd.code, nd.name, nd.title, nd.portrait_asset, nd.is_vendor,
             nd.is_quest_giver, nd.is_trainer, nd.occupation
      FROM npc_instances ni
      JOIN npc_definitions nd ON ni.npc_definition_id = nd.id
      WHERE ni.current_location_id = ? AND ni.is_alive = 1 AND ni.is_active = 1
    `;
        const params: unknown[] = [locationId];
        if (saveId) { sql += ` AND ni.save_id = ?`; params.push(saveId); }
        sql += ` ORDER BY nd.story_importance DESC, nd.name ASC`;

        const result = await this.db.prepare(sql).bind(...params)
            .all<NpcInstanceRow & {
                code: string; name: string; title: string | null;
                portrait_asset: string | null; is_vendor: number;
                is_quest_giver: number; is_trainer: number; occupation: string | null;
            }>();

        return result.results.map(inst => ({
            instanceId: inst.id,
            definitionId: inst.npc_definition_id,
            code: inst.code,
            name: inst.name,
            title: inst.title,
            portraitAsset: inst.portrait_asset,
            occupation: inst.occupation,
            currentActivity: inst.current_activity,
            services: {
                isVendor: inst.is_vendor === 1,
                isQuestGiver: inst.is_quest_giver === 1,
                isTrainer: inst.is_trainer === 1,
            },
            relationship: {
                overall: inst.relationship_with_player,
                trust: inst.trust_level,
                timesMet: inst.times_met,
            },
        }));
    }

    async getInstanceById(instanceId: string) {
        const instance = await this.db.prepare(`SELECT * FROM npc_instances WHERE id = ?`)
            .bind(instanceId).first<NpcInstanceRow>();
        if (!instance) return null;

        const definition = await this.db.prepare(`SELECT * FROM npc_definitions WHERE id = ?`)
            .bind(instance.npc_definition_id).first<NpcDefinitionRow>();

        let currentLocation = null;
        if (instance.current_location_id) {
            currentLocation = await this.db.prepare(`SELECT id, code, name FROM locations WHERE id = ?`)
                .bind(instance.current_location_id).first<{ id: string; code: string; name: string }>();
        }

        return {
            ...formatNpcInstance(instance, definition || undefined),
            currentLocation,
            fullDefinition: definition ? formatNpcDefinition(definition) : null,
        };
    }

    async updateInstance(instanceId: string, update: NpcInstanceUpdate) {
        const instance = await this.db.prepare(`SELECT * FROM npc_instances WHERE id = ?`)
            .bind(instanceId).first<NpcInstanceRow>();
        if (!instance) return { success: false, error: 'NPC instance not found', statusCode: 404 };

        const updates: string[] = [];
        const params: unknown[] = [];

        if (update.currentLocationId !== undefined) { updates.push('current_location_id = ?'); params.push(update.currentLocationId); }
        if (update.currentActivity !== undefined) { updates.push('current_activity = ?'); params.push(update.currentActivity); }
        if (update.currentHealth !== undefined) { updates.push('current_health = ?'); params.push(update.currentHealth); }
        if (update.isAlive !== undefined) { updates.push('is_alive = ?'); params.push(update.isAlive ? 1 : 0); }
        if (update.isActive !== undefined) { updates.push('is_active = ?'); params.push(update.isActive ? 1 : 0); }
        if (update.relationshipChange) {
            const newRel = Math.max(-100, Math.min(100, instance.relationship_with_player + update.relationshipChange));
            updates.push('relationship_with_player = ?'); params.push(newRel);
        }
        if (update.trustChange) {
            const newTrust = Math.max(0, Math.min(100, instance.trust_level + update.trustChange));
            updates.push('trust_level = ?'); params.push(newTrust);
        }
        if (update.fearChange) {
            const newFear = Math.max(0, Math.min(100, instance.fear_level + update.fearChange));
            updates.push('fear_level = ?'); params.push(newFear);
        }
        if (update.respectChange) {
            const newRespect = Math.max(0, Math.min(100, instance.respect_level + update.respectChange));
            updates.push('respect_level = ?'); params.push(newRespect);
        }

        if (updates.length === 0) {
            return { success: false, error: 'No valid updates provided' };
        }

        updates.push('updated_at = ?');
        params.push(new Date().toISOString());
        params.push(instanceId);

        await this.db.prepare(`UPDATE npc_instances SET ${updates.join(', ')} WHERE id = ?`)
            .bind(...params).run();

        const updated = await this.db.prepare(`SELECT * FROM npc_instances WHERE id = ?`)
            .bind(instanceId).first<NpcInstanceRow>();

        return { success: true, data: formatNpcInstance(updated!) };
    }

    async interact(instanceId: string, interaction: NpcInteraction) {
        const instance = await this.db.prepare(`SELECT * FROM npc_instances WHERE id = ?`)
            .bind(instanceId).first<NpcInstanceRow>();

        if (!instance) return { success: false, error: 'NPC instance not found', statusCode: 404 };
        if (instance.is_alive !== 1) return { success: false, error: 'Cannot interact with dead NPC' };

        const { interactionType, outcome = 'neutral', topicDiscussed, secretRevealed, memory,
            relationshipImpact = 0, trustImpact = 0, respectImpact = 0 } = interaction;

        let relChange = relationshipImpact;
        const trustChange = trustImpact;
        const respectChange = respectImpact;

        if (outcome === 'positive' && relChange === 0) relChange = 5;
        if (outcome === 'negative' && relChange === 0) relChange = -5;

        const now = new Date().toISOString();
        const newRelationship = Math.max(-100, Math.min(100, instance.relationship_with_player + relChange));
        const newTrust = Math.max(0, Math.min(100, instance.trust_level + trustChange));
        const newRespect = Math.max(0, Math.min(100, instance.respect_level + respectChange));

        const topicsDiscussed = instance.topics_discussed ? JSON.parse(instance.topics_discussed) : [];
        if (topicDiscussed && !topicsDiscussed.includes(topicDiscussed)) {
            topicsDiscussed.push(topicDiscussed);
        }

        const secretsRevealed = instance.secrets_revealed ? JSON.parse(instance.secrets_revealed) : [];
        if (secretRevealed && !secretsRevealed.includes(secretRevealed)) {
            secretsRevealed.push(secretRevealed);
        }

        let memories = instance.memories_of_player ? JSON.parse(instance.memories_of_player) : [];
        if (memory) {
            memories.push({ memory, timestamp: now, outcome });
            if (memories.length > 20) memories = memories.slice(-20);
        }

        const newTimesMet = instance.times_met + 1;

        await this.db.prepare(`UPDATE npc_instances SET
      times_met = ?, last_interaction = ?, relationship_with_player = ?,
      trust_level = ?, respect_level = ?, topics_discussed = ?,
      secrets_revealed = ?, memories_of_player = ?, updated_at = ?
     WHERE id = ?`)
            .bind(
                newTimesMet, now, newRelationship, newTrust, newRespect,
                JSON.stringify(topicsDiscussed), JSON.stringify(secretsRevealed),
                JSON.stringify(memories), now, instanceId
            ).run();

        const updated = await this.db.prepare(`SELECT * FROM npc_instances WHERE id = ?`)
            .bind(instanceId).first<NpcInstanceRow>();

        return {
            success: true,
            data: {
                interaction: { type: interactionType, outcome, timestamp: now },
                changes: {
                    relationship: { before: instance.relationship_with_player, after: newRelationship, change: relChange },
                    trust: { before: instance.trust_level, after: newTrust, change: trustChange },
                    respect: { before: instance.respect_level, after: newRespect, change: respectChange },
                    timesMet: updated!.times_met,
                },
                newSecrets: secretRevealed ? [secretRevealed] : [],
                newTopics: topicDiscussed ? [topicDiscussed] : [],
            },
        };
    }

    async spawnInstance(npcDefinitionId: string, saveId?: string, locationId?: string, initialRelationship = 0) {
        let npcDef = await this.db.prepare(`SELECT * FROM npc_definitions WHERE id = ?`)
            .bind(npcDefinitionId).first<NpcDefinitionRow>();
        if (!npcDef) {
            npcDef = await this.db.prepare(`SELECT * FROM npc_definitions WHERE code = ?`)
                .bind(npcDefinitionId).first<NpcDefinitionRow>();
        }
        if (!npcDef) return { success: false, error: 'NPC definition not found', statusCode: 404 };

        if (saveId) {
            const existing = await this.db.prepare(`SELECT id FROM npc_instances WHERE npc_definition_id = ? AND save_id = ?`)
                .bind(npcDef.id, saveId).first();
            if (existing) return { success: false, error: 'NPC instance already exists for this save', statusCode: 409 };
        }

        const instanceId = `npc-inst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const spawnLocation = locationId || npcDef.home_location_id || npcDef.work_location_id;

        await this.db.prepare(`INSERT INTO npc_instances (
      id, npc_definition_id, save_id, current_location_id, relationship_with_player
    ) VALUES (?, ?, ?, ?, ?)`)
            .bind(instanceId, npcDef.id, saveId || null, spawnLocation, initialRelationship).run();

        const instance = await this.db.prepare(`SELECT * FROM npc_instances WHERE id = ?`)
            .bind(instanceId).first<NpcInstanceRow>();

        return { success: true, data: formatNpcInstance(instance!, npcDef), statusCode: 201 };
    }
}
