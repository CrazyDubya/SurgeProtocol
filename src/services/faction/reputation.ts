import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import {
    getAllFactions,
    getFactionReputation,
} from '../../db'; // Assuming these are exported from src/db
// import { nanoid } from 'nanoid';

export type ReputationTier = 'HOSTILE' | 'UNFRIENDLY' | 'NEUTRAL' | 'FRIENDLY' | 'ALLIED' | 'REVERED';

export class ReputationService {
    constructor(
        private db: D1Database,
        private cache: KVNamespace
    ) { }

    /**
     * List all factions with their war status.
     */
    async listFactions() {
        // Try cache first
        const cached = await this.cache.get<any[]>('factions:all', 'json');
        if (cached) {
            return { factions: cached, cached: true };
        }

        const factions = await getAllFactions(this.db);

        // Get war involvement for each faction
        const factionsWithWars = await Promise.all(
            factions.map(async (faction) => {
                const activeWars = await this.db
                    .prepare(
                        `SELECT COUNT(*) as count FROM faction_wars
             WHERE (attacker_faction_id = ? OR defender_faction_id = ?)
             AND status = 'ACTIVE'`
                    )
                    .bind(faction.id, faction.id)
                    .first<{ count: number }>();

                return {
                    id: faction.id,
                    code: faction.code,
                    name: faction.name,
                    factionType: faction.faction_type,
                    description: faction.description,
                    isJoinable: faction.is_joinable === 1,
                    isHostileDefault: faction.is_hostile_default === 1,
                    activeWars: activeWars?.count ?? 0,
                };
            })
        );

        // Cache for 5 minutes
        await this.cache.put('factions:all', JSON.stringify(factionsWithWars), {
            expirationTtl: 300,
        });

        return { factions: factionsWithWars, cached: false };
    }

    /**
     * Get detailed faction info including relationships and stats.
     */
    async getFactionDetails(factionId: string) {
        const faction = await this.db
            .prepare('SELECT * FROM factions WHERE id = ?')
            .bind(factionId)
            .first();

        if (!faction) return null;

        // Get faction relationships
        const relationships = await this.db
            .prepare(
                `SELECT fr.*, f.name as target_faction_name
         FROM faction_relationships fr
         JOIN factions f ON fr.target_faction_id = f.id
         WHERE fr.source_faction_id = ?`
            )
            .bind(factionId)
            .all();

        // Get active wars
        const wars = await this.db
            .prepare(
                `SELECT fw.*,
                af.name as attacker_name,
                df.name as defender_name
         FROM faction_wars fw
         JOIN factions af ON fw.attacker_faction_id = af.id
         JOIN factions df ON fw.defender_faction_id = df.id
         WHERE (fw.attacker_faction_id = ? OR fw.defender_faction_id = ?)
         AND fw.status = 'ACTIVE'`
            )
            .bind(factionId, factionId)
            .all();

        // Get top contributors
        const topContributors = await this.db
            .prepare(
                `SELECT c.handle, c.street_name, cr.reputation_value, cr.missions_completed_for
         FROM character_reputations cr
         JOIN characters c ON cr.character_id = c.id
         WHERE cr.faction_id = ?
         ORDER BY cr.reputation_value DESC
         LIMIT 10`
            )
            .bind(factionId)
            .all();

        // Get faction stats
        const stats = await this.db
            .prepare(
                `SELECT
           COUNT(*) as total_members,
           AVG(reputation_value) as avg_reputation,
           SUM(missions_completed_for) as total_missions
         FROM character_reputations
         WHERE faction_id = ? AND is_member = 1`
            )
            .bind(factionId)
            .first();

        return {
            faction,
            relationships: relationships.results,
            activeWars: wars.results,
            topContributors: topContributors.results,
            stats,
        };
    }

    /**
     * Get a character's standing with a faction.
     */
    async getStanding(characterId: string, factionId: string) {
        const reputation = await getFactionReputation(this.db, characterId, factionId);

        if (!reputation) {
            // Return default standing structure
            return {
                standing: {
                    factionId,
                    characterId,
                    reputationValue: 0,
                    reputationTier: 'NEUTRAL',
                    isMember: false,
                    rankInFaction: null,
                    missionsCompletedFor: 0,
                    lifetimeReputationGained: 0,
                    lifetimeReputationLost: 0,
                    lastInteraction: null,
                }
            };
        }

        // Get available perks for current tier
        const perks = await this.db
            .prepare(
                `SELECT * FROM faction_perks
         WHERE faction_id = ?
         AND required_reputation_tier <= ?
         ORDER BY required_reputation_tier ASC`
            )
            .bind(factionId, reputation.reputation_tier)
            .all();

        // Get next tier requirements
        const nextTier = this.getNextTier(reputation.reputation_tier as ReputationTier);
        const nextTierThreshold = this.getTierThreshold(nextTier);

        return {
            standing: {
                factionId,
                characterId,
                reputationValue: reputation.reputation_value,
                reputationTier: reputation.reputation_tier,
                isMember: reputation.is_member === 1,
                rankInFaction: reputation.rank_in_faction,
                missionsCompletedFor: reputation.missions_completed_for,
                lifetimeReputationGained: reputation.lifetime_reputation_gained,
                lifetimeReputationLost: reputation.lifetime_reputation_lost,
                lastInteraction: reputation.last_interaction,
            },
            perks: perks.results,
            nextTier: nextTier !== reputation.reputation_tier ? {
                tier: nextTier,
                requiredReputation: nextTierThreshold,
                progress: reputation.reputation_value / nextTierThreshold,
            } : null,
        };
    }

