/**
 * HTML Template Generator
 * 
 * Generates HTML files with embedded SVG railroad diagrams
 * from parsed ABNF rules using Handlebars templates.
 */

const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');

/**
 * @typedef {Object} RuleDisplay
 * @property {string} name - Rule name
 * @property {string} original - Original ABNF definition
 * @property {string} svg - SVG diagram markup
 */

/**
 * HTML generator for railroad diagram documents
 */
class HTMLGenerator {
    /**
     * Create a new HTML generator
     */
    constructor() {
        /** @type {string|null} Cached CSS content */
        this.cssContent = null;
        /** @type {Function|null} Compiled Handlebars template */
        this.template = null;
        /** @type {boolean} Whether assets have been loaded */
        this.assetsLoaded = false;
    }

    /**
     * Load CSS and template assets (called lazily)
     * @returns {Promise<void>}
     */
    async loadAssets() {
        if (this.assetsLoaded) return;

        try {
            const cssPath = path.join(__dirname, '..', 'assets', 'diagram.css');
            this.cssContent = await fs.readFile(cssPath, 'utf8');
        } catch (error) {
            console.error('Error loading CSS assets:', error);
            this.cssContent = '/* CSS could not be loaded */';
        }

        // Compile Handlebars template
        const templatePath = path.join(__dirname, '..', 'assets', 'diagram-template.hbs');
        const templateContent = await fs.readFile(templatePath, 'utf8');
        this.template = Handlebars.compile(templateContent);

        // Register Handlebars helpers
        Handlebars.registerHelper('sanitizeId', function(str) {
            return str.replace(/[^a-zA-Z0-9-_]/g, '_');
        });

        this.assetsLoaded = true;
    }

    /**
     * Generate complete HTML document with embedded SVG diagrams
     * @param {Map<string, {original: string, railroad: string}>} rules - Parsed ABNF rules
     * @param {string} [title='Grammar Syntax Diagrams'] - Document title
     * @param {Map<string, string>} [svgContent=new Map()] - Pre-rendered SVG content for each rule
     * @returns {Promise<string>} Complete HTML document
     */
    async generateHTML(rules, title = 'Grammar Syntax Diagrams', svgContent = new Map()) {
        await this.loadAssets(); // Ensure assets are loaded

        const rulesArray = Array.from(rules.entries()).map(([name, ruleData]) => ({
            name,
            original: ruleData.original,
            svg: svgContent.get(name) || '<p>Diagram could not be generated</p>'
        }));

        return this.template({
            title: this.escapeHtml(title),
            cssContent: this.cssContent,
            rules: rulesArray
        });
    }

    /**
     * Generate HTML from enriched rules (contains SVG already)
     * @param {Map<string, EnrichedRule>} enrichedRules - Rules with embedded SVG content
     * @param {string} [title='Grammar Syntax Diagrams'] - Document title
     * @returns {Promise<string>} Complete HTML document
     */
    async generateHTMLFromEnrichedRules(enrichedRules, title = 'Grammar Syntax Diagrams') {
        await this.loadAssets(); // Ensure assets are loaded

        const rulesArray = Array.from(enrichedRules.values()).map(rule => ({
            name: rule.name,
            original: rule.original,
            svg: rule.svg,
            debugString: rule.debugString
        }));

        return this.template({
            title: this.escapeHtml(title),
            cssContent: this.cssContent,
            rules: rulesArray
        });
    }

    /**
     * Escape HTML special characters for safe output
     * @param {string} str - Input string to escape
     * @returns {string} HTML-escaped string
     */
    escapeHtml(str) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return str.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Write HTML content to file, ensuring directory exists
     * @param {string} html - Complete HTML content to write
     * @param {string} outputPath - Output file path
     * @returns {Promise<void>}
     */
    async writeHTML(html, outputPath) {
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, html, 'utf8');
    }
}

module.exports = HTMLGenerator;