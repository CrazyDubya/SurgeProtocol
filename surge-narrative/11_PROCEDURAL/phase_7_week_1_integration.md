# Phase 7 Week 1 Integration Document

## Overview
Week 1 of Phase 7 added 36 job templates (Tiers 3, 5, 6) and 35 dynamic events. This document provides cross-references, integration notes, and implementation guidance.

---

## JOB TEMPLATE SUMMARY

### Tier Coverage (Complete)

| Tier | File | Jobs | Theme |
|------|------|------|-------|
| 0 | (tutorial, existing) | 8 | Learning the basics |
| 1-2 | tier_1-2_jobs.md | 15 | Early career |
| 3 | tier_3_jobs.md | 12 | Algorithm decision era |
| 4 | tier_4_jobs.md | 12 | Gray zone operations |
| 5 | tier_5_jobs.md | 12 | Interstitial era |
| 6 | tier_6_jobs.md | 12 | Fork complications |
| 7 | tier_7_jobs.md | 10 | Elite operations |
| **Total** | | **81** | |

### Job Distribution by Type

| Type | Count | Primary Tiers |
|------|-------|---------------|
| Delivery (standard) | 18 | 0-3 |
| Gray market | 12 | 2-5 |
| Faction political | 14 | 3-7 |
| Medical/identity | 10 | 3-6 |
| Espionage | 9 | 4-7 |
| Interstitial | 6 | 5-6 |
| Fork-related | 12 | 6 |
| Personal/emotional | 10 | All |

---

## CROSS-REFERENCES: JOBS ↔ NPCs

### Tier 3 Jobs → NPC Connections

| Job | Primary NPC(s) | File Reference |
|-----|----------------|----------------|
| Integration Clinic Supplies | Dr. Sato | tier_3_contacts.md |
| Resistance Communique | Sister Algorithm | tier_3_contacts.md |
| Corporate Recruitment | Victor Huang | tier_3_contacts.md |
| Medical Second Opinion | Ghost Doc | tier_3_contacts.md |
| Algorithm Artifact | Professor Yang | service_providers.md |
| Faction Neutral Zone | Mother Mercy | gray_zone_contacts.md |
| Integration Reversal Research | Ghost Doc, Resistance | tier_3_contacts.md |
| Convergence Invitation | (Convergence NPCs) | — |
| Chrome Clinic Contraband | Dr. Sato, Patch | tier_3_contacts.md, early_career_npcs.md |
| Baseline Solidarity | Marcus Cole "Skeptic" | tier_3_contacts.md |
| Corporate Whistleblower | Jerome Blackwell | gray_zone_contacts.md |
| The Choice Carrier | Elena Vasquez | tier_3_contacts.md |

### Tier 5 Jobs → NPC Connections

| Job | Primary NPC(s) | File Reference |
|-----|----------------|----------------|
| Interstitial Transit | Echo | interstitial_contacts.md |
| Faction War Intelligence | Agent Nakahara | gray_zone_contacts.md |
| Ghost Data Recovery | Dr. Iris Chen, Archivist | interstitial_contacts.md |
| Eighth Aspirant Supplies | Jasper, Ghost Alexandra | interstitial_contacts.md, tech_vendors.md |
| Archive Fragment Recovery | The Archivist | interstitial_contacts.md |
| Maya-2 Maintenance | Maya-2 | interstitial_contacts.md |
| Convergence Defector | Ghost Network, Resistance | — |
| Resistance Weapons Cache | Resistance high command | — |
| Corporate Black Site | Jerome Blackwell | gray_zone_contacts.md |
| Third Path Materials | Solomon Okonkwo | main cast |
| Consciousness Backup | Fork consultant | fork_era_contacts.md |
| Skeptic's Ghost Message | Skeptic's Ghost | interstitial_contacts.md |

### Tier 6 Jobs → NPC Connections

