# Side Quest: Ghost Network Extraction

## Quest Metadata

- **Quest ID**: SQ_GHOST_NETWORK_EXTRACTION
- **Quest Name**: "Ghost Network Extraction" / "The Disappeared"
- **Type**: Faction Quest (Ghost Network)
- **Tier Availability**: 6-8
- **Estimated Duration**: 25-30 minutes
- **Location**: Multiple (Uptown Corporate, The Interstitial, Red Harbor Safe House)
- **Key NPCs**: Phantom, Dr. Eliza Voss (extraction target), Nakamura Security, Ghost Network Operatives (3)

## Prerequisites

- **Required**:
  - `PHANTOM_RELATIONSHIP >= 10` (established contact with Ghost operative)
  - `TIER_5_COMPLETE = true` (player has access to Uptown areas)
  - `INTERSTITIAL_DISCOVERED = true` (player knows Ghost Network exists)

- **Optional Enhancers**:
  - `NAKAMURA_HOSTILITY <= 10` (low corpo attention makes infiltration easier)
  - `STEALTH_AUGMENTS = true` (player has stealth-focused chrome)
  - `TANAKA_RESEARCH_COMPLETE = true` (provides false identity medical records)
  - `UNION_STRIKE_OUTCOME = "total_victory"` (Nakamura distracted by labor issues)

## Synopsis

Phantom contacts the player with an urgent extraction request: Dr. Eliza Voss, a Nakamura Biotech senior researcher, wants out. She's been working on Ascension neural upload protocols for 8 years and recently discovered the truth—upload doesn't preserve consciousness, it creates a sophisticated simulation that *believes* it's the original person. The upload is essentially death with a chatbot replacement.

Voss tried to report her findings internally. Nakamura classified her research and placed her under "protective observation"—24/7 surveillance, restricted to corporate campus, communications monitored. She managed one encrypted message to the Ghost Network: "Get me out. I have proof. They're going to disappear me."

The Ghost Network will extract her, but they need someone with Uptown access and plausible deniability to make contact, coordinate the extraction, and escort her through the most dangerous phase—the corporate district itself. That's the player.

The quest explores the cost of knowing too much, the courage of whistleblowing, and whether the Ghost Network's methods (individual extraction, abandoning your life) are victory or surrender.

## Story Context & Themes

### Thematic Role
- **Core Theme**: Truth vs. comfortable lies—what do you do when you learn the system is worse than you imagined?
- **Secondary Theme**: Individual resistance (Ghost Network extraction) vs. collective resistance (Union organizing)
- **Narrative Function**:
  - Reveals Ascension horror: upload is death, not transcendence
  - Establishes Ghost Network as viable resistance infrastructure
  - Provides critical information for Tier 10 ending choices
  - Tests player's stealth/infiltration skills and moral courage

### Character Development (Phantom)
- **Before Quest**: Mysterious Ghost operative, 100% success rate
- **During Quest**: Reveals operational methods, personal philosophy (save who you can)
- **After Quest**: Becomes trusted ally OR disillusioned if extraction fails
- **Relationship Arc**: Professional respect → Trust → Camaraderie or Grief

### World-Building
- **Reveals**: Ascension upload mechanics (consciousness death confirmed)
- **Establishes**: Corporate "protective observation" = soft imprisonment
- **Connects**: Links individual courage (Voss) to resistance infrastructure (Ghost Network)
- **Foreshadows**: Tier 10 choice—upload is not salvation, it's obliteration

## Narrative Beats

