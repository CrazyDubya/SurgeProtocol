# Complications Library

## Purpose

This library contains 15 reusable complications that can be inserted into any delivery quest or story moment to add tension, challenge, player choice, and emergent consequences. Each complication is modular and can be adapted to different tiers, locations, and narrative contexts.

**Usage**: When designing a quest or delivery, select 1-3 complications from this library to layer challenge and unpredictability. Adjust difficulty, consequences, and dialogue to match the tier and story moment.

---

## How to Use Complications

### Integration Guidelines

1. **Tier-Appropriate Scaling**: Adjust difficulty, stakes, and rewards based on player tier
   - Tiers 0-2: Low stakes, tutorial-level challenge
   - Tiers 3-5: Medium stakes, meaningful consequences
   - Tiers 6-9: High stakes, major narrative impact

2. **Narrative Context**: Adapt complication dialogue and framing to match current quest
   - Reference current story flags
   - Use tier-appropriate NPCs
   - Connect to ongoing character arcs when possible

3. **Layering**: Combine 2-3 complications for complex encounters
   - Example: Hostile Encounter + Time Pressure = Chase under deadline
   - Example: Environmental + Technical = Navigate storm while augments malfunction

4. **Consequence Tracking**: All complications should impact story flags, relationships, or Humanity
   - Player choices matter
   - Consequences ripple forward
   - Failed complications create new story opportunities

---

## Category 1: Hostile Encounters

### HE-01: Gang Territory Incursion

**Setup**: Delivery route passes through gang-controlled territory. Player is stopped at checkpoint.

**Trigger**: Player enters district controlled by local gang (Razor Collective, Chrome Saints, etc.)

**GANG ENFORCER**:
"Stop right there, courier. This is our territory. You want to pass? Pay the toll. Or turn around."

[Package is visible, valuable]

"Nice package you got. Corporate? We could take it. Resell it. Or... you could pay. Your choice."

**PLAYER OPTIONS**:

**Option A - Pay Toll** (Cost: 500 credits or 10% delivery fee):
- **Outcome**: Safe passage, quick resolution
- **Humanity**: 0 (neutral, pragmatic)
- **Story Flag**: `GANG_[NAME]_RELATIONSHIP +5` (you paid, they respect it)

