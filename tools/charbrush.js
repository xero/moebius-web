function charBrushTool(options) {
    "use strict";

    return function (toolbar) {
        var currentColor, lastPoint, mode;

        mode = 0;

        function colorChange(evt) {
            currentColor = evt.detail;
        }

        function charBrush(block) {
            toolbar.editor.setChar(block, options.characters[mode].charCode, currentColor);
            toolbar.editor.resolveConflict(block, true, currentColor);
        }

        function canvasDown(evt) {
            toolbar.editor.takeUndoSnapshot();
            if (evt.detail.shiftKey && lastPoint) {
                toolbar.editor.blockLine(lastPoint, evt.detail, charBrush);
            } else {
                charBrush(evt.detail);
            }
            lastPoint = evt.detail;
        }

        function canvasDrag(evt) {
            if (lastPoint) {
                toolbar.editor.blockLine(lastPoint, evt.detail, charBrush);
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

        function modeChange() {
            if (++mode === options.characters.length) {
                mode = 0;
            }
        }

        function toString() {
            return options.characters.length ? options.name + ": " + options.characters[mode].name : options.name;
        }

        return {
            "init": init,
            "remove": remove,
            "modeChange": modeChange,
            "toString": toString,
            "uid": "charbrush-" + options.name
        };
    };
}
