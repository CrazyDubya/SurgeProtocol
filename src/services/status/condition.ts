import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
// import { nanoid } from 'nanoid';
import type {
    CharacterCondition,
    ConditionEffect,
    ConditionType,
    ConditionSeverity,
    FormattedCondition
} from './types';

export class ConditionService {
    constructor(
        private db: D1Database,
        _cache?: KVNamespace
    ) { }

    /**
     * Add a condition to a character.
     * If unique, adds a new one. If stacks, updates existing?
     * For now, we'll allow multiple conditions of the same type unless logic handles distinctness.
     * Simple implementation: always add new, unless ID provided to update.
     */
    async addCondition(params: {
        characterId: string;
        type: ConditionType;
        name: string;
        description?: string;
        iconAsset?: string;
        severity?: ConditionSeverity;
        value?: number;
        durationSeconds?: number;
        effects?: ConditionEffect[];
        sourceType?: string;
        sourceId?: string;
    }) {
        const id = `cond-${crypto.randomUUID()}`;
        const now = new Date();

        let expiresAt: string | null = null;
        if (params.durationSeconds) {
            expiresAt = new Date(now.getTime() + params.durationSeconds * 1000).toISOString();
        }

        const effectsData = JSON.stringify(params.effects || []);

        await this.db.prepare(`
            INSERT INTO character_conditions (
                id, character_id, type, name, description, icon_asset,
                severity, value, duration_seconds, expires_at,
                effects_data, source_type, source_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id, params.characterId, params.type, params.name, params.description || null, params.iconAsset || null,
            params.severity || 'MINOR', params.value || 1, params.durationSeconds || null, expiresAt,
            effectsData, params.sourceType || null, params.sourceId || null, now.toISOString(), now.toISOString()
        ).run();

        return this.getCondition(id);
    }

    /**
     * Apply a condition, handling stacking and duration refresh.
     */
    async applyCondition(params: {
        characterId: string;
        code: string;
        sourceType?: string;
        sourceId?: string;
    }) {
        const { characterId, code, sourceType, sourceId } = params;

        // 1. Get condition definition
        const def = await this.db.prepare(`SELECT * FROM condition_definitions WHERE code = ?`).bind(code).first<any>();
        if (!def) return null;

        // 2. Check if already active
        const active = await this.db.prepare(`
            SELECT * FROM character_conditions 
            WHERE character_id = ? AND name = ?
        `).bind(characterId, def.name).first<CharacterCondition>();

        const now = new Date();
        const durationSeconds = def.default_duration_seconds;
        const expiresAt = durationSeconds ? new Date(now.getTime() + durationSeconds * 1000).toISOString() : null;

        if (active) {
            // Handle stacking
            if (def.stacks === 1) {
                const newStacks = Math.min(def.max_stacks || 99, (active.value || 1) + 1);
                await this.db.prepare(`
                    UPDATE character_conditions 
                    SET value = ?, expires_at = ?, updated_at = ? 
                    WHERE id = ?
                `).bind(newStacks, expiresAt, now.toISOString(), active.id).run();
            } else {
                // Refresh duration
                await this.db.prepare(`
                    UPDATE character_conditions 
                    SET expires_at = ?, updated_at = ? 
                    WHERE id = ?
                `).bind(expiresAt, now.toISOString(), active.id).run();
            }
            return this.getCondition(active.id);
        } else {
            // Add new
            return this.addCondition({
                characterId,
                type: def.condition_type as ConditionType,
                name: def.name,
                description: def.description,
                iconAsset: def.icon_asset,
                severity: (def.severity > 7 ? 'SEVERE' : (def.severity > 3 ? 'MODERATE' : 'MINOR')) as ConditionSeverity,
                value: 1,
                durationSeconds,
                effects: def.stat_modifiers ? JSON.parse(def.stat_modifiers) : [],
                sourceType,
                sourceId
            });
        }
    }

    /**
     * Remove a specific condition.
     */
    async removeCondition(conditionId: string) {
        await this.db.prepare(`DELETE FROM character_conditions WHERE id = ?`).bind(conditionId).run();
        return { success: true };
    }

    /**
     * Get a specific condition.
     */
    async getCondition(conditionId: string): Promise<FormattedCondition | null> {
        const result = await this.db.prepare(`SELECT * FROM character_conditions WHERE id = ?`).bind(conditionId).first<CharacterCondition>();
        if (!result) return null;
        return this.formatCondition(result);
    }

    /**
     * Get all active conditions for a character.
     * Automatically cleans up expired conditions.
     */
    async getActiveConditions(characterId: string): Promise<FormattedCondition[]> {
        const now = new Date().toISOString();

        // 1. Delete expired
        await this.db.prepare(`
            DELETE FROM character_conditions 
            WHERE character_id = ? AND expires_at IS NOT NULL AND expires_at < ?
        `).bind(characterId, now).run();

        // 2. Fetch Active
        const results = await this.db.prepare(`
            SELECT * FROM character_conditions WHERE character_id = ?
        `).bind(characterId).all<CharacterCondition>();

        return results.results.map(c => this.formatCondition(c));
    }

    /**
     * Calculate total stat modifiers from all active conditions.
     */
    async getStatModifiers(characterId: string) {
        const conditions = await this.getActiveConditions(characterId);
        const modifiers: Record<string, number> = {};

        for (const cond of conditions) {
            for (const effect of cond.effects) {
                if (effect.type === 'STAT_MOD') {
                    modifiers[effect.target] = (modifiers[effect.target] || 0) + effect.value;
                }
            }
        }

        return modifiers;
    }

    private formatCondition(row: CharacterCondition): FormattedCondition {
        let timeLeftSeconds: number | null = null;
        if (row.expires_at) {
            const expire = new Date(row.expires_at).getTime();
            const now = Date.now();
            timeLeftSeconds = Math.max(0, Math.floor((expire - now) / 1000));
        }

        return {
            ...row,
            effects: JSON.parse(row.effects_data || '[]'),
            timeLeftSeconds
        };
    }
}
