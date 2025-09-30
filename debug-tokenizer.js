/**
 * Debug script to test tokenizer with line/column tracking
 */

const ABNFParser = require('./src/abnf-parser');
const fs = require('fs');

// Read the OData.abnf file
const content = fs.readFileSync('./examples/OData.abnf', 'utf8');

const parser = new ABNFParser();

try {
    console.log('Parsing OData.abnf...');
    
    // Parse line by line to identify which rule causes the error
    const lines = content.split('\n');
    const rules = new Map();
    let currentRule = null;
    let currentDefinition = '';
    let currentRuleStartLine = 1;

    for (let i = 0; i < lines.length; i++) {
        const lineNumber = i + 1;
        const line = lines[i].trim();
        
        if (!line || line.startsWith(';')) {
            continue;
        }

        const ruleMatch = line.match(/^([a-zA-Z][a-zA-Z0-9-]*)\s*:?=\s*(.*)$/);
        
        if (ruleMatch) {
            // Save previous rule if exists
            if (currentRule) {
                try {
                    console.log(`Parsing rule: ${currentRule} (starts at line ${currentRuleStartLine})`);
                    if (currentRule === 'format') {
                        console.log(`Format rule definition: "${currentDefinition.trim()}"`);
                    }
                    const result = parser._parseDefinition(currentRule, currentDefinition.trim(), currentRuleStartLine);
                    rules.set(currentRule, result);
                } catch (error) {
                    console.error(`ERROR in rule '${currentRule}' (line ${currentRuleStartLine}): ${error.message}`);
                    if (currentRule === 'format') {
                        console.error(`Format rule definition was: "${currentDefinition.trim()}"`);
                    }
                    throw error;
                }
            }
            
            currentRule = ruleMatch[1];
            currentDefinition = ruleMatch[2];
            currentRuleStartLine = lineNumber;
        } else if (currentRule) {
            currentDefinition += ' ' + line;
        }
    }

    // Don't forget the last rule
    if (currentRule) {
        try {
            console.log(`Parsing rule: ${currentRule} (starts at line ${currentRuleStartLine})`);
            const result = parser._parseDefinition(currentRule, currentDefinition.trim(), currentRuleStartLine);
            rules.set(currentRule, result);
        } catch (error) {
            console.error(`ERROR in rule '${currentRule}' (line ${currentRuleStartLine}): ${error.message}`);
            throw error;
        }
    }
    
    console.log(`Successfully parsed ${rules.size} rules`);
} catch (error) {
    console.error('Parsing failed:', error.message);
    if (error.line && error.column) {
        console.error(`Error at line ${error.line}, column ${error.column}`);
        
        // Show the context around the error
        const lines = content.split('\n');
        const errorLine = error.line - 1; // Convert to 0-based
        const startLine = Math.max(0, errorLine - 2);
        const endLine = Math.min(lines.length - 1, errorLine + 2);
        
        console.error('\nContext:');
        for (let i = startLine; i <= endLine; i++) {
            const lineNum = (i + 1).toString().padStart(3, ' ');
            const marker = i === errorLine ? '>>>' : '   ';
            console.error(`${marker} ${lineNum}: ${lines[i]}`);
            if (i === errorLine && error.column) {
                // Show column indicator
                const indent = '       ' + ' '.repeat(error.column - 1);
                console.error(`${indent}^`);
            }
        }
    }
}