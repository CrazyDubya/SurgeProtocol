# Skill Check Dialogue Template

## Overview

This template demonstrates how to implement skill check dialogues in Surge Protocol. Skill checks create meaningful player choice and consequence, allowing different character builds to approach situations differently.

---

## Core Principles

1. **Multiple Paths**: Every skill check should have alternative approaches
2. **Fail Forward**: Failure should be interesting, not a dead end
3. **Build Variety**: Respect different character builds (combat vs. social vs. technical)
4. **Consequence**: Choices should matter to relationships and story

---

## Skill Types

### Social Skills

**DECEPTION** (Lying, Manipulation, Con Artist)
- Difficulty: 6-10 depending on NPC Intelligence/Composure
- Success: NPC believes false information
- Failure: Suspicion, relationship damage
- Critical Failure: Exposed, major relationship hit

**INTIMIDATION** (Threats, Fear, Coercion)
- Difficulty: 5-9 depending on NPC Violence/Composure
- Success: Compliance through fear
- Failure: Resistance, escalation
- Side Effect: Always reduces relationship (even on success)

**EMPATHY** (Understanding, Compassion, Emotional Intelligence)
- Difficulty: 7-10 depending on NPC's emotional state
- Success: Deep connection, reveals secrets
- Failure: Misunderstood gesture, awkwardness
- Benefit: Often improves relationship significantly

### Knowledge Skills

**TECH_KNOWLEDGE** (Hacking, Engineering, Systems)
- Difficulty: 6-11 depending on complexity
- Success: Technical solution, bypass security
- Failure: Locked out, potential alarm
- Context: Used in technical conversations or problems

**STREET_SMARTS** (Criminal Knowledge, Urban Survival, Reading People)
- Difficulty: 6-10 depending on situation obscurity
- Success: Spot dangers, understand subtext
- Failure: Miss warning signs, walk into trap
- Benefit: Often reveals hidden opportunities

---

## Template: Skill Check Node

```markdown
### Scene Context
Brief description of situation leading to check.

---

**Node: SKILL_CHECK_{SKILL}_{ID}**

**Pre-Check Dialogue:**
NPC: "Setup line that creates the skill check opportunity."

**Player Options:**
1. [Skill Name] Attempt description (Requirements: ATTRIBUTE >= X)
2. Alternative non-check option (Always available)
3. Walk away option (Always available)

---

**Check Details:**
- Skill: {SKILL_NAME}
- Difficulty: {2-12}
- Attribute Requirement: {ATTRIBUTE} >= {VALUE}

---

**Success Path (Roll Success):**

NPC Response:
"Impressed or compliant reaction."
[Emotional direction: {emotion}]

Effects:
- Relationship: +{amount}
- Unlock: {flag_name}
- {Other effects}

Next: {node_id}

---

**Failure Path (Roll Failure):**

NPC Response:
"Disappointed or defensive reaction."
[Emotional direction: {emotion}]

Effects:
- Relationship: {change}
- {Other effects}

Next: {node_id}

---

**Critical Success (Roll 12):**
Optional: Extra benefit path

NPC Response:
"Amazed or completely convinced."

Effects:
- Relationship: +{large_amount}
- Bonus reward
- Unique unlock

---

**Critical Failure (Roll 2):**
Optional: Catastrophic outcome

NPC Response:
"Angry, betrayed, or alarmed reaction."

Effects:
- Relationship: -{large_amount}
- Quest failure or complication
- Negative flag set

---

**Alternative Path (Non-check option):**
Fallback if player doesn't attempt check or lacks requirements.

NPC Response:
"Standard response to non-check choice."

Next: {node_id}

```

---

## Example 1: Deception Check

### Context
Player needs to access a restricted corpo floor. Guard is questioning credentials.

---

**Node: GUARD_CHALLENGE_001**

**Pre-Check Dialogue:**
Guard: "I don't have you on the visitor list. State your business."

**Player Options:**
1. [Deception] "I'm from IT. Emergency network audit." (Requires: TECHNICAL >= 8)
2. [Intimidation] "You really want to explain to Nakamura why their consultant was delayed?" (Requires: VIOLENCE >= 10)
3. "My mistake. Wrong floor." (No check)

---

**DECEPTION CHECK:**
- Skill: DECEPTION
- Difficulty: 8
- Requirement: TECHNICAL >= 8 (needed for technical jargon)

**Success:**
Guard: "Oh, IT. Should've said so. Network's been glitchy all day. Third door on the left."
[Emotional direction: relieved]

Effects:
- Relationship: +0 (neutral interaction)
- Flag: DECEIVED_GUARD_FLOOR_42
- Access granted

---

**Failure:**
Guard: "IT? I just got off the line with IT about maintenance tonight. Who are you really?"
[Emotional direction: suspicious]

Effects:
- Relationship: -10
- Alert: Security interest increased
- Must find alternative entry

**Recovery Options:**
1. "Must be a different department. Never mind." (Retreat)
2. [Intimidation] Attempt fallback check
3. [Violence] Attack guard (combat encounter)

---

## Example 2: Empathy Check

### Context
Rosa (mechanic, romance option) is withdrawing after player's augmentation. She's worried about them losing humanity.

---

**Node: ROSA_CONCERN_001**

