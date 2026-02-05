# Phase 4: Reactivity & Polish Plan

## Overview

Phase 4 transforms Surge Protocol from a narrative with player choices into a living world that remembers and reacts to those choices. This phase focuses on ambient reactivity, relationship depth, and polish.

**Status**: In Progress
**Start Date**: 2026-01-17
**Estimated Scope**: 50,000-75,000 words
**Focus**: World reactivity, relationship systems, polish

---

## Phase 4 Objectives

### Primary Goals
1. **Create ambient bark system** - NPCs react to player reputation, tier, humanity
2. **Develop relationship content** - Deepen existing character connections
3. **Implement endgame variations** - Multiple epilogue states and callbacks
4. **Polish existing content** - Item descriptions, ambient details, Easter eggs

### Quality Standards
- All barks must have 3+ variants to avoid repetition
- Relationship content must reference previous player choices
- Endgame variations must feel earned through gameplay
- Polish content enhances immersion without bloating

---

## Session Breakdown

### Session 1: Combat & Action Barks (Priority: High)
**Estimated Scope**: 8,000-10,000 words

**Content to Create**:

**Player Combat Lines** (50+ lines):
- Attack initiation barks
- Taking damage reactions
- Victory/defeat lines
- Skill use callouts
- Low health warnings

**Enemy Combat Lines** (100+ lines):
- Generic enemies (gang members, corporate security, drones)
- Named enemies (Chrome Saints, Nakamura agents)
- Boss-tier enemies (unique dialogue per encounter)

**Ally Combat Lines** (30+ lines):
- NPC companion support (if applicable)
- Algorithm tactical suggestions
- Shadow disagreement during combat

**Environmental Reactions** (40+ lines):
- Hazard warnings
- Cover/position callouts
- Escape route observations

**Deliverable**: Combat bark files in `/10_BARKS_REACTIONS/combat_barks/`

---

### Session 2: Reputation & Recognition Barks (Priority: High)
**Estimated Scope**: 10,000-12,000 words

**Content to Create**:

**Tier Recognition** (By tier range):
- Tier 1-2: Rookie comments (dismissive, helpful, predatory)
- Tier 3-5: Established recognition (professional respect)
- Tier 6-8: Elite recognition (awe, fear, requests)
- Tier 9-10: Legend recognition (legendary status reactions)

**Humanity Reactions** (By humanity range):
- High (80+): Comfortable, warm, human
- Medium (60-79): Subtle discomfort, chrome comments
- Low (40-59): Visible unease, avoidance
- Critical (<40): Fear, fleeing, desperate pleas

**Faction Reputation**:
- Nakamura ally/enemy reactions
- Union ally/enemy reactions
- Ghost Network recognition
- Chrome Saints territory barks
- Third Path whispers (for those who know)

**Deliverable**: Recognition bark files in `/10_BARKS_REACTIONS/reputation_reactions/`

---

### Session 3: Ambient World Dialogue (Priority: Medium)
**Estimated Scope**: 12,000-15,000 words

**Content to Create**:

**NPC-to-NPC Conversations** (30+ conversations):
- Hollows: Struggling neighbors, market haggling, Algorithm skeptics
- Red Harbor: Union talk, gang rumors, dock worker complaints
- Uptown: Corporate gossip, Ascension enthusiasm, status anxiety
- Interstitial: Balance philosophy, off-grid life, Algorithm silence

**Vendor Barks** (50+ lines):
- Market sellers pitching
- Black market whispers
- Corporate store scripts
- Maintenance shops

**Street Atmosphere** (40+ lines):
- News broadcasts (headline variants)
- Advertisement audio
- Street preachers (Algorithm worship, anti-chrome)
- Graffiti text (readable environmental)

**Deliverable**: Ambient dialogue files in `/10_BARKS_REACTIONS/ambient_dialogue/`

---

### Session 4: Relationship Quest Chains (Priority: High)
**Estimated Scope**: 15,000-20,000 words

**Content to Create**:

**Romance Arc Expansion** (Rosa):
- Pre-romance friendship deepening
- Romance initiation scene
- Relationship milestone moments
- Crisis point (Tier 9 ultimatum expansion)
- Ending variations (Rogue with Rosa, others)

**Friendship Arcs** (3 characters):
- **Chen**: Mentor friendship deepening, daughter revelation expansion
- **Tanaka**: Colleague to confidant, research partnership
- **Okonkwo**: Student to peer, balance mastery

**Rivalry Arcs** (2 characters):
- **Jin**: Enemy-to-ally or intensified rivalry
- **Yamada**: Philosophical opposition, possible understanding

**Deliverable**: Relationship quest files in `/03_QUESTS/relationship_quests/`

---

### Session 5: Consequence Callbacks (Priority: Medium)
**Estimated Scope**: 10,000-12,000 words

**Content to Create**:

**Major Decision Callbacks**:
- Tier 3 Algorithm decision referenced later
- Tier 6 Fork decision callbacks
- Faction alignment consequences
- NPC fate references (saved/killed/helped)

**NPC Memory System**:
- Characters remember player actions
- Greeting variants based on history
- Quest reward/punishment callbacks
- Relationship evolution references

**World State Reactions**:
- Union strength after player support/opposition
- Chrome Saints status after quest outcomes
- Corporate presence shifts
- Interstitial accessibility changes

**Deliverable**: Callback dialogue integrated into existing files + new callback tracking doc

---

### Session 6: Endgame & Epilogue Variations (Priority: High)
**Estimated Scope**: 8,000-10,000 words

**Content to Create**:

**Ascension Ending Variations**:
- Horror variant (low relationship with Algorithm)
- Ambiguity variant (neutral relationship)
- Transcendence variant (high trust, partnership)
- Rosa reaction if romance active

