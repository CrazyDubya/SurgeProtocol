/**
 * Surge Protocol - Achievement Service
 *
 * Manages achievement definitions, character progress tracking,
 * milestones, and leaderboards.
 */

import { BaseService } from '../base/index';

// =============================================================================
// TYPES
// =============================================================================

export interface AchievementDefinition {
    id: string;
    code: string;
    name: string;
    description: string | null;
    hidden_description: string | null;
    achievement_type: string | null;
    category: string | null;
    difficulty: number;
    rarity: string | null;
    points: number;
    unlock_conditions: string | null;
    counter_target: number | null;
    counter_type: string | null;
    is_hidden: number;
    is_secret: number;
    xp_reward: number | null;
    credit_reward: number | null;
    item_reward_id: string | null;
    title_reward: string | null;
    cosmetic_reward: string | null;
    series_id: string | null;
    series_order: number | null;
    prerequisite_achievement_id: string | null;
    icon_asset: string | null;
    icon_locked_asset: string | null;
    banner_asset: string | null;
    is_missable: number;
    is_one_per_playthrough: number;
    created_at: string;
    updated_at: string;
}

export interface CharacterAchievement {
    id: string;
    character_id: string;
    achievement_id: string;
    status: string;
    unlocked_at: string | null;
    current_counter: number;
    target_counter: number;
    percent_complete: number;
    first_progress_at: string | null;
    last_progress_at: string | null;
    rewards_claimed: number;
    rewards_claimed_at: string | null;
    difficulty_at_unlock: string | null;
    playtime_at_unlock_hours: number | null;
    is_new: number;
}

export interface MilestoneDefinition {
    id: string;
    code: string;
    name: string;
    description: string | null;
    milestone_type: string | null;
    category: string | null;
    display_order: number;
    tracked_stat: string;
    thresholds: string | null;
    display_format: string | null;
    rewards_per_threshold: string | null;
    icon_asset: string | null;
    show_on_profile: number;
    leaderboard_eligible: number;
}

// =============================================================================
// FORMATTERS
// =============================================================================

export function formatAchievement(ach: AchievementDefinition, includeHidden = false) {
    const isHidden = ach.is_hidden === 1 || ach.is_secret === 1;
    return {
        id: ach.id, code: ach.code,
        name: isHidden && !includeHidden ? '???' : ach.name,
        description: isHidden && !includeHidden ? ach.hidden_description || '???' : ach.description,
        classification: { type: ach.achievement_type, category: ach.category, difficulty: ach.difficulty, rarity: ach.rarity, points: ach.points },
        tracking: {
            counterTarget: ach.counter_target, counterType: ach.counter_type,
            unlockConditions: !isHidden || includeHidden ? (ach.unlock_conditions ? JSON.parse(ach.unlock_conditions) : null) : null,
        },
        visibility: { isHidden: ach.is_hidden === 1, isSecret: ach.is_secret === 1 },
        rewards: { xp: ach.xp_reward, credits: ach.credit_reward, itemId: ach.item_reward_id, title: ach.title_reward, cosmetic: ach.cosmetic_reward ? JSON.parse(ach.cosmetic_reward) : null },
        series: ach.series_id ? { id: ach.series_id, order: ach.series_order, prerequisiteId: ach.prerequisite_achievement_id } : null,
        assets: { icon: ach.icon_asset, iconLocked: ach.icon_locked_asset, banner: ach.banner_asset },
        meta: { isMissable: ach.is_missable === 1, isOnePerPlaythrough: ach.is_one_per_playthrough === 1 },
    };
}

export function formatCharacterAchievement(ca: CharacterAchievement, definition?: AchievementDefinition) {
    return {
        id: ca.id, achievementId: ca.achievement_id, status: ca.status, unlockedAt: ca.unlocked_at,
        progress: { current: ca.current_counter, target: ca.target_counter, percent: ca.percent_complete },
        tracking: { firstProgressAt: ca.first_progress_at, lastProgressAt: ca.last_progress_at },
        rewards: { claimed: ca.rewards_claimed === 1, claimedAt: ca.rewards_claimed_at },
        unlockContext: ca.unlocked_at ? { difficulty: ca.difficulty_at_unlock, playtimeHours: ca.playtime_at_unlock_hours } : null,
        isNew: ca.is_new === 1,
        definition: definition ? formatAchievement(definition, true) : undefined,
    };
}

