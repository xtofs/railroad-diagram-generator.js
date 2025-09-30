const { TextBoxExpression } = require('./text-box-expression');

/**
 * Nonterminal expression (rule references)
 * @extends TextBoxExpression
 */
class NonterminalExpression extends TextBoxExpression {
    /**
     * Create a nonterminal expression
     * @param {string} text - Text to display in the box
     * @param {number} [fontSize=14] - Font size in pixels
     * @param {string} [fontFamily='monospace'] - Font family
     * @param {number} [gridSize=16] - Grid size in pixels
     */
    constructor(text, fontSize = 14, fontFamily = 'monospace', gridSize = 16) {
        super(text, 'nonterminal', fontSize, fontFamily, gridSize);
    }
}

module.exports = NonterminalExpression;