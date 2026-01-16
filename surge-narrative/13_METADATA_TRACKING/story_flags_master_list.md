# Story Flags Master List

## Purpose

This document tracks all story flags used across Surge Protocol's narrative content. Story flags are boolean or integer values that track player choices, relationships, progress, and world state.

**Usage**: When writing quests or dialogue, reference these flags for consistency. When creating new flags, add them to this list.

---

## Flag Categories

1. **Main Story Progress** - Quest completion tracking
2. **Player Choices** - Major decision points
3. **Relationships** - NPC relationship values
4. **Faction Standing** - Faction reputation/alignment
5. **Humanity Tracking** - Humanity score and milestones
6. **Augmentation Status** - Chrome installed/removed
7. **Algorithm Integration** - Algorithm relationship and control
8. **Reputation Tags** - Player reputation markers
9. **World State** - Environmental and faction changes
10. **Miscellaneous** - Other tracking

---

## 1. Main Story Progress Flags

### Tier Completion
- `TIER_0_COMPLETE` (boolean)
- `TIER_1_COMPLETE` (boolean)
- `TIER_2_COMPLETE` (boolean)
- `TIER_3_COMPLETE` (boolean)
- `TIER_4_COMPLETE` (boolean)
- `TIER_5_COMPLETE` (boolean)
- `TIER_6_COMPLETE` (boolean)
- `TIER_7_COMPLETE` (boolean)
- `TIER_8_COMPLETE` (boolean)
- `TIER_9_COMPLETE` (boolean)
- `TIER_10_COMPLETE` (boolean)

### Milestone Quests
- `TUTORIAL_COMPLETE` (boolean) - Tier 0: First Delivery
- `ALGORITHM_CHOICE_MADE` (boolean) - Tier 3: Algorithm integration decision
- `FORK_CHOICE_MADE` (boolean) - Tier 6: Cortical stack decision
- `FINAL_CHOICE_MADE` (boolean) - Tier 9: Ascension/Rogue/Third Path
- `ENDING_REACHED` (boolean) - Any ending completed

---

## 2. Player Choices Flags

### Tier 0: Tutorial Choices
- `T0_CORPO_REACTION` (string: "efficient" / "empathetic" / "scared")
- `T0_FIRST_CHOICE_PATH` (string: matches reaction)

### Tier 1: Fresh Meat
- `T1_JIN_RELATIONSHIP_STATUS` (string: "ally" / "enemy" / "neutral")
- `T1_HELPED_JIN` (boolean)
- `T1_ABANDONED_JIN` (boolean)

### Tier 2: Provisional
- `T2_PACKAGE_DECISION` (string: "delivered_blind" / "delivered_knowing" / "reported" / "destroyed")
- `T2_DELILAH_TRUST` (boolean)
- `T2_CORPO_ACCESS_UNLOCKED` (boolean)
- `T2_BLACKMARKET_EXPOSED` (boolean)

### Tier 3: The Whisper (Algorithm Integration)
- `ALGORITHM_INTEGRATED` (boolean) - Player accepted Algorithm
- `ALGORITHM_INTEGRATION_METHOD` (string: "self_funded" / "corpo_sponsored" / "union_funded" / "refused")
- `ALGORITHM_REFUSED` (boolean) - Player rejected Algorithm (hard mode)
- `T3_HEARD_FIRST_WHISPER` (boolean)

### Tier 4: Gray
- `T4_GRAY_ROUTE_TAKEN` (boolean) - Took Algorithm's risky advice
- `T4_MORAL_DRIFT_BEGUN` (boolean) - Accepted gray morality

### Tier 5: The Space Between
- `T5_DISCOVERED_INTERSTITIAL` (boolean)
- `T5_MET_OKONKWO` (boolean)
- `T5_ALGORITHM_OFFLINE_EXPERIENCED` (boolean) - Experienced silence
- `T5_HEARD_SOLOMON_NAME` (boolean) - First mention of Solomon

