/**
 * Augmentation Service Types
 *
 * Database row types, filter types, and input types for the augmentation system.
 */

// =============================================================================
// CONSTANTS
// =============================================================================

export const AUGMENT_CATEGORIES = [
    'NEURAL',
    'SENSORY',
    'SKELETAL',
    'MUSCULAR',
    'DERMAL',
    'ORGAN',
    'LIMB',
    'CIRCULATORY',
    'ENDOCRINE',
    'INTERFACE',
    'COSMETIC',
    'EXPERIMENTAL',
] as const;

export type AugmentCategory = (typeof AUGMENT_CATEGORIES)[number];

// =============================================================================
// FILTER TYPES
// =============================================================================

export interface CatalogFilters {
    category?: string;
    rarity?: string;
    maxTier?: number;
    manufacturer?: string;
    bodyLocation?: string;
    limit: number;
    offset: number;
}

export interface InstallInput {
    augmentId: string;
    bodyLocationId?: string;
    installerId?: string;
    useBlackMarket: boolean;
}

export interface RemoveInput {
    surgeonId?: string;
    useBlackMarket: boolean;
}
