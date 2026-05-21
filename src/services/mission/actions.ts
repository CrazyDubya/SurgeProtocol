/**
 * Surge Protocol - Mission Action Service
 *
 * Handles in-mission action processing: movement, skill checks,
 * combat initiation, dialogue, stealth, item use, and waiting.
 * Also provides vehicle integration and complication/objective queries.
 */

import { BaseService, type ServiceContext } from '../base/index';
import type {
    ActiveVehicleInfo,
    VehicleValidationResult,
    MissionActionResult,
    DialogueEffect,
} from './types';
import {
    getCharacterCombatData,
    generateProceduralEnemy,
    getSkillCheckData,
} from '../../db/queries';
import {
    getActiveDistrictEvents,
    getEffectiveModifiers,
} from '../../game/events/district';
import { updateQuestProgress, startQuestFromTrigger } from '../../api/quests';
import type { Combatant } from '../../game/mechanics/combat';

// =============================================================================
// EXTENDED CONTEXT (adds DurableObject namespace)
// =============================================================================

export interface MissionActionContext extends ServiceContext {
    combatSession?: DurableObjectNamespace;
}

// =============================================================================
// VEHICLE HELPERS (stateless, exported for reuse)
// =============================================================================

/**
 * Get character's active vehicle with definition details.
 */
export async function getActiveVehicle(
    db: D1Database,
    characterId: string
): Promise<ActiveVehicleInfo | null> {
    return db
        .prepare(`
      SELECT cv.id, cv.custom_name, cv.current_fuel, cv.current_hull_points,
             cv.is_damaged, cv.odometer_km, cv.total_deliveries,
             vd.vehicle_class, vd.cargo_capacity_kg, vd.top_speed_kmh,
             vd.handling_rating, vd.fuel_capacity
      FROM characters c
      JOIN character_vehicles cv ON c.active_vehicle_id = cv.id
      JOIN vehicle_definitions vd ON cv.vehicle_definition_id = vd.id
      WHERE c.id = ? AND cv.character_id = ?
    `)
        .bind(characterId, characterId)
        .first<ActiveVehicleInfo>();
}

/**
 * Check if vehicle can handle the mission requirements.
 */
