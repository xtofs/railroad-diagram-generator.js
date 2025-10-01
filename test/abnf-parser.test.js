const test = require('node:test');
const assert = require('node:assert');
const ABNFParser = require('../src/abnf-parser');
const { SVGRenderer } = require('../src/svg-renderer');
const ASTTransformer = require('../src/ast-transformer');

test('ABNF Parser - Repetition tokenization', () => {
    const parser = new ABNFParser();
    
    // Test that "8HEXDIG" tokenizes correctly
    const tokens = parser.tokenizer.tokenize('8HEXDIG');
    
    assert.strictEqual(tokens.length, 2);
    assert.strictEqual(tokens[0].type, 'number');
    assert.strictEqual(tokens[0].value, '8');
    assert.strictEqual(tokens[1].type, 'identifier');
    assert.strictEqual(tokens[1].value, 'HEXDIG');
});

test('ABNF Parser - Repetition AST generation', () => {
    const parser = new ABNFParser();
    
    // Test repetition patterns that create repetition nodes (count > 1)
    const repetitionTestCases = [
        { input: 'rule = 4HEXDIG', min: 4, max: 4 },
        { input: 'rule = 8HEXDIG', min: 8, max: 8 },
        { input: 'rule = 12HEXDIG', min: 12, max: 12 }
    ];
    
    repetitionTestCases.forEach(testCase => {
        const rules = parser.parse(testCase.input);
        const rule = rules.get('rule');
        
        assert.strictEqual(rule.expression.type, 'repetition');
        assert.strictEqual(rule.expression.min, testCase.min);
        assert.strictEqual(rule.expression.max, testCase.max);
        assert.strictEqual(rule.expression.elements[0].type, 'nonterminal');
    });
    
    // Test 1DIGIT - should be simplified to just DIGIT (no repetition node)
    const rules = parser.parse('rule = 1DIGIT');
    const rule = rules.get('rule');
    assert.strictEqual(rule.expression.type, 'nonterminal');
    assert.strictEqual(rule.expression.text, 'DIGIT');
});

test('ABNF Parser - Complex GUID rule', () => {
    const parser = new ABNFParser();
    const content = 'GUID = 8HEXDIG 4HEXDIG 12HEXDIG';
    
    const rules = parser.parse(content);
    const guidRule = rules.get('GUID');
    
    // Should be a sequence of three repetition elements
    assert.strictEqual(guidRule.expression.type, 'sequence');
    assert.strictEqual(guidRule.expression.elements.length, 3);
    
    // First element: 8HEXDIG
    assert.strictEqual(guidRule.expression.elements[0].type, 'repetition');
    assert.strictEqual(guidRule.expression.elements[0].min, 8);
    assert.strictEqual(guidRule.expression.elements[0].max, 8);
    
    // Second element: 4HEXDIG
    assert.strictEqual(guidRule.expression.elements[1].type, 'repetition');
    assert.strictEqual(guidRule.expression.elements[1].min, 4);
    assert.strictEqual(guidRule.expression.elements[1].max, 4);
    
    // Third element: 12HEXDIG
    assert.strictEqual(guidRule.expression.elements[2].type, 'repetition');
    assert.strictEqual(guidRule.expression.elements[2].min, 12);
    assert.strictEqual(guidRule.expression.elements[2].max, 12);
});