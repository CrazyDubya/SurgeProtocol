# Fork Era Contacts - Tier 6

## Purpose
6 NPCs for Tier 6—when players face the Fork decision, the ability to create a copy of their consciousness. These characters provide perspectives on identity, existence, and what it means to multiply oneself.

---

## NPC 1: DR. HELENA VANCE

### Basic Information
**Role**: Fork Counselor
**Location**: Specialized clinic, Neutral Zone
**Age**: 47
**Appearance**: Calm demeanor, minimal chrome (ethical principle), comfortable clothing designed to put patients at ease, eyes that have seen difficult decisions.

### Background
Trained psychologist who specializes in pre-fork counseling. Neither advocates for nor against forking—helps patients understand what they're actually choosing. Has never forked herself.

### Personality
- **Neutral**: Rigorously avoids influencing decisions
- **Thorough**: Explores every angle
- **Compassionate**: Understands the weight of the choice
- **Professional**: Maintains boundaries while caring

### Speech Pattern
Therapeutic questioning. Reflects statements back. Uses silence effectively. Never tells you what to think.

### Key Dialogue

**First Session**:
"You're considering forking. Before we discuss the procedure, I need you to understand: I won't tell you what to choose. My job is to help you understand what you're choosing. Does that distinction make sense?"

"Let's start with a question. When you imagine a fork of yourself—a complete copy, with all your memories, your personality, your sense of being you—what's your first emotional response? Don't analyze. Just notice."

**Exploring the Choice**:
"The fork will wake up believing they are you. Because, in every meaningful sense, they are you. They'll remember this conversation. They'll remember deciding to fork. And they'll remember being the original. That last memory will be false—but they won't know that."

"Many patients ask me: 'Which one will be the real me?' The honest answer is: both. Or neither. Depends on how you define 'real.' The question you should ask is: 'Can I live with there being two of us?'"

**Difficult Questions**:
"What happens if your fork makes different choices than you would? They might. Over time, they will. They'll become someone who looks like you, remembers being you, but isn't you anymore. How do you feel about that?"

"Some patients want to fork for practical reasons—two of you means twice the work, twice the income. That's valid. But the fork is a person. They'll want their own life eventually. Are you prepared for your copy to stop being your tool and become your competitor? Your stranger? Your enemy?"

**If Player Decides to Fork**:
"You've decided. Before we proceed, one last question: what do you want to say to your fork? They'll hear it as their first new memory. Make it count."

**If Player Decides Against**:
"You've decided not to fork. That's also a choice—and a valid one. Some people aren't ready. Some people never are. And some people simply believe one of them is enough."

### Story Flags
**Sets**:
- `MET_DR_VANCE`
- `FORK_COUNSELING_COMPLETE`
- `VANCE_SESSIONS` (integer)

**Checks**:
- `TIER >= 6`
- `FORK_DECISION_PENDING`

### Voice Direction
**Tone**: Therapeutic calm, professional warmth.
**Accent**: Educated, deliberately neutral.
**Pace**: Unhurried, comfortable with silence.

---

## NPC 2: PROFESSOR JEAN-CLAUDE MOREAU

### Basic Information
**Role**: Identity Philosopher
**Location**: University district, public lectures
**Age**: 63
**Appearance**: Distinguished academic, old-fashioned wire-frame glasses (affectation), tweed jacket over chrome-free body, hands that gesture while thinking.

### Background
Philosophy professor who built his career on consciousness studies. The Fork changed everything. Now grapples with questions his field wasn't prepared for.

### Personality
- **Intellectual**: Approaches everything through theory
- **Humble**: Admits when he doesn't know
- **Passionate**: Loves these questions
- **Accessible**: Explains complex ideas clearly

### Speech Pattern
Academic but not jargon-heavy. Thinks out loud. Asks questions he doesn't expect answers to.

### Key Dialogue

**First Meeting**:
"Ah, you're facing the Fork decision. [Excitement despite himself] Forgive me—professionally, this is fascinating. Personally, I imagine it's terrifying. Both reactions are appropriate."

"I've studied consciousness for forty years. Identity. Persistence. What makes you 'you' across time. Then the Fork came along and broke all my models. [Rueful laugh] The universe has a sense of humor."

**Philosophical Framework**:
"Here's the fundamental question: if you fork, and both copies believe they are you—which one is right? Traditional philosophy says there must be an answer. I'm no longer certain that's true."

"Consider the Ship of Theseus—if you replace every plank, is it the same ship? Now imagine two ships, each with half the original planks. Which is the real ship? The answer philosophers landed on: the question is malformed. Perhaps identity works the same way."

