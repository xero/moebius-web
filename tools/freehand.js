function freehandTool(editor) {
    "use strict";
    var currentColor, lastPoint;

    function colorChange(col) {
        currentColor = col;
    }

    function freehand(block, currentColorBias) {
        editor.setBlock(block, currentColor, currentColorBias, currentColor);
    }

    function blockLine(from, to, currentColorBias) {
        editor.blockLine(from, to, function (block, setBlockLineBlock) {
            setBlockLineBlock(block, currentColor);
        }, currentColorBias, currentColor);
    }

    function sampleBlock(coord) {
        if (coord.isBlocky) {
            editor.setCurrentColor(coord.isUpperHalf ? coord.upperBlockColor : coord.lowerBlockColor);
        }
    }

    function canvasDown(coord) {
        if (coord.ctrlKey) {
            sampleBlock(coord);
        } else {
            if (coord.shiftKey && lastPoint) {
                editor.startOfDrawing(editor.UNDO_CHUNK);
                blockLine(lastPoint, coord, !coord.altKey);
            } else {
                editor.startOfDrawing(editor.UNDO_FREEHAND);
                freehand(coord, !coord.altKey);
            }
            lastPoint = coord;
        }
    }

    function canvasDrag(coord) {
        blockLine(lastPoint, coord, !coord.altKey);
        lastPoint = coord;
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