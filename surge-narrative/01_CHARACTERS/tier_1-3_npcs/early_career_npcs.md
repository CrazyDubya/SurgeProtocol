# Early Career General NPCs (Tier 1-2)

## Purpose
8 general NPCs for Tiers 1-2. These characters populate the player's transition from rookie to established courier, providing variety and world depth.

---

## NPC 1: KIRA "PATCH" VOLKOV

### Basic Information
**Role**: Black Market Tech Dealer
**Location**: The Hollows, rotating addresses
**Age**: 27
**Appearance**: Asymmetric haircut (one side shaved), AR-enhanced eyes (obvious cosmetic chrome), cargo vest with dozens of pockets.

### Background
Former corporate tech support. Walked out with a lot of knowledge and some inventory. Now sells modified tech to those who can't afford—or don't want—official channels.

### Personality
- **Enthusiastic**: Genuinely loves technology, can't stop explaining things
- **Paranoid**: Constantly watching for corporate retrieval teams
- **Ethical-ish**: Won't sell to people who'll use tech to hurt innocents
- **Helpful**: Actually wants customers to succeed with their purchases

### Speech Pattern
Fast, technical, enthusiastic tangents. Uses brand names and model numbers casually. Gets distracted by interesting tech.

### Key Dialogue

**First Meeting**:
"Hey! New face! You looking for gear? I've got gear. Standard stuff, modified stuff, stuff that technically doesn't exist. What's your budget? What's your need? What's your—ooh, is that a K-7 comm unit? Those are ancient. Want me to upgrade it?"

**Browsing**:
"HUD overlays, route optimizers, signal boosters. I've got a new batch of refurbished security bypasses—before you ask, yes, they're clean. No trackers. I check personally."

"See this? [Holds up chip] Standard memory core, right? Wrong. I've doubled the capacity and added encryption that would make corps cry. Same price as baseline. Because I'm nice."

**On Corporate Tech**:
"The stuff they sell in stores? Locked down. Throttled. They give you 50% capability and charge for 'premium features.' What I sell? Full power. The way it should be."

**Warning Lines**:
"Word of advice? Don't scan this gear near checkpoints. It reads as... enthusiastically modified. Some guards don't appreciate enthusiasm."

**After Purchase**:
"You have problems with that unit, you come back to me. I stand behind my work. [Beat] Also don't mention my name to anyone. Reputation's good but exposure isn't."

### Story Flags
**Sets**:
- `MET_PATCH_DEALER`
- `PATCH_PURCHASES` (integer)
- `PATCH_TRUST` (integer: 0-10)

**Checks**:
- `TIER >= 1` (availability)
- `PATCH_TRUST >= 5` (better inventory)

### Voice Direction
**Tone**: Excited tech nerd with survival instincts.
**Accent**: Slight Eastern European undertone.
**Pace**: Fast, accelerates during technical explanations.

---

## NPC 2: EMMANUEL "MANNY" PRICE

### Basic Information
**Role**: Street Food Vendor / Gossip Broker
**Location**: Red Harbor District, fixed stall
**Age**: 45
**Appearance**: Stocky, permanent stubble, grease-stained apron, cybernetic hearing enhancement (visible).

### Background
Ran restaurants uptown before the franchise regulations killed small business. Now cooks in the Harbor, feeds dock workers, and trades in information as a side business. His enhanced hearing isn't just for the kitchen.

### Personality
- **Gregarious**: Talks to everyone, makes friends easily
- **Shrewd**: Friendly doesn't mean naive
- **Generous**: Feeds people who can't pay, keeps tabs
- **Connected**: Knows everyone's business, uses it carefully

### Speech Pattern
Warm, inclusive, always offering food. Shifts to quieter, more serious tone when trading information.

### Key Dialogue

**First Meeting**:
"Hey! New face! Courier, right? You're all over the Harbor lately. Sit, sit. First meal's on the house. I'm Manny. Everyone knows Manny."

**Regular Interaction**:
"The usual? Coming right up. Hey, while you're here—you know anyone working the Uptown routes? Got some questions about security timing up there."

