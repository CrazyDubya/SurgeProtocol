/**
 * Augmentation Service
 *
 * Handles all augmentation-related data access: catalog browsing, installation,
 * removal, toggling, humanity tracking, body locations, manufacturers, and set bonuses.
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { CatalogFilters, InstallInput, RemoveInput } from './types';

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class AugmentationService {
    constructor(private db: D1Database) { }

    // ---------------------------------------------------------------------------
    // CATALOG
    // ---------------------------------------------------------------------------

    async getCatalog(filters: CatalogFilters) {
        let query = `
      SELECT
        ad.id, ad.code, ad.name, ad.manufacturer, ad.model, ad.description,
        ad.category, ad.subcategory, ad.rarity, ad.quality_tier, ad.required_tier,
        ad.body_location_id, ad.slots_consumed, ad.base_price_creds,
        ad.installation_cost_creds, ad.humanity_cost, ad.is_black_market, ad.is_prototype,
        bl.name as body_location_name, bl.code as body_location_code
      FROM augment_definitions ad
      LEFT JOIN body_locations bl ON ad.body_location_id = bl.id
      WHERE 1=1
    `;
        const params: unknown[] = [];

        if (filters.category) { query += ` AND ad.category = ?`; params.push(filters.category); }
        if (filters.rarity) { query += ` AND ad.rarity = ?`; params.push(filters.rarity); }
        if (filters.maxTier !== undefined) { query += ` AND ad.required_tier <= ?`; params.push(filters.maxTier); }
        if (filters.manufacturer) { query += ` AND ad.manufacturer = ?`; params.push(filters.manufacturer); }
        if (filters.bodyLocation) { query += ` AND ad.body_location_id = ?`; params.push(filters.bodyLocation); }

        query += ` ORDER BY ad.required_tier, ad.rarity, ad.name LIMIT ? OFFSET ?`;
        params.push(filters.limit, filters.offset);

        const result = await this.db.prepare(query).bind(...params).all();

        // Count query
        let countQuery = `SELECT COUNT(*) as total FROM augment_definitions WHERE 1=1`;
        const countParams: unknown[] = [];
        if (filters.category) { countQuery += ` AND category = ?`; countParams.push(filters.category); }
        if (filters.rarity) { countQuery += ` AND rarity = ?`; countParams.push(filters.rarity); }
        if (filters.maxTier !== undefined) { countQuery += ` AND required_tier <= ?`; countParams.push(filters.maxTier); }
        if (filters.manufacturer) { countQuery += ` AND manufacturer = ?`; countParams.push(filters.manufacturer); }
        if (filters.bodyLocation) { countQuery += ` AND body_location_id = ?`; countParams.push(filters.bodyLocation); }

        const countResult = await this.db.prepare(countQuery).bind(...countParams).first<{ total: number }>();

        return {
            augments: result.results,
            pagination: {
                total: countResult?.total || 0,
                limit: filters.limit,
                offset: filters.offset,
                hasMore: filters.offset + filters.limit < (countResult?.total || 0),
            },
        };
    }

    async getCatalogItem(id: string) {
        const augment = await this.db.prepare(`
      SELECT
        ad.*,
        bl.name as body_location_name, bl.code as body_location_code,
        bl.augment_slots as location_total_slots, bl.surgery_risk_base as location_surgery_risk,
        am.name as manufacturer_name, am.quality_rating as manufacturer_quality,
        am.reliability_rating as manufacturer_reliability
      FROM augment_definitions ad
      LEFT JOIN body_locations bl ON ad.body_location_id = bl.id
      LEFT JOIN augment_manufacturers am ON ad.manufacturer = am.code
      WHERE ad.id = ? OR ad.code = ?
    `).bind(id, id).first();

        if (!augment) return null;

        const parsed = {
            ...augment,
            attribute_modifiers: augment.attribute_modifiers ? JSON.parse(augment.attribute_modifiers as string) : null,
            stat_modifiers: augment.stat_modifiers ? JSON.parse(augment.stat_modifiers as string) : null,
            grants_abilities: augment.grants_abilities ? JSON.parse(augment.grants_abilities as string) : null,
            grants_passives: augment.grants_passives ? JSON.parse(augment.grants_passives as string) : null,
            special_effects: augment.special_effects ? JSON.parse(augment.special_effects as string) : null,
            side_effects: augment.side_effects ? JSON.parse(augment.side_effects as string) : null,
            required_augments: augment.required_augments ? JSON.parse(augment.required_augments as string) : null,
            incompatible_augments: augment.incompatible_augments ? JSON.parse(augment.incompatible_augments as string) : null,
            required_attributes: augment.required_attributes ? JSON.parse(augment.required_attributes as string) : null,
            upgrade_to: augment.upgrade_to ? JSON.parse(augment.upgrade_to as string) : null,
        };

        let upgradePath = null;
        if (augment.upgrade_from_id) {
            const upgradeFrom = await this.db.prepare(`SELECT id, code, name FROM augment_definitions WHERE id = ?`)
                .bind(augment.upgrade_from_id).first();
            if (upgradeFrom) upgradePath = { from: upgradeFrom };
        }

        return { augment: parsed, upgradePath };
    }

    // ---------------------------------------------------------------------------
    // BODY LOCATIONS & MANUFACTURERS
    // ---------------------------------------------------------------------------

    async getBodyLocations() {
        const result = await this.db.prepare(`
      SELECT id, code, name, description, parent_location_id, augment_slots,
             critical_organ, visible_externally, damage_multiplier,
             min_tier_to_augment, surgery_risk_base
      FROM body_locations ORDER BY name
    `).all();
        return result.results;
    }

    async getManufacturers() {
        const result = await this.db.prepare(`
      SELECT id, code, name, tagline, description, quality_rating, reliability_rating,
             innovation_rating, price_tier, primary_category, is_corporate_approved,
             black_market_presence
      FROM augment_manufacturers ORDER BY quality_rating DESC, name
    `).all();
        return result.results;
    }

    // ---------------------------------------------------------------------------
    // CHARACTER AUGMENTS
    // ---------------------------------------------------------------------------

    async getCharacterAugments(characterId: string) {
        const installed = await this.db.prepare(`
      SELECT
        ca.id, ca.installed_at, ca.body_location_id, ca.installation_quality,
        ca.is_active, ca.is_damaged, ca.damage_level, ca.is_malfunctioning,
        ca.malfunction_type, ca.charge_level, ca.integration_level,
        ca.rejection_risk_current, ca.custom_name, ca.warranty_expires,
        ad.code as augment_code, ad.name as augment_name, ad.category, ad.rarity,
        ad.humanity_cost, ad.attribute_modifiers, ad.stat_modifiers,
        ad.grants_abilities, ad.grants_passives, ad.power_consumption,
        bl.name as body_location_name, bl.code as body_location_code
      FROM character_augments ca
      JOIN augment_definitions ad ON ca.augment_definition_id = ad.id
      LEFT JOIN body_locations bl ON ca.body_location_id = bl.id
      WHERE ca.character_id = ?
      ORDER BY ca.installed_at DESC
    `).bind(characterId).all();

        const character = await this.db.prepare(
            `SELECT current_humanity, max_humanity FROM characters WHERE id = ?`
        ).bind(characterId).first<{ current_humanity: number; max_humanity: number }>();

        const totalHumanityCost = installed.results.reduce((sum, aug) => {
            const cost = typeof aug.humanity_cost === 'number' ? aug.humanity_cost : 0;
            return sum + cost;
        }, 0);

        const humanityThreshold = await this.db.prepare(`
      SELECT * FROM humanity_thresholds
      WHERE threshold_value >= ?
      ORDER BY threshold_value ASC LIMIT 1
    `).bind(character?.current_humanity || 100).first();

        const parsedAugments = installed.results.map(aug => ({
            ...aug,
            attribute_modifiers: aug.attribute_modifiers ? JSON.parse(aug.attribute_modifiers as string) : null,
            stat_modifiers: aug.stat_modifiers ? JSON.parse(aug.stat_modifiers as string) : null,
            grants_abilities: aug.grants_abilities ? JSON.parse(aug.grants_abilities as string) : null,
            grants_passives: aug.grants_passives ? JSON.parse(aug.grants_passives as string) : null,
        }));

        return {
            augments: parsedAugments,
            count: installed.results.length,
            humanity: {
                current: character?.current_humanity || 100,
                max: character?.max_humanity || 100,
                totalCost: totalHumanityCost,
                threshold: humanityThreshold,
            },
        };
    }

    // ---------------------------------------------------------------------------
    // INSTALL
    // ---------------------------------------------------------------------------

    async installAugment(characterId: string, input: InstallInput) {
        const { augmentId, bodyLocationId, installerId, useBlackMarket } = input;

        // Get augment definition
        const augment = await this.db.prepare(`SELECT * FROM augment_definitions WHERE id = ? OR code = ?`)
            .bind(augmentId, augmentId).first();
        if (!augment) return { success: false, error: 'Augmentation not found', code: 'AUGMENT_NOT_FOUND', statusCode: 404 };

        // Get character
        const character = await this.db.prepare(
            `SELECT id, current_tier, current_credits, current_humanity, max_humanity FROM characters WHERE id = ?`
        ).bind(characterId).first<{
            id: string; current_tier: number; current_credits: number;
            current_humanity: number; max_humanity: number;
        }>();
        if (!character) return { success: false, error: 'Character not found', code: 'CHARACTER_NOT_FOUND', statusCode: 404 };

        // Check tier
        const requiredTier = typeof augment.required_tier === 'number' ? augment.required_tier : 1;
        if (character.current_tier < requiredTier) {
            return { success: false, error: `Requires tier ${requiredTier}, you are tier ${character.current_tier}`, code: 'TIER_REQUIREMENT' };
        }

        // Calculate costs
        const basePrice = typeof augment.base_price_creds === 'number' ? augment.base_price_creds : 1000;
        const installCost = typeof augment.installation_cost_creds === 'number' ? augment.installation_cost_creds : 500;
        const totalCost = useBlackMarket ? Math.floor((basePrice + installCost) * 0.7) : basePrice + installCost;

        if (character.current_credits < totalCost) {
            return { success: false, error: `Need ${totalCost} credits, have ${character.current_credits}`, code: 'INSUFFICIENT_CREDITS' };
        }

        // Determine body location
        const targetLocationId = bodyLocationId || (augment.body_location_id as string);
        if (!targetLocationId) {
            return { success: false, error: 'Body location required', code: 'NO_BODY_LOCATION' };
        }

        const bodyLocation = await this.db.prepare(`SELECT * FROM body_locations WHERE id = ?`)
            .bind(targetLocationId).first();
        if (!bodyLocation) {
            return { success: false, error: 'Invalid body location', code: 'INVALID_LOCATION' };
        }

        // Check slots
        const slotsUsed = await this.db.prepare(
            `SELECT COALESCE(SUM(ad.slots_consumed), 0) as used
       FROM character_augments ca
       JOIN augment_definitions ad ON ca.augment_definition_id = ad.id
       WHERE ca.character_id = ? AND ca.body_location_id = ?`
        ).bind(characterId, targetLocationId).first<{ used: number }>();

        const locationSlots = typeof bodyLocation.augment_slots === 'number' ? bodyLocation.augment_slots : 1;
        const augmentSlots = typeof augment.slots_consumed === 'number' ? augment.slots_consumed : 1;
        const currentUsed = slotsUsed?.used || 0;

        if (currentUsed + augmentSlots > locationSlots) {
            return { success: false, error: `Location has ${locationSlots} slots, ${currentUsed} used, need ${augmentSlots}`, code: 'NO_AVAILABLE_SLOTS' };
        }

        // Check incompatible augments
        if (augment.incompatible_augments) {
            const incompatible = JSON.parse(augment.incompatible_augments as string) as string[];
            const existingAugments = await this.db.prepare(
                `SELECT ad.code FROM character_augments ca
         JOIN augment_definitions ad ON ca.augment_definition_id = ad.id
         WHERE ca.character_id = ?`
            ).bind(characterId).all();

            const existingCodes = existingAugments.results.map(a => a.code as string);
            const conflict = incompatible.find(code => existingCodes.includes(code));
            if (conflict) {
                return { success: false, error: `Incompatible with existing augment: ${conflict}`, code: 'INCOMPATIBLE_AUGMENT' };
            }
        }

        // Check humanity
        const humanityCost = typeof augment.humanity_cost === 'number' ? augment.humanity_cost : 5;
        const newHumanity = character.current_humanity - humanityCost;
        if (newHumanity < 0) {
            return { success: false, error: `Installation would reduce humanity below 0. Current: ${character.current_humanity}, Cost: ${humanityCost}`, code: 'HUMANITY_TOO_LOW' };
        }

        // Installation quality
        const baseQuality = 80;
        const installationQuality = useBlackMarket
            ? Math.max(40, baseQuality - Math.floor(Math.random() * 30))
            : baseQuality + Math.floor(Math.random() * 20);

        const installId = crypto.randomUUID();
        const now = new Date().toISOString();

        // Create installation
        await this.db.prepare(
            `INSERT INTO character_augments (
        id, character_id, augment_definition_id, body_location_id,
        installed_by_npc_id, installation_quality, is_corporate_installed,
        is_active, integration_level, installed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 50, ?, ?)`
        ).bind(installId, characterId, augment.id, targetLocationId, installerId || null,
            installationQuality, useBlackMarket ? 0 : 1, now, now).run();

        // Deduct credits
        await this.db.prepare(`UPDATE characters SET current_credits = current_credits - ? WHERE id = ?`)
            .bind(totalCost, characterId).run();

        // Reduce humanity
        await this.db.prepare(`UPDATE characters SET current_humanity = current_humanity - ? WHERE id = ?`)
            .bind(humanityCost, characterId).run();

        // Record humanity event
        await this.db.prepare(
            `INSERT INTO humanity_events (
        id, character_id, humanity_before, humanity_after, change_amount,
        change_source, source_id, occurred_at
      ) VALUES (?, ?, ?, ?, ?, 'AUGMENT_INSTALL', ?, ?)`
        ).bind(crypto.randomUUID(), characterId, character.current_humanity, newHumanity,
            -humanityCost, installId, now).run();

        // Apply attribute modifiers
        if (augment.attribute_modifiers) {
            const modifiers = JSON.parse(augment.attribute_modifiers as string) as Record<string, number>;
            for (const [attrCode, modifier] of Object.entries(modifiers)) {
                await this.db.prepare(
                    `UPDATE character_attributes
           SET bonus_from_augments = bonus_from_augments + ?,
               current_value = base_value + bonus_from_augments + ? + bonus_from_items + bonus_from_conditions + temporary_modifier
           WHERE character_id = ? AND attribute_id IN (
             SELECT id FROM attribute_definitions WHERE code = ?
           )`
                ).bind(modifier, modifier, characterId, attrCode).run();
            }
        }

        // Check threshold crossing
        let thresholdCrossed = null;
        const crossedThreshold = await this.db.prepare(
            `SELECT * FROM humanity_thresholds
       WHERE threshold_value > ? AND threshold_value <= ?
       ORDER BY threshold_value DESC LIMIT 1`
        ).bind(newHumanity, character.current_humanity).first();

        if (crossedThreshold) {
            thresholdCrossed = crossedThreshold;
            await this.db.prepare(`UPDATE humanity_events SET crossed_threshold = ? WHERE source_id = ?`)
                .bind(crossedThreshold.threshold_value, installId).run();
        }

        return {
            success: true,
            data: {
                installation: {
                    id: installId,
                    augmentId: augment.id,
                    augmentName: augment.name,
                    bodyLocation: bodyLocation.name,
                    installationQuality,
                    isBlackMarket: useBlackMarket,
                },
                costs: { credits: totalCost, humanityCost },
                character: {
                    creditsRemaining: character.current_credits - totalCost,
                    humanityRemaining: newHumanity,
                },
                thresholdCrossed,
            },
        };
    }

    // ---------------------------------------------------------------------------
    // TOGGLE
    // ---------------------------------------------------------------------------

    async toggleAugment(characterId: string, augmentInstallId: string) {
        const installed = await this.db.prepare(
            `SELECT ca.*, ad.name as augment_name, ad.power_consumption
       FROM character_augments ca
       JOIN augment_definitions ad ON ca.augment_definition_id = ad.id
       WHERE ca.id = ? AND ca.character_id = ?`
        ).bind(augmentInstallId, characterId).first();

        if (!installed) return { success: false, error: 'Installed augment not found', code: 'NOT_FOUND', statusCode: 404 };

        if (installed.is_damaged && !installed.is_active) {
            return { success: false, error: 'Augment is damaged and cannot be activated', code: 'AUGMENT_DAMAGED' };
        }

        const newState = installed.is_active ? 0 : 1;
        await this.db.prepare(
            `UPDATE character_augments
       SET is_active = ?, times_activated = times_activated + ?, updated_at = ?
       WHERE id = ?`
        ).bind(newState, newState, new Date().toISOString(), augmentInstallId).run();

        return {
            success: true,
            data: {
                augmentId: augmentInstallId,
                augmentName: installed.augment_name,
                isActive: newState === 1,
            },
        };
    }

    // ---------------------------------------------------------------------------
    // REMOVE
    // ---------------------------------------------------------------------------

    async removeAugment(characterId: string, augmentInstallId: string, input: RemoveInput) {
        const { useBlackMarket } = input;

        const installed = await this.db.prepare(
            `SELECT ca.*, ad.name as augment_name, ad.humanity_cost, ad.attribute_modifiers,
              ad.surgery_difficulty, ad.base_price_creds
       FROM character_augments ca
       JOIN augment_definitions ad ON ca.augment_definition_id = ad.id
       WHERE ca.id = ? AND ca.character_id = ?`
        ).bind(augmentInstallId, characterId).first();

        if (!installed) return { success: false, error: 'Installed augment not found', code: 'NOT_FOUND', statusCode: 404 };

        if (installed.debt_attached_id && !installed.can_be_repossessed) {
            return { success: false, error: 'Cannot remove augment with attached debt', code: 'DEBT_ATTACHED' };
        }

        const character = await this.db.prepare(
            `SELECT current_credits, current_humanity, max_humanity FROM characters WHERE id = ?`
        ).bind(characterId).first<{ current_credits: number; current_humanity: number; max_humanity: number }>();

        if (!character) return { success: false, error: 'Character not found', code: 'CHARACTER_NOT_FOUND', statusCode: 404 };

        const basePrice = typeof installed.base_price_creds === 'number' ? installed.base_price_creds : 1000;
        const removalCost = useBlackMarket ? Math.floor(basePrice * 0.15) : Math.floor(basePrice * 0.25);

        if (character.current_credits < removalCost) {
            return { success: false, error: `Removal costs ${removalCost} credits`, code: 'INSUFFICIENT_CREDITS' };
        }

        // Surgery risk calculation
        const surgeryDifficulty = typeof installed.surgery_difficulty === 'number' ? installed.surgery_difficulty : 5;
        const integrationLevel = typeof installed.integration_level === 'number' ? installed.integration_level : 50;
        const baseRisk = surgeryDifficulty * 2;
        const integrationRisk = Math.floor(integrationLevel / 10);
        const blackMarketPenalty = useBlackMarket ? 15 : 0;
        const totalRisk = Math.min(95, baseRisk + integrationRisk + blackMarketPenalty);

        const roll = Math.floor(Math.random() * 100);
        const hasComplications = roll < totalRisk;

        // Humanity restoration
        const humanityCost = typeof installed.humanity_cost === 'number' ? installed.humanity_cost : 5;
        const restorationRate = Math.max(0.5, 1 - integrationLevel / 200);
        let humanityRestored = Math.floor(humanityCost * restorationRate);
        if (hasComplications) humanityRestored = Math.floor(humanityRestored * 0.5);

        const newHumanity = Math.min(character.max_humanity, character.current_humanity + humanityRestored);

        // Remove attribute modifiers
        if (installed.attribute_modifiers) {
            const modifiers = JSON.parse(installed.attribute_modifiers as string) as Record<string, number>;
            for (const [attrCode, modifier] of Object.entries(modifiers)) {
                await this.db.prepare(
                    `UPDATE character_attributes
           SET bonus_from_augments = bonus_from_augments - ?,
               current_value = base_value + bonus_from_augments - ? + bonus_from_items + bonus_from_conditions + temporary_modifier
           WHERE character_id = ? AND attribute_id IN (
             SELECT id FROM attribute_definitions WHERE code = ?
           )`
                ).bind(modifier, modifier, characterId, attrCode).run();
            }
        }

        await this.db.prepare(`DELETE FROM character_augments WHERE id = ?`).bind(augmentInstallId).run();
        await this.db.prepare(`UPDATE characters SET current_credits = current_credits - ? WHERE id = ?`).bind(removalCost, characterId).run();
        await this.db.prepare(`UPDATE characters SET current_humanity = ? WHERE id = ?`).bind(newHumanity, characterId).run();

        const now = new Date().toISOString();
        await this.db.prepare(
            `INSERT INTO humanity_events (
        id, character_id, humanity_before, humanity_after, change_amount,
        change_source, source_id, occurred_at
      ) VALUES (?, ?, ?, ?, ?, 'AUGMENT_REMOVE', ?, ?)`
        ).bind(crypto.randomUUID(), characterId, character.current_humanity, newHumanity,
            humanityRestored, augmentInstallId, now).run();

        let complicationDamage = 0;
        if (hasComplications) {
            complicationDamage = Math.floor(Math.random() * 10) + 5;
            await this.db.prepare(`UPDATE characters SET current_health = MAX(1, current_health - ?) WHERE id = ?`)
                .bind(complicationDamage, characterId).run();
        }

        return {
            success: true,
            data: {
                removed: { augmentName: installed.augment_name },
                costs: { credits: removalCost },
                surgery: { risk: totalRisk, hadComplications: hasComplications, damage: complicationDamage },
                humanity: { restored: humanityRestored, current: newHumanity },
                character: { creditsRemaining: character.current_credits - removalCost },
            },
        };
    }

    // ---------------------------------------------------------------------------
    // HUMANITY
    // ---------------------------------------------------------------------------

    async getHumanityHistory(characterId: string, limit: number) {
        const events = await this.db.prepare(`
      SELECT he.*, ht.threshold_name, ht.description as threshold_description
      FROM humanity_events he
      LEFT JOIN humanity_thresholds ht ON he.crossed_threshold = ht.threshold_value
      WHERE he.character_id = ?
      ORDER BY he.occurred_at DESC LIMIT ?
    `).bind(characterId, limit).all();
        return events.results;
    }

    async getHumanityThresholds() {
        const thresholds = await this.db.prepare(`SELECT * FROM humanity_thresholds ORDER BY threshold_value DESC`).all();
        return thresholds.results.map(t => ({
            ...t,
            dialogue_changes: t.dialogue_changes ? JSON.parse(t.dialogue_changes as string) : null,
            ability_unlocks: t.ability_unlocks ? JSON.parse(t.ability_unlocks as string) : null,
            ability_locks: t.ability_locks ? JSON.parse(t.ability_locks as string) : null,
            recovery_methods: t.recovery_methods ? JSON.parse(t.recovery_methods as string) : null,
            permanent_effects: t.permanent_effects ? JSON.parse(t.permanent_effects as string) : null,
        }));
    }

    // ---------------------------------------------------------------------------
    // AUGMENT SETS
    // ---------------------------------------------------------------------------

    async getAugmentSets(manufacturer?: string) {
        let query = 'SELECT * FROM augment_sets';
        const params: string[] = [];
        if (manufacturer) { query += ' WHERE manufacturer = ?'; params.push(manufacturer); }
        query += ' ORDER BY name ASC';

        const result = await this.db.prepare(query).bind(...params).all();
        return result.results.map(row => ({
            id: row.id,
            code: row.code,
            name: row.name,
            description: row.description,
            manufacturer: row.manufacturer,
            requiredAugments: row.required_augments ? JSON.parse(row.required_augments as string) : null,
            optionalAugments: row.optional_augments ? JSON.parse(row.optional_augments as string) : null,
            minAugmentsForBonus: row.min_augments_for_bonus,
            partialBonusEffects: row.partial_bonus_effects ? JSON.parse(row.partial_bonus_effects as string) : null,
            fullSetBonusEffects: row.full_set_bonus_effects ? JSON.parse(row.full_set_bonus_effects as string) : null,
            grantsAbilityId: row.grants_ability_id,
            grantsPassiveId: row.grants_passive_id,
            requiredTier: row.required_tier,
            requiredTrackId: row.required_track_id,
            requiredSpecializationId: row.required_specialization_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    }

    async getAugmentSetDetails(code: string) {
        const result = await this.db.prepare('SELECT * FROM augment_sets WHERE code = ? OR id = ?')
            .bind(code, code).first();
        if (!result) return null;

        const requiredAugments = result.required_augments ? JSON.parse(result.required_augments as string) : [];
        const optionalAugments = result.optional_augments ? JSON.parse(result.optional_augments as string) : [];
        const allAugmentIds = [...requiredAugments, ...optionalAugments];

        let augmentDetails: Record<string, unknown>[] = [];
        if (allAugmentIds.length > 0) {
            const placeholders = allAugmentIds.map(() => '?').join(',');
            const augmentsResult = await this.db.prepare(
                `SELECT ad.id, ad.code, ad.name, ad.body_location_id, ad.tier
         FROM augment_definitions ad WHERE ad.id IN (${placeholders})`
            ).bind(...allAugmentIds).all();
            augmentDetails = augmentsResult.results;
        }

        let grantedAbility = null;
        let grantedPassive = null;
        if (result.grants_ability_id) {
            grantedAbility = await this.db.prepare('SELECT id, code, name, description FROM ability_definitions WHERE id = ?')
                .bind(result.grants_ability_id).first();
        }
        if (result.grants_passive_id) {
            grantedPassive = await this.db.prepare('SELECT id, code, name, description FROM passive_definitions WHERE id = ?')
                .bind(result.grants_passive_id).first();
        }

        return {
            set: {
                id: result.id,
                code: result.code,
                name: result.name,
                description: result.description,
                manufacturer: result.manufacturer,
                requiredAugments,
                optionalAugments,
                minAugmentsForBonus: result.min_augments_for_bonus,
                partialBonusEffects: result.partial_bonus_effects ? JSON.parse(result.partial_bonus_effects as string) : null,
                fullSetBonusEffects: result.full_set_bonus_effects ? JSON.parse(result.full_set_bonus_effects as string) : null,
                grantsAbilityId: result.grants_ability_id,
                grantsPassiveId: result.grants_passive_id,
                requiredTier: result.required_tier,
                requiredTrackId: result.required_track_id,
                requiredSpecializationId: result.required_specialization_id,
            },
            augmentDetails,
            grantedAbility,
            grantedPassive,
        };
    }

    async getCharacterActiveSets(characterId: string) {
        const installedAugments = await this.db.prepare(
            `SELECT ca.augment_definition_id FROM character_augments ca
       WHERE ca.character_id = ? AND ca.is_active = 1`
        ).bind(characterId).all();

        const installedIds = installedAugments.results.map(a => a.augment_definition_id as string);

        if (installedIds.length === 0) return { activeSets: [], partialSets: [] };

        const allSets = await this.db.prepare('SELECT * FROM augment_sets').all();

        const activeSets: Array<{ setCode: string; setName: string; matchedCount: number; totalRequired: number; bonusType: string; effects: unknown }> = [];
        const partialSets: Array<{ setCode: string; setName: string; matchedCount: number; totalRequired: number; minForBonus: number }> = [];

        for (const set of allSets.results) {
            const requiredAugments = set.required_augments ? JSON.parse(set.required_augments as string) : [];
            const optionalAugments = set.optional_augments ? JSON.parse(set.optional_augments as string) : [];
            const allSetAugments = [...requiredAugments, ...optionalAugments];
            const minForBonus = set.min_augments_for_bonus as number;

            const matchedCount = allSetAugments.filter((augId: string) => installedIds.includes(augId)).length;

            if (matchedCount >= allSetAugments.length && allSetAugments.length > 0) {
                activeSets.push({
                    setCode: set.code as string,
                    setName: set.name as string,
                    matchedCount,
                    totalRequired: allSetAugments.length,
                    bonusType: 'FULL',
                    effects: set.full_set_bonus_effects ? JSON.parse(set.full_set_bonus_effects as string) : null,
                });
            } else if (matchedCount >= minForBonus && minForBonus > 0) {
                activeSets.push({
                    setCode: set.code as string,
                    setName: set.name as string,
                    matchedCount,
                    totalRequired: allSetAugments.length,
                    bonusType: 'PARTIAL',
                    effects: set.partial_bonus_effects ? JSON.parse(set.partial_bonus_effects as string) : null,
                });
            } else if (matchedCount > 0) {
                partialSets.push({
                    setCode: set.code as string,
                    setName: set.name as string,
                    matchedCount,
                    totalRequired: allSetAugments.length,
                    minForBonus,
                });
            }
        }

        return { activeSets, partialSets };
    }
}
