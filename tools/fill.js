function fillTool(editor) {
    "use strict";
    var currentColor;

    function colorChange(evt) {
        currentColor = evt.detail;
    }

    function simpleFill(startBlock, targetColor, currentColorBias) {
        var queue, lastRowIndex, block;

        queue = [startBlock];
        lastRowIndex = editor.height * 2 - 1;

        editor.setBlocks(currentColorBias, currentColor, function (setBlock) {
            while (queue.length) {
                block = queue.pop();
                if (block.isBlocky && ((block.isUpperHalf && (block.upperBlockColor === targetColor)) || (block.isLowerHalf && (block.lowerBlockColor === targetColor)))) {
                    setBlock(block, currentColor);
                    if (block.blockX > 0) {
                        queue.push(editor.getBlock(block.blockX - 1, block.blockY));
                    }
                    if (block.blockX < editor.columns - 1) {
                        queue.push(editor.getBlock(block.blockX + 1, block.blockY));
                    }
                    if (block.blockX > 0) {
                        queue.push(editor.getBlock(block.blockX, block.blockY - 1));
                    }
                    if (block.blockX < lastRowIndex) {
                        queue.push(editor.getBlock(block.blockX, block.blockY + 1));
                    }
                }
            }
        });
    }

    function canvasDown(evt) {
        var targetColor;
        if (evt.detail.isBlocky) {
            targetColor = evt.detail.isUpperHalf ? evt.detail.upperBlockColor : evt.detail.lowerBlockColor;
            if (targetColor !== currentColor) {
                editor.takeUndoSnapshot();
                simpleFill(evt.detail, targetColor, !evt.detail.altKey);
            }
        }
    }

    function init() {
        editor.canvas.addEventListener("canvasDown", canvasDown, false);
        editor.canvas.addEventListener("colorChange", colorChange, false);
        currentColor = editor.palette.getCurrentColor();
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("colorChange", colorChange);
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

AnsiEditController.addTool(fillTool, "tools-right", 110);