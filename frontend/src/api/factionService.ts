/**
 * Faction Service - API layer for faction operations
 *
 * Endpoints:
 * - GET /api/factions - List all factions
 * - GET /api/factions/:id - Get faction details
 * - GET /api/factions/:id/standing - Player's standing
 * - GET /api/factions/:id/members - Faction leaderboard
 * - GET /api/factions/wars/active - Active faction wars
 * - POST /api/factions/wars/:warId/contribute - War contribution
 * - POST /api/factions/:id/join - Join faction
 * - POST /api/factions/:id/leave - Leave faction
 */

import { api } from './client';

// =============================================================================
// TYPES - Factions
// =============================================================================

export type FactionType =
  | 'CORPORATION'
  | 'GANG'
  | 'SYNDICATE'
  | 'GOVERNMENT'
  | 'UNDERGROUND'
  | 'MERCENARY'
  | 'CULT';

export type ReputationTier =
  | 'HOSTILE'
  | 'UNFRIENDLY'
  | 'NEUTRAL'
  | 'FRIENDLY'
  | 'ALLIED'
  | 'REVERED';

export interface FactionSummary {
  id: string;
  code: string;
  name: string;
  factionType: FactionType;
  isJoinable: boolean;
  activeWars: number;
}

export interface FactionDetail {
  id: string;
  code: string;
  name: string;
  description?: string;
  factionType: FactionType;
  isJoinable: boolean;
  baseReputation: number;
  memberCount?: number;
  territory?: string[];
  headquarters?: string;
  created_at: string;
}

export interface FactionRelationship {
  factionId: string;
  factionName: string;
  relationship: 'ALLIED' | 'FRIENDLY' | 'NEUTRAL' | 'HOSTILE' | 'AT_WAR';
}

export interface FactionStats {
  total_members: number;
  active_members: number;
  total_reputation_gained: number;
  wars_won: number;
  wars_lost: number;
}

// =============================================================================
// TYPES - Standing
// =============================================================================

export interface PlayerStanding {
  reputationValue: number;
  reputationTier: ReputationTier;
  isMember: boolean;
  rank?: string;
  contributionPoints?: number;
  joinedAt?: string;
}

export interface FactionPerk {
  id: string;
  name: string;
  description: string;
  tierRequired: ReputationTier;
  isUnlocked: boolean;
}

export interface NextTierInfo {
  tier: ReputationTier;
  requiredReputation: number;
  currentProgress: number;
}

export interface StandingResponse {
  standing: PlayerStanding;
  perks: FactionPerk[];
  nextTier?: NextTierInfo;
}

// =============================================================================
// TYPES - Leaderboard
// =============================================================================

export interface FactionMember {
  characterId: string;
  handle: string;
  rank: string;
  contributionPoints: number;
  joinedAt: string;
}

export interface MembersResponse {
  members: FactionMember[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// =============================================================================
// TYPES - Wars
// =============================================================================

export type WarStatus = 'PENDING' | 'ACTIVE' | 'CONCLUDED' | 'CEASEFIRE';

export interface FactionWar {
  id: string;
  attacker_id: string;
  attacker_name: string;
  defender_id: string;
  defender_name: string;
  status: WarStatus;
  started_at: string;
  ends_at?: string;
  attacker_score: number;
  defender_score: number;
  winner_id?: string;
}

export interface WarObjective {
  id: string;
  name: string;
  description: string;
  objectiveType: string;
  pointValue: number;
  controlledBy?: string;
  contestedBy?: string[];
}

export interface WarDetailResponse {
  war: FactionWar;
  objectives: WarObjective[];
  playerContributions?: {
    total: number;
    rank: number;
    recentActions: Array<{
      type: string;
      points: number;
      timestamp: string;
    }>;
  };
}

export type ContributionType =
  | 'COMBAT'
  | 'SABOTAGE'
  | 'INTEL'
  | 'SUPPLY'
  | 'TERRITORY';

export interface ContributeRequest {
  contributionType: ContributionType;
  value: number;
  objectiveId?: string;
}

export interface ContributeResponse {
  contribution: {
    id: string;
    type: ContributionType;
    value: number;
    points: number;
  };
  factionScore: number;
  reputationGained: number;
  message?: string;
}

// =============================================================================
// TYPES - Join/Leave
// =============================================================================

export interface JoinFactionResponse {
  message: string;
  rank: string;
  perksUnlocked: string[];
}

export interface LeaveFactionResponse {
  message: string;
  reputationPenalty: number;
}

// =============================================================================
// SERVICE
// =============================================================================

export const factionService = {
  // =========================================================================
  // Faction Information
  // =========================================================================

  /**
   * List all factions
   */
  async list(): Promise<{ factions: FactionSummary[] }> {
    return api.get('/factions');
  },

  /**
   * Get detailed faction information
   */
  async get(factionId: string): Promise<{
    faction: FactionDetail;
    relationships: FactionRelationship[];
    activeWars: FactionWar[];
    topContributors: FactionMember[];
    stats: FactionStats;
  }> {
    return api.get(`/factions/${factionId}`);
  },

  /**
   * Get player's standing with a faction
   */
  async getStanding(factionId: string): Promise<StandingResponse> {
    return api.get(`/factions/${factionId}/standing`);
  },

  /**
   * Get faction leaderboard/members
   */
  async getMembers(
    factionId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<MembersResponse> {
    const params: Record<string, string> = {};
    if (options?.limit) params.limit = String(options.limit);
    if (options?.offset) params.offset = String(options.offset);

    return api.get(`/factions/${factionId}/members`, { params });
  },

  // =========================================================================
  // Membership
  // =========================================================================

  /**
   * Join a faction
   */
  async join(factionId: string): Promise<JoinFactionResponse> {
    return api.post(`/factions/${factionId}/join`);
  },

  /**
   * Leave a faction (incurs reputation penalty)
   */
  async leave(factionId: string): Promise<LeaveFactionResponse> {
    return api.post(`/factions/${factionId}/leave`);
  },

  // =========================================================================
  // Faction Wars
  // =========================================================================

  /**
   * Get all active faction wars
   */
  async getActiveWars(): Promise<{ wars: FactionWar[] }> {
    return api.get('/factions/wars/active');
  },

  /**
   * Get detailed war information
   */
  async getWar(warId: string): Promise<WarDetailResponse> {
    return api.get(`/factions/wars/${warId}`);
  },

  /**
   * Submit a war contribution
   */
  async contribute(
    warId: string,
    data: ContributeRequest
  ): Promise<ContributeResponse> {
    return api.post(`/factions/wars/${warId}/contribute`, data);
  },
};

export default factionService;
