# Template Library

**Purpose**: Reusable templates for creating consistent, high-quality content across the Surge Protocol narrative.

**How to Use These Templates**:
1. Copy the template section you need
2. Replace placeholder text (in ALL_CAPS or [brackets])
3. Fill in all required sections
4. Reference the style guide (02_STYLE_GUIDE.md) for voice and tone
5. Review against the quality checklist before submitting

---

## Character Profile Template

```markdown
# [CHARACTER_NAME]

**Role**: [PRIMARY_ROLE] (e.g., Fixer, Merchant, Gang Leader, Corpo Executive)
**Tier Range**: [TIER_RANGE] (e.g., Tier 0-3, Tier 4-6, Tier 7-10)
**Location**: [PRIMARY_LOCATION]
**Faction Affiliation**: [FACTION_OR_INDEPENDENT]

---

## Quick Reference

**Age**: [AGE]
**Pronouns**: [PRONOUNS]
**Ethnicity**: [ETHNICITY]
**Augmentation Level**: [LOW/MODERATE/HIGH/EXTREME]
**Key Relationships**: [LIST_2-3_KEY_RELATIONSHIPS]

**Estimated Dialogue Lines**: [XXX-XXX lines]

---

## Background

### Pre-Partition (if applicable)
[What was this character's life like before the Partition? Only include if character is 60+ years old or if pre-Partition history is relevant to their character.]

### Post-Partition Life
[What shaped this character into who they are today? Include 2-3 key formative events.]

[Key formative event 1 - how it shaped them]

[Key formative event 2 - how it shaped them]

[Optional: Key formative event 3]

### Current Situation
[What is this character doing when the player first encounters them? What are their immediate goals and challenges?]

---

## Personality

### Core Traits
1. **[TRAIT_1]**: [How this manifests in behavior and dialogue]
2. **[TRAIT_2]**: [How this manifests in behavior and dialogue]
3. **[TRAIT_3]**: [How this manifests in behavior and dialogue]

### Motivations
**Primary Motivation**: [What drives this character above all else?]

**Secondary Motivations**:
- [Secondary motivation 1]
- [Secondary motivation 2]

### Fears
- [What does this character fear losing or becoming?]
- [What vulnerability do they hide?]

### Contradictions
[What internal contradiction makes this character complex? e.g., "Believes in community solidarity but hoards resources," "Advocates for chrome freedom but judges heavily augmented people"]

---

## Dialogue Style

### Voice Characteristics
- **Vocabulary**: [Formal/informal, technical/casual, poetic/blunt]
- **Sentence Structure**: [Short and clipped / Long and flowing / Mix]
- **Verbal Tics**: [Any repeated phrases, speaking patterns, or quirks]
- **Topics They Discuss**: [What subjects does this character bring up naturally?]
- **Topics They Avoid**: [What makes them uncomfortable or evasive?]

### Sample Dialogue

**Early Game** (First Meeting):
> "[Opening line that establishes their voice and attitude]"

**Mid Game** (Player has earned some trust):
> "[Line showing deeper character or vulnerability]"

**Late Game** (High relationship or critical moment):
> "[Line revealing their core truth or philosophy]"

---

## Relationship Arc

### Initial Relationship
**Starting Reputation**: [±X points]
**Initial Attitude**: [How they treat the player at first meeting]

### Relationship Progression

**Tier 1: Stranger (0-20 relationship)**
- [How they interact with player]
- [What services/information they withhold]

**Tier 2: Acquaintance (21-40 relationship)**
- [How relationship changes]
- [What they now offer or reveal]

**Tier 3: Trusted Contact (41-60 relationship)**
- [Deeper trust shown how]
- [Personal quests or secrets available]

**Tier 4: Close Ally (61-80 relationship)**
- [What this character will do for the player]
- [What vulnerability they show]

**Tier 5: [Ride-or-Die / Romance Partner / Mentor / etc.] (81-100 relationship)**
- [Peak relationship state]
- [Unique dialogue, quests, or story beats available]

### Negative Relationship Path
**Breaking Point**: [Relationship value that locks out positive path]
**Hostility**: [How they oppose player if relationship goes negative]

---

## Story Integration

### Main Quest Involvement
[How does this character appear in or impact the main questline? If they don't appear in main quest, write "None - side content only"]

### Side Quest Hooks
**Primary Quest**: [Quest name and 1-sentence description]
- **Unlock Requirement**: [What player must do to unlock]
- **Core Conflict**: [What problem player must solve]
- **Story Flag Impact**: [Key flags this quest sets]

**Optional Secondary Quest**: [If applicable]

### Story Flags

#### Flags This Character Sets
- `[FLAG_NAME]` (Boolean/Integer/String): [What this tracks]
- `[FLAG_NAME]` (Boolean/Integer/String): [What this tracks]

#### Flags This Character Checks
- `[FLAG_NAME]`: [How character reacts if true/if certain value]
- `[FLAG_NAME]`: [How character reacts if true/if certain value]

---

## Character Development

### Arc Type
[Choose: Positive Arc (growth), Negative Arc (corruption/tragedy), Flat Arc (unchanged but influences player)]

### Beginning State
[Who is this character at the start?]

### Midpoint Shift
[What event or realization changes them?]

### Ending State(s)
**Positive Path**: [Who they become if player helps them]
**Negative Path**: [Who they become if player fails/betrays them]
**Neutral Path**: [Default outcome if player doesn't deeply engage]

---

## Gameplay Function

### Services Offered
- [What can player buy/access through this NPC?]
- [Any unique services only this character provides?]

### Information Provided
- [What lore or intel does this character know?]
- [What rumors or tips do they share?]

### Quest Giver Role
[How many quests does this character give? What types?]

---

## Visual Design Notes

### Physical Description
**Height/Build**: [Description]
**Distinctive Features**: [Scars, tattoos, unusual characteristics]
**Augmentation Visible**: [What chrome can player see? How obvious is it?]
**Clothing Style**: [How do they dress? What does it signal about them?]

### Environmental Context
[Where is this character usually found? What does their environment say about them?]

---

## Voice Acting Direction

### Voice Type
[Deep/High, Rough/Smooth, Accented/Neutral, Fast/Slow paced]

### Emotional Baseline
[What is their default emotional state? e.g., Weary resignation, Manic energy, Controlled professionalism]

### Range Required
[What emotional range must the voice actor cover? e.g., "Quiet exhaustion to explosive anger" or "Constant calm, subtle variations only"]

---

## Writer Notes

### Themes This Character Explores
- [Thematic element 1]
- [Thematic element 2]

### Common Pitfalls to Avoid
- [Potential mistake when writing this character]
- [Another pitfall specific to this character type]

### Key Scenes to Write
1. [Critical scene 1 - why it matters]
2. [Critical scene 2 - why it matters]
3. [Critical scene 3 - why it matters]
```

