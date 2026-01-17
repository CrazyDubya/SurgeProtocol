# Variable System Documentation

## Overview
This document specifies all variables used in Surge Protocol's narrative system, their types, ranges, and how they interact with content gating.

---

## Core Player Variables

### Progression Variables

#### TIER (Integer: 0-10)
**Purpose**: Primary progression metric tracking courier ranking.
**Initial Value**: 0
**Modification**: Quest completion, major story milestones

| Tier | Title | Story Status |
|------|-------|--------------|
| 0 | Unrated | Tutorial |
| 1 | Fresh Meat | Early game |
| 2 | Provisional | Early game |
| 3 | Licensed | Early-Mid (Algorithm choice) |
| 4 | Established | Mid game |
| 5 | Professional | Mid game (Interstitial) |
| 6 | Expert | Mid-Late (Fork choice) |
| 7 | Elite | Late game |
| 8 | Master | Late game |
| 9 | Legend | Pre-ending |
| 10 | Apex | Ending triggered |

**Usage in Conditions**:
```
TIER >= 5       // Content requires mid-game progress
TIER == 10      // Ending-only content
TIER BETWEEN 3 AND 6  // Mid-game specific content
```

---

#### HUMANITY_SCORE (Integer: 0-100)
**Purpose**: Tracks balance between human and chrome.
**Initial Value**: 100
**Modification**: Augmentation installation (-), removal (+), story choices (+/-)

| Range | Status | Effect |
|-------|--------|--------|
| 100 | Pure Human | No augmentation benefits |
| 80-99 | High Humanity | Light chrome, full NPC comfort |
| 60-79 | Medium-High | Moderate chrome, subtle discomfort |
| 40-59 | Medium-Low | Heavy chrome, visible unease |
| 20-39 | Low Humanity | Severe chrome, fear reactions |
| 1-19 | Critical | Near-hollow, desperate pleas |
| 0 | The Hollow | Algorithm dominance, forced Ascension |

**Milestone Flags Set**:
- `HUMANITY_HIGH` when >= 80
- `HUMANITY_MEDIUM` when 40-79
- `HUMANITY_LOW` when < 40
- `HUMANITY_ZERO` when == 0
- `HUMANITY_PERFECT` when == 100

**Special Value**:
- 50 exactly = "Perfect Balance" - triggers hidden content

---

#### CREDITS (Integer: 0+)
**Purpose**: Economic resource for purchases, bribes, upgrades.
**Initial Value**: 100
**Modification**: Job completion (+), purchases (-), bribes (-), gambling (+/-)

**Thresholds**:
- 0-99: Struggling
- 100-499: Getting by
- 500-999: Comfortable
- 1000-4999: Wealthy
- 5000+: Rich

---

### Relationship Variables

All relationship variables follow this pattern:
- **Type**: Integer
- **Range**: -100 to +100
- **Initial Value**: 0 (neutral) or set by first meeting
- **Modification**: Dialogue choices, quest outcomes, gifts, actions

| Range | Status | General Effect |
|-------|--------|----------------|
| 76-100 | Deep Bond | Full trust, intimate dialogue |
| 51-75 | Strong Ally | Reliable support, personal quests |
| 26-50 | Friend | Friendly, some secrets shared |
| 1-25 | Acquaintance | Cordial, professional |
| 0 | Neutral | No established relationship |
| -1 to -25 | Tension | Wary, guarded |
| -26 to -50 | Dislike | Antagonistic, may refuse help |
| -51 to -75 | Hostile | Active opposition |
| -76 to -100 | Enemy | Dangerous, may attack |

**Core Relationship Variables**:
- `CHEN_RELATIONSHIP`
- `ROSA_RELATIONSHIP`
- `TANAKA_RELATIONSHIP`
- `OKONKWO_RELATIONSHIP`
- `JIN_RELATIONSHIP`
- `LOPEZ_RELATIONSHIP`
- `YAMADA_RELATIONSHIP`
- `DELILAH_RELATIONSHIP`

