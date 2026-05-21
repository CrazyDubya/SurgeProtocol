import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
// import { nanoid } from 'nanoid';
import type {
    DialogueTree,
    DialogueNode,
    DialogueResponse,
    ConversationState,
    FormattedDialogueTree,
    FormattedDialogueNode,
    FormattedDialogueResponse,
    ConversationHistory,
    CharacterDialogueFlag
} from './types';

export class NarrativeService {
    constructor(
        private db: D1Database,
        _cache: KVNamespace
    ) { }

    /**
     * List dialogue trees with filtering.
     */
    async listTrees(filters: {
        npcId?: string;
        locationId?: string;
        missionId?: string;
        hasSkillChecks?: boolean;
        limit?: number;
        offset?: number;
    }) {
        const { npcId, locationId, missionId, hasSkillChecks, limit = 50, offset = 0 } = filters;
        let sql = `SELECT * FROM dialogue_trees WHERE 1=1`;
        const params: unknown[] = [];

        if (npcId) {
            sql += ` AND npc_id = ?`;
            params.push(npcId);
        }

        if (locationId) {
            sql += ` AND location_id = ?`;
            params.push(locationId);
        }

        if (missionId) {
            sql += ` AND mission_id = ?`;
            params.push(missionId);
        }

        if (hasSkillChecks) {
            sql += ` AND has_skill_checks = 1`;
        }

        sql += ` ORDER BY name ASC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const result = await this.db.prepare(sql).bind(...params).all<DialogueTree>();
        const trees = result.results.map(this.formatDialogueTree);

        // Get total count
        let countSql = `SELECT COUNT(*) as total FROM dialogue_trees WHERE 1=1`;
        const countParams: unknown[] = [];

        if (npcId) { countSql += ` AND npc_id = ?`; countParams.push(npcId); }
        if (locationId) { countSql += ` AND location_id = ?`; countParams.push(locationId); }
        if (missionId) { countSql += ` AND mission_id = ?`; countParams.push(missionId); }
        if (hasSkillChecks) { countSql += ` AND has_skill_checks = 1`; }

        const countResult = await this.db.prepare(countSql).bind(...countParams).first<{ total: number }>();

        return {
            trees,
            total: countResult?.total || 0,
            limit,
            offset,
            hasMore: offset + trees.length < (countResult?.total || 0),
        };
    }

    /**
     * Get a dialogue tree by ID or Code.
     */
    async getTree(treeId: string) {
        // Try to get from cache first if accessing by ID
        // Note: Caching logic ommitted for simplicity for now, but good to add later

        let tree = await this.db
            .prepare(`SELECT * FROM dialogue_trees WHERE id = ?`)
            .bind(treeId)
            .first<DialogueTree>();

        if (!tree) {
            tree = await this.db
                .prepare(`SELECT * FROM dialogue_trees WHERE code = ?`)
                .bind(treeId)
                .first<DialogueTree>();
        }

        if (!tree) return null;

        return this.formatDialogueTree(tree);
    }

    /**
     * Get full tree details including nodes.
     */
    async getTreeDetails(treeId: string) {
        const tree = await this.db
            .prepare(`SELECT * FROM dialogue_trees WHERE id = ?`)
            .bind(treeId)
            .first<DialogueTree>() || await this.db
                .prepare(`SELECT * FROM dialogue_trees WHERE code = ?`)
                .bind(treeId)
                .first<DialogueTree>();

        if (!tree) return null;

        const nodesResult = await this.db
            .prepare(`SELECT * FROM dialogue_nodes WHERE tree_id = ?`)
            .bind(tree.id)
            .all<DialogueNode>();

        const nodes = nodesResult.results.map(this.formatDialogueNode);
        const nodeIds = nodesResult.results.map(n => n.id);

        let responses: FormattedDialogueResponse[] = [];
        if (nodeIds.length > 0) {
            const placeholders = nodeIds.map(() => '?').join(',');
            const responsesResult = await this.db
                .prepare(`SELECT * FROM dialogue_responses WHERE node_id IN (${placeholders}) ORDER BY display_order ASC`)
                .bind(...nodeIds)
                .all<DialogueResponse>();
            responses = responsesResult.results.map(this.formatDialogueResponse);
        }

        return {
            ...this.formatDialogueTree(tree),
            nodes,
            responses,
        };
    }

    /**
     * Start a new conversation.
     */
    async startConversation(characterId: string, treeId: string, npcInstanceId?: string) {
        // 1. Get Tree
        let tree = await this.db.prepare(`SELECT * FROM dialogue_trees WHERE id = ?`).bind(treeId).first<DialogueTree>();
        if (!tree) {
            tree = await this.db.prepare(`SELECT * FROM dialogue_trees WHERE code = ?`).bind(treeId).first<DialogueTree>();
        }
        if (!tree) throw new Error('Dialogue tree not found');

        // 2. Check for active conversation
        const existingConvo = await this.db
            .prepare(`SELECT id FROM conversation_states WHERE character_id = ? AND is_active = 1`)
            .bind(characterId)
            .first();

        if (existingConvo) throw new Error('Character already has an active conversation');

        // 3. Determine Start Node
        const startNodeId = tree.greeting_node_id || tree.root_node_id;
        if (!startNodeId) throw new Error('Dialogue tree has no starting node');

        const startNode = await this.db.prepare(`SELECT * FROM dialogue_nodes WHERE id = ?`).bind(startNodeId).first<DialogueNode>();
        if (!startNode) throw new Error('Starting node not found');

        // 4. Create State
        const stateId = `conv-${Date.now()}-${crypto.randomUUID()}`;
        const now = new Date().toISOString();

        await this.db.prepare(`
            INSERT INTO conversation_states (
                id, character_id, tree_id, current_node_id, started_at,
                nodes_visited, responses_chosen, flags_set, effects_applied, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).bind(
            stateId, characterId, tree.id, startNodeId, now,
            JSON.stringify([startNodeId]), JSON.stringify([]), JSON.stringify({}), JSON.stringify([])
        ).run();

        // 5. Update NPC interaction
        if (npcInstanceId) {
            await this.db.prepare(`UPDATE npc_instances SET last_interaction = ? WHERE id = ?`)
                .bind(now, npcInstanceId).run();
        }

        // 6. Get available responses
        const responses = await this.getResponsesForNode(startNodeId);

        return {
            conversationId: stateId,
            tree: this.formatDialogueTree(tree),
            currentNode: this.formatDialogueNode(startNode),
            availableResponses: responses,
            startedAt: now
        };
    }

