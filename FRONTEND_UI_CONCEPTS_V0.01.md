# SURGE PROTOCOL: Frontend UI Concepts V0.01
## Week 1 - Visual Exploration Phase

---

# OVERVIEW

This document presents **10 distinct frontend UI concept directions** for Surge Protocol. Each concept explores different interpretations of the cyberpunk aesthetic while maintaining the core design principles:

1. **Text First** - Narrative drives experience
2. **The Algorithm Watches** - Omnipresent AI presence
3. **Chrome vs. Humanity** - Visual tension between human and machine
4. **Quiet Dread** - Noir atmosphere, not action movie
5. **Mobile-First** - Touch-optimized, responsive

---

# CONCEPT 1: "TERMINAL NOIR"
## Minimal CRT Aesthetic

### Philosophy
Strip everything back to pure terminal aesthetics. The interface IS the Algorithm—cold, efficient, watching. Green-on-black like you're hacking the Matrix, but bleaker.

### Color Palette
```css
--bg-primary: #0a0a0a;        /* Pure black */
--bg-secondary: #0f0f0f;
--bg-card: #141414;

--text-primary: #00ff88;       /* Terminal green */
--text-secondary: #008844;
--text-dim: #004422;

--accent-algorithm: #00ff88;   /* Matches text - unified */
--accent-warning: #ffaa00;     /* Amber */
--accent-danger: #ff0044;      /* Hot red */
--accent-humanity: #00ffff;    /* Cyan for humanity contrast */
--accent-credits: #ffff00;     /* Yellow gold */

--glow: 0 0 10px #00ff8844;
```

### Typography
- **Primary**: `IBM Plex Mono` (heavier weight for readability)
- **Headers**: `VT323` or `Press Start 2P` (authentic terminal feel)
- **Narrative**: `IBM Plex Mono` (italicized for contrast)

### Visual Characteristics
- No borders—use ASCII box-drawing characters: `┌ ─ ┐ │ └ ┘ ├ ┤ ┬ ┴ ┼`
- CRT scan lines overlay (subtle, 0.02 opacity)
- Subtle screen flicker animation (CSS)
- Text appears character-by-character for Algorithm voice
- Cursor blink everywhere user can interact
- No images—everything is text/ASCII art

### Sample Components

```
┌─────────────────────────────────────────────────┐
│ MARCUS CHEN ████████████████░░░░░░░░░░░░ T3    │
├─────────────────────────────────────────────────┤
│ RATING: 127.445 ↑0.8                            │
│ HP: ████████████████████░░░░ 82/82              │
│ HUM: ███████████████████░░░░░ 95                │
│ ₡ 2,847                                         │
├─────────────────────────────────────────────────┤
│ > ALGORITHM:                                    │
│   Rest is advisable. You've been active for    │
│   six hours. Efficiency degrades 3% per hour   │
│   of sleep debt._                               │
└─────────────────────────────────────────────────┘
```

### Mood
Cold. Clinical. The Algorithm isn't your friend—it's your supervisor. Every interaction feels like being monitored. Perfect for emphasizing the "gig economy hell" theme.

### Pros
- Extremely lightweight (pure CSS/text)
- Highly accessible
- Unique aesthetic
- Fast performance
- Strong atmosphere

### Cons
- May feel dated to some users
- Limited visual appeal for screenshots/marketing
- ASCII art requires careful crafting
- Less intuitive for casual players

---

# CONCEPT 2: "NEON DECAY"
## Blade Runner Nights

### Philosophy
Embrace the classic neon-noir aesthetic. Rain-slicked streets reflected in chrome. Holographic ads flickering in the darkness. Beauty in decay.

### Color Palette
```css
--bg-primary: #0a0814;         /* Deep purple-black */
--bg-secondary: #12101a;
--bg-card: #1a1824;

--text-primary: #e8e0f0;        /* Warm off-white */
--text-secondary: #9088a0;
--text-dim: #504858;

--accent-algorithm: #00d4ff;    /* Electric cyan */
--accent-secondary: #ff00ff;    /* Magenta */
--accent-tertiary: #ff6600;     /* Orange neon */
--accent-warning: #ff8800;
--accent-danger: #ff0066;
--accent-humanity: #cc66ff;
--accent-credits: #ffd700;

--neon-cyan: 0 0 20px #00d4ff, 0 0 40px #00d4ff44;
--neon-pink: 0 0 20px #ff00ff, 0 0 40px #ff00ff44;
--neon-orange: 0 0 20px #ff6600, 0 0 40px #ff660044;
```