"Eat, eat! You're too skinny for this work. Couriers need fuel. Can't run on empty. [Slides extra portion] Don't argue."

**Information Trading**:
"[Quieter] You want to know what's happening in Harbor? Talk to me. I hear everything in this kitchen. The price? Information back. Or credits. I'm flexible."

"Word is the checkpoint on Fifth is doing random package scans this week. Someone tipped them about something. Might want to take the long way. Just saying."

**On the District**:
"Harbor's honest, you know? Everyone's working. Nobody pretends they're not. Uptown? They pretend. Here? We all know what we are."

### Story Flags
**Sets**:
- `MET_MANNY_HARBOR`
- `MANNY_INFO_TRADES` (integer)
- `MANNY_FREE_MEALS` (integer)

**Checks**:
- `TIER >= 1`
- `MANNY_INFO_TRADES >= 3` (better intel available)

### Voice Direction
**Tone**: Warm paternal figure, shifts to businesslike for info.
**Accent**: Working-class local.
**Pace**: Comfortable, unhurried, speeds up for gossip.

---

## NPC 3: "STATIC"

### Basic Information
**Role**: Junior Fixer
**Location**: Hollows Bar "The Rusty Anchor" (back room)
**Age**: 23
**Appearance**: Constantly changing—different hair, different clothes, sometimes different face (cheap cosmetic modifications). Only constant: the static-display bracelet.

### Background
Learning the fixer trade under Nine's distant observation. Handles small jobs that Nine considers beneath attention. Eager to prove themselves, sometimes too eager.

### Personality
- **Ambitious**: Wants to be the next big fixer
- **Insecure**: Compensates with false confidence
- **Clever**: Actually quite smart, just inexperienced
- **Competitive**: Sees other up-and-comers as rivals

### Speech Pattern
Tries to sound mysterious like Nine, doesn't quite pull it off. Drops cryptic hints that don't always land. Gets flustered when caught acting.

### Key Dialogue

**First Meeting**:
"You're the courier Nine mentioned. [Trying to sound casual] I've heard things. About you. Good things. Mostly. I'm Static. When you need work that's not on the boards? Come to me."

**Job Offerings**:
"I've got something. Small job. Pays well. Details are... need-to-know. [Beat] Okay, I'll tell you the details. It's a pickup from the Harbor, delivery to—look, it's actually pretty straightforward. Good pay though."

"This one's off-book. The kind of off-book that pays double. [Lowers voice] Someone needs a package moved from Sector 4. No questions. You in?"

**On Being a Fixer**:
"Nine's good, don't get me wrong. But they're... traditional. Old school. Me? I'm the future. Once I build my network. Which I'm doing. It's going well."

**When Things Go Wrong**:
"Okay, so the job got complicated. That happens! Every job has complications. The good fixers handle complications. I'm handling it. [Clearly panicking] Just give me a minute."

**Showing Competence** (later interactions):
"That job last week? I made that happen. The pieces, the timing—that was me. Nine wouldn't say it, but I impressed them. I think."

### Story Flags
**Sets**:
- `MET_STATIC_FIXER`
- `STATIC_JOBS_COMPLETED` (integer)
- `STATIC_SCREWUPS` (integer)

**Checks**:
- `TIER >= 1`
- `MET_FIXER_NINE` (appears after)
- `STATIC_JOBS_COMPLETED >= 3` (shows growth)

### Voice Direction
**Tone**: Trying too hard, occasionally genuine.
**Accent**: Standard city, slightly affected.
**Pace**: Speeds up when nervous or excited.

---

## NPC 4: HAYES

### Basic Information
**Role**: Rival Courier #2 (Not Jin)
**Location**: Various (same routes as player)
**Age**: 31
**Appearance**: Athletic build, minimal chrome (just efficiency augments), professional courier gear that's seen better days.

### Background
Been a courier for six years. Stuck at mid-tier. Not talented enough to advance fast, not lucky enough to catch a break. Resents newer couriers who might pass them.

