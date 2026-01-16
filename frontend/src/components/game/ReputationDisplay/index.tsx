import styles from './ReputationDisplay.module.css';

export interface ReputationDisplayProps {
  algorithmRep: number; // 0-100
  streetRep: number;
  corpRep: number;
  recentChanges?: ReputationChange[];
  compact?: boolean;
}

export interface ReputationChange {
  id: string;
  source: string;
  amount: number;
  timestamp: Date | string;
}

type AlgorithmStatus = 'hostile' | 'distant' | 'observant' | 'familiar' | 'intimate' | 'unified';

const STATUS_THRESHOLDS: { min: number; status: AlgorithmStatus; icon: string; description: string }[] = [
  { min: 0, status: 'hostile', icon: '⬢', description: 'The Algorithm views you as a threat to the network.' },
  { min: 20, status: 'distant', icon: '◇', description: 'The Algorithm acknowledges your existence, nothing more.' },
  { min: 40, status: 'observant', icon: '◈', description: 'The Algorithm monitors your activities with interest.' },
  { min: 60, status: 'familiar', icon: '◆', description: 'The Algorithm recognizes your patterns and preferences.' },
  { min: 80, status: 'intimate', icon: '◎', description: 'The Algorithm trusts you with sensitive information.' },
  { min: 95, status: 'unified', icon: '⬡', description: 'You and The Algorithm operate as one entity.' },
];

export function ReputationDisplay({
  algorithmRep,
  streetRep,
  corpRep,
  recentChanges = [],
  compact = false,
}: ReputationDisplayProps) {
  const getStatus = (rep: number): typeof STATUS_THRESHOLDS[0] => {
    for (let i = STATUS_THRESHOLDS.length - 1; i >= 0; i--) {
      if (rep >= STATUS_THRESHOLDS[i].min) {
        return STATUS_THRESHOLDS[i];
      }
    }
    return STATUS_THRESHOLDS[0];
  };

  const status = getStatus(algorithmRep);

  // Compact mode for sidebars
  if (compact) {
    return (
      <div class={styles.compact}>
        <span class={styles.compactIcon}>{status.icon}</span>
        <div class={styles.compactInfo}>
          <span class={styles.compactLabel}>Algorithm Standing</span>
          <span class={styles.compactValue}>{algorithmRep}</span>
        </div>
        <div>
          <span class={styles.compactStatus}>{status.status}</span>
          <div class={styles.compactMeter}>
            <div class={styles.compactMeterFill} style={{ width: `${algorithmRep}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class={styles.reputation}>
      {/* Main Algorithm Meter */}
      <div class={styles.mainMeter}>
        <div class={styles.meterHeader}>
          <span class={styles.meterLabel}>Algorithm Standing</span>
          <span class={styles.meterValue}>{algorithmRep}</span>
        </div>
        <div class={styles.meterTrack}>
          <div class={styles.meterFill} style={{ width: `${algorithmRep}%` }} />
        </div>
        <div class={styles.meterMarkers}>
          <span class={styles.meterMarker}>0</span>
          <span class={styles.meterMarker}>25</span>
          <span class={styles.meterMarker}>50</span>
          <span class={styles.meterMarker}>75</span>
          <span class={styles.meterMarker}>100</span>
        </div>
      </div>

      {/* Status Display */}
      <div class={`${styles.status} ${styles[`status-${status.status}`]}`}>
        <span class={styles.statusIcon}>{status.icon}</span>
        <div class={styles.statusContent}>
          <h4 class={styles.statusTitle}>{status.status}</h4>
          <p class={styles.statusDescription}>{status.description}</p>
        </div>
      </div>

      {/* Reputation Breakdown */}
      <div class={styles.breakdown}>
        <div class={styles.breakdownItem}>
          <span class={styles.breakdownLabel}>Algorithm</span>
          <span class={styles.breakdownValue}>{algorithmRep}</span>
        </div>
        <div class={styles.breakdownItem}>
          <span class={styles.breakdownLabel}>Street</span>
          <span class={`${styles.breakdownValue} ${streetRep >= 0 ? styles.positive : styles.negative}`}>
            {streetRep >= 0 ? '+' : ''}{streetRep}
          </span>
        </div>
        <div class={styles.breakdownItem}>
          <span class={styles.breakdownLabel}>Corporate</span>
          <span class={`${styles.breakdownValue} ${corpRep >= 0 ? styles.positive : styles.negative}`}>
            {corpRep >= 0 ? '+' : ''}{corpRep}
          </span>
        </div>
      </div>

      {/* Recent Changes */}
      {recentChanges.length > 0 && (
        <div class={styles.changes}>
          <span class={styles.changesTitle}>Recent Changes</span>
          {recentChanges.slice(0, 5).map((change) => (
            <div
              key={change.id}
              class={`${styles.changeItem} ${change.amount >= 0 ? styles.positive : styles.negative}`}
            >
              <span class={styles.changeIcon}>{change.amount >= 0 ? '▲' : '▼'}</span>
              <span class={styles.changeText}>{change.source}</span>
              <span class={styles.changeValue}>
                {change.amount >= 0 ? '+' : ''}{change.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
