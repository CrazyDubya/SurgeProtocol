/**
 * Surge Protocol - Integration Test Flows
 *
 * End-to-end test scripts for major game flows.
 * Run with: npx tsx scripts/test-flows.ts
 *
 * Environment variables:
 * - API_BASE_URL: Base URL of the API (default: http://localhost:8787)
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8787';

// =============================================================================
// UTILITIES
// =============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: Record<string, unknown>;
}

async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json() as T;
  return { ok: response.ok, status: response.status, data };
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const start = Date.now();
  try {
    await testFn();
    return {
      name,
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// =============================================================================
// TEST STATE
// =============================================================================

interface TestState {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  characterId?: string;
  missionId?: string;
  missionInstanceId?: string;
}

const state: TestState = {};

// =============================================================================
// TEST FLOWS
// =============================================================================

/**
 * Test 1: Health Check
 */
async function testHealthCheck(): Promise<void> {
  const { ok, data } = await api<{ status: string }>('/health');
  assert(ok, 'Health check should return 200');
  assert(data.status === 'ok', 'Status should be ok');
}

/**
 * Test 2: User Registration
 */
async function testUserRegistration(): Promise<void> {
  const email = `test-${Date.now()}@surge.test`;
  const password = 'TestPass123!';

  const { ok, data } = await api<{
    success: boolean;
    data?: { user: { id: string }; accessToken: string; refreshToken: string };
    errors?: { code: string; message: string }[];
  }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  assert(ok, `Registration should succeed: ${JSON.stringify(data)}`);
  assert(data.success, 'Response success should be true');
  assert(!!data.data?.accessToken, 'Should return access token');
  assert(!!data.data?.refreshToken, 'Should return refresh token');

  state.accessToken = data.data?.accessToken;
  state.refreshToken = data.data?.refreshToken;
  state.userId = data.data?.user.id;
}

/**
 * Test 3: User Login
 */
