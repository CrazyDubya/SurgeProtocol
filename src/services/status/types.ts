export type ConditionType = 'BUFF' | 'DEBUFF' | 'INJURY' | 'DISEASE' | 'PSYCHOSIS' | 'ENVIRONMENTAL';
export type ConditionSeverity = 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
export type AddictionStage = 'RECREATIONAL' | 'HABITUAL' | 'DEPENDENT' | 'ACUTE';

export interface ConditionEffect {
    type: 'STAT_MOD' | 'SKILL_MOD' | 'DAMAGE_OVER_TIME' | 'HEAL_OVER_TIME' | 'RESTRICT_ACTION';
    target: string; // attribute name, skill name, or action type
    value: number;
    intervalSeconds?: number; // for DOT/HOT
}

export interface CharacterCondition {
    id: string;
    character_id: string;
    type: ConditionType;
    name: string;
    description: string | null;
    icon_asset: string | null;
    severity: ConditionSeverity;
    value: number;
    duration_seconds: number | null;
    expires_at: string | null;
    effects_data: string; // JSON string of ConditionEffect[]
    source_type: string | null;
    source_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface FormattedCondition extends Omit<CharacterCondition, 'effects_data'> {
    effects: ConditionEffect[];
    timeLeftSeconds: number | null;
}

export interface CharacterAddiction {
    id: string;
    character_id: string;
    substance_id: string;
    stage: AddictionStage;
    severity_level: number;
    usage_count: number;
    last_consumed_at: string | null;
    withdrawal_onset_at: string | null;
    is_in_withdrawal: number; // 0 or 1
    created_at: string;
    updated_at: string;
}

export interface FormattedAddiction extends CharacterAddiction {
    is_in_withdrawal: any; // boolean in API response
}
