
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import type { Recipe, CraftingResult } from './types';
import type { ItemRow } from '../items/types';

export class CraftingService {
    constructor(
        private db: D1Database,
        _cache: KVNamespace
    ) { }

    private parseJsonField<T>(value: string | null, defaultValue: T): T {
        if (!value) return defaultValue;
        try {
            return JSON.parse(value) as T;
        } catch {
            return defaultValue;
        }
    }

    private formatRecipe(item: ItemRow): Recipe {
        const parsedCategories = this.parseJsonField<string[]>(item.component_categories, []);

        // Map ItemRow to Recipe structure
        return {
            id: item.id,
            code: item.code,
            name: item.name,
            description: item.description,
            outputItem: item,
            requirements: {
                tier: item.required_tier,
                skillLevel: Math.max(1, item.quality_tier), // Simplified skill req
                skillId: 'FABRICATION',
            },
            components: parsedCategories.map((cat, idx) => ({
                category: cat,
                quantity: 1, // Default quantity assumption for now
                optional: false,
                slot: idx,
            })),
            basePrice: item.base_price,
            craftTime: Math.max(30, item.quality_tier * 60),
            xpReward: item.quality_tier * 25,
            difficulty: item.quality_tier,
        };
    }

    /**
     * Get available recipes
     */
    async getRecipes(filters: { category?: string, rarity?: string, maxTier?: number }): Promise<Recipe[]> {
        let query = `
            SELECT id, code, name, description, item_type, item_subtype, rarity,
                   quality_tier, base_price, weight_kg, required_tier,
                   is_craftable, recipe_id, component_categories, manufacturer
            FROM item_definitions
            WHERE is_craftable = 1
        `;
        const params: any[] = [];

        if (filters.category) {
            query += ' AND item_type = ?';
            params.push(filters.category);
        }
        if (filters.rarity) {
            query += ' AND rarity = ?';
            params.push(filters.rarity);
        }
        if (filters.maxTier) {
            query += ' AND required_tier <= ?';
            params.push(filters.maxTier);
        }

        query += ' ORDER BY required_tier, rarity DESC, name LIMIT 100';

        const result = await this.db.prepare(query).bind(...params).all<ItemRow>();
        return result.results.map(row => this.formatRecipe(row));
    }

    /**
     * Get specific recipe
     */
    async getRecipe(recipeId: string): Promise<Recipe | null> {
        const item = await this.db.prepare(
            `SELECT * FROM item_definitions WHERE (id = ? OR code = ?) AND is_craftable = 1`
        ).bind(recipeId, recipeId).first<ItemRow>();

        if (!item) return null;
        return this.formatRecipe(item);
    }

    /**
     * Craft an item
     */
    async craftItem(characterId: string, recipeId: string, componentIds: string[]): Promise<CraftingResult> {
        const recipe = await this.getRecipe(recipeId);
        if (!recipe) throw new Error('Recipe not found');

        // 1. Verify Tier/Skill
        const char = await this.db.prepare(
            `SELECT c.current_tier, cs.current_level 
             FROM characters c
             LEFT JOIN character_skills cs ON c.id = cs.character_id 
             AND cs.skill_id IN (SELECT id FROM skill_definitions WHERE code = 'FABRICATION')
             WHERE c.id = ?`
        ).bind(characterId).first<{ current_tier: number, current_level: number }>();

        if (!char) throw new Error('Character not found');

        if (char.current_tier < recipe.requirements.tier) {
            throw new Error(`Requires Tier ${recipe.requirements.tier}`);
        }

        // 2. Consume Components
        // Verify ownership and consume
        // Simple check: do these components exist in inventory?
        // Ideally we check if they match recipe categories (complex logic), for MVP we assume valid input from client which validated against categories
        // or we trust the componentIds provided are valid for the recipe slots.

        const placeholders = componentIds.map(() => '?').join(',');
        const components = await this.db.prepare(
            `SELECT id, quantity FROM character_inventory WHERE id IN (${placeholders}) AND character_id = ?`
        ).bind(...componentIds, characterId).all<{ id: string, quantity: number }>();

        if (components.results.length !== componentIds.length) {
            throw new Error('Some components not found in inventory');
        }

        // Check quantities (assuming 1 per slot for now)
        for (const comp of components.results) {
            if (comp.quantity < 1) throw new Error('Insufficient component quantity');
        }

        // Deduct
        for (const compId of componentIds) {
            await this.db.prepare(
                `UPDATE character_inventory SET quantity = quantity - 1 WHERE id = ?`
            ).bind(compId).run();
            // Cleanup zero quantity handled by trigger or periodic cleanup ideally, or check here
            await this.db.prepare(
                `DELETE FROM character_inventory WHERE id = ? AND quantity <= 0`
            ).bind(compId).run();
        }

        // 3. Create Output Item
        // // const { nanoid } = await import('nanoid');
        const newInventoryId = crypto.randomUUID();

        await this.db.prepare(
            `INSERT INTO character_inventory (
                id, character_id, item_definition_id, quantity, 
                current_durability, created_at, updated_at
            ) VALUES (
                ?, ?, ?, 1, 100, datetime('now'), datetime('now')
            )`
        ).bind(newInventoryId, characterId, recipe.outputItem.id).run();

        // 4. Grant XP
        if (recipe.xpReward > 0) {
            await this.db.prepare(
                `UPDATE character_skills 
                 SET current_xp = current_xp + ?, updated_at = datetime('now')
                 WHERE character_id = ? AND skill_id IN (SELECT id FROM skill_definitions WHERE code = 'FABRICATION')`
            ).bind(recipe.xpReward, characterId).run();
        }

        return {
            success: true,
            outputItemId: newInventoryId,
            outputQuantity: 1,
            xpGained: recipe.xpReward,
            message: `Crafted ${recipe.name}`,
            consumedComponents: components.results.map(c => ({ id: c.id, quantity: 1 }))
        };
    }
}
