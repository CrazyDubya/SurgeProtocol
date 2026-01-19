/**
 * Surge Protocol - Story & Narrative System Routes
 *
 * Endpoints:
 *
 * Story Arcs:
 * - GET /story/arcs - List story arcs with filtering
 * - GET /story/arcs/:id - Get arc with chapters
 * - GET /story/arcs/main - Get main story arc
 *
 * Chapters:
 * - GET /story/chapters - List chapters with filtering
 * - GET /story/chapters/:id - Get chapter details
 * - GET /story/arcs/:arcId/chapters - Get chapters for an arc
 *
 * Narrative Events:
 * - GET /story/events - List narrative events
 * - GET /story/events/:id - Get event details
 * - GET /story/events/pending - Get pending events for character
 * - POST /story/events/:id/trigger - Trigger a narrative event
 * - POST /story/events/:id/complete - Mark event as completed
 *
 * Story Flags:
 * - GET /story/flags - List flag definitions
 * - GET /story/flags/character - Get character's story flags
 * - POST /story/flags/character - Set a story flag
 *
 * Character Story State:
 * - GET /story/progress - Get character's story progress
 * - POST /story/progress/advance - Advance to next chapter
 * - POST /story/progress/complete-arc - Complete a story arc
 * - GET /story/progress/endings - Get available endings
 */

import { Hono } from 'hono';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

interface StoryArc {
  id: string;
  code: string;
  name: string;
  description: string | null;
  arc_type: string;
  is_main_story: number;
  is_repeatable: number;
  chapters: string | null;
  parallel_arcs: string | null;
  prerequisite_arcs: string | null;
  mutually_exclusive_arcs: string | null;
  protagonist_npcs: string | null;
  antagonist_npcs: string | null;
  supporting_npcs: string | null;
  themes: string | null;
  tone: string | null;
  moral_questions: string | null;
  possible_endings: string | null;
  default_ending_id: string | null;
  estimated_playtime_hours: number | null;
  difficulty_rating: number;
  player_agency_level: number;
  created_at: string;
  updated_at: string;
}

interface StoryChapter {
  id: string;
  arc_id: string;
  sequence_order: number;
  name: string;
  description: string | null;
  missions: string | null;
  parallel_missions: string | null;
  optional_missions: string | null;
  unlock_conditions: string | null;
  auto_start: number;
  start_event_id: string | null;
  completion_conditions: string | null;
  completion_event_id: string | null;
  rewards: string | null;
  branch_points: string | null;
  variations: string | null;
  estimated_time_minutes: number | null;
  has_point_of_no_return: number;
  point_of_no_return_warning: string | null;
  chapter_summary_text: string | null;
  recap_dialogue_id: string | null;
  end_chapter_cutscene_id: string | null;
  created_at: string;
  updated_at: string;
}

interface NarrativeEvent {
  id: string;
  code: string;
  name: string;
  description: string | null;
  event_type: string;
  priority: number;
  is_skippable: number;
  is_repeatable: number;
  trigger_type: string | null;
  trigger_conditions: string | null;
  trigger_location_id: string | null;
  trigger_time: string | null;
  dialogue_tree_id: string | null;
  cutscene_id: string | null;
  animation_sequence: string | null;
  ambient_event: number;
  required_npcs: string | null;
  optional_npcs: string | null;
  spawns_npcs: string | null;
  state_changes: string | null;
  flag_sets: string | null;
  unlocks_content: string | null;
  reputation_changes: string | null;
  item_grants: string | null;
  relationship_changes: string | null;
  choices: string | null;
  default_choice: string | null;
  timeout_choice: string | null;
  timeout_seconds: number | null;
  background_music_id: string | null;
  ambient_audio_id: string | null;
  weather_override: string | null;
  time_override: string | null;
  created_at: string;
  updated_at: string;
}

interface StoryFlag {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  flag_type: string;
  default_value: string | null;
  is_global: number;
  arc_specific: string | null;
  mission_specific: string | null;
  persists_after_arc: number;
  resets_on_new_game: number;
  triggers_events: string | null;
  unlocks_dialogue: string | null;
  unlocks_missions: string | null;
  affects_ending: number;
  created_at: string;
}

interface CharacterStoryState {
  id: string;
  character_id: string;
  current_main_arc_id: string | null;
  current_main_chapter_id: string | null;
  completed_arcs: string | null;
  active_arcs: string | null;
  failed_arcs: string | null;
  story_flags: string | null;
  permanent_flags: string | null;
  major_choices_made: string | null;
  pending_consequences: string | null;
  endings_seen: string | null;
  current_ending_track: string | null;
  ending_points: string | null;
  story_completion_percent: number;
  total_story_choices: number;
  time_in_story_content_hours: number;
  cutscenes_watched: string | null;
  cutscenes_skipped: string | null;
  created_at: string;
  updated_at: string;
}

