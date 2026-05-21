export interface ParsedNPC {
    id: string; // derived from name
    name: string;
    role: string | null;
    location: string | null;
    age: number | null;
    appearance: string | null;
    background: string | null;
    personality: {
        traits: string[];
        description: string | null;
    };
    speechPattern: string | null;
    keyDialogue: Array<{
        context: string;
        text: string;
    }>;
    storyFlags: {
        sets: string[];
        checks: string[];
    };
    voiceDirection: {
        tone: string | null;
        accent: string | null;
        pace: string | null;
    };
}

export class NpcParser {
    parse(markdown: string): ParsedNPC[] {
        const npcs: ParsedNPC[] = [];

        // Split by "## NPC" headers, but keep the first split if it contains one
        const sections = markdown.split(/^## NPC \d+: /m).slice(1); // Remove prologue

        for (const section of sections) {
            const npc = this.parseSection(section);
            if (npc) {
                npcs.push(npc);
            }
        }

        return npcs;
    }

    private parseSection(section: string): ParsedNPC | null {
        // Name is the first line
        const nameMatch = section.match(/^([^\n]+)/);
        if (!nameMatch) return null;

        const rawName = nameMatch[1]!.trim();
        // Clean name (remove "THE EXILE", etc if needed, but usually keep full)
        const name = rawName.replace(/\s*\("[^"]+"\)/, ''); // Remove ("Nickname") for ID generation if needed

        const id = 'npc-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        // Extract Basic Info
        const role = this.extractField(section, 'Role');
        const location = this.extractField(section, 'Location');
        const ageStr = this.extractField(section, 'Age');
        const age = ageStr ? parseInt(ageStr) : null;
        const appearance = this.extractField(section, 'Appearance');

        // Extract Blocks
        const background = this.extractBlock(section, '### Background');
        const speechPattern = this.extractBlock(section, '### Speech Pattern');

        // Personality
        const personalityBlock = this.extractBlock(section, '### Personality');
        const personalityTraits: string[] = [];
        let personalityDesc = null;
        if (personalityBlock) {
            const lines = personalityBlock.split('\n');
            for (const line of lines) {
                if (line.trim().startsWith('- **')) {
                    // "- **Trait**: Description"
                    const match = line.match(/\- \*\*([^:]+)\*\*: (.*)/);
                    if (match) {
                        personalityTraits.push(`${match[1]}: ${match[2]}`);
                    } else {
                        personalityTraits.push(line.replace(/^- /, '').trim());
                    }
                }
            }
            personalityDesc = personalityBlock;
        }

        // Key Dialogue
        const dialogueBlock = this.extractBlock(section, '### Key Dialogue');
        const keyDialogue: { context: string; text: string }[] = [];
        if (dialogueBlock) {
            // Very simpler dialogue extractor: Look for **Context**: "Line"
            const dialogueRegex = /\*\*([^*]+)\*\*:\s*\n"([^"]+)"/g;
            let match;
            while ((match = dialogueRegex.exec(dialogueBlock)) !== null) {
                keyDialogue.push({
                    context: match[1]!.trim(),
                    text: match[2]!.trim()
                });
            }
        }

        // Story Flags
        const flagsBlock = this.extractBlock(section, '### Story Flags');
        const sets: string[] = [];
        const checks: string[] = [];
        if (flagsBlock) {
            // Simple logic: look for lists under **Sets**: and **Checks**:
            // This is brittle but sufficient for seed data extraction
            const setsMatch = flagsBlock.match(/\*\*Sets\*\*:\s*([\s\S]*?)(?=\*\*Checks\*\*|$)/);
            if (setsMatch) {
                const lines = setsMatch[1]!.split('\n').map(l => l.trim()).filter(l => l.startsWith('- `'));
                sets.push(...lines.map(l => l.replace(/^- `|`.*$/g, '')));
            }
            const checksMatch = flagsBlock.match(/\*\*Checks\*\*:\s*([\s\S]*?)(?=\###|$)/);
            if (checksMatch) {
                const lines = checksMatch[1]!.split('\n').map(l => l.trim()).filter(l => l.startsWith('- `'));
                checks.push(...lines.map(l => l.replace(/^- `|`.*$/g, '')));
            }
        }

        // Voice Direction
        const voiceBlock = this.extractBlock(section, '### Voice Direction');
        const tone = this.extractFieldFromBlock(voiceBlock, 'Tone');
        const accent = this.extractFieldFromBlock(voiceBlock, 'Accent');
        const pace = this.extractFieldFromBlock(voiceBlock, 'Pace');

        return {
            id,
            name: rawName,
            role,
            location,
            age,
            appearance,
            background,
            personality: {
                traits: personalityTraits,
                description: personalityDesc
            },
            speechPattern,
            keyDialogue,
            storyFlags: { sets, checks },
            voiceDirection: { tone, accent, pace }
        };
    }

    private extractField(text: string, fieldName: string): string | null {
        const regex = new RegExp(`\\*\\*${fieldName}\\*\\*: (.*)`);
        const match = text.match(regex);
        return match ? match[1]!.trim() : null;
    }

    private extractFieldFromBlock(text: string | null, fieldName: string): string | null {
        if (!text) return null;
        const regex = new RegExp(`\\*\\*${fieldName}\\*\\*: (.*)`);
        const match = text.match(regex);
        return match ? match[1]!.trim() : null;
    }

    private extractBlock(text: string, header: string): string | null {
        const index = text.indexOf(header);
        if (index === -1) return null;

        const contentStart = index + header.length;
        // Find next header (### or ##)
        const nextHeaderIndex = text.slice(contentStart).search(/\n#{2,3} /);

        if (nextHeaderIndex === -1) {
            return text.slice(contentStart).trim();
        }

        return text.slice(contentStart, contentStart + nextHeaderIndex).trim();
    }
}