**Rogue Ending Variations**:
- Alone variant (no close relationships)
- Rosa variant (romance complete)
- Network support variant (Ghost Network allied)
- Hunted variant (high corporate/Algorithm hostility)

**Third Path Ending Variations**:
- Full Eighth variant (complete balance)
- Partial variant (balance achieved, not mastered)
- Algorithm partnership variant
- Community recognition variant

**Epilogue Slides/Text**:
- Character fate summaries (based on flags)
- World state summaries
- Player legacy description

**Deliverable**: Expanded ending files in `/03_QUESTS/main_story/` + epilogue variations

---

### Session 7: Item & World Polish (Priority: Low)
**Estimated Scope**: 5,000-8,000 words

**Content to Create**:

**Item Descriptions**:
- Augment lore and flavor text
- Weapon descriptions
- Quest item significance
- Collectible flavor text

**Environmental Details**:
- Location-specific ambient text
- Time-of-day variations
- Weather impact descriptions
- District transition flavor

**Easter Eggs & Secrets**:
- Hidden references
- Developer tributes (if desired)
- Meta discoveries
- Achievement descriptions

**Deliverable**: Files in `/07_ITEMS_INVENTORY/` and `/05_WORLD_TEXT/`

---

## Phase 4 Priority Order

### High Priority (Sessions 1-2, 4, 6):
1. **Session 1: Combat Barks** - Essential for gameplay feel
2. **Session 2: Reputation Barks** - Core reactivity
3. **Session 4: Relationship Quests** - Emotional depth
4. **Session 6: Endgame Variations** - Conclusion quality

### Medium Priority (Sessions 3, 5):
5. **Session 3: Ambient Dialogue** - World immersion
6. **Session 5: Consequence Callbacks** - Choice validation

### Low Priority (Session 7):
7. **Session 7: Polish** - Final touches

---

## Estimated Word Count by Session

| Session | Content | Estimated Words |
|---------|---------|----------------|
| 1 | Combat & Action Barks | 8,000-10,000 |
| 2 | Reputation & Recognition Barks | 10,000-12,000 |
| 3 | Ambient World Dialogue | 12,000-15,000 |
| 4 | Relationship Quest Chains | 15,000-20,000 |
| 5 | Consequence Callbacks | 10,000-12,000 |
| 6 | Endgame & Epilogue Variations | 8,000-10,000 |
| 7 | Item & World Polish | 5,000-8,000 |
| **Total** | **Phase 4** | **68,000-87,000** |

---

## Content Dependencies

### Session 1-2 (Barks):
- **Depends on**: Phase 1-3 character/faction definitions
- **Enables**: Dynamic world feel during gameplay

### Session 3 (Ambient):
- **Depends on**: Location files from Phase 3
- **Enables**: World immersion

### Session 4 (Relationships):
- **Depends on**: Phase 2-3 character content
- **Enables**: Emotional payoffs, ending meaning

### Session 5 (Callbacks):
- **Depends on**: All previous quest content
- **Enables**: Player choice validation

### Session 6 (Endings):
- **Depends on**: Sessions 4-5 content
- **Enables**: Satisfying conclusion

### Session 7 (Polish):
- **Depends on**: All content complete
- **Enables**: Final quality layer

---

## Integration Points

### With Existing Content

**Barks must reference**:
- Player tier (0-10)
- Humanity score (0-100)
- Faction relationships
- Major story flags
- NPC relationship values

**Relationship content must connect to**:
- Existing character files
- Main story quests
- Side quest outcomes
- Ending conditions

**Callbacks must track**:
- All major decision flags from Phases 1-3
- NPC survival/fate flags
- Faction standing milestones
- Unique player actions

### New Flag Requirements

Phase 4 will create:
- Bark trigger flags (combat state, location state)
- Relationship milestone flags
- Callback tracking flags
- Epilogue state flags

---

## Quality Metrics

### Bark Coverage Goals
- Minimum 3 variants per trigger condition
- No bark repeats within 5 triggers
- All factions represented
- All tier ranges covered
- All humanity ranges covered

### Relationship Depth Goals
- Each major NPC has 50+ new lines
- Romance arc has complete progression
- Friendships have meaningful milestones
- Rivalries have resolution options

### Callback Goals
- All major decisions referenced at least twice
- NPC fates acknowledged by other NPCs
- World state visibly changes based on player actions
- Endings reference journey, not just final choice

---

## Combined Project Total (Projected)

| Phase | Content | Words |
|-------|---------|-------|
| Phase 1 | Core Critical Path | ~50,000 |
| Phase 2 | Branching & Depth | ~65,600 |
| Phase 3 | Expansion Content | ~108,500 |
| Phase 4 | Reactivity & Polish | ~68,000-87,000 |
| **Total** | **Complete Narrative** | **~292,100-311,100** |

---

## Success Criteria

Phase 4 is complete when:

- [ ] All 7 sessions delivered
- [ ] Combat feels dynamic with varied barks
- [ ] NPCs visibly react to player reputation
- [ ] World ambience creates immersion
- [ ] Relationships have meaningful depth
- [ ] Past choices are referenced throughout
- [ ] Endings feel earned and varied
- [ ] Polish enhances without bloating

---

## Session 1 Starting Point

**Immediate Action**: Begin Combat & Action Barks

**First Deliverables**:
1. Player combat barks (attack, damage, victory)
2. Generic enemy barks (gang, corporate, drone)
3. Algorithm combat suggestions
4. Environmental reaction barks

---

**Phase 4 Status**: Session 1 Beginning
**Next Deliverable**: Combat bark files
