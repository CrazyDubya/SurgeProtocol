# Procedural Job Briefing Framework

## Purpose
Template system for generating varied courier job descriptions. Provides structure for randomized deliveries that feel hand-crafted while maintaining narrative consistency.

---

## CORE TEMPLATE STRUCTURE

### Basic Job Briefing Format

```
[JOB_SOURCE] has a [URGENCY] delivery.
[PACKAGE_DESCRIPTION]
[PICKUP_LOCATION] to [DROPOFF_LOCATION].
[CLIENT_PERSONALITY_LINE]
[PAYMENT_INFO]
[OPTIONAL_COMPLICATION_HINT]
```

### Variable Slots

| Slot | Description | Tier Sensitivity |
|------|-------------|------------------|
| `[JOB_SOURCE]` | Who's offering the job | Yes - contacts upgrade with tier |
| `[URGENCY]` | Time pressure level | Yes - higher tiers = tighter windows |
| `[PACKAGE_DESCRIPTION]` | What you're carrying | Yes - legality scales with tier |
| `[PICKUP_LOCATION]` | Start point | Partial - some areas tier-locked |
| `[DROPOFF_LOCATION]` | End point | Partial - some areas tier-locked |
| `[CLIENT_PERSONALITY_LINE]` | Flavor dialogue | No - universal archetypes |
| `[PAYMENT_INFO]` | Credits offered | Yes - scales with tier |
| `[COMPLICATION_HINT]` | Optional warning | Yes - complexity scales |

---

## JOB SOURCE TEMPLATES

### Tier 0-2: Street Level

**Chen's Board** (Tutorial/Early)
```
Chen taps the board. "Got one for you, rookie."
[He slides a job card across the counter.]
"Simple run. Don't overthink it."
```

**Street Contact**
```
A message pings your comm. Unknown sender.
"Friend of a friend says you're reliable. Got work."
[Location coordinates attached.]
```

**Vendor Referral**
```
The vendor leans in. "You do deliveries, right?"
[They glance around nervously.]
"My usual guy ghosted. You interested?"
```

**Posted Bulletin**
```
[COURIER NEEDED - NO QUESTIONS]
Standard rate. Pickup: [LOCATION]
First come, first served.
```

### Tier 3-4: Established

**Fixer Network**
```
Delilah's voice crackles through encrypted channel.
"Got something that needs... discretion."
[Job details download to your HUD.]
"Usual terms. Don't disappoint."
```

**Corporate Back-Channel**
```
[PRIORITY DELIVERY - CONTRACTOR TIER 3+]
Client: [REDACTED]
Package: Sensitive Materials
Compensation: Above market rate
[Accept/Decline]
```

**Union Job Board**
```
Lopez forwarded a union job.
"One of ours needs help. Off-book."
[Details: working class client, modest pay, high trust]
```

**Reputation Pull**
```
"Heard you handled the [PREVIOUS_JOB] clean."
[A new contact materializes from your network.]
"Got something bigger. You in?"
```

### Tier 5-6: Gray Zone

**Anonymous Drop**
```
[ENCRYPTED TRANSMISSION - ORIGIN UNKNOWN]
No names. No questions. Triple rate.
Pickup in 2 hours. Yes or no.
```

**Interstitial Whisper**
```
The message arrives through channels that shouldn't exist.
[It reads like static, but you understand.]
"The between-space has a delivery. For those who can see."
```

**Corporate Defector**
```
"I'm burning my clearance sending this."
[The voice is scrambled, terrified.]
"I need something moved before they find me. Please."
```

**Ghost Network Ping**
```
[GHOST NETWORK - VERIFIED MEMBER]
Priority extraction. Package is... complicated.
Phantom vouches for the client.
Standard network rates apply.
```

### Tier 7-8: Elite

**Faction Mandate**
```
[PRIORITY ALPHA - FACTION AUTHORIZATION REQUIRED]
This delivery affects the balance.
Choose your allegiance carefully.
[Ascension Path / Rogue Path / Third Path indicators]
```

**Algorithm Suggestion**
```
ALGORITHM: "I've identified an opportunity."
[Data streams across your vision.]
ALGORITHM: "High risk. High relevance. Your choice."
```

**Solomon's Request**
```
The message carries weight beyond its words.
"The Third Path requires... movement."
[No payment listed. No refusal expected.]
```

**Final Clients**
```
"You're the only one I trust with this."
[A name you recognize. A debt you owe.]
"One last run. Then we're even."
```

---

## URGENCY TEMPLATES

### Casual (No Timer)
- "No rush. Get it there when you can."
- "Sometime today works."
- "Client's flexible. Take a scenic route if you want."

### Standard (Generous Timer)
- "Within the hour, if possible."
- "End of day. Sooner is better."
- "Before the night shift change."

### Priority (Tight Timer)
- "You've got thirty minutes. Starting now."
- "They're waiting. Don't make them wait long."
- "Clock's ticking. Move."

### Critical (Minimal Timer)
- "Fifteen minutes. That's all you've got."
- "If you're not there in ten, don't bother going."
- "Run. Now. Every second counts."

### Emergency (Real-Time Pressure)
- "They're dying. Literally. Go."
- "The window closes in five minutes. Forever."
- "This is a one-shot. Miss it and people die."

---

## PAYMENT TEMPLATES

### Tier 0-2 Rates
```
Pay: 50-150 credits
"Standard rate. Take it or leave it."
"Fifty now, fifty on completion."
"Hundred credits. Fair for fair work."
```

### Tier 3-4 Rates
```
Pay: 200-500 credits
"Three hundred. Non-negotiable."
"Four fifty, plus expenses if things get complicated."
"Five hundred. Worth it for what you're carrying."
```

