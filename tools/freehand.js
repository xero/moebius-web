function freehandTool(editor, toolbar) {
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

    function sampleBlock(block) {
        if (block.isBlocky) {
            if (block.isUpperHalf) {
                editor.setCurrentColor(block.upperBlockColor);
            } else {
                editor.setCurrentColor(block.lowerBlockColor);
            }
            return true;
        }
        return false;
    }

    function canvasDown(coord) {
        if (coord.ctrlKey) {
            toolbar.sampleBlock(coord);
        } else {
            if (coord.shiftKey && lastPoint) {
                editor.startOfChunk();
                blockLine(lastPoint, coord, !coord.altKey);
                editor.endOfChunk();
            } else {
                editor.startOfFreehand();
                freehand(coord, !coord.altKey);
            }
            lastPoint = coord;
        }
    }

    function canvasDrag(coord) {
        blockLine(lastPoint, coord, !coord.altKey);
        lastPoint = coord;
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
        return "Freehand";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "freehand",
        "sampleBlock": sampleBlock,
        "autoselect": true
    };
}

AnsiEditController.addTool(freehandTool, "tools-right", 102);