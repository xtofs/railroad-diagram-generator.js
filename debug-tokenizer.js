// Quick test to debug hex/decimal tokenization
const ABNFParser = require('./src/abnf-parser');

const parser = new ABNFParser();

// Test simple cases first
try {
    console.log('Testing simple hex:');
    const rules1 = parser.parse('test1 = %x41');
    console.log('✓ Simple hex works');
    
    console.log('Testing hex range:');
    const rules2 = parser.parse('test2 = %x41-5A');
    console.log('✓ Hex range works');
    
} catch (error) {
    console.error('Error:', error.message);
    console.log('This helps us debug the tokenizer issue');
}