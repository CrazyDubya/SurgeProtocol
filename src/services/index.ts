/**
 * Service exports for Surge Protocol
 */

// Base Service Classes
export {
  BaseService,
  CharacterService,
  AppError,
  ErrorCodes,
} from './base';

export type {
  ServiceContext,
  ServiceResult,
  ServiceError,
  ServiceResponse,
  CharacterData,
  CharacterUpdateData,
  ErrorCode,
} from './base';

// Cloudflare Token Service
export {
  CFTokenService,
  CFTokenError,
  TOKEN_PROFILES,
} from './cf-token-service';

export type {
  TokenServiceConfig,
  CreateTokenOptions,
  TokenResult,
} from './cf-token-service';

// Rating Services
export {
  RatingCalculatorService,
  StatelessRatingCalculator,
  RatingDecayService,
  createDecayJob,
  getDecayAlgorithmMessage,
} from './rating';

export type {
  RatingComponentRecord,
  RatingUpdateResult,
  RatingSnapshot,
  MissionHistory,
  DecayResult,
  BatchDecayResult,
  DecayConfig,
  InactiveCharacter,
} from './rating';
