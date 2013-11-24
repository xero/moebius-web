function charBrushTool(options) {
    "use strict";

    return function (editor) {
        var currentColor, lastPoint, mode;

        mode = 0;

        function colorChange(evt) {
            currentColor = evt.detail;
        }

        function charBrush(block) {
            editor.setChar(block, options.characters[mode].charCode, currentColor);
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
            editor.canvas.addEventListener("colorChange", colorChange, false);
            currentColor = editor.getCurrentColor();
            return true;
        }

        function remove() {
            editor.canvas.removeEventListener("canvasDown", canvasDown);
            editor.canvas.removeEventListener("canvasDrag", canvasDrag);
            editor.canvas.removeEventListener("colorChange", colorChange);
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