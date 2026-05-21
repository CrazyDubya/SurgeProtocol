
import type { D1Database } from '@cloudflare/workers-types';
import type {
    StoryArc,
    StoryChapter,
    NarrativeEvent,
    StoryFlag,
    CharacterStoryState,
    CharacterEventHistory
} from './types';

export class StoryService {
    constructor(private db: D1Database) { }

    /**
     * Parsing Helpers
     */
    private parseJson<T>(val: string | null): T | null {
        if (!val) return null;
        try {
            return JSON.parse(val) as T;
        } catch (e) {
            console.error('JSON parsing error:', e, val);
            return null;
        }
    }

    /**
     * Formatting Helpers
     */
    private formatStoryArc(arc: StoryArc) {
        return {
            id: arc.id,
            code: arc.code,
            name: arc.name,
            description: arc.description,
            type: {
                arcType: arc.arc_type,
                isMainStory: arc.is_main_story === 1,
                isRepeatable: arc.is_repeatable === 1,
            },
            structure: {
                chapters: this.parseJson<string[]>(arc.chapters) || [],
                parallelArcs: this.parseJson<string[]>(arc.parallel_arcs) || [],
                prerequisiteArcs: this.parseJson<string[]>(arc.prerequisite_arcs) || [],
                mutuallyExclusiveArcs: this.parseJson<string[]>(arc.mutually_exclusive_arcs) || [],
            },
            characters: {
                protagonists: this.parseJson<string[]>(arc.protagonist_npcs) || [],
                antagonists: this.parseJson<string[]>(arc.antagonist_npcs) || [],
                supporting: this.parseJson<string[]>(arc.supporting_npcs) || [],
            },
            narrative: {
                themes: this.parseJson<string[]>(arc.themes) || [],
                tone: arc.tone,
                moralQuestions: this.parseJson<string[]>(arc.moral_questions) || [],
            },
            endings: {
                possible: this.parseJson<string[]>(arc.possible_endings) || [],
                defaultEndingId: arc.default_ending_id,
            },
            meta: {
                estimatedPlaytimeHours: arc.estimated_playtime_hours,
                difficultyRating: arc.difficulty_rating,
                playerAgencyLevel: arc.player_agency_level,
            },
        };
    }

    private formatChapter(chapter: StoryChapter) {
        return {
            id: chapter.id,
            arcId: chapter.arc_id,
            sequenceOrder: chapter.sequence_order,
            name: chapter.name,
            description: chapter.description,
            missions: {
                required: this.parseJson<string[]>(chapter.missions) || [],
                parallel: this.parseJson<string[]>(chapter.parallel_missions) || [],
                optional: this.parseJson<string[]>(chapter.optional_missions) || [],
            },
            triggers: {
                unlockConditions: this.parseJson<any>(chapter.unlock_conditions),
                autoStart: chapter.auto_start === 1,
                startEventId: chapter.start_event_id,
            },
            completion: {
                conditions: this.parseJson<any>(chapter.completion_conditions),
                eventId: chapter.completion_event_id,
                rewards: this.parseJson<any>(chapter.rewards),
            },
            branching: {
                branchPoints: this.parseJson<any[]>(chapter.branch_points) || [],
                variations: this.parseJson<any[]>(chapter.variations) || [],
            },
            pacing: {
                estimatedTimeMinutes: chapter.estimated_time_minutes,
                hasPointOfNoReturn: chapter.has_point_of_no_return === 1,
                pointOfNoReturnWarning: chapter.point_of_no_return_warning,
            },
            narrative: {
                summaryText: chapter.chapter_summary_text,
                recapDialogueId: chapter.recap_dialogue_id,
                endCutsceneId: chapter.end_chapter_cutscene_id,
            },
        };
    }

