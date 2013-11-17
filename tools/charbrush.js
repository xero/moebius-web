function charBrushTool(name, editor, options) {
    "use strict";
    var currentColor, lastPoint, mode;

    mode = 0;

    function colorChange(evt) {
        currentColor = evt.detail;
    }

    function paintChar(coord) {
        editor.setChar(options[mode].charCode, currentColor, coord);
        editor.resolveConflict(coord);
    }

    function canvasDown(evt) {
        editor.takeUndoSnapshot();
        if (evt.detail.shiftKey && lastPoint) {
            editor.chunkLine(lastPoint, evt.detail, paintChar);
        } else {
            editor.setChar(options[mode].charCode, currentColor, evt.detail);
            editor.resolveConflict(evt.detail);
        }
        lastPoint = evt.detail;
    }

    function canvasDrag(evt) {
        editor.chunkLine(lastPoint, evt.detail, paintChar);
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

    function modeChange() {
        if (++mode === options.length) {
            mode = 0;
        }
    }

    function toString() {
        return options.length ? name + ": " + options[mode].name : name;
    }

    return {
        "init": init,
        "remove": remove,
        "modeChange": modeChange,
        "toString": toString,
        "uid": "charbrush-" + name
    };
}