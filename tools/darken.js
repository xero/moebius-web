function darkenTool(editor) {
    "use strict";
    var lastPoint;

    function darkenChunk(block) {
        if (block.isBlocky) {
            if (block.isUpperHalf) {
                if (block.upperBlockColor > 7) {
                    editor.setBlock(block, block.upperBlockColor - 8, true, block.upperBlockColor - 8);
                }
            } else {
                if (block.lowerBlockColor > 7) {
                    editor.setBlock(block, block.lowerBlockColor - 8, true, block.lowerBlockColor - 8);
                }
            }
        } else {
            if (block.foreground > 7) {
                editor.setChar(block, block.charCode, block.foreground - 8);
            }
        }
    }

    function blockLine(from, to) {
        editor.blockLine(from, to, function (block) {
            darkenChunk(block);
        });
    }

    function canvasDown(coord) {
        editor.startOfDrawing();
        if (coord.shiftKey && lastPoint) {
            blockLine(lastPoint, coord);
        } else {
            darkenChunk(coord);
        }
        lastPoint = coord;
    }

    function canvasDrag(coord) {
        if (lastPoint) {
            blockLine(lastPoint, coord);
            lastPoint = coord;
        }
    }

    function init() {
        editor.addMouseDownListener(canvasDown);
        editor.addMouseDragListener(canvasDrag);
        editor.addMouseUpListener(editor.endOfDrawing);
        editor.addMouseOutListener(editor.endOfDrawing);
        return true;
    }

    function remove() {
        editor.removeMouseDownListener(canvasDown);
        editor.removeMouseDragListener(canvasDrag);
        editor.removeMouseUpListener(editor.endOfDrawing);
        editor.removeMouseOutListener(editor.endOfDrawing);
    }

    function toString() {
        return "Darken";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "darken"
    };
}

AnsiEditController.addTool(darkenTool, "tools-right", 100);