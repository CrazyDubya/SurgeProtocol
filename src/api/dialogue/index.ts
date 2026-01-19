/**
 * Surge Protocol - Dialogue System Routes
 *
 * Endpoints:
 *
 * Dialogue Trees:
 * - GET /dialogue/trees - List dialogue trees with filtering
 * - GET /dialogue/trees/:id - Get tree with all nodes
 * - GET /dialogue/trees/by-npc/:npcId - Get trees for an NPC
 * - GET /dialogue/trees/by-location/:locationId - Get trees at location
 *
 * Dialogue Traversal:
 * - POST /dialogue/start - Start a conversation
 * - GET /dialogue/state/:stateId - Get current conversation state
 * - POST /dialogue/respond - Choose a response option
 * - POST /dialogue/exit - End conversation
 *
 * Character History:
 * - GET /dialogue/history - Get character's dialogue history
 * - GET /dialogue/flags - Get dialogue flags for character
 */

import { Hono } from 'hono';
import type { AuthVariables } from '../../middleware/auth';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

interface DialogueTree {
  id: string;
  code: string;
  name: string;
  description: string | null;
  npc_id: string | null;
  location_id: string | null;
  mission_id: string | null;
  arc_id: string | null;
  root_node_id: string | null;
  greeting_node_id: string | null;
  farewell_node_id: string | null;
  availability_conditions: string | null;
  one_time_only: number;
  cooldown_hours: number | null;
  tracks_completion: number;
  marks_npc_exhausted: number;
  ambient_audio_id: string | null;
  music_id: string | null;
  estimated_duration_minutes: number | null;
  has_skill_checks: number;
  has_reputation_gates: number;
  has_romance_content: number;
  created_at: string;
  updated_at: string;
}

interface DialogueNode {
  id: string;
  tree_id: string;
  node_type: string;
  speaker_type: string | null;
  speaker_npc_id: string | null;
  speaker_name_override: string | null;
  text: string | null;
  text_variations: string | null;
  voice_clip_id: string | null;
  voice_emotion: string | null;
  portrait_expression: string | null;
  animation_id: string | null;
  camera_angle: string | null;
  next_node_id: string | null;
  responses: string | null;
  auto_advance: number;
  advance_delay_seconds: number | null;
  display_conditions: string | null;
  skip_conditions: string | null;
  on_display_effects: string | null;
  flag_changes: string | null;
  relationship_changes: string | null;
  is_hub: number;
  is_exit: number;
  debug_notes: string | null;
  localization_key: string | null;
}

interface DialogueResponse {
  id: string;
  node_id: string;
  display_order: number;
  text: string;
  text_short: string | null;
  text_tooltip: string | null;
  tone: string | null;
  is_aggressive: number;
  is_flirtatious: number;
  is_humorous: number;
  is_honest: number;
  display_conditions: string | null;
  greyed_conditions: string | null;
  locked_reason_text: string | null;
  required_skill: string | null;
  required_skill_level: number | null;
  required_attribute: string | null;
  required_attribute_level: number | null;
  required_item: string | null;
  required_credits: number | null;
  required_reputation: string | null;
  required_flags: string | null;
  is_skill_check: number;
  skill_check_skill: string | null;
  skill_check_difficulty: number | null;
  skill_check_hidden: number;
  success_node_id: string | null;
  failure_node_id: string | null;
  leads_to_node_id: string | null;
  ends_conversation: number;
  starts_combat: number;
  triggers_event_id: string | null;
  relationship_change: number | null;
  reputation_changes: string | null;
  flag_changes: string | null;
  grants_items: string | null;
  removes_items: string | null;
  grants_xp: number | null;
  grants_credits: number | null;
  is_lie: number;
  lie_consequences: string | null;
  is_bribe: number;
  bribe_amount: number | null;
  is_intimidation: number;
  is_seduction: number;
  has_voice_line: number;
}

