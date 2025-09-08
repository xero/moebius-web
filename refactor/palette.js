/**
 * Palette Module - Manages color palettes and color operations
 * ES6 modernized version extracted from core.js
 */

/**
 * Color manipulation utilities for palette operations
 */
class ColorUtils {
    /**
     * Convert RGB values to Lab color space for better color matching
     */
    static rgb2lab(rgb) {
        // Convert RGB to XYZ
        const xyz = rgb.map(value => {
            value = value / 255;
            return ((value > 0.04045) ? Math.pow((value + 0.055) / 1.055, 2.4) : value / 12.92) * 100;
        });
        
        const x = xyz[0] * 0.4124 + xyz[1] * 0.3576 + xyz[2] * 0.1805;
        const y = xyz[0] * 0.2126 + xyz[1] * 0.7152 + xyz[2] * 0.0722;
        const z = xyz[0] * 0.0193 + xyz[1] * 0.1192 + xyz[2] * 0.9505;
        
        // Convert XYZ to Lab
        const processValue = value => (value > 0.008856) ? Math.pow(value, 1 / 3) : (7.787 * value) + (16 / 116);
        const labX = processValue(x / 95.047);
        const labY = processValue(y / 100);
        const labZ = processValue(z / 108.883);
        
        return [116 * labY - 16, 500 * (labX - labY), 200 * (labY - labZ)];
    }

    /**
     * Calculate color difference using Delta E (CIE76)
     */
    static labDeltaE(lab1, lab2) {
        return Math.sqrt(
            Math.pow(lab1[0] - lab2[0], 2) + 
            Math.pow(lab1[1] - lab2[1], 2) + 
            Math.pow(lab1[2] - lab2[2], 2)
        );
    }

    /**
     * Find closest color match in palette using Lab color space
     */
    static findClosestColor(targetLab, paletteLab) {
        let match = 0;
        let lowestDelta = Number.MAX_VALUE;
        
        for (let i = 0; i < paletteLab.length; i++) {
            const delta = this.labDeltaE(targetLab, paletteLab[i]);
            if (delta < lowestDelta) {
                match = i;
                lowestDelta = delta;
            }
        }
        
        return match;
    }
}

/**
 * Core Palette class - manages colors and color operations
 */
class Palette {
    constructor(rgb6BitColors) {
        this.rgbaColors = rgb6BitColors.map(rgb6Bit => new Uint8Array([
            rgb6Bit[0] << 2 | rgb6Bit[0] >> 4,
            rgb6Bit[1] << 2 | rgb6Bit[1] >> 4,
            rgb6Bit[2] << 2 | rgb6Bit[2] >> 4,
            255
        ]));
        
        this.foreground = 7;
        this.background = 0;
        this.eventTarget = new EventTarget();
    }

    /**
     * Get RGBA color values for a color index
     */
    getRGBAColour(index) {
        return this.rgbaColors[index];
    }

    /**
     * Get current foreground color index
     */
    getForegroundColour() {
        return this.foreground;
    }

    /**
     * Get current background color index
     */
    getBackgroundColour() {
        return this.background;
    }

    /**
     * Set foreground color and emit change event
     */
    setForegroundColour(newForeground) {
        if (this.foreground !== newForeground) {
            this.foreground = newForeground;
            this.eventTarget.dispatchEvent(new CustomEvent('foregroundChange', { 
                detail: newForeground 
            }));
            // Legacy event for compatibility
            document.dispatchEvent(new CustomEvent('onForegroundChange', { 
                detail: newForeground 
            }));
        }
    }

    /**
     * Set background color and emit change event
     */
    setBackgroundColour(newBackground) {
        if (this.background !== newBackground) {
            this.background = newBackground;
            this.eventTarget.dispatchEvent(new CustomEvent('backgroundChange', { 
                detail: newBackground 
            }));
            // Legacy event for compatibility
            document.dispatchEvent(new CustomEvent('onBackgroundChange', { 
                detail: newBackground 
            }));
        }
    }

    /**
     * Swap foreground and background colors
     */
    swapColors() {
        const temp = this.foreground;
        this.setForegroundColour(this.background);
        this.setBackgroundColour(temp);
    }

    /**
     * Reset to default colors (white on black)
     */
    resetToDefault() {
        this.setForegroundColour(7);
        this.setBackgroundColour(0);
    }

    /**
     * Update palette colors (for XBin palette loading)
     */
    updateColors(rgb6BitColors) {
        this.rgbaColors = rgb6BitColors.map(rgb6Bit => new Uint8Array([
            rgb6Bit[0] << 2 | rgb6Bit[0] >> 4,
            rgb6Bit[1] << 2 | rgb6Bit[1] >> 4,
            rgb6Bit[2] << 2 | rgb6Bit[2] >> 4,
            255
        ]));
        
        this.eventTarget.dispatchEvent(new CustomEvent('paletteChange'));
        // Legacy event for compatibility
        document.dispatchEvent(new CustomEvent('onPaletteChange'));
    }

    /**
     * Add event listener for palette events
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
     * Get all colors as RGB values for external use
     */
    getAllColors() {
        return this.rgbaColors.map(rgba => [rgba[0], rgba[1], rgba[2]]);
    }
}

