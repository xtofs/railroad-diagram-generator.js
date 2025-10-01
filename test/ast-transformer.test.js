const test = require('node:test');
const assert = require('node:assert');
const ASTTransformer = require('../src/ast-transformer');
const { TerminalElement, NonterminalElement, SequenceElement } = require('../src/elements');

test('ASTTransformer - Constructor without config', () => {
    const transformer = new ASTTransformer();
    assert.ok(transformer);
    // Should not throw - no config needed in three-phase architecture
});

test('ASTTransformer - Terminal transformation', () => {
    const transformer = new ASTTransformer();
    
    const terminalAST = {
        type: 'terminal',
        text: '"hello"' // Literal ABNF syntax
    };
    
    const expression = transformer.transform(terminalAST);
    assert.ok(expression instanceof TerminalElement);
    assert.strictEqual(expression.text, '"hello"'); // Should preserve literal syntax
    assert.strictEqual(expression.isLaidOut, false); // Should not be laid out yet
});

test('ASTTransformer - Nonterminal transformation', () => {
    const transformer = new ASTTransformer();
    
    const nonterminalAST = {
        type: 'nonterminal',
        text: 'HEXDIG'
    };
    
    const expression = transformer.transform(nonterminalAST);
    assert.ok(expression instanceof NonterminalElement);
    assert.strictEqual(expression.text, 'HEXDIG');
    assert.strictEqual(expression.isLaidOut, false); // Should not be laid out yet
});

test('ASTTransformer - Repetition transformation to sequence', () => {
    const transformer = new ASTTransformer();
    
    const repetitionAST = {
        type: 'repetition',
        min: 4,
        max: 4,
        elements: [{
            type: 'nonterminal',
            text: 'HEXDIG'
        }]
    };
    
    const expression = transformer.transform(repetitionAST);
    
    // Should create a sequence of 4 identical elements
    assert.ok(expression instanceof SequenceElement);
    assert.strictEqual(expression.children.length, 4);
    
    // All children should be HEXDIG nonterminals
    expression.children.forEach(child => {
        assert.ok(child instanceof NonterminalElement);
        assert.strictEqual(child.text, 'HEXDIG');
        assert.strictEqual(child.isLaidOut, false);
    });
});

test('ASTTransformer - Large repetition (8HEXDIG)', () => {
    const transformer = new ASTTransformer();
    
    const repetitionAST = {
        type: 'repetition',
        min: 8,
        max: 8,
        elements: [{
            type: 'nonterminal',
            text: 'HEXDIG'
        }]
    };
    
    const expression = transformer.transform(repetitionAST);
    
    // Should create a sequence of 8 identical elements
    assert.ok(expression instanceof SequenceElement);
    assert.strictEqual(expression.children.length, 8);
});