function lineTool(editor) {
    "use strict";
    var canvas, ctx, fromBlock, oldTo, currentColor;

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
    }

    function clearLine() {
        var coords;
        if (oldTo) {
            coords = translateCoords(fromBlock.blockX, fromBlock.blockY, oldTo.blockX, oldTo.blockY);
            ctx.clearRect((coords.blockX - 1) * editor.codepage.fontWidth, (coords.blockY - 1) * (editor.codepage.fontHeight / 2), (coords.width + 1) * editor.codepage.fontWidth, (coords.height + 1) * (editor.codepage.fontHeight / 2));
        }
    }

    function canvasDrag(evt) {
        var x0, y0, x1, y1, dx, dy, sx, sy, err, e2;

        x0 = fromBlock.blockX;
        y0 = fromBlock.blockY;
        x1 = evt.detail.blockX;
        y1 = evt.detail.blockY;
        dx = Math.abs(x1 - x0);
        sx = (x0 < x1) ? 1 : -1;
        dy = Math.abs(y1 - y0);
        sy = (y0 < y1) ? 1 : -1;
        err = ((dx > dy) ? dx : -dy) / 2;

        clearLine();

        ctx.fillStyle = editor.palette.styleRGBA(editor.palette.getCurrentColor(), 1);
        while (true) {
            ctx.fillRect(x0 * editor.codepage.fontWidth, y0 * (editor.codepage.fontHeight / 2), editor.codepage.fontWidth, editor.codepage.fontHeight / 2);
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

        oldTo = evt.detail;
    }

    function canvasUp(evt) {
        clearLine();
        editor.takeUndoSnapshot();
        editor.blockLine(fromBlock, evt.detail, function (block, setBlockLineBlock) {
            setBlockLineBlock(block, currentColor);
        }, !evt.detail.altKey, currentColor);
    }

    function canvasOut() {
        clearLine();
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
        editor.addOverlay(canvas, "line");
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("canvasDrag", canvasDrag);
        editor.canvas.removeEventListener("canvasUp", canvasUp);
        editor.canvas.removeEventListener("canvasOut", canvasOut);
        editor.canvas.removeEventListener("colorChange", colorChange);
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