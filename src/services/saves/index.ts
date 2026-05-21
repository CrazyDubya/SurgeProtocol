/**
 * Surge Protocol - Save Service Exports
 */
export { SaveService } from './service';
export type {
    CharacterStateSnapshot,
    CreateSaveInput,
    CheckpointInput,
} from './service';
export {
    MAX_MANUAL_SAVES,
    MAX_AUTO_SAVES,
    QUICKSAVE_SLOT,
    MAX_CHECKPOINTS_PER_SAVE,
} from './service';
