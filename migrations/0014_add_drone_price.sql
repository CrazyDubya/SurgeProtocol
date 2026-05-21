
-- SURGE PROTOCOL: Database Schema Migration
-- Part 14: Add base_price to drone_definitions
-- Missing column fix

ALTER TABLE drone_definitions ADD COLUMN base_price INTEGER NOT NULL DEFAULT 1000;
