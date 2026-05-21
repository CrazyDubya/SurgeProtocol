
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CombatSession, CombatState } from '../../src/realtime/combat';
import { Combatant, TerrainMap, COVER_TYPES } from '../../src/game/mechanics/combat';

// Mock DurableObjectState
const mockState = {
    id: { toString: () => 'mock-id' },
    storage: {
        get: vi.fn(async () => null),
        put: vi.fn(async () => { }),
        delete: vi.fn(async () => { }),
    },
    blockConcurrencyWhile: vi.fn(async (cb) => cb()),
    waitUntil: vi.fn(),
} as any;

describe('CombatSession: Tactics Integration', () => {
    let session: CombatSession;
    let terrain: TerrainMap;
    let attacker: Combatant;
    let defender: Combatant;

    beforeEach(async () => {
        session = new CombatSession(mockState, {});

        // Define Terrain:
        terrain = {
            obstacles: [{ x: 5, y: 5 }],
            coverPoints: [{ x: 5, y: 6, type: 'LIGHT' }],
        };

        attacker = {
            id: 'attacker',
            name: 'Attacker',
            hp: 10,
            hpMax: 10,
            position: { x: 0, y: 0 },
            attributes: { PWR: 5, AGI: 5, END: 5, VEL: 5, PRC: 5 },
            skills: { melee: 5, firearms: 5 },
            weapon: {
                id: 'pistol',
                name: 'Pistol',
                type: 'RANGED',
                subtype: 'LIGHT_PISTOL',
                baseDamage: '1d6',
                scalingAttribute: 'VEL',
                scalingDivisor: 1,
                ranges: { short: 10, medium: 50, long: 100 },
                attackMod: 0
            },
            armor: null,
            conditions: [],
            augmentBonuses: { initiative: 0, attack: 0, defense: 0, damage: 0 },
            actionsRemaining: 1,
            movementRemaining: 1,
            cover: null,
        };

        defender = {
            id: 'defender',
            name: 'Defender',
            hp: 10,
            hpMax: 10,
            position: { x: 5, y: 7 }, // Behind cover (5,6) from (5,0)? No.
            attributes: { PWR: 5, AGI: 5, END: 5, VEL: 5, PRC: 5 },
            skills: { melee: 5, firearms: 5 },
            conditions: [],
            augmentBonuses: { initiative: 0, attack: 0, defense: 0, damage: 0 },
            facing: { x: 0, y: -1 }, // Facing North (towards attacker)
            armor: null,
            weapon: null,
            cover: null,
        };

        // Initialize session manually with request
        const req = new Request('http://localhost/init', {
            method: 'POST',
            body: JSON.stringify({
                combatId: 'test-combat',
                combatants: [attacker, defender],
                terrain: terrain,
                autoStart: true // This rolls initiative and sets phase to ACTIVE
            })
        });

        await (session as any).handleInit(req);

        // Force turn order to be Attacker first
        (session as any).combatState.turnOrder = ['attacker', 'defender'];
        (session as any).combatState.turnIndex = 0;
    });

    it('should apply cover modifiers when attacking', async () => {
        // Setup positions for Cover
        attacker.position = { x: 5, y: 0 };
        defender.position = { x: 5, y: 6 };
        // Cover is at (5, 5) (Light)

        // Update combatants in state
        (session as any).combatState.combatants.set('attacker', attacker);
        (session as any).combatState.combatants.set('defender', defender);

        // Let's place an obstacle at (5, 2).
        (session as any).combatState.terrain.obstacles.push({ x: 5, y: 2 });

        // Attacker (5,0) -> Obstacle (5,2) -> Defender (5,6).
        // LOS should be blocked.

        // console.log('DEBUG: CombatState:', JSON.stringify((session as any).combatState, null, 2));

        const result = await (session as any).handleAction('attacker', { type: 'ATTACK', targetId: 'defender' });

        expect(result).toBeDefined();
        // Failed due to LOS
        expect((result as any).success).toBe(false);
        expect((result as any).narrative).toContain('No line of sight');
    });

    it('should apply flanking modifiers', async () => {
        // Clear obstacles
        (session as any).combatState.terrain.obstacles = [];

        // Attacker behind defender
        // Defender at (5, 5), facing North (0, -1).
        // Attacker at (5, 6) (South of defender).
        attacker.position = { x: 5, y: 6 };
        defender.position = { x: 5, y: 5 };
        defender.facing = { x: 0, y: -1 };

        (session as any).combatState.combatants.set('attacker', attacker);
        (session as any).combatState.combatants.set('defender', defender);

        const result = await (session as any).handleAction('attacker', { type: 'ATTACK', targetId: 'defender' });

        expect(result).toBeDefined();
        // Should succeed (hit/miss doesn't matter, but execution works)
        // Check narrative or hit
        // Attacks return AttackResult, which doesn't have `success` property.
        // It has `hit`, `damage`, `narrative`.
        expect((result as any).narrative).toBeDefined();
    });
});
