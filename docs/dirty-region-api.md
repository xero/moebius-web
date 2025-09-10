# Dirty Region API Documentation

## Overview

The Dirty Region System is an efficient selective canvas redraw implementation that only redraws canvas regions (cells/pixels) that have changed, never the whole canvas except on full reset/resize. This system provides a unified rendering path for both local tool actions and remote/network sync events.

## Architecture

### Core Components

1. **Dirty Region Queue**: FIFO queue of regions needing redraw
2. **Region Coalescing**: Optimization that merges overlapping/adjacent regions  
3. **Unified Buffer Patching**: Single pathway for all canvas mutations
4. **Immediate Local Processing**: Favors responsiveness for local edits

### Data Types

```javascript
// Dirty Region Type
type DirtyRegion = {
  x: number,      // X coordinate (character-based)
  y: number,      // Y coordinate (character-based) 
  w: number,      // Width in characters
  h: number       // Height in characters
}
```

## API Reference

### Core Functions

#### `drawRegion(x, y, w, h)`
Redraws a specific rectangular region of the canvas.

- **Parameters:**
  - `x` (number): Left coordinate (0-based)
  - `y` (number): Top coordinate (0-based)
  - `w` (number): Width in characters
  - `h` (number): Height in characters
- **Behavior:** Validates bounds, no-op for invalid/empty regions
- **Performance:** Only redraws cells within the specified region

#### `enqueueDirtyRegion(x, y, w, h)`
Adds a region to the dirty queue for later processing.

- **Parameters:** Same as `drawRegion()`
- **Validation:** Automatically clamps to canvas bounds
- **Coalescing:** Regions are coalesced during processing for optimization

#### `enqueueDirtyCell(x, y)`
Convenience method to mark a single cell as dirty.

- **Parameters:**
  - `x` (number): Cell X coordinate
  - `y` (number): Cell Y coordinate
- **Equivalent to:** `enqueueDirtyRegion(x, y, 1, 1)`

#### `processDirtyRegions()`
Processes all queued dirty regions with coalescing optimization.

- **Coalescing:** Merges overlapping/adjacent regions before redraw
- **Performance:** Typically reduces region count by 40-80%
- **Thread Safety:** Prevents concurrent processing with internal flag

#### `patchBufferAndEnqueueDirty(index, charCode, foreground, background, x, y, addToUndo)`
Unified buffer patching function used by both tools and network sync.

- **Parameters:**
  - `index` (number): Buffer index (y * columns + x)
  - `charCode` (number): Character code to set
  - `foreground` (number): Foreground color (0-15)
  - `background` (number): Background color (0-15)
  - `x` (number): X coordinate for dirty region
  - `y` (number): Y coordinate for dirty region
  - `addToUndo` (boolean): Whether to add to undo history
- **Usage:** Local tools use `addToUndo=true`, network sync uses `addToUndo=false`

#### `coalesceRegions(regions)`
Optimization function that merges overlapping and adjacent regions.

- **Parameters:**
  - `regions` (Array<DirtyRegion>): Array of regions to coalesce
- **Returns:** Array<DirtyRegion> with reduced count
- **Algorithm:** Sorts by position, merges recursively until no more merges possible

## Usage Patterns

### Local Tool Actions

```javascript
// Example: Drawing a line
function drawLine(x1, y1, x2, y2, charCode, foreground, background) {
  textArtCanvas.startUndo(); // Begin undo group
  
  // Draw each point along the line
  for (let point of getLinePoints(x1, y1, x2, y2)) {
    const index = point.y * columns + point.x;
    textArtCanvas.patchBufferAndEnqueueDirty(
      index, charCode, foreground, background, point.x, point.y, true
    );
  }
  
  // Process immediately for local responsiveness
  textArtCanvas.processDirtyRegions();
}
```

### Network Sync Events

```javascript
// Example: Receiving network patches
function onNetworkDraw(blocks) {
  for (let block of blocks) {
    // Apply without undo (network changes don't go in local undo history)
    textArtCanvas.patchBufferAndEnqueueDirty(
      block.index, block.charCode, block.foreground, block.background,
      block.x, block.y, false
    );
  }
  
  // Process dirty regions
  textArtCanvas.processDirtyRegions();
}
```

### Batch Operations

