# SURGE PROTOCOL - Week 3 Implementation Plan

## Week 2 Retrospective & Decisions

### Theme Evaluation Matrix

| Theme | Completeness | Usability | Mood Fit | Tech Debt | Recommendation |
|-------|-------------|-----------|----------|-----------|----------------|
| Neon Decay | 95% | Excellent | High | Low | **PRIMARY** |
| Algorithm Vision | 90% | Good | Excellent | Low | **SECONDARY** |
| Terminal Noir | 85% | Good | High | Low | **TERTIARY** |
| Brutalist Cargo | 80% | Good | Medium | Medium | SITUATIONAL |
| Worn Chrome | 70% | Fair | High | High | DEFER |

### Decision: Theme Strategy

**Primary Theme: Neon Decay**
- Rationale: Most complete component coverage, excellent readability, classic cyberpunk appeal
- Use for: Default experience, marketing materials, onboarding
- Player perception: "This is a cyberpunk game"

**Secondary Theme: Algorithm Vision**
- Rationale: Unique "seeing through the Algorithm's eyes" perspective, strong worldbuilding
- Use for: Algorithm interactions, character analysis, surveillance moments
- Player perception: "The Algorithm is watching me"

**Tertiary Theme: Terminal Noir**
- Rationale: Nostalgic appeal, fits text-based game nature, clean/minimal
- Use for: Inventory management, logs, technical screens
- Player perception: "I'm hacking the system"

**Situational Theme: Brutalist Cargo**
- Rationale: Perfect for delivery-focused screens, industrial authenticity
- Use for: Package manifest, delivery tracking, warehouse screens
- Player perception: "I'm a working courier"

**Deferred: Worn Chrome**
- Rationale: Needs texture assets, sticker library, more development time
- Revisit in: Week 5 or as stretch goal
- Potential: High for character customization screens

---

## Week 3 Goals

### Primary Objective
Connect frontend prototypes to backend API endpoints. Transform static HTML into functional React/Preact components with live data.

### Success Criteria
1. Player can log in and see real character data
2. Mission board displays actual available missions from database
3. Player can accept a mission and see it reflected in UI
4. Algorithm voice displays contextual messages
5. Theme preference persists across sessions

---

## Week 3 Schedule

### Day 1: Project Setup & Architecture

**Morning: Tech Stack Decisions**
- [ ] Choose framework: Preact (lighter) vs React (ecosystem)
- [ ] Set up build tooling (Vite recommended)
- [ ] Configure TypeScript
- [ ] Set up CSS module structure or decide on CSS-in-JS

**Afternoon: Project Scaffolding**
- [ ] Create `/frontend/src/` directory structure
- [ ] Set up component architecture
- [ ] Configure API client for Hono backend
- [ ] Set up state management (Zustand or Jotai - lightweight)

**Deliverable:** Running dev server with basic routing

### Day 2: Core Components Migration

**Morning: Design System Components**
- [ ] Migrate `base.css` tokens to CSS modules/variables
- [ ] Create `<Button>` component with all variants
- [ ] Create `<Card>` component with variants
- [ ] Create `<Progress>` component (HP, Humanity, XP, Time)

**Afternoon: Layout Components**
- [ ] Create `<ThemeProvider>` for theme switching
- [ ] Create `<Layout>` wrapper component
- [ ] Create `<Header>` with character summary
- [ ] Create `<Navigation>` component

**Deliverable:** Component library with Storybook or similar

### Day 3: Dashboard Screen

**Morning: Dashboard Layout**
- [ ] Create `<Dashboard>` page component
- [ ] Implement character header with live data
- [ ] Create `<ResourceBars>` component (HP/Humanity/XP)
- [ ] Add loading states and skeletons

**Afternoon: Dashboard Features**
- [ ] Create `<ActiveMission>` component
- [ ] Create `<MissionList>` preview component
- [ ] Implement `<AlgorithmVoice>` component
- [ ] Connect to character API endpoint

**Deliverable:** Functional dashboard with real character data

### Day 4: Mission System

**Morning: Mission Board**
- [ ] Create `<MissionBoard>` page component
- [ ] Implement mission filtering/search
- [ ] Create `<MissionCard>` component
- [ ] Add mission type badges (routine, gray, escort, etc.)

**Afternoon: Mission Interactions**
- [ ] Implement mission acceptance flow
- [ ] Create `<MissionDetail>` modal/panel
- [ ] Add optimistic UI updates
- [ ] Handle error states

**Deliverable:** Working mission board with accept functionality

### Day 5: Algorithm Integration

**Morning: Algorithm Voice System**
- [ ] Create `<AlgorithmMessage>` component variants
- [ ] Implement humanity-based tone variations
- [ ] Create typing/reveal animation
- [ ] Build message queue system

