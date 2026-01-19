# Blood and Oil

## Metadata
- **Quest ID**: RQ_ROSA_MIGUEL
- **Type**: RELATIONSHIP / MAJOR_SIDE
- **Tier Available**: 7+
- **Estimated Duration**: 20-30 minutes
- **Repeatable**: No
- **Romance Required**: No (but heavily impacts Rosa romance if active)

## Prerequisites
- **Quests Completed**: None required
- **Flags Required**: MET_ROSA, ROSA_RELATIONSHIP >= 40
- **Relationship Required**: Rosa 40+ (friend or higher)
- **Items Required**: None

## Quest Giver
- **NPC**: Rosa Delgado
- **Location**: The Hollows Station Garage
- **Trigger**: Visit Rosa after reaching Tier 7; Miguel's crisis has begun

## Synopsis
Rosa's younger brother Miguel, a Tier 4 courier, took a contract way above his rating—a corporate extraction job in hostile territory. His vehicle is wrecked, he's wounded, and corporate security is closing in. Rosa is desperate. She needs someone she trusts to extract Miguel before it's too late. This quest tests the player's commitment to Rosa and their competence under pressure.

---

## Act 1: The Call

### Hook

*When you enter the garage, something's wrong. Rosa isn't at her station. You hear her voice from the back office—strained, afraid.*

### Initial Dialogue

**NODE 1: Discovery**

*You find Rosa hunched over a comm terminal, hands shaking.*

**Rosa**: "Come on, Miguel. Answer me. Answer me!"

*She looks up, sees you, and her face shifts—hope and fear warring.*

**Rosa**: "It's my brother. Miguel. He's in trouble."

**NODE 2: Explanation**

**Rosa**: [rapid, scared] "He took a contract above his tier. Corporate extraction—some exec's data chip, hot zone in Uptown's maintenance levels. His vehicle got hit. He's pinned down, wounded, and corp security is sweeping the area."

*She grabs your arm.*

**Rosa**: "I can't— I can't get there in time. My vehicle won't make it past the checkpoints. But you— you're Tier 7. You can move through that space. Please."

**NODE 3: Player Response Hub**

**Option A**: "I'll get him. Where is he?" [COMMITTED]
- Effects: Quest accepts immediately
- Rosa: "Thank you. Thank you." [coordinates loaded]
- Relationship: +5
- → Act 2

**Option B**: "What happened exactly?" [INFORMATION]
- Effects: More context provided
- → NODE 4 (explanation)
- Then returns to choice

