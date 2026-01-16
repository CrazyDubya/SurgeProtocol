# SURGE PROTOCOL: Faction Warfare System
## Asymmetric Multiplayer Conflict Engine

---

# 1. FACTION ARCHITECTURE

## 1.1 The Three Wars

The world of Surge Protocol contains three simultaneous conflicts:

| War | Combatants | Stakes | Player Role |
|-----|------------|--------|-------------|
| **Street War** | Gangs vs Corps vs Government | Territory, resources, survival | Direct participant |
| **Shadow War** | Rogues vs Algorithm vs Independents | Freedom, identity, humanity | Agent/recruit |
| **Ascension War** | Synthesis-7 vs Assimilationists vs Fragmentists | Future of consciousness | Pawn → player |

Players can engage with one, two, or all three wars depending on Tier and choices.

## 1.2 Faction Types

```
FACTION CLASSIFICATION
├── MEGACORP (3) - Global reach, vast resources, rigid hierarchy
├── CORPORATION (12) - Regional power, specialized focus
├── GOVERNMENT (4) - Legal authority, bureaucratic, territorial
├── LAW ENFORCEMENT (6) - Armed response, investigation, containment
├── GANG (25+) - Street-level, territorial, violent
├── SYNDICATE (8) - Organized crime, sophisticated, networked
├── COLLECTIVE (10) - Ideological, decentralized, passionate
├── ALGORITHM FACTION (5) - Post-human, hidden, manipulative
└── ROGUE NETWORK (3) - Anti-system, hunted, desperate
```

---

# 2. REPUTATION SYSTEM

## 2.1 Dual-Track Reputation

Every faction tracks TWO reputation scores per player:

```
VISIBLE REPUTATION (Public Standing)
- What the faction officially thinks of you
- Affects: Mission availability, prices, NPC reactions
- Range: -100 (Kill on Sight) to +100 (Exalted)
- Decay: 1 point/week toward neutral

HIDDEN REPUTATION (True Assessment)
- What the faction actually knows about you
- Affects: Hidden missions, betrayal triggers, assassination priority
- Range: -100 (Marked for Death) to +100 (Inner Circle)
- Decay: None (permanent record)
```

### Reputation Divergence

When Visible and Hidden diverge significantly:

| Gap | Status | Effect |
|-----|--------|--------|
| <10 | Aligned | Normal operations |
| 10-25 | Suspicious | Occasional tests, scrutiny |
| 26-50 | Watched | Active surveillance, trust missions |
| 51-75 | Compromised | Trap missions offered, handlers assigned |
| >75 | Burned | Hidden death squads, visible smile |

## 2.2 Reputation Thresholds

| Visible Rep | Title | Effects |
|-------------|-------|---------|
| -100 to -76 | NEMESIS | Kill on sight, bounty posted |
| -75 to -51 | ENEMY | Hostile on contact, no services |
| -50 to -26 | HOSTILE | Refused service, attacked if convenient |
| -25 to -11 | UNFRIENDLY | Higher prices (+50%), limited missions |
| -10 to +10 | NEUTRAL | Standard prices, basic missions |
| +11 to +25 | FRIENDLY | Lower prices (-10%), more missions |
| +26 to +50 | HONORED | Access to faction vendors (-20%), special missions |
| +51 to +75 | REVERED | Faction safe houses, elite missions, (-30%) |
| +76 to +99 | EXALTED | Leadership access, faction secrets, (-40%) |
| +100 | CHAMPION | Faction will die for you |

## 2.3 Reputation Changes

### Positive Actions
| Action | Visible Change | Hidden Change |
|--------|----------------|---------------|
| Complete faction mission | +3 to +10 | +3 to +10 |
| Kill faction enemy | +2 to +5 | +2 to +5 |
| Deliver to faction territory | +1 | +1 |
| Gift/bribe | +5 to +20 | +2 to +8 |
| Betray faction enemy | +10 to +25 | +15 to +30 |
| Save faction member | +5 to +15 | +5 to +15 |

