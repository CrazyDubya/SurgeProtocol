# SURGE PROTOCOL: Frontend Week 4 Plan
## Backend Integration & Production Readiness

---

## Current State Assessment

### Completed (Weeks 1-3)
- ✅ 5 visual themes with comprehensive design tokens
- ✅ Core UI components (Button, Card, Progress, Badge, Stat, Skeleton)
- ✅ Game components (CharacterStatus, MissionCard, AlgorithmPanel, etc.)
- ✅ All pages (Dashboard, Missions, Algorithm, Character, Inventory)
- ✅ Navigation, theme switching, page transitions
- ✅ API client foundation (`frontend/src/api/client.ts`)
- ✅ Type definitions (`frontend/src/types/index.ts`)

### Infrastructure Ready
- ✅ Cloudflare Workers config (`wrangler.toml`)
- ✅ D1 database migrations (10 migration files)
- ✅ Hono dependency installed
- ❌ Backend implementation (no `src/index.ts`)
- ❌ Global state management
- ❌ Real API integration

---

## Week 4 Schedule

### Day 1: State Management Architecture
**Goal:** Create reactive global state with Preact Signals

**Tasks:**
1. Create store architecture in `frontend/src/stores/`
2. Implement core stores:
   - `characterStore.ts` - Player character state
   - `missionStore.ts` - Active/available missions
   - `inventoryStore.ts` - Items and equipment
   - `algorithmStore.ts` - AI handler messages
   - `uiStore.ts` - Theme, loading states, modals
3. Add localStorage persistence for critical state
4. Create `useStore` hooks for component consumption

**Files to create:**
```
frontend/src/stores/
├── index.ts
├── characterStore.ts
├── missionStore.ts
├── inventoryStore.ts
├── algorithmStore.ts
├── uiStore.ts
└── persistence.ts
```

---

### Day 2: API Service Layer
**Goal:** Type-safe API services with error handling

**Tasks:**
1. Create service modules in `frontend/src/api/`
2. Implement services:
   - `characterService.ts` - CRUD for character data
   - `missionService.ts` - Mission listing, accept, complete
   - `inventoryService.ts` - Item management
   - `algorithmService.ts` - Message exchange
3. Add request/response type validation
4. Implement retry logic with exponential backoff
5. Create API hooks with loading/error states

**Files to create:**
```
frontend/src/api/
├── client.ts (existing)
├── index.ts
├── characterService.ts
├── missionService.ts
├── inventoryService.ts
├── algorithmService.ts
└── hooks/
    ├── useCharacter.ts
    ├── useMissions.ts
    ├── useInventory.ts
    └── useAlgorithm.ts
```

---

### Day 3: Backend Foundation
**Goal:** Hono API server with D1 database

**Tasks:**
1. Create `src/index.ts` with Hono app
2. Set up middleware (CORS, auth placeholder, error handling)
3. Create route structure:
   ```
   /api/v1/characters/*
   /api/v1/missions/*
   /api/v1/inventory/*
   /api/v1/algorithm/*
   ```
4. Implement character endpoints:
   - `GET /characters/me` - Current character
   - `POST /characters` - Create character
   - `PATCH /characters/me` - Update character
5. Set up D1 database queries
6. Test with `wrangler dev`

**Files to create:**
```
src/
├── index.ts
├── routes/
│   ├── characters.ts
│   ├── missions.ts
│   ├── inventory.ts
│   └── algorithm.ts
├── middleware/
│   ├── auth.ts
│   ├── cors.ts
│   └── error.ts
├── db/
│   └── queries.ts
└── types.ts
```

---

### Day 4: Backend - Missions & Inventory
**Goal:** Complete REST API for game features

**Tasks:**
1. Implement mission endpoints:
   - `GET /missions` - List available missions
   - `GET /missions/:id` - Mission details
   - `POST /missions/:id/accept` - Accept mission
   - `POST /missions/:id/complete` - Complete mission
   - `POST /missions/:id/abandon` - Abandon mission
