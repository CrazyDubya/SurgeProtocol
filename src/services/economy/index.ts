/**
 * Surge Protocol - Economy Services
 *
 * Services for managing the in-game economy:
 * - TransactionService: Credit transfers, purchases, debt management
 * - VendorService: Vendor interactions, buy/sell, haggling
 */

export {
  TransactionService,
  type AccountType,
  type PaymentMethod,
  type TransferParams,
  type PurchaseParams,
  type DebtCreateParams,
  type DebtPaymentParams,
  type CharacterFinances,
  type BalanceSummary,
} from './transaction';

export {
  VendorService,
  type VendorInfo,
  type VendorInventoryItem,
  type ItemDefinition,
  type HaggleResult,
  type BuyResult,
  type SellResult,
} from './vendor';