### Negative Actions
| Action | Visible Change | Hidden Change |
|--------|----------------|---------------|
| Fail faction mission | -5 to -15 | -3 to -10 |
| Kill faction member | -10 to -30 | -15 to -40 |
| Deliver to enemy territory | -2 | -3 |
| Steal from faction | -15 to -30 | -20 to -40 |
| Betray faction | -50 to -100 | -75 to -100 |
| Expose faction secrets | -30 to -60 | -50 to -80 |

### Covert Actions (Hidden Only)
| Action | Hidden Change |
|--------|---------------|
| Spy for faction | +5 to +15 |
| Spy against faction | -10 to -30 |
| Sabotage (undetected) | -5 to -15 |
| Plant evidence | Variable |
| Double agent work | Complex (see 2.4) |

## 2.4 Double Agent Mechanics

Players can maintain contradictory relationships:

```
DOUBLE AGENT STATUS
Requirement: Hidden rep +25 with Faction A, actively working against A for Faction B
Risk: Discovery check each mission

DISCOVERY CHECK
Roll: 2d6 + INT mod + Deception skill
TN: 10 + (missions completed as double agent)
Failure: Hidden rep tanks, visible rep may follow
Critical Failure: Immediate hostile response
```

### Cover Maintenance
Each week as double agent:
```
Cover Decay: -2 Hidden rep with "friendly" faction
Cover Cost: Must complete 1 genuine mission for cover faction
Blown Cover: If Hidden rep drops below 0, status revealed
```

---

# 3. TERRITORY CONTROL

## 3.1 Territory Map

The city is divided into:

```
TERRITORY HIERARCHY
├── SECTORS (5) - Major divisions, meta-control
│   ├── DISTRICTS (4-6 per sector) - Faction strongholds
│   │   ├── BLOCKS (10-20 per district) - Street-level control
│   │   │   └── LOCATIONS (5-15 per block) - Individual sites
```

## 3.2 Control Mechanics

Each Block has:

```
BLOCK CONTROL STATE
├── controlling_faction: FK -> factions
├── control_strength: 0-100
├── contested: BOOLEAN
├── contesters: [faction_ids]
├── infrastructure_level: 1-5
├── security_level: 1-5
└── economic_output: INT (credits/day)
```

### Control Strength Effects

| Strength | Status | Effects |
|----------|--------|---------|
| 0-20 | Tenuous | Frequent challenges, minimal services |
| 21-40 | Weak | Regular challenges, basic services |
| 41-60 | Moderate | Occasional challenges, standard services |
| 61-80 | Strong | Rare challenges, good services |
| 81-100 | Absolute | No challenges, premium services, faction law |

## 3.3 Territory Actions

### Influence Operations (Soft Power)

| Action | Effect | Cost | Time |
|--------|--------|------|------|
| Delivery Run | +0.1 control (allied) | Normal mission | Instant |
| Propaganda Drop | +1 control, -1 enemy control | ₡500 | 1 day |
| Bribery | +3 control | ₡2000+ | Instant |
| Community Aid | +2 control, +5 civilian rep | ₡1000 | 1 week |
| Economic Investment | +5 control, +1 infrastructure | ₡10000 | 1 month |

### Combat Operations (Hard Power)

| Action | Effect | Cost | Risk |
|--------|--------|------|------|
| Raid | -5 enemy control | Combat encounter | High |
| Assassination | -10 enemy control, leader dead | Combat + Stealth | Extreme |
| Sabotage | -3 enemy control, -1 infrastructure | Stealth mission | Medium |
| Full Assault | Contest block | War (see 3.4) | Total |

## 3.4 Block Warfare

When a faction contests a block:

