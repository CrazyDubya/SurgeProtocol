# Side Quest: The Hollows Market Mystery

## Quest Metadata

- **Quest ID**: SQ_HOLLOWS_MARKET_MYSTERY
- **Quest Name**: "The Hollows Market Mystery" / "The Disappeared"
- **Type**: Environmental Quest / Mystery Investigation
- **Tier Availability**: 2-4
- **Estimated Duration**: 20-25 minutes
- **Location**: The Hollows (Market District, Underground Tunnels, Abandoned Medical Facility)
- **Key NPCs**: Market Vendor Amara, Missing Persons (3), Human Traffickers (4-6), Corrupt Security Officer

## Prerequisites

- **Required**:
  - `TIER_1_COMPLETE = true` (player has baseline courier skills)
  - `HOLLOWS_DISCOVERED = true` (player knows starting area)

- **Optional Enhancers**:
  - `TANAKA_RELATIONSHIP >= 10` (Tanaka can provide medical insight)
  - `CHEN_RELATIONSHIP >= 10` (Chen knows Hollows well, can offer contacts)
  - `DETECTIVE_AUGMENT = true` (optical analysis chrome, makes investigation easier)

## Synopsis

The Hollows Market—a sprawling open-air bazaar where 50,000+ residents buy, sell, and survive—has always been chaotic. But recently, people have been disappearing. Not the usual corporate poaching or gang violence. Something quieter, more systematic.

Amara, a fruit vendor who's run her stall for 15 years, asks the player to investigate. Three people vanished in the last month: a young woman (Keiko, 19), an elderly man (Mr. Torres, 67), and a child (Anya, 12). No bodies, no witnesses, no pattern—except they all disappeared after visiting the "Free Medical Clinic" at the market's edge.

Investigation reveals a horrifying truth: The clinic is a front for human trafficking. Nakamura subcontractors harvest "voluntary organ donors" from desperate Hollows residents—offering cash upfront for "donation agreements," then disappearing people for live organ harvesting. The three missing persons are being held in an underground facility, sedated, awaiting harvest.

Player must decide: Expose the operation (loud, corpo attention), quietly rescue victims (risky infiltration), or destroy the facility entirely (violent but permanent).

## Story Context & Themes

### Thematic Role
- **Core Theme**: Corpo exploitation extends to literal human harvesting
- **Secondary Theme**: Hollows residents are disposable to the system
- **Narrative Function**:
  - Establishes baseline corpo horror (early game, sets tone)
  - Shows player that even "legal" corpo operations are monstrous
  - Grounds abstract dystopia in concrete human cost
  - Provides environmental storytelling (Hollows as exploited community)

### World-Building
- **Reveals**: Organ trade is legal if contracts signed ("voluntary donation")
- **Establishes**: Nakamura uses shell companies/subcontractors for dirty work
- **Connects**: Links corpo biotech needs to Hollows population exploitation
- **Foreshadows**: Ascension program's disregard for human life (bodies are resources)

### Emotional Stakes
- Missing persons have faces, stories, families
- Hollows community is vulnerable, needs protection
- Player sees early consequences of inaction (people die if player ignores quest)

## Narrative Beats

