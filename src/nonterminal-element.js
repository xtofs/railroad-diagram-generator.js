const { TextBoxElement } = require('./text-box-element');

/**
 * Nonterminal element (rule references)
 * @extends TextBoxElement
 */
class NonterminalElement extends TextBoxElement {
    /**
     * Create a nonterminal expression
     * @param {string} text - Text to display in the box
     */
    constructor(text) {
        super(text, 'nonterminal', false);
    }

    /**
     * Convert to debug string representation
     * @returns {string} Debug string like 'nonterminal("X")'
     */
    toString() {
        return `nonterminal(${JSON.stringify(this.text)})`;
    }
}

module.exports = NonterminalElement;