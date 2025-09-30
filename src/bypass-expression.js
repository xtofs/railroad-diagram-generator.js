const Expression = require('./expression');
const { Direction } = require('./track-builder');

/**
 * Bypass expression (optional element)
 * @extends Expression
 */
class BypassExpression extends Expression {
    /**
     * Create a bypass expression for optional elements
     * @param {Expression} element - The element that can be bypassed
     */
    constructor(element) {
        super();
        /** @type {Expression} */
        this.child = element;

        // Calculate layout dimensions with extra width for bypass routing
        this.width = this.child.width + 4; // Add 4 for routing space
        this.height = this.child.height + 1; // Extra height for bypass track
        this.baseline = this.child.baseline + 1;
        
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

module.exports = BypassExpression;