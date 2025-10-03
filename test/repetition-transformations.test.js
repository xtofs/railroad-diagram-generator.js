const { describe, test } = require('node:test');
const assert = require('node:assert');
const ABNFParser = require('../src/abnf-parser');
const ASTTransformer = require('../src/ast-transformer');
const { TerminalElement, NonterminalElement, SequenceElement, LoopElement, BypassElement, StackElement, LayoutElement } = require('../src/elements');

// Test helper functions to create layout elements from string descriptions
function terminal(text) { return new TerminalElement(text); }
function nonterminal(text) { return new NonterminalElement(text); }
function sequence(...children) { return new SequenceElement(children); }
function loop(child) { return new LoopElement(child); }
function bypass(child) { return new BypassElement(child); }
function stack(...children) { return new StackElement(children); }

/**
 * Helper function to create expected layout element from string description
 * @param {string} description - String like "loop(nonterminal('X'))"
 * @returns {LayoutElement} The corresponding layout element
 */
function expectLayout(description) {
    return eval(description);
}


/**
 * Tests for ABNF repetition syntax variations covering the complete transformation pipeline:
 * ABNF → AST → Layout Elements
 * 
 * Covers RFC 5234 repetition forms using data-driven tests
 */

// Test cases for all repetition patterns
const testCases = [

    // no bound
    ['*X', 'bypass(loop(nonterminal("X")))',                        'zero or more'],

    // no upper bound    
    ['0*X', 'bypass(loop(nonterminal("X")))',                        'zero or more'],
    ['1*X', 'loop(nonterminal("X"))',                               'one or more'],
    ['2*X', 'sequence(nonterminal("X"), loop(nonterminal("X")))',   'two or more'],
    
    ['1X', 'nonterminal("X")',                                      'exactly one (simplifies)'],
    ['4X', 'sequence(nonterminal("X"), nonterminal("X"), nonterminal("X"), nonterminal("X"))', 'exactly 4'],
    ['0X', 'sequence()', 'zero exactly (empty)'],
    
    // no lower bound
    ['*0X', 'sequence()',                                           'up to zero (nothing'],
    ['*1X', 'bypass(nonterminal("X"))',                             'up to 1 (optional)'],
    ['*2X', 'bypass(loop(nonterminal("X")))',                       'up to 2 but actually no upper bound'],
    
    
    // lower and upper bounds 
    // ['2*3X', 'loop(nonterminal("X"))', 'range 2-3'],
    ['2*3X', 'sequence(nonterminal("X"), loop(nonterminal("X")))', 'range 2-3 but actually 2-*'],
    
    // ['1*4X', 'loop(nonterminal("X"))', 'range 1-4'],     
    // ['0*1X', 'bypass(nonterminal("X"))', 'equivalent to *1X'],
    // ['0*X', 'loop(nonterminal("X"))', 'equivalent to *X'],
       
];

describe('Transformer Layer: AST Nodes → Layout Elements', () => {
    const parser = new ABNFParser();
    const transformer = new ASTTransformer();

    describe('Repetition Transformations', () => {
        testCases.forEach(([abnfPattern, expectedLayoutDesc, description]) => {
            test(`${abnfPattern} (${description})`, () => {
                const content = `rule = ${abnfPattern}`;
                const rules = parser.parse(content);
                const rule = rules.get('rule');
                
                const actualLayout = transformer.transform(rule.expression);
                const expectedLayout = expectLayout(expectedLayoutDesc);
                        
                assert.strictEqual(actualLayout.toString(), expectedLayout.toString());
            });
        });
    });
});