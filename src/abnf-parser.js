/**
 * ABNF Parser
 * 
 * Parses ABNF (Augmented Backus-Naur Form) grammar files and converts them
 * to JavaScript function calls that can generate railroad diagrams.
 * 
 * ABNF format reference: RFC 5234
 */

/**
 * @typedef {Object} DiagramElement
 * @property {string} type - Element type ('textBox', 'sequence', 'stack', 'bypass', 'loop')
 * @property {string} [text] - Text content (for textBox)
 * @property {string} [boxType] - Box type ('terminal' or 'nonterminal')
 * @property {DiagramElement[]} [elements] - Child elements (for containers)
 * @property {DiagramElement} [element] - Single child element (for wrappers)
 */

/**
 * @typedef {Object} ParsedRule
 * @property {string} original - Original ABNF rule definition
 * @property {DiagramElement} railroad - Generated railroad diagram element tree
 */

/**
 * Parser for ABNF grammar files
 */
class ABNFParser {
    /**
     * Create a new ABNF parser
     */
    constructor() {
        /** @type {Map<string, ParsedRule>} Map of rule names to parsed rule data */
        this.rules = new Map();
    }

    /**
     * Parse an ABNF file content and extract rules
     * @param {string} abnfContent - The ABNF file content
     * @returns {Map<string, ParsedRule>} Parsed rules with original ABNF and DiagramElement tree
     */
    parse(abnfContent) {
        const lines = abnfContent.split('\n');
        let currentRule = null;
        let currentDefinition = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines and comments
            if (!line || line.startsWith(';')) {
                continue;
            }

            // Check if this is a rule definition (contains := or =)
            const ruleMatch = line.match(/^([a-zA-Z][a-zA-Z0-9-]*)\s*:?=\s*(.*)$/);
            
            if (ruleMatch) {
                // Save previous rule if exists
                if (currentRule) {
                    this.rules.set(currentRule, this.parseDefinition(currentDefinition.trim()));
                }
                
                // Start new rule
                currentRule = ruleMatch[1];
                currentDefinition = ruleMatch[2];
            } else if (currentRule) {
                // Continuation of current rule
                currentDefinition += ' ' + line;
            }
        }

        // Don't forget the last rule
        if (currentRule) {
            this.rules.set(currentRule, this.parseDefinition(currentDefinition.trim()));
        }

