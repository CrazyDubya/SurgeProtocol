# SURGE PROTOCOL: Rules Engine
## Complete Mechanical Systems Reference

---

# 1. CORE RESOLUTION SYSTEM

## 1.1 The 2d6 Engine

All contested actions use **2d6 + Modifiers vs Target Number (TN)**

```
ROLL = 2d6 + Attribute Modifier + Skill Level + Situational Modifiers
```

### Result Interpretation

| Roll vs TN | Result | Keyword |
|------------|--------|---------|
| TN - 5 or worse | Critical Failure | CATASTROPHE |
| TN - 4 to TN - 1 | Failure | MISS |
| TN exactly | Partial Success | GRAZE |
| TN + 1 to TN + 4 | Success | HIT |
| TN + 5 or better | Critical Success | PERFECT |

### Natural Rolls (Before Modifiers)

| 2d6 Result | Special Effect |
|------------|----------------|
| 2 (Snake Eyes) | Auto-fail + Complication |
| 12 (Boxcars) | Auto-success + Bonus |

## 1.2 Attribute Modifiers

Attributes range 1-20. Modifier = (Attribute - 10) / 2, rounded down.

| Attribute | Modifier |
|-----------|----------|
| 1 | -5 |
| 2-3 | -4 |
| 4-5 | -3 |
| 6-7 | -2 |
| 8-9 | -1 |
| 10-11 | +0 |
| 12-13 | +1 |
| 14-15 | +2 |
| 16-17 | +3 |
| 18-19 | +4 |
| 20 | +5 |

## 1.3 Skill Levels

Skills range 0-10. Skill level adds directly to roll.

| Level | Name | Typical Tier |
|-------|------|--------------|
| 0 | Untrained | - |
| 1-2 | Novice | T1-2 |
| 3-4 | Competent | T3-4 |
| 5-6 | Professional | T5-6 |
| 7-8 | Expert | T7-8 |
| 9-10 | Master | T9-10 |

## 1.4 Target Numbers

| Difficulty | TN | Example |
|------------|-----|---------|
| Trivial | 4 | Remember your own address |
| Easy | 6 | Navigate familiar route |
| Routine | 8 | Standard delivery in good conditions |
| Moderate | 10 | Delivery with minor complication |
| Challenging | 12 | Express delivery in traffic |
| Hard | 14 | Hazmat in hostile territory |
| Very Hard | 16 | Black ops extraction |
| Extreme | 18 | Tier 10 mission requirements |
| Legendary | 20 | Should be impossible |

## 1.5 Situational Modifiers

### Positive Modifiers
| Condition | Modifier |
|-----------|----------|
| Proper tools/equipment | +1 |
| Excellent tools/equipment | +2 |
| Augment bonus (per relevant augment) | +1 to +3 |
| Assisted by ally | +2 |
| Prepared/planned action | +1 |
| Track specialization applies | +2 |
| Ideal conditions | +1 |

### Negative Modifiers
| Condition | Modifier |
|-----------|----------|
| Improvised tools | -1 |
| No tools when required | -3 |
| Distracted/rushed | -1 |
| Injured (per wound level) | -1 to -3 |
| Poor conditions | -1 |
| Terrible conditions | -2 |
| Hostile environment | -2 |
| Working against specialization | -2 |

---

# 2. SKILL CHECKS

## 2.1 Standard Skill Check

```
Roll = 2d6 + Attribute Mod + Skill Level + Mods
Compare to TN
```

### Example: Delivery Navigation
```
Situation: Navigate through unfamiliar district
Skill: Local Area (governed by PRC)
Character: PRC 14 (+2), Local Area 4
TN: 10 (Moderate - unfamiliar area)
Roll: 2d6 + 2 + 4 = 2d6 + 6
Need: 4+ on dice to succeed
```

## 2.2 Opposed Checks

Both parties roll. Higher total wins. Ties favor defender/status quo.

```
Attacker: 2d6 + Mods
Defender: 2d6 + Mods
Winner: Higher total
Margin: Difference between totals
```

### Example: Evading Police
```
Courier: 2d6 + AGI mod (+2) + Stealth 5 = 2d6 + 7
Police: 2d6 + PRC mod (+1) + Perception 4 = 2d6 + 5
Courier advantage: +2 on average
```

## 2.3 Extended Checks (Complex Tasks)