interface CharacterEventHistory {
  id: string;
  character_id: string;
  event_id: string;
  triggered_at: string;
  completed_at: string | null;
  choice_made: string | null;
  outcome: string | null;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatStoryArc(arc: StoryArc) {
  return {
    id: arc.id,
    code: arc.code,
    name: arc.name,
    description: arc.description,
    type: {
      arcType: arc.arc_type,
      isMainStory: arc.is_main_story === 1,
      isRepeatable: arc.is_repeatable === 1,
    },
    structure: {
      chapters: arc.chapters ? JSON.parse(arc.chapters) : [],
      parallelArcs: arc.parallel_arcs ? JSON.parse(arc.parallel_arcs) : [],
      prerequisiteArcs: arc.prerequisite_arcs ? JSON.parse(arc.prerequisite_arcs) : [],
      mutuallyExclusiveArcs: arc.mutually_exclusive_arcs ? JSON.parse(arc.mutually_exclusive_arcs) : [],
    },
    characters: {
      protagonists: arc.protagonist_npcs ? JSON.parse(arc.protagonist_npcs) : [],
      antagonists: arc.antagonist_npcs ? JSON.parse(arc.antagonist_npcs) : [],
      supporting: arc.supporting_npcs ? JSON.parse(arc.supporting_npcs) : [],
    },
    narrative: {
      themes: arc.themes ? JSON.parse(arc.themes) : [],
      tone: arc.tone,
      moralQuestions: arc.moral_questions ? JSON.parse(arc.moral_questions) : [],
    },
    endings: {
      possible: arc.possible_endings ? JSON.parse(arc.possible_endings) : [],
      defaultEndingId: arc.default_ending_id,
    },
    meta: {
      estimatedPlaytimeHours: arc.estimated_playtime_hours,
      difficultyRating: arc.difficulty_rating,
      playerAgencyLevel: arc.player_agency_level,
    },
  };
}

function formatChapter(chapter: StoryChapter) {
  return {
    id: chapter.id,
    arcId: chapter.arc_id,
    sequenceOrder: chapter.sequence_order,
    name: chapter.name,
    description: chapter.description,
    missions: {
      required: chapter.missions ? JSON.parse(chapter.missions) : [],
      parallel: chapter.parallel_missions ? JSON.parse(chapter.parallel_missions) : [],
      optional: chapter.optional_missions ? JSON.parse(chapter.optional_missions) : [],
    },
    triggers: {
      unlockConditions: chapter.unlock_conditions ? JSON.parse(chapter.unlock_conditions) : null,
      autoStart: chapter.auto_start === 1,
      startEventId: chapter.start_event_id,
    },
    completion: {
      conditions: chapter.completion_conditions ? JSON.parse(chapter.completion_conditions) : null,
      eventId: chapter.completion_event_id,
      rewards: chapter.rewards ? JSON.parse(chapter.rewards) : null,
    },
    branching: {
      branchPoints: chapter.branch_points ? JSON.parse(chapter.branch_points) : [],
      variations: chapter.variations ? JSON.parse(chapter.variations) : [],
    },
    pacing: {
      estimatedTimeMinutes: chapter.estimated_time_minutes,
      hasPointOfNoReturn: chapter.has_point_of_no_return === 1,
      pointOfNoReturnWarning: chapter.point_of_no_return_warning,
    },
    narrative: {
      summaryText: chapter.chapter_summary_text,
      recapDialogueId: chapter.recap_dialogue_id,
      endCutsceneId: chapter.end_chapter_cutscene_id,
    },
  };
}

function formatNarrativeEvent(event: NarrativeEvent) {
  return {
    id: event.id,
    code: event.code,
    name: event.name,
    description: event.description,
    type: {
      eventType: event.event_type,
      priority: event.priority,
      isSkippable: event.is_skippable === 1,
      isRepeatable: event.is_repeatable === 1,
      isAmbient: event.ambient_event === 1,
    },
    triggers: {
      type: event.trigger_type,
      conditions: event.trigger_conditions ? JSON.parse(event.trigger_conditions) : null,
      locationId: event.trigger_location_id,
      time: event.trigger_time ? JSON.parse(event.trigger_time) : null,
    },
    content: {
      dialogueTreeId: event.dialogue_tree_id,
      cutsceneId: event.cutscene_id,
      animationSequence: event.animation_sequence ? JSON.parse(event.animation_sequence) : null,
    },
    participants: {
      requiredNpcs: event.required_npcs ? JSON.parse(event.required_npcs) : [],
      optionalNpcs: event.optional_npcs ? JSON.parse(event.optional_npcs) : [],
      spawnsNpcs: event.spawns_npcs ? JSON.parse(event.spawns_npcs) : [],
    },
    consequences: {
      stateChanges: event.state_changes ? JSON.parse(event.state_changes) : null,
      flagSets: event.flag_sets ? JSON.parse(event.flag_sets) : null,
      unlocksContent: event.unlocks_content ? JSON.parse(event.unlocks_content) : null,
      reputationChanges: event.reputation_changes ? JSON.parse(event.reputation_changes) : null,
      itemGrants: event.item_grants ? JSON.parse(event.item_grants) : null,
      relationshipChanges: event.relationship_changes ? JSON.parse(event.relationship_changes) : null,
    },
    choices: {
      options: event.choices ? JSON.parse(event.choices) : null,
      defaultChoice: event.default_choice,
      timeoutChoice: event.timeout_choice,
      timeoutSeconds: event.timeout_seconds,
    },
    audioVisual: {
      backgroundMusicId: event.background_music_id,
      ambientAudioId: event.ambient_audio_id,
      weatherOverride: event.weather_override,
      timeOverride: event.time_override,
    },
  };
}

// =============================================================================
// ROUTER SETUP
// =============================================================================

export const storyRoutes = new Hono<{ Bindings: Bindings }>();

// =============================================================================
// STORY ARC ENDPOINTS
// =============================================================================

/**
 * GET /story/arcs
 * List story arcs with filtering
 */
storyRoutes.get('/arcs', async (c) => {
  const db = c.env.DB;
  const { arc_type, is_main_story } = c.req.query();

  let query = `SELECT * FROM story_arcs WHERE 1=1`;
  const params: (string | number)[] = [];

  if (arc_type) {
    query += ` AND arc_type = ?`;
    params.push(arc_type);
  }

  if (is_main_story !== undefined) {
    query += ` AND is_main_story = ?`;
    params.push(is_main_story === 'true' ? 1 : 0);
  }

  query += ` ORDER BY is_main_story DESC, estimated_playtime_hours DESC`;

  const results = await db.prepare(query).bind(...params).all<StoryArc>();

  return c.json({
    success: true,
    data: {
      arcs: (results.results || []).map(formatStoryArc),
      count: results.results?.length || 0,
    },
  });
});

/**
 * GET /story/arcs/main
 * Get the main story arc
 */
storyRoutes.get('/arcs/main', async (c) => {
  const db = c.env.DB;

  const arc = await db.prepare(`
    SELECT * FROM story_arcs WHERE is_main_story = 1 LIMIT 1
  `).first<StoryArc>();

  if (!arc) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Main story arc not found' }],
    }, 404);
  }

  // Get chapters for main arc
  const chapters = await db.prepare(`
    SELECT * FROM story_chapters WHERE arc_id = ? ORDER BY sequence_order ASC
  `).bind(arc.id).all<StoryChapter>();

  return c.json({
    success: true,
    data: {
      arc: formatStoryArc(arc),
      chapters: (chapters.results || []).map(formatChapter),
      totalChapters: chapters.results?.length || 0,
    },
  });
});