---

## Quest Structure Template

```markdown
# [QUEST_NAME]

**Type**: [Main Quest / Side Quest / Romance Quest / Faction Quest]
**Tier Range**: [TIER_RANGE]
**Estimated Completion Time**: [XX-XX minutes]
**Complexity**: [Simple / Moderate / Complex]

---

## Metadata

**Quest Giver**: [NPC_NAME]
**Location**: [PRIMARY_LOCATION]
**Factions Involved**: [LIST_FACTIONS]
**Related Quests**: [Any quests that connect to this one]

---

## Prerequisites

### Hard Requirements (Must Have)
- Player Tier: [Minimum tier]
- Story Flag: `[FLAG_NAME]` = [value]
- [Any other absolute requirements]

### Soft Requirements (Recommended)
- Relationship with [NPC]: [value+]
- Faction Reputation with [FACTION]: [value+]
- [Other helpful but not required conditions]

---

## Quest Synopsis

### Player-Facing Description
[This is what appears in the quest log - 2-3 sentences, intriguing but not spoiling solutions]

### Writer Summary
[Internal summary: What is this quest actually about? What theme or story beat does it serve? 3-4 sentences]

---

## Narrative Beats

### Beat 1: Introduction
**Location**: [WHERE]
**Characters Present**: [WHO]

**Setup**:
[How does the quest begin? What draws the player in?]

**Key Dialogue**:
[Critical conversation establishing the problem]

**Player Takeaway**:
[What does the player now know and need to do?]

**Story Flags Set**:
- `[FLAG_NAME]` = [value]

---

### Beat 2: Investigation/Escalation
**Location**: [WHERE]
**Characters Present**: [WHO]

**Development**:
[How does the situation evolve? What does the player discover?]

**Key Dialogue/Discoveries**:
[Important information revealed]

**Choice Point** (if applicable):
[Player must decide X, which affects Y]

**Story Flags Set**:
- `[FLAG_NAME]` = [value]

---

### Beat 3: Climax/Resolution
**Location**: [WHERE]
**Characters Present**: [WHO]

**Conflict Peak**:
[What is the moment of highest tension or most critical decision?]

**Multiple Solution Paths**:

#### Solution Path 1: [SOLUTION_NAME]
**Requirements**: [What player needs - skills, items, relationships, etc.]
**Execution**: [How this solution plays out]
**Immediate Outcome**: [What happens right away]

#### Solution Path 2: [SOLUTION_NAME]
**Requirements**: [Different requirements]
**Execution**: [How this path plays out]
**Immediate Outcome**: [What happens]

#### Solution Path 3: [SOLUTION_NAME]
**Requirements**: [Different requirements]
**Execution**: [How this path plays out]
**Immediate Outcome**: [What happens]

#### Solution Path 4: [SOLUTION_NAME] (Optional)
[If quest has 4+ solutions]

**Story Flags Set** (varies by path):
- `[FLAG_NAME_PATH_1]` = true (if Path 1)
- `[FLAG_NAME_PATH_2]` = true (if Path 2)
- etc.

---

### Beat 4: Aftermath
**Location**: [WHERE]
**Characters Present**: [WHO]

**Immediate Consequences**:
[What changes right after quest completion?]

**Dialogue**:
[Closing conversation with quest giver or key NPC]

**Story Flags Set**:
- `quest_[QUEST_NAME]_complete` = true
- [Other flags]

---

## Consequences & Rewards

### Short-Term Consequences (Immediate)

#### All Paths
- [Universal consequence regardless of solution]
- XP Reward: [XXX XP]

#### Path-Specific
**Path 1: [NAME]**
- [Specific consequence]
- [Specific reward/penalty]
- Relationship change: [NPC] ±[X]
- Faction reputation: [FACTION] ±[X]

**Path 2: [NAME]**
- [Different consequence]
- [Different reward/penalty]
- Relationship change: [NPC] ±[X]
- Faction reputation: [FACTION] ±[X]

[Repeat for all paths]

### Long-Term Consequences (Ripple Effects)

**Affects Later Quests**:
- [Quest name]: [How this quest changes that quest]
- [Quest name]: [How this quest changes that quest]

**Affects Ending**:
- [How this quest impacts ending availability or content]

**World State Changes**:
- [How the world physically or socially changes]

---

## Dialogue Count Estimate

**Total Estimated Lines**: [XXX-XXX]

**Breakdown by Character**:
- [NPC 1]: [XX-XX lines]
- [NPC 2]: [XX-XX lines]
- [Player dialogue options]: [XX-XX lines]

---

## Thematic Purpose

### Core Theme
[What is this quest exploring thematically? e.g., "The cost of loyalty," "Humanity vs. efficiency," "Class solidarity"]

### Connection to Main Narrative
[How does this quest reinforce or complicate the main story's themes?]

### Player Reflection Prompt
[What question should the player be asking themselves after this quest?]

---

## Writer Notes

### Tone
[What emotional tone should this quest maintain? e.g., "Tense thriller," "Melancholic character study," "Dark comedy"]

### Pacing Notes
- Beat 1: [Pacing guidance - e.g., "Slow burn, build tension"]
- Beat 2: [Pacing guidance]
- Beat 3: [Pacing guidance]
- Beat 4: [Pacing guidance]

### Critical Scenes to Nail
1. [Scene description - why it must be perfect]
2. [Scene description - why it matters]

### Pitfalls to Avoid
- [Common mistake for this quest type]
- [Another pitfall]

---

## Technical Notes

### Scripting Flags Summary
[List all flags for easy reference by technical team]

**Flags Set**:
- `[flag_name]` (type): [when set]

**Flags Checked**:
- `[flag_name]`: [what happens if true/false or specific value]

### Alternative Quest Hooks
[If this quest becomes unavailable (failed prerequisite, NPC dead, etc.), is there an alternative way to get this content or is it simply locked out?]
```

