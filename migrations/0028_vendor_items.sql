-- Create vendor_items table to track actual stock
CREATE TABLE IF NOT EXISTS vendor_items (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL,
    item_definition_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_override INTEGER, -- Optional override, checks base_price * modifier if null
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vendor_id) REFERENCES vendor_inventories(id) ON DELETE CASCADE,
    FOREIGN KEY (item_definition_id) REFERENCES item_definitions(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_items_vendor ON vendor_items(vendor_id);
