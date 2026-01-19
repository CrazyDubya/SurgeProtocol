# Tier 0 General NPCs

## Purpose
Supporting characters for the tutorial tier. These NPCs populate the player's first days as a courier, providing variety beyond Chen and establishing the world's texture.

---

## NPC 1: MARCUS "DOCK" REEVES

### Basic Information
**Role**: Dock Worker / First Job Contact
**Location**: Red Harbor Loading Docks
**Age**: 52
**Appearance**: Weathered face, loading exoskeleton permanently attached to spine, union tattoo faded on forearm.

### Background
Twenty-eight years loading cargo. Seen everything come through these docks—legal, illegal, and things that defy classification. Knows every courier by reputation. Gives rookies their first real taste of the work.

### Personality
- **Gruff but fair**: Doesn't sugarcoat, but doesn't sabotage either
- **Union loyal**: Believes in solidarity, fair wages, honest work
- **Observant**: Notices everything, says little
- **Protective**: Warns rookies about dangers without coddling them

### Speech Pattern
Short sentences. Working-class dialect. Drops articles. Punctuates with physical gestures.

### Key Dialogue

**First Meeting**:
"You the new one? Chen's rookie? [Looks you over] Seen worse. Seen better. Mostly seen worse."

"First job's waiting. Nothing fancy. Move a crate from here to the clinic. Simple. Should be."

**Job Briefing**:
"Package needs to reach Doc Yusuf. Medical supplies. Nothing gray about it. Pure clean work."

"Route's your choice. Main streets are safe but slow. Back alleys are fast but... less safe. Your call. Always your call."

**On Completion**:
"Made it back. Package delivered. Doc confirms. [Nods] Not bad. You might last a week."

"Here's your cut. Fair rate. Always fair rate from me. Can't say that about everyone."

**Advice Lines**:
"This work'll test you. Not the running. The choices. What you carry. Who you carry for. That's the test."

"Chen's good people. Best dispatcher in the business. You listen to her, you'll learn. You ignore her, you'll learn harder."

"Saw your type before. Eager. Think speed's everything. Speed's nothing if you're running the wrong direction."

**Recurring Interaction**:
"Back again? Good. Means you're still breathing. Got another run if you want it."

"Word gets around. You're building a name. Small name. But names start small."

### Story Flags
**Sets**:
- `MET_DOCK_MARCUS`
- `FIRST_DOCK_JOB_COMPLETE`
- `DOCK_JOBS_COMPLETED` (integer)

**Checks**:
- `TIER == 0` (primary availability)
- `DOCK_JOBS_COMPLETED >= 3` (unlocks advice lines)

### Voice Direction
**Tone**: Working-class patriarch. Tired but not broken.
**Accent**: Harbor district, slight maritime influence.
**Pace**: Measured. Never rushed. Words cost energy.
**Reference**: Think longshoreman who's seen too much to be surprised anymore.

---

## NPC 2: SUNNY CHEN (No Relation)

### Basic Information
**Role**: Street Food Vendor / Gossip Source
**Location**: Hollows Market, Mobile Cart
**Age**: 34
**Appearance**: Bright smile contradicting tired eyes, food-stained apron, prosthetic left hand (cheap model, obvious seams).

### Background
Came to the city five years ago. Lost her hand in a factory accident. Couldn't afford quality chrome, couldn't get corporate insurance. Now she sells noodles and hears everything. Everyone talks to the food vendor.

### Personality
- **Cheerful surface**: Masks deeper worries with constant positivity
- **Information broker**: Trades gossip as readily as noodles
- **Survivor**: Does what it takes to get through each day
- **Generous**: Feeds people who can't pay, when she can afford to

### Speech Pattern
Rapid, friendly, jumps between topics. Uses food metaphors. Deflects personal questions with offers of more food.

### Key Dialogue

**First Meeting**:
"New face! New faces mean new customers! You hungry? Everyone's hungry. Sit, sit. First bowl's half price for couriers. Chen's people get discounts. Different Chen. No relation!"

