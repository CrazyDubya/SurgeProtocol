/**
 * Surge Protocol - Worldstate Service
 *
 * Manages weather conditions and in-game time state.
 */

import { BaseService } from '../base/index';

// =============================================================================
// TYPES
// =============================================================================

function parseJsonField<T>(value: unknown, defaultValue: T): T {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'string') { try { return JSON.parse(value) as T; } catch { return defaultValue; } }
    return value as T;
}

export interface WeatherCondition {
    id: string; code: string; name: string; description: string | null;
    weatherType: string | null; severity: number; isHazardous: boolean;
    visibilityModifier: number; speedModifier: number; handlingModifier: number;
    stealthModifier: number; damagePerMinute: number;
    specialEquipmentNeeded: string[] | null;
    vehicleRequirements: Record<string, unknown> | null;
    createdAt: string; updatedAt: string;
}

export interface GameTimeState {
    id: string; saveId: string | null; currentTimestamp: string | null;
    currentDayOfWeek: number; currentHour: number; currentMinute: number;
    currentDay: number; currentMonth: number; currentYear: number;
    daysElapsed: number; timeOfDay: string; isRushHour: boolean; isNight: boolean;
    timeScale: number; timePaused: boolean; createdAt: string; updatedAt: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function mapRowToWeather(row: Record<string, unknown>): WeatherCondition {
    return {
        id: row.id as string, code: row.code as string, name: row.name as string,
        description: row.description as string | null, weatherType: row.weather_type as string | null,
        severity: row.severity as number, isHazardous: (row.is_hazardous as number) === 1,
        visibilityModifier: row.visibility_modifier as number, speedModifier: row.speed_modifier as number,
        handlingModifier: row.handling_modifier as number, stealthModifier: row.stealth_modifier as number,
        damagePerMinute: row.damage_per_minute as number,
        specialEquipmentNeeded: parseJsonField<string[] | null>(row.special_equipment_needed, null),
        vehicleRequirements: parseJsonField<Record<string, unknown> | null>(row.vehicle_requirements, null),
        createdAt: row.created_at as string, updatedAt: row.updated_at as string,
    };
}

function mapRowToTimeState(row: Record<string, unknown>): GameTimeState {
    return {
        id: row.id as string, saveId: row.save_id as string | null,
        currentTimestamp: row.current_timestamp as string | null,
        currentDayOfWeek: row.current_day_of_week as number, currentHour: row.current_hour as number,
        currentMinute: row.current_minute as number, currentDay: row.current_day as number,
        currentMonth: row.current_month as number, currentYear: row.current_year as number,
        daysElapsed: row.days_elapsed as number, timeOfDay: row.time_of_day as string,
        isRushHour: (row.is_rush_hour as number) === 1, isNight: (row.is_night as number) === 1,
        timeScale: row.time_scale as number, timePaused: (row.time_paused as number) === 1,
        createdAt: row.created_at as string, updatedAt: row.updated_at as string,
    };
}

function getTimeOfDay(hour: number): string {
    if (hour >= 5 && hour < 9) return 'MORNING';
    if (hour >= 9 && hour < 12) return 'LATE_MORNING';
    if (hour >= 12 && hour < 14) return 'NOON';
    if (hour >= 14 && hour < 17) return 'AFTERNOON';
    if (hour >= 17 && hour < 20) return 'EVENING';
    if (hour >= 20 && hour < 23) return 'NIGHT';
    return 'LATE_NIGHT';
}

// =============================================================================
// WORLDSTATE SERVICE
// =============================================================================

export class WorldstateService extends BaseService {

    // ---------------------------------------------------------------------------
    // WEATHER CONDITIONS
    // ---------------------------------------------------------------------------

    async listWeather(opts: { type?: string; hazardousOnly?: boolean }) {
        let query = 'SELECT * FROM weather_conditions WHERE 1=1';
        const params: unknown[] = [];
        if (opts.type) { query += ' AND weather_type = ?'; params.push(opts.type); }
        if (opts.hazardousOnly) query += ' AND is_hazardous = 1';
        query += ' ORDER BY severity DESC, name ASC';
        const result = await this.db.prepare(query).bind(...params).all();
        const conditions = result.results.map(r => mapRowToWeather(r as Record<string, unknown>));
        return { conditions, total: conditions.length };
    }

