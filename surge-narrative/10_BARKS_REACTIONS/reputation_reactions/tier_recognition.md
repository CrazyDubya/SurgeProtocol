# Tier Recognition Barks

## Overview
These lines play when random NPCs notice and react to the player's courier tier rating. Triggers when player enters populated areas or passes NPCs.

---

## Tier 0-2: Rookie Recognition

### Dismissive Reactions
**Context**: Established workers dismissing rookies

**Variant 1**
"Another new face. Give it a week."
[VOICE: Weary, seen it before]

**Variant 2**
"Tier two, huh? Still breathing. That's something."
[VOICE: Mild surprise]

**Variant 3**
"Fresh meat. The Algorithm hasn't gotten to them yet."
[VOICE: Cynical, bitter]

### Helpful Reactions
**Context**: Kind NPCs offering advice

**Variant 1**
"Hey, rookie—watch the alleys in Red Harbor. Gangs patrol after dark."
[VOICE: Genuine warning]

**Variant 2**
"Tier one? Here's free advice: don't trust the shortcuts the Algorithm suggests. Not yet."
[VOICE: Conspiratorial, helpful]

**Variant 3**
"New courier? Chen's good people. He'll look out for you."
[VOICE: Reassuring]

### Predatory Reactions
**Context**: Those who exploit rookies

**Variant 1**
"Tier one, low chrome. Easy mark."
[VOICE: Whispered to companion, calculating]

**Variant 2**
"Hey, rookie! Need to make some fast credits? I've got a job for you..."
[VOICE: Too friendly, suspicious]

**Variant 3**
"Fresh courier. Bet they're carrying something nice."
[VOICE: Predatory interest]

---

## Tier 3-5: Established Recognition

### Professional Respect
**Context**: Recognition among peers

**Variant 1**
"Tier four. Decent work getting there."
[VOICE: Professional nod]

**Variant 2**
"You're the one who did that job in Red Harbor, right? Solid."
[VOICE: Remembering reputation]

**Variant 3**
"Tier five already? Someone's grinding the ratings."
[VOICE: Impressed]

### Competitor Awareness
**Context**: Other couriers sizing up competition

**Variant 1**
"Another tier four. Competition's getting thick."
[VOICE: Wary respect]

**Variant 2**
"Heard your name around. Stay off my routes."
[VOICE: Territorial warning]

**Variant 3**
"Good rating. How much chrome did it cost you?"
[VOICE: Pointed question]

### Client Interest
**Context**: Potential employers noticing

**Variant 1**
"Tier five? Might have work for someone at your level."
[VOICE: Business opportunity]

**Variant 2**
"Established courier. Good. I need discretion."
[VOICE: Secretive, testing]

---

## Tier 6-8: Elite Recognition

### Awe Reactions
**Context**: Lower-tier workers impressed

**Variant 1**
"Holy— that's a tier seven. Don't see many of those down here."
[VOICE: Starstruck]

**Variant 2**
"Tier eight? What are you doing in the Hollows?"
[VOICE: Confused, impressed]

**Variant 3**
"They say tier sevens can run Uptown routes solo. Is that true?"
[VOICE: Curious, admiring]

### Fear Reactions
**Context**: NPCs worried about why elite is present

**Variant 1**
"Tier eight courier just walked in. Something's about to go down."
[VOICE: Nervous warning to others]

**Variant 2**
"Don't make eye contact. That's elite tier."
[VOICE: Whispered, afraid]

**Variant 3**
"Last time I saw a tier seven here, people disappeared."
[VOICE: Ominous memory]

### Request Reactions
**Context**: NPCs asking for help/favors

**Variant 1**
"Excuse me—you're high tier, right? I need someone who can get into Uptown..."
[VOICE: Desperate request]

**Variant 2**
"A tier seven! Please, my package needs to get to Corporate Row. Only someone like you—"
[VOICE: Pleading]

**Variant 3**
"They say you're good. I have a problem. A big one."
[VOICE: Approaching carefully]

