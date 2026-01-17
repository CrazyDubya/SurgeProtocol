# NPC Registry - Complete Character Tracking

## Purpose
Central registry of all NPCs in Surge Protocol narrative system. Tracks main cast, general NPCs, procedural archetypes, and supporting characters.

---

## REGISTRY STRUCTURE

### Categories
- **Main Cast**: Story-critical characters with full arcs
- **General NPCs**: Supporting characters with dialogue/personality
- **Location NPCs**: District-specific residents
- **Procedural Archetypes**: Template characters for job generation
- **Ambient NPCs**: Background voice lines only

---

## MAIN CAST (9 Characters)

| Character | Tier Range | Role | File Location |
|-----------|------------|------|---------------|
| Chen Wei | 0+ | Dispatcher/Mentor | `/01_CHARACTERS/tier_0_npcs/dispatcher_chen.md` |
| Rosa Delgado | 1-10 | Mechanic/Romance | `/01_CHARACTERS/tier_1-3_npcs/rosa_delgado.md` |
| Jin "Quicksilver" Park | 1-10 | Rival/Ally | `/01_CHARACTERS/tier_1-3_npcs/jin_rival_courier.md` |
| Dr. Yuki Tanaka | 2-10 | Researcher | `/01_CHARACTERS/tier_1-3_npcs/dr_yuki_tanaka.md` |
| Delilah | 4-10 | Fixer | `/01_CHARACTERS/tier_4-6_npcs/delilah_fixer.md` |
| Maria Lopez | 4-10 | Union Organizer | `/01_CHARACTERS/tier_4-6_npcs/union_organizer_lopez.md` |
| Solomon Okonkwo | 5-10 | Spiritual Guide | `/01_CHARACTERS/tier_7-9_npcs/okonkwo_interstitial_guide.md` |
| Director Yamada | 5-10 | Antagonist | `/01_CHARACTERS/tier_7-9_npcs/yamada_corpo_recruiter.md` |
| Phantom | 7-10 | Ghost Network | `/01_CHARACTERS/tier_7-9_npcs/phantom_ghost_network.md` |

---

## GENERAL NPCs - TIER 0 (5 Characters)

*Added: Phase 6 Day 3*

| Character | Role | Location | File |
|-----------|------|----------|------|
| Marcus "Dock" Reeves | Dock Worker / First Contact | Red Harbor | `/tier_0_npcs/tutorial_npcs.md` |
| Sunny Chen | Food Vendor / Gossip | Hollows Market | `/tier_0_npcs/tutorial_npcs.md` |
| Tomas Vega | Fellow Rookie Courier | Various | `/tier_0_npcs/tutorial_npcs.md` |
| Vera Okonkwo | Building Super | Player's Building | `/tier_0_npcs/tutorial_npcs.md` |
| "Nine" | Local Fixer | Rusty Anchor Bar | `/tier_0_npcs/tutorial_npcs.md` |

### Tier 0 NPC Relationships
- Dock → Sunny (lunch customer)
- Sunny → Vera (old friends)
- Vera → Nine (aware of activities)
- All → Chen (professional respect)

---

## GENERAL NPCs - TIER 1-2 (8 Characters)

*Added: Phase 6 Day 4*

| Character | Role | Location | File |
|-----------|------|----------|------|
| Kira "Patch" Volkov | Black Market Tech | Hollows (rotating) | `/tier_1-3_npcs/early_career_npcs.md` |
| Emmanuel "Manny" Price | Food Vendor / Info Broker | Red Harbor | `/tier_1-3_npcs/early_career_npcs.md` |
| "Static" | Junior Fixer | Rusty Anchor | `/tier_1-3_npcs/early_career_npcs.md` |
| Hayes | Rival Courier | Various | `/tier_1-3_npcs/early_career_npcs.md` |
| Sister Grace | Union Recruiter | Community Center | `/tier_1-3_npcs/early_career_npcs.md` |
| "Compass" Chen | Street Kid Guide | Hollows | `/tier_1-3_npcs/early_career_npcs.md` |
| Detective Rae Morrison | Retired Cop | Rusty Anchor | `/tier_1-3_npcs/early_career_npcs.md` |
| Yuki Tanaka (No Relation) | Uptown Contact | Nakamura Tower | `/tier_1-3_npcs/early_career_npcs.md` |

### Tier 1-2 NPC Relationships
- Patch → Static (supplier)
- Manny → Everyone (food hub)
- Grace → Compass (helped family)
- Morrison → Hayes (knows history)
- Yuki → Patch (smuggles tech)
- Static ← Nine (apprentice)

---

## PROCEDURAL CLIENT ARCHETYPES (30 Types)

*Added: Phase 6 Day 1*
*File: `/11_PROCEDURAL/job_templates/client_profiles.md`*

### Tier 0-2 Clients
1. Nervous Newcomer
2. Street Vendor
3. Broke Student
4. Worried Parent
5. Local Drunk
6. Corner Kid
7. Retired Courier
8. Food Stall Owner
9. Street Artist
10. Clinic Worker

### Tier 3-4 Clients
11. Corporate Burnout
12. Fixer's Assistant
13. Underground Doc
14. Union Steward
15. Gray Market Broker
16. Corporate Mole
17. Data Dealer
18. Smuggler Captain
19. Anxious Heiress
20. Ex-Security Contractor

