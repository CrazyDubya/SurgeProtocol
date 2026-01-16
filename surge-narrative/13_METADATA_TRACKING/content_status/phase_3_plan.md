# Phase 3: Expansion Content Plan

## Overview

Phase 3 expands the core narrative (Phase 1-2) with supporting content that enriches world-building, provides implementation support, and enables future content creation.

**Status**: In Progress
**Start Date**: 2026-01-16
**Estimated Scope**: 68,000-93,000 words

---

## Phase 3 Objectives

### Primary Goals
1. **Flesh out minor NPCs** referenced in main story quests
2. **Document locations** for environmental consistency
3. **Create side quest library** for optional player content
4. **Provide voice acting scripts** for audio implementation
5. **Develop tutorial content** for future writers

### Quality Standards
- Maintain thematic consistency with Phase 1-2
- Ensure all content references existing story flags
- Provide developer-friendly documentation
- Support replayability and world immersion

---

## Session Breakdown

### Session 1: Minor NPCs (Priority: High)
**Estimated Scope**: 8,000-10,000 words

**Characters to Create**:
1. **Jin** - Rival courier from Tier 1 (becomes ally or enemy)
2. **Delilah** - Fixer/information broker from Tier 2
3. **Yamada** - Corpo recruiter from Tier 8 (Ascension advocate)
4. **Phantom** - Ghost Network operative from Tier 8 (extraction specialist)

**For Each Character**:
- Full character profile (background, personality, speech patterns)
- Relationship progression (based on player choices)
- Dialogue estimates and key scenes
- Story flag impacts
- Potential side quest hooks

**Deliverable**: 4 character files in `/01_CHARACTERS/tier_[X]_npcs/`

---

### Session 2: Location Files (Priority: Medium)
**Estimated Scope**: 10,000-15,000 words

**Locations to Document**:

**Major Districts**:
1. **The Hollows** (Tier 0-2 starting area) - Chen's dispatch, poverty zone
2. **Red Harbor** (Tier 3-5 mid-game) - Gang territory, working class
3. **Uptown Corporate** (Tier 6-8 late-game) - Nakamura Tower, corpo districts
4. **The Interstitial** (Hidden) - Off-grid space between city and network

**Key Locations**:
5. **Nakamura Tower** - Upload clinic, corpo headquarters
6. **Underground Clinics** - Tanaka's clinic, street augment shops
7. **Ghost Network Safe Houses** - Extraction infrastructure
8. **Solomon's Sanctum** - Third Path ritual location

**For Each Location**:
- Physical description (architecture, atmosphere, sensory details)
- Cultural/social context (who lives here, power dynamics)
- Gameplay relevance (what quests happen here)
- Environmental storytelling opportunities
- Ambient NPC concepts

**Deliverable**: 8+ location files in `/05_WORLD_TEXT/locations/`

---

### Session 3: Side Quest Library - Part 1 (Priority: Medium)
**Estimated Scope**: 15,000-20,000 words

**Quest Categories**:

**Character Development Quests (5 quests)**:
1. **Chen's Legacy** - Help Chen with personal crisis (daughter's Fork)
2. **Rosa's Brother** - Resolve Miguel debt situation (romance prerequisite)
3. **Tanaka's Research** - Assist with ethical augmentation study
4. **Jin's Redemption** - Former rival asks for help (if allied)
5. **Okonkwo's Test** - Prove worthiness for Interstitial access

**Faction Quests (5 quests)**:
6. **Union Organizing** - Help Lopez with worker collective action
7. **Ghost Network Extraction** - Assist in evacuating Rogue candidate
8. **Corpo Espionage** - Infiltrate rival corp for Nakamura
9. **Gang Diplomacy** - Negotiate peace between rival gangs
10. **Algorithm Investigation** - Uncover Algorithm's true origins

**For Each Quest**:
- Setup and trigger conditions
- Multiple solution paths (2-4 approaches)
- Story flag consequences
- Relationship impacts
- Optional complications integration
- Estimated duration (10-20 minutes each)

**Deliverable**: 5-10 side quest files in `/03_QUESTS/side_quests/`

---

### Session 4: Side Quest Library - Part 2 (Priority: Low)
**Estimated Scope**: 15,000-20,000 words

**Environmental/World Quests (5 quests)**:
11. **The Network Outage Mystery** - Investigate recurring blackouts
12. **Augment Recall Crisis** - Defective chrome causing deaths
13. **Courier Killer** - Serial killer targeting couriers
14. **Data Heist** - Steal valuable intel from secure server
15. **Underground Fight Ring** - Augmented combat tournament

**For Each Quest**:
- Setup and trigger conditions
- Multiple solution paths
- Story flag consequences
- World-building lore integration
- Optional complications

**Deliverable**: 5 side quest files in `/03_QUESTS/side_quests/`

---

### Session 5: Voice Acting Scripts (Priority: High for Implementation)
**Estimated Scope**: 15,000-20,000 words

