# Tech Vendors - Merchant NPCs

## Purpose
8 tech vendor profiles across districts. Each has personality, inventory hints, barter dialogue, and tier-gated premium items.

---

## VENDOR 1: "PIXEL" ZHANG WEI

### Basic Information
**Role**: General Tech Vendor
**Location**: Hollows Market, rotating stall
**Tier Access**: 0-4
**Specialty**: Budget gear, refurbished tech, first-timer friendly

### Appearance
Young, energetic, covered in holographic stickers and promotional patches. Cheap chrome that flickers occasionally. Always moving, always talking.

### Personality
- **Enthusiastic**: Loves technology, talks too much about it
- **Honest**: Won't upsell what you don't need
- **Budget-conscious**: Understands being broke
- **Educational**: Explains everything, sometimes too much

### Inventory Style
Refurbished equipment, budget alternatives, "starter kits" for new couriers. Everything works, nothing's premium.

### Dialogue

**Greeting (Tier 0-2)**:
"Fresh face! Love it! First chrome? First real gear? Don't worry—Pixel's got you. Budget-friendly, reliable, and I explain everything. No judgment here."

**Greeting (Tier 3-4)**:
"Hey, veteran! Upgrading or just browsing? I've got some mid-range stuff that'll surprise you. Not flashy, but solid. You know solid matters more than flashy."

**Browsing**:
"Take your time, take your time. [Gesturing at displays] This side's commlinks, that's nav gear, back wall's chrome accessories. I can explain anything—just ask. Seriously. I love explaining."

**Sales Pitch**:
"This refurbed nav unit? Original owner upgraded to cortical. His loss, your gain. Works perfect, half the price. Why pay new when 'like new' does the job?"

**Haggling**:
"[Considering] You know what? I respect the hustle. Tell you what—I'll knock off 10% if you spread the word. Pixel's Stall, quality on a budget. Deal?"

**After Purchase**:
"Good choice! That unit's gonna serve you well. Any problems, bring it back—I stand behind everything. Pixel's reputation is all I've got!"

### Story Flags
**Sets**: `MET_PIXEL_VENDOR`, `PIXEL_PURCHASES` (integer)
**Unlocks**: Discount after 5 purchases

### Voice Direction
**Tone**: Excitable, helpful, slightly overwhelming
**Pace**: Fast, enthusiastic

---

## VENDOR 2: MADAM KOZLOV

### Basic Information
**Role**: Premium Tech Dealer
**Location**: Uptown adjacent, appointment only
**Tier Access**: 4-8
**Specialty**: High-end equipment, corporate-grade gear, discreet service

### Appearance
Elegant older woman, silver hair in precise cut, expensive clothing that suggests old money. Minimal visible chrome—what she has is exquisite and invisible.

### Personality
- **Refined**: Treats sales as art curation
- **Exclusive**: Not everyone gets access
- **Knowledgeable**: Knows every piece's history
- **Discreet**: Never asks uncomfortable questions

### Inventory Style
Premium equipment, corporate-grade tech, items that "shouldn't be available." Everything has a story; nothing has a paper trail.

### Dialogue

**Initial Contact** (requires introduction):
"You come recommended. [Evaluating look] I deal in quality—not volume. If you're looking for bargains, try the Hollows. If you're looking for excellence... we can talk."

**Greeting (Returning Client)**:
"Ah, a valued client returns. [Slight smile] I've acquired something that might interest you. Shall we discuss in private?"

**Browsing**:
"I don't display inventory publicly. Tell me what you need—I'll tell you if I can acquire it. Discretion flows both ways."

**Sales Pitch**:
"This piece came from a Nakamura executive's personal collection. How did I acquire it? [Pause] That's not a question we ask here. What matters: it works perfectly, it's untraceable, and it's available. For the right client."

**Haggling**:
"[Cool amusement] My prices reflect value, not negotiation. If you find my rates excessive, you're welcome to seek alternatives. [Knowing] You won't find this quality elsewhere."

**After Purchase**:
"A pleasure, as always. The item will be delivered through secure channels. Should any... complications arise, you know how to reach me. Discretion guaranteed."

### Story Flags
**Sets**: `MET_MADAM_KOZLOV`, `KOZLOV_TRUST` (integer)
**Requires**: `TIER >= 4`, introduction from high-tier contact
**Unlocks**: Corporate-grade equipment access

### Voice Direction
**Tone**: Refined, confident, slightly mysterious
**Pace**: Measured, unhurried

