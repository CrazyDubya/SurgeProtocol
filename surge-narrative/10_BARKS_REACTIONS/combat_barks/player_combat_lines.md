# Player Combat Barks

## Overview
These lines play during combat encounters, triggered by specific actions and states.

---

## Attack Initiation

### Melee Attack
**Context**: Player initiates melee combat

**Variant 1** [HUMANITY >= 60]
"Here we go."
[VOICE: Determined, controlled]

**Variant 2** [HUMANITY >= 60]
"Should've walked away."
[VOICE: Regretful but committed]

**Variant 3** [HUMANITY 40-59]
"Let's see what you've got."
[VOICE: Cold, clinical]

**Variant 4** [HUMANITY 40-59]
"This ends now."
[VOICE: Efficient, no emotion]

**Variant 5** [HUMANITY < 40]
*No verbal bark - action only*
[VOICE DIRECTION: Silence is more unnerving]

### Ranged Attack
**Context**: Player fires ranged weapon

**Variant 1** [FIRST_SHOT_COMBAT]
"Don't make me regret this."
[VOICE: Warning tone, still giving chance]

**Variant 2** [COMBAT_EXTENDED]
"Stay down."
[VOICE: Tired of this fight]

**Variant 3** [HUMANITY < 50]
"Optimal trajectory acquired."
[VOICE: Clinical, Algorithm influence]

---

## Taking Damage

### Light Damage (>75% health)
**Context**: Player takes minor hit

**Variant 1**
*Grunt* "That all you got?"
[VOICE: Dismissive]

**Variant 2**
"Lucky shot."
[VOICE: Annoyed]

**Variant 3** [AUGMENTED_ARMOR]
*Metallic impact sound* "Armor's holding."
[VOICE: Relief]

### Moderate Damage (25-75% health)
**Context**: Player takes significant damage

**Variant 1** [HUMANITY >= 50]
*Pained grunt* "Getting rough..."
[VOICE: Strained but focused]

**Variant 2** [HUMANITY >= 50]
"Okay. Okay. Still standing."
[VOICE: Self-reassurance]

**Variant 3** [HUMANITY < 50]
"Damage within acceptable parameters."
[VOICE: Clinical, concerning]

**Variant 4** [ALGORITHM_INTEGRATED]
[ALGORITHM]: "Recommend tactical withdrawal."
[VOICE: Algorithm interrupting player pain]

### Heavy Damage (<25% health)
**Context**: Player critically wounded

**Variant 1** [HUMANITY >= 60]
"Can't... can't take much more..."
[VOICE: Desperate, human fear]

**Variant 2** [HUMANITY 40-59]
"Systems... failing..."
[VOICE: Mixed human/machine distress]

**Variant 3** [HUMANITY < 40]
"Critical threshold. Require repair."
[VOICE: Disturbingly calm]

**Variant 4** [ROSA_RELATIONSHIP >= 50]
"Rosa... if this is it..."
[VOICE: Personal, regret]

---

## Victory Lines

### Combat Victory (Standard)
**Context**: All enemies defeated

**Variant 1** [HUMANITY >= 70]
*Heavy breathing* "Everyone okay? I mean... yeah. Done."
[VOICE: Catching breath, checking surroundings]

**Variant 2** [HUMANITY 50-69]
"That's handled."
[VOICE: Professional, moving on]

**Variant 3** [HUMANITY < 50]
"Threats neutralized. Resuming route."
[VOICE: Algorithm efficiency]

### Combat Victory (First Kill Ever)
**Context**: Player's first lethal victory - SPECIAL FLAG

**Single Line**
*Long silence* "...it had to be done. Right?"
[VOICE: Doubt, seeking validation, voice cracking slightly]
[FLAG SET: KILLED_FIRST_PERSON]

### Combat Victory (Against Named Enemy)
**Context**: Defeating a significant enemy

**Variant 1** [JIN_ENEMY]
"Should've stayed out of my way, Jin."
[VOICE: Bitter satisfaction or regret depending on relationship]

**Variant 2** [CHROME_SAINTS_ENEMY]
"Tell your Saints. I'm not to be messed with."
[VOICE: Warning for survivors]

---

## Defeat/Death Lines

### Knocked Down
**Context**: Player loses fight but survives

**Variant 1** [HUMANITY >= 60]
"Not... like this..."
[VOICE: Refusing to give up]

