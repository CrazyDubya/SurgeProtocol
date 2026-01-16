# Tier 0: First Run

## Metadata
- **Quest ID**: MAIN_T0_FIRST_RUN
- **Type**: MAIN_STORY (Tutorial)
- **Tier Availability**: 0
- **Required Tier**: 0
- **Estimated Duration**: 15-20 minutes
- **Repeatable**: No

## Prerequisites
- **Required Quests Completed**: None (first quest)
- **Faction Reputation**: None
- **Story Flags**: None
- **Tier Minimum**: 0
- **Items Required**: None

## Quest Giver
- **NPC Name**: Dispatcher Chen
- **Location**: The Hollows Courier Station
- **Initial Dialogue Tree**: `/02_DIALOGUE_TREES/greetings/chen_first_meeting.md`

## Synopsis

**You're a fresh courier in The Hollows with nothing but desperation and a busted vehicle. Dispatcher Chen sizes you up, decides you might last a week, and gives you a simple delivery: medical supplies to the Night Market. It's supposed to be routine. But in this city, nothing ever is.**

This tutorial introduces core mechanics: navigation, package handling, time pressure, basic driving, and the rating system. The player learns that every delivery matters—your reputation is your survival.

## Objectives

### Primary Objective:
1. **Deliver medical supplies to Dr. Tanaka's clinic in the Night Market before the deadline (20 minutes)**

### Secondary Objectives:
2. **Arrive with package intact** (driving carefully, avoiding damage)
3. **Meet Rosa** (get vehicle diagnostic at station garage)

### Optional Objectives:
4. **Explore The Hollows** (find 2 street landmarks)
5. **Talk to Chen about courier life** (learn about rating system)

### Hidden Objectives:
6. **Notice the Algorithm surveillance** (see cameras, drones; unlocks lore entry)

## Narrative Beats

### Act 1: Setup

**Hook**: You're broke, desperate, and out of options. The courier gig is the last chance before the streets swallow you.

**Context**: The Hollows Courier Station is a lifeline for people like you—bottom-tier, unaugmented, hungry. Dispatcher Chen has seen a thousand rookies come through. Most don't make it. But he gives everyone a chance.

**Initial Decision Point**: When Chen offers the job, player can:
- Accept immediately (eager, desperate)
- Ask questions (cautious, smart)
- Negotiate payment (bold, risky—Chen respects it)

### Act 2: Complication

**Setup**: The drive to Night Market is straightforward. Tutorial tooltips explain navigation, HUD elements, package handling. Rosa fixed your vehicle—it runs, barely. The route takes you through safe zones.

**Twist/Escalation**: Halfway to the destination, you witness a corporate recovery team extracting a crashed courier from a wreck. The courier is screaming. Heavy chrome, barely human, being hauled away like property. Chen's voice crackles over comms: "Don't stop. Keep moving. That's what happens when you miss too many deliveries."

**Branching Point**:
- **Stop and watch** (empathy, horror—humanity +2, but time pressure increases)
- **Keep driving** (pragmatic, focused—no humanity change, stays on schedule)
- **Speed up to get away** (fear, avoidance—minor humanity -1, arrives early)

**Moral Weight**: This moment establishes the tone—this world is cruel, and you're one missed delivery from that fate.

### Act 3: Resolution

**Climax**: You arrive at Dr. Tanaka's clinic (a gray-market medical facility in Night Market). She's professional, grateful, pays immediately. She notices you're unaugmented and offers a warning: "Chrome is a trap. It feels like power, but it's a leash. Be careful how much you take."

**First Rating**: Chen calls after delivery. "Not bad for a rookie. Client was satisfied. You got a 4.2 star rating. Keep that up, you'll make Tier 1 in a week. Drop below 3 stars, and you're done."

**Consequences**:
- Payment received: 150 credits (barely enough for food and fuel)
- Rating: 4.2/5.0 (baseline established)
- Chen approves (Relationship +5)
- Tutorial complete, core loop established

**Multiple Endings**: N/A (linear tutorial), but player choices affect initial reputation with Chen and Tanaka.

## Branching Paths

### Path A: Efficient Professional
- **Trigger**: Deliver on time, package intact, didn't stop for complication
- **Consequences**: Chen approves ("You're focused. Good."), Tanaka notes your professionalism
- **Rewards**: Base payment + 25 credit bonus
- **Story Flags Set**: EFFICIENT_COURIER

