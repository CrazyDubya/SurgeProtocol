import { ComponentChildren } from 'preact';
import styles from './Stat.module.css';

export type StatVariant = 'default' | 'highlight' | 'danger' | 'warning' | 'success' | 'muted';
export type StatSize = 'sm' | 'md' | 'lg' | 'xl';

export interface StatProps {
  /** The stat value to display */
  value: string | number;
  /** Label describing the stat */
  label: ComponentChildren;
  /** Optional secondary value or change indicator */
  change?: string | number;
  /** Whether change is positive */
  changePositive?: boolean;
  /** Visual variant */
  variant?: StatVariant;
  /** Size of the stat display */
  size?: StatSize;
  /** Optional icon */
  icon?: ComponentChildren;
  /** Additional class */
  class?: string;
}

/**
 * Stat component for displaying key metrics with labels
 */
export function Stat({
  value,
  label,
  change,
  changePositive,
  variant = 'default',
  size = 'md',
  icon,
  class: className,
}: StatProps) {
  const classes = [styles.stat, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={classes}>
      {icon && <div class={styles.icon}>{icon}</div>}
      <div class={styles.content}>
        <div class={styles.value}>{value}</div>
        <div class={styles.label}>{label}</div>
        {change !== undefined && (
          <div
            class={[
              styles.change,
              changePositive === true && styles.positive,
              changePositive === false && styles.negative,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {changePositive === true && '↑'}
            {changePositive === false && '↓'}
            {change}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Stat group for displaying multiple stats in a row
 */
export interface StatGroupProps {
  children: ComponentChildren;
  /** Columns layout (default: auto-fit) */
  columns?: number;
  /** Gap between stats */
  gap?: 'sm' | 'md' | 'lg';
  /** Dividers between stats */
  dividers?: boolean;
  class?: string;
}

export function StatGroup({
  children,
  columns,
  gap = 'md',
  dividers = false,
  class: className,
}: StatGroupProps) {
  const classes = [
    styles.group,
    styles[`gap-${gap}`],
    dividers && styles.dividers,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const style = columns
    ? { gridTemplateColumns: `repeat(${columns}, 1fr)` }
    : undefined;

  return (
    <div class={classes} style={style}>
      {children}
    </div>
  );
}

// Convenience exports
Stat.Group = StatGroup;

/**
 * Character attribute display (specialized stat)
 */
export interface AttributeStatProps {
  name: string;
  base: number;
  modified?: number;
  max?: number;
  class?: string;
}

export function AttributeStat({
  name,
  base,
  modified,
  max = 20,
  class: className,
}: AttributeStatProps) {
  const effectiveValue = modified ?? base;
  const isModified = modified !== undefined && modified !== base;
  const isBuffed = isModified && modified > base;
  const isDebuffed = isModified && modified < base;

  const classes = [
    styles.attribute,
    isBuffed && styles.buffed,
    isDebuffed && styles.debuffed,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={classes}>
      <div class={styles.attrName}>{name}</div>
      <div class={styles.attrValue}>
        <span class={styles.attrCurrent}>{effectiveValue}</span>
        {isModified && <span class={styles.attrBase}>({base})</span>}
        <span class={styles.attrMax}>/{max}</span>
      </div>
      <div class={styles.attrBar}>
        <div
          class={styles.attrFill}
          style={{ width: `${(effectiveValue / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

Stat.Attribute = AttributeStat;