**Practical Implications**:
"Legally, a fork is a separate person. Morally? That's where it gets complicated. They have your memories, your values, your relationships. Do they have rights to your relationships? Your property? Your name?"

"I've met forks who consider their originals siblings. I've met forks who consider their originals enemies. I've met forks who believe they're the only real version. The relationship you have with your fork... you'll have to build it from scratch, with someone who already knows everything about you."

**Personal View (If Pressed)**:
"You want my opinion? [Long pause] I think the question 'should I fork?' is less important than the question 'who do I want to become?' Forking doesn't double you—it creates a choice point. Two futures where there was one. What matters is what you do with that."

### Story Flags
**Sets**:
- `MET_PROFESSOR_MOREAU`
- `PHILOSOPHY_LECTURES_ATTENDED` (integer)

**Checks**:
- `TIER >= 6`
- Available before fork decision is finalized

### Voice Direction
**Tone**: Academic enthusiasm, gentle wisdom.
**Accent**: French-influenced, educated.
**Pace**: Thoughtful, punctuated by pauses for reflection.

---

## NPC 3: ALEX/ANDRA CHEN (THE MERGED)

### Basic Information
**Role**: Merged Consciousness / Former Fork Pair
**Location**: Support group meetings, private consultation
**Age**: 34 (combined age: 7 years post-merge)
**Appearance**: Single person who moves with subtle duality—gestures sometimes contradict, expressions layer. Two sets of mannerisms in one body.

### Background
Alex forked seven years ago, creating Andra. They lived separately for three years, then chose to re-merge—combining both sets of memories and experiences into one consciousness. The result is someone who is neither original nor fork, but both.

### Personality
- **Complex**: Literally two perspectives in one
- **Insightful**: Understands both sides
- **Stable**: Merged successfully, rare achievement
- **Generous**: Shares experience to help others

### Speech Pattern
Occasionally shifts mid-sentence between two subtle styles. Uses "we" sometimes, "I" others. Refers to memories with "the Alex memory" or "the Andra memory" for clarity.

### Key Dialogue

**Introduction**:
"I'm Alex. I'm also Andra. [Pause] I'm neither, really. I'm what happens when two people who used to be one person decide to become one person again. It's... complicated."

"We—I—merged four years ago. Three years apart, then back together. The Andra memories feel like mine. The Alex memories feel like mine. And the memories of being separate? Those feel like watching a movie of two people I used to know."

**On Being Forked**:
"Forking felt like... having a conversation with myself. But the other me kept having different opinions. At first that was fascinating. Then uncomfortable. Then painful. We'd argue about who we were 'supposed' to be. As if there was a script we'd both forgotten."

"The worst part? We both remembered being the original. One of us was wrong. We never figured out which. Eventually, we stopped caring. It stopped mattering."

**On Merging**:
"Merging isn't for everyone. Most fork pairs don't even consider it. But we... we missed being one person. The loneliness of being two people who share everything except the present—it's hard to explain."

"The merge process is strange. Like falling asleep as two and waking up as one. I have memories of the procedure from both perspectives. Watching myself become myself. It's recursive in a way that gives philosophers headaches."

**Advice**:
"If you fork, understand: you're not creating a copy. You're creating a person. They'll have their own life, their own choices, their own identity that diverges from yours. That can be beautiful or terrible, depending on how you both handle it."

"If you do fork... talk to each other. Regularly. The pairs who stay close are the ones who treat each other as siblings, not as duplicates. The ones who fail are the ones who expect their fork to be themselves."

### Story Flags
**Sets**:
- `MET_ALEX_ANDRA`
- `MERGE_OPTION_KNOWN`
- `MERGED_CONVERSATIONS` (integer)

**Checks**:
- `TIER >= 6`
- `FORK_DECISION_PENDING` or `FORK_CREATED`

### Voice Direction
**Tone**: Dual layers, sometimes contradicting, ultimately harmonized.
**Accent**: Standard, with occasional shifts in register.
**Pace**: Varies—sometimes quick (Alex), sometimes measured (Andra).

---

## NPC 4: HARRISON WADE

### Basic Information
**Role**: Corporate Fork Recruiter
**Location**: Uptown corporate spaces, professional meetings
**Age**: 39
**Appearance**: Perfect corporate presentation, seamless integration chrome, smile calibrated for trustworthiness. Everything about him is designed to close deals.

### Background
Works for a conglomerate that aggressively recruits promising individuals—and their forks. The pitch: fork yourself, let us employ both of you, double your income while building two careers. The reality is more complicated.

