/**
 * Barrel exports for all Element classes
 * 
 * This file provides a convenient way to import multiple Element classes
 * in a single require statement, reducing import boilerplate in tests and other files.
 * 
 * Usage:
 *   const { SequenceElement, TerminalElement, NonterminalElement } = require('./elements');
 *   const Elements = require('./elements'); // Import all as namespace
 */

// Base element class
const LayoutElement = require('./element');

// Text-based elements  
const { TextBoxElement } = require('./text-box-element');
const TerminalElement = require('./terminal-element');
const NonterminalElement = require('./nonterminal-element');

// Container elements
const SequenceElement = require('./sequence-element');
const StackElement = require('./stack-element');
const BypassElement = require('./bypass-element');
const LoopElement = require('./loop-element');

// Export all elements for convenient importing
module.exports = {
    // Base class
    LayoutElement,
    
    // Text elements
    TextBoxElement,
    TerminalElement,
    NonterminalElement,
    
    // Container elements
    SequenceElement,
    StackElement,
    BypassElement,
    LoopElement
};