/**
 * SVG Diagram Renderer
 * 
 * Standalone implementation of railroad diagram rendering to SVG
 */

const { RailPathBuilder, Direction } = require('./rail-path-builder');
const { createCanvas } = require('canvas');

/**
 * Measure text dimensions using Canvas API for accurate sizing
 * @param {string} text - Text to measure
 * @param {number} fontSize - Font size in pixels
 * @param {string} fontFamily - Font family name
 * @returns {{width: number, height: number}} Text dimensions in pixels
 */
function measureText(text, fontSize = 14, fontFamily = 'monospace') {
    const canvas = createCanvas(1, 1); // Minimal canvas for measurement only
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    
    return {
        width: metrics.width,
        height: fontSize * 1.2 // Standard line height approximation
    };
}

/**
 * RenderContext provides methods for adding SVG elements using grid units
 * Encapsulates all coordinate conversion and SVG generation
 */
class RenderContext {
    /**
     * Create a render context
     * @param {number} gridSize - Grid size in pixels
     * @param {number} endpointRadius - Radius for start/end endpoint circles
     * @param {number} textBoxRadius - Border radius for text boxes
     */
    constructor(gridSize, endpointRadius, textBoxRadius) {
        /** @type {string} Accumulated SVG markup */
        this.svg = '';
        /** @type {number} Grid size in pixels */
        this.gridSize = gridSize;
        /** @type {number} Start/end endpoint radius */
        this.endpointRadius = endpointRadius;
        /** @type {number} Text box border radius */
        this.textBoxRadius = textBoxRadius;
        /** @type {RailPathBuilder} Track builder using grid units */
        this.trackBuilder = new RailPathBuilder(gridSize);
        
        // Give trackBuilder a reference to this context so it can add paths directly
        this.trackBuilder._renderContext = this;
    }

    /**
     * Add a text box at the specified grid coordinates
     * @param {number} gridX - X position in grid units
     * @param {number} gridY - Y position in grid units
     * @param {number} gridWidth - Width in grid units
     * @param {number} gridHeight - Height in grid units
     * @param {string} text - Text content
     * @param {'terminal'|'nonterminal'} boxType - Box type
     * @param {number} baseline - Baseline position in grid units for track connections
     */
    addTextBox(gridX, gridY, gridWidth, gridHeight, text, boxType, baseline) {
        const w = gridWidth * this.gridSize;
        const h = gridHeight * this.gridSize;
        
        this.svg += `<g class="textbox-expression" data-type="${boxType}" data-text="${this.escapeXml(text)}">`;
        
        // Draw box at relative (0,0) within group - CSS classes handle styling differences
        this.svg += `<rect x="0" y="0" width="${w}" height="${h}" rx="${this.textBoxRadius}" class="textbox ${boxType}"/>`;
        
        // Draw text centered in box - SVG text centering
        const textX = w / 2;
        const textY = h / 2;
        this.svg += `<text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="middle" class="textbox-text ${boxType}">${this.escapeXml(text)}</text>`;
        
        // Add connecting tracks
        const leftTrack = this.trackBuilder
            .start(-1, baseline, Direction.EAST)
            .forward(1)
            .finish('textbox-left');
        this.svg += leftTrack;
        
        const rightTrack = this.trackBuilder
            .start(gridWidth, baseline, Direction.EAST)
            .forward(1)
            .finish('textbox-right');
        this.svg += rightTrack;
        
        this.svg += '</g>';
    }

    /**
     * Add a start/end endpoint circle at the specified grid coordinates
     * @param {number} gridX - X position in grid units
     * @param {number} gridY - Y position in grid units
     * @param {'start'|'end'} endpointType - Type of endpoint
     */
    addEndpoint(gridX, gridY, endpointType) {
        const x = gridX * this.gridSize;
        const y = gridY * this.gridSize;
        this.svg += `<circle cx="${x}" cy="${y}" r="${this.endpointRadius}" class="${endpointType}-endpoint"/>`;
    }

