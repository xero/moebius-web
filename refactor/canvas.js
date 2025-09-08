/**
 * Canvas Module - Manages canvas rendering, drawing operations, and undo/redo
 * ES6 modernized version extracted from core.js
 */

/**
 * Canvas configuration and state management
 */
class CanvasState {
    constructor(columns = 80, rows = 25, iceColours = false) {
        this.columns = columns;
        this.rows = rows;
        this.iceColours = iceColours;
        this.imageData = new Uint16Array(columns * rows);
        this.mirrorMode = false;
        
        // Undo/redo state
        this.currentUndo = [];
        this.undoBuffer = [];
        this.redoBuffer = [];
        this.drawHistory = [];
    }

    /**
     * Resize the canvas and preserve existing data
     */
    resize(newColumns, newRows) {
        if (newColumns === this.columns && newRows === this.rows) {
            return false;
        }

        if (newColumns <= 0 || newRows <= 0) {
            throw new Error('Canvas dimensions must be positive');
        }

        this.clearUndos();

        const maxColumn = Math.min(this.columns, newColumns);
        const maxRow = Math.min(this.rows, newRows);
        const newImageData = new Uint16Array(newColumns * newRows);

        // Copy existing data
        for (let y = 0; y < maxRow; y++) {
            for (let x = 0; x < maxColumn; x++) {
                newImageData[y * newColumns + x] = this.imageData[y * this.columns + x];
            }
        }

        this.imageData = newImageData;
        this.columns = newColumns;
        this.rows = newRows;

        return true;
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.clearUndos();
        this.imageData = new Uint16Array(this.columns * this.rows);
    }

    /**
     * Clear undo/redo history
     */
    clearUndos() {
        this.currentUndo = [];
        this.undoBuffer = [];
        this.redoBuffer = [];
    }

    /**
     * Set ICE colors mode
     */
    setIceColours(enabled) {
        this.iceColours = enabled;
    }

    /**
     * Set mirror mode
     */
    setMirrorMode(enabled) {
        this.mirrorMode = enabled;
    }

    /**
     * Get mirrored X coordinate
     */
    getMirrorX(x) {
        if (this.columns % 2 === 0) {
            // Even columns: split 50/50
            return this.columns - 1 - x;
        } else {
            // Odd columns: ignore center column
            const center = Math.floor(this.columns / 2);
            if (x === center) {
                return -1; // Don't mirror center column
            }
            return this.columns - 1 - x;
        }
    }

    /**
     * Transform character for horizontal mirroring
     */
    getMirrorCharCode(charCode) {
        switch (charCode) {
            case 221: // LEFT_HALF_BLOCK
                return 222; // RIGHT_HALF_BLOCK
            case 222: // RIGHT_HALF_BLOCK
                return 221; // LEFT_HALF_BLOCK
            case 223: // UPPER_HALF_BLOCK
            case 220: // LOWER_HALF_BLOCK
            default:
                return charCode;
        }
    }
}

/**
 * Canvas renderer handles the visual output and blinking
 */
class CanvasRenderer {
    constructor(canvasContainer, fontRenderer) {
        this.canvasContainer = canvasContainer;
        this.fontRenderer = fontRenderer;
        this.canvases = [];
        this.ctxs = [];
        this.offBlinkCanvases = [];
        this.onBlinkCanvases = [];
        this.offBlinkCtxs = [];
        this.onBlinkCtxs = [];
        this.blinkTimer = null;
        this.blinkOn = false;
    }