### Typography
- **Primary**: `JetBrains Mono`
- **Headers**: `Orbitron` (with letter-spacing: 0.1em)
- **Narrative**: `IBM Plex Sans`
- **Neon Signs**: `Bungee` or `Monoton`

### Visual Characteristics
- Gradient borders with neon glow effects
- Rain animation overlay (CSS particles)
- Holographic shimmer on key elements
- Chromatic aberration on hover
- Parallax depth on cards
- Chinese/Japanese characters as decorative elements

### Sample Components

```
╔══════════════════════════════════════════════════════════╗
║  ██████ ███████  ██████ ██   ██ ███████ ███████          ║
║  ██     ██   ██ ██      ██   ██ ██      ██               ║
║  ██████ ███████ ██      ███████ █████   ███████          ║
║      ██ ██   ██ ██      ██   ██ ██           ██          ║
║  ██████ ██   ██  ██████ ██   ██ ███████ ███████          ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  [NEON GLOW: CYAN]                                       ║
║  ┌────────────────────────────────────────────────────┐  ║
║  │  ACTIVE MISSION                                    │  ║
║  │  ═══════════════════════════════════════════════  │  ║
║  │  Medical Run to Hollows                           │  ║
║  │                                                    │  ║
║  │  ⏱ 14:32  │  📍 2.3km  │  📦 100%                 │  ║
║  │           │            │                          │  ║
║  │  [████████████████░░░░░░░░░░] TIME               │  ║
║  └────────────────────────────────────────────────────┘  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

### Mood
Romantic decay. Beautiful but dying. The city is alive with light but hollow inside—just like the characters who give up their humanity for chrome.

### Pros
- Visually stunning
- Strong marketing appeal
- Familiar cyberpunk aesthetic
- Emotional resonance

### Cons
- Higher performance cost (glows, animations)
- Can feel cliché if not executed well
- Harder to maintain readability
- Animation-heavy

---

# CONCEPT 3: "CLINICAL WHITE"
## The Algorithm's Sterile Domain

### Philosophy
Invert expectations. The Algorithm doesn't live in darkness—it lives in blinding, clinical white. Think Apple Store meets THX-1138. The horror of perfect cleanliness.

### Color Palette
```css
--bg-primary: #fafafa;         /* Near white */
--bg-secondary: #f0f0f2;
--bg-card: #ffffff;

--text-primary: #1a1a1a;       /* Near black */
--text-secondary: #666666;
--text-dim: #999999;

--accent-algorithm: #0066ff;    /* Corporate blue */
--accent-warning: #ff6600;
--accent-danger: #ff0000;
--accent-humanity: #ff00ff;     /* Jarring magenta - humanity is wrong here */
--accent-credits: #00aa00;      /* Money green */
--accent-chrome: #c0c0c0;       /* Silver for augments */

