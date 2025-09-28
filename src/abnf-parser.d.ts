/**
 * Type definitions for ABNF Parser
 */

export interface ASTNode {
  /** Node type */
  type: 'textBox' | 'sequence' | 'stack' | 'bypass' | 'loop';
  /** Text content (for textBox nodes) */
  text?: string;
  /** Box type (for textBox nodes) */
  boxType?: 'terminal' | 'nonterminal';
  /** Child nodes (for container nodes) */
  elements?: ASTNode[];
  /** Single child node (for wrapper nodes) */
  element?: ASTNode;
}

export interface ParsedRule {
  /** Rule name (left-hand side of the rule) */
  name: string;
  /** Original ABNF rule definition */
  original: string;
  /** Generated AST representing the parsed rule */
  expression: ASTNode;
}

/**
 * Parser for ABNF grammar files with tokenizer-based parsing
 */
export declare class ABNFParser {
  /**
   * Create a new ABNF parser
   */
  constructor();

  /**
   * Parse an ABNF file content and extract rules
   * @param abnfContent The ABNF file content
   * @returns Parsed rules with original ABNF and AST
   */
  parse(abnfContent: string): Map<string, ParsedRule>;
}

export default ABNFParser;