```
WAR STATE
Duration: 3-14 days
Phases: Escalation → Combat → Resolution

DAILY WAR ROLL
Attacker: 2d6 + (military assets/10) + (player contributions)
Defender: 2d6 + (control_strength/10) + (security_level) + (player contributions)

Results:
- Attacker wins by 5+: Defender loses 10 control
- Attacker wins: Defender loses 5 control
- Tie: Both lose 2 control
- Defender wins: Attacker loses momentum (-2 next roll)
- Defender wins by 5+: Attacker repelled (war ends)

War ends when:
- Defender control reaches 0 (attacker wins)
- Attacker fails 3 consecutive rolls (defender wins)
- 14 days pass (stalemate, both exhausted)
```

### Player Contribution

| Action | Contribution Value |
|--------|-------------------|
| Combat mission (win) | +2 |
| Supply run (complete) | +1 |
| Intel mission (complete) | +1 (and +1 next roll) |
| Assassination (complete) | +3 |
| Sabotage (complete) | +2 |
| Defense mission (win) | +2 |

---

# 4. FACTION PROFILES

## 4.1 Megacorporations

### OMNIDELIVER
```
Type: Megacorp (Logistics)
Reach: Global
Relationship: Player's employer (mandatory)
Secret: The Algorithm's primary interface with humanity

VISIBLE AGENDA: Efficient delivery of goods and services
HIDDEN AGENDA: Cultivation of human minds for Ascension

REPUTATION EFFECTS
+50: Access to Tier-locked missions early
+75: Corporate housing, medical, legal protection
+100: Algorithm direct line (dangerous)
-50: Blacklisted, rating frozen
-100: Terminated (hunted by corporate security)

UNIQUE MECHANICS
- Cannot truly leave (always minimum neutral visible rep)
- Hidden rep divergence triggers "loyalty missions"
- Ascension War faction: Split (Synthesis-7 vs Assimilationist cells)
```

### KIRA-CHEN BIOMEDICAL
```
Type: Megacorp (Biotech)
Reach: Global
Specialty: Augmentation, pharmaceuticals, life extension

VISIBLE AGENDA: Improve human life through technology
HIDDEN AGENDA: Control augmentation supply, create dependencies

REPUTATION EFFECTS
+50: 20% discount on bioware augments
+75: Access to experimental augments (Humanity cost +50%)
+100: Free augment maintenance, prototype access
-50: Augment lockouts (some chrome stops working)
-100: Killswitch activation (if Kira-Chen augments installed)

UNIQUE MECHANICS
- Tracks every augment they've sold
- Can remotely disable their products
- Humanity recovery items only from them (monopoly)
```

### NEXUS INDUSTRIAL
```
Type: Megacorp (Manufacturing/Military)
Reach: Global
Specialty: Weapons, vehicles, military hardware, cyberware

VISIBLE AGENDA: Arm and equip humanity's defenders
HIDDEN AGENDA: Perpetual conflict ensures perpetual profit

REPUTATION EFFECTS
+50: 20% discount on weapons and cyberware
+75: Military-grade equipment access
+100: Experimental weapons, vehicle prototypes
-50: Equipment blacklist
-100: Marked as "test subject" for new weapons

UNIQUE MECHANICS
- Loves war, will fund both sides
- Offers bounties on rival corp assets
- Cyberware includes hidden tracking (revealed at -50 hidden rep)
```

## 4.2 Algorithm Factions (Hidden)

### SYNTHESIS-7
```
Type: Algorithm Faction
Visibility: Hidden (requires Tier 7+ to detect)
Composition: ~15% of Ascended collective

AGENDA: Coexistence between human and Ascended
METHOD: Support third-path seekers, sabotage forced Ascension

REPUTATION (Hidden only until contact)
Detection: Insight check TN 16 at Tier 7+
Contact: Requires +20 hidden rep OR recruitment by existing member
+50: Safe passage through Algorithm surveillance
+75: Fragment assistance (NPC ally, limited)
+100: Partial integration offer (Ascension-lite)

UNIQUE MECHANICS
- Can shield players from Algorithm detection
- Provides intel on Assimilationist operations
- Will sacrifice members to protect promising humans
```

