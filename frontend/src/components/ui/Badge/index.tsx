import { ComponentChildren } from 'preact';
import styles from './Badge.module.css';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'algorithm'
  | 'humanity'
  | 'corp'
  | 'street';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: ComponentChildren;
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Pill shape (fully rounded) */
  pill?: boolean;
  /** Outline style instead of filled */
  outline?: boolean;
  /** Add pulsing animation */
  pulse?: boolean;
  /** Add glow effect */
  glow?: boolean;
  /** Optional icon before text */
  icon?: ComponentChildren;
  /** Remove function to make dismissible */
  onRemove?: () => void;
  class?: string;
}

/**
 * Badge component for status indicators, tags, and labels
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  pill = false,
  outline = false,
  pulse = false,
  glow = false,
  icon,
  onRemove,
  class: className,
}: BadgeProps) {
  const classes = [
    styles.badge,
    styles[variant],
    styles[size],
    pill && styles.pill,
    outline && styles.outline,
    pulse && styles.pulse,
    glow && styles.glow,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span class={classes}>
      {icon && <span class={styles.icon}>{icon}</span>}
      <span class={styles.text}>{children}</span>
      {onRemove && (
        <button
          type="button"
          class={styles.remove}
          onClick={onRemove}
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
}

/**
 * Badge group for displaying multiple badges
 */
export interface BadgeGroupProps {
  children: ComponentChildren;
  class?: string;
}

export function BadgeGroup({ children, class: className }: BadgeGroupProps) {
  const classes = [styles.group, className].filter(Boolean).join(' ');
  return <div class={classes}>{children}</div>;
}

// Convenience exports
Badge.Group = BadgeGroup;

/**
 * Status indicator dot (minimal badge)
 */
export interface StatusDotProps {
  status: 'online' | 'offline' | 'busy' | 'away' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  label?: string;
  class?: string;
}

export function StatusDot({
  status,
  size = 'md',
  pulse = false,
  label,
  class: className,
}: StatusDotProps) {
  const classes = [
    styles.statusDot,
    styles[`dot-${status}`],
    styles[`dot-${size}`],
    pulse && styles.pulse,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span class={classes} aria-label={label || status}>
      {label && <span class={styles.statusLabel}>{label}</span>}
    </span>
  );
}

Badge.StatusDot = StatusDot;
