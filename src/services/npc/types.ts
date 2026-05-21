/**
 * NPC Service Types
 *
 * Database row types for NPC definitions and instances.
 */

export interface NpcDefinitionRow {
    id: string;
    code: string;
    name: string;
    title: string | null;
    description: string | null;
    background: string | null;
    npc_type: string | null;
    npc_category: string | null;
    is_unique: number;
    is_essential: number;
    is_procedural: number;
    gender: string | null;
    age: number | null;
    ethnicity: string | null;
    height_cm: number | null;
    build: string | null;
    distinguishing_features: string | null;
    portrait_asset: string | null;
    personality_traits: string | null;
    speech_patterns: string | null;
    mannerisms: string | null;
    likes: string | null;
    dislikes: string | null;
    goals: string | null;
    faction_id: string | null;
    faction_rank: string | null;
    employer: string | null;
    occupation: string | null;
    home_location_id: string | null;
    work_location_id: string | null;
    hangout_locations: string | null;
    schedule: string | null;
    combat_capable: number;
    combat_style: string | null;
    threat_level: number;
    skills: string | null;
    abilities: string | null;
    augments: string | null;
    typical_equipment: string | null;
    is_vendor: number;
    vendor_inventory_id: string | null;
    is_quest_giver: number;
    available_quests: string | null;
    is_trainer: number;
    trainable_skills: string | null;
    greeting_dialogue_id: string | null;
    ambient_dialogue: string | null;
    story_importance: number;
    romance_option: number;
    killable_by_player: number;
    death_consequence: string | null;
    created_at: string;
    updated_at: string;
}

export interface NpcInstanceRow {
    id: string;
    npc_definition_id: string;
    save_id: string | null;
    is_alive: number;
    is_active: number;
    current_health: number | null;
    current_location_id: string | null;
    current_activity: string | null;
    relationship_with_player: number;
    trust_level: number;
    fear_level: number;
    respect_level: number;
    romantic_interest: number;
    times_met: number;
    last_interaction: string | null;
    dialogue_flags: string | null;
    topics_discussed: string | null;
    secrets_revealed: string | null;
    favors_owed: string | null;
    quests_given: string | null;
    quests_completed: string | null;
    memories_of_player: string | null;
    witnessed_events: string | null;
    grudges: string | null;
    gratitudes: string | null;
    created_at: string;
    updated_at: string;
}

// =============================================================================
// FILTER TYPES
// =============================================================================

export interface NpcListFilters {
    npcType?: string;
    category?: string;
    factionId?: string;
    isVendor?: boolean;
    isQuestGiver?: boolean;
    isTrainer?: boolean;
    combatCapable?: boolean;
    isUnique?: boolean;
    limit: number;
    offset: number;
}

export interface NpcInstanceFilters {
    saveId?: string;
    locationId?: string;
    isAlive?: boolean | null;
    minRelationship?: number;
}

export interface NpcInstanceUpdate {
    currentLocationId?: string;
    currentActivity?: string;
    currentHealth?: number;
    isAlive?: boolean;
    isActive?: boolean;
    relationshipChange?: number;
    trustChange?: number;
    fearChange?: number;
    respectChange?: number;
}

export interface NpcInteraction {
    interactionType: string;
    outcome?: 'positive' | 'negative' | 'neutral';
    topicDiscussed?: string;
    secretRevealed?: string;
    memory?: string;
    relationshipImpact?: number;
    trustImpact?: number;
    respectImpact?: number;
}
