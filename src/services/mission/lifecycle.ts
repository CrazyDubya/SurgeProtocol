/**
 * Surge Protocol - Mission Lifecycle Service
 *
 * Handles the complete lifecycle of missions:
 * - Accept mission
 * - Update progress (objectives, waypoints)
 * - Complete mission (success/failure)
 * - Apply rewards and penalties
 * - Track mission history
 */

import {
  CharacterService,
  type ServiceContext,
  type ServiceResponse,
  ErrorCodes,
} from '../base/index';

// =============================================================================
// TYPES
// =============================================================================

export type MissionStatus =
  | 'AVAILABLE'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'ABANDONED'
  | 'EXPIRED';

export type MissionType =
  | 'DELIVERY'
  | 'EXTRACTION'
  | 'ESCORT'
  | 'COMBAT'
  | 'INFILTRATION'
  | 'INVESTIGATION'
  | 'COURIER'
  | 'CONTRACT';

export interface MissionDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  mission_type: MissionType;
  tier_required: number;
  client_faction_id: string | null;
  target_location_id: string | null;
  base_pay: number;
  bonus_pay: number;
  time_limit_seconds: number | null;
  xp_reward: number;
  rating_reward: number;
  rating_penalty: number;
  humanity_impact: number;
  objectives: MissionObjective[];
  complications: string[];
  is_repeatable: boolean;
  cooldown_hours: number | null;
}

export interface MissionObjective {
  id: string;
  objective_type: string;
  description: string;
  target_id: string | null;
  target_count: number;
  is_optional: boolean;
  bonus_reward: number;
  sequence_order: number;
}

export interface ActiveMission {
  id: string;
  character_id: string;
  mission_definition_id: string;
  status: MissionStatus;
  accepted_at: string;
  expires_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  current_objective_index: number;
  objectives_completed: string[];
  complications_triggered: string[];
  bonus_objectives_completed: string[];
  distance_traveled_m: number;
  time_elapsed_seconds: number;
  damage_taken: number;
  stealth_maintained: boolean;
  final_rating: number | null;
  final_pay: number | null;
}

export interface MissionAcceptResult {
  mission_id: string;
  mission_name: string;
  mission_type: MissionType;
  status: MissionStatus;
  accepted_at: string;
  expires_at: string | null;
  objectives: MissionObjective[];
  client_name: string | null;
  destination_name: string | null;
  base_pay: number;
  time_limit_seconds: number | null;
  algorithm_message: string;
}

export interface MissionProgressUpdate {
  objective_id?: string;
  objective_completed?: boolean;
  distance_traveled?: number;
  damage_taken?: number;
  stealth_broken?: boolean;
  complication_triggered?: string;
  checkpoint_reached?: string;
}

export interface MissionProgressResult {
  mission_id: string;
  status: MissionStatus;
  current_objective_index: number;
  objectives_completed: string[];
  objectives_remaining: number;
  time_elapsed_seconds: number;
  time_remaining_seconds: number | null;
  bonus_objectives_available: number;
  estimated_pay: number;
  complications_active: string[];
}

export interface MissionCompletionResult {
  mission_id: string;
  mission_name: string;
  status: 'COMPLETED' | 'FAILED';
  completion_time_seconds: number;
  objectives_completed: number;
  objectives_total: number;
  bonus_objectives: number;
  base_pay: number;
  bonus_pay: number;
  penalty_deductions: number;
  final_pay: number;
  xp_earned: number;
  rating_change: number;
  humanity_change: number;
  new_rating: number;
  new_credits: number;
  algorithm_message: string;
  unlocks?: string[];
}

export interface MissionAbandonResult {
  mission_id: string;
  mission_name: string;
  penalty_applied: boolean;
  rating_penalty: number;
  credits_lost: number;
  new_rating: number;
  cooldown_until: string | null;
  algorithm_message: string;
}

// =============================================================================
// MISSION LIFECYCLE SERVICE
// =============================================================================

