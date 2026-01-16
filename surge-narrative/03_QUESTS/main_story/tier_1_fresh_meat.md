# Tier 1: Fresh Meat

## Metadata
- **Quest ID**: MAIN_T1_FRESH_MEAT
- **Type**: MAIN_STORY (Linear Progression)
- **Tier Availability**: 1
- **Required Tier**: 1 (50 rating points from Tier 0)
- **Estimated Duration**: 30-40 minutes
- **Repeatable**: No

## Prerequisites
- **Required Quests Completed**: "Tier 0: First Run"
- **Faction Reputation**: None
- **Story Flags**: None
- **Tier Minimum**: 1
- **Items Required**: None

## Quest Giver
- **NPC Name**: Dispatcher Chen
- **Location**: The Hollows Courier Station
- **Initial Dialogue Tree**: `/02_DIALOGUE_TREES/conditional_branches/tier_1_progression.md`

## Synopsis

**You made it to Tier 1. That's better than most rookies. Chen says maybe you'll last a month. But now the real competition begins.**

**You're not the only fresh courier grinding for survival. Meet Jin—another Tier 1, hungry, aggressive, and willing to cut corners you won't. When a high-value contract appears, you both want it. Chen gives it to whoever performs better on a test run.**

**This is the gig economy: There's never enough for everyone. Someone has to lose.**

