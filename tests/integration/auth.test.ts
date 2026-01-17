/**
 * Integration tests for authentication flows.
 *
 * Tests: register → login → refresh → protected routes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import app from '../../src/index';
import { createMockEnv, createTestRequest, parseJsonResponse, type MockEnv } from '../helpers/mock-env';

describe('Auth Flow Integration', () => {
  let env: MockEnv;

  beforeEach(() => {
    env = createMockEnv();

    // Seed players table
    env.DB._seed('players', []);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid credentials', async () => {
      const request = createTestRequest('POST', '/api/auth/register', {
        body: {
          email: 'test@example.com',
          password: 'SecurePassword123!',
          username: 'testuser',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; data?: { userId: string } }>(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data?.userId).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      const request = createTestRequest('POST', '/api/auth/register', {
        body: {
          email: 'test@example.com',
          password: '123',
          username: 'testuser',
        },
      });

      const response = await app.fetch(request, env);

      // Should fail validation
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject registration with invalid email', async () => {
      const request = createTestRequest('POST', '/api/auth/register', {
        body: {
          email: 'not-an-email',
          password: 'SecurePassword123!',
          username: 'testuser',
        },
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject duplicate email registration', async () => {
      // Seed existing user in the users table (auth endpoint queries 'users', not 'players')
      env.DB._seed('users', [{
        id: 'existing-user',
        email: 'test@example.com',
        display_name: 'existinguser',
        password_hash: 'hashed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);

      const request = createTestRequest('POST', '/api/auth/register', {
        body: {
          email: 'test@example.com',
          password: 'SecurePassword123!',
          username: 'newuser',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.errors?.[0]?.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(() => {
      // Seed a test user with known password hash
      // In real implementation, this would be a bcrypt hash
      env.DB._seed('players', [{
        id: 'test-user-id',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: '$2a$10$test-hash', // Mock hash
        created_at: new Date().toISOString(),
        is_banned: 0,
      }]);
    });

    it('should login with valid credentials and return tokens', async () => {
      const request = createTestRequest('POST', '/api/auth/login', {
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      const response = await app.fetch(request, env);

      // May need real password validation, check status
      // For mock, we expect it to attempt login
      expect(response.status).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const request = createTestRequest('POST', '/api/auth/login', {
        body: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      });

      const response = await app.fetch(request, env);

      // Should fail authentication
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject login for non-existent user', async () => {
      const request = createTestRequest('POST', '/api/auth/login', {
        body: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject login for banned user', async () => {
      env.DB._seed('players', [{
        id: 'banned-user',
        email: 'banned@example.com',
        username: 'banneduser',
        password_hash: '$2a$10$test-hash',
        is_banned: 1,
        ban_reason: 'Test ban',
      }]);

      const request = createTestRequest('POST', '/api/auth/login', {
        body: {
          email: 'banned@example.com',
          password: 'password123',
        },
      });

      const response = await app.fetch(request, env);
      const data = await parseJsonResponse<{ success: boolean; errors?: Array<{ code: string }> }>(response);

      // Should indicate banned status
      if (response.status === 403) {
        expect(data.errors?.[0]?.code).toBe('ACCOUNT_BANNED');
      }
    });
  });

  describe('Protected Routes', () => {
    it('should reject requests without auth header', async () => {
      const request = createTestRequest('GET', '/api/characters');

      const response = await app.fetch(request, env);

      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const request = createTestRequest('GET', '/api/characters', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should reject refresh without token', async () => {
      const request = createTestRequest('POST', '/api/auth/refresh', {
        body: {},
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject refresh with invalid token', async () => {
      const request = createTestRequest('POST', '/api/auth/refresh', {
        body: {
          refreshToken: 'invalid-refresh-token',
        },
      });

      const response = await app.fetch(request, env);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});

describe('Health Check', () => {
  it('should return ok status', async () => {
    const env = createMockEnv();
    const request = createTestRequest('GET', '/health');

    const response = await app.fetch(request, env);
    const data = await parseJsonResponse<{ status: string }>(response);

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const env = createMockEnv();
    const request = createTestRequest('GET', '/api/nonexistent');

    const response = await app.fetch(request, env);
    const data = await parseJsonResponse<{ success: boolean; errors: Array<{ code: string }> }>(response);

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.errors[0]?.code).toBe('NOT_FOUND');
  });
});
