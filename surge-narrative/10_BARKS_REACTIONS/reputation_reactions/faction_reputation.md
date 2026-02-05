# Faction Reputation Barks

## Overview
These lines play when NPCs affiliated with various factions react to the player based on faction relationship standing.

---

## Nakamura Corporation

### High Reputation (60+): Corporate Ally

**Variant 1** [CORP_EMPLOYEE]
"The courier with the golden rating. Nakamura appreciates your service."
[VOICE: Professional approval]

**Variant 2** [CORP_EMPLOYEE]
"You're on the preferred contractor list. Priority access authorized."
[VOICE: Opening doors]

**Variant 3** [CORP_EMPLOYEE]
"The Algorithm speaks highly of you. That's rare for an external."
[VOICE: Impressed]

**Variant 4** [RANDOM_NPC]
"Careful. That one's in with Nakamura. Don't make trouble."
[VOICE: Warning others]

### Neutral Reputation (0-59): Standard Treatment

**Variant 1** [CORP_EMPLOYEE]
"Courier. State your business."
[VOICE: Professional, neutral]

**Variant 2** [CORP_EMPLOYEE]
"You're cleared for this level. Don't wander."
[VOICE: Standard security]

### Low Reputation (-59 to -1): Corporate Suspicion

**Variant 1** [CORP_EMPLOYEE]
"Security flagged your profile. We're watching you."
[VOICE: Threatening]

**Variant 2** [CORP_EMPLOYEE]
"Your access has been... restricted. For efficiency."
[VOICE: Corporate euphemism]

**Variant 3** [RANDOM_NPC]
"You pissed off the wrong corporation. Brave or stupid?"
[VOICE: Mix of respect and pity]

### Hostile Reputation (-60 or below): Corporate Enemy

**Variant 1** [CORP_EMPLOYEE]
"Alert. Blacklisted individual detected. Security to—"
[VOICE: Immediate threat response]

**Variant 2** [CORP_EMPLOYEE]
"You shouldn't be here. The Algorithm sees everything."
[VOICE: Warning/threat]

