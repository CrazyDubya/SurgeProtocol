# Surge Protocol - Writer Onboarding Guide

## Welcome

Welcome to the Surge Protocol narrative team! This guide will help you understand the project, navigate the existing content, and contribute effectively while maintaining consistency with established world, characters, and tone.

## Project Overview

**Surge Protocol** is a cyberpunk narrative RPG exploring themes of augmentation, identity, corporate exploitation, and resistance. Players navigate a dystopian city through 10 progression Tiers, making choices that determine their relationship with humanity and chrome (cybernetic augmentation).

### Core Pillars
1. **Meaningful Choice**: Player decisions have real consequences (NPCs remember, factions shift, endings diverge)
2. **Thematic Depth**: Explores balance vs. extremes, collective vs. individual action, corpo exploitation
3. **Character-Driven**: NPCs are complex people with motivations, not quest dispensers
4. **Multiple Valid Paths**: No single "right" way—player can pursue corpo loyalty, resistance, independence, or balance

### Three Ending Paths
- **Ascension** (Tier 10: The Uploaded): Consciousness upload, escape flesh for digital existence
- **Rogue** (Tier 10: The Exile): Reject system, go off-grid with Ghost Network
- **Third Path** (Tier 10: The Balanced): Maintain balance between human and machine, build alternative community

## Content Structure Overview

### Directory Organization

```
surge-narrative/
├── 01_CHARACTERS/          # Character profiles, relationship arcs, dialogue styles
│   ├── tier_0-3_npcs/      # Early game characters (Tanaka, Chen, etc.)
│   ├── tier_4-6_npcs/      # Mid game characters (Lopez, Delilah, etc.)
│   └── tier_7-9_npcs/      # Late game characters (Okonkwo, Phantom, Yamada)
├── 02_MAIN_QUESTS/         # Core story progression (not yet written)
├── 03_QUESTS/              # Side quests (12 quests complete)
│   └── side_quests/
├── 04_ENDINGS/             # Tier 10 ending content (not yet written)
├── 05_WORLD_TEXT/          # Locations, history, world-building
│   ├── locations/
│   └── districts/
├── 08_VOICE_ACTING/        # Voice scripts, direction, budget
├── 13_METADATA_TRACKING/   # Progress tracking, session logs
└── 14_WRITER_GUIDES/       # This directory—onboarding, style, templates
```

### What's Complete (Phases 1-3)

**Phase 1: Core Narrative Framework** (~30,000 words)
- Story structure, theme documentation, ending outlines
- Character relationship system, story flags
- Tone & style guidelines

**Phase 2: Complications & Systems** (~60,000 words)
- Complications library (55 complications across 5 categories)
- Story flags documentation (300+ flags)
- Relationship mechanics, faction systems

**Phase 3: Expansion Content** (~97,000+ words)
- 4 minor NPC profiles (Jin, Delilah, Yamada, Phantom)
- 6 location files (districts + specific locations)
- **12 side quests** (55,000+ words):
  - Character development: Chen's Legacy, Rosa's Brother, Tanaka's Research, Lost Courier
  - Faction: Union Organizing, Ghost Network Extraction, Chrome Saints Initiation, Corporate Espionage
  - Environmental/World: Hollows Market Mystery, Red Harbor Ruins
  - Philosophical: Okonkwo's Test
- Voice acting scripts (~17,000 words, 4,750-5,865 estimated lines)

**Total Completed**: ~187,000+ words across 3 phases

### What's Needed (Future Work)

**Immediate Priorities**:
- Main quest chain (Tier 0-10 progression)
- Ending content (three paths fully written)
- Major NPC profiles (Chen, Lopez, Rosa—referenced but not fully detailed)

**Secondary Priorities**:
- Additional side quests (environmental, romantic, faction)
- Minor NPC profiles (vendors, antagonists, supporting characters)
- Ambient dialogue (background NPCs, news reports, system voices)

## Getting Started: Your First Week

