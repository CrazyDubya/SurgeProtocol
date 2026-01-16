# Surge Protocol: Dialogue & Narrative Content Directory

## Project Overview

This is the **Narrative Content Sub-Project** for Surge Protocol - a semi-independent content creation system for all dialogue, quests, characters, and reusable text. This directory structure allows writers and narrative designers to work independently from code implementation while maintaining coherent story progression.

---

## Directory Structure

```
surge-narrative/
│
├── 01_CHARACTERS/
│   ├── _character_templates/
│   │   ├── character_sheet_template.md
│   │   └── relationship_progression_template.md
│   │
│   ├── tier_0_npcs/          # Tutorial/Starting NPCs
│   │   ├── dispatcher_chen.md
│   │   ├── mechanic_rosa.md
│   │   └── rookie_rival_jin.md
│   │
│   ├── tier_1-3_npcs/        # Early Game Characters
│   │   ├── dr_yuki_tanaka.md
│   │   ├── street_doc_marcus.md
│   │   ├── fixer_delilah.md
│   │   └── corpo_handler_singh.md
│   │
│   ├── tier_4-6_npcs/        # Mid Game Characters
│   │   ├── gray_market_queen_vex.md
│   │   ├── union_organizer_lopez.md
│   │   ├── rogue_ai_fragment_echo.md
│   │   └── corpo_exec_nakamura.md
│   │
│   ├── tier_7-9_npcs/        # Late Game Characters
│   │   ├── okonkwo_interstitial_guide.md
│   │   ├── dmitri_questioning_algorithm.md
│   │   ├── kenji_nobody_ghost.md
│   │   ├── voronov_faked_death.md
│   │   └── solomon_saint_germain_third_path.md
│   │
│   ├── tier_10_npcs/         # Endgame Characters
│   │   ├── synthesis_ascended.md
│   │   ├── maria_santos_upload.md
│   │   └── the_algorithm_manifestation.md
│   │
│   ├── faction_leaders/
│   │   ├── sentinel_corps_director.md
│   │   ├── union_chairperson.md
│   │   ├── ghost_network_node.md
│   │   └── corpo_board_members.md
│   │
│   └── romance_characters/
│       ├── romance_arc_template.md
│       ├── romance_mechanic_rosa.md
│       ├── romance_hacker_kai.md
│       └── romance_corpo_spy_alexei.md
│
├── 02_DIALOGUE_TREES/
│   ├── _dialogue_templates/
│   │   ├── dialogue_node_spec.md
│   │   ├── branching_template.json
│   │   └── skill_check_template.md
│   │
│   ├── greetings/
│   │   ├── first_meeting_greetings.md
│   │   ├── relationship_based_greetings.md
│   │   ├── humanity_based_greetings.md
│   │   └── tier_based_greetings.md
│   │
│   ├── farewells/
│   │   ├── standard_farewells.md
│   │   ├── relationship_farewells.md
│   │   └── urgent_departure_farewells.md
│   │
│   ├── conversation_topics/
│   │   ├── ask_about_work.md
│   │   ├── ask_about_city.md
│   │   ├── ask_about_factions.md
│   │   ├── ask_about_algorithm.md
│   │   ├── ask_about_augments.md
│   │   └── rumors_and_gossip.md
│   │
│   ├── skill_check_dialogues/
│   │   ├── deception_checks.md
│   │   ├── intimidation_checks.md
│   │   ├── empathy_checks.md
│   │   ├── tech_knowledge_checks.md
│   │   └── street_smarts_checks.md
│   │
│   └── conditional_branches/
│       ├── humanity_thresholds.md      # 80+, 60-79, 40-59, <40
│       ├── tier_gates.md               # Tier-specific dialogue
│       ├── faction_reputation.md       # Rep-based variations
│       ├── story_flag_variations.md    # Major decision callbacks
│       └── item_possession_checks.md   # Has item? Show option
│
├── 03_QUESTS/
│   ├── _quest_templates/
│   │   ├── quest_structure_template.md
│   │   ├── mission_complication_template.md
│   │   └── moral_dilemma_template.md
│   │
│   ├── main_story/
│   │   ├── tier_0_tutorial.md
│   │   ├── tier_1_fresh_meat.md
│   │   ├── tier_2_provisional.md
│   │   ├── tier_3_the_whisper.md
│   │   ├── tier_4_gray_market.md
│   │   ├── tier_5_space_between.md
│   │   ├── tier_6_chrome_and_choice.md
│   │   ├── tier_7_the_consultation.md
│   │   ├── tier_8_ghost_protocol.md
│   │   ├── tier_9_convergence.md
│   │   ├── tier_10_view_from_everywhere.md
│   │   └── epilogue_the_rogue.md
│   │
│   ├── story_arcs/
│   │   ├── arc_corporate_ladder/
│   │   │   ├── arc_overview.md
│   │   │   ├── quest_01_entry_level.md
│   │   │   ├── quest_02_climbing.md
│   │   │   ├── quest_03_optimization.md
│   │   │   └── quest_04_integration.md
│   │   │
│   │   ├── arc_burn_notice/
│   │   │   ├── arc_overview.md
│   │   │   ├── quest_01_first_doubt.md
│   │   │   ├── quest_02_underground.md
│   │   │   ├── quest_03_sabotage.md
│   │   │   └── quest_04_escape.md
│   │   │
│   │   ├── arc_solidarity/
│   │   ├── arc_convergence/
│   │   └── arc_transcendence/
│   │
│   ├── faction_quests/
│   │   ├── sentinel_corps/
│   │   ├── union_collective/
│   │   ├── ghost_network/
│   │   ├── chrome_kings/
│   │   ├── data_brokers/
│   │   └── corpo_contracts/
│   │
│   ├── side_quests/
│   │   ├── major_sides/
│   │   │   ├── the_lost_fork.md
│   │   │   ├── memory_merchant.md
│   │   │   └── humanity_on_trial.md
│   │   │
│   │   └── minor_sides/
│   │       ├── courier_favors.md
│   │       ├── street_problems.md
│   │       └── personal_errands.md
│   │
│   ├── relationship_quests/
│   │   ├── romance_quest_chains/
│   │   ├── friendship_quests/
│   │   └── rivalry_confrontations/
│   │
│   ├── daily_bounties/
│   │   ├── delivery_types/
│   │   ├── elimination_contracts/
│   │   └── data_runs/
│   │
│   └── secret_quests/
│       ├── hidden_triggers.md
│       ├── easter_egg_chains.md
│       └── meta_discoveries.md
│
├── 04_COMPLICATIONS/
│   ├── _complication_templates/
│   │   ├── complication_structure.md
│   │   └── resolution_branching.md
│   │
│   ├── environmental/
│   │   ├── traffic_disasters.md
│   │   ├── weather_hazards.md
│   │   ├── infrastructure_failure.md
│   │   └── crowd_events.md
│   │
│   ├── hostile_encounters/
│   │   ├── police_intercepts.md
│   │   ├── gang_ambushes.md
│   │   ├── corpo_recovery_teams.md
│   │   └── rival_couriers.md
│   │
│   ├── cargo_issues/
│   │   ├── fragile_breaking.md
│   │   ├── time_sensitive_decay.md
│   │   ├── hazmat_leak.md
│   │   └── contraband_discovery.md
│   │
│   ├── moral_dilemmas/
│   │   ├── cargo_is_wrong.md
│   │   ├── innocent_bystander.md
│   │   ├── blackmail_opportunity.md
│   │   └── save_stranger_vs_mission.md
│   │
│   └── technical_failures/
│       ├── vehicle_breakdown.md
│       ├── augment_malfunction.md
│       ├── nav_system_hacked.md
│       └── comm_blackout.md
│
├── 05_WORLD_TEXT/
│   ├── locations/
│   │   ├── districts/
│   │   │   ├── the_hollows.md
│   │   │   ├── night_market.md
│   │   │   ├── corporate_row.md
│   │   │   ├── dockside.md
│   │   │   ├── meridian_heights.md
│   │   │   └── the_interstitial.md
│   │   │
│   │   ├── landmarks/
│   │   │   ├── courier_stations.md
│   │   │   ├── augment_clinics.md
│   │   │   ├── safe_houses.md
│   │   │   └── black_markets.md
│   │   │
│   │   └── ambience/
│   │       ├── street_scenes.md
│   │       ├── weather_descriptions.md
│   │       └── time_of_day_flavor.md
│   │
│   ├── lore/
│   │   ├── history/
│   │   │   ├── algorithm_origin.md
│   │   │   ├── courier_guild_formation.md
│   │   │   ├── corpo_wars.md
│   │   │   └── union_uprising.md
│   │   │
│   │   ├── factions/
│   │   │   ├── faction_histories.md
│   │   │   ├── faction_philosophies.md
│   │   │   └── faction_relationships.md
│   │   │
│   │   └── technology/
│   │       ├── augment_evolution.md
│   │       ├── consciousness_tech.md
│   │       ├── cortical_stack_lore.md
│   │       └── the_network_explained.md
│   │
│   └── flavor_text/
│       ├── graffiti_messages.md
│       ├── overheard_conversations.md
│       ├── news_broadcasts.md
│       ├── social_media_posts.md
│       └── advertisement_copy.md
│
├── 06_ALGORITHM_VOICE/
│   ├── progression/
│   │   ├── humanity_100-80_clinical.md
│   │   ├── humanity_79-60_warming.md
│   │   ├── humanity_59-40_shadow_emerges.md
│   │   ├── humanity_39-20_we_language.md
│   │   └── humanity_19-0_hollow_state.md
│   │
│   ├── context_specific/
│   │   ├── navigation_guidance.md
│   │   ├── mission_briefings.md
│   │   ├── combat_advice.md
│   │   ├── social_coaching.md
│   │   └── emotional_manipulation.md
│   │
│   ├── shadow_dialogue/
│   │   ├── shadow_introduction.md
│   │   ├── shadow_disagreements.md
│   │   ├── shadow_takeover_attempts.md
│   │   └── shadow_archetypes/
│   │       ├── optimizer_shadow.md
│   │       ├── survivor_shadow.md
│   │       ├── philosopher_shadow.md
│   │       └── aspirant_shadow.md
│   │
│   └── endgame_voices/
│       ├── synthesis_collective.md
│       ├── algorithm_direct_contact.md
│       └── final_choice_dialogue.md
│
├── 07_ITEMS_INVENTORY/
│   ├── item_descriptions/
│   │   ├── augments/
│   │   │   ├── cochlear_implant.md
│   │   │   ├── cortical_stack.md
│   │   │   ├── dermal_armor.md
│   │   │   ├── reflex_boosters.md
│   │   │   └── neural_processors.md
│   │   │
│   │   ├── weapons/
│   │   │   ├── holdout_pistol.md
│   │   │   ├── mono_knife.md
│   │   │   ├── emp_grenade.md
│   │   │   └── smart_weapon_descriptions.md
│   │   │
│   │   ├── gear/
│   │   │   ├── medkits.md
│   │   │   ├── hacking_tools.md
│   │   │   ├── stealth_gear.md
│   │   │   └── survival_equipment.md
│   │   │
│   │   └── quest_items/
│   │       ├── data_chips.md
│   │       ├── mysterious_packages.md
│   │       ├── keepsakes.md
│   │       └── evidence.md
│   │
│   ├── cargo_types/
│   │   ├── standard_cargo.md
│   │   ├── fragile_cargo.md
│   │   ├── hazmat_cargo.md
│   │   ├── time_sensitive_cargo.md
│   │   └── covert_cargo.md
│   │
│   └── collectibles/
│       ├── data_fragments.md
│       ├── memory_shards.md
│       ├── faction_tokens.md
│       └── achievement_items.md
│
├── 08_SKILL_CHECKS/
│   ├── deception/
│   │   ├── easy_lies.md
│   │   ├── moderate_cons.md
│   │   ├── hard_impersonations.md
│   │   └── epic_long_cons.md
│   │
│   ├── intimidation/
│   │   ├── easy_threats.md
│   │   ├── moderate_violence.md
│   │   ├── hard_terrify.md
│   │   └── epic_dominate.md
│   │
│   ├── empathy/
│   │   ├── easy_comfort.md
│   │   ├── moderate_counsel.md
│   │   ├── hard_therapy.md
│   │   └── epic_breakthrough.md
│   │
│   ├── technical/
│   │   ├── easy_basic_tech.md
│   │   ├── moderate_hacking.md
│   │   ├── hard_systems_crack.md
│   │   └── epic_ghost_network.md
│   │
│   └── perception/
│       ├── easy_notice.md
│       ├── moderate_investigation.md
│       ├── hard_hidden_truths.md
│       └── epic_pattern_recognition.md
│
├── 09_BRANCHING_POINTS/
│   ├── major_decisions/
│   │   ├── tier_3_augment_choice.md
│   │   ├── tier_5_faction_alignment.md
│   │   ├── tier_6_fork_creation.md
│   │   ├── tier_9_final_path.md
│   │   └── epilogue_variations.md
│   │
│   ├── moral_choices/
│   │   ├── first_kill_decision.md
│   │   ├── spare_vs_execute.md
│   │   ├── sacrifice_innocent.md
│   │   ├── betrayal_opportunities.md
│   │   └── loyalty_tests.md
│   │
│   ├── relationship_branches/
│   │   ├── romance_commitments.md
│   │   ├── friendship_betrayals.md
│   │   ├── faction_allegiances.md
│   │   └── npc_life_death.md
│   │
│   └── mechanical_branches/
│       ├── chrome_vs_humanity.md
│       ├── specialization_paths.md
│       ├── faction_rep_thresholds.md
│       └── rating_tier_gates.md
│
├── 10_BARKS_REACTIONS/
│   ├── combat_barks/
│   │   ├── player_combat_lines.md
│   │   ├── enemy_combat_lines.md
│   │   ├── ally_combat_lines.md
│   │   └── environmental_reactions.md
│   │
│   ├── ambient_dialogue/
│   │   ├── npc_to_npc.md
│   │   ├── crowd_reactions.md
│   │   ├── vendor_calls.md
│   │   └── street_preachers.md
│   │
│   ├── reputation_reactions/
│   │   ├── high_tier_recognition.md
│   │   ├── faction_love.md
│   │   ├── faction_hate.md
│   │   └── notoriety_comments.md
│   │
│   └── humanity_reactions/
│       ├── high_humanity_npcs.md
│       ├── low_humanity_npcs.md
│       ├── chrome_disgust.md
│       └── algorithm_worship.md
│
├── 11_CUTSCENES_VIGNETTES/
│   ├── tier_milestone_scenes/
│   │   ├── tier_3_cochlear_surgery.md
│   │   ├── tier_6_cortical_installation.md
│   │   ├── tier_7_algorithm_meeting.md
│   │   ├── tier_9_final_choice.md
│   │   └── tier_10_transcendence.md
│   │
│   ├── story_arc_climaxes/
│   │   ├── corpo_integration_scene.md
│   │   ├── rogue_escape_scene.md
│   │   ├── union_revolution_scene.md
│   │   └── third_path_revelation.md
│   │
│   ├── character_moments/
│   │   ├── romance_key_scenes.md
│   │   ├── betrayal_reveals.md
│   │   ├── sacrifice_moments.md
│   │   └── reunion_scenes.md
│   │
│   └── world_events/
│       ├── faction_war_outbreak.md
│       ├── district_lockdown.md
│       ├── algorithm_manifestation.md
│       └── city_wide_crisis.md
│
├── 12_TUTORIALS_TOOLTIPS/
│   ├── gameplay_tutorials/
│   │   ├── movement_basics.md
│   │   ├── combat_introduction.md
│   │   ├── mission_system.md
│   │   ├── rating_system.md
│   │   └── augment_installation.md
│   │
│   ├── system_explanations/
│   │   ├── humanity_mechanic.md
│   │   ├── fork_system.md
│   │   ├── faction_reputation.md
│   │   ├── relationship_system.md
│   │   └── story_flags.md
│   │
│   ├── tooltips/
│   │   ├── ui_element_tooltips.md
│   │   ├── item_tooltips.md
│   │   ├── skill_tooltips.md
│   │   └── status_effect_tooltips.md
│   │
│   └── contextual_help/
│       ├── first_time_prompts.md
│       ├── failure_guidance.md
│       └── discovery_hints.md
│
└── 13_METADATA_TRACKING/
    ├── content_status/
    │   ├── character_completion.md
    │   ├── quest_completion.md
    │   ├── dialogue_coverage.md
    │   └── content_priority.md
    │
    ├── narrative_dependencies/
    │   ├── story_flag_map.md
    │   ├── quest_prerequisites.md
    │   ├── character_relationships.md
    │   └── timeline_tracking.md
    │
    ├── voice_acting/
    │   ├── line_count_estimates.md
    │   ├── character_voice_briefs.md
    │   ├── emotion_tags.md
    │   └── recording_priorities.md
    │
    └── localization/
        ├── word_count_tracking.md
        ├── context_notes.md
        ├── cultural_considerations.md
        └── string_ids.md
```