### Personality
- **Persuasive**: Excellent at framing benefits
- **Selective**: Truth is a tool, not a principle
- **Ambitious**: Quota-driven, always recruiting
- **Not evil**: Believes in his product, mostly

### Speech Pattern
Corporate smooth. Every sentence is a pitch. Uses "opportunity" and "optimization" frequently. Deflects hard questions with softer ones.

### Key Dialogue

**Initial Contact**:
"You're considering forking. Smart. Very forward-thinking. Have you considered the professional applications? Because my clients have. And they're very interested in people like you."

"Here's the proposition: you fork, we employ both versions. Different divisions, different trajectories, no competition between you. Your income doubles. Your career options double. Your network doubles. What's not to like?"

**The Pitch**:
"Concerns about identity? We hear that a lot. Here's the thing: your fork will have their own career, their own achievements, their own life. You're not creating a copy—you're creating an opportunity. For both of you."

"Our corporate fork program has a 94% satisfaction rate. Both originals and forks report higher life satisfaction after joining. The structure helps. Clear boundaries. Separate paths. Shared benefits."

**What He Doesn't Mention** (discovered through investigation or pressing):
"Non-compete clauses? Standard. We wouldn't want you competing with... yourself. Or your fork competing with us. It's for everyone's protection."

"The buyout clause? Only relevant if one of you wants to leave. Which rarely happens. Both versions usually find the arrangement... satisfactory."

**If Confronted**:
"Look, I'm not going to pretend this is pure altruism. We benefit from having two of you. But you benefit too. The question is whether the benefit outweighs the commitment. For most people, it does."

### Story Flags
**Sets**:
- `MET_HARRISON_WADE`
- `CORPORATE_FORK_OFFER`
- `CORPORATE_FORK_ACCEPTED` / `CORPORATE_FORK_DECLINED`

**Checks**:
- `TIER >= 6`
- `FORK_DECISION_PENDING`

### Voice Direction
**Tone**: Corporate polish, persuasive warmth.
**Accent**: Professional, regionally neutral.
**Pace**: Smooth, never rushed, always confident.

---

## NPC 5: "SPLITTER" MIRA VASQUEZ

### Basic Information
**Role**: Underground Fork Specialist
**Location**: Hidden clinic, Hollows deep
**Age**: 44
**Appearance**: Surgical precision in movement, chrome-enhanced hands (tools of trade), permanent dark circles from too many procedures, fierce protectiveness of patients.

### Background
Used to work corporate fork clinics. Left when she saw how they treated forks as products. Now runs an underground operation that does forks off-grid—no corporate tracking, no mandatory contracts, no treating people as commodities.

### Personality
- **Protective**: Fiercely guards her patients
- **Skilled**: Excellent at her work
- **Political**: Has strong views on fork ethics
- **Caring**: Gruff exterior, soft interior

### Speech Pattern
Direct, occasionally rough, but compassionate when it matters. Uses "the corps" as a slur.

### Key Dialogue

**First Contact** (requires underground connection):
"You want to fork off-grid. Good choice. The corps track every fork they create—monitor them, control them, harvest their data. I do clean work. No strings. No surveillance."

"I'm going to ask you questions they don't ask in corporate clinics. Real questions. Because forking without understanding it is how people end up broken."

**The Process**:
"My procedure is the same as corporate—I trained in their facilities before I realized what they were. Difference is what happens after. Your fork wakes up free. Not owned. Not tracked. Not a product."

"I don't do this for money. I do this because forks are people, and people deserve to start their existence without a collar. What you and your fork do after—that's your business. I just give you both a clean start."

**Warnings**:
"Corporate forks get support systems. Safety nets. My forks get freedom—which means they're on their own. You need to be ready for that. Your fork needs to be ready for that."

"The corps will tell you underground forks are dangerous. They're not wrong—there are hacks who do bad work. I'm not one of them. But they spread that fear for a reason: free forks are competition. Free forks can't be controlled."

**If Player Chooses Her**:
"Good. [Prepares equipment] One last thing: what do you want your fork's first experience to be? Corporate forks wake up to contracts and orientations. My forks wake up to whatever you want to tell them. Make it something worth waking up to."

### Story Flags
**Sets**:
- `MET_SPLITTER_MIRA`
- `UNDERGROUND_FORK_AVAILABLE`
- `FORKED_OFF_GRID` (if chosen)

**Checks**:
- `TIER >= 6`
- Requires underground connection (Ghost network or similar)

### Voice Direction
**Tone**: Gruff protectiveness, hidden compassion.
**Accent**: Working-class, traces of medical training.
**Pace**: Efficient, no wasted words.

---

## NPC 6: DOMINIC REEVES

