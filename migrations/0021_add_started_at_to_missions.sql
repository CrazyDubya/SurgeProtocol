-- Migration: Add started_at to character_missions
-- Required for mission duration tracking and time limits

ALTER TABLE character_missions ADD COLUMN started_at TEXT;
