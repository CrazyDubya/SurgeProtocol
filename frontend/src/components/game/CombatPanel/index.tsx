/**
 * CombatPanel - Main combat interface
 *
 * Displays turn order, combatant status, action buttons, and combat log.
 */

import { Card, Button, Progress, Badge } from '@components/ui';
import { useCombat } from '@/hooks/useCombat';
import type { Combatant, ActionLogEntry } from '@/stores/combatStore';
import styles from './CombatPanel.module.css';

export interface CombatPanelProps {
  combatId: string;
  onCombatEnd?: () => void;
  class?: string;
}

export function CombatPanel({
  combatId,
  onCombatEnd,
  class: className,
}: CombatPanelProps) {
  const {
    phase,
    round,
    turnOrder,
    currentTurnId,
    isPlayerTurn,
    playerCombatant,
    recentActions,
    pendingAction,
    endReason,
    rewards,
    isVictory,
    isDefeat,
    attack,
    defend,
    useItem,
    disengage,
    overwatch,
    endTurn,
    disconnect,
    isConnected,
  } = useCombat(combatId);

  const classes = [styles.panel, className].filter(Boolean).join(' ');

  // Handle combat end
  const handleLeave = () => {
    disconnect();
    onCombatEnd?.();
  };

  // Combat ended state
  if (phase === 'COMBAT_END') {
    return (
      <Card variant="default" padding="lg" class={classes}>
        <div class={styles.endScreen}>
          <h2 class={`${styles.endTitle} ${isVictory ? styles.victory : styles.defeat}`}>
            {isVictory ? 'VICTORY' : isDefeat ? 'DEFEAT' : endReason}
          </h2>

          {rewards && (
            <div class={styles.rewards}>
              <h3>Rewards</h3>
              <div class={styles.rewardList}>
                {rewards.xp > 0 && (
                  <div class={styles.reward}>
                    <span class={styles.rewardLabel}>XP</span>
                    <span class={styles.rewardValue}>+{rewards.xp}</span>
                  </div>
                )}
                {rewards.credits > 0 && (
                  <div class={styles.reward}>
                    <span class={styles.rewardLabel}>Credits</span>
                    <span class={styles.rewardValue}>+{rewards.credits}</span>
                  </div>
                )}
                {rewards.items.length > 0 && (
                  <div class={styles.reward}>
                    <span class={styles.rewardLabel}>Items</span>
                    <span class={styles.rewardValue}>{rewards.items.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button variant="primary" onClick={handleLeave}>
            Continue
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="md" class={classes}>
      {/* Header */}
      <div class={styles.header}>
        <div class={styles.roundInfo}>
          <span class={styles.roundLabel}>ROUND</span>
          <span class={styles.roundValue}>{round}</span>
        </div>
        <div class={styles.phaseInfo}>
          <Badge variant={phase === 'ACTIVE' ? 'success' : 'default'}>
            {phase.replace('_', ' ')}
          </Badge>
          {!isConnected && <Badge variant="danger">DISCONNECTED</Badge>}
        </div>
      </div>

      {/* Turn Order */}
      <div class={styles.turnOrder}>
        <h3 class={styles.sectionTitle}>Initiative</h3>
        <div class={styles.combatantList}>
          {turnOrder.map((combatant) => (
            <CombatantCard
              key={combatant.id}
              combatant={combatant}
              isActive={combatant.id === currentTurnId}
              isPlayer={combatant.isPlayer}
            />
          ))}
        </div>
      </div>

      {/* Action Bar - only show on player turn */}
      {isPlayerTurn && playerCombatant && (
        <div class={styles.actionBar}>
          <h3 class={styles.sectionTitle}>Actions</h3>
          <div class={styles.actions}>
            <Button
              variant="danger"
              size="sm"
              onClick={() => attack(turnOrder.find((c) => !c.isPlayer && !c.isAlly)?.id ?? '')}
              disabled={pendingAction || (playerCombatant.actionsRemaining ?? 1) <= 0}
            >
              Attack
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => defend()}
              disabled={pendingAction || (playerCombatant.actionsRemaining ?? 1) <= 0}
            >
              Defend
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => overwatch()}
              disabled={pendingAction || (playerCombatant.actionsRemaining ?? 1) <= 0}
            >
              Overwatch
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => useItem('healing_stim')}
              disabled={pendingAction || (playerCombatant.actionsRemaining ?? 1) <= 0}
            >
              Use Item
            </Button>
            <Button
              variant="warning"
              size="sm"
              onClick={() => disengage()}
              disabled={pendingAction}
            >
              Disengage
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => endTurn()}
              disabled={pendingAction}
            >
              End Turn
            </Button>
          </div>

          <div class={styles.playerResources}>
            <span>Actions: {playerCombatant.actionsRemaining ?? 1}</span>
            <span>Movement: {playerCombatant.movementRemaining ?? 1}</span>
          </div>
        </div>
      )}

      {/* Combat Log */}
      <div class={styles.combatLog}>
        <h3 class={styles.sectionTitle}>Combat Log</h3>
        <div class={styles.logEntries}>
          {recentActions.length === 0 ? (
            <div class={styles.logEmpty}>Combat begins...</div>
          ) : (
            recentActions.map((entry) => (
              <LogEntry key={entry.id} entry={entry} />
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

// Combatant card sub-component
function CombatantCard({
  combatant,
  isActive,
  isPlayer,
}: {
  combatant: Combatant;
  isActive: boolean;
  isPlayer?: boolean;
}) {
  const hpPercent = combatant.hpMax > 0 ? (combatant.hp / combatant.hpMax) * 100 : 0;
  const status = combatant.hp <= 0 ? 'defeated' : hpPercent <= 25 ? 'critical' : hpPercent <= 50 ? 'wounded' : 'active';

  return (
    <div
      class={`${styles.combatantCard} ${isActive ? styles.active : ''} ${isPlayer ? styles.player : combatant.isAlly ? styles.ally : styles.enemy
        } ${status === 'defeated' ? styles.defeated : ''}`}
    >
      <div class={styles.combatantInfo}>
        <span class={styles.combatantName}>{combatant.name}</span>
        <span class={styles.combatantInitiative}>{combatant.initiative ?? 0}</span>
      </div>
      <Progress
        value={combatant.hp}
        max={combatant.hpMax}
        variant="health"
        size="xs"
        glow={hpPercent <= 25}
      />
      {combatant.conditions.length > 0 && (
        <div class={styles.conditions}>
          {combatant.conditions.map((condition) => (
            <Badge key={condition} variant="warning" size="sm">
              {condition}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Log entry sub-component
function LogEntry({ entry }: { entry: ActionLogEntry }) {
  return (
    <div
      class={`${styles.logEntry} ${entry.result.success ? styles.success : styles.failure}`}
    >
      <span class={styles.logActor}>{entry.actorName}</span>
      <span class={styles.logMessage}>{entry.result.message}</span>
      {entry.result.damage && (
        <span class={styles.logDamage}>-{entry.result.damage}</span>
      )}
    </div>
  );
}

export default CombatPanel;