    /**
     * Render a child expression at specific grid coordinates with automatic group wrapping
     * @param {Expression} child - Child expression to render
     * @param {number} gridX - X position in grid units
     * @param {number} gridY - Y position in grid units
     * @param {string} [groupClass] - Optional CSS class for the group
     * @param {Object} [groupData] - Optional data attributes for the group
     */
    renderChild(child, gridX, gridY, groupClass = null, groupData = {}) {
        // Start SVG group with transform to position the child
        const transform = `translate(${gridX * this.gridSize}, ${gridY * this.gridSize})`;
        let groupTag = `<g transform="${transform}"`;
        
        if (groupClass) {
            groupTag += ` class="${groupClass}"`;
        }
        
        // Add data attributes
        for (const [key, value] of Object.entries(groupData)) {
            groupTag += ` data-${key}="${value}"`;
        }
        
        groupTag += '>';
        this.svg += groupTag;
        
        // Create a new context for the child that starts at (0,0)
        const childContext = new RenderContext(this.gridSize, this.endpointRadius, this.textBoxRadius);
        
        // Render child in its own coordinate space
        child.render(childContext);
        
        // Add the child's SVG to our SVG
        this.svg += childContext.svg;
        
        // Close the group
        this.svg += '</g>';
    }

    /**
     * Escape XML special characters
     * @param {string|number} str - Input string or number
     * @returns {string} XML-escaped string
     */
    escapeXml(str) {
        if (typeof str !== 'string') {
            str = String(str);
        }
        return str.replace(/[&<>"']/g, (char) => {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return map[char];
        });
    }
}

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
 * @property {string} type - Element type ('textBox', 'sequence', 'stack', 'bypass', 'loop')
 * @property {string} [text] - Text content (for textBox)
 * @property {string} [boxType] - Box type ('terminal' or 'nonterminal')
 * @property {DiagramElement[]} [elements] - Child elements (for containers)
 * @property {DiagramElement} [element] - Single child element (for wrappers)
 */

/**
 * Abstract base class for all diagram expressions
 * Layout is calculated in constructors since it's strictly bottom-up
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

/**
 * Text box expression (terminal or nonterminal)
 * @extends Expression
 */
class TextBoxExpression extends Expression {
    /**
     * Create a text box expression
     * @param {string} text - Text to display in the box
     * @param {'terminal'|'nonterminal'} [boxType='nonterminal'] - Type of text box
     * @param {number} [fontSize=14] - Font size in pixels
     * @param {string} [fontFamily='monospace'] - Font family
     * @param {number} [gridSize=16] - Grid size in pixels
     */
    constructor(text, boxType = 'nonterminal', fontSize = 14, fontFamily = 'monospace', gridSize = 16) {
        super();
        /** @type {string} */
        this.text = text;
        /** @type {'terminal'|'nonterminal'} */
        this.boxType = boxType;

        // Measure actual text dimensions using canvas
        const textMetrics = measureText(this.text, fontSize, fontFamily);
        
        // Convert text width to grid units with padding
        const textWidthInGrids = Math.ceil(textMetrics.width / gridSize);
        const minWidth = textWidthInGrids + 2; // Add padding (1 grid unit each side)
        
        this.width = Math.max(4, minWidth + (minWidth % 2)); // Round up to nearest even number, minimum 4
        this.height = 2; // Fixed height of 2 grid units for proper rail connection
        this.baseline = 1; // Baseline at center (1 grid unit from top/bottom)
    }

    /**
     * Render the text box to SVG using RenderContext
     * @param {RenderContext} ctx - Rendering context
     * @returns {void}
     */
    render(ctx) {
        // Use RenderContext to add text box at (0,0) in grid coordinates
        ctx.addTextBox(0, 0, this.width, this.height, this.text, this.boxType, this.baseline);
    }
}

/**
 * Sequence expression (elements in sequence)
 * @extends Expression
 */
