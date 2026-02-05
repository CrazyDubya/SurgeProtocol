# Flag Cross-Reference Matrix

## Purpose
This document provides a complete mapping of story flags to their usage across all narrative content. Each flag is documented with its setters (what creates/modifies it) and checkers (what reads it).

---

## Relationship Flags Matrix

### CHEN_RELATIONSHIP

| Set By | Check By |
|--------|----------|
| Tier 0 dialogue choices | chen_friendship_arc.md thresholds |
| Tier 1-3 side interactions | hollows_market_mystery.md (>= 10) |
| chen_friendship_arc.md progression | Rosa quest union ally check |
| Help with Mei-Lin situation | Tier 10 epilogue variants |

**Dependencies**: None (core NPC)
**Mutually Exclusive**: None

---

### ROSA_RELATIONSHIP

| Set By | Check By |
|--------|----------|
| Early game shop interactions | rosa_miguel_rescue.md (>= 40) |
| rosa_miguel_rescue.md outcomes | ROSA_ROMANCE_ACTIVE threshold |
| Romance progression choices | Tier 9 ultimatum trigger |
| Tier 10 ending choices | Rogue epilogue with Rosa |

**Dependencies**: MET_ROSA
**Mutually Exclusive**: ROSA_DEAD blocks romance

---

### JIN_RELATIONSHIP

| Set By | Check By |
|--------|----------|
| First meeting response | jin_rival_arc.md stage progression |
| Race outcome | JIN_ALLY_STATUS threshold (>= 50) |
| Cooperation decisions | JIN_ENEMY_STATUS threshold (<= -50) |
| Rescue mission participation | Tier 10 companion eligibility |

**Dependencies**: None
**Mutually Exclusive**: JIN_ALLY_STATUS and JIN_ENEMY_STATUS

---

### LOPEZ_RELATIONSHIP

| Set By | Check By |
|--------|----------|
| Union hall first meeting | lopez_union_arc.md progression |
| Slowdown participation | Strike quest availability |
| Union mission outcomes | MUTUAL_AID_ACCESS threshold |
| Strike resolution | Tier 10 union support |

**Dependencies**: None
**Mutually Exclusive**: None

---

### YAMADA_RELATIONSHIP

| Set By | Check By |
|--------|----------|
| Corporate encounters | yamada_antagonist_arc.md stages |
| Philosophy discussions | Yamada Protocols quest (>= -25) |
| Daughter revelation response | YAMADA_ALLY_STATUS threshold |
| Truth quest outcome | Tier 10 Yamada involvement |

**Dependencies**: TIER >= 3
**Mutually Exclusive**: YAMADA_ALLY_STATUS and YAMADA_ENEMY_STATUS

---

### TANAKA_RELATIONSHIP

| Set By | Check By |
|--------|----------|
| Clinic visits | tanakas_research.md (>= 20) |
| Research assistance | tanaka_colleague_arc.md progression |
| Chrome surgery choices | chrome_saints_initiation.md option D |
| Humane path completion | Tier 10 research status |

**Dependencies**: None
**Mutually Exclusive**: None

---

### OKONKWO_RELATIONSHIP

| Set By | Check By |
|--------|----------|
| Tier 5 first meeting | okonkwo_spiritual_arc.md progression |
| Test completions | EIGHTH_CANDIDATE threshold |
| Third Path guidance | Third Path ending availability |
| Tier 10 blessing | OKONKWO_BLESSING |

**Dependencies**: DISCOVERED_INTERSTITIAL
**Mutually Exclusive**: None

---

## Story Progress Flags Matrix

### ALGORITHM_INTEGRATED

| Set By | Check By |
|--------|----------|
| Tier 3 cochlear implant choice | Algorithm voice activation |
| ALGORITHM_INTEGRATION_METHOD outcome | Shadow emergence eligibility |
| | rosa_miguel_rescue.md dialogue variant |
| | All Algorithm-dependent content |
| | Ascension ending path |

**Dependencies**: TIER_3_COMPLETE
**Mutually Exclusive**: ALGORITHM_REFUSED

---

### CORTICAL_STACK_INSTALLED (FORKED)

| Set By | Check By |
|--------|----------|
| Tier 6 Fork decision | Shadow/Prime dynamics |
| FORK_METHOD outcome | chen_friendship_arc.md (PLAYER_HAS_STACK) |
| | Fork crisis content |
| | Third Path enhanced ending |

**Dependencies**: TIER_6_COMPLETE
**Mutually Exclusive**: None (can refuse without blocking)

---

### DISCOVERED_INTERSTITIAL

| Set By | Check By |
|--------|----------|
| Tier 5 quest completion | okonkwo_spiritual_arc.md access |
| Environmental exploration | Third Path content availability |
| NPC hints followed | Solomon meeting eligibility |

**Dependencies**: TIER_5_COMPLETE
**Mutually Exclusive**: None

---

## Quest-Specific Flags Matrix

### MIGUEL_RESCUED / MIGUEL_DIED / MIGUEL_INJURED

| Set By | Check By |
|--------|----------|
| rosa_miguel_rescue.md outcomes | Rosa romance progression |
| Combat/stealth results | Epilogue variants |
| Rosa's intervention | Rosa's fate determination |

