# First Week Jobs - Tier 0 Content

## Purpose
8 procedural job templates for the player's first days as a courier. Simple runs that teach mechanics while establishing world flavor.

---

## JOB 1: THE CLINIC RUN

### Overview
**Source**: Dock Marcus referral
**Client**: Dr. Yusuf (Hollows Free Clinic)
**Type**: Medical delivery
**Difficulty**: Tutorial

### Job Briefing
**Dock Marcus**: "First real job. Nothing fancy. Medical supplies need to get to the Hollows Free Clinic. Doc Yusuf's waiting."

**Chen's Board Notes**:
```
JOB: Medical Supply Delivery
CLIENT: Hollows Free Clinic
PACKAGE: Standard medical kit
PICKUP: Harbor Pharmacy
DROPOFF: Hollows Free Clinic
PAY: 50 credits
NOTES: Time-sensitive. Clinic running low.
```

### Pickup
**Location**: Harbor Pharmacy, counter service
**Scene**: Fluorescent lights, tired pharmacist, stack of packages behind counter.

**Pharmacist**: "Courier for the clinic? [Checks list] Here. Sign—actually, forget signing. Just take it. They need this yesterday."

### Route Options
**Main Route** (Safe, slow):
- Harbor District streets → Checkpoint → Hollows main entrance → Clinic
- Time: ~12 minutes walking
- Risk: Low

**Back Route** (Faster, minor risk):
- Harbor back alleys → Under the overpass → Hollows side entrance → Clinic
- Time: ~8 minutes
- Risk: Possible vagrant encounter

### Dropoff
**Location**: Hollows Free Clinic, intake desk
**Scene**: Crowded waiting room, overworked staff, relief when you arrive.

**Clinic Worker**: "Finally! Dr. Yusuf! The supplies are here!"

**Dr. Yusuf** (if player waits): "Thank you, courier. You don't know how many people this helps. Or maybe you do. Either way—thank you."

### Complications (Optional, Low Probability)
- Pharmacy has wrong package initially (quick fix)
- Checkpoint line causes minor delay
- Vagrant asks for help (moral choice, no real consequence)

### Rewards
- 50 credits
- `FIRST_CLINIC_RUN_COMPLETE` flag
- Chen mentions reliability increased

### Teaching Moments
- Basic pickup/dropoff flow
- Route choice introduction
- Timer awareness (light)

---

## JOB 2: THE FOOD RUN

### Overview
**Source**: Sunny Chen referral
**Client**: Night shift worker
**Type**: Food delivery
**Difficulty**: Tutorial

### Job Briefing
**Sunny**: "You know Mrs. Kwan? Third shift at the recycling plant? She orders every Tuesday. Can't leave her station. I need someone to run it to her. You eat first though!"

**Package**: Hot noodles in thermal container

### Pickup
**Location**: Sunny's cart, Hollows Market
**Scene**: Steam rising, delicious smell, Sunny packing with care.

**Sunny**: "Keep it level! She hates when the soup spills into the noodles. Also—tell her I put extra vegetables. Free. Don't tell anyone else I do that."

### Route
**Single viable route**:
- Hollows Market → Industrial corridor → Recycling Plant rear entrance
- Time: ~10 minutes (food stays hot for 15)
- Risk: Low, well-traveled

### Dropoff
**Location**: Recycling Plant worker entrance
**Scene**: Industrial noise, tired workers, Mrs. Kwan's face lighting up.

**Mrs. Kwan**: "Sunny's noodles! Best part of my week. Here, keep the change. And thank you. Really."

### Complications (Optional)
- Security guard questions you (show food, he waves you through)
- Mrs. Kwan is on break somewhere else (minor search)

### Rewards
- 35 credits + 10 credit tip
- `FOOD_RUN_COMPLETE` flag
- Sunny's relationship +5

### Teaching Moments
- Time-sensitive delivery (gentle timer)
- NPC relationship building
- The human element of courier work

---

## JOB 3: THE DOCUMENT DASH

