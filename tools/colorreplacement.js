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

    function getState() {
        if (oldColor !== undefined) {
            return [oldColor];
        }
        return [];
    }

    function setState(bytes) {
        oldColor = bytes[0];
    }

    function colorReplacementLine(from, to) {
        editor.blockLine(from, to, function (block) {
            colorReplacement(block);
        });
    }

    function sampleBlock(coord) {
        if (coord.isBlocky) {
            editor.setCurrentColor(coord.isUpperHalf ? coord.upperBlockColor : coord.lowerBlockColor);
        }
    }

    function canvasDown(coord) {
        if (coord.ctrlKey) {
            sampleBlock(coord);
        } else {
            if (coord.shiftKey && lastPoint) {
                editor.startOfDrawing(editor.UNDO_CHUNK);
                colorReplacementLine(lastPoint, coord);
            } else {
                editor.startOfDrawing(editor.UNDO_FREEHAND);
                colorReplacement(coord);
            }
            lastPoint = coord;
        }
    }

    function canvasDrag(coord) {
        if (lastPoint) {
            colorReplacementLine(lastPoint, coord);
            lastPoint = coord;
        }
    }

    function endOfDrawing() {
        editor.endOfDrawing();
    }

    editor.addColorChangeListener(colorChange);

    function init() {
        editor.addMouseDownListener(canvasDown);
        editor.addMouseDragListener(canvasDrag);
        editor.addMouseUpListener(endOfDrawing);
        editor.addMouseOutListener(endOfDrawing);
        return true;
    }

    function remove() {
        editor.removeMouseDownListener(canvasDown);
        editor.removeMouseDragListener(canvasDrag);
        editor.removeMouseUpListener(endOfDrawing);
        editor.removeMouseOutListener(endOfDrawing);
    }

    function toString() {
        return "Color Replacement";
    }

    function onload() {
        currentColor = editor.getCurrentColor();
    }

    return {
        "init": init,
        "getState": getState,
        "setState": setState,
        "remove": remove,
        "toString": toString,
        "onload": onload,
        "uid": "color-replacement"
    };
}

AnsiEditController.addTool(colorReplacementTool, "tools-right", 114);