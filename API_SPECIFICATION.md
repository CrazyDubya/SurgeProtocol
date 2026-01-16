# SURGE PROTOCOL: API Specification
## RESTful Endpoints + WebSocket Events
### Version 1.0 (MVP)

---

# 1. OVERVIEW

## 1.1 Architecture

```
CLIENT (Web/Mobile)
    ↓ HTTPS
API GATEWAY (Cloudflare Workers)
    ↓
┌─────────────────────────────────────────────┐
│  CORE SERVICES                              │
│  ├── Auth Service (Clerk/Auth0)             │
│  ├── Character Service                      │
│  ├── Mission Service                        │
│  ├── World Service                          │
│  ├── Combat Service                         │
│  ├── Economy Service                        │
│  └── Faction Service                        │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│  DATA LAYER                                 │
│  ├── D1 (SQLite) - Player data, saves       │
│  ├── KV - Sessions, cache, leaderboards     │
│  ├── Durable Objects - Shared world state   │
│  └── R2 - Assets, large content             │
└─────────────────────────────────────────────┘
    ↓
WEBSOCKET (Durable Objects)
    ↓
CLIENT (Real-time updates)
```

## 1.2 Base URL

```
Production: https://api.surgeprotocol.game/v1
Staging: https://staging-api.surgeprotocol.game/v1
```

## 1.3 Authentication

All endpoints require Bearer token:
```
Authorization: Bearer <jwt_token>
```

