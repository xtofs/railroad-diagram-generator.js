const test = require('node:test');
const assert = require('node:assert');
const ABNFParser = require('../src/abnf-parser');
const { SVGRenderer } = require('../src/svg-renderer');

test('End-to-end pipeline - Data-driven tests', () => {
    const testCases = [
        {
            name: 'Simple repetition',
            content: 'RULE = 4HEXDIG',
            ruleName: 'RULE',
            expectedElement: 'HEXDIG',
            expectedCount: 4,
            minLength: 1000
        },
        {
            name: 'Complex GUID rule',
            content: 'GUID = 8HEXDIG 4HEXDIG 12HEXDIG',
            ruleName: 'GUID', 
            expectedElement: 'HEXDIG',
            expectedCount: 24, // 8 + 4 + 12
            minLength: 2000
        },
        {
            name: 'Layout then render',
            content: 'TEST = 2ALPHA',
            ruleName: 'TEST',
            expectedElement: 'ALPHA', 
            expectedCount: 2,
            minLength: 500
        }
    ];

    const parser = new ABNFParser();
    const renderer = new SVGRenderer();

    testCases.forEach(({ name, content, ruleName, expectedElement, expectedCount, minLength }) => {
        const rules = parser.parse(content);
        const rule = rules.get(ruleName);
        
        // Should generate SVG without throwing
        const svg = renderer.render(rule.expression);
        
        // Basic SVG structure validation
        assert.ok(typeof svg === 'string', `${name}: SVG should be a string`);
        assert.ok(svg.includes('<svg'), `${name}: SVG should start with <svg`);
        assert.ok(svg.includes('</svg>'), `${name}: SVG should end with </svg>`);
        assert.ok(svg.length > minLength, `${name}: SVG should be substantial (>${minLength} chars), got ${svg.length}`);
        
        // Count expected elements in the rendered SVG
        const elementTextMatches = (svg.match(new RegExp(`<text[^>]*>${expectedElement}</text>`, 'g')) || []).length;
        assert.strictEqual(elementTextMatches, expectedCount, `${name}: Should have exactly ${expectedCount} ${expectedElement} text elements`);
    });
});

test('SVG rendering - Data-driven tests', () => {
    const testCases = [
        {
            name: 'SVG output structure',
            content: 'SIMPLE = DIGIT',
            ruleName: 'SIMPLE',
            renderer: new SVGRenderer(),
            expectedAttributes: ['width=', 'height=', 'viewBox=', 'class="railroad-diagram"'],
            expectedContent: ['DIGIT']
        },
        {
            name: 'Custom renderer configuration',
            content: 'TEST = ALPHA', 
            ruleName: 'TEST',
            renderer: new SVGRenderer({
                fontSize: 16,
                gridSize: 20,
                trackWidth: 3
            }),
            expectedAttributes: ['<svg'],
            expectedContent: ['ALPHA']
        }
    ];

    const parser = new ABNFParser();

    testCases.forEach(({ name, content, ruleName, renderer, expectedAttributes, expectedContent }) => {
        const rules = parser.parse(content);
        const rule = rules.get(ruleName);
        
        const svg = renderer.render(rule.expression);
        
        // Should have proper SVG structure
        assert.ok(svg.startsWith('<svg'), `${name}: SVG should start with <svg`);
        assert.ok(svg.endsWith('</svg>'), `${name}: SVG should end with </svg>`);
        
        // Check for expected attributes
        expectedAttributes.forEach(attr => {
            assert.ok(svg.includes(attr), `${name}: SVG should include attribute: ${attr}`);
        });
        
        // Check for expected content
        expectedContent.forEach(content => {
            assert.ok(svg.includes(content), `${name}: SVG should include content: ${content}`);
        });
    });
});