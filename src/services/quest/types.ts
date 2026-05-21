/**
 * Surge Protocol - Quest Service Types
 */

export type QuestStatus = 'AVAILABLE' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type ObjectiveStatus = 'PENDING' | 'active' | 'COMPLETED' | 'FAILED';

export interface QuestDefinition {
    id: string;
    code: string;
    name: string;
    description?: string;
    summary?: string;
    quest_type?: string;
    quest_category?: string;
    is_main_story: boolean;
    is_linear: number;
    priority: number;
    difficulty_rating: number;

    // Requirements
    required_tier: number;
    required_quests?: string; // JSON string
    required_reputation?: string; // JSON string
    prerequisite_quest_id?: string;

    // Quest Giver
    quest_giver_npc_id?: string;
    quest_giver_location_id?: string;

    // Narrative
    start_dialogue_id?: string;
    end_dialogue_id?: string;

    // Time limits
    has_time_limit: number;
    time_limit_hours?: number;

    // Rewards
    xp_reward: number;
    credit_reward: number;
    item_rewards?: string; // JSON string
    reputation_rewards?: string; // JSON string

    // Flags
    can_fail: number;
    is_hidden: number;
    repeatable: number;
}

export interface QuestObjective {
    id: string;
    quest_definition_id: string;
    sequence_order: number;

    title: string;
    description?: string;
    objective_type: string; // KILL, COLLECT, TALK, GOTO

    target_id?: string;
    target_count: number;

    is_optional: boolean;
    is_hidden: boolean;

    leads_to_objectives?: string; // JSON string of IDs

    // Reward fields (per-objective)
    completion_xp: number;
    completion_creds: number;
}

export interface ActiveQuest {
    id: string;
    character_id: string;
    quest_definition_id: string;
    status: QuestStatus;

    current_stage: number;
    current_objectives: string; // JSON: Record<string, number> mapping objective ID to progress

    objectives_completed: string; // JSON: string[]
    objectives_failed: string; // JSON: string[]

    accepted_at: string;
    updated_at: string;
    completed_at?: string;
}
