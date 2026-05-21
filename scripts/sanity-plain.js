console.log('Starting sanity check...');
try {
    const assert = require('assert');
    assert.strictEqual(1 + 1, 2);
    console.log('Math works.');
    console.log('Sanity check passed.');
    process.exit(0);
} catch (e) {
    console.error('Sanity check failed:', e);
    process.exit(1);
}
