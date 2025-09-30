/**
 * Debug script to show tokens around lines 143-151 from original text
 */

const ABNFParser = require('./src/abnf-parser');
const fs = require('fs');

// Read the OData.abnf file
const content = fs.readFileSync('./examples/OData.abnf', 'utf8');

console.log('Tokenizing the original ABNF file content...\n');

const parser = new ABNFParser();

try {
    // Tokenize the entire original file content (preserving line breaks)
    const tokens = parser.tokenizer.tokenize(content);
    
    console.log('Showing tokens from lines 143-151:\n');
    
    // Filter and show tokens from lines 143-151
    const relevantTokens = tokens.filter(token => token.line >= 143 && token.line <= 151);
    
    relevantTokens.forEach((token, i) => {
        console.log(`Token ${i.toString().padStart(2)}: line ${token.line.toString().padStart(3)}, col ${token.column.toString().padStart(2)} | ${token.type.padEnd(12)} | "${token.value}"`);
    });
    
    console.log(`\nTotal tokens in range: ${relevantTokens.length}`);
    
    // Show parentheses balance in this range
    console.log('\nParentheses balance in this range:');
    let balance = 0;
    relevantTokens.forEach((token, i) => {
        if (token.type === 'lparen') {
            balance++;
            console.log(`  Token ${i}: ${token.type} "${token.value}" at line ${token.line}, col ${token.column} -> balance = ${balance}`);
        } else if (token.type === 'rparen') {
            balance--;
            console.log(`  Token ${i}: ${token.type} "${token.value}" at line ${token.line}, col ${token.column} -> balance = ${balance}`);
        }
    });
    
    console.log(`\nFinal balance in range: ${balance}`);
    
} catch (error) {
    console.error('Tokenization failed:', error.message);
    console.error('Stack:', error.stack);
}