---

## VENDOR 3: "JUNK" JIMMY OKAFOR

### Basic Information
**Role**: Salvage Tech Specialist
**Location**: Red Harbor, warehouse district
**Tier Access**: 1-5
**Specialty**: Salvaged parts, custom modifications, if-it-fits-it-ships

### Appearance
Middle-aged, covered in grease and solder burns, missing three fingers (replaced with mismatched chrome). Workshop chaos made person.

### Personality
- **Creative**: Sees potential in everything
- **Unconventional**: Solutions that shouldn't work, do
- **Blunt**: Says exactly what he thinks
- **Generous**: Helps people who need it

### Inventory Style
Salvaged components, custom modifications, "Frankenstein" gear that's ugly but functional. Nothing looks pretty; everything works.

### Dialogue

**Greeting**:
"Don't judge by the mess—judge by the results! [Gestures at chaotic workshop] I've got parts from everywhere. Nakamura, Convergence, pre-Algorithm vintage. What're you building?"

**Browsing**:
"Dig through the bins if you want. Everything's mostly labeled. If it sparks, it's probably still charged. If it smokes... put it back gently."

**Sales Pitch**:
"Standard nav unit? Boring. Now this—[holds up frankensteined device]—this is three nav units, a defunct Algorithm interface, and a coffee maker's processor. Sounds crazy. Works better than anything stock."

**Custom Work**:
"You want custom? I do custom. Bring me the parts, describe what you need, and I'll make it happen. Might take a few tries. Might explode once. But we'll get there."

**Haggling**:
"[Shrug] Credits are nice. Know what's nicer? Interesting parts. You bring me something I haven't seen before, we'll call it even."

**After Purchase**:
"She's ugly but she's yours! [Pats device affectionately] If something stops working, bring it back. I'll fix it or find out why it exploded. Learning either way!"

### Story Flags
**Sets**: `MET_JUNK_JIMMY`, `JIMMY_CUSTOM_JOBS` (integer)
**Unlocks**: Custom modification services, salvage trading

### Voice Direction
**Tone**: Enthusiastic, slightly manic, genuine warmth
**Pace**: Quick, punctuated by mechanical sounds

---

## VENDOR 4: SERENA VANCE

### Basic Information
**Role**: Medical Tech Specialist
**Location**: Hollows clinic adjacent, legitimate storefront
**Tier Access**: 2-6
**Specialty**: Medical chrome, biomonitors, health-focused tech

### Appearance
Professional presentation, medical-adjacent clothing, visible chrome that's clearly health-monitoring. Calm, clinical demeanor.

### Personality
- **Professional**: Treats customers as patients
- **Careful**: Won't sell inappropriate items
- **Ethical**: Has limits on what she provides
- **Knowledgeable**: Medical background shows

### Inventory Style
Medical-grade chrome, biomonitors, health optimization gear. Everything certified, everything explained, nothing that could harm.

### Dialogue

**Greeting**:
"Welcome. [Professional nod] I specialize in medical technology—enhancement that works with your biology, not against it. How can I help your health today?"

**Assessment**:
"Before I recommend anything, I need to understand your current state. Any existing chrome? Medical conditions? Allergies? [Scans] I don't sell blind."

**Browsing**:
"My inventory is organized by function: monitoring, recovery, enhancement, emergency. Everything's certified. I can provide documentation if your insurance requires it."

**Sales Pitch**:
"This biomonitor tracks seventeen vital signs and interfaces with most Algorithm integrations. Alerts you before problems become emergencies. In my professional opinion, every courier should have one."

**Ethical Limit**:
"[Firm] I don't sell combat-oriented medical tech. If you want trauma patches for offense, look elsewhere. I help people stay healthy, not hurt others."

**After Purchase**:
"I'll include calibration instructions. If you experience any integration issues, return within 30 days for free adjustment. Your health is the priority."

### Story Flags
**Sets**: `MET_SERENA_VANCE`, `MEDICAL_VENDOR_ACCESS`
**Unlocks**: Premium biomonitors, recovery gear

### Voice Direction
**Tone**: Clinical, caring, professional
**Pace**: Measured, clear

---

## VENDOR 5: MARCUS "BLACKOUT" ROSS

### Basic Information
**Role**: Security Tech Dealer
**Location**: Various (moves frequently)
**Tier Access**: 3-7
**Specialty**: Counter-surveillance, security bypasses, "privacy" equipment

