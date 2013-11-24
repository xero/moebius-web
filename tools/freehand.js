function freehandTool(editor) {
    "use strict";
    var currentColor, lastPoint;

    function colorChange(evt) {
        currentColor = evt.detail;
    }

    function freehand(block, currentColorBias) {
        editor.setBlock(block, currentColor, currentColorBias, currentColor);
    }

    function blockLine(from, to, currentColorBias) {
        editor.blockLine(from, to, function (block, setBlockLineBlock) {
            setBlockLineBlock(block, currentColor);
        }, currentColorBias, currentColor);
    }

    function canvasDown(evt) {
        editor.takeUndoSnapshot();
        if (evt.detail.shiftKey && lastPoint) {
            blockLine(lastPoint, evt.detail, !evt.detail.altKey);
        } else {
            freehand(evt.detail, !evt.detail.altKey);
        }
        lastPoint = evt.detail;
    }

    function canvasDrag(evt) {
        if (lastPoint) {
            blockLine(lastPoint, evt.detail, !evt.detail.altKey);
            lastPoint = evt.detail;
        }
    }

    function init() {
        editor.canvas.addEventListener("canvasDown", canvasDown, false);
        editor.canvas.addEventListener("canvasDrag", canvasDrag, false);
        editor.canvas.addEventListener("colorChange", colorChange, false);
        currentColor = editor.getCurrentColor();
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("canvasDrag", canvasDrag);
        editor.canvas.removeEventListener("colorChange", colorChange);
    }

    function toString() {
        return "Freehand";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "freehand",
        "autoselect": true
    };
}

AnsiEditController.addTool(freehandTool, "tools-right", 102);