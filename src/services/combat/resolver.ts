/**
 * Surge Protocol - Combat Resolver Service
 *
 * Bridge between API layer and CombatSession Durable Object.
 * Handles:
 * - Combat session creation and initialization
 * - Turn resolution and action processing
 * - Damage calculation coordination
 * - Combat end processing and rewards
 */

import { BaseService, type ServiceContext, ErrorCodes } from '../base';
import { ConditionService } from '../status/condition';
import {
  type Combatant,
  type Weapon,
  type Armor,
  calculateMaxHP,
  calculateDefense,
  performAttack,
  getWoundStatus,
  type WoundStatus,
  type TerrainMap,
} from '../../game/mechanics/combat';
import type {
  CombatPhase,
  CombatEndReason,
  CombatActionType,
  CombatState,
} from '../../realtime/combat';

// =============================================================================
// TYPES
// =============================================================================

export interface CombatSessionConfig {
  combatId: string;
  characterId: string;
  encounterId: string;
  arenaId?: string;
  environment?: {
    lighting: 'BRIGHT' | 'DIM' | 'DARK';
    weather: string;
    hazards: string[];
  };
}

export interface CombatParticipant {
  id: string;
  name: string;
  type: 'PLAYER' | 'ALLY' | 'ENEMY';
  level: number;
  attributes: {
    PWR: number;
    AGI: number;
    END: number;
    VEL: number;
    PRC: number;
  };
  skills: {
    melee: number;
    firearms: number;
  };
  weapon?: Weapon;
  armor?: Armor;
  augmentBonuses?: {
    initiative: number;
    attack: number;
    defense: number;
    damage: number;
  };
}

export interface CombatSessionResult {
  sessionId: string;
  combatId: string;
  phase: CombatPhase;
  participants: string[];
  turnOrder: string[];
  currentTurn?: string;
}

export interface ActionResult {
  success: boolean;
  actionType: CombatActionType;
  actor: string;
  target?: string;
  damage?: number;
  effects?: string[];
  narrative: string;
  combatEnded?: boolean;
  endReason?: CombatEndReason;
}

export interface CombatEndResult {
  outcome: CombatEndReason;
  duration: number;
  rounds: number;
  xpEarned: number;
  creditsEarned: number;
  loot: Array<{ itemId: string; quantity: number }>;
  characterStatus: {
    hp: number;
    hpMax: number;
    woundStatus: WoundStatus;
    conditionsApplied: string[];
  };
}

// Database types
interface EncounterDefinition {
  id: string;
  name: string;
  difficulty: number;
  enemy_spawn_groups: string; // Use correct column name
  xp_reward: number;
  credit_reward_min: number;
  credit_reward_max: number;
  loot_table_id: string | null;
  item_drops: string | null;
}

interface EnemyTemplate {
  id: string;
  name: string;
  level: number;
  pwr: number;
  agi: number;
  end: number;
  vel: number;
  prc: number;
  melee_skill: number;
  firearms_skill: number;
  weapon_id: string | null;
  armor_id: string | null;
}

interface CharacterCombatData {
  id: string;
  name: string;
  tier: number;
  pwr: number;
  agi: number;
  end: number;
  vel: number;
  prc: number;
  melee_skill: number;
  firearms_skill: number;
  hp_current: number;
  hp_max: number;
  augment_initiative: number;
  augment_attack: number;
  augment_defense: number;
  augment_damage: number;
}

// =============================================================================
// SERVICE
// =============================================================================

export class CombatResolverService extends BaseService {
  private combatSessionNamespace: DurableObjectNamespace;
  private conditionService: ConditionService;

  constructor(
    context: ServiceContext,
    combatSessionNamespace: DurableObjectNamespace
  ) {
    super(context);
    this.combatSessionNamespace = combatSessionNamespace;
    this.conditionService = new ConditionService(this.db, this.cache);
  }

  // ---------------------------------------------------------------------------
  // Session Management
  // ---------------------------------------------------------------------------

