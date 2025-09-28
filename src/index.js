/**
 * Main Application Logic
 * 
 * Coordinates the parsing, rendering, and HTML generation process
 */

const ABNFParser = require('./abnf-parser');
const SVGRenderer = require('./svg-renderer');
const HTMLGenerator = require('./html-generator');
const fs = require('fs-extra');
const path = require('path');

/**
 * @typedef {Object} ConversionOptions
 * @property {string} [title] - Document title for generated HTML
 */

/**
 * @typedef {Object} ConversionResult
 * @property {boolean} success - Whether the conversion was successful
 * @property {number} [rulesCount] - Number of rules processed (if successful)
 * @property {string} [outputFile] - Path to output file (if successful)
 * @property {string} [error] - Error message (if failed)
 */

/**
 * Main class for converting ABNF files to HTML railroad diagrams
 */
class ABNFToRailroad {
    /**
     * Create a new ABNF to Railroad converter
     */
    constructor() {
        /** @type {ABNFParser} ABNF parser instance */
        this.parser = new ABNFParser();
        /** @type {SVGRenderer} SVG renderer instance */
        this.renderer = new SVGRenderer();
        /** @type {HTMLGenerator} HTML generator instance */
        this.generator = new HTMLGenerator();
    }

    /**
     * Parse ABNF file and return the AST
     * @param {string} inputFile - Path to ABNF file
     * @returns {Promise<Map<string, {name: string, original: string, expression: ASTNode}>>} Parsed rules map
     * @throws {Error} If file cannot be read or no valid rules found
     */
    async parse(inputFile) {
        console.log(`Reading ABNF file: ${inputFile}`);
        
        const abnfContent = await fs.readFile(inputFile, 'utf8');
        const rules = this.parser.parse(abnfContent);
        
        console.log(`Parsed ${rules.size} rules from ABNF file`);
        
        if (rules.size === 0) {
            throw new Error('No valid rules found in ABNF file');
        }

        return rules;
    }

    /**
     * Convert parsed rules to HTML with embedded SVG diagrams
     * @param {Map<string, {name: string, original: string, expression: ASTNode}>} rules - Parsed ABNF rules
     * @param {string} outputFile - Path for output HTML file
     * @param {ConversionOptions} [options={}] - Generation options
     * @returns {Promise<ConversionResult>} Conversion result
     */
    async convertFromAST(rules, outputFile, options = {}) {
        console.log('Rendering SVG diagrams...');
        
        // Transform: Map<name, ParsedRule> → Map<name, EnrichedRule>
        const enrichedRules = new Map();
        
        for (const [name, rule] of rules) {
            try {
                // Generate SVG for this rule
                const svg = this.renderer.renderSVG(rule.expression, name);
                
                // Create enriched rule with all data in one place
                enrichedRules.set(name, {
                    name: rule.name,
                    original: rule.original,
                    expression: rule.expression,
                    svg: svg
                });
            } catch (error) {
                console.error(`Error rendering SVG for rule ${name}:`, error);
                enrichedRules.set(name, {
                    name: rule.name,
                    original: rule.original,
                    expression: rule.expression,
                    svg: `<p>Error rendering diagram for rule: ${name}</p>`
                });
            }
        }
        
        // Generate HTML from enriched rules
        const title = options.title || 'Grammar Syntax Diagrams';
        const html = await this.generator.generateHTMLFromEnrichedRules(enrichedRules, title);
        
        // Write output file
        console.log(`Writing HTML file: ${outputFile}`);
        await this.generator.writeHTML(html, outputFile);
        
        console.log('Conversion completed successfully!');
        return {
            success: true,
            rulesCount: enrichedRules.size,
            outputFile
        };
    }

    /**
     * Convert ABNF file to HTML with embedded SVG diagrams
     * @param {string} inputFile - Path to ABNF file
     * @param {string} outputFile - Path for output HTML file
     * @param {ConversionOptions} [options={}] - Generation options
     * @returns {Promise<ConversionResult>} Conversion result
     */
    async convert(inputFile, outputFile, options = {}) {
        try {
            const rules = await this.parse(inputFile);
            return await this.convertFromAST(rules, outputFile, options);
            
        } catch (error) {
            console.error('Conversion failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * List all rules found in an ABNF file
     * @param {string} inputFile - Path to ABNF file
     * @returns {Promise<string[]>} Array of rule names, or empty array on error
     */
    async listRules(inputFile) {
        try {
            const abnfContent = await fs.readFile(inputFile, 'utf8');
            const rules = this.parser.parse(abnfContent);
            
            console.log(`\nFound ${rules.size} rules in ${inputFile}:`);
            for (const [ruleName, ruleData] of rules) {
                console.log(`  ${ruleName} := ${ruleData.original}`);
            }
            
            return Array.from(rules.keys());
            
        } catch (error) {
            console.error('Failed to list rules:', error.message);
            return [];
        }
    }
}

module.exports = ABNFToRailroad;