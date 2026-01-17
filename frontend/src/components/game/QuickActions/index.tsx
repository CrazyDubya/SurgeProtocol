import { ComponentChildren } from 'preact';
import { Card, Button, Badge } from '@components/ui';
import styles from './QuickActions.module.css';

export interface QuickAction {
  id: string;
  label: string;
  icon?: ComponentChildren;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'primary' | 'danger' | 'warning' | 'success';
  disabled?: boolean;
  onClick: () => void;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
  columns?: 1 | 2 | 3 | 4;
  class?: string;
}

/**
 * Quick actions grid for common operations
 */
export function QuickActions({
  actions,
  title = 'Quick Actions',
  columns = 2,
  class: className,
}: QuickActionsProps) {
  const classes = [styles.quickActions, className].filter(Boolean).join(' ');

  return (
    <Card variant="default" padding="md" class={classes}>
      {title && <h3 class={styles.title}>{title}</h3>}
      <div class={styles.grid} style={{ '--columns': columns }}>
        {actions.map((action) => (
          <QuickActionButton key={action.id} action={action} />
        ))}
      </div>
    </Card>
  );
}

function QuickActionButton({ action }: { action: QuickAction }) {
  return (
    <button
      class={styles.actionButton}
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {action.icon && <span class={styles.actionIcon}>{action.icon}</span>}
      <div class={styles.actionContent}>
        <span class={styles.actionLabel}>{action.label}</span>
        {action.description && (
          <span class={styles.actionDescription}>{action.description}</span>
        )}
      </div>
      {action.badge && (
        <Badge variant={action.badgeVariant || 'default'} size="xs">
          {action.badge}
        </Badge>
      )}
    </button>
  );
}

/**
 * Navigation action row (horizontal)
 */
export interface NavAction {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  badge?: string | number;
}

export interface NavActionsProps {
  actions: NavAction[];
  class?: string;
}

export function NavActions({ actions, class: className }: NavActionsProps) {
  const classes = [styles.navActions, className].filter(Boolean).join(' ');

  return (
    <nav class={classes}>
      {actions.map((action) => (
        <a
          key={action.id}
          href={action.href}
          class={`${styles.navAction} ${action.active ? styles.navActive : ''}`}
          onClick={action.onClick}
          aria-disabled={action.disabled}
        >
          <span class={styles.navLabel}>{action.label}</span>
          {action.badge !== undefined && (
            <span class={styles.navBadge}>{action.badge}</span>
          )}
        </a>
      ))}
    </nav>
  );
}

/**
 * Stat action card - displays a stat with an action
 */
export interface StatActionProps {
  label: string;
  value: string | number;
  actionLabel: string;
  onAction: () => void;
  variant?: 'default' | 'highlight' | 'warning' | 'danger';
  class?: string;
}

export function StatAction({
  label,
  value,
  actionLabel,
  onAction,
  variant = 'default',
  class: className,
}: StatActionProps) {
  const classes = [styles.statAction, styles[`statAction-${variant}`], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={classes}>
      <div class={styles.statContent}>
        <span class={styles.statLabel}>{label}</span>
        <span class={styles.statValue}>{value}</span>
      </div>
      <Button variant="ghost" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