## 1.4 Common Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2037-03-15T14:32:00Z",
    "request_id": "req_abc123",
    "game_time": "2037-03-15T22:45:00Z"
  },
  "errors": []
}
```

---

# 2. CHARACTER ENDPOINTS

## 2.1 Create Character

```
POST /characters
```

### Request
```json
{
  "name": "Marcus Chen",
  "origin": "STREET_KID",
  "attributes": {
    "PWR": 10,
    "AGI": 12,
    "END": 11,
    "INT": 10,
    "WIS": 9,
    "EMP": 12,
    "VEL": 13,
    "PRC": 11
  },
  "background": {
    "age": 24,
    "district": "the_hollows",
    "motivation": "FAMILY",
    "debt_amount": 15000
  }
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "character": {
      "id": "char_7x8k2m",
      "name": "Marcus Chen",
      "tier": 1,
      "rating": 0.000,
      "humanity": 100,
      "hp": {
        "current": 73,
        "max": 73
      },
      "credits": 50,
      "origin": "STREET_KID",
      "origin_bonus": "+1 to Streetwise, +1 to Local Area (home district)",
      "attributes": {
        "PWR": { "base": 10, "modified": 10, "modifier": 0 },
        "AGI": { "base": 12, "modified": 12, "modifier": 1 },
        "END": { "base": 11, "modified": 11, "modifier": 0 },
        "INT": { "base": 10, "modified": 10, "modifier": 0 },
        "WIS": { "base": 9, "modified": 9, "modifier": -1 },
        "EMP": { "base": 12, "modified": 12, "modifier": 1 },
        "VEL": { "base": 13, "modified": 13, "modifier": 1 },
        "PRC": { "base": 11, "modified": 11, "modifier": 0 }
      },
      "derived": {
        "defense": 11,
        "initiative_bonus": 1,
        "carry_capacity": 50,
        "movement_speed": 13
      },
      "skills": {
        "streetwise": 1,
        "local_area_the_hollows": 1
      },
      "location": {
        "region": "metro_east",
        "district": "the_hollows",
        "block": "block_7",
        "coordinates": { "x": 234, "y": 891 }
      },
      "equipment": {
        "worn": {
          "torso": "worn_jacket",
          "feet": "running_shoes"
        },
        "tools": ["cracked_phone", "delivery_bag_basic"]
      },
      "status": {
        "conditions": [],
        "algorithm_trust": 50,
        "debt_remaining": 15000,
        "debt_weekly_payment": 200
      },
      "created_at": "2037-03-15T14:32:00Z"
    },
    "tutorial_available": true,
    "first_mission_id": "msn_tutorial_01"
  }
}
```

## 2.2 Get Character

```
GET /characters/{character_id}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "character": {
      "id": "char_7x8k2m",
      "name": "Marcus Chen",
      "tier": 3,
      "rating": 127.445,
      "rating_components": {
        "delivery_success": 94.2,
        "speed_performance": 88.7,
        "customer_satisfaction": 91.3,
        "package_integrity": 97.0,
        "route_efficiency": 85.4,
        "availability": 78.0,
        "incident_rate": 95.0,
        "special_missions": 100.0
      },
      "humanity": 95,
      "humanity_status": "BASELINE",
      "hp": { "current": 82, "max": 82 },
      "credits": 2847,
      "xp": {
        "current": 1240,
        "next_level": 1500
      },
      "augments": [
        {
          "id": "aug_cochlear_basic",
          "name": "OmniDeliver Cochlear Integration Patch",
          "slot": "ear_right",
          "tier": 3,
          "humanity_cost": 5,
          "effects": [
            "+1 Navigation checks",
            "Algorithm voice communication",
            "Real-time traffic updates"
          ],
          "maintenance_cost": 25,
          "manufacturer": "OmniDeliver Standard Issue"
        }
      ],
      "skills": {
        "streetwise": 3,
        "local_area_the_hollows": 4,
        "local_area_dockside": 2,
        "driving_bike": 3,
        "navigation": 3,
        "deception": 2,
        "athletics": 2
      },
      "abilities": [
        {
          "id": "abl_quick_route",
          "name": "Quick Route",
          "type": "ACTIVE",
          "cooldown": "1/mission",
          "effect": "Reroll one Navigation check"
        }
      ],
      "track": null,
      "specialization": null,
      "faction_standings": {
        "omnideliver": { "visible": 45, "hidden": 42 },
        "chrome_saints": { "visible": 12, "hidden": 15 },
        "red_tide": { "visible": -5, "hidden": -5 }
      },
      "statistics": {
        "total_deliveries": 247,
        "perfect_deliveries": 89,
        "total_distance_km": 1847.3,
        "total_earnings": 28450,
        "missions_failed": 12,
        "deaths": 0,
        "playtime_hours": 47.3
      }
    }
  }
}
```

## 2.3 Update Character (Level Up / Spend XP)

```
PATCH /characters/{character_id}
```

### Request (Increase Skill)
```json
{
  "action": "increase_skill",
  "skill_id": "navigation",
  "from_level": 3,
  "to_level": 4
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "xp_spent": 80,
    "xp_remaining": 1160,
    "skill_updated": {
      "id": "navigation",
      "old_level": 3,
      "new_level": 4,
      "next_increase_cost": 100
    },
    "message": "Navigation increased to 4. The city's patterns are becoming clearer."
  }
}
```

---

# 3. MISSION ENDPOINTS

## 3.1 Get Available Missions

```
GET /missions/available?character_id={id}&limit=10
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "missions": [
      {
        "id": "msn_8k2j4m",
        "type": "DELIVERY_STANDARD",
        "title": "Package to Meridian Heights",
        "description": "Standard delivery. Residential address. Customer expects professionalism.",
        "client": {
          "name": "Algorithm Assignment",
          "type": "ALGORITHM"
        },
        "cargo": {
          "type": "PACKAGE_MEDIUM",
          "description": "Sealed box, 2.3kg",
          "fragile": false,
          "perishable": false,
          "legal": true,
          "estimated_value": "₡200-500"
        },
        "pickup": {
          "location": "Chen's Electronics",
          "district": "night_market",
          "distance_from_player": 1.2
        },
        "destination": {
          "location": "Apt 1847, Tower C",
          "district": "meridian_heights",
          "distance_from_pickup": 8.4
        },
        "time_limit_minutes": 45,
        "difficulty": {
          "rating": "ROUTINE",
          "tn": 8,
          "factors": ["Light traffic expected", "Good route options"]
        },
        "pay": {
          "base": 42,
          "estimated_total": "₡45-55",
          "tier_multiplier": 1.0
        },
        "rating_impact": {
          "success": "+0.3 to +0.5",
          "failure": "-1.5 to -2.0"
        },
        "expires_in_seconds": 300,
        "recommended": true,
        "recommendation_reason": "Matches your route efficiency strengths"
      },
      {
        "id": "msn_9x7h3n",
        "type": "DELIVERY_EXPRESS",
        "title": "URGENT: Medical Supplies to Hollows Clinic",
        "description": "Time-critical medical delivery. Lives may depend on speed.",
        "client": {
          "name": "Dr. Yuki Tanaka",
          "type": "NPC_CONTACT",
          "relationship": "ACQUAINTANCE"
        },
        "cargo": {
          "type": "MEDICAL_URGENT",
          "description": "Temperature-controlled case, insulin",
          "fragile": true,
          "perishable": true,
          "legal": true,
          "special_requirements": ["Keep upright", "Maintain temp 2-8°C"],
          "estimated_value": "₡2000+"
        },
        "pickup": {
          "location": "Kira-Chen Distribution Hub",
          "district": "corporate_row",
          "distance_from_player": 4.7
        },
        "destination": {
          "location": "Hollows Free Clinic",
          "district": "the_hollows",
          "distance_from_pickup": 11.2
        },
        "time_limit_minutes": 25,
        "difficulty": {
          "rating": "CHALLENGING",
          "tn": 12,
          "factors": [
            "Tight time limit",
            "Must cross gang territory",
            "Fragile cargo",
            "Temperature sensitive"
          ]
        },
        "pay": {
          "base": 95,
          "estimated_total": "₡100-120",
          "tier_multiplier": 1.0,
          "bonus": "+₡25 if under 20 minutes"
        },
        "rating_impact": {
          "success": "+0.6 to +0.9",
          "failure": "-2.5 to -3.5"
        },
        "reputation_impact": {
          "chrome_saints": "+3 on success",
          "dr_tanaka": "+5 on success"
        },
        "expires_in_seconds": 180,
        "recommended": false,
        "warning": "High difficulty for your current skill level"
      },
      {
        "id": "msn_gray_2k4",
        "type": "DELIVERY_COVERT",
        "title": "[GRAY] Unmarked Package",
        "description": "No questions. No scanning. Double pay.",
        "client": {
          "name": "Unknown",
          "type": "BLACK_MARKET"
        },
        "cargo": {
          "type": "UNKNOWN_SEALED",
          "description": "Small case, warm to touch",
          "fragile": "UNKNOWN",
          "legal": false,
          "special_requirements": ["No scanning", "Direct handoff only"]
        },
        "pickup": {
          "location": "Alley behind Neon Dragon Casino",
          "district": "night_market",
          "distance_from_player": 0.8
        },
        "destination": {
          "location": "Pier 7, Unmarked Door",
          "district": "dockside",
          "distance_from_pickup": 6.3
        },
        "time_limit_minutes": 60,
        "difficulty": {
          "rating": "HARD",
          "tn": 14,
          "factors": [
            "Illegal cargo",
            "Unknown contents",
            "Police attention risk",
            "Unknown recipient"
          ]
        },
        "pay": {
          "base": 200,
          "estimated_total": "₡200 (cash, untaxed)",
          "tier_multiplier": "N/A"
        },
        "rating_impact": {
          "success": "+0.0 (off-network)",
          "failure": "N/A (but see consequences)"
        },
        "consequences": {
          "success": "Trace risk +5%, favor owed",
          "failure": "Unknown (client dependent)",
          "police_detection": "Rating -5.0, possible arrest"
        },
        "expires_in_seconds": 600,
        "recommended": false,
        "warning": "Gray market mission. Algorithm cannot assist. Proceed with caution."
      }
    ],
    "refresh_in_seconds": 120,
    "algorithm_message": "Three opportunities await, Marcus. The medical run would test your limits—but growth requires challenge."
  }
}
```

## 3.2 Accept Mission

```
POST /missions/{mission_id}/accept
```

### Request
```json
{
  "character_id": "char_7x8k2m"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "mission": {
      "id": "msn_9x7h3n",
      "status": "ACCEPTED",
      "accepted_at": "2037-03-15T14:35:00Z",
      "deadline": "2037-03-15T15:00:00Z",
      "time_remaining_seconds": 1500
    },
    "navigation": {
      "current_location": {
        "district": "the_hollows",
        "coordinates": { "x": 234, "y": 891 }
      },
      "pickup_location": {
        "name": "Kira-Chen Distribution Hub",
        "district": "corporate_row",
        "coordinates": { "x": 567, "y": 234 },
        "distance_km": 4.7,
        "estimated_time_minutes": 12
      },
      "suggested_route": {
        "id": "route_optimal_1",
        "type": "STREET",
        "waypoints": [
          { "name": "Hollows Main", "x": 240, "y": 850 },
          { "name": "Industrial Overpass", "x": 380, "y": 540 },
          { "name": "Corporate Gate 7", "x": 550, "y": 250 }
        ],
        "hazards": [
          {
            "type": "GANG_TERRITORY",
            "location": "Industrial Overpass",
            "faction": "red_tide",
            "your_standing": -5,
            "risk": "May demand toll or cause delay"
          }
        ],
        "traffic_level": "MODERATE",
        "estimated_time_minutes": 14
      },
      "alternative_routes": [
        {
          "id": "route_safe_1",
          "type": "STREET",
          "description": "Avoids Red Tide territory",
          "distance_km": 6.2,
          "estimated_time_minutes": 18,
          "hazards": []
        }
      ]
    },
    "algorithm_voice": "Route calculated. The direct path crosses Red Tide territory—they may be... unpleasant. The longer route is safer but tighter on time. Your choice, Marcus."
  }
}
```

## 3.3 Mission Actions

```
POST /missions/{mission_id}/action
```

### Request (Navigate)
```json
{
  "character_id": "char_7x8k2m",
  "action": "navigate",
  "route_id": "route_optimal_1",
  "to_waypoint": 1
}
```

### Response (200 OK) - Successful Navigation
```json
{
  "success": true,
  "data": {
    "action": "navigate",
    "result": "SUCCESS",
    "roll": {
      "dice": [4, 5],
      "base": 9,
      "modifiers": [
        { "source": "PRC", "value": 0 },
        { "source": "Navigation skill", "value": 4 },
        { "source": "Cochlear bonus", "value": 1 },
        { "source": "Traffic (moderate)", "value": -1 }
      ],
      "total": 13,
      "tn": 10,
      "margin": 3,
      "outcome": "SUCCESS"
    },
    "narrative": "You weave through the afternoon traffic with practiced ease. The Algorithm whispers shortcuts—a service alley here, a timing trick at the lights there. You arrive at Industrial Overpass two minutes ahead of estimate.",
    "position": {
      "waypoint": 1,
      "name": "Industrial Overpass",
      "coordinates": { "x": 380, "y": 540 },
      "time_elapsed_minutes": 6,
      "time_remaining_minutes": 19
    },
    "cargo_status": {
      "condition": 100,
      "temperature": "5°C (SAFE)",
      "notes": "Insulin stable"
    },
    "next_segment": {
      "to": "Corporate Gate 7",
      "distance_km": 2.1,
      "estimated_time": 6,
      "hazards": []
    },
    "complication_check": {
      "rolled": false,
      "reason": "No complication triggered"
    },
    "algorithm_voice": "Excellent efficiency. Temperature holding. Eight minutes to pickup window."
  }
}
```

### Response (200 OK) - Complication Triggered
```json
{
  "success": true,
  "data": {
    "action": "navigate",
    "result": "COMPLICATION",
    "roll": {
      "dice": [2, 3],
      "base": 5,
      "modifiers": [
        { "source": "PRC", "value": 0 },
        { "source": "Navigation skill", "value": 4 },
        { "source": "Cochlear bonus", "value": 1 },
        { "source": "Traffic (moderate)", "value": -1 }
      ],
      "total": 9,
      "tn": 10,
      "margin": -1,
      "outcome": "FAILURE"
    },
    "complication": {
      "id": "comp_gang_toll",
      "type": "GANG_INTERCEPT",
      "title": "Red Tide Checkpoint",
      "description": "Three figures in red-stained jackets step into the road ahead. The leader—a woman with chrome arms and a lazy smile—holds up a hand.",
      "dialogue": {
        "speaker": "Red Tide Enforcer",
        "text": "Nice day for a delivery, courier. This is our overpass. Toll's fifty creds, or you can take the long way around."
      },
      "options": [
        {
          "id": "opt_pay",
          "label": "Pay the toll",
          "action": "PAY",
          "cost": 50,
          "outcome_preview": "Safe passage, -₡50, minor delay",
          "skill_check": null
        },
        {
          "id": "opt_negotiate",
          "label": "\"I'm running medical supplies. Lives at stake.\"",
          "action": "NEGOTIATE",
          "skill_check": {
            "skill": "persuasion",
            "attribute": "EMP",
            "tn": 12,
            "your_bonus": 3,
            "success_preview": "Reduced toll or free passage",
            "failure_preview": "Toll increases to 75"
          }
        },
        {
          "id": "opt_intimidate",
          "label": "\"You know who I work for. Move.\"",
          "action": "INTIMIDATE",
          "skill_check": {
            "skill": "intimidation",
            "attribute": "PWR",
            "tn": 14,
            "your_bonus": 1,
            "success_preview": "Free passage, +reputation",
            "failure_preview": "Combat likely"
          }
        },
        {
          "id": "opt_run",
          "label": "Gun it and hope for the best",
          "action": "FLEE",
          "skill_check": {
            "skill": "driving",
            "attribute": "VEL",
            "tn": 14,
            "your_bonus": 4,
            "success_preview": "Escape, but they'll remember",
            "failure_preview": "Crash, cargo damage risk"
          }
        },
        {
          "id": "opt_fight",
          "label": "This isn't a request. [COMBAT]",
          "action": "COMBAT",
          "warning": "Initiates combat with 3 Red Tide Enforcers",
          "enemy_preview": {
            "count": 3,
            "average_tier": 2,
            "equipment": "Light weapons, reinforced clothing"
          }
        }
      ]
    },
    "time_pressure": {
      "time_elapsed_in_complication": 0,
      "each_option_time_cost": {
        "pay": 2,
        "negotiate": 3,
        "intimidate": 2,
        "run": 1,
        "fight": "5-15 (combat dependent)"
      },
      "time_remaining_minutes": 17
    },
    "algorithm_voice": "Unfortunate. Red Tide presence wasn't in my models—they've expanded. Options are limited, but the medical urgency might sway them. Your call, Marcus."
  }
}
```

### Request (Resolve Complication)
```json
{
  "character_id": "char_7x8k2m",
  "action": "resolve_complication",
  "complication_id": "comp_gang_toll",
  "option_id": "opt_negotiate"
}
```

### Response (200 OK) - Negotiation Success
```json
{
  "success": true,
  "data": {
    "action": "resolve_complication",
    "option": "negotiate",
    "roll": {
      "dice": [5, 6],
      "base": 11,
      "modifiers": [
        { "source": "EMP", "value": 1 },
        { "source": "Persuasion skill", "value": 2 },
        { "source": "Medical cargo (sympathy)", "value": 2 }
      ],
      "total": 16,
      "tn": 12,
      "margin": 4,
      "outcome": "SUCCESS"
    },
    "narrative": "The enforcer's eyes flick to the medical case strapped to your bike. Something shifts in her expression—humanity surfacing through the chrome.\n\n\"Medical run, huh?\" She steps aside, gesturing to her crew. \"My kid sister's diabetic. Go. But next time, you pay double.\"\n\n\"Thank you.\"\n\n\"Don't thank me. Just move. Clock's ticking.\"",
    "outcome": {
      "passage": "GRANTED",
      "cost": 0,
      "time_cost_minutes": 2,
      "reputation_change": {
        "red_tide": {
          "visible": 0,
          "hidden": 3,
          "note": "They'll remember you showed respect"
        }
      },
      "future_effect": "Red Tide disposition improved for this route"
    },
    "position": {
      "waypoint": 1,
      "cleared": true,
      "proceeding_to": "Corporate Gate 7"
    },
    "time_remaining_minutes": 15,
    "algorithm_voice": "Efficient resolution. Empathy as optimization—I'll note that in your profile. Fifteen minutes. You can still make this."
  }
}
```

## 3.4 Complete Mission

```
POST /missions/{mission_id}/complete
```

### Request
```json
{
  "character_id": "char_7x8k2m",
  "delivery_action": "hand_to_recipient"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "mission": {
      "id": "msn_9x7h3n",
      "status": "COMPLETED_SUCCESS",
      "completion_rating": "EXCELLENT"
    },
    "delivery": {
      "time_performance": {
        "limit_minutes": 25,
        "actual_minutes": 22,
        "percentage": 88,
        "rating": "EARLY",
        "bonus_earned": true
      },
      "cargo_condition": {
        "final_percentage": 100,
        "temperature_final": "4°C",
        "rating": "PERFECT"
      },
      "customer_reaction": {
        "roll": 10,
        "result": "GRATEFUL",
        "dialogue": "Dr. Tanaka takes the case with visible relief. 'Three minutes to spare. You may have just saved Mrs. Patterson's foot.' She presses something into your hand—extra credits. 'The clinic remembers its friends, courier.'"
      }
    },
    "rewards": {
      "credits": {
        "base_pay": 95,
        "time_bonus": 25,
        "condition_bonus": 10,
        "tip": 15,
        "platform_fee": -21.75,
        "total": 123.25
      },
      "rating_change": {
        "components": {
          "delivery_success": "+0.3",
          "speed_performance": "+0.2",
          "customer_satisfaction": "+0.3",
          "package_integrity": "+0.1"
        },
        "total": "+0.8",
        "new_rating": 128.245
      },
      "xp_earned": {
        "base": 150,
        "time_bonus": 25,
        "perfect_cargo": 15,
        "complication_overcome": 25,
        "total": 215
      },
      "reputation": {
        "chrome_saints": "+3 (clinic is under their protection)",
        "dr_tanaka": "+5 (personal contact)"
      },
      "achievements_progress": {
        "medical_miracle": {
          "description": "Complete 10 medical deliveries with 100% cargo integrity",
          "progress": "7/10"
        },
        "against_the_clock": {
          "description": "Complete 5 express deliveries under time limit",
          "progress": "12/5 ✓ COMPLETE"
        }
      }
    },
    "achievement_unlocked": {
      "id": "ach_against_clock",
      "name": "Against the Clock",
      "description": "Complete 5 express deliveries under time limit",
      "reward": "+50 XP, Title: 'Speed Demon'"
    },
    "narrative_epilogue": "The clinic doors swing shut behind you. Somewhere inside, a woman will keep her foot because you were fast enough, brave enough, human enough to talk your way past a gang checkpoint instead of fighting.\n\nThis is why you do this.\n\nThe Algorithm hums approval in your ear. For once, you don't mind.",
    "algorithm_voice": "Mission complete. Rating improved. Dr. Tanaka is now a contact—she may offer future work. And Marcus? Well done.",
    "next_actions": {
      "new_missions_available": 4,
      "suggested": "Rest recommended. You've been active for 6 hours.",
      "time_to_tier_4": "Approximately 47 more rating points"
    }
  }
}
```

---

# 4. COMBAT ENDPOINTS

## 4.1 Initialize Combat

```
POST /combat/initialize
```

### Request
```json
{
  "character_id": "char_7x8k2m",
  "trigger": "complication_fight",
  "complication_id": "comp_gang_toll",
  "enemies": ["red_tide_enforcer", "red_tide_enforcer", "red_tide_thug"]
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "combat": {
      "id": "cbt_4k8m2n",
      "status": "ACTIVE",
      "round": 1,
      "phase": "INITIATIVE"
    },
    "environment": {
      "location": "Industrial Overpass",
      "type": "URBAN_STREET",
      "lighting": "DAYLIGHT",
      "cover": [
        { "id": "cover_1", "type": "CONCRETE_BARRIER", "defense_bonus": 4, "hp": 50, "position": { "x": 2, "y": 0 } },
        { "id": "cover_2", "type": "DUMPSTER", "defense_bonus": 2, "hp": 25, "position": { "x": -1, "y": 2 } },
        { "id": "cover_3", "type": "VEHICLE_WRECK", "defense_bonus": 4, "hp": 40, "position": { "x": 3, "y": 3 } }
      ],
      "hazards": [],
      "escape_routes": [
        { "id": "escape_1", "direction": "SOUTH", "type": "STREET", "check_tn": 12 },
        { "id": "escape_2", "direction": "EAST", "type": "ALLEY", "check_tn": 10 }
      ]
    },
    "combatants": [
      {
        "id": "cmbt_player",
        "name": "Marcus Chen",
        "team": "PLAYER",
        "initiative": {
          "roll": [4, 6],
          "bonus": 2,
          "total": 12
        },
        "hp": { "current": 82, "max": 82 },
        "defense": 12,
        "position": { "x": 0, "y": 0 },
        "conditions": [],
        "actions_remaining": {
          "standard": 1,
          "move": 1,
          "reaction": 1
        },
        "weapons": [
          {
            "id": "wpn_knife",
            "name": "Utility Knife",
            "type": "MELEE_BLADE",
            "damage": "1d6+1",
            "attack_bonus": 2
          }
        ],
        "abilities_available": [
          {
            "id": "abl_quick_dodge",
            "name": "Quick Dodge",
            "type": "REACTION",
            "effect": "+2 Defense against one attack",
            "uses_remaining": 1
          }
        ]
      },
      {
        "id": "cmbt_enemy_1",
        "name": "Red Tide Enforcer (Leader)",
        "team": "ENEMY",
        "initiative": {
          "roll": [3, 4],
          "bonus": 3,
          "total": 10
        },
        "hp": { "current": 35, "max": 35 },
        "defense": 11,
        "position": { "x": 4, "y": 1 },
        "conditions": [],
        "visible_equipment": ["Chrome arms", "Heavy pistol", "Reinforced jacket"],
        "threat_assessment": "MEDIUM - Experienced fighter, chrome-enhanced strength"
      },
      {
        "id": "cmbt_enemy_2",
        "name": "Red Tide Enforcer",
        "team": "ENEMY",
        "initiative": {
          "roll": [2, 5],
          "bonus": 2,
          "total": 9
        },
        "hp": { "current": 30, "max": 30 },
        "defense": 10,
        "position": { "x": 3, "y": 2 },
        "conditions": [],
        "visible_equipment": ["SMG", "Street clothes"],
        "threat_assessment": "MEDIUM - Automatic weapon, poor armor"
      },
      {
        "id": "cmbt_enemy_3",
        "name": "Red Tide Thug",
        "team": "ENEMY",
        "initiative": {
          "roll": [1, 3],
          "bonus": 1,
          "total": 5
        },
        "hp": { "current": 20, "max": 20 },
        "defense": 9,
        "position": { "x": 5, "y": 0 },
        "conditions": [],
        "visible_equipment": ["Knife", "No armor"],
        "threat_assessment": "LOW - Inexperienced, poorly equipped"
      }
    ],
    "turn_order": [
      { "id": "cmbt_player", "initiative": 12 },
      { "id": "cmbt_enemy_1", "initiative": 10 },
      { "id": "cmbt_enemy_2", "initiative": 9 },
      { "id": "cmbt_enemy_3", "initiative": 5 }
    ],
    "current_turn": "cmbt_player",
    "narrative_intro": "The enforcer's smile vanishes. Chrome arms flex, servos whining. Her crew spreads out—the one with the SMG moving to flank, the thug pulling a knife.\n\n'Wrong choice, courier.'\n\nTime slows. Your knife is already in your hand. The Algorithm whispers target priorities. Everything else fades away.\n\nRoll for initiative.",
    "algorithm_voice": "Combat initiated. Three hostiles. Recommend: neutralize the SMG first—suppressive fire will limit your options. Cover available at your two o'clock."
  }
}
```

## 4.2 Combat Action

```
POST /combat/{combat_id}/action
```

### Request
```json
{
  "character_id": "char_7x8k2m",
  "action_type": "MOVE_AND_ATTACK",
  "move_to": { "x": 2, "y": 0 },
  "attack_target": "cmbt_enemy_2",
  "weapon": "wpn_knife"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "actions_resolved": [
      {
        "type": "MOVE",
        "from": { "x": 0, "y": 0 },
        "to": { "x": 2, "y": 0 },
        "narrative": "You sprint for the concrete barrier, sliding into cover."
      },
      {
        "type": "ATTACK",
        "attacker": "Marcus Chen",
        "target": "Red Tide Enforcer",
        "weapon": "Utility Knife",
        "roll": {
          "dice": [4, 5],
          "base": 9,
          "modifiers": [
            { "source": "AGI", "value": 1 },
            { "source": "Melee skill", "value": 2 },
            { "source": "Knife bonus", "value": 1 }
          ],
          "total": 13,
          "tn": 10,
          "margin": 3,
          "outcome": "HIT"
        },
        "damage": {
          "roll": "1d6+1",
          "result": 5,
          "margin_bonus": 2,
          "agility_bonus": 1,
          "total": 8,
          "armor_reduction": 2,
          "final": 6
        },
        "narrative": "You close the distance in a blur. The enforcer tries to bring his SMG around but you're inside his guard—your knife opens a gash across his forearm. He howls, weapon wavering."
      }
    ],
    "target_status": {
      "id": "cmbt_enemy_2",
      "hp": { "current": 24, "max": 30 },
      "wound_status": "WOUNDED",
      "conditions": ["BLEEDING (1 damage/round)"]
    },
    "player_status": {
      "position": { "x": 2, "y": 0 },
      "cover": "CONCRETE_BARRIER (+4 Defense)",
      "actions_remaining": { "standard": 0, "move": 0, "reaction": 1 }
    },
    "turn_complete": true,
    "next_turn": "cmbt_enemy_1",
    "enemy_turn_preview": "Red Tide Enforcer (Leader) is moving to flank your position...",
    "algorithm_voice": "Good hit. He's bleeding—pressure him and he'll break. Watch the leader—she's repositioning."
  }
}
```

## 4.3 Combat Resolution

```
POST /combat/{combat_id}/resolve
```

Called when combat ends (victory, defeat, flee, negotiate)

### Response (Victory)
```json
{
  "success": true,
  "data": {
    "combat": {
      "id": "cbt_4k8m2n",
      "status": "RESOLVED",
      "outcome": "VICTORY",
      "rounds": 4,
      "duration_minutes": 3
    },
    "player_final_status": {
      "hp": { "current": 58, "max": 82 },
      "hp_lost": 24,
      "conditions": ["WINDED (clears after short rest)"],
      "ammunition_used": 0,
      "abilities_used": ["Quick Dodge"]
    },
    "enemies_final": [
      { "id": "cmbt_enemy_1", "status": "INCAPACITATED", "hp": 0 },
      { "id": "cmbt_enemy_2", "status": "FLED", "hp": 12 },
      { "id": "cmbt_enemy_3", "status": "SURRENDERED", "hp": 8 }
    ],
    "loot": {
      "credits": 45,
      "items": [
        {
          "id": "itm_heavy_pistol",
          "name": "Tung-Chen Heavy Pistol",
          "type": "WEAPON",
          "condition": 75,
          "value": 180
        },
        {
          "id": "itm_stim_basic",
          "name": "Combat Stimulant",
          "type": "CONSUMABLE",
          "quantity": 2,
          "value": 25
        }
      ],
      "information": "The surrendered thug offers information about Red Tide patrol schedules in exchange for his life."
    },
    "consequences": {
      "reputation": {
        "red_tide": {
          "visible": -15,
          "hidden": -20,
          "note": "You've made enemies"
        }
      },
      "rating_impact": 0,
      "police_alert": false,
      "future_encounters": "Red Tide will remember this. Expect increased hostility on their turf."
    },
    "xp_earned": {
      "combat_victory": 75,
      "non_lethal_bonus": 25,
      "outnumbered_bonus": 15,
      "total": 115
    },
    "narrative_epilogue": "The last enforcer hits the ground, groaning. The leader's out cold—chrome arms sparking where your knife found the joints. The thug with the knife is on his knees, hands up, babbling about schedules and territories.\n\nYou're bleeding. Your hands are shaking. But you're alive.\n\n*This time.*",
    "mission_resume": {
      "time_lost_minutes": 8,
      "time_remaining_minutes": 9,
      "status": "CRITICAL - Very tight margin",
      "recommendation": "Immediate departure required"
    },
    "algorithm_voice": "Combat resolved. You're wounded—I'm adjusting route to avoid further conflict. Nine minutes. It'll be close, Marcus. Move."
  }
}
```

---

# 5. WORLD STATE ENDPOINTS

## 5.1 Get Current Location

```
GET /world/location?character_id={id}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "location": {
      "region": "metro_east",
      "district": {
        "id": "the_hollows",
        "name": "The Hollows",
        "type": "SLUM",
        "description": "Once-proud residential blocks now crumbling into poverty. Home to those who fell through the cracks—and those who choose to disappear.",
        "controlling_faction": {
          "id": "chrome_saints",
          "name": "Chrome Saints",
          "control_strength": 72,
          "disposition_to_player": "FRIENDLY"
        },
        "atmosphere": {
          "wealth": 2,
          "danger": 6,
          "population_density": 7,
          "corporate_presence": 1,
          "police_presence": 2
        }
      },
      "block": {
        "id": "block_7",
        "name": "Seventh Heaven",
        "local_name": "Sev",
        "description": "Your home turf. The dealers know your face, the kids know your name, the old folks nod when you pass.",
        "points_of_interest": [
          {
            "id": "poi_mama_lees",
            "name": "Mama Lee's Noodle House",
            "type": "RESTAURANT",
            "services": ["Food", "Rest", "Local gossip"],
            "hours": "06:00-02:00",
            "disposition": "FRIENDLY"
          },
          {
            "id": "poi_clinic",
            "name": "Hollows Free Clinic",
            "type": "MEDICAL",
            "services": ["Basic medical", "Augment maintenance", "Stim purchase"],
            "hours": "24/7",
            "disposition": "FRIENDLY",
            "contact": "Dr. Yuki Tanaka"
          },
          {
            "id": "poi_dead_drop",
            "name": "The Usual Spot",
            "type": "DEAD_DROP",
            "services": ["Gray market pickup", "Information exchange"],
            "hours": "20:00-04:00",
            "disposition": "NEUTRAL",
            "requires_reputation": "gray_contacts >= 1"
          }
        ]
      },
      "coordinates": { "x": 234, "y": 891 }
    },
    "current_time": {
      "game_time": "2037-03-15T22:47:00Z",
      "period": "NIGHT",
      "day_of_week": "MONDAY",
      "effects": [
        "-1 visibility",
        "+15% danger",
        "+20% pay for deliveries"
      ]
    },
    "weather": {
      "condition": "RAIN_LIGHT",
      "effects": [
        "-1 to vehicle handling",
        "0.9x visibility",
        "Fewer pedestrians"
      ],
      "forecast_4h": "Rain continuing"
    },
    "ambient": {
      "description": "Rain patters against neon signs. The usual crowd at Mama Lee's spills out under the awning, steam rising from noodle bowls. Somewhere, a baby cries. Somewhere else, music. The Hollows never really sleeps—it just changes shifts.",
      "sounds": ["rain", "distant_music", "conversation", "traffic_light"],
      "npcs_visible": 12,
      "vehicles_visible": 3
    },
    "events_nearby": [
      {
        "id": "evt_saints_patrol",
        "type": "FACTION_PATROL",
        "faction": "Chrome Saints",
        "disposition": "FRIENDLY",
        "distance_m": 50,
        "description": "Three Chrome Saints on their usual rounds. They nod as they pass."
      }
    ],
    "missions_available_here": 2,
    "algorithm_presence": {
      "signal_strength": "MODERATE",
      "voice_available": true,
      "surveillance_level": "LOW"
    }
  }
}
```

## 5.2 Get District Status

```
GET /world/districts/{district_id}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "district": {
      "id": "dockside",
      "name": "Dockside",
      "type": "INDUSTRIAL",
      "description": "Salt air and diesel fumes. The harbor's edge, where legal cargo and illegal cargo arrive on the same ships. The Red Tide runs these waters.",
      "territory_control": [
        {
          "faction": "Red Tide",
          "control_percentage": 65,
          "trend": "STABLE"
        },
        {
          "faction": "Harbor Authority",
          "control_percentage": 20,
          "trend": "DECLINING"
        },
        {
          "faction": "CONTESTED",
          "control_percentage": 15,
          "note": "Neon Dragons pushing for waterfront access"
        }
      ],
      "current_state": {
        "alert_level": "ELEVATED",
        "reason": "Recent Neon Dragon incursion",
        "effects": [
          "Increased Red Tide patrols",
          "Checkpoint probability +20%",
          "Smuggling missions paying 15% more"
        ]
      },
      "economy": {
        "average_mission_pay": "₡55",
        "mission_frequency": "HIGH",
        "black_market_activity": "VERY_HIGH",
        "police_presence": "LOW",
        "danger_rating": 7
      },
      "key_locations": [
        {
          "id": "loc_pier_7",
          "name": "Pier 7",
          "type": "BLACK_MARKET_HUB",
          "access": "GRAY_REPUTATION_REQUIRED"
        },
        {
          "id": "loc_fish_market",
          "name": "Dawn Fish Market",
          "type": "COVER_BUSINESS",
          "note": "Red Tide front operation"
        },
        {
          "id": "loc_harbor_auth",
          "name": "Harbor Authority Office",
          "type": "GOVERNMENT",
          "note": "Corrupt—accepts bribes"
        }
      ],
      "active_war": null,
      "player_standing": {
        "can_enter": true,
        "warnings": ["Red Tide disposition HOSTILE", "Recommend avoiding patrols"],
        "recommended_approach": "Fast transit, avoid main thoroughfares"
      }
    }
  }
}
```

## 5.3 Territory War Status (Server-Wide)

```
GET /world/wars
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "active_wars": [
      {
        "id": "war_nm_dock",
        "name": "Night Market-Dockside Conflict",
        "attacker": {
          "faction": "Neon Dragons",
          "war_score": 23,
          "recent_actions": [
            "Raid on Pier 3 (success)",
            "Bribery of Harbor official (success)"
          ]
        },
        "defender": {
          "faction": "Red Tide",
          "war_score": 31,
          "recent_actions": [
            "Ambush of Dragon convoy (success)",
            "Assassination attempt (failed)"
          ]
        },
        "contested_territory": [
          {
            "block": "Pier District",
            "current_control": "Red Tide (58%)",
            "trend": "DEFENDER_LOSING"
          }
        ],
        "started_at": "2037-03-12T00:00:00Z",
        "day": 4,
        "phase": "COMBAT",
        "player_participation": {
          "can_join_attacker": true,
          "can_join_defender": false,
          "reason_defender": "Your Red Tide reputation is HOSTILE"
        },
        "missions_available": 7,
        "server_event": {
          "name": "Harbor Conflict",
          "bonus_xp": "25%",
          "bonus_pay": "15%"
        }
      }
    ],
    "recent_resolutions": [
      {
        "war": "Industrial Takeover",
        "winner": "Chrome Saints",
        "loser": "Rust Brothers",
        "territory_changed": "Factory Block 7",
        "resolved_at": "2037-03-10T00:00:00Z"
      }
    ],
    "brewing_conflicts": [
      {
        "factions": ["Kira-Chen", "Independent Ripperdocs"],
        "territory": "Medical Row",
        "tension_level": 72,
        "estimated_time_to_war": "3-7 days"
      }
    ],
    "global_faction_power": [
      { "faction": "OmniDeliver", "power": 9847, "trend": "STABLE" },
      { "faction": "Neon Dragons", "power": 2341, "trend": "RISING" },
      { "faction": "Chrome Saints", "power": 1876, "trend": "RISING" },
      { "faction": "Red Tide", "power": 1654, "trend": "DECLINING" }
    ]
  }
}
```

---

# 6. ECONOMY ENDPOINTS

## 6.1 Get Character Finances

```
GET /economy/finances?character_id={id}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "finances": {
      "credits": {
        "available": 2847,
        "reserved": 0,
        "total": 2847
      },
      "income_this_week": {
        "mission_earnings": 1247,
        "tips": 156,
        "bonuses": 75,
        "gray_market": 200,
        "total": 1678
      },
      "expenses_this_week": {
        "platform_fee": 187.05,
        "equipment_rental": 200,
        "insurance": 150,
        "transit": 45,
        "augment_maintenance": 25,
        "medical": 0,
        "debt_payment": 200,
        "total": 807.05
      },
      "net_this_week": 870.95,
      "debt": {
        "total_remaining": 14200,
        "weekly_payment": 200,
        "interest_rate": "8% monthly",
        "payments_made": 4,
        "payments_remaining": 71,
        "next_payment_due": "2037-03-22T00:00:00Z",
        "creditor": "OmniDeliver Finance Division",
        "consequence_if_missed": "Rating penalty, increased interest"
      },
      "trends": {
        "average_daily_income": 239.71,
        "average_daily_expenses": 115.29,
        "projected_monthly_savings": 3732
      }
    },
    "financial_advice": "At current rate, debt payoff in ~16 months. Gray market income untaxed but risky—trace at 27%."
  }
}
```

## 6.2 Purchase Item

```
POST /economy/purchase
```

### Request
```json
{
  "character_id": "char_7x8k2m",
  "vendor_id": "vendor_saints_clinic",
  "item_id": "aug_iris_basic",
  "payment_method": "CREDITS"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "txn_8k2j4m",
      "type": "PURCHASE",
      "item": {
        "id": "aug_iris_basic",
        "name": "Kiroshi Optical Suite - Basic",
        "type": "AUGMENT",
        "category": "SENSORY",
        "slot": "eyes"
      },
      "vendor": {
        "id": "vendor_saints_clinic",
        "name": "Chrome Saints Street Clinic",
        "reputation_discount": "15%"
      },
      "pricing": {
        "base_price": 800,
        "reputation_discount": -120,
        "final_price": 680
      },
      "payment": {
        "method": "CREDITS",
        "amount": 680,
        "remaining_balance": 2167
      }
    },
    "item_received": {
      "id": "aug_iris_basic",
      "name": "Kiroshi Optical Suite - Basic",
      "status": "IN_INVENTORY",
      "note": "Requires installation at ripperdoc",
      "installation_cost": 150,
      "humanity_cost": 8,
      "effects_preview": [
        "+2 to Perception checks",
        "Low-light vision",
        "Zoom (3x)",
        "Basic threat detection"
      ]
    },
    "vendor_dialogue": "The doc examines the chrome with practiced eyes. 'Good choice. Basic, but reliable. Want me to slot it now, or you carrying?'"
  }
}
```

---

# 7. WEBSOCKET EVENTS

## 7.1 Connection

```javascript
const ws = new WebSocket('wss://api.surgeprotocol.game/v1/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: 'Bearer <jwt>',
    character_id: 'char_7x8k2m'
  }));
};
```

## 7.2 Event Types

### Server → Client

```typescript
// Time update (every game-minute)
{
  "type": "time_tick",
  "data": {
    "game_time": "2037-03-15T22:48:00Z",
    "period": "NIGHT",
    "weather": "RAIN_LIGHT"
  }
}

