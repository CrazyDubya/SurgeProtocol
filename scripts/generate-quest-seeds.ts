/**
 * Generate Quest seed data from markdown files
 * 
 * Parses all quest markdown files in surge-narrative/03_QUESTS
 * and outputs seed_data/quests.json for database seeding.
 * 
 * Run with: npx tsx scripts/generate-quest-seeds.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { QuestParser, type ParsedQuest } from '../src/utils/parsers/quest-parser';

const QUESTS_DIR = join(process.cwd(), 'surge-narrative/03_QUESTS');
const OUTPUT_FILE = join(process.cwd(), 'seed_data/quests.json');

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
    console.log('🔍 Scanning for quest markdown files...');
    const mdFiles = findMarkdownFiles(QUESTS_DIR);
    console.log(`   Found ${mdFiles.length} markdown files`);

    const parser = new QuestParser();
    const allQuests: ParsedQuest[] = [];
    let parseErrors = 0;

    for (const file of mdFiles) {
        const relativePath = file.replace(process.cwd() + '/', '');
        try {
            const content = readFileSync(file, 'utf-8');
            const quests = parser.parse(content);

            if (quests.length > 0) {
                console.log(`   ✅ ${relativePath}: ${quests.length} quest(s)`);
                allQuests.push(...quests);
            } else {
                console.log(`   ⚪ ${relativePath}: No quests found`);
            }
        } catch (e) {
            console.error(`   ❌ ${relativePath}: ${e}`);
            parseErrors++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total quests parsed: ${allQuests.length}`);
    console.log(`   Parse errors: ${parseErrors}`);

    // Write output
    console.log(`\n💾 Writing to ${OUTPUT_FILE}...`);
    writeFileSync(OUTPUT_FILE, JSON.stringify({ quests: allQuests }, null, 2));
    console.log('   Done!');

    // Print sample
    if (allQuests.length > 0) {
        console.log('\n📝 Sample Quest:');
        console.log(JSON.stringify(allQuests[0], null, 2));
    }
}

main().catch(console.error);
