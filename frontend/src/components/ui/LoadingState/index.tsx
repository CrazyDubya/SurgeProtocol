/**
 * LoadingState - Wrapper for loading/error/empty states
 *
 * Provides consistent patterns for:
 * - Loading states with skeletons
 * - Error states with retry
 * - Empty states with messages
 */

import { ComponentChildren } from 'preact';
import { Skeleton, SkeletonCard, SkeletonDashboard } from '../Skeleton';
import { Button } from '../Button';
import styles from './LoadingState.module.css';

export type LoadingVariant = 'card' | 'dashboard' | 'list' | 'inline';

export interface LoadingStateProps {
  /** Is data loading? */
  isLoading: boolean;
  /** Error message if any */
  error?: string | null;
  /** Is data empty (after loading)? */
  isEmpty?: boolean;
  /** Variant of loading skeleton */
  variant?: LoadingVariant;
  /** Number of skeleton items for list variant */
  count?: number;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state action */
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  /** Error retry action */
  onRetry?: () => void;
  /** Children to render when data is loaded */
  children: ComponentChildren;
}

export function LoadingState({
  isLoading,
  error,
  isEmpty = false,
  variant = 'card',
  count = 3,
  emptyMessage = 'No data available',
  emptyAction,
  onRetry,
  children,
}: LoadingStateProps) {
  // Error state
  if (error) {
    return (
      <div class={styles.state} role="alert">
        <div class={styles.icon}>!</div>
        <p class={styles.message}>{error}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div class={styles.loading} aria-busy="true" aria-live="polite">
        <span class="sr-only">Loading...</span>
        <LoadingSkeleton variant={variant} count={count} />
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <div class={styles.state}>
        <div class={styles.emptyIcon}>∅</div>
        <p class={styles.message}>{emptyMessage}</p>
        {emptyAction && (
          <Button variant="primary" size="sm" onClick={emptyAction.onClick}>
            {emptyAction.label}
          </Button>
        )}
      </div>
    );
  }

  // Normal state - render children
  return <>{children}</>;
}

function LoadingSkeleton({
  variant,
  count,
}: {
  variant: LoadingVariant;
  count: number;
}) {
  switch (variant) {
    case 'dashboard':
      return <SkeletonDashboard />;
    case 'card':
      return (
        <div class={styles.skeletonGrid}>
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    case 'list':
      return (
        <div class={styles.skeletonList}>
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} variant="text" />
          ))}
        </div>
      );
    case 'inline':
      return <Skeleton variant="text" width="100%" />;
    default:
      return <SkeletonCard />;
  }
}

export default LoadingState;
