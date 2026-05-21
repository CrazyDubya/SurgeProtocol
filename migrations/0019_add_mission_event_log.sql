-- Create mission_event_log table for MissionLifecycleService
CREATE TABLE mission_event_log (
    id TEXT PRIMARY KEY,
    mission_id TEXT NOT NULL REFERENCES character_missions(id) ON DELETE CASCADE,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data TEXT, -- JSON
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_mission_event_log_mission ON mission_event_log(mission_id);
