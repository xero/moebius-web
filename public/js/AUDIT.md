# JavaScript Files Audit for ES6+ Modernization

## Overview
This document audits all JavaScript files in `public/js/` for ES5 patterns, global variables, cross-file dependencies, and module responsibilities to prepare for safe ES6+ refactoring.

## Script Loading Order
Scripts are loaded in this specific order in `index.html`:
1. `network.js` - Must load first (creates WebSocket worker handler)
2. `core.js` - Core canvas and palette functionality
3. `freehand_tools.js` - Drawing tools
4. `keyboard.js` - Keyboard handling
5. `ui.js` - UI components and toolbar
6. `file.js` - File loading/saving modules
7. `document_onload.js` - Main initialization (must load last)

## File-by-File Audit

**UPDATED**: All files have been converted to ES6 module structure (imports/exports commented out until ready for activation).

### 1. `network.js`
**Responsibilities:** WebSocket communication, collaboration mode handling, real-time synchronization

**ES6 Status:** ✅ Converted to ES6 module exports (commented out)
**Exported Functions:**
- `createWorkerHandler(inputHandle)` - Creates WebSocket worker handler

**Dependencies:** 
- Uses `js/worker.js` WebWorker
- Depends on global DOM elements (from index.html)
- Uses browser APIs: localStorage, WebSocket, DOM events

**Key Patterns:**
- Factory function returning object with methods
- Custom event dispatching for cross-component communication
- Collaboration state management

**Side Effects:** Creates WebWorker, sets up localStorage handling

---

### 2. `core.js`
**Responsibilities:** Core canvas functionality, palette management, font loading, text art rendering

**ES6 Status:** ✅ Converted to ES6 module exports (commented out)
**Exported Functions:**
- `createPalette(RGB6Bit)` - Creates color palette
- `createDefaultPalette()` - Default 16-color palette
- `createPalettePreview(canvas)` - Palette preview widget
- `createPalettePicker(canvas)` - Color picker interface
- `loadImageAndGetImageData(url, callback)` - Image loading utility
- `loadFontFromXBData(fontBytes, fontWidth, fontHeight, letterSpacing, palette, callback)` - XBin font loader
- `loadFontFromImage(fontName, letterSpacing, palette, callback)` - Font from image
- `createTextArtCanvas(canvasContainer, callback)` - Main canvas controller

**Dependencies:**
- Browser APIs: Canvas 2D, Image, CustomEvent
- DOM elements for canvas rendering

**Key Patterns:**
- Factory functions with closures
- Event-driven architecture (CustomEvent)
- Canvas-based rendering
- Callback-based async patterns

**Cross-file Dependencies:**
- Used by document_onload.js for initialization
- Canvas methods called from freehand_tools.js

---

### 3. `freehand_tools.js`
**Responsibilities:** Drawing tools implementation (freehand, line, circle, square, fill, etc.)

**Exported Globals:** None

**Exported Functions:**
- `createFreestyleTool()` - Freehand drawing
- `createLineTool()` - Line drawing
- `createCircleTool()` - Circle drawing
- `createSquareTool()` - Rectangle drawing
- `createFillTool()` - Flood fill
- `createAttribTool()` - Attribute brush
- `createSampleTool()` - Color sampling
- `createPasteTool()` - Copy/paste functionality

**Dependencies:**
- Global variables: `textArtCanvas`, `palette`, `cursor`
- Custom events: `onTextCanvasDown`, `onTextCanvasDrag`, `onTextCanvasUp`
- Mathematical operations for drawing algorithms

**Key Patterns:**
- Tool controller pattern (enable/disable methods)
- Event-driven tool activation
- State management within tool instances

**Magic Dependencies:**
- Relies on global `textArtCanvas` object being initialized
- Uses Toolbar.add() for tool registration

---

### 4. `keyboard.js`
**Responsibilities:** Keyboard event handling, character input, F-key shortcuts

**Exported Globals:** None

**Exported Functions:**
- `createFKeyShorcut(canvas, charCode)` - Individual F-key shortcut
- `createFKeysShortcut()` - F1-F12 shortcuts controller
- `createKeyboardController()` - Main keyboard input handler