---

## Dialogue Scene Template

```markdown
## Scene: [SCENE_NAME]

**Location**: [WHERE]
**Characters Present**: [LIST]
**Emotional Tone**: [TONE]
**Story Context**: [What just happened or is happening]

---

**[CHARACTER_1]** (emotional direction):
> "Opening line of dialogue."

[Optional: Description of action, environmental detail, or character reaction]

**[CHARACTER_2]** (emotional direction):
> "Response line."

**Player Dialogue Options**:
1. **[Option tone/stance]**: "Player dialogue choice 1"
   - *Leads to*: [Consequence or conversation branch]

2. **[Option tone/stance]**: "Player dialogue choice 2"
   - *Leads to*: [Different consequence or branch]

3. **[Option tone/stance]**: "Player dialogue choice 3"
   - *Leads to*: [Different consequence or branch]

---

### Branch 1: [Player chose option 1]

**[CHARACTER_2]** (reaction):
> "Response to player's choice."

[Continue conversation]

**Story Flag Set**: `[flag_name]` = [value]

---

### Branch 2: [Player chose option 2]

**[CHARACTER_2]** (different reaction):
> "Different response."

[Continue different conversation]

**Story Flag Set**: `[different_flag_name]` = [value]

---

### Branch 3: [Player chose option 3]

[And so on...]

---

### Conversation Resolution

[All branches converge here, or continue to have different outcomes]

**[CHARACTER_1]**:
> "Closing line that wraps scene."

**Scene Outcome**: [What changed as a result of this conversation]
```