export class MissionLifecycleService extends CharacterService {
  constructor(context: ServiceContext) {
    super(context);
  }

  /**
   * Get available missions for the character's current tier.
   */
  async getAvailableMissions(): Promise<
    ServiceResponse<{ missions: MissionDefinition[]; tier: number }>
  > {
    const character = await this.getCharacter();

    const missions = await this.queryAll<MissionDefinitionRow>(
      `SELECT md.*,
              f.name as client_name,
              l.name as location_name
       FROM mission_definitions md
       LEFT JOIN factions f ON md.client_faction_id = f.id
       LEFT JOIN locations l ON md.target_location_id = l.id
       WHERE md.tier_required <= ?
         AND md.is_active = 1
         AND md.id NOT IN (
           SELECT mission_definition_id FROM character_missions
           WHERE character_id = ? AND status IN ('ACCEPTED', 'IN_PROGRESS')
         )
       ORDER BY md.tier_required DESC, md.base_pay DESC
       LIMIT 20`,
      character.tier,
      this.requiredCharacterId
    );

    return this.success({
      missions: missions.map((m) => this.formatMissionDefinition(m)),
      tier: character.tier,
    });
  }

  /**
   * Accept a mission.
   */
  async acceptMission(
    missionDefinitionId: string
  ): Promise<ServiceResponse<MissionAcceptResult>> {
    const character = await this.getCharacter();

    // Get mission definition
    const mission = await this.query<MissionDefinitionRow>(
      `SELECT md.*, f.name as client_name, l.name as location_name
       FROM mission_definitions md
       LEFT JOIN factions f ON md.client_faction_id = f.id
       LEFT JOIN locations l ON md.target_location_id = l.id
       WHERE md.id = ?`,
      missionDefinitionId
    );

    if (!mission) {
      return this.error(ErrorCodes.NOT_FOUND, 'Mission not found');
    }

    // Check tier requirement
    if (character.tier < mission.tier_required) {
      return this.error(
        ErrorCodes.TIER_REQUIREMENT,
        `Requires Tier ${mission.tier_required}`
      );
    }

    // Check if already on this mission
    const existing = await this.query<{ id: string }>(
      `SELECT id FROM character_missions
       WHERE character_id = ? AND mission_definition_id = ?
         AND status IN ('ACCEPTED', 'IN_PROGRESS')`,
      this.requiredCharacterId,
      missionDefinitionId
    );

    if (existing) {
      return this.error(
        ErrorCodes.VALIDATION_ERROR,
        'Already have this mission active'
      );
    }

    // Check cooldown for repeatable missions
    if (mission.is_repeatable && mission.cooldown_hours) {
      const lastCompletion = await this.query<{ completed_at: string }>(
        `SELECT completed_at FROM character_missions
         WHERE character_id = ? AND mission_definition_id = ?
           AND status = 'COMPLETED'
         ORDER BY completed_at DESC LIMIT 1`,
        this.requiredCharacterId,
        missionDefinitionId
      );

      if (lastCompletion) {
        const cooldownEnd = new Date(lastCompletion.completed_at);
        cooldownEnd.setHours(cooldownEnd.getHours() + mission.cooldown_hours);
        if (new Date() < cooldownEnd) {
          return this.error(
            ErrorCodes.VALIDATION_ERROR,
            `Mission on cooldown until ${cooldownEnd.toISOString()}`
          );
        }
      }
    }

    // Create active mission
    const missionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = mission.time_limit_seconds
      ? new Date(now.getTime() + mission.time_limit_seconds * 1000)
      : null;

    await this.execute(
      `INSERT INTO character_missions
       (id, character_id, mission_definition_id, status, accepted_at, expires_at,
        current_objective_index, objectives_completed, complications_triggered,
        bonus_objectives_completed, distance_traveled_m, time_elapsed_seconds,
        damage_taken, stealth_maintained, created_at, updated_at)
       VALUES (?, ?, ?, 'ACCEPTED', ?, ?, 0, '[]', '[]', '[]', 0, 0, 0, 1, ?, ?)`,
      missionId,
      this.requiredCharacterId,
      missionDefinitionId,
      now.toISOString(),
      expiresAt?.toISOString() ?? null,
      now.toISOString(),
      now.toISOString()
    );

    // Log mission acceptance
    await this.logMissionEvent(missionId, 'ACCEPTED', {
      mission_name: mission.name,
      tier: mission.tier_required,
    });

    const objectives = this.parseJsonField<MissionObjective[]>(
      mission.objectives,
      []
    );

    return this.success({
      mission_id: missionId,
      mission_name: mission.name,
      mission_type: mission.mission_type as MissionType,
      status: 'ACCEPTED',
      accepted_at: now.toISOString(),
      expires_at: expiresAt?.toISOString() ?? null,
      objectives,
      client_name: mission.client_name ?? null,
      destination_name: mission.location_name ?? null,
      base_pay: mission.base_pay,
      time_limit_seconds: mission.time_limit_seconds,
      algorithm_message: this.getAcceptanceMessage(mission.mission_type, mission.tier_required),
    });
  }

