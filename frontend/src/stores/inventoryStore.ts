/**
 * Inventory Store - Item and equipment management
 *
 * Handles:
 * - Inventory items
 * - Equipped items
 * - Item filtering and sorting
 * - Weight capacity
 */

import { signal, computed } from '@preact/signals';

// =============================================================================
// TYPES
// =============================================================================

export interface InventoryItem {
  id: string;
  instanceId: string;
  itemId: string;
  name: string;
  description: string;
  itemType: ItemType;
  rarity: ItemRarity;
  quantity: number;
  maxStack: number;
  weight: number;
  baseValue: number;
  condition: number;
  maxCondition: number;
  isEquipped: boolean;
  equippedSlot?: string;
  effects?: ItemEffect[];
  stats?: ItemStat[];
}

export interface ItemEffect {
  effectType: string;
  value: number;
  duration?: number;
  description: string;
}

export interface ItemStat {
  statName: string;
  value: number;
  isBonus: boolean;
}

export type ItemType =
  | 'weapon'
  | 'armor'
  | 'consumable'
  | 'medical'
  | 'chemical'
  | 'tech'
  | 'cyberware'
  | 'data'
  | 'key'
  | 'quest'
  | 'misc';

export type ItemRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'unique';

export interface InventoryFilter {
  type?: ItemType;
  rarity?: ItemRarity;
  equipped?: boolean;
  search?: string;
}

export type InventorySortBy =
  | 'name'
  | 'type'
  | 'rarity'
  | 'value'
  | 'weight'
  | 'condition';

export type SortOrder = 'asc' | 'desc';

// =============================================================================
// STATE SIGNALS
// =============================================================================

// Items
export const items = signal<InventoryItem[]>([]);
export const selectedItemId = signal<string | null>(null);

// Capacity
export const currentWeight = signal(0);
export const maxWeight = signal(100);

// Filter and sort
export const inventoryFilter = signal<InventoryFilter>({});
export const inventorySortBy = signal<InventorySortBy>('name');
export const inventorySortOrder = signal<SortOrder>('asc');

// Loading states
export const isLoadingInventory = signal(false);
export const inventoryError = signal<string | null>(null);

// =============================================================================
// COMPUTED VALUES
// =============================================================================

