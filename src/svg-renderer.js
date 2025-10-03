/**
 * SVG Diagram Renderer
 * 
 * Standalone implementation of railroad diagram rendering to SVG
 */

const RenderContext = require('./render-context');
const { Direction } = require('./track-builder');
const ASTTransformer = require('./ast-transformer');

/**
 * @typedef {Object} RenderConfig
 * @property {number} gridSize - Grid size in pixels
 * @property {number} fontSize - Font size in pixels
 * @property {number} trackWidth - Track width in pixels
 * @property {number} textBorder - Text border width in pixels
 * @property {number} endpointRadius - Border radius for start/end endpoint circles
 * @property {number} textBoxRadius - Border radius for text boxes
 */

/**
 * @typedef {Object} DiagramElement
 * @property {string} type - Element type ('terminal', 'nonterminal', 'sequence', 'stack', 'bypass', 'loop')
 * @property {string} [text] - Text content (for terminal/nonterminal)
 * @property {DiagramElement[]} [elements] - Child elements (for containers)
 * @property {DiagramElement} [element] - Single child element (for wrappers)
 */

/**
 * SVGRenderer transforms abstract diagram definitions into SVG railroad diagrams
 * Provides the main public API for rendering railroad diagrams
 */
class SVGRenderer {
    /**
     * Create an SVG renderer with optional configuration
     * @param {Partial<RenderConfig>} [config] - Rendering configuration
     */
    constructor(config = {}) {
        /** @type {RenderConfig} Default configuration */
        this.config = {
            gridSize: 16,
            fontSize: 14,
            trackWidth: 2,
            textBorder: 1,
            endpointRadius: 8,
            textBoxRadius: 6,
            ...config
        };
        
        this.transformer = new ASTTransformer();
    }



    /**
     * Render a diagram definition to SVG
     * @param {DiagramElement} diagramElement - Abstract diagram definition
     * @param {boolean} [returnLayoutElement=false] - If true, returns {svg, layoutElement}, otherwise just svg string
     * @returns {string|{svg: string, layoutElement: LayoutElement}} Complete SVG diagram or object with SVG and layout element
     */
    render(diagramElement, returnLayoutElement = false) {
        // Phase 1: Build element tree from diagram definition
        const element = this.transformer.transform(diagramElement);
        
        // Phase 2: Calculate layout with LayoutConfig
        const layoutConfig = {
            fontSize: this.config.fontSize,
            fontFamily: 'monospace',
            gridSize: this.config.gridSize
        };
        element.layout(layoutConfig);
        
        // Phase 3: Render with RenderConfig
        // Create render context
        const ctx = new RenderContext(this.config.gridSize);
        
        // Add start endpoint at grid coordinates
        const startX = 1; // 1 grid unit from left edge
        const startY = 1 + element.baseline; // At baseline position
        ctx.addEndpoint(startX, startY);

        // Render main element at grid coordinates - positioned after start track (2 units)
        const elementX = startX + 2; // Start endpoint + 2 units for track
        ctx.renderChild(element, elementX, 1, 'main-element');

        // Add end endpoint at grid coordinates - positioned after element + end track (2 units)
        const endX = elementX + element.width + 2; // After element + 2 units for track
        const endY = 1 + element.baseline; // At baseline position
        ctx.addEndpoint(endX, endY);

        // Add connecting tracks between endpoints and element
        const startTrack = ctx.trackBuilder
            .start(startX, startY, Direction.EAST) // Start from center of start endpoint
            .forward(2) // Go 2 units east to element
            .finish('start-connection');
        ctx.svg += startTrack;
        
        const endTrack = ctx.trackBuilder
            .start(endX - 2, endY, Direction.EAST) // Start 2 units before end endpoint
            .forward(2) // Go 2 units east to end endpoint
            .finish('end-connection');
        ctx.svg += endTrack;
        
        // Calculate total SVG dimensions
        const totalWidth = (endX + 1) * this.config.gridSize + 1; // Include padding + 1 pixel for pattern lines
        const totalHeight = (element.height + 2) * this.config.gridSize + 1; // Add padding + 1 pixel for pattern lines
        
        // Generate complete SVG with proper structure
        const svg = `<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="railroad-diagram">
${ctx.svg}
</svg>`;

        // Return either just SVG or both SVG and layout element
        return returnLayoutElement ? { svg, layoutElement: element } : svg;
    }

    /**
     * Convenience method to render a simple terminal
     * @param {string} text - Terminal text
     * @param {boolean} [quoted=false] - Whether terminal should show quotes
     * @returns {string} SVG diagram
     */
    renderTerminal(text, quoted = false) {
        return this.render({
            type: 'terminal',
            text: text,
            quoted: quoted
        });
    }

    /**
     * Convenience method to render a simple nonterminal
     * @param {string} text - Nonterminal text
     * @returns {string} SVG diagram
     */
    renderNonterminal(text) {
        return this.render({
            type: 'nonterminal',
            text: text
        });
    }

    /**
     * Convenience method to render a sequence
     * @param {DiagramElement[]} elements - Elements to sequence
     * @returns {string} SVG diagram
     */
    renderSequence(elements) {
        return this.render({
            type: 'sequence',
            elements: elements
        });
    }

    /**
     * Convenience method to render alternatives (stack)
     * @param {DiagramElement[]} alternatives - Alternative elements
     * @returns {string} SVG diagram
     */
    renderStack(alternatives) {
        return this.render({
            type: 'stack',
            elements: alternatives
        });
    }
}

module.exports = { SVGRenderer };