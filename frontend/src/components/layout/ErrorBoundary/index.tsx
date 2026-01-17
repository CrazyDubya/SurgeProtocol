/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors in child components and displays
 * a fallback UI instead of crashing the whole app.
 *
 * Features:
 * - Cyberpunk-themed error display
 * - Error logging capability
 * - Retry functionality
 * - Accessible error messaging
 */

import { Component, ComponentChildren } from 'preact';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ComponentChildren;
  /** Custom fallback UI */
  fallback?: ComponentChildren;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  /** Reset key - when changed, resets the error state */
  resetKey?: string | number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    this.setState({ errorInfo: errorInfo.componentStack });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state when resetKey changes
    if (
      this.state.hasError &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div class={styles.errorContainer} role="alert" aria-live="assertive">
          <div class={styles.errorContent}>
            <div class={styles.glitchHeader}>
              <span class={styles.errorIcon}>⚠</span>
              <h2 class={styles.errorTitle}>SYSTEM MALFUNCTION</h2>
            </div>

            <div class={styles.errorMessage}>
              <p class={styles.errorCode}>ERROR CODE: {this.state.error?.name || 'UNKNOWN'}</p>
              <p class={styles.errorDescription}>
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>

            {import.meta.env.DEV && this.state.errorInfo && (
              <details class={styles.errorDetails}>
                <summary>Stack Trace</summary>
                <pre class={styles.stackTrace}>{this.state.errorInfo}</pre>
              </details>
            )}

            <div class={styles.errorActions}>
              <button class={styles.retryButton} onClick={this.handleRetry}>
                <span class={styles.buttonIcon}>↻</span>
                REINITIALIZE
              </button>
              <button
                class={styles.homeButton}
                onClick={() => (window.location.href = '/')}
              >
                <span class={styles.buttonIcon}>⌂</span>
                RETURN TO HUB
              </button>
            </div>

            <div class={styles.diagnostics}>
              <span class={styles.diagLine}>◇ Neural link status: INTERRUPTED</span>
              <span class={styles.diagLine}>◇ Attempting recovery protocol...</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-friendly error boundary wrapper
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: preact.ComponentType<P>,
  fallback?: ComponentChildren
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
