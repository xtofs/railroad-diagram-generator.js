const Element = require('./element');
const { Direction } = require('./track-builder');

/**
 * Bypass element (optional element)
 * @extends Element
 */
class BypassElement extends Element {
    /**
     * Create a bypass element for optional elements
     * @param {Element} element - The element that can be bypassed
     */
    constructor(element) {
        super();
        /** @type {Element} */
        this.child = element;
        
        // Layout will be calculated in layout() method
    }

    /**
     * Calculate layout dimensions based on child
     * @param {LayoutConfig} layoutConfig - Configuration for layout calculations
     * @returns {void}
     */
    layout(layoutConfig) {
        // First layout the child
        if (!this.child.isLaidOut) {
            this.child.layout(layoutConfig);
        }

        // Calculate layout dimensions with extra width for bypass routing
        this.width = this.child.width + 4; // Add 4 for routing space
        this.height = this.child.height + 1; // Extra height for bypass track
        this.baseline = this.child.baseline + 1;
        this.isLaidOut = true;
        
        // Assert the width invariant: all Expression widths must be even
        console.assert(this.width % 2 === 0, `BypassExpression violates width invariant: expected even width, got ${this.width}`);
    }

    /**
     * Render the element with a bypass track for optional path
     * @param {RenderContext} ctx - Rendering context
     * @returns {void}
     */
    render(ctx) {
        const childX = (this.width - this.child.width) / 2;
        const childY = 1; // Child is 1 unit down from top
        
        // Render child using RenderContext
        ctx.renderChild(this.child, childX, childY, 'bypass-child');
        
        // Draw the bypass path (above the child) per specification
        ctx.trackBuilder
            .start(0, this.baseline, Direction.EAST)
            .turnLeft()
            .forward(this.baseline - 2)
            .turnRight()
            .forward(this.width - 4)
            .turnRight()
            .forward(this.baseline - 2)
            .turnLeft()
            .finish('bypass-path');
        
        // Through path connects entry to child and child to exit
        ctx.trackBuilder
            .start(0, this.baseline, Direction.EAST)
            .forward(childX)
            .finish('through-left');
        
        ctx.trackBuilder
            .start(childX + this.child.width, this.baseline, Direction.EAST)
            .forward(this.width - (childX + this.child.width))
            .finish('through-right');
    }
}

module.exports = BypassElement;