/**
 * Track Builder
 * 
 * Provides a builder API for creating complex track routing paths
 * with proper coordinate calculations and smooth curves.
 */

/**
 * Direction constants for track movement
 * @readonly
 * @enum {string}
 */
const Direction = {
    /** North direction (up) */
    NORTH: 'north',
    /** South direction (down) */
    SOUTH: 'south', 
    /** East direction (right) */
    EAST: 'east',
    /** West direction (left) */
    WEST: 'west'
};

/**
 * Represents a point in 2D space
 */
class Point {
    /**
     * Create a new point
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    constructor(x, y) {
        /** @type {number} X coordinate */
        this.x = x;
        /** @type {number} Y coordinate */
        this.y = y;
    }

    /**
     * Add another point to this point
     * @param {Point} other - Point to add
     * @returns {Point} New point with added coordinates
     */
    add(other) {
        return new Point(this.x + other.x, this.y + other.y);
    }

    /**
     * Subtract another point from this point
     * @param {Point} other - Point to subtract
     * @returns {Point} New point with subtracted coordinates
     */
    subtract(other) {
        return new Point(this.x - other.x, this.y - other.y);
    }

    /**
     * Convert point to string representation
     * @returns {string} String in format "x,y"
     */
    toString() {
        return `${this.x},${this.y}`;
    }
}

/**
 * Track builder with fluent API
 * Private methods are prefixed with _ and should never be called by users
 */
class TrackBuilder {
    /**
     * Create a new track builder
     * @param {number} [gridSize=16] - Grid size in pixels
     */
    constructor(gridSize = 16) {
        /** @type {number} Grid size in pixels */
        this.gridSize = gridSize;
        /** @private @type {number} Current X position */
        this._currentX = 0;
        /** @private @type {number} Current Y position */
        this._currentY = 0;
        /** @private @type {Point} Current direction */
        this._currentDirection = Direction.EAST;
        /** @private @type {string[]} SVG path commands */
        this._pathCommands = [];
        this._isStarted = false;
        this._debugSequence = []; // For debugging path construction
    }

    /**
     * Start a new path at the given position
     * @param {number} x - X coordinate in grid units
     * @param {number} y - Y coordinate in grid units  
     * @param {string} [direction=Direction.EAST] - Initial direction
     * @returns {TrackBuilder} For method chaining
     */
    start(x, y, direction = Direction.EAST) {
        if (this._isStarted) {
            throw new Error('Path already started. Call build() first to finish current path.');
        }
        
        // Convert grid coordinates to pixel coordinates
        const pixelX = x * this.gridSize;
        const pixelY = y * this.gridSize;
        
        this._currentX = x; // Store as grid units
        this._currentY = y;
        this._currentDirection = direction;
        this._pathCommands = [`M ${pixelX} ${pixelY}`];
        this._debugSequence = [`start(${x}, ${y}, ${direction})`];
        this._isStarted = true;
        
        return this;
    }

    /**
     * Move forward by the specified number of grid units in current direction
     * @param {number} units - Number of grid units to move
     * @returns {TrackBuilder} For method chaining
     */
    forward(units) {
        if (!this._isStarted) {
            throw new Error('Path must be started first');
        }
        
        const delta = this._getDirectionDelta(this._currentDirection);
        this._currentX += delta.x * units;
        this._currentY += delta.y * units;
        
        // Convert to pixel coordinates for SVG
        const pixelX = this._currentX * this.gridSize;
        const pixelY = this._currentY * this.gridSize;
        
        this._pathCommands.push(`L ${pixelX} ${pixelY}`);
        this._debugSequence.push(`forward(${units})`);
        
        return this;
    }

    /**
     * Turn left (90 degrees counterclockwise) with smooth arc transition
     * @returns {TrackBuilder} For method chaining
     */
    turnLeft() {
        if (!this._isStarted) {
            throw new Error('Path must be started first');
        }
        
        const newDirection = this._turnLeft(this._currentDirection);
        this._addArcTransition(this._currentDirection, newDirection);
        this._currentDirection = newDirection;
        this._debugSequence.push('turnLeft()');
        
        return this;
    }

    /**
     * Turn right (90 degrees clockwise) with smooth arc transition
     * @returns {TrackBuilder} For method chaining
     */
    turnRight() {
        if (!this._isStarted) {
            throw new Error('Path must be started first');
        }
        
        const newDirection = this._turnRight(this._currentDirection);
        this._addArcTransition(this._currentDirection, newDirection);
        this._currentDirection = newDirection;
        this._debugSequence.push('turnRight()');
        
        return this;
    }

    /**
     * PRIVATE: Get direction delta vector for movement calculations
     * @param {string} direction - Direction constant
     * @returns {{x: number, y: number}} Direction vector
     * @private
     */
    _getDirectionDelta(direction) {
        switch (direction) {
            case Direction.NORTH: return { x: 0, y: -1 };
            case Direction.SOUTH: return { x: 0, y: 1 };
            case Direction.EAST: return { x: 1, y: 0 };
            case Direction.WEST: return { x: -1, y: 0 };
            default: throw new Error(`Unknown direction: ${direction}`);
        }
    }

