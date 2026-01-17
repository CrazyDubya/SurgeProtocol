# SURGE PROTOCOL: Frontend Week 2 Schedule
## Prototype Development & Design System Hardening

---

# OVERVIEW

**Goal**: Develop full prototypes for Tier 1 concepts while establishing guardrails to prevent design system degradation.

**Key Principles**:
1. Build with validation from day one
2. Code reviews at every checkpoint
3. Tests that catch regressions before they merge
4. Documentation that future shards can reference

---

# WEEK 2 SCHEDULE

## Day 1 (Monday): Foundation & Guards

### Morning: Design System Hardening
| Time | Task | Deliverable |
|------|------|-------------|
| 2hr | Create design token validation tests | `tests/design-tokens.test.js` |
| 1hr | Set up CSS linting rules | `.stylelintrc.json` |
| 1hr | Create pre-commit hooks for frontend | `scripts/validate-frontend.js` |

### Afternoon: Documentation & Rules
| Time | Task | Deliverable |
|------|------|-------------|
| 2hr | Document design system constraints | `frontend/DESIGN_SYSTEM.md` |
| 1hr | Create component naming conventions | Part of DESIGN_SYSTEM.md |
| 1hr | **CODE REVIEW CHECKPOINT #1** | Self-review of guards |

### Day 1 Exit Criteria
- [ ] All design tokens have validation tests
- [ ] Pre-commit hooks catch invalid CSS
- [ ] Design system rules documented
- [ ] Hooks integrated with existing git workflow

---

## Day 2 (Tuesday): Tier 1 - Neon Decay Deep Dive

### Morning: Core Components
| Time | Task | Deliverable |
|------|------|-------------|
| 1hr | Card component variations | `frontend/components/card/` |
| 1hr | Button system (states, variants) | `frontend/components/button/` |
| 1hr | Progress bars (HP, Humanity, XP) | `frontend/components/progress/` |
| 1hr | Input fields & forms | `frontend/components/input/` |

### Afternoon: Screen Prototypes
| Time | Task | Deliverable |
|------|------|-------------|
| 2hr | Dashboard/HUD screen | `frontend/screens/dashboard.html` |
| 1hr | Mission board screen | `frontend/screens/missions.html` |
| 1hr | **CODE REVIEW CHECKPOINT #2** | Component consistency check |

### Day 2 Exit Criteria
- [ ] 8+ reusable components built
- [ ] 2 complete screen prototypes
- [ ] All components pass validation tests
- [ ] Consistent naming and structure

---

## Day 3 (Wednesday): Tier 1 - Algorithm Vision Deep Dive

### Morning: Specialized Components
| Time | Task | Deliverable |
|------|------|-------------|
| 1hr | Target bracket system | `frontend/components/target/` |
| 1hr | Threat indicator variants | `frontend/components/threat/` |
| 1hr | Biometric readout panels | `frontend/components/biometric/` |
| 1hr | Scan line effects | `frontend/components/effects/` |

### Afternoon: Screen Prototypes
| Time | Task | Deliverable |
|------|------|-------------|
| 2hr | Combat screen (Algorithm POV) | `frontend/screens/combat.html` |
| 1hr | Character analysis screen | `frontend/screens/character.html` |
| 1hr | **CODE REVIEW CHECKPOINT #3** | Theme consistency check |

### Day 3 Exit Criteria
- [ ] Algorithm Vision components complete
- [ ] Combat screen demonstrates HUD aesthetic
- [ ] Theme can switch cleanly from Neon Decay
- [ ] No shared component breakage

---

## Day 4 (Thursday): Tier 1 - Terminal Noir Deep Dive

### Morning: ASCII Components
| Time | Task | Deliverable |
|------|------|-------------|
| 1hr | ASCII box drawing system | `frontend/components/ascii-box/` |
| 1hr | Typewriter text effect | `frontend/components/typewriter/` |
| 1hr | Terminal input prompts | `frontend/components/terminal/` |
| 1hr | CRT screen effects | `frontend/components/crt/` |