For tasks requiring sustained effort:

```
Required Successes: Based on complexity (3-10)
Time per Attempt: Based on task
Failure Threshold: Max failures before task fails entirely
```

| Complexity | Successes Needed | Max Failures |
|------------|------------------|--------------|
| Simple | 3 | 3 |
| Moderate | 5 | 3 |
| Complex | 7 | 4 |
| Elaborate | 10 | 5 |

### Example: Hacking a Corporate Server
```
Complexity: Complex (7 successes, 4 max failures)
TN: 14 (Hard)
Time: 1 minute per attempt
Character rolls until 7 successes OR 4 failures
```

## 2.4 Group Checks

When multiple characters attempt same task:

```
Method A (Everyone must succeed): All roll, all must meet TN
Method B (One must succeed): All roll, one success = group success
Method C (Average): Take mean of all rolls, compare to TN
```

---

# 3. COMBAT SYSTEM

## 3.1 Initiative

```
Initiative = 2d6 + VEL mod + PRC mod + Augment bonuses
```

Combat proceeds in initiative order, highest first. Ties broken by:
1. Higher VEL
2. Higher PRC
3. Simultaneous action

## 3.2 Action Economy

Per round, each combatant gets:
- **1 Standard Action** (attack, use ability, complex interaction)
- **1 Move Action** (move up to speed, draw weapon, simple interaction)
- **1 Reaction** (defensive response, opportunity attack)
- **Unlimited Free Actions** (speak, drop item, look around)

### Action Conversions
- Standard → Move (gain extra move)
- Move → cannot convert to Standard
- Reaction → cannot convert

## 3.3 Attack Resolution

### Melee Attack
```
Roll: 2d6 + PWR mod + Melee skill + weapon mod
TN: Target's Defense (10 + AGI mod + armor bonus + cover)
```

### Ranged Attack
```
Roll: 2d6 + VEL mod + Firearms skill + weapon accuracy
TN: Target's Defense + Range penalty
```

### Range Penalties
| Range | Penalty |
|-------|---------|
| Point Blank (≤2m) | +2 bonus |
| Short (≤weapon short range) | +0 |
| Medium (≤weapon medium range) | -2 |
| Long (≤weapon long range) | -4 |
| Extreme (>long range) | -6 or impossible |

## 3.4 Damage Calculation

```
Damage = Weapon Base + Margin of Success + Attribute scaling
```

### Weapon Base Damage (Examples)
| Weapon Type | Base Damage | Scaling |
|-------------|-------------|---------|
| Light Pistol | 1d6+1 | +VEL/3 |
| Heavy Pistol | 2d6 | +VEL/3 |
| SMG | 1d6+2 | +VEL/3 |
| Assault Rifle | 2d6+2 | +VEL/2 |
| Shotgun (close) | 3d6 | +PWR/3 |
| Sniper | 2d6+4 | +PRC/2 |
| Light Melee | 1d6 | +PWR/2 |
| Heavy Melee | 2d6+1 | +PWR/2 |
| Unarmed | 1d6-1 | +PWR/2 |

### Margin Bonus
| Margin | Bonus Damage |
|--------|--------------|
| +1 to +2 | +1 |
| +3 to +4 | +2 |
| +5 to +6 | +3 |
| +7+ | +4 |

## 3.5 Damage Reduction

```
Final Damage = Raw Damage - Armor Value
Minimum damage = 1 (unless completely blocked)
```

### Armor Values
| Armor Type | Value | Notes |
|------------|-------|-------|
| Street Clothes | 0 | - |
| Reinforced Clothing | 2 | Concealable |
| Light Tactical | 4 | -1 AGI |
| Medium Tactical | 6 | -2 AGI |
| Heavy Tactical | 8 | -3 AGI, -2 VEL |
| Dermal Lattice (Aug) | +3 | Stacks with worn |
| Full Dermal (Aug) | +5 | Stacks with worn |

## 3.6 Health & Wounds

### Hit Points
```
Max HP = (END × 5) + (PWR × 2) + Tier bonus
Tier bonus = Tier × 3
```

### Example HP by Tier
| Tier | END 10, PWR 10 | END 14, PWR 12 |
|------|----------------|----------------|
| 1 | 50 + 20 + 3 = 73 | 70 + 24 + 3 = 97 |
| 5 | 50 + 20 + 15 = 85 | 70 + 24 + 15 = 109 |
| 10 | 50 + 20 + 30 = 100 | 70 + 24 + 30 = 124 |