---

## Content File Template Specs

### Character File Template (`01_CHARACTERS/_character_templates/character_sheet_template.md`)

```markdown
# Character Name

## Core Identity
- **Full Name**:
- **Alias/Callsign**:
- **Age**:
- **Gender**:
- **Pronouns**:
- **Occupation**:
- **Faction Affiliation**:
- **First Appearance Tier**:

## Physical Description
- **Appearance**:
- **Augmentations Visible**:
- **Style/Aesthetic**:
- **Voice Description**:

## Personality
- **Core Traits**:
- **Motivations**:
- **Fears**:
- **Values**:
- **Speech Patterns**:

## Background
- **Origin Story**:
- **Current Situation**:
- **Connection to Player**:
- **Secrets**:

## Relationships
- **Allied With**:
- **Opposed To**:
- **Romantic Interest**:
- **Past Connections**:

## Story Role
- **Narrative Function**: [Quest Giver / Mentor / Antagonist / Romance / Rival]
- **Arc Summary**:
- **Key Story Beats**:
- **Possible Outcomes**: [Can die? Can betray? Can ascend?]

## Dialogue Trees
- **Greeting Variants**: [First meeting, Friendly, Neutral, Hostile, Post-betrayal]
- **Topic Hubs**:
  - Ask about work
  - Ask about past
  - Ask about faction
  - Rumors
- **Quest Integration**: [Which quests involve this character]
- **Relationship Stages**: [Stranger > Acquaintance > Friend/Rival > Close/Enemy]

## Conditional Dialogue
- **Humanity Thresholds**: [Different dialogue at <40, 40-60, 60-80, 80+]
- **Tier Gates**: [Only appears after Tier X]
- **Story Flag Requirements**: [Only available if X flag is set]
- **Faction Rep Requirements**: [Requires +20 with faction Y]

## Voice Acting Notes
- **Voice Type**:
- **Accent**:
- **Emotion Range**:
- **Line Count Estimate**:
```

