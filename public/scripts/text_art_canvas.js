function createTextArtCanvas(canvasContainer, callback) {
    "use strict";
    var columns = 80,
        rows = 25,
        iceColours = false,
        imageData = new Uint16Array(columns * rows),
        canvases,
        ctxs,
        offBlinkCanvases,
        onBlinkCanvases,
        offBlinkCtxs,
        onBlinkCtxs,
        blinkTimer,
        blinkOn = false,
        mouseButton = false,
        currentUndo = [],
        undoBuffer = [],
        redoBuffer = [],
        drawHistory = [];

    function updateBeforeBlinkFlip(x, y) {
        var dataIndex = y * columns + x;
        var contextIndex = Math.floor(y / 25);
        var contextY = y % 25;
        var charCode = imageData[dataIndex] >> 8;
        var background = (imageData[dataIndex] >> 4) & 15;
        var foreground = imageData[dataIndex] & 15;
        var shifted = background >= 8;
        if (shifted === true) {
            background -= 8;
        }
        if (blinkOn === true && shifted) {
            font.draw(charCode, background, background, ctxs[contextIndex], x, contextY);
        } else {
            font.draw(charCode, foreground, background, ctxs[contextIndex], x, contextY);
        }
    }


    function redrawGlyph(x, y) {
        var dataIndex = y * columns + x;
        var contextIndex = Math.floor(y / 25);
        var contextY = y % 25;
        var charCode = imageData[dataIndex] >> 8;
        var background = (imageData[dataIndex] >> 4) & 15;
        var foreground = imageData[dataIndex] & 15;
        if (iceColours === true) {
            font.draw(charCode, foreground, background, ctxs[contextIndex], x, contextY);
        } else {
            if (background >= 8) {
                background -= 8;
                font.draw(charCode, foreground, background, offBlinkCtxs[contextIndex], x, contextY);
                font.draw(charCode, background, background, onBlinkCtxs[contextIndex], x, contextY);
            } else {
                font.draw(charCode, foreground, background, offBlinkCtxs[contextIndex], x, contextY);
                font.draw(charCode, foreground, background, onBlinkCtxs[contextIndex], x, contextY);
            }
        }
    }

    function redrawEntireImage() {
        for (var y = 0, i = 0; y < rows; y++) {
            for (var x = 0; x < columns; x++, i++) {
                redrawGlyph(x, y);
            }
        }
    }

    function blink() {
        if (blinkOn === false) {
            blinkOn = true;
            for (var i = 0; i < ctxs.length; i++) {
                ctxs[i].drawImage(onBlinkCanvases[i], 0, 0);
            }
        } else {
            blinkOn = false;
            for (var i = 0; i < ctxs.length; i++) {
                ctxs[i].drawImage(offBlinkCanvases[i], 0, 0);
            }
        }
    }

    function createCanvases() {
        if (canvases !== undefined) {
            canvases.forEach((canvas) => {
                canvasContainer.removeChild(canvas);
            });
        }
        canvases = [];
        offBlinkCanvases = [];
        offBlinkCtxs = [];
        onBlinkCanvases = [];
        onBlinkCtxs = [];
        ctxs = [];
        var fontWidth = font.getWidth();
        var fontHeight = font.getHeight();
        var canvasWidth = fontWidth * columns;
        if (font.getLetterSpacing() === true) {
            canvasWidth += columns;
        }
        var canvasHeight = fontHeight * 25;
        for (var i = 0; i < Math.floor(rows / 25); i++) {
            var canvas = document.createElement("CANVAS");
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            canvases.push(canvas);
            ctxs.push(canvas.getContext("2d"));
            var onBlinkCanvas = document.createElement("CANVAS");
            onBlinkCanvas.width = canvasWidth;
            onBlinkCanvas.height = canvasHeight;
            onBlinkCanvases.push(onBlinkCanvas);
            onBlinkCtxs.push(onBlinkCanvas.getContext("2d"));
            var offBlinkCanvas = document.createElement("CANVAS");
            offBlinkCanvas.width = canvasWidth;
            offBlinkCanvas.height = canvasHeight;
            offBlinkCanvases.push(offBlinkCanvas);
            offBlinkCtxs.push(offBlinkCanvas.getContext("2d"));
        }
        if (rows % 25 !== 0) {
            var canvas = document.createElement("CANVAS");
            canvas.width = canvasWidth;
            canvas.height = fontHeight * (rows % 25);
            canvases.push(canvas);
            ctxs.push(canvas.getContext("2d"));
            var onBlinkCanvas = document.createElement("CANVAS");
            onBlinkCanvas.width = canvasWidth;
            onBlinkCanvas.height = fontHeight * (rows % 25);
            onBlinkCanvases.push(onBlinkCanvas);
            onBlinkCtxs.push(onBlinkCanvas.getContext("2d"));
            var offBlinkCanvas = document.createElement("CANVAS");
            offBlinkCanvas.width = canvasWidth;
            offBlinkCanvas.height = fontHeight * (rows % 25);
            offBlinkCanvases.push(offBlinkCanvas);
            offBlinkCtxs.push(offBlinkCanvas.getContext("2d"));
        }
        canvasContainer.style.width = canvasWidth + "px";
        for (var i = 0; i < canvases.length; i++) {
            canvasContainer.appendChild(canvases[i]);
        }
        if (blinkTimer !== undefined) {
            clearInterval(blinkTimer);
            blinkOn = false;
        }
        redrawEntireImage();
        if (iceColours === false) {
            blinkTimer = setInterval(blink, 250);
        }
    }

    function updateTimer() {
        if (blinkTimer !== undefined) {
            clearInterval(blinkTimer);
        }
        if (iceColours === false) {
            blinkOn = false;
            blinkTimer = setInterval(blink, 500);
        }
    }

    function setFont(fontName, callback) {
        font = loadFontFromImage(fontName, font.getLetterSpacing(), palette, (success) => {
            createCanvases();
            redrawEntireImage();
            document.dispatchEvent(new CustomEvent("onFontChange", {"detail": fontName}));
            callback();
        });
    }

    function resize(newColumnValue, newRowValue) {
        if ((newColumnValue !== columns || newRowValue !== rows) && (newColumnValue > 0 && newRowValue > 0)) {
            clearUndos();
            var maxColumn = (columns > newColumnValue) ? newColumnValue : columns;
            var maxRow = (rows > newRowValue) ? newRowValue : rows;
            var newImageData = new Uint16Array(newColumnValue * newRowValue);
            for (var y = 0; y < maxRow; y++) {
                for (var x = 0; x < maxColumn; x++) {
                    newImageData[y * newColumnValue + x] = imageData[y * columns + x];
                }
            }
            imageData = newImageData;
            columns = newColumnValue;
            rows = newRowValue;
            createCanvases();
            document.dispatchEvent(new CustomEvent("onTextCanvasSizeChange", {"detail": {"columns": columns, "rows": rows}}));
        }
    }

    function getIceColours() {
        return iceColours;
    }

    function setIceColours(newIceColours) {
        if (iceColours !== newIceColours) {
            iceColours = newIceColours;
            updateTimer();
            redrawEntireImage();
        }
    }

    function onLetterSpacingChange(letterSpacing) {
        createCanvases();
    }

    function getImage() {
        var completeCanvas = document.createElement("CANVAS");
        completeCanvas.width = (font.getWidth() * columns) + ((font.getLetterSpacing() === true) ? columns : 0);
        completeCanvas.height = font.getHeight() * rows;
        var y = 0;
        var ctx = completeCanvas.getContext("2d");
        ((iceColours === true) ? canvases : offBlinkCanvases).forEach((canvas) => {
                ctx.drawImage(canvas, 0, y);
                y += canvas.height;
        });
        return completeCanvas;
    }

    function getImageData() {
        return imageData;
    }

    function setImageData(newColumnValue, newRowValue, newImageData, newIceColours) {
        clearUndos();
        columns = newColumnValue;
        rows = newRowValue;
        imageData = newImageData;
        if (iceColours !== newIceColours) {
            iceColours = newIceColours;
            updateTimer();
        }
        createCanvases();
        redrawEntireImage();
        document.dispatchEvent(new CustomEvent("onOpenedFile"));
    }

    function getColumns() {
        return columns;
    }

    function getRows() {
        return rows;
    }

    function clearUndos() {
        currentUndo = [];
        undoBuffer = [];
        redoBuffer = [];
    }

    function clear() {
        title.reset();
        clearUndos();
        imageData = new Uint16Array(columns * rows);
        redrawEntireImage();
    }

    palette = createDefaultPalette();
    font = loadFontFromImage("CP437 8x16", false, palette, (success) => {
        createCanvases();
        updateTimer();
        callback();
    });

    function draw(index, charCode, foreground, background, x, y) {
        currentUndo.push([index, imageData[index], x, y]);
        imageData[index] = (charCode << 8) + (background << 4) + foreground;
        if (iceColours === false) {
            updateBeforeBlinkFlip(x, y);
        }
        redrawGlyph(x, y);
        drawHistory.push((index << 16) + imageData[index]);
    }

    function getBlock(x, y) {
        var index = y * columns + x;
        var charCode = imageData[index] >> 8;
        var foregroundColour = imageData[index] & 15;
        var backgroundColour = (imageData[index] >> 4) & 15;
        return {
            "x": x,
            "y": y,
            "charCode": charCode,
            "foregroundColour": foregroundColour,
            "backgroundColour": backgroundColour
        };
    }

    function getHalfBlock(x, y) {
        var index = Math.floor(y / 2) * columns + x;
        var foreground = imageData[index] & 15;
        var background = (imageData[index] >> 4) & 15;
        var upperBlockColour = 0;
        var lowerBlockColour = 0;
        var isBlocky = false;
        switch (imageData[index] >> 8) {
        case 0:
        case 32:
        case 255:
            upperBlockColour = background;
            lowerBlockColour = background;
            isBlocky = true;
            break;
        case 223:
            upperBlockColour = foreground;
            lowerBlockColour = background;
            isBlocky = true;
            break;
        case 220:
            upperBlockColour = background;
            lowerBlockColour = foreground;
            isBlocky = true;
            break;
        case 219:
            upperBlockColour = foreground;
            lowerBlockColour = foreground;
            isBlocky = true;
            break;
        default:
            if (foreground === background) {
                isBlocky = true;
                upperBlockColour = foreground;
                lowerBlockColour = foreground;
            } else {
                isBlocky = false;
            }
        }
        return {
            "x": x,
            "y": y,
            "isBlocky": isBlocky,
            "upperBlockColour": upperBlockColour,
            "lowerBlockColour": lowerBlockColour,
            "halfBlockY": y % 2
        };
    }

    function drawHalfBlock(index, foreground, x, y, textY) {
        var halfBlockY = y % 2;
        var charCode = imageData[index] >> 8;
        var currentForeground = imageData[index] & 15;
        var currentBackground = (imageData[index] >> 4) & 15;
        if (charCode === 219) {
            if (currentForeground !== foreground) {
                if (halfBlockY === 0) {
                    draw(index, 223, foreground, currentForeground, x, textY);
                } else {
                    draw(index, 220, foreground, currentForeground, x, textY);
                }
            }
        } else if (charCode !== 220 && charCode !== 223) {
            if (halfBlockY === 0) {
                draw(index, 223, foreground, currentBackground, x, textY);
            } else {
                draw(index, 220, foreground, currentBackground, x, textY);
            }
        } else {
            if (halfBlockY === 0) {
                if (charCode === 223) {
                    if (currentBackground === foreground) {
                        draw(index, 219, foreground, 0, x, textY);
                    } else {
                        draw(index, 223, foreground, currentBackground, x, textY);
                    }
                } else if (currentForeground === foreground) {
                    draw(index, 219, foreground, 0, x, textY);
                } else {
                    draw(index, 223, foreground, currentForeground, x, textY);
                }
            } else {
                if (charCode === 220) {
                    if (currentBackground === foreground) {
                        draw(index, 219, foreground, 0, x, textY);
                    } else {
                        draw(index, 220, foreground, currentBackground, x, textY);
                    }
                } else if (currentForeground === foreground) {
                    draw(index, 219, foreground, 0, x, textY);
                } else {
                    draw(index, 220, foreground, currentForeground, x, textY);
                }
            }
        }
    }

    document.addEventListener("onLetterSpacingChange", onLetterSpacingChange);

    function getXYCoords(clientX, clientY, callback) {
        var rect = canvasContainer.getBoundingClientRect();
        var x = Math.floor((clientX - rect.left) / (font.getWidth() + ((font.getLetterSpacing() === true) ? 1 : 0)));
        var y = Math.floor((clientY - rect.top) / font.getHeight());
        var halfBlockY = Math.floor((clientY - rect.top) / font.getHeight() * 2);
        callback(x, y, halfBlockY);
    }

    canvasContainer.addEventListener("mousedown", (evt) => {
        mouseButton = true;
        getXYCoords(evt.clientX, evt.clientY, (x, y, halfBlockY) => {
            if (evt.altKey === true) {
                sampleTool.sample(x, halfBlockY);
            } else {
                document.dispatchEvent(new CustomEvent("onTextCanvasDown", {"detail": {"x": x, "y": y, "halfBlockY": halfBlockY, "leftMouseButton": (evt.button === 0 && evt.ctrlKey !== true), "rightMouseButton": (evt.button === 2 || evt.ctrlKey === true)}}));
            }
        });
    });

    canvasContainer.addEventListener("contextmenu", (evt) => {
        evt.preventDefault();
    });

    canvasContainer.addEventListener("mousemove", (evt) => {
        evt.preventDefault();
        if (mouseButton === true) {
            getXYCoords(evt.clientX, evt.clientY, (x, y, halfBlockY) => {
                document.dispatchEvent(new CustomEvent("onTextCanvasDrag", {"detail": {"x": x, "y": y, "halfBlockY": halfBlockY, "leftMouseButton": (evt.button === 0 && evt.ctrlKey !== true), "rightMouseButton": (evt.button === 2 || evt.ctrlKey === true)}}));
            });
        }
    });

    canvasContainer.addEventListener("mouseup", (evt) => {
        evt.preventDefault();
        if (mouseButton === true) {
            mouseButton = false;
            document.dispatchEvent(new CustomEvent("onTextCanvasUp", {}));
        }
    });

    canvasContainer.addEventListener("mouseenter", (evt) => {
        evt.preventDefault();
        if (mouseButton === true && (evt.which === 0 || evt.buttons === 0)) {
            mouseButton = false;
            document.dispatchEvent(new CustomEvent("onTextCanvasUp", {}));
        }
    });

    function sendDrawHistory() {
        socket.draw(drawHistory);
        drawHistory = [];
    }

    function undo() {
        if (currentUndo.length > 0) {
            undoBuffer.push(currentUndo);
            currentUndo = [];
        }
        if (undoBuffer.length > 0) {
            var currentRedo = [];
            var undoChunk = undoBuffer.pop();
            for (var i = undoChunk.length - 1; i >= 0; i--) {
                var undo = undoChunk.pop();
                if (undo[0] < imageData.length) {
                    currentRedo.push([undo[0], imageData[undo[0]], undo[2], undo[3]]);
                    imageData[undo[0]] = undo[1];
                    drawHistory.push((undo[0] << 16) + undo[1]);
                    if (iceColours === false) {
                        updateBeforeBlinkFlip(undo[2], undo[3]);
                    }
                    redrawGlyph(undo[2], undo[3]);
                }
            }
            redoBuffer.push(currentRedo);
            sendDrawHistory();
        }
    }

    function redo() {
        if (redoBuffer.length > 0) {
            var redoChunk = redoBuffer.pop();
            for (var i = redoChunk.length - 1; i >= 0; i--) {
                var redo = redoChunk.pop();
                if (redo[0] < imageData.length) {
                    currentUndo.push([redo[0], imageData[redo[0]], redo[2], redo[3]]);
                    imageData[redo[0]] = redo[1];
                    drawHistory.push((redo[0] << 16) + redo[1]);
                    if (iceColours === false) {
                        updateBeforeBlinkFlip(redo[2], redo[3]);
                    }
                    redrawGlyph(redo[2], redo[3]);
                }
            }
            undoBuffer.push(currentUndo);
            currentUndo = [];
            sendDrawHistory();
        }
    }

    function startUndo() {
        if (currentUndo.length > 0) {
            undoBuffer.push(currentUndo);
            currentUndo = [];
        }
        redoBuffer = [];
    }

    function optimiseBlocks(blocks) {
        blocks.forEach((block) => {
            var index = block[0];
            var attribute = imageData[index];
            var background = (attribute >> 4) & 15;
            if (background >= 8) {
                switch (attribute >> 8) {
                case 0:
                case 32:
                case 255:
                    draw(index, 219, background, 0, block[1], block[2]);
                    break;
                case 219:
                    draw(index, 219, (attribute & 15), 0, block[1], block[2]);
                    break;
                case 223:
                    var foreground = (attribute & 15);
                    if (foreground < 8) {
                        draw(index, 220, background, foreground, block[1], block[2]);
                    }
                    break;
                case 220:
                    var foreground = (attribute & 15);
                    if (foreground < 8) {
                        draw(index, 223, background, foreground, block[1], block[2]);
                    }
                    break;
                default:
                    break;
                }
            }
        });
    }

    function drawEntryPoint(callback) {
        var blocks = [];
        callback(function (charCode, foreground, background, x, y) {
            var index = y * columns + x;
            blocks.push([index, x, y]);
            draw(index, charCode, foreground, background, x, y);
        });
        optimiseBlocks(blocks);
        sendDrawHistory();
    }

    function drawHalfBlockEntryPoint(callback) {
        var blocks = [];
        callback(function (foreground, x, y) {
            var textY = Math.floor(y / 2);
            var index = textY * columns + x;
            blocks.push([index, x, textY]);
            drawHalfBlock(index, foreground, x, y, textY);
        });
        optimiseBlocks(blocks);
        if (blocks.length >= 3000 && confirm("This operation will significantly change the image for other artists. Do you want to proceed?") === false) {
            undo();
            redoBuffer.pop();
        } else {
            sendDrawHistory();
        }
    }

    function deleteArea(x, y, width, height, background) {
        var maxWidth = x + width;
        var maxHeight = y + height;
        drawEntryPoint(function (draw) {
            for (var dy = y; dy < maxHeight; dy++) {
                for (var dx = x; dx < maxWidth; dx++) {
                    draw(0, 0, background, dx, dy);
                }
            }
        });
    }

    function getArea(x, y, width, height) {
        var data = new Uint16Array(width * height);
        for (var dy = 0, j = 0; dy < height; dy++) {
            for (var dx = 0; dx < width; dx++, j++) {
                var i = (y + dy) * columns + (x + dx);
                data[j] = imageData[i];
            }
        }
        return {
            "data": data,
            "width": width,
            "height": height
        };
    }

    function setArea(area, x, y) {
        var maxWidth = Math.min(area.width, columns - x);
        var maxHeight = Math.min(area.height, rows - y);
        drawEntryPoint(function (draw) {
            for (var py = 0; py < maxHeight; py++) {
                for (var px = 0; px < maxWidth; px++) {
                    var attrib = area.data[py * area.width + px];
                    draw(attrib >> 8, attrib & 15, (attrib >> 4) & 15, x + px, y + py);
                }
            }
        });
    }

    function quickDraw(index, value, x, y) {
        imageData[index] = value;
        if (iceColours === false) {
            updateBeforeBlinkFlip(x, y);
        }
        redrawGlyph(x, y);
    }

    return {
        "resize": resize,
        "redrawEntireImage": redrawEntireImage,
        "setFont": setFont,
        "getIceColours": getIceColours,
        "setIceColours": setIceColours,
        "getImage": getImage,
        "getImageData": getImageData,
        "setImageData": setImageData,
        "getColumns": getColumns,
        "getRows": getRows,
        "clear": clear,
        "draw": drawEntryPoint,
        "getBlock": getBlock,
        "getHalfBlock": getHalfBlock,
        "drawHalfBlock": drawHalfBlockEntryPoint,
        "startUndo": startUndo,
        "undo": undo,
        "redo": redo,
        "deleteArea": deleteArea,
        "getArea": getArea,
        "setArea": setArea,
        "quickDraw": quickDraw
    };
}
