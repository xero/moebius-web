function brightenTool(editor) {
    "use strict";
    var lastPoint;

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

    function blockLine(from, to, preserveExistingHighlights) {
        editor.blockLine(from, to, function (block) {
            brightenBlock(block, preserveExistingHighlights);
        });
    }

    function canvasDown(coord) {
        editor.takeUndoSnapshot();
        if (coord.shiftKey && lastPoint) {
            blockLine(lastPoint, coord, coord.altKey);
        } else {
            brightenBlock(coord, coord.altKey);
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

    function toString() {
        return "Brighten";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "brighten"
    };
}

AnsiEditController.addTool(brightenTool, "tools-right", 98);