# Flag Updates: Phase 4 Additions

## Overview
This document tracks new flags introduced in Phase 4 content that must be added to the master flag list.

---

## New Relationship Flags

### Jin "Quicksilver" Park Arc
**Checks:**
- `JIN_RELATIONSHIP` (integer: -100 to 100)
- `RACE_OUTCOME` (string: "player_won" / "jin_won" / "tie")
- `RESCUE_COMPLETED` (boolean)
- `COOPERATION_COUNT` (integer: 0+)

**Sets:**
- `JIN_ALLY_STATUS` (boolean)
- `JIN_ENEMY_STATUS` (boolean)
- `JIN_BACKSTORY_KNOWN` (boolean)
- `JIN_TIER_10_COMPANION` (boolean)

### Maria Lopez Union Arc
**Checks:**
- `LOPEZ_RELATIONSHIP` (integer: -100 to 100)
- `UNION_REPUTATION` (integer: -100 to 100)
- `STRIKE_SUPPORT_LEVEL` (integer: 0-100)
- `PLAYER_LABOR_ACTIONS` (integer: 0+)

**Sets:**
- `LOPEZ_ALLY_STATUS` (boolean)
- `MUTUAL_AID_ACCESS` (boolean)
- `STRIKE_OUTCOME` (string: "victory" / "negotiated" / "broken")
- `UNION_LEADERSHIP_OFFERED` (boolean)

### Director Yamada Arc
**Checks:**
- `YAMADA_RELATIONSHIP` (integer: -100 to 100) - already in master but extended range
- `YAMADA_DAUGHTER_MENTIONED` (boolean)
- `NAKAMURA_HOSTILITY_LEVEL` (integer: 0-100)
- `PLAYER_TIER` (integer: 0-10)

**Sets:**
- `YAMADA_ALLY_STATUS` (boolean)
- `YAMADA_ENEMY_STATUS` (boolean)
- `YAMADA_TRUTH_REVEALED` (boolean)
- `YAMADA_DAUGHTER_REUNITED` (boolean)
- `YAMADA_KILLED` (boolean)

### Chen Friendship Arc Expansion
**Checks:**
- `ASKED_ABOUT_DAUGHTER` (boolean)
- `CHEN_RELATIONSHIP` (integer) - already exists
- `PLAYER_HAS_STACK` (boolean)

**Sets:**
- `CHEN_STORY_TOLD` (boolean)
- `MET_SHADOW_MEI` (boolean)
- `PRIME_MEI_CONTACT` (boolean)
- `MEI_RESOLUTION` (string: "peace" / "conflict" / "gone")

### Tanaka Colleague Arc Expansion
**Checks:**
- `TANAKA_RELATIONSHIP` (integer) - already exists
- `PLAYER_CHROME_LEVEL` (integer: 0-100)
- `PLAYER_HUMANITY` (integer: 0-100) - maps to HUMANITY_SCORE
- `GHOST_NETWORK_ACCESS` (boolean) - already exists

**Sets:**
- `TANAKA_RESEARCH_KNOWN` (boolean)
- `PROMETHEUS_DATA_COMPLETE` (boolean)
- `PROMETHEUS_RESEARCH_ONLY` (boolean)
- `HUMANE_CHROME_PROTOTYPE` (boolean)
- `TANAKA_ALLY_TIER_10` (boolean)

### Okonkwo Spiritual Arc Expansion
**Checks:**
- `THIRD_PATH_HINTS` (integer: 0+)
- `INTERSTITIAL_FOUND` (boolean) - maps to DISCOVERED_INTERSTITIAL

**Sets:**
- `OKONKWO_STUDENT` (boolean)
- `TEST_1_PASSED` / `TEST_1_APPROACH` (boolean / string)
- `TEST_2_PASSED` / `TEST_2_APPROACH` (boolean / string)
- `TEST_3_PASSED` / `TEST_3_APPROACH` (boolean / string)
- `EIGHTH_CANDIDATE` (boolean)
- `OKONKWO_BLESSING` (boolean)

### Rosa Miguel Rescue Quest
**Checks:**
- `MET_ROSA` (boolean)
- `ROSA_RELATIONSHIP` (integer) - already exists
- `UNION_RELATIONSHIP` (integer) - already exists
- `ALGORITHM_INTEGRATED` (boolean) - already exists

**Sets:**
- `MIGUEL_RESCUED` (boolean)
- `MIGUEL_DIED` (boolean)
- `MIGUEL_INJURED` (boolean)
- `ROSA_GAMBIT` (boolean)
- `ROSA_REFUSED` (boolean)
- `ROSA_DEAD` (boolean)
- `MIGUEL_CLINIC_REVEAL` (boolean)
- `CHIP_DELIVERED` / `CHIP_SOLD` / `CHIP_GIVEN` / `CHIP_DESTROYED` (boolean)

---

## New Hidden Content Flags

### Voronov Legacy Quest
**Checks:**
- `VORONOV_GRAFFITI_COUNT` (integer: 0-3)
- `PLAYER_TIER` >= 6

