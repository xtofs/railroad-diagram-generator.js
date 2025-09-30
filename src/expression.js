/**
 * Abstract base class for all diagram expressions
 * Layout is calculated in constructors since it's strictly bottom-up
 * 
 * CRITICAL INVARIANT: All Expression heights must be even numbers
 * - Ensures proper baseline alignment in railroad diagrams
 * - Allows predictable track routing with centered baselines
 * - Each subclass constructor must maintain this invariant
 * 
 * @abstract
 */
class Expression {
    /**
     * @constructor
     */
    constructor() {
        /** @type {number} Width in grid units */
        this.width = 0;
        /** @type {number} Height in grid units */
        this.height = 0;
        /** @type {number} Baseline position in grid units */
        this.baseline = 0;
    }

    /**
     * Render the expression to SVG - must be implemented by subclasses
     * @abstract
     * @param {RenderContext} ctx - Rendering context with methods for adding SVG elements
     * @returns {void}
     */
    render(ctx) {
        throw new Error('render must be implemented by subclasses');
    }
}

module.exports = Expression;