function colorBrushTool(editor) {
    "use strict";
    var currentColor, lastPoint;

    function colorChange(evt) {
        currentColor = evt.detail;
    }

    function colorize(coord, adjustBackground) {
        var block, shiftedColor;
        block = editor.get(coord);
        if (adjustBackground) {
            if (currentColor > 7) {
                shiftedColor = currentColor - 8;
            } else {
                shiftedColor = currentColor;
            }
            if (block.background !== shiftedColor) {
                editor.set(block.charCode, block.foreground, shiftedColor, coord.index);
            }
        } else {
            if (block.foreground !== currentColor) {
                editor.set(block.charCode, currentColor, block.background, coord.index);
            }
        }
    }

    function colorLine(from, to, adjustBackground) {
        editor.chunkLine(from, to, function (coord) {
            colorize(coord, adjustBackground);
        });
    }

    function canvasDown(evt) {
        editor.takeUndoSnapshot();
        if (evt.detail.shiftKey && lastPoint) {
            colorLine(lastPoint, evt.detail);
        } else {
            colorize(evt.detail, evt.detail.altKey);
        }
        lastPoint = evt.detail;
    }

    function canvasDrag(evt) {
        colorLine(lastPoint, evt.detail, evt.detail.altKey);
        lastPoint = evt.detail;
    }

    function init() {
        document.addEventListener("canvasDown", canvasDown, false);
        document.addEventListener("canvasDrag", canvasDrag, false);
        document.addEventListener("colorChange", colorChange, false);
        currentColor = editor.palette.getCurrentColor();
        return true;
    }

    function remove() {
        document.removeEventListener("canvasDown", canvasDown);
        document.removeEventListener("canvasDrag", canvasDrag);
        document.removeEventListener("colorChange", colorChange);
    }

    function toString() {
        return "Color Brush";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "colorbrush"
    };
}