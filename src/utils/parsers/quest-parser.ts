export interface ParsedQuest {
    id: string;
    questId: string;
    type: string | null;
    tier: number | null;
    estimatedDuration: string | null;
    repeatable: boolean;
    prerequisites: {
        requiredQuests: string[];
        factionReputation: string | null;
        storyFlags: string[];
        tierMinimum: number | null;
        itemsRequired: string[];
    };
    questGiver: {
        npcName: string | null;
        location: string | null;
        dialogueTree: string | null;
    };
    synopsis: string | null;
    objectives: {
        primary: string[];
        secondary: string[];
        optional: string[];
        hidden: string[];
    };
    branchingPaths: Array<{
        name: string;
        outcome: string | null;
        humanityChange: number;
        relationships: string[];
        flags: string[];
    }>;
    rewards: {
        credits: number | null;
        xp: number | null;
        rating: string | null;
        unlocks: string[];
    };
    dialogueReferences: string[];
    relatedContent: string[];
}

export class QuestParser {
    parse(markdown: string): ParsedQuest[] {
        const quests: ParsedQuest[] = [];

        // Most quest files contain a single quest starting with # Title
        const quest = this.parseQuest(markdown);
        if (quest) {
            quests.push(quest);
        }

        return quests;
    }

    private parseQuest(content: string): ParsedQuest | null {
        // Extract title (# line)
        const titleMatch = content.match(/^# (.+)/m);
        if (!titleMatch) return null;

        const title = titleMatch[1]!.trim();

        // Extract metadata
        const questIdMatch = content.match(/\*\*Quest ID\*\*: (\S+)/);
        const typeMatch = content.match(/\*\*Type\*\*: ([^\n]+)/);
        const tierMatch = content.match(/\*\*Tier Availability\*\*: (\d+)/);
        const durationMatch = content.match(/\*\*Estimated Duration\*\*: ([^\n]+)/);
        const repeatableMatch = content.match(/\*\*Repeatable\*\*: (Yes|No)/i);

        const questId = questIdMatch?.[1] || title.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
        const id = 'quest-' + questId.toLowerCase().replace(/_/g, '-');

        // Prerequisites
        const prereqs = this.extractBlock(content, '## Prerequisites');
        const prerequisites = {
            requiredQuests: this.extractListItems(prereqs, 'Required Quests Completed'),
            factionReputation: this.extractField(prereqs, 'Faction Reputation'),
            storyFlags: this.extractListItems(prereqs, 'Story Flags'),
            tierMinimum: parseInt(this.extractField(prereqs, 'Tier Minimum') || '0') || null,
            itemsRequired: this.extractListItems(prereqs, 'Items Required'),
        };

        // Quest Giver
        const giverBlock = this.extractBlock(content, '## Quest Giver');
        const questGiver = {
            npcName: this.extractField(giverBlock, 'NPC Name'),
            location: this.extractField(giverBlock, 'Location'),
            dialogueTree: this.extractField(giverBlock, 'Initial Dialogue Tree'),
        };

        // Synopsis
        const synopsisBlock = this.extractBlock(content, '## Synopsis');
        const synopsis = synopsisBlock?.replace(/\*\*/g, '').trim() || null;

        // Objectives
        const objectivesBlock = this.extractBlock(content, '## Objectives');
        const objectives = {
            primary: this.extractNumberedList(objectivesBlock, 'Primary Objective'),
            secondary: this.extractNumberedList(objectivesBlock, 'Secondary Objectives'),
            optional: this.extractNumberedList(objectivesBlock, 'Optional Objectives'),
            hidden: this.extractNumberedList(objectivesBlock, 'Hidden Objectives'),
        };

        // Branching Paths
        const pathsBlock = this.extractBlock(content, '## Branching Paths');
        const branchingPaths = this.extractBranchingPaths(pathsBlock);

        // Rewards
        const rewardsBlock = this.extractBlock(content, '## Rewards');
        const rewards = {
            credits: parseInt(this.extractField(rewardsBlock, 'Credits') || '0') || null,
            xp: parseInt(this.extractField(rewardsBlock, 'XP') || '0') || null,
            rating: this.extractField(rewardsBlock, 'Rating'),
            unlocks: this.extractListItems(rewardsBlock, 'Unlocks'),
        };

        // Dialogue References
        const dialogueBlock = this.extractBlock(content, '## Dialogue References');
        const dialogueReferences = dialogueBlock?.match(/`[^`]+`/g)?.map(s => s.replace(/`/g, '')) || [];

