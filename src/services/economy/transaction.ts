/**
 * Surge Protocol - Transaction Service
 *
 * Handles all credit/currency transactions:
 * - Credit transfers between accounts
 * - Purchase validation
 * - Debt management
 * - Transaction history tracking
 */

import { CharacterService, type ServiceContext, ErrorCodes } from '../base';

// =============================================================================
// TYPES
// =============================================================================

export type AccountType = 'wallet' | 'bank' | 'stash';
export type PaymentMethod = 'wallet' | 'bank' | 'credit';

export interface TransferParams {
  amount: number;
  fromAccount: AccountType;
  toAccount: AccountType;
  description?: string;
}

export interface PurchaseParams {
  amount: number;
  paymentMethod: PaymentMethod;
  vendorId?: string;
  itemId?: string;
  description: string;
}

export interface DebtCreateParams {
  amount: number;
  creditorType: 'BANK' | 'FACTION' | 'NPC' | 'CORPORATE';
  creditorId: string;
  creditorName: string;
  interestRate: number;
  durationDays: number;
  description: string;
}

export interface DebtPaymentParams {
  debtId: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface CharacterFinances {
  id: string;
  character_id: string;
  primary_currency_balance: number;
  currency_balances: string;
  bank_accounts: string;
  hidden_stashes: string;
  total_earned_career: number;
  total_spent_career: number;
  total_debt: number;
  credit_score: number;
  credit_limit: number;
  credit_utilized: number;
}

export interface BalanceSummary {
  wallet: {
    primary: number;
    currencies: Record<string, number>;
  };
  bank: Record<string, number>;
  stashes: Record<string, number>;
  stats: {
    totalEarnedCareer: number;
    totalSpentCareer: number;
    totalDebt: number;
    creditScore: number;
    creditLimit: number;
    creditUtilized: number;
    availableCredit: number;
  };
}

// =============================================================================
// TRANSACTION SERVICE
// =============================================================================

export class TransactionService extends CharacterService {
  constructor(context: ServiceContext) {
    super(context);
  }

  /**
   * Get or create character finances record.
   */
  async getOrCreateFinances(): Promise<CharacterFinances> {
    let finances = await this.query<CharacterFinances>(
      'SELECT * FROM character_finances WHERE character_id = ?',
      this.requiredCharacterId
    );

    if (!finances) {
      const id = crypto.randomUUID();
      await this.execute(
        `INSERT INTO character_finances (id, character_id, primary_currency_balance)
         VALUES (?, ?, 1000)`,
        id,
        this.requiredCharacterId
      );

      finances = {
        id,
        character_id: this.requiredCharacterId,
        primary_currency_balance: 1000,
        currency_balances: '{}',
        bank_accounts: '{}',
        hidden_stashes: '{}',
        total_earned_career: 0,
        total_spent_career: 0,
        total_debt: 0,
        credit_score: 500,
        credit_limit: 1000,
        credit_utilized: 0,
      };
    }

    return finances;
  }

  /**
   * Get balance summary for the character.
   */
  async getBalanceSummary(): Promise<BalanceSummary> {
    const finances = await this.getOrCreateFinances();

    const currencyBalances = this.safeParseJSON<Record<string, number>>(
      finances.currency_balances,
      {}
    );
    const bankAccounts = this.safeParseJSON<Record<string, number>>(
      finances.bank_accounts,
      {}
    );
    const hiddenStashes = this.safeParseJSON<Record<string, number>>(
      finances.hidden_stashes,
      {}
    );

    return {
      wallet: {
        primary: finances.primary_currency_balance,
        currencies: currencyBalances,
      },
      bank: bankAccounts,
      stashes: hiddenStashes,
      stats: {
        totalEarnedCareer: finances.total_earned_career,
        totalSpentCareer: finances.total_spent_career,
        totalDebt: finances.total_debt,
        creditScore: finances.credit_score,
        creditLimit: finances.credit_limit,
        creditUtilized: finances.credit_utilized,
        availableCredit: finances.credit_limit - finances.credit_utilized,
      },
    };
  }

  /**
   * Get account balance for a specific account type.
   */
  getAccountBalance(finances: CharacterFinances, account: AccountType): number {
    switch (account) {
      case 'wallet':
        return finances.primary_currency_balance || 0;
      case 'bank': {
        const bankAccounts = this.safeParseJSON<Record<string, number>>(
          finances.bank_accounts,
          { primary: 0 }
        );
        return bankAccounts.primary || 0;
      }
      case 'stash': {
        const stashes = this.safeParseJSON<Record<string, number>>(
          finances.hidden_stashes,
          {}
        );
        return Object.values(stashes).reduce((sum, val) => sum + (val || 0), 0);
      }
      default:
        return 0;
    }
  }

