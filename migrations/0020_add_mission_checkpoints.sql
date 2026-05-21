-- Migration: Add mission_checkpoints table
-- Needed for granular mission progress tracking (locations, combat, interactions)

CREATE TABLE IF NOT EXISTS mission_checkpoints (
    id TEXT PRIMARY KEY,
    mission_instance_id TEXT REFERENCES character_missions(id) ON DELETE CASCADE,
    checkpoint_type TEXT NOT NULL, -- 'REACH_LOCATION', 'COMBAT', 'INTERACT', 'SKILL_CHECK', 'STEALTH'
    checkpoint_data TEXT, -- JSON or string for matching (e.g. location name, NPC ID)
    
    -- Status
    is_completed INTEGER DEFAULT 0, -- BOOLEAN
    completed_at TEXT,
    
    -- Ordering
    sequence_order INTEGER DEFAULT 0,
    is_optional INTEGER DEFAULT 0, -- BOOLEAN
    
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mission_checkpoints_instance ON mission_checkpoints(mission_instance_id);
CREATE INDEX IF NOT EXISTS idx_mission_checkpoints_type ON mission_checkpoints(checkpoint_type);
