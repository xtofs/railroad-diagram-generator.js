const Element = require('./expression');
const { Direction } = require('./track-builder');

/**
 * Loop element (repetition)
 * @extends Element
 */
class LoopElement extends Element {
    /**
     * Create a loop element for repeating elements
     * @param {Element} element - The element to repeat
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

        // Calculate layout dimensions with extra width for loop routing
        this.width = this.child.width + 4; // Add 4 for routing space
        this.height = this.child.height + 1; // Extra height for loop back track
        this.baseline = this.child.baseline + 1;
        this.isLaidOut = true;
        
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

module.exports = LoopElement;