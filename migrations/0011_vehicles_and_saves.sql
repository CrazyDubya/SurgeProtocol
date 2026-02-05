-- SURGE PROTOCOL: Database Schema Migration
-- Part 11: Vehicle System Enhancements & Save System Preparation
-- Adds active_vehicle_id to characters, vehicle-mission integration, seeds vehicle definitions

-- ============================================
-- MISSION DEFINITIONS - VEHICLE INTEGRATION
-- ============================================

-- Add columns for vehicle requirements and distance tracking
-- Note: SQLite ALTER TABLE ADD COLUMN doesn't support IF NOT EXISTS,
-- so these may error on re-run (which is acceptable)
ALTER TABLE mission_definitions ADD COLUMN required_vehicle_class TEXT DEFAULT NULL;
ALTER TABLE mission_definitions ADD COLUMN distance_km REAL DEFAULT NULL;

-- Set default distances based on tier (tier * 5 km)
UPDATE mission_definitions SET distance_km = tier_minimum * 5 WHERE distance_km IS NULL;
UPDATE mission_definitions SET distance_km = tier_requirement * 5 WHERE distance_km IS NULL AND tier_requirement IS NOT NULL;

-- ============================================
-- CHARACTER TABLE ENHANCEMENT
-- ============================================

-- Add active_vehicle_id column to characters table
ALTER TABLE characters ADD COLUMN active_vehicle_id TEXT REFERENCES character_vehicles(id);

-- ============================================
-- VEHICLE DEFINITIONS SEED DATA
-- ============================================

-- Delivery-focused vehicles for a courier game

-- BIKES (Tier 1 - Starting vehicles)
INSERT OR IGNORE INTO vehicle_definitions (
    id, code, name, manufacturer, model_year, description,
    vehicle_class, vehicle_type, size_category, rarity,
    top_speed_kmh, acceleration_0_100_seconds, handling_rating, braking_rating, offroad_capability,
    max_hull_points, armor_rating,
    passenger_capacity, cargo_capacity_kg, cargo_volume_liters, towing_capacity_kg,
    power_source, fuel_capacity, fuel_consumption_per_km, range_km, recharge_time_hours,
    required_tier, required_skill_level, base_price, insurance_cost_monthly, maintenance_cost_monthly,
    autopilot_level, network_connected, stealth_capable
) VALUES
(
    'veh_bike_courier', 'COURIER_BIKE', 'OmniDeliver Courier Bike', 'OmniDeliver', 2087,
    'Standard-issue electric bicycle for new couriers. Reliable but basic.',
    'BIKE', 'ELECTRIC_BICYCLE', 'SMALL', 'COMMON',
    35, 8.0, 70, 60, 20,
    30, 0,
    1, 15, 25, 0,
    'ELECTRIC', 20.0, 0.02, 1000, 2.0,
    1, 0, 500, 10, 5,
    0, 1, 0
),
(
    'veh_bike_speed', 'VELOCITY_SPRINT', 'Velocity Sprint', 'Dynamo', 2086,
    'Lightweight racing e-bike. Fast but fragile with minimal cargo space.',
    'BIKE', 'RACING_BICYCLE', 'SMALL', 'UNCOMMON',
    55, 5.0, 80, 70, 10,
    20, 0,
    1, 8, 12, 0,
    'ELECTRIC', 15.0, 0.03, 500, 1.5,
    1, 0, 2500, 25, 15,
    1, 1, 0
),
(
    'veh_bike_cargo', 'MULE_HAULER', 'Mule Hauler', 'WorkHorse', 2085,
    'Heavy-duty cargo bike with extended rear rack. Slow but carries more.',
    'BIKE', 'CARGO_BICYCLE', 'MEDIUM', 'COMMON',
    25, 12.0, 50, 50, 15,
    40, 0,
    1, 50, 80, 0,
    'ELECTRIC', 30.0, 0.04, 750, 3.0,
    1, 0, 1500, 15, 10,
    0, 1, 0
);

