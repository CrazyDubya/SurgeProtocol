-- Migration: Add mission_log table
-- Required for mission action logging

CREATE TABLE IF NOT EXISTS mission_log (
    id TEXT PRIMARY KEY,
    mission_instance_id TEXT REFERENCES character_missions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'ACTION', 'STATUS_CHANGE', 'OBJECTIVE_COMPLETE'
    event_data TEXT, -- JSON
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mission_log_instance ON mission_log(mission_instance_id);
