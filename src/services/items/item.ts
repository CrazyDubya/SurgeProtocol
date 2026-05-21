
import type { D1Database } from '@cloudflare/workers-types';
import type { ItemRow, InventoryItem, UseEffects, EquipEffects, ArmorRow, WeaponRow, ConsumableRow, CatalogFilters } from './types';

export class ItemService {
    constructor(
        private db: D1Database,
        // private cache: KVNamespace
    ) { }

    private parseJsonField<T>(value: string | null, defaultValue: T): T {
        if (!value) return defaultValue;
        try {
            return JSON.parse(value) as T;
        } catch {
            return defaultValue;
        }
    }

    private formatItemDefinition(row: ItemRow) {
        const useEffects = this.parseJsonField<UseEffects | null>(row.use_effects, null);
        return {
            ...row,
            passiveEffects: this.parseJsonField(row.passive_effects, null),
            useEffects,
            equipEffects: this.parseJsonField<EquipEffects | null>(row.equip_effects, null),
            requiredAttributes: this.parseJsonField(row.required_attributes, {}),
            requiredSkills: this.parseJsonField(row.required_skills, {}),
            isConsumable: !!useEffects,
            isEquipable: row.item_type?.toString().startsWith('WEAPON') ||
                row.item_type?.toString().startsWith('ARMOR') ||
                row.item_type === 'ACCESSORY',
        };
    }

    /**
     * Get item definition by ID or Code
     */
    async getItemDefinition(idOrCode: string) {
        const row = await this.db.prepare(
            `SELECT * FROM item_definitions WHERE id = ? OR code = ?`
        ).bind(idOrCode, idOrCode).first<ItemRow>();
        return row ? this.formatItemDefinition(row) : null;
    }

    /**
     * Get character's full inventory
     */
    async getInventory(characterId: string): Promise<{ items: InventoryItem[], totalWeight: number }> {
        const results = await this.db.prepare(
            `SELECT ci.id as inventoryId, ci.quantity, ci.equipped_slot, ci.quick_slot,
              ci.current_durability, ci.current_charges, ci.current_ammo,
              ci.is_damaged, ci.is_broken, ci.custom_name, ci.item_definition_id,
              id.code, id.name, id.description, id.item_type, id.item_subtype,
              id.rarity, id.weight_kg, id.base_price,
              id.passive_effects, id.use_effects, id.equip_effects
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_definition_id = id.id
       WHERE ci.character_id = ?
       ORDER BY ci.equipped_slot IS NOT NULL DESC, id.item_type, id.name`
        ).bind(characterId).all<any>();

        const items: InventoryItem[] = results.results.map(row => {
            const useEffects = this.parseJsonField<UseEffects | null>(row.use_effects, null);

            return {
                inventoryId: row.inventoryId,
                item_definition_id: row.item_definition_id,
                code: row.code,
                name: row.custom_name || row.name,
                originalName: row.name,
                description: row.description,
                itemType: row.item_type,
                itemSubtype: row.item_subtype,
                rarity: row.rarity,
                quantity: row.quantity,
                weight: row.weight_kg,
                basePrice: row.base_price,
                equippedSlot: row.equipped_slot,
                quickSlot: row.quick_slot,
                durability: row.current_durability,
                charges: row.current_charges,
                ammo: row.current_ammo,
                isDamaged: row.is_damaged === 1,
                isBroken: row.is_broken === 1,
                isEquipped: !!row.equipped_slot,
                isConsumable: !!useEffects,
                passiveEffects: this.parseJsonField(row.passive_effects, null),
                useEffects,
                equipEffects: this.parseJsonField<EquipEffects | null>(row.equip_effects, null),
            };
        });

        const totalWeight = items.reduce((sum, i) => sum + (i.weight * i.quantity), 0);

        return { items, totalWeight };
    }

