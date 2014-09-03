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

        function sampleTextBlock(coord) {
            if (coord.isBlocky) {
                editor.setCurrentColor(coord.isUpperHalf ? coord.upperBlockColor : coord.lowerBlockColor);
            } else {
                editor.setCurrentColor(coord.foreground);
            }
        }

        function canvasDown(coord) {
            if (coord.ctrlKey) {
                sampleTextBlock(coord);
            } else {
                if (coord.shiftKey && lastPoint) {
                    editor.startOfDrawing(editor.UNDO_CHUNK);
                    editor.blockLine(lastPoint, coord, charBrush);
                } else {
                    editor.startOfDrawing(editor.UNDO_FREEHAND);
                    charBrush(coord);
                }
                lastPoint = coord;
            }
        }

        function canvasDrag(coord) {
            if (lastPoint) {
                editor.blockLine(lastPoint, coord, charBrush);
                lastPoint = coord;
            }
        }

        function endOfDrawing() {
            editor.endOfDrawing();
        }

        function init() {
            editor.addMouseDownListener(canvasDown);
            editor.addMouseDragListener(canvasDrag);
            editor.addMouseUpListener(endOfDrawing);
            editor.addMouseOutListener(endOfDrawing);
            editor.addColorChangeListener(colorChange);
            currentColor = editor.getCurrentColor();
            return true;
        }

        function remove() {
            editor.removeMouseDownListener(canvasDown);
            editor.removeMouseDragListener(canvasDrag);
            editor.removeMouseUpListener(endOfDrawing);
            editor.removeMouseOutListener(endOfDrawing);
            editor.removeColorChangeListener(colorChange);
        }

        function getState() {
            return [mode];
        }

        function setState(bytes) {
            mode = bytes[0];
        }

        function modeChange(shiftKey) {
            if (shiftKey) {
                if (--mode < 0) {
                    mode = options.characters.length - 1;
                }
            } else {
                if (++mode === options.characters.length) {
                    mode = 0;
                }
            }
        }

        function toString() {
            return options.characters.length ? options.name + ": " + options.characters[mode].name : options.name;
        }

        return {
            "init": init,
            "modeShiftKey": (options.characters.length > 2),
            "remove": remove,
            "getState": getState,
            "setState": setState,
            "modeChange": modeChange,
            "toString": toString,
            "uid": "charbrush-" + options.uid
        };
    };
}