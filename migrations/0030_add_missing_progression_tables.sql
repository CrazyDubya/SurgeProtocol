-- SURGE PROTOCOL: Database Schema Migration
-- Part 30: Add Missing Progression Tables
-- Tables: character_experience, cross_training_progress

-- ============================================
-- CHARACTER EXPERIENCE
-- ============================================

CREATE TABLE IF NOT EXISTS character_experience (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

    -- Totals
    total_xp_earned INTEGER DEFAULT 0,
    total_xp_spent INTEGER DEFAULT 0,
    available_xp INTEGER DEFAULT 0,

    -- Categories
    combat_xp INTEGER DEFAULT 0,
    delivery_xp INTEGER DEFAULT 0,
    social_xp INTEGER DEFAULT 0,
    technical_xp INTEGER DEFAULT 0,
    exploration_xp INTEGER DEFAULT 0,
    story_xp INTEGER DEFAULT 0,

    -- Points
    attribute_points_available INTEGER DEFAULT 0,
    skill_points_available INTEGER DEFAULT 0,
    ability_points_available INTEGER DEFAULT 0,
    augment_slots_available INTEGER DEFAULT 0,

    -- Special Currencies
    algorithm_favor INTEGER DEFAULT 0,
    street_cred INTEGER DEFAULT 0,
    network_tokens INTEGER DEFAULT 0,
    humanity_anchors INTEGER DEFAULT 0,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    UNIQUE(character_id)
);

-- ============================================
-- CROSS TRAINING PROGRESS
-- ============================================

CREATE TABLE IF NOT EXISTS cross_training_progress (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    source_track_id TEXT NOT NULL REFERENCES tracks(id),
    target_track_id TEXT NOT NULL REFERENCES tracks(id),

    -- Progress
    xp_invested INTEGER DEFAULT 0,
    xp_required INTEGER DEFAULT 10000,
    current_effectiveness REAL DEFAULT 0.0,
    max_effectiveness REAL DEFAULT 1.0,

    -- Unlocks
    abilities_unlocked TEXT, -- JSON
    passives_unlocked TEXT, -- JSON
    
    -- Constraints
    blocked_abilities TEXT, -- JSON
    requires_augment_compatibility INTEGER DEFAULT 0, -- BOOLEAN

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    UNIQUE(character_id, target_track_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_char_xp_char ON character_experience(character_id);
CREATE INDEX IF NOT EXISTS idx_cross_training_char ON cross_training_progress(character_id);
CREATE INDEX IF NOT EXISTS idx_cross_training_target ON cross_training_progress(target_track_id);
