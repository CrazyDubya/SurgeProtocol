export interface Region {
    id: string;
    code: string;
    name: string;
    description: string | null;
    region_type: string | null;
    parent_region_id: string | null;
    controlling_faction_id: string | null;
    law_level: number;
    corporate_presence: number;
    wealth_level: number;
    crime_rate: number;
    danger_level?: number;
}

export interface Location {
    id: string;
    code: string;
    name: string;
    description: string | null;
    region_id: string | null;
    location_type: string | null;
    tier_requirement: number;
    access_type: string | null;
    fast_travel_point: number;
    locked: number;
    services_offered?: string | null;
    faction_requirement_id?: string | null;
    coordinates?: string | null;
    is_restricted?: number;
}

export interface Connection {
    id: string;
    name: string | null;
    origin_location_id: string;
    destination_location_id: string;
    distance_km: number | null;
    base_travel_time_minutes: number | null;
    hazard_level: number;
    required_tier: number;
}

export interface Route {
    path: Connection[];
    total_distance: number;
    total_time: number;
    total_cost: number;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
}

export interface TravelResult {
    success: boolean;
    error?: string;
    code?: string;
    data?: {
        previousLocation: string | null;
        newLocation: {
            id: string;
            name: string;
            code: string | null;
        };
        travelTime: number;
        distance: number | null;
        routeUsed: string | null;
        fastTravel: boolean;
        districtConditions: any;
        message: string;
    };
}

export interface LocationDetails {
    location: any;
    connections: any[];
    incomingRoutes: number;
    npcs: any[];
    vendors: any[];
    districtConditions: any;
    isCurrentLocation: boolean;
}
