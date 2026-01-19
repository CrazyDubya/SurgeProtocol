# Surge Protocol - API Data Format

## Overview

This directory contains the proof-of-concept JSON conversion of Surge Protocol narrative content for game engine API consumption. The markdown source files in `/surge-narrative/` serve as the source-of-truth documentation, while these JSON files enable efficient runtime access.

---

## Directory Structure

```
/data
├── schema.json              # Data schema definitions
├── README.md                # This file
├── characters/              # Character data
│   └── chen_wei.json        # Example: Main cast character
├── dialogue/
│   ├── pools/               # Pooled dialogue lines
│   │   └── chen_wei_dialogue.json
│   └── conversations/       # Branching dialogue trees
│       └── chen_first_meeting.json
└── procedural/
    ├── encounters/          # Random encounter templates
    │   ├── territorial_gang.json    # Negative
    │   ├── hidden_cache.json        # Positive
    │   └── the_glimpse.json         # Neutral
    └── jobs/                # Job templates (TODO)
```

---

## Conversion Status

| Module | Source Files | Converted | Status |
|--------|--------------|-----------|--------|
| Characters | 131 NPCs | 1 | Proof of concept |
| Dialogue Pools | ~2,500 lines | 1 file | Proof of concept |
| Conversations | ~50 trees | 1 | Proof of concept |
| Encounters | 45 templates | 3 | Proof of concept |
| Jobs | 81 templates | 0 | TODO |
| Quests | ~40 quests | 0 | TODO |

---

## Data Format Examples

### Character Data (`chen_wei.json`)

```json
{
  "id": "chen_wei",
  "type": "main_cast",
  "tier_range": {"min": 0, "max": 10},
  "dialogue_pools": {
    "greeting": {
      "stranger": ["chen_greeting_stranger_01"],
      "bonded": ["chen_greeting_bonded_01"]
    }
  }
}
```

### Dialogue Pool (`chen_wei_dialogue.json`)

```json
{
  "greeting_familiar": {
    "conditions": {"relationship_range": [6, 8]},
    "lines": [
      {
        "id": "chen_greeting_familiar_01",
        "text": "Morning. Coffee's fresh.",
        "emotion": "warmth"
      }
    ]
  }
}
```

### Encounter Template (`territorial_gang.json`)

```json
{
  "encounter_id": "n1_territorial_gang",
  "category": "negative",
  "trigger": {"base_frequency": 0.08},
  "player_options": [
    {"id": "pay_tribute", "type": "compliance"},
    {"id": "negotiate", "type": "skill_check", "skill": "persuasion"},
    {"id": "fight", "type": "combat"}
  ],
  "outcomes": {...}
}
```

---

## Game Engine Integration

### Dialogue System Flow

```
1. Player enters location with Chen
2. Engine calls: getDialogueLine("chen_wei", "greeting", playerState)
3. System checks:
   - Player relationship with Chen (e.g., 7 = "familiar")
   - Player humanity (e.g., 65 = "mid")
   - Active flags
4. Filters pools by conditions
5. Weighted random selection from valid lines
6. Returns: {id, text, voice_file, emotion}
```

### Encounter System Flow

```
1. Player transitions between areas
2. Engine calls: rollEncounter(location, time, playerState)
3. System:
   - Filters encounters by tier_range
   - Applies frequency modifiers (time, location, flags)
   - Random roll against base_frequency
   - If triggered, instantiates encounter
4. Returns: {encounter_id, setup, player_options}
5. Player selects option
6. System resolves outcome, applies effects
```

---

## Runtime State Management

The game engine maintains player state:

```json
{
  "player": {
    "tier": 3,
    "humanity": 72,
    "credits": 1250
  },
  "flags": {
    "MET_CHEN": true,
    "KNOWS_CHEN_DAUGHTER_FATE": false,
    "GLIMPSE_EXPERIENCED": true
  },
  "relationships": {
    "chen_wei": 7,
    "rosa_delgado": 4
  }
}
```

### Condition Evaluation

```javascript
function evaluateConditions(conditions, state) {
  if (conditions.relationship_range) {
    const rel = state.relationships[character_id];
    if (rel < conditions.relationship_range[0] ||
        rel > conditions.relationship_range[1]) return false;
  }
  if (conditions.flags_required) {
    for (const flag of conditions.flags_required) {
      if (!state.flags[flag]) return false;
    }
  }
  // ... additional condition types
  return true;
}
```

---

## Conversion Pipeline

### From Markdown to JSON

1. **Parse markdown structure** - Extract headers, tables, lists
2. **Identify content type** - Character, dialogue, quest, etc.
3. **Extract dialogue lines** - Map to pool structure
4. **Extract conditions** - Tier gates, flags, relationships
5. **Generate IDs** - Consistent, unique identifiers
6. **Validate** - Against schema.json

### Source of Truth

- Markdown files remain authoritative for content review/editing
- JSON files generated from markdown
- Regenerate JSON after markdown updates
- Version control both formats

---

## Next Steps

### Full Conversion (Priority Order)

1. **Characters** - All 131 NPCs
2. **Dialogue Pools** - All relationship/tier/flag variations
3. **Conversations** - All branching trees
4. **Job Templates** - All 81 procedural jobs
5. **Encounters** - Remaining 42 templates
6. **Quests** - All quest structures

### Tooling Needed

- Markdown parser for structured extraction
- JSON validator against schema
- Hot-reload system for development
- Content diff tool for updates

---

## Files in This Proof of Concept

| File | Description | Lines | Source |
|------|-------------|-------|--------|
| `characters/chen_wei.json` | Main cast character | Full conversion | `01_CHARACTERS/tier_0_npcs/dispatcher_chen.md` |
| `dialogue/pools/chen_wei_dialogue.json` | All Chen dialogue pools | 80+ lines | Multiple sources |
| `dialogue/conversations/chen_first_meeting.json` | Tutorial conversation | 9 nodes | `dispatcher_chen.md` |
| `procedural/encounters/territorial_gang.json` | Negative encounter | Full template | `negative_encounters.md` |
| `procedural/encounters/hidden_cache.json` | Positive encounter | Full template | `positive_encounters.md` |
| `procedural/encounters/the_glimpse.json` | Neutral encounter | Full template | `neutral_encounters.md` |
| `schema.json` | Data schema definitions | Type definitions | New |

---

*Surge Protocol Data Format v1.0*
*Proof of Concept - Ready for Full Conversion*
