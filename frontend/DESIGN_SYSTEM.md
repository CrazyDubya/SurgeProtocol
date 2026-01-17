# SURGE PROTOCOL: Design System Guide
## Rules, Constraints, and Best Practices

---

# OVERVIEW

This document establishes the rules for the Surge Protocol frontend design system. **All contributors must follow these guidelines** to maintain consistency and prevent degradation.

Pre-commit hooks will block commits that violate these rules.

---

# CORE PRINCIPLES

## 1. Token-First Design

**NEVER use hardcoded values. ALWAYS use design tokens.**

```css
/* BAD - hardcoded values */
.card {
  padding: 16px;
  background: #1a1824;
  color: #e8e0f0;
  border-radius: 8px;
}

/* GOOD - using tokens */
.card {
  padding: var(--space-4);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-radius: var(--radius-lg);
}
```

## 2. Theme Agnostic Components

Components must work in ALL themes without modification. Use CSS variables, never theme-specific colors.

```css
/* BAD - theme-specific */
.btn-primary {
  background: #00d4ff;  /* Only works in one theme */
}

/* GOOD - theme agnostic */
.btn-primary {
  background: var(--accent-algorithm);
}
```

## 3. Mobile-First Responsive

Write mobile styles first, then enhance for larger screens.

```css
/* Mobile first */
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* Enhance for desktop */
@media (min-width: 768px) {
  .dashboard {
    flex-direction: row;
  }
}
```

---

# FILE STRUCTURE

```
frontend/
├── index.html                    # Main entry point
├── DESIGN_SYSTEM.md             # This file
│
├── styles/
│   ├── tokens/
│   │   ├── base.css             # SHARED tokens (spacing, typography, z-index)
│   │   └── animations.css       # SHARED animations
│   │
│   ├── themes/
│   │   ├── neon-decay.css       # Theme-specific variables & overrides
│   │   ├── terminal-noir.css
│   │   └── algorithm-vision.css
│   │
│   ├── components/
│   │   ├── card.css             # Component styles (theme-agnostic)
│   │   ├── button.css
│   │   └── ...
│   │
│   └── utilities.css             # Helper classes
│
├── components/                   # HTML templates/partials
│   └── ...
│
└── screens/                      # Full page layouts
    └── ...
```

---

# NAMING CONVENTIONS

## CSS Classes

Use BEM-inspired naming with flat structure:

```css
/* Block */
.card { }

/* Element (use double underscore) */
.card__header { }
.card__body { }
.card__footer { }

/* Modifier (use double dash) */
.card--elevated { }
.card--danger { }

/* State (use single dash prefix) */
.card.-active { }
.card.-disabled { }
```

## CSS Variables

Follow this naming pattern:

```css
/* Category-property-variant */
--bg-primary
--bg-secondary
--text-primary
--text-dim
--accent-algorithm
--accent-danger
--space-4
--radius-lg
--z-modal
```

## File Names

- **Lowercase with dashes**: `neon-decay.css`, `mission-board.html`
- **Components**: Name matches primary class: `card.css` → `.card`
- **Screens**: Descriptive name: `dashboard.html`, `combat.html`

---

# REQUIRED TOKENS

## Base Tokens (in `tokens/base.css`)

Every project MUST define these tokens:

### Spacing Scale
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Typography Scale
```css
--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;    /* 16px */
--text-lg: 1.125rem;  /* 18px */
--text-xl: 1.25rem;   /* 20px */
--text-2xl: 1.5rem;   /* 24px */
--text-3xl: 1.875rem; /* 30px */
```

### Border Radius
```css
--radius-sm: 0.125rem;
--radius-md: 0.25rem;
--radius-lg: 0.5rem;
--radius-full: 9999px;
```

### Z-Index
```css
--z-dropdown: 100;
--z-sticky: 200;
--z-modal: 500;
--z-tooltip: 700;
```

### Transitions
```css
--duration-fast: 100ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--ease-out: cubic-bezier(0, 0, 0.2, 1);
```

## Theme Tokens (in each theme file)

Every theme MUST define these tokens:

### Backgrounds
```css
--bg-primary      /* Main page background */
--bg-secondary    /* Slightly elevated surfaces */
--bg-tertiary     /* Cards, panels */
--bg-elevated     /* Modals, dropdowns */
--bg-overlay      /* Semi-transparent overlays */
```

### Text
```css
--text-primary    /* Main body text */
--text-secondary  /* Subdued text */
--text-dim        /* Very muted text */
```

### Accents
```css
--accent-algorithm  /* Algorithm voice, primary accent */
--accent-warning    /* Warnings, cautions */
--accent-danger     /* Errors, health low */
--accent-success    /* Success states */
--accent-humanity   /* Humanity-related UI */
--accent-credits    /* Money, economy */
```

### Factions
```css
--faction-omni      /* OmniDeliver */
--faction-saints    /* Chrome Saints */
--faction-tide      /* Red Tide */
--faction-dragons   /* Neon Dragons */
```

### Borders
```css
--border-subtle   /* Barely visible */
--border-default  /* Standard borders */
--border-strong   /* Emphasized borders */
--border-accent   /* Highlighted borders */
```

### Typography
```css
--font-ui         /* UI elements, monospace */
--font-display    /* Headers, titles */
--font-narrative  /* Story text, dialogue */
```

---

# COMPONENT GUIDELINES

## Structure

Every component should:

1. **Be self-contained**: No styles that affect parent or siblings
2. **Use only tokens**: No hardcoded colors, sizes, or fonts
3. **Work in all themes**: Test in each theme before committing
4. **Be accessible**: Include focus states, ARIA attributes

## Example Component

```css
/* components/card.css */

.card {
  /* Structure */
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  /* Appearance - uses tokens only */
  padding: var(--space-4);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);

  /* Transitions */
  transition: border-color var(--duration-normal) var(--ease-out);
}

/* States */
.card:hover {
  border-color: var(--border-strong);
}

.card:focus-within {
  outline: 2px solid var(--accent-algorithm);
  outline-offset: 2px;
}

/* Elements */
.card__header {
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  font-family: var(--font-display);
  font-size: var(--text-lg);
  color: var(--text-primary);
}

.card__body {
  flex: 1;
  color: var(--text-secondary);
}

/* Modifiers */
.card--danger {
  border-color: var(--accent-danger);
}

.card--elevated {
  box-shadow: var(--shadow-lg);
}
```

---

# THEME GUIDELINES

## Creating a New Theme

1. Copy an existing theme as template
2. Update ALL required variables
3. Test ALL existing components
4. Add theme-specific overrides AFTER variable definitions

```css
/* themes/my-new-theme.css */

/* 1. All variables in theme selector */
[data-theme="my-new-theme"] {
  --bg-primary: #...;
  --bg-secondary: #...;
  /* ... all required variables ... */
}

/* 2. Theme-specific component overrides (if needed) */
[data-theme="my-new-theme"] .card {
  /* Only add if this theme needs special treatment */
}
```

## Theme Switching

Themes are applied via `data-theme` attribute on `<html>`:

```html
<html lang="en" data-theme="neon-decay">
```

```javascript
// Switch theme
document.documentElement.setAttribute('data-theme', 'terminal-noir');
```

---

# FORBIDDEN PATTERNS

The following patterns will be **BLOCKED by pre-commit hooks**:

## 1. Hardcoded Colors

```css
/* BLOCKED */
color: #ff0000;
background: rgb(255, 0, 0);
border: 1px solid red;

/* ALLOWED (in variable definitions only) */
--accent-danger: #ff0000;
```

## 2. Hardcoded Spacing (outside tokens)

```css
/* BLOCKED */
margin: 17px;
padding: 23px;

/* ALLOWED */
margin: var(--space-4);
padding: var(--space-6);
```

## 3. ID Selectors for Styling

```css
/* BLOCKED - use classes instead */
#header { }
#main-nav { }

/* ALLOWED */
.header { }
.main-nav { }
```

## 4. !important (except utilities)

```css
/* BLOCKED */
.card {
  display: flex !important;
}

/* ALLOWED only in utilities */
.hidden {
  display: none !important;
}
```

## 5. Theme-Specific Colors in Components

```css
/* BLOCKED - component uses theme color directly */
.button {
  background: #00d4ff;  /* Neon Decay cyan */
}

/* ALLOWED */
.button {
  background: var(--accent-algorithm);
}
```

---

# ACCESSIBILITY REQUIREMENTS

## Color Contrast

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **Interactive elements**: Clearly distinguishable focus states

## Focus States

ALL interactive elements must have visible focus:

```css
.button:focus-visible {
  outline: 2px solid var(--accent-algorithm);
  outline-offset: 2px;
}
```

## Touch Targets

Minimum touch target size: 44x44px

```css
.btn {
  min-height: var(--touch-target, 44px);
  min-width: var(--touch-target, 44px);
}
```

## Reduced Motion

Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# TESTING CHECKLIST

Before committing any frontend changes:

## Automated (run by pre-commit)
- [ ] `npm run lint:frontend` passes
- [ ] `npm run test:tokens` passes
- [ ] No hardcoded values detected

## Manual
- [ ] Tested in ALL themes (toggle through each)
- [ ] Tested on mobile viewport (375px)
- [ ] Tested on desktop viewport (1280px)
- [ ] Focus states visible and correct
- [ ] No console errors
- [ ] Animations smooth (no jank)

---

# EXTENDING THE SYSTEM

## Adding New Tokens

1. Add to `tokens/base.css` if shared across themes
2. Add to EACH theme file if theme-specific
3. Update tests in `tests/design-tokens.test.js`
4. Document in this file

## Adding New Components

1. Create `styles/components/[name].css`
2. Use ONLY existing tokens
3. Test in ALL themes
4. Add to component showcase

## Adding New Themes

1. Copy existing theme as template
2. Define ALL required variables
3. Test ALL components
4. Add to `REQUIRED_THEMES` in tests
5. Update theme switcher

---

# QUICK REFERENCE

## Common Token Usage

| Need | Token |
|------|-------|
| Page background | `var(--bg-primary)` |
| Card background | `var(--bg-tertiary)` |
| Main text | `var(--text-primary)` |
| Muted text | `var(--text-secondary)` |
| Primary accent | `var(--accent-algorithm)` |
| Error/danger | `var(--accent-danger)` |
| Success | `var(--accent-success)` |
| Small padding | `var(--space-2)` |
| Medium padding | `var(--space-4)` |
| Large padding | `var(--space-6)` |
| Card radius | `var(--radius-lg)` |
| Button radius | `var(--radius-md)` |
| Fast animation | `var(--duration-fast)` |
| Normal animation | `var(--duration-normal)` |

---

**Remember: The Algorithm is watching your code quality too.**
