# Surge Protocol - Implementation Review & API Specification

## REVIEW FINDINGS

### Critical Gaps Identified

| Gap | Severity | Resolution |
|-----|----------|------------|
| Branching Points underdeveloped | HIGH | Create comprehensive callback system |
| Missing Tier 8-10 quest files | HIGH | Content exists in main_story, needs extraction |
| Directory 02, 12 missing | MEDIUM | Define purpose or remove from schema |
| Tier 0/8+ job templates | MEDIUM | Create or document as intentional omission |
| Algorithm content light | MEDIUM | Core dialogue exists, expand contextual |

### Word Count Reconciliation
- Actual file content: ~355,000 words
- Claimed total: ~437,600 words
- Difference likely from: commit message estimates vs actual, metadata overhead
- **Actual production content: ~355,000 words** (still substantial)

---

## API CONSUMPTION ARCHITECTURE

### Recommended Data Structure

```json
{
  "surge_protocol": {
    "version": "1.0.0",
    "content_modules": {
      "characters": {},
      "quests": {},
      "dialogue": {},
      "procedural": {},
      "world": {},
      "systems": {}
    },
    "runtime": {
      "flags": {},
      "relationships": {},
      "world_state": {}
    }
  }
}
```

### Module Breakdown

#### 1. Characters Module
```json
{
  "characters": {
    "chen_wei": {
      "id": "chen_wei",
      "type": "main_cast",
      "tier_range": [0, 10],
      "role": "dispatcher_mentor",
      "location": "courier_hub",
      "dialogue_pools": {
        "greeting": ["line_id_1", "line_id_2"],
        "job_briefing": ["line_id_3"],
        "relationship_0": ["stranger_lines"],
        "relationship_5": ["familiar_lines"],
        "relationship_10": ["bonded_lines"]
      },
      "voice_actor_priority": 1,
      "flags_required": [],
      "flags_set": ["MET_CHEN"]
    }
  }
}
```

#### 2. Quests Module
```json
{
  "quests": {
    "main_story": {
      "tier_0_awakening": {
        "id": "tier_0_awakening",
        "tier": 0,
        "type": "main",
        "title": "First Steps",
        "stages": [
          {
            "id": "stage_1",
            "objective": "Meet Chen at the hub",
            "dialogue_trigger": "chen_intro",
            "completion_flags": ["CHEN_INTRO_COMPLETE"]
          }
        ],
        "branches": {
          "accept_first_job": {
            "flags_set": ["ACCEPTED_FIRST_JOB"],
            "next_stage": "stage_2a"
          },
          "question_chen": {
            "flags_set": ["QUESTIONED_CHEN"],
            "relationship_mod": {"chen_wei": -1},
            "next_stage": "stage_2b"
          }
        }
      }
    }
  }
}
```

#### 3. Dialogue Module
```json
{
  "dialogue": {
    "pools": {
      "ambient_hollows_day": {
        "conditions": {
          "location": "hollows",
          "time": ["morning", "afternoon"],
          "weather": "any"
        },
        "lines": [
          {
            "id": "amb_hol_001",
            "text": "Another day. The Algorithm says it'll be productive.",
            "voice_file": "amb_hol_001.wav",
            "speaker_type": "generic_citizen",
            "weight": 1.0
          }
        ]
      }
    },
    "conversations": {
      "chen_intro": {
        "nodes": [
          {
            "id": "node_1",
            "speaker": "chen_wei",
            "text": "New courier. Prove yourself.",
            "responses": [
              {
                "text": "I'm ready.",
                "flags_set": ["CONFIDENT_INTRO"],
                "next": "node_2a"
              },
              {
                "text": "What do I need to do?",
                "next": "node_2b"
              }
            ]
          }
        ]
      }
    }
  }
}
```

