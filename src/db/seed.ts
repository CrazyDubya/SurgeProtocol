/**
 * Surge Protocol - Database Seed Data
 *
 * Provides initial game data for development and testing.
 * Run via wrangler d1 execute or as part of deployment.
 */

import { nanoid } from 'nanoid';
import { GameCache } from '../cache';

// =============================================================================
// TYPES
// =============================================================================

interface SeedResult {
  table: string;
  inserted: number;
  errors: string[];
}

// =============================================================================
// SEED DATA
// =============================================================================

// Factions
const FACTIONS = [
  {
    id: nanoid(),
    code: 'OMNIDELIVER',
    name: 'OmniDeliver Corporation',
    faction_type: 'CORPORATION',
    description: 'The megacorp that runs the delivery network. Your employer.',
    philosophy: 'Efficiency above all. The Algorithm knows best.',
    is_joinable: 0,
    is_hostile_default: 0,
  },
  {
    id: nanoid(),
    code: 'CHROME_RUNNERS',
    name: 'Chrome Runners',
    faction_type: 'GANG',
    description: 'Street-level couriers who reject corporate control.',
    philosophy: 'Freedom on the streets. No masters, no algorithms.',
    is_joinable: 1,
    is_hostile_default: 0,
  },
  {
    id: nanoid(),
    code: 'NEON_SAINTS',
    name: 'The Neon Saints',
    faction_type: 'SYNDICATE',
    description: 'A powerful crime syndicate controlling the underground economy.',
    philosophy: 'Loyalty is everything. Family protects family.',
    is_joinable: 1,
    is_hostile_default: 0,
  },
  {
    id: nanoid(),
    code: 'CIRCUIT_BREAKERS',
    name: 'Circuit Breakers',
    faction_type: 'UNDERGROUND',
    description: 'Hacktivist collective fighting corporate surveillance.',
    philosophy: 'Information wants to be free. Break the chains.',
    is_joinable: 1,
    is_hostile_default: 0,
  },
  {
    id: nanoid(),
    code: 'IRON_DRAGONS',
    name: 'Iron Dragons',
    faction_type: 'GANG',
    description: 'Augment-heavy enforcers controlling the industrial district.',
    philosophy: 'Strength through chrome. Weakness is death.',
    is_joinable: 1,
    is_hostile_default: 1,
  },
  {
    id: nanoid(),
    code: 'CIVIC_GUARD',
    name: 'Civic Guard',
    faction_type: 'GOVERNMENT',
    description: 'What remains of public law enforcement.',
    philosophy: 'Order through force. Compliance is survival.',
    is_joinable: 0,
    is_hostile_default: 0,
  },
];

// Attributes
const ATTRIBUTES = [
  { id: nanoid(), code: 'STR', name: 'Strength', description: 'Physical power and melee damage', category: 'PHYSICAL' },
  { id: nanoid(), code: 'AGI', name: 'Agility', description: 'Speed, reflexes, and evasion', category: 'PHYSICAL' },
  { id: nanoid(), code: 'VIT', name: 'Vitality', description: 'Health and endurance', category: 'PHYSICAL' },
  { id: nanoid(), code: 'INT', name: 'Intelligence', description: 'Technical skill and hacking', category: 'MENTAL' },
  { id: nanoid(), code: 'PRC', name: 'Perception', description: 'Awareness and accuracy', category: 'MENTAL' },
  { id: nanoid(), code: 'CHA', name: 'Charisma', description: 'Social influence and negotiation', category: 'SOCIAL' },
  { id: nanoid(), code: 'WIL', name: 'Willpower', description: 'Mental fortitude and humanity', category: 'MENTAL' },
  { id: nanoid(), code: 'VEL', name: 'Velocity', description: 'Movement speed and initiative', category: 'PHYSICAL' },
];

