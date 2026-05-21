
import { api } from './client';

export interface BlackMarketContact {
    id: string;
    npc_name?: string; // Enriched
    contact_type: string;
    specialization: string | null;
    reliability_rating: number;
    danger_rating: number;
    trust_level: number; // From relationship
    is_hostile: number;
}

export interface BlackMarketItem {
    item_id: string;
    quantity: number;
    price: number;
    negotiable: boolean;
}

export interface BlackMarketInventory {
    inventory_id: string;
    expires_at: string;
}

export const blackMarketService = {
    async getContacts(): Promise<{ contacts: BlackMarketContact[] }> {
        return api.get('/blackmarket/contacts');
    },

    async discoverContact(contactId: string, method: string, introFrom?: string): Promise<{ success: boolean; message: string; data?: any }> {
        return api.post(`/blackmarket/contacts/${contactId}/discover`, { method, introduction_from: introFrom });
    },

    async getInventory(contactId: string): Promise<{ inventory: BlackMarketInventory; items: BlackMarketItem[] }> {
        // The backend `getInventory` returns the inventory record. 
        // We might need to fetch the actual items from the `available_items` JSON or a separate endpoint if it parses it.
        // Looking at backend `BlackMarketService.getInventory`, it returns the raw row. The items are in `available_items` (stringified JSON).
        // The client should probably parse it.
        const res = await api.get<any>(`/blackmarket/contacts/${contactId}/inventory`);
        if (res && res.available_items) {
            return {
                inventory: res,
                items: typeof res.available_items === 'string' ? JSON.parse(res.available_items) : res.available_items
            };
        }
        return { inventory: res, items: [] };
    },

    async purchaseItem(contactId: string, inventoryId: string, itemId: string, quantity: number, paymentMethod: string): Promise<{ success: boolean; message: string }> {
        return api.post('/blackmarket/buy', {
            contactId,
            inventoryId,
            itemId,
            quantity,
            paymentMethod
        });
    }
};
