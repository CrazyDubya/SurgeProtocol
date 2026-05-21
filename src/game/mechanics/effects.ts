/**
 * Surge Protocol - Combat Effects System
 * 
 * Logic for applying healing, buffs, and debuffs to combatants.
 */

import { type Combatant } from './combat';

export type EffectType = 'HEAL' | 'BUFF_STAT' | 'DEBUFF_STAT' | 'CONDITION';

export interface CombatEffect {
    type: EffectType;
    value: number;
    stat?: string;
    conditionId?: string;
    duration?: number; // In rounds, 0/undefined for instant/permanent
}

/**
 * Result of applying an effect
 */
export interface EffectResult {
    success: boolean;
    narrative: string;
    hpChanged?: number;
    conditionsAdded?: string[];
    statsChanged?: Record<string, number>;
}

/**
 * Applies a combat effect to a combatant.
 * 
 * @param target - The combatant to receive the effect
 * @param effect - The effect to apply
 * @returns Result details for logging and UI
 */
export function applyEffect(target: Combatant, effect: CombatEffect): { updatedTarget: Combatant; result: EffectResult } {
    let updatedTarget = { ...target };
    let result: EffectResult = { success: true, narrative: '' };

    switch (effect.type) {
        case 'HEAL': {
            const oldHp = target.hp;
            updatedTarget.hp = Math.min(target.hpMax, target.hp + effect.value);
            const diff = updatedTarget.hp - oldHp;
            result.hpChanged = diff;
            result.narrative = `${target.name} heals for ${diff} HP.`;
            break;
        }

        case 'BUFF_STAT': {
            // For now, simpler implementation: just log it. 
            // In a full impl, this would add to a 'modifiers' array in Combatant
            result.narrative = `${target.name}'s ${effect.stat} increased!`;
            break;
        }

        case 'CONDITION': {
            if (effect.conditionId && !updatedTarget.conditions.includes(effect.conditionId)) {
                updatedTarget.conditions = [...updatedTarget.conditions, effect.conditionId];
                result.conditionsAdded = [effect.conditionId];
                result.narrative = `${target.name} gained condition: ${effect.conditionId}.`;
            } else {
                result.success = false;
                result.narrative = `${target.name} already has this condition.`;
            }
            break;
        }

        default:
            result.success = false;
            result.narrative = 'Unknown effect type';
    }

    return { updatedTarget, result };
}

/**
 * Define common items and their effects
 */
export const CONSUMABLE_EFFECTS: Record<string, CombatEffect> = {
    'STIM_HEALTH': { type: 'HEAL', value: 25 },
    'STIM_VELOCITY': { type: 'CONDITION', conditionId: 'BOOSTED', value: 0, duration: 2 },
    'STIM_ENDURANCE': { type: 'HEAL', value: 15 },
    'HEALING_STIM': { type: 'HEAL', value: 20 }, // Alias for convenience
};

/**
 * Define common abilities and their effects
 */
export const ABILITY_EFFECTS: Record<string, CombatEffect> = {
    'RECON_SCAN': { type: 'CONDITION', conditionId: 'REVEALED', value: 0, duration: 3 },
    'ADRENALINE_SURGE': { type: 'HEAL', value: 10 },
    'MED_PATCH': { type: 'HEAL', value: 40 },
};
