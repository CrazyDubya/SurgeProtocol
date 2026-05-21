/**
 * Surge Protocol - Narrative Service Types
 *
 * Types for Dialogue Trees, Nodes, Responses, and Conversation State.
 * Matching DB schema and API requirements.
 */

// =============================================================================
// DATABASE MATCHING INTERFACES
// =============================================================================

export interface DialogueTree {
    id: string;
    code: string;
    name: string;
    description: string | null;
    npc_id: string | null;
    location_id: string | null;
    mission_id: string | null;
    arc_id: string | null;
    root_node_id: string | null;
    greeting_node_id: string | null;
    farewell_node_id: string | null;
    availability_conditions: string | null;
    one_time_only: number;
    cooldown_hours: number | null;
    tracks_completion: number;
    marks_npc_exhausted: number;
    ambient_audio_id: string | null;
    music_id: string | null;
    estimated_duration_minutes: number | null;
    has_skill_checks: number;
    has_reputation_gates: number;
    has_romance_content: number;
    created_at: string;
    updated_at: string;
}

export interface DialogueNode {
    id: string;
    tree_id: string;
    node_type: string;
    speaker_type: string | null;
    speaker_npc_id: string | null;
    speaker_name_override: string | null;
    text: string | null;
    text_variations: string | null;
    voice_clip_id: string | null;
    voice_emotion: string | null;
    portrait_expression: string | null;
    animation_id: string | null;
    camera_angle: string | null;
    next_node_id: string | null;
    responses: string | null;
    auto_advance: number;
    advance_delay_seconds: number | null;
    display_conditions: string | null;
    skip_conditions: string | null;
    on_display_effects: string | null;
    flag_changes: string | null;
    relationship_changes: string | null;
    is_hub: number;
    is_exit: number;
    debug_notes: string | null;
    localization_key: string | null;
}

export interface DialogueResponse {
    id: string;
    node_id: string;
    display_order: number;
    text: string;
    text_short: string | null;
    text_tooltip: string | null;
    tone: string | null;
    is_aggressive: number;
    is_flirtatious: number;
    is_humorous: number;
    is_honest: number;
    display_conditions: string | null;
    greyed_conditions: string | null;
    locked_reason_text: string | null;
    required_skill: string | null;
    required_skill_level: number | null;
    required_attribute: string | null;
    required_attribute_level: number | null;
    required_item: string | null;
    required_credits: number | null;
    required_reputation: string | null;
    required_flags: string | null;
    is_skill_check: number;
    skill_check_skill: string | null;
    skill_check_difficulty: number | null;
    skill_check_hidden: number;
    success_node_id: string | null;
    failure_node_id: string | null;
    leads_to_node_id: string | null;
    ends_conversation: number;
    starts_combat: number;
    triggers_event_id: string | null;
    relationship_change: number | null;
    reputation_changes: string | null;
    flag_changes: string | null;
    grants_items: string | null;
    removes_items: string | null;
    grants_xp: number | null;
    grants_credits: number | null;
    is_lie: number;
    lie_consequences: string | null;
    is_bribe: number;
    bribe_amount: number | null;
    is_intimidation: number;
    is_seduction: number;
    has_voice_line: number;
}

export interface ConversationState {
    id: string;
    character_id: string;
    tree_id: string;
    current_node_id: string;
    started_at: string;
    nodes_visited: string;
    responses_chosen: string;
    flags_set: string;
    effects_applied: string;
    is_active: number;
    ended_at: string | null;
}

export interface ConversationHistory {
    id: string;
    character_id: string;
    tree_id: string;
    started_at: string;
    completed_at: string | null;
    outcome: string | null;
    nodes_visited: string;
    responses_chosen: string;
    flags_changed: string;
    reputation_changes: string;
}

export interface CharacterDialogueFlag {
    id: string;
    character_id: string;
    flag_name: string;
    flag_value: string; // JSON
    source_tree_id: string | null;
    source_node_id: string | null;
    set_at: string;
}

// =============================================================================
// SERVICE / API RETURN TYPES
// =============================================================================

export interface FormattedDialogueTree {
    id: string;
    code: string;
    name: string;
    description: string | null;
    context: {
        npcId: string | null;
        locationId: string | null;
        missionId: string | null;
        arcId: string | null;
    };
    structure: {
        rootNodeId: string | null;
        greetingNodeId: string | null;
        farewellNodeId: string | null;
    };
    availability: {
        conditions: any;
        oneTimeOnly: boolean;
        cooldownHours: number | null;
    };
    behavior: {
        tracksCompletion: boolean;
        marksNpcExhausted: boolean;
    };
    audio: {
        ambientAudioId: string | null;
        musicId: string | null;
    };
    meta: {
        estimatedDurationMinutes: number | null;
        hasSkillChecks: boolean;
        hasReputationGates: boolean;
        hasRomanceContent: boolean;
    };
}

export interface FormattedDialogueNode {
    id: string;
    treeId: string;
    nodeType: string;
    speaker: {
        type: string | null;
        npcId: string | null;
        nameOverride: string | null;
    };
    content: {
        text: string | null;
        textVariations: any;
        voiceClipId: string | null;
        voiceEmotion: string | null;
    };
    display: {
        portraitExpression: string | null;
        animationId: string | null;
        cameraAngle: string | null;
    };
    flow: {
        nextNodeId: string | null;
        autoAdvance: boolean;
        advanceDelaySeconds: number | null;
        isHub: boolean;
        isExit: boolean;
    };
    conditions: {
        display: any;
        skip: any;
    };
    effects: {
        onDisplay: any;
        flagChanges: any;
        relationshipChanges: any;
    };
}

export interface FormattedDialogueResponse {
    id: string;
    nodeId: string;
    displayOrder: number;
    text: {
        full: string;
        short: string | null;
        tooltip: string | null;
    };
    style: {
        tone: string | null;
        isAggressive: boolean;
        isFlirtatious: boolean;
        isHumorous: boolean;
        isHonest: boolean;
    };
    conditions: {
        display: any;
        greyed: any;
        lockedReasonText: string | null;
    };
    requirements: {
        skill: string | null;
        skillLevel: number | null;
        attribute: string | null;
        attributeLevel: number | null;
        item: string | null;
        credits: number | null;
        reputation: any;
        flags: any;
    };
    skillCheck: {
        skill: string | null;
        difficulty: number | null;
        hidden: boolean;
        successNodeId: string | null;
        failureNodeId: string | null;
    } | null;
    destination: {
        leadsToNodeId: string | null;
        endsConversation: boolean;
        startsCombat: boolean;
        triggersEventId: string | null;
    };
    effects: {
        relationshipChange: number | null;
        reputationChanges: any;
        flagChanges: any;
        grantsItems: any;
        removesItems: any;
        grantsXp: number | null;
        grantsCredits: number | null;
    };
    special: {
        isLie: boolean;
        lieConsequences: any;
        isBribe: boolean;
        bribeAmount: number | null;
        isIntimidation: boolean;
        isSeduction: boolean;
        hasVoiceLine: boolean;
    };
}
