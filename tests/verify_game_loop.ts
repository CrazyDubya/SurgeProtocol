
import { randomUUID } from 'crypto';

const API_URL = 'http://localhost:8787/api';
let AUTH_TOKEN = '';
let CHARACTER_ID = '';
let CURRENT_LOCATION_ID = '';

async function runStep(stepName: string, fn: () => Promise<void>) {
    console.log(`\n🔹 [STEP] ${stepName}`);
    try {
        await fn();
        console.log(`✅ [SUCCESS] ${stepName}`);
    } catch (error) {
        console.error(`❌ [FAILED] ${stepName}`);
        console.error(error);
        process.exit(1);
    }
}

async function api(method: string, endpoint: string, body?: any, token?: string) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    // Use provided token or global AUTH_TOKEN
    const authToken = token || AUTH_TOKEN;
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    // Append characterId to query params if we have it, just in case some endpoints strictly require it there
    // despite it being in the token (like Black Market currently).
    const url = new URL(`${API_URL}${endpoint}`);
    if (CHARACTER_ID) {
        url.searchParams.append('characterId', CHARACTER_ID);
    }

    const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    if (!response.ok || (data as any).success === false) {
        throw new Error(`${method} ${endpoint} failed: ${JSON.stringify(data, null, 2)}`);
    }
    return data;
}

// Auth API helper (no characterId param injection needed usually, but good to separate)
async function authApi(method: string, endpoint: string, body?: any) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok || (data as any).success === false) {
        throw new Error(`${method} ${endpoint} failed: ${JSON.stringify(data, null, 2)}`);
    }
    return data;
}

async function main() {
    console.log('🚀 Starting End-to-End Game Loop Verification');

    const uniqueId = randomUUID().split('-')[0];
    const email = `player_${uniqueId}@example.com`;
    const password = 'password123';
    const handle = `V_${uniqueId}`;

    // 1. Auth & Character Setup
    await runStep('Register User', async () => {
        const res = await authApi('POST', '/auth/register', { email, password, displayName: `Player ${uniqueId}` });
        if (!res.data.userId || !res.data.accessToken) throw new Error('Registration failed');
        AUTH_TOKEN = res.data.accessToken;
        console.log(`   User registered: ${email}`);
    });

    await runStep('Create Character', async () => {
        const res = await api('POST', '/characters', {
            legalName: `Vincent ${uniqueId}`,
            streetName: 'Vee',
            handle: handle,
            sex: 'MALE',
            age: 24,
            attributes: { // Optional but good to test
                PWR: 5, AGI: 5, END: 5, VEL: 5, INT: 5, WIS: 5, EMP: 5, PRC: 5
            }
        });

        CHARACTER_ID = res.data.character.id;
        console.log(`   Character created: ${CHARACTER_ID}`);
    });

    await runStep('Select Character', async () => {
        const res = await api('POST', `/characters/${CHARACTER_ID}/select`);
        AUTH_TOKEN = res.data.accessToken;
        console.log(`   Character selected. Token updated.`);
    });

    // 2. World & Movement
    let destinationId = '';
    await runStep('Get World Locations', async () => {
        // Get current location details to find connections
        const charRes = await api('GET', `/characters/${CHARACTER_ID}`);
        CURRENT_LOCATION_ID = charRes.data.character.current_location_id;

        console.log(`   Current Location ID: ${CURRENT_LOCATION_ID}`);

        const locDetails = await api('GET', `/world/locations/${CURRENT_LOCATION_ID}`);
        const connections = locDetails.data.connections;

        if (connections && connections.length > 0) {
            const route = connections[0];
            destinationId = route.destination.id;
            console.log(`   Found connection to: ${route.destination.name} (${destinationId}) via Route ${route.routeId}`);
        } else {
            console.log('   No direct connections. Searching for any location...');
            const res = await api('GET', '/world/locations');
            const locations = res.data.locations || res.data;
            const dest = locations.find((l: any) => l.id !== CURRENT_LOCATION_ID);
            if (dest) destinationId = dest.id;
        }

        if (!destinationId) throw new Error('Could not find a valid destination');
    });

    await runStep('Travel to Destination', async () => {
        if (!destinationId) return;

        console.log(`   Attempting to travel from ${CURRENT_LOCATION_ID} to ${destinationId}`);

        // Travel
        const travelRes = await api('POST', '/world/move', {
            destinationId: destinationId,
        });

        console.log(`   Travel initiated. Arrival: ${travelRes.data.travelTime} min`);
        CURRENT_LOCATION_ID = destinationId;
    });

    // 3. Economy & Items
    await runStep('Check Vendor Inventory', async () => {
        // We need to find a vendor in the current location.
        const locRes = await api('GET', `/world/locations/${CURRENT_LOCATION_ID}`);
        const vendors = locRes.data.vendors || []; // Adjust based on actual response structure

        if (vendors.length > 0) {
            console.log(`   Found ${vendors.length} vendors at current location.`);
            // TODO: Interact with vendor
        } else {
            console.log('   No vendors at this location.');
        }
    });

    // 4. Black Market (The feature we just finished)
    let contactId = '';
    await runStep('Discover Black Market Contact', async () => {
        // The `BlackMarketService` has `listContacts`.
        const contactsRes = await api('GET', '/blackmarket/contacts');
        const contacts = contactsRes.data.contacts;

        if (contacts.length > 0) {
            contactId = contacts[0].id;
            console.log(`   Black Market Contact found: ${contacts[0].npc_name}`);
        } else {
            console.warn('   No Black Market contacts found. Seeding one via direct DB might be needed for full test, or assuming "Discover" logic.');
            // Skip further black market steps if none found
        }
    });

    if (contactId) {
        await runStep('View Black Market Inventory', async () => {
            // Generate/Recover inventory
            await api('POST', `/blackmarket/contacts/${contactId}/refresh-inventory`);
            const invRes = await api('GET', `/blackmarket/contacts/${contactId}`);
            const items = invRes.data.current_inventory?.items || [];
            console.log(`   Contact has ${items.length} items.`);

            if (items.length > 0) {
                const itemToBuy = items[0];
                console.log(`   Attempting to buy: ${itemToBuy.item_id} for ${itemToBuy.price}`);

                // Buy
                await api('POST', '/blackmarket/buy', {
                    contact_id: contactId,
                    inventory_id: invRes.data.current_inventory.id,
                    item_id: itemToBuy.item_id,
                    quantity: 1,
                    payment_method: 'CREDITS'
                });
                console.log('   Purchase successful');
            }
        });
    }

    // 5. Status Check
    await runStep('Final Status Check', async () => {
        const charRes = await api('GET', `/characters/${CHARACTER_ID}`);
        console.log(`   Credits: ${charRes.data.character.credits}`); // Assuming credits is on character model or we fetch finances
    });

    console.log('\n✨ Verification Complete!');
}

main().catch(console.error);