---

## Location Description Template

```markdown
# [LOCATION_NAME]

**Type**: [District / Specific Location / Secret Area]
**Tier Range**: [TIER_RANGE]
**Faction Control**: [CONTROLLING_FACTION or "Contested" or "Neutral"]

---

## Quick Reference

**Size**: [Small / Medium / Large / Sprawling]
**Population Density**: [Sparse / Moderate / Dense / Overcrowded]
**Wealth Level**: [Destitute / Poor / Working Class / Middle Class / Wealthy / Elite]
**Danger Level**: [Safe / Moderate / Dangerous / Lethal]

**Key NPCs Present**: [List 3-5 notable NPCs found here]
**Related Quests**: [Quests that take place here]

---

## Physical Description

### First Impression
[What does the player notice immediately when entering this location? Lead with the most striking sensory detail - 2-3 sentences]

### Environmental Details

**Visual**:
[What does this place look like? Architecture, lighting, colors, condition of buildings, visible technology, etc. - 4-5 sentences]

**Auditory**:
[What does the player hear? Background noise, distinctive sounds, music, voices, mechanical hums, etc. - 2-3 sentences]

**Olfactory**:
[What does it smell like? This is cyberpunk - include unpleasant smells when appropriate - 1-2 sentences]

**Tactile**:
[What physical sensations? Temperature, humidity, texture of surfaces, vibrations, etc. - 1-2 sentences]

**Gustatory** (if applicable):
[If there's a distinctive taste in the air or if this is a food-related location]

### Emotional Atmosphere
[How does this place FEEL emotionally? Oppressive, hopeful, tense, welcoming, etc. - 2-3 sentences]

---

## Cultural Context

### Who Lives/Works Here
[What demographic calls this place home or uses it regularly? Economic class, professions, cultural background, augmentation level, etc.]

### Social Dynamics
[How do people interact here? Is it communal or isolated? Cooperative or competitive? What are the unspoken rules?]

### Power Structure
[Who has power here? How is it maintained? Who is vulnerable?]

---

## History

### Pre-Partition (if relevant)
[What was this location before the Partition? Only include if the pre-Partition history matters to current state]

### Post-Partition Development
[How did this location become what it is today? What key events shaped it?]

### Recent Changes
[What has changed in the last few years? What is currently in flux?]

---

## Gameplay Relevance

### Services Available
- [Service 1 - e.g., "Ripperdoc clinic (basic augments)"]
- [Service 2]
- [Service 3]

### Items/Loot
[What can players find or purchase here? Any unique items only available here?]

### Quest Connections
- [Quest 1]: [How this location is used in quest]
- [Quest 2]: [How this location is used]

### Tactical Considerations
[If combat or stealth occurs here: Cover opportunities, environmental hazards, NPC patrol patterns, security systems, etc.]

---

## Key Sub-Locations

### [SUB-LOCATION 1 NAME]
**Description**: [1-2 sentence description]
**Function**: [What happens here]
**Notable NPCs**: [Who is found here]

### [SUB-LOCATION 2 NAME]
**Description**: [1-2 sentence description]
**Function**: [What happens here]
**Notable NPCs**: [Who is found here]

[Repeat for 3-5 key sub-locations]

---

## Thematic Role

### What This Location Represents
[What theme or aspect of the world does this location embody? e.g., "Corporate exploitation," "Grassroots resistance," "Faded glory," "Desperate survival"]

### Contrast With Other Locations
[How does this location differ from other areas? What does that contrast illustrate about the world?]

---

## Writer Notes

### Tone When Writing Scenes Here
[Guidance for writers: What emotional tone should scenes here maintain?]

### Sensory Details to Emphasize
[Which senses are most important for this location? e.g., "Emphasize sound - the industrial noise is constant and oppressive"]

### Common Mistakes to Avoid
[Pitfalls specific to writing this location]

---

## Visual Design Notes

### Architectural Style
[Clean corpo minimalism / Retrofitted industrial / Jury-rigged slums / etc.]

### Lighting
[Natural light / Neon / Flickering fluorescent / Darkness / etc.]

### Color Palette
[Dominant colors and what they convey]

### Distinctive Visual Elements
[What makes this location visually unique and memorable?]
```

