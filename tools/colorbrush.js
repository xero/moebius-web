function colorBrushTool(toolbar) {
    "use strict";
    var currentColor, lastPoint;

    function colorChange(evt) {
        currentColor = evt.detail;
    }

    function colorize(block, adjustBackground) {
        var shiftedColor;
        if (adjustBackground) {
            if (currentColor > 7) {
                shiftedColor = currentColor - 8;
            } else {
                shiftedColor = currentColor;
            }
            if (block.background !== shiftedColor) {
                toolbar.editor.setTextBlock(block, block.charCode, block.foreground, shiftedColor);
            }
        } else {
            if (block.foreground !== currentColor) {
                toolbar.editor.setTextBlock(block, block.charCode, currentColor, block.background);
            }
        }
    }

    function colorLine(from, to, adjustBackground) {
        toolbar.editor.blockLine(from, to, function (block) {
            colorize(block, adjustBackground);
        });
    }

    function canvasDown(evt) {
        toolbar.editor.takeUndoSnapshot();
        if (evt.detail.shiftKey && lastPoint) {
            colorLine(lastPoint, evt.detail, evt.detail.altKey);
        } else {
            colorize(evt.detail, evt.detail.altKey);
        }
        lastPoint = evt.detail;
    }

    function canvasDrag(evt) {
        if (lastPoint) {
            colorLine(lastPoint, evt.detail, evt.detail.altKey);
            lastPoint = evt.detail;
        }
    }

    function init() {
        toolbar.editor.canvas.addEventListener("canvasDown", canvasDown, false);
        toolbar.editor.canvas.addEventListener("canvasDrag", canvasDrag, false);
        toolbar.palette.canvas.addEventListener("colorChange", colorChange, false);
        currentColor = toolbar.palette.getCurrentColor();
        return true;
    }

    function remove() {
        toolbar.editor.canvas.removeEventListener("canvasDown", canvasDown);
        toolbar.editor.canvas.removeEventListener("canvasDrag", canvasDrag);
        toolbar.palette.canvas.removeEventListener("colorChange", colorChange);
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

AnsiEditController.addTool(colorBrushTool, 99);