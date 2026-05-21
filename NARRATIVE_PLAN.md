# Narrative Engine Implementation Plan

## Goal
Extract dialogue and narrative logic from `src/api/dialogue/index.ts` into a dedicated `NarrativeService` to improve maintainability and testability.

## Strategy
We will use a "Shift and Replace" strategy:
1.  Define shared types in `src/services/narrative/types.ts`.
2.  Implement `NarrativeService` in `src/services/narrative/engine.ts` by copying and adapting logic from the API.
3.  Replace API route logic with calls to `NarrativeService`.
4.  Verify using *existing* integration tests (`tests/integration/dialogue.test.ts`) which should pass without modification if the refactor is successful.

## Proposed Changes

### [New File] src/services/narrative/types.ts
- Extract interfaces: `DialogueTree`, `DialogueNode`, `DialogueResponse`, `ConversationState` from `src/api/dialogue/index.ts`.
- Ensure alignment with DB schema.

### [New File] src/services/narrative/engine.ts
- Class `NarrativeService`
- Methods:
    - `listTrees(filters)`
    - `getTree(id)`
    - `startConversation(characterId, treeId)`
    - `getConversationState(stateId)`
    - `submitResponse(conversationId, responseId)`
    - `exitConversation(conversationId)`
    - `getHistory(characterId)`
    - `getFlags(characterId)`
- Logic will handle DB queries, state updates, validation, and complex logical checks (skill checks, conditions).

### [Refactor] src/api/dialogue/index.ts
- Remove inline DB logic.
- Instantiate `NarrativeService`.
- Delegate request handling to service methods.

## Verification
- **Test Command**: `npx vitest run tests/integration/dialogue.test.ts`
- **Success Criteria**: All existing integration tests pass.
