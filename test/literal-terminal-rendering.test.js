const test = require('node:test');
const assert = require('node:assert');
const ABNFParser = require('../src/abnf-parser');

test('Literal terminal rendering - Quoted strings', () => {
    const parser = new ABNFParser();
    
    const abnfContent = `
        simple-string = "hello"
        case-sensitive = %s"Hello"  
        case-insensitive = %i"WORLD"
        single-quote = 'test'
        single-case-sensitive = %s'Test'
        single-case-insensitive = %i'TEST'
    `;
    
    const rules = parser.parse(abnfContent);
    
    // Verify literal ABNF syntax is preserved  
    /** @type {any} */ const simpleRule = rules.get('simple-string');
    /** @type {any} */ const caseSensitiveRule = rules.get('case-sensitive');
    /** @type {any} */ const caseInsensitiveRule = rules.get('case-insensitive');
    /** @type {any} */ const singleQuoteRule = rules.get('single-quote');
    /** @type {any} */ const singleCaseSensitiveRule = rules.get('single-case-sensitive');
    /** @type {any} */ const singleCaseInsensitiveRule = rules.get('single-case-insensitive');
    
    assert.strictEqual(simpleRule.expression.text, '"hello"');
    assert.strictEqual(caseSensitiveRule.expression.text, '%s"Hello"');
    assert.strictEqual(caseInsensitiveRule.expression.text, '%i"WORLD"');
    assert.strictEqual(singleQuoteRule.expression.text, "'test'");
    assert.strictEqual(singleCaseSensitiveRule.expression.text, "%s'Test'");
    assert.strictEqual(singleCaseInsensitiveRule.expression.text, "%i'TEST'");
    
    // No categorization properties - just literal ABNF syntax preservation
});

test('Literal terminal rendering - Hex values', () => {
    const parser = new ABNFParser();
    
    const abnfContent = `
        hex-single = %x41
        hex-range = %x41-5A
        hex-concat = %x41.42.43
    `;
    
    /** @type {Map<string, any>} */
    const rules = parser.parse(abnfContent);
    
    // Verify literal ABNF syntax is preserved
    assert.strictEqual(rules.get('hex-single').expression.text, '%x41');
    assert.strictEqual(rules.get('hex-range').expression.text, '%x41-5A');
    assert.strictEqual(rules.get('hex-concat').expression.text, '%x41.42.43');
    
    // No categorization properties - just literal ABNF syntax preservation
});

test('Literal terminal rendering - Decimal values', () => {
    const parser = new ABNFParser();
    
    const abnfContent = `
        dec-single = %d65
        dec-range = %d65-90
        dec-concat = %d65.66.67
    `;
    
    /** @type {Map<string, import('../src/abnf-parser').ParsedRule>} */
    const rules = parser.parse(abnfContent);
    
    // Verify literal ABNF syntax is preserved
    assert.strictEqual(rules.get('dec-single').expression.text, '%d65');
    assert.strictEqual(rules.get('dec-range').expression.text, '%d65-90');
    assert.strictEqual(rules.get('dec-concat').expression.text, '%d65.66.67');
    
    // No categorization properties - just literal ABNF syntax preservation
});

test('Literal terminal rendering - End-to-end pipeline', () => {
    const parser = new ABNFParser();
    
    const abnfContent = `
        test-rule = %s"Hello" / %i"WORLD" / %x41-5A / %d65-90
    `;
    
    /** @type {Map<string, any>} */
    const rules = parser.parse(abnfContent);
    const rule = rules.get('test-rule');
    
    // Should be a stack (alternation) with 4 terminal children
    assert.strictEqual(rule.expression.type, 'stack');
    assert.strictEqual(rule.expression.elements.length, 4);
    
    const terminals = rule.expression.elements;
    
    // Verify each terminal preserves literal ABNF syntax
    assert.strictEqual(terminals[0].text, '%s"Hello"');
    assert.strictEqual(terminals[1].text, '%i"WORLD"');
    assert.strictEqual(terminals[2].text, '%x41-5A');
    assert.strictEqual(terminals[3].text, '%d65-90');
});