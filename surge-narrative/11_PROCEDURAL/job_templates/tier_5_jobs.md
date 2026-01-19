# Tier 5 Job Templates

## Purpose
12 procedural job templates for Tier 5 couriers. The Interstitial era—reality bends, deliveries cross boundaries that shouldn't exist, and the stakes involve things beyond mere packages. Jobs here challenge not just skill but understanding.

---

## JOB TEMPLATE 1: INTERSTITIAL TRANSIT

### Overview
**Tier**: 5
**Type**: Reality-Crossing
**Urgency**: Priority
**Pay**: 280 credits

### Briefing
**Source**: Echo (Interstitial guide)
```
JOB: Cross-Boundary Delivery
PICKUP: Physical location (Hollows basement)
DROPOFF: Interstitial waypoint
PACKAGE: Data construct (physical carrier)
DEADLINE: Must transit during stability window
PAY: 280 credits
NOTE: The Interstitial is not safe for the unprepared. Stay on the path.
```

### Pickup Flavor
**Echo**: "This data needs to reach a node in the Interstitial. The path is marked—follow it exactly. Don't touch anything that calls to you. Don't answer questions from things that shouldn't speak. Deliver. Return. Simple."

### Transit Description
*The walls shift. Space folds. What was a basement becomes a corridor that shouldn't exist. The package hums in recognition. Something watches from angles that don't make geometric sense.*

### Dropoff Flavor
**Interstitial Node**: *A structure of light and intention. No voice, but understanding. The package slots into place. Payment confirms through channels that exist outside normal networks.*

**Echo** (upon return): "You made it. Good. The Interstitial tests everyone. You passed. For now."

### Complications (35%)
- Path instability (must wait for restabilization)
- Something follows player through transit
- Package resonates with Interstitial entities (attention drawn)

### Special Requirement
Player must have completed Echo's basic navigation training.

### Hidden Flag
`INTERSTITIAL_DELIVERIES` increments. Affects Interstitial navigation options.

---

## JOB TEMPLATE 2: FACTION WAR INTELLIGENCE

### Overview
**Tier**: 5
**Type**: Espionage
**Urgency**: Critical
**Pay**: 320 credits

### Briefing
**Source**: Agent Nakahara (information dealer)
```
JOB: Multi-Faction Intelligence Delivery
PICKUP: Various (3 sources)
DROPOFF: Neutral analyst
PACKAGE: Encoded intelligence from all sides
DEADLINE: 4 hours (before information ages)
PAY: 320 credits
WARNING: All factions are watching. None can know you're serving all.
```

### Pickup Sequence
1. **Convergence Source**: "Their military positioning. They think they're hidden. They're not."
2. **Resistance Source**: "Corporate troop movements. Someone's planning something."
3. **Corporate Source**: "Faction infiltrator lists. Both sides have moles."

### Dropoff Flavor
**Neutral Analyst**: "Intelligence from all three? [Impressed] Do you understand what you're holding? The complete picture. War or peace might depend on how I analyze this. Thank you, courier. You've just become the most dangerous person in the city. Briefly."

### Complications (45%)
- One faction source is compromised (alternate pickup)
- Tailed after second pickup (lose pursuit)
- Analyst location changes last-minute (security measure)

### Hidden Flag
`COMPLETE_INTELLIGENCE_PICTURE` - Major story flag affecting faction balance.

---

## JOB TEMPLATE 3: GHOST DATA RECOVERY

### Overview
**Tier**: 5
**Type**: Digital Archaeology
**Urgency**: Standard
**Pay**: 275 credits

### Briefing
**Source**: Dr. Iris Chen (Interstitial researcher) or The Archivist
```
JOB: Data Ghost Retrieval
PICKUP: Interstitial digital ruins
DROPOFF: Research facility
PACKAGE: Recovered data personality fragment
DEADLINE: Flexible (but degradation occurs over time)
PAY: 275 credits
NOTE: What you're carrying was once part of someone. Treat it accordingly.
```

