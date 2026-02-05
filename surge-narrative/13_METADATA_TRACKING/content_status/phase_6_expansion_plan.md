# Phase 6: Content Density Expansion Plan

## Overview
**Goal**: Add procedural job flavor, general NPCs, and tier-specific content to make Tiers 0-8 feel lived-in and varied.

**Estimated New Content**: ~60,000-80,000 words
**Timeline**: 4 weeks (20 working days)
**Focus**: Procedural variety, general NPCs, ambient world-building

---

## WEEK 1: FOUNDATION SYSTEMS (Days 1-5)

### Day 1: Procedural Job Framework
**Session Focus**: Create the job generation template system

**Deliverables**:
- `/11_PROCEDURAL/job_templates/job_briefing_framework.md`
  - Template structure for randomized job descriptions
  - Variable slots: [CLIENT_TYPE], [PACKAGE_TYPE], [DESTINATION], [COMPLICATION]
  - Tone variations by tier (desperate → professional → high-stakes)

- `/11_PROCEDURAL/job_templates/client_profiles.md`
  - 30 client archetypes across all tiers
  - Each with: personality, speech patterns, payment style, reliability rating
  - Examples: Nervous Corpo, Street Dealer, Medical Facility Rep, Underground Chemist

**Word Target**: ~3,000 words
**Review Checkpoint**: Verify templates integrate with existing complications library

---

### Day 2: Package & Delivery Flavor
**Session Focus**: What couriers actually carry and where

**Deliverables**:
- `/11_PROCEDURAL/job_templates/package_descriptions.md`
  - 40 package types with flavor text
  - Tier-gated (Tier 0-2: legal goods, Tier 3-5: gray market, Tier 6+: high-risk)
  - Examination text for curious players

- `/11_PROCEDURAL/job_templates/delivery_circumstances.md`
  - 30 delivery scenario variations
  - Pickup conditions, handoff protocols, time pressure types
  - Weather/time-of-day modifiers

**Word Target**: ~3,500 words
**Review Checkpoint**: Ensure package types align with world lore

---

### Day 3: Tier 0 Expansion
**Session Focus**: Tutorial tier needs life beyond Chen

**Deliverables**:
- `/01_CHARACTERS/tier_0_npcs/tutorial_npcs.md`
  - 5 general NPCs for Tier 0:
    - Dock Worker (first job contact)
    - Street Vendor (supplies tutorial)
    - Fellow Rookie Courier (peer NPC)
    - Building Super (safe house contact)
    - Local Fixer (hints at bigger world)

- `/03_QUESTS/tier_0_content/first_week_jobs.md`
  - 8 procedural job templates for "first week as courier"
  - Simple deliveries with flavor text
  - Optional complications (minor)

- `/10_BARKS_REACTIONS/tier_specific/tier_0_ambient.md`
  - 30 ambient dialogue lines for Tier 0
  - Rookie courier concerns, street chatter, vendor calls

**Word Target**: ~4,000 words
**Review Checkpoint**: Verify tone matches tutorial pacing

---

### Day 4: Tier 1-2 Expansion
**Session Focus**: Early career needs variety

**Deliverables**:
- `/01_CHARACTERS/tier_1-3_npcs/early_career_npcs.md`
  - 8 general NPCs for Tiers 1-2:
    - Black Market Tech Dealer
    - Street Food Vendor (gossip source)
    - Junior Fixer
    - Rival Courier #2 (not Jin)
    - Union Recruiter (early contact)
    - Hollows Guide
    - Red Harbor Regular
    - Uptown Service Entrance Contact

- `/03_QUESTS/tier_1-2_content/early_side_jobs.md`
  - 6 mini side-quests for Tiers 1-2
  - Not story-critical, flavor-building
  - "Help the vendor," "Race challenge," "Lost package"

- `/11_PROCEDURAL/job_templates/tier_1-2_jobs.md`
  - 15 job briefing templates for early career
  - Varied clients, packages, destinations

**Word Target**: ~4,500 words
**Review Checkpoint**: NPCs don't overlap with main cast introductions

---

### Day 5: Week 1 Review & Integration
**Session Focus**: Quality check and consistency pass

**Tasks**:
- Review all Week 1 content for voice consistency
- Verify flag integration with existing systems
- Cross-reference new NPCs with character profiles
- Test job template variable substitution logic
- Update master NPC list
- Update story flags if needed

**Deliverables**:
- `/13_METADATA_TRACKING/npc_registry.md` (new file)
- Week 1 content committed and pushed

