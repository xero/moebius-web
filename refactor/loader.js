/**
 * Loader Module - Handles file I/O operations for various formats
 * ES6 modernized version extracted from file.js
 */

/**
 * SAUCE metadata parser and handler
 */
class SauceParser {
    static SAUCE_ID = new Uint8Array([0x53, 0x41, 0x55, 0x43, 0x45]);
    static COMMENT_ID = new Uint8Array([0x43, 0x4F, 0x4D, 0x4E, 0x54]);

    /**
     * Parse SAUCE record from file data
     */
    static parseSauce(bytes) {
        if (bytes.length < 128) {
            return null;
        }

        const pos = bytes.length - 128;
        const sauceId = bytes.subarray(pos + 1, pos + 6);
        
        if (!this.arrayEquals(sauceId, this.SAUCE_ID)) {
            return null;
        }

        const sauce = {
            version: this.getString(bytes, pos + 6, 2),
            title: this.getString(bytes, pos + 8, 35),
            author: this.getString(bytes, pos + 43, 20),
            group: this.getString(bytes, pos + 63, 20),
            date: this.getString(bytes, pos + 83, 8),
            fileSize: this.get32(bytes, pos + 91),
            dataType: bytes[pos + 95],
            fileType: bytes[pos + 96],
            tInfo1: this.get16(bytes, pos + 97),
            tInfo2: this.get16(bytes, pos + 99),
            tInfo3: this.get16(bytes, pos + 101),
            tInfo4: this.get16(bytes, pos + 103),
            comments: bytes[pos + 105],
            flags: bytes[pos + 106],
            fontName: this.getString(bytes, pos + 107, 22)
        };

        return sauce;
    }

    /**
     * Create SAUCE record for saving
     */
    static createSauce(title, author, group, datatype, filetype, filesize, columns, rows, iceColours, letterSpacing, fontName) {
        const sauce = new Uint8Array(129);
        
        sauce[0] = 0x1A; // SAUCE separator
        sauce.set(new Uint8Array([0x53, 0x41, 0x55, 0x43, 0x45, 0x30, 0x30]), 1); // SAUCE00
        
        this.setString(sauce, title || '', 35, 8);
        this.setString(sauce, author || '', 20, 43);
        this.setString(sauce, group || '', 20, 63);
        
        const date = new Date();
        this.setString(sauce, date.getFullYear().toString(10), 4, 83);
        const month = date.getMonth() + 1;
        this.setString(sauce, (month < 10) ? (`0${month}`) : month.toString(10), 2, 87);
        const day = date.getDate();
        this.setString(sauce, (day < 10) ? (`0${day}`) : day.toString(10), 2, 89);
        
        this.set32(sauce, filesize, 91);
        sauce[95] = datatype;
        sauce[96] = filetype;
        this.set16(sauce, columns, 97);
        this.set16(sauce, rows, 99);
        sauce[105] = 0; // comments
        
        let flags = 0;
        if (iceColours) flags += 1;
        if (!letterSpacing) flags += (1 << 1);
        else flags += (1 << 2);
        sauce[106] = flags;
        
        if (fontName) {
            this.setString(sauce, fontName, Math.min(fontName.length, 22), 107);
        }
        
        return sauce;
    }

    // Utility methods
    static getString(bytes, pos, length) {
        let str = '';
        for (let i = 0; i < length; i++) {
            if (pos + i < bytes.length) {
                str += String.fromCharCode(bytes[pos + i]);
            }
        }
        return str.replace(/\s+$/, '');
    }

    static setString(bytes, text, maxLength, pos) {
        for (let i = 0; i < maxLength; i++) {
            bytes[pos + i] = (i < text.length) ? text.charCodeAt(i) : 0x20;
        }
    }

    static get16(bytes, pos) {
        return bytes[pos] + (bytes[pos + 1] << 8);
    }