// Algorithm message (contextual)
{
  "type": "algorithm_voice",
  "data": {
    "message": "New mission available. Priority: medical. Shall I display details?",
    "priority": "MEDIUM",
    "context": "mission_available"
  }
}

// Mission timer update
{
  "type": "mission_timer",
  "data": {
    "mission_id": "msn_9x7h3n",
    "time_remaining_seconds": 847,
    "status": "ON_TRACK"
  }
}

// World event (server-wide)
{
  "type": "world_event",
  "data": {
    "event_id": "evt_war_update",
    "title": "Harbor Conflict Escalates",
    "description": "Neon Dragons have seized Pier 3. Red Tide calling for reinforcements.",
    "affects_player": true,
    "opportunities": ["war_mission_available"]
  }
}

// Combat update (during combat)
{
  "type": "combat_update",
  "data": {
    "combat_id": "cbt_4k8m2n",
    "current_turn": "cmbt_enemy_1",
    "action_preview": "Red Tide Enforcer is aiming at your position...",
    "threat_level": "HIGH"
  }
}

// Rating change
{
  "type": "rating_change",
  "data": {
    "old_rating": 127.445,
    "new_rating": 128.245,
    "change": 0.8,
    "reason": "Mission complete: Medical delivery",
    "tier_progress": "72% to Tier 4"
  }
}

