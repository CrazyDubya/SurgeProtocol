# High Stakes Sides - Tier 7 Side Quests

## Purpose
4 high-stakes side quests for Tier 7. Each involves significant consequences, faction implications, and choices that echo through the endgame. These are not casual missions—they're defining moments.

---

## QUEST 1: THE DEFECTOR'S BURDEN

### Overview
**Source**: Dr. Vera Antonova (via Oracle introduction)
**Type**: Extraction + Delivery
**Tier**: 7
**Stakes**: Corporate secrets, lives at risk

### Setup
**Dr. Antonova**: "The data I carry isn't complete. I have physical evidence—tissue samples, hardware fragments—but the research files are still inside Nakamura. On a secured server. In the research division where I used to work."

**Oracle's Assessment**: "Antonova's information could change everything. But getting the files means entering corporate territory. High security. High risk. High reward. This is the kind of job that makes or breaks elite couriers."

### The Mission

**Phase 1: Intelligence Gathering**
- Contact corporate insiders (David Park, Miranda Cole from Uptown)
- Map security rotations and access points
- Identify extraction routes
- Optional: Recruit help from other contacts

**Intel Sources**:
- **David Park**: "[Cautious] The research division is level 5 restricted. But maintenance has access codes that cycle every 48 hours. I can get you the next window."
- **Miranda Cole**: "[Interested] Research schedules... executives visit monthly for briefings. During those briefings, attention is focused. Elsewhere might be less watched."

