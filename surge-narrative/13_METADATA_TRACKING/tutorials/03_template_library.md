# Surge Protocol: Template Library

## Overview

This document provides copy-paste templates for all major content types, along with worked examples demonstrating proper usage.

---

## Template 1: Character Profile

### Blank Template

```markdown
# [CHARACTER NAME]

## Core Identity
- **Full Name**:
- **Alias/Callsign**:
- **Age**:
- **Gender/Pronouns**:
- **Occupation**:
- **Faction Affiliation**:
- **First Appearance Tier**:

## Physical Description
- **Appearance**:
- **Augmentations Visible**:
- **Style/Aesthetic**:

## Personality
- **Core Traits**:
- **Motivations**:
- **Fears**:
- **Values**:
- **Speech Patterns**:

## Background
- **Origin**:
- **Current Situation**:
- **Connection to Player**:
- **Secrets**:

## Story Role
- **Narrative Function**: [Quest Giver / Mentor / Antagonist / Romance / Rival / Supporting]
- **Arc Summary**:
- **Key Story Beats**:
  - Tier X:
  - Tier Y:
  - Tier Z:
- **Can Die**: [Yes/No]
- **Can Betray**: [Yes/No]

## Dialogue Patterns

### Greeting Variants
- **First Meeting**:
- **Friendly (Relationship > 40)**:
- **Neutral**:
- **Hostile (Relationship < -20)**:
- **Low Humanity (<40)**:

### Signature Lines
1.
2.
3.

### Topics Available
- [ ] Work/Job
- [ ] Personal History
- [ ] Faction Information
- [ ] Rumors/Gossip
- [ ] Quest Hook

## Relationship Progression
| Range | Behavior | Content Unlocked |
|-------|----------|-----------------|
| -100 to -50 | | |
| -49 to 0 | | |
| 1 to 40 | | |
| 41 to 70 | | |
| 71 to 100 | | |

## Voice Acting Notes
- **Voice Type**:
- **Accent**:
- **Emotion Range**:
- **Line Count Estimate**:

## Related Content
- **Quests**:
- **Locations**:
- **Other NPCs**:
```

### Worked Example: Minor NPC