export function formatMilestone(milestone: MilestoneDefinition) {
    return {
        id: milestone.id, code: milestone.code, name: milestone.name,
        description: milestone.description, type: milestone.milestone_type,
        category: milestone.category, displayOrder: milestone.display_order,
        tracking: { stat: milestone.tracked_stat, thresholds: milestone.thresholds ? JSON.parse(milestone.thresholds) : [], displayFormat: milestone.display_format },
        rewards: milestone.rewards_per_threshold ? JSON.parse(milestone.rewards_per_threshold) : null,
        display: { icon: milestone.icon_asset, showOnProfile: milestone.show_on_profile === 1, leaderboardEligible: milestone.leaderboard_eligible === 1 },
    };
}

// =============================================================================
// ACHIEVEMENT SERVICE
// =============================================================================

export class AchievementService extends BaseService {

    // ---------------------------------------------------------------------------
    // ACHIEVEMENT DEFINITIONS
    // ---------------------------------------------------------------------------

    async listAchievements(opts: { category?: string; type?: string; rarity?: string; seriesId?: string; includeHidden?: boolean; limit?: number; offset?: number }) {
        const { category, type, rarity, seriesId, includeHidden = false } = opts;
        const limit = opts.limit || 50;
        const offset = opts.offset || 0;

        let sql = 'SELECT * FROM achievement_definitions WHERE 1=1';
        let countSql = 'SELECT COUNT(*) as total FROM achievement_definitions WHERE 1=1';
        const params: unknown[] = [];
        const countParams: unknown[] = [];

        const addFilter = (clause: string, value: unknown) => {
            sql += clause; countSql += clause;
            params.push(value); countParams.push(value);
        };

        if (category) addFilter(' AND category = ?', category);
        if (type) addFilter(' AND achievement_type = ?', type);
        if (rarity) addFilter(' AND rarity = ?', rarity);
        if (seriesId) addFilter(' AND series_id = ?', seriesId);
        if (!includeHidden) { sql += ' AND is_hidden = 0 AND is_secret = 0'; countSql += ' AND is_hidden = 0 AND is_secret = 0'; }

        sql += ' ORDER BY category ASC, difficulty ASC, name ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const result = await this.db.prepare(sql).bind(...params).all<AchievementDefinition>();
        const countResult = await this.db.prepare(countSql).bind(...countParams).first<{ total: number }>();
        const total = countResult?.total || 0;

        return {
            achievements: result.results.map(a => formatAchievement(a, includeHidden)),
            pagination: { total, limit, offset, hasMore: offset + result.results.length < total },
        };
    }

    async getCategories() {
        const result = await this.db.prepare(
            'SELECT category, COUNT(*) as count, SUM(points) as total_points FROM achievement_definitions WHERE is_hidden = 0 GROUP BY category ORDER BY category ASC'
        ).all<{ category: string; count: number; total_points: number }>();
        return result.results.map(cat => ({ name: cat.category, achievementCount: cat.count, totalPoints: cat.total_points }));
    }

    async getAchievement(idOrCode: string) {
        let ach = await this.db.prepare('SELECT * FROM achievement_definitions WHERE id = ?').bind(idOrCode).first<AchievementDefinition>();
        if (!ach) ach = await this.db.prepare('SELECT * FROM achievement_definitions WHERE code = ?').bind(idOrCode).first<AchievementDefinition>();
        if (!ach) return null;

        let prerequisite = null;
        if (ach.prerequisite_achievement_id) {
            prerequisite = await this.db.prepare('SELECT id, code, name FROM achievement_definitions WHERE id = ?').bind(ach.prerequisite_achievement_id).first();
        }

        let seriesSiblings: { id: string; code: string; name: string; order: number }[] = [];
        if (ach.series_id) {
            const sr = await this.db.prepare("SELECT id, code, name, series_order as 'order' FROM achievement_definitions WHERE series_id = ? ORDER BY series_order ASC").bind(ach.series_id).all<{ id: string; code: string; name: string; order: number }>();
            seriesSiblings = sr.results;
        }

        const unlockStats = await this.db.prepare("SELECT COUNT(*) as unlocked_count FROM character_achievements WHERE achievement_id = ? AND status = 'UNLOCKED'").bind(ach.id).first<{ unlocked_count: number }>();

        return { ...formatAchievement(ach, true), prerequisite, seriesSiblings, stats: { unlockedCount: unlockStats?.unlocked_count || 0 } };
    }

