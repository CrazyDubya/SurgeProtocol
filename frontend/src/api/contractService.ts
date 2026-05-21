
import { api } from './client';

export interface ContractDefinition {
    id: string;
    code: string;
    name: string;
    description: string;
    contract_type: string;
    // ... comprehensive fields omitted for brevity/MVP
}

export interface CharacterContract {
    id: string;
    contract_definition_id: string;
    status: string;
    signed_at: string;
    start_date: string;
    // ...
}

export interface Debt {
    id: string;
    creditor_name: string;
    current_balance: number;
    original_amount: number;
    interest_rate_annual: number;
    next_payment_due: string;
    status: string;
}

export const contractService = {
    async getContractDefinitions(): Promise<{ contracts: ContractDefinition[] }> {
        return api.get('/contracts');
    },

    async getActiveContracts(): Promise<{ contracts: CharacterContract[] }> {
        return api.get('/contracts/character');
    },

    async signContract(definitionId: string, options?: any): Promise<{ id: string; signed_at: string }> {
        return api.post('/contracts/character/sign', { contract_definition_id: definitionId, ...options });
    },

    async terminateContract(contractId: string, reason?: string): Promise<void> {
        return api.post(`/contracts/character/${contractId}/terminate`, { reason });
    },

    async getDebts(activeOnly = true): Promise<{ debts: Debt[] }> {
        return api.get('/contracts/debts', { params: { active: String(activeOnly) } });
    },

    async payDebt(debtId: string, amount: number): Promise<{ newBalance: number; debtSettled: boolean }> {
        return api.post(`/contracts/debts/${debtId}/payment`, { amount });
    }
};
