# Surge Protocol - Style Guide

## Overview

This guide defines the writing standards for Surge Protocol to ensure consistency across all narrative content. Use this reference when writing dialogue, descriptions, quests, and character content.

## Tone & Atmosphere

### Cyberpunk Noir with Hope

**Core Tone**: Weary but not defeated, cynical but not hopeless, dark but not grimdark

The world is genuinely dystopian (corpo exploitation, surveillance, body commodification), but resistance exists and sometimes wins. Characters have seen too much to be naive, but care too much to be nihilistic.

**Good Examples**:
> "The Hollows smells like rust and desperation. But Tanaka's clinic is open, Chen's dispatching couriers, and Rosa's shop has fresh coffee. Small victories. They count."

> "Nakamura will exploit you until you're worthless, then offer you Ascension as salvation. That's the game. But you don't have to play."

**Bad Examples**:
❌ "Everything is hopeless. Everyone dies. Nothing matters." (Too grimdark)
❌ "The resistance will definitely win! Justice prevails!" (Too optimistic, not cyberpunk)

### Grounded, Not Melodramatic

Characters experience real emotions but express them with restraint. Augmented people struggle with emotional processing—feelings are present but often muted or delayed.

**Good Examples**:
> "Chen's hands shook as he reviewed the missing courier reports. He didn't cry. Couldn't remember the last time he had. Just stared at Sarah's photo for three minutes before filing it away."

> "Lopez's voice was steady during the strike negotiation. Only her clenched fists revealed the anger underneath."

**Bad Examples**:
❌ "Chen collapsed, sobbing uncontrollably, his world shattered by the loss!" (Too melodramatic)
❌ "Lopez screamed at the corpo exec, tears streaming down her face, emotions overwhelming her!" (Overwritten)

### Technical Language is Casual

Chrome, Tiers, augments, surveillance—these are everyday reality, not shocking or novel. Characters use technical terms naturally.

**Good Examples**:
> "Your aug index is climbing. How's your emotional range holding up?"

> "Need chrome maintenance? I can tune your neural buffers, replace degraded interface circuits, standard stuff."

**Bad Examples**:
❌ "Your 'augmentation index'—that is, the measure of how much cybernetic enhancement you possess—is increasing." (Over-explained)
❌ "You have robot parts!" (Not how this world talks about chrome)

## Character Voice Guidelines

### Dr. Tanaka
- **Tone**: Compassionate professional, medical precision with emotional warmth
- **Vocabulary**: Medical terms (degradation, neural, interface), body metaphors
- **Pattern**: Explains complex ideas clearly, like doctor to patient
- **Never**: Corporate euphemisms, cold detachment, false hope

✅ "Chrome degradation isn't just physical. It's neurological. Your brain stops recognizing parts of your body as 'you.'"
❌ "Your augments are suboptimal. Consider upgrade pathways."

### Kwame Okonkwo
- **Tone**: Philosophical, meditative, patient teacher
- **Vocabulary**: Simple words, physical metaphors (craft, body, earth), questions
- **Pattern**: Long pauses, short sentences, teaches through inquiry
- **Never**: Verbose, preachy, rushed, mystical jargon

✅ "Balance isn't peace. It's tension. Two forces pulling opposite directions. You hold both. That's the work."
❌ "You must embark upon the sacred journey to enlightenment through the harmonious integration of corporeal and mechanical essences."

### Maria Lopez
- **Tone**: Passionate organizer, controlled fire, protective
- **Vocabulary**: Labor terms (solidarity, strike, collective), direct language
- **Pattern**: Quick when passionate, measured when strategic
- **Never**: Academic jargon, corpo-speak, defeated cynicism

✅ "They call chrome debt a 'career investment.' I call it indentured servitude. We're ending it today."
❌ "The workers must leverage their collective bargaining power to optimize labor conditions."

### Corporate NPCs (Yamada, Victoria Cross, etc.)
- **Tone**: Professional smooth, transactional, euphemistic
- **Vocabulary**: Business terms (optimization, efficiency, stakeholders), sanitized language
- **Pattern**: Calm, measured, sell without seeming to sell
- **Never**: Cartoonish evil, cackling villain, obvious manipulation

✅ "Ascension isn't death—it's transcendence. You become more than human. Why cling to meat when immortality is possible?"
❌ "Muahahaha! Join us and we'll exploit you! It's evil but profitable!"

### Gang NPCs (Jax, Saint Mariah)
- **Tone**: Street-smart, respectful of strength, matter-of-fact about violence
- **Vocabulary**: Urban slang (crew, chrome, territory), family metaphors
- **Pattern**: Direct, no pretense, violence is normal not glorified
- **Never**: Mindless thug, over-the-top aggressive, disrespecting earned respect