export function validateVehicleForMission(
    vehicle: ActiveVehicleInfo,
    mission: {
        cargo_weight_kg: number | null;
        required_vehicle_class: string | null;
        mission_type: string;
    }
): VehicleValidationResult {
    const errors: Array<{ code: string; message: string }> = [];

    if (vehicle.is_damaged) {
        errors.push({
            code: 'VEHICLE_DAMAGED',
            message: 'Your active vehicle is damaged. Repair it before accepting missions.',
        });
    }

    const fuelPercent = (vehicle.current_fuel / vehicle.fuel_capacity) * 100;
    if (fuelPercent < 10) {
        errors.push({
            code: 'VEHICLE_LOW_FUEL',
            message: 'Your vehicle needs at least 10% fuel to start a mission.',
        });
    }

    if (mission.cargo_weight_kg && mission.cargo_weight_kg > vehicle.cargo_capacity_kg) {
        errors.push({
            code: 'CARGO_TOO_HEAVY',
            message: `Mission cargo (${mission.cargo_weight_kg}kg) exceeds vehicle capacity (${vehicle.cargo_capacity_kg}kg).`,
        });
    }

    if (mission.required_vehicle_class && mission.required_vehicle_class !== vehicle.vehicle_class) {
        errors.push({
            code: 'WRONG_VEHICLE_CLASS',
            message: `This mission requires a ${mission.required_vehicle_class}, but you have a ${vehicle.vehicle_class}.`,
        });
    }

    if (mission.mission_type === 'HAZMAT' && !['VAN', 'TRUCK'].includes(vehicle.vehicle_class)) {
        errors.push({
            code: 'HAZMAT_VEHICLE_REQUIRED',
            message: 'HAZMAT missions require a VAN or TRUCK with proper containment.',
        });
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Calculate time bonus based on vehicle speed.
 */
export function calculateVehicleTimeBonus(vehicleSpeed: number): number {
    const speedRatio = vehicleSpeed / 100;
    return Math.min(Math.max(speedRatio, 0.8), 1.2);
}

// =============================================================================
// MISSION ACTION SERVICE
// =============================================================================

export class MissionActionService extends BaseService {
    private readonly combatSession?: DurableObjectNamespace;

    constructor(context: MissionActionContext) {
        super(context);
        this.combatSession = context.combatSession;
    }

    // ---------------------------------------------------------------------------
    // MOVE
    // ---------------------------------------------------------------------------

    async processMove(
        instanceId: string,
        _characterId: string,
        params?: Record<string, unknown>
    ): Promise<MissionActionResult> {
        const destination = params?.destination as string | undefined;
        if (!destination) {
            return { success: false, outcome: 'NO_DESTINATION', details: { error: 'Destination required' } };
        }

        await this.db
            .prepare(
                `UPDATE character_missions
         SET current_state = json_set(COALESCE(current_state, '{}'), '$.location', ?)
         WHERE id = ?`
            )
            .bind(destination, instanceId)
            .run();

        const locationCheckpoint = await this.db
            .prepare(
                `SELECT id FROM mission_checkpoints
         WHERE mission_instance_id = ? AND checkpoint_type = 'REACH_LOCATION'
         AND is_completed = 0 AND checkpoint_data LIKE ?`
            )
            .bind(instanceId, `%${destination}%`)
            .first<{ id: string }>();

        if (locationCheckpoint) {
            await this.db
                .prepare("UPDATE mission_checkpoints SET is_completed = 1, completed_at = datetime('now') WHERE id = ?")
                .bind(locationCheckpoint.id)
                .run();
            return { success: true, outcome: 'CHECKPOINT_REACHED', details: { location: destination, checkpointCompleted: true } };
        }

        return { success: true, outcome: 'MOVED', details: { location: destination } };
    }

    // ---------------------------------------------------------------------------
    // SKILL CHECK
    // ---------------------------------------------------------------------------

    async processSkillCheck(
        _instanceId: string,
        characterId: string,
        params?: Record<string, unknown>
    ): Promise<MissionActionResult> {
        const skillCode = params?.skill as string | undefined;
        const difficulty = (params?.difficulty as number) ?? 10;

        if (!skillCode) {
            return { success: false, outcome: 'NO_SKILL', details: { error: 'Skill code required' } };
        }

        const checkData = await getSkillCheckData(this.db, characterId, skillCode);
        if (!checkData) {
            return { success: false, outcome: 'UNKNOWN_SKILL', details: { error: `Unknown skill: ${skillCode}` } };
        }

        const roll1 = Math.floor(Math.random() * 6) + 1;
        const roll2 = Math.floor(Math.random() * 6) + 1;
        const rollTotal = roll1 + roll2;
        const total = rollTotal + checkData.totalBonus;
        const success = total >= difficulty;
        const margin = total - difficulty;
        const isCriticalSuccess = rollTotal === 12;
        const isCriticalFailure = rollTotal === 2;

        let outcome = success ? 'SKILL_SUCCESS' : 'SKILL_FAILURE';
        if (isCriticalSuccess) outcome = 'CRITICAL_SUCCESS';
        if (isCriticalFailure) outcome = 'CRITICAL_FAILURE';

        return {
            success: success || isCriticalSuccess,
            outcome,
            details: {
                skill: checkData.skillCode,
                skillName: checkData.skillName,
                roll: [roll1, roll2],
                rollTotal,
                skillLevel: checkData.skillLevel,
                attributeModifier: checkData.attributeModifier,
                governingAttribute: checkData.governingAttribute
                    ? { code: checkData.governingAttribute.code, name: checkData.governingAttribute.name, value: checkData.governingAttribute.effectiveValue }
                    : null,
                equipmentBonus: checkData.equipmentBonus,
                conditionPenalty: checkData.conditionPenalty,
                totalBonus: checkData.totalBonus,
                total, difficulty, margin, isCriticalSuccess, isCriticalFailure,
            },
        };
    }

    // ---------------------------------------------------------------------------
    // INTERACT
    // ---------------------------------------------------------------------------

    async processInteraction(
        instanceId: string,
        _characterId: string,
        targetId?: string,
        _params?: Record<string, unknown>
    ): Promise<MissionActionResult> {
        if (!targetId) {
            return { success: false, outcome: 'NO_TARGET', details: { error: 'Target ID required for interaction' } };
        }

        const interactCheckpoint = await this.db
            .prepare(
                `SELECT id FROM mission_checkpoints
         WHERE mission_instance_id = ? AND checkpoint_type = 'INTERACT'
         AND is_completed = 0 AND checkpoint_data LIKE ?`
            )
            .bind(instanceId, `%${targetId}%`)
            .first<{ id: string }>();

        if (interactCheckpoint) {
            await this.db
                .prepare("UPDATE mission_checkpoints SET is_completed = 1, completed_at = datetime('now') WHERE id = ?")
                .bind(interactCheckpoint.id)
                .run();
            return { success: true, outcome: 'INTERACTION_COMPLETE', details: { targetId, checkpointCompleted: true } };
        }

        return { success: true, outcome: 'INTERACTED', details: { targetId } };
    }

    // ---------------------------------------------------------------------------
    // COMBAT
    // ---------------------------------------------------------------------------

    async processCombat(
        instanceId: string,
        characterId: string,
        missionTier: number,
        params?: Record<string, unknown>
    ): Promise<MissionActionResult> {
        if (!this.combatSession) {
            return { success: false, outcome: 'NO_COMBAT_SESSION', details: { error: 'Combat session not configured' } };
        }

        const instance = await this.db
            .prepare('SELECT current_state FROM character_missions WHERE id = ?')
            .bind(instanceId)
            .first<{ current_state: string | null }>();

        const currentState = instance?.current_state ? JSON.parse(instance.current_state) : {};

        if (currentState.activeCombatId) {
            return {
                success: false, outcome: 'COMBAT_ALREADY_ACTIVE',
                details: { combatId: currentState.activeCombatId, message: 'Resolve current combat before starting another' },
            };
        }

        const characterData = await getCharacterCombatData(this.db, characterId);
        if (!characterData) {
            return { success: false, outcome: 'CHARACTER_ERROR', details: { error: 'Could not load character combat data' } };
        }

        const character = await this.db
            .prepare('SELECT current_location_id FROM characters WHERE id = ?')
            .bind(characterId)
            .first<{ current_location_id: string | null }>();

        const districtId = character?.current_location_id || 'downtown';
        const activeEvents = this.cache ? await getActiveDistrictEvents(this.cache, districtId) : [];
        const modifiers = getEffectiveModifiers(activeEvents);
        const dangerMod = modifiers.get('ROUTE_DANGER') || 1.0;

        const playerCombatant: Combatant = {
            id: characterData.id,
            name: characterData.name,
            attributes: characterData.attributes,
            skills: characterData.skills,
            hp: characterData.currentHealth,
            hpMax: characterData.maxHealth,
            armor: characterData.equippedArmor
                ? { id: characterData.equippedArmor.id, name: characterData.equippedArmor.name, value: characterData.equippedArmor.value, agiPenalty: characterData.equippedArmor.agiPenalty, velPenalty: 0 }
                : null,
            weapon: characterData.equippedWeapon
                ? {
                    id: characterData.equippedWeapon.id, name: characterData.equippedWeapon.name,
                    type: characterData.equippedWeapon.type,
                    subtype: characterData.equippedWeapon.type === 'MELEE' ? 'LIGHT_MELEE' as const : 'HEAVY_PISTOL' as const,
                    baseDamage: characterData.equippedWeapon.baseDamage,
                    scalingAttribute: characterData.equippedWeapon.type === 'MELEE' ? 'PWR' : 'VEL',
                    scalingDivisor: 2,
                    attackMod: characterData.equippedWeapon.attackMod,
                }
                : null,
            cover: null,
            augmentBonuses: { initiative: 0, attack: 0, defense: 0, damage: 0 },
            conditions: [],
        };

        const enemyType = (params?.enemyType as 'GANGER' | 'CORPORATE' | 'DRONE' | 'BEAST' | 'BOSS') ?? 'GANGER';
        const enemyCount = Math.min((params?.enemyCount as number) ?? 1, 3);
        const effectiveEnemyCount = dangerMod > 1.5 ? Math.min(enemyCount + 1, 4) : enemyCount;

        const enemies: Combatant[] = [];
        for (let i = 0; i < effectiveEnemyCount; i++) {
            const enemy = generateProceduralEnemy(missionTier, enemyType);
            if (dangerMod > 1.0) {
                const hpBonus = Math.floor(enemy.hpMax * (dangerMod - 1));
                enemy.hp += hpBonus;
                enemy.hpMax += hpBonus;
                if (enemy.weapon) enemy.weapon.attackMod += Math.floor((dangerMod - 1) * 2);
                if (dangerMod > 1.3) enemy.name = `Elite ${enemy.name}`;
            }
            enemies.push(enemy);
        }

        const combatId = `mission_${instanceId}_combat_${crypto.randomUUID()}`;
        const doId = this.combatSession.idFromName(combatId);
        const stub = this.combatSession.get(doId);

        const initResponse = await stub.fetch(
            new Request('https://combat/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    combatId,
                    combatants: [playerCombatant, ...enemies],
                    arenaId: currentState.location ?? 'unknown',
                    environment: { lighting: 'DIM', weather: 'CLEAR', hazards: [] },
                }),
            })
        );

        if (!initResponse.ok) {
            const error = await initResponse.text();
            return { success: false, outcome: 'COMBAT_INIT_FAILED', details: { error } };
        }

        currentState.activeCombatId = combatId;
        await this.db
            .prepare('UPDATE character_missions SET current_state = ? WHERE id = ?')
            .bind(JSON.stringify(currentState), instanceId)
            .run();

        return {
            success: true,
            outcome: 'COMBAT_STARTED',
            details: {
                combatId,
                websocketUrl: `/ws/combat/${combatId}?combatantId=${characterId}`,
                enemies: enemies.map(e => ({ id: e.id, name: e.name, hp: e.hp, hpMax: e.hpMax })),
                player: { id: playerCombatant.id, name: playerCombatant.name, hp: playerCombatant.hp, hpMax: playerCombatant.hpMax },
                districtConditions: {
                    districtId,
                    dangerLevel: dangerMod > 1.5 ? 'EXTREME' : dangerMod > 1.3 ? 'HIGH' : dangerMod > 1.0 ? 'ELEVATED' : 'NORMAL',
                    dangerMultiplier: dangerMod,
                    activeEvents: activeEvents.map(e => e.name),
                },
            },
        };
    }

    // ---------------------------------------------------------------------------
    // DIALOGUE
    // ---------------------------------------------------------------------------

    async processDialogue(
        instanceId: string,
        characterId: string,
        targetNpcId?: string,
        params?: Record<string, unknown>
    ): Promise<MissionActionResult> {
        if (!targetNpcId) {
            return { success: false, outcome: 'NO_NPC_TARGET', details: { error: 'NPC target ID required for dialogue' } };
        }

        const dialogueTreeId = params?.dialogueTreeId as string | undefined;
        const choiceId = params?.choiceId as string | undefined;
        const nodeId = params?.nodeId as string | undefined;

        const npc = await this.db
            .prepare(`SELECT nd.id, nd.name, nd.npc_type, nd.is_quest_giver, nd.faction_id FROM npc_definitions nd WHERE nd.id = ?`)
            .bind(targetNpcId)
            .first<{ id: string; name: string; npc_type: string; is_quest_giver: number; faction_id: string | null }>();

        if (!npc) {
            return { success: false, outcome: 'NPC_NOT_FOUND', details: { error: `NPC not found: ${targetNpcId}` } };
        }

        const character = await this.db
            .prepare(`SELECT c.id, c.current_tier, c.humanity, cf.credits FROM characters c LEFT JOIN character_finances cf ON c.id = cf.character_id WHERE c.id = ?`)
            .bind(characterId)
            .first<{ id: string; current_tier: number; humanity: number; credits: number }>();

        if (!character) {
            return { success: false, outcome: 'CHARACTER_ERROR', details: { error: 'Could not load character data' } };
        }

        let responseText = '';
        const effects: DialogueEffect[] = [];

        if (dialogueTreeId && nodeId) {
            const dialogueNode = await this.db
                .prepare(`SELECT dn.*, dt.npc_id FROM dialogue_nodes dn JOIN dialogue_trees dt ON dn.tree_id = dt.id WHERE dn.id = ? AND dn.tree_id = ?`)
                .bind(nodeId, dialogueTreeId)
                .first<{ id: string; text: string; node_type: string; on_display_effects: string | null }>();

            if (dialogueNode) {
                responseText = dialogueNode.text;
                if (dialogueNode.on_display_effects) {
                    effects.push(...JSON.parse(dialogueNode.on_display_effects));
                }
            }

            if (choiceId) {
                const response = await this.db
                    .prepare('SELECT * FROM dialogue_responses WHERE id = ?')
                    .bind(choiceId)
                    .first<{ id: string; relationship_change: number; reputation_changes: string | null; flag_changes: string | null; grants_items: string | null; removes_items: string | null; grants_xp: number; grants_credits: number; starts_combat: number; triggers_event_id: string | null }>();

                if (response) {
                    if (response.relationship_change !== 0) effects.push({ type: 'MODIFY_RELATION', target: npc.id, value: response.relationship_change });
                    if (response.reputation_changes) { for (const [fid, amt] of Object.entries(JSON.parse(response.reputation_changes))) effects.push({ type: 'MODIFY_REP', target: fid, value: amt as number }); }
                    if (response.grants_items) { for (const item of JSON.parse(response.grants_items)) effects.push({ type: 'GIVE_ITEM', target: item.itemId || item.id, value: item.quantity || 1 }); }
                    if (response.removes_items) { for (const item of JSON.parse(response.removes_items)) effects.push({ type: 'TAKE_ITEM', target: item.itemId || item.id, value: item.quantity || 1 }); }
                    if (response.grants_xp > 0) effects.push({ type: 'GIVE_XP', value: response.grants_xp });
                    if (response.grants_credits > 0) effects.push({ type: 'GIVE_CREDITS', value: response.grants_credits });
                }
            }
        } else {
            responseText = `${npc.name} acknowledges you with a nod.`;
        }

        const appliedEffects = await this.applyDialogueEffects(characterId, npc, effects);

        // Check dialogue checkpoint
        const dialogueCheckpoint = await this.db
            .prepare(`SELECT id FROM mission_checkpoints WHERE mission_instance_id = ? AND checkpoint_type = 'DIALOGUE' AND is_completed = 0 AND (checkpoint_data LIKE ? OR checkpoint_data LIKE ?)`)
            .bind(instanceId, `%${targetNpcId}%`, `%${npc.name}%`)
            .first<{ id: string }>();

        let checkpointCompleted = false;
        if (dialogueCheckpoint) {
            await this.db.prepare("UPDATE mission_checkpoints SET is_completed = 1, completed_at = datetime('now') WHERE id = ?").bind(dialogueCheckpoint.id).run();
            checkpointCompleted = true;
        }

        return {
            success: true,
            outcome: checkpointCompleted ? 'DIALOGUE_CHECKPOINT_COMPLETE' : 'DIALOGUE_COMPLETE',
            details: {
                npc: { id: npc.id, name: npc.name, type: npc.npc_type, isQuestGiver: npc.is_quest_giver === 1 },
                dialogueTreeId: dialogueTreeId ?? null, nodeId: nodeId ?? null, choiceId: choiceId ?? null,
                response: responseText, effects: appliedEffects, checkpointCompleted,
            },
        };
    }

    private async applyDialogueEffects(
        characterId: string,
        npc: { id: string; name: string },
        effects: DialogueEffect[]
    ): Promise<Array<{ type: string; target?: string; result: string }>> {
        const applied: Array<{ type: string; target?: string; result: string }> = [];

        for (const effect of effects) {
            switch (effect.type) {
                case 'MODIFY_REP':
                    if (effect.target && typeof effect.value === 'number') {
                        await this.db
                            .prepare(`INSERT INTO character_faction_standing (id, character_id, faction_id, reputation) VALUES (?, ?, ?, ?) ON CONFLICT(character_id, faction_id) DO UPDATE SET reputation = reputation + ?`)
                            .bind(crypto.randomUUID(), characterId, effect.target, effect.value, effect.value).run();
                        applied.push({ type: 'REPUTATION', target: effect.target, result: `${effect.value > 0 ? '+' : ''}${effect.value}` });
                    }
                    break;
                case 'MODIFY_RELATION':
                    if (effect.target && typeof effect.value === 'number')
                        applied.push({ type: 'RELATIONSHIP', target: npc.name, result: `${effect.value > 0 ? '+' : ''}${effect.value}` });
                    break;
                case 'GIVE_ITEM':
                    if (effect.target) {
                        const qty = typeof effect.value === 'number' ? effect.value : 1;
                        const existing = await this.db.prepare(`SELECT id, quantity FROM character_inventory WHERE character_id = ? AND item_id = ?`).bind(characterId, effect.target).first<{ id: string; quantity: number }>();
                        if (existing) { await this.db.prepare('UPDATE character_inventory SET quantity = quantity + ? WHERE id = ?').bind(qty, existing.id).run(); }
                        else { await this.db.prepare(`INSERT INTO character_inventory (id, character_id, item_id, quantity, created_at) VALUES (?, ?, ?, ?, datetime('now'))`).bind(crypto.randomUUID(), characterId, effect.target, qty).run(); }
                        applied.push({ type: 'ITEM_RECEIVED', target: effect.target, result: `+${qty}` });
                    }
                    break;
                case 'TAKE_ITEM':
                    if (effect.target) {
                        const qty = typeof effect.value === 'number' ? effect.value : 1;
                        await this.db.prepare('UPDATE character_inventory SET quantity = quantity - ? WHERE character_id = ? AND item_id = ? AND quantity >= ?').bind(qty, characterId, effect.target, qty).run();
                        applied.push({ type: 'ITEM_GIVEN', target: effect.target, result: `-${qty}` });
                    }
                    break;
                case 'GIVE_XP':
                    if (typeof effect.value === 'number') { await this.db.prepare('UPDATE characters SET current_xp = current_xp + ? WHERE id = ?').bind(effect.value, characterId).run(); applied.push({ type: 'XP', result: `+${effect.value}` }); }
                    break;
                case 'GIVE_CREDITS':
                    if (typeof effect.value === 'number') { await this.db.prepare('UPDATE character_finances SET credits = credits + ? WHERE character_id = ?').bind(effect.value, characterId).run(); applied.push({ type: 'CREDITS', result: `+${effect.value}` }); }
                    break;
                case 'START_QUEST':
                    if (typeof effect.target === 'string') {
                        const qr = await startQuestFromTrigger(this.db, characterId, effect.target);
                        if (qr.success) applied.push({ type: 'QUEST_STARTED', target: effect.target, result: 'accepted' });
                    }
                    break;
                case 'ADVANCE_QUEST':
                case 'COMPLETE_QUEST':
                    if (effect.target) {
                        const qu = await updateQuestProgress(this.db, characterId, 'DIALOGUE', effect.target);
                        if (qu.objectivesCompleted.length > 0) applied.push({ type: 'QUEST_PROGRESS', target: effect.target, result: 'objective completed' });
                    }
                    break;
            }
        }
        return applied;
    }

    // ---------------------------------------------------------------------------
    // USE ITEM
    // ---------------------------------------------------------------------------

    async processUseItem(
        instanceId: string,
        characterId: string,
        params?: Record<string, unknown>
    ): Promise<MissionActionResult> {
        const itemId = params?.itemId as string | undefined;
        const targetId = params?.targetId as string | undefined;

        if (!itemId) return { success: false, outcome: 'NO_ITEM', details: { error: 'Item ID required' } };

        const inventoryItem = await this.db
            .prepare(`SELECT ci.id, ci.quantity, ci.item_id, id.name, id.item_type, id.subtype, id.is_consumable, id.use_effects, id.stack_limit FROM character_inventory ci JOIN item_definitions id ON ci.item_id = id.id WHERE ci.character_id = ? AND (ci.item_id = ? OR id.code = ?)`)
            .bind(characterId, itemId, itemId)
            .first<{ id: string; quantity: number; item_id: string; name: string; item_type: string; subtype: string | null; is_consumable: number; use_effects: string | null; stack_limit: number }>();

        if (!inventoryItem) return { success: false, outcome: 'ITEM_NOT_FOUND', details: { error: 'Item not in inventory' } };
        if (inventoryItem.quantity < 1) return { success: false, outcome: 'NO_QUANTITY', details: { error: 'No items remaining' } };

        const appliedEffects: Array<{ type: string; value: number | string }> = [];

        if (inventoryItem.use_effects) {
            const effects = JSON.parse(inventoryItem.use_effects) as Array<{ type: string; attribute?: string; amount?: number; duration?: number }>;
            for (const effect of effects) {
                switch (effect.type) {
                    case 'HEAL':
                        if (effect.amount) { await this.db.prepare('UPDATE characters SET current_health = MIN(max_health, current_health + ?) WHERE id = ?').bind(effect.amount, characterId).run(); appliedEffects.push({ type: 'HEAL', value: effect.amount }); }
                        break;
                    case 'RESTORE_ENERGY':
                        if (effect.amount) { await this.db.prepare('UPDATE characters SET current_energy = MIN(max_energy, current_energy + ?) WHERE id = ?').bind(effect.amount, characterId).run(); appliedEffects.push({ type: 'ENERGY', value: effect.amount }); }
                        break;
                    case 'BUFF_ATTRIBUTE':
                        if (effect.attribute && effect.amount && effect.duration) {
                            const inst = await this.db.prepare('SELECT current_state FROM character_missions WHERE id = ?').bind(instanceId).first<{ current_state: string | null }>();
                            const state = inst?.current_state ? JSON.parse(inst.current_state) : {};
                            state.activeBuffs = state.activeBuffs || [];
                            state.activeBuffs.push({ attribute: effect.attribute, amount: effect.amount, expiresAt: Date.now() + (effect.duration * 1000) });
                            await this.db.prepare('UPDATE character_missions SET current_state = ? WHERE id = ?').bind(JSON.stringify(state), instanceId).run();
                            appliedEffects.push({ type: `BUFF_${effect.attribute}`, value: `+${effect.amount} for ${effect.duration}s` });
                        }
                        break;
                    case 'REMOVE_CONDITION':
                        appliedEffects.push({ type: 'CURE', value: effect.attribute || 'condition' });
                        break;
                    default:
                        appliedEffects.push({ type: effect.type, value: effect.amount || 0 });
                }
            }
        }

        if (inventoryItem.is_consumable === 1) {
            if (inventoryItem.quantity === 1) { await this.db.prepare('DELETE FROM character_inventory WHERE id = ?').bind(inventoryItem.id).run(); }
            else { await this.db.prepare('UPDATE character_inventory SET quantity = quantity - 1 WHERE id = ?').bind(inventoryItem.id).run(); }
        }

        if (targetId) {
            const cp = await this.db.prepare(`SELECT id FROM mission_checkpoints WHERE mission_instance_id = ? AND checkpoint_type = 'USE_ITEM' AND is_completed = 0 AND (checkpoint_data LIKE ? OR checkpoint_data LIKE ?)`).bind(instanceId, `%${itemId}%`, `%${targetId}%`).first<{ id: string }>();
            if (cp) {
                await this.db.prepare("UPDATE mission_checkpoints SET is_completed = 1, completed_at = datetime('now') WHERE id = ?").bind(cp.id).run();
                return { success: true, outcome: 'ITEM_USED_CHECKPOINT_COMPLETE', details: { item: { id: inventoryItem.item_id, name: inventoryItem.name, type: inventoryItem.item_type }, effects: appliedEffects, consumed: inventoryItem.is_consumable === 1, remainingQuantity: inventoryItem.is_consumable === 1 ? inventoryItem.quantity - 1 : inventoryItem.quantity, checkpointCompleted: true, targetId } };
            }
        }

        return { success: true, outcome: 'ITEM_USED', details: { item: { id: inventoryItem.item_id, name: inventoryItem.name, type: inventoryItem.item_type }, effects: appliedEffects, consumed: inventoryItem.is_consumable === 1, remainingQuantity: inventoryItem.is_consumable === 1 ? inventoryItem.quantity - 1 : inventoryItem.quantity } };
    }

    // ---------------------------------------------------------------------------
    // STEALTH
    // ---------------------------------------------------------------------------

    async processStealth(
        instanceId: string,
        characterId: string,
        params?: Record<string, unknown>
    ): Promise<MissionActionResult> {
        const stealthType = (params?.type as string) ?? 'SNEAK';

        const character = await this.db
            .prepare(`SELECT c.id, c.current_location_id, COALESCE(cs_stealth.current_level, 0) as stealth_level, COALESCE(ca.effective_value, 10) as agi_value FROM characters c LEFT JOIN character_skills cs_stealth ON c.id = cs_stealth.character_id AND cs_stealth.skill_id = (SELECT id FROM skill_definitions WHERE code = 'STEALTH') LEFT JOIN character_attributes ca ON c.id = ca.character_id AND ca.attribute_id = (SELECT id FROM attribute_definitions WHERE code = 'AGI') WHERE c.id = ?`)
            .bind(characterId)
            .first<{ id: string; current_location_id: string | null; stealth_level: number; agi_value: number }>();

        if (!character) return { success: false, outcome: 'CHARACTER_ERROR', details: { error: 'Could not load character data' } };

        const districtId = character.current_location_id || 'downtown';
        const activeEvents = this.cache ? await getActiveDistrictEvents(this.cache, districtId) : [];
        const modifiers = getEffectiveModifiers(activeEvents);
        const detectionMod = modifiers.get('DETECTION_RISK') || 1.0;

        let baseDifficulty = 8;
        switch (stealthType) { case 'HIDE': baseDifficulty = 7; break; case 'DISTRACT': baseDifficulty = 10; break; case 'BYPASS': baseDifficulty = 12; break; }
        const adjustedDifficulty = Math.round(baseDifficulty * detectionMod);

        const agiMod = Math.floor((character.agi_value - 10) / 2);
        const roll1 = Math.floor(Math.random() * 6) + 1;
        const roll2 = Math.floor(Math.random() * 6) + 1;
        const rollTotal = roll1 + roll2;
        const totalBonus = agiMod + character.stealth_level;
        const total = rollTotal + totalBonus;
        const success = total >= adjustedDifficulty;
        const margin = total - adjustedDifficulty;
        const isCriticalSuccess = rollTotal === 12;
        const isCriticalFailure = rollTotal === 2;

        let outcome = success ? 'STEALTH_SUCCESS' : 'STEALTH_FAILURE';
        let consequence: string | null = null;
        if (isCriticalSuccess) { outcome = 'STEALTH_CRITICAL_SUCCESS'; consequence = 'You move like a shadow. No one suspects a thing.'; }
        else if (isCriticalFailure) { outcome = 'STEALTH_CRITICAL_FAILURE'; consequence = 'You stumble loudly, drawing unwanted attention!'; }
        else if (!success) { consequence = margin <= -5 ? 'You are spotted! Guards are alerted.' : 'Your attempt to remain hidden fails, but you manage to slip away.'; }
        else if (margin >= 5) { consequence = 'Flawless execution. You pass completely unnoticed.'; }

        const inst = await this.db.prepare('SELECT current_state FROM character_missions WHERE id = ?').bind(instanceId).first<{ current_state: string | null }>();
        const state = inst?.current_state ? JSON.parse(inst.current_state) : {};
        state.stealthStatus = { lastAttempt: stealthType, success, alertLevel: isCriticalFailure ? 'HIGH' : (!success ? 'ELEVATED' : state.stealthStatus?.alertLevel || 'NONE'), timestamp: Date.now() };
        await this.db.prepare('UPDATE character_missions SET current_state = ? WHERE id = ?').bind(JSON.stringify(state), instanceId).run();

        let checkpointCompleted = false;
        if (success) {
            const cp = await this.db.prepare(`SELECT id FROM mission_checkpoints WHERE mission_instance_id = ? AND checkpoint_type = 'STEALTH' AND is_completed = 0`).bind(instanceId).first<{ id: string }>();
            if (cp) { await this.db.prepare("UPDATE mission_checkpoints SET is_completed = 1, completed_at = datetime('now') WHERE id = ?").bind(cp.id).run(); checkpointCompleted = true; }
        }

        return {
            success, outcome,
            details: {
                stealthType, roll: [roll1, roll2], rollTotal, agilityModifier: agiMod, stealthSkill: character.stealth_level,
                totalBonus, total, difficulty: adjustedDifficulty, baseDifficulty, detectionModifier: detectionMod,
                margin, isCriticalSuccess, isCriticalFailure, consequence, alertLevel: state.stealthStatus.alertLevel,
                checkpointCompleted, targetArea: params?.targetArea,
            },
        };
    }

    // ---------------------------------------------------------------------------
    // WAIT
    // ---------------------------------------------------------------------------

    async processWait(
        instanceId: string,
        characterId: string,
        params?: Record<string, unknown>
    ): Promise<MissionActionResult> {
        const duration = Math.min((params?.duration as number) ?? 5, 60);
        const reason = params?.reason as string | undefined;

        const instance = await this.db
            .prepare('SELECT started_at, time_limit_minutes, current_state FROM character_missions WHERE id = ?')
            .bind(instanceId)
            .first<{ started_at: string; time_limit_minutes: number; current_state: string | null }>();

        if (!instance) return { success: false, outcome: 'MISSION_NOT_FOUND', details: { error: 'Mission instance not found' } };

        const startTime = new Date(instance.started_at).getTime();
        const timeLimit = instance.time_limit_minutes * 60 * 1000;
        const elapsedMs = Date.now() - startTime;
        const remainingMs = timeLimit - elapsedMs;
        const remainingMinutes = Math.floor(remainingMs / 60000);

        if (remainingMinutes < duration) {
            return { success: false, outcome: 'INSUFFICIENT_TIME', details: { error: `Cannot wait ${duration} minutes. Only ${remainingMinutes} minutes remaining.`, remainingMinutes, requestedDuration: duration } };
        }

        const state = instance.current_state ? JSON.parse(instance.current_state) : {};

        // Expire buffs
        const expiredBuffs: string[] = [];
        if (state.activeBuffs) {
            const futureTime = Date.now() + (duration * 60 * 1000);
            state.activeBuffs = state.activeBuffs.filter((buff: { attribute: string; expiresAt: number }) => {
                if (buff.expiresAt <= futureTime) { expiredBuffs.push(buff.attribute); return false; }
                return true;
            });
        }

        // Reduce alert
        if (state.stealthStatus?.alertLevel && state.stealthStatus.alertLevel !== 'NONE') {
            if (duration >= 10) state.stealthStatus.alertLevel = 'NONE';
            else if (duration >= 5 && state.stealthStatus.alertLevel === 'ELEVATED') state.stealthStatus.alertLevel = 'LOW';
        }

        // Heal
        const healAmount = Math.floor(duration / 10);
        if (healAmount > 0) {
            await this.db.prepare('UPDATE characters SET current_health = MIN(max_health, current_health + ?) WHERE id = ?').bind(healAmount, characterId).run();
        }

        state.totalWaitMinutes = (state.totalWaitMinutes || 0) + duration;
        state.lastWaitTime = Date.now();
        await this.db.prepare('UPDATE character_missions SET current_state = ? WHERE id = ?').bind(JSON.stringify(state), instanceId).run();

        // Checkpoint
        let checkpointCompleted = false;
        if (reason === 'STAKE_OUT' || reason === 'OBSERVE') {
            const cp = await this.db.prepare(`SELECT id FROM mission_checkpoints WHERE mission_instance_id = ? AND checkpoint_type = 'WAIT' AND is_completed = 0`).bind(instanceId).first<{ id: string }>();
            if (cp) { await this.db.prepare("UPDATE mission_checkpoints SET is_completed = 1, completed_at = datetime('now') WHERE id = ?").bind(cp.id).run(); checkpointCompleted = true; }
        }

        let narrative = `You wait for ${duration} minutes.`;
        if (reason === 'REST') narrative = `You take a moment to catch your breath.${healAmount > 0 ? ` Recovered ${healAmount} HP.` : ''}`;
        else if (reason === 'STAKE_OUT') narrative = `You observe the area for ${duration} minutes, noting patrol patterns and activity.`;
        else if (reason === 'HIDDEN') narrative = `You remain hidden, letting the heat die down.`;

        return {
            success: true,
            outcome: checkpointCompleted ? 'WAIT_CHECKPOINT_COMPLETE' : 'WAIT_COMPLETE',
            details: {
                duration, reason: reason || 'GENERAL', narrative,
                effects: { expiredBuffs, healthRecovered: healAmount, alertLevelReduced: expiredBuffs.length > 0 || (state.stealthStatus?.alertLevel === 'NONE') },
                missionTiming: { elapsedMinutes: Math.floor((elapsedMs + duration * 60000) / 60000), remainingMinutes: remainingMinutes - duration, totalWaitMinutes: state.totalWaitMinutes },
                checkpointCompleted,
            },
        };
    }

    // ---------------------------------------------------------------------------
    // COMPLICATION QUERIES
    // ---------------------------------------------------------------------------

    async listComplications(filters?: { type?: string; combat?: string }): Promise<Record<string, unknown>> {
        let query = 'SELECT * FROM complication_definitions WHERE 1=1';
        const params: unknown[] = [];
        if (filters?.type) { query += ' AND complication_type = ?'; params.push(filters.type); }
        if (filters?.combat === 'true') query += ' AND is_combat = 1';
        else if (filters?.combat === 'false') query += ' AND is_combat = 0';
        query += ' ORDER BY severity DESC, name ASC';

        const result = await this.db.prepare(query).bind(...params).all();
        const complications = result.results.map((row) => ({
            id: row.id, code: row.code, name: row.name, description: row.description,
            announcementText: row.announcement_text, complicationType: row.complication_type,
            severity: row.severity, isCombat: row.is_combat === 1, isTimed: row.is_timed === 1,
            triggerCondition: row.trigger_condition, triggerChanceBase: row.trigger_chance_base,
            triggerChanceModifiers: row.trigger_chance_modifiers ? JSON.parse(row.trigger_chance_modifiers as string) : null,
            minTier: row.min_tier, maxTier: row.max_tier, timeLimitSeconds: row.time_limit_seconds,
            canBePrevented: row.can_be_prevented === 1,
        }));
        return { complications, total: complications.length };
    }

    async getComplication(codeOrId: string): Promise<Record<string, unknown> | null> {
        const result = await this.db.prepare('SELECT * FROM complication_definitions WHERE code = ? OR id = ?').bind(codeOrId, codeOrId).first();
        if (!result) return null;
        return {
            id: result.id, code: result.code, name: result.name, description: result.description,
            announcementText: result.announcement_text, complicationType: result.complication_type,
            severity: result.severity, isCombat: result.is_combat === 1, isTimed: result.is_timed === 1,
            triggerCondition: result.trigger_condition, triggerChanceBase: result.trigger_chance_base,
            triggerChanceModifiers: result.trigger_chance_modifiers ? JSON.parse(result.trigger_chance_modifiers as string) : null,
            minTier: result.min_tier, maxTier: result.max_tier,
            effectsOnTrigger: result.effects_on_trigger ? JSON.parse(result.effects_on_trigger as string) : null,
            effectsOnResolve: result.effects_on_resolve ? JSON.parse(result.effects_on_resolve as string) : null,
            effectsOnFail: result.effects_on_fail ? JSON.parse(result.effects_on_fail as string) : null,
            timeLimitSeconds: result.time_limit_seconds,
            resolutionOptions: result.resolution_options ? JSON.parse(result.resolution_options as string) : null,
            canBePrevented: result.can_be_prevented === 1,
            preventionMethods: result.prevention_methods ? JSON.parse(result.prevention_methods as string) : null,
        };
    }

    // ---------------------------------------------------------------------------
    // OBJECTIVE QUERIES
    // ---------------------------------------------------------------------------

    async listObjectives(missionId: string): Promise<{ missionTitle: unknown; objectives: Record<string, unknown>[]; total: number; requiredCount: number; optionalCount: number } | null> {
        const mission = await this.db.prepare('SELECT id, title FROM mission_definitions WHERE id = ?').bind(missionId).first();
        if (!mission) return null;

        const result = await this.db.prepare(
            `SELECT mo.*, l.name as target_location_name, n.name as target_npc_name, i.name as target_item_name
       FROM mission_objectives mo LEFT JOIN locations l ON mo.target_location_id = l.id LEFT JOIN npc_definitions n ON mo.target_npc_id = n.id LEFT JOIN item_definitions i ON mo.target_item_id = i.id
       WHERE mo.mission_definition_id = ? ORDER BY mo.sequence_order ASC`
        ).bind(missionId).all();

        const objectives = result.results.map((row) => this.formatObjective(row));
        return { missionTitle: mission.title, objectives, total: objectives.length, requiredCount: objectives.filter(o => !o.isOptional).length, optionalCount: objectives.filter(o => o.isOptional).length };
    }

    async getObjective(objectiveId: string): Promise<Record<string, unknown> | null> {
        const result = await this.db.prepare(
            `SELECT mo.*, md.title as mission_title, l.name as target_location_name, n.name as target_npc_name, i.name as target_item_name
       FROM mission_objectives mo JOIN mission_definitions md ON mo.mission_definition_id = md.id LEFT JOIN locations l ON mo.target_location_id = l.id LEFT JOIN npc_definitions n ON mo.target_npc_id = n.id LEFT JOIN item_definitions i ON mo.target_item_id = i.id
       WHERE mo.id = ?`
        ).bind(objectiveId).first();

        if (!result) return null;
        return { ...this.formatObjective(result), missionTitle: result.mission_title };
    }

    private formatObjective(row: Record<string, unknown>): Record<string, unknown> & { isOptional: boolean } {
        return {
            id: row.id, missionDefinitionId: row.mission_definition_id, sequenceOrder: row.sequence_order,
            title: row.title, description: row.description, hintText: row.hint_text, completionText: row.completion_text,
            objectiveType: row.objective_type, isOptional: row.is_optional === 1, isHidden: row.is_hidden === 1,
            isBonus: row.is_bonus === 1, targetLocationId: row.target_location_id, targetLocationName: row.target_location_name,
            targetNpcId: row.target_npc_id, targetNpcName: row.target_npc_name, targetItemId: row.target_item_id,
            targetItemName: row.target_item_name,
            targetCoordinates: row.target_coordinates ? JSON.parse(row.target_coordinates as string) : null,
            targetQuantity: row.target_quantity,
            completionConditions: row.completion_conditions ? JSON.parse(row.completion_conditions as string) : null,
            failureConditions: row.failure_conditions ? JSON.parse(row.failure_conditions as string) : null,
            timeLimitSeconds: row.time_limit_seconds, completionXp: row.completion_xp,
        };
    }

    // ---------------------------------------------------------------------------
    // MISSION INSTANCE VERIFICATION & AUTO-START
    // ---------------------------------------------------------------------------

    /**
     * Verify mission instance ownership and status, auto-start if ACCEPTED,
     * and check time limit. Returns the instance or an error.
     */
    async verifyMissionInstance(instanceId: string, characterId: string): Promise<
        { ok: true; instance: Record<string, unknown> } |
        { ok: false; error: { code: string; message: string }; status: number }
    > {
        const instance = await this.db
            .prepare(`SELECT * FROM character_missions WHERE id = ? AND character_id = ? AND status IN ('IN_PROGRESS', 'ACCEPTED')`)
            .bind(instanceId, characterId).first();

        if (!instance) {
            return { ok: false, error: { code: 'MISSION_NOT_ACTIVE', message: 'No active mission with this ID' }, status: 404 };
        }

        if (instance.status === 'ACCEPTED') {
            await this.db.prepare("UPDATE character_missions SET status = 'IN_PROGRESS', started_at = datetime('now') WHERE id = ?").bind(instanceId).run();
        }

        const startTime = new Date(String(instance.started_at || new Date().toISOString())).getTime();
        const timeLimit = (instance.time_limit_minutes as number) * 60 * 1000;
        if (instance.status === 'IN_PROGRESS' && Date.now() - startTime > timeLimit) {
            await this.db.prepare("UPDATE character_missions SET status = 'FAILED', completed_at = datetime('now') WHERE id = ?").bind(instanceId).run();
            return { ok: false, error: { code: 'TIME_EXPIRED', message: 'Mission time limit exceeded' }, status: 400 };
        }

        return { ok: true, instance };
    }

    // ---------------------------------------------------------------------------
    // ACTION LOGGING
    // ---------------------------------------------------------------------------

    /**
     * Log a mission action and return remaining checkpoint count.
     */
    async logAction(instanceId: string, action: Record<string, unknown>, result: Record<string, unknown>): Promise<{ remainingObjectives: number; canComplete: boolean }> {
        await this.db
            .prepare(`INSERT INTO mission_log (id, mission_instance_id, event_type, event_data, created_at) VALUES (?, ?, 'ACTION', ?, datetime('now'))`)
            .bind(crypto.randomUUID(), instanceId, JSON.stringify({ action, result })).run();

        const remaining = await this.db
            .prepare('SELECT COUNT(*) as count FROM mission_checkpoints WHERE mission_instance_id = ? AND is_completed = 0')
            .bind(instanceId).first<{ count: number }>();

        return { remainingObjectives: remaining?.count ?? 0, canComplete: remaining?.count === 0 };
    }

    // ---------------------------------------------------------------------------
    // COMBAT RESOLUTION
    // ---------------------------------------------------------------------------

    /**
     * Resolve combat within a mission using the DurableObject combat session.
     */
    async resolveCombat(instanceId: string, characterId: string): Promise<
        { ok: true; data: Record<string, unknown> } |
        { ok: false; error: { code: string; message: string }; status: number }
    > {
        if (!this.combatSession) {
            return { ok: false, error: { code: 'NO_COMBAT_SESSION', message: 'Combat session not configured' }, status: 500 };
        }

        const instance = await this.db
            .prepare(`SELECT * FROM character_missions WHERE id = ? AND character_id = ? AND status = 'IN_PROGRESS'`)
            .bind(instanceId, characterId).first();

        if (!instance) {
            return { ok: false, error: { code: 'MISSION_NOT_ACTIVE', message: 'No active mission with this ID' }, status: 404 };
        }

        const currentState = instance.current_state ? JSON.parse(instance.current_state as string) : {};
        const combatId = currentState.activeCombatId;
        if (!combatId) {
            return { ok: false, error: { code: 'NO_COMBAT', message: 'No active combat session for this mission' }, status: 400 };
        }

        const doId = this.combatSession.idFromName(combatId);
        const stub = this.combatSession.get(doId);
        const combatResponse = await stub.fetch(new Request('https://combat/state', { method: 'GET' }));

        if (!combatResponse.ok) {
            return { ok: false, error: { code: 'COMBAT_ERROR', message: 'Failed to get combat state' }, status: 500 };
        }

        const combatState = await combatResponse.json() as { phase: string; endReason?: string; combatants: Array<[string, { id: string; hp: number; hpMax: number }]> };

        if (combatState.phase !== 'COMBAT_END') {
            return { ok: false, error: { code: 'COMBAT_IN_PROGRESS', message: 'Combat is still in progress' }, status: 400 };
        }

        const endReason = combatState.endReason;

        // Update player health
        const playerCombatant = combatState.combatants.find(([id]) => !id.startsWith('enemy_'));
        if (playerCombatant) {
            const [, combatant] = playerCombatant;
            await this.db.prepare('UPDATE characters SET current_health = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(Math.max(0, combatant.hp), characterId).run();
        }

        // Update mission state
        delete currentState.activeCombatId;
        currentState.lastCombatResult = endReason;
        await this.db.prepare('UPDATE character_missions SET current_state = ? WHERE id = ?').bind(JSON.stringify(currentState), instanceId).run();

        let missionUpdate: Record<string, unknown> = {};
        let checkpointCompleted = false;

        if (endReason === 'VICTORY') {
            const combatCheckpoint = await this.db
                .prepare(`SELECT id FROM mission_checkpoints WHERE mission_instance_id = ? AND checkpoint_type = 'COMBAT' AND is_completed = 0 LIMIT 1`)
                .bind(instanceId).first<{ id: string }>();
            if (combatCheckpoint) {
                await this.db.prepare("UPDATE mission_checkpoints SET is_completed = 1, completed_at = datetime('now') WHERE id = ?").bind(combatCheckpoint.id).run();
                checkpointCompleted = true;
            }
            missionUpdate = { outcome: 'VICTORY', checkpointCompleted };
        } else if (endReason === 'DEFEAT') {
            missionUpdate = { outcome: 'DEFEAT', canRetry: true };
        } else if (endReason === 'ESCAPE') {
            missionUpdate = { outcome: 'ESCAPED' };
        }

        await this.db
            .prepare(`INSERT INTO mission_log (id, mission_instance_id, event_type, event_data, created_at) VALUES (?, ?, 'COMBAT_RESOLVED', ?, datetime('now'))`)
            .bind(crypto.randomUUID(), instanceId, JSON.stringify({ combatId, endReason, ...missionUpdate })).run();

        return { ok: true, data: { combatResult: endReason, ...missionUpdate } };
    }

    // ---------------------------------------------------------------------------
    // ABANDON MISSION
    // ---------------------------------------------------------------------------

    /**
     * Abandon an active mission, applying rating penalty.
     */
    async abandonMission(instanceId: string, characterId: string): Promise<
        { ok: true; data: { message: string; ratingPenalty: number } } |
        { ok: false; error: { code: string; message: string }; status: number }
    > {
        const instance = await this.db
            .prepare(`SELECT * FROM character_missions WHERE id = ? AND character_id = ? AND status = 'IN_PROGRESS'`)
            .bind(instanceId, characterId).first();

        if (!instance) {
            return { ok: false, error: { code: 'MISSION_NOT_ACTIVE', message: 'No active mission with this ID' }, status: 404 };
        }

        const ratingPenalty = -5;
        await this.db.prepare(`UPDATE character_missions SET status = 'ABANDONED', completed_at = datetime('now'), rating_change = ? WHERE id = ?`).bind(ratingPenalty, instanceId).run();
        await this.db.prepare(`UPDATE characters SET carrier_rating = MAX(0, carrier_rating + ?), updated_at = datetime('now') WHERE id = ?`).bind(ratingPenalty, characterId).run();
        await this.db.prepare(`INSERT INTO mission_log (id, mission_instance_id, event_type, event_data, created_at) VALUES (?, ?, 'MISSION_ABANDONED', ?, datetime('now'))`).bind(crypto.randomUUID(), instanceId, JSON.stringify({ ratingPenalty })).run();

        return { ok: true, data: { message: 'Mission abandoned. Rating penalty applied.', ratingPenalty } };
    }
}
