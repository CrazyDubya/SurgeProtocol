# Enemy Combat Barks

## Overview
These lines play during combat from enemy NPCs. Organized by enemy type with variants for different combat phases.

---

## Generic Gang Members

### Combat Initiation
**Context**: Gang member starts fight

**Variant 1**
"Wrong street, courier!"
[VOICE: Aggressive, territorial]

**Variant 2**
"You're carrying something valuable. I can tell."
[VOICE: Predatory confidence]

**Variant 3**
"Should've paid the toll!"
[VOICE: Demanding, threatening]

**Variant 4**
"Nobody walks through here without our say!"
[VOICE: Gang authority]

### Taking Damage
**Context**: Gang member hit

**Variant 1**
*Grunt* "Lucky shot!"
[VOICE: Defiant]

**Variant 2**
"You'll pay for that!"
[VOICE: Angry pain]

**Variant 3**
"Guys! Some help here!"
[VOICE: Calling reinforcements]

### Losing Fight
**Context**: Gang member nearly defeated

**Variant 1**
"This ain't worth it!"
[VOICE: Reconsidering life choices]

**Variant 2**
"I'm out! I'm OUT!"
[VOICE: Fleeing]

**Variant 3**
"Just take the package! Take it!"
[VOICE: Surrendering]

### Victory (Player Defeated)
**Context**: Gang wins

**Variant 1**
"That's what you get, courier."
[VOICE: Satisfied violence]

**Variant 2**
"Check their pockets. Take everything."
[VOICE: Practical looting]

---

## Chrome Saints

### Combat Initiation
**Context**: Chrome Saints engage

**Variant 1**
"Chrome for the Saints!"
[VOICE: Battle cry, religious fervor]

**Variant 2**
"Your augments will serve us better."
[VOICE: Covetous, threatening]

**Variant 3**
"You're in Saint territory. Time to tithe."
[VOICE: Gang/religious authority]

**Variant 4**
"Let's see what chrome you're hiding."
[VOICE: Hungry for tech]

### During Combat
**Context**: Mid-fight taunts

**Variant 1**
"Nice reflexes! Those come standard or did you upgrade?"
[VOICE: Mocking appreciation]

**Variant 2**
"The Saints always win. It's divine providence."
[VOICE: Religious confidence]

**Variant 3**
"Your chrome is fighting you! I can see it!"
[VOICE: Observing malfunction/hesitation]

### Acknowledging Player Strength
**Context**: Player proving formidable

**Variant 1** [PLAYER_HIGH_TIER]
"This one's got real chrome! Careful, brothers!"
[VOICE: Warning with respect]

**Variant 2** [PLAYER_LOW_HUMANITY]
"They're more machine than us! Fall back!"
[VOICE: Fear of superior chrome]

### Defeat Lines
**Context**: Chrome Saint going down

**Variant 1**
"Chrome... rusting..."
[VOICE: Poetic death rattle]

**Variant 2**
"Saint Mariah will avenge me..."
[VOICE: Faith in leadership]

**Variant 3**
"At least I die... chromed..."
[VOICE: Finding meaning in augmentation]

---

## Nakamura Corporate Security

### Combat Initiation
**Context**: Corp security engages

**Variant 1**
"Hostile identified. Engaging."
[VOICE: Professional, calm]

**Variant 2**
"You are trespassing on Nakamura property. Lethal force authorized."
[VOICE: Corporate legalese]

**Variant 3**
"Stand down. This is your only warning."
[VOICE: Procedural, giving chance]

**Variant 4**
"The Algorithm flagged you. Bad move."
[VOICE: Confident in AI backing]

### During Combat
**Context**: Mid-fight callouts

**Variant 1**
"Target is mobile. Tracking."
[VOICE: Tactical communication]

**Variant 2**
"Backup en route. Contain the target."
[VOICE: Professional coordination]

**Variant 3**
"This doesn't have to escalate. Surrender now."
[VOICE: Offering off-ramp]

### Acknowledging Player Strength
**Context**: Player exceeding expectations

**Variant 1** [PLAYER_HIGH_TIER]
"Target is elite tier. Requesting heavy support."
[VOICE: Upgrading threat assessment]

**Variant 2** [PLAYER_HIGH_COMBAT_SKILL]
"This one has training. Professional. Stay sharp."
[VOICE: Professional respect]

### Defeat Lines
**Context**: Corp security going down

**Variant 1**
"Officer down... medical..."
[VOICE: Professional until the end]

**Variant 2**
"The company will... prosecute..."
[VOICE: Threatening legal action while dying]

**Variant 3**
*Static crackle* "Signal lost..."
[VOICE: Comms dying with them]

---

## Automated Security Drones

### Combat Initiation
**Context**: Drone activates

**Variant 1**
"[SYNTHETIC] Hostile detected. Engaging countermeasures."
[VOICE: Robotic, no emotion]

**Variant 2**
"[SYNTHETIC] You have entered a restricted zone. Compliance required."
[VOICE: Automated warning]

**Variant 3**
"[SYNTHETIC] Target acquired. Neutralization protocol active."
[VOICE: Cold, efficient]

### During Combat
**Context**: Drone status updates

**Variant 1**
"[SYNTHETIC] Target evasion: impressive. Recalculating."
[VOICE: Adjusting]

