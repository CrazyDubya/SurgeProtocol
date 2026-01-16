import { useEffect, useState } from 'preact/hooks';
import type { Mission } from '@/types';
import { Card, Badge, Button } from '@components/ui';
import styles from './ActiveMissionTracker.module.css';

export interface ActiveMissionTrackerProps {
  mission: Mission | null;
  onView?: () => void;
  onAbandon?: () => void;
  onFindMission?: () => void;
  compact?: boolean;
}

export interface MissionObjective {
  id: string;
  text: string;
  status: 'pending' | 'current' | 'complete';
}

const TYPE_ICONS: Record<string, string> = {
  delivery: '◈',
  extraction: '⬡',
  infiltration: '◇',
  sabotage: '⬢',
  courier: '▷',
  escort: '◆',
};

export function ActiveMissionTracker({
  mission,
  onView,
  onAbandon,
  onFindMission,
  compact = false,
}: ActiveMissionTrackerProps) {
  const [timeRemaining, setTimeRemaining] = useState(mission?.timeLimit || 0);

  // Countdown timer
  useEffect(() => {
    if (!mission?.timeLimit) return;

    setTimeRemaining(mission.timeLimit);
    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [mission?.timeLimit, mission?.id]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isUrgent = mission?.timeLimit ? timeRemaining < 300 : false; // Less than 5 minutes

  // Mock objectives - would come from mission data
  const objectives: MissionObjective[] = mission
    ? [
        { id: '1', text: 'Pick up package', status: 'complete' },
        { id: '2', text: 'Navigate to destination', status: 'current' },
        { id: '3', text: 'Deliver to contact', status: 'pending' },
      ]
    : [];

  // Compact mode for sidebars/headers
  if (compact) {
    if (!mission) {
      return (
        <Card variant="outlined" padding="none" class={styles.compact}>
          <span class={styles.emptyIcon}>◇</span>
          <div class={styles.compactInfo}>
            <p class={styles.compactTitle}>No Active Mission</p>
          </div>
          {onFindMission && (
            <Button variant="ghost" size="sm" onClick={onFindMission}>
              Find
            </Button>
          )}
        </Card>
      );
    }

    return (
      <Card
        variant="outlined"
        padding="none"
        class={`${styles.compact} ${isUrgent ? styles.urgent : ''}`}
        onClick={onView}
        interactive={!!onView}
      >
        <Badge variant="algorithm" size="xs">
          {TYPE_ICONS[mission.type]}
        </Badge>
        <div class={styles.compactInfo}>
          <p class={styles.compactTitle}>{mission.title}</p>
          <div class={styles.compactMeta}>
            <span>¥{mission.reward.credits.toLocaleString()}</span>
            {mission.reward.xp && <span>+{mission.reward.xp} XP</span>}
          </div>
        </div>
        {mission.timeLimit && (
          <span class={styles.compactTimer}>{formatTime(timeRemaining)}</span>
        )}
      </Card>
    );
  }

  // Empty state
  if (!mission) {
    return (
      <Card variant="terminal">
        <div class={styles.empty}>
          <span class={styles.emptyIcon}>◇</span>
          <p class={styles.emptyText}>No active mission</p>
          {onFindMission && (
            <Button variant="primary" onClick={onFindMission}>
              Find a Mission
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const timeProgress = mission.timeLimit
    ? (timeRemaining / mission.timeLimit) * 100
    : 100;

  return (
    <Card variant="terminal" padding="none" class={styles.tracker}>
      {/* Header */}
      <div class={styles.header}>
        <div class={styles.headerLeft}>
          <span class={styles.statusIcon}>◎</span>
          <span class={styles.statusText}>Mission Active</span>
        </div>
        <Badge variant="algorithm" size="xs">
          {TYPE_ICONS[mission.type]} {mission.type}
        </Badge>
      </div>

      {/* Content */}
      <div class={styles.content}>
        <h3 class={styles.title}>{mission.title}</h3>

        {/* Timer */}
        {mission.timeLimit && (
          <div class={`${styles.timer} ${isUrgent ? styles.urgent : ''}`}>
            <span class={styles.timerIcon}>⏱</span>
            <span class={styles.timerValue}>{formatTime(timeRemaining)}</span>
          </div>
        )}

        {/* Progress */}
        <div class={styles.progress}>
          {mission.timeLimit && (
            <div class={styles.progressRow}>
              <div class={styles.progressLabel}>
                <span class={styles.progressLabelText}>Time</span>
                <span class={styles.progressLabelValue}>{formatTime(timeRemaining)}</span>
              </div>
              <div class={styles.progressBar}>
                <div
                  class={`${styles.progressFill} ${styles.time} ${isUrgent ? styles.urgent : ''}`}
                  style={{ width: `${timeProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Objectives */}
        <div class={styles.objectives}>
          <span class={styles.objectivesLabel}>Objectives</span>
          {objectives.map((obj) => (
            <div key={obj.id} class={`${styles.objective} ${styles[obj.status]}`}>
              <span class={styles.objectiveIcon}>
                {obj.status === 'complete' ? '✓' : obj.status === 'current' ? '◎' : '○'}
              </span>
              <span class={styles.objectiveText}>{obj.text}</span>
            </div>
          ))}
        </div>

        {/* Reward */}
        <div class={styles.reward}>
          <span class={styles.rewardLabel}>Reward</span>
          <span class={styles.rewardValue}>¥{mission.reward.credits.toLocaleString()}</span>
          {mission.reward.xp && <span class={styles.rewardValue}>+{mission.reward.xp} XP</span>}
        </div>

        {/* Actions */}
        <div class={styles.actions}>
          {onView && (
            <Button variant="secondary" size="sm" onClick={onView}>
              Details
            </Button>
          )}
          {onAbandon && (
            <Button variant="ghost" size="sm" onClick={onAbandon}>
              Abandon
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
