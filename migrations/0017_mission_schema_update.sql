-- Add JSON columns to mission_definitions for service compatibility
ALTER TABLE mission_definitions ADD COLUMN objectives TEXT; -- JSON
ALTER TABLE mission_definitions ADD COLUMN complications TEXT; -- JSON

-- Add columns to character_missions for service state tracking
ALTER TABLE character_missions ADD COLUMN expires_at TEXT;
ALTER TABLE character_missions ADD COLUMN current_objective_index INTEGER DEFAULT 0;
ALTER TABLE character_missions ADD COLUMN objectives_completed TEXT DEFAULT '[]'; -- JSON
ALTER TABLE character_missions ADD COLUMN complications_triggered TEXT DEFAULT '[]'; -- JSON
ALTER TABLE character_missions ADD COLUMN bonus_objectives_completed TEXT DEFAULT '[]'; -- JSON
ALTER TABLE character_missions ADD COLUMN distance_traveled_m INTEGER DEFAULT 0;
-- time_elapsed_seconds already exists
ALTER TABLE character_missions ADD COLUMN damage_taken INTEGER DEFAULT 0;
ALTER TABLE character_missions ADD COLUMN stealth_maintained INTEGER DEFAULT 1;
ALTER TABLE character_missions ADD COLUMN final_rating REAL;
-- final_pay already exists

-- Add standard timestamps
ALTER TABLE character_missions ADD COLUMN created_at TEXT DEFAULT (datetime('now'));
ALTER TABLE character_missions ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));