--shadow: 0 2px 8px rgba(0,0,0,0.08);
```

### Typography
- **Primary**: `Inter` (clean, corporate)
- **Headers**: `Space Grotesk`
- **Narrative**: `Libre Baskerville` (serif contrast)
- **Algorithm**: `Roboto Mono`

### Visual Characteristics
- Crisp shadows, no blur
- Thin 1px borders in #e0e0e0
- Red accents for "errors" (read: human emotions)
- Humanity represented as "contamination" visually
- Progress bars are surgical green
- Everything aligned to 8px grid
- Brutalist typography hierarchy

### Sample Components

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  OMNIDELIVER COURIER INTERFACE v3.7.2                    │
│                                                          │
│  USER: CHEN, MARCUS          STATUS: OPTIMAL             │
│  ID: CR-00847293             TIER: 3 (CERTIFIED)         │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  CURRENT ASSIGNMENT                                      │
│  ╔════════════════════════════════════════════════════╗  │
│  ║  DELIVERY #847293-C                                ║  │
│  ║  TYPE: Medical Supply Transport                    ║  │
│  ║  DESTINATION: Hollows Free Clinic                  ║  │
│  ║  TIME REMAINING: 00:14:32                          ║  │
│  ║  CARGO INTEGRITY: 100%                             ║  │
│  ║                                                    ║  │
│  ║  [PROCEED]  [REPORT ISSUE]  [ABANDON (penalty)]   ║  │
│  ╚════════════════════════════════════════════════════╝  │
│                                                          │
│  SYSTEM NOTE: User's heart rate elevated by 12%.         │
│  Recommend hydration break at next waypoint.             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Mood
Dystopian through sterility. The Algorithm doesn't need darkness to be terrifying—it's scariest when it looks like a health insurance form. Every "helpful" notification feels like surveillance.

### Pros
- Highly readable
- Unique in cyberpunk space
- Strong contrast with game content
- Excellent accessibility
- Psychologically unsettling

### Cons
- May alienate players expecting cyberpunk aesthetic
- Requires strong narrative to carry
- Less "fun" visually
- Marketing challenge

---

# CONCEPT 4: "GLITCH WAVE"
## Corrupted Data Aesthetic

### Philosophy
The interface is breaking down. Reality is unstable. Your augments are corrupting. Every screen glitches, tears, artifacts. Visual representation of humanity eroding.

### Color Palette
```css
--bg-primary: #0f0a12;
--bg-secondary: #140f18;
--bg-card: #1a141f;

/* Colors shift and glitch */
--text-primary: #ffffff;
--text-glitch-r: #ff0040;
--text-glitch-g: #00ff40;
--text-glitch-b: #4000ff;

--accent-algorithm: #00ffff;
--accent-warning: #ffff00;
--accent-danger: #ff0000;
--accent-humanity: #ff00ff;
--accent-credits: #00ff00;

--glitch-offset: 2px;
```

### Typography
- **Primary**: `Space Mono`
- **Headers**: `Major Mono Display`
- **Narrative**: `Source Sans Pro`
- **Glitched**: Custom CSS with offset shadows

### Visual Characteristics
- RGB split effect on text (chromatic aberration)
- Random horizontal tears in interface
- Static/noise overlay that intensifies at low humanity
- VHS tracking lines
- Datamosh effects on images
- Text that occasionally scrambles
- Screen shake on damage/errors

### CSS Glitch Effect
```css
.glitch-text {
  text-shadow:
    2px 0 #ff0040,
    -2px 0 #00ffff;
  animation: glitch 0.3s infinite;
}

@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}
```

### Sample Components

```
╔══[ERROR: PACKET LOSS]═══════════════════════════════════╗
║                                                          ║
║  M̷̰͝A̸̰͝R̸͚͝C̵̰͝Ṵ̸͝S̸̰͝ ̸͚͝C̸̰͝H̵͚͝Ḛ̸͝N̸̰͝           T̷I̸E̷R̸ ̴3̶        ║
║  ─────────────────────────────────────────────────────  ║
║                                                          ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░ RATING: 127.44█               ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░ HP: 8█/82                     ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░ HUM: ██                       ║
║                                                          ║
║  > ALGORITHM [SIGNAL: DEGRADED]                          ║
║  > R̷e̵s̷t̴ ̷i̵s̴.̷.̶.̸ ̷a̵d̴v̴i̵s̵a̷b̸l̷e̴.̷ ̷Y̴o̴u̶'̸v̸e̴ ̵b̷e̵e̷n̵.̵.̸.̵          ║
║  > [RECONNECTING...]                                     ║
║  > ...active for six hours.                              ║
║                                                          ║
╚══════════════════════════════════════════[SYNC: 73%]════╝
```

### Mood
Unstable reality. As players lose humanity, the interface itself decays. The visual corruption mirrors their internal corruption. Deeply unsettling.

### Pros
- Unique and memorable
- Reinforces game themes
- Dynamic—changes with player state
- Strong artistic identity

### Cons
- Can trigger photosensitivity issues
- May frustrate users (readability)
- Hard to implement consistently
- Accessibility nightmare without toggle

---

# CONCEPT 5: "DATA STREAM"
## Pure Information Visualization

### Philosophy
You ARE part of the Algorithm now. The interface shows raw data—streams of delivery information, rating calculations, network traffic. The player becomes a node.

### Color Palette
```css
--bg-primary: #000000;
--bg-secondary: #0a0a0a;
--bg-card: rgba(0, 20, 30, 0.8);