/** Filtered and sorted items */
export const filteredItems = computed(() => {
  const allItems = items.value;
  const filter = inventoryFilter.value;
  const sortBy = inventorySortBy.value;
  const sortOrder = inventorySortOrder.value;

  // Filter
  let filtered = allItems.filter((item) => {
    if (filter.type && item.itemType !== filter.type) return false;
    if (filter.rarity && item.rarity !== filter.rarity) return false;
    if (filter.equipped !== undefined && item.isEquipped !== filter.equipped) {
      return false;
    }
    if (filter.search) {
      const search = filter.search.toLowerCase();
      if (
        !item.name.toLowerCase().includes(search) &&
        !item.description.toLowerCase().includes(search)
      ) {
        return false;
      }
    }
    return true;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'type':
        comparison = a.itemType.localeCompare(b.itemType);
        break;
      case 'rarity':
        comparison = getRarityOrder(a.rarity) - getRarityOrder(b.rarity);
        break;
      case 'value':
        comparison = a.baseValue - b.baseValue;
        break;
      case 'weight':
        comparison = a.weight - b.weight;
        break;
      case 'condition':
        comparison = a.condition - b.condition;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return filtered;
});

/** Equipped items only */
export const equippedItems = computed(() =>
  items.value.filter((item) => item.isEquipped)
);

/** Selected item details */
export const selectedItem = computed(() =>
  items.value.find((item) => item.instanceId === selectedItemId.value) || null
);

/** Weight usage percentage */
export const weightPercent = computed(() => {
  const max = maxWeight.value;
  if (max <= 0) return 0;
  return Math.min(100, Math.round((currentWeight.value / max) * 100));
});

/** Is over encumbered */
export const isOverEncumbered = computed(() =>
  currentWeight.value > maxWeight.value
);

/** Is near capacity (> 80%) */
export const isNearCapacity = computed(() => weightPercent.value > 80);

/** Item counts by type */
export const itemCountsByType = computed(() => {
  const counts: Record<string, number> = {};
  for (const item of items.value) {
    counts[item.itemType] = (counts[item.itemType] || 0) + item.quantity;
  }
  return counts;
});

/** Total inventory value */
export const totalInventoryValue = computed(() =>
  items.value.reduce((sum, item) => sum + item.baseValue * item.quantity, 0)
);

/** Unique item types in inventory */
export const availableItemTypes = computed(() => {
  const types = new Set(items.value.map((item) => item.itemType));
  return Array.from(types) as ItemType[];
});

// =============================================================================
// HELPERS
// =============================================================================

function getRarityOrder(rarity: ItemRarity): number {
  const order: Record<ItemRarity, number> = {
    common: 0,
    uncommon: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
    unique: 5,
  };
  return order[rarity] ?? 0;
}

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Set inventory items
 */
export function setItems(newItems: InventoryItem[]): void {
  items.value = newItems;
  recalculateWeight();
}

/**
 * Add item to inventory
 */
export function addItem(item: InventoryItem): void {
  items.value = [...items.value, item];
  recalculateWeight();
}

/**
 * Remove item from inventory
 */
export function removeItem(instanceId: string): void {
  items.value = items.value.filter((item) => item.instanceId !== instanceId);
  if (selectedItemId.value === instanceId) {
    selectedItemId.value = null;
  }
  recalculateWeight();
}

/**
 * Update item quantity
 */
export function updateItemQuantity(instanceId: string, quantity: number): void {
  items.value = items.value.map((item) =>
    item.instanceId === instanceId ? { ...item, quantity } : item
  );
  recalculateWeight();
}

/**
 * Equip item
 */
export function equipItem(instanceId: string, slot: string): void {
  items.value = items.value.map((item) =>
    item.instanceId === instanceId
      ? { ...item, isEquipped: true, equippedSlot: slot }
      : item
  );
}

/**
 * Unequip item
 */
export function unequipItem(instanceId: string): void {
  items.value = items.value.map((item) =>
    item.instanceId === instanceId
      ? { ...item, isEquipped: false, equippedSlot: undefined }
      : item
  );
}

/**
 * Select item for details view
 */
export function selectItem(instanceId: string | null): void {
  selectedItemId.value = instanceId;
}

/**
 * Set filter
 */
export function setInventoryFilter(filter: InventoryFilter): void {
  inventoryFilter.value = filter;
}

/**
 * Clear filter
 */
export function clearInventoryFilter(): void {
  inventoryFilter.value = {};
}

/**
 * Set sort
 */
export function setInventorySort(sortBy: InventorySortBy, order?: SortOrder): void {
  inventorySortBy.value = sortBy;
  if (order) {
    inventorySortOrder.value = order;
  }
}

/**
 * Toggle sort order
 */
export function toggleSortOrder(): void {
  inventorySortOrder.value =
    inventorySortOrder.value === 'asc' ? 'desc' : 'asc';
}

/**
 * Set weight capacity
 */
export function setWeightCapacity(max: number): void {
  maxWeight.value = max;
}

/**
 * Recalculate current weight from items
 */
export function recalculateWeight(): void {
  currentWeight.value = items.value.reduce(
    (sum, item) => sum + item.weight * item.quantity,
    0
  );
}

/**
 * Set loading state
 */
export function setLoadingInventory(loading: boolean): void {
  isLoadingInventory.value = loading;
}

/**
 * Set error
 */
export function setInventoryError(error: string | null): void {
  inventoryError.value = error;
}

/**
 * Clear all inventory data
 */
export function clearInventoryData(): void {
  items.value = [];
  selectedItemId.value = null;
  currentWeight.value = 0;
  inventoryFilter.value = {};
  inventoryError.value = null;
}

// =============================================================================
// STORE EXPORT
// =============================================================================

export const inventoryStore = {
  // State
  items,
  selectedItemId,
  currentWeight,
  maxWeight,
  inventoryFilter,
  inventorySortBy,
  inventorySortOrder,
  isLoadingInventory,
  inventoryError,

  // Computed
  filteredItems,
  equippedItems,
  selectedItem,
  weightPercent,
  isOverEncumbered,
  isNearCapacity,
  itemCountsByType,
  totalInventoryValue,
  availableItemTypes,

  // Actions
  setItems,
  addItem,
  removeItem,
  updateItemQuantity,
  equipItem,
  unequipItem,
  selectItem,
  setInventoryFilter,
  clearInventoryFilter,
  setInventorySort,
  toggleSortOrder,
  setWeightCapacity,
  recalculateWeight,
  setLoadingInventory,
  setInventoryError,
  clearInventoryData,
};

export default inventoryStore;