### Overview
**Source**: Chen's Board
**Client**: Small business owner
**Type**: Document delivery
**Difficulty**: Tutorial

### Job Briefing
**Chen's Board Notes**:
```
JOB: Contract Delivery
CLIENT: Mira's Repairs (small electronics shop)
PACKAGE: Signed contracts
PICKUP: Mira's Repairs
DROPOFF: Business Registry Office, Uptown
PAY: 60 credits
NOTES: Government office closes at 5pm. Sharp.
```

### Pickup
**Location**: Mira's Repairs, Hollows commercial strip
**Scene**: Tiny shop crammed with electronics, stressed owner.

**Mira**: "Oh thank god, you're here. I need these at the registry before five or I lose my business license. I can't leave the shop—please, this is everything."

### Route
**Challenge**: Hollows to Uptown requires checkpoint crossing.

**Options**:
1. Main checkpoint (reliable, possible line)
2. Service tunnel (faster, requires knowing about it)

### Dropoff
**Location**: Business Registry, Uptown government building
**Scene**: Cold bureaucracy, long lines, deadline pressure.

**Registry Clerk**: "Mira's Repairs? [Stamp] Filed with three minutes to spare. Tell her she's good for another year."

### Complications
- Checkpoint line is longer than expected (stress)
- Registry clerk initially can't find the file (resolved quickly)
- Weather turns bad during run

### Rewards
- 60 credits
- `DOCUMENT_DASH_COMPLETE` flag
- Mira becomes potential repeat client

### Teaching Moments
- Hard deadline pressure
- Checkpoint navigation
- Uptown/Hollows contrast

---

## JOB 4: THE NEIGHBOR'S FAVOR

### Overview
**Source**: Vera Okonkwo
**Client**: Vera's friend
**Type**: Personal item delivery
**Difficulty**: Tutorial

### Job Briefing
**Vera**: "I have a favor to ask. Not a job. A favor. My friend Gloria's in the hospital. Her daughter needs some things from Gloria's apartment. Can you bring them?"

