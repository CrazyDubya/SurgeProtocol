/**
 * Integration tests for combat system API.
 *
 * Day 1 Tests: Catalog endpoints for damage types, conditions, and actions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import app from '../../src/index';
import { createMockEnv, createTestRequest, parseJsonResponse, type MockEnv } from '../helpers/mock-env';

describe('Combat System Integration', () => {
  let env: MockEnv;

  beforeEach(async () => {
    env = createMockEnv();

    // Seed damage type definitions
    env.DB._seed('damage_type_definitions', [
      {
        id: 'dmg-kinetic',
        code: 'KINETIC',
        name: 'Kinetic',
        description: 'Physical impact damage from bullets, blades, etc.',
        is_physical: 1,
        is_energy: 0,
        is_elemental: 0,
        is_exotic: 0,
        armor_effectiveness: 1.0,
        shield_effectiveness: 0.5,
        can_crit: 1,
        leaves_status_id: null,
        environmental_source: 0,
        common_resistances: JSON.stringify(['ARMOR', 'DERMAL_PLATING']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'dmg-laser',
        code: 'LASER',
        name: 'Laser',
        description: 'Focused light energy damage.',
        is_physical: 0,
        is_energy: 1,
        is_elemental: 0,
        is_exotic: 0,
        armor_effectiveness: 0.7,
        shield_effectiveness: 1.2,
        can_crit: 1,
        leaves_status_id: 'cond-burn',
        environmental_source: 0,
        common_resistances: JSON.stringify(['REFLECTIVE_COATING', 'ENERGY_SHIELD']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'dmg-fire',
        code: 'FIRE',
        name: 'Fire',
        description: 'Thermal damage from flames.',
        is_physical: 0,
        is_energy: 0,
        is_elemental: 1,
        is_exotic: 0,
        armor_effectiveness: 0.8,
        shield_effectiveness: 0.3,
        can_crit: 0,
        leaves_status_id: 'cond-burn',
        environmental_source: 1,
        common_resistances: JSON.stringify(['FIRE_RESISTANT', 'THERMAL_DAMPENER']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'dmg-emp',
        code: 'EMP',
        name: 'EMP',
        description: 'Electromagnetic pulse that disrupts electronics.',
        is_physical: 0,
        is_energy: 0,
        is_elemental: 0,
        is_exotic: 1,
        armor_effectiveness: 0.1,
        shield_effectiveness: 0.0,
        can_crit: 0,
        leaves_status_id: 'cond-disabled',
        environmental_source: 0,
        common_resistances: JSON.stringify(['EMP_HARDENING', 'FARADAY_CAGE']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Seed condition definitions
    env.DB._seed('condition_definitions', [
      {
        id: 'cond-burn',
        code: 'BURNING',
        name: 'Burning',
        description: 'Taking fire damage over time.',
        icon_asset: 'icons/conditions/burn.png',
        condition_type: 'DOT',
        severity: 3,
        is_positive: 0,
        is_visible: 1,
        is_dispellable: 1,
        duration_type: 'TIMED',
        default_duration_seconds: 10,
        can_stack_duration: 0,
        stacks: 1,
        max_stacks: 3,
        stack_behavior: 'INCREASE_INTENSITY',
        stat_modifiers: null,
        attribute_modifiers: null,
        damage_over_time: JSON.stringify({ damage: 5, interval: 1, type: 'FIRE' }),
        healing_over_time: null,
        movement_modifier: 1.0,
        action_restrictions: null,
        special_effects: null,
        on_apply_effect: null,
        on_expire_effect: null,
        on_tick_effect: JSON.stringify({ particle: 'fire_tick' }),
        on_stack_effect: null,
        removal_conditions: JSON.stringify(['WATER', 'ROLL']),
        cleanse_types: JSON.stringify(['FIRE', 'DOT']),
        immunity_after_removal: 2,
        typical_sources: JSON.stringify(['FIRE_DAMAGE', 'MOLOTOV', 'FLAMETHROWER']),
        augment_mitigation: null,
        skill_mitigation_id: null,
        visual_effect_on_character: 'effect_burning',
        screen_effect: 'vignette_orange',
        audio_effect: 'sfx_burning',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'cond-stunned',
        code: 'STUNNED',
        name: 'Stunned',
        description: 'Unable to take actions.',
        icon_asset: 'icons/conditions/stun.png',
        condition_type: 'CROWD_CONTROL',
        severity: 5,
        is_positive: 0,
        is_visible: 1,
        is_dispellable: 0,
        duration_type: 'TIMED',
        default_duration_seconds: 3,
        can_stack_duration: 0,
        stacks: 0,
        max_stacks: 1,
        stack_behavior: null,
        stat_modifiers: null,
        attribute_modifiers: null,
        damage_over_time: null,
        healing_over_time: null,
        movement_modifier: 0.0,
        action_restrictions: JSON.stringify(['ALL']),
        special_effects: null,
        on_apply_effect: JSON.stringify({ interrupt: true }),
        on_expire_effect: null,
        on_tick_effect: null,
        on_stack_effect: null,
        removal_conditions: null,
        cleanse_types: JSON.stringify(['CC', 'STUN']),
        immunity_after_removal: 5,
        typical_sources: JSON.stringify(['FLASHBANG', 'TASER', 'CONCUSSION']),
        augment_mitigation: JSON.stringify(['NEURAL_STABILIZER']),
        skill_mitigation_id: 'skill-resistance',
        visual_effect_on_character: 'effect_stunned',
        screen_effect: 'blur_heavy',
        audio_effect: 'sfx_ears_ringing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'cond-regen',
        code: 'REGENERATING',
        name: 'Regenerating',
        description: 'Healing over time.',
        icon_asset: 'icons/conditions/regen.png',
        condition_type: 'HOT',
        severity: 2,
        is_positive: 1,
        is_visible: 1,
        is_dispellable: 1,
        duration_type: 'TIMED',
        default_duration_seconds: 30,
        can_stack_duration: 1,
        stacks: 0,
        max_stacks: 1,
        stack_behavior: null,
        stat_modifiers: null,
        attribute_modifiers: null,
        damage_over_time: null,
        healing_over_time: JSON.stringify({ heal: 3, interval: 2 }),
        movement_modifier: 1.0,
        action_restrictions: null,
        special_effects: null,
        on_apply_effect: null,
        on_expire_effect: null,
        on_tick_effect: null,
        on_stack_effect: null,
        removal_conditions: null,
        cleanse_types: null,
        immunity_after_removal: 0,
        typical_sources: JSON.stringify(['MEDKIT', 'AUGMENT', 'STIM']),
        augment_mitigation: null,
        skill_mitigation_id: null,
        visual_effect_on_character: 'effect_healing',
        screen_effect: null,
        audio_effect: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Seed skill definitions (for condition mitigation lookup)
    env.DB._seed('skill_definitions', [
      {
        id: 'skill-resistance',
        code: 'RESISTANCE',
        name: 'Resistance',
        max_level: 10,
      },
    ]);

    // Seed combat action definitions
    env.DB._seed('combat_action_definitions', [
      {
        id: 'action-shoot',
        code: 'SHOOT',
        name: 'Shoot',
        description: 'Fire your equipped ranged weapon.',
        action_type: 'ATTACK',
        action_cost: 1,
        is_free_action: 0,
        is_reaction: 0,
        requires_weapon_type: JSON.stringify(['PISTOL', 'RIFLE', 'SMG']),
        requires_ability_id: null,
        requires_augment_id: null,
        min_attribute: null,
        requires_stance: null,
        target_type: 'SINGLE_ENEMY',
        target_count: 1,
        range_min_m: 0,
        range_max_m: 50,
        requires_los: 1,
        area_of_effect: null,
        damage_formula: 'WEAPON_DAMAGE + DEX_MOD',
        damage_type: 'KINETIC',
        status_effects: null,
        knockback: 0,
        special_effects: null,
        accuracy_modifier: 0,
        critical_chance_modifier: 0,
        critical_damage_modifier: 1.5,
        animation_id: 'anim_shoot',
        sound_effect_id: 'sfx_gunshot',
        visual_effect_id: 'vfx_muzzle_flash',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'action-melee',
        code: 'MELEE_STRIKE',
        name: 'Melee Strike',
        description: 'Attack with a melee weapon or fists.',
        action_type: 'ATTACK',
        action_cost: 1,
        is_free_action: 0,
        is_reaction: 0,
        requires_weapon_type: JSON.stringify(['MELEE', 'UNARMED']),
        requires_ability_id: null,
        requires_augment_id: null,
        min_attribute: null,
        requires_stance: null,
        target_type: 'SINGLE_ENEMY',
        target_count: 1,
        range_min_m: 0,
        range_max_m: 2,
        requires_los: 1,
        area_of_effect: null,
        damage_formula: 'WEAPON_DAMAGE + STR_MOD',
        damage_type: 'KINETIC',
        status_effects: null,
        knockback: 1,
        special_effects: null,
        accuracy_modifier: 10,
        critical_chance_modifier: 5,
        critical_damage_modifier: 2.0,
        animation_id: 'anim_melee',
        sound_effect_id: 'sfx_punch',
        visual_effect_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'action-dodge',
        code: 'DODGE',
        name: 'Dodge',
        description: 'Attempt to evade incoming attacks.',
        action_type: 'DEFEND',
        action_cost: 0,
        is_free_action: 0,
        is_reaction: 1,
        requires_weapon_type: null,
        requires_ability_id: null,
        requires_augment_id: null,
        min_attribute: JSON.stringify({ AGI: 8 }),
        requires_stance: null,
        target_type: 'SELF',
        target_count: 1,
        range_min_m: 0,
        range_max_m: 0,
        requires_los: 0,
        area_of_effect: null,
        damage_formula: null,
        damage_type: null,
        status_effects: null,
        knockback: 0,
        special_effects: JSON.stringify({ evasion_bonus: 50, duration: 'UNTIL_NEXT_TURN' }),
        accuracy_modifier: 0,
        critical_chance_modifier: 0,
        critical_damage_modifier: 1.0,
        animation_id: 'anim_dodge',
        sound_effect_id: 'sfx_whoosh',
        visual_effect_id: 'vfx_blur',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'action-reload',
        code: 'RELOAD',
        name: 'Reload',
        description: 'Reload your equipped weapon.',
        action_type: 'RELOAD',
        action_cost: 1,
        is_free_action: 0,
        is_reaction: 0,
        requires_weapon_type: JSON.stringify(['PISTOL', 'RIFLE', 'SMG', 'SHOTGUN']),
        requires_ability_id: null,
        requires_augment_id: null,
        min_attribute: null,
        requires_stance: null,
        target_type: 'SELF',
        target_count: 1,
        range_min_m: 0,
        range_max_m: 0,
        requires_los: 0,
        area_of_effect: null,
        damage_formula: null,
        damage_type: null,
        status_effects: null,
        knockback: 0,
        special_effects: JSON.stringify({ reload: true }),
        accuracy_modifier: 0,
        critical_chance_modifier: 0,
        critical_damage_modifier: 1.0,
        animation_id: 'anim_reload',
        sound_effect_id: 'sfx_reload',
        visual_effect_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  });

  // ===========================================================================
  // DAMAGE TYPE TESTS
  // ===========================================================================

  describe('GET /api/combat/damage-types', () => {
    it('should return all damage types', async () => {
      const request = createTestRequest('GET', '/api/combat/damage-types');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { damageTypes: unknown[]; count: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.damageTypes).toHaveLength(4);
      expect(data.data?.count).toBe(4);
    });

    it('should filter by physical damage', async () => {
      const request = createTestRequest('GET', '/api/combat/damage-types?physical=true');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { damageTypes: Array<{ code: string; classification: { isPhysical: boolean } }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.damageTypes).toHaveLength(1);
      expect(data.data?.damageTypes[0]?.code).toBe('KINETIC');
      expect(data.data?.damageTypes[0]?.classification.isPhysical).toBe(true);
    });

    it('should filter by energy damage', async () => {
      const request = createTestRequest('GET', '/api/combat/damage-types?energy=true');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { damageTypes: Array<{ code: string }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.damageTypes).toHaveLength(1);
      expect(data.data?.damageTypes[0]?.code).toBe('LASER');
    });

    it('should filter by exotic damage', async () => {
      const request = createTestRequest('GET', '/api/combat/damage-types?exotic=true');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { damageTypes: Array<{ code: string }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.damageTypes).toHaveLength(1);
      expect(data.data?.damageTypes[0]?.code).toBe('EMP');
    });
  });

  describe('GET /api/combat/damage-types/:id', () => {
    it('should return damage type details by ID', async () => {
      const request = createTestRequest('GET', '/api/combat/damage-types/dmg-kinetic');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          damageType: {
            id: string;
            code: string;
            name: string;
            effectiveness: { armor: number; shield: number };
            commonResistances: string[];
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.damageType.code).toBe('KINETIC');
      expect(data.data?.damageType.effectiveness.armor).toBe(1.0);
      expect(data.data?.damageType.effectiveness.shield).toBe(0.5);
      expect(data.data?.damageType.commonResistances).toContain('ARMOR');
    });

    it('should return damage type by code', async () => {
      const request = createTestRequest('GET', '/api/combat/damage-types/LASER');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { damageType: { code: string; name: string } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.damageType.code).toBe('LASER');
      expect(data.data?.damageType.name).toBe('Laser');
    });

    it('should return 404 for non-existent damage type', async () => {
      const request = createTestRequest('GET', '/api/combat/damage-types/nonexistent');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        errors?: Array<{ code: string }>;
      }>(response);

      expect(response.status).toBe(404);
      expect(data.errors?.[0]?.code).toBe('NOT_FOUND');
    });
  });

  // ===========================================================================
  // CONDITION TESTS
  // ===========================================================================

  describe('GET /api/combat/conditions', () => {
    it('should return all conditions', async () => {
      const request = createTestRequest('GET', '/api/combat/conditions');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { conditions: unknown[]; pagination: { total: number } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.conditions).toHaveLength(3);
      expect(data.data?.pagination.total).toBe(3);
    });

    it('should filter by condition type', async () => {
      const request = createTestRequest('GET', '/api/combat/conditions?type=DOT');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { conditions: Array<{ code: string; type: string }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.conditions).toHaveLength(1);
      expect(data.data?.conditions[0]?.code).toBe('BURNING');
      expect(data.data?.conditions[0]?.type).toBe('DOT');
    });

    it('should filter by positive conditions', async () => {
      const request = createTestRequest('GET', '/api/combat/conditions?positive=true');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { conditions: Array<{ code: string; isPositive: boolean }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.conditions).toHaveLength(1);
      expect(data.data?.conditions[0]?.code).toBe('REGENERATING');
      expect(data.data?.conditions[0]?.isPositive).toBe(true);
    });

    it('should filter by severity range', async () => {
      const request = createTestRequest('GET', '/api/combat/conditions?minSeverity=4');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { conditions: Array<{ code: string; severity: number }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.conditions).toHaveLength(1);
      expect(data.data?.conditions[0]?.code).toBe('STUNNED');
      expect(data.data?.conditions[0]?.severity).toBe(5);
    });

    it('should support pagination', async () => {
      const request = createTestRequest('GET', '/api/combat/conditions?limit=2');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { conditions: unknown[]; pagination: { total: number; limit: number; hasMore: boolean } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.conditions).toHaveLength(2);
      expect(data.data?.pagination.total).toBe(3);
      expect(data.data?.pagination.limit).toBe(2);
      expect(data.data?.pagination.hasMore).toBe(true);
    });
  });

  describe('GET /api/combat/conditions/:id', () => {
    it('should return condition details with effects', async () => {
      const request = createTestRequest('GET', '/api/combat/conditions/cond-burn');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          condition: {
            code: string;
            effects: {
              damageOverTime: { damage: number; interval: number; type: string };
            };
            stacking: { canStack: boolean; maxStacks: number };
            removal: { cleanseTypes: string[] };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.condition.code).toBe('BURNING');
      expect(data.data?.condition.effects.damageOverTime.damage).toBe(5);
      expect(data.data?.condition.effects.damageOverTime.type).toBe('FIRE');
      expect(data.data?.condition.stacking.canStack).toBe(true);
      expect(data.data?.condition.stacking.maxStacks).toBe(3);
      expect(data.data?.condition.removal.cleanseTypes).toContain('FIRE');
    });

    it('should return condition with skill mitigation', async () => {
      const request = createTestRequest('GET', '/api/combat/conditions/cond-stunned');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          condition: {
            code: string;
            mitigation: {
              skillMitigation: { code: string; name: string };
            };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.condition.code).toBe('STUNNED');
      expect(data.data?.condition.mitigation.skillMitigation?.code).toBe('RESISTANCE');
    });

    it('should return 404 for non-existent condition', async () => {
      const request = createTestRequest('GET', '/api/combat/conditions/nonexistent');

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });

  // ===========================================================================
  // COMBAT ACTION TESTS
  // ===========================================================================

  describe('GET /api/combat/actions', () => {
    it('should return all combat actions', async () => {
      const request = createTestRequest('GET', '/api/combat/actions');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { actions: unknown[]; pagination: { total: number } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.actions).toHaveLength(4);
    });

    it('should filter by action type', async () => {
      const request = createTestRequest('GET', '/api/combat/actions?type=ATTACK');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { actions: Array<{ code: string; type: string }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.actions).toHaveLength(2);
      expect(data.data?.actions.every(a => a.type === 'ATTACK')).toBe(true);
    });

    it('should filter by reaction actions', async () => {
      const request = createTestRequest('GET', '/api/combat/actions?reaction=true');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { actions: Array<{ code: string; cost: { isReaction: boolean } }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.actions).toHaveLength(1);
      expect(data.data?.actions[0]?.code).toBe('DODGE');
      expect(data.data?.actions[0]?.cost.isReaction).toBe(true);
    });

    it('should filter by damage type', async () => {
      const request = createTestRequest('GET', '/api/combat/actions?damageType=KINETIC');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { actions: Array<{ code: string; damage: { type: string } }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.actions).toHaveLength(2);
      expect(data.data?.actions.every(a => a.damage?.type === 'KINETIC')).toBe(true);
    });
  });

  describe('GET /api/combat/actions/:id', () => {
    it('should return action details with targeting', async () => {
      const request = createTestRequest('GET', '/api/combat/actions/action-shoot');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          action: {
            code: string;
            name: string;
            targeting: {
              type: string;
              rangeMax: number;
              requiresLineOfSight: boolean;
            };
            damage: {
              formula: string;
              type: string;
            };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.action.code).toBe('SHOOT');
      expect(data.data?.action.targeting.type).toBe('SINGLE_ENEMY');
      expect(data.data?.action.targeting.rangeMax).toBe(50);
      expect(data.data?.action.targeting.requiresLineOfSight).toBe(true);
      expect(data.data?.action.damage.type).toBe('KINETIC');
    });

    it('should return action with requirements', async () => {
      const request = createTestRequest('GET', '/api/combat/actions/action-dodge');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          action: {
            code: string;
            requirements: {
              minAttribute: { AGI: number };
            };
            cost: {
              isReaction: boolean;
            };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.action.code).toBe('DODGE');
      expect(data.data?.action.requirements.minAttribute?.AGI).toBe(8);
      expect(data.data?.action.cost.isReaction).toBe(true);
    });

    it('should return action by code', async () => {
      const request = createTestRequest('GET', '/api/combat/actions/MELEE_STRIKE');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { action: { code: string; modifiers: { criticalDamage: number } } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.action.code).toBe('MELEE_STRIKE');
      expect(data.data?.action.modifiers.criticalDamage).toBe(2.0);
    });

    it('should return 404 for non-existent action', async () => {
      const request = createTestRequest('GET', '/api/combat/actions/nonexistent');

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });

  // ===========================================================================
  // UTILITY ENDPOINT TESTS
  // ===========================================================================

  describe('GET /api/combat/types', () => {
    it('should return all combat type enums', async () => {
      const request = createTestRequest('GET', '/api/combat/types');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          conditionTypes: string[];
          actionTypes: string[];
          targetTypes: string[];
          damageCategories: string[];
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.conditionTypes).toContain('BUFF');
      expect(data.data?.conditionTypes).toContain('DOT');
      expect(data.data?.actionTypes).toContain('ATTACK');
      expect(data.data?.actionTypes).toContain('DEFEND');
      expect(data.data?.targetTypes).toContain('SINGLE_ENEMY');
      expect(data.data?.damageCategories).toContain('PHYSICAL');
    });
  });
});
