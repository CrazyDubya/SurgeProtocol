# Early Side Jobs - Tier 1-2 Content

## Purpose
6 mini side-quests for early career couriers. Light stakes, world-building focus, introduces themes that become important later.

---

## SIDE JOB 1: THE RACE

### Overview
**Source**: Hayes (rival courier) challenge
**Type**: Competition
**Tier**: 1
**Stakes**: Credits + reputation

### Setup
**Trigger**: After meeting Hayes twice.

**Hayes**: "You think you're fast? Prove it. Same destination, same deadline. First one there wins. Loser pays double the delivery fee to the winner."

**The Terms**:
- Both couriers receive identical packages
- Same pickup (Hollows Market)
- Same dropoff (Red Harbor Warehouse 7)
- No weapons, no sabotage
- Pure speed and routing

### The Race

**Starting Line** (Hollows Market):
Compass watches from the crowd. Manny offers quick breakfast. The courier giving packages nods: "On my mark... go."

**Route Choices**:
1. **Main Streets** (Safe, moderate speed)
   - Well-lit, crowded, checkpoints
   - Predictable timing

2. **Back Alleys** (Faster, minor risk)
   - Shortcuts, less crowded
   - Possible obstacle encounters

3. **Rooftops** (Fastest, skill-intensive)
   - Requires navigation skill
   - One wrong jump = loss

**Mid-Race Encounter** (Optional):
- Traffic jam blocks main route
- Gang members in alley require bluff or detour
- Loose rooftop panel creates hazard

### Finish

**If Player Wins**:
**Hayes**: "[Panting] You... you actually... [Long pause] Fine. You're fast. Here's your money. Don't get smug about it."

*Hayes's respect increases slightly despite the loss.*

**If Player Loses**:
**Hayes**: "Better luck next time, rookie. [Takes credits] At least you didn't quit."

*Losing doesn't damage reputation—Hayes respects the attempt.*

**If Player Uses Sabotage** (triggered by choice):
**Hayes**: "You—you cheated! That's not—[Stops] No. You know what? That's the job. I should've expected it."

*Hayes relationship drops. Other couriers hear about it.*

