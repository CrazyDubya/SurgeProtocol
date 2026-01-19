# Phase 7 Week 2 Integration Document

## Overview
Week 2 of Phase 7 added dynamic dialogue systems: time-based variations, weather reactions, and relationship evolution. These systems layer on top of existing ambient dialogue to create a more responsive, living world.

---

## WEEK 2 CONTENT SUMMARY

| Day | Content | Lines | Words |
|-----|---------|-------|-------|
| Day 6 | Time of day dialogue | 60 | ~2,500 |
| Day 7 | Weather variations | 50 | ~2,000 |
| Day 8 | Early NPC evolution | 80 | ~3,000 |
| Day 9 | Late NPC evolution | 60 | ~2,500 |
| Day 10 | Integration doc | — | ~1,000 |
| **Total** | | **250** | **~11,000** |

---

## SYSTEM INTERACTIONS

### Layer Priority (Low → High)

```
1. Base Ambient Line (generic)
   ↓
2. Time of Day Modifier
   ↓
3. Weather Modifier
   ↓
4. Relationship Stage
   ↓
5. Story State (quest flags)
   ↓
6. Direct Address (speaking to player)
```

Higher layers override lower layers when applicable.

---

## TIME OF DAY SYSTEM

### Coverage

| Period | Lines | Key Themes |
|--------|-------|------------|
| Dawn | 10 | Quiet hope, early workers |
| Morning | 10 | Business energy, purpose |
| Afternoon | 10 | Peak activity, heat, crowds |
| Evening | 10 | Transition, relaxation |
| Night | 10 | Danger, opportunity |
| Late Night | 10 | Emptiness, desperation |

### Location Modifiers
- **Hollows**: More night activity, less dawn
- **Harbor**: Shift-based patterns, early dawn
- **Uptown**: Business hours focus, dead late night

### Trigger Rate
- 30% chance per NPC interaction
- 50% chance for ambient environment
- 100% for time-critical story moments

---

## WEATHER SYSTEM

### Coverage

| Weather | Lines | Frequency |
|---------|-------|-----------|
| Rain | 12 | 25% |
| Storm | 10 | 10% |
| Fog | 10 | 10% |
| Heat Wave | 10 | 10% |
| Cold Snap | 8 | 5% |
| Clear | — | 40% (no special lines) |

### Gameplay Effects

| Weather | Time Mod | Risk Mod | Chrome Effect |
|---------|----------|----------|---------------|
| Rain | +15% | +10% | Minor seal issues |
| Storm | +50% | +40% | Electrical interference |
| Fog | +25% | +30% | Sensor confusion |
| Heat | +20% | +15% | Cooling stress |
| Cold | +10% | +20% | None |

### Weather × Location Matrix
Different districts react differently to same weather.
See `weather_variations.md` for complete matrix.

---

## RELATIONSHIP SYSTEM

### Early NPCs (Tier 0-3)

| NPC | Lines | Special |
|-----|-------|---------|
| Chen Wei | 10 | Job unlocks at trusted |
| Rosa Delgado | 10 | Chrome mods at bonded |
| Jin Park | 12 | Friendship/rivalry paths |
| Sunny Chen | 10 | Information at trusted |
| Dock Marcus | 10 | Union access |
| Vera Okonkwo | 10 | Safe house at bonded |
| Patch | 10 | Private stock at trusted |
| Static | 10 | Network access |
| Nine | 10 | Underground at trusted |
| Sister Grace | 10 | Leadership at bonded |

**Stages**: Stranger → Acquaintance → Familiar → Trusted → Bonded

### Late NPCs (Tier 4-8)

| NPC | Lines | Special |
|-----|-------|---------|
| Delilah | 8 | Power structure reveal |
| Maria Lopez | 8 | Union inner council |
| Solomon Okonkwo | 8 | Third Path teachings |
| Gray Whitfield | 8 | Network control |
| Captain Santos | 8 | Ship access |
| Echo | 8 | Deep Interstitial |
| Dr. Vance | 8 | Fork network |
| Oracle Natasha | 8 | Elite techniques |
| The Counselor | 8 | Ending support |

