function lineTool(editor, toolbar) {
    "use strict";
    var canvas, ctx, fromBlock, oldTo, currentColor, blocks;

    function createBlocks() {
        var i, canvas, ctx, imageData;
        blocks = [];
        for (i = 0; i < 32; i += 1) {
            canvas = ElementHelper.create("canvas", {"width": editor.codepage.getFontWidth(), "height": editor.codepage.getFontHeight()});
            ctx = canvas.getContext("2d");
            imageData = ctx.createImageData(canvas.width, canvas.height);
            if (i < 16) {
                imageData.data.set(editor.codepage.upperBlock(i), 0);
            } else {
                imageData.data.set(editor.codepage.lowerBlock(i - 16), 0);
            }
            ctx.putImageData(imageData, 0, 0);
            blocks[i] = canvas;
        }
    }

    createBlocks();

    function createCanvas() {
        canvas = ElementHelper.create("canvas", {"width": editor.getColumns() * editor.codepage.getFontWidth(), "height": editor.getRows() * editor.codepage.getFontHeight()});
        ctx = canvas.getContext("2d");
    }

    function translateCoords(fromBlockX, fromBlockY, toBlockX, toBlockY) {
        var blockX, blockY, width, height;

        if (toBlockX < fromBlockX) {
            blockX = toBlockX;
            width = (fromBlockX - toBlockX + 1);
        } else {
            blockX = fromBlockX;
            width = (toBlockX - fromBlockX + 1);
        }
        if (toBlockY < fromBlockY) {
            blockY = toBlockY;
            height = (fromBlockY - toBlockY + 1);
        } else {
            blockY = fromBlockY;
            height = (toBlockY - fromBlockY + 1);
        }

        return {
            "blockX": blockX,
            "blockY": blockY,
            "width": width,
            "height": height
        };
    }

    function canvasDown(coord) {
        if (coord.ctrlKey) {
            toolbar.sampleBlock(coord);
        } else {
            fromBlock = coord;
        }
    }

    function clearLine() {
        var coords;
        if (oldTo) {
            coords = translateCoords(fromBlock.blockX, fromBlock.blockY, oldTo.blockX, oldTo.blockY);
            ctx.clearRect((coords.blockX - 1) * editor.codepage.getFontWidth(), (coords.blockY - 1) * (editor.codepage.getFontHeight() / 2), (coords.width + 2) * editor.codepage.getFontWidth(), (coords.height + 2) * (editor.codepage.getFontHeight() / 2));
        }
    }

    function canvasDrag(coord) {
        var x0, y0, x1, y1, dx, dy, sx, sy, err, e2, halfHeight, fontWidth, fontHeight;

        x0 = fromBlock.blockX;
        y0 = fromBlock.blockY;
        x1 = coord.blockX;
        y1 = coord.blockY;
        dx = Math.abs(x1 - x0);
        sx = (x0 < x1) ? 1 : -1;
        dy = Math.abs(y1 - y0);
        sy = (y0 < y1) ? 1 : -1;
        err = ((dx > dy) ? dx : -dy) / 2;

        clearLine();

        fontWidth = editor.codepage.getFontWidth();
        fontHeight = editor.codepage.getFontHeight();
        halfHeight = editor.codepage.getFontHeight() / 2;

        while (true) {
            if (((y0 + 1) % 2) === 1) {
                ctx.drawImage(blocks[currentColor], x0 * fontWidth, y0 * halfHeight);
            } else {
                ctx.drawImage(blocks[currentColor + 16], x0 * fontWidth, y0 * halfHeight - halfHeight);
            }
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

        oldTo = coord;
    }

    function canvasUp(coord) {
        clearLine();
        editor.startOfChunk();
        editor.blockLine(fromBlock, coord, function (block, setBlockLineBlock) {
            setBlockLineBlock(block, currentColor);
        }, !coord.altKey, currentColor);
        editor.endOfChunk();
    }

    function canvasOut() {
        clearLine();
    }

    function colorChange(col) {
        currentColor = col;
    }

    function fontChange() {
        createBlocks();
    }

    createCanvas();

    editor.addFontChangeListener(fontChange);
    editor.addOverlayChangeListener(createCanvas);

    function init() {
        editor.addMouseDownListener(canvasDown);
        editor.addMouseDragListener(canvasDrag);
        editor.addMouseUpListener(canvasUp);
        editor.addMouseOutListener(canvasOut);
        editor.addColorChangeListener(colorChange);
        currentColor = editor.getCurrentColor();
        editor.addOverlay(canvas, "line", function () {
            return canvas;
        }, 1);
        return true;
    }

    function remove() {
        editor.removeMouseDownListener(canvasDown);
        editor.removeMouseDragListener(canvasDrag);
        editor.removeMouseUpListener(canvasUp);
        editor.removeMouseOutListener(canvasOut);
        editor.removeColorChangeListener(colorChange);
        editor.removeOverlay("line");
    }

    function toString() {
        return "Line";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "line"
    };
}

AnsiEditController.addTool(lineTool, "tools-right", 108);