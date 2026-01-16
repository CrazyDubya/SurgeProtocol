# SURGE PROTOCOL: Frontend Week 4 Plan (REVISED)
## Backend Integration & Production Readiness

**Updated:** Backend team has implemented comprehensive API - focus shifts to integration!

---

## Backend API Summary (Already Implemented!)

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get JWT tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Invalidate session

### Characters (`/api/characters`)
- `POST /api/characters` - Create character (max 3)
- `GET /api/characters` - List user's characters
- `GET /api/characters/:id` - Get character details + attributes
- `PATCH /api/characters/:id` - Update character
- `POST /api/characters/:id/select` - Select active character (returns new JWT)
- `GET /api/characters/:id/stats` - Full stats (attributes, skills, equipped, conditions)
- `GET /api/characters/:id/inventory` - Inventory + finances
- `GET /api/characters/:id/factions` - Faction standings

### Missions (`/api/missions`)
- `GET /api/missions/available` - Missions for character's tier
- `GET /api/missions/active` - Current active mission
- `POST /api/missions/:id/accept` - Accept mission
- `POST /api/missions/:id/action` - Take action (MOVE, INTERACT, COMBAT, etc.)
- `POST /api/missions/:id/complete` - Complete mission
- `POST /api/missions/:id/abandon` - Abandon mission

### Economy (`/api/economy`)
- `GET /api/economy/vendors` - List vendors
- `GET /api/economy/vendors/:id` - Vendor inventory
- `POST /api/economy/vendors/:id/buy` - Buy item (rate limited)
- `POST /api/economy/vendors/:id/sell` - Sell item (rate limited)
- `POST /api/economy/vendors/:id/haggle` - Haggle price (rate limited)
- `POST /api/economy/transfer` - Transfer credits (rate limited)

### Real-time (Durable Objects + WebSocket)
- `GET /ws/combat/:combatId` - Combat session WebSocket
- `GET /ws/war/:warId` - War theater WebSocket
- `GET /ws/world` - World clock WebSocket
- REST endpoints: `/api/combat/:id/*`, `/api/world/*`, `/api/wars/:id/*`

---

## Revised Week 4 Schedule

### Day 1: Authentication Flow
**Goal:** Implement login/register and JWT token management

**Tasks:**
1. Update API client with JWT token handling
   - Store tokens in localStorage
   - Auto-attach Authorization header
   - Handle 401 responses with token refresh
2. Create auth store with Preact Signals
   - `isAuthenticated`, `user`, `activeCharacter`
3. Build auth pages:
   - Login page
   - Register page
   - Character select page
4. Add protected route wrapper

**Files to create:**
```
frontend/src/
├── api/
│   └── client.ts (update with auth)
├── stores/
│   ├── index.ts
│   └── authStore.ts
├── pages/
│   ├── Login/
│   ├── Register/
│   └── CharacterSelect/
└── components/layout/
    └── ProtectedRoute.tsx
```

---

### Day 2: State Management Architecture
**Goal:** Create reactive global stores matching backend data

**Tasks:**
1. Implement core stores with Preact Signals:
   - `characterStore.ts` - Character data, attributes, skills
   - `missionStore.ts` - Available/active missions
   - `inventoryStore.ts` - Items, equipment, finances
   - `uiStore.ts` - Theme, loading, modals, toasts
2. Add persistence layer for offline support
3. Create computed signals for derived data
4. Add store hydration from API

**Store Structure:**
```typescript
// characterStore.ts
export const characterStore = {
  character: signal<Character | null>(null),
  attributes: signal<Attribute[]>([]),
  skills: signal<Skill[]>([]),
  factions: signal<FactionStanding[]>([]),
  isLoading: signal(false),
  error: signal<string | null>(null),

  // Actions
  fetchCharacter: async (id: string) => {...},
  selectCharacter: async (id: string) => {...},
};
```

---

### Day 3: API Service Layer
**Goal:** Type-safe services matching backend endpoints

**Tasks:**
1. Create service modules:
   - `authService.ts` - Login, register, refresh, logout
   - `characterService.ts` - All character endpoints
   - `missionService.ts` - Mission CRUD + actions
   - `economyService.ts` - Vendors, buy, sell, haggle
2. Add response type validation
3. Implement error handling with typed errors
4. Add request retry with exponential backoff
5. Create API hooks connecting services to stores

