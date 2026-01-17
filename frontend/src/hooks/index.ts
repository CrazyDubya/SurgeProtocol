/**
 * Hooks - Custom hooks for data fetching and state management
 */

export { useCharacterData } from './useCharacterData';
export { useMissionData } from './useMissionData';
export { useInventoryData } from './useInventoryData';

// WebSocket hooks for real-time features
export { useWebSocket } from './useWebSocket';
export type { WebSocketOptions, WebSocketHook, WebSocketState } from './useWebSocket';

export { useWorldClock } from './useWorldClock';
export { useCombat } from './useCombat';
export type { CombatAction } from './useCombat';

export { useWarTheater } from './useWarTheater';