class SequenceExpression extends Expression {
    /**
     * Create a sequence expression
     * @param {Expression[]} elements - Array of child expressions to render in sequence
     */
    constructor(elements) {
        super();
        /** @type {Expression[]} */
        this.children = elements;

        // Calculate layout dimensions by summing child widths and adding spacing
        this.width = this.children.reduce((sum, child) => sum + child.width, 0) + (this.children.length - 1) * 2;
        this.height = Math.max(...this.children.map(child => child.height));
        this.baseline = Math.max(...this.children.map(child => child.baseline));
        // Assert that height is even for proper baseline calculation
        console.assert(this.height % 2 === 0, `SequenceExpression all children's height and therefore the Sequence's height should be even, got ${this.height}`);
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
            
            // Add horizontal rail connection to next child (except for the last child)
            if (i < this.children.length - 1) {
                const railStartX = currentX + child.width;
                const railY = this.baseline;
                
                ctx.trackBuilder
                    .start(railStartX, railY, Direction.EAST)
                    .forward(2) // 2 unit space
                    .finish(`seq-${i}`);
            }
            
            currentX += child.width + 2; // Add 2 for the unit space
        });
    }
}

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
        const totalHeight = this.children.reduce((sum, child) => sum + child.height + 1, -1); // +1 for spacing

        this.width = maxWidth + 4; // Extra width for routing
        this.height = totalHeight + 4; // Extra height for routing
        this.baseline = Math.floor(this.height / 2);
    }

    render(ctx) {
        // Render each child at its calculated position
        let currentY = 2; // Start with some padding
        this.children.forEach((child, i) => {
            const xOffset = 2 + (Math.max(...this.children.map(c => c.width)) - child.width) / 2;
            const childBaseline = currentY + child.baseline;
            
            // Render child using RenderContext
            ctx.renderChild(child, xOffset, currentY, 'stack-child', { index: i, alternative: true });
            
            // Add tracks for routing
            if (i === 0) {
                // First child: straight tracks
                ctx.trackBuilder
                    .start(0, this.baseline, Direction.EAST)
                    .forward(xOffset)
                    .finish(`child${i}-left`);
                
                ctx.trackBuilder
                    .start(xOffset + child.width, childBaseline, Direction.EAST)
                    .forward(this.width - (xOffset + child.width))
                    .finish(`child${i}-right`);
            } else {
                // Other children: branching paths
                const verticalDistance = Math.abs(childBaseline - this.baseline);
                const horizontalToChild = xOffset;
                
                if (childBaseline > this.baseline) {
                    // Child is below main baseline - route down
                    ctx.trackBuilder
                        .start(0, this.baseline, Direction.EAST)
                        .turnRight()
                        .forward(verticalDistance - 2)
                        .turnLeft()
                        .forward(horizontalToChild - 2)
                        .finish(`child${i}-left`);
                    
                    ctx.trackBuilder
                        .start(this.width, this.baseline, Direction.WEST)
                        .turnLeft()
                        .forward(verticalDistance - 2) 
                        .turnRight()
                        .forward(this.width - (xOffset + child.width) - 2)
                        .finish(`child${i}-right`);
                } else {
                    // Child is above main baseline - route up
                    ctx.trackBuilder
                        .start(0, this.baseline, Direction.EAST)
                        .turnLeft()
                        .forward(verticalDistance - 2)
                        .turnRight()
                        .forward(horizontalToChild - 2)
                        .finish(`child${i}-left`);
                    
                    ctx.trackBuilder
                        .start(this.width, this.baseline, Direction.WEST)
                        .turnRight() 
                        .forward(verticalDistance - 2)
                        .turnLeft()
                        .forward(this.width - (xOffset + child.width) - 2)
                        .finish(`child${i}-right`);
                }
            }
            
            currentY += child.height + 1;
        });
    }
}

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
    }

    /**
     * Render the element with a bypass track for optional path
     * @param {RenderContext} ctx - Rendering context
     * @param {RenderConfig} config - Grid and style configuration
     * @returns {void}
     */
    render(ctx) {
        const childX = (this.width - this.child.width) / 2;
        const childY = 1; // Child is 1 unit down from top
        
        // Render child using RenderContext
        ctx.renderChild(this.child, childX, childY, 'bypass-child');
        
        // Draw the bypass path (above the child)
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
        
        // Through paths
        ctx.trackBuilder
            .start(0, this.baseline, Direction.EAST)
            .forward(2)
            .finish('through-left');
        
        ctx.trackBuilder
            .start(this.width, this.baseline, Direction.WEST)
            .forward(2)
            .finish('through-right');
    }
}

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
    }

    /**
     * Render the element with a loop-back track for repetition
     * @param {RenderContext} ctx - Rendering context
     * @param {RenderConfig} config - Grid and style configuration
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
        
        // Through paths
        ctx.trackBuilder
            .start(0, this.baseline, Direction.EAST)
            .forward(2)
            .finish('through-left');
        
        ctx.trackBuilder
            .start(this.width, this.baseline, Direction.WEST)
            .forward(2)
            .finish('through-right');
    }
}

/**
 * SVG renderer for railroad diagrams
 * Handles the conversion of parsed railroad expressions to SVG markup
 */
class SVGRenderer {
    /**
     * Create an SVG renderer with default configuration
     */
    constructor() {
        /** @type {number} Grid size in pixels */
        this.gridSize = 16;
        /** @type {number} Font size in pixels */
        this.fontSize = 14;
        /** @type {string} Font family for text measurement and rendering */
        this.fontFamily = 'monospace';
        /** @type {number} Track width in pixels */
        this.trackWidth = 6;
        /** @type {number} Text border width in pixels */
        this.textBorder = 3;
        /** @type {number} Border radius for start/end endpoint circles */
        this.endpointRadius = this.gridSize * 0.9;
        /** @type {number} Border radius for text boxes */
        this.textBoxRadius = this.gridSize * 0.6;
    }

