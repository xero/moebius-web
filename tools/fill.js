function fillTool(toolbar) {
    "use strict";
    var currentColor;

    function colorChange(evt) {
        currentColor = evt.detail;
    }

    function simpleFill(startBlock, targetColor, currentColorBias) {
        var queue, lastRowIndex, block;

        queue = [startBlock];
        lastRowIndex = toolbar.editor.height * 2 - 1;

        while (queue.length) {
            block = queue.pop();
            if (block.isBlocky && ((block.isUpperHalf && (block.upperBlockColor === targetColor)) || (block.isLowerHalf && (block.lowerBlockColor === targetColor)))) {
                toolbar.editor.setBlock(block, currentColor);
                if (block.blockX > 0) {
                    queue.push(toolbar.editor.getBlock(block.blockX - 1, block.blockY));
                }
                if (block.blockX < 79) {
                    queue.push(toolbar.editor.getBlock(block.blockX + 1, block.blockY));
                }
                if (block.blockX > 0) {
                    queue.push(toolbar.editor.getBlock(block.blockX, block.blockY - 1));
                }
                if (block.blockX < lastRowIndex) {
                    queue.push(toolbar.editor.getBlock(block.blockX, block.blockY + 1));
                }
            }
        }

        toolbar.editor.resolveConflicts(currentColorBias, currentColor);
    }

    function canvasDown(evt) {
        var targetColor;
        if (evt.detail.isBlocky) {
            targetColor = evt.detail.isUpperHalf ? evt.detail.upperBlockColor : evt.detail.lowerBlockColor;
            if (targetColor !== currentColor) {
                toolbar.editor.takeUndoSnapshot();
                simpleFill(evt.detail, targetColor, !evt.detail.altKey);
            }
        }
    }

    function init() {
        toolbar.editor.canvas.addEventListener("canvasDown", canvasDown, false);
        toolbar.palette.canvas.addEventListener("colorChange", colorChange, false);
        currentColor = toolbar.palette.getCurrentColor();
        return true;
    }

    function remove() {
        toolbar.editor.canvas.removeEventListener("canvasDown", canvasDown);
        toolbar.palette.canvas.removeEventListener("colorChange", colorChange);
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

AnsiEditController.addTool(fillTool, 110);