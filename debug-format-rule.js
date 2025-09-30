/**
 * Debug the specific format rule parsing
 */

const ABNFParser = require('./src/abnf-parser');

// Extract just the format rule definition as it appears in the file
const formatDefinition = `( "$format" / "format" ) EQ ( "atom" / "json" / "xml" / 1*pchar "/" 1*pchar )`;

console.log('Testing format rule definition:');
console.log(`"${formatDefinition}"`);
console.log();

const parser = new ABNFParser();

try {
    // Test tokenization
    console.log('Tokenizing...');
    const tokens = parser.tokenizer.tokenize(formatDefinition);
    console.log('Tokens:');
    tokens.forEach((token, i) => {
        console.log(`  ${i}: ${token.type} "${token.value}" at line ${token.line}, column ${token.column}`);
    });
    
    console.log('\nParsing...');
    const result = parser._parseTokenizedDefinition(formatDefinition, 144);
    console.log('Success! AST:', JSON.stringify(result, null, 2));
    
} catch (error) {
    console.error('Error:', error.message);
    if (error.line && error.column) {
        console.error(`At line ${error.line}, column ${error.column}`);
    }
}