### Wound Thresholds
| HP Remaining | Status | Effect |
|--------------|--------|--------|
| 100-76% | Healthy | None |
| 75-51% | Wounded | -1 to all rolls |
| 50-26% | Badly Wounded | -2 to all rolls |
| 25-1% | Critical | -3 to all rolls, half speed |
| 0 | Down | Unconscious, dying |
| -10 | Dead | Death (or cyberpsychosis trigger) |

### Recovery
| Method | HP Restored |
|--------|-------------|
| Short Rest (1 hour) | 1d6 + END mod |
| Long Rest (8 hours) | 2d6 + END mod × 2 |
| First Aid (skill check) | 1d6 per success margin |
| Medical Facility | Full heal (time varies) |
| Combat Stim | 2d6 immediate (temporary) |

## 3.7 Cover System

| Cover Type | Defense Bonus | HP |
|------------|---------------|-----|
| Light (furniture) | +2 | 10 |
| Medium (car door) | +4 | 25 |
| Heavy (concrete) | +6 | 50 |
| Full (total cover) | Cannot be targeted | - |

## 3.8 Special Combat Actions

| Action | Effect | Cost |
|--------|--------|------|
| Aim | +2 to next attack | Standard |
| All-Out Attack | +2 attack, -2 Defense until next turn | Standard |
| Defensive Stance | +2 Defense, cannot attack | Standard |
| Disengage | Move without provoking reactions | Move + Standard |
| Overwatch | Attack first enemy who moves in sight | Standard (held) |
| Suppressive Fire | Area denial, targets -2 to actions | Standard + ammo |

---

# 4. CARRIER RATING SYSTEM

## 4.1 Rating Formula

```
Carrier Rating = Σ(Component Score × Component Weight) × Tier Multiplier
Range: 0.000 to 1000.000
```

## 4.2 Rating Components

| Component | Code | Weight | Max Score |
|-----------|------|--------|-----------|
| Delivery Success Rate | DEL_SUC | 0.20 | 100 |
| Speed Performance | DEL_SPD | 0.15 | 100 |
| Customer Satisfaction | CUST_SAT | 0.15 | 100 |
| Package Integrity | PKG_INT | 0.10 | 100 |
| Route Efficiency | ROUTE_EFF | 0.10 | 100 |
| Availability Hours | AVAIL | 0.10 | 100 |
| Incident Rate (inverse) | INCIDENT | 0.10 | 100 |
| Special Missions | SPECIAL | 0.05 | 100 |
| Algorithm Trust | ALGO (T7+) | 0.025 | 100 |
| Network Contribution | NET (T9+) | 0.025 | 100 |

### Component Calculations

**Delivery Success Rate**
```
Score = (Successful Deliveries / Total Deliveries) × 100
Rolling window: Last 100 deliveries
```

**Speed Performance**
```
Score = Average(Actual Time / Expected Time) × 100
Capped at 100 (no bonus for extremely fast)
Penalty below 80% of expected time (suspicion)
```

**Customer Satisfaction**
```
Score = (Σ Star Ratings / Max Possible Stars) × 100
1-5 star system
Rolling window: Last 50 ratings
```

**Package Integrity**
```
Score = 100 - (Damage Incidents × 5)
Damage = any reported damage, fragile penalties doubled
```

**Route Efficiency**
```
Score = (Optimal Distance / Actual Distance) × 100
Optimal calculated by Algorithm
Bonus for discovering new efficient routes
```

**Availability**
```
Score = (Hours Online This Week / 40) × 100
Capped at 100
Below 20 hours = rating decay
```

**Incident Rate**
```
Score = 100 - (Incidents × 10)
Incidents = accidents, altercations, complaints, police contact
```

**Special Missions**
```
Score = (Special Completed / Special Offered) × 100
Only counts if offered at least 5
```

## 4.3 Tier Thresholds

| Tier | Min Rating | Sustain Rating | Title |
|------|------------|----------------|-------|
| 1 | 0.000 | N/A | Probationary |
| 2 | 50.000 | 40.000 | Provisional |
| 3 | 100.000 | 85.000 | Certified |
| 4 | 175.000 | 150.000 | Established |
| 5 | 275.000 | 240.000 | Professional |
| 6 | 400.000 | 350.000 | Specialist |
| 7 | 550.000 | 480.000 | Elite |
| 8 | 700.000 | 620.000 | Master |
| 9 | 850.000 | 770.000 | Apex |
| 10 | 950.000 | 900.000 | Transcendent |

