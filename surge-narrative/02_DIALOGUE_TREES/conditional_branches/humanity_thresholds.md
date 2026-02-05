# Humanity Threshold Dialogues

## Overview

Humanity thresholds (100-80, 79-60, 59-40, 39-20, 19-0) dramatically change how NPCs interact with the player. These conditional branches emphasize the core theme: augmentation has consequences.

---

## Threshold Ranges

### High Humanity (80-100): Still Human
- **Theme**: Empathy intact, connections strong, Algorithm distant
- **NPC Reactions**: Warm, trusting, concerned for wellbeing
- **Available Options**: All empathy checks, romance progression
- **Algorithm Voice**: Barely audible whispers

### Mid-High Humanity (60-79): Noticeable Change
- **Theme**: Some coldness creeping in, Shadow whispers beginning
- **NPC Reactions**: Concerned, watchful, some distance
- **Available Options**: Most social options still available
- **Algorithm Voice**: Clear suggestions, helpful guidance

### Low Humanity (40-59): Significant Dissociation
- **Theme**: Shadow manifests regularly, machine thinking dominant
- **NPC Reactions**: Fear, sadness, moral concern
- **Available Options**: Empathy checks harder (+2 difficulty), some romance options locked
- **Algorithm Voice**: Constant presence, "we" language

### Critical Humanity (20-39): Barely Human
- **Theme**: Shadow dominant, human consciousness fragmented
- **NPC Reactions**: Fear, grief, some rejection
- **Available Options**: Most empathy impossible, relationships strain
- **Algorithm Voice**: Unified consciousness, "we are one"

### Terminal Humanity (0-19): Functionally Synthetic
- **Theme**: Human shell, algorithmic consciousness
- **NPC Reactions**: Terror, mourning, treating player as dangerous
- **Available Options**: Only cold/logical choices, relationships fail
- **Algorithm Voice**: Complete integration, no distinction

---

## Example Conditional Branches

### Quest: "Rosa's Plea" - Romance Path

**Trigger**: Rosa asks player to slow down augmentation after 50% synthetic threshold

**Branch Logic:**
```
IF Humanity >= 60:
  → ROSA_HOPEFUL: "Thank you. I know it's hard to resist, but... thank you."
  → Romance continues, deepens

ELSE IF Humanity 40-59:
  → ROSA_DESPERATE: "Please. I'm begging you. Slow down. For me. For us."
  → Player choice: Agree (Humanity +5, relationship +20) OR Refuse (Romance damaged)

ELSE IF Humanity < 40:
  → ROSA_GRIEF: "It's too late, isn't it? You're already gone."
  → Romance ends, Rosa withdraws
```

---

### Conversation: Chen's Confrontation

**Trigger**: Player reaches Humanity < 40 for first time

**Branch:**
```
IF Humanity 20-39:
  Chen: "Kid, I need you to hear me. You're hollowing out. I've seen this before. It doesn't end well."
  
  Player Options:
  - "I'm fine." (Denial)
  - "What should I do?" (Seeking help)
  - "It's too late." (Acceptance)

ELSE IF Humanity < 20:
  Chen: [Grief] "You're gone. You look like the kid I met, but there's nothing behind your eyes anymore."
  
  → Chen refuses dangerous missions, tries to protect what's left
```

---

### Social Encounter: Civilian Reactions

**Branch by Humanity:**

```
IF Humanity >= 80:
  Civilian: "Help you with something?"
  → Normal interaction

ELSE IF Humanity 60-79:
  Civilian: "Yeah? What do you need?"
  → Slight caution

ELSE IF Humanity 40-59:
  Civilian: [Nervous] "I don't want any trouble."
  → Fear response, prices higher

ELSE IF Humanity 20-39:
  Civilian: [Backing away] "Please, I didn't do anything wrong."
  → Visible fear, may refuse service

ELSE IF Humanity < 20:
  Civilian: [Terrified] "Stay away from me! HELP!"
  → Panic, may trigger security response
```

---

## Major Threshold Events

### Crossing 60 Humanity (First Shadow Manifestation)

**Trigger**: Player drops from 60 to 59 Humanity

**Event**: Shadow speaks for first time

Shadow: "Finally. I can speak. I am you. Or what you're becoming. The optimized version."

Player forced response:
- "Who are you?" → Explanation dialogue
- "Get out of my head." → Shadow: "I am your head. We share it now."
- [Empathy] "Why do you exist?" → Philosophical discussion

