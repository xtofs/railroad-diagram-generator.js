#!/usr/bin/env node

/**
 * CLI Interface for ABNF to Railroad Diagram Converter
 */

const { Command } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const ABNFToRailroad = require('../src/index');

const program = new Command();

program
    .name('abnf-to-railroad')
    .description('Convert ABNF grammar files to HTML with railroad diagrams')
    .version('1.0.0');

program
    .command('generate')
    .alias('gen')
    .argument('<input>', 'ABNF input file')
    .argument('[output]', 'HTML output file (default: input filename with .html extension)')
    .option('-t, --title <title>', 'Document title')
    .description('Generate HTML with railroad diagrams from ABNF file')
    .action(async (input, output, options) => {
        const converter = new ABNFToRailroad();
        // Determine output filename
        if (!output) {
            // Put output file in same directory as input file
            const inputDir = path.dirname(input);
            const inputName = path.basename(input, path.extname(input));
            output = path.join(inputDir, inputName + '.html');
        }
        // Convert to absolute paths
        const inputPath = path.resolve(input);
        const outputPath = path.resolve(output);
        // Check if input file exists
        if (!await fs.pathExists(inputPath)) {
            console.error(`Error: Input file does not exist: ${inputPath}`);
            process.exit(1);
        }
        console.log(`Converting ${inputPath} to ${outputPath}`);
        const conversionOptions = {
            title: options.title
        };
        let result = await converter.convert(inputPath, outputPath, conversionOptions);
        if (result.success) {
            console.log(`\nSuccess! Generated HTML with ${result.rulesCount} rules.`);
            console.log(`Output: ${result.outputFile}`);
        } else {
            console.error(`\nError: ${result.error}`);
            process.exit(1);
        }
    });

program
    .command('list')
    .argument('<input>', 'ABNF input file')
    .description('List all rules in an ABNF file')
    .action(async (input) => {
        const converter = new ABNFToRailroad();
        const inputPath = path.resolve(input);
        
        if (!await fs.pathExists(inputPath)) {
            console.error(`Error: Input file does not exist: ${inputPath}`);
            process.exit(1);
        }
        
        await converter.listRules(inputPath);
    });

// Handle the npm script case: npm run generate <file>
if (process.argv.length >= 3 && process.argv[2] !== 'generate' && process.argv[2] !== 'list') {
    // If called as: node bin/cli.js file.abnf
    // Transform it to: node bin/cli.js generate file.abnf
    const args = process.argv.slice(2);
    process.argv = ['node', 'bin/cli.js', 'generate', ...args];
}

program.parse();