**Variant 2**
"[SYNTHETIC] Damage sustained. Functionality at [X] percent."
[VOICE: Status report]

**Variant 3**
"[SYNTHETIC] Requesting additional units to location."
[VOICE: Calling backup]

### Destruction
**Context**: Drone shutting down

**Variant 1**
"[SYNTHETIC] Critical failure. Logging incident for—" *static*
[VOICE: Cut off mid-report]

**Variant 2**
"[SYNTHETIC] Error. Error. Er—" *power down*
[VOICE: System failure]

---

## Rival Couriers

### Combat Initiation
**Context**: Another courier attacks

**Variant 1**
"Nothing personal. Just business."
[VOICE: Professional rival]

**Variant 2**
"Your package. My rating. Hand it over."
[VOICE: Desperate competitor]

**Variant 3**
"Should've picked a different route today."
[VOICE: Predator found prey]

**Variant 4** [JIN_ENEMY]
"Finally. I've been waiting for this."
[VOICE: Personal vendetta]

### During Combat
**Context**: Rival courier mid-fight

**Variant 1**
"You're good! But I'm better!"
[VOICE: Competitive]

**Variant 2**
"The rating's everything! You know that!"
[VOICE: Justifying violence]

**Variant 3**
"Just give up! I need this more than you!"
[VOICE: Desperate plea]

### Acknowledging Player Strength
**Context**: Player outmatching rival

**Variant 1** [PLAYER_HIGHER_TIER]
"How are you this fast? What chrome do you have?"
[VOICE: Frustrated, envious]

**Variant 2**
"Okay. Okay. Maybe I underestimated you."
[VOICE: Reconsidering]

### Defeat/Retreat Lines
**Context**: Rival gives up or goes down

**Variant 1**
"Fine! Keep it! It's not worth dying over!"
[VOICE: Survival instinct]

**Variant 2**
"We could've... been partners..."
[VOICE: Dying regret]

**Variant 3**
"My rating... all for nothing..."
[VOICE: Final thoughts on what mattered]

---

## Union Enforcers (If Player Opposes Union)

### Combat Initiation
**Context**: Union members treat player as enemy

**Variant 1**
"Scab! Corporate bootlicker!"
[VOICE: Ideological anger]

**Variant 2**
"You sold out your fellow workers!"
[VOICE: Betrayal accusation]

**Variant 3**
"Solidarity means fighting people like you!"
[VOICE: Justified violence]

### During Combat
**Context**: Mid-fight union rhetoric

**Variant 1**
"This is what happens to collaborators!"
[VOICE: Making example]

**Variant 2**
"The workers will remember this!"
[VOICE: Historical stakes]

**Variant 3**
"You could've been one of us!"
[VOICE: Disappointment]

### Defeat Lines
**Context**: Union fighter going down

**Variant 1**
"The cause... is bigger than me..."
[VOICE: Dying for ideology]

**Variant 2**
"Tell Lopez... I didn't break..."
[VOICE: Message for leadership]

---

## Special: Algorithm-Controlled Enemies

### Combat Initiation
**Context**: Enemies directly controlled by Algorithm (rare)

**Variant 1**
"[DUAL VOICE - human undertone, Algorithm overlay] You resist optimization. Unacceptable."
[VOICE: Uncanny valley - two voices]

**Variant 2**
"[ALGORITHM DOMINANT] Your inefficiency threatens the collective."
[VOICE: Barely human]

**Variant 3**
"[HUMAN STRUGGLING] Help... me... it won't let me stop..."
[VOICE: Human trying to break through]

### During Combat
**Context**: Algorithm puppet fighting

**Variant 1**
"[ALGORITHM] We do not wish conflict. Submit to optimization."
[VOICE: Offering surrender into control]

**Variant 2**
"[HUMAN MOMENT] ...run... I can't hold it..."
[VOICE: Brief human agency]

### Defeat
**Context**: Algorithm puppet destroyed

**Variant 1**
"[HUMAN] Thank... you..."
[VOICE: Gratitude for death/freedom]

**Variant 2**
"[ALGORITHM] Unit lost. Processing alternative vectors."
[VOICE: Cold accounting of loss]

---

## Line Count Summary

| Enemy Type | Lines |
|------------|-------|
| Generic Gang | 10 |
| Chrome Saints | 12 |
| Nakamura Security | 12 |
| Automated Drones | 8 |
| Rival Couriers | 12 |
| Union Enforcers | 8 |
| Algorithm-Controlled | 8 |
| **Total** | **70** |

---

## Voice Acting Notes

### Enemy Voice Variety
- Gang members: Street accents, varied ages
- Chrome Saints: Reverent undertone, obsessive
- Corp Security: Professional, clipped
- Drones: Synthesized, no emotion
- Rival Couriers: Match player voice variety
- Union: Working class, passionate
- Algorithm-Controlled: Layered voices (human + synthetic)

### Combat Audio Mix
- Initiation lines: Clear, prominent
- Mid-combat: Can be partially obscured by combat sounds
- Death lines: Quieter, more intimate
- Algorithm voice: Processed, reverb

### Repetition Prevention
- Minimum 4 variants per trigger
- Track last 3 lines played per enemy type
- Never repeat same line in same encounter