---

### Quest File Template (`03_QUESTS/_quest_templates/quest_structure_template.md`)

```markdown
# Quest Title

## Metadata
- **Quest ID**:
- **Type**: [MAIN_STORY / MAJOR_SIDE / MINOR_SIDE / FACTION / RELATIONSHIP]
- **Tier Availability**:
- **Required Tier**:
- **Estimated Duration**:
- **Repeatable**: [Yes/No]

## Prerequisites
- **Required Quests Completed**:
- **Faction Reputation**:
- **Story Flags**:
- **Tier Minimum**:
- **Items Required**:

## Quest Giver
- **NPC Name**:
- **Location**:
- **Initial Dialogue Tree**: [Reference to dialogue file]

## Synopsis
**One-Paragraph Summary**:

## Objectives
1. **Primary Objective**:
2. **Secondary Objectives**:
3. **Optional Objectives**:
4. **Hidden Objectives**:

## Narrative Beats

### Act 1: Setup
- **Hook**:
- **Context**:
- **Initial Decision Point**:

### Act 2: Complication
- **Twist/Escalation**:
- **Moral Dilemma**:
- **Branching Point**:

### Act 3: Resolution
- **Climax**:
- **Consequences**:
- **Multiple Endings**:

## Branching Paths

### Path A: [Name]
- **Trigger**:
- **Consequences**:
- **Rewards**:
- **Story Flags Set**:

### Path B: [Name]
- **Trigger**:
- **Consequences**:
- **Rewards**:
- **Story Flags Set**:

## Complications
- **Possible Complications**: [Random events during quest]
- **Environmental Hazards**:
- **Hostile Encounters**:
- **Moral Choices**:

## Rewards

### All Paths
- **XP**:
- **Credits**:
- **Reputation Changes**:

### Path-Specific
- **Unique Items**:
- **Unlocked Content**:
- **Relationship Changes**:

## Consequences

### Short-Term
- **Immediate Impact**:

### Long-Term
- **Story Ramifications**:
- **Character Outcomes**:
- **World State Changes**:

## Dialogue References
- **Quest Intro**: [File reference]
- **Mid-Quest Dialogue**: [File reference]
- **Quest Complete Dialogue**: [File reference]
- **Failure Dialogue**: [File reference]

## Technical Notes
- **Locations Used**:
- **NPCs Involved**:
- **Items Spawned**:
- **Scripted Events**:
```

