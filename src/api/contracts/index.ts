
/**
 * Surge Protocol - Contract & Debt System Routes
 *
 * Endpoints:
 * - GET /contracts - List available contract types
 * - GET /contracts/:id - Get contract details
 * - GET /contracts/character - List signed contracts
 * - POST /contracts/character/sign - Sign a new contract
 * - POST /contracts/character/:id/terminate - Early termination
 * - GET /contracts/debts - List debts
 * - GET /contracts/debts/:id - Get debt details
 * - POST /contracts/debts/:id/payment - Make a payment
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireCharacterMiddleware, type AuthVariables } from '../../middleware/auth';
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { ContractService } from '../../services/contracts/contract';
import { DebtService } from '../../services/contracts/debt';

type Bindings = {
    DB: D1Database;
    CACHE: KVNamespace;
    JWT_SECRET: string;
};

// --- schemas ---
const signContractSchema = z.object({
    contract_definition_id: z.string().min(1),
    issuer_npc_id: z.string().optional(),
    issuer_faction_id: z.string().optional(),
    custom_terms: z.record(z.unknown()).optional(),
    auto_renew: z.boolean().default(false),
});

const terminateContractSchema = z.object({
    reason: z.string().optional(),
});

const debtPaymentSchema = z.object({
    amount: z.number().positive(),
    payment_source: z.enum(['WALLET', 'BANK', 'CRYPTO']).default('WALLET'),
});

// --- Routes ---
export const contractRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

contractRoutes.use('*', authMiddleware());

// Contract definition formatting moved to ContractCatalogService if needed


// 1. Contract Definitions
contractRoutes.get('/', async (c) => {
    const service = new ContractService(c.env.DB, c.env.CACHE);
    const type = c.req.query('type');
    const contracts = await service.listContractDefinitions({ type });
    return c.json({ success: true, data: { contracts } });
});

contractRoutes.get('/:id', async (c) => {
    const id = c.req.param('id');
    const service = new ContractService(c.env.DB, c.env.CACHE);
    const contract = await service.getContractDefinition(id);

    if (!contract) {
        return c.json({ success: false, errors: [{ message: 'Contract definition not found' }] }, 404);
    }

    return c.json({ success: true, data: { contract } });
});


// 2. Character Contracts
contractRoutes.get('/character', requireCharacterMiddleware(), async (c) => {
    const characterId = c.get('characterId')!;
    const service = new ContractService(c.env.DB, c.env.CACHE);
    const contracts = await service.getActiveContracts(characterId);
    return c.json({ success: true, data: { contracts } });
});

contractRoutes.post('/character/sign', requireCharacterMiddleware(), zValidator('json', signContractSchema), async (c) => {
    const characterId = c.get('characterId')!;
    const body = c.req.valid('json');
    const service = new ContractService(c.env.DB, c.env.CACHE);

    try {
        const result = await service.signContract({
            characterId,
            definitionId: body.contract_definition_id,
            npcId: body.issuer_npc_id,
            factionId: body.issuer_faction_id,
            customTerms: body.custom_terms,
            autoRenew: body.auto_renew
        });
        return c.json({ success: true, data: result });
    } catch (err: any) {
        return c.json({ success: false, errors: [{ message: err.message }] }, 400);
    }
});

contractRoutes.post('/character/:id/terminate', requireCharacterMiddleware(), zValidator('json', terminateContractSchema), async (c) => {
    const contractId = c.req.param('id');
    const characterId = c.get('characterId')!;
    const body = c.req.valid('json');
    const service = new ContractService(c.env.DB, c.env.CACHE);

    try {
        await service.terminateContract(characterId, contractId, body.reason);
        return c.json({ success: true, data: { message: 'Contract terminated' } });
    } catch (err: any) {
        return c.json({ success: false, errors: [{ message: err.message }] }, 400);
    }
});


// 3. Debts
contractRoutes.get('/debts', requireCharacterMiddleware(), async (c) => {
    const characterId = c.get('characterId')!;
    const activeOnly = c.req.query('active') === 'true';
    const service = new DebtService(c.env.DB, c.env.CACHE);
    const debts = await service.getDebts(characterId, activeOnly);
    return c.json({ success: true, data: { debts } });
});

contractRoutes.get('/debts/:id', requireCharacterMiddleware(), async (c) => {
    const id = c.req.param('id');
    const characterId = c.get('characterId')!;
    const service = new DebtService(c.env.DB, c.env.CACHE);
    const debt = await service.getDebt(id, characterId);

    if (!debt) return c.json({ success: false, errors: [{ message: 'Debt not found' }] }, 404);

    return c.json({ success: true, data: { debt } });
});

contractRoutes.post('/debts/:id/payment', requireCharacterMiddleware(), zValidator('json', debtPaymentSchema), async (c) => {
    const id = c.req.param('id');
    const characterId = c.get('characterId')!;
    const body = c.req.valid('json');
    const service = new DebtService(c.env.DB, c.env.CACHE);

    try {
        const result = await service.makePayment(characterId, id, body.amount);
        return c.json({ success: true, data: result });
    } catch (err: any) {
        return c.json({ success: false, errors: [{ message: err.message }] }, 400);
    }
});
