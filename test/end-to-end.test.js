const test = require('node:test');
const assert = require('node:assert');
const ABNFParser = require('../src/abnf-parser');
const { SVGRenderer } = require('../src/svg-renderer');

test('End-to-end pipeline - Simple repetition', () => {
    const parser = new ABNFParser();
    const renderer = new SVGRenderer();
    
    const content = 'RULE = 4HEXDIG';
    const rules = parser.parse(content);
    const rule = rules.get('RULE');
    
    // Should generate SVG without throwing
    const svg = renderer.render(rule.expression);
    
    assert.ok(typeof svg === 'string');
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('</svg>'));
    assert.ok(svg.length > 1000); // Should be substantial SVG content
});

test('End-to-end pipeline - Complex GUID rule', () => {
    const parser = new ABNFParser();
    const renderer = new SVGRenderer();
    
    const content = 'GUID = 8HEXDIG 4HEXDIG 12HEXDIG';
    const rules = parser.parse(content);
    const guidRule = rules.get('GUID');
    
    // Should generate SVG for complex sequence with repetitions
    const svg = renderer.render(guidRule.expression);
    
    assert.ok(typeof svg === 'string');
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('</svg>'));
    
    // Should contain multiple HEXDIG references (8 + 4 + 12 = 24 total)
    // Count only the text elements, not the data attributes
    const hexdigTextMatches = (svg.match(/<text[^>]*>HEXDIG<\/text>/g) || []).length;
    assert.strictEqual(hexdigTextMatches, 24); // Should have 24 HEXDIG text elements
});

test('End-to-end pipeline - Layout then render', () => {
    const parser = new ABNFParser();
    const renderer = new SVGRenderer();
    
    const content = 'TEST = 2ALPHA';
    const rules = parser.parse(content);
    const testRule = rules.get('TEST');
    
    // Generate SVG (which should do layout internally)
    const svg = renderer.render(testRule.expression);
    
    // The element tree should now be laid out
    // Note: We can't directly access the element tree after rendering
    // since the transformer creates a new tree, but the SVG should be valid
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('ALPHA')); // Should have 2 ALPHA elements
    
    // Count ALPHA text elements
    const alphaTextMatches = (svg.match(/<text[^>]*>ALPHA<\/text>/g) || []).length;
    assert.strictEqual(alphaTextMatches, 2); // Should have exactly 2 ALPHA text elements
});

test('SVG output structure', () => {
    const parser = new ABNFParser();
    const renderer = new SVGRenderer();
    
    const content = 'SIMPLE = DIGIT';
    const rules = parser.parse(content);
    const rule = rules.get('SIMPLE');
    
    const svg = renderer.render(rule.expression);
    
    // Should have proper SVG structure
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.endsWith('</svg>'));
    assert.ok(svg.includes('width='));
    assert.ok(svg.includes('height='));
    assert.ok(svg.includes('viewBox='));
    assert.ok(svg.includes('class="railroad-diagram"'));
});

test('Custom renderer configuration', () => {
    const parser = new ABNFParser();
    
    // Test with custom configuration
    const customRenderer = new SVGRenderer({
        fontSize: 16,
        gridSize: 20,
        trackWidth: 3
    });
    
    const content = 'TEST = ALPHA';
    const rules = parser.parse(content);
    const rule = rules.get('TEST');
    
    const svg = customRenderer.render(rule.expression);
    
    // Should generate valid SVG with custom config
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('ALPHA'));
});