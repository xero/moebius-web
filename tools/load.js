function loadTool(editor, toolbar) {
    "use strict";
    function File(bytes) {
        var pos, SAUCE_ID, COMNT_ID, commentCount;

        SAUCE_ID = new Uint8Array([0x53, 0x41, 0x55, 0x43, 0x45]);
        COMNT_ID = new Uint8Array([0x43, 0x4F, 0x4D, 0x4E, 0x54]);

        // Returns an 8-bit byte at the current byte position, <pos>. Also advances <pos> by a single byte. Throws an error if we advance beyond the length of the array.
        this.get = function () {
            if (pos >= bytes.length) {
                throw "Unexpected end of file reached.";
            }
            return bytes[pos++];
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
            while (num-- > 0) {
                string += this.getC();
            }
            return string.replace(/\s+$/, '');
        };

        // Returns "true" if, at the current <pos>, a string of characters matches <match>. Does not increment <pos>.
        this.lookahead = function (match) {
            var i;
            for (i = 0; i < match.length; ++i) {
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
            while (++pos < this.size) {
                if (--num === 0) {
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
                    while (commentCount-- > 0) {
                        this.sauce.comments.push(this.getS(64));
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
    }

    function loadAnsi(bytes) {
        var file, escaped, escapeCode, j, code, values, columns, imageData, topOfScreen, x, y, savedX, savedY, foreground, background, bold, blink, inverse, output;

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
                ++topOfScreen;
            } else {
                ++y;
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

        columns = 80;

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
                            for (j = x - 1; j < columns; ++j) {
                                imageData.set(j, y - 1 + topOfScreen, 0, 0);
                            }
                            break;
                        case "m": // Attributes, work through each code in turn.
                            for (j = 0; j < values.length; ++j) {
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
                            imageData.set(x - 1, y - 1 + topOfScreen, code, bold ? (foreground + 8) : foreground, background);
                        } else {
                            imageData.set(x - 1, y - 1 + topOfScreen, code, bold ? (background + 8) : background, foreground);
                        }
                        if (++x === columns + 1) {
                            newLine();
                        }
                    }
                }
            }
        }

        output = imageData.getData();
        if (output.length > 80 * 100 * 3) {
            return output.subarray(0, 80 * 100 * 3 - 1);
        } else {
            return output;
        }
    }

    function init() {
        var modal, divFileZone, paragraph;

        divFileZone = ElementHelper.create("div", {"className": "file-zone"});
        paragraph = ElementHelper.create("p", {"textContent": "Drop an ANSi file on me."});

        function dismiss() {
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        divFileZone.addEventListener('dragover', function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = "copy";
        }, false);

        divFileZone.addEventListener('drop', function (evt) {
            var reader;
            evt.stopPropagation();
            evt.preventDefault();
            if (evt.dataTransfer.files.length) {
                reader = new FileReader();
                reader.onload = function (data) {
                    editor.clearImage();
                    editor.image.set(loadAnsi(new Uint8Array(data.target.result)), 0);
                    editor.clearUndoHistory();
                    editor.redraw();
                };
                reader.readAsArrayBuffer(evt.dataTransfer.files[0]);
                dismiss();
            }
        }, false);

        modal = modalBox();
        divFileZone.appendChild(paragraph);
        modal.addPanel(divFileZone);
        modal.addButton("cancel", {"textContent": "Cancel", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            dismiss();
        }});

        editor.stopListening();
        toolbar.stopListening();
        modal.init();

        return false;
    }

    function toString() {
        return "Load";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "load"
    };
}