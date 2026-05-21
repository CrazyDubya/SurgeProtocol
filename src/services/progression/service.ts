/**
 * Progression Service
 *
 * Handles all progression-related data access: tracks, specializations,
 * tiers, experience, rating, cross-training, and character track/spec selection.
 */

import type { D1Database } from '@cloudflare/workers-types';
import type {
    TrackRow,
    SpecializationRow,
    TierDefinitionRow,
    CharacterExperienceRow,
    RatingComponentRow,
    CrossTrainingProgressRow,
    CharacterProgressionRow,
    XPCategory,
    AdvancementType,
} from './types';

// =============================================================================
// HELPERS
// =============================================================================

function parseJsonField<T>(value: string | null, defaultValue: T): T {
    if (!value) return defaultValue;
    try {
        return JSON.parse(value) as T;
    } catch {
        return defaultValue;
    }
}

export function formatTrack(row: TrackRow) {
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        tagline: row.tagline,
        description: row.description,
        lore_description: row.lore_description,
        requirements: {
            unlocked_at_tier: row.unlocked_at_tier,
            attributes: parseJsonField<Record<string, number>>(row.prerequisite_attributes, {}),
            missions: parseJsonField<string[]>(row.prerequisite_missions, []),
        },
        mechanics: {
            primary_attribute: row.primary_attribute,
            secondary_attribute: row.secondary_attribute,
            resource_pool_type: row.resource_pool_type,
            signature_mechanic: row.signature_mechanic_description,
        },
        cross_training: {
            natural_allies: parseJsonField<string[]>(row.natural_ally_tracks, []),
            difficult: parseJsonField<string[]>(row.difficult_cross_tracks, []),
        },
        meta: {
            difficulty_rating: row.difficulty_rating,
            playstyle_tags: parseJsonField<string[]>(row.playstyle_tags, []),
            recommended_for_new_players: Boolean(row.recommended_for_new_players),
            display_order: row.display_order,
        },
    };
}

export function formatSpecialization(row: SpecializationRow, trackName?: string) {
    return {
        id: row.id,
        track_id: row.track_id,
        track_name: trackName,
        code: row.code,
        name: row.name,
        tagline: row.tagline,
        description: row.description,
        lore_description: row.lore_description,
        requirements: {
            unlocked_at_tier: row.unlocked_at_tier,
            abilities: parseJsonField<string[]>(row.prerequisite_abilities, []),
            augments: parseJsonField<string[]>(row.prerequisite_augments, []),
            missions: parseJsonField<string[]>(row.prerequisite_missions, []),
        },
        signature: {
            ability_id: row.signature_ability_id,
            passive_id: row.signature_passive_id,
        },
        focus: {
            combat: row.combat_focus,
            stealth: row.stealth_focus,
            social: row.social_focus,
            technical: row.technical_focus,
            mobility: row.mobility_focus,
        },
        meta: {
            difficulty_rating: row.difficulty_rating,
            synergy_specs: parseJsonField<string[]>(row.synergy_specs, []),
            display_order: row.display_order,
        },
    };
}

export function formatTierDefinition(row: TierDefinitionRow) {
    return {
        id: row.id,
        tier_number: row.tier_number,
        name: row.name,
        subtitle: row.subtitle,
        description: row.description,
        requirements: {
            min_rating: row.min_rating,
            min_deliveries: row.min_deliveries,
            min_playtime_hours: row.min_playtime_hours,
            required_augments: row.required_augments,
        },
        titles: {
            corporate: row.corporate_title,
            street: row.street_title,
            algorithm_relationship: row.algorithm_relationship,
        },
        benefits: {
            base_pay_multiplier: row.base_pay_multiplier,
            mission_access_level: row.mission_access_level,
            location_access_level: row.location_access_level,
            augment_access_level: row.augment_access_level,
            black_market_access: Boolean(row.black_market_access),
            interstitial_access: Boolean(row.interstitial_access),
            health_insurance_tier: row.health_insurance_tier,
            housing_subsidy_level: row.housing_subsidy_level,
            corporate_support_level: row.corporate_support_level,
            algorithm_consultation: Boolean(row.algorithm_consultation),
        },
        special: {
            triggers_convergence_choice: Boolean(row.triggers_convergence_choice),
            ascension_eligible: Boolean(row.ascension_eligible),
            rogue_path_available: Boolean(row.rogue_path_available),
        },
        display_color: row.display_color,
    };
}

