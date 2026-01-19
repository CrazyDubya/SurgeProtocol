/**
 * Surge Protocol - Contract & Debt System Routes
 *
 * Endpoints:
 *
 * Contract Definitions:
 * - GET /contracts - List available contract types
 * - GET /contracts/:id - Get contract details + terms
 * - GET /contracts/by-type/:type - Filter by contract type
 * - GET /contracts/by-issuer/:issuerId - Get contracts from specific issuer
 *
 * Character Contracts:
 * - GET /contracts/character - List signed contracts
 * - GET /contracts/character/active - List active contracts only
 * - GET /contracts/character/:id - Get contract status and performance
 * - POST /contracts/character/sign - Sign a new contract
 * - POST /contracts/character/:id/review - Submit performance review
 * - POST /contracts/character/:id/terminate - Early termination
 * - POST /contracts/character/:id/renew - Renew contract
 *
 * Debts:
 * - GET /contracts/debts - List all debts
 * - GET /contracts/debts/active - List active debts only
 * - GET /contracts/debts/:id - Get debt details + payment schedule
 * - POST /contracts/debts - Create new debt (from financing, etc.)
 * - POST /contracts/debts/:id/payment - Make a payment
 * - GET /contracts/debts/:id/schedule - Get payment schedule
 * - POST /contracts/debts/:id/negotiate - Negotiate terms
 */

import { Hono } from 'hono';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

interface ContractDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  legal_text: string | null;
  contract_type: string;
  issuer_type: string;
  issuer_faction_id: string | null;
  duration_type: string;
  duration_value: number | null;
  renewable: number;
  termination_conditions: string | null;
  early_termination_penalty: number | null;
  player_obligations: string | null;
  issuer_obligations: string | null;
  performance_metrics: string | null;
  compensation: string | null;
  benefits_granted: string | null;
  access_granted: string | null;
  discounts_granted: string | null;
  exclusivity_clauses: string | null;
  non_compete_clauses: string | null;
  restricted_activities: string | null;
  required_availability: number | null;
  has_tracking_requirements: number;
  gps_tracking_required: number;
  performance_reviews_frequency: number | null;
  hidden_clauses: string | null;
  hidden_reveal_condition: string | null;
  corporate_override_clause: number;
  created_at: string;
  updated_at: string;
}

interface CharacterContract {
  id: string;
  character_id: string;
  contract_definition_id: string;
  signed_at: string;
  issuer_npc_id: string | null;
  issuer_faction_id: string | null;
  custom_terms: string | null;
  start_date: string;
  end_date: string | null;
  auto_renew: number;
  status: string;
  current_performance_score: number;
  violations_count: number;
  warnings_count: number;
  total_paid_to_player: number;
  total_paid_by_player: number;
  next_payment_date: string | null;
  next_payment_amount: number | null;
  last_review_date: string | null;
  next_review_date: string | null;
  review_score: number | null;
  terminated_at: string | null;
  termination_reason: string | null;
  termination_initiated_by: string | null;
  termination_penalty_paid: number | null;
  hidden_clauses_revealed: string | null;
  corporate_override_invoked: number;
  created_at: string;
  updated_at: string;
}

interface Debt {
  id: string;
  character_id: string;
  created_at: string;
  creditor_type: string;
  creditor_npc_id: string | null;
  creditor_faction_id: string | null;
  creditor_name: string;
  original_amount: number;
  current_balance: number;
  currency_id: string | null;
  interest_rate_annual: number;
  interest_type: string | null;
  payment_frequency: string | null;
  minimum_payment: number;
  payment_due_day: number | null;
  is_secured: number;
  collateral_type: string | null;
  collateral_item_id: string | null;
  collateral_value: number | null;
  status: string;
  payments_made: number;
  payments_missed: number;
  total_paid: number;
  total_interest_paid: number;
  start_date: string;
  maturity_date: string | null;
  last_payment_date: string | null;
  next_payment_due: string | null;
  collection_started: number;
  collection_agency: string | null;
  legal_action_pending: number;
  garnishment_active: number;
  garnishment_percentage: number | null;
  partial_forgiveness: number | null;
  forgiveness_conditions: string | null;
  can_be_worked_off: number;
  updated_at: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function parseJsonField<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

function formatContractDefinition(row: ContractDefinition) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    legal_text: row.legal_text,
    type: {
      contract_type: row.contract_type,
      issuer_type: row.issuer_type,
      issuer_faction_id: row.issuer_faction_id,
    },
    duration: {
      type: row.duration_type,
      value: row.duration_value,
      renewable: Boolean(row.renewable),
    },
    termination: {
      conditions: parseJsonField<object[]>(row.termination_conditions, []),
      early_penalty: row.early_termination_penalty,
    },
    obligations: {
      player: parseJsonField<object[]>(row.player_obligations, []),
      issuer: parseJsonField<object[]>(row.issuer_obligations, []),
      performance_metrics: parseJsonField<Record<string, number>>(row.performance_metrics, {}),
    },
    benefits: {
      compensation: parseJsonField(row.compensation, null),
      benefits: parseJsonField<string[]>(row.benefits_granted, []),
      access: parseJsonField<string[]>(row.access_granted, []),
      discounts: parseJsonField<Record<string, number>>(row.discounts_granted, {}),
    },
    restrictions: {
      exclusivity: parseJsonField<string[]>(row.exclusivity_clauses, []),
      non_compete: parseJsonField<string[]>(row.non_compete_clauses, []),
      restricted_activities: parseJsonField<string[]>(row.restricted_activities, []),
      required_availability_hours: row.required_availability,
    },
    tracking: {
      has_tracking: Boolean(row.has_tracking_requirements),
      gps_required: Boolean(row.gps_tracking_required),
      review_frequency_days: row.performance_reviews_frequency,
    },
    fine_print: {
      has_hidden_clauses: Boolean(row.hidden_clauses),
      reveal_condition: row.hidden_reveal_condition,
      corporate_override: Boolean(row.corporate_override_clause),
    },
  };
}