--data-green: #00ff00;
--data-cyan: #00ffff;
--data-yellow: #ffff00;
--data-orange: #ff8800;
--data-red: #ff0000;
--data-white: #ffffff;

--stream-bg: linear-gradient(180deg,
  transparent 0%,
  rgba(0,255,0,0.05) 50%,
  transparent 100%);
```

### Typography
- **Primary**: `Fira Code` (with ligatures)
- **Headers**: `Share Tech Mono`
- **Data**: `Cascadia Code`
- **Small**: `Overpass Mono`

### Visual Characteristics
- Matrix-style falling code in backgrounds
- Real-time data counters
- Network topology visualizations
- Particle systems representing data flow
- Everything has a "streaming" animation
- Metrics visible everywhere
- HEX/binary scattered as decoration

### Sample Components

```
╭────────────────────────────────────────────────────────────╮
│ NETWORK NODE: CR-00847293 [CHEN.M]                         │
│ ──────────────────────────────────────────────────────────│
│                                                            │
│ LIVE METRICS                    STREAM                     │
│ ├─ throughput: 847.3 d/hr      ▕▏▕▏▕▕▏▏▕▕▕▏▕▏▕▏▕▕▏▏▕▕▕    │
│ ├─ efficiency: 0.847           ▕▏▕▕▏▏▕▕▕▏▕▏▕▏▕▕▏▏▕▕▕▏▕    │
│ ├─ rating_delta: +0.034/hr     ▕▕▏▏▕▕▕▏▕▏▕▏▕▕▏▏▕▕▕▏▕▏▕    │
│ └─ humanity_decay: -0.001/hr   ▕▕▕▏▕▏▕▏▕▕▏▏▕▕▕▏▕▏▕▏▕▕▏    │
│                                                            │
│ ACTIVE PACKET                                              │
│ ├─ id: PKT-8472937C                                        │
│ ├─ type: MED_SUPPLY                                        │
│ ├─ ttl: 00:14:32                                           │
│ ├─ dest: 0x7F...3E4A (HOLLOWS.CLINIC)                     │
│ └─ integrity: 1.000                                        │
│                                                            │
│ > 0x00: 4D 45 44 49 43 41 4C 20 53 55 50 50 4C 49 45 53   │
│ > 0x10: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00   │
│                                                            │
│ [ROUTE] [DELIVER] [INSPECT] [ABORT]                        │
╰────────────────────────────────────────────────────────────╯
```

### Mood
Technical transcendence. The player stops seeing themselves as a person and starts seeing themselves as a data point. This IS the Algorithm's perspective.

### Pros
- Unique aesthetic
- Ties directly to lore
- Appeals to technical users
- Scales well to complexity
- Great for high-tier characters

### Cons
- Alienating to casual players
- High information density
- Not "human" enough for narrative
- Harder to make emotionally resonant

---

# CONCEPT 6: "BRUTALIST CARGO"
## Industrial Shipping Aesthetic

### Philosophy
You're a courier. A package mover. Embrace the working-class grit. Shipping labels, caution tape, cargo manifests, industrial signage. Form follows function.

### Color Palette
```css
--bg-primary: #1a1a18;         /* Concrete gray */
--bg-secondary: #242422;
--bg-card: #2a2a28;

--text-primary: #f0f0e8;
--text-secondary: #a0a098;
--text-dim: #606058;

--industrial-yellow: #ffc800;   /* Caution/warning */
--industrial-orange: #ff6b00;   /* Hazmat */
--industrial-red: #d40000;      /* Danger */
--industrial-blue: #0066cc;     /* Information */
--industrial-green: #00aa44;    /* Safe/go */

