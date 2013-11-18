function brightenTool(editor) {
    "use strict";
    var lastPoint;

    function brightenChunk(coord, preserveExistingHighlights) {
        var block;
        block = editor.get(coord);
        if (block.isBlocky) {
            if (coord.isUpperHalf) {
                if (block.upperBlockColor < 8) {
                    editor.setChunk(coord, block.upperBlockColor + 8);
                    editor.resolveConflict(coord, preserveExistingHighlights, block.lowerBlockColor);
                }
            } else {
                if (block.lowerBlockColor < 8) {
                    editor.setChunk(coord, block.lowerBlockColor + 8);
                    editor.resolveConflict(coord, preserveExistingHighlights, block.upperBlockColor);
                }
            }
        } else {
            if (block.foreground < 8) {
                editor.setChar(block.charCode, block.foreground + 8, coord);
            }
        }
    }

    function blockyLine(from, to, preserveExistingHighlights) {
        editor.chunkLine(from, to, function (coord) {
            brightenChunk(coord, preserveExistingHighlights);
        });
    }

    function canvasDown(evt) {
        editor.takeUndoSnapshot();
        if (evt.detail.shiftKey && lastPoint) {
            blockyLine(lastPoint, evt.detail, evt.detail.altKey);
        } else {
            brightenChunk(evt.detail, evt.detail.altKey);
        }
        lastPoint = evt.detail;
    }

    function canvasDrag(evt) {
        if (lastPoint) {
            blockyLine(lastPoint, evt.detail, evt.detail.altKey);
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