/**
 * Palette Preview component - shows current foreground/background colors
 */
class PalettePreview {
    constructor(canvas, palette) {
        this.canvas = canvas;
        this.palette = palette;
        this.ctx = canvas.getContext('2d');
        
        // Bind to palette changes
        this.palette.addEventListener('foregroundChange', () => this.updatePreview());
        this.palette.addEventListener('backgroundChange', () => this.updatePreview());
        this.palette.addEventListener('paletteChange', () => this.updatePreview());
        
        this.updatePreview();
    }

    updatePreview() {
        const { width: w, height: h } = this.canvas;
        const squareSize = Math.floor(Math.min(w, h) * 0.6);
        const offset = Math.floor(squareSize * 0.66) + 1;
        
        this.ctx.clearRect(0, 0, w, h);
        
        // Background color square
        const bgColor = this.palette.getRGBAColour(this.palette.getBackgroundColour());
        this.ctx.fillStyle = `rgba(${bgColor.join(',')})`;
        this.ctx.fillRect(offset, 0, squareSize, squareSize);
        
        // Foreground color square
        const fgColor = this.palette.getRGBAColour(this.palette.getForegroundColour());
        this.ctx.fillStyle = `rgba(${fgColor.join(',')})`;
        this.ctx.fillRect(0, offset, squareSize, squareSize);
    }
}

/**
 * Palette Picker component - interactive color selection interface
 */
class PalettePicker {
    constructor(canvas, palette) {
        this.canvas = canvas;
        this.palette = palette;
        this.ctx = canvas.getContext('2d');
        
        this.setupEventListeners();
        this.updatePalette();
    }

    setupEventListeners() {
        // Touch and mouse events for color selection
        this.canvas.addEventListener('touchstart', (evt) => this.pressStart(evt));
        this.canvas.addEventListener('touchend', (evt) => this.touchEnd(evt));
        this.canvas.addEventListener('touchcancel', (evt) => this.touchEnd(evt));
        this.canvas.addEventListener('mouseup', (evt) => this.mouseEnd(evt));
        this.canvas.addEventListener('contextmenu', (evt) => evt.preventDefault());
        
        // Listen for palette changes
        this.palette.addEventListener('paletteChange', () => this.updatePalette());
        this.palette.addEventListener('foregroundChange', () => this.updateSelection());
        this.palette.addEventListener('backgroundChange', () => this.updateSelection());
    }

    pressStart(evt) {
        evt.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = evt.touches ? evt.touches[0].clientX - rect.left : evt.clientX - rect.left;
        const y = evt.touches ? evt.touches[0].clientY - rect.top : evt.clientY - rect.top;
        
        this.selectColorAt(x, y, evt.button === 2 || evt.shiftKey);
    }

    touchEnd(evt) {
        evt.preventDefault();
    }

    mouseEnd(evt) {
        evt.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;
        
        this.selectColorAt(x, y, evt.button === 2 || evt.shiftKey);
    }

    selectColorAt(x, y, isRightClick) {
        // Calculate which color was clicked (4x4 grid)
        const colorW = this.canvas.width / 4;
        const colorH = this.canvas.height / 4;
        const colorX = Math.floor(x / colorW);
        const colorY = Math.floor(y / colorH);
        const colorIndex = colorY * 4 + colorX;
        
        if (colorIndex >= 0 && colorIndex < 16) {
            if (isRightClick) {
                this.palette.setBackgroundColour(colorIndex);
            } else {
                this.palette.setForegroundColour(colorIndex);
            }
        }
    }

    updatePalette() {
        const colorW = this.canvas.width / 4;
        const colorH = this.canvas.height / 4;
        
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const colorIndex = y * 4 + x;
                const color = this.palette.getRGBAColour(colorIndex);
                this.ctx.fillStyle = `rgba(${color.join(',')})`;
                this.ctx.fillRect(x * colorW, y * colorH, colorW, colorH);
            }
        }
        
        this.updateSelection();
    }

    updateSelection() {
        // Add visual indicators for selected colors
        // This would be implemented based on UI requirements
        this.updatePalette(); // Redraw for now
    }
}

/**
 * Factory functions for creating palette instances
 */
export function createPalette(rgb6BitColors) {
    return new Palette(rgb6BitColors);
}

export function createDefaultPalette() {
    const defaultColors = [
        [0, 0, 0],
        [0, 0, 42],
        [0, 42, 0],
        [0, 42, 42],
        [42, 0, 0],
        [42, 0, 42],
        [42, 21, 0],
        [42, 42, 42],
        [21, 21, 21],
        [21, 21, 63],
        [21, 63, 21],
        [21, 63, 63],
        [63, 21, 21],
        [63, 21, 63],
        [63, 63, 21],
        [63, 63, 63]
    ];
    
    return new Palette(defaultColors);
}

export function createPalettePreview(canvas, palette) {
    return new PalettePreview(canvas, palette);
}

export function createPalettePicker(canvas, palette) {
    return new PalettePicker(canvas, palette);
}

// Utility exports
export { ColorUtils };

// For backward compatibility, provide the factory-style API
export default {
    createPalette,
    createDefaultPalette,
    createPalettePreview,
    createPalettePicker,
    ColorUtils
};