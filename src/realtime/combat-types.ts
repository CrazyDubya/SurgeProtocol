
import { Combatant, AttackResult, InitiativeResult, TerrainMap } from '../game/mechanics';

// =============================================================================
// TYPES
// =============================================================================

/** Combat state phases */
export type CombatPhase =
    | 'INITIALIZING'
    | 'ROLLING_INITIATIVE'
    | 'ACTIVE'
    | 'ROUND_END'
    | 'COMBAT_END';

/** Combat end conditions */
export type CombatEndReason =
    | 'VICTORY'      // All enemies defeated
    | 'DEFEAT'       // Player(s) defeated
    | 'ESCAPE'       // Player successfully fled
    | 'NEGOTIATION'  // Combat ended via dialogue
    | 'TIMEOUT';     // Combat timed out

/** Action types available in combat */
export type CombatActionType =
    | 'ATTACK'
    | 'MOVE'
    | 'DEFEND'
    | 'USE_ITEM'
    | 'USE_ABILITY'
    | 'DISENGAGE'
    | 'OVERWATCH'
    | 'SUPPRESSIVE_FIRE'
    | 'END_TURN';

/** WebSocket message types */
export type WSMessageType =
    | 'COMBAT_STATE'
    | 'INITIATIVE_ROLLED'
    | 'TURN_START'
    | 'ACTION_RESULT'
    | 'TURN_END'
    | 'ROUND_END'
    | 'COMBAT_END'
    | 'ERROR'
    | 'PING'
    | 'PONG';

/** Inbound message from client */
export interface ClientMessage {
    type: 'ACTION' | 'PING' | 'READY';
    action?: {
        type: CombatActionType;
        targetId?: string;
        position?: { x: number; y: number };
        itemId?: string;
        abilityId?: string;
    };
}

/** Outbound message to clients */
export interface ServerMessage {
    type: WSMessageType;
    timestamp: number;
    payload: unknown;
}

/** Full combat state */
export interface CombatState {
    id: string;
    phase: CombatPhase;
    round: number;
    turnIndex: number;
    turnOrder: string[];
    combatants: Map<string, Combatant>;
    initiativeResults: InitiativeResult[];
    actionLog: ActionLogEntry[];
    startedAt: number;
    endedAt?: number;
    endReason?: CombatEndReason;
    terrain: TerrainMap;
    overwatchTargets: Map<string, string>; // actorId -> targetDirection or '*' for any
    suppressedTargets: Map<string, number>; // targetId -> accuracy penalty
    arenaId?: string;
    environment?: {
        lighting: 'BRIGHT' | 'DIM' | 'DARK';
        weather: string;
        hazards: string[];
    };
}

/** Action log entry */
export interface ActionLogEntry {
    round: number;
    turn: number;
    actorId: string;
    action: CombatActionType;
    result: AttackResult | { success: boolean; narrative: string };
    timestamp: number;
}

/** Serializable combat state for storage */
export interface StoredCombatState {
    id: string;
    phase: CombatPhase;
    round: number;
    turnIndex: number;
    turnOrder: string[];
    combatants: Array<[string, Combatant]>;
    initiativeResults: InitiativeResult[];
    actionLog: ActionLogEntry[];
    startedAt: number;
    endedAt?: number;
    endReason?: CombatEndReason;
    terrain: TerrainMap;
    overwatchTargets: Array<[string, string]>;
    suppressedTargets: Array<[string, number]>;
    arenaId?: string;
    environment?: CombatState['environment'];
}
