
import { strict as assert } from 'assert';

// Configuration
const API_BASE = 'http://localhost:8787';
const USER_EMAIL = 'combat_tester@surge.game';
const USER_PASS = 'combat_pass_123';
const CHAR_HANDLE = 'Combat_Vaz';

// Helpers
async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Types
interface ApiResponse<T> {
    success: boolean;
    data: T;
    errors?: Array<{ code: string; message: string; }>;
}

async function main() {
    console.log('⚔️  Starting Combat Simulation...');

    try {
        // [1] Authenticate
        console.log('\n[1] Authenticating...');
        let loginRes = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: USER_EMAIL, password: USER_PASS })
        });
        const loginJson = await loginRes.json() as ApiResponse<any>;
        const authToken = loginJson.data.accessToken;
        console.log('    ✅ Authenticated');

        // [2] Get Character
        console.log('\n[2] Preparing Character...');
        const charsRes = await fetch(`${API_BASE}/api/characters`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const charsJson = await charsRes.json() as ApiResponse<{ characters: any[] }>;
        let char = charsJson.data.characters[0];
        const characterId = char.id;
        console.log(`    ✅ Character Ready: ${char.handle} (${characterId})`);

        // [3] Start Combat
        const ENCOUNTER_ID = 'enc_training';
        console.log(`\n[3] Starting Combat Session (Encounter: ${ENCOUNTER_ID})...`);
        const startRes = await fetch(`${API_BASE}/api/combat/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                characterId,
                encounterId: ENCOUNTER_ID,
                arenaId: 'arena_training'
            })
        });

        const startJson = await startRes.json() as ApiResponse<any>;
        if (!startJson.success) throw new Error(`Failed to start combat: ${JSON.stringify(startJson)}`);

        const sessionId = startJson.data.session.sessionId;
        console.log(`    ✅ Combat Started! Session ID: ${sessionId}`);

        // [4] Combat Loop
        let combatActive = true;
        let turnCount = 0;

        while (combatActive && turnCount < 20) {
            turnCount++;
            await sleep(1000);

            const stateRes = await fetch(`${API_BASE}/api/combat/session/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const stateJson = await stateRes.json() as ApiResponse<any>;
            if (!stateJson.success) break;

            const state = stateJson.data;
            const combatantsMap = new Map<string, any>(state.combatants);
            const currentId = state.turnOrder[state.turnIndex];
            const actor = combatantsMap.get(currentId);

            console.log(`\n--- [Round ${state.round} | Turn ${state.turnIndex}] Actor: ${actor ? actor.name : 'Unknown'} (${currentId}) ---`);
            if (actor) {
                console.log(`    HP: ${actor.hp}/${actor.hpMax} | AP: ${actor.actionsRemaining} | MV: ${actor.movementRemaining}`);
            }

            if (state.phase === 'COMBAT_END') {
                console.log(`🏁 Combat Ended: ${state.endReason}`);
                break;
            }

            // Log recent actions
            if (state.actionLog && state.actionLog.length > 0) {
                const logs = state.actionLog.slice(-2);
                logs.forEach((l: any) => console.log(`       📜 [${l.actorId}] ${l.action}: ${l.result.narrative}`));
            }

            const isPlayerTurn = currentId === characterId || !currentId.startsWith('enemy_');
            if (isPlayerTurn) {
                if (actor.actionsRemaining > 0) {
                    const enemies = Array.from(combatantsMap.keys()).filter(id => id.startsWith('enemy_'));
                    const targetId = enemies[0];
                    console.log(`    👉 Player acting: ATTACK ${targetId}`);
                    await fetch(`${API_BASE}/api/combat/session/${sessionId}/action`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                        body: JSON.stringify({ type: 'ATTACK', targetId })
                    });
                } else {
                    console.log(`    👉 Player ending turn`);
                    await fetch(`${API_BASE}/api/combat/session/${sessionId}/action`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                        body: JSON.stringify({ type: 'END_TURN' })
                    });
                }
            } else {
                console.log(`    🤖 AI Turn. Waiting...`);
                await sleep(1000);
            }
        }

    } catch (e: any) {
        console.error('❌ Error:', e.message);
    }
}

main();
