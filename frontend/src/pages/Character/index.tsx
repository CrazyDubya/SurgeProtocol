import { useState } from 'preact/hooks';
import type { Character as CharacterType, Augmentation } from '@/types';
import { Card } from '@components/ui';
import {
  AttributeDisplay,
  DerivedStats,
  AugmentationSlots,
  ReputationDisplay,
} from '@components/game';
import styles from './Character.module.css';

// Mock data
const mockCharacter: CharacterType = {
  id: '1',
  name: 'Zero Cool',
  alias: 'Ghost Runner',
  level: 7,
  hp: { current: 85, max: 100 },
  humanity: { current: 62, max: 100 },
  xp: { current: 2450, toNextLevel: 3000 },
  credits: 15750,
  reputation: { algorithm: 67, street: 32, corporate: -12 },
  attributes: {
    reflex: 8,
    tech: 10,
    cool: 6,
    body: 5,
    empathy: 7,
  },
  augmentations: [],
};

const mockAugmentations: Augmentation[] = [
  {
    id: 'aug1',
    name: 'Kiroshi Optics Mk.2',
    slot: 'ocular',
    status: 'active',
    humanityCost: 8,
    description: 'Military-grade optical implants with enhanced zoom, low-light vision, and threat detection overlay.',
    effects: ['+2 Perception', 'Night Vision', 'Threat Highlighting'],
  },
  {
    id: 'aug2',
    name: 'Militech Neural Link',
    slot: 'neural',
    status: 'active',
    humanityCost: 12,
    description: 'Direct neural interface for faster data processing and vehicle/device control.',
    effects: ['+2 Tech checks', 'Quick Hack +1', 'Vehicle Link'],
  },
  {
    id: 'aug3',
    name: 'Dynalar Sandevistan',
    slot: 'spine',
    status: 'dormant',
    humanityCost: 15,
    description: 'Reflex booster that allows brief bursts of superhuman speed. Currently in recovery mode.',
    effects: ['+3 Initiative (when active)', 'Extra Action (once/day)'],
  },
  {
    id: 'aug4',
    name: 'Arasaka Mantis Blades',
    slot: 'arm_left',
    status: 'active',
    humanityCost: 10,
    description: 'Retractable arm blades for close combat. Monowire-sharp edge.',
    effects: ['Melee +2 damage', 'Armor Piercing', 'Silent kills'],
  },
];

type TabType = 'attributes' | 'augmentations';

export function Character() {
  const [activeTab, setActiveTab] = useState<TabType>('attributes');

  const hpPercent = (mockCharacter.hp.current / mockCharacter.hp.max) * 100;
  const humanityPercent = (mockCharacter.humanity.current / mockCharacter.humanity.max) * 100;
  const xpPercent = (mockCharacter.xp.current / mockCharacter.xp.toNextLevel) * 100;

  return (
    <div class={styles.character}>
      {/* Main Content */}
      <div class={styles.main}>
        {/* Header */}
        <div class={styles.header}>
          <div class={styles.avatar}>◈</div>
          <div class={styles.identity}>
            <h1 class={styles.name}>{mockCharacter.name}</h1>
            <p class={styles.alias}>"{mockCharacter.alias}"</p>
            <div class={styles.levelBadge}>
              <span class={styles.levelLabel}>Level</span>
              <span class={styles.levelValue}>{mockCharacter.level}</span>
            </div>
          </div>
        </div>

        {/* Vitals */}
        <div class={styles.vitals}>
          <div class={styles.vitalCard}>
            <div class={styles.vitalHeader}>
              <span class={styles.vitalLabel}>Health</span>
              <span class={styles.vitalValue}>
                {mockCharacter.hp.current} / {mockCharacter.hp.max}
              </span>
            </div>
            <div class={styles.vitalBar}>
              <div class={`${styles.vitalFill} ${styles.hp}`} style={{ width: `${hpPercent}%` }} />
            </div>
          </div>

          <div class={styles.vitalCard}>
            <div class={styles.vitalHeader}>
              <span class={styles.vitalLabel}>Humanity</span>
              <span class={styles.vitalValue}>
                {mockCharacter.humanity.current} / {mockCharacter.humanity.max}
              </span>
            </div>
            <div class={styles.vitalBar}>
              <div class={`${styles.vitalFill} ${styles.humanity}`} style={{ width: `${humanityPercent}%` }} />
            </div>
          </div>

          <div class={styles.vitalCard}>
            <div class={styles.vitalHeader}>
              <span class={styles.vitalLabel}>Experience</span>
              <span class={styles.vitalValue}>
                {mockCharacter.xp.current} / {mockCharacter.xp.toNextLevel}
              </span>
            </div>
            <div class={styles.vitalBar}>
              <div class={`${styles.vitalFill} ${styles.xp}`} style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div class={styles.tabs}>
          <button
            class={`${styles.tab} ${activeTab === 'attributes' ? styles.active : ''}`}
            onClick={() => setActiveTab('attributes')}
          >
            Attributes
          </button>
          <button
            class={`${styles.tab} ${activeTab === 'augmentations' ? styles.active : ''}`}
            onClick={() => setActiveTab('augmentations')}
          >
            Augmentations
          </button>
        </div>

        {/* Attributes Tab */}
        {activeTab === 'attributes' && (
          <>
            <section class={styles.section}>
              <h2 class={styles.sectionTitle}>Core Attributes</h2>
              <AttributeDisplay
                attributes={mockCharacter.attributes}
                layout="grid"
                showDescriptions
              />
            </section>

            <section class={styles.section}>
              <h2 class={styles.sectionTitle}>Derived Stats</h2>
              <DerivedStats attributes={mockCharacter.attributes} />
            </section>
          </>
        )}

        {/* Augmentations Tab */}
        {activeTab === 'augmentations' && (
          <section class={styles.section}>
            <h2 class={styles.sectionTitle}>Cybernetic Implants</h2>
            <AugmentationSlots
              augmentations={mockAugmentations}
              maxHumanity={mockCharacter.humanity.max}
              showBodyMap
            />
          </section>
        )}
      </div>

      {/* Sidebar */}
      <aside class={styles.sidebar}>
        {/* Credits */}
        <div class={styles.creditsCard}>
          <span class={styles.creditsLabel}>Credits</span>
          <span class={styles.creditsValue}>¥{mockCharacter.credits.toLocaleString()}</span>
        </div>

        {/* Reputation */}
        <Card variant="outlined" padding="md">
          <section class={styles.section}>
            <h3 class={styles.sectionTitle}>Reputation</h3>
            <ReputationDisplay
              algorithmRep={mockCharacter.reputation.algorithm}
              streetRep={mockCharacter.reputation.street}
              corpRep={mockCharacter.reputation.corporate}
            />
          </section>
        </Card>
      </aside>
    </div>
  );
}
