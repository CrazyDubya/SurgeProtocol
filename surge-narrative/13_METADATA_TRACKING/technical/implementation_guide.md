# Surge Protocol - Implementation Guide

## Document Purpose
This guide provides developers with all necessary specifications to implement Surge Protocol's narrative system.

---

## SECTION 1: SYSTEM ARCHITECTURE OVERVIEW

### Core Narrative Systems

```
┌─────────────────────────────────────────────────────────────┐
│                    NARRATIVE ENGINE                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Dialogue   │  │    Quest    │  │    Bark     │         │
│  │   System    │  │   System    │  │   System    │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                   │
│                  ┌───────┴───────┐                          │
│                  │  Flag/Variable │                          │
│                  │     Manager    │                          │
│                  └───────┬───────┘                          │
│                          │                                   │
│         ┌────────────────┼────────────────┐                 │
│         │                │                │                 │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐         │
│  │ Relationship │  │  Humanity   │  │   Ending    │         │
│  │   Tracker    │  │   Tracker   │  │  Calculator │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Player Action** → Flag/Variable Update → Save to Profile
2. **Dialogue Request** → Condition Check → Content Selection
3. **Quest Trigger** → Prerequisite Check → Quest Activation
4. **Bark Trigger** → Context Check → Audio Play

---

## SECTION 2: DIALOGUE SYSTEM SPECIFICATION

### Dialogue Node Structure

```json
{
  "node_id": "CHEN_TIER5_DAUGHTER_01",
  "speaker": "CHEN",
  "conditions": [
    {"flag": "CHEN_RELATIONSHIP", "operator": ">=", "value": 50},
    {"flag": "TIER", "operator": ">=", "value": 5},
    {"flag": "ASKED_ABOUT_DAUGHTER", "operator": "==", "value": true}
  ],
  "text": "I had a daughter. Her name was Mei-Lin.",
  "voice_file": "chen_daughter_reveal_01.wav",
  "emotional_tag": "grief",
  "responses": [
    {"text": "Tell me about her.", "next_node": "CHEN_TIER5_DAUGHTER_02", "effects": []},
    {"text": "You don't have to talk about it.", "next_node": "CHEN_TIER5_DAUGHTER_ALT", "effects": [{"flag": "CHEN_RELATIONSHIP", "change": 5}]}
  ],
  "fallback_node": "CHEN_GENERIC_GREETING"
}
```

### Condition Operators

| Operator | Function | Example |
|----------|----------|---------|
| `==` | Equals | `TIER == 5` |
| `!=` | Not equals | `ENDING != "ascension"` |
| `>` | Greater than | `HUMANITY > 50` |
| `>=` | Greater or equal | `RELATIONSHIP >= 40` |
| `<` | Less than | `CREDITS < 100` |
| `<=` | Less or equal | `TIER <= 3` |
| `AND` | Both true | Multiple conditions |
| `OR` | Either true | Alternative conditions |

### Effect Types

| Effect | Format | Example |
|--------|--------|---------|
| Flag set | `{"flag": "X", "value": Y}` | `{"flag": "MET_CHEN", "value": true}` |
| Flag change | `{"flag": "X", "change": Y}` | `{"flag": "CHEN_RELATIONSHIP", "change": 10}` |
| Quest trigger | `{"quest": "QUEST_ID"}` | `{"quest": "SQ_CHEN_DAUGHTER"}` |
| Item give | `{"item": "ITEM_ID"}` | `{"item": "MEI_LIN_RECORDING"}` |

---

## SECTION 3: QUEST SYSTEM SPECIFICATION

### Quest State Machine

```
┌──────────┐    Prereqs    ┌───────────┐    Start    ┌────────────┐
│ INACTIVE │───────────────▶│ AVAILABLE │─────────────▶│ IN_PROGRESS│
└──────────┘      Met       └───────────┘   Trigger   └─────┬──────┘
                                                            │
                      ┌─────────────────────────────────────┤
                      │                                     │
                      ▼                                     ▼
               ┌───────────┐                         ┌───────────┐
               │ COMPLETED │                         │  FAILED   │
               └───────────┘                         └───────────┘
