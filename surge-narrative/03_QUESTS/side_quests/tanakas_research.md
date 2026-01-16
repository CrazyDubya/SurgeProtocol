# Side Quest: Tanaka's Research

## Quest Metadata

- **Quest ID**: SQ_TANAKA_RESEARCH
- **Quest Name**: "Tanaka's Research"
- **Type**: Character Development (Dr. Yuki Tanaka)
- **Tier Availability**: 4-6
- **Estimated Duration**: 25-30 minutes
- **Location**: The Hollows (Tanaka's Clinic), Red Harbor (Research Site), Uptown Corporate (Nakamura Archive)
- **Key NPCs**: Dr. Yuki Tanaka, Research Subjects (3), Nakamura Security (optional encounter)

## Prerequisites

- **Required**:
  - `TANAKA_RELATIONSHIP >= 20` (established trust)
  - `TIER_3_COMPLETE = true` (player has experienced mid-game chrome)

- **Optional Enhancers**:
  - `HUMANITY_SCORE <= 40` (player understands chrome degradation personally)
  - `YAMADA_ENCOUNTERED = true` (contrast with Ascension program)
  - `PLAYER_FORKED = true` (deeper understanding of identity crisis)

## Synopsis

Dr. Tanaka has been quietly conducting long-term research on humane augmentation: chrome that works *with* the human body instead of replacing it. She's been studying three subjects for 5+ years—all Hollows residents who couldn't afford corpo chrome and volunteered for experimental organic-synthetic hybrid augments.

The research is working. Her subjects report 40% less neural degradation, maintained emotional range, and no identity dissociation. But she needs more data, and Nakamura Biotech has classified research from 15 years ago that could complete her work—research they buried because it threatened the Ascension profit model.

Tanaka asks the player to help her: either steal the archived research from Nakamura's Uptown servers, or help her conduct final tests on willing subjects to prove her thesis independently. The choice reveals whether the player believes in reforming the system from within (steal research, use corpo knowledge against them) or building alternatives outside it (independent verification).

## Story Context & Themes

### Thematic Role
- **Core Theme**: Ethical science vs. profit-driven exploitation
- **Secondary Theme**: Can you fix a broken system with stolen pieces, or must you build something entirely new?
- **Narrative Function**:
  - Establishes Tanaka as active resistance (not just passive healer)
  - Introduces humane augmentation as viable Third Path technology
  - Foreshadows Tier 9 choice mechanics (reform vs. revolution vs. transcendence)
  - Contrasts directly with Yamada's Ascension recruitment

### Character Development (Tanaka)
- **Before Quest**: Compassionate clinic doctor, ethical opposition to corpo chrome
- **During Quest**: Revealed as covert researcher, active system opponent
- **After Quest**: Becomes crucial Third Path ally OR bitter about player's methods
- **Relationship Arc**: Trust → Collaboration → Respect or Disappointment

### World-Building
- **Reveals**: Nakamura buried humane augmentation research 15 years ago
- **Establishes**: Corpo suppression of ethical alternatives isn't conspiracy theory—it's documented policy
- **Connects**: Links Tanaka's clinic work to larger anti-Ascension resistance
- **Foreshadows**: Technology exists for augmentation without humanity loss (Third Path viability)

## Narrative Beats

### Beat 1: The Proposition
**Location**: Tanaka's Clinic (The Hollows)
**Trigger**: Player visits clinic at Tier 4+, TANAKA_RELATIONSHIP >= 20

**Scene**:
Tanaka's clinic is unusually empty—she's closed for the afternoon. She's sitting at her desk reviewing holographic brain scans, three sets displayed side-by-side. She looks exhausted but excited.

**Dialogue** (Tanaka):
> "I'm glad you're here. I need to show you something—and I need your help."
>
> *(Gestures to scans)* "These are three people. Hollows residents. They volunteered for experimental augmentation five years ago when they couldn't afford corpo chrome. I've been tracking them ever since."
>
> "Look at the neural degradation rates. Corpo chrome patients show 60-70% degradation by year five. My subjects? Under 30%. They report stable emotional range, maintained sense of self, minimal dissociation."
>
> *(Leans forward, intense)* "It's working. Augmentation doesn't *have* to destroy you. We can integrate chrome with human biology instead of replacing it."
>
> "But I need more data to prove it. And there's research—Nakamura research from 15 years ago—that could complete my work. They classified it. Buried it. Because humane augmentation doesn't create Ascension candidates."

**Player Responses**:
1. **"What do you need me to do?"** → Proceeds to quest options
2. **"Why would Nakamura bury this?"** → Tanaka explains profit model (Ascension dependency)
3. **"How do you know this research exists?"** → Tanaka reveals source (former Nakamura researcher, now deceased)
4. **[If YAMADA_ENCOUNTERED] "Yamada wouldn't agree with this."** → Tanaka: "Yamada is a true believer. That makes him more dangerous than cynics."

### Beat 2: The Choice
**Location**: Tanaka's Clinic
**Decision Point**: Player chooses approach

Tanaka presents two paths:

**Path A: Corpo Infiltration** (Steal Research)
> "The research is in Nakamura's Uptown data archive—Floor 45, Biotech Historical Records. It's not heavily guarded because they think no one knows it exists. You could get in, copy the files, get out."
>
> "It's risky. But if we have their own research, we prove they *knew* ethical augmentation was possible and chose profit over humanity."

**Path B: Independent Verification** (Conduct Tests)
> "Or we do this ourselves. I have three willing subjects ready for final neural mapping. But I need someone with high-grade chrome to assist—your augments can interface with my scanning rig in ways baseline humans can't."
>
> "It's slower. But we build something they can't claim ownership over. Truly independent research."

**Path C: Recruit Test Subjects** (Expand Study)
> "There's a third option. Help me recruit five more test subjects from Red Harbor. Workers with early-stage corpo chrome degradation. We document the transition to organic-synthetic hybrids, show the reversal in real-time."
>
> "It's the most ethical path—but it takes time, and some corps don't like losing their chrome customers."

**Path D: Corporate Leak** (Whistleblower Route - Hidden Option)
> [Only available if DELILAH_RELATIONSHIP >= 15]
>
> "Actually... I know someone who might help. Delilah, the broker. She has contacts inside Nakamura. Maybe we don't steal the research—maybe we convince someone to *leak* it. Harder to prosecute, easier to spread."

### Beat 3A: Corpo Infiltration Path
**Location**: Nakamura Tower, Floor 45 (Uptown Corporate)
**Duration**: 15-20 minutes

**Execution**:
1. **Approach**:
   - Player travels to Nakamura Tower (Uptown)
   - Must infiltrate past security (Stealth OR Social Engineering)
   - Options:
     - Stealth: Maintenance access, air ducts, service elevator (Reflex check)
     - Social: Fake credentials, bluff as researcher (Charisma check)
     - Bribe: Pay 3,000 credits to corrupt security guard

2. **Archive Floor**:
   - Floor 45 is dimly lit, automated
   - Holographic filing system (pre-AI archive, 15+ years old)
   - Player must navigate classification system: Search for "Project Symbiosis" (buried name)
   - TECH CHECK (Difficulty 4): Successful = full research. Failed = partial data (50% effective)

3. **Complication** (50% chance):
   - **Security Alert**: AI detects unauthorized access
   - Player must escape: Fight security team OR hack door locks OR talk way out
   - If caught: Relationship penalty with Nakamura (-20), potential fine (5,000 credits)
   - If escaped clean: No penalties

4. **Return to Tanaka**:
   - Tanaka reviews data, emotional reaction
   - If full data: "This is everything. They knew. They *knew* and buried it."
   - If partial data: "It's enough. We can work with this."
   - Research successful, Tanaka can now offer humane augmentation services

**Consequences**:
- `TANAKA_RESEARCH_METHOD = "stolen_data"`
- `TANAKA_RELATIONSHIP += 25`
- `NAKAMURA_ATTENTION += 15` (corp is watching player more closely)
- `HUMANE_AUGMENTATION_AVAILABLE = true` (Tanaka's clinic offers new service)

### Beat 3B: Independent Verification Path
**Location**: Hidden Research Site (Red Harbor, abandoned warehouse)
**Duration**: 20-25 minutes

**Execution**:
1. **Research Site Setup**:
   - Tanaka has converted an abandoned Red Harbor warehouse into covert lab
   - Three volunteer subjects present:
     - **Koji** (32, dockworker, arm/shoulder augments)
     - **Anya** (28, factory tech, neural interface)
     - **Marcus** (45, former soldier, leg augments + trauma)

2. **Testing Sequence**:
   - Player assists with neural mapping (interface player's chrome with scanning rig)
   - TECH CHECK sequence (3 checks, Difficulty 3, 4, 5):
     - Check 1: Establish neural baseline
     - Check 2: Map augment-organic interface points
     - Check 3: Measure emotional/identity stability markers
   - Each success improves research quality

3. **Subject Interviews** (Character Development):
   - **Koji**: "I can still feel the sun on my skin. Corpo chrome patients say that fades. Not for me."
   - **Anya**: "My daughter still recognizes me. That's... that's what matters."
   - **Marcus**: "The nightmares are still there. But I don't feel *separated* from them anymore. I can process. Heal, maybe."

4. **Research Completion**:
   - Tanaka analyzes results in real-time
   - Emotional moment: "We did it. We proved it's possible. No corpo IP, no stolen data. Just... proof that there's another way."

**Consequences**:
- `TANAKA_RESEARCH_METHOD = "independent_verification"`
- `TANAKA_RELATIONSHIP += 30` (highest trust—player respected her ethics)
- `HUMANE_AUGMENTATION_AVAILABLE = true`
- `RESEARCH_SUBJECTS_GRATITUDE = true` (Koji, Anya, Marcus may assist player later)
- No corporate attention (under the radar)

### Beat 3C: Recruit Test Subjects Path
**Location**: Red Harbor (Worker Districts, Union Hall)
**Duration**: 20-25 minutes

**Execution**:
1. **Recruitment Phase**:
   - Player must recruit 5 volunteers from Red Harbor workers
   - Target: Workers with early-stage corpo chrome degradation (Tier 2-4 chrome)
   - Recruitment methods:
     - **Union Hall**: Speak to Lopez, ask for volunteers (if LOPEZ_RELATIONSHIP >= 10)
     - **Dockworkers**: Approach individually, explain research (Charisma checks)
     - **Posted Flyers**: Low-effort, attracts 2-3 volunteers automatically (but slower)

2. **Corporate Interference** (Triggered after 3 recruits):
   - Nakamura Biotech notices pattern: workers canceling chrome maintenance appointments
   - Sends representative to "investigate"
   - **Confrontation**:
     - Corpo Rep: "These workers have contractual chrome maintenance obligations. You're interfering with corporate property."
     - Player must respond:
       - **Intimidate**: "Their bodies aren't your property." (Corpo rep backs off if Reflex >= 6)
       - **Negotiate**: Offer to purchase chrome contracts (5,000 credits total, releases workers)
       - **Expose**: Threaten to publicize corpo harassment (Charisma check, corpo backs down)
       - **Ignore**: Corpo harassment continues (workers stay, but NAKAMURA_HOSTILITY += 20)

3. **Research Documentation**:
   - Player assists Tanaka with baseline scans (all 5 subjects)
   - Witnesses augmentation conversion procedure (organic-synthetic hybrid installation)
   - Post-procedure interviews (subjects report immediate improvement in sensation, emotion)

4. **Publication**:
   - Tanaka publishes findings in underground medical network
   - Research spreads to Interstitial, Ghost Network, independent clinics
   - Corpo media attempts to discredit (claims "unverified," "dangerous")

**Consequences**:
- `TANAKA_RESEARCH_METHOD = "expanded_study"`
- `TANAKA_RELATIONSHIP += 28`
- `HUMANE_AUGMENTATION_AVAILABLE = true`
- `RESEARCH_PUBLISHED = true` (knowledge spreads, other doctors can replicate)
- `NAKAMURA_HOSTILITY += 10 to 20` (depending on confrontation outcome)
- `UNION_RELATIONSHIP += 10` (if Lopez assisted)

### Beat 3D: Corporate Leak Path (Hidden)
**Location**: Multiple (Delilah's Office → Nakamura Tower → Red Harbor)
**Duration**: 25-30 minutes
**Requires**: DELILAH_RELATIONSHIP >= 15

**Execution**:
1. **Broker Introduction**:
   - Player visits Delilah, explains situation
   - Delilah: "I know someone. Junior researcher in Nakamura Biotech. Guilty conscience type. She's been looking for a way out—or a way to matter. This could be both."
   - Introduces **Dr. Sarah Chen** (Nakamura junior researcher, Tier 6, ethically conflicted)

2. **Convincing the Whistleblower**:
   - Player meets Sarah in neutral location (Red Harbor café)
   - Sarah is terrified but morally anguished: "I see the Ascension pipeline. We create dependency, then sell upload as salvation. It's... monstrous."
   - Player must convince her to leak research:
     - **Ethical Appeal**: "You could save thousands of people from unnecessary degradation." (Charisma check)
     - **Practical Assurance**: "We'll protect your identity. Anonymous leak, untraceable." (Requires Delilah's infrastructure)
     - **Personal Connection**: Share player's own chrome struggles (if HUMANITY_SCORE <= 40, auto-succeeds)
     - **Financial Incentive**: Offer 8,000 credits (works, but Sarah is bitter about it)

3. **The Leak**:
   - Sarah provides encrypted data packet (full Project Symbiosis research)
   - Delilah distributes through underground channels: medical networks, independent clinics, Ghost Network
   - Research goes viral in resistance communities within 48 hours

4. **Corpo Response**:
   - Nakamura launches internal investigation (witch hunt for leaker)
   - Sarah goes into hiding (Ghost Network extraction if player arranged it, otherwise stressed contact)
   - Corpo media campaigns hard against "unverified" research (public opinion divided)

5. **Return to Tanaka**:
   - Tanaka receives research through underground channels
   - Realizes player orchestrated it: "You didn't just steal it—you made sure everyone could have it. That's... that's the right way."

**Consequences**:
- `TANAKA_RESEARCH_METHOD = "whistleblower_leak"`
- `TANAKA_RELATIONSHIP += 35` (highest possible—player found most ethical path)
- `DELILAH_RELATIONSHIP += 15` (solidified partnership)
- `SARAH_CHEN_PROTECTED = true/false` (depending on player choices)
- `HUMANE_AUGMENTATION_AVAILABLE = true`
- `RESEARCH_PUBLIC = true` (widespread distribution, can't be suppressed)
- `NAKAMURA_HOSTILITY += 25` (corp knows it was targeted action, even if they can't prove player involvement)

## Quest Completion

### Return to Tanaka (All Paths)
**Location**: Tanaka's Clinic

Tanaka reflects on the outcome, dialogue varies by method:

**Stolen Data Path**:
> "You took a risk for this. I won't forget that. Now we have proof—proof they knew all along that chrome didn't have to be a death sentence. We're going to use this. Every person I treat, every augment I install... it's resistance."

**Independent Verification Path**:
> "We did it right. No shortcuts, no stolen IP, no corpo entanglements. This research is *ours*—belongs to the people who volunteered, the communities that supported it. That's how it should be."

**Recruit Test Subjects Path**:
> "Five people already feel the difference. And the research is out there now—other doctors can replicate it, improve it. You helped start something that can't be stopped. That's legacy."

**Whistleblower Leak Path**:
> "You found a way I never considered. Not theft, not isolation—collaboration with someone inside who wanted out. That's... that's how systems actually change. One person with courage, supported by people who believe in them."

### Unlocked Services (All Paths)

**Tanaka's Clinic - New Service: Humane Augmentation Conversion**
- **Service Name**: "Organic-Synthetic Hybrid Conversion"
- **Cost**: 12,000 credits (50% cheaper than corpo chrome upgrade)
- **Effect**:
  - Converts one existing augment to humane version
  - Reduces neural degradation by 40% for that augment
  - Improves HUMANITY_SCORE by +5 per conversion (max +15 total)
  - No stat loss (maintains same functionality)
  - Visible difference: Augment shows organic integration (veins, skin texture blending)
- **Limitation**: Can only convert 3 augments (research still early-stage)

**Narrative Note**: This service becomes crucial for players pursuing Third Path ending (need to maintain humanity while keeping chrome functionality).

## Consequences & Story Flags

### Story Flags Set

```
TANAKA_RESEARCH_COMPLETE = true
TANAKA_RESEARCH_METHOD = "stolen_data" / "independent_verification" / "expanded_study" / "whistleblower_leak"
HUMANE_AUGMENTATION_AVAILABLE = true
RESEARCH_PUBLISHED = true/false (depends on path)
RESEARCH_PUBLIC = true/false (whistleblower path only)
SARAH_CHEN_PROTECTED = true/false (whistleblower path only)
RESEARCH_SUBJECTS_GRATITUDE = true/false (independent path only)
```

### Relationship Changes

- `TANAKA_RELATIONSHIP`: +25 to +35 (varies by path)
- `DELILAH_RELATIONSHIP`: +15 (whistleblower path only)
- `NAKAMURA_HOSTILITY`: +10 to +25 (varies by path)
- `UNION_RELATIONSHIP`: +10 (recruit subjects path if Lopez helped)

### World State Changes

- **Humane Augmentation Spreads**: NPCs in The Hollows begin mentioning "that new chrome that doesn't mess you up"
- **Corpo Response**: If RESEARCH_PUBLIC = true, Nakamura issues public denial statements (visible in world news)
- **Tanaka's Status**: Becomes known in underground medical community, other doctors reference her work
- **Third Path Foundation**: Establishes technological viability of balanced augmentation (critical for Third Path ending)

### Ending Impacts

**Third Path Ending** (Tier 10: The Balanced):
- REQUIRED: `HUMANE_AUGMENTATION_AVAILABLE = true` (player must complete this quest or equivalent research path)
- Tanaka's research proves Third Path isn't just philosophy—it's achievable technology
- In ending, Tanaka is named as co-architect of balanced augmentation movement

**Rogue Ending** (Tier 10: The Exile):
- ENHANCED: If `RESEARCH_PUBLIC = true`, Ghost Network has humane augmentation access (better survival rates for extracted people)
- Tanaka may join Interstitial if player convinced her system is irredeemable

**Ascension Ending** (Tier 10: The Uploaded):
- BITTERSWEET MOMENT: Tanaka's final message before upload includes reference to abandoned research, wasted potential
- Yamada may comment: "She never understood—Ascension transcends the need for humane integration."

## Rewards

### Experience
- **Base XP**: 3,500 XP
- **Bonus XP**:
  - +500 XP if completed without violence
  - +750 XP if whistleblower path (most complex)
  - +300 XP if all recruited subjects survived (recruit path)

### Credits
- No direct credit reward (research is pro-bono)
- SAVES credits long-term: Humane augmentation 50% cheaper than corpo upgrades

### Items
- **Research Notes** (Readable Item):
  - Tanaka's compiled research on organic-synthetic hybrid augmentation
  - Can be shared with other NPCs (Okonkwo, Rosa, Chen) for relationship bonuses (+5 each)
  - Reading it provides TECH +1 insight (one-time bonus)

### Reputation
- **The Hollows**: +15 reputation (Tanaka vouches for player)
- **Underground Medical Network**: +10 reputation (if research published)
- **Nakamura Biotech**: -10 to -25 reputation (varies by method)

## Dialogue Estimates

- **Dr. Tanaka**: 180-200 lines (main quest giver, multiple paths, reflections)
- **Research Subjects** (Koji, Anya, Marcus): 60-80 lines combined (independent path)
- **Dr. Sarah Chen**: 40-50 lines (whistleblower path)
- **Delilah**: 20-25 lines (whistleblower path introduction)
- **Nakamura Security/Representatives**: 30-40 lines (infiltration/confrontation)
- **Red Harbor Workers**: 40-50 lines (recruit path)
- **Lopez**: 15-20 lines (recruit path, if involved)

**Total Estimated Dialogue**: 385-465 lines

## Writer Notes

### Tone Considerations
- **Tanaka's Conviction**: She's not hesitant or apologetic—she's certain she's right and that corpo chrome is designed exploitation
- **Ethical Complexity**: None of the paths are "wrong"—player chooses methodology, not morality
- **Research Subjects**: Treat with dignity—they're volunteers with agency, not victims
- **Corpo Antagonism**: Nakamura isn't cartoonishly evil—they're protecting profit model (banal evil)

### Gameplay Balance
- All four paths should feel viable and rewarding
- Whistleblower path is hardest (requires Delilah relationship, most steps) but most ethically satisfying
- Independent path is safest (no corpo attention) but slowest
- Stolen data path is fastest but highest risk
- Recruit path is middle-ground complexity

### Narrative Integration
- This quest is CRITICAL for Third Path ending viability—without humane augmentation tech, Third Path is just philosophy
- Tanaka's research directly counters Yamada's Ascension pitch (same problem, opposite solutions)
- Foreshadows Tier 9 choice: reform system with its own tools (stolen data) or build new system (independent)

### Character Voice - Tanaka
**Established Traits**: Compassionate, clinically precise, ethically uncompromising
**Quest Development**: Reveals covert resistance operative side, strategic thinker, willing to take risks
**Dialogue Style**: Medical terminology mixed with moral clarity, no euphemisms for corpo exploitation

Example dialogue:
> "Nakamura calls it 'Ascension.' I call it what it is: planned obsolescence of the human body. Create dependency, degrade the substrate, sell upload as salvation. It's the same corporate playbook they use for appliances."

### Cross-References
- **Related Quests**:
  - Main Quest (Tier 6: The Fork) - Tanaka's research provides alternative to standard Fork process
  - Side Quest (Yamada's Recruitment) - Direct ideological contrast
  - Main Quest (Tier 9: The Gathering) - Research subjects may appear if Independent path taken

- **Related Characters**:
  - Dr. Tanaka (quest giver, relationship development)
  - Delilah (whistleblower path facilitator)
  - Yamada (ideological antagonist, not directly present)
  - Okonkwo (will reference research in Third Path discussions)

- **Related Locations**:
  - Tanaka's Clinic (The Hollows) - base of operations
  - Nakamura Tower Floor 45 (Uptown) - infiltration target
  - Red Harbor Research Site (hidden warehouse) - independent path location
  - Union Hall (Red Harbor) - recruit path location

## Alternative Outcomes / Failed States

### Quest Failure Conditions

**Infiltration Path Failure**:
- **Caught and Arrested**: Player captured during Nakamura infiltration
  - Consequence: 72-hour detention, 10,000 credit fine, NAKAMURA_HOSTILITY +40
  - Recovery: Delilah can bail out (costs 15,000 credits), or player serves time
  - Quest status: Can retry with different path, or abandon quest

**Whistleblower Path Failure**:
- **Sarah Chen Exposed**: Corpo traces leak back to Sarah before she's protected
  - Consequence: Sarah arrested, research buried again, DELILAH_RELATIONSHIP -10 (bitter about exposure)
  - Quest status: Failed permanently (can't retry—whistleblower burned)
  - Alternative: Player can attempt jailbreak mission to rescue Sarah (high difficulty, separate quest)

**Subject Safety Failure**:
- **Research Subject Injured**: If player fails TECH checks badly (3+ failures), one subject suffers neural damage
  - Consequence: Tanaka shuts down research, TANAKA_RELATIONSHIP -15, quest fails
  - Emotional impact: Guilt dialogue, subject Anya or Marcus suffers permanent damage
  - Recovery: None—quest failed permanently

### Partial Success States

**Incomplete Data** (Infiltration Path):
- Player escapes with only 50% of research files
- Tanaka can still offer humane augmentation, but limited (only 1 conversion instead of 3)
- Quest marked as "partial success"

**Public Backlash** (Recruit Path):
- Corpo media campaign successfully discredits research in public opinion
- Humane augmentation still available, but NPC dialogue reflects controversy
- Some Hollows residents refuse conversion ("sounds risky," "don't trust it")

## Speedrun Route
For players who want efficient completion:

**Fastest Path**: Corpo Infiltration (Stolen Data)
1. Stealth entry via maintenance tunnels (bypasses social checks)
2. TECH check success on first try (prepare with TECH-boosting items)
3. Clean escape (no security alert)
4. Return to Tanaka
**Estimated Time**: 15-18 minutes

**Optimal Reward Path**: Whistleblower Leak (if Delilah relationship already high)
1. Meet Delilah (quick if DELILAH_RELATIONSHIP >= 15 already)
2. Convince Sarah with personal connection (if HUMANITY_SCORE <= 40, auto-success)
3. Arrange Ghost Network protection for Sarah (costs 5,000 credits but ensures safety)
4. Research distributed, maximum relationship gains
**Estimated Time**: 22-25 minutes

## Quest Hook Delivery

### How Players Discover This Quest

**Primary Hook**: Direct conversation with Tanaka at Tier 4+
- Player visits clinic for any reason (healing, dialogue, chrome maintenance)
- Tanaka notices player's tier advancement: "You've come far enough. I need to show you something."

**Secondary Hook**: Overhear clinic conversation
- Player enters clinic, hears Tanaka speaking with research subject (Koji or Anya)
- Subject: "The difference is incredible, Doc. I can actually *feel* again."
- Triggers player curiosity investigation

**Tertiary Hook**: Lopez reference (if UNION_RELATIONSHIP >= 20)
- Lopez mentions in passing: "Heard Tanaka's working on something special. Chrome that doesn't turn you into a ghost. You should ask her about it."

**Hidden Hook**: Yamada contrast (if YAMADA_ENCOUNTERED = true)
- After meeting Yamada, player can ask Tanaka her opinion on Ascension
- Tanaka's response reveals research as counter-program: "Upload isn't the only option. I can prove it—if you're willing to help."

## Replayability Notes

**Multiple Playthroughs**:
- Each path reveals different lore:
  - Infiltration: Corporate suppression documentation (classified memos)
  - Independent: Personal stories of augmentation humanity
  - Recruit: Worker solidarity and corpo contract abuse
  - Whistleblower: Internal corpo ethical conflicts, sympathetic insiders

**Tier Timing Variance**:
- Available Tier 4-6 (mid-game)
- Optimal timing: Tier 5 (player understands chrome degradation personally, but not yet committed to ending path)
- Late completion (Tier 6): Still valuable, but less time to use humane augmentation benefits

**Relationship Dependency**:
- Low Tanaka relationship (20-30): Quest available but Tanaka is more reserved, less personal dialogue
- High Tanaka relationship (50+): Additional dialogue about her past, why this research matters to her personally (reveals she lost a colleague to chrome degradation years ago)

## Meta Notes

**Word Count**: ~4,200 words
**Complexity**: High (4 distinct solution paths, multiple skill checks, branching consequences)
**Integration Level**: Critical (enables Third Path ending, counters Ascension narrative)
**Estimated Implementation Time**: Significant (requires new location assets for research site, Nakamura archive floor, multiple NPC models)

**Playtester Focus Areas**:
- Does each path feel meaningfully different (not just cosmetic)?
- Is whistleblower path discoverable without guide? (requires Delilah relationship)
- Do failure states feel fair or punitive?
- Is the medical/technical terminology accessible to non-expert players?

---

**Related Files**:
- Character: `/01_CHARACTERS/tier_0-3_npcs/dr_tanaka.md`
- Character: `/01_CHARACTERS/tier_4-6_npcs/delilah_fixer.md`
- Character: `/01_CHARACTERS/tier_7-9_npcs/yamada_corpo_recruiter.md`
- Location: `/05_WORLD_TEXT/locations/districts/the_hollows.md`
- Location: `/05_WORLD_TEXT/locations/districts/red_harbor.md`
- Location: `/05_WORLD_TEXT/locations/specific/nakamura_tower.md`
- Main Quest: `/02_MAIN_QUESTS/tier_6_the_fork.md` (not yet written, referenced)
- Ending: `/04_ENDINGS/tier_10_the_balanced.md` (not yet written, referenced)

**Quest Design Philosophy**: Every side quest should do three things simultaneously: (1) develop a character, (2) explore a theme, (3) give player meaningful choice that matters later. This quest develops Tanaka, explores ethical science vs. exploitation, and gives player choice between reform and revolution methodologies.