-- MOTORCYCLES (Tier 2)
INSERT OR IGNORE INTO vehicle_definitions (
    id, code, name, manufacturer, model_year, description,
    vehicle_class, vehicle_type, size_category, rarity,
    top_speed_kmh, acceleration_0_100_seconds, handling_rating, braking_rating, offroad_capability,
    max_hull_points, armor_rating,
    passenger_capacity, cargo_capacity_kg, cargo_volume_liters, towing_capacity_kg,
    power_source, fuel_capacity, fuel_consumption_per_km, range_km, recharge_time_hours,
    required_tier, required_skill_level, base_price, insurance_cost_monthly, maintenance_cost_monthly,
    autopilot_level, network_connected, stealth_capable
) VALUES
(
    'veh_moto_standard', 'STREET_RUNNER', 'Street Runner 400e', 'Yaiba', 2087,
    'Reliable electric motorcycle. Good balance of speed and cargo.',
    'MOTORCYCLE', 'ELECTRIC_MOTORCYCLE', 'MEDIUM', 'COMMON',
    140, 4.5, 75, 70, 25,
    60, 2,
    2, 25, 40, 0,
    'ELECTRIC', 40.0, 0.05, 800, 1.0,
    2, 1, 8000, 80, 40,
    1, 1, 0
),
(
    'veh_moto_sport', 'KUSANAGI_CT3X', 'Kusanagi CT-3X', 'Yaiba', 2087,
    'High-performance sport bike. Incredible speed, minimal cargo.',
    'MOTORCYCLE', 'SPORT_MOTORCYCLE', 'MEDIUM', 'RARE',
    220, 2.8, 85, 80, 15,
    50, 1,
    2, 10, 15, 0,
    'ELECTRIC', 35.0, 0.08, 440, 0.5,
    3, 2, 25000, 250, 100,
    2, 1, 1
),
(
    'veh_moto_touring', 'ROAD_KING', 'Road King Tourer', 'Brennan', 2086,
    'Comfortable touring motorcycle with large saddlebags.',
    'MOTORCYCLE', 'TOURING_MOTORCYCLE', 'MEDIUM', 'UNCOMMON',
    160, 5.5, 65, 65, 30,
    80, 3,
    2, 60, 100, 0,
    'HYBRID', 50.0, 0.06, 830, 1.5,
    2, 1, 15000, 150, 75,
    1, 1, 0
);

-- SCOOTERS (Tier 1-2)
INSERT OR IGNORE INTO vehicle_definitions (
    id, code, name, manufacturer, model_year, description,
    vehicle_class, vehicle_type, size_category, rarity,
    top_speed_kmh, acceleration_0_100_seconds, handling_rating, braking_rating, offroad_capability,
    max_hull_points, armor_rating,
    passenger_capacity, cargo_capacity_kg, cargo_volume_liters, towing_capacity_kg,
    power_source, fuel_capacity, fuel_consumption_per_km, range_km, recharge_time_hours,
    required_tier, required_skill_level, base_price, insurance_cost_monthly, maintenance_cost_monthly,
    autopilot_level, network_connected, stealth_capable
) VALUES
(
    'veh_scooter_basic', 'ZIP_50', 'Zip 50', 'MicroMoto', 2087,
    'Compact electric scooter. Perfect for quick urban deliveries.',
    'SCOOTER', 'ELECTRIC_SCOOTER', 'SMALL', 'COMMON',
    50, 7.0, 80, 65, 5,
    25, 0,
    1, 20, 35, 0,
    'ELECTRIC', 15.0, 0.02, 750, 1.0,
    1, 0, 2000, 20, 10,
    1, 1, 0
),
(
    'veh_scooter_cargo', 'PORTER_MAX', 'Porter Max', 'WorkHorse', 2086,
    'Three-wheeled cargo scooter with large front container.',
    'SCOOTER', 'CARGO_SCOOTER', 'MEDIUM', 'UNCOMMON',
    45, 9.0, 60, 55, 10,
    45, 1,
    1, 80, 150, 0,
    'ELECTRIC', 25.0, 0.04, 625, 2.0,
    2, 0, 5500, 55, 30,
    1, 1, 0
);