---

## Voice Direction Template

```markdown
# Voice Direction: [CHARACTER_NAME]

**Character Role**: [ROLE]
**Priority Tier**: [1/2/3/4]
**Estimated Line Count**: [XXX-XXX]
**Estimated Recording Time**: [XX-XX hours]

---

## Voice Profile

**Voice Type**: [Deep/High, Rough/Smooth, Young/Aged, etc.]
**Accent**: [Specific accent or "Neutral" or "Slight [region]"]
**Pace**: [Fast/Moderate/Slow/Variable]
**Pitch**: [Low/Medium/High]
**Baseline Emotional State**: [Default emotion when not in heightened scene]

---

## Character Psychology (For Actor Context)

### Who This Person Is
[1-2 paragraph summary of character background and personality - gives actor the foundation to understand motivations]

### Core Motivations
[What drives this character? What do they want?]

### Emotional Wounds
[What pain do they carry? What makes them vulnerable?]

### How They Present Themselves vs. Who They Really Are
[The mask vs. the truth - helps actor find subtext]

---

## Voice Direction

### Default Delivery Style
[How does this character speak in normal, non-heightened moments? Sentence structure, vocabulary level, verbal tics, etc.]

### Emotional Range Required
[What is the full emotional range the actor must cover? e.g., "Quiet exhaustion to explosive rage" or "Controlled professionalism with occasional cracks"]

### Key Vocal Characteristics
- **[Characteristic 1]**: [How to achieve it - e.g., "Gravelly texture - think sleep deprivation and too many cigarettes"]
- **[Characteristic 2]**: [How to achieve it]
- **[Characteristic 3]**: [How to achieve it]

### Pacing and Pauses
[Specific guidance on rhythm - does this character pause often? Rush their words? Take dramatic pauses?]

### Subtext Guidance
[What is this character hiding or not saying directly? How should that affect delivery?]

---

## Iconic Lines (With Full Direction)

### Line 1
**Context**: [What just happened / what is happening in this scene]
**Emotion**: [Primary emotion]
**Direction**: [Specific acting direction - imagine you're in the booth with them]
**Subtext**: [What they're really communicating beneath the words]

> "The dialogue line here."

**Why This Line Matters**: [Why this line is critical to character/story]

---

### Line 2
[Repeat structure for 8-12 iconic lines that showcase character range and key story moments]

---

## Sample Dialogue Scenes (With Line-by-Line Direction)

### Scene 1: [SCENE_NAME]
**Context**: [Setup for this scene - what's happening]
**Emotional Arc**: [How emotion should progress through scene]

---

**[CHARACTER]** - [Emotion] [specific direction]:
> "Line of dialogue."

**[CHARACTER]** - [Different emotion] [different direction]:
> "Next line."

**PLAYER**: [Player says something]

**[CHARACTER]** - [Reactive emotion] [direction for how to respond]:
> "Response line."

[Continue for full scene - 8-12 line exchanges]

---

### Scene 2: [DIFFERENT_SCENE_NAME]
[Repeat for 3-5 complete scenes showing emotional variety]

---

## Recording Session Notes

### Warm-Up Suggestions
[How should the actor warm up for this voice? Any specific exercises?]

### Vocal Health Concerns
[If this voice is demanding - gravelly, shouting, etc. - include breaks and safety notes]

### Direction Keywords
[Quick reference: 3-5 words that capture this character's essence for quick direction]
- [Keyword 1]
- [Keyword 2]
- [Keyword 3]

### Takes Strategy
[Should director push for multiple emotional variations? Or is consistency more important?]

---

## Line-by-Line Delivery Notes (For Full Script)

[This section would include the full script with every line marked for emotion - but for template purposes, here's the format:]

**Line ID**: [Unique identifier]
**Context**: [What triggers this line]
**Emotion**: [Emotional tag]
**Delivery**: [Quick direction]
> "The dialogue line."

[Repeat for all lines in character's script]
```