    /**
     * Create or recreate all canvases based on current dimensions
     */
    createCanvases(state) {
        // Clean up existing canvases
        this.cleanupCanvases();

        const fontWidth = this.fontRenderer.getCharacterWidth();
        const fontHeight = this.fontRenderer.getCharacterHeight();

        // Defensive checks for font dimensions
        if (!fontWidth || fontWidth <= 0) {
            console.warn('Invalid font width, falling back to 8px');
            fontWidth = 8;
        }
        if (!fontHeight || fontHeight <= 0) {
            console.warn('Invalid font height, falling back to 16px');
            fontHeight = 16;
        }

        const canvasWidth = fontWidth * state.columns;

        // Create canvases in 25-row chunks
        const fullChunks = Math.floor(state.rows / 25);
        for (let i = 0; i < fullChunks; i++) {
            this.createCanvasChunk(canvasWidth, fontHeight * 25);
        }

        // Create remaining rows if any
        const remainingRows = state.rows % 25;
        if (remainingRows > 0) {
            this.createCanvasChunk(canvasWidth, fontHeight * remainingRows);
        }

        // Update container size
        this.canvasContainer.style.width = canvasWidth + 'px';

        // Append canvases to container
        this.canvases.forEach(canvas => {
            this.canvasContainer.appendChild(canvas);
        });

        // Set up blinking if not in ICE colors mode
        this.updateBlinkTimer(state.iceColours);
    }

    /**
     * Create a single canvas chunk with blink variants
     */
    createCanvasChunk(width, height) {
        // Main canvas
        const canvas = this.createCanvas(width, height);
        this.canvases.push(canvas);
        this.ctxs.push(canvas.getContext('2d'));

        // On-blink canvas
        const onBlinkCanvas = this.createCanvas(width, height);
        this.onBlinkCanvases.push(onBlinkCanvas);
        this.onBlinkCtxs.push(onBlinkCanvas.getContext('2d'));

        // Off-blink canvas
        const offBlinkCanvas = this.createCanvas(width, height);
        this.offBlinkCanvases.push(offBlinkCanvas);
        this.offBlinkCtxs.push(offBlinkCanvas.getContext('2d'));
    }

    /**
     * Create a canvas element
     */
    createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    /**
     * Clean up existing canvases
     */
    cleanupCanvases() {
        if (this.canvases.length > 0) {
            this.canvases.forEach(canvas => {
                if (canvas.parentNode) {
                    this.canvasContainer.removeChild(canvas);
                }
            });
        }

        this.canvases = [];
        this.ctxs = [];
        this.offBlinkCanvases = [];
        this.onBlinkCanvases = [];
        this.offBlinkCtxs = [];
        this.onBlinkCtxs = [];
    }

    /**
     * Redraw a single character glyph
     */
    redrawGlyph(index, x, y, state) {
        const contextIndex = Math.floor(y / 25);
        const contextY = y % 25;
        const charCode = state.imageData[index] >> 8;
        let background = (state.imageData[index] >> 4) & 15;
        const foreground = state.imageData[index] & 15;

        if (state.iceColours) {
            // ICE colors mode - no blinking
            this.fontRenderer.draw(charCode, foreground, background, this.ctxs[contextIndex], x, contextY);
        } else {
            // Handle blinking
            if (background >= 8) {
                background -= 8;
                // Blinking character
                this.fontRenderer.draw(charCode, foreground, background, this.offBlinkCtxs[contextIndex], x, contextY);
                this.fontRenderer.draw(charCode, background, background, this.onBlinkCtxs[contextIndex], x, contextY);
            } else {
                // Non-blinking character
                this.fontRenderer.draw(charCode, foreground, background, this.offBlinkCtxs[contextIndex], x, contextY);
                this.fontRenderer.draw(charCode, foreground, background, this.onBlinkCtxs[contextIndex], x, contextY);
            }
        }
    }

    /**
     * Redraw entire canvas
     */
    redrawEntireImage(state) {
        for (let y = 0, i = 0; y < state.rows; y++) {
            for (let x = 0; x < state.columns; x++, i++) {
                this.redrawGlyph(i, x, y, state);
            }
        }

        // Update main canvases with current blink state
        if (!state.iceColours) {
            this.updateBlinkDisplay();
        }
    }