    /**
     * Use a consumable item
     */
    async useItem(characterId: string, inventoryId: string): Promise<{ success: boolean; message: string; effects: string[] }> {
        // 1. Get Item
        const item = await this.db.prepare(
            `SELECT ci.*, id.name, id.use_effects, id.item_type
       FROM character_inventory ci
       JOIN item_definitions id ON ci.item_definition_id = id.id
       WHERE ci.id = ? AND ci.character_id = ?`
        ).bind(inventoryId, characterId).first<any>();

        if (!item) throw new Error('Item not found');
        if (!item.use_effects) throw new Error('Item is not usable');

        const useEffects = this.parseJsonField<UseEffects>(item.use_effects, {});
        const appliedEffects: string[] = [];

        // 2. Apply Effects
        if (useEffects.healing) {
            await this.db.prepare(
                `UPDATE characters SET current_health = MIN(current_health + ?, max_health) WHERE id = ?`
            ).bind(useEffects.healing, characterId).run();
            appliedEffects.push(`Healed ${useEffects.healing} HP`);
        }

        if (useEffects.tempAttributeBonus) {
            const { attribute, value, duration } = useEffects.tempAttributeBonus;
            await this.db.prepare(
                `UPDATE character_attributes
         SET temporary_modifier = temporary_modifier + ?, updated_at = datetime('now')
         WHERE character_id = ? AND attribute_id IN (SELECT id FROM attribute_definitions WHERE code = ?)`
            ).bind(value, characterId, attribute).run();
            appliedEffects.push(`+${value} ${attribute} for ${duration}s`);
        }

        // Add Condition
        if (useEffects.addCondition) {
            const { condition, duration } = useEffects.addCondition;
            const condDef = await this.db.prepare('SELECT * FROM condition_definitions WHERE code = ?').bind(condition).first<any>();
            if (condDef) {
                await this.db.prepare(
                    `INSERT INTO character_conditions (
                        id, character_id, type, name, description, icon_asset, 
                        severity, value, duration_seconds, expires_at, 
                        effects_data, source_type, source_id, created_at
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, 
                        ?, ?, ?, datetime('now', '+' || ? || ' seconds'), 
                        ?, 'ITEM', ?, datetime('now')
                    )`
                ).bind(
                    crypto.randomUUID(),
                    characterId,
                    condDef.condition_type || 'BUFF',
                    condDef.name,
                    condDef.description,
                    condDef.icon_asset,
                    condDef.severity || 'MINOR',
                    1,
                    duration,
                    duration, // used for expires_at calculation in SQL
                    // We need to map definition effects to instance effects_data
                    // The schema expects effects_data as JSON
                    // We'll just store basic info for now or empty array
                    '[]',
                    inventoryId
                ).run();
                appliedEffects.push(`Applied ${condition}`);
            }
        }

        // Remove Condition
        if (useEffects.removeCondition) {
            // New schema doesn't have is_active. We delete the row.
            // And we match by name or look up the definition code.
            const condDef = await this.db.prepare('SELECT name FROM condition_definitions WHERE code = ?').bind(useEffects.removeCondition).first<{ name: string }>();

            if (condDef) {
                await this.db.prepare(
                    `DELETE FROM character_conditions WHERE character_id = ? AND name = ?`
                ).bind(characterId, condDef.name).run();
                appliedEffects.push(`Removed ${useEffects.removeCondition}`);
            }
        }

        // 3. Consume Logic
        if (item.quantity > 1) {
            await this.db.prepare('UPDATE character_inventory SET quantity = quantity - 1 WHERE id = ?').bind(inventoryId).run();
        } else {
            await this.db.prepare('DELETE FROM character_inventory WHERE id = ?').bind(inventoryId).run();
        }

        return { success: true, message: `Used ${item.name}`, effects: appliedEffects };
    }

    /**
     * Equip an item
     */
    async equipItem(characterId: string, inventoryId: string, slot?: string): Promise<{ success: boolean; equipped_slot: string }> {
        // 1. Get Item
        const item = await this.db.prepare(
            `SELECT ci.*, id.item_type, id.required_tier, id.equip_effects
         FROM character_inventory ci
         JOIN item_definitions id ON ci.item_definition_id = id.id
         WHERE ci.id = ? AND ci.character_id = ?`
        ).bind(inventoryId, characterId).first<any>();

        if (!item) throw new Error('Item not found');
        if (item.equipped_slot) throw new Error('Item already equipped');

        // 2. Determine Slot
        let targetSlot = slot;
        if (!targetSlot) {
            if (item.item_type === 'WEAPON_RANGED' || item.item_type === 'WEAPON_MELEE') targetSlot = 'MAIN_HAND';
            else if (item.item_type === 'ARMOR') targetSlot = 'TORSO'; // Simplified default
            else if (item.item_type === 'ACCESSORY') targetSlot = 'ACCESSORY_1';
            else throw new Error('Cannot determine slot for this item type');
        }

        // 3. Check Tier
        const char = await this.db.prepare('SELECT current_tier FROM characters WHERE id = ?').bind(characterId).first<{ current_tier: number }>();
        if (char && char.current_tier < item.required_tier) {
            throw new Error(`Requires Tier ${item.required_tier}`);
        }

        // 4. Unequip existing
        const existing = await this.db.prepare(
            `SELECT id, item_definition_id FROM character_inventory WHERE character_id = ? AND equipped_slot = ?`
        ).bind(characterId, targetSlot).first<{ id: string, item_definition_id: string }>();

        if (existing) {
            await this.unequipItem(characterId, existing.id);
        }

        // 5. Equip
        await this.db.prepare('UPDATE character_inventory SET equipped_slot = ? WHERE id = ?').bind(targetSlot, inventoryId).run();

        // 6. Apply Effects
        if (item.equip_effects) {
            const effects = this.parseJsonField<EquipEffects>(item.equip_effects, {});
            await this.applyEquipEffects(characterId, effects, true);
        }

        return { success: true, equipped_slot: targetSlot! };
    }

