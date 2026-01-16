/**
 * useCharacterData Hook Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/preact';
import { useCharacterData } from './useCharacterData';
import * as characterStore from '@/stores/characterStore';
import * as authStore from '@/stores/authStore';

// Mock the API service
vi.mock('@/api', () => ({
  characterService: {
    get: vi.fn(),
    getStats: vi.fn(),
    getFactions: vi.fn(),
  },
}));

// Import mocked module
import { characterService } from '@/api';

const mockCharacterResponse = {
  character: {
    id: 'char-123',
    handle: 'shadow_runner',
    legal_name: 'John Doe',
    street_name: 'Shadow',
    omni_deliver_id: 'OD-12345',
    current_tier: 2,
    carrier_rating: 4.5,
    current_xp: 1500,
    current_health: 80,
    max_health: 100,
    current_humanity: 60,
    max_humanity: 100,
    is_active: true,
    is_dead: false,
  },
};

const mockStatsResponse = {
  attributes: {
    STR: 5,
    AGI: 7,
    VIT: 6,
    INT: 8,
  },
  skills: {
    FIREARMS: 3,
    STEALTH: 5,
    HACKING: 4,
  },
  equipped: [
    {
      slot: 'head',
      itemId: 'item-1',
      itemName: 'Neural Interface',
      itemType: 'cyberware',
      rarity: 'rare',
    },
  ],
  conditions: [],
};

const mockFactionsResponse = {
  factions: [
    {
      factionId: 'fac-1',
      name: 'Shadow Network',
      factionType: 'criminal',
      reputation: 75,
      tier: 'trusted',
      isMember: true,
    },
  ],
};

describe('useCharacterData Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset store state
    characterStore.clearCharacterData();
    characterStore.setLoadingCharacter(false);

    // Set up mock implementations
    (characterService.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockCharacterResponse);
    (characterService.getStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockStatsResponse);
    (characterService.getFactions as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockFactionsResponse
    );
  });

  it('should return initial state', () => {
    // Ensure no active character
    authStore.activeCharacterId.value = null;

    const { result } = renderHook(() => useCharacterData());

    expect(result.current.character).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should expose load functions', () => {
    authStore.activeCharacterId.value = null;

    const { result } = renderHook(() => useCharacterData());

    expect(typeof result.current.loadCharacter).toBe('function');
    expect(typeof result.current.loadStats).toBe('function');
    expect(typeof result.current.loadFactions).toBe('function');
    expect(typeof result.current.loadAll).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
  });

  it('should load character data when characterId is set', async () => {
    authStore.activeCharacterId.value = 'char-123';

    const { result } = renderHook(() => useCharacterData());

    await waitFor(() => {
      expect(characterService.get).toHaveBeenCalledWith('char-123');
    });
  });

  it('should transform API response to store format', async () => {
    authStore.activeCharacterId.value = 'char-123';

    renderHook(() => useCharacterData());

    await waitFor(() => {
      expect(characterStore.character.value).not.toBeNull();
    });

    const char = characterStore.character.value;
    expect(char?.id).toBe('char-123');
    expect(char?.handle).toBe('shadow_runner');
    expect(char?.legalName).toBe('John Doe');
    expect(char?.streetName).toBe('Shadow');
    expect(char?.currentTier).toBe(2);
    expect(char?.currentHealth).toBe(80);
  });

  it('should handle API errors', async () => {
    authStore.activeCharacterId.value = 'char-123';
    (characterService.get as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );

    renderHook(() => useCharacterData());

    await waitFor(() => {
      expect(characterStore.characterError.value).toBe('Network error');
    });
  });

  it('should not load when no characterId', async () => {
    authStore.activeCharacterId.value = null;

    const { result } = renderHook(() => useCharacterData());

    // Call loadCharacter manually
    await result.current.loadCharacter();

    expect(characterService.get).not.toHaveBeenCalled();
  });

  it('should load stats and populate attributes', async () => {
    authStore.activeCharacterId.value = 'char-123';

    renderHook(() => useCharacterData());

    await waitFor(() => {
      expect(characterService.getStats).toHaveBeenCalledWith('char-123');
    });

    await waitFor(() => {
      expect(characterStore.attributes.value.length).toBeGreaterThan(0);
    });

    const strAttr = characterStore.attributes.value.find((a) => a.code === 'STR');
    expect(strAttr?.value).toBe(5);
    expect(strAttr?.name).toBe('Strength');
  });

  it('should load skills and transform names', async () => {
    authStore.activeCharacterId.value = 'char-123';

    renderHook(() => useCharacterData());

    await waitFor(() => {
      expect(characterStore.skills.value.length).toBeGreaterThan(0);
    });

    const stealthSkill = characterStore.skills.value.find((s) => s.code === 'STEALTH');
    expect(stealthSkill?.level).toBe(5);
    expect(stealthSkill?.name).toBe('Stealth');
  });

  it('should load factions', async () => {
    authStore.activeCharacterId.value = 'char-123';

    renderHook(() => useCharacterData());

    await waitFor(() => {
      expect(characterService.getFactions).toHaveBeenCalledWith('char-123');
    });

    await waitFor(() => {
      expect(characterStore.factions.value.length).toBeGreaterThan(0);
    });

    const faction = characterStore.factions.value[0];
    expect(faction.name).toBe('Shadow Network');
    expect(faction.reputation).toBe(75);
  });

  it('should load equipped items', async () => {
    authStore.activeCharacterId.value = 'char-123';

    renderHook(() => useCharacterData());

    await waitFor(() => {
      expect(characterStore.equipped.value.length).toBeGreaterThan(0);
    });

    const equipped = characterStore.equipped.value[0];
    expect(equipped.slot).toBe('head');
    expect(equipped.itemName).toBe('Neural Interface');
  });
});