**Word Target**: ~1,000 words (documentation)

---

## WEEK 2: TIER 3-5 DENSITY (Days 6-10)

### Day 6: Tier 3 Expansion (Algorithm Integration Era)
**Session Focus**: The tier where everything changes

**Deliverables**:
- `/01_CHARACTERS/tier_1-3_npcs/tier_3_contacts.md`
  - 6 NPCs specific to Tier 3 experience:
    - Chrome Clinic Technician
    - Algorithm Skeptic (warns about integration)
    - Recent Integrator (shares experience)
    - Corporate Headhunter (recruitment pressure)
    - Underground Doc
    - Resistance Cell Contact

- `/03_QUESTS/tier_3_content/integration_side_content.md`
  - 4 mini-quests around Algorithm decision
  - "Second opinion," "Integration horror story," "Clean chrome source"

- `/10_BARKS_REACTIONS/tier_specific/tier_3_ambient.md`
  - 35 ambient lines about Algorithm integration
  - Street debates, chrome shop chatter, cautionary tales

**Word Target**: ~4,000 words
**Review Checkpoint**: Align with Algorithm voice progression

---

### Day 7: Tier 4 Expansion (Gray Zone Entry)
**Session Focus**: When jobs get morally complicated

**Deliverables**:
- `/01_CHARACTERS/tier_4-6_npcs/gray_zone_contacts.md`
  - 6 NPCs for Tier 4:
    - Gray Market Broker
    - Ethical Courier (contrast character)
    - Corporate Mole
    - Smuggler Captain
    - Information Dealer
    - Hollows Elder

- `/03_QUESTS/tier_4_content/gray_zone_jobs.md`
  - 5 morally ambiguous mini-quests
  - Decisions with minor consequences
  - "Deliver to bad people," "Smuggle medicine," "Corporate leak"

- `/11_PROCEDURAL/job_templates/tier_4_jobs.md`
  - 12 job templates for gray zone work
  - Higher stakes, better pay, moral weight

**Word Target**: ~4,000 words
**Review Checkpoint**: Verify moral choices have consequence flags

---

### Day 8: Tier 5 Expansion (Interstitial Discovery)
**Session Focus**: The hidden world opens up

**Deliverables**:
- `/01_CHARACTERS/tier_4-6_npcs/interstitial_contacts.md`
  - 6 NPCs for Tier 5:
    - Interstitial Guide (not Okonkwo)
    - Data Ghost
    - Former Eighth Aspirant
    - Convergence Skeptic
    - Hidden Archive Keeper
    - Network Node Personality

- `/03_QUESTS/tier_5_content/between_worlds.md`
  - 4 side quests exploring Interstitial
  - "Map the unmappable," "Ghost message," "Archive recovery"

- `/10_BARKS_REACTIONS/tier_specific/tier_5_ambient.md`
  - 30 ambient lines about Interstitial discovery
  - Rumors, theories, warnings, wonder

**Word Target**: ~4,000 words
**Review Checkpoint**: Maintain Interstitial mystery/tone

---

### Day 9: Location-NPC Integration
**Session Focus**: Each district needs residents

**Deliverables**:
- `/01_CHARACTERS/location_npcs/red_harbor_residents.md`
  - 8 Red Harbor-specific NPCs
  - Dock workers, union members, bar regulars, boat mechanics

- `/01_CHARACTERS/location_npcs/hollows_residents.md`
  - 8 Hollows-specific NPCs
  - Street vendors, gang affiliates, clinic workers, tunnel guides

- `/01_CHARACTERS/location_npcs/uptown_residents.md`
  - 6 Uptown-specific NPCs
  - Service workers, security contacts, corporate assistants

**Word Target**: ~5,000 words
**Review Checkpoint**: NPCs reference location descriptions accurately

---

### Day 10: Week 2 Review & Integration
**Session Focus**: Quality check and consistency pass

**Tasks**:
- Review all Week 2 content for voice consistency
- Verify new NPCs integrate with existing location files
- Cross-reference side quests with main story gates
- Update NPC registry
- Flag system audit for new content
- Commit and push Week 2 content

**Deliverables**:
- Updated `/13_METADATA_TRACKING/npc_registry.md`
- Updated `/13_METADATA_TRACKING/story_flags_master_list.md`

**Word Target**: ~1,500 words (documentation)

---

## WEEK 3: TIER 6-8 & AMBIENT SYSTEMS (Days 11-15)