    /**
     * Unequip an item
     */
    async unequipItem(characterId: string, inventoryId: string): Promise<void> {
        const item = await this.db.prepare(
            `SELECT ci.equipped_slot, id.equip_effects 
           FROM character_inventory ci
           JOIN item_definitions id ON ci.item_definition_id = id.id
           WHERE ci.id = ? AND ci.character_id = ?`
        ).bind(inventoryId, characterId).first<any>();

        if (!item || !item.equipped_slot) return;

        // Remove Slot
        await this.db.prepare('UPDATE character_inventory SET equipped_slot = NULL WHERE id = ?').bind(inventoryId).run();

        // Remove Effects
        if (item.equip_effects) {
            const effects = this.parseJsonField<EquipEffects>(item.equip_effects, {});
            await this.applyEquipEffects(characterId, effects, false);
        }
    }

    /**
     * Discard item
     */
    async discardItem(characterId: string, inventoryId: string, quantity: number): Promise<{ discarded: number; remaining: number }> {
        const item = await this.db.prepare(
            'SELECT quantity, equipped_slot FROM character_inventory WHERE id = ? AND character_id = ?'
        ).bind(inventoryId, characterId).first<{ quantity: number, equipped_slot: string | null }>();

        if (!item) throw new Error('Item not found');
        if (item.equipped_slot) throw new Error('Cannot discard equipped item');
        if (quantity > item.quantity) throw new Error('Insufficient quantity');

        if (quantity >= item.quantity) {
            await this.db.prepare('DELETE FROM character_inventory WHERE id = ?').bind(inventoryId).run();
            return { discarded: item.quantity, remaining: 0 };
        } else {
            await this.db.prepare('UPDATE character_inventory SET quantity = quantity - ? WHERE id = ?').bind(quantity, inventoryId).run();
            return { discarded: quantity, remaining: item.quantity - quantity };
        }
    }


    /**
     * Helper: Apply/Remove Equip Effects
     */
    private async applyEquipEffects(characterId: string, effects: EquipEffects, apply: boolean) {
        if (effects.attributeBonuses) {
            for (const [attr, val] of Object.entries(effects.attributeBonuses)) {
                const modifier = apply ? val : -val;
                await this.db.prepare(
                    `UPDATE character_attributes 
                  SET bonus_from_items = bonus_from_items + ? 
                  WHERE character_id = ? AND attribute_id IN (SELECT id FROM attribute_definitions WHERE code = ?)`
                ).bind(modifier, characterId, attr).run();
            }
        }
    }


    /**
     * Formatting Helpers
     */
    private formatArmor(row: ArmorRow) {
        return {
            ...row,
            itemId: (row as any).item_id,
            damageTypeResistances: this.parseJsonField(row.damage_type_resistances, {}),
            damageTypeWeaknesses: this.parseJsonField(row.damage_type_weaknesses, {}),
            bodyLocationsCovered: this.parseJsonField(row.body_locations_covered, []),
            environmentalProtection: this.parseJsonField(row.environmental_protection, {}),
            specialProperties: this.parseJsonField(row.special_properties, []),
            armorValue: row.armor_value,
            damageReductionFlat: row.damage_reduction_flat,
            damageReductionPercent: row.damage_reduction_percent,
            basePrice: row.base_price,
            weightKg: row.weight_kg,
            iconAsset: row.icon_asset,
            armorStyle: row.armor_style,
            equipSlot: row.equip_slot
        };
    }

