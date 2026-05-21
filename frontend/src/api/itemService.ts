
import { api } from './client';

export interface ItemRow {
    id: string;
    code: string;
    name: string;
    description: string | null;
    item_type: string | null;
    item_subtype: string | null;
    rarity: string;
    quality_tier: number;
    base_price: number;
    weight_kg: number;
    icon_asset: string | null;
}

export interface InventoryItem extends ItemRow {
    inventoryId: string;
    quantity: number;
    equipped_slot: string | null;
    quick_slot: number | null;
    current_durability: number;
    current_charges: number | null;
    current_ammo: number | null;
    is_damaged: number;
    is_broken: number;
    custom_name: string | null;
}

export const itemService = {
    async getInventory(): Promise<{ items: InventoryItem[], totalWeight: number }> {
        return api.get('/items/inventory');
    },

    async useItem(inventoryId: string): Promise<{ success: boolean; message: string; effects: string[] }> {
        return api.post(`/items/inventory/${inventoryId}/use`);
    },

    async equipItem(inventoryId: string, slot?: string): Promise<{ success: boolean; equipped_slot: string }> {
        return api.post(`/items/inventory/${inventoryId}/equip`, { slot });
    },

    async unequipItem(inventoryId: string): Promise<void> {
        return api.post(`/items/inventory/${inventoryId}/unequip`);
    },

    async discardItem(inventoryId: string, quantity: number): Promise<{ discarded: number; remaining: number }> {
        return api.post(`/items/inventory/${inventoryId}/discard`, { quantity });
    }
};