  /**
   * Start a mission (transition from ACCEPTED to IN_PROGRESS).
   */
  async startMission(
    missionId: string
  ): Promise<ServiceResponse<MissionProgressResult>> {
    const mission = await this.getActiveMission(missionId);
    if (!mission.success) return mission;

    const activeMission = mission.data;

    if (activeMission.status !== 'ACCEPTED') {
      return this.error(
        ErrorCodes.INVALID_STATE,
        `Cannot start mission in ${activeMission.status} state`
      );
    }

    const now = new Date();

    await this.execute(
      `UPDATE character_missions
       SET status = 'IN_PROGRESS', started_at = ?, updated_at = ?
       WHERE id = ?`,
      now.toISOString(),
      now.toISOString(),
      missionId
    );

    await this.logMissionEvent(missionId, 'STARTED', {});

    return this.getMissionProgress(missionId);
  }

  /**
   * Update mission progress (objective completion, travel, etc).
   */
  async updateProgress(
    missionId: string,
    update: MissionProgressUpdate
  ): Promise<ServiceResponse<MissionProgressResult>> {
    const mission = await this.getActiveMission(missionId);
    if (!mission.success) return mission;

    const activeMission = mission.data;

    if (
      activeMission.status !== 'ACCEPTED' &&
      activeMission.status !== 'IN_PROGRESS'
    ) {
      return this.error(
        ErrorCodes.INVALID_STATE,
        `Cannot update mission in ${activeMission.status} state`
      );
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    // Handle objective completion
    if (update.objective_id && update.objective_completed) {
      const completed = this.parseJsonField<string[]>(
        activeMission.objectives_completed as unknown as string,
        []
      );
      if (!completed.includes(update.objective_id)) {
        completed.push(update.objective_id);
        updates.push('objectives_completed = ?');
        values.push(JSON.stringify(completed));

        // Advance objective index
        updates.push('current_objective_index = current_objective_index + 1');
      }
    }

    // Handle distance traveled
    if (update.distance_traveled) {
      updates.push('distance_traveled_m = distance_traveled_m + ?');
      values.push(update.distance_traveled);
    }

    // Handle damage taken
    if (update.damage_taken) {
      updates.push('damage_taken = damage_taken + ?');
      values.push(update.damage_taken);
    }

    // Handle stealth broken
    if (update.stealth_broken) {
      updates.push('stealth_maintained = 0');
    }

    // Handle complication triggered
    if (update.complication_triggered) {
      const complications = this.parseJsonField<string[]>(
        activeMission.complications_triggered as unknown as string,
        []
      );
      if (!complications.includes(update.complication_triggered)) {
        complications.push(update.complication_triggered);
        updates.push('complications_triggered = ?');
        values.push(JSON.stringify(complications));
      }
    }

    if (updates.length > 0) {
      // Ensure status is IN_PROGRESS
      updates.push("status = 'IN_PROGRESS'");
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(missionId);

      await this.execute(
        `UPDATE character_missions SET ${updates.join(', ')} WHERE id = ?`,
        ...values
      );

      await this.logMissionEvent(missionId, 'PROGRESS_UPDATE', { ...update });
    }

    return this.getMissionProgress(missionId);
  }

  /**
   * Get current mission progress.
   */
  async getMissionProgress(
    missionId: string
  ): Promise<ServiceResponse<MissionProgressResult>> {
    const mission = await this.getActiveMission(missionId);
    if (!mission.success) return mission;

    const activeMission = mission.data;

    // Get mission definition for objectives
    const definition = await this.query<MissionDefinitionRow>(
      `SELECT * FROM mission_definitions WHERE id = ?`,
      activeMission.mission_definition_id
    );

    if (!definition) {
      return this.error(ErrorCodes.NOT_FOUND, 'Mission definition not found');
    }

    const objectives = this.parseJsonField<MissionObjective[]>(
      definition.objectives,
      []
    );
    const completedIds = this.parseJsonField<string[]>(
      activeMission.objectives_completed as unknown as string,
      []
    );
    const complications = this.parseJsonField<string[]>(
      activeMission.complications_triggered as unknown as string,
      []
    );

    const requiredObjectives = objectives.filter((o) => !o.is_optional);
    const optionalObjectives = objectives.filter((o) => o.is_optional);

    // Calculate time
    const startTime = activeMission.started_at
      ? new Date(activeMission.started_at).getTime()
      : new Date(activeMission.accepted_at).getTime();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    let timeRemaining: number | null = null;
    if (activeMission.expires_at) {
      const expiresAt = new Date(activeMission.expires_at).getTime();
      timeRemaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    }

    // Estimate pay
    const completedCount = completedIds.length;
    const bonusMultiplier =
      completedIds.filter((id) =>
        optionalObjectives.some((o) => o.id === id)
      ).length * 0.1;
    const estimatedPay = Math.round(
      definition.base_pay * (1 + bonusMultiplier)
    );

    return this.success({
      mission_id: missionId,
      status: activeMission.status as MissionStatus,
      current_objective_index: activeMission.current_objective_index,
      objectives_completed: completedIds,
      objectives_remaining: requiredObjectives.length - completedCount,
      time_elapsed_seconds: elapsed,
      time_remaining_seconds: timeRemaining,
      bonus_objectives_available:
        optionalObjectives.length -
        completedIds.filter((id) =>
          optionalObjectives.some((o) => o.id === id)
        ).length,
      estimated_pay: estimatedPay,
      complications_active: complications,
    });
  }

  /**
   * Complete a mission (success).
   */
  async completeMission(
    missionId: string
  ): Promise<ServiceResponse<MissionCompletionResult>> {
    const mission = await this.getActiveMission(missionId);
    if (!mission.success) return mission;

    const activeMission = mission.data;

    if (activeMission.status !== 'IN_PROGRESS') {
      return this.error(
        ErrorCodes.INVALID_STATE,
        `Cannot complete mission in ${activeMission.status} state`
      );
    }

    // Get mission definition
    const definition = await this.query<MissionDefinitionRow>(
      `SELECT * FROM mission_definitions WHERE id = ?`,
      activeMission.mission_definition_id
    );

    if (!definition) {
      return this.error(ErrorCodes.NOT_FOUND, 'Mission definition not found');
    }

    const objectives = this.parseJsonField<MissionObjective[]>(
      definition.objectives,
      []
    );
    const completedIds = this.parseJsonField<string[]>(
      activeMission.objectives_completed as unknown as string,
      []
    );

    const requiredObjectives = objectives.filter((o) => !o.is_optional);
    const optionalObjectives = objectives.filter((o) => o.is_optional);

    // Check if all required objectives completed
    const allRequiredComplete = requiredObjectives.every((o) =>
      completedIds.includes(o.id)
    );

    if (!allRequiredComplete) {
      return this.error(
        ErrorCodes.VALIDATION_ERROR,
        'Not all required objectives completed'
      );
    }

    // Calculate rewards
    const character = await this.getCharacter();
    const now = new Date();

    const startTime = activeMission.started_at
      ? new Date(activeMission.started_at).getTime()
      : new Date(activeMission.accepted_at).getTime();
    const completionTime = Math.floor((now.getTime() - startTime) / 1000);

    // Calculate pay
    const bonusObjectivesCompleted = completedIds.filter((id) =>
      optionalObjectives.some((o) => o.id === id)
    ).length;

    let basePay = definition.base_pay;
    let bonusPay = 0;

    // Bonus for optional objectives
    bonusPay += bonusObjectivesCompleted * (definition.bonus_pay ?? 0);

    // Bonus for stealth
    if (activeMission.stealth_maintained && definition.mission_type === 'INFILTRATION') {
      bonusPay += Math.round(definition.base_pay * 0.25);
    }

    // Bonus for time (if under limit)
    if (definition.time_limit_seconds && completionTime < definition.time_limit_seconds * 0.7) {
      bonusPay += Math.round(definition.base_pay * 0.15);
    }

    // Penalties
    let penalties = 0;
    const complications = this.parseJsonField<string[]>(
      activeMission.complications_triggered as unknown as string,
      []
    );
    penalties += complications.length * Math.round(definition.base_pay * 0.05);

    const finalPay = Math.max(
      Math.round(basePay * 0.5),
      basePay + bonusPay - penalties
    );

    // Calculate rating change
    const ratingChange = definition.rating_reward;

    // Calculate XP
    const xpReward = definition.xp_reward;

    // Calculate humanity impact
    const humanityChange = definition.humanity_impact ?? 0;

    // Update character
    const newCredits = character.credits + finalPay;
    const newRating = Math.max(0, character.overall_rating + ratingChange);
    const newHumanity = Math.max(
      0,
      Math.min(100, character.humanity_current + humanityChange)
    );

    await this.updateCharacter({
      credits: newCredits,
      overall_rating: newRating,
      humanity_current: newHumanity,
      xp_current: character.xp_current + xpReward,
      xp_total: character.xp_total + xpReward,
    });

    // Update mission
    await this.execute(
      `UPDATE character_missions
       SET status = 'COMPLETED', completed_at = ?,
           final_rating = ?, final_pay = ?,
           time_elapsed_seconds = ?, updated_at = ?
       WHERE id = ?`,
      now.toISOString(),
      ratingChange,
      finalPay,
      completionTime,
      now.toISOString(),
      missionId
    );

    await this.logMissionEvent(missionId, 'COMPLETED', {
      final_pay: finalPay,
      xp_reward: xpReward,
      rating_change: ratingChange,
    });

    return this.success({
      mission_id: missionId,
      mission_name: definition.name,
      status: 'COMPLETED',
      completion_time_seconds: completionTime,
      objectives_completed: completedIds.length,
      objectives_total: objectives.length,
      bonus_objectives: bonusObjectivesCompleted,
      base_pay: basePay,
      bonus_pay: bonusPay,
      penalty_deductions: penalties,
      final_pay: finalPay,
      xp_earned: xpReward,
      rating_change: ratingChange,
      humanity_change: humanityChange,
      new_rating: newRating,
      new_credits: newCredits,
      algorithm_message: this.getCompletionMessage(ratingChange, character.tier),
    });
  }

  /**
   * Fail a mission.
   */
  async failMission(
    missionId: string,
    reason: string
  ): Promise<ServiceResponse<MissionCompletionResult>> {
    const mission = await this.getActiveMission(missionId);
    if (!mission.success) return mission;

    const activeMission = mission.data;

    if (
      activeMission.status !== 'ACCEPTED' &&
      activeMission.status !== 'IN_PROGRESS'
    ) {
      return this.error(
        ErrorCodes.INVALID_STATE,
        `Cannot fail mission in ${activeMission.status} state`
      );
    }

    const definition = await this.query<MissionDefinitionRow>(
      `SELECT * FROM mission_definitions WHERE id = ?`,
      activeMission.mission_definition_id
    );

    if (!definition) {
      return this.error(ErrorCodes.NOT_FOUND, 'Mission definition not found');
    }

    const character = await this.getCharacter();
    const now = new Date();

    // Apply penalties
    const ratingPenalty = -definition.rating_penalty;
    const newRating = Math.max(0, character.overall_rating + ratingPenalty);

    await this.updateCharacter({
      overall_rating: newRating,
    });

    // Update mission
    await this.execute(
      `UPDATE character_missions
       SET status = 'FAILED', completed_at = ?,
           final_rating = ?, final_pay = 0, updated_at = ?
       WHERE id = ?`,
      now.toISOString(),
      ratingPenalty,
      now.toISOString(),
      missionId
    );

    await this.logMissionEvent(missionId, 'FAILED', { reason });

    const completedIds = this.parseJsonField<string[]>(
      activeMission.objectives_completed as unknown as string,
      []
    );
    const objectives = this.parseJsonField<MissionObjective[]>(
      definition.objectives,
      []
    );

    return this.success({
      mission_id: missionId,
      mission_name: definition.name,
      status: 'FAILED',
      completion_time_seconds: 0,
      objectives_completed: completedIds.length,
      objectives_total: objectives.length,
      bonus_objectives: 0,
      base_pay: 0,
      bonus_pay: 0,
      penalty_deductions: 0,
      final_pay: 0,
      xp_earned: 0,
      rating_change: ratingPenalty,
      humanity_change: 0,
      new_rating: newRating,
      new_credits: character.credits,
      algorithm_message: this.getFailureMessage(reason),
    });
  }

  /**
   * Abandon a mission.
   */
  async abandonMission(
    missionId: string
  ): Promise<ServiceResponse<MissionAbandonResult>> {
    const mission = await this.getActiveMission(missionId);
    if (!mission.success) return mission;

    const activeMission = mission.data;

    if (
      activeMission.status !== 'ACCEPTED' &&
      activeMission.status !== 'IN_PROGRESS'
    ) {
      return this.error(
        ErrorCodes.INVALID_STATE,
        `Cannot abandon mission in ${activeMission.status} state`
      );
    }

    const definition = await this.query<MissionDefinitionRow>(
      `SELECT * FROM mission_definitions WHERE id = ?`,
      activeMission.mission_definition_id
    );

    if (!definition) {
      return this.error(ErrorCodes.NOT_FOUND, 'Mission definition not found');
    }

    const character = await this.getCharacter();
    const now = new Date();

    // Apply penalty (half of failure penalty)
    const ratingPenalty = -Math.round(definition.rating_penalty / 2);
    const newRating = Math.max(0, character.overall_rating + ratingPenalty);

    await this.updateCharacter({
      overall_rating: newRating,
    });

    // Update mission
    await this.execute(
      `UPDATE character_missions
       SET status = 'ABANDONED', completed_at = ?,
           final_rating = ?, final_pay = 0, updated_at = ?
       WHERE id = ?`,
      now.toISOString(),
      ratingPenalty,
      now.toISOString(),
      missionId
    );

    await this.logMissionEvent(missionId, 'ABANDONED', {});

    // Calculate cooldown
    let cooldownUntil: string | null = null;
    if (definition.cooldown_hours) {
      const cooldown = new Date(now);
      cooldown.setHours(cooldown.getHours() + definition.cooldown_hours * 2);
      cooldownUntil = cooldown.toISOString();
    }

    return this.success({
      mission_id: missionId,
      mission_name: definition.name,
      penalty_applied: ratingPenalty < 0,
      rating_penalty: Math.abs(ratingPenalty),
      credits_lost: 0,
      new_rating: newRating,
      cooldown_until: cooldownUntil,
      algorithm_message:
        'MISSION ABANDONED. RELIABILITY METRICS UPDATED. THE ALGORITHM NOTES YOUR HESITATION.',
    });
  }

  /**
   * Get character's active missions.
   */
  async getActiveMissions(): Promise<
    ServiceResponse<{ missions: ActiveMission[] }>
  > {
    const missions = await this.queryAll<ActiveMissionRow>(
      `SELECT cm.*, md.name as mission_name, md.mission_type
       FROM character_missions cm
       JOIN mission_definitions md ON cm.mission_definition_id = md.id
       WHERE cm.character_id = ? AND cm.status IN ('ACCEPTED', 'IN_PROGRESS')
       ORDER BY cm.accepted_at DESC`,
      this.requiredCharacterId
    );

    return this.success({
      missions: missions.map((m) => this.formatActiveMission(m)),
    });
  }

  /**
   * Get mission history.
   */
  async getMissionHistory(
    limit: number = 20,
    offset: number = 0
  ): Promise<
    ServiceResponse<{ missions: ActiveMission[]; total: number }>
  > {
    const missions = await this.queryAll<ActiveMissionRow>(
      `SELECT cm.*, md.name as mission_name, md.mission_type
       FROM character_missions cm
       JOIN mission_definitions md ON cm.mission_definition_id = md.id
       WHERE cm.character_id = ?
       ORDER BY cm.completed_at DESC NULLS LAST, cm.accepted_at DESC
       LIMIT ? OFFSET ?`,
      this.requiredCharacterId,
      limit,
      offset
    );

    const countResult = await this.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM character_missions WHERE character_id = ?`,
      this.requiredCharacterId
    );

    return this.success({
      missions: missions.map((m) => this.formatActiveMission(m)),
      total: countResult?.count ?? 0,
    });
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private async getActiveMission(
    missionId: string
  ): Promise<ServiceResponse<ActiveMissionRow>> {
    const mission = await this.query<ActiveMissionRow>(
      `SELECT * FROM character_missions WHERE id = ? AND character_id = ?`,
      missionId,
      this.requiredCharacterId
    );

    if (!mission) {
      return this.error(ErrorCodes.NOT_FOUND, 'Mission not found');
    }

    return this.success(mission);
  }

  private formatMissionDefinition(row: MissionDefinitionRow): MissionDefinition {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description ?? '',
      mission_type: row.mission_type as MissionType,
      tier_required: row.tier_required,
      client_faction_id: row.client_faction_id,
      target_location_id: row.target_location_id,
      base_pay: row.base_pay,
      bonus_pay: row.bonus_pay ?? 0,
      time_limit_seconds: row.time_limit_seconds,
      xp_reward: row.xp_reward,
      rating_reward: row.rating_reward,
      rating_penalty: row.rating_penalty,
      humanity_impact: row.humanity_impact ?? 0,
      objectives: this.parseJsonField(row.objectives, []),
      complications: this.parseJsonField(row.complications, []),
      is_repeatable: row.is_repeatable === 1,
      cooldown_hours: row.cooldown_hours,
    };
  }

  private formatActiveMission(row: ActiveMissionRow): ActiveMission {
    return {
      id: row.id,
      character_id: row.character_id,
      mission_definition_id: row.mission_definition_id,
      status: row.status as MissionStatus,
      accepted_at: row.accepted_at,
      expires_at: row.expires_at,
      started_at: row.started_at,
      completed_at: row.completed_at,
      current_objective_index: row.current_objective_index,
      objectives_completed: this.parseJsonField(row.objectives_completed, []),
      complications_triggered: this.parseJsonField(row.complications_triggered, []),
      bonus_objectives_completed: this.parseJsonField(row.bonus_objectives_completed, []),
      distance_traveled_m: row.distance_traveled_m,
      time_elapsed_seconds: row.time_elapsed_seconds,
      damage_taken: row.damage_taken,
      stealth_maintained: row.stealth_maintained === 1,
      final_rating: row.final_rating,
      final_pay: row.final_pay,
    };
  }

  private parseJsonField<T>(value: string | null, defaultValue: T): T {
    if (!value) return defaultValue;
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }

  private async logMissionEvent(
    missionId: string,
    event: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await this.execute(
      `INSERT INTO mission_event_log
       (id, mission_id, character_id, event_type, event_data, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      crypto.randomUUID(),
      missionId,
      this.requiredCharacterId,
      event,
      JSON.stringify(data),
      new Date().toISOString()
    );
  }

  private getAcceptanceMessage(missionType: string, _tier: number): string {
    const messages: Record<string, string> = {
      DELIVERY: 'DELIVERY CONTRACT ACCEPTED. TIME IS EFFICIENCY. EFFICIENCY IS SURVIVAL.',
      EXTRACTION: 'EXTRACTION PARAMETERS LOADED. DISCRETION RECOMMENDED.',
      ESCORT: 'PROTECTION PROTOCOLS ENGAGED. CARGO INTEGRITY IS PARAMOUNT.',
      COMBAT: 'COMBAT AUTHORIZATION GRANTED. THE ALGORITHM OBSERVES YOUR PERFORMANCE.',
      INFILTRATION: 'STEALTH PROTOCOLS ACTIVE. AVOID DETECTION. COMPLETE OBJECTIVES.',
      INVESTIGATION: 'INVESTIGATION INITIATED. GATHER INTELLIGENCE. REPORT FINDINGS.',
      COURIER: 'COURIER CONTRACT LOGGED. SPEED AND RELIABILITY METRICS WILL BE RECORDED.',
      CONTRACT: 'CONTRACT ACCEPTED. TERMS ARE BINDING. FAILURE HAS CONSEQUENCES.',
    };
    return messages[missionType] ?? 'MISSION ACCEPTED. THE ALGORITHM IS WATCHING.';
  }

  private getCompletionMessage(ratingChange: number, _tier: number): string {
    if (ratingChange >= 10) {
      return 'EXCEPTIONAL PERFORMANCE. YOUR EFFICIENCY METRICS EXCEED EXPECTATIONS. THE ALGORITHM IS... PLEASED.';
    }
    if (ratingChange >= 5) {
      return 'MISSION COMPLETE. PERFORMANCE WITHIN ACCEPTABLE PARAMETERS. CONTINUE OPTIMIZING.';
    }
    return 'MISSION COMPLETE. MINIMUM REQUIREMENTS MET. ROOM FOR IMPROVEMENT NOTED.';
  }

  private getFailureMessage(reason: string): string {
    return `MISSION FAILED: ${reason.toUpperCase()}. PERFORMANCE METRICS DEGRADED. THE ALGORITHM HAS UPDATED YOUR RELIABILITY SCORE.`;
  }
}

// =============================================================================
// DATABASE ROW TYPES
// =============================================================================

interface MissionDefinitionRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  mission_type: string;
  tier_required: number;
  client_faction_id: string | null;
  target_location_id: string | null;
  base_pay: number;
  bonus_pay: number | null;
  time_limit_seconds: number | null;
  xp_reward: number;
  rating_reward: number;
  rating_penalty: number;
  humanity_impact: number | null;
  objectives: string | null;
  complications: string | null;
  is_repeatable: number;
  is_active: number;
  cooldown_hours: number | null;
  client_name?: string;
  location_name?: string;
}

interface ActiveMissionRow {
  id: string;
  character_id: string;
  mission_definition_id: string;
  status: string;
  accepted_at: string;
  expires_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  current_objective_index: number;
  objectives_completed: string;
  complications_triggered: string;
  bonus_objectives_completed: string;
  distance_traveled_m: number;
  time_elapsed_seconds: number;
  damage_taken: number;
  stealth_maintained: number;
  final_rating: number | null;
  final_pay: number | null;
  mission_name?: string;
  mission_type?: string;
}
