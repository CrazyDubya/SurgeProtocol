# Surge Protocol: Best Practices & Expansion Guidelines

## Purpose

This document provides guidance on maintaining quality and consistency when expanding Surge Protocol's narrative content. Follow these practices to create content that integrates seamlessly with existing work.

---

## Part 1: Best Practices

### Writing Efficient Dialogue

#### The "Delete Half" Rule
After writing a dialogue exchange, delete approximately half the words. If it still makes sense, it's the right length.

**Before**:
```markdown
**Chen**: "Listen, kid, I've been working this dispatch desk for a really long time now, and I want you to know that I've seen a lot of couriers come through these doors over the years."
```

**After**:
```markdown
**Chen**: "Twenty years on this desk. Seen a lot of couriers. Most don't last."
```

#### Subtext Over Text
Characters should rarely say exactly what they mean.

**Too Direct**:
```markdown
**Rosa**: "I'm worried about you because you're getting too many augments and losing your humanity."
```

**Better**:
```markdown
**Rosa**: "You used to smile. Remember?"
```

#### Let Silence Speak
Use stage directions and pauses instead of more words.

```markdown
**Chen**: "My daughter got a cortical stack. Said it was for her career."

*He looks at the photo on his desk.*

"That was three years ago."

*He doesn't say anything else.*
```

### Character Voice Maintenance

#### Voice Fingerprints
Each major character should have 2-3 distinctive speech patterns.

| Character | Fingerprints |
|-----------|-------------|
| Chen | Calls people "kid", speaks in short sentences, sighs before bad news |
| Tanaka | Medical terminology casual, asks questions to teach, speaks precisely |
| Okonkwo | Responds with questions, uses physical metaphors, long pauses |
| The Algorithm | No contractions at high humanity, uses "we" at low humanity, optimizes language |

#### Consistency Check
Before writing dialogue, review the character's existing lines. Ask:
- Would this character use this word?
- Is the sentence length consistent?
- Does this match their emotional baseline?

### Branching Smartly

#### The Funnel Pattern
Most branches should reconverge. Use this structure:

```
        [Choice Point]
       /      |      \
   [Path A] [Path B] [Path C]
       \      |      /
        [Convergence]
            |
     [Continued Story]
```

**What Changes in Branches**:
- Immediate dialogue (always)
- Relationship values (usually)
- Story flags (sometimes)
- Available options later (rarely)
- Story outcomes (very rarely)

#### True Divergence Budget
Reserve genuine story divergence for:
- Major tier milestones (3, 6, 9)
- Ending selection
- Key character fates
- Faction alignment moments

Everything else should be flavor variation, not structural divergence.

### Skill Check Design

#### Difficulty Guidelines

| Difficulty | Target | When to Use |
|------------|--------|-------------|
| Easy (6) | 83% success | Information gathering, low-stakes shortcuts |
| Moderate (9) | 58% success | Standard alternative paths, meaningful choices |
| Hard (12) | 28% success | Significant advantages, revealing secrets |
| Very Hard (15) | 8% success | Major shortcuts, game-changing information |

#### Fail Forward Principle
Failed skill checks must create interesting content, not dead ends.

**Bad Failure**:
```markdown
**Failure**: The NPC doesn't tell you anything useful.
```

**Good Failure**:
```markdown
**Failure**: The NPC sees through your lie. They're not angry—they're impressed.
"Nice try. Tell you what—truth for truth. You first."
[Opens new dialogue path about player's actual situation]
```

### Emotional Pacing

#### The Quiet/Loud Pattern
Alternate between high-tension and low-tension scenes.

```
[High: Chase scene] → [Low: Recovery, conversation] → [High: Confrontation] → [Low: Aftermath]
```

#### Earned Moments
Emotional beats require setup. Don't drop major revelations without groundwork.

**Unearned**:
```markdown
Scene 1: Player meets Chen
Scene 2: Chen reveals his daughter died and it's deeply emotional
```

**Earned**:
```markdown
Scene 1: Player meets Chen. Photo on desk.
Scene 3: Chen mentions daughter briefly.
Scene 7: Player asks about daughter directly.
Scene 12: Chen reveals full story at high relationship.
```

### Managing Scope

#### Content Efficiency
Before writing, estimate:
- Lines of dialogue
- Number of branches
- Flags created
- Development time to implement

If a 5-minute interaction requires 200 lines and 15 flags, reconsider the design.

#### The "One New Thing" Rule
Each piece of content should introduce ONE major new element:
- One new NPC, OR
- One new location, OR
- One new faction detail, OR
- One new gameplay system

