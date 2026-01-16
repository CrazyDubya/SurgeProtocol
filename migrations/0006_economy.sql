-- SURGE PROTOCOL: Database Schema Migration
-- Part 6: Economy, Contracts & Black Market
-- Tables: currencies, finances, contracts, debts, black market

-- ============================================
-- CURRENCY DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS currency_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT,
    description TEXT,

    -- Type
    currency_type TEXT REFERENCES enum_currency_type(value),
    is_primary INTEGER DEFAULT 0, -- BOOLEAN
    is_tradeable INTEGER DEFAULT 1, -- BOOLEAN
    is_physical INTEGER DEFAULT 0, -- BOOLEAN

    -- Conversion
    exchange_rate_to_primary REAL DEFAULT 1.0,
    exchange_rate_volatile INTEGER DEFAULT 0, -- BOOLEAN
    exchange_rate_range TEXT, -- JSON {min, max}

    -- Restrictions
    faction_specific_id TEXT REFERENCES factions(id),
    region_specific_id TEXT REFERENCES regions(id),
    tier_required INTEGER DEFAULT 1,
    illegal INTEGER DEFAULT 0, -- BOOLEAN

    -- Limits
    max_carry_physical INTEGER,
    max_account_balance INTEGER,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER FINANCES
-- ============================================

