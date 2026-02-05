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
import {
  type Combatant,
  type Weapon,
  type Armor,
  type AttackResult,
  calculateMaxHP,
  calculateDefense,
  performAttack,
  calculateDamage,
  getWoundStatus,
  type WoundStatus,
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
  enemy_template_ids: string;
  xp_reward: number;
  credit_reward_min: number;
  credit_reward_max: number;
  loot_table_id: string | null;
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
}

// =============================================================================
// SERVICE
// =============================================================================

export class CombatResolverService extends BaseService {
  private combatSessionNamespace: DurableObjectNamespace;

  constructor(
    context: ServiceContext,
    combatSessionNamespace: DurableObjectNamespace
  ) {
    super(context);
    this.combatSessionNamespace = combatSessionNamespace;
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
    const encounter = await this.query<EncounterDefinition>(
      `SELECT * FROM encounter_definitions WHERE id = ?`,
      encounterId
    );
    this.assertExists(encounter, ErrorCodes.NOT_FOUND, 'Encounter not found');

    // Get character combat data
    const character = await this.getCharacterCombatData(characterId);

    // Build combatants list
    const combatants: Combatant[] = [];

    // Add player character
    combatants.push(this.characterToCombatant(character, 'player'));

    // Add enemies from encounter
    const enemyIds = JSON.parse(encounter.enemy_template_ids) as string[];
    for (let i = 0; i < enemyIds.length; i++) {
      const enemy = await this.getEnemyTemplate(enemyIds[i]);
      if (enemy) {
        combatants.push(this.enemyToCombatant(enemy, `enemy_${i}`));
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
        }),
      })
    );

    if (!initResponse.ok) {
      const error = await initResponse.json() as { error: string };
      this.throw(ErrorCodes.INTERNAL_ERROR, error.error || 'Failed to initialize combat');
    }

    // Record combat session in database
    await this.execute(
      `INSERT INTO combat_sessions (id, character_id, encounter_id, arena_id, phase, started_at)
       VALUES (?, ?, ?, ?, 'INITIALIZING', datetime('now'))`,
      combatId,
      characterId,
      encounterId,
      arenaId
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
    // Get current state to validate action
    const state = await this.getSessionState(combatId);
    if (!state) {
      return {
        success: false,
        actionType: action.type,
        actor: actorId,
        narrative: 'Combat session not found',
      };
    }

    if (state.phase !== 'ACTIVE') {
      return {
        success: false,
        actionType: action.type,
        actor: actorId,
        narrative: `Cannot submit action in ${state.phase} phase`,
      };
    }

    const currentTurnId = state.turnOrder[state.turnIndex];
    if (currentTurnId !== actorId) {
      return {
        success: false,
        actionType: action.type,
        actor: actorId,
        narrative: 'Not your turn',
      };
    }

    // Process action based on type
    let result: ActionResult;

    switch (action.type) {
      case 'ATTACK':
        result = await this.processAttack(state, actorId, action.targetId);
        break;

      case 'DEFEND':
        result = {
          success: true,
          actionType: 'DEFEND',
          actor: actorId,
          narrative: `${this.getCombatantName(state, actorId)} takes a defensive stance (+2 Defense until next turn)`,
          effects: ['DEFENDING'],
        };
        break;

      case 'USE_ITEM':
        result = await this.processUseItem(state, actorId, action.itemId);
        break;

      case 'DISENGAGE':
        result = {
          success: true,
          actionType: 'DISENGAGE',
          actor: actorId,
          narrative: `${this.getCombatantName(state, actorId)} disengages from melee`,
        };
        break;

      case 'END_TURN':
        result = {
          success: true,
          actionType: 'END_TURN',
          actor: actorId,
          narrative: `${this.getCombatantName(state, actorId)} ends their turn`,
        };
        break;

      default:
        result = {
          success: false,
          actionType: action.type,
          actor: actorId,
          narrative: 'Unknown action type',
        };
    }

    return result;
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
      `UPDATE combat_sessions
       SET phase = 'COMBAT_END', end_reason = ?, ended_at = datetime('now'),
           xp_earned = ?, credits_earned = ?
       WHERE id = ?`,
      reason,
      rewards.xpEarned,
      rewards.creditsEarned,
      combatId
    );

    // Get character final status
    const characterStatus = this.getCharacterStatus(state);

    return {
      outcome: reason,
      duration: state ? Date.now() - state.startedAt : 0,
      rounds: state?.round ?? 0,
      ...rewards,
      characterStatus,
    };
  }

  // ---------------------------------------------------------------------------
  // Action Processing
  // ---------------------------------------------------------------------------

  private async processAttack(
    state: CombatState,
    actorId: string,
    targetId?: string
  ): Promise<ActionResult> {
    if (!targetId) {
      return {
        success: false,
        actionType: 'ATTACK',
        actor: actorId,
        narrative: 'No target specified',
      };
    }

    const combatantsArray = Array.from(state.combatants);
    const actorEntry = combatantsArray.find(([id]) => id === actorId);
    const targetEntry = combatantsArray.find(([id]) => id === targetId);

    if (!actorEntry || !targetEntry) {
      return {
        success: false,
        actionType: 'ATTACK',
        actor: actorId,
        narrative: 'Invalid combatant',
      };
    }

    const [, actor] = actorEntry;
    const [, target] = targetEntry;

    // Perform attack using combat mechanics
    const attackResult = performAttack(actor, target);

    return {
      success: attackResult.hit,
      actionType: 'ATTACK',
      actor: actorId,
      target: targetId,
      damage: attackResult.damage?.finalDamage,
      narrative: attackResult.narrative,
      effects: attackResult.hit ? ['DAMAGE_DEALT'] : ['MISS'],
    };
  }

  private async processUseItem(
    state: CombatState,
    actorId: string,
    itemId?: string
  ): Promise<ActionResult> {
    if (!itemId) {
      return {
        success: false,
        actionType: 'USE_ITEM',
        actor: actorId,
        narrative: 'No item specified',
      };
    }

    // Get item from database
    const item = await this.query<{ id: string; name: string; effect_type: string; effect_value: number }>(
      `SELECT id, name, effect_type, effect_value FROM item_definitions WHERE id = ?`,
      itemId
    );

    if (!item) {
      return {
        success: false,
        actionType: 'USE_ITEM',
        actor: actorId,
        narrative: 'Item not found',
      };
    }

    const actorName = this.getCombatantName(state, actorId);

    return {
      success: true,
      actionType: 'USE_ITEM',
      actor: actorId,
      narrative: `${actorName} uses ${item.name}`,
      effects: [item.effect_type],
    };
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  private async getCharacterCombatData(characterId: string): Promise<CharacterCombatData> {
    const character = await this.query<CharacterCombatData>(
      `SELECT
        c.id, c.name, c.tier,
        COALESCE(ca.pwr, 10) as pwr,
        COALESCE(ca.agi, 10) as agi,
        COALESCE(ca.end, 10) as end,
        COALESCE(ca.vel, 10) as vel,
        COALESCE(ca.prc, 10) as prc,
        COALESCE(cs.melee, 0) as melee_skill,
        COALESCE(cs.firearms, 0) as firearms_skill,
        c.hp_current,
        c.hp_max
       FROM characters c
       LEFT JOIN character_attributes ca ON c.id = ca.character_id
       LEFT JOIN character_skills cs ON c.id = cs.character_id
       WHERE c.id = ?`,
      characterId
    );
    this.assertExists(character, ErrorCodes.CHARACTER_NOT_FOUND, 'Character not found');
    return character;
  }

  private async getEnemyTemplate(templateId: string): Promise<EnemyTemplate | null> {
    return this.query<EnemyTemplate>(
      `SELECT * FROM enemy_templates WHERE id = ?`,
      templateId
    );
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
        initiative: 0,
        attack: 0,
        defense: 0,
        damage: 0,
      },
      conditions: [],
    };
  }

  private enemyToCombatant(
    data: EnemyTemplate,
    id: string
  ): Combatant {
    const hpMax = calculateMaxHP(data.end, data.pwr, data.level);

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
      hp: hpMax,
      hpMax,
      armor: null,
      weapon: null,
      cover: null,
      augmentBonuses: {
        initiative: 0,
        attack: 0,
        defense: 0,
        damage: 0,
      },
      conditions: [],
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
      `SELECT * FROM encounter_definitions WHERE id = ?`,
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

    // TODO: Roll loot table for items
    const loot: Array<{ itemId: string; quantity: number }> = [];

    return { xpEarned, creditsEarned, loot };
  }

  // ---------------------------------------------------------------------------
  // Utility Methods for Combat Calculations
  // ---------------------------------------------------------------------------

  /**
   * Calculate damage preview without applying it.
   */
  calculateDamagePreview(
    attacker: Combatant,
    defender: Combatant,
    weapon: Weapon
  ): { minDamage: number; maxDamage: number; avgDamage: number } {
    // Parse weapon damage dice (e.g., "2d6+2")
    const match = weapon.baseDamage.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) {
      return { minDamage: 0, maxDamage: 0, avgDamage: 0 };
    }

    const numDice = parseInt(match[1], 10);
    const dieSize = parseInt(match[2], 10);
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

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  CombatPhase,
  CombatEndReason,
  CombatActionType,
  CombatState,
  Combatant,
  Weapon,
  Armor,
  AttackResult,
};
