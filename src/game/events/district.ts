/**
 * Surge Protocol - District Events System
 *
 * Dynamic events that affect districts and gameplay:
 * - Route difficulty modifications
 * - NPC availability changes
 * - Shop price adjustments
 * - Mission availability
 * - Environmental hazards
 */

// =============================================================================
// TYPES
// =============================================================================

export type EventType =
  | 'GANG_ACTIVITY'       // Gang presence increased
  | 'POLICE_RAID'         // Heavy police presence
  | 'CORPORATE_LOCKDOWN'  // Corp security sweep
  | 'STREET_FESTIVAL'     // Crowds, slower travel
  | 'POWER_OUTAGE'        // Systems down, security disabled
  | 'TRAFFIC_JAM'         // Major congestion
  | 'WEATHER_HAZARD'      // Dangerous weather
  | 'PROTEST'             // Civil unrest
  | 'BLACK_MARKET'        // Temporary black market
  | 'BOUNTY_HUNT'         // Increased danger
  | 'CORPORATE_WAR'       // Active corp conflict
  | 'TECH_FAIR'           // Discounts on tech
  | 'MEDICAL_EMERGENCY'   // Hospitals overwhelmed
  | 'CURFEW'              // Movement restricted
  | 'CELEBRITY_SIGHTING'; // Crowds gathering

export type EventSeverity = 'minor' | 'moderate' | 'major' | 'critical';

export interface EventModifier {
  type: 'ROUTE_TIME' | 'ROUTE_DANGER' | 'SHOP_PRICE' | 'NPC_AVAILABILITY' | 'MISSION_REWARD' | 'DETECTION_RISK';
  value: number;  // Multiplier (1.0 = no change, 1.5 = +50%, 0.5 = -50%)
  target?: string; // Specific route, shop, or NPC ID
}

export interface DistrictEvent {
  id: string;
  type: EventType;
  districtId: string;
  severity: EventSeverity;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  modifiers: EventModifier[];
  affectedLocations?: string[];
  triggerConditions?: EventTrigger[];
  chainEvents?: string[];  // Events that may follow
  isHidden?: boolean;      // Not shown until discovered
}

export interface EventTrigger {
  type: 'TIME_BASED' | 'PLAYER_ACTION' | 'RANDOM' | 'FACTION_STATE' | 'WEATHER';
  probability?: number;
  conditions?: Record<string, unknown>;
}

export interface DistrictState {
  districtId: string;
  activeEvents: DistrictEvent[];
  eventHistory: Array<{ eventId: string; endTime: Date }>;
  baseModifiers: EventModifier[];
}

// =============================================================================
// EVENT DEFINITIONS
// =============================================================================

