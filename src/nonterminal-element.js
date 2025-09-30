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
}

module.exports = NonterminalElement;