### Path B: Empathetic Observer
- **Trigger**: Stopped to watch the corpo extraction, asked Chen about it afterwards
- **Consequences**: Chen warns you ("Empathy gets you killed in this job"), Tanaka senses your horror
- **Rewards**: Base payment, Humanity +2
- **Story Flags Set**: WITNESSED_EXTRACTION, ASKS_QUESTIONS

### Path C: Scared Survivor
- **Trigger**: Sped away from extraction scene, delivered early but shaken
- **Consequences**: Chen notes your fear ("You'll get used to it. Or you'll quit."), Tanaka offers mild sedative
- **Rewards**: Base payment, minor humanity -1
- **Story Flags Set**: AFRAID_OF_CORPS

## Complications

### Possible Complications (Tutorial, so minimal):

**Traffic Slowdown** (minor):
- Description: Construction zone, must detour
- Resolution: Follow HUD reroute (teaches navigation)
- Time Cost: 2 minutes

**Vehicle Warning Light** (minor):
- Description: Engine temperature rising (teaches vehicle monitoring)
- Resolution: Pull over briefly, let engine cool
- Consequence: If ignored, vehicle breaks down (teaches failure states)

**Friendly NPC Hail** (optional):
- Description: Street vendor flags you down, offers discount food
- Resolution: Can buy (teaches economy) or ignore (teaches time pressure)

## Rewards

### All Paths
- **Credits**: 150 base
- **XP**: 50 (enough for first skill point)
- **Rating**: 4.0-4.5 stars (depending on performance)
- **Unlocks**:
  - Tier 1 progression track
  - Rosa as NPC contact
  - Dr. Tanaka as augment specialist
  - Free roam in The Hollows

### Path-Specific
- **Efficient Path**: +25 credit bonus, Chen Relationship +8
- **Empathetic Path**: Humanity +2, Tanaka Relationship +5, unlocks "philosophical dialogue" option
- **Scared Path**: Minor trauma flag (affects future dialogue), Chen gives extra advice

## Consequences

### Short-Term
- **Immediate Impact**: You're now a courier. The city's rating system owns you.
- **Economic Reality**: 150 credits isn't much. You'll need many more runs to survive.
- **Social Integration**: The Hollows Station becomes your home base.

### Long-Term
- **Story Ramifications**: How you handled the extraction scene affects how NPCs perceive you
- **Character Outcomes**: Chen, Rosa, and Tanaka are now part of your world
- **World State Changes**: You're in the system—the Algorithm knows you exist (even pre-cochlear implant, you're in databases)

## Dialogue References

**Quest Intro**: `/02_DIALOGUE_TREES/greetings/chen_first_meeting.md`
- Chen sizes you up, offers work
- Player can respond with desperation, professionalism, or bravado

**Mid-Quest Dialogue**: `/02_DIALOGUE_TREES/conditional_branches/tutorial_complication_witness.md`
- Chen's voice over comms during extraction scene
- Varies based on player action (stop/keep moving/speed up)

**Quest Complete Dialogue**: `/02_DIALOGUE_TREES/conversation_topics/chen_first_rating.md`
- Chen explains rating system
- Establishes the stakes: fall below 3 stars = deactivation

**Optional Dialogue**:
- **Rosa**: `/02_DIALOGUE_TREES/greetings/rosa_first_meeting.md` (if player gets vehicle diagnostic)
- **Tanaka**: `/02_DIALOGUE_TREES/conversation_topics/tanaka_chrome_warning.md` (chrome philosophy intro)

## Tutorial Elements Introduced

### Core Mechanics:
1. **Navigation**: Follow HUD waypoints, read minimap
2. **Time Management**: Deadlines matter, late delivery = rating loss
3. **Package Integrity**: Drive carefully, damage reduces rating
4. **Rating System**: 5-star reviews determine tier progression
5. **Economy**: Credits earned, spent on fuel/repairs/food

### HUD Elements:
- Objective tracker (top-right)
- Navigation waypoint (AR overlay)
- Timer (top-center, countdown to deadline)
- Package status (bottom-left, integrity %)
- Credits/Rating (bottom-right)

### NPC Interaction:
- Dialogue choices matter (relationship tracking starts)
- Different NPCs have different personalities
- Some choices are timed (pressure)