  /**
   * Transfer credits between accounts.
   */
  async transfer(params: TransferParams): Promise<{
    transactionId: string;
    amount: number;
    from: AccountType;
    to: AccountType;
  }> {
    const { amount, fromAccount, toAccount, description } = params;

    if (fromAccount === toAccount) {
      this.throw(
        ErrorCodes.VALIDATION_ERROR,
        'Cannot transfer to the same account'
      );
    }

    if (amount <= 0) {
      this.throw(ErrorCodes.VALIDATION_ERROR, 'Amount must be positive');
    }

    const finances = await this.getOrCreateFinances();
    const sourceBalance = this.getAccountBalance(finances, fromAccount);

    if (sourceBalance < amount) {
      this.throw(
        ErrorCodes.INSUFFICIENT_FUNDS,
        `Insufficient funds in ${fromAccount}. Available: ${sourceBalance}, Needed: ${amount}`
      );
    }

    // Execute transfer (simplified - wallet only for now)
    await this.execute(
      `UPDATE character_finances SET
        primary_currency_balance = primary_currency_balance + ?,
        updated_at = datetime('now')
       WHERE character_id = ?`,
      fromAccount === 'wallet' ? -amount : amount,
      this.requiredCharacterId
    );

    // Record transaction
    const transactionId = crypto.randomUUID();
    await this.execute(
      `INSERT INTO financial_transactions
        (id, character_id, transaction_type, amount, is_income,
         source_type, source_name, destination_type, destination_name,
         description, category)
       VALUES (?, ?, 'TRANSFER', ?, 0, 'ACCOUNT', ?, 'ACCOUNT', ?, ?, 'INTERNAL')`,
      transactionId,
      this.requiredCharacterId,
      amount,
      fromAccount,
      toAccount,
      description || `Transfer from ${fromAccount} to ${toAccount}`
    );

    return {
      transactionId,
      amount,
      from: fromAccount,
      to: toAccount,
    };
  }

  /**
   * Validate and process a purchase.
   */
  async processPurchase(params: PurchaseParams): Promise<{
    transactionId: string;
    balanceAfter: number;
  }> {
    const { amount, paymentMethod, vendorId, itemId, description } = params;

    if (amount <= 0) {
      this.throw(ErrorCodes.VALIDATION_ERROR, 'Amount must be positive');
    }

    const finances = await this.getOrCreateFinances();

    if (paymentMethod === 'credit') {
      const creditAvailable = finances.credit_limit - finances.credit_utilized;
      if (amount > creditAvailable) {
        this.throw(
          ErrorCodes.INSUFFICIENT_FUNDS,
          `Insufficient credit. Available: ${creditAvailable}`
        );
      }

      // Use credit
      await this.execute(
        `UPDATE character_finances SET
          credit_utilized = credit_utilized + ?,
          total_spent_career = total_spent_career + ?,
          updated_at = datetime('now')
         WHERE character_id = ?`,
        amount,
        amount,
        this.requiredCharacterId
      );
    } else {
      const balance = this.getAccountBalance(
        finances,
        paymentMethod as AccountType
      );
      if (balance < amount) {
        this.throw(
          ErrorCodes.INSUFFICIENT_FUNDS,
          `Insufficient funds. Available: ${balance}, Needed: ${amount}`
        );
      }

      // Deduct from wallet
      await this.execute(
        `UPDATE character_finances SET
          primary_currency_balance = primary_currency_balance - ?,
          total_spent_career = total_spent_career + ?,
          updated_at = datetime('now')
         WHERE character_id = ?`,
        amount,
        amount,
        this.requiredCharacterId
      );
    }

    // Record transaction
    const transactionId = crypto.randomUUID();
    await this.execute(
      `INSERT INTO financial_transactions
        (id, character_id, transaction_type, amount, is_income,
         source_type, source_name, destination_type, destination_name,
         description, category, related_item_id)
       VALUES (?, ?, 'PURCHASE', ?, 0, 'CHARACTER', ?, 'VENDOR', ?, ?, 'SHOPPING', ?)`,
      transactionId,
      this.requiredCharacterId,
      amount,
      paymentMethod,
      vendorId || 'Unknown',
      description,
      itemId || null
    );

    // Get updated balance
    const updated = await this.getOrCreateFinances();

    return {
      transactionId,
      balanceAfter: updated.primary_currency_balance,
    };
  }

