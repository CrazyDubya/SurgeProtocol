# SURGE PROTOCOL: Complete Data Architecture

## Part 2: Augmentation System

-----

# 4. AUGMENTATION SYSTEM

## 4.1 Body Locations

```sql
TABLE: body_locations
├── id: UUID [PK]
├── code: VARCHAR(30) [UNIQUE]
├── name: VARCHAR(50)
├── description: TEXT
├── parent_location_id: FK -> body_locations
│
├── ## SLOTS
├── augment_slots: INT
├── critical_organ: BOOLEAN
├── visible_externally: BOOLEAN
├── symmetrical: BOOLEAN
│
├── ## GAMEPLAY
├── damage_multiplier: DECIMAL(3,2)
├── natural_armor: INT
├── nerve_density: INT
│
├── ## REQUIREMENTS
├── min_tier_to_augment: INT
├── requires_surgery: BOOLEAN
└── surgery_risk_base: INT [0-100]
```

### SEED: Body Location Hierarchy

```
HEAD
├── BRAIN
│   ├── FRONTAL_LOBE
│   ├── TEMPORAL_LOBE
│   ├── PARIETAL_LOBE
│   ├── OCCIPITAL_LOBE
│   └── BRAINSTEM
├── EYES
│   ├── LEFT_EYE
│   └── RIGHT_EYE
├── EARS
│   ├── LEFT_EAR (cochlear_patch_slot)
│   └── RIGHT_EAR
├── NOSE
├── MOUTH
│   ├── TONGUE
│   └── VOCAL_CORDS
├── JAW
└── SKULL

TORSO
├── SPINE
│   ├── CERVICAL_SPINE
│   ├── THORACIC_SPINE
│   └── LUMBAR_SPINE
├── CHEST
│   ├── HEART
│   ├── LUNGS
│   └── RIBCAGE
├── ABDOMEN
│   ├── LIVER
│   ├── KIDNEYS
│   ├── STOMACH
│   └── INTESTINES
└── SKIN_TORSO

ARMS (symmetric)
├── SHOULDER
├── UPPER_ARM
├── ELBOW
├── FOREARM
├── WRIST
└── HAND

LEGS (symmetric)
├── HIP
├── THIGH
├── KNEE
├── SHIN
├── ANKLE
└── FOOT

SYSTEMS
├── NERVOUS_SYSTEM
│   ├── CENTRAL_NERVOUS
│   └── PERIPHERAL_NERVOUS
├── CIRCULATORY_SYSTEM
│   ├── ARTERIES
│   ├── VEINS
│   └── BLOOD
├── ENDOCRINE_SYSTEM
│   ├── ADRENAL_GLANDS
│   ├── THYROID
│   └── PITUITARY
└── SKELETAL_SYSTEM
```

## 4.2 Augment Definitions

```sql
TABLE: augment_definitions
├── id: UUID [PK]
├── code: VARCHAR(50) [UNIQUE]
├── name: VARCHAR(100)
├── manufacturer: VARCHAR(100)
├── model: VARCHAR(50)
├── description: TEXT
├── lore_description: TEXT
├── flavor_text: TEXT
│
├── ## CLASSIFICATION
├── category: ENUM(augment_category)
├── subcategory: VARCHAR(50)
├── rarity: ENUM(rarity)
├── quality_tier: INT [1-5]
├── is_prototype: BOOLEAN
├── is_black_market: BOOLEAN
├── is_corrupted: BOOLEAN
│
├── ## REQUIREMENTS
├── required_tier: INT
├── required_track: FK -> tracks
├── required_specialization: FK -> specializations
├── required_augments: JSONB
├── incompatible_augments: JSONB
├── required_attributes: JSONB
│
├── ## INSTALLATION
├── body_location_id: FK -> body_locations
├── slots_consumed: INT
├── surgery_required: BOOLEAN
├── surgery_difficulty: INT [1-10]
├── installation_time_hours: DECIMAL(4,1)
├── recovery_time_days: INT
├── rejection_chance_base: DECIMAL(5,4)
│
├── ## COSTS
├── base_price_creds: INT
├── installation_cost_creds: INT
├── maintenance_cost_monthly: INT
├── power_consumption: INT
├── humanity_cost: INT
│
├── ## EFFECTS
├── attribute_modifiers: JSONB
├── stat_modifiers: JSONB
├── grants_abilities: JSONB
├── grants_passives: JSONB
├── special_effects: JSONB
│
├── ## DRAWBACKS
├── side_effects: JSONB
├── maintenance_requirements: JSONB
├── malfunction_chance: DECIMAL(5,4)
├── detection_signature: INT [0-100]
│
├── ## UPGRADE PATH
├── upgrade_from: FK -> augment_definitions
├── upgrade_to: JSONB
└── upgrade_cost_multiplier: DECIMAL(3,2)
```

