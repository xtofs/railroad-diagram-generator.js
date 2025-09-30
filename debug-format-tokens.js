/**
 * Debug script to show tokens around lines 144-149
 */

const ABNFParser = require('./src/abnf-parser');
const fs = require('fs');

// Read the OData.abnf file
const content = fs.readFileSync('./examples/OData.abnf', 'utf8');
const lines = content.split('\n');

// Extract the format rule as the parser would
let currentRule = null;
let currentDefinition = '';
let formatDefinition = '';

console.log('Extracting format rule definition...\n');

for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith(';')) {
        continue;
    }

    // Check if this is a rule definition
    const ruleMatch = line.match(/^([a-zA-Z][a-zA-Z0-9-]*)\s*:?=\s*(.*)$/);
    
    if (ruleMatch) {
        // Save previous rule if it was format
        if (currentRule === 'format') {
            formatDefinition = currentDefinition.trim();
            break;
        }
        
        // Start new rule
        currentRule = ruleMatch[1];
        currentDefinition = ruleMatch[2];
    } else if (currentRule) {
        // Continuation of current rule
        currentDefinition += ' ' + line;
    }
}

// Also handle if format is the last rule
if (currentRule === 'format') {
    formatDefinition = currentDefinition.trim();
}

console.log(`Format rule definition: "${formatDefinition}"`);
console.log(`Length: ${formatDefinition.length}`);

// Show each character for debugging
console.log('\nCharacter-by-character breakdown:');
for (let i = 0; i < formatDefinition.length; i++) {
    const char = formatDefinition[i];
    const code = char.charCodeAt(0);
    console.log(`  ${i.toString().padStart(3)}: "${char}" (${code}) ${char === ' ' ? '(space)' : char === '\n' ? '(newline)' : char === '\r' ? '(carriage return)' : ''}`);
}
console.log();

// Now tokenize it and show the tokens
const parser = new ABNFParser();

try {
    console.log('Tokenizing format rule definition...\n');
    
    // Let's manually step through the tokenization to see where it fails
    const tokenizer = parser.tokenizer;
    console.log('Manual tokenization step-by-step:\n');
    
    const tokens = [];
    let match;
    let lastIndex = 0;
    let line = 1;
    let column = 1;
    let tokenCount = 0;

    tokenizer.tokenRegex.lastIndex = 0; // Reset regex state

    while ((match = tokenizer.tokenRegex.exec(formatDefinition)) !== null) {
        tokenCount++;
        console.log(`\nStep ${tokenCount}:`);
        console.log(`  Match at index ${match.index}: "${match[0]}"`);
        console.log(`  lastIndex was: ${lastIndex}, now: ${match.index + match[0].length}`);
        
        // Check for gaps in tokenization
        if (match.index !== lastIndex) {
            const gap = formatDefinition.slice(lastIndex, match.index);
            console.log(`  Gap detected: "${gap}" (${gap.length} chars)`);
            if (gap.trim()) {
                console.log(`  ERROR: Unexpected characters in gap!`);
                throw new Error(`Unexpected character(s) at position ${lastIndex}: '${gap}'`);
            }
            // Update position for gap
            const gapUpdate = tokenizer._updatePosition(gap, line, column);
            line = gapUpdate.line;
            column = gapUpdate.column;
        }

        // Store current position for this token
        const tokenLine = line;
        const tokenColumn = column;

        // Find which named group matched
        const groups = match.groups;
        let tokenType = null;
        let tokenValue = match[0];

        for (const [groupName, groupValue] of Object.entries(groups)) {
            if (groupValue !== undefined) {
                tokenType = groupName;
                break;
            }
        }

        console.log(`  Token type: ${tokenType}, value: "${tokenValue}"`);
        console.log(`  Position: line ${tokenLine}, column ${tokenColumn}`);

        // Skip whitespace and comments, but still track position
        if (tokenType !== 'whitespace' && tokenType !== 'comment') {
            tokens.push({
                type: tokenType,
                value: tokenValue,
                line: tokenLine,
                column: tokenColumn
            });
            console.log(`  -> Added token #${tokens.length - 1}`);
        } else {
            console.log(`  -> Skipped (${tokenType})`);
        }

        // Update position based on the matched token
        const positionUpdate = tokenizer._updatePosition(tokenValue, line, column);
        line = positionUpdate.line;
        column = positionUpdate.column;

        lastIndex = match.index + match[0].length;
        
        // Show remaining text
        const remaining = formatDefinition.slice(lastIndex);
        console.log(`  Remaining text: "${remaining.slice(0, 50)}${remaining.length > 50 ? '...' : ''}"`);
        
        if (tokenCount > 50) { // Increased safety limit
            console.log('  Stopping after 50 tokens for safety...');
            break;
        }
    }

    // Check if we consumed all input
    if (lastIndex < formatDefinition.length) {
        const remaining = formatDefinition.slice(lastIndex);
        console.log(`\nRemaining unconsumed text: "${remaining}"`);
        if (remaining.trim()) {
            console.log(`ERROR: Unexpected characters at end!`);
        }
    }
    
    console.log(`\nFinal token count: ${tokens.length}`);
    
} catch (error) {
    console.error('Tokenization failed:', error.message);
    console.error('Stack:', error.stack);
}