    // ---------------------------------------------------------------------------
    // CHARACTER PROGRESS
    // ---------------------------------------------------------------------------

    async getCharacterProgress(characterId: string, opts: { status?: string; category?: string }) {
        let sql = `SELECT ca.*, ad.*, ca.id as ca_id, ca.status as ca_status
      FROM character_achievements ca JOIN achievement_definitions ad ON ca.achievement_id = ad.id WHERE ca.character_id = ?`;
        const params: unknown[] = [characterId];
        if (opts.status) { sql += ' AND ca.status = ?'; params.push(opts.status); }
        if (opts.category) { sql += ' AND ad.category = ?'; params.push(opts.category); }
        sql += ' ORDER BY ca.unlocked_at DESC NULLS LAST, ad.name ASC';

        const result = await this.db.prepare(sql).bind(...params).all();
        const achievements = result.results.map((row: Record<string, unknown>) => {
            const ca: CharacterAchievement = {
                id: row.ca_id as string, character_id: row.character_id as string, achievement_id: row.achievement_id as string,
                status: row.ca_status as string, unlocked_at: row.unlocked_at as string | null,
                current_counter: row.current_counter as number, target_counter: row.target_counter as number,
                percent_complete: row.percent_complete as number, first_progress_at: row.first_progress_at as string | null,
                last_progress_at: row.last_progress_at as string | null, rewards_claimed: row.rewards_claimed as number,
                rewards_claimed_at: row.rewards_claimed_at as string | null, difficulty_at_unlock: row.difficulty_at_unlock as string | null,
                playtime_at_unlock_hours: row.playtime_at_unlock_hours as number | null, is_new: row.is_new as number,
            };
            const ad: AchievementDefinition = {
                id: row.achievement_id as string, code: row.code as string, name: row.name as string,
                description: row.description as string | null, hidden_description: row.hidden_description as string | null,
                achievement_type: row.achievement_type as string | null, category: row.category as string | null,
                difficulty: row.difficulty as number, rarity: row.rarity as string | null, points: row.points as number,
                unlock_conditions: row.unlock_conditions as string | null, counter_target: row.counter_target as number | null,
                counter_type: row.counter_type as string | null, is_hidden: row.is_hidden as number, is_secret: row.is_secret as number,
                xp_reward: row.xp_reward as number | null, credit_reward: row.credit_reward as number | null,
                item_reward_id: row.item_reward_id as string | null, title_reward: row.title_reward as string | null,
                cosmetic_reward: row.cosmetic_reward as string | null, series_id: row.series_id as string | null,
                series_order: row.series_order as number | null, prerequisite_achievement_id: row.prerequisite_achievement_id as string | null,
                icon_asset: row.icon_asset as string | null, icon_locked_asset: row.icon_locked_asset as string | null,
                banner_asset: row.banner_asset as string | null, is_missable: row.is_missable as number,
                is_one_per_playthrough: row.is_one_per_playthrough as number, created_at: row.created_at as string, updated_at: row.updated_at as string,
            };
            return formatCharacterAchievement(ca, ad);
        });

        const unlocked = achievements.filter(a => a.status === 'UNLOCKED').length;
        const inProgress = achievements.filter(a => a.status === 'IN_PROGRESS').length;
        const totalPoints = achievements.filter(a => a.status === 'UNLOCKED').reduce((sum, a) => sum + (a.definition?.classification.points || 0), 0);

        return { characterId, achievements, summary: { total: achievements.length, unlocked, inProgress, totalPoints } };
    }

    async getRecentUnlocks(characterId: string, limit = 10) {
        const result = await this.db.prepare(
            `SELECT ca.*, ad.code, ad.name, ad.description, ad.category, ad.points, ad.icon_asset
       FROM character_achievements ca JOIN achievement_definitions ad ON ca.achievement_id = ad.id
       WHERE ca.character_id = ? AND ca.status = 'UNLOCKED' ORDER BY ca.unlocked_at DESC LIMIT ?`
        ).bind(characterId, limit).all();

        return result.results.map((row: Record<string, unknown>) => ({
            achievementId: row.achievement_id, code: row.code, name: row.name,
            description: row.description, category: row.category, points: row.points,
            icon: row.icon_asset, unlockedAt: row.unlocked_at, isNew: row.is_new === 1,
        }));
    }

