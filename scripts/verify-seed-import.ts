
import { seedAll } from '../src/db/seed';
import { D1Database } from '@cloudflare/workers-types';

// Mock D1 Database
class MockD1Database {
    stmt: any;

    constructor() {
        this.stmt = {
            bind: (...args: any[]) => this.stmt,
            first: async () => null, // Always return null to simulate empty DB -> forced inserts
            all: async () => ({ results: [] }),
            run: async () => ({ success: true }),
        };
    }

    prepare(query: string) {
        // console.log('Preparing:', query.substring(0, 50) + '...');
        return this.stmt;
    }

    batch(stmts: any[]) {
        return Promise.resolve(stmts.map(() => ({ success: true })));
    }

    dump() { return Promise.resolve(new ArrayBuffer(0)); }
    exec() { return Promise.resolve({ count: 0, duration: 0 }); }
}

async function main() {
    console.log('🧪 Verifying src/db/seed.ts imports and logic...');

    // Cast to any to bypass strict type checks for the mock 
    // (D1Database has many methods, we only need a few for the seeder)
    const mockDb = new MockD1Database() as unknown as D1Database;

    try {
        const results = await seedAll(mockDb);

        console.log('\n📊 Seeding Results:');
        let totalInserted = 0;
        let totalErrors = 0;

        for (const res of results) {
            console.log(`   Table: ${res.table.padEnd(25)} | Inserted: ${res.inserted.toString().padEnd(5)} | Errors: ${res.errors.length}`);
            totalInserted += res.inserted;
            totalErrors += res.errors.length;

            if (res.errors.length > 0) {
                console.log(`     ⚠️  First error: ${res.errors[0]}`);
            }
        }

        console.log('\n✅ Verification Complete');
        console.log(`   Total Inserted: ${totalInserted}`);
        console.log(`   Total Errors:   ${totalErrors}`);

        if (totalInserted > 0) {
            console.log('   🎉 Narrative content appears to be ingested correctly!');
        } else {
            console.log('   ⚠️  No content inserted. Check if JSONs are empty or logic is skipped.');
        }

    } catch (e) {
        console.error('❌ Verification Failed:', e);
        process.exit(1);
    }
}

main();
