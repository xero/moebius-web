function boxTool(editor, toolbar) {
    "use strict";
    var canvas, ctx, fromBlock, oldTo, currentColor, filledBox, blocks;

    function createCanvas() {
        canvas = ElementHelper.create("canvas", {"width": editor.getColumns() * editor.codepage.getFontWidth(), "height": editor.getRows() * editor.codepage.getFontHeight()});
        ctx = canvas.getContext("2d");
    }

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
            filledBox = coord.shiftKey;
        }
    }

    function clearBox() {
        var newCoords;
        if (oldTo) {
            newCoords = translateCoords(fromBlock.blockX, fromBlock.blockY, oldTo.blockX, oldTo.blockY);
            ctx.clearRect((newCoords.blockX - 1) * editor.codepage.getFontWidth(), (newCoords.blockY - 1) * (editor.codepage.getFontHeight() / 2), (newCoords.width + 2) * editor.codepage.getFontWidth(), (newCoords.height + 2) * (editor.codepage.getFontHeight() / 2));
        }
    }

    function drawHorizontalLine(startX, y, width) {
        var x, fontWidth, halfHeight;
        
        fontWidth = editor.codepage.getFontWidth();
        halfHeight = editor.codepage.getFontHeight() / 2;

        if (((y + 1) % 2) === 1) {
            for (x = startX; x < startX + width; x += 1) {
                ctx.drawImage(blocks[currentColor], x * fontWidth, y * halfHeight);
            }
        } else {
            for (x = startX; x < startX + width; x += 1) {
                ctx.drawImage(blocks[currentColor + 16], x * fontWidth, y * halfHeight - halfHeight);
            }
        }
    }

    function drawVerticalLine(x, startY, height) {
        var y, fontWidth, halfHeight;

        fontWidth = editor.codepage.getFontWidth();
        halfHeight = editor.codepage.getFontHeight() / 2;

        for (y = startY; y < startY + height; y += 1) {
            if (((y + 1) % 2) === 1) {
                ctx.drawImage(blocks[currentColor], x * fontWidth, y * halfHeight);
            } else {
                ctx.drawImage(blocks[currentColor + 16], x * fontWidth, y * halfHeight - halfHeight);
            }
        }
    }

    function canvasDrag(coord) {
        var newCoord, y;
        clearBox();
        newCoord = translateCoords(fromBlock.blockX, fromBlock.blockY, coord.blockX, coord.blockY);
        if (filledBox) {
            for (y = newCoord.blockY; y < newCoord.blockY + newCoord.height; y += 1) {
                drawHorizontalLine(newCoord.blockX, y, newCoord.width);
            }
        } else {
            drawHorizontalLine(newCoord.blockX, newCoord.blockY, newCoord.width);
            drawHorizontalLine(newCoord.blockX, newCoord.blockY + newCoord.height - 1, newCoord.width);
            drawVerticalLine(newCoord.blockX, newCoord.blockY + 1, newCoord.height - 2);
            drawVerticalLine(newCoord.blockX + newCoord.width - 1, newCoord.blockY + 1, newCoord.height - 2);
        }

        oldTo = coord;
    }

    function canvasUp(coord) {
        var newCoord, x, y, block;
        clearBox();
        editor.startOfChunk();
        editor.setBlocks(!coord.altKey, currentColor, function (setBlock) {
            newCoord = translateCoords(fromBlock.blockX, fromBlock.blockY, oldTo.blockX, oldTo.blockY);
            if (filledBox) {
                for (y = 0; y < newCoord.height; y += 1) {
                    for (x = 0; x < newCoord.width; ++x) {
                        block = editor.getBlock(newCoord.blockX + x, newCoord.blockY + y);
                        setBlock(block, currentColor);
                    }
                }
            } else {
                for (x = 0; x < newCoord.width; x += 1) {
                    block = editor.getBlock(newCoord.blockX + x, newCoord.blockY);
                    setBlock(block, currentColor);
                    block = editor.getBlock(newCoord.blockX + x, newCoord.blockY + newCoord.height - 1);
                    setBlock(block, currentColor);
                }
                for (y = 1; y < newCoord.height - 1; y += 1) {
                    block = editor.getBlock(newCoord.blockX, newCoord.blockY + y);
                    setBlock(block, currentColor);
                    block = editor.getBlock(newCoord.blockX + newCoord.width - 1, newCoord.blockY + y);
                    setBlock(block, currentColor);
                }
            }
        });
        editor.endOfChunk();
    }

    function canvasOut() {
        clearBox();
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
        editor.addOverlay(canvas, "box", function () {
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
        editor.removeOverlay("box");
    }

    function toString() {
        return "Box";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "box"
    };
}

AnsiEditController.addTool(boxTool, "tools-right", 120);