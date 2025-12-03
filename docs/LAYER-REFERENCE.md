# Pipeline Layer Reference

This document clarifies the 3-layer architecture to prevent confusion.

## Layer 1: ABNF Semantic AST (src/ast-node.js)
**Purpose**: Represents parsed ABNF grammar structure
**Classes**: TerminalNode, NonterminalNode, SequenceNode, AlternationNode, OptionalNode, RepetitionNode
**toString() examples**:
- `terminal("hello")`
- `nonterminal("ruleName")`
- `sequence(terminal("a"), terminal("b"))`
- `alternation(terminal("x"), terminal("y"))`
- `optional(terminal("z"))`
- `repeat(1*3, terminal("w"))`

## Layer 2: Layout Elements (src/*-element.js)
**Purpose**: Represents visual diagram structure for rendering
**Classes**: TerminalElement, NonterminalElement, SequenceElement, StackElement, BypassElement, LoopElement
**toString() examples**:
- `TerminalElement` → default class name
- `NonterminalElement` → default class name  
- `SequenceElement` → default class name
- `StackElement` → `stack(child1, child2)`
- `BypassElement` → `bypass(child)`
- `LoopElement` → default class name

## Layer 3: HTML/SVG Output
**data-layout attribute**: Should contain Layer 2 (Layout Elements) toString() output
**SVG content**: Visual rendering of Layer 2 elements

## Key Distinction
- **AST toString()**: Shows ABNF semantic concepts (terminal, nonterminal, sequence, alternation, optional, repeat)
- **Layout toString()**: Shows visual layout concepts (stack, bypass, loop, or class names)

## Pipeline Flow
ABNF text → Parser → AST Nodes → Transformer → Layout Elements → Renderer → HTML+SVG