### Tier 5-6 Rates
```
Pay: 600-1500 credits
"A thousand credits. Questions cost extra."
"Fifteen hundred. You'll understand when you see the package."
"Eight hundred base. Bonus for discretion."
```

### Tier 7-8 Rates
```
Pay: 2000-5000 credits
"Three thousand. This job doesn't exist."
"Five thousand. And a favor owed."
"Name your price. Within reason."
```

### Non-Credit Payment
```
"No credits. But I can get you [ITEM/ACCESS/INFORMATION]."
"Payment is... continued existence. Understood?"
"You do this, I owe you. That's worth more than credits."
"Information. The kind that changes everything."
```

---

## COMPLICATION HINT TEMPLATES

### No Complications
- [No additional text]
- "Should be clean. Shouldn't be."
- "Easy money. Theoretically."

### Minor Complications
- "Might hit some traffic in [DISTRICT]."
- "Weather's supposed to turn. Bring gear."
- "The pickup location's... not great. Watch yourself."

### Moderate Complications
- "Heard there's gang activity on the route. Your call."
- "The client's being watched. Be subtle."
- "Package is fragile. And I don't mean physically."

### Serious Complications
- "Someone else wants this delivery to fail. Act accordingly."
- "You're not the only courier they contacted. Race conditions."
- "If anyone asks, you were never here. Neither was I."

### Extreme Complications
- "This is going to get violent. Prepare or decline."
- "Corporate security is active in the area. High alert."
- "The package... knows it's being moved. Keep it contained."

---

## LOCATION DESCRIPTORS

### Pickup Atmosphere

**Neutral Locations**
```
Standard handoff point. Public enough to be safe, private enough to avoid attention.
```

**Sketchy Locations**
```
The kind of place where questions get you hurt.
Don't linger. Don't look around. Get the package and go.
```

**Corporate Locations**
```
Service entrance. Badge provided. Act like you belong.
Security is tight but predictable. Follow the protocol.
```

**Underground Locations**
```
Three levels down. Past the checkpoint that doesn't exist.
You'll know it when you see the [MARKER].
```

**Interstitial Adjacent**
```
The address doesn't exist on standard maps.
Trust your Algorithm. Or your instincts. Same thing now.
```

### Dropoff Atmosphere

**Public Dropoff**
```
Busy area. Blend with the crowd. Package changes hands, you walk away.
```

**Private Residence**
```
Someone's home. They're expecting you. Knock twice, wait, knock once.
```

**Corporate Office**
```
Reception desk. Use the code word. Leave the package. Don't sign anything.
```

**Dead Drop**
```
Location marked. Leave the package. Don't wait for confirmation.
You'll know if it worked.
```

**Moving Target**
```
Client is mobile. Track the beacon. Intercept at [WINDOW].
Miss the window, miss the payment.
```

---

## ASSEMBLY EXAMPLES

### Tier 1 - Simple Delivery
```
Chen taps the board. "Got one for you, rookie."
[He slides a job card across the counter.]

Medical supplies. Nothing fancy, but the clinic needs them.
Pickup at Harbor Pharmacy, dropoff at Hollows Free Clinic.
"Doc Yusuf's good people. Don't keep him waiting."

Pay: 75 credits. Standard rate.
Should be clean. Shouldn't be.
```

### Tier 4 - Gray Zone Run
```
Delilah's voice crackles through encrypted channel.
"Got something that needs... discretion."

Corporate data chip. Former employee wants it gone.
Pickup at Uptown parking garage, Level 3. Dropoff at Ghost Network node.
"Client's nervous. Reassure them. Or don't. Just get it done."

Pay: 450 credits. Non-negotiable.
Someone else wants this delivery to fail. Act accordingly.
```

### Tier 7 - Faction Critical
```
The message carries weight beyond its words.
"The Third Path requires... movement."

A memory core. Someone's entire self, digitized.
Pickup from Nakamura Tower basement. Dropoff... you'll know when you arrive.
[No payment listed. No refusal expected.]

This is going to get violent. Prepare or decline.
```

---

## IMPLEMENTATION NOTES

### Randomization Guidelines
1. Match tier bands strictly for payment and complications
2. Location pairs should be geographically sensible
3. Client personality should contrast with job tone occasionally (nervous client, easy job)
4. Urgency should correlate with payment (higher pay = tighter window)
5. Complication hints should be 70% accurate, 30% misleading (builds tension)

### Integration with Existing Systems
- Pull client archetypes from `client_profiles.md`
- Pull package types from `package_descriptions.md`
- Pull complications from `/04_COMPLICATIONS/complications_library.md`
- Location names from existing district files

### Voice Consistency
- Chen: Gruff, protective, mentor-like
- Delilah: Professional, curt, all-business
- Ghost Network: Cryptic, technical, paranoid
- Algorithm: Analytical, suggestive, never commanding
- Street contacts: Varied, but always transactional

---

## FLAG INTEGRATION

### Job Completion Flags
```
JOB_COMPLETED_[TIER]_[COUNT]  // Tracks total jobs per tier
PERFECT_DELIVERY_STREAK       // Consecutive no-complication completions
FAILED_DELIVERY_COUNT         // Total failures
REPUTATION_[DISTRICT]         // District-specific standing
```

### Condition Checks for Job Availability
```
TIER >= [required_tier]
REPUTATION_[DISTRICT] >= [threshold]    // For premium jobs
NOT HOSTILE_TO_[FACTION]                // Faction jobs require standing
[PREVIOUS_JOB_FLAG]                     // Chain jobs require completion
```

---

*Job Briefing Framework v1.0*
*Phase 6 Day 1*
