/**
 * War Theater Store - Faction war state management
 *
 * Manages:
 * - Active wars between factions
 * - Territory control
 * - War events and updates
 * - Player war contributions
 */

import { signal, computed } from '@preact/signals';

// =============================================================================
// TYPES
// =============================================================================

export type WarStatus = 'BREWING' | 'ACTIVE' | 'CEASEFIRE' | 'RESOLVED';

export type TerritoryType = 'INDUSTRIAL' | 'COMMERCIAL' | 'RESIDENTIAL' | 'DOCKS' | 'UNDERGROUND';

export interface Faction {
  id: string;
  name: string;
  color: string;
  strength: number;
  morale: number;
  resources: number;
}

export interface Territory {
  id: string;
  name: string;
  type: TerritoryType;
  controlledBy: string | null;
  contestedBy: string[];
  controlPercentage: number;
  strategicValue: number;
  resources: number;
  position: { x: number; y: number };
}

export interface War {
  id: string;
  factions: [string, string];
  status: WarStatus;
  startedAt: number;
  territories: string[];
  casualtiesA: number;
  casualtiesB: number;
}

export interface WarEvent {
  id: string;
  timestamp: number;
  type: 'BATTLE' | 'TERRITORY_CAPTURED' | 'REINFORCEMENTS' | 'SABOTAGE' | 'CEASEFIRE' | 'WAR_DECLARED';
  factionId: string;
  message: string;
  territoryId?: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface PlayerContribution {
  factionsSupported: Record<string, number>;
  territoriesContested: string[];
  missionsCompleted: number;
  reputation: number;
}

// =============================================================================
// STATE SIGNALS
// =============================================================================

export const factions = signal<Faction[]>([]);
export const territories = signal<Territory[]>([]);
export const wars = signal<War[]>([]);
export const events = signal<WarEvent[]>([]);
export const playerContribution = signal<PlayerContribution | null>(null);
export const connected = signal<boolean>(false);
export const selectedTerritory = signal<string | null>(null);
export const selectedWar = signal<string | null>(null);

// =============================================================================
// COMPUTED VALUES
// =============================================================================

/** Active wars */
export const activeWars = computed(() =>
  wars.value.filter((w) => w.status === 'ACTIVE')
);

/** Wars brewing (about to start) */
export const brewingWars = computed(() =>
  wars.value.filter((w) => w.status === 'BREWING')
);

/** Contested territories */
export const contestedTerritories = computed(() =>
  territories.value.filter((t) => t.contestedBy.length > 0)
);

/** Territories by faction */
export const territoriesByFaction = computed(() => {
  const byFaction: Record<string, Territory[]> = {};
  territories.value.forEach((t) => {
    if (t.controlledBy) {
      if (!byFaction[t.controlledBy]) {
        byFaction[t.controlledBy] = [];
      }
      byFaction[t.controlledBy].push(t);
    }
  });
  return byFaction;
});

/** Faction power rankings */
export const factionRankings = computed(() =>
  [...factions.value].sort((a, b) => {
    const scoreA = a.strength * 0.4 + a.morale * 0.3 + a.resources * 0.3;
    const scoreB = b.strength * 0.4 + b.morale * 0.3 + b.resources * 0.3;
    return scoreB - scoreA;
  })
);

/** Recent events (last 10) */
export const recentEvents = computed(() =>
  events.value.slice(-10).reverse()
);

/** Critical events (high importance) */
export const criticalEvents = computed(() =>
  events.value.filter((e) => e.importance === 'critical' || e.importance === 'high')
);

/** Selected territory details */
export const selectedTerritoryDetails = computed(() =>
  territories.value.find((t) => t.id === selectedTerritory.value)
);

/** Selected war details */
export const selectedWarDetails = computed(() =>
  wars.value.find((w) => w.id === selectedWar.value)
);

/** Get faction by ID */
export function getFaction(id: string): Faction | undefined {
  return factions.value.find((f) => f.id === id);
}

// =============================================================================
// ACTIONS
// =============================================================================

/** Set factions */
export function setFactions(newFactions: Faction[]): void {
  factions.value = newFactions;
}

/** Set territories */
export function setTerritories(newTerritories: Territory[]): void {
  territories.value = newTerritories;
}

/** Set wars */
export function setWars(newWars: War[]): void {
  wars.value = newWars;
}

/** Add event */
export function addEvent(event: WarEvent): void {
  events.value = [...events.value, event];
}

/** Update territory */
export function updateTerritory(id: string, updates: Partial<Territory>): void {
  territories.value = territories.value.map((t) =>
    t.id === id ? { ...t, ...updates } : t
  );
}

/** Update faction */
export function updateFaction(id: string, updates: Partial<Faction>): void {
  factions.value = factions.value.map((f) =>
    f.id === id ? { ...f, ...updates } : f
  );
}

/** Update war */
export function updateWar(id: string, updates: Partial<War>): void {
  wars.value = wars.value.map((w) =>
    w.id === id ? { ...w, ...updates } : w
  );
}

/** Set player contribution */
export function setPlayerContribution(contribution: PlayerContribution): void {
  playerContribution.value = contribution;
}

/** Set connection status */
export function setConnected(isConnected: boolean): void {
  connected.value = isConnected;
}

/** Select territory */
export function selectTerritory(id: string | null): void {
  selectedTerritory.value = id;
}

/** Select war */
export function selectWar(id: string | null): void {
  selectedWar.value = id;
}

/** Handle server message */
export function handleWarTheaterMessage(message: {
  type: string;
  payload?: unknown;
}): void {
  switch (message.type) {
    case 'THEATER_STATE':
      if (typeof message.payload === 'object' && message.payload !== null) {
        const payload = message.payload as {
          factions?: Faction[];
          territories?: Territory[];
          wars?: War[];
          events?: WarEvent[];
          playerContribution?: PlayerContribution;
        };
        if (payload.factions) setFactions(payload.factions);
        if (payload.territories) setTerritories(payload.territories);
        if (payload.wars) setWars(payload.wars);
        if (payload.events) events.value = payload.events;
        if (payload.playerContribution) setPlayerContribution(payload.playerContribution);
      }
      break;

    case 'TERRITORY_UPDATE':
      if (typeof message.payload === 'object' && message.payload !== null) {
        const payload = message.payload as { id: string } & Partial<Territory>;
        updateTerritory(payload.id, payload);
      }
      break;

    case 'FACTION_UPDATE':
      if (typeof message.payload === 'object' && message.payload !== null) {
        const payload = message.payload as { id: string } & Partial<Faction>;
        updateFaction(payload.id, payload);
      }
      break;

    case 'WAR_UPDATE':
      if (typeof message.payload === 'object' && message.payload !== null) {
        const payload = message.payload as { id: string } & Partial<War>;
        updateWar(payload.id, payload);
      }
      break;

    case 'WAR_DECLARED':
    case 'WAR_ENDED':
      if (typeof message.payload === 'object' && message.payload !== null) {
        const payload = message.payload as { war: War; event: WarEvent };
        if (payload.war) {
          const existing = wars.value.find((w) => w.id === payload.war.id);
          if (existing) {
            updateWar(payload.war.id, payload.war);
          } else {
            wars.value = [...wars.value, payload.war];
          }
        }
        if (payload.event) addEvent(payload.event);
      }
      break;

    case 'EVENT':
      if (typeof message.payload === 'object' && message.payload !== null) {
        addEvent(message.payload as WarEvent);
      }
      break;

    case 'CONTRIBUTION_UPDATE':
      if (typeof message.payload === 'object' && message.payload !== null) {
        setPlayerContribution(message.payload as PlayerContribution);
      }
      break;
  }
}

// =============================================================================
// STORE EXPORT
// =============================================================================

export const warTheaterStore = {
  // State
  factions,
  territories,
  wars,
  events,
  playerContribution,
  connected,
  selectedTerritory,
  selectedWar,

  // Computed
  activeWars,
  brewingWars,
  contestedTerritories,
  territoriesByFaction,
  factionRankings,
  recentEvents,
  criticalEvents,
  selectedTerritoryDetails,
  selectedWarDetails,

  // Helpers
  getFaction,

  // Actions
  setFactions,
  setTerritories,
  setWars,
  addEvent,
  updateTerritory,
  updateFaction,
  updateWar,
  setPlayerContribution,
  setConnected,
  selectTerritory,
  selectWar,
  handleWarTheaterMessage,
};

export default warTheaterStore;