function formatCharacterContract(row: CharacterContract, definition?: ContractDefinition) {
  const base = {
    id: row.id,
    character_id: row.character_id,
    contract_definition_id: row.contract_definition_id,
    signed_at: row.signed_at,
    parties: {
      issuer_npc_id: row.issuer_npc_id,
      issuer_faction_id: row.issuer_faction_id,
    },
    terms: {
      custom: parseJsonField(row.custom_terms, null),
      start_date: row.start_date,
      end_date: row.end_date,
      auto_renew: Boolean(row.auto_renew),
    },
    status: {
      current: row.status,
      performance_score: row.current_performance_score,
      violations: row.violations_count,
      warnings: row.warnings_count,
    },
    payments: {
      total_received: row.total_paid_to_player,
      total_paid: row.total_paid_by_player,
      next_date: row.next_payment_date,
      next_amount: row.next_payment_amount,
    },
    reviews: {
      last_date: row.last_review_date,
      next_date: row.next_review_date,
      last_score: row.review_score,
    },
    termination: row.terminated_at ? {
      date: row.terminated_at,
      reason: row.termination_reason,
      initiated_by: row.termination_initiated_by,
      penalty_paid: row.termination_penalty_paid,
    } : null,
    hidden: {
      clauses_revealed: parseJsonField<string[]>(row.hidden_clauses_revealed, []),
      corporate_override_invoked: Boolean(row.corporate_override_invoked),
    },
  };

  if (definition) {
    return {
      ...base,
      definition: formatContractDefinition(definition),
    };
  }

  return base;
}

function formatDebt(row: Debt) {
  return {
    id: row.id,
    character_id: row.character_id,
    created_at: row.created_at,
    creditor: {
      type: row.creditor_type,
      npc_id: row.creditor_npc_id,
      faction_id: row.creditor_faction_id,
      name: row.creditor_name,
    },
    amount: {
      original: row.original_amount,
      current_balance: row.current_balance,
      currency_id: row.currency_id,
      percent_paid: row.original_amount > 0 ? ((row.original_amount - row.current_balance) / row.original_amount) * 100 : 0,
    },
    terms: {
      interest_rate: row.interest_rate_annual,
      interest_type: row.interest_type,
      payment_frequency: row.payment_frequency,
      minimum_payment: row.minimum_payment,
      payment_due_day: row.payment_due_day,
    },
    collateral: row.is_secured ? {
      type: row.collateral_type,
      item_id: row.collateral_item_id,
      value: row.collateral_value,
    } : null,
    status: {
      current: row.status,
      payments_made: row.payments_made,
      payments_missed: row.payments_missed,
      total_paid: row.total_paid,
      total_interest_paid: row.total_interest_paid,
    },
    dates: {
      start: row.start_date,
      maturity: row.maturity_date,
      last_payment: row.last_payment_date,
      next_due: row.next_payment_due,
    },
    consequences: {
      collection_started: Boolean(row.collection_started),
      collection_agency: row.collection_agency,
      legal_action_pending: Boolean(row.legal_action_pending),
      garnishment_active: Boolean(row.garnishment_active),
      garnishment_percentage: row.garnishment_percentage,
    },
    forgiveness: {
      partial: row.partial_forgiveness,
      conditions: row.forgiveness_conditions,
      can_work_off: Boolean(row.can_be_worked_off),
    },
  };
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0] as string;
}

function calculateNextPaymentDate(frequency: string, lastPayment: string | null): string {
  const base = lastPayment ? new Date(lastPayment) : new Date();
  switch (frequency) {
    case 'WEEKLY':
      base.setDate(base.getDate() + 7);
      break;
    case 'BIWEEKLY':
      base.setDate(base.getDate() + 14);
      break;
    case 'MONTHLY':
      base.setMonth(base.getMonth() + 1);
      break;
    case 'QUARTERLY':
      base.setMonth(base.getMonth() + 3);
      break;
    default:
      base.setMonth(base.getMonth() + 1);
  }
  return toDateString(base);
}

