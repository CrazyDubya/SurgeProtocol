/**
 * Surge Protocol - Database Module
 */

// Types
export * from './types';

// Query utilities
export {
  // Helpers
  batch,
  generateId,

  // Character
  getCharacter,
  getCharacterByPlayer,
  getCharacterByHandle,
  createCharacter,
  updateCharacterLocation,
  updateCharacterHealth,
  updateCharacterHumanity,
  updateCharacterRating,
  addCharacterXP,

  // Attributes
  getCharacterAttributes,
  getEffectiveAttribute,

  // Missions
  getMission,
  getAvailableMissions,
  getActiveMission,
  acceptMission,
  createMissionInstance,
  updateMissionStatus,

  // Factions
  getAllFactions,
  getFactionReputation,
  updateFactionReputation,

  // Inventory
  getCharacterInventory,
  addToInventory,
  removeFromInventory,

  // Rating
  getRatingComponents,
  updateRatingComponents,

  // Leaderboards
  getTopCarriers,
} from './queries';