    /**
     * Update blink timer based on ICE colors setting
     */
    updateBlinkTimer(iceColours) {
        if (this.blinkTimer) {
            clearInterval(this.blinkTimer);
            this.blinkTimer = null;
        }

        if (!iceColours) {
            this.blinkOn = false;
            this.blinkTimer = setInterval(() => this.toggleBlink(), 500);
        }
    }

    /**
     * Toggle blink state and update display
     */
    toggleBlink() {
        this.blinkOn = !this.blinkOn;
        this.updateBlinkDisplay();
    }

    /**
     * Update main canvases with current blink state
     */
    updateBlinkDisplay() {
        const sourceCanvases = this.blinkOn ? this.onBlinkCanvases : this.offBlinkCanvases;
        
        for (let i = 0; i < this.ctxs.length; i++) {
            this.ctxs[i].clearRect(0, 0, this.canvases[i].width, this.canvases[i].height);
            this.ctxs[i].drawImage(sourceCanvases[i], 0, 0);
        }
    }

    /**
     * Get complete rendered image as single canvas
     */
    getImage(state) {
        const fontWidth = this.fontRenderer.getCharacterWidth();
        const fontHeight = this.fontRenderer.getCharacterHeight();
        const completeCanvas = this.createCanvas(fontWidth * state.columns, fontHeight * state.rows);
        const ctx = completeCanvas.getContext('2d');

        let y = 0;
        const sourceCanvases = state.iceColours ? this.canvases : this.offBlinkCanvases;
        
        sourceCanvases.forEach(canvas => {
            ctx.drawImage(canvas, 0, y);
            y += canvas.height;
        });

        return completeCanvas;
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.blinkTimer) {
            clearInterval(this.blinkTimer);
        }
        this.cleanupCanvases();
    }
}

/**
 * Main TextArt Canvas class - coordinates state and rendering
 */
class TextArtCanvas {
    constructor(canvasContainer, fontRenderer, palette) {
        this.state = new CanvasState();
        this.renderer = new CanvasRenderer(canvasContainer, fontRenderer);
        this.palette = palette;
        this.fontRenderer = fontRenderer;
        this.eventTarget = new EventTarget();

        // Initialize the canvas
        this.renderer.createCanvases(this.state);
        this.renderer.redrawEntireImage(this.state);
    }

    /**
     * Resize the canvas
     */
    resize(columns, rows) {
        const changed = this.state.resize(columns, rows);
        if (changed) {
            this.renderer.createCanvases(this.state);
            this.renderer.redrawEntireImage(this.state);
            this.emitSizeChange();
        }
        return changed;
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.state.clear();
        this.renderer.redrawEntireImage(this.state);
    }

    /**
     * Draw a character at the specified position
     */
    draw(index, charCode, foreground, background, x, y) {
        // Store for undo
        this.state.currentUndo.push([index, this.state.imageData[index], x, y]);
        
        // Update image data
        this.state.imageData[index] = (charCode << 8) + (background << 4) + foreground;
        this.state.drawHistory.push((index << 16) + this.state.imageData[index]);
        
        // Redraw the affected glyph
        this.renderer.redrawGlyph(index, x, y, this.state);
        
        // Handle mirror mode
        if (this.state.mirrorMode) {
            const mirrorX = this.state.getMirrorX(x);
            if (mirrorX >= 0) {
                const mirrorIndex = y * this.state.columns + mirrorX;
                const mirrorChar = this.state.getMirrorCharCode(charCode);
                this.draw(mirrorIndex, mirrorChar, foreground, background, mirrorX, y);
            }
        }
    }

    /**
     * Get block information at position
     */
    getBlock(x, y) {
        const index = y * this.state.columns + x;
        const charCode = this.state.imageData[index] >> 8;
        const foregroundColour = this.state.imageData[index] & 15;
        const backgroundColour = (this.state.imageData[index] >> 4) & 15;
        
        return {
            x,
            y,
            charCode,
            foregroundColour,
            backgroundColour
        };
    }

