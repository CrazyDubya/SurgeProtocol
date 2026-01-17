import type { InventoryItem, ItemType } from '@/types';
import { Badge, Button } from '@components/ui';
import styles from './ItemDetail.module.css';

export interface ItemDetailProps {
  item: InventoryItem | null;
  onUse?: () => void;
  onEquip?: () => void;
  onDrop?: () => void;
  onSell?: () => void;
  compact?: boolean;
}

const TYPE_ICONS: Record<ItemType, string> = {
  weapon: '⚔',
  armor: '◆',
  consumable: '◎',
  medical: '✚',
  chemical: '◈',
  tech: '⬡',
  data: '◇',
  key: '⚿',
  misc: '○',
};

const TYPE_COLORS: Record<ItemType, 'danger' | 'info' | 'success' | 'warning' | 'default' | 'algorithm' | 'humanity'> = {
  weapon: 'danger',
  armor: 'info',
  consumable: 'success',
  medical: 'danger',
  chemical: 'warning',
  tech: 'algorithm',
  data: 'humanity',
  key: 'warning',
  misc: 'default',
};

export function ItemDetail({
  item,
  onUse,
  onEquip,
  onDrop,
  onSell,
  compact = false,
}: ItemDetailProps) {
  if (!item) {
    return (
      <div class={`${styles.detail} ${compact ? styles.compact : ''}`}>
        <div class={styles.empty}>
          <span class={styles.emptyIcon}>◇</span>
          <p class={styles.emptyText}>Select an item to view details</p>
        </div>
      </div>
    );
  }

  const getConditionState = (condition?: number): 'good' | 'worn' | 'damaged' => {
    if (!condition) return 'good';
    if (condition > 70) return 'good';
    if (condition > 30) return 'worn';
    return 'damaged';
  };

  const conditionState = getConditionState(item.condition);

  const canUse = ['consumable', 'medical', 'chemical'].includes(item.type);
  const canEquip = ['weapon', 'armor'].includes(item.type);

  return (
    <div class={`${styles.detail} ${compact ? styles.compact : ''}`}>
      {/* Header */}
      <div class={styles.header}>
        <div class={`${styles.icon} ${styles[`icon-${item.type}`]}`}>
          {TYPE_ICONS[item.type]}
        </div>
        <div class={styles.headerContent}>
          <h3 class={styles.name}>{item.name}</h3>
          <div class={styles.typeBadge}>
            <Badge variant={TYPE_COLORS[item.type]} size="sm">
              {item.type}
            </Badge>
            {item.equipped && (
              <Badge variant="success" size="sm">
                Equipped
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p class={styles.description}>{item.description}</p>

      {/* Stats */}
      <div class={styles.stats}>
        <div class={styles.stat}>
          <span class={styles.statLabel}>Value</span>
          <span class={`${styles.statValue} ${styles.highlight}`}>
            ¥{item.value.toLocaleString()}
          </span>
        </div>
        <div class={styles.stat}>
          <span class={styles.statLabel}>Weight</span>
          <span class={styles.statValue}>{item.weight} kg</span>
        </div>
        <div class={styles.stat}>
          <span class={styles.statLabel}>Quantity</span>
          <span class={styles.statValue}>{item.quantity}</span>
        </div>
        <div class={styles.stat}>
          <span class={styles.statLabel}>Total Weight</span>
          <span class={styles.statValue}>{(item.weight * item.quantity).toFixed(1)} kg</span>
        </div>
      </div>

      {/* Condition */}
      {item.condition !== undefined && (
        <div class={styles.condition}>
          <div class={styles.conditionHeader}>
            <span class={styles.conditionLabel}>Condition</span>
            <span class={styles.conditionValue}>{item.condition}%</span>
          </div>
          <div class={styles.conditionBar}>
            <div
              class={`${styles.conditionFill} ${styles[conditionState]}`}
              style={{ width: `${item.condition}%` }}
            />
          </div>
        </div>
      )}

      {/* Effects */}
      {item.effects && item.effects.length > 0 && (
        <div class={styles.effects}>
          <span class={styles.effectsTitle}>Effects</span>
          {item.effects.map((effect, i) => (
            <div
              key={i}
              class={`${styles.effect} ${effect.modifier >= 0 ? styles.positive : styles.negative}`}
            >
              <span class={styles.effectIcon}>
                {effect.modifier >= 0 ? '▲' : '▼'}
              </span>
              <span class={styles.effectText}>{effect.stat}</span>
              <span class={styles.effectValue}>
                {effect.modifier >= 0 ? '+' : ''}{effect.modifier}
                {effect.duration && ` (${effect.duration}s)`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div class={styles.actions}>
        {canUse && onUse && (
          <Button variant="primary" size="sm" onClick={onUse}>
            Use
          </Button>
        )}
        {canEquip && onEquip && (
          <Button
            variant={item.equipped ? 'ghost' : 'primary'}
            size="sm"
            onClick={onEquip}
          >
            {item.equipped ? 'Unequip' : 'Equip'}
          </Button>
        )}
        {onSell && (
          <Button variant="secondary" size="sm" onClick={onSell}>
            Sell
          </Button>
        )}
        {onDrop && (
          <Button variant="ghost" size="sm" onClick={onDrop}>
            Drop
          </Button>
        )}
      </div>
    </div>
  );
}