        // Related Content
        const relatedBlock = this.extractBlock(content, '## Related Content');
        const relatedContent = relatedBlock?.split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^- /, '').trim()) || [];

        return {
            id,
            questId,
            type: typeMatch?.[1]?.trim() || null,
            tier: tierMatch ? parseInt(tierMatch[1]!) : null,
            estimatedDuration: durationMatch?.[1]?.trim() || null,
            repeatable: repeatableMatch?.[1]?.toLowerCase() === 'yes',
            prerequisites,
            questGiver,
            synopsis,
            objectives,
            branchingPaths,
            rewards,
            dialogueReferences,
            relatedContent,
        };
    }

    private extractBlock(text: string, header: string): string | null {
        const headerPattern = new RegExp(`${header}\\n`, 'i');
        const match = text.match(headerPattern);
        if (!match) return null;

        const startIdx = text.indexOf(header) + header.length;
        const restText = text.slice(startIdx);
        const nextHeader = restText.search(/\n## /);

        return nextHeader === -1 ? restText.trim() : restText.slice(0, nextHeader).trim();
    }

    private extractField(text: string | null, fieldName: string): string | null {
        if (!text) return null;
        const regex = new RegExp(`\\*\\*${fieldName}\\*\\*: ([^\\n]+)`);
        const match = text.match(regex);
        return match ? match[1]!.trim() : null;
    }

    private extractListItems(text: string | null, heading: string): string[] {
        if (!text) return [];
        const regex = new RegExp(`\\*\\*${heading}\\*\\*: ([^\\n]+)`);
        const match = text.match(regex);
        if (!match) return [];

        const value = match[1]!.trim();
        if (value.toLowerCase() === 'none') return [];
        return value.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    }

    private extractNumberedList(text: string | null, heading: string): string[] {
        if (!text) return [];
        const headingIdx = text.indexOf(heading);
        if (headingIdx === -1) return [];

        const afterHeading = text.slice(headingIdx);
        const nextHeadingIdx = afterHeading.slice(heading.length).search(/###/);
        const block = nextHeadingIdx === -1 ? afterHeading : afterHeading.slice(0, heading.length + nextHeadingIdx);

        const items = block.match(/\d+\. \*\*([^*]+)\*\*/g) || [];
        return items.map(item => item.replace(/^\d+\. \*\*|\*\*$/g, '').trim());
    }

    private extractBranchingPaths(text: string | null): ParsedQuest['branchingPaths'] {
        if (!text) return [];

        const paths: ParsedQuest['branchingPaths'] = [];
        const pathMatches = text.matchAll(/### Path [A-Z]: ([^\n]+)\n([\s\S]*?)(?=### Path|$)/gi);

        for (const match of pathMatches) {
            const name = match[1]!.trim();
            const block = match[2]!;

            const outcomeMatch = block!.match(/\*\*Outcome\*\*: ([^\n]+)/);
            const humanityMatch = block!.match(/\*\*Humanity\*\*: ([+-]?\d+)/);

            const relationships = block!.match(/\*\*\w+ Relationship\*\*: ([^\n]+)/g)?.map(r => r.replace(/\*\*/g, '')) || [];
            const flagMatch = block!.match(/\*\*Flag\*\*: (\w+)/);

            paths.push({
                name,
                outcome: outcomeMatch?.[1]?.trim() || null,
                humanityChange: humanityMatch ? parseInt(humanityMatch[1]!) : 0,
                relationships,
                flags: flagMatch ? [flagMatch[1]!] : [],
            });
        }

        return paths;
    }
}