/**
 * GET /story/arcs/:id
 * Get arc with chapters
 */
storyRoutes.get('/arcs/:id', async (c) => {
  const arcId = c.req.param('id');
  const db = c.env.DB;

  // Try by ID first, then by code
  let arc = await db.prepare(`SELECT * FROM story_arcs WHERE id = ?`).bind(arcId).first<StoryArc>();

  if (!arc) {
    arc = await db.prepare(`SELECT * FROM story_arcs WHERE code = ?`).bind(arcId).first<StoryArc>();
  }

  if (!arc) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Story arc not found' }],
    }, 404);
  }

  // Get chapters
  const chapters = await db.prepare(`
    SELECT * FROM story_chapters WHERE arc_id = ? ORDER BY sequence_order ASC
  `).bind(arc.id).all<StoryChapter>();

  return c.json({
    success: true,
    data: {
      arc: formatStoryArc(arc),
      chapters: (chapters.results || []).map(formatChapter),
      totalChapters: chapters.results?.length || 0,
    },
  });
});

// =============================================================================
// CHAPTER ENDPOINTS
// =============================================================================

/**
 * GET /story/chapters
 * List chapters with filtering
 */
storyRoutes.get('/chapters', async (c) => {
  const db = c.env.DB;
  const { arc_id, has_point_of_no_return } = c.req.query();

  let query = `
    SELECT sc.*, sa.name as arc_name, sa.code as arc_code
    FROM story_chapters sc
    LEFT JOIN story_arcs sa ON sa.id = sc.arc_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (arc_id) {
    query += ` AND sc.arc_id = ?`;
    params.push(arc_id);
  }

  if (has_point_of_no_return !== undefined) {
    query += ` AND sc.has_point_of_no_return = ?`;
    params.push(has_point_of_no_return === 'true' ? 1 : 0);
  }

  query += ` ORDER BY sa.is_main_story DESC, sc.sequence_order ASC`;

  const results = await db.prepare(query).bind(...params).all<StoryChapter & { arc_name: string; arc_code: string }>();

  return c.json({
    success: true,
    data: {
      chapters: (results.results || []).map(ch => ({
        ...formatChapter(ch),
        arcName: ch.arc_name,
        arcCode: ch.arc_code,
      })),
      count: results.results?.length || 0,
    },
  });
});

/**
 * GET /story/arcs/:arcId/chapters
 * Get chapters for a specific arc
 */
storyRoutes.get('/arcs/:arcId/chapters', async (c) => {
  const arcId = c.req.param('arcId');
  const db = c.env.DB;

  const chapters = await db.prepare(`
    SELECT * FROM story_chapters WHERE arc_id = ? ORDER BY sequence_order ASC
  `).bind(arcId).all<StoryChapter>();

  return c.json({
    success: true,
    data: {
      arcId,
      chapters: (chapters.results || []).map(formatChapter),
      count: chapters.results?.length || 0,
    },
  });
});

/**
 * GET /story/chapters/:id
 * Get chapter details
 */
storyRoutes.get('/chapters/:id', async (c) => {
  const chapterId = c.req.param('id');
  const db = c.env.DB;

  const chapter = await db.prepare(`
    SELECT sc.*, sa.name as arc_name, sa.code as arc_code
    FROM story_chapters sc
    LEFT JOIN story_arcs sa ON sa.id = sc.arc_id
    WHERE sc.id = ?
  `).bind(chapterId).first<StoryChapter & { arc_name: string; arc_code: string }>();

  if (!chapter) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Chapter not found' }],
    }, 404);
  }

  // Get previous and next chapters
  const prevChapter = await db.prepare(`
    SELECT id, name, sequence_order FROM story_chapters
    WHERE arc_id = ? AND sequence_order < ?
    ORDER BY sequence_order DESC LIMIT 1
  `).bind(chapter.arc_id, chapter.sequence_order).first();

  const nextChapter = await db.prepare(`
    SELECT id, name, sequence_order FROM story_chapters
    WHERE arc_id = ? AND sequence_order > ?
    ORDER BY sequence_order ASC LIMIT 1
  `).bind(chapter.arc_id, chapter.sequence_order).first();

  return c.json({
    success: true,
    data: {
      chapter: {
        ...formatChapter(chapter),
        arcName: chapter.arc_name,
        arcCode: chapter.arc_code,
      },
      navigation: {
        previous: prevChapter,
        next: nextChapter,
      },
    },
  });
});

// =============================================================================
// NARRATIVE EVENT ENDPOINTS
// =============================================================================

/**
 * GET /story/events
 * List narrative events
 */
storyRoutes.get('/events', async (c) => {
  const db = c.env.DB;
  const { event_type, priority_min, is_skippable, limit, offset } = c.req.query();

  let query = `SELECT * FROM narrative_events WHERE 1=1`;
  const params: (string | number)[] = [];

  if (event_type) {
    query += ` AND event_type = ?`;
    params.push(event_type);
  }

  if (priority_min) {
    query += ` AND priority >= ?`;
    params.push(parseInt(priority_min, 10));
  }

  if (is_skippable !== undefined) {
    query += ` AND is_skippable = ?`;
    params.push(is_skippable === 'true' ? 1 : 0);
  }

  query += ` ORDER BY priority DESC`;
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit || '50', 10));
  params.push(parseInt(offset || '0', 10));

  const results = await db.prepare(query).bind(...params).all<NarrativeEvent>();

  return c.json({
    success: true,
    data: {
      events: (results.results || []).map(formatNarrativeEvent),
      count: results.results?.length || 0,
    },
  });
});

/**
 * GET /story/events/pending
 * Get pending narrative events for character
 */
storyRoutes.get('/events/pending', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId query parameter is required' }],
    }, 400);
  }

  const db = c.env.DB;

  // Get events that haven't been triggered for this character
  const results = await db.prepare(`
    SELECT ne.* FROM narrative_events ne
    WHERE ne.id NOT IN (
      SELECT event_id FROM character_event_history
      WHERE character_id = ? AND completed_at IS NOT NULL
    )
    AND (ne.is_repeatable = 1 OR ne.id NOT IN (
      SELECT event_id FROM character_event_history WHERE character_id = ?
    ))
    ORDER BY ne.priority DESC
    LIMIT 20
  `).bind(characterId, characterId).all<NarrativeEvent>();

  return c.json({
    success: true,
    data: {
      events: (results.results || []).map(formatNarrativeEvent),
      count: results.results?.length || 0,
    },
  });
});

/**
 * GET /story/events/:id
 * Get event details
 */
storyRoutes.get('/events/:id', async (c) => {
  const eventId = c.req.param('id');
  const db = c.env.DB;

  let event = await db.prepare(`SELECT * FROM narrative_events WHERE id = ?`).bind(eventId).first<NarrativeEvent>();

  if (!event) {
    event = await db.prepare(`SELECT * FROM narrative_events WHERE code = ?`).bind(eventId).first<NarrativeEvent>();
  }

  if (!event) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Narrative event not found' }],
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      event: formatNarrativeEvent(event),
    },
  });
});

/**
 * POST /story/events/:id/trigger
 * Trigger a narrative event
 */
storyRoutes.post('/events/:id/trigger', async (c) => {
  const eventId = c.req.param('id');
  const db = c.env.DB;
  const body = await c.req.json<{
    characterId: string;
    choiceMade?: string;
  }>();

  if (!body.characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId is required' }],
    }, 400);
  }

  // Get event
  const event = await db.prepare(`SELECT * FROM narrative_events WHERE id = ?`).bind(eventId).first<NarrativeEvent>();

  if (!event) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Event not found' }],
    }, 404);
  }

  // Check if already triggered (and not repeatable)
  if (event.is_repeatable === 0) {
    const existing = await db.prepare(`
      SELECT id FROM character_event_history
      WHERE character_id = ? AND event_id = ?
    `).bind(body.characterId, eventId).first();

    if (existing) {
      return c.json({
        success: false,
        errors: [{ code: 'ALREADY_TRIGGERED', message: 'Event already triggered and is not repeatable' }],
      }, 409);
    }
  }

  // Record event trigger
  const historyId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO character_event_history (
      id, character_id, event_id, triggered_at, choice_made
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(historyId, body.characterId, eventId, now, body.choiceMade || null).run();

  // Apply flag changes if any
  if (event.flag_sets) {
    const flags = JSON.parse(event.flag_sets);
    // Update character story state with new flags
    await db.prepare(`
      UPDATE character_story_state
      SET story_flags = json_patch(COALESCE(story_flags, '{}'), ?)
      WHERE character_id = ?
    `).bind(JSON.stringify(flags), body.characterId).run();
  }

  return c.json({
    success: true,
    data: {
      historyId,
      event: formatNarrativeEvent(event),
      triggeredAt: now,
      consequences: {
        flagsSet: event.flag_sets ? JSON.parse(event.flag_sets) : null,
        reputationChanges: event.reputation_changes ? JSON.parse(event.reputation_changes) : null,
        itemGrants: event.item_grants ? JSON.parse(event.item_grants) : null,
      },
    },
  }, 201);
});

/**
 * POST /story/events/:id/complete
 * Mark event as completed
 */
storyRoutes.post('/events/:id/complete', async (c) => {
  const eventId = c.req.param('id');
  const db = c.env.DB;
  const body = await c.req.json<{
    characterId: string;
    outcome?: string;
  }>();

  if (!body.characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId is required' }],
    }, 400);
  }

  // Find the triggered event
  const history = await db.prepare(`
    SELECT * FROM character_event_history
    WHERE character_id = ? AND event_id = ? AND completed_at IS NULL
    ORDER BY triggered_at DESC LIMIT 1
  `).bind(body.characterId, eventId).first<CharacterEventHistory>();

  if (!history) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'No pending event trigger found' }],
    }, 404);
  }

  const now = new Date().toISOString();

  await db.prepare(`
    UPDATE character_event_history
    SET completed_at = ?, outcome = ?
    WHERE id = ?
  `).bind(now, body.outcome || 'completed', history.id).run();

  return c.json({
    success: true,
    data: {
      message: 'Event completed',
      historyId: history.id,
      completedAt: now,
      outcome: body.outcome || 'completed',
    },
  });
});

// =============================================================================
// STORY FLAG ENDPOINTS
// =============================================================================

/**
 * GET /story/flags
 * List flag definitions
 */
storyRoutes.get('/flags', async (c) => {
  const db = c.env.DB;
  const { category, affects_ending, is_global } = c.req.query();

  let query = `SELECT * FROM story_flags WHERE 1=1`;
  const params: (string | number)[] = [];

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }

  if (affects_ending !== undefined) {
    query += ` AND affects_ending = ?`;
    params.push(affects_ending === 'true' ? 1 : 0);
  }

  if (is_global !== undefined) {
    query += ` AND is_global = ?`;
    params.push(is_global === 'true' ? 1 : 0);
  }

  query += ` ORDER BY category, code`;

  const results = await db.prepare(query).bind(...params).all<StoryFlag>();

  // Group by category
  const byCategory: Record<string, StoryFlag[]> = {};
  for (const flag of results.results || []) {
    const cat = flag.category || 'uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(flag);
  }

  return c.json({
    success: true,
    data: {
      flags: results.results || [],
      byCategory,
      count: results.results?.length || 0,
    },
  });
});

/**
 * GET /story/flags/character
 * Get character's story flags
 */
storyRoutes.get('/flags/character', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId query parameter is required' }],
    }, 400);
  }

  const db = c.env.DB;

  const state = await db.prepare(`
    SELECT story_flags, permanent_flags FROM character_story_state
    WHERE character_id = ?
  `).bind(characterId).first<{ story_flags: string | null; permanent_flags: string | null }>();

  const storyFlags = state?.story_flags ? JSON.parse(state.story_flags) : {};
  const permanentFlags = state?.permanent_flags ? JSON.parse(state.permanent_flags) : {};

  return c.json({
    success: true,
    data: {
      characterId,
      storyFlags,
      permanentFlags,
      totalFlags: Object.keys(storyFlags).length + Object.keys(permanentFlags).length,
    },
  });
});

/**
 * POST /story/flags/character
 * Set a story flag
 */
storyRoutes.post('/flags/character', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    characterId: string;
    flagCode: string;
    value: unknown;
    isPermanent?: boolean;
  }>();

  if (!body.characterId || !body.flagCode) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId and flagCode are required' }],
    }, 400);
  }

  // Verify flag exists
  const flagDef = await db.prepare(`SELECT * FROM story_flags WHERE code = ?`).bind(body.flagCode).first<StoryFlag>();

  if (!flagDef) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Flag definition not found' }],
    }, 404);
  }

  // Get or create character story state
  let state = await db.prepare(`
    SELECT * FROM character_story_state WHERE character_id = ?
  `).bind(body.characterId).first<CharacterStoryState>();

  if (!state) {
    const stateId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO character_story_state (id, character_id, story_flags, permanent_flags, story_completion_percent, total_story_choices, time_in_story_content_hours)
      VALUES (?, ?, '{}', '{}', 0, 0, 0)
    `).bind(stateId, body.characterId).run();

    state = await db.prepare(`SELECT * FROM character_story_state WHERE id = ?`).bind(stateId).first<CharacterStoryState>();
  }

  // Update the appropriate flags object
  const isPermanent = body.isPermanent || flagDef.persists_after_arc === 1;
  const flagsColumn = isPermanent ? 'permanent_flags' : 'story_flags';
  const currentFlags = isPermanent
    ? (state!.permanent_flags ? JSON.parse(state!.permanent_flags) : {})
    : (state!.story_flags ? JSON.parse(state!.story_flags) : {});

  currentFlags[body.flagCode] = body.value;

  await db.prepare(`
    UPDATE character_story_state SET ${flagsColumn} = ?, updated_at = datetime('now')
    WHERE character_id = ?
  `).bind(JSON.stringify(currentFlags), body.characterId).run();

  return c.json({
    success: true,
    data: {
      message: 'Flag set successfully',
      flagCode: body.flagCode,
      value: body.value,
      isPermanent,
      affectsEnding: flagDef.affects_ending === 1,
    },
  });
});

