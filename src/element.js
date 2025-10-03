/**
 * @typedef {Object} LayoutConfig
 * @property {number} fontSize - Font size in pixels for text measurement
 * @property {string} fontFamily - Font family for text measurement
 * @property {number} gridSize - Grid size in pixels for dimension calculations
 */

/**
 * @typedef {Object} RenderConfig
 * @property {number} gridSize - Grid size in pixels for SVG positioning
 * @property {number} fontSize - Font size in pixels for SVG text
 * @property {number} trackWidth - Track width in pixels
 * @property {number} textBorder - Text border width in pixels
 * @property {number} endpointRadius - Border radius for endpoints
 * @property {number} textBoxRadius - Border radius for text boxes
 */

/**
 * Abstract base class for all diagram elements of the visual/layout tree
 * 
 * Three-phase architecture:
 * 1. Construction: Build logical structure without layout
 * 2. Layout: Calculate dimensions with LayoutConfig parameters  
 * 3. Rendering: Generate SVG using RenderConfig parameters
 * 
 * CRITICAL INVARIANT: All LayoutElement widths must be even 
 * - Allows predictable track routing with centered baselines
 * - Each subclass layout() method must maintain this invariant
 * 
 * CRITICAL INVARIANT: All LayoutElement height must be at least 2
 * - Ensures proper baseline alignment in railroad diagrams 
 * @abstract
 */
class LayoutElement {
    /**
     * @constructor
     */
    constructor() {
        /** @type {number} Width in grid units (set during layout phase) */
        this.width = 0;
        /** @type {number} Height in grid units (set during layout phase) */
        this.height = 0;
        /** @type {number} Baseline position from top in grid units (set during layout phase) */
        this.baseline = 0;
        /** @type {boolean} Whether layout has been calculated */
        this.isLaidOut = false;
    }

    /**
     * Calculate layout dimensions - must be implemented by subclasses
     * This method should calculate width, height, and baseline based on content and LayoutConfig
     * @abstract
     * @param {LayoutConfig} layoutConfig - Configuration for layout calculations
     * @returns {void}
     */
    layout(layoutConfig) {
        throw new Error('layout must be implemented by subclasses');
    }

    /**
     * Render the element to SVG - must be implemented by subclasses
     * @abstract
     * @param {RenderContext} ctx - Rendering context with methods for adding SVG elements
     * @returns {void}
     */
    render(ctx) {
        throw new Error('render must be implemented by subclasses');
    }

    /**
     * Convert element to debug string representation
     * Default implementation shows class name, can be overridden by subclasses
     * @returns {string} Debug string representation
     */
    toString() {
        return this.constructor.name; // .replace('Element', '').toLowerCase();
    }
}

module.exports = LayoutElement;