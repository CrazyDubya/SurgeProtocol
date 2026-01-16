# SURGE PROTOCOL: Complete Data Architecture

## Part 5: Economy, Contracts & Black Market

-----

# 13. ECONOMY & CURRENCY

## 13.1 Currency Definitions

```sql
TABLE: currency_definitions
├── id: UUID [PK]
├── code: VARCHAR(10) [UNIQUE]
├── name: VARCHAR(50)
├── symbol: VARCHAR(5)
├── description: TEXT
│
├── ## TYPE
├── currency_type: ENUM(currency_type)
├── is_primary: BOOLEAN
├── is_tradeable: BOOLEAN
├── is_physical: BOOLEAN
│
├── ## CONVERSION
├── exchange_rate_to_primary: DECIMAL(12,6)
├── exchange_rate_volatile: BOOLEAN
├── exchange_rate_range: JSONB
│
├── ## RESTRICTIONS
├── faction_specific: FK -> factions
├── region_specific: FK -> regions
├── tier_required: INT
├── illegal: BOOLEAN
│
├── ## LIMITS
├── max_carry_physical: INT
└── max_account_balance: BIGINT
```

### SEED: Currency Types

|Code |Name           |Type     |Description               |
|-----|---------------|---------|--------------------------|
|CRED |Credits        |Standard |Universal digital currency|
|OCOIN|OmniCoin       |Corporate|Omnideliver internal scrip|
|SCRAP|Scrap Tokens   |Faction  |Street gang currency      |
|GHOST|GhostCoin      |Crypto   |Untraceable crypto        |
|KARMA|Karma Points   |Reward   |Reputation-based rewards  |
|BLOOD|Blood Debt     |Special  |Favor economy             |
|ALGO |Algorithm Favor|Corporate|Network standing          |

## 13.2 Character Finances

```sql
TABLE: character_finances
├── id: UUID [PK]
├── character_id: FK -> characters [UNIQUE]
│
├── ## BALANCES
├── primary_currency_balance: BIGINT
├── currency_balances: JSONB
├── physical_currency_on_person: JSONB
│
├── ## ACCOUNTS
├── bank_accounts: JSONB
├── crypto_wallets: JSONB
├── hidden_stashes: JSONB
│
├── ## INCOME
├── total_earned_career: BIGINT
├── income_this_month: BIGINT
├── income_sources: JSONB
├── average_delivery_pay: INT
│
├── ## EXPENSES
├── total_spent_career: BIGINT
├── expenses_this_month: BIGINT
├── recurring_expenses: JSONB
│
├── ## DEBT
├── total_debt: BIGINT
├── active_debts: JSONB
├── debt_to_income_ratio: DECIMAL(4,2)
│
├── ## CREDIT
├── credit_score: INT [0-1000]
├── credit_limit: INT
├── credit_utilized: INT
│
├── ## INSURANCE
├── health_insurance_active: BOOLEAN
├── vehicle_insurance_active: BOOLEAN
├── insurance_monthly_cost: INT
│
├── ## NET WORTH
└── total_net_worth: BIGINT [COMPUTED]
```

## 13.3 Transaction Log

```sql
TABLE: financial_transactions
├── id: UUID [PK]
├── character_id: FK -> characters
├── occurred_at: TIMESTAMP
│
├── ## TRANSACTION
├── transaction_type: ENUM(transaction_type)
├── currency_id: FK -> currency_definitions
├── amount: BIGINT
├── is_income: BOOLEAN
├── balance_after: BIGINT
│
├── ## SOURCE/DESTINATION
├── source_type: VARCHAR(50)
├── source_id: UUID
├── source_name: VARCHAR(200)
├── destination_type: VARCHAR(50)
├── destination_id: UUID
├── destination_name: VARCHAR(200)
│
├── ## DETAILS
├── description: VARCHAR(500)
├── category: VARCHAR(50)
├── receipt_number: VARCHAR(50)
├── tax_relevant: BOOLEAN
│
├── ## TRACEABILITY
├── is_anonymous: BOOLEAN
├── is_legal: BOOLEAN
├── traceable: BOOLEAN
├── corporate_visible: BOOLEAN
│
├── ## RELATED
├── related_mission_id: FK -> missions
├── related_item_id: FK -> items
├── related_npc_id: FK -> npcs
└── related_contract_id: FK -> contracts
```

### SEED: Transaction Types

