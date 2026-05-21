
import { BaseService, type ServiceContext } from '../base';
// import { nanoid } from 'nanoid';

// =============================================================================
// TYPES
// =============================================================================

export interface DroneDefinition {
    id: string;
    code: string;
    name: string;
    manufacturer: string;
    description: string;
    drone_class: string; // 'MICRO', 'MINI', 'STANDARD', 'HEAVY'
    drone_role: string; // 'SCOUT', 'COMBAT', 'SUPPORT', 'CARGO'
    size_category: string;
    rarity: string;

    // Performance
    max_speed_kmh: number;
    acceleration: number;
    maneuverability: number;
    hover_capable: number; // boolean
    max_altitude_m: number;
    noise_level: number;

    // Durability
    max_hull_points: number;
    armor_rating: number;
    emp_resistance: number;

    // Power
    battery_capacity_minutes: number;
    recharge_time_minutes: number;
    solar_capable: number; // boolean

    // Payload
    max_payload_kg: number;
    cargo_volume_liters: number;
    weapon_mounts: number;
    tool_mounts: number;

    // Sensors
    sensor_suite: string | null; // JSON
    stealth_detection: number;
    targeting_accuracy: number;

    // Control
    autonomous_level: number;
    control_range_km: number;
    requires_neural_link: number; // boolean
    swarm_compatible: number; // boolean
    max_swarm_size: number;

    // Meta
    required_tier: number;
    base_price: number;
}

export interface CharacterDrone {
    id: string;
    character_id: string;
    drone_definition_id: string;
    acquired_at: string;

    // Identity
    custom_name: string | null;
    serial_number: string | null;
    paint_scheme: string | null; // JSON

    // State
    current_state: 'STORED' | 'DEPLOYED' | 'HOVERING' | 'MOVING' | 'ENGAGING' | 'RETURNING' | 'CHARGING' | 'DAMAGED' | 'DESTROYED';
    current_location_id: string | null;
    current_coordinates: string | null; // JSON
    altitude_m: number | null;

    // Vitals
    current_hull_points: number;
    current_battery: number;

    // Flags
    is_deployed: number; // boolean
    is_autonomous: number; // boolean

    // Loadout
    equipped_weapons: string | null; // JSON
    equipped_tools: string | null; // JSON
    current_cargo: string | null; // JSON

    // Swarm
    swarm_id: string | null;
    swarm_role: string | null;
    formation_position: number | null;

    // Tracking
    total_flight_hours: number;
    total_missions: number;
    successful_missions: number;
    times_destroyed: number;

    // Joined
    definition?: DroneDefinition;
}

export interface DroneSwarm {
    id: string;
    character_id: string;
    name: string;

    // Composition
    swarm_type: string | null;
    max_size: number;
    current_size: number;
    homogeneous: number; // boolean

    // State
    current_state: string;
    current_formation: string | null;
    center_coordinates: string | null; // JSON
    formation_radius_m: number | null;

    // Behavior
    current_behavior: string | null;
    target_id: string | null;
    target_type: string | null;

    // Stats
    coordination_bonus: number;
    sensor_coverage_bonus: number;
    intimidation_factor: number;
    effective_speed: number | null;
    effective_range: number | null;
    sync_quality: number;

    created_at: string;
    updated_at: string;

    // Joined
    drones?: CharacterDrone[];
}

export interface CreateSwarmDTO {
    name: string;
    characterId: string;
    droneIds: string[];
    swarmType?: string;
    formation?: string;
}

// =============================================================================
// SERVICE
// =============================================================================

export class DroneService extends BaseService {
    constructor(context: ServiceContext) {
        super(context);
    }

    // -------------------------------------------------------------------------
    // READ OPERATIONS
    // -------------------------------------------------------------------------

    async getDroneDefinitions(filters?: { role?: string; tier?: number; swarmCompatible?: boolean }): Promise<DroneDefinition[]> {
        let query = `SELECT * FROM drone_definitions WHERE 1=1`;
        const params: any[] = [];

        if (filters?.role) {
            query += ` AND drone_role = ?`;
            params.push(filters.role);
        }
        if (filters?.tier) {
            query += ` AND required_tier <= ?`;
            params.push(filters.tier);
        }
        if (filters?.swarmCompatible) {
            query += ` AND swarm_compatible = 1`;
        }

        query += ` ORDER BY base_price ASC`;
        return this.queryAll<DroneDefinition>(query, ...params);
    }

    async getDroneDefinition(id: string): Promise<DroneDefinition | null> {
        return this.query<DroneDefinition>(`SELECT * FROM drone_definitions WHERE id = ?`, id);
    }