    /**
     * Create an expression instance from a diagram definition
     * @param {DiagramElement} element - Diagram element definition
     * @returns {Expression} Expression instance
     * @throws {Error} If element type is unknown
     */
    createExpression(element) {
        switch (element.type) {
            case 'textBox':
                return new TextBoxExpression(element.text, element.boxType, this.fontSize, this.fontFamily, this.gridSize);
            case 'sequence':
                return new SequenceExpression(element.elements.map(el => this.createExpression(el)));
            case 'stack':
                return new StackExpression(element.elements.map(el => this.createExpression(el)));
            case 'bypass':
                return new BypassExpression(this.createExpression(element.element));
            case 'loop':
                return new LoopExpression(this.createExpression(element.element));
            default:
                throw new Error(`Unknown element type: ${element.type}`);
        }
    }

    /**
     * Render a railroad diagram to SVG
     * @param {DiagramElement} diagramElement - DiagramElement object defining the railroad diagram
     * @param {string} [ruleName='unknown'] - Name of the rule for error reporting
     * @returns {string} SVG markup or error message
     */
    renderSVG(diagramElement, ruleName = 'unknown') {
        try {
            // Create expression tree directly from the diagram element
            const expression = this.createExpression(diagramElement);

            // Generate SVG
            return this.generateSVG(expression, ruleName);
        } catch (error) {
            console.error(`Error rendering SVG for rule ${ruleName}:`, error);
            return `<p>Error rendering diagram for rule: ${ruleName} (${error.message})</p>`;
        }
    }

    /**
     * Generate complete SVG markup from expression tree
     * @param {Expression} expression - Root expression to render
     * @param {string} ruleName - Name of the rule for debugging
     * @returns {string} Complete SVG markup
     */
    generateSVG(expression, ruleName) {
        const width = (expression.width + 4) * this.gridSize; // Add padding
        const height = (expression.height + 2) * this.gridSize; // Add padding

        let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

        // Create new RenderContext instance
        const ctx = new RenderContext(this.gridSize, this.endpointRadius, this.textBoxRadius);

        // Add start endpoint at grid coordinates
        const startX = 1; // 1 grid unit from left edge
        const startY = 1 + expression.baseline; // At baseline position
        ctx.addEndpoint(startX, startY, 'start');

        // Render main expression at grid coordinates (2, 1) to leave padding
        ctx.renderChild(expression, 2, 1, 'main-expression', { rule: ruleName });

        // Add end endpoint at grid coordinates
        const endX = 2 + expression.width + 1; // After expression + 1 grid unit
        const endY = 1 + expression.baseline; // At baseline position
        ctx.addEndpoint(endX, endY, 'end');

        // Add connecting tracks between endpoints and expression
        ctx.trackBuilder
            .start(startX + 0.25, startY, Direction.EAST) // Start just after start endpoint circle
            .forward(0.75) // Connect to expression
            .finish('start-connection');
        
        ctx.trackBuilder
            .start(2 + expression.width, startY, Direction.EAST) // Start after expression
            .forward(0.75) // Connect to end endpoint
            .finish('end-connection');

        svg += ctx.svg;
        svg += '</svg>';

        return svg;
    }

    /**
     * Escape XML special characters for safe SVG output
     * @param {string|number} str - Input string or number to escape
     * @returns {string} XML-escaped string
     */
    escapeXml(str) {
        if (typeof str !== 'string') {
            str = String(str);
        }
        return str.replace(/[&<>"']/g, (char) => {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return map[char];
        });
    }

    /**
     * Render multiple railroad diagrams from parsed ABNF rules
     * @param {Map<string, {original: string, railroad: DiagramElement}>} rules - Parsed ABNF rules
     * @returns {Promise<Map<string, string>>} Map of rule names to SVG content
     */
    async renderAllSVGs(rules) {
        const svgMap = new Map();

        for (const [ruleName, ruleData] of rules) {
            try {
                const svg = this.renderSVG(ruleData.railroad, ruleName);
                svgMap.set(ruleName, svg);
            } catch (error) {
                console.error(`Failed to render SVG for rule ${ruleName}:`, error);
                svgMap.set(ruleName, `<p>Error rendering diagram for rule: ${ruleName}</p>`);
            }
        }

        return svgMap;
    }
}

module.exports = SVGRenderer;