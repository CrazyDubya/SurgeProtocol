-- Migration: Enable Crafting for Items
-- updates Basic Repair Kit to be craftable

-- 1. Create Recipes Table
CREATE TABLE IF NOT EXISTS item_recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    output_item_id TEXT NOT NULL REFERENCES item_definitions(id),
    output_quantity INTEGER DEFAULT 1,
    crafting_station_type TEXT, -- e.g. 'CHEMISTRY_STATION', 'AMMO_PRESS'
    craft_time_seconds INTEGER DEFAULT 60,
    is_unlocked_default INTEGER DEFAULT 1, -- BOOLEAN
    required_skill_id TEXT REFERENCES skill_definitions(id),
    required_skill_level INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. Create Recipe Components Table
CREATE TABLE IF NOT EXISTS item_recipe_components (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL REFERENCES item_recipes(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES item_definitions(id),
    quantity INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_recipe_output ON item_recipes(output_item_id);
CREATE INDEX IF NOT EXISTS idx_recipe_components_recipe ON item_recipe_components(recipe_id);

-- 3. Update existing item
UPDATE item_definitions
SET 
  is_craftable = 1, 
  component_categories = '["GENERIC"]',
  required_tier = 1,
  quality_tier = 1
WHERE id = 'ab89cfc2-e106-44d1-8e1b-07a8cc7dc084';
