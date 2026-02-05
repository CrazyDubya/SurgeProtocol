# Condition Syntax Quick Reference

## Purpose
Quick-reference guide for writers implementing conditional content in dialogue and quests.

---

## Basic Syntax

### Variable Types

| Type | Example | Description |
|------|---------|-------------|
| Boolean | `ALGORITHM_INTEGRATED` | True/false flag |
| Integer | `TIER >= 5` | Numeric comparison |
| String | `ENDING_CHOICE == "rogue"` | Text matching |

---

## Operators

### Comparison Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `==` | Equals | `TIER == 5` |
| `!=` | Not equals | `ENDING != "ascension"` |
| `>` | Greater than | `HUMANITY_SCORE > 50` |
| `>=` | Greater or equal | `RELATIONSHIP >= 40` |
| `<` | Less than | `CREDITS < 100` |
| `<=` | Less or equal | `TIER <= 3` |

### Logical Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `AND` | Both true | `TIER >= 5 AND MET_OKONKWO` |
| `OR` | Either true | `ROSA_DEAD OR ROSA_REFUSED` |
| `NOT` | Negation | `NOT ALGORITHM_INTEGRATED` |

### Special Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `BETWEEN` | Range check | `HUMANITY BETWEEN 40 AND 60` |
| `IN` | Set membership | `ENDING IN ["rogue", "third_path"]` |

---

## Common Patterns

### Check if player met NPC
```
MET_[NPC_NAME] == true
```

### Check relationship level
```
[NPC]_RELATIONSHIP >= [threshold]
```

### Check story progress
```
TIER >= [required_tier]
TIER_[N]_COMPLETE == true
```

### Check humanity range
```
HUMANITY_SCORE >= 60 AND HUMANITY_SCORE < 80
```

### Check faction standing
```
[FACTION]_RELATIONSHIP >= 50
```

### Check for installed augments
```
ALGORITHM_INTEGRATED == true
CORTICAL_STACK_INSTALLED == true
```

---

## Dialogue Condition Format

In dialogue files, use this format:

```markdown
**[Condition: CONDITION_EXPRESSION]**
"Dialogue text that only appears if condition is true."

**[Fallback]**
"Alternative dialogue if condition is false."
```

### Example

```markdown
**[Condition: CHEN_RELATIONSHIP >= 50 AND TIER >= 5]**
Chen: "There's something I've never told anyone. About my daughter..."

**[Fallback]**
Chen: "Perhaps another time. When we know each other better."
```

---

## Quest Availability Format

```markdown
## Prerequisites
- **Required Flags**: FLAG_1, FLAG_2
- **Required Relationship**: [NPC]_RELATIONSHIP >= [value]
- **Required Tier**: [tier]
- **Required Items**: ITEM_1, ITEM_2
- **Blocking Flags**: FLAG_THAT_PREVENTS_QUEST
```

### Example

```markdown
## Prerequisites
- **Required Flags**: MET_ROSA
- **Required Relationship**: ROSA_RELATIONSHIP >= 40
- **Required Tier**: 4
- **Required Items**: None
- **Blocking Flags**: ROSA_DEAD
```

---

## Option Gating Format

For dialogue options that require conditions:

```markdown
**Option A**: "Standard response"

**Option B** [Condition: CHARISMA >= 3]: "Persuasive response"
→ Requires Charisma 3+

**Option C** [Condition: GHOST_NETWORK_ACCESS]: "Underground contact response"
→ Requires Ghost Network membership
```

---

## Multi-Condition Examples

### Complex Quest Unlock
```
TIER >= 6
AND DISCOVERED_INTERSTITIAL == true
AND (OKONKWO_RELATIONSHIP >= 30 OR THIRD_PATH_HINTS >= 3)
AND NOT CHOSE_ASCENSION
```

### Ending Availability
```
TIER == 10
AND CHOSE_THIRD_PATH == true
AND HUMANITY_SCORE >= 20
AND MET_SOLOMON == true
AND ALGORITHM_INTEGRATED == true
```

### Romance Scene
```
ROSA_ROMANCE_ACTIVE == true
AND ROSA_ROMANCE_STAGE >= 3
AND NOT (MIGUEL_DIED AND ROSA_GAMBIT)
AND CURRENT_LOCATION == "Rosa's Shop"
```

---

## Threshold Quick Reference

### Relationship Thresholds

| Level | Value | Typical Content |
|-------|-------|-----------------|
| Acquaintance | 0+ | Basic dialogue |
| Friendly | 25+ | Personal info |
| Friend | 40+ | Side quests |
| Close | 60+ | Secrets revealed |
| Intimate | 75+ | Full trust |
| Romance-ready | 50+ | Romance option |

### Tier Content Gates

| Tier | Content Access |
|------|----------------|
| 0-2 | Tutorial, basic quests |
| 3-4 | Algorithm content, standard quests |
| 5-6 | Interstitial, Fork content |
| 7-8 | Faction recruitment, endgame prep |
| 9-10 | Endings, epilogues |

### Humanity Reaction Thresholds

| Humanity | NPC Reaction |
|----------|--------------|
| 80+ | Comfortable |
| 60-79 | Neutral |
| 40-59 | Uneasy |
| 20-39 | Afraid |
| <20 | Terrified |

---

## Error Prevention

### Common Mistakes

| Mistake | Correct Form |
|---------|--------------|
| `FLAG = true` | `FLAG == true` |
| `RELATION > 50` | `[NPC]_RELATIONSHIP > 50` |
| `TIER 5` | `TIER >= 5` or `TIER == 5` |
| `AND OR` | `AND` or `OR` (not both) |

### Validation Checklist

- [ ] All flag names match master list
- [ ] Comparison operators are correct
- [ ] Fallback content provided
- [ ] Range values make sense
- [ ] No impossible conditions (e.g., >100 for 0-100 range)

---

## Testing Conditions

When writing conditions, consider:

1. **What if condition is false?** - Provide fallback
2. **What if condition is partially met?** - Handle edge cases
3. **Can this create dead ends?** - Ensure alternative paths
4. **Is this testable?** - Can QA reach this state?

---

*Quick reference for narrative writers*
*See variable_system.md for complete documentation*
