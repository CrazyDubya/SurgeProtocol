import { BaseService, type ServiceContext, ErrorCodes } from '../base';
import type { Region, Location, Route, Connection, TravelResult, LocationDetails } from './types';
import { WorldSimulator } from './simulator';
import { getActiveDistrictEvents, getEffectiveModifiers } from '../../game/events/district';

export class WorldService extends BaseService {
    private simulator: WorldSimulator;

    constructor(context: ServiceContext) {
        super(context);
        this.simulator = new WorldSimulator(this.db, this.vendorService);
    }

    /**
     * List all regions (hierarchical build moved to API for now or kept here)
     */
    async getRegions(): Promise<Region[]> {
        return this.queryAll<Region>(
            `SELECT id, code, name, description, region_type,
              parent_region_id, controlling_faction_id,
              law_level, corporate_presence, wealth_level, crime_rate
       FROM regions
       ORDER BY name`
        );
    }

    /**
     * Get region details with locations and sub-regions
     */
    async getRegionDetails(regionId: string) {
        const region = await this.query<any>(
            `SELECT r.*, f.name as faction_name
       FROM regions r
       LEFT JOIN factions f ON r.controlling_faction_id = f.id
       WHERE r.id = ? OR r.code = ?`,
            regionId, regionId
        );

        if (!region) return null;

        const locations = await this.queryAll<any>(
            `SELECT id, code, name, description, location_type,
              tier_requirement, access_type, fast_travel_point
       FROM locations
       WHERE region_id = ?
       ORDER BY name`,
            region.id
        );

        const subRegions = await this.queryAll<any>(
            `SELECT id, code, name, region_type
       FROM regions
       WHERE parent_region_id = ?`,
            region.id
        );

        return { region, locations, subRegions };
    }

    /**
     * List locations with optional filters
     */
    async getLocations(filters: { regionId?: string; type?: string }): Promise<Location[]> {
        let query = `
      SELECT l.id, l.code, l.name, l.description, l.location_type,
             l.tier_requirement, l.access_type, l.fast_travel_point,
             l.region_id, r.name as region_name, l.locked
      FROM locations l
      LEFT JOIN regions r ON l.region_id = r.id
      WHERE 1=1
    `;
        const params: string[] = [];

        if (filters.regionId) {
            query += ` AND (l.region_id = ? OR r.code = ?)`;
            params.push(filters.regionId, filters.regionId);
        }
        if (filters.type) {
            query += ` AND l.location_type = ?`;
            params.push(filters.type);
        }
        query += ` ORDER BY r.name, l.name`;

        return this.queryAll<Location>(query, ...params);
    }

    /**
     * Get exhaustive location details
     */
    async getLocationDetails(locationId: string, characterId?: string): Promise<LocationDetails | null> {
        const location = await this.query<any>(
            `SELECT l.*, r.name as region_name, r.code as region_code,
              f.name as faction_name
       FROM locations l
       LEFT JOIN regions r ON l.region_id = r.id
       LEFT JOIN factions f ON l.faction_requirement_id = f.id
       WHERE l.id = ? OR l.code = ?`,
            locationId, locationId
        );

        if (!location) return null;

        // Trigger simulation update
        await this.simulator.simulateLocation(location.id);

        // Get current character stats if provided
        let character = null;
        if (characterId) {
            character = await this.query<any>(
                'SELECT current_tier, current_location_id FROM characters WHERE id = ?',
                characterId
            );
        }

        // Get active events and modifiers
        let activeEvents: any[] = [];
        let modifiers = new Map();
        if (this.cache && location.region_id) {
            activeEvents = await getActiveDistrictEvents(this.cache, location.region_id);
            modifiers = getEffectiveModifiers(activeEvents);
        }
        const timeMod = modifiers.get('ROUTE_TIME') || 1.0;

        // Get outgoing routes
        const outgoingResults = await this.queryAll<any>(
            `SELECT rt.*, loc.name as destination_name, loc.code as destination_code,
              loc.location_type as destination_type, loc.tier_requirement as dest_tier
       FROM routes rt
       JOIN locations loc ON rt.destination_location_id = loc.id
       WHERE rt.origin_location_id = ?`,
            location.id
        );

        const connections = outgoingResults.map(route => {
            const baseTime = route.base_travel_time_minutes ?? 10;
            const effectiveTime = Math.round(baseTime * timeMod);
            const canTravel = (character?.current_tier ?? 1) >= route.required_tier;

            return {
                routeId: route.id,
                routeName: route.name,
                destination: {
                    id: route.destination_location_id,
                    name: route.destination_name,
                    code: route.destination_code,
                    type: route.destination_type,
                    tierRequired: route.dest_tier,
                },
                distance_km: route.distance_km,
                baseTravelTime: route.base_travel_time_minutes,
                effectiveTravelTime: effectiveTime,
                tierRequired: route.required_tier,
                canTravel,
                reason: !canTravel ? `Requires Tier ${route.required_tier}` : null,
            };
        });

        // Get incoming routes
        const incomingCount = await this.query<any>(
            `SELECT COUNT(*) as count FROM routes WHERE destination_location_id = ?`,
            location.id
        );

        // Get NPCs
        const npcs = await this.queryAll<any>(
            `SELECT ni.id, nd.name, nd.npc_type, nd.is_vendor, nd.is_quest_giver
       FROM npc_instances ni
       JOIN npc_definitions nd ON ni.npc_definition_id = nd.id
       WHERE ni.current_location_id = ?`,
            location.id
        );

        // Get Vendors
        const vendors = await this.queryAll<any>(
            `SELECT vi.id, n.name, vi.vendor_type, vi.specialization as specialty
       FROM vendor_inventories vi
       LEFT JOIN npc_definitions n ON vi.vendor_npc_id = n.id
       WHERE vi.location_id = ?`,
            location.id
        );

        return {
            location: {
                ...location,
                services_offered: location.services_offered ? JSON.parse(location.services_offered) : [],
            },
            connections,
            incomingRoutes: incomingCount?.count || 0,
            npcs,
            vendors,
            districtConditions: activeEvents.length > 0 ? {
                activeEvents: activeEvents.map(e => ({ name: e.name, type: e.type })),
                travelTimeMultiplier: timeMod,
            } : null,
            isCurrentLocation: character?.current_location_id === location.id,
        };
    }

