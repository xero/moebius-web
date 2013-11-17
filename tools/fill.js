function fillTool(editor) {
    "use strict";
    var currentColor;

    function colorChange(evt) {
        currentColor = evt.detail;
    }

    function simpleFill(blockX, blockY, targetColor) {
        var coord, block, queue, lastRowIndex;

        queue = [editor.getBlockCoord(blockX, blockY)];
        lastRowIndex = editor.height * 2 - 1;

        while (queue.length) {
            coord = queue.pop();
            block = editor.get(coord);
            if (block.isBlocky && ((coord.isUpperHalf && (block.upperBlockColor === targetColor)) || (coord.isLowerHalf && (block.lowerBlockColor === targetColor)))) {
                editor.setChunk(coord, currentColor);
                if (coord.blockX > 0) {
                    queue.push(editor.getBlockCoord(coord.blockX - 1, coord.blockY));
                }
                if (coord.blockX < 79) {
                    queue.push(editor.getBlockCoord(coord.blockX + 1, coord.blockY));
                }
                if (coord.blockX > 0) {
                    queue.push(editor.getBlockCoord(coord.blockX, coord.blockY - 1));
                }
                if (coord.blockX < lastRowIndex) {
                    queue.push(editor.getBlockCoord(coord.blockX, coord.blockY + 1));
                }
            }
        }
    }

    function canvasDown(evt) {
        var block, targetColor;
        block = editor.get(evt.detail);
        if (block.isBlocky) {
            targetColor = evt.detail.isUpperHalf ? block.upperBlockColor : block.lowerBlockColor;
            if (targetColor !== currentColor) {
                editor.takeUndoSnapshot();
                simpleFill(evt.detail.blockX, evt.detail.blockY, targetColor);
                editor.resolveConflicts(!evt.detail.altKey);
            }
        }
    }

    function init() {
        editor.canvas.addEventListener("canvasDown", canvasDown, false);
        editor.palette.canvas.addEventListener("colorChange", colorChange, false);
        currentColor = editor.palette.getCurrentColor();
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.palette.canvas.removeEventListener("colorChange", colorChange);
    }

    function toString() {
        return "Fill";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "fill"
    };
}