// =============================================================================
// ROUTES
// =============================================================================

export const contractRoutes = new Hono<{ Bindings: Bindings }>();

// =============================================================================
// CONTRACT DEFINITION ENDPOINTS
// =============================================================================

/**
 * GET /contracts
 * List available contract types
 */
contractRoutes.get('/', async (c) => {
  const contractType = c.req.query('type');
  const issuerType = c.req.query('issuer_type');

  let query = 'SELECT * FROM contract_definitions WHERE 1=1';
  const params: string[] = [];

  if (contractType) {
    query += ' AND contract_type = ?';
    params.push(contractType.toUpperCase());
  }

  if (issuerType) {
    query += ' AND issuer_type = ?';
    params.push(issuerType.toUpperCase());
  }

  query += ' ORDER BY contract_type, name';

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all<ContractDefinition>();

  return c.json({
    success: true,
    data: {
      contracts: result.results.map(formatContractDefinition),
      total: result.results.length,
    },
  });
});

/**
 * GET /contracts/by-type/:type
 * Filter contracts by type
 */
contractRoutes.get('/by-type/:type', async (c) => {
  const { type } = c.req.param();

  const result = await c.env.DB.prepare(
    'SELECT * FROM contract_definitions WHERE contract_type = ? ORDER BY name'
  ).bind(type.toUpperCase()).all<ContractDefinition>();

  return c.json({
    success: true,
    data: {
      type,
      contracts: result.results.map(formatContractDefinition),
      total: result.results.length,
    },
  });
});

/**
 * GET /contracts/by-issuer/:issuerId
 * Get contracts from specific issuer (faction)
 */
contractRoutes.get('/by-issuer/:issuerId', async (c) => {
  const { issuerId } = c.req.param();

  const result = await c.env.DB.prepare(
    'SELECT * FROM contract_definitions WHERE issuer_faction_id = ? ORDER BY contract_type, name'
  ).bind(issuerId).all<ContractDefinition>();

  return c.json({
    success: true,
    data: {
      issuer_id: issuerId,
      contracts: result.results.map(formatContractDefinition),
      total: result.results.length,
    },
  });
});

/**
 * GET /contracts/character
 * List character's signed contracts
 */
contractRoutes.get('/character', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const status = c.req.query('status');

  let query = `
    SELECT cc.*, cd.*,
           cc.id as cc_id, cd.id as cd_id
    FROM character_contracts cc
    JOIN contract_definitions cd ON cc.contract_definition_id = cd.id
    WHERE cc.character_id = ?
  `;
  const params: string[] = [characterId];

  if (status) {
    query += ' AND cc.status = ?';
    params.push(status.toUpperCase());
  }

  query += ' ORDER BY cc.signed_at DESC';

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all();

  const contracts = result.results.map((row: Record<string, unknown>) => {
    const charContract: CharacterContract = {
      id: row.cc_id as string,
      character_id: row.character_id as string,
      contract_definition_id: row.contract_definition_id as string,
      signed_at: row.signed_at as string,
      issuer_npc_id: row.issuer_npc_id as string | null,
      issuer_faction_id: row.issuer_faction_id as string | null,
      custom_terms: row.custom_terms as string | null,
      start_date: row.start_date as string,
      end_date: row.end_date as string | null,
      auto_renew: row.auto_renew as number,
      status: row.status as string,
      current_performance_score: row.current_performance_score as number,
      violations_count: row.violations_count as number,
      warnings_count: row.warnings_count as number,
      total_paid_to_player: row.total_paid_to_player as number,
      total_paid_by_player: row.total_paid_by_player as number,
      next_payment_date: row.next_payment_date as string | null,
      next_payment_amount: row.next_payment_amount as number | null,
      last_review_date: row.last_review_date as string | null,
      next_review_date: row.next_review_date as string | null,
      review_score: row.review_score as number | null,
      terminated_at: row.terminated_at as string | null,
      termination_reason: row.termination_reason as string | null,
      termination_initiated_by: row.termination_initiated_by as string | null,
      termination_penalty_paid: row.termination_penalty_paid as number | null,
      hidden_clauses_revealed: row.hidden_clauses_revealed as string | null,
      corporate_override_invoked: row.corporate_override_invoked as number,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };

    return formatCharacterContract(charContract);
  });

  return c.json({
    success: true,
    data: {
      contracts,
      total: contracts.length,
    },
  });
});

/**
 * GET /contracts/character/active
 * List active contracts only
 */
