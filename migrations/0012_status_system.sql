-- SURGE PROTOCOL: Database Schema Migration
-- Part 12: Status System (Conditions & Addictions)

-- ENUMS
-- ============================================

INSERT OR IGNORE INTO enum_condition_type (value, description) VALUES
('BUFF', 'Positive effect'),
('DEBUFF', 'Negative effect'),
('INJURY', 'Physical damage or trauma'),
('DISEASE', 'Sickness or biological agent'),
('PSYCHOSIS', 'Mental instability or cyberpsychosis'),
('ENVIRONMENTAL', 'Effect from environment');

CREATE TABLE IF NOT EXISTS enum_severity (
    value TEXT PRIMARY KEY
);

INSERT OR IGNORE INTO enum_severity (value) VALUES ('MINOR'), ('MODERATE'), ('SEVERE'), ('CRITICAL');

CREATE TABLE IF NOT EXISTS enum_addiction_stage (
    value TEXT PRIMARY KEY,
    description TEXT
);

INSERT OR IGNORE INTO enum_addiction_stage (value, description) VALUES 
('RECREATIONAL', 'Casual use, no withdrawal'), 
('HABITUAL', 'Regular use, mild cravings'), 
('DEPENDENT', 'Physical dependence, withdrawal symptoms'), 
('ACUTE', 'Severe addiction, life-threatening withdrawal');

-- character_conditions and character_addictions are now defined in 0007_combat.sql
