# Development Notes

## Architecture & Design Constraints

### Grid Layout System

The SVG renderer uses a grid-based layout system where all expressions are positioned on integer grid coordinates. This ensures clean, pixel-perfect alignment in the generated railroad diagrams.

### Width Invariant (Critical)

**All Expression widths must be even numbers.**

This is a fundamental architectural constraint that enables integer-based centering calculations throughout the rendering system.

#### Why Even Widths Are Required

The rendering system frequently centers child elements within parent containers using division by 2:

```javascript
// StackExpression centering
const xOffset = 2 + (maxWidth - child.width) / 2;

// BypassExpression centering  
const childX = (this.width - this.child.width) / 2;

// LoopExpression centering
const childX = (this.width - this.child.width) / 2;
```

For these calculations to produce integer grid coordinates:
- All widths must be even numbers
- Width differences are even numbers (even - even = even)
- Division by 2 produces integers (even ÷ 2 = integer)

#### Width Invariant Implementation

The invariant is maintained systematically:

1. **Base Case** - `LiteralExpression` rounds up to even widths:
   ```javascript
   this.width = Math.max(4, minWidth + (minWidth % 2)); // Force even
   ```

2. **Composition** - All composite expressions preserve even widths:
   - `SequenceExpression`: `sum of even widths + even spacing = even`
   - `StackExpression`: `4 + maxWidth = even` (if maxWidth even)
   - `BypassExpression`: `child.width + 4 = even` (if child.width even)
   - `LoopExpression`: `child.width + 4 = even` (if child.width even)

3. **Validation** - Width assertions in critical expressions catch violations early

### Height Flexibility

**Expression heights can be any positive integer.**

Unlike widths, heights have no evenness constraint because:
- No height-based centering calculations use division
- Vertical positioning uses baseline alignment, not centering
- Height calculations are additive (sums and maximums)

Height calculations:
```javascript
// StackExpression: sum of heights + gaps
this.height = totalHeight + (totalHeight % 2); // Even for aesthetic reasons only

// BypassExpression/LoopExpression: child height + 1
this.height = this.child.height + 1; // Can be odd
```

### Grid Coordinate Analysis

All coordinate calculations maintain integer values:

- **X coordinates**: Use even width differences in centering calculations
- **Y coordinates**: Use baseline offsets and integer spacing
- **No fractional coordinates**: All `/2` operations work on even numbers

Verified division operations in the codebase:
- Line 399: `(maxWidth - child.width) / 2` ✓ Even width difference
- Line 476: `(this.width - this.child.width) / 2` ✓ Even width difference  
- Line 534: `(this.width - this.child.width) / 2` ✓ Even width difference
- Lines 82-83: SVG text positioning (non-grid coordinates) ✓ Allowed
- Line 254: Text width measurement with Math.ceil ✓ Safe

### Design Philosophy

This constraint system demonstrates:
- **Invariant-driven design**: Core constraints enable elegant solutions
- **Bottom-up consistency**: Base cases establish invariants, composition preserves them
- **Integer arithmetic**: Avoids floating-point precision issues in layout
- **Clean SVG output**: All elements align perfectly on pixel boundaries

## Development Guidelines

1. **New Expression types** must maintain even width invariant
2. **Width calculations** should add/preserve even numbers
3. **Height calculations** can be any positive integer
4. **Centering logic** assumes even width differences
5. **Assertions** should validate invariants during development

## Historical Context

This analysis was conducted after investigating assertion failures in `SequenceExpression` height validation. The investigation revealed that height evenness was not architecturally required, but width evenness is critical for the grid positioning system.

The height assertion was initially assumed to be necessary, but deeper analysis showed it was conflating aesthetic preferences with architectural requirements. The width constraint is the true architectural invariant.