---

### Faction Standing Variables

Pattern similar to relationships but represents organizational standing.

| Variable | Range | Notes |
|----------|-------|-------|
| `NAKAMURA_RELATIONSHIP` | -100 to 100 | Corporate faction |
| `UNION_RELATIONSHIP` | -100 to 100 | Worker faction |
| `GHOST_NETWORK_STANDING` | -100 to 100 | Underground faction |
| `CHROME_SAINTS_RELATIONSHIP` | -100 to 100 | Gang faction |
| `ALGORITHM_TRUST` | -100 to 100 | AI relationship |

---

## Condition Syntax

### Basic Comparisons

```
FLAG == value           // Equals
FLAG != value           // Not equals
FLAG > value            // Greater than
FLAG >= value           // Greater than or equal
FLAG < value            // Less than
FLAG <= value           // Less than or equal
```

### Boolean Checks

```
FLAG                    // True if FLAG is true
!FLAG                   // True if FLAG is false
FLAG == true            // Explicit true check
FLAG == false           // Explicit false check
```

### Compound Conditions

```
FLAG1 AND FLAG2         // Both must be true
FLAG1 OR FLAG2          // Either can be true
FLAG1 AND (FLAG2 OR FLAG3)  // Grouped logic
NOT FLAG1               // Negation
```

### Range Checks

```
FLAG BETWEEN min AND max    // Inclusive range
FLAG IN [val1, val2, val3]  // Set membership
```

---

## Threshold Reference Tables

### Relationship Thresholds for Content Gating

| Content Type | Typical Threshold |
|--------------|-------------------|
| Basic info | >= 0 |
| Personal stories | >= 25 |
| Side quests | >= 40 |
| Romance initiation | >= 50 |
| Deep secrets | >= 60 |
| Romance progression | >= 70 |
| Final loyalty | >= 80 |
| Tier 10 support | >= 75 |

### Tier Thresholds for Quest Availability

| Quest Type | Tier Requirement |
|------------|------------------|
| Tutorial quests | 0 |
| Basic side quests | 1+ |
| Standard side quests | 2+ |
| Complex side quests | 4+ |
| Major faction quests | 5+ |
| Hidden content | 6+ |
| Endgame quests | 8+ |
| Final choices | 9+ |
| Epilogues | 10 |

### Humanity Thresholds for Reactions

| NPC Reaction Type | Humanity Range |
|-------------------|----------------|
| Comfortable, warm | >= 80 |
| Neutral, professional | 60-79 |
| Subtle unease | 40-59 |
| Visible discomfort | 20-39 |
| Fear, avoidance | < 20 |

---

## Algorithm Voice Stages

The Algorithm's voice changes based on humanity score:

| Stage | Humanity | Voice Characteristics |
|-------|----------|----------------------|
| 1: Clinical Distance | 100-80 | Formal, analytical, helpful |
| 2: Warming Intimacy | 79-60 | More personal, "we" language begins |
| 3: Shadow Emergence | 59-40 | Possessive undertones, Shadow active |
| 4: "We" Dominance | 39-20 | Full "we" language, control suggestions |
| 5: The Hollow | 19-0 | Complete dominance, player agency minimal |

**Condition Examples**:
```
HUMANITY_SCORE >= 80 AND ALGORITHM_INTEGRATED == true
    → Algorithm Stage 1 dialogue

HUMANITY_SCORE < 40 AND ALGORITHM_INTEGRATED == true
    → Algorithm Stage 4+ dialogue
```

---

## Condition Examples from Content

### Quest Availability

**Rosa Miguel Rescue**:
```
MET_ROSA == true
AND ROSA_RELATIONSHIP >= 40
AND TIER >= 4
```

**Yamada Protocols**:
```
YAMADA_RELATIONSHIP >= -25
OR NAKAMURA_EVIDENCE_FOUND == true
```

**Eighth Tier Quest**:
```
HUMANITY_SCORE == 50
AND TIER >= 8
AND DISCOVERED_INTERSTITIAL == true
```

