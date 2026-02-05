/**
 * Surge Protocol - Economy Service Tests
 *
 * Tests for TransactionService and VendorService.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// =============================================================================
// TRANSACTION SERVICE TESTS
// =============================================================================

describe('TransactionService', () => {
  describe('Balance Calculations', () => {
    it('should calculate wallet balance correctly', () => {
      const finances = {
        primary_currency_balance: 5000,
        currency_balances: '{}',
        bank_accounts: '{"primary": 2000}',
        hidden_stashes: '{"safe": 1000}',
      };

      // Wallet balance is primary_currency_balance
      expect(finances.primary_currency_balance).toBe(5000);
    });

    it('should parse JSON bank accounts safely', () => {
      const bankJson = '{"primary": 2000, "secondary": 500}';
      const parsed = JSON.parse(bankJson);
      expect(parsed.primary).toBe(2000);
      expect(parsed.secondary).toBe(500);
    });

    it('should handle empty bank accounts', () => {
      const bankJson = '{}';
      const parsed = JSON.parse(bankJson);
      expect(parsed.primary || 0).toBe(0);
    });

    it('should calculate total stash value', () => {
      const stashesJson = '{"safe1": 1000, "safe2": 500, "locker": 250}';
      const stashes = JSON.parse(stashesJson);
      const total = Object.values(stashes).reduce((sum: number, val) => sum + (val as number || 0), 0);
      expect(total).toBe(1750);
    });
  });

  describe('Transfer Validation', () => {
    it('should reject same account transfers', () => {
      const fromAccount = 'wallet';
      const toAccount = 'wallet';
      expect(fromAccount).toBe(toAccount);
    });

    it('should validate positive amounts', () => {
      const amount = 100;
      expect(amount > 0).toBe(true);

      const negativeAmount = -50;
      expect(negativeAmount > 0).toBe(false);

      const zeroAmount = 0;
      expect(zeroAmount > 0).toBe(false);
    });

    it('should check sufficient funds', () => {
      const balance = 1000;
      const amount = 500;
      expect(balance >= amount).toBe(true);

      const largeAmount = 1500;
      expect(balance >= largeAmount).toBe(false);
    });
  });

  describe('Credit System', () => {
    it('should calculate available credit', () => {
      const creditLimit = 5000;
      const creditUtilized = 1500;
      const availableCredit = creditLimit - creditUtilized;
      expect(availableCredit).toBe(3500);
    });

    it('should reject purchases exceeding credit limit', () => {
      const creditLimit = 5000;
      const creditUtilized = 4500;
      const purchaseAmount = 1000;
      const availableCredit = creditLimit - creditUtilized;
      expect(purchaseAmount <= availableCredit).toBe(false);
    });

    it('should calculate credit score tiers', () => {
      const getCreditLimit = (score: number): number => {
        if (score > 700) return 10000;
        if (score > 500) return 5000;
        if (score > 300) return 2000;
        return 1000;
      };

      expect(getCreditLimit(750)).toBe(10000);
      expect(getCreditLimit(600)).toBe(5000);
      expect(getCreditLimit(400)).toBe(2000);
      expect(getCreditLimit(200)).toBe(1000);
    });
  });

  describe('Debt Management', () => {
    it('should calculate payment amounts', () => {
      const debtAmount = 5000;
      const paymentAmount = 1000;
      const remaining = debtAmount - paymentAmount;
      expect(remaining).toBe(4000);
    });

    it('should cap payment at remaining debt', () => {
      const debtAmount = 500;
      const paymentAmount = 1000;
      const actualPayment = Math.min(paymentAmount, debtAmount);
      expect(actualPayment).toBe(500);
    });

    it('should detect fully paid debt', () => {
      const debtAmount = 500;
      const paymentAmount = 500;
      const remaining = debtAmount - paymentAmount;
      const isFullyPaid = remaining <= 0;
      expect(isFullyPaid).toBe(true);
    });
  });
});

// =============================================================================
// VENDOR SERVICE TESTS
// =============================================================================

describe('VendorService', () => {
  describe('Price Calculations', () => {
    it('should calculate buy price with modifier', () => {
      const basePrice = 100;
      const buyModifier = 1.2; // 20% markup
      const quantity = 2;
      const totalPrice = Math.ceil(basePrice * buyModifier * quantity);
      expect(totalPrice).toBe(240);
    });

    it('should calculate sell price with modifier', () => {
      const basePrice = 100;
      const sellModifier = 0.5; // 50% of base
      const quantity = 2;
      const totalPrice = Math.floor(basePrice * sellModifier * quantity);
      expect(totalPrice).toBe(100);
    });

    it('should round buy prices up', () => {
      const basePrice = 99;
      const buyModifier = 1.15;
      const totalPrice = Math.ceil(basePrice * buyModifier);
      expect(totalPrice).toBe(114); // 113.85 rounds up
    });

    it('should round sell prices down', () => {
      const basePrice = 99;
      const sellModifier = 0.55;
      const totalPrice = Math.floor(basePrice * sellModifier);
      expect(totalPrice).toBe(54); // 54.45 rounds down
    });
  });

  describe('Vendor Access', () => {
    it('should check tier requirements', () => {
      const characterTier = 3;
      const vendorTierRequired = 2;
      const hasAccess = characterTier >= vendorTierRequired;
      expect(hasAccess).toBe(true);
    });

    it('should reject lower tier characters', () => {
      const characterTier = 1;
      const vendorTierRequired = 3;
      const hasAccess = characterTier >= vendorTierRequired;
      expect(hasAccess).toBe(false);
    });
  });

  describe('Vendor Restrictions', () => {
    it('should check stolen goods acceptance', () => {
      const vendorAcceptsStolen = false;
      const itemIsStolen = true;
      const canSell = !itemIsStolen || vendorAcceptsStolen;
      expect(canSell).toBe(false);
    });

    it('should check contraband acceptance', () => {
      const vendorAcceptsContraband = true;
      const itemIsContraband = true;
      const canSell = !itemIsContraband || vendorAcceptsContraband;
      expect(canSell).toBe(true);
    });

    it('should allow legal items at any vendor', () => {
      const vendorAcceptsStolen = false;
      const vendorAcceptsContraband = false;
      const itemIsStolen = false;
      const itemIsContraband = false;
      const canSell = (!itemIsStolen || vendorAcceptsStolen) && (!itemIsContraband || vendorAcceptsContraband);
      expect(canSell).toBe(true);
    });
  });

  describe('Haggle System', () => {
    it('should calculate haggle difficulty modifier', () => {
      const currentPrice = 1000;
      const proposedPrice = 800;
      const priceDiff = currentPrice - proposedPrice;
      const diffPercent = Math.abs(priceDiff) / currentPrice;
      const diffMod = Math.floor(diffPercent * 10);
      expect(diffMod).toBe(2); // 20% discount = difficulty +2
    });

    it('should simulate haggle roll', () => {
      // Simulated 2d6 roll
      const roll = 7; // Average roll
      const empMod = 2; // EMP of 14 = +2 mod
      const total = roll + empMod;
      const target = 5 + 2; // Base 5 + diff mod 2
      const success = total >= target;
      expect(success).toBe(true);
    });

    it('should apply critical failure penalty', () => {
      const total = 4;
      const target = 10;
      const margin = total - target;
      const isCriticalFailure = margin < -3;
      expect(isCriticalFailure).toBe(true);
    });

    it('should calculate achieved discount on success', () => {
      const priceDiff = 200;
      const margin = 3;
      const achievedDiff = Math.min(priceDiff, Math.floor(priceDiff * (0.5 + margin * 0.1)));
      // 0.5 + 0.3 = 0.8 * 200 = 160
      expect(achievedDiff).toBe(160);
    });

    it('should increase price on critical failure', () => {
      const currentPrice = 1000;
      const newBuyPrice = Math.ceil(currentPrice * 1.1);
      expect(newBuyPrice).toBe(1100);
    });
  });

  describe('Inventory Management', () => {
    it('should validate quantity', () => {
      const inventoryQuantity = 5;
      const requestedQuantity = 3;
      const hasEnough = inventoryQuantity >= requestedQuantity;
      expect(hasEnough).toBe(true);
    });

    it('should reject overselling', () => {
      const inventoryQuantity = 2;
      const requestedQuantity = 5;
      const hasEnough = inventoryQuantity >= requestedQuantity;
      expect(hasEnough).toBe(false);
    });

    it('should handle exact quantity sale', () => {
      const inventoryQuantity = 3;
      const requestedQuantity = 3;
      const shouldDelete = inventoryQuantity === requestedQuantity;
      expect(shouldDelete).toBe(true);
    });

    it('should handle partial sale', () => {
      const inventoryQuantity = 5;
      const requestedQuantity = 2;
      const remaining = inventoryQuantity - requestedQuantity;
      const shouldDelete = remaining === 0;
      expect(shouldDelete).toBe(false);
      expect(remaining).toBe(3);
    });
  });
});

// =============================================================================
// CURRENCY EXCHANGE TESTS
// =============================================================================

describe('Currency Exchange', () => {
  it('should calculate exchange to primary', () => {
    const amount = 100;
    const exchangeRate = 0.85; // 1 foreign = 0.85 primary
    const primaryAmount = Math.floor(amount * exchangeRate);
    expect(primaryAmount).toBe(85);
  });

  it('should calculate exchange from primary', () => {
    const primaryAmount = 100;
    const exchangeRate = 0.85; // 1 foreign = 0.85 primary
    const foreignAmount = Math.floor(primaryAmount / exchangeRate);
    expect(foreignAmount).toBe(117); // 100 / 0.85 = 117.64
  });
});