**API Response Types:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errors?: Array<{ code: string; message: string }>;
}
```

---

### Day 4: Dashboard & Character Integration
**Goal:** Connect Dashboard and Character pages to live API

**Tasks:**
1. Update Dashboard page:
   - Load character from API on mount
   - Fetch available missions
   - Show real faction standings
   - Display actual credits/stats
2. Update Character page:
   - Show live attributes from `/characters/:id/stats`
   - Display real augmentations
   - Show faction standings from `/characters/:id/factions`
3. Add loading skeletons during fetch
4. Handle error states gracefully
5. Implement optimistic updates where sensible

---

### Day 5: Missions & Inventory Integration
**Goal:** Connect remaining pages to live API

**Tasks:**
1. Update Missions page:
   - Fetch from `/missions/available`
   - Show active mission from `/missions/active`
   - Implement accept/abandon actions
   - Add mission action buttons (when active)
2. Update Inventory page:
   - Fetch from `/characters/:id/inventory`
   - Show real items and finances
   - Connect to economy endpoints for buy/sell
3. Update Algorithm page:
   - Prepare for future AI integration
   - Mock responses for now
4. Test full user flow:
   - Login → Select character → View dashboard → Accept mission

---

### Day 6: Testing & Error Handling
**Goal:** Test coverage and robust error handling

**Tasks:**
1. Set up Vitest for frontend
2. Write tests:
   - Auth flow (login, logout, token refresh)
   - Store actions and state changes
   - API service mocking
   - Component renders with mock data
3. Add global error boundary
4. Create toast notification system for errors
5. Add retry UI for failed requests
6. Test offline behavior

**Test Coverage Targets:**
- Auth flow: 100%
- Stores: 90%
- Services: 100%
- Components: 80%

---

### Day 7: Performance & Production Readiness
**Goal:** Optimize for production deployment

**Tasks:**
1. **Code Splitting:**
   - Lazy load pages with `React.lazy` equivalent
   - Split large components
2. **Bundle Optimization:**
   - Analyze with `vite-bundle-visualizer`
   - Tree-shake unused code
3. **API Optimization:**
   - Add request deduplication
   - Implement stale-while-revalidate caching
4. **Accessibility:**
   - Audit with axe-core
   - Fix all critical issues
   - Test keyboard navigation
5. **Final Polish:**
   - Verify all error states
   - Test all themes
   - Mobile responsiveness check

---

## Updated Technical Architecture

### API Client with JWT
```typescript
// Automatic token refresh on 401
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = authStore.accessToken.value;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    const refreshed = await authService.refreshToken();
    if (refreshed) {
      return request(endpoint, options); // Retry with new token
    }
    authStore.logout();
    throw new AuthError('Session expired');
  }

  // ... rest of handling
}
```

### Store Pattern with Signals
```typescript
import { signal, computed } from '@preact/signals';

export const missionStore = {
  // State
  available: signal<Mission[]>([]),
  active: signal<Mission | null>(null),
  isLoading: signal(false),

  // Computed
  canAcceptNew: computed(() => !missionStore.active.value),

  // Actions
  async fetchAvailable() {
    this.isLoading.value = true;
    try {
      const response = await missionService.getAvailable();
      this.available.value = response.data.missions;
    } finally {
      this.isLoading.value = false;
    }
  },

  async accept(missionId: string) {
    const response = await missionService.accept(missionId);
    this.active.value = response.data.mission;
    // Remove from available
    this.available.value = this.available.value.filter(m => m.id !== missionId);
  },
};
```

---

## Dependencies to Install

```bash
cd frontend
npm install @preact/signals zod
npm install -D vitest @testing-library/preact jsdom happy-dom
```

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Lighthouse Performance | > 90 | TBD |
| Bundle Size (gzipped) | < 100KB | 41.54 KB |
| Test Coverage | > 80% | 0% |
| API Integration | 100% | 0% |
| Auth Flow Complete | Yes | No |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Backend not running | Use mock responses during dev |
| Token expiration edge cases | Comprehensive refresh logic |
| Real-time features | Defer WebSocket to Week 5 |
| Type mismatches | Zod validation at boundaries |

---

## Deferred to Week 5
- WebSocket real-time updates
- Combat Durable Object integration
- War Theater features
- World Clock sync
- Mobile-specific optimizations
- AI Algorithm responses