    static set16(bytes, value, pos) {
        bytes[pos] = value & 0xFF;
        bytes[pos + 1] = (value >> 8) & 0xFF;
    }

    static get32(bytes, pos) {
        return bytes[pos] + (bytes[pos + 1] << 8) + (bytes[pos + 2] << 16) + (bytes[pos + 3] << 24);
    }

    static set32(bytes, value, pos) {
        bytes[pos] = value & 0xFF;
        bytes[pos + 1] = (value >> 8) & 0xFF;
        bytes[pos + 2] = (value >> 16) & 0xFF;
        bytes[pos + 3] = (value >> 24) & 0xFF;
    }

    static arrayEquals(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}

/**
 * File reader utility for binary data parsing
 */
class BinaryFileReader {
    constructor(bytes) {
        this.bytes = bytes;
        this.pos = 0;
        this.size = bytes.length;
        
        // Parse SAUCE if present
        this.sauce = SauceParser.parseSauce(bytes);
        if (this.sauce && this.sauce.fileSize > 0 && this.sauce.fileSize < bytes.length) {
            this.size = this.sauce.fileSize;
        } else if (this.sauce) {
            this.size = bytes.length - 128;
        }
    }

    get() {
        if (this.pos >= this.bytes.length) {
            throw new Error('Unexpected end of file reached');
        }
        return this.bytes[this.pos++];
    }

    get16() {
        const v = this.get();
        return v + (this.get() << 8);
    }

    get32() {
        let v = this.get();
        v += this.get() << 8;
        v += this.get() << 16;
        return v + (this.get() << 24);
    }

    getChar() {
        return String.fromCharCode(this.get());
    }

    getString(length) {
        let str = '';
        for (let i = 0; i < length; i++) {
            str += this.getChar();
        }
        return str.replace(/\s+$/, '');
    }

    lookahead(match) {
        for (let i = 0; i < match.length; i++) {
            if (this.pos + i >= this.bytes.length || this.bytes[this.pos + i] !== match[i]) {
                return false;
            }
        }
        return true;
    }

    read(length) {
        const start = this.pos;
        length = length || (this.size - this.pos);
        
        while (this.pos < this.size && length > 0) {
            this.pos++;
            length--;
        }
        
        return this.bytes.subarray(start, this.pos);
    }

    seek(newPos) {
        this.pos = newPos;
    }

    peek(offset = 0) {
        return this.bytes[this.pos + offset];
    }

    getPos() {
        return this.pos;
    }

    eof() {
        return this.pos >= this.size;
    }
}

/**
 * ANSI file format parser
 */
class AnsiLoader {
    static load(bytes) {
        const file = new BinaryFileReader(bytes);
        const imageData = [];
        let width = 0;
        let height = 1;
        let x = 0;
        let y = 0;
        let foreground = 7;
        let background = 0;
        let savedX = 0;
        let savedY = 0;

        while (!file.eof()) {
            const byte = file.get();
            
            if (byte === 26) { // EOF marker
                break;
            } else if (byte === 27) { // ESC sequence
                if (file.peek() === 91) { // CSI sequence
                    file.get(); // consume '['
                    this.parseCSISequence(file, { x, y, foreground, background, savedX, savedY, imageData, width, height });
                }
            } else if (byte === 13) { // CR
                x = 0;
            } else if (byte === 10) { // LF
                y++;
                if (y >= height) height = y + 1;
            } else if (byte === 8) { // Backspace
                if (x > 0) x--;
            } else if (byte === 9) { // Tab
                x = (Math.floor(x / 8) + 1) * 8;
            } else if (byte >= 32) { // Printable character
                const index = y * 80 + x;
                imageData[index] = {
                    charCode: byte,
                    foreground,
                    background
                };
                x++;
                if (x > width) width = x;
            }
        }

        return {
            width: Math.max(width, 80),
            height: Math.max(height, 25),
            data: this.convertToImageData(imageData, width, height),
            noblink: false,
            letterSpacing: false,
            title: file.sauce?.title || '',
            author: file.sauce?.author || '',
            group: file.sauce?.group || '',
            fontName: this.sauceToAppFont(file.sauce?.fontName || 'CP437')
        };
    }

