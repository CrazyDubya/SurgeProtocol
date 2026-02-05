/**
 * Surge Protocol - Service Base Classes
 *
 * Foundation for all game services providing:
 * - Consistent error handling
 * - Database access patterns
 * - Logging and metrics
 * - Transaction support
 */

import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ErrorCodes, type ErrorCode } from '../../utils/errors';

// =============================================================================
// TYPES
// =============================================================================

export interface ServiceContext {
  db: D1Database;
  cache?: KVNamespace;
  userId?: string;
  characterId?: string;
}

export interface ServiceResult<T> {
  success: true;
  data: T;
}

export interface ServiceError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ServiceResponse<T> = ServiceResult<T> | ServiceError;

// =============================================================================
// BASE SERVICE CLASS
// =============================================================================

/**
 * Base class for all game services.
 * Provides common functionality and patterns.
 */
export abstract class BaseService {
  protected readonly db: D1Database;
  protected readonly cache?: KVNamespace;
  protected readonly userId?: string;
  protected readonly characterId?: string;

  constructor(context: ServiceContext) {
    this.db = context.db;
    this.cache = context.cache;
    this.userId = context.userId;
    this.characterId = context.characterId;
  }

  /**
   * Create a success response.
   */
  protected success<T>(data: T): ServiceResult<T> {
    return { success: true, data };
  }

  /**
   * Create an error response.
   */
  protected error(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ): ServiceError {
    return {
      success: false,
      error: { code, message, details },
    };
  }

  /**
   * Throw a service error (for use in methods that should throw).
   */
  protected throw(
    code: ErrorCode,
    message: string,
    statusCode: number = 400,
    details?: Record<string, unknown>
  ): never {
    throw new AppError(code, message, statusCode, { details });
  }

  /**
   * Assert a condition or throw.
   */
  protected assert(
    condition: unknown,
    code: ErrorCode,
    message: string,
    statusCode: number = 400
  ): asserts condition {
    if (!condition) {
      throw new AppError(code, message, statusCode);
    }
  }

  /**
   * Assert a value exists.
   */
  protected assertExists<T>(
    value: T | null | undefined,
    code: ErrorCode,
    message: string
  ): asserts value is T {
    if (value === null || value === undefined) {
      throw new AppError(code, message, 404);
    }
  }

  /**
   * Execute a database query with error handling.
   */
  protected async query<T>(
    sql: string,
    ...bindings: unknown[]
  ): Promise<T | null> {
    try {
      const stmt = this.db.prepare(sql);
      if (bindings.length > 0) {
        return await stmt.bind(...bindings).first<T>();
      }
      return await stmt.first<T>();
    } catch (error) {
      console.error('Database query error:', error);
      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        'Database query failed',
        500
      );
    }
  }

  /**
   * Execute a database query returning all results.
   */
  protected async queryAll<T>(
    sql: string,
    ...bindings: unknown[]
  ): Promise<T[]> {
    try {
      const stmt = this.db.prepare(sql);
      if (bindings.length > 0) {
        const result = await stmt.bind(...bindings).all<T>();
        return result.results ?? [];
      }
      const result = await stmt.all<T>();
      return result.results ?? [];
    } catch (error) {
      console.error('Database query error:', error);
      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        'Database query failed',
        500
      );
    }
  }

  /**
   * Execute a database write operation.
   */
  protected async execute(
    sql: string,
    ...bindings: unknown[]
  ): Promise<D1Result<unknown>> {
    try {
      const stmt = this.db.prepare(sql);
      if (bindings.length > 0) {
        return await stmt.bind(...bindings).run();
      }
      return await stmt.run();
    } catch (error) {
      console.error('Database execute error:', error);
      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        'Database operation failed',
        500
      );
    }
  }

  /**
   * Execute multiple statements in a batch (transaction-like).
   */
  protected async batch(
    statements: D1PreparedStatement[]
  ): Promise<D1Result<unknown>[]> {
    try {
      return await this.db.batch(statements);
    } catch (error) {
      console.error('Database batch error:', error);
      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        'Database batch operation failed',
        500
      );
    }
  }

  /**
   * Get a cached value or compute it.
   */
  protected async cached<T>(
    key: string,
    compute: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    if (!this.cache) {
      return compute();
    }

    const cached = await this.cache.get(key, 'json');
    if (cached !== null) {
      return cached as T;
    }

    const value = await compute();
    await this.cache.put(key, JSON.stringify(value), {
      expirationTtl: ttlSeconds,
    });
    return value;
  }

  /**
   * Invalidate a cache key.
   */
  protected async invalidateCache(key: string): Promise<void> {
    if (this.cache) {
      await this.cache.delete(key);
    }
  }

  /**
   * Log a service event.
   */
  protected log(
    level: 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, unknown>
  ): void {
    const entry = {
      timestamp: new Date().toISOString(),
      service: this.constructor.name,
      level,
      message,
      userId: this.userId,
      characterId: this.characterId,
      ...data,
    };

    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }
}

// =============================================================================
// CHARACTER-AWARE SERVICE
// =============================================================================

/**
 * Base class for services that require an active character.
 */
export abstract class CharacterService extends BaseService {
  protected readonly requiredCharacterId: string;

  constructor(context: ServiceContext) {
    super(context);
    if (!context.characterId) {
      throw new AppError(
        ErrorCodes.NO_CHARACTER,
        'No character selected',
        400
      );
    }
    this.requiredCharacterId = context.characterId;
  }

  /**
   * Get the current character's data.
   */
  protected async getCharacter(): Promise<CharacterData> {
    const character = await this.query<CharacterData>(
      `SELECT * FROM characters WHERE id = ?`,
      this.requiredCharacterId
    );
    this.assertExists(
      character,
      ErrorCodes.CHARACTER_NOT_FOUND,
      'Character not found'
    );
    return character;
  }

  /**
   * Update character data.
   */
  protected async updateCharacter(
    updates: Partial<CharacterUpdateData>
  ): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(this.requiredCharacterId);

    await this.execute(
      `UPDATE characters SET ${fields.join(', ')} WHERE id = ?`,
      ...values
    );
  }
}

// =============================================================================
// TYPES FOR CHARACTER SERVICE
// =============================================================================

export interface CharacterData {
  id: string;
  user_id: string;
  name: string;
  tier: number;
  overall_rating: number;
  humanity_current: number;
  humanity_max: number;
  credits: number;
  xp_current: number;
  xp_total: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CharacterUpdateData {
  tier: number;
  overall_rating: number;
  humanity_current: number;
  credits: number;
  xp_current: number;
  xp_total: number;
  is_active: number;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { AppError, ErrorCodes };
export type { ErrorCode };
