-- SURGE PROTOCOL: Database Schema Migration
-- Part 13: Drone Swarms
-- Tables: drone_swarms

-- ============================================
-- DRONE SWARMS
-- ============================================

CREATE TABLE IF NOT EXISTS drone_swarms (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    
    -- Composition
    swarm_type TEXT, -- e.g. 'ATTACK', 'SCOUT', 'DEFENSE'
    max_size INTEGER DEFAULT 1,
    current_size INTEGER DEFAULT 0,
    homogeneous INTEGER DEFAULT 0, -- BOOLEAN (if all drones must be same type)

    -- State
    current_state TEXT DEFAULT 'IDLE',
    current_formation TEXT, -- e.g. 'V_SHAPE', 'SPHERE', 'GRID'
    center_coordinates TEXT, -- JSON {x,y,z} or similar
    formation_radius_m REAL DEFAULT 0,
    
    -- Behavior
    current_behavior TEXT, -- e.g. 'PATROL', 'FOLLOW', 'ENGAGE'
    target_id TEXT,
    target_type TEXT, -- 'NPC', 'LOCATION', 'VEHICLE'

    -- Bonuses/Stats (Calculated or Persistent)
    coordination_bonus REAL DEFAULT 0,
    sensor_coverage_bonus REAL DEFAULT 0,
    intimidation_factor REAL DEFAULT 0,
    effective_speed REAL,
    effective_range REAL,
    sync_quality REAL DEFAULT 1.0, -- 0.0 to 1.0 representation of swarm efficiency

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_drone_swarms_character ON drone_swarms(character_id);
