
export interface Friendship {
    id: string;
    player_id: string;
    friend_id: string;
    created_at: string;
    status: 'PENDING_SENT' | 'ACCEPTED' | 'BLOCKED';
    initiated_by: string | null;
    nickname: string | null;
    group_name: string | null;
    favorite: number;
    last_interaction: string | null;
    interaction_count: number;
    times_played_together: number;
    can_join_session: number;
    can_see_location: number;
    can_send_items: number;
    notification_level: 'ALL' | 'IMPORTANT' | 'NONE';
}

export interface Crew {
    id: string;
    created_at: string;
    name: string;
    tag: string | null;
    description: string | null;
    motto: string | null;
    emblem_asset: string | null;
    colors: string | null; // JSON
    founder_id: string | null;
    leader_id: string | null;
    officers: string | null; // JSON
    member_count: number;
    max_members: number;
    recruitment_status: 'OPEN' | 'INVITE_ONLY' | 'CLOSED';
    requirements: string | null; // JSON
    application_questions: string | null; // JSON
    total_deliveries: number;
    total_credits_earned: number;
    average_tier: number;
    competition_wins: number;
    crew_rating: number;
    crew_bank_balance: number;
    shared_inventory: string | null; // JSON
    privacy: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
    member_permissions: string | null; // JSON
    rank_definitions: string | null; // JSON
    is_active: number;
}

export interface CrewMembership {
    id: string;
    crew_id: string;
    player_id: string;
    joined_at: string;
    rank: string;
    rank_order: number;
    custom_title: string | null;
    can_invite: number;
    can_kick: number;
    can_promote: number;
    can_edit_settings: number;
    can_access_bank: number;
    bank_withdraw_limit: number;
    deliveries_for_crew: number;
    credits_contributed: number;
    events_participated: number;
    recruitment_count: number;
    is_active: number;
    last_active: string | null;
    on_probation: number;
    notes: string | null;
}

export interface FriendRequestResult {
    friendshipId: string;
    toPlayer: {
        id: string;
        displayName: string | null;
    };
    message: string;
}

export interface CrewCreateRequest {
    name: string;
    tag?: string;
    description?: string;
    motto?: string;
    colors?: { primary: string; secondary: string };
    recruitmentStatus?: 'OPEN' | 'INVITE_ONLY' | 'CLOSED';
    privacy?: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
}

export interface CrewUpdateRequest {
    description?: string;
    motto?: string;
    colors?: { primary: string; secondary: string };
    recruitmentStatus?: 'OPEN' | 'INVITE_ONLY' | 'CLOSED';
    privacy?: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
    maxMembers?: number;
    requirements?: {
        minTier?: number;
        minRating?: number;
        minDeliveries?: number;
    };
}