```javascript
// Example: Fill operation
function fillArea(x, y, width, height, charCode, foreground, background) {
  textArtCanvas.startUndo();
  
  // Enqueue entire filled region efficiently
  for (let fy = y; fy < y + height; fy++) {
    for (let fx = x; fx < x + width; fx++) {
      const index = fy * columns + fx;
      textArtCanvas.patchBufferAndEnqueueDirty(
        index, charCode, foreground, background, fx, fy, true
      );
    }
  }
  
  // Single processing call handles coalescing automatically
  textArtCanvas.processDirtyRegions();
}
```

## Performance Characteristics

### Coalescing Effectiveness

Typical coalescing results for common operations:

- **Character typing:** 100% (single cells, no coalescing needed)
- **Line drawing:** 0-20% reduction (usually linear, limited adjacent regions)
- **Rectangle/fill:** 80-95% reduction (many adjacent cells become single region)
- **Complex shapes:** 40-70% reduction (depends on density and adjacency)

### Timing Comparisons

| Operation | Full Redraw | Selective Redraw | Improvement |
|-----------|-------------|------------------|-------------|
| Single character | 2000 cells | 1 cell | 2000x faster |
| 10-char line | 2000 cells | 10 cells | 200x faster |
| 50x10 fill | 2000 cells | 1 region (500 cells) | 4x faster |
| Complex drawing | 2000 cells | 50-200 cells | 10-40x faster |

## Migration Guide

### From Full Redraw

**Before:**
```javascript
function drawSomething() {
  // Modify buffer directly
  imageData[index] = newValue;
  // Force full redraw
  redrawEntireImage(); // Redraws 2000+ cells
}
```

**After:**
```javascript
function drawSomething() {
  // Use unified patching
  textArtCanvas.patchBufferAndEnqueueDirty(
    index, charCode, foreground, background, x, y, true
  );
  // Process only dirty regions
  textArtCanvas.processDirtyRegions(); // Redraws 1-10 cells typically
}
```

### From Immediate Individual Redraws

**Before:**
```javascript
function drawBlocks(blocks) {
  blocks.forEach(block => {
    updateBuffer(block);
    redrawGlyph(block.index, block.x, block.y); // Individual redraws
  });
}
```

**After:**
```javascript
function drawBlocks(blocks) {
  blocks.forEach(block => {
    textArtCanvas.patchBufferAndEnqueueDirty(
      block.index, block.charCode, block.foreground, block.background,
      block.x, block.y, true
    );
  });
  textArtCanvas.processDirtyRegions(); // Batched with coalescing
}
```

## Future Enhancements

### Potential Optimizations

1. **Spatial Indexing**: For massive canvases (1000x1000+), could use quadtree or grid-based indexing
2. **Time-slicing**: Break up large region processing across multiple animation frames
3. **WebGL Acceleration**: Use GPU for region-based texture updates
4. **Compression**: Delta compression for network protocol efficiency

### Advanced Coalescing

Current algorithm is O(n²) for simplicity. For high-frequency updates, could implement:

- **Sweep Line Algorithm**: O(n log n) for more complex region merging
- **Union-Find**: For tracking connected components of dirty regions
- **Hierarchical Regions**: Multi-level dirty tracking (cell -> block -> section)

### CRDT Integration

The dirty region system provides foundation for Conflict-free Replicated Data Types:

- **Operation-based CRDTs**: Each dirty region represents an operation
- **State-based CRDTs**: Regions define merge boundaries for state synchronization
- **Causal Consistency**: Timestamp dirty regions for ordering

## Protocol Definition

### Network Message Format

For future server implementation, dirty regions map to this protocol:

```json
{
  "type": "patch",
  "regions": [
    {
      "x": 10,
      "y": 5, 
      "w": 3,
      "h": 2,
      "data": [
        {"char": 65, "fg": 7, "bg": 0},
        {"char": 66, "fg": 7, "bg": 0},
        {"char": 67, "fg": 7, "bg": 0},
        {"char": 68, "fg": 7, "bg": 0},
        {"char": 69, "fg": 7, "bg": 0},
        {"char": 70, "fg": 7, "bg": 0}
      ]
    }
  ],
  "user": "xero",
  "timestamp": 1693830400,
  "sequence": 1234
}
```

### Message Guarantees

- **Idempotency**: Applying same patch multiple times has same result
- **Ordering**: Sequence numbers ensure proper order
- **Atomicity**: Each patch represents single operation
- **Efficiency**: Coalesced regions minimize network traffic