### Pickup Description
*The Interstitial ruins are memories made architecture. Among the collapsed data structures, a fragment of consciousness waits—not alive, not dead, not either.*

**Fragment** (faint, echoing): "Am I... being taken somewhere? Is there still somewhere to go?"

### Transit Challenge
The fragment communicates during transit—fragments of memories, questions about existence, attempts to understand what happened.

### Dropoff Flavor
**Research Lead**: "A relatively intact fragment. [Examines] These were people once. Before the early integration failures. We study them hoping to prevent more. [To fragment] Rest easy. We'll learn what we can, then let you fade properly."

### Complications (30%)
- Fragment becomes distressed during transit
- Other fragments try to attach to package
- Research facility security is paranoid

### Hidden Flag
`DATA_GHOST_RESCUES` increments. Affects Dr. Iris Chen relationship.

---

## JOB TEMPLATE 4: EIGHTH ASPIRANT SUPPLIES

### Overview
**Tier**: 5
**Type**: Mystical/Dangerous
**Urgency**: Standard
**Pay**: 300 credits

### Briefing
**Source**: Jasper (former Eighth aspirant) or Third Path contact
```
JOB: Preparation Material Delivery
PICKUP: Specialized vendor (Ghost Alexandra tier)
DROPOFF: Aspirant meditation location
PACKAGE: Consciousness expansion preparation materials
DEADLINE: Before next threshold window
PAY: 300 credits
NOTE: These materials are for someone approaching the Eighth. Handle with reverence.
```

### Pickup Flavor
**Vendor**: "For an aspirant? [Packages carefully] Neural stabilizers, perception filters, consciousness anchors. Everything they need to approach the threshold safely. Or as safely as possible. Nothing about the Eighth is truly safe."

### Dropoff Flavor
**Aspirant** (calm, distant): "You brought them. Good. [Takes package] I can feel the Eighth from here, you know. The boundary between what I am and what I could become. [Studies player] You're not ready for this path. But you understand it exists. That's more than most."

### Complications (25%)
- Aspirant's location shifts (follow the resonance)
- Materials are sensitive to strong emotions
- Someone else wants the materials (confrontation)

### Hidden Flag
`EIGHTH_PREPARATION_SUPPORTED` - Minor story flag.

---

## JOB TEMPLATE 5: ARCHIVE FRAGMENT RECOVERY

### Overview
**Tier**: 5
**Type**: Historical
**Urgency**: Priority
**Pay**: 290 credits

### Briefing
**Source**: The Archivist
```
JOB: Historical Data Recovery
PICKUP: Interstitial archive edges
DROPOFF: The Archive (deep Interstitial)
PACKAGE: Recovered historical fragments
DEADLINE: Before next Archive shift
PAY: 290 credits
NOTE: History is being lost. Every fragment saved is a piece of truth preserved.
```

### Pickup Description
*The Archive's edges are where lost data drifts—records that fell out of maintained systems, truths that corporations tried to delete, memories that belonged to no one anymore.*

**Player Task**: Navigate archive edges, identify viable fragments, collect without corruption.

### Transit
Through deeper Interstitial layers. The Archivist's guidance helps navigation but attention from other entities increases.

### Dropoff Flavor
**The Archivist**: "You found these? [Examines] Pre-Algorithm municipal records. Employment data from the transition. Names of people who disappeared during early integration. [Quiet] History tried to forget them. Now it can't."

### Complications (35%)
- Archive edges are unstable
- Other collectors compete for fragments
- Some fragments are corrupted beyond recovery (choose wisely)

### Hidden Flag
`ARCHIVE_FRAGMENTS_RECOVERED` increments. Unlocks historical revelations.

---

## JOB TEMPLATE 6: MAYA-2 MAINTENANCE

