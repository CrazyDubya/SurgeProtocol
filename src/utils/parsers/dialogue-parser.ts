
export interface ParsedDialogueChoice {
    text: string;
    nextNodeId: string | null;
}

export interface ParsedDialogueNode {
    id: string;
    speaker?: string;
    text?: string;
    choices?: ParsedDialogueChoice[];
    effects?: string[];
    conditions?: string[];
}

export class DialogueParser {
    parse(content: string, fileName: string): ParsedDialogueNode[] {
        const nodes: ParsedDialogueNode[] = [];
        const lines = content.split('\n');
        let currentNode: Partial<ParsedDialogueNode> | null = null;
        let currentChoices: ParsedDialogueChoice[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('**NODE:')) {
                if (currentNode) {
                    currentNode.choices = currentChoices;
                    nodes.push(currentNode as ParsedDialogueNode);
                }
                const id = line.replace('**NODE:', '').replace('**', '').trim();
                currentNode = {
                    id,
                    text: '',
                    choices: [],
                    effects: [],
                    conditions: []
                };
                currentChoices = [];
                continue;
            }

            if (!currentNode) continue;

            // Parse Speaker/Text
            if (line.includes(': "')) {
                const [speaker, text] = line.split(': "');
                currentNode.speaker = speaker;
                currentNode.text = text.replace('"', '');
            }

            // Parse Choices
            if (line.match(/^\d+\./)) {
                // 1. "Choice text" [TAG] -> KEY
                const choiceTextMatch = line.match(/"([^"]+)"/);
                const nextNodeMatch = line.split('->')[1]?.trim();

                if (choiceTextMatch) {
                    currentChoices.push({
                        text: choiceTextMatch[1],
                        nextNodeId: nextNodeMatch || null
                    });
                }
            }
        }

        if (currentNode) {
            currentNode.choices = currentChoices;
            nodes.push(currentNode as ParsedDialogueNode);
        }

        return nodes;
    }
}
