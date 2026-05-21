import {
    CharacterService,
    ErrorCodes,
} from '../base/index';
import type {
    ServiceContext,
    ServiceResponse,
} from '../base/index';
import type {
    ActiveQuest,
    QuestDefinition,
    QuestObjective,
    QuestStatus,
} from './types';

interface QuestAcceptResult {
    questId: string;
    status: QuestStatus;
    activeObjectives: string[];
}

interface ObjectiveUpdateResult {
    questStatus: QuestStatus;
    newObjectives: string[];
    rewards?: {
        xp: number;
        credits: number;
    };
    justCompleted: boolean;
}

export class QuestService extends CharacterService {
    constructor(context: ServiceContext) {
        super(context);
    }

    /**
     * Accept a quest.
     */
    async acceptQuest(questIdOrCode: string): Promise<ServiceResponse<QuestAcceptResult>> {
        const character = await this.getCharacter();

        // 1. Get Quest Definition
        const quest = await this.query<QuestDefinition>(
            'SELECT * FROM quest_definitions WHERE id = ? OR code = ?',
            questIdOrCode, questIdOrCode
        );

        if (!quest) {
            return this.error(ErrorCodes.NOT_FOUND, 'Quest not found');
        }

        // 2. Check Prerequisites
        if (character.tier < quest.required_tier) {
            return this.error(ErrorCodes.TIER_REQUIREMENT, `Requires Tier ${quest.required_tier}`);
        }

        if (quest.required_quests) {
            const prereqs: string[] = JSON.parse(quest.required_quests || '[]');
            for (const prereq of prereqs) {
                const completed = await this.query<{ id: string }>(
                    `SELECT cq.id FROM character_quests cq
                     JOIN quest_definitions qd ON cq.quest_definition_id = qd.id
                     WHERE cq.character_id = ? AND (qd.id = ? OR qd.code = ?) AND cq.status = 'COMPLETED'`,
                    this.requiredCharacterId, prereq, prereq
                );
                if (!completed) {
                    return this.error(ErrorCodes.PREREQUISITE_NOT_MET, `Missing prerequisite quest: ${prereq}`);
                }
            }
        }

        // Already Active?
        const existing = await this.query<{ status: string }>(
            'SELECT status FROM character_quests WHERE character_id = ? AND quest_definition_id = ?',
            this.requiredCharacterId, quest.id
        );

        if (existing) {
            if (['ACCEPTED', 'IN_PROGRESS'].includes(existing.status)) {
                return this.error(ErrorCodes.QUEST_ALREADY_ACTIVE, 'Quest already active');
            }
        }

        // 3. Get Initial Objectives (Sequence 0)
        const objectives = await this.queryAll<QuestObjective>(
            'SELECT * FROM quest_objectives WHERE quest_definition_id = ? AND sequence_order = 0',
            quest.id
        );

        const initialObjectives = objectives.map(o => o.id);
        const currentObjectivesMap: Record<string, number> = {};
        initialObjectives.forEach(id => { currentObjectivesMap[id] = 0; });

        // 4. Create Active Quest
        const activeId = crypto.randomUUID();
        const now = new Date().toISOString();

        await this.execute(`
            INSERT INTO character_quests (
                id, character_id, quest_definition_id, status,
                current_stage, current_objectives,
                objectives_completed, objectives_failed,
                accepted_at, updated_at
            ) VALUES (?, ?, ?, 'ACCEPTED', 0, ?, '[]', '[]', ?, ?)
        `,
            activeId, this.requiredCharacterId, quest.id,
            JSON.stringify(currentObjectivesMap),
            now, now
        );

        return this.success({
            questId: activeId,
            status: 'ACCEPTED',
            activeObjectives: initialObjectives
        });
    }

