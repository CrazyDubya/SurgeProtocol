import type { D1Database } from '@cloudflare/workers-types';
// Removed unused imports

// Types for Simulator
export interface SimulationState {
    lastSimulated: string; // ISO timestamp
}

export type TimeOfDay = 'MORNING' | 'DAY' | 'EVENING' | 'NIGHT';

export class WorldSimulator {
    constructor(
        private db: D1Database,
        private vendorService?: any
    ) { }

    /**
     * Get current game time.
// ...
     */
    getTimeOfDay(): TimeOfDay {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 10) return 'MORNING';
        if (hour >= 10 && hour < 18) return 'DAY';
        if (hour >= 18 && hour < 22) return 'EVENING';
        return 'NIGHT';
    }

    /**
     * "Catch up" a specific location to the current time.
     * This moves NPCs to/from this location based on their schedules.
     */
    async simulateLocation(_locationId: string) {
        // 1. Get all NPCs who SHOULD be here right now
        // 2. Get all NPCs who ARE here but SHOULD belong elsewhere

        // This is complex to query efficiently. 
        // Better approach for "Lazy":
        // When querying a location, we just update the specific NPCs involved?
        // Or run a global "tick" for all NPCs? Global tick is too heavy for lazy load.

        // Revised Lazy Load:
        // We only care about NPCs that are *supposed* to be active or relevant.
        // But for a living world, we want to see random NPCs walking around.

        // Let's implement a simpler "Shift Change" logic.
        // We scan `npc_instances` that haven't been updated in X minutes.
        // If they are "stale", we recalculate their position.

        await this.updateStaleNPCs();
    }

    /**
     * Update position of NPCs that haven't been updated recently.
     */
    async updateStaleNPCs(limit: number = 50) {
        const STALE_THRESHOLD_MINUTES = 15;

        // Find stale NPCs
        const staleNPCs = await this.db.prepare(`
            SELECT ni.id, ni.npc_definition_id, ni.current_location_id, nd.schedule, nd.home_location_id, nd.work_location_id, nd.hangout_locations
            FROM npc_instances ni
            JOIN npc_definitions nd ON ni.npc_definition_id = nd.id
            WHERE datetime(ni.updated_at) < datetime('now', '-${STALE_THRESHOLD_MINUTES} minutes')
            AND ni.is_active = 1
            LIMIT ?
        `).bind(limit).all<any>(); // using any for temp query result

        if (!staleNPCs.results.length) return;

        const timeOfDay = this.getTimeOfDay();
        const updates: Promise<void>[] = [];

        for (const npc of staleNPCs.results) {
            const schedule = npc.schedule ? JSON.parse(npc.schedule) : null;
            let targetLocationId = npc.home_location_id; // Default home

            if (schedule) {
                // Schedule format: { "MORNING": "loc_id", "DAY": "work", ... }
                // or { "default": "work", "22:00": "home" }
                // Simplified: { "day_activity": "WORK", "evening_activity": "HANGOUT" }

                // Logic:
                if (timeOfDay === 'DAY' && npc.work_location_id) {
                    targetLocationId = npc.work_location_id;
                } else if (timeOfDay === 'EVENING' && npc.hangout_locations) {
                    const hangouts = JSON.parse(npc.hangout_locations);
                    if (Array.isArray(hangouts) && hangouts.length > 0) {
                        targetLocationId = hangouts[0]; // Pick first for now
                    }
                } else if (timeOfDay === 'NIGHT') {
                    targetLocationId = npc.home_location_id;
                }
            }

            // If location changed, update
            if (targetLocationId && targetLocationId !== npc.current_location_id) {
                updates.push(
                    this.db.prepare(`
                        UPDATE npc_instances 
                        SET current_location_id = ?, updated_at = datetime('now')
                        WHERE id = ?
                    `).bind(targetLocationId, npc.id).run().then()
                );
            } else {
                // Just update timestamp so we don't check again immediately
                updates.push(
                    this.db.prepare(`
                        UPDATE npc_instances SET updated_at = datetime('now') WHERE id = ?
                    `).bind(npc.id).run().then()
                );
            }
        }

        await Promise.all(updates);
    }

    /**
     * Check and update vendor stocks.
     */
    async updateVendors() {
        if (this.vendorService) {
            // simplified: check all vendors for now as we don't have a huge number
            const vendors = await this.db.prepare('SELECT id FROM vendor_profiles').all<{ id: string }>();
            if (vendors.results) {
                for (const vendor of vendors.results) {
                    await this.vendorService.checkAndRestock(vendor.id);
                }
            }
        }
    }
}