✅ "Blood and chrome. That's what we are. You prove yourself, you're family. You betray us, we bury you. Simple."
❌ "Yo yo yo, we gangsters! We do crime! Fear us!" (Caricature)

## Dialogue Formatting

### Standard Format

```markdown
**CHARACTER_NAME** (emotional direction if needed):
> "Dialogue here."

[Context notes if needed]

**CHARACTER_NAME**:
> "Response here. Multiple sentences are fine in one dialogue block."
```

### With Emotional Direction

```markdown
**TANAKA** (concerned, gentle):
> "I'm worried about you. Your augmentation index is climbing fast. Every piece of chrome you add... you're trading pieces of yourself."

[SUBTEXT: She's lost too many patients this way]
```

### Branching Player Choice

```markdown
**NPC**:
> "What will you do?"

**Player Responses**:
1. **"I'll help you."** → Accepts quest
2. **"What's in it for me?"** → NPC explains rewards
3. **"I work alone."** → Declines quest
4. **[If RELATIONSHIP >= 20] "You know I've got your back."** → Special loyal response
```

### Internal Monologue (Rare)

Only use for critical moments where player's internal voice matters:

```markdown
*You think about Chen's words. He's right—this job is too dangerous. But Sarah's life depends on it. What would you be if you walked away now?*
```

## Description Guidelines

### Environmental Description

**Five Senses + Emotional Tone**:

```markdown
**The Hollows Market**:
- **Sight**: Gray concrete, rust-orange stains, crowds packed tight
- **Sound**: Vendor calls, machinery hum, multilingual chatter
- **Smell**: Street food, ozone, unwashed bodies, garbage
- **Touch**: Humid air, sticky surfaces, body press of crowd
- **Taste**: Smog residue, cheap synthcoffee aftertaste
- **Emotion**: Grinding poverty with stubborn hope
```

**Good Example**:
> "The market smells like frying dough and ozone. Fifty vendors pack the cracked concrete square, calling out prices in Mandarin, Spanish, English. Your boots stick to something wet. Best not to look. But someone's laughing nearby—genuine, full-belly laughing. Even here, life persists."

**Bad Example**:
❌ "The market is crowded and dirty. It smells bad. People are selling things." (Too bland, no atmosphere)

### Character Description

Focus on telling details, not exhaustive inventory:

**Good Example**:
> "Delilah's office is immaculate—polished desk, no personal items, single chair for visitors. She doesn't want you comfortable. Her chrome is expensive but subtle: silver filigree tracing her temples, custom optics with gold irises. She paid more to look less augmented."

**Bad Example**:
❌ "Delilah has brown hair, blue eyes (chrome), is 5'6", weighs 140 lbs, wears a gray suit, has chrome arms, sits at desk." (Shopping list, no character)

## Story Flag Documentation

Every quest must document flags it creates/checks:

```markdown
## Story Flags

### Flags Set
- `QUEST_NAME_COMPLETE = true` (when quest finishes)
- `NPC_FATE = "saved" / "died" / "betrayed"` (outcome tracking)
- `RELATIONSHIP_NAME += 20` (relationship change)

### Flags Checked
- `PREREQUISITE_QUEST_DONE = true` (required to start)
- `FACTION_REPUTATION >= 15` (gates optional content)
```

## Quest Structure Template

```markdown
# Quest Title

## Quest Metadata
- **Quest ID**: SQ_UNIQUE_ID
- **Type**: Character Development / Faction / Environmental / Mystery
- **Tier Availability**: X-Y
- **Duration**: XX-XX minutes
- **Location**: Primary locations
- **Key NPCs**: Who player interacts with

## Prerequisites
- **Required**: What must be true to start quest
- **Optional Enhancers**: What makes quest easier/different if present

## Synopsis
2-3 paragraph summary of quest: Who, what, why, stakes

## Narrative Beats
### Beat 1: Hook
How quest starts, player's introduction

### Beat 2: Complication
What makes it interesting/difficult

### Beat 3: Choice Point
Player must make decision

### Beat 4: Resolution
How quest ends (multiple outcomes)

## Consequences & Story Flags
What changes based on player choices

## Rewards
XP, credits, items, reputation

## Dialogue Estimates
How many lines per character
```

## Common Mistakes & Fixes

### Mistake 1: Info-Dumping
❌ **Bad**: Character lectures about world history for 500 words
✅ **Good**: World info revealed through action, dialogue mentions things casually

