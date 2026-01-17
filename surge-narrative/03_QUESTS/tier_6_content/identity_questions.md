# Identity Questions - Tier 6 Side Quests

## Purpose
4 side quests exploring Fork implications. Each confronts players with different aspects of identity, duplication, and what it means to multiply yourself.

---

## QUEST 1: THE SIMULATION

### Overview
**Source**: Dr. Helena Vance
**Type**: Psychological exploration
**Tier**: 6
**Stakes**: Self-understanding

### Setup
**Dr. Vance**: "Before you make the fork decision, I recommend the Simulation. It's a neural experience—completely safe—that lets you experience what having a fork might feel like. Ninety minutes compressed into what feels like weeks. Many patients find it clarifying."

**The Offer**: Experience a simulated version of having a fork without actually forking.

### The Simulation Experience

**Entry**:
"[Neural interface activates] You'll wake up in the simulation already having forked. Your simulated fork will behave according to predictive modeling based on your psychological profile. It's not perfect, but it's useful. Ready?"

**Phase 1: The First Meeting** (Simulated Day 1)
*Player meets their simulated fork. The fork is them—same memories, same personality, but already beginning to diverge.*

**Simulated Fork**: "[Your face, slightly uncertain] So this is what it feels like. I remember being you. I remember deciding to fork. But now I'm... me. Separate. Does that make sense?"

**Interaction Options**:
1. "How do you feel about existing?"
2. "What do you want to do now?"
3. "Do you resent being created?"
4. "We should set some ground rules."

**Phase 2: The Divergence** (Simulated Week 2)
*Time skip. The fork has had experiences the player hasn't. They're becoming different.*

**Simulated Fork**: "I took that job you were considering. The one at Nakamura. [Sees player's reaction] You didn't take it? Interesting. I thought... well, I thought I'd make the same choices you would. I was wrong."

**Player Realization**: The simulation shows how quickly shared identity diverges.

**Phase 3: The Conflict** (Simulated Month 3)
*The fork has become noticeably different. Friction emerges.*

**Simulated Fork**: "You keep treating me like I'm still you. I'm not. I have my own life now, my own goals. When you give me 'advice,' it feels like you're telling me what to want. I don't need another me. I need you to see me."

**Phase 4: The Resolution** (Simulated Month 6)
*However the player handles the relationship, the simulation shows one possible outcome.*

**Possible Outcomes**:
- **Healthy separation**: Two people who share a past, building separate futures
- **Continued closeness**: Siblings rather than copies
- **Estrangement**: Couldn't handle the divergence
- **Hostility**: Became competitors, became enemies

### Exit Interview

**Dr. Vance**: "The simulation is over. [Studies player] What did you learn? Not what you felt—those feelings will fade. What did you learn about yourself?"

**Player Options**:
1. "I learned I could handle having a fork."
2. "I learned I couldn't handle having a fork."
3. "I learned the fork would become someone different."
4. "I'm more confused than before."

**Dr. Vance's Response** (to any):
"All valid realizations. The simulation doesn't predict the future—it reveals your assumptions. Now you can choose based on understanding rather than imagination."

### Rewards
- `FORK_SIMULATION_COMPLETE`
- `SELF_UNDERSTANDING_GAINED`
- Dr. Vance relationship +15
- Clearer fork decision (reduced penalty for either choice)

---

## QUEST 2: THE ESTRANGED PAIR

### Overview
**Source**: Dominic Reeves
**Type**: Investigation / Mediation
**Tier**: 6
**Stakes**: Helping others, understanding consequences

### Setup
**Dominic**: "There's a pair I know—original and fork—who haven't spoken in five years. They're both miserable. Neither will reach out first. Would you be willing to... mediate? Sometimes a stranger can bridge what pride prevents."

**The Task**: Meet both halves of an estranged fork pair, understand what went wrong, potentially help them reconcile.

### The Original: SARAH CHEN

**Location**: Uptown apartment, alone
**Situation**: Successful career, empty personal life

**Sarah's Perspective**:
"I forked for practical reasons. Two incomes, twice the networking. Sarah-2 was supposed to be my partner. Instead, she became my replacement."

"She took my friends. My hobbies. My identity. Every time I accomplished something, she'd accomplished it too. Or better. How do you build a sense of self when there's another you doing the same things?"

"I don't hate her. I just... can't be around her. Every time I see her face—my face—I feel erased."

### The Fork: SARAH-2 CHEN

**Location**: Different district, different life
**Situation**: Also successful, also lonely

**Sarah-2's Perspective**:
"She thinks I stole her life. But what was I supposed to do—have no life? I woke up with her memories, her skills, her personality. Was I supposed to pretend to be different to make her comfortable?"

