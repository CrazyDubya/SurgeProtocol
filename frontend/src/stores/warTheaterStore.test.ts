/**
 * War Theater Store Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  factions,
  territories,
  wars,
  events,
  playerContribution,
  connected,
  selectedTerritory,
  selectedWar,
  activeWars,
  brewingWars,
  contestedTerritories,
  territoriesByFaction,
  factionRankings,
  recentEvents,
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
  getFaction,
  handleWarTheaterMessage,
  type Faction,
  type Territory,
  type War,
  type WarEvent,
} from './warTheaterStore';

// Mock data
const mockFactions: Faction[] = [
  { id: 'fac-1', name: 'Red Dragons', color: '#ff0000', strength: 80, morale: 70, resources: 60 },
  { id: 'fac-2', name: 'Blue Corp', color: '#0000ff', strength: 75, morale: 65, resources: 90 },
  { id: 'fac-3', name: 'Shadow Syndicate', color: '#333333', strength: 60, morale: 80, resources: 50 },
];

const mockTerritories: Territory[] = [
  {
    id: 'ter-1',
    name: 'Downtown',
    type: 'COMMERCIAL',
    controlledBy: 'fac-1',
    contestedBy: [],
    controlPercentage: 100,
    strategicValue: 8,
    resources: 5,
    position: { x: 50, y: 50 },
  },
  {
    id: 'ter-2',
    name: 'Industrial Zone',
    type: 'INDUSTRIAL',
    controlledBy: 'fac-2',
    contestedBy: ['fac-1'],
    controlPercentage: 65,
    strategicValue: 7,
    resources: 8,
    position: { x: 30, y: 70 },
  },
  {
    id: 'ter-3',
    name: 'The Docks',
    type: 'DOCKS',
    controlledBy: null,
    contestedBy: ['fac-1', 'fac-3'],
    controlPercentage: 0,
    strategicValue: 9,
    resources: 6,
    position: { x: 80, y: 20 },
  },
];

const mockWars: War[] = [
  {
    id: 'war-1',
    factions: ['fac-1', 'fac-2'],
    status: 'ACTIVE',
    startedAt: Date.now() - 86400000,
    territories: ['ter-2'],
    casualtiesA: 15,
    casualtiesB: 20,
  },
  {
    id: 'war-2',
    factions: ['fac-1', 'fac-3'],
    status: 'BREWING',
    startedAt: Date.now(),
    territories: ['ter-3'],
    casualtiesA: 0,
    casualtiesB: 0,
  },
];

const mockEvent: WarEvent = {
  id: 'event-1',
  timestamp: Date.now(),
  type: 'BATTLE',
  factionId: 'fac-1',
  message: 'Red Dragons attacked the Industrial Zone',
  territoryId: 'ter-2',
  importance: 'high',
};

describe('War Theater Store', () => {
  beforeEach(() => {
    // Reset store state
    factions.value = [];
    territories.value = [];
    wars.value = [];
    events.value = [];
    playerContribution.value = null;
    connected.value = false;
    selectedTerritory.value = null;
    selectedWar.value = null;
  });

  describe('State Management', () => {
    it('should set factions', () => {
      setFactions(mockFactions);
      expect(factions.value).toHaveLength(3);
      expect(factions.value[0].name).toBe('Red Dragons');
    });

    it('should set territories', () => {
      setTerritories(mockTerritories);
      expect(territories.value).toHaveLength(3);
    });

    it('should set wars', () => {
      setWars(mockWars);
      expect(wars.value).toHaveLength(2);
    });

    it('should add events', () => {
      addEvent(mockEvent);
      expect(events.value).toHaveLength(1);
      expect(events.value[0].id).toBe('event-1');
    });

    it('should set player contribution', () => {
      setPlayerContribution({
        factionsSupported: { 'fac-1': 100 },
        territoriesContested: ['ter-2'],
        missionsCompleted: 5,
        reputation: 75,
      });

      expect(playerContribution.value?.missionsCompleted).toBe(5);
      expect(playerContribution.value?.reputation).toBe(75);
    });
  });

  describe('Updates', () => {
    beforeEach(() => {
      setFactions(mockFactions);
      setTerritories(mockTerritories);
      setWars(mockWars);
    });

    it('should update a territory', () => {
      updateTerritory('ter-2', { controlPercentage: 45 });

      const updated = territories.value.find((t) => t.id === 'ter-2');
      expect(updated?.controlPercentage).toBe(45);
    });

    it('should update a faction', () => {
      updateFaction('fac-1', { strength: 90, morale: 85 });

      const updated = factions.value.find((f) => f.id === 'fac-1');
      expect(updated?.strength).toBe(90);
      expect(updated?.morale).toBe(85);
    });

    it('should update a war', () => {
      updateWar('war-1', { casualtiesA: 25 });

      const updated = wars.value.find((w) => w.id === 'war-1');
      expect(updated?.casualtiesA).toBe(25);
    });
  });

  describe('Computed Values', () => {
    beforeEach(() => {
      setFactions(mockFactions);
      setTerritories(mockTerritories);
      setWars(mockWars);
    });

    describe('activeWars', () => {
      it('should filter active wars only', () => {
        expect(activeWars.value).toHaveLength(1);
        expect(activeWars.value[0].id).toBe('war-1');
      });
    });

    describe('brewingWars', () => {
      it('should filter brewing wars only', () => {
        expect(brewingWars.value).toHaveLength(1);
        expect(brewingWars.value[0].id).toBe('war-2');
      });
    });

    describe('contestedTerritories', () => {
      it('should filter territories with contesters', () => {
        expect(contestedTerritories.value).toHaveLength(2);
        expect(contestedTerritories.value.map((t) => t.id)).toContain('ter-2');
        expect(contestedTerritories.value.map((t) => t.id)).toContain('ter-3');
      });
    });

    describe('territoriesByFaction', () => {
      it('should group territories by controlling faction', () => {
        const byFaction = territoriesByFaction.value;

        expect(byFaction['fac-1']).toHaveLength(1);
        expect(byFaction['fac-1'][0].id).toBe('ter-1');

        expect(byFaction['fac-2']).toHaveLength(1);
        expect(byFaction['fac-2'][0].id).toBe('ter-2');
      });

      it('should not include uncontrolled territories', () => {
        const byFaction = territoriesByFaction.value;
        expect(byFaction['fac-3']).toBeUndefined();
      });
    });

    describe('factionRankings', () => {
      it('should sort factions by power score (descending)', () => {
        const rankings = factionRankings.value;

        // Power score = strength*0.4 + morale*0.3 + resources*0.3
        // fac-1: 80*0.4 + 70*0.3 + 60*0.3 = 32 + 21 + 18 = 71
        // fac-2: 75*0.4 + 65*0.3 + 90*0.3 = 30 + 19.5 + 27 = 76.5
        // fac-3: 60*0.4 + 80*0.3 + 50*0.3 = 24 + 24 + 15 = 63

        expect(rankings[0].id).toBe('fac-2'); // 76.5
        expect(rankings[1].id).toBe('fac-1'); // 71
        expect(rankings[2].id).toBe('fac-3'); // 63
      });
    });

    describe('recentEvents', () => {
      it('should return last 10 events in reverse order', () => {
        for (let i = 0; i < 15; i++) {
          addEvent({ ...mockEvent, id: `event-${i}` });
        }

        const recent = recentEvents.value;
        expect(recent).toHaveLength(10);
        expect(recent[0].id).toBe('event-14'); // Most recent
        expect(recent[9].id).toBe('event-5');
      });
    });
  });

  describe('Selection', () => {
    beforeEach(() => {
      setTerritories(mockTerritories);
      setWars(mockWars);
    });

    it('should select territory', () => {
      selectTerritory('ter-2');
      expect(selectedTerritory.value).toBe('ter-2');
    });

    it('should deselect territory', () => {
      selectTerritory('ter-2');
      selectTerritory(null);
      expect(selectedTerritory.value).toBeNull();
    });

    it('should select war', () => {
      selectWar('war-1');
      expect(selectedWar.value).toBe('war-1');
    });
  });

  describe('Helpers', () => {
    it('should get faction by id', () => {
      setFactions(mockFactions);

      const faction = getFaction('fac-2');
      expect(faction?.name).toBe('Blue Corp');
    });

    it('should return undefined for unknown faction', () => {
      setFactions(mockFactions);
      expect(getFaction('unknown')).toBeUndefined();
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
    it('should handle THEATER_STATE message', () => {
      handleWarTheaterMessage({
        type: 'THEATER_STATE',
        payload: {
          factions: mockFactions,
          territories: mockTerritories,
          wars: mockWars,
          events: [mockEvent],
        },
      });

      expect(factions.value).toHaveLength(3);
      expect(territories.value).toHaveLength(3);
      expect(wars.value).toHaveLength(2);
      expect(events.value).toHaveLength(1);
    });

    it('should handle TERRITORY_UPDATE message', () => {
      setTerritories(mockTerritories);

      handleWarTheaterMessage({
        type: 'TERRITORY_UPDATE',
        payload: { id: 'ter-1', controlPercentage: 80 },
      });

      const updated = territories.value.find((t) => t.id === 'ter-1');
      expect(updated?.controlPercentage).toBe(80);
    });

    it('should handle FACTION_UPDATE message', () => {
      setFactions(mockFactions);

      handleWarTheaterMessage({
        type: 'FACTION_UPDATE',
        payload: { id: 'fac-1', strength: 95 },
      });

      const updated = factions.value.find((f) => f.id === 'fac-1');
      expect(updated?.strength).toBe(95);
    });

    it('should handle WAR_UPDATE message', () => {
      setWars(mockWars);

      handleWarTheaterMessage({
        type: 'WAR_UPDATE',
        payload: { id: 'war-1', status: 'CEASEFIRE' },
      });

      const updated = wars.value.find((w) => w.id === 'war-1');
      expect(updated?.status).toBe('CEASEFIRE');
    });

    it('should handle EVENT message', () => {
      handleWarTheaterMessage({
        type: 'EVENT',
        payload: mockEvent,
      });

      expect(events.value).toHaveLength(1);
      expect(events.value[0].id).toBe('event-1');
    });
  });
});