-- CARS (Tier 3-4)
INSERT OR IGNORE INTO vehicle_definitions (
    id, code, name, manufacturer, model_year, description,
    vehicle_class, vehicle_type, size_category, rarity,
    top_speed_kmh, acceleration_0_100_seconds, handling_rating, braking_rating, offroad_capability,
    max_hull_points, armor_rating,
    passenger_capacity, cargo_capacity_kg, cargo_volume_liters, towing_capacity_kg,
    power_source, fuel_capacity, fuel_consumption_per_km, range_km, recharge_time_hours,
    required_tier, required_skill_level, base_price, insurance_cost_monthly, maintenance_cost_monthly,
    autopilot_level, network_connected, stealth_capable
) VALUES
(
    'veh_car_compact', 'THORTON_COLBY', 'Thorton Colby CX', 'Thorton', 2087,
    'Compact hatchback with surprising cargo space. Economical choice.',
    'CAR', 'COMPACT_CAR', 'MEDIUM', 'COMMON',
    160, 8.0, 60, 60, 20,
    100, 3,
    4, 150, 350, 500,
    'ELECTRIC', 60.0, 0.08, 750, 1.0,
    3, 1, 18000, 180, 90,
    2, 1, 0
),
(
    'veh_car_sedan', 'ARCHER_QUARTZ', 'Archer Quartz', 'Archer', 2087,
    'Mid-size sedan with excellent comfort and moderate cargo.',
    'CAR', 'SEDAN', 'MEDIUM', 'UNCOMMON',
    200, 6.0, 65, 70, 15,
    120, 4,
    5, 200, 500, 750,
    'ELECTRIC', 80.0, 0.10, 800, 1.5,
    3, 1, 35000, 350, 175,
    3, 1, 0
),
(
    'veh_car_muscle', 'QUADRA_TYPE66', 'Quadra Type-66', 'Quadra', 2085,
    'Classic muscle car design with modern tech. Fast and loud.',
    'CAR', 'MUSCLE_CAR', 'MEDIUM', 'RARE',
    280, 3.5, 55, 65, 10,
    140, 5,
    2, 80, 200, 500,
    'HYBRID', 70.0, 0.15, 470, 0.5,
    4, 2, 75000, 750, 400,
    2, 1, 0
),
(
    'veh_car_sports', 'RAYFIELD_CALIBURN', 'Rayfield Caliburn', 'Rayfield', 2087,
    'Hypercar performance in a sleek package. Status symbol.',
    'CAR', 'SPORTS_CAR', 'MEDIUM', 'LEGENDARY',
    350, 2.2, 90, 95, 5,
    80, 2,
    2, 30, 80, 0,
    'ELECTRIC', 50.0, 0.20, 250, 0.3,
    5, 3, 250000, 2500, 1500,
    4, 1, 1
);

