# Localization Reference Guide

## Purpose
This document provides all necessary context for translating Surge Protocol's narrative content into other languages.

---

## SECTION 1: TERMINOLOGY GLOSSARY

### Core Game Terms

| English Term | Definition | Localization Notes |
|--------------|------------|-------------------|
| Algorithm, The | City-spanning AI | Capitalize; treat as proper noun |
| Ascension | Consciousness upload ending | Religious connotation intentional |
| Chrome | Cybernetic augmentations | Slang; may need cultural equivalent |
| Cochlear implant | Hearing augment enabling Algorithm | Technical term |
| Cortical stack | Brain backup device | Technical term |
| Courier | Package delivery professional | Standard translation |
| Fork | Process of consciousness backup | Technical term |
| Hollows, The | Poor district | Descriptive name |
| Humanity score | Human vs chrome balance | Gameplay mechanic |
| Integration | Joining Algorithm's network | Corporate euphemism |
| Interstitial, The | Hidden balance community | Abstract noun as place |
| Nakamura | Primary corporation | Japanese name, keep as-is |
| Prime | Original consciousness | Technical term |
| Rogue | Independence ending | Connotation: rebellious |
| Shadow | Backup consciousness | Not literal shadow |
| Third Path | Balance ending | Number + Path |
| Tier | Courier ranking (0-10) | Standard translation |
| Upload | Consciousness transfer | Technical term |

### Slang & Invented Terms

| Term | Meaning | Notes |
|------|---------|-------|
| Chrome-heavy | Heavily augmented | Descriptive slang |
| Flesh-heavy | Minimally augmented | Descriptive slang |
| Meat | Organic human (sometimes derogatory) | Context-dependent |
| Zeroed | Died/killed | Slang, violent |
| Flatlined | Died | Medical slang |
| Jacked in | Connected to network | Tech slang |
| Off-grid | Outside Algorithm surveillance | Standard phrase |
| Ghost | Hidden from Algorithm | Metaphorical |
| The Eighth | Balanced being (Third Path) | Numerical/mystical |

### Faction Names

| Faction | Keep/Translate | Notes |
|---------|----------------|-------|
| Nakamura Corporation | Keep | Japanese name |
| Chrome Saints | Translate | Religious gang |
| Ghost Network | Translate | Underground faction |
| Dockworkers United | Translate | Union name |
| Courier Coalition | Translate | Worker organization |
| Razor Collective | Translate | Gang name |

### Character Names

| Name | Keep/Translate | Notes |
|------|----------------|-------|
| Chen Wei | Keep | Chinese name |
| Rosa Delgado | Keep | Spanish name |
| Jin Park | Keep | Korean name |
| Kenji Yamada | Keep | Japanese name |
| Maria Lopez | Keep | Spanish name |
| Solomon Okonkwo | Keep | Nigerian name |
| Yuki Tanaka | Keep | Japanese name |
| Kwame Okonkwo | Keep | Ghanaian name |

---

## SECTION 2: CULTURAL CONTEXT NOTES

### World Setting

**Genre**: Cyberpunk noir
- Dark future themes
- Technology as both liberation and oppression
- Class struggle central
- Body modification normalized

**Tone**:
- Grounded, not satirical
- Serious themes treated seriously
- Occasional dark humor
- Hope possible but not guaranteed

### Cultural References

**American Context**:
- Union organizing (labor movement history)
- Corporate dystopia (tech company critique)
- Working-class struggle

**East Asian Context**:
- Japanese corporate culture (Nakamura)
- Korean-American identity (Jin)
- Chinese-American immigrant experience (Chen)

**Latin American Context**:
- Mexican-American working class (Lopez)
- Family loyalty themes (Rosa, Miguel)

**African Context**:
- Nigerian/Ghanaian philosophy (Okonkwo, Solomon)
- Balance concepts (Third Path)

### Religious/Philosophical Content

**Algorithm Worship**:
- Treated as both genuine faith and critique
- Chrome Saints: tech-religion hybrid
- Not mocking real religions

**Third Path Philosophy**:
- Balance between extremes
- Draws on various traditions
- Presented respectfully

**Critique of Technology**:
- Nuanced, not Luddite
- Technology is tool, not inherently evil
- Human choices matter

---

## SECTION 3: SENSITIVE CONTENT FLAGS

### Violence

| Content | Context | Advisory Level |
|---------|---------|----------------|
| Combat descriptions | Gameplay integral | Standard action |
| Death references | Story consequences | Moderate |
| Torture mention | Villain actions | Brief, not graphic |
| Suicide reference | Chen backstory | Handled sensitively |

### Body Modification