### Appearance
Unremarkable by design—forgettable face, generic clothing, nothing that stands out. The kind of person you look at and immediately forget.

### Personality
- **Paranoid**: Assumes everyone's listening
- **Professional**: Strictly business
- **Cautious**: Vets all customers carefully
- **Principled**: Won't sell to bad actors

### Inventory Style
Counter-surveillance gear, privacy equipment, security bypasses. Nothing obviously illegal—everything "hypothetically" legal with the right permits.

### Dialogue

**Initial Contact**:
"[Checks surroundings] You were recommended. [Pause] Let's keep this brief. What do you need to not be seen?"

**Vetting**:
"Before we talk inventory, I need to know what you're protecting yourself from. Corporate surveillance? Faction monitoring? Law enforcement? [Careful] I sell privacy. I don't enable crime."

**Browsing**:
"I don't display. You describe the problem; I describe the solution. Less visible, less traceable. Understand?"

**Sales Pitch**:
"This scrambler defeats standard corporate surveillance within a 10-meter radius. Theoretically. I'm not admitting it works on their specific frequencies. I'm saying, hypothetically, it might."

**Security Check**:
"[Suspicious] You're asking a lot of questions. [Pause] That's fine. Curious is better than careless. But I'm watching how you use what you buy. We clear?"

**After Purchase**:
"Don't contact me for a week after purchase. Standard precaution. If you need support, leave a message at [describes dead drop]. I'll respond when I'm sure you're not being followed."

### Story Flags
**Sets**: `MET_BLACKOUT_MARCUS`, `SECURITY_VENDOR_ACCESS`
**Requires**: Introduction from underground contact
**Unlocks**: Counter-surveillance equipment

### Voice Direction
**Tone**: Quiet, careful, slightly paranoid
**Pace**: Measured, with pauses to check surroundings

---

## VENDOR 6: YUKI "SPARKLE" TANAKA

### Basic Information
**Role**: Aesthetic Tech Designer
**Location**: Uptown adjacent, boutique studio
**Tier Access**: 2-6
**Specialty**: Cosmetic chrome, visible enhancements, "fashion tech"

### Appearance
Walking advertisement—visible chrome that's art more than function, clothing that shifts colors, holographic accents. Style incarnate.

### Personality
- **Artistic**: Sees chrome as self-expression
- **Trendy**: Always knows what's current
- **Friendly**: Genuinely enjoys helping people look good
- **Superficial**: Sometimes misses deeper concerns

### Inventory Style
Cosmetic enhancements, visible chrome, "statement pieces." Everything's about appearance, though function isn't ignored.

### Dialogue

**Greeting**:
"Oh, you have such potential! [Circles player] I can see exactly what would work. Have you considered dermal highlights? Your bone structure would be stunning with subtle glow accents."

**Assessment**:
"Tell me about yourself! Not your job—your style. What do you want people to see when they look at you? Chrome is communication. What's your message?"

**Browsing**:
"[Gesturing at displays] These are last season—still gorgeous, but if you want cutting-edge, talk to me about custom work. I collaborate with three Algorithm designers. Revolutionary stuff."

**Sales Pitch**:
"These optical enhancements don't just look amazing—they actually improve your low-light vision by 40%. Beauty and function! Why choose when you can have both?"

**Trend Alert**:
"Oh, you know what's trending for couriers right now? Subtle integration indicators. A little glow that shows you're Algorithm-connected, but tasteful. Very in-demand."

**After Purchase**:
"You are going to turn heads! [Excited] Send me photos of how it looks in action—I'm building a portfolio of happy clients. Maybe you could be featured?"

### Story Flags
**Sets**: `MET_SPARKLE_YUKI`, `COSMETIC_VENDOR_ACCESS`
**Unlocks**: Aesthetic enhancements, trend information

### Voice Direction
**Tone**: Enthusiastic, fashion-forward, friendly
**Pace**: Quick, excited, lots of compliments

---

## VENDOR 7: OLD MAN HENRIK

### Basic Information
**Role**: Vintage Tech Curator
**Location**: Hollows, basement shop
**Tier Access**: All (different inventory per tier)
**Specialty**: Pre-Algorithm technology, antiques, "unplugged" gear

### Appearance
Elderly, weathered, no visible chrome at all. Clothing from decades past, hands that show years of careful work. Eyes sharp despite age.

### Personality
- **Nostalgic**: Remembers before Algorithm
- **Knowledgeable**: Walking encyclopedia of old tech
- **Suspicious**: Doesn't trust "modern" solutions
- **Generous**: Helps those who appreciate history

