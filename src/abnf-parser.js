/**
 * ABNF Parser with Tokenizer
 * 
 * parses ABNF (Augmented Backus-Naur Form) grammar files and converts them
 * to Expression trees that can generate railroad diagrams.
 * 
 * ABNF format reference: RFC 5234
 */

/**
 * @typedef {Object} ASTNode
 * @property {string} type - Node type ('textBox', 'sequence', 'stack', 'bypass', 'loop')
 * @property {string} [text] - Text content (for textBox nodes)
 * @property {string} [boxType] - Box type ('terminal' or 'nonterminal')
 * @property {ASTNode[]} [elements] - Child nodes (for container nodes)
 * @property {ASTNode} [element] - Single child node (for wrapper nodes)
 */

/**
 * @typedef {Object} ParsedRule
 * @property {string} name - Rule name (left-hand side of the rule)
 * @property {string} original - Original ABNF rule definition
 * @property {ASTNode} expression - Generated AST representing the parsed rule
 */

/**
 * @typedef {Object} Token
 * @property {string} type - Token type (identifier, string, number, operator, etc.)
 * @property {string} value - Token value/text
 */

/**
 * Tokenizer for ABNF syntax using regex with named groups
 */
class ABNFTokenizer {
    constructor() {
        // Comprehensive regex for ABNF tokens using named groups
        this.tokenRegex = new RegExp([
            // Whitespace (skip)
            '(?<whitespace>\\s+)',
            // Comments (skip)
            '(?<comment>;[^\\r\\n]*)',
            // String literals with optional case sensitivity prefixes
            '(?<string>(?:%[si])?"(?:[^"\\\\]|\\\\.)*")',
            "(?<sstring>(?:%[si])?'(?:[^'\\\\]|\\\\.)*')",
            // Hex/decimal values
            '(?<hexval>%x[0-9A-Fa-f]+(?:-[0-9A-Fa-f]+)?)',
            '(?<decval>%d[0-9]+(?:-[0-9]+)?)',
            // Repetition counts
            '(?<repetition>[0-9]*\\*[0-9]*)',
            // Identifiers (rule names)
            '(?<identifier>[a-zA-Z][a-zA-Z0-9-]*)',
            // Operators and delimiters
            '(?<assign>:?=)',
            '(?<alternation>/)',
            '(?<lparen>\\()',
            '(?<rparen>\\))',
            '(?<lbracket>\\[)',
            '(?<rbracket>\\])',
            // Numbers
            '(?<number>[0-9]+)'
        ].join('|'), 'g');
    }

    /**
     * Tokenize input string into array of tokens
     * @param {string} input - Input string to tokenize
     * @returns {Token[]} Array of tokens
     */
    tokenize(input) {
        const tokens = [];
        let match;
        let lastIndex = 0;

        this.tokenRegex.lastIndex = 0; // Reset regex state

        while ((match = this.tokenRegex.exec(input)) !== null) {
            // Check for gaps in tokenization
            if (match.index !== lastIndex) {
                const gap = input.slice(lastIndex, match.index);
                if (gap.trim()) {
                    throw new Error(`Unexpected character(s) at position ${lastIndex}: '${gap}'`);
                }
            }

            // Find which named group matched
            const groups = match.groups;
            let tokenType = null;
            let tokenValue = match[0];

            for (const [groupName, groupValue] of Object.entries(groups)) {
                if (groupValue !== undefined) {
                    tokenType = groupName;
                    break;
                }
            }

            // Skip whitespace and comments
            if (tokenType !== 'whitespace' && tokenType !== 'comment') {
                tokens.push({
                    type: tokenType,
                    value: tokenValue
                });
            }

            lastIndex = match.index + match[0].length;
        }

        // Check if we consumed all input
        if (lastIndex < input.length) {
            const remaining = input.slice(lastIndex);
            if (remaining.trim()) {
                throw new Error(`Unexpected character(s) at position ${lastIndex}: '${remaining}'`);
            }
        }

        return tokens;
    }
}

