const Expression = require('./expression');
const { Direction } = require('./track-builder');

/**
 * Stack expression (used for alternatives)
 * @extends Expression
 */
class StackExpression extends Expression {
    /**
     * Create a stack expression for alternative paths
     * @param {Expression[]} elements - Array of alternative expressions
     */
    constructor(elements) {
        super();
        /** @type {Expression[]} */
        this.children = elements;

        // Calculate layout dimensions by stacking alternatives vertically
        // Children are already constructed with their layouts calculated
        const maxWidth = Math.max(...this.children.map(child => child.width));
        
        // Stack grows downward from first child baseline with 1-unit gaps
        let totalHeight = this.children[0].height; // Start with first child
        for (let i = 1; i < this.children.length; i++) {
            totalHeight += 1; // 1-unit gap
            totalHeight += this.children[i].height;
        }

        this.width = 2 + maxWidth + 2; // 2 units left track space + max child width + 2 units right track space
        this.height = totalHeight + (totalHeight % 2); // Add 1 if odd to make it even
        this.baseline = this.children[0].baseline; // Use first child's baseline
        
        // Assert the width invariant: all Expression widths must be even
        console.assert(this.width % 2 === 0, `StackExpression violates width invariant: expected even width, got ${this.width}`);
    }

    render(ctx) {
        // First child is positioned at baseline (y=0 relative to stack)
        // Other children grow downward with 1-unit gaps
        let currentY = 0;
        const maxWidth = Math.max(...this.children.map(child => child.width));
        
        this.children.forEach((child, i) => {
            // Each child centered within the stack's content area
            const childXOffset = 2 + (maxWidth - child.width) / 2; // 2 units left track space + centering offset
            const childBaseline = currentY + child.baseline;
            
            // Render child using RenderContext
            ctx.renderChild(child, childXOffset, currentY, 'stack-child', { index: i, alternative: true });
            
            // Add tracks for routing
            if (i === 0) {
                // First child: straight through on main baseline
                ctx.trackBuilder
                    .start(0, this.baseline, Direction.EAST)
                    .forward(childXOffset) // go directly to child start position
                    .finish(`child${i}-left`);
                
                ctx.trackBuilder
                    .start(childXOffset + child.width, this.baseline, Direction.EAST)
                    .forward(childXOffset) // go to right track boundary
                    .finish(`child${i}-right`);
            } else {
                // Other children: handle width centering and vertical routing
                const dy = childBaseline - this.baseline; // vertical distance
                
                // Left side: route from stack baseline to child endpoint
                // immediate turn down at x=0, then route east to child
                ctx.trackBuilder
                    .start(0, this.baseline, Direction.EAST)
                    .turnRight() // immediately turn south at x=0
                    .forward(dy - 2) // -2 for the quarter circles
                    .turnLeft() // turn east toward child (SOUTH → EAST is counterclockwise)
                    .forward(childXOffset - 2) // the two turns already provide 2 units horizontal displacement
                    .finish(`child${i}-left`);
                
                // Right side: route from child exit back to stack baseline
                // immediate turn up at x=0 fromn east to north 
                ctx.trackBuilder
                    .start(childXOffset + child.width, childBaseline, Direction.EAST)
                    .forward(childXOffset - 2) // the two turns already provide 2 units horizontal displacement
                    .turnLeft()
                    .forward(dy - 2)
                    .turnRight()                    
                    .finish(`child${i}-right`);
            }
            
            // Move to next child position (current child height + 1 unit gap)
            if (i < this.children.length - 1) {
                currentY += child.height + 1;
            }
        });
    }
}

module.exports = StackExpression;