    private formatNarrativeEvent(event: NarrativeEvent) {
        return {
            id: event.id,
            code: event.code,
            name: event.name,
            description: event.description,
            type: {
                eventType: event.event_type,
                priority: event.priority,
                isSkippable: event.is_skippable === 1,
                isRepeatable: event.is_repeatable === 1,
                isAmbient: event.ambient_event === 1,
            },
            triggers: {
                type: event.trigger_type,
                conditions: this.parseJson<any>(event.trigger_conditions),
                locationId: event.trigger_location_id,
                time: this.parseJson<any>(event.trigger_time),
            },
            content: {
                dialogueTreeId: event.dialogue_tree_id,
                cutsceneId: event.cutscene_id,
                animationSequence: this.parseJson<any>(event.animation_sequence),
            },
            participants: {
                requiredNpcs: this.parseJson<string[]>(event.required_npcs) || [],
                optionalNpcs: this.parseJson<string[]>(event.optional_npcs) || [],
                spawnsNpcs: this.parseJson<string[]>(event.spawns_npcs) || [],
            },
            consequences: {
                stateChanges: this.parseJson<any>(event.state_changes),
                flagSets: this.parseJson<any>(event.flag_sets),
                unlocksContent: this.parseJson<any>(event.unlocks_content),
                reputationChanges: this.parseJson<any>(event.reputation_changes),
                itemGrants: this.parseJson<any>(event.item_grants),
                relationshipChanges: this.parseJson<any>(event.relationship_changes),
            },
            choices: {
                options: this.parseJson<any[]>(event.choices),
                defaultChoice: event.default_choice,
                timeoutChoice: event.timeout_choice,
                timeoutSeconds: event.timeout_seconds,
            },
            audioVisual: {
                backgroundMusicId: event.background_music_id,
                ambientAudioId: event.ambient_audio_id,
                weatherOverride: event.weather_override,
                timeOverride: event.time_override,
            },
        };
    }

    /**
     * Story Arcs
     */
    async listArcs(filters: { type?: string, isMain?: boolean }) {
        let query = `SELECT * FROM story_arcs WHERE 1=1`;
        const params: (string | number)[] = [];

        if (filters.type) {
            query += ` AND arc_type = ?`;
            params.push(filters.type);
        }

        if (filters.isMain !== undefined) {
            query += ` AND is_main_story = ?`;
            params.push(filters.isMain ? 1 : 0);
        }

        query += ` ORDER BY is_main_story DESC, estimated_playtime_hours DESC`;
        const result = await this.db.prepare(query).bind(...params).all<StoryArc>();
        return result.results.map(row => this.formatStoryArc(row));
    }

    async getArc(idOrCode: string) {
        const row = await this.db.prepare(
            `SELECT * FROM story_arcs WHERE id = ? OR code = ?`
        ).bind(idOrCode, idOrCode).first<StoryArc>();

        if (!row) return null;

        const chaptersResult = await this.db.prepare(
            `SELECT * FROM story_chapters WHERE arc_id = ? ORDER BY sequence_order ASC`
        ).bind(row.id).all<StoryChapter>();

        return {
            arc: this.formatStoryArc(row),
            chapters: chaptersResult.results.map(ch => this.formatChapter(ch))
        };
    }

    async getMainStoryArc() {
        const row = await this.db.prepare(
            `SELECT * FROM story_arcs WHERE is_main_story = 1 LIMIT 1`
        ).first<StoryArc>();

        if (!row) return null;

        const chaptersResult = await this.db.prepare(
            `SELECT * FROM story_chapters WHERE arc_id = ? ORDER BY sequence_order ASC`
        ).bind(row.id).all<StoryChapter>();

        return {
            arc: this.formatStoryArc(row),
            chapters: chaptersResult.results.map(ch => this.formatChapter(ch))
        };
    }

    /**
     * Chapters
     */
    async listChapters(filters: { arcId?: string, hasPONR?: boolean }) {
        let query = `
            SELECT sc.*, sa.name as arc_name, sa.code as arc_code
            FROM story_chapters sc
            LEFT JOIN story_arcs sa ON sa.id = sc.arc_id
            WHERE 1=1
        `;
        const params: (string | number)[] = [];

        if (filters.arcId) {
            query += ` AND sc.arc_id = ?`;
            params.push(filters.arcId);
        }

        if (filters.hasPONR !== undefined) {
            query += ` AND sc.has_point_of_no_return = ?`;
            params.push(filters.hasPONR ? 1 : 0);
        }

        query += ` ORDER BY sa.is_main_story DESC, sc.sequence_order ASC`;
        const result = await this.db.prepare(query).bind(...params).all<StoryChapter & { arc_name: string; arc_code: string }>();

        return result.results.map(row => ({
            ...this.formatChapter(row),
            arcName: row.arc_name,
            arcCode: row.arc_code,
        }));
    }

