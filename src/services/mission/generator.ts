/**
 * Surge Protocol - Mission Generator Service
 *
 * Procedurally generates missions using templates and variable substitution.
 * Creates dynamic, tier-appropriate missions with appropriate rewards.
 */

import {
  BaseService,
  type ServiceContext,
  type ServiceResponse,
  ErrorCodes,
} from '../base/index';

// =============================================================================
// TYPES
// =============================================================================

export type MissionType =
  | 'DELIVERY'
  | 'EXTRACTION'
  | 'ESCORT'
  | 'COMBAT'
  | 'INFILTRATION'
  | 'INVESTIGATION'
  | 'COURIER'
  | 'CONTRACT';

export type MissionDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME';

export interface MissionTemplate {
  id: string;
  code: string;
  name_template: string;
  description_template: string;
  mission_type: MissionType;
  tier_range: { min: number; max: number };
  difficulty_modifiers: DifficultyModifiers;
  objective_templates: ObjectiveTemplate[];
  complication_pool: string[];
  variable_slots: VariableSlot[];
  reward_formula: RewardFormula;
}

export interface DifficultyModifiers {
  time_multiplier: number;
  pay_multiplier: number;
  xp_multiplier: number;
  complication_chance: number;
}

export interface ObjectiveTemplate {
  id: string;
  type: string;
  description_template: string;
  variable_slot: string | null;
  is_optional: boolean;
  bonus_reward_percent: number;
  sequence_order: number;
}

export interface VariableSlot {
  name: string;
  type: 'LOCATION' | 'NPC' | 'FACTION' | 'ITEM' | 'AMOUNT' | 'TIME';
  query?: string;
  options?: string[];
  tier_scaling?: boolean;
}

export interface RewardFormula {
  base_pay: string;
  xp_reward: string;
  rating_reward: string;
  rating_penalty: string;
  humanity_impact?: string;
}

export interface GeneratedMission {
  id: string;
  name: string;
  description: string;
  mission_type: MissionType;
  difficulty: MissionDifficulty;
  tier_required: number;
  client_name: string | null;
  target_location: string | null;
  base_pay: number;
  bonus_pay: number;
  time_limit_seconds: number | null;
  xp_reward: number;
  rating_reward: number;
  rating_penalty: number;
  humanity_impact: number;
  objectives: GeneratedObjective[];
  complications: string[];
  variables: Record<string, string>;
  algorithm_briefing: string;
}

export interface GeneratedObjective {
  id: string;
  objective_type: string;
  description: string;
  target_value: string | null;
  target_count: number;
  is_optional: boolean;
  bonus_reward: number;
  sequence_order: number;
}

export interface GenerationOptions {
  tier: number;
  mission_type?: MissionType;
  difficulty?: MissionDifficulty;
  faction_id?: string;
  location_id?: string;
  exclude_types?: MissionType[];
  min_pay?: number;
  max_time_limit?: number;
}

export interface GenerationResult {
  mission: GeneratedMission;
  template_used: string;
  seed: number;
}

// =============================================================================
// MISSION TEMPLATES (In-memory for fast generation)
// =============================================================================

