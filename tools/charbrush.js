function charBrushTool(options) {
    "use strict";

    return function (editor) {
        var currentColor, lastPoint, mode;

        mode = 0;

        function colorChange(col) {
            currentColor = col;
        }

        function charBrush(block) {
            editor.setChar(block, options.characters[mode].charCode, currentColor);
        }

        function canvasDown(coord) {
            editor.takeUndoSnapshot();
            if (coord.shiftKey && lastPoint) {
                editor.blockLine(lastPoint, coord, charBrush);
            } else {
                charBrush(coord);
            }
            lastPoint = coord;
        }

        function canvasDrag(coord) {
            if (lastPoint) {
                editor.blockLine(lastPoint, coord, charBrush);
                lastPoint = coord;
            }
        }

        function init() {
            editor.addMouseDownListener(canvasDown);
            editor.addMouseDragListener(canvasDrag);
            editor.addColorChangeListener(colorChange);
            currentColor = editor.getCurrentColor();
            return true;
        }

        function remove() {
            editor.removeMouseDownListener(canvasDown);
            editor.removeMouseDragListener(canvasDrag);
            editor.removeColorChangeListener(colorChange);
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