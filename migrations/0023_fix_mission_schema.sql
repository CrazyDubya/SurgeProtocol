-- Migration: Fix character_missions schema for API compatibility
-- Adds columns used by mission action handlers

ALTER TABLE character_missions ADD COLUMN current_state TEXT; -- JSON for dynamic mission state
ALTER TABLE character_missions ADD COLUMN time_limit_minutes INTEGER; -- Denormalized for quick checks