**Afternoon: Algorithm Interactions**
- [ ] Create `<AlgorithmPrompt>` with response options
- [ ] Implement response handling
- [ ] Add Algorithm presence indicators
- [ ] Create notification toast system

**Deliverable:** Interactive Algorithm voice with personality

### Day 6: Character & Inventory

**Morning: Character Screen**
- [ ] Create `<CharacterDetail>` page
- [ ] Implement attribute display
- [ ] Create `<AugmentationSlot>` component
- [ ] Add faction standing display

**Afternoon: Inventory System**
- [ ] Create `<Inventory>` page component
- [ ] Implement item grid/list views
- [ ] Create `<ItemDetail>` panel
- [ ] Add use/equip/drop actions

**Deliverable:** Character and inventory screens with basic functionality

### Day 7: Polish & Integration

**Morning: Theme System**
- [ ] Implement theme persistence (localStorage)
- [ ] Add theme transition animations
- [ ] Test all components in all themes
- [ ] Fix any theme-specific issues

**Afternoon: Final Integration**
- [ ] End-to-end testing
- [ ] Performance audit
- [ ] Accessibility audit
- [ ] Documentation update

**Deliverable:** Polished, functional frontend ready for playtesting

---

## Technical Architecture

### Recommended Stack

```
Frontend Framework: Preact + Preact Signals
Build Tool: Vite
Styling: CSS Modules + CSS Custom Properties
State: Preact Signals (local) + API cache
Routing: Preact Router or Wouter
API Client: Custom fetch wrapper with TypeScript
```

### Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # Base UI components
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Progress/
│   │   │   └── ...
│   │   ├── layout/       # Layout components
│   │   │   ├── Header/
│   │   │   ├── Navigation/
│   │   │   └── ThemeProvider/
│   │   └── features/     # Feature-specific components
│   │       ├── Algorithm/
│   │       ├── Mission/
│   │       ├── Character/
│   │       └── Inventory/
│   ├── pages/
│   │   ├── Dashboard/
│   │   ├── Missions/
│   │   ├── Character/
│   │   └── Inventory/
│   ├── hooks/
│   │   ├── useCharacter.ts
│   │   ├── useMissions.ts
│   │   └── useTheme.ts
│   ├── api/
│   │   ├── client.ts
│   │   ├── character.ts
│   │   └── missions.ts
│   ├── styles/
│   │   ├── tokens/
│   │   └── themes/
│   ├── types/
│   └── utils/
├── public/
└── index.html
```

### API Endpoints Needed

Based on frontend requirements:

```typescript
// Character
GET  /api/character              // Get current character
GET  /api/character/stats        // Get detailed stats
POST /api/character/action       // Perform character action

// Missions
GET  /api/missions               // List available missions
GET  /api/missions/:id           // Get mission details
POST /api/missions/:id/accept    // Accept a mission
POST /api/missions/:id/complete  // Complete a mission
POST /api/missions/:id/abandon   // Abandon a mission

// Algorithm
GET  /api/algorithm/message      // Get contextual message
POST /api/algorithm/respond      // Respond to Algorithm prompt

// Inventory
GET  /api/inventory              // Get inventory items
POST /api/inventory/:id/use      // Use an item
POST /api/inventory/:id/equip    // Equip an item
POST /api/inventory/:id/drop     // Drop an item
```

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| API not ready | Create mock API layer, swap later |
| Performance issues | Use virtual scrolling for lists, lazy load themes |
| Theme conflicts | Strict CSS scoping with modules |
| State complexity | Start simple, add complexity as needed |

### Design Risks

| Risk | Mitigation |
|------|------------|
| Theme inconsistency | Component-level theme testing |
| Mobile responsiveness | Mobile-first development |
| Accessibility gaps | Automated a11y testing in CI |

---

## Definition of Done (Week 3)

- [ ] All pages render with real or mocked data
- [ ] Theme switching works and persists
- [ ] No console errors in production build
- [ ] Lighthouse performance score > 80
- [ ] All interactive elements keyboard accessible
- [ ] Loading and error states for all async operations
- [ ] Basic error boundary implementation
- [ ] Documentation for component usage

---

## Notes for Future Shards

### What's Working Well
- CSS custom properties for theming (keep this pattern)
- BEM-inspired naming (consistent, readable)
- Component-first development (reusable)
- Design token tests (catches regressions)

### What Needs Attention
- Worn Chrome theme needs texture assets
- Terminal Noir ASCII effects need performance testing
- Algorithm Vision scan animations may need throttling
- Brutalist Cargo needs barcode font loading strategy

### Don't Break
- `base.css` token structure
- Theme variable naming conventions
- Pre-commit validation hooks
- Accessibility attributes on interactive elements
