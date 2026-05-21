
export interface StoryArc {
    id: string;
    code: string;
    name: string;
    description: string | null;
    arc_type: string;
    is_main_story: number;
    is_repeatable: number;
    chapters: string | null;
    parallel_arcs: string | null;
    prerequisite_arcs: string | null;
    mutually_exclusive_arcs: string | null;
    protagonist_npcs: string | null;
    antagonist_npcs: string | null;
    supporting_npcs: string | null;
    themes: string | null;
    tone: string | null;
    moral_questions: string | null;
    possible_endings: string | null;
    default_ending_id: string | null;
    estimated_playtime_hours: number | null;
    difficulty_rating: number;
    player_agency_level: number;
    created_at: string;
    updated_at: string;
}

export interface StoryChapter {
    id: string;
    arc_id: string;
    sequence_order: number;
    name: string;
    description: string | null;
    missions: string | null;
    parallel_missions: string | null;
    optional_missions: string | null;
    unlock_conditions: string | null;
    auto_start: number;
    start_event_id: string | null;
    completion_conditions: string | null;
    completion_event_id: string | null;
    rewards: string | null;
    branch_points: string | null;
    variations: string | null;
    estimated_time_minutes: number | null;
    has_point_of_no_return: number;
    point_of_no_return_warning: string | null;
    chapter_summary_text: string | null;
    recap_dialogue_id: string | null;
    end_chapter_cutscene_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface NarrativeEvent {
    id: string;
    code: string;
    name: string;
    description: string | null;
    event_type: string;
    priority: number;
    is_skippable: number;
    is_repeatable: number;
    trigger_type: string | null;
    trigger_conditions: string | null;
    trigger_location_id: string | null;
    trigger_time: string | null;
    dialogue_tree_id: string | null;
    cutscene_id: string | null;
    animation_sequence: string | null;
    ambient_event: number;
    required_npcs: string | null;
    optional_npcs: string | null;
    spawns_npcs: string | null;
    state_changes: string | null;
    flag_sets: string | null;
    unlocks_content: string | null;
    reputation_changes: string | null;
    item_grants: string | null;
    relationship_changes: string | null;
    choices: string | null;
    default_choice: string | null;
    timeout_choice: string | null;
    timeout_seconds: number | null;
    background_music_id: string | null;
    ambient_audio_id: string | null;
    weather_override: string | null;
    time_override: string | null;
    created_at: string;
    updated_at: string;
}

export interface StoryFlag {
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: string | null;
    flag_type: string;
    default_value: string | null;
    is_global: number;
    arc_specific: string | null;
    mission_specific: string | null;
    persists_after_arc: number;
    resets_on_new_game: number;
    triggers_events: string | null;
    unlocks_dialogue: string | null;
    unlocks_missions: string | null;
    affects_ending: number;
    created_at: string;
}

export interface CharacterStoryState {
    id: string;
    character_id: string;
    current_main_arc_id: string | null;
    current_main_chapter_id: string | null;
    completed_arcs: string | null;
    active_arcs: string | null;
    failed_arcs: string | null;
    story_flags: string | null;
    permanent_flags: string | null;
    major_choices_made: string | null;
    pending_consequences: string | null;
    endings_seen: string | null;
    current_ending_track: string | null;
    ending_points: string | null;
    story_completion_percent: number;
    total_story_choices: number;
    time_in_story_content_hours: number;
    cutscenes_watched: string | null;
    cutscenes_skipped: string | null;
    created_at: string;
    updated_at: string;
}

export interface CharacterEventHistory {
    id: string;
    character_id: string;
    event_id: string;
    triggered_at: string;
    completed_at: string | null;
    choice_made: string | null;
    outcome: string | null;
}
