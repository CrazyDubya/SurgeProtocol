import { ComponentChildren, JSX } from 'preact';
import styles from './Card.module.css';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass' | 'terminal';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children: ComponentChildren;
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  selected?: boolean;
  class?: string;
  onClick?: () => void;
}

export interface CardHeaderProps {
  children: ComponentChildren;
  action?: ComponentChildren;
  class?: string;
}

export interface CardBodyProps {
  children: ComponentChildren;
  class?: string;
}

export interface CardFooterProps {
  children: ComponentChildren;
  align?: 'left' | 'center' | 'right' | 'between';
  class?: string;
}

/**
 * Card component with multiple variants for different contexts
 */
export function Card({
  children,
  variant = 'default',
  padding = 'md',
  interactive = false,
  selected = false,
  class: className,
  onClick,
}: CardProps) {
  const classes = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    interactive && styles.interactive,
    selected && styles.selected,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const Component = interactive ? 'button' : 'div';
  const props: JSX.HTMLAttributes<HTMLElement> = {
    class: classes,
    onClick: interactive ? onClick : undefined,
  };

  return <Component {...props}>{children}</Component>;
}

/**
 * Card header section with optional action slot
 */
export function CardHeader({ children, action, class: className }: CardHeaderProps) {
  const classes = [styles.header, className].filter(Boolean).join(' ');

  return (
    <div class={classes}>
      <div class={styles.headerContent}>{children}</div>
      {action && <div class={styles.headerAction}>{action}</div>}
    </div>
  );
}

/**
 * Card body/content section
 */
export function CardBody({ children, class: className }: CardBodyProps) {
  const classes = [styles.body, className].filter(Boolean).join(' ');
  return <div class={classes}>{children}</div>;
}

/**
 * Card footer section with alignment options
 */
export function CardFooter({ children, align = 'right', class: className }: CardFooterProps) {
  const classes = [styles.footer, styles[`align-${align}`], className].filter(Boolean).join(' ');
  return <div class={classes}>{children}</div>;
}

// Convenience exports
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