### Tier Loss
If rating drops below Sustain threshold for 7 consecutive days:
- Warning at day 3
- Demotion at day 7
- Cannot drop more than 1 tier per week

## 4.4 Rating Decay

```
Daily Decay = Base Decay × Inactivity Multiplier
```

| Days Inactive | Multiplier |
|---------------|------------|
| 1 | 0.5 |
| 2-3 | 1.0 |
| 4-7 | 1.5 |
| 8-14 | 2.0 |
| 15+ | 3.0 |

| Tier | Base Decay/Day |
|------|----------------|
| 1-3 | 0.5 |
| 4-6 | 1.0 |
| 7-8 | 1.5 |
| 9-10 | 2.0 |

## 4.5 Rating Modifiers

### Positive
| Action | Rating Change |
|--------|---------------|
| Perfect delivery (5 stars, on time, no damage) | +0.5 |
| Express delivery under time | +0.3 |
| Handling complication successfully | +0.2 |
| Special mission complete | +1.0 |
| Customer compliment | +0.1 |
| Streak bonus (10 perfect in row) | +2.0 |

### Negative
| Action | Rating Change |
|--------|---------------|
| Failed delivery | -2.0 |
| Late delivery | -0.5 per 10% over time |
| Damaged package | -1.0 |
| Customer complaint | -0.5 |
| 1-star rating | -1.0 |
| Incident | -3.0 |
| Police involvement | -5.0 |
| Mission abandonment | -5.0 |

---

# 5. EXPERIENCE & PROGRESSION

## 5.1 XP Awards

### Mission XP
```
Base XP = Mission Difficulty × 10 × Tier Multiplier
```

| Difficulty | Base XP |
|------------|---------|
| Easy | 50 |
| Routine | 100 |
| Moderate | 150 |
| Challenging | 250 |
| Hard | 400 |
| Very Hard | 600 |
| Extreme | 1000 |

| Tier Multiplier | Range |
|-----------------|-------|
| T1-3 | 1.0 |
| T4-6 | 0.8 |
| T7-8 | 0.6 |
| T9-10 | 0.4 |

### Bonus XP
| Achievement | Bonus |
|-------------|-------|
| First completion of mission type | +50% |
| Perfect rating | +25% |
| Under time | +10% |
| Complication overcome | +25% |
| No damage taken | +10% |
| Discovery (new route/location) | +50 flat |

### Activity XP
| Activity | XP |
|----------|-----|
| Successful skill check (first per session) | 5 |
| Combat encounter survived | 25 |
| NPC relationship advanced | 20 |
| Lore discovered | 10 |
| Side objective completed | 30 |

## 5.2 Spending XP

### Attribute Increase
```
Cost = New Level × 50
```
| From → To | Cost |
|-----------|------|
| 10 → 11 | 550 |
| 11 → 12 | 600 |
| 14 → 15 | 750 |
| 19 → 20 | 1000 |

Max attribute = 15 + (Tier / 2), rounded down

### Skill Increase
```
Cost = New Level × 20
```
| From → To | Cost |
|-----------|------|
| 0 → 1 | 20 |
| 4 → 5 | 100 |
| 9 → 10 | 200 |

Max skill = 5 + (Tier / 2), rounded down

### Ability Purchase
| Ability Type | Cost |
|--------------|------|
| Basic (T1-3) | 100 |
| Intermediate (T4-6) | 250 |
| Advanced (T7-8) | 500 |
| Signature (T9-10) | 1000 |
| Ultimate | 2000 |

### Ability Upgrade
```
Cost = Current Rank × 150
```

## 5.3 Track Progression

### Track Selection (Tier 3)
- Free choice of one Track
- Grants 3 Track abilities (Basic tier)
- Unlocks Track-specific augments
- No XP cost

### Specialization Selection (Tier 6)
- Choose from 3 specs within Track
- Grants Signature Ability
- Grants Signature Passive
- No XP cost

### Cross-Training (Tier 6+)
```
Effectiveness = Base × Relationship Modifier
Natural Ally: 75%
Difficult Cross: 50%
Other: 60%
```