**Pre-Check Dialogue:**
Rosa: "You're getting more chrome. I'm... I'm happy for you. More work for me, right?"
[She's clearly not happy. Eyes show fear.]

**Player Options:**
1. [Empathy] "Rosa, what's really bothering you?" (Requires: EMPATHY >= 12)
2. "You don't seem happy."
3. "I need the upgrades. No choice."

---

**EMPATHY CHECK:**
- Skill: EMPATHY
- Difficulty: 9
- Requirement: EMPATHY >= 12, Relationship >= 30

**Success:**
Rosa: "I... I had a brother. Courier, like you. He went too deep. Cortical stack, neural mesh, the works. One day he just... wasn't him anymore. Shadow took over completely. I watched someone I loved disappear into the chrome."
[Emotional direction: vulnerable_breaking]

Effects:
- Relationship: +20
- Flag: ROSA_BROTHER_REVEALED
- Unlock: "Rosa's Brother" side quest
- Romance progression milestone

---

**Failure:**
Rosa: "It's nothing. Just tired. Let me know when you're ready for the install."
[Emotional direction: guarded_withdrawn]

Effects:
- Relationship: +0
- She remains distant
- Try again later with higher relationship

---

## Example 3: Street Smarts Check

### Context
Player enters a bar that feels "off." Street Smarts check reveals it's a gang front.

---

**Node: BAR_ENTRY_001**

**Pre-Check Dialogue:**
[Automatic check when entering]

**STREET SMARTS CHECK:**
- Skill: STREET_SMARTS
- Difficulty: 7
- Auto-triggered perception check

**Success:**
[Internal monologue]: "Wrong crowd. The chrome pattern matches Chrome Saints. This is their territory. And that guy by the door? Packing heat under his jacket."
[Knowledge revealed]

Effects:
- Flag: RECOGNIZED_CHROME_SAINTS_BAR
- Dialogue options change
- Can negotiate or prepare for trouble

**Available Options:**
1. "I'm looking for [contact name]." (Gang negotiation)
2. Order drink and leave quickly (Avoid trouble)
3. [Intimidation] "Heard this is Chrome Saints turf. I want in." (If Violence >= 12)

---

**Failure:**
[Player doesn't recognize danger signs]

Regular bar interaction until:
- Player says wrong thing
- Player reveals they're a courier
- Situation escalates unexpectedly

---

## Example 4: Tech Knowledge Check

### Context
Player finds encrypted terminal. Tech knowledge determines what they understand.

---

**Node: TERMINAL_EXAMINE_001**

**Pre-Check Dialogue:**
[Screen shows complex code and security protocols]

**Player Options:**
1. [Tech Knowledge] Analyze the system (Requires: TECHNICAL >= 10)
2. Try brute force (Always available, triggers alarm)
3. Leave it alone

---

**TECH CHECK:**
- Skill: TECH_KNOWLEDGE
- Difficulty: 9

**Success (Roll 9-11):**
[Internal monologue]: "Military-grade encryption. ICE protocols from '84. Three-factor authentication. I could crack this, but it'll take time and specialized software."

Effects:
- Reveal: Need "Icebreaker" software
- Reveal: 10-minute hack time
- Option to prepare properly

---

**Critical Success (Roll 12):**
[Internal monologue]: "Wait. This encryption has a backdoor. Legacy developer access from the original contractor. Sloppy. I can use this."

Effects:
- Instant access granted
- No alarm triggered
- Bonus: Find hidden data file

---

**Failure (Roll 2-8):**
[Internal monologue]: "This is beyond me. Too many layers. I'd need a specialist."

Effects:
- Must find NPC hacker
- Or use alternative approach
- Locked out of technical solution

---

## Design Guidelines

### Difficulty Calibration

**Easy (6-7)**: Common knowledge or skill, most characters can attempt
**Moderate (8-9)**: Requires investment in skill/attribute
**Hard (10-11)**: Specialist territory, significant investment needed
**Very Hard (12)**: Nearly impossible without perfect build, critical success only

### When to Use Each Skill

**DECEPTION:**
- Lying about identity
- Concealing information
- Framing others
- Con jobs
- Faking credentials

**INTIMIDATION:**
- Extracting information through fear
- Gaining respect through reputation
- Threatening violence
- Establishing dominance
- Coercing compliance

**EMPATHY:**
- Reading emotional state
- Comforting distressed NPCs
- Building deep relationships
- Understanding motivations
- De-escalating conflicts

**TECH_KNOWLEDGE:**
- Understanding systems
- Hacking and bypassing security
- Recognizing technical details
- Improvising technical solutions
- Discussing aug technology

**STREET_SMARTS:**
- Recognizing gang signs
- Navigating criminal underworld
- Spotting traps
- Reading dangerous situations
- Understanding street code

---

## Relationship Impacts

**General Guidelines:**

Success:
- DECEPTION: +0 to +5 (they don't know they were deceived)
- INTIMIDATION: -5 to +5 (fear-based respect)
- EMPATHY: +10 to +20 (genuine connection)
- TECH_KNOWLEDGE: +5 (impressed)
- STREET_SMARTS: +5 (mutual respect)

Failure:
- DECEPTION: -15 to -30 (betrayal)
- INTIMIDATION: -10 to -20 (resentment)
- EMPATHY: -5 (awkward but not hostile)
- TECH_KNOWLEDGE: +0 (no penalty for not knowing)
- STREET_SMARTS: +0 to -5 (might reveal ignorance)

---

## Implementation Checklist

When creating skill check dialogue:

- [ ] Check has clear setup in conversation
- [ ] Attribute requirement stated clearly
- [ ] Success path is rewarding
- [ ] Failure path is interesting (not punishing)
- [ ] Critical success option (for difficulty 9+)
- [ ] Alternative non-check path available
- [ ] Relationship impacts make sense
- [ ] Voice acting direction included
- [ ] Effects on game state documented
- [ ] Connects logically to next nodes

---

**Last Updated**: 2026-01-21
**Version**: 1.0
**Status**: Template Ready