---

### Dialogue Tree File Template (`02_DIALOGUE_TREES/_dialogue_templates/dialogue_node_spec.md`)

```markdown
# Dialogue Tree: [Tree Name]

## Tree Metadata
- **Tree ID**:
- **Associated NPC**:
- **Context**: [When does this conversation happen?]
- **Repeatable**: [Yes/No]

## Node Structure

### Node 1: Root (NPC_LINE)
**NPC**: "Opening line of dialogue."

**Conditions to Display**:
- Tier >= X
- Humanity >= Y
- Story Flag: FLAG_NAME
- Faction Rep: FACTION_NAME >= Z

**Voice Notes**: [Emotion: neutral, tone: professional]

**Leads To**: [Node 2, Node 3]

---

### Node 2: Player Response Hub (PLAYER_RESPONSE_HUB)

**Player Option A**: "Agreeable response text."
  - **Tone**: FRIENDLY
  - **Conditions**: None
  - **Leads To**: Node 4
  - **Relationship Change**: +5 Trust
  - **Story Flag Set**: AGREED_WITH_NPC

**Player Option B**: "Questioning response text."
  - **Tone**: NEUTRAL
  - **Conditions**: None
  - **Leads To**: Node 5
  - **Relationship Change**: None

**Player Option C**: "Aggressive response text."
  - **Tone**: AGGRESSIVE
  - **Conditions**: Intimidation >= 6
  - **Leads To**: Node 6
  - **Relationship Change**: -5 Trust, +3 Fear
  - **Skill Check**: INTIMIDATION, Difficulty: MODERATE (9)

**Player Option D**: [Lie] "Deceptive response text."
  - **Tone**: SARCASTIC
  - **Conditions**: Deception >= 4
  - **Leads To**: Node 7 (success) or Node 8 (failure)
  - **Skill Check**: DECEPTION, Difficulty: HARD (12)
  - **Consequence if Failed**: NPC discovers lie, relationship penalty

---

### Node 4: NPC Response (NPC_LINE)
**NPC**: "Positive reaction to player agreement."

**Voice Notes**: [Emotion: pleased, tone: warm]

**Leads To**: EXIT or Node 9 (additional topic)

---

### Node 5: Skill Check (SKILL_CHECK)

**Check Type**: EMPATHY
**Difficulty**: MODERATE (9)
**Context**: "You sense the NPC is hiding something."

**Success Path**: Node 10 (NPC opens up)
  - **Relationship**: +10 Trust
  - **Story Flag**: LEARNED_SECRET

**Failure Path**: Node 11 (NPC deflects)
  - **Relationship**: -2 Trust

---

### Node 6: Branch (BRANCH)

**Branching Logic**:
- IF Story Flag: KILLED_FIRST_PERSON → Node 12 (NPC mentions your reputation)
- ELSE IF Faction Rep: UNION >= 20 → Node 13 (NPC offers union insight)
- ELSE → Node 14 (Standard conversation continues)

---

## Exit Nodes

### Exit A: Friendly Farewell
**NPC**: "Thanks for hearing me out. Stay safe."
**Relationship**: No change

### Exit B: Tense Departure
**NPC**: "We're done here."
**Relationship**: -5 Trust

### Exit C: Quest Hook
**NPC**: "Actually... I might have work for you."
**Unlocks**: Quest [QUEST_ID]
```

