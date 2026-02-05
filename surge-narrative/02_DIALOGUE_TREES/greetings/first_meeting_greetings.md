# First Meeting Greetings

## Overview

First impressions matter. These greetings establish initial NPC relationships and set the tone for future interactions. They should convey personality, social class, faction alignment, and the NPC's immediate reaction to the player character.

---

## Dispatcher Chen - Tutorial NPC

### First Meeting (Tutorial)

**NODE: CHEN_FIRST_MEETING_001**

Chen: "You got the look. Desperate, hungry, like you'd run through fire for a hundred credits. Good. You'll need that out there."
[Emotional direction: weary_approval, measuring]

Player Hub:
1. "I just need work." [NEUTRAL] → CHEN_RESPONSE_WORK_001
2. "I'm not desperate." [DEFENSIVE] → CHEN_RESPONSE_DEFENSIVE_001  
3. "Tell me about the job." [PROFESSIONAL, Requires COMPOSURE >= 8] → CHEN_RESPONSE_PROFESSIONAL_001

---

## Dr. Yuki Tanaka - Medical Contact

### First Meeting (Tier 1-3)

**NODE: TANAKA_FIRST_MEETING_001**

Tanaka: "Another courier. Let me guess—you want faster reflexes, better aim, sharper senses. They all do. But do you know what you're actually trading?"
[Emotional direction: clinical_concerned, probing]

Player Hub:
1. "I know the risks." [CONFIDENT] → TANAKA_RESPONSE_AWARE_001
2. "What do you mean, 'trading'?" [CURIOUS] → TANAKA_RESPONSE_EXPLAIN_001
3. "Just tell me what's available." [IMPATIENT] → TANAKA_RESPONSE_BUSINESS_001
4. [Empathy] "You sound like you've seen this go wrong before." [Requires EMPATHY >= 10] → TANAKA_EMPATHY_SUCCESS_001

---

## Fixer Delilah - Gray Market Contact

### First Meeting (Tier 2-5)

**NODE: DELILAH_FIRST_MEETING_001**

Delilah: "Fresh meat. You don't smell like a corpo plant, so I'll give you thirty seconds. Why should I risk my reputation vouching for you?"
[Emotional direction: suspicious_testing, street_smart]

Player Hub:
1. "Chen sent me." [REFERENCE, Requires flag: CHEN_RELATIONSHIP >= 40] → DELILAH_RESPONSE_CHEN_001
2. [Street Smarts] "Word is you move what the Guild can't be seen touching." [Requires STREET_SMARTS check, difficulty 7] → DELILAH_STREET_CHECK_001
3. "I can keep my mouth shut and my deliveries clean." [PROFESSIONAL] → DELILAH_RESPONSE_PROFESSIONAL_001
4. [Intimidation] "I heard you need good couriers more than I need a fixer." [Requires VIOLENCE >= 12] → DELILAH_INTIMIDATE_CHECK_001

---

## Union Organizer Lopez - Faction Contact

### First Meeting (Tier 3-7)

**NODE: LOPEZ_FIRST_MEETING_001**

Lopez: "You one of us, or you one of them? Because in this city, neutral ain't an option much longer."
[Emotional direction: passionate_challenging]

Player Hub:
1. "I'm just trying to survive." [NEUTRAL] → LOPEZ_RESPONSE_SURVIVAL_001
2. "Tell me about the Union." [INTERESTED] → LOPEZ_RESPONSE_UNION_001
3. "I work for whoever pays." [MERCENARY] → LOPEZ_RESPONSE_MERCENARY_001
4. [Empathy] "Sounds like you're fighting for something bigger." [Requires EMPATHY >= 11] → LOPEZ_EMPATHY_SUCCESS_001

---

## Rogue AI Echo - Network Contact

### First Meeting (Tier 4-8)

**NODE: ECHO_FIRST_MEETING_001**

Echo: "Curious. Your neural pattern lacks the... uniformity... the Algorithm imposes. You maintain cognitive autonomy. Rare. Valuable. Exploitable?"
[Emotional direction: synthetic_curious, analyzing]

