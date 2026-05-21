
import type { D1Database } from '@cloudflare/workers-types';
import { getCharacter, getCharacterAttributes, createCharacter as dbCreateCharacter } from '../../db';
import { ItemService } from '../items/item';
import { calculateCarryCapacity, calculateMaxHP, calculateMemoryCapacity } from '../../game/mechanics';
import { generateTokenPair } from '../../middleware/auth';

export class CharacterService {
    private itemService: ItemService;

    constructor(private db: D1Database) {
        this.itemService = new ItemService(db);
    }

    private calculateDerivedStats(attributes: Record<string, number>, tier: number) {
        const pwr = attributes['PWR'] || 5;
        const int = attributes['INT'] || 5;
        const agi = attributes['AGI'] || 5;
        const prc = attributes['PRC'] || 5;
        const end = attributes['END'] || 5;
        const vel = attributes['VEL'] || 5;

        return {
            carryCapacity: calculateCarryCapacity(pwr),
            memoryCapacity: calculateMemoryCapacity(int),
            initiative: agi + prc,
            maxHp: calculateMaxHP(end, pwr, tier),
            movementSpeed: 4 + (agi * 0.5) + (vel * 0.5),
            hackingSlots: Math.max(1, Math.floor(int / 2)),
        };
    }

    async createCharacter(userId: string, data: any, startLocationId: string | undefined) {
        // Check character limit
        const existingCount = await this.db
            .prepare('SELECT COUNT(*) as count FROM characters WHERE player_id = ?')
            .bind(userId)
            .first<{ count: number }>();

        if (existingCount && existingCount.count >= 3) {
            throw new Error('Maximum 3 characters per account');
        }

        // Check handle uniqueness
        if (data.handle) {
            const handleExists = await this.db
                .prepare('SELECT id FROM characters WHERE handle = ?')
                .bind(data.handle)
                .first();

            if (handleExists) {
                throw new Error('Handle already in use');
            }
        }

        // Validate attribute points
        if (data.attributes) {
            const totalPoints = Object.values(data.attributes).reduce((sum: any, v: any) => sum + v, 0);
            const numAttributes = Object.keys(data.attributes).length;
            const expectedPoints = (numAttributes * 5) + 4;

            if (totalPoints !== expectedPoints) {
                throw new Error(`Attribute points must total ${expectedPoints}, got ${totalPoints}`);
            }
        }

        // Create character
        const characterId = await dbCreateCharacter(this.db, {
            playerId: userId,
            legalName: data.legalName,
            streetName: data.streetName,
            handle: data.handle,
            sex: data.sex,
            age: data.age,
            currentLocationId: startLocationId
        });

        // Initialize finances
        const financeId = crypto.randomUUID();
        await this.db.prepare(`
            INSERT INTO character_finances (id, character_id, primary_currency_balance)
            VALUES (?, ?, ?)
        `).bind(financeId, characterId, 1000).run();

        // Grant starter vehicle
        const starterVehicleCode = 'ZIP_50';
        const vehicleDef = await this.db.prepare('SELECT id, max_hull_points, fuel_capacity FROM vehicle_definitions WHERE code = ?')
            .bind(starterVehicleCode).first<{ id: string, max_hull_points: number, fuel_capacity: number }>();

        if (vehicleDef) {
            const vehicleId = crypto.randomUUID();
            await this.db.prepare(`
                INSERT INTO character_vehicles (
                    id, character_id, vehicle_definition_id, 
                    current_hull_points, current_fuel, 
                    is_registered, owned_outright,
                    current_location_id
                ) VALUES (?, ?, ?, ?, ?, 1, 1, ?)
            `).bind(
                vehicleId,
                characterId,
                vehicleDef.id,
                vehicleDef.max_hull_points,
                vehicleDef.fuel_capacity,
                startLocationId || null
            ).run();

            await this.db.prepare('UPDATE characters SET active_vehicle_id = ? WHERE id = ?')
                .bind(vehicleId, characterId).run();
        }

        // Initialize attributes
        if (data.attributes) {
            const attributeCodes = ['PWR', 'AGI', 'END', 'VEL', 'INT', 'RSN', 'EMP', 'PRC', 'PRE'];
            for (const code of attributeCodes) {
                const value = (data.attributes as any)[code] ?? 5;
                const attrDef = await this.db
                    .prepare('SELECT id FROM attribute_definitions WHERE code = ?')
                    .bind(code)
                    .first<{ id: string }>();

                if (attrDef) {
                    await this.db
                        .prepare(
                            `INSERT INTO character_attributes (id, character_id, attribute_id, base_value, current_value)
                             VALUES (?, ?, ?, ?, ?)`
                        )
                        .bind(crypto.randomUUID(), characterId, attrDef.id, value, value)
                        .run();
                }
            }
        }

        const character = await getCharacter(this.db, characterId);
        return this.mapCharacter(character);
    }

