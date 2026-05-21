import { describe, it, expect } from 'vitest';
import { findPath, getDistance, Point } from '../../src/game/mechanics/grid';

describe('Pathfinding Utilities', () => {
    describe('getDistance', () => {
        it('should calculate Chebyshev distance correctly', () => {
            const p1: Point = { x: 0, y: 0 };
            const p2: Point = { x: 3, y: 3 };
            expect(getDistance(p1, p2)).toBe(3);

            const p3: Point = { x: 0, y: 0 };
            const p4: Point = { x: 5, y: 2 };
            expect(getDistance(p3, p4)).toBe(5);
        });
    });

    describe('findPath', () => {
        const noBlocks = () => false;

        it('should find a direct path on an empty grid', () => {
            const start = { x: 0, y: 0 };
            const end = { x: 2, y: 2 };
            const path = findPath(start, end, noBlocks);

            expect(path).not.toBeNull();
            expect(path?.length).toBe(3); // [0,0], [1,1], [2,2]
            expect(path?.[path.length - 1]).toEqual(end);
        });

        it('should return null if end is blocked', () => {
            const start = { x: 0, y: 0 };
            const end = { x: 2, y: 2 };
            const isBlocked = (p: Point) => p.x === 2 && p.y === 2;

            const path = findPath(start, end, isBlocked);
            expect(path).toBeNull();
        });

        it('should find a path around an obstacle', () => {
            // S . .
            // # # .
            // . . E
            const start = { x: 0, y: 0 };
            const end = { x: 2, y: 2 };
            const isBlocked = (p: Point) => (p.x === 0 && p.y === 1) || (p.x === 1 && p.y === 1);

            const path = findPath(start, end, isBlocked);

            expect(path).not.toBeNull();
            expect(path?.some(p => isBlocked(p))).toBe(false);
            expect(path?.length).toBeGreaterThan(3);
            expect(path?.[path.length - 1]).toEqual(end);
        });

        it('should return null if destination is unreachable', () => {
            // S | .
            // - + -
            // . | E
            const start = { x: 0, y: 0 };
            const end = { x: 2, y: 2 };
            const isBlocked = (p: Point) => p.x === 1 || p.y === 1;

            const path = findPath(start, end, isBlocked);
            expect(path).toBeNull();
        });

        it('should respect grid boundaries', () => {
            const start = { x: 0, y: 0 };
            const end = { x: 2, y: 0 };
            const bounds = { minX: 0, minY: 0, maxX: 2, maxY: 0 };
            const isBlocked = () => false;

            const path = findPath(start, end, isBlocked, bounds);
            expect(path).not.toBeNull();
            path?.forEach(p => {
                expect(p.y).toBe(0);
                expect(p.x).toBeGreaterThanOrEqual(0);
                expect(p.x).toBeLessThanOrEqual(2);
            });
        });
    });
});