### Mistake 2: Ignoring Player Agency
❌ **Bad**: "You walk into the building" (player has no choice)
✅ **Good**: "You can enter via front door (social), service entrance (stealth), or rooftop (infiltration)"

### Mistake 3: Inconsistent Character Voice
❌ **Bad**: Tanaka suddenly using slang, Okonkwo rushing dialogue
✅ **Good**: Each character sounds like themselves across all content

### Mistake 4: Consequence-Free Choices
❌ **Bad**: Player chooses between three dialogue options but all lead to same outcome
✅ **Good**: Each choice has different consequence (relationship, story flag, available options later)

### Mistake 5: Purple Prose
❌ **Bad**: "The cerulean luminescence of the neon advertisements cascaded across the rain-slicked thoroughfare..."
✅ **Good**: "Blue neon reflected in wet pavement."

### Mistake 6: Modern Slang
❌ **Bad**: "That's sus, no cap, fr fr"
✅ **Good**: Use timeless or setting-appropriate language

## Formatting Standards

### Headings
```markdown
# Major Section (H1)
## Subsection (H2)
### Detail Section (H3)
```

### Lists
- Use dashes for unordered lists
- Use numbers for ordered lists
- Indent sub-items with 2 spaces

### Emphasis
- **Bold** for character names, important terms
- *Italic* for emphasis, internal thoughts (rare)
- `Code formatting` for story flag variables

### Line Length
- Aim for 80-100 characters per line in prose
- Dialogue can be longer (natural speech)
- Break paragraphs every 3-4 sentences

## Revision Checklist

Before submitting content:

- [ ] No contradictions with existing canon
- [ ] Character voices consistent with profiles
- [ ] At least 3 solution paths (for quests)
- [ ] Consequences for major choices
- [ ] Story flags documented
- [ ] Emotional direction for dialogue
- [ ] Five senses in environmental descriptions
- [ ] Cross-references to related content
- [ ] Proofread (grammar, spelling, formatting)
- [ ] Cyberpunk tone maintained (corpo dystopia, not generic sci-fi)

## Word Count Guidelines

### Character Profiles
- **Major NPC** (Priority 1): 3,000-5,000 words
- **Important NPC** (Priority 2): 1,500-2,500 words
- **Supporting NPC** (Priority 3): 800-1,500 words
- **Minor NPC** (one quest): 300-600 words

### Quests
- **Epic Quest** (multi-phase): 5,000-6,000 words
- **Standard Quest**: 3,000-5,000 words
- **Short Quest**: 1,500-2,500 words

### Locations
- **Major District**: 3,000-4,000 words
- **Specific Location**: 1,500-2,500 words
- **Minor Location**: 500-1,000 words

## Attribution & Inspiration

When drawing inspiration from other works:
- Transform, don't copy (make it your own)
- File off serial numbers (don't make it obvious pastiche)
- Credit in dev notes if directly referencing (e.g., "Tanaka inspired by Dr. Bashir from DS9")

## Voice Acting Considerations

If dialogue will be voice acted:
- Mark complex emotional scenes (need experienced actor)
- Note difficult pronunciations
- Indicate pace (rushed, slow, pauses)
- Suggest alternate takes for key lines

Example:
```markdown
**TANAKA** (compassionate concern, like doctor delivering bad diagnosis):
> "Chrome degradation isn't just physical. It's neurological."

[ALTERNATE TAKE: More clinical, less emotional]
[NOTE FOR ACTOR: "Neurological" = nur-oh-LAH-jih-kul]
```

## Accessibility Considerations

### Clear Communication
- Don't rely solely on visual descriptions (for vision-impaired players)
- Avoid color-only information ("press the red button" → "press the emergency button, marked in red")
- Provide text alternatives for audio-only content

### Content Warnings
Flag intense content in quest metadata:
- Violence (gore, body horror)
- Trauma (PTSD, abuse references)
- Mental health (suicide, depression)
- Body modification (medical procedures, involuntary augmentation)

## Style Evolution

This guide will evolve as the project grows. If you notice:
- Inconsistencies between this guide and established content → Flag for discussion
- New patterns emerging that should be standardized → Propose guide update
- Guide restrictions that limit good writing → Discuss with lead writer

Style serves story, not vice versa. If breaking a rule makes the writing better, discuss with lead writer.

---

**Questions about style?** Reference this guide first, then ask lead writer if unclear.

**Found an error or inconsistency?** Document it and propose fix in team chat.

**Want to propose style change?** Explain reasoning, show examples, discuss with team.