**Package**: Bag of personal items (clothes, photos, child's toy)

### Pickup
**Location**: Apartment 2B in player's building
**Scene**: Quiet apartment, key from Vera, someone's life on pause.

**Description**: The apartment is tidy. Gloria expected to come back. Photos on the wall show a woman and her daughter laughing. You pack what Vera listed.

### Route
**Simple run**:
- Player's building → Hollows General Hospital
- No complications, emotional weight is the journey

### Dropoff
**Location**: Hospital waiting area
**Scene**: Antiseptic smell, worried family, a young girl waiting.

**Gloria's Daughter (age ~8)**: "[Sees the bag] That's mama's! Is she—is mama okay?"

**Option A**: "She's going to be fine." (Comfort)
**Option B**: "I don't know. But here are her things." (Honesty)
**Option C**: [Silently hand over the bag] (Distance)

### Complications
- None. This job is about emotional weight, not mechanical challenge.

### Rewards
- No credits (Vera offered, player can refuse)
- `NEIGHBOR_FAVOR_COMPLETE` flag
- Vera relationship +10
- Brief moment with Gloria (if player visits room)

### Teaching Moments
- Courier work isn't always about money
- Choices in dialogue matter
- The community you're part of

---

## JOB 5: THE MARKET SCRAMBLE

### Overview
**Source**: Chen's Board
**Client**: Multiple vendors
**Type**: Multi-stop delivery
**Difficulty**: Tutorial+

### Job Briefing
**Chen's Board Notes**:
```
JOB: Multi-Stop Market Run
CLIENT: Various Hollows Market vendors
PACKAGES: 3 small packages (combined pickup)
DROPOFFS: 3 locations within market area
PAY: 75 credits
NOTES: Efficiency bonus for completing all in 20 minutes.
```

### Pickups
**Location**: Market central depot
**Packages**:
1. Spices → Food court vendor
2. Electronics parts → Repair stall
3. Fabric → Clothing vendor

**Depot Worker**: "Three packages, three stops. Map's on your HUD. Good luck—market's busy today."

### Route Challenge
- All three destinations within Hollows Market
- Market is crowded, paths unpredictable
- Player must optimize route order

### Dropoffs
**Stop 1 - Spice Vendor**: "Ah! Finally! My customers are waiting for this. Thank you!"

**Stop 2 - Repair Stall**: "Parts! Good, good. Been turning customers away all morning."

**Stop 3 - Clothing Vendor**: "Beautiful fabric! Now I can finish my orders. You're a lifesaver."

### Complications
- Market crowd slows movement
- One vendor temporarily away from stall (short wait)
- Possible Sunny interaction mid-route

### Rewards
- 75 credits base
- +25 credits efficiency bonus (if under 20 minutes)
- `MARKET_RUN_COMPLETE` flag

### Teaching Moments
- Multi-stop logistics
- Route optimization
- Market navigation (important area)

---

## JOB 6: THE LATE NIGHT RUN

### Overview
**Source**: Chen's Board (night shift)
**Client**: Anonymous
**Type**: After-hours delivery
**Difficulty**: Tutorial (atmosphere)

### Job Briefing
**Chen** (late night): "This one just came in. Night work pays better. Also lonelier. You up for it?"

**Chen's Board Notes**:
```
JOB: Night Delivery
CLIENT: [Anonymous]
PACKAGE: Sealed box (legal, verified)
PICKUP: Night drop locker, Harbor District
DROPOFF: Residential address, Hollows
PAY: 70 credits (night rate)
NOTES: Quiet work. No complications expected.
```

### Pickup
**Location**: Automated locker station, Harbor District
**Scene**: Empty streets, flickering lights, locker beeping.

**Description**: The streets are different at night. Fewer people, longer shadows. The locker opens with your code. Inside: a sealed box, no markings.

### Route
**Night route**:
- Same paths, different feel
- Streetlights create pools of safety
- Alleys are darker, sounds more pronounced

**Atmosphere Text**:
"The city breathes different at night. Fewer eyes. More ears. You're not alone—you're just more aware of everyone else."

### Dropoff
**Location**: Residential building, Hollows
**Scene**: Sleeping neighborhood, one light on, figure waiting at window.

**Recipient**: [Opens door, takes package silently, nods, closes door]

**Description**: No words needed. The transaction is complete. Payment arrives before you reach the street.

### Complications
- Atmosphere only. No actual threats.
- Optional: vagrant asks for help (continuity from Job 1)

### Rewards
- 70 credits
- `NIGHT_RUN_COMPLETE` flag
- Night jobs unlocked on Chen's board

### Teaching Moments
- Night deliveries exist (different feel)
- Anonymous clients are normal
- The city has moods

---

## JOB 7: THE MECHANICAL PARTS RUN

### Overview
**Source**: Dock Marcus
**Client**: Rosa's shop (before formal introduction)
**Type**: Industrial delivery
**Difficulty**: Tutorial

### Job Briefing
**Dock Marcus**: "Got a load of parts needs to get to a repair shop. Rosa's place. Mechanical stuff. Heavy but legal. You look like you can carry heavy."

**Package**: Mechanical components in shipping crate

### Pickup
**Location**: Dock warehouse
**Scene**: Industrial chaos, workers loading and unloading, your crate waiting.

**Dock Marcus**: "There. That's yours. Careful with it—she's particular about her parts. Don't drop it or you'll hear about it."

### Route
**Industrial route**:
- Docks → Industrial corridor → Rosa's Repairs
- Straightforward, heavy load slows you slightly

### Dropoff
**Location**: Rosa's Repairs (exterior drop)
**Scene**: First glimpse of Rosa's shop. She's busy, assistant handles delivery.

**Rosa's Assistant**: "Parts from the docks? Great. [Checks contents] All here. Rosa! Parts arrived!"

**Rosa** (brief, background): "Finally. Tell whoever brought them they didn't break anything this time. Progress."

**Note**: This is NOT the full Rosa introduction—that happens in main story. This is just glimpsing her world.

### Complications
- Heavy load makes some routes harder
- Rosa's assistant initially busy (short wait)

### Rewards
- 55 credits
- `MECHANICAL_RUN_COMPLETE` flag
- Rosa's shop marked on map

### Teaching Moments
- Heavy packages change movement
- Future characters glimpsed before formal meeting
- Industrial side of the city

---

## JOB 8: THE TEST

### Overview
**Source**: Nine (fixer)
**Client**: Nine
**Type**: Trust evaluation
**Difficulty**: Tutorial (moral)

### Job Briefing
**Nine** (at The Rusty Anchor): "I have a job. Not from the board. From me. Simple delivery. Good pay. Interested?"

**[If player accepts]**

**Nine**: "Take this package. [Small box] Don't open it. Deliver it to this address. Come back. Tell me how it went. That's it."

**Package**: Small sealed box, no visible contents

### Pickup
**Location**: The Rusty Anchor (Nine hands it to you)

**Nine**: "Some advice. Free advice. Questions are good. Sometimes. Wrong questions get wrong answers. Choose your questions carefully."

### Route
**Player's choice**:
- Direct route to address
- Or... open the box first?

### The Choice
**If player opens the box**:
Inside: A note that says "CURIOSITY" and nothing else.

**If player doesn't open the box**:
The box remains sealed.

### Dropoff
**Location**: Empty lot, no one waiting
**Scene**: Address leads to an empty space. No recipient.

**Description**: The address is real. The lot is empty. Overgrown. Abandoned. No one's been here in months.

### Return to Nine
**Nine**: "Delivered? Good. [Waits] What was in the box?"

**If player opened it**:
**Nine**: "Curiosity. [Slight smile] You looked. That's not wrong. But it's something I know now."

**If player didn't open it**:
**Nine**: "You didn't look? [Studies you] Discipline. Or indifference. Either way—something I know now."

**Nine**: "The delivery was the test. There was no recipient. Just me, learning what kind of courier you are. Both kinds are useful. Differently."

### Rewards
- 80 credits (Nine pays regardless)
- `NINE_TEST_COMPLETE` flag
- `NINE_TEST_OPENED` or `NINE_TEST_SEALED` flag
- Sets `NINE_INTEREST_LEVEL = 1`

### Teaching Moments
- Not all jobs are what they seem
- Choices are observed
- Trust is built through tests

---

## JOB SEQUENCING

### Recommended Order
1. Clinic Run (basic mechanics)
2. Food Run (relationships)
3. Document Dash (deadlines)
4. Neighbor's Favor (emotional stakes)
5. Market Scramble (efficiency)
6. Late Night Run (atmosphere)
7. Mechanical Parts Run (future hooks)
8. The Test (deeper world glimpse)

### Availability
- Jobs 1-4 available immediately
- Jobs 5-6 unlock after completing any 3 jobs
- Job 7 unlocks after talking to Dock Marcus
- Job 8 unlocks after meeting Nine and completing any 5 jobs

---

## FLAGS SUMMARY

### Sets
- `FIRST_CLINIC_RUN_COMPLETE`
- `FOOD_RUN_COMPLETE`
- `DOCUMENT_DASH_COMPLETE`
- `NEIGHBOR_FAVOR_COMPLETE`
- `MARKET_RUN_COMPLETE`
- `NIGHT_RUN_COMPLETE`
- `MECHANICAL_RUN_COMPLETE`
- `NINE_TEST_COMPLETE`
- `NINE_TEST_OPENED` / `NINE_TEST_SEALED`
- `TIER_0_JOBS_COMPLETED` (integer counter)

### Unlocks
- Completing all 8: `TIER_0_MASTERY` flag
- Night jobs on Chen's board
- Rosa's shop on map
- Nine as future contact

---

*First Week Jobs v1.0*
*Phase 6 Day 3*
*8 tutorial-tier procedural jobs*