    async getChapter(id: string) {
        const row = await this.db.prepare(
            `SELECT sc.*, sa.name as arc_name, sa.code as arc_code
             FROM story_chapters sc
             LEFT JOIN story_arcs sa ON sa.id = sc.arc_id
             WHERE sc.id = ?`
        ).bind(id).first<StoryChapter & { arc_name: string; arc_code: string }>();

        if (!row) return null;

        // Get navigation
        const prev = await this.db.prepare(
            `SELECT id, name, sequence_order FROM story_chapters WHERE arc_id = ? AND sequence_order < ? ORDER BY sequence_order DESC LIMIT 1`
        ).bind(row.arc_id, row.sequence_order).first();

        const next = await this.db.prepare(
            `SELECT id, name, sequence_order FROM story_chapters WHERE arc_id = ? AND sequence_order > ? ORDER BY sequence_order ASC LIMIT 1`
        ).bind(row.arc_id, row.sequence_order).first();

        return {
            chapter: {
                ...this.formatChapter(row),
                arcName: row.arc_name,
                arcCode: row.arc_code,
            },
            navigation: {
                previous: prev,
                next: next,
            }
        };
    }

    /**
     * Narrative Events
     */
    async listEvents(filters: { type?: string, minPriority?: number, isSkippable?: boolean, limit?: number, offset?: number }) {
        let query = `SELECT * FROM narrative_events WHERE 1=1`;
        const params: (string | number)[] = [];

        if (filters.type) {
            query += ` AND event_type = ?`;
            params.push(filters.type);
        }

        if (filters.minPriority !== undefined) {
            query += ` AND priority >= ?`;
            params.push(filters.minPriority);
        }

        if (filters.isSkippable !== undefined) {
            query += ` AND is_skippable = ?`;
            params.push(filters.isSkippable ? 1 : 0);
        }

        query += ` ORDER BY priority DESC LIMIT ? OFFSET ?`;
        params.push(filters.limit || 50, filters.offset || 0);

        const result = await this.db.prepare(query).bind(...params).all<NarrativeEvent>();
        return result.results.map(row => this.formatNarrativeEvent(row));
    }

    async getPendingEvents(characterId: string) {
        const result = await this.db.prepare(`
            SELECT ne.* FROM narrative_events ne
            WHERE ne.id NOT IN (
              SELECT event_id FROM character_event_history
              WHERE character_id = ? AND completed_at IS NOT NULL
            )
            AND (ne.is_repeatable = 1 OR ne.id NOT IN (
              SELECT event_id FROM character_event_history WHERE character_id = ?
            ))
            ORDER BY ne.priority DESC
            LIMIT 20
        `).bind(characterId, characterId).all<NarrativeEvent>();

        return result.results.map(row => this.formatNarrativeEvent(row));
    }

    async getEvent(idOrCode: string) {
        const row = await this.db.prepare(
            `SELECT * FROM narrative_events WHERE id = ? OR code = ?`
        ).bind(idOrCode, idOrCode).first<NarrativeEvent>();
        return row ? this.formatNarrativeEvent(row) : null;
    }

    async triggerEvent(characterId: string, eventId: string, choiceMade?: string) {
        const event = await this.db.prepare(`SELECT * FROM narrative_events WHERE id = ?`).bind(eventId).first<NarrativeEvent>();
        if (!event) throw new Error('Event not found');

        if (event.is_repeatable === 0) {
            const existing = await this.db.prepare(
                `SELECT id FROM character_event_history WHERE character_id = ? AND event_id = ?`
            ).bind(characterId, eventId).first();
            if (existing) throw new Error('Event already triggered');
        }

        const historyId = crypto.randomUUID();
        const now = new Date().toISOString();

        await this.db.prepare(`
            INSERT INTO character_event_history (id, character_id, event_id, triggered_at, choice_made)
            VALUES (?, ?, ?, ?, ?)
        `).bind(historyId, characterId, eventId, now, choiceMade || null).run();

        if (event.flag_sets) {
            await this.db.prepare(`
                UPDATE character_story_state
                SET story_flags = json_patch(COALESCE(story_flags, '{}'), ?),
                    updated_at = datetime('now')
                WHERE character_id = ?
            `).bind(event.flag_sets, characterId).run();
        }

        return {
            historyId,
            event: this.formatNarrativeEvent(event),
            triggeredAt: now
        };
    }