---

### Complication Template (`04_COMPLICATIONS/_complication_templates/complication_structure.md`)

```markdown
# Complication: [Name]

## Metadata
- **Complication ID**:
- **Type**: [Environmental / Hostile / Cargo / Moral / Technical]
- **Trigger Chance**: [%]
- **Mission Types**: [Which mission types can trigger this?]

## Trigger Conditions
- **Tier Range**:
- **Location**:
- **Time of Day**:
- **Story Flags**:
- **Faction Heat**:

## Description
**Narrative Setup**: [What happens when this triggers?]

## Player Options

### Option 1: [Action Name]
**Description**:
**Requirements**: [Skill check? Item? Augment?]
**Success**:
  - **Outcome**:
  - **Time Cost**:
  - **Reward/Penalty**:
**Failure**:
  - **Outcome**:
  - **Consequences**:

### Option 2: [Action Name]
[Same structure]

### Option 3: Ignore/Bypass
**Consequences**:

## Dialogue
**Algorithm Commentary**:
**Shadow Commentary**: [If player has Fork]
**NPC Reactions**: [If NPC present]

## Long-Term Impact
- **Story Flags Set**:
- **Reputation Changes**:
- **Relationship Changes**:
- **World State Impact**:
```

---

## Content Priority Matrix

### Phase 1: Core Critical Path (Weeks 1-4)
**Goal**: Minimum playable story from Tier 0 to Tier 10

1. **Main Story Quests**:
   - All 12 tier milestone quests (Tier 0 through Epilogue)
   - Single linear path, no branching yet
   - 3-5 key NPCs only

2. **Essential Dialogue**:
   - Greetings/farewells for core NPCs
   - Algorithm voice (all humanity levels)
   - Quest giver dialogues
   - Tier milestone cutscenes

3. **Basic Complications**:
   - 2-3 complications per category (10-15 total)
   - Simple resolution paths

4. **Tutorial Text**:
   - All gameplay tutorials
   - Core system explanations

**Deliverable**: Playable vertical slice, Tier 0-10

---

### Phase 2: Branching & Depth (Weeks 5-8)
**Goal**: Add major story arcs and meaningful choices

1. **Story Arcs**:
   - Complete all 5 story arcs (Corporate, Rogue, Union, Network, Ascend)
   - 4-5 quests per arc
   - Arc-specific NPCs (15-20 total)

