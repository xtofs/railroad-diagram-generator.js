/**
 * Type definitions for ABNF to Railroad Diagram Generator main module
 */

import { ABNFParser } from './abnf-parser';
import { SVGRenderer } from './svg-renderer';
import { HTMLGenerator } from './html-generator';

export interface ConversionOptions {
  /** Document title for generated HTML */
  title?: string;
}

export interface ConversionResult {
  /** Whether the conversion was successful */
  success: boolean;
  /** Number of rules processed (if successful) */
  rulesCount?: number;
  /** Path to output file (if successful) */
  outputFile?: string;
  /** Error message (if failed) */
  error?: string;
}

export interface ParsedRule {
  /** Original ABNF rule definition */
  original: string;
  /** Generated railroad diagram function calls */
  railroad: string;
}

/**
 * Main class for converting ABNF files to HTML railroad diagrams
 */
export declare class ABNFToRailroad {
  /** ABNF parser instance */
  parser: ABNFParser;
  /** SVG renderer instance */
  renderer: SVGRenderer;
  /** HTML generator instance */
  generator: HTMLGenerator;

  /**
   * Create a new ABNF to Railroad converter
   */
  constructor();

  /**
   * Parse ABNF file and return the AST
   * @param inputFile Path to ABNF file
   * @returns Parsed rules map
   * @throws If file cannot be read or no valid rules found
   */
  parse(inputFile: string): Promise<Map<string, ParsedRule>>;

  /**
   * Convert parsed rules to HTML with embedded SVG diagrams
   * @param rules Parsed ABNF rules
   * @param outputFile Path for output HTML file
   * @param options Generation options
   * @returns Conversion result
   */
  convertFromAST(
    rules: Map<string, ParsedRule>,
    outputFile: string,
    options?: ConversionOptions
  ): Promise<ConversionResult>;

  /**
   * Convert ABNF file to HTML with embedded SVG diagrams
   * @param inputFile Path to ABNF file
   * @param outputFile Path for output HTML file
   * @param options Generation options
   * @returns Conversion result
   */
  convert(
    inputFile: string,
    outputFile: string,
    options?: ConversionOptions
  ): Promise<ConversionResult>;

  /**
   * List all rules found in an ABNF file
   * @param inputFile Path to ABNF file
   * @returns Array of rule names, or empty array on error
   */
  listRules(inputFile: string): Promise<string[]>;
}

export default ABNFToRailroad;