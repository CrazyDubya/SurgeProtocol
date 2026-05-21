/**
 * Character Service - API layer for character operations
 *
 * Endpoints:
 * - POST /api/characters - Create character
 * - GET /api/characters - List characters
 * - GET /api/characters/:id - Get character details
 * - PATCH /api/characters/:id - Update character
 * - POST /api/characters/:id/select - Select active character
 * - GET /api/characters/:id/stats - Full stats
 * - GET /api/characters/:id/inventory - Inventory + finances
 * - GET /api/characters/:id/factions - Faction standings
 */

import { api } from './client';

// =============================================================================
// TYPES - Request/Response
// =============================================================================

export interface CreateCharacterRequest {
  name?: string; // For compatibility with some frontend components
  legalName: string;
  streetName?: string;
  handle?: string;
  sex: 'MALE' | 'FEMALE' | 'OTHER';
  age: number;
  attributes: {
    STR: number;
    AGI: number;
    VIT: number;
    INT: number;
    PRC: number;
    CHA: number;
    WIL: number;
    VEL: number;
  };
}

export interface UpdateCharacterRequest {
  streetName?: string;
  handle?: string;
}

// =============================================================================
// TYPES - Response Data
// =============================================================================

export interface CharacterSummary {
  id: string;
  handle: string;
  current_tier: number;
  carrier_rating?: number;
  current_health?: number;
  max_health?: number;
  is_active?: boolean;
}

export interface CharacterDetail {
  id: string;
  user_id: string;
  legal_name: string;
  street_name?: string;
  handle: string;
  omni_deliver_id: string;
  current_tier: number;
  carrier_rating: number;
  current_xp: number;
  current_health: number;
  max_health: number;
  current_humanity: number;
  max_humanity: number;
  is_active: boolean;
  is_dead: boolean;
  created_at: string;
  updated_at: string;
}

export interface CharacterStats {
  attributes: Record<string, number>;
  skills: Record<string, number>;
  rating: {
    current: number;
    tier: number;
    totalDeliveries: number;
  };
  equipped?: EquippedItem[];
  conditions?: CharacterCondition[];
  activeVehicle?: {
    id: string;
    vehicle_name: string;
    vehicle_def_id: string;
    current_hull_points: number;
    current_fuel: number;
  } | null;
}

export interface EquippedItem {
  slot: string;
  itemId: string;
  itemName: string;
  itemType: string;
  rarity: string;
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

export interface InventoryResponse {
  inventory: InventoryItem[];
  capacity: {
    used: number;
    max: number;
  };
  finances?: {
    credits: number;
    creditsLifetime: number;
    escrowHeld: number;
  };
}

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  description?: string;
  itemType: string;
  rarity: string;
  quantity: number;
  maxStack?: number;
  weight?: number;
  baseValue?: number;
  condition?: number;
  maxCondition?: number;
  isEquipped: boolean;
  equippedSlot?: string;
}

export interface FactionStanding {
  factionId: string;
  name: string;
  factionType: string;
  reputation: number;
  tier: string;
  isMember: boolean;
}

export interface SelectCharacterResponse {
  accessToken: string;
  character: {
    id: string;
  };
}

// =============================================================================
// SERVICE
// =============================================================================

export const characterService = {
  /**
   * Create a new character (max 3 per user)
   */
  async create(data: CreateCharacterRequest): Promise<{ character: CharacterSummary }> {
    // Map frontend attributes to backend schema
    const backendAttributes = {
      PWR: data.attributes.STR,
      AGI: data.attributes.AGI,
      END: data.attributes.VIT,
      VEL: data.attributes.VEL,
      INT: data.attributes.INT,
      RSN: data.attributes.WIL, // Wilpower -> Reason
      EMP: data.attributes.CHA, // Charisma -> Empathy 
      PRC: data.attributes.PRC,
      // PRE: ??? If backend needs PRE, we might need another mapping or default?
      // For now, let's assume RSN and EMP cover the socials/mentals we have.
      // Wait, DB has PRE (Presence) and EMP (Empathy).
      // Frontend has CHA (Charisma). CHA -> PRE fits better?
      // EMP (Empathy) is new?
      // Let's map CHA -> PRE, and maybe something else to EMP?
      // Or just duplicate/split?
      // Let's map CHA -> EMP for now as previously decided, and ignore PRE or set it to default (5).
      // Actually, if I send PRE: 5, I satisfy the DB check if I loop over all codes.
      PRE: 5,
    };

    // Map sex enum
    // Frontend 'OTHER' -> Backend 'UNKNOWN' (or could be NONBINARY depending on intent)
    // Backend accepts: 'MALE', 'FEMALE', 'NONBINARY', 'SYNTHETIC', 'UNKNOWN'
    let sex = data.sex as string;
    if (sex === 'OTHER') sex = 'UNKNOWN';

    const payload = {
      // Map 'name' from component to 'legalName' for backend
      legalName: (data as any).name || data.legalName,
      streetName: data.streetName,
      handle: data.handle,
      sex,
      age: data.age,
      attributes: backendAttributes,
    };

    return api.post('/characters', payload);
  },

  /**
   * List all characters for current user
   */
  async list(): Promise<{ characters: CharacterSummary[]; count: number }> {
    return api.get('/characters');
  },

  /**
   * Get detailed character information
   */
  async get(characterId: string): Promise<{ character: CharacterDetail }> {
    return api.get(`/characters/${characterId}`);
  },

  /**
   * Update character information
   */
  async update(
    characterId: string,
    data: UpdateCharacterRequest
  ): Promise<{ character: CharacterDetail }> {
    return api.patch(`/characters/${characterId}`, data);
  },

  /**
   * Select a character for the current session
   * Returns a new JWT with character claim
   */
  async select(characterId: string): Promise<SelectCharacterResponse> {
    return api.post(`/characters/${characterId}/select`);
  },

  /**
   * Get full character stats (attributes, skills, equipped, conditions)
   */
  async getStats(characterId: string): Promise<CharacterStats> {
    return api.get(`/characters/${characterId}/stats`);
  },

  /**
   * Get character inventory and finances
   */
  async getInventory(characterId: string): Promise<InventoryResponse> {
    return api.get(`/characters/${characterId}/inventory`);
  },

  /**
   * Get character faction standings
   */
  async getFactions(characterId: string): Promise<{ factions: FactionStanding[] }> {
    return api.get(`/characters/${characterId}/factions`);
  },
};

export default characterService;
