function boxTool(editor) {
    "use strict";
    var canvas, ctx, fromBlock, oldTo, currentColor, filledBox;

    function createCanvas() {
        canvas = ElementHelper.create("canvas", {"width": editor.getColumns() * editor.codepage.fontWidth, "height": editor.getRows() * editor.codepage.fontHeight});
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

    function canvasDown(coords) {
        fromBlock = coords;
        filledBox = coords.shiftKey;
    }

    function clearBox() {
        var newCoords;
        if (oldTo) {
            newCoords = translateCoords(fromBlock.blockX, fromBlock.blockY, oldTo.blockX, oldTo.blockY);
            ctx.clearRect((newCoords.blockX - 1) * editor.codepage.fontWidth, (newCoords.blockY - 1) * (editor.codepage.fontHeight / 2), (newCoords.width + 1) * editor.codepage.fontWidth, (newCoords.height + 1) * (editor.codepage.fontHeight / 2));
        }
    }

    function canvasDrag(coords) {
        var newCoords;
        clearBox();

        ctx.fillStyle = editor.getRGBAColorFor(editor.getCurrentColor(), 1);
        newCoords = translateCoords(fromBlock.blockX, fromBlock.blockY, coords.blockX, coords.blockY);
        if (filledBox) {
            ctx.fillRect(newCoords.blockX * editor.codepage.fontWidth, newCoords.blockY * (editor.codepage.fontHeight / 2), newCoords.width * editor.codepage.fontWidth, newCoords.height * (editor.codepage.fontHeight / 2));
        } else {
            ctx.fillRect(newCoords.blockX * editor.codepage.fontWidth, newCoords.blockY * (editor.codepage.fontHeight / 2), newCoords.width * editor.codepage.fontWidth, editor.codepage.fontHeight / 2);
            ctx.fillRect(newCoords.blockX * editor.codepage.fontWidth, (newCoords.blockY + newCoords.height - 1) * (editor.codepage.fontHeight / 2), newCoords.width * editor.codepage.fontWidth, editor.codepage.fontHeight / 2);
            ctx.fillRect(newCoords.blockX * editor.codepage.fontWidth, (newCoords.blockY + 1) * (editor.codepage.fontHeight / 2), editor.codepage.fontWidth, (newCoords.height - 2) * (editor.codepage.fontHeight / 2));
            ctx.fillRect((newCoords.blockX + newCoords.width - 1) * editor.codepage.fontWidth, (newCoords.blockY + 1) * (editor.codepage.fontHeight / 2), editor.codepage.fontWidth, (newCoords.height - 2) * (editor.codepage.fontHeight / 2));
        }

        oldTo = coords;
    }

    function canvasUp(coords) {
        var newCoords, x, y, block;
        clearBox();
        editor.takeUndoSnapshot();
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
        });
    }

    function canvasOut() {
        clearBox();
    }

    function colorChange(col) {
        currentColor = col;
    }

    createCanvas();

    editor.addResizeListener(createCanvas);

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