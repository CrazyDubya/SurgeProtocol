-- SURGE PROTOCOL: Seed Data
-- Initial data for game configuration and definitions

-- ============================================
-- ATTRIBUTE DEFINITIONS
-- ============================================

INSERT OR IGNORE INTO attribute_definitions (id, code, name, abbreviation, description, category, base_value, display_order) VALUES
('attr-pwr', 'PWR', 'Power', 'PWR', 'Raw physical strength. Affects melee damage, carrying capacity, intimidation.', 'PHYSICAL', 5, 1),
('attr-end', 'END', 'Endurance', 'END', 'Physical stamina and resilience. Affects health, stamina pool, poison resistance.', 'PHYSICAL', 5, 2),
('attr-agi', 'AGI', 'Agility', 'AGI', 'Flexibility and fine motor control. Affects dodge, stealth, lockpicking.', 'PHYSICAL', 5, 3),
('attr-vel', 'VEL', 'Velocity', 'VEL', 'Speed and reaction time. Affects driving, initiative, attack speed.', 'PHYSICAL', 5, 4),
('attr-int', 'INT', 'Intelligence', 'INT', 'Raw cognitive ability. Affects hacking, crafting, knowledge skills.', 'MENTAL', 5, 5),
('attr-prc', 'PRC', 'Perception', 'PRC', 'Awareness and attention to detail. Affects spotting, tracking, investigation.', 'MENTAL', 5, 6),
('attr-rsn', 'RSN', 'Reason', 'RSN', 'Problem-solving under pressure. Affects tactical decisions, jury-rigging.', 'MENTAL', 5, 7),
('attr-pre', 'PRE', 'Presence', 'PRE', 'Force of personality. Affects persuasion, intimidation, performance.', 'SOCIAL', 5, 8),
('attr-emp', 'EMP', 'Empathy', 'EMP', 'Emotional intelligence. Affects reading people, relationships, humanity recovery.', 'SOCIAL', 5, 9);

-- ============================================
-- TRACKS
-- ============================================

INSERT OR IGNORE INTO tracks (id, code, name, tagline, description, philosophy, unlock_tier, color_primary) VALUES
('track-vector', 'VECTOR', 'Vector', 'Speed is survival', 'Masters of movement. Vectors prioritize getting packages where they need to go as fast as physically possible.', 'The shortest distance between two points is through whatever is in your way.', 3, '#00FF88'),
('track-sentinel', 'SENTINEL', 'Sentinel', 'The package is sacred', 'Protectors and defenders. Sentinels ensure cargo and people reach their destination intact, no matter what.', 'Nothing touches my cargo. Nothing.', 3, '#0088FF'),
('track-netweaver', 'NETWEAVER', 'Netweaver', 'Information wants to be free', 'Digital infiltrators. Netweavers specialize in data, hacking, and manipulating the network that runs everything.', 'The best route is the one no one else can see.', 3, '#8800FF'),
('track-interface', 'INTERFACE', 'Interface', 'Every deal is a delivery', 'Social engineers. Interfaces excel at negotiation, manipulation, and getting people to do what they want.', 'The package is just an excuse to have a conversation.', 3, '#FF8800'),
('track-machinist', 'MACHINIST', 'Machinist', 'Build it. Break it. Own it.', 'Technical specialists. Machinists maintain, modify, and weaponize vehicles, drones, and augments.', 'If it has moving parts, I can make it do something new.', 3, '#FF0088');

-- ============================================
-- SPECIALIZATIONS
-- ============================================

-- Vector Specializations
INSERT OR IGNORE INTO specializations (id, code, name, track_id, tagline, unlock_tier) VALUES
('spec-slipstream', 'SLIPSTREAM', 'Slipstream', 'track-vector', 'Traffic flows around you', 6),
('spec-parkour', 'PARKOUR_VECTOR', 'Parkour Vector', 'track-vector', 'Walls are just suggestions', 6),
('spec-pilot', 'PILOT', 'Pilot', 'track-vector', 'Why drive when you can fly?', 6);

-- Sentinel Specializations
INSERT OR IGNORE INTO specializations (id, code, name, track_id, tagline, unlock_tier) VALUES
('spec-bulwark', 'BULWARK', 'Bulwark', 'track-sentinel', 'Immovable object', 6),
('spec-shepherd', 'SHEPHERD', 'Shepherd', 'track-sentinel', 'VIP security specialist', 6),
('spec-hazmat', 'HAZMAT', 'Hazmat Handler', 'track-sentinel', 'Dangerous cargo expert', 6);

