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
                return new TerminalElement(
                    element.text,
                    element.quoted || false
                );

            case 'nonterminal':
                if (!element.text) throw new Error('Nonterminal element missing text');
                return new NonterminalElement(element.text);

            case 'sequence':
                if (!element.elements || element.elements.length === 0) {
                    throw new Error('Sequence element missing elements array');
                }
                const sequenceChildren = element.elements.map(child => this.transform(child));
                return new SequenceElement(sequenceChildren);

            case 'stack':
                if (!element.elements || element.elements.length === 0) {
                    throw new Error('Stack element missing elements array');
                }
                const stackChildren = element.elements.map(child => this.transform(child));
                return new StackElement(stackChildren);

            case 'bypass':
                if (!element.element) throw new Error('Bypass element missing child element');
                const bypassChild = this.transform(element.element);
                return new BypassElement(bypassChild);

            case 'loop':
                if (!element.element) throw new Error('Loop element missing child element');
                const loopChild = this.transform(element.element);
                return new LoopElement(loopChild);

            case 'repetition':
                // Handle exact count repetition (e.g., 8HEXDIG, 4HEXDIG)
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
        const { min, max, element: childElement } = element;
        
        if (!childElement) {
            throw new Error('Repetition element missing child element');
        }

        const child = this.transform(childElement);

        // Handle different repetition patterns
        if (min === 0 && max === null) {
            // *element - zero or more
            return new LoopElement(child);
        } else if (min === 1 && max === null) {
            // 1*element - one or more  
            return new SequenceElement([child, new LoopElement(child)]);
        } else if (min === 0 && max === 1) {
            // [element] - optional
            return new BypassElement(child);
        } else if (min === max && min > 1) {
            // nElement - exact count (e.g., 8HEXDIG)
            // Create a sequence of n identical elements
            const repeatedElements = Array(min).fill(null).map(() => child);
            return new SequenceElement(repeatedElements);
        } else if (min === 1 && max === 1) {
            // 1element - exactly one (no change needed)
            return child;
        } else {
            // For other patterns (min-max ranges), create a more complex structure
            // This could be enhanced further based on specific needs
            console.warn(`Unhandled repetition pattern: ${min}-${max}, treating as loop`);
            return new LoopElement(child);
        }
    }
}

module.exports = ASTTransformer;