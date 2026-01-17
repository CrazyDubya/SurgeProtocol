/**
 * Character Page - Full character sheet with stats, skills, and equipment
 *
 * Integrates with stores for real-time data.
 */

import { useState } from 'preact/hooks';
import type { Character as CharacterType, Augmentation } from '@/types';
import { Card, Skeleton } from '@components/ui';
import {
  AttributeDisplay,
  DerivedStats,
  AugmentationSlots,
  ReputationDisplay,
} from '@components/game';
import { useCharacterData } from '@/hooks';
import {
  character,
  attributes,
  skills,
  factions,
  equipped,
  conditions,
  healthPercent,
  humanityPercent,
  totalCredits,
} from '@/stores/characterStore';
import styles from './Character.module.css';

type TabType = 'attributes' | 'skills' | 'augmentations' | 'factions';

export function Character() {
  const [activeTab, setActiveTab] = useState<TabType>('attributes');

  // Load data via hook
  const { isLoading, error, refresh } = useCharacterData();

  // Get character data from store
  const char = character.value;

  // Transform attributes for component
  const attributeData: CharacterType['attributes'] = {
    reflex: getAttributeValue('AGI'),
    tech: getAttributeValue('INT'),
    cool: getAttributeValue('CHA'),
    body: getAttributeValue('STR'),
    empathy: getAttributeValue('WIL'),
  };

  // Calculate XP progress (placeholder calculation)
  const xpToNext = char ? char.currentTier * 1000 : 1000;
  const xpPercent = char ? ((char.currentXp || 0) / xpToNext) * 100 : 0;

  // Transform equipped to augmentations format (placeholder)
  const augmentations: Augmentation[] = equipped.value.map((eq, idx) => ({
    id: eq.itemId || `eq-${idx}`,
    name: eq.itemName,
    slot: eq.slot as Augmentation['slot'],
    status: 'active' as const,
    humanityCost: 5,
    description: `Equipped ${eq.itemType}`,
    effects: [],
  }));

  // Loading state
  if (isLoading && !char) {
    return (
      <div class={styles.character}>
        <div class={styles.main}>
          <Skeleton variant="card" height="150px" />
          <Skeleton variant="card" height="200px" />
          <Skeleton variant="card" height="300px" />
        </div>
        <aside class={styles.sidebar}>
          <Skeleton variant="card" height="100px" />
          <Skeleton variant="card" height="200px" />
        </aside>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div class={styles.character}>
        <Card variant="outlined" padding="lg">
          <p>Error loading character: {error}</p>
          <button onClick={refresh}>Retry</button>
        </Card>
      </div>
    );
  }

  // No character state
  if (!char) {
    return (
      <div class={styles.character}>
        <Card variant="outlined" padding="lg">
          <p>No character selected</p>
        </Card>
      </div>
    );
  }

  return (
    <div class={styles.character}>
      {/* Main Content */}
      <div class={styles.main}>
        {/* Header */}
        <div class={styles.header}>
          <div class={styles.avatar}>◈</div>
          <div class={styles.identity}>
            <h1 class={styles.name}>{char.handle}</h1>
            {char.streetName && <p class={styles.alias}>"{char.streetName}"</p>}
            <div class={styles.idBadge}>
              <span class={styles.idLabel}>OmniDeliver ID</span>
              <span class={styles.idValue}>{char.omniDeliverId}</span>
            </div>
            <div class={styles.levelBadge}>
              <span class={styles.levelLabel}>Tier</span>
              <span class={styles.levelValue}>{char.currentTier}</span>
            </div>
          </div>
        </div>

        {/* Vitals */}
        <div class={styles.vitals}>
          <div class={styles.vitalCard}>
            <div class={styles.vitalHeader}>
              <span class={styles.vitalLabel}>Health</span>
              <span class={styles.vitalValue}>
                {char.currentHealth} / {char.maxHealth}
              </span>
            </div>
            <div class={styles.vitalBar}>
              <div
                class={`${styles.vitalFill} ${styles.hp}`}
                style={{ width: `${healthPercent.value}%` }}
              />
            </div>
          </div>

          <div class={styles.vitalCard}>
            <div class={styles.vitalHeader}>
              <span class={styles.vitalLabel}>Humanity</span>
              <span class={styles.vitalValue}>
                {char.currentHumanity} / {char.maxHumanity}
              </span>
            </div>
            <div class={styles.vitalBar}>
              <div
                class={`${styles.vitalFill} ${styles.humanity}`}
                style={{ width: `${humanityPercent.value}%` }}
              />
            </div>
          </div>

          <div class={styles.vitalCard}>
            <div class={styles.vitalHeader}>
              <span class={styles.vitalLabel}>Experience</span>
              <span class={styles.vitalValue}>
                {char.currentXp} / {xpToNext}
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
            class={`${styles.tab} ${activeTab === 'skills' ? styles.active : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            Skills
          </button>
          <button
            class={`${styles.tab} ${activeTab === 'augmentations' ? styles.active : ''}`}
            onClick={() => setActiveTab('augmentations')}
          >
            Augmentations
          </button>
          <button
            class={`${styles.tab} ${activeTab === 'factions' ? styles.active : ''}`}
            onClick={() => setActiveTab('factions')}
          >
            Factions
          </button>
        </div>

        {/* Attributes Tab */}
        {activeTab === 'attributes' && (
          <>
            <section class={styles.section}>
              <h2 class={styles.sectionTitle}>Core Attributes</h2>
              {attributes.value.length > 0 ? (
                <div class={styles.attributeGrid}>
                  {attributes.value.map((attr) => (
                    <div key={attr.code} class={styles.attributeCard}>
                      <span class={styles.attrCode}>{attr.code}</span>
                      <span class={styles.attrValue}>{attr.value}</span>
                      <span class={styles.attrName}>{attr.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <AttributeDisplay attributes={attributeData} layout="grid" showDescriptions />
              )}
            </section>

            <section class={styles.section}>
              <h2 class={styles.sectionTitle}>Derived Stats</h2>
              <DerivedStats attributes={attributeData} />
            </section>
          </>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <section class={styles.section}>
            <h2 class={styles.sectionTitle}>Skills</h2>
            {skills.value.length > 0 ? (
              <div class={styles.skillGrid}>
                {skills.value.map((skill) => (
                  <div key={skill.code} class={styles.skillCard}>
                    <span class={styles.skillName}>{skill.name}</span>
                    <div class={styles.skillLevel}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <span
                          key={i}
                          class={`${styles.skillPip} ${i < skill.level ? styles.filled : ''}`}
                        />
                      ))}
                    </div>
                    <span class={styles.skillValue}>{skill.level}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Card variant="outlined" padding="md">
                <p class={styles.emptyState}>No skills data available</p>
              </Card>
            )}
          </section>
        )}

        {/* Augmentations Tab */}
        {activeTab === 'augmentations' && (
          <section class={styles.section}>
            <h2 class={styles.sectionTitle}>Cybernetic Implants</h2>
            {augmentations.length > 0 ? (
              <AugmentationSlots
                augmentations={augmentations}
                maxHumanity={char.maxHumanity}
                showBodyMap
              />
            ) : (
              <Card variant="outlined" padding="md">
                <p class={styles.emptyState}>No augmentations installed</p>
              </Card>
            )}
          </section>
        )}

        {/* Factions Tab */}
        {activeTab === 'factions' && (
          <section class={styles.section}>
            <h2 class={styles.sectionTitle}>Faction Standings</h2>
            {factions.value.length > 0 ? (
              <div class={styles.factionGrid}>
                {factions.value.map((faction) => (
                  <div key={faction.factionId} class={styles.factionCard}>
                    <div class={styles.factionHeader}>
                      <span class={styles.factionName}>{faction.name}</span>
                      {faction.isMember && (
                        <span class={styles.memberBadge}>Member</span>
                      )}
                    </div>
                    <div class={styles.factionRep}>
                      <span class={styles.repTier}>{faction.tier}</span>
                      <div class={styles.repBar}>
                        <div
                          class={styles.repFill}
                          style={{ width: `${Math.min(100, Math.max(0, faction.reputation))}%` }}
                        />
                      </div>
                      <span class={styles.repValue}>{faction.reputation}</span>
                    </div>
                    <span class={styles.factionType}>{faction.factionType}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Card variant="outlined" padding="md">
                <p class={styles.emptyState}>No faction standings yet</p>
              </Card>
            )}
          </section>
        )}

        {/* Active Conditions */}
        {conditions.value.filter((c) => c.isActive).length > 0 && (
          <section class={styles.section}>
            <h2 class={styles.sectionTitle}>Active Conditions</h2>
            <div class={styles.conditionList}>
              {conditions.value
                .filter((c) => c.isActive)
                .map((condition) => (
                  <div key={condition.id} class={styles.conditionCard}>
                    <span class={styles.conditionName}>
                      {condition.name}
                      {condition.stackCount > 1 && ` x${condition.stackCount}`}
                    </span>
                    <span class={styles.conditionEffect}>{condition.effectDescription}</span>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>

      {/* Sidebar */}
      <aside class={styles.sidebar}>
        {/* Carrier Rating */}
        <div class={styles.ratingCard}>
          <span class={styles.ratingLabel}>Carrier Rating</span>
          <span class={styles.ratingValue}>{char.carrierRating.toFixed(1)}</span>
        </div>

        {/* Credits */}
        <div class={styles.creditsCard}>
          <span class={styles.creditsLabel}>Credits</span>
          <span class={styles.creditsValue}>₡{totalCredits.value.toLocaleString()}</span>
        </div>

        {/* Reputation */}
        <Card variant="outlined" padding="md">
          <section class={styles.section}>
            <h3 class={styles.sectionTitle}>Algorithm Status</h3>
            <ReputationDisplay
              algorithmRep={char.carrierRating}
              streetRep={0}
              corpRep={0}
            />
          </section>
        </Card>

        {/* Quick Stats */}
        <Card variant="outlined" padding="md">
          <section class={styles.section}>
            <h3 class={styles.sectionTitle}>Quick Stats</h3>
            <div class={styles.quickStats}>
              <div class={styles.quickStat}>
                <span class={styles.quickStatLabel}>XP</span>
                <span class={styles.quickStatValue}>{char.currentXp}</span>
              </div>
              <div class={styles.quickStat}>
                <span class={styles.quickStatLabel}>Tier</span>
                <span class={styles.quickStatValue}>{char.currentTier}</span>
              </div>
              <div class={styles.quickStat}>
                <span class={styles.quickStatLabel}>Status</span>
                <span class={styles.quickStatValue}>
                  {char.isDead ? 'Dead' : char.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </section>
        </Card>
      </aside>
    </div>
  );
}

// Helper to get attribute value by code
function getAttributeValue(code: string): number {
  const attr = attributes.value.find((a) => a.code === code);
  return attr?.value ?? 5;
}
