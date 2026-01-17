/**
 * World Clock Store - Global game time and weather state
 *
 * Manages:
 * - Game time (synced from server)
 * - Weather conditions
 * - Time-of-day effects
 */

import { signal, computed } from '@preact/signals';

// =============================================================================
// TYPES
// =============================================================================

export type TimeOfDay = 'DAWN' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'MIDNIGHT';

export type WeatherType =
  | 'CLEAR'
  | 'OVERCAST'
  | 'RAIN'
  | 'HEAVY_RAIN'
  | 'STORM'
  | 'ACID_RAIN'
  | 'SMOG'
  | 'FOG';

export interface WorldClockState {
  /** Game time in minutes since midnight of day 1 */
  gameTimeMinutes: number;
  /** Current weather */
  weather: WeatherType;
  /** Whether clock is paused */
  paused: boolean;
  /** Connection status */
  connected: boolean;
  /** Last sync timestamp */
  lastSync: number | null;
}

// =============================================================================
// STATE SIGNALS
// =============================================================================

export const gameTimeMinutes = signal<number>(0);
export const weather = signal<WeatherType>('CLEAR');
export const paused = signal<boolean>(false);
export const connected = signal<boolean>(false);
export const lastSync = signal<number | null>(null);

// =============================================================================
// COMPUTED VALUES
// =============================================================================

/** Current game day (1-indexed) */
export const gameDay = computed(() => Math.floor(gameTimeMinutes.value / 1440) + 1);

/** Current hour (0-23) */
export const gameHour = computed(() => Math.floor((gameTimeMinutes.value % 1440) / 60));

/** Current minute (0-59) */
export const gameMinute = computed(() => gameTimeMinutes.value % 60);

/** Formatted time string (HH:MM) */
export const formattedTime = computed(() => {
  const h = gameHour.value.toString().padStart(2, '0');
  const m = gameMinute.value.toString().padStart(2, '0');
  return `${h}:${m}`;
});

/** Formatted date string */
export const formattedDate = computed(() => `Day ${gameDay.value}`);

/** Time of day period */
export const timeOfDay = computed((): TimeOfDay => {
  const hour = gameHour.value;
  if (hour >= 5 && hour < 7) return 'DAWN';
  if (hour >= 7 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 20) return 'EVENING';
  if (hour >= 20 || hour < 0) return 'NIGHT';
  return 'MIDNIGHT';
});

/** Weather description for UI */
export const weatherDescription = computed(() => {
  const descriptions: Record<WeatherType, string> = {
    CLEAR: 'Clear skies',
    OVERCAST: 'Overcast',
    RAIN: 'Light rain',
    HEAVY_RAIN: 'Heavy rain',
    STORM: 'Thunderstorm',
    ACID_RAIN: 'Acid rain - stay indoors',
    SMOG: 'Heavy smog',
    FOG: 'Dense fog',
  };
  return descriptions[weather.value];
});

/** Weather icon for UI */
export const weatherIcon = computed(() => {
  const icons: Record<WeatherType, string> = {
    CLEAR: '☀',
    OVERCAST: '☁',
    RAIN: '🌧',
    HEAVY_RAIN: '🌧',
    STORM: '⛈',
    ACID_RAIN: '☢',
    SMOG: '🌫',
    FOG: '🌁',
  };
  return icons[weather.value];
});

/** Is it nighttime? */
export const isNight = computed(() => {
  const tod = timeOfDay.value;
  return tod === 'NIGHT' || tod === 'MIDNIGHT';
});

/** Is weather dangerous? */
export const isDangerousWeather = computed(() => {
  return weather.value === 'ACID_RAIN' || weather.value === 'STORM';
});

// =============================================================================
// ACTIONS
// =============================================================================

/** Update game time from server */
export function setGameTime(minutes: number): void {
  gameTimeMinutes.value = minutes;
  lastSync.value = Date.now();
}

/** Update weather from server */
export function setWeather(newWeather: WeatherType): void {
  weather.value = newWeather;
}

/** Set paused state */
export function setPaused(isPaused: boolean): void {
  paused.value = isPaused;
}

/** Set connection status */
export function setConnected(isConnected: boolean): void {
  connected.value = isConnected;
}

/** Handle server message */
export function handleWorldClockMessage(message: {
  type: string;
  payload?: unknown;
}): void {
  switch (message.type) {
    case 'TIME_UPDATE':
      if (typeof message.payload === 'object' && message.payload !== null) {
        const payload = message.payload as { gameTimeMinutes?: number; weather?: WeatherType };
        if (typeof payload.gameTimeMinutes === 'number') {
          setGameTime(payload.gameTimeMinutes);
        }
        if (payload.weather) {
          setWeather(payload.weather);
        }
      }
      break;
    case 'WEATHER_CHANGE':
      if (typeof message.payload === 'object' && message.payload !== null) {
        const payload = message.payload as { weather: WeatherType };
        setWeather(payload.weather);
      }
      break;
    case 'CLOCK_PAUSED':
      setPaused(true);
      break;
    case 'CLOCK_RESUMED':
      setPaused(false);
      break;
  }
}

// =============================================================================
// STORE EXPORT
// =============================================================================

export const worldClockStore = {
  // State
  gameTimeMinutes,
  weather,
  paused,
  connected,
  lastSync,

  // Computed
  gameDay,
  gameHour,
  gameMinute,
  formattedTime,
  formattedDate,
  timeOfDay,
  weatherDescription,
  weatherIcon,
  isNight,
  isDangerousWeather,

  // Actions
  setGameTime,
  setWeather,
  setPaused,
  setConnected,
  handleWorldClockMessage,
};

export default worldClockStore;