const MISSION_TEMPLATES: MissionTemplate[] = [
  // DELIVERY Templates
  {
    id: 'TMPL_DELIVERY_STANDARD',
    code: 'DELIVERY_STANDARD',
    name_template: '{client_type} Delivery to {destination}',
    description_template:
      'Transport a {package_type} from {origin} to {destination}. Client: {client_name}. Time-sensitive delivery.',
    mission_type: 'DELIVERY',
    tier_range: { min: 1, max: 10 },
    difficulty_modifiers: { time_multiplier: 1.0, pay_multiplier: 1.0, xp_multiplier: 1.0, complication_chance: 0.2 },
    objective_templates: [
      { id: 'OBJ_PICKUP', type: 'PICKUP', description_template: 'Pick up package from {origin}', variable_slot: 'origin', is_optional: false, bonus_reward_percent: 0, sequence_order: 1 },
      { id: 'OBJ_DELIVER', type: 'DELIVER', description_template: 'Deliver package to {destination}', variable_slot: 'destination', is_optional: false, bonus_reward_percent: 0, sequence_order: 2 },
    ],
    complication_pool: ['TRAFFIC_JAM', 'GANG_CHECKPOINT', 'PACKAGE_DAMAGE', 'CLIENT_IMPATIENT'],
    variable_slots: [
      { name: 'origin', type: 'LOCATION', tier_scaling: true },
      { name: 'destination', type: 'LOCATION', tier_scaling: true },
      { name: 'client_name', type: 'FACTION', tier_scaling: false },
      { name: 'client_type', type: 'NPC', options: ['Corporate', 'Street', 'Underground', 'Government'] },
      { name: 'package_type', type: 'ITEM', options: ['sealed package', 'data chip', 'medical supplies', 'prototype component', 'confidential documents'] },
    ],
    reward_formula: {
      base_pay: '50 + (tier * 30) + (distance * 0.5)',
      xp_reward: '25 + (tier * 15)',
      rating_reward: '3 + (tier * 1)',
      rating_penalty: '5 + (tier * 1)',
    },
  },
  {
    id: 'TMPL_DELIVERY_EXPRESS',
    code: 'DELIVERY_EXPRESS',
    name_template: 'Express: {package_type} to {destination}',
    description_template:
      'URGENT: {package_type} must reach {destination} within {time_limit} minutes. No excuses. No delays.',
    mission_type: 'DELIVERY',
    tier_range: { min: 2, max: 10 },
    difficulty_modifiers: { time_multiplier: 0.7, pay_multiplier: 1.5, xp_multiplier: 1.3, complication_chance: 0.3 },
    objective_templates: [
      { id: 'OBJ_PICKUP', type: 'PICKUP', description_template: 'Pick up {package_type}', variable_slot: 'origin', is_optional: false, bonus_reward_percent: 0, sequence_order: 1 },
      { id: 'OBJ_DELIVER', type: 'DELIVER', description_template: 'Deliver to {destination} FAST', variable_slot: 'destination', is_optional: false, bonus_reward_percent: 0, sequence_order: 2 },
      { id: 'OBJ_SPEED_BONUS', type: 'TIME_BONUS', description_template: 'Deliver 30% under time limit', variable_slot: null, is_optional: true, bonus_reward_percent: 25, sequence_order: 3 },
    ],
    complication_pool: ['VEHICLE_MALFUNCTION', 'POLICE_CHASE', 'BLOCKED_ROUTE', 'RIVAL_COURIER'],
    variable_slots: [
      { name: 'origin', type: 'LOCATION', tier_scaling: true },
      { name: 'destination', type: 'LOCATION', tier_scaling: true },
      { name: 'package_type', type: 'ITEM', options: ['organ transplant', 'live specimen', 'volatile chemicals', 'time-sensitive contract'] },
      { name: 'time_limit', type: 'TIME', options: ['15', '20', '25', '30'] },
    ],
    reward_formula: {
      base_pay: '100 + (tier * 50)',
      xp_reward: '40 + (tier * 20)',
      rating_reward: '5 + (tier * 2)',
      rating_penalty: '10 + (tier * 2)',
    },
  },

  // EXTRACTION Templates
  {
    id: 'TMPL_EXTRACTION_PERSON',
    code: 'EXTRACTION_PERSON',
    name_template: 'Extract {target_name} from {danger_zone}',
    description_template:
      '{target_name} needs extraction from {danger_zone}. Hostiles expected. Get them out alive.',
    mission_type: 'EXTRACTION',
    tier_range: { min: 3, max: 10 },
    difficulty_modifiers: { time_multiplier: 1.2, pay_multiplier: 1.8, xp_multiplier: 1.5, complication_chance: 0.4 },
    objective_templates: [
      { id: 'OBJ_INFILTRATE', type: 'TRAVEL', description_template: 'Reach {danger_zone}', variable_slot: 'danger_zone', is_optional: false, bonus_reward_percent: 0, sequence_order: 1 },
      { id: 'OBJ_LOCATE', type: 'FIND', description_template: 'Locate {target_name}', variable_slot: 'target_name', is_optional: false, bonus_reward_percent: 0, sequence_order: 2 },
      { id: 'OBJ_EXTRACT', type: 'ESCORT', description_template: 'Extract {target_name} safely', variable_slot: 'target_name', is_optional: false, bonus_reward_percent: 0, sequence_order: 3 },
      { id: 'OBJ_STEALTH', type: 'STEALTH', description_template: 'Complete without raising alarm', variable_slot: null, is_optional: true, bonus_reward_percent: 30, sequence_order: 4 },
    ],
    complication_pool: ['INCREASED_SECURITY', 'TARGET_INJURED', 'DOUBLE_CROSS', 'REINFORCEMENTS'],
    variable_slots: [
      { name: 'target_name', type: 'NPC', tier_scaling: false },
      { name: 'danger_zone', type: 'LOCATION', tier_scaling: true },
    ],
    reward_formula: {
      base_pay: '200 + (tier * 80)',
      xp_reward: '60 + (tier * 30)',
      rating_reward: '8 + (tier * 2)',
      rating_penalty: '15 + (tier * 3)',
      humanity_impact: '5',
    },
  },

  // COMBAT Templates
  {
    id: 'TMPL_COMBAT_ELIMINATION',
    code: 'COMBAT_ELIMINATION',
    name_template: 'Eliminate {target_count} {enemy_type}',
    description_template:
      '{enemy_type} activity in {combat_zone}. Eliminate {target_count} hostiles. Lethal force authorized.',
    mission_type: 'COMBAT',
    tier_range: { min: 3, max: 10 },
    difficulty_modifiers: { time_multiplier: 1.5, pay_multiplier: 2.0, xp_multiplier: 1.8, complication_chance: 0.5 },
    objective_templates: [
      { id: 'OBJ_TRAVEL', type: 'TRAVEL', description_template: 'Reach {combat_zone}', variable_slot: 'combat_zone', is_optional: false, bonus_reward_percent: 0, sequence_order: 1 },
      { id: 'OBJ_ELIMINATE', type: 'KILL', description_template: 'Eliminate {target_count} {enemy_type}', variable_slot: 'target_count', is_optional: false, bonus_reward_percent: 0, sequence_order: 2 },
      { id: 'OBJ_SURVIVE', type: 'SURVIVE', description_template: 'Survive and extract', variable_slot: null, is_optional: false, bonus_reward_percent: 0, sequence_order: 3 },
      { id: 'OBJ_NO_DAMAGE', type: 'HEALTH', description_template: 'Complete with minimal damage', variable_slot: null, is_optional: true, bonus_reward_percent: 20, sequence_order: 4 },
    ],
    complication_pool: ['HEAVY_RESISTANCE', 'BOSS_ENEMY', 'ENVIRONMENTAL_HAZARD', 'AMMUNITION_SHORTAGE'],
    variable_slots: [
      { name: 'combat_zone', type: 'LOCATION', tier_scaling: true },
      { name: 'enemy_type', type: 'NPC', options: ['gang members', 'corporate security', 'rogue couriers', 'cyberpsychos', 'mercenaries'] },
      { name: 'target_count', type: 'AMOUNT', options: ['3', '5', '7', '10'] },
    ],
    reward_formula: {
      base_pay: '150 + (tier * 75) + (target_count * 20)',
      xp_reward: '50 + (tier * 25)',
      rating_reward: '6 + (tier * 2)',
      rating_penalty: '12 + (tier * 2)',
      humanity_impact: '-10',
    },
  },

  // INFILTRATION Templates
  {
    id: 'TMPL_INFILTRATION_DATA',
    code: 'INFILTRATION_DATA',
    name_template: 'Data Heist: {target_facility}',
    description_template:
      'Infiltrate {target_facility} and extract {data_type}. Stealth is paramount. Detection means failure.',
    mission_type: 'INFILTRATION',
    tier_range: { min: 4, max: 10 },
    difficulty_modifiers: { time_multiplier: 1.0, pay_multiplier: 2.2, xp_multiplier: 2.0, complication_chance: 0.35 },
    objective_templates: [
      { id: 'OBJ_INFILTRATE', type: 'STEALTH', description_template: 'Infiltrate {target_facility}', variable_slot: 'target_facility', is_optional: false, bonus_reward_percent: 0, sequence_order: 1 },
      { id: 'OBJ_ACCESS', type: 'HACK', description_template: 'Access secure terminal', variable_slot: null, is_optional: false, bonus_reward_percent: 0, sequence_order: 2 },
      { id: 'OBJ_EXTRACT_DATA', type: 'COLLECT', description_template: 'Download {data_type}', variable_slot: 'data_type', is_optional: false, bonus_reward_percent: 0, sequence_order: 3 },
      { id: 'OBJ_EXFIL', type: 'ESCAPE', description_template: 'Exfiltrate undetected', variable_slot: null, is_optional: false, bonus_reward_percent: 0, sequence_order: 4 },
      { id: 'OBJ_GHOST', type: 'PERFECT_STEALTH', description_template: 'Leave no trace', variable_slot: null, is_optional: true, bonus_reward_percent: 40, sequence_order: 5 },
    ],
    complication_pool: ['SECURITY_UPGRADE', 'PATROL_CHANGE', 'ALARM_TRIGGER', 'INSIDE_MAN_COMPROMISED'],
    variable_slots: [
      { name: 'target_facility', type: 'LOCATION', tier_scaling: true },
      { name: 'data_type', type: 'ITEM', options: ['research files', 'financial records', 'security protocols', 'personnel database', 'algorithm code'] },
    ],
    reward_formula: {
      base_pay: '300 + (tier * 100)',
      xp_reward: '80 + (tier * 35)',
      rating_reward: '10 + (tier * 3)',
      rating_penalty: '20 + (tier * 4)',
      humanity_impact: '-5',
    },
  },

  // ESCORT Templates
  {
    id: 'TMPL_ESCORT_VIP',
    code: 'ESCORT_VIP',
    name_template: 'VIP Escort: {vip_name}',
    description_template:
      'Escort {vip_name} from {origin} to {destination}. Keep them alive at all costs. Threats expected.',
    mission_type: 'ESCORT',
    tier_range: { min: 4, max: 10 },
    difficulty_modifiers: { time_multiplier: 1.3, pay_multiplier: 1.7, xp_multiplier: 1.4, complication_chance: 0.45 },
    objective_templates: [
      { id: 'OBJ_MEET', type: 'TRAVEL', description_template: 'Meet {vip_name} at {origin}', variable_slot: 'origin', is_optional: false, bonus_reward_percent: 0, sequence_order: 1 },
      { id: 'OBJ_ESCORT', type: 'ESCORT', description_template: 'Escort to {destination}', variable_slot: 'destination', is_optional: false, bonus_reward_percent: 0, sequence_order: 2 },
      { id: 'OBJ_PROTECT', type: 'PROTECT', description_template: 'Keep {vip_name} alive', variable_slot: 'vip_name', is_optional: false, bonus_reward_percent: 0, sequence_order: 3 },
      { id: 'OBJ_UNHARMED', type: 'HEALTH', description_template: 'VIP takes no damage', variable_slot: null, is_optional: true, bonus_reward_percent: 25, sequence_order: 4 },
    ],
    complication_pool: ['AMBUSH', 'VIP_PANIC', 'ALTERNATE_ROUTE_NEEDED', 'BETRAYAL'],
    variable_slots: [
      { name: 'vip_name', type: 'NPC', tier_scaling: true },
      { name: 'origin', type: 'LOCATION', tier_scaling: true },
      { name: 'destination', type: 'LOCATION', tier_scaling: true },
    ],
    reward_formula: {
      base_pay: '250 + (tier * 90)',
      xp_reward: '70 + (tier * 30)',
      rating_reward: '8 + (tier * 2)',
      rating_penalty: '18 + (tier * 3)',
    },
  },

  // INVESTIGATION Templates
  {
    id: 'TMPL_INVESTIGATION_MISSING',
    code: 'INVESTIGATION_MISSING',
    name_template: 'Find {missing_person}',
    description_template:
      '{missing_person} went missing near {last_seen_location}. Find them. Find out what happened.',
    mission_type: 'INVESTIGATION',
    tier_range: { min: 2, max: 8 },
    difficulty_modifiers: { time_multiplier: 2.0, pay_multiplier: 1.4, xp_multiplier: 1.6, complication_chance: 0.25 },
    objective_templates: [
      { id: 'OBJ_INVESTIGATE', type: 'INVESTIGATE', description_template: 'Search {last_seen_location}', variable_slot: 'last_seen_location', is_optional: false, bonus_reward_percent: 0, sequence_order: 1 },
      { id: 'OBJ_CLUES', type: 'COLLECT', description_template: 'Gather clues', variable_slot: null, is_optional: false, bonus_reward_percent: 0, sequence_order: 2 },
      { id: 'OBJ_WITNESSES', type: 'TALK', description_template: 'Interview witnesses', variable_slot: null, is_optional: false, bonus_reward_percent: 0, sequence_order: 3 },
      { id: 'OBJ_FIND', type: 'FIND', description_template: 'Locate {missing_person}', variable_slot: 'missing_person', is_optional: false, bonus_reward_percent: 0, sequence_order: 4 },
      { id: 'OBJ_ALL_CLUES', type: 'COLLECT_ALL', description_template: 'Find all clues', variable_slot: null, is_optional: true, bonus_reward_percent: 20, sequence_order: 5 },
    ],
    complication_pool: ['FALSE_LEAD', 'HOSTILE_WITNESS', 'CRIME_SCENE_DISTURBED', 'TIME_SENSITIVE_CLUE'],
    variable_slots: [
      { name: 'missing_person', type: 'NPC', tier_scaling: false },
      { name: 'last_seen_location', type: 'LOCATION', tier_scaling: true },
    ],
    reward_formula: {
      base_pay: '120 + (tier * 55)',
      xp_reward: '45 + (tier * 22)',
      rating_reward: '5 + (tier * 2)',
      rating_penalty: '8 + (tier * 1)',
      humanity_impact: '3',
    },
  },
];