    static parseCSISequence(file, state) {
        let paramStr = '';
        let byte;
        
        // Read parameters
        while (!file.eof()) {
            byte = file.peek();
            if (byte >= 48 && byte <= 57 || byte === 59) { // digits and semicolon
                paramStr += String.fromCharCode(file.get());
            } else {
                break;
            }
        }
        
        if (file.eof()) return;
        
        const command = String.fromCharCode(file.get());
        const params = paramStr ? paramStr.split(';').map(p => parseInt(p, 10) || 0) : [0];
        
        this.executeCSICommand(command, params, state);
    }

    static executeCSICommand(command, params, state) {
        switch (command) {
            case 'A': // Cursor Up
                state.y = Math.max(0, state.y - (params[0] || 1));
                break;
            case 'B': // Cursor Down
                state.y += (params[0] || 1);
                break;
            case 'C': // Cursor Forward
                state.x += (params[0] || 1);
                break;
            case 'D': // Cursor Back
                state.x = Math.max(0, state.x - (params[0] || 1));
                break;
            case 'H': // Cursor Position
            case 'f':
                state.y = Math.max(0, (params[0] || 1) - 1);
                state.x = Math.max(0, (params[1] || 1) - 1);
                break;
            case 'J': // Erase in Display
                // Implementation depends on parameter
                break;
            case 'K': // Erase in Line
                // Implementation depends on parameter
                break;
            case 'm': // Set Graphics Mode
                this.parseGraphicsMode(params, state);
                break;
            case 's': // Save Cursor Position
                state.savedX = state.x;
                state.savedY = state.y;
                break;
            case 'u': // Restore Cursor Position
                state.x = state.savedX;
                state.y = state.savedY;
                break;
        }
    }

    static parseGraphicsMode(params, state) {
        for (let i = 0; i < params.length; i++) {
            const param = params[i];
            
            if (param === 0) { // Reset
                state.foreground = 7;
                state.background = 0;
            } else if (param === 1) { // Bold/Bright foreground
                state.foreground |= 8;
            } else if (param === 5) { // Blink/Bright background
                state.background |= 8;
            } else if (param >= 30 && param <= 37) { // Foreground color
                state.foreground = (state.foreground & 8) | this.ansiToColor(param - 30);
            } else if (param >= 40 && param <= 47) { // Background color
                state.background = (state.background & 8) | this.ansiToColor(param - 40);
            }
        }
    }

    static ansiToColor(ansiColor) {
        const colorMap = [0, 4, 2, 6, 1, 5, 3, 7]; // ANSI to VGA color mapping
        return colorMap[ansiColor] || 0;
    }

    static convertToImageData(data, width, height) {
        const imageData = new Uint8Array(width * height * 3);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                const outputIndex = index * 3;
                const charData = data[index];
                
                if (charData) {
                    imageData[outputIndex] = charData.charCode;
                    imageData[outputIndex + 1] = charData.foreground;
                    imageData[outputIndex + 2] = charData.background;
                } else {
                    imageData[outputIndex] = 32; // Space
                    imageData[outputIndex + 1] = 7;  // White
                    imageData[outputIndex + 2] = 0;  // Black
                }
            }
        }
        
