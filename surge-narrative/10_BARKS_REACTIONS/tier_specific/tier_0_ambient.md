# Tier 0 Ambient Dialogue

## Purpose
30 ambient dialogue lines specific to the Tier 0 experience. Captures the rookie courier perspective—uncertainty, discovery, and the first steps into a larger world.

---

## STREET CONVERSATIONS (Overheard)

### About New Couriers

**1. Veteran Courier to Friend**
"Another green one started this week. Chen's got patience, I'll give her that. Kid won't last a month."

**2. Market Vendor Observation**
"See that courier? The nervous one? Fresh. You can always tell. They look at everything like they're memorizing it."

**3. Dock Worker Commentary**
"New courier took the Harbor-Hollows run. Took 'em twenty minutes. I could crawl faster. They'll learn or they won't."

**4. Street Kid Mockery**
"Bet you five credits that courier gets lost before the checkpoint. [Beat] Called it. Pay up."

**5. Repair Shop Owner**
"Young people these days want to be couriers. Dangerous job, low pay, no benefits. And they think it's exciting. Until it isn't."

### General Street Chatter

**6. Two Workers Passing**
"You hear about the layoffs at Nakamura? Whole floor cleared out. More bodies for the Hollows."
"Same story, different corp."

**7. Elderly Woman at Market**
"Prices keep climbing. My pension's fixed. Numbers don't change, but somehow I afford less every week."

**8. Children Playing**
"I'm a courier! You're the gang! [Giggling] I'm getting away!"
"No fair, couriers don't fly!"

**9. Drunk at Bar Entrance**
"Used to be you could walk these streets alone. Now? [Shakes head] Now you need chrome just to feel safe."

**10. Couple Arguing (Low Volume)**
"If you'd just take the Algorithm—"
"I said no. I'm not losing myself for efficiency."

---

## VENDOR BARKS (Player-Directed)

### Hollows Market

**11. Food Vendor Call**
"Fresh synth-protein! Almost tastes like real! Courier discount if you're hungry!"

**12. Tech Vendor Call**
"HUD upgrades! Maps, route planners, traffic alerts! Make your runs faster, courier!"

**13. Clothing Vendor**
"Weather-proof gear! You're gonna need it when the rain starts. Trust me, runner, you'll thank me later!"

**14. Information Broker (Subtle)**
"Psst. Courier. You want to know which routes are clear today? Information isn't free, but it's worth it."

**15. Medicine Vendor**
"Stims, patches, basic meds! Stay sharp, stay alive! Legal and... mostly legal!"

---

## OVERHEARD AT CHEN'S OFFICE

### Waiting Area Chatter

**16. Courier A to Courier B**
"How long you been doing this?"
"Three months."
"You like it?"
"I'm still alive. That counts as liking it, right?"

**17. Courier Complaining**
"Tier advancement's too slow. I've done fifty runs and I'm still bottom-level. How am I supposed to build rep like this?"

**18. Anxious New Courier**
"Is it true there's an Algorithm that gets in your head? Like, literally in your head?"
"[Other courier laughs] You're a few tiers away from worrying about that, newbie."

**19. Experienced Courier (To Self)**
"Four runs today. Four. This used to be exciting. [Sighs] Now it's just math."

**20. Overheard Call**
"I'm running late because—[pause]—look, the checkpoint took longer than—[pause]—I know, I KNOW. I'm on my way."

---

## NPC REACTIONS TO PLAYER

### Recognition Lines

**21. Street Vendor (Repeat Customer)**
"Hey, you're that courier from the other day! Still running? Good. Thought you might've quit already."

**22. Dock Worker (After First Job)**
"Marcus mentioned you. Said you didn't screw up. For him, that's high praise. Keep it up."

**23. Random Citizen (Neutral)**
"Courier, right? [Nods] Good luck out there. Streets aren't getting friendlier."

**24. Child (Curious)**
"Are you a real courier? Do you fight robots? Do you have laser eyes?"

**25. Elderly Man (Warning)**
"Young courier. Some advice? Don't trust easy money. The easier the job, the harder the catch."

---

## ENVIRONMENTAL AMBIANCE

### Background Noise With Meaning

**26. Public Terminal Broadcast**
"[Static] —current curfew remains in effect for sectors twelve through—[static]—violators will be detained—"

**27. Distant Sirens, Close Commentary**
"Third time today. Someone's having a bad week."
"Someone's always having a bad week."

**28. Holographic Ad (Targeted)**
"YOU look like someone who values efficiency! Have you considered Algorithm integration? Ask your local clinic about—" [Player moves out of range]

**29. Street Preacher**
"The upload is a lie! They take your soul and give you nothing! Keep your flesh! Keep your humanity!"

**30. Construction Site Noise + Worker**
"Hey, watch the cables! Last thing I need is some courier tripping and suing. [Mutters] Like I could afford a lawsuit."

---

## USAGE GUIDELINES

### Trigger Conditions
- Lines should play randomly during exploration
- Some lines gate behind story progress (e.g., #21-22 after first jobs)
- Line frequency: ~1 every 30-60 seconds of active exploration

### Location Mapping
- Lines 1-5, 16-20: Chen's office area
- Lines 6-15: Hollows Market / General streets
- Lines 21-25: Contextual (after meeting NPCs)
- Lines 26-30: Environmental (any outdoor area)

### Voice Variance
- Multiple voice actors per line category
- Age range: Young to elderly
- Demographics: Diverse representation
- All NPCs should sound like they belong to this world

---

## INTEGRATION NOTES

### Flags Referenced
- `TIER == 0` (primary condition for all lines)
- `FIRST_CLINIC_RUN_COMPLETE` (unlocks recognition lines)
- `MET_DOCK_MARCUS` (unlocks line 22)
- `TIER_0_JOBS_COMPLETED >= 3` (increases recognition frequency)

### Connections to Tutorial NPCs
- Some lines reference Dock, Sunny, Vera, Tomas, Nine without naming
- Builds sense of connected community
- Player may recognize descriptions before names

### Tone Guidance
**Overall feel**:
- Rookie uncertainty
- City overwhelm
- First glimpses of deeper world
- Cautious optimism mixed with realistic worry

---

*Tier 0 Ambient Dialogue v1.0*
*Phase 6 Day 3*
*30 ambient lines for tutorial experience*
