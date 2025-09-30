#!/usr/bin/env node

/**
 * Debug Parser Tool
 * 
 * A utility for debugging ABNF parsing by showing both tokenization and AST generation
 * Usage: 
 *   node bin/debug-parser.js "ABNF_CONTENT"     (direct content)
 *   node bin/debug-parser.js file.abnf          (read from file)  
 *   echo "ABNF_CONTENT" | node bin/debug-parser.js  (read from stdin)
 * Example: node bin/debug-parser.js "GUID = 8HEXDIG"
 */

const ABNFParser = require('../src/abnf-parser');
const fs = require('fs');
const path = require('path');

function debugParse(content) {
    console.log('='.repeat(60));
    console.log('ABNF PARSER DEBUG TOOL');
    console.log('='.repeat(60));
    console.log('Input:', JSON.stringify(content));
    console.log();
    
    try {
        const parser = new ABNFParser();
        
        // Step 1: Tokenization
        console.log('TOKENIZATION:');
        console.log('-'.repeat(40));
        const tokens = parser.tokenizer.tokenize(content);
        if (tokens.length === 0) {
            console.log('No tokens generated');
        } else {
            tokens.forEach((token, index) => {
                console.log(`${index.toString().padStart(2)}: ${token.type.padEnd(12)} "${token.value}" at ${token.line}:${token.column}`);
            });
        }
        console.log();
        
        // Step 2: Parsing to AST
        console.log('PARSING TO AST:');
        console.log('-'.repeat(40));
        const rules = parser.parse(content);
        
        if (rules.size === 0) {
            console.log('No rules parsed');
        } else {
            Array.from(rules.entries()).forEach(([ruleName, ruleData]) => {
                console.log(`Rule: ${ruleName}`);
                console.log(`Original ABNF: ${ruleData.original}`);
                console.log('AST:');
                console.log(JSON.stringify(ruleData.expression, null, 2));
                console.log();
            });
        }
        
    } catch (error) {
        console.error('ERROR:', error.message);
        if (error.line && error.column) {
            console.error(`At line ${error.line}, column ${error.column}`);
        }
        if (error.token) {
            console.error(`Token: ${error.token.type} "${error.token.value}"`);
        }
        process.exit(1);
    }
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // Check if there's input from stdin
        if (process.stdin.isTTY) {
            // No stdin input, show usage
            console.log('ABNF Parser Debug Tool');
            console.log('');
            console.log('Usage:');
            console.log('  node bin/debug-parser.js "ABNF_CONTENT"     (direct content)');
            console.log('  node bin/debug-parser.js file.abnf          (read from file)');
            console.log('  echo "ABNF_CONTENT" | node bin/debug-parser.js  (read from stdin)');
            console.log('');
            console.log('Examples:');
            console.log('  node bin/debug-parser.js "GUID = 8HEXDIG"');
            console.log('  node bin/debug-parser.js "rule = \\"hello\\" / \\"world\\""');
            console.log('  node bin/debug-parser.js examples/json.abnf');
            console.log('  echo "test = 4ALPHA" | node bin/debug-parser.js');
            console.log('');
            process.exit(1);
        } else {
            // Read from stdin
            let stdinData = '';
            process.stdin.setEncoding('utf8');
            
            process.stdin.on('data', (chunk) => {
                stdinData += chunk;
            });
            
            process.stdin.on('end', () => {
                const content = stdinData.trim();
                if (content) {
                    debugParse(content);
                } else {
                    console.error('No content provided via stdin');
                    process.exit(1);
                }
            });
            
            process.stdin.on('error', (error) => {
                console.error('Error reading from stdin:', error.message);
                process.exit(1);
            });
        }
    } else if (args.length === 1) {
        const arg = args[0];
        
        // Check if the argument is an existing file path
        const filePath = path.resolve(arg);
        if (fs.existsSync(filePath)) {
            // Treat as file path
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                console.log(`Reading from file: ${filePath}`);
                console.log();
                debugParse(content);
            } catch (error) {
                console.error(`Error reading file: ${error.message}`);
                process.exit(1);
            }
        } else {
            // Treat as direct content
            debugParse(arg);
        }
    } else {
        // Multiple arguments - join as content
        const content = args.join(' ');
        debugParse(content);
    }
}

module.exports = { debugParse };