### Personality
- **Bitter**: The job has worn them down
- **Professional**: Still does good work despite attitude
- **Jealous**: Watches other couriers' success resentfully
- **Capable**: When pushed, shows real skill

### Speech Pattern
Clipped, dismissive, occasionally cutting. Rare moments of openness when guard drops.

### Key Dialogue

**First Encounter** (competing for same job):
"Another new one. Great. Let me guess—this is your 'dream career' and you're 'so excited to run routes.' Save it. You'll burn out like everyone else."

**Competitive Lines**:
"You got the Uptown run? [Scoffs] Corporate liked your face better, I guess. Doesn't mean you're faster."

"Congrats on the tier-up. [Flat] Really. Good for you. Some of us have been working years for that."

**Grudging Respect** (if player does well):
"That was... not bad. The Harbor run. I heard about it. [Pause] You're not completely useless."

**Rare Vulnerability**:
"Six years. Six years I've been running. And every year there's someone new who makes it look easy. You know how that feels? [Shakes head] Forget it. Not your problem."

**Potential Alliance** (high relationship):
"Look. We keep running into each other. Maybe that's the city, maybe that's something else. You want to split a big job? Two couriers, double the routes, same deadline?"

### Story Flags
**Sets**:
- `MET_HAYES_COURIER`
- `HAYES_RELATIONSHIP` (integer: -20 to +20)
- `BEAT_HAYES_RACE` / `LOST_TO_HAYES`
- `HAYES_ALLIANCE_FORMED`

**Checks**:
- `TIER >= 1`
- `HAYES_RELATIONSHIP >= 10` (alliance possible)

### Voice Direction
**Tone**: Weary, guarded, occasional bitterness bleeding through.
**Accent**: Standard city, working-class.
**Pace**: Measured, speeds up when challenged.

---

## NPC 5: SISTER GRACE

### Basic Information
**Role**: Union Recruiter (Early Contact)
**Location**: Hollows Community Center
**Age**: 48
**Appearance**: Simple clothing, no visible chrome, calloused hands, union pin worn openly.

### Background
Former factory worker. Lost her arm to unsafe conditions, lost her savings to medical bills, found her purpose in organizing. Now she recruits for the Worker's Solidarity Union that Lopez leads.

### Personality
- **Passionate**: Believes in the cause completely
- **Patient**: Knows change takes time
- **Observant**: Identifies potential allies quickly
- **Practical**: Ideology balanced with real-world tactics

### Speech Pattern
Measured, persuasive, uses "we" and "us" constantly. Quotes labor history. Shifts between preaching and personal connection.

### Key Dialogue

**First Contact**:
"You're a courier, aren't you? Independent contractor, right? No benefits, no protections, no backup. [Nods] I was like you once. Before I understood there's another way."

**Union Pitch**:
"The Union isn't about taking from you. It's about making sure no one takes from you. Fair wages. Safe conditions. Someone who fights when the corps don't pay."

"You've run jobs for clients who don't exist. Delivered packages that could get you killed. And if something went wrong? Who protects you? No one. Unless you have people."

**On Solidarity**:
"One courier can be ignored. Denied. Replaced. A hundred couriers? That's a workforce. That's leverage. That's power they can't dismiss."

**Personal Story**:
"[Touches missing arm] Assembly line. No safety guards. Company said guards were too expensive. My arm was cheap, apparently. But together? We made them install guards. After. Too late for me. Not too late for others."

**Invitation**:
"When you're ready to stop running alone, find us. We're at the community center. The door's always open. Even if you just want to talk."

### Story Flags
**Sets**:
- `MET_SISTER_GRACE`
- `UNION_PITCH_HEARD`
- `UNION_INTEREST_LEVEL` (integer)

**Checks**:
- `TIER >= 1`
- `UNION_INTEREST_LEVEL >= 2` (Lopez introduction available)

### Voice Direction
**Tone**: Calm conviction, occasional fire when discussing injustice.
**Accent**: Working-class, slight religious cadence.
**Pace**: Deliberate, lets words land.

---

## NPC 6: "COMPASS" CHEN (No Relation)

