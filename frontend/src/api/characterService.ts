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
    return api.post('/characters', data);
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
