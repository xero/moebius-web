var Load = (function () {
    "use strict";

    function File(bytes) {
        var pos, SAUCE_ID, COMNT_ID, commentCount;

        SAUCE_ID = new Uint8Array([0x53, 0x41, 0x55, 0x43, 0x45]);
        COMNT_ID = new Uint8Array([0x43, 0x4F, 0x4D, 0x4E, 0x54]);

        this.get = function () {
            if (pos >= bytes.length) {
                throw "Unexpected end of file reached.";
            }
            pos += 1;
            return bytes[pos - 1];
        };

        this.get16 = function () {
            var v;
            v = this.get();
            return v + (this.get() << 8);
        };

        this.get32 = function () {
            var v;
            v = this.get();
            v += this.get() << 8;
            v += this.get() << 16;
            return v + (this.get() << 24);
        };

        this.getC = function () {
            return String.fromCharCode(this.get());
        };

        this.getS = function (num) {
            var string;
            string = "";
            while (num > 0) {
                string += this.getC();
                num -= 1;
            }
            return string.replace(/\s+$/, "");
        };

        this.lookahead = function (match) {
            var i;
            for (i = 0; i < match.length; i += 1) {
                if ((pos + i === bytes.length) || (bytes[pos + i] !== match[i])) {
                    break;
                }
            }
            return i === match.length;
        };

        this.read = function (num) {
            var t;
            t = pos;

            num = num || this.size - pos;
            while ((pos += 1) < this.size) {
                num -= 1;
                if (num === 0) {
                    break;
                }
            }
            return bytes.subarray(t, pos);
        };

        this.seek = function (newPos) {
            pos = newPos;
        };

        this.peek = function (num) {
            num = num || 0;
            return bytes[pos + num];
        };

        this.getPos = function () {
            return pos;
        };

        this.eof = function () {
            return pos === this.size;
        };

        pos = bytes.length - 128;

        if (this.lookahead(SAUCE_ID)) {
            this.sauce = {};

            this.getS(5);

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

            this.sauce.comments = [];
            commentCount = this.get(); // unsigned 8-bit
            this.sauce.flags = this.get(); // unsigned 8-bit
            if (commentCount > 0) {

                pos = bytes.length - 128 - (commentCount * 64) - 5;

                if (this.lookahead(COMNT_ID)) {

                    this.getS(5);

                    while (commentCount > 0) {
                        this.sauce.comments.push(this.getS(64));
                        commentCount -= 1;
                    }
                }
            }
        }

        pos = 0;

        if (this.sauce) {

            if (this.sauce.fileSize > 0 && this.sauce.fileSize < bytes.length) {

                this.size = this.sauce.fileSize;
            } else {

                this.size = bytes.length - 128;
            }
        } else {

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

    function loadBin(bytes, noblink) {
        var file, columns, imageData, data;

        file = new File(bytes);
        columns = file.sauce ? (file.sauce.fileType * 2) : 160;
        imageData = new ScreenData(columns);
        imageData.raw(file.read());

        if (file.sauce) {
            if ((file.sauce.flags & 1) && !noblink) {
                imageData.stripBlinking();
            }
        }

        data = imageData.getData();

        return {
            "width": columns,
            "height": data.length / 3 / columns,
            "data": data,
            "noblink": file.sauce ? ((file.sauce.flags & 1) === 1) : false,
            "title": file.sauce ? file.sauce.title : "",
            "author": file.sauce ? file.sauce.author : "",
            "group": file.sauce ? file.sauce.group : ""
        };
    }

    function loadXbin(bytes) {
        var file, header, font, palette, red, green, blue, imageData, output, i, j;

        function XBinHeader(file) {
            var flags;

            if (file.getS(4) !== "XBIN") {
                throw "File ID does not match.";
            }
            if (file.get() !== 26) {
                throw "File ID does not match.";
            }

            this.width = file.get16();
            this.height = file.get16();

            this.fontHeight = file.get();

            if (this.fontHeight === 0 || this.fontHeight > 32) {
                throw "Illegal value for the font height (" + this.fontHeight + ").";
            }

            flags = file.get();

            this.palette = ((flags & 1) === 1);
            this.font = ((flags & 2) === 2);

            if (this.fontHeight !== 16 && !this.font) {
                throw "A non-standard font size was defined, but no font information was included with the file.";
            }

            this.compressed = ((flags & 4) === 4);
            this.nonBlink = ((flags & 8) === 8);
            this.char512 = ((flags & 16) === 16);
        }

        function uncompress(file, width, height) {
            var uncompressed, p, repeatAttr, repeatChar, count;

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

        file = new File(bytes);
        header = new XBinHeader(file);

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

        if (header.font) {
            font = file.read(header.fontHeight * 256);
        } else {
            font = undefined;
        }

        imageData = header.compressed ? uncompress(file, header.width, header.height) : file.read(header.width * header.height * 2);

        output = new Uint8Array(Math.floor(imageData.length / 2) * 3);

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

    function loadAnsi(bytes) {
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
                            imageData.set(x - 1, y - 1 + topOfScreen, code, bold ? (foreground + 8) : foreground, blink ? (background + 8) : background);
                        } else {
                            imageData.set(x - 1, y - 1 + topOfScreen, code, bold ? (background + 8) : background, blink ? (foreground + 8) : foreground);
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

    function convertData(data) {
        var output = new Uint16Array(data.length / 3);
        for (var i = 0, j = 0; i < data.length; i += 1, j += 3) {
            output[i] = (data[j] << 8) + (data[j + 2] << 4) + data[j + 1];
        }
        return output;
    }

    function file(file, callback) {
        var reader = new FileReader();
        reader.addEventListener("load", function (evt) {
            var data = new Uint8Array(reader.result);
            var imageData;
            switch (file.name.split(".").pop().toLowerCase()) {
            case "xb":
                imageData = loadXbin(data);
                break;
            case "bin":
                imageData = loadBin(data);
                break;
            default:
                imageData = loadAnsi(data);
            }
            $("sauce-title").value = imageData.title;
            $("sauce-group").value = imageData.group;
            $("sauce-author").value = imageData.author;
            callback(imageData.width, imageData.height, convertData(imageData.data), imageData.noblink, false);
        });
        reader.readAsArrayBuffer(file);
    }

    return {
        "file": file
    };
}());
