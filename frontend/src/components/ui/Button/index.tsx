import { ComponentChildren } from 'preact';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps {
  children: ComponentChildren;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: MouseEvent) => void;
  class?: string;
}

export interface ButtonGroupProps {
  children: ComponentChildren;
  vertical?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  onClick,
  class: className,
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      class={classes}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <span class={styles.spinner} aria-hidden="true" />
      ) : null}
      <span class={loading ? styles.hiddenText : undefined}>{children}</span>
    </button>
  );
}

// Button Group for related actions
export function ButtonGroup({ children, vertical = false }: ButtonGroupProps) {
  return (
    <div class={`${styles.group} ${vertical ? styles.vertical : ''}`}>
      {children}
    </div>
  );
}
