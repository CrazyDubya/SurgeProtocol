/**
 * Surge Protocol - Settings Service
 *
 * Manages player preferences, game configuration, difficulty presets,
 * and localization strings/translations.
 */

import { BaseService } from '../base/index';

// =============================================================================
// TYPES
// =============================================================================

export interface PlayerSettings {
    id: string;
    playerId: string;
    resolution: string | null;
    fullscreenMode: string | null;
    vsync: boolean;
    frameRateLimit: number;
    brightness: number;
    gamma: number;
    qualityPreset: string | null;
    textureQuality: number;
    shadowQuality: number;
    effectsQuality: number;
    drawDistance: number;
    antialiasing: string | null;
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    voiceVolume: number;
    ambientVolume: number;
    mouseSensitivity: number;
    invertY: boolean;
    controllerVibration: boolean;
    keyBindings: Record<string, string> | null;
    controllerBindings: Record<string, string> | null;
    autoSaveFrequency: number;
    difficultyDefault: string | null;
    tutorialEnabled: boolean;
    hintsEnabled: boolean;
    subtitlesEnabled: boolean;
    subtitleSize: number;
    colorblindMode: string | null;
    screenShake: number;
    motionBlur: boolean;
    flashReduction: boolean;
    textToSpeech: boolean;
    languageUi: string;
    languageAudio: string;
    languageSubtitles: string;
    createdAt: string;
    updatedAt: string;
}