contractRoutes.get('/character/active', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const result = await c.env.DB.prepare(`
    SELECT cc.*, cd.*,
           cc.id as cc_id, cd.id as cd_id
    FROM character_contracts cc
    JOIN contract_definitions cd ON cc.contract_definition_id = cd.id
    WHERE cc.character_id = ? AND cc.status = 'ACTIVE'
    ORDER BY cc.signed_at DESC
  `).bind(characterId).all();

  const contracts = result.results.map((row: Record<string, unknown>) => {
    const charContract: CharacterContract = {
      id: row.cc_id as string,
      character_id: row.character_id as string,
      contract_definition_id: row.contract_definition_id as string,
      signed_at: row.signed_at as string,
      issuer_npc_id: row.issuer_npc_id as string | null,
      issuer_faction_id: row.issuer_faction_id as string | null,
      custom_terms: row.custom_terms as string | null,
      start_date: row.start_date as string,
      end_date: row.end_date as string | null,
      auto_renew: row.auto_renew as number,
      status: row.status as string,
      current_performance_score: row.current_performance_score as number,
      violations_count: row.violations_count as number,
      warnings_count: row.warnings_count as number,
      total_paid_to_player: row.total_paid_to_player as number,
      total_paid_by_player: row.total_paid_by_player as number,
      next_payment_date: row.next_payment_date as string | null,
      next_payment_amount: row.next_payment_amount as number | null,
      last_review_date: row.last_review_date as string | null,
      next_review_date: row.next_review_date as string | null,
      review_score: row.review_score as number | null,
      terminated_at: row.terminated_at as string | null,
      termination_reason: row.termination_reason as string | null,
      termination_initiated_by: row.termination_initiated_by as string | null,
      termination_penalty_paid: row.termination_penalty_paid as number | null,
      hidden_clauses_revealed: row.hidden_clauses_revealed as string | null,
      corporate_override_invoked: row.corporate_override_invoked as number,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };

    return formatCharacterContract(charContract);
  });

  return c.json({
    success: true,
    data: {
      contracts,
      total: contracts.length,
    },
  });
});

/**
 * GET /contracts/debts
 * List all debts
 */
contractRoutes.get('/debts', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const status = c.req.query('status');

  let query = 'SELECT * FROM debts WHERE character_id = ?';
  const params: string[] = [characterId];

  if (status) {
    query += ' AND status = ?';
    params.push(status.toUpperCase());
  }

  query += ' ORDER BY next_payment_due ASC';

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all<Debt>();

  const totalDebt = result.results.reduce((sum, d) => sum + d.current_balance, 0);
  const totalMinimum = result.results.reduce((sum, d) => sum + d.minimum_payment, 0);

  return c.json({
    success: true,
    data: {
      debts: result.results.map(formatDebt),
      total: result.results.length,
      summary: {
        total_debt: totalDebt,
        total_minimum_payment: totalMinimum,
      },
    },
  });
});

/**
 * GET /contracts/debts/active
 * List active debts only
 */
contractRoutes.get('/debts/active', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const result = await c.env.DB.prepare(
    'SELECT * FROM debts WHERE character_id = ? AND status = ? ORDER BY next_payment_due ASC'
  ).bind(characterId, 'ACTIVE').all<Debt>();

  const totalDebt = result.results.reduce((sum, d) => sum + d.current_balance, 0);
  const totalMinimum = result.results.reduce((sum, d) => sum + d.minimum_payment, 0);

  return c.json({
    success: true,
    data: {
      debts: result.results.map(formatDebt),
      total: result.results.length,
      summary: {
        total_debt: totalDebt,
        total_minimum_payment: totalMinimum,
      },
    },
  });
});

/**
 * GET /contracts/debts/:id
 * Get debt details with payment schedule
 */
contractRoutes.get('/debts/:id', async (c) => {
  const { id } = c.req.param();
  const characterId = c.req.query('characterId');

  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const debt = await c.env.DB.prepare(
    'SELECT * FROM debts WHERE id = ? AND character_id = ?'
  ).bind(id, characterId).first<Debt>();

  if (!debt) {
    return c.json({ success: false, errors: [{ message: 'Debt not found' }] }, 404);
  }

  // Calculate payment schedule (simplified)
  const schedule: Array<{ date: string; amount: number; remaining: number }> = [];
  let remaining = debt.current_balance;
  let nextDate = debt.next_payment_due || toDateString(new Date());

  while (remaining > 0 && schedule.length < 12) {
    const payment = Math.min(debt.minimum_payment, remaining);
    remaining -= payment;
    schedule.push({
      date: nextDate,
      amount: payment,
      remaining,
    });
    nextDate = calculateNextPaymentDate(debt.payment_frequency || 'MONTHLY', nextDate);
  }

  return c.json({
    success: true,
    data: {
      debt: formatDebt(debt),
      payment_schedule: schedule,
    },
  });
});

/**
 * GET /contracts/:id
 * Get contract definition details
 */
contractRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();

  const result = await c.env.DB.prepare(
    'SELECT * FROM contract_definitions WHERE id = ?'
  ).bind(id).first<ContractDefinition>();

  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Contract not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: {
      contract: formatContractDefinition(result),
    },
  });
});

// =============================================================================
// MUTATION ENDPOINTS
// =============================================================================

