function fillTool(editor, toolbar) {
    "use strict";
    var currentColor;

    function colorChange(col) {
        currentColor = col;
    }

    function simpleFill(startBlock, targetColor, currentColorBias) {
        var columns, rows, queue, lastRowIndex, coord, block;

        columns = editor.getColumns();
        rows = editor.getRows();
        queue = [{"x": startBlock.blockX, "y": startBlock.blockY}];
        lastRowIndex = editor.getRows() * 2;

        editor.setBlocks(currentColorBias, currentColor, function (setBlock) {
            while (queue.length) {
                coord = queue.pop();
                block = editor.getBlock(coord.x, coord.y);
                if (block.isBlocky && ((block.isUpperHalf && (block.upperBlockColor === targetColor)) || (block.isLowerHalf && (block.lowerBlockColor === targetColor)))) {
                    setBlock(block, currentColor);
                    if (block.blockX > 0) {
                        queue.push({"x": block.blockX - 1, "y": block.blockY});
                    }
                    if (block.blockX < columns - 1) {
                        queue.push({"x": block.blockX + 1, "y": block.blockY});
                    }
                    if (block.blockY > 0) {
                        queue.push({"x": block.blockX, "y": block.blockY - 1});
                    }
                    if (block.blockY < lastRowIndex - 1) {
                        queue.push({"x": block.blockX, "y": block.blockY + 1});
                    }
                }
            }
        });
    }

    function canvasDown(coord) {
        var targetColor;
        if (coord.ctrlKey) {
            toolbar.sampleBlock(coord);
        } else {
            if (coord.isBlocky) {
                targetColor = coord.isUpperHalf ? coord.upperBlockColor : coord.lowerBlockColor;
                if (targetColor !== currentColor) {
                    editor.startOfChunk();
                    simpleFill(coord, targetColor, !coord.altKey);
                    editor.endOfChunk();
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