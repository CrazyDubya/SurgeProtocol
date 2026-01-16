import type { Attributes } from '@/types';
import styles from './AttributeDisplay.module.css';

export interface AttributeDisplayProps {
  attributes: Attributes;
  baseAttributes?: Attributes;
  layout?: 'grid' | 'list' | 'compact';
  showDescriptions?: boolean;
}

interface AttributeInfo {
  key: keyof Attributes;
  name: string;
  description: string;
  maxValue: number;
}

const ATTRIBUTE_INFO: AttributeInfo[] = [
  { key: 'reflex', name: 'Reflex', description: 'Speed, agility, reaction time', maxValue: 10 },
  { key: 'tech', name: 'Tech', description: 'Hacking, repair, cybernetics', maxValue: 10 },
  { key: 'cool', name: 'Cool', description: 'Composure, intimidation, style', maxValue: 10 },
  { key: 'body', name: 'Body', description: 'Strength, endurance, resilience', maxValue: 10 },
  { key: 'empathy', name: 'Empathy', description: 'Social skills, humanity retention', maxValue: 10 },
];

export function AttributeDisplay({
  attributes,
  baseAttributes,
  layout = 'grid',
  showDescriptions = true,
}: AttributeDisplayProps) {
  const getModifier = (key: keyof Attributes): number | null => {
    if (!baseAttributes) return null;
    const diff = attributes[key] - baseAttributes[key];
    return diff !== 0 ? diff : null;
  };

  const getState = (key: keyof Attributes): 'normal' | 'buffed' | 'debuffed' => {
    const mod = getModifier(key);
    if (mod === null) return 'normal';
    return mod > 0 ? 'buffed' : 'debuffed';
  };

  return (
    <div class={`${styles.attributes} ${layout === 'grid' ? styles.grid : ''}`}>
      {ATTRIBUTE_INFO.map((info) => {
        const value = attributes[info.key];
        const modifier = getModifier(info.key);
        const state = getState(info.key);
        const percentage = (value / info.maxValue) * 100;

        return (
          <div
            key={info.key}
            class={`${styles.attribute} ${layout === 'compact' ? styles.compact : ''} ${
              state !== 'normal' ? styles[state] : ''
            }`}
          >
            <div class={styles.attributeHeader}>
              <span class={styles.attributeName}>{info.name}</span>
              <div class={styles.attributeValue}>
                <span class={styles.valueCurrent}>{value}</span>
                <span class={styles.valueMax}>/{info.maxValue}</span>
                {modifier !== null && (
                  <span
                    class={`${styles.valueModifier} ${
                      modifier > 0 ? styles.positive : styles.negative
                    }`}
                  >
                    {modifier > 0 ? '+' : ''}{modifier}
                  </span>
                )}
              </div>
            </div>

            <div class={styles.attributeBar}>
              <div class={styles.attributeFill} style={{ width: `${percentage}%` }} />
            </div>

            {showDescriptions && layout !== 'compact' && (
              <p class={styles.attributeDesc}>{info.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export interface AttributeSummaryProps {
  attributes: Attributes;
}

export function AttributeSummary({ attributes }: AttributeSummaryProps) {
  const total = Object.values(attributes).reduce((sum, val) => sum + val, 0);

  return (
    <div class={styles.summary}>
      {ATTRIBUTE_INFO.map((info) => (
        <div key={info.key} class={styles.summaryItem}>
          <span class={styles.summaryLabel}>{info.name.substring(0, 3)}</span>
          <span class={`${styles.summaryValue} ${styles.highlight}`}>
            {attributes[info.key]}
          </span>
        </div>
      ))}
      <div class={styles.summaryItem}>
        <span class={styles.summaryLabel}>Total</span>
        <span class={styles.summaryValue}>{total}</span>
      </div>
    </div>
  );
}

export interface DerivedStatsProps {
  attributes: Attributes;
}

export function DerivedStats({ attributes }: DerivedStatsProps) {
  // Calculate derived stats based on attributes
  const initiative = attributes.reflex + Math.floor(attributes.cool / 2);
  const carryCapacity = attributes.body * 10;
  const hackBonus = Math.floor(attributes.tech / 2);
  const socialMod = attributes.empathy - 5;
  const dodgeBonus = Math.floor(attributes.reflex / 2);

  const stats = [
    { label: 'Initiative', value: initiative },
    { label: 'Carry (kg)', value: carryCapacity },
    { label: 'Hack Bonus', value: hackBonus, isBonus: hackBonus > 0 },
    { label: 'Social Mod', value: socialMod, isBonus: socialMod > 0, isPenalty: socialMod < 0 },
    { label: 'Dodge', value: dodgeBonus, isBonus: dodgeBonus > 0 },
    { label: 'Humanity Max', value: attributes.empathy * 10 },
  ];

  return (
    <div class={styles.derived}>
      {stats.map((stat) => (
        <div key={stat.label} class={styles.derivedStat}>
          <span class={styles.derivedLabel}>{stat.label}</span>
          <span
            class={`${styles.derivedValue} ${stat.isBonus ? styles.bonus : ''} ${
              stat.isPenalty ? styles.penalty : ''
            }`}
          >
            {stat.isBonus ? '+' : ''}{stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
