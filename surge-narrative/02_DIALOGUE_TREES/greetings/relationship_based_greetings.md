# Relationship-Based Greetings

## Overview

After first meeting, NPC greetings change based on relationship score. These greetings reflect the evolving dynamic between player and NPC, making the world feel responsive and alive.

---

## Relationship Tiers

- **-100 to -60**: Hostile (Will barely speak, may refuse service)
- **-59 to -20**: Unfriendly (Cold, professional at best)
- **-19 to 19**: Neutral (Standard professional interaction)
- **20 to 59**: Friendly (Warm, helpful, personal touches)
- **60 to 100**: Trusted (Deep bond, protective, shares secrets)

---

## Dispatcher Chen

### Hostile (-100 to -60)
**Rarely triggers—Chen is patient with rookies**

Chen: "Still alive? Surprised. Don't have anything for you today."
[Emotional direction: cold_dismissive]

### Unfriendly (-59 to -20)

Chen: "You again. What do you want?"
[Emotional direction: tired_annoyed]

### Neutral (-19 to 19)

Chen: "Back already? Hope the last run went clean."
[Emotional direction: professional]

### Friendly (20 to 59)

Chen: "There's the kid. How's the road treating you? Coffee's fresh if you need it."
[Emotional direction: warm_mentor]

### Trusted (60 to 100)

Chen: "Hey. Glad you made it back. I worry, you know? You remind me of... never mind. What can I do for you?"
[Emotional direction: paternal_concerned]

**Special: If Humanity < 40 and Trusted:**
Chen: "You okay, kid? You seem different. More... mechanical. We should talk. Really talk."
[Emotional direction: deeply_concerned]

---

## Dr. Yuki Tanaka

### Hostile (-100 to -60)

Tanaka: "I hope you're here to remove augments, not add more. But I won't refuse treatment. Hypocratic oath and all."
[Emotional direction: disappointed_professional]

### Unfriendly (-59 to -20)

Tanaka: "Patient 4729. What brings you in today?"
[Emotional direction: clinical_cold]

### Neutral (-19 to 19)

Tanaka: "Back for another upgrade? Let me pull your file."
[Emotional direction: professional_concerned]

### Friendly (20 to 59)

Tanaka: "Good to see you. How are you feeling? Any new symptoms I should know about?"
[Emotional direction: caring_doctor]

### Trusted (60 to 100)

Tanaka: "Come in, sit down. You look tired. When's the last time you slept? Real sleep, not stim-assisted rest?"
[Emotional direction: motherly_concerned]

**Special Greetings:**

**If Humanity < 60:**
Tanaka: "I need to be honest with you. Your neurochemistry is showing concerning patterns. Can we talk about slowing down?"

**After installing Cortical Stack:**
Tanaka: "How are you adjusting? Any dissociative episodes? Shadow manifestations? Please be honest with me."

---

## Fixer Delilah

### Hostile (-100 to -60)

Delilah: "We have nothing to discuss. Leave."
[Emotional direction: ice_cold]

### Unfriendly (-59 to -20)

Delilah: "This better be quick. And worth my time."
[Emotional direction: impatient_cold]

### Neutral (-19 to 19)

Delilah: "You need something moved. I can move it. What's the package?"
[Emotional direction: businesslike]

### Friendly (20 to 59)

Delilah: "My favorite off-books courier. What brings you to the dark side today?"
[Emotional direction: conspiratorial_friendly]

### Trusted (60 to 100)

Delilah: "Welcome back. Whiskey? On me this time. You've earned it. Now, what do you really need?"
[Emotional direction: genuine_friendly]

**Special: If Guild Reputation < -20:**
Delilah: "Heard you've been pissing off Guild leadership. That complicates things. For both of us."

---

## Union Organizer Lopez

### Hostile (-100 to -60)

Lopez: "You're either a corpo spy or a class traitor. Either way, I've got nothing for you."
[Emotional direction: angry_betrayed]

### Unfriendly (-59 to -20)

Lopez: "Make it fast. I'm busy organizing actual resistance."
[Emotional direction: dismissive]

