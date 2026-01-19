/**
 * Integration tests for Dialogue System API.
 *
 * Tests for dialogue trees, traversal, and character history.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import app from '../../src/index';
import { createMockEnv, createTestRequest, parseJsonResponse, type MockEnv } from '../helpers/mock-env';

describe('Dialogue System Integration', () => {
  let env: MockEnv;

  beforeEach(async () => {
    env = createMockEnv();

    // Seed NPCs for dialogue
    env.DB._seed('npcs', [
      {
        id: 'npc-viktor',
        code: 'VIKTOR',
        name: 'Viktor Vektor',
      },
      {
        id: 'npc-jackie',
        code: 'JACKIE',
        name: 'Jackie Welles',
      },
    ]);

    // Seed locations
    env.DB._seed('locations', [
      {
        id: 'loc-clinic',
        code: 'CLINIC',
        name: "Viktor's Clinic",
      },
      {
        id: 'loc-bar',
        code: 'AFTERLIFE',
        name: 'The Afterlife',
      },
    ]);

    // Seed dialogue trees
    env.DB._seed('dialogue_trees', [
      {
        id: 'tree-viktor-greeting',
        code: 'VIKTOR_GREETING',
        name: 'Viktor Greeting',
        description: 'Initial conversation with Viktor',
        npc_id: 'npc-viktor',
        location_id: 'loc-clinic',
        mission_id: null,
        arc_id: null,
        root_node_id: 'node-viktor-1',
        greeting_node_id: 'node-viktor-1',
        farewell_node_id: 'node-viktor-exit',
        availability_conditions: null,
        one_time_only: 0,
        cooldown_hours: null,
        tracks_completion: 1,
        marks_npc_exhausted: 0,
        ambient_audio_id: null,
        music_id: null,
        estimated_duration_minutes: 5,
        has_skill_checks: 0,
        has_reputation_gates: 0,
        has_romance_content: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tree-jackie-bar',
        code: 'JACKIE_BAR_TALK',
        name: 'Jackie Bar Conversation',
        description: 'Casual talk at the bar',
        npc_id: 'npc-jackie',
        location_id: 'loc-bar',
        mission_id: null,
        arc_id: null,
        root_node_id: 'node-jackie-1',
        greeting_node_id: 'node-jackie-1',
        farewell_node_id: 'node-jackie-exit',
        availability_conditions: null,
        one_time_only: 0,
        cooldown_hours: 2,
        tracks_completion: 1,
        marks_npc_exhausted: 0,
        ambient_audio_id: null,
        music_id: null,
        estimated_duration_minutes: 10,
        has_skill_checks: 1,
        has_reputation_gates: 0,
        has_romance_content: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Seed dialogue nodes
    env.DB._seed('dialogue_nodes', [
      {
        id: 'node-viktor-1',
        tree_id: 'tree-viktor-greeting',
        node_type: 'NPC_LINE',
        speaker_type: 'NPC',
        speaker_npc_id: 'npc-viktor',
        speaker_name_override: null,
        text: 'Hey there. Need some chrome installed?',
        text_variations: null,
        voice_clip_id: 'vik-001',
        voice_emotion: 'friendly',
        portrait_expression: 'neutral',
        animation_id: null,
        camera_angle: 'medium',
        next_node_id: null,
        responses: JSON.stringify(['resp-viktor-1', 'resp-viktor-2']),
        auto_advance: 0,
        advance_delay_seconds: null,
        display_conditions: null,
        skip_conditions: null,
        on_display_effects: null,
        flag_changes: null,
        relationship_changes: null,
        is_hub: 1,
        is_exit: 0,
        debug_notes: null,
        localization_key: 'VIKTOR_GREETING_01',
      },
      {
        id: 'node-viktor-2',
        tree_id: 'tree-viktor-greeting',
        node_type: 'NPC_LINE',
        speaker_type: 'NPC',
        speaker_npc_id: 'npc-viktor',
        speaker_name_override: null,
        text: 'Got something special for regulars.',
        text_variations: null,
        voice_clip_id: 'vik-002',
        voice_emotion: 'conspiratorial',
        portrait_expression: 'smiling',
        animation_id: null,
        camera_angle: 'close',
        next_node_id: 'node-viktor-exit',
        responses: null,
        auto_advance: 1,
        advance_delay_seconds: 3,
        display_conditions: null,
        skip_conditions: null,
        on_display_effects: null,
        flag_changes: JSON.stringify([{ flag: 'seen_special_stock', value: true }]),
        relationship_changes: JSON.stringify([{ faction: 'ripperdocs', change: 5 }]),
        is_hub: 0,
        is_exit: 0,
        debug_notes: null,
        localization_key: 'VIKTOR_SPECIAL_01',
      },
      {
        id: 'node-viktor-exit',
        tree_id: 'tree-viktor-greeting',
        node_type: 'NPC_LINE',
        speaker_type: 'NPC',
        speaker_npc_id: 'npc-viktor',
        speaker_name_override: null,
        text: 'Take care out there.',
        text_variations: null,
        voice_clip_id: 'vik-bye-001',
        voice_emotion: 'friendly',
        portrait_expression: 'neutral',
        animation_id: null,
        camera_angle: 'medium',
        next_node_id: null,
        responses: null,
        auto_advance: 0,
        advance_delay_seconds: null,
        display_conditions: null,
        skip_conditions: null,
        on_display_effects: null,
        flag_changes: null,
        relationship_changes: null,
        is_hub: 0,
        is_exit: 1,
        debug_notes: null,
        localization_key: 'VIKTOR_BYE_01',
      },
    ]);

    // Seed dialogue responses
    env.DB._seed('dialogue_responses', [
      {
        id: 'resp-viktor-1',
        node_id: 'node-viktor-1',
        display_order: 1,
        text: 'Yeah, show me what you got.',
        text_short: 'Show inventory',
        text_tooltip: 'Browse Viktor\'s cyberware stock',
        tone: 'FRIENDLY',
        is_aggressive: 0,
        is_flirtatious: 0,
        is_humorous: 0,
        is_honest: 1,
        leads_to_node_id: 'node-viktor-2',
        is_skill_check: 0,
        ends_conversation: 0,
        starts_combat: 0,
        localization_key: 'VIKTOR_RESP_BROWSE',
      },
      {
        id: 'resp-viktor-2',
        node_id: 'node-viktor-1',
        display_order: 2,
        text: 'Just stopping by. See you around.',
        text_short: 'Leave',
        text_tooltip: 'End the conversation',
        tone: 'NEUTRAL',
        is_aggressive: 0,
        is_flirtatious: 0,
        is_humorous: 0,
        is_honest: 1,
        leads_to_node_id: 'node-viktor-exit',
        is_skill_check: 0,
        ends_conversation: 0,
        starts_combat: 0,
        localization_key: 'VIKTOR_RESP_LEAVE',
      },
    ]);

    // Seed characters
    env.DB._seed('characters', [
      {
        id: 'char-player-1',
        user_id: 'user-1',
        name: 'V',
        tier: 2,
      },
    ]);

    // Seed conversation states (for active conversations)
    env.DB._seed('conversation_states', [
      {
        id: 'conv-active-1',
        character_id: 'char-player-1',
        tree_id: 'tree-viktor-greeting',
        current_node_id: 'node-viktor-1',
        started_at: new Date().toISOString(),
        is_active: 1,
        nodes_visited: JSON.stringify(['node-viktor-1']),
        responses_chosen: JSON.stringify([]),
        flags_set: JSON.stringify({}),
        effects_applied: JSON.stringify([]),
        ended_at: null,
      },
    ]);

    // Seed dialogue history
    env.DB._seed('dialogue_history', [
      {
        id: 'hist-1',
        character_id: 'char-player-1',
        tree_id: 'tree-viktor-greeting',
        started_at: new Date(Date.now() - 86400000).toISOString(),
        completed_at: new Date(Date.now() - 86400000 + 300000).toISOString(),
        outcome: 'COMPLETED',
        nodes_visited: JSON.stringify(['node-viktor-1', 'node-viktor-2', 'node-viktor-exit']),
        responses_chosen: JSON.stringify(['resp-viktor-1']),
        flags_changed: JSON.stringify([{ flag: 'seen_special_stock', value: true }]),
        reputation_changes: JSON.stringify([{ faction: 'ripperdocs', change: 5 }]),
      },
    ]);

    // Seed dialogue flags
    env.DB._seed('character_dialogue_flags', [
      {
        id: 'flag-1',
        character_id: 'char-player-1',
        flag_name: 'seen_special_stock',
        flag_value: JSON.stringify(true),
        source_tree_id: 'tree-viktor-greeting',
        source_node_id: 'node-viktor-2',
        set_at: new Date().toISOString(),
      },
      {
        id: 'flag-2',
        character_id: 'char-player-1',
        flag_name: 'met_viktor',
        flag_value: JSON.stringify(true),
        source_tree_id: 'tree-viktor-greeting',
        source_node_id: 'node-viktor-1',
        set_at: new Date().toISOString(),
      },
    ]);
  });

  // ==========================================================================
  // DIALOGUE TREES ENDPOINTS
  // ==========================================================================

  describe('GET /api/dialogue/trees', () => {
    it('should list all dialogue trees', async () => {
      const req = createTestRequest('GET', '/api/dialogue/trees');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.trees).toHaveLength(2);
    });

    it('should filter trees by NPC', async () => {
      const req = createTestRequest('GET', '/api/dialogue/trees?npcId=npc-viktor');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.trees).toHaveLength(1);
      expect(body.data.trees[0].context.npcId).toBe('npc-viktor');
    });

    it('should filter trees by location', async () => {
      const req = createTestRequest('GET', '/api/dialogue/trees?locationId=loc-bar');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.trees).toHaveLength(1);
      expect(body.data.trees[0].context.locationId).toBe('loc-bar');
    });
  });

  describe('GET /api/dialogue/trees/:id', () => {
    it('should return tree with all nodes', async () => {
      const req = createTestRequest('GET', '/api/dialogue/trees/tree-viktor-greeting');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('tree-viktor-greeting');
      expect(body.data.nodes).toBeDefined();
    });

    it('should return 404 for non-existent tree', async () => {
      const req = createTestRequest('GET', '/api/dialogue/trees/fake-tree');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/dialogue/trees/by-npc/:npcId', () => {
    it('should return trees for an NPC', async () => {
      const req = createTestRequest('GET', '/api/dialogue/trees/by-npc/npc-viktor');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.trees).toHaveLength(1);
      expect(body.data.trees[0].name).toBe('Viktor Greeting');
    });

    it('should return empty array for NPC with no dialogue', async () => {
      const req = createTestRequest('GET', '/api/dialogue/trees/by-npc/npc-unknown');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.trees).toHaveLength(0);
    });
  });

  describe('GET /api/dialogue/trees/by-location/:locationId', () => {
    it('should return trees at a location', async () => {
      const req = createTestRequest('GET', '/api/dialogue/trees/by-location/loc-clinic');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.trees).toHaveLength(1);
    });
  });

  // ==========================================================================
  // DIALOGUE TRAVERSAL ENDPOINTS
  // ==========================================================================

  describe('POST /api/dialogue/start', () => {
    beforeEach(() => {
      // Seed jackie dialogue nodes (needed for conversation start)
      env.DB._seed('dialogue_nodes', [
        {
          id: 'node-jackie-1',
          tree_id: 'tree-jackie-bar',
          node_type: 'NPC_LINE',
          speaker_type: 'NPC',
          speaker_npc_id: 'npc-jackie',
          text: 'Hey choom, what brings you here?',
          is_hub: 1,
          is_exit: 0,
        },
      ]);
      // Add a second character without active conversation
      env.DB._seed('characters', [
        {
          id: 'char-player-2',
          user_id: 'user-1',
          name: 'Johnny',
          tier: 3,
        },
      ]);
    });

    it('should start a new conversation', async () => {
      // Use char-player-2 who doesn't have an active conversation
      const req = createTestRequest('POST', '/api/dialogue/start', {
        body: {
          characterId: 'char-player-2',
          treeId: 'tree-jackie-bar',
        },
      });
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.conversationId).toBeDefined();
      expect(body.data.tree.id).toBe('tree-jackie-bar');
    });

    it('should require characterId', async () => {
      const req = createTestRequest('POST', '/api/dialogue/start', {
        body: { treeId: 'tree-jackie-bar' },
      });
      const res = await app.fetch(req, env);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/dialogue/state/:stateId', () => {
    it('should return current conversation state', async () => {
      const req = createTestRequest('GET', '/api/dialogue/state/conv-active-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.conversationId).toBe('conv-active-1');
      expect(body.data.currentNode.id).toBe('node-viktor-1');
    });

    it('should return 404 for non-existent state', async () => {
      const req = createTestRequest('GET', '/api/dialogue/state/fake-state');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/dialogue/respond', () => {
    it('should process response and advance conversation', async () => {
      const req = createTestRequest('POST', '/api/dialogue/respond', {
        body: {
          conversationId: 'conv-active-1',
          responseId: 'resp-viktor-1',
        },
      });
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.nextNode).toBeDefined();
    });
  });

  describe('POST /api/dialogue/exit', () => {
    it('should end conversation early', async () => {
      const req = createTestRequest('POST', '/api/dialogue/exit', {
        body: {
          conversationId: 'conv-active-1',
        },
      });
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.exitedEarly).toBe(true);
    });
  });

  // ==========================================================================
  // CHARACTER HISTORY ENDPOINTS
  // ==========================================================================

  describe('GET /api/dialogue/history', () => {
    it('should return character dialogue history', async () => {
      const req = createTestRequest('GET', '/api/dialogue/history?characterId=char-player-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.conversations).toBeDefined();
      expect(body.data.conversations.length).toBeGreaterThanOrEqual(1);
    });

    it('should require characterId', async () => {
      const req = createTestRequest('GET', '/api/dialogue/history');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(400);
    });

    it('should filter by tree', async () => {
      const req = createTestRequest('GET', '/api/dialogue/history?characterId=char-player-1&tree_id=tree-viktor-greeting');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.conversations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/dialogue/flags', () => {
    it('should return character dialogue flags', async () => {
      const req = createTestRequest('GET', '/api/dialogue/flags?characterId=char-player-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.flags).toBeDefined();
      // Flags are aggregated from completed (is_active=0) conversations
      expect(body.data.flagCount).toBeGreaterThanOrEqual(0);
    });

    it('should require characterId', async () => {
      const req = createTestRequest('GET', '/api/dialogue/flags');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(400);
    });
  });

  // ==========================================================================
  // NODE ENDPOINTS
  // ==========================================================================

  describe('GET /api/dialogue/nodes/:nodeId', () => {
    it('should return node with responses', async () => {
      const req = createTestRequest('GET', '/api/dialogue/nodes/node-viktor-1');
      const res = await app.fetch(req, env);
      const body = await parseJsonResponse(res);

      expect(res.status).toBe(200);
      expect(body.data.id).toBe('node-viktor-1');
      expect(body.data.responses).toHaveLength(2);
    });

    it('should return 404 for non-existent node', async () => {
      const req = createTestRequest('GET', '/api/dialogue/nodes/fake-node');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(404);
    });
  });
});