### Day 11: Tier 6 Expansion (Fork Decision Era)
**Session Focus**: Identity crisis content

**Deliverables**:
- `/01_CHARACTERS/tier_4-6_npcs/fork_era_contacts.md`
  - 6 NPCs for Tier 6:
    - Fork Counselor
    - Identity Philosopher
    - Merged Consciousness (someone who forked)
    - Corporate Fork Recruiter
    - Underground Fork Specialist
    - Fork-Skeptic Support Group Leader

- `/03_QUESTS/tier_6_content/identity_questions.md`
  - 4 side quests about Fork implications
  - "Meet your potential fork," "Fork gone wrong," "Identity preservation"

- `/10_BARKS_REACTIONS/tier_specific/tier_6_ambient.md`
  - 30 ambient lines about forking
  - Philosophical debates, horror stories, corporate pressure

**Word Target**: ~4,000 words
**Review Checkpoint**: Align with Fork mechanics in main story

---

### Day 12: Tier 7 Expansion (Consultation Era)
**Session Focus**: High-level courier society

**Deliverables**:
- `/01_CHARACTERS/tier_7-9_npcs/high_tier_contacts.md`
  - 6 NPCs for Tier 7:
    - Elite Courier Mentor
    - Faction Diplomat
    - Corporate Defector
    - Algorithm Researcher
    - Convergence True Believer
    - Neutral Arbiter

- `/03_QUESTS/tier_7_content/high_stakes_sides.md`
  - 4 high-stakes side quests
  - "Faction negotiation," "Defector extraction," "Data heist"

- `/11_PROCEDURAL/job_templates/tier_7_jobs.md`
  - 10 elite job templates
  - Maximum stakes, maximum pay, maximum risk

**Word Target**: ~4,000 words
**Review Checkpoint**: Don't overshadow main story Tier 7 quest

---

### Day 13: Tier 8 Expansion (Ghost Protocol Era)
**Session Focus**: Pre-endgame content

**Deliverables**:
- `/01_CHARACTERS/tier_7-9_npcs/endgame_contacts.md`
  - 6 NPCs for Tier 8:
    - Path Advisor (neutral on ending choice)
    - Ascension Advocate
    - Rogue Network Contact
    - Third Path Theorist
    - Last-Minute Defector
    - Final Delivery Client

- `/03_QUESTS/tier_8_content/final_preparations.md`
  - 4 pre-endgame side quests
  - "Gather allies," "Sabotage opposition," "Final message"

- `/10_BARKS_REACTIONS/tier_specific/tier_8_ambient.md`
  - 30 ambient lines about endgame
  - Rumors of Convergence, faction tension, final choices

**Word Target**: ~4,000 words
**Review Checkpoint**: Set up endings without spoiling them

---

### Day 14: Tier-Progressive Ambient System
**Session Focus**: What couriers talk about at each level

**Deliverables**:
- `/10_BARKS_REACTIONS/tier_specific/courier_progression_dialogue.md`
  - Complete tier-by-tier ambient system
  - Tier 0-2: Survival concerns, first augment dreams
  - Tier 3-4: Algorithm debates, moral questions
  - Tier 5-6: Interstitial wonder, identity fears
  - Tier 7-8: Endgame speculation, legacy concerns
  - 120 total lines (15 per tier)

- `/10_BARKS_REACTIONS/tier_specific/npc_reactions_to_player_tier.md`
  - How NPCs react to player's tier level
  - Tier 0-2: Dismissive, condescending
  - Tier 3-4: Respectful, curious
  - Tier 5-6: Impressed, wary
  - Tier 7-8: Reverent, fearful
  - 80 total lines

**Word Target**: ~4,000 words
**Review Checkpoint**: Reactions align with existing NPC personalities

---

### Day 15: Week 3 Review & Integration
**Session Focus**: Quality check and consistency pass

**Tasks**:
- Review all Week 3 content
- Verify tier progression feels natural
- Cross-reference all new content with main story
- Update all tracking documents
- Comprehensive flag audit
- Commit and push Week 3 content

**Deliverables**:
- Updated NPC registry
- Updated flag master list
- Week 3 completion report

**Word Target**: ~1,500 words (documentation)

---

## WEEK 4: POLISH & INTEGRATION (Days 16-20)

### Day 16: Merchant & Vendor System
**Session Focus**: Shopping needs personality

**Deliverables**:
- `/01_CHARACTERS/merchant_npcs/tech_vendors.md`
  - 8 tech vendor profiles across districts
  - Each with personality, inventory hints, barter dialogue