    /**
     * Request to join a faction.
     */
    async joinFaction(characterId: string, factionId: string) {
        // Check if faction is joinable
        const faction = await this.db
            .prepare('SELECT * FROM factions WHERE id = ?')
            .bind(factionId)
            .first<{ id: string; is_joinable: number; name: string }>();

        if (!faction) throw new Error('Faction not found');
        if (faction.is_joinable !== 1) throw new Error('This faction is not accepting new members');

        // Check current standing
        const reputation = await getFactionReputation(this.db, characterId, factionId);

        if (reputation?.is_member === 1) throw new Error('Already a member of this faction');

        // Check if meets minimum reputation (FRIENDLY = 20+)
        const repValue = reputation?.reputation_value ?? 0;
        if (repValue < 20) {
            throw new Error(`Need FRIENDLY standing (20+) to join. Current: ${repValue}`);
        }

        // Join the faction
        if (reputation) {
            await this.db
                .prepare(
                    `UPDATE character_reputations
           SET is_member = 1, rank_in_faction = 'INITIATE', updated_at = datetime('now')
           WHERE character_id = ? AND faction_id = ?`
                )
                .bind(characterId, factionId)
                .run();
        } else {
            await this.db
                .prepare(
                    `INSERT INTO character_reputations
           (id, character_id, faction_id, reputation_value, reputation_tier, is_member, rank_in_faction)
           VALUES (?, ?, ?, 20, 'FRIENDLY', 1, 'INITIATE')`
                )
                .bind(crypto.randomUUID(), characterId, factionId)
                .run();
        }

        return {
            message: `Welcome to ${faction.name}`,
            rank: 'INITIATE',
        };
    }

    /**
     * Leave a faction.
     */
    async leaveFaction(characterId: string, factionId: string) {
        const reputation = await getFactionReputation(this.db, characterId, factionId);

        if (!reputation || reputation.is_member !== 1) throw new Error('Not a member of this faction');

        // Leave the faction (reputation penalty)
        await this.db
            .prepare(
                `UPDATE character_reputations
         SET is_member = 0, rank_in_faction = NULL, reputation_value = reputation_value - 10,
             updated_at = datetime('now')
         WHERE character_id = ? AND faction_id = ?`
            )
            .bind(characterId, factionId)
            .run();

        return {
            message: 'You have left the faction',
            reputationPenalty: -10,
        };
    }

    /**
     * Get faction members (leaderboard).
     */
    async getMembers(factionId: string, limit: number = 20, offset: number = 0) {
        const members = await this.db
            .prepare(
                `SELECT
           c.id, c.handle, c.street_name, c.carrier_rating, c.current_tier,
           cr.reputation_value, cr.reputation_tier, cr.rank_in_faction, cr.missions_completed_for
         FROM character_reputations cr
         JOIN characters c ON cr.character_id = c.id
         WHERE cr.faction_id = ?
         ORDER BY cr.reputation_value DESC
         LIMIT ? OFFSET ?`
            )
            .bind(factionId, limit, offset)
            .all();

        const totalCount = await this.db
            .prepare(
                'SELECT COUNT(*) as count FROM character_reputations WHERE faction_id = ?'
            )
            .bind(factionId)
            .first<{ count: number }>();

        return {
            members: members.results,
            count: members.results.length,
            total: totalCount?.count ?? 0,
            pagination: {
                limit,
                offset,
                hasMore: offset + limit < (totalCount?.count ?? 0),
            },
        };
    }

    // --- Helpers ---

    getNextTier(currentTier: ReputationTier): ReputationTier {
        const tiers: ReputationTier[] = ['HOSTILE', 'UNFRIENDLY', 'NEUTRAL', 'FRIENDLY', 'ALLIED', 'REVERED'];
        const currentIndex = tiers.indexOf(currentTier);
        return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1]! : currentTier;
    }

    getTierThreshold(tier: ReputationTier): number {
        const thresholds: Record<ReputationTier, number> = {
            HOSTILE: -60,
            UNFRIENDLY: -20,
            NEUTRAL: 0,
            FRIENDLY: 20,
            ALLIED: 60,
            REVERED: 90,
        };
        return thresholds[tier];
    }
}