|Type             |Category|Traceable|
|-----------------|--------|---------|
|DELIVERY_PAYMENT |Income  |Yes      |
|MISSION_REWARD   |Income  |Yes      |
|TIP              |Income  |Yes      |
|BONUS            |Income  |Yes      |
|PURCHASE         |Expense |Yes      |
|REPAIR           |Expense |Yes      |
|MEDICAL          |Expense |Yes      |
|INSURANCE_PREMIUM|Expense |Yes      |
|DEBT_PAYMENT     |Expense |Yes      |
|FINE             |Expense |Yes      |
|BRIBE            |Expense |No       |
|BLACK_MARKET     |Both    |No       |
|THEFT_LOSS       |Loss    |No       |
|GAMBLING_WIN     |Income  |Partial  |
|GAMBLING_LOSS    |Expense |Partial  |

## 13.4 Vendor Inventories

```sql
TABLE: vendor_inventories
├── id: UUID [PK]
├── vendor_npc_id: FK -> npcs
├── location_id: FK -> locations
│
├── ## TYPE
├── vendor_type: ENUM(vendor_type)
├── specialization: VARCHAR(100)
├── quality_tier_min: INT [1-5]
├── quality_tier_max: INT [1-5]
│
├── ## INVENTORY
├── base_inventory: JSONB
├── rotating_inventory: JSONB
├── limited_stock: JSONB
├── black_market_inventory: JSONB
│
├── ## PRICING
├── buy_price_modifier: DECIMAL(4,3)
├── sell_price_modifier: DECIMAL(4,3)
├── haggle_difficulty: INT [1-10]
├── accepts_stolen: BOOLEAN
├── accepts_contraband: BOOLEAN
│
├── ## REQUIREMENTS
├── reputation_required: INT
├── faction_required: FK -> factions
├── tier_required: INT
│
├── ## REFRESH
├── restock_frequency_hours: INT
├── last_restock: TIMESTAMP
└── restock_seed: BIGINT
```

-----

# 14. CONTRACT & DEBT SYSTEM

## 14.1 Contract Definitions

```sql
TABLE: contract_definitions
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
├── description: TEXT
├── legal_text: TEXT
│
├── ## TYPE
├── contract_type: ENUM(contract_type)
├── issuer_type: ENUM(contract_issuer)
├── issuer_faction_id: FK -> factions
│
├── ## TERMS
├── duration_type: ENUM(duration_type)
├── duration_value: INT
├── renewable: BOOLEAN
├── termination_conditions: JSONB
├── early_termination_penalty: INT
│
├── ## OBLIGATIONS
├── player_obligations: JSONB
├── issuer_obligations: JSONB
├── performance_metrics: JSONB
│
├── ## BENEFITS
├── compensation: JSONB
├── benefits_granted: JSONB
├── access_granted: JSONB
├── discounts_granted: JSONB
│
├── ## RESTRICTIONS
├── exclusivity_clauses: JSONB
├── non_compete_clauses: JSONB
├── restricted_activities: JSONB
├── required_availability: INT
│
├── ## TRACKING
├── has_tracking_requirements: BOOLEAN
├── gps_tracking_required: BOOLEAN
├── performance_reviews_frequency: INT
│
├── ## FINE PRINT
├── hidden_clauses: JSONB
├── hidden_reveal_condition: VARCHAR(200)
└── corporate_override_clause: BOOLEAN
```

### SEED: Contract Types

|Type               |Issuer     |Duration |Key Feature                     |
|-------------------|-----------|---------|--------------------------------|
|COURIER_PROVISIONAL|Omnideliver|30 days  |Probation, max 50 deliveries    |
|COURIER_STANDARD   |Omnideliver|1 year   |Standard terms                  |
|COURIER_ELITE      |Omnideliver|Perpetual|Enhanced benefits, more tracking|
|FACTION_MEMBERSHIP |Faction    |Perpetual|Faction access                  |
|AUGMENT_FINANCING  |Corporation|Varies   |Debt for chrome                 |
|VEHICLE_LEASE      |Corporation|Monthly  |Vehicle access                  |
|NDA                |Various    |Perpetual|Secrecy requirement             |
|PROTECTION         |Gang       |Monthly  |Safety guarantee                |
|EXCLUSIVE_CONTRACT |Corporation|6 months |Better pay, no side jobs        |

## 14.2 Character Contracts