    async updateProgress(achievementIdOrCode: string, characterId: string, opts: { incrementBy?: number; setTo?: number }) {
        let ach = await this.db.prepare('SELECT * FROM achievement_definitions WHERE id = ?').bind(achievementIdOrCode).first<AchievementDefinition>();
        if (!ach) ach = await this.db.prepare('SELECT * FROM achievement_definitions WHERE code = ?').bind(achievementIdOrCode).first<AchievementDefinition>();
        if (!ach) throw new Error('Achievement not found');
        if (!ach.counter_target) throw new Error('Achievement is not counter-based');

        let charAch = await this.db.prepare('SELECT * FROM character_achievements WHERE character_id = ? AND achievement_id = ?').bind(characterId, ach.id).first<CharacterAchievement>();
        const now = new Date().toISOString();

        if (!charAch) {
            const caId = `ca-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const initialCounter = opts.setTo !== undefined ? opts.setTo : (opts.incrementBy || 1);
            await this.db.prepare(
                `INSERT INTO character_achievements (id, character_id, achievement_id, status, current_counter, target_counter, percent_complete, first_progress_at, last_progress_at, is_new)
         VALUES (?, ?, ?, 'IN_PROGRESS', ?, ?, ?, ?, ?, 0)`
            ).bind(caId, characterId, ach.id, initialCounter, ach.counter_target, (initialCounter / ach.counter_target) * 100, now, now).run();
            charAch = await this.db.prepare('SELECT * FROM character_achievements WHERE id = ?').bind(caId).first<CharacterAchievement>();
        } else {
            const newCounter = opts.setTo !== undefined ? opts.setTo : charAch.current_counter + (opts.incrementBy || 1);
            const percent = Math.min(100, (newCounter / ach.counter_target) * 100);
            const isComplete = newCounter >= ach.counter_target;
            await this.db.prepare(
                'UPDATE character_achievements SET current_counter = ?, percent_complete = ?, status = ?, last_progress_at = ?, unlocked_at = ? WHERE id = ?'
            ).bind(newCounter, percent, isComplete ? 'UNLOCKED' : 'IN_PROGRESS', now, isComplete ? now : null, charAch.id).run();
            charAch = await this.db.prepare('SELECT * FROM character_achievements WHERE id = ?').bind(charAch.id).first<CharacterAchievement>();
        }

        const justUnlocked = charAch!.status === 'UNLOCKED' && charAch!.unlocked_at === now;
        return {
            achievement: formatAchievement(ach, true),
            progress: { current: charAch!.current_counter, target: ach.counter_target, percent: charAch!.percent_complete },
            status: charAch!.status, justUnlocked,
            rewards: justUnlocked ? { xp: ach.xp_reward, credits: ach.credit_reward, itemId: ach.item_reward_id, title: ach.title_reward } : null,
        };
    }

    async unlockAchievement(achievementIdOrCode: string, characterId: string) {
        let ach = await this.db.prepare('SELECT * FROM achievement_definitions WHERE id = ?').bind(achievementIdOrCode).first<AchievementDefinition>();
        if (!ach) ach = await this.db.prepare('SELECT * FROM achievement_definitions WHERE code = ?').bind(achievementIdOrCode).first<AchievementDefinition>();
        if (!ach) throw new Error('Achievement not found');

        const existing = await this.db.prepare('SELECT * FROM character_achievements WHERE character_id = ? AND achievement_id = ?').bind(characterId, ach.id).first<CharacterAchievement>();
        if (existing && existing.status === 'UNLOCKED') throw new Error('Achievement already unlocked');

        const now = new Date().toISOString();
        const caId = existing?.id || `ca-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        if (existing) {
            await this.db.prepare("UPDATE character_achievements SET status = 'UNLOCKED', unlocked_at = ?, current_counter = target_counter, percent_complete = 100, is_new = 1 WHERE id = ?").bind(now, existing.id).run();
        } else {
            await this.db.prepare(
                `INSERT INTO character_achievements (id, character_id, achievement_id, status, unlocked_at, current_counter, target_counter, percent_complete, is_new) VALUES (?, ?, ?, 'UNLOCKED', ?, ?, ?, 100, 1)`
            ).bind(caId, characterId, ach.id, now, ach.counter_target || 1, ach.counter_target || 1).run();
        }

        return {
            achievement: formatAchievement(ach, true), unlockedAt: now,
            rewards: { xp: ach.xp_reward, credits: ach.credit_reward, itemId: ach.item_reward_id, title: ach.title_reward },
        };
    }

    // ---------------------------------------------------------------------------
    // MILESTONES
    // ---------------------------------------------------------------------------

    async listMilestones(category?: string) {
        let sql = 'SELECT * FROM milestone_definitions WHERE 1=1';
        const params: unknown[] = [];
        if (category) { sql += ' AND category = ?'; params.push(category); }
        sql += ' ORDER BY display_order ASC';
        const result = await this.db.prepare(sql).bind(...params).all<MilestoneDefinition>();
        return result.results.map(formatMilestone);
    }

    async getCharacterMilestones(characterId: string) {
        await this.db.prepare('SELECT id FROM characters WHERE id = ?').bind(characterId).first();
        const milestonesResult = await this.db.prepare('SELECT * FROM milestone_definitions ORDER BY display_order ASC').all<MilestoneDefinition>();

        return milestonesResult.results.map(milestone => {
            const formatted = formatMilestone(milestone);
            const currentValue = 0; // placeholder
            const thresholds = formatted.tracking.thresholds as number[];
            const currentThresholdIndex = thresholds.findIndex(t => currentValue < t);
            const currentThreshold = currentThresholdIndex === -1 ? thresholds[thresholds.length - 1] : thresholds[currentThresholdIndex];
            const previousThreshold = currentThresholdIndex > 0 ? thresholds[currentThresholdIndex - 1] : 0;
            return {
                ...formatted,
                progress: {
                    currentValue, currentThreshold, previousThreshold,
                    thresholdsReached: currentThresholdIndex === -1 ? thresholds.length : currentThresholdIndex,
                    totalThresholds: thresholds.length,
                },
            };
        });
    }

    // ---------------------------------------------------------------------------
    // LEADERBOARDS
    // ---------------------------------------------------------------------------

    getLeaderboardTypes() {
        return [
            { type: 'TOTAL_POINTS', name: 'Achievement Points', description: 'Total achievement points earned' },
            { type: 'DELIVERIES', name: 'Total Deliveries', description: 'Total successful deliveries completed' },
            { type: 'CREDITS_EARNED', name: 'Credits Earned', description: 'Total credits earned lifetime' },
            { type: 'MISSIONS_COMPLETED', name: 'Missions Completed', description: 'Total missions completed' },
            { type: 'FASTEST_DELIVERY', name: 'Fastest Delivery', description: 'Fastest delivery time on record' },
        ];
    }

    async getLeaderboard(type: string, limit = 100, offset = 0) {
        let sql = '';
        const params: unknown[] = [];

        switch (type) {
            case 'TOTAL_POINTS':
                sql = `SELECT c.id, c.name, c.tier, COALESCE(SUM(ad.points), 0) as score
               FROM characters c LEFT JOIN character_achievements ca ON c.id = ca.character_id AND ca.status = 'UNLOCKED'
               LEFT JOIN achievement_definitions ad ON ca.achievement_id = ad.id
               GROUP BY c.id ORDER BY score DESC LIMIT ? OFFSET ?`;
                params.push(limit, offset);
                break;
            case 'DELIVERIES':
            case 'CREDITS_EARNED':
            case 'MISSIONS_COMPLETED':
                sql = 'SELECT id, name, tier, 0 as score FROM characters ORDER BY tier DESC LIMIT ? OFFSET ?';
                params.push(limit, offset);
                break;
            default:
                throw new Error('Unknown leaderboard type');
        }

        const result = await this.db.prepare(sql).bind(...params).all<{ id: string; name: string; tier: number; score: number }>();
        return result.results.map((row, index) => ({
            rank: offset + index + 1, characterId: row.id, characterName: row.name, tier: row.tier, score: row.score,
        }));
    }
}