- `/01_CHARACTERS/merchant_npcs/service_providers.md`
  - 8 service NPCs (mechanics, docs, fixers)
  - Each with specialties and tier-gated services

- `/10_BARKS_REACTIONS/merchant_barks/vendor_personalities.md`
  - 60 vendor dialogue lines
  - Tier-reactive, location-specific

**Word Target**: ~4,000 words
**Review Checkpoint**: Vendors integrate with item catalog

---

### Day 17: Rival & Peer Courier System
**Session Focus**: You're not the only courier

**Deliverables**:
- `/01_CHARACTERS/courier_npcs/rival_couriers.md`
  - 10 rival/peer courier profiles (beyond Jin)
  - Each at different tiers, different specialties
  - Some friendly, some hostile, some neutral

- `/10_BARKS_REACTIONS/courier_barks/peer_interactions.md`
  - 50 lines for courier-to-courier interactions
  - Tier comparisons, job competition, mutual respect

- `/03_QUESTS/courier_content/courier_culture.md`
  - 3 mini-quests about courier community
  - "Race challenge," "Mentor rookie," "Courier funeral"

**Word Target**: ~4,000 words
**Review Checkpoint**: Don't undermine Jin's uniqueness

---

### Day 18: Environmental Reactivity
**Session Focus**: World responds to player choices

**Deliverables**:
- `/10_BARKS_REACTIONS/reactive/world_state_reactions.md`
  - 80 lines reacting to major player choices
  - Algorithm integration reactions (if yes/no)
  - Fork reactions
  - Faction alliance reactions
  - Reputation reactions

- `/10_BARKS_REACTIONS/reactive/news_and_rumors.md`
  - 60 "news bulletin" style ambient lines
  - Reflect player's tier progress
  - Reference completed quests vaguely

**Word Target**: ~3,500 words
**Review Checkpoint**: Verify flag conditions for all reactive content

---

### Day 19: Voice Direction for New Content
**Session Focus**: All new NPCs need voice guidance

**Deliverables**:
- `/08_VOICE_ACTING/character_scripts/general_npc_voices.md`
  - Voice direction for all new general NPCs
  - Grouped by type (vendors, contacts, couriers)
  - Quick reference for casting

- `/08_VOICE_ACTING/character_scripts/ambient_voice_direction.md`
  - Direction for all ambient barks
  - Tier-specific tone guidance
  - Recording priority levels

**Word Target**: ~4,000 words
**Review Checkpoint**: Consistent with existing voice documentation

---

### Day 20: Final Integration & QA
**Session Focus**: Ship it

**Tasks**:
- Complete content review
- Flag system comprehensive audit
- NPC registry finalization
- Cross-reference matrix update
- Continuity QA pass
- Documentation updates
- Final commit and push

**Deliverables**:
- `/13_METADATA_TRACKING/content_status/phase_6_complete.md`
- Updated all tracking documents
- Phase 6 completion report

**Word Target**: ~2,000 words (documentation)

---

## DELIVERABLES SUMMARY

