# Dialogue Node Specification

## Overview

This document defines the structure and technical specification for dialogue nodes in Surge Protocol. All dialogue content should follow this format for proper game engine integration.

---

## Node Types

### 1. NPC_LINE
Dialogue spoken by an NPC. Cannot be interrupted by player.

**Fields:**
- `node_id`: Unique identifier (e.g., "CHEN_GREETING_001")
- `speaker`: NPC identifier (e.g., "dispatcher_chen")
- `text`: The dialogue line
- `emotion`: Voice acting direction (neutral, concerned, angry, happy, sad, etc.)
- `next`: ID of next node or "PLAYER_HUB"
- `conditions`: Optional requirements to see this node

**Example:**
```json
{
  "node_id": "CHEN_GREETING_001",
  "node_type": "NPC_LINE",
  "speaker": "dispatcher_chen",
  "text": "You got the look. Desperate, hungry. Good. You'll need that.",
  "emotion": "weary_approval",
  "next": "CHEN_INTRO_HUB_001",
  "conditions": {
    "first_meeting": true
  }
}
```

### 2. PLAYER_HUB
Player choice node. Presents multiple dialogue options.

**Fields:**
- `node_id`: Unique identifier
- `options`: Array of player response objects

**Player Response Object:**
- `text`: What player says
- `tone`: Emotional tone (neutral, aggressive, empathetic, sarcastic, professional)
- `requirements`: Optional skill/attribute checks
- `next`: ID of next node
- `effects`: Game state changes

**Example:**
```json
{
  "node_id": "CHEN_INTRO_HUB_001",
  "node_type": "PLAYER_HUB",
  "options": [
    {
      "text": "I just need work.",
      "tone": "neutral",
      "next": "CHEN_RESPONSE_WORK_001",
      "effects": {
        "relationship_change": 0
      }
    },
    {
      "text": "I'm not desperate.",
      "tone": "defensive",
      "next": "CHEN_RESPONSE_DEFENSIVE_001",
      "effects": {
        "relationship_change": -5
      }
    },
    {
      "text": "Tell me about the job.",
      "tone": "professional",
      "requirements": {
        "COMPOSURE": 8
      },
      "next": "CHEN_RESPONSE_PROFESSIONAL_001",
      "effects": {
        "relationship_change": 5
      }
    }
  ]
}
```

### 3. SKILL_CHECK
A dialogue option that requires a skill check to succeed.

**Fields:**
- `node_id`: Unique identifier
- `check_type`: Skill being checked (DECEPTION, INTIMIDATION, EMPATHY, TECH_KNOWLEDGE, STREET_SMARTS)
- `difficulty`: Target number (2-12, based on 2d6 system)
- `success_node`: Node ID if check succeeds
- `failure_node`: Node ID if check fails
- `critical_success`: Optional node ID for roll of 12
- `critical_failure`: Optional node ID for roll of 2

**Example:**
```json
{
  "node_id": "ROSA_PERSUADE_CHECK_001",
  "node_type": "SKILL_CHECK",
  "check_type": "EMPATHY",
  "difficulty": 8,
  "text": "[Empathy] Try to understand her pain.",
  "success_node": "ROSA_OPENS_UP_001",
  "failure_node": "ROSA_SHUTS_DOWN_001",
  "critical_success": "ROSA_BREAKTHROUGH_001",
  "effects_on_success": {
    "relationship_change": 15,
    "unlock_flag": "ROSA_TRAUMA_REVEALED"
  },
  "effects_on_failure": {
    "relationship_change": -5
  }
}
```

### 4. CONDITIONAL_BRANCH
Branching node based on game state. Evaluates conditions and routes to appropriate node.

**Fields:**
- `node_id`: Unique identifier
- `branches`: Array of condition/node pairs
- `default`: Default node if no conditions met

**Example:**
```json
{
  "node_id": "TANAKA_HUMANITY_CHECK_001",
  "node_type": "CONDITIONAL_BRANCH",
  "branches": [
    {
      "condition": {
        "humanity": {"min": 80}
      },
      "next": "TANAKA_HIGH_HUMANITY_001"
    },
    {
      "condition": {
        "humanity": {"min": 60, "max": 79}
      },
      "next": "TANAKA_MID_HUMANITY_001"
    },
    {
      "condition": {
        "humanity": {"min": 40, "max": 59}
      },
      "next": "TANAKA_LOW_HUMANITY_001"
    }
  ],
  "default": "TANAKA_CRITICAL_HUMANITY_001"
}
```

### 5. END_CONVERSATION
Terminates dialogue and returns to game.