    /**
     * Get current conversation state.
     */
    async getConversationState(stateId: string) {
        const state = await this.db.prepare(`SELECT * FROM conversation_states WHERE id = ?`).bind(stateId).first<ConversationState>();
        if (!state) return null;

        const tree = await this.db.prepare(`SELECT * FROM dialogue_trees WHERE id = ?`).bind(state.tree_id).first<DialogueTree>();
        const currentNode = await this.db.prepare(`SELECT * FROM dialogue_nodes WHERE id = ?`).bind(state.current_node_id).first<DialogueNode>();

        let responses: FormattedDialogueResponse[] = [];
        if (currentNode) {
            responses = await this.getResponsesForNode(currentNode.id);
        }

        return {
            conversationId: state.id,
            isActive: state.is_active === 1,
            tree: tree ? this.formatDialogueTree(tree) : null,
            currentNode: currentNode ? this.formatDialogueNode(currentNode) : null,
            availableResponses: responses,
            history: {
                nodesVisited: JSON.parse(state.nodes_visited || '[]'),
                responsesChosen: JSON.parse(state.responses_chosen || '[]'),
                flagsSet: JSON.parse(state.flags_set || '{}'),
                effectsApplied: JSON.parse(state.effects_applied || '[]'),
            },
            startedAt: state.started_at,
            endedAt: state.ended_at,
        };
    }

    /**
     * Submit a response.
     */
    async submitResponse(conversationId: string, responseId: string, skillCheckResult?: 'success' | 'failure') {
        const state = await this.db.prepare(`SELECT * FROM conversation_states WHERE id = ?`).bind(conversationId).first<ConversationState>();
        if (!state) throw new Error('Conversation not found');
        if (state.is_active !== 1) throw new Error('Conversation has ended');

        const response = await this.db.prepare(`SELECT * FROM dialogue_responses WHERE id = ?`).bind(responseId).first<DialogueResponse>();
        if (!response) throw new Error('Response not found');
        if (response.node_id !== state.current_node_id) throw new Error('Response does not belong to current node');

        // Determine Next Node
        let nextNodeId: string | null = null;
        if (response.is_skill_check === 1 && skillCheckResult) {
            nextNodeId = skillCheckResult === 'success' ? response.success_node_id : response.failure_node_id;
        } else {
            nextNodeId = response.leads_to_node_id;
        }

        // Apply effects (simplified - logic for flags/items would go here)
        // For now, we just track history
        const responsesChosen = JSON.parse(state.responses_chosen || '[]');
        responsesChosen.push({
            responseId,
            timestamp: new Date().toISOString(),
            skillCheckResult
        });

        const nodesVisited = JSON.parse(state.nodes_visited || '[]');
        if (nextNodeId) nodesVisited.push(nextNodeId);

        // Update State
        const isActive = response.ends_conversation === 1 || !nextNodeId ? 0 : 1;
        const endedAt = isActive ? null : new Date().toISOString();

        await this.db.prepare(`
            UPDATE conversation_states
            SET current_node_id = ?, 
                responses_chosen = ?, 
                nodes_visited = ?, 
                is_active = ?, 
                ended_at = ?
            WHERE id = ?
        `).bind(
            nextNodeId || state.current_node_id, // Keep current if ending
            JSON.stringify(responsesChosen),
            JSON.stringify(nodesVisited),
            isActive,
            endedAt,
            conversationId
        ).run();

        // If ending, log to history
        if (!isActive) {
            await this.archiveConversation(state, response, responsesChosen, nodesVisited);
        }

        // Get Next Node Data
        let nextNode = null;
        let availableResponses: FormattedDialogueResponse[] = [];

        if (nextNodeId && isActive) {
            nextNode = await this.db.prepare(`SELECT * FROM dialogue_nodes WHERE id = ?`).bind(nextNodeId).first<DialogueNode>();
            if (nextNode) {
                availableResponses = await this.getResponsesForNode(nextNodeId);
            }
        }

        return {
            success: true,
            nextNode: nextNode ? this.formatDialogueNode(nextNode) : null,
            availableResponses,
            conversationEnded: !isActive
        };
    }

