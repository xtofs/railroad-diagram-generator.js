const { TextBoxExpression } = require('./text-box-expression');

/**
 * Terminal expression (quoted literals, hex values, etc.)
 * @extends TextBoxExpression
 */
class TerminalExpression extends TextBoxExpression {
    /**
     * Create a terminal expression
     * @param {string} text - Text to display in the box
     * @param {number} [fontSize=14] - Font size in pixels
     * @param {string} [fontFamily='monospace'] - Font family
     * @param {number} [gridSize=16] - Grid size in pixels
     * @param {boolean} [quoted=false] - Whether terminal was originally quoted
     */
    constructor(text, fontSize = 14, fontFamily = 'monospace', gridSize = 16, quoted = false) {
        super(text, 'terminal', fontSize, fontFamily, gridSize, quoted);
    }
}

module.exports = TerminalExpression;