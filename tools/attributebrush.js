function attributeBrushTool(editor) {
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
                editor.setTextBlock(block, block.charCode, block.foreground, shiftedColor);
            }
        } else {
            if (block.foreground !== currentColor) {
                editor.setTextBlock(block, block.charCode, currentColor, block.background);
            }
        }
    }

    function colorLine(from, to, adjustBackground) {
        editor.blockLine(from, to, function (block) {
            colorize(block, adjustBackground);
        });
    }

    function canvasDown(evt) {
        editor.takeUndoSnapshot();
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
        editor.canvas.addEventListener("canvasDown", canvasDown, false);
        editor.canvas.addEventListener("canvasDrag", canvasDrag, false);
        editor.canvas.addEventListener("colorChange", colorChange, false);
        currentColor = editor.palette.palette.getCurrentColor();
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("canvasDrag", canvasDrag);
        editor.canvas.removeEventListener("colorChange", colorChange);
    }

    function toString() {
        return "Attribute Brush";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "attributebrush"
    };
}

AnsiEditController.addTool(attributeBrushTool, "tools-right", 97);