import { ComponentChildren } from 'preact';
import styles from './Progress.module.css';

export type ProgressVariant = 'default' | 'health' | 'humanity' | 'xp' | 'time' | 'danger' | 'warning' | 'success';
export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ProgressProps {
  /** Current value (0-100 by default, or use max prop) */
  value: number;
  /** Maximum value (defaults to 100) */
  max?: number;
  /** Visual variant */
  variant?: ProgressVariant;
  /** Size of the progress bar */
  size?: ProgressSize;
  /** Show value label */
  showLabel?: boolean;
  /** Custom label format */
  labelFormat?: (value: number, max: number) => string;
  /** Show percentage instead of value/max */
  showPercentage?: boolean;
  /** Animated fill */
  animated?: boolean;
  /** Striped pattern */
  striped?: boolean;
  /** Show glow effect */
  glow?: boolean;
  /** Optional label above progress bar */
  label?: ComponentChildren;
  /** Additional class */
  class?: string;
}

/**
 * Progress bar component for HP, Humanity, XP, Time, and general progress
 */
export function Progress({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  labelFormat,
  showPercentage = false,
  animated = false,
  striped = false,
  glow = false,
  label,
  class: className,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // Auto-detect danger state for health/humanity
  const effectiveVariant =
    (variant === 'health' || variant === 'humanity') && percentage <= 25
      ? 'danger'
      : variant;

  const classes = [
    styles.progress,
    styles[effectiveVariant],
    styles[size],
    animated && styles.animated,
    striped && styles.striped,
    glow && styles.glow,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const formatLabel = () => {
    if (labelFormat) {
      return labelFormat(value, max);
    }
    if (showPercentage) {
      return `${Math.round(percentage)}%`;
    }
    return `${value}/${max}`;
  };

  return (
    <div class={classes}>
      {label && <div class={styles.label}>{label}</div>}
      <div class={styles.track}>
        <div
          class={styles.fill}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
        {showLabel && (
          <span class={styles.value}>{formatLabel()}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Circular progress indicator
 */
export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
  class?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  variant = 'default',
  showLabel = false,
  class: className,
}: CircularProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const classes = [styles.circular, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={classes} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          class={styles.circularTrack}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          class={styles.circularFill}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showLabel && (
        <span class={styles.circularLabel}>{Math.round(percentage)}%</span>
      )}
    </div>
  );
}

// Convenience exports
Progress.Circular = CircularProgress;
