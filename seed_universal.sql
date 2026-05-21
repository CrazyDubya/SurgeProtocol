PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

                INSERT OR IGNORE INTO locations (
                    id, code, name, location_type, description, 
                    surveillance_level, ambient_population,
                    current_owner_faction_id, created_at, updated_at
                ) SELECT 
                    '47480a9a-c8ae-48c2-bc7e-b387e6362366', 'THE_HOLLOWS', 'The Hollows', 'DISTRICT', 'Lower City starting area. Dense, claustrophobic, community-focused despite poverty.',
                    1, 300000,
                    (SELECT id FROM factions WHERE code = 'CHROME_SAINTS'), datetime('now'), datetime('now')
                WHERE TRUE
            ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '2f928116-cc63-4cf4-8df7-7d0dc16d8993', (SELECT id FROM locations WHERE code = 'THE_HOLLOWS'), 'Chen''s Dispatch Office', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '7c07e550-43c9-4461-b689-80761737461a', (SELECT id FROM locations WHERE code = 'THE_HOLLOWS'), 'Tanaka''s Clinic', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '2d344877-507c-43dd-87c8-218e69319e74', (SELECT id FROM locations WHERE code = 'THE_HOLLOWS'), 'Rosa''s Mechanic Shop', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '15cd3e5b-c4cb-4277-9bcc-8a664ce2141e', (SELECT id FROM locations WHERE code = 'THE_HOLLOWS'), 'Hollows Market', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '56d38911-bd0d-4e96-a093-221726cc3689', (SELECT id FROM locations WHERE code = 'THE_HOLLOWS'), 'The Gutters', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                INSERT OR IGNORE INTO locations (
                    id, code, name, location_type, description, 
                    surveillance_level, ambient_population,
                    current_owner_faction_id, created_at, updated_at
                ) SELECT 
                    '650f8120-a194-42b6-9b7f-ffb7a50d6048', 'RED_HARBOR', 'Red Harbor', 'DISTRICT', 'Industrial corridor and shipping hub. Working class but more isolated and competitive than The Hollows.',
                    2, 180000,
                    (SELECT id FROM factions WHERE code = 'NEON_SAINTS'), datetime('now'), datetime('now')
                WHERE TRUE
            ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '39dc260f-35a8-4f3f-bc9c-3d76f6db2de2', (SELECT id FROM locations WHERE code = 'RED_HARBOR'), 'Docklands', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '91c508c8-c211-4053-b15a-eb5b15590f28', (SELECT id FROM locations WHERE code = 'RED_HARBOR'), 'Red Harbor Ruins', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            'b197126d-87ab-48b0-a2cc-8a1bf0b13660', (SELECT id FROM locations WHERE code = 'RED_HARBOR'), 'Delilah''s Operations', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                INSERT OR IGNORE INTO locations (
                    id, code, name, location_type, description, 
                    surveillance_level, ambient_population,
                    current_owner_faction_id, created_at, updated_at
                ) SELECT 
                    'b4aaff74-6970-4780-a0bb-29f5601e2fe3', 'INDUSTRIAL_ZONE', 'Industrial Zone', 'DISTRICT', 'Factory corridors and heavy manufacturing. Iron Dragon territory. Dangerous but profitable routes.',
                    2, 120000,
                    (SELECT id FROM factions WHERE code = 'IRON_DRAGONS'), datetime('now'), datetime('now')
                WHERE TRUE
            ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '5076c1e0-dfd3-418e-ac29-f559dc3ca16c', (SELECT id FROM locations WHERE code = 'INDUSTRIAL_ZONE'), 'Old Factory #7', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            'cd3405ff-4e0b-45c3-868a-bd36b71bc0fa', (SELECT id FROM locations WHERE code = 'INDUSTRIAL_ZONE'), 'The Forge', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                INSERT OR IGNORE INTO locations (
                    id, code, name, location_type, description, 
                    surveillance_level, ambient_population,
                    current_owner_faction_id, created_at, updated_at
                ) SELECT 
                    '9d6d0439-916b-4d34-8c00-b874950ec290', 'NIGHT_MARKET', 'Night Market', 'DISTRICT', 'Black market hub where everything has a price. Illegal goods, information, and services.',
                    1, 50000,
                    (SELECT id FROM factions WHERE code = NULL), datetime('now'), datetime('now')
                WHERE TRUE
            ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            'a6d72b4d-35f4-46da-8644-5354927a194f', (SELECT id FROM locations WHERE code = 'NIGHT_MARKET'), 'Main Market Plaza', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            'f5e7b70c-96c0-4017-8b2e-fe9fd6825b62', (SELECT id FROM locations WHERE code = 'NIGHT_MARKET'), 'Back Alleys', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '553b361b-a071-48e1-bf1b-fe6ed53b4575', (SELECT id FROM locations WHERE code = 'NIGHT_MARKET'), 'Information Booths', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                INSERT OR IGNORE INTO locations (
                    id, code, name, location_type, description, 
                    surveillance_level, ambient_population,
                    current_owner_faction_id, created_at, updated_at
                ) SELECT 
                    '5114ea5c-206f-4d72-825a-442d344e1b61', 'SILICON_HEIGHTS', 'Silicon Heights', 'DISTRICT', 'Tech companies and research labs. High security, clean streets, corporate surveillance everywhere.',
                    5, 75000,
                    (SELECT id FROM factions WHERE code = 'NAKAMURA_CORP'), datetime('now'), datetime('now')
                WHERE TRUE
            ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            'f18b516f-8515-4154-8114-42c0e93eae19', (SELECT id FROM locations WHERE code = 'SILICON_HEIGHTS'), 'Nakamura Tower', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '38f8f69b-6695-4976-9763-832f4218004b', (SELECT id FROM locations WHERE code = 'SILICON_HEIGHTS'), 'Research Labs', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '28572c17-ccb1-482e-bd8d-38179afbe5ae', (SELECT id FROM locations WHERE code = 'SILICON_HEIGHTS'), 'Corporate Plaza', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                INSERT OR IGNORE INTO locations (
                    id, code, name, location_type, description, 
                    surveillance_level, ambient_population,
                    current_owner_faction_id, created_at, updated_at
                ) SELECT 
                    '0f1a01cc-3d28-4fd1-b39f-52715f37dc6d', 'UPTOWN', 'Uptown Corporate', 'DISTRICT', 'Corporate heart of the city. Clean, surveilled, expensive. Where the elite live and work.',
                    5, 50000,
                    (SELECT id FROM factions WHERE code = 'OMNIDELIVER'), datetime('now'), datetime('now')
                WHERE TRUE
            ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '945ea50d-124b-4979-9c55-713c57d0cb9f', (SELECT id FROM locations WHERE code = 'UPTOWN'), 'Corporate Tower', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            'bf1846d4-028c-41ca-9deb-46a6ffeaeb8d', (SELECT id FROM locations WHERE code = 'UPTOWN'), 'Executive Residences', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '98ff1b5d-fc46-43e3-9825-4592280cb8c8', (SELECT id FROM locations WHERE code = 'UPTOWN'), 'Premium Delivery Hub', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                INSERT OR IGNORE INTO locations (
                    id, code, name, location_type, description, 
                    surveillance_level, ambient_population,
                    current_owner_faction_id, created_at, updated_at
                ) SELECT 
                    '7d2bfcd6-c570-4420-b12b-2cb28cafe31a', 'THE_INTERSTITIAL', 'The Interstitial', 'DISTRICT', 'The space between. Off-grid communities hidden from Algorithm surveillance. Rogue territory.',
                    0, 0,
                    (SELECT id FROM factions WHERE code = 'GHOST_NETWORK'), datetime('now'), datetime('now')
                WHERE TRUE
            ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '7765f87c-bc8d-46c9-98ca-f01e737347e4', (SELECT id FROM locations WHERE code = 'THE_INTERSTITIAL'), 'Solomon''s Sanctum', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            'd278f4d9-8c4b-4a18-b66d-47f557978b2e', (SELECT id FROM locations WHERE code = 'THE_INTERSTITIAL'), 'Ghost Network Safe Houses', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            'f9d09b46-7f19-46ba-8584-f5853b8de720', (SELECT id FROM locations WHERE code = 'THE_INTERSTITIAL'), 'Off-Grid Communities', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                INSERT OR IGNORE INTO locations (
                    id, code, name, location_type, description, 
                    surveillance_level, ambient_population,
                    current_owner_faction_id, created_at, updated_at
                ) SELECT 
                    '77b60bd3-2cad-4d50-bb02-a4f42f7416be', 'DOCKLANDS', 'Docklands', 'DISTRICT', 'Shipping and smuggling. Neon Saints controlled. Where legal and illegal cargo moves.',
                    2, 85000,
                    (SELECT id FROM factions WHERE code = 'NEON_SAINTS'), datetime('now'), datetime('now')
                WHERE TRUE
            ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '16ab6152-1929-41ec-906d-68896c1a3c68', (SELECT id FROM locations WHERE code = 'DOCKLANDS'), 'Main Docks', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            'ed71b444-9bd6-47d3-961d-81dc89d1c5de', (SELECT id FROM locations WHERE code = 'DOCKLANDS'), 'Warehouse District', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                        INSERT OR IGNORE INTO locations (
                            id, parent_location_id, name, location_type, created_at, updated_at
                        ) VALUES (
                            '46ce8c43-ca3a-4896-9974-a193437a2167', (SELECT id FROM locations WHERE code = 'DOCKLANDS'), 'Syndicate Front Businesses', 'POI', datetime('now'), datetime('now')
                        )
                    ;

                INSERT OR REPLACE INTO drone_definitions (
                    id, code, name, manufacturer, description,
                    drone_class, drone_role, size_category, rarity,
                    max_speed_kmh, acceleration, maneuverability, max_altitude_m,
                    max_hull_points, battery_capacity_minutes,
                    required_tier,
                    created_at, updated_at
                ) VALUES (
                    '9c34e043-614e-4ea4-90ed-dd89b16260fd', 'DRONE_SCOUT_V1', 'SkyEye Scout', 'AeroDyne', 'Basic surveillance drone. Cheap, quiet, but fragile.',
                    'QUADCOPTER', 'SCOUT', 'SMALL', 'COMMON',
                    60, 70, 80, 150,
                    15, 25,
                    1,
                    datetime('now'), datetime('now')
                )
            ;

                INSERT OR REPLACE INTO drone_definitions (
                    id, code, name, manufacturer, description,
                    drone_class, drone_role, size_category, rarity,
                    max_speed_kmh, acceleration, maneuverability, max_altitude_m,
                    max_hull_points, battery_capacity_minutes,
                    required_tier,
                    created_at, updated_at
                ) VALUES (
                    'e35038ab-ac38-402e-b65d-8f1c12f394db', 'DRONE_CARGO_MULE', 'Mule Hauler', 'HeavyLift', 'Heavy lift hexacopter designed for courier deliveries.',
                    'HEXACOPTER', 'CARGO', 'MEDIUM', 'COMMON',
                    40, 30, 40, 100,
                    50, 40,
                    2,
                    datetime('now'), datetime('now')
                )
            ;

                INSERT OR REPLACE INTO drone_definitions (
                    id, code, name, manufacturer, description,
                    drone_class, drone_role, size_category, rarity,
                    max_speed_kmh, acceleration, maneuverability, max_altitude_m,
                    max_hull_points, battery_capacity_minutes,
                    required_tier,
                    created_at, updated_at
                ) VALUES (
                    '9eb3af96-a9ca-4174-9b29-c3a44c0b3005', 'DRONE_COMBAT_WASP', 'Wasp Interceptor', 'Militech Clone', 'Light combat drone equipped with a stun gun.',
                    'QUADCOPTER', 'COMBAT', 'SMALL', 'UNCOMMON',
                    90, 90, 85, 200,
                    25, NULL,
                    3,
                    datetime('now'), datetime('now')
                )
            ;

            INSERT OR REPLACE INTO npc_definitions (
                id, code, name, description,
                faction_id,
                home_location_id,
                is_merchant, is_quest_giver, killable_by_player,
                created_at, updated_at
            ) SELECT 
                '5ad5567d-7056-4b58-9fda-a3873f6c294a', 'CHEN_DISPATCHER', 'Dispatcher Chen', 'Tired eyes, graying hair in a tight bun, calloused hands. Wears a faded Guild jacket with patched elbows. Slight stoop from years hunched over dispatch terminals.',
                (SELECT id FROM factions WHERE code = 'COURIERS_GUILD'),
                (SELECT id FROM locations WHERE name LIKE '%The Hollows - Dispatch Office%' LIMIT 1),
                0, 1, 0,
                datetime('now'), datetime('now')
            WHERE TRUE
        ;

            INSERT OR REPLACE INTO npc_definitions (
                id, code, name, description,
                faction_id,
                home_location_id,
                is_merchant, is_quest_giver, killable_by_player,
                created_at, updated_at
            ) SELECT 
                'fb76b95d-2266-4f7b-82c6-39b8448c5611', 'JIN_RIVAL', 'Jin Park', 'Korean-American, lean and wiry build. Shaved sides, longer top (practical for courier work). Always in motion—fidgeting, bouncing, ready to run.',
                (SELECT id FROM factions WHERE code = NULL),
                (SELECT id FROM locations WHERE name LIKE '%The Hollows → Red Harbor (as they advance)%' LIMIT 1),
                0, 1, 1,
                datetime('now'), datetime('now')
            WHERE TRUE
        ;

            INSERT OR REPLACE INTO npc_definitions (
                id, code, name, description,
                faction_id,
                home_location_id,
                is_merchant, is_quest_giver, killable_by_player,
                created_at, updated_at
            ) SELECT 
                'aae54764-4aab-4425-97b5-88f2d1cff9ae', 'TANAKA_DOCTOR', 'Dr. Yuki Tanaka', 'Petite build, precise movements, prematurely silver hair (genetics, not age) kept in tight bun. Tired but alert eyes behind smart glasses. Surgical scars on hands from early-career accident.',
                (SELECT id FROM factions WHERE code = NULL),
                (SELECT id FROM locations WHERE name LIKE '%The Hollows - Gray Clinic%' LIMIT 1),
                1, 1, 1,
                datetime('now'), datetime('now')
            WHERE TRUE
        ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        '369d73e1-4e44-4fb6-9218-cc3f2e14821f', 'CONSUMABLE_MEDKIT_BASIC', 'Basic Medkit', 'Standard first aid supplies. Bandages, antiseptic, and a shot of local anesthetic.', 'CONSUMABLE',
                        'COMMON', 1, 50, 0.3,
                        'Generic', 0, 5, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            '1049d09c-7718-49b6-82ad-cda01bd6dcea', '369d73e1-4e44-4fb6-9218-cc3f2e14821f', 'MEDICAL',
                            '{"heal_amount":15,"heal_type":"INSTANT","use_time_seconds":5}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        'eca28938-0d3f-4cc7-a3f2-dfc59505ba23', 'CONSUMABLE_MEDKIT_ADVANCED', 'Combat Medkit', 'Military-grade medical supplies with synthetic skin spray and bio-foam.', 'CONSUMABLE',
                        'UNCOMMON', 2, 150, 0.5,
                        'Trauma Team Clone', 0, 3, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            'd6bc833b-e97e-433d-9181-21c41e4c1f8b', 'eca28938-0d3f-4cc7-a3f2-dfc59505ba23', 'MEDICAL',
                            '{"heal_amount":35,"heal_type":"INSTANT","use_time_seconds":3,"bleed_stop":true}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        '15f4d907-1a1f-4665-8fc2-98e3a8d69c62', 'CONSUMABLE_MEDKIT_TRAUMA', 'Trauma Kit', 'Emergency trauma care package. Can stabilize even critical injuries.', 'CONSUMABLE',
                        'RARE', 3, 400, 0.8,
                        'Trauma Team Clone', 0, 2, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            '3ea77b25-8b38-4968-aed6-796e7ad804b9', '15f4d907-1a1f-4665-8fc2-98e3a8d69c62', 'MEDICAL',
                            '{"heal_amount":60,"heal_type":"INSTANT","use_time_seconds":2,"bleed_stop":true,"stabilize_critical":true}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        'd45ff764-0dff-4536-bde1-7ae697bf8d57', 'CONSUMABLE_STIM_REFLEX', 'Reflex Booster', 'Neural stimulant that accelerates reaction time. Side effects include jitters and headaches.', 'CONSUMABLE',
                        'UNCOMMON', 2, 100, 0.1,
                        'NeuroChem', 0, 5, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            '8ae3da30-b854-4b4f-8bc2-c5013b490b99', 'd45ff764-0dff-4536-bde1-7ae697bf8d57', 'STIM',
                            '{"buff_type":"REFLEX","buff_amount":2,"duration_minutes":10,"side_effect_chance":0.1,"side_effect":"JITTERS"}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        '2ad9f991-43ed-4f56-a583-efa3b2dcebca', 'CONSUMABLE_STIM_ENDURANCE', 'Enduro Shot', 'Synthetic adrenaline cocktail that suppresses fatigue. The crash afterwards is brutal.', 'CONSUMABLE',
                        'COMMON', 1, 35, 0.1,
                        'NeuroChem', 0, 8, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            '27d26afe-c943-4158-93a3-fbedb589e7ad', '2ad9f991-43ed-4f56-a583-efa3b2dcebca', 'STIM',
                            '{"buff_type":"STAMINA","buff_amount":20,"duration_minutes":30,"fatigue_suppression":true,"crash_effect":"EXHAUSTION"}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        'f6dce2b0-0175-4953-b8f3-06c5d43fdbce', 'CONSUMABLE_STIM_COMBAT', 'Berserker Stim', 'Combat drug that increases strength and aggression. Highly addictive.', 'CONSUMABLE',
                        'RARE', 3, 250, 0.1,
                        'Black Market', 1, 3, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            '5c92b03c-7e70-4d80-bd99-0c80c5bc5187', 'f6dce2b0-0175-4953-b8f3-06c5d43fdbce', 'STIM',
                            '{"buff_type":"COMBAT","strength_bonus":3,"damage_bonus":5,"pain_immunity":true,"duration_minutes":5,"addiction_chance":0.15,"humanity_cost":1}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        'c6751f81-41fa-4456-94a3-2972d3f87b2a', 'CONSUMABLE_STIM_FOCUS', 'Neural Focus', 'Cognitive enhancer that improves concentration and technical skills.', 'CONSUMABLE',
                        'UNCOMMON', 2, 120, 0.1,
                        'NeuroChem', 0, 5, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            'ed8d2b3e-db78-412c-95db-28d096c36069', 'c6751f81-41fa-4456-94a3-2972d3f87b2a', 'STIM',
                            '{"buff_type":"INTELLIGENCE","buff_amount":2,"skill_bonus_tech":1,"duration_minutes":15,"side_effect_chance":0.05,"side_effect":"MIGRAINE"}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        '3ac0018d-81a8-42ef-8946-b456a137ecec', 'CONSUMABLE_FOOD_RATION', 'Nutrient Bar', 'Compressed nutrition in bar form. Tastes like cardboard, keeps you running.', 'CONSUMABLE',
                        'COMMON', 1, 5, 0.1,
                        'Generic', 0, 20, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            '820317df-dd75-4b53-9c23-86eb3ce08bbd', '3ac0018d-81a8-42ef-8946-b456a137ecec', 'FOOD',
                            '{"hunger_restore":30,"stamina_restore":5}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        'a934c298-4f6b-4f60-bca4-db76b24ff6b8', 'CONSUMABLE_FOOD_RAMEN', 'Street Ramen', 'Hot noodles from a Hollows food stall. Surprisingly good.', 'CONSUMABLE',
                        'COMMON', 1, 15, 0.4,
                        'Street Vendor', 0, 5, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            '0d3edb9e-f42b-47e9-b56b-28b479d9ada5', 'a934c298-4f6b-4f60-bca4-db76b24ff6b8', 'FOOD',
                            '{"hunger_restore":50,"stamina_restore":10,"morale_bonus":1,"duration_minutes":60}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        '9f61fd2d-0aa4-45c1-a8b3-ac35a3f5bcaf', 'CONSUMABLE_DRINK_ENERGY', 'Surge Energy Drink', 'Caffeinated energy drink. Keeps you awake but not necessarily alert.', 'CONSUMABLE',
                        'COMMON', 1, 8, 0.3,
                        'Surge Corp', 0, 10, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            '2589d074-c614-42ba-865d-1382eed26ef2', '9f61fd2d-0aa4-45c1-a8b3-ac35a3f5bcaf', 'DRINK',
                            '{"stamina_restore":15,"fatigue_reduction":10,"duration_minutes":30}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        '1076c18d-aa98-4fa3-baa0-67d82c2b1529', 'CONSUMABLE_DRINK_SYNTHOHOL', 'Synthohol', 'Synthetic alcohol that gives you the buzz without the hangover. Mostly.', 'CONSUMABLE',
                        'COMMON', 1, 12, 0.3,
                        'Various', 0, 10, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            '588413a6-d58a-4d19-a60c-42daa11c717d', '1076c18d-aa98-4fa3-baa0-67d82c2b1529', 'DRINK',
                            '{"morale_bonus":2,"social_bonus":1,"reflex_penalty":-1,"duration_minutes":30}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        '7aad1063-71cc-4ea3-9adb-a0a785346ce8', 'CONSUMABLE_AMMO_9MM', '9mm Rounds', 'Standard 9mm ammunition. Works in most pistols and SMGs.', 'CONSUMABLE',
                        'COMMON', 1, 1, 0.01,
                        'Generic', 0, 100, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            '615a40c1-8e46-486d-96df-56702f5ee333', '7aad1063-71cc-4ea3-9adb-a0a785346ce8', 'AMMO',
                            '{"ammo_type":"9MM","damage_modifier":0}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        '7099a34e-b898-4ed7-bed8-593447d93718', 'CONSUMABLE_AMMO_10MM', '10mm Rounds', 'Heavy pistol ammunition with more stopping power than 9mm.', 'CONSUMABLE',
                        'COMMON', 1, 2, 0.015,
                        'Generic', 0, 80, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            '475f362d-2724-4713-bc38-5886f980fb3a', '7099a34e-b898-4ed7-bed8-593447d93718', 'AMMO',
                            '{"ammo_type":"10MM","damage_modifier":0}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        '2306834a-741d-4bac-95bd-46def1e8e51a', 'CONSUMABLE_AMMO_556', '5.56mm Rifle Rounds', 'Standard rifle ammunition for assault rifles and carbines.', 'CONSUMABLE',
                        'COMMON', 1, 2, 0.012,
                        'Generic', 0, 90, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            'c9fe93cf-6567-4eb6-a741-13d25d854114', '2306834a-741d-4bac-95bd-46def1e8e51a', 'AMMO',
                            '{"ammo_type":"5.56MM","damage_modifier":0}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        '343ea08b-b579-4979-bea3-91a39a9e415d', 'CONSUMABLE_AMMO_12GAUGE', '12 Gauge Shells', 'Standard shotgun shells. Devastating at close range.', 'CONSUMABLE',
                        'COMMON', 1, 3, 0.04,
                        'Generic', 0, 50, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            '39d8ff34-477a-4896-820e-6e3bf877c64a', '343ea08b-b579-4979-bea3-91a39a9e415d', 'AMMO',
                            '{"ammo_type":"12_GAUGE","damage_modifier":0}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        'e1908d91-954a-443d-b7f3-a305d7a54093', 'CONSUMABLE_AMMO_SMART', 'Smart Rounds', 'Self-guided ammunition for smart weapons. Requires smartlink to function.', 'CONSUMABLE',
                        'UNCOMMON', 2, 8, 0.02,
                        'Kang Tao Clone', 0, 60, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            '49a606a3-c45a-4139-9771-911ffcb7c82b', 'e1908d91-954a-443d-b7f3-a305d7a54093', 'AMMO',
                            '{"ammo_type":"SMART_9MM","damage_modifier":0,"tracking":true}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        '59bb52e0-592d-4bdb-9f23-7cf75f54155b', 'CONSUMABLE_AMMO_AP', 'Armor-Piercing Rounds', 'Hardened penetrator rounds that punch through body armor.', 'CONSUMABLE',
                        'UNCOMMON', 2, 5, 0.015,
                        'Military Surplus', 1, 50, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            'bb261879-957a-48f6-8ff5-6d0f16c71632', '59bb52e0-592d-4bdb-9f23-7cf75f54155b', 'AMMO',
                            '{"ammo_type":"9MM_AP","damage_modifier":-1,"armor_penetration_bonus":4}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        '97932802-93df-426f-a249-308e57e63ecb', 'CONSUMABLE_REPAIR_KIT', 'Basic Repair Kit', 'Tools and materials for field repairs on equipment and vehicles.', 'CONSUMABLE',
                        'COMMON', 1, 30, 0.5,
                        'Generic', 0, 5, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            '401e056c-1bf4-4405-ae3f-ad5d838344ed', '97932802-93df-426f-a249-308e57e63ecb', 'TOOL',
                            '{"repair_amount":20,"repair_type":"EQUIPMENT"}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        '93f01e5a-a568-4b82-bee3-1d26c998cb9d', 'CONSUMABLE_HACK_TOOL', 'Quickhack Module', 'Pre-loaded hacking tool for bypassing simple security systems.', 'CONSUMABLE',
                        'UNCOMMON', 2, 75, 0.05,
                        'Underground', 0, 5, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            'd0771fe8-b02a-4e9e-b87c-19b1355d381a', '93f01e5a-a568-4b82-bee3-1d26c998cb9d', 'SOFTWARE',
                            '{"hack_bonus":3,"target_type":["LOCK","CAMERA","DRONE"],"single_use":true}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        'e7a173d9-f279-4917-a0c0-203ac1db2f3b', 'CONSUMABLE_ANTIDOTE', 'Universal Antidote', 'Broad-spectrum antitoxin that neutralizes most common poisons.', 'CONSUMABLE',
                        'UNCOMMON', 2, 80, 0.1,
                        'Trauma Team Clone', 0, 5, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            'ae9deea8-bc13-44cc-b274-596d64e9a188', 'e7a173d9-f279-4917-a0c0-203ac1db2f3b', 'MEDICAL',
                            '{"cure_poison":true,"toxin_immunity_minutes":5}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        'f8dd7406-d7b5-4575-98f1-7dc1b6e5a911', 'CONSUMABLE_EMP_GRENADE', 'EMP Grenade', 'Electromagnetic pulse device that disables electronics in a small area.', 'CONSUMABLE',
                        'RARE', 3, 300, 0.3,
                        'Military Surplus', 1, 2, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            'b99559a1-5ce1-49c9-a16a-690b27c106c3', 'f8dd7406-d7b5-4575-98f1-7dc1b6e5a911', 'GRENADE',
                            '{"damage_type":"EMP","area_radius_m":8,"disable_electronics_seconds":30,"augment_disruption_chance":0.5}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, max_stack_size, is_consumable, created_at
                    ) VALUES (
                        'c76642c8-743a-41c5-9dc5-d9d1275b05cc', 'CONSUMABLE_SMOKE_GRENADE', 'Smoke Grenade', 'Deploys a thick cloud of obscuring smoke. Essential for tactical retreats.', 'CONSUMABLE',
                        'COMMON', 1, 40, 0.3,
                        'Military Surplus', 0, 5, 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO consumable_definitions (
                            id, item_id, consumable_type, 
                            immediate_effects,
                            created_at
                        ) VALUES (
                            'e18dba8e-a1e7-40aa-90ec-ed675c34e6b7', 'c76642c8-743a-41c5-9dc5-d9d1275b05cc', 'GRENADE',
                            '{"smoke_radius_m":6,"smoke_duration_seconds":30,"visibility_penalty":-5,"thermal_blocking":false}',
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        '52e8a1ac-f8ee-405a-a264-28974eecf7c3', 'WEAPON_PISTOL_STREET', 'Street Defender', 'A cheap, reliable pistol popular among the Hollows'' residents. Nothing fancy, but it works.', 'WEAPON',
                        'COMMON', 1, 150, 0.8,
                        'Generic', 0, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            'ece7dd60-ecd8-47dd-a1c0-54c8d64e1eb9', '52e8a1ac-f8ee-405a-a264-28974eecf7c3', 'PISTOL', 'SEMI_AUTO_PISTOL', 'KINETIC',
                            0, 1,
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        '89af363e-6484-4f26-a078-e829896d2d8b', 'WEAPON_PISTOL_ENFORCER', 'Nakamura Enforcer', 'Corporate security sidearm. Reliable, accurate, and intimidating enough to make people think twice.', 'WEAPON',
                        'UNCOMMON', 2, 450, 0.9,
                        'Nakamura Cybernetics', 0, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            '78545cb2-efa4-4b74-86da-a2d790f79409', '89af363e-6484-4f26-a078-e829896d2d8b', 'PISTOL', 'SEMI_AUTO_PISTOL', 'KINETIC',
                            0, 1,
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        '20159bf8-588b-4732-915c-81dd55125566', 'WEAPON_PISTOL_VIPER', 'Venom Viper', 'Compact machine pistol favored by gangs and close-quarters specialists. Spray and pray.', 'WEAPON',
                        'UNCOMMON', 2, 550, 1.2,
                        'Underground Custom', 0, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            'f402842c-7180-4683-b829-c9a8ce6f4954', '20159bf8-588b-4732-915c-81dd55125566', 'SMG', 'MACHINE_PISTOL', 'KINETIC',
                            0, 1,
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        'c83c86e4-9f70-46de-becc-752525ef69f7', 'WEAPON_SMG_RAZORWIND', 'Razorwind SMG', 'Compact submachine gun designed for courier work. Light, fast, and won''t slow you down.', 'WEAPON',
                        'UNCOMMON', 2, 700, 2.1,
                        'Jin-Tao Arms', 0, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            '3e5436c3-4d4d-4c7a-861e-a22c47a09785', 'c83c86e4-9f70-46de-becc-752525ef69f7', 'SMG', 'SUBMACHINE_GUN', 'KINETIC',
                            0, 1,
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        '67101ac9-7a65-44f0-8990-059a8b1ad721', 'WEAPON_SHOTGUN_STREET_SWEEPER', 'Street Sweeper', 'Pump-action shotgun built for clearing rooms. The intimidation factor alone is worth the price.', 'WEAPON',
                        'COMMON', 1, 300, 3.5,
                        'Generic', 0, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            'd4d11412-a454-4998-b8ef-2b1ab16ec846', '67101ac9-7a65-44f0-8990-059a8b1ad721', 'SHOTGUN', 'PUMP_ACTION', 'KINETIC',
                            0, 1,
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        '481b87de-690d-4eb0-9546-e09e82c2c98f', 'WEAPON_SHOTGUN_BREACHER', 'Tactical Breacher', 'Semi-automatic shotgun with a folding stock. Popular among security forces and those who need door removal services.', 'WEAPON',
                        'RARE', 3, 1200, 4,
                        'Militech Clone', 0, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            'a5eb2203-ff4c-4ad1-9c68-9d43d37982b6', '481b87de-690d-4eb0-9546-e09e82c2c98f', 'SHOTGUN', 'SEMI_AUTO', 'KINETIC',
                            0, 1,
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        '19d0912b-f518-471d-9af0-5c0cfc21fe75', 'WEAPON_BLADE_KNIFE', 'Utility Knife', 'Standard courier knife. Good for packages, bad for enemies. But better than nothing.', 'WEAPON',
                        'COMMON', 1, 25, 0.2,
                        'Generic', 0, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            '51158c12-5b18-4b5e-92e6-63bd52bf6fdb', '19d0912b-f518-471d-9af0-5c0cfc21fe75', 'MELEE_BLADE', 'KNIFE', 'KINETIC',
                            1, 0,
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        'ef0704dc-e1a2-41aa-942c-15a75ddf1e29', 'WEAPON_BLADE_MACHETE', 'Hollows Machete', 'Heavy blade repurposed from industrial equipment. Popular in the Hollows for its versatility.', 'WEAPON',
                        'COMMON', 1, 80, 0.9,
                        'Salvage', 0, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            'c6b1aac3-c283-4a32-beb8-bcef402c01dc', 'ef0704dc-e1a2-41aa-942c-15a75ddf1e29', 'MELEE_BLADE', 'MACHETE', 'KINETIC',
                            1, 0,
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        '7395897b-2c3a-498c-b526-0e390f6c7b25', 'WEAPON_BLADE_MONOWIRE', 'Monowire Blade', 'High-tech blade with a monomolecular edge. Cuts through armor like paper.', 'WEAPON',
                        'RARE', 3, 1500, 0.4,
                        'Arasaka Knockoff', 0, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            '1377d4a5-6271-46af-a81b-0869c572a6be', '7395897b-2c3a-498c-b526-0e390f6c7b25', 'MELEE_BLADE', 'MONOBLADE', 'KINETIC',
                            1, 0,
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        'fd9ce972-f37c-407f-b937-0172ebaad261', 'WEAPON_BLUNT_PIPE', 'Steel Pipe', 'Heavy steel pipe. The weapon of choice for those who can''t afford better.', 'WEAPON',
                        'COMMON', 1, 15, 1.5,
                        'Salvage', 0, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            '5d5fa193-34ca-4bf7-b3a9-95d9d8eae56f', 'fd9ce972-f37c-407f-b937-0172ebaad261', 'MELEE_BLUNT', 'CLUB', 'KINETIC',
                            1, 0,
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        '64aeb45a-e68e-4ac5-938a-e4ad94ff3ecd', 'WEAPON_BLUNT_STUN_BATON', 'Shock Baton', 'Electrified baton that delivers a nasty shock. Non-lethal option for those who prefer their targets alive.', 'WEAPON',
                        'UNCOMMON', 2, 350, 0.6,
                        'Militech Clone', 0, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            '123e6c17-1f7a-45da-b594-fcf393fa5044', '64aeb45a-e68e-4ac5-938a-e4ad94ff3ecd', 'MELEE_BLUNT', 'STUN_BATON', 'ELECTRICAL',
                            1, 0,
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        'f1d23711-f03f-455d-b2ab-8b4df88d4f77', 'WEAPON_PISTOL_SMART', 'Seeker-7 Smart Pistol', 'Smart weapon that tracks targets through your neural interface. Requires a smartlink augment to function.', 'WEAPON',
                        'RARE', 3, 1800, 1,
                        'Kang Tao Clone', 0, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            'dd15379a-f715-4d1d-8a1e-e6a1c3da26b5', 'f1d23711-f03f-455d-b2ab-8b4df88d4f77', 'PISTOL', 'SMART_PISTOL', 'KINETIC',
                            0, 1,
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        '140f035d-589c-4621-aa9c-28a950077c70', 'WEAPON_THROWN_FLASHBANG', 'Flashbang Grenade', 'Non-lethal grenade that blinds and deafens targets. Essential for tactical retreats.', 'WEAPON',
                        'UNCOMMON', 2, 75, 0.3,
                        'Military Surplus', 0, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            'c38a907f-0e71-44c6-9eee-49692e5f6d2b', '140f035d-589c-4621-aa9c-28a950077c70', 'THROWN', 'FLASHBANG', 'SONIC',
                            0, 0,
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        '6e7c6d49-59c7-45e9-9deb-598f4ac62517', 'WEAPON_THROWN_FRAG', 'Frag Grenade', 'Standard fragmentation grenade. Deadly in enclosed spaces.', 'WEAPON',
                        'RARE', 3, 200, 0.4,
                        'Military Surplus', 1, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            'fb49c355-8d07-4b7a-b5e0-8cf4ad766c92', '6e7c6d49-59c7-45e9-9deb-598f4ac62517', 'THROWN', 'FRAG_GRENADE', 'KINETIC',
                            0, 0,
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        'ee1d05c8-12b3-4fd7-94fd-e332f77007f8', 'WEAPON_RIFLE_BASIC', 'Scav Rifle', 'Cobbled-together assault rifle from salvaged parts. Unreliable but packs a punch.', 'WEAPON',
                        'COMMON', 1, 400, 3.8,
                        'Salvage', 0, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            '5feb74e4-768c-48f4-9811-215cbac87e1e', 'ee1d05c8-12b3-4fd7-94fd-e332f77007f8', 'ASSAULT_RIFLE', 'ASSAULT_RIFLE', 'KINETIC',
                            0, 1,
                            datetime('now')
                        )
                    ;

                    INSERT OR REPLACE INTO item_definitions (
                        id, code, name, description, item_type,
                        rarity, quality_tier, base_price, weight_kg,
                        manufacturer, is_illegal, created_at
                    ) VALUES (
                        'e402cb2c-1147-4d35-8ddf-cddc23f3da98', 'WEAPON_RIFLE_CORPORATE', 'Militech M-76 Carbine', 'Corporate security carbine. Reliable, accurate, and with enough stopping power for most situations.', 'WEAPON',
                        'RARE', 3, 1400, 3.2,
                        'Militech Clone', 0, datetime('now')
                    )
                ;

                        INSERT OR REPLACE INTO weapon_definitions (
                            id, item_id, weapon_class, weapon_type, damage_type,
                            is_melee, is_ranged,
                            created_at
                        ) VALUES (
                            '158ac1d9-0dd8-49fc-a7d6-441292b90cfe', 'e402cb2c-1147-4d35-8ddf-cddc23f3da98', 'ASSAULT_RIFLE', 'CARBINE', 'KINETIC',
                            0, 1,
                            datetime('now')
                        )
                    ;

                INSERT OR REPLACE INTO mission_definitions (
                    id, code, name, description, mission_type,
                    source_npc_id, tier_requirement,
                    created_at, updated_at
                ) SELECT 
                    'db434d8d-3e25-4d46-99e5-e06ea0cb8c7f', 'FIRST_DELIVERY', 'First Delivery', 'Deliver medical supplies to Dr. Tanaka''s clinic in the Night Market', 'DELIVERY',
                    (SELECT id FROM npc_definitions WHERE code LIKE '%tanaka%' OR code = 'tanaka' LIMIT 1), 0,
                    datetime('now'), datetime('now')
                WHERE TRUE
            ;

                INSERT OR REPLACE INTO mission_definitions (
                    id, code, name, description, mission_type,
                    source_npc_id, tier_requirement,
                    created_at, updated_at
                ) SELECT 
                    '5fc82783-713c-48af-aadd-e351114d8f69', 'VEHICLE_CHECK', 'Vehicle Diagnostic', 'Get your vehicle checked by Rosa at the station garage', 'INTERACTION',
                    (SELECT id FROM npc_definitions WHERE code LIKE '%rosa%' OR code = 'rosa' LIMIT 1), 0,
                    datetime('now'), datetime('now')
                WHERE TRUE
            ;

                INSERT OR REPLACE INTO mission_definitions (
                    id, code, name, description, mission_type,
                    source_npc_id, tier_requirement,
                    created_at, updated_at
                ) SELECT 
                    '7e6f79f9-5fe0-4128-9c33-2e2756923278', 'TEST_RACE', 'Test Race', 'Race against Jin to prove you deserve the premium contract', 'RACE',
                    (SELECT id FROM npc_definitions WHERE code LIKE '%chen%' OR code = 'chen' LIMIT 1), 1,
                    datetime('now'), datetime('now')
                WHERE TRUE
            ;

                INSERT OR REPLACE INTO mission_definitions (
                    id, code, name, description, mission_type,
                    source_npc_id, tier_requirement,
                    created_at, updated_at
                ) SELECT 
                    'b0df7f58-81ca-4259-9220-7a39c80e9c10', 'MERIDIAN_FIRST', 'First Premium Run', 'Your first delivery for Meridian Medical - prove you can handle premium contracts', 'DELIVERY',
                    (SELECT id FROM npc_definitions WHERE code LIKE '%meridian_medical%' OR code = 'meridian_medical' LIMIT 1), 1,
                    datetime('now'), datetime('now')
                WHERE TRUE
            ;
COMMIT;
PRAGMA foreign_keys = ON;