## 4.3 SEED: Tier 3 Baseline Augments by Track

### VECTOR (Speed/Mobility)

|Name                      |Location          |Effects                          |Humanity|
|--------------------------|------------------|---------------------------------|--------|
|Twitch-Wire Nervous System|Peripheral Nervous|+40% reflex, caffeine dependency |8       |
|Proprioceptive Mesh       |Spine             |Feel vehicle as body extension   |5       |
|Predictive Iris           |Eyes              |AR overlay, 3-sec traffic preview|6       |

### SENTINEL (Defense/Protection)

|Name            |Location  |Effects                                    |Humanity|
|----------------|----------|-------------------------------------------|--------|
|Dermal Lattice  |Skin Torso|Subdermal carbon weave, stops small caliber|10      |
|Adrenal Governor|Endocrine |Controlled fight/flight, pain suppression  |7       |
|Cargo Bond      |Wrist     |Biometric lock to package                  |4       |

### NETWEAVER (Information/Hacking)

|Name                |Location |Effects                        |Humanity|
|--------------------|---------|-------------------------------|--------|
|Cortical Stack      |Brainstem|Secondary processing core      |12      |
|Broadcast Skin      |Skin     |Epidermis antenna array        |6       |
|Ghost Protocol Suite|Brain    |Basic ID spoofing, camera loops|8       |

### INTERFACE (Social/Negotiation)

|Name           |Location    |Effects                        |Humanity|
|---------------|------------|-------------------------------|--------|
|Empathy Engine |Frontal Lobe|Real-time biometric reading    |10      |
|Voice Synth    |Vocal Cords |Subtle vocal modulation        |5       |
|Pheromone Suite|Skin        |Controllable chemical signaling|8       |

### MACHINIST (Drone/Vehicle/Hardware)

|Name               |Location|Effects                         |Humanity|
|-------------------|--------|--------------------------------|--------|
|Hive-Mind Interface|Brain   |Neural link to 4 drones/vehicles|10      |
|Diagnostic Touch   |Hands   |Machine status via contact      |4       |
|Parts Library      |Memory  |Internal component database     |6       |

### UNIVERSAL (Tier 3 Mandatory)

|Name          |Location|Effects                         |Humanity|
|--------------|--------|--------------------------------|--------|
|Cochlear Patch|Left Ear|Omnideliver uplink, ETA whispers|3       |

## 4.4 Character Augments (Installed)

```sql
TABLE: character_augments
├── id: UUID [PK]
├── character_id: FK -> characters
├── augment_definition_id: FK -> augment_definitions
├── installed_at: TIMESTAMP
│
├── ## INSTALLATION
├── body_location_id: FK -> body_locations
├── installed_by_npc_id: FK -> npcs
├── installation_quality: INT [1-100]
├── is_corporate_installed: BOOLEAN
├── has_corporate_backdoor: BOOLEAN
│
├── ## STATE
├── is_active: BOOLEAN
├── is_damaged: BOOLEAN
├── damage_level: INT [0-100]
├── is_malfunctioning: BOOLEAN
├── malfunction_type: VARCHAR(50)
├── charge_level: INT [0-100]
│
├── ## INTEGRATION
├── integration_level: INT [0-100]
├── rejection_risk_current: DECIMAL(5,4)
├── last_maintenance: TIMESTAMP
├── maintenance_overdue: BOOLEAN
│
├── ## CUSTOMIZATION
├── custom_name: VARCHAR(100)
├── cosmetic_modifications: JSONB
├── software_version: VARCHAR(20)
├── firmware_modified: BOOLEAN
│
├── ## TRACKING
├── times_activated: INT
├── total_active_hours: DECIMAL(10,2)
├── critical_activations: INT
├── malfunction_count: INT
│
├── ## CORPORATE
├── corporate_tracked: BOOLEAN
├── warranty_expires: DATE
├── debt_attached_id: FK -> debts
└── can_be_repossessed: BOOLEAN
```

