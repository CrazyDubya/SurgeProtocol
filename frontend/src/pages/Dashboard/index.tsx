import { useState } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import { Card, Badge } from '@components/ui';
import {
  CharacterStatus,
  MissionCard,
  MissionListItem,
  AlgorithmPanel,
  QuickActions,
} from '@components/game';
import type { Character, Mission, AlgorithmMessage } from '@/types';
import type { QuickAction } from '@components/game';
import styles from './Dashboard.module.css';

// Mock data - will be replaced with API calls
const mockCharacter: Character = {
  id: '1',
  name: 'Zero Cool',
  alias: 'Ghost Runner',
  level: 7,
  hp: { current: 85, max: 100 },
  humanity: { current: 62, max: 100 },
  xp: { current: 2450, toNextLevel: 3000 },
  credits: 15750,
  reputation: { algorithm: 45, street: 32, corporate: -12 },
  attributes: {
    reflex: 8,
    tech: 10,
    cool: 6,
    body: 5,
    empathy: 7,
  },
  augmentations: [],
};

const mockActiveMission: Mission = {
  id: 'm1',
  title: 'Data Package Alpha',
  description: 'Deliver encrypted data core to Sector 7 drop point. Avoid corporate scanners.',
  type: 'delivery',
  difficulty: 'medium',
  status: 'active',
  reward: { credits: 5000, xp: 150, reputation: 5 },
  timeLimit: 1847,
};

const mockAvailableMissions: Mission[] = [
  {
    id: 'm2',
    title: 'Corporate Extraction',
    description: 'Extract a defecting exec from Arasaka Tower lobby.',
    type: 'extraction',
    difficulty: 'hard',
    status: 'available',
    reward: { credits: 12000, xp: 350, reputation: 15 },
  },
  {
    id: 'm3',
    title: 'Dead Drop Courier',
    description: 'Pick up package from Night Market, deliver to unknown recipient.',
    type: 'courier',
    difficulty: 'easy',
    status: 'available',
    reward: { credits: 2500, xp: 75 },
  },
];

const mockAlgorithmMessages: AlgorithmMessage[] = [
  {
    id: 'a1',
    content: 'Your efficiency rating has improved. The Algorithm notices your dedication to the delivery network. Continue on this path.',
    tone: 'approving',
    timestamp: new Date().toISOString(),
    acknowledged: false,
  },
  {
    id: 'a2',
    content: 'New delivery protocols uploaded to your neural link. Adapt or be optimized out.',
    tone: 'neutral',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    acknowledged: true,
  },
];

export function Dashboard() {
  const [, navigate] = useLocation();
  const [messages, setMessages] = useState(mockAlgorithmMessages);

  const quickActions: QuickAction[] = [
    {
      id: 'missions',
      label: 'Find Missions',
      description: 'Browse available jobs',
      icon: '◈',
      badge: String(mockAvailableMissions.length),
      badgeVariant: 'primary',
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
      id: 'map',
      label: 'City Map',
      description: 'Navigate sectors',
      icon: '⬡',
      disabled: true,
      onClick: () => {},
    },
  ];

  const handleAcknowledge = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, acknowledged: true } : m))
    );
  };

  const handleAcceptMission = (missionId: string) => {
    console.log('Accept mission:', missionId);
    // TODO: API call to accept mission
  };

  const handleDeclineMission = (missionId: string) => {
    console.log('Decline mission:', missionId);
    // TODO: API call to decline mission
  };

  return (
    <div class={styles.dashboard}>
      {/* Left Column: Character & Quick Actions */}
      <div class={styles.leftColumn}>
        <CharacterStatus character={mockCharacter} />
        <QuickActions actions={quickActions} title="Quick Actions" columns={2} />
      </div>

      {/* Center Column: Active Mission & Available Missions */}
      <div class={styles.centerColumn}>
        {/* Active Mission */}
        <section class={styles.section}>
          <h2 class={styles.sectionTitle}>
            <Badge variant="success" size="xs" pulse>Active</Badge>
            Current Mission
          </h2>
          <MissionCard
            mission={mockActiveMission}
            onView={() => navigate(`/missions/${mockActiveMission.id}`)}
          />
        </section>

        {/* Available Missions */}
        <section class={styles.section}>
          <h2 class={styles.sectionTitle}>
            Available Missions
            <Badge variant="default" size="xs">{mockAvailableMissions.length}</Badge>
          </h2>
          <div class={styles.missionList}>
            {mockAvailableMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onAccept={() => handleAcceptMission(mission.id)}
                onDecline={() => handleDeclineMission(mission.id)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Right Column: Algorithm */}
      <div class={styles.rightColumn}>
        <AlgorithmPanel
          messages={messages}
          onAcknowledge={handleAcknowledge}
        />

        {/* Recent Activity */}
        <Card variant="outlined" padding="md">
          <h3 class={styles.activityTitle}>Recent Activity</h3>
          <div class={styles.activityList}>
            <ActivityItem
              icon="✓"
              text="Completed: Night Market Drop"
              time="2h ago"
              variant="success"
            />
            <ActivityItem
              icon="↑"
              text="Level up! Now level 7"
              time="5h ago"
              variant="highlight"
            />
            <ActivityItem
              icon="¥"
              text="Received ¥3,500 payment"
              time="5h ago"
            />
            <ActivityItem
              icon="!"
              text="Algorithm rating increased"
              time="1d ago"
              variant="algorithm"
            />
          </div>
        </Card>
      </div>
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