### Beat 1: The Contact
**Location**: The Interstitial (hidden sector, Phantom's safehouse)
**Trigger**: Phantom sends encrypted message at Tier 6+, PHANTOM_RELATIONSHIP >= 10

**Scene**:
Phantom's safehouse is minimalist: one table, three chairs, holographic display, emergency exit. Phantom is standing, reviewing surveillance footage of Nakamura corporate campus.

**Dialogue** (Phantom):
> "Time-sensitive job. Dr. Eliza Voss—Nakamura Biotech senior researcher, Ascension Division. She wants out."
>
> *(Shows holographic profile: Voss, 42, thin, exhausted-looking)* "She's been working on neural upload protocols for eight years. A month ago, she discovered something. Upload doesn't preserve consciousness—it terminates it. Creates a simulation that thinks it's you, but you... you're gone."
>
> *(Pulls up internal Nakamura memo)* "She reported her findings to senior management. They classified her research, locked her down. 'Protective observation.' That's corpo-speak for house arrest."
>
> "She got one message out: 'Get me out. I have proof. They're going to disappear me.' She's right. Nakamura disappears inconvenient researchers. Industrial accident, stress-related suicide, random street violence. Always tragic. Never suspicious."
>
> *(Looks at player)* "Ghost Network will extract her. But we need someone with Uptown access—someone who can make contact, coordinate timing, and get her through the corporate district without triggering lockdown. That's you."
>
> "This is what we do. We save the ones who know too much. You in?"

**Player Responses**:
1. **"Tell me the plan."** → Proceeds to briefing
2. **"Why me specifically?"** → Phantom: "You have Uptown access, corpo familiarity, and deniability. You're not known Ghost."
3. **"What proof does she have?"** → Phantom describes: raw neural scan data, comparative analysis, internal memos
4. **"What happens if we fail?"** → Phantom: "She disappears. And the proof disappears with her. Thousands keep uploading, thinking it's salvation."
5. **[If YAMADA_ENCOUNTERED] "Yamada wouldn't agree."** → Phantom: "Yamada is uploaded in all but body. He's already gone."

### Beat 2: The Plan
**Location**: Phantom's Safehouse
**Decision Point**: Player receives extraction plan details

Phantom lays out the three-phase operation:

**Phase 1: Make Contact**
> "Voss is restricted to Nakamura campus—primarily the Ascension Division research wing, Floor 92. She has limited freedom within the building, but all communications are monitored."
>
> "You'll infiltrate the campus, pose as [cover identity], make contact, and give her the extraction signal: 'The Interstitial sends its regards.' She'll know we're coming."

**Phase 2: Create Extraction Window**
> "Voss is under 24/7 surveillance—digital monitoring, physical escorts, scheduled check-ins. We need to create a gap. Options:"
>
> - **Digital Blackout**: Hack Nakamura security systems, create 10-minute blind spot (TECH check)
> - **Physical Distraction**: Stage incident elsewhere in building, pull security resources (requires coordination)
> - **Medical Emergency**: Fake Voss health crisis, evacuate her to ground level (requires medical knowledge/items)
> - **Social Engineering**: Convince security Voss has authorized off-campus meeting (CHARISMA check, difficult)

**Phase 3: Extraction & Escort**
> "Once we have a window, Voss moves. Ghost team will be waiting at Uptown-Red Harbor border—neutral ground. But she has to get through corporate district without triggering alarm. That's the most dangerous phase. You'll escort her."
>
> "Nakamura will realize she's gone within 30-40 minutes. When they do, they'll lock down Uptown exits, activate facial recognition, deploy security teams. You need to be out before that happens."

**Player Responses**:
1. **"I'm ready. Let's do this."** → Proceeds to Phase 1
2. **"What cover identity do I use?"** → Phantom offers options (see Phase 1)
3. **"What if Nakamura catches us?"** → Phantom: "Deny everything. You were there on unrelated business. Voss acted alone. We protect the Network."
4. **"Can I bring backup?"** → Phantom: "No. More people = more attention. Solo is safest."

### Beat 3A: Phase 1 - Make Contact
**Location**: Nakamura Tower, Floor 92 (Ascension Research Wing)
**Duration**: 8-10 minutes

**Infiltration Approach**:

**Cover Identity Options** (Player chooses):

1. **Corpo Contractor** (Maintenance/IT):
   - Phantom provides fake credentials (technician, scheduled system check)
   - STEALTH checks to avoid scrutiny
   - Pros: Mundane, low suspicion
   - Cons: Limited access, must avoid detailed questioning

2. **Medical Courier** (Biotech delivery):
   - Pose as delivering medical samples to Floor 92
   - Requires lab coat, sample case (Phantom provides)
   - CHARISMA checks to seem professional
   - Pros: Direct access to research wing
   - Cons: Credentials checked more carefully

3. **Corporate Auditor** (Financial/Compliance):
   - Pose as internal auditor reviewing division expenses
   - Requires business attire, data pad (Phantom provides)
   - CHARISMA + TECH checks to seem authoritative
   - Pros: High access, people avoid auditors
   - Cons: Most difficult to pull off, requires corpo knowledge

4. **Research Colleague** (Academic Visitor - Hidden Option):
   - [Only if TANAKA_RESEARCH_COMPLETE]: Pose as researcher collaborating on neural mapping
   - Tanaka provides false academic credentials
   - TECH checks to discuss research convincingly
   - Pros: Direct access to Voss, can speak privately
   - Cons: Requires specific knowledge

**Execution**:
1. **Entry**: Player enters Nakamura Tower, passes lobby security (ID check—STEALTH or CHARISMA)
2. **Elevator to 92**: Ascension Division floors require clearance (fake credentials must work—TECH check if questioned)
3. **Research Wing**: Sterile white corridors, researchers in labs, security checkpoints
4. **Locate Voss**: She's in Lab 92-C (neural simulation testing chamber)
5. **Make Contact**: Player must approach without alerting her security escort
   - Option A: Wait for bathroom break (she's alone for 3 minutes)
   - Option B: Distract escort with false emergency call (TECH hack)
   - Option C: Bold approach—walk directly into lab, pretend legitimate business (CHARISMA)

**Contact Scene**:
Player finds Voss alone (briefly). She looks exhausted, paranoid.

**Dialogue** (Player delivers code phrase):
> "The Interstitial sends its regards."

**Voss** (relief, barely suppressed):
> *(Whispers)* "You're real. I thought... I've been watched for 27 days. I wasn't sure the message got out."
>
> *(Glances at door)* "I have the proof. Neural scan data, comparative analysis. Upload doesn't preserve consciousness—it maps it, terminates the original, runs the simulation. The person is dead. The simulation doesn't know it's not real."
>
> *(Urgent)* "Nakamura knows I know. They're going to 'transition me to remote work' next week. That's when I disappear. When do we move?"

**Player Responses**:
1. **"Tonight. Be ready at [time]."** → Sets extraction timing
2. **"How closely are you watched?"** → Voss explains: escort during work hours, monitored apartment at night, scheduled check-ins every 4 hours
3. **"Do you have the proof on you?"** → Voss: "Data chip, surgically implanted under my collarbone. They can't find it without invasive scan."
4. **"Are you sure you want to do this?"** → Voss: "I've spent eight years helping them kill people. I'm sure."

**Complication** (50% chance):
- Security escort returns early
- Player must exit naturally (continue cover role) OR fast-talk explanation (CHARISMA check)
- If failed: Security becomes suspicious, increases surveillance (Phase 2 more difficult)

### Beat 3B: Phase 2 - Create Extraction Window
**Location**: Various (depending on chosen method)
**Duration**: 8-10 minutes

**Player must create a gap in Voss's surveillance. Multiple methods:**

**Method 1: Digital Blackout** (TECH-focused)
- **Execution**:
  - Hack Nakamura security network (TECH check, Difficulty 6—high security)
  - Target Floor 92 surveillance system specifically (avoid building-wide alert)
  - Create 10-minute loop (cameras show empty corridors, no Voss)
  - Timing critical: Voss must move during blackout
- **Pros**: Clean, no physical confrontation
- **Cons**: High TECH requirement, if failed triggers immediate lockdown
- **Outcome**: 10-minute window for extraction

**Method 2: Physical Distraction** (Combat/Chaos-focused)
- **Execution**:
  - Stage incident elsewhere in tower (Fire alarm Floor 40, bomb threat, etc.)
  - Coordinate with Ghost Network operatives (Phantom provides 2 agents)
  - Security pulls resources from Floor 92 to respond
  - Voss's escort is temporarily alone/distracted
- **Pros**: Doesn't require high TECH skill
- **Cons**: High chaos, increases corpo alert level building-wide
- **Outcome**: 12-15 minute window, but building on high alert

**Method 3: Medical Emergency** (Deception-focused)
- **Execution**:
  - Dose Voss's coffee with harmless tachycardia stimulant (Phantom provides)
  - Voss stages heart attack symptoms during work hours
  - Corpo medical evacuates her to ground floor medical wing
  - Player intercepts during transport (medical wing closer to exit)
- **Pros**: Natural, low suspicion initially
- **Cons**: Requires player to access Voss's workspace, Voss must convincingly fake symptoms
- **Outcome**: 15-20 minute window, but medical staff involved (more witnesses)

**Method 4: Bureaucratic Confusion** (Social Engineering)
- **Execution**:
  - Create false authorization for Voss to attend off-campus meeting
  - Requires forging executive signatures (TECH check) OR convincing executive assistant (CHARISMA check)
  - Voss's escort accompanies her initially, must be ditched during transport
  - Player coordinates "accidental" separation (traffic incident, crowd, etc.)
- **Pros**: Legitimate paper trail initially (buys time before alarm)
- **Cons**: Complex, multiple failure points
- **Outcome**: 20-25 minute window, but escort realizes separation within 10 minutes

**Player Chooses Method**:
Depending on skills/preferences. Each method has different risk/reward profiles.

**Outcome**:
- **Success**: Voss is free for [time window], proceeds to Phase 3
- **Partial Success**: Window created but shorter/more chaotic than planned
- **Failure**: Alarm triggered, quest pivots to emergency extraction (combat-heavy)

### Beat 3C: Phase 3 - Extraction & Escort
**Location**: Uptown Corporate → Red Harbor Border
**Duration**: 10-12 minutes

**The Escape**:
Player must escort Voss from Nakamura Tower (Uptown) to Red Harbor border extraction point without triggering corpo lockdown.

**Route Options**:

**Route 1: Public Transit** (Low Profile)
- Take corpo maglev train to Red Harbor (8-minute ride)
- Blend with corporate commuters
- STEALTH checks to avoid recognition (Voss is nervous, draws attention)
- **Risk**: Facial recognition at stations (20% chance each stop)
- **Pros**: Fast, direct route
- **Cons**: High-tech surveillance, trapped if alarm sounds mid-transit

**Route 2: Ground Vehicle** (Medium Profile)
- Steal/commandeer corpo vehicle (parking garage)
- Drive through Uptown streets to Red Harbor
- Requires TECH (hotwire vehicle) OR combat (take from driver)
- **Risk**: Traffic checkpoints (2 checkpoints, ID checks)
- **Pros**: Mobile, can evade if spotted
- **Cons**: Visible, checkpoint delays

**Route 3: Rooftops & Service Corridors** (High Difficulty)
- Navigate Uptown via building interiors, rooftop bridges, maintenance tunnels
- Avoid public surveillance entirely
- STEALTH + REFLEX checks (climbing, jumping, sneaking)
- **Risk**: Physical danger (falls, dead ends, security patrols)
- **Pros**: Minimal surveillance, harder to track
- **Cons**: Slow, exhausting for Voss (not augmented for athletics)

**Route 4: Ghost Network Tunnel** (Hidden Option)
- [Only if INTERSTITIAL_DISCOVERED = true AND PHANTOM_RELATIONSHIP >= 20]
- Phantom reveals hidden entrance: maintenance tunnel system connecting Uptown to Interstitial
- Direct underground route, bypasses all surveillance
- TECH check to navigate tunnel systems (complex, easy to get lost)
- **Risk**: Claustrophobic, dark, some areas flooded
- **Pros**: Completely off-grid, zero surveillance
- **Cons**: Requires specific knowledge, physically demanding

**Dynamic Event - Alarm Timing**:
Based on Phase 2 method, alarm triggers at different times:
- **Digital Blackout**: 15-20 minutes after extraction starts (when loop discovered)
- **Physical Distraction**: 10-15 minutes (when false emergency cleared)
- **Medical Emergency**: 18-22 minutes (when medical staff realizes Voss vanished)
- **Bureaucratic Confusion**: 25-30 minutes (when escort reports separation)

**If Alarm Triggers During Escape**:
- Uptown exits locked down (checkpoints activated)
- Facial recognition goes active (Player + Voss flagged)
- Corpo security teams deployed (6-8 officers, combat encounter if caught)
- **Player Options**:
  - Fight through checkpoint (combat, REFLEX checks)
  - Hack checkpoint locks (TECH check, time pressure)
  - Disguise/stealth past (STEALTH check, very difficult with Voss)
  - Abort to Ghost Network tunnel (if available, emergency pivot)

**Escort Challenges - Voss's Limitations**:
Voss is not combat-trained or heavily augmented. Player must account for:
- **Slow movement**: Voss can't sprint long distances (pacing matters)
- **Panic risk**: If combat occurs, Voss may freeze (CHARISMA check to calm her)
- **Conspicuous**: Well-dressed corporate researcher stands out in working-class areas
- **Tracked**: Data chip in her body might have passive RFID (Phantom warns—needs to be extracted safely later)

### Beat 4: The Handoff
**Location**: Red Harbor Border (Ghost Network extraction point, abandoned warehouse)
**Duration**: 3-5 minutes

**Scene**:
Player and Voss reach extraction point—an abandoned Red Harbor warehouse near the district border. Phantom is waiting with two Ghost Network operatives (medic, tech specialist).

**If Extraction Successful** (arrived before full lockdown):
Phantom greets them:
> *(To Voss)* "Dr. Voss. You're safe now. Welcome to the disappeared."
>
> *(To Player)* "Clean work. No casualties, minimal attention. That's how it's done."
>
> *(Gestures to medic)* "Chen here will remove that data chip—local anesthetic, 10 minutes. Then we move you to the Interstitial. New identity, new life. You'll continue your research where it matters—proving Ascension is murder."

**Voss** (emotional, exhausted):
> "I've lost everything. My career, my apartment, my reputation. Nakamura will call me a thief, a traitor."
>
> *(Looks at player)* "But I'm alive. And I have the truth. That's worth everything I lost."

**If Extraction Chaotic** (alarm triggered, combat occurred):
Phantom is tense:
> "That was louder than planned. Nakamura will be hunting. We need to move fast."
>
> *(To Voss)* "You're safe now, but we're burning this extraction point. Can't use it again. Higher cost than expected."
>
> *(To Player)* "Still, you got her out. Under fire, that's not easy. You did good."

**Data Chip Extraction**:
- Ghost medic surgically removes chip from Voss's collarbone
- Player can watch procedure (graphic medical description, optional)
- Chip contains: 847 neural scan files, comparative analysis, internal Nakamura memos
- **Proof confirmed**: Upload terminates consciousness, creates simulation artifact

**Voss's Final Words** (to player):
> "Tell people. If you can. The ones climbing the Tiers—they think Ascension is transcendence. It's not. It's death with a chatbot funeral."
>
> "I spent eight years helping Nakamura sell oblivion. Now I'll spend the rest of my life proving what it really is."

**Phantom** (to player):
> "This is what the Ghost Network does. One person at a time. We can't change the system—but we can save the ones who see through it."
>
> *(Hands player a commlink)* "You're one of us now. When someone needs out, we'll call."

## Quest Completion

### Epilogue - Success Outcomes

**Location**: The Interstitial (days later)

**Clean Extraction** (no alarm OR alarm triggered late):
- Player visits Interstitial, sees Voss working in makeshift research lab
- Voss: "I'm ghost now. But I'm free. And my research will live here—where it can't be buried."
- Ghost Network reputation surges (known as reliable, effective)
- Voss's proof circulates underground: "Ascension is Death" becomes resistance slogan

**Chaotic Extraction** (alarm triggered early, combat occurred):
- Voss is safe but shaken
- Ghost Network extraction point compromised (can't be reused)
- Higher corpo alert: Nakamura increases security, future extractions harder
- Voss still working on research, but resources limited

### Epilogue - Failure Outcome

**If Voss Captured**:
- News report (3 days later): "Dr. Eliza Voss, Nakamura researcher, died in apartment fire. Investigators cite accidental electrical malfunction."
- Phantom is bitter: "She knew too much. They removed the problem. This is what happens when we fail."
- PHANTOM_RELATIONSHIP -15, Ghost Network trust damaged
- Voss's proof is lost (critical information unavailable for Tier 10 choices)

**If Player Captured** (arrested during extraction):
- 48-hour detention, interrogation
- Nakamura can't prove Ghost Network involvement (player denies everything)
- Released with warning: "Stay away from corporate personnel"
- Voss disappears (presumed killed), player failed
- NAKAMURA_HOSTILITY +40

## Consequences & Story Flags

### Story Flags Set

```
GHOST_NETWORK_EXTRACTION_COMPLETE = true
VOSS_EXTRACTED = true/false
VOSS_PROOF_OBTAINED = true/false (critical for endings)
ASCENSION_TRUTH_KNOWN = true (player knows upload = death)
GHOST_NETWORK_MEMBER = true (player is officially part of network)
EXTRACTION_METHOD = "clean" / "chaotic" / "failed"
NAKAMURA_LOCKDOWN_TRIGGERED = true/false
```

### Relationship Changes

- `PHANTOM_RELATIONSHIP`: +25 (clean extraction) to -15 (failure)
- `GHOST_NETWORK_REPUTATION`: +30 (success) to -10 (failure)
- `NAKAMURA_HOSTILITY`: +15 (clean) to +40 (chaotic/captured)
- `VOSS_GRATITUDE`: +50 (if extracted—she becomes ally)

### World State Changes

- **If Successful**:
  - Voss's proof circulates in resistance networks (Interstitial, Ghost, Union)
  - NPCs reference "that researcher who proved Ascension is fake"
  - Yamada's recruitment pitch becomes harder (player can counter with facts)
  - Underground media publishes exposé: "Upload or Oblivion?"

- **If Failed**:
  - Corpo media reports Voss's "accidental death"
  - Ghost Network is more cautious (fewer extraction missions offered)
  - Yamada's pitch remains unchallenged (no counter-evidence)

### Ending Impacts

**Ascension Ending** (Tier 10: The Uploaded):
- **BLOCKED if VOSS_PROOF_OBTAINED = true AND player reviews it**: Player cannot choose upload with full knowledge it's death
- **Alternative**: Player can still choose upload, but game treats it as suicide (tragic ending, not transcendent)

**Third Path Ending** (Tier 10: The Balanced):
- **ENHANCED if VOSS_PROOF_OBTAINED = true**: Voss's research supports Third Path philosophy (balance without upload)
- Voss appears in ending: Works with Tanaka on humane augmentation

**Rogue Ending** (Tier 10: The Exile):
- **ENHANCED if GHOST_NETWORK_MEMBER = true**: Player has Ghost Network support, extraction resources
- Easier to disappear, stronger off-grid community

## Rewards

### Experience
- **Base XP**: 4,000 XP
- **Bonus XP**:
  - +800 XP for clean extraction (no alarm, no combat)
  - +600 XP for successful combat extraction (alarm triggered but escaped)
  - +400 XP for using Ghost tunnel route (hidden path)

### Credits
- **Direct Payment**: Ghost Network pays 8,000 credits (extraction fee)
- **Bonus**: +5,000 credits if clean extraction (efficiency bonus)

### Items
- **Ghost Network Commlink** (Key Item):
  - Encrypted communication device
  - Access to Ghost Network missions and services
  - Can request extraction for NPCs (costs 15k-30k credits depending on difficulty)

- **Voss's Research Chip** (Readable Item):
  - Contains full proof of Ascension consciousness death
  - 847 neural scan files, comparative analysis
  - Can be shared with NPCs for massive relationship bonuses (Tanaka +20, Okonkwo +20, Lopez +15)
  - Reading it provides philosophical insight (+2 to persuasion checks regarding Ascension)

- **Corporate District Map** (Utility Item):
  - Detailed Uptown layout (extracted during infiltration)
  - Reveals hidden routes, maintenance tunnels, security blind spots
  - +10% STEALTH in Uptown areas

### Reputation
- **Ghost Network**: +30 reputation (trusted operative)
- **The Interstitial**: +20 reputation (saved ally)
- **Nakamura Corp**: -15 to -40 reputation (depending on extraction chaos)
- **Underground Resistance**: +15 reputation (word spreads about successful extraction)

### Unlocked Content
- **Ghost Network Missions**: 2-3 additional extraction quests unlock
- **Interstitial Services**: Access to Ghost Network services (identity change, extraction, off-grid tech)
- **Voss Research Access**: Can consult Voss about Ascension mechanics in future

## Dialogue Estimates

- **Phantom**: 200-240 lines (mission giver, coordinator, multiple outcomes)
- **Dr. Voss**: 120-150 lines (contact scene, escape dialogue, epilogue)
- **Nakamura Security**: 80-100 lines (infiltration encounters, checkpoints, combat)
- **Ghost Network Operatives** (3 NPCs): 60-80 lines combined (medic, tech, escorts)
- **Background NPCs** (corporate workers, station attendants): 40-60 lines
- **News Reports**: 20-30 lines (success or failure reporting)

**Total Estimated Dialogue**: 520-660 lines

## Writer Notes

### Tone Considerations
- **Phantom's Voice**: Professional detachment masking deep commitment (saves people, doesn't get attached)
- **Voss's Voice**: Exhausted idealist, scientist who discovered moral horror, terrified but resolute
- **Corpo Antagonism**: Impersonal evil—Nakamura isn't hunting Voss personally, just removing liability
- **Ghost Network Philosophy**: "We can't save everyone, but we save the ones we can reach"

### Gameplay Balance
- High-stakes (extraction failure = NPC death, critical info lost)
- Multiple skill paths viable (TECH, STEALTH, CHARISMA, COMBAT all useful)
- Failure is costly but not game-breaking (story continues, darker)
- Rewards justify risk (proof of Ascension truth = massive narrative payoff)

### Narrative Integration
- **Critical for**: Understanding Ascension ending (upload = death, not transcendence)
- **Contrasts with**: Union quest (collective vs. individual resistance)
- **Foreshadows**: Tier 10 choice—abandon system (extraction) or transform it (Third Path)
- **Echoes**: Whistleblower/refugee narratives, personal courage against power

### Ascension Horror Mechanics
- Voss's proof is scientifically grounded (not philosophical debate—empirical fact)
- Upload process:
  1. Neural map created (perfect snapshot of consciousness)
  2. Original consciousness terminated (brain death)
  3. Simulation runs (believes it's the original, has all memories, personality)
  4. Original person is dead, simulation is a sophisticated chatbot
- This makes Ascension ending genuinely tragic (not ambiguous—it's suicide with digital afterimage)

### Character Voice - Phantom
**Established Traits**: Professional, forgettable (neural scrambler), 100% success rate, detached
**Quest Development**: Shows emotional investment (hides it behind professionalism), admits cost of failure
**Dialogue Style**: Concise, tactical, avoids emotional language (but subtext is caring)

Example dialogue:
> "I've extracted 127 people. Researchers, whistleblowers, dissidents. Each one lost everything—career, family, identity. But they're alive. That's the job. We're not saving lives—we're offering second chances to people who know too much."

### Cross-References
- **Related Quests**:
  - Yamada's Recruitment (ideological antagonist—Yamada sells Ascension, Voss proves it's death)
  - Main Quest Tier 10 (Voss's proof critical for informed ending choice)
  - Tanaka's Research (both involve ethical science vs. corpo exploitation)

- **Related Characters**:
  - Phantom (central character, relationship development)
  - Dr. Eliza Voss (extraction target, future ally)
  - Yamada (ideological opponent, not present but referenced)
  - Okonkwo (will discuss Voss's findings in Third Path context)

- **Related Locations**:
  - Nakamura Tower (infiltration target, Floor 92)
  - The Interstitial (Ghost Network base, Voss's new home)
  - Uptown Corporate (escape route, surveillance state)
  - Red Harbor (extraction point, border zone)

## Alternative Outcomes / Failed States

### Voss Captured Mid-Extraction
- If player fails escort (combat loss, checkpoint capture):
  - Voss is returned to Nakamura custody
  - News report (days later): "Researcher dies in accident"
  - Ghost Network fails mission (rare failure, damages reputation)
  - Player suffers guilt dialogues (NPCs comment on failure)

### Player Betrays Ghost Network (Hidden Failure)
- Player can contact Nakamura mid-mission, reveal extraction plan:
  - Payment: 30,000 credits + NAKAMURA_LOYALTY +40
  - Consequence: Voss captured and killed, PHANTOM_RELATIONSHIP set to -100 (permanent enemy)
  - Ghost Network learns of betrayal: Player hunted by Ghost operatives (3 assassination attempts)
  - Locked out of Third Path ending (requires Ghost alliance)
  - Locked out of Rogue ending (can't disappear without Ghost Network)
  - Only Ascension ending available (bitter irony—player who betrayed truth can only choose oblivion)

### Voss Changes Mind (Rare Outcome)
- If extraction is extremely chaotic (multiple combat encounters, civilian casualties):
  - Voss may panic and abandon extraction: "This is too much violence. I can't be responsible for this."
  - Player must convince her to continue (CHARISMA check, very difficult)
  - If failed: Voss returns to Nakamura, accepts her fate
  - Alternative: Player can forcibly extract her (kidnap), but PHANTOM_RELATIONSHIP -10 (violates consent principle)

## Speedrun Route

**Fastest Path** (Optimal skills/resources):
1. **Contact Phase**: Use Research Colleague cover (if TANAKA_RESEARCH_COMPLETE), direct lab access (3-4 minutes)
2. **Extraction Window**: Digital blackout (TECH check success, instant 10-minute window)
3. **Escape Route**: Ghost Network tunnel (if PHANTOM_RELATIONSHIP >= 20, fastest + safest, 6-8 minutes)
4. **Handoff**: Clean extraction, no complications
**Estimated Time**: 18-22 minutes
**Requirements**: TECH >= 7, PHANTOM_RELATIONSHIP >= 20, TANAKA_RESEARCH_COMPLETE

**Resource-Heavy Path** (Low skill, high credits):
1. **Contact Phase**: Pay Delilah for security bypass intel (5k credits, easier entry)
2. **Extraction Window**: Hire distraction team (10k credits, Phantom arranges, guaranteed success)
3. **Escape Route**: Stolen corporate vehicle with fake plates (8k credits, ready to use)
4. **Handoff**: Clean extraction
**Estimated Time**: 22-25 minutes
**Total Cost**: ~23,000 credits (expensive but reliable)

## Quest Hook Delivery

### How Players Discover This Quest

**Primary Hook**: Phantom's encrypted message
- Player receives commlink message at Tier 6+
- Phantom: "Urgent extraction. Meet me at [Interstitial location]. Time-sensitive."

**Secondary Hook**: Interstitial rumors
- NPCs in Interstitial mention "researcher who wants out"
- Player investigates, leads to Phantom

**Tertiary Hook**: Yamada contrast (if YAMADA_ENCOUNTERED = true)
- After meeting Yamada, player can ask Phantom about Ascension
- Phantom: "Funny you ask. I've got a researcher who discovered what Ascension really does. Want to help get her out?"

**Hidden Hook**: Tanaka reference (if TANAKA_RELATIONSHIP >= 30)
- Tanaka mentions knowing a Nakamura researcher with concerning findings
- Tanaka: "If you have Ghost Network contacts, she could use help."

## Replayability Notes

**Multiple Playthroughs**:
- Each route reveals different aspects:
  - Digital blackout: High-tech corpo security systems
  - Physical distraction: Ghost Network operational tactics
  - Medical emergency: Corporate medical protocols
  - Bureaucratic confusion: Corpo administrative vulnerabilities

**Moral Variance**:
- Players can approach from different philosophies:
  - Principled: Clean extraction, no collateral damage, high difficulty
  - Pragmatic: Accept some chaos/casualties for success
  - Ruthless: Forcible extraction, ignore Voss's consent, fastest but morally costly
  - Betrayal: Sell out Ghost Network for corpo favor (darkest path)

**Skill Variance**:
- TECH-focused: Digital blackout + tunnel route (stealthiest)
- COMBAT-focused: Physical distraction + fight through checkpoints (loudest)
- CHARISMA-focused: Bureaucratic confusion + social engineering (cleverest)

## Meta Notes

**Word Count**: ~5,800 words
**Complexity**: Very High (infiltration mechanics, escort mission, branching routes, moral weight)
**Integration Level**: Critical (Voss's proof essential for informed Tier 10 choice)
**Estimated Implementation Time**: Major (requires Nakamura Tower Floor 92 assets, multiple NPC models, complex pathing systems, escort AI)

**Playtester Focus Areas**:
- Does escort mission feel tense or tedious? (Voss pacing)
- Is infiltration discoverable? (cover identity options clear?)
- Does Ascension revelation feel earned or heavy-handed?
- Is betrayal route too dark? (permanent consequences)
- Are failure states fair? (Voss death is permanent loss)

---

**Related Files**:
- Character: `/01_CHARACTERS/tier_7-9_npcs/phantom_ghost_network.md`
- Character: `/01_CHARACTERS/tier_7-9_npcs/yamada_corpo_recruiter.md` (ideological contrast)
- Character: `/01_CHARACTERS/tier_0-3_npcs/dr_tanaka.md` (optional assist)
- Location: `/05_WORLD_TEXT/locations/specific/the_interstitial.md`
- Location: `/05_WORLD_TEXT/locations/specific/nakamura_tower.md`
- Location: `/05_WORLD_TEXT/locations/districts/uptown_corporate.md`
- Ending: `/04_ENDINGS/tier_10_the_uploaded.md` (Voss's proof impacts this ending critically)
- Side Quest: `/03_QUESTS/side_quests/tanakas_research.md` (scientific ethics parallel)

**Quest Design Philosophy**: Escort missions are often frustrating—make Voss capable enough to not be a burden, but vulnerable enough that player feels protective. The stakes are genuinely high (NPC can permanently die, critical info can be lost), so success feels earned. This quest should make players question Ascension ending emotionally AND intellectually.