**Dependencies:**
- Global variables: `textArtCanvas`, `palette`, `cursor`, `font`
- DOM keyboard events
- Character code mappings

**Key Patterns:**
- Event listener management (enable/disable)
- Keyboard event delegation
- Character code translation

**Magic Dependencies:**
- Direct access to multiple global objects
- Assumes specific DOM structure for F-key preview canvases

---

### 5. `ui.js`
**Responsibilities:** UI components, overlays, toolbar management, grid display

**Exported Globals:**
- `Toolbar` - Global toolbar management object

**Exported Functions:**
- `createSettingToggle(divButton, getter, setter)` - Toggle button controller
- `onClick(divElement, func)` - Click event handler
- `onReturn(inputElement, buttonElement)` - Enter key handler
- `onFileChange(divElement, func)` - File input handler
- `onSelectChange(divElement, func)` - Select change handler
- `createPositionInfo(divElement)` - Position display
- `showOverlay(divElement)` / `hideOverlay(divElement)` - Overlay management
- `undoAndRedo(evt)` - Undo/redo keyboard handler
- `createTitleHandler()` - Title input handler
- `createPaintShortcuts(keyPair)` - Paint shortcut keys
- `createToggleButton()` - Toggle button creator
- `createGrid(divElement)` - Grid overlay
- `createToolPreview(divElement)` - Tool preview
- `menuHover()` - Menu hover handler

**Dependencies:**
- DOM manipulation APIs
- Global `font` object for rendering
- Canvas 2D context

**Key Patterns:**
- Factory functions for UI components
- Global Toolbar object with registration pattern
- Event delegation and cleanup

**Cross-file Usage:**
- `Toolbar.add()` called from document_onload.js and freehand_tools.js

---

### 6. `file.js`
**Responsibilities:** File loading and saving in multiple formats (ANSI, XBin, PNG, etc.)

**Exported Globals:**
- `Load` - File loading module
- `Save` - File saving module

**Load Module Exports:**
- `file(file, callback)` - Main file loading dispatcher
- `sauceToAppFont(sauceFontName)` - SAUCE font name conversion
- `appToSauceFont(appFontName)` - App to SAUCE font name conversion

**Save Module Exports:**
- `ans()` - Save as ANSI
- `utf8()` - Save as UTF-8 ANSI  
- `bin()` - Save as binary
- `xb()` - Save as XBin
- `png()` - Export as PNG

**Dependencies:**
- FileReader API
- Canvas APIs for PNG export
- Global variables: `textArtCanvas`, `font`, `palette`
- DOM elements for SAUCE metadata

**Key Patterns:**
- IIFE modules with public API
- File format detection and parsing
- Binary data manipulation
- SAUCE record parsing/creation

**Magic Dependencies:**
- Direct DOM access to sauce input fields
- Assumes specific canvas and font structure

---

### 7. `document_onload.js`
**Responsibilities:** Main application initialization, global variable setup, event wiring

**Exported Globals:**
- `worker` - WebSocket worker handler
- `title` - Title handler
- `palette` - Color palette
- `font` - Font object
- `textArtCanvas` - Main canvas
- `cursor` - Cursor controller
- `selectionCursor` - Selection cursor
- `positionInfo` - Position display
- `toolPreview` - Tool preview
- `pasteTool` - Paste tool
- `chat` - Chat functionality
- `sampleTool` - Sample tool

**Exported Functions:**
- `$(divName)` - DOM element getter (like jQuery $)
- `createWorkerHandler(_)` - Stub function (if network.js not loaded)
- `createCanvas(width, height)` - Canvas creation utility

**Dependencies:**
- ALL other modules (Load, Save, Toolbar, etc.)
- All factory functions from other files
- DOM elements from index.html

**Key Patterns:**
- DOMContentLoaded event handler
- Global variable initialization
- Factory function instantiation
- Event wiring between components

**Side Effects:**
- Initializes all global variables
- Sets up all event handlers
- Must load after all other scripts

---

### 8. `worker.js`
**Responsibilities:** WebSocket worker for real-time collaboration

