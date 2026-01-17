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
  | 'worn-chrome'
  | 'blood-circuit'
  | 'ghost-protocol';

// Character types
export interface Character {
  id: string;
  name: string;
  alias: string;
  level: number;
  hp: { current: number; max: number };
  humanity: { current: number; max: number };
  xp: { current: number; toNextLevel: number };
  credits: number;
  reputation: {
    algorithm: number;
    street: number;
    corporate: number;
  };
  attributes: Attributes;
  augmentations: Augmentation[];
  location?: Location;
}

export interface Attributes {
  reflex: number;
  tech: number;
  cool: number;
  body: number;
  empathy: number;
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
  reward: MissionReward;
  origin?: Location;
  destination?: Location;
}

export type MissionType =
  | 'delivery'
  | 'extraction'
  | 'infiltration'
  | 'sabotage'
  | 'courier'
  | 'escort';

export type MissionStatus =
  | 'available'
  | 'active'
  | 'completed'
  | 'failed'
  | 'abandoned';

export type MissionDifficulty =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'extreme';

export interface MissionReward {
  credits: number;
  xp?: number;
  reputation?: number;
  items?: string[];
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
  timestamp: string | Date;
  tone: AlgorithmTone;
  acknowledged: boolean;
  options?: AlgorithmOption[];
}

export type AlgorithmTone =
  | 'neutral'
  | 'approving'
  | 'disappointed'
  | 'urgent'
  | 'cryptic'
  | 'threatening';

export interface AlgorithmOption {
  id: string;
  text: string;
  consequence?: string;
}

// Quick Action type (for UI)
export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'primary' | 'danger' | 'warning' | 'success';
  disabled?: boolean;
  onClick: () => void;
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
