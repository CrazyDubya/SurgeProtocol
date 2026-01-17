/**
 * Combat Store - Real-time combat state management
 *
 * Manages:
 * - Combat session state
 * - Turn order and current combatant
 * - Action history
 * - Combat results
 */

import { signal, computed } from '@preact/signals';

// =============================================================================
// TYPES
// =============================================================================

export type CombatPhase =
  | 'NONE'
  | 'INITIALIZING'
  | 'ROLLING_INITIATIVE'
  | 'ACTIVE'
  | 'ROUND_END'
  | 'COMBAT_END';

export type CombatEndReason =
  | 'VICTORY'
  | 'DEFEAT'
  | 'ESCAPE'
  | 'NEGOTIATION'
  | 'TIMEOUT';

export type CombatActionType =
  | 'ATTACK'
  | 'MOVE'
  | 'DEFEND'
  | 'USE_ITEM'
  | 'USE_ABILITY'
  | 'DISENGAGE'
  | 'OVERWATCH'
  | 'END_TURN';

/** Combatant from backend - matches game/mechanics/combat.ts */
export interface Combatant {
  id: string;
  name: string;
  hp: number;
  hpMax: number;
  conditions: string[];
  // Fields added/computed on frontend for display
  isPlayer?: boolean;
  isAlly?: boolean;
  initiative?: number;
  position?: { x: number; y: number };
  status?: 'active' | 'wounded' | 'critical' | 'defeated';
  actionsRemaining?: number;
  movementRemaining?: number;
}

/** Helper to normalize combatant for UI display */
function normalizeCombatant(c: Combatant, playerId?: string): Combatant {
  const hpPercent = c.hpMax > 0 ? (c.hp / c.hpMax) * 100 : 0;
  return {
    ...c,
    isPlayer: c.id === playerId,
    isAlly: c.isAlly ?? false,
    initiative: c.initiative ?? 0,
    position: c.position ?? { x: 0, y: 0 },
    status: c.hp <= 0 ? 'defeated' : hpPercent <= 25 ? 'critical' : hpPercent <= 50 ? 'wounded' : 'active',
    actionsRemaining: c.actionsRemaining ?? 1,
    movementRemaining: c.movementRemaining ?? 1,
  };
}

export interface ActionLogEntry {
  id: string;
  timestamp: number;
  actorId: string;
  actorName: string;
  actionType: CombatActionType;
  targetId?: string;
  targetName?: string;
  result: {
    success: boolean;
    damage?: number;
    effects?: string[];
    message: string;
  };
}

export interface CombatState {
  combatId: string | null;
  phase: CombatPhase;
  round: number;
  combatants: Combatant[];
  currentTurnId: string | null;
  actionLog: ActionLogEntry[];
  endReason: CombatEndReason | null;
  rewards: {
    xp: number;
    credits: number;
    items: string[];
  } | null;
  connected: boolean;
}

// =============================================================================
// STATE SIGNALS
// =============================================================================

export const combatId = signal<string | null>(null);
export const phase = signal<CombatPhase>('NONE');
export const round = signal<number>(0);
export const combatants = signal<Combatant[]>([]);
export const currentTurnId = signal<string | null>(null);
export const actionLog = signal<ActionLogEntry[]>([]);
export const endReason = signal<CombatEndReason | null>(null);
export const rewards = signal<{ xp: number; credits: number; items: string[] } | null>(null);
export const connected = signal<boolean>(false);
export const pendingAction = signal<boolean>(false);

// =============================================================================
// COMPUTED VALUES
// =============================================================================

/** Is combat currently active? */
export const isInCombat = computed(() => phase.value !== 'NONE' && phase.value !== 'COMBAT_END');

/** Current combatant whose turn it is */
export const currentCombatant = computed(() =>
  combatants.value.find((c) => c.id === currentTurnId.value)
);

/** Is it the player's turn? */
export const isPlayerTurn = computed(() =>
  currentCombatant.value?.isPlayer ?? false
);

/** Player combatant */
export const playerCombatant = computed(() =>
  combatants.value.find((c) => c.isPlayer)
);

/** Enemy combatants */
export const enemyCombatants = computed(() =>
  combatants.value.filter((c) => !c.isPlayer && !c.isAlly)
);

/** Ally combatants */
export const allyCombatants = computed(() =>
  combatants.value.filter((c) => !c.isPlayer && c.isAlly)
);

/** Turn order (sorted by initiative) */
export const turnOrder = computed(() =>
  [...combatants.value].sort((a, b) => b.initiative - a.initiative)
);

