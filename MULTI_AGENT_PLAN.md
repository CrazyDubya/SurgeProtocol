# Multi-Agent Implementation Plan for Surge Protocol

## 1. Project Status Overview

**Current State**: Phase 2 (Core Systems) complete, Phase 3 (Real-time) partially complete.
**Next Milestone**: Complete Real-time initialization, fill Content gaps (Weeks 2-4), and refactor for scalability.

| System | Status | Notes |
|---|---|---|
| **Foundation** | ✅ Complete | D1, Auth, API Router, basic Services (Rating, Mission) |
| **Economy** | ✅ Complete | Transactions, vendors, logic in Services |
| **Realtime** | ⚠️ In Progress | `WarTheater` DO implemented. Combat DO exists. |
| **Faction** | ⚠️ Partial | Logic exists but buried in API handlers. Needs extraction to Service. |
| **Narrative** | ⚠️ Partial | Basic dialogue exists. Logic likely in API/Utils. Needs dedicated Service. |
| **Content** | 🚧 Started | Tier 0-1 seeded. Tiers 2-10 missing. |
| **Frontend** | ❌ Not Started | No frontend implementation found in `src`. |

---

## 2. Multi-Agent Work Allocation

This plan divides the remaining work into four distinct "Agent Personas" to allow parallel execution.

### 🤖 Agent A: The Architect (Refactoring & Backend Core)
**Goal**: Ensure clean architecture by moving logic from API handlers to dedicated Services.

*   **Task A1 (Faction Service)**: Extract logic from `src/api/faction/index.ts` into `src/services/faction/reputation.ts` and `territory.ts`.
*   **Task A2 (Narrative Service)**: Create `src/services/narrative/engine.ts` to handle dialogue tree traversal and flag management (currently missing or scattered).
*   **Task A3 (Status Service)**: Implement `src/services/status/addiction.ts` and `condition.ts` (currently missing).
*   **Task A4 (Validation)**: Ensure all new Services have Zod validation and Unit Tests.

### 🤖 Agent B: The Scribe (Content & Seeding)
**Goal**: Translate the rich Markdown narrative documentation into JSON seed data.

*   **Task B1 (Parsers)**: Create robust scripts in `scripts/parsers/` to convert `surge-narrative/*.md` files into JSON.
*   **Task B2 (Week 2 Content)**: Parse Tier 1-3 NPCs, Quests, and Dialogues.
*   **Task B3 (Week 3 Content)**: Parse Faction descriptions, War definitions, and Mid-game items.
*   **Task B4 (Verification)**: Run `scripts/seed-db.ts` to verify data integrity and foreign key relationships.

### 🤖 Agent C: The Operator (Real-time & DevOps)
**Goal**: Finalize and harden the Durable Objects and deployment infrastructure.

*   **Task C1 (Combat DO)**: Verify `src/realtime/combat.ts` implements full turn-based logic (initiative, damage, state).
*   **Task C2 (War DO)**: Write integration tests for `WarTheater` to simulate a full war cycle (Escalation -> Conflict -> Resolution).
*   **Task C3 (Monitoring)**: Implement `src/services/monitoring/health.ts` and the `scripts/realtime-monitor.sh`.
*   **Task C4 (WebSockets)**: Create a test client (CLI or simple HTML) to verify WebSocket connectivity and message handling.

### 🤖 Agent D: The Interface (Frontend & Client)
**Goal**: Build the client-facing application to consume the API.

*   **Task D1 (Setup)**: Initialize the frontend project (likely Vite + React/Preact as per `IMPLEMENTATION_PLAN.md`).
*   **Task D2 (API Client)**: Generate a typed API client from the Hono/Zod schemas.
*   **Task D3 (Auth Flow)**: Implement Login/Register screens.
*   **Task D4 (Dashboard)**: Create the main "Courier Dashboard" showing Rating, Credits, and Active Missions.

---

## 3. Execution Sequence

### Phase 1: Cleanup & Prep (Agents A & B)
1.  **Agent A** refactors `Faction` logic.
2.  **Agent B** creates the `NPC` markdown parser.

### Phase 2: Core Expansion (Agents A, B, C)
1.  **Agent A** implements `Narrative` service.
2.  **Agent B** generates `Tier 1-3` JSON data.
3.  **Agent C** verifies `CombatSession` DO with tests.

### Phase 3: Integration (Agents C & D)
1.  **Agent C** sets up WebSocket endpoints.
2.  **Agent D** builds the shell UI and connects Auth.

## 4. Verification Plan

*   **Automated Tests**: Run `npm test` after every Service refactor.
*   **Schema Check**: Run `npm run lint:schema` to verify Zod <-> Database alignment.
*   **Seed Check**: Run `wrangler d1 execute ...` to reset DB and `npm run seed` to ensure all JSON data loads correctly.