export const EVENT_TEMPLATES: Record<EventType, Omit<DistrictEvent, 'id' | 'districtId' | 'startTime' | 'endTime'>> = {
  GANG_ACTIVITY: {
    type: 'GANG_ACTIVITY',
    severity: 'moderate',
    name: 'Gang Activity',
    description: 'Increased gang presence in the area. Watch your back.',
    modifiers: [
      { type: 'ROUTE_DANGER', value: 1.5 },
      { type: 'DETECTION_RISK', value: 0.8 },  // Less corporate surveillance
    ],
  },
  POLICE_RAID: {
    type: 'POLICE_RAID',
    severity: 'major',
    name: 'Police Raid',
    description: 'Civic Guard conducting sweeps. Avoid attention.',
    modifiers: [
      { type: 'ROUTE_TIME', value: 1.3 },
      { type: 'DETECTION_RISK', value: 1.8 },
      { type: 'NPC_AVAILABILITY', value: 0.5 },
    ],
  },
  CORPORATE_LOCKDOWN: {
    type: 'CORPORATE_LOCKDOWN',
    severity: 'major',
    name: 'Corporate Lockdown',
    description: 'OmniDeliver security sweep in progress. Access restricted.',
    modifiers: [
      { type: 'ROUTE_TIME', value: 1.5 },
      { type: 'DETECTION_RISK', value: 2.0 },
      { type: 'SHOP_PRICE', value: 1.2 },
    ],
  },
  STREET_FESTIVAL: {
    type: 'STREET_FESTIVAL',
    severity: 'minor',
    name: 'Street Festival',
    description: 'Crowds celebrating. Slower travel but good vibes.',
    modifiers: [
      { type: 'ROUTE_TIME', value: 1.4 },
      { type: 'ROUTE_DANGER', value: 0.7 },
      { type: 'SHOP_PRICE', value: 0.9 },
      { type: 'NPC_AVAILABILITY', value: 1.3 },
    ],
  },
  POWER_OUTAGE: {
    type: 'POWER_OUTAGE',
    severity: 'moderate',
    name: 'Power Outage',
    description: 'Grid failure. Security systems offline, but so are the lights.',
    modifiers: [
      { type: 'DETECTION_RISK', value: 0.3 },
      { type: 'ROUTE_DANGER', value: 1.4 },
      { type: 'NPC_AVAILABILITY', value: 0.6 },
    ],
  },
  TRAFFIC_JAM: {
    type: 'TRAFFIC_JAM',
    severity: 'minor',
    name: 'Traffic Congestion',
    description: 'Major accident causing gridlock. Find alternate routes.',
    modifiers: [
      { type: 'ROUTE_TIME', value: 2.0 },
    ],
  },
  WEATHER_HAZARD: {
    type: 'WEATHER_HAZARD',
    severity: 'moderate',
    name: 'Hazardous Weather',
    description: 'Acid rain warning. Seek shelter or suffer damage.',
    modifiers: [
      { type: 'ROUTE_TIME', value: 1.3 },
      { type: 'ROUTE_DANGER', value: 1.3 },
      { type: 'NPC_AVAILABILITY', value: 0.4 },
    ],
  },
  PROTEST: {
    type: 'PROTEST',
    severity: 'moderate',
    name: 'Civil Protest',
    description: 'Workers demonstrating against corporate policies.',
    modifiers: [
      { type: 'ROUTE_TIME', value: 1.5 },
      { type: 'DETECTION_RISK', value: 0.6 },
      { type: 'ROUTE_DANGER', value: 1.2 },
    ],
  },
  BLACK_MARKET: {
    type: 'BLACK_MARKET',
    severity: 'minor',
    name: 'Pop-Up Market',
    description: 'Temporary black market. Rare goods available.',
    modifiers: [
      { type: 'SHOP_PRICE', value: 0.7 },
      { type: 'DETECTION_RISK', value: 1.3 },
    ],
  },
  BOUNTY_HUNT: {
    type: 'BOUNTY_HUNT',
    severity: 'major',
    name: 'Active Bounty',
    description: 'Bounty hunters in the area. Everyone\'s a suspect.',
    modifiers: [
      { type: 'ROUTE_DANGER', value: 1.8 },
      { type: 'DETECTION_RISK', value: 1.4 },
    ],
  },
  CORPORATE_WAR: {
    type: 'CORPORATE_WAR',
    severity: 'critical',
    name: 'Corporate Conflict',
    description: 'Active combat between corporate forces. Extremely dangerous.',
    modifiers: [
      { type: 'ROUTE_DANGER', value: 2.5 },
      { type: 'ROUTE_TIME', value: 1.5 },
      { type: 'MISSION_REWARD', value: 1.5 },
      { type: 'NPC_AVAILABILITY', value: 0.3 },
    ],
  },
  TECH_FAIR: {
    type: 'TECH_FAIR',
    severity: 'minor',
    name: 'Tech Expo',
    description: 'Technology showcase. Deals on cyberware and gadgets.',
    modifiers: [
      { type: 'SHOP_PRICE', value: 0.8 },
      { type: 'ROUTE_TIME', value: 1.2 },
    ],
  },
  MEDICAL_EMERGENCY: {
    type: 'MEDICAL_EMERGENCY',
    severity: 'moderate',
    name: 'Medical Crisis',
    description: 'Hospitals overwhelmed. Medical supplies in high demand.',
    modifiers: [
      { type: 'SHOP_PRICE', value: 1.5 },
      { type: 'MISSION_REWARD', value: 1.3 },
    ],
  },
  CURFEW: {
    type: 'CURFEW',
    severity: 'major',
    name: 'Curfew Active',
    description: 'Movement restricted. Papers will be checked.',
    modifiers: [
      { type: 'ROUTE_TIME', value: 1.4 },
      { type: 'DETECTION_RISK', value: 2.0 },
      { type: 'NPC_AVAILABILITY', value: 0.2 },
    ],
  },
  CELEBRITY_SIGHTING: {
    type: 'CELEBRITY_SIGHTING',
    severity: 'minor',
    name: 'Media Frenzy',
    description: 'Celebrity spotted. Crowds and media everywhere.',
    modifiers: [
      { type: 'ROUTE_TIME', value: 1.6 },
      { type: 'DETECTION_RISK', value: 0.5 },
    ],
  },
};

// =============================================================================
// EVENT MANAGER
// =============================================================================

export class DistrictEventManager {
  private districtStates: Map<string, DistrictState> = new Map();

  /**
   * Get or create district state.
   */
  getDistrictState(districtId: string): DistrictState {
    let state = this.districtStates.get(districtId);
    if (!state) {
      state = {
        districtId,
        activeEvents: [],
        eventHistory: [],
        baseModifiers: [],
      };
      this.districtStates.set(districtId, state);
    }
    return state;
  }

  /**
   * Add an event to a district.
   */
  addEvent(event: DistrictEvent): void {
    const state = this.getDistrictState(event.districtId);
    state.activeEvents.push(event);
  }

