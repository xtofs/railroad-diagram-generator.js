#!/usr/bin/env node

/**
 * CLI Interface for ABNF to Railroad Diagram Converter
 */

const { Command } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const { glob } = require('glob');
const Handlebars = require('handlebars');
const ABNFToRailroad = require('../src/main');

// Load package.json for version info
const packageJson = require('../package.json');

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
        }).sort((a, b) => a.name.localeCompare(b.name));
        
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
    .version(packageJson.version);

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
            // Normalize path separators for cross-platform glob patterns
            const normalizedInput = input.replace(/\\/g, '/');
            
            // Find matching files using glob pattern
            const inputFiles = await glob(normalizedInput, { 
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
            // Normalize path separators for cross-platform glob patterns
            const normalizedInput = input.replace(/\\/g, '/');
            
            // Find matching files using glob pattern
            const inputFiles = await glob(normalizedInput, { 
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

program
    .command('watch')
    .argument('<input>', 'ABNF input file or glob pattern to watch')
    .argument('[output]', 'HTML output file or directory (default: same location as input with .html extension)')
    .option('-t, --title <title>', 'Document title (for single file) or title template')
    .option('-o, --output-dir <dir>', 'Output directory for multiple files')
    .option('-i, --index', 'Generate an index.html file listing all converted files')
    .description('Watch ABNF files and source code for changes, regenerate on change')
    .action(async (input, output, options) => {
        console.log('🚀 Starting watch mode...');
        console.log(`📁 Watching pattern: ${input}`);
        console.log(`📂 Watching source: src/**/*.js`);
        console.log('📝 Press Ctrl+C to stop\n');
        
        const converter = new ABNFToRailroad();
        
        // Function to clear module cache for source files
        const clearModuleCache = () => {
            const srcPath = path.join(__dirname, '..', 'src');
            Object.keys(require.cache).forEach(key => {
                if (key.startsWith(srcPath)) {
                    delete require.cache[key];
                }
            });
        };
        
        // Function to run generation
        const runGeneration = async (changeFile) => {
            console.log(`🔄 Change detected: ${changeFile || 'unknown'}`);
            
            // Clear module cache if source file changed
            if (changeFile && changeFile !== 'initial' && changeFile.includes('src')) {
                console.log(`🔥 Clearing module cache...`);
                clearModuleCache();
            }
            
            console.log(`⚡ Regenerating...`);
            
            try {
                // Reload converter if cache was cleared
                let currentConverter = converter;
                if (changeFile && changeFile !== 'initial' && changeFile.includes('src')) {
                    console.log(`🔄 Reloading converter...`);
                    delete require.cache[require.resolve('../src/index')];
                    const ABNFToRailroadReloaded = require('../src/main');
                    currentConverter = new ABNFToRailroadReloaded();
                }
                
                // Normalize path separators for cross-platform glob patterns
                const normalizedInput = input.replace(/\\/g, '/');
                
                // Find matching files using glob pattern
                const inputFiles = await glob(normalizedInput, { 
                    ignore: ['node_modules/**', '**/node_modules/**'],
                    absolute: true 
                });
                
                if (inputFiles.length === 0) {
                    console.log(`⚠️  No files found matching pattern: ${input}`);
                    return;
                }
                
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
                        
                        // Generate title from filename if not specified
                        const title = options.title || `${path.basename(inputFile, path.extname(inputFile))} Grammar`;
                        
                        const conversionOptions = { title };
                        const result = await currentConverter.convert(inputFile, outputFile, conversionOptions);
                        
                        if (result.success) {
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
                const timestamp = new Date().toLocaleTimeString();
                if (errorCount === 0) {
                    console.log(`✅ [${timestamp}] Regenerated ${successCount} file(s) successfully`);
                } else {
                    console.log(`⚠️  [${timestamp}] Success: ${successCount}, Errors: ${errorCount}`);
                }
                console.log('👀 Watching for changes...\n');
                
            } catch (error) {
                console.error(`❌ Error: ${error.message}`);
            }
        };
        
        // Initial generation
        await runGeneration('initial');
        
        // Set up file watchers
        const watchedPaths = new Set();
        const watchers = [];
        
        try {
            // Normalize path separators for cross-platform glob patterns
            const normalizedInput = input.replace(/\\/g, '/');
            
            // Watch ABNF files
            const abnfFiles = await glob(normalizedInput, { 
                ignore: ['node_modules/**', '**/node_modules/**'],
                absolute: true 
            });
            
            for (const file of abnfFiles) {
                if (!watchedPaths.has(file)) {
                    watchedPaths.add(file);
                    const watcher = fs.watch(file, { encoding: 'utf8' }, (eventType, filename) => {
                        if (eventType === 'change') {
                            runGeneration(path.relative(process.cwd(), file));
                        }
                    });
                    watchers.push(watcher);
                }
            }
            
            // Watch source code directory
            const srcDir = path.join(__dirname, '..', 'src');
            if (fs.existsSync(srcDir)) {
                const watchSrcRecursive = (dir) => {
                    const watcher = fs.watch(dir, { encoding: 'utf8' }, (eventType, filename) => {
                        if (eventType === 'change' && filename && filename.endsWith('.js')) {
                            const fullPath = path.join(dir, filename);
                            runGeneration(path.relative(process.cwd(), fullPath));
                        }
                    });
                    watchers.push(watcher);
                    
                    // Watch subdirectories
                    const items = fs.readdirSync(dir, { withFileTypes: true });
                    for (const item of items) {
                        if (item.isDirectory()) {
                            watchSrcRecursive(path.join(dir, item.name));
                        }
                    }
                };
                
                watchSrcRecursive(srcDir);
            }
            
            // Handle graceful shutdown
            process.on('SIGINT', () => {
                console.log('\n🛑 Stopping watch mode...');
                watchers.forEach(watcher => watcher.close());
                process.exit(0);
            });
            
            // Keep the process alive
            process.stdin.resume();
            
        } catch (error) {
            console.error(`❌ Error setting up watchers: ${error.message}`);
            process.exit(1);
        }
    });

// Handle the npm script case: npm run generate <file>
if (process.argv.length >= 3 && process.argv[2] !== 'generate' && process.argv[2] !== 'list' && process.argv[2] !== 'watch') {
    // If called as: node bin/cli.js file.abnf
    // Transform it to: node bin/cli.js generate file.abnf
    const args = process.argv.slice(2);
    process.argv = ['node', 'bin/cli.js', 'generate', ...args];
}

program.parse();