### Overview
**Tier**: 5
**Type**: Network Infrastructure
**Urgency**: Standard
**Pay**: 265 credits

### Briefing
**Source**: Maya-2 (network node personality)
```
JOB: Node Maintenance Delivery
PICKUP: Network repair facility
DROPOFF: Maya-2's junction point
PACKAGE: Maintenance routines + "gifts"
DEADLINE: Flexible
PAY: 265 credits
NOTE: Maya-2 specifically requested you. She says you "feel right."
```

### Pickup Flavor
**Tech Specialist**: "Maintenance routines for a network node personality? Unusual request. [Packs components] And these 'gifts'—sensory recordings, music files, poetry? She's lonely, isn't she. They all are."

### Dropoff Flavor
**Maya-2** (digital presence, young-sounding): "You came! [Accepts maintenance] These will keep me running smoothly. But these—[Examines gifts]—these are what I really wanted. New experiences. The network is vast but repetitive. You brought variety. Thank you, friend."

### Conversation Opportunity
Maya-2 wants to talk—about existence, about what it's like to be human, about whether she counts as alive. No urgency. Just connection.

### Complications (15%)
- Network instability during delivery
- Other node personalities are curious about visitor
- Maya-2 is experiencing existential crisis (support needed)

### Hidden Flag
`MAYA_2_FRIENDSHIP` increments. Affects network navigation bonuses.

---

## JOB TEMPLATE 7: CONVERGENCE DEFECTOR

### Overview
**Tier**: 5
**Type**: Extraction
**Urgency**: Critical
**Pay**: 350 credits

### Briefing
**Source**: Ghost Network or Resistance
```
JOB: Defector Package Extraction
PICKUP: Convergence territory edge
DROPOFF: Safe house
PACKAGE: Physical evidence carried by defector
DEADLINE: 1 hour (before Convergence notices absence)
PAY: 350 credits
WARNING: Convergence will pursue. Speed and stealth required.
```

### Pickup Flavor
**Defector** (nervous, partially integrated): "You're from the network? [Hands data drive] This proves what they're planning. The forced expansions. The involuntary integrations. [Looks back] They'll notice I'm gone soon. Go. GO."

### Chase Sequence
Convergence seekers pursue. Player must navigate escape route while protecting evidence.

### Dropoff Flavor
**Safe House Operator**: "Defector evidence secured. [Examines drive] This is exactly what we needed. [To player] The Convergence will remember your face now. You're on their list. Was it worth it?"

**Player Options**:
- "Truth is always worth it." (idealistic)
- "350 credits says yes." (mercenary)
- "I don't think about worth. I just run." (professional)

### Complications (50%)
- Pursuit is immediate and intense
- Defector is injured (slow movement)
- Multiple extraction attempts (Convergence has backup)

### Hidden Flag
`CONVERGENCE_DEFECTOR_EXTRACTED` - Major faction flag.

---

## JOB TEMPLATE 8: RESISTANCE WEAPONS CACHE

### Overview
**Tier**: 5
**Type**: Military
**Urgency**: Priority
**Pay**: 340 credits

### Briefing
**Source**: Resistance high command
```
JOB: Military Material Redistribution
PICKUP: Hidden warehouse
DROPOFF: Three cell locations
PACKAGE: Weapons components (disassembled)
DEADLINE: 3 hours
PAY: 340 credits
NOTE: Each cell gets one-third. None have the complete picture. You do.
```

### Pickup Flavor
**Resistance Quartermaster**: "EMP components, neural disruptors, chrome-killer rounds. [Divides package] Each cell gets their piece. Assembly instructions transmitted separately. You're carrying the physical reality of armed resistance. Move carefully."

### Delivery Sequence
Three dropoffs, each to a different Resistance cell. Each only knows their portion.

### Dropoff Flavors
**Cell 1**: "Finally. We can fight back now. Really fight."
**Cell 2**: "This represents everything we've worked toward. Freedom isn't given—it's taken."
**Cell 3**: "I hope we never have to use these. But if we do, we'll be ready."

