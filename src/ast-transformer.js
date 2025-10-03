const {
    TerminalElement,
    NonterminalElement,
    SequenceElement,
    StackElement,
    BypassElement,
    LoopElement
} = require('./elements');

/**
 * Transforms Parser AST nodes into Visual Expression trees
 */
class ASTTransformer {
    /**
     * Create a new AST transformer
     */
    constructor() {
        // Pure structural transformer - no rendering configuration needed
    }

    /**
     * Transform a parser AST element into a Visual Expression tree
     * @param {Object} element - Parser AST element
     * @returns {Expression} Visual Expression tree ready for rendering
     */
    transform(element) {
        if (!element || !element.type) {
            throw new Error('Invalid element: missing type property');
        }

        switch (element.type) {
            case 'terminal':
                if (!element.text) throw new Error('Terminal element missing text');
                return new TerminalElement(element.text);

            case 'nonterminal':
                if (!element.text) throw new Error('Nonterminal element missing text');
                return new NonterminalElement(element.text);

            case 'sequence':
                if (!element.elements || element.elements.length === 0) {
                    throw new Error('Sequence element missing elements array');
                }
                const sequenceChildren = element.elements.map(child => this.transform(child));
                return new SequenceElement(sequenceChildren);



            case 'alternation':
                if (!element.elements || element.elements.length === 0) {
                    throw new Error('Alternation element missing elements array');
                }
                const alternationChildren = element.elements.map(child => this.transform(child));
                return new StackElement(alternationChildren);

            case 'optional':
                if (!element.elements || element.elements.length !== 1) {
                    throw new Error('Optional element missing single child element');
                }
                const optionalChild = this.transform(element.elements[0]);
                return new BypassElement(optionalChild);

            case 'repetition':
                // Handle all repetition patterns (e.g., *X, 1*X, 4X, etc.)
                return this._transformRepetition(element);

            default:
                throw new Error(`Unknown element type: ${element.type}`);
        }
    }

    /**
     * Transform repetition elements into appropriate visual expressions
     * @param {Object} element - Repetition AST element with min/max counts
     * @returns {Expression} Visual expression representing the repetition
     * @private
     */
    _transformRepetition(element) {
        const { min, max, elements } = element;
        
        if (!elements || elements.length !== 1) {
            throw new Error('Repetition element missing single child element');
        }

        const child = this.transform(elements[0]);

        // Handle different repetition patterns
        if (min === 0 && max === null) {
            // *element - zero or more (bypass allows zero, loop handles more)
            return new BypassElement(new LoopElement(child));
        } else if (min === 1 && max === null) {
            // 1*element - one or more (loop alone requires at least one)
            return new LoopElement(child);
        } else if (min > 1 && max === null) {
            // n*element - n or more (n required + zero or more additional)
            const requiredElements = Array(min - 1).fill(null).map(() => child);
            return new SequenceElement([...requiredElements, new LoopElement(child)]);
        } else if (min === 0 && max === 1) {
            // *1element - optional (zero or one)
            return new BypassElement(child);
        } else if (min === max && min > 1) {
            // nElement - exact count (e.g., 8HEXDIG)
            // Create a sequence of n identical elements
            const repeatedElements = Array(min).fill(null).map(() => child);
            return new SequenceElement(repeatedElements);
        } else if (min === 1 && max === 1) {
            // 1element - exactly one (no change needed)
            return child;
        } else if (min === 0 && max === 0) {
            // 0element - zero exactly (empty sequence)
            return new SequenceElement([]);
        } else if (min === 0 && max > 0) {
            // 0*n - zero to n (bypass + loop, treating upper bound as unlimited for now)
            return new BypassElement(new LoopElement(child));
        } else if (min > 0 && max > min) {
            // n*m - n to m range (n required + additional loop, treating upper bound as unlimited for now) 
            if (min === 1) {
                // 1*m - one or more (loop alone requires at least one)
                return new LoopElement(child);
            } else {
                // n*m where n > 1 - n required + zero or more additional
                const requiredElements = Array(min - 1).fill(null).map(() => child);
                return new SequenceElement([...requiredElements, new LoopElement(child)]);
            }
        } else {
            // For other patterns, create a more complex structure
            // This could be enhanced further based on specific needs
            console.warn(`Unhandled repetition pattern: ${min}-${max}, treating as loop`);
            return new LoopElement(child);
        }
    }
}

module.exports = ASTTransformer;