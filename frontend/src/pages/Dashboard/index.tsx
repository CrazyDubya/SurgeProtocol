/**
 * Dashboard - Main hub showing character status, missions, and activity
 *
 * Integrates with stores for real-time data and uses hooks for API calls.
 */

import { useLocation } from 'wouter-preact';
import { Card, Badge, Skeleton } from '@components/ui';
import {
  CharacterStatus,
  MissionCard,
  AlgorithmPanel,
  QuickActions,
} from '@components/game';
import type { Character, Mission, AlgorithmMessage } from '@/types';
import type { QuickAction } from '@components/game';
import { useCharacterData, useMissionData } from '@/hooks';
import {
  character,
  healthPercent,
  humanityPercent,
  totalCredits,
  attributes,
} from '@/stores/characterStore';
import { availableMissions, activeMission, canAcceptNew } from '@/stores/missionStore';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const [, navigate] = useLocation();

  // Load data via hooks
  const {
    isLoading: isLoadingCharacter,
  } = useCharacterData();

  const {
    isLoading: isLoadingMissions,
    acceptMission,
  } = useMissionData();

  // Transform store data to component format
  const characterData: Character | null = character.value
    ? {
        id: character.value.id,
        name: character.value.handle || 'Unknown',
        alias: character.value.streetName || character.value.handle || 'Unknown',
        level: character.value.currentTier,
        hp: {
          current: character.value.currentHealth,
          max: character.value.maxHealth,
        },
        humanity: {
          current: character.value.currentHumanity,
          max: character.value.maxHumanity,
        },
        xp: {
          current: character.value.currentXp || 0,
          toNextLevel: character.value.currentTier * 1000, // Placeholder
        },
        credits: totalCredits.value,
        reputation: {
          algorithm: character.value.carrierRating,
          street: 0,
          corporate: 0,
        },
        attributes: transformAttributes(),
        augmentations: [],
      }
    : null;

  // Transform active mission to component format (using nested structure)
  const activeMissionData: Mission | null = activeMission.value
    ? {
        id: activeMission.value.instance.id,
        title: activeMission.value.definition.title,
        description: activeMission.value.definition.description || '',
        type: activeMission.value.definition.missionType.toLowerCase() as Mission['type'],
        difficulty: activeMission.value.definition.difficulty.toLowerCase() as Mission['difficulty'],
        status: 'active',
        reward: {
          credits: activeMission.value.definition.baseCredits || 0,
          xp: activeMission.value.definition.baseXp || 0,
        },
        timeLimit: activeMission.value.definition.timeLimit,
      }
    : null;

  // Transform available missions to component format (using store types)
  const availableMissionData: Mission[] = availableMissions.value.slice(0, 3).map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description || '',
    type: m.missionType.toLowerCase() as Mission['type'],
    difficulty: m.difficulty.toLowerCase() as Mission['difficulty'],
    status: 'available',
    reward: {
      credits: m.baseCredits,
      xp: m.baseXp,
      reputation: m.baseReputation,
    },
  }));

  // Algorithm messages (placeholder - would come from WebSocket/API)
  const algorithmMessages: AlgorithmMessage[] = [
    {
      id: 'a1',
      content: character.value
        ? `Carrier ${character.value.handle} logged in. Current rating: ${character.value.carrierRating.toFixed(1)}. The Algorithm observes.`
        : 'Initializing carrier interface...',
      tone: 'neutral',
      timestamp: new Date().toISOString(),
      acknowledged: false,
    },
  ];

  const quickActions: QuickAction[] = [
    {
      id: 'missions',
      label: 'Find Missions',
      description: 'Browse available jobs',
      icon: '◈',
      badge: String(availableMissions.value.length),
      badgeVariant: canAcceptNew.value ? 'primary' : 'default',
      onClick: () => navigate('/missions'),
    },
    {
      id: 'inventory',
      label: 'Inventory',
      description: 'Manage your gear',
      icon: '◇',
      onClick: () => navigate('/inventory'),
    },
    {
      id: 'character',
      label: 'Character',
      description: 'View stats & augments',
      icon: '◆',
      onClick: () => navigate('/character'),
    },
    {
      id: 'factions',
      label: 'Factions',
      description: 'View standings',
      icon: '⬡',
      onClick: () => navigate('/factions'),
    },
  ];

  const handleAcknowledge = (_messageId: string) => {
    // TODO: Mark message as acknowledged
  };

  const handleAcceptMission = async (missionId: string) => {
    await acceptMission(missionId);
  };

  const handleDeclineMission = (_missionId: string) => {
    // No action needed - just don't accept
  };

  // Show loading state
  if (isLoadingCharacter && !characterData) {
    return (
      <div class={styles.dashboard}>
        <div class={styles.leftColumn}>
          <Skeleton variant="card" height="300px" />
          <Skeleton variant="card" height="200px" />
        </div>
        <div class={styles.centerColumn}>
          <Skeleton variant="card" height="200px" />
          <Skeleton variant="card" height="400px" />
        </div>
        <div class={styles.rightColumn}>
          <Skeleton variant="card" height="300px" />
          <Skeleton variant="card" height="200px" />
        </div>
      </div>
    );
  }

  return (
    <div class={styles.dashboard}>
      {/* Left Column: Character & Quick Actions */}
      <div class={styles.leftColumn}>
        {characterData ? (
          <CharacterStatus character={characterData} />
        ) : (
          <Card variant="outlined" padding="lg">
            <p>No character data available</p>
          </Card>
        )}
        <QuickActions actions={quickActions} title="Quick Actions" columns={2} />
      </div>

      {/* Center Column: Active Mission & Available Missions */}
      <div class={styles.centerColumn}>
        {/* Active Mission */}
        <section class={styles.section}>
          <h2 class={styles.sectionTitle}>
            {activeMissionData ? (
              <>
                <Badge variant="success" size="xs" pulse>Active</Badge>
                Current Mission
              </>
            ) : (
              'No Active Mission'
            )}
          </h2>
          {activeMissionData ? (
            <MissionCard
              mission={activeMissionData}
              onView={() => navigate(`/missions/active`)}
            />
          ) : (
            <Card variant="outlined" padding="lg">
              <p class={styles.noMission}>
                No active mission. Browse available jobs to get started.
              </p>
            </Card>
          )}
        </section>

        {/* Available Missions */}
        <section class={styles.section}>
          <h2 class={styles.sectionTitle}>
            Available Missions
            <Badge variant="default" size="xs">{availableMissions.value.length}</Badge>
          </h2>
          {isLoadingMissions ? (
            <div class={styles.missionList}>
              <Skeleton variant="card" height="150px" />
              <Skeleton variant="card" height="150px" />
            </div>
          ) : availableMissionData.length > 0 ? (
            <div class={styles.missionList}>
              {availableMissionData.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onAccept={canAcceptNew.value && !activeMissionData ? () => handleAcceptMission(mission.id) : undefined}
                  onDecline={() => handleDeclineMission(mission.id)}
                />
              ))}
              {availableMissions.value.length > 3 && (
                <button
                  class={styles.viewAllButton}
                  onClick={() => navigate('/missions')}
                >
                  View All Missions ({availableMissions.value.length})
                </button>
              )}
            </div>
          ) : (
            <Card variant="outlined" padding="lg">
              <p class={styles.noMission}>No missions available at your current tier.</p>
            </Card>
          )}
        </section>
      </div>

      {/* Right Column: Algorithm */}
      <div class={styles.rightColumn}>
        <AlgorithmPanel
          messages={algorithmMessages}
          onAcknowledge={handleAcknowledge}
        />

        {/* Stats Summary */}
        <Card variant="outlined" padding="md">
          <h3 class={styles.activityTitle}>Carrier Stats</h3>
          <div class={styles.statsList}>
            <StatItem
              label="Health"
              value={`${healthPercent.value}%`}
              variant={healthPercent.value < 30 ? 'danger' : healthPercent.value < 60 ? 'warning' : 'default'}
            />
            <StatItem
              label="Humanity"
              value={`${humanityPercent.value}%`}
              variant={humanityPercent.value < 30 ? 'danger' : humanityPercent.value < 60 ? 'warning' : 'default'}
            />
            <StatItem
              label="Credits"
              value={`₡${totalCredits.value.toLocaleString()}`}
            />
            <StatItem
              label="Rating"
              value={character.value?.carrierRating.toFixed(1) || '0.0'}
            />
          </div>
        </Card>

        {/* Recent Activity */}
        <Card variant="outlined" padding="md">
          <h3 class={styles.activityTitle}>Recent Activity</h3>
          <div class={styles.activityList}>
            <ActivityItem
              icon="◈"
              text="Logged in to carrier network"
              time="Just now"
            />
            {activeMissionData && (
              <ActivityItem
                icon="▶"
                text={`Mission active: ${activeMissionData.title}`}
                time="Active"
                variant="highlight"
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Helper to transform attributes from store format
function transformAttributes(): Character['attributes'] {
  const attrs = attributes.value;
  const result: Character['attributes'] = {
    reflex: 5,
    tech: 5,
    cool: 5,
    body: 5,
    empathy: 5,
  };

  for (const attr of attrs) {
    const mapping: Record<string, keyof Character['attributes']> = {
      AGI: 'reflex',
      INT: 'tech',
      CHA: 'cool',
      STR: 'body',
      WIL: 'empathy',
    };
    if (mapping[attr.code]) {
      result[mapping[attr.code]] = attr.value;
    }
  }

  return result;
}

interface StatItemProps {
  label: string;
  value: string;
  variant?: 'default' | 'danger' | 'warning';
}

function StatItem({ label, value, variant = 'default' }: StatItemProps) {
  return (
    <div class={`${styles.statItem} ${styles[`stat-${variant}`]}`}>
      <span class={styles.statLabel}>{label}</span>
      <span class={styles.statValue}>{value}</span>
    </div>
  );
}

interface ActivityItemProps {
  icon: string;
  text: string;
  time: string;
  variant?: 'default' | 'success' | 'highlight' | 'algorithm';
}

function ActivityItem({ icon, text, time, variant = 'default' }: ActivityItemProps) {
  return (
    <div class={`${styles.activityItem} ${styles[`activity-${variant}`]}`}>
      <span class={styles.activityIcon}>{icon}</span>
      <span class={styles.activityText}>{text}</span>
      <span class={styles.activityTime}>{time}</span>
    </div>
  );
}
