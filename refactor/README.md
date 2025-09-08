# Refactored Module Integration Guide

This document explains how to integrate the refactored ES6 modules and mitigate race conditions in the ANSI art editor.

## Overview

The original `core.js` (1562 lines) and `file.js` (1272 lines) have been refactored into four focused ES6 modules:

- **`palette.js`** - Color palette management and UI components
- **`font.js`** - Font loading, rendering, and character operations  
- **`canvas.js`** - Canvas rendering, drawing operations, and undo/redo
- **`loader.js`** - File I/O operations for various formats (ANSI, XBin, BIN)

## Module Architecture

### Dependency Graph
```
main.js
├── palette.js (no dependencies)
├── font.js (depends on: palette)  
├── canvas.js (depends on: font, palette)
└── loader.js (depends on: canvas for saving)
```

### Key Design Principles

1. **Separation of Concerns** - Each module has a single, well-defined responsibility
2. **Dependency Injection** - Dependencies are passed in rather than accessed globally
3. **Event-Driven Communication** - Modules communicate via events to avoid tight coupling
4. **Async/Await** - Modern promise-based patterns replace callback hell
5. **Defensive Programming** - Input validation and error handling throughout

## Integration Example

### Basic Setup (`main.js`)

```javascript
import { createDefaultPalette, createPalettePicker } from './palette.js';
import { createFontManager } from './font.js';
import { createTextArtCanvas } from './canvas.js';
import { createFileManager } from './loader.js';

class MoebiusApp {
    constructor() {
        this.palette = null;
        this.fontManager = null;
        this.canvas = null;
        this.fileManager = null;
        this.isInitializing = true;
    }

    async initialize() {
        try {
            // 1. Create palette first (no dependencies)
            this.palette = createDefaultPalette();
            
            // 2. Create font manager and load default font
            this.fontManager = createFontManager();
            const fontRenderer = await this.fontManager.loadFontFromImage(
                'CP437 8x16', 
                false, 
                this.palette
            );
            
            // 3. Create canvas with font renderer
            const canvasContainer = document.getElementById('canvas-container');
            this.canvas = createTextArtCanvas(canvasContainer, fontRenderer, this.palette);
            
            // 4. Create file manager
            this.fileManager = createFileManager();
            
            // 5. Set up event listeners
            this.setupEventListeners();
            
            this.isInitializing = false;
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Font changes require canvas update
        this.fontManager.addEventListener('fontChange', (event) => {
            if (!this.isInitializing) {
                const fontRenderer = this.fontManager.getCurrentFont();
                this.canvas.setFontRenderer(fontRenderer);
            }
        });

        // Palette changes require font regeneration
        this.palette.addEventListener('paletteChange', async (event) => {
            if (!this.isInitializing) {
                // Regenerate current font with new palette
                const currentFontName = this.fontManager.getCurrentFontName();
                const letterSpacing = this.fontManager.getLetterSpacing();
                
                try {
                    const fontRenderer = await this.fontManager.loadFontFromImage(
                        currentFontName, 
                        letterSpacing, 
                        this.palette
                    );
                    this.canvas.setFontRenderer(fontRenderer);
                } catch (error) {
                    console.error('Failed to regenerate font after palette change:', error);
                }
            }
        });

        // File loading
        this.fileManager.addEventListener('fileLoaded', async (event) => {
            const { imageData, format } = event.detail;
            await this.loadImageData(imageData, format);
        });
    }

    async loadImageData(imageData, format) {
        try {
            this.isInitializing = true;
            
            // Handle XBin files with embedded fonts/palettes
            if (format === 'xb') {
                await this.loadXBinFile(imageData);
            } else {
                // Regular file loading
                this.canvas.setImageData(
                    imageData.columns || imageData.width,
                    imageData.rows || imageData.height,
                    imageData.data,
                    imageData.iceColours || imageData.noblink
                );
                
                // Set font if specified
                if (imageData.fontName && imageData.fontName !== this.fontManager.getCurrentFontName()) {
                    await this.fontManager.loadFontFromImage(
                        imageData.fontName,
                        imageData.letterSpacing || false,
                        this.palette
                    );
                }
            }
            
            this.isInitializing = false;
            
        } catch (error) {
            console.error('Failed to load image data:', error);
            this.isInitializing = false;
            throw error;
        }
    }

    async loadXBinFile(imageData) {
        // XBin files require sequential loading to avoid race conditions
        
        // 1. Update palette first if present
        if (imageData.paletteData) {
            const rgb6BitPalette = [];
            for (let i = 0; i < 16; i++) {
                const offset = i * 3;
                rgb6BitPalette.push([
                    imageData.paletteData[offset],
                    imageData.paletteData[offset + 1],
                    imageData.paletteData[offset + 2]
                ]);
            }
            this.palette.updateColors(rgb6BitPalette);
        }

        // 2. Load embedded font if present
        if (imageData.fontData) {
            await this.fontManager.loadFontFromXBData(
                imageData.fontData.bytes,
                imageData.fontData.width,
                imageData.fontData.height,
                imageData.letterSpacing || false,
                this.palette
            );
        }

        // 3. Finally load canvas data
        this.canvas.setImageData(
            imageData.columns,
            imageData.rows,
            imageData.data,
            imageData.iceColours
        );
    }

    // Public API methods
    async saveAsAnsi(metadata) {
        return this.fileManager.saveAsAnsi(this.canvas, metadata);
    }

    async saveAsPng(filename) {
        return this.fileManager.saveAsPng(this.canvas, filename);
    }

    async loadFile(file) {
        return this.fileManager.loadFile(file);
    }
}

// Usage
const app = new MoebiusApp();
app.initialize().then(() => {
    console.log('Moebius Web ready!');
}).catch(error => {
    console.error('Initialization failed:', error);
});
```