-- Netweaver Specializations
INSERT OR IGNORE INTO specializations (id, code, name, track_id, tagline, unlock_tier) VALUES
('spec-phantom', 'PHANTOM', 'Phantom', 'track-netweaver', 'Ghost in the machine', 6),
('spec-spider', 'SPIDER', 'Spider', 'track-netweaver', 'Web of access points', 6),
('spec-oracle', 'ORACLE', 'Oracle', 'track-netweaver', 'See the future in data', 6);

-- Interface Specializations
INSERT OR IGNORE INTO specializations (id, code, name, track_id, tagline, unlock_tier) VALUES
('spec-broker', 'BROKER', 'Broker', 'track-interface', 'Deals within deals', 6),
('spec-mask', 'MASK', 'Mask', 'track-interface', 'Anyone you need to be', 6),
('spec-handler', 'HANDLER', 'Handler', 'track-interface', 'Loyalty is a tool', 6);

-- Machinist Specializations
INSERT OR IGNORE INTO specializations (id, code, name, track_id, tagline, unlock_tier) VALUES
('spec-swarmlord', 'SWARM_LORD', 'Swarm Lord', 'track-machinist', 'Distributed presence', 6),
('spec-centaur', 'CENTAUR', 'Centaur', 'track-machinist', 'One with the vehicle', 6),
('spec-fabricator', 'FABRICATOR', 'Fabricator', 'track-machinist', 'Build anything from nothing', 6);

-- ============================================
-- TIER DEFINITIONS
-- ============================================

INSERT OR IGNORE INTO tier_definitions (id, tier_number, name, rating_minimum, rating_maximum, description, narrative_milestone, attribute_points_granted, skill_points_granted) VALUES
('tier-1', 1, 'Applicant', 0.0, 2.99, 'Fresh meat. Probationary status.', 'Joined Omnideliver', 0, 0),
('tier-2', 2, 'Provisional', 3.0, 3.49, 'Barely trusted with real deliveries.', 'First successful delivery', 1, 2),
('tier-3', 3, 'Courier', 3.5, 3.99, 'A real courier now. Choose your Track.', 'Track Selection', 2, 3),
('tier-4', 4, 'Runner', 4.0, 4.24, 'Trusted with sensitive cargo.', 'First classified delivery', 1, 2),
('tier-5', 5, 'Specialist', 4.25, 4.49, 'Access to the Interstitial Network.', 'Interstitial access granted', 2, 3),
('tier-6', 6, 'Elite', 4.5, 4.69, 'Choose your Specialization.', 'Specialization Selection', 2, 3),
('tier-7', 7, 'Prime', 4.7, 4.84, 'Top 10% of all couriers.', 'Corporate recognition', 2, 3),
('tier-8', 8, 'Apex', 4.85, 4.94, 'Near-mythical reputation.', 'Legend status achieved', 2, 3),
('tier-9', 9, 'Convergence', 4.95, 4.99, 'The Algorithm notices you.', 'The Convergence begins', 3, 4),
('tier-10', 10, 'Transcendent', 5.0, 5.0, 'Perfect. What comes next?', 'The Choice', 5, 5);

-- ============================================
-- CURRENCY DEFINITIONS
-- ============================================

INSERT OR IGNORE INTO currency_definitions (id, code, name, symbol, description, currency_type, is_primary) VALUES
('curr-cred', 'CRED', 'Credits', '₢', 'Universal digital currency', 'STANDARD', 1),
('curr-ocoin', 'OCOIN', 'OmniCoin', 'Ⓞ', 'Omnideliver internal corporate scrip', 'CORPORATE', 0),
('curr-ghost', 'GHOST', 'GhostCoin', 'Ǥ', 'Untraceable cryptocurrency', 'CRYPTO', 0),
('curr-karma', 'KARMA', 'Karma Points', '☯', 'Reputation-based reward points', 'REWARD', 0);

-- ============================================
-- FACTIONS
-- ============================================

INSERT OR IGNORE INTO factions (id, code, name, short_name, tagline, faction_type, alignment_corporate, alignment_law, joinable_by_player, colors_primary) VALUES
('fact-omni', 'OMNI', 'Omnideliver Corporation', 'Omni', 'Always On Time', 'MEGACORP', 100, 50, 0, '#FF6600'),
('fact-network', 'NETWORK', 'The Network', 'Network', 'All Nodes Connected', 'COLLECTIVE', 80, 30, 0, '#00FFFF'),
('fact-union', 'UNION', 'Courier''s Union', 'Union', 'Solidarity Forever', 'GUILD', -20, 20, 1, '#FF0000'),
('fact-circuit', 'CIRCUIT', 'Shadow Circuit', 'Circuit', 'What You Need, When You Need It', 'SYNDICATE', -80, -60, 1, '#8B00FF'),
('fact-collective', 'COLLECTIVE', 'Collective Flesh', 'Collective', 'Transcend the Meat', 'CULT', -100, -80, 0, '#00FF00'),
('fact-trauma', 'TRAUMA', 'Trauma Team International', 'Trauma', 'Your Life Is Our Priority', 'CORPORATION', 60, 70, 0, '#FF0000'),
('fact-ncpd', 'NCPD', 'Metro Police Department', 'NCPD', 'To Protect and Serve', 'LAW_ENFORCEMENT', 30, 100, 0, '#0000FF'),
('fact-tigers', 'TIGERS', 'Chrome Tigers', 'Tigers', 'Strength Through Steel', 'GANG', -50, -70, 1, '#FFD700'),
('fact-saints', 'SAINTS', 'Digital Saints', 'Saints', 'Free the Data', 'MOVEMENT', -60, -20, 1, '#FFFFFF'),
('fact-ascend', 'ASCEND', 'Church of Ascension', 'Ascension', 'The Algorithm Provides', 'CULT', 40, 10, 0, '#GOLD');