/**
 * POST /contracts/character/sign
 * Sign a new contract
 */
contractRoutes.post('/character/sign', async (c) => {
  const body = await c.req.json<{
    characterId: string;
    contract_definition_id: string;
    issuer_npc_id?: string;
    issuer_faction_id?: string;
    custom_terms?: object;
    auto_renew?: boolean;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (!body.contract_definition_id) {
    return c.json({ success: false, errors: [{ message: 'contract_definition_id is required' }] }, 400);
  }

  // Get contract definition
  const definition = await c.env.DB.prepare(
    'SELECT * FROM contract_definitions WHERE id = ?'
  ).bind(body.contract_definition_id).first<ContractDefinition>();

  if (!definition) {
    return c.json({ success: false, errors: [{ message: 'Contract definition not found' }] }, 404);
  }

  // Check for conflicting contracts (exclusivity)
  const exclusivity = parseJsonField<string[]>(definition.exclusivity_clauses, []);
  if (exclusivity.length > 0) {
    const conflicts = await c.env.DB.prepare(`
      SELECT cc.id FROM character_contracts cc
      JOIN contract_definitions cd ON cc.contract_definition_id = cd.id
      WHERE cc.character_id = ? AND cc.status = 'ACTIVE' AND cd.contract_type IN (${exclusivity.map(() => '?').join(',')})
    `).bind(body.characterId, ...exclusivity).first();

    if (conflicts) {
      return c.json({ success: false, errors: [{ message: 'Conflicting active contract exists' }] }, 409);
    }
  }

  const now = new Date();
  const nowStr = now.toISOString();
  const startDate = toDateString(now);
  let endDate: string | null = null;

  if (definition.duration_type !== 'PERPETUAL' && definition.duration_value) {
    const end = new Date(now);
    switch (definition.duration_type) {
      case 'DAYS':
        end.setDate(end.getDate() + definition.duration_value);
        break;
      case 'MONTHS':
        end.setMonth(end.getMonth() + definition.duration_value);
        break;
      case 'YEARS':
        end.setFullYear(end.getFullYear() + definition.duration_value);
        break;
    }
    endDate = toDateString(end);
  }

  const newId = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO character_contracts (
      id, character_id, contract_definition_id, signed_at,
      issuer_npc_id, issuer_faction_id, custom_terms,
      start_date, end_date, auto_renew, status,
      current_performance_score, violations_count, warnings_count,
      total_paid_to_player, total_paid_by_player,
      corporate_override_invoked, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 100, 0, 0, 0, 0, 0, ?, ?)
  `).bind(
    newId,
    body.characterId,
    body.contract_definition_id,
    nowStr,
    body.issuer_npc_id || definition.issuer_faction_id,
    body.issuer_faction_id || definition.issuer_faction_id,
    body.custom_terms ? JSON.stringify(body.custom_terms) : null,
    startDate,
    endDate,
    body.auto_renew ? 1 : 0,
    nowStr,
    nowStr
  ).run();

  return c.json({
    success: true,
    data: {
      contract_id: newId,
      contract_name: definition.name,
      start_date: startDate,
      end_date: endDate,
      status: 'ACTIVE',
    },
  }, 201);
});

/**
 * GET /contracts/character/:id
 * Get specific character contract status
 */
contractRoutes.get('/character/:id', async (c) => {
  const { id } = c.req.param();
  const characterId = c.req.query('characterId');

  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const result = await c.env.DB.prepare(`
    SELECT cc.*, cd.*,
           cc.id as cc_id, cd.id as cd_id
    FROM character_contracts cc
    JOIN contract_definitions cd ON cc.contract_definition_id = cd.id
    WHERE cc.id = ? AND cc.character_id = ?
  `).bind(id, characterId).first();

  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Contract not found' }] }, 404);
  }

  const row = result as Record<string, unknown>;
  const charContract: CharacterContract = {
    id: row.cc_id as string,
    character_id: row.character_id as string,
    contract_definition_id: row.contract_definition_id as string,
    signed_at: row.signed_at as string,
    issuer_npc_id: row.issuer_npc_id as string | null,
    issuer_faction_id: row.issuer_faction_id as string | null,
    custom_terms: row.custom_terms as string | null,
    start_date: row.start_date as string,
    end_date: row.end_date as string | null,
    auto_renew: row.auto_renew as number,
    status: row.status as string,
    current_performance_score: row.current_performance_score as number,
    violations_count: row.violations_count as number,
    warnings_count: row.warnings_count as number,
    total_paid_to_player: row.total_paid_to_player as number,
    total_paid_by_player: row.total_paid_by_player as number,
    next_payment_date: row.next_payment_date as string | null,
    next_payment_amount: row.next_payment_amount as number | null,
    last_review_date: row.last_review_date as string | null,
    next_review_date: row.next_review_date as string | null,
    review_score: row.review_score as number | null,
    terminated_at: row.terminated_at as string | null,
    termination_reason: row.termination_reason as string | null,
    termination_initiated_by: row.termination_initiated_by as string | null,
    termination_penalty_paid: row.termination_penalty_paid as number | null,
    hidden_clauses_revealed: row.hidden_clauses_revealed as string | null,
    corporate_override_invoked: row.corporate_override_invoked as number,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };

  const definition: ContractDefinition = {
    id: row.cd_id as string,
    code: row.code as string,
    name: row.name as string,
    description: row.description as string | null,
    legal_text: row.legal_text as string | null,
    contract_type: row.contract_type as string,
    issuer_type: row.issuer_type as string,
    issuer_faction_id: row.issuer_faction_id as string | null,
    duration_type: row.duration_type as string,
    duration_value: row.duration_value as number | null,
    renewable: row.renewable as number,
    termination_conditions: row.termination_conditions as string | null,
    early_termination_penalty: row.early_termination_penalty as number | null,
    player_obligations: row.player_obligations as string | null,
    issuer_obligations: row.issuer_obligations as string | null,
    performance_metrics: row.performance_metrics as string | null,
    compensation: row.compensation as string | null,
    benefits_granted: row.benefits_granted as string | null,
    access_granted: row.access_granted as string | null,
    discounts_granted: row.discounts_granted as string | null,
    exclusivity_clauses: row.exclusivity_clauses as string | null,
    non_compete_clauses: row.non_compete_clauses as string | null,
    restricted_activities: row.restricted_activities as string | null,
    required_availability: row.required_availability as number | null,
    has_tracking_requirements: row.has_tracking_requirements as number,
    gps_tracking_required: row.gps_tracking_required as number,
    performance_reviews_frequency: row.performance_reviews_frequency as number | null,
    hidden_clauses: row.hidden_clauses as string | null,
    hidden_reveal_condition: row.hidden_reveal_condition as string | null,
    corporate_override_clause: row.corporate_override_clause as number,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };

  return c.json({
    success: true,
    data: {
      contract: formatCharacterContract(charContract, definition),
    },
  });
});

/**
 * POST /contracts/character/:id/terminate
 * Early termination of contract
 */
contractRoutes.post('/character/:id/terminate', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    characterId: string;
    reason?: string;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  // Get contract with definition
  const result = await c.env.DB.prepare(`
    SELECT cc.*, cd.early_termination_penalty, cd.name
    FROM character_contracts cc
    JOIN contract_definitions cd ON cc.contract_definition_id = cd.id
    WHERE cc.id = ? AND cc.character_id = ? AND cc.status = 'ACTIVE'
  `).bind(id, body.characterId).first<CharacterContract & { early_termination_penalty: number | null; name: string }>();

  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Active contract not found' }] }, 404);
  }

  const now = new Date().toISOString();
  const penalty = result.early_termination_penalty || 0;

  await c.env.DB.prepare(`
    UPDATE character_contracts SET
      status = 'TERMINATED',
      terminated_at = ?,
      termination_reason = ?,
      termination_initiated_by = 'PLAYER',
      termination_penalty_paid = ?,
      updated_at = ?
    WHERE id = ?
  `).bind(now, body.reason || 'Player initiated termination', penalty, now, id).run();

  return c.json({
    success: true,
    data: {
      contract_id: id,
      contract_name: result.name,
      status: 'TERMINATED',
      penalty_paid: penalty,
    },
  });
});

/**
 * POST /contracts/character/:id/renew
 * Renew contract
 */
contractRoutes.post('/character/:id/renew', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{ characterId: string }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  // Get contract with definition
  const result = await c.env.DB.prepare(`
    SELECT cc.*, cd.renewable, cd.duration_type, cd.duration_value, cd.name
    FROM character_contracts cc
    JOIN contract_definitions cd ON cc.contract_definition_id = cd.id
    WHERE cc.id = ? AND cc.character_id = ?
  `).bind(id, body.characterId).first<CharacterContract & { renewable: number; duration_type: string; duration_value: number | null; name: string }>();

  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Contract not found' }] }, 404);
  }

  if (!result.renewable) {
    return c.json({ success: false, errors: [{ message: 'Contract is not renewable' }] }, 400);
  }

  const now = new Date();
  const nowStr = now.toISOString();
  let newEndDate: string | null = null;

  if (result.duration_type !== 'PERPETUAL' && result.duration_value) {
    const end = result.end_date ? new Date(result.end_date) : new Date();
    switch (result.duration_type) {
      case 'DAYS':
        end.setDate(end.getDate() + result.duration_value);
        break;
      case 'MONTHS':
        end.setMonth(end.getMonth() + result.duration_value);
        break;
      case 'YEARS':
        end.setFullYear(end.getFullYear() + result.duration_value);
        break;
    }
    newEndDate = toDateString(end);
  }

  await c.env.DB.prepare(`
    UPDATE character_contracts SET
      status = 'ACTIVE',
      end_date = ?,
      updated_at = ?
    WHERE id = ?
  `).bind(newEndDate, nowStr, id).run();

  return c.json({
    success: true,
    data: {
      contract_id: id,
      contract_name: result.name,
      status: 'ACTIVE',
      new_end_date: newEndDate,
    },
  });
});

/**
 * POST /contracts/debts
 * Create new debt
 */
contractRoutes.post('/debts', async (c) => {
  const body = await c.req.json<{
    characterId: string;
    creditor_type: string;
    creditor_name: string;
    creditor_npc_id?: string;
    creditor_faction_id?: string;
    original_amount: number;
    interest_rate: number;
    interest_type?: string;
    payment_frequency?: string;
    minimum_payment: number;
    maturity_months?: number;
    collateral?: { type: string; item_id?: string; value: number };
    can_work_off?: boolean;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (!body.creditor_type || !body.creditor_name) {
    return c.json({ success: false, errors: [{ message: 'creditor_type and creditor_name are required' }] }, 400);
  }

  if (typeof body.original_amount !== 'number' || body.original_amount <= 0) {
    return c.json({ success: false, errors: [{ message: 'original_amount must be a positive number' }] }, 400);
  }

  const now = new Date();
  const nowStr = now.toISOString();
  const startDate = toDateString(now);

  let maturityDate: string | null = null;
  if (body.maturity_months) {
    const maturity = new Date(now);
    maturity.setMonth(maturity.getMonth() + body.maturity_months);
    maturityDate = toDateString(maturity);
  }

  const frequency = body.payment_frequency || 'MONTHLY';
  const nextDue = calculateNextPaymentDate(frequency, startDate);

  const newId = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO debts (
      id, character_id, created_at,
      creditor_type, creditor_npc_id, creditor_faction_id, creditor_name,
      original_amount, current_balance, interest_rate_annual, interest_type,
      payment_frequency, minimum_payment, is_secured, collateral_type,
      collateral_item_id, collateral_value, status,
      payments_made, payments_missed, total_paid, total_interest_paid,
      start_date, maturity_date, next_payment_due,
      collection_started, legal_action_pending, garnishment_active,
      can_be_worked_off, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, 0, 0, 0, ?, ?, ?, 0, 0, 0, ?, ?)
  `).bind(
    newId,
    body.characterId,
    nowStr,
    body.creditor_type.toUpperCase(),
    body.creditor_npc_id || null,
    body.creditor_faction_id || null,
    body.creditor_name,
    body.original_amount,
    body.original_amount,
    body.interest_rate,
    body.interest_type || 'SIMPLE',
    frequency,
    body.minimum_payment,
    body.collateral ? 1 : 0,
    body.collateral?.type || null,
    body.collateral?.item_id || null,
    body.collateral?.value || null,
    startDate,
    maturityDate,
    nextDue,
    body.can_work_off ? 1 : 0,
    nowStr
  ).run();

  return c.json({
    success: true,
    data: {
      debt_id: newId,
      amount: body.original_amount,
      creditor: body.creditor_name,
      first_payment_due: nextDue,
      minimum_payment: body.minimum_payment,
    },
  }, 201);
});

