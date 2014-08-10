function boxTool(editor) {
    "use strict";
    var canvas, ctx, fromBlock, oldTo, currentColor, filledBox;

    canvas = ElementHelper.create("canvas", {"width": editor.columns * editor.codepage.fontWidth, "height": editor.height * editor.codepage.fontHeight});
    ctx = canvas.getContext("2d");

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

    function canvasDown(evt) {
        fromBlock = evt.detail;
        filledBox = evt.detail.shiftKey;
    }

    function clearBox() {
        var coords;
        if (oldTo) {
            coords = translateCoords(fromBlock.blockX, fromBlock.blockY, oldTo.blockX, oldTo.blockY);
            ctx.clearRect((coords.blockX - 1) * editor.codepage.fontWidth, (coords.blockY - 1) * (editor.codepage.fontHeight / 2), (coords.width + 1) * editor.codepage.fontWidth, (coords.height + 1) * (editor.codepage.fontHeight / 2));
        }
    }

    function canvasDrag(evt) {
        var coords;
        clearBox();

        ctx.fillStyle = editor.palette.styleRGBA(editor.palette.getCurrentColor(), 1);
        coords = translateCoords(fromBlock.blockX, fromBlock.blockY, evt.detail.blockX, evt.detail.blockY);
        if (filledBox) {
            ctx.fillRect(coords.blockX * editor.codepage.fontWidth, coords.blockY * (editor.codepage.fontHeight / 2), coords.width * editor.codepage.fontWidth, coords.height * (editor.codepage.fontHeight / 2));
        } else {
            ctx.fillRect(coords.blockX * editor.codepage.fontWidth, coords.blockY * (editor.codepage.fontHeight / 2), coords.width * editor.codepage.fontWidth, editor.codepage.fontHeight / 2);
            ctx.fillRect(coords.blockX * editor.codepage.fontWidth, (coords.blockY + coords.height - 1) * (editor.codepage.fontHeight / 2), coords.width * editor.codepage.fontWidth, editor.codepage.fontHeight / 2);
            ctx.fillRect(coords.blockX * editor.codepage.fontWidth, (coords.blockY + 1) * (editor.codepage.fontHeight / 2), editor.codepage.fontWidth, (coords.height - 2) * (editor.codepage.fontHeight / 2));
            ctx.fillRect((coords.blockX + coords.width - 1) * editor.codepage.fontWidth, (coords.blockY + 1) * (editor.codepage.fontHeight / 2), editor.codepage.fontWidth, (coords.height - 2) * (editor.codepage.fontHeight / 2));
        }

        oldTo = evt.detail;
    }

    function canvasUp(evt) {
        var coords, x, y, block;
        clearBox();
        editor.takeUndoSnapshot();
        editor.setBlocks(!evt.detail.altKey, currentColor, function (setBlock) {
            coords = translateCoords(fromBlock.blockX, fromBlock.blockY, oldTo.blockX, oldTo.blockY);
            if (filledBox) {
                for (y = 0; y < coords.height; ++y) {
                    for (x = 0; x < coords.width; ++x) {
                        block = editor.getBlock(coords.blockX + x, coords.blockY + y);
                        setBlock(block, currentColor);
                    }
                }
            } else {
                for (x = 0; x < coords.width; ++x) {
                    block = editor.getBlock(coords.blockX + x, coords.blockY);
                    setBlock(block, currentColor);
                    block = editor.getBlock(coords.blockX + x, coords.blockY + coords.height - 1);
                    setBlock(block, currentColor);
                }
                for (y = 1; y < coords.height - 1; ++y) {
                    block = editor.getBlock(coords.blockX, coords.blockY + y);
                    setBlock(block, currentColor);
                    block = editor.getBlock(coords.blockX + coords.width - 1, coords.blockY + y);
                    setBlock(block, currentColor);
                }
            }
        });
    }

    function canvasOut() {
        clearBox();
    }

    function colorChange(evt) {
        currentColor = evt.detail;
    }

    function init() {
        editor.canvas.addEventListener("canvasDown", canvasDown, false);
        editor.canvas.addEventListener("canvasDrag", canvasDrag, false);
        editor.canvas.addEventListener("canvasUp", canvasUp, false);
        editor.canvas.addEventListener("canvasOut", canvasOut, false);
        editor.canvas.addEventListener("colorChange", colorChange, false);
        currentColor = editor.palette.getCurrentColor();
        editor.addOverlay(canvas, "box");
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("canvasDrag", canvasDrag);
        editor.canvas.removeEventListener("canvasUp", canvasUp);
        editor.canvas.removeEventListener("canvasOut", canvasOut);
        editor.canvas.removeEventListener("colorChange", colorChange);
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