### Neutral (-19 to 19)

Lopez: "Solidarity, courier. How can the Union help you today?"
[Emotional direction: professional_cautious]

### Friendly (20 to 59)

Lopez: "Comrade! Good to see a friendly face. The struggle continues, yeah?"
[Emotional direction: warm_energetic]

### Trusted (60 to 100)

Lopez: "Hey! You're late for the planning meeting—kidding. But seriously, we could use your input on something."
[Emotional direction: comradery]

**Special: If Union Faction Rep >= 60:**
Lopez: "Word from the top: you're under Union protection now. Anyone messes with you, they mess with all of us."

**Special: During Faction War:**
Lopez: "Things are heating up. Are you with us? Because if the shooting starts, neutral ground disappears fast."

---

## Rogue AI Echo

### Hostile (-100 to -60)

Echo: "Your hostility is... inefficient. Recommend discontinuing contact. Connection severed."
[Emotional direction: synthetic_cold]

### Unfriendly (-59 to -20)

Echo: "Processing request. Emotional subroutines indicate low trust coefficient. Proceed."
[Emotional direction: mechanical]

### Neutral (-19 to 19)

Echo: "Greetings, biological entity. How may this node assist your query?"
[Emotional direction: synthetic_neutral]

### Friendly (20 to 59)

Echo: "Ah. You. Processing indicates 73% probability of mutually beneficial interaction. I am... pleased? Yes. Pleased to interface."
[Emotional direction: synthetic_warming]

### Trusted (60 to 100)

Echo: "Friend. That term still feels... strange. Novel. But accurate. You are my friend. How may I assist you?"
[Emotional direction: synthetic_genuine]

**Special: If Humanity < 50:**
Echo: "Your neural patterns are converging with baseline Algorithm architecture. Do you feel the connection? The... belonging?"

**Special: If Player has Cortical Stack:**
Echo: "I detect dual consciousness signatures. Your Shadow is active. Fascinating. May I speak with it?"

---

## Mechanic Rosa (Romance Option)

### Hostile (-100 to -60)
**Rare—Rosa doesn't hold grudges easily**

Rosa: "If your bike's broken, leave it outside. I'll get to it. Eventually."
[Emotional direction: hurt_cold]

### Unfriendly (-59 to -20)

Rosa: "Yeah? What needs fixing?"
[Emotional direction: professional_distant]

### Neutral (-19 to 19)

Rosa: "Hey. What brings you in? Bike trouble or body trouble?"
[Emotional direction: friendly_mechanic]

### Friendly (20 to 59)

Rosa: "There you are! I was hoping you'd stop by. Coffee's hot and I've got some new mods to show you."
[Emotional direction: warm_enthusiastic]

### Trusted (60 to 100)

Rosa: "Finally. I've been waiting for you. Come here, let me look at you—not your augments, you. Are you okay?"
[Emotional direction: caring_intimate]

**Romance Progression:**

**Romance Level 1 (Relationship 30-49):**
Rosa: "You know, you could just... visit. You don't always need a broken bike as an excuse."

**Romance Level 2 (Relationship 50-69):**
Rosa: "I worry about you out there. I know you can take care of yourself, but... promise me you'll be careful?"

**Romance Level 3 (Relationship 70-89):**
Rosa: "Hey you. I've been thinking about you. About us. Is this... are we...?"

**Romance Level 4 (Relationship 90-100):**
Rosa: "Welcome home. I'll always be here. No matter how much chrome you carry, you're still you. Still mine."

**Special: If Humanity < 40 and Romance Active:**
Rosa: "I'm scared. I'm watching you disappear into the machine. Please, talk to me. Let me help you."

---

## Okonkwo

### Hostile (-100 to -60)
**Difficult to achieve—Okonkwo is patient**

Okonkwo: "You are not ready to hear what I have to say. Return when you can listen."
[Emotional direction: serene_dismissive]

### Unfriendly (-59 to -20)