    /**
     * Get half-block information for pixel-level editing
     */
    getHalfBlock(x, y) {
        const textY = Math.floor(y / 2);
        const index = textY * this.state.columns + x;
        const foreground = this.state.imageData[index] & 15;
        const background = (this.state.imageData[index] >> 4) & 15;
        const charCode = this.state.imageData[index] >> 8;
        
        let upperBlockColour = 0;
        let lowerBlockColour = 0;
        let isBlocky = false;
        let isVerticalBlocky = false;
        let leftBlockColour, rightBlockColour;
        
        switch (charCode) {
            case 0:
            case 32:
            case 255:
                upperBlockColour = background;
                lowerBlockColour = background;
                isBlocky = true;
                break;
            case 220: // LOWER_HALF_BLOCK
                upperBlockColour = background;
                lowerBlockColour = foreground;
                isBlocky = true;
                break;
            case 221: // LEFT_HALF_BLOCK
                isVerticalBlocky = true;
                leftBlockColour = foreground;
                rightBlockColour = background;
                break;
            case 222: // RIGHT_HALF_BLOCK
                isVerticalBlocky = true;
                leftBlockColour = background;
                rightBlockColour = foreground;
                break;
            case 223: // UPPER_HALF_BLOCK
                upperBlockColour = foreground;
                lowerBlockColour = background;
                isBlocky = true;
                break;
            default:
                upperBlockColour = foreground;
                lowerBlockColour = foreground;
                isBlocky = false;
                break;
        }
        
        return {
            x,
            y,
            textX: x,
            textY,
            upperBlockColour,
            lowerBlockColour,
            leftBlockColour,
            rightBlockColour,
            isBlocky,
            isVerticalBlocky
        };
    }

    /**
     * Start undo operation
     */
    startUndo() {
        if (this.state.currentUndo.length > 0) {
            this.state.undoBuffer.push(this.state.currentUndo);
            this.state.currentUndo = [];
        }
        this.state.redoBuffer = [];
    }

    /**
     * Undo last operation
     */
    undo() {
        if (this.state.undoBuffer.length > 0) {
            const undoData = this.state.undoBuffer.pop();
            const redoData = [];
            
            undoData.forEach(([index, originalValue, x, y]) => {
                redoData.push([index, this.state.imageData[index], x, y]);
                this.state.imageData[index] = originalValue;
                this.renderer.redrawGlyph(index, x, y, this.state);
            });
            
            this.state.redoBuffer.push(redoData);
            return true;
        }
        return false;
    }

    /**
     * Redo last undone operation
     */
    redo() {
        if (this.state.redoBuffer.length > 0) {
            const redoData = this.state.redoBuffer.pop();
            const undoData = [];
            
            redoData.forEach(([index, redoValue, x, y]) => {
                undoData.push([index, this.state.imageData[index], x, y]);
                this.state.imageData[index] = redoValue;
                this.renderer.redrawGlyph(index, x, y, this.state);
            });
            
            this.state.undoBuffer.push(undoData);
            return true;
        }
        return false;
    }