-- VANS (Tier 2-4) - Key for delivery gameplay
INSERT OR IGNORE INTO vehicle_definitions (
    id, code, name, manufacturer, model_year, description,
    vehicle_class, vehicle_type, size_category, rarity,
    top_speed_kmh, acceleration_0_100_seconds, handling_rating, braking_rating, offroad_capability,
    max_hull_points, armor_rating,
    passenger_capacity, cargo_capacity_kg, cargo_volume_liters, towing_capacity_kg,
    power_source, fuel_capacity, fuel_consumption_per_km, range_km, recharge_time_hours,
    required_tier, required_skill_level, base_price, insurance_cost_monthly, maintenance_cost_monthly,
    autopilot_level, network_connected, stealth_capable
) VALUES
(
    'veh_van_small', 'THORTON_GALENA', 'Thorton Galena', 'Thorton', 2086,
    'Compact cargo van. The workhorse of urban delivery.',
    'VAN', 'CARGO_VAN', 'LARGE', 'COMMON',
    130, 10.0, 50, 55, 25,
    150, 4,
    2, 500, 2000, 1000,
    'ELECTRIC', 100.0, 0.12, 830, 2.0,
    2, 1, 25000, 250, 125,
    2, 1, 0
),
(
    'veh_van_medium', 'VILLEFORT_COLUMBUS', 'Villefort Columbus', 'Villefort', 2087,
    'Mid-size delivery van with climate control cargo bay.',
    'VAN', 'DELIVERY_VAN', 'LARGE', 'UNCOMMON',
    140, 9.0, 55, 60, 20,
    180, 5,
    3, 800, 4000, 1500,
    'HYBRID', 120.0, 0.14, 860, 2.5,
    3, 1, 45000, 450, 225,
    3, 1, 0
),
(
    'veh_van_armored', 'MILITECH_BEHEMOTH', 'Militech Behemoth', 'Militech', 2086,
    'Armored cargo van for high-value deliveries. Built like a tank.',
    'VAN', 'ARMORED_VAN', 'LARGE', 'RARE',
    120, 12.0, 40, 50, 35,
    300, 15,
    4, 600, 3000, 2000,
    'HYBRID', 150.0, 0.20, 750, 3.0,
    4, 2, 120000, 1200, 600,
    2, 1, 0
);

-- TRUCKS (Tier 4-5) - Heavy cargo
INSERT OR IGNORE INTO vehicle_definitions (
    id, code, name, manufacturer, model_year, description,
    vehicle_class, vehicle_type, size_category, rarity,
    top_speed_kmh, acceleration_0_100_seconds, handling_rating, braking_rating, offroad_capability,
    max_hull_points, armor_rating,
    passenger_capacity, cargo_capacity_kg, cargo_volume_liters, towing_capacity_kg,
    power_source, fuel_capacity, fuel_consumption_per_km, range_km, recharge_time_hours,
    required_tier, required_skill_level, base_price, insurance_cost_monthly, maintenance_cost_monthly,
    autopilot_level, network_connected, stealth_capable
) VALUES
(
    'veh_truck_pickup', 'THORTON_MACKINAW', 'Thorton Mackinaw', 'Thorton', 2086,
    'Rugged pickup truck. Great for oversized cargo.',
    'TRUCK', 'PICKUP_TRUCK', 'LARGE', 'COMMON',
    150, 8.0, 45, 50, 60,
    200, 6,
    4, 1000, 2500, 3000,
    'HYBRID', 100.0, 0.18, 555, 2.0,
    3, 1, 40000, 400, 200,
    2, 1, 0
),
(
    'veh_truck_box', 'KAUKAZ_BRATSK', 'Kaukaz Bratsk', 'Kaukaz', 2085,
    'Box truck for large deliveries. The backbone of logistics.',
    'TRUCK', 'BOX_TRUCK', 'XLARGE', 'UNCOMMON',
    100, 15.0, 35, 40, 40,
    250, 8,
    3, 2000, 15000, 5000,
    'DIESEL', 200.0, 0.25, 800, 0.0,
    4, 2, 80000, 800, 400,
    2, 1, 0
),
(
    'veh_truck_semi', 'KAUKAZ_ZEYA', 'Kaukaz Zeya', 'Kaukaz', 2084,
    'Semi-truck for massive cargo hauls. Requires special license.',
    'TRUCK', 'SEMI_TRUCK', 'XLARGE', 'RARE',
    120, 20.0, 25, 35, 30,
    400, 10,
    2, 5000, 50000, 20000,
    'DIESEL', 400.0, 0.35, 1140, 0.0,
    5, 3, 200000, 2000, 1000,
    2, 1, 0
);