```

### Quest Data Structure

```json
{
  "quest_id": "SQ_ROSA_MIGUEL",
  "title": "Blood and Oil",
  "type": "RELATIONSHIP",
  "prerequisites": {
    "flags": [
      {"flag": "MET_ROSA", "value": true},
      {"flag": "ROSA_RELATIONSHIP", "operator": ">=", "value": 40}
    ],
    "tier_minimum": 4,
    "blocking_flags": ["ROSA_DEAD"]
  },
  "objectives": [
    {"id": "OBJ_1", "description": "Find Miguel's location", "type": "DISCOVERY"},
    {"id": "OBJ_2", "description": "Infiltrate the facility", "type": "LOCATION"},
    {"id": "OBJ_3", "description": "Rescue Miguel", "type": "ACTION"}
  ],
  "outcomes": [
    {"id": "SUCCESS", "flags": [{"flag": "MIGUEL_RESCUED", "value": true}]},
    {"id": "PARTIAL", "flags": [{"flag": "MIGUEL_INJURED", "value": true}]},
    {"id": "FAILURE", "flags": [{"flag": "MIGUEL_DIED", "value": true}]}
  ]
}
```

---

## SECTION 4: BARK SYSTEM SPECIFICATION

### Bark Trigger Contexts

| Context | Trigger | Priority |
|---------|---------|----------|
| Combat_Entry | Combat state entered | High |
| Combat_Damage | Player takes damage | High |
| Combat_Victory | All enemies defeated | Medium |
| Tier_Recognition | NPC sees player's tier | Low |
| Humanity_Reaction | NPC reacts to chrome level | Low |
| Ambient | Time/location based | Lowest |

### Bark Selection Algorithm

```python
def select_bark(context, player_state):
    # Get all barks for context
    available_barks = get_barks_for_context(context)

    # Filter by conditions
    valid_barks = [b for b in available_barks if check_conditions(b, player_state)]

    # Check cooldowns (no repeat within 5 triggers)
    fresh_barks = [b for b in valid_barks if not on_cooldown(b)]

    # Select random from valid, fresh barks
    if fresh_barks:
        return random.choice(fresh_barks)
    elif valid_barks:
        return random.choice(valid_barks)  # Allow repeat if necessary
    else:
        return None  # No valid bark
```

### Bark Data Structure

```json
{
  "bark_id": "TIER_RECOGNITION_HIGH_01",
  "context": "TIER_RECOGNITION",
  "conditions": [
    {"flag": "TIER", "operator": ">=", "value": 8}
  ],
  "speaker": "GENERIC_NPC",
  "text": "That's the Tier 8 courier. Don't make eye contact.",
  "voice_file": "tier_recog_high_01.wav",
  "cooldown": 5,
  "priority": "LOW"
}
```

---

## SECTION 5: RELATIONSHIP SYSTEM SPECIFICATION

### Relationship Value Management

```python
class RelationshipManager:
    def modify_relationship(self, npc_id, change, reason=""):
        current = self.get_relationship(npc_id)
        new_value = clamp(current + change, -100, 100)
        self.set_relationship(npc_id, new_value)
        self.log_change(npc_id, change, reason)
        self.check_thresholds(npc_id, current, new_value)

    def check_thresholds(self, npc_id, old_value, new_value):
        thresholds = [25, 50, 75, -25, -50, -75]
        for threshold in thresholds:
            if crossed_threshold(old_value, new_value, threshold):
                self.trigger_threshold_event(npc_id, threshold)
```

### Relationship Stage Thresholds

| Range | Stage | Content Access |
|-------|-------|----------------|
| -100 to -76 | Enemy | Attack on sight possible |
| -75 to -51 | Hostile | Won't help, may hinder |
| -50 to -26 | Distrustful | Limited interaction |
| -25 to 0 | Neutral | Basic interaction |
| 1 to 25 | Acquaintance | Normal dialogue |
| 26 to 50 | Friend | Personal quests |
| 51 to 75 | Close | Secrets revealed |
| 76 to 100 | Intimate | Full trust, romance eligible |

---

## SECTION 6: HUMANITY SYSTEM SPECIFICATION

### Humanity Calculation

```python
class HumanityManager:
    def calculate_humanity(self):
        base_humanity = 100
        chrome_penalty = self.calculate_chrome_penalty()
        story_modifiers = self.get_story_modifiers()
        return clamp(base_humanity - chrome_penalty + story_modifiers, 0, 100)

    def calculate_chrome_penalty(self):
        penalty = 0
        for augment in self.installed_augments:
            penalty += augment.humanity_cost
        return penalty
```

### Algorithm Voice Stage Triggers

| Humanity Range | Stage | Voice Profile |
|----------------|-------|---------------|
| 80-100 | 1 | Clinical, helpful |
| 60-79 | 2 | Warmer, "we" begins |
| 40-59 | 3 | Possessive, Shadow active |
| 20-39 | 4 | Dominant, controlling |
| 0-19 | 5 | Complete control |

### Special Humanity Values

| Value | Effect |
|-------|--------|
| 0 | Forces Ascension ending |
| 50 | Unlocks "Eighth Tier" hidden content |
| 100 | Special "Pure Human" dialogue |

---

## SECTION 7: ENDING SYSTEM SPECIFICATION

### Ending Determination

```python
def determine_available_endings(player_state):
    available = []

    # Ascension (always available if Algorithm integrated)
    if player_state.algorithm_integrated:
        available.append("ASCENSION")

    # Rogue (always available)
    available.append("ROGUE")

    # Third Path (requires conditions)
    if (player_state.algorithm_integrated and
        player_state.met_solomon and
        player_state.discovered_interstitial and
        player_state.humanity >= 20):
        available.append("THIRD_PATH")

    return available