        return imageData;
    }

    static sauceToAppFont(sauceFontName) {
        const fontMap = {
            'IBM VGA': 'CP437 8x16',
            'IBM VGA50': 'CP437 8x8',
            'IBM VGA25G': 'CP437 8x19',
            'IBM EGA': 'CP437 8x14',
            'IBM EGA43': 'CP437 8x8',
            'IBM CGA': 'CP437 8x8',
            'IBM CGA40': 'CP437 8x8',
            'Amiga Topaz 1': 'TOPAZ_437',
            'Amiga Topaz 1+': 'TOPAZ_437',
            'Amiga Topaz 2': 'TOPAZ_437',
            'Amiga Topaz 2+': 'TOPAZ_437',
            'Amiga P0T-NOoDLE': 'TOPAZ_437',
            'Amiga MicroKnight': 'MICROKNIGHT_437',
            'Amiga MicroKnight+': 'MICROKNIGHT_437',
            'Amiga mOsOul': 'MOSOUL_437'
        };
        
        return fontMap[sauceFontName] || 'CP437 8x16';
    }
}

/**
 * XBin file format parser
 */
class XBinLoader {
    static load(bytes) {
        const file = new BinaryFileReader(bytes);
        
        // Check XBin header
        const header = file.getString(4);
        if (header !== 'XBIN') {
            throw new Error('Invalid XBin file format');
        }
        
        file.get(); // EOF character
        
        const columns = file.get16();
        const rows = file.get16();
        const fontHeight = file.get();
        const flags = file.get();
        
        const paletteFlag = (flags & 0x01) === 1;
        const fontFlag = (flags & 0x02) === 1;
        const compressFlag = (flags & 0x04) === 1;
        const iceColoursFlag = (flags & 0x08) === 1;
        const font512Flag = (flags & 0x10) === 1;
        
        let paletteData = null;
        if (paletteFlag) {
            paletteData = new Uint8Array(48);
            for (let i = 0; i < 48; i++) {
                paletteData[i] = file.get();
            }
        }
        
        let fontData = null;
        if (fontFlag) {
            const fontCharCount = font512Flag ? 512 : 256;
            const fontDataSize = fontCharCount * fontHeight;
            fontData = new Uint8Array(fontDataSize);
            for (let i = 0; i < fontDataSize; i++) {
                fontData[i] = file.get();
            }
        }
        
        let data;
        if (compressFlag) {
            data = this.uncompress(file, columns, rows);
        } else {
            const dataSize = columns * rows * 2;
            const rawData = file.read(dataSize);
            data = this.convertUInt8ToUint16(rawData);
        }
        
        return {
            columns,
            rows,
            data,
            iceColours: iceColoursFlag,
            letterSpacing: false,
            title: file.sauce?.title || '',
            author: file.sauce?.author || '',
            group: file.sauce?.group || '',
            fontName: 'XBIN',
            paletteData,
            fontData: fontData ? { bytes: fontData, width: 8, height: fontHeight } : null
        };
    }

    static uncompress(file, columns, rows) {
        const data = new Uint16Array(columns * rows);
        let i = 0;
        
        while (i < data.length && !file.eof()) {
            const byte = file.get();
            
            if (byte === 0) {
                // Repeat count
                const count = file.get();
                const char = file.get();
                const attribute = file.get();
                const value = (char << 8) | attribute;
                
                for (let j = 0; j <= count; j++) {
                    if (i < data.length) {
                        data[i++] = value;
                    }
                }
            } else {
                // Direct data
                const attribute = file.get();
                data[i++] = (byte << 8) | attribute;
            }
        }
        
        return data;
    }

    static convertUInt8ToUint16(bytes) {
        const data = new Uint16Array(bytes.length / 2);
        for (let i = 0; i < data.length; i++) {
            data[i] = bytes[i * 2] | (bytes[i * 2 + 1] << 8);
        }
        return data;
    }
}

/**
 * Binary file format parser (.BIN files)
 */