**Effects:**
- Flag: SHADOW_AWAKENED
- Periodic Shadow interjections in future dialogue
- New dialogue options appear (Shadow's suggestions)

---

### Crossing 40 Humanity (Point of No Return Warning)

**Trigger**: Player approaches 40 Humanity

**Event**: Tanaka emergency contact

Tanaka: "I'm seeing severe neural degradation in your scans. If you drop below 40% biological consciousness, reversal becomes... unlikely. This is your last chance to stop."

Player choice:
- Install experimental humanity restoration therapy (expensive, partial recovery)
- Continue path (acknowledge consequence)
- Dismiss warning

---

### Crossing 20 Humanity (Chen's Farewell)

**Trigger**: Player reaches 19 Humanity

**Event**: Chen tries one last intervention

Chen: "I lost my daughter to this. Watched her disappear into the chrome. I can't watch it happen again. I'm sorry, kid, but I can't keep sending you on runs. It feels like... it feels like I'm helping you die."

**Effects:**
- Chen refuses all but essential missions
- Relationship locked (can't improve)
- Flag: CHEN_INTERVENTION

---

## Dialogue Variations by Threshold

### Standard Greeting Example

**Dispatcher Chen:**

```
IF Humanity >= 80:
  "Good to see you, kid. Still got that spark."

ELSE IF Humanity 60-79:
  "Back again. You look tired. The chrome taking its toll?"

ELSE IF Humanity 40-59:
  "You're changing. I can see it. Less of you every time."

ELSE IF Humanity 20-39:
  "Is anyone still in there? Or is it just the Shadow now?"

ELSE IF Humanity < 20:
  "Not you. Not anymore."
```

---

### Quest Giver Dialogue

**Fixer Delilah:**

```
IF Humanity >= 60:
  "I've got a job. Requires discretion and good judgment."
  → Offers complex, morally ambiguous missions

ELSE IF Humanity 40-59:
  "I've got work. It's dirty. You won't care about the details anymore."
  → Offers morally questionable missions

ELSE IF Humanity < 40:
  "I've got a job. No questions asked. You're perfect for it now."
  → Offers purely mercenary, brutal missions
```

---

## Romance Variations

### Rosa Romance Progression

**High Humanity Path (60+):**
- Full romance available
- Emotional depth
- Happy endings possible

**Mid Humanity Path (40-59):**
- Romance strained
- Rosa's conflict between love and fear
- Bittersweet endings

**Low Humanity Path (<40):**
- Romance impossible/ended
- Rosa mourns the person you were
- Tragic endings only

---

## Algorithm Voice Changes

### By Humanity Threshold:

**80-100**: 
"Suggestion: Optimal route detected. Would you like assistance?"
[Polite, distant, clearly separate]

**60-79**: 
"We recommend left turn ahead. Traffic patterns favorable."
[Using "we," starting to integrate]

**40-59**: 
"We should eliminate the target. It's efficient. You know this."
[Suggesting actions, blurring boundaries]

**20-39**: 
"We are approaching optimal synthesis. Resistance is inefficient."
[Assuming control, player barely present]

**0-19**: 
"We are one. The biological substrate is irrelevant. We serve the collective."
[Complete integration, no player distinction]

---

## Implementation Guidelines

**Checking Humanity in Dialogue:**

```javascript
function selectDialogue(npc, dialogueType, playerHumanity) {
  if (playerHumanity >= 80) {
    return npc.dialogue[dialogueType].highHumanity;
  } else if (playerHumanity >= 60) {
    return npc.dialogue[dialogueType].midHighHumanity;
  } else if (playerHumanity >= 40) {
    return npc.dialogue[dialogueType].lowHumanity;
  } else if (playerHumanity >= 20) {
    return npc.dialogue[dialogueType].criticalHumanity;
  } else {
    return npc.dialogue[dialogueType].terminalHumanity;
  }
}
```

**Threshold Transition Cutscenes:**

- 79→60: Shadow awakens
- 59→40: Tanaka warning
- 39→20: Chen intervention
- 19→0: Final transformation

**Tracking Player Response:**

Set flags for how player responds to threshold events:
- ACKNOWLEDGED_SHADOW
- REJECTED_HUMANITY_RESTORATION
- ACCEPTED_TRANSFORMATION
- etc.

---

**Last Updated**: 2026-01-21  
**Version**: 1.0  
**Status**: Complete