```

### Ending Variant Selection

| Ending | Variant | Condition |
|--------|---------|-----------|
| Ascension | Transcendence | ALGORITHM_TRUST >= 75 |
| Ascension | Ambiguity | ALGORITHM_TRUST 25-74 |
| Ascension | Horror | ALGORITHM_TRUST < 25 |
| Rogue | With Rosa | ROSA_ROMANCE_ACTIVE AND ROSA_CHOSEN |
| Rogue | With Jin | JIN_ALLY_STATUS AND NOT ROSA |
| Rogue | Alone | Neither companion condition |
| Third Path | Perfect Balance | HUMANITY 40-60 AND EIGHTH_ATTAINED |
| Third Path | Imperfect | Other Third Path conditions |

---

## SECTION 8: TESTING REQUIREMENTS

### Unit Tests Required

| System | Tests |
|--------|-------|
| Dialogue | Condition evaluation, fallback selection |
| Quest | State transitions, prerequisite checking |
| Bark | Context triggering, cooldown management |
| Relationship | Threshold crossing, value clamping |
| Humanity | Calculation, stage transitions |
| Ending | Availability check, variant selection |

### Integration Tests Required

| Test Case | Description |
|-----------|-------------|
| Full playthrough | Each ending reachable |
| Relationship arcs | Each NPC full arc |
| Flag propagation | Choices affect later content |
| Edge cases | Boundary values (0, 50, 100) |

### Regression Tests

| Area | Trigger |
|------|---------|
| All endings | Any ending logic change |
| Dialogue conditions | Any flag rename |
| Quest prerequisites | Any quest modification |

---

## SECTION 9: FILE STRUCTURE

### Narrative Content Location

```
surge-narrative/
├── 01_CHARACTERS/           # Character profiles
├── 03_QUESTS/               # Quest content
│   ├── main_story/          # Tier progression
│   ├── side_quests/         # Optional content
│   ├── relationship_quests/ # Character arcs
│   └── hidden_content/      # Secret quests
├── 05_WORLD_TEXT/           # Environmental text
├── 06_ALGORITHM_VOICE/      # Algorithm dialogue
├── 07_ITEMS_INVENTORY/      # Item descriptions
├── 08_VOICE_ACTING/         # Voice direction
├── 09_BRANCHING_POINTS/     # Decision callbacks
├── 10_BARKS_REACTIONS/      # Bark content
└── 13_METADATA_TRACKING/    # Technical docs
    ├── technical/           # Implementation specs
    ├── localization/        # Translation reference
    └── qa/                  # QA reports
```

### Reference Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Flag Master List | `technical/story_flags_master_list.md` | All flags |
| Variable System | `technical/variable_system.md` | All variables |
| Condition Syntax | `technical/condition_syntax_reference.md` | Quick reference |
| Cross-Reference | `technical/flag_cross_reference_matrix.md` | Flag dependencies |

---

## SECTION 10: IMPLEMENTATION CHECKLIST

### Phase 1: Core Systems
- [ ] Dialogue engine with condition evaluation
- [ ] Flag/variable manager
- [ ] Quest state machine
- [ ] Relationship tracker
- [ ] Humanity calculator

### Phase 2: Content Integration
- [ ] Import all dialogue nodes
- [ ] Import all quest definitions
- [ ] Import all bark content
- [ ] Link voice files to content

### Phase 3: Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] All endings reachable
- [ ] All relationship arcs complete

### Phase 4: Polish
- [ ] Voice acting integration
- [ ] Localization support
- [ ] Accessibility features
- [ ] Content warnings system

---

## SECTION 11: KNOWN ISSUES FROM QA

### Must Fix Before Implementation

| ID | Issue | Priority |
|----|-------|----------|
| QA-001 | Yamada daughter scene needs location check | High |
| QA-002 | PLAYER_CHROME_LEVEL undefined | High |
| DOC-001 | Flag naming inconsistency | Medium |
| DOC-002 | Variable naming inconsistency | Medium |

### Recommended Enhancements

| Enhancement | Benefit |
|-------------|---------|
| Debug console | Faster testing |
| Flag viewer | QA efficiency |
| State export | Bug reproduction |

---

*Implementation Guide - Surge Protocol*
*Created: Phase 5 Session 8*
*For development team use*