| Content | Context | Advisory Level |
|---------|---------|----------------|
| Voluntary augmentation | Core mechanic | Normalized in setting |
| Forced modification | Villain actions | Treated as violation |
| Chrome addiction | Side content | Addiction themes |
| Body horror | Low humanity | Existential, not graphic |

### Mental Health

| Content | Context | Advisory Level |
|---------|---------|----------------|
| Identity crisis | Fork storyline | Central theme |
| Depression themes | Various characters | Treated seriously |
| Grief | Chen, Rosa | Handled with care |
| AI relationship | Algorithm | Complex, not romanticized |

### Political Content

| Theme | Treatment | Notes |
|-------|-----------|-------|
| Labor organizing | Sympathetic | Lopez arc |
| Corporate critique | Central theme | Nakamura |
| Class struggle | Explicit | Throughout |
| Surveillance | Critical | Algorithm |

---

## SECTION 4: TEXT EXPANSION GUIDELINES

### Language Expansion Factors

| Language | Typical Expansion | Notes |
|----------|-------------------|-------|
| German | 120-130% | Compound words |
| French | 115-125% | Articles, formality |
| Spanish | 115-125% | Gender, formality |
| Italian | 110-120% | Similar to Spanish |
| Russian | 120-130% | Grammatical complexity |
| Japanese | 80-90% | Contracts |
| Chinese | 70-80% | Contracts significantly |
| Korean | 90-100% | Similar length |

### UI Text Limits

| Element | Max Characters | Expansion Buffer |
|---------|----------------|------------------|
| Menu items | 20 | +30% |
| Button labels | 12 | +40% |
| Tooltips | 150 | +25% |
| Dialogue lines | 200 | +30% |
| Quest titles | 40 | +30% |
| Item names | 30 | +35% |

### Variable Placeholder Handling

**Format**: `{variable_name}`

**Examples**:
- "Welcome, {player_name}." → Translate text, keep variable
- "You have {credits} credits." → Note: number before noun in some languages
- "{npc_name} says:" → Note: may need reordering

### Plural Forms

**English**: Singular/Plural
**Note for localization**: Some languages need:
- Zero form
- Few form (2-4)
- Many form (5+)

**Example**:
```
English: "1 credit" / "5 credits"
Russian: "1 кредит" / "2 кредита" / "5 кредитов"
```

### Gender Handling

**Player Character**: Gender-neutral in English
**Note**: Languages with grammatical gender need:
- Gender selection system
- Or careful gender-neutral phrasing

**NPC References to Player**:
- Avoid gendered pronouns where possible
- Use "Courier" as gender-neutral title

---

## SECTION 5: UNTRANSLATABLE ELEMENTS

### Must Keep in English

| Element | Reason |
|---------|--------|
| "The Algorithm" | Proper noun, brand identity |
| "Nakamura" | Japanese company name |
| Character names | Cultural identity |
| "Tier" ratings | Gameplay mechanic terminology |

### Cultural Adaptation Needed

| Element | Why | Approach |
|---------|-----|----------|
| Labor history references | US-specific | Adapt to local labor history |
| Street slang | Culture-specific | Find equivalent slang |
| Humor | May not translate | Adapt joke structure |

---

## SECTION 6: LOCALIZATION TESTING

### Priority Strings

1. Main story dialogue
2. Quest descriptions
3. Character names and titles
4. UI elements
5. Bark/ambient text

### Common Issues to Check

- [ ] Variable placement correct
- [ ] Gender agreement consistent
- [ ] Plural forms implemented
- [ ] Text fits UI elements
- [ ] Cultural references appropriate
- [ ] Tone matches original
- [ ] Slang sounds natural

### Quality Assurance Process

1. Translation complete
2. In-context review
3. Playtesting in language
4. Cultural sensitivity check
5. Technical verification (variables, formatting)
6. Final polish

---

## SECTION 7: VOICE LOCALIZATION NOTES

### Character Voice Preservation

**Maintain**:
- Character personality
- Speaking pace
- Emotional range
- Relationship dynamics

**Adapt**:
- Accent where character has accent
- Cultural references
- Slang and idioms

### Lip Sync Considerations

- Match syllable count where possible
- Prioritize emotional timing over literal translation
- Consider dubbing vs subtitles for budget

### Per-Character Notes

| Character | Voice Priority | Special Notes |
|-----------|----------------|---------------|
| Algorithm | Synthetic quality | May need special processing |
| Shadow | Internal voice feel | Match player voice actor |
| Chen | Elder warmth | Cast age-appropriate |
| Rosa | Latina identity | Consider heritage in casting |
| Jin | Korean-American | Consider heritage in casting |

---

*Localization reference document*
*Created: Phase 5 Session 5*
*For use by localization teams*
