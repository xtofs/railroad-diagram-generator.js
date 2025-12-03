# Track Boundary Validation - Design Notes

## Problem Statement

We want to add validation to ensure tracks follow the railroad diagram rules:
1. **Tracks are only allowed inside their Expression's bounding box**
2. **Tracks are allowed along own bounding box edge but not children's bounding box edges**

This would be a powerful debugging feature to catch track routing errors early.

## Design Challenges

### 1. Information Architecture

The challenge is that `TrackBuilder` and `RenderContext` don't have access to the bounding box information needed for validation:

- **Expression constructors** have their own dimensions (`this.width`, `this.height`)
- **Expression render methods** know child positions and sizes
- **TrackBuilder** only sees individual track operations (start, forward, turn, etc.)
- **RenderContext** handles SVG generation but doesn't track spatial relationships

### 2. Considered Approaches

#### Option 1: Bounding Box Stack in RenderContext
```javascript
class RenderContext {
    constructor() {
        this.boundaryStack = []; // Stack of active bounding boxes
    }
    
    pushBoundary(x, y, width, height, ownerType) {
        this.boundaryStack.push({ x, y, width, height, ownerType });
    }
    
    popBoundary() {
        this.boundaryStack.pop();
    }
}
```

**Problem**: A stack gives access to ancestor bounding boxes, not children's bounding boxes. We need to validate that tracks don't violate child boundaries, not ancestor boundaries.

#### Option 2: Child-Aware RenderContext
```javascript
renderChild(child, gridX, gridY, groupClass, groupData) {
    // Register child bounding box before rendering
    this.registerChildBoundary(gridX, gridY, child.width, child.height);
    // ... existing rendering logic
}
```

**Problem**: This requires all children to be rendered and their boundaries registered before any tracks are added. Our current rendering flow interleaves child rendering and track creation, which would need significant refactoring.

#### Option 3: Boundary-Aware TrackBuilder
```javascript
ctx.trackBuilder
    .setBoundary(0, 0, this.width, this.height, 'SequenceExpression')
    .addChildBoundary(childX, childY, child.width, child.height)
    .start(x, y, direction)
    .forward(distance)
    .finish('track-name');
```

**Problem**: This would require each Expression to manually configure all boundary information, making the API complex and error-prone.

### 3. Current Rendering Flow

The current rendering pattern is:
1. Expression renders some children
2. Expression adds tracks between/around children
3. Expression renders more children
4. Expression adds more tracks

This interleaved approach makes it difficult to have complete boundary information before track validation.

### 4. Architectural Constraints

- **TrackBuilder** is designed to be stateless and focused on track geometry
- **RenderContext** handles coordinate transformation and SVG generation
- **Expressions** own their layout logic and child positioning
- **Validation** needs access to both own boundaries and child boundaries

## Potential Solutions (Future Work)

### 1. Two-Phase Rendering
Separate rendering into two phases:
1. **Layout Phase**: All children are positioned and boundaries are registered
2. **Track Phase**: All tracks are added with full boundary validation

### 2. Boundary Registry
Create a separate boundary tracking system:
```javascript
class BoundaryRegistry {
    constructor() {
        this.boundaries = new Map(); // expressionId -> boundary info
        this.childRelationships = new Map(); // parent -> children
    }
    
    registerExpression(id, x, y, width, height, parentId) {
        // Track all expression boundaries and relationships
    }
    
    validateTrackPoint(x, y, currentExpressionId) {
        // Check if point violates any boundary rules
    }
}
```

### 3. Expression-Level Validation
Add validation methods to Expression base class:
```javascript
class Expression {
    validateTrackPoint(x, y) {
        // Validate against own boundary
        if (x < 0 || x > this.width || y < 0 || y > this.height) {
            throw new Error(`Track point (${x}, ${y}) outside expression boundary`);
        }
        
        // Would need child boundary info for full validation
    }
}
```

### 4. RenderContext Interface Redesign
Enhance RenderContext to support boundary-aware operations:
```javascript
class RenderContext {
    beginExpression(x, y, width, height, type) {
        // Start rendering an expression, track its boundary
    }
    
    endExpression() {
        // Finish expression, validate all tracks added within it
    }
    
    renderChildExpression(child, x, y) {
        // Render child and register its boundary for parent's track validation
    }
}
```

## Decision

**Status**: Parked for future consideration

The track boundary validation feature requires significant architectural changes to the rendering system. The current design prioritizes simplicity and performance, with Expressions handling their own rendering in a single pass.

Adding comprehensive track validation would require either:
1. Major refactoring of the rendering flow (two-phase approach)
2. Complex boundary tracking systems
3. Significant API changes to RenderContext/TrackBuilder

While this would be a valuable debugging feature, the implementation complexity and architectural impact make it unsuitable for the current development phase.

## Next Steps (When Revisiting)

1. **Profile current rendering performance** to understand impact of two-phase approach
2. **Design boundary registry system** that works with current Expression architecture
3. **Create prototype** with simple boundary validation to test feasibility
4. **Consider incremental approach** - start with own-boundary validation only
5. **Evaluate developer experience** - ensure validation errors are actionable

---

*This document captures the design discussion around track boundary validation as of the parsing error investigation branch.*