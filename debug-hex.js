const ABNFParser = require('./src/abnf-parser');

const parser = new ABNFParser();

// Test simple cases to debug the tokenizer
const testCases = [
    'test = %x41',
    'test = %x41-5A',
    'test = %d65',
    'test = %d65-90'
];

for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase}`);
    try {
        const rules = parser.parse(testCase);
        const rule = rules.get('test');
        console.log(`✓ Success: ${rule.expression.text}`);
    } catch (error) {
        console.log(`✗ Failed: ${error.message}`);
    }
}