### Tier 5-6 Clients
21. Algorithm Broker
22. Interstitial Pilgrim
23. Corporate Defector
24. Fork Consultant
25. Ghost Network Operative

### Tier 7-8 Clients
26. Faction Emissary
27. Convergence Prophet
28. Rogue Architect
29. Third Path Theorist
30. Algorithm Fragment

---

## NPC TOTALS BY PHASE

| Phase | NPCs Added | Running Total |
|-------|------------|---------------|
| Phases 1-5 | 9 (main cast) | 9 |
| Phase 6 Week 1 | 13 (general) + 30 (procedural) | 52 |
| Phase 6 Week 2 | (pending) | — |
| Phase 6 Week 3 | (pending) | — |
| Phase 6 Week 4 | (pending) | — |

---

## FLAG REGISTRY - NEW FLAGS (Week 1)

### Tier 0 NPC Flags
```
MET_DOCK_MARCUS
MET_SUNNY_VENDOR
MET_TOMAS_ROOKIE
MET_VERA_SUPER
MET_FIXER_NINE
FIRST_DOCK_JOB_COMPLETE
DOCK_JOBS_COMPLETED (integer)
SUNNY_GOSSIP_COUNT (integer)
SUNNY_FED_FREE
TOMAS_RELATIONSHIP (integer)
HELPED_TOMAS / COMPETED_TOMAS
VERA_SAFE_HOUSE_KNOWN
VERA_RELATIONSHIP (integer)
NINE_INTEREST_LEVEL (integer)
NINE_TEST_PASSED / NINE_TEST_FAILED
```

### Tier 1-2 NPC Flags
```
MET_PATCH_DEALER
PATCH_PURCHASES (integer)
PATCH_TRUST (integer)
MET_MANNY_HARBOR
MANNY_INFO_TRADES (integer)
MANNY_FREE_MEALS (integer)
MET_STATIC_FIXER
STATIC_JOBS_COMPLETED (integer)
STATIC_SCREWUPS (integer)
MET_HAYES_COURIER
HAYES_RELATIONSHIP (integer)
BEAT_HAYES_RACE / LOST_TO_HAYES
HAYES_ALLIANCE_FORMED
MET_SISTER_GRACE
UNION_PITCH_HEARD
UNION_INTEREST_LEVEL (integer)
MET_COMPASS_GUIDE
COMPASS_SHORTCUTS_BOUGHT (integer)
COMPASS_RELATIONSHIP (integer)
MET_DETECTIVE_MORRISON
MORRISON_INSIGHTS (integer)
MET_YUKI_UPTOWN
UPTOWN_SERVICE_ACCESS
YUKI_JOBS_COMPLETED (integer)
```

### Tier 0 Job Flags
```
FIRST_CLINIC_RUN_COMPLETE
FOOD_RUN_COMPLETE
DOCUMENT_DASH_COMPLETE
NEIGHBOR_FAVOR_COMPLETE
MARKET_RUN_COMPLETE
NIGHT_RUN_COMPLETE
MECHANICAL_RUN_COMPLETE
NINE_TEST_COMPLETE
NINE_TEST_OPENED / NINE_TEST_SEALED
TIER_0_JOBS_COMPLETED (integer)
TIER_0_MASTERY
```

### Side Job Flags
```
WON_HAYES_RACE / LOST_TO_HAYES / CHEATED_HAYES_RACE
LEFT_LOST_PACKAGE / HELPED_MARCO_COURIER
KNOW_HARBOR_GANG_ROUTES
FAVOR_CHAIN_COMPLETE
UNION_MEETING_ATTENDED
UNION_POTENTIAL_ORGANIZER
PATCH_SHIPMENT_SAVED / PATCH_IMPRESSED
COMPASS_FIRST_DELIVERY / COMPASS_FIRST_FAILURE
```

---

## VOICE CASTING NOTES

### Priority Groups

**Group A - Main Cast** (Full recording sessions):
- Chen Wei, Rosa, Jin, Tanaka, Delilah, Lopez, Okonkwo, Yamada, Phantom
- Algorithm, Shadow
- Already documented in Phase 5

**Group B - Recurring General NPCs** (Medium sessions):
- Dock Marcus, Sunny Chen, Vera Okonkwo, Nine
- Patch, Manny, Sister Grace
- Hayes, Detective Morrison
- ~50-100 lines each

**Group C - Minor General NPCs** (Short sessions):
- Tomas Vega, Static, Compass, Yuki Tanaka
- ~25-50 lines each

**Group D - Procedural Archetypes** (Multiple actors per type):
- 30 client types × ~10 lines each = 300 base lines
- 3-5 voice variants per archetype recommended

---

## CROSS-REFERENCE NOTES

### Name Disambiguation
- **Chen Wei** (Dispatcher) vs **Sunny Chen** (Vendor) - No relation
- **Dr. Yuki Tanaka** (Main cast) vs **Yuki Tanaka** (Uptown) - No relation
- **Solomon Okonkwo** (Main cast) vs **Vera Okonkwo** (Super) - Possible distant relation?

### NPC Growth Arcs
- **Tomas Vega**: Can grow into competent courier or fail out
- **Static**: Can become major fixer or stay minor
- **Compass**: Dreams of becoming courier
- **Hayes**: Bitter rival can become reluctant ally

---

*NPC Registry v1.0*
*Phase 6 Week 1 Integration*
*Updated: 2026-01-17*
