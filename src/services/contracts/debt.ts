
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import type { Debt } from './types';

export class DebtService {
    constructor(
        private db: D1Database,
        _cache: KVNamespace
    ) { }

    /**
     * Get all debts for a character
     */
    async getDebts(characterId: string, activeOnly: boolean = false): Promise<Debt[]> {
        let query = 'SELECT * FROM debts WHERE character_id = ?';
        const params: any[] = [characterId];
        if (activeOnly) {
            query += " AND status = 'ACTIVE'";
        }
        query += ' ORDER BY next_payment_due ASC';
        const result = await this.db.prepare(query).bind(...params).all<Debt>();
        return result.results;
    }

    /**
     * Get specific debt details
     */
    async getDebt(debtId: string, characterId: string): Promise<Debt | null> {
        return this.db.prepare(
            'SELECT * FROM debts WHERE id = ? AND character_id = ?'
        ).bind(debtId, characterId).first<Debt>();
    }

    /**
     * Make a payment on a debt
     */
    async makePayment(characterId: string, debtId: string, amount: number): Promise<{ newBalance: number, debtSettled: boolean }> {
        const debt = await this.getDebt(debtId, characterId);
        if (!debt) throw new Error('Debt not found');
        if (debt.status !== 'ACTIVE' && debt.status !== 'DEFAULTED') throw new Error('Debt is not active');
        if (amount <= 0) throw new Error('Invalid payment amount');

        // Simple logic: reduce balance. Interest handling is complex and done via scheduled jobs typically.
        // For now, we just reduce balance.
        const newBalance = Math.max(0, debt.current_balance - amount);
        const settled = newBalance === 0;

        const newStatus = settled ? 'PAID' : debt.status;

        await this.db.prepare(
            `UPDATE debts
           SET current_balance = ?, status = ?,
               total_paid = total_paid + ?,
               last_payment_date = datetime('now'),
               updated_at = datetime('now')
           WHERE id = ?`
        ).bind(newBalance, newStatus, amount, debtId).run();

        // If settled, handle closing logic (e.g. return collateral) - Out of scope for this MVP refactor step

        return { newBalance, debtSettled: settled };
    }

    /**
     * Create a new debt (e.g. loan)
     */
    async createDebt(params: {
        characterId: string;
        creditorType: string;
        creditorName: string;
        amount: number;
        interestRate: number;
        interestType: string;
        minPayment: number;
        paymentFreq: string;
    }): Promise<{ id: string }> {
        // const { nanoid } = await import('nanoid');
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await this.db.prepare(
            `INSERT INTO debts (
              id, character_id, created_at,
              creditor_type, creditor_name,
              original_amount, current_balance,
              interest_rate_annual, interest_type,
              payment_frequency, minimum_payment,
              status, start_date,
              payments_made, payments_missed,
              total_paid, total_interest_paid,
              collection_started, legal_action_pending,
              garnishment_active, can_be_worked_off,
              updated_at
          ) VALUES (
              ?, ?, ?,
              ?, ?,
              ?, ?,
              ?, ?,
              ?, ?,
              'ACTIVE', ?,
              0, 0,
              0, 0,
              0, 0,
              0, 0,
              ?
          )`
        ).bind(
            id, params.characterId, now,
            params.creditorType, params.creditorName,
            params.amount, params.amount,
            params.interestRate, params.interestType,
            params.paymentFreq, params.minPayment,
            now,
            now
        ).run();

        return { id };
    }
}