    async getPlayerDrones(characterId: string): Promise<CharacterDrone[]> {
        const drones = await this.queryAll<CharacterDrone>(
            `SELECT cd.*, dd.*, cd.id as id, dd.id as definition_id
             FROM character_drones cd
             JOIN drone_definitions dd ON cd.drone_definition_id = dd.id
             WHERE cd.character_id = ?
             ORDER BY cd.is_deployed DESC, cd.acquired_at DESC`,
            characterId
        );

        // Map raw join results to structured objects if needed, 
        // but cleaner to standardise property access in API
        return drones;
    }

    async getDroneDetails(droneId: string): Promise<CharacterDrone | null> {
        const row = await this.query<any>(
            `SELECT cd.*, 
                    dd.id as def_id, dd.code, dd.name as def_name, dd.manufacturer, 
                    dd.drone_class, dd.drone_role, dd.max_hull_points as def_max_hull,
                    dd.battery_capacity_minutes, dd.max_speed_kmh
             FROM character_drones cd
             JOIN drone_definitions dd ON cd.drone_definition_id = dd.id
             WHERE cd.id = ?`,
            droneId
        );

        if (!row) return null;

        // Construct with embedded definition for cleaner API consumption
        const drone: CharacterDrone = {
            ...row,
            definition: {
                id: row.def_id,
                code: row.code,
                name: row.def_name,
                manufacturer: row.manufacturer,
                drone_class: row.drone_class,
                drone_role: row.drone_role,
                max_hull_points: row.def_max_hull,
                battery_capacity_minutes: row.battery_capacity_minutes,
                max_speed_kmh: row.max_speed_kmh,
                // ... map other definition fields as needed or perform full fetch
            }
        };

        return drone;
    }

    async getPlayerSwarms(characterId: string): Promise<DroneSwarm[]> {
        const swarms = await this.queryAll<DroneSwarm>(
            `SELECT * FROM drone_swarms WHERE character_id = ?`,
            characterId
        );

        // Ideally, we'd fetch drones for each swarm here, but that's N+1.
        // Better to let the controller handle expansion or do a complex join.
        return swarms;
    }

    async getSwarmDetails(swarmId: string): Promise<DroneSwarm | null> {
        const swarm = await this.query<DroneSwarm>(
            `SELECT * FROM drone_swarms WHERE id = ?`,
            swarmId
        );
        if (!swarm) return null;

        const drones = await this.queryAll<CharacterDrone>(
            `SELECT * FROM character_drones WHERE swarm_id = ?`,
            swarmId
        );

        swarm.drones = drones;
        return swarm;
    }

    // -------------------------------------------------------------------------
    // WRITE OPERATIONS - MANAGEMENT
    // -------------------------------------------------------------------------

    async purchaseDrone(characterId: string, droneDefId: string, customName?: string): Promise<{ success: boolean; droneId?: string; message: string }> {
        const droneDef = await this.getDroneDefinition(droneDefId);
        if (!droneDef) return { success: false, message: 'Drone definition not found' };

        const balance = await this.query<{ credits: number }>(`SELECT primary_currency_balance as credits FROM character_finances WHERE character_id = ?`, characterId);
        if (!balance || balance.credits < droneDef.base_price) {
            return { success: false, message: 'Insufficient credits' };
        }

        try {
            const droneId = `drone-${crypto.randomUUID()}`;

            // Use batch for atomic-like operation
            await this.db.batch([
                this.db.prepare(`UPDATE character_finances SET primary_currency_balance = primary_currency_balance - ? WHERE character_id = ?`)
                    .bind(droneDef.base_price, characterId),
                this.db.prepare(`
                    INSERT INTO character_drones (
                        id, character_id, drone_definition_id, custom_name,
                        current_battery,
                        current_hull_points,
                        current_state, acquired_at
                    ) VALUES (
                        ?, ?, ?, ?,
                        100,
                        ?,
                        'STORED', datetime('now')
                    )
                `).bind(
                    droneId, characterId, droneDefId, customName || droneDef.name,
                    droneDef.max_hull_points
                )
            ]);

            return { success: true, message: 'Drone acquired' };
        } catch (e) {
            console.error('Purchase failed', e);
            return { success: false, message: 'Transaction failed' };
        }
    }

    async customizeDrone(droneId: string, updates: { name?: string; paint?: any }): Promise<void> {
        const sets: string[] = [];
        const params: any[] = [];

        if (updates.name) {
            sets.push('custom_name = ?');
            params.push(updates.name);
        }
        if (updates.paint) {
            sets.push('paint_scheme = ?');
            params.push(JSON.stringify(updates.paint));
        }

        if (sets.length === 0) return;

        params.push(droneId);
        await this.execute(`UPDATE character_drones SET ${sets.join(', ')} WHERE id = ?`, ...params);
    }

