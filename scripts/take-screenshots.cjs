/**
 * Dashboard & Subscreen Screenshot Script
 *
 * Uses Playwright to capture screenshots of all application pages
 * by mocking the API layer with rich game data.
 *
 * Usage: TMPDIR=.chrome-tmp node scripts/take-screenshots.cjs
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:3002';
const MOCKUP_DIR = path.join(__dirname, '..', 'frontend', 'screens');

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_CHARACTER_ID = 'char_01abc123def456';
const MOCK_USER_ID = 'usr_01xyz789ghi012';

const mockCharacterDetail = {
  id: MOCK_CHARACTER_ID,
  user_id: MOCK_USER_ID,
  legal_name: 'Marcus Chen',
  street_name: 'Ghost',
  handle: 'Ghost',
  omni_deliver_id: 'OD-7742-GHOST',
  current_tier: 3,
  carrier_rating: 127.4,
  current_xp: 1240,
  current_health: 72,
  max_health: 82,
  current_humanity: 85,
  max_humanity: 100,
  is_active: true,
  is_dead: false,
  created_at: '2026-01-15T08:00:00Z',
  updated_at: '2026-02-13T01:00:00Z',
};

const mockCharacterStats = {
  attributes: { STR: 6, AGI: 8, VIT: 5, INT: 7, PRC: 7, CHA: 5, WIL: 6, VEL: 9 },
  skills: { FIREARMS: 3, MELEE: 2, STEALTH: 5, HACKING: 4, ENGINEERING: 3, MEDICINE: 1, PERSUASION: 2, INTIMIDATION: 3, STREETWISE: 6, DRIVING: 7, ATHLETICS: 4 },
  rating: { current: 127.4, tier: 3, totalDeliveries: 89 },
  equipped: [
    { slot: 'HEAD', itemId: 'item_01', itemName: 'Neural Interface Mk.II', itemType: 'AUGMENTATION', rarity: 'RARE' },
    { slot: 'TORSO', itemId: 'item_02', itemName: 'Reinforced Courier Vest', itemType: 'ARMOR', rarity: 'UNCOMMON' },
    { slot: 'LEGS', itemId: 'item_03', itemName: 'Sprint Augment Boots', itemType: 'AUGMENTATION', rarity: 'COMMON' },
    { slot: 'WEAPON', itemId: 'item_04', itemName: 'Stun Baton', itemType: 'WEAPON', rarity: 'COMMON' },
    { slot: 'GADGET', itemId: 'item_05', itemName: 'EMP Grenade x3', itemType: 'CONSUMABLE', rarity: 'UNCOMMON' },
  ],
  conditions: [
    { id: 'cond_01', conditionId: 'STIM_BOOST', name: 'Stim Boost', effectDescription: '+2 VEL for 30 minutes', stackCount: 1, isActive: true, expiresAt: '2026-02-13T02:00:00Z' },
  ],
};

const mockFactions = [
  { factionId: 'fac_01', name: 'OmniDeliver Corp', factionType: 'CORPORATE', reputation: 420, tier: 'TRUSTED', isMember: true },
  { factionId: 'fac_02', name: 'Chrome Saints', factionType: 'GANG', reputation: 180, tier: 'NEUTRAL', isMember: false },
  { factionId: 'fac_03', name: 'Red Tide Syndicate', factionType: 'SYNDICATE', reputation: -50, tier: 'HOSTILE', isMember: false },
  { factionId: 'fac_04', name: 'Neon Dragons', factionType: 'GANG', reputation: 90, tier: 'WARY', isMember: false },
  { factionId: 'fac_05', name: 'The Collective', factionType: 'UNDERGROUND', reputation: 310, tier: 'ALLIED', isMember: true },
  { factionId: 'fac_06', name: 'Nightmarket Union', factionType: 'TRADE_GUILD', reputation: 250, tier: 'FRIENDLY', isMember: false },
];

const mockAvailableMissions = [
  { id: 'mis_01', name: 'Medical Run to Hollows Clinic', description: "Transport critical medical supplies to Dr. Chen's clinic in The Hollows. Time-sensitive.", type: 'STANDARD', difficulty: 'MEDIUM', riskLevel: 'LOW', tierRequired: 2, ratingRequired: 50, timeLimit: 45, baseCredits: 350, baseXp: 120, baseReputation: 15 },
  { id: 'mis_02', name: 'Contraband Drop - Sector 7', description: 'Pick up an unmarked package from the docks and deliver to Sector 7. No questions asked.', type: 'CONTRABAND', difficulty: 'HARD', riskLevel: 'HIGH', tierRequired: 3, ratingRequired: 100, timeLimit: 30, baseCredits: 800, baseXp: 250, baseReputation: -10 },
  { id: 'mis_03', name: 'Express Corporate Courier', description: 'Rush delivery of encrypted data drives to Axiom Tower. Corporate clearance required.', type: 'EXPRESS', difficulty: 'EASY', riskLevel: 'MINIMAL', tierRequired: 1, baseCredits: 150, baseXp: 60, baseReputation: 20 },
  { id: 'mis_04', name: 'Hazmat Recovery - Old Tunnels', description: 'Retrieve contaminated samples from abandoned subway tunnels beneath Red Harbor.', type: 'HAZMAT', difficulty: 'EXTREME', riskLevel: 'EXTREME', tierRequired: 3, ratingRequired: 120, timeLimit: 60, baseCredits: 1200, baseXp: 400, baseReputation: 30 },
  { id: 'mis_05', name: 'Fragile Art Transport', description: 'Move a priceless pre-Collapse painting from Gallery Noir to Uptown. Handle with extreme care.', type: 'FRAGILE', difficulty: 'MEDIUM', riskLevel: 'MODERATE', tierRequired: 2, ratingRequired: 80, timeLimit: 90, baseCredits: 500, baseXp: 150, baseReputation: 25 },
];

const mockActiveMission = {
  instance: { id: 'inst_01', missionId: 'mis_active_01', characterId: MOCK_CHARACTER_ID, status: 'ACTIVE', startedAt: '2026-02-13T00:45:00Z', expiresAt: new Date(Date.now() + 14 * 60 * 1000 + 32 * 1000).toISOString() },
  definition: { id: 'mis_active_01', name: 'Secure Package to Nightmarket', description: 'Deliver a sealed titanium case to a Nightmarket contact. Contents unknown. Armed escorts may intercept.', type: 'SECURE', difficulty: 'HARD', riskLevel: 'HIGH', tierRequired: 3, ratingRequired: 100, timeLimit: 30, baseCredits: 650, baseXp: 200, baseReputation: 20 },
  checkpoints: [
    { id: 'cp_01', name: 'Pickup Package', description: 'Collect the sealed case from the dead drop', sequenceOrder: 1, isCompleted: true, completedAt: '2026-02-13T00:47:00Z' },
    { id: 'cp_02', name: 'Evade Patrol Zone', description: 'Navigate through OmniDeliver patrol zone', sequenceOrder: 2, isCompleted: true, completedAt: '2026-02-13T00:52:00Z' },
    { id: 'cp_03', name: 'Cross The Hollows', description: 'Travel through The Hollows district', sequenceOrder: 3, isCompleted: false },
    { id: 'cp_04', name: 'Deliver to Contact', description: 'Hand off the case to the Nightmarket contact', sequenceOrder: 4, isCompleted: false },
  ],
  progress: 50,
};

const mockInventory = {
  inventory: [
    { id: 'inv_01', itemId: 'item_10', name: 'Neural Interface Mk.II', description: 'Enhanced neural link for faster data processing', itemType: 'AUGMENTATION', rarity: 'RARE', quantity: 1, weight: 0.5, baseValue: 2500, condition: 95, maxCondition: 100, isEquipped: true, equippedSlot: 'HEAD' },
    { id: 'inv_02', itemId: 'item_11', name: 'Reinforced Courier Vest', description: 'Ballistic-rated vest for delivery couriers', itemType: 'ARMOR', rarity: 'UNCOMMON', quantity: 1, weight: 3.2, baseValue: 800, condition: 78, maxCondition: 100, isEquipped: true, equippedSlot: 'TORSO' },
    { id: 'inv_03', itemId: 'item_12', name: 'Stun Baton', description: 'Non-lethal electroshock weapon', itemType: 'WEAPON', rarity: 'COMMON', quantity: 1, weight: 1.5, baseValue: 200, condition: 60, maxCondition: 100, isEquipped: true, equippedSlot: 'WEAPON' },
    { id: 'inv_04', itemId: 'item_13', name: 'EMP Grenade', description: 'Disables electronics in 5m radius', itemType: 'CONSUMABLE', rarity: 'UNCOMMON', quantity: 3, maxStack: 5, weight: 0.3, baseValue: 150, isEquipped: false },
    { id: 'inv_05', itemId: 'item_14', name: 'Medkit', description: 'Standard field medical kit. Restores 25 HP.', itemType: 'CONSUMABLE', rarity: 'COMMON', quantity: 2, maxStack: 5, weight: 0.8, baseValue: 50, isEquipped: false },
    { id: 'inv_06', itemId: 'item_15', name: 'Lockpick Set', description: 'Electronic lockpick tools. +3 to hacking checks.', itemType: 'TOOL', rarity: 'UNCOMMON', quantity: 1, weight: 0.2, baseValue: 300, condition: 90, maxCondition: 100, isEquipped: false },
    { id: 'inv_07', itemId: 'item_16', name: 'Synth-Stim Injector', description: '+2 to all physical attributes for 10 min', itemType: 'CONSUMABLE', rarity: 'RARE', quantity: 1, maxStack: 3, weight: 0.1, baseValue: 500, isEquipped: false },
    { id: 'inv_08', itemId: 'item_17', name: 'Encrypted Data Chip', description: 'Unknown encrypted data. Might be valuable.', itemType: 'QUEST_ITEM', rarity: 'RARE', quantity: 1, weight: 0.01, baseValue: 0, isEquipped: false },
  ],
  capacity: { used: 8.61, max: 25 },
  finances: { credits: 2847, creditsLifetime: 14520, escrowHeld: 325 },
};

const mockWarData = {
  activeWars: [
    { id: 'war_01', attackerFaction: 'Chrome Saints', defenderFaction: 'Red Tide Syndicate', territory: 'Red Harbor Docks', status: 'ACTIVE', startedAt: '2026-02-12T18:00:00Z', attackerScore: 1250, defenderScore: 980 },
    { id: 'war_02', attackerFaction: 'Neon Dragons', defenderFaction: 'The Collective', territory: 'Neon Row', status: 'ACTIVE', startedAt: '2026-02-13T00:00:00Z', attackerScore: 450, defenderScore: 620 },
  ],
  territories: [
    { id: 'terr_01', name: 'The Hollows', controlledBy: 'Chrome Saints', stability: 72 },
    { id: 'terr_02', name: 'Red Harbor', controlledBy: 'Red Tide Syndicate', stability: 45 },
    { id: 'terr_03', name: 'Uptown Corporate', controlledBy: 'OmniDeliver Corp', stability: 95 },
    { id: 'terr_04', name: 'Neon Row', controlledBy: 'CONTESTED', stability: 20 },
    { id: 'terr_05', name: 'The Undercity', controlledBy: 'The Collective', stability: 60 },
  ],
};

// ============================================================================
// API MOCK HANDLER
// ============================================================================

function mockResponse(data) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) };
}

function setupApiMocks(page) {
  // Use a single route handler to avoid matching Vite source files like /src/api/*.ts
  // Only intercept requests to the actual backend API proxy (path starts with /api/)
  page.route(url => {
    const u = new URL(url);
    return u.pathname.startsWith('/api/');
  }, async (route) => {
    const url = route.request().url();
    const p = new URL(url).pathname;

    // Character endpoints
    if (p.includes('/api/characters/')) {
      if (p.includes('/stats')) return route.fulfill(mockResponse(mockCharacterStats));
      if (p.includes('/factions')) return route.fulfill(mockResponse({ factions: mockFactions }));
      if (p.includes('/inventory')) return route.fulfill(mockResponse(mockInventory));
      return route.fulfill(mockResponse({ character: mockCharacterDetail }));
    }
    // Mission endpoints
    if (p.includes('/api/missions/available')) return route.fulfill(mockResponse({ missions: mockAvailableMissions, canAcceptNew: false, currentTier: 3 }));
    if (p.includes('/api/missions/active')) return route.fulfill(mockResponse({ mission: mockActiveMission }));
    if (p.includes('/api/missions')) return route.fulfill(mockResponse({ missions: [], pagination: { limit: 20, offset: 0, total: 0 } }));
    // Algorithm
    if (p.includes('/api/algorithm')) return route.fulfill(mockResponse({ messages: [] }));
    // Factions
    if (p.includes('/api/factions')) return route.fulfill(mockResponse({ factions: mockFactions, wars: mockWarData.activeWars }));
    // Wars
    if (p.includes('/api/wars')) return route.fulfill(mockResponse(mockWarData));
    // Economy
    if (p.includes('/api/economy')) return route.fulfill(mockResponse({ wallet: { credits: 2847, escrow: 325 }, recentTransactions: [] }));
    // Auth refresh
    if (p.includes('/api/auth/refresh')) return route.fulfill(mockResponse({ accessToken: 'mock-refreshed', refreshToken: 'mock-refreshed', expiresIn: 3600 }));
    // Catch-all for /api/*
    return route.fulfill(mockResponse({}));
  });

  // Block WebSocket connections
  page.route('**/ws/**', (route) => route.abort('connectionrefused'));
}

function setAuth(page) {
  return page.evaluate(() => {
    localStorage.setItem('surge_access_token', 'mock-jwt-access-token');
    localStorage.setItem('surge_refresh_token', 'mock-jwt-refresh-token');
    localStorage.setItem('surge_user', JSON.stringify({ id: 'usr_01xyz789ghi012', email: 'ghost@surgeprotocol.io', createdAt: '2026-01-15T08:00:00Z' }));
    localStorage.setItem('surge_character_id', 'char_01abc123def456');
  });
}

// ============================================================================
// SCREENSHOT HELPERS
// ============================================================================

async function capture(page, url, name, opts = {}) {
  console.log(`  Capturing: ${name}...`);
  try {
    await page.goto(url, { waitUntil: opts.waitUntil || 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(opts.delay || 3000);
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    const size = fs.statSync(filePath).size;
    console.log(`  + ${name}.png (${(size / 1024).toFixed(1)}KB)`);
    return true;
  } catch (err) {
    console.error(`  x Failed: ${name}: ${err.message}`);
    return false;
  }
}

// ============================================================================
// MAIN
// ============================================================================

const ARGS = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-software-rasterizer', '--disable-dev-shm-usage'];

(async () => {
  console.log('SURGE PROTOCOL - Dashboard Screenshot Capture');
  console.log('==============================================\n');

  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  let success = 0, failed = 0;

  // PART 1: HTML Mockups
  console.log('-- Part 1: HTML Design Mockups --');
  {
    const browser = await chromium.launch({ headless: true, args: [...ARGS, '--single-process', '--no-zygote'] });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });

    const mockups = [
      ['dashboard.html', 'mockup-dashboard'],
      ['character-detail.html', 'mockup-character-detail'],
      ['inventory.html', 'mockup-inventory'],
      ['missions.html', 'mockup-missions'],
      ['package-manifest.html', 'mockup-package-manifest'],
    ];
    for (const [file, name] of mockups) {
      const ok = await capture(page, `file://${path.join(MOCKUP_DIR, file)}`, name, { waitUntil: 'networkidle', delay: 1000 });
      ok ? success++ : failed++;
    }
    await browser.close();
  }
  console.log('');

  // PART 2: Live App - Public Pages
  console.log('-- Part 2: Live App - Public Pages --');
  {
    const browser = await chromium.launch({ headless: true, args: ARGS });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    setupApiMocks(page);

    for (const [route, name] of [['/login', 'app-login'], ['/register', 'app-register']]) {
      const ok = await capture(page, `${FRONTEND_URL}${route}`, name);
      ok ? success++ : failed++;
    }
    await browser.close();
  }
  console.log('');

  // PART 3: Live App - Protected Pages
  console.log('-- Part 3: Live App - Protected Game Pages --');
  {
    const browser = await chromium.launch({ headless: true, args: ARGS });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    setupApiMocks(page);

    // Set auth first
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await setAuth(page);

    const pages = [
      ['/', 'app-dashboard'],
      ['/missions', 'app-missions'],
      ['/character', 'app-character'],
      ['/inventory', 'app-inventory'],
      ['/factions', 'app-factions'],
      ['/war', 'app-war-theater'],
      ['/algorithm', 'app-algorithm'],
    ];
    for (const [route, name] of pages) {
      const ok = await capture(page, `${FRONTEND_URL}${route}`, name);
      ok ? success++ : failed++;
    }
    await browser.close();
  }
  console.log('');

  // PART 4: Mobile Views
  console.log('-- Part 4: Mobile Views --');
  {
    const browser = await chromium.launch({ headless: true, args: ARGS });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    setupApiMocks(page);

    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await setAuth(page);

    for (const [route, name] of [['/', 'mobile-dashboard'], ['/missions', 'mobile-missions'], ['/character', 'mobile-character']]) {
      const ok = await capture(page, `${FRONTEND_URL}${route}`, name);
      ok ? success++ : failed++;
    }
    await browser.close();
  }

  console.log('\n==============================================');
  console.log(`Results: ${success} captured, ${failed} failed`);
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
})().catch(err => { console.error('Fatal:', err); process.exit(1); });