**Organization**:
- Extract all dialogue from quest files
- Organize by character
- Line-by-line numbering
- Voice direction notes
- Processing/filter notes for Algorithm/Synthesis

**Characters to Script**:
1. **Algorithm** (1,400 lines across 5 stages)
2. **Player** (contextual lines, multiple variants)
3. **Chen** (250+ lines estimated)
4. **Rosa** (400+ lines estimated)
5. **Tanaka** (350+ lines estimated)
6. **Solomon** (250+ lines estimated)
7. **Synthesis** (200+ lines estimated)
8. **Okonkwo** (150+ lines estimated)
9. **Lopez** (200+ lines estimated)
10. **Minor NPCs** (varies)

**Format Example**:
```
CHARACTER: Chen
LINE_ID: CHEN_T0_001
CONTEXT: Tutorial quest, first meeting player
EMOTION: Weary but warm
LINE: "You're the new courier? Alright. Let's see if you last longer than the last one."
NOTES: Older man, tired but kind. Slight resigned sigh before speaking.
```

**Deliverable**: Voice script files in `/12_IMPLEMENTATION/voice_scripts/`

---

### Session 6: Tutorial & Writer Guide (Priority: Medium)
**Estimated Scope**: 5,000-8,000 words

**Content to Create**:

**1. Writer Onboarding Guide**:
- Project overview and goals
- Narrative pillars and themes
- Tone and style guidelines
- World lore primer
- Character voice guide

**2. Template Usage Guide**:
- How to use quest templates
- How to use character templates
- How to integrate complications
- How to track story flags

**3. Style Guide**:
- Dialogue formatting
- Branching notation
- Story flag naming
- Humanity impact calculation
- Relationship value guidelines

**4. Content Integration Checklist**:
- Pre-writing checklist
- Consistency verification
- Story flag audit
- Cross-reference check
- Implementation notes

**Deliverable**: Tutorial files in `/13_METADATA_TRACKING/tutorials/`

---

## Phase 3 Priority Order

### High Priority (Complete First):
1. **Session 1: Minor NPCs** - Strengthens existing quest content
2. **Session 5: Voice Acting Scripts** - Critical for audio implementation

### Medium Priority:
3. **Session 2: Location Files** - Enhances world immersion
4. **Session 3: Side Quests Part 1** - Adds replayability
5. **Session 6: Tutorial Content** - Enables future writers

### Low Priority:
6. **Session 4: Side Quests Part 2** - Nice-to-have, not essential

---

## Estimated Timeline

**Aggressive**: 6 sessions (complete all)
**Standard**: 4 sessions (High + Medium priority)
**Minimum**: 2 sessions (High priority only)

**Current Plan**: Complete all 6 sessions for comprehensive expansion

---

## Success Metrics

### Completion Criteria:
- ✅ 4 minor NPC files created with full profiles
- ✅ 8+ location files with detailed descriptions
- ✅ 10-15 side quests providing optional content
- ✅ Voice scripts organized and ready for recording
- ✅ Writer guide enabling future content creation

### Quality Criteria:
- All content consistent with Phase 1-2 tone and themes
- Story flags properly tracked and cross-referenced
- Developer documentation clear and usable
- Content enhances replayability without bloating core narrative

---

## Content Dependencies

### Minor NPCs (Session 1):
- **Depends on**: Phase 2 quest content (NPCs are referenced)
- **Enables**: Richer quest interactions, side quest hooks

### Location Files (Session 2):
- **Depends on**: Phase 2 quest locations
- **Enables**: Environmental storytelling, future quest design

### Side Quests (Sessions 3-4):
- **Depends on**: Minor NPCs, locations
- **Enables**: Extended gameplay, character development

### Voice Scripts (Session 5):
- **Depends on**: All quest and character content
- **Enables**: Audio implementation

### Tutorial (Session 6):
- **Depends on**: Complete Phase 3 content as examples
- **Enables**: Future writers and expansion

---

## Estimated Word Count by Session

| Session | Content | Estimated Words |
|---------|---------|----------------|
| 1 | Minor NPCs | 8,000-10,000 |
| 2 | Location Files | 10,000-15,000 |
| 3 | Side Quests Part 1 | 15,000-20,000 |
| 4 | Side Quests Part 2 | 15,000-20,000 |
| 5 | Voice Acting Scripts | 15,000-20,000 |
| 6 | Tutorial Content | 5,000-8,000 |
| **Total** | **Phase 3** | **68,000-93,000** |

**Combined Project Total**: 158,000-183,000 words (Phase 1-3)

---

## Related Content
- Phase 2 Complete: `/13_METADATA_TRACKING/content_status/phase_2_session_6_complete.md`
- Master Directory: `/DIALOGUE_PROJECT_DIRECTORY.md`
- Story Flags: `/13_METADATA_TRACKING/story_flags_master_list.md`
- Complications: `/04_COMPLICATIONS/complications_library.md`

---

**Phase 3 Status**: Session 1 starting
**Next Deliverable**: Minor NPC files (Jin, Delilah, Yamada, Phantom)
