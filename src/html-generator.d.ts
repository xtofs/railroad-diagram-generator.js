/**
 * Type definitions for HTML Generator
 */

export interface RuleDisplay {
  /** Rule name */
  name: string;
  /** Original ABNF definition */
  original: string;
  /** SVG diagram markup */
  svg: string;
}

/**
 * HTML generator for railroad diagram documents
 */
export declare class HTMLGenerator {
  /** Cached CSS content */
  cssContent: string | null;
  /** Compiled Handlebars template */
  template: Function | null;
  /** Whether assets have been loaded */
  assetsLoaded: boolean;

  /**
   * Create a new HTML generator
   */
  constructor();

  /**
   * Load CSS and template assets (called lazily)
   */
  loadAssets(): Promise<void>;

  /**
   * Generate complete HTML document with embedded SVG diagrams
   * @param rules Parsed ABNF rules
   * @param title Document title
   * @param svgContent Pre-rendered SVG content for each rule
   * @returns Complete HTML document
   */
  generateHTML(
    rules: Map<string, { original: string; railroad: string }>,
    title?: string,
    svgContent?: Map<string, string>
  ): Promise<string>;

  /**
   * Escape HTML special characters for safe output
   * @param str Input string to escape
   * @returns HTML-escaped string
   */
  escapeHtml(str: string): string;

  /**
   * Write HTML content to file, ensuring directory exists
   * @param html Complete HTML content to write
   * @param outputPath Output file path
   */
  writeHTML(html: string, outputPath: string): Promise<void>;
}

export default HTMLGenerator;