/**
 * World Clock Store Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  gameTimeMinutes,
  weather,
  paused,
  connected,
  lastSync,
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
  setGameTime,
  setWeather,
  setPaused,
  setConnected,
  handleWorldClockMessage,
  type WeatherType,
} from './worldClockStore';

describe('World Clock Store', () => {
  beforeEach(() => {
    // Reset store state
    gameTimeMinutes.value = 0;
    weather.value = 'CLEAR';
    paused.value = false;
    connected.value = false;
    lastSync.value = null;
  });

  describe('Time Management', () => {
    it('should set game time', () => {
      setGameTime(720); // 12:00 noon
      expect(gameTimeMinutes.value).toBe(720);
      expect(lastSync.value).not.toBeNull();
    });

    it('should calculate game day (1-indexed)', () => {
      // Day 1 starts at minute 0
      setGameTime(0);
      expect(gameDay.value).toBe(1);

      // Day 2 starts at minute 1440
      setGameTime(1440);
      expect(gameDay.value).toBe(2);

      // Day 3 at minute 3000
      setGameTime(3000);
      expect(gameDay.value).toBe(3);
    });

    it('should calculate game hour (0-23)', () => {
      setGameTime(0); // midnight
      expect(gameHour.value).toBe(0);

      setGameTime(720); // noon
      expect(gameHour.value).toBe(12);

      setGameTime(1380); // 11pm
      expect(gameHour.value).toBe(23);
    });

    it('should calculate game minute (0-59)', () => {
      setGameTime(0);
      expect(gameMinute.value).toBe(0);

      setGameTime(45);
      expect(gameMinute.value).toBe(45);

      setGameTime(725); // 12:05
      expect(gameMinute.value).toBe(5);
    });

    it('should format time correctly', () => {
      setGameTime(0);
      expect(formattedTime.value).toBe('00:00');

      setGameTime(615); // 10:15
      expect(formattedTime.value).toBe('10:15');

      setGameTime(1395); // 23:15
      expect(formattedTime.value).toBe('23:15');
    });

    it('should format date correctly', () => {
      setGameTime(0);
      expect(formattedDate.value).toBe('Day 1');

      setGameTime(2880); // Day 3
      expect(formattedDate.value).toBe('Day 3');
    });
  });

  describe('Time of Day', () => {
    it('should return MIDNIGHT for 00:00-05:00', () => {
      setGameTime(0); // 00:00
      expect(timeOfDay.value).toBe('MIDNIGHT');

      setGameTime(240); // 04:00
      expect(timeOfDay.value).toBe('MIDNIGHT');
    });

    it('should return DAWN for 05:00-07:00', () => {
      setGameTime(300); // 05:00
      expect(timeOfDay.value).toBe('DAWN');

      setGameTime(390); // 06:30
      expect(timeOfDay.value).toBe('DAWN');
    });

    it('should return MORNING for 07:00-12:00', () => {
      setGameTime(420); // 07:00
      expect(timeOfDay.value).toBe('MORNING');

      setGameTime(600); // 10:00
      expect(timeOfDay.value).toBe('MORNING');
    });

    it('should return AFTERNOON for 12:00-17:00', () => {
      setGameTime(720); // 12:00
      expect(timeOfDay.value).toBe('AFTERNOON');

      setGameTime(900); // 15:00
      expect(timeOfDay.value).toBe('AFTERNOON');
    });

    it('should return EVENING for 17:00-20:00', () => {
      setGameTime(1020); // 17:00
      expect(timeOfDay.value).toBe('EVENING');

      setGameTime(1140); // 19:00
      expect(timeOfDay.value).toBe('EVENING');
    });

    it('should return NIGHT for 20:00-24:00', () => {
      setGameTime(1260); // 21:00
      expect(timeOfDay.value).toBe('NIGHT');

      setGameTime(1400); // 23:20
      expect(timeOfDay.value).toBe('NIGHT');
    });
  });

  describe('Weather Management', () => {
    it('should set weather', () => {
      setWeather('RAIN');
      expect(weather.value).toBe('RAIN');
    });

    it('should provide weather description', () => {
      setWeather('CLEAR');
      expect(weatherDescription.value).toBe('Clear skies');

      setWeather('ACID_RAIN');
      expect(weatherDescription.value).toBe('Acid rain - stay indoors');
    });

    it('should provide weather icon', () => {
      setWeather('CLEAR');
      expect(weatherIcon.value).toBe('☀');

      setWeather('STORM');
      expect(weatherIcon.value).toBe('⛈');
    });

    it('should detect dangerous weather', () => {
      setWeather('CLEAR');
      expect(isDangerousWeather.value).toBe(false);

      setWeather('ACID_RAIN');
      expect(isDangerousWeather.value).toBe(true);

      setWeather('STORM');
      expect(isDangerousWeather.value).toBe(true);
    });

    it('should detect all weather types', () => {
      const weatherTypes: WeatherType[] = [
        'CLEAR', 'OVERCAST', 'RAIN', 'HEAVY_RAIN',
        'STORM', 'ACID_RAIN', 'SMOG', 'FOG',
      ];

      weatherTypes.forEach((type) => {
        setWeather(type);
        expect(weather.value).toBe(type);
        expect(weatherDescription.value).toBeTruthy();
        expect(weatherIcon.value).toBeTruthy();
      });
    });
  });

  describe('Night Detection', () => {
    it('should return true for NIGHT time', () => {
      setGameTime(1300); // 21:40
      expect(isNight.value).toBe(true);
    });

    it('should return true for MIDNIGHT time', () => {
      setGameTime(120); // 02:00
      expect(isNight.value).toBe(true);
    });

    it('should return false for daytime', () => {
      setGameTime(720); // 12:00
      expect(isNight.value).toBe(false);
    });
  });

  describe('Pause State', () => {
    it('should set paused state', () => {
      expect(paused.value).toBe(false);
      setPaused(true);
      expect(paused.value).toBe(true);
    });
  });

  describe('Connection State', () => {
    it('should set connected state', () => {
      expect(connected.value).toBe(false);
      setConnected(true);
      expect(connected.value).toBe(true);
    });
  });

  describe('Message Handling', () => {
    it('should handle TIME_UPDATE message', () => {
      handleWorldClockMessage({
        type: 'TIME_UPDATE',
        payload: {
          gameTimeMinutes: 840,
          weather: 'RAIN',
        },
      });

      expect(gameTimeMinutes.value).toBe(840);
      expect(weather.value).toBe('RAIN');
    });

    it('should handle TIME_UPDATE with only time', () => {
      setWeather('CLEAR');
      handleWorldClockMessage({
        type: 'TIME_UPDATE',
        payload: {
          gameTimeMinutes: 500,
        },
      });

      expect(gameTimeMinutes.value).toBe(500);
      expect(weather.value).toBe('CLEAR'); // Unchanged
    });

    it('should handle WEATHER_CHANGE message', () => {
      handleWorldClockMessage({
        type: 'WEATHER_CHANGE',
        payload: { weather: 'FOG' },
      });

      expect(weather.value).toBe('FOG');
    });

    it('should handle CLOCK_PAUSED message', () => {
      handleWorldClockMessage({ type: 'CLOCK_PAUSED' });
      expect(paused.value).toBe(true);
    });

    it('should handle CLOCK_RESUMED message', () => {
      setPaused(true);
      handleWorldClockMessage({ type: 'CLOCK_RESUMED' });
      expect(paused.value).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle day boundary correctly', () => {
      setGameTime(1439); // 23:59
      expect(gameDay.value).toBe(1);
      expect(gameHour.value).toBe(23);
      expect(gameMinute.value).toBe(59);

      setGameTime(1440); // 00:00 Day 2
      expect(gameDay.value).toBe(2);
      expect(gameHour.value).toBe(0);
      expect(gameMinute.value).toBe(0);
    });

    it('should handle time across multiple days', () => {
      setGameTime(4320); // Day 4, 00:00
      expect(gameDay.value).toBe(4);
      expect(formattedTime.value).toBe('00:00');
    });
  });
});
