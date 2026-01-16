/**
 * Mission Store Tests
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  availableMissions,
  activeMission,
  missionHistory,
  currentTier,
  carrierRating,
  canAcceptNew,
  missionFilter,
  isLoadingMissions,
  missionError,
  filteredMissions,
  hasActiveMission,
  activeMissionProgress,
  timeRemaining,
  isTimeCritical,
  missionStats,
  availableMissionTypes,
  setAvailableMissions,
  setActiveMission,
  setMissionHistory,
  setMissionFilter,
  clearMissionFilter,
  setTierInfo,
  completeCheckpoint,
  setLoadingMissions,
  setMissionError,
  clearMissionData,
  removeMissionFromAvailable,
  MissionDefinition,
  MissionInstance,
  ActiveMission,
  MissionCheckpoint,
} from './missionStore';

// Mock mission data
const mockMissions: MissionDefinition[] = [
  {
    id: 'mission-1',
    title: 'Data Heist',
    description: 'Extract corporate data from a secured facility',
    missionType: 'extraction',
    difficulty: 'medium',
    tierRequired: 1,
    ratingRequired: 3.0,
    timeLimit: 3600,
    baseCredits: 5000,
    baseXp: 100,
    baseReputation: 10,
    riskLevel: 'moderate',
  },
  {
    id: 'mission-2',
    title: 'Package Delivery',
    description: 'Deliver a sensitive package across town',
    missionType: 'delivery',
    difficulty: 'easy',
    tierRequired: 1,
    ratingRequired: 2.0,
    timeLimit: 1800,
    baseCredits: 1500,
    baseXp: 50,
    baseReputation: 5,
    riskLevel: 'low',
  },
  {
    id: 'mission-3',
    title: 'VIP Escort',
    description: 'Escort a high-value target through hostile territory',
    missionType: 'escort',
    difficulty: 'hard',
    tierRequired: 2,
    ratingRequired: 4.0,
    timeLimit: 7200,
    baseCredits: 10000,
    baseXp: 200,
    baseReputation: 25,
    riskLevel: 'high',
  },
];

const mockCheckpoints: MissionCheckpoint[] = [
  {
    id: 'cp-1',
    name: 'Reach the facility',
    description: 'Navigate to the target building',
    sequenceOrder: 1,
    isCompleted: true,
    completedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'cp-2',
    name: 'Infiltrate security',
    description: 'Bypass the outer security layer',
    sequenceOrder: 2,
    isCompleted: false,
  },
  {
    id: 'cp-3',
    name: 'Extract data',
    description: 'Download the target files',
    sequenceOrder: 3,
    isCompleted: false,
  },
  {
    id: 'cp-4',
    name: 'Exfiltrate',
    description: 'Escape without detection',
    sequenceOrder: 4,
    isCompleted: false,
  },
];

const mockActiveMission: ActiveMission = {
  instance: {
    id: 'inst-1',
    missionId: 'mission-1',
    characterId: 'char-123',
    status: 'ACTIVE',
    startedAt: '2026-01-16T08:00:00Z',
    expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  },
  definition: mockMissions[0],
  checkpoints: mockCheckpoints,
  progress: 25,
};

const mockHistory: MissionInstance[] = [
  {
    id: 'hist-1',
    missionId: 'mission-2',
    characterId: 'char-123',
    status: 'COMPLETED',
    startedAt: '2026-01-14T10:00:00Z',
    completedAt: '2026-01-14T11:00:00Z',
    finalOutcome: 'success',
    creditsEarned: 1500,
    xpEarned: 50,
    reputationChange: 5,
  },
  {
    id: 'hist-2',
    missionId: 'mission-1',
    characterId: 'char-123',
    status: 'FAILED',
    startedAt: '2026-01-13T14:00:00Z',
    completedAt: '2026-01-13T15:30:00Z',
    finalOutcome: 'detected',
    creditsEarned: 0,
    xpEarned: 25,
    reputationChange: -5,
  },
  {
    id: 'hist-3',
    missionId: 'mission-2',
    characterId: 'char-123',
    status: 'COMPLETED',
    startedAt: '2026-01-12T08:00:00Z',
    completedAt: '2026-01-12T08:45:00Z',
    finalOutcome: 'success',
    creditsEarned: 1500,
    xpEarned: 50,
    reputationChange: 5,
  },
  {
    id: 'hist-4',
    missionId: 'mission-3',
    characterId: 'char-123',
    status: 'ABANDONED',
    startedAt: '2026-01-11T12:00:00Z',
    completedAt: '2026-01-11T12:30:00Z',
  },
];

// Helper to reset store state
function resetStore() {
  availableMissions.value = [];
  activeMission.value = null;
  missionHistory.value = [];
  currentTier.value = 1;
  carrierRating.value = 0;
  canAcceptNew.value = true;
  missionFilter.value = {};
  isLoadingMissions.value = false;
  missionError.value = null;
}

describe('Mission Store', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Mission Data Management', () => {
    it('should set available missions', () => {
      setAvailableMissions(mockMissions);
      expect(availableMissions.value).toHaveLength(3);
    });

    it('should set active mission', () => {
      setActiveMission(mockActiveMission);
      expect(activeMission.value).toEqual(mockActiveMission);
      expect(canAcceptNew.value).toBe(false);
    });

    it('should clear canAcceptNew when mission is set', () => {
      expect(canAcceptNew.value).toBe(true);
      setActiveMission(mockActiveMission);
      expect(canAcceptNew.value).toBe(false);
    });

    it('should set canAcceptNew to true when mission cleared', () => {
      setActiveMission(mockActiveMission);
      setActiveMission(null);
      expect(canAcceptNew.value).toBe(true);
    });

    it('should set mission history', () => {
      setMissionHistory(mockHistory);
      expect(missionHistory.value).toHaveLength(4);
    });

    it('should remove mission from available', () => {
      setAvailableMissions(mockMissions);
      removeMissionFromAvailable('mission-1');
      expect(availableMissions.value).toHaveLength(2);
      expect(availableMissions.value.find((m) => m.id === 'mission-1')).toBeUndefined();
    });

    it('should clear all mission data', () => {
      setAvailableMissions(mockMissions);
      setActiveMission(mockActiveMission);
      setMissionHistory(mockHistory);

      clearMissionData();

      expect(availableMissions.value).toEqual([]);
      expect(activeMission.value).toBeNull();
      expect(missionHistory.value).toEqual([]);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      setAvailableMissions(mockMissions);
    });

    it('should filter by type', () => {
      setMissionFilter({ type: 'delivery' });
      expect(filteredMissions.value).toHaveLength(1);
      expect(filteredMissions.value[0].title).toBe('Package Delivery');
    });

    it('should filter by difficulty', () => {
      setMissionFilter({ difficulty: 'hard' });
      expect(filteredMissions.value).toHaveLength(1);
      expect(filteredMissions.value[0].title).toBe('VIP Escort');
    });

    it('should filter by minimum reward', () => {
      setMissionFilter({ minReward: 5000 });
      expect(filteredMissions.value).toHaveLength(2);
    });

    it('should filter by search in title', () => {
      setMissionFilter({ search: 'heist' });
      expect(filteredMissions.value).toHaveLength(1);
      expect(filteredMissions.value[0].title).toBe('Data Heist');
    });

    it('should filter by search in description', () => {
      setMissionFilter({ search: 'package' });
      expect(filteredMissions.value).toHaveLength(1);
      expect(filteredMissions.value[0].title).toBe('Package Delivery');
    });

    it('should combine multiple filters', () => {
      setMissionFilter({ difficulty: 'medium', minReward: 3000 });
      expect(filteredMissions.value).toHaveLength(1);
      expect(filteredMissions.value[0].title).toBe('Data Heist');
    });

    it('should clear filter', () => {
      setMissionFilter({ type: 'delivery' });
      clearMissionFilter();
      expect(filteredMissions.value).toHaveLength(3);
    });
  });

  describe('Active Mission', () => {
    it('should detect has active mission', () => {
      expect(hasActiveMission.value).toBe(false);
      setActiveMission(mockActiveMission);
      expect(hasActiveMission.value).toBe(true);
    });

    it('should calculate progress from checkpoints', () => {
      setActiveMission(mockActiveMission);
      // 1 of 4 checkpoints complete = 25%
      expect(activeMissionProgress.value).toBe(25);
    });

    it('should use progress field when no checkpoints', () => {
      setActiveMission({
        ...mockActiveMission,
        checkpoints: [],
        progress: 50,
      });
      expect(activeMissionProgress.value).toBe(50);
    });

    it('should return 0 progress when no active mission', () => {
      expect(activeMissionProgress.value).toBe(0);
    });

    it('should complete checkpoint', () => {
      setActiveMission(mockActiveMission);
      completeCheckpoint('cp-2');

      const checkpoint = activeMission.value?.checkpoints.find((c) => c.id === 'cp-2');
      expect(checkpoint?.isCompleted).toBe(true);
      expect(checkpoint?.completedAt).toBeDefined();
    });

    it('should not update if no active mission', () => {
      completeCheckpoint('cp-1'); // Should not throw
      expect(activeMission.value).toBeNull();
    });
  });

  describe('Time Management', () => {
    it('should calculate time remaining', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const expiresAt = new Date(now + 3600000).toISOString(); // 1 hour from now
      setActiveMission({
        ...mockActiveMission,
        instance: { ...mockActiveMission.instance, expiresAt },
      });

      expect(timeRemaining.value).toBe(3600);
    });

    it('should return null when no expiry', () => {
      setActiveMission({
        ...mockActiveMission,
        instance: { ...mockActiveMission.instance, expiresAt: undefined },
      });
      expect(timeRemaining.value).toBeNull();
    });

    it('should return 0 when expired', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const expiresAt = new Date(now - 1000).toISOString(); // 1 second ago
      setActiveMission({
        ...mockActiveMission,
        instance: { ...mockActiveMission.instance, expiresAt },
      });

      expect(timeRemaining.value).toBe(0);
    });

    it('should detect time critical (< 5 minutes)', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // 10 minutes remaining - not critical
      setActiveMission({
        ...mockActiveMission,
        instance: {
          ...mockActiveMission.instance,
          expiresAt: new Date(now + 600000).toISOString(),
        },
      });
      expect(isTimeCritical.value).toBe(false);

      // 4 minutes remaining - critical
      setActiveMission({
        ...mockActiveMission,
        instance: {
          ...mockActiveMission.instance,
          expiresAt: new Date(now + 240000).toISOString(),
        },
      });
      expect(isTimeCritical.value).toBe(true);
    });

    it('should not be time critical without expiry', () => {
      setActiveMission({
        ...mockActiveMission,
        instance: { ...mockActiveMission.instance, expiresAt: undefined },
      });
      expect(isTimeCritical.value).toBe(false);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      setMissionHistory(mockHistory);
    });

    it('should calculate mission stats', () => {
      const stats = missionStats.value;
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.abandoned).toBe(1);
      expect(stats.total).toBe(4);
    });

    it('should calculate success rate', () => {
      const stats = missionStats.value;
      expect(stats.successRate).toBe(50); // 2 of 4 = 50%
    });

    it('should calculate total credits earned', () => {
      const stats = missionStats.value;
      expect(stats.totalCredits).toBe(3000); // 1500 + 1500
    });

    it('should handle empty history', () => {
      clearMissionData();
      const stats = missionStats.value;
      expect(stats.total).toBe(0);
      expect(stats.successRate).toBe(0);
    });

    it('should list available mission types', () => {
      setAvailableMissions(mockMissions);
      const types = availableMissionTypes.value;
      expect(types).toContain('extraction');
      expect(types).toContain('delivery');
      expect(types).toContain('escort');
      expect(types).toHaveLength(3);
    });
  });

  describe('Tier and Rating', () => {
    it('should set tier info', () => {
      setTierInfo(3, 4.5);
      expect(currentTier.value).toBe(3);
      expect(carrierRating.value).toBe(4.5);
    });
  });

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      expect(isLoadingMissions.value).toBe(false);
      setLoadingMissions(true);
      expect(isLoadingMissions.value).toBe(true);
    });

    it('should set error', () => {
      expect(missionError.value).toBeNull();
      setMissionError('Failed to load missions');
      expect(missionError.value).toBe('Failed to load missions');
    });

    it('should clear error on clearMissionData', () => {
      setMissionError('Some error');
      clearMissionData();
      expect(missionError.value).toBeNull();
    });
  });
});
