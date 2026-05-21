
import { api } from './client';
import type { ItemRow } from './itemService';

export interface Recipe {
    id: string;
    name: string;
    description: string;
    outputItem: ItemRow;
    requirements: {
        tier: number;
        skillLevel: number;
    };
    components: {
        category: string;
        quantity: number;
        optional: boolean;
    }[];
    craftTime: number;
    difficulty: number;
}

export interface CraftingResult {
    success: boolean;
    message: string;
    outputItemId?: string;
    xpGained?: number;
}

export const craftingService = {
    async getRecipes(filters?: { category?: string; maxTier?: number }): Promise<{ recipes: Recipe[] }> {
        const params: Record<string, string> = {};
        if (filters?.category) params.category = filters.category;
        if (filters?.maxTier) params.maxTier = String(filters.maxTier);

        return api.get('/crafting/recipes', { params });
    },

    async getRecipe(id: string): Promise<{ recipe: Recipe }> {
        return api.get(`/crafting/recipes/${id}`);
    },

    async craftItem(recipeId: string, componentIds: string[]): Promise<CraftingResult> {
        return api.post('/crafting/craft', { recipeId, componentIds });
    }
};