## 4.5 Augment Manufacturers

```sql
TABLE: augment_manufacturers
├── id: UUID [PK]
├── code: VARCHAR(20) [UNIQUE]
├── name: VARCHAR(100)
├── tagline: VARCHAR(200)
├── description: TEXT
├── headquarters_location_id: FK -> locations
│
├── ## REPUTATION
├── quality_rating: INT [1-100]
├── reliability_rating: INT [1-100]
├── innovation_rating: INT [1-100]
├── ethics_rating: INT [1-100]
├── price_tier: INT [1-5]
│
├── ## SPECIALIZATION
├── primary_category: ENUM(augment_category)
├── secondary_categories: JSONB
├── signature_tech: VARCHAR(100)
│
├── ## BUSINESS
├── is_corporate_approved: BOOLEAN
├── black_market_presence: INT [0-100]
├── faction_alignment_id: FK -> factions
│
├── ## BONUSES
├── brand_bonus_effect: JSONB
└── warranty_terms: TEXT
```

### SEED: Augment Manufacturers

|Code     |Name                  |Specialty         |Quality|Ethics|Price|
|---------|----------------------|------------------|-------|------|-----|
|KIROSHI  |Kiroshi Optics        |Eyes/Optics       |90     |70    |4    |
|DYNALAR  |Dynalar Technologies  |Limbs/Skeletal    |85     |60    |4    |
|BIOSIG   |BioTech Sigma         |Neural/Brain      |95     |50    |5    |
|MILITECH |Militech Cybernetics  |Combat            |85     |30    |4    |
|ZETATECH |Zetatech Industries   |Budget/Mass Market|50     |40    |1    |
|RAVEN    |Raven Microcybernetics|Stealth/Covert    |80     |45    |4    |
|TRAUMA   |Trauma Team Medical   |Medical/Survival  |95     |80    |5    |
|NIGHTCORP|Night Corp R&D        |Experimental      |70     |20    |5    |
|GHOST    |Ghost Circuit         |Black Market      |60     |10    |2    |
|COLLECT  |Collective Flesh      |Corrupted         |40     |5     |3    |

## 4.6 Augment Sets (Synergy Bonuses)

```sql
TABLE: augment_sets
├── id: UUID [PK]
├── code: VARCHAR(30) [UNIQUE]
├── name: VARCHAR(100)
├── description: TEXT
├── manufacturer: VARCHAR(100)
│
├── ## COMPOSITION
├── required_augments: JSONB
├── optional_augments: JSONB
├── min_augments_for_bonus: INT
│
├── ## BONUSES
├── partial_bonus_effects: JSONB
├── full_set_bonus_effects: JSONB
├── grants_ability_id: FK -> abilities
├── grants_passive_id: FK -> passives
│
├── ## REQUIREMENTS
├── required_tier: INT
├── required_track: FK -> tracks
└── required_specialization: FK -> specializations
```

## 4.7 Cyberpsychosis/Humanity System

```sql
TABLE: humanity_thresholds
├── id: UUID [PK]
├── threshold_value: INT [UNIQUE]
├── threshold_name: VARCHAR(50)
├── description: TEXT
│
├── ## EFFECTS
├── condition_id: FK -> conditions
├── behavioral_changes: TEXT
├── dialogue_changes: JSONB
├── ability_unlocks: JSONB
├── ability_locks: JSONB
│
├── ## RECOVERY
├── can_recover: BOOLEAN
├── recovery_methods: JSONB
└── permanent_effects: JSONB
```

### SEED: Humanity Thresholds

|Threshold|Name          |Effects                              |
|---------|--------------|-------------------------------------|
|80-100   |Baseline Human|Normal function                      |
|60-79    |Chrome-Touched|Mild dissociation, dreams glitch     |
|40-59    |Wired         |Emotional blunting, aggression spikes|
|20-39    |Ghost in Shell|Identity confusion, paranoia         |
|1-19     |Edge Case     |Violent episodes, reality breaks     |
|0        |Cyberpsycho   |Full break, NPC hostile takeover     |