CREATE TABLE IF NOT EXISTS character_finances (
    id TEXT PRIMARY KEY,
    character_id TEXT UNIQUE NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

    -- Balances
    primary_currency_balance INTEGER DEFAULT 0,
    currency_balances TEXT, -- JSON {currency_id: amount}
    physical_currency_on_person TEXT, -- JSON

    -- Accounts
    bank_accounts TEXT, -- JSON
    crypto_wallets TEXT, -- JSON
    hidden_stashes TEXT, -- JSON

    -- Income
    total_earned_career INTEGER DEFAULT 0,
    income_this_month INTEGER DEFAULT 0,
    income_sources TEXT, -- JSON
    average_delivery_pay INTEGER DEFAULT 0,

    -- Expenses
    total_spent_career INTEGER DEFAULT 0,
    expenses_this_month INTEGER DEFAULT 0,
    recurring_expenses TEXT, -- JSON

    -- Debt
    total_debt INTEGER DEFAULT 0,
    active_debts TEXT, -- JSON
    debt_to_income_ratio REAL DEFAULT 0,

    -- Credit
    credit_score INTEGER DEFAULT 500,
    credit_limit INTEGER DEFAULT 1000,
    credit_utilized INTEGER DEFAULT 0,

    -- Insurance
    health_insurance_active INTEGER DEFAULT 0, -- BOOLEAN
    vehicle_insurance_active INTEGER DEFAULT 0, -- BOOLEAN
    insurance_monthly_cost INTEGER DEFAULT 0,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- FINANCIAL TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS financial_transactions (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    occurred_at TEXT DEFAULT (datetime('now')),

    -- Transaction
    transaction_type TEXT REFERENCES enum_transaction_type(value),
    currency_id TEXT REFERENCES currency_definitions(id),
    amount INTEGER NOT NULL,
    is_income INTEGER DEFAULT 0, -- BOOLEAN
    balance_after INTEGER,

    -- Source/Destination
    source_type TEXT,
    source_id TEXT,
    source_name TEXT,
    destination_type TEXT,
    destination_id TEXT,
    destination_name TEXT,

    -- Details
    description TEXT,
    category TEXT,
    receipt_number TEXT,
    tax_relevant INTEGER DEFAULT 0, -- BOOLEAN

    -- Traceability
    is_anonymous INTEGER DEFAULT 0, -- BOOLEAN
    is_legal INTEGER DEFAULT 1, -- BOOLEAN
    traceable INTEGER DEFAULT 1, -- BOOLEAN
    corporate_visible INTEGER DEFAULT 1, -- BOOLEAN

    -- Related
    related_mission_id TEXT REFERENCES mission_definitions(id),
    related_item_id TEXT REFERENCES item_definitions(id),
    related_npc_id TEXT REFERENCES npc_definitions(id),
    related_contract_id TEXT
);

-- ============================================
-- VENDOR INVENTORIES
-- ============================================

CREATE TABLE IF NOT EXISTS vendor_inventories (
    id TEXT PRIMARY KEY,
    vendor_npc_id TEXT REFERENCES npc_definitions(id),
    location_id TEXT REFERENCES locations(id),

    -- Type
    vendor_type TEXT,
    specialization TEXT,
    quality_tier_min INTEGER DEFAULT 1,
    quality_tier_max INTEGER DEFAULT 3,

    -- Inventory
    base_inventory TEXT, -- JSON
    rotating_inventory TEXT, -- JSON
    limited_stock TEXT, -- JSON
    black_market_inventory TEXT, -- JSON

    -- Pricing
    buy_price_modifier REAL DEFAULT 1.0,
    sell_price_modifier REAL DEFAULT 0.5,
    haggle_difficulty INTEGER DEFAULT 5,
    accepts_stolen INTEGER DEFAULT 0, -- BOOLEAN
    accepts_contraband INTEGER DEFAULT 0, -- BOOLEAN

    -- Requirements
    reputation_required INTEGER DEFAULT 0,
    faction_required_id TEXT REFERENCES factions(id),
    tier_required INTEGER DEFAULT 1,

    -- Refresh
    restock_frequency_hours INTEGER DEFAULT 24,
    last_restock TEXT,
    restock_seed INTEGER,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CONTRACT DEFINITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS contract_definitions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    legal_text TEXT,

    -- Type
    contract_type TEXT,
    issuer_type TEXT,
    issuer_faction_id TEXT REFERENCES factions(id),

    -- Terms
    duration_type TEXT,
    duration_value INTEGER,
    renewable INTEGER DEFAULT 0, -- BOOLEAN
    termination_conditions TEXT, -- JSON
    early_termination_penalty INTEGER DEFAULT 0,

    -- Obligations
    player_obligations TEXT, -- JSON
    issuer_obligations TEXT, -- JSON
    performance_metrics TEXT, -- JSON

    -- Benefits
    compensation TEXT, -- JSON
    benefits_granted TEXT, -- JSON
    access_granted TEXT, -- JSON
    discounts_granted TEXT, -- JSON

    -- Restrictions
    exclusivity_clauses TEXT, -- JSON
    non_compete_clauses TEXT, -- JSON
    restricted_activities TEXT, -- JSON
    required_availability INTEGER DEFAULT 0,

    -- Tracking
    has_tracking_requirements INTEGER DEFAULT 0, -- BOOLEAN
    gps_tracking_required INTEGER DEFAULT 0, -- BOOLEAN
    performance_reviews_frequency INTEGER DEFAULT 0,

    -- Fine Print
    hidden_clauses TEXT, -- JSON
    hidden_reveal_condition TEXT,
    corporate_override_clause INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CHARACTER CONTRACTS
-- ============================================

CREATE TABLE IF NOT EXISTS character_contracts (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    contract_definition_id TEXT NOT NULL REFERENCES contract_definitions(id),
    signed_at TEXT DEFAULT (datetime('now')),

    -- Parties
    issuer_npc_id TEXT REFERENCES npc_definitions(id),
    issuer_faction_id TEXT REFERENCES factions(id),

    -- Terms
    custom_terms TEXT, -- JSON
    start_date TEXT,
    end_date TEXT,
    auto_renew INTEGER DEFAULT 0, -- BOOLEAN

    -- State
    status TEXT DEFAULT 'ACTIVE' REFERENCES enum_contract_status(value),
    current_performance_score INTEGER DEFAULT 100,
    violations_count INTEGER DEFAULT 0,
    warnings_count INTEGER DEFAULT 0,

    -- Payments
    total_paid_to_player INTEGER DEFAULT 0,
    total_paid_by_player INTEGER DEFAULT 0,
    next_payment_date TEXT,
    next_payment_amount INTEGER DEFAULT 0,

    -- Reviews
    last_review_date TEXT,
    next_review_date TEXT,
    review_score INTEGER,

    -- Termination
    terminated_at TEXT,
    termination_reason TEXT,
    termination_initiated_by TEXT,
    termination_penalty_paid INTEGER DEFAULT 0,

    -- Hidden
    hidden_clauses_revealed TEXT, -- JSON
    corporate_override_invoked INTEGER DEFAULT 0 -- BOOLEAN
);

-- ============================================
-- DEBTS
-- ============================================

CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),

    -- Creditor
    creditor_type TEXT,
    creditor_npc_id TEXT REFERENCES npc_definitions(id),
    creditor_faction_id TEXT REFERENCES factions(id),
    creditor_name TEXT,

    -- Principal
    original_amount INTEGER NOT NULL,
    current_balance INTEGER NOT NULL,
    currency_id TEXT REFERENCES currency_definitions(id),

    -- Terms
    interest_rate_annual REAL DEFAULT 0.1,
    interest_type TEXT,
    payment_frequency TEXT,
    minimum_payment INTEGER DEFAULT 0,
    payment_due_day INTEGER DEFAULT 1,

    -- Collateral
    is_secured INTEGER DEFAULT 0, -- BOOLEAN
    collateral_type TEXT,
    collateral_item_id TEXT REFERENCES character_inventory(id),
    collateral_value INTEGER DEFAULT 0,

    -- State
    status TEXT DEFAULT 'CURRENT' REFERENCES enum_debt_status(value),
    payments_made INTEGER DEFAULT 0,
    payments_missed INTEGER DEFAULT 0,
    total_paid INTEGER DEFAULT 0,
    total_interest_paid INTEGER DEFAULT 0,

    -- Dates
    start_date TEXT,
    maturity_date TEXT,
    last_payment_date TEXT,
    next_payment_due TEXT,

    -- Consequences
    collection_started INTEGER DEFAULT 0, -- BOOLEAN
    collection_agency TEXT,
    legal_action_pending INTEGER DEFAULT 0, -- BOOLEAN
    garnishment_active INTEGER DEFAULT 0, -- BOOLEAN
    garnishment_percentage REAL DEFAULT 0,

    -- Forgiveness
    partial_forgiveness INTEGER DEFAULT 0,
    forgiveness_conditions TEXT,
    can_be_worked_off INTEGER DEFAULT 0 -- BOOLEAN
);

