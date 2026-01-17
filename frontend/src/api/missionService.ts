/**
 * Mission Service - API layer for mission operations
 *
 * Endpoints:
 * - GET /api/missions/available - List available missions
 * - GET /api/missions/active - Get active mission
 * - GET /api/missions/:id - Get mission details
 * - POST /api/missions/:id/accept - Accept mission
 * - POST /api/missions/:id/action - Take mission action
 * - POST /api/missions/:id/complete - Complete mission
 * - POST /api/missions/:id/abandon - Abandon mission
 */

import { api } from './client';

// =============================================================================
// TYPES - Missions
// =============================================================================

export type MissionType =
  | 'STANDARD'
  | 'EXPRESS'
  | 'RUSH'
  | 'HAZMAT'
  | 'CONTRABAND'
  | 'FRAGILE'
  | 'SECURE'
  | 'COVERT';

export type MissionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'ABANDONED'
  | 'EXPIRED';

export type DifficultyLevel = 'TRIVIAL' | 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME' | 'NIGHTMARE';

export type RiskLevel = 'MINIMAL' | 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

// =============================================================================
// TYPES - Mission Data
// =============================================================================

export interface MissionDefinition {
  id: string;
  name: string;
  description?: string;
  type: MissionType;
  difficulty: DifficultyLevel;
  riskLevel: RiskLevel;
  tierRequired: number;
  ratingRequired?: number;
  timeLimit?: number; // minutes
  baseCredits: number;
  baseXp: number;
  baseReputation?: number;
}

export interface MissionInstance {
  id: string;
  missionId: string;
  characterId: string;
  status: MissionStatus;
  startedAt: string;
  expiresAt?: string;
  completedAt?: string;
  finalOutcome?: string;
}

export interface MissionCheckpoint {
  id: string;
  name: string;
  description: string;
  sequenceOrder: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface ActiveMission {
  instance: MissionInstance;
  definition: MissionDefinition;
  checkpoints: MissionCheckpoint[];
  progress: number;
  timeRemaining?: number;
}

export interface MissionRewards {
  credits: number;
  xp: number;
  ratingChange: number;
  items?: Array<{
    itemId: string;
    name: string;
    quantity: number;
  }>;
}

// =============================================================================
// TYPES - Request/Response
// =============================================================================

export interface AvailableMissionsResponse {
  missions: MissionDefinition[];
  canAcceptNew: boolean;
  currentTier: number;
}

export interface ActiveMissionResponse {
  mission: ActiveMission | null;
}

export interface MissionDetailsResponse {
  mission: MissionDefinition;
  requirements: Array<{
    type: string;
    value: number;
    met: boolean;
  }>;
  rewards: MissionRewards;
  isAccessible: boolean;
}

export interface AcceptMissionResponse {
  instance: MissionInstance;
  mission: MissionDefinition;
  message: string;
}

export type MissionActionType =
  | 'MOVE'
  | 'INTERACT'
  | 'COMBAT'
  | 'STEALTH'
  | 'HACK'
  | 'NEGOTIATE'
  | 'DELIVER';

export interface MissionActionRequest {
  actionType: MissionActionType;
  parameters?: Record<string, unknown>;
}

export interface MissionActionResponse {
  result: {
    success: boolean;
    outcome: string;
    description?: string;
  };
  remainingObjectives: number;
  checkpointUpdates?: MissionCheckpoint[];
  stateChanges?: Record<string, unknown>;
}

export interface CompleteMissionRequest {
  outcome: 'SUCCESS' | 'PARTIAL' | 'FAILURE';
  customerRating?: number;
}

export interface CompleteMissionResponse {
  outcome: string;
  rewards: MissionRewards;
  tierProgress?: {
    current: number;
    xpToNext: number;
    xpEarned: number;
  };
}

export interface AbandonMissionResponse {
  message: string;
  ratingPenalty: number;
}

// =============================================================================
// SERVICE
// =============================================================================

export const missionService = {
  /**
   * Get available missions for character's current tier
   */
  async getAvailable(): Promise<AvailableMissionsResponse> {
    return api.get('/missions/available');
  },

  /**
   * Get currently active mission (if any)
   */
  async getActive(): Promise<ActiveMissionResponse> {
    return api.get('/missions/active');
  },

  /**
   * Get detailed mission information
   */
  async getDetails(missionId: string): Promise<MissionDetailsResponse> {
    return api.get(`/missions/${missionId}`);
  },

  /**
   * Accept a mission
   */
  async accept(missionId: string): Promise<AcceptMissionResponse> {
    return api.post(`/missions/${missionId}/accept`);
  },

  /**
   * Take an action during an active mission
   */
  async action(
    missionId: string,
    data: MissionActionRequest
  ): Promise<MissionActionResponse> {
    return api.post(`/missions/${missionId}/action`, data);
  },

  /**
   * Complete a mission
   */
  async complete(
    missionId: string,
    data: CompleteMissionRequest
  ): Promise<CompleteMissionResponse> {
    return api.post(`/missions/${missionId}/complete`, data);
  },

  /**
   * Abandon an active mission (incurs rating penalty)
   */
  async abandon(missionId: string): Promise<AbandonMissionResponse> {
    return api.post(`/missions/${missionId}/abandon`);
  },

  /**
   * Get mission history for character
   */
  async getHistory(options?: {
    limit?: number;
    offset?: number;
    status?: MissionStatus;
  }): Promise<{
    missions: MissionInstance[];
    pagination: { limit: number; offset: number; total: number };
  }> {
    const params: Record<string, string> = {};
    if (options?.limit) params.limit = String(options.limit);
    if (options?.offset) params.offset = String(options.offset);
    if (options?.status) params.status = options.status;

    return api.get('/missions/history', { params });
  },
};

export default missionService;