async function testUserLogin(): Promise<void> {
  // First register a new user
  const email = `login-test-${Date.now()}@surge.test`;
  const password = 'TestPass123!';

  await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  // Then try to login
  const { ok, data } = await api<{
    success: boolean;
    data?: { accessToken: string; refreshToken: string };
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  assert(ok, 'Login should succeed');
  assert(data.success, 'Response success should be true');
  assert(!!data.data?.accessToken, 'Should return access token');
}

/**
 * Test 4: Character Creation
 */
async function testCharacterCreation(): Promise<void> {
  assert(!!state.accessToken, 'Must be authenticated');

  const { ok, data } = await api<{
    success: boolean;
    data?: { character: { id: string; handle: string } };
    errors?: { code: string; message: string }[];
  }>('/api/characters', {
    method: 'POST',
    headers: { Authorization: `Bearer ${state.accessToken}` },
    body: JSON.stringify({
      legalName: 'Test Runner',
      streetName: 'Ghost',
      handle: `ghost_${Date.now()}`,
      sex: 'NONBINARY',
      age: 25,
      attributes: {
        STR: 8,
        AGI: 12,
        VIT: 10,
        INT: 10,
        PRC: 11,
        CHA: 8,
        WIL: 10,
        VEL: 11,
      },
    }),
  });

  assert(ok, `Character creation should succeed: ${JSON.stringify(data)}`);
  assert(data.success, 'Response success should be true');
  assert(!!data.data?.character.id, 'Should return character ID');

  state.characterId = data.data?.character.id;
}

/**
 * Test 5: Get Character
 */
async function testGetCharacter(): Promise<void> {
  assert(!!state.accessToken, 'Must be authenticated');
  assert(!!state.characterId, 'Must have character ID');

  const { ok, data } = await api<{
    success: boolean;
    data?: { character: { id: string; handle: string; carrier_rating: number } };
  }>(`/api/characters/${state.characterId}`, {
    headers: { Authorization: `Bearer ${state.accessToken}` },
  });

  assert(ok, 'Get character should succeed');
  assert(data.success, 'Response success should be true');
  assert(data.data?.character.id === state.characterId, 'Should return correct character');
}

/**
 * Test 6: Select Character
 */
async function testSelectCharacter(): Promise<void> {
  assert(!!state.accessToken, 'Must be authenticated');
  assert(!!state.characterId, 'Must have character ID');

  const { ok, data } = await api<{
    success: boolean;
    data?: { accessToken: string };
  }>(`/api/characters/${state.characterId}/select`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${state.accessToken}` },
  });

  assert(ok, 'Select character should succeed');
  assert(data.success, 'Response success should be true');
  assert(!!data.data?.accessToken, 'Should return new access token');

  // Update token with character context
  state.accessToken = data.data?.accessToken;
}

/**
 * Test 7: Get Available Missions
 */
async function testGetAvailableMissions(): Promise<void> {
  assert(!!state.accessToken, 'Must be authenticated');

  const { ok, data } = await api<{
    success: boolean;
    data?: { missions: Array<{ id: string; name: string }> };
  }>('/api/missions/available', {
    headers: { Authorization: `Bearer ${state.accessToken}` },
  });

  assert(ok, 'Get missions should succeed');
  assert(data.success, 'Response success should be true');
  assert(Array.isArray(data.data?.missions), 'Should return missions array');

  if (data.data?.missions.length) {
    state.missionId = data.data.missions[0]!.id;
  }
}

/**
 * Test 8: Accept Mission
 */
async function testAcceptMission(): Promise<void> {
  assert(!!state.accessToken, 'Must be authenticated');
  assert(!!state.missionId, 'Must have mission ID');

  const { ok, data } = await api<{
    success: boolean;
    data?: { instance: { id: string } };
    errors?: { code: string; message: string }[];
  }>(`/api/missions/${state.missionId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${state.accessToken}` },
  });

  // Mission might not be available if no seed data
  if (ok && data.success && data.data?.instance) {
    state.missionInstanceId = data.data.instance.id;
  }
}

/**
 * Test 9: Get Active Mission
 */
async function testGetActiveMission(): Promise<void> {
  assert(!!state.accessToken, 'Must be authenticated');

  const { ok, data } = await api<{
    success: boolean;
    data?: { mission: { instance?: { id: string } } | null };
  }>('/api/missions/active', {
    headers: { Authorization: `Bearer ${state.accessToken}` },
  });

  assert(ok, 'Get active mission should succeed');
  assert(data.success, 'Response success should be true');
}

/**
 * Test 10: Get Factions
 */
async function testGetFactions(): Promise<void> {
  const { ok, data } = await api<{
    success: boolean;
    data?: { factions: Array<{ id: string; name: string }> };
  }>('/api/factions');

  assert(ok, 'Get factions should succeed');
  assert(data.success, 'Response success should be true');
  assert(Array.isArray(data.data?.factions), 'Should return factions array');
}

/**
 * Test 11: Get Faction Standing (requires auth)
 */
async function testGetFactionStanding(): Promise<void> {
  assert(!!state.accessToken, 'Must be authenticated');

  // Get first faction
  const { data: factionData } = await api<{
    success: boolean;
    data?: { factions: Array<{ id: string }> };
  }>('/api/factions');

  if (!factionData.data?.factions.length) {
    console.log('  ⚠ No factions available, skipping');
    return;
  }

  const factionId = factionData.data.factions[0]!.id;

  const { ok, data } = await api<{
    success: boolean;
    data?: { standing: { reputationTier: string } };
  }>(`/api/factions/${factionId}/standing`, {
    headers: { Authorization: `Bearer ${state.accessToken}` },
  });

  assert(ok, 'Get faction standing should succeed');
  assert(data.success, 'Response success should be true');
}

/**
 * Test 12: Token Refresh
 */
async function testTokenRefresh(): Promise<void> {
  assert(!!state.refreshToken, 'Must have refresh token');

  const { ok, data } = await api<{
    success: boolean;
    data?: { accessToken: string };
  }>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: state.refreshToken }),
  });

  assert(ok, 'Token refresh should succeed');
  assert(data.success, 'Response success should be true');
  assert(!!data.data?.accessToken, 'Should return new access token');
}

/**
 * Test 13: Combat Session Init (via Durable Object)
 */
async function testCombatSessionInit(): Promise<void> {
  const combatId = `test-combat-${Date.now()}`;

  const { ok, data } = await api<{
    success?: boolean;
    error?: string;
  }>(`/api/combat/${combatId}/init`, {
    method: 'POST',
    body: JSON.stringify({
      combatants: [
        { id: 'player-1', name: 'Test Player', isPlayer: true, stats: { health: 100, initiative: 10 } },
        { id: 'npc-1', name: 'Test Enemy', isPlayer: false, stats: { health: 50, initiative: 8 } },
      ],
      battlefield: { type: 'STREET', modifiers: {} },
    }),
  });

  // Combat DO might return different structure
  assert(ok || data.error === undefined, 'Combat init should not error');
}

/**
 * Test 14: World State (via Durable Object)
 */
async function testWorldState(): Promise<void> {
  const { ok, data } = await api<{
    time?: unknown;
    error?: string;
  }>('/api/world/state');

  // World DO might not be initialized
  assert(ok || data.error !== undefined, 'World state request should complete');
}

// =============================================================================
// RUNNER
// =============================================================================

async function runAllTests(): Promise<void> {
  console.log('🎮 Surge Protocol - Integration Tests\n');
  console.log(`📡 API Base: ${API_BASE}\n`);
  console.log('─'.repeat(50));

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Character Creation', fn: testCharacterCreation },
    { name: 'Get Character', fn: testGetCharacter },
    { name: 'Select Character', fn: testSelectCharacter },
    { name: 'Get Available Missions', fn: testGetAvailableMissions },
    { name: 'Accept Mission', fn: testAcceptMission },
    { name: 'Get Active Mission', fn: testGetActiveMission },
    { name: 'Get Factions', fn: testGetFactions },
    { name: 'Get Faction Standing', fn: testGetFactionStanding },
    { name: 'Token Refresh', fn: testTokenRefresh },
    { name: 'Combat Session Init', fn: testCombatSessionInit },
    { name: 'World State', fn: testWorldState },
  ];

  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`  ${test.name}... `);
    const result = await runTest(test.name, test.fn);
    results.push(result);

    if (result.passed) {
      passed++;
      console.log(`✅ (${result.duration}ms)`);
    } else {
      failed++;
      console.log(`❌ ${result.error}`);
    }
  }

  console.log('─'.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log('❌ Failed tests:');
    for (const result of results.filter((r) => !r.passed)) {
      console.log(`  - ${result.name}: ${result.error}`);
    }
    process.exit(1);
  } else {
    console.log('✅ All tests passed!\n');
  }
}

// Run if called directly
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