/**
 * POST /contracts/debts/:id/payment
 * Make a debt payment
 */
contractRoutes.post('/debts/:id/payment', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    characterId: string;
    amount: number;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (typeof body.amount !== 'number' || body.amount <= 0) {
    return c.json({ success: false, errors: [{ message: 'amount must be a positive number' }] }, 400);
  }

  // Get debt
  const debt = await c.env.DB.prepare(
    'SELECT * FROM debts WHERE id = ? AND character_id = ? AND status = ?'
  ).bind(id, body.characterId, 'ACTIVE').first<Debt>();

  if (!debt) {
    return c.json({ success: false, errors: [{ message: 'Active debt not found' }] }, 404);
  }

  const nowDate = new Date();
  const now = nowDate.toISOString();
  const todayStr = toDateString(nowDate);
  const paymentAmount = Math.min(body.amount, debt.current_balance);
  const newBalance = debt.current_balance - paymentAmount;
  const isFullyPaid = newBalance <= 0;
  const nextDue = isFullyPaid ? null : calculateNextPaymentDate(debt.payment_frequency || 'MONTHLY', todayStr);

  await c.env.DB.prepare(`
    UPDATE debts SET
      current_balance = ?,
      payments_made = payments_made + 1,
      total_paid = total_paid + ?,
      last_payment_date = ?,
      next_payment_due = ?,
      status = ?,
      updated_at = ?
    WHERE id = ?
  `).bind(
    newBalance,
    paymentAmount,
    todayStr,
    nextDue,
    isFullyPaid ? 'PAID_OFF' : 'ACTIVE',
    now,
    id
  ).run();

  return c.json({
    success: true,
    data: {
      debt_id: id,
      payment_amount: paymentAmount,
      new_balance: newBalance,
      status: isFullyPaid ? 'PAID_OFF' : 'ACTIVE',
      next_payment_due: nextDue,
    },
  });
});

