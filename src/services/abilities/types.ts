export interface AbilityDefinition {
    id: string;
    code: string;
    name: string;
    description: string | null;
    detailed_description: string | null;
    flavor_text: string | null;
    ability_type: string;
    category: string;
    is_signature: number;
    is_ultimate: number;
    source_type: string | null;
    source_track_id: string | null;
    source_specialization_id: string | null;
    source_augment_id: string | null;
    source_item_id: string | null;
    required_tier: number;
    required_level: number | null;
    prerequisite_abilities: string | null;
    required_attributes: string | null;
    required_skills: string | null;
    resource_cost: string | null;
    cooldown_seconds: number | null;
    charges: number | null;
    charge_recovery: string | null;
    humanity_cost: number | null;
    activation_type: string | null;
    activation_time: string | null;
    range: string | null;
    area_of_effect: string | null;
    duration: string | null;
    concentration_required: number;
    primary_effect: string | null;
    secondary_effects: string | null;
    scaling: string | null;
    synergies: string | null;
    has_ranks: number;
    max_rank: number | null;
    rank_effects: string | null;
    upgrade_cost: string | null;
    created_at: string;
    updated_at: string;
}

export interface CharacterAbility {
    id: string;
    character_id: string;
    ability_id: string;
    acquired_at: string;
    is_unlocked: number;
    is_equipped: number;
    current_rank: number;
    current_charges: number | null;
    cooldown_remaining: number | null;
    is_on_cooldown: number;
    custom_name: string | null;
    modifier_augments: string | null;
    modifier_items: string | null;
    effectiveness_multiplier: number;
    times_used: number;
    successful_uses: number;
    damage_dealt_total: number;
    targets_affected_total: number;
    last_used: string | null;
    xp_invested: number;
    xp_to_next_rank: number | null;
    created_at: string;
    updated_at: string;
}

export interface PassiveDefinition {
    id: string;
    code: string;
    name: string;
    description: string | null;
    source_type: string | null;
    source_id: string | null;
    required_tier: number;
    prerequisite_passives: string | null;
    required_condition: string | null;
    effect_type: string | null;
    effect_target: string | null;
    effect_value: number | null;
    effect_is_percentage: number;
    stacks: number;
    max_stacks: number | null;
    trigger_condition: string | null;
    trigger_chance: number | null;
    internal_cooldown: number | null;
    is_hidden: number;
    conflicts_with: string | null;
    synergizes_with: string | null;
    created_at: string;
    updated_at: string;
}

export interface SkillDefinition {
    id: string;
    code: string;
    name: string;
    description: string | null;
    governing_attribute_id: string | null;
    category: string;
    max_level: number;
    xp_per_level: string | null;
    training_available: number;
    requires_teacher: number;
    prerequisite_skills: string | null;
    required_tier: number;
    required_track: string | null;
    check_difficulty_base: number | null;
    critical_success_threshold: number | null;
    critical_failure_threshold: number | null;
    can_assist: number;
    can_retry: number;
    retry_penalty: number | null;
    has_specializations: number;
    specialization_definitions: string | null;
    created_at: string;
    updated_at: string;
}

export interface CharacterSkill {
    id: string;
    character_id: string;
    skill_id: string;
    current_level: number;
    current_xp: number;
    xp_to_next_level: number | null;
    bonus_from_augments: number;
    bonus_from_items: number;
    temporary_bonus: number;
    temporary_penalty: number;
    times_used: number;
    successes: number;
    failures: number;
    critical_successes: number;
    critical_failures: number;
    last_used: string | null;
    specializations_unlocked: string | null;
    specialization_levels: string | null;
    created_at: string;
    updated_at: string;
}

export interface AbilityFilters {
    category?: string;
    type?: string;
    sourceType?: string;
    tier?: number;
    isSignature?: boolean;
    isUltimate?: boolean;
}

export interface SkillFilters {
    category?: string;
    attributeId?: string;
}

export interface PassiveFilters {
    sourceType?: string;
    effectType?: string;
    includeHidden?: boolean;
}