| Job | Primary NPC(s) | File Reference |
|-----|----------------|----------------|
| Fork Correspondence | Dr. Vance | fork_era_contacts.md |
| Custody Evidence | Mira Okonkwo | service_providers.md |
| Merge Preparation | Alex/Andra | fork_era_contacts.md |
| Fork Dispute Arbitration | The Judge | high_tier_contacts.md |
| Fork Termination Notice | (Corporate legal) | — |
| Fork Reunion Coordination | Dr. Vance, support groups | fork_era_contacts.md |
| Identity Theft Evidence | (Enforcement) | — |
| Consciousness Divorce | (Mediator) | — |
| Fork Memory Transfer | (Technician) | — |
| Fork Insurance Claim | (Adjuster) | — |
| Unauthorized Fork Network | Splitter Mira | fork_era_contacts.md |
| The Last Fork | (Private clients) | — |

---

## CROSS-REFERENCES: JOBS ↔ LOCATIONS

### Location-Specific Job Availability

| Location | Available Job Types |
|----------|---------------------|
| Hollows | Gray market, underground, community, Resistance |
| Red Harbor | Industrial, smuggling, union, dock work |
| Uptown | Corporate, recruitment, espionage, checkpoint-heavy |
| Interstitial | Transit, archive, ghost recovery, Eighth-related |
| Neutral Zones | Diplomatic, faction meetings, arbitration |

### New Location Requirements

Jobs in Tier 5+ may require:
- Interstitial access (training with Echo)
- Faction territory permissions
- Corporate clearance (or bypasses)
- Underground network credentials

---

## CROSS-REFERENCES: JOBS ↔ FLAGS

### Critical Story Flags from New Jobs

**Tier 3 Flags**:
```
INTEGRATION_CLINIC_RUN_COUNT (integer)
RESISTANCE_DELIVERIES (integer)
CORPORATE_RECRUITMENT_DELIVERED
GHOST_DOC_REFERRALS (integer)
ALGORITHM_HISTORY_EXPOSED
FACTION_NEUTRALITY_MAINTAINED
REVERSAL_RESEARCH_SUPPORTED
CONVERGENCE_INVITATIONS_DELIVERED
SATO_CONTRABAND_RUNS (integer)
BASELINE_SUPPORT_RUNS (integer)
WHISTLEBLOWER_DOCUMENTS_DELIVERED
ALGORITHM_FAMILY_RECONCILIATION
```

**Tier 5 Flags**:
```
INTERSTITIAL_DELIVERIES (integer)
COMPLETE_INTELLIGENCE_PICTURE
DATA_GHOST_RESCUES (integer)
EIGHTH_PREPARATION_SUPPORTED
ARCHIVE_FRAGMENTS_RECOVERED (integer)
MAYA_2_FRIENDSHIP (integer)
CONVERGENCE_DEFECTOR_EXTRACTED
RESISTANCE_ARMED
BLACK_SITE_EXPOSED
THIRD_PATH_SPREAD (integer)
CONSCIOUSNESS_BACKUP_DELIVERED
SKEPTICS_GHOST_MESSAGE_DELIVERED
```

**Tier 6 Flags**:
```
FORK_CORRESPONDENCE_FACILITATED
FORK_CUSTODY_CASE
MERGE_FACILITATED
TRIPLE_FORK_CASE
TERMINATION_NOTICE_DELIVERED
FORK_REUNION_SUCCESS
FORK_FRAUD_EXPOSED
CONSCIOUSNESS_DIVORCE_FACILITATED
FORK_MEMORY_SHARED
FORK_DEATH_CLAIM_FILED
FORK_NETWORK_SUPPORTED
LAST_FORK_BLESSING
```

### Flag Impact Summary
- 12 new faction-relationship flags
- 8 new story-critical flags
- 6 new moral-weight flags
- 10 new relationship-tracking integers

---

## DYNAMIC EVENT INTEGRATION

### Event ↔ Job Interactions

