const { TextBoxElement } = require('./text-box-element');

/**
 * Terminal element (quoted literals, hex values, etc.)
 * @extends TextBoxElement
 */
class TerminalElement extends TextBoxElement {
    /**
     * Create a terminal expression
     * @param {string} text - Text to display in the box
     * @param {number} [fontSize=14] - Font size in pixels
     * @param {string} [fontFamily='monospace'] - Font family
     * @param {number} [gridSize=16] - Grid size in pixels
     * @param {boolean} [quoted=false] - Whether terminal was originally quoted
     */
    constructor(text, quoted = false) {
        super(text, 'terminal', quoted);
    }
}

module.exports = TerminalElement;