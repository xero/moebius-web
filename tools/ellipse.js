function ellipseTool(editor) {
    "use strict";
    var canvas, ctx, fromBlock, oldTo, currentColor, filledEllipse;

    canvas = ElementHelper.create("canvas", {"width": 80 * editor.codepage.fontWidth, "height": editor.height * editor.codepage.fontHeight});
    ctx = canvas.getContext("2d");

    function translateCoords(fromBlockX, fromBlockY, toBlockX, toBlockY) {
        return {
            "blockX": fromBlockX,
            "blockY": fromBlockY,
            "width": Math.abs(fromBlockX - toBlockX) + 1,
            "height": Math.abs(fromBlockY - toBlockY) + 1
        };
    }

    function canvasDown(evt) {
        fromBlock = evt.detail;
        filledEllipse = evt.detail.shiftKey;
    }

    function clearEllipse() {
        var coords;
        if (oldTo) {
            coords = translateCoords(fromBlock.blockX, fromBlock.blockY, oldTo.blockX, oldTo.blockY);
            ctx.clearRect((coords.blockX - (coords.width + 1)) * editor.codepage.fontWidth, (coords.blockY - (coords.height + 1)) * (editor.codepage.fontHeight / 2), (coords.width + 2) * 2 * editor.codepage.fontWidth, (coords.height + 2) * 2 * (editor.codepage.fontHeight / 2));
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

    function canvasDrag(evt) {
        var coords;

        function setPixel(px, py) {
            ctx.fillRect(px * editor.codepage.fontWidth, py * (editor.codepage.fontHeight / 2), editor.codepage.fontWidth, (editor.codepage.fontHeight / 2));
        }

        function setLine(fromX, lineWidth, py) {
            ctx.fillRect(fromX * editor.codepage.fontWidth, py * (editor.codepage.fontHeight / 2), lineWidth * editor.codepage.fontWidth, (editor.codepage.fontHeight / 2));
        }

        clearEllipse();
        ctx.fillStyle = editor.palette.styleRGBA(editor.palette.getCurrentColor(), 1);
        coords = translateCoords(fromBlock.blockX, fromBlock.blockY, evt.detail.blockX, evt.detail.blockY);
        drawEllipse(coords.blockX, coords.blockY, coords.width, coords.height, setPixel, setLine);
        oldTo = evt.detail;
    }

    function canvasUp(evt) {
        clearEllipse();
        editor.takeUndoSnapshot();
        editor.setBlocks(!evt.detail.altKey, currentColor, function (setBlock) {
            var coords, px, block;

            function setPixel(px, py) {
                if (px >= 0 && px < 80 && py >= 0 && py < (editor.height * 2)) {
                    block = editor.getBlock(px, py);
                    setBlock(block, currentColor);
                }
            }

            function setLine(fromX, lineWidth, py) {
                for (px = fromX; px < fromX + lineWidth; ++px) {
                    setPixel(px, py);
                }
            }

            coords = translateCoords(fromBlock.blockX, fromBlock.blockY, oldTo.blockX, oldTo.blockY);
            drawEllipse(coords.blockX, coords.blockY, coords.width, coords.height, setPixel, setLine);
        });
    }

    function canvasOut() {
        clearEllipse();
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
        editor.addOverlay(canvas, "ellipse");
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("canvasDrag", canvasDrag);
        editor.canvas.removeEventListener("canvasUp", canvasUp);
        editor.canvas.removeEventListener("canvasOut", canvasOut);
        editor.canvas.removeEventListener("colorChange", colorChange);
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