function freehandTool(editor) {
    "use strict";
    var currentColor, lastPoint;

    function colorChange(evt) {
        currentColor = evt.detail;
    }

    function blockyLine(from, to, currentColorBias) {
        editor.chunkLine(from, to, function (coord) {
            editor.setChunk(coord, currentColor);
            editor.resolveConflict(coord, currentColorBias);
        });
    }

    function canvasDown(evt) {
        if (evt.detail.shiftKey && lastPoint) {
            blockyLine(lastPoint, evt.detail, !evt.detail.altKey);
        } else {
            editor.setChunk(evt.detail, currentColor);
            editor.resolveConflict(evt.detail, !evt.detail.altKey);
        }
        lastPoint = evt.detail;
    }

    function canvasDrag(evt) {
        blockyLine(lastPoint, evt.detail, !evt.detail.altKey);
        lastPoint = evt.detail;
    }

    function init() {
        document.addEventListener("colorChange", colorChange, false);
        document.addEventListener("canvasDown", canvasDown, false);
        document.addEventListener("canvasDrag", canvasDrag, false);
        currentColor = editor.palette.getCurrentColor();
        return true;
    }

    function remove() {
        document.removeEventListener("colorChange", colorChange);
        document.removeEventListener("canvasDown", canvasDown);
        document.removeEventListener("canvasDrag", canvasDrag);
    }

    function toString() {
        return "Freehand";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "freehand"
    };
}