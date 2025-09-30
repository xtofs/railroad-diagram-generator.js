/**
 * Main module exports for the railroad diagram generator
 * Provides clean public API for all classes and utilities
 */

// All element classes via barrel export
const {
    Element,
    TextBoxElement,
    TerminalElement,
    NonterminalElement,
    SequenceElement,
    StackElement,
    BypassElement,
    LoopElement
} = require('./elements');

// Rendering classes
const RenderContext = require('./render-context');
const { SVGRenderer } = require('./svg-renderer');

// Railroad track building utilities
const { TrackBuilder, Direction } = require('./track-builder');

// HTML generation (legacy compatibility)
const HtmlGenerator = require('./html-generator');

// ABNF parsing (legacy compatibility)
const AbnfParser = require('./abnf-parser');

// Export everything for maximum flexibility
module.exports = {
    // Core elements
    Element,
    TextBoxElement,
    TerminalElement,
    NonterminalElement,
    SequenceElement,
    StackElement,
    BypassElement,
    LoopElement,
    
    // Rendering
    RenderContext,
    SVGRenderer,
    
    // Utilities
    TrackBuilder,
    Direction,
    
    // Legacy API compatibility
    HtmlGenerator,
    AbnfParser
};