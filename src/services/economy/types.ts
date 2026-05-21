
export interface CurrencyDefinition {
    id: string;
    code: string;
    name: string;
    symbol: string | null;
    description: string | null;
    currency_type: 'FIAT' | 'CRYPTO' | 'CREDIT' | 'CORPORATE' | 'BLACK_MARKET';
    is_primary: number;
    is_tradeable: number;
    is_physical: number;
    exchange_rate_to_primary: number;
    tier_required: number;
    illegal: number;
    created_at: string;
}

export interface CharacterFinances {
    id: string;
    character_id: string;
    primary_currency_balance: number;
    currency_balances: string | null; // JSON object: { [currencyCode]: amount }
    physical_currency_on_person: string | null; // JSON object
    bank_accounts: string | null; // JSON object
    crypto_wallets: string | null; // JSON object
    hidden_stashes: string | null; // JSON object
    total_earned_career: number;
    total_spent_career: number;
    total_debt: number;
    credit_score: number;
    credit_limit: number;
    credit_utilized: number;
    created_at: string;
    updated_at: string;
}

export interface FinancialTransaction {
    id: string;
    character_id: string;
    occurred_at: string;
    transaction_type: 'PURCHASE' | 'SALE' | 'TRANSFER' | 'AWARD' | 'FEE' | 'TAX' | 'FINE' | 'LOAN' | 'REPAYMENT';
    currency_id: string | null;
    amount: number;
    is_income: number;
    balance_after: number;
    source_type: string | null;
    source_name: string | null;
    destination_type: string | null;
    destination_name: string | null;
    description: string | null;
    category: string | null;
    related_item_id: string | null;
    related_mission_id: string | null;
    related_contract_id: string | null;
    is_legal: number;
    traceable: number;
}

export interface VendorInventory {
    id: string;
    vendor_npc_id: string | null;
    location_id: string | null;
    vendor_type: string;
    specialization: string | null;
    quality_tier_min: number;
    quality_tier_max: number;
    buy_price_modifier: number;
    sell_price_modifier: number;
    haggle_difficulty: number;
    reputation_required: number;
    tier_required: number;
    accepts_stolen: number;
    accepts_contraband: number;
    base_inventory: string | null; // JSON array of item IDs or { itemId, quantity }
    rotating_inventory: string | null; // JSON array
    limited_stock: string | null; // JSON array
    last_restock_at: string;
    restock_interval_hours: number;
}

export type AccountType = 'wallet' | 'bank' | 'stash' | 'crypto';

export interface TransferRequest {
    characterId: string;
    amount: number;
    currencyCode?: string;
    fromAccount: AccountType;
    toAccount: AccountType;
    description?: string;
}

export interface VendorPurchaseRequest {
    characterId: string;
    vendorId: string;
    itemId: string;
    quantity: number;
    paymentMethod: 'wallet' | 'bank' | 'credit';
}

export interface VendorSaleRequest {
    characterId: string;
    vendorId: string;
    inventoryItemId: string;
    quantity: number;
}

export interface HaggleRequest {
    characterId: string;
    vendorId: string;
    itemId: string;
    action: 'buy' | 'sell';
    proposedPrice: number;
}