// Skills
const SKILLS = [
  // Combat
  { id: nanoid(), code: 'FIREARMS', name: 'Firearms', category: 'COMBAT', governing_attribute: 'PRC' },
  { id: nanoid(), code: 'MELEE', name: 'Melee Combat', category: 'COMBAT', governing_attribute: 'STR' },
  { id: nanoid(), code: 'EVASION', name: 'Evasion', category: 'COMBAT', governing_attribute: 'AGI' },
  { id: nanoid(), code: 'HEAVY_WEAPONS', name: 'Heavy Weapons', category: 'COMBAT', governing_attribute: 'STR' },

  // Technical
  { id: nanoid(), code: 'HACKING', name: 'Hacking', category: 'TECHNICAL', governing_attribute: 'INT' },
  { id: nanoid(), code: 'ELECTRONICS', name: 'Electronics', category: 'TECHNICAL', governing_attribute: 'INT' },
  { id: nanoid(), code: 'MECHANICS', name: 'Mechanics', category: 'TECHNICAL', governing_attribute: 'INT' },
  { id: nanoid(), code: 'CYBERTECH', name: 'Cybertech', category: 'TECHNICAL', governing_attribute: 'INT' },

  // Physical
  { id: nanoid(), code: 'ATHLETICS', name: 'Athletics', category: 'PHYSICAL', governing_attribute: 'AGI' },
  { id: nanoid(), code: 'STEALTH', name: 'Stealth', category: 'PHYSICAL', governing_attribute: 'AGI' },
  { id: nanoid(), code: 'DRIVING', name: 'Driving', category: 'PHYSICAL', governing_attribute: 'VEL' },
  { id: nanoid(), code: 'PARKOUR', name: 'Parkour', category: 'PHYSICAL', governing_attribute: 'AGI' },

  // Social
  { id: nanoid(), code: 'NEGOTIATION', name: 'Negotiation', category: 'SOCIAL', governing_attribute: 'CHA' },
  { id: nanoid(), code: 'INTIMIDATION', name: 'Intimidation', category: 'SOCIAL', governing_attribute: 'CHA' },
  { id: nanoid(), code: 'STREETWISE', name: 'Streetwise', category: 'SOCIAL', governing_attribute: 'CHA' },
  { id: nanoid(), code: 'DECEPTION', name: 'Deception', category: 'SOCIAL', governing_attribute: 'CHA' },
];

// Tier definitions
const TIERS = [
  { tier_number: 1, name: 'Newbie', xp_required: 0, rating_min: 0, rating_max: 50, base_pay_multiplier: 1.0 },
  { tier_number: 2, name: 'Runner', xp_required: 100, rating_min: 40, rating_max: 60, base_pay_multiplier: 1.2 },
  { tier_number: 3, name: 'Carrier', xp_required: 300, rating_min: 55, rating_max: 70, base_pay_multiplier: 1.5 },
  { tier_number: 4, name: 'Courier', xp_required: 600, rating_min: 65, rating_max: 80, base_pay_multiplier: 1.8 },
  { tier_number: 5, name: 'Elite', xp_required: 1000, rating_min: 75, rating_max: 90, base_pay_multiplier: 2.2 },
  { tier_number: 6, name: 'Ace', xp_required: 1500, rating_min: 85, rating_max: 95, base_pay_multiplier: 2.7 },
  { tier_number: 7, name: 'Legend', xp_required: 2200, rating_min: 90, rating_max: 100, base_pay_multiplier: 3.5 },
  { tier_number: 8, name: 'Icon', xp_required: 3000, rating_min: 95, rating_max: 100, base_pay_multiplier: 4.5 },
  { tier_number: 9, name: 'Mythic', xp_required: 4000, rating_min: 98, rating_max: 100, base_pay_multiplier: 6.0 },
  { tier_number: 10, name: 'Transcendent', xp_required: 5500, rating_min: 100, rating_max: 100, base_pay_multiplier: 10.0 },
];