  /**
   * Create a new combat session.
   */
  async createSession(config: CombatSessionConfig): Promise<CombatSessionResult> {
    const { combatId, characterId, encounterId, arenaId, environment } = config;

    // Get encounter definition
    // UPDATED: Use combat_encounters table
    const encounter = await this.query<{
      id: string;
      name: string;
      enemy_spawn_groups: string; // JSON
      // ... other fields
    }>(
      `SELECT id, name, enemy_spawn_groups FROM combat_encounters WHERE id = ?`,
      encounterId
    );
    this.assertExists(encounter, ErrorCodes.NOT_FOUND, 'Encounter not found');

    // Get character combat data
    const character = await this.getCharacterCombatData(characterId);

    // Get active conditions
    const activeConditions = await this.conditionService.getActiveConditions(characterId);
    const conditionNames = activeConditions.map(c => c.name);

    // Build combatants list
    const combatants: Combatant[] = [];

    // Add player character
    const playerCombatant = this.characterToCombatant(character, 'player');
    playerCombatant.conditions = conditionNames;

    // Initialize position for player (default start)
    playerCombatant.position = { x: 5, y: 5 };
    combatants.push(playerCombatant);

    // Add enemies from encounter
    let enemies: Array<{ npcId: string; tier?: number; type?: string }> = [];
    try {
      const parsed = JSON.parse(encounter.enemy_spawn_groups || '[]');
      if (Array.isArray(parsed)) {
        // Handle ["npc_1", "npc_2"] or [{npcId: "npc_1"}]
        enemies = parsed.map(e => typeof e === 'string' ? { npcId: e } : e);
      }
    } catch (e) {
      console.warn('Failed to parse enemy_spawn_groups', e);
    }

    // Import the generator
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { generateProceduralEnemy } = require('../../db/queries');

    for (let i = 0; i < enemies.length; i++) {
      const enemyConfig = enemies[i];
      if (!enemyConfig) continue;

      // Try to fetch NPC definition for name/flavor
      const npc = await this.query<{ id: string; name: string; threat_level: number; npc_type: string }>(
        `SELECT id, name, threat_level, npc_type FROM npc_definitions WHERE id = ?`,
        enemyConfig.npcId
      );

      // Use procedural generation seeded by NPC data or defaults
      const tier = enemyConfig.tier ?? npc?.threat_level ?? 1;

      let typeStr = (enemyConfig.type ?? npc?.npc_type ?? 'GANGER').toUpperCase();
      const validTypes = ['GANGER', 'CORPORATE', 'DRONE', 'BEAST', 'BOSS'];
      if (!validTypes.includes(typeStr)) {
        typeStr = 'GANGER';
      }
      const type = typeStr as any;

      const generated = generateProceduralEnemy(tier, type);

      // Override with specific NPC details if available
      if (npc) {
        generated.name = npc.name;
      }

      // Ensure ID is unique in combat
      generated.id = `enemy_${i}_${generated.id}`;

      // Position candidates (spread out)
      generated.position = { x: 15 + (i % 3) * 2, y: 15 + Math.floor(i / 3) * 2 };

      combatants.push(generated);
    }

    // Fetch Arena Terrain
    let terrain: TerrainMap | undefined;
    if (arenaId) {
      const arena = await this.query<{ terrain_map: string; cover_points: string }>(
        `SELECT terrain_map, cover_points FROM arenas WHERE id = ?`,
        arenaId
      );
      if (arena) {
        try {
          terrain = {
            obstacles: JSON.parse(arena.terrain_map || '[]'),
            coverPoints: JSON.parse(arena.cover_points || '[]'),
          };
        } catch (e) {
          console.warn('Failed to parse arena terrain', e);
        }
      }
    }

    // Initialize combat session in Durable Object
    const doId = this.combatSessionNamespace.idFromName(combatId);
    const stub = this.combatSessionNamespace.get(doId);

    const initResponse = await stub.fetch(
      new Request('https://combat/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          combatId,
          combatants,
          arenaId,
          environment,
          terrain,
          autoStart: true,
        }),
      })
    );

    if (!initResponse.ok) {
      const error = await initResponse.json() as { error: string };
      this.throw(ErrorCodes.INTERNAL_ERROR, error.error || 'Failed to initialize combat');
    }

    // Record combat session in database
    await this.execute(
      `INSERT INTO combat_instances (id, character_id, encounter_id, status, started_at)
       VALUES (?, ?, ?, 'INITIALIZING', datetime('now'))`,
      combatId,
      characterId,
      encounterId
    );

    return {
      sessionId: combatId,
      combatId,
      phase: 'INITIALIZING',
      participants: combatants.map((c) => c.id),
      turnOrder: [],
    };
  }

  /**
   * Get current combat session state.
   */
  async getSessionState(combatId: string): Promise<CombatState | null> {
    const doId = this.combatSessionNamespace.idFromName(combatId);
    const stub = this.combatSessionNamespace.get(doId);

    const response = await stub.fetch(
      new Request('https://combat/state', { method: 'GET' })
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as CombatState;
  }

  /**
   * Submit an action in combat.
   */
  async submitAction(
    combatId: string,
    actorId: string,
    action: {
      type: CombatActionType;
      targetId?: string;
      position?: { x: number; y: number };
      itemId?: string;
      abilityId?: string;
    }
  ): Promise<ActionResult> {
    // Delegate action to Durable Object
    const doId = this.combatSessionNamespace.idFromName(combatId);
    const stub = this.combatSessionNamespace.get(doId);

    const response = await stub.fetch(
      new Request('https://combat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId,
          action,
        }),
      })
    );

    if (!response.ok) {
      const error = await response.json() as { error: string };
      return {
        success: false,
        actionType: action.type,
        actor: actorId,
        narrative: error.error || 'Action failed',
      };
    }

    const json = await response.json() as { success: boolean; data: any };
    return json.data as ActionResult;
  }

  /**
   * Force end a combat session.
   */
  async endSession(
    combatId: string,
    reason: CombatEndReason
  ): Promise<CombatEndResult> {
    const doId = this.combatSessionNamespace.idFromName(combatId);
    const stub = this.combatSessionNamespace.get(doId);

    // Get final state before ending
    const state = await this.getSessionState(combatId);

    await stub.fetch(
      new Request('https://combat/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
    );

    // Calculate rewards based on outcome
    const rewards = await this.calculateRewards(combatId, reason);

    // Update database
    await this.execute(
      `UPDATE combat_instances
       SET status = 'COMPLETED', outcome = ?, ended_at = datetime('now'),
           xp_earned = ?
       WHERE id = ?`,
      reason,
      rewards.xpEarned,
      combatId
    );

    // Get character final status
    const characterStatus = this.getCharacterStatus(state);

    // Sync Conditions
    if (state) {
      // Fetch character ID from combat_sessions to be sure
      const sessionRecord = await this.query<{ character_id: string }>(
        `SELECT character_id FROM combat_sessions WHERE id = ?`,
        combatId
      );

      const characterId = sessionRecord?.character_id;

      if (characterId) {
        const dbConditions = await this.conditionService.getActiveConditions(characterId);

        const finalConditionNames = characterStatus.conditionsApplied;
        const dbConditionNames = dbConditions.map(c => c.name);

        // 1. Remove cured conditions
        for (const dbCond of dbConditions) {
          if (!finalConditionNames.includes(dbCond.name)) {
            await this.conditionService.removeCondition(dbCond.id);
          }
        }

        // 2. Add new conditions
        for (const name of finalConditionNames) {
          if (!dbConditionNames.includes(name)) {
            // Look up definition
            const def = await this.query<{ code: string; condition_type: string; severity: any; default_duration_seconds: number }>(
              `SELECT code, condition_type, severity, default_duration_seconds FROM condition_definitions WHERE name = ?`,
              name
            );

            if (def) {
              await this.conditionService.addCondition({
                characterId: characterId,
                type: def.condition_type as any,
                name: name,
                severity: def.severity > 5 ? 'SEVERE' : 'MINOR', // Simple mapping
                durationSeconds: def.default_duration_seconds
              });
            }
          }
        }
      }
    }

    return {
      outcome: reason,
      duration: state ? Date.now() - state.startedAt : 0,
      rounds: state?.round ?? 0,
      ...rewards,
      characterStatus,
    };
  }

  /**
   * List active combat sessions for a character.
   */
  async listActiveSessions(characterId: string) {
    const sessions = await this.db.prepare(
      `SELECT cs.*, ce.name as encounter_name, ce.encounter_type
       FROM combat_instances cs
       LEFT JOIN combat_encounters ce ON cs.encounter_id = ce.id
       WHERE cs.character_id = ? AND cs.status != 'COMPLETED'
       ORDER BY cs.started_at DESC`
    ).bind(characterId).all<any>();

    return (sessions.results || []).map(s => ({
      id: s.id,
      encounter: {
        id: s.encounter_id,
        name: s.encounter_name,
        type: s.encounter_type,
      },
      arena: null, // Arena link not in instance table
      phase: s.status === 'IN_PROGRESS' ? 'ACTIVE' : s.status, // Map status
      startedAt: s.started_at,
    }));
  }

  /**
   * Get combat history for a character.
   */
  async getSessionHistory(characterId: string, filters: { outcome?: string, limit?: number, offset?: number } = {}) {
    const { outcome, limit = 20, offset = 0 } = filters;
    let query = `
      SELECT cs.*, ce.name as encounter_name, ce.encounter_type
      FROM combat_instances cs
      LEFT JOIN combat_encounters ce ON cs.encounter_id = ce.id
      WHERE cs.character_id = ? AND cs.status = 'COMPLETED'
    `;
    const params: any[] = [characterId];

    if (outcome) {
      query += ` AND cs.outcome = ?`;
      params.push(outcome);
    }

    query += ` ORDER BY cs.ended_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await this.db.prepare(query).bind(...params).all<any>();

    return (result.results || []).map(s => ({
      id: s.id,
      encounter: {
        id: s.encounter_id,
        name: s.encounter_name,
        type: s.encounter_type,
      },
      outcome: s.outcome,
      rewards: {
        xp: s.xp_earned,
        credits: 0, // Not stored in instance
      },
      duration: s.ended_at ? (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000 : 0,
      endedAt: s.ended_at,
    }));
  }

  /**
   * Advance to the next turn in combat.
   */
  async advanceTurn(combatId: string): Promise<CombatState | null> {
    const doId = this.combatSessionNamespace.idFromName(combatId);
    const stub = this.combatSessionNamespace.get(doId);

    const response = await stub.fetch(
      new Request('https://combat/next-turn', { method: 'POST' })
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as CombatState;
  }

  /**
   * Pause a combat session.
   */
  async pauseSession(combatId: string): Promise<boolean> {
    const doId = this.combatSessionNamespace.idFromName(combatId);
    const stub = this.combatSessionNamespace.get(doId);

    const response = await stub.fetch(
      new Request('https://combat/pause', { method: 'POST' })
    );

    if (response.ok) {
      await this.execute(
        `UPDATE combat_sessions SET phase = 'PAUSED' WHERE id = ?`,
        combatId
      );
      return true;
    }

    return false;
  }

  /**
   * Resume a combat session.
   */
  async resumeSession(combatId: string): Promise<boolean> {
    const doId = this.combatSessionNamespace.idFromName(combatId);
    const stub = this.combatSessionNamespace.get(doId);

    const response = await stub.fetch(
      new Request('https://combat/resume', { method: 'POST' })
    );

    if (response.ok) {
      await this.execute(
        `UPDATE combat_sessions SET phase = 'ACTIVE' WHERE id = ?`,
        combatId
      );
      return true;
    }

    return false;
  }



  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  private async getCharacterCombatData(characterId: string): Promise<CharacterCombatData> {
    // 1. Fetch Character Base
    const character = await this.query<{
      id: string;
      name: string;
      tier: number;
      hp_current: number;
      hp_max: number;
      pwr: number;
      agi: number;
      end: number;
      vel: number;
      prc: number;
      melee_skill: number;
      firearms_skill: number;
    }>(
      `SELECT
        c.id, 
        c.legal_name as name, 
        c.current_tier as tier,
        c.current_health as hp_current,
        c.max_health as hp_max
       FROM characters c
       WHERE c.id = ?`,
      characterId
    );
    this.assertExists(character, ErrorCodes.CHARACTER_NOT_FOUND, 'Character not found');

    // 2. Fetch Attributes (Normalized)
    const attributes = await this.db.prepare(
      `SELECT attribute_id, current_value FROM character_attributes WHERE character_id = ?`
    ).bind(characterId).all<{ attribute_id: string; current_value: number }>();

    const attrMap: Record<string, number> = {};
    if (attributes.results) {
      for (const attr of attributes.results) {
        attrMap[attr.attribute_id] = attr.current_value;
      }
    }

    // 3. Fetch Skills (Normalized)
    const skills = await this.db.prepare(
      `SELECT skill_id, current_level FROM character_skills WHERE character_id = ?`
    ).bind(characterId).all<{ skill_id: string; current_level: number }>();

    const skillMap: Record<string, number> = {};
    if (skills.results) {
      for (const skill of skills.results) {
        skillMap[skill.skill_id] = skill.current_level;
      }
    }

    // 4. Calc Augment Bonuses
    const activeAugments = await this.db.prepare(
      `SELECT ad.stat_modifiers
       FROM character_augments char_aug
       JOIN augment_definitions ad ON char_aug.augment_definition_id = ad.id
       WHERE char_aug.character_id = ? AND char_aug.is_active = 1 AND char_aug.is_malfunctioning = 0`
    ).bind(characterId).all<{ stat_modifiers: string }>();

    let augment_initiative = 0;
    let augment_attack = 0;
    let augment_defense = 0;
    let augment_damage = 0;

    if (activeAugments.results) {
      for (const aug of activeAugments.results) {
        try {
          const stats = JSON.parse(aug.stat_modifiers || '{}');
          augment_initiative += stats.initiative || 0;
          augment_attack += stats.attack || 0;
          augment_defense += stats.defense || 0;
          augment_damage += stats.damage || 0;
        } catch (e) {
          // ignore invalid json
        }
      }
    }

    return {
      id: character.id,
      name: character.name,
      tier: character.tier,
      hp_current: character.hp_current,
      hp_max: character.hp_max,
      pwr: attrMap['PWR'] ?? 5,
      agi: attrMap['AGI'] ?? 5,
      end: attrMap['END'] ?? 5,
      vel: attrMap['VEL'] ?? 5,
      prc: attrMap['PRC'] ?? 5,
      melee_skill: skillMap['MELEE'] ?? 0,
      firearms_skill: skillMap['FIREARMS'] ?? 0,
      augment_initiative,
      augment_attack,
      augment_defense,
      augment_damage,
    };
  }

  private characterToCombatant(
    data: CharacterCombatData,
    id: string
  ): Combatant {
    const hpMax = data.hp_max || calculateMaxHP(data.end, data.pwr, data.tier);

    return {
      id,
      name: data.name,
      attributes: {
        PWR: data.pwr,
        AGI: data.agi,
        END: data.end,
        VEL: data.vel,
        PRC: data.prc,
      },
      skills: {
        melee: data.melee_skill,
        firearms: data.firearms_skill,
      },
      hp: data.hp_current ?? hpMax,
      hpMax,
      armor: null,
      weapon: null,
      cover: null,
      augmentBonuses: {
        initiative: data.augment_initiative,
        attack: data.augment_attack,
        defense: data.augment_defense,
        damage: data.augment_damage,
      },
      conditions: [],
      position: { x: 0, y: 0 }
    };
  }

  private getCombatantName(state: CombatState | null, id: string): string {
    if (!state) return id;
    const combatantsArray = Array.from(state.combatants);
    const entry = combatantsArray.find(([cid]) => cid === id);
    return entry ? entry[1].name : id;
  }

  private getCharacterStatus(state: CombatState | null): CombatEndResult['characterStatus'] {
    if (!state) {
      return {
        hp: 0,
        hpMax: 0,
        woundStatus: 'HEALTHY',
        conditionsApplied: [],
      };
    }

    // Find player character (first non-enemy)
    const combatantsArray = Array.from(state.combatants);
    const playerEntry = combatantsArray.find(([id]) => !id.startsWith('enemy_'));

    if (!playerEntry) {
      return {
        hp: 0,
        hpMax: 0,
        woundStatus: 'HEALTHY',
        conditionsApplied: [],
      };
    }

    const [, player] = playerEntry;
    return {
      hp: player.hp,
      hpMax: player.hpMax,
      woundStatus: getWoundStatus(player.hp, player.hpMax),
      conditionsApplied: player.conditions,
    };
  }

  private async calculateRewards(
    combatId: string,
    outcome: CombatEndReason
  ): Promise<{ xpEarned: number; creditsEarned: number; loot: Array<{ itemId: string; quantity: number }> }> {
    // Get encounter from combat session
    const session = await this.query<{ encounter_id: string }>(
      `SELECT encounter_id FROM combat_sessions WHERE id = ?`,
      combatId
    );

    if (!session) {
      return { xpEarned: 0, creditsEarned: 0, loot: [] };
    }

    const encounter = await this.query<EncounterDefinition>(
      `SELECT * FROM combat_encounters WHERE id = ?`,
      session.encounter_id
    );

    if (!encounter) {
      return { xpEarned: 0, creditsEarned: 0, loot: [] };
    }

    // Calculate rewards based on outcome
    let xpMultiplier = 0;
    let creditMultiplier = 0;

    switch (outcome) {
      case 'VICTORY':
        xpMultiplier = 1.0;
        creditMultiplier = 1.0;
        break;
      case 'DEFEAT':
        xpMultiplier = 0.25; // Partial XP for learning
        creditMultiplier = 0;
        break;
      case 'ESCAPE':
        xpMultiplier = 0.5;
        creditMultiplier = 0;
        break;
      case 'NEGOTIATION':
        xpMultiplier = 0.75;
        creditMultiplier = 0.5;
        break;
      default:
        xpMultiplier = 0;
        creditMultiplier = 0;
    }

    const xpEarned = Math.floor(encounter.xp_reward * xpMultiplier);
    const creditsEarned = Math.floor(
      (Math.random() * (encounter.credit_reward_max - encounter.credit_reward_min) +
        encounter.credit_reward_min) *
      creditMultiplier
    );

    // Generate Loot
    const loot: Array<{ itemId: string; quantity: number }> = [];

    if (encounter.loot_table_id) {
      if (this.itemService) {
        const generatedLoot = await this.itemService.generateLoot({
          lootTableId: encounter.loot_table_id,
          limit: 5
        });

        for (const item of generatedLoot) {
          loot.push({
            itemId: item.item_definition_id,
            quantity: item.quantity
          });
        }
      } else {
        console.warn('ItemService not available in CombatResolverService context');
      }
    }

    // Also check for static item_drops JSON if no loot table or as augment
    if (encounter.item_drops) {
      try {
        const staticDrops = JSON.parse(encounter.item_drops);
        if (Array.isArray(staticDrops)) {
          for (const drop of staticDrops) {
            // Normalize format as needed, assuming { itemId, quantity } or { id, qty }
            if (drop.itemId && drop.quantity) {
              loot.push(drop);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse item_drops for encounter', session.encounter_id);
      }
    }

    return { xpEarned, creditsEarned, loot };
  }

  /**
   * Calculate damage preview without applying it.
   */
  calculateDamagePreview(
    _attacker: Combatant,
    defender: Combatant,
    weapon: Weapon
  ): { minDamage: number; maxDamage: number; avgDamage: number } {
    // Parse weapon damage dice (e.g., "2d6+2")
    const match = weapon.baseDamage.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) {
      return { minDamage: 0, maxDamage: 0, avgDamage: 0 };
    }

    const numDice = parseInt(match[1]!, 10);
    const dieSize = parseInt(match[2]!, 10);
    const bonus = match[3] ? parseInt(match[3], 10) : 0;

    const minRoll = numDice + bonus;
    const maxRoll = numDice * dieSize + bonus;
    const avgRoll = (minRoll + maxRoll) / 2;

    const armorValue = defender.armor?.value ?? 0;

    return {
      minDamage: Math.max(1, minRoll - armorValue),
      maxDamage: Math.max(1, maxRoll - armorValue),
      avgDamage: Math.max(1, avgRoll - armorValue),
    };
  }

  /**
   * Get defense value for a combatant.
   */
  getDefenseValue(combatant: Combatant): number {
    return calculateDefense(combatant);
  }
}