#### 4. Procedural Module
```json
{
  "procedural": {
    "job_templates": {
      "tier_3_clinic_supply": {
        "id": "tier_3_clinic_supply",
        "tier": 3,
        "type": "medical",
        "base_pay": 125,
        "time_limit": 7200,
        "pickup": {
          "location_type": "corporate_facility",
          "npc_pool": ["distribution_worker"],
          "dialogue_pool": "clinic_pickup"
        },
        "dropoff": {
          "location_type": "clinic",
          "npc_pool": ["clinic_staff"],
          "dialogue_pool": "clinic_dropoff"
        },
        "complications": {
          "chance": 0.20,
          "pool": ["checkpoint_delay", "protest_nearby"]
        },
        "flags_increment": ["INTEGRATION_CLINIC_RUN_COUNT"]
      }
    },
    "encounters": {
      "positive": {
        "hidden_cache": {
          "trigger_chance": 0.03,
          "tier_range": [1, 4],
          "location_types": ["hollows", "harbor"],
          "rewards": {
            "credits": {"min": 150, "max": 400},
            "items": ["medical_supplies", "chrome_components"]
          }
        }
      }
    },
    "events": {
      "district": {
        "faction_protest": {
          "duration_hours": [4, 8],
          "affected_districts": ["hollows", "harbor"],
          "effects": {
            "route_time_modifier": 1.25,
            "job_availability": ["protest_supply", "extraction"]
          }
        }
      }
    }
  }
}
```

#### 5. World State Module
```json
{
  "world": {
    "districts": {
      "hollows": {
        "id": "hollows",
        "danger_level": 3,
        "faction_control": "contested",
        "locations": ["rusty_anchor", "community_center", "market"],
        "ambient_pools": ["hollows_day", "hollows_night"],
        "event_weights": {
          "gang_activity": 1.5,
          "corporate_presence": 0.5
        }
      }
    },
    "time": {
      "periods": ["dawn", "morning", "afternoon", "evening", "night", "late_night"],
      "current": "morning"
    },
    "weather": {
      "types": ["clear", "rain", "storm", "fog", "heat", "cold"],
      "current": "clear",
      "effects": {
        "rain": {
          "delivery_time_mod": 1.15,
          "chrome_degradation": 0.01
        }
      }
    }
  }
}
```

#### 6. Runtime State
```json
{
  "runtime": {
    "player": {
      "tier": 3,
      "credits": 1250,
      "reputation": {
        "general": 45,
        "convergence": 10,
        "resistance": 25,
        "corporate": -5
      },
      "chrome": ["basic_navigation", "speed_boost_1"],
      "integration_status": "unintegrated"
    },
    "flags": {
      "MET_CHEN": true,
      "FIRST_DELIVERY_COMPLETE": true,
      "INTEGRATION_CLINIC_RUN_COUNT": 2,
      "ALGORITHM_OFFER_PENDING": true
    },
    "relationships": {
      "chen_wei": 7,
      "rosa_delgado": 4,
      "jin_park": -2
    },
    "active_quests": ["tier_3_crossroads"],
    "completed_quests": ["tier_0_awakening", "tier_1_proving"]
  }
}
```

---

## GAME ENGINE INTEGRATION

### Dialogue System Requirements

```
DialogueManager
├── LoadConversation(conversation_id)
├── GetNextNode(current_node, player_choice)
├── EvaluateConditions(node_conditions, runtime_state)
├── ApplyEffects(node_effects, runtime_state)
└── GetAmbientLine(location, time, weather, flags)

Example Flow:
1. Player enters Hollows during rain at night
2. Engine calls: GetAmbientLine("hollows", "night", "rain", player_flags)
3. System filters pools by conditions
4. Weighted random selection from valid lines
5. Returns line_id + text + voice_file reference
```

### Quest System Requirements

```
QuestManager
├── GetAvailableQuests(player_tier, flags, relationships)
├── StartQuest(quest_id)
├── AdvanceStage(quest_id, branch_choice)
├── CompleteQuest(quest_id)
├── GetActiveObjectives()
└── CheckQuestTriggers(event_type, context)

Branching Logic:
1. Player completes stage objective
2. System presents branch options (filtered by flags/skills)
3. Player selects branch
4. System applies: flags_set, relationship_mods, next_stage
5. Quest state updated
```

### Procedural Job System

```
JobGenerator
├── GenerateJob(tier, player_state)
│   ├── SelectTemplate(tier, completed_jobs, flags)
│   ├── PopulateVariables(template, world_state)
│   ├── AssignNPCs(pickup_pool, dropoff_pool)
│   ├── CalculatePay(base_pay, modifiers)
│   └── RollComplications(chance, context)
├── GetAvailableJobs(player_tier, location)
└── CompleteJob(job_id, outcome)

Variable Substitution:
Template: "Deliver {PACKAGE_TYPE} to {DROPOFF_NPC} at {LOCATION}"
Runtime: "Deliver medical supplies to Dr. Santos at Hollows Clinic"
```

