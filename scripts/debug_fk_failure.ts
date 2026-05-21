
import { execSync } from 'child_process';

const CHARACTER_ID = 'adfe5a95-abb4-48b5-acdd-9923a5583c3a'; // From logs
const CONTACT_ID = '5db9de5a-35d0-4d78-82a9-aae70f3e3013';   // From logs

async function main() {
    console.log('Checking IDs in DB...');

    // Check Character
    try {
        const charRes = execSync(`npx wrangler d1 execute surge-protocol-db --local --command="SELECT * FROM characters WHERE id='${CHARACTER_ID}'" --json`, { encoding: 'utf-8' });
        const charData = JSON.parse(charRes)[0].results;
        console.log(`Character found: ${charData.length > 0}`);
        if (charData.length === 0) console.log('❌ Character ID NOT found!');
        else console.log('✅ Character ID exists.');
    } catch (e) { console.error('Error checking character:', e); }

    // Check Contact
    try {
        const contactRes = execSync(`npx wrangler d1 execute surge-protocol-db --local --command="SELECT * FROM black_market_contacts WHERE id='${CONTACT_ID}'" --json`, { encoding: 'utf-8' });
        const contactData = JSON.parse(contactRes)[0].results;
        console.log(`Contact found: ${contactData.length > 0}`);
        if (contactData.length === 0) console.log('❌ Contact ID NOT found!');
        else console.log('✅ Contact ID exists.');
    } catch (e) { console.error('Error checking contact:', e); }

    // Check Table Schema
    try {
        console.log('Checking Schema:');
        const schemaRes = execSync(`npx wrangler d1 execute surge-protocol-db --local --command="PRAGMA table_info(character_contacts)" --json`, { encoding: 'utf-8' });
        console.log(JSON.parse(schemaRes)[0].results);
    } catch (e) { }
}

main();
