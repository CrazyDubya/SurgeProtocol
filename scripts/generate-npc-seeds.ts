/**
 * Generate NPC seed data from markdown files
 * 
 * Parses all character markdown files in surge-narrative/01_CHARACTERS
 * and outputs seed_data/npcs.json for database seeding.
 * 
 * Run with: npx tsx scripts/generate-npc-seeds.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { NpcParser, type ParsedNPC } from '../src/utils/parsers/npc-parser';

const CHARACTERS_DIR = join(process.cwd(), 'surge-narrative/01_CHARACTERS');
const OUTPUT_FILE = join(process.cwd(), 'seed_data/npcs.json');

function findMarkdownFiles(dir: string): string[] {
    const files: string[] = [];

    for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
            files.push(...findMarkdownFiles(fullPath));
        } else if (entry.endsWith('.md')) {
            files.push(fullPath);
        }
    }

    return files;
}

async function main() {
    console.log('🔍 Scanning for markdown files...');
    const mdFiles = findMarkdownFiles(CHARACTERS_DIR);
    console.log(`   Found ${mdFiles.length} markdown files`);

    const parser = new NpcParser();
    const allNpcs: ParsedNPC[] = [];
    let parseErrors = 0;

    for (const file of mdFiles) {
        const relativePath = file.replace(process.cwd() + '/', '');
        try {
            const content = readFileSync(file, 'utf-8');
            const npcs = parser.parse(content);

            if (npcs.length > 0) {
                console.log(`   ✅ ${relativePath}: ${npcs.length} NPCs`);
                allNpcs.push(...npcs);
            } else {
                console.log(`   ⚪ ${relativePath}: No NPCs found (may be metadata file)`);
            }
        } catch (e) {
            console.error(`   ❌ ${relativePath}: ${e}`);
            parseErrors++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total NPCs parsed: ${allNpcs.length}`);
    console.log(`   Parse errors: ${parseErrors}`);

    // Write output
    console.log(`\n💾 Writing to ${OUTPUT_FILE}...`);
    writeFileSync(OUTPUT_FILE, JSON.stringify({ npcs: allNpcs }, null, 2));
    console.log('   Done!');

    // Print sample
    if (allNpcs.length > 0) {
        console.log('\n📝 Sample NPC:');
        console.log(JSON.stringify(allNpcs[0], null, 2));
    }
}

main().catch(console.error);
