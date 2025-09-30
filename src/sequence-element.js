const Element = require('./element');
const { Direction } = require('./track-builder');

/**
 * Sequence element (elements in sequence)
 * @extends Element
 */
class SequenceElement extends Element {
    /**
     * Create a sequence element
     * @param {Element[]} elements - Array of child elements to render in sequence
     */
    constructor(elements) {
        super();
        /** @type {Element[]} */
        this.children = elements;
        
        // Layout will be calculated in layout() method
    }

    /**
     * Calculate layout dimensions based on children
     * @param {LayoutConfig} layoutConfig - Configuration for layout calculations
     * @returns {void}
     */
    layout(layoutConfig) {
        // First layout all children
        this.children.forEach(child => {
            if (!child.isLaidOut) {
                child.layout(layoutConfig);
            }
        });

        // Calculate layout dimensions by summing child widths and adding spacing
        this.width = this.children.reduce((sum, child) => sum + child.width, 0) + (this.children.length - 1) * 2;
        this.height = Math.max(...this.children.map(child => child.height));
        this.baseline = Math.max(...this.children.map(child => child.baseline));
        this.isLaidOut = true;
       
        // Assert the width invariant: all Expression width must be even
        // This is a design invariant, not a runtime error - indicates a bug in Expression subclass constructors
        console.assert(this.width % 2 === 0, `SequenceExpression violates width invariant: expected even width, got ${this.width}`);
    }

    /**
     * Render all child elements in horizontal sequence
     * @param {RenderContext} ctx - Rendering context
     * @returns {void}
     */
    render(ctx) {
        // Render each child at its calculated position
        let currentX = 0;
        this.children.forEach((child, i) => {
            const childY = this.baseline - child.baseline; // Align baselines
            
            // Render child using RenderContext
            ctx.renderChild(child, currentX, childY, 'sequence-child', { index: i });
            
            // Add horizontal track connection to next child (except for the last child)
            if (i < this.children.length - 1) {
                const trackStartX = currentX + child.width;
                const trackY = this.baseline;
                
                ctx.trackBuilder
                    .start(trackStartX, trackY, Direction.EAST)
                    .forward(2) // 2 unit space
                    .finish(`seq-${i}`);
            }
            
            currentX += child.width + 2; // Add 2 for the unit space
        });
    }
}

module.exports = SequenceElement;