    /**
     * Delete an area of the canvas
     */
    deleteArea(x, y, width, height, background) {
        this.startUndo();
        
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const currentX = x + dx;
                const currentY = y + dy;
                
                if (currentX >= 0 && currentX < this.state.columns && 
                    currentY >= 0 && currentY < this.state.rows) {
                    const index = currentY * this.state.columns + currentX;
                    this.draw(index, 0, 0, background, currentX, currentY);
                }
            }
        }
    }

    /**
     * Get area data for copy operations
     */
    getArea(x, y, width, height) {
        const area = [];
        
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const currentX = x + dx;
                const currentY = y + dy;
                
                if (currentX >= 0 && currentX < this.state.columns && 
                    currentY >= 0 && currentY < this.state.rows) {
                    const index = currentY * this.state.columns + currentX;
                    area.push(this.state.imageData[index]);
                } else {
                    area.push(0); // Empty space
                }
            }
        }
        
        return area;
    }

    /**
     * Set area data for paste operations
     */
    setArea(area, x, y, width, height) {
        this.startUndo();
        
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const currentX = x + dx;
                const currentY = y + dy;
                
                if (currentX >= 0 && currentX < this.state.columns && 
                    currentY >= 0 && currentY < this.state.rows) {
                    const index = currentY * this.state.columns + currentX;
                    const areaIndex = dy * width + dx;
                    
                    if (areaIndex < area.length) {
                        const value = area[areaIndex];
                        const charCode = value >> 8;
                        const background = (value >> 4) & 15;
                        const foreground = value & 15;
                        this.draw(index, charCode, foreground, background, currentX, currentY);
                    }
                }
            }
        }
    }

    /**
     * Quick draw for bulk operations
     */
    quickDraw(blocks) {
        blocks.forEach(block => {
            const index = block.y * this.state.columns + block.x;
            this.state.imageData[index] = (block.charCode << 8) + (block.background << 4) + block.foreground;
            this.renderer.redrawGlyph(index, block.x, block.y, this.state);
        });
    }

    /**
     * Set image data (for file loading)
     */
    setImageData(columns, rows, imageData, iceColours) {
        this.state.clearUndos();
        this.state.columns = columns;
        this.state.rows = rows;
        this.state.imageData = new Uint16Array(imageData);
        
        if (this.state.iceColours !== iceColours) {
            this.state.iceColours = iceColours;
        }
        
        this.renderer.createCanvases(this.state);
        this.renderer.redrawEntireImage(this.state);
        this.emitOpenedFile();
    }

    /**
     * Update font renderer and recreate canvases
     */
    setFontRenderer(fontRenderer) {
        this.fontRenderer = fontRenderer;
        this.renderer.fontRenderer = fontRenderer;
        this.renderer.createCanvases(this.state);
        this.renderer.redrawEntireImage(this.state);
    }

    // Getters
    getColumns() { return this.state.columns; }
    getRows() { return this.state.rows; }
    getIceColours() { return this.state.iceColours; }
    getMirrorMode() { return this.state.mirrorMode; }
    getImageData() { return this.state.imageData; }
    getImage() { return this.renderer.getImage(this.state); }

    // Setters
    setIceColours(enabled) {
        if (this.state.iceColours !== enabled) {
            this.state.setIceColours(enabled);
            this.renderer.updateBlinkTimer(enabled);
            this.renderer.redrawEntireImage(this.state);
        }
    }
    
    setMirrorMode(enabled) {
        this.state.setMirrorMode(enabled);
    }

    /**
     * Event handling
     */
    addEventListener(type, listener) {
        this.eventTarget.addEventListener(type, listener);
    }

    removeEventListener(type, listener) {
        this.eventTarget.removeEventListener(type, listener);
    }

    emitSizeChange() {
        const detail = { columns: this.state.columns, rows: this.state.rows };
        this.eventTarget.dispatchEvent(new CustomEvent('sizeChange', { detail }));
        document.dispatchEvent(new CustomEvent('onTextCanvasSizeChange', { detail }));
    }

    emitOpenedFile() {
        this.eventTarget.dispatchEvent(new CustomEvent('openedFile'));
        document.dispatchEvent(new CustomEvent('onOpenedFile'));
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.renderer.destroy();
    }
}

/**
 * Factory function for creating TextArt Canvas
 */
export function createTextArtCanvas(canvasContainer, fontRenderer, palette) {
    return new TextArtCanvas(canvasContainer, fontRenderer, palette);
}

// Main exports
export { TextArtCanvas, CanvasState, CanvasRenderer };

// Default export
export default {
    TextArtCanvas,
    CanvasState,
    CanvasRenderer,
    createTextArtCanvas
};