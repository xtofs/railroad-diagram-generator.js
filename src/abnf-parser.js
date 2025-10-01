/**
 * ABNF Parser with Tokenizer
 * 
 * parses ABNF (Augmented Backus-Naur Form) grammar files and converts them
 * to Expression trees that can generate railroad diagrams.
 * 
 * ABNF format reference: RFC 5234
 */

/**
 * Custom error class for ABNF parsing errors with position information
 */
class ABNFParseError extends Error {
    /**
     * Create a new ABNF parse error
     * @param {string} message - Error message
     * @param {number} [line] - Line number (1-based)
     * @param {number} [column] - Column number (1-based)
     * @param {Token} [token] - Token that caused the error
     */
    constructor(message, line = null, column = null, token = null) {
        let fullMessage = message;
        if (line !== null && column !== null) {
            fullMessage = `${message} at line ${line}, column ${column}`;
        }
        if (token) {
            fullMessage += ` (token: ${token.type} '${token.value}')`;
        }
        
        super(fullMessage);
        this.name = 'ABNFParseError';
        this.line = line;
        this.column = column;
        this.token = token;
    }
}

/**
 * @typedef {Object} Position
 * @property {number} line - Line number (1-based)
 * @property {number} column - Column number (1-based)
 */

/**
 * @typedef {Object} ASTNode
 * @property {string} type - Node type ('terminal', 'nonterminal', 'sequence', 'stack', 'bypass', 'loop')
 * @property {string} [text] - Text content - for terminals: literal ABNF syntax; for nonterminals: rule name
 * @property {ASTNode[]} [elements] - Child nodes (always array, even for single child)
 * @property {Position} [position] - Source position information
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
 * @property {number} line - Line number (1-based)
 * @property {number} column - Column number (1-based)
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
            '(?<string>(?:%[si])?"[^"]*")',
            "(?<sstring>(?:%[si])?'[^']*')",
            // Hex/decimal values per RFC 5234: concatenation OR range, not mixed
            '(?<hexval>%x[0-9A-Fa-f]+(?:(?:\\.[0-9A-Fa-f]+)+|(?:-[0-9A-Fa-f]+))?)',
            '(?<decval>%d[0-9]+(?:(?:\\.[0-9]+)+|(?:-[0-9]+))?)',
            // Repetition counts (must come before standalone *)
            '(?<repetition>[0-9]+\\*[0-9]*|[0-9]*\\*[0-9]+)',
            // Standalone asterisk for zero-or-more
            '(?<asterisk>\\*)',
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
        let line = 1;
        let column = 1;

        this.tokenRegex.lastIndex = 0; // Reset regex state

        while ((match = this.tokenRegex.exec(input)) !== null) {
            // Check for gaps in tokenization
            if (match.index !== lastIndex) {
                const gap = input.slice(lastIndex, match.index);
                if (gap.trim()) {
                    throw new Error(`Unexpected character(s) at line ${line}, column ${column}: '${gap}'`);
                }
                // Update line/column for the gap
                const gapUpdate = this._updatePosition(gap, line, column);
                line = gapUpdate.line;
                column = gapUpdate.column;
            }

            // Store current position for this token
            const tokenLine = line;
            const tokenColumn = column;

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

            // Skip whitespace and comments, but still track position
            if (tokenType !== 'whitespace' && tokenType !== 'comment') {
                tokens.push({
                    type: tokenType,
                    value: tokenValue,
                    line: tokenLine,
                    column: tokenColumn
                });
            }

            // Update position based on the matched token
            const positionUpdate = this._updatePosition(tokenValue, line, column);
            line = positionUpdate.line;
            column = positionUpdate.column;

            lastIndex = match.index + match[0].length;
        }

        // Check if we consumed all input
        if (lastIndex < input.length) {
            const remaining = input.slice(lastIndex);
            if (remaining.trim()) {
                throw new Error(`Unexpected character(s) at line ${line}, column ${column}: '${remaining}'`);
            }
        }

        return tokens;
    }

    /**
     * Update line and column position based on a string segment
     * @param {string} text - Text segment to process
     * @param {number} currentLine - Current line number
     * @param {number} currentColumn - Current column number
     * @returns {{line: number, column: number}} Updated position
     * @private
     */
    _updatePosition(text, currentLine, currentColumn) {
        let line = currentLine;
        let column = currentColumn;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '\n') {
                line++;
                column = 1;
            } else if (char === '\r') {
                // Handle \r\n and \r line endings
                if (i + 1 < text.length && text[i + 1] === '\n') {
                    // \r\n - skip the \r, \n will be handled next iteration
                    continue;
                } else {
                    // \r alone
                    line++;
                    column = 1;
                }
            } else {
                column++;
            }
        }
        
        return { line, column };
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
        // Tokenize the entire file once, preserving all context
        const tokens = this.tokenizer.tokenize(abnfContent);
        
        // Parse the token stream to identify rules
        return this._parseTokenStream(tokens, abnfContent);
    }

    /**
     * Parse a token stream to extract rules using lookahead
     * @param {Token[]} tokens - Array of all tokens from the file
     * @param {string} originalContent - Original file content for error context
     * @returns {Map<string, ParsedRule>} Parsed rules with original ABNF and AST
     * @private
     */
    _parseTokenStream(tokens, originalContent) {
        const rules = new Map();
        let index = 0;

        while (index < tokens.length) {
            const token = tokens[index];
            
            // Look for rule definitions: identifier followed by assignment
            if (token.type === 'identifier' && 
                index + 1 < tokens.length && 
                tokens[index + 1].type === 'assign') {
                
                const ruleName = token.value;
                const ruleStartLine = token.line;
                const ruleStartColumn = token.column;
                
                // Skip the identifier and assignment tokens
                index += 2; // Skip identifier and '=' or ':='
                
                // Find the end of this rule (next rule definition or end of file)
                const ruleTokens = this._extractRuleTokens(tokens, index);
                index = ruleTokens.nextIndex;
                
                try {
                    // Parse the rule expression from its tokens
                    const expression = this._parseTokenSequence(ruleTokens.tokens);
                    
                    // Add debug string functionality to the parsed expression
                    addDebugStringToElement(expression);
                    
                    // Reconstruct original rule text for debugging/display
                    const originalRule = this._reconstructRuleText(originalContent, ruleStartLine, ruleTokens.tokens);
                    
                    rules.set(ruleName, {
                        name: ruleName,
                        original: originalRule,
                        expression: expression
                    });
                    
                } catch (error) {
                    // Re-throw with rule context
                    if (error instanceof ABNFParseError) {
                        throw error; // Already has position info
                    } else {
                        throw new ABNFParseError(`Error in rule '${ruleName}': ${error.message}`, ruleStartLine, ruleStartColumn);
                    }
                }
            } else {
                // Skip non-rule tokens (comments, whitespace, etc.)
                index++;
            }
        }

        return rules;
    }

    /**
     * Extract tokens belonging to a single rule definition
     * @param {Token[]} tokens - All tokens
     * @param {number} startIndex - Index after the assignment operator
     * @returns {{tokens: Token[], nextIndex: number}} Rule tokens and next index
     * @private
     */
    _extractRuleTokens(tokens, startIndex) {
        const ruleTokens = [];
        let index = startIndex;
        
        while (index < tokens.length) {
            const token = tokens[index];
            
            // Check if this is the start of a new rule (identifier followed by assignment)
            if (token.type === 'identifier' && 
                index + 1 < tokens.length && 
                tokens[index + 1].type === 'assign') {
                // Found next rule definition, stop here
                break;
            }
            
            ruleTokens.push(token);
            index++;
        }
        
        return { tokens: ruleTokens, nextIndex: index };
    }

    /**
     * Reconstruct original rule text from line information
     * @param {string} originalContent - Original file content
     * @param {number} startLine - Starting line of the rule
     * @param {Token[]} ruleTokens - Tokens belonging to this rule
     * @returns {string} Reconstructed rule text
     * @private
     */
    _reconstructRuleText(originalContent, startLine, ruleTokens) {
        if (ruleTokens.length === 0) return '';
        
        const lines = originalContent.split('\n');
        const endLine = ruleTokens[ruleTokens.length - 1].line;
        
        // Extract lines from startLine to endLine
        const ruleLines = [];
        for (let i = startLine - 1; i < endLine && i < lines.length; i++) {
            ruleLines.push(lines[i]);
        }
        
        // Extract just the rule definition part (after the =)
        if (ruleLines.length > 0) {
            const firstLine = ruleLines[0];
            const assignmentIndex = firstLine.indexOf('=');
            if (assignmentIndex !== -1) {
                ruleLines[0] = firstLine.substring(assignmentIndex + 1).trim();
            }
        }
        
        return ruleLines.join('\n').trim();
    }

    /**
     * Parse a sequence of tokens into an AST expression
     * @param {Token[]} tokens - Tokens for this rule's expression
     * @returns {ASTNode} AST node representing the rule
     * @private
     */
    _parseTokenSequence(tokens) {
        if (tokens.length === 0) {
            throw new ABNFParseError('Empty rule definition');
        }
        
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
        const startToken = tokens[index];
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
                element: { 
                    type: 'stack', 
                    elements: alternatives,
                    position: startToken ? { line: startToken.line, column: startToken.column } : undefined
                },
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
        const startToken = tokens[index];
        
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
                element: { 
                    type: 'sequence', 
                    elements: elements,
                    position: startToken ? { line: startToken.line, column: startToken.column } : undefined
                },
                nextIndex: index
            };
        } else if (elements.length === 1) {
            return { element: elements[0], nextIndex: index };
        } else {
            const token = tokens[index] || null;
            throw new ABNFParseError('Empty expression', token?.line, token?.column, token);
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
        } else if (index < tokens.length && tokens[index].type === 'asterisk') {
            // Standalone * means zero or more
            hasRepetition = true;
            min = 0;
            max = null;
            index++;
        } else if (index < tokens.length && tokens[index].type === 'number') {
            const num = parseInt(tokens[index].value);
            // Check for number followed by * (like "1*")
            if (index + 1 < tokens.length && tokens[index + 1].value === '*') {
                hasRepetition = true;
                min = num;
                index += 2; // Skip number and *
            } else {
                // Check for exact count repetition (like "4HEXDIG")
                hasRepetition = true;
                min = num;
                max = num;
                index++; // Skip just the number
            }
        }

        const result = this._parseElement(tokens, index);
        let element = result.element;
        index = result.nextIndex;

        // Apply repetition only if it was found
        if (hasRepetition) {
            const startToken = tokens[index - 1]; // Get token position before we parsed the element
            const position = startToken ? { line: startToken.line, column: startToken.column } : undefined;
            
            if (min === 0 && max === null) {
                // *element - zero or more
                element = { 
                    type: 'loop', 
                    elements: [element],
                    position: position
                };
            } else if (min === 1 && max === null) {
                // 1*element - one or more
                const baseElement = element;
                const loopElement = { 
                    type: 'loop', 
                    elements: [element],
                    position: position
                };
                element = { 
                    type: 'sequence', 
                    elements: [baseElement, loopElement],
                    position: position
                };
            } else if (min === 0 && max === 1) {
                // *1element or [element] - optional
                element = { 
                    type: 'bypass', 
                    elements: [element],
                    position: position
                };
            } else if (min === max && min > 1) {
                // nElement - exact count (e.g., 8HEXDIG, 4HEXDIG)
                element = {
                    type: 'repetition',
                    min: min,
                    max: max,
                    elements: [element],
                    position: position
                };
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
            throw new ABNFParseError('Unexpected end of input');
        }

        const token = tokens[index];

        switch (token.type) {
            case 'string':
            case 'sstring':
                // Terminal string - preserve literal ABNF syntax
                return {
                    element: { 
                        type: 'terminal', 
                        text: token.value, // Preserve literal ABNF syntax
                        line: token.line,
                        column: token.column
                    },
                    nextIndex: index + 1
                };

            case 'identifier':
                // Non-terminal rule reference
                return {
                    element: { 
                        type: 'nonterminal', 
                        text: token.value,
                        position: { line: token.line, column: token.column }
                    },
                    nextIndex: index + 1
                };

            case 'hexval':
            case 'decval':
                // Hex or decimal values - preserve literal ABNF syntax
                return {
                    element: { 
                        type: 'terminal', 
                        text: token.value, // Preserve literal ABNF syntax
                        line: token.line,
                        column: token.column
                    },
                    nextIndex: index + 1
                };

            case 'lparen':
                // Grouped expression
                const lparenToken = token;
                index++; // Skip '('
                const groupResult = this._parseExpression(tokens, index);
                if (groupResult.nextIndex >= tokens.length || tokens[groupResult.nextIndex].type !== 'rparen') {
                    const currentToken = tokens[groupResult.nextIndex] || null;
                    throw new ABNFParseError('Missing closing parenthesis', lparenToken.line, lparenToken.column, lparenToken);
                }
                return {
                    element: groupResult.element,
                    nextIndex: groupResult.nextIndex + 1 // Skip ')'
                };

            case 'lbracket':
                // Optional element [element]
                const lbracketToken = token;
                index++; // Skip '['
                const optResult = this._parseExpression(tokens, index);
                if (optResult.nextIndex >= tokens.length || tokens[optResult.nextIndex].type !== 'rbracket') {
                    const currentToken = tokens[optResult.nextIndex] || null;
                    throw new ABNFParseError('Missing closing bracket', lbracketToken.line, lbracketToken.column, lbracketToken);
                }
                return {
                    element: { 
                        type: 'bypass', 
                        elements: [optResult.element],
                        position: { line: lbracketToken.line, column: lbracketToken.column }
                    },
                    nextIndex: optResult.nextIndex + 1 // Skip ']'
                };

            default:
                throw new ABNFParseError(`Unexpected token: ${token.type}`, token.line, token.column, token);
        }
    }

}