Introducing multiple new elements dilutes impact and increases complexity.

---

## Part 2: Expansion Guidelines

### Adding New Characters

#### Character Types by Need

| Type | When to Create | Integration Effort |
|------|----------------|-------------------|
| Background NPC | Atmosphere, single scenes | Low |
| Supporting NPC | Quest-specific roles | Medium |
| Recurring NPC | Multiple quests, progression | High |
| Core NPC | Main story impact | Very High |

#### Pre-Creation Checklist
Before creating a new character, verify:

- [ ] No existing character fills this role?
- [ ] They serve a clear narrative function?
- [ ] They connect to existing factions/locations?
- [ ] They have potential for future content?
- [ ] Their voice is distinct from existing characters?

#### Placement Guidelines

**DO**: Create characters that fit existing gaps
- The Hollows street vendor (supports existing location)
- Union rank-and-file member (supports existing faction)
- Corporate middle manager (new perspective on existing faction)

**DON'T**: Create characters that require new infrastructure
- Leader of a never-mentioned gang
- Representative of a foreign corporation
- Hero of a historical event never referenced

### Adding New Quests

#### Quest Slot Analysis

| Type | Current Count | Target Count | Room to Add |
|------|---------------|--------------|-------------|
| Main Story | 12 | 12 | None (complete) |
| Major Side | 12 | 15-20 | 3-8 more |
| Minor Side | ~20 | 30-40 | 10-20 more |
| Faction | ~8 | 20-30 | 12-22 more |

#### Side Quest Themes Available
These themes have space for additional quests:

**Character Development**:
- Rosa's extended family
- Chen's other rookies
- Tanaka's past patients

**World Building**:
- Hollows community events
- Corporate espionage (multiple targets)
- Union organizing struggles

**Faction Specific**:
- Chrome Saints initiation variants
- Ghost Network extraction targets
- Third Path balance tests

#### Quest Integration Requirements

New quests MUST:
1. Reference at least one existing NPC
2. Take place in existing locations (or expand known locations)
3. Use existing story flags where applicable
4. Create consequences that existing content can reference

New quests SHOULD:
1. Provide multiple solution paths
2. Offer meaningful relationship impacts
3. Connect to main story themes
4. Be completable in 10-20 minutes

### Adding New Locations

#### Location Expansion Zones

**The Hollows** (can expand):
- Additional market sections
- Residential blocks
- Chen's personal residence
- Underground tunnels

**Red Harbor** (can expand):
- Union Hall interior details
- Dock worker facilities
- Gang territory specifics
- Industrial sites

**Uptown** (limited expansion):
- Additional Nakamura facilities
- Corporate residential
- Entertainment districts

**The Interstitial** (very limited):
- Should remain mysterious
- Only expand through story progression
- Each new detail should feel earned

#### Location Requirements

New locations MUST:
1. Fit within existing district structure
2. Serve specific narrative purpose
3. Include atmospheric details (visual, auditory, olfactory)
4. Define who controls/inhabits the space
5. Specify tier range for natural access

### Adding Faction Content

#### Faction Depth Analysis

| Faction | Current Depth | Expansion Priority |
|---------|---------------|-------------------|
| Nakamura | High | Low (well established) |
| Union | Medium | Medium |
| Ghost Network | Medium | Medium |
| Chrome Saints | Medium | High |
| Third Path | High | Low (mysterious by design) |

#### Faction Content Rules

**Nakamura**:
- Emphasize bureaucracy, not villainy
- Individual employees vary in belief
- Show genuine benefits alongside costs

**Union**:
- Show internal debates and factions
- Not everyone agrees on methods
- Success requires sacrifice

**Ghost Network**:
- Maintain operational security in tone
- Trust is earned, never given
- Show the cost of extraction work

**Chrome Saints**:
- Honor among thieves
- Territory rules matter
- Chrome is respect

**Third Path**:
- Guard mysteries carefully
- New content must align with balance philosophy
- Okonkwo and Solomon must approve metaphorically

### Adding Dialogue

#### Dialogue Expansion Opportunities

**High Priority** (needed):
- Bark/reaction lines for various states
- Relationship-stage variations
- Humanity-based dialogue variations
- Faction reputation reactions

**Medium Priority** (useful):
- Additional conversation topics
- Post-quest follow-up dialogue
- Ambient NPC conversations

**Low Priority** (optional):
- Alternate wordings for existing lines
- Extended backstory discussions
- Easter egg conversations

#### Voice Acting Considerations

