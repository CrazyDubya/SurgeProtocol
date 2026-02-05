/**
 * Integration tests for NPC system API.
 *
 * Tests for NPC definitions (templates) and instances (live state).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import app from '../../src/index';
import { createMockEnv, createTestRequest, parseJsonResponse, type MockEnv } from '../helpers/mock-env';

describe('NPC System Integration', () => {
  let env: MockEnv;

  beforeEach(async () => {
    env = createMockEnv();

    // Seed factions for NPC affiliation
    env.DB._seed('factions', [
      {
        id: 'faction-arasaka',
        code: 'ARASAKA',
        name: 'Arasaka Corporation',
      },
      {
        id: 'faction-militech',
        code: 'MILITECH',
        name: 'Militech',
      },
    ]);

    // Seed locations for NPC placement
    env.DB._seed('locations', [
      {
        id: 'loc-downtown',
        code: 'DOWNTOWN',
        name: 'Downtown District',
      },
      {
        id: 'loc-market',
        code: 'NIGHT_MARKET',
        name: 'Night Market',
      },
      {
        id: 'loc-clinic',
        code: 'RIPPERDOC_CLINIC',
        name: "Viktor's Clinic",
      },
    ]);

    // Seed NPC definitions
    env.DB._seed('npc_definitions', [
      {
        id: 'npc-viktor',
        code: 'VIKTOR_VEKTOR',
        name: 'Viktor Vektor',
        title: 'Ripperdoc',
        description: 'A skilled ripperdoc and former boxer.',
        background: 'Former professional boxer turned underground cyberware surgeon.',
        npc_type: 'CIVILIAN',
        npc_category: 'SERVICE_PROVIDER',
        is_unique: 1,
        is_essential: 1,
        is_procedural: 0,
        gender: 'male',
        age: 55,
        ethnicity: 'Slavic',
        height_cm: 185,
        build: 'Athletic',
        distinguishing_features: 'Boxing scars, cybernetic eye',
        portrait_asset: 'portraits/viktor.png',
        personality_traits: JSON.stringify(['calm', 'professional', 'caring']),
        speech_patterns: JSON.stringify(['measured', 'technical']),
        mannerisms: 'Often references boxing metaphors',
        likes: JSON.stringify(['boxing', 'quality cyberware', 'loyalty']),
        dislikes: JSON.stringify(['corpos', 'cheap chrome', 'violence']),
        goals: JSON.stringify(['help people', 'perfect craft']),
        faction_id: null,
        faction_rank: null,
        employer: null,
        occupation: 'Ripperdoc',
        home_location_id: 'loc-clinic',
        work_location_id: 'loc-clinic',
        hangout_locations: JSON.stringify([]),
        schedule: JSON.stringify({ morning: 'work', afternoon: 'work', evening: 'closed' }),
        combat_capable: 1,
        combat_style: 'MELEE',
        threat_level: 3,
        skills: JSON.stringify(['surgery', 'boxing', 'tech']),
        abilities: JSON.stringify([]),
        augments: JSON.stringify(['cybereye', 'reflex_booster']),
        typical_equipment: JSON.stringify(['surgical_tools']),
        is_vendor: 1,
        vendor_inventory_id: 'vendor-viktor-cyberware',
        is_quest_giver: 1,
        available_quests: JSON.stringify(['quest-first-chrome', 'quest-boxing-match']),
        is_trainer: 0,
        trainable_skills: null,
        greeting_dialogue_id: 'dialogue-viktor-greeting',
        ambient_dialogue: JSON.stringify(['Need some chrome?', 'Take a seat.']),
        story_importance: 8,
        romance_option: 0,
        killable_by_player: 0,
        death_consequence: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'npc-wakako',
        code: 'WAKAKO_OKADA',
        name: 'Wakako Okada',
        title: 'Fixer',
        description: 'A powerful fixer operating from a pachinko parlor.',
        background: 'Former assassin turned information broker and fixer.',
        npc_type: 'CIVILIAN',
        npc_category: 'FIXER',
        is_unique: 1,
        is_essential: 1,
        is_procedural: 0,
        gender: 'female',
        age: 70,
        ethnicity: 'Japanese',
        height_cm: 155,
        build: 'Slim',
        distinguishing_features: 'Traditional dress, calm demeanor',
        portrait_asset: 'portraits/wakako.png',
        personality_traits: JSON.stringify(['calculating', 'mysterious', 'patient']),
        speech_patterns: JSON.stringify(['formal', 'cryptic']),
        mannerisms: 'Always seems to know more than she lets on',
        likes: JSON.stringify(['efficiency', 'respect', 'tradition']),
        dislikes: JSON.stringify(['rudeness', 'incompetence', 'betrayal']),
        goals: JSON.stringify(['expand influence', 'protect family']),
        faction_id: null,
        faction_rank: null,
        employer: null,
        occupation: 'Fixer',
        home_location_id: 'loc-market',
        work_location_id: 'loc-market',
        hangout_locations: JSON.stringify(['loc-downtown']),
        schedule: JSON.stringify({ morning: 'meetings', afternoon: 'work', evening: 'work' }),
        combat_capable: 0,
        combat_style: null,
        threat_level: 1,
        skills: JSON.stringify(['negotiation', 'intel', 'management']),
        abilities: JSON.stringify([]),
        augments: JSON.stringify(['neural_link']),
        typical_equipment: JSON.stringify([]),
        is_vendor: 0,
        vendor_inventory_id: null,
        is_quest_giver: 1,
        available_quests: JSON.stringify(['quest-market-trouble', 'quest-corporate-intel']),
        is_trainer: 0,
        trainable_skills: null,
        greeting_dialogue_id: 'dialogue-wakako-greeting',
        ambient_dialogue: JSON.stringify(['Ah, V. I have work for you.']),
        story_importance: 7,
        romance_option: 0,
        killable_by_player: 0,
        death_consequence: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'npc-vendor-1',
        code: 'MARKET_VENDOR_01',
        name: 'Chen Wei',
        title: 'Street Vendor',
        description: 'A food vendor at the night market.',
        background: null,
        npc_type: 'CIVILIAN',
        npc_category: 'MERCHANT',
        is_unique: 0,
        is_essential: 0,
        is_procedural: 0,
        gender: 'male',
        age: 45,
        ethnicity: 'Chinese',
        height_cm: 170,
        build: 'Average',
        distinguishing_features: null,
        portrait_asset: 'portraits/generic_vendor.png',
        personality_traits: JSON.stringify(['friendly', 'chatty']),
        speech_patterns: null,
        mannerisms: null,
        likes: JSON.stringify(['regular customers']),
        dislikes: JSON.stringify(['gangs']),
        goals: null,
        faction_id: null,
        faction_rank: null,
        employer: null,
        occupation: 'Food Vendor',
        home_location_id: null,
        work_location_id: 'loc-market',
        hangout_locations: null,
        schedule: null,
        combat_capable: 0,
        combat_style: null,
        threat_level: 0,
        skills: null,
        abilities: null,
        augments: null,
        typical_equipment: null,
        is_vendor: 1,
        vendor_inventory_id: 'vendor-food-stall',
        is_quest_giver: 0,
        available_quests: null,
        is_trainer: 0,
        trainable_skills: null,
        greeting_dialogue_id: null,
        ambient_dialogue: JSON.stringify(['Best noodles in town!']),
        story_importance: 1,
        romance_option: 0,
        killable_by_player: 1,
        death_consequence: 'minor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'npc-trainer-1',
        code: 'BOXING_TRAINER',
        name: 'Coach Fred',
        title: 'Boxing Coach',
        description: 'Trains fighters at the downtown gym.',
        background: 'Former middleweight champion.',
        npc_type: 'CIVILIAN',
        npc_category: 'TRAINER',
        is_unique: 1,
        is_essential: 0,
        is_procedural: 0,
        gender: 'male',
        age: 60,
        ethnicity: 'African-American',
        height_cm: 180,
        build: 'Muscular',
        distinguishing_features: 'Broken nose, cauliflower ears',
        portrait_asset: 'portraits/coach_fred.png',
        personality_traits: JSON.stringify(['tough', 'encouraging', 'disciplined']),
        speech_patterns: null,
        mannerisms: 'Always shadow boxes while talking',
        likes: JSON.stringify(['dedication', 'hard work']),
        dislikes: JSON.stringify(['quitters', 'cheaters']),
        goals: JSON.stringify(['train champions']),
        faction_id: null,
        faction_rank: null,
        employer: null,
        occupation: 'Boxing Trainer',
        home_location_id: 'loc-downtown',
        work_location_id: 'loc-downtown',
        hangout_locations: null,
        schedule: null,
        combat_capable: 1,
        combat_style: 'MELEE',
        threat_level: 4,
        skills: JSON.stringify(['boxing', 'athletics']),
        abilities: null,
        augments: null,
        typical_equipment: null,
        is_vendor: 0,
        vendor_inventory_id: null,
        is_quest_giver: 0,
        available_quests: null,
        is_trainer: 1,
        trainable_skills: JSON.stringify([
          { skillId: 'skill-melee', maxLevel: 8, cost: 500 },
          { skillId: 'skill-athletics', maxLevel: 6, cost: 300 },
        ]),
        greeting_dialogue_id: null,
        ambient_dialogue: null,
        story_importance: 3,
        romance_option: 0,
        killable_by_player: 1,
        death_consequence: 'minor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'npc-guard-1',
        code: 'ARASAKA_GUARD',
        name: 'Arasaka Security Guard',
        title: null,
        description: 'A corporate security guard.',
        background: null,
        npc_type: 'ENEMY',
        npc_category: 'GUARD',
        is_unique: 0,
        is_essential: 0,
        is_procedural: 1,
        gender: 'male',
        age: 30,
        ethnicity: null,
        height_cm: 180,
        build: 'Athletic',
        distinguishing_features: 'Arasaka uniform, tactical gear',
        portrait_asset: 'portraits/arasaka_guard.png',
        personality_traits: JSON.stringify(['loyal', 'professional']),
        speech_patterns: null,
        mannerisms: null,
        likes: null,
        dislikes: null,
        goals: null,
        faction_id: 'faction-arasaka',
        faction_rank: 'Security',
        employer: 'Arasaka Corporation',
        occupation: 'Security Guard',
        home_location_id: null,
        work_location_id: 'loc-downtown',
        hangout_locations: null,
        schedule: null,
        combat_capable: 1,
        combat_style: 'RANGED',
        threat_level: 3,
        skills: JSON.stringify(['firearms', 'tactics']),
        abilities: null,
        augments: JSON.stringify(['basic_optics']),
        typical_equipment: JSON.stringify(['assault_rifle', 'armor_vest']),
        is_vendor: 0,
        vendor_inventory_id: null,
        is_quest_giver: 0,
        available_quests: null,
        is_trainer: 0,
        trainable_skills: null,
        greeting_dialogue_id: null,
        ambient_dialogue: JSON.stringify(['Move along.', 'Nothing to see here.']),
        story_importance: 0,
        romance_option: 0,
        killable_by_player: 1,
        death_consequence: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Seed NPC instances (live state)
    env.DB._seed('npc_instances', [
      {
        id: 'inst-viktor-save1',
        npc_definition_id: 'npc-viktor',
        save_id: 'save-1',
        is_alive: 1,
        is_active: 1,
        current_health: 100,
        current_location_id: 'loc-clinic',
        current_activity: 'working',
        relationship_with_player: 25,
        trust_level: 30,
        fear_level: 0,
        respect_level: 20,
        romantic_interest: 0,
        times_met: 5,
        last_interaction: new Date(Date.now() - 86400000).toISOString(),
        dialogue_flags: JSON.stringify({ greeted: true, offered_credit: true }),
        topics_discussed: JSON.stringify(['cyberware', 'boxing']),
        secrets_revealed: JSON.stringify([]),
        favors_owed: JSON.stringify([{ type: 'credit', amount: 5000 }]),
        quests_given: JSON.stringify(['quest-first-chrome']),
        quests_completed: JSON.stringify(['quest-first-chrome']),
        memories_of_player: JSON.stringify([
          { memory: 'Helped with first implant', timestamp: new Date().toISOString(), outcome: 'positive' },
        ]),
        witnessed_events: JSON.stringify([]),
        grudges: JSON.stringify([]),
        gratitudes: JSON.stringify([{ reason: 'paid debt early', weight: 2 }]),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'inst-wakako-save1',
        npc_definition_id: 'npc-wakako',
        save_id: 'save-1',
        is_alive: 1,
        is_active: 1,
        current_health: 50,
        current_location_id: 'loc-market',
        current_activity: 'business',
        relationship_with_player: 10,
        trust_level: 15,
        fear_level: 0,
        respect_level: 25,
        romantic_interest: 0,
        times_met: 3,
        last_interaction: new Date(Date.now() - 172800000).toISOString(),
        dialogue_flags: JSON.stringify({ greeted: true }),
        topics_discussed: JSON.stringify(['jobs']),
        secrets_revealed: JSON.stringify([]),
        favors_owed: JSON.stringify([]),
        quests_given: JSON.stringify(['quest-market-trouble']),
        quests_completed: JSON.stringify([]),
        memories_of_player: JSON.stringify([]),
        witnessed_events: JSON.stringify([]),
        grudges: JSON.stringify([]),
        gratitudes: JSON.stringify([]),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  });

  // ===========================================================================
  // NPC DEFINITION ENDPOINTS
  // ===========================================================================

  describe('GET /api/npcs - List NPC Definitions', () => {
    it('should return all NPC definitions with pagination', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.npcs).toHaveLength(5);
      expect(json.data.pagination.total).toBe(5);
    });

    it('should filter by NPC type', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs?type=ENEMY'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.npcs).toHaveLength(1);
      expect(json.data.npcs[0].code).toBe('ARASAKA_GUARD');
    });

    it('should filter by vendor status', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs?isVendor=true'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.npcs).toHaveLength(2); // Viktor and Chen Wei
      expect(json.data.npcs.every((n: { services: { isVendor: boolean } }) => n.services.isVendor)).toBe(true);
    });

    it('should filter by quest giver status', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs?isQuestGiver=true'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.npcs).toHaveLength(2); // Viktor and Wakako
    });

    it('should filter by unique status', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs?isUnique=true'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.npcs).toHaveLength(3); // Viktor, Wakako, Coach Fred (guard is not unique)
      expect(json.data.npcs.every((n: { classification: { isUnique: boolean } }) => n.classification.isUnique)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs?limit=2&offset=0'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.npcs).toHaveLength(2);
      expect(json.data.pagination.hasMore).toBe(true);
    });
  });

  describe('GET /api/npcs/vendors - List Vendors', () => {
    it('should return all vendor NPCs', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/vendors'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.vendors).toHaveLength(2);
      expect(json.data.vendors.every((v: { services: { isVendor: boolean } }) => v.services.isVendor)).toBe(true);
    });

    it('should filter vendors by location', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/vendors?locationId=loc-clinic'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.vendors).toHaveLength(1);
      expect(json.data.vendors[0].code).toBe('VIKTOR_VEKTOR');
    });
  });

  describe('GET /api/npcs/quest-givers - List Quest Givers', () => {
    it('should return all quest giver NPCs', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/quest-givers'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.questGivers).toHaveLength(2);
      expect(json.data.questGivers.every((q: { services: { isQuestGiver: boolean } }) => q.services.isQuestGiver)).toBe(true);
    });

    it('should include available quests info', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/quest-givers'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      const viktor = json.data.questGivers.find((q: { code: string }) => q.code === 'VIKTOR_VEKTOR');
      expect(viktor.questInfo.availableQuests).toContain('quest-first-chrome');
    });
  });

  describe('GET /api/npcs/trainers - List Trainers', () => {
    it('should return all trainer NPCs', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/trainers'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.trainers).toHaveLength(1);
      expect(json.data.trainers[0].code).toBe('BOXING_TRAINER');
    });

    it('should include trainable skills info', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/trainers'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.trainers[0].trainerInfo.trainableSkills).toHaveLength(2);
      expect(json.data.trainers[0].trainerInfo.trainableSkills[0].skillId).toBe('skill-melee');
    });

    it('should filter trainers by skill', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/trainers?skillId=skill-athletics'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.trainers).toHaveLength(1);
    });
  });

  describe('GET /api/npcs/by-location/:locationId - NPCs by Location', () => {
    it('should return NPCs at a location', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/by-location/loc-clinic'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.locationId).toBe('loc-clinic');
      expect(json.data.npcs).toHaveLength(1);
      expect(json.data.npcs[0].code).toBe('VIKTOR_VEKTOR');
    });

    it('should identify location role (resident/worker)', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/by-location/loc-market'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      const wakako = json.data.npcs.find((n: { code: string }) => n.code === 'WAKAKO_OKADA');
      expect(wakako.locationRole).toBe('resident'); // home_location_id = loc-market
    });
  });

  describe('GET /api/npcs/by-faction/:factionId - NPCs by Faction', () => {
    it('should return NPCs in a faction', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/by-faction/faction-arasaka'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.factionId).toBe('faction-arasaka');
      expect(json.data.npcs).toHaveLength(1);
      expect(json.data.npcs[0].code).toBe('ARASAKA_GUARD');
    });

    it('should group by rank', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/by-faction/faction-arasaka'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.byRank).toHaveProperty('Security');
      expect(json.data.byRank['Security']).toHaveLength(1);
    });
  });

  describe('GET /api/npcs/:id - Get NPC Definition', () => {
    it('should return NPC by ID', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/npc-viktor'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe('npc-viktor');
      expect(json.data.code).toBe('VIKTOR_VEKTOR');
      expect(json.data.name).toBe('Viktor Vektor');
    });

    it('should return NPC by code', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/VIKTOR_VEKTOR'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.code).toBe('VIKTOR_VEKTOR');
    });

    it('should return 404 for unknown NPC', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/npc-unknown'),
        env
      );
      expect(res.status).toBe(404);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(false);
      expect(json.errors[0].code).toBe('NOT_FOUND');
    });

    it('should include formatted nested data', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/npc-viktor'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.appearance.gender).toBe('male');
      expect(json.data.personality.traits).toContain('calm');
      expect(json.data.services.isVendor).toBe(true);
      expect(json.data.combat.capable).toBe(true);
    });

    it('should include location details', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/npc-viktor'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.locationDetails.home).toBeDefined();
      expect(json.data.locationDetails.home.code).toBe('RIPPERDOC_CLINIC');
    });
  });

  // ===========================================================================
  // NPC INSTANCE ENDPOINTS
  // ===========================================================================

  describe('POST /api/npcs/:id/spawn - Spawn NPC Instance', () => {
    it('should create a new NPC instance', async () => {
      const res = await app.fetch(
        createTestRequest('POST', '/api/npcs/npc-vendor-1/spawn', {
          body: { saveId: 'save-2', locationId: 'loc-market' },
        }),
        env
      );
      expect(res.status).toBe(201);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.definitionId).toBe('npc-vendor-1');
      expect(json.data.saveId).toBe('save-2');
      expect(json.data.state.currentLocationId).toBe('loc-market');
    });

    it('should use default location from definition', async () => {
      const res = await app.fetch(
        createTestRequest('POST', '/api/npcs/npc-viktor/spawn', {
          body: { saveId: 'save-3' },
        }),
        env
      );
      expect(res.status).toBe(201);

      const json = await parseJsonResponse(res);
      expect(json.data.state.currentLocationId).toBe('loc-clinic');
    });

    it('should spawn by code', async () => {
      const res = await app.fetch(
        createTestRequest('POST', '/api/npcs/BOXING_TRAINER/spawn', {
          body: { saveId: 'save-2' },
        }),
        env
      );
      expect(res.status).toBe(201);

      const json = await parseJsonResponse(res);
      expect(json.data.definition.code).toBe('BOXING_TRAINER');
    });

    it('should prevent duplicate instances for same save', async () => {
      const res = await app.fetch(
        createTestRequest('POST', '/api/npcs/npc-viktor/spawn', {
          body: { saveId: 'save-1' },
        }),
        env
      );
      expect(res.status).toBe(409);

      const json = await parseJsonResponse(res);
      expect(json.errors[0].code).toBe('ALREADY_EXISTS');
    });

    it('should return 404 for unknown definition', async () => {
      const res = await app.fetch(
        createTestRequest('POST', '/api/npcs/npc-unknown/spawn', {
          body: { saveId: 'save-1' },
        }),
        env
      );
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/npcs/instances - List NPC Instances', () => {
    it('should return all NPC instances', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/instances'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.instances).toHaveLength(2);
    });

    it('should filter by save ID', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/instances?saveId=save-1'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.instances).toHaveLength(2);
      expect(json.data.instances.every((i: { saveId: string }) => i.saveId === 'save-1')).toBe(true);
    });

    it('should filter by location', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/instances?locationId=loc-clinic'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.instances).toHaveLength(1);
      expect(json.data.instances[0].definition.code).toBe('VIKTOR_VEKTOR');
    });

    it('should filter by alive status', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/instances?isAlive=true'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.instances.every((i: { state: { isAlive: boolean } }) => i.state.isAlive)).toBe(true);
    });

    it('should include basic definition info', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/instances'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.instances[0].definition).toBeDefined();
      expect(json.data.instances[0].definition.name).toBeDefined();
    });
  });

  describe('GET /api/npcs/instances/at-location/:locationId - Instances at Location', () => {
    it('should return active instances at location', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/instances/at-location/loc-clinic'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.locationId).toBe('loc-clinic');
      expect(json.data.npcs).toHaveLength(1);
      expect(json.data.npcs[0].code).toBe('VIKTOR_VEKTOR');
    });

    it('should filter by save ID', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/instances/at-location/loc-clinic?saveId=save-1'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.npcs).toHaveLength(1);
    });

    it('should include service info for location', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/instances/at-location/loc-clinic'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.npcs[0].services.isVendor).toBe(true);
    });
  });

  describe('GET /api/npcs/instances/:instanceId - Get Instance Details', () => {
    it('should return instance with full state', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/instances/inst-viktor-save1'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe('inst-viktor-save1');
      expect(json.data.relationship.overall).toBe(25);
      expect(json.data.relationship.timesMet).toBe(5);
    });

    it('should include memory and dialogue data', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/instances/inst-viktor-save1'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.dialogue.topicsDiscussed).toContain('cyberware');
      expect(json.data.memory.memoriesOfPlayer).toHaveLength(1);
    });

    it('should include full definition', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/instances/inst-viktor-save1'),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.fullDefinition).toBeDefined();
      expect(json.data.fullDefinition.name).toBe('Viktor Vektor');
    });

    it('should return 404 for unknown instance', async () => {
      const res = await app.fetch(
        createTestRequest('GET', '/api/npcs/instances/inst-unknown'),
        env
      );
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/npcs/instances/:instanceId - Update Instance', () => {
    it('should update location', async () => {
      const res = await app.fetch(
        createTestRequest('PATCH', '/api/npcs/instances/inst-viktor-save1', {
          body: { currentLocationId: 'loc-downtown' },
        }),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.state.currentLocationId).toBe('loc-downtown');
    });

    it('should update activity', async () => {
      const res = await app.fetch(
        createTestRequest('PATCH', '/api/npcs/instances/inst-viktor-save1', {
          body: { currentActivity: 'resting' },
        }),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.state.currentActivity).toBe('resting');
    });

    it('should apply relationship changes', async () => {
      const res = await app.fetch(
        createTestRequest('PATCH', '/api/npcs/instances/inst-viktor-save1', {
          body: { relationshipChange: 10, trustChange: 5 },
        }),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.relationship.overall).toBe(35); // 25 + 10
      expect(json.data.relationship.trust).toBe(35); // 30 + 5
    });

    it('should clamp relationship values', async () => {
      const res = await app.fetch(
        createTestRequest('PATCH', '/api/npcs/instances/inst-viktor-save1', {
          body: { relationshipChange: 200 },
        }),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.relationship.overall).toBe(100); // clamped to max
    });

    it('should update alive status', async () => {
      const res = await app.fetch(
        createTestRequest('PATCH', '/api/npcs/instances/inst-viktor-save1', {
          body: { isAlive: false },
        }),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.state.isAlive).toBe(false);
    });

    it('should return 400 for empty updates', async () => {
      const res = await app.fetch(
        createTestRequest('PATCH', '/api/npcs/instances/inst-viktor-save1', {
          body: {},
        }),
        env
      );
      expect(res.status).toBe(400);

      const json = await parseJsonResponse(res);
      expect(json.errors[0].code).toBe('NO_UPDATES');
    });
  });

  describe('POST /api/npcs/instances/:instanceId/interact - Record Interaction', () => {
    it('should record a positive interaction', async () => {
      const res = await app.fetch(
        createTestRequest('POST', '/api/npcs/instances/inst-viktor-save1/interact', {
          body: {
            interactionType: 'conversation',
            outcome: 'positive',
            topicDiscussed: 'surgery',
          },
        }),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.success).toBe(true);
      expect(json.data.interaction.type).toBe('conversation');
      expect(json.data.interaction.outcome).toBe('positive');
      expect(json.data.changes.relationship.change).toBe(5); // default positive impact
    });

    it('should update times met', async () => {
      const res = await app.fetch(
        createTestRequest('POST', '/api/npcs/instances/inst-viktor-save1/interact', {
          body: {
            interactionType: 'greeting',
          },
        }),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.changes.timesMet).toBe(6); // was 5, now 6
    });

    it('should add topics discussed', async () => {
      const res = await app.fetch(
        createTestRequest('POST', '/api/npcs/instances/inst-viktor-save1/interact', {
          body: {
            interactionType: 'conversation',
            topicDiscussed: 'augments',
          },
        }),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.newTopics).toContain('augments');
    });

    it('should add secrets revealed', async () => {
      const res = await app.fetch(
        createTestRequest('POST', '/api/npcs/instances/inst-viktor-save1/interact', {
          body: {
            interactionType: 'deep_conversation',
            secretRevealed: 'viktor_past',
            outcome: 'positive',
          },
        }),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.newSecrets).toContain('viktor_past');
    });

    it('should add memories', async () => {
      const res = await app.fetch(
        createTestRequest('POST', '/api/npcs/instances/inst-viktor-save1/interact', {
          body: {
            interactionType: 'help',
            memory: 'Helped fix equipment',
            outcome: 'positive',
          },
        }),
        env
      );
      expect(res.status).toBe(200);

      // Verify memory was added by getting instance
      const getRes = await app.fetch(
        createTestRequest('GET', '/api/npcs/instances/inst-viktor-save1'),
        env
      );
      const getJson = await parseJsonResponse(getRes);
      expect(getJson.data.memory.memoriesOfPlayer.some((m: { memory: string }) => m.memory === 'Helped fix equipment')).toBe(true);
    });

    it('should apply custom relationship impacts', async () => {
      const res = await app.fetch(
        createTestRequest('POST', '/api/npcs/instances/inst-viktor-save1/interact', {
          body: {
            interactionType: 'favor',
            relationshipImpact: 15,
            trustImpact: 10,
            respectImpact: 5,
          },
        }),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.changes.relationship.change).toBe(15);
      expect(json.data.changes.trust.change).toBe(10);
      expect(json.data.changes.respect.change).toBe(5);
    });

    it('should apply negative impact for negative outcome', async () => {
      const res = await app.fetch(
        createTestRequest('POST', '/api/npcs/instances/inst-wakako-save1/interact', {
          body: {
            interactionType: 'argument',
            outcome: 'negative',
          },
        }),
        env
      );
      expect(res.status).toBe(200);

      const json = await parseJsonResponse(res);
      expect(json.data.changes.relationship.change).toBe(-5);
    });

    it('should require interactionType', async () => {
      const res = await app.fetch(
        createTestRequest('POST', '/api/npcs/instances/inst-viktor-save1/interact', {
          body: { outcome: 'positive' },
        }),
        env
      );
      expect(res.status).toBe(400);

      const json = await parseJsonResponse(res);
      expect(json.errors[0].code).toBe('MISSING_TYPE');
    });

    it('should prevent interaction with dead NPC', async () => {
      // First kill the NPC
      await app.fetch(
        createTestRequest('PATCH', '/api/npcs/instances/inst-viktor-save1', {
          body: { isAlive: false },
        }),
        env
      );

      // Try to interact
      const res = await app.fetch(
        createTestRequest('POST', '/api/npcs/instances/inst-viktor-save1/interact', {
          body: { interactionType: 'greeting' },
        }),
        env
      );
      expect(res.status).toBe(400);

      const json = await parseJsonResponse(res);
      expect(json.errors[0].code).toBe('NPC_DEAD');
    });
  });
});