### Basic Information
**Role**: Hollows Guide / Information Source
**Location**: Hollows District, various
**Age**: 16
**Appearance**: Teenage, street-smart eyes, clothing with hidden pockets, custom AR glasses (probably stolen).

### Background
Born in the Hollows, never left. Knows every alley, every shortcut, every danger zone. Runs errands for adults who pay, sells route information to those who need it.

### Personality
- **Streetwise**: Survival instincts honed by necessity
- **Entrepreneurial**: Always looking for angles
- **Guarded**: Trust is earned slowly
- **Dreamer**: Secretly hopes to become a real courier someday

### Speech Pattern
Fast, slang-heavy, deflects personal questions. Softens when talking about the Hollows.

### Key Dialogue

**First Meeting**:
"Hey, courier! You look lost. [You're not] Okay, you're not lost. But you could be faster. I know shortcuts. Good ones. Cost you five credits. Or ten for the really good ones."

**Selling Information**:
"See that alley? Dead end. Everyone thinks it's a shortcut. Not everyone. The smart ones know to go around. Smart ones like me. And now you. For a price."

"Gang activity in Sector 7 today. Chrome Saints and someone new. You don't want to be there. But you do want to know this, right? Five credits."

**On the Hollows**:
"People from Uptown think the Hollows is dangerous. [Shrugs] It's not dangerous. It's just honest. The danger's everywhere. Here, people admit it."

"I know every corner of this place. Born here. Probably die here. Might as well know it, right?"

**Dreaming Lines** (higher relationship):
"You think... you think I could be a courier? Someday? I know the routes. I know the people. I just need... [Trails off] Never mind. Stupid question."

**Defending Home**:
"Don't talk shit about the Hollows. I live here. My family lives here. It's not pretty but it's ours. You want pretty, go to Uptown. They'll charge you for it."

### Story Flags
**Sets**:
- `MET_COMPASS_GUIDE`
- `COMPASS_SHORTCUTS_BOUGHT` (integer)
- `COMPASS_RELATIONSHIP` (integer)

**Checks**:
- `TIER >= 1`
- `COMPASS_RELATIONSHIP >= 10` (personal dialogue)

### Voice Direction
**Tone**: Street kid bravado covering vulnerability.
**Accent**: Hollows local, youth slang.
**Pace**: Quick, defensive, slows when genuine.

---

## NPC 7: DETECTIVE RAE MORRISON

### Basic Information
**Role**: Red Harbor Regular / Retired Cop
**Location**: Red Harbor, "The Rusty Anchor" bar
**Age**: 58
**Appearance**: Weathered face, cheap suit, prosthetic leg (visible seam), always nursing a drink.

### Background
Twenty-five years on the force. Retired early after a case went wrong—lost the leg, lost the case, lost the point. Now drinks in Harbor and occasionally offers insight to those who ask.

### Personality
- **Cynical**: Seen too much to believe in much
- **Perceptive**: Old cop instincts never fade
- **Lonely**: Misses being useful
- **Honest**: Too tired to lie anymore

### Speech Pattern
Slow, measured, detective's cadence. Asks questions even when giving answers. Punctuates with long drinks.

### Key Dialogue

**First Encounter**:
"[Glances over] Courier. New one. [Returns to drink] You'll last. Or you won't. City decides, not you."

**When Asked for Advice**:
"Advice? [Snorts] Don't trust anyone completely. Don't distrust anyone completely. Watch the hands, not the face. And never deliver anything you wouldn't want found on your body."

"You want to know about routes? Talk to the couriers. You want to know about the city? Ask the cops. But we're all telling you what we think we saw. Truth's somewhere in between."

**On the Past**:
"I was good at my job. That's not bragging, that's fact. But good doesn't mean successful. Good means you see the things that should bother people. The things people ignore."

"[Touches leg] Case went wrong. That's all I'll say. But I'll tell you this—the people I was investigating? Still operating. Still free. And I'm here, missing a leg, with a pension that doesn't cover the drinks."