**Exported Globals:**
- `socket` - WebSocket connection
- `sessionID` - Current session ID

**Dependencies:**
- WebSocket API
- postMessage/onmessage worker APIs

**Key Patterns:**
- Web Worker message passing
- WebSocket event handling
- Session management

---

### 9. `elementhelper.js`
**Responsibilities:** DOM utility functions

**Exported Globals:**
- `ElementHelper` - Utility object

**Exported Methods:**
- `create(elementName, args)` - DOM element creation with properties

**Dependencies:**
- DOM APIs only

**Key Patterns:**
- Simple utility module
- Property assignment helper

---

### 10. `loaders.js`
**Responsibilities:** Additional file loading functionality (legacy/alternative loaders)

**Exported Globals:**
- `Loaders` - Alternative file loading module

**Exported Methods:**
- `loadFile(file, callback, palette, codepage, noblink)` - Alternative file loader

**Dependencies:**
- FileReader API
- SAUCE parsing functionality

**Key Patterns:**
- IIFE module
- File format parsing

**Notes:** Contains duplicate functionality with file.js Load module

---

### 11. `savers.js`
**Responsibilities:** Additional saving functionality (appears mostly commented out)

**Exported Globals:**
- `Savers` - Additional saving module (mostly unused)

**Dependencies:**
- Minimal (mostly commented code)

**Key Patterns:**
- IIFE module with commented implementation

**Notes:** Appears to be legacy/experimental code

---

## Cross-File Dependencies Summary

### Global Variable Dependencies
- **`textArtCanvas`** - Used by: freehand_tools.js, keyboard.js, file.js
- **`palette`** - Used by: freehand_tools.js, keyboard.js, file.js  
- **`cursor`** - Used by: freehand_tools.js, keyboard.js
- **`font`** - Used by: keyboard.js, file.js, ui.js
- **`Toolbar`** - Used by: document_onload.js, freehand_tools.js

### Module Usage
- **`Load`** module used in: document_onload.js
- **`Save`** module used in: document_onload.js  
- **Factory functions from core.js** used in: document_onload.js

### Load Order Dependencies
1. **network.js** must load before document_onload.js (provides createWorkerHandler)
2. **core.js** must load before document_onload.js (provides factory functions)
3. **ui.js** must load before document_onload.js (provides Toolbar global)
4. **file.js** must load before document_onload.js (provides Load/Save globals)
5. **document_onload.js** must load last (initializes all globals)

## ES6+ Modernization Challenges

### High-Risk Refactoring Areas
1. **Global variable elimination** - Many tools depend on globals like `textArtCanvas`, `palette`
2. **Load order dependencies** - Script order is critical for global availability
3. **Event system** - Heavy use of CustomEvent for cross-component communication
4. **`this` context** - Some functions may rely on specific `this` binding
5. **Factory function patterns** - Converting to ES6 classes may change behavior

### Module Boundary Issues
1. **Circular dependencies** - Tools need canvas, canvas fires events that tools listen to
2. **Shared state** - Multiple tools share cursor, palette, canvas state
3. **DOM coupling** - Direct DOM access scattered throughout modules
4. **Worker communication** - Complex async message passing with WebWorker

### Recommended Approach
1. **Phase 1:** Add ESLint/Prettier, fix style issues without changing logic
2. **Phase 2:** Convert IIFEs to ES6 modules while preserving global exports
3. **Phase 3:** Implement dependency injection to eliminate global variables
4. **Phase 4:** Refactor event system and state management
5. **Phase 5:** Convert factory functions to ES6 classes where appropriate

### Notes on Arrow Functions
- **Avoid in event handlers** - May break `this` context in DOM events
- **Safe for array operations** - Good for map/filter operations in core.js
- **Careful with tool methods** - Tool enable/disable pattern relies on function context

## Open Questions and Potential Pitfalls

### 1. Module Boundary Ambiguity
- **Issue:** Some functions are exported but never used (e.g., `createPalettePreview` in core.js)
- **Risk:** Unclear if these are dead code or intended for future use
- **Recommendation:** Mark clearly as public API vs internal helpers

