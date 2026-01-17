/**
 * Economy Service - API layer for economy operations
 *
 * Endpoints:
 * - GET /api/economy/currencies - List currencies
 * - GET /api/economy/balance - Get balances
 * - GET /api/economy/transactions - Transaction history
 * - POST /api/economy/transfer - Transfer funds
 * - GET /api/economy/vendors - List vendors
 * - GET /api/economy/vendors/:id - Vendor details
 * - POST /api/economy/vendors/:id/buy - Buy item
 * - POST /api/economy/vendors/:id/sell - Sell item
 * - POST /api/economy/vendors/:id/haggle - Haggle price
 */

import { api } from './client';

// =============================================================================
// TYPES - Currency & Balance
// =============================================================================

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  is_primary: number;
  exchange_rate_to_primary: number;
}

export interface Wallet {
  primary: number;
  currencies: Record<string, number>;
}

export interface BalanceResponse {
  wallet: Wallet;
  bank: Record<string, number>;
  crypto: Record<string, number>;
  stashes: Record<string, number>;
  stats: {
    totalEarnedCareer: number;
    totalSpentCareer: number;
    totalDebt: number;
    creditScore: number;
    creditLimit: number;
    creditUtilized: number;
  };
}

// =============================================================================
// TYPES - Transactions
// =============================================================================

export type TransactionType =
  | 'PURCHASE'
  | 'SALE'
  | 'TRANSFER'
  | 'MISSION_REWARD'
  | 'MISSION_PENALTY'
  | 'FACTION_CONTRIBUTION'
  | 'REPAIR'
  | 'MEDICAL'
  | 'BRIBE';

export interface Transaction {
  id: string;
  occurred_at: string;
  transaction_type: TransactionType;
  amount: number;
  is_income: number;
  description: string;
  counterparty_name?: string;
  item_name?: string;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// =============================================================================
// TYPES - Vendors
// =============================================================================

export type VendorType =
  | 'GENERAL'
  | 'WEAPONS'
  | 'ARMOR'
  | 'MEDICAL'
  | 'TECH'
  | 'CYBERWARE'
  | 'BLACK_MARKET'
  | 'FIXER';

export interface VendorSummary {
  id: string;
  vendor_type: VendorType;
  specialization?: string;
  npc_name: string;
  location_name: string;
}

export interface VendorDetail {
  id: string;
  type: VendorType;
  buyPriceModifier: number;
  sellPriceModifier: number;
  haggleDifficulty: number;
  acceptsStolen: boolean;
  acceptsContraband: boolean;
  npc: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface VendorItem {
  itemId: string;
  quantity: number;
  price: number;
  item: {
    id: string;
    name: string;
    description?: string;
    itemType: string;
    rarity: string;
    baseValue: number;
    weight?: number;
  };
}

export interface VendorInventory {
  base: VendorItem[];
  rotating: VendorItem[];
  limited: VendorItem[];
}

export interface VendorDetailsResponse {
  vendor: VendorDetail;
  inventory: VendorInventory;
}

// =============================================================================
// TYPES - Trading
// =============================================================================

export type PaymentMethod = 'wallet' | 'bank' | 'crypto' | 'credit';

export interface BuyRequest {
  itemId: string;
  quantity: number;
  paymentMethod?: PaymentMethod;
}

export interface BuyResponse {
  transactionId: string;
  inventoryId: string;
  item: {
    id: string;
    name: string;
    quantity: number;
  };
  price: {
    unitPrice: number;
    quantity: number;
    total: number;
  };
  paymentMethod: PaymentMethod;
}

export interface SellRequest {
  inventoryItemId: string;
  quantity: number;
}

export interface SellResponse {
  transactionId: string;
  item: {
    id: string;
    name: string;
    quantity: number;
  };
  price: {
    unitPrice: number;
    quantity: number;
    total: number;
  };
}

export interface HaggleRequest {
  itemId: string;
  action: 'buy' | 'sell';
  proposedPrice: number;
}

export type HaggleResult = 'SUCCESS' | 'PARTIAL' | 'FAILURE' | 'CRITICAL_FAILURE';

export interface HaggleResponse {
  haggleResult: HaggleResult;
  roll: {
    dice: number;
    modifier: number;
    total: number;
    target: number;
  };
  prices: {
    original: number;
    proposed: number;
    final: number;
    discount: number;
  };
  vendorReaction: string;
}

export interface TransferRequest {
  amount: number;
  fromAccount: 'wallet' | 'bank' | 'crypto';
  toAccount: 'wallet' | 'bank' | 'crypto';
  description?: string;
}

export interface TransferResponse {
  transactionId: string;
  amount: number;
  from: string;
  to: string;
  message: string;
}

// =============================================================================
// SERVICE
// =============================================================================

export const economyService = {
  // =========================================================================
  // Currency & Balance
  // =========================================================================

  /**
   * Get all available currencies
   */
  async getCurrencies(): Promise<{ currencies: Currency[] }> {
    return api.get('/economy/currencies');
  },

  /**
   * Get character's current balances across all accounts
   */
  async getBalance(): Promise<BalanceResponse> {
    return api.get('/economy/balance');
  },

  /**
   * Get transaction history (paginated)
   */
  async getTransactions(options?: {
    limit?: number;
    offset?: number;
  }): Promise<TransactionHistoryResponse> {
    const params: Record<string, string> = {};
    if (options?.limit) params.limit = String(options.limit);
    if (options?.offset) params.offset = String(options.offset);

    return api.get('/economy/transactions', { params });
  },

  /**
   * Transfer funds between accounts
   */
  async transfer(data: TransferRequest): Promise<TransferResponse> {
    return api.post('/economy/transfer', data);
  },

  // =========================================================================
  // Vendors
  // =========================================================================

  /**
   * List vendors near character's location
   */
  async getVendors(): Promise<{
    vendors: VendorSummary[];
    location: string;
  }> {
    return api.get('/economy/vendors');
  },

  /**
   * Get vendor details and inventory
   */
  async getVendor(vendorId: string): Promise<VendorDetailsResponse> {
    return api.get(`/economy/vendors/${vendorId}`);
  },

  /**
   * Buy item from vendor
   */
  async buy(vendorId: string, data: BuyRequest): Promise<BuyResponse> {
    return api.post(`/economy/vendors/${vendorId}/buy`, data);
  },

  /**
   * Sell item to vendor
   */
  async sell(vendorId: string, data: SellRequest): Promise<SellResponse> {
    return api.post(`/economy/vendors/${vendorId}/sell`, data);
  },

  /**
   * Attempt to haggle for a better price
   */
  async haggle(vendorId: string, data: HaggleRequest): Promise<HaggleResponse> {
    return api.post(`/economy/vendors/${vendorId}/haggle`, data);
  },
};

export default economyService;