Cost to unlock cross-training:
```
Cost = 500 + (Target Ability Cost × 2)
```

---

# 6. HUMANITY SYSTEM

## 6.1 Humanity Score

```
Range: 0-100
Starting: 100
```

### Humanity Loss

| Source | Loss |
|--------|------|
| Minor augment (cochlear, basic eyes) | 3-5 |
| Moderate augment (limb enhancement) | 6-10 |
| Major augment (neural, organ replacement) | 11-15 |
| Experimental augment | 15-20 |
| Corrupted augment | 20-30 |
| Killing (first time) | 5 |
| Killing (subsequent) | 1-2 |
| Witnessing extreme violence | 1-3 |
| Memory extraction (self) | 10 |
| Memory sale | 5 |
| Consciousness fork | 15 |
| Extended Network immersion | 2 per hour |

### Humanity Recovery

| Method | Recovery |
|--------|----------|
| Human connection (meaningful conversation) | 1-2 |
| Therapy session | 3-5 |
| Humanity anchor use | 5-10 |
| Helping someone (no reward) | 1-2 |
| Experiencing art/nature | 1 |
| Romantic connection | 2-3 |
| Long rest in safe location | 1 |

### Humanity Anchors
Special items that restore humanity. Rare. Personal.
- Photo of loved one
- Physical memento
- Recorded message
- Meaningful object

Each anchor: 3 uses, 5-10 humanity per use

## 6.2 Humanity Thresholds

| Range | Status | Effects |
|-------|--------|---------|
| 80-100 | Baseline | None |
| 60-79 | Chrome-Touched | Dreams glitch. -1 EMP |
| 40-59 | Wired | Emotional blunting. -2 EMP, +1 INT |
| 20-39 | Ghost | Identity confusion. -3 EMP, +2 INT, paranoia triggers |
| 1-19 | Edge | Violent episode chance. -4 EMP, +3 INT, dissociation |
| 0 | Cyberpsycho | Character becomes NPC hostile. Game over or special recovery quest |

### Threshold Crossing Events

When crossing a threshold (going down), trigger Humanity Event:
1. Roll 2d6
2. On 2-4: Immediate episode (lost time, violence, fugue)
3. On 5-9: Disturbing moment (hallucination, paranoia, emotional break)
4. On 10-12: Managed (internal struggle only, no external effect)

## 6.3 Cyberpsychosis Episodes

When Episode triggers:
```
Severity = 2d6 - (Current Humanity / 10)
```

| Severity | Episode Type | Duration |
|----------|--------------|----------|
| ≤2 | Flash (moment of confusion) | Seconds |
| 3-5 | Minor (paranoid outburst) | Minutes |
| 6-8 | Moderate (violent incident) | Hour |
| 9-11 | Major (rampage) | Hours |
| 12+ | Complete break | Permanent without intervention |

---

# 7. MISSION MECHANICS

## 7.1 Mission Generation

### Difficulty Calculation
```
Base Difficulty = Destination Distance × Cargo Modifier × Time Modifier
```

| Distance | Base |
|----------|------|
| <5 km | Easy (6) |
| 5-15 km | Routine (8) |
| 15-30 km | Moderate (10) |
| 30-50 km | Challenging (12) |
| >50 km | Hard (14) |

| Cargo Type | Modifier |
|------------|----------|
| Standard | ×1.0 |
| Fragile | ×1.2 |
| Perishable | ×1.3 |
| Hazmat | ×1.5 |
| Illegal | ×1.5 |
| Person | ×1.4 |

| Time Pressure | Modifier |
|---------------|----------|
| Standard | ×1.0 |
| Express | ×1.3 |
| Rush | ×1.5 |
| Emergency | ×1.8 |

## 7.2 Travel Resolution

### Simple Travel (No Complications)
```
Roll: 2d6 + Driving/Piloting + VEL mod
TN: Route Difficulty
Success: Arrive on time
Failure: Delay (margin × 5 minutes)
```

### Complex Travel (With Complications)
Each leg of journey may trigger complication check:
```
Complication Chance = 10% + (5% × Tier) + Modifiers
```

| Modifier | Change |
|----------|--------|
| High-danger route | +20% |
| Low-danger route | -10% |
| Bad weather | +15% |
| Night | +10% |
| Illegal cargo | +20% |
| Police alert | +25% |