// Mission definitions
const MISSIONS = [
  // Tier 1 missions
  {
    id: nanoid(),
    code: 'BASIC_DELIVERY',
    name: 'Standard Package Delivery',
    mission_type: 'STANDARD',
    tier_minimum: 1,
    tier_maximum: 3,
    description: 'Deliver a package across the district. Simple and straightforward.',
    briefing_text: 'Package ready for pickup. Destination marked on your HUD. Don\'t be late.',
    base_credits: 50,
    base_xp: 15,
    time_limit_minutes: 30,
    cargo_type: 'STANDARD',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'EXPRESS_RUN',
    name: 'Express Delivery',
    mission_type: 'EXPRESS',
    tier_minimum: 1,
    tier_maximum: 4,
    description: 'Time-critical delivery. Speed is everything.',
    briefing_text: 'Client needs this yesterday. Bonus for early delivery, penalty for late.',
    base_credits: 80,
    base_xp: 25,
    time_limit_minutes: 15,
    cargo_type: 'STANDARD',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'FRAGILE_PACKAGE',
    name: 'Fragile Cargo',
    mission_type: 'STANDARD',
    tier_minimum: 2,
    tier_maximum: 5,
    description: 'Handle with extreme care. Package damage will tank your rating.',
    briefing_text: 'Sensitive electronics. One scratch and you\'re paying for it.',
    base_credits: 100,
    base_xp: 30,
    time_limit_minutes: 45,
    cargo_type: 'FRAGILE',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'HAZMAT_HAUL',
    name: 'Hazardous Materials Transport',
    mission_type: 'HAZMAT',
    tier_minimum: 3,
    tier_maximum: 6,
    description: 'Chemical or biological cargo. Safety protocols required.',
    briefing_text: 'Don\'t open the container. Don\'t ask questions. Just deliver.',
    base_credits: 200,
    base_xp: 50,
    time_limit_minutes: 60,
    cargo_type: 'HAZMAT',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'COVERT_DROP',
    name: 'Discrete Delivery',
    mission_type: 'COVERT',
    tier_minimum: 3,
    tier_maximum: 7,
    description: 'Off-the-books delivery. Avoid all surveillance.',
    briefing_text: 'This delivery doesn\'t exist. Neither do you. Understood?',
    base_credits: 250,
    base_xp: 60,
    time_limit_minutes: 45,
    cargo_type: 'UNKNOWN',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'ESCORT_VIP',
    name: 'VIP Escort',
    mission_type: 'ESCORT',
    tier_minimum: 4,
    tier_maximum: 8,
    description: 'Transport a living package. They have opinions about the route.',
    briefing_text: 'Client is high-value. Keep them alive, keep them happy.',
    base_credits: 400,
    base_xp: 80,
    time_limit_minutes: 90,
    cargo_type: 'LIVING',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'DATA_RUN',
    name: 'Data Courier',
    mission_type: 'COVERT',
    tier_minimum: 4,
    tier_maximum: 9,
    description: 'Physical data transfer. Unhackable, untraceable.',
    briefing_text: 'The drive contains everything. Destroy it rather than let it be captured.',
    base_credits: 350,
    base_xp: 70,
    time_limit_minutes: 40,
    cargo_type: 'DATA',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'COMBAT_DELIVERY',
    name: 'Hot Zone Delivery',
    mission_type: 'COMBAT',
    tier_minimum: 5,
    tier_maximum: 10,
    description: 'Delivery through contested territory. Expect resistance.',
    briefing_text: 'Gang war in progress. Package must get through. Any means necessary.',
    base_credits: 500,
    base_xp: 100,
    time_limit_minutes: 60,
    cargo_type: 'STANDARD',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'EXTRACTION',
    name: 'Asset Extraction',
    mission_type: 'EXTRACTION',
    tier_minimum: 6,
    tier_maximum: 10,
    description: 'Get someone out of a bad situation. Quickly.',
    briefing_text: 'Target is hot. Extract and deliver to safehouse. No witnesses.',
    base_credits: 750,
    base_xp: 150,
    time_limit_minutes: 45,
    cargo_type: 'LIVING',
    is_repeatable: 1,
  },
  // New missions - Tier 1-2 (Entry Level)
  {
    id: nanoid(),
    code: 'FOOD_DELIVERY',
    name: 'Meal Run',
    mission_type: 'STANDARD',
    tier_minimum: 1,
    tier_maximum: 2,
    description: 'Deliver food while it\'s still warm. Customer satisfaction is everything.',
    briefing_text: 'Noodles from Wong\'s. Customer wants them hot. Tips based on speed.',
    base_credits: 30,
    base_xp: 10,
    time_limit_minutes: 15,
    cargo_type: 'STANDARD',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'DOCUMENT_COURIER',
    name: 'Document Transfer',
    mission_type: 'STANDARD',
    tier_minimum: 1,
    tier_maximum: 3,
    description: 'Legal documents requiring physical signature verification.',
    briefing_text: 'Contracts for signing. Return with authenticated copies.',
    base_credits: 40,
    base_xp: 12,
    time_limit_minutes: 45,
    cargo_type: 'STANDARD',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'PHARMACY_RUN',
    name: 'Medicine Delivery',
    mission_type: 'STANDARD',
    tier_minimum: 1,
    tier_maximum: 3,
    description: 'Time-sensitive medication delivery. Someone\'s counting on you.',
    briefing_text: 'Prescription meds. Temperature sensitive. Don\'t shake the package.',
    base_credits: 60,
    base_xp: 20,
    time_limit_minutes: 30,
    cargo_type: 'FRAGILE',
    is_repeatable: 1,
  },
  // New missions - Tier 2-4 (Developing)
  {
    id: nanoid(),
    code: 'CORPORATE_INTERNAL',
    name: 'Internal Corp Transfer',
    mission_type: 'STANDARD',
    tier_minimum: 2,
    tier_maximum: 4,
    description: 'Inter-office delivery between corporate towers. Access codes provided.',
    briefing_text: 'OmniDeliver corporate mail. Building security will scan you. Act normal.',
    base_credits: 75,
    base_xp: 22,
    time_limit_minutes: 40,
    cargo_type: 'STANDARD',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'NIGHT_EXPRESS',
    name: 'After Hours Rush',
    mission_type: 'EXPRESS',
    tier_minimum: 2,
    tier_maximum: 5,
    description: 'Late night delivery through poorly lit streets.',
    briefing_text: 'Client paid extra for off-hours. Watch for trouble.',
    base_credits: 120,
    base_xp: 35,
    time_limit_minutes: 20,
    cargo_type: 'STANDARD',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'ORGAN_TRANSPORT',
    name: 'Medical Priority',
    mission_type: 'EXPRESS',
    tier_minimum: 3,
    tier_maximum: 6,
    description: 'Organ for transplant. Minutes count. Lives depend on you.',
    briefing_text: 'Cooler contains viable organ. Clock is ticking. GO.',
    base_credits: 300,
    base_xp: 75,
    time_limit_minutes: 20,
    cargo_type: 'LIVING',
    is_repeatable: 1,
  },
  // New missions - Tier 4-6 (Professional)
  {
    id: nanoid(),
    code: 'CORPORATE_ESPIONAGE',
    name: 'Quiet Acquisition',
    mission_type: 'COVERT',
    tier_minimum: 4,
    tier_maximum: 7,
    description: 'Pick up something that was never there. Deliver to someone who doesn\'t exist.',
    briefing_text: 'Dead drop location in your nav. Package will be waiting. Leave no trace.',
    base_credits: 400,
    base_xp: 90,
    time_limit_minutes: 60,
    cargo_type: 'DATA',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'WITNESS_RELOCATION',
    name: 'Witness Protection',
    mission_type: 'ESCORT',
    tier_minimum: 4,
    tier_maximum: 8,
    description: 'Move a key witness before they become a dead one.',
    briefing_text: 'Target saw something. People want them silenced. Get them out.',
    base_credits: 450,
    base_xp: 95,
    time_limit_minutes: 75,
    cargo_type: 'LIVING',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'CONTRABAND_BASIC',
    name: 'Grey Market Goods',
    mission_type: 'COVERT',
    tier_minimum: 3,
    tier_maximum: 6,
    description: 'Not illegal exactly, but not street legal either.',
    briefing_text: 'Unlicensed tech. Buyer at the market. Avoid checkpoints.',
    base_credits: 200,
    base_xp: 55,
    time_limit_minutes: 45,
    cargo_type: 'CONTRABAND',
    is_repeatable: 1,
  },
  // New missions - Tier 5-7 (Expert)
  {
    id: nanoid(),
    code: 'PROTOTYPE_DELIVERY',
    name: 'Prototype Transfer',
    mission_type: 'COVERT',
    tier_minimum: 5,
    tier_maximum: 8,
    description: 'Corporate R&D prototype. Multiple parties want it. Only one gets it.',
    briefing_text: 'Prototype neural interface. Worth millions. Kill anyone who tries to take it.',
    base_credits: 600,
    base_xp: 120,
    time_limit_minutes: 50,
    cargo_type: 'FRAGILE',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'GANG_TERRITORY',
    name: 'No Man\'s Land',
    mission_type: 'COMBAT',
    tier_minimum: 5,
    tier_maximum: 9,
    description: 'Cross through gang-controlled territory. Pay toll or fight through.',
    briefing_text: 'Three gangs, one route. Diplomatic or aggressive, your choice.',
    base_credits: 550,
    base_xp: 110,
    time_limit_minutes: 55,
    cargo_type: 'STANDARD',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'BLACKMAIL_DROP',
    name: 'Leverage Delivery',
    mission_type: 'COVERT',
    tier_minimum: 5,
    tier_maximum: 9,
    description: 'Someone\'s secrets. Someone else wants them. Don\'t read the contents.',
    briefing_text: 'Encrypted drive. Recipient will verify. Your job is transport only.',
    base_credits: 500,
    base_xp: 100,
    time_limit_minutes: 35,
    cargo_type: 'DATA',
    is_repeatable: 1,
  },
  // New missions - Tier 7-10 (Elite)
  {
    id: nanoid(),
    code: 'CORP_WAR_SUPPLY',
    name: 'War Material',
    mission_type: 'COMBAT',
    tier_minimum: 7,
    tier_maximum: 10,
    description: 'Military-grade weapons. Active corporate conflict zone.',
    briefing_text: 'Arms shipment for ongoing corp war. Both sides will try to intercept.',
    base_credits: 800,
    base_xp: 160,
    time_limit_minutes: 70,
    cargo_type: 'HAZMAT',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'VIP_EXTRACTION_HOT',
    name: 'Hostile Extraction',
    mission_type: 'EXTRACTION',
    tier_minimum: 7,
    tier_maximum: 10,
    description: 'Target is under fire. Get in, get them, get out.',
    briefing_text: 'Exec trapped in hostile territory. Armed response expected. Heavy pay.',
    base_credits: 1000,
    base_xp: 200,
    time_limit_minutes: 40,
    cargo_type: 'LIVING',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'ALGORITHM_OVERRIDE',
    name: 'System Penetration',
    mission_type: 'COVERT',
    tier_minimum: 8,
    tier_maximum: 10,
    description: 'Plant a data chip in a secure facility. The Algorithm must not know.',
    briefing_text: 'You\'re going dark. No tracking. No backup. Don\'t get caught.',
    base_credits: 1200,
    base_xp: 250,
    time_limit_minutes: 90,
    cargo_type: 'DATA',
    is_repeatable: 1,
  },
  {
    id: nanoid(),
    code: 'MEGACORP_HEIST',
    name: 'The Big Score',
    mission_type: 'EXTRACTION',
    tier_minimum: 9,
    tier_maximum: 10,
    description: 'Extract a critical asset from megacorp headquarters. Legendary difficulty.',
    briefing_text: 'This is the one. The job that changes everything. Are you ready?',
    base_credits: 2000,
    base_xp: 500,
    time_limit_minutes: 120,
    cargo_type: 'DATA',
    is_repeatable: 0,
  },
];