2. **Branching Points**:
   - Major decision points with consequences
   - Moral dilemmas with 3+ outcomes
   - Faction allegiance systems

3. **Expanded Dialogue**:
   - Conditional dialogue based on choices
   - Relationship progression systems
   - Humanity-based variations

4. **Fork/Shadow System**:
   - All Shadow dialogue
   - Divergence mechanics
   - Shadow archetypes

**Deliverable**: Full narrative branches, replayability

---

### Phase 3: Side Content & Polish (Weeks 9-12)
**Goal**: World richness and immersion

1. **Side Quests**:
   - 15-20 major side quests
   - 30-40 minor side quests
   - Secret quest chains

2. **NPC Depth**:
   - Romance arcs (4-5 characters)
   - Faction leaders (12)
   - Tier-specific NPCs (30+)
   - Ambient NPCs

3. **World Building**:
   - Location descriptions
   - Lore documents
   - Flavor text library
   - Ambient dialogue

4. **Faction Quests**:
   - 5-10 quests per faction
   - Faction-specific complications
   - Territory control narratives

**Deliverable**: Full world immersion

---

### Phase 4: Reactivity & Polish (Weeks 13-16)
**Goal**: Make the world respond to player

1. **Barks & Reactions**:
   - Combat barks (100+ lines)
   - Reputation-based reactions
   - Humanity-based NPC responses
   - Environmental reactions

2. **Relationship Content**:
   - Relationship quest chains
   - Romance scenes and dialogue
   - Friendship/rivalry arcs
   - NPC memories of player actions

3. **Endgame Variations**:
   - Multiple epilogue variations
   - Consequence callbacks
   - Character fate variations

4. **Item Descriptions**:
   - All augment lore
   - Weapon descriptions
   - Quest item flavor
   - Collectible texts

**Deliverable**: Fully reactive world

---

## Writing Guidelines

### Tone & Voice

**Core Principles**:
1. **Grounded Cynicism**: No heroes, only survivors
2. **Ambiguity**: Every faction has blood on their hands
3. **Body Horror**: Augmentation has visceral cost
4. **Economic Anxiety**: Rating system dominates everything
5. **Identity Crisis**: What remains of "you" after chrome?

