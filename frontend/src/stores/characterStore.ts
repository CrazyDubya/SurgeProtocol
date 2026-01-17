/**
 * Character Store - Character data and state management
 *
 * Handles:
 * - Current character data (stats, attributes, skills)
 * - Faction standings
 * - Character finances
 * - Augmentations and conditions
 */

import { signal, computed } from '@preact/signals';

// =============================================================================
// TYPES
// =============================================================================

export interface CharacterData {
  id: string;
  legalName: string;
  streetName?: string;
  handle?: string;
  omniDeliverId?: string;
  currentTier: number;
  carrierRating: number;
  currentXp?: number;
  currentHealth: number;
  maxHealth: number;
  currentHumanity: number;
  maxHumanity: number;
  isActive: boolean;
  isDead: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CharacterAttribute {
  code: string;
  name: string;
  value: number;
}

export interface CharacterSkill {
  code: string;
  name: string;
  level: number;
}

export interface FactionStanding {
  factionId: string;
  name: string;
  factionType: string;
  reputation: number;
  tier: string;
  isMember: boolean;
}

export interface CharacterFinances {
  credits: number;
  creditsLifetime: number;
  escrowHeld: number;
}

export interface CharacterCondition {
  id: string;
  conditionId: string;
  name: string;
  effectDescription: string;
  stackCount: number;
  isActive: boolean;
  expiresAt?: string;
}

export interface EquippedItem {
  slot: string;
  itemId?: string;
  itemName: string;
  itemType: string;
  rarity: string;
}

// =============================================================================
// STATE SIGNALS
// =============================================================================

// Core character data
export const character = signal<CharacterData | null>(null);

// Detailed stats
export const attributes = signal<CharacterAttribute[]>([]);
export const skills = signal<CharacterSkill[]>([]);
export const factions = signal<FactionStanding[]>([]);
export const finances = signal<CharacterFinances | null>(null);
export const conditions = signal<CharacterCondition[]>([]);
export const equipped = signal<EquippedItem[]>([]);

// Loading states
export const isLoadingCharacter = signal(false);
export const isLoadingStats = signal(false);
export const characterError = signal<string | null>(null);

// =============================================================================
// COMPUTED VALUES
// =============================================================================

/** Health percentage */
export const healthPercent = computed(() => {
  const char = character.value;
  if (!char) return 100;
  return Math.round((char.currentHealth / char.maxHealth) * 100);
});

/** Humanity percentage */
export const humanityPercent = computed(() => {
  const char = character.value;
  if (!char) return 100;
  return Math.round((char.currentHumanity / char.maxHumanity) * 100);
});

/** Is health critical (< 25%) */
export const isHealthCritical = computed(() => healthPercent.value < 25);

/** Is humanity low (< 30%) */
export const isHumanityLow = computed(() => humanityPercent.value < 30);

/** Get attribute by code */
export const getAttributeByCode = (code: string) =>
  computed(() => attributes.value.find((a) => a.code === code));

/** Primary attributes object for easy access */
export const primaryAttributes = computed(() => {
  const attrs = attributes.value;
  return {
    PWR: attrs.find((a) => a.code === 'PWR')?.value ?? 0,
    AGI: attrs.find((a) => a.code === 'AGI')?.value ?? 0,
    END: attrs.find((a) => a.code === 'END')?.value ?? 0,
    VEL: attrs.find((a) => a.code === 'VEL')?.value ?? 0,
    INT: attrs.find((a) => a.code === 'INT')?.value ?? 0,
    WIS: attrs.find((a) => a.code === 'WIS')?.value ?? 0,
    EMP: attrs.find((a) => a.code === 'EMP')?.value ?? 0,
    PRC: attrs.find((a) => a.code === 'PRC')?.value ?? 0,
  };
});

/** Total credits (including escrow) */
export const totalCredits = computed(() => {
  const fin = finances.value;
  if (!fin) return 0;
  return fin.credits + fin.escrowHeld;
});

/** Character display name */
export const displayName = computed(() => {
  const char = character.value;
  if (!char) return 'Unknown';
  return char.streetName || char.legalName;
});

/** Active conditions */
export const activeConditions = computed(() =>
  conditions.value.filter((c) => c.isActive)
);

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Set character data
 */
export function setCharacter(data: CharacterData | null): void {
  character.value = data;
}

/**
 * Set character attributes
 */
export function setAttributes(data: CharacterAttribute[]): void {
  attributes.value = data;
}

/**
 * Set character skills
 */
export function setSkills(data: CharacterSkill[]): void {
  skills.value = data;
}

/**
 * Set faction standings
 */
export function setFactions(data: FactionStanding[]): void {
  factions.value = data;
}

/**
 * Set character finances
 */
export function setFinances(data: CharacterFinances | null): void {
  finances.value = data;
}

/**
 * Set character conditions
 */
export function setConditions(data: CharacterCondition[]): void {
  conditions.value = data;
}

/**
 * Set equipped items
 */
export function setEquipped(data: EquippedItem[]): void {
  equipped.value = data;
}

/**
 * Update health locally (optimistic update)
 */
export function updateHealth(current: number, max?: number): void {
  if (character.value) {
    character.value = {
      ...character.value,
      currentHealth: current,
      maxHealth: max ?? character.value.maxHealth,
    };
  }
}

/**
 * Update humanity locally (optimistic update)
 */
export function updateHumanity(current: number, max?: number): void {
  if (character.value) {
    character.value = {
      ...character.value,
      currentHumanity: current,
      maxHumanity: max ?? character.value.maxHumanity,
    };
  }
}

/**
 * Set loading state
 */
export function setLoadingCharacter(loading: boolean): void {
  isLoadingCharacter.value = loading;
}

/**
 * Set loading stats state
 */
export function setLoadingStats(loading: boolean): void {
  isLoadingStats.value = loading;
}

/**
 * Set error
 */
export function setCharacterError(error: string | null): void {
  characterError.value = error;
}

/**
 * Clear all character data
 */
export function clearCharacterData(): void {
  character.value = null;
  attributes.value = [];
  skills.value = [];
  factions.value = [];
  finances.value = null;
  conditions.value = [];
  equipped.value = [];
  characterError.value = null;
}

// =============================================================================
// STORE EXPORT
// =============================================================================

export const characterStore = {
  // State
  character,
  attributes,
  skills,
  factions,
  finances,
  conditions,
  equipped,
  isLoadingCharacter,
  isLoadingStats,
  characterError,

  // Computed
  healthPercent,
  humanityPercent,
  isHealthCritical,
  isHumanityLow,
  getAttributeByCode,
  primaryAttributes,
  totalCredits,
  displayName,
  activeConditions,

  // Actions
  setCharacter,
  setAttributes,
  setSkills,
  setFactions,
  setFinances,
  setConditions,
  setEquipped,
  updateHealth,
  updateHumanity,
  setLoadingCharacter,
  setLoadingStats,
  setCharacterError,
  clearCharacterData,
};

export default characterStore;