## Race Condition Mitigation Strategies

### 1. **Sequential Font Loading**

**Problem**: Font loading is asynchronous and multiple components depend on the font being ready.

**Solution**: Use `async/await` pattern and proper initialization flags:

```javascript
class FontManager {
    async loadFontFromImage(fontName, letterSpacing, palette) {
        // Atomic font loading operation
        try {
            const imageData = await this.loadImageData(`fonts/${fontName}.png`);
            const fontData = this.parseFontFromImage(imageData);
            const renderer = new FontRenderer(fontData, palette);
            renderer.setLetterSpacing(letterSpacing);
            
            // Only update state after everything is ready
            this.currentFont = renderer;
            this.currentFontName = fontName;
            
            this.emitFontChange(fontName);
            return renderer;
        } catch (error) {
            // Proper error handling prevents partial state
            console.error(`Failed to load font ${fontName}:`, error);
            throw error;
        }
    }
}
```

### 2. **Initialization State Management**

**Problem**: Events fired during initialization can cause cascading updates.

**Solution**: Use initialization flags to prevent recursive updates:

```javascript
class MoebiusApp {
    constructor() {
        this.isInitializing = true;
    }

    setupEventListeners() {
        this.palette.addEventListener('paletteChange', async (event) => {
            if (!this.isInitializing) {  // Prevent updates during init
                await this.regenerateFont();
            }
        });
    }
}
```

### 3. **Dependency Injection**

**Problem**: Global variables create implicit dependencies and unpredictable initialization order.

**Solution**: Explicit dependency injection:

```javascript
// Before: Global variables with implicit dependencies
var palette = createDefaultPalette();
var font = loadFontFromImage("CP437 8x16", false, palette, callback);
var textArtCanvas = createTextArtCanvas(container, callback);

// After: Explicit dependencies
const palette = createDefaultPalette();
const fontRenderer = await fontManager.loadFontFromImage("CP437 8x16", false, palette);
const canvas = createTextArtCanvas(container, fontRenderer, palette);
```

### 4. **Event-Driven State Synchronization**

**Problem**: Direct method calls create tight coupling and synchronization issues.

**Solution**: Event-driven communication with proper event ordering:

```javascript
class Canvas {
    setImageData(columns, rows, imageData, iceColours) {
        // Update state atomically
        this.state.columns = columns;
        this.state.rows = rows;
        this.state.imageData = new Uint16Array(imageData);
        this.state.iceColours = iceColours;
        
        // Render after state is complete
        this.renderer.createCanvases(this.state);
        this.renderer.redrawEntireImage(this.state);
        
        // Emit events after rendering is complete
        this.emitOpenedFile();
    }
}
```

### 5. **Promise-Based File Operations**

**Problem**: Callback-based file operations create callback hell and race conditions.

**Solution**: Promise-based operations with proper error handling:

```javascript
class FileManager {
    async loadFile(file) {
        try {
            const bytes = await this.readFileAsArrayBuffer(file);
            const extension = this.getFileExtension(file.name);
            
            let imageData;
            switch (extension) {
                case 'xb':
                    imageData = XBinLoader.load(bytes);
                    break;
                // ... other formats
            }
            
            this.emitFileLoaded(imageData, extension);
            return imageData;
        } catch (error) {
            console.error('Failed to load file:', error);
            throw error; // Proper error propagation
        }
    }
}
```

## UI Controller Integration

For a complete application, you would typically have a `UIController` that manages UI interactions:

```javascript
class UIController {
    constructor(app) {
        this.app = app;
        this.setupUI();
    }

    setupUI() {
        // File operations
        document.getElementById('load-file').addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                try {
                    await this.app.loadFile(file);
                } catch (error) {
                    this.showError('Failed to load file: ' + error.message);
                }
            }
        });

        // Color picker
        const paletteContainer = document.getElementById('palette-container');
        const palettePicker = createPalettePicker(paletteContainer, this.app.palette);

        // Tool selection
        document.getElementById('freehand-tool').addEventListener('click', () => {
            this.app.canvas.setTool('freehand');
        });
    }

    showError(message) {
        // Error UI handling
        console.error(message);
    }
}
```

## Benefits of This Architecture

1. **Eliminates Race Conditions**: Sequential async operations and proper state management
2. **Improved Testability**: Each module can be tested in isolation
3. **Better Maintainability**: Clear separation of concerns and responsibilities  
4. **Enhanced Error Handling**: Proper error propagation and recovery
5. **Modern JavaScript**: ES6+ features like classes, async/await, and modules
6. **Reduced Coupling**: Event-driven communication reduces interdependencies
7. **Scalability**: Easy to add new features without affecting existing modules

## Migration Strategy

1. **Phase 1**: Create new modules alongside existing code
2. **Phase 2**: Implement new main controller using new modules
3. **Phase 3**: Replace legacy code incrementally 
4. **Phase 4**: Remove old files and update build process
5. **Phase 5**: Add comprehensive tests for each module

This architecture provides a solid foundation for building a robust, maintainable ANSI art editor that avoids the race conditions and tight coupling issues of the original codebase.