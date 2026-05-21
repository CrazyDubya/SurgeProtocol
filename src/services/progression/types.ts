/**
 * Progression Service Types
 *
 * Database row types and formatted response types for the progression system.
 */

// =============================================================================
// DATABASE ROW TYPES
// =============================================================================

export interface TrackRow {
    id: string;
    code: string;
    name: string;
    tagline: string | null;
    description: string | null;
    lore_description: string | null;
    unlocked_at_tier: number;
    prerequisite_attributes: string | null;
    prerequisite_missions: string | null;
    primary_attribute: string | null;
    secondary_attribute: string | null;
    resource_pool_type: string | null;
    signature_mechanic_description: string | null;
    natural_ally_tracks: string | null;
    difficult_cross_tracks: string | null;
    difficulty_rating: number | null;
    playstyle_tags: string | null;
    recommended_for_new_players: number;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface SpecializationRow {
    id: string;
    track_id: string;
    code: string;
    name: string;
    tagline: string | null;
    description: string | null;
    lore_description: string | null;
    unlocked_at_tier: number;
    prerequisite_abilities: string | null;
    prerequisite_augments: string | null;
    prerequisite_missions: string | null;
    signature_ability_id: string | null;
    signature_passive_id: string | null;
    combat_focus: number;
    stealth_focus: number;
    social_focus: number;
    technical_focus: number;
    mobility_focus: number;
    difficulty_rating: number | null;
    synergy_specs: string | null;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface TierDefinitionRow {
    id: string;
    tier_number: number;
    name: string;
    subtitle: string | null;
    description: string | null;
    min_rating: number;
    min_deliveries: number;
    min_playtime_hours: number;
    required_augments: number;
    corporate_title: string | null;
    street_title: string | null;
    algorithm_relationship: string | null;
    base_pay_multiplier: number;
    mission_access_level: number;
    location_access_level: number;
    augment_access_level: number;
    black_market_access: number;
    interstitial_access: number;
    health_insurance_tier: number;
    housing_subsidy_level: number;
    corporate_support_level: number;
    algorithm_consultation: number;
    triggers_convergence_choice: number;
    ascension_eligible: number;
    rogue_path_available: number;
    display_color: string | null;
    created_at: string;
    updated_at: string;
}

export interface CharacterExperienceRow {
    id: string;
    character_id: string;
    total_xp_earned: number;
    total_xp_spent: number;
    available_xp: number;
    combat_xp: number;
    delivery_xp: number;
    social_xp: number;
    technical_xp: number;
    exploration_xp: number;
    story_xp: number;
    attribute_points_available: number;
    skill_points_available: number;
    ability_points_available: number;
    augment_slots_available: number;
    algorithm_favor: number;
    street_cred: number;
    network_tokens: number;
    humanity_anchors: number;
    created_at: string;
    updated_at: string;
}

export interface RatingComponentRow {
    id: string;
    code: string;
    name: string;
    description: string | null;
    weight: number;
    min_value: number;
    max_value: number;
    decay_rate_per_day: number;
    is_public: number;
    affects_tier: number;
    created_at: string;
    updated_at: string;
}

export interface CrossTrainingProgressRow {
    id: string;
    character_id: string;
    source_track_id: string;
    target_track_id: string;
    xp_invested: number;
    xp_required: number;
    current_effectiveness: number;
    max_effectiveness: number;
    abilities_unlocked: string | null;
    passives_unlocked: string | null;
    blocked_abilities: string | null;
    requires_augment_compatibility: number;
    created_at: string;
    updated_at: string;
}

export interface CharacterProgressionRow {
    id: string;
    current_tier: number;
    tier_progress: number;
    track_id: string | null;
    specialization_id: string | null;
    carrier_rating: number;
}

// =============================================================================
// XP CATEGORIES
// =============================================================================

export type XPCategory = 'combat' | 'delivery' | 'social' | 'technical' | 'exploration' | 'story';
export type AdvancementType = 'attribute' | 'skill' | 'ability' | 'augment_slots';
