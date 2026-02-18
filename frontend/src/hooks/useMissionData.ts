/**
 * useMissionData - Hook for loading mission data into stores
 *
 * Fetches available missions, active mission, and manages mission actions.
 * Transforms API responses to match store types.
 */

import { useEffect, useCallback } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import { missionService } from '@/api';
import type { MissionActionType } from '@/api';
import {
  availableMissions,
  activeMission,
  setAvailableMissions,
  setActiveMission,
  setTierInfo,
  setLoadingMissions,
  setLoadingActive,
  setMissionError,
  removeMissionFromAvailable,
  isLoadingMissions,
  isLoadingActive,
  missionError,
  hasActiveMission,
  filteredMissions,
  activeMissionProgress,
  timeRemaining,
} from '@/stores';
import { activeCharacterId } from '@/stores/authStore';
import { toast } from '@/stores/uiStore';

export function useMissionData() {
  const [, setLocation] = useLocation();
  const characterId = activeCharacterId.value;

  /**
   * Load available missions for current tier
   */
  const loadAvailable = useCallback(async () => {
    if (!characterId) return;

    setLoadingMissions(true);
    setMissionError(null);

    try {
      const response = await missionService.getAvailable();

      // Transform API response to store format
      // Transform API response to store format
      setAvailableMissions(response.missions.map((m: any) => ({
        id: m.id,
        title: m.name,
        description: m.description || '',
        missionType: m.mission_type, // BE: mission_type
        difficulty: mapDifficulty(m.difficulty_rating || 5),
        riskLevel: m.danger_warning || 'LOW',
        tierRequired: m.tier_requirement ?? m.tier_minimum ?? 1,
        ratingRequired: m.rating_requirement || 0,
        timeLimit: m.time_limit_minutes,
        baseCredits: m.base_credits || m.effective_credits, // Use effective if available
        baseXp: m.base_xp || m.effective_xp,
        baseReputation: 0,
      })));

      setTierInfo(response.currentTier, response.canAcceptNew ? 1 : 0);
    } catch (err) {
      setMissionError(err instanceof Error ? err.message : 'Failed to load missions');
    } finally {
      setLoadingMissions(false);
    }
  }, [characterId]);

  /**
   * Load active mission (if any)
   */
  const loadActive = useCallback(async () => {
    if (!characterId) return;

    setLoadingActive(true);

    try {
      const response = await missionService.getActive();

      if (response.mission) {
        const { instance, definition, checkpoints, progress } = response.mission;

        // Transform to store's ActiveMission format
        setActiveMission({
          instance: {
            id: instance.id,
            missionId: definition.id,
            characterId: characterId,
            status: instance.status as any,
            startedAt: instance.startedAt,
            expiresAt: instance.expiresAt,
            completedAt: instance.completedAt,
          },
          definition: {
            id: definition.id,
            title: definition.name,
            description: definition.description || '',
            missionType: definition.type,
            difficulty: definition.difficulty,
            tierRequired: definition.tierRequired,
            ratingRequired: definition.ratingRequired || 0,
            timeLimit: definition.timeLimit,
            baseCredits: definition.baseCredits,
            baseXp: definition.baseXp,
            baseReputation: definition.baseReputation || 0,
            riskLevel: definition.riskLevel,
          },
          checkpoints: checkpoints.map((cp) => ({
            id: cp.id,
            name: cp.name,
            description: cp.description,
            sequenceOrder: cp.sequenceOrder,
            isCompleted: cp.isCompleted,
            completedAt: cp.completedAt,
          })),
          progress: progress || 0,
        });
      } else {
        setActiveMission(null);
      }
    } catch (err) {
      console.error('Failed to load active mission:', err);
    } finally {
      setLoadingActive(false);
    }
  }, [characterId]);

  /**
   * Accept a mission
   */
  const acceptMission = useCallback(async (missionId: string) => {
    if (!characterId) return false;

    try {
      const response = await missionService.accept(missionId);

      // Remove from available list
      removeMissionFromAvailable(missionId);

      // Set as active mission in store format
      setActiveMission({
        instance: {
          id: response.instance.id,
          missionId: response.mission.id,
          characterId: characterId,
          status: response.instance.status as any,
          startedAt: response.instance.startedAt,
          expiresAt: response.instance.expiresAt,
        },
        definition: {
          id: response.mission.id,
          title: response.mission.name,
          description: response.mission.description || '',
          missionType: response.mission.type,
          difficulty: response.mission.difficulty,
          tierRequired: response.mission.tierRequired,
          ratingRequired: response.mission.ratingRequired || 0,
          timeLimit: response.mission.timeLimit,
          baseCredits: response.mission.baseCredits,
          baseXp: response.mission.baseXp,
          baseReputation: response.mission.baseReputation || 0,
          riskLevel: response.mission.riskLevel,
        },
        checkpoints: [],
        progress: 0,
      });

      toast.success(response.message || 'Mission accepted!');
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept mission');
      return false;
    }
  }, [characterId]);

  /**
   * Take an action during active mission
   */
  const takeAction = useCallback(async (
    actionType: MissionActionType,
    parameters?: Record<string, unknown>
  ) => {
    const mission = activeMission.value;
    if (!mission) {
      toast.error('No active mission');
      return null;
    }

    try {
      const response = await missionService.action(mission.instance.id, {
        actionType,
        parameters,
      });

      // Update checkpoints if provided
      if (response.checkpointUpdates) {
        setActiveMission({
          ...mission,
          checkpoints: response.checkpointUpdates.map((cp) => ({
            id: cp.id,
            name: cp.name,
            description: cp.description,
            sequenceOrder: cp.sequenceOrder,
            isCompleted: cp.isCompleted,
            completedAt: cp.completedAt,
          })),
        });
      }

      // Handle combat redirect
      if (response.result.outcome === 'COMBAT_STARTED' && response.result.details?.combatId) {
        setLocation(`/combat/${response.result.details.combatId}`);
      }

      return response;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
      return null;
    }
  }, [setLocation]);

  /**
   * Complete the active mission
   */
  const completeMission = useCallback(async (
    outcome: 'SUCCESS' | 'PARTIAL' | 'FAILURE',
    customerRating?: number
  ) => {
    const mission = activeMission.value;
    if (!mission) {
      toast.error('No active mission');
      return null;
    }

    try {
      const response = await missionService.complete(mission.instance.id, {
        outcome,
        customerRating,
      });

      // Clear active mission
      setActiveMission(null);

      // Show rewards toast
      if (outcome === 'SUCCESS') {
        toast.success(
          `Mission complete! +${response.rewards.credits}₡ +${response.rewards.xp}XP`
        );
      } else {
        toast.info('Mission ended.');
      }

      // Refresh available missions
      loadAvailable();

      return response;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete mission');
      return null;
    }
  }, [loadAvailable]);

  /**
   * Abandon the active mission
   */
  const abandonMission = useCallback(async () => {
    const mission = activeMission.value;
    if (!mission) {
      toast.error('No active mission');
      return false;
    }

    try {
      const response = await missionService.abandon(mission.instance.id);

      // Clear active mission
      setActiveMission(null);

      toast.warning(response.message);

      // Refresh available missions
      loadAvailable();

      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to abandon mission');
      return false;
    }
  }, [loadAvailable]);

  /**
   * Load all mission data
   */
  const loadAll = useCallback(async () => {
    await Promise.all([loadAvailable(), loadActive()]);
  }, [loadAvailable, loadActive]);

  /**
   * Refresh mission data
   */
  const refresh = useCallback(() => {
    loadAll();
  }, [loadAll]);

  // Auto-load on mount if character is selected
  useEffect(() => {
    if (characterId && availableMissions.value.length === 0) {
      loadAll();
    }
  }, [characterId, loadAll]);

  return {
    // State
    availableMissions: availableMissions.value,
    filteredMissions: filteredMissions.value,
    activeMission: activeMission.value,
    hasActiveMission: hasActiveMission.value,
    progress: activeMissionProgress.value,
    timeRemaining: timeRemaining.value,
    isLoading: isLoadingMissions.value || isLoadingActive.value,
    error: missionError.value,
    // Actions
    loadAvailable,
    loadActive,
    loadAll,
    refresh,
    acceptMission,
    takeAction,
    completeMission,
    abandonMission,
  };
}

export default useMissionData;

function mapDifficulty(rating: number): string {
  if (rating <= 2) return 'TRIVIAL';
  if (rating <= 4) return 'EASY';
  if (rating <= 6) return 'MEDIUM';
  if (rating <= 8) return 'HARD';
  return 'EXTREME';
}

