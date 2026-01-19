/**
 * Player Settings and Configuration API
 *
 * Manages user preferences, game configuration, difficulty settings,
 * and localization.
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware, type AuthVariables } from '../../middleware/auth';

// =============================================================================
// TYPES & BINDINGS
// =============================================================================

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
};

// Helper to parse JSON fields
function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  return value as T;
}

export const settingsRoutes = new Hono<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>();

// ============================================
// PLAYER SETTINGS
// ============================================

interface PlayerSettings {
  id: string;
  playerId: string;
  // Display
  resolution: string | null;
  fullscreenMode: string | null;
  vsync: boolean;
  frameRateLimit: number;
  brightness: number;
  gamma: number;
  // Graphics
  qualityPreset: string | null;
  textureQuality: number;
  shadowQuality: number;
  effectsQuality: number;
  drawDistance: number;
  antialiasing: string | null;
  // Audio
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  ambientVolume: number;
  // Controls
  mouseSensitivity: number;
  invertY: boolean;
  controllerVibration: boolean;
  keyBindings: Record<string, string> | null;
  controllerBindings: Record<string, string> | null;
  // Gameplay
  autoSaveFrequency: number;
  difficultyDefault: string | null;
  tutorialEnabled: boolean;
  hintsEnabled: boolean;
  subtitlesEnabled: boolean;
  subtitleSize: number;
  // Accessibility
  colorblindMode: string | null;
  screenShake: number;
  motionBlur: boolean;
  flashReduction: boolean;
  textToSpeech: boolean;
  // Language
  languageUi: string;
  languageAudio: string;
  languageSubtitles: string;
  createdAt: string;
  updatedAt: string;
}

// Get current user's settings
settingsRoutes.get('/player', authMiddleware, async (c) => {
  const { userId } = c.var;
  const db = c.env.DB;

  const result = await db
    .prepare(
      `SELECT ps.* FROM player_settings ps
       JOIN player_profiles pp ON ps.player_id = pp.id
       WHERE pp.user_id = ?`
    )
    .bind(userId)
    .first();

  if (!result) {
    // Return default settings if none exist
    return c.json({
      success: true,
      data: {
        settings: null,
        message: 'No settings found. Using defaults.',
      },
    });
  }

  const settings: PlayerSettings = {
    id: result.id as string,
    playerId: result.player_id as string,
    resolution: result.resolution as string | null,
    fullscreenMode: result.fullscreen_mode as string | null,
    vsync: (result.vsync as number) === 1,
    frameRateLimit: result.frame_rate_limit as number,
    brightness: result.brightness as number,
    gamma: result.gamma as number,
    qualityPreset: result.quality_preset as string | null,
    textureQuality: result.texture_quality as number,
    shadowQuality: result.shadow_quality as number,
    effectsQuality: result.effects_quality as number,
    drawDistance: result.draw_distance as number,
    antialiasing: result.antialiasing as string | null,
    masterVolume: result.master_volume as number,
    musicVolume: result.music_volume as number,
    sfxVolume: result.sfx_volume as number,
    voiceVolume: result.voice_volume as number,
    ambientVolume: result.ambient_volume as number,
    mouseSensitivity: result.mouse_sensitivity as number,
    invertY: (result.invert_y as number) === 1,
    controllerVibration: (result.controller_vibration as number) === 1,
    keyBindings: parseJsonField<Record<string, string> | null>(result.key_bindings, null),
    controllerBindings: parseJsonField<Record<string, string> | null>(result.controller_bindings, null),
    autoSaveFrequency: result.auto_save_frequency as number,
    difficultyDefault: result.difficulty_default as string | null,
    tutorialEnabled: (result.tutorial_enabled as number) === 1,
    hintsEnabled: (result.hints_enabled as number) === 1,
    subtitlesEnabled: (result.subtitles_enabled as number) === 1,
    subtitleSize: result.subtitle_size as number,
    colorblindMode: result.colorblind_mode as string | null,
    screenShake: result.screen_shake as number,
    motionBlur: (result.motion_blur as number) === 1,
    flashReduction: (result.flash_reduction as number) === 1,
    textToSpeech: (result.text_to_speech as number) === 1,
    languageUi: result.language_ui as string,
    languageAudio: result.language_audio as string,
    languageSubtitles: result.language_subtitles as string,
    createdAt: result.created_at as string,
    updatedAt: result.updated_at as string,
  };

  return c.json({
    success: true,
    data: { settings },
  });
});

// Update current user's settings
settingsRoutes.put('/player', authMiddleware, async (c) => {
  const { userId } = c.var;
  const db = c.env.DB;
  const body = await c.req.json();

  // Get player_id for user
  const player = await db
    .prepare('SELECT id FROM player_profiles WHERE user_id = ?')
    .bind(userId)
    .first();

  if (!player) {
    throw new HTTPException(404, { message: 'Player profile not found' });
  }

  const playerId = player.id as string;

  // Check if settings exist
  const existing = await db
    .prepare('SELECT id FROM player_settings WHERE player_id = ?')
    .bind(playerId)
    .first();

  const now = new Date().toISOString();

  if (existing) {
    // Update existing settings
    const updates: string[] = [];
    const values: unknown[] = [];

    // Build dynamic update query
    const fieldMap: Record<string, string> = {
      resolution: 'resolution',
      fullscreenMode: 'fullscreen_mode',
      vsync: 'vsync',
      frameRateLimit: 'frame_rate_limit',
      brightness: 'brightness',
      gamma: 'gamma',
      qualityPreset: 'quality_preset',
      textureQuality: 'texture_quality',
      shadowQuality: 'shadow_quality',
      effectsQuality: 'effects_quality',
      drawDistance: 'draw_distance',
      antialiasing: 'antialiasing',
      masterVolume: 'master_volume',
      musicVolume: 'music_volume',
      sfxVolume: 'sfx_volume',
      voiceVolume: 'voice_volume',
      ambientVolume: 'ambient_volume',
      mouseSensitivity: 'mouse_sensitivity',
      invertY: 'invert_y',
      controllerVibration: 'controller_vibration',
      keyBindings: 'key_bindings',
      controllerBindings: 'controller_bindings',
      autoSaveFrequency: 'auto_save_frequency',
      difficultyDefault: 'difficulty_default',
      tutorialEnabled: 'tutorial_enabled',
      hintsEnabled: 'hints_enabled',
      subtitlesEnabled: 'subtitles_enabled',
      subtitleSize: 'subtitle_size',
      colorblindMode: 'colorblind_mode',
      screenShake: 'screen_shake',
      motionBlur: 'motion_blur',
      flashReduction: 'flash_reduction',
      textToSpeech: 'text_to_speech',
      languageUi: 'language_ui',
      languageAudio: 'language_audio',
      languageSubtitles: 'language_subtitles',
    };

    for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
      if (body[jsKey] !== undefined) {
        updates.push(`${dbKey} = ?`);
        let value = body[jsKey];
        // Handle booleans
        if (typeof value === 'boolean') {
          value = value ? 1 : 0;
        }
        // Handle JSON fields
        if (jsKey === 'keyBindings' || jsKey === 'controllerBindings') {
          value = value ? JSON.stringify(value) : null;
        }
        values.push(value);
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(now);
      values.push(playerId);

      await db
        .prepare(
          `UPDATE player_settings SET ${updates.join(', ')} WHERE player_id = ?`
        )
        .bind(...values)
        .run();
    }

    return c.json({
      success: true,
      data: { message: 'Settings updated' },
    });
  } else {
    // Create new settings
    const id = crypto.randomUUID();

    await db
      .prepare(
        `INSERT INTO player_settings (
          id, player_id, resolution, fullscreen_mode, vsync, frame_rate_limit,
          brightness, gamma, quality_preset, texture_quality, shadow_quality,
          effects_quality, draw_distance, antialiasing, master_volume, music_volume,
          sfx_volume, voice_volume, ambient_volume, mouse_sensitivity, invert_y,
          controller_vibration, key_bindings, controller_bindings, auto_save_frequency,
          difficulty_default, tutorial_enabled, hints_enabled, subtitles_enabled,
          subtitle_size, colorblind_mode, screen_shake, motion_blur, flash_reduction,
          text_to_speech, language_ui, language_audio, language_subtitles,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        playerId,
        body.resolution || null,
        body.fullscreenMode || null,
        body.vsync !== undefined ? (body.vsync ? 1 : 0) : 1,
        body.frameRateLimit || 60,
        body.brightness || 1.0,
        body.gamma || 1.0,
        body.qualityPreset || null,
        body.textureQuality || 3,
        body.shadowQuality || 3,
        body.effectsQuality || 3,
        body.drawDistance || 3,
        body.antialiasing || null,
        body.masterVolume || 1.0,
        body.musicVolume || 0.8,
        body.sfxVolume || 1.0,
        body.voiceVolume || 1.0,
        body.ambientVolume || 0.7,
        body.mouseSensitivity || 1.0,
        body.invertY !== undefined ? (body.invertY ? 1 : 0) : 0,
        body.controllerVibration !== undefined ? (body.controllerVibration ? 1 : 0) : 1,
        body.keyBindings ? JSON.stringify(body.keyBindings) : null,
        body.controllerBindings ? JSON.stringify(body.controllerBindings) : null,
        body.autoSaveFrequency || 5,
        body.difficultyDefault || null,
        body.tutorialEnabled !== undefined ? (body.tutorialEnabled ? 1 : 0) : 1,
        body.hintsEnabled !== undefined ? (body.hintsEnabled ? 1 : 0) : 1,
        body.subtitlesEnabled !== undefined ? (body.subtitlesEnabled ? 1 : 0) : 1,
        body.subtitleSize || 2,
        body.colorblindMode || null,
        body.screenShake || 1.0,
        body.motionBlur !== undefined ? (body.motionBlur ? 1 : 0) : 1,
        body.flashReduction !== undefined ? (body.flashReduction ? 1 : 0) : 0,
        body.textToSpeech !== undefined ? (body.textToSpeech ? 1 : 0) : 0,
        body.languageUi || 'en',
        body.languageAudio || 'en',
        body.languageSubtitles || 'en',
        now,
        now
      )
      .run();

    return c.json(
      {
        success: true,
        data: { id, message: 'Settings created' },
      },
      201
    );
  }
});

// Reset settings to defaults
settingsRoutes.delete('/player', authMiddleware, async (c) => {
  const { userId } = c.var;
  const db = c.env.DB;

  const result = await db
    .prepare(
      `DELETE FROM player_settings
       WHERE player_id IN (
         SELECT id FROM player_profiles WHERE user_id = ?
       )`
    )
    .bind(userId)
    .run();

  return c.json({
    success: true,
    data: {
      deleted: result.meta.changes > 0,
      message: result.meta.changes > 0 ? 'Settings reset to defaults' : 'No settings to delete',
    },
  });
});

// ============================================
// GAME CONFIGURATION
// ============================================

interface GameConfig {
  id: string;
  configKey: string;
  configCategory: string | null;
  description: string | null;
  valueType: string | null;
  currentValue: string | null;
  defaultValue: string | null;
  minValue: string | null;
  maxValue: string | null;
  allowedValues: string[] | null;
  requiresRestart: boolean;
  isTunable: boolean;
  abTestEligible: boolean;
  environmentOverrides: Record<string, unknown> | null;
  platformOverrides: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// Get all game config
settingsRoutes.get('/config', async (c) => {
  const db = c.env.DB;
  const category = c.req.query('category');

  let query = 'SELECT * FROM game_config';
  const params: string[] = [];

  if (category) {
    query += ' WHERE config_category = ?';
    params.push(category);
  }

  query += ' ORDER BY config_category, config_key';

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();

  const configs: GameConfig[] = result.results.map((row) => ({
    id: row.id as string,
    configKey: row.config_key as string,
    configCategory: row.config_category as string | null,
    description: row.description as string | null,
    valueType: row.value_type as string | null,
    currentValue: row.current_value as string | null,
    defaultValue: row.default_value as string | null,
    minValue: row.min_value as string | null,
    maxValue: row.max_value as string | null,
    allowedValues: parseJsonField<string[] | null>(row.allowed_values, null),
    requiresRestart: (row.requires_restart as number) === 1,
    isTunable: (row.is_tunable as number) === 1,
    abTestEligible: (row.a_b_test_eligible as number) === 1,
    environmentOverrides: parseJsonField<Record<string, unknown> | null>(row.environment_overrides, null),
    platformOverrides: parseJsonField<Record<string, unknown> | null>(row.platform_overrides, null),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));

  // Group by category
  const grouped = configs.reduce(
    (acc, config) => {
      const cat = config.configCategory || 'uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(config);
      return acc;
    },
    {} as Record<string, GameConfig[]>
  );

  return c.json({
    success: true,
    data: {
      configs: category ? configs : grouped,
      total: configs.length,
    },
  });
});

// Get specific config value
settingsRoutes.get('/config/:key', async (c) => {
  const db = c.env.DB;
  const key = c.req.param('key');

  const result = await db
    .prepare('SELECT * FROM game_config WHERE config_key = ?')
    .bind(key)
    .first();

  if (!result) {
    throw new HTTPException(404, { message: 'Config key not found' });
  }

  const config: GameConfig = {
    id: result.id as string,
    configKey: result.config_key as string,
    configCategory: result.config_category as string | null,
    description: result.description as string | null,
    valueType: result.value_type as string | null,
    currentValue: result.current_value as string | null,
    defaultValue: result.default_value as string | null,
    minValue: result.min_value as string | null,
    maxValue: result.max_value as string | null,
    allowedValues: parseJsonField<string[] | null>(result.allowed_values, null),
    requiresRestart: (result.requires_restart as number) === 1,
    isTunable: (result.is_tunable as number) === 1,
    abTestEligible: (result.a_b_test_eligible as number) === 1,
    environmentOverrides: parseJsonField<Record<string, unknown> | null>(result.environment_overrides, null),
    platformOverrides: parseJsonField<Record<string, unknown> | null>(result.platform_overrides, null),
    createdAt: result.created_at as string,
    updatedAt: result.updated_at as string,
  };

  return c.json({
    success: true,
    data: { config },
  });
});

// Create new config (admin only typically)
settingsRoutes.post('/config', authMiddleware, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  if (!body.configKey) {
    throw new HTTPException(400, { message: 'configKey is required' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO game_config (
        id, config_key, config_category, description, value_type,
        current_value, default_value, min_value, max_value, allowed_values,
        requires_restart, is_tunable, a_b_test_eligible,
        environment_overrides, platform_overrides, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      body.configKey,
      body.configCategory || null,
      body.description || null,
      body.valueType || null,
      body.currentValue || null,
      body.defaultValue || null,
      body.minValue || null,
      body.maxValue || null,
      body.allowedValues ? JSON.stringify(body.allowedValues) : null,
      body.requiresRestart ? 1 : 0,
      body.isTunable !== false ? 1 : 0,
      body.abTestEligible ? 1 : 0,
      body.environmentOverrides ? JSON.stringify(body.environmentOverrides) : null,
      body.platformOverrides ? JSON.stringify(body.platformOverrides) : null,
      now,
      now
    )
    .run();

  return c.json(
    {
      success: true,
      data: { id, configKey: body.configKey },
    },
    201
  );
});

// Update config value
settingsRoutes.put('/config/:key', authMiddleware, async (c) => {
  const db = c.env.DB;
  const key = c.req.param('key');
  const body = await c.req.json();

  const existing = await db
    .prepare('SELECT * FROM game_config WHERE config_key = ?')
    .bind(key)
    .first();

  if (!existing) {
    throw new HTTPException(404, { message: 'Config key not found' });
  }

  // Validate value if constraints exist
  if (body.currentValue !== undefined) {
    const allowedValues = parseJsonField<string[] | null>(existing.allowed_values, null);
    if (allowedValues && !allowedValues.includes(body.currentValue)) {
      throw new HTTPException(400, {
        message: `Value must be one of: ${allowedValues.join(', ')}`,
      });
    }

    const min = existing.min_value ? parseFloat(existing.min_value as string) : null;
    const max = existing.max_value ? parseFloat(existing.max_value as string) : null;
    const numValue = parseFloat(body.currentValue);

    if (!isNaN(numValue)) {
      if (min !== null && numValue < min) {
        throw new HTTPException(400, { message: `Value must be >= ${min}` });
      }
      if (max !== null && numValue > max) {
        throw new HTTPException(400, { message: `Value must be <= ${max}` });
      }
    }
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.currentValue !== undefined) {
    updates.push('current_value = ?');
    values.push(body.currentValue);
  }
  if (body.description !== undefined) {
    updates.push('description = ?');
    values.push(body.description);
  }
  if (body.environmentOverrides !== undefined) {
    updates.push('environment_overrides = ?');
    values.push(JSON.stringify(body.environmentOverrides));
  }
  if (body.platformOverrides !== undefined) {
    updates.push('platform_overrides = ?');
    values.push(JSON.stringify(body.platformOverrides));
  }

  if (updates.length > 0) {
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(key);

    await db
      .prepare(
        `UPDATE game_config SET ${updates.join(', ')} WHERE config_key = ?`
      )
      .bind(...values)
      .run();
  }

  return c.json({
    success: true,
    data: {
      message: 'Config updated',
      requiresRestart: (existing.requires_restart as number) === 1,
    },
  });
});

// ============================================
// DIFFICULTY DEFINITIONS
// ============================================

interface DifficultyDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  // Combat
  damageToPlayer: number;
  damageFromPlayer: number;
  enemyHealth: number;
  enemyAccuracy: number;
  enemyAggression: number;
  // Economy
  creditRewards: number;
  xpRewards: number;
  lootQuality: number;
  prices: number;
  // Survival
  healingEffectiveness: number;
  humanityLossRate: number;
  addictionSeverity: number;
  // Progression
  ratingGain: number;
  ratingLoss: number;
  // Special
  permadeath: boolean;
  ironmanMode: boolean;
  achievementEligible: boolean;
  createdAt: string;
  updatedAt: string;
}

// Get all difficulty definitions
settingsRoutes.get('/difficulty', async (c) => {
  const db = c.env.DB;

  const result = await db
    .prepare('SELECT * FROM difficulty_definitions ORDER BY id')
    .all();

  const difficulties: DifficultyDefinition[] = result.results.map((row) => ({
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    description: row.description as string | null,
    damageToPlayer: row.damage_to_player as number,
    damageFromPlayer: row.damage_from_player as number,
    enemyHealth: row.enemy_health as number,
    enemyAccuracy: row.enemy_accuracy as number,
    enemyAggression: row.enemy_aggression as number,
    creditRewards: row.credit_rewards as number,
    xpRewards: row.xp_rewards as number,
    lootQuality: row.loot_quality as number,
    prices: row.prices as number,
    healingEffectiveness: row.healing_effectiveness as number,
    humanityLossRate: row.humanity_loss_rate as number,
    addictionSeverity: row.addiction_severity as number,
    ratingGain: row.rating_gain as number,
    ratingLoss: row.rating_loss as number,
    permadeath: (row.permadeath as number) === 1,
    ironmanMode: (row.ironman_mode as number) === 1,
    achievementEligible: (row.achievement_eligible as number) === 1,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));

  return c.json({
    success: true,
    data: { difficulties },
  });
});

// Get specific difficulty
settingsRoutes.get('/difficulty/:code', async (c) => {
  const db = c.env.DB;
  const code = c.req.param('code');

  const result = await db
    .prepare('SELECT * FROM difficulty_definitions WHERE code = ?')
    .bind(code)
    .first();

  if (!result) {
    throw new HTTPException(404, { message: 'Difficulty not found' });
  }

  const difficulty: DifficultyDefinition = {
    id: result.id as string,
    code: result.code as string,
    name: result.name as string,
    description: result.description as string | null,
    damageToPlayer: result.damage_to_player as number,
    damageFromPlayer: result.damage_from_player as number,
    enemyHealth: result.enemy_health as number,
    enemyAccuracy: result.enemy_accuracy as number,
    enemyAggression: result.enemy_aggression as number,
    creditRewards: result.credit_rewards as number,
    xpRewards: result.xp_rewards as number,
    lootQuality: result.loot_quality as number,
    prices: result.prices as number,
    healingEffectiveness: result.healing_effectiveness as number,
    humanityLossRate: result.humanity_loss_rate as number,
    addictionSeverity: result.addiction_severity as number,
    ratingGain: result.rating_gain as number,
    ratingLoss: result.rating_loss as number,
    permadeath: (result.permadeath as number) === 1,
    ironmanMode: (result.ironman_mode as number) === 1,
    achievementEligible: (result.achievement_eligible as number) === 1,
    createdAt: result.created_at as string,
    updatedAt: result.updated_at as string,
  };

  return c.json({
    success: true,
    data: { difficulty },
  });
});

// Create difficulty definition
settingsRoutes.post('/difficulty', authMiddleware, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  if (!body.code || !body.name) {
    throw new HTTPException(400, { message: 'code and name are required' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO difficulty_definitions (
        id, code, name, description,
        damage_to_player, damage_from_player, enemy_health, enemy_accuracy, enemy_aggression,
        credit_rewards, xp_rewards, loot_quality, prices,
        healing_effectiveness, humanity_loss_rate, addiction_severity,
        rating_gain, rating_loss, permadeath, ironman_mode, achievement_eligible,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      body.code,
      body.name,
      body.description || null,
      body.damageToPlayer || 1.0,
      body.damageFromPlayer || 1.0,
      body.enemyHealth || 1.0,
      body.enemyAccuracy || 1.0,
      body.enemyAggression || 1.0,
      body.creditRewards || 1.0,
      body.xpRewards || 1.0,
      body.lootQuality || 1.0,
      body.prices || 1.0,
      body.healingEffectiveness || 1.0,
      body.humanityLossRate || 1.0,
      body.addictionSeverity || 1.0,
      body.ratingGain || 1.0,
      body.ratingLoss || 1.0,
      body.permadeath ? 1 : 0,
      body.ironmanMode ? 1 : 0,
      body.achievementEligible !== false ? 1 : 0,
      now,
      now
    )
    .run();

  return c.json(
    {
      success: true,
      data: { id, code: body.code },
    },
    201
  );
});

// ============================================
// LOCALIZATION
// ============================================

interface LocalizedString {
  id: string;
  stringKey: string;
  category: string | null;
  context: string | null;
  baseLanguage: string;
  baseText: string;
  basePluralForms: Record<string, string> | null;
  characterLimit: number | null;
  hasVariables: boolean;
  variableDefinitions: Record<string, unknown> | null;
  isTranslatable: boolean;
  priority: number;
}

// Get localized strings
settingsRoutes.get('/localization', async (c) => {
  const db = c.env.DB;
  const category = c.req.query('category');
  const language = c.req.query('language') || 'en';
  const limit = Math.min(parseInt(c.req.query('limit') || '100'), 500);
  const offset = parseInt(c.req.query('offset') || '0');

  let query = `
    SELECT ls.*, lt.translated_text, lt.status as translation_status
    FROM localized_strings ls
    LEFT JOIN localization_translations lt ON ls.id = lt.string_id AND lt.language_code = ?
  `;
  const params: unknown[] = [language];

  if (category) {
    query += ' WHERE ls.category = ?';
    params.push(category);
  }

  query += ' ORDER BY ls.category, ls.string_key LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();

  const strings = result.results.map((row) => ({
    id: row.id as string,
    stringKey: row.string_key as string,
    category: row.category as string | null,
    context: row.context as string | null,
    baseText: row.base_text as string,
    translatedText: row.translated_text as string | null,
    translationStatus: row.translation_status as string | null,
    hasVariables: (row.has_variables as number) === 1,
  }));

  return c.json({
    success: true,
    data: {
      strings,
      language,
      pagination: { limit, offset },
    },
  });
});

// Get single localized string
settingsRoutes.get('/localization/:key', async (c) => {
  const db = c.env.DB;
  const key = c.req.param('key');

  const result = await db
    .prepare('SELECT * FROM localized_strings WHERE string_key = ?')
    .bind(key)
    .first();

  if (!result) {
    throw new HTTPException(404, { message: 'String key not found' });
  }

  // Get all translations
  const translations = await db
    .prepare(
      `SELECT language_code, translated_text, status, translator_id
       FROM localization_translations WHERE string_id = ?`
    )
    .bind(result.id)
    .all();

  const localizedString: LocalizedString = {
    id: result.id as string,
    stringKey: result.string_key as string,
    category: result.category as string | null,
    context: result.context as string | null,
    baseLanguage: result.base_language as string,
    baseText: result.base_text as string,
    basePluralForms: parseJsonField<Record<string, string> | null>(result.base_plural_forms, null),
    characterLimit: result.character_limit as number | null,
    hasVariables: (result.has_variables as number) === 1,
    variableDefinitions: parseJsonField<Record<string, unknown> | null>(result.variable_definitions, null),
    isTranslatable: (result.is_translatable as number) === 1,
    priority: result.priority as number,
  };

  return c.json({
    success: true,
    data: {
      string: localizedString,
      translations: translations.results.map((t) => ({
        languageCode: t.language_code,
        translatedText: t.translated_text,
        status: t.status,
        translatorId: t.translator_id,
      })),
    },
  });
});

// Create localized string
settingsRoutes.post('/localization', authMiddleware, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  if (!body.stringKey || !body.baseText) {
    throw new HTTPException(400, { message: 'stringKey and baseText are required' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO localized_strings (
        id, string_key, category, context, base_language, base_text,
        base_plural_forms, character_limit, has_variables, variable_definitions,
        is_translatable, priority, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      body.stringKey,
      body.category || null,
      body.context || null,
      body.baseLanguage || 'en',
      body.baseText,
      body.basePluralForms ? JSON.stringify(body.basePluralForms) : null,
      body.characterLimit || null,
      body.hasVariables ? 1 : 0,
      body.variableDefinitions ? JSON.stringify(body.variableDefinitions) : null,
      body.isTranslatable !== false ? 1 : 0,
      body.priority || 5,
      now,
      now
    )
    .run();

  return c.json(
    {
      success: true,
      data: { id, stringKey: body.stringKey },
    },
    201
  );
});

// Add/update translation
settingsRoutes.put('/localization/:key/translate', authMiddleware, async (c) => {
  const { userId } = c.var;
  const db = c.env.DB;
  const key = c.req.param('key');
  const body = await c.req.json();

  if (!body.languageCode || !body.translatedText) {
    throw new HTTPException(400, { message: 'languageCode and translatedText are required' });
  }

  const str = await db
    .prepare('SELECT id FROM localized_strings WHERE string_key = ?')
    .bind(key)
    .first();

  if (!str) {
    throw new HTTPException(404, { message: 'String key not found' });
  }

  const stringId = str.id as string;
  const now = new Date().toISOString();

  // Check if translation exists
  const existing = await db
    .prepare(
      'SELECT id FROM localization_translations WHERE string_id = ? AND language_code = ?'
    )
    .bind(stringId, body.languageCode)
    .first();

  if (existing) {
    await db
      .prepare(
        `UPDATE localization_translations
         SET translated_text = ?, status = ?, translator_id = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(
        body.translatedText,
        body.status || 'DRAFT',
        userId,
        now,
        existing.id
      )
      .run();

    return c.json({
      success: true,
      data: { message: 'Translation updated' },
    });
  } else {
    const id = crypto.randomUUID();

    await db
      .prepare(
        `INSERT INTO localization_translations (
          id, string_id, language_code, translated_text, status, translator_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        stringId,
        body.languageCode,
        body.translatedText,
        body.status || 'DRAFT',
        userId,
        now,
        now
      )
      .run();

    return c.json(
      {
        success: true,
        data: { id, message: 'Translation added' },
      },
      201
    );
  }
});

// Get available languages
settingsRoutes.get('/languages', async (c) => {
  const db = c.env.DB;

  const result = await db
    .prepare(
      `SELECT DISTINCT language_code,
              COUNT(*) as translation_count
       FROM localization_translations
       GROUP BY language_code
       ORDER BY translation_count DESC`
    )
    .all();

  // Also get total strings count
  const total = await db
    .prepare('SELECT COUNT(*) as count FROM localized_strings WHERE is_translatable = 1')
    .first();

  const totalStrings = (total?.count as number) || 0;

  const languages = result.results.map((row) => ({
    code: row.language_code,
    translationCount: row.translation_count,
    completionPercent: totalStrings > 0
      ? Math.round(((row.translation_count as number) / totalStrings) * 100)
      : 0,
  }));

  // Add English as base
  languages.unshift({
    code: 'en',
    translationCount: totalStrings,
    completionPercent: 100,
  });

  return c.json({
    success: true,
    data: {
      languages,
      totalStrings,
    },
  });
});

export default settingsRoutes;
