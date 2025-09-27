/**
 * Test script for ABNF to Railroad converter
 */

const ABNFToRailroad = require('../src/index');
const path = require('path');
const fs = require('fs-extra');

async function runTests() {
    console.log('Running ABNF to Railroad converter tests...\n');
    
    const converter = new ABNFToRailroad();
    const testDir = __dirname;
    const inputFile = path.join(testDir, 'simple.abnf');
    const outputFile = path.join(testDir, 'simple-output.html');
    
    try {
        // Step 1: Read ABNF file
        console.log('Step 1: Reading ABNF file');
        const abnfContent = await fs.readFile(inputFile, 'utf8');
        console.log(`✓ Read ${abnfContent.split('\n').length} lines from ${inputFile}\n`);
        
        // Step 2: Parse ABNF to AST
        console.log('Step 2: Parsing ABNF to AST');
        const ast = converter.parser.parse(abnfContent);
        console.log(`✓ Parsed ${ast.size} rules from ABNF content`);
        console.log('AST Structure:');
        for (const [ruleName, ruleData] of ast) {
            console.log(`\n  Rule: ${ruleName}`);
            console.log(`    Original: ${ruleData.original}`);
            console.log(`    Diagram: ${ruleData.railroad}`);
            if (ruleData.parsed) {
                console.log(`    Parsed AST:`, JSON.stringify(ruleData.parsed, null, 4));
            }
        }
        console.log();
        
        // Step 3: Transform AST to HTML
        console.log('Step 3: Converting AST to HTML');
        const result = await converter.convertFromAST(ast, outputFile, {
            title: 'Simple Arithmetic Grammar Test'
        });
        
        if (result.success) {
            console.log(`✓ Static conversion successful: ${result.outputFile}`);
            const htmlExists = await fs.pathExists(outputFile);
            console.log(`✓ Output file exists: ${htmlExists}`);
        } else {
            console.log(`✗ Static conversion failed: ${result.error}`);
        }
        
        console.log('\nTest completed! Linear flow: File → AST → HTML');
        
    } catch (error) {
        console.error('Test failed with error:', error);
    }
}

if (require.main === module) {
    runTests();
}

module.exports = { runTests };