// Items
const ITEMS = [
  // Weapons
  {
    id: nanoid(),
    code: 'PISTOL_BASIC',
    name: 'Street Pistol',
    item_type: 'WEAPON',
    rarity: 'COMMON',
    description: 'Basic semi-automatic pistol. Reliable but unremarkable.',
    base_value: 100,
    weapon_damage_dice: '1d6',
    weapon_class: 'PISTOL',
    damage_type: 'PHYSICAL',
  },
  {
    id: nanoid(),
    code: 'SMG_COMPACT',
    name: 'Compact SMG',
    item_type: 'WEAPON',
    rarity: 'UNCOMMON',
    description: 'Concealable submachine gun. High rate of fire.',
    base_value: 350,
    weapon_damage_dice: '1d6+2',
    weapon_class: 'SMG',
    damage_type: 'PHYSICAL',
  },
  {
    id: nanoid(),
    code: 'KNIFE_MONO',
    name: 'Monomolecular Blade',
    item_type: 'WEAPON',
    rarity: 'UNCOMMON',
    description: 'Razor-sharp edge cuts through most materials.',
    base_value: 250,
    weapon_damage_dice: '1d8',
    weapon_class: 'MELEE',
    damage_type: 'PHYSICAL',
  },

  // Armor
  {
    id: nanoid(),
    code: 'JACKET_ARMORED',
    name: 'Armored Jacket',
    item_type: 'ARMOR',
    rarity: 'COMMON',
    description: 'Street fashion with concealed ballistic plates.',
    base_value: 200,
    armor_value: 2,
  },
  {
    id: nanoid(),
    code: 'VEST_TACTICAL',
    name: 'Tactical Vest',
    item_type: 'ARMOR',
    rarity: 'UNCOMMON',
    description: 'Military-grade protection. Not subtle.',
    base_value: 500,
    armor_value: 4,
  },

  // Consumables
  {
    id: nanoid(),
    code: 'STIM_HEALTH',
    name: 'Health Stim',
    item_type: 'CONSUMABLE',
    rarity: 'COMMON',
    description: 'Emergency medical injection. Restores health.',
    base_value: 50,
    effect_value: 20,
  },
  {
    id: nanoid(),
    code: 'STIM_COMBAT',
    name: 'Combat Stim',
    item_type: 'CONSUMABLE',
    rarity: 'UNCOMMON',
    description: 'Temporary combat enhancement. Side effects may vary.',
    base_value: 150,
    effect_value: 2,
  },

  // Gear
  {
    id: nanoid(),
    code: 'COMM_ENCRYPTED',
    name: 'Encrypted Comm Unit',
    item_type: 'KEY_ITEM',
    rarity: 'COMMON',
    description: 'Secure communications device. Standard issue.',
    base_value: 100,
  },
  {
    id: nanoid(),
    code: 'TOOLKIT_BASIC',
    name: 'Basic Toolkit',
    item_type: 'KEY_ITEM',
    rarity: 'COMMON',
    description: 'Essential tools for field repairs.',
    base_value: 75,
  },
];

