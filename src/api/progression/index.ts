/**
 * Surge Protocol - Progression System Routes
 *
 * Endpoints:
 *
 * Tracks:
 * - GET /progression/tracks - List all tracks
 * - GET /progression/tracks/:id - Get track details
 * - POST /progression/character/select-track - Select track (requires Tier 3)
 *
 * Specializations:
 * - GET /progression/specializations - List all specializations
 * - GET /progression/specializations/:id - Get specialization details
 * - GET /progression/specializations/by-track/:trackId - Get specializations for track
 * - POST /progression/character/select-specialization - Select specialization (requires Tier 6)
 *
 * Tiers:
 * - GET /progression/tiers - List tier definitions
 * - GET /progression/tiers/:tier - Get tier details
 * - GET /progression/tiers/current - Get character's current tier info
 *
 * Experience:
 * - GET /progression/character/experience - Get character XP by category
 * - POST /progression/character/experience/add - Add XP (for testing/admin)
 *
 * Advancement:
 * - GET /progression/character/advancement - Get available advancement points
 * - POST /progression/character/advancement/spend - Spend advancement points
 *
 * Rating:
 * - GET /progression/rating/components - List rating component definitions
 * - GET /progression/character/rating - Get character's rating breakdown
 *
 * Cross-Training:
 * - GET /progression/character/cross-training - Get cross-training progress
 * - POST /progression/character/cross-training/invest - Invest XP in cross-training
 */

import { Hono } from 'hono';
import {
  ProgressionService,
  formatTrack,
  formatSpecialization,
  formatTierDefinition,
} from '../../services/progression';
import type { XPCategory, AdvancementType } from '../../services/progression';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

// =============================================================================
// ROUTES
// =============================================================================

export const progressionRoutes = new Hono<{ Bindings: Bindings }>();

// =============================================================================
// TRACK ENDPOINTS
// =============================================================================

/**
 * GET /progression/tracks
 * List all tracks
 */
progressionRoutes.get('/tracks', async (c) => {
  const service = new ProgressionService(c.env.DB);
  const tracks = await service.getTracks();

  return c.json({
    success: true,
    data: {
      tracks,
      total: tracks.length,
    },
  });
});

/**
 * GET /progression/tracks/:id
 * Get track details with specializations
 */
progressionRoutes.get('/tracks/:id', async (c) => {
  const { id } = c.req.param();
  const service = new ProgressionService(c.env.DB);

  const track = await service.getTrackById(id);
  if (!track) {
    return c.json({ success: false, errors: [{ message: 'Track not found' }] }, 404);
  }

  const specs = await c.env.DB.prepare(
    'SELECT * FROM specializations WHERE track_id = ? ORDER BY display_order'
  ).bind(id).all();

  return c.json({
    success: true,
    data: {
      track: formatTrack(track),
      specializations: specs.results.map((s: any) => formatSpecialization(s, track.name)),
    },
  });
});

// =============================================================================
// SPECIALIZATION ENDPOINTS
// =============================================================================

/**
 * GET /progression/specializations
 * List all specializations
 */
progressionRoutes.get('/specializations', async (c) => {
  const service = new ProgressionService(c.env.DB);
  const trackId = c.req.query('track_id');
  const specializations = await service.getSpecializations(trackId);

  return c.json({
    success: true,
    data: {
      specializations,
      total: specializations.length,
    },
  });
});

/**
 * GET /progression/specializations/by-track/:trackId
 * Get specializations for a specific track
 */
progressionRoutes.get('/specializations/by-track/:trackId', async (c) => {
  const { trackId } = c.req.param();
  const service = new ProgressionService(c.env.DB);

  const result = await service.getSpecializationsByTrack(trackId);
  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Track not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: {
      track_id: trackId,
      track_name: result.track_name,
      specializations: result.specializations,
    },
  });
});

/**
 * GET /progression/specializations/:id
 * Get specialization details
 */
progressionRoutes.get('/specializations/:id', async (c) => {
  const { id } = c.req.param();
  const service = new ProgressionService(c.env.DB);

  const result = await service.getSpecializationById(id);
  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Specialization not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: {
      specialization: {
        ...formatSpecialization(result, result.track_name),
        track_code: result.track_code,
      },
    },
  });
});