### World Building:
- The Hollows (starting district, working-class)
- Corpo influence (extraction scene)
- Gray-market economy (Tanaka's clinic)

## Technical Notes

### Locations Used:
- **The Hollows Courier Station** (starting point, hub)
- **The Hollows Streets** (safe tutorial driving zone)
- **Extraction Scene Location** (scripted event, mid-route)
- **Night Market - Dr. Tanaka's Clinic** (destination)

### NPCs Involved:
- Dispatcher Chen (quest giver, rating explainer)
- Mechanic Rosa (optional interaction, vehicle tutorial)
- Dr. Tanaka (quest completion, chrome philosophy intro)
- Corpo Recovery Team (background, no interaction)
- Screaming Courier (scripted NPC, shows stakes)

### Items Spawned:
- Medical Supplies Package (quest item, flagged as "fragile")
- 150 Credits (quest reward)
- Optional: Food item from street vendor (if player stops)

### Scripted Events:
1. **Chen Introduction** (cutscene, skippable after first playthrough)
2. **Rosa Garage Scene** (optional, teaches vehicle maintenance)
3. **Corpo Extraction** (triggered at specific location, branching choices)
4. **Tanaka Delivery** (quest complete cutscene, establishes her character)
5. **Chen Rating Call** (post-delivery, explains progression system)

## Narrative Function

This quest serves as:
1. **Tone-Setter**: Establishes the bleak, exploitative world
2. **Mechanics Tutorial**: Teaches core courier gameplay loop
3. **Relationship Foundation**: Introduces key NPCs
4. **Thematic Introduction**: Chrome, corporations, survival, rating system
5. **Player Agency**: Early choices set player's "type" (efficient/empathetic/scared)

The extraction scene is critical—it shows what happens when you fail. The screaming courier is you, in a possible future. This isn't a power fantasy; it's survival horror in economic form.

## Writing Notes

### Tone:
- **Grounded desperation**: You're not special, you're just broke
- **No heroics**: This is a job, not a calling
- **Quiet horror**: The extraction scene is disturbing but normalized
- **Economic anxiety**: Every credit matters, every rating point matters

### Chen's Voice:
- Tired pragmatist, seen it all
- Not cruel, but not soft
- "Kid, everyone who walks through that door is desperate. That's why we're here."

### Rosa's Voice:
- Warm, competent, friendly
- Wants you to succeed
- "Vehicle's in rough shape, but I got her running. Don't push her too hard, yeah?"

### Tanaka's Voice:
- Professional, clinical, but humane
- Early warning about chrome
- "You're still unaugmented. That's rare. It won't stay that way—this job demands chrome. Just... choose carefully."

### The Extraction Scene:
- **Visual**: Twisted metal, smoke, corporate logos on recovery team armor
- **Audio**: Screaming (pain + fear + chrome malfunction feedback), hydraulics, harsh commands
- **Courier**: Visible heavy augmentation, clearly in chrome psychosis, being treated like property
- **Chen's Commentary**: "That's a Tier 4 who fell to Tier 2. Corpo sponsors own his aug debt. They're repossessing the chrome. He'll survive, but... he won't be the same."

## Player Takeaway

After this quest, the player understands:
1. This world is cruel and exploitative
2. The rating system is life or death
3. Chrome is everywhere, and you'll need it eventually
4. There are good people (Chen, Rosa, Tanaka) trying to help you survive
5. Failure looks like that screaming courier
6. You're in the system now—there's no going back

**The central question is planted**: *How far will you go to stay alive? What will you trade?*

## Related Content
- Quest: "Tier 1 Provisional" (next main story quest)
- Character: Dispatcher Chen - `/01_CHARACTERS/tier_0_npcs/dispatcher_chen.md`
- Character: Mechanic Rosa - `/01_CHARACTERS/romance_characters/romance_mechanic_rosa.md`
- Character: Dr. Yuki Tanaka - `/01_CHARACTERS/tier_1-3_npcs/dr_yuki_tanaka.md`
- Location: The Hollows - `/05_WORLD_TEXT/locations/districts/the_hollows.md`
- Tutorial: Rating System - `/12_TUTORIALS_TOOLTIPS/system_explanations/rating_system.md`
- Cutscene: Extraction Witness - `/11_CUTSCENES_VIGNETTES/world_events/corpo_extraction.md`
