/**
 * useWarTheater - Hook for war theater WebSocket connection
 *
 * Connects to the WarTheater Durable Object for real-time faction war updates.
 */

import { useCallback } from 'preact/hooks';
import { useWebSocket } from './useWebSocket';
import {
  warTheaterStore,
  handleWarTheaterMessage,
  setConnected,
  selectTerritory,
  selectWar,
} from '@/stores/warTheaterStore';

// =============================================================================
// CONFIGURATION
// =============================================================================

function getWarTheaterUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws/war`;
}

// =============================================================================
// HOOK
// =============================================================================

export function useWarTheater() {
  const { state, send, isConnected } = useWebSocket({
    url: getWarTheaterUrl(),
    autoReconnect: true,
    maxReconnectAttempts: 10,
    reconnectDelay: 2000,
    pingInterval: 30000,

    onMessage: (data) => {
      if (typeof data === 'object' && data !== null && 'type' in data) {
        handleWarTheaterMessage(data as { type: string; payload?: unknown });
      }
    },

    onOpen: () => {
      setConnected(true);
    },

    onClose: () => {
      setConnected(false);
    },

    onError: () => {
      setConnected(false);
    },
  });

  // Support a faction in territory contest
  const supportFaction = useCallback(
    (factionId: string, territoryId: string): boolean => {
      if (!isConnected) return false;
      return send({
        type: 'SUPPORT_FACTION',
        payload: { factionId, territoryId },
      });
    },
    [isConnected, send]
  );

  // Contribute resources to a faction
  const contributeResources = useCallback(
    (factionId: string, amount: number): boolean => {
      if (!isConnected) return false;
      return send({
        type: 'CONTRIBUTE_RESOURCES',
        payload: { factionId, amount },
      });
    },
    [isConnected, send]
  );

  // Request detailed info about a territory
  const requestTerritoryDetails = useCallback(
    (territoryId: string): boolean => {
      if (!isConnected) return false;
      selectTerritory(territoryId);
      return send({
        type: 'GET_TERRITORY_DETAILS',
        payload: { territoryId },
      });
    },
    [isConnected, send]
  );

  // Request detailed info about a war
  const requestWarDetails = useCallback(
    (warId: string): boolean => {
      if (!isConnected) return false;
      selectWar(warId);
      return send({
        type: 'GET_WAR_DETAILS',
        payload: { warId },
      });
    },
    [isConnected, send]
  );

  return {
    // Connection
    connectionState: state,
    isConnected,

    // War theater state
    factions: warTheaterStore.factions,
    territories: warTheaterStore.territories,
    wars: warTheaterStore.wars,
    events: warTheaterStore.events,
    playerContribution: warTheaterStore.playerContribution,
    selectedTerritory: warTheaterStore.selectedTerritory,
    selectedWar: warTheaterStore.selectedWar,

    // Computed
    activeWars: warTheaterStore.activeWars,
    brewingWars: warTheaterStore.brewingWars,
    contestedTerritories: warTheaterStore.contestedTerritories,
    territoriesByFaction: warTheaterStore.territoriesByFaction,
    factionRankings: warTheaterStore.factionRankings,
    recentEvents: warTheaterStore.recentEvents,
    criticalEvents: warTheaterStore.criticalEvents,
    selectedTerritoryDetails: warTheaterStore.selectedTerritoryDetails,
    selectedWarDetails: warTheaterStore.selectedWarDetails,

    // Helpers
    getFaction: warTheaterStore.getFaction,

    // Selection
    selectTerritory,
    selectWar,

    // Actions
    supportFaction,
    contributeResources,
    requestTerritoryDetails,
    requestWarDetails,
  };
}

export default useWarTheater;