/**
 * GET /contracts/debts/:id/schedule
 * Get payment schedule for a debt
 */
contractRoutes.get('/debts/:id/schedule', async (c) => {
  const { id } = c.req.param();
  const characterId = c.req.query('characterId');

  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const debt = await c.env.DB.prepare(
    'SELECT * FROM debts WHERE id = ? AND character_id = ?'
  ).bind(id, characterId).first<Debt>();

  if (!debt) {
    return c.json({ success: false, errors: [{ message: 'Debt not found' }] }, 404);
  }

  // Calculate full payment schedule
  const schedule: Array<{ payment_number: number; date: string; amount: number; principal: number; interest: number; remaining: number }> = [];
  let remaining = debt.current_balance;
  let nextDate = debt.next_payment_due || toDateString(new Date());
  let paymentNum = debt.payments_made + 1;

  while (remaining > 0 && schedule.length < 60) {
    const monthlyRate = debt.interest_rate_annual / 100 / 12;
    const interestPortion = remaining * monthlyRate;
    const principalPortion = Math.min(debt.minimum_payment - interestPortion, remaining);
    const payment = principalPortion + interestPortion;
    remaining -= principalPortion;

    schedule.push({
      payment_number: paymentNum,
      date: nextDate,
      amount: Math.round(payment * 100) / 100,
      principal: Math.round(principalPortion * 100) / 100,
      interest: Math.round(interestPortion * 100) / 100,
      remaining: Math.round(Math.max(0, remaining) * 100) / 100,
    });

    paymentNum++;
    nextDate = calculateNextPaymentDate(debt.payment_frequency || 'MONTHLY', nextDate);
  }

  return c.json({
    success: true,
    data: {
      debt_id: id,
      current_balance: debt.current_balance,
      interest_rate: debt.interest_rate_annual,
      minimum_payment: debt.minimum_payment,
      schedule,
      estimated_payoff_date: schedule.length > 0 ? schedule[schedule.length - 1]!.date : null,
      total_interest_projected: schedule.reduce((sum, p) => sum + p.interest, 0),
    },
  });
});