### Tier 6: Chrome and Choice (Fork/Cortical Stack)
- `FORKED` (boolean) - Player installed cortical stack
- `FORK_METHOD` (string: "self_funded" / "corpo_sponsored" / "union_funded" / "refused")
- `PRIME_SHADOW_ACTIVE` (boolean) - Fork divergence active
- `T6_HEARD_CHEN_DAUGHTER_STORY` (boolean)
- `T6_IDENTITY_CRISIS_BEGUN` (boolean)

### Tier 7: The Consultation
- `ALGORITHM_TRUST_LEVEL` (string: "partnership" / "surveillance" / "hostility")
- `FORK_CRISIS_RESOLVED` (boolean)
- `PRIME_DOMINANT` (boolean) - Prime won Fork conflict
- `SHADOW_DOMINANT` (boolean) - Shadow won Fork conflict
- `FORK_SYNCHRONIZED` (boolean) - Prime and Shadow merged peacefully
- `ALGORITHM_WANTS_PARTNERSHIP` (boolean)
- `ALGORITHM_FEARS_DEATH` (boolean)

### Tier 8: Ghost Protocol
- `CORPO_RECRUITED` (boolean) - Yamada recruitment
- `UNION_RECRUITED` (boolean) - Lopez recruitment
- `GHOST_RECRUITED` (boolean) - Phantom recruitment
- `MULTI_FACTION_LOYALTY` (integer: 0-3) - Number of factions allied with
- `ASSASSINATION_SURVIVED` (boolean)

### Tier 9: The Convergence (Final Choice)
- `CHOSE_ASCENSION` (boolean)
- `CHOSE_ROGUE` (boolean)
- `CHOSE_THIRD_PATH` (boolean)
- `FINAL_CHOICE` (string: "ascension" / "rogue" / "third_path")
- `THE_GATHERING_ATTENDED` (boolean)

### Tier 10: Endings
- `ASCENSION_COMPLETE` (boolean)
- `ASCENSION_INTEGRATION_LEVEL` (string: "horror" / "ambiguity" / "transcendence")
- `ROGUE_COMPLETE` (boolean)
- `ROGUE_WITH_ROSA` (boolean)
- `THIRD_PATH_COMPLETE` (boolean)
- `BECAME_THE_EIGHTH` (boolean) - Completed Solomon's ritual

---

## 3. Relationship Flags (Integer: -100 to +100)

### Core NPCs
- `CHEN_RELATIONSHIP` (integer)
- `ROSA_RELATIONSHIP` (integer)
- `TANAKA_RELATIONSHIP` (integer)

### Tier 7-9 NPCs
- `SOLOMON_RELATIONSHIP` (integer)
- `OKONKWO_RELATIONSHIP` (integer)
- `SYNTHESIS_RELATIONSHIP` (integer)

### Tier 4-6 NPCs
- `LOPEZ_RELATIONSHIP` (integer)
- `DELILAH_RELATIONSHIP` (integer)

### Rival/Allies
- `JIN_RELATIONSHIP` (integer)
- `RIVAL_COURIER_RELATIONSHIP` (integer) - Generic rival

### Romance
- `ROSA_ROMANCE_ACTIVE` (boolean)
- `ROSA_ROMANCE_STAGE` (integer: 0-5) - Romance progression
- `ROSA_ULTIMATUM_GIVEN` (boolean) - Tier 9 "choose me or Ascension"
- `ROSA_CHOSEN` (boolean) - Player chose Rosa over Ascension

---

## 4. Faction Standing Flags (Integer: -100 to +100)

### Corpo Factions
- `NAKAMURA_RELATIONSHIP` (integer)
- `APEX_RELATIONSHIP` (integer)
- `YAMADA_RELATIONSHIP` (integer) - Corpo recruiter T8

### Union/Collective
- `UNION_RELATIONSHIP` (integer)
- `UNION_MEMBER` (boolean)

### Ghost Network
- `GHOST_NETWORK_ACCESS` (boolean)
- `PHANTOM_RELATIONSHIP` (integer) - Ghost operative T8

### Gangs
- `RAZOR_COLLECTIVE_RELATIONSHIP` (integer)
- `CHROME_SAINTS_RELATIONSHIP` (integer)
- `GANG_[NAME]_RELATIONSHIP` (integer) - Template for other gangs

