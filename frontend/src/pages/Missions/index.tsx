import { useState, useMemo } from 'preact/hooks';
import type { Mission, MissionType, MissionDifficulty } from '@/types';
import { Card, Badge } from '@components/ui';
import {
  MissionFilters,
  MissionCard,
  MissionDetail,
  ActiveMissionTracker,
} from '@components/game';
import type { MissionSortOption } from '@components/game';
import styles from './Missions.module.css';

// Mock data - will be replaced with API calls
const mockActiveMission: Mission = {
  id: 'active-1',
  title: 'Data Package Alpha',
  description: 'Deliver encrypted data core to Sector 7 drop point. Avoid corporate scanners.',
  type: 'delivery',
  difficulty: 'medium',
  status: 'active',
  reward: { credits: 5000, xp: 150, reputation: 5 },
  timeLimit: 1847,
};

const mockMissions: Mission[] = [
  {
    id: 'm1',
    title: 'Corporate Extraction',
    description: 'Extract a defecting executive from Arasaka Tower lobby. High security presence expected.',
    type: 'extraction',
    difficulty: 'hard',
    status: 'available',
    reward: { credits: 12000, xp: 350, reputation: 15 },
    origin: { id: 'loc1', name: 'Arasaka Tower', zone: 'Corporate District', threatLevel: 'dangerous' },
    destination: { id: 'loc2', name: 'Safe House Delta', zone: 'Watson', threatLevel: 'safe' },
  },
  {
    id: 'm2',
    title: 'Dead Drop Courier',
    description: 'Pick up package from Night Market, deliver to unknown recipient. No questions asked.',
    type: 'courier',
    difficulty: 'easy',
    status: 'available',
    reward: { credits: 2500, xp: 75 },
    timeLimit: 3600,
  },
  {
    id: 'm3',
    title: 'Sabotage Run',
    description: 'Infiltrate Militech facility and disable their tracking network. Stealth required.',
    type: 'sabotage',
    difficulty: 'extreme',
    status: 'available',
    reward: { credits: 25000, xp: 500, reputation: 25 },
  },
  {
    id: 'm4',
    title: 'Medical Supply Run',
    description: 'Deliver temperature-sensitive medical supplies to street clinic. Time critical.',
    type: 'delivery',
    difficulty: 'medium',
    status: 'available',
    reward: { credits: 4000, xp: 100, reputation: 10 },
    timeLimit: 1800,
  },
  {
    id: 'm5',
    title: 'VIP Escort',
    description: 'Escort high-profile client through contested territory to secure location.',
    type: 'escort',
    difficulty: 'hard',
    status: 'available',
    reward: { credits: 8000, xp: 200, reputation: 12 },
  },
  {
    id: 'm6',
    title: 'Data Infiltration',
    description: 'Access Kang Tao systems and extract prototype schematics. Zero trace required.',
    type: 'infiltration',
    difficulty: 'hard',
    status: 'available',
    reward: { credits: 15000, xp: 400, reputation: 20 },
  },
];

export function Missions() {
  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<MissionType[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<MissionDifficulty[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<MissionSortOption>('reward');

  // Selected mission for detail view
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

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
    let result = [...mockMissions];

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
          const diffOrder = { easy: 0, medium: 1, hard: 2, extreme: 3 };
          return diffOrder[a.difficulty] - diffOrder[b.difficulty];
        }
        case 'time':
          return (a.timeLimit || Infinity) - (b.timeLimit || Infinity);
        default:
          return 0;
      }
    });

    return result;
  }, [mockMissions, selectedTypes, selectedDifficulties, searchQuery, sortBy]);

  // Mission action handlers
  const handleAcceptMission = (missionId: string) => {
    console.log('Accept mission:', missionId);
    setSelectedMission(null);
  };

  const handleDeclineMission = (missionId: string) => {
    console.log('Decline mission:', missionId);
    setSelectedMission(null);
  };

  return (
    <div class={styles.missions}>
      {/* Sidebar: Active Mission & Filters */}
      <aside class={styles.sidebar}>
        {/* Active Mission Tracker */}
        <ActiveMissionTracker
          mission={mockActiveMission}
          onView={() => setSelectedMission(mockActiveMission)}
          onAbandon={() => console.log('Abandon mission')}
        />

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
          </div>
        </header>

        {/* Mission Detail (when selected) */}
        {selectedMission && (
          <div class={styles.detailPanel}>
            <MissionDetail
              mission={selectedMission}
              onAccept={() => handleAcceptMission(selectedMission.id)}
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
              <p class={styles.emptyText}>No missions match your filters</p>
              <button class={styles.emptyButton} onClick={handleClearFilters}>
                Clear Filters
              </button>
            </Card>
          ) : (
            filteredMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onAccept={() => handleAcceptMission(mission.id)}
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