/**
 * Parser for ABNF grammar files with separate tokenization phase
 */
class ABNFParser {
    /**
     * Create a new ABNF parser
     */
    constructor() {
        /** @type {ABNFTokenizer} Tokenizer instance */
        this.tokenizer = new ABNFTokenizer();
    }

    /**
     * Parse an ABNF file content and extract rules
     * @param {string} abnfContent - The ABNF file content
     * @returns {Map<string, ParsedRule>} Parsed rules with original ABNF and AST
     */
    parse(abnfContent) {
        const rules = new Map();
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
                    rules.set(currentRule, this._parseDefinition(currentRule, currentDefinition.trim()));
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
            rules.set(currentRule, this._parseDefinition(currentRule, currentDefinition.trim()));
        }

        return rules;
    }

    /**
     * Parse a single rule definition using tokenizer and convert to AST
     * @param {string} name - The rule name
     * @param {string} definition - The ABNF rule definition
     * @returns {ParsedRule} Rule object with name, original definition and AST
     * @private
     */
    _parseDefinition(name, definition) {
        const result = {
            name: name,
            original: definition,
            expression: this._parseTokenizedDefinition(definition)
        };
        return result;
    }

    /**
     * Parse definition using tokenizer approach
     * @param {string} definition - ABNF rule definition
     * @returns {ASTNode} AST node representing the rule
     * @private
     */
    _parseTokenizedDefinition(definition) {
        const tokens = this.tokenizer.tokenize(definition);
        return this._parseExpression(tokens, 0).element;
    }

    /**
     * Parse expression from tokens starting at given index
     * @param {Token[]} tokens - Array of tokens
     * @param {number} index - Starting index
     * @returns {{element: ASTNode, nextIndex: number}} Parsed AST node and next index
     * @private
     */
    _parseExpression(tokens, index) {
        return this._parseAlternation(tokens, index);
    }

    /**
     * Parse alternation (lowest precedence)
     * @param {Token[]} tokens - Array of tokens
     * @param {number} index - Starting index
     * @returns {{element: ASTNode, nextIndex: number}} Parsed AST node and next index
     * @private
     */
    _parseAlternation(tokens, index) {
        let result = this._parseConcatenation(tokens, index);
        const alternatives = [result.element];
        index = result.nextIndex;

        while (index < tokens.length && tokens[index].type === 'alternation') {
            index++; // Skip '/'
            result = this._parseConcatenation(tokens, index);
            alternatives.push(result.element);
            index = result.nextIndex;
        }

        if (alternatives.length > 1) {
            return {
                element: { type: 'stack', elements: alternatives },
                nextIndex: index
            };
        } else {
            return { element: alternatives[0], nextIndex: index };
        }
    }

    /**
     * Parse concatenation (sequence)
     * @param {Token[]} tokens - Array of tokens
     * @param {number} index - Starting index
     * @returns {{element: ASTNode, nextIndex: number}} Parsed AST node and next index
     * @private
     */
    _parseConcatenation(tokens, index) {
        const elements = [];
        
        while (index < tokens.length) {
            // Stop at alternation or closing brackets/parens
            const token = tokens[index];
            if (token.type === 'alternation' || token.type === 'rparen' || token.type === 'rbracket') {
                break;
            }

            const result = this._parseRepetition(tokens, index);
            elements.push(result.element);
            index = result.nextIndex;
        }

        if (elements.length > 1) {
            return {
                element: { type: 'sequence', elements: elements },
                nextIndex: index
            };
        } else if (elements.length === 1) {
            return { element: elements[0], nextIndex: index };
        } else {
            throw new Error('Empty expression');
        }
    }

    /**
     * Parse repetition
     * @param {Token[]} tokens - Array of tokens
     * @param {number} index - Starting index
     * @returns {{element: ASTNode, nextIndex: number}} Parsed AST node and next index
     * @private
     */
    _parseRepetition(tokens, index) {
        let min = null;
        let max = null;
        let hasRepetition = false;

        // Check for repetition prefix
        if (index < tokens.length && tokens[index].type === 'repetition') {
            hasRepetition = true;
            const repToken = tokens[index].value;
            const repMatch = repToken.match(/^(\d*)\*(\d*)$/);
            if (repMatch) {
                min = repMatch[1] ? parseInt(repMatch[1]) : 0;
                max = repMatch[2] ? parseInt(repMatch[2]) : null;
            }
            index++;
        } else if (index < tokens.length && tokens[index].type === 'number') {
            // Check for number followed by *
            if (index + 1 < tokens.length && tokens[index + 1].value === '*') {
                hasRepetition = true;
                min = parseInt(tokens[index].value);
                index += 2; // Skip number and *
            }
        }

        const result = this._parseElement(tokens, index);
        let element = result.element;
        index = result.nextIndex;

        // Apply repetition only if it was found
        if (hasRepetition) {
            if (min === 0 && max === null) {
                // *element - zero or more
                element = { type: 'loop', element: element };
            } else if (min === 1 && max === null) {
                // 1*element - one or more
                const baseElement = element;
                const loopElement = { type: 'loop', element: element };
                element = { type: 'sequence', elements: [baseElement, loopElement] };
            } else if (min === 0 && max === 1) {
                // *1element or [element] - optional
                element = { type: 'bypass', element: element };
            }
        }

        return { element: element, nextIndex: index };
    }

    /**
     * Parse basic element (terminal, non-terminal, grouped expression)
     * @param {Token[]} tokens - Array of tokens
     * @param {number} index - Starting index
     * @returns {{element: ASTNode, nextIndex: number}} Parsed AST node and next index
     * @private
     */
    _parseElement(tokens, index) {
        if (index >= tokens.length) {
            throw new Error('Unexpected end of input');
        }

        const token = tokens[index];

        switch (token.type) {
            case 'string':
            case 'sstring':
                // Terminal string - handle prefixes and remove quotes
                let text = token.value;
                let isCaseSensitive = true; // Default for plain strings
                
                // Check for case sensitivity prefixes
                if (text.startsWith('%s')) {
                    isCaseSensitive = true;
                    text = text.slice(2); // Remove %s prefix
                } else if (text.startsWith('%i')) {
                    isCaseSensitive = false;
                    text = text.slice(2); // Remove %i prefix
                }
                
                // Remove quotes
                text = text.slice(1, -1);
                
                return {
                    element: { type: 'textBox', text: text, boxType: 'terminal' },
                    nextIndex: index + 1
                };

            case 'identifier':
                // Non-terminal rule reference
                return {
                    element: { type: 'textBox', text: token.value, boxType: 'nonterminal' },
                    nextIndex: index + 1
                };

            case 'hexval':
            case 'decval':
                // Hex or decimal values - treat as terminals
                return {
                    element: { type: 'textBox', text: token.value, boxType: 'terminal' },
                    nextIndex: index + 1
                };

            case 'lparen':
                // Grouped expression
                index++; // Skip '('
                const groupResult = this._parseExpression(tokens, index);
                if (groupResult.nextIndex >= tokens.length || tokens[groupResult.nextIndex].type !== 'rparen') {
                    throw new Error('Missing closing parenthesis');
                }
                return {
                    element: groupResult.element,
                    nextIndex: groupResult.nextIndex + 1 // Skip ')'
                };

            case 'lbracket':
                // Optional element [element]
                index++; // Skip '['
                const optResult = this._parseExpression(tokens, index);
                if (optResult.nextIndex >= tokens.length || tokens[optResult.nextIndex].type !== 'rbracket') {
                    throw new Error('Missing closing bracket');
                }
                return {
                    element: { type: 'bypass', element: optResult.element },
                    nextIndex: optResult.nextIndex + 1 // Skip ']'
                };

            default:
                throw new Error(`Unexpected token: ${token.type} '${token.value}'`);
        }
    }

}

module.exports = ABNFParser;