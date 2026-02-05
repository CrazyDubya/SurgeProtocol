# Tier 3 Job Templates

## Purpose
12 procedural job templates for Tier 3 couriers. This tier marks the transition from "just a courier" to "someone with choices." Jobs begin introducing faction awareness, Algorithm implications, and ethical complexities.

---

## JOB TEMPLATE 1: INTEGRATION CLINIC SUPPLIES

### Overview
**Tier**: 3
**Type**: Medical/Corporate
**Urgency**: Standard
**Pay**: 125 credits

### Briefing
**Chen's Board**:
```
JOB: Clinical Supply Run
PICKUP: Nakamura Distribution Center
DROPOFF: Integration Clinic (Hollows)
PACKAGE: Integration support equipment
DEADLINE: 2 hours
PAY: 125 credits
NOTE: Routine medical supply. Nothing controversial.
```

**Chen** (comment): "Integration clinics are everywhere now. Good money, regular work. Don't overthink it."

### Pickup Flavor
**Distribution Worker**: "Another clinic shipment. Neural stabilizers, calibration equipment, the usual. [Checks manifest] All logged and legal. Clinic's expecting you."

### Dropoff Flavor
**Clinic Staff**: "Thank you! We've been waiting. Three integrations scheduled today. [Glances at player] You're not integrated yet? Interesting choice. We offer discounts for couriers."

**Player Options**:
- "Maybe someday." (neutral)
- "Not interested." (firm)
- "Tell me about the discounts." (curious)
- [Silent nod, leave]

### Complications (20%)
- Anti-Algorithm protesters near clinic (navigate around)
- Staff tries to schedule player for consultation
- Package contains something that hums (unsettling)

### Hidden Flag
`INTEGRATION_CLINIC_RUN_COUNT` increments. At 3+, Dr. Sato may comment on it.

---

## JOB TEMPLATE 2: RESISTANCE COMMUNIQUE

### Overview
**Tier**: 3
**Type**: Political (Resistance)
**Urgency**: Priority
**Pay**: 140 credits

### Briefing
**Source**: Sister Algorithm (Resistance contact)
```
JOB: Secure Message Delivery
PICKUP: [Coded safehouse]
DROPOFF: [Coded location]
PACKAGE: Encrypted data (physical medium)
DEADLINE: 1 hour
PAY: 140 credits
WARNING: If compromised, destroy. Don't get caught with this.
```

### Pickup Flavor
**Sister Algorithm**: "This contains information about Algorithm side effects. Real data, not corporate propaganda. The people receiving it... they need to know. Get it there safely."

### Dropoff Flavor
**Resistance Cell Member**: "[Checks seal] Intact. Good. [Studies player] You're not one of us. But you helped us today. That means something. If you ever want to learn more..."

**Player Options**:
- "I'm just the courier." (neutral)
- "Tell me more about the side effects." (curious)
- "I support what you're doing." (sympathetic)
- "Don't recruit me. Just pay me." (professional)

### Complications (35%)
- Surveillance drone passes overhead (wait it out)
- Corporate security in area (alternate route)
- Package scanner at checkpoint (package will flag)

### Hidden Flag
`RESISTANCE_DELIVERIES` increments. At 2+, Resistance may offer direct membership.

---

## JOB TEMPLATE 3: CORPORATE RECRUITMENT PACKAGE

### Overview
**Tier**: 3
**Type**: Corporate
**Urgency**: Standard
**Pay**: 150 credits

### Briefing
**Source**: Victor Huang (corporate headhunter)
```
JOB: Executive Material Delivery
PICKUP: Nakamura Tower, sub-level
DROPOFF: Candidate residence
PACKAGE: Recruitment materials + signing bonus
DEADLINE: 3 hours
PAY: 150 credits
NOTE: Package contains significant value. Handle professionally.
```

### Pickup Flavor
**Victor Huang** (if available) or **Corporate Assistant**: "Recruitment package for a promising candidate. The bonus inside is... substantial. Don't be tempted. It's tracked, insured, and frankly not worth your career."

### Dropoff Flavor
**Candidate** (nervous professional): "Is this... from Nakamura? [Opens, sees bonus] Oh. Oh god. This is really happening. [To player] Do you think I should take it? The Algorithm integration is mandatory for executives now..."