### Dialogue Branching

**Chen reveals daughter story**:
```
CHEN_RELATIONSHIP >= 50
AND TIER >= 5
AND ASKED_ABOUT_DAUGHTER == true
```

**Jin becomes ally**:
```
JIN_RELATIONSHIP >= 50
AND RESCUE_COMPLETED == true
AND JIN_ENEMY_STATUS == false
```

**Lopez offers leadership**:
```
LOPEZ_RELATIONSHIP >= 90
AND STRIKE_OUTCOME == "victory"
AND PLAYER_LABOR_ACTIONS >= 5
```

### Ending Requirements

**Ascension (Transcendence)**:
```
CHOSE_ASCENSION == true
AND ALGORITHM_TRUST >= 75
AND UPLOAD_CONSENT_GIVEN == true
```

**Rogue with Rosa**:
```
CHOSE_ROGUE == true
AND ROSA_ROMANCE_ACTIVE == true
AND ROSA_CHOSEN == true
```

**Third Path (Perfect)**:
```
CHOSE_THIRD_PATH == true
AND HUMANITY_SCORE BETWEEN 40 AND 60
AND EIGHTH_ATTAINED == true
AND OKONKWO_BLESSING == true
```

---

## Fallback Behavior

When conditions are not met, content should fall back gracefully:

### Dialogue Fallbacks

| Missing Condition | Fallback |
|-------------------|----------|
| Relationship too low | Generic NPC response |
| Tier too low | "Come back when you're more experienced" |
| Flag not set | Skip optional content, continue main path |

### Quest Fallbacks

| Missing Condition | Fallback |
|-------------------|----------|
| Prerequisites not met | Quest invisible in journal |
| Relationship locked | NPC won't offer quest |
| Item required | Alternative path or revisit later |

### Ending Fallbacks

| Missing Condition | Fallback |
|-------------------|----------|
| Third Path unavailable | Offer Ascension or Rogue only |
| Rosa dead | Rogue alone variant |
| Algorithm refused | Modified Rogue path only |

---

## Variable Modification Events

### Automatic Modifications

| Event | Variable | Change |
|-------|----------|--------|
| Install augment | HUMANITY_SCORE | -5 to -15 |
| Remove augment | HUMANITY_SCORE | +5 to +10 |
| Complete tier quest | TIER | +1 |
| Complete delivery | CREDITS | +50 to +500 |
| Time passes | Various | Relationship decay if no contact |

### Story-Driven Modifications

| Event Type | Example | Typical Impact |
|------------|---------|----------------|
| Dialogue choice | Support NPC | +5 to +10 relationship |
| Quest outcome | Save NPC | +15 to +25 relationship |
| Major decision | Faction choice | +20 one faction, -10 others |
| Betrayal | Expose secret | -30 to -50 relationship |

---

## Testing Requirements

### Variable Boundary Tests
- Test at value 0
- Test at maximum value
- Test at threshold boundaries (e.g., 49, 50, 51 for balance)
- Test negative values for relationships

### Condition Logic Tests
- Test AND conditions with one false
- Test OR conditions with both false
- Test nested conditions
- Test NOT inversions

### Edge Cases
- HUMANITY_SCORE exactly 0 (force Ascension)
- HUMANITY_SCORE exactly 50 (special content)
- Relationship at exactly threshold values
- Multiple mutually exclusive flags set (error state)

---

## Implementation Notes

### Performance
- Cache frequently-checked variables (TIER, HUMANITY_SCORE)
- Evaluate conditions at dialogue/quest start, not per-line
- Use lazy evaluation for compound conditions

### Persistence
- All variables save with player save file
- Relationship decay requires timestamp tracking
- Integer variables should not overflow (cap at range limits)

### Debugging
- Implement `/vars` command showing all variable values
- Log all variable changes with source
- Flag impossible states as errors

---

*Document created: Phase 5 Session 2*
*Variable count: ~35 core variables + ~85 flags = ~120 tracked values*
