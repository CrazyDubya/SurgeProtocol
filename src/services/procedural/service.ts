/**
 * Surge Protocol - Procedural Generation Service
 *
 * Manages generation templates and loot tables for dynamic content.
 */

import { BaseService } from '../base/index';

// =============================================================================
// TYPES
// =============================================================================

function parseJsonField<T>(value: unknown, defaultValue: T): T {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'string') { try { return JSON.parse(value) as T; } catch { return defaultValue; } }
    return value as T;
}

export interface GenerationTemplate {
    id: string; code: string; name: string;
    templateType: string | null;
    parameterRanges: Record<string, unknown> | null;
    requiredTags: string[] | null; excludedTags: string[] | null;
    weightModifiers: Record<string, number> | null;
    tierRange: { min: number; max: number } | null;
    difficultyRange: { min: number; max: number } | null;
    factionAffinityId: string | null; regionAffinityId: string | null;
    scalesWithTier: boolean; scalingFormula: string | null;
    variationCount: number;
    combinationRules: Record<string, unknown> | null;
    createdAt: string; updatedAt: string;
}

export interface LootTable {
    id: string; code: string; name: string;
    sourceType: string | null;
    sourceTierRange: { min: number; max: number } | null;
    guaranteedItems: Array<{ itemId: string; quantity: number }> | null;
    randomItems: Array<{ itemId: string; weight: number; quantityRange: { min: number; max: number } }> | null;
    currencyRange: { min: number; max: number } | null;
    luckAffects: boolean; tierScaling: boolean;
    factionModifiers: Record<string, number> | null;
    regionModifiers: Record<string, number> | null;
    legendaryChance: number; nothingChance: number;
    nestedTables: string[] | null; mutuallyExclusive: string[] | null;
    createdAt: string; updatedAt: string;
}

// =============================================================================
// MAPPERS
// =============================================================================

function mapRowToTemplate(row: Record<string, unknown>): GenerationTemplate {
    return {
        id: row.id as string, code: row.code as string, name: row.name as string,
        templateType: row.template_type as string | null,
        parameterRanges: parseJsonField<Record<string, unknown> | null>(row.parameter_ranges, null),
        requiredTags: parseJsonField<string[] | null>(row.required_tags, null),
        excludedTags: parseJsonField<string[] | null>(row.excluded_tags, null),
        weightModifiers: parseJsonField<Record<string, number> | null>(row.weight_modifiers, null),
        tierRange: parseJsonField<{ min: number; max: number } | null>(row.tier_range, null),
        difficultyRange: parseJsonField<{ min: number; max: number } | null>(row.difficulty_range, null),
        factionAffinityId: row.faction_affinity_id as string | null,
        regionAffinityId: row.region_affinity_id as string | null,
        scalesWithTier: (row.scales_with_tier as number) === 1,
        scalingFormula: row.scaling_formula as string | null,
        variationCount: row.variation_count as number,
        combinationRules: parseJsonField<Record<string, unknown> | null>(row.combination_rules, null),
        createdAt: row.created_at as string, updatedAt: row.updated_at as string,
    };
}

function mapRowToLootTable(row: Record<string, unknown>): LootTable {
    return {
        id: row.id as string, code: row.code as string, name: row.name as string,
        sourceType: row.source_type as string | null,
        sourceTierRange: parseJsonField<{ min: number; max: number } | null>(row.source_tier_range, null),
        guaranteedItems: parseJsonField<Array<{ itemId: string; quantity: number }> | null>(row.guaranteed_items, null),
        randomItems: parseJsonField<Array<{ itemId: string; weight: number; quantityRange: { min: number; max: number } }> | null>(row.random_items, null),
        currencyRange: parseJsonField<{ min: number; max: number } | null>(row.currency_range, null),
        luckAffects: (row.luck_affects as number) === 1,
        tierScaling: (row.tier_scaling as number) === 1,
        factionModifiers: parseJsonField<Record<string, number> | null>(row.faction_modifiers, null),
        regionModifiers: parseJsonField<Record<string, number> | null>(row.region_modifiers, null),
        legendaryChance: row.legendary_chance as number, nothingChance: row.nothing_chance as number,
        nestedTables: parseJsonField<string[] | null>(row.nested_tables, null),
        mutuallyExclusive: parseJsonField<string[] | null>(row.mutually_exclusive, null),
        createdAt: row.created_at as string, updatedAt: row.updated_at as string,
    };
}

