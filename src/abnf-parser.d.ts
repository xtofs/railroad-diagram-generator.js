/**
 * Type definitions for ABNF Parser
 */

export interface DiagramElement {
  /** Element type */
  type: 'textBox' | 'sequence' | 'stack' | 'bypass' | 'loop';
  /** Text content (for textBox) */
  text?: string;
  /** Box type (for textBox) */
  boxType?: 'terminal' | 'nonterminal';
  /** Child elements (for containers) */
  elements?: DiagramElement[];
  /** Single child element (for wrappers) */
  element?: DiagramElement;
}

export interface ParsedRule {
  /** Original ABNF rule definition */
  original: string;
  /** Generated railroad diagram element tree */
  railroad: DiagramElement;
}

/**
 * Parser for ABNF grammar files
 */
export declare class ABNFParser {
  /** Map of rule names to parsed rule data */
  rules: Map<string, ParsedRule>;

  /**
   * Create a new ABNF parser
   */
  constructor();

  /**
   * Parse an ABNF file content and extract rules
   * @param abnfContent The ABNF file content
   * @returns Parsed rules with original ABNF and DiagramElement tree
   */
  parse(abnfContent: string): Map<string, ParsedRule>;

  /**
   * Parse a single rule definition and convert to DiagramElement tree
   * @param definition The ABNF rule definition
   * @returns Rule object with original definition and DiagramElement tree
   */
  parseDefinition(definition: string): ParsedRule;

  /**
   * Convert ABNF definition to DiagramElement object
   * @param definition ABNF rule definition
   * @returns DiagramElement object representing the rule
   */
  convertToRailroad(definition: string): DiagramElement;

  /**
   * Split definition by alternatives, respecting parentheses and quotes
   * @param definition ABNF definition with alternatives
   * @returns Array of alternative definitions
   */
  splitAlternatives(definition: string): string[];

  /**
   * Parse a sequence of elements, respecting parentheses and quotes
   * @param definition ABNF definition to parse into sequence
   * @returns Array of sequence elements
   */
  parseSequence(definition: string): string[];

  /**
   * Convert a single ABNF element to DiagramElement object
   * @param element ABNF element (terminal, non-terminal, or special construct)
   * @returns DiagramElement object representing the element
   */
  convertElement(element: string): DiagramElement;

  /**
   * Get all parsed rules
   * @returns All parsed rules with original ABNF and DiagramElement tree
   */
  getRules(): Map<string, ParsedRule>;
}

export default ABNFParser;