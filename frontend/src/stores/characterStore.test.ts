/**
 * Character Store Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  character,
  attributes,
  skills,
  factions,
  finances,
  conditions,
  equipped,
  isLoadingCharacter,
  characterError,
  healthPercent,
  humanityPercent,
  isHealthCritical,
  isHumanityLow,
  primaryAttributes,
  totalCredits,
  displayName,
  activeConditions,
  setCharacter,
  setAttributes,
  setSkills,
  setFactions,
  setFinances,
  setConditions,
  setEquipped,
  updateHealth,
  updateHumanity,
  clearCharacterData,
  setLoadingCharacter,
  setCharacterError,
  CharacterData,
  CharacterAttribute,
  CharacterSkill,
  FactionStanding,
  CharacterFinances,
  CharacterCondition,
  EquippedItem,
} from './characterStore';

// Mock character data
const mockCharacter: CharacterData = {
  id: 'char-123',
  legalName: 'John Doe',
  streetName: 'Shadow',
  handle: 'shadow_runner',
  currentTier: 2,
  carrierRating: 4.5,
  currentHealth: 80,
  maxHealth: 100,
  currentHumanity: 60,
  maxHumanity: 100,
  isActive: true,
  isDead: false,
};

const mockAttributes: CharacterAttribute[] = [
  { code: 'PWR', name: 'Power', value: 5 },
  { code: 'AGI', name: 'Agility', value: 7 },
  { code: 'END', name: 'Endurance', value: 4 },
  { code: 'VEL', name: 'Velocity', value: 6 },
  { code: 'INT', name: 'Intelligence', value: 8 },
  { code: 'WIS', name: 'Wisdom', value: 5 },
  { code: 'EMP', name: 'Empathy', value: 3 },
  { code: 'PRC', name: 'Perception', value: 6 },
];

const mockSkills: CharacterSkill[] = [
  { code: 'stealth', name: 'Stealth', level: 3 },
  { code: 'hacking', name: 'Hacking', level: 5 },
  { code: 'driving', name: 'Driving', level: 2 },
];

const mockFactions: FactionStanding[] = [
  {
    factionId: 'fac-1',
    name: 'Shadow Network',
    factionType: 'criminal',
    reputation: 75,
    tier: 'trusted',
    isMember: true,
  },
  {
    factionId: 'fac-2',
    name: 'Metro Corp',
    factionType: 'corporate',
    reputation: 25,
    tier: 'neutral',
    isMember: false,
  },
];

const mockFinances: CharacterFinances = {
  credits: 5000,
  creditsLifetime: 25000,
  escrowHeld: 1500,
};

const mockConditions: CharacterCondition[] = [
  {
    id: 'cond-1',
    conditionId: 'wounded',
    name: 'Wounded',
    effectDescription: '-1 to physical actions',
    stackCount: 1,
    isActive: true,
  },
  {
    id: 'cond-2',
    conditionId: 'inspired',
    name: 'Inspired',
    effectDescription: '+1 to social actions',
    stackCount: 1,
    isActive: false,
  },
];

const mockEquipped: EquippedItem[] = [
  {
    slot: 'head',
    itemId: 'item-1',
    itemName: 'Neural Interface',
    itemType: 'augmentation',
    rarity: 'rare',
  },
  {
    slot: 'hand',
    itemId: 'item-2',
    itemName: 'Data Spike',
    itemType: 'weapon',
    rarity: 'common',
  },
];

describe('Character Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    clearCharacterData();
    isLoadingCharacter.value = false;
  });

  describe('State Management', () => {
    it('should set character data', () => {
      setCharacter(mockCharacter);
      expect(character.value).toEqual(mockCharacter);
    });

    it('should set attributes', () => {
      setAttributes(mockAttributes);
      expect(attributes.value).toEqual(mockAttributes);
    });

    it('should set skills', () => {
      setSkills(mockSkills);
      expect(skills.value).toEqual(mockSkills);
    });

    it('should set factions', () => {
      setFactions(mockFactions);
      expect(factions.value).toEqual(mockFactions);
    });

    it('should set finances', () => {
      setFinances(mockFinances);
      expect(finances.value).toEqual(mockFinances);
    });

    it('should set conditions', () => {
      setConditions(mockConditions);
      expect(conditions.value).toEqual(mockConditions);
    });

    it('should set equipped items', () => {
      setEquipped(mockEquipped);
      expect(equipped.value).toEqual(mockEquipped);
    });

    it('should clear all character data', () => {
      // Set data first
      setCharacter(mockCharacter);
      setAttributes(mockAttributes);
      setSkills(mockSkills);
      setFactions(mockFactions);
      setFinances(mockFinances);
      setConditions(mockConditions);
      setEquipped(mockEquipped);

      // Clear
      clearCharacterData();

      // Verify all cleared
      expect(character.value).toBeNull();
      expect(attributes.value).toEqual([]);
      expect(skills.value).toEqual([]);
      expect(factions.value).toEqual([]);
      expect(finances.value).toBeNull();
      expect(conditions.value).toEqual([]);
      expect(equipped.value).toEqual([]);
    });
  });

  describe('Health Management', () => {
    beforeEach(() => {
      setCharacter(mockCharacter);
    });

    it('should calculate health percentage', () => {
      expect(healthPercent.value).toBe(80);
    });

    it('should update health', () => {
      updateHealth(50);
      expect(character.value?.currentHealth).toBe(50);
      expect(healthPercent.value).toBe(50);
    });

    it('should update health with new max', () => {
      updateHealth(90, 120);
      expect(character.value?.currentHealth).toBe(90);
      expect(character.value?.maxHealth).toBe(120);
      expect(healthPercent.value).toBe(75);
    });

    it('should detect critical health', () => {
      expect(isHealthCritical.value).toBe(false);
      updateHealth(20);
      expect(isHealthCritical.value).toBe(true);
    });

    it('should return 100% health when no character', () => {
      setCharacter(null);
      expect(healthPercent.value).toBe(100);
    });
  });

  describe('Humanity Management', () => {
    beforeEach(() => {
      setCharacter(mockCharacter);
    });

    it('should calculate humanity percentage', () => {
      expect(humanityPercent.value).toBe(60);
    });

    it('should update humanity', () => {
      updateHumanity(40);
      expect(character.value?.currentHumanity).toBe(40);
      expect(humanityPercent.value).toBe(40);
    });

    it('should update humanity with new max', () => {
      updateHumanity(50, 80);
      expect(character.value?.currentHumanity).toBe(50);
      expect(character.value?.maxHumanity).toBe(80);
      expect(humanityPercent.value).toBe(63);
    });

    it('should detect low humanity', () => {
      expect(isHumanityLow.value).toBe(false);
      updateHumanity(25);
      expect(isHumanityLow.value).toBe(true);
    });
  });

  describe('Computed Values', () => {
    it('should compute primary attributes', () => {
      setAttributes(mockAttributes);
      const attrs = primaryAttributes.value;
      expect(attrs.PWR).toBe(5);
      expect(attrs.AGI).toBe(7);
      expect(attrs.END).toBe(4);
      expect(attrs.VEL).toBe(6);
      expect(attrs.INT).toBe(8);
      expect(attrs.WIS).toBe(5);
      expect(attrs.EMP).toBe(3);
      expect(attrs.PRC).toBe(6);
    });

    it('should return 0 for missing attributes', () => {
      setAttributes([]);
      const attrs = primaryAttributes.value;
      expect(attrs.PWR).toBe(0);
      expect(attrs.INT).toBe(0);
    });

    it('should compute total credits', () => {
      setFinances(mockFinances);
      expect(totalCredits.value).toBe(6500); // 5000 + 1500
    });

    it('should return 0 credits when no finances', () => {
      expect(totalCredits.value).toBe(0);
    });

    it('should compute display name from streetName', () => {
      setCharacter(mockCharacter);
      expect(displayName.value).toBe('Shadow');
    });

    it('should fallback to legalName when no streetName', () => {
      setCharacter({ ...mockCharacter, streetName: undefined });
      expect(displayName.value).toBe('John Doe');
    });

    it('should return Unknown when no character', () => {
      expect(displayName.value).toBe('Unknown');
    });

    it('should filter active conditions', () => {
      setConditions(mockConditions);
      expect(activeConditions.value).toHaveLength(1);
      expect(activeConditions.value[0].name).toBe('Wounded');
    });
  });

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      expect(isLoadingCharacter.value).toBe(false);
      setLoadingCharacter(true);
      expect(isLoadingCharacter.value).toBe(true);
    });

    it('should set error', () => {
      expect(characterError.value).toBeNull();
      setCharacterError('Failed to load character');
      expect(characterError.value).toBe('Failed to load character');
    });

    it('should clear error on clearCharacterData', () => {
      setCharacterError('Some error');
      clearCharacterData();
      expect(characterError.value).toBeNull();
    });
  });
});
