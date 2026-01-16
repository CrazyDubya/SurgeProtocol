/**
 * Inventory Store Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  items,
  selectedItemId,
  currentWeight,
  maxWeight,
  inventoryFilter,
  inventorySortBy,
  inventorySortOrder,
  filteredItems,
  equippedItems,
  selectedItem,
  weightPercent,
  isOverEncumbered,
  isNearCapacity,
  itemCountsByType,
  totalInventoryValue,
  availableItemTypes,
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
  InventoryItem,
} from './inventoryStore';

// Mock inventory items
const mockItems: InventoryItem[] = [
  {
    id: 'item-1',
    name: 'Neural Interface',
    description: 'Advanced brain-computer interface',
    itemType: 'cyberware',
    rarity: 'rare',
    quantity: 1,
    weight: 0.5,
    baseValue: 5000,
    condition: 95,
    maxCondition: 100,
    isEquipped: true,
    equippedSlot: 'head',
  },
  {
    id: 'item-2',
    name: 'Stim Pack',
    description: 'Emergency healing stimulant',
    itemType: 'medical',
    rarity: 'common',
    quantity: 5,
    weight: 0.1,
    baseValue: 100,
    isEquipped: false,
  },
  {
    id: 'item-3',
    name: 'Data Spike',
    description: 'Single-use hacking tool',
    itemType: 'tech',
    rarity: 'uncommon',
    quantity: 3,
    weight: 0.2,
    baseValue: 250,
    isEquipped: false,
  },
  {
    id: 'item-4',
    name: 'Plasma Pistol',
    description: 'High-powered sidearm',
    itemType: 'weapon',
    rarity: 'epic',
    quantity: 1,
    weight: 2.5,
    baseValue: 8000,
    condition: 80,
    maxCondition: 100,
    isEquipped: true,
    equippedSlot: 'hand',
  },
];

// Helper to reset store state
function resetStore() {
  items.value = [];
  selectedItemId.value = null;
  currentWeight.value = 0;
  maxWeight.value = 100;
  inventoryFilter.value = {};
  inventorySortBy.value = 'name';
  inventorySortOrder.value = 'asc';
}

describe('Inventory Store', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('Item Management', () => {
    it('should set items', () => {
      setItems(mockItems);
      expect(items.value).toHaveLength(4);
    });

    it('should add item', () => {
      const newItem: InventoryItem = {
        id: 'item-new',
        name: 'New Item',
        itemType: 'misc',
        rarity: 'common',
        quantity: 1,
        isEquipped: false,
      };
      addItem(newItem);
      expect(items.value).toHaveLength(1);
      expect(items.value[0].name).toBe('New Item');
    });

    it('should remove item', () => {
      setItems(mockItems);
      removeItem('item-1');
      expect(items.value).toHaveLength(3);
      expect(items.value.find((i) => i.id === 'item-1')).toBeUndefined();
    });

    it('should clear selection when removed item is selected', () => {
      setItems(mockItems);
      selectItem('item-1');
      removeItem('item-1');
      expect(selectedItemId.value).toBeNull();
    });

    it('should update item quantity', () => {
      setItems(mockItems);
      updateItemQuantity('item-2', 10);
      const item = items.value.find((i) => i.id === 'item-2');
      expect(item?.quantity).toBe(10);
    });
  });

  describe('Equipment Management', () => {
    beforeEach(() => {
      setItems(mockItems);
    });

    it('should equip item', () => {
      equipItem('item-2', 'belt');
      const item = items.value.find((i) => i.id === 'item-2');
      expect(item?.isEquipped).toBe(true);
      expect(item?.equippedSlot).toBe('belt');
    });

    it('should unequip item', () => {
      unequipItem('item-1');
      const item = items.value.find((i) => i.id === 'item-1');
      expect(item?.isEquipped).toBe(false);
      expect(item?.equippedSlot).toBeUndefined();
    });

    it('should get equipped items', () => {
      const equipped = equippedItems.value;
      expect(equipped).toHaveLength(2);
      expect(equipped.every((i) => i.isEquipped)).toBe(true);
    });
  });

  describe('Selection', () => {
    beforeEach(() => {
      setItems(mockItems);
    });

    it('should select item', () => {
      selectItem('item-1');
      expect(selectedItemId.value).toBe('item-1');
    });

    it('should get selected item', () => {
      selectItem('item-1');
      expect(selectedItem.value?.name).toBe('Neural Interface');
    });

    it('should return null when no selection', () => {
      expect(selectedItem.value).toBeNull();
    });

    it('should return null when selected item not found', () => {
      selectItem('non-existent');
      expect(selectedItem.value).toBeNull();
    });

    it('should clear selection', () => {
      selectItem('item-1');
      selectItem(null);
      expect(selectedItemId.value).toBeNull();
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      setItems(mockItems);
    });

    it('should filter by type', () => {
      setInventoryFilter({ type: 'medical' });
      expect(filteredItems.value).toHaveLength(1);
      expect(filteredItems.value[0].name).toBe('Stim Pack');
    });

    it('should filter by rarity', () => {
      setInventoryFilter({ rarity: 'common' });
      expect(filteredItems.value).toHaveLength(1);
      expect(filteredItems.value[0].name).toBe('Stim Pack');
    });

    it('should filter by equipped status', () => {
      setInventoryFilter({ equipped: true });
      expect(filteredItems.value).toHaveLength(2);
    });

    it('should filter by search term', () => {
      setInventoryFilter({ search: 'stim' });
      expect(filteredItems.value).toHaveLength(1);
      expect(filteredItems.value[0].name).toBe('Stim Pack');
    });

    it('should search in description', () => {
      setInventoryFilter({ search: 'hacking' });
      expect(filteredItems.value).toHaveLength(1);
      expect(filteredItems.value[0].name).toBe('Data Spike');
    });

    it('should combine multiple filters', () => {
      setInventoryFilter({ equipped: false, rarity: 'common' });
      expect(filteredItems.value).toHaveLength(1);
    });

    it('should clear filter', () => {
      setInventoryFilter({ type: 'medical' });
      clearInventoryFilter();
      expect(filteredItems.value).toHaveLength(4);
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      setItems(mockItems);
    });

    it('should sort by name ascending', () => {
      setInventorySort('name', 'asc');
      const names = filteredItems.value.map((i) => i.name);
      expect(names).toEqual(['Data Spike', 'Neural Interface', 'Plasma Pistol', 'Stim Pack']);
    });

    it('should sort by name descending', () => {
      setInventorySort('name', 'desc');
      const names = filteredItems.value.map((i) => i.name);
      expect(names).toEqual(['Stim Pack', 'Plasma Pistol', 'Neural Interface', 'Data Spike']);
    });

    it('should sort by rarity', () => {
      setInventorySort('rarity', 'asc');
      const rarities = filteredItems.value.map((i) => i.rarity);
      expect(rarities).toEqual(['common', 'uncommon', 'rare', 'epic']);
    });

    it('should sort by value', () => {
      setInventorySort('value', 'desc');
      expect(filteredItems.value[0].name).toBe('Plasma Pistol');
      expect(filteredItems.value[filteredItems.value.length - 1].name).toBe('Stim Pack');
    });

    it('should toggle sort order', () => {
      expect(inventorySortOrder.value).toBe('asc');
      toggleSortOrder();
      expect(inventorySortOrder.value).toBe('desc');
      toggleSortOrder();
      expect(inventorySortOrder.value).toBe('asc');
    });
  });

  describe('Weight Management', () => {
    beforeEach(() => {
      setItems(mockItems);
    });

    it('should calculate weight from items', () => {
      // item-1: 0.5 * 1 = 0.5
      // item-2: 0.1 * 5 = 0.5
      // item-3: 0.2 * 3 = 0.6
      // item-4: 2.5 * 1 = 2.5
      // Total: 4.1
      expect(currentWeight.value).toBe(4.1);
    });

    it('should calculate weight percentage', () => {
      setWeightCapacity(50, 100);
      expect(weightPercent.value).toBe(50);
    });

    it('should detect over encumbered', () => {
      setWeightCapacity(0, 100);
      expect(isOverEncumbered.value).toBe(false);
      setWeightCapacity(110, 100);
      expect(isOverEncumbered.value).toBe(true);
    });

    it('should detect near capacity', () => {
      setWeightCapacity(70, 100);
      expect(isNearCapacity.value).toBe(false);
      setWeightCapacity(85, 100);
      expect(isNearCapacity.value).toBe(true);
    });

    it('should recalculate weight after quantity change', () => {
      const initialWeight = currentWeight.value;
      updateItemQuantity('item-2', 10); // 0.1 * 10 = 1.0 (was 0.5)
      expect(currentWeight.value).toBe(initialWeight + 0.5);
    });

    it('should handle zero max weight', () => {
      setWeightCapacity(50, 0);
      expect(weightPercent.value).toBe(0);
    });
  });

  describe('Computed Statistics', () => {
    beforeEach(() => {
      setItems(mockItems);
    });

    it('should count items by type', () => {
      const counts = itemCountsByType.value;
      expect(counts['cyberware']).toBe(1);
      expect(counts['medical']).toBe(5);
      expect(counts['tech']).toBe(3);
      expect(counts['weapon']).toBe(1);
    });

    it('should calculate total inventory value', () => {
      // item-1: 5000 * 1 = 5000
      // item-2: 100 * 5 = 500
      // item-3: 250 * 3 = 750
      // item-4: 8000 * 1 = 8000
      // Total: 14250
      expect(totalInventoryValue.value).toBe(14250);
    });

    it('should list available item types', () => {
      const types = availableItemTypes.value;
      expect(types).toContain('cyberware');
      expect(types).toContain('medical');
      expect(types).toContain('tech');
      expect(types).toContain('weapon');
      expect(types).toHaveLength(4);
    });
  });
});
