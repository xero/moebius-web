function shiftColorTool(editor) {
    "use strict";
    var lastPoint, mode;

    mode = 0;

    function brightenBlock(block, preserveExistingHighlights) {
        if (block.isBlocky) {
            if (block.isUpperHalf) {
                if (block.upperBlockColor < 8) {
                    editor.setBlock(block, block.upperBlockColor + 8, preserveExistingHighlights, block.lowerBlockColor);
                }
            } else {
                if (block.lowerBlockColor < 8) {
                    editor.setBlock(block, block.lowerBlockColor + 8, preserveExistingHighlights, block.upperBlockColor);
                }
            }
        } else {
            if (block.foreground < 8) {
                editor.setChar(block, block.charCode, block.foreground + 8);
            }
        }
    }

    function darkenBlock(block) {
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

    function blockLine(from, to, preserveExistingHighlights) {
        editor.blockLine(from, to, function (block) {
            if (mode === 0) {
                brightenBlock(block, preserveExistingHighlights);
            } else {
                darkenBlock(block);
            }
        });
    }

    function canvasDown(coord) {
        if (coord.shiftKey && lastPoint) {
            editor.startOfChunk();
            blockLine(lastPoint, coord, coord.altKey);
            editor.endOfChunk();
        } else {
            editor.startOfFreehand();
            brightenBlock(coord, coord.altKey);
            if (mode === 0) {
                brightenBlock(coord, coord.altKey);
            } else {
                darkenBlock(coord);
            }
        }
        lastPoint = coord;
    }

    function canvasDrag(coord) {
        if (lastPoint) {
            blockLine(lastPoint, coord, coord.altKey);
            lastPoint = coord;
        }
    }

    function init() {
        editor.addMouseDownListener(canvasDown);
        editor.addMouseDragListener(canvasDrag);
        return true;
    }

    function remove() {
        editor.removeMouseDownListener(canvasDown);
        editor.removeMouseDragListener(canvasDrag);
    }

    function getState() {
        return [mode];
    }

    function setState(bytes) {
        mode = bytes[0];
    }

    function toString() {
        return "Shift Color: " + ((mode === 0) ? "Brighten" : "Darken");
    }

    function modeChange() {
        mode = (mode === 0) ? 1 : 0;
    }

    return {
        "init": init,
        "remove": remove,
        "getState": getState,
        "setState": setState,
        "modeChange": modeChange,
        "toString": toString,
        "uid": "shift-color"
    };
}

AnsiEditController.addTool(shiftColorTool, "tools-right", 48);