var AnsiEdit = (function () {
    "use strict";
    var COMPRESS_LZ77, UNDO_FREEHAND, UNDO_CHUNK, UNDO_RESIZE, PLAYER_PAUSE, PLAYER_END;

    COMPRESS_LZ77 = 1;

    UNDO_FREEHAND = 0;
    UNDO_CHUNK = 1;
    UNDO_RESIZE = 2;

    PLAYER_PAUSE = -2;
    PLAYER_END = -1;

    function get32BitNumber(array, index) {
        return array[index] + (array[index + 1] << 8) + (array[index + 2] << 16) + (array[index + 3] << 24);
    }

    function get16BitNumber(array, index) {
        return array[index] + (array[index + 1] << 8);
    }

    function decompress(bytes) {
        var pointerLengthWidth, inputPointer, pointerLength, pointerPos, pointerLengthMask, compressedPointer, codingPos, pointerOffset, decompressedSize, decompressedBytes;

        decompressedSize = get32BitNumber(bytes, 0);
        decompressedBytes = new Uint8Array(decompressedSize);
        pointerLengthWidth = bytes[4];
        compressedPointer = 5;
        pointerLengthMask = Math.pow(2, pointerLengthWidth) - 1;

        for (codingPos = 0; codingPos < decompressedSize; codingPos += 1) {
            inputPointer = get16BitNumber(bytes, compressedPointer);
            compressedPointer += 2;
            pointerPos = inputPointer >> pointerLengthWidth;
            if (pointerPos > 0) {
                pointerLength = (inputPointer & pointerLengthMask) + 1;
            } else {
                pointerLength = 0;
            }
            if (pointerPos) {
                for (pointerOffset = codingPos - pointerPos; pointerLength > 0; pointerLength -= 1) {
                    decompressedBytes[codingPos] = decompressedBytes[pointerOffset];
                    codingPos += 1;
                    pointerOffset += 1;
                }
            }
            decompressedBytes[codingPos] = bytes[compressedPointer];
            compressedPointer += 1;
        }

        return decompressedBytes;
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
            bytes = decompress(bytes);
        }
        return {
            "header": header,
            "bytes": bytes
        };
    }

    function createMetaDataFromBytes(bytes) {
        var ansiBlock, i, block, blocks, title, author, group;

        function getNullTerminatedString(array, index) {
            var text;
            text = "";
            while (array[index] !== 0) {
                text += String.fromCharCode(array[index]);
                index += 1;
            }
            return text;
        }

        ansiBlock = decodeBlock(bytes, 0);
        if (ansiBlock.header === "ANSi") {
            blocks = {};
            i = 0;
            while (i < ansiBlock.bytes.length) {
                block = decodeBlock(ansiBlock.bytes, i);
                i += block.bytes.length + 9;
                if (block.header === "META") {
                    title = getNullTerminatedString(block.bytes, 0);
                    author = getNullTerminatedString(block.bytes, title.length + 1);
                    group = getNullTerminatedString(block.bytes, title.length + 1 + author.length + 1);
                    return {
                        "title": title,
                        "author": author,
                        "group": group
                    };
                }
            }
        }

        return undefined;
    }

    function createAnsiEditFileFromBytes(rawBytes) {
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
            var queue, type, types, size, i, j, k, undoValue, screenValue, image;
            queue = [];
            types = [];
            i = 0;
            k = 1;
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

        function decodeImage(block) {
            var columns, rows, noblink;
            columns = get16BitNumber(block.bytes, 0);
            rows = get16BitNumber(block.bytes, 2);
            noblink = (block.bytes[4] === 1);
            return {
                "columns": columns,
                "rows": rows,
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

        function loadNative(bytes) {
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
                    default:
                        blocks[block.header] = block.bytes;
                    }
                }
            }
            return blocks;
        }

        return loadNative(rawBytes);
    }

    function codepageGenerator(palette, fontWidth, fontHeight, fontBytes) {
        var currentFont, fontDataBuffer, paletteRGBA;

        function convert18bitTo24Bit(rgb) {
            return new Uint8Array([rgb[0] << 2 | rgb[0] >> 4, rgb[1] << 2 | rgb[1] >> 4, rgb[2] << 2 | rgb[2] >> 4, 255]);
        }

        fontDataBuffer = [];
        paletteRGBA = palette.map(convert18bitTo24Bit);

        function bytesToBits(width, height, bytes) {
            var bits, i, j, k;
            bits = new Uint8Array(width * height * 256);
            for (i = 0, k = 0; i < width * height * 256 / 8; i += 1) {
                for (j = 7; j >= 0; j -= 1, k += 1) {
                    bits[k] = (bytes[i] >> j) & 1;
                }
            }
            return {
                "bits": bits,
                "width": width,
                "height": height
            };
        }

        function getData(charCode, fgRGBA, bgRGBA, font) {
            var fontBitWidth, rgbaOutput, i, j, k;
            fontBitWidth = font.width * font.height;
            rgbaOutput = new Uint8Array(font.width * font.height * 4);
            for (i = 0, j = charCode * fontBitWidth, k = 0; i < fontBitWidth; i += 1, j += 1) {
                if (font.bits[j] === 1) {
                    rgbaOutput.set(fgRGBA, k);
                } else {
                    rgbaOutput.set(bgRGBA, k);
                }
                k += 4;
            }
            return rgbaOutput;
        }

        function fontData(charCode, fg, bg) {
            var bufferIndex;
            bufferIndex = charCode + (fg << 8) + (bg << 12);
            if (!fontDataBuffer[bufferIndex]) {
                fontDataBuffer[bufferIndex] = getData(charCode, paletteRGBA[fg], paletteRGBA[bg], currentFont);
            }
            return fontDataBuffer[bufferIndex];
        }

        currentFont = bytesToBits(fontWidth, fontHeight, fontBytes);

        return {
            "fontWidth": fontWidth,
            "fontHeight": fontHeight,
            "fontData": fontData
        };
    }


    function createCanvasElement(columns, rows, codepage) {
        var canvas;
        canvas = document.createElement("canvas");
        canvas.width = codepage.fontWidth * columns;
        canvas.height = codepage.fontHeight * rows;
        return canvas;
    }

    function createAnsiEditReplayerFromFile(file) {
        var display, startDisplay, canvas, start, end, ctx, divContainer, columns, rows, startColumns, startRows, imageData, codepage, undoQueue, undoTypes, redoQueue, redoTypes, pos, playing, pauseCallback;

        function undoAllQueue() {
            var values, redoValues, undoType, i, canvasIndex;
            while (undoQueue.length > 0) {
                undoType = undoTypes.shift();
                redoTypes.unshift(undoType);
                values = undoQueue.shift();
                if (undoType === UNDO_RESIZE) {
                    redoQueue.unshift([columns, rows, display.subarray(0, display.length)]);
                    columns = values[0];
                    rows = values[1];
                    display = values[2].subarray(0, values[2].length);
                } else {
                    redoValues = [];
                    values.reverse();
                    for (i = 0; i < values.length; i += 1) {
                        canvasIndex = values[i][3];
                        redoValues.push([display[canvasIndex], display[canvasIndex + 1], display[canvasIndex + 2], canvasIndex]);
                        display[canvasIndex] = values[i][0];
                        display[canvasIndex + 1] = values[i][1];
                        display[canvasIndex + 2] = values[i][2];
                    }
                    redoQueue.unshift(redoValues.reverse());
                }
            }
        }

        function renderText(charCode, fg, bg, x, y) {
            imageData.data.set(codepage.fontData(charCode, fg, bg), 0);
            ctx.putImageData(imageData, x * codepage.fontWidth, y * codepage.fontHeight);
        }

        function renderDisplay() {
            var x, y, i;
            for (i = 0, y = 0; y < rows; y += 1) {
                for (x = 0; x < columns; x += 1, i += 3) {
                    renderText(display[i], display[i + 1], display[i + 2], x, y);
                }
            }
        }

        function renderFromRedoQueue() {
            var value, x, y;
            value = redoQueue[pos.chunk][pos.subChunk];
            x = (value[3] / 3) % columns;
            y = Math.floor((value[3] / 3) / columns);
            renderText(value[0], value[1], value[2], x, y);
        }

        function resizeContainer() {
            divContainer.style.width = canvas.width + "px";
            divContainer.style.height = canvas.height + "px";
        }

        function redo() {
            if (!playing) {
                return PLAYER_PAUSE;
            }
            if (pos.chunk === redoQueue.length) {
                return PLAYER_END;
            }
            if (pos.subChunk === redoQueue[pos.chunk].length) {
                pos.subChunk = 0;
                pos.chunk += 1;
            }
            switch (redoTypes[pos.chunk]) {
            case UNDO_FREEHAND:
                renderFromRedoQueue();
                pos.subChunk += 1;
                if (pos.subChunk === redoQueue[pos.chunk].length) {
                    return 0;
                }
                return 0;
            case UNDO_CHUNK:
                while (pos.subChunk < redoQueue[pos.chunk].length) {
                    renderFromRedoQueue();
                    pos.subChunk += 1;
                }
                return 50;
            case UNDO_RESIZE:
                if (canvas.parentNode === divContainer) {
                    divContainer.removeChild(canvas);
                }
                columns = redoQueue[pos.chunk][0];
                rows = redoQueue[pos.chunk][1];
                display = redoQueue[pos.chunk][2];
                canvas = createCanvasElement(columns, rows, codepage);
                ctx = canvas.getContext("2d");
                renderDisplay();
                resizeContainer();
                divContainer.appendChild(canvas);
                pos.subChunk = redoQueue[pos.chunk].length;
                return 1000;
            default:
            }
        }

        function copyCanvas(source) {
            var copy;
            copy = document.createElement("canvas");
            copy.width = canvas.width;
            copy.height = canvas.height;
            copy.getContext("2d").drawImage(source, 0, 0);
            return copy;
        }

        codepage = codepageGenerator(file.PALE, file.FONT.width, file.FONT.height, file.FONT.bytes);
        undoQueue = file.UNDO.queue;
        undoTypes = file.UNDO.types;
        redoQueue = [];
        redoTypes = [];
        pos = {
            "chunk": 0,
            "subChunk": 0
        };
        columns = file.DISP.columns;
        rows = file.DISP.rows;
        display = new Uint8Array(file.DISP.data);
        canvas = createCanvasElement(columns, rows, codepage);
        ctx = canvas.getContext("2d");
        imageData = ctx.createImageData(codepage.fontWidth, codepage.fontHeight);
        renderDisplay();
        end = copyCanvas(canvas);
        undoAllQueue();
        startColumns = columns;
        startRows = rows;
        startDisplay = new Uint8Array(display);
        canvas = createCanvasElement(columns, rows, codepage);
        ctx = canvas.getContext("2d");
        renderDisplay();
        start = copyCanvas(canvas);
        playing = false;
        pauseCallback = undefined;

        function tic(callback) {
            var pauseTime;
            pauseTime = redo();
            if (pauseTime >= 0) {
                setTimeout(function () {
                    tic(callback);
                }, pauseTime);
            } else if (pauseTime === PLAYER_END && callback !== undefined) {
                callback();
            } else if (pauseTime === PLAYER_PAUSE && pauseCallback !== undefined) {
                pauseCallback();
            }
        }

        function rewind() {
            pos.chunk = 0;
            pos.subChunk = 0;
            if (canvas.parentNode === divContainer) {
                divContainer.removeChild(canvas);
            }
            columns = startColumns;
            rows = startRows;
            display = new Uint8Array(startDisplay);
            canvas = copyCanvas(start);
            ctx = canvas.getContext("2d");
            resizeContainer();
            divContainer.appendChild(canvas);
        }

        function forward() {
            pos.chunk = redoQueue.length;
            pos.subChunk = redoQueue[redoQueue.length - 1].length;
            if (canvas.parentNode === divContainer) {
                divContainer.removeChild(canvas);
            }
            columns = file.DISP.columns;
            rows = file.DISP.rows;
            display = new Uint8Array(file.DISP.data);
            canvas = copyCanvas(end);
            ctx = canvas.getContext("2d");
            resizeContainer();
            divContainer.appendChild(canvas);
        }

        function play(useDivContainer, callback) {
            playing = true;
            pauseCallback = undefined;
            if (canvas.parentNode !== useDivContainer) {
                divContainer = useDivContainer;
                resizeContainer();
                divContainer.appendChild(canvas);
            }
            if (redoQueue.length > 0) {
                if (pos.chunk === redoQueue.length) {
                    rewind();
                }
                tic(callback);
            }
        }

        function pause(callback) {
            playing = false;
            if (playing) {
                pauseCallback = callback;
            } else {
                callback();
            }
        }

        return {
            "play": play,
            "pause": pause,
            "rewind": rewind,
            "forward": forward,
            "start": start,
            "end": end
        };
    }

    function createCanvasFromFile(file) {
        var codepage, canvas, ctx, imageData, x, y, i;

        codepage = codepageGenerator(file.PALE, file.FONT.width, file.FONT.height, file.FONT.bytes);
        canvas = createCanvasElement(file.DISP.columns, file.DISP.rows, codepage);
        ctx = canvas.getContext("2d");
        imageData = ctx.createImageData(codepage.fontWidth, codepage.fontHeight);

        for (i = 0, y = 0; y < file.DISP.rows; y += 1) {
            for (x = 0; x < file.DISP.columns; x += 1, i += 3) {
                imageData.data.set(codepage.fontData(file.DISP.data[i], file.DISP.data[i + 1], file.DISP.data[i + 2]), 0);
                ctx.putImageData(imageData, x * codepage.fontWidth, y * codepage.fontHeight);
            }
        }

        return canvas;
    }

    function getBytesFromURL(url, err, callback) {
        var http;
        http = new XMLHttpRequest();
        http.open("GET", url, true);
        http.onreadystatechange = function () {
            if (http.readyState === 4) {
                if ((http.status === 200 || http.status === 0) && http.response !== null) {
                    callback(new Uint8Array(http.response));
                } else {
                    err();
                }
            }
        };
        http.responseType = "arraybuffer";
        http.send("");
    }

    function renderCanvasFromBytes(bytes) {
        var ansiEditFile;
        ansiEditFile = createAnsiEditFileFromBytes(bytes);
        return createCanvasFromFile(ansiEditFile);
    }

    function renderCanvasFromURL(url, err, callback) {
        getBytesFromURL(url, err, function (bytes) {
            callback(renderCanvasFromBytes(bytes));
        });
    }

    function createPlayerFromBytes(bytes) {
        var ansiEditFile;
        ansiEditFile = createAnsiEditFileFromBytes(bytes);
        return createAnsiEditReplayerFromFile(ansiEditFile);
    }

    function createPlayerFromURL(url, err, callback) {
        getBytesFromURL(url, err, function (bytes) {
            callback(createPlayerFromBytes(bytes));
        });
    }

    function obtainMetaDataFromBytes(bytes) {
        return createMetaDataFromBytes(bytes);
    }

    function obtainMetaDataFromURL(url, err, callback) {
        getBytesFromURL(url, err, function (bytes) {
            callback(obtainMetaDataFromBytes(bytes));
        });
    }

    return {
        "obtainMetaDataFromBytes": obtainMetaDataFromBytes,
        "obtainMetaDataFromURL": obtainMetaDataFromURL,
        "renderCanvasFromBytes": renderCanvasFromBytes,
        "renderCanvasFromURL": renderCanvasFromURL,
        "createPlayerFromBytes": createPlayerFromBytes,
        "createPlayerFromURL": createPlayerFromURL
    };
}());