function editorCanvas(height, palette, codepage, retina) {
    "use strict";
    var canvas, ctx, previewCanvas, previewCtx, imageData, previewImageData, image, shiftKey, altKey, undoQueue, overlays, mirror;

    canvas = ElementHelper.create("canvas", {"width": retina ? 1280 : 640, "height": retina ? height * 32 : height * 16, "style": {"width": "640px", "height": (height * 16) + "px", "verticalAlign": "bottom"}});
    ctx = canvas.getContext("2d");
    previewCanvas = ElementHelper.create("canvas", {"width": retina ? 320 : 160, "height": retina ? height * 8 : height * 4, "style": {"width": "160px", "height": (height * 4) + "px", "verticalAlign": "bottom"}});
    previewCtx = previewCanvas.getContext("2d");
    imageData = ctx.createImageData(retina ? 16 : 8, retina ? 32 : 16);
    previewImageData = ctx.createImageData(retina ? 4 : 2, retina ? 8 : 4);
    image = new Uint8Array(80 * height * 3);
    undoQueue = [];
    overlays = {};
    mirror = false;

    function draw(charCode, x, y, fg, bg) {
        previewImageData.data.set(codepage.smallFont(charCode, fg, bg), 0);
        imageData.data.set(codepage.bigFont(charCode, fg, bg), 0);
        previewCtx.putImageData(previewImageData, x * previewImageData.width, y * previewImageData.height);
        ctx.putImageData(imageData, x * imageData.width, y * imageData.height);
    }

    function update(index) {
        draw(image[index], (index / 3) % 80, Math.floor(index / 240), image[index + 1], image[index + 2]);
    }

    function redraw() {
        var i;
        for (i = 0; i < image.length; i += 3) {
            update(i);
        }
    }

    function set(charCode, fg, bg, index) {
        var x, mirrorIndex;
        undoQueue[0].push([image[index], image[index + 1], image[index + 2], index]);
        image[index] = charCode;
        image[index + 1] = fg;
        image[index + 2] = bg;
        update(index);
        if (mirror) {
            x = (index % 240) / 3;
            if (x > 39) {
                mirrorIndex = (x - 40);
                mirrorIndex = index - (mirrorIndex ? mirrorIndex * 2 + 1 : 1) * 3;
            } else {
                mirrorIndex = (39 - x);
                mirrorIndex = index + (mirrorIndex ? mirrorIndex * 2 + 1 : 1) * 3;
            }
            undoQueue[0].push([image[mirrorIndex], image[mirrorIndex + 1], image[mirrorIndex + 2], mirrorIndex]);
            image[mirrorIndex] = charCode;
            image[mirrorIndex + 1] = fg;
            image[mirrorIndex + 2] = bg;
            update(mirrorIndex);
        }
    }

    function get(coord) {
        var index, charCode, foreground, background, isBlocky, upperBlockColor, lowerBlockColor;
        index = (coord.textY * 80 + coord.textX) * 3;
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
            "charCode": charCode,
            "foreground": foreground,
            "background": background,
            "isBlocky": isBlocky,
            "upperBlockColor": upperBlockColor,
            "lowerBlockColor": lowerBlockColor
        };
    }

    function setChunk(coord, color) {
        var block;
        block = get(coord);
        if (block.isBlocky) {
            if (coord.isUpperHalf) {
                if (block.lowerBlockColor === color) {
                    set(codepage.FULL_BLOCK, color, block.background, coord.index);
                } else {
                    set(codepage.UPPER_HALF_BLOCK, color, block.lowerBlockColor, coord.index);
                }
            } else {
                if (block.upperBlockColor === color) {
                    set(codepage.FULL_BLOCK, color, block.background, coord.index);
                } else {
                    set(codepage.LOWER_HALF_BLOCK, color, block.upperBlockColor, coord.index);
                }
            }
        } else {
            if (coord.isUpperHalf) {
                set(codepage.UPPER_HALF_BLOCK, color, block.background, coord.index);
            } else {
                set(codepage.LOWER_HALF_BLOCK, color, block.background, coord.index);
            }
        }
    }

    function getBlockCoord(blockX, blockY) {
        var x, y, textY, modBlockY;

        x = blockX * 8;
        y = blockY * 16;
        textY = Math.floor(blockY / 2);
        modBlockY = blockY % 2;

        return {
            "index": (textY * 80 + blockX) * 3,
            "x": x,
            "y": y,
            "textX": blockX,
            "textY": textY,
            "blockX": blockX,
            "blockY": blockY,
            "isUpperHalf": (modBlockY === 0),
            "isLowerHalf": (modBlockY === 1)
        };
    }

    function getTextCoord(textX, textY) {
        return {
            "index": (textY * 80 + textX) * 3,
            "x": textX * 8,
            "y": textY * 16,
            "textX": textX,
            "textY": textY,
            "blockX": textX,
            "blockY": textY * 2,
            "isUpperHalf": true,
            "isLowerHalf": false
        };
    }

    function chunkLine(from, to, callback) {
        var x0, y0, x1, y1, dx, dy, sx, sy, err, e2;

        x0 = from.blockX;
        y0 = from.blockY;
        x1 = to.blockX;
        y1 = to.blockY;
        dx = Math.abs(x1 - x0);
        sx = (x0 < x1) ? 1 : -1;
        dy = Math.abs(y1 - y0);
        sy = (y0 < y1) ? 1 : -1;
        err = ((dx > dy) ? dx : -dy) / 2;

        while (true) {
            callback(getBlockCoord(x0, y0));
            if (x0 === x1 && y0 === y1) {
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

    function setChar(charCode, color, coord) {
        var block;
        block = get(coord);
        if (block.isBlocky) {
            if (coord.isUpperHalf) {
                set(charCode, color, block.upperBlockColor, coord.index);
            } else {
                set(charCode, color, block.lowerBlockColor, coord.index);
            }
        } else {
            set(charCode, color, block.background, coord.index);
        }
    }

    function resolveConflict(coord, colorBias, color) {
        var block;
        block = get(coord);
        if (block.background > 7) {
            if (block.isBlocky) {
                if (block.foreground > 7) {
                    if (colorBias) {
                        if (block.upperBlockColor === color && block.lowerBlockColor === color) {
                            set(codepage.FULL_BLOCK, color, 0, coord.index);
                        } else if (block.upperBlockColor === color) {
                            set(codepage.UPPER_HALF_BLOCK, block.upperBlockColor, block.lowerBlockColor - 8, coord.index);
                        } else if (block.lowerBlockColor === color) {
                            set(codepage.LOWER_HALF_BLOCK, block.lowerBlockColor, block.upperBlockColor - 8, coord.index);
                        } else {
                            set(image[coord.index], block.foreground, block.background - 8, coord.index);
                        }
                    } else {
                        if (block.upperBlockColor === color && block.lowerBlockColor === color) {
                            set(codepage.FULL_BLOCK, color, 0, coord.index);
                        } else if (block.upperBlockColor === color) {
                            set(codepage.LOWER_HALF_BLOCK, block.lowerBlockColor, block.upperBlockColor - 8, coord.index);
                        } else if (block.lowerBlockColor === color) {
                            set(codepage.UPPER_HALF_BLOCK, block.upperBlockColor, block.lowerBlockColor - 8, coord.index);
                        } else {
                            set(image[coord.index], block.foreground, block.background - 8, coord.index);
                        }
                    }
                } else {
                    if ((block.upperBlockColor === block.background) && (block.lowerBlockColor === block.background)) {
                        set(codepage.FULL_BLOCK, block.background, block.foreground, coord.index);
                    } else if (block.upperBlockColor === block.background) {
                        set(codepage.UPPER_HALF_BLOCK, block.background, block.foreground, coord.index);
                    } else if (block.lowerBlockColor === block.background) {
                        set(codepage.LOWER_HALF_BLOCK, block.background, block.foreground, coord.index);
                    } else {
                        set(codepage.FULL_BLOCK, block.foreground, block.background - 8, coord.index);
                    }
                }
            } else {
                set(image[coord.index], block.foreground, block.background - 8, coord.index);
            }
        }
    }

    function resolveConflicts(colorBias, color) {
        var i;
        for (i = 0; i < image.length; i += 3) {
            resolveConflict({"textX": (i / 3) % 80, "textY": Math.floor(i / 240), "index": i}, colorBias, color);
        }
    }

    function keydown(evt) {
        switch (evt.keyCode || evt.which) {
        case 16:
            shiftKey = true;
            break;
        case 18:
            altKey = true;
            break;
        }
    }

    function keyup(evt) {
        switch (evt.keyCode || evt.which) {
        case 16:
            shiftKey = false;
            break;
        case 18:
            altKey = false;
            break;
        }
    }

    function startListening() {
        document.addEventListener("keydown", keydown, false);
        document.addEventListener("keyup", keyup, false);
        palette.startListening();
    }

    function stopListening() {
        document.removeEventListener("keydown", keydown);
        document.removeEventListener("keyup", keyup);
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
        var mousedown;

        mousedown = false;
        shiftKey = false;
        altKey = false;

        palette.init();
        clearImage();

        function getCoord(pageX, pageY) {
            var x, y, coord;

            x = pageX - divEditor.offsetLeft;
            y = pageY - divEditor.offsetTop;
            coord = getBlockCoord(Math.floor(x / 8), Math.floor(y / 8));
            coord.x = x;
            coord.y = y;
            coord.shiftKey = shiftKey;
            coord.altKey = altKey;

            return coord;
        }

        divEditor.addEventListener("mousedown", function (evt) {
            mousedown = true;
            canvas.dispatchEvent(new CustomEvent("canvasDown", {"detail": getCoord(evt.pageX, evt.pageY)}));
        }, false);

        divEditor.addEventListener("mouseup", function (evt) {
            mousedown = false;
            canvas.dispatchEvent(new CustomEvent("canvasUp", {"detail": getCoord(evt.pageX, evt.pageY)}));
        }, false);

        divEditor.addEventListener("mousemove", function (evt) {
            canvas.dispatchEvent(new CustomEvent(mousedown ? "canvasDrag" : "canvasMove", {"detail": getCoord(evt.pageX, evt.pageY)}));
        }, false);

        startListening();

        canvas.style.position = "absolute";
        canvas.style.left = "0px";
        canvas.style.top = "0px";

        divEditor.appendChild(canvas);
        document.getElementById("preview").appendChild(previewCanvas);
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
        }
    }

    function takeUndoSnapshot() {
        if (undoQueue.unshift([]) > 32) {
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
        overlayCanvas.style.left = "0px";
        overlayCanvas.style.top = "0px";
        document.getElementById("editor").appendChild(overlayCanvas);
        overlays[uid] = overlayCanvas;
    }

    function turnOnMirroring() {
        mirror = true;
    }

    function turnOffMirroring() {
        mirror = false;
    }

    return {
        "height": height,
        "init": init,
        "canvas": canvas,
        "set": set,
        "get": get,
        "turnOnMirroring": turnOnMirroring,
        "turnOffMirroring": turnOffMirroring,
        "getBlockCoord": getBlockCoord,
        "getTextCoord": getTextCoord,
        "setChunk": setChunk,
        "chunkLine": chunkLine,
        "setChar": setChar,
        "resolveConflict": resolveConflict,
        "resolveConflicts": resolveConflicts,
        "clearImage": clearImage,
        "redraw": redraw,
        "image": image,
        "takeUndoSnapshot": takeUndoSnapshot,
        "clearUndoHistory": clearUndoHistory,
        "undo": undo,
        "addOverlay": addOverlay,
        "removeOverlay": removeOverlay,
        "stopListening": stopListening,
        "startListening": startListening
    };
}