    /**
     * Update Objective Progress.
     * Supports branching: when an objective is completed, if it has `leads_to_objectives`,
     * those objectives are activated next. Otherwise, falls back to sequential (next sequence_order).
     */
    async updateObjective(objectiveId: string, progressToAdd: number = 1): Promise<ServiceResponse<ObjectiveUpdateResult>> {
        // 1. Get Objective
        const objective = await this.query<QuestObjective>(
            'SELECT * FROM quest_objectives WHERE id = ?',
            objectiveId
        );
        if (!objective) return this.error(ErrorCodes.NOT_FOUND, 'Objective not found');

        // 2. Get Active Quest
        const activeQuest = await this.query<ActiveQuest>(
            `SELECT * FROM character_quests
             WHERE character_id = ? AND quest_definition_id = ? AND status IN ('ACCEPTED', 'IN_PROGRESS')`,
            this.requiredCharacterId, objective.quest_definition_id
        );

        if (!activeQuest) return this.error(ErrorCodes.NOT_FOUND, 'No active quest for this objective');

        // 3. Check if Objective is Active
        const currentObjectives: Record<string, number> = JSON.parse(activeQuest.current_objectives || '{}');

        if (currentObjectives[objectiveId] === undefined) {
            return this.error(ErrorCodes.VALIDATION_ERROR, 'Objective not currently active');
        }

        const completedObjectives: string[] = JSON.parse(activeQuest.objectives_completed || '[]');
        if (completedObjectives.includes(objectiveId)) {
            return this.error(ErrorCodes.VALIDATION_ERROR, 'Objective already completed');
        }

        // 4. Update Progress
        const oldVal = currentObjectives[objectiveId];
        const newVal = Math.min(oldVal + progressToAdd, objective.target_count);
        currentObjectives[objectiveId] = newVal;

        const justCompleted = newVal >= objective.target_count;
        let rewards: { xp: number; credits: number } | undefined;

        if (justCompleted) {
            completedObjectives.push(objectiveId);

            // Grant per-objective rewards
            if (objective.completion_xp > 0 || objective.completion_creds > 0) {
                rewards = { xp: objective.completion_xp, credits: objective.completion_creds };

                if (objective.completion_xp > 0) {
                    await this.execute(
                        'UPDATE characters SET current_xp = current_xp + ? WHERE id = ?',
                        objective.completion_xp, this.requiredCharacterId
                    );
                }
                if (objective.completion_creds > 0) {
                    await this.execute(
                        'UPDATE character_finances SET primary_currency_balance = primary_currency_balance + ? WHERE character_id = ?',
                        objective.completion_creds, this.requiredCharacterId
                    );
                }
            }

            // 5. Branching: Activate Next Objectives
            let nextIds: string[] = [];

            if (objective.leads_to_objectives) {
                // Explicit branching: follow leads_to
                nextIds = JSON.parse(objective.leads_to_objectives || '[]');
            } else {
                // Linear fallback: check if all objectives at current sequence are done,
                // then activate next sequence.
                const sameSeqObjectives = await this.queryAll<QuestObjective>(
                    'SELECT id FROM quest_objectives WHERE quest_definition_id = ? AND sequence_order = ?',
                    objective.quest_definition_id, objective.sequence_order
                );

                const allSameSeqDone = sameSeqObjectives.every(o => completedObjectives.includes(o.id));

                if (allSameSeqDone) {
                    const nextSeqObjectives = await this.queryAll<QuestObjective>(
                        'SELECT id FROM quest_objectives WHERE quest_definition_id = ? AND sequence_order = ? + 1',
                        objective.quest_definition_id, objective.sequence_order
                    );
                    nextIds = nextSeqObjectives.map(o => o.id);
                }
            }

            for (const nextId of nextIds) {
                if (!completedObjectives.includes(nextId) && currentObjectives[nextId] === undefined) {
                    currentObjectives[nextId] = 0;
                }
            }
        }

        // 6. Update DB
        const newStatus = activeQuest.status === 'ACCEPTED' ? 'IN_PROGRESS' : activeQuest.status;

        await this.execute(`
            UPDATE character_quests
            SET current_objectives = ?, objectives_completed = ?, status = ?, updated_at = ?
            WHERE id = ?
        `,
            JSON.stringify(currentObjectives),
            JSON.stringify(completedObjectives),
            newStatus,
            new Date().toISOString(),
            activeQuest.id
        );

        return this.success({
            questStatus: newStatus as QuestStatus,
            newObjectives: Object.keys(currentObjectives),
            justCompleted,
            rewards
        });
    }