**Information Trading**:
"You want to know what's happening in the Hollows? Talk to me. I hear everything. The noodles make people talk. Or maybe it's the prices. Either way—I know things."

"That route you're taking? Heard there's trouble on Fifth. Gang stuff. Maybe go around. Unless you like trouble. Some people like trouble. More noodles?"

**On the City**:
"The Hollows isn't pretty. But it's honest. Everyone here is struggling together. Uptown? They struggle alone. In nicer buildings. With better chrome. Still alone though."

"You want advice? Don't trust anyone who won't eat street food. If they think they're too good for noodles, they think they're too good for you."

**Personal Moments** (Higher relationship):
"The hand? [Wiggles prosthetic] Factory job. Before the cart. Safety regulations cost money. I cost less than regulations. Now I cost even less. But I'm still here. And I make excellent noodles."

"I had plans, you know. Before. Everyone has befores. The trick is having afters too."

**Recurring Interaction**:
"You again! Good, good. Usual order? I remember. I always remember. Eat, eat. Then tell me what you've seen today."

### Story Flags
**Sets**:
- `MET_SUNNY_VENDOR`
- `SUNNY_GOSSIP_COUNT` (integer)
- `SUNNY_FED_FREE` (if player can't pay)

**Checks**:
- Appears in Hollows Market
- `SUNNY_GOSSIP_COUNT >= 5` unlocks personal dialogue

### Voice Direction
**Tone**: Relentlessly upbeat, covering old pain.
**Accent**: Immigrant background, precise grammar but unusual rhythm.
**Pace**: Fast, energetic, trails off when topics get personal.
**Reference**: The person at the food truck who knows everyone's name.

---

## NPC 3: TOMAS VEGA

### Basic Information
**Role**: Fellow Rookie Courier / Peer NPC
**Location**: Various (crosses paths with player)
**Age**: 19
**Appearance**: Young, nervous, too-new gear, constantly checking his route on cheap HUD glasses.

### Background
Started the same week as the player. Different dispatcher, different routes, same tier. Equally lost. Potential rival, potential ally, definitely relatable.

### Personality
- **Anxious**: Second-guesses everything, expects disaster
- **Competitive**: Wants to prove himself, measures against others
- **Decent**: Not a bad person, just scared
- **Growing**: Changes based on how player interacts with him

### Speech Pattern
Fast when nervous (often). Lots of qualifiers and hedging. Apologizes frequently. Occasionally shows confidence when things go right.

### Key Dialogue

**First Meeting** (crossing paths on a delivery):
"Oh! You're—you work for Chen too? No wait, different Chen. I mean—I work for Dispatcher Yamoto. I'm Tomas. Vega. Tomas Vega. I started last week. You?"

"This isn't as easy as they said, is it? The job. I keep getting lost. The maps are wrong. Or I'm wrong. Probably I'm wrong."

**Competitive Lines**:
"Did you get the Harbor run? I wanted that one. Supposed to be easy money. Not that I—I mean, good for you. I got the Uptown service entrance job. It's fine. It's probably fine."

"I heard you finished that job faster than anyone expected. That's... good. Great. I'll be faster next time. Not that it's a race. Except it kind of is."

**Collaborative Lines** (if player is friendly):
"Hey, I've got a tip. That route through Sector 7? There's a shortcut. Found it yesterday. Almost got killed finding it, but—here. [Shares route data] Don't tell anyone I told you."

"Maybe we could... work together sometime? Split the risk, split the pay? Just a thought. Forget it if it's stupid."

**Struggling Lines**:
"I don't know if I'm cut out for this. Everyone else seems to know what they're doing. I'm just... faking it. Badly."

"Do you ever feel like you're going to mess up everything? All the time? Is that normal?"

**Later Appearances** (if player helped):
"Hey! I survived another week. Partly because of you. That shortcut—saved my ass twice. I owe you."

**Later Appearances** (if player was competitive):
"Oh. It's you. I'm doing fine, thanks for asking. Even though you didn't ask. I finished tier 1 requirements yesterday. Just so you know."

### Story Flags
**Sets**:
- `MET_TOMAS_ROOKIE`
- `TOMAS_RELATIONSHIP` (integer: -20 to +20)
- `HELPED_TOMAS` / `COMPETED_TOMAS`

**Checks**:
- `TIER == 0` (primary)
- `TIER == 1` (secondary, checking in)
- `TOMAS_RELATIONSHIP >= 10` for collaborative options

### Voice Direction
**Tone**: Nervous energy, trying too hard.
**Accent**: Standard city, younger generation.
**Pace**: Too fast when anxious, steadier when confident.
**Reference**: The new kid at work who reminds you of your first day.

---

## NPC 4: VERA OKONKWO (No Relation to Solomon)

### Basic Information
**Role**: Building Super / Safe House Contact
**Location**: Player's Building (Hollows Residential)
**Age**: 61
**Appearance**: Silver locs, maintenance coveralls, reading glasses on chain, tool belt worn smooth from decades of use.

### Background
Manages the building where new couriers often stay. Knows every code violation, every hidden corner, every tenant's business. Provides unofficial sanctuary for those who need to lay low.

### Personality
- **Maternal authority**: Cares deeply, shows it through strictness
- **Pragmatic**: Knows how the world works, works within it
- **Connected**: Knows people, knows things, says little
- **Protective**: Her building, her people, her rules

### Speech Pattern
Deliberate, weighted words. Knows what she means and says exactly that. Occasional warmth breaking through sternness.

### Key Dialogue

**First Meeting**:
"You're the new tenant. Unit 4C. Chen mentioned you might come. [Looks you over] You look like you need sleep more than a speech. Key's in the lockbox. Code is 4471. Don't lose it."

"My building, my rules. No fighting in the halls. No deals in the lobby. No questions about other tenants. We clear?"

**Building Information**:
"There's a back exit. Basement, through the maintenance tunnel. For emergencies. You didn't hear about it from me. Because I never told you."

"The walls are thin. Sound travels. Remember that before you have conversations you don't want overheard."

**Warnings**:
"Saw some suits asking about new tenants yesterday. Corporate types. Said they were doing census work. Census doesn't wear body armor under their jackets. Watch yourself."

"Your neighbor in 4B hasn't been home in three days. Not my business. Not yours either. But if anyone asks—you never saw them."

**Supportive Lines**:
"You look like hell. Rough job? [Doesn't wait for answer] There's soup in the community kitchen. Fourth floor. Still warm. Eat something. Then sleep."

"I've seen a lot of couriers come through here. The ones who last? They know when to run and when to rest. You look like you only know how to run."

**Personal Moment** (higher relationship):
"I wasn't always a building super. Before, I was... different. We all were. The city changes us. Trick is choosing how you change. Not letting it choose for you."

### Story Flags
**Sets**:
- `MET_VERA_SUPER`
- `VERA_SAFE_HOUSE_KNOWN`
- `VERA_RELATIONSHIP` (integer)

**Checks**:
- Always available in player's building
- `VERA_RELATIONSHIP >= 15` for personal dialogue
- `BEING_PURSUED` flag triggers safe house offer

### Voice Direction
**Tone**: Firm but caring. The voice of earned authority.
**Accent**: Hollows native, older generation's diction.
**Pace**: Never rushed. Every word intentional.
**Reference**: The grandmother who ran her household like a general.

---

## NPC 5: "NINE" (Real Name Unknown)

### Basic Information
**Role**: Local Fixer / Bigger World Hint
**Location**: Hollows Bar "The Rusty Anchor"
**Age**: Late 30s (hard to tell)
**Appearance**: Forgettable face, changes clothes constantly, always has exactly the right gear for the situation.

### Background
Low-level fixer. Connects people who need things with people who have things. Deliberately mysterious, partly for reputation, partly for safety. Gives rookie couriers their first glimpse of the bigger game.

### Personality
- **Calculating**: Always assessing, measuring, pricing
- **Guarded**: Reveals nothing personal, redirects constantly
- **Mentor-adjacent**: Drops hints about how the real game works
- **Testing**: Every interaction is an evaluation

### Speech Pattern
Ambiguous. Questions more than statements. Lets silence do work. Uses "maybe" and "perhaps" constantly.

### Key Dialogue

**First Meeting**:
"New courier. Chen's. [Slight nod] I hear things. Don't worry about what I hear. Worry about what you tell me. Or don't. Your choice."

"You can call me Nine. Not my name. Doesn't matter. Names are for people who stay in one place."

**Introducing the Bigger Game**:
"You're moving packages. Good. That's level one. There's more levels. Higher pay. Higher stakes. Maybe you'll see them. Maybe you won't want to."

"Chen's jobs are clean. Mostly. That's good for now. But clean doesn't pay like gray. Gray doesn't pay like dark. Something to think about. Or not."

**Testing the Player**:
"I have something that needs moving. Not through official channels. Pay's good. Risks... exist. You interested? [Regardless of answer] Interesting. That tells me something."

"If I needed someone to forget a face they saw, could you forget? [Waits] See, that pause told me everything. Both answers would have. Different things."

**Cryptic Hints**:
"The Algorithm. You've heard of it. [Statement, not question] Everyone's heard of it. Few understand it. Fewer control it. None own it. Remember that."

"There's people above the corps. Above the gangs. They don't have names you'd know. But they know your name. Or they will. If you keep climbing."

**Recurring Interaction**:
"Still alive. Still climbing. [Almost approving] Keep coming back. We'll talk again. When you're ready for different conversations."

### Story Flags
**Sets**:
- `MET_FIXER_NINE`
- `NINE_INTEREST_LEVEL` (integer)
- `NINE_TEST_PASSED` / `NINE_TEST_FAILED`

**Checks**:
- Found in The Rusty Anchor, evening hours
- `TIER >= 1` for test offer
- `NINE_INTEREST_LEVEL >= 3` for deeper hints

### Voice Direction
**Tone**: Controlled. Never more emotion than necessary.
**Accent**: Deliberately neutral, placeless.
**Pace**: Pauses mean things. Silences mean more.
**Reference**: The person in the spy movie who might be anyone.

---

## INTERACTION WEB

### Connections Between NPCs
- **Dock → Sunny**: He gets lunch from her cart. She gets dock gossip from him.
- **Sunny → Vera**: Old friends. Sunny feeds tenants Vera sends her way.
- **Vera → Nine**: She knows what he does. He respects her boundaries.
- **Nine → Dock**: Nine moves things through the docks. Dock pretends not to notice.
- **Tomas → All**: New enough to be dismissed. Observant enough to notice patterns.

### Mentor Hierarchy (for player)
1. **Chen**: Primary mentor, official
2. **Dock**: Work ethic, practical skills
3. **Vera**: Survival, rest, sanctuary
4. **Sunny**: Information, community, humanity
5. **Nine**: Ambition, danger, future glimpses

---

## IMPLEMENTATION NOTES

### Availability
- All NPCs available from Tier 0
- Some dialogue gates behind relationship levels
- Nine's deeper content gates behind Tier 1+

### Cross-Reference
- These NPCs should be referenced in ambient dialogue
- Can appear in procedural job variations
- Should be mentioned by Chen occasionally

### Future Hooks
- Dock connects to union storyline (Lopez arc)
- Vera may have Okonkwo connection (family? neighborhood?)
- Nine can become fixer contact in later tiers
- Tomas's fate can vary based on player relationship

---

*Tier 0 Tutorial NPCs v1.0*
*Phase 6 Day 3*
*5 characters establishing world texture*