```sql
TABLE: character_contracts
├── id: UUID [PK]
├── character_id: FK -> characters
├── contract_definition_id: FK -> contract_definitions
├── signed_at: TIMESTAMP
│
├── ## PARTIES
├── issuer_npc_id: FK -> npcs
├── issuer_faction_id: FK -> factions
│
├── ## TERMS
├── custom_terms: JSONB
├── start_date: DATE
├── end_date: DATE
├── auto_renew: BOOLEAN
│
├── ## STATE
├── status: ENUM(contract_status)
├── current_performance_score: INT [0-100]
├── violations_count: INT
├── warnings_count: INT
│
├── ## PAYMENTS
├── total_paid_to_player: BIGINT
├── total_paid_by_player: BIGINT
├── next_payment_date: DATE
├── next_payment_amount: INT
│
├── ## REVIEWS
├── last_review_date: DATE
├── next_review_date: DATE
├── review_score: INT
│
├── ## TERMINATION
├── terminated_at: TIMESTAMP
├── termination_reason: VARCHAR(200)
├── termination_initiated_by: ENUM(party_type)
├── termination_penalty_paid: INT
│
├── ## HIDDEN
├── hidden_clauses_revealed: JSONB
└── corporate_override_invoked: BOOLEAN
```

## 14.3 Debt Records

```sql
TABLE: debts
├── id: UUID [PK]
├── character_id: FK -> characters
├── created_at: TIMESTAMP
│
├── ## CREDITOR
├── creditor_type: ENUM(creditor_type)
├── creditor_npc_id: FK -> npcs
├── creditor_faction_id: FK -> factions
├── creditor_name: VARCHAR(100)
│
├── ## PRINCIPAL
├── original_amount: INT
├── current_balance: INT
├── currency_id: FK -> currency_definitions
│
├── ## TERMS
├── interest_rate_annual: DECIMAL(5,3)
├── interest_type: ENUM(interest_type)
├── payment_frequency: ENUM(payment_frequency)
├── minimum_payment: INT
├── payment_due_day: INT [1-31]
│
├── ## COLLATERAL
├── is_secured: BOOLEAN
├── collateral_type: VARCHAR(50)
├── collateral_item_id: FK -> character_inventory
├── collateral_value: INT
│
├── ## STATE
├── status: ENUM(debt_status)
├── payments_made: INT
├── payments_missed: INT
├── total_paid: INT
├── total_interest_paid: INT
│
├── ## DATES
├── start_date: DATE
├── maturity_date: DATE
├── last_payment_date: DATE
├── next_payment_due: DATE
│
├── ## CONSEQUENCES
├── collection_started: BOOLEAN
├── collection_agency: VARCHAR(100)
├── legal_action_pending: BOOLEAN
├── garnishment_active: BOOLEAN
├── garnishment_percentage: DECIMAL(4,3)
│
├── ## FORGIVENESS
├── partial_forgiveness: INT
├── forgiveness_conditions: TEXT
└── can_be_worked_off: BOOLEAN
```

### SEED: Creditor Types & Terms

|Creditor             |Interest|Collection Method             |
|---------------------|--------|------------------------------|
|Corporate Bank       |8-15%   |Legal, garnishment            |
|Omnideliver Financing|12-20%  |Contract terms, rating penalty|
|Faction Loan         |5-10%   |Favor obligations             |
|Loan Shark           |25-50%  |Violence, threats             |
|Black Market         |Variable|Organ repossession            |
|Personal (NPC)       |0-10%   |Relationship damage           |

-----

# 15. BLACK MARKET SYSTEM

## 15.1 Black Market Contacts

```sql
TABLE: black_market_contacts
├── id: UUID [PK]
├── npc_id: FK -> npcs
├── location_id: FK -> locations
│
├── ## TYPE
├── contact_type: ENUM(black_market_contact_type)
├── specialization: VARCHAR(100)
├── reliability_rating: INT [1-100]
├── danger_rating: INT [1-100]
│
├── ## REQUIREMENTS
├── discovery_method: ENUM(discovery_method)
├── required_tier: INT
├── required_reputation: JSONB
├── introduction_needed: BOOLEAN
├── introduction_npc_id: FK -> npcs
├── trust_threshold: INT
│
├── ## INVENTORY
├── inventory_tier_min: INT [1-5]
├── inventory_tier_max: INT [1-5]
├── specialization_items: JSONB
├── has_prototype_access: BOOLEAN
├── has_corrupted_access: BOOLEAN
│
├── ## SERVICES
├── services_offered: JSONB
├── installs_augments: BOOLEAN
├── install_quality_range: JSONB
├── removes_tracking: BOOLEAN
├── fences_goods: BOOLEAN
├── fence_rate: DECIMAL(3,2)
│
├── ## PRICING
├── base_price_modifier: DECIMAL(4,2)
├── accepts_alternative_payment: JSONB
├── extends_credit: BOOLEAN
├── credit_terms: JSONB
│
├── ## RISKS
├── raid_chance_base: DECIMAL(5,4)
├── informant_chance: DECIMAL(5,4)
├── scam_chance: DECIMAL(5,4)
├── corporate_monitored: BOOLEAN
│
├── ## STATE
├── is_available: BOOLEAN
├── availability_schedule: JSONB
├── last_inventory_refresh: TIMESTAMP
└── heat_level: INT [0-100]
```

