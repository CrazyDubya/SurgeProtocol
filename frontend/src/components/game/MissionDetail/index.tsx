import type { Mission } from '@/types';
import { Badge } from '@components/ui';
import { Button } from '@components/ui';
import styles from './MissionDetail.module.css';

export interface MissionDetailProps {
  mission: Mission;
  onAccept?: () => void;
  onDecline?: () => void;
  onAbandon?: () => void;
  onClose?: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  delivery: '◈',
  extraction: '⬡',
  infiltration: '◇',
  sabotage: '⬢',
  courier: '▷',
  escort: '◆',
};

const DIFFICULTY_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'humanity'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
  extreme: 'humanity',
};

export function MissionDetail({
  mission,
  onAccept,
  onDecline,
  onAbandon,
  onClose,
}: MissionDetailProps) {
  const isActive = mission.status === 'active';
  const isAvailable = mission.status === 'available';
  const isCompleted = mission.status === 'completed';
  const isFailed = mission.status === 'failed';

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatCredits = (amount: number): string => {
    return `¥${amount.toLocaleString()}`;
  };

  return (
    <div class={styles.detail}>
      {/* Header */}
      <div class={styles.header}>
        <div class={styles.headerTop}>
          <div class={styles.titleArea}>
            <h2 class={styles.title}>{mission.title}</h2>
            <div class={styles.badges}>
              <Badge variant="secondary" size="sm">
                {TYPE_ICONS[mission.type]} {mission.type}
              </Badge>
              <Badge variant={DIFFICULTY_COLORS[mission.difficulty]} size="sm">
                {mission.difficulty}
              </Badge>
              {isActive && (
                <Badge variant="algorithm" size="sm" pulse>
                  Active
                </Badge>
              )}
            </div>
          </div>
          {onClose && (
            <button class={styles.closeButton} onClick={onClose} aria-label="Close">
              ×
            </button>
          )}
        </div>
        <p class={styles.description}>{mission.description}</p>
      </div>

      {/* Status Banner (for active/completed/failed) */}
      {(isActive || isCompleted || isFailed) && (
        <div
          class={`${styles.statusBanner} ${
            isActive ? styles.active : isCompleted ? styles.completed : styles.failed
          }`}
        >
          <span class={styles.statusIcon}>
            {isActive ? '◎' : isCompleted ? '✓' : '✗'}
          </span>
          <div class={styles.statusContent}>
            <h4 class={styles.statusTitle}>
              {isActive ? 'Mission In Progress' : isCompleted ? 'Mission Complete' : 'Mission Failed'}
            </h4>
            {isActive && mission.timeLimit && (
              <p class={styles.statusSubtitle}>Time remaining: {formatTime(mission.timeLimit)}</p>
            )}
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div class={styles.infoGrid}>
        <div class={styles.infoItem}>
          <span class={styles.infoLabel}>Reward</span>
          <span class={`${styles.infoValue} ${styles.highlight}`}>
            {formatCredits(mission.reward.credits)}
          </span>
        </div>
        {mission.reward.xp && (
          <div class={styles.infoItem}>
            <span class={styles.infoLabel}>XP</span>
            <span class={styles.infoValue}>+{mission.reward.xp}</span>
          </div>
        )}
        {mission.reward.reputation && (
          <div class={styles.infoItem}>
            <span class={styles.infoLabel}>Reputation</span>
            <span class={`${styles.infoValue} ${styles.success}`}>
              +{mission.reward.reputation}
            </span>
          </div>
        )}
        {mission.timeLimit && (
          <div class={styles.infoItem}>
            <span class={styles.infoLabel}>Time Limit</span>
            <span class={`${styles.infoValue} ${styles.danger}`}>
              {formatTime(mission.timeLimit)}
            </span>
          </div>
        )}
      </div>

      {/* Locations */}
      {(mission.origin || mission.destination) && (
        <div class={styles.locations}>
          <h3 class={styles.locationsHeader}>Route</h3>
          <div class={styles.locationPath}>
            {mission.origin && (
              <div class={styles.location}>
                <span class={styles.locationLabel}>Origin</span>
                <span class={styles.locationName}>{mission.origin.name}</span>
                <span class={styles.locationZone}>{mission.origin.zone}</span>
              </div>
            )}
            <span class={styles.pathArrow}>→</span>
            {mission.destination && (
              <div class={styles.location}>
                <span class={styles.locationLabel}>Destination</span>
                <span class={styles.locationName}>{mission.destination.name}</span>
                <span class={styles.locationZone}>{mission.destination.zone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rewards Breakdown */}
      <div class={styles.rewards}>
        <h3 class={styles.rewardsHeader}>Rewards</h3>
        <div class={styles.rewardsGrid}>
          <div class={styles.rewardItem}>
            <span class={styles.rewardIcon}>¥</span>
            <span class={styles.rewardValue}>{mission.reward.credits.toLocaleString()}</span>
            <span class={styles.rewardLabel}>Credits</span>
          </div>
          {mission.reward.xp && (
            <div class={styles.rewardItem}>
              <span class={styles.rewardIcon}>◈</span>
              <span class={styles.rewardValue}>{mission.reward.xp}</span>
              <span class={styles.rewardLabel}>XP</span>
            </div>
          )}
          {mission.reward.reputation && (
            <div class={styles.rewardItem}>
              <span class={styles.rewardIcon}>★</span>
              <span class={styles.rewardValue}>+{mission.reward.reputation}</span>
              <span class={styles.rewardLabel}>Rep</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div class={styles.actions}>
        {isAvailable && onAccept && (
          <Button variant="primary" onClick={onAccept}>
            Accept Mission
          </Button>
        )}
        {isAvailable && onDecline && (
          <Button variant="ghost" onClick={onDecline}>
            Decline
          </Button>
        )}
        {isActive && onAbandon && (
          <Button variant="danger" onClick={onAbandon}>
            Abandon Mission
          </Button>
        )}
      </div>
    </div>
  );
}