This quest establishes:
- **Rating competition** (other couriers exist, they're threats)
- **Rival character** (Jin, recurring antagonist/frenemy)
- **Moral gray areas** (cutting corners vs. staying clean)
- **Scarcity mindset** (not enough contracts for everyone)

## Objectives

### Primary Objective:
1. **Complete test delivery faster than rival courier Jin**
2. **Impress Chen enough to get the premium contract**

### Secondary Objectives:
3. **Maintain package integrity** (no damage = bonus)
4. **Don't violate traffic laws** (optional, affects reputation)

### Optional Objectives:
5. **Learn about Jin's background** (talk to Rosa, who knows everyone)
6. **Help Jin when they get in trouble** (moral choice)

### Hidden Objectives:
7. **Notice Jin is augmented** (they have reflex boosters, you don't—sets up chrome pressure)

## Narrative Beats

### Act 1: Setup - "Competition"

**Hook**: Chen calls you in. "Got a premium contract. Corp client, regular deliveries, great pay. But I can only give it to one courier. You and Jin are both Tier 1. You both want it. So race."

**Context**:
- Player has been doing standard runs since Tier 0
- First encounter with another named courier
- Chen explains: "This is the life. Not enough work for everyone. Someone gets ahead, someone falls behind."

**Meet Jin** (Rival Introduction):
- **Jin**: Young (early 20s), cocky, visibly augmented (reflex boosters, enhanced eyes)
- **Attitude**: Dismissive. "You're still meat-only? Good luck keeping up."
- **Background**: Been a courier for 6 months, already Tier 1 through aggressive tactics

**Chen's Test**:
"Both of you take the same package type to the same destination. Whoever arrives first with package intact gets the contract. Simple. Fair."

[not actually fair—Jin has augments, player doesn't]

**PLAYER OPTIONS**:
- "I can beat them." [CONFIDENT] → Chen: "Good. Prove it."
- "That's not fair. They have chrome." [COMPLAINING] → Chen: "Life's not fair. Deal with it."
- "What if we both do well?" [OPTIMISTIC] → Chen: "There's one contract. One winner. That's how this works."

---

### Act 2: Complication - "The Race"

**The Test Delivery**:
- Both player and Jin get packages
- Same destination: Night Market (familiar route from Tier 0)
- Jin leaves immediately, aggressively
- Player can choose approach

**PLAYER CHOICES**:

**Option A: Drive Safe (High Integrity)**:
- Follow traffic laws, protect package
- Slower, but arrives with perfect package condition
- Chen approves professionalism
- Likely arrives second (Jin faster due to chrome + risk-taking)

**Option B: Drive Aggressive (Speed Priority)**:
- Cut corners, speed, risky maneuvers
- Faster, but package may take damage
- Risk of police attention
- Might beat Jin, might crash

**Option C: Sabotage Jin (Underhanded)**:
- Actively interfere with Jin's run (hack route, create obstacles)
- Requires tech skill or street smarts
- Morally gray, but effective
- Chen finds out? Consequences.

---

**THE COMPLICATION** (Mid-Race Event):

**Jin Crashes**: Halfway through the race, player sees Jin's vehicle crash (avoiding obstacles, took too many risks)

**Jin is injured, package damaged, vehicle smoking**

**PLAYER MUST CHOOSE** (Timed Decision):

1. **Stop and Help Jin**:
   - Check on them, call medical
   - Lose race (Jin delivers late or not at all, but you also arrive late)
   - Humanity +5 (compassion under pressure)
   - Jin remembers this (future impact)
   - Chen respects humanity, gives contract anyway (impressed by character)

2. **Keep Going, Win Race**:
   - Don't stop, deliver on time
   - Win race by default (Jin can't complete)
   - Humanity -2 (left someone injured)
   - Jin resents you (future antagonist)
   - Chen gives you contract (you won, technically)

3. **Call Rosa to Help, Then Continue**:
   - Quick call to Rosa: "Jin crashed at [location], can you check on them?"
   - Rosa helps Jin, you continue
   - Arrive on time (win race)
   - Humanity neutral (pragmatic compassion)
   - Jin neutral relationship (you helped, but also won)
   - Chen impressed by problem-solving

---

### Act 3: Resolution - "First Real Choice"

**Post-Race** (Chen's Office):

**IF PLAYER HELPED JIN**:

**CHEN**: "You stopped. You helped a competitor. That's... not what most do."

[pause]

"The contract's yours. Not because you won. Because I can trust you with premium clients. They need reliability, not just speed."

**JIN** (arrives later, bandaged):
"You... you stopped for me. Why?"

**PLAYER OPTIONS**:
- "Anyone would've." [HUMBLE] → Jin: "No. They wouldn't. Thanks."
- "Didn't want your death on my conscience." [PRAGMATIC] → Jin: "Fair. I owe you."
- "We're not enemies. We're both just trying to survive." [SOLIDARITY] → Jin: "Yeah. Yeah, we are."

**Relationship**: Jin +20 (potential ally/friend)
**Sets flag**: JIN_SAVED

---

**IF PLAYER WON BY DEFAULT**:

**CHEN**: "You won. Jin crashed, couldn't deliver. Contract's yours."

[looks at you]

"You could've stopped. You didn't. That's the choice you made."

**PLAYER OPTIONS**:
- "I had a job to do." [DEFENSIVE] → Chen: "Yeah. You did."
- "I called it in." [LIE, if didn't] → Chen: "No you didn't. I checked."
- "Would you have stopped?" [DEFLECTING] → Chen: "I'm not sure anymore."

**JIN** (shows up later, bitter):
"You left me there. I could've died."

**PLAYER OPTIONS**:
- "This is a competition. You'd have done the same." [COLD] → Jin: "Probably. Doesn't mean I won't remember."
- "I'm sorry." [APOLOGETIC] → Jin: "Not enough. Watch your back."

**Relationship**: Jin -15 (future antagonist)
**Sets flag**: JIN_ABANDONED

---

**IF PLAYER CALLED ROSA**:

**CHEN**: "You won. But you also called Rosa to help Jin. Smart. You got what you wanted and didn't leave a body in the street."

**ROSA** (comms in):
"Jin's okay. Banged up, but stable. Appreciate the call."

**JIN** (later):
"Heard you called for help. While winning. Efficient. I respect that."

**Relationship**: Jin +5 (neutral, professional respect)
**Sets flag**: JIN_PRAGMATIC_HELP

---

**THE PREMIUM CONTRACT**:

Chen hands over the contract details:
- **Client**: Meridian Medical (corpo subsidiary)
- **Deliveries**: Weekly medical supplies, high value, strict deadlines
- **Pay**: 300 credits per run (double standard)
- **Catch**: Client has high standards, one screw-up and you're blacklisted

**CHEN**: "This is a step up. Don't screw it. You screw this, you don't just lose a client—you get a reputation as unreliable. Then everyone drops you."

"Welcome to Tier 1. It doesn't get easier. You just get better. Or you get crushed."

---

## Branching Paths

### Path A: Helped Jin (Compassionate)
- **Outcome**: Premium contract earned through character, not just speed
- **Humanity**: +5
- **Jin Relationship**: +20 (potential ally)
- **Chen Relationship**: +10 (respects your values)
- **Flag**: JIN_SAVED

### Path B: Abandoned Jin (Ruthless)
- **Outcome**: Premium contract earned through winning
- **Humanity**: -2
- **Jin Relationship**: -15 (resentment, future antagonist)
- **Chen Relationship**: +0 (neutral, you did the job)
- **Flag**: JIN_ABANDONED

### Path C: Called Rosa (Pragmatic)
- **Outcome**: Premium contract earned through smart problem-solving
- **Humanity**: 0 (neutral action)
- **Jin Relationship**: +5 (professional respect)
- **Chen Relationship**: +8 (impressed by efficiency)
- **Flag**: JIN_PRAGMATIC_HELP

---

## Complications

**Traffic Jam** (Minor):
- Forces player to choose: wait (lose time) or illegal detour (risk)

**Police Checkpoint** (if driving aggressively):
- Bribe, evade, or comply (time penalty)

**Package Damage** (if aggressive driving):
- Arrives damaged, Chen deducts rating points

---

## Rewards

### All Paths
- **Credits**: 200 (test delivery payment)
- **XP**: 100
- **Rating**: +0.2-0.4 stars (depending on performance)
- **Unlocks**: Premium contract (Meridian Medical), Tier 2 progression

### Path-Specific
- **Compassionate**: Humanity +5, Jin as ally
- **Ruthless**: Jin as rival/antagonist
- **Pragmatic**: Chen's respect, balanced approach

---

## Consequences

### Short-Term
- **Premium Contract**: Better pay, but higher pressure
- **Jin Relationship**: Set for rest of game (ally, enemy, or neutral)
- **First Moral Choice**: Showed player's values (help vs. win)

### Long-Term
- **Jin's Arc**: If saved, becomes ally. If abandoned, becomes antagonist (may sabotage you later)
- **Chen's Perception**: Sees what kind of courier you are
- **Reputation**: Word spreads (helped competitor = soft? or reliable?)

---

## Dialogue References

**Quest Intro**: `/02_DIALOGUE_TREES/conditional_branches/tier_1_test_race.md`
**Jin Introduction**: `/02_DIALOGUE_TREES/conversation_topics/jin_rival_first_meeting.md`
**Crash Decision**: `/02_DIALOGUE_TREES/conditional_branches/jin_crash_choice.md`
**Quest Complete**: `/02_DIALOGUE_TREES/conversation_topics/chen_tier_1_contract.md`

---

## Technical Notes

**Locations**: The Hollows Station, standard delivery route to Night Market, Jin crash site
**NPCs**: Chen (quest giver), Jin (rival), Rosa (optional helper)
**Mechanics**: Timed race, crash event (scripted), moral choice (timed)
**Items**: Test package, premium contract document

---

## Narrative Function

This quest serves as:
1. **Competition Introduction**: Not all couriers are allies
2. **First Moral Choice**: Help vs. win (establishes player values)
3. **Jin Relationship Setup**: Recurring character introduced
4. **Chrome Pressure Begins**: Jin has augments, you don't (sets up Tier 3 choice)
5. **Rating Stakes**: High-value contracts have high-value consequences

**The central question**: *When survival is a competition, do you help someone who might take your place?*

---

## Writing Notes

### Jin's Character
- Not evil, just desperate (like player)
- Augmented out of necessity, not choice
- Respects strength and smart play
- Can become genuine friend if player shows character
- OR bitter rival if player shows ruthlessness

### Chen's Reaction
- Tests player's values, not just speed
- Already knows who'll win (Jin has chrome)
- Wants to see if player will do the right thing under pressure
- Disappointed if player abandons Jin (reminds him of couriers who lost themselves)

### Tone
- Competition, but not cruelty
- Scarcity breeds conflict (system's fault, not individuals')
- First glimpse of "not everyone makes it"

---

## Related Content
- Previous: "Tier 0: First Run"
- Next: "Tier 2: Provisional"
- Character: Dispatcher Chen
- Character: Jin (rival courier) - to be created
- Complication: Vehicle Crash - `/04_COMPLICATIONS/environmental/vehicle_crash.md`