-- ============================================
-- BLACK MARKET CONTACTS
-- ============================================

CREATE TABLE IF NOT EXISTS black_market_contacts (
    id TEXT PRIMARY KEY,
    npc_id TEXT REFERENCES npc_definitions(id),
    location_id TEXT REFERENCES locations(id),

    -- Type
    contact_type TEXT,
    specialization TEXT,
    reliability_rating INTEGER DEFAULT 50,
    danger_rating INTEGER DEFAULT 50,

    -- Requirements
    discovery_method TEXT,
    required_tier INTEGER DEFAULT 3,
    required_reputation TEXT, -- JSON
    introduction_needed INTEGER DEFAULT 1, -- BOOLEAN
    introduction_npc_id TEXT REFERENCES npc_definitions(id),
    trust_threshold INTEGER DEFAULT 0,

    -- Inventory
    inventory_tier_min INTEGER DEFAULT 1,
    inventory_tier_max INTEGER DEFAULT 3,
    specialization_items TEXT, -- JSON
    has_prototype_access INTEGER DEFAULT 0, -- BOOLEAN
    has_corrupted_access INTEGER DEFAULT 0, -- BOOLEAN

    -- Services
    services_offered TEXT, -- JSON
    installs_augments INTEGER DEFAULT 0, -- BOOLEAN
    install_quality_range TEXT, -- JSON
    removes_tracking INTEGER DEFAULT 0, -- BOOLEAN
    fences_goods INTEGER DEFAULT 0, -- BOOLEAN
    fence_rate REAL DEFAULT 0.3,

    -- Pricing
    base_price_modifier REAL DEFAULT 1.5,
    accepts_alternative_payment TEXT, -- JSON
    extends_credit INTEGER DEFAULT 0, -- BOOLEAN
    credit_terms TEXT, -- JSON

    -- Risks
    raid_chance_base REAL DEFAULT 0.01,
    informant_chance REAL DEFAULT 0.01,
    scam_chance REAL DEFAULT 0.01,
    corporate_monitored INTEGER DEFAULT 0, -- BOOLEAN

    -- State
    is_available INTEGER DEFAULT 1, -- BOOLEAN
    availability_schedule TEXT, -- JSON
    last_inventory_refresh TEXT,
    heat_level INTEGER DEFAULT 0,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- BLACK MARKET INVENTORIES
-- ============================================

CREATE TABLE IF NOT EXISTS black_market_inventories (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL REFERENCES black_market_contacts(id),
    generated_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,
    seed INTEGER,

    -- Items
    available_items TEXT, -- JSON array

    -- Services
    available_services TEXT, -- JSON array

    -- Special
    special_offers TEXT, -- JSON
    whispered_rumors TEXT, -- JSON
    upcoming_shipments TEXT -- JSON
);

-- ============================================
-- BLACK MARKET TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS black_market_transactions (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    contact_id TEXT NOT NULL REFERENCES black_market_contacts(id),
    occurred_at TEXT DEFAULT (datetime('now')),

    -- Transaction
    transaction_type TEXT,
    items_involved TEXT, -- JSON
    services_rendered TEXT, -- JSON
    total_price INTEGER DEFAULT 0,
    payment_method TEXT,

    -- Outcome
    outcome TEXT,
    items_received TEXT, -- JSON
    services_completed TEXT, -- JSON
    complications TEXT, -- JSON

    -- Risk Results
    detected_by_corporate INTEGER DEFAULT 0, -- BOOLEAN
    detected_by_police INTEGER DEFAULT 0, -- BOOLEAN
    rating_penalty REAL DEFAULT 0,
    heat_generated INTEGER DEFAULT 0,

    -- Relationship
    trust_change INTEGER DEFAULT 0,
    contact_satisfaction INTEGER DEFAULT 50,
    future_discount_earned REAL DEFAULT 0
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_char_finances_char ON character_finances(character_id);
CREATE INDEX IF NOT EXISTS idx_fin_trans_char ON financial_transactions(character_id);
CREATE INDEX IF NOT EXISTS idx_fin_trans_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_vendor_inv_loc ON vendor_inventories(location_id);
CREATE INDEX IF NOT EXISTS idx_char_contracts_char ON character_contracts(character_id);
CREATE INDEX IF NOT EXISTS idx_char_contracts_status ON character_contracts(status);
CREATE INDEX IF NOT EXISTS idx_debts_char ON debts(character_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_bm_contacts_loc ON black_market_contacts(location_id);
CREATE INDEX IF NOT EXISTS idx_bm_trans_char ON black_market_transactions(character_id);