---

## Common Template FAQs

### Q: Do I need to fill out every section?
**A**: Yes, unless marked "optional" or "if applicable." Completeness ensures consistency and gives other writers context.

### Q: What if my content is shorter/longer than the template suggests?
**A**: Templates are guides. If your character needs 4 core traits instead of 3, add more. If your quest only needs 3 solution paths instead of 4, that's fine. The structure matters more than exact length.

### Q: Can I modify these templates?
**A**: Minor modifications for specific needs are fine. Major structural changes should be discussed with the narrative lead to maintain consistency across the project.

### Q: What if I'm stuck on a section?
**A**:
1. Look at existing completed files for examples
2. Reference the onboarding guide and style guide
3. Flag the section with [NEEDS REVIEW] and move forward - another writer can help fill gaps

### Q: How detailed should "Writer Notes" sections be?
**A**: Detailed enough that someone else could pick up your work and understand your intent. Imagine you won't be available to answer questions.

---

## Template Quick Reference

| Content Type | Template Section | Estimated Time to Complete |
|--------------|------------------|---------------------------|
| Minor NPC | Character Profile Template | 2-4 hours |
| Major NPC | Character Profile Template | 4-6 hours |
| Simple Side Quest | Quest Structure Template | 3-5 hours |
| Complex Side Quest | Quest Structure Template | 6-10 hours |
| Main Quest Beat | Quest Structure Template | 8-12 hours |
| District Location | Location Description Template | 3-5 hours |
| Specific Location | Location Description Template | 2-3 hours |
| Critical Dialogue Scene | Dialogue Scene Template | 1-2 hours |
| Voice Direction (Minor NPC) | Voice Direction Template | 2-3 hours |
| Voice Direction (Major NPC) | Voice Direction Template | 4-6 hours |

---

**Remember**: These templates exist to help you create consistent, high-quality content efficiently. They're tools, not constraints. If you find yourself fighting a template, there might be a good creative reason - just make sure it's intentional, not an oversight.
