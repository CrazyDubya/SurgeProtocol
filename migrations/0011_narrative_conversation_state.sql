-- SURGE PROTOCOL: Database Schema Migration
-- Part 11: Narrative Conversation State & History

-- ============================================
-- CONVERSATION STATES (Active)
-- ============================================

CREATE TABLE IF NOT EXISTS conversation_states (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    tree_id TEXT NOT NULL REFERENCES dialogue_trees(id),
    current_node_id TEXT NOT NULL REFERENCES dialogue_nodes(id),
    
    -- Timing
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT,
    
    -- Progress Tracking
    nodes_visited TEXT DEFAULT '[]', -- JSON array of node IDs
    responses_chosen TEXT DEFAULT '[]', -- JSON array of response objects
    flags_set TEXT DEFAULT '{}', -- JSON object of temporary flags
    effects_applied TEXT DEFAULT '[]', -- JSON array of effects
    
    -- Status
    is_active INTEGER DEFAULT 1, -- BOOLEAN
    
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_conv_states_char ON conversation_states(character_id);
CREATE INDEX IF NOT EXISTS idx_conv_states_active ON conversation_states(is_active);

-- ============================================
-- DIALOGUE HISTORY (Archived)
-- ============================================

CREATE TABLE IF NOT EXISTS dialogue_history (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    tree_id TEXT NOT NULL REFERENCES dialogue_trees(id),
    
    -- Timing
    started_at TEXT NOT NULL,
    completed_at TEXT DEFAULT (datetime('now')),
    
    -- Outcome
    outcome TEXT, -- 'COMPLETED', 'ABANDONED', etc.
    
    -- Details
    nodes_visited TEXT, -- JSON
    responses_chosen TEXT, -- JSON
    flags_changed TEXT, -- JSON
    reputation_changes TEXT, -- JSON
    
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dialogue_hist_char ON dialogue_history(character_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_hist_tree ON dialogue_history(tree_id);

-- ============================================
-- CHARACTER DIALOGUE FLAGS
-- ============================================

CREATE TABLE IF NOT EXISTS character_dialogue_flags (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    flag_name TEXT NOT NULL,
    flag_value TEXT, -- JSON value
    
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    UNIQUE(character_id, flag_name)
);

CREATE INDEX IF NOT EXISTS idx_char_flags_char ON character_dialogue_flags(character_id);
