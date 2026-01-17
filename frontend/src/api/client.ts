/**
 * SURGE PROTOCOL - API Client
 * Handles all communication with the Hono backend
 * Includes JWT token management with automatic refresh
 */

import {
  accessToken,
  refreshToken,
  setTokens,
  clearAuth,
  setRefreshing,
  isRefreshing,
} from '@/stores/authStore';

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE = '/api';

// Endpoints that don't require authentication
const PUBLIC_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

// =============================================================================
// ERROR CLASSES
// =============================================================================

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public errors?: Array<{ code: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(401, 'AUTH_ERROR', message);
    this.name = 'AuthError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error') {
    super(message);
    this.name = 'NetworkError';
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errors?: Array<{ code: string; message: string }>;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
  retryOnUnauthorized?: boolean;
}

// =============================================================================
// TOKEN REFRESH
// =============================================================================

let refreshPromise: Promise<boolean> | null = null;

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  // If already refreshing, wait for that promise
  if (refreshPromise) {
    return refreshPromise;
  }

  const currentRefreshToken = refreshToken.value;
  if (!currentRefreshToken) {
    return false;
  }

  setRefreshing(true);

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      if (!response.ok) {
        clearAuth();
        return false;
      }

      const result: ApiResponse<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }> = await response.json();

      if (result.success && result.data) {
        setTokens(result.data);
        return true;
      }

      clearAuth();
      return false;
    } catch {
      clearAuth();
      return false;
    } finally {
      setRefreshing(false);
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// =============================================================================
// REQUEST FUNCTION
// =============================================================================

/**
 * Make an authenticated API request
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    params,
    skipAuth = false,
    retryOnUnauthorized = true,
    ...init
  } = options;

  // Build URL with query params
  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Check if this is a public endpoint
  const isPublicEndpoint = PUBLIC_ENDPOINTS.some((p) => endpoint.startsWith(p));

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  // Add auth header if we have a token and endpoint requires auth
  if (!skipAuth && !isPublicEndpoint && accessToken.value) {
    headers['Authorization'] = `Bearer ${accessToken.value}`;
  }

  // Make the request
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch (error) {
    throw new NetworkError(
      error instanceof Error ? error.message : 'Network request failed'
    );
  }

  // Handle 401 Unauthorized
  if (response.status === 401 && retryOnUnauthorized && !isPublicEndpoint) {
    // Wait for any existing refresh, or try to refresh
    if (!isRefreshing.value) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the request with new token
        return request<T>(endpoint, {
          ...options,
          retryOnUnauthorized: false, // Don't retry again
        });
      }
    }

    // If refresh failed or wasn't possible, throw auth error
    throw new AuthError('Session expired. Please log in again.');
  }

  // Parse response body
  const text = await response.text();
  let result: ApiResponse<T>;

  try {
    result = text ? JSON.parse(text) : { success: true };
  } catch {
    throw new ApiError(
      response.status,
      'PARSE_ERROR',
      'Failed to parse server response'
    );
  }

  // Handle error responses
  if (!response.ok || !result.success) {
    const firstError = result.errors?.[0];
    throw new ApiError(
      response.status,
      firstError?.code || 'UNKNOWN_ERROR',
      firstError?.message || `Request failed: ${response.statusText}`,
      result.errors
    );
  }

  // Return the data
  return result.data as T;
}

// =============================================================================
// API METHODS
// =============================================================================

export const api = {
  /**
   * GET request
   */
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  /**
   * POST request
   */
  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * PATCH request
   */
  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * PUT request
   */
  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * DELETE request
   */
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