    /**
     * Exit conversation early.
     */
    async exitConversation(conversationId: string) {
        const state = await this.db.prepare(`SELECT * FROM conversation_states WHERE id = ?`).bind(conversationId).first<ConversationState>();
        if (!state) throw new Error('Conversation not found');

        if (state.is_active === 1) {
            await this.db.prepare(`
                UPDATE conversation_states SET is_active = 0, ended_at = ? WHERE id = ?
            `).bind(new Date().toISOString(), conversationId).run();

            // Archive as ABANDONED
            // this.archiveConversation(...)
        }

        return { exitedEarly: true };
    }


    /**
     * Get character dialogue history.
     */
    async getHistory(characterId: string, treeId?: string) {
        let sql = `SELECT * FROM dialogue_history WHERE character_id = ?`;
        const params: unknown[] = [characterId];

        if (treeId) {
            sql += ` AND tree_id = ?`;
            params.push(treeId);
        }

        sql += ` ORDER BY completed_at DESC`;

        const result = await this.db.prepare(sql).bind(...params).all<ConversationHistory>();

        return {
            conversations: result.results.map(h => ({
                ...h,
                nodesVisited: JSON.parse(h.nodes_visited),
                responsesChosen: JSON.parse(h.responses_chosen),
                flagsChanged: JSON.parse(h.flags_changed),
                reputationChanges: JSON.parse(h.reputation_changes),
            }))
        };
    }

    /**
     * Get character dialogue flags.
     */
    async getFlags(characterId: string) {
        const flags = await this.db.prepare(`
            SELECT * FROM character_dialogue_flags WHERE character_id = ?
        `).bind(characterId).all<CharacterDialogueFlag>();

        const formattedFlags = flags.results.reduce((acc, flag) => {
            acc[flag.flag_name] = JSON.parse(flag.flag_value);
            return acc;
        }, {} as Record<string, any>);

        return {
            flags: formattedFlags,
            flagCount: flags.results.length
        };
    }

    // --- Helpers ---

    private async getResponsesForNode(nodeId: string) {
        const result = await this.db.prepare(`
            SELECT * FROM dialogue_responses WHERE node_id = ? ORDER BY display_order ASC
        `).bind(nodeId).all<DialogueResponse>();
        return result.results.map(this.formatDialogueResponse);
    }

