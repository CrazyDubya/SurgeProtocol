import { Card, Badge, Progress, Button } from '@components/ui';
import type { Mission, MissionType } from '@/types';
import styles from './MissionCard.module.css';

export interface MissionCardProps {
  mission: Mission;
  onAccept?: () => void;
  onDecline?: () => void;
  onView?: () => void;
  selected?: boolean;
  class?: string;
}

const missionTypeConfig: Record<MissionType, { label: string; variant: 'corp' | 'street' | 'algorithm' | 'danger' }> = {
  delivery: { label: 'Delivery', variant: 'street' },
  extraction: { label: 'Extraction', variant: 'danger' },
  infiltration: { label: 'Infiltration', variant: 'corp' },
  sabotage: { label: 'Sabotage', variant: 'danger' },
  courier: { label: 'Courier', variant: 'street' },
  escort: { label: 'Escort', variant: 'algorithm' },
};

const difficultyColors: Record<string, 'success' | 'warning' | 'danger'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
  extreme: 'danger',
};

/**
 * Mission card for displaying available or active missions
 */
export function MissionCard({
  mission,
  onAccept,
  onDecline,
  onView,
  selected = false,
  class: className,
}: MissionCardProps) {
  const typeConfig = missionTypeConfig[mission.type] || { label: mission.type, variant: 'algorithm' as const };
  const isActive = mission.status === 'active';
  const isAvailable = mission.status === 'available';
  const timeRemaining = mission.timeLimit ? formatTime(mission.timeLimit) : null;

  const classes = [
    styles.mission,
    isActive && styles.active,
    selected && styles.selected,
    className,
  ].filter(Boolean).join(' ');

  return (
    <Card variant="outlined" padding="none" class={classes}>
      <div class={styles.header}>
        <Badge variant={typeConfig.variant} size="sm">
          {typeConfig.label}
        </Badge>
        <Badge variant={difficultyColors[mission.difficulty] || 'warning'} size="sm" outline>
          {mission.difficulty}
        </Badge>
      </div>

      <div class={styles.body}>
        <h3 class={styles.title}>{mission.title}</h3>
        <p class={styles.description}>{mission.description}</p>

        <div class={styles.meta}>
          <div class={styles.metaItem}>
            <span class={styles.metaLabel}>Reward</span>
            <span class={styles.metaValue}>¥{mission.reward.credits.toLocaleString()}</span>
          </div>
          {mission.reward.xp && (
            <div class={styles.metaItem}>
              <span class={styles.metaLabel}>XP</span>
              <span class={styles.metaValue}>+{mission.reward.xp}</span>
            </div>
          )}
          {mission.reward.reputation && (
            <div class={styles.metaItem}>
              <span class={styles.metaLabel}>Rep</span>
              <span class={styles.metaValue}>
                {mission.reward.reputation > 0 ? '+' : ''}{mission.reward.reputation}
              </span>
            </div>
          )}
        </div>

        {isActive && timeRemaining && (
          <div class={styles.timer}>
            <span class={styles.timerLabel}>Time Remaining</span>
            <Progress
              value={mission.timeLimit || 0}
              max={mission.timeLimit || 100}
              variant="time"
              size="sm"
              showLabel
              labelFormat={() => timeRemaining}
              glow
            />
          </div>
        )}
      </div>

      <div class={styles.footer}>
        {isAvailable && (
          <>
            <Button variant="ghost" size="sm" onClick={onDecline}>
              Decline
            </Button>
            <Button variant="primary" size="sm" onClick={onAccept}>
              Accept
            </Button>
          </>
        )}
        {isActive && (
          <Button variant="secondary" size="sm" fullWidth onClick={onView}>
            View Details
          </Button>
        )}
        {mission.status === 'completed' && (
          <Badge variant="success" size="md">Completed</Badge>
        )}
        {mission.status === 'failed' && (
          <Badge variant="danger" size="md">Failed</Badge>
        )}
      </div>
    </Card>
  );
}

/**
 * Compact mission list item
 */
export function MissionListItem({
  mission,
  onClick,
}: {
  mission: Mission;
  onClick?: () => void;
}) {
  const typeConfig = missionTypeConfig[mission.type] || { label: mission.type, variant: 'algorithm' as const };

  return (
    <Card
      variant="outlined"
      padding="sm"
      interactive
      onClick={onClick}
      class={styles.listItem}
    >
      <div class={styles.listContent}>
        <Badge variant={typeConfig.variant} size="xs">{typeConfig.label}</Badge>
        <span class={styles.listTitle}>{mission.title}</span>
      </div>
      <span class={styles.listReward}>¥{mission.reward.credits.toLocaleString()}</span>
    </Card>
  );
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