```markdown
# Viktor "Sparks" Reyes

## Core Identity
- **Full Name**: Viktor Emmanuel Reyes
- **Alias/Callsign**: Sparks
- **Age**: 34
- **Gender/Pronouns**: Male (He/Him)
- **Occupation**: Black market electronics dealer
- **Faction Affiliation**: Neutral (Chrome Saints adjacent)
- **First Appearance Tier**: 2

## Physical Description
- **Appearance**: Lean, nervous energy. Burns on his hands from soldering. Cheap AR glasses always on.
- **Augmentations Visible**: Basic interface jack behind ear. Burn scars suggest rejected chrome.
- **Style/Aesthetic**: Tech salvage chic. Cargo pants, tool vest, fingerless gloves.

## Personality
- **Core Traits**: Paranoid, knowledgeable, fast-talking
- **Motivations**: Pay off debt to Chrome Saints, get enough credits to leave the city
- **Fears**: Corpo security, rejection syndrome, being forgotten
- **Values**: Fair deals, technical excellence, staying alive
- **Speech Patterns**: Rapid fire, lots of technical jargon, trails off mid-sentence when nervous

## Background
- **Origin**: Former Nakamura R&D intern, fired after questioning ethics
- **Current Situation**: Runs a pop-up shop in the Hollows, owes the Saints
- **Connection to Player**: Fence for tech items, information source
- **Secrets**: Still has Nakamura access codes from his intern days

## Story Role
- **Narrative Function**: Supporting / Information Source
- **Arc Summary**: Can help player with tech problems, may ask for help with Saints debt
- **Key Story Beats**:
  - Tier 2: First available as vendor
  - Tier 4: Asks for help with debt (side quest)
  - Tier 7: Can provide Nakamura codes if trusted
- **Can Die**: Yes (Saints debt goes bad)
- **Can Betray**: No

## Dialogue Patterns

### Greeting Variants
- **First Meeting**: "New face. You buying, selling, or just looking? Looking costs nothing. Yet."
- **Friendly (Relationship > 40)**: "Hey, my favorite customer. Got some new inventory. Real clean stuff."
- **Neutral**: "Back again? Let's see what I've got."
- **Hostile (Relationship < -20)**: "You. Make it quick. I don't trust you."
- **Low Humanity (<40)**: "Whoa, easy there. You're, uh, looking pretty chromed up. We good?"

### Signature Lines
1. "Clean tech, fair prices, no questions. That's the Sparks guarantee."
2. "You didn't get this from me. Didn't even see me. We never talked."
3. "Nakamura builds it, I fix it, you use it. Circle of life, choom."

### Topics Available
- [x] Work/Job (Electronics, modifications)
- [x] Personal History (Reluctantly, at high relationship)
- [ ] Faction Information (Limited - Saints only)
- [x] Rumors/Gossip (Tech-related)
- [x] Quest Hook (Saints debt at Tier 4)

## Relationship Progression
| Range | Behavior | Content Unlocked |
|-------|----------|-----------------|
| -100 to -50 | Refuses service | Nothing |
| -49 to 0 | Minimal interaction | Basic inventory |
| 1 to 40 | Professional | Full inventory |
| 41 to 70 | Chatty, shares rumors | Side quest, discounts |
| 71 to 100 | Trusts completely | Nakamura codes |

## Voice Acting Notes
- **Voice Type**: Mid-range tenor, anxious energy
- **Accent**: Urban American, hints of Spanish heritage
- **Emotion Range**: 60% nervous, 25% enthusiastic (about tech), 15% scared
- **Line Count Estimate**: 80-120 lines

## Related Content
- **Quests**: "Sparks' Debt" (Tier 4 side quest)
- **Locations**: The Hollows market
- **Other NPCs**: Chrome Saints (creditors), Nakamura security (past)
```

---

## Template 2: Dialogue Tree

### Blank Template

```markdown
# Dialogue Tree: [TREE_NAME]

## Metadata
- **Tree ID**: [TREE_ID]
- **NPC**: [Character name]
- **Context**: [When/where this occurs]
- **Trigger**: [What initiates this dialogue]
- **Repeatable**: [Yes/No]
- **Prerequisites**:
  - Tier:
  - Flags:
  - Relationship:

---

## Node 1: [NODE_NAME] (ROOT)
**Type**: NPC_LINE

**[NPC]**: "[Dialogue line]"

[VOICE: Emotion/direction notes]

**Leads to**: Node 2

---

## Node 2: [NODE_NAME]
**Type**: PLAYER_RESPONSE_HUB

**Option A**: "[Response text]" [TONE]
- Conditions: [None / Flag / Skill]
- Leads to: [Node X]
- Effects: [Relationship change, flags set]

**Option B**: "[Response text]" [TONE]
- Conditions:
- Leads to:
- Effects:

**Option C**: [SKILL_TYPE] "[Response text]" (Difficulty: X)
- Conditions:
- Success leads to:
- Failure leads to:
- Effects:

**Option D**: [Leave]
- Leads to: EXIT_NEUTRAL

---

## Node 3: [NODE_NAME]
**Type**: NPC_LINE

**[NPC]**: "[Response to player choice]"

[VOICE: Direction]

**Leads to**: [Node X / EXIT]

---

## Exit Nodes

### EXIT_FRIENDLY
**[NPC]**: "[Friendly farewell]"
**Relationship**: [Change]

### EXIT_NEUTRAL
**[NPC]**: "[Neutral farewell]"
**Relationship**: No change

### EXIT_HOSTILE
**[NPC]**: "[Hostile farewell]"
**Relationship**: [Change]

---

## Summary
- **Total Nodes**:
- **Estimated Lines**:
- **Flags Set**:
- **Flags Checked**:
```