--stripe-warning: repeating-linear-gradient(
  45deg,
  #ffc800,
  #ffc800 10px,
  #000000 10px,
  #000000 20px
);
```

### Typography
- **Primary**: `Work Sans` (industrial sans-serif)
- **Headers**: `Oswald` (condensed, bold)
- **Labels**: `Roboto Condensed`
- **Stencil**: `Stardos Stencil` (for cargo markings)

### Visual Characteristics
- Yellow/black hazard stripes on important elements
- Shipping label aesthetics (barcodes, tracking numbers)
- Stamped/stencil typography
- Worn/weathered textures (subtle)
- Caution tape borders
- Clipboard/manifest layouts
- ISO shipping symbols

### Sample Components

```
╔═══════════════════════════════════════════════════════════╗
║  ████████████████████████████████████████████████████████ ║
║  █                    OMNIDELIVER                       █ ║
║  █              COURIER ASSIGNMENT MANIFEST             █ ║
║  ████████████████████████████████████████████████████████ ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  COURIER: CHEN, MARCUS          ID: CR-00847293          ║
║  STATUS: [✓] ACTIVE             TIER: ███ (3)            ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐  ║
║  │  ▲ FRAGILE ▲        PACKAGE: PKT-8472937C          │  ║
║  │  ▲ FRAGILE ▲        TYPE: MEDICAL                  │  ║
║  │                      WEIGHT: 1.2 KG                 │  ║
║  │  ||||||||||||||      DEST: HOLLOWS FREE CLINIC     │  ║
║  │  CR00847293PKT       TIME: 00:14:32 REMAINING      │  ║
║  │                                                     │  ║
║  │  ⚠ TEMPERATURE SENSITIVE: MAINTAIN 2-8°C          │  ║
║  │  ⚠ DO NOT DROP                                    │  ║
║  │  ⚠ HANDLE WITH CARE                               │  ║
║  └─────────────────────────────────────────────────────┘  ║
║                                                           ║
║  [ SCAN PICKUP ]  [ VIEW ROUTE ]  [ REPORT DAMAGE ]      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### Mood
Working-class grit. This isn't glamorous—it's a job. The interface reinforces that you're labor, not a hero. Blue-collar cyberpunk.

### Pros
- Grounded and believable
- Strong thematic connection
- High readability
- Unique among games
- Emphasizes the "gig economy" theme

### Cons
- Not traditionally "cool"
- May feel mundane
- Less escapist fantasy
- Marketing challenge

---

# CONCEPT 7: "MIRROR'S EDGE"
## Clean Lines, High Contrast

### Philosophy
Minimalist but bold. Clean lines, stark contrasts, bold color blocking. Information hierarchy is king. Influenced by Mirror's Edge and SUPERHOT.

### Color Palette
```css
--bg-primary: #ffffff;
--bg-secondary: #f5f5f5;
--bg-card: #ffffff;

--text-primary: #000000;
--text-secondary: #333333;

/* Bold accent blocks */
--block-algorithm: #00d4ff;
--block-danger: #ff0000;
--block-success: #00ff00;
--block-humanity: #ff00ff;
--block-credits: #ffd700;
--block-faction: #ff6600;

/* Black borders only */
--border: 2px solid #000000;
```

### Typography
- **Primary**: `Space Grotesk`
- **Headers**: `Bebas Neue` (all caps)
- **Numbers**: `Tabular figures` (monospace)

### Visual Characteristics
- Pure white backgrounds with black borders
- Single color accents (one per section)
- No gradients, no shadows
- Hard geometric shapes
- Bold oversized numbers
- Negative space as design element
- Information density through hierarchy, not decoration

### Sample Components

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                           ┃
┃  MARCUS CHEN                                              ┃
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ┃
┃                                                           ┃
┃  ┏━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━┓      ┃
┃  ┃   RATING    ┃  ┃    TIER     ┃  ┃   CREDITS   ┃      ┃
┃  ┃   127.445   ┃  ┃      3      ┃  ┃    2,847    ┃      ┃
┃  ┃             ┃  ┃             ┃  ┃             ┃      ┃
┃  ┃ [CYAN BAR]  ┃  ┃ [GRAY BAR]  ┃  ┃ [GOLD BAR]  ┃      ┃
┃  ┗━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━┛      ┃
┃                                                           ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃
┃  ┃ [RED BLOCK: ACTIVE MISSION]                        ┃  ┃
┃  ┃                                                    ┃  ┃
┃  ┃  MEDICAL RUN TO HOLLOWS                           ┃  ┃
┃  ┃                                                    ┃  ┃
┃  ┃  14:32 REMAINING         2.3 KM                   ┃  ┃
┃  ┃                                                    ┃  ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃
┃                                                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Mood
Precision. Control. The clean lines suggest mastery—this is how the world looks when you're in the zone. High clarity, high stakes.