### SEED: Black Market Contact Types

|Type                |Specialty            |Min Tier|Risk Level|
|--------------------|---------------------|--------|----------|
|FIXER               |General jobs & goods |3       |Low       |
|WEAPONS_DEALER      |Firearms, explosives |4       |Medium    |
|RIPPERDOC           |Unregistered augments|4       |Medium    |
|DRUG_DEALER         |Combat chems         |3       |Low       |
|DATA_BROKER         |Information sales    |5       |Medium    |
|FORGER              |False IDs, documents |5       |Medium    |
|SMUGGLER            |Contraband transport |4       |Medium    |
|FENCE               |Stolen goods buyer   |3       |Low       |
|NETRUNNER           |Hacking services     |6       |High      |
|PROTOTYPE_SPECIALIST|Experimental tech    |7       |High      |
|CORRUPTED_TECH      |Rogue-only gear      |8       |Extreme   |

## 15.2 Black Market Inventory

```sql
TABLE: black_market_inventories
├── id: UUID [PK]
├── contact_id: FK -> black_market_contacts
├── generated_at: TIMESTAMP
├── expires_at: TIMESTAMP
├── seed: BIGINT
│
├── ## ITEMS
├── available_items: JSONB
/* Structure:
{
  item_definition_id: UUID,
  quantity: INT,
  condition: INT [0-100],
  price: INT,
  price_negotiable: BOOLEAN,
  provenance: ENUM (stolen, military, prototype, etc.),
  heat_level: INT [0-100],
  time_limited: BOOLEAN
}
*/
│
├── ## SERVICES
├── available_services: JSONB
/* Structure:
{
  service_type: ENUM,
  price: INT,
  turnaround_hours: DECIMAL,
  quality_range: {min, max},
  risk_level: INT
}
*/
│
├── ## SPECIAL
├── special_offers: JSONB
├── whispered_rumors: JSONB
└── upcoming_shipments: JSONB
```

## 15.3 Black Market Transactions

```sql
TABLE: black_market_transactions
├── id: UUID [PK]
├── character_id: FK -> characters
├── contact_id: FK -> black_market_contacts
├── occurred_at: TIMESTAMP
│
├── ## TRANSACTION
├── transaction_type: ENUM(bm_transaction_type)
├── items_involved: JSONB
├── services_rendered: JSONB
├── total_price: INT
├── payment_method: ENUM(bm_payment_method)
│
├── ## OUTCOME
├── outcome: ENUM(bm_outcome)
├── items_received: JSONB
├── services_completed: JSONB
├── complications: JSONB
│
├── ## RISK RESULTS
├── detected_by_corporate: BOOLEAN
├── detected_by_police: BOOLEAN
├── rating_penalty: DECIMAL(5,4)
├── heat_generated: INT
│
├── ## RELATIONSHIP
├── trust_change: INT
├── contact_satisfaction: INT
└── future_discount_earned: DECIMAL(3,2)
```

## 15.4 Black Market Access Progression

### By Tier

|Tier |Access Level     |Available Categories           |
|-----|-----------------|-------------------------------|
|1-2  |None             |-                              |
|3    |Gray Market      |Unlicensed basics, common chems|
|4-5  |Shadow Circuit   |Weapons, unregistered cyberware|
|6-7  |Full Black Market|Military grade, prototypes     |
|8-9  |Inner Circle     |Experimental, custom work      |
|Rogue|Corrupted Network|Anti-Algorithm tech            |

### Payment Methods Accepted

|Method             |Description          |Humanity Cost|Risk   |
|-------------------|---------------------|-------------|-------|
|Credits (Anonymous)|Laundered creds      |0            |Low    |
|Crypto             |Untraceable          |0            |Low    |
|Trade Goods        |Item exchange        |0            |Low    |
|Data               |Information currency |0            |Medium |
|Favors             |Future obligations   |0            |Medium |
|Contract Years     |Indentured service   |-2/year      |High   |
|Memories           |Extracted experiences|-10/memory   |High   |
|Organs             |Biological payment   |-15/organ    |Extreme|
|Identity Burn      |Erase legal self     |-20          |Extreme|
