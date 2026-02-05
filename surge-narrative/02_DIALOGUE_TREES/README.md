# 02_DIALOGUE_TREES Directory - Content Summary

## Overview

This directory contains all dialogue content for Surge Protocol, organized by type and function. The dialogue system emphasizes player choice, consequence, and the game's core themes of identity, augmentation, and agency.

---

## Current Status: Phase 1 Complete ✓

### Completed Files

#### Templates (_dialogue_templates/)
- ✅ **dialogue_node_spec.md** - Complete technical specification for dialogue nodes
- ✅ **branching_template.json** - Full working example with all node types
- ✅ **skill_check_template.md** - Comprehensive skill check guide

#### Greetings (greetings/)
- ✅ **first_meeting_greetings.md** - 11 core NPCs first encounter dialogue
- ✅ **relationship_based_greetings.md** - Greetings by relationship tier (-100 to 100)
- ✅ **humanity_based_greetings.md** - Greetings by humanity score (0-100)
- ✅ **tier_based_greetings.md** - Greetings by player progression (Tier 0-10)

#### Farewells (farewells/)
- ✅ **standard_farewells.md** - Standard conversation endings for all NPCs
- ⚠️ **relationship_farewells.md** - TO BE ADDED
- ⚠️ **urgent_departure_farewells.md** - TO BE ADDED

#### Conversation Topics (conversation_topics/)
- ✅ **ask_about_algorithm.md** - Deep dive into Algorithm lore and perspectives
- ⚠️ **ask_about_work.md** - TO BE ADDED (courier life, job details)
- ⚠️ **ask_about_city.md** - TO BE ADDED (districts, factions, lore)
- ⚠️ **ask_about_factions.md** - TO BE ADDED (Guild, Union, Corpo relations)
- ⚠️ **ask_about_augments.md** - TO BE ADDED (chrome options, consequences)
- ⚠️ **rumors_and_gossip.md** - TO BE ADDED (world events, NPC updates)

#### Skill Check Dialogues (skill_check_dialogues/)
- ✅ **empathy_checks.md** - Comprehensive empathy check examples
- ⚠️ **deception_checks.md** - TO BE ADDED
- ⚠️ **intimidation_checks.md** - TO BE ADDED
- ⚠️ **tech_knowledge_checks.md** - TO BE ADDED
- ⚠️ **street_smarts_checks.md** - TO BE ADDED

#### Conditional Branches (conditional_branches/)
- ✅ **humanity_thresholds.md** - Complete humanity-based branching logic
- ⚠️ **tier_gates.md** - TO BE ADDED
- ⚠️ **faction_reputation.md** - TO BE ADDED
- ⚠️ **story_flag_variations.md** - TO BE ADDED
- ⚠️ **item_possession_checks.md** - TO BE ADDED

---

## Content Statistics

**Files Created**: 11 / 24 planned (46% complete)  
**Total Content**: ~87,000 words  
**NPCs Covered**: 15 core characters  
**Dialogue Nodes Documented**: 200+  
**Skill Checks Detailed**: 10+ examples  

---

## Remaining Work (Phase 2)

### High Priority

1. **Farewells** (2 files)
   - Relationship-based farewells
   - Urgent/emergency farewells

2. **Conversation Topics** (5 files)
   - Work and courier life
   - City districts and locations
   - Faction relationships
   - Augmentation details
   - Rumors and dynamic content

3. **Skill Check Dialogues** (4 files)
   - Deception (lying, manipulation, cons)
   - Intimidation (threats, coercion, violence)
   - Tech Knowledge (hacking, engineering)
   - Street Smarts (criminal world, danger sense)

4. **Conditional Branches** (4 files)
   - Tier gates (progression-locked content)
   - Faction reputation variations
   - Story flag callbacks
   - Item possession checks

---

## Usage Guide

### For Writers

**Starting a new conversation:**
1. Reference `dialogue_node_spec.md` for structure
2. Use `branching_template.json` as starting template
3. Check relevant greeting/farewell files for entry/exit points
4. Consult skill check templates for complex interactions

**Maintaining consistency:**
- Check existing character greetings for personality
- Ensure humanity/tier variations align with examples
- Use established voice acting direction tags
- Follow relationship progression guidelines

### For Developers

**Implementing dialogue:**
1. Export markdown to JSON using spec in `dialogue_node_spec.md`
2. Node IDs follow pattern: `{NPC}_{CATEGORY}_{NUMBER}`
3. Conditions check against game state (humanity, tier, flags, etc.)
4. Relationship changes accumulate per conversation