"I didn't choose to exist. She made that choice for me. And then she blamed me for existing too loudly. For being too similar. For being too successful. For being."

"I miss her. I miss us. But she made it clear: there's only room for one Sarah Chen in her world."

### Investigation

**What Went Wrong**:
- No communication after the initial excitement
- Both built similar lives independently
- Overlap created competition
- Pride prevented reconciliation

**What They Both Want** (discovered through careful questioning):
- To be seen as distinct individuals
- To reclaim relationship without losing identity
- For the other to acknowledge their pain

### Mediation Attempt

**Player Options**:
1. **Shuttle diplomacy**: Carry messages between them
2. **Forced meeting**: Arrange for them to meet "accidentally"
3. **Written reconciliation**: Help them write letters
4. **Recommend therapy**: Suggest professional help together

### Resolution Branches

**Successful Reconciliation**:
*If player finds the right approach—usually acknowledging both as distinct people*

**Sarah**: "[Seeing Sarah-2] You look... older. Different."
**Sarah-2**: "So do you. [Long pause] I missed you."
**Sarah**: "I missed us. [Tears] I'm sorry I couldn't see you as... you."

**Outcome**: They begin rebuilding, not as copies, but as the unique individuals they've become.

**Failed Reconciliation**:
*If player pushes too hard or picks wrong approach*

**Sarah**: "I can't do this. Not yet. Maybe not ever."
**Sarah-2**: "[Hurt] Then don't. [Leaves]"

**Outcome**: They remain estranged. Player learns some damage can't be easily fixed.

**Partial Success**:
*If player plants seeds without forcing resolution*

**Sarah**: "[After receiving letter] I read it. I'm not ready to respond. But... thank you for trying."

**Outcome**: Door opens slightly. Future reconciliation possible.

### Rewards
- 250 credits (Dominic pays, regardless of outcome)
- `ESTRANGED_PAIR_QUEST` flag
- `RECONCILIATION_ACHIEVED` / `RECONCILIATION_FAILED` / `RECONCILIATION_SEEDED`
- Dominic relationship +15
- Insight into fork relationship dynamics

---

## QUEST 3: THE INHERITANCE

### Overview
**Source**: Discovery (inheritance notice)
**Type**: Legal/Philosophical dilemma
**Tier**: 6
**Stakes**: Resources + Ethics

### Setup
*Player receives an unexpected message*

**Legal Notice**: "You are hereby notified that Marcus Webb, deceased, has named you as beneficiary of his estate. However, there is a complication. Mr. Webb forked three years before his death. His fork, Marcus-2, is also named as beneficiary. The estate cannot be divided without both parties' consent."

**The Situation**: A deceased client left their estate to the player. But their fork survives and has equal claim.

### Meeting Marcus-2

**Location**: Neutral legal office
**Marcus-2**: "[Looks at player] He talked about you. The courier who was always reliable. He wanted you to have something. [Bitter laugh] He wanted both of us to have something."

**Marcus-2's Perspective**:
"The original Marcus is dead. I have all his memories, including the memories of deciding to leave you something. But I also have my own three years of life. My own needs. My own claim to what's mine."

"Legally, we're different people. But the estate was built before we were different. Who deserves it—the continuation of his wishes, or the person who shares his identity?"

### The Dilemma

**Options**:
1. **Claim everything**: Legal but ethically questionable
2. **Split evenly**: Fair but potentially inadequate for both
3. **Give to Marcus-2**: Generous but self-sacrificing
4. **Work together**: Find a solution that serves both

### Working Together Path

**Marcus-2**: "What if... we don't divide it? What if we use it together? Invest it, share the returns. Neither of us gets everything, but we both benefit indefinitely."

**Potential Arrangements**:
- Joint investment fund
- Business partnership
- One takes assets, other takes income rights
- Convert to charitable trust in Marcus's name

### Resolution Branches

**Selfish Choice**:
*Player takes everything legally*

**Marcus-2**: "[Cold] You're right. Legally. But Marcus wouldn't have wanted this. He left it to you because he trusted you. Was he wrong?"

**Outcome**: Full inheritance, but reputation hit. Marcus-2 becomes hostile.

**Generous Choice**:
*Player gives everything to Marcus-2*

**Marcus-2**: "[Confused] Why would you... I don't understand. You had a legal claim."
**Player can respond**: "He was my friend. You're what's left of him."

**Outcome**: No inheritance, but deep relationship with Marcus-2. Future favors.

**Partnership Choice**:
*Player and Marcus-2 collaborate*

**Marcus-2**: "This is what he would have wanted. Two people he cared about, working together. [Extends hand] Partners?"

**Outcome**: Ongoing income stream, business relationship, friend who knows the value of fair dealing.

