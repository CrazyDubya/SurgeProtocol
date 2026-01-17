/**
 * useInventoryData - Hook for loading inventory data into stores
 *
 * Fetches inventory items, manages equipment, and handles item actions.
 */

import { useEffect, useCallback } from 'preact/hooks';
import { characterService } from '@/api';
import { api } from '@/api/client';
import {
  items,
  setItems,
  equipItem,
  unequipItem,
  setWeightCapacity,
  setLoadingInventory,
  setInventoryError,
  isLoadingInventory,
  inventoryError,
  filteredItems,
  equippedItems,
  selectedItem,
  weightPercent,
  isOverEncumbered,
  totalInventoryValue,
} from '@/stores';
import { activeCharacterId } from '@/stores/authStore';
import { setFinances } from '@/stores/characterStore';
import { toast } from '@/stores/uiStore';

export function useInventoryData() {
  const characterId = activeCharacterId.value;

  /**
   * Load inventory from API
   */
  const loadInventory = useCallback(async () => {
    if (!characterId) return;

    setLoadingInventory(true);
    setInventoryError(null);

    try {
      const response = await characterService.getInventory(characterId);

      // Transform and set inventory items
      setItems(response.inventory.map((item) => ({
        id: item.id,
        itemId: item.itemId,
        name: item.name,
        description: item.description,
        itemType: item.itemType as any,
        rarity: item.rarity as any,
        quantity: item.quantity,
        maxStack: item.maxStack,
        weight: item.weight,
        baseValue: item.baseValue,
        condition: item.condition,
        maxCondition: item.maxCondition,
        isEquipped: item.isEquipped,
        equippedSlot: item.equippedSlot,
      })));

      // Set weight capacity
      setWeightCapacity(response.capacity.used, response.capacity.max);

      // Set finances if provided
      if (response.finances) {
        setFinances({
          credits: response.finances.credits,
          creditsLifetime: response.finances.creditsLifetime,
          escrowHeld: response.finances.escrowHeld,
        });
      }
    } catch (err) {
      setInventoryError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoadingInventory(false);
    }
  }, [characterId]);

  /**
   * Equip an item
   */
  const equip = useCallback(async (itemId: string, slot: string) => {
    try {
      // Optimistic update
      equipItem(itemId, slot);
      toast.success('Item equipped');
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to equip item');
      // Reload inventory to restore state
      loadInventory();
      return false;
    }
  }, [loadInventory]);

  /**
   * Unequip an item
   */
  const unequip = useCallback(async (itemId: string) => {
    try {
      // Optimistic update
      unequipItem(itemId);
      toast.success('Item unequipped');
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to unequip item');
      // Reload inventory to restore state
      loadInventory();
      return false;
    }
  }, [loadInventory]);

  /**
   * Use a consumable item
   */
  const useItem = useCallback(async (inventoryId: string) => {
    const result = await api.post<{
      itemUsed: string;
      effects: string[];
      remainingQuantity: number;
      message: string;
    }>(`/items/inventory/${inventoryId}/use`);

    // Refresh inventory to reflect changes
    loadInventory();

    return result;
  }, [loadInventory]);

  /**
   * Drop/discard an item
   */
  const discardItem = useCallback(async (inventoryId: string, quantity: number = 1) => {
    const result = await api.delete<{
      discarded: { inventoryId: string; name: string; quantity: number };
      remainingQuantity: number;
      message: string;
    }>(`/items/inventory/${inventoryId}?quantity=${quantity}`);

    // Refresh inventory to reflect changes
    loadInventory();

    return result;
  }, [loadInventory]);

  /**
   * Refresh inventory data
   */
  const refresh = useCallback(() => {
    loadInventory();
  }, [loadInventory]);

  // Auto-load on mount if character is selected
  useEffect(() => {
    if (characterId && items.value.length === 0) {
      loadInventory();
    }
  }, [characterId, loadInventory]);

  return {
    // State
    items: items.value,
    filteredItems: filteredItems.value,
    equippedItems: equippedItems.value,
    selectedItem: selectedItem.value,
    weightPercent: weightPercent.value,
    isOverEncumbered: isOverEncumbered.value,
    totalValue: totalInventoryValue.value,
    isLoading: isLoadingInventory.value,
    error: inventoryError.value,
    // Actions
    loadInventory,
    refresh,
    equip,
    unequip,
    useItem,
    discardItem,
  };
}

export default useInventoryData;