**Variant 2** [HUMANITY < 60]
"Error... recalculating..."
[VOICE: System failure tone]

### Death (Rare - usually respawn)
**Context**: True death state

**Single Line**
"At least... I chose my own path..."
[VOICE: Final breath, acceptance]

---

## Skill Use Callouts

### Hacking Initiation
**Context**: Player begins hack attempt

**Variant 1**
"Accessing... give me a second."
[VOICE: Concentration]

**Variant 2** [ALGORITHM_INTEGRATED]
[ALGORITHM]: "We'll handle the intrusion."
[VOICE: Algorithm taking over]

### Stealth Engagement
**Context**: Player enters stealth mode

**Variant 1**
*Quiets breathing* "Nice and quiet."
[VOICE: Whisper, careful]

**Variant 2** [AUGMENT_STEALTH]
"Activating cloak."
[VOICE: Technical, chrome engaged]

### Escape/Disengage
**Context**: Player breaks from combat

**Variant 1** [HUMANITY >= 60]
"Not worth dying over!"
[VOICE: Practical survival]

**Variant 2** [HUMANITY < 60]
"Tactical retreat. Optimal survival path."
[VOICE: Clinical retreat]

---

## Low Health Warnings

### Algorithm Warning (If Integrated)
**Context**: Health drops below 30%

**[ALGORITHM - HUMANITY 80+]**
"Warning: Vital signs critical. Recommend immediate medical attention."
[VOICE: Clinical concern]

**[ALGORITHM - HUMANITY 60-79]**
"You're hurt. We need to get you safe."
[VOICE: Personal concern]

**[ALGORITHM - HUMANITY 40-59]**
"Our body is failing. This is unacceptable."
[VOICE: Possessive concern]

**[ALGORITHM - HUMANITY < 40]**
"Vessel damage exceeds optimal parameters. Repair required."
[VOICE: The player is just a vessel now]

### Shadow Warning (If Forked)
**Context**: Health drops below 30%

**[SHADOW]**
"*We're dying, Prime. Make a decision.*"
[VOICE: Urgent, survival-focused]

**[SHADOW - DIVERGENT]**
"*If you die, I die. Don't be stupid.*"
[VOICE: Self-preservation fear]

---

## Environmental Reaction Barks

### Hazard Warning
**Context**: Player enters dangerous area

**Variant 1** [TOXIN_AREA]
*Coughing* "Air's bad here. Move fast."
[VOICE: Physical reaction]

**Variant 2** [UNSTABLE_STRUCTURE]
"This place is falling apart. Watch your step."
[VOICE: Careful observation]

**Variant 3** [ALGORITHM_INTEGRATED]
[ALGORITHM]: "Environmental hazard detected. Plotting safe path."
[VOICE: Helpful intervention]

### Cover Callout
**Context**: Player takes cover

**Variant 1**
"Good spot. Catching my breath."
[VOICE: Relief, momentary safety]

**Variant 2** [COMBAT_INTENSE]
"Can't stay here long!"
[VOICE: Urgency]

### Ambush Detection
**Context**: Player spots hidden enemy

**Variant 1** [PERCEPTION_HIGH]
"Wait—there. Movement."
[VOICE: Alert, warning tone]

**Variant 2** [ALGORITHM_INTEGRATED]
[ALGORITHM]: "Hostile signature detected. Northeast, 15 meters."
[VOICE: Precise tactical info]

---

## Line Count Summary

| Category | Lines |
|----------|-------|
| Attack Initiation | 8 |
| Taking Damage | 11 |
| Victory | 7 |
| Defeat | 3 |
| Skill Use | 6 |
| Low Health Warnings | 6 |
| Environmental | 7 |
| **Total** | **48** |

---

## Voice Acting Notes

### General Direction
- Player voice should range from human warmth (high humanity) to clinical detachment (low humanity)
- Record all variants for maximum flexibility
- Algorithm lines should feel like intrusion—separate recording session, different processing

### Emotional Range Needed
- Fear (genuine, human)
- Determination (resolve)
- Pain (physical, visceral)
- Detachment (Algorithm influence)
- Doubt (especially first kill)

### Technical Notes
- Short lines preferred (under 8 words where possible)
- Leave room for sound effects
- Some lines intentionally silent for low humanity
