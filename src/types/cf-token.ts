/**
 * Cloudflare API Token Types
 *
 * Used for creating child tokens from a master token via:
 * POST /accounts/{account_id}/tokens
 */

/** Permission groups that can be assigned to tokens */
export interface CFTokenPermissionGroup {
  id: string;
  name?: string;
}

/** Resource specification for token policies */
export interface CFTokenResource {
  /** Resource identifier, e.g., "com.cloudflare.api.account.{account_id}" */
  [key: string]: string;
}

/** Policy defining what a token can access */
export interface CFTokenPolicy {
  /** Unique identifier for this policy */
  id?: string;
  /** "allow" or "deny" */
  effect: 'allow' | 'deny';
  /** Resources this policy applies to */
  resources: CFTokenResource;
  /** Permission groups granted by this policy */
  permission_groups: CFTokenPermissionGroup[];
}

/** Condition for IP-based access control */
export interface CFTokenCondition {
  request_ip?: {
    in?: string[];
    not_in?: string[];
  };
}

/** Request body for creating a new API token */
export interface CFCreateTokenRequest {
  /** Human-readable name for the token */
  name: string;
  /** Policies defining token permissions */
  policies: CFTokenPolicy[];
  /** Optional IP-based conditions */
  condition?: CFTokenCondition;
  /** ISO 8601 timestamp for when token should stop working */
  expires_on?: string;
  /** ISO 8601 timestamp for when token becomes valid */
  not_before?: string;
}

/** Successful token creation response */
export interface CFTokenValue {
  /** The token ID (for management) */
  id: string;
  /** Human-readable name */
  name: string;
  /** The actual bearer token value - USE THIS FOR AUTHORIZATION */
  value: string;
  /** Token status */
  status: 'active' | 'disabled' | 'expired';
  /** When the token was issued */
  issued_on: string;
  /** When the token expires (if set) */
  expires_on?: string;
  /** When the token was last modified */
  modified_on: string;
  /** Policies assigned to this token */
  policies: CFTokenPolicy[];
}

/** Standard Cloudflare API response wrapper */
export interface CFAPIResponse<T> {
  success: boolean;
  errors: Array<{
    code: number;
    message: string;
  }>;
  messages: Array<{
    code: number;
    message: string;
  }>;
  result: T;
}

/** Response from POST /accounts/{account_id}/tokens */
export type CFCreateTokenResponse = CFAPIResponse<CFTokenValue>;

/** Common permission group IDs for Surge Protocol */
export const CF_PERMISSION_GROUPS = {
  /** D1 read access */
  D1_READ: 'd1_databases_read',
  /** D1 write access */
  D1_WRITE: 'd1_databases_write',
  /** Workers read access */
  WORKERS_READ: 'workers_scripts_read',
  /** Workers write access */
  WORKERS_WRITE: 'workers_scripts_write',
  /** KV read access */
  KV_READ: 'workers_kv_storage_read',
  /** KV write access */
  KV_WRITE: 'workers_kv_storage_write',
  /** R2 read access */
  R2_READ: 'workers_r2_storage_read',
  /** R2 write access */
  R2_WRITE: 'workers_r2_storage_write',
  /** Durable Objects read access */
  DURABLE_OBJECTS_READ: 'durable_objects_read',
  /** Durable Objects write access */
  DURABLE_OBJECTS_WRITE: 'durable_objects_write',
} as const;

export type CFPermissionGroupKey = keyof typeof CF_PERMISSION_GROUPS;
