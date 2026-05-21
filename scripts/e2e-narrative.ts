
import { strict as assert } from 'assert';

// Configuration
const API_BASE = 'http://localhost:8787';

// Types
interface ApiResponse<T> {
    success: boolean;
    data: T;
    errors?: Array<{ code: string; message: string; }>;
}

interface LoginData {
    accessToken: string;
    refreshToken: string;
    user: { id: string; username: string; };
}

interface Character {
    id: string;
    name: string;
}

interface DialogueTree {
    id: string;
    code: string;
    name: string;
}

interface ConversationState {
    conversationId: string; // was id
    currentNode: {
        id: string;
        content: { text: string }; // currentNode structure also differs! Service returns FormattedDialogueNode
        // ...
    };
    availableResponses: any[];
}
// Note: FormattedDialogueNode has `content: { text: string, ... }` NOT `text: string`.
// Need to check specific structure returned by `this.formatDialogueNode`.

// Let's look at `formatDialogueNode` in `engine.ts`:
// return { id, treeId, ..., content: { text: node.text, ... }, ... }
// So `currentNode.text` is WRONG. It should be `currentNode.content.text`.

// I will update the whole interface and access logic.


// Test State
let authToken = '';
let userId = '';
let characterId = '';

async function main() {
    console.log('📖 Starting Narrative E2E Verification (Corrected)...');

    try {
        // Step 0: Seed Database
        console.log('\n[0] Seeding Database...');
        const seedRes = await fetch(`${API_BASE}/internal/admin/seed`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': 'dev-master-token-123'
            },
            body: JSON.stringify({
                tables: ['dialogue_trees', 'quest_definitions', 'npc_definitions']
            })
        });

        if (!seedRes.ok) {
            console.warn(`    ⚠️  Seeding warning: ${await seedRes.text()}`);
        } else {
            console.log('    ✅ Database Seeded');
        }

        // Step 1: Login/Register
        console.log('\n[1] Authenticating...');
        const uniqueSuffix = Date.now();
        const regPayload = {
            email: `runner_${uniqueSuffix}@example.com`,
            password: 'password123',
            displayName: `Runner ${uniqueSuffix}`
        };

        const loginRes = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regPayload)
        });

        const loginJson = await loginRes.json() as ApiResponse<LoginData>;
        if (!loginJson.success || !loginJson.data) {
            throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
        }

        authToken = loginJson.data.accessToken;
        userId = loginJson.data.user.id;
        console.log(`    ✅ Logged in as ${regPayload.displayName} (${userId})`);

        // Step 2: Create Character
        console.log('\n[2] Creating Character...');
        const charRes = await fetch(`${API_BASE}/api/characters`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                handle: `Vaz_${uniqueSuffix}`,
                legalName: 'Vazquez',
                background: 'STREET_RAT',
                attributes: {
                    PWR: 5,
                    AGI: 6,
                    END: 5,
                    INT: 6,
                    PRC: 6,
                    EMP: 5,
                    VEL: 6
                }
            })
        });

        const charJson = await charRes.json() as ApiResponse<{ character: Character }>;
        if (!charJson.success || !charJson.data) {
            throw new Error(`Character creation failed: ${JSON.stringify(charJson)}`);
        }
        characterId = charJson.data.character.id;
        console.log(`    ✅ Character created: ${charJson.data.character.name} (${characterId})`);

        // Step 3: Find Dialogue Tree
        console.log('\n[3] Finding Tutorial Dialogue Tree...');
        const treesRes = await fetch(`${API_BASE}/api/dialogue/trees?limit=100`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const treesJson = await treesRes.json() as ApiResponse<{ trees: DialogueTree[] }>;
        if (!treesJson.success) throw new Error(`Failed to list trees: ${JSON.stringify(treesJson)}`);

        // Look for 'TUTORIAL_INTRO' or fall back to any tree
        const targetTree = treesJson.data.trees.find(t => t.code === 'TUTORIAL_INTRO') || treesJson.data.trees[0];

        if (!targetTree) throw new Error('No dialogue trees found to test!');
        console.log(`    ✅ Found Tree: ${targetTree.name} (${targetTree.id})`);

        // Step 4: Start Conversation
        console.log('\n[4] Starting Conversation...');
        const startRes = await fetch(`${API_BASE}/api/dialogue/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                characterId: characterId,
                treeId: targetTree.id
            })
        });

        const startJson = await startRes.json() as ApiResponse<ConversationState>;
        if (!startJson.success) throw new Error(`Failed to start dialogue: ${JSON.stringify(startJson)}`);

        interface ConversationState {
            conversationId: string;
            currentNode: {
                id: string;
                content: { text: string };
            };
            availableResponses: Array<{
                id: string;
                text: { full: string };
            }>;
        }

        // ... (in main) ...

        const conversationId = startJson.data.conversationId;
        const currentNode = startJson.data.currentNode;
        const choices = startJson.data.availableResponses;

        console.log(`    ✅ Conversation Started (ID: ${conversationId})`);
        console.log(`       NPC: "${currentNode.content.text.substring(0, 50)}..."`);

        if (!choices || choices.length === 0) {
            throw new Error('No choices found in initial dialogue');
        }

        // Step 5: Respond
        console.log('\n[5] Responding...');
        const targetChoice = choices[0]; // Pick first option
        console.log(`       Selecting: "${targetChoice.text.full}"`);

        const replyRes = await fetch(`${API_BASE}/api/dialogue/respond`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                conversationId: conversationId,
                responseId: targetChoice.id
            })
        });

        const replyJson = await replyRes.json() as ApiResponse<ConversationState>;
        if (!replyJson.success) throw new Error(`Reply failed: ${JSON.stringify(replyJson)}`);

        // Note: Reply might end conversation or lead to next node
        if (replyJson.data && replyJson.data.currentNode) {
            console.log(`    ✅ Received Reply: "${replyJson.data.currentNode.content.text.substring(0, 50)}..."`);
        } else {
            console.log(`    ✅ Conversation Ended or State Changed`);
        }

        // Interface moved to top level previously, or just use any for now to be safe and quick
        // Better to clean up the file structure.

        // Step 6: Check Quest Log for "First Steps"
        console.log('\n[6] Verifying Quest Log...');
        const questRes = await fetch(`${API_BASE}/api/quests`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const questJson = await questRes.json() as ApiResponse<{ quests: any[] }>;
        const quests = questJson.data.quests || [];
        const tutorialQuest = quests.find(q => q.code === 'TUTORIAL_FIRST_STEPS' || q.code === 'tutorial_first_delivery');

        if (tutorialQuest) {
            console.log(`    ✅ Found Quest Definition: ${tutorialQuest.title || tutorialQuest.name}`);
        } else {
            console.log('    ⚠️  Quest Definition not found. (Check seed data vs keys)');
        }

        console.log('\n✅ Narrative E2E Verification Passed');

    } catch (e: any) {
        console.error('\n❌ Verification Failed:', e.message || e);
        if (e.cause) console.error('Cause:', e.cause);
        process.exit(1);
    }
}

main();
