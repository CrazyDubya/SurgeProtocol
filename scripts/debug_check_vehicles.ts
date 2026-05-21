
const API_URL = 'http://localhost:8788';

async function main() {
    console.log('--- Checking Vehicle Definitions ---');

    // 1. Login (needed for authenticated endpoints)
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
    const token = loginData.data.accessToken;

    // 2. Fetch Vehicles
    const vehRes = await fetch(`${API_URL}/api/vehicles`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const vehData = await vehRes.json() as any;
    console.log('Vehicle Definitions Found:', vehData.data?.length || 0);

    if (vehData.data && vehData.data.length > 0) {
        console.log('Sample Vehicle:', vehData.data[0].name);
    } else {
        console.log('No vehicle definitions found.');
    }
}

main().catch(console.error);