### Rewards
**Win**:
- 150 credits (your fee + Hayes's)
- `WON_HAYES_RACE` flag
- Street reputation +5

**Loss**:
- -75 credits (your fee to Hayes)
- `LOST_TO_HAYES` flag
- No reputation loss

**Cheating**:
- 150 credits
- `CHEATED_HAYES_RACE` flag
- Reputation -10 among couriers

### Dialogue After

**Dock Marcus** (if player won): "Heard you beat Hayes in a race. Good for you. Don't let it go to your head. There's always someone faster."

**Compass** (regardless): "I watched! You were so fast! Can you teach me how you took that corner on Fifth?"

---

## SIDE JOB 2: THE LOST PACKAGE

### Overview
**Source**: Random discovery
**Type**: Mystery/Investigation
**Tier**: 1
**Stakes**: Moral choice

### Setup
**Trigger**: While on any routine delivery.

**Discovery**: You find a package in an alley. No courier in sight. No blood—but signs of a struggle. Scuff marks. A broken HUD display. The package is addressed but the delivery code is scratched out.

**The Dilemma**: The package isn't yours. But someone was supposed to deliver it. What happened to them?

### Investigation Path

**Option A: Leave It**
"Not your problem. Could be a trap."
- Walk away
- No consequences
- `LEFT_LOST_PACKAGE` flag

**Option B: Take It**
"Finder's keepers. The original courier isn't finishing this job."
- Deliver to address yourself
- Claim the fee
- Possibly upset whoever attacked the original courier

**Option C: Investigate**
"Someone got hurt. Maybe you can help."
- Follow the trail
- Find the original courier
- Learn what happened

### Investigation Branch

**Following the Trail**:
- Scuff marks lead to nearby clinic
- Original courier (Marco) is there, beaten but alive
- His fee was stolen, package left behind
- Attackers were rival gang trying to intercept a shipment

**Marco**: "They got the money but not the package. Idiots. [Winces] Can you finish the delivery? I'll split the fee with you when I can walk again."

**Player Choices**:
1. "I'll finish it. Keep your half. You need it."
2. "I'll finish it. But I'm keeping the full fee."
3. "I'll finish it. Tell me who attacked you and we'll call it even."

### Outcomes

**Generous Outcome**:
- No credits (gave share to Marco)
- `HELPED_MARCO_COURIER` flag
- Marco becomes contact for future tips
- Street reputation +10

**Practical Outcome**:
- 50 credits
- Marco relationship neutral
- No additional contacts

**Information Outcome**:
- Gang intel (useful later)
- Marco relationship slightly negative
- `KNOW_HARBOR_GANG_ROUTES` flag

### Future Echoes
**Marco** (if helped): "You're the one who finished my run. I owe you. Hear about anything useful, you're my first call."

**Marco** (if took fee): "I remember you. The courier who took my fee when I was bleeding. We're square. That's it."

---

## SIDE JOB 3: THE FAVOR CHAIN

### Overview
**Source**: Sunny Chen (food vendor)
**Type**: Multi-step social chain
**Tier**: 1-2
**Stakes**: Community relationships

### Setup
**Sunny**: "I need a favor. Small one. But it requires... more favors. You know how it is? Help me, and I'll remember it."

**The Request**: Sunny needs cooking supplies from a vendor in Red Harbor. That vendor needs a message delivered to Uptown. The Uptown contact needs a small package retrieved from the Hollows. It's favors all the way down.

### The Chain

**Step 1: Harbor Spices**
- Go to Harbor Market
- Find "Old Man Yun" (spice vendor)
- He gives supplies if you deliver his message

**Old Man Yun**: "These? Sure, for Sunny. But first—take this to my nephew in Uptown. Nothing major. Family stuff."

**Step 2: The Message**
- Travel to Uptown
- Find David Yun (corporate receptionist)
- He'll accept message if you retrieve something for him

**David Yun**: "Uncle's letter? [Sighs] Family drama. Fine. But I need something from the Hollows. A package at my old address. Can you?"

**Step 3: The Package**
- Return to Hollows
- Retrieve package from abandoned apartment
- Package contains: old family photos

**Description**: Inside the package are photos. A family together. Before things got complicated. You understand why David couldn't get them himself.

**Step 4: Complete the Chain**
- Deliver photos to David
- Deliver message to David (from Yun)
- Receive spices from Yun
- Deliver spices to Sunny

### Resolution

**Sunny**: "You did it! All of it? [Laughs] Most couriers quit after the second step. You're something special. Here—your payment. And something extra."

### Rewards
- 100 credits
- `FAVOR_CHAIN_COMPLETE` flag
- Sunny relationship +15
- Old Man Yun becomes Harbor contact
- David becomes Uptown contact
- Compass comments on your "favor running"

### Teaching Moments
- Multi-step quests exist
- Relationships create relationships
- The city is connected in unexpected ways

---

## SIDE JOB 4: THE UNION MEETING

### Overview
**Source**: Sister Grace invitation
**Type**: Story/political choice
**Tier**: 2
**Stakes**: Faction introduction

### Setup
**Grace**: "There's a meeting tonight. Workers talking about conditions, wages, safety. You're welcome to listen. No pressure. But if you want to understand what we're about... this is how."

**The Invitation**: Attend a union organizing meeting. No action required. Just observe.

### The Meeting

**Location**: Community center basement
**Atmosphere**: Thirty workers. Mixed ages. Tired faces. Hope and skepticism in equal measure.

**Speakers**:

**Factory Worker Maria**: "They cut our breaks again. Third time this year. Said it was 'efficiency.' You know what's efficient? Humans treated like humans."

**Dock Worker Sam**: "We lost another guy last month. Safety violation. Company called it 'operator error.' Operator was working his second shift in a row. They required it."

**Young Tech Worker**: "I know I have it better than most of you. But even we're getting squeezed. Contracts that say we can't unionize. Can't even discuss wages with each other."

**Grace** (closing): "This is what we face. Every day. But together—together we have power. They can't fire all of us. They can't ignore all of us."

### Player's Role

**Options During Meeting**:
1. **Listen silently** - Take it in, process
2. **Ask questions** - Engage with speakers
3. **Share your experience** - Connect as courier
4. **Leave early** - Not for you

### Outcomes

**If listened or engaged**:
**Grace**: "Thank you for coming. I saw you listening—really listening. That's rare. When you're ready to do more than listen... the door's open."

- `UNION_MEETING_ATTENDED` flag
- `UNION_INTEREST_LEVEL += 1`
- Introduction to Lopez available at Tier 3

**If shared experience**:
**Grace**: "You see it too. The same struggle, different uniform. You'd make a good organizer. Think about it."

- Above plus `UNION_POTENTIAL_ORGANIZER` flag
- Lopez specifically asks to meet you

**If left early**:
- No flags
- Grace doesn't mention it
- Meeting available again later

### No Combat
This is a social quest. No fighting. No running. Just understanding.

---

## SIDE JOB 5: PATCH'S PROBLEM

### Overview
**Source**: Patch (black market tech dealer)
**Type**: Time-sensitive retrieval
**Tier**: 2
**Stakes**: Tech access + relationship

### Setup
**Patch**: "Okay, so, um, I need help. Urgently. There's a shipment coming in—my shipment—and the pickup got compromised. I can't go myself. Too hot. But if that shipment doesn't get retrieved..."

**The Situation**: Corporate security identified one of Patch's supply routes. The shipment is still there, but if someone doesn't grab it in the next hour, they'll confiscate everything.

### The Job

**Location**: Harbor warehouse, section C
**Window**: 60 minutes real-time (or 45 for bonus)
**Obstacles**:
- Corporate security patrol (avoidable)
- Locked container (code provided)
- Heavy package (slows return trip)

### Approach Options

**Stealth Approach**:
- Time the patrols
- Move between cover
- Avoid all contact
- Slower but safer

**Bluff Approach**:
- Fake work order (Patch provides)
- Walk in like you belong
- Risk: security might check

**Speed Approach**:
- Rush in, grab package, run
- Fastest
- Risk: almost certainly triggers pursuit

### Outcomes

**Success (any method)**:
**Patch**: "You got it! You actually got it! [Hugs package] This is my whole month's inventory. I owe you. I really owe you."

- 150 credits
- `PATCH_SHIPMENT_SAVED` flag
- Patch offers 20% discount on all purchases
- Access to "special inventory" later

**Success under 45 minutes**:
Above plus:
- Extra 50 credits
- `PATCH_IMPRESSED` flag

**Failure**:
**Patch**: "They got it? All of it? [Deflates] It's... it's fine. I'll rebuild. Thanks for trying. I mean it."

- No credits
- Patch remains friendly (you tried)
- No special access

**Captured by Security**:
- Package confiscated
- Player detained briefly
- Small fine (50 credits)
- Patch relationship remains (wasn't your fault)

### Post-Mission

**If Successful**:
**Patch** (later): "Because of you, I'm still in business. Here—take this. Prototype HUD upgrade. On the house. First of many thank-yous."

*Free tech item*

---

## SIDE JOB 6: COMPASS'S REQUEST

### Overview
**Source**: Compass (street kid guide)
**Type**: Mentorship moment
**Tier**: 2
**Stakes**: Relationship + small payoff

### Setup
**Compass**: "[Nervous] Hey. So. I have a job. A real job. First one. But I've never done a delivery by myself. And I thought... maybe... could you come with me? Not to do it for me! Just... in case?"

**The Request**: Compass has their first courier job. They want the player to shadow them—provide backup if needed, but let them do the work.

### The Job

**Compass's Package**: Small data chip
**Pickup**: Hollows Market (familiar territory)
**Dropoff**: Harbor District (unfamiliar for Compass)

### Shadowing

**Following Compass**:
The player trails at a distance, watching Compass navigate.

**Moments**:

**1. Wrong Turn**
Compass takes a wrong turn. Gets nervous.

**Options**:
- Signal correct direction (subtle help)
- Let them figure it out (builds confidence)
- Intervene directly (undermines them)

**2. Checkpoint Encounter**
Guard asks Compass for ID. Compass freezes.

**Options**:
- Step in with distraction
- Send encouraging text
- Let them handle it

**3. Near-Miss**
Compass almost bumps into someone suspicious.

**Options**:
- Warn them
- Create distraction
- Trust them

### Outcomes

**If Player Helped Minimally**:
**Compass** (after): "I did it! I really did it! [Beaming] And you barely helped! That means I can do this. I can really do this!"

- `COMPASS_FIRST_DELIVERY` flag
- Compass relationship +15
- Compass starts offering better shortcuts

**If Player Over-Helped**:
**Compass**: "Thanks for... [trails off] I mean, you basically did it, right? I couldn't have done it alone."

- Compass relationship +5
- Less confidence boost

**If Player Let Compass Fail** (possible):
**Compass**: "[Crying] I screwed up. I knew I would. I'm not cut out for this."

- `COMPASS_FIRST_FAILURE` flag
- Compass relationship -5
- Player can encourage them to try again

### Resolution

**Compass** (if succeeded): "I'm gonna save up. Get real gear. Be a real courier. Like you. Maybe better than you. No offense."

**Compass** (giving thanks): "Here. It's not much. But I want you to have it. For believing in me."

*Small payment from Compass's earnings (20 credits)*

### Teaching Moments
- Mentorship matters
- Letting people fail can be necessary
- Building community > building credits

---

## FLAGS SUMMARY

### Sets
- `WON_HAYES_RACE` / `LOST_TO_HAYES` / `CHEATED_HAYES_RACE`
- `LEFT_LOST_PACKAGE` / `HELPED_MARCO_COURIER` / `KNOW_HARBOR_GANG_ROUTES`
- `FAVOR_CHAIN_COMPLETE`
- `UNION_MEETING_ATTENDED` / `UNION_POTENTIAL_ORGANIZER`
- `PATCH_SHIPMENT_SAVED` / `PATCH_IMPRESSED`
- `COMPASS_FIRST_DELIVERY` / `COMPASS_FIRST_FAILURE`

### Relationship Changes
- Hayes: Variable based on race outcome
- Marco: New contact if helped
- Sunny: +15 from favor chain
- Grace/Union: Interest increased
- Patch: +20 and discount if saved
- Compass: +15 if mentored well

---

*Early Side Jobs v1.0*
*Phase 6 Day 4*
*6 mini-quests for Tier 1-2*
