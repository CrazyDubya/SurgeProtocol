-- Algorithm Tables
-- Manages Algorithm messages, responses, standing, and directives

-- Algorithm messages sent to characters
CREATE TABLE IF NOT EXISTS algorithm_messages (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tone TEXT NOT NULL CHECK (tone IN ('neutral', 'approving', 'disappointed', 'urgent', 'cryptic', 'threatening')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  acknowledged INTEGER NOT NULL DEFAULT 0,
  acknowledged_at TEXT,
  response_variant TEXT CHECK (response_variant IN ('compliant', 'questioning', 'defiant', 'silent')),
  response_text TEXT,
  source TEXT NOT NULL DEFAULT 'system',
  metadata TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_algorithm_messages_character ON algorithm_messages(character_id);
CREATE INDEX IF NOT EXISTS idx_algorithm_messages_unack ON algorithm_messages(character_id, acknowledged) WHERE acknowledged = 0;

-- Character's standing with the Algorithm
CREATE TABLE IF NOT EXISTS algorithm_standing (
  character_id TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  algorithm_rep INTEGER NOT NULL DEFAULT 50,
  trust_level INTEGER NOT NULL DEFAULT 1,
  compliance_rate REAL NOT NULL DEFAULT 50.0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  days_connected INTEGER NOT NULL DEFAULT 1,
  last_interaction TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Algorithm reputation changes log
CREATE TABLE IF NOT EXISTS algorithm_rep_changes (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_algorithm_rep_changes_character ON algorithm_rep_changes(character_id);

-- Algorithm directives (objectives/commands)
CREATE TABLE IF NOT EXISTS algorithm_directives (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_algorithm_directives_character ON algorithm_directives(character_id);
CREATE INDEX IF NOT EXISTS idx_algorithm_directives_active ON algorithm_directives(character_id, completed, expires_at);

-- Insert initial welcome message for new characters (trigger handled by application)