// =============================================================================
// VARIABLE POOLS (In-memory for fast lookups)
// =============================================================================

const LOCATION_POOLS: Record<string, string[]> = {
  LOW_TIER: ['The Hollows', 'Gutters', 'Market Square', 'Dispatch Station', "Rosa's Shop"],
  MID_TIER: ['Red Harbor', 'Industrial Zone', 'Night Market', 'Docklands', 'Factory Corridor'],
  HIGH_TIER: ['Silicon Heights', 'Uptown Corporate', 'Nakamura Tower', 'Executive Residences'],
  DANGEROUS: ['Razor Territory', 'Chrome Saints Turf', 'Iron Dragon Forge', 'Abandoned Factory'],
};

const NPC_POOLS: Record<string, string[]> = {
  CLIENTS: ['Anonymous Client', 'Corporate Contact', 'Street Fixer', 'Government Agent', 'Underground Broker'],
  TARGETS: ['The Asset', 'The Witness', 'The Defector', 'The Scientist', 'The Executive'],
  VIPS: ['Dr. Tanaka', 'Corporate Executive', 'Union Organizer', 'Tech Magnate', 'Diplomat'],
  MISSING: ['Marcus Chen', 'Elena Vasquez', 'Jin the Runner', 'Unnamed Courier', 'Factory Worker'],
};

