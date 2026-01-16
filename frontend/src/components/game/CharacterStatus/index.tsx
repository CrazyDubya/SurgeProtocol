import { Card, Progress, Stat } from '@components/ui';
import type { Character } from '@/types';
import styles from './CharacterStatus.module.css';

export interface CharacterStatusProps {
  character: Character;
  compact?: boolean;
  class?: string;
}

/**
 * Character status display showing HP, Humanity, XP, and key stats
 */
export function CharacterStatus({
  character,
  compact = false,
  class: className,
}: CharacterStatusProps) {
  const classes = [styles.status, compact && styles.compact, className]
    .filter(Boolean)
    .join(' ');

  const hpPercent = (character.hp.current / character.hp.max) * 100;
  const humanityPercent = (character.humanity.current / character.humanity.max) * 100;
  const _xpToNext = character.xp.toNextLevel - character.xp.current;
  void _xpToNext; // Reserved for future use

  return (
    <Card variant="terminal" padding={compact ? 'sm' : 'md'} class={classes}>
      <div class={styles.header}>
        <div class={styles.identity}>
          <span class={styles.name}>{character.name}</span>
          <span class={styles.alias}>"{character.alias}"</span>
        </div>
        <div class={styles.level}>
          <span class={styles.levelLabel}>LVL</span>
          <span class={styles.levelValue}>{character.level}</span>
        </div>
      </div>

      <div class={styles.bars}>
        {/* Health Bar */}
        <div class={styles.barRow}>
          <span class={styles.barLabel}>HP</span>
          <Progress
            value={character.hp.current}
            max={character.hp.max}
            variant="health"
            size={compact ? 'sm' : 'md'}
            glow={hpPercent <= 25}
            showLabel={!compact}
          />
        </div>

        {/* Humanity Bar */}
        <div class={styles.barRow}>
          <span class={styles.barLabel}>HUM</span>
          <Progress
            value={character.humanity.current}
            max={character.humanity.max}
            variant="humanity"
            size={compact ? 'sm' : 'md'}
            glow={humanityPercent <= 25}
            showLabel={!compact}
          />
        </div>

        {/* XP Bar */}
        <div class={styles.barRow}>
          <span class={styles.barLabel}>XP</span>
          <Progress
            value={character.xp.current}
            max={character.xp.toNextLevel}
            variant="xp"
            size={compact ? 'sm' : 'md'}
            striped
            showLabel={!compact}
            labelFormat={(val, max) => `${val}/${max} (${max - val} to next)`}
          />
        </div>
      </div>

      {!compact && (
        <div class={styles.credits}>
          <Stat
            value={`¥${character.credits.toLocaleString()}`}
            label="Credits"
            variant="highlight"
            size="sm"
          />
        </div>
      )}
    </Card>
  );
}

/**
 * Minimal inline status for headers/nav
 */
export function CharacterStatusMini({ character }: { character: Character }) {
  return (
    <div class={styles.mini}>
      <span class={styles.miniName}>{character.alias}</span>
      <div class={styles.miniBars}>
        <Progress
          value={character.hp.current}
          max={character.hp.max}
          variant="health"
          size="xs"
        />
        <Progress
          value={character.humanity.current}
          max={character.humanity.max}
          variant="humanity"
          size="xs"
        />
      </div>
      <span class={styles.miniCredits}>¥{character.credits.toLocaleString()}</span>
    </div>
  );
}