**Option C**: "Why did he take a contract he couldn't handle?" [QUESTIONING]
- Effects: Rosa explains
- → NODE 5 (Miguel's motivation)
- Then returns to choice

**Option D**: "I don't know if I can help." [HESITANT]
- Effects: Rosa pleads
- → NODE 6 (desperate appeal)
- Can still accept or refuse after

**Option E**: "That's not my problem." [REFUSE]
- Effects: Quest refused
- Rosa: [devastated] "I thought... I thought you cared. About me. About anyone."
- Relationship: -30
- Romance: Severely damaged
- → Rosa goes herself (epilogue flag set)

### NODE 4: More Context

**Rosa**: "Corporate job. Some Nakamura exec wanted data extracted from a rival's system—Zhao-Tech maintenance hub. Should've been a Tier 6 minimum, but Miguel... he needed the credits. For chrome. For upgrades. He thought he could handle it."

*Her voice breaks.*

"He was wrong."

### NODE 5: Miguel's Motivation

**Rosa**: [bitter] "Because he's an idiot. Because he wants to be a big shot. Because he saw you—" [catches herself] "—saw other couriers climbing the ranks and thought chrome could shortcut him there."

*She wipes her eyes.*

"I tried to warn him. Same way I tried to warn you. Nobody listens."

### NODE 6: Desperate Appeal

**Rosa**: "Please. I know I'm asking a lot. I know it's dangerous. But he's my little brother. He's all the family I have left."

*She looks at you with raw vulnerability.*

"I'll owe you everything. Please."

**If Rosa Romance Active**:
**Rosa**: "If you care about me at all... please don't let him die."

---

## Act 2: The Extraction

### Mission Brief

**Location**: Zhao-Tech Maintenance Hub, Sub-level 3 (Uptown district boundary)
**Target**: Miguel Delgado (wounded, hiding in server alcove)
**Hostiles**: Zhao-Tech corporate security (6-8 active), automated drones (4+)
**Complications**:
- Miguel cannot move without help (leg injury)
- Security is methodically sweeping
- Time limit: 15 minutes before heavy reinforcements arrive
- Extraction vehicle needed for escape

### Entry Options

**Path A: Direct Assault** (Combat-focused)
- Clear a path through security
- Loud, fast, dangerous
- Skill checks: COMBAT (multiple), AGILITY
- Consequence: Alerts all security, harder exit

**Path B: Stealth Infiltration** (Stealth-focused)
- Move through maintenance tunnels
- Avoid patrols, disable cameras
- Skill checks: STEALTH (Hard), TECH (Moderate)
- Consequence: Quieter but slower, time pressure

**Path C: Social Engineering** (Talk-focused)
- Pose as Nakamura security responding to "incident"
- Requires corporate ID or bluff
- Skill checks: DECEPTION (Very Hard), PERCEPTION
- Consequence: Risk of being made, but fastest route

**Path D: Hacking Diversion** (Tech-focused)
- Remote access to facility systems
- Create false alarms, redirect security
- Skill checks: TECH (Hard), INTELLIGENCE
- Consequence: Window of opportunity, but limited duration

### Finding Miguel

*Regardless of approach, you find Miguel in a server alcove, bleeding, one leg twisted wrong.*

**Miguel**: [sees you, relief and fear] "You're Rosa's friend. The courier. Thank god."

*He tries to stand, fails, falls back.*

**Miguel**: "They got my leg. Dermal armor took the worst of it but— I can't walk. Not without help."

**NODE: Miguel Status**

**Option A**: "Can you move at all?" [ASSESS]
- Miguel: "If you support me, yeah. Slowly. The chrome's trying to compensate."

**Option B**: "What happened to the package?" [MISSION]
- Miguel: "I still have it." [pats chest] "The data chip. Client's expecting delivery."
- Opens sub-choice: Take chip yourself (+credits later) or leave it with Miguel

**Option C**: "Rosa sent me. Let's go." [ACTION]
- Immediate movement to extraction
- Skip dialogue for speed

### Extraction Complications

During extraction, one of the following triggers (based on entry method):

**Complication A: Security Ambush**
- Patrol stumbles onto your path
- Combat or talk your way out
- Miguel: "Behind us! They're behind us!"

**Complication B: Miguel's Condition Worsens**
- Rejection flare from his augments
- Need to stabilize him (MEDIC check) or he slows further
- Miguel: "My chrome's fighting me. Just leave me, I'll—" Rosa would never forgive you (if you do)

**Complication C: Algorithm Interference**
*If player has Algorithm integration:*
- [ALGORITHM]: "The efficient choice is to abandon the non-viable unit."
- Player can follow or resist Algorithm's suggestion
- Resisting: "I know what the efficient choice is. I'm making a different one."

**Complication D: Miguel's Confession**
*During a quiet moment:*
- Miguel: "I took this job for Rosa. She doesn't know. Her clinic, the one that removes chrome? It's in debt. I thought if I could just make enough credits..."
- Reveals new dimension to Miguel's motivation

### Exit Options

**Exit A: Vehicle Extraction**
- Your vehicle at extraction point
- Load Miguel, drive out
- Cleanest option, requires successful approach

**Exit B: On Foot Through Tunnels**
- Longer, more dangerous
- Miguel slowing you down
- Multiple stealth/combat checks
- Time pressure intensifies

**Exit C: Ally Intervention** (If Union reputation high)
- Union contacts create distraction
- Easier extraction
- Requires: UNION_RELATIONSHIP >= 50

**Exit D: Rosa's Gambit** (If player too slow)
- Rosa arrives in her barely-functional vehicle
- Provides distraction, nearly gets killed
- Player must save both siblings
- Dramatic but costly

---

## Act 3: Resolution

### Success Paths

#### Full Success: Miguel Rescued, Minimal Complications

**Return to Hollows**:

*Rosa is waiting outside the station. When she sees Miguel—alive, leaning on you—she breaks into a run.*

**Rosa**: "Miguel! Oh god, Miguel."

*She grabs him, hugging fiercely, then looks at you over his shoulder.*

**Rosa**: "You brought him home."

*She lets go of Miguel, crosses to you, and hugs you just as fiercely—or kisses you if romance is active.*

**Rosa**: "I don't know how to repay this. I don't—" [voice cracks] "Thank you."

**Effects**:
- Relationship: +25
- If Romance: +15 additional, deepens significantly
- Miguel becomes available as occasional ally
- Credits: 500 (Miguel's gratitude, from saved mission pay)
- Flag: MIGUEL_RESCUED

**Miguel**: [later, privately] "I know I screwed up. Rosa's gonna kill me slower than the corps would've. But... thank you. For coming for me."

**Option to reveal**: Miguel's clinic motivation
- If revealed to Rosa: Mixed reaction (angry he took the risk, touched he cared)

#### Partial Success: Miguel Rescued, Complications

*Same reunion, but tempered by costs:*

**If Miguel severely wounded**:
- Rosa: "He's alive. That's what matters." [but her eyes show fear for his future]
- Miguel will have permanent damage (slower, weaker)

**If Rosa came to help**:
- Rosa has minor injuries
- Rosa: "Don't lecture me. I couldn't just wait."
- Relationship: +20 (she respects you tried, but worried about her)

**If Package Lost**:
- Miguel loses his payment
- Miguel: "It's fine. I'm alive. Credits aren't everything."
- Rosa: [to player] "You chose my brother over the job. That means something."

### Failure Path: Miguel Dies

**Context**: Player took too long, failed critical checks, or made fatal tactical error

*You carry Miguel to the extraction point, but he's not breathing. The chrome kept his body moving past when he should have stopped.*

**Return to Rosa**:

**Rosa**: [sees your face, Miguel's body] "No. No. No no no—"

*She falls to her knees beside him.*

**Rosa**: "Miguel? Miguel, wake up. Please. Please wake up."

*She looks up at you.*

**Rosa**: [grief becoming anger] "You were supposed to save him. I trusted you."

**Effects**:
- Relationship: -40
- If Romance: Likely ends (-30 additional)
- Flag: MIGUEL_DIED
- Rosa becomes distant, grieving
- May refuse to speak to player for extended time

**If Player Made Reasonable Effort**:
- Later, Rosa will partially forgive: "I know you tried. I just... I can't look at you right now."
- Relationship can slowly recover
- Romance may be salvageable at great effort

**If Player Made Selfish Choice** (took package, left Miguel):
- Rosa: "You let him die for CREDITS?"
- Relationship: -60
- Romance: Permanently ended
- Rosa may become hostile

### Refused Path: Player Didn't Help

**Rosa Goes Alone**:

*You chose not to help. Later, you hear through the network:*

**Variant A (Rosa Succeeds)**:
- Rosa rescued Miguel alone
- Both injured but alive
- Rosa: [if you see her] "I handled it. Without you." [cold]
- Relationship: -20, trust damaged
- Romance: Severely strained

**Variant B (Rosa Fails)**:
- Rosa and Miguel both killed
- Chen: [grim] "Rosa's gone. Took a run at some corp facility trying to save her brother. Neither of them made it."
- Relationship: N/A (Rosa dead)
- Major story flag: ROSA_DEAD
- Player guilt dialogue available

---

## Epilogue Consequences

### If Miguel Lives

**Short Term**:
- Miguel recovers at Rosa's apartment
- Available for brief dialogue
- Expresses gratitude, shame for his choices

**Long Term**:
- Miguel drops to safer courier work
- May appear in future quests as minor ally
- Becomes more cautious about chrome

**If Player Revealed Clinic Motivation**:
- Rosa and Miguel have honest conversation about money, fear
- Their relationship strengthens
- Rosa: [to player] "You gave us something. The chance to actually talk."

### If Miguel Dies

**Rosa's Arc**:
- Rosa's voice lines become sadder, more distant
- Workshop dialogue less warm
- References Miguel in past tense
- May affect willingness for romance commitment

**Tier 9 Impact**:
- If romance active and Miguel died, Rosa's ultimatum is harder
- Rosa: "I've already lost everyone I love. I don't know if I can do this."

### Regardless of Outcome

**Chen's Observation**:
- Chen: [if Miguel lived] "You did good, kid. Rosa's lucky to have someone like you."
- Chen: [if Miguel died] "Some jobs, you can't win. Don't let it hollow you."

---

## Side Quest: The Data Chip

*If player took or completed Miguel's contract*

**Option 1: Deliver to Client**
- Credits: 800
- Nakamura reputation: +10
- Miguel: "At least the job wasn't for nothing."

**Option 2: Sell to Competing Bidder**
- Credits: 1,200
- Nakamura reputation: -15
- Ethical question: Was this Miguel's risk for your profit?

**Option 3: Give Chip to Miguel**
- Credits: 0
- Miguel: "I owe you twice over now."
- Relationship: +10 with Miguel (future benefits possible)

**Option 4: Destroy Chip**
- Credits: 0
- Flag: CHIP_DESTROYED
- Prevents corporate data from causing further harm
- Rosa: [if told] "That's the kind of person I hoped you were."

---

## Dialogue Line Estimates

| Character | Lines |
|-----------|-------|
| Rosa | 60 |
| Miguel | 45 |
| Corporate Security | 15 |
| Algorithm | 8 |
| Chen | 5 |
| **Total** | **133** |

---

## Voice Acting Notes

### Rosa
- Opens with panic, desperation
- Reunion: overwhelming relief
- If Miguel dies: grief shifting to anger
- Range needed: fear, love, grief, gratitude, anger

### Miguel
- Young (mid-20s), cocky turned humbled
- In pain but trying to be tough
- Ashamed of his choices
- Grateful for rescue

### Corporate Security
- Professional callouts
- "Contact!", "Sector clear", "Target located"
- No personality—interchangeable voices

---

## Story Flags

### Checks
- MET_ROSA
- ROSA_RELATIONSHIP >= 40
- UNION_RELATIONSHIP (for optional ally)
- ALGORITHM_INTEGRATED (for dialogue variant)

### Sets
- MIGUEL_RESCUED / MIGUEL_DIED / MIGUEL_INJURED
- ROSA_GAMBIT (if she came to help)
- ROSA_REFUSED (if player said no)
- ROSA_DEAD (worst case)
- MIGUEL_CLINIC_REVEAL (if motivation revealed)
- CHIP_DELIVERED / CHIP_SOLD / CHIP_GIVEN / CHIP_DESTROYED

---

## Thematic Notes

This quest is about:
1. **Stakes of Relationship**: Proving actions matter more than words
2. **Family and Sacrifice**: What people risk for those they love
3. **Consequences of Chrome**: Miguel's choices led him here
4. **Player's Values Tested**: Will you help when it's hard?

The outcome directly shapes Rosa's emotional state and romance viability for the rest of the game.