class BinLoader {
    static load(bytes) {
        if (bytes.length < 4) {
            throw new Error('Invalid BIN file - too small');
        }
        
        const file = new BinaryFileReader(bytes);
        
        // Read dimensions
        const columns = file.get16();
        const rows = file.get16();
        
        if (columns <= 0 || rows <= 0 || columns > 1000 || rows > 1000) {
            throw new Error('Invalid BIN file dimensions');
        }
        
        // Read image data
        const dataSize = columns * rows * 2;
        const rawData = file.read(dataSize);
        const data = XBinLoader.convertUInt8ToUint16(rawData);
        
        return {
            columns,
            rows,
            data,
            iceColours: false,
            letterSpacing: false
        };
    }
}

/**
 * File Saver - handles saving files in various formats
 */
class FileSaver {
    static saveFile(bytes, sauce, filename) {
        let outputBytes;
        
        if (sauce) {
            outputBytes = new Uint8Array(bytes.length + sauce.length);
            outputBytes.set(bytes, 0);
            outputBytes.set(sauce, bytes.length);
        } else {
            outputBytes = new Uint8Array(bytes.length);
            outputBytes.set(bytes, 0);
        }
        
        const blob = new Blob([outputBytes], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.style.display = 'none';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        URL.revokeObjectURL(url);
    }

    static async saveAsAnsi(canvas, title, author, group, fontName) {
        const imageData = canvas.getImageData();
        const columns = canvas.getColumns();
        const rows = canvas.getRows();
        
        const ansiData = this.convertToAnsi(imageData, columns, rows);
        const sauce = SauceParser.createSauce(title, author, group, 1, 1, ansiData.length, columns, rows, canvas.getIceColours(), canvas.getLetterSpacing?.() || false, fontName);
        
        this.saveFile(ansiData, sauce, 'artwork.ans');
    }

    static async saveAsBin(canvas) {
        const imageData = canvas.getImageData();
        const columns = canvas.getColumns();
        const rows = canvas.getRows();
        
        const binData = new Uint8Array(4 + imageData.length * 2);
        
        // Write dimensions
        binData[0] = columns & 0xFF;
        binData[1] = (columns >> 8) & 0xFF;
        binData[2] = rows & 0xFF;
        binData[3] = (rows >> 8) & 0xFF;
        
        // Write image data
        for (let i = 0; i < imageData.length; i++) {
            binData[4 + i * 2] = imageData[i] & 0xFF;
            binData[4 + i * 2 + 1] = (imageData[i] >> 8) & 0xFF;
        }
        
        this.saveFile(binData, null, 'artwork.bin');
    }

    static convertToAnsi(imageData, columns, rows) {
        const output = [27, 91, 48, 109]; // ESC[0m (reset)
        let currentFg = 7;
        let currentBg = 0;
        let currentBold = false;
        let currentBlink = false;
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                const index = y * columns + x;
                const value = imageData[index];
                
                const charCode = (value >> 8) & 0xFF;
                let fg = value & 15;
                let bg = (value >> 4) & 15;
                
                const bold = fg > 7;
                const blink = bg > 7;
                
                if (bold) fg -= 8;
                if (blink) bg -= 8;
                
                // Generate ANSI codes for attribute changes
                if (currentFg !== fg || currentBg !== bg || currentBold !== bold || currentBlink !== blink) {
                    const codes = [];
                    
                    if (currentBold !== bold || currentBlink !== blink) {
                        codes.push(0); // Reset
                        currentFg = 7;
                        currentBg = 0;
                        currentBold = false;
                        currentBlink = false;
                    }
                    
                    if (bold && !currentBold) codes.push(1);
                    if (blink && !currentBlink) codes.push(5);
                    if (fg !== currentFg) codes.push(30 + this.colorToAnsi(fg));
                    if (bg !== currentBg) codes.push(40 + this.colorToAnsi(bg));
                    
                    if (codes.length > 0) {
                        output.push(27, 91); // ESC[
                        const codeStr = codes.join(';');
                        for (let i = 0; i < codeStr.length; i++) {
                            output.push(codeStr.charCodeAt(i));
                        }
                        output.push(109); // m
                    }
                    
                    currentFg = fg;
                    currentBg = bg;
                    currentBold = bold;
                    currentBlink = blink;
                }
                
                output.push(charCode || 32);
            }
            
            if (y < rows - 1) {
                output.push(13, 10); // CRLF
            }
        }
        
