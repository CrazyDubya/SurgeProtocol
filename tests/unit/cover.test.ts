
import { describe, it, expect } from 'vitest';
import { calculateCover, isFlanking, TerrainMap, COVER_TYPES } from '../../src/game/mechanics/combat';

describe('Combat: Cover Mechanics', () => {
    const terrain: TerrainMap = {
        obstacles: [],
        coverPoints: [
            { x: 5, y: 5, type: 'LIGHT' },
            { x: 5, y: 4, type: 'HEAVY' },
        ]
    };

    it('should provide no cover in open ground', () => {
        const defender = { x: 0, y: 0 };
        const attacker = { x: 0, y: 5 };
        const cover = calculateCover(defender, attacker, terrain);
        expect(cover).toEqual(COVER_TYPES.NONE);
    });

    it('should provide cover if adjacent to cover object in direction of attacker', () => {
        const defender = { x: 5, y: 6 };
        const attacker = { x: 5, y: 0 };

        const cover = calculateCover(defender, attacker, terrain);
        expect(cover).toEqual(COVER_TYPES.LIGHT);
    });

    it('should provide heavy cover', () => {
        const defender = { x: 5, y: 3 };
        const attacker = { x: 5, y: 10 };

        const cover = calculateCover(defender, attacker, terrain);
        expect(cover).toEqual(COVER_TYPES.HEAVY);
    });

    it('should not provide cover if flankd (attacker on side without cover)', () => {
        const defender = { x: 5, y: 6 };
        const attacker = { x: 10, y: 6 };

        const cover = calculateCover(defender, attacker, terrain);
        expect(cover).toEqual(COVER_TYPES.NONE);
    });
});

describe('Combat: Flanking Mechanics', () => {
    const defenderPos = { x: 5, y: 5 };
    const facingEast = { x: 1, y: 0 }; // Facing Right

    it('should not be flanking from the front', () => {
        // Attacker at (10, 5) -> East
        const attacker = { x: 10, y: 5 };
        expect(isFlanking(attacker, defenderPos, facingEast)).toBe(false);
    });

    it('should be flanking from the rear', () => {
        // Attacker at (0, 5) -> West
        const attacker = { x: 0, y: 5 };
        expect(isFlanking(attacker, defenderPos, facingEast)).toBe(true);
    });

    it('should be flanking from the rear diagonal', () => {
        // Attacker at (0, 0) -> North-West
        const attacker = { x: 0, y: 0 };
        expect(isFlanking(attacker, defenderPos, facingEast)).toBe(true);
    });

    it('should not be flanking from the side (90 degrees)', () => {
        // Attacker at (5, 0) -> North (Top)
        // Angle from defender: -90 deg. Facing: 0 deg. Diff: -90.
        // Abs(diff) = 90. 90 > 90 is False.
        const attacker = { x: 5, y: 0 };
        expect(isFlanking(attacker, defenderPos, facingEast)).toBe(false);
    });

    it('should return false if no facing defined', () => {
        expect(isFlanking({ x: 0, y: 0 }, defenderPos, undefined)).toBe(false);
    });
});
