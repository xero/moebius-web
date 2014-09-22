var Loaders = (function () {
    "use strict";
    var COMPRESS_LZ77, UNDO_RESIZE;

    COMPRESS_LZ77 = 1;
    UNDO_RESIZE = 2;

    function File(bytes) {
        var pos, SAUCE_ID, COMNT_ID, commentCount;

        SAUCE_ID = new Uint8Array([0x53, 0x41, 0x55, 0x43, 0x45]);
        COMNT_ID = new Uint8Array([0x43, 0x4F, 0x4D, 0x4E, 0x54]);

        // Returns an 8-bit byte at the current byte position, <pos>. Also advances <pos> by a single byte. Throws an error if we advance beyond the length of the array.
        this.get = function () {
            if (pos >= bytes.length) {
                throw "Unexpected end of file reached.";
            }
            pos += 1;
            return bytes[pos - 1];
        };

        // Same as get(), but returns a 16-bit byte. Also advances <pos> by two (8-bit) bytes.
        this.get16 = function () {
            var v;
            v = this.get();
            return v + (this.get() << 8);
        };

        // Same as get(), but returns a 32-bit byte. Also advances <pos> by four (8-bit) bytes.
        this.get32 = function () {
            var v;
            v = this.get();
            v += this.get() << 8;
            v += this.get() << 16;
            return v + (this.get() << 24);
        };

        // Exactly the same as get(), but returns a character symbol, instead of the value. e.g. 65 = "A".
        this.getC = function () {
            return String.fromCharCode(this.get());
        };

        // Returns a string of <num> characters at the current file position, and strips the trailing whitespace characters. Advances <pos> by <num> by calling getC().
        this.getS = function (num) {
            var string;
            string = "";
            while (num > 0) {
                string += this.getC();
                num -= 1;
            }
            return string.replace(/\s+$/, "");
        };

        // Returns "true" if, at the current <pos>, a string of characters matches <match>. Does not increment <pos>.
        this.lookahead = function (match) {
            var i;
            for (i = 0; i < match.length; i += 1) {
                if ((pos + i === bytes.length) || (bytes[pos + i] !== match[i])) {
                    break;
                }
            }
            return i === match.length;
        };

        // Returns an array of <num> bytes found at the current <pos>. Also increments <pos>.
        this.read = function (num) {
            var t;
            t = pos;
            // If num is undefined, return all the bytes until the end of file.
            num = num || this.size - pos;
            while ((pos += 1) < this.size) {
                num -= 1;
                if (num === 0) {
                    break;
                }
            }
            return bytes.subarray(t, pos);
        };

        // Sets a new value for <pos>. Equivalent to seeking a file to a new position.
        this.seek = function (newPos) {
            pos = newPos;
        };

        // Returns the value found at <pos>, without incrementing <pos>.
        this.peek = function (num) {
            num = num || 0;
            return bytes[pos + num];
        };

        // Returns the the current position being read in the file, in amount of bytes. i.e. <pos>.
        this.getPos = function () {
            return pos;
        };

        // Returns true if the end of file has been reached. <this.size> is set later by the SAUCE parsing section, as it is not always the same value as the length of <bytes>. (In case there is a SAUCE record, and optional comments).
        this.eof = function () {
            return pos === this.size;
        };

        // Seek to the position we would expect to find a SAUCE record.
        pos = bytes.length - 128;
        // If we find "SAUCE".
        if (this.lookahead(SAUCE_ID)) {
            this.sauce = {};
            // Read "SAUCE".
            this.getS(5);
            // Read and store the various SAUCE values.
            this.sauce.version = this.getS(2); // String, maximum of 2 characters
            this.sauce.title = this.getS(35); // String, maximum of 35 characters
            this.sauce.author = this.getS(20); // String, maximum of 20 characters
            this.sauce.group = this.getS(20); // String, maximum of 20 characters
            this.sauce.date = this.getS(8); // String, maximum of 8 characters
            this.sauce.fileSize = this.get32(); // unsigned 32-bit
            this.sauce.dataType = this.get(); // unsigned 8-bit
            this.sauce.fileType = this.get(); // unsigned 8-bit
            this.sauce.tInfo1 = this.get16(); // unsigned 16-bit
            this.sauce.tInfo2 = this.get16(); // unsigned 16-bit
            this.sauce.tInfo3 = this.get16(); // unsigned 16-bit
            this.sauce.tInfo4 = this.get16(); // unsigned 16-bit
            // Initialize the comments array.
            this.sauce.comments = [];
            commentCount = this.get(); // unsigned 8-bit
            this.sauce.flags = this.get(); // unsigned 8-bit
            if (commentCount > 0) {
                // If we have a value for the comments amount, seek to the position we'd expect to find them...
                pos = bytes.length - 128 - (commentCount * 64) - 5;
                // ... and check that we find a COMNT header.
                if (this.lookahead(COMNT_ID)) {
                    // Read COMNT ...
                    this.getS(5);
                    // ... and push everything we find after that into our <this.sauce.comments> array, in 64-byte chunks, stripping the trailing whitespace in the getS() function.
                    while (commentCount > 0) {
                        this.sauce.comments.push(this.getS(64));
                        commentCount -= 1;
                    }
                }
            }
        }
        // Seek back to the start of the file, ready for reading.
        pos = 0;

        if (this.sauce) {
            // If we have found a SAUCE record, and the fileSize field passes some basic sanity checks...
            if (this.sauce.fileSize > 0 && this.sauce.fileSize < bytes.length) {
                // Set <this.size> to the value set in SAUCE.
                this.size = this.sauce.fileSize;
            } else {
                // If it fails the sanity checks, just assume that SAUCE record can't be trusted, and set <this.size> to the position where the SAUCE record begins.
                this.size = bytes.length - 128;
            }
        } else {
            // If there is no SAUCE record, assume that everything in <bytes> relates to an image.
            this.size = bytes.length;
        }
    }

    function ScreenData(width) {
        var imageData, maxY, pos;

        function binColor(ansiColor) {
            switch (ansiColor) {
            case 4:
                return 1;
            case 6:
                return 3;
            case 1:
                return 4;
            case 3:
                return 6;
            case 12:
                return 9;
            case 14:
                return 11;
            case 9:
                return 12;
            case 11:
                return 14;
            default:
                return ansiColor;
            }
        }

        this.reset = function () {
            imageData = new Uint8Array(width * 100 * 3);
            maxY = 0;
            pos = 0;
        };

        this.reset();

        this.raw = function (bytes) {
            var i, j;
            maxY = Math.ceil(bytes.length / 2 / width);
            imageData = new Uint8Array(width * maxY * 3);
            for (i = 0, j = 0; j < bytes.length; i += 3, j += 2) {
                imageData[i] = bytes[j];
                imageData[i + 1] = bytes[j + 1] & 15;
                imageData[i + 2] = bytes[j + 1] >> 4;
            }
        };

        function extendImageData(y) {
            var newImageData;
            newImageData = new Uint8Array(width * (y + 100) * 3 + imageData.length);
            newImageData.set(imageData, 0);
            imageData = newImageData;
        }

        this.set = function (x, y, charCode, fg, bg) {
            pos = (y * width + x) * 3;
            if (pos >= imageData.length) {
                extendImageData(y);
            }
            imageData[pos] = charCode;
            imageData[pos + 1] = binColor(fg);
            imageData[pos + 2] = binColor(bg);
            if (y > maxY) {
                maxY = y;
            }
        };

        this.getData = function () {
            return imageData.subarray(0, width * (maxY + 1) * 3);
        };

        this.getHeight = function () {
            return maxY + 1;
        };

        this.rowLength = width * 3;

        this.stripBlinking = function () {
            var i;
            for (i = 2; i < imageData.length; i += 3) {
                if (imageData[i] >= 8) {
                    imageData[i] -= 8;
                }
            }
        };
    }

    function loadAnsi(bytes, icecolors) {
        var file, escaped, escapeCode, j, code, values, columns, imageData, topOfScreen, x, y, savedX, savedY, foreground, background, bold, blink, inverse;

        file = new File(bytes);

        function resetAttributes() {
            foreground = 7;
            background = 0;
            bold = false;
            blink = false;
            inverse = false;
        }
        resetAttributes();

        function newLine() {
            x = 1;
            if (y === 26 - 1) {
                topOfScreen += 1;
            } else {
                y += 1;
            }
        }

        function setPos(newX, newY) {
            x = Math.min(columns, Math.max(1, newX));
            y = Math.min(26, Math.max(1, newY));
        }

        x = 1;
        y = 1;
        topOfScreen = 0;

        escapeCode = "";
        escaped = false;

        columns = (file.sauce !== undefined) ? file.sauce.tInfo1 : 80;

        imageData = new ScreenData(columns);

        function getValues() {
            return escapeCode.substr(1, escapeCode.length - 2).split(";").map(function (value) {
                var parsedValue;
                parsedValue = parseInt(value, 10);
                return isNaN(parsedValue) ? 1 : parsedValue;
            });
        }

        while (!file.eof()) {
            code = file.get();
            if (escaped) {
                escapeCode += String.fromCharCode(code);
                if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
                    escaped = false;
                    values = getValues();
                    if (escapeCode.charAt(0) === "[") {
                        switch (escapeCode.charAt(escapeCode.length - 1)) {
                        case "A": // Up cursor.
                            y = Math.max(1, y - values[0]);
                            break;
                        case "B": // Down cursor.
                            y = Math.min(26 - 1, y + values[0]);
                            break;
                        case "C": // Forward cursor.
                            if (x === columns) {
                                newLine();
                            }
                            x = Math.min(columns, x + values[0]);
                            break;
                        case "D": // Backward cursor.
                            x = Math.max(1, x - values[0]);
                            break;
                        case "H": // Set the cursor position by calling setPos(), first <y>, then <x>.
                            if (values.length === 1) {
                                setPos(1, values[0]);
                            } else {
                                setPos(values[1], values[0]);
                            }
                            break;
                        case "J": // Clear screen.
                            if (values[0] === 2) {
                                x = 1;
                                y = 1;
                                imageData.reset();
                            }
                            break;
                        case "K": // Clear until the end of line.
                            for (j = x - 1; j < columns; j += 1) {
                                imageData.set(j, y - 1 + topOfScreen, 0, 0);
                            }
                            break;
                        case "m": // Attributes, work through each code in turn.
                            for (j = 0; j < values.length; j += 1) {
                                if (values[j] >= 30 && values[j] <= 37) {
                                    foreground = values[j] - 30;
                                } else if (values[j] >= 40 && values[j] <= 47) {
                                    background = values[j] - 40;
                                } else {
                                    switch (values[j]) {
                                    case 0: // Reset attributes
                                        resetAttributes();
                                        break;
                                    case 1: // Bold
                                        bold = true;
                                        break;
                                    case 5: // Blink
                                        blink = true;
                                        break;
                                    case 7: // Inverse
                                        inverse = true;
                                        break;
                                    case 22: // Bold off
                                        bold = false;
                                        break;
                                    case 25: // Blink off
                                        blink = false;
                                        break;
                                    case 27: // Inverse off
                                        inverse = false;
                                        break;
                                    }
                                }
                            }
                            break;
                        case "s": // Save the current <x> and <y> positions.
                            savedX = x;
                            savedY = y;
                            break;
                        case "u": // Restore the current <x> and <y> positions.
                            x = savedX;
                            y = savedY;
                            break;
                        }
                    }
                    escapeCode = "";
                }
            } else {
                switch (code) {
                case 10: // Lone linefeed (LF).
                    newLine();
                    break;
                case 13: // Carriage Return, and Linefeed (CRLF)
                    if (file.peek() === 0x0A) {
                        file.read(1);
                        newLine();
                    }
                    break;
                case 26: // Ignore eof characters until the actual end-of-file, or sauce record has been reached.
                    break;
                default:
                    if (code === 27 && file.peek() === 0x5B) {
                        escaped = true;
                    } else {
                        if (!inverse) {
                            imageData.set(x - 1, y - 1 + topOfScreen, code, bold ? (foreground + 8) : foreground, (icecolors && blink) ? (background + 8) : background);
                        } else {
                            imageData.set(x - 1, y - 1 + topOfScreen, code, bold ? (background + 8) : background, (icecolors && blink) ? (foreground + 8) : foreground);
                        }
                        x += 1;
                        if (x === columns + 1) {
                            newLine();
                        }
                    }
                }
            }
        }

        return {
            "width": columns,
            "height": imageData.getHeight(),
            "data": imageData.getData(),
            "noblink": file.sauce ? ((file.sauce.flags & 1) === 1) : false,
            "title": file.sauce ? file.sauce.title : "",
            "author": file.sauce ? file.sauce.author : "",
            "group": file.sauce ? file.sauce.group : ""
        };
    }

    // A function to parse a sequence of bytes representing an XBiN file format.
    function loadXbin(bytes, noblink) {
        var file, header, font, palette, red, green, blue, imageData, output, i, j;

        // This function is called to parse the XBin header.
        function XBinHeader(file) {
            var flags;

            // Look for the magic number, throw an error if not found.
            if (file.getS(4) !== "XBIN") {
                throw "File ID does not match.";
            }
            if (file.get() !== 26) {
                throw "File ID does not match.";
            }

            // Get the dimensions of the image...
            this.width = file.get16();
            this.height = file.get16();

            // ... and the height of the font, if included.
            this.fontHeight = file.get();

            //  Sanity check for the font height, throw an error if failed.
            if (this.fontHeight === 0 || this.fontHeight > 32) {
                throw "Illegal value for the font height (" + this.fontHeight + ").";
            }

            // Retrieve the flags.
            flags = file.get();

            // Check to see if a palette and font is included.
            this.palette = ((flags & 1) === 1);
            this.font = ((flags & 2) === 2);

            // Sanity check for conflicting information in font settings.
            if (this.fontHeight !== 16 && !this.font) {
                throw "A non-standard font size was defined, but no font information was included with the file.";
            }

            // Check to see if the image data is <compressed>, if non-blink mode is set, <nonBlink>, and if 512 characters are included with the font data. <char512>.
            this.compressed = ((flags & 4) === 4);
            this.nonBlink = ((flags & 8) === 8);
            this.char512 = ((flags & 16) === 16);
        }

        // Routine to decompress data found in an XBin <file>, which contains a Run-Length encoding scheme. Needs to know the current <width> and <height> of the image.
        function uncompress(file, width, height) {
            var uncompressed, p, repeatAttr, repeatChar, count;
            // Initialize the data used to store the image, each text character has two bytes, one for the character code, and the other for the attribute.
            uncompressed = new Uint8Array(width * height * 2);
            i = 0;
            while (i < uncompressed.length) {
                p = file.get(); // <p>, the current code under inspection.
                count = p & 63; // <count>, the times data is repeated
                switch (p >> 6) { // Look at which RLE scheme to use
                case 1: // Handle repeated character code.
                    for (repeatChar = file.get(), j = 0; j <= count; j += 1) {
                        uncompressed[i] = repeatChar;
                        i += 1;
                        uncompressed[i] = file.get();
                        i += 1;
                    }
                    break;
                case 2: // Handle repeated attributes.
                    for (repeatAttr = file.get(), j = 0; j <= count; j += 1) {
                        uncompressed[i] = file.get();
                        i += 1;
                        uncompressed[i] = repeatAttr;
                        i += 1;
                    }
                    break;
                case 3: // Handle repeated character code and attributes.
                    for (repeatChar = file.get(), repeatAttr = file.get(), j = 0; j <= count; j += 1) {
                        uncompressed[i] = repeatChar;
                        i += 1;
                        uncompressed[i] = repeatAttr;
                        i += 1;
                    }
                    break;
                default: // Handle no RLE.
                    for (j = 0; j <= count; j += 1) {
                        uncompressed[i] = file.get();
                        i += 1;
                        uncompressed[i] = file.get();
                        i += 1;
                    }
                }
            }
            return uncompressed; // Return the final, <uncompressed> data.
        }

        // Convert the bytes to a File() object, and reader the settings in the header, by calling XBinHeader().
        file = new File(bytes);
        header = new XBinHeader(file);

        // If palette information is included, read it immediately after the header, if not, use the default palette used for BIN files.
        if (header.palette) {
            palette = [];
            for (i = 0; i < 16; i += 1) {
                red = file.get();
                green = file.get();
                blue = file.get();
                palette.push([red, green, blue]);
            }
        } else {
            palette = undefined;
        }
        // If font information is included, read it, if not, use the default 80x25 font.
        if (header.font) {
            font = file.read(header.fontHeight * 256);
        } else {
            font = undefined;
        }
        // Fetch the image data, and uncompress if necessary.
        imageData = header.compressed ? uncompress(file, header.width, header.height) : file.read(header.width * header.height * 2);

        if (!noblink && header.nonBlink) {
            imageData.stripBlinking();
        }

        output = new Uint8Array(imageData.length / 2 * 3);

        for (i = 0, j = 0; i < imageData.length; i += 2, j += 3) {
            output[j] = imageData[i];
            output[j + 1] = imageData[i + 1] & 15;
            output[j + 2] = imageData[i + 1] >> 4;
        }

        return {
            "width": header.width,
            "height": header.height,
            "data": output,
            "noblink": header.nonBlink,
            "font": font,
            "palette": palette,
            "fontWidth": 8,
            "fontHeight": header.fontHeight,
            "title": file.sauce ? file.sauce.title : "",
            "author": file.sauce ? file.sauce.author : "",
            "group": file.sauce ? file.sauce.group : ""
        };
    }

    function loadBin(bytes, noblink) {
        var file, columns, imageData, data;

        file = new File(bytes);
        columns = 160;
        imageData = new ScreenData(columns);
        imageData.raw(file.read());

        if (file.sauce) {
            if ((file.sauce.flags & 1) && !noblink) {
                imageData.stripBlinking();
            }
        }

        data = imageData.getData();

        return {
            "width": 160,
            "height": data.length / 3 / columns,
            "data": data,
            "noblink": file.sauce ? ((file.sauce.flags & 1) === 1) : false,
            "title": file.sauce ? file.sauce.title : "",
            "author": file.sauce ? file.sauce.author : "",
            "group": file.sauce ? file.sauce.group : ""
        };
    }

    function get32BitNumber(array, index) {
        return array[index] + (array[index + 1] << 8) + (array[index + 2] << 16) + (array[index + 3] << 24);
    }

    function get16BitNumber(array, index) {
        return array[index] + (array[index + 1] << 8);
    }

    function getNullTerminatedString(array, index) {
        var text;
        text = "";
        while (array[index] !== 0) {
            text += String.fromCharCode(array[index]);
            index += 1;
        }
        return text;
    }

    function decodeBlock(array, index) {
        var header, length, compression, bytes, i;
        header = "";
        for (i = 0; i < 4; i += 1) {
            header += String.fromCharCode(array[index]);
            index += 1;
        }
        compression = array[index];
        index += 1;
        length = get32BitNumber(array, index);
        index += 4;
        bytes = array.subarray(index, index + length);
        if (compression === COMPRESS_LZ77) {
            bytes = LZ77.decompress(bytes);
        }
        return {
            "header": header,
            "bytes": bytes
        };
    }

    function decompressImage(bytes) {
        var decompressedImage, i, j;
        decompressedImage = new Uint8Array(bytes.length / 2 * 3);
        for (i = 0, j = 0; i < bytes.length; i += 2, j += 3) {
            decompressedImage[j] = bytes[i];
            decompressedImage[j + 1] = bytes[i + 1] & 0xf;
            decompressedImage[j + 2] = bytes[i + 1] >> 4;
        }
        return decompressedImage;
    }

    function decodeUndos(block) {
        var queue, type, types, size, i, j, undoValue, screenValue, image;
        queue = [];
        types = [];
        i = 0;
        while (i < block.bytes.length) {
            undoValue = [];
            type = block.bytes[i];
            i += 1;
            types.push(type);
            size = get32BitNumber(block.bytes, i);
            i += 4;
            if (type === UNDO_RESIZE) {
                undoValue.push(get16BitNumber(block.bytes, i));
                i += 2;
                undoValue.push(get16BitNumber(block.bytes, i));
                i += 2;
                image = decompressImage(block.bytes.subarray(i, undoValue[0] * undoValue[1] * 2 + i));
                i += undoValue[0] * undoValue[1] * 2;
                undoValue.push(image);
            } else {
                for (j = 0; j < size; j += 1) {
                    screenValue = [];
                    screenValue.push(block.bytes[i]);
                    i += 1;
                    screenValue.push(block.bytes[i] & 0xf);
                    screenValue.push(block.bytes[i] >> 4);
                    i += 1;
                    screenValue.push(get32BitNumber(block.bytes, i));
                    i += 4;
                    undoValue.push(screenValue);
                }
            }
            queue.push(undoValue);
        }
        return {"queue": queue, "types": types};
    }

    function decodeMetadata(block) {
        var title, author, group;
        title = getNullTerminatedString(block.bytes, 0);
        author = getNullTerminatedString(block.bytes, title.length + 1);
        group = getNullTerminatedString(block.bytes, title.length + 1 + author.length + 1);
        return {
            "title": title,
            "author": author,
            "group": group
        };
    }

    function decodeImage(block) {
        var width, height, noblink;
        width = get16BitNumber(block.bytes, 0);
        height = get16BitNumber(block.bytes, 2);
        noblink = (block.bytes[4] === 1);
        return {
            "width": width,
            "height": height,
            "data": decompressImage(block.bytes.subarray(5, block.bytes.length)),
            "noblink": noblink
        };
    }

    function decodeFont(block) {
        return {
            "width": block.bytes[0],
            "height": block.bytes[1],
            "bytes": block.bytes.subarray(2, block.bytes.length)
        };
    }

    function decodePalette(block) {
        var palette, i;
        palette = [];
        for (i = 0; i < 48; i += 3) {
            palette.push([block.bytes[i], block.bytes[i + 1], block.bytes[i + 2]]);
        }
        return palette;
    }

    function decodeStates(block) {
        var currentColor, currentTool, i, states, uid, length;
        currentColor = block.bytes[0];
        currentTool = getNullTerminatedString(block.bytes, 1);
        i = 1 + currentTool.length + 1;
        states = {};
        while (i < block.bytes.length) {
            uid = getNullTerminatedString(block.bytes, i);
            i += uid.length + 1;
            length = get32BitNumber(block.bytes, i);
            i += 4;
            states[uid] = block.bytes.subarray(i, i + length);
            i += length;
        }
        return {
            "currentColor": currentColor,
            "currentTool": currentTool,
            "states": states
        };
    }

    function loadNative(bytes, callback, noblink, editor, toolbar) {
        var ansiBlock, i, block, blocks;
        ansiBlock = decodeBlock(bytes, 0);
        if (ansiBlock.header === "ANSi") {
            blocks = {};
            i = 0;
            while (i < ansiBlock.bytes.length) {
                block = decodeBlock(ansiBlock.bytes, i);
                i += block.bytes.length + 9;
                switch (block.header) {
                case "DISP":
                    blocks[block.header] = decodeImage(block);
                    break;
                case "FONT":
                    blocks[block.header] = decodeFont(block);
                    break;
                case "PALE":
                    blocks[block.header] = decodePalette(block);
                    break;
                case "UNDO":
                    blocks[block.header] = decodeUndos(block);
                    break;
                case "TOOL":
                    blocks[block.header] = decodeStates(block);
                    break;
                case "META":
                    blocks[block.header] = decodeMetadata(block);
                    break;
                default:
                    blocks[block.header] = block.bytes;
                }
            }
        }
        if (editor === undefined && !noblink && blocks.DISP.noblink) {
            for (i = 2; i < blocks.IMAG.data.length; i += 3) {
                if (blocks.DISP[i] >= 8) {
                    blocks.DISP[i] -= 8;
                }
            }
        }
        blocks.DISP.title = blocks.META.title;
        blocks.DISP.author = blocks.META.author;
        blocks.DISP.group = blocks.META.group;
        if (blocks.FONT !== undefined) {
            blocks.DISP.fontWidth = blocks.FONT.width;
            blocks.DISP.fontHeight = blocks.FONT.height;
            blocks.DISP.font = blocks.FONT.bytes;
        }
        if (blocks.PALE !== undefined) {
            blocks.DISP.palette = blocks.PALE;
        }
        callback(blocks.DISP);
        if (editor !== undefined && toolbar !== undefined) {
            editor.setUndoHistory(blocks.UNDO.queue, blocks.UNDO.types);
            toolbar.giveFocus(blocks.TOOL.currentTool);
            toolbar.setStates(blocks.TOOL.states);
            editor.setCurrentColor(blocks.TOOL.currentColor);
        }
    }

    function loadFile(file, callback, noblink, editor, toolbar) {
        var extension, reader;
        extension = file.name.split(".").pop().toLowerCase();
        reader = new FileReader();
        reader.onload = function (readerData) {
            var data;
            data = new Uint8Array(readerData.target.result);
            switch (extension) {
            case "ansiedit":
                loadNative(data, callback, noblink, editor, toolbar);
                break;
            case "xb":
                callback(loadXbin(data, noblink));
                break;
            case "bin":
                callback(loadBin(data, noblink));
                break;
            default:
                callback(loadAnsi(data, noblink));
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function parseFontData(imageData) {
        var fontWidth, fontHeight, i, j, k, pos, value, bytes, x, y;
        fontWidth = imageData.width / 16;
        fontHeight = imageData.height / 16;
        if ((fontWidth === 8) && (imageData.height % 16 === 0) && (fontHeight >= 1 && fontHeight <= 32)) {
            bytes = new Uint8Array(8 * fontHeight * 256 / 8);
            k = 0;
            for (value = 0; value < 256; value += 1) {
                x = (value % 16) * fontWidth;
                y = Math.floor(value / 16) * fontHeight;
                pos = (y * imageData.width + x) * 4;
                i = j = 0;
                while (i < fontWidth * fontHeight) {
                    bytes[k] = bytes[k] << 1;
                    if (imageData.data[pos] > 127) {
                        bytes[k] += 1;
                    }
                    if ((i += 1) % fontWidth === 0) {
                        pos += (imageData.width - 8) * 4;
                    }
                    if (i % 8 === 0) {
                        k += 1;
                    }
                    pos += 4;
                }
            }
            return {
                "width": fontWidth,
                "height": fontHeight,
                "bytes": bytes
            };
        }
        return undefined;
    }

    function convert8BitTo6Bit(rgb) {
        return [Math.floor(rgb[0] / 255 * 63), Math.floor(rgb[1] / 255 * 63), Math.floor(rgb[2] / 255 * 63)];
    }

    function parsePaletteData(imageData) {
        var i, x, y, index, palette, rgb;
        if (imageData.width === 160 && imageData.height === 40) {
            palette = [];
            for (i = 0; i < 16; i += 1) {
                x = (i % 8) * imageData.width / 8;
                y = (i < 8) ? imageData.height / 2 : 0;
                index = (y * imageData.width + x) * 4;
                rgb = imageData.data.subarray(index, index + 3);
                rgb = convert8BitTo6Bit(rgb);
                palette.push(rgb);
            }
            return palette;
        }
        return undefined;
    }

    function loadImageGetImageData(url, callback) {
        var img;
        img = new Image();
        img.onload = function () {
            var canvas, ctx, imageData;
            canvas = ElementHelper.create("canvas", {"width": img.width, "height": img.height});
            ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            callback(imageData);
        };
        img.src = url;
    }

    function loadFont(url, callback) {
        loadImageGetImageData(url, function (imageData) {
            var fontData;
            fontData = parseFontData(imageData);
            callback(fontData);
        });
    }

    function loadPalette(url, callback) {
        loadImageGetImageData(url, function (imageData) {
            var paletteData;
            paletteData = parsePaletteData(imageData);
            callback(paletteData);
        });
    }

    return {
        "loadFile": loadFile,
        "loadFont": loadFont,
        "loadPalette": loadPalette
    };
}());