-- ============================================
-- HUMANITY THRESHOLDS
-- ============================================

INSERT OR IGNORE INTO humanity_thresholds (id, threshold_value, threshold_name, description, can_recover) VALUES
('hum-100', 100, 'Baseline Human', 'Normal human function, full emotional range', 1),
('hum-80', 80, 'Chrome-Touched', 'Mild dissociation, dreams occasionally glitch', 1),
('hum-60', 60, 'Wired', 'Emotional blunting, occasional aggression spikes', 1),
('hum-40', 40, 'Ghost in Shell', 'Identity confusion, paranoid thoughts', 1),
('hum-20', 20, 'Edge Case', 'Violent episodes, reality breaks', 1),
('hum-0', 0, 'Cyberpsycho', 'Full psychotic break, hostile NPC takeover', 0);

-- ============================================
-- DIFFICULTY DEFINITIONS
-- ============================================

INSERT OR IGNORE INTO difficulty_definitions (id, code, name, description, damage_to_player, damage_from_player, credit_rewards, xp_rewards, permadeath, achievement_eligible) VALUES
('diff-story', 'STORY', 'Story Mode', 'Focus on the narrative, minimal challenge', 0.5, 1.5, 1.0, 1.0, 0, 0),
('diff-easy', 'EASY', 'Easy', 'Casual experience, forgiving combat', 0.75, 1.25, 1.0, 1.0, 0, 1),
('diff-normal', 'NORMAL', 'Normal', 'Balanced challenge, default experience', 1.0, 1.0, 1.0, 1.0, 0, 1),
('diff-hard', 'HARD', 'Hard', 'Increased challenge, smarter enemies', 1.25, 0.85, 1.15, 1.15, 0, 1),
('diff-nightmare', 'NIGHTMARE', 'Nightmare', 'Brutal difficulty, every mistake costs', 1.5, 0.7, 1.3, 1.3, 0, 1),
('diff-ironman', 'IRONMAN', 'Ironman', 'One life, one save, total commitment', 1.0, 1.0, 1.5, 1.5, 1, 1);

-- ============================================
-- BODY LOCATIONS
-- ============================================

INSERT OR IGNORE INTO body_locations (id, code, name, augment_slots, critical_organ, surgery_risk_base) VALUES
('body-head', 'HEAD', 'Head', 2, 1, 30),
('body-brain', 'BRAIN', 'Brain', 3, 1, 50),
('body-eyes', 'EYES', 'Eyes', 2, 0, 20),
('body-ears', 'EARS', 'Ears', 2, 0, 10),
('body-spine', 'SPINE', 'Spine', 3, 1, 40),
('body-torso', 'TORSO', 'Torso', 4, 1, 25),
('body-heart', 'HEART', 'Heart', 1, 1, 60),
('body-arms', 'ARMS', 'Arms', 4, 0, 15),
('body-hands', 'HANDS', 'Hands', 2, 0, 10),
('body-legs', 'LEGS', 'Legs', 4, 0, 15),
('body-skin', 'SKIN', 'Skin', 2, 0, 15),
('body-nervous', 'NERVOUS_SYSTEM', 'Nervous System', 2, 1, 45);

-- ============================================
-- AUGMENT MANUFACTURERS
-- ============================================

