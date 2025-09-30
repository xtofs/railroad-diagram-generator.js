const { TrackBuilder, Direction } = require('./track-builder');

/**
 * RenderContext provides methods for adding SVG elements using grid units
 * Encapsulates all coordinate conversion and SVG generation
 */
class RenderContext {
    /**
     * Create a render context
     * @param {number} gridSize - Grid size in pixels
     */
    constructor(gridSize) {
        /** @type {string} Accumulated SVG markup */
        this.svg = '';
        /** @type {number} Grid size in pixels */
        this.gridSize = gridSize;
        /** @type {TrackBuilder} Track builder using grid units */
        this.trackBuilder = new TrackBuilder(gridSize);
        
        // Give trackBuilder a reference to this context so it can add tracks directly
        this.trackBuilder._renderContext = this;
    }

    /**
     * Add a text box at the specified grid coordinates
     * @param {number} x - X position in grid units
     * @param {number} y - Y position in grid units
     * @param {number} width - Width in grid units
     * @param {string} text - Text content
     * @param {'terminal'|'nonterminal'} boxType - Box type
     */
    addTextBox(x, y, width, text, boxType) {
        const height = 2;
        const baseline = 1;
        const h = height * this.gridSize;
       

        // Text box should exclude track connection areas (1 unit on each side)
        const boxWidth = (width - 2) * this.gridSize;
        const boxX = 1 * this.gridSize; // Start 1 grid unit from left edge
        
        this.svg += `<g class="textbox-expression" data-type="${boxType}" data-text="${this.escapeXml(text)}">`;
        
        // Draw box with correct width, positioned to leave space for tracks
        this.svg += `<rect x="${boxX}" y="0" width="${boxWidth}" height="${h}" class="textbox ${boxType}"/>`;
        
        // Draw text centered in the actual text box area (not the full element width)
        const textX = boxX + boxWidth / 2;
        const textY = h / 2;
        this.svg += `<text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="middle" class="textbox-text ${boxType}">${this.escapeXml(text)}</text>`;
        
        // Add connecting tracks per specification
        const leftTrack = this.trackBuilder
            .start(0, baseline, Direction.EAST)
            .forward(1)
            .finish('textbox-left');
        this.svg += leftTrack;
        
        const rightTrack = this.trackBuilder
            .start(width - 1, baseline, Direction.EAST)
            .forward(1)
            .finish('textbox-right');
        this.svg += rightTrack;
        
        this.svg += '</g>';
    }

    /**
     * Add a start/end endpoint circle at the specified grid coordinates
     * @param {number} gridX - X position in grid units
     * @param {number} gridY - Y position in grid units
     */
    addEndpoint(gridX, gridY) {
        const x = gridX * this.gridSize;
        const y = gridY * this.gridSize;
        this.svg += `<circle cx="${x}" cy="${y}" class="endpoint"/>`;
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
        
        // Render child directly in this context's coordinate system
        // The SVG transform handles positioning, so child renders at (0,0) relative to group
        child.render(this);
        
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

module.exports = RenderContext;