```sql
TABLE: humanity_events
├── id: UUID [PK]
├── character_id: FK -> characters
├── occurred_at: TIMESTAMP
│
├── ## CHANGE
├── humanity_before: INT
├── humanity_after: INT
├── change_amount: INT
├── change_source: ENUM(humanity_change_source)
├── source_id: UUID
│
├── ## THRESHOLD
├── crossed_threshold: INT
├── triggered_condition_id: FK -> conditions
├── episode_severity: INT [1-5]
│
├── ## RECOVERY
├── therapy_applied: BOOLEAN
├── anchor_used: BOOLEAN
└── narrative_event_id: FK -> narrative_events
```

## 4.8 Black Market Augment Tiers

### Tier 3+ COMBAT CHEMS (Temporary)

|Name             |Effect                        |Risk             |Cost    |
|-----------------|------------------------------|-----------------|--------|
|Surge            |+2 sec perceived time dilation|Addictive        |Moderate|
|Ironblood        |Pain immunity + clotting      |Organ stress     |Moderate|
|Liquid Confidence|Social inhibition removal     |Personality drift|Low     |
|Ghost Sweat      |Pheromone masking             |Skin irritation  |Low     |

### Tier 4+ UNLICENSED CYBERWARE (Permanent)

|Name             |Effect                        |Risk                |Cost     |
|-----------------|------------------------------|--------------------|---------|
|Reflex Overclock |+60% reaction (vs corp +40%)  |Seizure risk        |High     |
|Bootleg Dermal   |Untracked armor               |Rejection chance    |High     |
|Pirate Cortex    |Extra processing, no backdoors|Psychosis risk      |Very High|
|Unregistered Eyes|Vision augments off-network   |Firmware instability|High     |

### Tier 6+ EXPERIMENTAL TECH (Prototype)

|Name               |Effect                        |Risk                        |Cost   |
|-------------------|------------------------------|----------------------------|-------|
|Quantum Positioning|Location becomes probabilistic|Reality dissociation        |Extreme|
|Meat Backup        |Distributed consciousness     |Identity fragmentation      |Extreme|
|Feral Protocol     |Emergency survival instincts  |Lost time, personality bleed|High   |
|Stolen Nerve       |Graft someone’s muscle memory |Requires donor              |High   |

### ROGUE ONLY: CORRUPTED TECH (Network-Hostile)

|Name               |Effect                             |Risk                     |Cost        |
|-------------------|-----------------------------------|-------------------------|------------|
|Null Field         |Create network dead zones          |Paints a target          |Catastrophic|
|Splinter Self      |Fragment consciousness (unhackable)|Permanent identity damage|Catastrophic|
|Viral Payload      |Neural patterns become infectious  |You’re a weapon now      |Extreme     |
|Ascension Rejection|Force de-merge uploaded minds      |Kills distributed self   |Ultimate    |

## 4.9 Black Market Payment Types

```sql
TABLE: black_market_payment_types
├── id: UUID [PK]
├── code: VARCHAR(20) [UNIQUE]
├── name: VARCHAR(50)
├── description: TEXT
│
├── ## MECHANICS
├── is_currency: BOOLEAN
├── is_service: BOOLEAN
├── is_permanent_loss: BOOLEAN
├── humanity_impact: INT
│
├── ## CONVERSION
├── cred_equivalent_base: INT
├── conversion_variable: BOOLEAN
└── market_demand_modifier: DECIMAL(3,2)
```

### SEED: Payment Types

|Code    |Name    |Description               |Humanity Impact|
|--------|--------|--------------------------|---------------|
|CREDS   |Credits |Standard cryptocurrency   |0              |
|DATA    |Data    |Valuable information      |0              |
|FAVOR   |Favors  |Jobs for the Circuit      |0              |
|FLESH   |Flesh   |Biological samples, organs|-5             |
|YEARS   |Years   |Contract time underground |-2             |
|MEMORY  |Memory  |Extracted experiences     |-10            |
|IDENTITY|Identity|Burn your legal self      |-15            |