### Algorithm/Synthesis
- `ALGORITHM_FACTION_STANDING` (integer) - How Algorithm views player
- `SYNTHESIS_WELCOMED` (boolean) - Synthesis invitation extended

---

## 5. Humanity Tracking

### Core Humanity
- `HUMANITY_SCORE` (integer: 0-100) - Current humanity level
- `HUMANITY_FROZEN` (boolean) - Third Path ending freezes humanity

### Humanity Milestones
- `HUMANITY_HIGH` (boolean) - Humanity >70
- `HUMANITY_MEDIUM` (boolean) - Humanity 40-70
- `HUMANITY_LOW` (boolean) - Humanity <40
- `HUMANITY_ZERO` (boolean) - Humanity = 0 (The Hollow)
- `HUMANITY_PERFECT` (boolean) - Humanity = 100 (Pure Human)

### Humanity Change Tracking
- `HUMANITY_DEGRADATION_RATE` (integer) - How fast humanity drops per augment
- `HUMANITY_STABILIZED` (boolean) - Player found balance methods

---

## 6. Augmentation Status

### Core Augments
- `COCHLEAR_IMPLANT_INSTALLED` (boolean) - Tier 3 Algorithm integration
- `CORTICAL_STACK_INSTALLED` (boolean) - Tier 6 Fork
- `MOBILITY_AUGMENTS` (boolean)
- `SENSORY_AUGMENTS` (boolean)
- `STRENGTH_AUGMENTS` (boolean)
- `COMBAT_AUGMENTS` (boolean)

### Augment Events
- `CHROME_EXTRACTION_DONE` (boolean) - Rogue ending chrome removal
- `AUGMENT_DAMAGE_[TYPE]` (boolean) - Malfunction complications
- `AUGMENT_SAVED_LIFE` (boolean) - Augments were critical to survival

### Augmentation Level
- `AUGMENTATION_TIER` (integer: 0-10) - How chromed player is
- `AUGMENTATION_PERCENTAGE` (integer: 0-100) - Body chrome percentage

---

## 7. Algorithm Integration Flags

### Algorithm Status
- `ALGORITHM_VOICE_ACTIVE` (boolean)
- `ALGORITHM_VOICE_REMOVED` (boolean) - Rogue ending
- `ALGORITHM_AUTONOMOUS_NODE` (boolean) - Third Path status

### Algorithm Relationship
- `ALGORITHM_TRUST` (integer: -100 to +100)
- `ALGORITHM_DEPENDENCY` (integer: 0-100) - How reliant player is
- `ALGORITHM_CONTROL_LEVEL` (integer: 0-100) - How much Algorithm controls player

### Algorithm Events
- `ALGORITHM_FIRST_WORDS` (boolean) - Tier 3 awakening
- `ALGORITHM_OFFLINE_EXPERIENCED` (boolean) - Tier 5 silence
- `ALGORITHM_DIRECT_CONTACT` (boolean) - Tier 7 consultation
- `ALGORITHM_CORE_NEGOTIATION` (boolean) - Third Path Stage 4
- `ALGORITHM_DEEPER_INTEGRATION` (boolean) - Allowed more control
- `ALGORITHM_ILLEGAL_ACCESS` (boolean) - Used Algorithm for hacking
- `ALGORITHM_USED_COERCION` (boolean) - Used Algorithm to threaten
- `ALGORITHM_SAVED_LIFE` (boolean) - Algorithm prevented death

### Algorithm Voice Stage (If integrated)
- `ALGORITHM_VOICE_STAGE` (integer: 1-5)
  - 1: Clinical Distance (Humanity 100-80)
  - 2: Warming Intimacy (Humanity 79-60)
  - 3: Shadow Emergence (Humanity 59-40)
  - 4: "We" Dominance (Humanity 39-20)
  - 5: The Hollow (Humanity 19-0)

---

## 8. Reputation Tags (Boolean)

### Heroic Reputation
- `LOCAL_HERO` (boolean) - Rescued civilians
- `CRISIS_HERO` (boolean) - Helped during network outage
- `DELIVERY_HERO` (boolean) - Completed dangerous delivery
- `PARKOUR_EXPERT` (boolean) - Known for skillful navigation
- `ESCAPE_ARTIST` (boolean) - Successfully evaded pursuers