**Player Options**:
- "That's your choice to make." (neutral)
- "The money looks good." (practical)
- "Integration isn't for everyone." (warning)
- "Congratulations." (supportive)

### Complications (15%)
- Candidate isn't home (wait or reschedule)
- Candidate refuses package (return required)
- Competitor courier tries to intercept

### Hidden Flag
`CORPORATE_RECRUITMENT_DELIVERED` - May affect future Victor Huang interactions.

---

## JOB TEMPLATE 4: MEDICAL SECOND OPINION

### Overview
**Tier**: 3
**Type**: Medical/Personal
**Urgency**: Priority
**Pay**: 130 credits

### Briefing
```
JOB: Medical File Transfer
PICKUP: Integration Clinic
DROPOFF: Underground Doctor (Ghost)
PACKAGE: Patient medical files (copied)
DEADLINE: 2 hours
PAY: 130 credits
NOTE: Patient wants independent analysis. Clinic doesn't know about this.
```

### Pickup Flavor
**Patient Contact** (nervous): "My integration assessment is in here. The clinic says I'm a perfect candidate. But I've heard stories... [Hands file] The underground doc can tell me if they're hiding something."

### Dropoff Flavor
**Ghost** (underground doctor): "Another second opinion request. [Examines files] Smart. The clinics don't always disclose rejection risk factors. I'll review this. Tell your contact: two days for results."

### Complications (25%)
- Patient contact is being watched (meet elsewhere)
- Files are encrypted (Ghost handles it)
- Clinic security notices missing files (time pressure)

### Hidden Flag
`GHOST_DOC_REFERRALS` increments. Improves Ghost's opinion of player.

---

## JOB TEMPLATE 5: ALGORITHM ARTIFACT

### Overview
**Tier**: 3
**Type**: Research/Mysterious
**Urgency**: Standard
**Pay**: 160 credits

### Briefing
**Source**: Professor Yang (academic contact) or Anonymous
```
JOB: Research Material Transport
PICKUP: University back entrance
DROPOFF: Private collector
PACKAGE: Pre-Algorithm technology
DEADLINE: 4 hours
PAY: 160 credits
NOTE: Historical significance. Handle with care.
```

### Pickup Flavor
**Academic Contact**: "This device predates the Algorithm by decades. It's... remarkably similar to early Algorithm prototypes. The implications are uncomfortable for certain narratives. Hence the private sale."

### Dropoff Flavor
**Collector** (elderly, wealthy): "Beautiful. [Examines device] Before they told us the Algorithm was new. Before they told us it was safe. This little box tells a different story. Thank you, courier. History thanks you."

### Complications (20%)
- University security questions exit
- Device makes strange sounds (do not open)
- Collector wants to discuss history (optional conversation)

### Hidden Flag
`ALGORITHM_HISTORY_EXPOSED` - May affect later story revelations.

---

## JOB TEMPLATE 6: FACTION NEUTRAL ZONE

### Overview
**Tier**: 3
**Type**: Diplomatic
**Urgency**: Priority
**Pay**: 175 credits

### Briefing
**Source**: Chen (urgent notation)
```
JOB: Multi-Party Delivery
PICKUP: Neutral zone (Old Temple)
DROPOFF: Three factions (simultaneous)
PACKAGE: Identical sealed envelopes
DEADLINE: All three within 30 minutes of each other
PAY: 175 credits
NOTE: Timing matters. All parties must receive at roughly the same time.
```

### Pickup Flavor
**Neutral Arbiter** (Mother Mercy or similar): "Three factions. Three messages. Same content—meeting proposal. If one receives before others, trust breaks. You must deliver all three within the window. Can you do this?"

### Route Challenge
Player must plan efficient route to:
1. Convergence representative
2. Resistance representative
3. Corporate neutral party

### Dropoff Flavors
**Convergence**: "From the neutral zone? [Accepts] We'll review. No promises."
**Resistance**: "Another peace proposal? [Skeptical] Fine. We'll read it."
**Corporate**: "Neutrality is a fiction, but we'll play along. [Takes envelope] Meeting accepted. Provisionally."

### Complications (40%)
- One recipient isn't at expected location
- Traffic/obstacles threaten timing
- One faction tries to learn others' locations

### Hidden Flag
`FACTION_NEUTRALITY_MAINTAINED` - Affects future diplomatic missions.

---

