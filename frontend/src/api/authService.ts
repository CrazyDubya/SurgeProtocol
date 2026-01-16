/**
 * Auth Service - Authentication API endpoints
 */

import { api } from './client';
import {
  authStore,
  type User,
  type Character,
} from '@/stores/authStore';

// =============================================================================
// TYPES
// =============================================================================

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword?: string;
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface CharacterListResponse {
  characters: Character[];
  count: number;
}

interface SelectCharacterResponse {
  characterId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// =============================================================================
// SERVICE
// =============================================================================

export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<void> {
    authStore.setLoading(true);
    authStore.setAuthError(null);

    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);

      authStore.setUser(response.user);
      authStore.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresIn: response.expiresIn,
      });

      // Fetch characters after login
      await this.fetchCharacters();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      authStore.setAuthError(message);
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  },

  /**
   * Register a new account
   */
  async register(data: RegisterRequest): Promise<void> {
    authStore.setLoading(true);
    authStore.setAuthError(null);

    try {
      const response = await api.post<LoginResponse>('/auth/register', {
        email: data.email,
        password: data.password,
      });

      authStore.setUser(response.user);
      authStore.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresIn: response.expiresIn,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      authStore.setAuthError(message);
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  },

  /**
   * Logout - clear tokens and redirect
   */
  async logout(): Promise<void> {
    try {
      // Try to invalidate session on server
      await api.post('/auth/logout', {}, { skipAuth: false });
    } catch {
      // Ignore errors - we'll clear local state anyway
    } finally {
      authStore.clearAuth();
    }
  },

  /**
   * Fetch user's characters
   */
  async fetchCharacters(): Promise<Character[]> {
    try {
      const response = await api.get<CharacterListResponse>('/characters');
      authStore.setCharacters(response.characters);
      return response.characters;
    } catch (error) {
      console.error('Failed to fetch characters:', error);
      return [];
    }
  },

  /**
   * Select a character as active
   */
  async selectCharacter(characterId: string): Promise<void> {
    authStore.setLoading(true);

    try {
      const response = await api.post<SelectCharacterResponse>(
        `/characters/${characterId}/select`
      );

      authStore.setActiveCharacter(characterId, {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresIn: response.expiresIn,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to select character';
      authStore.setAuthError(message);
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  },

  /**
   * Check if session is valid (used on app init)
   */
  async validateSession(): Promise<boolean> {
    if (!authStore.accessToken.value) {
      return false;
    }

    try {
      // Try to fetch characters - this will validate the token
      await this.fetchCharacters();
      return true;
    } catch {
      authStore.clearAuth();
      return false;
    }
  },
};

export default authService;