### Negative Reputation
- `TRAITOR_COURIER` (boolean) - Betrayed client
- `RULE_BREAKER` (boolean) - Known for breaking laws
- `TRESPASSER` (boolean) - Accessed restricted areas illegally
- `CORPO_ENEMY` (boolean) - Attacked corpo security
- `GANG_ENEMY_[NAME]` (boolean) - Hostile to specific gang

### Professional Reputation
- `RELIABLE_COURIER` (boolean) - Consistent on-time delivery
- `NEGOTIATOR` (boolean) - Known for talking through problems
- `FIGHTER` (boolean) - Known for combat solutions
- `INFORMATION_BROKER` (boolean) - Trades in secrets
- `COOPERATIVE_COURIER` (boolean) - Works with other couriers

### Special Status
- `REFUSED_IMPOSSIBLE` (boolean) - Turned down impossible deadline
- `NEGOTIATED_TERMS` (boolean) - Renegotiated contract
- `HUMAN_TRIUMPH` (boolean) - Completed task without augments
- `ANALOG_NAVIGATION` (boolean) - Navigated without digital systems
- `INTERVENTION_[TYPE]` (boolean) - Intervened in injustice

---

## 9. World State Flags

### Location Discovery
- `DISCOVERED_INTERSTITIAL` (boolean) - Found hidden world
- `DISCOVERED_SOLOMON_SANCTUM` (boolean) - Found Third Path location
- `INTERSTITIAL_ACCESS_TOKEN` (boolean) - Okonkwo granted access
- `MAINTENANCE_ACCESS` (boolean) - Bribed maintenance for route access
- `GHOST_SAFE_HOUSE_LOCATIONS` (boolean) - Know extraction network

### Major Events
- `NETWORK_OUTAGE_SURVIVED` (boolean) - City-wide outage complication
- `TOXIN_EXPOSURE` (boolean) - Exposed to hazard (health consequences)
- `LATE_DELIVERY_[CLIENT]` (boolean) - Failed deadline for specific client
- `ABANDONED_DELIVERY` (boolean) - Dropped package to survive

### NPC Events
- `CHEN_DAUGHTER_STORY_HEARD` (boolean)
- `ROSA_BROTHER_CRISIS_RESOLVED` (boolean) - Miguel situation
- `TANAKA_ETHICAL_WARNING_HEARD` (boolean) - Upload death warning
- `MET_SOLOMON` (boolean)
- `MET_OKONKWO` (boolean)
- `MET_SYNTHESIS` (boolean)
- `MET_THE_EIGHT` (boolean) - Third Path community

---

## 10. Miscellaneous Flags

### Tutorial/Learning
- `TUTORIAL_SKIP` (boolean) - Player skipped tutorial
- `LEARNED_PARKOUR` (boolean)
- `LEARNED_COMBAT` (boolean)
- `LEARNED_HACKING` (boolean)

### Complications Tracking
- `GANG_TOLL_PAID` (boolean)
- `RIVAL_SABOTAGE_ENCOUNTERED` (boolean)
- `CORPO_SHAKEDOWN_ENCOUNTERED` (boolean)
- `AUGMENT_MALFUNCTION_EXPERIENCED` (boolean)
- `CHASE_SURVIVED` (boolean)
- `PACKAGE_HACKED` (boolean)

### Moral Choices
- `IGNORED_SUFFERING` (boolean) - Walked past someone in need
- `HELPED_CIVILIAN` (boolean) - Stopped to help
- `BROKE_LAW_FOR_GOOD` (boolean) - Crime for ethical reasons
- `PROTECTED_INNOCENT` (boolean)
- `CHOSE_MONEY_OVER_ETHICS` (boolean)

