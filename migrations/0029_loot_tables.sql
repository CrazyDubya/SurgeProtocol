
-- SURGE PROTOCOL: Loot Table System
-- Migration 0029

-- 1. Create Loot Tables
CREATE TABLE IF NOT EXISTS loot_tables (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    table_type TEXT DEFAULT 'RANDOM',
    min_tier INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. Create Loot Table Entries
CREATE TABLE IF NOT EXISTS loot_table_entries (
    id TEXT PRIMARY KEY,
    loot_table_id TEXT NOT NULL REFERENCES loot_tables(id) ON DELETE CASCADE,
    item_definition_id TEXT NOT NULL REFERENCES item_definitions(id),
    
    -- Drop Logic
    drop_chance REAL NOT NULL DEFAULT 1.0, -- Probability (0.0 - 1.0)
    min_quantity INTEGER DEFAULT 1,
    max_quantity INTEGER DEFAULT 1,
    
    created_at TEXT DEFAULT (datetime('now'))
);

-- 3. Add relation to Combat Encounters
-- Note: SQLite doesn't support ADD COLUMN with REFERENCES in strict standard easily in all versions, 
-- but D1 usually handles ADD COLUMN fine. if strictly needed we'd verify.
-- Assuming standard SQLite behavior for ADD COLUMN.
ALTER TABLE combat_encounters ADD COLUMN loot_table_id TEXT REFERENCES loot_tables(id);

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_loot_entries_table ON loot_table_entries(loot_table_id);
