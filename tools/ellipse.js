function ellipseTool(editor, toolbar) {
    "use strict";
    var canvas, ctx, fromBlock, oldTo, currentColor, filledEllipse, blocks;

    function createCanvas() {
        if (editor.getRetina()) {
            canvas = ElementHelper.create("canvas", {"width": editor.getColumns() * editor.codepage.getFontWidth() * 2, "height": editor.getRows() * editor.codepage.getFontHeight() * 2});
        } else {
            canvas = ElementHelper.create("canvas", {"width": editor.getColumns() * editor.codepage.getFontWidth(), "height": editor.getRows() * editor.codepage.getFontHeight()});
        }
        ctx = canvas.getContext("2d");
    }

    function createBlocks() {
        var i, canvas, ctx, imageData;
        blocks = [];
        for (i = 0; i < 32; i++) {
            if (editor.getRetina()) {
                canvas = ElementHelper.create("canvas", {"width": editor.codepage.getFontWidth() * 2, "height": editor.codepage.getFontHeight() * 2});
            } else {
                canvas = ElementHelper.create("canvas", {"width": editor.codepage.getFontWidth(), "height": editor.codepage.getFontHeight()});
            }
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

    function translateCoords(fromBlockX, fromBlockY, toBlockX, toBlockY) {
        return {
            "blockX": fromBlockX,
            "blockY": fromBlockY,
            "width": Math.abs(fromBlockX - toBlockX) + 1,
            "height": Math.abs(fromBlockY - toBlockY) + 1
        };
    }

    function canvasDown(coord) {
        if (coord.ctrlKey) {
            toolbar.sampleBlock(coord);
        } else {
            fromBlock = coord;
            filledEllipse = coord.shiftKey;
        }
    }

    function clearEllipse() {
        var newCoords;
        if (oldTo) {
            newCoords = translateCoords(fromBlock.blockX, fromBlock.blockY, oldTo.blockX, oldTo.blockY);
            if (editor.getRetina()) {
                ctx.clearRect((newCoords.blockX - newCoords.width - 1) * editor.codepage.getFontWidth() * 2, (newCoords.blockY - newCoords.height - 1) * editor.codepage.getFontHeight(), (newCoords.width * 2 + 3) * editor.codepage.getFontWidth() * 2, (newCoords.height * 2 + 3) * editor.codepage.getFontHeight());
            } else {
                ctx.clearRect((newCoords.blockX - newCoords.width - 1) * editor.codepage.getFontWidth(), (newCoords.blockY - newCoords.height - 1) * (editor.codepage.getFontHeight() / 2), (newCoords.width * 2 + 3) * editor.codepage.getFontWidth(), (newCoords.height * 2 + 3) * (editor.codepage.getFontHeight() / 2));
            }
        }
    }

    function drawEllipse(x0, y0, width, height, setPixel, setLine) {
        var a2, b2, fa2, fb2, x, y, sigma;
        a2 = width * width;
        b2 = height * height;
        fa2 = 4 * a2;
        fb2 = 4 * b2;

        for (x = 0, y = height, sigma = 2 * b2 + a2 * (1 - 2 * height); b2 * x <= a2 * y; ++x) {
            if (filledEllipse) {
                setLine(x0 - x, x * 2, y0 + y);
                setLine(x0 - x, x * 2, y0 - y);
            } else {
                setPixel(x0 + x, y0 + y);
                setPixel(x0 - x, y0 + y);
                setPixel(x0 + x, y0 - y);
                setPixel(x0 - x, y0 - y);
            }
            if (sigma >= 0) {
                sigma += fa2 * (1 - y);
                --y;
            }
            sigma += b2 * ((4 * x) + 6);
        }

        for (x = width, y = 0, sigma = 2 * a2 + b2 * (1 - 2 * width); a2 * y <= b2 * x; ++y) {
            if (filledEllipse) {
                setLine(x0 - x, x * 2, y0 + y);
                setLine(x0 - x, x * 2, y0 - y);
            } else {
                setPixel(x0 + x, y0 + y);
                setPixel(x0 - x, y0 + y);
                setPixel(x0 + x, y0 - y);
                setPixel(x0 - x, y0 - y);
            }
            if (sigma >= 0) {
                sigma += fb2 * (1 - x);
                --x;
            }
            sigma += a2 * ((4 * y) + 6);
        }
    }

    function canvasDrag(coord) {
        var newCoord, fontWidth, halfHeight;

        if (editor.getRetina()) {
            fontWidth = editor.codepage.getFontWidth() * 2;
            halfHeight = editor.codepage.getFontHeight();
        } else {
            fontWidth = editor.codepage.getFontWidth();
            halfHeight = editor.codepage.getFontHeight() / 2;
        }

        function setPixel(px, py) {
            if (((py + 1) % 2) === 1) {
                ctx.drawImage(blocks[currentColor], px * fontWidth, py * halfHeight);
            } else {
                ctx.drawImage(blocks[currentColor + 16], px * fontWidth, py * halfHeight - halfHeight);
            }
        }

        function setLine(fromX, lineWidth, py) {
            var px;
            for (px = fromX; px < fromX + lineWidth; px++) {
                if (((py + 1) % 2) === 1) {
                    ctx.drawImage(blocks[currentColor], px * fontWidth, py * halfHeight);
                } else {
                    ctx.drawImage(blocks[currentColor + 16], px * fontWidth, py * halfHeight - halfHeight);
                }
            }
        }

        clearEllipse();
        newCoord = translateCoords(fromBlock.blockX, fromBlock.blockY, coord.blockX, coord.blockY);
        drawEllipse(newCoord.blockX, newCoord.blockY, newCoord.width, newCoord.height, setPixel, setLine);
        oldTo = coord;
    }

    function canvasUp(coord) {
        clearEllipse();
        editor.startOfChunk();
        editor.setBlocks(!coord.altKey, currentColor, function (setBlock) {
            var columns, rows, newCoord, px, block;
            columns = editor.getColumns();
            rows = editor.getRows();

            function setPixel(px, py) {
                if (px >= 0 && px < columns && py >= 0 && py < (rows * 2)) {
                    block = editor.getBlock(px, py);
                    setBlock(block, currentColor);
                }
            }

            function setLine(fromX, lineWidth, py) {
                for (px = fromX; px < fromX + lineWidth; ++px) {
                    setPixel(px, py);
                }
            }

            newCoord = translateCoords(fromBlock.blockX, fromBlock.blockY, oldTo.blockX, oldTo.blockY);
            drawEllipse(newCoord.blockX, newCoord.blockY, newCoord.width, newCoord.height, setPixel, setLine);
        });
        editor.endOfChunk();
    }

    function canvasOut() {
        clearEllipse();
    }

    function colorChange(col) {
        currentColor = col;
    }

    createCanvas();

    function fontChange() {
        createBlocks();
    }

    editor.addFontChangeListener(fontChange);
    editor.addOverlayChangeListener(createCanvas);

    function init() {
        editor.addMouseDownListener(canvasDown);
        editor.addMouseDragListener(canvasDrag);
        editor.addMouseUpListener(canvasUp);
        editor.addMouseOutListener(canvasOut);
        editor.addColorChangeListener(colorChange);
        currentColor = editor.getCurrentColor();
        editor.addOverlay(canvas, "ellipse", function () {
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
        editor.removeOverlay("ellipse");
    }

    function toString() {
        return "Ellipse";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "ellispe"
    };
}

AnsiEditController.addTool(ellipseTool, "tools-right", 105);