import styles from './Skeleton.module.css';

type SkeletonVariant =
  | 'text'
  | 'title'
  | 'avatar'
  | 'card'
  | 'button'
  | 'image';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  cyber?: boolean;
  className?: string;
  count?: number;
}

export function Skeleton({
  variant,
  width,
  height,
  cyber = false,
  className = '',
  count = 1,
}: SkeletonProps) {
  const variantClass = variant ? styles[variant] : '';
  const cyberClass = cyber ? styles.cyber : '';

  const style: Record<string, string> = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            class={`${styles.skeleton} ${variantClass} ${cyberClass} ${className}`}
            style={{ ...style, marginBottom: i < count - 1 ? '8px' : undefined }}
          />
        ))}
      </>
    );
  }

  return (
    <div
      class={`${styles.skeleton} ${variantClass} ${cyberClass} ${className}`}
      style={style}
    />
  );
}

// Pre-composed skeleton groups
export function SkeletonMissionCard() {
  return (
    <div class={styles.missionCard}>
      <div class={styles.header}>
        <Skeleton variant="title" />
        <Skeleton width={80} height={24} />
      </div>
      <div class={styles.description}>
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="70%" />
      </div>
      <div class={styles.footer}>
        <Skeleton width={100} height={20} />
        <Skeleton width={80} height={32} />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div class={styles.stat}>
      <Skeleton width={60} height={14} />
      <Skeleton width={100} height={24} />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div class={styles.group}>
      <div class={styles.row}>
        <Skeleton variant="avatar" />
        <div style={{ flex: 1 }}>
          <Skeleton variant="title" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="text" count={3} />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div class={styles.row}>
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>
      <SkeletonMissionCard />
      <SkeletonMissionCard />
    </div>
  );
}

// =============================================================================
// WebSocket Data Stream Skeletons
// =============================================================================

/**
 * War card skeleton for faction conflicts
 */
export function SkeletonWarCard() {
  return (
    <div class={styles.warCard}>
      <div class={styles.warFactions}>
        <Skeleton width={80} height={18} />
        <Skeleton width={24} height={14} />
        <Skeleton width={90} height={18} />
      </div>
      <div class={styles.warStats}>
        <Skeleton width={60} height={24} />
        <Skeleton width={80} height={14} />
      </div>
    </div>
  );
}

/**
 * Territory card skeleton
 */
export function SkeletonTerritoryCard() {
  return (
    <div class={styles.territoryCard}>
      <div class={styles.territoryHeader}>
        <Skeleton width="60%" height={18} />
        <Skeleton width={70} height={22} />
      </div>
      <div class={styles.territoryControl}>
        <Skeleton width="100%" height={8} />
        <Skeleton width={36} height={14} />
      </div>
      <div class={styles.territoryButtons}>
        <Skeleton width={100} height={32} />
        <Skeleton width={100} height={32} />
      </div>
    </div>
  );
}

/**
 * Faction rank card skeleton
 */
export function SkeletonFactionRank() {
  return (
    <div class={styles.factionRank}>
      <Skeleton width={24} height={24} />
      <div class={styles.factionInfo}>
        <Skeleton width={100} height={16} />
        <div class={styles.factionStats}>
          <Skeleton width={40} height={12} />
          <Skeleton width={40} height={12} />
          <Skeleton width={40} height={12} />
        </div>
      </div>
    </div>
  );
}

/**
 * Event card skeleton for real-time feed
 */
export function SkeletonEventCard() {
  return (
    <div class={styles.eventCard}>
      <div class={styles.eventHeader}>
        <Skeleton width={60} height={18} />
        <Skeleton width={50} height={12} />
      </div>
      <Skeleton width="90%" height={14} />
      <Skeleton width={70} height={12} />
    </div>
  );
}

/**
 * World clock skeleton
 */
export function SkeletonWorldClock({ compact = false }: { compact?: boolean }) {
  return (
    <div class={`${styles.worldClock} ${compact ? styles.compact : ''}`}>
      <Skeleton width={8} height={8} className={styles.clockDot} />
      <div class={styles.clockTime}>
        <Skeleton width={60} height={20} />
        {!compact && <Skeleton width={50} height={12} />}
      </div>
      <Skeleton width={40} height={14} />
      <div class={styles.clockWeather}>
        <Skeleton width={20} height={20} />
        {!compact && <Skeleton width={80} height={14} />}
      </div>
    </div>
  );
}

/**
 * Combatant card skeleton
 */
export function SkeletonCombatantCard() {
  return (
    <div class={styles.combatantCard}>
      <div class={styles.combatantInfo}>
        <Skeleton width={100} height={16} />
        <Skeleton width={20} height={16} />
      </div>
      <Skeleton width="100%" height={6} />
    </div>
  );
}

/**
 * Combat panel skeleton - full combat view loading state
 */
export function SkeletonCombatPanel() {
  return (
    <div class={styles.combatPanel}>
      <div class={styles.combatHeader}>
        <div class={styles.roundInfo}>
          <Skeleton width={50} height={12} />
          <Skeleton width={30} height={24} />
        </div>
        <Skeleton width={70} height={24} />
      </div>

      <div class={styles.turnOrder}>
        <Skeleton width={80} height={14} className={styles.sectionTitle} />
        <div class={styles.combatantList}>
          <SkeletonCombatantCard />
          <SkeletonCombatantCard />
          <SkeletonCombatantCard />
        </div>
      </div>

      <div class={styles.actionBar}>
        <Skeleton width={60} height={14} className={styles.sectionTitle} />
        <div class={styles.actionButtons}>
          <Skeleton width={70} height={36} />
          <Skeleton width={70} height={36} />
          <Skeleton width={70} height={36} />
          <Skeleton width={70} height={36} />
        </div>
      </div>

      <div class={styles.combatLog}>
        <Skeleton width={90} height={14} className={styles.sectionTitle} />
        <SkeletonEventCard />
        <SkeletonEventCard />
      </div>
    </div>
  );
}

/**
 * War theater page skeleton - full loading state
 */
export function SkeletonWarTheater() {
  return (
    <div class={styles.warTheater}>
      {/* Main column */}
      <div class={styles.warTheaterMain}>
        <div class={styles.section}>
          <Skeleton width={120} height={14} className={styles.sectionTitle} />
          <SkeletonWarCard />
          <SkeletonWarCard />
        </div>
        <div class={styles.section}>
          <Skeleton width={130} height={14} className={styles.sectionTitle} />
          <div class={styles.territoryGrid}>
            <SkeletonTerritoryCard />
            <SkeletonTerritoryCard />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div class={styles.warTheaterSidebar}>
        <div class={styles.section}>
          <Skeleton width={110} height={14} className={styles.sectionTitle} />
          <SkeletonFactionRank />
          <SkeletonFactionRank />
          <SkeletonFactionRank />
        </div>
        <div class={styles.section}>
          <Skeleton width={100} height={14} className={styles.sectionTitle} />
          <SkeletonEventCard />
          <SkeletonEventCard />
          <SkeletonEventCard />
        </div>
      </div>
    </div>
  );
}