## 7.3 Complication Resolution

When complication triggers:
1. Roll on Complication Table (weighted by type)
2. Resolve through skill checks, combat, or choice
3. Apply consequences

### Example Complications

**Traffic Jam (Common)**
```
TN: 8 (Local Area check)
Success: Find alternate route, -5 min
Failure: Stuck, +10 min per failure margin
```

**Police Checkpoint (Uncommon)**
```
Options:
A) Stop and comply - Delay + cargo inspection
B) Avoid - Stealth check TN 12
C) Run - Chase sequence begins
```

**Rival Courier (Rare)**
```
TN: Opposed check (their Rating/100)
Winner: Completes delivery
Loser: Mission failed OR must find alternate
```

**Ambush (Rare)**
```
Combat encounter
Enemies: 2-4 based on cargo value
Win: Continue with potential damage
Lose: Cargo lost, health damage
```

## 7.4 Delivery Completion

```
Final Rating = Base + Time Modifier + Condition Modifier + Customer Roll
```

### Time Rating
| Arrival | Modifier |
|---------|----------|
| >20% early | +0.2 (suspicious if too early) |
| 10-20% early | +0.3 |
| 1-10% early | +0.2 |
| On time (±1%) | +0.5 (perfect) |
| 1-10% late | -0.1 |
| 10-20% late | -0.3 |
| 20-50% late | -0.5 |
| >50% late | -1.0 + mission fail risk |

### Condition Rating
| Cargo State | Modifier |
|-------------|----------|
| Perfect | +0.2 |
| Good (>90%) | +0.0 |
| Acceptable (75-90%) | -0.2 |
| Damaged (50-75%) | -0.5 |
| Badly Damaged (<50%) | -1.0 + mission fail |
| Destroyed | Mission fail |

### Customer Roll
```
Roll: 2d6 (unmodified, represents customer mood)
2-4: Harsh (-0.3 to rating)
5-9: Normal (+0.0)
10-12: Generous (+0.2)
```

---

# 8. ECONOMY SYSTEM

## 8.1 Currency

**Credits (₡)** - Primary currency
```
1 ₡ = 1 USD equivalent (2037 values)
```

## 8.2 Mission Pay

```
Base Pay = Distance Pay + Cargo Pay + Difficulty Pay
Final Pay = Base Pay × Rating Multiplier × Tip
```

### Distance Pay
| Distance | Pay |
|----------|-----|
| <5 km | ₡15-25 |
| 5-15 km | ₡25-50 |
| 15-30 km | ₡50-100 |
| 30-50 km | ₡100-200 |
| >50 km | ₡200-500 |

### Cargo Pay
| Type | Bonus |
|------|-------|
| Standard | +0% |
| Fragile | +25% |
| Perishable | +30% |
| Hazmat | +75% |
| Illegal | +100-200% |
| Person | +100% |

### Difficulty Pay
| Rating | Bonus |
|--------|-------|
| Easy | +0% |
| Moderate | +25% |
| Hard | +50% |
| Very Hard | +100% |

### Rating Multiplier
| Tier | Multiplier |
|------|------------|
| 1 | 0.8 |
| 2 | 0.9 |
| 3 | 1.0 |
| 4 | 1.1 |
| 5 | 1.25 |
| 6 | 1.4 |
| 7 | 1.6 |
| 8 | 1.8 |
| 9 | 2.0 |
| 10 | 2.5 |

### Tips
```
Roll: 2d6
2-3: No tip (0%)
4-6: Small tip (5-10%)
7-9: Standard tip (15-20%)
10-11: Good tip (25-30%)
12: Great tip (40-50%)
```

Tip modifiers: +1 for high customer satisfaction history, -1 for complaints

## 8.3 Expenses

### Mandatory (Monthly)
| Expense | Cost |
|---------|------|
| Omnideliver Platform Fee | 15% of earnings |
| Equipment Rental (starter gear) | ₡200 |
| Basic Insurance | ₡150 |
| Transit Passes | ₡100 |

### Tier-Based
| Tier | Monthly Expenses |
|------|------------------|
| 1-2 | ₡450 base |
| 3-4 | ₡600 + augment maintenance |
| 5-6 | ₡900 + vehicle costs |
| 7-8 | ₡1500 + chrome maintenance |
| 9-10 | ₡3000+ |

