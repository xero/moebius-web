function attributeBrushTool(editor) {
    "use strict";
    var currentColor, lastPoint;

    function colorChange(col) {
        currentColor = col;
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

    function canvasDown(coord) {
        editor.takeUndoSnapshot();
        if (coord.shiftKey && lastPoint) {
            colorLine(lastPoint, coord, coord.altKey);
        } else {
            colorize(coord, coord.altKey);
        }
        lastPoint = coord;
    }

    function canvasDrag(coord) {
        if (lastPoint) {
            colorLine(lastPoint, coord, coord.altKey);
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