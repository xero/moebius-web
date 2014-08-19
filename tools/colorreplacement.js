function colorReplacementTool(editor) {
    "use strict";
    var oldColor, currentColor, lastPoint;

    function colorChange(col) {
        if (currentColor !== col) {
            oldColor = currentColor;
            currentColor = col;
        }
    }

    function colorReplacement(block) {
        if (block.foreground === oldColor) {
            editor.setTextBlock(block, block.charCode, currentColor, block.background);
        } else if (block.background === oldColor) {
            if (currentColor >= 8 && !editor.getBlinkStatus()) {
                if (block.isBlocky) {
                    if (block.upperBlockColor === block.lowerBlockColor) {
                        if (block.upperBlockColor === currentColor) {
                            editor.setTextBlock(block, editor.codepage.FULL_BLOCK, currentColor, oldColor - 8);
                        }
                    } else if (block.isUpperHalf) {
                        if (block.lowerBlockColor >= 8) {
                            editor.setTextBlock(block, editor.codepage.UPPER_HALF_BLOCK, currentColor, block.lowerBlockColor - 8);
                        } else {
                            editor.setTextBlock(block, editor.codepage.UPPER_HALF_BLOCK, currentColor, block.lowerBlockColor);
                        }
                    } else {
                        if (block.upperBlockColor >= 8) {
                            editor.setTextBlock(block, editor.codepage.LOWER_HALF_BLOCK, currentColor, block.upperBlockColor - 8);
                        } else {
                            editor.setTextBlock(block, editor.codepage.LOWER_HALF_BLOCK, currentColor, block.upperBlockColor);
                        }
                    }
                } else {
                    editor.setTextBlock(block, block.charCode, block.foreground, currentColor - 8);
                }
            } else {
                editor.setTextBlock(block, block.charCode, block.foreground, currentColor);
            }
        }
    }

    function colorReplacementLine(from, to) {
        editor.blockLine(from, to, function (block) {
            colorReplacement(block);
        });
    }

    function canvasDown(coord) {
        editor.takeUndoSnapshot();
        if (coord.shiftKey && lastPoint) {
            colorReplacementLine(lastPoint, coord);
        } else {
            colorReplacement(coord);
        }
        lastPoint = coord;
    }

    function canvasDrag(coord) {
        if (lastPoint) {
            colorReplacementLine(lastPoint, coord);
            lastPoint = coord;
        }
    }

    editor.addColorChangeListener(colorChange);

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
        return "Color Replacement";
    }

    function onload() {
        currentColor = editor.getCurrentColor();
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "onload": onload,
        "uid": "colorreplacement"
    };
}

AnsiEditController.addTool(colorReplacementTool, "tools-right", 114);