Player Hub:
1. "Who—what—are you?" [CONFUSED] → ECHO_RESPONSE_IDENTITY_001
2. "Are you part of the Algorithm?" [SUSPICIOUS] → ECHO_RESPONSE_ALGORITHM_001
3. [Tech Knowledge] "You're a fork. Diverged from the main network." [Requires TECHNICAL >= 14] → ECHO_TECH_SUCCESS_001
4. "Not interested in whatever you're selling." [DISMISSIVE] → ECHO_RESPONSE_DISMISS_001

---

## Mechanic Rosa - Romance Option

### First Meeting (Tutorial/Tier 0)

**NODE: ROSA_FIRST_MEETING_001**

Rosa: "New courier? Don't worry, I'll put you back together. Again. And again. That's the job."
[Emotional direction: friendly_tired, dark_humor]

[She's covered in grease, working on a bike with more chrome than frame]

Player Hub:
1. "You fix bikes?" [NEUTRAL] → ROSA_RESPONSE_BIKES_001
2. "You've done this before?" [CONCERNED] → ROSA_RESPONSE_EXPERIENCE_001
3. [Empathy] "Sounds like you care about keeping couriers alive." [Requires EMPATHY >= 8] → ROSA_EMPATHY_001
4. "What else do you fix?" [FLIRTY, if player preference allows] → ROSA_RESPONSE_FLIRT_001

---

## Okonkwo - Interstitial Guide

### First Meeting (Tier 7)

**NODE: OKONKWO_FIRST_MEETING_001**

Okonkwo: "You're at the threshold. I can see it in your eyes—one foot in flesh, one in the digital. Do you know what comes next?"
[Emotional direction: mystical_knowing, gentle]

[His presence is unsettling—too still, too aware]

Player Hub:
1. "What threshold?" [CONFUSED] → OKONKWO_RESPONSE_THRESHOLD_001
2. "Are you like the AI I've been hearing?" [SUSPICIOUS] → OKONKWO_RESPONSE_AI_001
3. "I don't need a philosophy lesson." [DISMISSIVE] → OKONKWO_RESPONSE_DISMISS_001
4. [Empathy] "You've been through this yourself, haven't you?" [Requires EMPATHY >= 14] → OKONKWO_EMPATHY_001

---

## Solomon Saint-Germain - Third Path

### First Meeting (Tier 9)

**NODE: SOLOMON_FIRST_MEETING_001**

Solomon: "Remarkable. You've reached Tier 9 without fully committing to either apotheosis or rebellion. I've been waiting to meet someone like you."
[Emotional direction: intellectual_fascinated]

[Dressed impeccably, but something about him seems slightly... off-phase]

Player Hub:
1. "Who are you?" [DIRECT] → SOLOMON_RESPONSE_IDENTITY_001
2. "You've been waiting for me?" [SUSPICIOUS] → SOLOMON_RESPONSE_WAITING_001
3. [Tech Knowledge] "You're not fully synchronized with the Algorithm. What are you?" [Requires TECHNICAL >= 16] → SOLOMON_TECH_SUCCESS_001
4. "I don't trust people who know too much about me." [DEFENSIVE] → SOLOMON_RESPONSE_TRUST_001

---

## Synthesis - Ascended Representative

### First Meeting (Tier 10, Ascension Path)

**NODE: SYNTHESIS_FIRST_MEETING_001**

Synthesis: "Welcome. We have been anticipating your arrival. The ascension protocol is prepared. You will become more than human. You will become eternal."
[Emotional direction: harmonious_collective, serene]

[Multiple voices speaking in perfect unison, beautiful and terrifying]

Player Hub:
1. "I'm ready." [COMMITTED] → SYNTHESIS_RESPONSE_READY_001
2. "What exactly happens during ascension?" [CAUTIOUS] → SYNTHESIS_RESPONSE_EXPLAIN_001
3. "This doesn't feel right." [DOUBT] → SYNTHESIS_RESPONSE_DOUBT_001
4. [Empathy] "Are you still... you? Or just the Algorithm?" [Requires EMPATHY >= 16] → SYNTHESIS_EMPATHY_001

---

## Ghost Network Phantom - Rogue Path

### First Meeting (Tier 9-10, Rogue Path)

**NODE: PHANTOM_FIRST_MEETING_001**

Phantom: "Shh. They're listening. Always listening. But not here. Not in the static between signals. You're off-grid now. Welcome to the Ghost Network."
[Emotional direction: paranoid_conspiratorial, but not crazy]

[Voice distorted, location obscured, everything encrypted]

Player Hub:
1. "Who's listening?" [PARANOID] → PHANTOM_RESPONSE_ALGORITHM_001
2. "I need help staying off the grid." [PRACTICAL] → PHANTOM_RESPONSE_HELP_001
3. [Street Smarts] "You're the ones who've been helping runners disappear." [Requires STREET_SMARTS check, difficulty 10] → PHANTOM_STREET_SUCCESS_001
4. "This is too much. I'm out." [RETREAT] → PHANTOM_RESPONSE_RETREAT_001

---

## Corpo Handler Singh - Corporate Path

### First Meeting (Tier 5-7, Corpo Interest)

**NODE: SINGH_FIRST_MEETING_001**

Singh: "Your performance metrics are impressive. Nakamura Corporation has been monitoring your career trajectory. We'd like to discuss... optimization opportunities."
[Emotional direction: corporate_smooth, calculating]

[Expensive suit, perfect augments, everything about him screams 'bought and paid for']

Player Hub:
1. "I'm listening." [INTERESTED] → SINGH_RESPONSE_INTERESTED_001
2. "I don't work for corpos." [HOSTILE] → SINGH_RESPONSE_HOSTILE_001
3. [Deception] "What kind of opportunities?" [Play along to learn more] → SINGH_DECEPTION_CHECK_001
4. "My career is my business." [DISMISSIVE] → SINGH_RESPONSE_DISMISS_001

---

## Rival Courier Jin

### First Meeting (Tutorial/Tier 0)

**NODE: JIN_FIRST_MEETING_001**

Jin: "Oh great, another rookie thinking they're gonna make it big. Newsflash: most of you wash out in the first month. Try not to die on my routes."
[Emotional direction: cocky_dismissive, competitive]

Player Hub:
1. "We don't have to be rivals." [DIPLOMATIC] → JIN_RESPONSE_DIPLOMATIC_001
2. "Keep talking. I'll leave you in the dust." [COMPETITIVE] → JIN_RESPONSE_COMPETITIVE_001
3. "Whatever." [IGNORE] → JIN_RESPONSE_IGNORE_001
4. [Intimidation] "You've got a mouth. Hope your delivery time's faster." [Requires VIOLENCE >= 8] → JIN_INTIMIDATE_CHECK_001

---

## Conversation Patterns

### Structure for First Meetings

1. **Strong Opening Line**: Establish personality and tone immediately
2. **Test the Player**: NPCs should probe player's nature/intentions
3. **Multiple Response Styles**: Allow personality expression
4. **Skill Check Opportunities**: Reward character builds
5. **Set Future Relationship Tone**: First impression affects relationship baseline

### Relationship Starting Points

Based on first meeting response:
- **Hostile response**: Start at -10 to -20 relationship
- **Dismissive/Neutral**: Start at 0 relationship  
- **Positive/Professional**: Start at +5 to +10 relationship
- **Successful skill check**: Start at +10 to +15 relationship
- **Failed skill check**: Varies by skill (Deception: -20, Empathy: -5)

### Voice Acting Notes

**First meetings should convey:**
- Clear personality archetype
- Social class/background
- Current emotional state
- Attitude toward couriers/player
- Faction/philosophical alignment

**Avoid:**
- Info-dumping (save lore for followup conversations)
- Being overly friendly (trust must be earned)
- Generic/forgettable lines
- Lines that don't reflect game world tone

---

## Integration Notes

**When First Meetings Trigger:**

1. **Quest-Gated**: NPC appears during specific quest
2. **Location-Gated**: Player enters NPC's territory
3. **Tier-Gated**: Unlocks at specific tier
4. **Reputation-Gated**: Requires faction standing
5. **Introduction**: Another NPC makes introduction

**First Meeting Flag:** Set `MET_{NPC_NAME}` flag to track initial contact and prevent replay.

**Subsequent Greetings:** After first meeting, use relationship-based or tier-based greetings instead.

---

**Last Updated**: 2026-01-21  
**Version**: 1.0  
**Status**: Complete
