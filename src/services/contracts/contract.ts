
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import type { CharacterContract, ContractDefinition } from './types';

export class ContractService {
    constructor(
        private db: D1Database,
        _cache: KVNamespace
    ) { }

    /**
     * Get all active contracts for a character
     */
    async getActiveContracts(characterId: string): Promise<CharacterContract[]> {
        const result = await this.db.prepare(
            `SELECT * FROM character_contracts WHERE character_id = ? AND status = 'ACTIVE'`
        ).bind(characterId).all<CharacterContract>();
        return result.results;
    }

    /**
     * Get full contract details
     */
    async getContract(contractId: string, characterId: string): Promise<{ contract: CharacterContract, definition: ContractDefinition } | null> {
        const contract = await this.db.prepare(
            'SELECT * FROM character_contracts WHERE id = ? AND character_id = ?'
        ).bind(contractId, characterId).first<CharacterContract>();

        if (!contract) return null;

        const definition = await this.db.prepare(
            'SELECT * FROM contract_definitions WHERE id = ?'
        ).bind(contract.contract_definition_id).first<ContractDefinition>();

        if (!definition) throw new Error('Contract definition missing'); // Integrity error

        return { contract, definition };
    }

    /**
     * Sign a new contract
     */
    async signContract(params: {
        characterId: string;
        definitionId: string;
        npcId?: string;
        factionId?: string;
        customTerms?: any;
        autoRenew?: boolean;
    }): Promise<{ id: string; signed_at: string }> {
        // 1. Validate Definition
        const def = await this.db.prepare(
            'SELECT * FROM contract_definitions WHERE id = ?'
        ).bind(params.definitionId).first<ContractDefinition>();

        if (!def) throw new Error('Contract definition not found');

        // 2. Create Record
        // const { nanoid } = await import('nanoid');
        const id = crypto.randomUUID();
        const signedAt = new Date().toISOString();
        // Simple start date: now. End date depends on duration type.
        // For MVP, assuming indefinite or manually managed unless specified.
        const startDate = signedAt;

        await this.db.prepare(
            `INSERT INTO character_contracts (
              id, character_id, contract_definition_id, signed_at,
              issuer_npc_id, issuer_faction_id, custom_terms,
              start_date, auto_renew, status,
              current_performance_score, violations_count, warnings_count,
              total_paid_to_player, total_paid_by_player,
              created_at, updated_at
          ) VALUES (
              ?, ?, ?, ?,
              ?, ?, ?,
              ?, ?, 'ACTIVE',
              100, 0, 0,
              0, 0,
              datetime('now'), datetime('now')
          )`
        ).bind(
            id, params.characterId, params.definitionId, signedAt,
            params.npcId || null, params.factionId || null, params.customTerms ? JSON.stringify(params.customTerms) : null,
            startDate, params.autoRenew ? 1 : 0
        ).run();

        return { id, signed_at: signedAt };
    }

    /**
     * Terminate a contract
     */
    async terminateContract(characterId: string, contractId: string, reason?: string): Promise<boolean> {
        const contract = await this.db.prepare(
            'SELECT * FROM character_contracts WHERE id = ? AND character_id = ?'
        ).bind(contractId, characterId).first<CharacterContract>();

        if (!contract) throw new Error('Contract not found');
        if (contract.status !== 'ACTIVE') throw new Error('Contract is not active');

        await this.db.prepare(
            `UPDATE character_contracts
           SET status = 'TERMINATED', terminated_at = datetime('now'),
               termination_reason = ?, termination_initiated_by = 'PLAYER',
               updated_at = datetime('now')
           WHERE id = ?`
        ).bind(reason || 'Player Request', contractId).run();

        return true;
    }

    /**
     * List all available contract definitions
     */
    async listContractDefinitions(filters: { type?: string } = {}): Promise<ContractDefinition[]> {
        let query = 'SELECT * FROM contract_definitions';
        const params: any[] = [];

        if (filters.type) {
            query += ' WHERE contract_type = ?';
            params.push(filters.type);
        }

        query += ' ORDER BY contract_type, name';
        const result = await this.db.prepare(query).bind(...params).all<ContractDefinition>();
        return result.results || [];
    }

    /**
     * Get a specific contract definition
     */
    async getContractDefinition(id: string): Promise<ContractDefinition | null> {
        return this.db.prepare('SELECT * FROM contract_definitions WHERE id = ?').bind(id).first<ContractDefinition>();
    }
}
