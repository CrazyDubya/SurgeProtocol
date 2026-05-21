import { describe, it, expect } from 'vitest';

describe('Sanity Check', () => {
    it('should pass', () => {
        expect(true).toBe(true);
    });

    it('should allow async', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(true).toBe(true);
    });
});