2. Implement inventory endpoints:
   - `GET /inventory` - List items
   - `POST /inventory/use/:itemId` - Use item
   - `POST /inventory/equip/:itemId` - Equip item
   - `POST /inventory/drop/:itemId` - Drop item
3. Seed test data for development

---

### Day 5: Frontend-Backend Integration
**Goal:** Connect frontend to live API

**Tasks:**
1. Replace mock data in pages with API hooks
2. Update stores to sync with API responses
3. Implement optimistic updates for better UX
4. Add error boundaries for failed requests
5. Create connection status indicator
6. Test full data flow:
   - Dashboard loads character + missions
   - Missions page filters from API
   - Inventory syncs with backend

---

### Day 6: Testing & Validation
**Goal:** Test coverage for critical paths

**Tasks:**
1. Set up Vitest for frontend
2. Write component tests:
   - UI components (Button, Card, etc.)
   - Game components (MissionCard, CharacterStatus)
3. Write store tests:
   - State mutations
   - Persistence
4. Write integration tests:
   - API service mocking
   - Full page renders
5. Add API contract tests (backend)

**Test targets:**
- UI Components: 80% coverage
- Stores: 90% coverage
- API Services: 100% coverage

---

### Day 7: Performance & Accessibility
**Goal:** Production-ready optimization

**Tasks:**
1. **Code Splitting:**
   - Lazy load pages
   - Dynamic imports for heavy components
2. **Bundle Analysis:**
   - Run `vite-bundle-visualizer`
   - Identify and eliminate bloat
3. **Performance:**
   - Add `useMemo`/`useCallback` where needed
   - Optimize re-renders with signals
4. **Accessibility:**
   - Audit with axe-core
   - Add ARIA labels
   - Keyboard navigation
   - Focus management
5. **Final Polish:**
   - Error boundaries
   - 404 handling
   - Loading states everywhere

---

## Technical Decisions

### State Management: Preact Signals
**Why:** Native Preact integration, fine-grained reactivity, minimal bundle size
**Alternative considered:** Zustand (larger bundle, not Preact-native)

### Backend: Cloudflare Workers + Hono
**Why:** Already configured, edge deployment, D1 database ready
**Alternative considered:** Node.js/Express (more complex deployment)

### Testing: Vitest
**Why:** Vite-native, fast, compatible with Preact
**Alternative considered:** Jest (slower, requires more config)

### API Pattern: Service + Hooks
**Why:** Separation of concerns, reusable, testable
**Pattern:**
```typescript
// Service handles API calls
const characterService = {
  getCharacter: () => api.get('/characters/me'),
  updateCharacter: (data) => api.patch('/characters/me', data),
};

// Hook handles state integration
function useCharacter() {
  const [loading, setLoading] = useState(true);
  const character = characterStore.character;

  useEffect(() => {
    characterService.getCharacter()
      .then(data => characterStore.setCharacter(data))
      .finally(() => setLoading(false));
  }, []);

  return { character, loading };
}
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Lighthouse Performance | > 90 |
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Bundle Size (gzipped) | < 100KB |
| Test Coverage | > 80% |
| Accessibility Score | 100 |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| D1 database issues | Local SQLite fallback for dev |
| API latency | Optimistic updates, skeleton loading |
| Auth complexity | Start with mock auth, add Clerk later |
| Scope creep | Strict daily goals, no feature additions |

---

## Dependencies to Install

### Frontend
```bash
cd frontend
npm install @preact/signals vitest @testing-library/preact jsdom
```

### Backend
```bash
npm install # Already has hono
npm install -D vitest
```

---

## Notes

- Mock auth for Week 4; real auth (Clerk) in Week 5
- WebSocket deferred to Week 5 (focus on REST first)
- Mobile optimization in Week 5
- Algorithm AI responses mocked; real AI in later phase