**Sets:**
- `VORONOV_QUEST_STARTED` (boolean)
- `VORONOV_QUEST_COMPLETE` (boolean)
- `VORONOV_CODE_TAKEN` (boolean)
- `VORONOV_CODE_DESTROYED` (boolean)
- `VORONOV_CODE_TO_TANAKA` (boolean)
- `VORONOV_CODE_TO_GHOST` (boolean)
- `ALGORITHM_OVERRIDE_UNLOCKED` (boolean)

### The Eighth Tier Quest
**Checks:**
- `HUMANITY_SCORE` == 50
- `PLAYER_TIER` >= 8

**Sets:**
- `EIGHTH_QUEST_STARTED` (boolean)
- `EIGHTH_TRIAL_FLESH` (boolean)
- `EIGHTH_TRIAL_CHROME` (boolean)
- `EIGHTH_TRIAL_MIND` (boolean)
- `EIGHTH_ATTAINED` (boolean)
- `BALANCED_BEING_STATUS` (boolean)

### Mei-Lin's Message Quest
**Checks:**
- `CHEN_STORY_TOLD` (boolean)

**Sets:**
- `MEI_LIN_RECORDING_FOUND` (boolean)
- `MEI_LIN_RECORDING_DELIVERED` (boolean)

### The First Courier Quest
**Checks:**
- `INVESTIGATION_SKILL` >= threshold

**Sets:**
- `SARAH_VANCE_FOUND` (boolean)
- `FIRST_COURIER_QUEST_COMPLETE` (boolean)
- `SARAH_BUNKER_ACCESS` (boolean)

### Prometheus Thread Discovery
**Sets:**
- `PROMETHEUS_THREAD_1` (boolean) - Tanaka mentions
- `PROMETHEUS_THREAD_2` (boolean) - Environmental text
- `PROMETHEUS_THREAD_3` (boolean) - Voronov confirmation
- `PROMETHEUS_FULL_HISTORY` (boolean) - all three found

---

## New Combat/Bark Related Flags

### Ally Combat Triggers
**Checks:**
- `ROSA_ALLY_COMBAT` (boolean)
- `JIN_ALLY_COMBAT` (boolean)
- `LOPEZ_ALLY_COMBAT` (boolean)
- `CHEN_ALLY_COMBAT` (boolean) - rare
- `TANAKA_ALLY_COMBAT` (boolean) - rare

### Environmental Combat
**Checks:**
- `HAZARD_ELECTRICAL` (boolean)
- `HAZARD_CHEMICAL` (boolean)
- `HAZARD_STRUCTURAL` (boolean)
- `HAZARD_FIRE` (boolean)
- `HAZARD_HEIGHT` (boolean)

---

## Flag Category Summary

| Category | New Flags | Previously Existing |
|----------|-----------|---------------------|
| Jin Arc | 8 | 1 (JIN_RELATIONSHIP) |
| Lopez Arc | 8 | 2 (UNION_RELATIONSHIP, LOPEZ_RELATIONSHIP) |
| Yamada Arc | 7 | 2 (YAMADA_RELATIONSHIP, NAKAMURA_*) |
| Chen Arc Expansion | 5 | 1 (CHEN_RELATIONSHIP) |
| Tanaka Arc Expansion | 5 | 2 (TANAKA_RELATIONSHIP, GHOST_NETWORK_ACCESS) |
| Okonkwo Arc Expansion | 8 | 1 (OKONKWO_RELATIONSHIP) |
| Rosa Quest | 11 | 3 (ROSA_RELATIONSHIP, MET_ROSA, etc.) |
| Hidden Content | 22 | 0 |
| Combat/Barks | 10 | 0 |
| **TOTAL** | **84** | **12** |

---

## Integration Notes

### Flags That Need Master List Update
The story_flags_master_list.md needs to add:
1. All Jin arc flags
2. All Lopez arc flags
3. Extended Yamada flags
4. Chen expansion flags
5. Tanaka expansion flags
6. Okonkwo expansion flags
7. Rosa quest flags
8. All hidden content flags
9. Combat trigger flags

### Naming Consistency Issues Found
- `PLAYER_HUMANITY` vs `HUMANITY_SCORE` - should standardize to `HUMANITY_SCORE`
- `INTERSTITIAL_FOUND` vs `DISCOVERED_INTERSTITIAL` - standardize to `DISCOVERED_INTERSTITIAL`
- `PLAYER_HAS_STACK` vs `CORTICAL_STACK_INSTALLED` - standardize to `CORTICAL_STACK_INSTALLED`

### Cross-Reference Requirements
Every flag should list:
1. What sets it (quest, dialogue, action)
2. What checks it (content that requires this flag)
3. What it enables (doors it opens)
4. What it blocks (mutually exclusive flags)

---

## Next Steps
1. Update story_flags_master_list.md with all new flags
2. Create flag_cross_reference_matrix.md
3. Document flag dependencies for endings
4. Verify no orphaned flags (set but never checked)
5. Verify no missing flags (checked but never set)