/** Active combatants (not defeated) */
export const activeCombatants = computed(() =>
  combatants.value.filter((c) => c.status !== 'defeated')
);

/** Recent action log (last 5 entries) */
export const recentActions = computed(() =>
  actionLog.value.slice(-5).reverse()
);

/** Is combat won? */
export const isVictory = computed(() => endReason.value === 'VICTORY');

/** Is combat lost? */
export const isDefeat = computed(() => endReason.value === 'DEFEAT');

// =============================================================================
// ACTIONS
// =============================================================================

/** Start a new combat session */
export function startCombat(id: string): void {
  combatId.value = id;
  phase.value = 'INITIALIZING';
  round.value = 0;
  combatants.value = [];
  currentTurnId.value = null;
  actionLog.value = [];
  endReason.value = null;
  rewards.value = null;
}

/** Update full combat state from server */
export function setCombatState(state: Partial<CombatState>): void {
  if (state.combatId !== undefined) combatId.value = state.combatId;
  if (state.phase !== undefined) phase.value = state.phase;
  if (state.round !== undefined) round.value = state.round;
  if (state.combatants !== undefined) combatants.value = state.combatants;
  if (state.currentTurnId !== undefined) currentTurnId.value = state.currentTurnId;
  if (state.actionLog !== undefined) actionLog.value = state.actionLog;
  if (state.endReason !== undefined) endReason.value = state.endReason;
  if (state.rewards !== undefined) rewards.value = state.rewards;
}

/** Update a single combatant */
export function updateCombatant(id: string, updates: Partial<Combatant>): void {
  combatants.value = combatants.value.map((c) =>
    c.id === id ? { ...c, ...updates } : c
  );
}

/** Add action log entry */
export function addActionLog(entry: ActionLogEntry): void {
  actionLog.value = [...actionLog.value, entry];
}

/** Set connection status */
export function setConnected(isConnected: boolean): void {
  connected.value = isConnected;
}

/** Set pending action state */
export function setPendingAction(isPending: boolean): void {
  pendingAction.value = isPending;
}

/** End combat session */
export function endCombat(): void {
  phase.value = 'NONE';
  combatId.value = null;
  combatants.value = [];
  currentTurnId.value = null;
  actionLog.value = [];
  endReason.value = null;
  rewards.value = null;
  connected.value = false;
}

/** Handle server message */
export function handleCombatMessage(message: {
  type: string;
  payload?: unknown;
}): void {
  switch (message.type) {
    case 'COMBAT_STATE':
      if (typeof message.payload === 'object' && message.payload !== null) {
        setCombatState(message.payload as Partial<CombatState>);
      }
      break;
    case 'INITIATIVE_ROLLED':
      phase.value = 'ACTIVE';
      if (typeof message.payload === 'object' && message.payload !== null) {
        const payload = message.payload as { combatants: Combatant[] };
        combatants.value = payload.combatants;
      }
      break;
    case 'TURN_START':
      if (typeof message.payload === 'object' && message.payload !== null) {
        const payload = message.payload as { combatantId: string };
        currentTurnId.value = payload.combatantId;
      }
      break;
    case 'ACTION_RESULT':
      setPendingAction(false);
      if (typeof message.payload === 'object' && message.payload !== null) {
        addActionLog(message.payload as ActionLogEntry);
      }
      break;
    case 'TURN_END':
      currentTurnId.value = null;
      break;
    case 'ROUND_END':
      phase.value = 'ROUND_END';
      round.value++;
      break;
    case 'COMBAT_END':
      phase.value = 'COMBAT_END';
      if (typeof message.payload === 'object' && message.payload !== null) {
        const payload = message.payload as { reason: CombatEndReason; rewards?: typeof rewards.value };
        endReason.value = payload.reason;
        rewards.value = payload.rewards ?? null;
      }
      break;
    case 'ERROR':
      setPendingAction(false);
      break;
  }
}

// =============================================================================
// STORE EXPORT
// =============================================================================

export const combatStore = {
  // State
  combatId,
  phase,
  round,
  combatants,
  currentTurnId,
  actionLog,
  endReason,
  rewards,
  connected,
  pendingAction,

  // Computed
  isInCombat,
  currentCombatant,
  isPlayerTurn,
  playerCombatant,
  enemyCombatants,
  allyCombatants,
  turnOrder,
  activeCombatants,
  recentActions,
  isVictory,
  isDefeat,

  // Actions
  startCombat,
  setCombatState,
  updateCombatant,
  addActionLog,
  setConnected,
  setPendingAction,
  endCombat,
  handleCombatMessage,
};

export default combatStore;