### Encounter System

```
EncounterManager
├── RollEncounter(location, time, player_state)
│   ├── FilterByConditions(all_encounters, context)
│   ├── WeightedSelection(valid_encounters)
│   └── InstantiateEncounter(template)
├── ResolveEncounter(encounter_id, player_choice)
└── ApplyOutcome(outcome_effects)

Frequency Control:
- Base chance per travel segment: 15-25%
- Modified by: location danger, time of day, player tier, recent encounters
- Cooldown: Same encounter type blocked for N segments
```

---

## FILE FORMAT RECOMMENDATIONS

### Option A: JSON (Recommended for API)
```
/data
  /characters
    chen_wei.json
    rosa_delgado.json
  /quests
    /main_story
      tier_0_awakening.json
    /side_quests
      lost_package.json
  /dialogue
    /pools
      ambient_hollows.json
    /conversations
      chen_intro.json
  /procedural
    job_templates.json
    encounters.json
    events.json
```

### Option B: YAML (Human-Readable Alternative)
```yaml
# chen_wei.yaml
id: chen_wei
type: main_cast
tier_range: [0, 10]
dialogue_pools:
  greeting:
    - "Job's on the board. Standard rates."
    - "Back again. Good. Consistent couriers are valuable."
```

### Option C: SQLite (For Complex Queries)
```sql
-- Characters table
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  type TEXT,
  tier_min INT,
  tier_max INT,
  data JSON
);

-- Dialogue lines table
CREATE TABLE dialogue_lines (
  id TEXT PRIMARY KEY,
  pool_id TEXT,
  speaker_id TEXT,
  text TEXT,
  conditions JSON,
  weight REAL
);

-- Flags table
CREATE TABLE flags (
  flag_name TEXT PRIMARY KEY,
  flag_type TEXT, -- boolean, integer, string
  default_value TEXT
);
```

---

## CONVERSION PIPELINE

### Markdown → JSON Conversion

```python
# Conceptual converter structure
class SurgeProtocolConverter:
    def convert_character(self, md_path):
        """Parse character markdown into structured JSON"""
        content = read_markdown(md_path)
        return {
            "id": extract_id(content),
            "dialogue_pools": extract_dialogue_sections(content),
            "relationships": extract_relationship_triggers(content),
            "voice_direction": extract_voice_notes(content)
        }

    def convert_quest(self, md_path):
        """Parse quest markdown into stage/branch structure"""
        content = read_markdown(md_path)
        return {
            "id": extract_id(content),
            "stages": parse_stages(content),
            "branches": parse_branches(content),
            "flags": extract_flags(content)
        }

    def convert_job_template(self, md_path):
        """Parse procedural job into generation template"""
        content = read_markdown(md_path)
        return {
            "id": extract_id(content),
            "variables": extract_variables(content),
            "dialogue_pools": extract_pools(content),
            "complications": extract_complications(content)
        }
```

---

## RECOMMENDED NEXT STEPS

### Phase 8: Implementation Preparation

**Week 1-2: Data Structure Finalization**
- Define canonical JSON schema for all content types
- Create validation scripts
- Build markdown → JSON converter

**Week 3-4: Gap Resolution**
- Expand branching_points system
- Create missing tier 8-10 quest extractions
- Fill world location gaps

**Week 5-6: API Development**
- Build content API endpoints
- Implement query/filter system
- Create runtime state management

**Week 7-8: Integration Testing**
- Paper playthrough with API
- Flag logic verification
- Dialogue flow testing

---

## SUMMARY

The Surge Protocol narrative system is **implementation-ready** with:
- ~355,000 words of structured content
- Clear tier-based progression (0-10)
- Comprehensive procedural systems
- Full voice production specs

**Recommended conversion priority**:
1. Characters → JSON (relationship system core)
2. Dialogue pools → JSON (most frequently accessed)
3. Job templates → JSON (procedural engine)
4. Quests → JSON (story progression)
5. World/systems → JSON (runtime state)

The markdown format serves as excellent source-of-truth documentation, while JSON/database conversion enables efficient runtime access.

---

*Implementation Review v1.0*
*Surge Protocol Narrative System*
*Ready for API conversion*