### Afternoon: Screen Prototypes
| Time | Task | Deliverable |
|------|------|-------------|
| 2hr | Algorithm conversation screen | `frontend/screens/algorithm.html` |
| 1hr | Inventory/gear screen | `frontend/screens/inventory.html` |
| 1hr | **CODE REVIEW CHECKPOINT #4** | All 3 themes comparison |

### Day 4 Exit Criteria
- [ ] Terminal Noir aesthetic complete
- [ ] ASCII styling works without breaking layouts
- [ ] CRT effects performant (no jank)
- [ ] All 3 themes working on all screens

---

## Day 5 (Friday): Tier 2 Exploration & Integration

### Morning: Tier 2 Quick Prototypes
| Time | Task | Deliverable |
|------|------|-------------|
| 1.5hr | Worn Chrome - key elements | `frontend/styles/themes/worn-chrome.css` |
| 1.5hr | Brutalist Cargo - key elements | `frontend/styles/themes/brutalist-cargo.css` |
| 1hr | Integration with existing components | Update base components |

### Afternoon: Cross-Theme Testing
| Time | Task | Deliverable |
|------|------|-------------|
| 1hr | Visual regression testing setup | `tests/visual-regression/` |
| 1hr | Mobile responsiveness audit | Fix any breakages |
| 1hr | Performance profiling | Optimize heavy effects |
| 1hr | **CODE REVIEW CHECKPOINT #5** | Full system review |

### Day 5 Exit Criteria
- [ ] 5 themes available (3 Tier 1 + 2 Tier 2)
- [ ] All screens work on mobile
- [ ] No performance regressions
- [ ] Visual regression tests in place

---

## Day 6 (Saturday): Refinement & Polish

### Morning: Animation & Interaction
| Time | Task | Deliverable |
|------|------|-------------|
| 2hr | Micro-interactions (hover, focus, active) | Component updates |
| 1hr | Page transitions | `frontend/styles/transitions.css` |
| 1hr | Loading states | `frontend/components/loading/` |

### Afternoon: Accessibility & Documentation
| Time | Task | Deliverable |
|------|------|-------------|
| 1hr | Accessibility audit (WCAG 2.1 AA) | Fix any issues |
| 1hr | Update design system docs | `frontend/DESIGN_SYSTEM.md` |
| 1hr | Create component showcase | `frontend/showcase.html` |
| 1hr | **CODE REVIEW CHECKPOINT #6** | Final review |

### Day 6 Exit Criteria
- [ ] All interactions feel polished
- [ ] Accessibility standards met
- [ ] Documentation complete
- [ ] Showcase demonstrates all components

---

## Day 7 (Sunday): Decision & Week 3 Prep

### Morning: Evaluation
| Time | Task | Deliverable |
|------|------|-------------|
| 1hr | Compare all themes side-by-side | Decision matrix |
| 1hr | Gather any feedback | Notes document |
| 1hr | Narrow to 2-3 finalists | Updated recommendations |

### Afternoon: Week 3 Planning
| Time | Task | Deliverable |
|------|------|-------------|
| 1hr | Plan backend integration points | `FRONTEND_WEEK3_PLAN.md` |
| 1hr | Identify remaining screens to build | Screen list |
| 1hr | Create component API specifications | For backend connection |
| 1hr | **FINAL CHECKPOINT** | Week 2 summary |

### Day 7 Exit Criteria
- [ ] Clear winner(s) identified
- [ ] Week 3 plan documented
- [ ] All code committed and pushed
- [ ] Ready for backend integration

---

# CODE REVIEW CHECKPOINTS

## Checkpoint Structure

Each checkpoint follows this process:

### 1. Self-Review Checklist
```markdown
- [ ] All new files follow naming conventions
- [ ] CSS uses only defined tokens (no magic numbers)
- [ ] Components work in all 3+ themes
- [ ] No console errors or warnings
- [ ] Mobile responsive
- [ ] Accessibility attributes present
- [ ] Tests pass
```

