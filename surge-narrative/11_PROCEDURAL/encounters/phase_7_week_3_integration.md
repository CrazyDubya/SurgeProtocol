# Phase 7 Week 3 Integration Document

## Overview
Week 3 of Phase 7 completed the random encounter system with 45 unique encounters across positive, negative, and neutral categories. This document provides system integration, cross-references, and implementation guidance.

---

## WEEK 3 CONTENT SUMMARY

| Day | Content | Encounters | Words |
|-----|---------|------------|-------|
| Day 11 | Positive encounters | 15 | ~3,500 |
| Day 12 | Negative encounters | 15 | ~4,000 |
| Day 13 | Neutral encounters | 15 | ~4,000 |
| Days 14-15 | Integration | — | ~1,500 |
| **Total** | | **45** | **~13,000** |

---

## ENCOUNTER SYSTEM OVERVIEW

### Category Distribution

| Category | Count | % of Total | Session Rate |
|----------|-------|------------|--------------|
| Positive | 15 | 33% | 15-20% |
| Negative | 15 | 33% | 20-25% |
| Neutral | 15 | 33% | 15-20% |
| **Total** | **45** | 100% | ~50-65% |

*Player should encounter 2-4 random events per extended session*

### Subcategory Breakdown

**Positive (15)**:
- Resource Finds: 4
- Helpful NPCs: 5
- Lucky Breaks: 3
- Community Moments: 3

**Negative (15)**:
- Direct Threats: 5
- Obstacles: 4
- Social Dangers: 3
- Equipment/Health: 3

**Neutral (15)**:
- Moral Choices: 4
- Strange Moments: 4
- World Texture: 4
- Pivot Points: 3

---

## CROSS-REFERENCES: ENCOUNTERS ↔ SYSTEMS

### Encounters That Affect Jobs

| Encounter | Job Impact |
|-----------|------------|
| P10: Perfect Timing | Delivery time reduced |
| P11: Security Malfunction | Checkpoint bypass |
| N6: Emergency Lockdown | Delivery impossible |
| N7: Package Damage | Job quality affected |
| N8: Route Collapse | Detour required |
| N9: Equipment Failure | Delivery compromised |

### Encounters That Affect Relationships

| Encounter | Relationship Impact |
|-----------|---------------------|
| P5: Route Tip | +New contact potential |
| P7: Impromptu Mentor | +Specific NPC relationship |
| P8: Unexpected Ally | +Network expansion |
| N3: Rival Ambush | ±Rival relationship |
| N10: Misidentification | -Reputation with accusers |
| U1: The Bystander | ±Karma, witnesses remember |

### Encounters That Affect World State

| Encounter | World State Impact |
|-----------|-------------------|
| N4: Corporate Snatch Team | Corporate alert level |
| N11: Faction Pressure | Faction standing |
| N12: Burned Contact | Network availability |
| U5: The Glimpse | Interstitial awareness |
| U13: Confrontation Witnessed | Faction relations |

---

## TRIGGER CONDITIONS

### Time-Based Triggers

| Time Period | Encounter Adjustments |
|-------------|----------------------|
| Dawn | +Community moments, -Direct threats |
| Morning | Baseline |
| Afternoon | +Obstacles, baseline threats |
| Evening | +Social events, +Neutral moments |
| Night | +Direct threats, +Strange moments |
| Late Night | ++Direct threats, +Desperate NPCs |

### Location-Based Triggers

| Location | Encounter Adjustments |
|----------|----------------------|
| Hollows | +Resource finds, +Community, +Threats |
| Harbor | +Helpful NPCs, +Work texture |
| Uptown | +Corporate encounters, -Community |
| Interstitial Edge | +Strange moments, +Glimpse |
| Neutral Zones | +Social, +Confrontations |

### Condition-Based Triggers

| Player State | Encounter Adjustments |
|--------------|----------------------|
| Carrying contraband | +Checkpoint encounters |
| Low health | +Help offered, +Predation |
| High reputation | +Recognition, +Challenges |
| Low reputation | +Desperate encounters |
| Faction-aligned | +That faction's encounters |
| Faction-hostile | +That faction's opposition |

---

## ENCOUNTER CHAINS

### Positive → Story Hooks

| Encounter | Potential Chain |
|-----------|-----------------|
| Hidden Cache | → Owner seeks you |
| Grateful Payment | → Client needs more help |
| Route Tip | → Veteran mentor questline |
| Protective Warning | → Network membership offer |
| Information Windfall | → Spy/faction questline |

### Negative → Resolution Quests

| Encounter | Potential Quest |
|-----------|-----------------|
| Territorial Gang | → Gang alliance/war |
| Rival Ambush | → Rivalry resolution arc |
| Corporate Snatch | → Corporate investigation |
| Burned Contact | → Rescue/revenge mission |
| Faction Pressure | → Faction commitment questline |

