/**
 * Inventory Page - Manage character items and equipment
 *
 * Integrates with stores for real-time data.
 */

import { useState } from 'preact/hooks';
import type { InventoryItem as InventoryItemType } from '@/types';
import { Button, Card, Skeleton } from '@components/ui';
import { InventoryGrid, ItemDetail, VendorSellModal } from '@components/game';
import { useInventoryData } from '@/hooks';
import { toast } from '@/stores/uiStore';
import {
  items,
  equippedItems,
  currentWeight,
  maxWeight,
  weightPercent,
  isOverEncumbered,
  isNearCapacity,
  totalInventoryValue,
  selectItem,
  selectedItem,
} from '@/stores/inventoryStore';
import styles from './Inventory.module.css';

export function Inventory() {
  // Local state
  const [showSellModal, setShowSellModal] = useState(false);

  // Load data via hook
  const {
    isLoading,
    error,
    refresh,
    equip,
    unequip,
    useItem,
    discardItem,
  } = useInventoryData();

  // Transform store data to component format
  const inventoryItems: InventoryItemType[] = items.value.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    type: item.itemType.toLowerCase() as InventoryItemType['type'],
    quantity: item.quantity,
    weight: item.weight || 0,
    value: item.baseValue || 0,
    equipped: item.isEquipped,
    condition: item.condition,
    effects: [],
  }));

  // Transform equipped items
  const equippedList: InventoryItemType[] = equippedItems.value.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    type: item.itemType.toLowerCase() as InventoryItemType['type'],
    quantity: item.quantity,
    weight: item.weight || 0,
    value: item.baseValue || 0,
    equipped: true,
    condition: item.condition,
    effects: [],
  }));

  // Get selected item in component format
  const selectedInventoryItem: InventoryItemType | null = selectedItem.value
    ? {
        id: selectedItem.value.id,
        name: selectedItem.value.name,
        description: selectedItem.value.description || '',
        type: selectedItem.value.itemType.toLowerCase() as InventoryItemType['type'],
        quantity: selectedItem.value.quantity,
        weight: selectedItem.value.weight || 0,
        value: selectedItem.value.baseValue || 0,
        equipped: selectedItem.value.isEquipped,
        condition: selectedItem.value.condition,
        effects: [],
      }
    : null;

  const totalItems = items.value.reduce((sum, item) => sum + item.quantity, 0);

  const handleSelect = (item: InventoryItemType | null) => {
    selectItem(item?.id || null);
  };

  const handleUse = async () => {
    if (selectedItem.value) {
      try {
        const result = await useItem(selectedItem.value.id);
        toast.success(result.message || `Used ${selectedItem.value.name}`);
        if (result.remainingQuantity === 0) {
          selectItem(null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to use item';
        toast.error(message);
      }
    }
  };

  const handleEquip = async () => {
    if (selectedItem.value) {
      if (selectedItem.value.isEquipped) {
        await unequip(selectedItem.value.id);
      } else {
        // Default slot based on item type
        const slot = getSlotForType(selectedItem.value.itemType);
        await equip(selectedItem.value.id, slot);
      }
    }
  };

  const handleDrop = async () => {
    if (selectedItem.value) {
      try {
        const result = await discardItem(selectedItem.value.id);
        toast.success(result.message || `Discarded ${selectedItem.value.name}`);
        if (result.remainingQuantity === 0) {
          selectItem(null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to discard item';
        toast.error(message);
      }
    }
  };

  const handleSell = () => {
    if (selectedItem.value) {
      setShowSellModal(true);
    }
  };

  const handleSellConfirm = async (itemId: string, quantity: number, vendorId?: string) => {
    const item = items.value.find((i) => i.id === itemId);
    if (item) {
      const sellPrice = Math.floor((item.baseValue || 0) * 0.6 * quantity);
      if (vendorId) {
        toast.success(`Sold ${quantity}x ${item.name} for ₡${sellPrice.toLocaleString()}`);
      } else {
        toast.success(`Quick sold ${quantity}x ${item.name} for ₡${sellPrice.toLocaleString()}`);
      }
      // Refresh inventory after successful sale
      refresh();
    }
    setShowSellModal(false);
    selectItem(null);
  };

  // Loading state
  if (isLoading && inventoryItems.length === 0) {
    return (
      <div class={styles.inventory}>
        <div class={styles.main}>
          <Skeleton variant="card" height="400px" />
        </div>
        <aside class={styles.sidebar}>
          <Skeleton variant="card" height="100px" />
          <Skeleton variant="card" height="80px" />
          <Skeleton variant="card" height="200px" />
        </aside>
      </div>
    );
  }

  // Error state
  if (error && inventoryItems.length === 0) {
    return (
      <div class={styles.inventory}>
        <Card variant="outlined" padding="lg">
          <p>Error loading inventory: {error}</p>
          <button onClick={refresh}>Retry</button>
        </Card>
      </div>
    );
  }

  return (
    <div class={styles.inventory}>
      {/* Main Content - Inventory Grid */}
      <div class={styles.main}>
        <InventoryGrid
          items={inventoryItems}
          selectedId={selectedInventoryItem?.id}
          onSelect={handleSelect}
          maxWeight={maxWeight.value}
          showFilters
        />
      </div>

      {/* Sidebar */}
      <aside class={styles.sidebar}>
        {/* Capacity */}
        <div class={styles.capacityCard}>
          <div class={styles.capacityHeader}>
            <span class={styles.capacityLabel}>Carry Capacity</span>
            <span
              class={`${styles.capacityValue} ${
                isOverEncumbered.value ? styles.full : isNearCapacity.value ? styles.warning : ''
              }`}
            >
              {currentWeight.value.toFixed(1)} / {maxWeight.value} kg
            </span>
          </div>
          <div class={styles.capacityBar}>
            <div
              class={`${styles.capacityFill} ${
                isOverEncumbered.value ? styles.full : isNearCapacity.value ? styles.warning : ''
              }`}
              style={{ width: `${Math.min(weightPercent.value, 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div class={styles.quickStats}>
          <div class={styles.quickStat}>
            <span class={styles.quickStatLabel}>Items</span>
            <span class={styles.quickStatValue}>{totalItems}</span>
          </div>
          <div class={styles.quickStat}>
            <span class={styles.quickStatLabel}>Total Value</span>
            <span class={`${styles.quickStatValue} ${styles.highlight}`}>
              ₡{totalInventoryValue.value.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Selected Item Detail */}
        <ItemDetail
          item={selectedInventoryItem}
          onUse={handleUse}
          onEquip={handleEquip}
          onDrop={handleDrop}
          onSell={handleSell}
        />

        {/* Equipped Items */}
        <div class={styles.equippedSection}>
          <h3 class={styles.sectionTitle}>Equipped</h3>
          <div class={styles.equippedList}>
            {equippedList.length > 0 ? (
              equippedList.map((item) => (
                <div
                  key={item.id}
                  class={styles.equippedItem}
                  onClick={() => handleSelect(item)}
                >
                  <span class={styles.equippedIcon}>
                    {item.type === 'weapon' ? '⚔' : '◆'}
                  </span>
                  <div class={styles.equippedInfo}>
                    <h4 class={styles.equippedName}>{item.name}</h4>
                    <span class={styles.equippedSlot}>{item.type}</span>
                  </div>
                </div>
              ))
            ) : (
              <div class={styles.emptySlot}>No items equipped</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div class={styles.actions}>
          <Button variant="secondary" fullWidth onClick={refresh}>
            Refresh
          </Button>
        </div>
      </aside>

      {/* Vendor Sell Modal */}
      {showSellModal && selectedInventoryItem && (
        <VendorSellModal
          item={selectedInventoryItem}
          onSell={handleSellConfirm}
          onClose={() => setShowSellModal(false)}
        />
      )}
    </div>
  );
}

// Helper to determine equipment slot based on item type
function getSlotForType(itemType: string): string {
  const slotMap: Record<string, string> = {
    weapon: 'hand_right',
    armor: 'torso',
    helmet: 'head',
    boots: 'feet',
    gloves: 'hands',
    cyberware: 'neural',
  };
  return slotMap[itemType.toLowerCase()] || 'accessory';
}
