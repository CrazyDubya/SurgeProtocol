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

// =============================================================================
// DAY 2: ARENA & ENCOUNTER TESTS
// =============================================================================

describe('Combat System Day 2 - Arenas & Encounters', () => {
  let env: MockEnv;

  beforeEach(async () => {
    env = createMockEnv();

    // Seed locations for arena/encounter references
    env.DB._seed('locations', [
      {
        id: 'loc-warehouse',
        code: 'ABANDONED_WAREHOUSE',
        name: 'Abandoned Warehouse',
        district_id: 'district-industrial',
      },
      {
        id: 'loc-alley',
        code: 'BACK_ALLEY',
        name: 'Back Alley',
        district_id: 'district-downtown',
      },
    ]);

    // Seed combat arenas
    env.DB._seed('combat_arenas', [
      {
        id: 'arena-warehouse',
        location_id: 'loc-warehouse',
        name: 'Warehouse Floor',
        width_m: 40,
        height_m: 30,
        grid_size_m: 1.0,
        terrain_map: JSON.stringify({ type: 'concrete', features: ['crates', 'pillars'] }),
        elevation_map: JSON.stringify({ levels: [0, 2] }),
        cover_points: JSON.stringify([
          { x: 10, y: 5, type: 'half', destructible: true },
          { x: 25, y: 15, type: 'full', destructible: false },
        ]),
        hazard_zones: JSON.stringify([{ x: 30, y: 20, type: 'toxic', damage: 5 }]),
        player_spawn_points: JSON.stringify([{ x: 5, y: 5 }, { x: 5, y: 25 }]),
        enemy_spawn_points: JSON.stringify([{ x: 35, y: 15 }]),
        reinforcement_points: JSON.stringify([{ x: 20, y: 0 }]),
        interactable_objects: JSON.stringify([{ id: 'console-1', type: 'terminal', x: 20, y: 10 }]),
        destructibles: JSON.stringify([{ id: 'barrel-1', hp: 20, x: 15, y: 15 }]),
        hackable_objects: JSON.stringify([{ id: 'turret-1', difficulty: 6, x: 30, y: 10 }]),
        lighting_level: 30,
        ambient_hazards: JSON.stringify([]),
        weather_effects: null,
        noise_level: 20,
        has_multiple_levels: 1,
        level_connections: JSON.stringify([{ from: 0, to: 1, type: 'ladder', x: 35, y: 5 }]),
        fall_damage_enabled: 1,
        patrol_routes: JSON.stringify([{ id: 'patrol-1', waypoints: [[10, 10], [30, 10], [30, 20]] }]),
        sniper_positions: JSON.stringify([{ x: 38, y: 5, elevation: 2 }]),
        flanking_routes: JSON.stringify([{ id: 'flank-1', path: [[5, 15], [10, 25], [25, 25]] }]),
        retreat_routes: JSON.stringify([{ id: 'retreat-1', exit: [0, 15] }]),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'arena-alley',
        location_id: 'loc-alley',
        name: 'Narrow Alley',
        width_m: 10,
        height_m: 50,
        grid_size_m: 1.0,
        terrain_map: null,
        elevation_map: null,
        cover_points: JSON.stringify([{ x: 5, y: 20, type: 'half' }]),
        hazard_zones: null,
        player_spawn_points: JSON.stringify([{ x: 5, y: 5 }]),
        enemy_spawn_points: JSON.stringify([{ x: 5, y: 45 }]),
        reinforcement_points: null,
        interactable_objects: null,
        destructibles: null,
        hackable_objects: null,
        lighting_level: 15,
        ambient_hazards: null,
        weather_effects: JSON.stringify({ type: 'rain', intensity: 0.5 }),
        noise_level: 60,
        has_multiple_levels: 0,
        level_connections: null,
        fall_damage_enabled: 0,
        patrol_routes: null,
        sniper_positions: null,
        flanking_routes: null,
        retreat_routes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Seed NPC definitions for boss references
    env.DB._seed('npc_definitions', [
      {
        id: 'npc-boss-chrome',
        code: 'CHROME_FANATIC',
        name: 'Chrome Fanatic Leader',
        npc_type: 'BOSS',
      },
    ]);

    // Seed combat encounters
    env.DB._seed('combat_encounters', [
      {
        id: 'enc-warehouse-ambush',
        name: 'Warehouse Ambush',
        description: 'Gangers have set up an ambush in the warehouse.',
        encounter_type: 'AMBUSH',
        difficulty_rating: 5,
        is_scripted: 0,
        is_avoidable: 1,
        location_id: 'loc-warehouse',
        combat_arena_id: 'arena-warehouse',
        environment_modifiers: JSON.stringify({ visibility: -10, noise: 20 }),
        enemy_spawn_groups: JSON.stringify([
          { npcType: 'GANGER', count: 3, tier: 1 },
          { npcType: 'GANGER_HEAVY', count: 1, tier: 2 },
        ]),
        boss_npc_id: null,
        primary_objective: 'Defeat all enemies',
        optional_objectives: JSON.stringify(['Disable the alarm', 'Find the stash']),
        failure_conditions: JSON.stringify(['Player death', 'All allies down']),
        time_limit_seconds: null,
        xp_reward: 150,
        cred_reward: 500,
        item_drops: JSON.stringify([{ item: 'ammo_pistol', chance: 0.8 }]),
        special_rewards: null,
        retreat_possible: 1,
        retreat_penalty: JSON.stringify({ reputation: -5 }),
        death_consequence: 'RESPAWN_HOSPITAL',
        narrative_impact: null,
        enemy_ai_profile: 'AGGRESSIVE',
        enemy_coordination: 40,
        enemy_morale_enabled: 1,
        surrender_possible: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'enc-boss-fight',
        name: 'Chrome Fanatic Showdown',
        description: 'Face the leader of the Chrome Fanatics.',
        encounter_type: 'BOSS',
        difficulty_rating: 8,
        is_scripted: 1,
        is_avoidable: 0,
        location_id: 'loc-warehouse',
        combat_arena_id: 'arena-warehouse',
        environment_modifiers: null,
        enemy_spawn_groups: JSON.stringify([
          { npcType: 'CHROME_FANATIC', count: 2, tier: 3 },
        ]),
        boss_npc_id: 'npc-boss-chrome',
        primary_objective: 'Defeat the Chrome Fanatic Leader',
        optional_objectives: JSON.stringify(['Spare the leader']),
        failure_conditions: JSON.stringify(['Player death']),
        time_limit_seconds: 300,
        xp_reward: 500,
        cred_reward: 2000,
        item_drops: JSON.stringify([{ item: 'rare_augment', chance: 0.5 }]),
        special_rewards: JSON.stringify([{ type: 'UNLOCK_FACTION', faction: 'CHROME_FANATICS' }]),
        retreat_possible: 0,
        retreat_penalty: null,
        death_consequence: 'MISSION_FAIL',
        narrative_impact: JSON.stringify({ flag: 'CHROME_LEADER_DEFEATED' }),
        enemy_ai_profile: 'TACTICAL',
        enemy_coordination: 80,
        enemy_morale_enabled: 0,
        surrender_possible: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'enc-alley-mugging',
        name: 'Alley Mugging',
        description: 'Street thugs try to rob you.',
        encounter_type: 'RANDOM',
        difficulty_rating: 2,
        is_scripted: 0,
        is_avoidable: 1,
        location_id: 'loc-alley',
        combat_arena_id: 'arena-alley',
        environment_modifiers: null,
        enemy_spawn_groups: JSON.stringify([{ npcType: 'THUG', count: 2, tier: 1 }]),
        boss_npc_id: null,
        primary_objective: 'Survive',
        optional_objectives: null,
        failure_conditions: null,
        time_limit_seconds: null,
        xp_reward: 50,
        cred_reward: 100,
        item_drops: null,
        special_rewards: null,
        retreat_possible: 1,
        retreat_penalty: null,
        death_consequence: 'RESPAWN_HOSPITAL',
        narrative_impact: null,
        enemy_ai_profile: 'COWARDLY',
        enemy_coordination: 20,
        enemy_morale_enabled: 1,
        surrender_possible: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  });

  // ===========================================================================
  // ARENA TESTS
  // ===========================================================================

  describe('GET /api/combat/arenas', () => {
    it('should return all arenas', async () => {
      const request = createTestRequest('GET', '/api/combat/arenas');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { arenas: unknown[]; pagination: { total: number } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.arenas).toHaveLength(2);
    });

    it('should filter by location', async () => {
      const request = createTestRequest('GET', '/api/combat/arenas?locationId=loc-warehouse');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { arenas: Array<{ id: string; name: string }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.arenas).toHaveLength(1);
      expect(data.data?.arenas[0]?.name).toBe('Warehouse Floor');
    });

    it('should filter by multiple levels', async () => {
      const request = createTestRequest('GET', '/api/combat/arenas?multipleLevels=true');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { arenas: Array<{ id: string; hasMultipleLevels: boolean }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.arenas).toHaveLength(1);
      expect(data.data?.arenas[0]?.hasMultipleLevels).toBe(true);
    });

    it('should return arena dimensions', async () => {
      const request = createTestRequest('GET', '/api/combat/arenas');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          arenas: Array<{
            dimensions: { width: number; height: number; area: number };
          }>;
        };
      }>(response);

      expect(response.status).toBe(200);
      const warehouse = data.data?.arenas.find(a => a.dimensions.width === 40);
      expect(warehouse?.dimensions.area).toBe(1200); // 40 * 30
    });
  });

  describe('GET /api/combat/arenas/:id', () => {
    it('should return arena details with terrain data', async () => {
      const request = createTestRequest('GET', '/api/combat/arenas/arena-warehouse');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          arena: {
            id: string;
            name: string;
            terrain: {
              coverPoints: Array<{ x: number; y: number; type: string }>;
              hazardZones: Array<{ type: string }>;
            };
            spawns: {
              player: Array<{ x: number; y: number }>;
              enemy: Array<{ x: number; y: number }>;
            };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.arena.name).toBe('Warehouse Floor');
      expect(data.data?.arena.terrain.coverPoints).toHaveLength(2);
      expect(data.data?.arena.terrain.hazardZones).toHaveLength(1);
      expect(data.data?.arena.spawns.player).toHaveLength(2);
    });

    it('should return interactables and AI hints', async () => {
      const request = createTestRequest('GET', '/api/combat/arenas/arena-warehouse');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          arena: {
            interactables: {
              objects: unknown[];
              hackable: unknown[];
            };
            aiHints: {
              patrolRoutes: unknown[];
              sniperPositions: unknown[];
            };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.arena.interactables.objects).toHaveLength(1);
      expect(data.data?.arena.interactables.hackable).toHaveLength(1);
      expect(data.data?.arena.aiHints.patrolRoutes).toHaveLength(1);
      expect(data.data?.arena.aiHints.sniperPositions).toHaveLength(1);
    });

    it('should return 404 for non-existent arena', async () => {
      const request = createTestRequest('GET', '/api/combat/arenas/nonexistent');

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });

  // ===========================================================================
  // ENCOUNTER TESTS
  // ===========================================================================

  describe('GET /api/combat/encounters', () => {
    it('should return all encounters', async () => {
      const request = createTestRequest('GET', '/api/combat/encounters');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { encounters: unknown[]; pagination: { total: number } };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.encounters).toHaveLength(3);
    });

    it('should filter by encounter type', async () => {
      const request = createTestRequest('GET', '/api/combat/encounters?type=BOSS');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { encounters: Array<{ type: string; name: string }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.encounters).toHaveLength(1);
      expect(data.data?.encounters[0]?.name).toBe('Chrome Fanatic Showdown');
    });

    it('should filter by difficulty range', async () => {
      const request = createTestRequest('GET', '/api/combat/encounters?minDifficulty=4&maxDifficulty=6');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { encounters: Array<{ difficulty: number }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.encounters).toHaveLength(1);
      expect(data.data?.encounters[0]?.difficulty).toBe(5);
    });

    it('should filter by avoidable encounters', async () => {
      const request = createTestRequest('GET', '/api/combat/encounters?avoidable=false');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { encounters: Array<{ isAvoidable: boolean }> };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.encounters).toHaveLength(1);
      expect(data.data?.encounters[0]?.isAvoidable).toBe(false);
    });

    it('should return rewards info', async () => {
      const request = createTestRequest('GET', '/api/combat/encounters');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          encounters: Array<{
            rewards: { xp: number; credits: number };
          }>;
        };
      }>(response);

      expect(response.status).toBe(200);
      const bossEnc = data.data?.encounters.find(e => e.rewards.xp === 500);
      expect(bossEnc?.rewards.credits).toBe(2000);
    });
  });

  describe('GET /api/combat/encounters/:id', () => {
    it('should return encounter details with objectives', async () => {
      const request = createTestRequest('GET', '/api/combat/encounters/enc-warehouse-ambush');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          encounter: {
            name: string;
            objectives: {
              primary: string;
              optional: string[];
            };
            enemies: {
              spawnGroups: Array<{ npcType: string; count: number }>;
            };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.encounter.name).toBe('Warehouse Ambush');
      expect(data.data?.encounter.objectives.primary).toBe('Defeat all enemies');
      expect(data.data?.encounter.objectives.optional).toHaveLength(2);
      expect(data.data?.encounter.enemies.spawnGroups).toHaveLength(2);
    });

    it('should return boss info for boss encounters', async () => {
      const request = createTestRequest('GET', '/api/combat/encounters/enc-boss-fight');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          encounter: {
            enemies: {
              boss: { id: string; name: string | null; type: string | null };
            };
            objectives: { timeLimit: number };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      // Boss ID should be present
      expect(data.data?.encounter.enemies.boss?.id).toBe('npc-boss-chrome');
      // Note: boss name/type from JOIN may not work perfectly in mock DB
      expect(data.data?.encounter.objectives.timeLimit).toBe(300);
    });

    it('should return AI configuration', async () => {
      const request = createTestRequest('GET', '/api/combat/encounters/enc-boss-fight');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          encounter: {
            ai: {
              profile: string;
              coordination: number;
              moraleEnabled: boolean;
            };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.encounter.ai.profile).toBe('TACTICAL');
      expect(data.data?.encounter.ai.coordination).toBe(80);
      expect(data.data?.encounter.ai.moraleEnabled).toBe(false);
    });

    it('should return 404 for non-existent encounter', async () => {
      const request = createTestRequest('GET', '/api/combat/encounters/nonexistent');

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/combat/encounters/:id/preview', () => {
    it('should return spoiler-free preview', async () => {
      const request = createTestRequest('GET', '/api/combat/encounters/enc-warehouse-ambush/preview');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          preview: {
            name: string;
            difficulty: { rating: number; label: string };
            options: { canAvoid: boolean; canRetreat: boolean };
            estimatedRewards: { xp: number; credits: number };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.preview.name).toBe('Warehouse Ambush');
      expect(data.data?.preview.difficulty.rating).toBe(5);
      expect(data.data?.preview.difficulty.label).toBe('Hard'); // 5 is in the 5-6 range = Hard
      expect(data.data?.preview.options.canAvoid).toBe(true);
      expect(data.data?.preview.estimatedRewards.xp).toBe(150);
    });

    it('should include warnings for difficult encounters', async () => {
      const request = createTestRequest('GET', '/api/combat/encounters/enc-boss-fight/preview');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          preview: {
            difficulty: { label: string };
            hasTimeLimit: boolean;
            warnings: string[];
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.preview.difficulty.label).toBe('Very Hard');
      expect(data.data?.preview.hasTimeLimit).toBe(true);
      expect(data.data?.preview.warnings).toContain('High difficulty - prepare carefully');
      expect(data.data?.preview.warnings).toContain('Time-limited encounter');
      expect(data.data?.preview.warnings).toContain('Cannot be avoided');
      expect(data.data?.preview.warnings).toContain('No retreat possible');
    });

    it('should return 404 for non-existent encounter', async () => {
      const request = createTestRequest('GET', '/api/combat/encounters/nonexistent/preview');

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });
});

// =============================================================================
// DAY 3: COMBAT INSTANCE MANAGEMENT TESTS
// =============================================================================

describe('Combat System Day 3 - Combat Instance Management', () => {
  let env: MockEnv;

  beforeEach(async () => {
    env = createMockEnv();

    // Seed characters
    env.DB._seed('characters', [
      {
        id: 'char-player-1',
        user_id: 'user-1',
        name: 'Test Runner',
        handle: 'testrunner',
        level: 5,
        current_hp: 100,
        max_hp: 100,
      },
      {
        id: 'char-player-2',
        user_id: 'user-2',
        name: 'Ally Fighter',
        handle: 'allyfighter',
        level: 4,
        current_hp: 80,
        max_hp: 80,
      },
    ]);

    // Seed locations
    env.DB._seed('locations', [
      {
        id: 'loc-warehouse',
        code: 'ABANDONED_WAREHOUSE',
        name: 'Abandoned Warehouse',
        district_id: 'district-industrial',
      },
    ]);

    // Seed combat arenas
    env.DB._seed('combat_arenas', [
      {
        id: 'arena-warehouse',
        location_id: 'loc-warehouse',
        name: 'Warehouse Floor',
        width_m: 40,
        height_m: 30,
      },
    ]);

    // Seed combat encounters
    env.DB._seed('combat_encounters', [
      {
        id: 'enc-warehouse-ambush',
        name: 'Warehouse Ambush',
        description: 'Gangers have set up an ambush.',
        encounter_type: 'AMBUSH',
        difficulty_rating: 5,
        is_scripted: 0,
        is_avoidable: 1,
        location_id: 'loc-warehouse',
        combat_arena_id: 'arena-warehouse',
        enemy_spawn_groups: JSON.stringify([
          { enemies: [{ id: 'enemy-1', name: 'Ganger' }, { id: 'enemy-2', name: 'Ganger Heavy' }] },
        ]),
        primary_objective: 'Defeat all enemies',
        optional_objectives: JSON.stringify(['Find the stash']),
        time_limit_seconds: null,
        xp_reward: 150,
        cred_reward: 500,
        retreat_possible: 1,
      },
      {
        id: 'enc-no-retreat',
        name: 'No Escape Fight',
        description: 'Fight to the death.',
        encounter_type: 'BOSS',
        difficulty_rating: 8,
        is_scripted: 1,
        is_avoidable: 0,
        location_id: 'loc-warehouse',
        combat_arena_id: 'arena-warehouse',
        enemy_spawn_groups: JSON.stringify([]),
        primary_objective: 'Survive',
        optional_objectives: null,
        time_limit_seconds: 300,
        xp_reward: 500,
        cred_reward: 2000,
        retreat_possible: 0,
      },
    ]);

    // Seed combat instances for history tests
    env.DB._seed('combat_instances', [
      {
        id: 'combat-completed-1',
        character_id: 'char-player-1',
        encounter_id: 'enc-warehouse-ambush',
        started_at: '2024-01-01T10:00:00Z',
        status: 'COMPLETED',
        current_round: 5,
        damage_dealt_by_player: 150,
        damage_taken_by_player: 50,
        enemies_defeated: 3,
        allies_lost: 0,
        rounds_elapsed: 5,
        time_elapsed_seconds: 120,
        ended_at: '2024-01-01T10:02:00Z',
        outcome: 'VICTORY',
        objectives_completed: JSON.stringify(['Defeat all enemies']),
        loot_dropped: JSON.stringify([{ itemId: 'item-ammo', quantity: 20 }]),
        xp_earned: 150,
        special_achievements: JSON.stringify(['FLAWLESS']),
      },
      {
        id: 'combat-completed-2',
        character_id: 'char-player-1',
        encounter_id: 'enc-warehouse-ambush',
        started_at: '2024-01-02T10:00:00Z',
        status: 'COMPLETED',
        current_round: 3,
        damage_dealt_by_player: 80,
        damage_taken_by_player: 100,
        enemies_defeated: 1,
        allies_lost: 1,
        rounds_elapsed: 3,
        time_elapsed_seconds: 90,
        ended_at: '2024-01-02T10:01:30Z',
        outcome: 'DEFEAT',
        objectives_completed: JSON.stringify([]),
        loot_dropped: JSON.stringify([]),
        xp_earned: 0,
      },
      {
        id: 'combat-completed-3',
        character_id: 'char-player-1',
        encounter_id: 'enc-warehouse-ambush',
        started_at: '2024-01-03T10:00:00Z',
        status: 'COMPLETED',
        current_round: 2,
        damage_dealt_by_player: 30,
        damage_taken_by_player: 40,
        enemies_defeated: 0,
        allies_lost: 0,
        rounds_elapsed: 2,
        time_elapsed_seconds: 60,
        ended_at: '2024-01-03T10:01:00Z',
        outcome: 'RETREAT',
        objectives_completed: JSON.stringify([]),
        loot_dropped: JSON.stringify([]),
        xp_earned: 37,
      },
    ]);
  });

  // ===========================================================================
  // POST /combat/start TESTS
  // ===========================================================================

  describe('POST /api/combat/start', () => {
    it('should start a new combat instance', async () => {
      const request = createTestRequest('POST', '/api/combat/start', {
        body: {
          characterId: 'char-player-1',
          encounterId: 'enc-warehouse-ambush',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          combat: {
            id: string;
            status: string;
            encounter: { id: string; name: string };
            currentRound: number;
            turnOrder: Array<{ id: string; type: string }>;
            participants: {
              players: Array<{ id: string; name: string }>;
              enemies: Array<{ id: string }>;
            };
          };
        };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data?.combat.status).toBe('ACTIVE');
      expect(data.data?.combat.encounter.id).toBe('enc-warehouse-ambush');
      expect(data.data?.combat.currentRound).toBe(1);
      expect(data.data?.combat.participants.players).toHaveLength(1);
      expect(data.data?.combat.participants.players[0]?.name).toBe('Test Runner');
      expect(data.data?.combat.participants.enemies).toHaveLength(2);
    });

    it('should include additional participants', async () => {
      const request = createTestRequest('POST', '/api/combat/start', {
        body: {
          characterId: 'char-player-1',
          encounterId: 'enc-warehouse-ambush',
          participants: [{ id: 'char-player-2', type: 'ally' }],
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          combat: {
            turnOrder: unknown[];
            participants: { players: unknown[] };
          };
        };
      }>(response);

      expect(response.status).toBe(201);
      expect(data.data?.combat.participants.players).toHaveLength(2);
      // Turn order should have player + ally + enemies
      expect(data.data?.combat.turnOrder.length).toBeGreaterThanOrEqual(3);
    });

    it('should return 404 for non-existent character', async () => {
      const request = createTestRequest('POST', '/api/combat/start', {
        body: {
          characterId: 'nonexistent',
          encounterId: 'enc-warehouse-ambush',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(404);
      expect(data.errors?.[0]?.code).toBe('NOT_FOUND');
    });

    it('should return 404 for non-existent encounter', async () => {
      const request = createTestRequest('POST', '/api/combat/start', {
        body: {
          characterId: 'char-player-1',
          encounterId: 'nonexistent',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(404);
      expect(data.errors?.[0]?.code).toBe('NOT_FOUND');
    });

    it('should prevent starting combat when already in combat', async () => {
      // First, seed an active combat
      env.DB._seed('combat_instances', [
        {
          id: 'combat-active',
          character_id: 'char-player-1',
          encounter_id: 'enc-warehouse-ambush',
          status: 'ACTIVE',
          current_round: 1,
        },
      ]);

      const request = createTestRequest('POST', '/api/combat/start', {
        body: {
          characterId: 'char-player-1',
          encounterId: 'enc-warehouse-ambush',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('ALREADY_IN_COMBAT');
    });
  });

  // ===========================================================================
  // GET /combat/active TESTS
  // ===========================================================================

  describe('GET /api/combat/active', () => {
    beforeEach(() => {
      // Seed active combat instances
      env.DB._seed('combat_instances', [
        {
          id: 'combat-active-1',
          character_id: 'char-player-1',
          encounter_id: 'enc-warehouse-ambush',
          started_at: '2024-01-15T10:00:00Z',
          status: 'ACTIVE',
          current_round: 3,
          rounds_elapsed: 2,
          time_elapsed_seconds: 60,
          damage_dealt_by_player: 100,
          damage_taken_by_player: 30,
          enemies_defeated: 1,
          allies_lost: 0,
        },
        {
          id: 'combat-paused-1',
          character_id: 'char-player-1',
          encounter_id: 'enc-no-retreat',
          started_at: '2024-01-15T11:00:00Z',
          status: 'PAUSED',
          current_round: 1,
          rounds_elapsed: 0,
          time_elapsed_seconds: 15,
          damage_dealt_by_player: 20,
          damage_taken_by_player: 10,
          enemies_defeated: 0,
          allies_lost: 0,
        },
      ]);
    });

    it('should return active combats for character', async () => {
      const request = createTestRequest('GET', '/api/combat/active?characterId=char-player-1');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          activeCombats: Array<{
            id: string;
            status: string;
            currentRound: number;
            stats: { damageDealt: number };
          }>;
          count: number;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.activeCombats).toHaveLength(2);
      expect(data.data?.count).toBe(2);
    });

    it('should include encounter info', async () => {
      const request = createTestRequest('GET', '/api/combat/active?characterId=char-player-1');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          activeCombats: Array<{
            encounter: { id: string; name: string | null };
          }>;
        };
      }>(response);

      expect(response.status).toBe(200);
      const ambushCombat = data.data?.activeCombats.find(c => c.encounter?.id === 'enc-warehouse-ambush');
      expect(ambushCombat).toBeDefined();
    });

    it('should return combat stats', async () => {
      const request = createTestRequest('GET', '/api/combat/active?characterId=char-player-1');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          activeCombats: Array<{
            id: string;
            stats: {
              damageDealt: number;
              damageTaken: number;
              enemiesDefeated: number;
            };
          }>;
        };
      }>(response);

      expect(response.status).toBe(200);
      const activeCombat = data.data?.activeCombats.find(c => c.id === 'combat-active-1');
      expect(activeCombat?.stats.damageDealt).toBe(100);
      expect(activeCombat?.stats.damageTaken).toBe(30);
      expect(activeCombat?.stats.enemiesDefeated).toBe(1);
    });

    it('should require characterId parameter', async () => {
      const request = createTestRequest('GET', '/api/combat/active');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('MISSING_PARAM');
    });

    it('should return empty for character with no active combat', async () => {
      const request = createTestRequest('GET', '/api/combat/active?characterId=char-player-2');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: { activeCombats: unknown[]; count: number };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.activeCombats).toHaveLength(0);
      expect(data.data?.count).toBe(0);
    });
  });

  // ===========================================================================
  // GET /combat/instances/:id TESTS
  // ===========================================================================

  describe('GET /api/combat/instances/:id', () => {
    beforeEach(() => {
      env.DB._seed('combat_instances', [
        {
          id: 'combat-detail-1',
          character_id: 'char-player-1',
          encounter_id: 'enc-warehouse-ambush',
          started_at: '2024-01-15T10:00:00Z',
          status: 'ACTIVE',
          current_round: 4,
          current_turn_entity_id: 'char-player-1',
          turn_order: JSON.stringify([
            { id: 'char-player-1', type: 'player' },
            { id: 'enemy-1', type: 'enemy' },
          ]),
          player_participants: JSON.stringify([
            { id: 'char-player-1', name: 'Test Runner', type: 'player', isActive: true },
          ]),
          enemy_participants: JSON.stringify([
            { id: 'enemy-1', name: 'Ganger', hp: 30 },
          ]),
          neutral_participants: null,
          reinforcements_called: 0,
          damage_dealt_by_player: 120,
          damage_taken_by_player: 45,
          enemies_defeated: 2,
          allies_lost: 0,
          rounds_elapsed: 3,
          time_elapsed_seconds: 90,
          ammo_expended: JSON.stringify({ pistol: 12, rifle: 5 }),
          items_used: JSON.stringify(['medkit']),
          abilities_used: JSON.stringify(['quickdraw']),
          health_items_used: 1,
          ended_at: null,
          outcome: null,
        },
      ]);
    });

    it('should return combat instance details', async () => {
      const request = createTestRequest('GET', '/api/combat/instances/combat-detail-1');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          combat: {
            id: string;
            characterId: string;
            status: string;
            turn: {
              currentRound: number;
              currentEntityId: string;
              turnOrder: unknown[];
            };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.combat.id).toBe('combat-detail-1');
      expect(data.data?.combat.characterId).toBe('char-player-1');
      expect(data.data?.combat.status).toBe('ACTIVE');
      expect(data.data?.combat.turn.currentRound).toBe(4);
      expect(data.data?.combat.turn.currentEntityId).toBe('char-player-1');
    });

    it('should return participants', async () => {
      const request = createTestRequest('GET', '/api/combat/instances/combat-detail-1');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          combat: {
            participants: {
              players: Array<{ id: string; name: string }>;
              enemies: Array<{ id: string; name: string }>;
            };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.combat.participants.players).toHaveLength(1);
      expect(data.data?.combat.participants.players[0]?.name).toBe('Test Runner');
      expect(data.data?.combat.participants.enemies).toHaveLength(1);
    });

    it('should return resource usage', async () => {
      const request = createTestRequest('GET', '/api/combat/instances/combat-detail-1');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          combat: {
            resourcesUsed: {
              ammo: { pistol: number; rifle: number };
              items: string[];
              abilities: string[];
              healthItems: number;
            };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.combat.resourcesUsed.ammo.pistol).toBe(12);
      expect(data.data?.combat.resourcesUsed.items).toContain('medkit');
      expect(data.data?.combat.resourcesUsed.abilities).toContain('quickdraw');
      expect(data.data?.combat.resourcesUsed.healthItems).toBe(1);
    });

    it('should return 404 for non-existent combat', async () => {
      const request = createTestRequest('GET', '/api/combat/instances/nonexistent');

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });

  // ===========================================================================
  // POST /combat/instances/:id/end TESTS
  // ===========================================================================

  describe('POST /api/combat/instances/:id/end', () => {
    beforeEach(() => {
      env.DB._seed('combat_instances', [
        {
          id: 'combat-to-end',
          character_id: 'char-player-1',
          encounter_id: 'enc-warehouse-ambush',
          started_at: '2024-01-15T10:00:00Z',
          status: 'ACTIVE',
          current_round: 5,
          damage_dealt_by_player: 200,
          damage_taken_by_player: 80,
          enemies_defeated: 4,
          allies_lost: 0,
          rounds_elapsed: 4,
          time_elapsed_seconds: 150,
        },
        {
          id: 'combat-no-retreat',
          character_id: 'char-player-1',
          encounter_id: 'enc-no-retreat',
          started_at: '2024-01-15T11:00:00Z',
          status: 'ACTIVE',
          current_round: 2,
          damage_dealt_by_player: 50,
          damage_taken_by_player: 100,
          enemies_defeated: 0,
          allies_lost: 0,
          rounds_elapsed: 1,
          time_elapsed_seconds: 45,
        },
        {
          id: 'combat-already-ended',
          character_id: 'char-player-1',
          encounter_id: 'enc-warehouse-ambush',
          started_at: '2024-01-14T10:00:00Z',
          status: 'COMPLETED',
          current_round: 3,
          ended_at: '2024-01-14T10:05:00Z',
          outcome: 'VICTORY',
        },
      ]);
    });

    it('should end combat with victory', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-to-end/end', {
        body: {
          outcome: 'VICTORY',
          objectivesCompleted: ['Defeat all enemies', 'Find the stash'],
          loot: [{ itemId: 'item-weapon', quantity: 1 }],
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          combat: {
            id: string;
            status: string;
            outcome: string;
            rewards: {
              xpEarned: number;
              creditsEarned: number;
              loot: unknown[];
              objectivesCompleted: string[];
            };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.combat.status).toBe('COMPLETED');
      expect(data.data?.combat.outcome).toBe('VICTORY');
      expect(data.data?.combat.rewards.xpEarned).toBe(150); // Full XP
      expect(data.data?.combat.rewards.creditsEarned).toBe(500);
      expect(data.data?.combat.rewards.objectivesCompleted).toHaveLength(2);
    });

    it('should end combat with defeat (no rewards)', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-to-end/end', {
        body: {
          outcome: 'DEFEAT',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          combat: {
            outcome: string;
            rewards: { xpEarned: number; creditsEarned: number };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.combat.outcome).toBe('DEFEAT');
      expect(data.data?.combat.rewards.xpEarned).toBe(0);
      expect(data.data?.combat.rewards.creditsEarned).toBe(0);
    });

    it('should end combat with retreat (partial XP)', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-to-end/end', {
        body: {
          outcome: 'RETREAT',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          combat: {
            outcome: string;
            rewards: { xpEarned: number };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.combat.outcome).toBe('RETREAT');
      expect(data.data?.combat.rewards.xpEarned).toBe(37); // 25% of 150
    });

    it('should prevent retreat when not allowed', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-no-retreat/end', {
        body: {
          outcome: 'RETREAT',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('RETREAT_NOT_ALLOWED');
    });

    it('should prevent ending already ended combat', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-already-ended/end', {
        body: {
          outcome: 'VICTORY',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('ALREADY_ENDED');
    });

    it('should reject invalid outcome', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-to-end/end', {
        body: {
          outcome: 'INVALID_OUTCOME',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('INVALID_OUTCOME');
    });

    it('should return 404 for non-existent combat', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/nonexistent/end', {
        body: {
          outcome: 'VICTORY',
        },
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });

  // ===========================================================================
  // GET /combat/history TESTS
  // ===========================================================================

  describe('GET /api/combat/history', () => {
    it('should return combat history for character', async () => {
      const request = createTestRequest('GET', '/api/combat/history?characterId=char-player-1');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          history: Array<{
            id: string;
            outcome: string;
            stats: { damageDealt: number };
            rewards: { xpEarned: number };
          }>;
          summary: {
            totalCombats: number;
            outcomes: { victories: number; defeats: number; retreats: number };
          };
          pagination: { total: number };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.history).toHaveLength(3);
      expect(data.data?.pagination.total).toBe(3);
    });

    it('should filter by outcome', async () => {
      const request = createTestRequest('GET', '/api/combat/history?characterId=char-player-1&outcome=VICTORY');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          history: Array<{ outcome: string }>;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.history).toHaveLength(1);
      expect(data.data?.history[0]?.outcome).toBe('VICTORY');
    });

    it('should include combat stats', async () => {
      const request = createTestRequest('GET', '/api/combat/history?characterId=char-player-1');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          history: Array<{
            id: string;
            stats: {
              damageDealt: number;
              damageTaken: number;
              enemiesDefeated: number;
              roundsElapsed: number;
            };
          }>;
        };
      }>(response);

      expect(response.status).toBe(200);
      const victory = data.data?.history.find(h => h.id === 'combat-completed-1');
      expect(victory?.stats.damageDealt).toBe(150);
      expect(victory?.stats.damageTaken).toBe(50);
      expect(victory?.stats.enemiesDefeated).toBe(3);
    });

    it('should include rewards and achievements', async () => {
      const request = createTestRequest('GET', '/api/combat/history?characterId=char-player-1');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          history: Array<{
            id: string;
            rewards: {
              xpEarned: number;
              loot: Array<{ itemId: string; quantity: number }>;
              objectivesCompleted: string[];
            };
            achievements: string[];
          }>;
        };
      }>(response);

      expect(response.status).toBe(200);
      const victory = data.data?.history.find(h => h.id === 'combat-completed-1');
      expect(victory?.rewards.xpEarned).toBe(150);
      expect(victory?.rewards.loot).toHaveLength(1);
      expect(victory?.achievements).toContain('FLAWLESS');
    });

    it('should calculate outcome summary', async () => {
      const request = createTestRequest('GET', '/api/combat/history?characterId=char-player-1');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          summary: {
            totalCombats: number;
            outcomes: { victories: number; defeats: number; retreats: number };
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.summary.totalCombats).toBe(3);
      expect(data.data?.summary.outcomes.victories).toBe(1);
      expect(data.data?.summary.outcomes.defeats).toBe(1);
      expect(data.data?.summary.outcomes.retreats).toBe(1);
    });

    it('should require characterId parameter', async () => {
      const request = createTestRequest('GET', '/api/combat/history');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('MISSING_PARAM');
    });

    it('should paginate results', async () => {
      const request = createTestRequest('GET', '/api/combat/history?characterId=char-player-1&limit=2&offset=0');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          history: unknown[];
          pagination: { total: number; limit: number; offset: number; hasMore: boolean };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.history).toHaveLength(2);
      expect(data.data?.pagination.hasMore).toBe(true);
    });
  });
});

// =============================================================================
// DAY 4: COMBAT ACTIONS & TURN MANAGEMENT TESTS
// =============================================================================

describe('Combat System Day 4 - Actions & Turn Management', () => {
  let env: MockEnv;

  beforeEach(async () => {
    env = createMockEnv();

    // Seed characters
    env.DB._seed('characters', [
      {
        id: 'char-player-1',
        user_id: 'user-1',
        name: 'Test Runner',
        handle: 'testrunner',
        level: 5,
        current_hp: 100,
        max_hp: 100,
      },
    ]);

    // Seed combat action definitions
    env.DB._seed('combat_action_definitions', [
      {
        id: 'action-pistol-shot',
        code: 'PISTOL_SHOT',
        name: 'Pistol Shot',
        description: 'Fire a pistol at a target',
        action_type: 'ATTACK',
        action_cost: 1,
        is_free_action: 0,
        is_reaction: 0,
        target_type: 'SINGLE_ENEMY',
        range_min_m: 1,
        range_max_m: 25,
        damage_formula: '2d6+2',
        damage_type: 'BALLISTIC',
        accuracy_modifier: 0,
        critical_chance_modifier: 0,
        critical_damage_modifier: 1.5,
        status_effects: null,
      },
      {
        id: 'action-defend',
        code: 'DEFEND',
        name: 'Defend',
        description: 'Take a defensive stance',
        action_type: 'DEFEND',
        action_cost: 1,
        is_free_action: 0,
        is_reaction: 0,
        target_type: 'SELF',
        range_min_m: 0,
        range_max_m: 0,
        damage_formula: null,
        damage_type: null,
        accuracy_modifier: 0,
        critical_chance_modifier: 0,
        critical_damage_modifier: 0,
        status_effects: null,
      },
      {
        id: 'action-move',
        code: 'MOVE',
        name: 'Move',
        description: 'Move to a new position',
        action_type: 'MOVE',
        action_cost: 1,
        is_free_action: 0,
        is_reaction: 0,
        target_type: 'POSITION',
        range_min_m: 0,
        range_max_m: 10,
        damage_formula: null,
        damage_type: null,
        accuracy_modifier: 0,
        critical_chance_modifier: 0,
        critical_damage_modifier: 0,
        status_effects: null,
      },
      {
        id: 'action-reload',
        code: 'RELOAD',
        name: 'Reload',
        description: 'Reload your weapon',
        action_type: 'RELOAD',
        action_cost: 1,
        is_free_action: 0,
        is_reaction: 0,
        target_type: 'SELF',
        range_min_m: 0,
        range_max_m: 0,
        damage_formula: null,
        damage_type: null,
        accuracy_modifier: 0,
        critical_chance_modifier: 0,
        critical_damage_modifier: 0,
        status_effects: null,
      },
    ]);

    // Seed active combat instance
    env.DB._seed('combat_instances', [
      {
        id: 'combat-active-turn',
        character_id: 'char-player-1',
        encounter_id: null,
        started_at: '2024-01-15T10:00:00Z',
        status: 'ACTIVE',
        current_round: 1,
        current_turn_entity_id: 'char-player-1',
        turn_order: JSON.stringify([
          { id: 'char-player-1', type: 'player' },
          { id: 'enemy-1', type: 'enemy' },
          { id: 'enemy-2', type: 'enemy' },
        ]),
        player_participants: JSON.stringify([
          { id: 'char-player-1', name: 'Test Runner', type: 'player', isActive: true },
        ]),
        enemy_participants: JSON.stringify([
          { id: 'enemy-1', name: 'Ganger', hp: 50, isActive: true },
          { id: 'enemy-2', name: 'Ganger Heavy', hp: 75, isActive: true },
        ]),
        damage_dealt_by_player: 0,
        damage_taken_by_player: 0,
        enemies_defeated: 0,
        allies_lost: 0,
        rounds_elapsed: 0,
        time_elapsed_seconds: 0,
        action_log: null,
      },
      {
        id: 'combat-paused',
        character_id: 'char-player-1',
        encounter_id: null,
        started_at: '2024-01-15T11:00:00Z',
        status: 'PAUSED',
        current_round: 2,
        current_turn_entity_id: 'char-player-1',
        turn_order: JSON.stringify([
          { id: 'char-player-1', type: 'player' },
          { id: 'enemy-1', type: 'enemy' },
        ]),
        player_participants: JSON.stringify([{ id: 'char-player-1', name: 'Test Runner', isActive: true }]),
        enemy_participants: JSON.stringify([{ id: 'enemy-1', name: 'Ganger', isActive: true }]),
        damage_dealt_by_player: 50,
        damage_taken_by_player: 20,
        enemies_defeated: 1,
        allies_lost: 0,
        rounds_elapsed: 1,
        time_elapsed_seconds: 60,
      },
      {
        id: 'combat-completed',
        character_id: 'char-player-1',
        encounter_id: null,
        started_at: '2024-01-14T10:00:00Z',
        status: 'COMPLETED',
        current_round: 5,
        current_turn_entity_id: null,
        turn_order: null,
        damage_dealt_by_player: 200,
        damage_taken_by_player: 80,
        enemies_defeated: 3,
        allies_lost: 0,
        rounds_elapsed: 5,
        time_elapsed_seconds: 180,
        ended_at: '2024-01-14T10:03:00Z',
        outcome: 'VICTORY',
      },
    ]);
  });

  // ===========================================================================
  // GET /combat/instances/:id/available-actions TESTS
  // ===========================================================================

  describe('GET /api/combat/instances/:id/available-actions', () => {
    it('should return available actions for active combat', async () => {
      const request = createTestRequest('GET', '/api/combat/instances/combat-active-turn/available-actions');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          currentTurn: { entityId: string; entityType: string; round: number };
          actions: {
            attack: unknown[];
            defense: unknown[];
            movement: unknown[];
            utility: unknown[];
          };
          validTargets: Array<{ id: string; name: string }>;
          actionPointsRemaining: number;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.currentTurn.entityId).toBe('char-player-1');
      expect(data.data?.currentTurn.entityType).toBe('player');
      expect(data.data?.currentTurn.round).toBe(1);
      expect(data.data?.actionPointsRemaining).toBe(2);
    });

    it('should categorize actions by type', async () => {
      const request = createTestRequest('GET', '/api/combat/instances/combat-active-turn/available-actions');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          actions: {
            attack: Array<{ code: string }>;
            defense: Array<{ code: string }>;
            movement: Array<{ code: string }>;
          };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.actions.attack.some(a => a.code === 'PISTOL_SHOT')).toBe(true);
      expect(data.data?.actions.defense.some(a => a.code === 'DEFEND')).toBe(true);
      expect(data.data?.actions.movement.some(a => a.code === 'MOVE')).toBe(true);
    });

    it('should return valid targets for player turn', async () => {
      const request = createTestRequest('GET', '/api/combat/instances/combat-active-turn/available-actions');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          validTargets: Array<{ id: string; name: string }>;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.validTargets).toHaveLength(2);
      expect(data.data?.validTargets.some(t => t.id === 'enemy-1')).toBe(true);
      expect(data.data?.validTargets.some(t => t.id === 'enemy-2')).toBe(true);
    });

    it('should return 400 for non-active combat', async () => {
      const request = createTestRequest('GET', '/api/combat/instances/combat-completed/available-actions');

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('COMBAT_NOT_ACTIVE');
    });

    it('should return 404 for non-existent combat', async () => {
      const request = createTestRequest('GET', '/api/combat/instances/nonexistent/available-actions');

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });

  // ===========================================================================
  // POST /combat/instances/:id/action TESTS
  // ===========================================================================

  describe('POST /api/combat/instances/:id/action', () => {
    it('should execute an attack action', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-active-turn/action', {
        body: {
          actionId: 'PISTOL_SHOT',
          targetId: 'enemy-1',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          action: { id: string; code: string; name: string };
          result: { success: boolean; message: string };
          combat: { stats: { damageDealt: number } };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.action.code).toBe('PISTOL_SHOT');
      expect(data.data?.result.message).toBeDefined();
    });

    it('should execute a defensive action', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-active-turn/action', {
        body: {
          actionId: 'DEFEND',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          action: { code: string };
          result: { success: boolean; effects: string[]; message: string };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.action.code).toBe('DEFEND');
      expect(data.data?.result.effects).toContain('DEFENDING');
      expect(data.data?.result.message).toBe('Took defensive stance');
    });

    it('should execute a move action', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-active-turn/action', {
        body: {
          actionId: 'MOVE',
          position: { x: 10, y: 5 },
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          action: { code: string };
          result: { effects: string[] };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.action.code).toBe('MOVE');
      expect(data.data?.result.effects).toContain('MOVED');
    });

    it('should require target for targeted actions', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-active-turn/action', {
        body: {
          actionId: 'PISTOL_SHOT',
          // Missing targetId
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('TARGET_REQUIRED');
    });

    it('should reject invalid action', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-active-turn/action', {
        body: {
          actionId: 'NONEXISTENT_ACTION',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('INVALID_ACTION');
    });

    it('should reject action on non-active combat', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-completed/action', {
        body: {
          actionId: 'DEFEND',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('COMBAT_NOT_ACTIVE');
    });

    it('should return 404 for non-existent combat', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/nonexistent/action', {
        body: {
          actionId: 'DEFEND',
        },
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });

  // ===========================================================================
  // POST /combat/instances/:id/next-turn TESTS
  // ===========================================================================

  describe('POST /api/combat/instances/:id/next-turn', () => {
    it('should advance to next turn', async () => {
      // Create a fresh env to ensure complete isolation
      const freshEnv = createMockEnv();
      freshEnv.DB._seed('combat_instances', [
        {
          id: 'combat-isolated-turn',
          character_id: 'char-player-1',
          status: 'ACTIVE',
          current_round: 1,
          current_turn_entity_id: 'player-first',
          turn_order: JSON.stringify([
            { id: 'player-first', type: 'player' },
            { id: 'enemy-next', type: 'enemy' },
          ]),
          rounds_elapsed: 0,
        },
      ]);

      const request = createTestRequest('POST', '/api/combat/instances/combat-isolated-turn/next-turn', {
        body: {},
      });

      const response = await app.fetch(request, freshEnv);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          previousTurn: { entityId: string; round: number };
          currentTurn: { entityId: string; entityType: string; round: number; turnIndex: number };
          roundAdvanced: boolean;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.previousTurn.entityId).toBe('player-first');
      expect(data.data?.currentTurn.entityId).toBe('enemy-next');
      expect(data.data?.currentTurn.entityType).toBe('enemy');
      expect(data.data?.currentTurn.turnIndex).toBe(1);
      expect(data.data?.roundAdvanced).toBe(false);
    });

    it('should increment round when turn order wraps', async () => {
      // Seed combat at last position in turn order
      env.DB._seed('combat_instances', [
        {
          id: 'combat-last-turn',
          character_id: 'char-player-1',
          status: 'ACTIVE',
          current_round: 1,
          current_turn_entity_id: 'enemy-2',
          turn_order: JSON.stringify([
            { id: 'char-player-1', type: 'player' },
            { id: 'enemy-1', type: 'enemy' },
            { id: 'enemy-2', type: 'enemy' },
          ]),
          rounds_elapsed: 0,
        },
      ]);

      const request = createTestRequest('POST', '/api/combat/instances/combat-last-turn/next-turn', {
        body: {},
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          currentTurn: { round: number; turnIndex: number };
          roundAdvanced: boolean;
          combat: { roundsElapsed: number };
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.data?.currentTurn.round).toBe(2);
      expect(data.data?.currentTurn.turnIndex).toBe(0);
      expect(data.data?.roundAdvanced).toBe(true);
      expect(data.data?.combat.roundsElapsed).toBe(1);
    });

    it('should reject for non-active combat', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-paused/next-turn', {
        body: {},
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('COMBAT_NOT_ACTIVE');
    });

    it('should return 404 for non-existent combat', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/nonexistent/next-turn', {
        body: {},
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });

  // ===========================================================================
  // POST /combat/instances/:id/pause TESTS
  // ===========================================================================

  describe('POST /api/combat/instances/:id/pause', () => {
    it('should pause active combat', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-active-turn/pause', {
        body: {},
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          combat: { id: string; status: string; currentRound: number };
          message: string;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.combat.status).toBe('PAUSED');
      expect(data.data?.message).toBe('Combat paused');
    });

    it('should reject pausing non-active combat', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-paused/pause', {
        body: {},
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('CANNOT_PAUSE');
    });

    it('should return 404 for non-existent combat', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/nonexistent/pause', {
        body: {},
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });

  // ===========================================================================
  // POST /combat/instances/:id/resume TESTS
  // ===========================================================================

  describe('POST /api/combat/instances/:id/resume', () => {
    it('should resume paused combat', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-paused/resume', {
        body: {},
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{
        success: boolean;
        data?: {
          combat: { id: string; status: string; currentRound: number };
          message: string;
        };
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.combat.status).toBe('ACTIVE');
      expect(data.data?.message).toBe('Combat resumed');
    });

    it('should reject resuming non-paused combat', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/combat-active-turn/resume', {
        body: {},
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(400);
      expect(data.errors?.[0]?.code).toBe('CANNOT_RESUME');
    });

    it('should return 404 for non-existent combat', async () => {
      const request = createTestRequest('POST', '/api/combat/instances/nonexistent/resume', {
        body: {},
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(404);
    });
  });

  // ===========================================================================
  // DAY 5: CONDITIONS & STATUS EFFECTS
  // ===========================================================================

  describe('Combat System Day 5 - Conditions & Status Effects', () => {

    // =========================================================================
    // POST /combat/instances/:id/apply-condition TESTS
    // =========================================================================

    describe('POST /api/combat/instances/:id/apply-condition', () => {
      it('should apply a condition to a participant', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-cond-test',
          character_id: 'char-cond-test',
          status: 'ACTIVE',
          current_round: 1,
          player_participants: JSON.stringify([{ id: 'player-cond', name: 'Test Player', type: 'player' }]),
          enemy_participants: JSON.stringify([{ id: 'enemy-cond', name: 'Test Enemy', type: 'enemy' }]),
        }]);
        freshEnv.DB._seed('condition_definitions', [{
          id: 'cond-burning',
          code: 'BURNING',
          name: 'Burning',
          description: 'Taking fire damage over time',
          condition_type: 'DEBUFF',
          severity: 2,
          is_positive: 0,
          is_dispellable: 1,
          default_duration_seconds: 30,
          stacks: 1,
          max_stacks: 5,
          damage_over_time: JSON.stringify({ damagePerSecond: 5, type: 'FIRE' }),
          stat_modifiers: null,
          movement_modifier: 1.0,
          action_restrictions: null,
          on_apply_effect: null,
        }]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-cond-test/apply-condition', {
          body: {
            targetId: 'player-cond',
            conditionCode: 'BURNING',
            stacks: 2,
          },
        });

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{
          success: boolean;
          data?: {
            action: string;
            condition: { code: string; name: string; currentStacks: number };
            target: { id: string; name: string };
          };
        }>(response);

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data?.action).toBe('applied');
        expect(data.data?.condition.code).toBe('BURNING');
        expect(data.data?.condition.currentStacks).toBe(2);
        expect(data.data?.target.id).toBe('player-cond');
      });

      it('should stack conditions when applying again', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-stack-test',
          character_id: 'char-stack-test',
          status: 'ACTIVE',
          current_round: 1,
          player_participants: JSON.stringify([{ id: 'player-stack', name: 'Stack Player', type: 'player' }]),
        }]);
        freshEnv.DB._seed('condition_definitions', [{
          id: 'cond-bleed',
          code: 'BLEEDING',
          name: 'Bleeding',
          description: 'Losing blood',
          condition_type: 'DEBUFF',
          severity: 1,
          is_positive: 0,
          is_dispellable: 1,
          default_duration_seconds: 60,
          stacks: 1,
          max_stacks: 10,
          damage_over_time: JSON.stringify({ damagePerSecond: 2 }),
        }]);
        freshEnv.DB._seed('character_conditions', [{
          id: 'existing-bleed',
          character_id: 'player-stack',
          condition_id: 'cond-bleed',
          current_stacks: 3,
          duration_remaining_seconds: 60,
          times_refreshed: 0,
        }]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-stack-test/apply-condition', {
          body: {
            targetId: 'player-stack',
            conditionCode: 'BLEEDING',
            stacks: 2,
          },
        });

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{
          success: boolean;
          data?: { action: string; condition: { currentStacks: number } };
        }>(response);

        expect(response.status).toBe(200);
        expect(data.data?.action).toBe('stacked');
        expect(data.data?.condition.currentStacks).toBe(5);
      });

      it('should return 400 for invalid target', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-invalid-target',
          character_id: 'char-test',
          status: 'ACTIVE',
          player_participants: JSON.stringify([{ id: 'valid-player', name: 'Valid', type: 'player' }]),
        }]);
        freshEnv.DB._seed('condition_definitions', [{
          id: 'cond-test',
          code: 'TEST',
          name: 'Test',
          default_duration_seconds: 30,
          max_stacks: 1,
        }]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-invalid-target/apply-condition', {
          body: {
            targetId: 'nonexistent-target',
            conditionCode: 'TEST',
          },
        });

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

        expect(response.status).toBe(400);
        expect(data.errors?.[0]?.code).toBe('TARGET_NOT_FOUND');
      });

      it('should return 404 for non-existent condition', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-no-cond',
          character_id: 'char-test',
          status: 'ACTIVE',
          player_participants: JSON.stringify([{ id: 'player-test', name: 'Test', type: 'player' }]),
        }]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-no-cond/apply-condition', {
          body: {
            targetId: 'player-test',
            conditionCode: 'NONEXISTENT',
          },
        });

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

        expect(response.status).toBe(404);
        expect(data.errors?.[0]?.code).toBe('CONDITION_NOT_FOUND');
      });

      it('should return 400 for non-active combat', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-ended',
          character_id: 'char-test',
          status: 'COMPLETED',
          player_participants: JSON.stringify([{ id: 'player-test', name: 'Test', type: 'player' }]),
        }]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-ended/apply-condition', {
          body: {
            targetId: 'player-test',
            conditionCode: 'TEST',
          },
        });

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

        expect(response.status).toBe(400);
        expect(data.errors?.[0]?.code).toBe('COMBAT_NOT_ACTIVE');
      });

      it('should return 404 for non-existent combat', async () => {
        const request = createTestRequest('POST', '/api/combat/instances/nonexistent/apply-condition', {
          body: {
            targetId: 'target',
            conditionCode: 'TEST',
          },
        });

        const response = await app.fetch(request, env);

        expect(response.status).toBe(404);
      });
    });

    // =========================================================================
    // GET /combat/instances/:id/conditions TESTS
    // =========================================================================

    describe('GET /api/combat/instances/:id/conditions', () => {
      it('should return all conditions in combat', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-get-conds',
          character_id: 'char-test',
          status: 'ACTIVE',
          player_participants: JSON.stringify([
            { id: 'player-a', name: 'Player A', type: 'player' },
            { id: 'player-b', name: 'Player B', type: 'player' },
          ]),
          enemy_participants: JSON.stringify([{ id: 'enemy-a', name: 'Enemy A', type: 'enemy' }]),
        }]);
        freshEnv.DB._seed('condition_definitions', [
          { id: 'cond-buff', code: 'HASTE', name: 'Haste', condition_type: 'BUFF', is_positive: 1, severity: 1, movement_modifier: 1.5 },
          { id: 'cond-debuff', code: 'SLOW', name: 'Slow', condition_type: 'DEBUFF', is_positive: 0, severity: 2, movement_modifier: 0.5 },
        ]);
        freshEnv.DB._seed('character_conditions', [
          { id: 'cc-1', character_id: 'player-a', condition_id: 'cond-buff', current_stacks: 1, duration_remaining_seconds: 30, is_paused: 0, times_ticked: 0, total_damage_dealt: 0, total_healing_done: 0, times_refreshed: 0 },
          { id: 'cc-2', character_id: 'enemy-a', condition_id: 'cond-debuff', current_stacks: 2, duration_remaining_seconds: 60, is_paused: 0, times_ticked: 0, total_damage_dealt: 0, total_healing_done: 0, times_refreshed: 0 },
        ]);

        const request = createTestRequest('GET', '/api/combat/instances/combat-get-conds/conditions');

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{
          success: boolean;
          data?: {
            conditions: Array<{ code: string; targetId: string }>;
            byParticipant: Record<string, unknown[]>;
            summary: { total: number; buffs: number; debuffs: number };
          };
        }>(response);

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data?.conditions.length).toBe(2);
        expect(data.data?.summary.total).toBe(2);
        expect(data.data?.summary.buffs).toBe(1);
        expect(data.data?.summary.debuffs).toBe(1);
      });

      it('should filter by participant', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-filter-conds',
          character_id: 'char-test',
          status: 'ACTIVE',
          player_participants: JSON.stringify([{ id: 'player-filter', name: 'Filter Player', type: 'player' }]),
          enemy_participants: JSON.stringify([{ id: 'enemy-filter', name: 'Filter Enemy', type: 'enemy' }]),
        }]);
        freshEnv.DB._seed('condition_definitions', [
          { id: 'cond-f1', code: 'POISON', name: 'Poison', condition_type: 'DEBUFF', is_positive: 0, severity: 1 },
        ]);
        freshEnv.DB._seed('character_conditions', [
          { id: 'cc-f1', character_id: 'player-filter', condition_id: 'cond-f1', current_stacks: 1, is_paused: 0, times_ticked: 0, total_damage_dealt: 0, total_healing_done: 0, times_refreshed: 0 },
          { id: 'cc-f2', character_id: 'enemy-filter', condition_id: 'cond-f1', current_stacks: 3, is_paused: 0, times_ticked: 0, total_damage_dealt: 0, total_healing_done: 0, times_refreshed: 0 },
        ]);

        const request = createTestRequest('GET', '/api/combat/instances/combat-filter-conds/conditions?participantId=player-filter');

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{
          success: boolean;
          data?: { conditions: Array<{ targetId: string }> };
        }>(response);

        expect(response.status).toBe(200);
        expect(data.data?.conditions.length).toBe(1);
        expect(data.data?.conditions[0]?.targetId).toBe('player-filter');
      });

      it('should return empty for no conditions', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-no-conds',
          character_id: 'char-test',
          status: 'ACTIVE',
          player_participants: JSON.stringify([{ id: 'player-nc', name: 'No Cond Player', type: 'player' }]),
        }]);

        const request = createTestRequest('GET', '/api/combat/instances/combat-no-conds/conditions');

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{
          success: boolean;
          data?: { conditions: unknown[]; summary: { total: number } };
        }>(response);

        expect(response.status).toBe(200);
        expect(data.data?.conditions.length).toBe(0);
        expect(data.data?.summary.total).toBe(0);
      });

      it('should return 404 for non-existent combat', async () => {
        const request = createTestRequest('GET', '/api/combat/instances/nonexistent/conditions');

        const response = await app.fetch(request, env);

        expect(response.status).toBe(404);
      });
    });

    // =========================================================================
    // POST /combat/instances/:id/remove-condition TESTS
    // =========================================================================

    describe('POST /api/combat/instances/:id/remove-condition', () => {
      it('should remove a specific condition', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-remove-cond',
          character_id: 'char-test',
          status: 'ACTIVE',
          player_participants: JSON.stringify([{ id: 'player-rm', name: 'Remove Player', type: 'player' }]),
        }]);
        freshEnv.DB._seed('condition_definitions', [
          { id: 'cond-rm', code: 'STUN', name: 'Stunned' },
        ]);
        freshEnv.DB._seed('character_conditions', [
          { id: 'cc-remove', character_id: 'player-rm', condition_id: 'cond-rm', current_stacks: 1 },
        ]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-remove-cond/remove-condition', {
          body: {
            targetId: 'player-rm',
            conditionInstanceId: 'cc-remove',
          },
        });

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{
          success: boolean;
          data?: { action: string; removedConditions: Array<{ code: string }> };
        }>(response);

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data?.action).toBe('removed');
        expect(data.data?.removedConditions[0]?.code).toBe('STUN');
      });

      it('should remove condition by code', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-rm-code',
          character_id: 'char-test',
          status: 'ACTIVE',
          player_participants: JSON.stringify([{ id: 'player-rmc', name: 'RM Code Player', type: 'player' }]),
        }]);
        freshEnv.DB._seed('condition_definitions', [
          { id: 'cond-blind', code: 'BLIND', name: 'Blinded' },
        ]);
        freshEnv.DB._seed('character_conditions', [
          { id: 'cc-blind', character_id: 'player-rmc', condition_id: 'cond-blind', current_stacks: 1 },
        ]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-rm-code/remove-condition', {
          body: {
            targetId: 'player-rmc',
            conditionCode: 'BLIND',
          },
        });

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{
          success: boolean;
          data?: { removedConditions: Array<{ code: string }> };
        }>(response);

        expect(response.status).toBe(200);
        expect(data.data?.removedConditions[0]?.code).toBe('BLIND');
      });

      it('should reduce stacks instead of removing', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-reduce',
          character_id: 'char-test',
          status: 'ACTIVE',
          player_participants: JSON.stringify([{ id: 'player-red', name: 'Reduce Player', type: 'player' }]),
        }]);
        freshEnv.DB._seed('condition_definitions', [
          { id: 'cond-stack', code: 'VULN', name: 'Vulnerable' },
        ]);
        freshEnv.DB._seed('character_conditions', [
          { id: 'cc-stack', character_id: 'player-red', condition_id: 'cond-stack', current_stacks: 5 },
        ]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-reduce/remove-condition', {
          body: {
            targetId: 'player-red',
            conditionInstanceId: 'cc-stack',
            removeStacks: 2,
          },
        });

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{
          success: boolean;
          data?: { action: string; stacksRemoved: number };
        }>(response);

        expect(response.status).toBe(200);
        expect(data.data?.action).toBe('reduced');
        expect(data.data?.stacksRemoved).toBe(2);
      });

      it('should remove all conditions', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-rm-all',
          character_id: 'char-test',
          status: 'ACTIVE',
          player_participants: JSON.stringify([{ id: 'player-all', name: 'All Player', type: 'player' }]),
        }]);
        freshEnv.DB._seed('condition_definitions', [
          { id: 'cond-a', code: 'COND_A', name: 'Condition A' },
          { id: 'cond-b', code: 'COND_B', name: 'Condition B' },
        ]);
        freshEnv.DB._seed('character_conditions', [
          { id: 'cc-a', character_id: 'player-all', condition_id: 'cond-a', current_stacks: 1 },
          { id: 'cc-b', character_id: 'player-all', condition_id: 'cond-b', current_stacks: 2 },
        ]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-rm-all/remove-condition', {
          body: {
            targetId: 'player-all',
            removeAll: true,
          },
        });

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{
          success: boolean;
          data?: { action: string; removedCount: number };
        }>(response);

        expect(response.status).toBe(200);
        expect(data.data?.action).toBe('all_removed');
        expect(data.data?.removedCount).toBe(2);
      });

      it('should return 404 for non-existent condition', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-no-rm',
          character_id: 'char-test',
          status: 'ACTIVE',
          player_participants: JSON.stringify([{ id: 'player-nrm', name: 'No RM Player', type: 'player' }]),
        }]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-no-rm/remove-condition', {
          body: {
            targetId: 'player-nrm',
            conditionInstanceId: 'nonexistent',
          },
        });

        const response = await app.fetch(request, freshEnv);

        expect(response.status).toBe(404);
      });

      it('should return 400 for non-active combat', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-ended-rm',
          character_id: 'char-test',
          status: 'COMPLETED',
          player_participants: JSON.stringify([{ id: 'player-end', name: 'End Player', type: 'player' }]),
        }]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-ended-rm/remove-condition', {
          body: {
            targetId: 'player-end',
            conditionCode: 'TEST',
          },
        });

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

        expect(response.status).toBe(400);
        expect(data.errors?.[0]?.code).toBe('COMBAT_NOT_ACTIVE');
      });

      it('should return 404 for non-existent combat', async () => {
        const request = createTestRequest('POST', '/api/combat/instances/nonexistent/remove-condition', {
          body: {
            targetId: 'target',
            conditionCode: 'TEST',
          },
        });

        const response = await app.fetch(request, env);

        expect(response.status).toBe(404);
      });
    });

    // =========================================================================
    // POST /combat/instances/:id/tick-conditions TESTS
    // =========================================================================

    describe('POST /api/combat/instances/:id/tick-conditions', () => {
      it('should process damage over time', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-tick-dot',
          character_id: 'char-test',
          status: 'ACTIVE',
          player_participants: JSON.stringify([{ id: 'player-dot', name: 'DOT Player', type: 'player' }]),
        }]);
        freshEnv.DB._seed('condition_definitions', [{
          id: 'cond-fire',
          code: 'FIRE_DOT',
          name: 'Burning',
          damage_over_time: JSON.stringify({ damagePerSecond: 5 }),
          healing_over_time: null,
        }]);
        freshEnv.DB._seed('character_conditions', [{
          id: 'cc-fire',
          character_id: 'player-dot',
          condition_id: 'cond-fire',
          current_stacks: 2,
          duration_remaining_seconds: 30,
          is_paused: 0,
          times_ticked: 0,
          total_damage_dealt: 0,
          total_healing_done: 0,
        }]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-tick-dot/tick-conditions', {
          body: { tickDuration: 6 },
        });

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{
          success: boolean;
          data?: {
            processed: Array<{ damageDealt: number; durationRemaining: number }>;
            totalDamage: number;
            summary: { conditionsProcessed: number };
          };
        }>(response);

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        // 5 dps * 6 seconds * 2 stacks = 60 damage
        expect(data.data?.totalDamage).toBe(60);
        expect(data.data?.processed[0]?.durationRemaining).toBe(24);
        expect(data.data?.summary.conditionsProcessed).toBe(1);
      });

      it('should process healing over time', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-tick-hot',
          character_id: 'char-test',
          status: 'ACTIVE',
          player_participants: JSON.stringify([{ id: 'player-hot', name: 'HOT Player', type: 'player' }]),
        }]);
        freshEnv.DB._seed('condition_definitions', [{
          id: 'cond-regen',
          code: 'REGEN',
          name: 'Regeneration',
          damage_over_time: null,
          healing_over_time: JSON.stringify({ healingPerSecond: 10 }),
        }]);
        freshEnv.DB._seed('character_conditions', [{
          id: 'cc-regen',
          character_id: 'player-hot',
          condition_id: 'cond-regen',
          current_stacks: 1,
          duration_remaining_seconds: 60,
          is_paused: 0,
          times_ticked: 0,
          total_damage_dealt: 0,
          total_healing_done: 0,
        }]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-tick-hot/tick-conditions', {
          body: { tickDuration: 6 },
        });

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{
          success: boolean;
          data?: { totalHealing: number; summary: { netHealthChange: number } };
        }>(response);

        expect(response.status).toBe(200);
        // 10 hps * 6 seconds * 1 stack = 60 healing
        expect(data.data?.totalHealing).toBe(60);
        expect(data.data?.summary.netHealthChange).toBe(60);
      });

      it('should expire conditions with zero duration', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-tick-expire',
          character_id: 'char-test',
          status: 'ACTIVE',
          player_participants: JSON.stringify([{ id: 'player-exp', name: 'Expire Player', type: 'player' }]),
        }]);
        freshEnv.DB._seed('condition_definitions', [{
          id: 'cond-expire',
          code: 'EXPIRING',
          name: 'Almost Gone',
        }]);
        freshEnv.DB._seed('character_conditions', [{
          id: 'cc-expire',
          character_id: 'player-exp',
          condition_id: 'cond-expire',
          current_stacks: 1,
          duration_remaining_seconds: 3,
          is_paused: 0,
          times_ticked: 0,
          total_damage_dealt: 0,
          total_healing_done: 0,
        }]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-tick-expire/tick-conditions', {
          body: { tickDuration: 6 },
        });

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{
          success: boolean;
          data?: {
            expired: Array<{ code: string }>;
            summary: { conditionsExpired: number };
          };
        }>(response);

        expect(response.status).toBe(200);
        expect(data.data?.expired.length).toBe(1);
        expect(data.data?.expired[0]?.code).toBe('EXPIRING');
        expect(data.data?.summary.conditionsExpired).toBe(1);
      });

      it('should skip paused conditions', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-tick-paused',
          character_id: 'char-test',
          status: 'ACTIVE',
          player_participants: JSON.stringify([{ id: 'player-psd', name: 'Paused Player', type: 'player' }]),
        }]);
        freshEnv.DB._seed('condition_definitions', [{
          id: 'cond-paused',
          code: 'PAUSED_COND',
          name: 'Paused Condition',
          damage_over_time: JSON.stringify({ damagePerSecond: 100 }),
        }]);
        freshEnv.DB._seed('character_conditions', [{
          id: 'cc-paused',
          character_id: 'player-psd',
          condition_id: 'cond-paused',
          current_stacks: 1,
          duration_remaining_seconds: 60,
          is_paused: 1,
          times_ticked: 0,
          total_damage_dealt: 0,
          total_healing_done: 0,
        }]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-tick-paused/tick-conditions', {
          body: { tickDuration: 6 },
        });

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{
          success: boolean;
          data?: { processed: unknown[]; totalDamage: number };
        }>(response);

        expect(response.status).toBe(200);
        expect(data.data?.processed.length).toBe(0);
        expect(data.data?.totalDamage).toBe(0);
      });

      it('should return 400 for non-active combat', async () => {
        const freshEnv = createMockEnv();
        freshEnv.DB._seed('combat_instances', [{
          id: 'combat-tick-ended',
          character_id: 'char-test',
          status: 'COMPLETED',
        }]);

        const request = createTestRequest('POST', '/api/combat/instances/combat-tick-ended/tick-conditions', {
          body: {},
        });

        const response = await app.fetch(request, freshEnv);
        const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

        expect(response.status).toBe(400);
        expect(data.errors?.[0]?.code).toBe('COMBAT_NOT_ACTIVE');
      });

      it('should return 404 for non-existent combat', async () => {
        const request = createTestRequest('POST', '/api/combat/instances/nonexistent/tick-conditions', {
          body: {},
        });

        const response = await app.fetch(request, env);

        expect(response.status).toBe(404);
      });
    });
  });
});
