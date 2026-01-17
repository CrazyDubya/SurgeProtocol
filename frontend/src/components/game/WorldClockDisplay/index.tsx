/**
 * WorldClockDisplay - Real-time game clock and weather display
 *
 * Shows current game time, day, weather conditions, and connection status.
 * Designed for header/nav integration.
 */

import { useWorldClock } from '@/hooks/useWorldClock';
import styles from './WorldClockDisplay.module.css';

export interface WorldClockDisplayProps {
  compact?: boolean;
  showWeather?: boolean;
  class?: string;
}

export function WorldClockDisplay({
  compact = false,
  showWeather = true,
  class: className,
}: WorldClockDisplayProps) {
  const {
    formattedTime,
    formattedDate,
    timeOfDay,
    isNight,
    weatherDescription,
    weatherIcon,
    isDangerousWeather,
    paused,
    isConnected,
  } = useWorldClock();

  const classes = [
    styles.clock,
    compact && styles.compact,
    isNight.value && styles.night,
    isDangerousWeather.value && styles.dangerous,
    !isConnected && styles.disconnected,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={classes}>
      {/* Connection indicator */}
      <span
        class={`${styles.connection} ${isConnected ? styles.connected : ''}`}
        title={isConnected ? 'Connected' : 'Disconnected'}
      />

      {/* Time display */}
      <div class={styles.time}>
        <span class={styles.timeValue}>{formattedTime.value}</span>
        {!compact && (
          <span class={styles.timeOfDay}>{timeOfDay.value.toLowerCase()}</span>
        )}
      </div>

      {/* Date display */}
      <div class={styles.date}>
        <span class={styles.dateValue}>{formattedDate.value}</span>
        {paused.value && <span class={styles.paused}>PAUSED</span>}
      </div>

      {/* Weather display */}
      {showWeather && (
        <div
          class={`${styles.weather} ${isDangerousWeather.value ? styles.warning : ''}`}
          title={weatherDescription.value}
        >
          <span class={styles.weatherIcon}>{weatherIcon.value}</span>
          {!compact && (
            <span class={styles.weatherText}>{weatherDescription.value}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Minimal clock for tight spaces
 */
export function WorldClockMini() {
  const { formattedTime, weatherIcon, isConnected, isDangerousWeather } =
    useWorldClock();

  return (
    <div class={styles.mini}>
      <span
        class={`${styles.miniConnection} ${isConnected ? styles.connected : ''}`}
      />
      <span class={styles.miniTime}>{formattedTime.value}</span>
      <span
        class={`${styles.miniWeather} ${isDangerousWeather.value ? styles.warning : ''}`}
      >
        {weatherIcon.value}
      </span>
    </div>
  );
}

export default WorldClockDisplay;