// =============================================================================
// PROCEDURAL SERVICE
// =============================================================================

export class ProceduralService extends BaseService {

    // ---------------------------------------------------------------------------
    // GENERATION TEMPLATES
    // ---------------------------------------------------------------------------

    async listTemplates(templateType?: string) {
        let query = 'SELECT * FROM generation_templates';
        const params: string[] = [];
        if (templateType) { query += ' WHERE template_type = ?'; params.push(templateType); }
        query += ' ORDER BY template_type, name';
        const result = await this.db.prepare(query).bind(...params).all();
        const templates = result.results.map(r => mapRowToTemplate(r as Record<string, unknown>));
        if (templateType) return { templates, total: templates.length };
        const grouped = templates.reduce((acc, t) => {
            const type = t.templateType || 'unknown';
            if (!acc[type]) acc[type] = [];
            acc[type].push(t);
            return acc;
        }, {} as Record<string, GenerationTemplate[]>);
        return { templates: grouped, total: templates.length };
    }

    async getTemplate(code: string): Promise<GenerationTemplate | null> {
        const result = await this.db.prepare('SELECT * FROM generation_templates WHERE code = ?').bind(code).first();
        if (!result) return null;
        return mapRowToTemplate(result as Record<string, unknown>);
    }

    async createTemplate(body: Record<string, unknown>): Promise<{ id: string; code: string }> {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.prepare(
            `INSERT INTO generation_templates (id, code, name, template_type, parameter_ranges, required_tags, excluded_tags, weight_modifiers, tier_range, difficulty_range, faction_affinity_id, region_affinity_id, scales_with_tier, scaling_formula, variation_count, combination_rules, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, body.code, body.name, body.templateType || null,
            body.parameterRanges ? JSON.stringify(body.parameterRanges) : null,
            body.requiredTags ? JSON.stringify(body.requiredTags) : null,
            body.excludedTags ? JSON.stringify(body.excludedTags) : null,
            body.weightModifiers ? JSON.stringify(body.weightModifiers) : null,
            body.tierRange ? JSON.stringify(body.tierRange) : null,
            body.difficultyRange ? JSON.stringify(body.difficultyRange) : null,
            body.factionAffinityId || null, body.regionAffinityId || null,
            body.scalesWithTier !== false ? 1 : 0, body.scalingFormula || null,
            body.variationCount || 1,
            body.combinationRules ? JSON.stringify(body.combinationRules) : null,
            now, now).run();
        return { id, code: body.code as string };
    }

    async generateFromTemplate(code: string, body: Record<string, unknown>) {
        const template = await this.db.prepare('SELECT * FROM generation_templates WHERE code = ?').bind(code).first();
        if (!template) return null;

        const tierRange = parseJsonField<{ min: number; max: number } | null>(template.tier_range, null);
        const paramRanges = parseJsonField<Record<string, { min: number; max: number }> | null>(template.parameter_ranges, null);
        const weightMods = parseJsonField<Record<string, number> | null>(template.weight_modifiers, null);

        const requestedTier = (body.tier as number) || 1;
        let effectiveTier = requestedTier;
        if (tierRange) effectiveTier = Math.max(tierRange.min, Math.min(tierRange.max, requestedTier));

        const generatedParams: Record<string, number> = {};
        if (paramRanges) {
            for (const [param, range] of Object.entries(paramRanges)) {
                let value = Math.random() * ((range.max || 100) - (range.min || 0)) + (range.min || 0);
                if ((template.scales_with_tier as number) === 1) value *= 1 + (effectiveTier - 1) * 0.1;
                if (weightMods && weightMods[param]) value *= weightMods[param];
                generatedParams[param] = Math.round(value * 100) / 100;
            }
        }

        const variationCount = (body.variations as number) || (template.variation_count as number) || 1;
        const variations: Array<{ seed: string; params: Record<string, number> }> = [];
        for (let i = 0; i < (variationCount as number); i++) {
            const varParams: Record<string, number> = {};
            for (const [param, value] of Object.entries(generatedParams)) {
                varParams[param] = Math.round(value * (1 + (Math.random() - 0.5) * 0.2) * 100) / 100;
            }
            variations.push({ seed: crypto.randomUUID().slice(0, 8), params: varParams });
        }

        return {
            templateCode: code, templateType: template.template_type, requestedTier, effectiveTier,
            baseParams: generatedParams, variations,
            metadata: {
                requiredTags: parseJsonField<string[] | null>(template.required_tags, null),
                excludedTags: parseJsonField<string[] | null>(template.excluded_tags, null),
                scalesWithTier: (template.scales_with_tier as number) === 1,
            },
        };
    }

    // ---------------------------------------------------------------------------
    // LOOT TABLES
    // ---------------------------------------------------------------------------

    async listLootTables(sourceType?: string) {
        let query = 'SELECT * FROM loot_tables';
        const params: string[] = [];
        if (sourceType) { query += ' WHERE source_type = ?'; params.push(sourceType); }
        query += ' ORDER BY source_type, name';
        const result = await this.db.prepare(query).bind(...params).all();
        const tables = result.results.map(r => mapRowToLootTable(r as Record<string, unknown>));
        return { tables, total: tables.length };
    }

    async getLootTable(code: string): Promise<LootTable | null> {
        const result = await this.db.prepare('SELECT * FROM loot_tables WHERE code = ?').bind(code).first();
        if (!result) return null;
        return mapRowToLootTable(result as Record<string, unknown>);
    }

    async createLootTable(body: Record<string, unknown>): Promise<{ id: string; code: string }> {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.prepare(
            `INSERT INTO loot_tables (id, code, name, source_type, source_tier_range, guaranteed_items, random_items, currency_range, luck_affects, tier_scaling, faction_modifiers, region_modifiers, legendary_chance, nothing_chance, nested_tables, mutually_exclusive, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, body.code, body.name, body.sourceType || null,
            body.sourceTierRange ? JSON.stringify(body.sourceTierRange) : null,
            body.guaranteedItems ? JSON.stringify(body.guaranteedItems) : null,
            body.randomItems ? JSON.stringify(body.randomItems) : null,
            body.currencyRange ? JSON.stringify(body.currencyRange) : null,
            body.luckAffects !== false ? 1 : 0, body.tierScaling !== false ? 1 : 0,
            body.factionModifiers ? JSON.stringify(body.factionModifiers) : null,
            body.regionModifiers ? JSON.stringify(body.regionModifiers) : null,
            body.legendaryChance || 0.001, body.nothingChance || 0.1,
            body.nestedTables ? JSON.stringify(body.nestedTables) : null,
            body.mutuallyExclusive ? JSON.stringify(body.mutuallyExclusive) : null,
            now, now).run();
        return { id, code: body.code as string };
    }

    async rollLootTable(code: string, body: Record<string, unknown>) {
        const result = await this.db.prepare('SELECT * FROM loot_tables WHERE code = ?').bind(code).first();
        if (!result) return null;

        const luckBonus = (body.luck as number) || 0;
        const tier = (body.tier as number) || 1;
        const factionId = body.factionId as string | undefined;
        const regionId = body.regionId as string | undefined;

        let nothingChance = result.nothing_chance as number;
        if ((result.luck_affects as number) === 1) nothingChance = Math.max(0, nothingChance - luckBonus * 0.01);
        if (Math.random() < nothingChance) return { tableCode: code, rolled: 'nothing', items: [], currency: 0, legendary: false };

        const items: Array<{ itemId: string; quantity: number; isLegendary: boolean }> = [];
        let totalCurrency = 0;
        let gotLegendary = false;

        const guaranteed = parseJsonField<Array<{ itemId: string; quantity: number }> | null>(result.guaranteed_items, null);
        if (guaranteed) {
            for (const item of guaranteed) {
                let quantity = item.quantity || 1;
                if ((result.tier_scaling as number) === 1) quantity = Math.ceil(quantity * (1 + (tier - 1) * 0.2));
                items.push({ itemId: item.itemId, quantity, isLegendary: false });
            }
        }

        const randomItems = parseJsonField<Array<{ itemId: string; weight: number; quantityRange?: { min: number; max: number } }> | null>(result.random_items, null);
        if (randomItems && randomItems.length > 0) {
            let totalWeight = randomItems.reduce((sum, item) => sum + (item.weight || 1), 0);
            const factionMods = parseJsonField<Record<string, number> | null>(result.faction_modifiers, null);
            const regionMods = parseJsonField<Record<string, number> | null>(result.region_modifiers, null);
            if (factionId && factionMods && factionMods[factionId]) totalWeight *= factionMods[factionId];
            if (regionId && regionMods && regionMods[regionId]) totalWeight *= regionMods[regionId];
            const roll = Math.random() * totalWeight;
            let accumulated = 0;
            for (const item of randomItems) {
                accumulated += item.weight || 1;
                if (roll <= accumulated) {
                    const range = item.quantityRange || { min: 1, max: 1 };
                    let quantity = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
                    if ((result.tier_scaling as number) === 1) quantity = Math.ceil(quantity * (1 + (tier - 1) * 0.2));
                    items.push({ itemId: item.itemId, quantity, isLegendary: false });
                    break;
                }
            }
        }

        const currencyRange = parseJsonField<{ min: number; max: number } | null>(result.currency_range, null);
        if (currencyRange) {
            totalCurrency = Math.floor(Math.random() * (currencyRange.max - currencyRange.min + 1)) + currencyRange.min;
            if ((result.tier_scaling as number) === 1) totalCurrency = Math.ceil(totalCurrency * (1 + (tier - 1) * 0.3));
        }

        let legendaryChance = result.legendary_chance as number;
        if ((result.luck_affects as number) === 1) legendaryChance *= 1 + luckBonus * 0.1;
        if (Math.random() < legendaryChance) {
            gotLegendary = true;
            const lastItem = items[items.length - 1];
            if (lastItem) lastItem.isLegendary = true;
        }

        return { tableCode: code, rolled: 'success', items, currency: totalCurrency, legendary: gotLegendary, modifiers: { luck: luckBonus, tier, factionId, regionId } };
    }

    async analyzeLootTable(code: string) {
        const result = await this.db.prepare('SELECT * FROM loot_tables WHERE code = ?').bind(code).first();
        if (!result) return null;
        const nothingChance = result.nothing_chance as number;
        const legendaryChance = result.legendary_chance as number;
        const guaranteed = parseJsonField<Array<{ itemId: string; quantity: number }> | null>(result.guaranteed_items, null);
        const randomItems = parseJsonField<Array<{ itemId: string; weight: number }> | null>(result.random_items, null);
        const currencyRange = parseJsonField<{ min: number; max: number } | null>(result.currency_range, null);

        const itemProbabilities: Record<string, number> = {};
        if (guaranteed) for (const item of guaranteed) itemProbabilities[item.itemId] = (1 - nothingChance) * 100;
        if (randomItems && randomItems.length > 0) {
            const totalWeight = randomItems.reduce((sum, item) => sum + (item.weight || 1), 0);
            for (const item of randomItems) itemProbabilities[item.itemId] = Math.round(((item.weight || 1) / totalWeight) * (1 - nothingChance) * 10000) / 100;
        }

        return {
            tableCode: code,
            analysis: { nothingChance: nothingChance * 100, legendaryChance: legendaryChance * 100, itemProbabilities, guaranteedItemCount: guaranteed?.length || 0, randomItemPoolSize: randomItems?.length || 0, currencyRange: currencyRange || null, averageCurrency: currencyRange ? Math.round((currencyRange.min + currencyRange.max) / 2) : 0 },
            metadata: { luckAffects: (result.luck_affects as number) === 1, tierScaling: (result.tier_scaling as number) === 1, hasNestedTables: !!parseJsonField<string[] | null>(result.nested_tables, null) },
        };
    }
}