    private async archiveConversation(state: ConversationState, lastResponse: DialogueResponse, responses: any[], nodes: any[]) {
        const historyId = `hist-${Date.now()}-${crypto.randomUUID()}`;
        await this.db.prepare(`
            INSERT INTO dialogue_history (
                id, character_id, tree_id, started_at, completed_at, outcome,
                nodes_visited, responses_chosen, flags_changed, reputation_changes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            historyId,
            state.character_id,
            state.tree_id,
            state.started_at,
            new Date().toISOString(),
            'COMPLETED',
            JSON.stringify(nodes),
            JSON.stringify(responses),
            lastResponse.flag_changes || JSON.stringify([]),
            lastResponse.reputation_changes || JSON.stringify([])
        ).run();
    }

    // --- Formatters (copied from API) ---

    private formatDialogueTree(tree: DialogueTree): FormattedDialogueTree {
        return {
            id: tree.id,
            code: tree.code,
            name: tree.name,
            description: tree.description,
            context: {
                npcId: tree.npc_id,
                locationId: tree.location_id,
                missionId: tree.mission_id,
                arcId: tree.arc_id,
            },
            structure: {
                rootNodeId: tree.root_node_id,
                greetingNodeId: tree.greeting_node_id,
                farewellNodeId: tree.farewell_node_id,
            },
            availability: {
                conditions: tree.availability_conditions ? JSON.parse(tree.availability_conditions) : null,
                oneTimeOnly: tree.one_time_only === 1,
                cooldownHours: tree.cooldown_hours,
            },
            behavior: {
                tracksCompletion: tree.tracks_completion === 1,
                marksNpcExhausted: tree.marks_npc_exhausted === 1,
            },
            audio: {
                ambientAudioId: tree.ambient_audio_id,
                musicId: tree.music_id,
            },
            meta: {
                estimatedDurationMinutes: tree.estimated_duration_minutes,
                hasSkillChecks: tree.has_skill_checks === 1,
                hasReputationGates: tree.has_reputation_gates === 1,
                hasRomanceContent: tree.has_romance_content === 1,
            },
        };
    }

    private formatDialogueNode(node: DialogueNode): FormattedDialogueNode {
        return {
            id: node.id,
            treeId: node.tree_id,
            nodeType: node.node_type,
            speaker: {
                type: node.speaker_type,
                npcId: node.speaker_npc_id,
                nameOverride: node.speaker_name_override,
            },
            content: {
                text: node.text,
                textVariations: node.text_variations ? JSON.parse(node.text_variations) : [],
                voiceClipId: node.voice_clip_id,
                voiceEmotion: node.voice_emotion,
            },
            display: {
                portraitExpression: node.portrait_expression,
                animationId: node.animation_id,
                cameraAngle: node.camera_angle,
            },
            flow: {
                nextNodeId: node.next_node_id,
                autoAdvance: node.auto_advance === 1,
                advanceDelaySeconds: node.advance_delay_seconds,
                isHub: node.is_hub === 1,
                isExit: node.is_exit === 1,
            },
            conditions: {
                display: node.display_conditions ? JSON.parse(node.display_conditions) : null,
                skip: node.skip_conditions ? JSON.parse(node.skip_conditions) : null,
            },
            effects: {
                onDisplay: node.on_display_effects ? JSON.parse(node.on_display_effects) : null,
                flagChanges: node.flag_changes ? JSON.parse(node.flag_changes) : null,
                relationshipChanges: node.relationship_changes ? JSON.parse(node.relationship_changes) : null,
            },
        };
    }

    private formatDialogueResponse(response: DialogueResponse): FormattedDialogueResponse {
        return {
            id: response.id,
            nodeId: response.node_id,
            displayOrder: response.display_order,
            text: {
                full: response.text,
                short: response.text_short,
                tooltip: response.text_tooltip,
            },
            style: {
                tone: response.tone,
                isAggressive: response.is_aggressive === 1,
                isFlirtatious: response.is_flirtatious === 1,
                isHumorous: response.is_humorous === 1,
                isHonest: response.is_honest === 1,
            },
            conditions: {
                display: response.display_conditions ? JSON.parse(response.display_conditions) : null,
                greyed: response.greyed_conditions ? JSON.parse(response.greyed_conditions) : null,
                lockedReasonText: response.locked_reason_text,
            },
            requirements: {
                skill: response.required_skill,
                skillLevel: response.required_skill_level,
                attribute: response.required_attribute,
                attributeLevel: response.required_attribute_level,
                item: response.required_item,
                credits: response.required_credits,
                reputation: response.required_reputation ? JSON.parse(response.required_reputation) : null,
                flags: response.required_flags ? JSON.parse(response.required_flags) : null,
            },
            skillCheck: response.is_skill_check === 1 ? {
                skill: response.skill_check_skill,
                difficulty: response.skill_check_difficulty,
                hidden: response.skill_check_hidden === 1,
                successNodeId: response.success_node_id,
                failureNodeId: response.failure_node_id,
            } : null,
            destination: {
                leadsToNodeId: response.leads_to_node_id,
                endsConversation: response.ends_conversation === 1,
                startsCombat: response.starts_combat === 1,
                triggersEventId: response.triggers_event_id,
            },
            effects: {
                relationshipChange: response.relationship_change,
                reputationChanges: response.reputation_changes ? JSON.parse(response.reputation_changes) : null,
                flagChanges: response.flag_changes ? JSON.parse(response.flag_changes) : null,
                grantsItems: response.grants_items ? JSON.parse(response.grants_items) : null,
                removesItems: response.removes_items ? JSON.parse(response.removes_items) : null,
                grantsXp: response.grants_xp,
                grantsCredits: response.grants_credits,
            },
            special: {
                isLie: response.is_lie === 1,
                lieConsequences: response.lie_consequences ? JSON.parse(response.lie_consequences) : null,
                isBribe: response.is_bribe === 1,
                bribeAmount: response.bribe_amount,
                isIntimidation: response.is_intimidation === 1,
                isSeduction: response.is_seduction === 1,
                hasVoiceLine: response.has_voice_line === 1,
            },
        };
    }
}
