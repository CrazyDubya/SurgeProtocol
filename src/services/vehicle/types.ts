export interface VehicleDefinition {
    id: string;
    code: string;
    name: string;
    description: string;
    manufacturer: string;
    vehicle_type: 'GROUND' | 'HOVER' | 'AERIAL' | 'NAVAL';
    class: string; // e.g., 'MOTORCYCLE', 'SEDAN', 'TRUCK'

    // Stats
    slots: number;
    max_speed: number;
    acceleration: number;
    handling: number;
    braking: number;
    off_road_capability: number;

    // Combat
    armor_value: number;
    hull_integrity: number;
    shield_capacity: number;

    // Economy
    base_price: number;
    fuel_type: string;
    fuel_capacity: number;
    fuel_consumption: number;

    // Cargo
    cargo_capacity_kg: number;
    passenger_capacity: number;

    // Customization
    mod_slots_engine: number;
    mod_slots_chassis: number;
    mod_slots_weapon: number;

    // Meta
    required_license: string;
    is_illegal: number; // boolean

    // Visuals
    icon_asset: string;
    model_asset: string;
}

export interface CharacterVehicle {
    id: string;
    character_id: string;
    vehicle_definition_id: string;

    // Instance state
    custom_name?: string;
    current_location_id?: string;
    current_hull_integrity: number;
    current_fuel: number;
    current_shield: number;

    // Customization
    color_primary: string;
    color_secondary: string;
    engine_mods: string; // JSON
    chassis_mods: string; // JSON
    weapon_mods: string; // JSON
    cargo_items: string; // JSON

    // Status
    is_active: number; // boolean
    is_destroyed: number; // boolean
    is_impounded: number; // boolean

    // Tracking
    odometer_km: number;
    purchased_at: string;
    last_used_at: string;

    // Joined fields
    definition?: VehicleDefinition;
}

export interface VehicleMod {
    id: string;
    name: string;
    type: 'ENGINE' | 'CHASSIS' | 'WEAPON';
    effects: any; // JSON
}