---

## Tier 9-10: Legend Recognition

### Legendary Status
**Context**: Player has achieved near-mythic status

**Variant 1**
"Is that... THE courier? The one from the [reference recent major quest]?"
[VOICE: Disbelief, excitement]

**Variant 2**
"Tier ten. I didn't think they were real."
[VOICE: Awe, almost reverent]

**Variant 3**
"I heard stories. Didn't believe them until now."
[VOICE: Witnessing legend]

### Hushed Reactions
**Context**: NPCs too intimidated to approach

**Variant 1**
*Whispered* "Don't look. Don't look. Just keep walking."
[VOICE: Terrified compliance]

**Variant 2**
"That's either a hero or a monster. Maybe both."
[VOICE: Uncertain fear]

**Variant 3**
*Silence, followed by* "...what did they have to do to get that rating?"
[VOICE: Disturbed contemplation]

### Faction-Specific Legend Reactions

**[IF: NAKAMURA_RELATIONSHIP >= 60]**
"Nakamura's golden courier. They say the Algorithm loves them."
[VOICE: Mix of envy and unease]

**[IF: UNION_RELATIONSHIP >= 60]**
"That's the one who helped the Union. A legend among workers."
[VOICE: Working class hero worship]

**[IF: GHOST_NETWORK_ACCESS]**
"They say that courier doesn't exist. No records. Ghost tier."
[VOICE: Conspiracy awe]

**[IF: CHROME_SAINTS_RELATIONSHIP >= 60]**
"Chrome Saints call them 'Saint Runner.' Highest honor."
[VOICE: Gang respect]

---

## Humanity-Modified Tier Reactions

### High Tier + High Humanity (Beloved)
**Context**: Tier 7+ with Humanity 80+

**Variant 1**
"High tier AND still human? That's rare. That's hope."
[VOICE: Emotional, inspired]

**Variant 2**
"They made it without losing themselves. Proves it's possible."
[VOICE: Role model recognition]

### High Tier + Low Humanity (Feared)
**Context**: Tier 7+ with Humanity <40

**Variant 1**
"That's... that's not a person anymore. That's the Algorithm wearing skin."
[VOICE: Horror]

**Variant 2**
"High tier, low humanity. They say that's the price. Look at them."
[VOICE: Warning to others]

**Variant 3**
"The Hollow walks among us. Don't draw its attention."
[VOICE: Genuine terror]

---

## Location-Specific Tier Reactions

### The Hollows
**Tier 6+**: "Elite courier in the Hollows? Either charity or trouble."
**Tier 9+**: "Someone this powerful remembers where they came from? Respect."

### Red Harbor
**Tier 6+**: "High tier in gang territory. Either suicidal or untouchable."
**Tier 9+**: "Even the Saints step aside for that one."

### Uptown Corporate
**Tier 3 or below**: "Low-tier courier in Uptown? Security will notice you."
**Tier 6+**: "You belong here. That rating opens doors."

### The Interstitial
**All Tiers**: "Your rating means nothing here. Only your balance matters."
[VOICE: Third Path philosophy]

---

## Line Count Summary

| Tier Range | Lines |
|------------|-------|
| Tier 0-2 | 9 |
| Tier 3-5 | 9 |
| Tier 6-8 | 9 |
| Tier 9-10 | 10 |
| Humanity Modified | 5 |
| Location Specific | 6 |
| **Total** | **48** |

---

## Implementation Notes

### Trigger Frequency
- Don't trigger every time player enters area
- 15-30% chance per populated area
- Cooldown of 3-5 in-game hours between barks
- Never repeat same bark twice in a row

### NPC Selection
- Use ambient NPCs, not named characters
- Vary voice types (male, female, young, old)
- Match NPC type to location (workers in Harbor, suits in Uptown)

### Audio Processing
- Lower tier reactions: Normal audio
- Higher tier reactions: Slightly hushed, more reverential
- Fear reactions: Quick, sometimes whispered
