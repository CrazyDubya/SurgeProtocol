
import type { D1Database } from '@cloudflare/workers-types';
import type {
    CurrencyDefinition,
    CharacterFinances,
    FinancialTransaction,
    VendorInventory,
    AccountType,
    TransferRequest,
    VendorPurchaseRequest,
    VendorSaleRequest,
    HaggleRequest
} from './types';

export class EconomyService {
    constructor(private db: D1Database) { }

    /**
     * Parsing Helpers
     */
    private parseJson<T>(val: string | null): T | null {
        if (!val) return null;
        try {
            return JSON.parse(val) as T;
        } catch (e) {
            console.error('JSON parsing error:', e, val);
            return null;
        }
    }

    /**
     * Currencies
     */
    async listCurrencies(): Promise<CurrencyDefinition[]> {
        const result = await this.db.prepare(`
            SELECT * FROM currency_definitions
            ORDER BY is_primary DESC, code ASC
        `).all<CurrencyDefinition>();
        return result.results || [];
    }

    async getCurrency(code: string): Promise<CurrencyDefinition | null> {
        return await this.db.prepare(`
            SELECT * FROM currency_definitions WHERE code = ?
        `).bind(code).first<CurrencyDefinition>();
    }

    /**
     * Character Finances
     */
    async getCharacterFinances(characterId: string): Promise<CharacterFinances> {
        let finances = await this.db.prepare(`
            SELECT * FROM character_finances WHERE character_id = ?
        `).bind(characterId).first<CharacterFinances>();

        if (!finances) {
            const id = crypto.randomUUID();
            await this.db.prepare(`
                INSERT INTO character_finances (
                    id, character_id, primary_currency_balance, 
                    currency_balances, bank_accounts, crypto_wallets, hidden_stashes,
                    total_earned_career, total_spent_career, total_debt,
                    credit_score, credit_limit, credit_utilized
                ) VALUES (?, ?, 1000, '{}', '{}', '{}', '{}', 0, 0, 0, 500, 1000, 0)
            `).bind(id, characterId).run();

            finances = await this.db.prepare(`
                SELECT * FROM character_finances WHERE id = ?
            `).bind(id).first<CharacterFinances>();
        }

        if (!finances) throw new Error('Failed to retrieve or create character finances');
        return finances;
    }

    async getFormattedBalances(characterId: string) {
        const finances = await this.getCharacterFinances(characterId);

        return {
            wallet: {
                primary: finances.primary_currency_balance,
                currencies: this.parseJson<Record<string, number>>(finances.currency_balances) || {},
            },
            bank: this.parseJson<Record<string, number>>(finances.bank_accounts) || {},
            crypto: this.parseJson<Record<string, number>>(finances.crypto_wallets) || {},
            stashes: this.parseJson<Record<string, number>>(finances.hidden_stashes) || {},
            stats: {
                totalEarnedCareer: finances.total_earned_career,
                totalSpentCareer: finances.total_spent_career,
                totalDebt: finances.total_debt,
                creditScore: finances.credit_score,
                creditLimit: finances.credit_limit,
                creditUtilized: finances.credit_utilized,
            }
        };
    }

    /**
     * Transactions
     */
    async listTransactions(characterId: string, limit: number = 20, offset: number = 0) {
        const result = await this.db.prepare(`
            SELECT * FROM financial_transactions
            WHERE character_id = ?
            ORDER BY occurred_at DESC
            LIMIT ? OFFSET ?
        `).bind(characterId, limit, offset).all<FinancialTransaction>();

        const count = await this.db.prepare(`
            SELECT COUNT(*) as total FROM financial_transactions WHERE character_id = ?
        `).bind(characterId).first<{ total: number }>();

        return {
            transactions: result.results || [],
            total: count?.total || 0
        };
    }