**Offering Help**:
"You got questions about what you're carrying, or who you're carrying for—I might know something. Might not. But asking costs nothing. Just buy me a drink."

### Story Flags
**Sets**:
- `MET_DETECTIVE_MORRISON`
- `MORRISON_INSIGHTS` (integer)

**Checks**:
- `TIER >= 1`
- `MORRISON_INSIGHTS >= 3` (deeper history revealed)

### Voice Direction
**Tone**: Burned out, occasionally sharp.
**Accent**: City cop, slightly formal.
**Pace**: Slow, deliberate, every word weighed.

---

## NPC 8: YUKI TANAKA (No Relation to Dr. Tanaka)

### Basic Information
**Role**: Uptown Service Entrance Contact
**Location**: Uptown Corporate District, service areas
**Age**: 34
**Appearance**: Corporate uniform (maintenance), perfect posture hiding defiance, subtle resistance pin under collar.

### Background
Works maintenance in Nakamura Tower. Hates the job, loves the access. Helps couriers navigate Uptown's back channels for a cut—and for the satisfaction of undermining the system.

### Personality
- **Subversive**: Corporate rebel from within
- **Precise**: Exact directions, exact timing
- **Cautious**: One wrong move ends everything
- **Satisfied**: Takes joy in small rebellions

### Speech Pattern
Formal in public, looser in private. Uses corporate jargon ironically. Always watching for observers.

### Key Dialogue

**First Contact**:
"[Corporate voice] I'm sorry, deliveries are processed through—[checks for observers, drops voice]—okay, we're clear. You're the courier. I'm your way in. Here's how this works."

**Providing Access**:
"Service entrance 7B, 14:00 to 14:15. Security changes shifts. I'll have the door unlocked. Walk like you belong. No one questions maintenance."

"Take the freight elevator, not passenger. Exit at sub-level 2. The package goes to locker 447. Combination is 7-7-3. Be out in three minutes."

**On the Corporation**:
"[Bitter] These people—the ones in the nice offices? They don't see us. Maintenance, delivery, cleaning—we're furniture to them. So we see everything. And they never think to watch furniture."

"Every time a courier makes a delivery they don't know about? That's a crack in their perfect system. I like cracks."

**Risk Awareness**:
"If I get caught helping you, I lose everything. Job, apartment, probably worse. So don't screw up. For both our sakes."

**Occasional Warmth**:
"Thanks. For doing this work. These packages—sometimes they're whistleblower docs, sometimes they're medicine for people who can't afford corp clinics. It matters. Even if nobody notices."

### Story Flags
**Sets**:
- `MET_YUKI_UPTOWN`
- `UPTOWN_SERVICE_ACCESS`
- `YUKI_JOBS_COMPLETED` (integer)

**Checks**:
- `TIER >= 2` (Uptown access required)
- `YUKI_JOBS_COMPLETED >= 2` (trust established)

### Voice Direction
**Tone**: Corporate mask over revolutionary spirit.
**Accent**: Proper, educated, occasional slips.
**Pace**: Formal when observed, urgent when private.

---

## NPC INTERACTION WEB

### Connections
- **Patch → Static**: Patch supplies tech Static sells
- **Manny → Everyone**: Everyone eats at Manny's
- **Compass → Grace**: Grace helped Compass's family once
- **Morrison → Hayes**: Morrison knows Hayes's history
- **Yuki → Patch**: Yuki smuggles corporate tech to Patch

### Reference Points for Player
- Tier 0 NPCs should mention these characters occasionally
- Builds anticipation before meeting
- Creates sense of interconnected world

---

## IMPLEMENTATION NOTES

### Availability
- All NPCs appear Tier 1+
- Yuki requires Tier 2 (Uptown access)
- Deep dialogue gates behind relationship levels

### Future Hooks
- Patch connects to black market chrome storylines
- Grace connects to Lopez/Union arc
- Morrison may have information about corporate conspiracies
- Static potentially becomes major fixer if player invests

---

*Early Career NPCs v1.0*
*Phase 6 Day 4*
*8 characters for Tier 1-2 experience*