    private formatWeapon(row: WeaponRow) {
        return {
            ...row,
            itemId: (row as any).item_id,
            fireModes: this.parseJsonField(row.fire_modes, []),
            weaponClass: row.weapon_class,
            weaponType: row.weapon_type,
            damageType: row.damage_type,
            isMelee: row.is_melee === 1,
            isRanged: row.is_ranged === 1,
            isThrowable: row.is_throwable === 1,
            isSmart: row.is_smart_weapon === 1,
            isTech: row.is_tech_weapon === 1,
            baseDamageDice: row.base_damage_dice,
            baseDamageFlat: row.base_damage_flat,
            basePrice: row.base_price,
            weightKg: row.weight_kg,
            equipSlot: row.equip_slot,
            iconAsset: row.icon_asset
        };
    }

    private formatConsumable(row: ConsumableRow) {
        return {
            ...row,
            itemId: (row as any).item_id,
            immediateEffects: this.parseJsonField(row.immediate_effects, []),
            overTimeEffects: this.parseJsonField(row.over_time_effects, []),
            overdoseEffects: this.parseJsonField(row.overdose_effects, []),
            useEffects: this.parseJsonField(row.use_effects, {}),
            consumableType: row.consumable_type,
            isIllegal: row.is_illegal === 1,
            basePrice: row.base_price,
            iconAsset: row.icon_asset
        };
    }

    /**
     * Get Armor Catalog
     */
    async getArmorCatalog(filters: { style?: string, minArmor?: number }) {
        let query = `
            SELECT ad.*, id.name, id.description, id.quality_tier as tier, id.base_price, id.weight_kg,
                   id.icon_asset, id.rarity, id.equip_effects, id.equip_slot
            FROM armor_definitions ad
            JOIN item_definitions id ON ad.item_id = id.id
            WHERE 1=1
        `;
        const params: unknown[] = [];

        if (filters.style) {
            query += ' AND ad.armor_style = ?';
            params.push(filters.style);
        }
        if (filters.minArmor) {
            query += ' AND ad.armor_value >= ?';
            params.push(filters.minArmor);
        }

        query += ' ORDER BY ad.armor_value DESC, id.quality_tier ASC';
        const result = await this.db.prepare(query).bind(...params).all<ArmorRow>();
        return result.results.map(row => this.formatArmor(row));
    }

    async getArmorDetails(id: string) {
        const row = await this.db.prepare(
            `SELECT ad.*, id.name, id.description, id.quality_tier as tier, id.base_price, id.weight_kg,
                    id.icon_asset, id.rarity, id.equip_effects, id.equip_slot
             FROM armor_definitions ad
             JOIN item_definitions id ON ad.item_id = id.id
             WHERE ad.id = ? OR ad.item_id = ?`
        ).bind(id, id).first<ArmorRow>();
        return row ? this.formatArmor(row) : null;
    }

    /**
     * Get Weapon Catalog
     */
    async getWeaponCatalog(filters: { class?: string, damageType?: string, melee?: boolean, ranged?: boolean }) {
        let query = `
            SELECT wd.*, id.name, id.description, id.quality_tier as tier, id.base_price, id.weight_kg,
                   id.icon_asset, id.rarity, id.equip_effects, id.equip_slot
            FROM weapon_definitions wd
            JOIN item_definitions id ON wd.item_id = id.id
            WHERE 1=1
        `;
        const params: unknown[] = [];

        if (filters.class) {
            query += ' AND wd.weapon_class = ?';
            params.push(filters.class);
        }
        if (filters.damageType) {
            query += ' AND wd.damage_type = ?';
            params.push(filters.damageType);
        }
        if (filters.melee) query += ' AND wd.is_melee = 1';
        if (filters.ranged) query += ' AND wd.is_ranged = 1';

        query += ' ORDER BY id.quality_tier ASC, id.name ASC';
        const result = await this.db.prepare(query).bind(...params).all<WeaponRow>();
        return result.results.map(row => this.formatWeapon(row));
    }

    async getWeaponDetails(id: string) {
        const row = await this.db.prepare(
            `SELECT wd.*, id.name, id.description, id.quality_tier as tier, id.base_price, id.weight_kg,
                    id.icon_asset, id.rarity, id.equip_effects, id.equip_slot
             FROM weapon_definitions wd
             JOIN item_definitions id ON wd.item_id = id.id
             WHERE wd.id = ? OR wd.item_id = ?`
        ).bind(id, id).first<WeaponRow>();
        return row ? this.formatWeapon(row) : null;
    }

