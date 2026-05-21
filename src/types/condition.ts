
export type ConditionOperator = 'EQ' | 'NEQ' | 'GT' | 'LT' | 'GTE' | 'LTE' | 'CONTAINS';

export interface Condition {
    type: string; // e.g. 'TIER', 'ITEM', 'QUEST_COMPLETE'
    target?: string;
    value?: string | number | boolean;
    operator?: ConditionOperator;
    invert?: boolean;
}
