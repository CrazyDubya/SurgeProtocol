/**
 * Surge Protocol - Derived Stats Calculations
 */

/**
 * Calculate Carry Capacity in kg.
 * Base 20kg + (PWR * 5kg).
 * @param pwr Power attribute (1-10)
 * @returns Capacity in kg
 */
export function calculateCarryCapacity(pwr: number): number {
    const base = 20;
    const perPoint = 5;
    return base + (pwr * perPoint);
}

/**
 * Calculate Memory Capacity (for cyberdeck/programs).
 * Base 4 + (INT * 2).
 * @param int Intelligence attribute (1-10)
 * @returns Memory slots
 */
export function calculateMemoryCapacity(int: number): number {
    return 4 + (int * 2);
}
