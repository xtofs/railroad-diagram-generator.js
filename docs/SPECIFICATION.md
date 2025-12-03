# Railroad Diagram Layout Specification

This document specifies the precise layout and track routing algorithms for railroad syntax diagrams,
using relative grid coordinates and turtle graphics commands.

## Coordinate System & Units

- **Grid Units**: All measurements are in integer grid units
- **Grid Size**: Physical size of one grid unit (e.g., 24 pixels)
- **Origin**: Top-left corner is (0,0), X increases right, Y increases down
- **Conversion**: Grid coordinates are multiplied by grid size only at final SVG rendering

## Core Invariants

### Grid Alignment Invariant

All element widths are **even numbers** to ensure perfect centering in stacks.

```javascript
width = roundUpToEven(calculatedWidth)
```

### Baseline Invariant

Every element has a **baseline** - the Y-coordinate where the main track passes through.

- Enables proper alignment when elements are combined
- Sequences align all children to the same baseline
- Stacks use the first child's baseline as the main baseline

### Track Continuity Invariant

Tracks entering and exiting elements must connect seamlessly:

- Entry point: `(0, baseline)`
- Exit point: `(width, baseline)`
- All internal routing must preserve these connection points

## Element Specifications

### 1. TextBox Element

**Purpose**: Terminal symbols (literals) and nonterminal symbols (rule references)

**Layout Calculation**:

```javascript
textWidth = measureText(content, gridSize, className)
width = roundUpToEven(textWidth + 3)  // +2 for tracks, +1 for padding
height = 2
baseline = 1
```

**Track Routing**:

```plain
Entry Track:  start(0, 1, EAST) → forward(1)
Exit Track:   start(width-1, 1, EAST) → forward(1)
```

**SVG Elements**:

- Rectangle: `(gridSize, 0)` to `((width-2)*gridSize, height*gridSize)`
- Text: centered in rectangle
- Two track segments: left and right

**Invariants Maintained**:

- Width is even (Grid Alignment)
- Baseline at Y=1 (Track Continuity)
- Tracks connect at standard entry/exit points

### 2. Sequence Element

**Purpose**: Horizontal arrangement of elements connected by tracks

**Layout Calculation**:

```javascript
totalWidth = sum(child.width for child in children) + (children.length - 1) * 2
maxHeight = max(child.height for child in children)
baseline = max(child.baseline for child in children)
```

**Child Positioning**:

```javascript
currentX = 0
for each child:
    childY = baseline - child.baseline  // Align baselines
    renderChild(child, currentX, childY)
    currentX += child.width + 2  // +2 for connecting track
```

**Track Routing** (between children):

```
start(currentX + child.width, baseline, EAST) → forward(2)
```

**Invariants Maintained**:

- All children aligned to common baseline
- 2-unit spacing between children
- Total width accounts for all children plus spacings
- Entry/exit at (0, baseline) and (totalWidth, baseline)

### 3. Stack Element

**Purpose**: Vertical arrangement representing alternative paths

**Layout Calculation**:

```javascript
maxChildWidth = max(child.width for child in children)  // Already even by invariant
width = maxChildWidth + 4  // +2 units on each side for routing
totalHeight = sum(child.height for child in children) + (children.length - 1)
baseline = children[0].baseline  // First child's baseline becomes main baseline
```

**Child Positioning**:

```javascript
currentY = 0
for each child:
    xOffset = 2 + (maxChildWidth - child.width) / 2  // Center horizontally
    renderChild(child, xOffset, currentY)
    currentY += child.height + 1  // +1 unit vertical spacing
```

**Track Routing**:

*First Child (straight path)*:

```
Left:  start(0, mainBaseline, EAST) → forward(childX)
Right: start(childX + child.width, childBaseline, EAST) → forward(width - (childX + child.width))
```

*Other Children (branching paths)*:

```
Left Branch:
  start(0, mainBaseline, EAST) 
  → turnRight() 
  → forward(verticalDistance - 2) 
  → turnLeft() 
  → forward(horizontalDistance - 2)

Right Branch:
  start(width, mainBaseline, WEST) 
  → turnLeft() 
  → forward(verticalDistance - 2) 
  → turnRight() 
  → forward(horizontalDistance - 2)
```

**Invariants Maintained**:

- All children centered horizontally within maxChildWidth
- First child provides main baseline
- 2-unit margins on sides for track routing
- Vertical spacing of 1 unit between children

### 4. Bypass Element (Optional)

**Purpose**: Optional element with skip path above

**Layout Calculation**:

```javascript
width = child.width + 4  // Already even: even + even = even
height = child.height + 1  // +1 for bypass path above
baseline = child.baseline + 1  // Shift down to make room for bypass
```

**Child Positioning**:

```javascript
childX = (width - child.width) / 2  // Center horizontally
renderChild(child, childX, 1)  // Place 1 unit down
```

**Track Routing**:

*Bypass Path (above)*:

```plain

  ╭──────╮
  │      │
──╯┄    ┄╰──

```

```plain
start(0, baseline, EAST) 
→ turnLeft() 
→ forward(baseline - 2) 
→ turnRight() 
→ forward(width - 4) 
→ turnRight() 
→ forward(baseline - 2) 
→ turnLeft()
```

*Through Paths (connect to child)*:

```
Entry: start(0, baseline, EAST) → forward(2)
Exit:  start(width, baseline, WEST) → forward(2)
```

**Invariants Maintained**:

- Child centered horizontally
- Bypass path 1 unit above child
- Entry/exit at adjusted baseline
- 2-unit margins for routing

### 5. Loop Element (Repeatable)

**Purpose**: Repeatable element with return path below

**Layout Calculation**:

```javascript
width = child.width + 4  // Already even: even + even = even
height = child.height + 1  // +1 for loop path below
baseline = child.baseline + 1  // Shift down to make room above
```

**Child Positioning**:

```javascript
childX = (width - child.width) / 2  // Center horizontally
renderChild(child, childX, 1)  // Place 1 unit down
```

**Track Routing**:

*Loop Path (below)*:

```
start(2, baseline, WEST) 
→ turnRight() 
→ forward(baseline - 2) 
→ turnRight() 
→ forward(width - 4) 
→ turnRight() 
→ forward(baseline - 2) 
→ turnRight()
```

*Through Paths (connect to child)*:

```
Entry: start(0, baseline, EAST) → forward(2)
Exit:  start(width, baseline, WEST) → forward(2)
```

**Invariants Maintained**:

- Child centered horizontally
- Loop path starts/ends 2 units from edges
- Clockwise loop direction (standard convention)
- 2-unit margins for routing

## Turtle Graphics Commands

- `start(x, y, direction)`: Begin path at grid coordinates (x,y) facing direction
- `forward(units)`: Move forward by specified grid units in current direction
- `finish(debugId)`: Complete path and add to SVG

- `turnLeft()`: Rotate 90° counterclockwise
- `turnRight()`: Rotate 90° clockwise

- `NORTH`: Up (negative Y)
- `SOUTH`: Down (positive Y)  
- `EAST`: Right (positive X)
- `WEST`: Left (negative X)

## Implementation Notes

### Grid-to-Pixel Conversion

```javascript
// TrackBuilder with useGridUnits=true (default)
_toPixels(coord) {
    return this.useGridUnits ? coord * this.gridSize : coord
}
```

### Arc Transitions

Quarter-circle arcs connect perpendicular track segments.

One of the challenges (and difference to turtle graphics) is that turns are not made on the spot
but create quarter circles that move one unit in both the old and new direction each.

There are 4 different quarter circle arc shapes that can "flow" in either direction (clockwise or counter-clockwise).
The table below lists them by initial and final direction, assuming a grid size of 16.
(n.b.: the relative arc `a` parameters are rx ry x-axis-rotation large-arc-flag sweep-flag x y)

**Turn Implementation**: For each turn, the turtle moves 1 grid unit in the old direction,  
then 1 grid unit in the new direction, creating a 2-unit diagonal offset with a quarter-circle arc  
connecting the start and end points.

initial | final | offset   | sweep | path
--------+-------+----------+-------+-------------------
east    | north | (-1, -1) | 0     | a 16 16 0 0 0 -16 -16
north   | west  | (+1, -1) | 0     | a 16 16 0 0 0  16 -16
west    | south | (+1, +1) | 0     | a 16 16 0 0 0  16  16
south   | east  | (-1, +1) | 0     | a 16 16 0 0 0 -16  16
east    | south | (-1, +1) | 1     | a 16 16 0 0 1 -16  16
south   | west  | (+1, +1) | 1     | a 16 16 0 0 1  16  16
west    | north | (+1, -1) | 1     | a 16 16 0 0 1  16 -16
north   | east  | (-1, -1) | 1     | a 16 16 0 0 1 -16 -16

### Element Composition

Elements compose naturally due to consistent entry/exit points:

- All elements expose `(0, baseline)` entry and `(width, baseline)` exit
- Parent elements position children and connect with tracks
- Coordinate systems remain relative until final rendering

This specification ensures consistent, predictable layout while maintaining the flexibility to compose complex railroad diagrams from simple building blocks.
