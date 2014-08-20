function boxTool(editor) {
    "use strict";
    var canvas, ctx, fromBlock, oldTo, currentColor, filledBox, blocks;

    function createCanvas() {
        canvas = ElementHelper.create("canvas", {"width": editor.getColumns() * editor.codepage.fontWidth, "height": editor.getRows() * editor.codepage.fontHeight});
        ctx = canvas.getContext("2d");
    }

    function createBlocks() {
        var i, canvas, ctx, imageData;
        blocks = [];
        for (i = 0; i < 32; i++) {
            canvas = ElementHelper.create("canvas", {"width": editor.codepage.fontWidth, "height": editor.codepage.fontHeight});
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

    function canvasDown(coords) {
        fromBlock = coords;
        filledBox = coords.shiftKey;
    }

    function clearBox() {
        var newCoords;
        if (oldTo) {
            newCoords = translateCoords(fromBlock.blockX, fromBlock.blockY, oldTo.blockX, oldTo.blockY);
            ctx.clearRect((newCoords.blockX - 1) * editor.codepage.fontWidth, (newCoords.blockY - 1) * (editor.codepage.fontHeight / 2), (newCoords.width + 2) * editor.codepage.fontWidth, (newCoords.height + 2) * (editor.codepage.fontHeight / 2));
        }
    }

    function drawHorizontalLine(startX, y, width) {
        var x, halfHeight;
        halfHeight = editor.codepage.fontHeight / 2;

        if (((y + 1) % 2) === 1) {
            for (x = startX; x < startX + width; x++) {
                ctx.drawImage(blocks[currentColor], x * editor.codepage.fontWidth, y * halfHeight);
            }
        } else {
            for (x = startX; x < startX + width; x++) {
                ctx.drawImage(blocks[currentColor + 16], x * editor.codepage.fontWidth, y * halfHeight - halfHeight);
            }
        }
    }

    function drawVerticalLine(x, startY, height) {
        var y, halfHeight;
        halfHeight = editor.codepage.fontHeight / 2;

        for (y = startY; y < startY + height; y++) {
            if (((y + 1) % 2) === 1) {
                ctx.drawImage(blocks[currentColor], x * editor.codepage.fontWidth, y * halfHeight);
            } else {
                ctx.drawImage(blocks[currentColor + 16], x * editor.codepage.fontWidth, y * halfHeight - halfHeight);
            }
        }
    }

    function canvasDrag(coords) {
        var newCoords, y;
        clearBox();

        newCoords = translateCoords(fromBlock.blockX, fromBlock.blockY, coords.blockX, coords.blockY);
        if (filledBox) {
            for (y = newCoords.blockY; y < newCoords.blockY + newCoords.height; y++) {
                drawHorizontalLine(newCoords.blockX, y, newCoords.width);
            }
        } else {
            drawHorizontalLine(newCoords.blockX, newCoords.blockY, newCoords.width);
            drawHorizontalLine(newCoords.blockX, newCoords.blockY + newCoords.height - 1, newCoords.width);
            drawVerticalLine(newCoords.blockX, newCoords.blockY + 1, newCoords.height - 2);
            drawVerticalLine(newCoords.blockX + newCoords.width - 1, newCoords.blockY + 1, newCoords.height - 2);
        }

        oldTo = coords;
    }

    function canvasUp(coords) {
        var newCoords, x, y, block;
        clearBox();
        editor.startOfDrawing();
        editor.setBlocks(!coords.altKey, currentColor, function (setBlock) {
            newCoords = translateCoords(fromBlock.blockX, fromBlock.blockY, oldTo.blockX, oldTo.blockY);
            if (filledBox) {
                for (y = 0; y < newCoords.height; ++y) {
                    for (x = 0; x < newCoords.width; ++x) {
                        block = editor.getBlock(newCoords.blockX + x, newCoords.blockY + y);
                        setBlock(block, currentColor);
                    }
                }
            } else {
                for (x = 0; x < newCoords.width; ++x) {
                    block = editor.getBlock(newCoords.blockX + x, newCoords.blockY);
                    setBlock(block, currentColor);
                    block = editor.getBlock(newCoords.blockX + x, newCoords.blockY + newCoords.height - 1);
                    setBlock(block, currentColor);
                }
                for (y = 1; y < newCoords.height - 1; ++y) {
                    block = editor.getBlock(newCoords.blockX, newCoords.blockY + y);
                    setBlock(block, currentColor);
                    block = editor.getBlock(newCoords.blockX + newCoords.width - 1, newCoords.blockY + y);
                    setBlock(block, currentColor);
                }
            }
            editor.endOfDrawing();
        });
    }

    function canvasOut() {
        clearBox();
    }

    function colorChange(col) {
        currentColor = col;
    }

    createCanvas();

    editor.addSetImageListener(createCanvas);

    function init() {
        editor.addMouseDownListener(canvasDown);
        editor.addMouseDragListener(canvasDrag);
        editor.addMouseUpListener(canvasUp);
        editor.addMouseOutListener(canvasOut);
        editor.addColorChangeListener(colorChange);
        currentColor = editor.getCurrentColor();
        editor.addOverlay(canvas, "box", function () {
            return canvas;
        });
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