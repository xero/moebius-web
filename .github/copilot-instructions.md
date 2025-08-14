# GitHub Copilot Instructions for moebius-web

## Project Overview

Moebius-web is a web-based ANSI art editor that operates in two modes: server-side (collaborative) and **client-side (standalone)**. 

**⚠️ IMPORTANT: Focus exclusively on the client-side implementation in the `public/` directory. Ignore server-side code unless explicitly mentioned.**

This is a single-page application for creating ANSI/ASCII art with various drawing tools, color palettes, and export capabilities.

## Architecture & Key Files

### Client-Side Application (Primary Focus)

**Entry Point & Core:**
- `public/index.html` - Single HTML page, includes all necessary scripts
- `public/js/document_onload.js` - **Main entry point**, initializes all tools and UI
- `public/js/core.js` - **Core application logic**, canvas management, rendering

**UI & Interaction:**
- `public/js/ui.js` - UI components, overlays, toolbar management
- `public/js/keyboard.js` - Keyboard event handlers and shortcuts
- `public/js/elementhelper.js` - DOM utility functions

**Drawing & Tools:**
- `public/js/freehand_tools.js` - **Drawing tools implementation** (freehand, line, circle, square)
- `public/js/file.js` - File operations (load/save ANSI, PNG, etc.)
- `public/js/savers.js` - Export functionality for different formats
- `public/js/loaders.js` - Import functionality for various file types

**Unused in Client Mode:**
- `public/js/network.js` - **IGNORE**: WebSocket/server communication (server-mode only)
- `public/js/worker.js` - **IGNORE**: Web worker for server communication

### Server-Side Files (Avoid Unless Specified)
- `src/` - Node.js server implementation
- `server.js` - Express server entry point
- `editor/` - Alternative server-side editor implementation

### Reference Implementations
- `tools/` - **Use as examples** when implementing new drawing tools or features

## Development Guidelines

### 1. Code Structure Patterns

**Tool Implementation Pattern** (see `public/js/freehand_tools.js`):
```javascript
function createToolController() {
    "use strict";
    
    function enable() {
        // Add event listeners
        document.addEventListener("onTextCanvasDown", canvasDown);
        document.addEventListener("onTextCanvasDrag", canvasDrag);
        document.addEventListener("onTextCanvasUp", canvasUp);
    }
    
    function disable() {
        // Remove event listeners
        document.removeEventListener("onTextCanvasDown", canvasDown);
        // ...
    }
    
    return {
        "enable": enable,
        "disable": disable
    };
}
```

**Event Handling Pattern**:
```javascript
// Use custom events for canvas interaction
document.addEventListener("onTextCanvasDown", canvasDown);
document.addEventListener("onTextCanvasDrag", canvasDrag);
document.addEventListener("onTextCanvasUp", canvasUp);
```

**UI Integration Pattern**:
```javascript
// Register tools with toolbar
Toolbar.add($(toolId), tool.enable, tool.disable);

// Use $ function for DOM element access
function $(divName) {
    return document.getElementById(divName);
}
```

### 2. Adding New Features

1. **For new drawing tools**: Use `tools/` directory examples as reference
2. **Follow the factory pattern**: Create functions that return objects with enable/disable methods
3. **Canvas interaction**: Use the established event system (`onTextCanvasDown`, etc.)
4. **UI integration**: Register with `Toolbar.add()` and create corresponding HTML elements

### 3. Code Style

- Use `"use strict";` in all functions
- Prefer factory functions over classes
- Use meaningful variable names (`textArtCanvas`, `characterBrush`, etc.)
- Follow existing indentation (tabs)
- Use explicit returns with named properties: `return { "enable": enable, "disable": disable };`

### 4. Key Application Concepts

**Canvas System:**
- `textArtCanvas` - Main drawing surface
- Uses character-based coordinates (not pixel-based)
- Supports undo/redo operations via `textArtCanvas.startUndo()`

**Color Management:**
- `palette` - Color palette management
- Foreground/background color system
- Support for ICE colors (extended palette)

**Drawing Modes:**
- Half-block characters for pixel-like drawing
- Character-based drawing with extended ASCII
- Attribute brushes for color-only changes

## Testing & Development

### Local Development Setup
1. Start local server: `python3 -m http.server 8080` from `public/` directory
2. Access at `http://localhost:8080`
3. Use browser dev tools for debugging

### Testing with Playwright
```javascript
// Basic test structure
await page.goto('http://localhost:8080');
// Test drawing tools, UI interactions, file operations
```

### Key Test Scenarios
- Tool selection and canvas interaction
- Keyboard shortcuts (F, B, K, etc.)
- File import/export operations
- Undo/redo functionality
- Color palette operations

## Common Tasks

### Adding a New Drawing Tool
1. Study examples in `tools/` directory (e.g., `tools/freehand.js`)
2. Implement in `public/js/freehand_tools.js` or create new file
3. Register with toolbar in `public/js/document_onload.js`
4. Add HTML elements to `public/index.html` if needed
5. Add keyboard shortcut to paint shortcuts configuration

### Modifying UI Components
1. Edit `public/js/ui.js` for component logic
2. Update `public/index.html` for structure
3. Modify `public/css/style.css` for styling

### File Format Support
1. Add loader to `public/js/loaders.js`
2. Add saver to `public/js/savers.js`
3. Wire up in `public/js/document_onload.js`

## Important Notes

- **Always test changes locally** before committing
- **Preserve existing functionality** - this is a working art editor used by artists
- **Focus on client-side only** - ignore server/network features
- **Use the tools/ directory** as reference for complex feature implementations
- **Maintain the established patterns** for consistency and reliability

## Dependencies & Browser Support

- Pure JavaScript (ES5 compatible)
- No external libraries or frameworks
- Works in modern browsers with Canvas and File API support
- Uses Web Workers (only for server mode - ignore for client-side)