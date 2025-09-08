/**
 * Main application file for Moebius ES6 refactor test
 * Demonstrates integration of the new modular architecture
 */

import { createDefaultPalette, createPalettePicker } from './palette.js';
import { createFontManager } from './font.js';
import { createTextArtCanvas } from './canvas.js';
import { createFileManager } from './loader.js';

class MoebiusTestApp {
    constructor() {
        this.palette = null;
        this.fontManager = null;
        this.canvas = null;
        this.fileManager = null;
        this.isInitializing = true;
        this.letterSpacingEnabled = false;
        this.iceColorsEnabled = false;
    }

    async initialize() {
        try {
            this.showStatus('Initializing application...', 'success');
            
            // 1. Create palette first (no dependencies)
            this.palette = createDefaultPalette();
            console.log('Palette created');
            
            // 2. Create font manager and load default font
            this.fontManager = createFontManager();
            const fontRenderer = await this.fontManager.loadFontFromImage(
                'CP437 8x16', 
                false, 
                this.palette
            );
            console.log('Font manager created and default font loaded');
            
            // 3. Create canvas with font renderer and set default size
            const canvasContainer = document.getElementById('canvas-container');
            this.canvas = createTextArtCanvas(canvasContainer, fontRenderer, this.palette);
            
            // Initialize canvas with default 80x25 size and empty content
            const defaultImageData = new Uint16Array(80 * 25);
            // Fill with space character (32) + default colors (white on black)
            for (let i = 0; i < defaultImageData.length; i++) {
                // Use space character with white foreground on black background
                // This creates the typical "blank" terminal look
                defaultImageData[i] = (32 << 8) + (0 << 4) + 7; // space char, black bg, white fg
            }
            this.canvas.setImageData(80, 25, defaultImageData, false);
            console.log('Canvas created and initialized with default 80x25 layout');
            
            // 4. Create file manager
            this.fileManager = createFileManager();
            console.log('File manager created');
            
            // 5. Set up event listeners
            this.setupEventListeners();
            
            this.isInitializing = false;
            this.showStatus('Application initialized successfully!', 'success');
            console.log('Moebius test app ready!');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showStatus('Failed to initialize: ' + error.message, 'error');
            throw error;
        }
    }

    setupEventListeners() {
        // Font changes require canvas update
        this.fontManager.addEventListener('fontChange', (event) => {
            if (!this.isInitializing) {
                const fontRenderer = this.fontManager.getCurrentFont();
                this.canvas.setFontRenderer(fontRenderer);
                console.log('Font changed, canvas updated');
            }
        });

        // Palette changes require font regeneration
        this.palette.addEventListener('paletteChange', async (event) => {
            if (!this.isInitializing) {
                try {
                    // Regenerate current font with new palette
                    const currentFontName = this.fontManager.getCurrentFontName();
                    const letterSpacing = this.fontManager.getLetterSpacing();
                    
                    const fontRenderer = await this.fontManager.loadFontFromImage(
                        currentFontName, 
                        letterSpacing, 
                        this.palette
                    );
                    this.canvas.setFontRenderer(fontRenderer);
                    console.log('Palette changed, font regenerated');
                } catch (error) {
                    console.error('Failed to regenerate font after palette change:', error);
                    this.showStatus('Failed to update font: ' + error.message, 'error');
                }
            }
        });

        // File loading
        this.fileManager.addEventListener('fileLoaded', async (event) => {
            const { imageData, format } = event.detail;
            await this.loadImageData(imageData, format);
        });

        // UI event listeners
        this.setupUIEventListeners();
    }

    setupUIEventListeners() {
        // File upload
        const fileUpload = document.getElementById('file-upload');
        fileUpload.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                try {
                    this.showStatus('Loading file...', 'success');
                    await this.fileManager.loadFile(file);
                    this.showStatus(`File "${file.name}" loaded successfully!`, 'success');
                } catch (error) {
                    console.error('Failed to load file:', error);
                    this.showStatus('Failed to load file: ' + error.message, 'error');
                }
            }
        });

        // Save button
        const saveBtn = document.getElementById('save-btn');
        saveBtn.addEventListener('click', async () => {
            try {
                this.showStatus('Saving file...', 'success');
                const ansiData = await this.fileManager.saveAsAnsi(this.canvas);
                this.downloadFile(ansiData, 'output.ans', 'text/plain');
                this.showStatus('File saved successfully!', 'success');
            } catch (error) {
                console.error('Failed to save file:', error);
                this.showStatus('Failed to save file: ' + error.message, 'error');
            }
        });

        // Letter spacing toggle
        const spacingBtn = document.getElementById('spacing-btn');
        spacingBtn.addEventListener('click', async () => {
            try {
                this.letterSpacingEnabled = !this.letterSpacingEnabled;
                this.fontManager.setLetterSpacing(this.letterSpacingEnabled);
                
                // Update button text
                spacingBtn.textContent = this.letterSpacingEnabled ? 
                    'Disable 9px Spacing' : 'Enable 9px Spacing';
                
                this.showStatus(`Letter spacing ${this.letterSpacingEnabled ? 'enabled' : 'disabled'}`, 'success');
            } catch (error) {
                console.error('Failed to toggle letter spacing:', error);
                this.showStatus('Failed to toggle spacing: ' + error.message, 'error');
            }
        });

        // Ice colors toggle
        const iceBtn = document.getElementById('ice-btn');
        iceBtn.addEventListener('click', () => {
            try {
                this.iceColorsEnabled = !this.iceColorsEnabled;
                this.canvas.setIceColours(this.iceColorsEnabled);
                
                // Update button text
                iceBtn.textContent = this.iceColorsEnabled ? 
                    'Disable Ice Colors' : 'Enable Ice Colors';
                
                this.showStatus(`Ice colors ${this.iceColorsEnabled ? 'enabled' : 'disabled'}`, 'success');
            } catch (error) {
                console.error('Failed to toggle ice colors:', error);
                this.showStatus('Failed to toggle ice colors: ' + error.message, 'error');
            }
        });
    }

    async loadImageData(imageData, format) {
        try {
            this.isInitializing = true;
            
            // Handle XBin files with embedded fonts/palettes (sequential loading)
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
                
                // Update ice colors state
                this.iceColorsEnabled = imageData.iceColours || imageData.noblink || false;
                document.getElementById('ice-btn').textContent = this.iceColorsEnabled ? 
                    'Disable Ice Colors' : 'Enable Ice Colors';
                
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
        console.log('Loading XBin file with sequential operations');
        
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
            console.log('XBin palette loaded');
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
            console.log('XBin font loaded');
        }

        // 3. Finally load canvas data
        this.canvas.setImageData(
            imageData.columns,
            imageData.rows,
            imageData.data,
            imageData.iceColours
        );
        
        // Update state
        this.iceColorsEnabled = imageData.iceColours || false;
        document.getElementById('ice-btn').textContent = this.iceColorsEnabled ? 
            'Disable Ice Colors' : 'Enable Ice Colors';
            
        console.log('XBin canvas data loaded');
    }

    showStatus(message, type) {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
        statusElement.style.display = 'block';
        
        // Hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Public API methods for testing
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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing Moebius test app...');
    
    try {
        const app = new MoebiusTestApp();
        await app.initialize();
        
        // Make app available globally for debugging
        window.moebiusApp = app;
        
    } catch (error) {
        console.error('Failed to start application:', error);
        document.getElementById('status').textContent = 'Failed to start application: ' + error.message;
        document.getElementById('status').className = 'status error';
        document.getElementById('status').style.display = 'block';
    }
});