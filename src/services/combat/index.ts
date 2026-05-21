/**
 * Surge Protocol - Combat Services
 *
 * Exports for combat-related services.
 */

export {
  CombatResolverService,
  type CombatSessionConfig,
  type CombatParticipant,
  type CombatSessionResult,
  type ActionResult,
  type CombatEndResult,
} from './resolver';

export { CombatService } from './service';

// Re-export types from their canonical sources
export type {
  CombatPhase,
  CombatEndReason,
  CombatActionType,
  CombatState,
} from '../../realtime/combat';

export type {
  Combatant,
  Weapon,
  Armor,
  AttackResult,
} from '../../game/mechanics/combat';