### Worked Example: First Meeting Dialogue

```markdown
# Dialogue Tree: SPARKS_FIRST_MEETING

## Metadata
- **Tree ID**: DT_SPARKS_001
- **NPC**: Viktor "Sparks" Reyes
- **Context**: Player's first visit to Sparks' electronics stall in Hollows market
- **Trigger**: Player approaches stall
- **Repeatable**: No (converts to SPARKS_RETURN after completion)
- **Prerequisites**:
  - Tier: 2+
  - Flags: None
  - Relationship: N/A (first meeting)

---

## Node 1: GREETING (ROOT)
**Type**: NPC_LINE

**Sparks**: "New face. You buying, selling, or just looking? Looking costs nothing. Yet."

[VOICE: Rapid, sizing you up. Pause before "yet" - slight smile implied]

**Leads to**: Node 2

---

## Node 2: INITIAL_RESPONSE
**Type**: PLAYER_RESPONSE_HUB

**Option A**: "What do you sell?" [NEUTRAL]
- Conditions: None
- Leads to: Node 3
- Effects: None

**Option B**: "Who are you?" [CURIOUS]
- Conditions: None
- Leads to: Node 4
- Effects: SPARKS_RELATIONSHIP +5

**Option C**: [STREETWISE] "Word is you can get Nakamura parts. Real ones." (Difficulty: MODERATE 9)
- Conditions: None
- Success leads to: Node 5
- Failure leads to: Node 6
- Effects: Success: SPARKS_RELATIONSHIP +10, SPARKS_IMPRESSED flag

**Option D**: [Leave without buying]
- Leads to: EXIT_NEUTRAL

---

## Node 3: INVENTORY_PITCH
**Type**: NPC_LINE

**Sparks**: "Electronics. Mods. Components. Whatever fell off the back of a corporate transport, hypothetically speaking."

[VOICE: Slightly rehearsed sales pitch, but genuine enthusiasm underneath]

*He gestures at the cramped stall. AR glasses, interface cables, and things you don't recognize.*

**Leads to**: Node 7

---

## Node 4: INTRODUCTION
**Type**: NPC_LINE

**Sparks**: "People call me Sparks. On account of the—" *He holds up scarred hands.* "Occupational hazard. And you?"

[VOICE: Self-deprecating, curious about player]

**Leads to**: Node 8

---

## Node 5: IMPRESSED (Skill Success)
**Type**: NPC_LINE

**Sparks**: "Huh." *He looks at you differently.* "You know things. That's... that's good. Yeah, I can get Nakamura. Clean, too. Not that salvage garbage."

[VOICE: Surprised, respectful. Speaking quieter now.]

**Sets**: SPARKS_IMPRESSED = true

**Leads to**: Node 9

---

## Node 6: DEFLECTION (Skill Failure)
**Type**: NPC_LINE

**Sparks**: "I don't know what you heard, friend, but I just sell what I find. Nothing corporate. Nothing hot."

[VOICE: Defensive, walls up. The word "friend" is not friendly.]

**Leads to**: Node 7

---

## Node 7: GENERAL_HUB
**Type**: PLAYER_RESPONSE_HUB

**Option A**: "Show me what you've got." [NEUTRAL]
- Leads to: SHOP_INTERFACE
- Effects: None

**Option B**: "Maybe later." [NEUTRAL]
- Leads to: EXIT_NEUTRAL

**Option C**: "You seem nervous." [OBSERVANT]
- Conditions: PERCEPTION >= 4
- Leads to: Node 10
- Effects: SPARKS_RELATIONSHIP +5

---

## Node 8: PLAYER_INTRO
**Type**: PLAYER_RESPONSE_HUB

**Option A**: "Just a courier." [HUMBLE]
- Leads to: Node 11
- Effects: None

**Option B**: "[Say your name]" [FRIENDLY]
- Leads to: Node 12
- Effects: SPARKS_RELATIONSHIP +5

**Option C**: "None of your business." [COLD]
- Leads to: Node 13
- Effects: SPARKS_RELATIONSHIP -5

---

## Node 9: SPECIAL_INVENTORY
**Type**: NPC_LINE

**Sparks**: "Tell you what. You seem like someone who appreciates quality. I'll show you the good stuff. Not the market display."

[VOICE: Conspiratorial, pleased to meet someone who gets it]

*He pulls out a hidden case.*

**Leads to**: SHOP_INTERFACE_PREMIUM
**Sets**: SPARKS_PREMIUM_ACCESS = true

---

## Node 10: NERVOUS_RESPONSE
**Type**: NPC_LINE

**Sparks**: "Nervous? In this market? With these prices?" *Forced laugh.* "Everyone's nervous. You should be too."

[VOICE: Deflecting, but the laugh doesn't reach his eyes]

**Leads to**: Node 7

---

## Node 11: COURIER_RESPONSE
**Type**: NPC_LINE

**Sparks**: "Courier, huh? Good work if you can survive it. I do maintenance on some courier rigs. Maybe I'll see you around."

[VOICE: Professional respect]

**Leads to**: Node 7

---

## Node 12: NAME_EXCHANGE
**Type**: NPC_LINE

**Sparks**: "Good to meet you. I'm not great with names, but I remember faces. And purchases."

[VOICE: Genuine, slightly awkward]

**Leads to**: Node 7

---

## Node 13: COLD_RESPONSE
**Type**: NPC_LINE

**Sparks**: "Fair enough. Business is business."

[VOICE: Shutting down, professional distance]

**Leads to**: Node 7

---

## Exit Nodes

### EXIT_FRIENDLY
**Sparks**: "Stop by anytime. I'm here until the Saints tell me otherwise."
**Relationship**: +5

### EXIT_NEUTRAL
**Sparks**: "You know where to find me."
**Relationship**: No change

### SHOP_INTERFACE
*Opens standard inventory*
**Relationship**: No change

### SHOP_INTERFACE_PREMIUM
*Opens premium inventory with Nakamura parts*
**Relationship**: +10

---

## Summary
- **Total Nodes**: 13 + 4 exits
- **Estimated Lines**: 25-30
- **Flags Set**: SPARKS_IMPRESSED, SPARKS_PREMIUM_ACCESS
- **Flags Checked**: None (first meeting)
```