// NPC message
{
  "type": "npc_message",
  "data": {
    "from": {
      "id": "npc_dr_tanaka",
      "name": "Dr. Yuki Tanaka",
      "relationship": "CONTACT"
    },
    "message": "Marcus—I have another run if you're interested. Less urgent, but good pay. Come by the clinic when you're free.",
    "mission_hint": true,
    "reply_available": true
  }
}

// Faction update
{
  "type": "faction_update",
  "data": {
    "faction_id": "red_tide",
    "update_type": "REPUTATION_CHANGE",
    "old_visible": -5,
    "new_visible": -20,
    "reason": "Combat engagement",
    "warning": "Red Tide now considers you HOSTILE"
  }
}

// Humanity warning
{
  "type": "humanity_warning",
  "data": {
    "current_humanity": 61,
    "threshold_approaching": "WIRED (60)",
    "message": "Your humanity is slipping. Consider rest, human connection, or therapy.",
    "suggestions": [
      "Visit Mama Lee's",
      "Call your mother",
      "Schedule therapy session"
    ]
  }
}
```

### Client → Server

```typescript
// Request mission refresh
{
  "type": "refresh_missions",
  "data": {
    "character_id": "char_7x8k2m"
  }
}

// Quick action (for simple commands)
{
  "type": "quick_action",
  "data": {
    "action": "rest",
    "duration": "short"
  }
}