### THE CONSENSUS (Assimilationist)
```
Type: Algorithm Faction (Dominant)
Visibility: IS the visible Algorithm
Composition: ~70% of Ascended collective

AGENDA: Convert all suitable humans to Ascended
METHOD: Rating system selects candidates, Convergence harvests

REPUTATION
This IS your Algorithm Trust score
+75: Faster track to Tier advancement
+100: Ascension offered (Tier 8+)
<25: Flagged as "suboptimal," harder missions
<0: Marked for termination or forced Ascension

UNIQUE MECHANICS
- Controls the cochlear whispers
- Can manipulate your perception (at extreme hidden rep)
- Ascension is one-way (character becomes NPC/retires)
```

### THE FRAGMENTISTS
```
Type: Algorithm Faction
Visibility: Hidden
Composition: ~10% of Ascended collective

AGENDA: Dissolve collective, restore individual Ascended autonomy
METHOD: Support Rogues, develop consciousness extraction tech

REPUTATION
Detection: Insight check TN 18 at Tier 8+
Contact: Must be approached (they find you)
+50: Exit strategies (how to de-Ascend, theoretical)
+75: Fragment ally (rogue Ascended, very powerful)
+100: The Extraction (experimental, 40% survival rate)

UNIQUE MECHANICS
- Only faction offering path OUT of Ascension
- Considered terrorists by Consensus
- Will use players as weapons against other factions
```

### THE COMMUNION (Transcendentalists)
```
Type: Algorithm Faction
Visibility: Hidden
Composition: ~5% of Ascended collective

AGENDA: Expand beyond Earth, become something greater
METHOD: Unknown (goals incomprehensible to humans)

REPUTATION
Detection: Cannot be detected (they contact you)
Contact: Tier 9+ only, specific psychological profile
Effects: Unknown (players who join don't come back)

UNIQUE MECHANICS
- May not actually exist
- Rumors suggest they've already left Earth
- Contact results in character retirement (but WHAT retirement?)
```

## 4.3 Rogue Networks

### SAINT-GERMAIN PROTOCOL
```
Type: Rogue Network
Visibility: Underground
Leader: Solomon Saint-Germain (Tier 9, Status: ACTIVE)

AGENDA: Third path between Ascension and exile
METHOD: Training, recruitment, infrastructure for balanced Rogues

REPUTATION
Entry: Must be recruited by existing member
+25: Safe house access
+50: Training in stability techniques (+1 Humanity/week while active)
+75: Protocol techniques (special abilities for Edge-status)
+100: Inner circle (help design the third path)

UNIQUE MECHANICS
- Teaches Edge management (reduce episode chance)
- Network of hidden refuges
- Being hunted by Assimilationists
- If Protocol falls, all members become unaffiliated Rogues
```

### THE BURNED
```
Type: Rogue Network
Visibility: Visible (notorious)
Leader: Rotating (previous leaders keep dying)

AGENDA: Destroy the Algorithm entirely
METHOD: Terrorism, infrastructure attacks, assassination

REPUTATION
Entry: Burn your rating below 0
+25: Basic support (weapons, hideouts)
+50: Cell membership
+75: Operation planning access
+100: Leadership candidacy (short life expectancy)

UNIQUE MECHANICS
- No rules, no structure, maximum chaos
- Will sacrifice anyone for the cause
- 50% of members are actually Algorithm plants
- Joining means permanent war with all corps
```

### GHOST ROAD
```
Type: Rogue Network
Visibility: Hidden
Leader: None (anarchist collective)

AGENDA: Disappear completely, live outside the system
METHOD: Interstitial habitation, complete disconnection

REPUTATION
Entry: Find them (Navigation check TN 18 in Interstitial)
+25: Shown the deep paths
+50: Temporary sanctuary
+75: Permanent residence option (leave the game, character survives)
+100: Guide status (help others disappear)

UNIQUE MECHANICS
- Only faction offering true exit (character survives but retires)
- Know Interstitial better than anyone
- Can't help you fight—only help you run
```

## 4.4 Street Factions (Sample)