// =============================================================================
// CHARACTER STORY STATE ENDPOINTS
// =============================================================================

/**
 * GET /story/progress
 * Get character's story progress
 */
storyRoutes.get('/progress', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId query parameter is required' }],
    }, 400);
  }

  const db = c.env.DB;

  const state = await db.prepare(`
    SELECT css.*,
           sa.name as current_arc_name,
           sa.code as current_arc_code,
           sc.name as current_chapter_name,
           sc.sequence_order as current_chapter_order
    FROM character_story_state css
    LEFT JOIN story_arcs sa ON sa.id = css.current_main_arc_id
    LEFT JOIN story_chapters sc ON sc.id = css.current_main_chapter_id
    WHERE css.character_id = ?
  `).bind(characterId).first<CharacterStoryState & {
    current_arc_name: string | null;
    current_arc_code: string | null;
    current_chapter_name: string | null;
    current_chapter_order: number | null;
  }>();

  if (!state) {
    return c.json({
      success: true,
      data: {
        characterId,
        hasStarted: false,
        progress: null,
      },
    });
  }

  return c.json({
    success: true,
    data: {
      characterId,
      hasStarted: true,
      progress: {
        currentArc: state.current_main_arc_id ? {
          id: state.current_main_arc_id,
          name: state.current_arc_name,
          code: state.current_arc_code,
        } : null,
        currentChapter: state.current_main_chapter_id ? {
          id: state.current_main_chapter_id,
          name: state.current_chapter_name,
          order: state.current_chapter_order,
        } : null,
        completedArcs: state.completed_arcs ? JSON.parse(state.completed_arcs) : [],
        activeArcs: state.active_arcs ? JSON.parse(state.active_arcs) : [],
        failedArcs: state.failed_arcs ? JSON.parse(state.failed_arcs) : [],
        completionPercent: state.story_completion_percent,
        totalChoices: state.total_story_choices,
        playtimeHours: state.time_in_story_content_hours,
        currentEndingTrack: state.current_ending_track,
        endingPoints: state.ending_points ? JSON.parse(state.ending_points) : {},
      },
    },
  });
});

