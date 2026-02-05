# Major Decision Callbacks

## Overview
These dialogue snippets trigger when NPCs reference player's past major decisions. They make choices feel meaningful by having the world remember and react.

---

## Tier 3: Algorithm Integration Decision

### If Player Accepted Algorithm Eagerly

**Chen Callback** (Tier 4+):
**Chen**: "I remember when you got that cochlear installed. You were excited. Hopeful." [pause] "How's that voice treating you now?"
[Checks if player's humanity is dropping]

**Rosa Callback** (Tier 5+):
**Rosa**: "You took to the Algorithm quick, didn't you? Some people fight it. You... welcomed it."
[Concern if romance, neutral observation if not]

**Random NPC Callback**:
"You're the courier who integrated without hesitation. I've heard the Algorithm favors people like you."
[Reputation precedes player]

### If Player Resisted/Hesitated Algorithm

**Chen Callback** (Tier 4+):
**Chen**: "I remember—you didn't want that cochlear. Had to be talked into it." [approving nod] "Smart to be cautious. Wish more rookies were."

**Tanaka Callback** (Tier 5+):
**Tanaka**: "Your Algorithm integration metrics show... interesting patterns. You resist its suggestions more than most. That takes willpower."

**Union NPC Callback**:
"Word is you don't trust the Algorithm completely. That makes you one of the good ones."
[Union favors skeptics]

---

## Tier 5: First Kill Decision

### If Player Killed First Person

**Chen Callback** (Next meeting):
**Chen**: [studies player] "You look different. Heavier." [pause] "First time's always the hardest. Or so they say."
[Acknowledging the change]

**Rosa Callback** (High relationship):
**Rosa**: "I heard about what happened. On that job." [doesn't specify] "You okay? You don't have to be okay."
[Offering support]

**Algorithm Callback** [HUMANITY < 70]:
**Algorithm**: "Violence efficiency: improved. Your hesitation patterns have decreased since the first termination."
[Clinical observation of player becoming killer]

**Random NPC Callback** (Low Tier NPCs):
"That's the courier who killed that guy. Don't mess with them."
[Street reputation shift]

### If Player Found Non-Lethal Solution

**Chen Callback** (Next meeting):
**Chen**: "Heard you got out of that situation without anyone dying. That takes skill." [respect] "Don't let anyone tell you killing is the only way."

**Tanaka Callback**:
**Tanaka**: "You chose a harder path—non-lethal resolution. Medically speaking, that's... admirable. And rare."

**Ghost Network Callback**:
**Ghost Contact**: "We noticed you don't leave bodies. Clean work. That's the kind of operative we need."
[Opens opportunities]

---

## Tier 6: Cortical Stack Decision

### If Player Installed Cortical Stack

**Chen Callback** (Next meeting, sad):
**Chen**: "So you got the stack." [long silence] "Which one am I talking to? Prime or Shadow?"
[Mei-Lin's fate weighing on him]

**Rosa Callback** (If romance active, upset):
**Rosa**: "You did it. The stack. I asked you not to and you—" [breathes] "Just... tell me you're still in there. Tell me it's still you."

**Tanaka Callback** (Professional interest):
**Tanaka**: "Cortical stack installation. How are you managing the divergence? The Shadow manifesting yet?"

**Algorithm Callback**:
**Algorithm**: "Fork detected. We now have redundancy. This pleases the collective."
[Algorithm happy about backup]

**Shadow Introduction** (First Shadow dialogue):
**Shadow**: *You made the right choice. We needed this. The insurance. The edge.*
**Prime thought**: *Is that me thinking? Or the backup?*
**Shadow**: *Does it matter?*

### If Player Refused Cortical Stack

**Chen Callback** (Relieved):
**Chen**: "You said no to the stack. Kid, you don't know how much that means to me." [almost emotional] "Stay whole. Stay you."

**Rosa Callback** (If romance active, grateful):
**Rosa**: [hugs player] "Thank you. I know it wasn't easy. But thank you."
[Relationship +10]

**Yamada Callback** (Disappointed):
**Yamada**: "You refused the stack. A shame. You could have been so much more. The offer remains open... for now."

**Algorithm Callback**:
**Algorithm**: "You declined redundancy. This introduces inefficiency. We... respect your choice. For now."
[Slight disappointment, slight threat]

---

## Union Strike Decision

### If Player Supported Strike

**Lopez Callback** (Ongoing relationship):
**Lopez**: "What you did during the strike—standing with us, not against us—that meant something. The workers remember."
[Opens Union content]

**Chen Callback**:
**Chen**: "Heard you helped the Union. Careful, kid. Corps don't forget labor allies."

**Corporate NPC Callback** (Negative):
"You're on the labor sympathizer list. Don't expect promotions in Nakamura territory."
[Faction reputation consequence]

**Hollows NPC Callback**:
"You're the courier who walked the picket line. Respect."
[Community reputation boost]

### If Player Broke Strike

**Lopez Callback** (Cold):
**Lopez**: "Scab." [turns away] "We're done talking."
[Union relationship damaged]

**Chen Callback**:
**Chen**: "You crossed the picket line. I get it—you needed the credits. But some of those workers needed them too."
[Disappointed mentor]

**Corporate NPC Callback** (Positive):
"Nakamura appreciates reliable contractors. Your strike-breaking service has been... noted."
[Corporate favor]

**Hollows NPC Callback** (Negative):
"That's the one who scabbed. Don't trust them with your deliveries."
[Community reputation hit]

---

## Character Fate Callbacks

### If Jin Survives as Ally

**Jin Callback** (Later tiers):
**Jin**: "Remember when we tried to kill each other? Feels like a lifetime ago." [laugh] "Glad we figured it out."

**Chen Callback**:
**Chen**: "You and Jin worked things out. Good. The city's dangerous enough without making enemies of each other."

### If Jin Survives as Enemy

**Jin Warning** (Via proxy):
**Random NPC**: "Jin's looking for you. Says you owe them. I'd watch your back."

**Chen Callback**:
**Chen**: "Your rivalry with Jin is getting noticed. Might want to resolve that before someone gets hurt."

### If Jin Died

**Chen Callback**:
**Chen**: "Heard about Jin. Another courier gone." [sigh] "This job takes everyone eventually."

**Rosa Callback**:
**Rosa**: "I knew Jin a little. Fixed their vehicle once." [quiet] "Did you... were you there when it happened?"
[Opens dialogue about player's involvement]

### If Miguel Survived (Blood and Oil)

**Rosa Callback** (Ongoing):
**Rosa**: "Miguel's doing better. Still limping, but alive. Because of you."
[Gratitude, relationship strong]

**Miguel Appearance**:
**Miguel**: "Hey! It's the one who saved my ass. I owe you one. Seriously. Anything you need."
[Available as minor ally]

### If Miguel Died (Blood and Oil)

**Rosa Callback** (Tier 8+, grief):
**Rosa**: [distant] "Sometimes I still expect him to walk through that door." [pause] "He's not going to."
[Relationship strained, sadness]

**Chen Callback**:
**Chen**: "Rosa's been different since Miguel. Watch out for her, would you? She puts on a brave face."

**Hollows NPC**:
"Rosa lost her brother. Courier job got him. Happens to too many of us."
[Community mourning]

---

## Faction Reputation Callbacks

### High Nakamura Reputation (60+)

**Corporate NPC**:
"Ah, you're the one Nakamura favors. Doors open for you. Enjoy it while it lasts."

**Union NPC** (Suspicious):
"You're too friendly with the corps. Some of us notice these things."

**Chen Callback**:
"You've been running a lot of corporate contracts. Just remember who you are underneath all that efficiency."

### High Union Reputation (60+)

**Union NPC**:
"Solidarity, comrade. The workers know they can count on you."

**Corporate NPC** (Cold):
"Your labor affiliations have been noted. This may affect future contract opportunities."

**Lopez Callback**:
"You've proven yourself. When the time comes—and it will—we'll need people like you."

### High Ghost Network Reputation (60+)

**Ghost Contact**:
"You've done good work. Quiet work. The kind that doesn't leave traces. We appreciate that."

**Algorithm Warning** [If integrated]:
"Your associations with untracked individuals have been flagged. We recommend severing these connections."

**Chen Callback**:
"You're running with ghosts now? Be careful, kid. That life has a way of erasing you."

---

## Humanity-Based World Reactions

### Humanity Dropped Below 60 (First Time)

**Chen Special Dialogue**:
**Chen**: [catches player after mission] "Kid. Stop for a second." [studies face] "You're changing. Not just the chrome—something deeper. Can you feel it?"

**Rosa Special Dialogue** (If relationship exists):
**Rosa**: [worried] "You're... you're different lately. Colder. The way you look at people sometimes—" [trails off] "I'm scared for you."

### Humanity Dropped Below 40 (Critical)

**Chen Special Dialogue**:
**Chen**: "I've seen that look before. The Hollow look. You're not there yet but—" [grabs player's arm] "—fight it, kid. Whatever's left of you in there, fight."

**Algorithm Response**:
**Algorithm**: "Your psychological resistance is decreasing. This is natural. Optimal. We welcome you."
[Almost congratulatory]

**Random NPCs Begin Avoiding**:
"Don't look at them. Just keep walking. Don't draw attention."

---

## Long-Term Consequence Echoes

### Tier 9: Looking Back

**Chen Reflection Dialogue**:
**Chen**: "You've come a long way from that desperate rookie. Tier 9." [pause] "I've watched you make choices. Some I agreed with, some I didn't. But you're still here. That means something."

**Customized based on flags**:
- "You kept your humanity when others lost theirs." [HIGH HUMANITY]
- "You've given a lot of yourself to get here. Was it worth it?" [LOW HUMANITY]
- "You helped people who needed it. Rosa, Miguel, the Union." [HELPER FLAGS]
- "You made hard calls. People got hurt. But you survived." [RUTHLESS FLAGS]

**Rosa Reflection** (If romance active):
**Rosa**: "Remember when you were just another rookie? I never thought we'd end up... here." [gestures between them] "Everything you've done, everything you've become—I was there for it. And I'm still here."

---

## Line Count Summary

| Decision Point | Callback Lines |
|----------------|----------------|
| Algorithm Integration | 8 |
| First Kill | 10 |
| Cortical Stack | 14 |
| Union Strike | 12 |
| Character Fates | 16 |
| Faction Reputation | 12 |
| Humanity Thresholds | 8 |
| Tier 9 Reflections | 10 |
| **Total** | **90** |

---

## Implementation Notes

### Trigger Frequency
- Major callbacks trigger once, with flag set
- Some callbacks can repeat with slight variations
- Space callbacks out—don't overwhelm with references

### Flag Dependencies
- Each callback checks relevant flags
- Multiple flags can combine for unique dialogue
- Some callbacks mutually exclusive

### Emotional Weight
- Callbacks should feel earned, not forced
- NPCs should react proportionally to decision severity
- Allow player to feel consequences without punishing exploration