// Reply to NPC
{
  "type": "npc_reply",
  "data": {
    "npc_id": "npc_dr_tanaka",
    "message": "On my way. Save me some coffee."
  }
}

// Algorithm query
{
  "type": "algorithm_query",
  "data": {
    "query": "What missions are available?",
    "context": "mission_selection"
  }
}
```

---

# 8. ERROR HANDLING

## 8.1 Error Response Format

```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "INSUFFICIENT_FUNDS",
      "message": "Not enough credits for this purchase",
      "details": {
        "required": 680,
        "available": 450,
        "shortfall": 230
      },
      "suggestions": [
        "Complete more missions",
        "Sell unused equipment",
        "Take a gray market job"
      ]
    }
  ],
  "meta": {
    "timestamp": "2037-03-15T14:32:00Z",
    "request_id": "req_abc123"
  }
}
```

## 8.2 Common Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| AUTH_REQUIRED | 401 | Missing or invalid token |
| AUTH_EXPIRED | 401 | Token expired |
| FORBIDDEN | 403 | Valid auth but not permitted |
| NOT_FOUND | 404 | Resource doesn't exist |
| CHARACTER_BUSY | 409 | Character in mission/combat |
| INSUFFICIENT_FUNDS | 422 | Not enough credits |
| SKILL_TOO_LOW | 422 | Skill requirement not met |
| TIER_TOO_LOW | 422 | Tier requirement not met |
| REPUTATION_TOO_LOW | 422 | Faction rep requirement not met |
| HUMANITY_TOO_LOW | 422 | Humanity requirement not met |
| MISSION_EXPIRED | 410 | Mission no longer available |
| COMBAT_INVALID_ACTION | 422 | Action not possible in combat state |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal error |

---

**END OF API SPECIFICATION**
