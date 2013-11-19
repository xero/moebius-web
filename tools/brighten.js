function brightenTool(editor) {
    "use strict";
    var lastPoint;

    function brightenBlock(block, preserveExistingHighlights) {
        if (block.isBlocky) {
            if (block.isUpperHalf) {
                if (block.upperBlockColor < 8) {
                    editor.setBlock(block, block.upperBlockColor + 8);
                    editor.resolveConflict(block, preserveExistingHighlights, block.lowerBlockColor);
                }
            } else {
                if (block.lowerBlockColor < 8) {
                    editor.setBlock(block, block.lowerBlockColor + 8);
                    editor.resolveConflict(block, preserveExistingHighlights, block.upperBlockColor);
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

    function canvasDown(evt) {
        editor.takeUndoSnapshot();
        if (evt.detail.shiftKey && lastPoint) {
            blockLine(lastPoint, evt.detail, evt.detail.altKey);
        } else {
            brightenBlock(evt.detail, evt.detail.altKey);
        }
        lastPoint = evt.detail;
    }

    function canvasDrag(evt) {
        if (lastPoint) {
            blockLine(lastPoint, evt.detail, evt.detail.altKey);
            lastPoint = evt.detail;
        }
    }

    function init() {
        editor.canvas.addEventListener("canvasDown", canvasDown, false);
        editor.canvas.addEventListener("canvasDrag", canvasDrag, false);
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("canvasDrag", canvasDrag);
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