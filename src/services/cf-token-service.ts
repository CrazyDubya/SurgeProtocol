/**
 * Cloudflare Token Service
 *
 * Creates child API tokens from a master token for scoped access.
 *
 * Workflow:
 * 1. Use master token to call POST /accounts/{account_id}/tokens
 * 2. Specify permissions and expiration time
 * 3. Use the returned `value` field as the new bearer token
 */

import type {
  CFCreateTokenRequest,
  CFCreateTokenResponse,
  CFTokenPolicy,
  CFTokenValue,
  CFPermissionGroupKey,
} from '../types/cf-token';
import { CF_PERMISSION_GROUPS } from '../types/cf-token';

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

export interface TokenServiceConfig {
  /** Master API token with token creation permissions */
  masterToken: string;
  /** Cloudflare Account ID */
  accountId: string;
}

export interface CreateTokenOptions {
  /** Human-readable name for the token */
  name: string;
  /** Permission groups to grant */
  permissions: CFPermissionGroupKey[];
  /** Token lifetime in seconds (default: 3600 = 1 hour) */
  expiresInSeconds?: number;
  /** Optional IP allowlist */
  allowedIPs?: string[];
  /** Optional IP blocklist */
  blockedIPs?: string[];
}

export interface TokenResult {
  /** The bearer token value to use for API calls */
  bearerToken: string;
  /** Token ID for management operations */
  tokenId: string;
  /** When the token expires */
  expiresAt: Date;
  /** Full token metadata */
  metadata: CFTokenValue;
}

export class CFTokenService {
  private readonly masterToken: string;
  private readonly accountId: string;

  constructor(config: TokenServiceConfig) {
    if (!config.masterToken) {
      throw new Error('Master token is required');
    }
    if (!config.accountId) {
      throw new Error('Account ID is required');
    }
    this.masterToken = config.masterToken;
    this.accountId = config.accountId;
  }

  /**
   * Creates a new scoped API token using the master token.
   *
   * @example
   * ```typescript
   * const tokenService = new CFTokenService({
   *   masterToken: env.CF_MASTER_TOKEN,
   *   accountId: env.CF_ACCOUNT_ID,
   * });
   *
   * const result = await tokenService.createToken({
   *   name: 'game-session-token',
   *   permissions: ['D1_READ', 'D1_WRITE', 'KV_READ'],
   *   expiresInSeconds: 3600, // 1 hour
   * });
   *
   * // Use result.bearerToken for API calls
   * fetch(url, {
   *   headers: { Authorization: `Bearer ${result.bearerToken}` }
   * });
   * ```
   */
  async createToken(options: CreateTokenOptions): Promise<TokenResult> {
    const expiresInSeconds = options.expiresInSeconds ?? 3600;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const policies = this.buildPolicies(options.permissions);

    const requestBody: CFCreateTokenRequest = {
      name: options.name,
      policies,
      expires_on: expiresAt.toISOString(),
    };

    // Add IP conditions if specified
    if (options.allowedIPs || options.blockedIPs) {
      requestBody.condition = {
        request_ip: {},
      };
      if (options.allowedIPs?.length) {
        requestBody.condition.request_ip!.in = options.allowedIPs;
      }
      if (options.blockedIPs?.length) {
        requestBody.condition.request_ip!.not_in = options.blockedIPs;
      }
    }

    const response = await fetch(
      `${CF_API_BASE}/accounts/${this.accountId}/tokens`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.masterToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data: CFCreateTokenResponse = await response.json();

    if (!data.success) {
      const errorMessages = data.errors
        .map((e) => `[${e.code}] ${e.message}`)
        .join('; ');
      throw new CFTokenError(
        `Failed to create token: ${errorMessages}`,
        data.errors
      );
    }

    return {
      bearerToken: data.result.value,
      tokenId: data.result.id,
      expiresAt,
      metadata: data.result,
    };
  }

  /**
   * Revokes an existing token by ID.
   */
  async revokeToken(tokenId: string): Promise<void> {
    const response = await fetch(
      `${CF_API_BASE}/accounts/${this.accountId}/tokens/${tokenId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.masterToken}`,
        },
      }
    );

    const data: CFCreateTokenResponse = await response.json();

    if (!data.success) {
      const errorMessages = data.errors
        .map((e) => `[${e.code}] ${e.message}`)
        .join('; ');
      throw new CFTokenError(
        `Failed to revoke token: ${errorMessages}`,
        data.errors
      );
    }
  }

  /**
   * Verifies if a token is still valid.
   */
  async verifyToken(bearerToken: string): Promise<boolean> {
    const response = await fetch(`${CF_API_BASE}/user/tokens/verify`, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  }

  /**
   * Builds policy objects from permission group keys.
   */
  private buildPolicies(permissions: CFPermissionGroupKey[]): CFTokenPolicy[] {
    const permissionGroups = permissions.map((key) => ({
      id: CF_PERMISSION_GROUPS[key],
    }));

    return [
      {
        effect: 'allow',
        resources: {
          [`com.cloudflare.api.account.${this.accountId}`]: '*',
        },
        permission_groups: permissionGroups,
      },
    ];
  }
}

/**
 * Custom error class for CF Token operations.
 */
export class CFTokenError extends Error {
  constructor(
    message: string,
    public readonly errors: Array<{ code: number; message: string }>
  ) {
    super(message);
    this.name = 'CFTokenError';
  }
}

/**
 * Pre-configured token profiles for common use cases.
 */
export const TOKEN_PROFILES = {
  /** Read-only access to game data */
  GAME_DATA_READ: ['D1_READ', 'KV_READ'] as CFPermissionGroupKey[],

  /** Full game session access (player actions) */
  GAME_SESSION: [
    'D1_READ',
    'D1_WRITE',
    'KV_READ',
    'KV_WRITE',
    'DURABLE_OBJECTS_READ',
    'DURABLE_OBJECTS_WRITE',
  ] as CFPermissionGroupKey[],

  /** Combat session access */
  COMBAT_SESSION: [
    'D1_READ',
    'D1_WRITE',
    'DURABLE_OBJECTS_READ',
    'DURABLE_OBJECTS_WRITE',
  ] as CFPermissionGroupKey[],

  /** Asset read access (portraits, images) */
  ASSETS_READ: ['R2_READ'] as CFPermissionGroupKey[],

  /** Admin access (deployment, management) */
  ADMIN: [
    'D1_READ',
    'D1_WRITE',
    'KV_READ',
    'KV_WRITE',
    'R2_READ',
    'R2_WRITE',
    'WORKERS_READ',
    'WORKERS_WRITE',
    'DURABLE_OBJECTS_READ',
    'DURABLE_OBJECTS_WRITE',
  ] as CFPermissionGroupKey[],
} as const;
