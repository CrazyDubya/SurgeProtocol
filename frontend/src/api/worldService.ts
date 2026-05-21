import { client } from './client';

export interface Location {
    id: string;
    code: string;
    name: string;
    description: string;
    location_type: string;
    tier_requirement: number;
    region_id: string;
    region_name?: string;
    servicesOffered?: string[];
    fast_travel_point?: number;
}

export interface RouteConnection {
    routeId: string;
    routeName?: string;
    destination: {
        id: string;
        name: string;
        code: string | null;
        type: string | null;
        tierRequired: number;
    };
    distance_km: number | null;
    baseTravelTime: number | null;
    effectiveTravelTime: number;
    tierRequired: number;
    canTravel: boolean;
    reason: string | null;
}

export interface LocationDetails {
    location: Location;
    connections: RouteConnection[];
    incomingRoutes: number;
    npcs: any[];
    vendors: any[];
    districtConditions: {
        activeEvents: { name: string; type: string }[];
        travelTimeMultiplier: number;
    } | null;
    isCurrentLocation: boolean;
}

export interface MoveResult {
    previousLocation: string;
    newLocation: {
        id: string;
        name: string;
        code: string | null;
    };
    travelTime: number;
    distance: number | null;
    routeUsed: string | null;
    fastTravel: boolean;
    districtConditions: {
        activeEvents: string[];
        travelTimeMultiplier: number;
    } | null;
    message: string;
}

export const worldService = {
    /**
     * Get character's current location
     */
    async getCurrentLocation(): Promise<{ location: Location | null; message?: string }> {
        return await client.get('/world/current');
    },

    /**
     * Get location details including connections
     */
    async getLocationDetails(locationId: string): Promise<LocationDetails> {
        return await client.get(`/world/locations/${locationId}`);
    },

    /**
     * Move to a destination
     */
    async move(destinationId: string, routeId?: string): Promise<MoveResult> {
        return await client.post('/world/move', { destinationId, routeId });
    },
};
