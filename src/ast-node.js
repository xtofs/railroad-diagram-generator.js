/**
 * Base class for all ABNF semantic AST nodes
 * These represent the parsed ABNF grammar structure before transformation to layout elements
 */
class ASTNode {
    /**
     * @param {string} type - The type of AST node
     */
    constructor(type) {
        this.type = type;
    }

    /**
     * Convert AST node to debug string representation
     * Must be implemented by subclasses
     * @abstract
     * @returns {string} Debug string representation
     */
    toString() {
        throw new Error('toString must be implemented by subclasses');
    }
}

/**
 * Terminal AST node - represents a literal string or character class
 */
class TerminalNode extends ASTNode {
    /**
     * @param {string} text - The terminal text
     */
    constructor(text) {
        super('terminal');
        this.text = text;
    }

    toString() {
        return `{Terminal text=${this.text}}`;
    }
}

/**
 * Nonterminal AST node - represents a reference to another rule
 */
class NonterminalNode extends ASTNode {
    /**
     * @param {string} text - The nonterminal name
     */
    constructor(text) {
        super('nonterminal');
        this.text = text;
    }

    toString() {
        return `{Nonterminal text=${this.text}}`;
    }
}

/**
 * Sequence AST node - represents a sequence of elements (concatenation)
 */
class SequenceNode extends ASTNode {
    /**
     * @param {ASTNode[]} elements - Array of AST nodes in sequence
     */
    constructor(elements) {
        super('sequence');
        this.elements = elements;
    }

    toString() {
        const elementsStr = this.elements.map(el => el.toString()).join(' ');
        return `{Sequence ${elementsStr}}`;
    }
}

/**
 * Alternation AST node - represents alternatives (choice)
 */
class AlternationNode extends ASTNode {
    /**
     * @param {ASTNode[]} elements - Array of alternative AST nodes
     */
    constructor(elements) {
        super('alternation');
        this.elements = elements;
    }

    toString() {
        const elementsStr = this.elements.map(el => el.toString()).join(' ');
        return `{Alternation ${elementsStr}}`;
    }
}

/**
 * Optional AST node - represents an optional element
 */
class OptionalNode extends ASTNode {
    /**
     * @param {ASTNode} element - The optional AST node
     */
    constructor(element) {
        super('optional');
        this.elements = [element]; // Keep elements array for consistency with transformer
    }

    toString() {
        return `{Optional ${this.elements[0].toString()}}`;
    }
}

/**
 * Repetition AST node - represents repetition patterns (*, +, n*m, etc.)
 */
class RepetitionNode extends ASTNode {
    /**
     * @param {number} min - Minimum repetitions
     * @param {number|null} max - Maximum repetitions (null for unbounded)
     * @param {ASTNode} element - The repeated AST node
     */
    constructor(min, max, element) {
        super('repetition');
        this.min = min;
        this.max = max;
        this.elements = [element]; // Keep elements array for consistency with transformer
    }

    toString() {
        const child = this.elements[0].toString();
        const maxStr = this.max === null ? '*' : this.max;
        return `{Repetition min=${this.min} max=${maxStr} ${child}}`;
    }
}

module.exports = {
    ASTNode,
    TerminalNode,
    NonterminalNode,
    SequenceNode,
    AlternationNode,
    OptionalNode,
    RepetitionNode
};