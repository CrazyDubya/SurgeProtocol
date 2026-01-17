/**
 * Combat Store Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
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
  startCombat,
  setCombatState,
  updateCombatant,
  addActionLog,
  setConnected,
  setPendingAction,
  endCombat,
  handleCombatMessage,
  type Combatant,
  type ActionLogEntry,
} from './combatStore';

// Mock combatants
const mockPlayerCombatant: Combatant = {
  id: 'player-1',
  name: 'Shadow Runner',
  hp: 80,
  hpMax: 100,
  conditions: [],
  isPlayer: true,
  isAlly: false,
  initiative: 15,
  position: { x: 0, y: 0 },
  actionsRemaining: 2,
  movementRemaining: 6,
};

const mockEnemyCombatant: Combatant = {
  id: 'enemy-1',
  name: 'Corp Guard',
  hp: 50,
  hpMax: 60,
  conditions: ['stunned'],
  isPlayer: false,
  isAlly: false,
  initiative: 10,
  position: { x: 5, y: 5 },
  actionsRemaining: 1,
  movementRemaining: 4,
};

const mockAllyCombatant: Combatant = {
  id: 'ally-1',
  name: 'Hired Gun',
  hp: 40,
  hpMax: 50,
  conditions: [],
  isPlayer: false,
  isAlly: true,
  initiative: 12,
  position: { x: 2, y: 2 },
  actionsRemaining: 1,
  movementRemaining: 5,
};

const mockDefeatedCombatant: Combatant = {
  id: 'enemy-2',
  name: 'Dead Guard',
  hp: 0,
  hpMax: 40,
  conditions: ['defeated'],
  isPlayer: false,
  isAlly: false,
  initiative: 8,
  position: { x: 10, y: 10 },
};

const mockActionLogEntry: ActionLogEntry = {
  id: 'log-1',
  timestamp: Date.now(),
  actorId: 'player-1',
  actorName: 'Shadow Runner',
  actionType: 'ATTACK',
  targetId: 'enemy-1',
  targetName: 'Corp Guard',
  result: {
    success: true,
    damage: 15,
    message: 'Shadow Runner hits Corp Guard for 15 damage!',
  },
};

describe('Combat Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    endCombat();
  });

  describe('State Management', () => {
    it('should start combat with correct initial state', () => {
      startCombat('combat-123');

      expect(combatId.value).toBe('combat-123');
      expect(phase.value).toBe('INITIALIZING');
      expect(round.value).toBe(0);
      expect(combatants.value).toEqual([]);
      expect(currentTurnId.value).toBeNull();
      expect(actionLog.value).toEqual([]);
      expect(endReason.value).toBeNull();
      expect(rewards.value).toBeNull();
    });

    it('should set combat state', () => {
      setCombatState({
        combatId: 'combat-456',
        phase: 'ACTIVE',
        round: 2,
        combatants: [mockPlayerCombatant, mockEnemyCombatant],
        currentTurnId: 'player-1',
      });

      expect(combatId.value).toBe('combat-456');
      expect(phase.value).toBe('ACTIVE');
      expect(round.value).toBe(2);
      expect(combatants.value).toHaveLength(2);
      expect(currentTurnId.value).toBe('player-1');
    });

    it('should end combat and clear state', () => {
      startCombat('combat-123');
      setCombatState({
        combatants: [mockPlayerCombatant],
        phase: 'ACTIVE',
      });

      endCombat();

      expect(combatId.value).toBeNull();
      expect(phase.value).toBe('NONE');
      expect(combatants.value).toEqual([]);
      expect(connected.value).toBe(false);
    });
  });

  describe('Combatant Management', () => {
    beforeEach(() => {
      setCombatState({
        combatants: [mockPlayerCombatant, mockEnemyCombatant, mockAllyCombatant],
        currentTurnId: 'player-1',
      });
    });

    it('should update a single combatant', () => {
      updateCombatant('enemy-1', { hp: 30, conditions: ['bleeding'] });

      const enemy = combatants.value.find((c) => c.id === 'enemy-1');
      expect(enemy?.hp).toBe(30);
      expect(enemy?.conditions).toEqual(['bleeding']);
    });

    it('should not modify other combatants', () => {
      const originalPlayer = { ...mockPlayerCombatant };
      updateCombatant('enemy-1', { hp: 10 });

      const player = combatants.value.find((c) => c.id === 'player-1');
      expect(player?.hp).toBe(originalPlayer.hp);
    });
  });

  describe('Action Log', () => {
    it('should add action log entries', () => {
      addActionLog(mockActionLogEntry);

      expect(actionLog.value).toHaveLength(1);
      expect(actionLog.value[0]).toEqual(mockActionLogEntry);
    });

    it('should append multiple log entries', () => {
      addActionLog(mockActionLogEntry);
      addActionLog({
        ...mockActionLogEntry,
        id: 'log-2',
        actionType: 'DEFEND',
      });

      expect(actionLog.value).toHaveLength(2);
    });
  });

  describe('Computed Values', () => {
    describe('isInCombat', () => {
      it('should return true when combat is active', () => {
        setCombatState({ phase: 'ACTIVE' });
        expect(isInCombat.value).toBe(true);
      });

      it('should return false when phase is NONE', () => {
        setCombatState({ phase: 'NONE' });
        expect(isInCombat.value).toBe(false);
      });

      it('should return false when phase is COMBAT_END', () => {
        setCombatState({ phase: 'COMBAT_END' });
        expect(isInCombat.value).toBe(false);
      });
    });

    describe('currentCombatant', () => {
      it('should return the combatant whose turn it is', () => {
        setCombatState({
          combatants: [mockPlayerCombatant, mockEnemyCombatant],
          currentTurnId: 'enemy-1',
        });

        expect(currentCombatant.value?.id).toBe('enemy-1');
        expect(currentCombatant.value?.name).toBe('Corp Guard');
      });

      it('should return undefined when no current turn', () => {
        setCombatState({
          combatants: [mockPlayerCombatant],
          currentTurnId: null,
        });

        expect(currentCombatant.value).toBeUndefined();
      });
    });

    describe('isPlayerTurn', () => {
      it('should return true when player is current combatant', () => {
        setCombatState({
          combatants: [mockPlayerCombatant, mockEnemyCombatant],
          currentTurnId: 'player-1',
        });

        expect(isPlayerTurn.value).toBe(true);
      });

      it('should return false when enemy is current combatant', () => {
        setCombatState({
          combatants: [mockPlayerCombatant, mockEnemyCombatant],
          currentTurnId: 'enemy-1',
        });

        expect(isPlayerTurn.value).toBe(false);
      });
    });

    describe('combatant filtering', () => {
      beforeEach(() => {
        setCombatState({
          combatants: [
            mockPlayerCombatant,
            mockEnemyCombatant,
            mockAllyCombatant,
            mockDefeatedCombatant,
          ],
        });
      });

      it('should identify player combatant', () => {
        expect(playerCombatant.value?.id).toBe('player-1');
      });

      it('should filter enemy combatants', () => {
        const enemies = enemyCombatants.value;
        expect(enemies).toHaveLength(2);
        expect(enemies.map((e) => e.id)).toContain('enemy-1');
        expect(enemies.map((e) => e.id)).toContain('enemy-2');
      });

      it('should filter ally combatants', () => {
        const allies = allyCombatants.value;
        expect(allies).toHaveLength(1);
        expect(allies[0].id).toBe('ally-1');
      });

      it('should filter active combatants (excluding defeated)', () => {
        const active = activeCombatants.value;
        expect(active).toHaveLength(3);
        expect(active.map((c) => c.id)).not.toContain('enemy-2');
      });
    });

    describe('turnOrder', () => {
      it('should sort combatants by initiative (descending)', () => {
        setCombatState({
          combatants: [mockEnemyCombatant, mockPlayerCombatant, mockAllyCombatant],
        });

        const order = turnOrder.value;
        expect(order[0].id).toBe('player-1'); // initiative 15
        expect(order[1].id).toBe('ally-1'); // initiative 12
        expect(order[2].id).toBe('enemy-1'); // initiative 10
      });
    });

    describe('recentActions', () => {
      it('should return last 5 actions in reverse order', () => {
        for (let i = 0; i < 7; i++) {
          addActionLog({ ...mockActionLogEntry, id: `log-${i}` });
        }

        const recent = recentActions.value;
        expect(recent).toHaveLength(5);
        expect(recent[0].id).toBe('log-6'); // Most recent first
        expect(recent[4].id).toBe('log-2');
      });
    });

    describe('victory/defeat', () => {
      it('should detect victory', () => {
        setCombatState({ endReason: 'VICTORY' });
        expect(isVictory.value).toBe(true);
        expect(isDefeat.value).toBe(false);
      });

      it('should detect defeat', () => {
        setCombatState({ endReason: 'DEFEAT' });
        expect(isVictory.value).toBe(false);
        expect(isDefeat.value).toBe(true);
      });
    });
  });

  describe('Connection State', () => {
    it('should set connected state', () => {
      expect(connected.value).toBe(false);
      setConnected(true);
      expect(connected.value).toBe(true);
    });

    it('should set pending action state', () => {
      expect(pendingAction.value).toBe(false);
      setPendingAction(true);
      expect(pendingAction.value).toBe(true);
    });
  });

  describe('Message Handling', () => {
    it('should handle COMBAT_STATE message', () => {
      handleCombatMessage({
        type: 'COMBAT_STATE',
        payload: {
          combatId: 'msg-combat',
          phase: 'ACTIVE',
          round: 3,
        },
      });

      expect(combatId.value).toBe('msg-combat');
      expect(phase.value).toBe('ACTIVE');
      expect(round.value).toBe(3);
    });

    it('should handle INITIATIVE_ROLLED message', () => {
      handleCombatMessage({
        type: 'INITIATIVE_ROLLED',
        payload: {
          combatants: [mockPlayerCombatant, mockEnemyCombatant],
        },
      });

      expect(phase.value).toBe('ACTIVE');
      expect(combatants.value).toHaveLength(2);
    });

    it('should handle TURN_START message', () => {
      handleCombatMessage({
        type: 'TURN_START',
        payload: { combatantId: 'player-1' },
      });

      expect(currentTurnId.value).toBe('player-1');
    });

    it('should handle ACTION_RESULT message', () => {
      setPendingAction(true);
      handleCombatMessage({
        type: 'ACTION_RESULT',
        payload: mockActionLogEntry,
      });

      expect(pendingAction.value).toBe(false);
      expect(actionLog.value).toHaveLength(1);
    });

    it('should handle TURN_END message', () => {
      setCombatState({ currentTurnId: 'player-1' });
      handleCombatMessage({ type: 'TURN_END' });

      expect(currentTurnId.value).toBeNull();
    });

    it('should handle ROUND_END message', () => {
      setCombatState({ round: 2 });
      handleCombatMessage({ type: 'ROUND_END' });

      expect(phase.value).toBe('ROUND_END');
      expect(round.value).toBe(3);
    });

    it('should handle COMBAT_END message with rewards', () => {
      handleCombatMessage({
        type: 'COMBAT_END',
        payload: {
          reason: 'VICTORY',
          rewards: { xp: 100, credits: 500, items: ['medkit'] },
        },
      });

      expect(phase.value).toBe('COMBAT_END');
      expect(endReason.value).toBe('VICTORY');
      expect(rewards.value?.xp).toBe(100);
      expect(rewards.value?.credits).toBe(500);
    });

    it('should handle ERROR message', () => {
      setPendingAction(true);
      handleCombatMessage({ type: 'ERROR' });

      expect(pendingAction.value).toBe(false);
    });
  });
});