/**
 * POST /contracts/debts/:id/negotiate
 * Negotiate debt terms
 */
contractRoutes.post('/debts/:id/negotiate', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    characterId: string;
    request: 'lower_rate' | 'lower_minimum' | 'extend_maturity' | 'partial_forgiveness';
    proposed_value?: number;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  // Get debt
  const debt = await c.env.DB.prepare(
    'SELECT * FROM debts WHERE id = ? AND character_id = ? AND status = ?'
  ).bind(id, body.characterId, 'ACTIVE').first<Debt>();

  if (!debt) {
    return c.json({ success: false, errors: [{ message: 'Active debt not found' }] }, 404);
  }

  // Simple negotiation logic (in real game, would involve skill checks, reputation, etc.)
  const now = new Date().toISOString();
  let success = Math.random() > 0.4; // 60% base success rate
  let changes: Record<string, unknown> = {};

  if (success) {
    switch (body.request) {
      case 'lower_rate':
        const newRate = debt.interest_rate_annual * 0.85; // 15% reduction
        await c.env.DB.prepare(
          'UPDATE debts SET interest_rate_annual = ?, updated_at = ? WHERE id = ?'
        ).bind(newRate, now, id).run();
        changes = { interest_rate: newRate };
        break;

      case 'lower_minimum':
        const newMin = Math.floor(debt.minimum_payment * 0.75);
        await c.env.DB.prepare(
          'UPDATE debts SET minimum_payment = ?, updated_at = ? WHERE id = ?'
        ).bind(newMin, now, id).run();
        changes = { minimum_payment: newMin };
        break;

      case 'extend_maturity':
        if (debt.maturity_date) {
          const newMaturity = new Date(debt.maturity_date);
          newMaturity.setMonth(newMaturity.getMonth() + 6);
          await c.env.DB.prepare(
            'UPDATE debts SET maturity_date = ?, updated_at = ? WHERE id = ?'
          ).bind(toDateString(newMaturity), now, id).run();
          changes = { maturity_date: toDateString(newMaturity) };
        }
        break;

      case 'partial_forgiveness':
        const forgiveness = Math.floor(debt.current_balance * 0.1); // 10% forgiveness
        const newBalance = debt.current_balance - forgiveness;
        await c.env.DB.prepare(
          'UPDATE debts SET current_balance = ?, partial_forgiveness = COALESCE(partial_forgiveness, 0) + ?, updated_at = ? WHERE id = ?'
        ).bind(newBalance, forgiveness, now, id).run();
        changes = { forgiven_amount: forgiveness, new_balance: newBalance };
        break;
    }
  }

  return c.json({
    success: true,
    data: {
      debt_id: id,
      negotiation_type: body.request,
      negotiation_success: success,
      changes: success ? changes : null,
      message: success
        ? 'Negotiation successful. Terms have been updated.'
        : 'Negotiation failed. The creditor rejected your request.',
    },
  });
});