interface ConversationState {
  id: string;
  character_id: string;
  tree_id: string;
  current_node_id: string;
  started_at: string;
  nodes_visited: string;
  responses_chosen: string;
  flags_set: string;
  effects_applied: string;
  is_active: number;
  ended_at: string | null;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatDialogueTree(tree: DialogueTree) {
  return {
    id: tree.id,
    code: tree.code,
    name: tree.name,
    description: tree.description,
    context: {
      npcId: tree.npc_id,
      locationId: tree.location_id,
      missionId: tree.mission_id,
      arcId: tree.arc_id,
    },
    structure: {
      rootNodeId: tree.root_node_id,
      greetingNodeId: tree.greeting_node_id,
      farewellNodeId: tree.farewell_node_id,
    },
    availability: {
      conditions: tree.availability_conditions ? JSON.parse(tree.availability_conditions) : null,
      oneTimeOnly: tree.one_time_only === 1,
      cooldownHours: tree.cooldown_hours,
    },
    behavior: {
      tracksCompletion: tree.tracks_completion === 1,
      marksNpcExhausted: tree.marks_npc_exhausted === 1,
    },
    audio: {
      ambientAudioId: tree.ambient_audio_id,
      musicId: tree.music_id,
    },
    meta: {
      estimatedDurationMinutes: tree.estimated_duration_minutes,
      hasSkillChecks: tree.has_skill_checks === 1,
      hasReputationGates: tree.has_reputation_gates === 1,
      hasRomanceContent: tree.has_romance_content === 1,
    },
  };
}

function formatDialogueNode(node: DialogueNode) {
  return {
    id: node.id,
    treeId: node.tree_id,
    nodeType: node.node_type,
    speaker: {
      type: node.speaker_type,
      npcId: node.speaker_npc_id,
      nameOverride: node.speaker_name_override,
    },
    content: {
      text: node.text,
      textVariations: node.text_variations ? JSON.parse(node.text_variations) : [],
      voiceClipId: node.voice_clip_id,
      voiceEmotion: node.voice_emotion,
    },
    display: {
      portraitExpression: node.portrait_expression,
      animationId: node.animation_id,
      cameraAngle: node.camera_angle,
    },
    flow: {
      nextNodeId: node.next_node_id,
      autoAdvance: node.auto_advance === 1,
      advanceDelaySeconds: node.advance_delay_seconds,
      isHub: node.is_hub === 1,
      isExit: node.is_exit === 1,
    },
    conditions: {
      display: node.display_conditions ? JSON.parse(node.display_conditions) : null,
      skip: node.skip_conditions ? JSON.parse(node.skip_conditions) : null,
    },
    effects: {
      onDisplay: node.on_display_effects ? JSON.parse(node.on_display_effects) : null,
      flagChanges: node.flag_changes ? JSON.parse(node.flag_changes) : null,
      relationshipChanges: node.relationship_changes ? JSON.parse(node.relationship_changes) : null,
    },
  };
}

function formatDialogueResponse(response: DialogueResponse) {
  return {
    id: response.id,
    nodeId: response.node_id,
    displayOrder: response.display_order,
    text: {
      full: response.text,
      short: response.text_short,
      tooltip: response.text_tooltip,
    },
    style: {
      tone: response.tone,
      isAggressive: response.is_aggressive === 1,
      isFlirtatious: response.is_flirtatious === 1,
      isHumorous: response.is_humorous === 1,
      isHonest: response.is_honest === 1,
    },
    conditions: {
      display: response.display_conditions ? JSON.parse(response.display_conditions) : null,
      greyed: response.greyed_conditions ? JSON.parse(response.greyed_conditions) : null,
      lockedReasonText: response.locked_reason_text,
    },
    requirements: {
      skill: response.required_skill,
      skillLevel: response.required_skill_level,
      attribute: response.required_attribute,
      attributeLevel: response.required_attribute_level,
      item: response.required_item,
      credits: response.required_credits,
      reputation: response.required_reputation ? JSON.parse(response.required_reputation) : null,
      flags: response.required_flags ? JSON.parse(response.required_flags) : null,
    },
    skillCheck: response.is_skill_check === 1 ? {
      skill: response.skill_check_skill,
      difficulty: response.skill_check_difficulty,
      hidden: response.skill_check_hidden === 1,
      successNodeId: response.success_node_id,
      failureNodeId: response.failure_node_id,
    } : null,
    destination: {
      leadsToNodeId: response.leads_to_node_id,
      endsConversation: response.ends_conversation === 1,
      startsCombat: response.starts_combat === 1,
      triggersEventId: response.triggers_event_id,
    },
    effects: {
      relationshipChange: response.relationship_change,
      reputationChanges: response.reputation_changes ? JSON.parse(response.reputation_changes) : null,
      flagChanges: response.flag_changes ? JSON.parse(response.flag_changes) : null,
      grantsItems: response.grants_items ? JSON.parse(response.grants_items) : null,
      removesItems: response.removes_items ? JSON.parse(response.removes_items) : null,
      grantsXp: response.grants_xp,
      grantsCredits: response.grants_credits,
    },
    special: {
      isLie: response.is_lie === 1,
      lieConsequences: response.lie_consequences ? JSON.parse(response.lie_consequences) : null,
      isBribe: response.is_bribe === 1,
      bribeAmount: response.bribe_amount,
      isIntimidation: response.is_intimidation === 1,
      isSeduction: response.is_seduction === 1,
      hasVoiceLine: response.has_voice_line === 1,
    },
  };
}

// =============================================================================
// ROUTES
// =============================================================================

export const dialogueRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// =============================================================================
// DIALOGUE TREE ENDPOINTS
// =============================================================================

/**
 * GET /dialogue/trees
 * List dialogue trees with filtering.
 */
dialogueRoutes.get('/trees', async (c) => {
  const db = c.env.DB;
  const npcId = c.req.query('npcId');
  const locationId = c.req.query('locationId');
  const missionId = c.req.query('missionId');
  const hasSkillChecks = c.req.query('hasSkillChecks');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  let sql = `SELECT * FROM dialogue_trees WHERE 1=1`;
  const params: unknown[] = [];

  if (npcId) {
    sql += ` AND npc_id = ?`;
    params.push(npcId);
  }

  if (locationId) {
    sql += ` AND location_id = ?`;
    params.push(locationId);
  }

  if (missionId) {
    sql += ` AND mission_id = ?`;
    params.push(missionId);
  }

  if (hasSkillChecks === 'true') {
    sql += ` AND has_skill_checks = 1`;
  }

  sql += ` ORDER BY name ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<DialogueTree>();

  const trees = result.results.map(formatDialogueTree);

  // Get total count
  let countSql = `SELECT COUNT(*) as total FROM dialogue_trees WHERE 1=1`;
  const countParams: unknown[] = [];

  if (npcId) {
    countSql += ` AND npc_id = ?`;
    countParams.push(npcId);
  }
  if (locationId) {
    countSql += ` AND location_id = ?`;
    countParams.push(locationId);
  }
  if (missionId) {
    countSql += ` AND mission_id = ?`;
    countParams.push(missionId);
  }
  if (hasSkillChecks === 'true') {
    countSql += ` AND has_skill_checks = 1`;
  }

  const countResult = await db
    .prepare(countSql)
    .bind(...countParams)
    .first<{ total: number }>();

  return c.json({
    success: true,
    data: {
      trees,
      pagination: {
        total: countResult?.total || 0,
        limit,
        offset,
        hasMore: offset + trees.length < (countResult?.total || 0),
      },
    },
  });
});

/**
 * GET /dialogue/trees/by-npc/:npcId
 * Get all dialogue trees for a specific NPC.
 */
dialogueRoutes.get('/trees/by-npc/:npcId', async (c) => {
  const db = c.env.DB;
  const npcId = c.req.param('npcId');

  const result = await db
    .prepare(`SELECT * FROM dialogue_trees WHERE npc_id = ? ORDER BY name ASC`)
    .bind(npcId)
    .all<DialogueTree>();

  const trees = result.results.map(formatDialogueTree);

  // Get NPC info
  const npc = await db
    .prepare(`SELECT id, code, name FROM npc_definitions WHERE id = ?`)
    .bind(npcId)
    .first<{ id: string; code: string; name: string }>();

  return c.json({
    success: true,
    data: {
      npc,
      trees,
      count: trees.length,
    },
  });
});

/**
 * GET /dialogue/trees/by-location/:locationId
 * Get all dialogue trees at a specific location.
 */
dialogueRoutes.get('/trees/by-location/:locationId', async (c) => {
  const db = c.env.DB;
  const locationId = c.req.param('locationId');

  const result = await db
    .prepare(`SELECT * FROM dialogue_trees WHERE location_id = ? ORDER BY name ASC`)
    .bind(locationId)
    .all<DialogueTree>();

  const trees = result.results.map(formatDialogueTree);

  return c.json({
    success: true,
    data: {
      locationId,
      trees,
      count: trees.length,
    },
  });
});

/**
 * GET /dialogue/trees/:id
 * Get a dialogue tree with all its nodes and responses.
 */
dialogueRoutes.get('/trees/:id', async (c) => {
  const db = c.env.DB;
  const treeId = c.req.param('id');

  // Get tree by ID or code
  let tree = await db
    .prepare(`SELECT * FROM dialogue_trees WHERE id = ?`)
    .bind(treeId)
    .first<DialogueTree>();

  if (!tree) {
    tree = await db
      .prepare(`SELECT * FROM dialogue_trees WHERE code = ?`)
      .bind(treeId)
      .first<DialogueTree>();
  }

  if (!tree) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Dialogue tree not found' }],
    }, 404);
  }

  // Get all nodes for this tree
  const nodesResult = await db
    .prepare(`SELECT * FROM dialogue_nodes WHERE tree_id = ?`)
    .bind(tree.id)
    .all<DialogueNode>();

  const nodes = nodesResult.results.map(formatDialogueNode);

  // Get all responses for all nodes
  const nodeIds = nodesResult.results.map(n => n.id);
  let responses: ReturnType<typeof formatDialogueResponse>[] = [];

  if (nodeIds.length > 0) {
    // Build response query for all nodes
    const placeholders = nodeIds.map(() => '?').join(',');
    const responsesResult = await db
      .prepare(`SELECT * FROM dialogue_responses WHERE node_id IN (${placeholders}) ORDER BY display_order ASC`)
      .bind(...nodeIds)
      .all<DialogueResponse>();

    responses = responsesResult.results.map(formatDialogueResponse);
  }

  // Get NPC info if applicable
  let npc = null;
  if (tree.npc_id) {
    npc = await db
      .prepare(`SELECT id, code, name, title, portrait_asset FROM npc_definitions WHERE id = ?`)
      .bind(tree.npc_id)
      .first();
  }

  return c.json({
    success: true,
    data: {
      ...formatDialogueTree(tree),
      npc,
      nodes,
      responses,
      nodeCount: nodes.length,
      responseCount: responses.length,
    },
  });
});

// =============================================================================
// CONVERSATION STATE ENDPOINTS
// =============================================================================

/**
 * POST /dialogue/start
 * Start a new conversation.
 */
dialogueRoutes.post('/start', async (c) => {
  const db = c.env.DB;

  let body: {
    characterId: string;
    treeId: string;
    npcInstanceId?: string;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_JSON', message: 'Invalid JSON body' }],
    }, 400);
  }

  const { characterId, treeId, npcInstanceId } = body;

  if (!characterId || !treeId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_FIELDS', message: 'characterId and treeId are required' }],
    }, 400);
  }

  // Get tree by ID or code
  let tree = await db
    .prepare(`SELECT * FROM dialogue_trees WHERE id = ?`)
    .bind(treeId)
    .first<DialogueTree>();

  if (!tree) {
    tree = await db
      .prepare(`SELECT * FROM dialogue_trees WHERE code = ?`)
      .bind(treeId)
      .first<DialogueTree>();
  }

  if (!tree) {
    return c.json({
      success: false,
      errors: [{ code: 'TREE_NOT_FOUND', message: 'Dialogue tree not found' }],
    }, 404);
  }

  // Check for existing active conversation
  const existingConvo = await db
    .prepare(`SELECT id FROM conversation_states WHERE character_id = ? AND is_active = 1`)
    .bind(characterId)
    .first();

  if (existingConvo) {
    return c.json({
      success: false,
      errors: [{ code: 'CONVERSATION_ACTIVE', message: 'Character already has an active conversation' }],
    }, 409);
  }

  // Determine starting node
  const startNodeId = tree.greeting_node_id || tree.root_node_id;

  if (!startNodeId) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_START_NODE', message: 'Dialogue tree has no starting node' }],
    }, 400);
  }

  // Get the starting node
  const startNode = await db
    .prepare(`SELECT * FROM dialogue_nodes WHERE id = ?`)
    .bind(startNodeId)
    .first<DialogueNode>();

  if (!startNode) {
    return c.json({
      success: false,
      errors: [{ code: 'START_NODE_NOT_FOUND', message: 'Starting node not found' }],
    }, 500);
  }

  // Create conversation state
  const stateId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  await db
    .prepare(`INSERT INTO conversation_states (
      id, character_id, tree_id, current_node_id, started_at,
      nodes_visited, responses_chosen, flags_set, effects_applied, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`)
    .bind(
      stateId,
      characterId,
      tree.id,
      startNodeId,
      now,
      JSON.stringify([startNodeId]),
      JSON.stringify([]),
      JSON.stringify({}),
      JSON.stringify([])
    )
    .run();

  // Get responses for the starting node
  const responsesResult = await db
    .prepare(`SELECT * FROM dialogue_responses WHERE node_id = ? ORDER BY display_order ASC`)
    .bind(startNodeId)
    .all<DialogueResponse>();

  const responses = responsesResult.results.map(formatDialogueResponse);

  // Update NPC instance last interaction if provided
  if (npcInstanceId) {
    await db
      .prepare(`UPDATE npc_instances SET last_interaction = ? WHERE id = ?`)
      .bind(now, npcInstanceId)
      .run();
  }

  return c.json({
    success: true,
    data: {
      conversationId: stateId,
      tree: formatDialogueTree(tree),
      currentNode: formatDialogueNode(startNode),
      availableResponses: responses,
      startedAt: now,
    },
  }, 201);
});

/**
 * GET /dialogue/state/:stateId
 * Get current conversation state.
 */
dialogueRoutes.get('/state/:stateId', async (c) => {
  const db = c.env.DB;
  const stateId = c.req.param('stateId');

  const state = await db
    .prepare(`SELECT * FROM conversation_states WHERE id = ?`)
    .bind(stateId)
    .first<ConversationState>();

  if (!state) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Conversation not found' }],
    }, 404);
  }

  // Get tree and current node
  const tree = await db
    .prepare(`SELECT * FROM dialogue_trees WHERE id = ?`)
    .bind(state.tree_id)
    .first<DialogueTree>();

  const currentNode = await db
    .prepare(`SELECT * FROM dialogue_nodes WHERE id = ?`)
    .bind(state.current_node_id)
    .first<DialogueNode>();

  // Get responses for current node
  let responses: ReturnType<typeof formatDialogueResponse>[] = [];
  if (currentNode) {
    const responsesResult = await db
      .prepare(`SELECT * FROM dialogue_responses WHERE node_id = ? ORDER BY display_order ASC`)
      .bind(currentNode.id)
      .all<DialogueResponse>();

    responses = responsesResult.results.map(formatDialogueResponse);
  }

  return c.json({
    success: true,
    data: {
      conversationId: state.id,
      isActive: state.is_active === 1,
      tree: tree ? formatDialogueTree(tree) : null,
      currentNode: currentNode ? formatDialogueNode(currentNode) : null,
      availableResponses: responses,
      history: {
        nodesVisited: JSON.parse(state.nodes_visited || '[]'),
        responsesChosen: JSON.parse(state.responses_chosen || '[]'),
        flagsSet: JSON.parse(state.flags_set || '{}'),
        effectsApplied: JSON.parse(state.effects_applied || '[]'),
      },
      startedAt: state.started_at,
      endedAt: state.ended_at,
    },
  });
});

/**
 * POST /dialogue/respond
 * Choose a response in a conversation.
 */
dialogueRoutes.post('/respond', async (c) => {
  const db = c.env.DB;

  let body: {
    conversationId: string;
    responseId: string;
    skillCheckResult?: 'success' | 'failure';
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_JSON', message: 'Invalid JSON body' }],
    }, 400);
  }

  const { conversationId, responseId, skillCheckResult } = body;

  if (!conversationId || !responseId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_FIELDS', message: 'conversationId and responseId are required' }],
    }, 400);
  }

  // Get conversation state
  const state = await db
    .prepare(`SELECT * FROM conversation_states WHERE id = ?`)
    .bind(conversationId)
    .first<ConversationState>();

  if (!state) {
    return c.json({
      success: false,
      errors: [{ code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found' }],
    }, 404);
  }

  if (state.is_active !== 1) {
    return c.json({
      success: false,
      errors: [{ code: 'CONVERSATION_ENDED', message: 'Conversation has already ended' }],
    }, 400);
  }

  // Get the chosen response
  const response = await db
    .prepare(`SELECT * FROM dialogue_responses WHERE id = ?`)
    .bind(responseId)
    .first<DialogueResponse>();

  if (!response) {
    return c.json({
      success: false,
      errors: [{ code: 'RESPONSE_NOT_FOUND', message: 'Response not found' }],
    }, 404);
  }

  // Verify response belongs to current node
  if (response.node_id !== state.current_node_id) {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_RESPONSE', message: 'Response does not belong to current node' }],
    }, 400);
  }

  // Determine next node
  let nextNodeId: string | null = null;

  if (response.is_skill_check === 1 && skillCheckResult) {
    // Handle skill check result
    nextNodeId = skillCheckResult === 'success'
      ? response.success_node_id
      : response.failure_node_id;
  } else {
    nextNodeId = response.leads_to_node_id;
  }

  // Track effects to apply
  const effects: unknown[] = [];

  // Parse current state
  const nodesVisited = JSON.parse(state.nodes_visited || '[]');
  const responsesChosen = JSON.parse(state.responses_chosen || '[]');
  const flagsSet = JSON.parse(state.flags_set || '{}');
  const effectsApplied = JSON.parse(state.effects_applied || '[]');

  // Add response to history
  responsesChosen.push({
    responseId: response.id,
    text: response.text,
    timestamp: new Date().toISOString(),
  });

  // Apply flag changes
  if (response.flag_changes) {
    const changes = JSON.parse(response.flag_changes);
    Object.assign(flagsSet, changes);
    effects.push({ type: 'flags', changes });
  }

  // Track other effects
  if (response.relationship_change) {
    effects.push({ type: 'relationship', change: response.relationship_change });
  }
  if (response.grants_xp) {
    effects.push({ type: 'xp', amount: response.grants_xp });
  }
  if (response.grants_credits) {
    effects.push({ type: 'credits', amount: response.grants_credits });
  }

  effectsApplied.push(...effects);

  // Handle conversation end
  const conversationEnds = response.ends_conversation === 1 || !nextNodeId;
  const now = new Date().toISOString();

  let nextNode = null;
  let nextResponses: ReturnType<typeof formatDialogueResponse>[] = [];

  if (!conversationEnds && nextNodeId) {
    // Get next node
    nextNode = await db
      .prepare(`SELECT * FROM dialogue_nodes WHERE id = ?`)
      .bind(nextNodeId)
      .first<DialogueNode>();

    if (nextNode) {
      nodesVisited.push(nextNodeId);

      // Get responses for next node
      const responsesResult = await db
        .prepare(`SELECT * FROM dialogue_responses WHERE node_id = ? ORDER BY display_order ASC`)
        .bind(nextNodeId)
        .all<DialogueResponse>();

      nextResponses = responsesResult.results.map(formatDialogueResponse);
    }
  }

  // Update conversation state
  await db
    .prepare(`UPDATE conversation_states SET
      current_node_id = ?,
      nodes_visited = ?,
      responses_chosen = ?,
      flags_set = ?,
      effects_applied = ?,
      is_active = ?,
      ended_at = ?
     WHERE id = ?`)
    .bind(
      conversationEnds ? state.current_node_id : nextNodeId,
      JSON.stringify(nodesVisited),
      JSON.stringify(responsesChosen),
      JSON.stringify(flagsSet),
      JSON.stringify(effectsApplied),
      conversationEnds ? 0 : 1,
      conversationEnds ? now : null,
      conversationId
    )
    .run();

  return c.json({
    success: true,
    data: {
      conversationId,
      responseChosen: formatDialogueResponse(response),
      effects,
      conversationEnded: conversationEnds,
      startsCombat: response.starts_combat === 1,
      triggersEventId: response.triggers_event_id,
      nextNode: nextNode ? formatDialogueNode(nextNode) : null,
      availableResponses: nextResponses,
    },
  });
});

/**
 * POST /dialogue/exit
 * End a conversation early.
 */
dialogueRoutes.post('/exit', async (c) => {
  const db = c.env.DB;

  let body: { conversationId: string };

  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      errors: [{ code: 'INVALID_JSON', message: 'Invalid JSON body' }],
    }, 400);
  }

  const { conversationId } = body;

  if (!conversationId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_FIELDS', message: 'conversationId is required' }],
    }, 400);
  }

  const state = await db
    .prepare(`SELECT * FROM conversation_states WHERE id = ?`)
    .bind(conversationId)
    .first<ConversationState>();

  if (!state) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Conversation not found' }],
    }, 404);
  }

  if (state.is_active !== 1) {
    return c.json({
      success: false,
      errors: [{ code: 'ALREADY_ENDED', message: 'Conversation already ended' }],
    }, 400);
  }

  const now = new Date().toISOString();

  await db
    .prepare(`UPDATE conversation_states SET is_active = 0, ended_at = ? WHERE id = ?`)
    .bind(now, conversationId)
    .run();

  return c.json({
    success: true,
    data: {
      conversationId,
      endedAt: now,
      exitedEarly: true,
    },
  });
});

// =============================================================================
// CHARACTER HISTORY ENDPOINTS
// =============================================================================

/**
 * GET /dialogue/history
 * Get character's dialogue history.
 */
dialogueRoutes.get('/history', async (c) => {
  const db = c.env.DB;
  const characterId = c.req.query('characterId');
  const limit = parseInt(c.req.query('limit') || '20');

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_CHARACTER', message: 'characterId query param is required' }],
    }, 400);
  }

  const result = await db
    .prepare(`
      SELECT cs.*, dt.name as tree_name, dt.code as tree_code
      FROM conversation_states cs
      JOIN dialogue_trees dt ON cs.tree_id = dt.id
      WHERE cs.character_id = ?
      ORDER BY cs.started_at DESC
      LIMIT ?
    `)
    .bind(characterId, limit)
    .all<ConversationState & { tree_name: string; tree_code: string }>();

  const conversations = result.results.map(conv => ({
    id: conv.id,
    tree: {
      id: conv.tree_id,
      code: conv.tree_code,
      name: conv.tree_name,
    },
    isActive: conv.is_active === 1,
    nodesVisited: JSON.parse(conv.nodes_visited || '[]').length,
    responsesChosen: JSON.parse(conv.responses_chosen || '[]').length,
    flagsSet: JSON.parse(conv.flags_set || '{}'),
    startedAt: conv.started_at,
    endedAt: conv.ended_at,
  }));

  return c.json({
    success: true,
    data: {
      characterId,
      conversations,
      count: conversations.length,
    },
  });
});

/**
 * GET /dialogue/flags
 * Get aggregated dialogue flags for a character.
 */
dialogueRoutes.get('/flags', async (c) => {
  const db = c.env.DB;
  const characterId = c.req.query('characterId');

  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_CHARACTER', message: 'characterId query param is required' }],
    }, 400);
  }

  // Get all completed conversations and aggregate flags
  const result = await db
    .prepare(`
      SELECT flags_set FROM conversation_states
      WHERE character_id = ? AND is_active = 0
    `)
    .bind(characterId)
    .all<{ flags_set: string }>();

  // Merge all flags
  const allFlags: Record<string, unknown> = {};
  for (const conv of result.results) {
    const flags = JSON.parse(conv.flags_set || '{}');
    Object.assign(allFlags, flags);
  }

  return c.json({
    success: true,
    data: {
      characterId,
      flags: allFlags,
      flagCount: Object.keys(allFlags).length,
    },
  });
});

/**
 * GET /dialogue/nodes/:nodeId
 * Get a specific dialogue node with its responses.
 */
dialogueRoutes.get('/nodes/:nodeId', async (c) => {
  const db = c.env.DB;
  const nodeId = c.req.param('nodeId');

  const node = await db
    .prepare(`SELECT * FROM dialogue_nodes WHERE id = ?`)
    .bind(nodeId)
    .first<DialogueNode>();

  if (!node) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Dialogue node not found' }],
    }, 404);
  }

  // Get responses for this node
  const responsesResult = await db
    .prepare(`SELECT * FROM dialogue_responses WHERE node_id = ? ORDER BY display_order ASC`)
    .bind(nodeId)
    .all<DialogueResponse>();

  const responses = responsesResult.results.map(formatDialogueResponse);

  return c.json({
    success: true,
    data: {
      ...formatDialogueNode(node),
      responses,
    },
  });
});