    /**
     * Complete a quest and grant final rewards.
     */
    async completeQuest(questId: string): Promise<ServiceResponse<{
        questStatus: QuestStatus;
        rewards: {
            xp: number;
            credits: number;
            items: Array<{ itemId: string; quantity: number }>;
            reputation: Array<{ factionId: string; change: number }>;
        };
    }>> {
        // 1. Get Active Quest
        const activeQuest = await this.query<ActiveQuest>(
            `SELECT * FROM character_quests
             WHERE character_id = ? AND (id = ? OR quest_definition_id = ?)
             AND status IN ('ACCEPTED', 'IN_PROGRESS')`,
            this.requiredCharacterId, questId, questId
        );

        if (!activeQuest) return this.error(ErrorCodes.NOT_FOUND, 'Active quest not found');

        // 2. Get Definition
        const quest = await this.query<QuestDefinition>(
            'SELECT * FROM quest_definitions WHERE id = ?',
            activeQuest.quest_definition_id
        );
        if (!quest) return this.error(ErrorCodes.NOT_FOUND, 'Quest definition not found');

        // 3. Verify All Required Objectives Complete
        const objectives = await this.queryAll<QuestObjective>(
            'SELECT * FROM quest_objectives WHERE quest_definition_id = ?',
            quest.id
        );

        const completedObjectives: string[] = JSON.parse(activeQuest.objectives_completed || '[]');
        const required = objectives.filter(o => !o.is_optional);
        const incomplete = required.filter(o => !completedObjectives.includes(o.id));

        if (incomplete.length > 0) {
            return this.error(
                ErrorCodes.OBJECTIVES_INCOMPLETE,
                `Incomplete objectives: ${incomplete.map(i => i.title).join(', ')}`
            );
        }

        // 4. Grant Rewards
        const rewards = {
            xp: quest.xp_reward,
            credits: quest.credit_reward,
            items: [] as Array<{ itemId: string; quantity: number }>,
            reputation: [] as Array<{ factionId: string; change: number }>,
        };

        if (rewards.xp > 0) {
            await this.execute(
                'UPDATE characters SET current_xp = current_xp + ? WHERE id = ?',
                rewards.xp, this.requiredCharacterId
            );
        }
        if (rewards.credits > 0) {
            await this.execute(
                'UPDATE character_finances SET primary_currency_balance = primary_currency_balance + ? WHERE character_id = ?',
                rewards.credits, this.requiredCharacterId
            );
        }

        // 4a. Grant Item Rewards
        if (quest.item_rewards) {
            const itemRewards = JSON.parse(quest.item_rewards) as Array<{ itemId: string; quantity: number }>;
            for (const item of itemRewards) {
                const existing = await this.query<{ id: string; quantity: number }>(
                    'SELECT id, quantity FROM character_inventory WHERE character_id = ? AND item_id = ?',
                    this.requiredCharacterId, item.itemId
                );

                if (existing) {
                    await this.execute(
                        'UPDATE character_inventory SET quantity = quantity + ? WHERE id = ?',
                        item.quantity, existing.id
                    );
                } else {
                    await this.execute(
                        `INSERT INTO character_inventory (id, character_id, item_id, quantity, created_at)
                         VALUES (?, ?, ?, ?, datetime('now'))`,
                        crypto.randomUUID(), this.requiredCharacterId, item.itemId, item.quantity
                    );
                }

                rewards.items.push({ itemId: item.itemId, quantity: item.quantity });
            }
        }

        // 4b. Grant Reputation Rewards
        if (quest.reputation_rewards) {
            const repRewards = JSON.parse(quest.reputation_rewards) as Array<{ factionId: string; amount: number }>;
            for (const rep of repRewards) {
                await this.execute(
                    `INSERT INTO character_faction_standing (id, character_id, faction_id, reputation)
                     VALUES (?, ?, ?, ?)
                     ON CONFLICT(character_id, faction_id) DO UPDATE SET reputation = reputation + ?`,
                    crypto.randomUUID(), this.requiredCharacterId, rep.factionId, rep.amount, rep.amount
                );

                rewards.reputation.push({ factionId: rep.factionId, change: rep.amount });
            }
        }

        // 5. Update Status
        const now = new Date().toISOString();
        await this.execute(`
            UPDATE character_quests
            SET status = 'COMPLETED', updated_at = ?, completed_at = ?,
                rewards_claimed = 1, rewards_received = ?
            WHERE id = ?
        `, now, now, JSON.stringify(rewards), activeQuest.id);

        return this.success({
            questStatus: 'COMPLETED',
            rewards
        });
    }
}
