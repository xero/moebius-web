function fillTool(editor) {
    "use strict";
    var currentColor;

    function colorChange(col) {
        currentColor = col;
    }

    function simpleFill(startBlock, targetColor, currentColorBias) {
        var columns, queue, lastRowIndex, block;

        columns = editor.getColumns();
        queue = [startBlock];
        lastRowIndex = editor.getRows() * 2 - 1;

        editor.setBlocks(currentColorBias, currentColor, function (setBlock) {
            while (queue.length) {
                block = queue.pop();
                if (block.isBlocky && ((block.isUpperHalf && (block.upperBlockColor === targetColor)) || (block.isLowerHalf && (block.lowerBlockColor === targetColor)))) {
                    setBlock(block, currentColor);
                    if (block.blockX > 0) {
                        queue.push(editor.getBlock(block.blockX - 1, block.blockY));
                    }
                    if (block.blockX < columns - 1) {
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
        editor.endOfDrawing();
    }

    function sampleBlock(coord) {
        if (coord.isBlocky) {
            editor.setCurrentColor(coord.isUpperHalf ? coord.upperBlockColor : coord.lowerBlockColor);
        }
    }

    function canvasDown(coord) {
        var targetColor;
        if (coord.ctrlKey) {
            sampleBlock(coord);
        } else {
            if (coord.isBlocky) {
                targetColor = coord.isUpperHalf ? coord.upperBlockColor : coord.lowerBlockColor;
                if (targetColor !== currentColor) {
                    editor.startOfDrawing(editor.UNDO_CHUNK);
                    simpleFill(coord, targetColor, !coord.altKey);
                }
            }
        }
    }

    function init() {
        editor.addMouseDownListener(canvasDown);
        editor.addColorChangeListener(colorChange);
        currentColor = editor.getCurrentColor();
        return true;
    }

    function remove() {
        editor.removeMouseDownListener(canvasDown);
        editor.removeColorChangeListener(colorChange);
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