const FACTION_NAMES = [
  'OmniDeliver',
  'Nakamura Industries',
  'Union Collective',
  'Apex Security',
  'Neon Saints',
  'Circuit Breakers',
];

// =============================================================================
// MISSION GENERATOR SERVICE
// =============================================================================

export class MissionGeneratorService extends BaseService {
  constructor(context: ServiceContext) {
    super(context);
  }

  /**
   * Generate a random mission for the given options.
   */
  async generateMission(
    options: GenerationOptions
  ): Promise<ServiceResponse<GenerationResult>> {
    const seed = Math.floor(Math.random() * 1000000);
    const rng = this.createSeededRandom(seed);

    // Select appropriate template
    const template = this.selectTemplate(options, rng);
    if (!template) {
      return this.error(
        ErrorCodes.NOT_FOUND,
        'No suitable mission template found for the given options'
      );
    }

    // Determine difficulty
    const difficulty = options.difficulty ?? this.selectDifficulty(options.tier, rng);

    // Generate variables
    const variables = await this.generateVariables(template, options, rng);

    // Generate objectives
    const objectives = this.generateObjectives(template, variables, rng);

    // Select complications
    const complications = this.selectComplications(template, difficulty, rng);

    // Calculate rewards
    const rewards = this.calculateRewards(template, options.tier, difficulty, variables);

    // Build mission name and description
    const name = this.interpolateTemplate(template.name_template, variables);
    const description = this.interpolateTemplate(template.description_template, variables);

    // Generate algorithm briefing
    const algorithmBriefing = this.generateAlgorithmBriefing(
      template.mission_type,
      difficulty,
      options.tier
    );

    const mission: GeneratedMission = {
      id: crypto.randomUUID(),
      name,
      description,
      mission_type: template.mission_type,
      difficulty,
      tier_required: options.tier,
      client_name: variables.client_name ?? null,
      target_location: variables.destination ?? variables.target_facility ?? variables.combat_zone ?? null,
      base_pay: rewards.base_pay,
      bonus_pay: rewards.bonus_pay,
      time_limit_seconds: rewards.time_limit_seconds,
      xp_reward: rewards.xp_reward,
      rating_reward: rewards.rating_reward,
      rating_penalty: rewards.rating_penalty,
      humanity_impact: rewards.humanity_impact,
      objectives,
      complications,
      variables,
      algorithm_briefing: algorithmBriefing,
    };

    return this.success({
      mission,
      template_used: template.code,
      seed,
    });
  }

