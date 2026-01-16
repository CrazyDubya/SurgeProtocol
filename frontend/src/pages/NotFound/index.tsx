import { Link } from 'wouter-preact';
import styles from './NotFound.module.css';

export function NotFound() {
  return (
    <div class={styles.page}>
      <div class={styles.errorCode}>404</div>

      <h1 class={styles.title}>Location Not Found</h1>

      <p class={styles.message}>
        The Algorithm cannot locate this destination.
        The requested coordinates may have been corrupted or do not exist in the network.
      </p>

      <div class={styles.errorDetails}>
        <div class={styles.errorLine}>
          <span class={styles.errorKey}>STATUS:</span>{' '}
          <span class={styles.errorValue}>ROUTE_NOT_FOUND</span>
        </div>
        <div class={styles.errorLine}>
          <span class={styles.errorKey}>CODE:</span>{' '}
          <span class={styles.errorValue}>ERR_404_DESTINATION_UNKNOWN</span>
        </div>
        <div class={styles.errorLine}>
          <span class={styles.errorKey}>ACTION:</span>{' '}
          <span class={styles.errorValue}>RETURN_TO_SAFE_ZONE</span>
        </div>
      </div>

      <Link href="/" class={styles.button}>
        <span class={styles.buttonIcon}>◈</span>
        Return to Dashboard
      </Link>
    </div>
  );
}
