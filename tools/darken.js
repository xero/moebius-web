function darkenTool(editor) {
    "use strict";
    var lastPoint;

    function darkenChunk(block) {
        if (block.isBlocky) {
            if (block.isUpperHalf) {
                if (block.upperBlockColor > 7) {
                    editor.setBlock(block, block.upperBlockColor - 8);
                    editor.resolveConflict(block, true, block.upperBlockColor - 8);
                }
            } else {
                if (block.lowerBlockColor > 7) {
                    editor.setBlock(block, block.lowerBlockColor - 8);
                    editor.resolveConflict(block, true, block.lowerBlockColor - 8);
                }
            }
        } else {
            if (block.foreground > 7) {
                editor.setChar(block, block.charCode, block.foreground - 8);
                editor.resolveConflict(block, true, block.foreground - 8);
            }
        }
    }

    function blockLine(from, to) {
        editor.blockLine(from, to, function (block) {
            darkenChunk(block);
        });
    }

    function canvasDown(evt) {
        editor.takeUndoSnapshot();
        if (evt.detail.shiftKey && lastPoint) {
            blockLine(lastPoint, evt.detail);
        } else {
            darkenChunk(evt.detail);
        }
        lastPoint = evt.detail;
    }

    function canvasDrag(evt) {
        if (lastPoint) {
            blockLine(lastPoint, evt.detail);
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
        return "Darken";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "darken"
    };
}