const test = require('node:test');
const assert = require('node:assert');
const { Element, TextBoxElement, TerminalElement, NonterminalElement, SequenceElement } = require('../src/elements');

test('Three-phase architecture - Construction phase', () => {
    // Phase 1: Construction without layout
    const terminal = new TerminalElement('"hello"'); // Use literal ABNF syntax
    
    assert.strictEqual(terminal.text, '"hello"');
    assert.strictEqual(terminal.displayText, '"hello"');
    assert.strictEqual(terminal.isLaidOut, false);
    assert.strictEqual(terminal.width, 0); // No layout calculated yet
    assert.strictEqual(terminal.height, 0);
    assert.strictEqual(terminal.baseline, 0);
});

test('Three-phase architecture - Layout phase', () => {
    // Phase 1: Construction
    const terminal = new TerminalElement('"hello"'); // Use literal ABNF syntax
    
    // Phase 2: Layout
    const layoutConfig = {
        fontSize: 14,
        fontFamily: 'monospace',
        gridSize: 16
    };
    
    terminal.layout(layoutConfig);
    
    assert.strictEqual(terminal.isLaidOut, true);
    assert.ok(terminal.width > 0); // Layout should calculate dimensions
    assert.strictEqual(terminal.height, 2); // Fixed height for text boxes
    assert.strictEqual(terminal.baseline, 1); // Fixed baseline for text boxes
    assert.strictEqual(terminal.width % 2, 0); // Width must be even
});

test('Three-phase architecture - Sequence layout propagation', () => {
    // Phase 1: Construction
    const child1 = new NonterminalElement('ALPHA');
    const child2 = new NonterminalElement('DIGIT');
    const sequence = new SequenceElement([child1, child2]);
    
    assert.strictEqual(sequence.isLaidOut, false);
    assert.strictEqual(child1.isLaidOut, false);
    assert.strictEqual(child2.isLaidOut, false);
    
    // Phase 2: Layout should propagate to children
    const layoutConfig = {
        fontSize: 14,
        fontFamily: 'monospace',
        gridSize: 16
    };
    
    sequence.layout(layoutConfig);
    
    assert.strictEqual(sequence.isLaidOut, true);
    assert.strictEqual(child1.isLaidOut, true); // Should propagate
    assert.strictEqual(child2.isLaidOut, true); // Should propagate
    
    // Sequence width should be sum of children + spacing
    const expectedWidth = child1.width + child2.width + 2; // 2 units spacing
    assert.strictEqual(sequence.width, expectedWidth);
});

test('Layout config separation from render config', () => {
    const terminal = new TerminalElement('test');
    
    // LayoutConfig should only have layout-relevant properties
    const layoutConfig = {
        fontSize: 14,
        fontFamily: 'monospace',
        gridSize: 16
    };
    
    // RenderConfig would have different properties (not tested here since render isn't called)
    const renderConfig = {
        gridSize: 16,
        fontSize: 14,
        trackWidth: 2,
        textBorder: 1,
        endpointRadius: 8,
        textBoxRadius: 6
    };
    
    // Layout should work with just LayoutConfig
    terminal.layout(layoutConfig);
    assert.strictEqual(terminal.isLaidOut, true);
});