    async listCharacters(userId: string) {
        const result = await this.db
            .prepare(
                `SELECT id, legal_name, street_name, handle, current_tier, carrier_rating,
                        current_health, max_health, is_active, created_at
                 FROM characters
                 WHERE player_id = ?
                 ORDER BY is_active DESC, updated_at DESC`
            )
            .bind(userId)
            .all<any>();

        return (result.results || []).map(char => ({
            id: char.id,
            legalName: char.legal_name,
            streetName: char.street_name,
            handle: char.handle,
            currentTier: char.current_tier,
            carrierRating: char.carrier_rating,
            currentHealth: char.current_health,
            maxHealth: char.max_health,
            isActive: char.is_active,
            createdAt: char.created_at,
        }));
    }

    async getCharacterDetails(userId: string, characterId: string) {
        const character = await this.db
            .prepare(`SELECT * FROM characters WHERE id = ? AND player_id = ?`)
            .bind(characterId, userId)
            .first<any>();

        if (!character) return null;

        const attributes = await getCharacterAttributes(this.db, characterId);
        const ratingComponents = await this.db
            .prepare('SELECT * FROM rating_components WHERE character_id = ?')
            .bind(characterId)
            .first();

        // Calculate derived stats based on attributes
        const attrMap: Record<string, number> = {};
        for (const attr of attributes) {
            // attr is typed as CharacterAttribute but query includes attribute_code
            const code = (attr as any).attribute_code;
            if (code) {
                attrMap[code] = attr.current_value;
            }
        }

        return {
            character: this.mapCharacter(character),
            attributes,
            derivedStats: this.calculateDerivedStats(attrMap, character.current_tier || 1),
            ratingComponents,
        };
    }

    async updateCharacter(userId: string, characterId: string, updates: any) {
        // Ownership check
        const character = await this.db
            .prepare('SELECT id FROM characters WHERE id = ? AND player_id = ?')
            .bind(characterId, userId)
            .first();

        if (!character) throw new Error('Character not found');

        if (updates.handle) {
            const handleExists = await this.db
                .prepare('SELECT id FROM characters WHERE handle = ? AND id != ?')
                .bind(updates.handle, characterId)
                .first();

            if (handleExists) throw new Error('Handle already in use');
        }

        const setClauses: string[] = ["updated_at = datetime('now')"];
        const values: any[] = [];

        if (updates.streetName !== undefined) {
            setClauses.push('street_name = ?');
            values.push(updates.streetName);
        }
        if (updates.handle !== undefined) {
            setClauses.push('handle = ?');
            values.push(updates.handle);
        }

        values.push(characterId);

        await this.db
            .prepare(`UPDATE characters SET ${setClauses.join(', ')} WHERE id = ?`)
            .bind(...values)
            .run();

        const updated = await getCharacter(this.db, characterId);
        return this.mapCharacter(updated);
    }

    async selectCharacter(userId: string, characterId: string, jwtSecret: string) {
        const character = await this.db
            .prepare('SELECT id, is_dead FROM characters WHERE id = ? AND player_id = ?')
            .bind(characterId, userId)
            .first<{ id: string; is_dead: number }>();

        if (!character) throw new Error('Character not found');
        if (character.is_dead) throw new Error('Cannot select a dead character');

        await this.db.prepare('UPDATE characters SET is_active = 0 WHERE player_id = ?').bind(userId).run();
        await this.db.prepare("UPDATE characters SET is_active = 1, last_played = datetime('now') WHERE id = ?")
            .bind(characterId).run();

        return await generateTokenPair(userId, characterId, jwtSecret);
    }

    async getCharacterStats(userId: string, characterId: string) {
        const character = await this.db
            .prepare('SELECT id, current_tier FROM characters WHERE id = ? AND player_id = ?')
            .bind(characterId, userId)
            .first<{ id: string; current_tier: number }>();

        if (!character) throw new Error('Character not found');

        const attributes = await this.db
            .prepare(
                `SELECT ad.code, ad.name, ca.base_value, ca.current_value,
                        ca.bonus_from_augments, ca.bonus_from_items, ca.bonus_from_conditions,
                        (ca.current_value + ca.bonus_from_augments + ca.bonus_from_items +
                         ca.bonus_from_conditions + ca.temporary_modifier) as effective_value
                 FROM character_attributes ca
                 JOIN attribute_definitions ad ON ca.attribute_id = ad.id
                 WHERE ca.character_id = ?`
            )
            .bind(characterId)
            .all<any>();

        const skills = await this.db
            .prepare(
                `SELECT sd.code, sd.name, cs.current_level, cs.current_xp as xp_invested
                 FROM character_skills cs
                 JOIN skill_definitions sd ON cs.skill_id = sd.id
                 WHERE cs.character_id = ?`
            )
            .bind(characterId)
            .all<any>();

        const equipped = await this.db
            .prepare(
                `SELECT ci.equipped_slot, id.name, id.item_type, id.rarity
                 FROM character_inventory ci
                 JOIN item_definitions id ON ci.item_definition_id = id.id
                 WHERE ci.character_id = ? AND ci.equipped_slot IS NOT NULL`
            )
            .bind(characterId)
            .all<any>();

        const conditions = await this.db
            .prepare(
                `SELECT cc.*, cc.description as effect_description
                 FROM character_conditions cc
                 WHERE cc.character_id = ?`
            )
            .bind(characterId)
            .all<any>();

        const vehicle = await this.db
            .prepare(
                `SELECT cv.*, vd.name as vehicle_name, vd.id as vehicle_def_id
                 FROM characters c
                 JOIN character_vehicles cv ON c.active_vehicle_id = cv.id
                 JOIN vehicle_definitions vd ON cv.vehicle_definition_id = vd.id
                 WHERE c.id = ?`
            )
            .bind(characterId)
            .first<any>();

        return {
            attributes: (attributes.results || []).reduce((acc: any, curr: any) => {
                acc[curr.code] = curr.effective_value;
                return acc;
            }, {}),
            derivedStats: this.calculateDerivedStats((attributes.results || []).reduce((acc: any, curr: any) => {
                acc[curr.code] = curr.effective_value;
                return acc;
            }, {}), character.current_tier || 1),
            skills: (skills.results || []).reduce((acc: any, curr: any) => {
                acc[curr.code] = curr.current_level;
                return acc;
            }, {}),
            equipped: equipped.results || [],
            conditions: conditions.results || [],
            activeVehicle: vehicle || null,
        };
    }