**Option B - Fight** (Combat encounter):
- **Outcome**: Defeat enforcers, hostile gang relationship, possible injury/delay
- **Humanity**: -2 (violence)
- **Story Flag**: `GANG_[NAME]_RELATIONSHIP -20` (you're marked as enemy)
- **Risk**: Package damage, injury, time delay

**Option C - Talk Your Way Through** (Charisma/Reputation check):
- **Success**: "I run routes through here regular. Let's make a deal—I pass free, I don't report your checkpoint to corpo."
- **Outcome**: Safe passage, establish recurring relationship
- **Humanity**: +1 (clever negotiation over violence)
- **Story Flag**: `GANG_[NAME]_RELATIONSHIP +10`, unlock future gang contacts

- **Failure**: Gang doesn't buy it, forced to pay or fight

**Option D - Alternate Route** (Time cost):
- **Outcome**: Avoid confrontation, lose 10-15 minutes, possible rating penalty for late delivery
- **Humanity**: 0 (risk-averse)
- **Story Flag**: None (avoided encounter entirely)

**Reusability**: Can occur in any gang territory, any tier. Scale threat/cost based on tier.

---

### HE-02: Rival Courier Sabotage

**Setup**: A rival courier attempts to sabotage your delivery to steal your client or boost their own rating.

**Trigger**: Mid-delivery, player encounters rival courier (Jin if Tier 1-2, or generic rival)

**RIVAL COURIER**:
"Hey, [player name]. Nice package. Shame if something... happened to it. We're competing for the same clients, you know. Maybe you should slow down. Let me take this one."

[Blocks path, augments visible, threatening posture]

**PLAYER OPTIONS**:

**Option A - Race Them** (Speed/Navigation challenge):
- **Outcome**: If win—deliver on time, gain rating. If lose—rival damages package or delays you
- **Humanity**: 0 (competitive but fair)
- **Story Flag**: `RIVAL_[NAME]_RELATIONSHIP -10` (escalates rivalry)

**Option B - Fight** (Combat encounter):
- **Outcome**: Physical confrontation, possible injury, rating/reputation consequences
- **Humanity**: -3 (initiated violence)
- **Story Flag**: `RIVAL_[NAME]_RELATIONSHIP -25` (bitter enemy)
- **Risk**: Corpo security reports fighting, both couriers fined

**Option C - Negotiate Split** (Split reward):
- **Player**: "How about we both deliver parts? Split the fee. No fighting, no sabotage."
- **Outcome**: Rival agrees, both deliver, split payment/rating
- **Humanity**: +2 (cooperation over competition)
- **Story Flag**: `RIVAL_[NAME]_RELATIONSHIP +15` (from rival to ally)

**Option D - Call Dispatcher Chen**:
- **Outcome**: Chen intervenes, assigns rival different route, you proceed but lose time
- **Humanity**: +1 (avoided violence, sought authority)
- **Story Flag**: `CHEN_RELATIONSHIP +5` (appreciates non-violence)

**Option E - Intimidate** (Reputation/Augment check):
- **Player**: "Back off. You know who I am. You know my rating. You don't want this fight."
- **Success**: Rival backs down, reputation reinforced
- **Failure**: Rival calls your bluff, forced to fight or flee
- **Humanity**: -1 (used threat of violence)

**Reusability**: Can occur any time player has valuable delivery. Rival identity changes by tier/region.

---

### HE-03: Corpo Security Shakedown

**Setup**: Corporate security stops player for "random inspection," clearly fishing for bribes or confiscation.

**Trigger**: Player passes through corporate district checkpoint (Nakamura, Apex, etc.)

**CORPO SECURITY**:
"Hold it. Security checkpoint. We need to inspect your package. Standard procedure."

[Scans package, raises eyebrow]

"This isn't properly licensed. Permit's... questionable. I should confiscate this. Unless you can convince me otherwise."

[Implied bribe request]

**PLAYER OPTIONS**:

**Option A - Bribe** (Cost: 1000 credits):
- **Outcome**: Guard lets you pass, quick resolution
- **Humanity**: -1 (complicit in corruption)
- **Story Flag**: `CORPO_CORRUPTION_PARTICIPANT` (you're on record as bribable)

**Option B - Show Legitimate Permits**:
- **Outcome**: Guard backs off, you proceed legally
- **Humanity**: +1 (integrity)
- **Story Flag**: None (clean record maintained)
- **Requirement**: Must have proper permits (higher tier couriers usually do)

**Option C - Refuse and Report**:
- **Player**: "This is extortion. I'm reporting you to your supervisor."
- **Success**: Guard backs down, fears consequences
- **Failure**: Guard retaliates, confiscates package, you fail delivery
- **Humanity**: +3 (stand against corruption)
- **Story Flag**: `CORPO_[NAME]_RELATIONSHIP -15` (marked as troublemaker)

**Option D - Algorithm Assist** (If Tier 3+):
- **Algorithm**: "I have access to this guard's file. Multiple complaints. Use this."
- **Player**: "Officer [name], I see you have 12 prior complaints for shakedowns. Let me pass, or I add complaint #13."
- **Outcome**: Guard lets you pass, resentful
- **Humanity**: -2 (using surveillance/blackmail)
- **Story Flag**: `ALGORITHM_USED_COERCION` (Algorithm helped you threaten someone)

**Option E - Fight Your Way Through**:
- **Outcome**: Combat, massive consequences (attacking corpo security = serious crime)
- **Humanity**: -5 (violence against authority)
- **Story Flag**: `CORPO_ENEMY`, wanted status, bounty
- **Risk**: Extremely high—only viable if player is desperate or Tier 8+ powerful

**Reusability**: Can occur in any corporate district. Adjust corpo faction and stakes by region.

---

## Category 2: Environmental

### ENV-01: Severe Weather Event

**Setup**: Sudden storm/environmental hazard makes navigation dangerous.

**Trigger**: Mid-delivery, weather alert triggers

**ALGORITHM** (if Tier 3+):
"Weather alert: Category 3 storm incoming. Visibility reduced. Route recalculation recommended."

**Environmental Effects**:
- Rain/fog reduces visibility
- Wind affects balance (especially on rooftops/parkour routes)
- Flooding blocks ground-level streets
- Lightning risk if using tall buildings

**PLAYER OPTIONS**:

**Option A - Push Through** (Risk/Speed):
- **Outcome**: Arrive on time but risk injury/package damage
- **Humanity**: 0 (determined)
- **Risk**: Roll for injury/damage (higher if low augments)
- **Story Flag**: `DELIVERY_HERO` (if succeed—reputation for reliability)

**Option B - Wait Out Storm** (Safety/Time):
- **Outcome**: Safe, but delivery delayed, rating penalty
- **Humanity**: +1 (self-preservation)
- **Story Flag**: `LATE_DELIVERY_[CLIENT]` (client dissatisfied)

**Option C - Find Alternate Route** (Navigation challenge):
- **Player**: Use underground tunnels, interstitial, or indoor routes
- **Outcome**: Avoid weather, minor delay, discover new routes
- **Humanity**: +2 (clever problem-solving)
- **Story Flag**: `DISCOVERED_INTERSTITIAL` (if applicable), new routes unlocked

**Option D - Algorithm Optimization** (If Tier 3+):
- **Algorithm**: "Optimal path calculated. 73% success probability. Proceed?"
- **Outcome**: Algorithm guides through storm using real-time weather data
- **Humanity**: -1 (relied on Algorithm instead of own judgment)
- **Story Flag**: `ALGORITHM_DEPENDENCY +1`

**Reusability**: Can insert into any outdoor delivery. Adjust weather type (storm/smog/heat/cold) based on season/region.

---

### ENV-02: Infrastructure Failure

**Setup**: Key infrastructure (bridge, elevator, transit line) fails during delivery.

**Trigger**: Player reaches critical juncture, infrastructure fails (collapse, power outage, etc.)

**SYSTEM ANNOUNCEMENT**:
"Attention: [Infrastructure element] is experiencing technical failure. Estimated repair time: 2-4 hours. Seek alternate routes."

**Environmental Challenge**: Player's planned route is blocked. Must adapt.

**PLAYER OPTIONS**:

**Option A - Parkour/Climb** (Physical challenge):
- **Outcome**: Bypass broken infrastructure using augments/skill
- **Humanity**: 0 (physical solution)
- **Risk**: Injury if low augments or failed check
- **Story Flag**: `PARKOUR_EXPERT` (if successful—reputation grows)

**Option B - Bribe Maintenance Worker**:
- **Player**: "I'll pay you 500 credits to let me through the maintenance access."
- **Outcome**: Worker gives access to restricted route
- **Humanity**: -1 (corruption)
- **Story Flag**: `MAINTENANCE_ACCESS` (can use this route again)

**Option C - Help Repair** (Delay for goodwill):
- **Player**: "I have tools/augments. Let me help fix this."
- **Outcome**: Help repair, major delay, but gain relationship with workers
- **Humanity**: +3 (altruism at personal cost)
- **Story Flag**: `UNION_RELATIONSHIP +10`, workers remember you

**Option D - Long Alternate Route**:
- **Outcome**: Safe but slow, rating penalty
- **Humanity**: 0 (pragmatic)
- **Story Flag**: `LATE_DELIVERY_[CLIENT]`

**Option E - Algorithm Hack** (If Tier 3+):
- **Algorithm**: "I can override maintenance lockdown. Unauthorized but effective."
- **Outcome**: Access restricted areas, quick passage
- **Humanity**: -2 (illegal access)
- **Story Flag**: `ALGORITHM_ILLEGAL_ACCESS` (creates vulnerability)

**Reusability**: Can apply to any infrastructure (bridge, elevator, subway, road). Adjust based on location.

---

### ENV-03: Toxic Spill/Contamination

**Setup**: Chemical spill or toxic cloud blocks route. Hazardous environment.

**Trigger**: Player approaches area, hazard warnings activate

**HAZARD ALERT**:
"Warning: Toxic contamination detected. Exposure risk: Severe. Protective equipment required. Proceed with caution or avoid area."

**Environmental Hazard**: Toxic zone damages unprotected humans. Augments help but don't eliminate risk.

**PLAYER OPTIONS**:

**Option A - Rush Through** (Speed/Health risk):
- **Outcome**: Exposure to toxins, health damage, possible long-term effects
- **Humanity**: -1 (damage to biological body)
- **Story Flag**: `TOXIN_EXPOSURE` (future health complications possible)
- **Risk**: Immediate health penalty, need medical treatment

**Option B - Buy/Rent Protective Gear**:
- **Cost**: 1500 credits
- **Outcome**: Safe passage, expensive but secure
- **Humanity**: 0 (pragmatic spending)

**Option C - Augment Protection** (If heavily augmented):
- **Outcome**: Sealed respiratory system/synthetic organs protect you
- **Humanity**: -2 (reliance on chrome over meat)
- **Story Flag**: `AUGMENT_SAVED_LIFE` (reinforces value of augmentation)

**Option D - Find Safe Route** (Delay):
- **Outcome**: Avoid contamination, late delivery
- **Humanity**: +1 (self-preservation)
- **Story Flag**: `LATE_DELIVERY_[CLIENT]`

**Option E - Help Evacuate Civilians** (Hero option):
- **Player sees civilians trapped in contamination zone**
- **Outcome**: Rescue civilians, major delay, significant health risk, massive Humanity gain
- **Humanity**: +5 (selfless heroism)
- **Story Flag**: `LOCAL_HERO` (reputation boost, civilians remember)
- **Risk**: Severe toxin exposure, possible hospitalization

**Reusability**: Can occur in industrial districts, after accidents, or sabotage events. Adjust toxin type and severity.

---

## Category 3: Social

### SOC-01: Reputation Check

**Setup**: Client/NPC recognizes player and reacts based on reputation and past choices.

**Trigger**: Arriving at delivery destination, NPC greets player

**HIGH REPUTATION** (Positive):

**CLIENT**:
"Oh, you're [player name]! I requested you specifically. Your rating is excellent. I trust this delivery is in good hands."

[More patient with delays, tips well, offers future contracts]

**Outcome**: Easier interaction, better payment, relationship bonus

---

**LOW REPUTATION** (Negative):

**CLIENT**:
"You're [player name]? I've heard about you. Late deliveries. Damaged packages. I'm watching you. Don't screw this up."

[Suspicious, checks package thoroughly, complains to dispatcher if anything wrong]

**Outcome**: Harder interaction, scrutiny, risk of complaint

---

**MIXED REPUTATION** (Complicated):

**CLIENT**:
"You're the courier who [past action]. Interesting. Let's see if you've changed."

[References specific past choice—helped rival, fought gang, reported corruption, etc.]

**PLAYER OPTIONS**:
- **Own It**: "That was me. I stand by my choices."
  - Humanity: +1 (integrity)
  - Outcome: Respect or hostility depending on client's values

- **Deflect**: "That was a complicated situation. Let's focus on this delivery."
  - Humanity: 0 (avoidance)
  - Outcome: Neutral, proceed with delivery

- **Lie**: "That wasn't me. Must be thinking of someone else."
  - Humanity: -2 (dishonesty)
  - Outcome: If believed—proceed. If caught—relationship destroyed

**Reusability**: Can insert into any NPC interaction. Adjust dialogue based on player's story flag history.

---

### SOC-02: Moral Dilemma Witness

**Setup**: Player witnesses injustice/crime/suffering during delivery. Must choose to intervene or ignore.

**Trigger**: En route, player sees situation requiring intervention

**SCENARIO EXAMPLES**:

**Example A - Corpo Repossession**:
Player sees augment repossession team forcibly removing someone's chrome (defaulted on payment).

**VICTIM** (screaming):
"Please! I need these to work! I'll pay! Just give me more time!"

**REPO TEAM**:
"Contract's clear. Payment overdue. Augments are corporate property. Extraction proceeding."

**Example B - Gang Shakedown**:
Player sees gang members extorting small business owner.

**VICTIM**:
"I already paid this month! I don't have more!"

**GANG**:
"Rates went up. Pay or we trash your place."

**Example C - Medical Emergency**:
Player sees someone collapsed, clearly in medical distress, people walking past ignoring them.

**VICTIM** (unconscious, augments malfunctioning, bleeding)

---

**PLAYER OPTIONS** (Universal):

**Option A - Intervene** (Risk/Time cost):
- **Outcome**: Stop injustice, help victim, delay delivery
- **Humanity**: +3 to +5 (altruism)
- **Story Flag**: `INTERVENTION_[TYPE]`, possible enemy relationships, possible victim gratitude
- **Risk**: Violence, legal trouble, significant delay

**Option B - Ignore and Proceed**:
- **Outcome**: Complete delivery on time, ignore suffering
- **Humanity**: -3 (callousness)
- **Story Flag**: `IGNORED_SUFFERING`
- **Psychological**: Algorithm may comment on efficiency vs. ethics

**Option C - Call Authorities**:
- **Outcome**: Report situation, continue delivery, authorities may or may not respond
- **Humanity**: +1 (attempted help without personal risk)
- **Story Flag**: Varies by authority response
- **Reality**: Authorities often slow or don't come in low-income areas

**Option D - Anonymous Help** (If able):
- **Pay victim's debt anonymously**
- **Send medical alert**
- **Leave resources**
- **Outcome**: Help without direct confrontation, moderate time/resource cost
- **Humanity**: +2 (compassion with pragmatism)

**Option E - Algorithm Advice** (If Tier 3+):
- **Algorithm**: "Intervention reduces delivery efficiency by 43%. Recommend proceeding."
- **Player can follow or ignore**
- **Humanity**: -2 if follow Algorithm's cold calculation, +3 if override for moral reasons

**Reusability**: Infinite variations. Adjust scenario to match district, tier, and current story context.

---

### SOC-03: Relationship Test

**Setup**: NPC player has relationship with asks for favor that conflicts with delivery/self-interest.

**Trigger**: During delivery, NPC contacts player with urgent request

**SCENARIO EXAMPLES**:

**Example A - Chen Needs Backup**:

**CHEN** (urgent message):
"Hey kid, I need you. Courier got jumped in Red Harbor. They're hurt. I need someone to extract them and finish their delivery. You're closest. Can you help?"

[Player has own delivery on deadline]

**Example B - Rosa's Brother Crisis** (If romance):

**ROSA** (panicked call):
"Miguel's in trouble. Corpo thugs are threatening him over debt. He's at the docks. I need you. Please. I know you're working but—please."

**Example C - Tanaka Medical Emergency**:

**TANAKA**:
"Patient critical. I need specific meds from uptown. Couriers are all busy. You're near the pharmacy. Can you grab this and bring it? Patient dies without it."

---

**PLAYER OPTIONS** (Universal):

**Option A - Help Immediately** (Sacrifice delivery):
- **Outcome**: Help NPC, fail/delay own delivery, rating penalty
- **Humanity**: +4 (loyalty to relationships over job)
- **Story Flag**: `[NPC]_RELATIONSHIP +20` (deep gratitude)
- **Cost**: Rating drop, client complaint, possible fee penalty

**Option B - Finish Delivery First**:
- **Outcome**: Complete job, then help (if not too late)
- **Humanity**: +1 (balanced responsibility)
- **Story Flag**: `[NPC]_RELATIONSHIP +5` (helped but not immediately)
- **Risk**: May arrive too late, NPC may face consequences

**Option C - Refuse**:
- **Player**: "I can't. I'm on deadline. I'm sorry."
- **Outcome**: Complete own delivery successfully, damage relationship
- **Humanity**: -2 (prioritized money over people)
- **Story Flag**: `[NPC]_RELATIONSHIP -15` (hurt, disappointed)

**Option D - Find Alternate Solution**:
- **Player**: "I can't come but let me [call another courier / send money / contact Chen]"
- **Outcome**: Help indirectly, minimal impact on own delivery
- **Humanity**: +2 (problem-solving)
- **Story Flag**: `[NPC]_RELATIONSHIP +10` (appreciates creative solution)

**Option E - Algorithm Calculation** (If Tier 3+):
- **Algorithm**: "Probability of completing both tasks: 34%. Recommend prioritizing primary delivery."
- **Player can follow (preserve rating) or override (help friend, risk job)
- **Humanity**: -1 if follow cold calculation, +3 if choose friend over efficiency

**Reusability**: Can occur with any established relationship. Adjust NPC, stakes, and urgency.

---

## Category 4: Technical

### TECH-01: Augment Malfunction

**Setup**: Player's augments malfunction mid-delivery, reducing capabilities.

**Trigger**: Random or story-triggered technical failure

**SYSTEM ALERT**:
"Warning: [Augment type] experiencing critical failure. Functionality reduced. Seek immediate maintenance."

**AUGMENT FAILURE TYPES**:

**A - Mobility Augment** (Legs/parkour):
- **Effect**: Reduced speed, can't jump/climb effectively
- **Impact**: Must use ground routes, slower navigation

**B - Sensory Augment** (Eyes/ears/HUD):
- **Effect**: Visual glitches, can't see waypoints, reduced situational awareness
- **Impact**: Navigation harder, vulnerable to ambush

**C - Strength Augment** (Arms/carrying):
- **Effect**: Package feels heavy, struggle to carry
- **Impact**: Slower movement, risk of dropping package

**D - Cochlear Implant** (Algorithm voice):
- **Effect**: Algorithm voice cuts in and out (if Tier 3+)
- **Impact**: No navigation assistance, no optimization, eerie silence

---

**PLAYER OPTIONS**:

**Option A - Push Through Malfunction**:
- **Outcome**: Complete delivery with impaired augment, risk further damage
- **Humanity**: 0 (determination)
- **Risk**: Augment fully breaks, requires expensive repair
- **Story Flag**: `AUGMENT_DAMAGE_[TYPE]`

**Option B - Emergency Repair** (If skilled):
- **Player**: Self-repair using tools/knowledge
- **Outcome**: Temporary fix, reduced function but usable
- **Humanity**: +1 (self-sufficiency)
- **Time Cost**: 10-15 minutes (possible late delivery)

**Option C - Find Street Clinic**:
- **Outcome**: Pay for quick repair (500-1500 credits), time delay
- **Humanity**: 0 (pragmatic)
- **Time Cost**: 20-30 minutes

**Option D - Complete Without Augment**:
- **Player**: Prove you don't need chrome to succeed
- **Outcome**: Harder challenge, possible failure, but maintain Humanity
- **Humanity**: +3 (human capability over augment reliance)
- **Story Flag**: `HUMAN_TRIUMPH` (completed hard task without chrome)

**Option E - Algorithm Workaround** (If Tier 3+, non-Algorithm augment):
- **Algorithm**: "I can reroute neural pathways. Compensate for failed augment. Less efficient but functional."
- **Outcome**: Algorithm takes more control to compensate
- **Humanity**: -2 (increased Algorithm dependency)
- **Story Flag**: `ALGORITHM_DEEPER_INTEGRATION`

**Reusability**: Can occur at any tier. Adjust augment type and severity. Higher tier = more augments, more potential failures.

---

### TECH-02: Package Tracking Hack

**Setup**: Someone hacks package tracking, trying to intercept or reroute delivery.

**Trigger**: Mid-delivery, tracking system acts strange

**ALGORITHM** (if Tier 3+):
"Alert: Package tracking compromised. External access detected. Recommendation: Secure package immediately."

**Or (if pre-Tier 3):**

**PLAYER HUD**: [Glitching, false waypoints, incorrect directions]

**HACKER** (message):
"Nice package you got. Bring it to [alternate location] and I'll pay double what your client is. Or I crash your system and you lose the package anyway."

**PLAYER OPTIONS**:

**Option A - Comply with Hacker**:
- **Outcome**: Deliver to hacker instead, double payment, betray client
- **Humanity**: -4 (betrayal, theft)
- **Story Flag**: `TRAITOR_COURIER`, client files complaint, reputation destroyed
- **Risk**: Client may retaliate, original corp blacklists you

**Option B - Ignore Hack, Continue Delivery**:
- **Outcome**: Navigate without system, deliver to correct client
- **Humanity**: +2 (integrity under pressure)
- **Story Flag**: `CLIENT_[NAME]_TRUST +10`
- **Challenge**: No HUD assistance, must navigate manually

**Option C - Counter-Hack** (If skilled/Algorithm assist):
- **Outcome**: Trace hacker, report to authorities or blackmail them
- **Humanity**: 0 (technical solution)
- **Story Flag**: `HACKER_[NAME]_ENEMY` or `BLACKMAIL_LEVERAGE`
- **Reward**: Hacker backs off, possible future contact

**Option D - Call Dispatcher Chen**:
- **Chen**: "Hackers again? Okay, switching you to secure channel. Ignore the fake waypoints. I'll guide you in."
- **Outcome**: Chen provides manual navigation, bypasses hack
- **Humanity**: +1 (trust in human connection over tech)
- **Story Flag**: `CHEN_RELATIONSHIP +10`

**Option E - Negotiate with Hacker**:
- **Player**: "I'll tell you what's in the package. If it's worth it to you, we deal. If not, you back off."
- **Outcome**: Hacker evaluates, may accept intel as payment and leave you alone
- **Humanity**: -1 (compromising client info)
- **Story Flag**: `INFORMATION_BROKER`

**Reusability**: Can occur whenever package is valuable. Adjust hacker motivation and methods.

---

### TECH-03: City-Wide Network Outage

**Setup**: Major network failure cuts all digital systems. Player must navigate analog.

**Trigger**: Sudden city-wide blackout or cyberattack

**SYSTEM ANNOUNCEMENT**:
"Emergency: City network experiencing critical failure. All digital services offline. Estimated restoration: Unknown."

**EFFECTS**:
- No GPS/waypoints
- No Algorithm voice (if Tier 3+) – sudden eerie silence
- No electronic payments
- No automated doors/elevators
- Traffic lights offline → chaos
- Communication limited to physical proximity

**PLAYER EXPERIENCE**:

**PLAYER** (internal monologue):
"Everything's offline. No HUD. No waypoints. No Algorithm telling me where to go. I'm... alone. With my thoughts. And a package. And a city that's lost its mind."

**PLAYER OPTIONS**:

**Option A - Navigate by Memory/Paper Map**:
- **Outcome**: Old-school navigation, slower but works
- **Humanity**: +2 (self-reliance, human capability)
- **Challenge**: Memory check, environmental awareness
- **Story Flag**: `ANALOG_NAVIGATION` (useful skill learned)

**Option B - Ask Locals for Directions**:
- **Outcome**: Human interaction replaces digital systems
- **Humanity**: +3 (community reliance, social connection)
- **Story Flag**: `COMMUNITY_TRUST` (people help each other when tech fails)
- **Dialogue**: Various NPCs provide help, share rumors, gossip

**Option C - Wait for Network Restoration**:
- **Outcome**: Safe but massive delay, guaranteed late delivery
- **Humanity**: 0 (risk-averse)
- **Story Flag**: `LATE_DELIVERY_[CLIENT]`, rating penalty

**Option D - Exploit Chaos** (Dark option):
- **Player**: Use network outage to access restricted areas (no cameras, no locks)
- **Outcome**: Shortcut through normally secured zones
- **Humanity**: -3 (opportunistic crime)
- **Story Flag**: `TRESPASSER`, possible future consequences
- **Reward**: Fast delivery, massive rating boost

**Option E - Help Others During Crisis** (Hero option):
- **Outcome**: Stop delivery to help confused/endangered people
- **Humanity**: +5 (altruism during crisis)
- **Story Flag**: `CRISIS_HERO`, community remembers
- **Cost**: Late delivery, but reputation boost compensates

**Option F - Experience Silence** (If Tier 3+, Algorithm integrated):
- **Outcome**: First time without Algorithm voice since integration
- **Humanity**: +2 (realize you can exist without Algorithm)
- **Narrative**: Profound moment of clarity, question dependency
- **Story Flag**: `ALGORITHM_OPTIONAL` (realize it's not essential)

**Reusability**: Major event complication. Use sparingly (1-2 times per playthrough). Massive narrative impact.

---

## Category 5: Time Pressure

### TIME-01: Impossible Deadline

**Setup**: Client demands delivery faster than physically possible.

**Trigger**: Accepting contract, client reveals deadline

**CLIENT**:
"I need this in 15 minutes. Don't care how you do it. Just get it here. Fast."

[Delivery normally takes 25-30 minutes even with optimal route]

**PLAYER OPTIONS**:

**Option A - Refuse**:
- **Outcome**: Turn down contract, lose potential earnings
- **Humanity**: +1 (realistic self-assessment)
- **Story Flag**: `REFUSED_IMPOSSIBLE` (marked as "not desperate enough")

**Option B - Accept and Try** (Heroic attempt):
- **Outcome**: Push limits, take extreme risks, parkour shortcuts, dangerous routes
- **Humanity**: 0 (determined)
- **Risk**: High injury chance, package damage, probable failure anyway
- **Reward**: If somehow succeed → massive rating boost, reputation as miracle worker

**Option C - Algorithm Optimization** (If Tier 3+):
- **Algorithm**: "Probability of success: 11%. Optimal route requires traversing Red Harbor gang territory, rooftop parkour, and subway tunnel shortcut. Recommend?"
- **Outcome**: Algorithm finds technically possible path (barely)
- **Humanity**: -2 (extreme reliance on Algorithm)
- **Risk**: Everything Algorithm suggests is dangerous
- **Story Flag**: `ALGORITHM_IMPOSSIBLE_ROUTE`

**Option D - Negotiate Realistic Deadline**:
- **Player**: "I can get it there in 25 minutes. That's the fastest possible. Take it or leave it."
- **Success**: Client accepts revised timeline
- **Failure**: Client refuses, contract lost
- **Humanity**: +2 (honest, assertive)
- **Story Flag**: `NEGOTIATED_TERMS`

**Option E - Cheat** (Break rules):
- **Use subway tracks** (forbidden, dangerous)
- **Steal vehicle** (crime)
- **Bribe official to teleport package** (corruption)
- **Outcome**: Might achieve deadline, massive ethical/legal consequences
- **Humanity**: -4 (desperation over integrity)
- **Story Flag**: `RULE_BREAKER`, possible criminal record

**Reusability**: Can occur with demanding clients. Adjust deadline severity. Useful for creating tension.

---

### TIME-02: Multiple Simultaneous Deliveries

**Setup**: Player has 2-3 deliveries with overlapping deadlines. Can't complete all on time.

**Trigger**: Dispatcher Chen assigns multiple contracts close together

**CHEN**:
"You've got three deliveries. All flagged urgent. Deliver A to Uptown by 3:00. Deliver B to Red Harbor by 3:15. Deliver C to Nakamura Tower by 3:20. I know it's tight. Do your best."

[It's currently 2:50. Physically impossible to complete all three on time.]

**PLAYER OPTIONS**:

**Option A - Prioritize by Payment**:
- **Outcome**: Deliver highest-paying first, others late
- **Humanity**: -1 (money over relationships)
- **Story Flag**: Low-paying clients mark you as unreliable

**Option B - Prioritize by Relationship**:
- **Outcome**: Deliver to NPCs you care about first
- **Humanity**: +2 (loyalty)
- **Story Flag**: Strengthen important relationships, damage others

**Option C - Prioritize by Urgency** (Medical/time-sensitive):
- **Outcome**: Deliver life-saving meds first, less urgent packages late
- **Humanity**: +4 (ethics over efficiency)
- **Story Flag**: Some clients angry, but morally justified

**Option D - Attempt All** (Extreme effort):
- **Outcome**: Rush all three, probably deliver 2/3 on time, 1 late
- **Humanity**: 0 (maximum effort)
- **Story Flag**: Mixed results, some satisfaction, some complaints

**Option E - Ask for Help**:
- **Player**: Call another courier (Jin, rival, friend) to take one delivery
- **Outcome**: Split load, all deliveries succeed, share payment
- **Humanity**: +3 (cooperation, humility)
- **Story Flag**: `COOPERATIVE_COURIER` (allies with others)

**Option F - Algorithm Triage** (If Tier 3+):
- **Algorithm**: "Optimal strategy: Deliver A and C. Abandon B. Net rating impact: +3."
- **Player can follow or override**
- **Humanity**: -3 if follow (calculated abandonment), +2 if override for ethical reasons

**Reusability**: Can occur at any tier. Adjust number and urgency of deliveries. Great for moral choice.

---

### TIME-03: Chase Sequence

**Setup**: Someone chasing player (rival, gang, corpo security) while on deadline.

**Trigger**: Player enters hostile territory or has valuable package

**PURSUER** (shouting behind):
"Stop! We're not letting you through!"

[Sounds of pursuit: footsteps, augment whir, vehicles]

**CHASE DYNAMICS**:
- Player must navigate while being pursued
- Time limit: Both chase escape AND delivery deadline
- Multiple obstacles: Environmental, hostile, time

**PLAYER OPTIONS**:

**Option A - Outrun** (Speed challenge):
- **Outcome**: Use speed augments/parkour to escape
- **Humanity**: 0 (physical solution)
- **Success**: Deliver on time, escape pursuers
- **Failure**: Caught, package stolen/damaged

**Option B - Fight** (Combat):
- **Outcome**: Turn and confront pursuers
- **Humanity**: -2 (violence)
- **Time Cost**: Major delay, probable late delivery
- **Risk**: Injury, package damage
- **Story Flag**: Hostile relationship with pursuer faction

**Option C - Negotiate While Moving**:
- **Player** (shouting back): "What do you want? We can deal!"
- **Outcome**: Moving negotiation, might avoid fight
- **Humanity**: +1 (attempted diplomacy)
- **Success**: Pursuers accept deal (toll, info, favor)
- **Failure**: Pursuers don't stop, forced to run or fight

**Option D - Environmental Tricks**:
- **Drop obstacles** behind you
- **Use crowd** to lose pursuit
- **Navigate tight spaces** pursuers can't follow
- **Outcome**: Creative escape, minimal time loss
- **Humanity**: +1 (clever)
- **Story Flag**: `ESCAPE_ARTIST`

**Option E - Abandon Package** (Survival):
- **Outcome**: Drop package, escape easily, fail delivery
- **Humanity**: -3 (self-preservation over commitment)
- **Story Flag**: `ABANDONED_DELIVERY`, massive rating penalty, client fury
- **Justification**: Sometimes survival trumps job

**Option F - Algorithm Evasion** (If Tier 3+):
- **Algorithm**: "Pursuers mapped. Optimal evasion route calculated. Follow precisely."
- **Outcome**: Algorithm guides perfect escape route
- **Humanity**: -1 (reliance on Algorithm)
- **Success**: Clean escape, deliver on time
- **Story Flag**: `ALGORITHM_SAVED_LIFE`

**Reusability**: High-action complication. Can occur with any hostile faction. Adjust pursuer type and motivation.

---

## Integration Examples

### Example Quest with Layered Complications

**Quest**: "Deliver medical supplies to free clinic in Red Harbor"

**Complication Layer 1** - ENV-01 (Severe Weather):
- Storm hits mid-delivery
- Player chooses: Push through (risky) or find alternate route

**Complication Layer 2** - HE-01 (Gang Territory):
- Alternate route goes through gang checkpoint
- Player must pay toll, fight, or negotiate

**Complication Layer 3** - SOC-02 (Moral Dilemma):
- En route, player sees gang shaking down civilian
- Must choose: Intervene (delay, risk) or ignore (guilt, Humanity loss)

**Result**: Simple delivery becomes complex moral challenge with multiple decision points.

---

### Example Quest with Technical + Time Pressure

**Quest**: "Urgent corporate delivery to Nakamura Tower"

**Complication Layer 1** - TECH-01 (Augment Malfunction):
- Player's mobility augments fail
- Must navigate slower or seek repair (time cost)

**Complication Layer 2** - TIME-01 (Impossible Deadline):
- Client demands arrival in 10 minutes
- Already lost time due to augment failure

**Complication Layer 3** - HE-03 (Corpo Security):
- Checkpoint shakedown at Nakamura entrance
- Must bribe, show permits, or argue (more time loss)

**Result**: Technical failure cascades into time pressure, forcing desperate choices.

---

## Complication Balance Guidelines

### Frequency
- **Light Delivery** (0-1 complications): Tutorial, simple tasks
- **Standard Delivery** (1-2 complications): Normal difficulty
- **Complex Delivery** (2-3 complications): Challenge, story importance
- **Nightmare Delivery** (3+ complications): Rare, memorable, high stakes

### Difficulty Scaling
- **Tier 0-2**: Simple complications, clear solutions, low stakes
- **Tier 3-5**: Medium complications, moral choices, moderate consequences
- **Tier 6-9**: Complex complications, layered challenges, major consequences
- **Tier 10**: Multiple simultaneous complications, endgame stakes

### Narrative Weight
- Not every complication needs deep story impact
- Use some for tension/gameplay variety
- Use others for character development and moral choice
- Balance action complications (hostile, chase) with reflection complications (social, moral)

---

## Story Flag Impact Summary

Complications create these recurring flags:

**Relationship Flags**:
- `GANG_[NAME]_RELATIONSHIP`
- `RIVAL_[NAME]_RELATIONSHIP`
- `CORPO_[FACTION]_RELATIONSHIP`
- `CHEN_RELATIONSHIP`, `ROSA_RELATIONSHIP`, etc.

**Reputation Flags**:
- `LOCAL_HERO`
- `DELIVERY_HERO`
- `PARKOUR_EXPERT`
- `ESCAPE_ARTIST`
- `TRAITOR_COURIER`
- `RULE_BREAKER`

**Technical Flags**:
- `ALGORITHM_DEPENDENCY`
- `ALGORITHM_ILLEGAL_ACCESS`
- `AUGMENT_DAMAGE_[TYPE]`
- `ANALOG_NAVIGATION`

**Moral Flags**:
- `INTERVENTION_[TYPE]`
- `IGNORED_SUFFERING`
- `COOPERATIVE_COURIER`
- `CRISIS_HERO`

These flags ripple forward, affecting future interactions, available options, and narrative outcomes.

---

## Writer Notes

When using these complications:

1. **Adapt to Context**: Change NPC names, locations, and stakes to match current quest
2. **Reference History**: Check player's story flags to customize reactions
3. **Layer Thoughtfully**: Don't overwhelm—2-3 complications maximum per quest
4. **Vary Types**: Mix hostile, environmental, social, technical, and time pressure
5. **Consequences Matter**: Every complication should impact story flags, relationships, or Humanity
6. **Player Agency**: Always provide meaningful choice, even in difficult situations
7. **Tone Consistency**: Match complication severity to narrative moment

---

**Complications Total**: 15 modular encounters
**Categories**: 5 (Hostile, Environmental, Social, Technical, Time Pressure)
**Reusability**: Infinite—adapt to any quest, tier, or location
**Purpose**: Create dynamic, unpredictable delivery experiences that reinforce themes of choice, consequence, and the cost of survival in Surge Protocol's world

---

## Related Content
- Quest Templates: `/03_QUESTS/templates/`
- Story Flags: `/13_METADATA_TRACKING/story_flags_master_list.md`
- Faction Content: `/05_WORLD_TEXT/lore/factions/`
- Character Files: `/01_CHARACTERS/`
