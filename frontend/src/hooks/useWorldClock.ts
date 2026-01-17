/**
 * useWorldClock - Hook for world clock WebSocket connection
 *
 * Connects to the WorldClock Durable Object and keeps time/weather synced.
 */

import { useWebSocket } from './useWebSocket';
import {
  worldClockStore,
  handleWorldClockMessage,
  setConnected,
} from '@/stores/worldClockStore';

// =============================================================================
// CONFIGURATION
// =============================================================================

function getWorldClockUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws/world`;
}

// =============================================================================
// HOOK
// =============================================================================

export function useWorldClock() {
  const { state, isConnected } = useWebSocket({
    url: getWorldClockUrl(),
    autoReconnect: true,
    maxReconnectAttempts: 10,
    reconnectDelay: 2000,
    pingInterval: 30000,

    onMessage: (data) => {
      if (typeof data === 'object' && data !== null && 'type' in data) {
        handleWorldClockMessage(data as { type: string; payload?: unknown });
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

  return {
    // Connection state
    connectionState: state,
    isConnected,

    // Time data
    gameTimeMinutes: worldClockStore.gameTimeMinutes,
    gameDay: worldClockStore.gameDay,
    gameHour: worldClockStore.gameHour,
    gameMinute: worldClockStore.gameMinute,
    formattedTime: worldClockStore.formattedTime,
    formattedDate: worldClockStore.formattedDate,
    timeOfDay: worldClockStore.timeOfDay,
    isNight: worldClockStore.isNight,

    // Weather data
    weather: worldClockStore.weather,
    weatherDescription: worldClockStore.weatherDescription,
    weatherIcon: worldClockStore.weatherIcon,
    isDangerousWeather: worldClockStore.isDangerousWeather,

    // Status
    paused: worldClockStore.paused,
    lastSync: worldClockStore.lastSync,
  };
}

export default useWorldClock;
