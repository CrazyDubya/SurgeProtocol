
PRAGMA foreign_keys = OFF;

INSERT OR IGNORE INTO enum_vehicle_class (value) VALUES ('SCOOTER'), ('BIKE'), ('VAN'), ('CAR'), ('TRUCK'), ('SUV'), ('QUADCOPTER');

INSERT OR REPLACE INTO vehicle_definitions (
    id, code, name, manufacturer, description,
    vehicle_class, vehicle_type, base_price,
    max_hull_points, fuel_capacity, cargo_capacity_kg,
    top_speed_kmh, handling_rating,
    created_at, updated_at
) VALUES 
('ac14b9ad-168a-42fa-912f-98660cceeea7', 'SCOOTER_BASIC', 'Vespa Bolt', 'Bolt Motors', 'A reliable, if uninspired, electric scooter. Perfect for beginners.', 'SCOOTER', 'GROUND', 500, 50, 40, 20, 60, 8, datetime('now'), datetime('now')),
('30d4448b-d457-4b26-bc4b-45fddcac373a', 'BIKE_COURIER', 'Kinesis Dash', 'Kinesis', 'Lightweight delivery bike favored by courier guilds.', 'BIKE', 'GROUND', 1200, 80, 60, 40, 120, 9, datetime('now'), datetime('now')),
('9a80d668-f262-4963-b02d-6abaf46a413a', 'VAN_MULE', 'Mule Hauler', 'Heavy Ind.', 'Rugged transport van. Slow but carries a lot.', 'VAN', 'GROUND', 4500, 200, 100, 500, 90, 4, datetime('now'), datetime('now'));