**Variant 3** [RANDOM_NPC]
"That's the one who crossed Nakamura. They're still walking? Impressive."
[VOICE: Surprised they're alive]

---

## The Union

### High Reputation (60+): Union Hero

**Variant 1** [UNION_MEMBER]
"Solidarity, comrade! You're one of the good ones."
[VOICE: Warm welcome]

**Variant 2** [UNION_MEMBER]
"Lopez told us about you. You've got our back, we've got yours."
[VOICE: Established trust]

**Variant 3** [UNION_MEMBER]
"The workers remember who helped us. That means something."
[VOICE: Gratitude with weight]

**Variant 4** [RANDOM_NPC]
"That courier helped the Union. Maybe they're not all selfish."
[VOICE: Shifting perception]

### Neutral Reputation (0-59): Potential Ally

**Variant 1** [UNION_MEMBER]
"You a courier? We could use people like you. Think about it."
[VOICE: Recruitment pitch]

**Variant 2** [UNION_MEMBER]
"Not a scab, not a comrade. What are you, exactly?"
[VOICE: Trying to categorize]

### Low Reputation (-59 to -1): Union Disappointment

**Variant 1** [UNION_MEMBER]
"You sided with the bosses. Don't expect sympathy here."
[VOICE: Cold shoulder]

**Variant 2** [UNION_MEMBER]
"We needed you. You weren't there."
[VOICE: Personal disappointment]

**Variant 3** [RANDOM_NPC]
"That's the courier who broke the strike. Workers don't forget."
[VOICE: Historical grudge]

### Hostile Reputation (-60 or below): Class Traitor

**Variant 1** [UNION_MEMBER]
"Scab! Get out of here before we make you!"
[VOICE: Aggressive rejection]

**Variant 2** [UNION_MEMBER]
"You sold us out for credits. How do you sleep?"
[VOICE: Moral accusation]

**Variant 3** [RANDOM_NPC]
"Stay away from them. They're the reason people got hurt."
[VOICE: Warning others]

---

## Ghost Network

### High Reputation (60+): Trusted Operative

**Variant 1** [GHOST_AGENT]
*Subtle nod* "You're in. Deep. Good work."
[VOICE: Minimal, coded approval]

**Variant 2** [GHOST_AGENT]
"The network vouches for you. That's not nothing."
[VOICE: Significant trust]

**Variant 3** [GHOST_AGENT]
"Need an extraction? Need to disappear? You know how to reach us."
[VOICE: Offering services]

**Variant 4** [RANDOM_NPC]
"That one knows people. The invisible kind. Don't ask questions."
[VOICE: Mysterious respect]

### Neutral Reputation (0-59): Unknown Quantity

**Variant 1** [GHOST_AGENT]
*Watching from distance* "..."
[VOICE: Silent assessment]

**Variant 2** [GHOST_AGENT]
"We know who you are. The question is: who do you want to be?"
[VOICE: Cryptic invitation]

### Low Reputation (-59 to -1): Untrustworthy

**Variant 1** [GHOST_AGENT]
"You talked. Or someone you know talked. Either way: problem."
[VOICE: Accusation]

**Variant 2** [GHOST_AGENT]
"The network sees everything. Including what you did."
[VOICE: Threat of knowledge]

### Hostile Reputation (-60 or below): Burned

**Variant 1** [GHOST_AGENT]
"You're burned. Walk away. Now."
[VOICE: Final warning]

**Variant 2** [GHOST_AGENT]
"We protect our own. You're not our own anymore."
[VOICE: Exile statement]

**Variant 3** [RANDOM_NPC]
"That one crossed the Ghost Network. Surprised they're still... here."
[VOICE: Implications of disappearance]

---

## Chrome Saints

### High Reputation (60+): Saint Runner

**Variant 1** [CHROME_SAINT]
"Saint Runner! Chrome bless you!"
[VOICE: Religious greeting]

**Variant 2** [CHROME_SAINT]
"You're under our protection. Anyone messes with you, they mess with us."
[VOICE: Gang loyalty]

**Variant 3** [CHROME_SAINT]
"Mariah says you're good chrome. That's the highest honor."
[VOICE: Leadership approval]

**Variant 4** [RANDOM_NPC]
"Chrome Saints protect that one. Walk carefully around them."
[VOICE: Warning of gang ties]

### Neutral Reputation (0-59): Potential Prospect

**Variant 1** [CHROME_SAINT]
"Nice chrome. Looking to upgrade? We know people."
[VOICE: Business opportunity]

**Variant 2** [CHROME_SAINT]
"You're on our turf. Don't start problems, won't have problems."
[VOICE: Territorial neutrality]

### Low Reputation (-59 to -1): On Notice

**Variant 1** [CHROME_SAINT]
"You're not welcome here, courier. Move along."
[VOICE: Cold dismissal]

**Variant 2** [CHROME_SAINT]
"You owe the Saints. Don't think we forgot."
[VOICE: Outstanding debt]

### Hostile Reputation (-60 or below): Marked

**Variant 1** [CHROME_SAINT]
"That's the one! Chrome claim them!"
[VOICE: Attack order]

**Variant 2** [CHROME_SAINT]
"You dishonored the Saints. Only one way to fix that."
[VOICE: Death sentence]

**Variant 3** [RANDOM_NPC]
"The Saints want them dead. I'd leave town."
[VOICE: Practical advice]

---

## The Interstitial / Third Path

### Access Granted (Found Them)

**Variant 1** [INTERSTITIAL_RESIDENT]
"You found us. That means you were meant to."
[VOICE: Philosophical welcome]

**Variant 2** [INTERSTITIAL_RESIDENT]
"Another seeker. The balance brings all sorts."
[VOICE: Accepting]

**Variant 3** [INTERSTITIAL_RESIDENT]
"Your humanity is... balanced. Interesting."
[VOICE: Observing player's state]

### High Trust (Proven Worthy)

**Variant 1** [INTERSTITIAL_RESIDENT]
"You understand the middle path. Few do."
[VOICE: Respect]

**Variant 2** [INTERSTITIAL_RESIDENT]
"Okonkwo speaks of you. He rarely speaks of anyone."
[VOICE: Significant endorsement]

**Variant 3** [INTERSTITIAL_RESIDENT]
"You're welcome at the Sanctum. Always."
[VOICE: Full acceptance]

### Suspicious (Extreme Humanity - Too High or Too Low)

**Variant 1** [INTERSTITIAL_RESIDENT] [HUMANITY > 90]
"You reject the chrome completely. That's not balance—that's denial."
[VOICE: Critical observation]

**Variant 2** [INTERSTITIAL_RESIDENT] [HUMANITY < 40]
"You've given too much to the Algorithm. Can balance still be found?"
[VOICE: Doubtful, testing]

---

## Multi-Faction Reactions

### Opposing Factions
**Context**: Player has high rep with one faction, seen by rival

**[UNION_HIGH + NAKAMURA_NPC]**
"Union sympathizer. Your record precedes you."
[VOICE: Cold assessment]

**[NAKAMURA_HIGH + UNION_NPC]**
"Corporate lapdog. Don't expect solidarity here."
[VOICE: Class contempt]

**[GHOST_HIGH + CORP_NPC]**
"Our systems flagged you. Associated with... anomalies."
[VOICE: Suspicious but can't prove anything]

### Balanced Reputation
**Context**: Player maintains neutrality with multiple factions

**Variant 1**
"You work for everyone and no one. Smart? Or just undecided?"
[VOICE: Questioning motives]

**Variant 2**
"A true freelancer. No loyalties. Respect that. Or maybe pity it."
[VOICE: Ambiguous judgment]

---

## Line Count Summary

| Faction | Lines |
|---------|-------|
| Nakamura Corporation | 12 |
| The Union | 12 |
| Ghost Network | 11 |
| Chrome Saints | 12 |
| Interstitial/Third Path | 8 |
| Multi-Faction | 5 |
| **Total** | **60** |

---

## Implementation Notes

### Faction NPC Identification
- Faction NPCs should be visually identifiable
- Use uniforms, chrome styles, or iconography
- Generic NPCs react based on public knowledge

### Reputation Thresholds
- 60+: Strongly allied
- 0-59: Neutral to positive
- -1 to -59: Negative
- -60 or below: Hostile

### Location Context
- Faction barks more common in faction territory
- Ghost Network never identifies in public
- Interstitial only in hidden locations