/**
 * POST /story/progress/advance
 * Advance to next chapter
 */
storyRoutes.post('/progress/advance', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    characterId: string;
    arcId?: string;
    chapterId?: string;
  }>();

  if (!body.characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId is required' }],
    }, 400);
  }

  // Get current state
  let state = await db.prepare(`
    SELECT * FROM character_story_state WHERE character_id = ?
  `).bind(body.characterId).first<CharacterStoryState>();

  // If starting fresh with explicit arc/chapter
  if (body.arcId || body.chapterId) {
    let arcId = body.arcId;
    let chapterId = body.chapterId;

    // If only arc provided, get first chapter
    if (arcId && !chapterId) {
      const firstChapter = await db.prepare(`
        SELECT id FROM story_chapters WHERE arc_id = ? ORDER BY sequence_order ASC LIMIT 1
      `).bind(arcId).first<{ id: string }>();
      chapterId = firstChapter?.id;
    }

    // If only chapter provided, get arc
    if (chapterId && !arcId) {
      const chapter = await db.prepare(`SELECT arc_id FROM story_chapters WHERE id = ?`).bind(chapterId).first<{ arc_id: string }>();
      arcId = chapter?.arc_id;
    }

    if (!state) {
      const stateId = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO character_story_state (
          id, character_id, current_main_arc_id, current_main_chapter_id,
          story_flags, permanent_flags, story_completion_percent, total_story_choices, time_in_story_content_hours
        ) VALUES (?, ?, ?, ?, '{}', '{}', 0, 0, 0)
      `).bind(stateId, body.characterId, arcId, chapterId).run();
    } else {
      await db.prepare(`
        UPDATE character_story_state
        SET current_main_arc_id = ?, current_main_chapter_id = ?, updated_at = datetime('now')
        WHERE character_id = ?
      `).bind(arcId, chapterId, body.characterId).run();
    }

    const chapter = await db.prepare(`SELECT * FROM story_chapters WHERE id = ?`).bind(chapterId).first<StoryChapter>();

    return c.json({
      success: true,
      data: {
        message: 'Story progress updated',
        newArcId: arcId,
        newChapterId: chapterId,
        chapter: chapter ? formatChapter(chapter) : null,
      },
    });
  }

  // Auto-advance to next chapter
  if (!state?.current_main_chapter_id) {
    return c.json({
      success: false,
      errors: [{ code: 'NO_CHAPTER', message: 'No current chapter to advance from' }],
    }, 400);
  }

  const currentChapter = await db.prepare(`
    SELECT arc_id, sequence_order FROM story_chapters WHERE id = ?
  `).bind(state.current_main_chapter_id).first<{ arc_id: string; sequence_order: number }>();

  const nextChapter = await db.prepare(`
    SELECT * FROM story_chapters
    WHERE arc_id = ? AND sequence_order > ?
    ORDER BY sequence_order ASC LIMIT 1
  `).bind(currentChapter!.arc_id, currentChapter!.sequence_order).first<StoryChapter>();

  if (!nextChapter) {
    return c.json({
      success: true,
      data: {
        message: 'No more chapters in this arc',
        arcComplete: true,
        arcId: currentChapter!.arc_id,
      },
    });
  }

  await db.prepare(`
    UPDATE character_story_state
    SET current_main_chapter_id = ?, updated_at = datetime('now')
    WHERE character_id = ?
  `).bind(nextChapter.id, body.characterId).run();

  return c.json({
    success: true,
    data: {
      message: 'Advanced to next chapter',
      newChapterId: nextChapter.id,
      chapter: formatChapter(nextChapter),
    },
  });
});

/**
 * POST /story/progress/complete-arc
 * Complete a story arc
 */
storyRoutes.post('/progress/complete-arc', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    characterId: string;
    arcId: string;
    endingId?: string;
  }>();

  if (!body.characterId || !body.arcId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId and arcId are required' }],
    }, 400);
  }

  const state = await db.prepare(`
    SELECT * FROM character_story_state WHERE character_id = ?
  `).bind(body.characterId).first<CharacterStoryState>();

  if (!state) {
    return c.json({
      success: false,
      errors: [{ code: 'NOT_FOUND', message: 'Character story state not found' }],
    }, 404);
  }

  // Add to completed arcs
  const completedArcs = state.completed_arcs ? JSON.parse(state.completed_arcs) : [];
  if (!completedArcs.includes(body.arcId)) {
    completedArcs.push(body.arcId);
  }

  // Remove from active arcs
  const activeArcs = state.active_arcs ? JSON.parse(state.active_arcs) : [];
  const newActiveArcs = activeArcs.filter((id: string) => id !== body.arcId);

  // Track ending if provided
  const endingsSeen = state.endings_seen ? JSON.parse(state.endings_seen) : [];
  if (body.endingId && !endingsSeen.includes(body.endingId)) {
    endingsSeen.push(body.endingId);
  }

  // Clear current arc if it matches
  const newCurrentArcId = state.current_main_arc_id === body.arcId ? null : state.current_main_arc_id;
  const newCurrentChapterId = state.current_main_arc_id === body.arcId ? null : state.current_main_chapter_id;

  await db.prepare(`
    UPDATE character_story_state
    SET completed_arcs = ?, active_arcs = ?, endings_seen = ?,
        current_main_arc_id = ?, current_main_chapter_id = ?,
        updated_at = datetime('now')
    WHERE character_id = ?
  `).bind(
    JSON.stringify(completedArcs),
    JSON.stringify(newActiveArcs),
    JSON.stringify(endingsSeen),
    newCurrentArcId,
    newCurrentChapterId,
    body.characterId
  ).run();

  return c.json({
    success: true,
    data: {
      message: 'Arc completed',
      arcId: body.arcId,
      endingId: body.endingId,
      totalArcsCompleted: completedArcs.length,
    },
  });
});

/**
 * GET /story/progress/endings
 * Get available endings based on current flags
 */
storyRoutes.get('/progress/endings', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({
      success: false,
      errors: [{ code: 'MISSING_PARAM', message: 'characterId query parameter is required' }],
    }, 400);
  }

  const db = c.env.DB;

  const state = await db.prepare(`
    SELECT story_flags, permanent_flags, ending_points, endings_seen
    FROM character_story_state WHERE character_id = ?
  `).bind(characterId).first<CharacterStoryState>();

  if (!state) {
    return c.json({
      success: true,
      data: {
        characterId,
        availableEndings: [],
        seenEndings: [],
        endingPoints: {},
      },
    });
  }

  // Get flags that affect endings
  const endingFlags = await db.prepare(`
    SELECT * FROM story_flags WHERE affects_ending = 1
  `).all<StoryFlag>();

  const storyFlags = state.story_flags ? JSON.parse(state.story_flags) : {};
  const permanentFlags = state.permanent_flags ? JSON.parse(state.permanent_flags) : {};
  const allFlags = { ...storyFlags, ...permanentFlags };

  // Determine ending eligibility based on flags
  const endingEligibility: Record<string, boolean> = {};
  for (const flag of endingFlags.results || []) {
    if (allFlags[flag.code] !== undefined) {
      // Track which ending-relevant flags are set
      const triggeredEvents = flag.triggers_events ? JSON.parse(flag.triggers_events) : [];
      for (const eventId of triggeredEvents) {
        endingEligibility[eventId] = true;
      }
    }
  }

  return c.json({
    success: true,
    data: {
      characterId,
      endingPoints: state.ending_points ? JSON.parse(state.ending_points) : {},
      seenEndings: state.endings_seen ? JSON.parse(state.endings_seen) : [],
      endingRelevantFlags: Object.keys(allFlags).filter(key =>
        (endingFlags.results || []).some(f => f.code === key)
      ),
    },
  });
});
