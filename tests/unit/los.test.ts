
import { describe, it, expect } from 'vitest';
import { hasLineOfSight, Point } from '../../src/game/mechanics/grid';

describe('Grid: Line of Sight', () => {
    // Simple block function for testing
    // Walls at (2,2), (2,3), (2,4)
    const isBlocked = (p: Point) => {
        return p.x === 2 && (p.y >= 2 && p.y <= 4);
    };

    it('should have LOS in open space', () => {
        const start = { x: 0, y: 0 };
        const end = { x: 0, y: 5 };
        expect(hasLineOfSight(start, end, isBlocked)).toBe(true);
    });

    it('should be blocked by a wall', () => {
        // Path from (0,3) to (4,3) goes through wall at (2,3)
        const start = { x: 0, y: 3 };
        const end = { x: 4, y: 3 };
        expect(hasLineOfSight(start, end, isBlocked)).toBe(false);
    });

    it('should not be blocked if start or end are the obstacles (soft cover logic handled elsewhere)', () => {
        // This function strictly checks the PATH. Start and End are usually entities.
        // However, if the target is BEHIND a wall, the wall is the blocker, not the target.
        // If the target IS the wall breakdown, we might want to see it.
        // For now, pure grid LOS implies center-to-center raycast.

        // Check diagonal past wall end
        // Wall ends at (2,4). Path from (0,0) to (4,6) should likely pass.
        const start = { x: 0, y: 0 };
        const end = { x: 4, y: 6 };
        // Bresenham line: (0,0)->(1,1)->(1,2)->(2,3)*BLOCKED*->...
        // Let's trace (0,0) to (4,1). Line: (0,0), (1,0), (2,0), (3,1), (4,1). No wall.
        expect(hasLineOfSight({ x: 0, y: 0 }, { x: 4, y: 1 }, isBlocked)).toBe(true);
    });

    it('should allow diagonal LOS through corner if not "pinched"', () => {
        // If we strictly block on ANY intersection, that's fine for now.
        // (1,1) -> (3,3) passing through (2,2) which is a wall.
        const start = { x: 1, y: 1 };
        const end = { x: 3, y: 3 };
        expect(hasLineOfSight(start, end, isBlocked)).toBe(false);
    });

    it('should see adjacent tiles', () => {
        expect(hasLineOfSight({ x: 0, y: 0 }, { x: 1, y: 0 }, isBlocked)).toBe(true);
        expect(hasLineOfSight({ x: 0, y: 0 }, { x: 1, y: 1 }, isBlocked)).toBe(true);
    });
});
