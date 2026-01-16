/**
 * SURGE PROTOCOL - Type Definitions
 * Core data types for the frontend
 */

// Theme types
export type ThemeName =
  | 'neon-decay'
  | 'terminal-noir'
  | 'algorithm-vision'
  | 'brutalist-cargo'
  | 'worn-chrome';

// Character types
export interface Character {
  id: string;
  name: string;
  tier: number;
  rating: number;
  hp: number;
  maxHp: number;
  humanity: number;
  maxHumanity: number;
  xp: number;
  xpToNextLevel: number;
  credits: number;
  location: Location;
  attributes: Attributes;
  augmentations: Augmentation[];
  factionStanding: FactionStanding[];
}

export interface Attributes {
  body: number;
  mind: number;
  reflex: number;
  presence: number;
}

export interface Augmentation {
  id: string;
  name: string;
  slot: AugmentationSlot;
  status: 'active' | 'dormant' | 'damaged';
  humanityCost: number;
  description: string;
  effects: string[];
}

export type AugmentationSlot =
  | 'ocular'
  | 'neural'
  | 'arm_left'
  | 'arm_right'
  | 'leg_left'
  | 'leg_right'
  | 'torso'
  | 'spine';

export interface FactionStanding {
  factionId: string;
  factionName: string;
  standing: number;
  status: 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'allied';
}

// Location types
export interface Location {
  id: string;
  name: string;
  zone: string;
  threatLevel: 'safe' | 'caution' | 'dangerous' | 'hostile';
  coordinates?: { x: number; y: number };
}

// Mission types
export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  status: MissionStatus;
  difficulty: MissionDifficulty;
  timeLimit?: number; // in seconds
  distance: number; // in km
  reward: MissionReward;
  ratingImpact: number;
  requirements?: MissionRequirement[];
  origin: Location;
  destination: Location;
  package?: Package;
}

export type MissionType =
  | 'standard'
  | 'express'
  | 'fragile'
  | 'escort'
  | 'gray_market'
  | 'corporate'
  | 'medical';

export type MissionStatus =
  | 'available'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'abandoned';

export type MissionDifficulty =
  | 'routine'
  | 'standard'
  | 'challenging'
  | 'dangerous'
  | 'suicide';

export interface MissionReward {
  creditsMin: number;
  creditsMax: number;
  bonusCredits?: number;
  items?: string[];
}

export interface MissionRequirement {
  type: 'tier' | 'rating' | 'faction' | 'item' | 'augmentation';
  value: string | number;
  met: boolean;
}

export interface Package {
  id: string;
  type: string;
  weight: number;
  integrity: number;
  temperatureSensitive?: boolean;
  fragile?: boolean;
  contraband?: boolean;
}

// Inventory types
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  quantity: number;
  weight: number;
  value: number;
  equipped?: boolean;
  condition?: number;
  effects?: ItemEffect[];
}

export type ItemType =
  | 'weapon'
  | 'armor'
  | 'consumable'
  | 'medical'
  | 'chemical'
  | 'tech'
  | 'data'
  | 'key'
  | 'misc';

export interface ItemEffect {
  stat: string;
  modifier: number;
  duration?: number;
}

// Algorithm types
export interface AlgorithmMessage {
  id: string;
  content: string;
  timestamp: number;
  tone: AlgorithmTone;
  options?: AlgorithmOption[];
}

export type AlgorithmTone =
  | 'distant'
  | 'observant'
  | 'familiar'
  | 'intimate'
  | 'unified';

export interface AlgorithmOption {
  id: string;
  text: string;
  consequence?: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
