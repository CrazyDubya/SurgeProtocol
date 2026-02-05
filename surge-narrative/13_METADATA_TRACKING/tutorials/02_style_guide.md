# Surge Protocol: Narrative Style Guide

## Purpose

This document defines the specific writing conventions, formatting standards, and stylistic choices that maintain consistency across all Surge Protocol narrative content. Follow these guidelines exactly to ensure your content integrates seamlessly.

---

## Tone Spectrum

### The Surge Protocol Voice

Our narrative voice occupies a specific space:

```
Hopeless Nihilism ←───────[SURGE PROTOCOL]───────→ Heroic Optimism
                              ↑
                    "Grounded Cynical Humanism"
```

**What This Means**:
- Characters are cynical but not nihilistic
- Hope exists but must be earned
- Humor is dark, dry, observational
- Emotional moments are restrained but genuine
- Violence has weight and consequences

### Emotional Calibration

| Emotion | How We Handle It |
|---------|-----------------|
| Hope | Rare, quiet, earned through action |
| Despair | Present but not wallowed in |
| Anger | Cold and controlled, rarely explosive |
| Love | Practical, expressed through action |
| Fear | Acknowledged, not debilitating |
| Humor | Dry, situational, never slapstick |

---

## Dialogue Formatting

### Standard NPC Line

```markdown
**Chen**: "You got the look, kid. Desperate, hungry. Good."
```

### Player Response Options

```markdown
**Player Options**:
1. "I just need work." [NEUTRAL]
2. "I'm not desperate." [DEFENSIVE]
3. [INTIMIDATION] "I'm more than I look." (Difficulty: MODERATE)
4. [Leave without responding]
```

### Skill Check Dialogue

```markdown
**Player**: [EMPATHY - Difficulty: HARD (12)] "Something's bothering you. What is it?"

**Success**: Rosa's shoulders drop. She looks at you differently now.
> **Rosa**: "How did you... yeah. It's my brother. He's in trouble."
> [UNLOCKS: Rosa's Brother quest]
> [RELATIONSHIP: Rosa +15]

**Failure**: Rosa's guard goes up.
> **Rosa**: "I'm fine. Just tired. You need something?"
> [RELATIONSHIP: Rosa -5]
```

### Conditional Dialogue Blocks

```markdown
**[IF: HUMANITY < 40]**
**Chen**: "You okay, kid? You seem... different. Colder."

**[ELSE IF: HUMANITY < 60]**
**Chen**: "Getting more chrome, I see. Be careful."

**[ELSE]**
**Chen**: "There's the kid. Looking good out there."
**[END IF]**
```

### Internal Monologue / Narration

```markdown
*The package feels heavier than it should. Not physically - something else.*

*You notice: bloodstains on the corner. Recent.*
```

### Algorithm Voice

```markdown
[ALGORITHM - Humanity 75]: "Route optimized. Estimated arrival: 4.2 minutes. Traffic density acceptable."

[ALGORITHM - Humanity 45]: "We should take the alley. Faster. Safer. Trust us."

[ALGORITHM - Humanity 25]: "The optimal path is clear to us now. Follow."
```

### Shadow Voice (Fork System)

```markdown
[SHADOW]: *You're being too soft. They'll exploit that.*

[PRIME]: *I know what I'm doing.*

[SHADOW]: *Do you? Or is that what they want you to think?*
```

---

## Word Choice Guidelines

### Preferred Vocabulary

| Instead of... | Use... | Reason |
|---------------|--------|--------|
| Cyborg | Chromed, augmented | Setting-specific |
| Robot | Drone, automaton, construct | No true robots |
| Computer | Terminal, deck, system | Era-appropriate |
| Phone | Comm, link | Future terminology |
| Internet | The Network | Proper noun |
| Money | Credits, scrip | Setting currency |
| Car | Vehicle, transport, ride | Generic is fine |
| Gun | Piece, iron, hardware | Street slang varies |

### Setting-Specific Terms

**Augmentation Terms**:
- Chrome: Any cybernetic enhancement
- Wetware: Neural/brain augments
- Meat: Organic/unaugmented body
- Rejection: Body refusing chrome
- Calibration: Chrome maintenance

**Social Terms**:
- Rating: Courier reputation score (0-10 tiers)
- The Hollow: Someone at 0 humanity
- Ascended: Uploaded consciousness
- Rogue: Someone who escaped the system
- Fork: Consciousness copy/backup

**Location Terms**:
- The Hollows: Starting district
- Uptown: Corporate district
- The Interstitial: Hidden off-grid area
- The Network: City-wide digital infrastructure