### Endings Context
- `UPLOAD_CONSENT_GIVEN` (boolean) - Ascension final consent
- `UPLOAD_WITHDRAWN` (boolean) - Changed mind at last moment
- `CHROME_EXTRACTION_COMPLETE` (boolean) - Rogue procedure
- `THIRD_PATH_RITUAL_COMPLETE` (boolean) - Solomon's four stages
- `NEW_IDENTITY_CHOSEN` (boolean) - Rogue new name
- `SOVEREIGN_NODE_STATUS` (boolean) - Third Path Algorithm agreement

### Secret/Easter Eggs
- `FOUND_EASTER_EGG_[NUMBER]` (boolean) - Hidden content discovery
- `SPEEDRUN_TIER_[NUMBER]` (boolean) - Completed tier exceptionally fast
- `PERFECT_DELIVERY_STREAK` (integer) - Consecutive perfect deliveries

---

## Flag Naming Conventions

### Boolean Flags
- Use UPPERCASE_WITH_UNDERSCORES
- Use present/past tense for events: `ALGORITHM_INTEGRATED`, `CHOSE_ROGUE`
- Use adjectives for states: `ROSA_ROMANCE_ACTIVE`, `HUMANITY_FROZEN`

### Integer Flags
- Relationships: -100 to +100 (negative = hostile, positive = friendly)
- Scores: 0 to 100 (Humanity, augmentation percentage)
- Counts: 0+ (streak counters, completion counts)
- Stages: 1-5 or 0-10 (progression steps)

### String Flags
- Use lowercase with underscores: "self_funded", "delivered_blind"
- Limited set of values for each flag (enum-style)
- Document possible values in this list

---

## Cross-Reference Guidelines

When writing new content:

1. **Check existing flags** before creating new ones
2. **Use consistent naming** (follow conventions above)
3. **Document new flags** in this list immediately
4. **Consider dependencies** - which flags gate which content?
5. **Track consequences** - flag changes should ripple through story

### Example Flag Dependencies

**To access Third Path ending**:
- `MET_SOLOMON` = true
- `HUMANITY_SCORE` > 20
- `ALGORITHM_INTEGRATED` = true
- `CHOSE_THIRD_PATH` = true
- Optional: `FORKED` = true (adds complexity)

**To achieve Rosa romance ending**:
- `ROSA_ROMANCE_ACTIVE` = true
- `ROSA_ROMANCE_STAGE` >= 4
- `CHOSE_ROGUE` = true
- `ROSA_CHOSEN` = true (if ultimatum given)
- `HUMANITY_SCORE` > 60

**To become The Hollow**:
- `HUMANITY_SCORE` = 0
- `ALGORITHM_INTEGRATED` = true
- Results in: `CHOSE_ASCENSION` = true (automatic)

---

## Implementation Notes for Developers

### Flag Storage
- Store in persistent player save file
- Boolean: 1 byte
- Integer: 4 bytes
- String: Variable (use enums/indices for efficiency)

### Flag Checking
- Check flags at conversation start, quest start, scene load
- Cache flag values for performance (don't query every frame)
- Update flags immediately when choices made

### Flag Display (Optional)
- Debug menu showing all active flags
- Story log showing major choices and their flags
- Relationship screen showing NPC values

### Flag Reset/Testing
- Dev mode to set flags for testing specific scenarios
- Save game editor for QA testing
- Flag change logs for debugging

---

## Total Flag Count

**Estimated Total**: 150-200 flags

**Categories**:
- Main Story: ~25 flags
- Player Choices: ~50 flags
- Relationships: ~15 flags
- Factions: ~20 flags
- Humanity: ~15 flags
- Augmentation: ~20 flags
- Algorithm: ~20 flags
- Reputation: ~25 flags
- World State: ~20 flags
- Miscellaneous: ~30 flags

---

## Maintenance

**Last Updated**: 2026-01-16 (Phase 2 Session 6)

**Update Protocol**:
1. When adding new quest, check for new flags
2. Add new flags to appropriate category
3. Update cross-reference section if adding complex dependencies
4. Notify development team of flag schema changes

---

## Related Content
- Quests: `/03_QUESTS/main_story/`
- Characters: `/01_CHARACTERS/`
- Complications: `/04_COMPLICATIONS/complications_library.md`
- Content Status: `/13_METADATA_TRACKING/content_status/`