    async repairDrone(droneId: string): Promise<{ success: boolean; cost?: number; message: string }> {
        const drone = await this.getDroneDetails(droneId);
        if (!drone) return { success: false, message: 'Drone not found' };

        const def = await this.getDroneDefinition(drone.drone_definition_id);
        if (!def) return { success: false, message: 'Definition not found' };

        // Simple repair cost logic: 1 credit per hull point
        const missingHull = def.max_hull_points - drone.current_hull_points;
        const cost = Math.max(0, Math.ceil(missingHull * 1.5)); // 1.5 credits per point

        if (cost === 0) return { success: true, cost: 0, message: 'Drone already fully repaired' };

        // Check funds
        const balance = await this.query<{ credits: number }>(`SELECT primary_currency_balance as credits FROM character_finances WHERE character_id = ?`, drone.character_id);
        if (!balance || balance.credits < cost) {
            return { success: false, message: `Insufficient credits. Repair costs ${cost}` };
        }

        // Use batch
        await this.db.batch([
            this.db.prepare(`UPDATE character_finances SET primary_currency_balance = primary_currency_balance - ? WHERE character_id = ?`)
                .bind(cost, drone.character_id),
            this.db.prepare(`UPDATE character_drones SET current_hull_points = ? WHERE id = ?`)
                .bind(def.max_hull_points, droneId)
        ]);

        return { success: true, cost, message: 'Drone repaired' };
    }

    // -------------------------------------------------------------------------
    // WRITE OPERATIONS - OPERATIONS (DEPLOY/RECALL)
    // -------------------------------------------------------------------------

    async deployDrone(droneId: string, locationId: string): Promise<{ success: boolean; message: string }> {
        const drone = await this.getDroneDetails(droneId);
        if (!drone) return { success: false, message: 'Drone not found' };
        if (drone.current_state !== 'STORED') return { success: false, message: 'Drone not in storage' };

        await this.execute(`
            UPDATE character_drones 
            SET current_state = 'DEPLOYED', current_location_id = ?, is_deployed = 1 
            WHERE id = ?
        `, locationId, droneId);

        return { success: true, message: 'Drone deployed' };
    }

    async recallDrone(droneId: string): Promise<{ success: boolean; message: string }> {
        await this.execute(`
            UPDATE character_drones 
            SET current_state = 'STORED', current_location_id = NULL, is_deployed = 0 
            WHERE id = ?
        `, droneId);

        return { success: true, message: 'Drone recalled' };
    }

    // -------------------------------------------------------------------------
    // WRITE OPERATIONS - SWARMS
    // -------------------------------------------------------------------------

    async createSwarm(data: CreateSwarmDTO): Promise<{ success: boolean; swarmId?: string; message: string }> {
        // Validate drone ownership and availability
        const drones = await this.queryAll<CharacterDrone>(
            `SELECT * FROM character_drones WHERE id IN (${data.droneIds.map(() => '?').join(',')}) AND character_id = ?`,
            ...data.droneIds, data.characterId
        );

        if (drones.length !== data.droneIds.length) {
            return { success: false, message: 'One or more drones not found or not owned' };
        }

        const swarmId = `swarm-${crypto.randomUUID()}`;

        const statements: any[] = [];

        // Create Swarm
        statements.push(this.db.prepare(`
            INSERT INTO drone_swarms (
                id, character_id, name, swarm_type, 
                current_formation, current_size, max_size,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
            swarmId, data.characterId, data.name, data.swarmType || 'GENERIC',
            data.formation || 'V_SHAPE', drones.length, 10
        ));

        // Assign Drones
        for (let i = 0; i < data.droneIds.length; i++) {
            statements.push(this.db.prepare(`
                UPDATE character_drones 
                SET swarm_id = ?, swarm_role = 'MEMBER', formation_position = ? 
                WHERE id = ?
            `).bind(swarmId, i + 1, data.droneIds[i]));
        }

        await this.db.batch(statements);

        return { success: true, swarmId, message: 'Swarm created' };
    }

    async disbandSwarm(swarmId: string): Promise<void> {
        await this.db.batch([
            this.db.prepare(`UPDATE character_drones SET swarm_id = NULL, swarm_role = NULL, formation_position = NULL WHERE swarm_id = ?`).bind(swarmId),
            this.db.prepare(`DELETE FROM drone_swarms WHERE id = ?`).bind(swarmId)
        ]);
    }

    async commandSwarm(swarmId: string, command: string, target?: string): Promise<{ success: boolean; message: string }> {
        // Placeholder for swarm AI/Logic
        // Would integrate with WorldService/CombatService here

        await this.execute(
            `UPDATE drone_swarms SET current_behavior = ?, target_id = ? WHERE id = ?`,
            command, target || null, swarmId
        );

        return { success: true, message: `Swarm executing: ${command}` };
    }
}