**Testing dialogue:**
- Test all branches (success/failure/critical)
- Verify condition logic (humanity, tier, relationships)
- Check voice acting tags are present
- Validate relationship changes make sense

### For Game Designers

**Adding new NPCs:**
1. Create greetings (first meeting, relationship-based, humanity-based, tier-based)
2. Create standard farewells
3. Add 3-5 conversation topics
4. Design 2-3 skill check moments
5. Plan conditional variations

**Balancing difficulty:**
- Easy checks (6-7): Common situations
- Moderate checks (8-9): Specialist moments
- Hard checks (10-11): Rare opportunities
- Very hard checks (12+): Perfect build required

---

## Design Philosophy

### Core Principles

1. **Choice Matters**: Every dialogue option should have consequence
2. **No Dead Ends**: Failed checks lead to interesting alternatives
3. **Character Depth**: NPCs have complex motivations and secrets
4. **Thematic Consistency**: All dialogue supports game's themes
5. **Reactive World**: NPCs remember and respond to player actions

### Themes to Emphasize

- **Identity**: Who are you when augments change you?
- **Augmentation Cost**: Chrome comes with consequences
- **Agency vs. Control**: Algorithm influence vs. free will
- **Connection vs. Efficiency**: Relationships vs. optimization
- **The Price of Progress**: Advancement requires sacrifice

### Tone Guidelines

**Cyberpunk Noir:**
- Gritty, realistic, lived-in world
- Dark humor and gallows humor
- Philosophical undertones
- Hope exists but isn't guaranteed

**Avoid:**
- Generic fantasy/sci-fi speak
- Over-the-top action movie dialogue
- Exposition dumps
- Forced romance

---

## Integration with Other Systems

### Quest System
- Dialogue triggers quests
- Quest completion unlocks new dialogue
- Failed quests change NPC attitudes

### Faction System
- Faction reputation affects available dialogue
- Some NPCs represent faction viewpoints
- Dialogue choices can change faction standing

### Combat System
- Some dialogues can avoid combat
- Failed intimidation can trigger combat
- Combat outcomes affect future dialogue

### Economy System
- Some dialogue options cost credits
- Successful deception can waive costs
- Relationships affect prices

---

## Expansion Possibilities

### Post-Launch Content

**Romance Expansion:**
- Deeper relationship progression
- Unique romance dialogue trees
- Multiple romance endings

**Faction Deep Dives:**
- Faction-specific dialogue trees
- Faction war dynamic content
- Leadership conversations

**Algorithm Lore:**
- More philosophical discussions
- Technical deep dives
- Alternative perspectives

**Endgame Content:**
- Epilogue conversations
- Post-choice reflections
- New Game+ references

---

## Technical Notes

### File Format Standards

**Markdown (.md) for humans:**
- Easy to read and edit
- Version control friendly
- Includes context and notes

**JSON (.json) for machines:**
- Parsed by game engine
- Strict schema validation
- Optimized for runtime

### Localization Considerations

- Keep strings separate from logic
- Use clear IDs for translation
- Avoid cultural-specific idioms
- Document tone for translators

### Voice Acting Preparation

- Emotion tags in every line
- Character count estimates
- Batch by character
- Priority tier marking

---

## Contributing

### Adding New Content

1. Follow existing file structure
2. Use established formatting
3. Match tone and style
4. Include voice acting direction
5. Test all branches
6. Document effects on game state

### Review Checklist

- [ ] Consistent with character voice
- [ ] All conditions properly defined
- [ ] Relationship changes make sense
- [ ] Skill check difficulties appropriate
- [ ] No dead ends (failed checks interesting)
- [ ] Voice acting tags present
- [ ] Effects on game state documented
- [ ] Grammar and spelling checked

---

## Version History

**v1.0 - 2026-01-21**
- Initial 02_DIALOGUE_TREES structure
- Templates complete
- Greetings complete (4/4 files)
- Farewells partial (1/3 files)
- Conversation topics started (1/6 files)
- Skill checks started (1/5 files)
- Conditional branches started (1/5 files)

**Next Update Target: Phase 2 Complete**
- All remaining files
- Additional NPC coverage
- Dynamic event dialogues

---

## Contact & Questions

For questions about:
- **Content**: Narrative Lead
- **Implementation**: Technical Lead
- **Design**: Game Director
- **Localization**: Localization Manager

---

**Last Updated**: 2026-01-21  
**Phase**: 1 Complete, 2 In Progress  
**Status**: Production Ready for Phase 1 Content  
**Next Milestone**: Complete remaining 13 files
