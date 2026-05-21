-- Migration 0015: Add character_contacts table

CREATE TABLE IF NOT EXISTS character_contacts (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    contact_id TEXT NOT NULL REFERENCES black_market_contacts(id),
    
    -- Status
    trust_level INTEGER DEFAULT 0,
    is_hostile INTEGER DEFAULT 0, -- BOOLEAN
    heat_with_contact INTEGER DEFAULT 0,
    
    -- Discovery
    discovered_at TEXT DEFAULT (datetime('now')),
    discovery_method TEXT,
    
    -- Stats
    total_transactions INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    last_transaction_at TEXT,
    
    -- Notes
    notes TEXT,
    
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    UNIQUE(character_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_char_contacts_char ON character_contacts(character_id);
CREATE INDEX IF NOT EXISTS idx_char_contacts_contact ON character_contacts(contact_id);
