function editorCanvas(divEditor, columns, rows, palette, noblink, preview, codepage, retina) {
    "use strict";
    var canvas, ctx, imageData, image, undoQueue, redoQueue, overlays, mirror, colorListeners, blinkModeChangeListeners, mouseMoveListeners, mouseDownListeners, mouseDragListeners, mouseUpListeners, mouseOutListeners, resizeListeners, customEventListeners;

    undoQueue = [];
    redoQueue = [];
    overlays = {};
    mirror = false;
    colorListeners = [];
    blinkModeChangeListeners = [];
    mouseMoveListeners = [];
    mouseDownListeners = [];
    mouseDragListeners = [];
    mouseUpListeners = [];
    mouseOutListeners = [];
    resizeListeners = [];
    customEventListeners = {};

    function draw(charCode, x, y, fg, bg) {
        imageData.data.set(codepage.bigFont(charCode, fg, bg), 0);
        ctx.putImageData(imageData, x * imageData.width, y * imageData.height);
        preview.draw(charCode, x, y, fg, bg);
    }

    function update(index) {
        draw(image[index], index / 3 % columns, Math.floor(index / (columns * 3)), image[index + 1], image[index + 2]);
    }

    function redraw() {
        var i;
        for (i = 0; i < image.length; i += 3) {
            update(i);
        }
    }

    function clearImage() {
        var i;
        for (i = 0; i < image.length; i += 3) {
            image[i] = 0;
            image[i + 1] = 7;
            image[i + 2] = 0;
        }
        redraw();
    }

    function getColumns() {
        return columns;
    }

    function getRows() {
        return rows;
    }

    function getRetina() {
        return retina;
    }

    function addListener(listeners, listener) {
        listeners.push(listener);
    }

    function removeListener(listeners, listener) {
        var i;
        for (i = 0; i < listeners.length; i++) {
            if (listeners[i] === listener) {
                listeners.splice(i, 1);
            }
        }
    }

    function addColorChangeListener(listener) {
        addListener(colorListeners, listener);
    }

    function removeColorChangeListener(listener) {
        removeListener(colorListeners, listener);
    }

    function addBlinkModeChangeListener(listener) {
        addListener(blinkModeChangeListeners, listener);
    }

    function removeBlinkModeChangeListener(listener) {
        removeListener(blinkModeChangeListeners, listener);
    }

    function addMouseMoveListener(listener) {
        addListener(mouseMoveListeners, listener);
    }

    function removeMouseMoveListener(listener) {
        removeListener(mouseMoveListeners, listener);
    }

    function addMouseDownListener(listener) {
        addListener(mouseDownListeners, listener);
    }

    function removeMouseDownListener(listener) {
        removeListener(mouseDownListeners, listener);
    }

    function addMouseDragListener(listener) {
        addListener(mouseDragListeners, listener);
    }

    function removeMouseDragListener(listener) {
        removeListener(mouseDragListeners, listener);
    }

    function addMouseUpListener(listener) {
        addListener(mouseUpListeners, listener);
    }

    function removeMouseUpListener(listener) {
        removeListener(mouseUpListeners, listener);
    }

    function addMouseOutListener(listener) {
        addListener(mouseOutListeners, listener);
    }

    function removeMouseOutListener(listener) {
        removeListener(mouseOutListeners, listener);
    }

    function addResizeListener(listener) {
        addListener(resizeListeners, listener);
    }

    function removeResizeListener(listener) {
        removeListener(resizeListeners, listener);
    }

    function addCustomEventListener(uid, listener) {
        if (customEventListeners[uid] === undefined) {
            customEventListeners[uid] = [];
        }
        addListener(customEventListeners[uid], listener);
    }

    function removeCustomEventListener(uid, listener) {
        if (customEventListeners[uid] !== undefined) {
            removeListener(customEventListeners[uid], listener);
        }
    }

    function fireEvent(listeners, evt) {
        listeners.forEach(function (listener) {
            listener(evt);
        });
    }

    function fireCustomEvent(uid, evt) {
        if (customEventListeners[uid] !== undefined) {
            fireEvent(customEventListeners[uid], evt);
        }
    }

    function changeColor(color) {
        fireEvent(colorListeners, color);
    }

    function storeUndo(block) {
        redoQueue = [];
        undoQueue[0].push([block.charCode, block.foreground, block.background, block.index]);
    }

    function set(charCode, fg, bg, index) {
        image[index] = charCode;
        image[index + 1] = fg;
        image[index + 2] = bg;
    }

    function getBlock(blockX, blockY) {
        var index, textY, modBlockY, charCode, foreground, background, isBlocky, upperBlockColor, lowerBlockColor;
        textY = Math.floor(blockY / 2);
        modBlockY = blockY % 2;
        index = (textY * columns + blockX) * 3;
        charCode = image[index];
        foreground = image[index + 1];
        background = image[index + 2];
        switch (charCode) {
        case codepage.NULL:
        case codepage.SPACE:
        case codepage.NO_BREAK_SPACE:
            upperBlockColor = background;
            lowerBlockColor = background;
            isBlocky = true;
            break;
        case codepage.UPPER_HALF_BLOCK:
            upperBlockColor = foreground;
            lowerBlockColor = background;
            isBlocky = true;
            break;
        case codepage.LOWER_HALF_BLOCK:
            upperBlockColor = background;
            lowerBlockColor = foreground;
            isBlocky = true;
            break;
        case codepage.FULL_BLOCK:
            upperBlockColor = foreground;
            lowerBlockColor = foreground;
            isBlocky = true;
            break;
        default:
            if (foreground === background) {
                isBlocky = true;
                upperBlockColor = foreground;
                lowerBlockColor = foreground;
            } else {
                isBlocky = false;
            }
        }
        return {
            "index": index,
            "textX": blockX,
            "textY": textY,
            "blockX": blockX,
            "blockY": blockY,
            "isUpperHalf": (modBlockY === 0),
            "isLowerHalf": (modBlockY === 1),
            "charCode": charCode,
            "foreground": foreground,
            "background": background,
            "isBlocky": isBlocky,
            "upperBlockColor": upperBlockColor,
            "lowerBlockColor": lowerBlockColor
        };
    }

    function createCanvas() {
        canvas = ElementHelper.create("canvas", {"width": (retina ? 16 : 8) * columns, "height": retina ? rows * 32 : rows * 16, "style": {"width": (8 * columns) + "px", "height": (rows * 16) + "px", "verticalAlign": "bottom"}});
        ctx = canvas.getContext("2d");
        imageData = ctx.createImageData(retina ? 16 : 8, retina ? 32 : 16);
        image = new Uint8Array(columns * rows * 3);
        clearImage();
        divEditor.appendChild(canvas);

        function canvasEvent(listeners, x, y, shiftKey, altKey, ctrlKey) {
            var coord, blockX, blockY;
            blockX = Math.floor((x - divEditor.offsetLeft + divEditor.scrollLeft) / 8);
            blockY = Math.floor((y - divEditor.offsetTop + divEditor.scrollTop) / 8);
            if (blockX >= 0 && blockY >= 0 && blockX < columns && blockY < rows * 2) {
                coord = getBlock(blockX, blockY);
                coord.shiftKey = shiftKey;
                coord.altKey = altKey;
                coord.ctrlKey = ctrlKey;
                fireEvent(listeners, coord);
            }
        }

        canvas.addEventListener("contextmenu", function (evt) {
            evt.preventDefault();
        }, false);

        canvas.addEventListener("mousedown", function (evt) {
            evt.preventDefault();
            canvasEvent(mouseDownListeners, evt.clientX - evt.currentTarget.offsetLeft, evt.clientY - evt.currentTarget.offsetTop, evt.shiftKey, evt.altKey, evt.ctrlKey);
        }, false);

        canvas.addEventListener("mouseup", function (evt) {
            evt.preventDefault();
            canvasEvent(mouseUpListeners, evt.clientX - evt.currentTarget.offsetLeft, evt.clientY - evt.currentTarget.offsetTop, evt.shiftKey, evt.altKey, evt.ctrlKey);
        }, false);

        canvas.addEventListener("mousemove", function (evt) {
            var mouseButton;
            evt.preventDefault();
            mouseButton = (evt.buttons !== undefined) ? evt.buttons : evt.which;
            if (mouseButton) {
                canvasEvent(mouseDragListeners, evt.clientX - evt.currentTarget.offsetLeft, evt.clientY - evt.currentTarget.offsetTop, evt.shiftKey, evt.altKey, evt.ctrlKey);
            } else {
                canvasEvent(mouseMoveListeners, evt.clientX - evt.currentTarget.offsetLeft, evt.clientY - evt.currentTarget.offsetTop);
            }
        }, false);

        canvas.addEventListener("mouseout", function (evt) {
            evt.preventDefault();
            fireEvent(mouseOutListeners, undefined);
        }, false);
    }

    function mirrorBlock(block) {
        var halfWay = columns / 2;
        if (block.blockX >= halfWay) {
            return getBlock((halfWay - 1) - (block.blockX - halfWay), block.blockY);
        }
        return getBlock(halfWay + (halfWay - 1 - block.blockX), block.blockY);
    }

    function setTextBlock(block, charCode, fg, bg) {
        storeUndo(block);
        set(charCode, fg, bg, block.index);
        update(block.index);
        if (mirror) {
            charCode = codepage.getFlippedTextX(charCode);
            block = mirrorBlock(block);
            storeUndo(block);
            set(charCode, fg, bg, block.index);
            update(block.index);
        }
    }

    function getTextBlock(textX, textY) {
        return getBlock(textX, textY * 2);
    }

    function getImageData(textX, textY, width, height) {
        var data, i, k, byteWidth, screenWidth;
        data = new Uint8Array(width * height * 3);
        byteWidth = width * 3;
        screenWidth = columns * 3;
        for (i = 0, k = (textY * columns + textX) * 3; i < data.length; i += byteWidth, k += screenWidth) {
            data.set(image.subarray(k, k + byteWidth), i);
        }
        return {
            "width": width,
            "height": height,
            "data": data
        };
    }

    function putImageData(inputImageData, textX, textY, alpha) {
        var y, x, i, block;
        for (y = 0, i = 0; y < inputImageData.height; ++y) {
            if (textY + y >= rows) {
                break;
            }
            if (textY + y >= 0) {
                for (x = 0; x < inputImageData.width; ++x, i += 3) {
                    if (textX + x >= 0 && textX + x < columns) {
                        block = getTextBlock(textX + x, textY + y);
                        if (!alpha || inputImageData.data[i]) {
                            setTextBlock(block, inputImageData.data[i], inputImageData.data[i + 1], inputImageData.data[i + 2]);
                            update(block.index);
                        }
                    }
                }
            } else {
                i += inputImageData.width * 3;
            }
        }
    }

    function getHighestRow() {
        var i, max;
        max = 26;
        for (i = 0; i < image.length; i += 3) {
            if (image[i]) {
                max = Math.max(Math.ceil(i / (columns * 3)), max);
            }
        }
        return max;
    }

    function renderImageData(inputImageData, preserveTransparency) {
        var imageDataCanvas, imageDataCtx, y, x, i;
        imageDataCanvas = ElementHelper.create("canvas", {"width": inputImageData.width * codepage.fontWidth, "height": inputImageData.height * codepage.fontHeight});
        imageDataCtx = imageDataCanvas.getContext("2d");
        for (y = 0, i = 0; y < inputImageData.height; ++y) {
            for (x = 0; x < inputImageData.width; ++x, i += 3) {
                if (!preserveTransparency || inputImageData.data[i]) {
                    imageData.data.set(codepage.bigFont(inputImageData.data[i], inputImageData.data[i + 1], inputImageData.data[i + 2]), 0);
                    imageDataCtx.putImageData(imageData, x * codepage.fontWidth, y * codepage.fontHeight);
                }
            }
        }
        return imageDataCanvas;
    }

    function resolveConflict(blockIndex, colorBias, color) {
        var block;
        block = getBlock(blockIndex / 3 % columns, Math.floor(blockIndex / 3 / columns) * 2);
        if (block.background > 7) {
            if (block.isBlocky) {
                if (block.foreground > 7) {
                    if (colorBias) {
                        if (block.upperBlockColor === color && block.lowerBlockColor === color) {
                            set(codepage.FULL_BLOCK, color, 0, block.index);
                        } else if (block.upperBlockColor === color) {
                            set(codepage.UPPER_HALF_BLOCK, block.upperBlockColor, block.lowerBlockColor - 8, block.index);
                        } else if (block.lowerBlockColor === color) {
                            set(codepage.LOWER_HALF_BLOCK, block.lowerBlockColor, block.upperBlockColor - 8, block.index);
                        } else {
                            set(image[block.index], block.foreground, block.background - 8, block.index);
                        }
                    } else {
                        if (block.upperBlockColor === color && block.lowerBlockColor === color) {
                            set(codepage.FULL_BLOCK, color, 0, block.index);
                        } else if (block.upperBlockColor === color) {
                            set(codepage.LOWER_HALF_BLOCK, block.lowerBlockColor, block.upperBlockColor - 8, block.index);
                        } else if (block.lowerBlockColor === color) {
                            set(codepage.UPPER_HALF_BLOCK, block.upperBlockColor, block.lowerBlockColor - 8, block.index);
                        } else {
                            set(image[block.index], block.foreground, block.background - 8, block.index);
                        }
                    }
                } else {
                    if ((block.upperBlockColor === block.background) && (block.lowerBlockColor === block.background)) {
                        set(codepage.FULL_BLOCK, block.background, block.foreground, block.index);
                    } else if (block.upperBlockColor === block.background) {
                        set(codepage.UPPER_HALF_BLOCK, block.background, block.foreground, block.index);
                    } else if (block.lowerBlockColor === block.background) {
                        set(codepage.LOWER_HALF_BLOCK, block.background, block.foreground, block.index);
                    } else {
                        set(codepage.FULL_BLOCK, block.foreground, block.background - 8, block.index);
                    }
                }
            } else {
                set(image[block.index], block.foreground, block.background - 8, block.index);
            }
        }
    }

    function optimizeBlockAttributes(block, color) {
        if (block.isBlocky) {
            if (block.isUpperHalf) {
                if (block.lowerBlockColor === color) {
                    set(codepage.FULL_BLOCK, color, block.background, block.index);
                } else {
                    set(codepage.UPPER_HALF_BLOCK, color, block.lowerBlockColor, block.index);
                }
            } else {
                if (block.upperBlockColor === color) {
                    set(codepage.FULL_BLOCK, color, block.background, block.index);
                } else {
                    set(codepage.LOWER_HALF_BLOCK, color, block.upperBlockColor, block.index);
                }
            }
        } else {
            if (block.isUpperHalf) {
                set(codepage.UPPER_HALF_BLOCK, color, block.background, block.index);
            } else {
                set(codepage.LOWER_HALF_BLOCK, color, block.background, block.index);
            }
        }
    }

    function setBlock(block, color, colorBias, colorBiasColor) {
        storeUndo(block);
        optimizeBlockAttributes(block, color);
        if (!noblink) {
            resolveConflict(block.index, colorBias, colorBiasColor);
        }
        update(block.index);
        if (mirror) {
            block = mirrorBlock(block);
            storeUndo(block);
            optimizeBlockAttributes(block, color);
            if (!noblink) {
                resolveConflict(block.index, colorBias, colorBiasColor);
            }
            update(block.index);
        }
    }

    function setBlocks(colorBias, colorBiasColor, callback) {
        var i, minIndex, maxIndex;
        minIndex = image.length - 1;
        maxIndex = 0;
        callback(function (block, color) {
            storeUndo(block);
            optimizeBlockAttributes(block, color);
            if (block.index < minIndex) {
                minIndex = block.index;
            }
            if (block.index > maxIndex) {
                maxIndex = block.index;
            }
            if (mirror) {
                block = mirrorBlock(block);
                storeUndo(block);
                optimizeBlockAttributes(block, color);
                if (block.index < minIndex) {
                    minIndex = block.index;
                }
                if (block.index > maxIndex) {
                    maxIndex = block.index;
                }
            }
        });
        for (i = minIndex; i <= maxIndex; i += 3) {
            if (!noblink) {
                resolveConflict(i, colorBias, colorBiasColor);
            }
            update(i);
        }
    }

    function setChar(block, charCode, color) {
        storeUndo(block);
        if (block.isBlocky) {
            if (block.isUpperHalf) {
                set(charCode, color, block.upperBlockColor, block.index);
            } else {
                set(charCode, color, block.lowerBlockColor, block.index);
            }
        } else {
            set(charCode, color, block.background, block.index);
        }
        if (!noblink) {
            resolveConflict(block.index, true, color);
        }
        update(block.index);
        if (mirror) {
            charCode = codepage.getFlippedTextX(charCode);
            block = mirrorBlock(block);
            storeUndo(block);
            if (block.isBlocky) {
                if (block.isUpperHalf) {
                    set(charCode, color, block.upperBlockColor, block.index);
                } else {
                    set(charCode, color, block.lowerBlockColor, block.index);
                }
            } else {
                set(charCode, color, block.background, block.index);
            }
            if (!noblink) {
                resolveConflict(block.index, true, color);
            }
            update(block.index);
        }
    }

    function blockLine(from, to, callback, colorBias, colorBiasColor) {
        var x0, y0, x1, y1, dx, dy, sx, sy, err, e2, block, blocks, i;

        function setBlockLineBlock(blockLineBlock, color) {
            storeUndo(blockLineBlock);
            optimizeBlockAttributes(blockLineBlock, color);
            blocks.push(blockLineBlock.index);
            if (mirror) {
                blockLineBlock = mirrorBlock(block);
                storeUndo(blockLineBlock);
                optimizeBlockAttributes(blockLineBlock, color);
                blocks.push(blockLineBlock.index);
            }
        }

        x0 = from.blockX;
        y0 = from.blockY;
        x1 = to.blockX;
        y1 = to.blockY;
        dx = Math.abs(x1 - x0);
        sx = (x0 < x1) ? 1 : -1;
        dy = Math.abs(y1 - y0);
        sy = (y0 < y1) ? 1 : -1;
        err = ((dx > dy) ? dx : -dy) / 2;
        blocks = [];

        while (true) {
            block = getBlock(x0, y0);
            callback(block, setBlockLineBlock);
            if (x0 === x1 && y0 === y1) {
                for (i = 0; i < blocks.length; ++i) {
                    if (!noblink) {
                        resolveConflict(blocks[i], colorBias, colorBiasColor);
                    }
                    update(blocks[i]);
                }
                break;
            }
            e2 = err;
            if (e2 > -dx) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dy) {
                err += dx;
                y0 += sy;
            }
        }
    }

    function startListening() {
        palette.startListening();
    }

    function stopListening() {
        palette.stopListening();
    }

    function init() {
        palette.init(changeColor, noblink);
        preview.init(columns, rows);
        createCanvas();
        startListening();
    }

    function undo() {
        var values, redoValues, i;
        if (undoQueue.length) {
            redoValues = [];
            values = undoQueue.shift();
            for (i = values.length - 1; i >= 0; --i) {
                redoValues.push([values[i][3], image[values[i][3]], image[values[i][3] + 1], image[values[i][3] + 2]]);
                image[values[i][3]] = values[i][0];
                image[values[i][3] + 1] = values[i][1];
                image[values[i][3] + 2] = values[i][2];
                update(values[i][3]);
            }
            redoQueue.push([redoValues, values]);
            return true;
        }
        return false;
    }

    function redo() {
        var values, i;
        if (redoQueue.length) {
            values = redoQueue.pop();
            for (i = values[0].length - 1; i >= 0; --i) {
                image[values[0][i][0]] = values[0][i][1];
                image[values[0][i][0] + 1] = values[0][i][2];
                image[values[0][i][0] + 2] = values[0][i][3];
                update(values[0][i][0]);
            }
            undoQueue.unshift(values[1]);
            return true;
        }
        return false;
    }

    function takeUndoSnapshot() {
        undoQueue.unshift([]);
    }

    function clearUndoHistory() {
        while (redoQueue.length) {
            redoQueue.pop();
        }
        while (undoQueue.length) {
            undoQueue.pop();
        }
    }

    function removeOverlay(uid) {
        document.getElementById("editor").removeChild(overlays[uid].canvas);
        delete overlays[uid];
    }

    function addOverlay(overlayCanvas, uid, redraw) {
        if (overlays[uid]) {
            removeOverlay(uid);
        }
        overlayCanvas.style.position = "absolute";
        if (retina) {
            overlayCanvas.style.width = overlayCanvas.width / 2 + "px";
            overlayCanvas.style.height = overlayCanvas.height / 2 + "px";
        } else {
            overlayCanvas.style.width = overlayCanvas.width + "px";
            overlayCanvas.style.height = overlayCanvas.height + "px";
        }
        overlayCanvas.style.left = "0px";
        overlayCanvas.style.top = "0px";
        overlayCanvas.style.pointerEvents = "none";
        document.getElementById("editor").appendChild(overlayCanvas);
        overlays[uid] = {"canvas": overlayCanvas, "redraw": redraw};
    }

    function notifyOfCanvasResize() {
        preview.resize(columns, rows, image);
        fireEvent(resizeListeners, undefined);
        Object.keys(overlays).forEach(function (uid) {
            var overlay = overlays[uid], canvas;
            removeOverlay(uid);
            canvas = overlay.redraw();
            addOverlay(canvas, uid, overlay.redraw);
        });
    }

    function resize(newColumns, newRows) {
        var oldColumns, oldRows, oldImage, x, y, sourceIndex, destIndex;
        clearUndoHistory();
        oldColumns = columns;
        oldRows = rows;
        columns = newColumns;
        rows = newRows;
        oldImage = image;
        divEditor.removeChild(canvas);
        createCanvas();
        for (y = 0, destIndex = 0; y < rows; y++) {
            for (x = 0; x < columns; x++, destIndex += 3) {
                if (x < oldColumns && y < oldRows) {
                    sourceIndex = (y * oldColumns + x) * 3;
                    image.set(oldImage.subarray(sourceIndex, sourceIndex + 3), destIndex);
                }
            }
        }
        redraw();
        notifyOfCanvasResize();
    }

    function getBlinkStatus() {
        return noblink;
    }

    function setBlinkStatus(value) {
        var i;
        if (value !== noblink) {
            if (noblink) {
                clearUndoHistory();
            }
            noblink = value;
            if (!noblink) {
                for (i = 2; i < image.length; i += 3) {
                    if (image[i] >= 8) {
                        image[i] -= 8;
                        update(i - 2);
                    }
                }
                preview.redraw(columns, rows, image);
            }
            fireEvent(blinkModeChangeListeners, noblink);
        }
    }

    function setImage(inputImageData, noblink) {
        var i;
        clearUndoHistory();
        setBlinkStatus(noblink);
        columns = inputImageData.width;
        rows = inputImageData.height;
        divEditor.removeChild(canvas);
        createCanvas();
        for (i = 0; i < image.length; i += 3) {
            image.set(inputImageData.data.subarray(i, i + 3), i);
        }
        redraw();
        notifyOfCanvasResize();
    }

    function setMirror(value) {
        mirror = value;
    }

    return {
        "codepage": codepage,
        "init": init,
        "getColumns": getColumns,
        "getRows": getRows,
        "getRetina": getRetina,
        "getCurrentColor": palette.getCurrentColor,
        "getRGBAColorFor": palette.styleRGBA,
        "disablePaletteKeys": palette.stopListening,
        "enablePaletteKeys": palette.startListening,
        "addColorChangeListener": addColorChangeListener,
        "removeColorChangeListener": removeColorChangeListener,
        "addBlinkModeChangeListener": addBlinkModeChangeListener,
        "removeBlinkModeChangeListener": removeBlinkModeChangeListener,
        "addMouseMoveListener": addMouseMoveListener,
        "removeMouseMoveListener": removeMouseMoveListener,
        "addMouseDownListener": addMouseDownListener,
        "removeMouseDownListener": removeMouseDownListener,
        "addMouseDragListener": addMouseDragListener,
        "removeMouseDragListener": removeMouseDragListener,
        "addMouseUpListener": addMouseUpListener,
        "removeMouseUpListener": removeMouseUpListener,
        "addMouseOutListener": addMouseOutListener,
        "removeMouseOutListener": removeMouseOutListener,
        "addResizeListener": addResizeListener,
        "removeResizeListener": removeResizeListener,
        "addCustomEventListener": addCustomEventListener,
        "removeCustomEventListener": removeCustomEventListener,
        "fireCustomEvent": fireCustomEvent,
        "clearImage": clearImage,
        "redraw": redraw,
        "resize": resize,
        "setImage": setImage,
        "getBlinkStatus": getBlinkStatus,
        "setBlinkStatus": setBlinkStatus,
        "getBlock": getBlock,
        "setBlock": setBlock,
        "setBlocks": setBlocks,
        "getTextBlock": getTextBlock,
        "setTextBlock": setTextBlock,
        "getImageData": getImageData,
        "putImageData": putImageData,
        "getHighestRow": getHighestRow,
        "renderImageData": renderImageData,
        "blockLine": blockLine,
        "setChar": setChar,
        "takeUndoSnapshot": takeUndoSnapshot,
        "undo": undo,
        "redo": redo,
        "clearUndoHistory": clearUndoHistory,
        "setMirror": setMirror,
        "addOverlay": addOverlay,
        "removeOverlay": removeOverlay,
        "stopListening": stopListening,
        "startListening": startListening
    };
}