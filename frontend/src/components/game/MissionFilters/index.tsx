import { ComponentChildren } from 'preact';
import type { MissionType, MissionDifficulty } from '@/types';
import styles from './MissionFilters.module.css';

export interface MissionFiltersProps {
  selectedTypes: MissionType[];
  selectedDifficulties: MissionDifficulty[];
  searchQuery: string;
  sortBy: MissionSortOption;
  onTypeToggle: (type: MissionType) => void;
  onDifficultyToggle: (difficulty: MissionDifficulty) => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: MissionSortOption) => void;
  onClearAll: () => void;
  inline?: boolean;
}

export type MissionSortOption = 'reward' | 'difficulty' | 'time' | 'distance';

const MISSION_TYPES: { type: MissionType; label: string; icon: string }[] = [
  { type: 'delivery', label: 'Delivery', icon: '◈' },
  { type: 'extraction', label: 'Extraction', icon: '⬡' },
  { type: 'infiltration', label: 'Infiltration', icon: '◇' },
  { type: 'sabotage', label: 'Sabotage', icon: '⬢' },
  { type: 'courier', label: 'Courier', icon: '▷' },
  { type: 'escort', label: 'Escort', icon: '◆' },
];

const DIFFICULTIES: { difficulty: MissionDifficulty; label: string; color: string }[] = [
  { difficulty: 'easy', label: 'Easy', color: 'success' },
  { difficulty: 'medium', label: 'Medium', color: 'warning' },
  { difficulty: 'hard', label: 'Hard', color: 'danger' },
  { difficulty: 'extreme', label: 'Extreme', color: 'humanity' },
];

const SORT_OPTIONS: { value: MissionSortOption; label: string }[] = [
  { value: 'reward', label: 'Reward (High → Low)' },
  { value: 'difficulty', label: 'Difficulty' },
  { value: 'time', label: 'Time Limit' },
  { value: 'distance', label: 'Distance' },
];

export function MissionFilters({
  selectedTypes,
  selectedDifficulties,
  searchQuery,
  sortBy,
  onTypeToggle,
  onDifficultyToggle,
  onSearchChange,
  onSortChange,
  onClearAll,
  inline = false,
}: MissionFiltersProps) {
  const hasActiveFilters =
    selectedTypes.length > 0 || selectedDifficulties.length > 0 || searchQuery.length > 0;

  return (
    <div class={`${styles.filters} ${inline ? styles.inline : ''}`}>
      {!inline && (
        <div class={styles.header}>
          <h3 class={styles.title}>Filters</h3>
          {hasActiveFilters && (
            <button class={styles.clearButton} onClick={onClearAll}>
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div class={styles.searchWrapper}>
        <span class={styles.searchIcon}>⌕</span>
        <input
          type="text"
          class={styles.searchInput}
          placeholder="Search missions..."
          value={searchQuery}
          onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
        />
      </div>

      {/* Mission Types */}
      <FilterGroup label="Type">
        {MISSION_TYPES.map(({ type, label, icon }) => (
          <FilterChip
            key={type}
            active={selectedTypes.includes(type)}
            onClick={() => onTypeToggle(type)}
            icon={icon}
          >
            {label}
          </FilterChip>
        ))}
      </FilterGroup>

      {/* Difficulty */}
      <FilterGroup label="Difficulty">
        {DIFFICULTIES.map(({ difficulty, label }) => (
          <FilterChip
            key={difficulty}
            active={selectedDifficulties.includes(difficulty)}
            onClick={() => onDifficultyToggle(difficulty)}
          >
            {label}
          </FilterChip>
        ))}
      </FilterGroup>

      {/* Sort */}
      <div class={styles.sortWrapper}>
        <span class={styles.sortLabel}>Sort by</span>
        <select
          class={styles.sortSelect}
          value={sortBy}
          onChange={(e) => onSortChange((e.target as HTMLSelectElement).value as MissionSortOption)}
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && !inline && (
        <div class={styles.activeSummary}>
          <span class={styles.activeLabel}>Active:</span>
          <div class={styles.activeChips}>
            {selectedTypes.map((type) => (
              <span key={type} class={styles.activeChip}>
                {type}
                <button
                  class={styles.activeChipRemove}
                  onClick={() => onTypeToggle(type)}
                  aria-label={`Remove ${type} filter`}
                >
                  ×
                </button>
              </span>
            ))}
            {selectedDifficulties.map((diff) => (
              <span key={diff} class={styles.activeChip}>
                {diff}
                <button
                  class={styles.activeChipRemove}
                  onClick={() => onDifficultyToggle(diff)}
                  aria-label={`Remove ${diff} filter`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterGroupProps {
  label: string;
  children: ComponentChildren;
}

function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <div class={styles.group}>
      <span class={styles.groupLabel}>{label}</span>
      <div class={styles.groupOptions}>{children}</div>
    </div>
  );
}

interface FilterChipProps {
  children: ComponentChildren;
  active: boolean;
  onClick: () => void;
  icon?: string;
  count?: number;
}

function FilterChip({ children, active, onClick, icon, count }: FilterChipProps) {
  return (
    <button
      class={`${styles.chip} ${active ? styles.active : ''}`}
      onClick={onClick}
      type="button"
    >
      {icon && <span class={styles.chipIcon}>{icon}</span>}
      {children}
      {count !== undefined && <span class={styles.chipCount}>({count})</span>}
    </button>
  );
}