## JOB TEMPLATE 7: INTEGRATION REVERSAL RESEARCH

### Overview
**Tier**: 3
**Type**: Medical/Underground
**Urgency**: Standard
**Pay**: 145 credits

### Briefing
**Source**: Ghost (underground doctor) or Resistance
```
JOB: Research Material Delivery
PICKUP: [Hidden lab]
DROPOFF: Medical researcher (anonymous)
PACKAGE: Integration reversal research data
DEADLINE: 3 hours
PAY: 145 credits
NOTE: This research is illegal. The contents could save lives. Or end yours if caught.
```

### Pickup Flavor
**Lab Tech**: "Reversal research. Preliminary, but promising. Someone integrated against their will deserves options. [Hands package] Corporate would burn this if they found it. Don't let them find it."

### Dropoff Flavor
**Researcher** (cautious, academic): "From the underground lab? [Examines] This is... this could work. With more funding, more testing... [To player] You understand what you're carrying? Hope. Dangerous hope."

### Complications (30%)
- Lab location has moved (redirect)
- Corporate patrol in research district
- Researcher is paranoid (verification required)

### Hidden Flag
`REVERSAL_RESEARCH_SUPPORTED` - Affects late-game options for integrated characters.

---

## JOB TEMPLATE 8: CONVERGENCE INVITATION

### Overview
**Tier**: 3
**Type**: Political (Convergence)
**Urgency**: Casual
**Pay**: 135 credits

### Briefing
**Source**: Convergence contact
```
JOB: Invitation Delivery
PICKUP: Convergence community center
DROPOFF: Multiple residences (5 addresses)
PACKAGE: Physical invitations (ceremonial)
DEADLINE: Today (flexible hours)
PAY: 135 credits
NOTE: These are joining ceremony invitations. Treat them with respect.
```

### Pickup Flavor
**Convergence Greeter**: "Welcome! These invitations are for souls ready to join our family. The Algorithm has chosen them. You're helping them take the next step. [Smiles] If you ever feel called yourself..."

### Dropoff Flavors (varied)
**Recipient 1**: "Finally! I've been waiting for this." (eager)
**Recipient 2**: "I... I'm not sure I'm ready." (hesitant)
**Recipient 3**: "My family doesn't approve. But I know this is right." (conflicted)
**Recipient 4**: [Accepts silently, tears in eyes]
**Recipient 5**: "Thank you. Today my life begins again." (peaceful)

### Complications (10%)
- One recipient has moved (forward to new address)
- Family member intercepts at one address (tension)

### Hidden Flag
`CONVERGENCE_INVITATIONS_DELIVERED` - May affect Convergence relationship.

---

## JOB TEMPLATE 9: CHROME CLINIC CONTRABAND

### Overview
**Tier**: 3
**Type**: Medical Gray Market
**Urgency**: Priority
**Pay**: 155 credits

### Briefing
**Source**: Dr. Sato (chrome clinic) or Patch
```
JOB: Medical Component Delivery
PICKUP: Salvage source
DROPOFF: Chrome clinic (back entrance)
PACKAGE: Unlicensed neural interfaces
DEADLINE: 1 hour
PAY: 155 credits
NOTE: Clinic needs these. Patients need these. Nakamura doesn't approve. You understand.
```

### Pickup Flavor
**Salvage Contact**: "Neural interfaces. Good ones. Fell off a corporate transport. [Winks] Or got pushed. Either way, clinic's been begging for these. Their legitimate supply is... restricted."

### Dropoff Flavor
**Dr. Sato**: "These are exactly what we needed. [Examines] Corporate limits our supplies to control who gets chrome. We believe everyone deserves options. Thank you for making that possible."

### Complications (25%)
- Checkpoint on route (creative avoidance)
- Components are fragile (careful handling)
- Clinic has inspection scheduled (timing critical)

### Hidden Flag
`SATO_CONTRABAND_RUNS` increments. Improves Sato's trust.

---

## JOB TEMPLATE 10: BASELINE SOLIDARITY

### Overview
**Tier**: 3
**Type**: Community
**Urgency**: Standard
**Pay**: 110 credits

### Briefing
**Source**: Marcus Cole "The Skeptic"
```
JOB: Community Network Delivery
PICKUP: Community center
DROPOFF: Multiple residences (8 addresses)
PACKAGE: Baseline support materials
DEADLINE: Today
PAY: 110 credits
NOTE: These are for people choosing to remain unintegrated. Support network materials.
```

