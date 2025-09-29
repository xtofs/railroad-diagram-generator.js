#!/usr/bin/env node

/**
 * CLI Interface for ABNF to Railroad Diagram Converter
 */

const { Command } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const { glob } = require('glob');
const Handlebars = require('handlebars');
const ABNFToRailroad = require('../src/index');

const program = new Command();

/**
 * Generate an index.html page listing all converted files
 */
async function generateIndexPage(processedFiles, outputDir) {
    console.log('\nGenerating index page...');
    
    try {
        // Determine output directory - use the first file's directory if no output dir specified
        const indexDir = outputDir ? path.resolve(outputDir) : path.dirname(processedFiles[0].outputFile);
        const indexPath = path.join(indexDir, 'index.html');
        
        // Load template
        const templatePath = path.join(__dirname, '..', 'assets', 'index-template.hbs');
        const templateContent = await fs.readFile(templatePath, 'utf8');
        const template = Handlebars.compile(templateContent);
        
        // Prepare data
        const files = processedFiles.map(file => {
            const htmlFile = path.relative(indexDir, file.outputFile);
            const sourceName = path.basename(file.inputFile);
            const name = file.title.replace(' Grammar', '');
            
            return {
                name,
                sourceName,
                htmlFile: htmlFile.replace(/\\/g, '/'), // Ensure forward slashes for web
                ruleCount: file.rulesCount
            };
        });
        
        const totalRules = files.reduce((sum, file) => sum + file.ruleCount, 0);
        
        const templateData = {
            files,
            fileCount: files.length,
            totalRules,
            generatedTime: new Date().toLocaleString()
        };
        
        // Generate HTML
        const html = template(templateData);
        
        // Write index file
        await fs.writeFile(indexPath, html, 'utf8');
        
        console.log(`✓ Index page generated: ${path.relative(process.cwd(), indexPath)}`);
        
    } catch (error) {
        console.error(`✗ Error generating index page: ${error.message}`);
    }
}

program
    .name('abnf-to-railroad')
    .description('Convert ABNF grammar files to HTML with railroad diagrams')
    .version('1.0.0');

program
    .command('generate')
    .alias('gen')
    .argument('<input>', 'ABNF input file or glob pattern (e.g., "*.abnf", "**/*.abnf")')
    .argument('[output]', 'HTML output file or directory (default: same location as input with .html extension)')
    .option('-t, --title <title>', 'Document title (for single file) or title template')
    .option('-o, --output-dir <dir>', 'Output directory for multiple files')
    .option('-i, --index', 'Generate an index.html file listing all converted files')
    .description('Generate HTML with railroad diagrams from ABNF file(s)')
    .action(async (input, output, options) => {
        const converter = new ABNFToRailroad();
        
        try {
            // Find matching files using glob pattern
            const inputFiles = await glob(input, { 
                ignore: ['node_modules/**', '**/node_modules/**'],
                absolute: true 
            });
            
            if (inputFiles.length === 0) {
                console.error(`Error: No files found matching pattern: ${input}`);
                process.exit(1);
            }
            
            console.log(`Found ${inputFiles.length} file(s) matching pattern: ${input}`);
            
            let successCount = 0;
            let errorCount = 0;
            const processedFiles = [];
            
            for (const inputFile of inputFiles) {
                try {
                    // Determine output filename
                    let outputFile;
                    if (inputFiles.length === 1 && output && !options.outputDir) {
                        // Single file with explicit output
                        outputFile = path.resolve(output);
                    } else {
                        // Multiple files or output directory specified
                        const inputDir = options.outputDir ? path.resolve(options.outputDir) : path.dirname(inputFile);
                        const inputName = path.basename(inputFile, path.extname(inputFile));
                        outputFile = path.join(inputDir, inputName + '.html');
                        
                        // Ensure output directory exists
                        await fs.ensureDir(path.dirname(outputFile));
                    }
                    
                    console.log(`\nConverting: ${path.relative(process.cwd(), inputFile)}`);
                    console.log(`Output: ${path.relative(process.cwd(), outputFile)}`);
                    
                    // Generate title from filename if not specified
                    const title = options.title || `${path.basename(inputFile, path.extname(inputFile))} Grammar`;
                    
                    const conversionOptions = { title };
                    const result = await converter.convert(inputFile, outputFile, conversionOptions);
                    
                    if (result.success) {
                        console.log(`✓ Success! Generated HTML with ${result.rulesCount} rules.`);
                        successCount++;
                        
                        // Track successful conversions for index generation
                        processedFiles.push({
                            inputFile,
                            outputFile,
                            rulesCount: result.rulesCount,
                            title
                        });
                    } else {
                        console.error(`✗ Error: ${result.error}`);
                        errorCount++;
                    }
                } catch (fileError) {
                    console.error(`✗ Error processing ${inputFile}: ${fileError.message}`);
                    errorCount++;
                }
            }
            
            // Generate index if requested and there are successful conversions
            if (options.index && processedFiles.length > 0) {
                await generateIndexPage(processedFiles, options.outputDir);
            }
            
            // Summary
            console.log(`\n=== Summary ===`);
            console.log(`✓ Successfully converted: ${successCount} file(s)`);
            if (errorCount > 0) {
                console.log(`✗ Failed to convert: ${errorCount} file(s)`);
                process.exit(1);
            }
            
        } catch (error) {
            console.error(`Error: ${error.message}`);
            process.exit(1);
        }
    });

program
    .command('list')
    .argument('<input>', 'ABNF input file or glob pattern')
    .description('List all rules in ABNF file(s)')
    .action(async (input) => {
        const converter = new ABNFToRailroad();
        
        try {
            // Find matching files using glob pattern
            const inputFiles = await glob(input, { 
                ignore: ['node_modules/**', '**/node_modules/**'],
                absolute: true 
            });
            
            if (inputFiles.length === 0) {
                console.error(`Error: No files found matching pattern: ${input}`);
                process.exit(1);
            }
            
            for (const inputFile of inputFiles) {
                if (inputFiles.length > 1) {
                    console.log(`\n=== ${path.relative(process.cwd(), inputFile)} ===`);
                }
                await converter.listRules(inputFile);
            }
            
        } catch (error) {
            console.error(`Error: ${error.message}`);
            process.exit(1);
        }
    });

// Handle the npm script case: npm run generate <file>
if (process.argv.length >= 3 && process.argv[2] !== 'generate' && process.argv[2] !== 'list') {
    // If called as: node bin/cli.js file.abnf
    // Transform it to: node bin/cli.js generate file.abnf
    const args = process.argv.slice(2);
    process.argv = ['node', 'bin/cli.js', 'generate', ...args];
}

program.parse();