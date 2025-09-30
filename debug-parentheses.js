/**
 * Debug script to check parenthesis balance in ABNF file
 */

const fs = require('fs');

// Read the OData.abnf file
const content = fs.readFileSync('./examples/OData.abnf', 'utf8');
const lines = content.split('\n');

let balance = 0;
let ruleBalance = {};  // Track balance per rule
let currentRule = null;

console.log('Checking parenthesis balance...\n');

for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    
    // Skip comments and empty lines
    if (line.trim().startsWith(';') || !line.trim()) {
        continue;
    }
    
    // Check for rule start
    const ruleMatch = line.match(/^([a-zA-Z][a-zA-Z0-9-]*)\s*:?=/);
    if (ruleMatch) {
        // Report previous rule balance if it's not zero
        if (currentRule && ruleBalance[currentRule] !== 0) {
            console.log(`Rule '${currentRule}' has unbalanced parentheses: ${ruleBalance[currentRule]}`);
        }
        currentRule = ruleMatch[1];
        ruleBalance[currentRule] = 0;
    }
    
    // Count parentheses in this line
    let lineBalance = 0;
    for (let j = 0; j < line.length; j++) {
        if (line[j] === '(') {
            balance++;
            lineBalance++;
            if (currentRule) ruleBalance[currentRule]++;
        } else if (line[j] === ')') {
            balance--;
            lineBalance--;
            if (currentRule) ruleBalance[currentRule]--;
        }
    }
    
    // Report lines with significant imbalance
    if (Math.abs(lineBalance) > 2 || balance < 0) {
        console.log(`Line ${lineNum}: balance=${lineBalance}, total=${balance} | ${line.trim()}`);
    }
}

console.log(`\nFinal balance: ${balance}`);
if (currentRule && ruleBalance[currentRule] !== 0) {
    console.log(`Final rule '${currentRule}' has unbalanced parentheses: ${ruleBalance[currentRule]}`);
}

// Show rules with non-zero balance
console.log('\nRules with unbalanced parentheses:');
for (const [rule, bal] of Object.entries(ruleBalance)) {
    if (bal !== 0) {
        console.log(`  ${rule}: ${bal}`);
    }
}