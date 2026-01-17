/**
 * Missions Page - Browse and manage missions
 *
 * Integrates with stores for real-time data.
 */

import { useState, useMemo } from 'preact/hooks';
import type { Mission, MissionType, MissionDifficulty } from '@/types';
import { Card, Badge, Skeleton } from '@components/ui';
import {
  MissionFilters,
  MissionCard,
  MissionDetail,
  ActiveMissionTracker,
} from '@components/game';
import type { MissionSortOption } from '@components/game';
import { useMissionData } from '@/hooks';
import {
  availableMissions,
  activeMission,
  canAcceptNew,
  missionError,
} from '@/stores/missionStore';
import styles from './Missions.module.css';

export function Missions() {
  // Load mission data via hook
  const {
    isLoading,
    acceptMission,
    abandonMission,
    refresh,
  } = useMissionData();

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<MissionType[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<MissionDifficulty[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<MissionSortOption>('reward');

  // Selected mission for detail view
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  // Transform store data to component format (store uses 'title' and 'missionType')
  const missionList: Mission[] = availableMissions.value.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description || '',
    type: m.missionType.toLowerCase() as MissionType,
    difficulty: m.difficulty.toLowerCase() as MissionDifficulty,
    status: 'available',
    reward: {
      credits: m.baseCredits,
      xp: m.baseXp,
      reputation: m.baseReputation,
    },
    timeLimit: m.timeLimit ? m.timeLimit * 60 : undefined, // Convert minutes to seconds
  }));

  // Transform active mission (using nested structure)
  const activeMissionData: Mission | null = activeMission.value
    ? {
        id: activeMission.value.instance.id,
        title: activeMission.value.definition.title,
        description: activeMission.value.definition.description || '',
        type: activeMission.value.definition.missionType.toLowerCase() as MissionType,
        difficulty: activeMission.value.definition.difficulty.toLowerCase() as MissionDifficulty,
        status: 'active',
        reward: {
          credits: activeMission.value.definition.baseCredits || 0,
          xp: activeMission.value.definition.baseXp || 0,
        },
        timeLimit: activeMission.value.definition.timeLimit,
      }
    : null;

  // Filter handlers
  const handleTypeToggle = (type: MissionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleDifficultyToggle = (difficulty: MissionDifficulty) => {
    setSelectedDifficulties((prev) =>
      prev.includes(difficulty) ? prev.filter((d) => d !== difficulty) : [...prev, difficulty]
    );
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSelectedDifficulties([]);
    setSearchQuery('');
  };

  // Filter and sort missions
  const filteredMissions = useMemo(() => {
    let result = [...missionList];

    // Filter by type
    if (selectedTypes.length > 0) {
      result = result.filter((m) => selectedTypes.includes(m.type));
    }

    // Filter by difficulty
    if (selectedDifficulties.length > 0) {
      result = result.filter((m) => selectedDifficulties.includes(m.difficulty));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'reward':
          return b.reward.credits - a.reward.credits;
        case 'difficulty': {
          const diffOrder: Record<string, number> = { easy: 0, trivial: 0, medium: 1, hard: 2, extreme: 3, nightmare: 4 };
          return (diffOrder[a.difficulty] ?? 1) - (diffOrder[b.difficulty] ?? 1);
        }
        case 'time':
          return (a.timeLimit || Infinity) - (b.timeLimit || Infinity);
        default:
          return 0;
      }
    });

    return result;
  }, [missionList, selectedTypes, selectedDifficulties, searchQuery, sortBy]);

  // Mission action handlers
  const handleAcceptMission = async (missionId: string) => {
    const success = await acceptMission(missionId);
    if (success) {
      setSelectedMission(null);
    }
  };

  const handleDeclineMission = (_missionId: string) => {
    setSelectedMission(null);
  };

  const handleAbandonMission = async () => {
    const success = await abandonMission();
    if (success) {
      setSelectedMission(null);
    }
  };

  // Loading state
  if (isLoading && missionList.length === 0) {
    return (
      <div class={styles.missions}>
        <aside class={styles.sidebar}>
          <Skeleton variant="card" height="200px" />
          <Skeleton variant="card" height="300px" />
        </aside>
        <main class={styles.main}>
          <Skeleton variant="card" height="60px" />
          <div class={styles.grid}>
            <Skeleton variant="card" height="200px" />
            <Skeleton variant="card" height="200px" />
            <Skeleton variant="card" height="200px" />
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (missionError.value && missionList.length === 0) {
    return (
      <div class={styles.missions}>
        <Card variant="outlined" padding="lg">
          <p>Error loading missions: {missionError.value}</p>
          <button onClick={refresh}>Retry</button>
        </Card>
      </div>
    );
  }

  return (
    <div class={styles.missions}>
      {/* Sidebar: Active Mission & Filters */}
      <aside class={styles.sidebar}>
        {/* Active Mission Tracker */}
        {activeMissionData ? (
          <ActiveMissionTracker
            mission={activeMissionData}
            onView={() => setSelectedMission(activeMissionData)}
            onAbandon={handleAbandonMission}
          />
        ) : (
          <Card variant="outlined" padding="md">
            <h3 class={styles.noActiveTitle}>No Active Mission</h3>
            <p class={styles.noActiveText}>
              Select a mission from the board to get started.
            </p>
          </Card>
        )}

        {/* Filters */}
        <MissionFilters
          selectedTypes={selectedTypes}
          selectedDifficulties={selectedDifficulties}
          searchQuery={searchQuery}
          sortBy={sortBy}
          onTypeToggle={handleTypeToggle}
          onDifficultyToggle={handleDifficultyToggle}
          onSearchChange={setSearchQuery}
          onSortChange={setSortBy}
          onClearAll={handleClearFilters}
        />
      </aside>

      {/* Main Content */}
      <main class={styles.main}>
        {/* Header */}
        <header class={styles.header}>
          <div class={styles.headerLeft}>
            <h1 class={styles.title}>Mission Board</h1>
            <Badge variant="default" size="sm">
              {filteredMissions.length} Available
            </Badge>
            {!canAcceptNew.value && (
              <Badge variant="warning" size="sm">
                Complete current mission first
              </Badge>
            )}
          </div>
          <button class={styles.refreshButton} onClick={refresh} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </header>

        {/* Mission Detail (when selected) */}
        {selectedMission && (
          <div class={styles.detailPanel}>
            <MissionDetail
              mission={selectedMission}
              onAccept={
                canAcceptNew.value && selectedMission.status === 'available'
                  ? () => handleAcceptMission(selectedMission.id)
                  : undefined
              }
              onDecline={() => handleDeclineMission(selectedMission.id)}
              onClose={() => setSelectedMission(null)}
            />
          </div>
        )}

        {/* Mission Grid */}
        <div class={styles.grid}>
          {filteredMissions.length === 0 ? (
            <Card variant="outlined" padding="lg" class={styles.emptyState}>
              <span class={styles.emptyIcon}>◇</span>
              <p class={styles.emptyText}>
                {missionList.length === 0
                  ? 'No missions available at your current tier'
                  : 'No missions match your filters'}
              </p>
              {missionList.length > 0 && (
                <button class={styles.emptyButton} onClick={handleClearFilters}>
                  Clear Filters
                </button>
              )}
            </Card>
          ) : (
            filteredMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onAccept={
                  canAcceptNew.value && !activeMissionData
                    ? () => handleAcceptMission(mission.id)
                    : undefined
                }
                onView={() => setSelectedMission(mission)}
                selected={selectedMission?.id === mission.id}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