    async getWeather(code: string): Promise<WeatherCondition | null> {
        const result = await this.db.prepare('SELECT * FROM weather_conditions WHERE code = ?').bind(code).first();
        if (!result) return null;
        return mapRowToWeather(result as Record<string, unknown>);
    }

    async createWeather(body: Record<string, unknown>): Promise<{ id: string; code: string }> {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.prepare(
            `INSERT INTO weather_conditions (id, code, name, description, weather_type, severity, is_hazardous, visibility_modifier, speed_modifier, handling_modifier, stealth_modifier, damage_per_minute, special_equipment_needed, vehicle_requirements, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, body.code, body.name, body.description || null, body.weatherType || null,
            body.severity || 1, body.isHazardous ? 1 : 0, body.visibilityModifier || 1.0,
            body.speedModifier || 1.0, body.handlingModifier || 1.0, body.stealthModifier || 1.0,
            body.damagePerMinute || 0,
            body.specialEquipmentNeeded ? JSON.stringify(body.specialEquipmentNeeded) : null,
            body.vehicleRequirements ? JSON.stringify(body.vehicleRequirements) : null,
            now, now).run();
        return { id, code: body.code as string };
    }

    async calculateWeatherEffects(code: string, body: Record<string, unknown>) {
        const result = await this.db.prepare('SELECT * FROM weather_conditions WHERE code = ?').bind(code).first();
        if (!result) return null;

        const baseSpeed = (body.baseSpeed as number) || 100;
        const baseVisibility = (body.baseVisibility as number) || 100;
        const baseStealth = (body.baseStealth as number) || 50;
        const exposureMinutes = (body.exposureMinutes as number) || 0;

        const specialEquipment = parseJsonField<string[] | null>(result.special_equipment_needed, null);
        const equipment = body.equipment as string[] | undefined;
        const hasRequiredEquipment = equipment ? !specialEquipment || specialEquipment.every((eq: string) => equipment.includes(eq)) : !specialEquipment;

        return {
            weatherCode: code,
            effects: {
                effectiveSpeed: Math.round(baseSpeed * (result.speed_modifier as number) * 10) / 10,
                effectiveVisibility: Math.round(baseVisibility * (result.visibility_modifier as number) * 10) / 10,
                effectiveStealth: Math.round(baseStealth * (result.stealth_modifier as number) * 10) / 10,
                handlingPenalty: Math.round((1 - (result.handling_modifier as number)) * 100),
                damageFromExposure: exposureMinutes * (result.damage_per_minute as number),
            },
            warnings: {
                isHazardous: (result.is_hazardous as number) === 1,
                requiresSpecialEquipment: !!specialEquipment,
                hasRequiredEquipment,
                missingEquipment: hasRequiredEquipment ? [] : (specialEquipment || []).filter((eq: string) => !equipment?.includes(eq)),
            },
        };
    }

    // ---------------------------------------------------------------------------
    // GAME TIME STATE
    // ---------------------------------------------------------------------------

    async getTime(saveId?: string) {
        let result;
        if (saveId) {
            result = await this.db.prepare('SELECT * FROM game_time_state WHERE save_id = ?').bind(saveId).first();
        } else {
            result = await this.db.prepare('SELECT * FROM game_time_state WHERE save_id IS NULL ORDER BY updated_at DESC LIMIT 1').first();
        }
        if (!result) {
            return { timeState: null, default: { currentHour: 8, currentMinute: 0, currentDay: 1, currentMonth: 1, currentYear: 2087, timeOfDay: 'MORNING', isRushHour: true, isNight: false } };
        }
        return { timeState: mapRowToTimeState(result as Record<string, unknown>) };
    }

    async createTime(body: Record<string, unknown>): Promise<string> {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const hour = (body.currentHour as number) || 8;
        const timeOfDay = getTimeOfDay(hour);
        const isNight = hour >= 20 || hour < 5;
        const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
        await this.db.prepare(
            `INSERT INTO game_time_state (id, save_id, current_timestamp, current_day_of_week, current_hour, current_minute, current_day, current_month, current_year, days_elapsed, time_of_day, is_rush_hour, is_night, time_scale, time_paused, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, body.saveId || null, body.currentTimestamp || now, body.currentDayOfWeek || 0,
            hour, body.currentMinute || 0, body.currentDay || 1, body.currentMonth || 1, body.currentYear || 2087,
            body.daysElapsed || 0, timeOfDay, isRushHour ? 1 : 0, isNight ? 1 : 0,
            body.timeScale || 1.0, body.timePaused ? 1 : 0, now, now).run();
        return id;
    }

    async advanceTime(id: string, minutes: number) {
        const current = await this.db.prepare('SELECT * FROM game_time_state WHERE id = ?').bind(id).first();
        if (!current) throw new Error('Time state not found');
        if ((current.time_paused as number) === 1) return { paused: true };

        let newMinute = (current.current_minute as number) + minutes;
        let newHour = current.current_hour as number;
        let newDay = current.current_day as number;
        let newMonth = current.current_month as number;
        let newYear = current.current_year as number;
        let newDayOfWeek = current.current_day_of_week as number;
        let daysElapsed = current.days_elapsed as number;

        while (newMinute >= 60) { newMinute -= 60; newHour++; }
        while (newHour >= 24) { newHour -= 24; newDay++; newDayOfWeek = (newDayOfWeek + 1) % 7; daysElapsed++; }
        while (newDay > 30) { newDay -= 30; newMonth++; }
        while (newMonth > 12) { newMonth -= 12; newYear++; }

        const timeOfDay = getTimeOfDay(newHour);
        const isNight = newHour >= 20 || newHour < 5;
        const isRushHour = (newHour >= 7 && newHour <= 9) || (newHour >= 17 && newHour <= 19);

        await this.db.prepare(
            `UPDATE game_time_state SET current_minute = ?, current_hour = ?, current_day = ?, current_month = ?, current_year = ?, current_day_of_week = ?, days_elapsed = ?, time_of_day = ?, is_rush_hour = ?, is_night = ?, updated_at = ? WHERE id = ?`
        ).bind(newMinute, newHour, newDay, newMonth, newYear, newDayOfWeek, daysElapsed, timeOfDay, isRushHour ? 1 : 0, isNight ? 1 : 0, new Date().toISOString(), id).run();

        return { newTime: { hour: newHour, minute: newMinute, day: newDay, month: newMonth, year: newYear, dayOfWeek: newDayOfWeek, daysElapsed, timeOfDay, isRushHour, isNight }, advanced: { minutes } };
    }

    async pauseTime(id: string, paused: boolean) {
        await this.db.prepare('UPDATE game_time_state SET time_paused = ?, updated_at = ? WHERE id = ?').bind(paused ? 1 : 0, new Date().toISOString(), id).run();
    }

    async setTimeScale(id: string, scale: number) {
        const clamped = Math.max(0.1, Math.min(10, scale));
        await this.db.prepare('UPDATE game_time_state SET time_scale = ?, updated_at = ? WHERE id = ?').bind(clamped, new Date().toISOString(), id).run();
        return clamped;
    }

    getTimeCycles() {
        return {
            timeOfDayCycles: [
                { name: 'LATE_NIGHT', startHour: 0, endHour: 5, description: 'Dead of night, minimal activity' },
                { name: 'MORNING', startHour: 5, endHour: 9, description: 'Early morning, city waking up' },
                { name: 'LATE_MORNING', startHour: 9, endHour: 12, description: 'Business hours begin' },
                { name: 'NOON', startHour: 12, endHour: 14, description: 'Midday, lunch rush' },
                { name: 'AFTERNOON', startHour: 14, endHour: 17, description: 'Peak business hours' },
                { name: 'EVENING', startHour: 17, endHour: 20, description: 'Rush hour, nightlife begins' },
                { name: 'NIGHT', startHour: 20, endHour: 24, description: 'Night scene active' },
            ],
            rushHours: [
                { startHour: 7, endHour: 9, type: 'MORNING', trafficMultiplier: 1.5 },
                { startHour: 17, endHour: 19, type: 'EVENING', trafficMultiplier: 1.8 },
            ],
            nightHours: { startHour: 20, endHour: 5 },
            daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        };
    }
}