        return new Uint8Array(output);
    }

    static colorToAnsi(color) {
        const ansiMap = [0, 4, 2, 6, 1, 5, 3, 7];
        return ansiMap[color] || 0;
    }
}

/**
 * Main File Manager class
 */
class FileManager {
    constructor() {
        this.eventTarget = new EventTarget();
    }

    /**
     * Load file from File object
     */
    async loadFile(file) {
        try {
            const bytes = await this.readFileAsArrayBuffer(file);
            const extension = this.getFileExtension(file.name);
            let imageData;

            switch (extension) {
                case 'xb':
                    imageData = XBinLoader.load(bytes);
                    break;
                case 'bin':
                    imageData = BinLoader.load(bytes);
                    break;
                case 'ans':
                case 'asc':
                case 'txt':
                default:
                    imageData = AnsiLoader.load(bytes);
                    break;
            }

            this.emitFileLoaded(imageData, extension);
            return imageData;
        } catch (error) {
            console.error('Failed to load file:', error);
            throw error;
        }
    }

    /**
     * Save canvas as ANSI file
     */
    async saveAsAnsi(canvas, metadata = {}) {
        return FileSaver.saveAsAnsi(
            canvas,
            metadata.title || '',
            metadata.author || '',
            metadata.group || '',
            metadata.fontName || 'CP437'
        );
    }

    /**
     * Save canvas as BIN file
     */
    async saveAsBin(canvas) {
        return FileSaver.saveAsBin(canvas);
    }

    /**
     * Save canvas as PNG image
     */
    async saveAsPng(canvas, filename = 'artwork.png') {
        const canvasElement = canvas.getImage();
        
        return new Promise((resolve) => {
            canvasElement.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = filename;
                downloadLink.style.display = 'none';
                
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                
                URL.revokeObjectURL(url);
                resolve();
            });
        });
    }

    /**
     * Utility methods
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.addEventListener('load', (evt) => {
                resolve(new Uint8Array(reader.result));
            });
            
            reader.addEventListener('error', () => {
                reject(new Error('Failed to read file'));
            });
            
            reader.readAsArrayBuffer(file);
        });
    }

    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
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

    emitFileLoaded(imageData, format) {
        this.eventTarget.dispatchEvent(new CustomEvent('fileLoaded', {
            detail: { imageData, format }
        }));
    }

    /**
     * Font name mapping utilities
     */
    static sauceToAppFont(sauceFontName) {
        return AnsiLoader.sauceToAppFont(sauceFontName);
    }

    static appToSauceFont(appFontName) {
        const fontMap = {
            'CP437 8x16': 'IBM VGA',
            'CP437 8x8': 'IBM VGA50',
            'CP437 8x19': 'IBM VGA25G',
            'CP437 8x14': 'IBM EGA',
            'TOPAZ_437': 'Amiga Topaz 1',
            'MICROKNIGHT_437': 'Amiga MicroKnight',
            'MOSOUL_437': 'Amiga mOsOul'
        };
        
        return fontMap[appFontName] || 'IBM VGA';
    }
}

/**
 * Factory functions for backward compatibility
 */
export function createFileManager() {
    return new FileManager();
}

export async function loadFile(file) {
    const manager = new FileManager();
    return await manager.loadFile(file);
}

// Main exports
export {
    FileManager,
    SauceParser,
    BinaryFileReader,
    AnsiLoader,
    XBinLoader,
    BinLoader,
    FileSaver
};

// Default export
export default {
    FileManager,
    SauceParser,
    BinaryFileReader,
    AnsiLoader,
    XBinLoader,
    BinLoader,
    FileSaver,
    createFileManager,
    loadFile
};