**Dependencies**: rosa_miguel_rescue.md started
**Mutually Exclusive**: Only one of the three can be true

---

### VORONOV_QUEST_COMPLETE

| Set By | Check By |
|--------|----------|
| Voronov Legacy quest resolution | Algorithm Override availability |
| Player choice at quest end | Tanaka research enhancement |
| | Secret ending variant |

**Dependencies**: VORONOV_GRAFFITI_COUNT >= 3, TIER >= 6
**Mutually Exclusive**: Quest outcome flags (code taken/destroyed/given)

---

### STRIKE_OUTCOME

| Set By | Check By |
|--------|----------|
| lopez_union_arc.md "The Living Wage" quest | Union faction strength |
| Player support level | Nakamura response intensity |
| Combat/negotiation outcome | Worker NPC dialogue changes |

**Dependencies**: LOPEZ_RELATIONSHIP >= 50
**Mutually Exclusive**: "victory" / "negotiated" / "broken"

---

## Ending Requirement Matrix

### Ascension Ending

| Required Flags | Status |
|----------------|--------|
| ALGORITHM_INTEGRATED | true |
| CHOSE_ASCENSION | true |
| TIER_9_COMPLETE | true |
| UPLOAD_CONSENT_GIVEN | true |

| Modifier Flags | Effect |
|----------------|--------|
| ALGORITHM_TRUST >= 75 | Transcendence variant |
| ALGORITHM_TRUST 25-74 | Ambiguity variant |
| ALGORITHM_TRUST < 25 | Horror variant |
| ROSA_ROMANCE_ACTIVE | Rosa goodbye scene |

---

### Rogue Ending

| Required Flags | Status |
|----------------|--------|
| CHOSE_ROGUE | true |
| TIER_9_COMPLETE | true |

| Modifier Flags | Effect |
|----------------|--------|
| ROSA_ROMANCE_ACTIVE + ROSA_CHOSEN | With Rosa variant |
| JIN_ALLY_STATUS | Jin companion option |
| GHOST_NETWORK_ACCESS | Network support variant |
| High corporate hostility | Hunted variant |

---

### Third Path Ending

| Required Flags | Status |
|----------------|--------|
| CHOSE_THIRD_PATH | true |
| ALGORITHM_INTEGRATED | true |
| MET_SOLOMON | true |
| DISCOVERED_INTERSTITIAL | true |
| HUMANITY_SCORE >= 20 | true |

| Modifier Flags | Effect |
|----------------|--------|
| HUMANITY_SCORE == 50 | Perfect Balance variant |
| EIGHTH_ATTAINED | True Eighth variant |
| FORKED | Enhanced complexity |
| OKONKWO_BLESSING | Blessing epilogue |

---

## Orphaned Flag Check

### Flags Set But Never Checked
*(These need content that reads them or should be removed)*

- `SPEEDRUN_TIER_[NUMBER]` - Achievement only, no story impact
- `FOUND_EASTER_EGG_[NUMBER]` - Achievement only
- `PERFECT_DELIVERY_STREAK` - Minor reputation impact only

### Flags Checked But Never Set
*(These need setters added)*

- `INVESTIGATION_SKILL` - Needs skill system integration
- `PLAYER_CHROME_LEVEL` - Needs calculation from augment flags

---

## Dependency Chains

### Third Path Full Unlock Chain
```
TIER_5_COMPLETE
    → DISCOVERED_INTERSTITIAL
        → MET_OKONKWO
            → OKONKWO_STUDENT (via tests)
                → EIGHTH_CANDIDATE
                    → OKONKWO_BLESSING
                        → Third Path best ending
```

### Rosa Romance Full Chain
```
MET_ROSA
    → ROSA_RELATIONSHIP >= 25 (friendship)
        → ROSA_RELATIONSHIP >= 50 (deep friendship)
            → ROSA_ROMANCE_ACTIVE
                → ROSA_ROMANCE_STAGE 1-5
                    → ROSA_ULTIMATUM_GIVEN (Tier 9)
                        → ROSA_CHOSEN (if Rogue)
                            → Rogue with Rosa ending
```

### Yamada Redemption Chain
```
First corporate encounter
    → YAMADA_RELATIONSHIP starts at -50
        → YAMADA_DAUGHTER_MENTIONED (personal touch)
            → YAMADA_RELATIONSHIP >= -25 (reluctant respect)
                → Yamada Protocols quest available
                    → YAMADA_TRUTH_REVEALED
                        → YAMADA_ALLY_STATUS
                            → YAMADA_DAUGHTER_REUNITED (Third Path)
```

---

## Implementation Notes

### Flag Persistence
- All flags persist in save game
- Relationship integers update in real-time
- Boolean flags should never revert to false once true (except via specific story events)

### Flag Debugging
- Implement `/flags` debug command showing all current values
- Implement `/setflag [name] [value]` for testing
- Create flag change log for QA

### Performance Considerations
- Cache frequently-checked flags (TIER, HUMANITY_SCORE)
- Batch relationship updates at dialogue end
- Lazy-load quest-specific flags until quest starts

---

*Matrix last updated: Phase 5 Session 1*
*Total flags tracked: ~250*
*Cross-references verified: Session 1*
