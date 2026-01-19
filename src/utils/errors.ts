/**
 * Surge Protocol - Error Handling Utilities
 *
 * Standardized error response format and error classes.
 */

import type { Context } from 'hono';

// =============================================================================
// TYPES
// =============================================================================

export interface APIError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface APIErrorResponse {
  success: false;
  errors: APIError[];
  requestId?: string;
  timestamp: string;
}

export interface APISuccessResponse<T> {
  success: true;
  data: T;
  requestId?: string;
  timestamp?: string;
}

// =============================================================================
// ERROR CODES
// =============================================================================

export const ErrorCodes = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Character
  NO_CHARACTER: 'NO_CHARACTER',
  CHARACTER_NOT_FOUND: 'CHARACTER_NOT_FOUND',
  CHARACTER_DEAD: 'CHARACTER_DEAD',

  // Mission
  MISSION_NOT_FOUND: 'MISSION_NOT_FOUND',
  MISSION_NOT_ACTIVE: 'MISSION_NOT_ACTIVE',
  MISSION_ALREADY_ACTIVE: 'MISSION_ALREADY_ACTIVE',
  TIER_TOO_LOW: 'TIER_TOO_LOW',
  TIER_TOO_HIGH: 'TIER_TOO_HIGH',
  TIER_REQUIREMENT: 'TIER_REQUIREMENT',
  TIME_EXPIRED: 'TIME_EXPIRED',
  OBJECTIVES_INCOMPLETE: 'OBJECTIVES_INCOMPLETE',

  // State
  INVALID_STATE: 'INVALID_STATE',

  // Faction
  FACTION_NOT_FOUND: 'FACTION_NOT_FOUND',
  NOT_MEMBER: 'NOT_MEMBER',
  ALREADY_MEMBER: 'ALREADY_MEMBER',
  INSUFFICIENT_REPUTATION: 'INSUFFICIENT_REPUTATION',
  NO_AFFILIATION: 'NO_AFFILIATION',

  // Resources
  INSUFFICIENT_RESOURCES: 'INSUFFICIENT_RESOURCES',

  // Combat
  COMBAT_NOT_ACTIVE: 'COMBAT_NOT_ACTIVE',
  NOT_YOUR_TURN: 'NOT_YOUR_TURN',
  INVALID_ACTION: 'INVALID_ACTION',
  TARGET_NOT_FOUND: 'TARGET_NOT_FOUND',

  // War
  WAR_NOT_FOUND: 'WAR_NOT_FOUND',
  WAR_NOT_ACTIVE: 'WAR_NOT_ACTIVE',
  WAR_ENDED: 'WAR_ENDED',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// =============================================================================
// ERROR CLASSES
// =============================================================================

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly field?: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 400,
    options?: { field?: string; details?: Record<string, unknown> }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.field = options?.field;
    this.details = options?.details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      ErrorCodes.NOT_FOUND,
      id ? `${resource} with ID ${id} not found` : `${resource} not found`,
      404
    );
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(ErrorCodes.UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(ErrorCodes.FORBIDDEN, message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(ErrorCodes.VALIDATION_ERROR, message, 400, { field });
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCodes.CONFLICT, message, 409);
    this.name = 'ConflictError';
  }
}

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

/**
 * Create a success response.
 */
export function success<T>(c: Context, data: T, status: number = 200): Response {
  const body: APISuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return c.json(body, status as 200);
}

/**
 * Create an error response.
 */
export function error(
  c: Context,
  code: ErrorCode,
  message: string,
  status: number = 400,
  options?: { field?: string; details?: Record<string, unknown> }
): Response {
  const body: APIErrorResponse = {
    success: false,
    errors: [
      {
        code,
        message,
        field: options?.field,
        details: options?.details,
      },
    ],
    timestamp: new Date().toISOString(),
  };

  return c.json(body, status as 400);
}

/**
 * Create an error response from multiple errors.
 */
export function errors(c: Context, errs: APIError[], status: number = 400): Response {
  const body: APIErrorResponse = {
    success: false,
    errors: errs,
    timestamp: new Date().toISOString(),
  };

  return c.json(body, status as 400);
}

/**
 * Create an error response from an AppError.
 */
export function fromAppError(c: Context, err: AppError): Response {
  return error(c, err.code, err.message, err.statusCode, {
    field: err.field,
    details: err.details,
  });
}

/**
 * Handle unknown errors safely.
 */
export function handleError(c: Context, err: unknown): Response {
  console.error('Unhandled error:', err);

  if (err instanceof AppError) {
    return fromAppError(c, err);
  }

  if (err instanceof Error) {
    // Don't expose internal error messages in production
    const message =
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred';

    return error(c, ErrorCodes.INTERNAL_ERROR, message, 500);
  }

  return error(c, ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred', 500);
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Assert a condition or throw an error.
 */
export function assert(
  condition: unknown,
  code: ErrorCode,
  message: string,
  status: number = 400
): asserts condition {
  if (!condition) {
    throw new AppError(code, message, status);
  }
}

/**
 * Assert a value exists (not null/undefined).
 */
export function assertExists<T>(
  value: T | null | undefined,
  resource: string,
  id?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundError(resource, id);
  }
}

/**
 * Assert user is authenticated.
 */
export function assertAuthenticated(userId: string | undefined): asserts userId is string {
  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }
}

/**
 * Assert character is selected.
 */
export function assertCharacterSelected(
  characterId: string | undefined
): asserts characterId is string {
  if (!characterId) {
    throw new AppError(
      ErrorCodes.NO_CHARACTER,
      'No character selected. Select a character first.',
      400
    );
  }
}