---

## Template 3: Side Quest

### Blank Template

```markdown
# [QUEST NAME]

## Metadata
- **Quest ID**: [ID]
- **Type**: [MAJOR_SIDE / MINOR_SIDE / FACTION]
- **Tier Available**:
- **Estimated Duration**:
- **Repeatable**: [Yes/No]

## Prerequisites
- **Quests Completed**:
- **Flags Required**:
- **Relationship Required**:
- **Items Required**:

## Quest Giver
- **NPC**:
- **Location**:
- **Trigger**:

## Synopsis
[One paragraph summary]

---

## Act 1: Setup

### Hook
[How quest is introduced]

### Initial Dialogue
[Quest giver conversation - use dialogue tree format]

### Objective
[Clear goal stated]

---

## Act 2: Complication

### Twist
[What changes]

### Moral Dilemma
[What choice player faces]

### Investigation/Action Phase
[What player does]

---

## Act 3: Resolution

### Path A: [Name]
- **Trigger**: [What player did]
- **Outcome**: [What happens]
- **Dialogue**: [Resolution conversation]
- **Rewards**:
  - Credits:
  - Items:
  - Relationship:
  - Flags Set:

### Path B: [Name]
[Same structure]

### Path C: [Name] (if applicable)
[Same structure]

---

## Complications (Optional)
[Random events that can occur during quest]

## NPCs Involved
| NPC | Role | Can Die |
|-----|------|---------|
| | | |

## Locations Used
-

## Story Flags
### Checks
-

### Sets
-

---

## Dialogue Line Estimates
- **Quest Giver**: ~X lines
- **Supporting NPCs**: ~X lines
- **Total**: ~X lines

## Writer Notes
[Any special considerations]
```