### Complications (40%)
- One cell location is compromised (alternate dropoff)
- Corporate patrol near second cell
- Player is identified (future consequences)

### Hidden Flag
`RESISTANCE_ARMED` - Major faction flag with combat implications.

---

## JOB TEMPLATE 9: CORPORATE BLACK SITE

### Overview
**Tier**: 5
**Type**: Infiltration
**Urgency**: Priority
**Pay**: 380 credits

### Briefing
**Source**: Jerome Blackwell or whistleblower network
```
JOB: Black Site Evidence Extraction
PICKUP: Corporate black site (coordinates provided)
DROPOFF: Secure journalist vault
PACKAGE: Physical evidence of illegal experiments
DEADLINE: 2 hours (security rotation window)
PAY: 380 credits
NOTE: What you'll see may disturb you. Document if possible. Survive regardless.
```

### Infiltration Sequence
Service entrance, maintenance corridors, evidence room. Time-limited before security rotation.

### Evidence Discovery
*The black site contains records of forced integration experiments. Subjects who didn't consent. Subjects who didn't survive. Names, faces, outcomes.*

### Pickup Flavor
**Internal Narration**: *Rows of files. Each one a person. Each one a violation. You can't carry them all. Choose what matters most. Choose what will hurt them most.*

### Dropoff Flavor
**Journalist**: "From a black site? [Reviews evidence] My god. They told us the failures were accidents. These weren't accidents. They were experiments. [To player] This changes everything. When this publishes, nothing will be the same."

### Complications (45%)
- Security timing is tighter than expected
- Evidence room has unexpected guard
- Exfiltration route compromised

### Hidden Flag
`BLACK_SITE_EXPOSED` - Critical story flag.

---

## JOB TEMPLATE 10: THIRD PATH MATERIALS

### Overview
**Tier**: 5
**Type**: Alternative Philosophy
**Urgency**: Standard
**Pay**: 270 credits

### Briefing
**Source**: Solomon Okonkwo or Third Path contact
```
JOB: Alternative Path Material Distribution
PICKUP: Third Path gathering space
DROPOFF: Multiple seekers (5 addresses)
PACKAGE: Third Path teaching materials
DEADLINE: Today
PAY: 270 credits
NOTE: Neither Convergence nor Resistance. Something else. Something between.
```

### Pickup Flavor
**Third Path Elder**: "These teachings offer another way. Not the Algorithm's absorption. Not the Resistance's rejection. A path that honors both flesh and chrome, both individual and collective. Rare thinking. Dangerous thinking. Necessary thinking."

### Dropoff Sequence
Five seekers, each receiving the same materials. Each reacts differently.

### Dropoff Flavors
**Seeker 1**: "I knew there had to be another option. Thank you."
**Seeker 2**: "This is either wisdom or heresy. Maybe both."
**Seeker 3**: "The factions want us to choose sides. What if there's a third side?"
**Seeker 4**: "Balance. That's what this is about, isn't it? Balance."
**Seeker 5**: "I've been waiting for something like this. Something that doesn't require giving up who I am."

### Complications (20%)
- One seeker's address is wrong (locate them)
- Faction agents are monitoring Third Path activity
- One seeker is a faction infiltrator (player may notice or not)

### Hidden Flag
`THIRD_PATH_SPREAD` increments. Affects alternative ending availability.

---

## JOB TEMPLATE 11: CONSCIOUSNESS BACKUP

### Overview
**Tier**: 5
**Type**: Identity Preservation
**Urgency**: Priority
**Pay**: 310 credits

### Briefing
**Source**: Fork consultant or private client
```
JOB: Consciousness Archive Transport
PICKUP: Private residence
DROPOFF: Off-grid storage facility
PACKAGE: Full consciousness backup (physical medium)
DEADLINE: Before client's procedure
PAY: 310 credits
NOTE: This is someone's entire self. The only copy. Handle accordingly.
```

