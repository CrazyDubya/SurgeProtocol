import type { D1Database } from '@cloudflare/workers-types';
// import { nanoid } from 'nanoid';
import type {
    CharacterAddiction,
    FormattedAddiction,
} from './types';

export class AddictionService {
    constructor(
        private db: D1Database
    ) { }

    /**
     * Get addiction status for a specific substance.
     */
    async getAddiction(characterId: string, substanceId: string): Promise<FormattedAddiction | null> {
        const result = await this.db.prepare(`
            SELECT * FROM character_addictions 
            WHERE character_id = ? AND substance_id = ?
        `).bind(characterId, substanceId).first<CharacterAddiction>();

        if (!result) return null;
        return this.formatAddiction(result);
    }

    /**
     * Get all addictions for a character.
     */
    async getAllAddictions(characterId: string): Promise<FormattedAddiction[]> {
        const results = await this.db.prepare(`
            SELECT * FROM character_addictions WHERE character_id = ?
        `).bind(characterId).all<CharacterAddiction>();

        return results.results.map(a => this.formatAddiction(a));
    }

    /**
     * Get addiction type definition by substance ID
     */
    private async getAddictionType(substanceId: string): Promise<any | null> {
        return this.db.prepare('SELECT * FROM addiction_types WHERE substance_id = ?').bind(substanceId).first();
    }

    /**
     * Register consumption of a substance.
     * Updates usage count, resets withdrawal timer, potentially increases severity.
     */
    async consumeSubstance(characterId: string, substanceId: string, addictionPotential: number = 10) {
        const addictionType = await this.getAddictionType(substanceId);

        // If not an addictive substance defined in DB, do nothing or handle basic tracking
        if (!addictionType) {
            // Fallback to basic tracking if needed, or just return null
            // For now, let's assume we only track defined addictions
            return null;
        }

        let addiction = await this.getAddiction(characterId, substanceId);
        const now = new Date();

        // Calculate Withdrawal Onset based on DB rule
        const onsetHours = addictionType.withdrawal_onset_hours || 24;
        const withdrawalOnset = new Date(now.getTime() + onsetHours * 60 * 60 * 1000).toISOString();

        if (!addiction) {
            // New addiction track
            const id = `addict-${crypto.randomUUID()}`;

            await this.db.prepare(`
                INSERT INTO character_addictions (
                    id, character_id, substance_id, stage, severity_level,
                    usage_count, last_consumed_at, withdrawal_onset_at, is_in_withdrawal
                ) VALUES (?, ?, ?, 'RECREATIONAL', ?, 1, ?, ?, 0)
            `).bind(
                id, characterId, substanceId, addictionPotential, now.toISOString(), withdrawalOnset
            ).run();
        } else {
            // Update existing
            const newCount = addiction.usage_count + 1;
            let newSeverity = addiction.severity_level + addictionPotential;

            // Determine Stage based on Severity (and optional DB stages)
            let newStage = addiction.stage;

            // Parse stages from DB if available, otherwise use default thresholds
            let thresholds = { recreational: 0, habitual: 25, dependent: 50, acute: 75 };
            if (addictionType.stages) {
                try {
                    const parsed = JSON.parse(addictionType.stages);
                    // Assume parsed has structure like { "HABITUAL": 20, "DEPENDENT": 50 ... }
                    if (parsed.HABITUAL) thresholds.habitual = parsed.HABITUAL;
                    if (parsed.DEPENDENT) thresholds.dependent = parsed.DEPENDENT;
                    if (parsed.ACUTE) thresholds.acute = parsed.ACUTE;
                } catch (e) { /* ignore parse error */ }
            }

            if (newSeverity >= thresholds.acute) newStage = 'ACUTE';
            else if (newSeverity >= thresholds.dependent) newStage = 'DEPENDENT';
            else if (newSeverity >= thresholds.habitual) newStage = 'HABITUAL';
            else newStage = 'RECREATIONAL';

            await this.db.prepare(`
                UPDATE character_addictions 
                SET usage_count = ?, 
                    severity_level = ?, 
                    stage = ?,
                    last_consumed_at = ?, 
                    withdrawal_onset_at = ?,
                    is_in_withdrawal = 0,
                    updated_at = ?
                WHERE id = ?
            `).bind(
                newCount, newSeverity, newStage,
                now.toISOString(), withdrawalOnset, now.toISOString(),
                addiction.id
            ).run();
        }

        return this.getAddiction(characterId, substanceId);
    }


    /**
     * Check and update withdrawal status for all addictions.
     * Should be called periodically or on character load.
     */
    async checkWithdrawal(characterId: string) {
        const addictions = await this.getAllAddictions(characterId);
        const now = new Date();
        const updates: Promise<any>[] = [];

        for (const addiction of addictions) {
            if (addiction.withdrawal_onset_at) {
                const onset = new Date(addiction.withdrawal_onset_at);
                if (now > onset && !addiction.is_in_withdrawal) {
                    // Enter withdrawal
                    updates.push(
                        this.db.prepare(`
                            UPDATE character_addictions 
                            SET is_in_withdrawal = 1, updated_at = ? 
                            WHERE id = ?
                        `).bind(now.toISOString(), addiction.id).run()
                    );
                }
            }
        }

        await Promise.all(updates);
        return this.getAllAddictions(characterId);
    }

    /**
     * Treat an addiction.
     * Decreases severity, potentially removes withdrawal.
     */
    async treatAddiction(characterId: string, substanceId: string, treatmentType: 'MEDICATION' | 'THERAPY' | 'DETOX') {
        const addiction = await this.getAddiction(characterId, substanceId);
        if (!addiction) return null;

        let severityReduction = 0;
        switch (treatmentType) {
            case 'MEDICATION': severityReduction = 10; break;
            case 'THERAPY': severityReduction = 20; break;
            case 'DETOX': severityReduction = 50; break;
        }

        const newSeverity = Math.max(0, addiction.severity_level - severityReduction);
        const now = new Date().toISOString();

        await this.db.prepare(`
            UPDATE character_addictions 
            SET severity_level = ?, 
                is_in_withdrawal = 0,
                updated_at = ?
            WHERE id = ?
        `).bind(newSeverity, now, addiction.id).run();

        // Record history
        await this.db.prepare(`
            INSERT INTO character_status_history (
                id, character_id, type, entity_id, action, notes, created_at
            ) VALUES (?, ?, 'ADDICTION', ?, 'TREATMENT', ?, ?)
        `).bind(
            `hist-${crypto.randomUUID()}`, characterId, substanceId,
            `Treated with ${treatmentType}. Severity reduced to ${newSeverity}.`,
            now
        ).run();

        return this.getAddiction(characterId, substanceId);
    }

    /**
     * List addiction history for a character.
     */
    async listAddictionHistory(characterId: string, limit: number = 20, offset: number = 0) {
        const results = await this.db.prepare(`
            SELECT * FROM character_status_history
            WHERE character_id = ? AND type = 'ADDICTION'
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `).bind(characterId, limit, offset).all<any>();

        return results.results;
    }

    private formatAddiction(row: CharacterAddiction): FormattedAddiction {
        return {
            ...row,
            is_in_withdrawal: row.is_in_withdrawal === 1
        };
    }
}