### Day 1: Read Core Documents
1. `/13_METADATA_TRACKING/project_summary.md` (if exists) OR this guide
2. `/05_WORLD_TEXT/world_primer.md` (overview of setting, history, factions)
3. `/14_WRITER_GUIDES/02_STYLE_GUIDE.md` (tone, voice, formatting)

**Goal**: Understand world, tone, and narrative philosophy

### Day 2-3: Character Deep Dive
Read 3-4 completed character/quest files:
1. `/03_QUESTS/side_quests/tanakas_research.md` (character development quest example)
2. `/03_QUESTS/side_quests/okonkwos_test.md` (philosophical quest example)
3. `/03_QUESTS/side_quests/union_organizing.md` (faction quest example)
4. `/05_WORLD_TEXT/locations/districts/the_hollows.md` (location writing example)

**Goal**: See how theory becomes practice, internalize formatting/structure

### Day 4: Explore Interconnections
- Note how quests reference each other (cross-quest integration)
- Track character appearances across multiple quests
- Observe how story flags create branching consequences

**Goal**: Understand how content fits together, avoid contradictions

### Day 5: Write Sample Content
Using templates (see `/14_WRITER_GUIDES/04_TEMPLATES.md`):
- Write a minor NPC profile (200-300 words)
- Write 3-5 dialogue exchanges with emotional direction
- Outline a simple side quest (structure only, 500 words)

**Goal**: Practice format, get feedback from lead writer

## Key Concepts to Understand

### 1. The Tier System
Players progress through **Tier 0 (baseline human) to Tier 10 (heavily augmented)**. Tiers gate content:
- **Tier 0-3**: Tutorial, early game (The Hollows, basic chrome)
- **Tier 4-6**: Mid game (Red Harbor, corpo interaction, Fork event)
- **Tier 7-9**: Late game (Uptown access, major faction choices, philosophy)
- **Tier 10**: Endgame (final choice between three paths)

**For Writers**:
- Early Tier quests should be simpler (player learning mechanics)
- Late Tier quests can assume player understands world complexity
- Characters' tone changes based on player Tier (respect earned through advancement)

### 2. Story Flags
Boolean, integer, or string variables tracking player choices:
- `CHEN_RELATIONSHIP` (integer, -100 to +100): How much Chen trusts/likes player
- `TANAKA_RESEARCH_COMPLETE` (boolean, true/false): Did player complete quest?
- `UNION_STRIKE_OUTCOME` (string, "victory"/"defeat"/"compromise"): How strike resolved

**For Writers**:
- Set flags when player makes important choice
- Check flags before gating content (e.g., `if PHANTOM_RELATIONSHIP >= 20, unlock Ghost missions`)
- Document all new flags in quest files and `/13_METADATA_TRACKING/story_flags.md`

### 3. Humanity Score
Integer (0-100) tracking player's human vs. machine balance:
- **High (70-100)**: Player resists chrome, maintains humanity
- **Balanced (40-60)**: Player integrates chrome and humanity (Third Path)
- **Low (0-30)**: Player heavily chromed, losing human connection

**For Writers**:
- Major choices should impact Humanity Score
- Characters react to player's score (Tanaka worried if low, Yamada intrigued if low)
- Third Path requires maintaining 40-60 range through late game

### 4. Faction Reputation
Separate relationship scores for each major faction:
- **Nakamura Biotech** (corpo, Ascension program)
- **Zhao-Tech** (rival corpo, alternative augmentation)
- **Red Harbor Workers Union** (organized labor, collective action)
- **Chrome Saints** (gang, protection/crime, joinable faction)
- **Ghost Network** (extraction/resistance, off-grid survival)
- **The Interstitial** (Third Path community, balance philosophy)

**For Writers**:
- Faction quests should shift multiple reputation scores (helping one may anger another)
- High faction rep unlocks missions, vendors, safe houses
- Extreme hostility triggers consequences (bounties, ambushes)