    async recordTransaction(data: Omit<FinancialTransaction, 'id' | 'occurred_at'>) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await this.db.prepare(`
            INSERT INTO financial_transactions (
                id, character_id, occurred_at, transaction_type, currency_id,
                amount, is_income, balance_after, source_type, source_name,
                destination_type, destination_name, description, category,
                related_item_id, related_mission_id, related_contract_id,
                is_legal, traceable
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id, data.character_id, now, data.transaction_type, data.currency_id || null,
            data.amount, data.is_income, data.balance_after, data.source_type || null, data.source_name || null,
            data.destination_type || null, data.destination_name || null, data.description || null, data.category || null,
            data.related_item_id || null, data.related_mission_id || null, data.related_contract_id || null,
            data.is_legal, data.traceable
        ).run();

        return id;
    }

    /**
     * Account Transfers
     */
    async transferFunds(req: TransferRequest) {
        const { characterId, amount, fromAccount, toAccount, description } = req;
        const finances = await this.getCharacterFinances(characterId);

        // Helper to get balance
        const getBalance = (fin: CharacterFinances, type: AccountType): number => {
            if (type === 'wallet') return fin.primary_currency_balance;
            const field = type === 'bank' ? fin.bank_accounts : (type === 'stash' ? fin.hidden_stashes : fin.crypto_wallets);
            const accounts = this.parseJson<Record<string, number>>(field) || {};
            return accounts['PRIMARY'] || 0;
        };

        const sourceBalance = getBalance(finances, fromAccount);
        if (sourceBalance < amount) throw new Error(`Insufficient funds in ${fromAccount}`);

        // Build updates
        const updateAccount = (fin: CharacterFinances, type: AccountType, addAmount: number) => {
            if (type === 'wallet') {
                return { field: 'primary_currency_balance', value: fin.primary_currency_balance + addAmount };
            }
            const fieldName = type === 'bank' ? 'bank_accounts' : (type === 'stash' ? 'hidden_stashes' : 'crypto_wallets');
            const accounts = this.parseJson<Record<string, number>>((fin as any)[fieldName]) || {};
            accounts['PRIMARY'] = (accounts['PRIMARY'] || 0) + addAmount;
            return { field: fieldName, value: JSON.stringify(accounts) };
        };

        const fromUpdate = updateAccount(finances, fromAccount, -amount);
        const toUpdate = updateAccount(finances, toAccount, amount);

        await this.db.prepare(`
            UPDATE character_finances 
            SET ${fromUpdate.field} = ?, ${toUpdate.field} = ?, updated_at = datetime('now')
            WHERE character_id = ?
        `).bind(fromUpdate.value, toUpdate.value, characterId).run();

        // Record transaction
        await this.recordTransaction({
            character_id: characterId,
            transaction_type: 'TRANSFER',
            currency_id: 'PRIMARY',
            amount,
            is_income: 0,
            balance_after: getBalance(finances, 'wallet'),
            source_type: 'ACCOUNT',
            source_name: fromAccount,
            destination_type: 'ACCOUNT',
            destination_name: toAccount,
            description: description || `Transfer from ${fromAccount} to ${toAccount}`,
            category: 'INTERNAL',
            related_item_id: null,
            related_mission_id: null,
            related_contract_id: null,
            is_legal: 1,
            traceable: 1
        });

        return { success: true };
    }
    async listVendors(locationId: string | null = null): Promise<any[]> {
        const query = `
            SELECT 
                vi.id, vi.vendor_type, vi.specialization,
                vi.quality_tier_min, vi.quality_tier_max,
                vi.buy_price_modifier, vi.sell_price_modifier,
                vi.reputation_required, vi.tier_required,
                vi.accepts_stolen, vi.accepts_contraband,
                n.id as npc_id, n.name as npc_name, n.occupation,
                l.id as location_id, l.name as location_name
            FROM vendor_inventories vi
            LEFT JOIN npc_definitions n ON vi.vendor_npc_id = n.id
            LEFT JOIN locations l ON vi.location_id = l.id
            WHERE vi.location_id = ? OR ? IS NULL
            ORDER BY vi.vendor_type, n.name
            LIMIT 50
        `;
        const result = await this.db.prepare(query).bind(locationId, locationId).all();
        return result.results || [];
    }

    async getVendorDetails(vendorId: string, characterTier: number = 1) {
        const vendor = await this.db.prepare(`
            SELECT 
                vi.*,
                n.id as npc_id, n.name as npc_name, n.occupation, n.greeting_dialogue_id as dialogue_greeting,
                l.id as location_id, l.name as location_name
            FROM vendor_inventories vi
            LEFT JOIN npc_definitions n ON vi.vendor_npc_id = n.id
            LEFT JOIN locations l ON vi.location_id = l.id
            WHERE vi.id = ?
        `).bind(vendorId).first<VendorInventory & {
            npc_id: string; npc_name: string; occupation: string; dialogue_greeting: string;
            location_id: string; location_name: string;
        }>();

        if (!vendor) return null;

        // Check tier requirement
        if (characterTier < (vendor.tier_required || 1)) {
            throw new Error(`Requires Tier ${vendor.tier_required} (you are Tier ${characterTier})`);
        }

        const baseInventory = this.parseJson<any[]>(vendor.base_inventory) || [];
        const rotatingInventory = this.parseJson<any[]>(vendor.rotating_inventory) || [];
        const limitedStock = this.parseJson<any[]>(vendor.limited_stock) || [];

        const allItemIds = Array.from(new Set([
            ...baseInventory.map(i => i.itemId || i.item_id || i),
            ...rotatingInventory.map(i => i.itemId || i.item_id || i),
            ...limitedStock.map(i => i.itemId || i.item_id || i)
        ])).filter(id => typeof id === 'string');

        let items: Record<string, any> = {};
        if (allItemIds.length > 0) {
            const placeholders = allItemIds.map(() => '?').join(',');
            const itemsResult = await this.db.prepare(`
                SELECT id, code, name, description, item_type, rarity, base_price, weight
                FROM item_definitions
                WHERE id IN (${placeholders})
            `).bind(...allItemIds).all();

            for (const item of (itemsResult.results || [])) {
                const itemData = item as any;
                if (itemData && itemData.id) {
                    items[itemData.id] = itemData;
                }
            }
        }

        return {
            vendor: {
                id: vendor.id,
                type: vendor.vendor_type,
                specialization: vendor.specialization,
                buyPriceModifier: vendor.buy_price_modifier,
                sellPriceModifier: vendor.sell_price_modifier,
                haggleDifficulty: vendor.haggle_difficulty,
                acceptsStolen: vendor.accepts_stolen === 1,
                acceptsContraband: vendor.accepts_contraband === 1,
                npc: vendor.npc_id ? {
                    id: vendor.npc_id,
                    name: vendor.npc_name,
                    occupation: vendor.occupation,
                    greeting: vendor.dialogue_greeting,
                } : null,
                location: vendor.location_id ? {
                    id: vendor.location_id,
                    name: vendor.location_name,
                } : null,
            },
            inventory: {
                base: this.enrichInventory(baseInventory, items, vendor.buy_price_modifier),
                rotating: this.enrichInventory(rotatingInventory, items, vendor.buy_price_modifier),
                limited: this.enrichInventory(limitedStock, items, vendor.buy_price_modifier),
            }
        };
    }

    private enrichInventory(inventory: any[], items: Record<string, any>, modifier: number) {
        return inventory.map(entry => {
            const itemId = typeof entry === 'string' ? entry : (entry.itemId || entry.item_id);
            const item = items[itemId];
            if (!item) return entry;

            return {
                ...item,
                quantity: entry.quantity || entry.stock || 1,
                price: Math.ceil((item.base_price || 0) * modifier)
            };
        });
    }

    async buyItem(req: VendorPurchaseRequest) {
        const { characterId, vendorId, itemId, quantity, paymentMethod } = req;

        // 1. Get vendor & item
        const vendor = await this.db.prepare('SELECT * FROM vendor_inventories WHERE id = ?').bind(vendorId).first<VendorInventory>();
        if (!vendor) throw new Error('Vendor not found');

        const item = await this.db.prepare('SELECT * FROM item_definitions WHERE id = ?').bind(itemId).first<{ id: string, name: string, base_price: number }>();
        if (!item) throw new Error('Item not found');

        // 2. Calculate price
        const totalPrice = Math.ceil((item.base_price || 0) * (vendor.buy_price_modifier || 1.0) * quantity);

        // 3. Check & deduct funds
        const finances = await this.getCharacterFinances(characterId);

        if (paymentMethod === 'credit') {
            const available = finances.credit_limit - finances.credit_utilized;
            if (totalPrice > available) throw new Error('Insufficient credit available');

            await this.db.prepare(`
                UPDATE character_finances
                SET credit_utilized = credit_utilized + ?, total_spent_career = total_spent_career + ?, updated_at = datetime('now')
                WHERE character_id = ?
            `).bind(totalPrice, totalPrice, characterId).run();
        } else {
            // simplified: assume from wallet for now like original
            if (finances.primary_currency_balance < totalPrice) throw new Error('Insufficient funds');

            await this.db.prepare(`
                UPDATE character_finances
                SET primary_currency_balance = primary_currency_balance - ?, total_spent_career = total_spent_career + ?, updated_at = datetime('now')
                WHERE character_id = ?
            `).bind(totalPrice, totalPrice, characterId).run();
        }

        // 4. Add to inventory
        const inventoryId = crypto.randomUUID();
        await this.db.prepare(`
            INSERT INTO character_inventory (id, character_id, item_definition_id, quantity, equipped, acquired_from, acquired_at)
            VALUES (?, ?, ?, ?, 0, 'VENDOR', datetime('now'))
        `).bind(inventoryId, characterId, itemId, quantity).run();

        // 5. Record transaction
        const updatedFinances = await this.getCharacterFinances(characterId);
        await this.recordTransaction({
            character_id: characterId,
            transaction_type: 'PURCHASE',
            currency_id: 'PRIMARY',
            amount: totalPrice,
            is_income: 0,
            balance_after: updatedFinances.primary_currency_balance,
            source_type: 'CHARACTER',
            source_name: 'Wallet',
            destination_type: 'VENDOR',
            destination_name: vendor.vendor_npc_id || 'Vendor',
            description: `Purchased ${quantity}x ${item.name}`,
            category: 'SHOPPING',
            related_item_id: itemId,
            related_mission_id: null,
            related_contract_id: null,
            is_legal: 1,
            traceable: 1
        });

        return { inventoryId, totalPrice };
    }

    async sellItem(req: VendorSaleRequest) {
        const { characterId, vendorId, inventoryItemId, quantity } = req;

        const vendor = await this.db.prepare('SELECT * FROM vendor_inventories WHERE id = ?').bind(vendorId).first<VendorInventory>();
        if (!vendor) throw new Error('Vendor not found');

        const inventoryItem = await this.db.prepare(`
            SELECT ci.*, id.base_price, id.name as item_name, id.is_stolen, id.is_contraband, id.id as item_def_id
            FROM character_inventory ci
            JOIN item_definitions id ON ci.item_definition_id = id.id
            WHERE ci.id = ? AND ci.character_id = ?
        `).bind(inventoryItemId, characterId).first<any>();

        if (!inventoryItem) throw new Error('Item not in inventory');
        if (inventoryItem.quantity < quantity) throw new Error('Not enough items to sell');

        if (inventoryItem.is_stolen && !vendor.accepts_stolen) throw new Error('Vendor does not accept stolen goods');
        if (inventoryItem.is_contraband && !vendor.accepts_contraband) throw new Error('Vendor does not accept contraband');

        const sellPrice = Math.floor((inventoryItem.base_price || 0) * (vendor.sell_price_modifier || 0.5) * quantity);

        // Update inventory
        if (inventoryItem.quantity === quantity) {
            await this.db.prepare('DELETE FROM character_inventory WHERE id = ?').bind(inventoryItemId).run();
        } else {
            await this.db.prepare('UPDATE character_inventory SET quantity = quantity - ? WHERE id = ?').bind(quantity, inventoryItemId).run();
        }

        // Add payment
        await this.db.prepare(`
            UPDATE character_finances
            SET primary_currency_balance = primary_currency_balance + ?, total_earned_career = total_earned_career + ?, updated_at = datetime('now')
            WHERE character_id = ?
        `).bind(sellPrice, sellPrice, characterId).run();

        // Record transaction
        const updatedFinances = await this.getCharacterFinances(characterId);
        await this.recordTransaction({
            character_id: characterId,
            transaction_type: 'SALE',
            currency_id: 'PRIMARY',
            amount: sellPrice,
            is_income: 1,
            balance_after: updatedFinances.primary_currency_balance,
            source_type: 'VENDOR',
            source_name: vendor.vendor_npc_id || 'Vendor',
            destination_type: 'CHARACTER',
            destination_name: 'Wallet',
            description: `Sold ${quantity}x ${inventoryItem.item_name}`,
            category: 'SHOPPING',
            related_item_id: inventoryItem.item_def_id,
            related_mission_id: null,
            related_contract_id: null,
            is_legal: 1,
            traceable: 1
        });

        return { sellPrice };
    }

    async haggle(req: HaggleRequest) {
        // Placeholder for haggle logic
        const { vendorId, proposedPrice, action, itemId } = req;
        const vendor = await this.db.prepare('SELECT * FROM vendor_inventories WHERE id = ?').bind(vendorId).first<VendorInventory>();
        if (!vendor) throw new Error('Vendor not found');

        console.log(`Haggling for ${itemId}: ${action} at ${proposedPrice}`);

        // Logic placeholder: successfully haggle if within 10% of modifier
        return { success: true, message: 'Haggle successful (Placeholder logic)' };
    }
}
