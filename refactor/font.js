/**
 * Font Module - Manages font loading, rendering, and character operations
 * ES6 modernized version extracted from core.js
 */

/**
 * Font data structure and utilities
 */
class FontData {
    constructor(width, height, data) {
        this.width = width;
        this.height = height;
        this.data = data; // Uint8Array of bit data
    }

    /**
     * Validate font data integrity
     */
    isValid() {
        return (
            this.width > 0 && 
            this.height > 0 && 
            this.data && 
            this.data.length >= (this.width * this.height * 256 / 8)
        );
    }
}

/**
 * Font renderer that generates colored glyphs from font data
 */
class FontRenderer {
    constructor(fontData, palette) {
        this.fontData = fontData;
        this.palette = palette;
        this.letterSpacing = false;
        this.fontGlyphs = null;
        this.alphaGlyphs = null;
        this.letterSpacingImageData = null;
        
        this.generateGlyphs();
    }

    /**
     * Generate all colored glyphs for all color combinations
     */
    generateGlyphs() {
        if (!this.fontData.isValid()) {
            console.error('Invalid font data for glyph generation');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = this.fontData.width;
        canvas.height = this.fontData.height;
        const ctx = canvas.getContext('2d');

        // Convert bit data to array for easier access
        const bits = this.convertBitData();
        
        // Generate colored glyphs for all foreground/background combinations
        this.fontGlyphs = this.generateColoredGlyphs(ctx, bits);
        
        // Generate alpha glyphs for half-block rendering
        this.alphaGlyphs = this.generateAlphaGlyphs(ctx, bits);
        
        // Generate letter spacing data
        this.letterSpacingImageData = this.generateLetterSpacingData();
    }

    /**
     * Convert packed bit data to expanded bit array
     */
    convertBitData() {
        const bits = new Uint8Array(this.fontData.width * this.fontData.height * 256);
        
        for (let i = 0, k = 0; i < this.fontData.data.length; i++) {
            for (let j = 7; j >= 0; j--, k++) {
                bits[k] = (this.fontData.data[i] >> j) & 1;
            }
        }
        
        return bits;
    }

    /**
     * Generate colored glyphs for all color combinations
     */
    generateColoredGlyphs(ctx, bits) {
        const glyphs = new Array(16);
        
        for (let foreground = 0; foreground < 16; foreground++) {
            glyphs[foreground] = new Array(16);
            
            for (let background = 0; background < 16; background++) {
                glyphs[foreground][background] = new Array(256);
                
                for (let charCode = 0; charCode < 256; charCode++) {
                    const imageData = ctx.createImageData(this.fontData.width, this.fontData.height);
                    
                    for (let i = 0, j = charCode * this.fontData.width * this.fontData.height; 
                         i < this.fontData.width * this.fontData.height; 
                         i++, j++) {
                        const colorIndex = (bits[j] === 1) ? foreground : background;
                        const color = this.palette.getRGBAColour(colorIndex);
                        imageData.data.set(color, i * 4);
                    }
                    
                    glyphs[foreground][background][charCode] = imageData;
                }
            }
        }
        
        return glyphs;
    }

    /**
     * Generate alpha glyphs for half-block characters
     */
    generateAlphaGlyphs(ctx, bits) {
        const alphaGlyphs = new Array(16);
        
        for (let foreground = 0; foreground < 16; foreground++) {
            alphaGlyphs[foreground] = new Array(256);
            
            for (let charCode = 0; charCode < 256; charCode++) {
                // Only generate alpha glyphs for half-block characters
                if (charCode === 220 || charCode === 223) {
                    const imageData = ctx.createImageData(this.fontData.width, this.fontData.height);
                    
                    for (let i = 0, j = charCode * this.fontData.width * this.fontData.height; 
                         i < this.fontData.width * this.fontData.height; 
                         i++, j++) {
                        if (bits[j] === 1) {
                            const color = this.palette.getRGBAColour(foreground);
                            imageData.data.set(color, i * 4);
                        }
                    }
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = imageData.width;
                    canvas.height = imageData.height;
                    canvas.getContext('2d').putImageData(imageData, 0, 0);
                    alphaGlyphs[foreground][charCode] = canvas;
                }
            }
        }
        
        return alphaGlyphs;
    }

    /**
     * Generate letter spacing data for extended character width
     */
    generateLetterSpacingData() {
        const spacingData = new Array(16);
        
        for (let i = 0; i < 16; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = this.fontData.height;
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, 1, this.fontData.height);
            const color = this.palette.getRGBAColour(i);
            
            for (let j = 0; j < this.fontData.height; j++) {
                imageData.data.set(color, j * 4);
            }
            
            spacingData[i] = imageData;
        }
        
        return spacingData;
    }

