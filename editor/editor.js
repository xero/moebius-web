function editorCanvas(divEditor, columns, rows, palette, noblink, preview, codepage, retina) {
    "use strict";
    var canvas, ctx, imageData, image, undoQueue, redoQueue, undoTypes, redoTypes, overlays, mirror, colorListeners, blinkModeChangeListeners, mouseMoveListeners, mouseDownListeners, mouseDragListeners, mouseUpListeners, mouseOutListeners, imageSetListeners, canvasDrawListeners, customEventListeners, title, author, group, UNDO_FREEHAND, UNDO_CHUNK, UNDO_RESIZE;

    undoQueue = [];
    undoTypes = [];
    redoQueue = [];
    redoTypes = [];
    overlays = {};
    mirror = false;
    colorListeners = [];
    blinkModeChangeListeners = [];
    mouseMoveListeners = [];
    mouseDownListeners = [];
    mouseDragListeners = [];
    mouseUpListeners = [];
    mouseOutListeners = [];
    imageSetListeners = [];
    canvasDrawListeners = [];
    customEventListeners = {};
    title = "";
    author = "";
    group = "";
    UNDO_FREEHAND = 0;
    UNDO_CHUNK = 1;
    UNDO_RESIZE = 2;

    function fireEvent(listeners, evt) {
        listeners.forEach(function (listener) {
            listener(evt);
        });
    }

    function draw(charCode, x, y, fg, bg) {
        imageData.data.set(codepage.bigFont(charCode, fg, bg), 0);
        ctx.putImageData(imageData, x * imageData.width, y * imageData.height);
        preview.draw(charCode, x, y, fg, bg);
    }

    function update(index) {
        draw(image[index], index / 3 % columns, Math.floor(index / (columns * 3)), image[index + 1], image[index + 2]);
        fireEvent(canvasDrawListeners, [image[index], image[index + 1], image[index + 2], index]);
    }

    function redraw() {
        var i;
        for (i = 0; i < image.length; i += 3) {
            update(i);
        }
    }

    function resetCanvas() {
        var i;
        for (i = 0; i < image.length; i += 3) {
            image[i] = 0;
            image[i + 1] = 7;
            image[i + 2] = 0;
        }
        redraw();
    }

    function clearImage() {
        resetCanvas();
        title = "";
        author = "";
        group = "";
    }

    function getColumns() {
        return columns;
    }

    function getRows() {
        return rows;
    }

    function setMetadata(newTitle, newAuthor, newGroup) {
        title = newTitle;
        author = newAuthor;
        group = newGroup;
    }

    function getMetadata() {
        return {
            "title": title,
            "author": author,
            "group": group
        };
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

    function addSetImageListener(listener) {
        addListener(imageSetListeners, listener);
    }

    function removeSetImageListener(listener) {
        removeListener(imageSetListeners, listener);
    }

    function addCanvasDrawListener(listener) {
        addListener(canvasDrawListeners, listener);
    }

    function removeCanvasDrawListener(listener) {
        removeListener(canvasDrawListeners, listener);
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

    function fireCustomEvent(uid, evt) {
        if (customEventListeners[uid] !== undefined) {
            fireEvent(customEventListeners[uid], evt);
        }
    }

    function changeColor(color) {
        fireEvent(colorListeners, color);
    }

    function storeUndo(block) {
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
        resetCanvas();
        divEditor.appendChild(canvas);
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
        var mouseButton;
        mouseButton = false;

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

        divEditor.addEventListener("contextmenu", function (evt) {
            evt.preventDefault();
        }, false);

        divEditor.addEventListener("mousedown", function (evt) {
            evt.preventDefault();
            if (!evt.ctrlKey) {
                mouseButton = true;
            }
            canvasEvent(mouseDownListeners, evt.clientX - canvas.offsetLeft, evt.clientY - canvas.offsetTop, evt.shiftKey, evt.altKey, evt.ctrlKey);
        }, false);

        divEditor.addEventListener("mouseup", function (evt) {
            evt.preventDefault();
            if (mouseButton) {
                mouseButton = false;
                canvasEvent(mouseUpListeners, evt.clientX - canvas.offsetLeft, evt.clientY - canvas.offsetTop, evt.shiftKey, evt.altKey, evt.ctrlKey);
            }
        }, false);

        divEditor.addEventListener("mousemove", function (evt) {
            evt.preventDefault();
            if (mouseButton) {
                canvasEvent(mouseDragListeners, evt.clientX - canvas.offsetLeft, evt.clientY - canvas.offsetTop, evt.shiftKey, evt.altKey, evt.ctrlKey);
            } else {
                canvasEvent(mouseMoveListeners, evt.clientX - canvas.offsetLeft, evt.clientY - canvas.offsetTop);
            }
        }, false);

        divEditor.addEventListener("mouseleave", function (evt) {
            evt.preventDefault();
            mouseButton = false;
            fireEvent(mouseOutListeners, undefined);
        }, false);

        palette.init(changeColor, noblink);
        preview.init(columns, rows);
        createCanvas();
        startListening();
    }

    function removeOverlay(uid) {
        divEditor.removeChild(overlays[uid].canvas);
        delete overlays[uid];
    }

    function isOverlayVisible(uid) {
        return overlays[uid] !== undefined;
    }

    function addOverlay(overlayCanvas, uid, redraw, zIndex) {

        function realignOverlay() {
            overlayCanvas.style.left = canvas.offsetLeft + "px";
        }

        if (overlays[uid]) {
            removeOverlay(uid);
        }
        if (retina) {
            overlayCanvas.style.width = overlayCanvas.width / 2 + "px";
            overlayCanvas.style.height = overlayCanvas.height / 2 + "px";
        } else {
            overlayCanvas.style.width = overlayCanvas.width + "px";
            overlayCanvas.style.height = overlayCanvas.height + "px";
        }
        overlayCanvas.style.zIndex = zIndex.toString(10);
        overlayCanvas.className = "canvas-overlay";
        realignOverlay();
        window.addEventListener("resize", realignOverlay, false);
        divEditor.appendChild(overlayCanvas);
        overlays[uid] = {"canvas": overlayCanvas, "redraw": redraw};
    }

    function notifyOfCanvasResize() {
        preview.resize(columns, rows, image);
        fireEvent(imageSetListeners, undefined);
        Object.keys(overlays).forEach(function (uid) {
            var overlay, zIndex, canvas;
            overlay = overlays[uid];
            zIndex = parseInt(overlay.canvas.style.zIndex, 10);
            removeOverlay(uid);
            canvas = overlay.redraw();
            addOverlay(canvas, uid, overlay.redraw, zIndex);
        });
    }

    function undo() {
        var values, redoValues, undoType, i, canvasIndex;
        if (undoQueue.length) {
            undoType = undoTypes.shift();
            redoTypes.unshift(undoType);
            values = undoQueue.shift();
            if (undoType === UNDO_RESIZE) {
                redoQueue.unshift([columns, rows, image.subarray(0, image.length)]);
                columns = values[0];
                rows = values[1];
                divEditor.removeChild(canvas);
                createCanvas();
                image.set(values[2], 0);
                redraw();
                notifyOfCanvasResize();
            } else {
                redoValues = [];
                values.reverse();
                for (i = 0; i < values.length; ++i) {
                    canvasIndex = values[i][3];
                    redoValues.push([image[canvasIndex], image[canvasIndex + 1], image[canvasIndex + 2], canvasIndex]);
                    image[canvasIndex] = values[i][0];
                    image[canvasIndex + 1] = values[i][1];
                    if (!noblink && values[i][2] >= 8) {
                        image[canvasIndex + 2] = values[i][2] - 8;
                    } else {
                        image[canvasIndex + 2] = values[i][2];
                    }
                    update(canvasIndex);
                }
                redoQueue.unshift([redoValues.reverse(), values.reverse()]);
                fireEvent(canvasDrawListeners, values.reverse());
            }
            return true;
        }
        return false;
    }

    function redo() {
        var values, redoType, i, updatedBlocks, canvasIndex;
        if (redoQueue.length) {
            redoType = redoTypes.shift();
            undoTypes.unshift(redoType);
            values = redoQueue.shift();
            if (redoType === UNDO_RESIZE) {
                undoQueue.unshift([columns, rows, image.subarray(0, image.length)]);
                columns = values[0];
                rows = values[1];
                divEditor.removeChild(canvas);
                createCanvas();
                image.set(values[2], 0);
                redraw();
                notifyOfCanvasResize();
            } else {
                updatedBlocks = [];
                for (i = 0; i < values[0].length; ++i) {
                    canvasIndex = values[0][i][3];
                    image[canvasIndex] = values[0][i][0];
                    image[canvasIndex + 1] = values[0][i][1];
                    if (!noblink && values[0][i][2] >= 8) {
                        image[canvasIndex + 2] = values[0][i][2] - 8;
                    } else {
                        image[canvasIndex + 2] = values[0][i][2];
                    }
                    update(canvasIndex);
                    updatedBlocks.push(values[0][i]);
                }
                undoQueue.unshift(values[1].reverse());
                fireEvent(canvasDrawListeners, updatedBlocks);
            }
            return true;
        }
        return false;
    }

    function clearRedoHistory() {
        while (redoQueue.length) {
            redoQueue.pop();
            redoTypes.pop();
        }
    }

    function clearUndoHistory() {
        clearRedoHistory();
        while (undoQueue.length) {
            undoQueue.pop();
            undoTypes.pop();
        }
    }

    function startOfDrawing(typeOfUndo) {
        clearRedoHistory();
        if (undoQueue.length !== 0) {
            if (undoQueue[0].length === 0) {
                undoQueue.splice(0, 1);
                undoTypes.splice(0, 1);
            }
        }
        undoQueue.unshift([]);
        undoTypes.unshift(typeOfUndo);
    }

    function getUndoHistory() {
        return {"queue": undoQueue, "types": undoTypes};
    }

    function setUndoHistory(queue, types) {
        clearUndoHistory();
        undoQueue = queue;
        undoTypes = types;
    }

    function resize(newColumns, newRows) {
        var oldColumns, oldRows, oldImage, x, y, sourceIndex, destIndex;
        clearRedoHistory();
        oldColumns = columns;
        oldRows = rows;
        columns = newColumns;
        rows = newRows;
        oldImage = image;
        divEditor.removeChild(canvas);
        createCanvas();
        undoQueue.unshift([oldColumns, oldRows, oldImage.subarray(0, oldImage.length)]);
        undoTypes.unshift(UNDO_RESIZE);
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

    function setImage(inputImageData) {
        var i;
        clearUndoHistory();
        setBlinkStatus(inputImageData.noblink);
        columns = inputImageData.width;
        rows = inputImageData.height;
        title = inputImageData.title;
        author = inputImageData.author;
        group = inputImageData.group;
        divEditor.removeChild(canvas);
        createCanvas();
        for (i = 0; i < image.length; i += 3) {
            image.set(inputImageData.data.subarray(i, i + 3), i);
        }
        notifyOfCanvasResize();
        redraw();
    }

    function setMirror(value) {
        mirror = value;
    }

    return {
        "codepage": codepage,
        "init": init,
        "getColumns": getColumns,
        "getRows": getRows,
        "setMetadata": setMetadata,
        "getMetadata": getMetadata,
        "getRetina": getRetina,
        "setCurrentColor": palette.setCurrentColor,
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
        "addSetImageListener": addSetImageListener,
        "removeSetImageListener": removeSetImageListener,
        "addCanvasDrawListener": addCanvasDrawListener,
        "removeCanvasDrawListener": removeCanvasDrawListener,
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
        "renderImageData": renderImageData,
        "blockLine": blockLine,
        "setChar": setChar,
        "startOfDrawing": startOfDrawing,
        "undo": undo,
        "redo": redo,
        "getUndoHistory": getUndoHistory,
        "setUndoHistory": setUndoHistory,
        "clearUndoHistory": clearUndoHistory,
        "setMirror": setMirror,
        "addOverlay": addOverlay,
        "removeOverlay": removeOverlay,
        "isOverlayVisible": isOverlayVisible,
        "stopListening": stopListening,
        "startListening": startListening,
        "UNDO_FREEHAND": UNDO_FREEHAND,
        "UNDO_CHUNK": UNDO_CHUNK
    };
}