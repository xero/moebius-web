function darkenTool(editor) {
    "use strict";
    var lastPoint;

    function darkenChunk(coord) {
        var block;
        block = editor.get(coord);
        if (block.isBlocky) {
            if (coord.isUpperHalf) {
                if (block.upperBlockColor > 7) {
                    editor.setChunk(coord, block.upperBlockColor - 8);
                }
            } else {
                if (block.lowerBlockColor > 7) {
                    editor.setChunk(coord, block.lowerBlockColor - 8);
                }
            }
        } else {
            if (block.foreground > 7) {
                editor.setChar(block.charCode, block.foreground - 8, coord);
            }
        }
    }

    function blockyLine(from, to) {
        editor.chunkLine(from, to, function (coord) {
            darkenChunk(coord);
        });
    }

    function canvasDown(evt) {
        editor.takeUndoSnapshot();
        if (evt.detail.shiftKey && lastPoint) {
            blockyLine(lastPoint, evt.detail);
        } else {
            darkenChunk(evt.detail);
        }
        lastPoint = evt.detail;
    }

    function canvasDrag(evt) {
        if (lastPoint) {
            blockyLine(lastPoint, evt.detail);
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