**Fields:**
- `node_id`: Unique identifier
- `farewell_text`: Optional final NPC line
- `effects`: Game state changes on exit

**Example:**
```json
{
  "node_id": "CHEN_GOODBYE_STANDARD",
  "node_type": "END_CONVERSATION",
  "speaker": "dispatcher_chen",
  "farewell_text": "Stay sharp out there, kid.",
  "effects": {
    "relationship_change": 2
  }
}
```

---

## Condition System

### Available Conditions

**Character Stats:**
- `tier`: Player's current tier (0-10)
- `humanity`: Current humanity score (0-100)
- `relationship`: Relationship with speaker (-100 to 100)

**Attributes (each 2-20):**
- `COMPOSURE`, `EMPATHY`, `TECHNICAL`, `VELOCITY`, `VIOLENCE`

**Skills (each 0-10):**
- `DECEPTION`, `INTIMIDATION`, `EMPATHY_SKILL`, `TECH_KNOWLEDGE`, `STREET_SMARTS`

**Story Flags:**
- Boolean flags set by quests/dialogue
- Examples: `FIRST_AUGMENT_INSTALLED`, `MET_OKONKWO`, `KILLED_RIVAL_JIN`

**Inventory:**
- `has_item`: Check for specific item ID
- `credits`: Minimum credit amount

**Faction:**
- `faction_rep`: Reputation with specific faction
- `faction_standing`: Allied/Neutral/Hostile

**Time:**
- `game_time`: Hour of day (0-23)
- `days_elapsed`: Days since game start

### Condition Syntax

```json
{
  "conditions": {
    "tier": {"min": 3},
    "humanity": {"max": 60},
    "relationship": {"min": 40},
    "EMPATHY": {"min": 12},
    "flags": {
      "CORTICAL_STACK_INSTALLED": true,
      "REJECTED_TANAKA": false
    },
    "faction_rep": {
      "guild": {"min": 30}
    }
  }
}
```

**Operators:**
- `min`: Minimum value (inclusive)
- `max`: Maximum value (inclusive)
- `exact`: Exact value match
- `not`: Boolean NOT

---

## Relationship Changes

Dialogue choices modify NPC relationships:

**Relationship Tiers:**
- -100 to -60: Hostile
- -59 to -20: Unfriendly
- -19 to 19: Neutral
- 20 to 59: Friendly
- 60 to 100: Trusted

**Change Magnitudes:**
- ±2 to ±5: Minor change (normal conversation)
- ±10 to ±15: Significant change (important choice)
- ±20+: Major change (betrayal, revelation, romance milestone)

---

## Voice Acting Tags

**Emotion Tags:**
- `neutral`: Default conversational tone
- `happy`, `sad`, `angry`, `fearful`, `disgusted`, `surprised`
- `weary`, `hopeful`, `cynical`, `protective`, `suspicious`
- `flirtatious`, `threatening`, `pleading`, `resigned`

**Intensity Modifiers:**
- `mild_`, `moderate_`, `intense_` (e.g., `intense_angry`)

**Special Tags:**
- `whisper`: Quiet, secretive
- `shouting`: Loud, urgent
- `radio_filter`: Played through comm device
- `synthetic`: Algorithm/AI voice
- `echo`: Shadow/divergent self

---

## Integration Notes

1. **Node ID Naming Convention**: `{NPC_NAME}_{CATEGORY}_{NUMBER}`
   - Example: `CHEN_GREETING_001`, `ROSA_ROMANCE_050`

2. **Conversation Structure**:
   - Start with NPC_LINE (greeting)
   - Flow to PLAYER_HUB (choices)
   - Branch based on choices
   - End with END_CONVERSATION

3. **Fail Forward**: Failed skill checks should lead to interesting outcomes, not dead ends

4. **Humanity Gating**: High-humanity options should be clearly marked and inspiring; low-humanity options should feel efficient but hollow

5. **Relationship Callbacks**: Track important relationship milestones with flags for later reference

---

## Example Complete Conversation

See `02_DIALOGUE_TREES/greetings/first_meeting_greetings.md` for complete conversation examples implementing this specification.

---

## Technical Export

Each markdown dialogue file should be exportable to JSON for game engine consumption. Maintain both human-readable `.md` and machine-readable `.json` versions.

**Markdown Format:**
- Use headers for readability
- Include context comments
- Document emotional beats

**JSON Format:**
- Strict schema validation
- No comments (use separate documentation)
- Optimized for runtime parsing

---

**Last Updated**: 2026-01-21
**Version**: 1.0
**Status**: Template Ready
