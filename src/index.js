/**
 * Main module exports for the railroad diagram generator
 * Provides clean public API for all classes and utilities
 */

// Core expression classes - abstract base class
const Expression = require('./expression');

// Text-based expressions
const TextBoxExpression = require('./text-box-expression');
const TerminalExpression = require('./terminal-expression');
const NonterminalExpression = require('./nonterminal-expression');

// Container expressions
const SequenceExpression = require('./sequence-expression');
const StackExpression = require('./stack-expression');
const BypassExpression = require('./bypass-expression');
const LoopExpression = require('./loop-expression');

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
    // Core expressions
    Expression,
    TextBoxExpression,
    TerminalExpression,
    NonterminalExpression,
    SequenceExpression,
    StackExpression,
    BypassExpression,
    LoopExpression,
    
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