When writing dialogue intended for voice acting:

1. **Prioritize Key Lines**: Iconic lines for main characters
2. **Limit Variations**: Each variation = additional recording cost
3. **Mark Optional Lines**: Distinguish "must have" from "nice to have"
4. **Consider AI Synthesis**: Background NPCs may use synthesis

---

## Part 3: Quality Control

### Self-Review Checklist

Before submitting ANY content:

#### Structural Review
- [ ] Follows appropriate template format
- [ ] All sections complete (no placeholder text)
- [ ] Proper markdown formatting
- [ ] Clear heading hierarchy

#### Content Review
- [ ] Character voices consistent
- [ ] Dialogue length within guidelines
- [ ] Skill check difficulties appropriate
- [ ] Branching logic makes sense

#### Integration Review
- [ ] Story flags follow naming convention
- [ ] Cross-references to existing content accurate
- [ ] No contradictions with established lore
- [ ] New flags documented

#### Thematic Review
- [ ] Connects to core themes
- [ ] Avoids moral absolutes
- [ ] Economic reality acknowledged
- [ ] Player agency preserved

### Common Rejection Reasons

Content is returned for revision when:

1. **Voice Inconsistency**: Character doesn't sound like themselves
2. **Lore Contradiction**: Conflicts with established facts
3. **Scope Creep**: Introduces too many new elements
4. **Missing Integration**: Doesn't connect to existing content
5. **Tone Mismatch**: Too dark, too light, or too heroic
6. **Technical Issues**: Missing flags, broken branches, unclear conditions

### Revision Protocol

When content needs revision:

1. Read all feedback completely before revising
2. Address each point specifically
3. Mark changes clearly in revision notes
4. Re-run self-review checklist
5. Resubmit with change summary

---

## Part 4: Future-Proofing

### Modular Design Principles

Write content that can be:
- **Enabled/disabled** without breaking other content
- **Modified** without cascading changes
- **Extended** by adding to existing structures
- **Translated** without restructuring

### Flag Hygiene

When creating story flags:

**DO**:
- Use descriptive names: `SPARKS_DEBT_RESOLVED_PEACEFUL`
- Check for existing similar flags first
- Document flag purpose in content file
- Consider all states (not just true/false)

**DON'T**:
- Create redundant flags
- Use ambiguous names: `FLAG_1`, `QUEST_DONE`
- Create flags without documenting them
- Assume default values

### Extensibility Patterns

#### Hook Points
Leave explicit hooks for future content:

```markdown
**Chen**: "There's others like you. New kids. Maybe you'll meet them someday."
[HOOK: Future rookie NPCs can reference this line]
```

#### Open Questions
Don't answer everything. Leave space for mystery:

```markdown
**Tanaka**: "The Algorithm wasn't the first attempt. But you didn't hear that from me."
[NOTE: Details of "first attempt" deliberately undefined for future expansion]
```

#### Modular Quests
Design quests that don't require other quests:

```markdown
## Prerequisites
- **Required**: MET_SPARKS (ensures player knows who Sparks is)
- **Enhances if present**: CHROME_SAINTS_ALLY (adds dialogue options)
- **Not required**: Any specific quest completion
```

---

## Appendix: Quick Reference

### Content Approval Flow

```
[Writer drafts] → [Self-review] → [Submit] → [Lead review] → [Revision if needed] → [Approval] → [Integration]
```

### File Organization

```
/01_CHARACTERS/          New character profiles
/02_DIALOGUE_TREES/      New dialogue content
/03_QUESTS/              New quest content
/04_COMPLICATIONS/       New complications
/05_WORLD_TEXT/          New locations/lore
/06_ALGORITHM_VOICE/     Algorithm dialogue only
/08_VOICE_ACTING/        Voice acting scripts
/10_BARKS_REACTIONS/     Ambient/reaction lines
/13_METADATA_TRACKING/   Progress tracking, flags
```

### Priority Matrix

| Content Type | Player Value | Development Cost | Priority Score |
|--------------|--------------|------------------|----------------|
| Main story fixes | High | Medium | 1 (Highest) |
| Voice acting scripts | High | Low | 2 |
| Major side quests | High | High | 3 |
| Faction quests | Medium | Medium | 4 |
| Bark/reactions | Medium | Low | 5 |
| Minor sides | Low | Medium | 6 |
| Easter eggs | Low | Low | 7 (Lowest) |

---

**Final Reminder**: When in doubt, match existing content rather than innovate. Consistency trumps creativity in collaborative narrative design.