### 5. Multiple Solution Paths
Every quest should have **3-6 resolution methods**:
- Combat (fight your way through)
- Stealth (sneak past obstacles)
- Tech (hack systems, bypass digitally)
- Charisma (talk, negotiate, deceive)
- Creative (unique solution using world knowledge)

**For Writers**:
- Plan multiple paths during outline phase
- Each path should feel meaningful (not just cosmetic)
- Consequences vary by method (stealth is quieter but slower, combat is loud but fast)

## Common Pitfalls (and How to Avoid Them)

### Pitfall 1: Over-Explaining
**Bad**: Characters lecture player about world-building
**Good**: Characters assume player lives in this world (mention things casually)

Example:
- ❌ "As you know, chrome augments are cybernetic enhancements that replace body parts..."
- ✅ "Your chrome is degrading. How long since your last tune-up?"

### Pitfall 2: Black-and-White Morality
**Bad**: Corps are cartoonishly evil, resistance is purely heroic
**Good**: Corps are banal evil (profit-driven, not sadistic), resistance has costs/flaws

Example:
- ❌ Corpo exec: "Muahahaha, I love exploiting workers!"
- ✅ Corpo exec: "It's not personal. It's business. The numbers work, so we proceed."

### Pitfall 3: Ignoring Established Canon
**Bad**: Creating contradictions with existing content
**Good**: Reading related files before writing, cross-referencing

Example:
- ❌ Writing Jin as female when established as non-binary
- ✅ Checking `/01_CHARACTERS/tier_1-3_npcs/jin_rival_courier.md` before writing

### Pitfall 4: Single Solution Quests
**Bad**: "Talk to NPC, get item, return" (linear, no player agency)
**Good**: Multiple paths with different consequences

Example:
- ❌ "Retrieve package from warehouse. Only way: fight through guards."
- ✅ "Retrieve package: Fight guards (loud, hostile), sneak in (quiet, risky), bribe foreman (expensive, clean), or hack delivery logs (technical, misdirection)."

### Pitfall 5: Forgetting Character Voice
**Bad**: All characters sound the same
**Good**: Each character has distinct speech pattern, vocabulary, concerns

Example:
- ❌ Tanaka: "Yo dude, your chrome is busted."
- ✅ Tanaka: "Your neural integration is showing signs of buffer degradation. We should address that."

### Pitfall 6: Unearned Emotion
**Bad**: Dramatic emotion without building to it
**Good**: Emotional moments feel earned through prior relationship building