-- SUVs (Tier 3-4) - All-terrain capability
INSERT OR IGNORE INTO vehicle_definitions (
    id, code, name, manufacturer, model_year, description,
    vehicle_class, vehicle_type, size_category, rarity,
    top_speed_kmh, acceleration_0_100_seconds, handling_rating, braking_rating, offroad_capability,
    max_hull_points, armor_rating,
    passenger_capacity, cargo_capacity_kg, cargo_volume_liters, towing_capacity_kg,
    power_source, fuel_capacity, fuel_consumption_per_km, range_km, recharge_time_hours,
    required_tier, required_skill_level, base_price, insurance_cost_monthly, maintenance_cost_monthly,
    autopilot_level, network_connected, stealth_capable
) VALUES
(
    'veh_suv_standard', 'VILLEFORT_ALVARADO', 'Villefort Alvarado', 'Villefort', 2087,
    'Versatile SUV with all-terrain capability. Luxury meets utility.',
    'SUV', 'CROSSOVER_SUV', 'LARGE', 'UNCOMMON',
    180, 7.0, 55, 60, 50,
    160, 6,
    5, 400, 1200, 2000,
    'HYBRID', 90.0, 0.14, 640, 1.5,
    3, 1, 55000, 550, 275,
    3, 1, 0
),
(
    'veh_suv_tactical', 'MILITECH_WYVERN', 'Militech Wyvern', 'Militech', 2086,
    'Tactical SUV with military-grade armor. For hostile deliveries.',
    'SUV', 'TACTICAL_SUV', 'LARGE', 'EPIC',
    160, 8.0, 50, 55, 70,
    280, 18,
    6, 350, 1000, 3000,
    'HYBRID', 120.0, 0.18, 670, 2.0,
    4, 2, 150000, 1500, 750,
    2, 1, 0
);

-- QUADCOPTER (Tier 4+) - Aerial delivery
INSERT OR IGNORE INTO vehicle_definitions (
    id, code, name, manufacturer, model_year, description,
    vehicle_class, vehicle_type, size_category, rarity,
    top_speed_kmh, acceleration_0_100_seconds, handling_rating, braking_rating, offroad_capability,
    max_hull_points, armor_rating,
    passenger_capacity, cargo_capacity_kg, cargo_volume_liters, towing_capacity_kg,
    power_source, fuel_capacity, fuel_consumption_per_km, range_km, recharge_time_hours,
    required_tier, required_skill_level, base_price, insurance_cost_monthly, maintenance_cost_monthly,
    autopilot_level, network_connected, stealth_capable
) VALUES
(
    'veh_quad_cargo', 'AV_SURVEYOR', 'AV Surveyor', 'Zetatech', 2087,
    'Cargo quadcopter for aerial delivery. Bypasses traffic.',
    'QUADCOPTER', 'CARGO_DRONE', 'MEDIUM', 'RARE',
    200, 3.0, 80, 90, 100,
    60, 2,
    0, 100, 200, 0,
    'ELECTRIC', 50.0, 0.10, 500, 1.0,
    4, 2, 100000, 1000, 500,
    4, 1, 1
),
(
    'veh_quad_passenger', 'DELAMAIN_EXCELSIOR', 'Delamain Excelsior', 'Delamain', 2087,
    'Autonomous air taxi. Premium transport solution.',
    'QUADCOPTER', 'AIR_TAXI', 'LARGE', 'LEGENDARY',
    250, 2.5, 85, 85, 100,
    100, 5,
    4, 150, 400, 0,
    'ELECTRIC', 80.0, 0.15, 530, 0.5,
    5, 3, 500000, 5000, 2500,
    5, 1, 1
);

-- Create index for vehicle catalog queries
CREATE INDEX IF NOT EXISTS idx_vehicle_defs_class ON vehicle_definitions(vehicle_class);
CREATE INDEX IF NOT EXISTS idx_vehicle_defs_tier ON vehicle_definitions(required_tier);
CREATE INDEX IF NOT EXISTS idx_vehicle_defs_price ON vehicle_definitions(base_price);