### Inventory Style
Pre-Algorithm equipment, analog alternatives, vintage items that still work. For people who want options outside the connected world.

### Dialogue

**Greeting**:
"[Looks up from workbench] Another one seeking the old ways? [Squints] Or just curious what life was like before they put computers in our heads?"

**Philosophy**:
"Everything today is connected. Algorithm talks to Algorithm talks to network talks to corporation. [Taps analog device] This? This talks to nobody. Sometimes that's what you need."

**Browsing**:
"Nothing's organized by category—it's organized by era. 2030s on the left, 2020s middle, pre-digital in the vault. [Protective] The vault isn't for browsers. It's for believers."

**Sales Pitch**:
"This commlink uses radio frequencies—no network interface, no Algorithm compatibility, no corporate monitoring. Heavy? Yes. Reliable? [Taps head] Sixty years and still working."

**Test of Respect**:
"[Studying player] You actually care about this, or you just need something untraceable? [Either answer is acceptable] Both are valid reasons. Just curious which brought you here."

**After Purchase**:
"Take care of her. [Hands over item] Some of these can't be replaced. They don't make them anymore. Probably never will. You're holding history."

### Story Flags
**Sets**: `MET_OLD_HENRIK`, `VINTAGE_VENDOR_ACCESS`
**Unlocks**: Analog alternatives, unplugged equipment, historical tech

### Voice Direction
**Tone**: Weary, knowledgeable, quietly passionate
**Pace**: Slow, deliberate

---

## VENDOR 8: "GHOST" ALEXANDRA PETROV

### Basic Information
**Role**: Black Market Tech Broker
**Location**: Rotating, by appointment only
**Tier Access**: 5-8
**Specialty**: Illegal modifications, restricted tech, items that don't exist

### Appearance
Constantly shifting—changes appearance regularly, never the same look twice. What's consistent: sharp eyes, perfect composure, expensive taste.

### Personality
- **Professional**: Treats crime as high-end business
- **Discreet**: Never names sources or clients
- **Expensive**: Quality costs, especially illegality
- **Dangerous**: Not someone to cross

### Inventory Style
Restricted equipment, illegal modifications, items with "interesting" provenance. If it's forbidden, expensive, and dangerous—she might have it.

### Dialogue

**Initial Contact** (requires high-tier introduction):
"You come with impressive references. [Evaluating] What you're looking for doesn't officially exist. The question is whether you can afford things that don't exist."

**Vetting**:
"I need to know two things: what you want, and what you're willing to risk. Everything I sell has consequences. I don't mean legal—I mean existential. Understand?"

**Browsing**:
"I don't maintain inventory. I maintain access. Tell me what you need; I'll tell you if it's possible. Then we'll discuss price—which is never just credits."

**Sales Pitch**:
"This modification was developed for Nakamura's black ops division. They deny it exists. [Slight smile] They're technically correct—it exists, but not officially. Available for the right price."

**Warning**:
"[Serious] What I provide can change what you're capable of. It can also change who you are. Some modifications don't have undo buttons. Are you prepared for permanence?"

**After Purchase**:
"Our business is concluded. [Pause] I trust you understand that discussing our transaction would be... unwise. For both of us. Pleasure doing business."

### Story Flags
**Sets**: `MET_GHOST_ALEXANDRA`, `BLACK_MARKET_TECH_ACCESS`
**Requires**: `TIER >= 5`, exceptional introduction
**Unlocks**: Restricted modifications, forbidden technology

### Voice Direction
**Tone**: Cool, professional, underlying danger
**Pace**: Controlled, deliberate

---

## VENDOR RELATIONSHIP WEB

### Connections
- **Pixel** respects **Junk Jimmy** (fellow tinkerer)
- **Madam Kozlov** dislikes **Sparkle Yuki** (calls her "frivolous")
- **Old Henrik** mentored **Serena Vance** decades ago
- **Blackout Marcus** gets security intel from **Ghost Alexandra**
- **Ghost Alexandra** sourced premium items for **Madam Kozlov**

### Tier Progression
- Tier 0-2: Pixel, Junk Jimmy, Old Henrik
- Tier 3-4: Serena, Blackout, Sparkle
- Tier 5+: Madam Kozlov, Ghost Alexandra

---

*Tech Vendors v1.0*
*Phase 6 Day 16*
*8 vendor profiles for equipment purchasing*
