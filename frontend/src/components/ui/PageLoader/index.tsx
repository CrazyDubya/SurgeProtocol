/**
 * PageLoader - Full page loading indicator for Suspense boundaries
 *
 * Accessibility:
 * - Uses role="status" for screen readers
 * - aria-live="polite" announces loading state
 * - aria-busy indicates page is loading
 */

import styles from './PageLoader.module.css';

export interface PageLoaderProps {
  /** Loading message to display */
  message?: string;
  /** Minimal variant without background */
  minimal?: boolean;
}

export function PageLoader({
  message = 'Loading...',
  minimal = false,
}: PageLoaderProps) {
  return (
    <div
      class={`${styles.container} ${minimal ? styles.minimal : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div class={styles.loader}>
        <div class={styles.spinner}>
          <div class={styles.ring} />
          <div class={styles.ring} />
          <div class={styles.ring} />
        </div>
        <span class={styles.message}>{message}</span>
      </div>
    </div>
  );
}

export default PageLoader;