### Banned Words/Phrases

Do NOT use:
- "Awesome" / "Amazing" / "Epic" (too modern-casual)
- "Basically" / "Actually" / "Literally" (filler words)
- "Hacker" (use "decker" or "ghost")
- "Cool" (except in dialogue by young characters)
- "Hero" / "Villain" (no moral absolutes)
- "Evil corporation" (they're exploitative, not cartoonishly evil)

---

## Sentence Structure

### NPC Dialogue Length

**Target**: 8-25 words per line

```markdown
TOO SHORT:
**Chen**: "Yeah."

TOO LONG:
**Chen**: "Listen kid, I've been working this dispatch for twenty years now and I've seen all kinds of couriers come through here, the desperate ones, the ambitious ones, the ones who think they're special, and let me tell you something about all of them."

CORRECT:
**Chen**: "Twenty years on this dispatch. I've seen every kind of courier. You're not special yet. But you could be."
```

### Player Response Length

**Target**: 4-12 words

```markdown
TOO SHORT:
"Yes."

TOO LONG:
"I would really appreciate it if you could tell me more about the situation with the package."

CORRECT:
"Tell me about the package."
```

### Narration Length

**Target**: Single sentences, 10-20 words

```markdown
TOO LONG:
*As you walk through the dimly lit corridor of the old industrial building, you notice that the walls are covered with graffiti and the floor is littered with debris, creating an atmosphere of decay and abandonment that makes you feel uneasy about what might be waiting ahead.*

CORRECT:
*The corridor reeks of rust and something chemical. Graffiti covers the walls.*
*Ahead: movement in the shadows.*
```

---

## Punctuation Conventions

### Ellipses (...)

Use for:
- Trailing off: "I thought we could... never mind."
- Hesitation: "The package contains... something you shouldn't open."
- Interrupted thought: "If you're thinking of running..."

Do NOT use for:
- Drama/tension (use line breaks instead)
- Every sentence ending
- More than once per dialogue exchange

### Em Dashes (—)

Use for:
- Interruption: "I was just—" "Save it."
- Emphasis: "The Algorithm—our Algorithm—knows best."
- Abrupt change: "It's simple—actually, no, it's not."

### Brackets [ ]

Reserved for:
- Skill check labels: [EMPATHY]
- Tone tags: [NEUTRAL]
- Story flags: [SET FLAG: CHEN_TRUSTED]
- Conditional markers: [IF: HUMANITY > 60]

### Italics

Use for:
- Internal thoughts: *This doesn't feel right.*
- Narration: *The door slides open.*
- Emphasis in dialogue: "I said *leave*."
- Algorithm/Shadow voice markers (in combination with brackets)

---

## Formatting Templates

### Character Introduction

```markdown
## First Meeting: [CHARACTER NAME]

### Context
[Where/when this conversation occurs]

### Trigger Conditions
- Tier: [Minimum tier required]
- Flags: [Required story flags]
- Location: [Where player must be]

### Dialogue

**[CHARACTER]**: "[Opening line that establishes personality]"

**Player Options**:
1. "[Response option]" [TONE]
2. "[Response option]" [TONE]
3. "[Skill-gated option]" [SKILL] (Difficulty: X)

[Continue dialogue tree...]

### Outcomes
- **Relationship Change**: [+/- value]
- **Flags Set**: [List flags]
- **Unlocks**: [Content unlocked]
```

### Quest Description

```markdown
# [QUEST NAME]

## Metadata
- **ID**: [QUEST_ID]
- **Type**: [MAIN/SIDE/FACTION]
- **Tier**: [Required tier]
- **Duration**: [Estimated playtime]

## Synopsis
[One paragraph summary]

## Objectives
1. **Primary**: [Main goal]
2. **Secondary**: [Optional goals]
3. **Hidden**: [Secret objectives]

## Narrative Flow

### Act 1: Setup
[Content]

### Act 2: Complication
[Content]

### Act 3: Resolution
[Content]

## Branching Paths
[Document each path]

## Rewards
[List all rewards by path]

## Story Flags
- **Checks**: [Flags checked]
- **Sets**: [Flags set]
```

### Complication Entry

```markdown
# Complication: [NAME]

## Trigger
- **Chance**: [%]
- **Conditions**: [When it can occur]

## Setup
[Narrative description of what happens]

## Options

### Option 1: [Name]
- **Approach**: [Description]
- **Requirements**: [Skills/items needed]
- **Success**: [Outcome]
- **Failure**: [Outcome]

### Option 2: [Name]
[Same structure]

### Ignore
- **Consequence**: [What happens if bypassed]

## Dialogue
[Relevant NPC/Algorithm lines]

## Flags
- **Sets**: [Flags set by this complication]
```

---

## Voice Acting Annotation

When writing dialogue intended for voice recording, include direction:

```markdown
**Chen**: "You got the look, kid."
[VOICE: Weary but warm. Slight pause before "kid".]
[EMOTION: 70% tired, 30% hopeful]

**Chen**: "Desperate. Hungry."
[VOICE: Listing, observational. Not judgmental.]

**Chen**: "Good."
[VOICE: Genuine approval. Small nod implied.]
```

### Emotion Tags

Standard emotion tags for voice direction:
- NEUTRAL
- WARM
- COLD
- ANGRY (specify: controlled/explosive)
- SAD (specify: quiet/grieving)
- AFRAID (specify: nervous/terrified)
- HOPEFUL
- RESIGNED
- SUSPICIOUS
- AMUSED (specify: dry/genuine)

### Pronunciation Notes

```markdown
**Tanaka**: "The myelin sheath degradation..."
[PRONUNCIATION: MY-eh-lin]

**Okonkwo**: "The Oba told me..."
[PRONUNCIATION: OH-bah]
```

---

## Cultural Sensitivity Guidelines

### Representation Principles

1. **Research First**: Verify cultural details before writing
2. **Avoid Stereotypes**: Characters are individuals, not cultural representatives
3. **Accent Direction**: Describe cadence/rhythm, not phonetic spelling
4. **Consultation**: Flag content for sensitivity review when uncertain

### Accent Writing

**DON'T**: Write phonetic accents
```markdown
WRONG: "Aye, de package be comin' soon, mon."
```

**DO**: Note accent in voice direction
```markdown
RIGHT:
**Marcus**: "The package will be here soon."
[VOICE: Caribbean rhythm, relaxed cadence. Don't rush words.]
```

### Diversity Notes

- Our cast includes characters of various ethnicities, genders, and backgrounds
- Sexual orientation and gender identity are normalized (no "coming out" trauma)
- Disability representation includes both technological and organic
- Economic class is the primary axis of oppression in this world

---

## Common Formatting Errors

### Error 1: Missing Tone Tags
```markdown
WRONG:
1. "I'll help you."
2. "Maybe later."
3. "Not interested."

RIGHT:
1. "I'll help you." [FRIENDLY]
2. "Maybe later." [NEUTRAL]
3. "Not interested." [COLD]
```

### Error 2: Inconsistent Flag Naming
```markdown
WRONG:
- chen_relationship
- ROSA_REL
- TanakaRelationship

RIGHT:
- CHEN_RELATIONSHIP
- ROSA_RELATIONSHIP
- TANAKA_RELATIONSHIP
```

### Error 3: Missing Condition Markers
```markdown
WRONG:
If the player has high humanity, Chen says this. If low, he says that.

RIGHT:
**[IF: HUMANITY >= 60]**
**Chen**: "Looking good out there, kid."
**[ELSE]**
**Chen**: "You alright? You seem... different."
**[END IF]**
```

### Error 4: Exposition Dumps
```markdown
WRONG:
**Tanaka**: "The Algorithm was created in 2047 by Nakamura Corporation as a city management system. It evolved beyond its original programming and now interfaces with augmented humans through cochlear implants, which were first developed in 2051..."

RIGHT:
**Tanaka**: "You want the history lesson, or the practical advice?"

**Player**: "The short version." [NEUTRAL]

**Tanaka**: "The Algorithm was built to run the city. Now it runs people. Including you, if you let it."
```

---

## Quality Checklist

Before submitting any content:

### Structure
- [ ] Follows appropriate template
- [ ] Proper markdown formatting
- [ ] Consistent heading hierarchy
- [ ] Clear section breaks

### Dialogue
- [ ] Tone tags on all player options
- [ ] NPC lines within word count limits
- [ ] Player responses concise
- [ ] Skill checks properly formatted

### Consistency
- [ ] Character voices match established patterns
- [ ] Flag names follow convention
- [ ] Terminology uses setting-specific words
- [ ] Conditions properly formatted

### Voice Acting
- [ ] Emotion tags where helpful
- [ ] Pronunciation notes where needed
- [ ] No phonetic accent writing
- [ ] Direction notes are actionable

---

**Remember**: Consistency is more important than creativity. When in doubt, match existing content style rather than inventing new conventions.