### Augment Maintenance
```
Monthly Cost = Σ(Augment Tier × 25)
```

### Vehicle Costs
| Type | Monthly |
|------|---------|
| E-bike | ₡50 |
| Motorcycle | ₡150 |
| Car | ₡300 |
| Van | ₡400 |
| VTOL | ₡1000 |

## 8.4 Black Market Pricing

```
Black Market Price = Legal Price × Rarity Modifier × Heat Modifier
```

| Rarity | Modifier |
|--------|----------|
| Common | 0.9 |
| Uncommon | 1.0 |
| Rare | 1.3 |
| Prototype | 2.0 |
| Corrupted | 0.7 (dangerous) |

| Heat Level | Modifier |
|------------|----------|
| Cold | 1.0 |
| Warm | 1.2 |
| Hot | 1.5 |
| Burning | 2.0+ |

---

# 9. TIME SYSTEM

## 9.1 Time Scale

```
1 real second = 1 game minute (during missions)
1 real second = 1 game hour (during downtime)
```

Player can adjust time scale:
- **Real-time**: For immersive play
- **Compressed**: For faster progression
- **Paused**: For planning/reading

## 9.2 Day Structure

| Period | Hours | Modifiers |
|--------|-------|-----------|
| Night (Late) | 00:00-05:00 | -2 visibility, +20% danger, +25% pay |
| Dawn | 05:00-07:00 | Low traffic, neutral |
| Morning Rush | 07:00-09:00 | +50% traffic, +10% pay |
| Morning | 09:00-12:00 | Normal |
| Midday | 12:00-14:00 | High demand, normal traffic |
| Afternoon | 14:00-17:00 | Normal |
| Evening Rush | 17:00-19:00 | +75% traffic, +15% pay |
| Evening | 19:00-22:00 | +10% danger, +10% pay |
| Night | 22:00-00:00 | -1 visibility, +15% danger, +20% pay |

## 9.3 Weekly Cycle

| Day | Modifier |
|-----|----------|
| Monday | High corporate demand |
| Tuesday | Normal |
| Wednesday | Normal |
| Thursday | Normal |
| Friday | High demand, high traffic |
| Saturday | Moderate demand, low corporate |
| Sunday | Low demand, low traffic |

## 9.4 Rest & Recovery

### Short Rest (1 hour)
- Recover 1d6 + END mod HP
- Reset per-encounter abilities
- Clear minor conditions

### Long Rest (8 hours)
- Recover 2d6 + (END mod × 2) HP
- Reset daily abilities
- Clear moderate conditions
- Recover 1 Humanity (if in safe location)

### Full Recovery (24+ hours, medical facility)
- Full HP recovery
- Reset all abilities
- Clear most conditions
- Augment maintenance available

---

# 10. QUICK REFERENCE

## 10.1 Core Roll
```
2d6 + Attribute Mod + Skill + Situational = Compare to TN
```

## 10.2 Result Ladder
- **2**: Auto-fail + complication
- **Below TN by 5+**: Catastrophe
- **Below TN**: Failure  
- **Equal TN**: Partial success
- **Above TN**: Success
- **Above TN by 5+**: Critical success
- **12**: Auto-success + bonus

## 10.3 Common TNs
- Trivial: 4
- Easy: 6
- Routine: 8
- Moderate: 10
- Challenging: 12
- Hard: 14
- Very Hard: 16
- Extreme: 18
- Legendary: 20

## 10.4 Combat Sequence
1. Roll Initiative (2d6 + VEL + PRC)
2. Highest acts first
3. Standard + Move + Reaction per turn
4. Attack: 2d6 + Attribute + Skill vs Defense
5. Damage: Weapon Base + Margin - Armor
6. Track HP, apply wound penalties
7. Repeat until resolved

## 10.5 Rating Formula
```
Rating = Σ(Component × Weight) 
Tier up at thresholds
Decay daily if inactive
```

## 10.6 Humanity Checkpoints
- 80+: Normal
- 60-79: Chrome-Touched (-1 EMP)
- 40-59: Wired (-2 EMP)
- 20-39: Ghost (-3 EMP)
- 1-19: Edge (-4 EMP)
- 0: Cyberpsychosis (game over/special quest)

---

**END OF RULES ENGINE**
Version 1.0