### Worked Example: Minor Side Quest

```markdown
# Sparks' Debt

## Metadata
- **Quest ID**: SQ_SPARKS_DEBT
- **Type**: MINOR_SIDE
- **Tier Available**: 4+
- **Estimated Duration**: 10-15 minutes
- **Repeatable**: No

## Prerequisites
- **Quests Completed**: None
- **Flags Required**: MET_SPARKS = true
- **Relationship Required**: SPARKS_RELATIONSHIP >= 30
- **Items Required**: None

## Quest Giver
- **NPC**: Viktor "Sparks" Reyes
- **Location**: The Hollows market
- **Trigger**: Visit Sparks after reaching Tier 4 with relationship 30+

## Synopsis
Sparks owes the Chrome Saints for "protection" and a bad deal on salvage. He's three days from a beating—or worse. He asks the player to either negotiate a payment plan, find leverage on the Saints, or help him disappear.

---

## Act 1: Setup

### Hook
When player visits Sparks, he's visibly shaken. His stall is half-packed.

### Initial Dialogue

**Sparks**: "Oh. Oh, it's you. Good. You're—yeah. I need to talk to you. Not here."

*He glances around nervously.*

**Player Options**:
1. "What's wrong?" [CONCERNED]
2. "Make it quick." [IMPATIENT]
3. "You look terrible." [BLUNT]

**Sparks**: "The Saints. I owe them. A lot. Three days, they said. Three days or they start taking payments out of my kneecaps."

*He swallows.*

"I can't get the credits. I can barely eat. But you—you know people, right? You're a courier. Maybe there's something..."

**Player Options**:
1. "How much do you owe?" [PRACTICAL]
   → 2,500 credits. Player can pay if they have it (Path A easy)
2. "Why do you owe them?" [CURIOUS]
   → Bad salvage deal + protection fees. Not his fault.
3. "What do you want me to do?" [DIRECT]
   → Sparks presents options
4. "Not my problem." [COLD]
   → Quest declined, SPARKS_RELATIONSHIP -20

### Objective Options
Sparks suggests three approaches:
1. **Negotiate**: Talk to Jax (Saints lieutenant) about a payment plan
2. **Leverage**: Find dirt on the Saints to make them back off
3. **Disappear**: Help Sparks vanish before the deadline

---

## Act 2: Complication

### The Twist
Whichever path player chooses, they discover: Sparks' debt isn't just money. He accidentally sold the Saints a piece of tech that turned out to be a Nakamura tracker. The Saints think he set them up. They want blood, not just credits.

### Investigation/Action Phases

**Path A (Negotiate)**:
- Meet Jax at Chrome Saints territory
- Jax reveals the tracker situation
- Player must convince Jax that Sparks didn't know
- [EMPATHY or DECEPTION skill checks]

**Path B (Leverage)**:
- Investigate Saints operations
- Discover they're planning a heist on Union supplies
- Can either use this as blackmail OR warn the Union
- Multiple outcomes based on choice

**Path C (Disappear)**:
- Help Sparks pack essential gear
- Get him to Ghost Network contact (if player has access)
- Or smuggle him out through docks (riskier)

---

## Act 3: Resolution

### Path A-1: Negotiate Success
- **Trigger**: Convince Jax through skill check (EMPATHY 12 or DECEPTION 10)
- **Outcome**: Jax agrees it was an accident. Debt reduced to 1,000 credits. Sparks owes player.
- **Dialogue**:
  **Jax**: "Fine. Tell your tech rat he's got one more chance. But if I smell Nakamura on him again..."
- **Rewards**:
  - Credits: None (unless Sparks pays player back later)
  - Items: Sparks gives player a custom mod (worth ~800 credits)
  - Relationship: SPARKS +30, CHROME_SAINTS +10
  - Flags Set: SPARKS_DEBT_RESOLVED_PEACE

### Path A-2: Negotiate Failure
- **Trigger**: Fail skill check
- **Outcome**: Jax doesn't believe you. Saints beat Sparks. He survives but is scarred.
- **Dialogue**:
  **Jax**: "Nice try, courier. But a lie's a lie. Tell Sparks we'll be gentle. First time."
- **Rewards**:
  - Credits: None
  - Items: None
  - Relationship: SPARKS +10 (for trying), CHROME_SAINTS -10
  - Flags Set: SPARKS_BEATEN

### Path B-1: Blackmail Saints
- **Trigger**: Use heist info as leverage
- **Outcome**: Saints back off but remember you. Sparks is safe but you've made enemies.
- **Dialogue**:
  **Jax**: "You think you're clever. Maybe you are. But clever people have accidents in this city."
- **Rewards**:
  - Credits: 500 (Sparks' gratitude)
  - Items: Saints leave a "gift" - damaged chrome as warning
  - Relationship: SPARKS +25, CHROME_SAINTS -30
  - Flags Set: SPARKS_DEBT_RESOLVED_BLACKMAIL, SAINTS_ENEMY

### Path B-2: Warn Union
- **Trigger**: Share heist info with Union instead
- **Outcome**: Union ambushes Saints. Sparks' debt becomes irrelevant in the chaos. Saints still blame Sparks.
- **Dialogue**:
  **Lopez** (Union): "Good intel. We owe you. The Saints? They won't be collecting debts for a while."
- **Rewards**:
  - Credits: 800 (Union payment)
  - Items: Union supplies
  - Relationship: SPARKS +15, UNION +25, CHROME_SAINTS -40
  - Flags Set: SPARKS_DEBT_RESOLVED_UNION, SAINTS_CRIPPLED

### Path C-1: Disappear (Ghost Network)
- **Trigger**: Have GHOST_NETWORK_ACCESS flag
- **Outcome**: Sparks vanishes. Clean exit. You lose a vendor but gain Ghost Network favor.
- **Dialogue**:
  **Sparks**: "I won't forget this. If I ever set up shop again... you'll be first to know."
- **Rewards**:
  - Credits: None
  - Items: Sparks leaves his best inventory for you
  - Relationship: GHOST_NETWORK +15
  - Flags Set: SPARKS_EXTRACTED, SPARKS_UNAVAILABLE

### Path C-2: Disappear (Docks)
- **Trigger**: No Ghost Network access, choose risky option
- **Outcome**: 50% chance of clean exit, 50% chance Saints catch you both
- **Success Dialogue**:
  **Sparks**: "I don't know how to thank you. Maybe someday..."
- **Failure Dialogue**:
  **Jax**: "Thought you could sneak a rat off my ship? Wrong dock, courier."
- **Rewards (Success)**:
  - Credits: None
  - Items: Basic electronics (Sparks' emergency stash)
  - Flags Set: SPARKS_ESCAPED
- **Rewards (Failure)**:
  - Credits: -500 (Saints take your money)
  - Items: Lose some inventory
  - Relationship: CHROME_SAINTS -25
  - Flags Set: SPARKS_CAUGHT, SPARKS_DEAD

---

## Complications (Optional)
During the quest, one of these may trigger (20% each):
1. **Saints Patrol**: Encounter Chrome Saints while investigating. Must talk, fight, or flee.
2. **Nakamura Tracker**: The original tracker activates, drawing corporate attention.
3. **Sparks Panics**: Sparks tries to run on his own, requiring player to find him.

## NPCs Involved
| NPC | Role | Can Die |
|-----|------|---------|
| Sparks | Quest giver | Yes (Path C-2 failure) |
| Jax | Saints lieutenant | No |
| Lopez | Union contact (Path B-2) | No |

## Locations Used
- The Hollows market (start)
- Chrome Saints territory (Path A)
- Red Harbor docks (Path B investigation, Path C-2)
- Ghost Network safehouse (Path C-1)

## Story Flags
### Checks
- MET_SPARKS
- GHOST_NETWORK_ACCESS (optional path)

### Sets
- SPARKS_DEBT_RESOLVED_[PATH]
- SPARKS_BEATEN / SPARKS_DEAD / SPARKS_EXTRACTED / SPARKS_ESCAPED
- SAINTS_ENEMY (Path B-1)
- SAINTS_CRIPPLED (Path B-2)
- SPARKS_UNAVAILABLE (Path C-1)

---

## Dialogue Line Estimates
- **Sparks**: ~40 lines
- **Jax**: ~25 lines
- **Lopez**: ~10 lines (Path B-2 only)
- **Ambient/Narration**: ~20 lines
- **Total**: ~95 lines

## Writer Notes
- This quest establishes Chrome Saints as a credible threat
- Sparks' fate affects Tier 7+ content (if alive, provides Nakamura codes)
- Path B-2 (warn Union) creates lasting faction consequences
- Keep Sparks sympathetic—he's in over his head, not a bad person
```

