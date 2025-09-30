const test = require('node:test');
const assert = require('node:assert');
const ABNFParser = require('../src/abnf-parser');
const { SVGRenderer } = require('../src/svg-renderer');

test('Repetition rendering - Original bug reproduction', () => {
    // This test reproduces the original bug where "8HEXDIG" showed as just "HEXDIG"
    const parser = new ABNFParser();
    const renderer = new SVGRenderer();
    
    const content = 'GUID = 8HEXDIG';
    const rules = parser.parse(content);
    const guidRule = rules.get('GUID');
    
    const svg = renderer.render(guidRule.expression);
    
    // Should render 8 separate HEXDIG elements, not just one
    const hexdigCount = (svg.match(/<text[^>]*>HEXDIG<\/text>/g) || []).length;
    assert.strictEqual(hexdigCount, 8, 'Should render 8 HEXDIG elements for 8HEXDIG');
    
    // Should contain sequence structure (multiple textbox elements)
    const textboxCount = (svg.match(/class="textbox-expression"/g) || []).length;
    assert.strictEqual(textboxCount, 8, 'Should have 8 textbox elements in sequence');
});

test('Repetition rendering - Various counts', () => {
    const parser = new ABNFParser();
    const renderer = new SVGRenderer();
    
    const testCases = [
        { rule: 'TEST1 = 1ALPHA', expectedCount: 1, note: '1ALPHA should show 1 element' },
        { rule: 'TEST2 = 2ALPHA', expectedCount: 2, note: '2ALPHA should show 2 elements' },
        { rule: 'TEST4 = 4ALPHA', expectedCount: 4, note: '4ALPHA should show 4 elements' },
        { rule: 'TEST12 = 12ALPHA', expectedCount: 12, note: '12ALPHA should show 12 elements' }
    ];
    
    testCases.forEach(testCase => {
        const rules = parser.parse(testCase.rule);
        const ruleName = testCase.rule.split(' ')[0];
        const rule = rules.get(ruleName);
        
        const svg = renderer.render(rule.expression);
        const alphaCount = (svg.match(/<text[^>]*>ALPHA<\/text>/g) || []).length;
        
        assert.strictEqual(alphaCount, testCase.expectedCount, testCase.note);
    });
});

test('Repetition vs simple nonterminal rendering', () => {
    const parser = new ABNFParser();
    const renderer = new SVGRenderer();
    
    // Compare "ALPHA" vs "1ALPHA" vs "4ALPHA"
    const simpleRule = parser.parse('SIMPLE = ALPHA').get('SIMPLE');
    const oneRule = parser.parse('ONE = 1ALPHA').get('ONE');  
    const fourRule = parser.parse('FOUR = 4ALPHA').get('FOUR');
    
    const simpleSvg = renderer.render(simpleRule.expression);
    const oneSvg = renderer.render(oneRule.expression);
    const fourSvg = renderer.render(fourRule.expression);
    
    // ALPHA and 1ALPHA should render identically (both show 1 element)
    const simpleCount = (simpleSvg.match(/<text[^>]*>ALPHA<\/text>/g) || []).length;
    const oneCount = (oneSvg.match(/<text[^>]*>ALPHA<\/text>/g) || []).length;
    const fourCount = (fourSvg.match(/<text[^>]*>ALPHA<\/text>/g) || []).length;
    
    assert.strictEqual(simpleCount, 1, 'ALPHA should show 1 element');
    assert.strictEqual(oneCount, 1, '1ALPHA should show 1 element'); 
    assert.strictEqual(fourCount, 4, '4ALPHA should show 4 elements');
    
    // SVG widths should be different (4ALPHA wider than ALPHA/1ALPHA)
    const simpleWidth = parseInt(simpleSvg.match(/width="(\d+)"/)[1]);
    const fourWidth = parseInt(fourSvg.match(/width="(\d+)"/)[1]);
    
    assert.ok(fourWidth > simpleWidth, '4ALPHA diagram should be wider than ALPHA diagram');
});