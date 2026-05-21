
const API_BASE = 'http://localhost:8787';
const USER_EMAIL = 'combat_tester@surge.game';
const USER_PASS = 'combat_pass_123';

async function diagnose() {
    console.log('Logging in...');
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: USER_EMAIL, password: USER_PASS })
    });
    const loginJson = await loginRes.json() as any;
    const token = loginJson.data.accessToken;

    console.log('Fetching characters...');
    const charsRes = await fetch(`${API_BASE}/api/characters`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const charsJson = await charsRes.json() as any;
    const charId = charsJson.data.characters[0].id;

    console.log('Fetching active sessions...');
    // We'll just try to start a new one or get an existing one if possible
    // For diagnosis, let's just start one
    const startRes = await fetch(`${API_BASE}/api/combat/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            characterId: charId,
            encounterId: 'enc_training',
            arenaId: 'arena_training'
        })
    });
    const startJson = await startRes.json() as any;
    const sessionId = startJson.data.session.sessionId;

    console.log('Fetching session state...');
    const stateRes = await fetch(`${API_BASE}/api/combat/session/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const stateJson = await stateRes.json() as any;

    console.log('--- SESSION STATE KEYS ---');
    console.log(Object.keys(stateJson.data));
    console.log('--- COMBATANTS TYPE ---');
    console.log(Array.isArray(stateJson.data.combatants) ? 'Array' : typeof stateJson.data.combatants);
    if (Array.isArray(stateJson.data.combatants)) {
        console.log('Sample combatant:', JSON.stringify(stateJson.data.combatants[0], null, 2));
    }
}

diagnose();