**Events That Generate Jobs**:
| Event | Generated Jobs |
|-------|---------------|
| Faction Protest | Protest supply runs, extraction |
| Corporate Raid | Pre-raid extraction, post-raid cleanup |
| Algorithm Sweep | Smuggling unintegrated, documentation |
| Power Failure | Emergency medical/supply runs |
| Underground Market | High-volume gray market work |
| Environmental Disaster | Evacuation assistance, supply runs |

**Events That Block Jobs**:
| Event | Blocked Jobs |
|-------|--------------|
| District Lockdown | All jobs in/out of district |
| Network Crash | All network-dependent jobs |
| Construction Zone | Specific route-dependent jobs |
| Faction Summit | Jobs in neutral zone |

### Event ↔ NPC Interactions

**NPCs Affected by Events**:
- Protest: Activists unavailable, hiding
- Raid: Underground contacts may be captured
- Lockdown: All NPCs in district inaccessible
- Power Failure: Chrome-dependent NPCs impaired
- Festival: NPCs more available, friendlier

### Event Trigger Conditions

**Time-Based**:
- Street performer: Day hours, public areas
- Mugging: Night hours, Hollows
- Festival: Specific dates or random "good day"

**State-Based**:
- Faction Protest: High faction tension
- Corporate Raid: Specific story flags
- Algorithm Sweep: Post-certain tier or story events

**Random**:
- Most street events have base % chance
- Modified by location, time, player state

---

## VOICE REQUIREMENTS: NEW CONTENT

### Job Template Voice Needs

| Content Type | Lines Est. | Actors |
|--------------|------------|--------|
| Tier 3 job dialogue | ~180 | 12 NPCs |
| Tier 5 job dialogue | ~200 | 14 NPCs |
| Tier 6 job dialogue | ~220 | 16 NPCs |
| **Job Total** | **~600** | **~30** |

### Event Voice Needs

| Content Type | Lines Est. | Actors |
|--------------|------------|--------|
| Street event NPCs | ~120 | 15 types |
| District event NPCs | ~80 | 10 types |
| Event ambient | ~60 | Various |
| **Event Total** | **~260** | **~20** |

### Week 1 Total Voice
- ~860 new voice lines required
- ~40 unique NPC types
- Recording estimate: 15-20 hours

---

## IMPLEMENTATION PRIORITIES

### Phase 1: Core Jobs
1. Implement Tier 3 jobs (most common)
2. Connect to existing NPC systems
3. Test flag integration

### Phase 2: Advanced Jobs
1. Implement Tier 5 jobs (Interstitial required)
2. Verify Interstitial navigation works
3. Test faction flag impacts

### Phase 3: Fork Jobs
1. Implement Tier 6 jobs
2. Create fork NPC variants
3. Test emotional/moral weight

### Phase 4: Events
1. Implement street events (random triggers)
2. Implement district events (state triggers)
3. Test job↔event interactions

---

## KNOWN DEPENDENCIES

### Tier 5 Jobs Require:
- Interstitial navigation system
- Echo training completion
- Faction reputation tracking

### Tier 6 Jobs Require:
- Fork system implementation
- Fork NPC generation
- Legal status tracking

### District Events Require:
- World state system
- Multi-day persistence
- Area-wide effect propagation

---

## WEEK 1 COMPLETE

### Deliverables
- [x] Tier 3 job templates (12 jobs)
- [x] Tier 5 job templates (12 jobs)
- [x] Tier 6 job templates (12 jobs)
- [x] Street events (20 events)
- [x] District events (15 events)
- [x] Integration documentation

### Word Count
- Tier 3 jobs: ~4,500 words
- Tier 5 jobs: ~5,000 words
- Tier 6 jobs: ~5,500 words
- Street events: ~4,000 words
- District events: ~3,000 words
- Integration doc: ~1,500 words
- **Week 1 Total**: ~23,500 words

### Files Created
1. tier_3_jobs.md
2. tier_5_jobs.md
3. tier_6_jobs.md
4. street_events.md
5. district_events.md
6. phase_7_week_1_integration.md

---

*Phase 7 Week 1 Integration*
*Day 5*
*36 jobs + 35 events integrated*