    async completeEvent(characterId: string, eventId: string, outcome?: string) {
        const history = await this.db.prepare(`
            SELECT * FROM character_event_history
            WHERE character_id = ? AND event_id = ? AND completed_at IS NULL
            ORDER BY triggered_at DESC LIMIT 1
        `).bind(characterId, eventId).first<CharacterEventHistory>();

        if (!history) throw new Error('No pending event trigger found');

        const now = new Date().toISOString();
        await this.db.prepare(`
            UPDATE character_event_history
            SET completed_at = ?, outcome = ?
            WHERE id = ?
        `).bind(now, outcome || null, history.id).run();

        return { historyId: history.id, completedAt: now };
    }

    /**
     * Story Flags & Progress
     */
    async listFlagDefinitions() {
        const result = await this.db.prepare(`SELECT * FROM story_flags ORDER BY code ASC`).all<StoryFlag>();
        return result.results;
    }

    async getCharacterStoryState(characterId: string) {
        let state = await this.db.prepare(
            `SELECT * FROM character_story_state WHERE character_id = ?`
        ).bind(characterId).first<CharacterStoryState>();

        if (!state) {
            const id = crypto.randomUUID();
            const now = new Date().toISOString();
            await this.db.prepare(`
                INSERT INTO character_story_state (id, character_id, story_flags, created_at, updated_at)
                VALUES (?, ?, '{}', ?, ?)
            `).bind(id, characterId, now, now).run();

            state = await this.db.prepare(`SELECT * FROM character_story_state WHERE id = ?`).bind(id).first<CharacterStoryState>();
        }

        return state;
    }

    async setCharacterStoryFlag(characterId: string, flagCode: string, value: any, isPermanent: boolean = false) {
        const col = isPermanent ? 'permanent_flags' : 'story_flags';
        const patch = JSON.stringify({ [flagCode]: value });

        await this.db.prepare(`
            UPDATE character_story_state
            SET ${col} = json_patch(COALESCE(${col}, '{}'), ?),
                updated_at = datetime('now')
            WHERE character_id = ?
        `).bind(patch, characterId).run();

        return { success: true };
    }

    async advanceStoryProgress(characterId: string, arcId?: string, chapterId?: string) {
        const now = new Date().toISOString();

        const updates: string[] = [];
        const params: any[] = [];

        if (arcId) {
            updates.push('current_main_arc_id = ?');
            params.push(arcId);
        }
        if (chapterId) {
            updates.push('current_main_chapter_id = ?');
            params.push(chapterId);
        }

        if (updates.length > 0) {
            params.push(characterId);
            await this.db.prepare(`
                UPDATE character_story_state
                SET ${updates.join(', ')}, updated_at = ?
                WHERE character_id = ?
            `).bind(...params, now, characterId).run();
        }

        return { success: true, updatedAt: now };
    }

    async completeStoryArc(characterId: string, arcId: string, endingId?: string) {
        const now = new Date().toISOString();
        const state = await this.getCharacterStoryState(characterId);

        let completed = this.parseJson<string[]>(state!.completed_arcs) || [];
        if (!completed.includes(arcId)) {
            completed.push(arcId);
        }

        let endings = this.parseJson<string[]>(state!.endings_seen) || [];
        if (endingId && !endings.includes(endingId)) {
            endings.push(endingId);
        }

        await this.db.prepare(`
            UPDATE character_story_state
            SET completed_arcs = ?, 
                endings_seen = ?,
                current_main_arc_id = NULL,
                current_main_chapter_id = NULL,
                updated_at = ?
            WHERE character_id = ?
        `).bind(JSON.stringify(completed), JSON.stringify(endings), now, characterId).run();

        return { success: true, completedArcs: completed };
    }
}
