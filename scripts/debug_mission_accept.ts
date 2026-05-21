
const API_URL = 'http://localhost:8787';

async function main() {
    console.log('--- Debugging Mission Acceptance (Fetch) ---');

    // 1. Login
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'test2@surge.net', password: 'password123' }),
        headers: { 'Content-Type': 'application/json' }
    });

    const loginData = await loginRes.json() as any;
    if (!loginData.success) {
        console.error('Login failed:', loginData);
        return;
    }

    console.log('Login Response:', JSON.stringify(loginData, null, 2));

    const token = loginData.data?.token || loginData.data?.accessToken;
    if (!token) {
        console.error('Token not found in response');
        return;
    }
    console.log(`Logged in. Token: ${token.substring(0, 10)}...`);

    // 2. Get Available Missions
    const missionsRes = await fetch(`${API_URL}/api/missions/available`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const missionsData = await missionsRes.json() as any;
    if (!missionsData.success || !missionsData.data.missions.length) {
        console.error('No missions available or failed to fetch:', missionsData);
        return;
    }

    const missionId = missionsData.data.missions[0].id;
    console.log(`Attempting to accept mission: ${missionsData.data.missions[0].name} (${missionId})`);

    // 3. Accept Mission
    const acceptRes = await fetch(`${API_URL}/api/missions/${missionId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const acceptData = await acceptRes.json();
    console.log('Accept Response Status:', acceptRes.status);
    console.log('Accept Response Body:', JSON.stringify(acceptData, null, 2));

    if (acceptRes.status === 422 || acceptRes.status === 403) {
        console.log("Validation Failed. This is likely why the button doesn't work.");
    }
}

main().catch(console.error);