  /**
   * Remove expired events.
   */
  cleanupExpiredEvents(now: Date = new Date()): void {
    for (const state of this.districtStates.values()) {
      const expired = state.activeEvents.filter(e => e.endTime <= now);

      for (const event of expired) {
        state.eventHistory.push({
          eventId: event.id,
          endTime: event.endTime,
        });
      }

      state.activeEvents = state.activeEvents.filter(e => e.endTime > now);

      // Keep only recent history
      const historyLimit = 50;
      if (state.eventHistory.length > historyLimit) {
        state.eventHistory = state.eventHistory.slice(-historyLimit);
      }
    }
  }

  /**
   * Get active events for a district.
   */
  getActiveEvents(districtId: string, includeHidden = false): DistrictEvent[] {
    const state = this.getDistrictState(districtId);
    const now = new Date();

    return state.activeEvents.filter(e => {
      if (e.endTime <= now) return false;
      if (e.isHidden && !includeHidden) return false;
      return true;
    });
  }

  /**
   * Calculate combined modifiers for a district.
   */
  getEffectiveModifiers(districtId: string): Map<EventModifier['type'], number> {
    const events = this.getActiveEvents(districtId, true);
    const modifiers = new Map<EventModifier['type'], number>();

    // Start with base values
    const modifierTypes: EventModifier['type'][] = [
      'ROUTE_TIME', 'ROUTE_DANGER', 'SHOP_PRICE',
      'NPC_AVAILABILITY', 'MISSION_REWARD', 'DETECTION_RISK'
    ];
    for (const type of modifierTypes) {
      modifiers.set(type, 1.0);
    }

    // Apply event modifiers (multiplicative)
    for (const event of events) {
      for (const mod of event.modifiers) {
        const current = modifiers.get(mod.type) || 1.0;
        modifiers.set(mod.type, current * mod.value);
      }
    }

    return modifiers;
  }

  /**
   * Generate a random event for a district.
   */
  generateRandomEvent(
    districtId: string,
    durationMinutes: number = 60,
    allowedTypes?: EventType[]
  ): DistrictEvent {
    const types = allowedTypes || Object.keys(EVENT_TEMPLATES) as EventType[];
    const type = types[Math.floor(Math.random() * types.length)]!;
    const template = EVENT_TEMPLATES[type];

    const now = new Date();
    const endTime = new Date(now.getTime() + durationMinutes * 60 * 1000);

    return {
      id: crypto.randomUUID(),
      districtId,
      startTime: now,
      endTime,
      ...template,
    };
  }

  /**
   * Check if an event type is active in a district.
   */
  hasActiveEventType(districtId: string, type: EventType): boolean {
    const events = this.getActiveEvents(districtId, true);
    return events.some(e => e.type === type);
  }

  /**
   * Get severity level for a district based on active events.
   */
  getDistrictSeverity(districtId: string): EventSeverity {
    const events = this.getActiveEvents(districtId, true);

    if (events.some(e => e.severity === 'critical')) return 'critical';
    if (events.some(e => e.severity === 'major')) return 'major';
    if (events.some(e => e.severity === 'moderate')) return 'moderate';
    if (events.length > 0) return 'minor';

    return 'minor';
  }

  /**
   * Apply modifiers to a base value.
   */
  applyModifier(
    districtId: string,
    modifierType: EventModifier['type'],
    baseValue: number
  ): number {
    const modifiers = this.getEffectiveModifiers(districtId);
    const modifier = modifiers.get(modifierType) || 1.0;
    return Math.round(baseValue * modifier);
  }
}

// Singleton instance
export const districtEvents = new DistrictEventManager();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a timed event.
 */
export function createTimedEvent(
  type: EventType,
  districtId: string,
  durationMinutes: number,
  overrides?: Partial<DistrictEvent>
): DistrictEvent {
  const template = EVENT_TEMPLATES[type];
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    districtId,
    startTime: now,
    endTime: new Date(now.getTime() + durationMinutes * 60 * 1000),
    ...template,
    ...overrides,
  };
}

/**
 * Get human-readable event summary.
 */
export function getEventSummary(event: DistrictEvent): string {
  const effects: string[] = [];

  for (const mod of event.modifiers) {
    const percent = Math.round((mod.value - 1) * 100);
    const sign = percent >= 0 ? '+' : '';

    switch (mod.type) {
      case 'ROUTE_TIME':
        effects.push(`Travel time ${sign}${percent}%`);
        break;
      case 'ROUTE_DANGER':
        effects.push(`Danger ${sign}${percent}%`);
        break;
      case 'SHOP_PRICE':
        effects.push(`Prices ${sign}${percent}%`);
        break;
      case 'NPC_AVAILABILITY':
        effects.push(`NPC availability ${sign}${percent}%`);
        break;
      case 'MISSION_REWARD':
        effects.push(`Mission rewards ${sign}${percent}%`);
        break;
      case 'DETECTION_RISK':
        effects.push(`Detection risk ${sign}${percent}%`);
        break;
    }
  }

  return `${event.name}: ${effects.join(', ')}`;
}
