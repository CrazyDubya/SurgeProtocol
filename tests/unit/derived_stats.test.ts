
import { describe, it, expect } from 'vitest';
import { calculateCarryCapacity, calculateMemoryCapacity } from '../../src/game/mechanics/stats';

describe('Derived Stats Mechanics', () => {
    describe('Carry Capacity', () => {
        it('should calculate base capacity correctly', () => {
            // PWR 1 -> 20 + 5 = 25
            expect(calculateCarryCapacity(1)).toBe(25);
        });

        it('should scale with PWR', () => {
            // PWR 5 -> 20 + 25 = 45
            expect(calculateCarryCapacity(5)).toBe(45);
            // PWR 10 -> 20 + 50 = 70
            expect(calculateCarryCapacity(10)).toBe(70);
        });

        it('should handle zero gracefully (though unlikely for attrs)', () => {
            expect(calculateCarryCapacity(0)).toBe(20);
        });
    });

    describe('Memory Capacity', () => {
        it('should calculate base memory correctly', () => {
            // INT 1 -> 4 + 2 = 6
            expect(calculateMemoryCapacity(1)).toBe(6);
        });

        it('should scale with INT', () => {
            // INT 5 -> 4 + 10 = 14
            expect(calculateMemoryCapacity(5)).toBe(14);
            // INT 10 -> 4 + 20 = 24
            expect(calculateMemoryCapacity(10)).toBe(24);
        });
    });
});
