import { useState, useMemo } from 'preact/hooks';
import type { InventoryItem, ItemType } from '@/types';
import styles from './InventoryGrid.module.css';

export interface InventoryGridProps {
  items: InventoryItem[];
  onSelect?: (item: InventoryItem) => void;
  selectedId?: string;
  maxWeight?: number;
  showFilters?: boolean;
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

const TYPE_LABELS: Record<ItemType, string> = {
  weapon: 'Weapons',
  armor: 'Armor',
  consumable: 'Consumables',
  medical: 'Medical',
  chemical: 'Chemicals',
  tech: 'Tech',
  data: 'Data',
  key: 'Keys',
  misc: 'Misc',
};

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | ItemType;

export function InventoryGrid({
  items,
  onSelect,
  selectedId,
  maxWeight = 100,
  showFilters = true,
}: InventoryGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');

  const totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
  const weightPercent = (totalWeight / maxWeight) * 100;

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.type === filter);
  }, [items, filter]);

  const itemCounts = useMemo(() => {
    const counts: Partial<Record<ItemType, number>> = {};
    items.forEach((item) => {
      counts[item.type] = (counts[item.type] || 0) + item.quantity;
    });
    return counts;
  }, [items]);

  const getConditionState = (condition?: number): 'good' | 'worn' | 'damaged' => {
    if (!condition) return 'good';
    if (condition > 70) return 'good';
    if (condition > 30) return 'worn';
    return 'damaged';
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    ...Object.entries(TYPE_LABELS).map(([key, label]) => ({
      value: key as ItemType,
      label,
    })),
  ];

  return (
    <div class={styles.inventory}>
      {/* Header */}
      <div class={styles.header}>
        <h2 class={styles.title}>Inventory</h2>
        <div class={styles.headerRight}>
          <span
            class={`${styles.capacity} ${
              weightPercent > 90 ? styles.full : weightPercent > 70 ? styles.warning : ''
            }`}
          >
            <span class={styles.capacityValue}>{totalWeight.toFixed(1)}</span> / {maxWeight} kg
          </span>
          <div class={styles.viewToggle}>
            <button
              class={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              ⊞
            </button>
            <button
              class={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div class={styles.filters}>
          {filters.map((f) => {
            const count = f.value === 'all' ? items.length : itemCounts[f.value as ItemType] || 0;
            if (f.value !== 'all' && count === 0) return null;
            return (
              <button
                key={f.value}
                class={`${styles.filterChip} ${filter === f.value ? styles.active : ''}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
                <span class={styles.filterCount}>({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Items */}
      {filteredItems.length === 0 ? (
        <div class={styles.empty}>
          <span class={styles.emptyIcon}>◇</span>
          <p class={styles.emptyText}>
            {filter === 'all' ? 'No items in inventory' : `No ${TYPE_LABELS[filter as ItemType]} found`}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div class={styles.grid}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              class={`${styles.item} ${styles[`item-${item.type}`]} ${
                selectedId === item.id ? styles.selected : ''
              } ${item.equipped ? styles.equipped : ''}`}
              onClick={() => onSelect?.(item)}
              title={item.name}
            >
              <span class={styles.itemIcon}>{TYPE_ICONS[item.type]}</span>
              <span class={styles.itemName}>{item.name}</span>
              {item.quantity > 1 && (
                <span class={styles.itemQuantity}>×{item.quantity}</span>
              )}
              {item.condition !== undefined && (
                <div class={`${styles.itemCondition} ${styles[getConditionState(item.condition)]}`}>
                  <div
                    class={styles.itemConditionFill}
                    style={{ width: `${item.condition}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div class={styles.list}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              class={`${styles.listItem} ${selectedId === item.id ? styles.selected : ''}`}
              onClick={() => onSelect?.(item)}
            >
              <div class={`${styles.listItemIcon} ${styles[`item-${item.type}`]}`}>
                {TYPE_ICONS[item.type]}
              </div>
              <div class={styles.listItemContent}>
                <h4 class={styles.listItemName}>
                  {item.name}
                  {item.quantity > 1 && ` (×${item.quantity})`}
                </h4>
                <span class={styles.listItemType}>{item.type}</span>
              </div>
              <div class={styles.listItemMeta}>
                <span class={styles.listItemValue}>¥{item.value.toLocaleString()}</span>
                <span class={styles.listItemWeight}>{item.weight}kg</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