    /**
     * Move character to destination
     */
    async moveCharacter(characterId: string, destinationId: string, routeId?: string): Promise<TravelResult> {
        const character = await this.query<any>(
            'SELECT current_tier, current_location_id FROM characters WHERE id = ?',
            characterId
        );
        this.assertExists(character, ErrorCodes.CHARACTER_NOT_FOUND, 'Character not found');

        const destination = await this.query<any>(
            'SELECT id, name, code, tier_requirement, locked, region_id FROM locations WHERE id = ? OR code = ?',
            destinationId, destinationId
        );
        if (!destination) return { success: false, error: 'Destination not found', code: 'DESTINATION_NOT_FOUND' };
        if (destination.locked) return { success: false, error: 'Location is locked', code: 'LOCATION_LOCKED' };

        if (character.current_tier < destination.tier_requirement) {
            return {
                success: false,
                error: `Requires Tier ${destination.tier_requirement}, you are Tier ${character.current_tier}`,
                code: 'TIER_REQUIREMENT'
            };
        }

        const currentLocationId = character.current_location_id;
        let route: any = null;

        if (currentLocationId) {
            if (routeId) {
                route = await this.query<any>(
                    `SELECT id, base_travel_time_minutes, distance_km, required_tier
           FROM routes
           WHERE id = ? AND origin_location_id = ? AND destination_location_id = ?`,
                    routeId, currentLocationId, destination.id
                );
            } else {
                route = await this.query<any>(
                    `SELECT id, base_travel_time_minutes, distance_km, required_tier
           FROM routes
           WHERE (origin_location_id = ? AND destination_location_id = ?)
              OR (origin_location_id = ? AND destination_location_id = ?)`,
                    currentLocationId, destination.id, destination.id, currentLocationId
                );
            }
        }

        // Fast travel check
        if (!route && currentLocationId) {
            const curFT = await this.query<any>('SELECT fast_travel_point FROM locations WHERE id = ?', currentLocationId);
            const destFT = await this.query<any>('SELECT fast_travel_point FROM locations WHERE id = ?', destination.id);

            if (curFT?.fast_travel_point && destFT?.fast_travel_point) {
                route = { id: 'fast_travel', base_travel_time_minutes: 5, distance_km: null, required_tier: 1 };
            }
        }

        if (!route && currentLocationId) {
            return { success: false, error: 'No route connects these locations', code: 'NO_ROUTE' };
        }

        if (route && character.current_tier < route.required_tier) {
            return { success: false, error: `Route requires Tier ${route.required_tier}`, code: 'ROUTE_TIER_REQUIREMENT' };
        }

        // Modifiers
        let activeEvents: any[] = [];
        let timeMod = 1.0;
        if (this.cache && destination.region_id) {
            activeEvents = await getActiveDistrictEvents(this.cache, destination.region_id);
            timeMod = getEffectiveModifiers(activeEvents).get('ROUTE_TIME') || 1.0;
        }

        const effectiveTime = Math.round((route?.base_travel_time_minutes ?? 10) * timeMod);

        // Update
        await this.execute(
            `UPDATE characters SET current_location_id = ?, updated_at = datetime('now') WHERE id = ?`,
            destination.id, characterId
        );

        // Log memory
        try {
            await this.execute(
                `INSERT INTO character_memories (id, character_id, memory_type, content, importance, created_at)
         VALUES (?, ?, 'LOCATION_VISIT', ?, 1, datetime('now'))`,
                crypto.randomUUID(), characterId, JSON.stringify({
                    locationId: destination.id,
                    locationName: destination.name,
                    fromLocationId: currentLocationId,
                    travelTime: effectiveTime,
                })
            );
        } catch (e) {
            console.warn('Memory log failed', e);
        }

        return {
            success: true,
            data: {
                previousLocation: currentLocationId,
                newLocation: { id: destination.id, name: destination.name, code: destination.code },
                travelTime: effectiveTime,
                distance: route?.distance_km,
                routeUsed: route?.id !== 'fast_travel' ? route?.id : null,
                fastTravel: route?.id === 'fast_travel',
                districtConditions: activeEvents.length > 0 ? {
                    activeEvents: activeEvents.map(e => e.name),
                    travelTimeMultiplier: timeMod,
                } : null,
                message: `Arrived at ${destination.name}.`,
            }
        };
    }

