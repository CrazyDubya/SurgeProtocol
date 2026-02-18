/**
 * useCombat - Hook for combat WebSocket connection
 *
 * Connects to a CombatSession Durable Object for real-time combat.
 */

import { useCallback, useEffect } from 'preact/hooks';
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

  // Calculate reachable cells and valid targets
  useEffect(() => {
    const player = combatStore.playerCombatant.value;
    if (!combatStore.isPlayerTurn.value || !player || !player.position) {
      combatStore.reachableCells.value = [];
      combatStore.validTargets.value = [];
      return;
    }

    // 1. Calculate Reachable Cells (Movement)
    const moveRange = player.movementRemaining ?? 3;
    const reachable: { x: number; y: number }[] = [];
    const others = combatStore.combatants.value
      .filter(c => c.id !== player.id && c.hp > 0)
      .map(c => c.position)
      .filter((p): p is { x: number; y: number } => !!p);

    for (let dx = -moveRange; dx <= moveRange; dx++) {
      for (let dy = -(moveRange - Math.abs(dx)); dy <= (moveRange - Math.abs(dx)); dy++) {
        const nx = player.position.x + dx;
        const ny = player.position.y + dy;
        if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
          if (!others.some(o => o.x === nx && o.y === ny)) {
            reachable.push({ x: nx, y: ny });
          }
        }
      }
    }
    combatStore.reachableCells.value = reachable;

    // 2. Calculate Valid Targets (Attack)
    const weaponRange = player.weapon?.range || (player.weapon?.type === 'RANGED' ? 5 : 1);
    const targets: string[] = [];
    const playerPos = player.position; // Local to help TS narrowing

    combatStore.enemyCombatants.value.forEach(enemy => {
      if (enemy.hp > 0 && enemy.position) {
        const dist = Math.abs(enemy.position.x - playerPos.x) + Math.abs(enemy.position.y - playerPos.y);
        if (dist <= weaponRange) {
          targets.push(enemy.id);
        }
      }
    });
    combatStore.validTargets.value = targets;
  }, [
    combatStore.isPlayerTurn.value,
    combatStore.combatants.value,
    combatStore.currentTurnId.value,
  ]);

  // Handle Action Feedback (Floating Text)
  useEffect(() => {
    const log = combatStore.actionLog.value;
    if (log.length === 0) return;

    const lastAction = log[log.length - 1];
    const target = combatStore.combatants.value.find(c => c.id === lastAction.targetId);

    if (target && target.position) {
      const id = `fb_${lastAction.id}_${Date.now()}`;
      let text = '';
      let type: 'damage' | 'heal' | 'status' | 'miss' = 'status';

      if (lastAction.result.damage !== undefined) {
        text = `-${lastAction.result.damage}`;
        type = 'damage';
      } else if (!lastAction.result.success) {
        text = 'MISS';
        type = 'miss';
      } else if (lastAction.result.effects?.length) {
        text = lastAction.result.effects[0];
        type = 'status';
      }

      if (text) {
        const feedback = {
          id,
          x: target.position.x,
          y: target.position.y,
          text,
          type
        };

        combatStore.floatingFeedbacks.value = [...combatStore.floatingFeedbacks.value, feedback];

        // Auto-remove after 2s
        setTimeout(() => {
          combatStore.floatingFeedbacks.value = combatStore.floatingFeedbacks.value.filter(fb => fb.id !== id);
        }, 2000);
      }
    }
  }, [combatStore.actionLog.value.length]);

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
    combatId: combatStore.combatId.value,
    phase: combatStore.phase.value,
    round: combatStore.round.value,
    combatants: combatStore.combatants.value,
    currentTurnId: combatStore.currentTurnId.value,
    actionLog: combatStore.actionLog.value,
    endReason: combatStore.endReason.value,
    rewards: combatStore.rewards.value,
    pendingAction: combatStore.pendingAction.value,

    // Computed
    isInCombat: combatStore.isInCombat.value,
    currentCombatant: combatStore.currentCombatant.value,
    isPlayerTurn: combatStore.isPlayerTurn.value,
    playerCombatant: combatStore.playerCombatant.value,
    enemyCombatants: combatStore.enemyCombatants.value,
    allyCombatants: combatStore.allyCombatants.value,
    turnOrder: combatStore.turnOrder.value,
    activeCombatants: combatStore.activeCombatants.value,
    recentActions: combatStore.recentActions.value,
    isVictory: combatStore.isVictory.value,
    isDefeat: combatStore.isDefeat.value,
    reachableCells: combatStore.reachableCells.value,
    validTargets: combatStore.validTargets.value,
    selectedTargetId: combatStore.selectedTargetId.value,
    floatingFeedbacks: combatStore.floatingFeedbacks.value,

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