### Basic Information
**Role**: Fork-Skeptic Support Group Leader
**Location**: Community center, evening meetings
**Age**: 52
**Appearance**: No chrome, deliberately. Comfortable clothes, tired eyes that have seen too much, hands that gesture inclusively when speaking to groups.

### Background
Forked fifteen years ago. The fork—Dominic-2—went badly. Diverged, competed, eventually became hostile. Both are still alive. Neither speaks to the other. Now leads a support group for people questioning the fork decision.

### Personality
- **Wounded**: Carries old pain
- **Honest**: Shares his failures openly
- **Supportive**: Doesn't want others to suffer
- **Not anti-fork**: Just wants informed decisions

### Speech Pattern
Support-group cadence. Uses "I" statements. Shares personal experience rather than lecturing.

### Key Dialogue

**Meeting Introduction**:
"Welcome. My name is Dominic. I forked fifteen years ago. My fork and I haven't spoken in twelve years. I'm not here to tell you not to fork. I'm here to tell you what it's actually like."

"This group is for anyone questioning the decision—whether you're considering it, regretting it, or just trying to understand it. No judgment. Just experience."

**His Story**:
"Dominic-2 was me in every way that mattered. Same memories, same values, same goals. For two years, we were like brothers. Then we started competing. Same skills, same ambitions, same market. There wasn't room for both of us."

"The worst fight we ever had: he accused me of treating him like a copy. I accused him of trying to replace me. We were both right. We were both wrong. We couldn't see past the fact that we were supposed to be the same person but weren't anymore."

"I haven't seen him in years. I hear he's doing well. Built a different life in a different city. Sometimes I wonder if we could reconcile now. But too much time has passed. Too much resentment. We're strangers who share a past."

**Advice**:
"If you're thinking about forking, ask yourself: can you love someone who knows everything about you, including the parts you hate? Can you compete with yourself without destroying yourself? Can you watch yourself become someone else?"

"I'm not saying don't fork. Some people handle it beautifully. But the people who do are the ones who went in with their eyes open. Who understood that a fork isn't a tool or a backup—it's a person. A person who will have opinions about being created."

**If Player Has Already Forked**:
"You forked. How's it going? [Listens] Those feelings are normal. All of them. The key is communication. Keep talking to your fork. Even when it's hard. Especially when it's hard. Silence is what killed my relationship with Dominic-2."

### Story Flags
**Sets**:
- `MET_DOMINIC_REEVES`
- `FORK_SUPPORT_GROUP_ATTENDED`
- `FORK_WARNING_HEARD`

**Checks**:
- `TIER >= 6`
- Available before or after fork decision

### Voice Direction
**Tone**: Support-group warmth, underlying pain.
**Accent**: Working-class, authentic.
**Pace**: Measured, gives space for others.

---

## FORK ERA NPC WEB

### Relationships
- **Dr. Vance** refers patients to **Professor Moreau** for philosophical context
- **Alex/Andra** attends **Dominic's** support group occasionally
- **Harrison Wade** competes with **Splitter Mira** for fork business
- **Dominic** actively warns against **Wade's** corporate program
- **Professor Moreau** has studied **Alex/Andra** for research

### Decision Spectrum
- **Pro-Fork**: Harrison Wade (corporate), Splitter Mira (freedom)
- **Neutral**: Dr. Vance (professional), Professor Moreau (philosophical)
- **Cautionary**: Dominic Reeves (wounded), Alex/Andra (complicated)

### Player Paths
1. Corporate fork (Wade) - Resources but restrictions
2. Underground fork (Mira) - Freedom but isolation
3. Informed fork (Vance + Moreau) - Understanding before choosing
4. Decline fork (Dominic) - Remain singular

---

## FLAGS SUMMARY

### New Flags
```
MET_DR_VANCE
FORK_COUNSELING_COMPLETE
VANCE_SESSIONS (integer)
MET_PROFESSOR_MOREAU
PHILOSOPHY_LECTURES_ATTENDED (integer)
MET_ALEX_ANDRA
MERGE_OPTION_KNOWN
MERGED_CONVERSATIONS (integer)
MET_HARRISON_WADE
CORPORATE_FORK_OFFER
CORPORATE_FORK_ACCEPTED / DECLINED
MET_SPLITTER_MIRA
UNDERGROUND_FORK_AVAILABLE
FORKED_OFF_GRID
MET_DOMINIC_REEVES
FORK_SUPPORT_GROUP_ATTENDED
FORK_WARNING_HEARD
```

---

*Fork Era Contacts v1.0*
*Phase 6 Day 11*
*6 characters for Tier 6 identity crisis*