### New File Structure
```
surge-narrative/
├── 01_CHARACTERS/
│   ├── tier_0_npcs/
│   │   └── tutorial_npcs.md (NEW)
│   ├── tier_1-3_npcs/
│   │   ├── early_career_npcs.md (NEW)
│   │   └── tier_3_contacts.md (NEW)
│   ├── tier_4-6_npcs/
│   │   ├── gray_zone_contacts.md (NEW)
│   │   ├── interstitial_contacts.md (NEW)
│   │   └── fork_era_contacts.md (NEW)
│   ├── tier_7-9_npcs/
│   │   ├── high_tier_contacts.md (NEW)
│   │   └── endgame_contacts.md (NEW)
│   ├── location_npcs/
│   │   ├── red_harbor_residents.md (NEW)
│   │   ├── hollows_residents.md (NEW)
│   │   └── uptown_residents.md (NEW)
│   ├── merchant_npcs/
│   │   ├── tech_vendors.md (NEW)
│   │   └── service_providers.md (NEW)
│   └── courier_npcs/
│       └── rival_couriers.md (NEW)
├── 03_QUESTS/
│   ├── tier_0_content/
│   │   └── first_week_jobs.md (NEW)
│   ├── tier_1-2_content/
│   │   └── early_side_jobs.md (NEW)
│   ├── tier_3_content/
│   │   └── integration_side_content.md (NEW)
│   ├── tier_4_content/
│   │   └── gray_zone_jobs.md (NEW)
│   ├── tier_5_content/
│   │   └── between_worlds.md (NEW)
│   ├── tier_6_content/
│   │   └── identity_questions.md (NEW)
│   ├── tier_7_content/
│   │   └── high_stakes_sides.md (NEW)
│   ├── tier_8_content/
│   │   └── final_preparations.md (NEW)
│   └── courier_content/
│       └── courier_culture.md (NEW)
├── 08_VOICE_ACTING/
│   └── character_scripts/
│       ├── general_npc_voices.md (NEW)
│       └── ambient_voice_direction.md (NEW)
├── 10_BARKS_REACTIONS/
│   ├── tier_specific/
│   │   ├── tier_0_ambient.md (NEW)
│   │   ├── tier_3_ambient.md (NEW)
│   │   ├── tier_5_ambient.md (NEW)
│   │   ├── tier_6_ambient.md (NEW)
│   │   ├── tier_8_ambient.md (NEW)
│   │   ├── courier_progression_dialogue.md (NEW)
│   │   └── npc_reactions_to_player_tier.md (NEW)
│   ├── merchant_barks/
│   │   └── vendor_personalities.md (NEW)
│   ├── courier_barks/
│   │   └── peer_interactions.md (NEW)
│   └── reactive/
│       ├── world_state_reactions.md (NEW)
│       └── news_and_rumors.md (NEW)
└── 11_PROCEDURAL/
    └── job_templates/
        ├── job_briefing_framework.md (NEW)
        ├── client_profiles.md (NEW)
        ├── package_descriptions.md (NEW)
        ├── delivery_circumstances.md (NEW)
        ├── tier_1-2_jobs.md (NEW)
        ├── tier_4_jobs.md (NEW)
        └── tier_7_jobs.md (NEW)
```

### Content Metrics

| Week | Focus | New Files | Est. Words |
|------|-------|-----------|------------|
| Week 1 | Foundation + Tier 0-2 | 8 | ~16,000 |
| Week 2 | Tier 3-5 + Locations | 10 | ~18,500 |
| Week 3 | Tier 6-8 + Ambient | 10 | ~17,500 |
| Week 4 | Polish + Integration | 10 | ~17,500 |
| **Total** | | **38** | **~69,500** |

### New NPC Count

| Category | Count |
|----------|-------|
| Tier 0 NPCs | 5 |
| Tier 1-2 NPCs | 8 |
| Tier 3 NPCs | 6 |
| Tier 4 NPCs | 6 |
| Tier 5 NPCs | 6 |
| Tier 6 NPCs | 6 |
| Tier 7 NPCs | 6 |
| Tier 8 NPCs | 6 |
| Location NPCs | 22 |
| Merchant NPCs | 16 |
| Courier NPCs | 10 |
| **Total New NPCs** | **97** |

### New Ambient Lines

| Type | Count |
|------|-------|
| Tier-specific ambient | ~185 |
| Courier progression | ~120 |
| NPC tier reactions | ~80 |
| Vendor personalities | ~60 |
| Peer interactions | ~50 |
| World state reactions | ~80 |
| News/rumors | ~60 |
| **Total New Lines** | **~635** |

---

## SUCCESS CRITERIA

### Quantitative
- [ ] 38 new files created
- [ ] ~70,000 new words
- [ ] 97 new NPCs documented
- [ ] 635+ new ambient lines
- [ ] All tiers 0-8 have dedicated side content
- [ ] Procedural job system operational

### Qualitative
- [ ] Each tier feels distinct
- [ ] World feels populated, not empty
- [ ] Procedural content has variety
- [ ] New NPCs don't overshadow main cast
- [ ] Ambient dialogue enhances immersion
- [ ] Content integrates seamlessly with existing material

---

## EXECUTION NOTES

### Daily Workflow
1. **Morning**: Read relevant existing content for context
2. **Development**: Write new content per day's focus
3. **Review**: Self-QA for voice consistency
4. **Integration**: Update tracking documents
5. **Commit**: Daily commits with clear messages

### Review Checkpoints
- End of each day: Quick self-review
- End of each week: Comprehensive integration review
- Day 20: Final QA pass

### Risk Mitigation
- If falling behind: Prioritize Tier 0-3 (most critical gaps)
- If content conflicts: Defer to existing main cast characterization
- If scope creeps: Cut procedural variations before NPC depth

---

*Phase 6 Expansion Plan*
*Created: 2026-01-17*
*Target Completion: 4 weeks*