Example:
- ❌ Chen (first meeting): "You're like a son to me! I'd die for you!"
- ✅ Chen (after 10 quests, saved player's life twice): "You're family now. That means something to me."

## Writing Workflow

### Step 1: Check Assignments
- Review `/13_METADATA_TRACKING/content_roadmap.md` for priorities
- Coordinate with lead writer on what needs writing next
- Claim assignment to avoid duplicate work

### Step 2: Research
- Read all related existing content (characters, locations, quests that connect)
- Note any story flags or relationships that affect your content
- Identify potential contradictions or integration points

### Step 3: Outline
- Write structural outline (quest beats, character arc, branching paths)
- Get feedback from lead writer before full draft
- Adjust based on feedback

### Step 4: Draft
- Follow templates (see `/14_WRITER_GUIDES/04_TEMPLATES.md`)
- Write dialogue with emotional direction (not just words—how they're said)
- Include multiple solution paths
- Document all story flags created/modified

### Step 5: Self-Edit
- Check consistency with existing content
- Ensure each major choice has consequences
- Verify all characters sound like themselves (voice consistency)
- Proofread for typos, formatting

### Step 6: Peer Review
- Submit to lead writer or peer for feedback
- Address feedback (or discuss disagreements)
- Iterate until approved

### Step 7: Integration
- Add to appropriate directory
- Update tracking files (`content_status`, `story_flags`, etc.)
- Cross-reference in related documents (if quest mentions character, link it in character file)
- Commit with clear message describing content

## Quality Standards

### Minimum Requirements
- [ ] No contradictions with existing canon
- [ ] At least 3 solution paths for quests
- [ ] Dialogue has emotional direction notations
- [ ] All new story flags documented
- [ ] Character voices consistent with profiles
- [ ] Consequences for major player choices
- [ ] Cross-references to related content
- [ ] Proofread (no typos, grammar errors)

### Excellent Quality Indicators
- [ ] Multiple valid moral perspectives (not just good/evil)
- [ ] Characters feel like real people (complex motivations)
- [ ] Player choices matter (visible consequences)
- [ ] Thematic resonance (content explores core themes)
- [ ] Environmental storytelling (world details reinforce narrative)
- [ ] Emotional payoff feels earned (relationship building)
- [ ] Integration with multiple other content pieces (cross-quest references)

## Collaboration Tools

### Git Workflow
1. Pull latest changes before starting work
2. Create feature branch for your content (e.g., `feature/chen-character-profile`)
3. Commit regularly with clear messages
4. Push when complete, request review
5. Merge after approval

### Communication Channels
- **Lead Writer**: For major decisions, canon questions, approval
- **Team Chat**: For quick questions, coordination, brainstorming
- **Design Team**: For mechanics integration, UI needs, technical constraints
- **Voice Acting**: For dialogue that will be recorded (flag early for actor scheduling)

### File Locking
If working on same file as someone else:
- Communicate in team chat ("I'm editing tanaka_voice_script.md today")
- Use branches to avoid conflicts
- Merge carefully, review diffs

## Resources & References

### Internal Documents (Read These First)
- `/14_WRITER_GUIDES/02_STYLE_GUIDE.md` - Tone, voice, formatting
- `/14_WRITER_GUIDES/03_WORLD_LORE_PRIMER.md` - Key world facts
- `/14_WRITER_GUIDES/04_TEMPLATES.md` - Reusable templates
- `/13_METADATA_TRACKING/story_flags.md` - All documented flags
- `/05_WORLD_TEXT/world_primer.md` - Setting overview

### Example Files (Study These)
**Great Character Development**:
- `/03_QUESTS/side_quests/tanakas_research.md`
- `/03_QUESTS/side_quests/okonkwos_test.md`

**Great Faction Quest**:
- `/03_QUESTS/side_quests/union_organizing.md`
- `/03_QUESTS/side_quests/corporate_espionage.md`

**Great Environmental Storytelling**:
- `/05_WORLD_TEXT/locations/specific/the_interstitial.md`
- `/05_WORLD_TEXT/locations/districts/the_hollows.md`

**Great Multiple Solution Paths**:
- `/03_QUESTS/side_quests/ghost_network_extraction.md`

### External Inspiration (Genre References)
- **Games**: Deus Ex, Cyberpunk 2077, Disco Elysium (choice/consequence)
- **Literature**: Neuromancer (Gibson), Snow Crash (Stephenson), Altered Carbon (Morgan)
- **Film**: Blade Runner, Ghost in the Shell, Elysium (class divide)
- **Themes**: Body autonomy, late-stage capitalism, found family, resistance

## FAQ for New Writers

**Q: How closely should I follow existing content?**
A: Very closely for world facts and character voices. More freedom for new characters/locations, but must not contradict established canon.

**Q: Can I create new factions/locations/NPCs?**
A: Yes, but discuss with lead writer first. New major factions need integration plan. Minor NPCs (one-quest characters) are fine to create.

**Q: What if I have a cool idea that contradicts existing lore?**
A: Discuss with lead writer. Sometimes we can adjust existing content if new idea is significantly better. But default is: established canon wins.

**Q: How much dialogue should a character have?**
A: Varies by role:
- Major NPC (Priority 1): 600-750 lines
- Important NPC (Priority 2): 300-500 lines
- Supporting NPC (Priority 3): 150-250 lines
- Minor NPC (one quest): 50-100 lines

**Q: Should every quest be long and complex?**
A: No. Mix is good:
- Epic quests (30+ minutes, multiple phases): 1-2 per session
- Standard quests (20-25 minutes, single objective): most common
- Short quests (10-15 minutes, quick objectives): scatter throughout

**Q: How do I know if my writing is "cyberpunk enough"?**
A: Check if it has:
- Corporate oppression (not government—corps run the world)
- Technology as double-edged sword (augments grant power, cost humanity)
- Class divide (visible, spatial, economic)
- Noir tone (weary, cynical, but not hopeless)
- Body modification as norm (chrome is everyday, not shocking)

**Q: What's the tone balance between dark and hopeful?**
A: **Cyberpunk noir with hope**. World is genuinely dystopian (organ trafficking, corpo exploitation, surveillance state), but resistance exists (Union, Ghost Network, Interstitial). Not grimdark (some people fight and win), not utopian (victories are small, costs are real).

**Q: Can I kill major NPCs?**
A: Only with lead writer approval and clear narrative purpose. Death should be:
- Consequence of player choice (not random)
- Emotionally impactful (player cared about character)
- Permanent (no resurrection, death matters)

**Q: How do I write for players who made different earlier choices?**
A: Use story flag checks:
- `if SARAH_SAVED = true, Sarah appears here; else, memorial reference`
- Write modular content (scenes adapt based on flags)
- Acknowledge player's past choices in dialogue

## Your First Assignment Ideas

Good starter tasks for new writers:

### Easy (1-2 days):
- Minor NPC profile (vendor, one-quest character, antagonist)
- Ambient dialogue (background NPCs, 20-30 lines)
- Location description (shop, safe house, single room)

### Medium (3-5 days):
- Supporting character full profile (Priority 3 NPC)
- Short side quest (15-20 minutes, 3 solution paths)
- Complication (new scenario for complications library)

### Advanced (1-2 weeks):
- Major NPC profile (Priority 2 character, 300-500 lines)
- Standard side quest (25-30 minutes, 4-5 solution paths, branching outcomes)
- Main quest section (single tier progression, coordinates with other main quests)

Talk to lead writer about assignment based on your experience level.

## Feedback & Iteration

### Receiving Feedback
- Feedback is about the work, not you personally
- Ask clarifying questions if feedback is unclear
- Disagree respectfully (explain your reasoning)
- Implement feedback or discuss alternatives
- Track common feedback themes (are you consistently missing something? Focus on that)

### Giving Feedback (Peer Review)
- Be specific ("dialogue feels flat" → "Tanaka's dialogue here lacks her usual compassionate warmth")
- Suggest solutions, not just problems
- Praise what works (positive reinforcement helps)
- Focus on high-impact issues first (canon contradictions > minor typos)
- Be kind (we're all learning)

## Continuing Education

### Improve Your Craft
- Read existing content regularly (even if not assigned to you)
- Study how experienced writers handle complex branching
- Analyze voice direction in voice acting scripts
- Play narrative-heavy games (see what works/doesn't in practice)
- Read cyberpunk literature (genre conventions, tropes, subversions)

### Ask Questions
- No question is too basic ("How do I format dialogue?" is fine)
- Clarify before assuming (saves time, prevents errors)
- Document answers (if you asked, someone else will too)

## Welcome Aboard

You're joining a project with ~187,000 words of existing content and a clear vision. Your contributions will expand this world, develop its characters, and give players meaningful stories to experience.

Take time to learn the world, respect established canon, and don't be afraid to ask questions. Great writing comes from understanding what came before and building on it thoughtfully.

Welcome to Surge Protocol. Let's tell a story worth playing.

---

**Next Steps**:
1. Read this guide fully
2. Review style guide (`02_STYLE_GUIDE.md`)
3. Read world lore primer (`03_WORLD_LORE_PRIMER.md`)
4. Study 2-3 example quests
5. Contact lead writer for first assignment

**Questions?** Contact lead writer via [team communication channel]