  /**
   * Generate multiple missions as a batch.
   */
  async generateMissionBatch(
    options: GenerationOptions,
    count: number
  ): Promise<ServiceResponse<GenerationResult[]>> {
    const results: GenerationResult[] = [];
    const usedTemplates = new Set<string>();

    for (let i = 0; i < count; i++) {
      const modifiedOptions = {
        ...options,
        exclude_types: [
          ...(options.exclude_types ?? []),
        ],
      };

      const result = await this.generateMission(modifiedOptions);
      if (result.success) {
        // Try to avoid duplicate templates
        if (!usedTemplates.has(result.data.template_used) || usedTemplates.size >= MISSION_TEMPLATES.length) {
          results.push(result.data);
          usedTemplates.add(result.data.template_used);
        } else {
          // Generate again
          i--;
        }
      }
    }

    return this.success(results);
  }

  /**
   * Save a generated mission to the database as a mission definition.
   */
  async saveMission(
    mission: GeneratedMission
  ): Promise<ServiceResponse<{ mission_id: string }>> {
    const code = `GEN_${mission.mission_type}_${Date.now().toString(36).toUpperCase()}`;

    await this.execute(
      `INSERT INTO mission_definitions
       (id, code, name, description, mission_type, tier_required,
        base_pay, bonus_pay, time_limit_seconds, xp_reward,
        rating_reward, rating_penalty, humanity_impact,
        objectives, complications, is_repeatable, is_active,
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
      mission.id,
      code,
      mission.name,
      mission.description,
      mission.mission_type,
      mission.tier_required,
      mission.base_pay,
      mission.bonus_pay,
      mission.time_limit_seconds,
      mission.xp_reward,
      mission.rating_reward,
      mission.rating_penalty,
      mission.humanity_impact,
      JSON.stringify(mission.objectives),
      JSON.stringify(mission.complications),
      new Date().toISOString(),
      new Date().toISOString()
    );

    return this.success({ mission_id: mission.id });
  }

  /**
   * Get available mission types for a tier.
   */
  getAvailableTypes(tier: number): MissionType[] {
    const types = new Set<MissionType>();

    for (const template of MISSION_TEMPLATES) {
      if (tier >= template.tier_range.min && tier <= template.tier_range.max) {
        types.add(template.mission_type);
      }
    }

    return [...types];
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private selectTemplate(
    options: GenerationOptions,
    rng: () => number
  ): MissionTemplate | null {
    const eligible = MISSION_TEMPLATES.filter((t) => {
      // Check tier range
      if (options.tier < t.tier_range.min || options.tier > t.tier_range.max) {
        return false;
      }

      // Check mission type filter
      if (options.mission_type && t.mission_type !== options.mission_type) {
        return false;
      }

      // Check excluded types
      if (options.exclude_types?.includes(t.mission_type)) {
        return false;
      }

      return true;
    });

    if (eligible.length === 0) return null;

    // Weight by tier appropriateness
    const weighted = eligible.map((t) => {
      const tierDistance = Math.abs(options.tier - (t.tier_range.min + t.tier_range.max) / 2);
      const weight = 10 - tierDistance;
      return { template: t, weight: Math.max(1, weight) };
    });

    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let random = rng() * totalWeight;

    for (const w of weighted) {
      random -= w.weight;
      if (random <= 0) {
        return w.template;
      }
    }

    return weighted[0]?.template ?? null;
  }

  private selectDifficulty(tier: number, rng: () => number): MissionDifficulty {
    const roll = rng();
    if (tier <= 2) {
      return roll < 0.7 ? 'EASY' : 'NORMAL';
    }
    if (tier <= 5) {
      if (roll < 0.3) return 'EASY';
      if (roll < 0.7) return 'NORMAL';
      return 'HARD';
    }
    if (tier <= 8) {
      if (roll < 0.2) return 'NORMAL';
      if (roll < 0.6) return 'HARD';
      return 'EXTREME';
    }
    return roll < 0.4 ? 'HARD' : 'EXTREME';
  }

  private async generateVariables(
    template: MissionTemplate,
    options: GenerationOptions,
    rng: () => number
  ): Promise<Record<string, string>> {
    const variables: Record<string, string> = {};

    for (const slot of template.variable_slots) {
      let value: string;

      switch (slot.type) {
        case 'LOCATION':
          value = this.selectLocation(options.tier, slot.tier_scaling ?? false, rng);
          break;
        case 'NPC':
          if (slot.options) {
            value = this.selectFromArray(slot.options, rng);
          } else {
            const pool = slot.name.includes('vip') ? 'VIPS' :
                        slot.name.includes('missing') ? 'MISSING' :
                        slot.name.includes('target') ? 'TARGETS' : 'CLIENTS';
            value = this.selectFromArray(NPC_POOLS[pool] ?? ['Unknown'], rng);
          }
          break;
        case 'FACTION':
          value = this.selectFromArray(FACTION_NAMES, rng);
          break;
        case 'ITEM':
          value = this.selectFromArray(slot.options ?? ['package'], rng);
          break;
        case 'AMOUNT':
          value = this.selectFromArray(slot.options ?? ['5'], rng);
          break;
        case 'TIME':
          value = this.selectFromArray(slot.options ?? ['30'], rng);
          break;
        default:
          value = 'unknown';
      }

      variables[slot.name] = value;
    }

    return variables;
  }

  private selectLocation(tier: number, tierScaling: boolean, rng: () => number): string {
    let pool: string[];

    if (!tierScaling) {
      pool = [...LOCATION_POOLS.LOW_TIER!, ...LOCATION_POOLS.MID_TIER!];
    } else if (tier <= 2) {
      pool = LOCATION_POOLS.LOW_TIER!;
    } else if (tier <= 5) {
      pool = [...LOCATION_POOLS.LOW_TIER!, ...LOCATION_POOLS.MID_TIER!];
    } else if (tier <= 8) {
      pool = [...LOCATION_POOLS.MID_TIER!, ...LOCATION_POOLS.HIGH_TIER!];
    } else {
      pool = [...LOCATION_POOLS.HIGH_TIER!, ...LOCATION_POOLS.DANGEROUS!];
    }

    return this.selectFromArray(pool, rng);
  }

  private generateObjectives(
    template: MissionTemplate,
    variables: Record<string, string>,
    _rng: () => number
  ): GeneratedObjective[] {
    return template.objective_templates.map((obj) => ({
      id: crypto.randomUUID(),
      objective_type: obj.type,
      description: this.interpolateTemplate(obj.description_template, variables),
      target_value: obj.variable_slot ? variables[obj.variable_slot] ?? null : null,
      target_count: obj.type === 'KILL' ? parseInt(variables.target_count ?? '5', 10) : 1,
      is_optional: obj.is_optional,
      bonus_reward: obj.bonus_reward_percent,
      sequence_order: obj.sequence_order,
    }));
  }

  private selectComplications(
    template: MissionTemplate,
    difficulty: MissionDifficulty,
    rng: () => number
  ): string[] {
    const difficultyMods: Record<MissionDifficulty, number> = {
      EASY: 0.1,
      NORMAL: 0.2,
      HARD: 0.35,
      EXTREME: 0.5,
    };

    const baseChance = template.difficulty_modifiers.complication_chance;
    const chance = baseChance * (1 + difficultyMods[difficulty]);

    const complications: string[] = [];
    const maxComplications = difficulty === 'EXTREME' ? 3 : difficulty === 'HARD' ? 2 : 1;

    for (const comp of template.complication_pool) {
      if (rng() < chance && complications.length < maxComplications) {
        complications.push(comp);
      }
    }

    return complications;
  }

  private calculateRewards(
    template: MissionTemplate,
    tier: number,
    difficulty: MissionDifficulty,
    variables: Record<string, string>
  ): {
    base_pay: number;
    bonus_pay: number;
    time_limit_seconds: number | null;
    xp_reward: number;
    rating_reward: number;
    rating_penalty: number;
    humanity_impact: number;
  } {
    const difficultyMods: Record<MissionDifficulty, number> = {
      EASY: 0.8,
      NORMAL: 1.0,
      HARD: 1.4,
      EXTREME: 2.0,
    };

    const mod = difficultyMods[difficulty] * template.difficulty_modifiers.pay_multiplier;
    const xpMod = difficultyMods[difficulty] * template.difficulty_modifiers.xp_multiplier;

    const distance = Math.floor(Math.random() * 1000 + 500);
    const targetCount = parseInt(variables.target_count ?? '5', 10);

    const basePay = this.evaluateFormula(template.reward_formula.base_pay, { tier, distance, target_count: targetCount });
    const xpReward = this.evaluateFormula(template.reward_formula.xp_reward, { tier });
    const ratingReward = this.evaluateFormula(template.reward_formula.rating_reward, { tier });
    const ratingPenalty = this.evaluateFormula(template.reward_formula.rating_penalty, { tier });
    const humanityImpact = template.reward_formula.humanity_impact
      ? this.evaluateFormula(template.reward_formula.humanity_impact, { tier })
      : 0;

    // Time limit based on difficulty
    const baseTime = 1800; // 30 minutes
    const timeMod = template.difficulty_modifiers.time_multiplier;
    const timeLimit = difficulty === 'EASY' ? null : Math.round(baseTime * timeMod * (difficulty === 'EXTREME' ? 0.7 : 1));

    return {
      base_pay: Math.round(basePay * mod),
      bonus_pay: Math.round(basePay * mod * 0.3),
      time_limit_seconds: timeLimit,
      xp_reward: Math.round(xpReward * xpMod),
      rating_reward: Math.round(ratingReward * (difficulty === 'EXTREME' ? 1.5 : 1)),
      rating_penalty: Math.round(ratingPenalty * (difficulty === 'EASY' ? 0.5 : 1)),
      humanity_impact: Math.round(humanityImpact),
    };
  }

  private evaluateFormula(
    formula: string,
    vars: Record<string, number>
  ): number {
    let result = formula;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(key, 'g'), value.toString());
    }

    // Simple evaluation (addition, multiplication, parentheses)
    try {
      // Only allow safe characters for eval-like behavior
      if (!/^[\d\s+\-*/.()]+$/.test(result)) {
        return 0;
      }
      // Use Function constructor as safer eval alternative
      return Math.round(new Function(`return ${result}`)() as number);
    } catch {
      return 0;
    }
  }

  private interpolateTemplate(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  private selectFromArray<T>(array: T[], rng: () => number): T {
    return array[Math.floor(rng() * array.length)]!;
  }

  private createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }

  private generateAlgorithmBriefing(
    type: MissionType,
    difficulty: MissionDifficulty,
    tier: number
  ): string {
    const difficultyMessages: Record<MissionDifficulty, string> = {
      EASY: 'ROUTINE ASSIGNMENT.',
      NORMAL: 'STANDARD PARAMETERS.',
      HARD: 'ELEVATED DIFFICULTY DETECTED.',
      EXTREME: 'MAXIMUM EFFICIENCY REQUIRED. FAILURE IS... NOTED.',
    };

    const typeMessages: Record<MissionType, string> = {
      DELIVERY: 'PACKAGE TRANSFER AUTHORIZED. TIME IS EFFICIENCY.',
      EXTRACTION: 'EXTRACTION PROTOCOLS LOADED. ASSET RECOVERY PRIORITY.',
      ESCORT: 'PROTECTION ASSIGNMENT. VIP INTEGRITY PARAMOUNT.',
      COMBAT: 'COMBAT AUTHORIZATION GRANTED. ELIMINATE THREATS.',
      INFILTRATION: 'STEALTH PROTOCOLS ACTIVE. REMAIN UNDETECTED.',
      INVESTIGATION: 'INTELLIGENCE GATHERING MODE. OBSERVE. REPORT.',
      COURIER: 'COURIER CONTRACT LOGGED. DELIVERY METRICS WILL BE RECORDED.',
      CONTRACT: 'CONTRACT PARAMETERS ACCEPTED. TERMS ARE BINDING.',
    };

    return `${typeMessages[type]} ${difficultyMessages[difficulty]} TIER ${tier} CLEARANCE CONFIRMED.`;
  }
}