### 2. Automated Checks
```bash
# Run before each checkpoint
npm run lint:css          # Stylelint
npm run test:tokens       # Token validation
npm run test:components   # Component tests
npm run validate:themes   # Theme consistency
```

### 3. Visual Inspection
- Toggle between all themes
- Test on mobile viewport
- Check animations (smooth, no jank)
- Verify text readability

### 4. Documentation Check
- New components documented
- Examples provided
- Constraints noted

---

# PROTECTION MECHANISMS

## 1. Design Token Validation

Tests that ensure tokens are used correctly:

```javascript
// tests/design-tokens.test.js
- All color values reference CSS variables
- No hardcoded pixel values outside tokens
- Font families use token references
- Spacing uses scale values only
```

## 2. Pre-Commit Hooks

Hooks that run before every commit:

```javascript
// scripts/validate-frontend.js
- CSS linting (stylelint)
- Token usage validation
- Component structure check
- Theme file consistency
```

## 3. Theme Consistency Tests

Ensure all themes implement required variables:

```javascript
// tests/theme-consistency.test.js
- All themes define required CSS variables
- No theme-specific hardcoded values
- Color contrast ratios meet WCAG
- All components render in all themes
```

## 4. Visual Regression Tests

Catch unexpected visual changes:

```javascript
// tests/visual-regression/
- Screenshot comparison for key screens
- Component snapshot tests
- Mobile vs desktop consistency
```

---

# SUCCESS METRICS

## By End of Week 2

### Quantitative
- [ ] **5+ themes** implemented and working
- [ ] **10+ screens** prototyped
- [ ] **20+ components** in library
- [ ] **100% test coverage** on design tokens
- [ ] **0 linting errors** in final commit
- [ ] **< 100ms** render time for theme switch

### Qualitative
- [ ] Clear visual identity established
- [ ] Consistent component API
- [ ] Easy for future devs to extend
- [ ] Documentation enables self-service

---

# RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| Theme-specific CSS leaks into base | Token validation tests |
| Magic numbers creep in | Stylelint rules + pre-commit |
| Components break in some themes | Cross-theme tests required |
| Performance degrades with effects | Performance budget in CI |
| Future shards ignore conventions | Pre-commit blocks bad code |
| Documentation gets stale | Checkpoint reviews include docs |

---

# FILE STRUCTURE (End of Week 2)

```
frontend/
├── index.html                    # Main prototype entry
├── showcase.html                 # Component showcase
├── DESIGN_SYSTEM.md             # Rules & constraints
│
├── styles/
│   ├── tokens/
│   │   ├── base.css             # Shared tokens
│   │   └── animations.css       # Shared animations
│   │
│   ├── themes/
│   │   ├── neon-decay.css       # Tier 1
│   │   ├── terminal-noir.css    # Tier 1
│   │   ├── algorithm-vision.css # Tier 1
│   │   ├── worn-chrome.css      # Tier 2
│   │   └── brutalist-cargo.css  # Tier 2
│   │
│   ├── components/
│   │   ├── card.css
│   │   ├── button.css
│   │   ├── progress.css
│   │   ├── input.css
│   │   └── ...
│   │
│   └── utilities.css             # Helper classes
│
├── components/                   # Component HTML templates
│   ├── card/
│   ├── button/
│   ├── progress/
│   └── ...
│
├── screens/                      # Full page prototypes
│   ├── dashboard.html
│   ├── missions.html
│   ├── combat.html
│   ├── character.html
│   ├── inventory.html
│   └── algorithm.html
│
└── scripts/
    └── theme-switcher.js

tests/
├── design-tokens.test.js
├── theme-consistency.test.js
├── component-validation.test.js
└── visual-regression/
    └── ...

scripts/
├── validate-frontend.js          # Pre-commit validation
└── ...
```

---

**END OF WEEK 2 SCHEDULE**
