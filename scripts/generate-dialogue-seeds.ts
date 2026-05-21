
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { DialogueParser, ParsedDialogueNode } from '../src/utils/parsers/dialogue-parser';

const DIALOGUE_DIR = join(process.cwd(), 'surge-narrative/02_DIALOGUE_TREES');
const OUTPUT_FILE = join(process.cwd(), 'seed_data/dialogue_trees.json');

function findMarkdownFiles(dir: string): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        if (statSync(fullPath).isDirectory()) {
            files.push(...findMarkdownFiles(fullPath));
        } else if (entry.endsWith('.md')) {
            files.push(fullPath);
        }
    }
    return files;
}

interface OutputDialogueTree {
    id: string;
    code: string;
    rootNodeId: string;
    nodes: ParsedDialogueNode[];
    metadata: { source: string };
}

async function main() {
    console.log('🔍 Scanning for dialogue markdown files...');
    const mdFiles = findMarkdownFiles(DIALOGUE_DIR);
    console.log(`   Found ${mdFiles.length} markdown files`);

    const parser = new DialogueParser();
    const trees: OutputDialogueTree[] = [];
    let totalNodes = 0;

    for (const file of mdFiles) {
        const relativePath = file.replace(DIALOGUE_DIR + '/', '');
        // Use filename as tree ID (e.g., "greetings/chen_first_meeting")
        const treeId = relativePath.replace('.md', '').replace(/\//g, '_').toUpperCase();

        try {
            const content = readFileSync(file, 'utf-8');
            const nodes = parser.parse(content, relativePath);

            if (nodes.length > 0) {
                const rootNodeId = nodes[0].id;

                trees.push({
                    id: crypto.randomUUID(), // Use a real UUID for the tree record
                    code: treeId,
                    rootNodeId: rootNodeId,
                    nodes: nodes,
                    metadata: { source: relativePath }
                });
                totalNodes += nodes.length;
                console.log(`   ✅ ${relativePath}: ${nodes.length} nodes`);
            } else {
                console.log(`   ⚪ ${relativePath}: No nodes found`);
            }
        } catch (e) {
            console.error(`   ❌ ${relativePath}: ${e}`);
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total trees generated: ${trees.length}`);
    console.log(`   Total nodes parsed: ${totalNodes}`);

    writeFileSync(OUTPUT_FILE, JSON.stringify({ trees }, null, 2));
    console.log(`\n💾 Writing to ${OUTPUT_FILE}...`);
}

main().catch(console.error);