### Beat 1: The Request
**Location**: Hollows Market (Amara's Fruit Stall)
**Trigger**: Player passes through market at Tier 2+, Amara calls out

**Scene**:
Amara's stall is simple: fruit crates, faded awning, hand-written price signs. She's in her 50s, weathered, sharp-eyed. She flags down the player.

**Dialogue** (Amara):
> "You. Courier, right? I've seen you around. You know the Hollows."
>
> *(Leans in, quieter)* "People are disappearing. Three in the last month. Keiko, Mr. Torres, little Anya. No bodies, no ransom demands, no gang tags claiming credit. Just... gone."
>
> "Security won't investigate—says people leave the Hollows all the time, probably found better work elsewhere. But I've been here 15 years. I know when something's wrong."
>
> *(Pulls out photos: three faces, printed on cheap paper)* "They all visited that new clinic before they vanished. Free healthcare, too good to be true. Place opened six months ago, edge of the market. 'Community Wellness Initiative.' Corporate-funded."
>
> "I can't investigate myself—I've got a stall to run, two kids to feed. But you... you move around. People talk to you. Could you look into it? Please. I think something bad is happening."

**Player Responses**:
1. **"I'll investigate."** → Accepts quest, Amara provides photos + clinic location
2. **"What's in it for me?"** → Amara: "I can pay 500 credits. It's all I have." (Optional: Refuse payment for +10 HOLLOWS_REPUTATION)
3. **"Why me?"** → Amara: "Because you're not corpo, not gang. You're independent. That means you might actually care."
4. **"People disappear all the time."** → Amara: "Not like this. Not from the same place. This is targeted."
5. **[Refuse quest]** → Quest fails, three weeks later news reports bodies found (player guilt, -10 HOLLOWS_REPUTATION)

### Beat 2: Investigation Phase
**Location**: Multiple (Hollows Market, Clinic, Underground)
**Duration**: 10-12 minutes

**Investigation consists of three parallel tracks (player can pursue any order):**

**Track A: Interview Witnesses**

Player talks to market vendors, residents who knew the missing persons:

**Witness 1 - Keiko's Mother** (produce stall):
> "Keiko was saving for chrome. Courier augments, like you. She said the clinic offered 5,000 credits for 'donation agreement'—sign a contract, donate a kidney next year, get paid upfront. She needed the money."
>
> "She went in three weeks ago. Never came out. When I went to the clinic, they said she'd left through the back exit. But her stuff is still in our apartment. She wouldn't leave without telling me."

**Witness 2 - Torres's Friend** (scrap dealer):
> "Torres had lung disease. 40 years in the factories. The clinic said they'd treat him for free—experimental therapy, no cost. He was desperate, couldn't afford real treatment. He went in. That was four weeks ago."

**Witness 3 - Anya's Neighbor** (food cart):
> "Anya's parents died two years ago. She's been living with her grandmother. The clinic approached them—said they needed child volunteers for nutrition study, would pay 1,000 credits. Grandmother said yes. We haven't seen Anya since."

**Track B: Investigate the Clinic**

**Clinic Exterior**:
- Modest storefront, clean signage: "Community Wellness Initiative - Free Healthcare"
- Corporate logo: Nested Medical Solutions (Nakamura shell company, player can discover with TECH check)
- Open during market hours, friendly staff visible through windows

**Clinic Interior** (Player poses as patient or sneaks in):
- Front: Legitimate waiting room, basic medical supplies, 2-3 real patients being treated
- Staff: Friendly nurses, one doctor (Dr. Reeves, corpo contractor)
- **TECH Check** (Difficulty 4): Hack terminal, find patient records
  - Records show Keiko, Torres, Anya all signed "voluntary donation agreements"
  - Notation: "Subjects transferred to Facility 7-B for processing"
  - Payout records: 5,000cr (Keiko), 3,000cr (Torres), 1,000cr (Anya's guardian)

**Clinic Back Room** (Stealth infiltration required):
- Storage area with medical equipment
- Hidden door (PERCEPTION check to notice, or TECH check to find via blueprints)
- Door leads to tunnel system beneath market
- Security: 1-2 guards (can be bypassed via stealth or distraction)

**Track C: Follow the Money**

**Financial Investigation** (TECH-focused):
- Trace clinic funding: Nested Medical Solutions → Nakamura Biotech (shell company)
- Contract analysis: "Voluntary donation" agreements have fine print—donors can be "called for harvest" at any time, sedation/detention authorized if non-compliant
- Payment records: Clinic has processed 47 "donors" in 6 months (only 3 recent disappearances—where are the other 44?)
- **Discovery**: Other 44 donors are scheduled for future harvest, currently walking around unaware

### Beat 3: The Discovery
**Location**: Underground Facility (beneath Hollows Market)
**Duration**: 5-8 minutes

**Infiltration** (via clinic back room tunnel OR find alternate entrance via market maintenance tunnels):

**Facility Description**:
- Converted maintenance tunnels, 20m underground
- Medical equipment: Operating tables, cryo-storage, organ transport containers
- 6-8 holding cells (chain-link fence cages, each 3m × 3m)
- Staff: 4-6 traffickers (mix of security + medical techs)
- Lighting: Harsh fluorescent, sterile

**Finding the Victims**:
Player discovers three cells occupied:

**Cell 1 - Keiko** (19, sedated but conscious):
> *(Weakly)* "Help... they said I'd donate next year. But they took me same day. Contract said they could. I signed it. I didn't read it all."
>
> "They're keeping me here until... until the buyer is ready. Rich corpo needs a kidney. I'm the match."

**Cell 2 - Mr. Torres** (67, heavily sedated):
> *(Barely coherent)* "Lungs... they said they'd cure my lungs... instead they're taking them... giving them to someone younger... someone who can pay..."

**Cell 3 - Anya** (12, terrified but fighting sedation):
> "I want my grandmother. They said it was a nutrition study. They lied. Please get me out. Please."

**Additional Discovery** (optional, if player explores):
- **Harvest Schedule**: Lists next 8 "donors" for harvest over next month
- **Transport Logs**: Organs shipped to Nakamura Medical, Uptown facilities, even off-world
- **Financial Records**: Each "donor" nets 50,000-200,000 credits (buyers pay premium, donors got 1,000-5,000)

**Complication - Guards Notice Player**:
If player's stealth fails (or player triggers alarm):
- 4-6 traffickers respond (combat encounter OR fast-talk/bribe OR flee)
- Dr. Reeves (clinic doctor) is on-site, tries to justify: "This is legal. Contracts were signed. Nakamura vetted everything."

### Beat 4: The Choice
**Location**: Underground Facility
**Decision Point**: How to resolve the situation

**Option A: Quiet Rescue** (Stealth/Minimal Violence):
- Free the three victims, escort them out via tunnels
- Avoid killing traffickers (knock out, evade, or negotiate)
- Victims escape, clinic continues operating (may take more victims later)
- **Pros**: Victims saved, low heat, quick resolution
- **Cons**: Clinic remains operational, other 44 contract-holders still at risk

**Option B: Expose the Operation** (Legal/Public):
- Gather evidence (harvest schedule, financial records, victim testimony)
- Deliver to independent media, Hollows community leaders, or even sympathetic corpo contact
- Public scandal erupts, clinic shut down, Nested Medical dissolved
- **Pros**: Clinic destroyed, all 47 contract-holders freed, justice served
- **Cons**: Nakamura tracks investigation back to player (+20 NAKAMURA_HOSTILITY), slow bureaucratic process (victims remain captive during exposure)

**Option C: Destroy the Facility** (Violence/Direct Action):
- Kill or disable all traffickers
- Free all three victims
- Sabotage facility (flood tunnels, collapse structure, burn medical equipment)
- **Pros**: Immediate victim rescue, clinic can't operate, sends message
- **Cons**: Violent (morality cost if player kills), corpo retaliation likely, collateral damage possible

**Option D: Negotiate Release** (Social Engineering - Hidden):
- [Only if CHARISMA >= 6 OR player has significant credits]
- Offer to buy the victims' contracts: 15,000 credits total (5k each)
- Dr. Reeves calculates: Losing 3 donors vs. guaranteed payment now + avoiding investigation
- He accepts, victims released "legally," clinic continues
- **Pros**: No violence, fast resolution, legal protection (contracts fulfilled)
- **Cons**: Very expensive, clinic continues operating, other donors still at risk, morally compromised

**Option E: Call Authorities** (Naive Option - Leads to Failure):
- Player reports to Hollows Security
- Security is paid off by Nakamura, "investigates" and declares clinic legitimate
- Victims remain captive, contracts upheld as legal
- Quest fails, victims harvested within week (news reports later)
- Player learns: Official channels are corpo-controlled

### Beat 5: Resolution

**Outcomes vary by choice:**

**If Quiet Rescue**:
- Player escorts Keiko, Torres, Anya out via tunnels
- Victims reunite with families (emotional scene at Amara's stall)
- Amara: "You saved them. I'll never forget this."
- Clinic continues operating (ambient NPC dialogue later: "Another person missing from the market...")
- +20 HOLLOWS_REPUTATION, +500 credits from Amara (if accepted payment initially)

**If Expose Operation**:
- Evidence goes public, media scandal erupts
- Clinic raided by authorities (forced to act under public pressure)
- All 47 contract-holders released, Nested Medical shut down
- News reports: "Human Trafficking Ring Exposed in Hollows Market"
- Nakamura denies knowledge, blames "rogue subcontractor"
- +35 HOLLOWS_REPUTATION, +20 NAKAMURA_HOSTILITY, +1,500 credits (whistleblower bounty from independent media)

**If Destroy Facility**:
- Player frees victims, kills/disables traffickers, sabotages facility
- Tunnels collapse or flood, facility destroyed permanently
- Corpo response: Nakamura condemns "terrorist attack," increases Hollows security presence
- Hollows residents quietly grateful (know it was necessary)
- +40 HOLLOWS_REPUTATION (underground), +30 NAKAMURA_HOSTILITY, no credits (illegal action)

**If Negotiate Release**:
- 15,000 credits exchanged, victims released legally
- Dr. Reeves: "Pleasure doing business. Contracts fulfilled, everyone's happy."
- Clinic continues operating (contracts with other 44 people still active)
- Victims are grateful but player feels compromised
- +15 HOLLOWS_REPUTATION, +10 NAKAMURA_LOYALTY (played by corpo rules), -15,000 credits

**If Call Authorities (Failure)**:
- Security declares clinic legitimate
- Three weeks later: News reports three unidentified bodies found in medical waste
- Amara confronts player: "You trusted the system. They died because you did."
- -25 HOLLOWS_REPUTATION, permanent guilt dialogue, quest marked as failed

## Quest Completion

### Epilogue - Success Outcomes

**Short-term** (days after resolution):
- Victims recover (visible in Hollows if player visits: Keiko at her stall, Torres resting, Anya with grandmother)
- Amara's gratitude (discount at market, +10% from all Hollows vendors if exposed operation)
- Market atmosphere changes (more cautious, or more hopeful, depending on outcome)

**Long-term** (Tiers 5-10):
- **If Exposed**: Hollows residents trust player as someone who fights for them
- **If Destroyed**: Corpo presence increases (more security checkpoints, residents more oppressed but grateful to player)
- **If Quiet Rescue**: Clinic replaced by different front operation (Nakamura learns, adapts)
- **If Negotiated**: Player struggles with moral compromise (NPC dialogue reflects this)

### Ending Impacts

**Third Path Ending**:
- If exposed/destroyed: Demonstrates player's commitment to protecting vulnerable (community trust foundation)
- If negotiated: Complicates Third Path (used corpo methods, compromised ethics)

**Rogue Ending**:
- If destroyed: Reinforces anti-corpo violence, easier Rogue path
- If quiet rescue: Shows pragmatic survival (aligned with Rogue philosophy)

**Ascension Ending**:
- Ironic callback: Player exposed organ trafficking, then voluntarily uploads (became the organ donor)

## Consequences & Story Flags

### Story Flags Set

```
HOLLOWS_MARKET_MYSTERY_COMPLETE = true
MARKET_MYSTERY_RESOLUTION = "quiet_rescue" / "exposed" / "destroyed" / "negotiated" / "failed"
KEIKO_SAVED = true/false
TORRES_SAVED = true/false
ANYA_SAVED = true/false
ORGAN_TRAFFICKING_EXPOSED = true/false (if exposed publicly)
NESTED_MEDICAL_SHUT_DOWN = true/false (if exposed or destroyed)
```

### Relationship Changes

- `HOLLOWS_REPUTATION`: +20 to +40 (depending on method)
- `NAKAMURA_HOSTILITY`: +20 to +30 (if exposed or destroyed)
- `NAKAMURA_LOYALTY`: +10 (if negotiated—played by their rules)
- `AMARA_RELATIONSHIP`: +30 (personal gratitude)
- `TANAKA_RELATIONSHIP`: +5 (if consulted, appreciates ethical medical concern)

### World State Changes

- **If Exposed**:
  - News broadcasts reference scandal
  - NPCs discuss organ trafficking exposure
  - Hollows residents more wary of "free" corpo services
  - Security checkpoints mention "increased scrutiny on shell companies"

- **If Destroyed**:
  - Corpo security presence increases in Hollows
  - Underground market becomes more cautious
  - NPCs whisper about "market justice"

- **If Quiet Rescue**:
  - Clinic continues, replaces victims with new targets
  - Ambient NPC dialogue: "Still hearing about disappearances..."

## Rewards

### Experience
- **Base XP**: 2,500 XP
- **Bonus XP**:
  - +500 XP for saving all three victims
  - +750 XP for exposing operation (most difficult, highest justice)
  - +300 XP for non-lethal resolution

### Credits
- **Quiet Rescue**: 500 credits (Amara's payment, optional)
- **Exposed**: 1,500 credits (whistleblower bounty)
- **Destroyed**: 0 credits (illegal action)
- **Negotiated**: -15,000 credits (cost of buying contracts)

### Items
- **Evidence Files** (Readable Item, if exposed):
  - Harvest schedules, financial records, contracts
  - Can be shared with journalists, authorities, NPCs
  - Proves corpo exploitation with hard data

- **Keiko's Gratitude Token** (Equipable Charm, if saved):
  - Small hand-carved pendant
  - +5% discount at all Hollows Market vendors
  - Visible symbol of community connection

### Reputation
- **Hollows District**: +20 to +40 (depending on method)
- **Market Vendors**: +15 (if exposed—protected community)
- **Nakamura Biotech**: -20 to -30 (if exposed or destroyed)

### Unlocked Content
- **If Exposed**: Hollows Community Missions unlock (3-5 additional quests defending Hollows from corpo)
- **If Destroyed**: Underground Resistance contacts (radical anti-corpo NPCs become available)

## Dialogue Estimates

- **Amara**: 60-80 lines (quest giver, resolution reactions)
- **Victims** (Keiko, Torres, Anya): 80-100 lines combined (interviews, rescue, aftermath)
- **Witnesses**: 60-80 lines (investigation phase)
- **Dr. Reeves / Traffickers**: 60-80 lines (confrontation, negotiation, combat dialogue)
- **News Reports**: 20-30 lines (if exposed)
- **Background NPCs**: 40-60 lines (market atmosphere, aftermath)

**Total Estimated Dialogue**: 320-430 lines

## Writer Notes

### Tone Considerations
- **Horror Grounded in Reality**: Organ trafficking is real-world issue, treat with gravity
- **Victims Have Agency**: Not helpless props—they resist, have perspectives, make choices
- **Corpo Banality**: Dr. Reeves isn't cackling villain—he's bureaucrat following contracts
- **Hollows as Community**: Not just poverty porn—residents have dignity, culture, mutual aid

### Gameplay Balance
- Early-game quest (Tier 2-4), accessible difficulty
- Multiple skill paths viable (TECH investigation, STEALTH infiltration, CHARISMA negotiation, COMBAT destruction)
- Failure is possible but not arbitrary (calling authorities is logical but naive)
- Moral complexity without preaching (player decides what justice means)

### Narrative Integration
- **Establishes**: Corpo exploitation is literal (body harvesting, not just metaphor)
- **Contrasts**: Later Ascension choice (voluntary upload vs. forced organ harvest—both reduce people to parts)
- **Echoes**: Tanaka's ethical medicine (antithesis of this clinic's predatory model)
- **Foreshadows**: Yamada's Ascension pitch (corpo treating bodies as upgrade-able products)

### Real-World Sensitivity
- Organ trafficking is real, affects vulnerable populations globally
- Quest treats subject seriously, not exploitatively
- Victims are humanized, not just statistics
- Avoids graphic medical horror (implied, not described in detail)

### Character Voice - Amara
**Traits**: Protective, community-minded, working-class wisdom, maternal
**Dialogue Style**: Direct, practical, emotional but not sentimental

Example dialogue:
> "I've watched this market for 15 years. I know when something's hunting my people. And I know when someone might actually do something about it."

### Cross-References
- **Related Quests**:
  - Tanaka's Research (ethical medicine vs. predatory medicine)
  - Union Organizing (corpo exploitation of bodies for labor, here for organs)
  - Chen's Legacy (family bonds, protecting loved ones)

- **Related Characters**:
  - Dr. Tanaka (can consult for medical insight)
  - Chen (knows Hollows, can provide contacts)
  - Amara (new character, community representative)

- **Related Locations**:
  - The Hollows (market district specifically)
  - Underground tunnels (infrastructure layer beneath city)

## Alternative Outcomes / Failed States

### Partial Success States

**Save 1-2 Victims** (if player is detected mid-rescue):
- Combat erupts, player must flee with whoever they freed
- Remaining victims harvested (news reports deaths)
- Partial completion: Some saved, some lost
- Guilt dialogue, -10 HOLLOWS_REPUTATION (couldn't save everyone)

**Expose but Victims Die** (if exposure takes too long):
- Evidence gathering is thorough but slow
- By the time scandal breaks, victims already harvested
- Clinic shut down, but too late
- Pyrrhic victory: Justice served, but people died
- +20 HOLLOWS_REPUTATION (tried), permanent guilt

### Complete Failure States

**Player Ignores Quest**:
- Amara's request dismissed or forgotten
- Three weeks later: Bodies found in medical waste
- -25 HOLLOWS_REPUTATION, Amara refuses future interaction
- Clinic continues operating (ambient disappearances continue)

**Player Killed in Facility**:
- Combat failure, player dies (game over OR respawn)
- Victims remain captive
- Can retry quest from investigation phase

### Betrayal Option (Dark Path)

**Player Sides with Clinic**:
- [Hidden option, only if player extremely cynical/corrupt]
- Dr. Reeves offers 10,000 credits to "look the other way"
- Player accepts, leaves victims to die
- +10,000 credits, +15 NAKAMURA_LOYALTY, -50 HOLLOWS_REPUTATION (permanent pariah)
- Locked out of Hollows community quests
- NPCs in Hollows refuse service, spit at player
- Moral weight: Victims die, player complicit

## Speedrun Route

**Fastest Path** (Optimal efficiency):
1. Accept Amara's quest (2 minutes)
2. Skip witness interviews, go directly to clinic (time-saving)
3. STEALTH infiltrate back room, find tunnel entrance (3 minutes)
4. Navigate to facility, avoid guards (4 minutes)
5. Free three victims immediately (Quiet Rescue path, 2 minutes)
6. Escort out via tunnels (3 minutes)
7. Return to Amara (1 minute)
**Estimated Time**: 15-18 minutes
**Tradeoff**: Minimal evidence gathered, clinic continues operating

**Optimal Justice Path** (Thorough):
1. Accept quest (2 minutes)
2. Interview all three witnesses (5 minutes)
3. Investigate clinic + hack terminal (4 minutes)
4. Infiltrate facility + gather all evidence (6 minutes)
5. Expose operation publicly (3 minutes)
6. Wait for authorities to raid (automated, 2 minutes)
7. Return to Amara (1 minute)
**Estimated Time**: 23-25 minutes
**Result**: Maximum justice, all victims saved + clinic shut down

## Quest Hook Delivery

### How Players Discover This Quest

**Primary Hook**: Amara calls out in market
- Player passes through Hollows Market at Tier 2+
- Amara: "You. Courier. Can I talk to you?"

**Secondary Hook**: Overhear market gossip
- NPCs discussing disappearances in ambient dialogue
- Player investigates, leads to Amara

**Tertiary Hook**: Chen reference (if CHEN_RELATIONSHIP >= 10)
- Chen mentions: "Amara at the market is worried about missing people. You should talk to her."

**Hidden Hook**: Tanaka reference (if visiting clinic for healing)
- Tanaka: "That free clinic at the market... something doesn't sit right. Too good to be true."

## Replayability Notes

**Multiple Playthroughs**:
- Each resolution method reveals different aspects:
  - Quiet rescue: Personal heroism, immediate gratification
  - Expose: Systemic justice, bureaucratic process
  - Destroy: Direct action, violent resistance
  - Negotiate: Moral compromise, pragmatic survival

**Moral Variance**:
- Players can approach from different ethics:
  - Idealist: Expose (maximum justice, risk to self)
  - Pragmatist: Quiet rescue (save immediate victims, accept limits)
  - Revolutionary: Destroy (send message, accept violence)
  - Compromised: Negotiate (save these three, ignore system)

**Discovery Variance**:
- Can find facility via clinic infiltration OR market tunnel exploration
- Can learn truth via witness interviews OR digital forensics
- Multiple paths to same discovery (player agency respected)

## Meta Notes

**Word Count**: ~5,300 words
**Complexity**: Medium-High (investigation mechanics, multiple resolution paths, moral weight)
**Integration Level**: Moderate (establishes Hollows community bonds, corpo horror baseline)
**Estimated Implementation Time**: Moderate (investigation system, underground facility, branching outcomes)

**Playtester Focus Areas**:
- Does investigation feel like detective work or checklist?
- Are victims sympathetic without being patronizing?
- Is failure (calling authorities) telegraph clearly enough?
- Does moral weight feel earned or manipulative?
- Are stealth/investigation paths discoverable?

---

**Related Files**:
- Location: `/05_WORLD_TEXT/locations/districts/the_hollows.md`
- Character: `/01_CHARACTERS/tier_0-3_npcs/dr_tanaka.md`
- Character: `/01_CHARACTERS/tier_0-3_npcs/chen_dispatch.md` (not yet written, referenced)
- Quest: `/03_QUESTS/side_quests/tanakas_research.md` (ethical medicine parallel)
- Quest: `/03_QUESTS/side_quests/union_organizing.md` (corpo exploitation parallel)

**Quest Design Philosophy**: Environmental quests should make locations feel lived-in and dangerous. The Hollows isn't just poverty—it's a community under active predation. This quest establishes that corpo horror isn't abstract (upload, augmentation) but immediate (bodies harvested for organs). Early-game quest with mature themes—sets tone that this world is genuinely dystopian, not just aesthetic.