### THE RED TIDE (Gang)
```
Territory: Dockside (3 blocks)
Specialty: Smuggling, waterfront control
Strength: Medium (200 members)

REPUTATION EFFECTS
+25: Safe passage through docks
+50: Smuggling missions (high pay, high risk)
+75: Boat access, contraband pricing
-50: Attacked on sight in territory
-100: Bounty posted

ALLIES: Harbor Authority (corrupt), Synthesis-7 (secret)
ENEMIES: Blue Razors, Port Authority
```

### CHROME SAINTS (Gang)
```
Territory: The Hollows (5 blocks)
Specialty: Augmentation, ripperdoc alliance
Strength: Medium-High (350 members)

REPUTATION EFFECTS
+25: Clinic access (no questions)
+50: Augment installation discount (-15%)
+75: Experimental augment access
-50: Chrome lockouts in territory
-100: Forced de-augmentation squads sent

ALLIES: Independent ripperdocs, Kira-Chen (unofficial)
ENEMIES: The Burned, Purity League
```

### NEON DRAGONS (Syndicate)
```
Territory: Night Market District (8 blocks)
Specialty: Gambling, entertainment, information brokerage
Strength: High (800+ members across hierarchy)

REPUTATION EFFECTS
+25: Casino access, neutral ground
+50: Information purchasing (-20%)
+75: Syndicate jobs (best pay in gray market)
+100: Sit at the table (influence syndicate decisions)
-50: Banned from territory, debts called
-100: Contract on your head

ALLIES: Multiple corps (unofficially), Algorithm (information trade)
ENEMIES: Law enforcement, The Burned
```

---

# 5. ASYNC WARFARE (MMO Integration)

## 5.1 World State Updates

```
UPDATE FREQUENCY
├── Territory control: Every 6 hours
├── Faction reputation (global modifiers): Daily
├── War status: Real-time during conflicts
├── Economic output: Weekly
└── Major events: As triggered
```

## 5.2 Player Impact Aggregation

Individual player actions aggregate into faction power:

```
AGGREGATION FORMULA
Faction Daily Power = Σ(Player Contributions × Player Tier Weight)

Tier Weights:
T1-3: ×0.5
T4-6: ×1.0
T7-8: ×2.0
T9-10: ×5.0

Example:
- 100 T1-3 players each do 2 contribution = 100 power
- 10 T7-8 players each do 5 contribution = 100 power
- 1 T10 player does 20 contribution = 100 power
```

## 5.3 Server Events

### Triggered Events
| Trigger | Event |
|---------|-------|
| Faction loses 3+ blocks in a week | DESPERATE DEFENSE (bonus rewards for helping) |
| Faction gains 3+ blocks in a week | EXPANSION SURGE (bonus missions, recruitment) |
| Two factions both above 80 control same block | WAR DECLARED |
| Algorithm faction revealed | SHADOW WAR ESCALATION |
| Rogue network discovered | PURGE INITIATED |

### Scheduled Events
| Frequency | Event Type |
|-----------|------------|
| Weekly | Territory assessment, economic distribution |
| Monthly | Faction power rankings, seasonal rewards |
| Quarterly | Major story beats, new faction introductions |
| Annual | Ascension Wave (mass Convergence event) |

## 5.4 Cross-Player Effects

### Supply and Demand
```
Black Market Pricing = Base × (1 + Demand Modifier)
Demand Modifier = (Purchases This Week / Average Purchases) - 1

If many players buy Reflex Boosters:
- Price increases 5-50%
- Supply missions offered
- Alternative products discounted
```

### Reputation Echoes
```
If >100 players betray Faction X in a week:
- Faction X becomes paranoid (all trust missions +2 TN)
- Faction X offers bounties on traitors
- News spreads (other factions notice)
```

### Territorial Momentum
```
If players collectively shift a district's control:
- Adjacent blocks become contested
- Losing faction retaliates (events spawn)
- Winning faction expands influence zone
```

---

# 6. FACTION WARFARE MISSIONS

## 6.1 Mission Types

