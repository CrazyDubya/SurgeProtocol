/**
 * Player Settings and Configuration API
 *
 * Thin API layer delegating to SettingsService.
 *
 * Endpoints:
 * - GET /player - Get player settings
 * - PUT /player - Update player settings
 * - DELETE /player - Reset player settings
 * - GET /config - List game configs
 * - GET /config/:key - Get config value
 * - POST /config - Create config
 * - PUT /config/:key - Update config
 * - GET /difficulty - List difficulty presets
 * - GET /difficulty/:code - Get difficulty preset
 * - POST /difficulty - Create difficulty preset
 * - GET /localization - List localized strings
 * - GET /localization/:key - Get localized string
 * - POST /localization - Create localized string
 * - PUT /localization/:key/translate - Add/update translation
 * - GET /languages - Get available languages
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, type AuthVariables } from '../../middleware/auth';
import { SettingsService } from '../../services/settings';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const playerSettingsSchema = z.object({
  resolution: z.string().regex(/^\d+x\d+$/).optional(),
  fullscreenMode: z.enum(['WINDOWED', 'FULLSCREEN', 'BORDERLESS']).optional(),
  vsync: z.boolean().optional(),
  frameRateLimit: z.number().int().min(30).max(240).optional(),
  brightness: z.number().min(0.5).max(2.0).optional(),
  gamma: z.number().min(0.5).max(2.0).optional(),
  qualityPreset: z.enum(['LOW', 'MEDIUM', 'HIGH', 'ULTRA', 'CUSTOM']).optional(),
  textureQuality: z.number().int().min(1).max(4).optional(),
  shadowQuality: z.number().int().min(0).max(4).optional(),
  effectsQuality: z.number().int().min(1).max(4).optional(),
  drawDistance: z.number().int().min(1).max(5).optional(),
  antialiasing: z.enum(['OFF', 'FXAA', 'SMAA', 'TAA', 'MSAA_2X', 'MSAA_4X']).optional(),
  masterVolume: z.number().min(0).max(1).optional(),
  musicVolume: z.number().min(0).max(1).optional(),
  sfxVolume: z.number().min(0).max(1).optional(),
  voiceVolume: z.number().min(0).max(1).optional(),
  ambientVolume: z.number().min(0).max(1).optional(),
  mouseSensitivity: z.number().min(0.1).max(5.0).optional(),
  invertY: z.boolean().optional(),
  controllerVibration: z.boolean().optional(),
  keyBindings: z.record(z.string().min(1).max(50)).optional(),
  controllerBindings: z.record(z.string().min(1).max(50)).optional(),
  autoSaveFrequency: z.number().int().min(1).max(60).optional(),
  difficultyDefault: z.string().max(50).optional(),
  tutorialEnabled: z.boolean().optional(),
  hintsEnabled: z.boolean().optional(),
  subtitlesEnabled: z.boolean().optional(),
  subtitleSize: z.number().int().min(1).max(4).optional(),
  colorblindMode: z.enum(['OFF', 'PROTANOPIA', 'DEUTERANOPIA', 'TRITANOPIA']).optional(),
  screenShake: z.number().min(0).max(1).optional(),
  motionBlur: z.boolean().optional(),
  flashReduction: z.boolean().optional(),
  textToSpeech: z.boolean().optional(),
  languageUi: z.string().min(2).max(10).optional(),
  languageAudio: z.string().min(2).max(10).optional(),
  languageSubtitles: z.string().min(2).max(10).optional(),
});

const gameConfigSchema = z.object({
  configKey: z.string().min(1).max(100).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  configCategory: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  valueType: z.enum(['STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'JSON']).optional(),
  currentValue: z.string().max(1000).optional(),
  defaultValue: z.string().max(1000).optional(),
  minValue: z.string().max(50).optional(),
  maxValue: z.string().max(50).optional(),
  allowedValues: z.array(z.string().max(100)).optional(),
  requiresRestart: z.boolean().optional(),
  isTunable: z.boolean().optional(),
  abTestEligible: z.boolean().optional(),
  environmentOverrides: z.record(z.unknown()).optional(),
  platformOverrides: z.record(z.unknown()).optional(),
});

const configUpdateSchema = z.object({
  currentValue: z.string().max(1000).optional(),
  description: z.string().max(500).optional(),
  environmentOverrides: z.record(z.unknown()).optional(),
  platformOverrides: z.record(z.unknown()).optional(),
});

const difficultySchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z][A-Z0-9_]*$/),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  damageToPlayer: z.number().min(0.1).max(5.0).optional(),
  damageFromPlayer: z.number().min(0.1).max(5.0).optional(),
  enemyHealth: z.number().min(0.1).max(5.0).optional(),
  enemyAccuracy: z.number().min(0.1).max(5.0).optional(),
  enemyAggression: z.number().min(0.1).max(5.0).optional(),
  creditRewards: z.number().min(0.1).max(5.0).optional(),
  xpRewards: z.number().min(0.1).max(5.0).optional(),
  lootQuality: z.number().min(0.1).max(5.0).optional(),
  prices: z.number().min(0.1).max(5.0).optional(),
  healingEffectiveness: z.number().min(0.1).max(5.0).optional(),
  humanityLossRate: z.number().min(0.1).max(5.0).optional(),
  addictionSeverity: z.number().min(0.1).max(5.0).optional(),
  ratingGain: z.number().min(0.1).max(5.0).optional(),
  ratingLoss: z.number().min(0.1).max(5.0).optional(),
  permadeath: z.boolean().optional(),
  ironmanMode: z.boolean().optional(),
  achievementEligible: z.boolean().optional(),
});

const localizedStringSchema = z.object({
  stringKey: z.string().min(1).max(200).regex(/^[a-zA-Z][a-zA-Z0-9_.]*$/),
  baseText: z.string().min(1).max(5000),
  category: z.string().max(50).optional(),
  context: z.string().max(500).optional(),
  baseLanguage: z.string().min(2).max(10).optional(),
  basePluralForms: z.record(z.string()).optional(),
  characterLimit: z.number().int().min(1).max(10000).optional(),
  hasVariables: z.boolean().optional(),
  variableDefinitions: z.record(z.unknown()).optional(),
  isTranslatable: z.boolean().optional(),
  priority: z.number().int().min(1).max(10).optional(),
});

const translationSchema = z.object({
  languageCode: z.string().min(2).max(10),
  translatedText: z.string().min(1).max(5000),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']).optional(),
});

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = { DB: D1Database; CACHE: KVNamespace; JWT_SECRET: string };

export const settingsRoutes = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// =============================================================================
// PLAYER SETTINGS
// =============================================================================

settingsRoutes.get('/player', authMiddleware, async (c) => {
  const service = new SettingsService({ db: c.env.DB });
  const settings = await service.getPlayerSettings(c.var.userId);
  return c.json({ success: true, data: { settings, ...(settings ? {} : { message: 'No settings found. Using defaults.' }) } });
});

settingsRoutes.put('/player', authMiddleware, zValidator('json', playerSettingsSchema), async (c) => {
  const service = new SettingsService({ db: c.env.DB });
  try {
    const result = await service.updatePlayerSettings(c.var.userId, c.req.valid('json') as Record<string, unknown>);
    if (result.created) return c.json({ success: true, data: { id: result.id, message: 'Settings created' } }, 201);
    return c.json({ success: true, data: { message: 'Settings updated' } });
  } catch (e: any) {
    throw new HTTPException(404, { message: e.message });
  }
});

settingsRoutes.delete('/player', authMiddleware, async (c) => {
  const service = new SettingsService({ db: c.env.DB });
  const deleted = await service.resetPlayerSettings(c.var.userId);
  return c.json({ success: true, data: { deleted, message: deleted ? 'Settings reset to defaults' : 'No settings to delete' } });
});

// =============================================================================
// GAME CONFIGURATION
// =============================================================================

settingsRoutes.get('/config', async (c) => {
  const service = new SettingsService({ db: c.env.DB });
  const data = await service.getGameConfigs(c.req.query('category'));
  return c.json({ success: true, data });
});

settingsRoutes.get('/config/:key', async (c) => {
  const service = new SettingsService({ db: c.env.DB });
  const config = await service.getGameConfig(c.req.param('key'));
  if (!config) throw new HTTPException(404, { message: 'Config key not found' });
  return c.json({ success: true, data: { config } });
});

settingsRoutes.post('/config', authMiddleware, zValidator('json', gameConfigSchema), async (c) => {
  const service = new SettingsService({ db: c.env.DB });
  const body = c.req.valid('json');
  const id = await service.createGameConfig(body as Record<string, unknown>);
  return c.json({ success: true, data: { id, configKey: body.configKey } }, 201);
});

settingsRoutes.put('/config/:key', authMiddleware, zValidator('json', configUpdateSchema), async (c) => {
  const service = new SettingsService({ db: c.env.DB });
  try {
    const result = await service.updateGameConfig(c.req.param('key'), c.req.valid('json') as Record<string, unknown>);
    return c.json({ success: true, data: { message: 'Config updated', requiresRestart: result.requiresRestart } });
  } catch (e: any) {
    const status = e.message.includes('not found') ? 404 : 400;
    throw new HTTPException(status, { message: e.message });
  }
});

// =============================================================================
// DIFFICULTY DEFINITIONS
// =============================================================================

settingsRoutes.get('/difficulty', async (c) => {
  const service = new SettingsService({ db: c.env.DB });
  return c.json({ success: true, data: { difficulties: await service.getDifficultyPresets() } });
});

settingsRoutes.get('/difficulty/:code', async (c) => {
  const service = new SettingsService({ db: c.env.DB });
  const difficulty = await service.getDifficultyPreset(c.req.param('code'));
  if (!difficulty) throw new HTTPException(404, { message: 'Difficulty not found' });
  return c.json({ success: true, data: { difficulty } });
});

settingsRoutes.post('/difficulty', authMiddleware, zValidator('json', difficultySchema), async (c) => {
  const service = new SettingsService({ db: c.env.DB });
  const body = c.req.valid('json');
  const id = await service.createDifficultyPreset(body as Record<string, unknown>);
  return c.json({ success: true, data: { id, code: body.code } }, 201);
});

// =============================================================================
// LOCALIZATION
// =============================================================================

settingsRoutes.get('/localization', async (c) => {
  const service = new SettingsService({ db: c.env.DB });
  const data = await service.getLocalizedStrings({
    category: c.req.query('category'),
    language: c.req.query('language'),
    limit: parseInt(c.req.query('limit') || '100'),
    offset: parseInt(c.req.query('offset') || '0'),
  });
  return c.json({ success: true, data });
});

settingsRoutes.get('/localization/:key', async (c) => {
  const service = new SettingsService({ db: c.env.DB });
  const data = await service.getLocalizedString(c.req.param('key'));
  if (!data) throw new HTTPException(404, { message: 'String key not found' });
  return c.json({ success: true, data });
});

settingsRoutes.post('/localization', authMiddleware, zValidator('json', localizedStringSchema), async (c) => {
  const service = new SettingsService({ db: c.env.DB });
  const body = c.req.valid('json');
  const id = await service.createLocalizedString(body as Record<string, unknown>);
  return c.json({ success: true, data: { id, stringKey: body.stringKey } }, 201);
});

settingsRoutes.put('/localization/:key/translate', authMiddleware, zValidator('json', translationSchema), async (c) => {
  const service = new SettingsService({ db: c.env.DB });
  const body = c.req.valid('json');
  try {
    const result = await service.upsertTranslation(c.req.param('key'), body.languageCode, body.translatedText, body.status || 'DRAFT', c.var.userId);
    if (result.created) return c.json({ success: true, data: { id: result.id, message: 'Translation added' } }, 201);
    return c.json({ success: true, data: { message: 'Translation updated' } });
  } catch (e: any) {
    throw new HTTPException(404, { message: e.message });
  }
});

settingsRoutes.get('/languages', async (c) => {
  const service = new SettingsService({ db: c.env.DB });
  const data = await service.getAvailableLanguages();
  return c.json({ success: true, data });
});

export default settingsRoutes;