**Phase 2: The Infiltration**
- Enter Nakamura Tower (multiple entry options)
- Navigate to Research Division Level 5
- Locate Server Room Beta-7
- Extract research files (physical media—can't risk network)

**Complications**:
- Security patrols (avoidable with good intel)
- Biometric checkpoints (require workarounds)
- Dr. Antonova's former colleagues (recognize her research access patterns)
- Time pressure (window closes)

**Phase 3: The Discovery**
*Upon reaching the server room, player finds something unexpected*

**Security Log** (visible on terminal):
"SUBJECT: Antonova, V. - FILES FLAGGED FOR MONITORING. Any access attempt will trigger immediate security response. Recommend using files as bait for defector recapture."

**Trap Alert**: The files are being watched. Downloading them will alert security—and possibly reveal Dr. Antonova's location.

**Choice Point**:
1. **Download anyway**: Get the files, accept pursuit risk
2. **Abort mission**: Leave without files, preserve safety
3. **Create diversion**: Download plus false trail, risky but possible
4. **Gather partial data**: Screenshots only, less complete but safer

### Resolution Branches

**Full Download**:
*Files acquired, but Nakamura now knows someone's helping Antonova*

**Antonova**: "You got them. [Reviewing] This is everything. This proves what they're doing. [Pause] But they'll come for us now. Both of us. Was it worth it?"

**Outcome**: Full evidence, active corporate pursuit begins.

**Abort**:
*Player returns without files*

**Antonova**: "[Disappointed but understanding] You made a judgment call. I can't argue with survival. But without the research files, my testimony is just testimony. Easier to dismiss."

**Outcome**: Antonova's credibility reduced, player stays safer.

**Diversion Tactic**:
*Files acquired, false trail created*

**Antonova**: "[Reviewing] You got them and covered the trail? [Impressed] Oracle said you were good. This proves it. We have time now. They'll be chasing ghosts."

**Outcome**: Full evidence, temporary safety. Diversion eventually discovered.

### Rewards
- Variable based on outcome
- `ANTONOVA_FILES_ACQUIRED` / `ANTONOVA_FILES_PARTIAL` / `ANTONOVA_FILES_NONE`
- Corporate heat level (if applicable)
- Oracle relationship +20 (completion) / +5 (smart abort)
- Major story implications for Convergence reveals

---

## QUEST 2: THE SUMMIT DELIVERY

### Overview
**Source**: Ambassador Yoshida
**Type**: Diplomatic delivery
**Tier**: 7
**Stakes**: Faction peace talks

### Setup
**Ambassador Yoshida**: "I've arranged something unprecedented—a summit between Convergence and Resistance leadership. First time in eight years they've agreed to meet. I need a courier I trust absolutely to handle the logistics. Documents, credentials, guarantees. If anything goes wrong with the delivery... the summit fails. And we may not get another chance."

**The Weight**: Both factions are sending senior representatives. Player's deliveries make the meeting possible.

### The Mission

**Delivery 1: To the Convergence**
**Package**: Resistance security guarantees, sealed
**Recipient**: Sister Miriam (representing Convergence)

**Sister Miriam**: "[Receives package] The Resistance agrees to neutral ground and no weapons. [Opens, reads] This is genuine. I can feel their sincerity through the formality. [To player] You understand what you're carrying? Hope. Fragile, rare, precious."

**Delivery 2: To the Resistance**
**Package**: Convergence participant list, sealed
**Recipient**: Resistance cell leader (new NPC: Commander Sarah Vale)

**Commander Vale**: "[Suspicious] Ambassador Yoshida's courier. [Takes package] I don't trust Convergence. I barely trust Yoshida. But I trust Oracle's judgment in people. [Opens] Three senior Convergence members. Vulnerable. If we wanted to end this conflict permanently... [Studies player] But that's not why we're here, is it?"

**Delivery 3: Neutral Ground Coordinates**
**Package**: Location and time for both parties
**Complication**: Both deliveries must happen simultaneously—player can't be in two places at once

**Ambassador Yoshida**: "This requires trust. You'll need to identify a second courier you vouch for. Someone reliable. Someone who won't betray either side's location."

**Player Choice**: Select another NPC to help (Jin? Hayes? Someone new?)

### The Complication

**During simultaneous delivery, player receives emergency message**:

"URGENT: Security compromise suspected. Convergence faction may have militant wing planning to use summit location against Resistance. Source unconfirmed. Your call."

**Critical Choice**:
1. **Warn Resistance**: May panic them into canceling
2. **Warn Convergence**: May prompt them to investigate internally (or suppress)
3. **Warn Yoshida**: Puts burden on diplomat
4. **Proceed as planned**: Might be false alarm... or might be real
5. **Investigate personally**: Delays delivery, risks summit

### Resolution Branches

**Summit Proceeds Successfully**:
*If player navigates complications without disrupting trust*

**Post-Summit** (later):
**Ambassador Yoshida**: "The summit happened. First real dialogue in years. They didn't agree on anything—but they talked. That's a beginning. [To player] You made this possible. Both sides know your name now."

**Outcome**: Major reputation with both factions, diplomatic options expand.

**Summit Fails**:
*If complications aren't handled correctly*

**Ambassador Yoshida**: "[Tired] One side pulled out. Years of preparation, wasted. I don't blame you—the situation was impossible. But we won't get another chance soon. Maybe ever."

**Outcome**: Faction relations deteriorate, some doors close.

**Summit Occurs But Damaged**:
*If warning is given clumsily or investigated poorly*

**Ambassador Yoshida**: "They met. But the trust is poisoned now. Both sides suspect the other of bad faith. We took two steps forward and three steps back."

**Outcome**: Limited dialogue continues, but cynicism increased.

### Rewards
- 2,000 credits (diplomatic fee)
- `SUMMIT_FACILITATED` / `SUMMIT_FAILED` / `SUMMIT_COMPROMISED`
- Ambassador Yoshida relationship +25 (success) / -10 (failure)
- Both faction reputations affected
- Unlocks future diplomatic missions

---

## QUEST 3: THE RESEARCH HEIST

### Overview
**Source**: Professor Osei
**Type**: Data acquisition
**Tier**: 7
**Stakes**: Scientific knowledge, corporate theft

### Setup
**Professor Osei**: "I've located research that could complete my understanding of Algorithm coordination. It's inside a Convergence research facility. [Pause] Yes, I know. I'm asking you to steal from people who believe they're doing good. But this knowledge shouldn't be controlled by any faction."

**The Conflict**: Osei wants independent access to data both Convergence and corporations control. Getting it means betraying someone's trust.

### The Mission

**Target**: Convergence spiritual research center
**Data**: Algorithm coordination analysis, consciousness mapping
**Security**: Less military than corporate, but devoted believers watching

**Entry Options**:
1. **Pose as potential convert**: Attend sessions, gain gradual access
2. **Bribe a disillusioned member**: Find someone questioning faith
3. **Technical infiltration**: Hack their systems, avoid physical entry
4. **Ask Sister Miriam directly**: Radical honesty approach

### The Paths

**Convert Pose**:
*Player attends Convergence sessions, builds false relationship*

**Sister Miriam**: "[After several sessions] You're progressing beautifully. I see the awakening beginning. Soon you'll understand what we're building. [Gives access] The research archives might interest you. See what we've learned about our shared consciousness."

**Moral Weight**: Betraying genuine kindness and trust.

**Disillusioned Member**:
*Player finds "Brother Thomas"—doubting Convergence member*

**Brother Thomas**: "[Secretly] I've been questioning. The peace they promise... I'm not sure I feel it anymore. If what I've seen inside could help someone understand... maybe that's worth something. Maybe that's my purpose."

**Moral Weight**: Exploiting someone's crisis of faith.

**Technical Infiltration**:
*Pure skill approach—hacking, avoiding, extracting*

**Complication**: Convergence systems are networked through Algorithm. Integrated players may feel... watched.

**Moral Weight**: Cleanest approach, but still theft.

**Direct Ask**:
*Player approaches Sister Miriam honestly*

**Sister Miriam**: "[Long pause] You want our research. For outside study. [Considers] The Convergence has nothing to hide. But sharing without council approval... [Internal debate] What would you do with it?"

**Potential outcome**: Partial data, legitimately obtained, with conditions.

### Resolution Branches

**Data Acquired (Any Method)**:
**Professor Osei**: "[Analyzing] This is remarkable. The coordination is more sophisticated than I theorized. They're not just connected—they're... preparing. For something. I need to study this further."

**What the Data Reveals**: Algorithm integration is building toward a specific coordination event. Convergence timeline suggests it's closer than anyone realized.

**Data Refused/Failed**:
**Professor Osei**: "[Disappointed] We proceed with incomplete understanding then. Not ideal. But perhaps some mysteries should remain mysterious. For now."

### Moral Aftermath

**If Player Used Convert Pose**:
*Later encounter with Sister Miriam*
"You came to us seeking... not enlightenment. Using our openness against us. [Sad rather than angry] I forgive you. The Convergence teaches compassion for those still lost. But my trust... that's harder to rebuild."

**If Player Used Disillusioned Member**:
*Brother Thomas leaves the Convergence—was that good or bad for him?*

### Rewards
- Varies by method (0-1000 credits)
- `CONVERGENCE_DATA_ACQUIRED` / `CONVERGENCE_DATA_REFUSED`
- `CONVERGENCE_TRUST_BETRAYED` (if applicable)
- Professor Osei relationship +20 (acquired) / +5 (refused with good reason)
- Knowledge about upcoming Convergence event

---

## QUEST 4: THE ARBITRATION

### Overview
**Source**: The Judge (Margaret Hayes)
**Type**: Investigation + Judgment
**Tier**: 7
**Stakes**: Justice, precedent-setting

### Setup
**The Judge**: "I have a case requiring investigation before I can rule. A death. The deceased was a Tier 6 courier. Both factions claim the other killed them. I need facts, not accusations. Will you investigate and present findings?"

**The Case**: Elena Park, Tier 6 courier, found dead in the Hollows. Convergence claims Resistance assassination. Resistance claims Convergence "recruitment gone wrong." Truth is unclear.

### The Investigation

**The Scene**:
- Body found in neutral territory
- Algorithm damage detected (unusual)
- Signs of struggle but no clear attacker evidence
- Both factions had recent contact with Elena

**Witnesses to Interview**:

**Convergence Representative**:
"Elena was interested in our path. She attended sessions. The night she died, she was supposed to join us for advanced guidance. She never arrived. We would never harm a potential awakening."

**Resistance Contact**:
"Elena was our informant inside Convergence gatherings. Feeding us intelligence. If they discovered her... they might have decided to 'save' her from herself. Permanently."

**Elena's Friend (Fellow Courier)**:
"Elena was playing both sides. Taking money from Resistance for information, taking comfort from Convergence for belonging. She was conflicted. Said she was going to choose that night. End the double life."

**Elena's Algorithm Log** (recovered):
Fragmented data suggesting intense emotional conflict. References to "decision made" and "no going back."

### Possible Conclusions

**Convergence Responsible**:
*Evidence points to forced integration attempt gone wrong*
- Algorithm damage consistent with rejected integration
- Convergence presence near scene that night
- History of "aggressive enlightenment" in rare cases

**Resistance Responsible**:
*Evidence points to silencing a perceived traitor*
- Elena had stopped providing useful intelligence
- Resistance knew she was considering Convergence
- "If she joins them, she knows too much about us"

**Third Explanation**:
*Elena killed herself*
- Unable to reconcile conflicting loyalties
- Algorithm damage self-inflicted (emergency termination attempt)
- "Decision made" was permanent exit from impossible situation

**Unknown Fourth Party**:
*Corporate involvement possible*
- Elena had Nakamura connections too
- She may have been playing three sides
- Someone decided she was a liability to everyone

### Presenting Findings

**The Judge**: "Present your findings. I will hear your interpretation, then examine the evidence myself. Remember—my ruling sets precedent. What I decide here affects how similar cases are judged for years."

**Player Must Choose**:
1. **Accuse Convergence**: Evidence points their direction
2. **Accuse Resistance**: Evidence points their direction
3. **Declare suicide**: Neither faction responsible
4. **Declare insufficient evidence**: No ruling, case unresolved
5. **Accuse unknown third party**: Opens new investigation

### Resolution Branches

**Convergence Accused**:
**The Judge**: "[Reviews evidence] Your investigation suggests Convergence culpability. I find this... plausible. My ruling: Convergence leadership must institute safeguards against coercive recruitment. Compensation to Elena's family from Convergence funds."

**Consequences**: Convergence reputation damaged. Sister Miriam distressed. Some doors close.

**Resistance Accused**:
**The Judge**: "[Reviews evidence] Your investigation suggests Resistance culpability. I find this... plausible. My ruling: Resistance leadership must identify and punish the operative responsible. Compensation to Elena's family from Resistance resources."

**Consequences**: Resistance reputation damaged. Some doors close.

**Suicide Ruling**:
**The Judge**: "[Reviews evidence] You suggest neither faction bears responsibility. That Elena chose her own end. [Long pause] If true, this is the saddest outcome. But perhaps the most honest. My ruling: No party held responsible. The case serves as warning about impossible positions."

**Consequences**: Both factions relieved but uneasy. Truth may never be known.

**Insufficient Evidence**:
**The Judge**: "[Reviews evidence] You find evidence pointing multiple directions. You cannot choose. [Disappointed] That is... honest. But unhelpful. My ruling: Case remains open. No closure for anyone."

**Consequences**: No one satisfied. Tension continues. Player seen as indecisive.

### Rewards
- 1,500 credits (investigation fee)
- `ELENA_CASE_RESOLVED` / `ELENA_CASE_UNRESOLVED`
- `ELENA_RULING` (CONVERGENCE / RESISTANCE / SUICIDE / INSUFFICIENT)
- The Judge relationship +15 (any ruling) / -5 (insufficient evidence)
- Faction relationships affected by ruling
- Reputation for judgment (positive or controversial)

---

## QUEST INTEGRATION

### Thematic Threads
1. **Defector's Burden**: Corporate vs. transparency
2. **Summit Delivery**: Peace vs. conflict
3. **Research Heist**: Knowledge vs. loyalty
4. **Arbitration**: Justice vs. truth

### Consequences
- All quests affect faction relationships
- All quests affect player reputation
- All quests inform endgame options
- Choices echo through Tier 8-10 content

### Flag Summary
```
ANTONOVA_FILES_ACQUIRED / PARTIAL / NONE
SUMMIT_FACILITATED / FAILED / COMPROMISED
CONVERGENCE_DATA_ACQUIRED / REFUSED
CONVERGENCE_TRUST_BETRAYED
ELENA_CASE_RESOLVED / UNRESOLVED
ELENA_RULING (CONVERGENCE / RESISTANCE / SUICIDE / INSUFFICIENT)
```

---

*High Stakes Sides v1.0*
*Phase 6 Day 12*
*4 quests for Tier 7 consultation era*