### Pros
- Extremely readable
- Fast to render
- Strong mobile experience
- Bold and memorable
- Easy to maintain

### Cons
- May feel sterile
- Less atmospheric
- Hard to convey "decay"
- Stark for dark content

---

# CONCEPT 8: "WORN CHROME"
## Used Future

### Philosophy
Everything is second-hand. Your gear is patched. Your interface is customized by previous users. Stickers, scratches, modifications. Lived-in cyberpunk.

### Color Palette
```css
--bg-primary: #181820;
--bg-secondary: #1f1f28;
--bg-card: #252530;
--bg-scratched: url('scratches.png');

--chrome-bright: #e8e8f0;
--chrome-mid: #a0a0a8;
--chrome-dark: #505058;
--chrome-rust: #8b4513;

--sticker-red: #ff3040;
--sticker-yellow: #ffd000;
--sticker-blue: #00a0ff;
--sticker-green: #00ff80;

--accent-algorithm: #00d4ff;
--accent-humanity: #ff00ff;
```

### Typography
- **Primary**: `JetBrains Mono`
- **Headers**: `Russo One`
- **Handwritten**: `Permanent Marker`
- **Labels**: `Share Tech Mono`

### Visual Characteristics
- Scratched/worn textures on UI elements
- Hand-drawn annotations and arrows
- Stickers/decals on panels
- Tape patches covering "broken" UI
- Faded labels and serial numbers
- Coffee ring stains (subtle)
- Previous user graffiti in margins

### Sample Components

```
┌──────────────────────────────────────────────────────────┐
│ ┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊ │
│ ┊ [STICKER: "STAY CHROME"]                             ┊ │
│ ┊                                                       ┊ │
│ ┊  MARCUS CHEN         ← "thats me lol" (handwritten)  ┊ │
│ ┊  ════════════════════════════════════════════════   ┊ │
│ ┊  SN: CR-00847293 [scratched: previous ID visible]    ┊ │
│ ┊                                                       ┊ │
│ ┊  RATING: 127.445  [sticky note: "was 89 when I       ┊ │
│ ┊                    started this job"]                ┊ │
│ ┊                                                       ┊ │
│ ┊  HP: ████████████████████░░░░ 82/82                  ┊ │
│ ┊      [tape covering cracked screen here]             ┊ │
│ ┊                                                       ┊ │
│ ┊  HUM: ███████████████████░░░░░ 95                    ┊ │
│ ┊       ↑ "watch this number" - scratched in           ┊ │
│ ┊                                                       ┊ │
│ ┊ [STICKER: "RED TIDE CAN ████ OFF"]                   ┊ │
│ ┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊ │
└──────────────────────────────────────────────────────────┘
```

### Mood
Lived-in world. History exists. You're not the first to use this gear, and you won't be the last. Humanity persists in the margins.

### Pros
- Extremely immersive
- Shows character through UI
- Unique and memorable
- Humanizes the interface
- Great worldbuilding

### Cons
- Complex to implement
- Many assets required
- May feel cluttered
- Hard to maintain consistency

---

# CONCEPT 9: "ALGORITHM VISION"
## See Through Its Eyes

### Philosophy
The interface IS the Algorithm's perception. You're not using a UI—you're seeing yourself the way IT sees you. Threat assessments, optimization metrics, behavioral predictions.

### Color Palette
```css
--bg-primary: #000408;
--bg-grid: rgba(0, 40, 60, 0.3);
--bg-scan: rgba(0, 212, 255, 0.05);

--scan-primary: #00d4ff;
--scan-secondary: #0088aa;
--scan-dim: #004466;

--threat-none: #00ff88;
--threat-low: #88ff00;
--threat-medium: #ffff00;
--threat-high: #ff8800;
--threat-critical: #ff0000;

--target-lock: #ff0000;
--target-friendly: #00ff00;
--target-neutral: #ffffff;
```

### Typography
- **Primary**: `Roboto Mono`
- **Headers**: `Exo 2`
- **Data**: `Source Code Pro`
- **Target Labels**: `Rajdhani`

### Visual Characteristics
- Grid overlay on everything
- Scanning line animations
- Target lock brackets around elements
- Threat assessment indicators
- Behavioral prediction readouts
- Facial recognition boxes on NPCs
- Distance/time calculations overlaid

### Sample Components

