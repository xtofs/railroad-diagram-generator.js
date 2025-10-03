const { describe, test } = require('node:test');
const assert = require('node:assert');
const ABNFParser = require('../src/abnf-parser');
const { 
    TerminalNode, 
    NonterminalNode, 
    SequenceNode, 
    AlternationNode, 
    OptionalNode, 
    RepetitionNode 
} = require('../src/ast-node');

/**
 * Factory functions for cleaner test syntax
 */
const terminal = (text) => new TerminalNode(text);
const nonterminal = (name) => new NonterminalNode(name);
const sequence = (children) => new SequenceNode(children);
const alternation = (children) => new AlternationNode(children);
const optional = (child) => new OptionalNode(child);
const repetition = (min, max, child) => new RepetitionNode(min, max, child);

/**
 * Comprehensive data-driven tests for ABNF text → ASTNode transformation
 * Tests the parser layer in isolation using clean factory function syntax
 */

const parser = new ABNFParser();

describe('Parser: Basic Elements', () => {
        const basicTestCases = [
            // Terminals
            ['rule = "hello"', terminal('"hello"'), 'quoted terminal'],
            ['rule = hello', nonterminal('hello'), 'nonterminal reference'],
        ];
        
        basicTestCases.forEach(([abnfRule, expectedAstNode, description]) => {
            test(`${abnfRule} (${description})`, () => {
                const rules = parser.parse(abnfRule);
                const rule = rules.get('rule');
                
                assert.deepStrictEqual(rule.expression, expectedAstNode);
            });
        });
});

describe('Parser: Sequences', () => {
    const sequenceTestCases = [
            [
                'rule = "a" "b"', 
                sequence([
                    terminal('"a"'), 
                    terminal('"b"')
                ]), 
                'terminal sequence'
            ],
            [
                'rule = A B C', 
                sequence([
                    nonterminal('A'), 
                    nonterminal('B'), 
                    nonterminal('C')
                ]), 
                'nonterminal sequence'
            ],
    ];
    
    sequenceTestCases.forEach(([abnfRule, expectedAstNode, description]) => {
        test(`${abnfRule} (${description})`, () => {
            const rules = parser.parse(abnfRule);
            const rule = rules.get('rule');
            
            assert.deepStrictEqual(rule.expression, expectedAstNode);
        });
    });
});

describe('Parser: Alternations', () => {
    const alternationTestCases = [
            [
                'rule = "a" / "b"', 
                alternation([
                    terminal('"a"'), 
                    terminal('"b"')
                ]), 
                'terminal alternation'
            ],
            [
                'rule = A / B / C', 
                alternation([
                    nonterminal('A'), 
                    nonterminal('B'), 
                    nonterminal('C')
                ]), 
                'nonterminal alternation'
            ],
    ];
    
    alternationTestCases.forEach(([abnfRule, expectedAstNode, description]) => {
        test(`${abnfRule} (${description})`, () => {
            const rules = parser.parse(abnfRule);
            const rule = rules.get('rule');
            
            assert.deepStrictEqual(rule.expression, expectedAstNode);
        });
    });
});

describe('Parser: Optional Elements', () => {
    const optionalTestCases = [
            [
                'rule = ["optional"]', 
                optional(terminal('"optional"')), 
                'optional terminal'
            ],
            [
                'rule = [A]', 
                optional(nonterminal('A')), 
                'optional nonterminal'
            ],
    ];
    
    optionalTestCases.forEach(([abnfRule, expectedAstNode, description]) => {
        test(`${abnfRule} (${description})`, () => {
            const rules = parser.parse(abnfRule);
            const rule = rules.get('rule');
            
            assert.deepStrictEqual(rule.expression, expectedAstNode);
        });
    });
});

describe('Parser: Repetition Patterns', () => {
    const repetitionTestCases = [
            // No bounds
            ['rule = *A', repetition(0, null, nonterminal('A')), 'zero or more'],
            
            // No upper bound
            ['rule = 0*A', repetition(0, null, nonterminal('A')), 'zero or more explicit'],
            ['rule = 1*A', repetition(1, null, nonterminal('A')), 'one or more'],
            ['rule = 2*A', repetition(2, null, nonterminal('A')), 'two or more'],
            
            // Exact count (including 1A which creates repetition at parser level)
            ['rule = 1A', repetition(1, 1, nonterminal('A')), 'exactly one (not simplified at parser level)'],
            ['rule = 4A', repetition(4, 4, nonterminal('A')), 'exactly four'],
            ['rule = 8A', repetition(8, 8, nonterminal('A')), 'exactly eight'],
            ['rule = 12A', repetition(12, 12, nonterminal('A')), 'exactly twelve'],
            ['rule = 0A', repetition(0, 0, nonterminal('A')), 'exactly zero'],
            
            // No lower bound  
            ['rule = *0A', repetition(0, 0, nonterminal('A')), 'up to zero'],
            ['rule = *1A', repetition(0, 1, nonterminal('A')), 'up to one'],
            ['rule = *2A', repetition(0, 2, nonterminal('A')), 'up to two'],
            
            // Ranges
            ['rule = 2*3A', repetition(2, 3, nonterminal('A')), 'range two to three'],
            ['rule = 1*4A', repetition(1, 4, nonterminal('A')), 'range one to four'],
            ['rule = 0*1A', repetition(0, 1, nonterminal('A')), 'range zero to one'],
    ];
    
    repetitionTestCases.forEach(([abnfRule, expectedAstNode, description]) => {
        test(`${abnfRule} (${description})`, () => {
            const rules = parser.parse(abnfRule);
            const rule = rules.get('rule');
            
            assert.deepStrictEqual(rule.expression, expectedAstNode);
        });
    });
});

describe('Parser: Complex Nested Structures', () => {
    const complexTestCases = [
            [
                'rule = A [B] C', 
                sequence([
                    nonterminal('A'), 
                    optional(nonterminal('B')), 
                    nonterminal('C')
                ]), 
                'sequence with optional'
            ],
            [
                'rule = *("," A)', 
                repetition(0, null, sequence([
                    terminal('","'), 
                    nonterminal('A')
                ])), 
                'repetition of sequence'
            ],
            [
                'GUID = 8HEXDIG 4HEXDIG 12HEXDIG',
                sequence([
                    repetition(8, 8, nonterminal('HEXDIG')),
                    repetition(4, 4, nonterminal('HEXDIG')),
                    repetition(12, 12, nonterminal('HEXDIG'))
                ]),
                'complex GUID structure'
            ],
    ];
    
    complexTestCases.forEach(([abnfRule, expectedAstNode, description]) => {
        test(`${abnfRule} (${description})`, () => {
            const rules = parser.parse(abnfRule);
            const ruleName = abnfRule.split(' ')[0];
            const rule = rules.get(ruleName);
            
            assert.deepStrictEqual(rule.expression, expectedAstNode);
        });
    });
});

describe('Parser: Tokenization Edge Cases', () => {
test('8HEXDIG tokenizes correctly', () => {
        const tokens = parser.tokenizer.tokenize('8HEXDIG');
        
        assert.strictEqual(tokens.length, 2);
        assert.strictEqual(tokens[0].type, 'repetition');
        assert.strictEqual(tokens[0].value, '8');
        assert.strictEqual(tokens[1].type, 'identifier');
        assert.strictEqual(tokens[1].value, 'HEXDIG');
    });
});