/**
 * Debug the exact multi-line parsing process
 */

const fs = require('fs');

// Read the OData.abnf file
const content = fs.readFileSync('./examples/OData.abnf', 'utf8');
const lines = content.split('\n');

console.log('Tracing format rule extraction...\n');

let currentRule = null;
let currentDefinition = '';
let currentRuleStartLine = 1;

for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];
    const trimmedLine = line.trim();
    
    console.log(`Line ${lineNumber}: "${line}" (trimmed: "${trimmedLine}")`);
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith(';')) {
        console.log('  -> Skipped (empty or comment)');
        continue;
    }

    // Check if this is a rule definition (contains := or =)
    const ruleMatch = trimmedLine.match(/^([a-zA-Z][a-zA-Z0-9-]*)\s*:?=\s*(.*)$/);
    
    if (ruleMatch) {
        // Save previous rule if exists
        if (currentRule) {
            console.log(`  -> End of rule '${currentRule}', definition: "${currentDefinition.trim()}"`);
            if (currentRule === 'format') {
                console.log('     *** FORMAT RULE DEFINITION ***');
                console.log(`     Definition: "${currentDefinition.trim()}"`);
                console.log(`     Length: ${currentDefinition.trim().length}`);
                break; // Stop here for format rule
            }
        }
        
        // Start new rule
        currentRule = ruleMatch[1];
        currentDefinition = ruleMatch[2];
        currentRuleStartLine = lineNumber;
        console.log(`  -> Start of rule '${currentRule}', initial def: "${ruleMatch[2]}"`);
        
        if (currentRule === 'format') {
            console.log('     *** STARTING FORMAT RULE ***');
        }
    } else if (currentRule) {
        // Continuation of current rule
        console.log(`  -> Continuation of rule '${currentRule}', adding: "${trimmedLine}"`);
        currentDefinition += ' ' + trimmedLine;
        console.log(`     Current definition: "${currentDefinition}"`);
    }
}