### Pickup Flavor
**Marcus Cole**: "Baseline support packages. Resources, community contacts, legal aid information. For people who choose not to integrate. It's not anti-Algorithm—it's pro-choice. Big difference."

### Dropoff Flavor (varied)
**Recipients**: Range from grateful ("Finally, someone understands") to conflicted ("I haven't decided yet") to defensive ("I'm not against the Algorithm, I just want to wait").

### Complications (15%)
- One recipient has integrated since list was made (awkward)
- Neighbor at one address is aggressively pro-integration
- Materials questioned at checkpoint (technically legal)

### Hidden Flag
`BASELINE_SUPPORT_RUNS` increments. Affects Skeptic Marcus relationship.

---

## JOB TEMPLATE 11: CORPORATE WHISTLEBLOWER

### Overview
**Tier**: 3
**Type**: Espionage
**Urgency**: Priority
**Pay**: 200 credits

### Briefing
**Source**: Anonymous or Jerome Blackwell
```
JOB: Sensitive Document Transfer
PICKUP: Dead drop (corporate district)
DROPOFF: Journalist contact
PACKAGE: Internal corporate documents
DEADLINE: 2 hours
PAY: 200 credits
WARNING: If caught, you're on your own. High risk, high pay.
```

### Pickup Flavor
**Dead Drop**: Package waiting in specified location. No person. Note attached: "Get these to the journalist. People need to know. —A friend inside"

### Dropoff Flavor
**Journalist**: "From inside Nakamura? [Examines] Integration success rate manipulation. They've been hiding the failures. [To player] This is big. You're part of something important now. Whether you wanted to be or not."

### Complications (40%)
- Corporate security sweeps area during pickup
- Journalist location compromised (backup meeting point)
- Contents are shocking (player can read or not)

### Hidden Flag
`WHISTLEBLOWER_DOCUMENTS_DELIVERED` - Major story impact potential.

---

## JOB TEMPLATE 12: THE CHOICE CARRIER

### Overview
**Tier**: 3
**Type**: Personal/Philosophical
**Urgency**: Casual
**Pay**: 120 credits

### Briefing
**Source**: Elena Vasquez (recent integrator) or similar
```
JOB: Personal Message Delivery
PICKUP: Client residence
DROPOFF: Family member residence
PACKAGE: Sealed letter + small personal item
DEADLINE: Flexible
PAY: 120 credits
NOTE: Client recently integrated. Family doesn't approve. This might be a goodbye.
```

### Pickup Flavor
**Client** (integrated, peaceful): "My sister won't speak to me since I integrated. This letter... explains why I chose this. And this [hands item]—our grandmother's necklace. She should have it. Even if she hates me."

### Dropoff Flavor
**Sister** (hostile, then softening): "From [name]? I don't want—[Sees necklace] That's grandmother's. [Reads letter] ...She really believes it was the right choice. [To player] Tell her I... tell her I'll think about reading the rest."

### Complications (5%)
- Sister initially refuses delivery (persuasion or leave at door)

### Emotional Impact
This job has no combat or danger. The weight is entirely emotional—the player witnesses a family divided by the Algorithm choice.

### Hidden Flag
`ALGORITHM_FAMILY_RECONCILIATION` - Small flag for emotional story tracking.

---

## TEMPLATE USAGE NOTES

### Tier 3 Themes
- Algorithm awareness (every job touches the central question)
- Faction introduction (Convergence, Resistance, Corporate, Neutral)
- Moral complexity (no clear right answers)
- Player choice matters (options in dialogue affect relationships)

### Frequency Distribution
- Jobs 1, 3, 8: Pro-integration/corporate leaning
- Jobs 2, 7, 10, 11: Resistance/skeptic leaning
- Jobs 4, 5, 6, 9, 12: Neutral/complex

### Flag Integration
Every job affects at least one relationship or story flag. Tier 3 is where choices begin to accumulate.

### Scaling
- Pay: ±20% based on player reputation
- Complications: Probability adjustable by difficulty
- Dialogue options: Some locked by prior choices

---

*Tier 3 Job Templates v1.0*
*Phase 7 Day 1*
*12 Algorithm-era procedural jobs*
