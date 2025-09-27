/**
 * Type definitions for SVG Renderer
 */

export interface RenderContext {
  /** Accumulated SVG markup */
  svg: string;
  /** Current X position */
  x: number;
  /** Current Y position */
  y: number;
  /** Grid size in pixels */
  gridSize: number;
  /** Track builder instance for creating rail paths */
  trackBuilder: any; // RailPathBuilder type would need to be imported
}

export interface RenderConfig {
  /** Grid size in pixels */
  gridSize: number;
  /** Font size in pixels */
  fontSize: number;
  /** Track width in pixels */
  trackWidth: number;
  /** Text border width in pixels */
  textBorder: number;
  /** Border radius for terminal elements */
  terminalRadius: number;
  /** Border radius for nonterminal elements */
  nonterminalRadius: number;
}

export interface DiagramElement {
  /** Element type ('textBox', 'sequence', 'stack', 'bypass', 'loop') */
  type: string;
  /** Text content (for textBox) */
  text?: string;
  /** Box type ('terminal' or 'nonterminal') */
  boxType?: string;
  /** Child elements (for containers) */
  elements?: DiagramElement[];
  /** Single child element (for wrappers) */
  element?: DiagramElement;
}

/**
 * Abstract base class for all diagram expressions
 * Layout is calculated in constructors since it's strictly bottom-up
 */
export declare abstract class Expression {
  /** Width in grid units */
  width: number;
  /** Height in grid units */
  height: number;
  /** Baseline position in grid units */
  baseline: number;

  constructor();

  /**
   * Render the expression to SVG - must be implemented by subclasses
   * @param ctx Rendering context
   * @param config Grid and style configuration
   */
  abstract render(ctx: RenderContext, config: RenderConfig): void;
}

/**
 * Text box expression (terminal or nonterminal)
 */
export declare class TextBoxExpression extends Expression {
  /** Text to display */
  text: string;
  /** Box type */
  boxType: 'terminal' | 'nonterminal';

  /**
   * Create a text box expression
   * @param text Text to display in the box
   * @param boxType Type of text box
   */
  constructor(text: string, boxType?: 'terminal' | 'nonterminal');

  render(ctx: RenderContext, config: RenderConfig): void;

  /**
   * Escape XML special characters for safe SVG output
   * @param str Input string or number to escape
   * @returns XML-escaped string
   */
  escapeXml(str: string | number): string;
}

/**
 * Sequence expression (elements in sequence)
 */
export declare class SequenceExpression extends Expression {
  /** Child expressions */
  children: Expression[];

  /**
   * Create a sequence expression
   * @param elements Array of child expressions to render in sequence
   */
  constructor(elements: Expression[]);

  render(ctx: RenderContext, config: RenderConfig): void;
}

/**
 * Stack expression (alternatives)
 */
export declare class StackExpression extends Expression {
  /** Child expressions */
  children: Expression[];

  /**
   * Create a stack expression for alternative paths
   * @param elements Array of alternative expressions
   */
  constructor(elements: Expression[]);

  render(ctx: RenderContext, config: RenderConfig): void;
}

/**
 * Bypass expression (optional element)
 */
export declare class BypassExpression extends Expression {
  /** Child expression */
  child: Expression;

  /**
   * Create a bypass expression for optional elements
   * @param element The element that can be bypassed
   */
  constructor(element: Expression);

  render(ctx: RenderContext, config: RenderConfig): void;
}

/**
 * Loop expression (repetition)
 */
export declare class LoopExpression extends Expression {
  /** Child expression */
  child: Expression;

  /**
   * Create a loop expression for repeating elements
   * @param element The element to repeat
   */
  constructor(element: Expression);

  render(ctx: RenderContext, config: RenderConfig): void;
}

/**
 * SVG renderer for railroad diagrams
 */
export declare class SVGRenderer {
  /** Grid size in pixels */
  gridSize: number;
  /** Font size in pixels */
  fontSize: number;
  /** Track width in pixels */
  trackWidth: number;
  /** Text border width in pixels */
  textBorder: number;
  /** Border radius for terminal elements */
  terminalRadius: number;
  /** Border radius for nonterminal elements */
  nonterminalRadius: number;

  /**
   * Create an SVG renderer with default configuration
   */
  constructor();

  /**
   * Create an expression instance from a diagram definition
   * @param element Diagram element definition
   * @returns Expression instance
   * @throws If element type is unknown
   */
  createExpression(element: DiagramElement): Expression;

  /**
   * Render a railroad diagram to SVG
   * @param diagramElement DiagramElement object defining the railroad diagram
   * @param ruleName Name of the rule for error reporting
   * @returns SVG markup or error message
   */
  renderSVG(diagramElement: DiagramElement, ruleName?: string): string;

  /**
   * Generate complete SVG markup from expression tree
   * @param expression Root expression to render
   * @param ruleName Name of the rule for debugging
   * @returns Complete SVG markup
   */
  generateSVG(expression: Expression, ruleName: string): string;

  /**
   * Escape XML special characters for safe SVG output
   * @param str Input string or number to escape
   * @returns XML-escaped string
   */
  escapeXml(str: string | number): string;

  /**
   * Render multiple railroad diagrams from parsed ABNF rules
   * @param rules Parsed ABNF rules
   * @returns Map of rule names to SVG content
   */
  renderAllSVGs(rules: Map<string, { original: string; railroad: DiagramElement }>): Promise<Map<string, string>>;
}

export default SVGRenderer;