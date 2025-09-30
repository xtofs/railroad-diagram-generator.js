const Expression = require('./expression');
const { createCanvas } = require('canvas');

/**
 * Measure text dimensions using Canvas API for accurate sizing
 * @param {string} text - Text to measure
 * @param {number} fontSize - Font size in pixels
 * @param {string} fontFamily - Font family name
 * @returns {{width: number, height: number}} Text dimensions in pixels
 */
function measureText(text, fontSize = 14, fontFamily = 'monospace') {
    const canvas = createCanvas(1, 1); // Minimal canvas for measurement
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    
    return {
        width: metrics.width,
        height: fontSize * 1.2 // Standard line height approximation
    };
}

/**
 * Base class for text box expressions (terminals and nonterminals)
 * @extends Expression
 * @abstract
 */
class TextBoxExpression extends Expression {
    /**
     * Create a text box expression
     * @param {string} text - Text to display in the box
     * @param {'terminal'|'nonterminal'} boxType - Type of text box
     * @param {number} [fontSize=14] - Font size in pixels
     * @param {string} [fontFamily='monospace'] - Font family
     * @param {number} [gridSize=16] - Grid size in pixels
     * @param {boolean} [quoted=false] - Whether terminal was originally quoted (terminals only)
     */
    constructor(text, boxType, fontSize = 14, fontFamily = 'monospace', gridSize = 16, quoted = false) {
        super();
        /** @type {string} */
        this.text = text;
        /** @type {'terminal'|'nonterminal'} */
        this.boxType = boxType;
        /** @type {boolean} */
        this.quoted = quoted;
        
        // For display: add quotes around quoted terminals
        /** @type {string} */
        this.displayText = (boxType === 'terminal' && quoted) ? `"${text}"` : text;

        // Measure actual text dimensions using canvas (use display text for proper sizing)
        const textMetrics = measureText(this.displayText, fontSize, fontFamily);
        
        // Convert text width to grid units with padding
        const textWidthInGrids = Math.ceil(textMetrics.width / gridSize);
        const minWidth = textWidthInGrids + 2; // Add padding (1 grid unit each side)
        
        this.width = Math.max(4, minWidth + (minWidth % 2)); // Round up to nearest even number, minimum 4
        this.height = 2; // Fixed height of 2 grid units for proper track connection
        this.baseline = 1; // Baseline at center (1 grid unit from top/bottom)
        
        // Assert the width invariant: all Expression widths must be even
        console.assert(this.width % 2 === 0, `TextBoxExpression violates width invariant: expected even width, got ${this.width}`);
    }

    /**
     * Render the text box to SVG using RenderContext
     * @param {RenderContext} ctx - Rendering context
     * @returns {void}
     */
    render(ctx) {
        // Use RenderContext to add text box at (0,0) in grid coordinates
        ctx.addTextBox(0, 0, this.width, this.displayText, this.boxType, this.baseline);
    }
}

module.exports = { TextBoxExpression, measureText };