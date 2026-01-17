/**
 * useCombat - Hook for combat WebSocket connection
 *
 * Connects to a CombatSession Durable Object for real-time combat.
 */

import { useCallback } from 'preact/hooks';
import { useWebSocket } from './useWebSocket';
import {
  combatStore,
  handleCombatMessage,
  setConnected,
  setPendingAction,
  startCombat,
  endCombat,
  CombatActionType,
} from '@/stores/combatStore';

// =============================================================================
// TYPES
// =============================================================================

export interface CombatAction {
  type: CombatActionType;
  targetId?: string;
  itemId?: string;
  abilityId?: string;
  position?: { x: number; y: number };
}

// =============================================================================
// CONFIGURATION
// =============================================================================

function getCombatUrl(combatId: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws/combat/${combatId}`;
}

// =============================================================================
// HOOK
// =============================================================================

export function useCombat(combatId: string | null) {
  const { state, send, isConnected, connect, disconnect } = useWebSocket({
    url: combatId ? getCombatUrl(combatId) : '',
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    pingInterval: 15000,

    onMessage: (data) => {
      if (typeof data === 'object' && data !== null && 'type' in data) {
        handleCombatMessage(data as { type: string; payload?: unknown });
      }
    },

    onOpen: () => {
      if (combatId) {
        startCombat(combatId);
        setConnected(true);
      }
    },

    onClose: () => {
      setConnected(false);
    },

    onError: () => {
      setConnected(false);
      setPendingAction(false);
    },
  });

  // Send a combat action
  const sendAction = useCallback(
    (action: CombatAction): boolean => {
      if (!isConnected || combatStore.pendingAction.value) {
        return false;
      }

      setPendingAction(true);
      return send({
        type: 'ACTION',
        payload: action,
      });
    },
    [isConnected, send]
  );

  // Attack a target
  const attack = useCallback(
    (targetId: string): boolean => {
      return sendAction({ type: 'ATTACK', targetId });
    },
    [sendAction]
  );

  // Move to a position
  const move = useCallback(
    (x: number, y: number): boolean => {
      return sendAction({ type: 'MOVE', position: { x, y } });
    },
    [sendAction]
  );

  // Defend (raise shield/take cover)
  const defend = useCallback((): boolean => {
    return sendAction({ type: 'DEFEND' });
  }, [sendAction]);

  // Use an item
  const useItem = useCallback(
    (itemId: string, targetId?: string): boolean => {
      return sendAction({ type: 'USE_ITEM', itemId, targetId });
    },
    [sendAction]
  );

  // Use an ability
  const useAbility = useCallback(
    (abilityId: string, targetId?: string): boolean => {
      return sendAction({ type: 'USE_ABILITY', abilityId, targetId });
    },
    [sendAction]
  );

  // Disengage from combat
  const disengage = useCallback((): boolean => {
    return sendAction({ type: 'DISENGAGE' });
  }, [sendAction]);

  // Set overwatch
  const overwatch = useCallback((): boolean => {
    return sendAction({ type: 'OVERWATCH' });
  }, [sendAction]);

  // End turn
  const endTurn = useCallback((): boolean => {
    return sendAction({ type: 'END_TURN' });
  }, [sendAction]);

  // Leave combat
  const leaveCombat = useCallback(() => {
    disconnect();
    endCombat();
  }, [disconnect]);

  return {
    // Connection
    connectionState: state,
    isConnected,
    connect,
    disconnect: leaveCombat,

    // Combat state
    combatId: combatStore.combatId,
    phase: combatStore.phase,
    round: combatStore.round,
    combatants: combatStore.combatants,
    currentTurnId: combatStore.currentTurnId,
    actionLog: combatStore.actionLog,
    endReason: combatStore.endReason,
    rewards: combatStore.rewards,
    pendingAction: combatStore.pendingAction,

    // Computed
    isInCombat: combatStore.isInCombat,
    currentCombatant: combatStore.currentCombatant,
    isPlayerTurn: combatStore.isPlayerTurn,
    playerCombatant: combatStore.playerCombatant,
    enemyCombatants: combatStore.enemyCombatants,
    allyCombatants: combatStore.allyCombatants,
    turnOrder: combatStore.turnOrder,
    activeCombatants: combatStore.activeCombatants,
    recentActions: combatStore.recentActions,
    isVictory: combatStore.isVictory,
    isDefeat: combatStore.isDefeat,

    // Actions
    sendAction,
    attack,
    move,
    defend,
    useItem,
    useAbility,
    disengage,
    overwatch,
    endTurn,
  };
}

export default useCombat;