export function formatCharacterExperience(row: CharacterExperienceRow) {
    return {
        totals: {
            earned: row.total_xp_earned,
            spent: row.total_xp_spent,
            available: row.available_xp,
        },
        by_category: {
            combat: row.combat_xp,
            delivery: row.delivery_xp,
            social: row.social_xp,
            technical: row.technical_xp,
            exploration: row.exploration_xp,
            story: row.story_xp,
        },
        advancement_points: {
            attribute: row.attribute_points_available,
            skill: row.skill_points_available,
            ability: row.ability_points_available,
            augment_slots: row.augment_slots_available,
        },
        special_currencies: {
            algorithm_favor: row.algorithm_favor,
            street_cred: row.street_cred,
            network_tokens: row.network_tokens,
            humanity_anchors: row.humanity_anchors,
        },
    };
}

export function formatRatingComponent(row: RatingComponentRow) {
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        weight: row.weight,
        range: {
            min: row.min_value,
            max: row.max_value,
        },
        decay_rate_per_day: row.decay_rate_per_day,
        is_public: Boolean(row.is_public),
        affects_tier: Boolean(row.affects_tier),
    };
}

export function formatCrossTraining(row: CrossTrainingProgressRow, sourceName?: string, targetName?: string) {
    return {
        id: row.id,
        source_track: {
            id: row.source_track_id,
            name: sourceName,
        },
        target_track: {
            id: row.target_track_id,
            name: targetName,
        },
        progress: {
            xp_invested: row.xp_invested,
            xp_required: row.xp_required,
            percent_complete: row.xp_required > 0 ? Math.min(100, (row.xp_invested / row.xp_required) * 100) : 0,
        },
        effectiveness: {
            current: row.current_effectiveness,
            max: row.max_effectiveness,
        },
        unlocks: {
            abilities: parseJsonField<string[]>(row.abilities_unlocked, []),
            passives: parseJsonField<string[]>(row.passives_unlocked, []),
        },
        restrictions: {
            blocked_abilities: parseJsonField<string[]>(row.blocked_abilities, []),
            requires_augment_compatibility: Boolean(row.requires_augment_compatibility),
        },
    };
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class ProgressionService {
    constructor(private db: D1Database) { }

    // ---------------------------------------------------------------------------
    // TRACKS
    // ---------------------------------------------------------------------------

    async getTracks() {
        const result = await this.db.prepare(
            'SELECT * FROM tracks ORDER BY display_order'
        ).all<TrackRow>();
        return result.results.map(formatTrack);
    }

    async getTrackById(id: string) {
        return this.db.prepare(
            'SELECT * FROM tracks WHERE id = ?'
        ).bind(id).first<TrackRow>();
    }

    // ---------------------------------------------------------------------------
    // SPECIALIZATIONS
    // ---------------------------------------------------------------------------

    async getSpecializations(trackId?: string) {
        let query = `
      SELECT s.*, t.name as track_name
      FROM specializations s
      JOIN tracks t ON s.track_id = t.id
      WHERE 1=1
    `;
        const params: string[] = [];

        if (trackId) {
            query += ' AND s.track_id = ?';
            params.push(trackId);
        }

        query += ' ORDER BY t.display_order, s.display_order';

        const result = await this.db.prepare(query)
            .bind(...params)
            .all<SpecializationRow & { track_name: string }>();

        return result.results.map(r => formatSpecialization(r, r.track_name));
    }

    async getSpecializationsByTrack(trackId: string) {
        const track = await this.db.prepare(
            'SELECT name FROM tracks WHERE id = ?'
        ).bind(trackId).first<{ name: string }>();

        if (!track) return null;

        const specs = await this.db.prepare(
            'SELECT * FROM specializations WHERE track_id = ? ORDER BY display_order'
        ).bind(trackId).all<SpecializationRow>();

        return {
            track_name: track.name,
            specializations: specs.results.map(s => formatSpecialization(s, track.name)),
        };
    }

    async getSpecializationById(id: string) {
        return this.db.prepare(`
      SELECT s.*, t.name as track_name, t.code as track_code
      FROM specializations s
      JOIN tracks t ON s.track_id = t.id
      WHERE s.id = ?
    `).bind(id).first<SpecializationRow & { track_name: string; track_code: string }>();
    }

    // ---------------------------------------------------------------------------
    // TIERS
    // ---------------------------------------------------------------------------

    async getTierDefinitions() {
        const result = await this.db.prepare(
            'SELECT * FROM tier_definitions ORDER BY tier_number'
        ).all<TierDefinitionRow>();
        return result.results.map(formatTierDefinition);
    }

    async getTierByNumber(tier: number) {
        return this.db.prepare(
            'SELECT * FROM tier_definitions WHERE tier_number = ?'
        ).bind(tier).first<TierDefinitionRow>();
    }

    async getCharacterTierInfo(characterId: string) {
        const character = await this.db.prepare(
            'SELECT id, current_tier, tier_progress, carrier_rating, track_id, specialization_id FROM characters WHERE id = ?'
        ).bind(characterId).first<CharacterProgressionRow>();

        if (!character) return null;

        const currentTier = await this.getTierByNumber(character.current_tier);
        const nextTier = await this.getTierByNumber(character.current_tier + 1);

        return {
            character_id: characterId,
            current_tier: currentTier ? formatTierDefinition(currentTier) : null,
            tier_progress: character.tier_progress,
            carrier_rating: character.carrier_rating,
            next_tier: nextTier ? formatTierDefinition(nextTier) : null,
            track_id: character.track_id,
            specialization_id: character.specialization_id,
        };
    }

    // ---------------------------------------------------------------------------
    // EXPERIENCE
    // ---------------------------------------------------------------------------

    async getCharacterExperience(characterId: string) {
        const exp = await this.db.prepare(
            'SELECT * FROM character_experience WHERE character_id = ?'
        ).bind(characterId).first<CharacterExperienceRow>();

        if (!exp) {
            return {
                totals: { earned: 0, spent: 0, available: 0 },
                by_category: { combat: 0, delivery: 0, social: 0, technical: 0, exploration: 0, story: 0 },
                advancement_points: { attribute: 0, skill: 0, ability: 0, augment_slots: 0 },
                special_currencies: { algorithm_favor: 0, street_cred: 0, network_tokens: 0, humanity_anchors: 0 },
            };
        }

        return formatCharacterExperience(exp);
    }

    async addExperience(characterId: string, category: XPCategory, amount: number) {
        const now = new Date().toISOString();
        const column = `${category}_xp`;

        const existing = await this.db.prepare(
            'SELECT id FROM character_experience WHERE character_id = ?'
        ).bind(characterId).first();

        if (existing) {
            await this.db.prepare(`
        UPDATE character_experience SET
          ${column} = ${column} + ?,
          total_xp_earned = total_xp_earned + ?,
          available_xp = available_xp + ?,
          updated_at = ?
        WHERE character_id = ?
      `).bind(amount, amount, amount, now, characterId).run();
        } else {
            const newId = crypto.randomUUID();
            await this.db.prepare(`
        INSERT INTO character_experience (
          id, character_id, total_xp_earned, total_xp_spent, available_xp,
          combat_xp, delivery_xp, social_xp, technical_xp, exploration_xp, story_xp,
          attribute_points_available, skill_points_available, ability_points_available, augment_slots_available,
          algorithm_favor, street_cred, network_tokens, humanity_anchors,
          created_at, updated_at
        ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?)
      `).bind(
                newId, characterId, amount, amount,
                category === 'combat' ? amount : 0,
                category === 'delivery' ? amount : 0,
                category === 'social' ? amount : 0,
                category === 'technical' ? amount : 0,
                category === 'exploration' ? amount : 0,
                category === 'story' ? amount : 0,
                now, now
            ).run();
        }

        return { category, amount_added: amount };
    }

    // ---------------------------------------------------------------------------
    // ADVANCEMENT
    // ---------------------------------------------------------------------------

    async getAdvancementPoints(characterId: string) {
        const exp = await this.db.prepare(
            'SELECT attribute_points_available, skill_points_available, ability_points_available, augment_slots_available FROM character_experience WHERE character_id = ?'
        ).bind(characterId).first<Partial<CharacterExperienceRow>>();

        return {
            attribute: exp?.attribute_points_available || 0,
            skill: exp?.skill_points_available || 0,
            ability: exp?.ability_points_available || 0,
            augment_slots: exp?.augment_slots_available || 0,
        };
    }

    async spendAdvancementPoints(characterId: string, type: AdvancementType, amount: number, targetId?: string) {
        const column = `${type}_points_available`;

        const exp = await this.db.prepare(
            `SELECT ${column} as available FROM character_experience WHERE character_id = ?`
        ).bind(characterId).first<{ available: number }>();

        if (!exp || exp.available < amount) {
            return { success: false, error: `Insufficient ${type} points. Available: ${exp?.available || 0}` };
        }

        const now = new Date().toISOString();

        await this.db.prepare(`
      UPDATE character_experience SET
        ${column} = ${column} - ?,
        total_xp_spent = total_xp_spent + ?,
        updated_at = ?
      WHERE character_id = ?
    `).bind(amount, amount, now, characterId).run();

        return {
            success: true,
            data: {
                type,
                amount_spent: amount,
                target_id: targetId,
                remaining: exp.available - amount,
            },
        };
    }

    // ---------------------------------------------------------------------------
    // RATING
    // ---------------------------------------------------------------------------

    async getRatingComponents(publicOnly: boolean) {
        let query = 'SELECT * FROM rating_components WHERE 1=1';
        if (publicOnly) {
            query += ' AND is_public = 1';
        }
        query += ' ORDER BY weight DESC';

        const result = await this.db.prepare(query).all<RatingComponentRow>();
        return result.results.map(formatRatingComponent);
    }

    async getCharacterRating(characterId: string) {
        const character = await this.db.prepare(
            'SELECT carrier_rating, current_tier, tier_progress FROM characters WHERE id = ?'
        ).bind(characterId).first<CharacterProgressionRow>();

        if (!character) return null;

        const components = await this.db.prepare(
            'SELECT * FROM rating_components ORDER BY weight DESC'
        ).all<RatingComponentRow>();

        const charRatings = await this.db.prepare(
            'SELECT * FROM character_rating_components WHERE character_id = ?'
        ).bind(characterId).all<{ component_id: string; value: number }>();

        const ratingMap = new Map(charRatings.results.map(r => [r.component_id, r.value]));

        const breakdown = components.results.map(comp => ({
            ...formatRatingComponent(comp),
            character_value: ratingMap.get(comp.id) || 0,
            weighted_contribution: (ratingMap.get(comp.id) || 0) * comp.weight,
        }));

        return {
            carrier_rating: character.carrier_rating,
            current_tier: character.current_tier,
            tier_progress: character.tier_progress,
            breakdown,
        };
    }

    // ---------------------------------------------------------------------------
    // CROSS-TRAINING
    // ---------------------------------------------------------------------------

    async getCrossTraining(characterId: string) {
        const result = await this.db.prepare(`
      SELECT ct.*,
             st.name as source_name, st.code as source_code,
             tt.name as target_name, tt.code as target_code
      FROM cross_training_progress ct
      JOIN tracks st ON ct.source_track_id = st.id
      JOIN tracks tt ON ct.target_track_id = tt.id
      WHERE ct.character_id = ?
      ORDER BY ct.current_effectiveness DESC
    `).bind(characterId).all<CrossTrainingProgressRow & {
            source_name: string;
            source_code: string;
            target_name: string;
            target_code: string;
        }>();

        return result.results.map(r => ({
            ...formatCrossTraining(r, r.source_name, r.target_name),
            source_code: r.source_code,
            target_code: r.target_code,
        }));
    }

    async investCrossTraining(characterId: string, targetTrackId: string, xpAmount: number) {
        // Get character's current track
        const character = await this.db.prepare(
            'SELECT track_id FROM characters WHERE id = ?'
        ).bind(characterId).first<{ track_id: string | null }>();

        if (!character || !character.track_id) {
            return { success: false, error: 'Character has no primary track selected' };
        }

        if (character.track_id === targetTrackId) {
            return { success: false, error: 'Cannot cross-train in your own track' };
        }

        // Check available XP
        const exp = await this.db.prepare(
            'SELECT available_xp FROM character_experience WHERE character_id = ?'
        ).bind(characterId).first<{ available_xp: number }>();

        if (!exp || exp.available_xp < xpAmount) {
            return { success: false, error: `Insufficient XP. Available: ${exp?.available_xp || 0}` };
        }

        const now = new Date().toISOString();

        // Find existing cross-training progress
        const progress = await this.db.prepare(
            'SELECT * FROM cross_training_progress WHERE character_id = ? AND target_track_id = ?'
        ).bind(characterId, targetTrackId).first<CrossTrainingProgressRow>();

        if (progress) {
            const newXpInvested = progress.xp_invested + xpAmount;
            const newEffectiveness = Math.min(
                progress.max_effectiveness,
                progress.current_effectiveness + (xpAmount / progress.xp_required) * progress.max_effectiveness
            );

            await this.db.prepare(`
        UPDATE cross_training_progress SET
          xp_invested = ?,
          current_effectiveness = ?,
          updated_at = ?
        WHERE id = ?
      `).bind(newXpInvested, newEffectiveness, now, progress.id).run();

            // Deduct XP
            await this.db.prepare(`
        UPDATE character_experience SET
          available_xp = available_xp - ?,
          total_xp_spent = total_xp_spent + ?,
          updated_at = ?
        WHERE character_id = ?
      `).bind(xpAmount, xpAmount, now, characterId).run();

            return {
                success: true,
                data: {
                    target_track_id: targetTrackId,
                    xp_invested: newXpInvested,
                    current_effectiveness: newEffectiveness,
                    max_effectiveness: progress.max_effectiveness,
                },
            };
        } else {
            // Get track relationship to determine max effectiveness
            const sourceTrack = await this.db.prepare(
                'SELECT natural_ally_tracks, difficult_cross_tracks FROM tracks WHERE id = ?'
            ).bind(character.track_id).first<{ natural_ally_tracks: string | null; difficult_cross_tracks: string | null }>();

            const allies = parseJsonField<string[]>(sourceTrack?.natural_ally_tracks ?? null, []);
            const difficult = parseJsonField<string[]>(sourceTrack?.difficult_cross_tracks ?? null, []);

            let maxEffectiveness = 0.60;
            if (allies.includes(targetTrackId)) {
                maxEffectiveness = 0.75;
            } else if (difficult.includes(targetTrackId)) {
                maxEffectiveness = 0.50;
            }

            const xpRequired = 10000;
            const newId = crypto.randomUUID();

            await this.db.prepare(`
        INSERT INTO cross_training_progress (
          id, character_id, source_track_id, target_track_id,
          xp_invested, xp_required, current_effectiveness, max_effectiveness,
          requires_augment_compatibility, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `).bind(
                newId, characterId, character.track_id, targetTrackId,
                xpAmount, xpRequired,
                (xpAmount / xpRequired) * maxEffectiveness,
                maxEffectiveness,
                now, now
            ).run();

            // Deduct XP
            await this.db.prepare(`
        UPDATE character_experience SET
          available_xp = available_xp - ?,
          total_xp_spent = total_xp_spent + ?,
          updated_at = ?
        WHERE character_id = ?
      `).bind(xpAmount, xpAmount, now, characterId).run();

            return {
                success: true,
                data: {
                    target_track_id: targetTrackId,
                    xp_invested: xpAmount,
                    current_effectiveness: (xpAmount / xpRequired) * maxEffectiveness,
                    max_effectiveness: maxEffectiveness,
                    is_new: true,
                },
                statusCode: 201,
            };
        }
    }

    // ---------------------------------------------------------------------------
    // TRACK / SPECIALIZATION SELECTION
    // ---------------------------------------------------------------------------

    async selectTrack(characterId: string, trackId: string) {
        const character = await this.db.prepare(
            'SELECT id, current_tier, track_id FROM characters WHERE id = ?'
        ).bind(characterId).first<CharacterProgressionRow>();

        if (!character) {
            return { success: false, error: 'Character not found', statusCode: 404 };
        }

        if (character.current_tier < 3) {
            return { success: false, error: 'Must be at least Tier 3 to select a track' };
        }

        if (character.track_id) {
            return { success: false, error: 'Track already selected. Track changes require special quest.' };
        }

        const track = await this.db.prepare(
            'SELECT id, name, code FROM tracks WHERE id = ?'
        ).bind(trackId).first<TrackRow>();

        if (!track) {
            return { success: false, error: 'Track not found', statusCode: 404 };
        }

        const now = new Date().toISOString();
        await this.db.prepare(
            'UPDATE characters SET track_id = ?, updated_at = ? WHERE id = ?'
        ).bind(trackId, now, characterId).run();

        return {
            success: true,
            data: {
                track_id: trackId,
                track_name: track.name,
                track_code: track.code,
                message: `You have joined the ${track.name} track!`,
            },
        };
    }

    async selectSpecialization(characterId: string, specializationId: string) {
        const character = await this.db.prepare(
            'SELECT id, current_tier, track_id, specialization_id FROM characters WHERE id = ?'
        ).bind(characterId).first<CharacterProgressionRow>();

        if (!character) {
            return { success: false, error: 'Character not found', statusCode: 404 };
        }

        if (character.current_tier < 6) {
            return { success: false, error: 'Must be at least Tier 6 to select a specialization' };
        }

        if (!character.track_id) {
            return { success: false, error: 'Must select a track before specializing' };
        }

        if (character.specialization_id) {
            return { success: false, error: 'Specialization already selected' };
        }

        const spec = await this.db.prepare(
            'SELECT id, name, code, track_id FROM specializations WHERE id = ?'
        ).bind(specializationId).first<SpecializationRow>();

        if (!spec) {
            return { success: false, error: 'Specialization not found', statusCode: 404 };
        }

        if (spec.track_id !== character.track_id) {
            return { success: false, error: 'Specialization must be from your track' };
        }

        const now = new Date().toISOString();
        await this.db.prepare(
            'UPDATE characters SET specialization_id = ?, updated_at = ? WHERE id = ?'
        ).bind(specializationId, now, characterId).run();

        return {
            success: true,
            data: {
                specialization_id: specializationId,
                specialization_name: spec.name,
                specialization_code: spec.code,
                message: `You have specialized as a ${spec.name}!`,
            },
        };
    }
}