    async getCharacterInventory(userId: string, characterId: string) {
        const character = await this.db
            .prepare('SELECT id FROM characters WHERE id = ? AND player_id = ?')
            .bind(characterId, userId)
            .first();

        if (!character) throw new Error('Character not found');

        const { items } = await this.itemService.getInventory(characterId);
        const finances = await this.db
            .prepare('SELECT * FROM character_finances WHERE character_id = ?')
            .bind(characterId)
            .first<any>();

        // Need power for capacity
        const powerAttr = await this.db.prepare(`
            SELECT (ca.current_value + ca.bonus_from_augments + ca.bonus_from_items +
                    ca.bonus_from_conditions + ca.temporary_modifier) as effective_value
            FROM character_attributes ca
            JOIN attribute_definitions ad ON ca.attribute_id = ad.id
            WHERE ca.character_id = ? AND ad.code = 'PWR'
        `).bind(characterId).first<{ effective_value: number }>();

        return {
            inventory: items,
            capacity: {
                used: items.reduce((sum: number, item: any) => sum + ((item.weight || 0) * item.quantity), 0),
                max: calculateCarryCapacity(powerAttr?.effective_value || 5),
            },
            finances: finances ? {
                credits: finances.primary_currency_balance || 0,
                creditsLifetime: finances.total_earned_career || 0,
                escrowHeld: finances.escrow_balance || 0,
                debt: finances.debt_balance || 0,
            } : null,
        };
    }

    async getCharacterFactions(userId: string, characterId: string) {
        const character = await this.db
            .prepare('SELECT id FROM characters WHERE id = ? AND player_id = ?')
            .bind(characterId, userId)
            .first();

        if (!character) throw new Error('Character not found');

        const standings = await this.db
            .prepare(
                `SELECT cr.*, f.name as faction_name, f.faction_type
                 FROM character_reputations cr
                 JOIN factions f ON cr.faction_id = f.id
                 WHERE cr.character_id = ?
                 ORDER BY cr.current_value DESC`
            )
            .bind(characterId)
            .all<any>();

        return standings.results || [];
    }

    private mapCharacter(char: any) {
        return {
            ...char,
            legalName: char.legal_name,
            streetName: char.street_name,
            currentTier: char.current_tier,
            carrierRating: char.carrier_rating,
            currentHealth: char.current_health,
            maxHealth: char.max_health,
            isActive: char.is_active,
            createdAt: char.created_at,
            updatedAt: char.updated_at,
            playerId: char.player_id,
            omnideliverId: char.omnideliver_id,
            corporateStanding: char.corporate_standing,
            employeeSince: char.employee_since,
            xpToNextTier: char.xp_to_next_tier,
            lifetimeXp: char.lifetime_xp,
            trackId: char.track_id,
            specializationId: char.specialization_id,
            convergencePath: char.convergence_path,
            ratingVisible: char.rating_visible,
            ratingHiddenModifier: char.rating_hidden_modifier,
            totalDeliveries: char.total_deliveries,
            perfectDeliveries: char.perfect_deliveries,
            failedDeliveries: char.failed_deliveries,
            currentStamina: char.current_stamina,
            maxStamina: char.max_stamina,
            currentHumanity: char.current_humanity,
            maxHumanity: char.max_humanity,
            consciousnessState: char.consciousness_state,
            networkIntegrationLevel: char.network_integration_level,
            forkCount: char.fork_count,
            currentLocationId: char.current_location_id,
            homeLocationId: char.home_location_id,
            isDead: char.is_dead,
            deathTimestamp: char.death_timestamp,
            deathCause: char.death_cause,
            totalPlaytimeSeconds: char.total_playtime_seconds,
            lastPlayed: char.last_played,
        };
    }
}