// Districts/Locations
const DISTRICTS = [
  {
    id: nanoid(),
    code: 'DOWNTOWN',
    name: 'Downtown',
    description: 'Corporate heart of the city. Clean, surveilled, expensive.',
    danger_level: 2,
    surveillance_level: 5,
  },
  {
    id: nanoid(),
    code: 'INDUSTRIAL',
    name: 'Industrial Zone',
    description: 'Factories and warehouses. Iron Dragon territory.',
    danger_level: 4,
    surveillance_level: 2,
  },
  {
    id: nanoid(),
    code: 'SLUMS',
    name: 'The Sprawl',
    description: 'Densely packed residential blocks. Gang activity high.',
    danger_level: 4,
    surveillance_level: 1,
  },
  {
    id: nanoid(),
    code: 'MARKET',
    name: 'Night Market',
    description: 'Black market hub. Everything has a price.',
    danger_level: 3,
    surveillance_level: 1,
  },
  {
    id: nanoid(),
    code: 'PORT',
    name: 'Docklands',
    description: 'Shipping and smuggling. Neon Saints controlled.',
    danger_level: 3,
    surveillance_level: 2,
  },
  {
    id: nanoid(),
    code: 'TECH_DISTRICT',
    name: 'Silicon Heights',
    description: 'Tech companies and research labs. High security.',
    danger_level: 2,
    surveillance_level: 5,
  },
];

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