/**
 * Add debug string functionality to DiagramElement objects
 * @param {ASTNode} element - The DiagramElement to enhance
 * @returns {ASTNode} The same element with added toDebugString method
 */
function addDebugStringToElement(element) {
    if (!element || typeof element !== 'object') {
        return element;
    }

    // Add toDebugString method if it doesn't exist
    if (!element.toDebugString) {
        element.toDebugString = function() {
            switch (this.type) {
                case 'terminal':
                    return `terminal("${this.text}")`;
                    
                case 'nonterminal':
                    return `nonterminal("${this.text}")`;
                    
                case 'sequence':
                    const seqElements = this.elements.map(el => el.toDebugString()).join(', ');
                    return `sequence(${seqElements})`;
                    
                case 'stack':
                    const stackElements = this.elements.map(el => el.toDebugString()).join(', ');
                    return `stack(${stackElements})`;
                    
                case 'bypass':
                    return `bypass(${this.elements[0].toDebugString()})`;
                    
                case 'loop':
                    return `loop(${this.elements[0].toDebugString()})`;
                    
                default:
                    return `unknown(${this.type})`;
            }
        };
    }

    // Recursively add to child elements
    if (element.elements && Array.isArray(element.elements)) {
        element.elements.forEach(child => addDebugStringToElement(child));
    }

    return element;
}

module.exports = ABNFParser;