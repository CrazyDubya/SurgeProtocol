-- Seed a training encounter and NPC for testing

INSERT INTO locations (id, name, code)
VALUES ('loc_training', 'Training Grounds', 'TRAINING_GROUNDS')
ON CONFLICT (id) DO NOTHING;

INSERT INTO combat_arenas (id, location_id, name, width_m, height_m, grid_size_m)
VALUES ('arena_training', 'loc_training', 'Training Arena', 20, 20, 1.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO npc_definitions (id, code, name, npc_type, threat_level, combat_capable)
VALUES ('npc_training_dummy', 'TRAINING_DUMMY', 'Training Dummy', 'ENEMY', 1, 1)
ON CONFLICT (id) DO UPDATE SET npc_type = 'ENEMY';

INSERT INTO combat_encounters (
    id, name, encounter_type, difficulty_rating, location_id, combat_arena_id, 
    enemy_spawn_groups, 
    primary_objective
)
VALUES (
    'enc_training', 
    'Combat Simulation', 
    'SIMULATION', 
    1, 
    'loc_training', 
    'arena_training',
    '[{"npcId":"npc_training_dummy","count":1,"tier":1}]', 
    'Defeat all enemies'
)
ON CONFLICT (id) DO UPDATE SET
    enemy_spawn_groups = excluded.enemy_spawn_groups;
