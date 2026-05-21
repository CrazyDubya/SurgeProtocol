-- Migration: Add current_district_id to characters
-- Required for vendor filtering by district

ALTER TABLE characters ADD COLUMN current_district_id TEXT REFERENCES locations(id);