**Avoid**:
- Power fantasy (you're a courier, not a superhero)
- Clear good/evil (all choices are gray)
- Lecturing (show, don't tell)
- Jargon overload (keep cyberpunk terms readable)

---

### Dialogue Best Practices

1. **Keep It Lean**:
   - NPCs: 1-3 sentences per node
   - Players: 5-8 word responses
   - Avoid walls of text

2. **Voice Distinction**:
   - Each NPC should have unique speech patterns
   - Use vocabulary, sentence structure, slang to differentiate

3. **Subtext Over Text**:
   - What's NOT said matters
   - Use [pause], [looks away], [nervous laugh]

4. **Player Agency**:
   - Avoid "Yes/No/Sarcastic" traps
   - Give meaningful tonal choices
   - Reflect player build (high Empathy? Show it)

5. **Conditional Awareness**:
   - NPCs should remember past interactions
   - Reference player choices: "Remember when you..."
   - Acknowledge reputation, tier, augments

---

### Branching Narrative Rules

1. **The Illusion of Choice**:
   - 70% of branches reconverge to main path
   - Major branches (3-4 per arc) genuinely diverge
   - Make small choices FEEL impactful even if minor

2. **Consequence Timing**:
   - Immediate: Relationship changes, small rewards
   - Medium: Faction rep, access to content
   - Long-term: Story flags that pay off tiers later

3. **Flag Management**:
   - Use clear flag names: `KILLED_RIVAL_JIN`, `SPARED_DMITRI`
   - Track in metadata files
   - Plan callback moments

4. **Failure States**:
   - Failed skill checks should be interesting, not punishing
   - "Fail forward" - story continues differently
   - Some failures unlock unique content

---

### Humanity-Based Writing

**High Humanity (80-100)**:
- Empathy options available
- NPCs treat you warmly
- Algorithm is clinical
- Shadow doesn't exist yet

**Mid Humanity (60-79)**:
- Some empathy options greyed out
- NPCs notice your coldness
- Algorithm becomes "helpful"
- Shadow whispers begin

**Low Humanity (40-59)**:
- Most empathy gone
- NPCs show fear/discomfort
- Algorithm uses "we" language
- Shadow argues for control

**Critical (<40)**:
- Only ruthless options
- NPCs avoid you
- Algorithm speaks as hive
- Shadow constantly present

---

### Quest Design Philosophy

1. **Three-Act Structure**:
   - Act 1: Setup with clear goal
   - Act 2: Complication/twist
   - Act 3: Resolution with consequence

2. **The Courier's Dilemma**:
   - Every quest should involve delivery/transport metaphorically
   - "What are you carrying?" (literal or metaphorical)
   - "What price for delivery?"

3. **Moral Weight**:
   - Avoid pure good outcomes
   - Success has cost (humanity, relationships, faction rep)
   - Sometimes the "right" choice feels bad

4. **Interconnection**:
   - Side quests should reference main story
   - NPCs from different quests know each other
   - Faction quests affect faction warfare

---

## Technical Integration Points

### How Narrative Content Connects to Code

1. **Dialogue Tree JSON Export**:
   - Each `.md` dialogue file should map to JSON structure
   - Node IDs reference conversation flow
   - Conditions map to game state checks

2. **Story Flag System**:
   - Flags are boolean or integer values
   - Set via quest completion, dialogue choices
   - Checked for conditional content

3. **Relationship Database**:
   - Each NPC has relationship scores (Trust, Fear, Respect, Romance)
   - Dialogue choices modify scores
   - Scores unlock content/change greetings

4. **Item/Quest Integration**:
   - Item descriptions pull from `/07_ITEMS_INVENTORY/`
   - Quest objectives link to narrative files
   - Rewards trigger story progression

5. **Voice Acting Pipeline**:
   - Each dialogue node has voice notes
   - Emotion tags for voice direction
   - Line IDs for audio file matching

---

## Content Review Checklist

Before marking content "complete", verify:

- [ ] Spelling/grammar pass
- [ ] Voice consistency for NPCs
- [ ] Story flag references correct
- [ ] Conditions are achievable
- [ ] Skill check difficulties appropriate
- [ ] Humanity thresholds make sense
- [ ] No contradictions with existing lore
- [ ] Relationship changes feel proportional
- [ ] Multiple outcomes tested conceptually
- [ ] Voice acting notes clear
- [ ] Emotional beats land properly
- [ ] Player agency preserved
- [ ] Failure states are interesting
- [ ] Content honors the core themes

---

## Collaboration Workflow

### For Writers
1. Claim a character/quest in content status tracker
2. Review lore/dependency files first
3. Use templates for structure
4. Write content in `.md` files
5. Flag dependencies (needs NPC X, requires quest Y)
6. Submit for review

### For Narrative Lead
1. Review for tone/consistency
2. Check story flag continuity
3. Approve major branching points
4. Maintain timeline coherence
5. Ensure no orphaned content

### For Developers
1. Pull approved `.md` files
2. Parse into JSON/database format
3. Implement conditions/branches
4. Flag technical blockers (needs new feature)
5. Playtest and report narrative bugs

---

## Example: Character File (Starter NPC)

```markdown
# Dispatcher Chen

## Core Identity
- **Full Name**: Chen Wei-Ming
- **Alias/Callsign**: "Dispatch"
- **Age**: 47
- **Gender**: Male
- **Pronouns**: He/Him
- **Occupation**: Courier Dispatcher, The Hollows Station
- **Faction Affiliation**: Neutral (Guild-aligned)
- **First Appearance Tier**: 0 (Tutorial)

## Physical Description
- **Appearance**: Tired eyes, graying hair in a tight bun, calloused hands. Wears a faded Guild jacket with patched elbows.
- **Augmentations Visible**: Basic ocular implant (left eye, glowing amber), outdated comm interface behind ear
- **Style/Aesthetic**: Working-class professional, seen-it-all pragmatist
- **Voice Description**: Gravelly, patient but firm. Speaks in clipped sentences.

## Personality
- **Core Traits**: Pragmatic, protective of rookies, cynical about the system
- **Motivations**: Keeps the station running, helps fresh couriers survive
- **Fears**: Losing another rookie to street violence or the Algorithm
- **Values**: Honest work, loyalty to the Guild, harm reduction
- **Speech Patterns**: Calls everyone "kid" or "rookie," uses courier slang naturally

## Background
- **Origin Story**: Former Tier 7 courier, took dispatcher role after knee injury forced retirement
- **Current Situation**: Runs dispatch at Hollows Station, sees dozens of rookies come and go
- **Connection to Player**: Your first contact, gives tutorial missions
- **Secrets**: Lost his daughter to a botched high-tier run; protective instinct stems from this

## Relationships
- **Allied With**: Guild leadership, mechanics, street docs
- **Opposed To**: Corpo exploitation, predatory contracts
- **Romantic Interest**: N/A
- **Past Connections**: Knows many high-tier couriers from old days

## Story Role
- **Narrative Function**: Tutorial Guide / Mentor / Moral Compass
- **Arc Summary**: Teaches you the ropes, warns about costs of chrome, represents the "retire before you hollow out" path
- **Key Story Beats**:
  - Tier 0: Gives first missions
  - Tier 3: Concerned about your cochlear implant
  - Tier 6: Warns against cortical stack ("That's how you lose yourself, kid")
  - Tier 9: Reaction to your final path choice
- **Possible Outcomes**: Always survives (safe NPC)

## Dialogue Trees
- **Greeting Variants**:
  - First meeting: "You got the look. Desperate, hungry. Good. You'll need that."
  - Friendly (Relationship > 40): "There's the kid. How's the road treating you?"
  - Neutral: "Back already? Good turnaround time."
  - Concerned (Humanity < 60): "You okay, kid? You seem... different."
  - Late Game (Tier 8+): "Never thought you'd make it this far. Hell of a thing."

- **Topic Hubs**:
  - **Ask about work**: Explains dispatcher role, courier life
  - **Ask about past**: Deflects early, opens up at high relationship
  - **Ask about daughter**: [Locked until Relationship > 60, Tier 5+]
  - **Ask for advice**: Different advice based on player's humanity/tier
  - **Courier rumors**: Source of gossip, street news

- **Quest Integration**:
  - Tier 0-2: Primary quest giver
  - Tier 3+: Optional side quests, mentor check-ins

- **Relationship Stages**:
  - 0-20: Professional distance
  - 21-50: Warming up, protective
  - 51-80: Mentor, shares personal stories
  - 81-100: Father figure, deeply concerned for your fate

## Conditional Dialogue

**Humanity Thresholds**:
- **80+**: Approving, hopeful for you
- **60-79**: Concerned questions about chrome
- **40-59**: Direct warnings: "You're losing yourself, kid."
- **<40**: Sadness, resignation: "I've seen this before. It doesn't end well."

**Tier Gates**:
- **Tier 0-2**: Encouragement, basic advice
- **Tier 3-5**: More responsibility, bigger missions
- **Tier 6-8**: Awe mixed with worry
- **Tier 9-10**: Pride and grief: "You made it. Hope it was worth the price."

**Story Flag Requirements**:
- **KILLED_FIRST_PERSON**: Dialogue about taking a life
- **TIER_6_SPEC_CHOSEN**: Comments on your specialization
- **MET_ROGUE_NETWORK**: Subtle nod of approval (he has contacts)

**Faction Rep Requirements**: None (neutral NPC)

## Voice Acting Notes
- **Voice Type**: Baritone, aged
- **Accent**: Slight Mandarin influence, mostly neutral urban
- **Emotion Range**: Tired patience to genuine concern
- **Line Count Estimate**: 150-200 lines

## Sample Dialogue

**First Meeting** (Node 1: NPC_LINE):
Chen: "You got the look. Desperate, hungry, like you'd run through fire for a hundred credits. Good. You'll need that out there."

Player Hub (Node 2):
- "I just need work." [NEUTRAL] → Node 3
- "I'm not desperate." [DEFENSIVE] → Node 4
- "Tell me about the job." [PROFESSIONAL] → Node 5

**Tier 6 Warning** (Cortical Stack Quest):
Chen: "A cortical stack. That's the big one, kid." [pause] "You ever wonder who wakes up after that surgery? 'Cause it might not be you."

Player Hub:
- "I'll still be me." [CONFIDENT] → Chen: "That's what my daughter said." [RELATIONSHIP +10, UNLOCKS DAUGHTER TOPIC]
- "I don't have a choice." [RESIGNED] → Chen: "There's always a choice. Just not always good ones." [RELATIONSHIP +5]
- "It's just tech." [DISMISSIVE] → Chen: "Yeah. That's what they all say." [RELATIONSHIP -5]

**Post-Tier 9 Epilogue**:
IF ASCENDED:
Chen: "I hope... wherever you are now... I hope it's peaceful. I hope you're happy. I'll miss you, kid."

IF ROGUE:
Chen: "Heard you went dark. Can't say I'm surprised. Stay safe out there. You'll always have a place here if you need it."

IF THIRD PATH:
Chen: "They say you found another way. I don't know what that means, but... you always were different. In a good way."
```

---

## Getting Started: First Tasks

### Immediate Priority: Core 10 NPCs

1. **Dispatcher Chen** (Tier 0, Tutorial Guide)
2. **Dr. Yuki Tanaka** (Tier 1-3, Medical Contact)
3. **Fixer Delilah** (Tier 2-5, Gray Market Contact)
4. **Union Organizer Lopez** (Tier 3-7, Union Arc)
5. **Rogue AI Echo** (Tier 4-8, Network Arc)
6. **Okonkwo** (Tier 7, Interstitial Guide)
7. **Solomon Saint-Germain** (Tier 9, Third Path)
8. **Synthesis** (Tier 10, Ascended Representative)
9. **Romance Option: Mechanic Rosa** (Tier 0-10, Romance Arc)
10. **The Algorithm** (Voice only, Tier 3-10)

### Immediate Priority: Core Quest Chain

1. **Tier 0**: Tutorial - First Run
2. **Tier 3**: The Whisper - Cochlear Implant
3. **Tier 6**: Chrome and Choice - Cortical Stack
4. **Tier 9**: The Convergence - Final Choice
5. **Tier 10**: Epilogue - Path Resolution

### Immediate Priority: Algorithm Voice

1. Humanity 100-80 lines (20 lines)
2. Humanity 79-60 lines (30 lines)
3. Humanity 59-40 lines (40 lines)
4. Humanity 39-20 lines (50 lines)
5. Final Choice Dialogue (10 lines)

---

## Questions for Narrative Team

Before beginning content creation, please answer:

1. **Voice Acting Budget**: How many lines can we afford? Prioritize?
2. **Branching Scope**: How many true divergent paths can we support technically?
3. **Localization**: Which languages? Does this affect writing style?
4. **Content Rating**: ESRB target? How explicit can we be with violence/themes?
5. **Length Target**: How many hours of gameplay? Affects content volume.
6. **Player Character Voice**: Silent protagonist or voiced? Affects dialogue structure.
7. **Combat Barks**: How much combat? Affects bark volume needs.
8. **Modding Support**: Will dialogue be moddable? Affects file structure.

---

## Conclusion

This directory structure provides a **complete framework** for creating all narrative content for Surge Protocol independently of code implementation. Writers can work in parallel with developers, using clear templates and integration points.

**The goal**: Rich, coherent, reactive storytelling that explores the game's core themes of identity, augmentation, and agency within a dystopian gig economy.

**Remember**: Every piece of dialogue, every quest, every character should ask: *What are you willing to trade for survival? And what remains of you when the trade is done?*

---

**Status**: Directory structure defined, ready for content population
**Next Steps**:
1. Populate character files (start with core 10)
2. Write Tier 0-3-6-9-10 main quest chain
3. Develop Algorithm voice progression
4. Create dialogue tree examples for templating

**Content Lead**: [Assign]
**Target Completion**: Phase 1 by [Date]
