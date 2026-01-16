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