/**
 * Seed all game data.
 */
export async function seedAll(
  db: D1Database,
  cache?: GameCache
): Promise<SeedResult[]> {
  const results: SeedResult[] = [];

  results.push(await seedFactions(db));
  results.push(await seedAttributes(db));
  results.push(await seedSkills(db));
  results.push(await seedTiers(db));
  results.push(await seedMissions(db));
  results.push(await seedItems(db));
  results.push(await seedDistricts(db));

  // Warm cache if provided
  if (cache) {
    await cache.warmUp(db);
  }

  return results;
}

async function seedFactions(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'factions', inserted: 0, errors: [] };

  for (const faction of FACTIONS) {
    try {
      await db
        .prepare(
          `INSERT OR IGNORE INTO factions (id, code, name, faction_type, description, philosophy, is_joinable, is_hostile_default)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          faction.id,
          faction.code,
          faction.name,
          faction.faction_type,
          faction.description,
          faction.philosophy,
          faction.is_joinable,
          faction.is_hostile_default
        )
        .run();
      result.inserted++;
    } catch (e) {
      result.errors.push(`${faction.code}: ${e}`);
    }
  }

  return result;
}

async function seedAttributes(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'attribute_definitions', inserted: 0, errors: [] };

  for (const attr of ATTRIBUTES) {
    try {
      await db
        .prepare(
          `INSERT OR IGNORE INTO attribute_definitions (id, code, name, description, category)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(attr.id, attr.code, attr.name, attr.description, attr.category)
        .run();
      result.inserted++;
    } catch (e) {
      result.errors.push(`${attr.code}: ${e}`);
    }
  }

  return result;
}

