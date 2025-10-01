const { TextBoxElement } = require('./text-box-element');

/**
 * Terminal element (quoted literals, hex values, etc.)
 * @extends TextBoxElement
 */
class TerminalElement extends TextBoxElement {
    /**
     * Create a terminal expression
     * @param {string} text - Text to display in the box (literal ABNF syntax)
     */
    constructor(text) {
        super(text, 'terminal');
    }
}

module.exports = TerminalElement;