---

## Template 4: Bark/Reaction Line

### Blank Template

```markdown
## [BARK CATEGORY]: [SPECIFIC TRIGGER]

### Context
[When this bark plays]

### Conditions
- Tier:
- Humanity:
- Flags:
- Location:

### Variants

**Variant 1** [CONDITION]
"[Line]"
[VOICE: Direction]

**Variant 2** [CONDITION]
"[Line]"
[VOICE: Direction]

**Variant 3** [CONDITION]
"[Line]"
[VOICE: Direction]
```

### Worked Example: Reputation Bark

```markdown
## RECOGNITION: HIGH_TIER_COURIER

### Context
Random NPC recognizes player as a high-tier courier (Tier 6+)

### Conditions
- Tier: 6+
- Humanity: Any
- Flags: None
- Location: Public areas (markets, streets, stations)

### Variants

**Variant 1** [HUMANITY >= 60]
"Hey, you're that courier, right? The one who did the [random job reference]. Respect."
[VOICE: Impressed, slightly starstruck]

**Variant 2** [HUMANITY 40-59]
"That's... that's the courier. Don't make eye contact."
[VOICE: Nervous whisper to companion, not meant for player to hear]

**Variant 3** [HUMANITY < 40]
"Oh god, it's them. Just keep walking. Don't draw attention."
[VOICE: Genuine fear, averting eyes]

**Variant 4** [CHROME_SAINTS_RELATIONSHIP > 50]
"Saints say you're good people. That means something around here."
[VOICE: Respectful nod]

**Variant 5** [CHROME_SAINTS_RELATIONSHIP < -30]
"Saints are looking for you. Just thought you should know."
[VOICE: Helpful warning, slightly scared]
```

---

## Quick Reference: Template Selection

| Content Type | Template | When to Use |
|--------------|----------|-------------|
| New NPC | Character Profile | Any new character |
| Conversation | Dialogue Tree | Structured conversations |
| Mission | Side Quest | Any quest content |
| Random lines | Bark/Reaction | Ambient/triggered lines |
| Item | Item Description* | New equipment/cargo |
| Location | Location File* | New areas |

*See existing examples in respective directories for these templates.

---

## Submission Checklist

Before submitting content using these templates:

- [ ] Template sections fully completed
- [ ] No placeholder text remaining
- [ ] Voice direction included for all NPC lines
- [ ] Skill checks have difficulty ratings
- [ ] Story flags follow naming convention
- [ ] Related content cross-referenced
- [ ] Word counts estimated
