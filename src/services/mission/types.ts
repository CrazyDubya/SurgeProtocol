/**
 * Surge Protocol - Mission Service Types
 *
 * Shared types for mission action processing, vehicle integration,
 * and complication/objective data.
 */

// =============================================================================
// VEHICLE INTEGRATION
// =============================================================================

export interface ActiveVehicleInfo {
    id: string;
    custom_name: string | null;
    vehicle_class: string;
    cargo_capacity_kg: number;
    top_speed_kmh: number;
    handling_rating: number;
    current_fuel: number;
    fuel_capacity: number;
    current_hull_points: number;
    is_damaged: number;
    odometer_km: number;
    total_deliveries: number;
}

export interface VehicleValidationResult {
    valid: boolean;
    errors: Array<{ code: string; message: string }>;
}

// =============================================================================
// ACTION PROCESSING
// =============================================================================

export type MissionActionType =
    | 'MOVE'
    | 'INTERACT'
    | 'STEALTH'
    | 'COMBAT'
    | 'SKILL_CHECK'
    | 'DIALOGUE'
    | 'USE_ITEM'
    | 'WAIT';

export interface MissionActionInput {
    actionType: MissionActionType;
    targetId?: string;
    parameters?: Record<string, unknown>;
}

export interface MissionActionResult {
    success: boolean;
    outcome: string;
    details: Record<string, unknown>;
}

// =============================================================================
// DIALOGUE EFFECT
// =============================================================================

export interface DialogueEffect {
    type: string;
    target?: string;
    value?: number | string;
}

// =============================================================================
// COMPLICATION
// =============================================================================

export interface ComplicationDefinition {
    id: string;
    code: string;
    name: string;
    description: string | null;
    announcementText: string | null;
    complicationType: string;
    severity: number;
    isCombat: boolean;
    isTimed: boolean;
    triggerCondition: string | null;
    triggerChanceBase: number | null;
    triggerChanceModifiers: Record<string, unknown> | null;
    minTier: number | null;
    maxTier: number | null;
    timeLimitSeconds: number | null;
    canBePrevented: boolean;
}

// =============================================================================
// OBJECTIVE
// =============================================================================

export interface FormattedObjective {
    id: unknown;
    missionDefinitionId: unknown;
    sequenceOrder: unknown;
    title: unknown;
    description: unknown;
    hintText: unknown;
    completionText: unknown;
    objectiveType: unknown;
    isOptional: boolean;
    isHidden: boolean;
    isBonus: boolean;
    targetLocationId: unknown;
    targetLocationName: unknown;
    targetNpcId: unknown;
    targetNpcName: unknown;
    targetItemId: unknown;
    targetItemName: unknown;
    targetCoordinates: unknown;
    targetQuantity: unknown;
    completionConditions: unknown;
    failureConditions: unknown;
    timeLimitSeconds: unknown;
    completionXp: unknown;
}
