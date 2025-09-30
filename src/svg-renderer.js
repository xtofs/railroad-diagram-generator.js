/**
 * SVG Diagram Renderer
 * 
 * Standalone implementation of railroad diagram rendering to SVG
 */

const RenderContext = require('./render-context');
const { Direction } = require('./track-builder');
const TerminalExpression = require('./terminal-expression');
const NonterminalExpression = require('./nonterminal-expression');
const SequenceExpression = require('./sequence-expression');
const StackExpression = require('./stack-expression');
const BypassExpression = require('./bypass-expression');
const LoopExpression = require('./loop-expression');

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
    }

    /**
     * Transform a diagram definition into an Expression tree
     * @param {DiagramElement} element - Abstract diagram element
     * @returns {Expression} Expression tree ready for rendering
     */
    buildExpression(element) {
        switch (element.type) {
            case 'terminal':
                if (!element.text) throw new Error('Terminal element missing text');
                return new TerminalExpression(
                    element.text,
                    this.config.fontSize,
                    'monospace',
                    this.config.gridSize,
                    element.quoted || false
                );

            case 'nonterminal':
                if (!element.text) throw new Error('Nonterminal element missing text');
                return new NonterminalExpression(
                    element.text,
                    this.config.fontSize,
                    'monospace',
                    this.config.gridSize
                );

            case 'sequence':
                if (!element.elements || element.elements.length === 0) {
                    throw new Error('Sequence element missing elements array');
                }
                const sequenceChildren = element.elements.map(child => this.buildExpression(child));
                return new SequenceExpression(sequenceChildren);

            case 'stack':
                if (!element.elements || element.elements.length === 0) {
                    throw new Error('Stack element missing elements array');
                }
                const stackChildren = element.elements.map(child => this.buildExpression(child));
                return new StackExpression(stackChildren);

            case 'bypass':
                if (!element.element) throw new Error('Bypass element missing child element');
                const bypassChild = this.buildExpression(element.element);
                return new BypassExpression(bypassChild);

            case 'loop':
                if (!element.element) throw new Error('Loop element missing child element');
                const loopChild = this.buildExpression(element.element);
                return new LoopExpression(loopChild);

            default:
                throw new Error(`Unknown element type: ${element.type}`);
        }
    }

    /**
     * Render a diagram definition to SVG
     * @param {DiagramElement} diagramElement - Abstract diagram definition
     * @returns {string} Complete SVG diagram
     */
    render(diagramElement) {
        // Build expression tree from diagram definition
        const expression = this.buildExpression(diagramElement);
        
        // Create render context
        const ctx = new RenderContext(this.config.gridSize);
        
        // Add start endpoint at grid coordinates
        const startX = 1; // 1 grid unit from left edge
        const startY = 1 + expression.baseline; // At baseline position
        ctx.addEndpoint(startX, startY);

        // Render main expression at grid coordinates - positioned after start track (2 units)
        const expressionX = startX + 2; // Start endpoint + 2 units for track
        ctx.renderChild(expression, expressionX, 1, 'main-expression');

        // Add end endpoint at grid coordinates - positioned after expression + end track (2 units)
        const endX = expressionX + expression.width + 2; // After expression + 2 units for track
        const endY = 1 + expression.baseline; // At baseline position
        ctx.addEndpoint(endX, endY);

        // Add connecting tracks between endpoints and expression
        const startTrack = ctx.trackBuilder
            .start(startX, startY, Direction.EAST) // Start from center of start endpoint
            .forward(2) // Go 2 units east to expression
            .finish('start-connection');
        ctx.svg += startTrack;
        
        const endTrack = ctx.trackBuilder
            .start(endX - 2, endY, Direction.EAST) // Start 2 units before end endpoint
            .forward(2) // Go 2 units east to end endpoint
            .finish('end-connection');
        ctx.svg += endTrack;
        
        // Calculate total SVG dimensions
        const totalWidth = (endX + 1) * this.config.gridSize + 1; // Include padding + 1 pixel for pattern lines
        const totalHeight = (expression.height + 2) * this.config.gridSize + 1; // Add padding + 1 pixel for pattern lines
        
        // Generate complete SVG with proper structure
        return `<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" class="railroad-diagram">
${ctx.svg}
</svg>`;
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