```
╔════════════════════════════════════════════════════════════╗
║  ◢◤ ALGORITHM INTERFACE v4.7.2 ◥◣                          ║
║  COURIER: CHEN, MARCUS [ID: CR-00847293]                    ║
║  ────────────────────────────────────────────────────────  ║
║                                                             ║
║  ┌─[BIOMETRIC SCAN]────────────────────────────────────┐   ║
║  │  HEART RATE: 78 BPM [ELEVATED +12%]                 │   ║
║  │  STRESS LEVEL: 34% [OPTIMAL]                        │   ║
║  │  FATIGUE: 23% [ACCEPTABLE]                          │   ║
║  │  LOYALTY INDEX: 0.847 [STABLE]                      │   ║
║  │                                                      │   ║
║  │  ⚠ ANOMALY: Hesitation detected at checkpoint      │   ║
║  │             15:32:07. Flagged for pattern analysis. │   ║
║  └─────────────────────────────────────────────────────┘   ║
║                                                             ║
║  [TARGET: CURRENT MISSION]                                  ║
║  ┌──────────────────────────────────────────────────────┐  ║
║  │  ◢ MEDICAL RUN - HOLLOWS                             │  ║
║  │                                                       │  ║
║  │  OPTIMIZATION ANALYSIS                                │  ║
║  │  ├─ Route efficiency: 87.3% [ABOVE AVERAGE]          │  ║
║  │  ├─ Predicted completion: 14:28 [WITHIN PARAMETERS]  │  ║
║  │  ├─ Threat assessment: LOW [GREEN]                   │  ║
║  │  └─ Rating impact: +0.6 to +0.9 [FAVORABLE]          │  ║
║  │                                                       │  ║
║  │  RECOMMENDATION: Proceed. No intervention required.  │  ║
║  └──────────────────────────────────────────────────────┘  ║
║                                                             ║
║  ◢◤ END SCAN ◥◣                                            ║
╚════════════════════════════════════════════════════════════╝
```

### Mood
Surveillance state made visible. The player KNOWS they're being watched because they're seeing through the watcher's eyes. Deeply unsettling.

### Pros
- Unique perspective
- Reinforces core theme
- Allows for rich data display
- Natural fit for game mechanics
- Psychologically effective

### Cons
- Can feel dehumanizing (intentional?)
- Heavy information load
- Complex to implement well
- May feel too "gamey"

---

# CONCEPT 10: "RETRO FUTURE"
## 1980s Cyberpunk Revival

### Philosophy
Go back to the source. Blade Runner. Neuromancer. Alien. What did people in 1982 think the future would look like? Chunky terminals, amber monitors, cassette futurism.

### Color Palette
```css
--bg-primary: #0a0a08;
--bg-secondary: #141410;
--bg-card: #1a1a18;
--bg-terminal: #0a0800;

--amber-bright: #ffb000;
--amber-mid: #cc8800;
--amber-dim: #664400;
--amber-glow: 0 0 10px #ffb00044;

--phosphor-green: #33ff33;
--phosphor-blue: #3399ff;

--accent-danger: #ff3300;
--accent-success: #33ff00;
```

### Typography
- **Primary**: `VT323` (authentic terminal)
- **Headers**: `Press Start 2P`
- **Alternative**: `DotGothic16`
- **Large**: `Silkscreen`

### Visual Characteristics
- Amber-on-black terminal aesthetic
- Phosphor glow effects
- Thick bezels around screens
- Pixel-style icons (8-bit)
- Loading bars with percentage
- Command-line inputs
- Blinking cursors

### Sample Components

