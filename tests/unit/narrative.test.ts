import { describe, it, expect, beforeEach } from 'vitest';
import { NarrativeService } from '../../src/services/narrative/engine';
import { createMockEnv, type MockEnv } from '../helpers/mock-env';

describe('NarrativeService', () => {
    let env: MockEnv;
    let service: NarrativeService;

    beforeEach(() => {
        env = createMockEnv();
        service = new NarrativeService(env.DB, env.CACHE);

        // Seed basic character
        env.DB._seed('characters', [{ id: 'char-1', name: 'Test Char', user_id: 'user-1' }]);

        // Seed basic tree
        env.DB._seed('dialogue_trees', [{
            id: 'tree-1',
            code: 'TEST_TREE',
            name: 'Test Tree',
            root_node_id: 'node-1',
            greeting_node_id: 'node-1',
            has_skill_checks: 0,
            has_reputation_gates: 0,
            has_romance_content: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }]);

        // Seed nodes
        env.DB._seed('dialogue_nodes', [
            {
                id: 'node-1',
                tree_id: 'tree-1',
                node_type: 'NPC_LINE',
                text: 'Hello!',
                responses: JSON.stringify(['resp-1']),
                is_hub: 0,
                is_exit: 0,
                auto_advance: 0
            },
            {
                id: 'node-2',
                tree_id: 'tree-1',
                node_type: 'NPC_LINE',
                text: 'Goodbye!',
                responses: JSON.stringify([]),
                is_hub: 0,
                is_exit: 1,
                auto_advance: 0
            }
        ]);

        // Seed responses
        env.DB._seed('dialogue_responses', [
            {
                id: 'resp-1',
                node_id: 'node-1',
                display_order: 1,
                text: 'Hi there',
                leads_to_node_id: 'node-2',
                ends_conversation: 0,
                is_skill_check: 0
            }
        ]);
    });

    it('should list trees', async () => {
        const result = await service.listTrees({});
        expect(result.trees).toHaveLength(1);
        expect(result.trees[0].id).toBe('tree-1');
    });

    it('should start conversation', async () => {
        const result = await service.startConversation('char-1', 'tree-1');
        expect(result.conversationId).toBeDefined();
        expect(result.tree.id).toBe('tree-1');
        expect(result.currentNode.id).toBe('node-1');
    });

    it('should submit response and advance', async () => {
        const start = await service.startConversation('char-1', 'tree-1');
        const result = await service.submitResponse(start.conversationId, 'resp-1');

        expect(result.success).toBe(true);
        expect(result.nextNode).toBeDefined();
        expect(result.nextNode?.id).toBe('node-2');
        expect(result.conversationEnded).toBe(false); // node-2 is exit node, but response didn't end convo immediately

        // Verify state update
        const state = await service.getConversationState(start.conversationId);
        expect(state?.currentNode?.id).toBe('node-2');
    });

    it('should handle exit correctly', async () => {
        const start = await service.startConversation('char-1', 'tree-1');
        const result = await service.exitConversation(start.conversationId);

        expect(result.exitedEarly).toBe(true);

        const state = await service.getConversationState(start.conversationId);
        expect(state?.isActive).toBe(false);
    });
});