    /**
     * Draw a character to the canvas context
     */
    draw(charCode, foreground, background, ctx, x, y) {
        // Defensive checks to prevent race condition errors
        if (!this.fontGlyphs || 
            !this.fontGlyphs[foreground] || 
            !this.fontGlyphs[foreground][background] || 
            !this.fontGlyphs[foreground][background][charCode]) {
            console.warn('Font glyph not available:', { foreground, background, charCode });
            return;
        }

        const charWidth = this.getCharacterWidth();
        const posX = x * charWidth;
        const posY = y * this.fontData.height;

        if (this.letterSpacing) {
            // Draw character with letter spacing
            ctx.putImageData(this.fontGlyphs[foreground][background][charCode], posX, posY);
            
            // Handle extended characters that span into spacing area
            if (charCode >= 192 && charCode <= 223) {
                ctx.putImageData(
                    this.fontGlyphs[foreground][background][charCode], 
                    posX + 1, posY, 
                    this.fontData.width - 1, 0, 
                    1, this.fontData.height
                );
            } else {
                // Draw spacing pixel
                ctx.putImageData(this.letterSpacingImageData[background], posX + 8, posY);
            }
        } else {
            // Normal character drawing
            ctx.putImageData(this.fontGlyphs[foreground][background][charCode], posX, posY);
        }
    }

    /**
     * Draw character with alpha blending (for half-blocks)
     */
    drawWithAlpha(charCode, foreground, ctx, x, y) {
        if (!this.alphaGlyphs || 
            !this.alphaGlyphs[foreground] || 
            !this.alphaGlyphs[foreground][charCode]) {
            return;
        }

        const charWidth = this.getCharacterWidth();
        const posX = x * charWidth;
        const posY = y * this.fontData.height;

        if (this.letterSpacing) {
            ctx.drawImage(this.alphaGlyphs[foreground][charCode], posX, posY);
            
            if (charCode >= 192 && charCode <= 223) {
                ctx.drawImage(
                    this.alphaGlyphs[foreground][charCode], 
                    this.fontData.width - 1, 0, 
                    1, this.fontData.height, 
                    posX + this.fontData.width, posY, 
                    1, this.fontData.height
                );
            }
        } else {
            ctx.drawImage(this.alphaGlyphs[foreground][charCode], posX, posY);
        }
    }

    /**
     * Get effective character width including spacing
     */
    getCharacterWidth() {
        return this.letterSpacing ? this.fontData.width + 1 : this.fontData.width;
    }

    /**
     * Get character height
     */
    getCharacterHeight() {
        return this.fontData.height;
    }

    /**
     * Set letter spacing and regenerate glyphs if changed
     */
    setLetterSpacing(enabled) {
        if (this.letterSpacing !== enabled) {
            this.letterSpacing = enabled;
            this.generateGlyphs();
            return true; // Indicates change occurred
        }
        return false;
    }

    /**
     * Get current letter spacing setting
     */
    getLetterSpacing() {
        return this.letterSpacing;
    }
}

/**
 * Font Manager - handles font loading and management
 */
class FontManager {
    constructor() {
        this.fonts = new Map();
        this.currentFont = null;
        this.currentFontName = '';
        this.eventTarget = new EventTarget();
    }

    /**
     * Load font from image file
     */
    async loadFontFromImage(fontName, letterSpacing, palette) {
        try {
            const imageData = await this.loadImageData(`fonts/${fontName}.png`);
            const fontData = this.parseFontFromImage(imageData);
            
            if (!fontData) {
                throw new Error(`Invalid font data in ${fontName}.png`);
            }

            const renderer = new FontRenderer(fontData, palette);
            renderer.setLetterSpacing(letterSpacing);
            
            this.fonts.set(fontName, renderer);
            this.currentFont = renderer;
            this.currentFontName = fontName;
            
            this.emitFontChange(fontName);
            return renderer;
        } catch (error) {
            console.error(`Failed to load font ${fontName}:`, error);
            throw error;
        }
    }

    /**
     * Load font from XBin data
     */
    async loadFontFromXBData(fontBytes, fontWidth, fontHeight, letterSpacing, palette) {
        try {
            const fontData = this.parseFontFromXBData(fontBytes, fontWidth, fontHeight);
            
            if (!fontData) {
                throw new Error('Invalid XBin font data');
            }

            const renderer = new FontRenderer(fontData, palette);
            renderer.setLetterSpacing(letterSpacing);
            
            const fontName = 'XBIN';
            this.fonts.set(fontName, renderer);
            this.currentFont = renderer;
            this.currentFontName = fontName;
            
            this.emitFontChange(fontName);
            return renderer;
        } catch (error) {
            console.error('Failed to load XBin font:', error);
            throw error;
        }
    }