    /**
     * Get Consumable Catalog
     */
    async getConsumableCatalog(filters: { type?: string, illegal?: boolean }) {
        let query = `
            SELECT cd.*, id.name, id.description, id.quality_tier as tier, id.base_price, id.weight_kg,
                   id.icon_asset, id.rarity, id.use_effects
            FROM consumable_definitions cd
            JOIN item_definitions id ON cd.item_id = id.id
            WHERE 1=1
        `;
        const params: unknown[] = [];

        if (filters.type) {
            query += ' AND cd.consumable_type = ?';
            params.push(filters.type);
        }
        if (filters.illegal === true) query += ' AND cd.is_illegal = 1';
        if (filters.illegal === false) query += ' AND cd.is_illegal = 0';

        query += ' ORDER BY cd.consumable_type ASC, id.name ASC';
        const result = await this.db.prepare(query).bind(...params).all<ConsumableRow>();
        return result.results.map(row => this.formatConsumable(row));
    }

    /**
     * Generate loot based on a loot table or random tier/type
     */
    async generateLoot(params: {
        lootTableId?: string | null;
        minTier?: number;
        maxTier?: number;
        lootTableChance?: number;
        limit?: number;
    }): Promise<InventoryItem[]> {
        const { lootTableId, lootTableChance = 1.0, limit = 5 } = params;
        const loot: any[] = [];

        // 1. Process Loot Table if provided
        if (lootTableId) {
            const entries = await this.db.prepare(
                `SELECT item_definition_id, drop_chance, min_quantity, max_quantity 
               FROM loot_table_entries 
               WHERE loot_table_id = ?`
            ).bind(lootTableId).all<any>();

            for (const entry of entries.results || []) {
                if (Math.random() <= (entry.drop_chance * lootTableChance)) {
                    const quantity = Math.floor(
                        Math.random() * (entry.max_quantity - entry.min_quantity + 1) +
                        entry.min_quantity
                    );

                    if (quantity > 0) {
                        const item = await this.getItemDefinition(entry.item_definition_id);
                        if (item) {
                            loot.push({
                                ...item,
                                itemId: item.id,
                                quantity
                            });
                        }
                    }
                }
            }
        }

        // 2. Fallback / Random generation if no table or if we want extra random loot
        // For now, we only use table if provided. 
        // If we want purely random loot (e.g. Scavenging), we can implement that here later.

        return loot.slice(0, limit);
    }

    async getConsumableDetails(id: string) {
        const row = await this.db.prepare(
            `SELECT cd.*, id.name, id.description, id.quality_tier as tier, id.base_price, id.weight_kg,
                    id.icon_asset, id.rarity, id.use_effects
             FROM consumable_definitions cd
             JOIN item_definitions id ON cd.item_id = id.id
             WHERE cd.id = ? OR cd.item_id = ?`
        ).bind(id, id).first<ConsumableRow>();
        return row ? this.formatConsumable(row) : null;
    }


    /**
     * Search item definitions
     */
    async searchCatalog(filters: CatalogFilters): Promise<{ items: ItemRow[], byType: Record<string, ItemRow[]> }> {
        let query = `
            SELECT id, code, name, description, item_type, item_subtype, rarity,
                   quality_tier, base_price, weight_kg, required_tier,
                   is_illegal, manufacturer
            FROM item_definitions
            WHERE 1=1
        `;

        const params: (string | number)[] = [];

        if (filters.type) {
            query += ` AND item_type = ?`;
            params.push(filters.type);
        }
        if (filters.rarity) {
            query += ` AND rarity = ?`;
            params.push(filters.rarity);
        }
        if (filters.maxTier) {
            query += ` AND required_tier <= ?`;
            params.push(filters.maxTier);
        }
        if (filters.search) {
            query += ` AND (name LIKE ? OR description LIKE ?)`;
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        query += ` ORDER BY item_type, rarity DESC, name LIMIT 100`;

        const result = await this.db.prepare(query).bind(...params).all<ItemRow>();
        const items = result.results;

        // Group by type
        const byType: Record<string, ItemRow[]> = {};
        for (const item of items) {
            const type = item.item_type || 'OTHER';
            if (!byType[type]) byType[type] = [];
            byType[type].push(item);
        }

        return { items, byType };
    }
}

