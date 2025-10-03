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

    /**
     * Convert to debug string representation
     * @returns {string} Debug string like 'terminal("x")'
     */
    toString() {
        return `terminal(${JSON.stringify(this.text)})`;
    }
}

module.exports = TerminalElement;