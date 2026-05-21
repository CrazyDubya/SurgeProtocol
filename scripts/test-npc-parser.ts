import { readFileSync } from 'fs';
import { NpcParser } from '../src/utils/parsers/npc-parser';
import { join } from 'path';

const parser = new NpcParser();
const filePath = join(process.cwd(), 'surge-narrative/01_CHARACTERS/tier_1-3_npcs/tier_3_contacts.md');

console.log(`Reading file: ${filePath}`);
const content = readFileSync(filePath, 'utf-8');

console.log('Parsing content...');
const npcs = parser.parse(content);

console.log(`Found ${npcs.length} NPCs`);

npcs.forEach(npc => {
    console.log('---------------------------------------------------');
    console.log(`ID: ${npc.id}`);
    console.log(`Name: ${npc.name}`);
    console.log(`Role: ${npc.role}`);
    console.log(`Traits: ${npc.personality.traits.length}`);
    console.log(`Dialogue Lines: ${npc.keyDialogue.length}`);
    console.log(`Flags Sets: ${npc.storyFlags.sets.length}`);
    console.log(`Flags Checks: ${npc.storyFlags.checks.length}`);
});

if (npcs.length !== 6) {
    console.error(`Expected 6 NPCs, found ${npcs.length}`);
    process.exit(1);
}

// Verify specific data points
const drSato = npcs.find(n => n.name.includes('Sato'));
if (!drSato) {
    console.error('Dr. Sato not found');
    process.exit(1);
}

if (drSato.role !== 'Chrome Clinic Technician') {
    console.error(`Dr. Sato role mismatch: ${drSato.role}`);
    process.exit(1);
}
console.log('Verification passed!');
