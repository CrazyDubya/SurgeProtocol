
import type { ItemRow } from '../items/types';

export interface Recipe {
    id: string;
    code: string;
    name: string;
    description: string | null;
    outputItem: ItemRow;
    requirements: {
        tier: number;
        skillLevel: number;
        skillId: string;
    };
    components: RecipeComponent[];
    basePrice: number;
    craftTime: number;
    xpReward: number;
    difficulty: number;
}

export interface RecipeComponent {
    category: string;
    quantity: number;
    optional: boolean;
    slot: number;
}

export interface CraftingResult {
    success: boolean;
    outputItemId?: string;
    outputQuantity?: number;
    quality?: number;
    xpGained?: number;
    message: string;
    consumedComponents?: { id: string; quantity: number }[];
}

export interface WorkbenchState {
    slots: {
        slotIndex: number;
        inventoryId: string;
        itemCode: string;
        quantity: number;
    }[];
}