INSERT OR IGNORE INTO augment_manufacturers (id, code, name, tagline, quality_rating, ethics_rating, price_tier, primary_category, is_corporate_approved) VALUES
('mfr-kiroshi', 'KIROSHI', 'Kiroshi Optics', 'See Everything', 90, 70, 4, 'SENSORY', 1),
('mfr-dynalar', 'DYNALAR', 'Dynalar Technologies', 'Move Beyond Limits', 85, 60, 4, 'SKELETAL', 1),
('mfr-biosig', 'BIOSIG', 'BioTech Sigma', 'Think Faster', 95, 50, 5, 'NEURAL', 1),
('mfr-militech', 'MILITECH', 'Militech Cybernetics', 'Superior Firepower', 85, 30, 4, 'MUSCULAR', 1),
('mfr-zetatech', 'ZETATECH', 'Zetatech Industries', 'Chrome for Everyone', 50, 40, 1, 'INTERFACE', 1),
('mfr-raven', 'RAVEN', 'Raven Microcybernetics', 'Unseen, Unheard', 80, 45, 4, 'NEURAL', 1),
('mfr-trauma', 'TRAUMA', 'Trauma Team Medical', 'Your Life, Our Priority', 95, 80, 5, 'ORGAN', 1),
('mfr-ghost', 'GHOST', 'Ghost Circuit', 'Off the Grid', 60, 10, 2, 'INTERFACE', 0),
('mfr-collective', 'COLLECTIVE', 'Collective Flesh', 'Embrace the Change', 40, 5, 3, 'EXPERIMENTAL', 0);

-- ============================================
-- WEATHER CONDITIONS
-- ============================================

INSERT OR IGNORE INTO weather_conditions (id, code, name, severity, is_hazardous, visibility_modifier, speed_modifier) VALUES
('weather-clear', 'CLEAR', 'Clear', 1, 0, 1.0, 1.0),
('weather-cloudy', 'CLOUDY', 'Cloudy', 1, 0, 0.95, 1.0),
('weather-fog', 'FOG', 'Fog', 2, 0, 0.5, 0.8),
('weather-rain-light', 'RAIN_LIGHT', 'Light Rain', 2, 0, 0.8, 0.9),
('weather-rain-heavy', 'RAIN_HEAVY', 'Heavy Rain', 3, 0, 0.6, 0.7),
('weather-thunderstorm', 'THUNDERSTORM', 'Thunderstorm', 4, 1, 0.4, 0.6),
('weather-smog', 'SMOG_HEAVY', 'Heavy Smog', 3, 1, 0.3, 0.8),
('weather-acid-rain', 'ACID_RAIN', 'Acid Rain', 4, 1, 0.7, 0.8),
('weather-em-storm', 'EM_STORM', 'Electromagnetic Storm', 5, 1, 0.9, 1.0);

-- ============================================
-- DAMAGE TYPES
-- ============================================

INSERT OR IGNORE INTO damage_type_definitions (id, code, name, is_physical, is_energy, armor_effectiveness) VALUES
('dmg-kinetic', 'KIN', 'Kinetic', 1, 0, 1.0),
('dmg-energy', 'ENERGY', 'Energy', 0, 1, 0.7),
('dmg-thermal', 'THERMAL', 'Thermal', 0, 1, 0.6),
('dmg-elec', 'ELEC', 'Electrical', 0, 1, 0.5),
('dmg-chem', 'CHEM', 'Chemical', 0, 0, 0.8),
('dmg-emp', 'EMP', 'EMP', 0, 1, 0.0),
('dmg-sonic', 'SONIC', 'Sonic', 0, 0, 0.4),
('dmg-rad', 'RAD', 'Radiation', 0, 0, 0.3),
('dmg-neural', 'NEURAL', 'Neural', 0, 0, 0.0),
('dmg-bleed', 'BLEED', 'Bleeding', 1, 0, 0.2),
('dmg-true', 'TRUE', 'True', 0, 0, 0.0);

-- ============================================
-- COMMON CONDITIONS
-- ============================================

INSERT OR IGNORE INTO condition_definitions (id, code, name, condition_type, severity, is_positive, default_duration_seconds) VALUES
('cond-stunned', 'STUNNED', 'Stunned', 'CROWD_CONTROL', 3, 0, 6),
('cond-suppressed', 'SUPPRESSED', 'Suppressed', 'DEBUFF', 2, 0, 12),
('cond-bleeding', 'BLEEDING', 'Bleeding', 'DOT', 2, 0, 30),
('cond-burning', 'BURNING', 'Burning', 'DOT', 3, 0, 12),
('cond-poisoned', 'POISONED', 'Poisoned', 'DOT', 2, 0, 60),
('cond-slowed', 'SLOWED', 'Slowed', 'MOVEMENT_IMPAIR', 2, 0, 15),
('cond-immobilized', 'IMMOBILIZED', 'Immobilized', 'MOVEMENT_IMPAIR', 4, 0, 6),
('cond-blind', 'BLIND', 'Blinded', 'DEBUFF', 4, 0, 10),
('cond-panicked', 'PANICKED', 'Panicked', 'MENTAL', 3, 0, 15),
('cond-enraged', 'ENRAGED', 'Enraged', 'MENTAL', 2, 0, 20),
('cond-withdrawal', 'WITHDRAWAL', 'Withdrawal', 'ADDICTION', 3, 0, 3600);