    /**
     * PRIVATE: Turn left from current direction
     * @param {string} direction - Current direction
     * @returns {string} New direction after turning left
     * @private
     */
    _turnLeft(direction) {
        switch (direction) {
            case Direction.NORTH: return Direction.WEST;
            case Direction.WEST: return Direction.SOUTH;
            case Direction.SOUTH: return Direction.EAST;
            case Direction.EAST: return Direction.NORTH;
            default: throw new Error(`Unknown direction: ${direction}`);
        }
    }

    /**
     * PRIVATE: Turn right from current direction
     * @param {string} direction - Current direction
     * @returns {string} New direction after turning right
     * @private
     */
    _turnRight(direction) {
        switch (direction) {
            case Direction.NORTH: return Direction.EAST;
            case Direction.EAST: return Direction.SOUTH;
            case Direction.SOUTH: return Direction.WEST;
            case Direction.WEST: return Direction.NORTH;
            default: throw new Error(`Unknown direction: ${direction}`);
        }
    }

    /**
     * PRIVATE: Add smooth arc transition between directions
     * Creates quarter-circle arcs using proper SVG arcs and moves 1 unit in both directions
     * @param {string} fromDirection - Starting direction
     * @param {string} toDirection - Ending direction
     * @private
     */
    _addArcTransition(fromDirection, toDirection) {
        // Arc sweep direction mapping for quarter-circle transitions
        // SVG arc syntax: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
        // For quarter-circles: rx=ry=gridSize, x-axis-rotation=0, large-arc-flag=0
        const arcTransitions = {
            'east-north': { sweep: 0 },  // Clockwise turn (right turn going east)
            'east-south': { sweep: 1 },  // Counter-clockwise turn (left turn going east)
            'west-north': { sweep: 1 },  // Counter-clockwise turn (left turn going west)
            'west-south': { sweep: 0 },  // Clockwise turn (right turn going west)
            'north-east': { sweep: 1 },  // Counter-clockwise turn (right turn going north)
            'north-west': { sweep: 0 },  // Clockwise turn (left turn going north)
            'south-east': { sweep: 0 },  // Clockwise turn (left turn going south)
            'south-west': { sweep: 1 }   // Counter-clockwise turn (right turn going south)
        };

        const key = `${fromDirection}-${toDirection}`;
        const arcConfig = arcTransitions[key];

        if (!arcConfig) {
            throw new Error(`No arc transition defined for ${fromDirection} to ${toDirection}`);
        }

        const fromDelta = this._getDirectionDelta(fromDirection);
        const toDelta = this._getDirectionDelta(toDirection);

        // Move 1 unit in the from direction
        this._currentX += fromDelta.x;
        this._currentY += fromDelta.y;

        // Move 1 unit in the to direction  
        this._currentX += toDelta.x;
        this._currentY += toDelta.y;

        const endX = this._currentX * this.gridSize;
        const endY = this._currentY * this.gridSize;

        // Create SVG arc command: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
        // rx ry = gridSize (quarter circle radius)
        // x-axis-rotation = 0 (no rotation)
        // large-arc-flag = 0 (quarter circle, so small arc)
        // sweep-flag = determined by turn direction
        const arcCommand = `A ${this.gridSize} ${this.gridSize} 0 0 ${arcConfig.sweep} ${endX} ${endY}`;

        this._pathCommands.push(arcCommand);
    }

    /**
     * Get the current position in grid coordinates
     * @returns {{x: number, y: number, direction: string}} Current position and direction
     */
    getCurrentPosition() {
        return {
            x: this._currentX,
            y: this._currentY,
            direction: this._currentDirection
        };
    }

    /**
     * Get the current direction
     * @returns {string} Current direction
     */
    getCurrentDirection() {
        return this._currentDirection;
    }

    /**
     * Build and return the SVG path string, then reset the builder
     * @param {string} [debugId] - Optional debug ID for tracking
     * @returns {string} SVG path data
     */
    build(debugId = null) {
        if (!this._isStarted) {
            throw new Error('No path to build. Call start() first.');
        }
        const pathData = this._pathCommands.join(' ');
        // Reset the builder state
        this._isStarted = false;
        this._pathCommands = [];
        this._debugSequence = [];
        return pathData;
    }

    /**
     * Finish the current path and return SVG path element
     * @param {string} [debugId] - Optional debug ID for the path element
     * @param {string} [className='track'] - CSS class for the path
     * @returns {string} Complete SVG path element
     */
    finish(debugId = null, className = 'track') {
        if (!this._isStarted) {
            throw new Error('No path to finish. Call start() first.');
        }
        
        const pathData = this._pathCommands.join(' ');
        let pathElement = `<path d="${pathData}" class="${className}"`;
        
        if (debugId) {
            pathElement += ` data-id="${debugId}"`;
        }
        
        if (this._debugSequence.length > 0) {
            pathElement += ` data-seq="${this._debugSequence.join(' ')}"`;
        }
        
        pathElement += '/>';
        
        // If we have a render context, automatically add the path to its SVG
        if (this._renderContext) {
            this._renderContext.svg += pathElement;
        }
        
        // Reset the builder state
        this._isStarted = false;
        this._pathCommands = [];
        this._debugSequence = [];
        
        return pathElement;
    }

    /**
     * Generate the SVG path string (alias for build)
     * @returns {string} SVG path data
     */
    toString() {
        return this.build();
    }
}

module.exports = { TrackBuilder, Point, Direction };
