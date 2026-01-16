-- SURGE PROTOCOL: Database Schema Migration
-- Part 1: Setup and Enum Tables
-- Generated from schema documentation

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================
-- ENUM REFERENCE TABLES
-- SQLite doesn't support ENUMs natively, so we use reference tables
-- ============================================

-- Character Enums
CREATE TABLE IF NOT EXISTS enum_sex_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_sex_type (value) VALUES
    ('MALE'), ('FEMALE'), ('INTERSEX'), ('NONE');

CREATE TABLE IF NOT EXISTS enum_blood_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_blood_type (value) VALUES
    ('O_POS'), ('O_NEG'), ('A_POS'), ('A_NEG'), ('B_POS'), ('B_NEG'),
    ('AB_POS'), ('AB_NEG'), ('SYNTHETIC'), ('UNKNOWN');

CREATE TABLE IF NOT EXISTS enum_consciousness_state (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_consciousness_state (value) VALUES
    ('NORMAL'), ('FRAGMENTED'), ('NETWORKED'), ('ASCENDED'), ('ROGUE'), ('DORMANT'), ('DEAD');

CREATE TABLE IF NOT EXISTS enum_corporate_standing (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_corporate_standing (value) VALUES
    ('EXEMPLARY'), ('GOOD'), ('NEUTRAL'), ('PROBATION'), ('SUSPENDED'), ('TERMINATED'), ('ROGUE');

CREATE TABLE IF NOT EXISTS enum_origin_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_origin_type (value) VALUES
    ('STREET_KID'), ('CORPO_DROPOUT'), ('IMMIGRANT'), ('MILITARY_VET'), ('ACADEMIC'),
    ('CRIMINAL'), ('INHERITED_DEBT'), ('REFUGEE'), ('IDEALIST');

CREATE TABLE IF NOT EXISTS enum_convergence_path (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_convergence_path (value) VALUES
    ('ASCENSION'), ('ROGUE'), ('UNDECIDED'), ('REFUSED');

-- Attribute & Skill Enums
CREATE TABLE IF NOT EXISTS enum_attribute_category (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_attribute_category (value) VALUES
    ('PHYSICAL'), ('MENTAL'), ('SOCIAL'), ('TECHNICAL'), ('METAPHYSICAL'), ('DERIVED');

CREATE TABLE IF NOT EXISTS enum_skill_category (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_skill_category (value) VALUES
    ('COMBAT'), ('MOVEMENT'), ('TECHNICAL'), ('SOCIAL'), ('KNOWLEDGE'),
    ('SURVIVAL'), ('VEHICLE'), ('HACKING'), ('MEDICAL'), ('CRAFT'), ('PERFORMANCE');

-- Item & Equipment Enums
CREATE TABLE IF NOT EXISTS enum_rarity (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_rarity (value) VALUES
    ('COMMON'), ('UNCOMMON'), ('RARE'), ('EPIC'), ('LEGENDARY'), ('UNIQUE'), ('PROTOTYPE'), ('CORRUPTED');

CREATE TABLE IF NOT EXISTS enum_item_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_item_type (value) VALUES
    ('WEAPON'), ('ARMOR'), ('CLOTHING'), ('TOOL'), ('CONSUMABLE'), ('COMPONENT'),
    ('DATA'), ('KEY_ITEM'), ('JUNK'), ('CONTAINER'), ('CURRENCY'), ('VEHICLE_PART'),
    ('SOFTWARE'), ('CONTRABAND');

CREATE TABLE IF NOT EXISTS enum_equipment_slot (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_equipment_slot (value) VALUES
    ('HEAD'), ('FACE'), ('EYES'), ('EARS'), ('NECK'), ('TORSO'), ('BACK'),
    ('ARMS'), ('HANDS'), ('WAIST'), ('LEGS'), ('FEET'), ('WEAPON_PRIMARY'),
    ('WEAPON_SECONDARY'), ('WEAPON_MELEE'), ('TOOL_1'), ('TOOL_2');

CREATE TABLE IF NOT EXISTS enum_weapon_class (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_weapon_class (value) VALUES
    ('PISTOL'), ('SMG'), ('ASSAULT_RIFLE'), ('SHOTGUN'), ('SNIPER'), ('LMG'),
    ('MELEE_BLADE'), ('MELEE_BLUNT'), ('THROWN'), ('BOW'), ('LAUNCHER'), ('ENERGY'), ('EXOTIC');

CREATE TABLE IF NOT EXISTS enum_damage_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_damage_type (value) VALUES
    ('KINETIC'), ('ENERGY'), ('THERMAL'), ('ELECTRICAL'), ('CHEMICAL'),
    ('EMP'), ('SONIC'), ('RADIATION'), ('NEURAL'), ('BLEED'), ('TRUE');

-- Mission Enums
CREATE TABLE IF NOT EXISTS enum_mission_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_mission_type (value) VALUES
    ('DELIVERY_STANDARD'), ('DELIVERY_EXPRESS'), ('DELIVERY_FRAGILE'), ('DELIVERY_HAZMAT'),
    ('DELIVERY_COVERT'), ('DELIVERY_CONTESTED'), ('ESCORT_PERSON'), ('ESCORT_VEHICLE'),
    ('EXTRACTION'), ('INSERTION'), ('DATA_TRANSFER'), ('DEAD_DROP'), ('INTERCEPTION'),
    ('SURVEILLANCE'), ('STORY_MISSION');

CREATE TABLE IF NOT EXISTS enum_mission_status (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_mission_status (value) VALUES
    ('AVAILABLE'), ('ACCEPTED'), ('IN_PROGRESS'), ('CARGO_ACQUIRED'), ('EN_ROUTE'),
    ('AT_DESTINATION'), ('COMPLETED_SUCCESS'), ('COMPLETED_PARTIAL'), ('FAILED'),
    ('ABANDONED'), ('EXPIRED');

CREATE TABLE IF NOT EXISTS enum_cargo_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_cargo_type (value) VALUES
    ('PACKAGE_SMALL'), ('PACKAGE_MEDIUM'), ('PACKAGE_LARGE'), ('DOCUMENT'),
    ('DATA_PHYSICAL'), ('DATA_DIGITAL'), ('FOOD_HOT'), ('FOOD_COLD'),
    ('MEDICAL_SUPPLIES'), ('MEDICAL_URGENT'), ('BIOLOGICALS'), ('ORGAN_TRANSPORT'),
    ('WEAPONS'), ('CONTRABAND'), ('PERSON_VIP'), ('PERSON_COVERT'), ('UNKNOWN_SEALED');

-- World Enums
CREATE TABLE IF NOT EXISTS enum_region_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_region_type (value) VALUES
    ('METROPOLITAN'), ('URBAN'), ('SUBURBAN'), ('INDUSTRIAL'), ('COMMERCIAL'),
    ('RESIDENTIAL'), ('SLUM'), ('CORPORATE_ZONE'), ('GOVERNMENT'), ('MILITARY'),
    ('UNDERGROUND'), ('OFFSHORE');

CREATE TABLE IF NOT EXISTS enum_location_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_location_type (value) VALUES
    ('DISTRICT'), ('STREET'), ('BUILDING_RESIDENTIAL'), ('BUILDING_COMMERCIAL'),
    ('BUILDING_CORPORATE'), ('WAREHOUSE'), ('RESTAURANT'), ('BAR'), ('CLUB'),
    ('SHOP_GENERAL'), ('SHOP_WEAPONS'), ('SHOP_AUGMENTS'), ('CLINIC'), ('SAFE_HOUSE'),
    ('GARAGE'), ('TRANSIT_STATION'), ('ROOFTOP'), ('TUNNEL'), ('BLACK_MARKET'),
    ('INTERSTITIAL_NODE');

CREATE TABLE IF NOT EXISTS enum_access_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_access_type (value) VALUES
    ('PUBLIC'), ('SEMI_PUBLIC'), ('PRIVATE_RESIDENTIAL'), ('PRIVATE_COMMERCIAL'),
    ('CORPORATE_RESTRICTED'), ('GOVERNMENT_RESTRICTED'), ('FACTION_ONLY'),
    ('VIP_ONLY'), ('CRIMINAL_CONTROLLED'), ('INTERSTITIAL');

-- NPC & Faction Enums
CREATE TABLE IF NOT EXISTS enum_npc_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_npc_type (value) VALUES
    ('UNIQUE_STORY'), ('UNIQUE_SIDE'), ('RECURRING'), ('GENERIC_NAMED'),
    ('GENERIC_UNNAMED'), ('PROCEDURAL'), ('FACTION_LEADER'), ('VENDOR'),
    ('TRAINER'), ('QUEST_GIVER'), ('CONTACT'), ('ENEMY'), ('CIVILIAN');

CREATE TABLE IF NOT EXISTS enum_faction_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_faction_type (value) VALUES
    ('MEGACORP'), ('CORPORATION'), ('GOVERNMENT'), ('LAW_ENFORCEMENT'), ('MILITARY'),
    ('GANG'), ('SYNDICATE'), ('CULT'), ('MOVEMENT'), ('COLLECTIVE'), ('GUILD'), ('MERCENARY_GROUP');

CREATE TABLE IF NOT EXISTS enum_reputation_tier (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_reputation_tier (value) VALUES
    ('EXALTED'), ('REVERED'), ('HONORED'), ('FRIENDLY'), ('NEUTRAL'),
    ('UNFRIENDLY'), ('HOSTILE'), ('HATED'), ('NEMESIS');

-- Combat Enums
CREATE TABLE IF NOT EXISTS enum_condition_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_condition_type (value) VALUES
    ('BUFF'), ('DEBUFF'), ('DOT'), ('HOT'), ('CROWD_CONTROL'), ('MOVEMENT_IMPAIR'),
    ('MENTAL'), ('PHYSICAL'), ('ENVIRONMENTAL'), ('MEDICAL'), ('ADDICTION'),
    ('CYBERPSYCHOSIS'), ('HACKING');

CREATE TABLE IF NOT EXISTS enum_combat_status (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_combat_status (value) VALUES
    ('INITIALIZING'), ('PLAYER_TURN'), ('ENEMY_TURN'), ('PROCESSING'),
    ('PAUSED'), ('VICTORY'), ('DEFEAT'), ('RETREAT'), ('INTERRUPTED');

-- Quest & Narrative Enums
CREATE TABLE IF NOT EXISTS enum_quest_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_quest_type (value) VALUES
    ('MAIN_STORY'), ('MAJOR_SIDE'), ('MINOR_SIDE'), ('FACTION'), ('DAILY'),
    ('WEEKLY'), ('BOUNTY'), ('EXPLORATION'), ('COLLECTION'), ('TUTORIAL'), ('SECRET');

CREATE TABLE IF NOT EXISTS enum_quest_status (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_quest_status (value) VALUES
    ('AVAILABLE'), ('ACCEPTED'), ('IN_PROGRESS'), ('READY_TO_TURN_IN'),
    ('COMPLETED'), ('FAILED'), ('ABANDONED'), ('EXPIRED');

CREATE TABLE IF NOT EXISTS enum_dialogue_tone (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_dialogue_tone (value) VALUES
    ('NEUTRAL'), ('FRIENDLY'), ('PROFESSIONAL'), ('AGGRESSIVE'), ('THREATENING'),
    ('SYMPATHETIC'), ('SARCASTIC'), ('FLIRTATIOUS'), ('CONFIDENT'), ('HUMOROUS');

-- Economy Enums
CREATE TABLE IF NOT EXISTS enum_currency_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_currency_type (value) VALUES
    ('STANDARD'), ('CORPORATE'), ('FACTION'), ('CRYPTO'), ('PHYSICAL'), ('REWARD'), ('SPECIAL');

CREATE TABLE IF NOT EXISTS enum_transaction_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_transaction_type (value) VALUES
    ('DELIVERY_PAYMENT'), ('MISSION_REWARD'), ('PURCHASE'), ('SALE'), ('REPAIR'),
    ('MEDICAL'), ('INSURANCE_PREMIUM'), ('TAX_PAYMENT'), ('FINE'), ('BRIBE'),
    ('DEBT_PAYMENT'), ('THEFT_LOSS'), ('GAMBLING_WIN'), ('BLACK_MARKET');

CREATE TABLE IF NOT EXISTS enum_contract_status (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_contract_status (value) VALUES
    ('OFFERED'), ('UNDER_REVIEW'), ('ACTIVE'), ('PROBATION'), ('SUSPENDED'),
    ('BREACHED'), ('TERMINATED'), ('COMPLETED'), ('EXPIRED');

CREATE TABLE IF NOT EXISTS enum_debt_status (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_debt_status (value) VALUES
    ('CURRENT'), ('LATE'), ('DELINQUENT'), ('DEFAULT'), ('IN_COLLECTION'),
    ('RESTRUCTURED'), ('FORGIVEN'), ('PAID_OFF');

-- Meta/System Enums
CREATE TABLE IF NOT EXISTS enum_difficulty_level (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_difficulty_level (value) VALUES
    ('STORY'), ('EASY'), ('NORMAL'), ('HARD'), ('NIGHTMARE'), ('IRONMAN'), ('CUSTOM');

CREATE TABLE IF NOT EXISTS enum_save_type (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_save_type (value) VALUES
    ('MANUAL'), ('AUTO'), ('QUICK'), ('CHECKPOINT'), ('IRONMAN'), ('BACKUP'), ('CLOUD');

CREATE TABLE IF NOT EXISTS enum_privacy_level (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_privacy_level (value) VALUES
    ('PUBLIC'), ('FRIENDS_ONLY'), ('PRIVATE'), ('INVISIBLE');

-- Augmentation Enums
CREATE TABLE IF NOT EXISTS enum_augment_category (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_augment_category (value) VALUES
    ('NEURAL'), ('SENSORY'), ('SKELETAL'), ('MUSCULAR'), ('DERMAL'), ('ORGAN'),
    ('LIMB'), ('CIRCULATORY'), ('ENDOCRINE'), ('INTERFACE'), ('COSMETIC'), ('EXPERIMENTAL');

-- Vehicle Enums
CREATE TABLE IF NOT EXISTS enum_vehicle_class (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_vehicle_class (value) VALUES
    ('BIKE'), ('CAR'), ('TRUCK'), ('VAN'), ('SUV'), ('MOTORCYCLE'), ('SCOOTER'),
    ('QUADCOPTER'), ('VTOL'), ('BOAT'), ('MECH_LIGHT'), ('MECH_HEAVY'), ('EXOTIC');

CREATE TABLE IF NOT EXISTS enum_drone_state (
    value TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO enum_drone_state (value) VALUES
    ('STORED'), ('DEPLOYED'), ('HOVERING'), ('MOVING'), ('ATTACKING'), ('DEFENDING'),
    ('RETURNING'), ('CHARGING'), ('DAMAGED'), ('DESTROYED'), ('LOST'), ('HIJACKED');
