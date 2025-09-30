const Expression = require('./expression');
const { Direction } = require('./track-builder');

/**
 * Loop expression (repetition)
 * @extends Expression
 */
class LoopExpression extends Expression {
    /**
     * Create a loop expression for repeating elements
     * @param {Expression} element - The element to repeat
     */
    constructor(element) {
        super();
        /** @type {Expression} */
        this.child = element;

        // Calculate layout dimensions with extra width for loop routing
        this.width = this.child.width + 4; // Add 4 for routing space
        this.height = this.child.height + 1; // Extra height for loop back track
        this.baseline = this.child.baseline + 1;
        
        // Assert the width invariant: all Expression widths must be even
        console.assert(this.width % 2 === 0, `LoopExpression violates width invariant: expected even width, got ${this.width}`);
    }

    /**
     * Render the element with a loop-back track for repetition
     * @param {RenderContext} ctx - Rendering context
     * @returns {void}
     */
    render(ctx) {
        const childX = (this.width - this.child.width) / 2;
        const childY = 1; // Child is 1 unit down from top

        // Render child using RenderContext
        ctx.renderChild(this.child, childX, childY, 'loop-child');
        
        // Draw the loop path (going backwards initially)
        ctx.trackBuilder
            .start(2, this.baseline, Direction.WEST)
            .turnRight()
            .forward(this.baseline - 2)
            .turnRight()
            .forward(this.width - 4)
            .turnRight()
            .forward(this.baseline - 2)
            .turnRight()
            .finish('loop-path');
        
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

module.exports = LoopExpression;