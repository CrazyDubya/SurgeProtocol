# Environmental Combat Reactions

## Overview
Player and Algorithm lines that react to environmental hazards, cover opportunities, and tactical situations during combat.

---

## Hazard Warnings

### Player Self-Observations

**Electrical Hazards**:
"Exposed wiring—one wrong step and I'm fried."
"Power conduit's unstable. Could use that."
"That junction box is sparking. Keep distance."

**Chemical/Gas Hazards**:
"Something's leaking. Don't breathe deep."
"Coolant rupture—that stuff burns skin."
"Gas main. One spark and we all go up."

**Structural Hazards**:
"This floor won't hold much longer."
"Ceiling's coming down. Move fast."
"That support beam's compromised."

**Fire Hazards**:
"Fire spreading. Find another route."
"Fuel containers—very flammable."
"Heat's rising. Can't stay here long."

**Height/Fall Hazards**:
"Long way down. Don't slip."
"Railing's rusted through. Careful."
"One wrong move and gravity wins."

---

## Algorithm Tactical Suggestions

### Cover Observations

**Good Cover**:
"Structural analysis: that pillar provides 73% ballistic protection."
"Recommended: reinforced desk, 1.2 meters left. Optimal cover."
"Container composition: steel. Adequate protection from small arms."

**Compromised Cover**:
"Warning: current cover degrading. 12 seconds until structural failure."
"That barrier won't stop armor-piercing rounds. Relocate advised."
"Cover compromised—they're flanking your position."

**No Cover Available**:
"Analysis: no adequate cover within 5 meters. Mobility recommended."
"Exposed position. Suppressive fire or immediate relocation required."
"Tactical assessment: you're in a killzone. Exit north."

### Flanking Observations

**Enemy Flanking**:
"Movement detected: hostile approaching from 7 o'clock."
"They're circling. Expect contact from multiple angles."
"Flanking maneuver in progress. Reposition to deny approach."

**Flanking Opportunity**:
"Enemy fixated on your last position. Flanking window available."
"Blind spot identified: 3 o'clock, 8 meters. Undefended approach."
"Their formation has a gap. Exploitable with quick movement."

### Environmental Exploitation

**Explosive Opportunities**:
"Fuel tank in enemy cluster. Single shot could resolve multiple hostiles."
"Gas main accessible. Ignition would create significant area denial."
"Warning: firing near that container risks explosive decompression. Opportunity or threat—your judgment."

**Electrical Opportunities**:
"Water on floor. Severed power cable 3 meters right. Conductivity high."
"Enemy near junction box. Overload would incapacitate."
"Chrome-heavy hostile. EMP-susceptible. Recommend electrical disruption."

**Structural Opportunities**:
"Support strut compromised. Collapse would block pursuit route."
"Overhead cargo. Release mechanism accessible. Enemy position beneath."
"That scaffold is one shot from falling. Three hostiles in drop zone."

---

## Escape Route Observations

### Player Observations

**Route Identification**:
"There—maintenance hatch. Could squeeze through."
"Fire escape outside. If I can reach the window."
"Ventilation shaft. Tight but passable."

**Route Assessment**:
"Back alley's clear. For now."
"Rooftop access—if that ladder holds."
"Sewer grate. Not pleasant, but they won't follow."

**Route Compromised**:
"Exit's blocked. Need another way."
"They've got the stairs covered. Trapped."
"Window's my only option. Hope it's not a long drop."

### Algorithm Route Guidance

**Optimal Escape**:
"Mapping egress routes. Primary: service corridor, 15 meters north."
"Recommended extraction: rooftop access. Pursuit probability lowest."
"Analysis complete: basement exit provides 89% evasion probability."

**Alternative Routes**:
"Primary route compromised. Secondary: ventilation system, 4 meters up."
"Recalculating. Sewage maintenance tunnel accessible via floor grate."
"Hostiles blocking optimal exit. Alternative: window breach, adjacent building 3 meter gap."

**No Viable Escape**:
"All exit routes compromised. Combat resolution required before extraction."
"Trapped. Recommend creating exit through hostile positions."
"No escape detected. Fortify position and await opportunity."

---

## Combat State Observations

### Pre-Combat Warnings

**Ambush Detected**:
"Thermal signatures ahead. They're waiting."
"Movement patterns suggest ambush formation."
"It's too quiet. They know we're coming."

**Enemy Preparation**:
"They're setting up. Won't get easier if we wait."
"Reinforcements arriving in approximately 90 seconds."
"They're fortifying. Strike now or face entrenched opposition."

### Mid-Combat Status

**Advantage**:
"They're breaking. Press the attack."
"Enemy morale dropping. Victory probability rising."
"Momentum is yours. Maintain pressure."

**Stalemate**:
"Neither side advancing. Consider tactical repositioning."
"Deadlock. Environmental exploitation may break impasse."
"They won't move. Neither can we. Something has to change."

**Disadvantage**:
"Sustaining significant damage. Tactical withdrawal recommended."
"Outnumbered and outpositioned. Reassess approach."
"This engagement is not favorable. Disengage if possible."

### Post-Combat

**Area Secure**:
"Hostiles neutralized. Area secure—temporarily."
"Combat complete. Recommend rapid departure before reinforcements."
"Threat eliminated. Salvage window approximately 3 minutes."

**Pursuit Likely**:
"Shots fired. They'll have heard. Expect response teams."
"Alarm triggered. Corporate security en route. Time critical."
"You've made noise. The Algorithm is tracking it. Move."

---

## Shadow Combat Commentary

### Tactical Disagreement

**Shadow Prefers Aggression**:
"We could end this faster. You're being too careful."
"They're weak. Push through. I would."
"Hiding behind cover while they reload. Boring choice."

**Shadow Prefers Caution**:
"That was reckless. We almost died. I almost died."
"Maybe don't charge the one with the heavy weapon next time."
"The old us would have found another way. Smarter."

**Shadow Observes Environment**:
"That pipe's leaking something nasty. Might be useful."
"I remember this place. There's a back exit. Left, behind the crates."
"They're not watching the ceiling. Just saying."

### Combat Philosophy

**After Killing**:
"Another one. Does it get easier? It shouldn't."
"They were people. Were. Past tense now."
"Necessary. I know. Still."

**After Showing Mercy**:
"Mercy. Interesting choice. Hope it doesn't cost us."
"They'll remember you spared them. For better or worse."
"The old us would've done the same. I think."

---

## Line Count Summary

| Category | Lines |
|----------|-------|
| Hazard Warnings | 15 |
| Cover Observations | 15 |
| Flanking/Tactics | 12 |
| Environmental Exploitation | 12 |
| Escape Routes | 18 |
| Combat State | 18 |
| Shadow Commentary | 12 |
| **Total** | **102** |

---

## Implementation Notes

### Trigger Conditions
- Hazard warnings: Player enters hazard proximity
- Cover: Combat initiated, position evaluated
- Flanking: Enemy movement patterns detected
- Exploitation: Environmental objects in combat zone
- Escape: Player health low or requests route
- State: Combat phase changes

### Priority
- Immediate danger warnings highest priority
- Tactical suggestions medium priority
- Commentary lowest priority

### Voice Variation
- Algorithm: Analytical, precise, percentage-based
- Player: Terse, observational, practical
- Shadow: Emotional, questioning, philosophical
