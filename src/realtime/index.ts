/**
 * Surge Protocol - Realtime Systems
 *
 * Durable Objects for real-time game state management.
 */

export { CombatSession } from './combat';
export type {
  CombatPhase,
  CombatEndReason,
  CombatActionType,
  CombatState,
  ActionLogEntry,
} from './combat';

export { WorldClock, WEATHER_EFFECTS, TIME_PERIODS } from './world';
export type {
  TimeOfDay,
  WeatherType,
  WeatherEffects,
  ScheduledEvent,
  WorldClockState,
} from './world';