    /**
     * Get character's current location with basic info
     */
    async getCurrentLocation(characterId: string) {
        const character = await this.query<any>('SELECT current_location_id FROM characters WHERE id = ?', characterId);
        if (!character?.current_location_id) return null;

        return this.query<any>(
            `SELECT l.*, r.name as region_name
       FROM locations l
       LEFT JOIN regions r ON l.region_id = r.id
       WHERE l.id = ?`,
            character.current_location_id
        );
    }

    /**
     * Calculate a route between two locations using Dijkstra's algorithm.
     */
    async calculateRoute(originId: string, destinationId: string): Promise<Route | null> {
        if (originId === destinationId) {
            return { path: [], total_distance: 0, total_time: 0, total_cost: 0, risk_level: 'LOW' };
        }

        const allRoutes = await this.queryAll<any>('SELECT * FROM routes');
        const graph = new Map<string, Connection[]>();

        const addEdge = (from: string, to: string, route: any) => {
            if (!graph.has(from)) graph.set(from, []);
            graph.get(from)!.push({
                id: route.id,
                name: route.name,
                origin_location_id: from,
                destination_location_id: to,
                distance_km: route.distance_km,
                base_travel_time_minutes: route.base_travel_time_minutes,
                hazard_level: route.hazard_level || 0,
                required_tier: route.required_tier || 1
            });
        };

        for (const r of allRoutes) {
            addEdge(r.origin_location_id, r.destination_location_id, r);
            addEdge(r.destination_location_id, r.origin_location_id, r);
        }

        const distances = new Map<string, number>();
        const previous = new Map<string, Connection>();
        const visited = new Set<string>();
        const pq: { id: string, cost: number }[] = [{ id: originId, cost: 0 }];
        distances.set(originId, 0);

        while (pq.length > 0) {
            pq.sort((a, b) => a.cost - b.cost);
            const { id: currentId, cost: currentDist } = pq.shift()!;

            if (currentId === destinationId) break;
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const neighbors = graph.get(currentId) || [];
            for (const edge of neighbors) {
                if (visited.has(edge.destination_location_id)) continue;
                const newDist = currentDist + (edge.base_travel_time_minutes ?? 10);
                const existingDist = distances.get(edge.destination_location_id) ?? Infinity;

                if (newDist < existingDist) {
                    distances.set(edge.destination_location_id, newDist);
                    previous.set(edge.destination_location_id, edge);
                    pq.push({ id: edge.destination_location_id, cost: newDist });
                }
            }
        }

        if (!previous.has(destinationId)) return null;

        const path: Connection[] = [];
        let curr = destinationId;
        while (curr !== originId) {
            const edge = previous.get(curr);
            if (!edge) break;
            path.unshift(edge);
            curr = edge.origin_location_id;
        }

        const total_distance = path.reduce((sum, c) => sum + (c.distance_km ?? 0), 0);
        const total_time = path.reduce((sum, c) => sum + (c.base_travel_time_minutes ?? 0), 0);
        const max_hazard = path.length > 0 ? Math.max(...path.map(c => c.hazard_level)) : 0;
        const risk_level = max_hazard > 7 ? 'EXTREME' : max_hazard > 5 ? 'HIGH' : max_hazard > 2 ? 'MEDIUM' : 'LOW';

        return { path, total_distance, total_time, total_cost: 0, risk_level };
    }
}
