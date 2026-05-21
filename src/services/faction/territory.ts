import type { D1Database, DurableObjectNamespace } from '@cloudflare/workers-types';
import { getFactionReputation, updateFactionReputation } from '../../db';

export type ContributionType = 'COMBAT' | 'SUPPLY' | 'INTEL' | 'SABOTAGE' | 'MISSION';

export interface ContributionPayload {
    contributionType: ContributionType;
    value: number;
    objectiveId?: string;
    characterName?: string;
}

export class TerritoryService {
    constructor(
        private db: D1Database,
        private warTheaterDO: DurableObjectNamespace
    ) { }

    /**
     * Get all active faction wars.
     */
    async getActiveWars() {
        const wars = await this.db
            .prepare(
                `SELECT fw.*,
                af.name as attacker_name,
                df.name as defender_name
         FROM faction_wars fw
         JOIN factions af ON fw.attacker_faction_id = af.id
         JOIN factions df ON fw.defender_faction_id = df.id
         WHERE fw.status = 'ACTIVE'
         ORDER BY fw.started_at DESC`
            )
            .all();

        return {
            wars: wars.results,
            count: wars.results.length,
        };
    }

    /**
     * Submit a contribution to an active war.
     */
    async contributeToWar(characterId: string, warId: string, contribution: ContributionPayload) {
        // Get character's faction affiliation for this war
        const war = await this.db
            .prepare(
                `SELECT * FROM faction_wars WHERE id = ? AND status = 'ACTIVE'`
            )
            .bind(warId)
            .first<{
                id: string;
                attacker_faction_id: string;
                defender_faction_id: string;
                durable_object_id: string;
            }>();

        if (!war) throw new Error('Active war not found');

        // Check character's faction standing
        const attackerRep = await getFactionReputation(
            this.db,
            characterId,
            war.attacker_faction_id
        );
        const defenderRep = await getFactionReputation(
            this.db,
            characterId,
            war.defender_faction_id
        );

        // Determine which side the character is on
        let factionId: string;
        if (attackerRep && attackerRep.is_member === 1) {
            factionId = war.attacker_faction_id;
        } else if (defenderRep && defenderRep.is_member === 1) {
            factionId = war.defender_faction_id;
        } else {
            // Allow mercenary contributions based on reputation
            const attackerValue = attackerRep?.reputation_value ?? 0;
            const defenderValue = defenderRep?.reputation_value ?? 0;

            if (attackerValue > defenderValue && attackerValue >= 20) {
                factionId = war.attacker_faction_id;
            } else if (defenderValue > attackerValue && defenderValue >= 20) {
                factionId = war.defender_faction_id;
            } else {
                throw new Error('Must be a member or have FRIENDLY standing with a faction to contribute');
            }
        }

        // Get character name if not provided
        if (!contribution.characterName) {
            const character = await this.db
                .prepare('SELECT handle, street_name FROM characters WHERE id = ?')
                .bind(characterId)
                .first<{ handle: string | null; street_name: string | null }>();

            contribution.characterName = character?.street_name ?? character?.handle ?? 'Unknown';
        }

        // Send contribution to WarTheater Durable Object
        const doId = this.warTheaterDO.idFromName(war.durable_object_id || warId);
        const stub = this.warTheaterDO.get(doId);

        const response = await stub.fetch(new Request('http://internal/contribute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                characterId,
                characterName: contribution.characterName,
                factionId,
                contributionType: contribution.contributionType,
                value: contribution.value,
                objectiveId: contribution.objectiveId,
            }),
        }));

        const result = await response.json() as {
            success: boolean;
            contribution?: unknown;
            factionScore?: number;
            error?: string;
        };

        if (!result.success) {
            throw new Error(result.error ?? 'Failed to process contribution');
        }

        // Update character's faction reputation (10% of contribution value)
        const reputationGain = Math.ceil(contribution.value * 0.1);
        await updateFactionReputation(this.db, characterId, factionId, reputationGain);

        return {
            contribution: result.contribution,
            factionScore: result.factionScore,
            reputationGained: reputationGain,
        };
    }
    /**
     * Process a tick for an active war.
     * This resolves immediate combat rounds based on power levels.
     */
    async processWarTick(warId: string) {
        // 1. Get War State
        const war = await this.db.prepare(
            `SELECT * FROM faction_wars WHERE id = ? AND status = 'ACTIVE'`
        ).bind(warId).first<{
            id: string;
            attacker_faction_id: string;
            defender_faction_id: string;
            attacker_score: number;
            defender_score: number;
            started_at: string;
            durable_object_id: string;
        }>();

        if (!war) return { active: false };

        // 2. Call WarTheater DO for resolution logic (encapsulated state)
        // The DO maintains the high-frequency state (unit positions, momentary buffs)
        // We trigger it to "commit" a round of combat to the DB if needed.

        const doId = this.warTheaterDO.idFromName(war.durable_object_id || warId);
        const stub = this.warTheaterDO.get(doId);

        const response = await stub.fetch(new Request('http://internal/tick', {
            method: 'POST',
        }));

        const result = await response.json() as {
            tickProcessed: boolean;
            attackerScore: number;
            defenderScore: number;
            warEnded?: boolean;
            winnerId?: string;
        };

        // 3. Update DB state if DO reports changes
        if (result.tickProcessed) {
            await this.db.prepare(`
                UPDATE faction_wars 
                SET attacker_score = ?, defender_score = ?, last_tick_at = datetime('now')
                WHERE id = ?
            `).bind(result.attackerScore, result.defenderScore, warId).run();
        }

        // 4. Handle War End
        if (result.warEnded && result.winnerId) {
            await this.resolveWar(warId, result.winnerId);
        }

        return { active: true, ...result };
    }

    /**
     * Finalize a war and update territory ownership.
     */
    private async resolveWar(warId: string, winnerId: string) {
        // Get war details for territory update
        const war = await this.db.prepare(
            `SELECT target_location_id FROM faction_wars WHERE id = ?`
        ).bind(warId).first<{ target_location_id: string }>();

        if (!war) return;

        await this.db.batch([
            // End War
            this.db.prepare(`
                UPDATE faction_wars 
                SET status = 'COMPLETED', ended_at = datetime('now'), winner_faction_id = ?
                WHERE id = ?
            `).bind(winnerId, warId),

            // Update Territory Control
            this.db.prepare(`
                UPDATE locations 
                SET controlling_faction_id = ? 
                WHERE id = ?
            `).bind(winnerId, war.target_location_id)
        ]);
    }
}