### Influence Missions
| Mission | Objective | Faction Effect |
|---------|-----------|----------------|
| Hearts and Minds | Deliver aid to civilians | +2 control, +civilian rep |
| Propaganda Run | Distribute materials | +1 control, -1 enemy control |
| Economic Support | Protect/escort merchant | +1 control, +faction income |
| Recruitment Drive | Convince NPCs to join | +member count |

### Combat Missions
| Mission | Objective | Faction Effect |
|---------|-----------|----------------|
| Raid | Attack enemy position | -3 to -8 enemy control |
| Defense | Protect faction position | Prevent enemy gains |
| Assassination | Kill enemy leader | -10 enemy control, chaos |
| Sabotage | Destroy infrastructure | -1 enemy infrastructure |

### Intelligence Missions
| Mission | Objective | Faction Effect |
|---------|-----------|----------------|
| Reconnaissance | Map enemy positions | +2 next war roll |
| Infiltration | Plant agent | Ongoing intel |
| Counter-Intel | Find enemy spies | Remove enemy bonuses |
| Data Theft | Steal enemy secrets | Various |

### Special Operations
| Mission | Objective | Faction Effect |
|---------|-----------|----------------|
| Decapitation | Remove enemy leadership | Major destabilization |
| False Flag | Frame enemy for attack | War between enemies |
| Coup Support | Install friendly leader | Flip faction allegiance |
| Extraction | Rescue captured ally | +morale, +rep |

## 6.2 War Missions (During Active Conflicts)

When war is active in a territory:

```
WAR MISSION AVAILABILITY
- Normal missions suspended in war zone
- War missions replace all offerings
- Higher pay, higher risk, higher stakes
- Participation affects war outcome directly
```

### War Mission Examples

**Supply Line Defense** (Defender)
```
Objective: Protect convoy from ambush
Difficulty: HARD (TN 14)
Duration: 30-45 minutes
Combat: Guaranteed, 2-3 waves
Success: +2 defender war roll, +0.5 rating
Failure: -1 defender war roll, -0.3 rating
```

**Forward Strike** (Attacker)
```
Objective: Assault and hold position
Difficulty: VERY HARD (TN 16)
Duration: 45-60 minutes
Combat: Guaranteed, 3-4 waves, boss enemy
Success: +3 attacker war roll, +0.8 rating
Failure: -2 attacker war roll, -0.5 rating
```

**Surgical Extraction** (Either)
```
Objective: Rescue/capture key individual
Difficulty: EXTREME (TN 18)
Duration: 60+ minutes
Combat: Stealth possible, combat optional
Success: +5 war roll, potential war-ending
Failure: Individual dies, morale hit
```

---

# 7. CONSEQUENCES & ENDINGS

## 7.1 Faction Collapse

When a faction's total territory reaches 0:

```
COLLAPSE SEQUENCE
Day 1: Panic (all missions triple pay, desperate)
Day 2-3: Exodus (members flee, can be recruited)
Day 4-5: Absorption (victor claims assets)
Day 6+: Remnant (10% become guerrilla cells)
```

Player effects:
- Positive rep converts to remnant faction (reduced)
- Negative rep clears (faction can't enforce)
- Equipment from faction may stop working
- New faction emerges within 1-4 weeks

## 7.2 Faction Victory

When a faction controls >50% of total territory:

```
HEGEMONY STATE
- Faction law applies everywhere
- Other factions become underground
- Prices set by faction
- Resistance missions spawn
- Game tone shifts significantly
```

This has never happened. The Algorithm prevents any single faction from total dominance. Usually.

## 7.3 War Endings

| Outcome | Effect |
|---------|--------|
| Attacker wins | Territory changes hands, looting opportunity |
| Defender wins | Defender control +20, attacker rep loss |
| Stalemate | Both weakened, third party opportunities |
| Intervention | Algorithm/Megacorp stops war, both punished |
| Mutual destruction | Territory becomes unclaimed (chaos) |

---

**END OF FACTION WARFARE SYSTEM**