**Stages**: Professional → Respected → Trusted → Inner Circle

### Negative Relationships
Both tracks include hostile paths:
- Tension → Distrust → Hostility → Enemy

---

## CROSS-SYSTEM COMBINATIONS

### Time + Weather
- Rain + Night = Maximum stealth opportunity
- Storm + Dawn = Emergency runs
- Heat + Afternoon = Maximum strain
- Fog + Evening = Maximum mystery

### Weather + Relationship
- Weather affects relationship building rate
- Storm conditions slow advancement
- Shared hardship can accelerate bonds

### Time + Relationship
- Night conversations unlock different lines
- Dawn meetings feel more intimate
- Business hours maintain professional tone

---

## IMPLEMENTATION ARCHITECTURE

### Dialogue Selection Flow

```
1. Get NPC ID
2. Check relationship stage → load appropriate pool
3. Check weather → filter pool or add modifier
4. Check time → filter pool or add modifier
5. Check story flags → override if applicable
6. Random select from final pool
7. Cache to avoid immediate repetition
```

### Caching Rules
- No immediate repetition of same line
- 5-line cooldown per NPC
- Weather/time lines can repeat sooner than relationship

### Voice Requirements

| Category | Lines | Unique NPCs |
|----------|-------|-------------|
| Time ambient | 60 | Generic voices |
| Weather ambient | 50 | Generic voices |
| Early NPC evolution | 80 | 10 NPCs |
| Late NPC evolution | 60 | 9 NPCs |
| **Total** | **250** | **19 NPCs + generic** |

Recording estimate: 8-12 hours additional

---

## FLAG INTEGRATION

### New Relationship Flags

**Early NPCs**:
```
CHEN_RELATIONSHIP (0-15+)
ROSA_RELATIONSHIP (0-15+)
JIN_RELATIONSHIP (-15 to 15+)
SUNNY_RELATIONSHIP (0-15+)
DOCK_MARCUS_RELATIONSHIP (0-15+)
VERA_RELATIONSHIP (0-15+)
PATCH_RELATIONSHIP (0-15+)
STATIC_RELATIONSHIP (0-15+)
NINE_RELATIONSHIP (0-15+)
GRACE_RELATIONSHIP (0-15+)
```

**Late NPCs**:
```
DELILAH_RELATIONSHIP (0-12+)
LOPEZ_RELATIONSHIP (0-12+)
OKONKWO_RELATIONSHIP (0-12+)
GRAY_RELATIONSHIP (0-12+)
SANTOS_RELATIONSHIP (0-12+)
ECHO_RELATIONSHIP (0-12+)
VANCE_RELATIONSHIP (0-12+)
NATASHA_RELATIONSHIP (0-12+)
COUNSELOR_RELATIONSHIP (0-12+)
```

### Weather Tracking
```
CURRENT_WEATHER (enum)
WEATHER_DURATION (hours remaining)
LAST_WEATHER_CHANGE (timestamp)
```

---

## WEEK 2 COMPLETE

### Deliverables
- [x] Time of day dialogue (60 lines)
- [x] Weather variations (50 lines)
- [x] Early NPC evolution (80 lines)
- [x] Late NPC evolution (60 lines)
- [x] Integration documentation

### Systems Established
- Dynamic time-of-day atmosphere
- Weather affects gameplay and dialogue
- Relationship progression with all major NPCs
- Layer priority for dialogue selection

### Files Created
1. time_based/day_night_variations.md
2. time_based/weather_variations.md
3. relationship/early_npc_evolution.md
4. relationship/late_npc_evolution.md
5. phase_7_week_2_integration.md

---

## CUMULATIVE PHASE 7 PROGRESS

| Week | Content | Words |
|------|---------|-------|
| Week 1 | Jobs + Events | ~23,500 |
| Week 2 | Dynamic Dialogue | ~11,000 |
| **Total** | | **~34,500** |

---

*Phase 7 Week 2 Integration*
*Day 10*
*250 dynamic dialogue lines*
