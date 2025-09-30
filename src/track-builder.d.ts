/**
 * Type definitions for Track Builder
 */

export interface BranchConfig {
  /** Branch X coordinate */
  x: number;
  /** Branch Y coordinate */
  y: number;
  /** Branch width in pixels */
  width: number;
}

export interface BypassConfig {
  /** Start X coordinate */
  startX: number;
  /** Start Y coordinate */
  startY: number;
  /** Width of bypassed element */
  elementWidth: number;
  /** Vertical offset for bypass */
  bypassOffset: number;
}

export interface LoopConfig {
  /** Start X coordinate */
  startX: number;
  /** End X coordinate */
  endX: number;
  /** Baseline Y coordinate */
  baselineY: number;
  /** Vertical offset for loop */
  loopOffset: number;
}

/**
 * Represents a point in 2D space
 */
export declare class Point {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;

  /**
   * Create a new point
   * @param x X coordinate
   * @param y Y coordinate
   */
  constructor(x: number, y: number);

  /**
   * Add another point to this point
   * @param other Point to add
   * @returns New point with added coordinates
   */
  add(other: Point): Point;

  /**
   * Subtract another point from this point
   * @param other Point to subtract
   * @returns New point with subtracted coordinates
   */
  subtract(other: Point): Point;

  /**
   * Convert point to string representation
   * @returns String in format "x,y"
   */
  toString(): string;
}

/**
 * Direction constants for track movement
 */
export declare const Direction: {
  /** North direction (up) */
  readonly NORTH: Point;
  /** South direction (down) */
  readonly SOUTH: Point;
  /** East direction (right) */
  readonly EAST: Point;
  /** West direction (left) */
  readonly WEST: Point;
};

/**
 * Track builder with fluent API
 */
export declare class TrackBuilder {
  /** Grid size in pixels */
  gridSize: number;

  /**
   * Create a new track builder
   * @param gridSize Grid size in pixels
   */
  constructor(gridSize?: number);

  /**
   * Start a new path at the given position
   * @param x X coordinate in pixels
   * @param y Y coordinate in pixels
   * @param direction Initial direction
   * @returns For method chaining
   */
  start(x: number, y: number, direction?: Point): this;

  /**
   * Move forward by the specified number of grid units in current direction
   * @param units Number of grid units to move
   * @returns For method chaining
   */
  forward(units: number): this;

  /**
   * Turn left (90 degrees counterclockwise) with smooth arc transition
   * @returns For method chaining
   */
  turnLeft(): this;

  /**
   * Turn right (90 degrees clockwise) with smooth arc transition
   * @returns For method chaining
   */
  turnRight(): this;

  /**
   * Move straight in the current direction
   * Create a smooth curve to the target position
  /**
   * Get the current position
   * @returns Current position
   */
  getCurrentPosition(): Point;

  /**
   * Get the current direction
   * @returns Current direction
   */
  getCurrentDirection(): Point;

  /**
   * Build and return the SVG path string
   * @returns SVG path data
   */
  build(): string;

  /**
   * Generate the SVG path string (alias for build)
   * @returns SVG path data
   */
  toString(): string;

  /**
   * Finish the current path and return SVG path element
   * @param debugId Optional debug ID for the path element
   * @param className CSS class for the path
   * @returns Complete SVG path element
   */
  finish(debugId?: string, className?: string): string;
}

/**
 * Track routing utilities for common patterns
 */
export declare class TrackRouter {
  /** Grid size in pixels */
  gridSize: number;

  /**
   * Create a new track router
   * @param gridSize Grid size in pixels
   */
  constructor(gridSize: number);

  /**
   * Create a bypass track (optional path that rejoins the main line)
   * @param params Parameters object
   * @returns SVG path data
   */
  static bypassTrack(params: BypassConfig): string;

  /**
   * Create a loop-back track for repetition
   * @param params Parameters object
   * @returns SVG path data
   */
  static loopTrack(params: LoopConfig): string;

  /**
   * Create branching tracks for alternatives
   * @param params Parameters object with startX, startY, and branches array
   * @returns Array of SVG path data strings
   */
  static branchTracks(params: { startX: number; startY: number; branches: BranchConfig[] }): string[];

  /**
   * Create a straight horizontal track
   * @param startX Start X coordinate
   * @param y Y coordinate
   * @param endX End X coordinate
   * @returns SVG path element
   */
  straightHorizontal(startX: number, y: number, endX: number): string;

  /**
   * Create a straight vertical track
   * @param x X coordinate
   * @param startY Start Y coordinate
   * @param endY End Y coordinate
   * @returns SVG path element
   */
  straightVertical(x: number, startY: number, endY: number): string;

  /**
   * Create a smooth curve connecting two horizontal levels
   * @param startX Start X coordinate
   * @param startY Start Y coordinate
   * @param endX End X coordinate
   * @param endY End Y coordinate
   * @returns SVG path element
   */
  smoothCurve(startX: number, startY: number, endX: number, endY: number): string;

  /**
   * Create a bypass track (optional path that rejoins the main line)
   * @param startX Start X coordinate
   * @param mainY Main track Y coordinate
   * @param endX End X coordinate
   * @param bypassOffset Vertical offset for bypass (in grid units)
   * @returns SVG path element
   */
  bypassTrack(startX: number, mainY: number, endX: number, bypassOffset?: number): string;

  /**
   * Create a loop-back track for repetition
   * @param startX Start X coordinate
   * @param mainY Main track Y coordinate
   * @param endX End X coordinate
   * @param loopOffset Vertical offset for loop (in grid units)
   * @returns SVG path element
   */
  loopTrack(startX: number, mainY: number, endX: number, loopOffset?: number): string;

  /**
   * Create branching tracks for alternatives
   * @param startX Start X coordinate
   * @param mainY Main track Y coordinate
   * @param branchY Branch Y coordinate
   * @param branchLength Length of branch in grid units
   * @returns Object with 'down' and 'up' path elements
   */
  branchTracks(startX: number, mainY: number, branchY: number, branchLength: number): {
    down: string;
    up: string;
  };
}

export { TrackBuilder, TrackRouter, Point, Direction };