        return this.rules;
    }

    /**
     * Parse a single rule definition and convert to railroad diagram calls
     * @param {string} definition - The ABNF rule definition
     * @returns {ParsedRule} Rule object with original definition and railroad calls
     */
    parseDefinition(definition) {
        const result = {
            original: definition,
            railroad: this.convertToRailroad(definition)
        };
        return result;
    }

    /**
     * Convert ABNF definition to DiagramElement object
     * @param {string} definition - ABNF rule definition
     * @returns {DiagramElement} DiagramElement object representing the rule
     */
    convertToRailroad(definition) {
        // Remove leading/trailing whitespace
        definition = definition.trim();

        // Handle alternation (/)
        if (definition.includes('/')) {
            const alternatives = this.splitAlternatives(definition);
            if (alternatives.length > 1) {
                const railroadAlts = alternatives.map(alt => this.convertToRailroad(alt.trim()));
                return { type: 'stack', elements: railroadAlts };
            }
        }

        // Handle sequences (space-separated elements)
        const elements = this.parseSequence(definition);
        if (elements.length > 1) {
            const railroadElements = elements.map(el => this.convertElement(el));
            return { type: 'sequence', elements: railroadElements };
        } else if (elements.length === 1) {
            return this.convertElement(elements[0]);
        }

        return this.convertElement(definition);
    }

    /**
     * Split definition by alternatives, respecting parentheses and quotes
     * @param {string} definition - ABNF definition with alternatives
     * @returns {string[]} Array of alternative definitions
     */
    splitAlternatives(definition) {
        const alternatives = [];
        let current = '';
        let parenDepth = 0;
        let inQuotes = false;
        let quoteChar = null;

        for (let i = 0; i < definition.length; i++) {
            const char = definition[i];
            const prevChar = i > 0 ? definition[i-1] : null;

            if (!inQuotes && (char === '"' || char === "'")) {
                inQuotes = true;
                quoteChar = char;
            } else if (inQuotes && char === quoteChar && prevChar !== '\\') {
                inQuotes = false;
                quoteChar = null;
            } else if (!inQuotes) {
                if (char === '(') {
                    parenDepth++;
                } else if (char === ')') {
                    parenDepth--;
                } else if (char === '/' && parenDepth === 0) {
                    alternatives.push(current.trim());
                    current = '';
                    continue;
                }
            }
            current += char;
        }
        
        if (current.trim()) {
            alternatives.push(current.trim());
        }
        
        return alternatives;
    }

    /**
     * Parse a sequence of elements, respecting parentheses and quotes
     * @param {string} definition - ABNF definition to parse into sequence
     * @returns {string[]} Array of sequence elements
     */
    parseSequence(definition) {
        const elements = [];
        let current = '';
        let parenDepth = 0;
        let inQuotes = false;
        let quoteChar = null;

        for (let i = 0; i < definition.length; i++) {
            const char = definition[i];
            const prevChar = i > 0 ? definition[i-1] : null;

            if (!inQuotes && (char === '"' || char === "'")) {
                inQuotes = true;
                quoteChar = char;
                current += char;
            } else if (inQuotes && char === quoteChar && prevChar !== '\\') {
                inQuotes = false;
                quoteChar = null;
                current += char;
            } else if (!inQuotes) {
                if (char === '(') {
                    parenDepth++;
                    current += char;
                } else if (char === ')') {
                    parenDepth--;
                    current += char;
                } else if (char === ' ' && parenDepth === 0 && current.trim()) {
                    elements.push(current.trim());
                    current = '';
                    // Skip multiple spaces
                    while (i + 1 < definition.length && definition[i + 1] === ' ') {
                        i++;
                    }
                    continue;
                } else {
                    current += char;
                }
            } else {
                current += char;
            }
        }
        
        if (current.trim()) {
            elements.push(current.trim());
        }
        
        return elements;
    }

    /**
     * Convert a single ABNF element to DiagramElement object
     * @param {string} element - ABNF element (terminal, non-terminal, or special construct)
     * @returns {DiagramElement} DiagramElement object representing the element
     */
    convertElement(element) {
        element = element.trim();

        // Handle optional elements [element]
        if (element.startsWith('[') && element.endsWith(']')) {
            const inner = element.slice(1, -1);
            return { type: 'bypass', element: this.convertToRailroad(inner) };
        }

        // Handle grouped elements (element)
        if (element.startsWith('(') && element.endsWith(')')) {
            const inner = element.slice(1, -1);
            return this.convertToRailroad(inner);
        }

        // Handle repetition *element or 1*element or n*m element
        const repMatch = element.match(/^(\d*)\*(\d*)(.+)$/);
        if (repMatch) {
            const min = repMatch[1] ? parseInt(repMatch[1]) : 0;
            const max = repMatch[2] ? parseInt(repMatch[2]) : null;
            const innerElement = repMatch[3].trim();
            
            if (min === 0) {
                // Zero or more repetitions - use loop
                return { type: 'loop', element: this.convertElement(innerElement) };
            } else if (min === 1 && !max) {
                // One or more repetitions - sequence with loop
                const baseElement = this.convertElement(innerElement);
                const loopElement = { type: 'loop', element: this.convertElement(innerElement) };
                return { type: 'sequence', elements: [baseElement, loopElement] };
            } else {
                // Specific repetition range - just treat as element for now
                return this.convertElement(innerElement);
            }
        }

        // Handle terminal strings "literal" or 'literal'
        if ((element.startsWith('"') && element.endsWith('"')) || 
            (element.startsWith("'") && element.endsWith("'"))) {
            const text = element.slice(1, -1); // Remove quotes
            return { type: 'textBox', text: text, boxType: 'terminal' };
        }

        // Handle rule references (non-terminals)
        if (element.match(/^[a-zA-Z][a-zA-Z0-9-]*$/)) {
            return { type: 'textBox', text: element, boxType: 'nonterminal' };
        }

        // Handle special cases like %x20 (hex values) - treat as terminals
        if (element.match(/^%[xd]/)) {
            return { type: 'textBox', text: element, boxType: 'terminal' };
        }

        // Default case - treat as non-terminal
        return { type: 'textBox', text: element, boxType: 'nonterminal' };
    }

    /**
     * Get all parsed rules
     * @returns {Map<string, ParsedRule>} All parsed rules with original ABNF and DiagramElement tree
     */
    getRules() {
        return this.rules;
    }
}

module.exports = ABNFParser;