  /**
   * Process a sale (credits received).
   */
  async processSale(params: {
    amount: number;
    vendorId?: string;
    itemId?: string;
    description: string;
  }): Promise<{
    transactionId: string;
    balanceAfter: number;
  }> {
    const { amount, vendorId, itemId, description } = params;

    if (amount <= 0) {
      this.throw(ErrorCodes.VALIDATION_ERROR, 'Amount must be positive');
    }

    // Add to wallet
    await this.execute(
      `UPDATE character_finances SET
        primary_currency_balance = primary_currency_balance + ?,
        total_earned_career = total_earned_career + ?,
        updated_at = datetime('now')
       WHERE character_id = ?`,
      amount,
      amount,
      this.requiredCharacterId
    );

    // Record transaction
    const transactionId = crypto.randomUUID();
    await this.execute(
      `INSERT INTO financial_transactions
        (id, character_id, transaction_type, amount, is_income,
         source_type, source_name, destination_type, destination_name,
         description, category, related_item_id)
       VALUES (?, ?, 'SALE', ?, 1, 'VENDOR', ?, 'CHARACTER', 'Wallet', ?, 'SHOPPING', ?)`,
      transactionId,
      this.requiredCharacterId,
      amount,
      vendorId || 'Unknown',
      description,
      itemId || null
    );

    const updated = await this.getOrCreateFinances();

    return {
      transactionId,
      balanceAfter: updated.primary_currency_balance,
    };
  }

  /**
   * Check if character can afford a purchase.
   */
  async canAfford(amount: number, paymentMethod: PaymentMethod): Promise<boolean> {
    const finances = await this.getOrCreateFinances();

    if (paymentMethod === 'credit') {
      return amount <= finances.credit_limit - finances.credit_utilized;
    }

    return amount <= this.getAccountBalance(finances, paymentMethod as AccountType);
  }

  /**
   * Create a new debt.
   */
  async createDebt(params: DebtCreateParams): Promise<{ debtId: string }> {
    const {
      amount,
      creditorType,
      creditorId,
      creditorName,
      interestRate,
      durationDays,
      description,
    } = params;

    const debtId = crypto.randomUUID();
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + durationDays);

    await this.execute(
      `INSERT INTO character_debts
        (id, character_id, creditor_type, creditor_id, creditor_name,
         original_amount, current_amount, interest_rate,
         created_at, due_date, status, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
      debtId,
      this.requiredCharacterId,
      creditorType,
      creditorId,
      creditorName,
      amount,
      amount,
      interestRate,
      now.toISOString(),
      dueDate.toISOString(),
      description
    );

    // Update total debt
    await this.execute(
      `UPDATE character_finances SET
        total_debt = total_debt + ?,
        updated_at = datetime('now')
       WHERE character_id = ?`,
      amount,
      this.requiredCharacterId
    );

    return { debtId };
  }

  /**
   * Make a debt payment.
   */
  async payDebt(params: DebtPaymentParams): Promise<{
    transactionId: string;
    remainingDebt: number;
    debtPaid: boolean;
  }> {
    const { debtId, amount, paymentMethod } = params;

    // Get debt
    const debt = await this.query<{
      id: string;
      current_amount: number;
      creditor_name: string;
    }>('SELECT * FROM character_debts WHERE id = ? AND character_id = ?', debtId, this.requiredCharacterId);

    if (!debt) {
      this.throw(ErrorCodes.NOT_FOUND, 'Debt not found', 404);
    }

    const paymentAmount = Math.min(amount, debt.current_amount);

    // Check if can afford
    const canPay = await this.canAfford(paymentAmount, paymentMethod);
    if (!canPay) {
      this.throw(ErrorCodes.INSUFFICIENT_FUNDS, 'Insufficient funds for payment');
    }

    // Process payment
    await this.processPurchase({
      amount: paymentAmount,
      paymentMethod,
      description: `Debt payment to ${debt.creditor_name}`,
    });

    // Update debt
    const remainingDebt = debt.current_amount - paymentAmount;
    const status = remainingDebt <= 0 ? 'PAID' : 'ACTIVE';

    await this.execute(
      `UPDATE character_debts SET
        current_amount = ?,
        status = ?,
        updated_at = datetime('now')
       WHERE id = ?`,
      remainingDebt,
      status,
      debtId
    );

    // Update total debt
    await this.execute(
      `UPDATE character_finances SET
        total_debt = total_debt - ?,
        updated_at = datetime('now')
       WHERE character_id = ?`,
      paymentAmount,
      this.requiredCharacterId
    );

    return {
      transactionId: crypto.randomUUID(),
      remainingDebt,
      debtPaid: remainingDebt <= 0,
    };
  }

  /**
   * Update credit score based on payment behavior.
   */
  async updateCreditScore(change: number): Promise<number> {
    const finances = await this.getOrCreateFinances();
    const newScore = Math.max(0, Math.min(1000, finances.credit_score + change));

    await this.execute(
      `UPDATE character_finances SET
        credit_score = ?,
        credit_limit = CASE
          WHEN ? > 700 THEN 10000
          WHEN ? > 500 THEN 5000
          WHEN ? > 300 THEN 2000
          ELSE 1000
        END,
        updated_at = datetime('now')
       WHERE character_id = ?`,
      newScore,
      newScore,
      newScore,
      newScore,
      this.requiredCharacterId
    );

    return newScore;
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private safeParseJSON<T>(value: string | null | undefined, defaultValue: T): T {
    if (!value) return defaultValue;
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }
}