export interface GameConfig {
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

export interface DifficultyDefinition {
    id: string;
    code: string;
    name: string;
    description: string | null;
    damageToPlayer: number;
    damageFromPlayer: number;
    enemyHealth: number;
    enemyAccuracy: number;
    enemyAggression: number;
    creditRewards: number;
    xpRewards: number;
    lootQuality: number;
    prices: number;
    healingEffectiveness: number;
    humanityLossRate: number;
    addictionSeverity: number;
    ratingGain: number;
    ratingLoss: number;
    permadeath: boolean;
    ironmanMode: boolean;
    achievementEligible: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LocalizedString {
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

// =============================================================================
// HELPERS
// =============================================================================

function parseJsonField<T>(value: unknown, defaultValue: T): T {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'string') {
        try { return JSON.parse(value) as T; } catch { return defaultValue; }
    }
    return value as T;
}

/** Map camelCase body fields to snake_case DB columns for player settings. */
const SETTINGS_FIELD_MAP: Record<string, string> = {
    resolution: 'resolution', fullscreenMode: 'fullscreen_mode', vsync: 'vsync',
    frameRateLimit: 'frame_rate_limit', brightness: 'brightness', gamma: 'gamma',
    qualityPreset: 'quality_preset', textureQuality: 'texture_quality',
    shadowQuality: 'shadow_quality', effectsQuality: 'effects_quality',
    drawDistance: 'draw_distance', antialiasing: 'antialiasing',
    masterVolume: 'master_volume', musicVolume: 'music_volume', sfxVolume: 'sfx_volume',
    voiceVolume: 'voice_volume', ambientVolume: 'ambient_volume',
    mouseSensitivity: 'mouse_sensitivity', invertY: 'invert_y',
    controllerVibration: 'controller_vibration', keyBindings: 'key_bindings',
    controllerBindings: 'controller_bindings', autoSaveFrequency: 'auto_save_frequency',
    difficultyDefault: 'difficulty_default', tutorialEnabled: 'tutorial_enabled',
    hintsEnabled: 'hints_enabled', subtitlesEnabled: 'subtitles_enabled',
    subtitleSize: 'subtitle_size', colorblindMode: 'colorblind_mode',
    screenShake: 'screen_shake', motionBlur: 'motion_blur',
    flashReduction: 'flash_reduction', textToSpeech: 'text_to_speech',
    languageUi: 'language_ui', languageAudio: 'language_audio',
    languageSubtitles: 'language_subtitles',
};

function mapRowToPlayerSettings(row: Record<string, unknown>): PlayerSettings {
    return {
        id: row.id as string,
        playerId: row.player_id as string,
        resolution: row.resolution as string | null,
        fullscreenMode: row.fullscreen_mode as string | null,
        vsync: (row.vsync as number) === 1,
        frameRateLimit: row.frame_rate_limit as number,
        brightness: row.brightness as number,
        gamma: row.gamma as number,
        qualityPreset: row.quality_preset as string | null,
        textureQuality: row.texture_quality as number,
        shadowQuality: row.shadow_quality as number,
        effectsQuality: row.effects_quality as number,
        drawDistance: row.draw_distance as number,
        antialiasing: row.antialiasing as string | null,
        masterVolume: row.master_volume as number,
        musicVolume: row.music_volume as number,
        sfxVolume: row.sfx_volume as number,
        voiceVolume: row.voice_volume as number,
        ambientVolume: row.ambient_volume as number,
        mouseSensitivity: row.mouse_sensitivity as number,
        invertY: (row.invert_y as number) === 1,
        controllerVibration: (row.controller_vibration as number) === 1,
        keyBindings: parseJsonField<Record<string, string> | null>(row.key_bindings, null),
        controllerBindings: parseJsonField<Record<string, string> | null>(row.controller_bindings, null),
        autoSaveFrequency: row.auto_save_frequency as number,
        difficultyDefault: row.difficulty_default as string | null,
        tutorialEnabled: (row.tutorial_enabled as number) === 1,
        hintsEnabled: (row.hints_enabled as number) === 1,
        subtitlesEnabled: (row.subtitles_enabled as number) === 1,
        subtitleSize: row.subtitle_size as number,
        colorblindMode: row.colorblind_mode as string | null,
        screenShake: row.screen_shake as number,
        motionBlur: (row.motion_blur as number) === 1,
        flashReduction: (row.flash_reduction as number) === 1,
        textToSpeech: (row.text_to_speech as number) === 1,
        languageUi: row.language_ui as string,
        languageAudio: row.language_audio as string,
        languageSubtitles: row.language_subtitles as string,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}

function mapRowToGameConfig(row: Record<string, unknown>): GameConfig {
    return {
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
    };
}

function mapRowToDifficulty(row: Record<string, unknown>): DifficultyDefinition {
    return {
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
    };
}

// =============================================================================
// SETTINGS SERVICE
// =============================================================================

export class SettingsService extends BaseService {

    // ---------------------------------------------------------------------------
    // PLAYER SETTINGS
    // ---------------------------------------------------------------------------

    async getPlayerSettings(userId: string): Promise<PlayerSettings | null> {
        const row = await this.db
            .prepare('SELECT ps.* FROM player_settings ps JOIN player_profiles pp ON ps.player_id = pp.id WHERE pp.user_id = ?')
            .bind(userId).first();
        return row ? mapRowToPlayerSettings(row as Record<string, unknown>) : null;
    }

    async updatePlayerSettings(userId: string, body: Record<string, unknown>): Promise<{ created: boolean; id?: string }> {
        const player = await this.db.prepare('SELECT id FROM player_profiles WHERE user_id = ?').bind(userId).first();
        if (!player) throw new Error('Player profile not found');
        const playerId = player.id as string;
        const existing = await this.db.prepare('SELECT id FROM player_settings WHERE player_id = ?').bind(playerId).first();
        const now = new Date().toISOString();

        if (existing) {
            const updates: string[] = [];
            const values: unknown[] = [];
            for (const [jsKey, dbKey] of Object.entries(SETTINGS_FIELD_MAP)) {
                if (body[jsKey] !== undefined) {
                    updates.push(`${dbKey} = ?`);
                    let value = body[jsKey];
                    if (typeof value === 'boolean') value = value ? 1 : 0;
                    if (jsKey === 'keyBindings' || jsKey === 'controllerBindings') value = value ? JSON.stringify(value) : null;
                    values.push(value);
                }
            }
            if (updates.length > 0) {
                updates.push('updated_at = ?');
                values.push(now, playerId);
                await this.db.prepare(`UPDATE player_settings SET ${updates.join(', ')} WHERE player_id = ?`).bind(...values).run();
            }
            return { created: false };
        }

        const id = crypto.randomUUID();
        await this.db.prepare(
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
        ).bind(
            id, playerId,
            body.resolution || null, body.fullscreenMode || null,
            body.vsync !== undefined ? (body.vsync ? 1 : 0) : 1,
            body.frameRateLimit || 60, body.brightness || 1.0, body.gamma || 1.0,
            body.qualityPreset || null, body.textureQuality || 3, body.shadowQuality || 3,
            body.effectsQuality || 3, body.drawDistance || 3, body.antialiasing || null,
            body.masterVolume || 1.0, body.musicVolume || 0.8, body.sfxVolume || 1.0,
            body.voiceVolume || 1.0, body.ambientVolume || 0.7, body.mouseSensitivity || 1.0,
            body.invertY !== undefined ? (body.invertY ? 1 : 0) : 0,
            body.controllerVibration !== undefined ? (body.controllerVibration ? 1 : 0) : 1,
            body.keyBindings ? JSON.stringify(body.keyBindings) : null,
            body.controllerBindings ? JSON.stringify(body.controllerBindings) : null,
            body.autoSaveFrequency || 5, body.difficultyDefault || null,
            body.tutorialEnabled !== undefined ? (body.tutorialEnabled ? 1 : 0) : 1,
            body.hintsEnabled !== undefined ? (body.hintsEnabled ? 1 : 0) : 1,
            body.subtitlesEnabled !== undefined ? (body.subtitlesEnabled ? 1 : 0) : 1,
            body.subtitleSize || 2, body.colorblindMode || null, body.screenShake || 1.0,
            body.motionBlur !== undefined ? (body.motionBlur ? 1 : 0) : 1,
            body.flashReduction !== undefined ? (body.flashReduction ? 1 : 0) : 0,
            body.textToSpeech !== undefined ? (body.textToSpeech ? 1 : 0) : 0,
            body.languageUi || 'en', body.languageAudio || 'en', body.languageSubtitles || 'en',
            now, now
        ).run();
        return { created: true, id };
    }

    async resetPlayerSettings(userId: string): Promise<boolean> {
        const result = await this.db.prepare(
            'DELETE FROM player_settings WHERE player_id IN (SELECT id FROM player_profiles WHERE user_id = ?)'
        ).bind(userId).run();
        return result.meta.changes > 0;
    }

    // ---------------------------------------------------------------------------
    // GAME CONFIGURATION
    // ---------------------------------------------------------------------------

    async getGameConfigs(category?: string): Promise<{ configs: GameConfig[] | Record<string, GameConfig[]>; total: number }> {
        let query = 'SELECT * FROM game_config';
        const params: string[] = [];
        if (category) { query += ' WHERE config_category = ?'; params.push(category); }
        query += ' ORDER BY config_category, config_key';
        const result = await this.db.prepare(query).bind(...params).all();
        const configs = result.results.map(r => mapRowToGameConfig(r as Record<string, unknown>));

        if (category) return { configs, total: configs.length };

        const grouped = configs.reduce((acc, config) => {
            const cat = config.configCategory || 'uncategorized';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(config);
            return acc;
        }, {} as Record<string, GameConfig[]>);
        return { configs: grouped, total: configs.length };
    }

    async getGameConfig(key: string): Promise<GameConfig | null> {
        const row = await this.db.prepare('SELECT * FROM game_config WHERE config_key = ?').bind(key).first();
        return row ? mapRowToGameConfig(row as Record<string, unknown>) : null;
    }

    async createGameConfig(body: Record<string, unknown>): Promise<string> {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.prepare(
            `INSERT INTO game_config (
        id, config_key, config_category, description, value_type,
        current_value, default_value, min_value, max_value, allowed_values,
        requires_restart, is_tunable, a_b_test_eligible,
        environment_overrides, platform_overrides, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            id, body.configKey, body.configCategory || null, body.description || null,
            body.valueType || null, body.currentValue || null, body.defaultValue || null,
            body.minValue || null, body.maxValue || null,
            body.allowedValues ? JSON.stringify(body.allowedValues) : null,
            body.requiresRestart ? 1 : 0, body.isTunable !== false ? 1 : 0,
            body.abTestEligible ? 1 : 0,
            body.environmentOverrides ? JSON.stringify(body.environmentOverrides) : null,
            body.platformOverrides ? JSON.stringify(body.platformOverrides) : null,
            now, now
        ).run();
        return id;
    }

    async updateGameConfig(key: string, body: Record<string, unknown>): Promise<{ requiresRestart: boolean }> {
        const existing = await this.db.prepare('SELECT * FROM game_config WHERE config_key = ?').bind(key).first();
        if (!existing) throw new Error('Config key not found');

        // Validate value constraints
        if (body.currentValue !== undefined) {
            const allowedValues = parseJsonField<string[] | null>(existing.allowed_values, null);
            if (allowedValues && !allowedValues.includes(body.currentValue as string)) {
                throw new Error(`Value must be one of: ${allowedValues.join(', ')}`);
            }
            const min = existing.min_value ? parseFloat(existing.min_value as string) : null;
            const max = existing.max_value ? parseFloat(existing.max_value as string) : null;
            const numValue = parseFloat(body.currentValue as string);
            if (!isNaN(numValue)) {
                if (min !== null && numValue < min) throw new Error(`Value must be >= ${min}`);
                if (max !== null && numValue > max) throw new Error(`Value must be <= ${max}`);
            }
        }

        const updates: string[] = [];
        const values: unknown[] = [];
        if (body.currentValue !== undefined) { updates.push('current_value = ?'); values.push(body.currentValue); }
        if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
        if (body.environmentOverrides !== undefined) { updates.push('environment_overrides = ?'); values.push(JSON.stringify(body.environmentOverrides)); }
        if (body.platformOverrides !== undefined) { updates.push('platform_overrides = ?'); values.push(JSON.stringify(body.platformOverrides)); }

        if (updates.length > 0) {
            updates.push('updated_at = ?');
            values.push(new Date().toISOString(), key);
            await this.db.prepare(`UPDATE game_config SET ${updates.join(', ')} WHERE config_key = ?`).bind(...values).run();
        }
        return { requiresRestart: (existing.requires_restart as number) === 1 };
    }

    // ---------------------------------------------------------------------------
    // DIFFICULTY DEFINITIONS
    // ---------------------------------------------------------------------------

    async getDifficultyPresets(): Promise<DifficultyDefinition[]> {
        const result = await this.db.prepare('SELECT * FROM difficulty_definitions ORDER BY id').all();
        return result.results.map(r => mapRowToDifficulty(r as Record<string, unknown>));
    }

    async getDifficultyPreset(code: string): Promise<DifficultyDefinition | null> {
        const row = await this.db.prepare('SELECT * FROM difficulty_definitions WHERE code = ?').bind(code).first();
        return row ? mapRowToDifficulty(row as Record<string, unknown>) : null;
    }

    async createDifficultyPreset(body: Record<string, unknown>): Promise<string> {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.prepare(
            `INSERT INTO difficulty_definitions (
        id, code, name, description,
        damage_to_player, damage_from_player, enemy_health, enemy_accuracy, enemy_aggression,
        credit_rewards, xp_rewards, loot_quality, prices,
        healing_effectiveness, humanity_loss_rate, addiction_severity,
        rating_gain, rating_loss, permadeath, ironman_mode, achievement_eligible,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            id, body.code, body.name, body.description || null,
            body.damageToPlayer || 1.0, body.damageFromPlayer || 1.0,
            body.enemyHealth || 1.0, body.enemyAccuracy || 1.0, body.enemyAggression || 1.0,
            body.creditRewards || 1.0, body.xpRewards || 1.0, body.lootQuality || 1.0, body.prices || 1.0,
            body.healingEffectiveness || 1.0, body.humanityLossRate || 1.0, body.addictionSeverity || 1.0,
            body.ratingGain || 1.0, body.ratingLoss || 1.0,
            body.permadeath ? 1 : 0, body.ironmanMode ? 1 : 0,
            body.achievementEligible !== false ? 1 : 0,
            now, now
        ).run();
        return id;
    }

    // ---------------------------------------------------------------------------
    // LOCALIZATION
    // ---------------------------------------------------------------------------

    async getLocalizedStrings(opts: { category?: string; language?: string; limit?: number; offset?: number }) {
        const language = opts.language || 'en';
        const limit = Math.min(opts.limit || 100, 500);
        const offset = opts.offset || 0;

        let query = `SELECT ls.*, lt.translated_text, lt.status as translation_status
      FROM localized_strings ls
      LEFT JOIN localization_translations lt ON ls.id = lt.string_id AND lt.language_code = ?`;
        const params: unknown[] = [language];
        if (opts.category) { query += ' WHERE ls.category = ?'; params.push(opts.category); }
        query += ' ORDER BY ls.category, ls.string_key LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const result = await this.db.prepare(query).bind(...params).all();
        return {
            strings: result.results.map(row => ({
                id: row.id as string,
                stringKey: row.string_key as string,
                category: row.category as string | null,
                context: row.context as string | null,
                baseText: row.base_text as string,
                translatedText: row.translated_text as string | null,
                translationStatus: row.translation_status as string | null,
                hasVariables: (row.has_variables as number) === 1,
            })),
            language,
            pagination: { limit, offset },
        };
    }

    async getLocalizedString(key: string): Promise<{ string: LocalizedString; translations: unknown[] } | null> {
        const result = await this.db.prepare('SELECT * FROM localized_strings WHERE string_key = ?').bind(key).first();
        if (!result) return null;

        const translations = await this.db.prepare(
            'SELECT language_code, translated_text, status, translator_id FROM localization_translations WHERE string_id = ?'
        ).bind(result.id).all();

        return {
            string: {
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
            },
            translations: translations.results.map(t => ({
                languageCode: t.language_code,
                translatedText: t.translated_text,
                status: t.status,
                translatorId: t.translator_id,
            })),
        };
    }

    async createLocalizedString(body: Record<string, unknown>): Promise<string> {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.prepare(
            `INSERT INTO localized_strings (
        id, string_key, category, context, base_language, base_text,
        base_plural_forms, character_limit, has_variables, variable_definitions,
        is_translatable, priority, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            id, body.stringKey, body.category || null, body.context || null,
            body.baseLanguage || 'en', body.baseText,
            body.basePluralForms ? JSON.stringify(body.basePluralForms) : null,
            body.characterLimit || null, body.hasVariables ? 1 : 0,
            body.variableDefinitions ? JSON.stringify(body.variableDefinitions) : null,
            body.isTranslatable !== false ? 1 : 0, body.priority || 5, now, now
        ).run();
        return id;
    }

    async upsertTranslation(key: string, languageCode: string, translatedText: string, status: string, userId: string): Promise<{ created: boolean; id?: string }> {
        const str = await this.db.prepare('SELECT id FROM localized_strings WHERE string_key = ?').bind(key).first();
        if (!str) throw new Error('String key not found');
        const stringId = str.id as string;
        const now = new Date().toISOString();

        const existing = await this.db.prepare(
            'SELECT id FROM localization_translations WHERE string_id = ? AND language_code = ?'
        ).bind(stringId, languageCode).first();

        if (existing) {
            await this.db.prepare(
                'UPDATE localization_translations SET translated_text = ?, status = ?, translator_id = ?, updated_at = ? WHERE id = ?'
            ).bind(translatedText, status || 'DRAFT', userId, now, existing.id).run();
            return { created: false };
        }

        const id = crypto.randomUUID();
        await this.db.prepare(
            `INSERT INTO localization_translations (id, string_id, language_code, translated_text, status, translator_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, stringId, languageCode, translatedText, status || 'DRAFT', userId, now, now).run();
        return { created: true, id };
    }

    async getAvailableLanguages() {
        const result = await this.db.prepare(
            'SELECT DISTINCT language_code, COUNT(*) as translation_count FROM localization_translations GROUP BY language_code ORDER BY translation_count DESC'
        ).all();

        const total = await this.db.prepare('SELECT COUNT(*) as count FROM localized_strings WHERE is_translatable = 1').first();
        const totalStrings = (total?.count as number) || 0;

        const languages = result.results.map(row => ({
            code: row.language_code,
            translationCount: row.translation_count,
            completionPercent: totalStrings > 0 ? Math.round(((row.translation_count as number) / totalStrings) * 100) : 0,
        }));

        languages.unshift({ code: 'en', translationCount: totalStrings, completionPercent: 100 });
        return { languages, totalStrings };
    }
}