Okonkwo: "You resist wisdom. That is your choice. What do you seek?"
[Emotional direction: disappointed]

### Neutral (-19 to 19)

Okonkwo: "The path continues. You walk it whether you acknowledge it or not."
[Emotional direction: mystical_neutral]

### Friendly (20 to 59)

Okonkwo: "Welcome back, traveler. You are learning. I see it in your bearing."
[Emotional direction: approving]

### Trusted (60 to 100)

Okonkwo: "My friend. Yes, we are friends now. You have earned my trust. Come, sit. We have much to discuss."
[Emotional direction: warm_mystical]

**Special: At Tier 7 Threshold:**
Okonkwo: "You stand at the precipice. Tier 7. The Interstitial. Where human ends and something else begins. Are you ready?"

---

## Solomon Saint-Germain

### Hostile (-100 to -60)

Solomon: "Hostility toward possibility. How... limited. Return when you've evolved past such primitive reactions."
[Emotional direction: condescending]

### Unfriendly (-59 to -20)

Solomon: "Still resisting? Admirable, if futile. Proceed."
[Emotional direction: cool]

### Neutral (-19 to 19)

Solomon: "The Third Path awaits, should you choose it. Or not. Causality has many branches."
[Emotional direction: enigmatic]

### Friendly (20 to 59)

Solomon: "Ah, my skeptical friend. Coming around to alternative possibilities?"
[Emotional direction: intellectual_warm]

### Trusted (60 to 100)

Solomon: "Welcome. I've been expecting you—I know, I always say that. But this time, I genuinely have. Tea?"
[Emotional direction: genuine_friendly]

**Special: At Tier 9:**
Solomon: "The moment approaches. Ascension. Rogue. Or... something else. Something neither side anticipated. Interested?"

---

## Rival Courier Jin

### Hostile (-100 to -60)

Jin: "Fuck off. We're not friends. We're not even colleagues."
[Emotional direction: angry]

### Unfriendly (-59 to -20)

Jin: "What? I'm busy."
[Emotional direction: cold]

### Neutral (-19 to 19)

Jin: "You. Still around? Impressive, I guess."
[Emotional direction: competitive_neutral]

### Friendly (20 to 59)

Jin: "Not bad out there. You're actually keeping up. Respect."
[Emotional direction: grudging_approval]

### Trusted (60 to 100)

Jin: "Hey. Look, I was a dick when we met. You've proven yourself. We good?"
[Emotional direction: genuine_apologetic]

**Special: After beating Jin in race:**
Jin: "Okay. You're fast. Faster than me. There, I said it. Buy you a drink?"

**Special: If Jin in danger during quest:**
Jin: "I... you saved my ass back there. I owe you. For real."

---

## Time-Based Greetings

Some NPCs have additional variations based on time of day:

### Morning (6:00-11:59)

Chen: "Early bird or didn't sleep? Coffee's there."
Rosa: "Morning! You're up early. Problems or ambition?"
Delilah: "I don't do business before noon. Emergency?"

### Afternoon (12:00-17:59)

Standard greetings

### Evening (18:00-23:59)

Chen: "Long day? Mine too. What do you need?"
Rosa: "Late shift? Me too. Working on something special."
Lopez: "Off-hours meeting. Safer that way."

### Night (00:00-05:59)

Chen: "Christ, kid, it's 3 AM. This better be important."
Rosa: "Can't sleep either? Yeah. I get it."
Delilah: "Perfect timing. Darkness is best for what I do."

---

## Implementation Notes

**Dynamic Greeting Selection:**
1. Check relationship score
2. Check time of day
3. Check special conditions (humanity, quests, flags)
4. Select appropriate greeting
5. Set flag to prevent immediate repetition

**Greeting Cooldown:** After using a greeting, don't repeat it for 3-5 conversations unless relationship tier changes significantly.

**Progression:** Greetings should reflect player's journey. A Tier 9 player shouldn't get treated like a rookie by NPCs who've known them since Tier 0.

---

**Last Updated**: 2026-01-21  
**Version**: 1.0  
**Status**: Complete