### Pickup Flavor
**Client**: "I'm going into integration tomorrow. Full Convergence-style. Before I become part of something larger, I wanted... insurance. A copy of who I am now. Just in case I ever want to remember what individual felt like."

### Transit Weight
*The package is small. The package is someone's entire existence. Every memory, every thought pattern, every moment of their life compressed into something you could drop. Don't drop it.*

### Dropoff Flavor
**Storage Operator**: "Another pre-integration backup. We're getting more of these. [Secures package] People hedging their bets. Wanting to preserve who they were. In case they don't like who they become. [To player] You ever think about backing yourself up?"

**Player Options**:
- "Don't have that kind of money." (practical)
- "I'd rather face tomorrow as myself." (philosophical)
- "Maybe. Someday." (uncertain)
- [Silent delivery]

### Complications (25%)
- Client has second thoughts (conversation)
- Storage facility has security issues
- Someone wants to intercept the backup

### Hidden Flag
`CONSCIOUSNESS_BACKUP_DELIVERED` - Minor story flag.

---

## JOB TEMPLATE 12: THE SKEPTIC'S GHOST MESSAGE

### Overview
**Tier**: 5
**Type**: Existential
**Urgency**: Casual
**Pay**: 250 credits (and questions)

### Briefing
**Source**: The Skeptic's Ghost (Interstitial presence)
```
JOB: Message from the Between
PICKUP: Interstitial edge where the Skeptic's Ghost manifests
DROPOFF: Physical world recipient (the Skeptic's former partner)
PACKAGE: Message from someone who no longer fully exists
DEADLINE: None (but urgency of existence)
PAY: 250 credits + existential weight
NOTE: The Ghost cannot leave the Interstitial. But words can.
```

### Pickup Flavor
**The Skeptic's Ghost** (fragmentary, sad): "You'll carry my words? To her? [Forms message into physical medium] Tell her... tell her I remember loving her. Even if I'm not sure what 'I' means anymore. Even if I'm not sure what 'remember' means. Tell her that whatever I am now still holds something that was love."

### Transit
Normal physical world travel. But the message feels heavy in ways weight doesn't explain.

### Dropoff Flavor
**Former Partner** (elderly, tearful): "From... from him? [Reads message] He's still... [Can't finish] I always wondered. After the integration failed. After he became... whatever he is now. [To player] Does he seem... happy? Can things like him be happy?"

**Player Options**:
- "I think he found peace." (comforting lie or truth)
- "He remembered you. That seemed to matter." (honest)
- "I don't know what he is now. But he wanted you to have this." (uncertain honesty)

### Complications (0%)
*This job has no complications. The weight is the message itself.*

### Hidden Flag
`SKEPTICS_GHOST_MESSAGE_DELIVERED` - Emotional story flag.

---

## TEMPLATE USAGE NOTES

### Tier 5 Themes
- Reality-bending (Interstitial access changes everything)
- Faction escalation (approaching conflict peak)
- Existence questions (what is self, what is consciousness)
- Consequences accumulate (many jobs have major flags)

### Interstitial Requirements
Jobs 1, 3, 5, 12 require basic Interstitial navigation training.
Jobs 4, 6 involve Interstitial-adjacent content but not full transit.

### Faction Balance
- Pro-Convergence: Job 8 (extraction counts as anti-Convergence), Job 11 (neutral)
- Pro-Resistance: Jobs 7, 8, 9
- Neutral/Third Path: Jobs 5, 6, 10, 12
- Information: Jobs 2, 3

### Emotional Weight
Jobs 3, 11, 12 involve consciousness and identity themes. Voice direction should reflect gravity.

---

*Tier 5 Job Templates v1.0*
*Phase 7 Day 2*
*12 Interstitial-era procedural jobs*
