function editorCanvas(height, palette, noblink, preview, codepage, retina) {
    "use strict";
    var canvas, ctx, imageData, image, undoQueue, overlays, mirror;

    canvas = ElementHelper.create("canvas", {"width": retina ? 1280 : 640, "height": retina ? height * 32 : height * 16, "style": {"width": "640px", "height": (height * 16) + "px", "verticalAlign": "bottom"}});
    ctx = canvas.getContext("2d");
    imageData = ctx.createImageData(retina ? 16 : 8, retina ? 32 : 16);
    image = new Uint8Array(80 * height * 3);
    undoQueue = [];
    overlays = {};
    mirror = false;

    function draw(charCode, x, y, fg, bg) {
        imageData.data.set(codepage.bigFont(charCode, fg, bg), 0);
        ctx.putImageData(imageData, x * imageData.width, y * imageData.height);
        preview.draw(charCode, x, y, fg, bg);
    }

    function update(index) {
        draw(image[index], index / 3 % 80, Math.floor(index / 240), image[index + 1], image[index + 2]);
    }

    function redraw() {
        var i;
        for (i = 0; i < image.length; i += 3) {
            update(i);
        }
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
        index = (textY * 80 + blockX) * 3;
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

    function mirrorBlock(block) {
        if (block.blockX > 39) {
            return getBlock(40 - (block.blockX - 40), block.blockY);
        }
        return getBlock(40 + (39 - block.blockX), block.blockY);
    }

    function setTextBlock(block, charCode, fg, bg) {
        storeUndo(block);
        set(charCode, fg, bg, block.index);
        update(block.index);
        if (mirror) {
            block = mirrorBlock(block);
            storeUndo(block);
            set(charCode, fg, bg, block.index);
            update(block.index);
        }
    }

    function getTextBlock(textX, textY) {
        return getBlock(textX, textY * 2);
    }

    function getImageData(textX, textY, width, height, alpha) {
        var data, i, k, byteWidth, screenWidth;
        data = new Uint8Array(width * height * 3);
        byteWidth = width * 3;
        screenWidth = 80 * 3;
        for (i = 0, k = (textY * 80 + textX) * 3; i < data.length; i += byteWidth, k += screenWidth) {
            data.set(image.subarray(k, k + byteWidth), i);
        }
        return {
            "width": width,
            "height": height,
            "data": data,
            "alpha": alpha
        };
    }

    function putImageData(inputImageData, textX, textY) {
        var y, x, i, block;
        for (y = 0, i = 0; y < inputImageData.height; ++y) {
            if (textY + y >= height) {
                break;
            }
            if (textY + y >= 0) {
                for (x = 0; x < inputImageData.width; ++x, i += 3) {
                    if (textX + x >= 0 && textX + x < 80) {
                        block = getTextBlock(textX + x, textY + y);
                        if (!inputImageData.alpha || inputImageData.data[i]) {
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

    function renderImageData(inputImageData) {
        var imageDataCanvas, imageDataCtx, y, x, i;
        imageDataCanvas = ElementHelper.create("canvas", {"width": inputImageData.width * codepage.fontWidth, "height": inputImageData.height * codepage.fontHeight});
        imageDataCtx = imageDataCanvas.getContext("2d");
        for (y = 0, i = 0; y < inputImageData.height; ++y) {
            for (x = 0; x < inputImageData.width; ++x, i += 3) {
                if (!inputImageData.alpha || inputImageData.data[i]) {
                    imageData.data.set(codepage.bigFont(inputImageData.data[i], inputImageData.data[i + 1], inputImageData.data[i + 2]), 0);
                    imageDataCtx.putImageData(imageData, x * codepage.fontWidth, y * codepage.fontHeight);
                }
            }
        }
        return imageDataCanvas;
    }

    function resolveConflict(blockIndex, colorBias, color) {
        var block;
        block = getBlock(blockIndex / 3 % 80, Math.floor(blockIndex / 3 / 80) * 2);
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

    function clearImage() {
        var i;
        for (i = 0; i < image.length; i += 3) {
            image[i] = 0;
            image[i + 1] = 7;
            image[i + 2] = 0;
        }
        redraw();
    }

    function init(divEditor) {
        palette.init(canvas, retina);
        preview.init(height, retina, codepage);
        clearImage();

        function dispatchEvent(type, x, y, shiftKey, altKey) {
            var coord, evt, blockX, blockY;
            blockX = Math.floor((x - divEditor.offsetLeft) / 8);
            blockY = Math.floor((y - divEditor.offsetTop) / 8);
            coord = getBlock(blockX, blockY);
            coord.shiftKey = shiftKey;
            coord.altKey = altKey;
            evt = new CustomEvent(type, {"detail": coord});
            canvas.dispatchEvent(evt);
        }

        divEditor.addEventListener("mousedown", function (evt) {
            evt.preventDefault();
            dispatchEvent("canvasDown", evt.pageX, evt.pageY, evt.shiftKey, evt.altKey);
        }, false);

        divEditor.addEventListener("mouseup", function (evt) {
            evt.preventDefault();
            dispatchEvent("canvasUp", evt.pageX, evt.pageY, evt.shiftKey, evt.altKey);
        }, false);

        divEditor.addEventListener("mousemove", function (evt) {
            var mouseButton;
            evt.preventDefault();
            mouseButton = (evt.buttons !== undefined) ? evt.buttons : evt.which;
            if (mouseButton) {
                dispatchEvent("canvasDrag", evt.pageX, evt.pageY, evt.shiftKey, evt.altKey);
            } else {
                dispatchEvent("canvasMove", evt.pageX, evt.pageY);
            }
        }, false);

        divEditor.addEventListener("mouseout", function () {
            canvas.dispatchEvent(new CustomEvent("canvasOut"));
        }, false);

        startListening();

        canvas.style.position = "absolute";
        canvas.style.left = "0px";
        canvas.style.top = "0px";

        divEditor.appendChild(canvas);
    }

    function undo() {
        var values, i;
        if (undoQueue.length) {
            values = undoQueue.shift();
            for (i = values.length - 1; i >= 0; --i) {
                image[values[i][3]] = values[i][0];
                image[values[i][3] + 1] = values[i][1];
                image[values[i][3] + 2] = values[i][2];
                update(values[i][3]);
            }
            return true;
        }
        return false;
    }

    function takeUndoSnapshot() {
        if (undoQueue.unshift([]) > 1000) {
            undoQueue.pop();
        }
    }

    function clearUndoHistory() {
        while (undoQueue.length) {
            undoQueue.pop();
        }
    }

    function removeOverlay(uid) {
        document.getElementById("editor").removeChild(overlays[uid]);
        delete overlays[uid];
    }

    function addOverlay(overlayCanvas, uid) {
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
        document.getElementById("editor").appendChild(overlayCanvas);
        overlays[uid] = overlayCanvas;
    }

    function setMirror(value) {
        mirror = value;
    }

    return {
        "height": height,
        "palette": palette,
        "codepage": codepage,
        "retina": retina,
        "noblink": noblink,
        "init": init,
        "canvas": canvas,
        "clearImage": clearImage,
        "redraw": redraw,
        "image": image,
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
        "takeUndoSnapshot": takeUndoSnapshot,
        "undo": undo,
        "clearUndoHistory": clearUndoHistory,
        "setMirror": setMirror,
        "addOverlay": addOverlay,
        "removeOverlay": removeOverlay,
        "getCurrentColor": palette.getCurrentColor,
        "stopListening": stopListening,
        "startListening": startListening
    };
}