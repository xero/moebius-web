function charBrushTool(name, editor, palette, options) {
    "use strict";
    var currentColor, lastPoint, mode;

    mode = 0;

    function colorChange(evt) {
        currentColor = evt.detail;
    }

    function charBrush(block) {
        editor.setChar(block, options[mode].charCode, currentColor);
        editor.resolveConflict(block, true, currentColor);
    }

    function canvasDown(evt) {
        editor.takeUndoSnapshot();
        if (evt.detail.shiftKey && lastPoint) {
            editor.blockLine(lastPoint, evt.detail, charBrush);
        } else {
            charBrush(evt.detail);
        }
        lastPoint = evt.detail;
    }

    function canvasDrag(evt) {
        if (lastPoint) {
            editor.blockLine(lastPoint, evt.detail, charBrush);
            lastPoint = evt.detail;
        }
    }

    function init() {
        editor.canvas.addEventListener("canvasDown", canvasDown, false);
        editor.canvas.addEventListener("canvasDrag", canvasDrag, false);
        palette.canvas.addEventListener("colorChange", colorChange, false);
        currentColor = palette.getCurrentColor();
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("canvasDrag", canvasDrag);
        palette.canvas.removeEventListener("colorChange", colorChange);
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