    /**
     * Parse font data from PNG image
     */
    parseFontFromImage(imageData) {
        const fontWidth = imageData.width / 16;
        const fontHeight = imageData.height / 16;
        
        if (fontWidth !== 8 || imageData.height % 16 !== 0 || fontHeight < 1 || fontHeight > 32) {
            return null;
        }

        const data = new Uint8Array(fontWidth * fontHeight * 256 / 8);
        let k = 0;
        
        for (let charCode = 0; charCode < 256; charCode++) {
            const x = (charCode % 16) * fontWidth;
            const y = Math.floor(charCode / 16) * fontHeight;
            let pos = (y * imageData.width + x) * 4;
            let i = 0;
            
            while (i < fontWidth * fontHeight) {
                data[k] = data[k] << 1;
                
                if (imageData.data[pos] > 127) {
                    data[k] += 1;
                }
                
                if ((++i) % fontWidth === 0) {
                    pos += (imageData.width - 8) * 4;
                }
                
                if (i % 8 === 0) {
                    k++;
                }
                
                pos += 4;
            }
        }
        
        return new FontData(fontWidth, fontHeight, data);
    }

    /**
     * Parse font data from XBin format
     */
    parseFontFromXBData(fontBytes, fontWidth, fontHeight) {
        if (!fontBytes || fontBytes.length === 0) {
            console.error('Invalid fontBytes provided');
            return null;
        }

        // Ensure valid dimensions
        if (!fontWidth || fontWidth <= 0) fontWidth = 8;
        if (!fontHeight || fontHeight <= 0) fontHeight = 16;

        const expectedDataSize = fontHeight * 256;
        if (fontBytes.length < expectedDataSize) {
            console.warn('XB font data too small. Expected:', expectedDataSize, 'Got:', fontBytes.length);
        }

        // XB format stores bytes directly - each byte is one scanline
        const data = new Uint8Array(fontWidth * fontHeight * 256 / 8);
        
        // Copy XB font data directly
        for (let i = 0; i < data.length && i < fontBytes.length; i++) {
            data[i] = fontBytes[i];
        }

        return new FontData(fontWidth, fontHeight, data);
    }

    /**
     * Load image data from URL
     */
    loadImageData(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.addEventListener('load', () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                resolve(imageData);
            });
            
            img.addEventListener('error', () => {
                reject(new Error(`Failed to load image: ${url}`));
            });
            
            img.src = url;
        });
    }

    /**
     * Get current font renderer
     */
    getCurrentFont() {
        return this.currentFont;
    }

    /**
     * Get current font name
     */
    getCurrentFontName() {
        return this.currentFontName;
    }

    /**
     * Set letter spacing on current font
     */
    setLetterSpacing(enabled) {
        if (this.currentFont) {
            const changed = this.currentFont.setLetterSpacing(enabled);
            if (changed) {
                this.emitLetterSpacingChange(enabled);
            }
        }
    }

    /**
     * Get letter spacing setting
     */
    getLetterSpacing() {
        return this.currentFont ? this.currentFont.getLetterSpacing() : false;
    }

    /**
     * Add event listener
     */
    addEventListener(type, listener) {
        this.eventTarget.addEventListener(type, listener);
    }

    /**
     * Remove event listener
     */
    removeEventListener(type, listener) {
        this.eventTarget.removeEventListener(type, listener);
    }

    /**
     * Emit font change event
     */
    emitFontChange(fontName) {
        this.eventTarget.dispatchEvent(new CustomEvent('fontChange', { detail: fontName }));
        // Legacy compatibility
        document.dispatchEvent(new CustomEvent('onFontChange', { detail: fontName }));
    }

    /**
     * Emit letter spacing change event
     */
    emitLetterSpacingChange(letterSpacing) {
        this.eventTarget.dispatchEvent(new CustomEvent('letterSpacingChange', { detail: letterSpacing }));
        // Legacy compatibility
        document.dispatchEvent(new CustomEvent('onLetterSpacingChange', { detail: letterSpacing }));
    }
}

/**
 * Factory functions for backward compatibility
 */
export function createFontManager() {
    return new FontManager();
}

export async function loadFontFromImage(fontName, letterSpacing, palette) {
    const manager = new FontManager();
    return await manager.loadFontFromImage(fontName, letterSpacing, palette);
}

export async function loadFontFromXBData(fontBytes, fontWidth, fontHeight, letterSpacing, palette) {
    const manager = new FontManager();
    return await manager.loadFontFromXBData(fontBytes, fontWidth, fontHeight, letterSpacing, palette);
}

// Main exports
export { FontData, FontRenderer, FontManager };

// Default export for convenience
export default {
    FontData,
    FontRenderer,
    FontManager,
    createFontManager,
    loadFontFromImage,
    loadFontFromXBData
};