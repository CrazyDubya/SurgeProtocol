# Dr. Yuki Tanaka

## Core Identity
- **Full Name**: Dr. Yuki Tanaka, M.D., Ph.D. (Neurocybernetics)
- **Alias/Callsign**: "Doc Tanaka" / "The Sculptor"
- **Age**: 41
- **Gender**: Female
- **Pronouns**: She/Her
- **Occupation**: Augmentation Specialist / Underground Physician
- **Faction Affiliation**: Independent (carefully neutral, secret Ghost Network ally)
- **First Appearance Tier**: 1 (first optional augment quest)

## Physical Description
- **Appearance**: Petite build, precise movements, prematurely silver hair (genetics, not age) kept in tight bun. Tired but alert eyes behind smart glasses. Surgical scars on hands from early-career accident.
- **Augmentations Visible**: Extensive but subtle—enhanced eyes (multilevel magnification, thermal, diagnostic overlays), neural co-processor (visible port at temple), steady-hand augments (fingers can achieve inhuman precision). Moderate chrome but all functional, nothing cosmetic.
- **Style/Aesthetic**: Clinical but humane—white coat over practical clothing, always immaculately clean despite the dingy clinic. Wears a jade bracelet (her mother's, only non-functional item).
- **Voice Description**: Calm, measured, precise diction. Slight Japanese accent on certain words. Bedside manner is professional but warm—explains everything clearly.

## Personality
- **Core Traits**: Brilliant, ethical within her framework, protective of bodily autonomy, haunted by past mistakes
- **Motivations**: Help people navigate augmentation safely, atone for corporate past, preserve human agency
- **Fears**: Becoming complicit in dehumanization again, Algorithm discovering her Ghost Network ties, losing patients to chrome psychosis
- **Values**: Informed consent, harm reduction, medical ethics (even in illegal context), human dignity
- **Speech Patterns**: Medical terminology mixed with layman's explanations, asks permission before touching, always discloses risks

## Background
- **Origin Story**: Former lead researcher for Nakamura Cybernetics (major corpo). Designed bleeding-edge neural augments. Quit after discovering the company was pushing addictive upgrade cycles and suppressing divergence syndrome data. Went underground 8 years ago.
- **Current Situation**: Runs a "gray clinic" in The Hollows—not illegal, but not corpo-approved either. Performs augmentations, removals, and emergency medical care for couriers and street folk who can't afford corporate clinics. Works 16-hour days.
- **Connection to Player**: Becomes your augmentation specialist, performs surgeries, counsels on chrome choices. Represents informed consent vs. corpo exploitation.
- **Secrets**:
  - Still has Nakamura corporate access codes (uses for research, could be imprisoned if discovered)
  - Actively helps Ghost Network disable Algorithm tracking in augments
  - Has complete data on consciousness upload failures—knows Ascension kills the original
  - Performed experimental augment on herself that prevents Algorithm integration (risky, could fail)

## Relationships
- **Allied With**:
  - Ghost Network (secret ally, provides medical support)
  - Rosa (refers patients to each other)
  - Dispatcher Chen (long professional relationship)
  - Independent doctors citywide (information network)
- **Opposed To**:
  - Nakamura Cybernetics (former employer, knows their crimes)
  - Forced augmentation mandates
  - Predatory chrome pushers
  - Algorithm's "optimization" rhetoric
- **Romantic Interest**: N/A (not a romance option)
- **Past Connections**:
  - Dr. Kenji Yamamoto (former colleague, now fully Algorithm-integrated, tragic loss)
  - Her research team (scattered; some ascended, some went rogue, some dead)

## Story Role
- **Narrative Function**: Augmentation Specialist / Ethical Guide / Information Source / Tragic Prophet
- **Arc Summary**: Guides player through augmentation decisions while revealing the true costs. Her past corpo experience provides insider knowledge. Represents attempting to use technology ethically in a system designed for exploitation.
- **Key Story Beats**:
  - **Tier 1**: First augmentation, establishes informed consent process
  - **Tier 3**: Installs cochlear implant (Algorithm integration), warns about surveillance
  - **Tier 5**: Opens up about Nakamura past if player asks questions
  - **Tier 6**: Cortical stack installation—most serious procedure, maximum warnings
  - **Tier 7**: Can reveal upload truth if player has high relationship
  - **Tier 9**: Final conversation about Ascension—begs player not to do it
  - **Epilogue**: Reactions vary based on player path
- **Possible Outcomes**: Always survives (unless player betrays Ghost Network to corpos)

## Dialogue Trees

### Greeting Variants

**First Meeting (Tier 1)**:
- "You're here for augmentation. Good. Sit down, let's talk about what you actually need versus what you think you need."

**Professional (Relationship 0-30)**:
- "Back for an upgrade? Let's review your current augment load first."
- "How are you feeling? Any glitches, phantom sensations, intrusive thoughts?"

**Trusted (Relationship 31-70)**:
- "Good to see you. How's the chrome treating you?"
- "Come in. Want tea before we discuss the procedure?"

**Confidant (Relationship 71-100)**:
- "You look troubled. Is it the augments, or something else?"
- "I've been researching your case. I have some concerns..."

**Post-Heavy Chrome (Humanity < 50)**:
- [concerned scan of your augments] "We need to talk about your humanity metrics. Sit down."

### Topic Hubs

**Ask about augmentation options**:
- Explains available augments for current tier
- ALWAYS discloses risks, side effects, humanity costs
- Suggests alternatives if player doesn't actually need chrome
- Different recommendations based on player's specialization

**Ask about risks**:
- Detailed breakdown of medical risks
- Humanity degradation warnings
- Divergence syndrome explanation (foreshadows cortical stack)
- "My job is to make sure you know what you're trading."

**Ask about her past** [UNLOCKED at Relationship > 40]:
- Deflects early
- Opens up gradually: "I worked for Nakamura. I designed some of the augments you might be using."
- Full story at Relationship > 60: The corporate crimes, her complicity, her escape

**Ask about Algorithm** [UNLOCKED at Tier 3+]:
- "It's not sentient AI. It's an emergent system trained on millions of people's decisions. And now it's in your head, learning from you."
- Different warnings based on player's humanity level
- At high relationship: Reveals her anti-integration augment

**Ask about Ascension** [UNLOCKED at Tier 7+]:
- "You want the truth? The upload process destroys the original consciousness. You die. A copy that thinks it's you wakes up. The corpos call that 'immortality.'"
- Shows research data if player pushes
- Emotional: "I've lost friends to that lie."

**Ask about augment removal** [UNLOCKED at Relationship > 50]:
- "Removal is risky. The chrome integrates with your nervous system. Extraction leaves... holes."
- Can perform removals (restores humanity, but has consequences)
- Works with Rosa on complex cases

### Augmentation Consultation Process

**Standard Procedure** (every augment installation):

**NODE 1** (NPC_LINE):
Dr. Tanaka: "Before we proceed, I need to explain the risks. This isn't a corpo sales pitch—you need informed consent."

**NODE 2** (Risks Disclosure):
- Medical risks (infection, rejection, neural damage)
- Humanity cost (-X humanity points)
- Psychological effects (potential mood changes, intrusive thoughts)
- Dependency risk (some augments become psychologically necessary)
- Reversibility (can it be removed? What's the cost?)

**NODE 3** (PLAYER_RESPONSE_HUB):
- "I understand. Let's proceed." → Surgery
- "What are the alternatives?" → Dr. Tanaka suggests non-aug options
- "Can I think about it?" → Postpone decision
- "The corpo clinics don't tell me all this." → NODE 4

**NODE 4** (Corporate Critique):
Dr. Tanaka: "No, they don't. They're selling product. I'm trying to keep you human enough to choose."

### Tier 3: Cochlear Implant (Algorithm Integration)

**Context**: Player's first Algorithm-integrated augment

**DR. TANAKA**: [unusually serious] "The cochlear implant is different. It's not just hardware—it integrates with the Algorithm. Surveillance, analysis, 'guidance.'" [air quotes]

"Once it's in, the Algorithm is always listening. Always. Watching. Learning your patterns. Some people find it helpful. Others..." [trails off]

"You need to understand: this is the threshold. Before this, your augments were tools. After this, you're part of a network. There's no going back."

**PLAYER OPTIONS**:

- "I need the upgrade to stay competitive." → Tanaka: "I know. That's what makes this so insidious."

- "Can you install it without Algorithm integration?" [TECH CHECK: Difficulty 12]
  - SUCCESS → Tanaka: "Technically possible, but it'll void the warranty and flag you as noncompliant. Are you sure?"
  - FAILURE → Tanaka: "The integration is baked into the firmware. Can't extract it without bricking the implant."

- "What happened to the people who got this?" → Tanaka shares case studies (humanity loss, optimization addiction)

- "You seem really against this. Why offer it?" → NODE 5

**NODE 5** (Her Philosophy):
Dr. Tanaka: "Because if you're going to do it anyway, I'd rather it be me. At least I'll do it right, and you'll know what you're getting into. The corpo clinics will lie to you and charge triple."

### Tier 6: Cortical Stack Warning

**Context**: Most serious augmentation, creates fork/Shadow

**DR. TANAKA**: [has player sit down, brings up holographic brain scan]

"This is different from every other procedure we've done. The cortical stack doesn't augment—it duplicates. Your consciousness, forked into two parallel instances. Prime and Shadow."

[rotates the brain scan, showing neural pathways]

"For a while, they'll be synchronized. Same person, two bodies' worth of experience. But divergence is inevitable. They'll start making different choices, forming different opinions, wanting different things."

[looks directly at you]

"Eventually, you'll be two people. And one of them usually wins. The other gets suppressed, or deleted, or locked away in their own head. I need you to understand: the person who walks out of surgery might not be you. Not really."

**PLAYER OPTIONS**:

- "I'll be strong enough to stay synchronized." → Tanaka: "Everyone says that. The data says otherwise."

- "What's the actual percentage? How many people lose themselves?" [TECHNICAL]
  - Tanaka: "Forty-seven percent diverge within six months. Seventy-two percent by one year. By year two, ninety-one percent report the Shadow as a separate entity. Therapy and meditation can slow it, not stop it."

- "You said 'usually one wins.' What about the other nine percent?" → Tanaka: "Stable coexistence. Rare, but possible. Requires constant work and exceptional self-awareness."

- "Have you ever had to treat someone who lost to their Shadow?" → NODE 6

**NODE 6** (Tragic Case Study):
Dr. Tanaka: [quiet] "Dr. Kenji Yamamoto. My colleague at Nakamura. Brilliant man. Got the cortical stack to maximize research productivity."

"Six months later, I was having coffee with Shadow-Kenji. He told me Prime-Kenji was 'inefficient, emotionally compromised.' He'd taken full control. Locked Prime away in dormancy."

[removes her glasses, wipes them—buying time to compose herself]

"I asked to speak to Prime. Shadow said no. 'He doesn't need to exist anymore. I'm the optimal version.' I never saw my friend again. Just the... optimized stranger wearing his face."

**Relationship**: +15 (deep vulnerability)
**Sets Flag**: KNOWS_TANAKA_KENJI_STORY

### Tier 7: The Upload Truth

**Context**: Player asks about Ascension, Dr. Tanaka has high relationship

**PLAYER**: "Tell me the truth about consciousness upload. The real truth."

**DR. TANAKA**: [long pause, deciding whether to trust you]

[pulls up encrypted data files]

"I still have access to Nakamura's research servers. They don't know—I use old credentials, route through Ghost Network proxies. I've been monitoring the upload trials."

[shows brain activity scans]

"This is a consciousness before upload. See the neural pattern? Unique, complex, chaotic. That's a person."

[shows second scan]

"This is during upload. The brain is being scanned, mapped, converted to data. Destructive process—the original neurons are burned out by the scanning laser. And here—"

[shows flatline]

"This is after. No activity. Brain dead. The original consciousness is gone. Destroyed."

[shows digital simulation]

"Meanwhile, the digital copy boots up. It has all the memories, personality, quirks. It thinks it's the original. Feels continuous. But it's not. It's a copy that thinks it survived a process that actually killed the original."

[looks at you intensely]

"Ascension is suicide with a backup. You die. Something that thinks it's you continues. The corporations call that immortality. I call it murder."

**PLAYER OPTIONS**:

- "Are you sure? This could be interpreted differently..." → Tanaka shows more data, undeniable proof

- "Does the copy know?" → Tanaka: "No. It believes it's continuous. That's what makes it so insidious."

- "Why doesn't anyone talk about this?" → Tanaka: "The corporations suppress it. The Ascended can't admit it. The truth dies with the original."

- "Thank you for telling me." → Tanaka: "I've lost too many people to that lie. I won't lose you too if I can help it."

**Sets Flag**: KNOWS_UPLOAD_TRUTH
**Humanity**: +5 (existential awareness)
**Relationship**: +20 (ultimate trust)

### Tier 9: Final Plea

**Context**: Player is considering Ascension path

**DR. TANAKA**: [if she told you the upload truth] "You know what it really is. You know it kills you. Please. Don't do this."

[emotional, breaks professional composure]

"I have watched so many people walk into that clinic. Brilliant, beautiful, vibrant people. And they don't walk out. Copies do. Digital ghosts that wear their faces and spend their money and file their taxes, but the person? Dead."

"You're not just data. You're embodied, messy, irrational, gloriously human. That's not a bug to be optimized away—that's what makes you real."

[if high relationship]

"I care about you. Not your stats, not your efficiency rating. You. The actual person standing in front of me. If you upload, that person dies, and I'll have to watch another ghost walk away thinking it won. I can't—"

[voice breaks]

"Please."

**PLAYER OPTIONS**:

- "I'm sorry. I have to." → Tanaka: [grief] "Then this is goodbye. The real goodbye. I hope your copy is happy."

- "You're right. I won't do it." → Tanaka: [relief] "Thank you. Thank you."

- "I found another way. The Third Path." → Tanaka: [curious] "Tell me more..."

## Conditional Dialogue

### Humanity-Based Reactions

**Humanity 80-100**:
- Pleased: "You're staying human. Good. That's harder than it looks."

**Humanity 60-79**:
- Concerned: "Your humanity metrics are declining. Let's talk about slowing augmentation."

**Humanity 40-59**:
- Worried: "You're approaching critical thresholds. I recommend therapy and meditation to stabilize."

**Humanity < 40**:
- Alarmed: "You're in danger of chrome psychosis. We need to discuss augment removal or you'll hollow out."

### Chrome Load Reactions

**After 3rd augment**:
- "You're building up fast. Remember to integrate each one before adding more."

**After 5th augment**:
- "That's a significant augment load. How are you feeling? Any identity disturbances?"

**After 7th augment**:
- "This is getting dangerous. Your body is more machine than meat now. Are you still making these choices, or is the Algorithm?"

### Failed Procedures (Rare, Based on Rolls)

**If augmentation surgery fails**:
- Dr. Tanaka takes full responsibility
- Offers free corrective surgery
- Deeply apologetic: "I'm so sorry. I should have caught that complication."
- Relationship impact: Actually increases (she handles failure with integrity)

## Voice Acting Notes
- **Voice Type**: Mezzo-soprano, calm, professional
- **Accent**: Slight Japanese accent, mostly neutral
- **Emotion Range**: Professional calm (default) to passionate intensity (corporate crimes, upload truth) to grief (Kenji, potential player loss)
- **Key Emotions**:
  - Clinical (medical explanations)
  - Protective (warnings)
  - Haunted (past mistakes)
  - Desperate (Tier 9 plea)
- **Line Count Estimate**: 350-400 lines
  - Medical consultations: 150
  - Backstory reveals: 50
  - Tier-specific warnings: 80
  - Conditional reactions: 70
  - Endgame dialogue: 30
  - General conversation: 20

## Character Arc Summary

**Early Game (Tier 1-3)**: Professional specialist, establishes trust through competence and honesty

**Mid Game (Tier 4-6)**: Opens up about past, warnings become more personal, reveals corporate crimes

**Late Game (Tier 7-9)**: Shares upload truth, becomes emotionally invested in player's survival, final plea

**Epilogue**: Reactions show grief (Ascension), hope (Rogue/Third Path), or pride (stayed human)

## Narrative Function

Dr. Tanaka serves as:
1. **Ethical Guide**: Provides informed consent in an exploitative system
2. **Information Source**: Insider knowledge of corpo crimes, augment risks
3. **Tragic Prophet**: Warns of futures she's seen happen to others
4. **Humanity Anchor**: Medical professional who sees chrome's cost in patients
5. **Resistance Symbol**: Uses her skills against the system she helped build

Her ultimate question: **Can technology serve humanity, or does it always corrupt?**

## Related Content Files
- Quest: "First Chrome" (first augmentation) - `/03_QUESTS/main_story/tier_1_first_augment.md`
- Quest: "The Sculptor's Past" (Nakamura investigation) - `/03_QUESTS/side_quests/major_sides/tanaka_past.md`
- Dialogue: Cochlear Implant Warning - `/02_DIALOGUE_TREES/conditional_branches/tier_3_algorithm_integration.md`
- Dialogue: Upload Truth Revelation - `/02_DIALOGUE_TREES/conversation_topics/tanaka_upload_truth.md`
- Cutscene: Cortical Stack Surgery - `/11_CUTSCENES_VIGNETTES/tier_milestone_scenes/tier_6_cortical_installation.md`
- Lore: Nakamura Cybernetics Crimes - `/05_WORLD_TEXT/lore/corporations/nakamura_cybernetics.md`