```
╔══════════════════════════════════════════════════════════╗
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║
║  ▓  OMNI-DELIVER SYSTEMS INC.  [C] 2089               ▓  ║
║  ▓  COURIER TERMINAL v2.7.4                           ▓  ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  USER: CHEN, MARCUS                                      ║
║  TIER: 3 [CERTIFIED]          RATING: 127.445           ║
║                                                          ║
║  ════════════════════════════════════════════════════   ║
║                                                          ║
║  HP:  [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░] 82/82                   ║
║  HUM: [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░] 95/100                  ║
║  XP:  [▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░] 1240/1500              ║
║                                                          ║
║  CREDITS: 2847                                           ║
║                                                          ║
║  > ACTIVE MISSION: MEDICAL RUN TO HOLLOWS               ║
║  > TIME REMAINING: 00:14:32                              ║
║  > CARGO INTEGRITY: 100%                                 ║
║                                                          ║
║  SYSTEM: REST IS ADVISABLE. EFFICIENCY DECLINING._       ║
║                                                          ║
║  COMMAND> _                                              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

### Mood
Nostalgic futurism. The future that never was. Comforting for older players, novel for younger ones. Warm despite the dystopia.

### Pros
- Strong aesthetic identity
- Nostalgic appeal
- Lightweight to render
- Unique in modern gaming
- Authentic to genre roots

### Cons
- May feel dated
- Limited visual variety
- Accessibility concerns (amber-on-black)
- Niche appeal

---

# BONUS CONCEPTS

## CONCEPT 11: "HYBRID ADAPTIVE"
### Changes Based on Player State

The interface shifts between styles based on:
- **High Humanity (100-60)**: Clean, human, warm colors
- **Mid Humanity (59-40)**: Glitchy, unstable, desaturating
- **Low Humanity (39-20)**: Algorithm Vision, clinical, cold
- **Critical (19-0)**: Pure data streams, no human elements

This creates a visual narrative arc as players make choices.

## CONCEPT 12: "FACTION SKINS"
### Different Visual Language Per Faction

- **OmniDeliver**: Corporate clean (Concept 3)
- **Chrome Saints**: Neon decay (Concept 2)
- **Red Tide**: Brutalist cargo (Concept 6)
- **Neon Dragons**: Glitch wave (Concept 4)

UI changes based on player's primary faction allegiance.

---

# RECOMMENDATION FOR WEEK 1 EXPLORATION

## Priority Concepts to Develop Further

### Tier 1: Core Candidates (Build Prototypes)
1. **CONCEPT 2: "NEON DECAY"** - Best balance of aesthetic appeal and theme
2. **CONCEPT 9: "ALGORITHM VISION"** - Most unique, strongest theme integration
3. **CONCEPT 1: "TERMINAL NOIR"** - Lightest weight, most accessible

### Tier 2: Secondary Exploration
4. **CONCEPT 8: "WORN CHROME"** - Strong worldbuilding potential
5. **CONCEPT 6: "BRUTALIST CARGO"** - Unique, thematically appropriate
6. **CONCEPT 4: "GLITCH WAVE"** - High impact, needs accessibility toggle

### Tier 3: Reserve for Specific Features
7. **CONCEPT 11: "HYBRID ADAPTIVE"** - Implement as overlay on chosen base
8. **CONCEPT 5: "DATA STREAM"** - Use for high-tier character screens
9. **CONCEPT 3: "CLINICAL WHITE"** - Algorithm conversation screens only

---

# WEEK 1 DELIVERABLES

## Phase 1: Static Mockups (Days 1-2)
- [ ] HTML/CSS mockup of Dashboard for top 3 concepts
- [ ] Mobile versions of each
- [ ] Component library sketches

## Phase 2: Interactive Prototypes (Days 3-4)
- [ ] Add animations/transitions
- [ ] Test on mobile devices
- [ ] Gather initial feedback

## Phase 3: Refinement (Days 5-7)
- [ ] Narrow to 2-3 finalists
- [ ] Document component patterns
- [ ] Plan Week 2 implementation

---

# TECHNICAL NOTES FOR IMPLEMENTATION

## CSS Architecture
```
/styles
  /tokens
    colors.css
    typography.css
    spacing.css
    animations.css
  /themes
    terminal-noir.css
    neon-decay.css
    algorithm-vision.css
  /components
    card.css
    button.css
    progress-bar.css
    algorithm-voice.css
  main.css
```

## Font Loading Strategy
```html
<!-- Preload critical fonts -->
<link rel="preload" href="/fonts/jetbrains-mono.woff2" as="font" crossorigin>
<link rel="preload" href="/fonts/orbitron.woff2" as="font" crossorigin>

<!-- System font fallback stack -->
font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
```

## Animation Performance
```css
/* Use transform/opacity only for animations */
.card-hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}

/* Prefer CSS animations over JS */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

---

**END OF V0.01 CONCEPTS DOCUMENT**

*Next: Select 3 concepts for prototype development*