// =============================================================================
// TIER ENDPOINTS
// =============================================================================

/**
 * GET /progression/tiers
 * List all tier definitions
 */
progressionRoutes.get('/tiers', async (c) => {
  const service = new ProgressionService(c.env.DB);
  const tiers = await service.getTierDefinitions();

  return c.json({
    success: true,
    data: {
      tiers,
      total: tiers.length,
    },
  });
});

/**
 * GET /progression/tiers/current
 * Get character's current tier info and progress to next
 */
progressionRoutes.get('/tiers/current', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const service = new ProgressionService(c.env.DB);
  const tierInfo = await service.getCharacterTierInfo(characterId);

  if (!tierInfo) {
    return c.json({ success: false, errors: [{ message: 'Character not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: tierInfo,
  });
});

/**
 * GET /progression/tiers/:tier
 * Get specific tier details
 */
progressionRoutes.get('/tiers/:tier', async (c) => {
  const tier = parseInt(c.req.param('tier'), 10);

  if (isNaN(tier) || tier < 1 || tier > 10) {
    return c.json({ success: false, errors: [{ message: 'Invalid tier number (1-10)' }] }, 400);
  }

  const service = new ProgressionService(c.env.DB);
  const result = await service.getTierByNumber(tier);

  if (!result) {
    return c.json({ success: false, errors: [{ message: 'Tier not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: {
      tier: formatTierDefinition(result),
    },
  });
});

// =============================================================================
// EXPERIENCE ENDPOINTS
// =============================================================================

/**
 * GET /progression/character/experience
 * Get character's XP by category and advancement points
 */
progressionRoutes.get('/character/experience', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const service = new ProgressionService(c.env.DB);
  const experience = await service.getCharacterExperience(characterId);

  return c.json({
    success: true,
    data: { experience },
  });
});

/**
 * POST /progression/character/experience/add
 * Add XP to a category (admin/testing endpoint)
 */
progressionRoutes.post('/character/experience/add', async (c) => {
  const body = await c.req.json<{
    characterId: string;
    category: XPCategory;
    amount: number;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const validCategories: XPCategory[] = ['combat', 'delivery', 'social', 'technical', 'exploration', 'story'];
  if (!validCategories.includes(body.category)) {
    return c.json({ success: false, errors: [{ message: 'Invalid category' }] }, 400);
  }

  if (typeof body.amount !== 'number' || body.amount <= 0) {
    return c.json({ success: false, errors: [{ message: 'amount must be a positive number' }] }, 400);
  }

  const service = new ProgressionService(c.env.DB);
  const result = await service.addExperience(body.characterId, body.category, body.amount);

  return c.json({
    success: true,
    data: result,
  });
});

// =============================================================================
// ADVANCEMENT ENDPOINTS
// =============================================================================

/**
 * GET /progression/character/advancement
 * Get available advancement points
 */
progressionRoutes.get('/character/advancement', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const service = new ProgressionService(c.env.DB);
  const points = await service.getAdvancementPoints(characterId);

  return c.json({
    success: true,
    data: {
      advancement_points: points,
    },
  });
});

/**
 * POST /progression/character/advancement/spend
 * Spend advancement points
 */
progressionRoutes.post('/character/advancement/spend', async (c) => {
  const body = await c.req.json<{
    characterId: string;
    type: AdvancementType;
    amount: number;
    target_id?: string;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const validTypes: AdvancementType[] = ['attribute', 'skill', 'ability', 'augment_slots'];
  if (!validTypes.includes(body.type)) {
    return c.json({ success: false, errors: [{ message: 'Invalid type' }] }, 400);
  }

  if (typeof body.amount !== 'number' || body.amount <= 0) {
    return c.json({ success: false, errors: [{ message: 'amount must be a positive number' }] }, 400);
  }

  const service = new ProgressionService(c.env.DB);
  const result = await service.spendAdvancementPoints(body.characterId, body.type, body.amount, body.target_id);

  if (!result.success) {
    return c.json({ success: false, errors: [{ message: result.error }] }, 400);
  }

  return c.json({
    success: true,
    data: result.data,
  });
});

// =============================================================================
// RATING ENDPOINTS
// =============================================================================

/**
 * GET /progression/rating/components
 * List rating component definitions
 */
progressionRoutes.get('/rating/components', async (c) => {
  const publicOnly = c.req.query('public_only') === 'true';
  const service = new ProgressionService(c.env.DB);
  const components = await service.getRatingComponents(publicOnly);

  return c.json({
    success: true,
    data: {
      components,
      total: components.length,
    },
  });
});

/**
 * GET /progression/character/rating
 * Get character's rating breakdown
 */
progressionRoutes.get('/character/rating', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const service = new ProgressionService(c.env.DB);
  const rating = await service.getCharacterRating(characterId);

  if (!rating) {
    return c.json({ success: false, errors: [{ message: 'Character not found' }] }, 404);
  }

  return c.json({
    success: true,
    data: rating,
  });
});

// =============================================================================
// CROSS-TRAINING ENDPOINTS
// =============================================================================

/**
 * GET /progression/character/cross-training
 * Get character's cross-training progress
 */
progressionRoutes.get('/character/cross-training', async (c) => {
  const characterId = c.req.query('characterId');
  if (!characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  const service = new ProgressionService(c.env.DB);
  const crossTraining = await service.getCrossTraining(characterId);

  return c.json({
    success: true,
    data: {
      cross_training: crossTraining,
      total: crossTraining.length,
    },
  });
});

/**
 * POST /progression/character/cross-training/invest
 * Invest XP in cross-training
 */
progressionRoutes.post('/character/cross-training/invest', async (c) => {
  const body = await c.req.json<{
    characterId: string;
    target_track_id: string;
    xp_amount: number;
  }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (!body.target_track_id) {
    return c.json({ success: false, errors: [{ message: 'target_track_id is required' }] }, 400);
  }

  if (typeof body.xp_amount !== 'number' || body.xp_amount <= 0) {
    return c.json({ success: false, errors: [{ message: 'xp_amount must be a positive number' }] }, 400);
  }

  const service = new ProgressionService(c.env.DB);
  const result = await service.investCrossTraining(body.characterId, body.target_track_id, body.xp_amount);

  if (!result.success) {
    return c.json({ success: false, errors: [{ message: result.error }] }, 400);
  }

  return c.json({
    success: true,
    data: result.data,
  }, (result as any).statusCode || 200);
});

// =============================================================================
// CHARACTER TRACK/SPEC SELECTION ENDPOINTS
// =============================================================================

/**
 * POST /progression/character/select-track
 * Select a track (requires Tier 3)
 */
progressionRoutes.post('/character/select-track', async (c) => {
  const body = await c.req.json<{ characterId: string; track_id: string }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (!body.track_id) {
    return c.json({ success: false, errors: [{ message: 'track_id is required' }] }, 400);
  }

  const service = new ProgressionService(c.env.DB);
  const result = await service.selectTrack(body.characterId, body.track_id);

  if (!result.success) {
    const statusCode = (result as any).statusCode || 400;
    return c.json({ success: false, errors: [{ message: result.error }] }, statusCode);
  }

  return c.json({
    success: true,
    data: result.data,
  });
});

/**
 * POST /progression/character/select-specialization
 * Select a specialization (requires Tier 6)
 */
progressionRoutes.post('/character/select-specialization', async (c) => {
  const body = await c.req.json<{ characterId: string; specialization_id: string }>();

  if (!body.characterId) {
    return c.json({ success: false, errors: [{ message: 'characterId is required' }] }, 400);
  }

  if (!body.specialization_id) {
    return c.json({ success: false, errors: [{ message: 'specialization_id is required' }] }, 400);
  }

  const service = new ProgressionService(c.env.DB);
  const result = await service.selectSpecialization(body.characterId, body.specialization_id);

  if (!result.success) {
    const statusCode = (result as any).statusCode || 400;
    return c.json({ success: false, errors: [{ message: result.error }] }, statusCode);
  }

  return c.json({
    success: true,
    data: result.data,
  });
});