### Neutral → Major Branches

| Encounter | Potential Branch |
|-----------|------------------|
| The Offer | → Hidden questline |
| The Double | → Identity mystery |
| The Glimpse | → Interstitial exploration |
| The Gift | → Benefactor reveal |
| The Request | → Unexpected ally arc |

---

## BALANCING GUIDELINES

### Session Pacing

```
Start of Session:
- Lean neutral (establish tone)
- Light positive (reward for logging in)

Mid-Session:
- Mix of all types
- Match story tension

End of Session:
- Avoid major negative (don't punish stopping)
- Positive or neutral preferred
```

### Story Integration

```
During Story Highs:
- Reduce random encounters (focus on plot)
- Positive if any (riding the wave)

During Story Lows:
- Increase encounters (fill the space)
- Mix to taste (player preference)

During Grinding:
- Full encounter frequency
- Variety is key
```

### Player Tier Adjustment

| Tier | Adjustment |
|------|------------|
| 0-1 | Tutorials, simple encounters |
| 2-3 | Full system engaged |
| 4-5 | Higher stakes versions |
| 6+ | Elite variants, consequences magnified |

---

## FLAG INTEGRATION

### Encounter Tracking Flags

```
POSITIVE_ENCOUNTERS_TOTAL (integer)
NEGATIVE_ENCOUNTERS_TOTAL (integer)
NEUTRAL_ENCOUNTERS_TOTAL (integer)
ENCOUNTER_LUCK_MODIFIER (float, adjusts chances)
```

### Specific Encounter Flags

```
# Positive
FOUND_HIDDEN_CACHE (boolean)
VETERAN_MENTOR_MET (boolean)
COMMUNITY_RECOGNITION_[DISTRICT] (boolean)

# Negative
GANG_TERRITORY_[GANG]_PAID (boolean)
GANG_TERRITORY_[GANG]_FOUGHT (boolean)
CORPORATE_SNATCH_SURVIVED (boolean)
CHROME_REJECTION_COUNT (integer)

# Neutral
GLIMPSE_EXPERIENCED (boolean)
DOUBLE_SIGHTED (boolean)
PROPHECY_HEARD (text)
OFFER_PENDING (boolean)
```

### Karma System Integration

| Action | Karma Change |
|--------|--------------|
| Help bystander | +5 |
| Pay for stranger's medicine | +10 |
| Ignore suffering | -2 |
| Rob mugging victim | -15 |
| Return dropped data | +3 |
| Sell personal data | -5 |

---

## VOICE REQUIREMENTS

### Positive Encounters
- ~45 NPC lines
- Warm, helpful, genuine tone
- Mix of ages/backgrounds

### Negative Encounters
- ~50 NPC lines
- Threatening, tense, urgent tone
- Range: street to professional

### Neutral Encounters
- ~40 NPC lines
- Real, varied, human tone
- Often uncomfortable or ambiguous

### Total Voice Content
- ~135 new encounter NPC lines
- ~25 unique NPC types
- Recording estimate: 5-8 hours

---

## TESTING CHECKLIST

### Per Encounter

- [ ] All options have valid outcomes
- [ ] Non-combat solutions exist
- [ ] Tier scaling functions
- [ ] Time/location triggers work
- [ ] Chain hooks connect properly
- [ ] Flags set correctly

### System-Wide

- [ ] Frequency feels right (not too many, not too few)
- [ ] Distribution matches design (positive/negative/neutral)
- [ ] No encounter loops (same one repeatedly)
- [ ] Player agency preserved
- [ ] Consequences feel appropriate

---

## WEEK 3 COMPLETE

### Deliverables
- [x] Positive encounters (15 templates)
- [x] Negative encounters (15 templates)
- [x] Neutral encounters (15 templates)
- [x] Integration documentation

### Systems Established
- Complete random encounter framework
- 45 unique encounter scenarios
- Chain system for story hooks
- Karma tracking integration
- Tier scaling guidelines

### Files Created
1. encounters/positive_encounters.md
2. encounters/negative_encounters.md
3. encounters/neutral_encounters.md
4. encounters/phase_7_week_3_integration.md

---

## CUMULATIVE PHASE 7 PROGRESS

| Week | Content | Words |
|------|---------|-------|
| Week 1 | Jobs + Events | ~23,500 |
| Week 2 | Dynamic Dialogue | ~11,000 |
| Week 3 | Random Encounters | ~13,000 |
| **Total** | | **~47,500** |

---

*Phase 7 Week 3 Integration*
*Days 14-15*
*45 encounter templates integrated*