### 2. Global Variable Lifecycle Management  
- **Issue:** Global variables like `textArtCanvas`, `palette` are created in document_onload.js but used everywhere
- **Risk:** Initialization order matters; tools fail if globals not ready
- **Pitfall:** Converting to modules may break the sequential initialization pattern

### 3. Event System Dependencies
- **Issue:** Heavy reliance on CustomEvent for cross-component communication
- **Current Pattern:** `document.dispatchEvent(new CustomEvent("onTextCanvasDown", {...}))`
- **Risk:** Event names are strings, easy to break with typos during refactor
- **Recommendation:** Create event constant definitions before refactoring

### 4. Tool Registration Magic
- **Issue:** Tools self-register with `Toolbar.add()` but this happens in document_onload.js
- **Current Pattern:** Factory function returns {enable, disable}, passed to Toolbar.add()
- **Risk:** Converting to ES6 classes may change the this binding in enable/disable methods

### 5. Canvas Context Sharing
- **Issue:** Multiple components access the same canvas contexts
- **Current:** Canvas created in core.js, contexts shared with ui.js, tools
- **Risk:** State corruption if multiple components draw simultaneously
- **Pitfall:** ES6 modules with separate instances may break shared state

### 6. WebWorker Message Protocol
- **Issue:** worker.js and network.js communicate via postMessage with object literals
- **Current:** `worker.postMessage({ "cmd": "draw", "blocks": blocks })`
- **Risk:** Message structure changes could break worker communication
- **Recommendation:** Define message interfaces before refactoring

### 7. DOM Element Access Patterns
- **Issue:** Mix of `$(id)` function and direct `document.getElementById()`
- **Current:** `$()` function defined in document_onload.js, used globally
- **Risk:** Converting to modules may lose access to `$()` utility

### 8. File Format Dependencies
- **Issue:** Load/Save modules have complex binary parsing code
- **Risk:** ES6 module conversion may affect binary data handling
- **Pitfall:** Arrow functions may change `this` context in parsing methods

### 9. Collaborative State Synchronization
- **Issue:** network.js manages complex state flags (`applyReceivedSettings`, `initializing`)
- **Risk:** Module boundaries may interfere with state synchronization
- **Pitfall:** Race conditions if module loading changes timing

### 10. Font Loading Race Conditions
- **Issue:** Font loading is async and affects multiple components
- **Current:** Callback-based font loading with global font object
- **Risk:** Promise-based refactor may change timing and break dependencies

## Recommended Tooling Workflow

### Phase 1: Style and Quality (Safe Changes)
```bash
# Fix basic style issues without logic changes
npm run format
npm run lint:fix
```

### Phase 2: Dead Code Elimination
- Remove unused exports identified by ESLint
- Clean up commented code in savers.js
- Remove duplicate functionality between file.js and loaders.js

### Phase 3: Gradual Module Conversion
1. Start with independent utilities (elementhelper.js)
2. Convert IIFE modules to ES6 modules while keeping globals
3. Add TypeScript for better refactoring safety

### Phase 4: Dependency Injection
- Replace global variables with dependency injection
- Create proper interfaces for tool registration
- Implement event bus to replace custom events

### Phase 5: State Management
- Centralize application state
- Replace global objects with state management pattern
- Implement proper lifecycle management

## Pre-Refactor Testing Checklist

Before making any structural changes, ensure these scenarios work:
- [ ] File loading/saving in all formats (ANSI, XBin, PNG)
- [ ] All drawing tools function correctly
- [ ] Undo/redo operations work
- [ ] Keyboard shortcuts and F-keys work
- [ ] Collaboration mode connects and syncs
- [ ] Canvas resizing works
- [ ] Font switching works
- [ ] Color palette operations work
- [ ] Copy/paste functionality works
- [ ] Grid overlay toggles correctly

## Critical Dependencies to Preserve

1. **Script loading order** in index.html
2. **Global variable initialization** sequence in document_onload.js  
3. **Event listener setup** and cleanup patterns
4. **Canvas context sharing** between components
5. **WebWorker message protocol** structure
6. **Binary file parsing** logic integrity
7. **Tool enable/disable** state management
8. **Collaboration state** synchronization flags