async function seedSkills(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'skill_definitions', inserted: 0, errors: [] };

  for (const skill of SKILLS) {
    try {
      // Get attribute ID
      const attr = await db
        .prepare('SELECT id FROM attribute_definitions WHERE code = ?')
        .bind(skill.governing_attribute)
        .first<{ id: string }>();

      await db
        .prepare(
          `INSERT OR IGNORE INTO skill_definitions (id, code, name, category, governing_attribute_id)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(skill.id, skill.code, skill.name, skill.category, attr?.id ?? null)
        .run();
      result.inserted++;
    } catch (e) {
      result.errors.push(`${skill.code}: ${e}`);
    }
  }

  return result;
}

async function seedTiers(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'tier_definitions', inserted: 0, errors: [] };

  for (const tier of TIERS) {
    try {
      await db
        .prepare(
          `INSERT OR IGNORE INTO tier_definitions (id, tier_number, name, xp_required, rating_min, rating_max, base_pay_multiplier)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          nanoid(),
          tier.tier_number,
          tier.name,
          tier.xp_required,
          tier.rating_min,
          tier.rating_max,
          tier.base_pay_multiplier
        )
        .run();
      result.inserted++;
    } catch (e) {
      result.errors.push(`Tier ${tier.tier_number}: ${e}`);
    }
  }

  return result;
}

async function seedMissions(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'mission_definitions', inserted: 0, errors: [] };

  for (const mission of MISSIONS) {
    try {
      await db
        .prepare(
          `INSERT OR IGNORE INTO mission_definitions
           (id, code, name, mission_type, tier_minimum, tier_maximum, description, briefing_text, base_credits, base_xp, time_limit_minutes, cargo_type, is_repeatable)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          mission.id,
          mission.code,
          mission.name,
          mission.mission_type,
          mission.tier_minimum,
          mission.tier_maximum,
          mission.description,
          mission.briefing_text,
          mission.base_credits,
          mission.base_xp,
          mission.time_limit_minutes,
          mission.cargo_type,
          mission.is_repeatable
        )
        .run();
      result.inserted++;
    } catch (e) {
      result.errors.push(`${mission.code}: ${e}`);
    }
  }

  return result;
}

async function seedItems(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'item_definitions', inserted: 0, errors: [] };

  for (const item of ITEMS) {
    try {
      await db
        .prepare(
          `INSERT OR IGNORE INTO item_definitions
           (id, code, name, item_type, rarity, description, base_value)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          item.id,
          item.code,
          item.name,
          item.item_type,
          item.rarity,
          item.description,
          item.base_value
        )
        .run();
      result.inserted++;
    } catch (e) {
      result.errors.push(`${item.code}: ${e}`);
    }
  }

  return result;
}

async function seedDistricts(db: D1Database): Promise<SeedResult> {
  const result: SeedResult = { table: 'districts', inserted: 0, errors: [] };

  for (const district of DISTRICTS) {
    try {
      await db
        .prepare(
          `INSERT OR IGNORE INTO districts
           (id, code, name, description, danger_level, surveillance_level)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(
          district.id,
          district.code,
          district.name,
          district.description,
          district.danger_level,
          district.surveillance_level
        )
        .run();
      result.inserted++;
    } catch (e) {
      result.errors.push(`${district.code}: ${e}`);
    }
  }

  return result;
}

// =============================================================================
// EXPORTED SEED DATA (for testing)
// =============================================================================

export {
  FACTIONS,
  ATTRIBUTES,
  SKILLS,
  TIERS,
  MISSIONS,
  ITEMS,
  DISTRICTS,
};