### Rewards
- Variable credits based on choice
- `MARCUS_INHERITANCE_RESOLVED`
- `MARCUS_2_RELATIONSHIP` (variable based on choice)
- Understanding of fork property rights
- Potential ongoing partnership

---

## QUEST 4: THE CANDIDATE

### Overview
**Source**: Harrison Wade (Corporate Fork Recruiter)
**Type**: Moral choice
**Tier**: 6
**Stakes**: Another person's fork decision

### Setup
**Harrison Wade**: "I have a proposition. There's a promising candidate—potential fork recruit—who's hesitating. They respect you. A recommendation from you might push them toward the opportunity. I'm prepared to compensate you generously for that recommendation."

**The Catch**: Wade wants the player to encourage someone to fork for corporate recruitment.

### The Candidate: MAYA TORRES

**Location**: Courier spaces, working
**Maya**: "You're the Tier 6 everyone talks about. I've been thinking about forking—Wade's been after me for months. But I keep hesitating. Did you ever consider it?"

**Maya's Situation**:
- Talented courier, trapped in debt
- Corporate fork program would clear debt
- But she's uncertain about the implications
- Values player's opinion as a peer

### Investigation

**What the Player Can Learn**:
1. **Wade's program details**: Strict contracts, long commitments, limited exit options
2. **Maya's debt**: Real but manageable without forking
3. **Alternative options**: Underground fork (freedom), union assistance, patience
4. **Maya's true feelings**: Scared, feeling pressured, wants permission to say no

### The Choice

**Wade's Offer**: 5,000 credits if Maya signs
**Maya's Trust**: She'll likely follow player's recommendation

**Options**:
1. **Recommend corporate fork**: Maya joins program, player gets paid
2. **Recommend against**: Maya declines, Wade is displeased
3. **Present all options neutrally**: Let Maya decide herself
4. **Offer alternative help**: Help Maya with debt without forking

### Resolution Branches

**Corporate Recommendation**:
**Maya**: "[After meeting] They explained everything. I'm scared but... you recommended it. You wouldn't steer me wrong. [Signs]"

*Six months later (later encounter)*:
**Maya**: "[Changed, more corporate] The program is... fine. I miss who I used to be sometimes. But the debt is gone. Both of me are productive. [Flat smile] This is what success looks like, right?"

**Against Recommendation**:
**Maya**: "[After meeting] You told me I didn't have to. That means more than you know. I told Wade no. [Genuine smile] It feels good to choose for myself."

*Six months later*:
**Maya**: "[Still struggling but happier] Still paying off the debt. Still just one of me. Still me. Thanks for the permission to stay myself."

**Neutral Presentation**:
**Maya**: "You gave me information, not direction. That's... harder. But I appreciate you trusting me to decide."

*Outcome varies based on Maya's own choice*

**Alternative Help**:
**Player offers to help Maya find other options**

**Maya**: "[Surprised] You'd do that? Help me find another way? [Emotional] No one's ever offered that before."

*Player can connect Maya with Sister Grace (union), Splitter Mira (alternatives), or directly help*

### Rewards
- 5,000 credits (if recommends corporate)
- OR: Maya's genuine gratitude and future alliance
- OR: Mixed results depending on choices
- `MAYA_TORRES_ADVISED`
- `WADE_RELATIONSHIP` (variable)
- `MAYA_OUTCOME` flag (CORPORATE / INDEPENDENT / ALTERNATIVE)

---

## QUEST INTEGRATION

### Teaching Themes
1. **Simulation**: Preview fork experience safely
2. **Estranged Pair**: Consequences of poor fork management
3. **Inheritance**: Fork property/identity questions
4. **Candidate**: Influence over others' fork decisions

### Moral Dimensions
- Personal choice vs. influencing others
- Short-term gain vs. long-term relationships
- Legal rights vs. ethical considerations
- Independence vs. support systems

### Flag Summary
```
FORK_SIMULATION_COMPLETE
SELF_UNDERSTANDING_GAINED
ESTRANGED_PAIR_QUEST
RECONCILIATION_ACHIEVED / FAILED / SEEDED
MARCUS_INHERITANCE_RESOLVED
MARCUS_2_RELATIONSHIP (integer)
MAYA_TORRES_ADVISED
MAYA_OUTCOME (CORPORATE / INDEPENDENT / ALTERNATIVE)
WADE_RECOMMENDATION_GIVEN / DECLINED
```

### Connection to Main Story
- All quests inform player's eventual fork decision
- Relationships built here may matter later
- Choices establish player's stance on fork ethics
- Understanding gained prevents future regret

---

*Identity Questions Quests v1.0*
*Phase 6 Day 11*
*4 quests for Tier 6 fork decision era*
