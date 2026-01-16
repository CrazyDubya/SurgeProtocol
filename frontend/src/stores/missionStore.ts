/**
 * Mission Store - Mission data and state management
 *
 * Handles:
 * - Available missions
 * - Active mission and progress
 * - Mission history
 * - Mission filters
 */

import { signal, computed } from '@preact/signals';

// =============================================================================
// TYPES
// =============================================================================

export interface MissionDefinition {
  id: string;
  title: string;
  description: string;
  missionType: string;
  difficulty: string;
  tierRequired: number;
  ratingRequired: number;
  timeLimit?: number;
  baseCredits: number;
  baseXp: number;
  baseReputation: number;
  riskLevel: string;
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
  creditsEarned?: number;
  xpEarned?: number;
  reputationChange?: number;
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
  progress: number; // 0-100
}

export type MissionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'FAILED'
  | 'ABANDONED'
  | 'EXPIRED';

export interface MissionFilter {
  type?: string;
  difficulty?: string;
  minReward?: number;
  search?: string;
}

// =============================================================================
// STATE SIGNALS
// =============================================================================

// Mission data
export const availableMissions = signal<MissionDefinition[]>([]);
export const activeMission = signal<ActiveMission | null>(null);
export const missionHistory = signal<MissionInstance[]>([]);

// Metadata
export const currentTier = signal(1);
export const carrierRating = signal(0);
export const canAcceptNew = signal(true);

// Filters
export const missionFilter = signal<MissionFilter>({});

// Loading states
export const isLoadingMissions = signal(false);
export const isLoadingActive = signal(false);
export const missionError = signal<string | null>(null);

// =============================================================================
// COMPUTED VALUES
// =============================================================================

/** Filtered available missions */
export const filteredMissions = computed(() => {
  const missions = availableMissions.value;
  const filter = missionFilter.value;

  return missions.filter((mission) => {
    // Type filter
    if (filter.type && mission.missionType !== filter.type) {
      return false;
    }

    // Difficulty filter
    if (filter.difficulty && mission.difficulty !== filter.difficulty) {
      return false;
    }

    // Min reward filter
    if (filter.minReward && mission.baseCredits < filter.minReward) {
      return false;
    }

    // Search filter
    if (filter.search) {
      const search = filter.search.toLowerCase();
      const matchesTitle = mission.title.toLowerCase().includes(search);
      const matchesDesc = mission.description.toLowerCase().includes(search);
      if (!matchesTitle && !matchesDesc) {
        return false;
      }
    }

    return true;
  });
});

/** Has active mission */
export const hasActiveMission = computed(() => activeMission.value !== null);

/** Active mission progress percentage */
export const activeMissionProgress = computed(() => {
  const mission = activeMission.value;
  if (!mission) return 0;

  const completed = mission.checkpoints.filter((c) => c.isCompleted).length;
  const total = mission.checkpoints.length;

  return total > 0 ? Math.round((completed / total) * 100) : mission.progress;
});

/** Time remaining on active mission (in seconds) */
export const timeRemaining = computed(() => {
  const mission = activeMission.value;
  if (!mission?.instance.expiresAt) return null;

  const expiresAt = new Date(mission.instance.expiresAt).getTime();
  const now = Date.now();
  const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

  return remaining;
});

/** Is mission timer critical (< 5 minutes) */
export const isTimeCritical = computed(() => {
  const remaining = timeRemaining.value;
  return remaining !== null && remaining < 300;
});

/** Mission stats summary */
export const missionStats = computed(() => {
  const history = missionHistory.value;

  const completed = history.filter((m) => m.status === 'COMPLETED').length;
  const failed = history.filter((m) => m.status === 'FAILED').length;
  const abandoned = history.filter((m) => m.status === 'ABANDONED').length;
  const total = history.length;

  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const totalCredits = history
    .filter((m) => m.status === 'COMPLETED')
    .reduce((sum, m) => sum + (m.creditsEarned || 0), 0);

  return {
    completed,
    failed,
    abandoned,
    total,
    successRate,
    totalCredits,
  };
});

/** Available mission types for filtering */
export const availableMissionTypes = computed(() => {
  const types = new Set(availableMissions.value.map((m) => m.missionType));
  return Array.from(types);
});

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Set available missions
 */
export function setAvailableMissions(missions: MissionDefinition[]): void {
  availableMissions.value = missions;
}

/**
 * Set active mission
 */
export function setActiveMission(mission: ActiveMission | null): void {
  activeMission.value = mission;
  canAcceptNew.value = mission === null;
}

/**
 * Set mission history
 */
export function setMissionHistory(history: MissionInstance[]): void {
  missionHistory.value = history;
}

/**
 * Update mission filter
 */
export function setMissionFilter(filter: MissionFilter): void {
  missionFilter.value = filter;
}

/**
 * Clear mission filter
 */
export function clearMissionFilter(): void {
  missionFilter.value = {};
}

/**
 * Set character tier info
 */
export function setTierInfo(tier: number, rating: number): void {
  currentTier.value = tier;
  carrierRating.value = rating;
}

/**
 * Update checkpoint completion (optimistic)
 */
export function completeCheckpoint(checkpointId: string): void {
  const mission = activeMission.value;
  if (!mission) return;

  activeMission.value = {
    ...mission,
    checkpoints: mission.checkpoints.map((cp) =>
      cp.id === checkpointId
        ? { ...cp, isCompleted: true, completedAt: new Date().toISOString() }
        : cp
    ),
  };
}

/**
 * Set loading state
 */
export function setLoadingMissions(loading: boolean): void {
  isLoadingMissions.value = loading;
}

/**
 * Set loading active state
 */
export function setLoadingActive(loading: boolean): void {
  isLoadingActive.value = loading;
}

/**
 * Set error
 */
export function setMissionError(error: string | null): void {
  missionError.value = error;
}

/**
 * Clear all mission data
 */
export function clearMissionData(): void {
  availableMissions.value = [];
  activeMission.value = null;
  missionHistory.value = [];
  missionFilter.value = {};
  missionError.value = null;
}

/**
 * Remove mission from available (after accepting)
 */
export function removeMissionFromAvailable(missionId: string): void {
  availableMissions.value = availableMissions.value.filter(
    (m) => m.id !== missionId
  );
}

// =============================================================================
// STORE EXPORT
// =============================================================================

export const missionStore = {
  // State
  availableMissions,
  activeMission,
  missionHistory,
  currentTier,
  carrierRating,
  canAcceptNew,
  missionFilter,
  isLoadingMissions,
  isLoadingActive,
  missionError,

  // Computed
  filteredMissions,
  hasActiveMission,
  activeMissionProgress,
  timeRemaining,
  isTimeCritical,
  missionStats,
  availableMissionTypes,

  // Actions
  setAvailableMissions,
  setActiveMission,
  setMissionHistory,
  setMissionFilter,
  clearMissionFilter,
  setTierInfo,
  completeCheckpoint,
  setLoadingMissions,
  setLoadingActive,
  setMissionError,
  clearMissionData,
  removeMissionFromAvailable,
};

export default missionStore;
