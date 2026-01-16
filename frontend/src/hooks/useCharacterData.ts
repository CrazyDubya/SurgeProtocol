/**
 * useCharacterData - Hook for loading character data into stores
 *
 * Fetches character details, stats, inventory, and factions
 * and populates the corresponding stores.
 */

import { useEffect, useCallback } from 'preact/hooks';
import { computed } from '@preact/signals';
import { characterService } from '@/api';
import {
  character,
  setCharacter,
  setAttributes,
  setSkills,
  setFactions,
  setEquipped,
  setConditions,
  setLoadingCharacter,
  setLoadingStats,
  setCharacterError,
  isLoadingCharacter,
  isLoadingStats,
  characterError,
} from '@/stores';
import { activeCharacterId } from '@/stores/authStore';

// Computed loading state
const isLoading = computed(() => isLoadingCharacter.value || isLoadingStats.value);

export function useCharacterData() {
  const characterId = activeCharacterId.value;

  /**
   * Load basic character data
   */
  const loadCharacter = useCallback(async () => {
    if (!characterId) return;

    setLoadingCharacter(true);
    setCharacterError(null);

    try {
      const { character: charData } = await characterService.get(characterId);

      setCharacter({
        id: charData.id,
        handle: charData.handle,
        legalName: charData.legal_name,
        streetName: charData.street_name,
        omniDeliverId: charData.omni_deliver_id,
        currentTier: charData.current_tier,
        carrierRating: charData.carrier_rating,
        currentXp: charData.current_xp,
        currentHealth: charData.current_health,
        maxHealth: charData.max_health,
        currentHumanity: charData.current_humanity,
        maxHumanity: charData.max_humanity,
        isActive: charData.is_active,
        isDead: charData.is_dead,
      });
    } catch (err) {
      setCharacterError(err instanceof Error ? err.message : 'Failed to load character');
    } finally {
      setLoadingCharacter(false);
    }
  }, [characterId]);

  /**
   * Load character stats (attributes, skills, equipped, conditions)
   */
  const loadStats = useCallback(async () => {
    if (!characterId) return;

    setLoadingStats(true);

    try {
      const stats = await characterService.getStats(characterId);

      // Transform attributes to array format
      const attributeArray = Object.entries(stats.attributes).map(([code, value]) => ({
        code,
        value: value as number,
        name: getAttributeName(code),
      }));
      setAttributes(attributeArray);

      // Transform skills to array format
      const skillArray = Object.entries(stats.skills).map(([code, level]) => ({
        code,
        level: level as number,
        name: getSkillName(code),
      }));
      setSkills(skillArray);

      // Set equipped items
      if (stats.equipped) {
        setEquipped(stats.equipped.map((item) => ({
          slot: item.slot,
          itemId: item.itemId,
          itemName: item.itemName,
          itemType: item.itemType,
          rarity: item.rarity,
        })));
      }

      // Set conditions
      if (stats.conditions) {
        setConditions(stats.conditions.map((cond) => ({
          id: cond.id,
          conditionId: cond.conditionId,
          name: cond.name,
          effectDescription: cond.effectDescription,
          stackCount: cond.stackCount,
          isActive: cond.isActive,
          expiresAt: cond.expiresAt,
        })));
      }
    } catch (err) {
      console.error('Failed to load character stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [characterId]);

  /**
   * Load character faction standings
   */
  const loadFactions = useCallback(async () => {
    if (!characterId) return;

    try {
      const { factions: factionData } = await characterService.getFactions(characterId);

      setFactions(factionData.map((f) => ({
        factionId: f.factionId,
        name: f.name,
        factionType: f.factionType,
        reputation: f.reputation,
        tier: f.tier,
        isMember: f.isMember,
      })));
    } catch (err) {
      console.error('Failed to load faction standings:', err);
    }
  }, [characterId]);

  /**
   * Load all character data
   */
  const loadAll = useCallback(async () => {
    if (!characterId) return;

    await Promise.all([
      loadCharacter(),
      loadStats(),
      loadFactions(),
    ]);
  }, [loadCharacter, loadStats, loadFactions, characterId]);

  /**
   * Refresh character data
   */
  const refresh = useCallback(() => {
    loadAll();
  }, [loadAll]);

  // Auto-load on mount if character is selected
  useEffect(() => {
    if (characterId && !character.value) {
      loadAll();
    }
  }, [characterId, loadAll]);

  return {
    character: character.value,
    isLoading: isLoading.value,
    error: characterError.value,
    loadCharacter,
    loadStats,
    loadFactions,
    loadAll,
    refresh,
  };
}

// Helper functions to get human-readable names
function getAttributeName(code: string): string {
  const names: Record<string, string> = {
    STR: 'Strength',
    AGI: 'Agility',
    VIT: 'Vitality',
    INT: 'Intelligence',
    PRC: 'Perception',
    CHA: 'Charisma',
    WIL: 'Willpower',
    VEL: 'Velocity',
  };
  return names[code] || code;
}

function getSkillName(code: string): string {
  const names: Record<string, string> = {
    FIREARMS: 'Firearms',
    MELEE: 'Melee Combat',
    STEALTH: 'Stealth',
    HACKING: 'Hacking',
    ENGINEERING: 'Engineering',
    MEDICINE: 'Medicine',
    PERSUASION: 'Persuasion',
    INTIMIDATION: 'Intimidation',
    STREETWISE: 'Streetwise',
    DRIVING: 'Driving',
    ATHLETICS: 'Athletics',
  };
  return names[code] || code;
}

export default useCharacterData;
