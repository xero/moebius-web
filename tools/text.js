function textTool(editor, toolbar) {
    "use strict";
    var textOverlay, ctx, currentColor, cursor, startTextX, textEntryMode, cursorPositions;

    function createCanvas() {
        textOverlay = ElementHelper.create("canvas", {"width": editor.getColumns() * editor.codepage.getFontWidth(), "height": editor.getRows() * editor.codepage.getFontHeight()});
        ctx = textOverlay.getContext("2d");
    }

    function clearCursor(cursor) {
        var fontWidth, fontHeight;
        fontWidth = editor.codepage.getFontWidth();
        fontHeight = editor.codepage.getFontHeight();
        ctx.clearRect(cursor.textX * fontWidth, cursor.textY * fontHeight, fontWidth, fontHeight);
    }

    function drawCursor(cursor) {
        var fontWidth, fontHeight;
        fontWidth = editor.codepage.getFontWidth();
        fontHeight = editor.codepage.getFontHeight();
        ctx.fillStyle = editor.getRGBAColorFor(currentColor, 0.7);
        ctx.fillRect(cursor.textX * fontWidth, cursor.textY * fontHeight, fontWidth, fontHeight);
    }

    function storeCursorPos(textX, textY) {
        cursor = {"textX": textX, "textY": textY};
    }

    function updateCursorPos(coord) {
        if (cursor) {
            clearCursor(cursor);
        }
        storeCursorPos(coord.textX, coord.textY);
        drawCursor(cursor);
    }

    function enterTextEntryMode(keypressHandler, keydownOverrider) {
        if (!textEntryMode) {
            toolbar.stopListening();
            document.addEventListener("keypress", keypressHandler, false);
            document.addEventListener("keydown", keydownOverrider, false);
            textEntryMode = true;
            startTextX = cursor.textX;
            cursorPositions = [];
        }
    }

    function leaveTextEntryMode(keypressHandler, keydownOverrider) {
        if (textEntryMode) {
            toolbar.startListening();
            document.removeEventListener("keypress", keypressHandler, false);
            document.removeEventListener("keydown", keydownOverrider, false);
            clearCursor(cursor);
            cursor = undefined;
            textEntryMode = false;
        }
    }

    function keypress(evt) {
        var keyCode, textBlock;
        keyCode = evt.keyCode || evt.which;
        if (evt.altKey) {
            switch (keyCode) {
            case 13:
                leaveTextEntryMode(keypress);
                break;
            }
        } else {
            if (keyCode === 8) {
                if (cursorPositions.length) {
                    if (editor.undo()) {
                        clearCursor(cursor);
                        cursor = cursorPositions.pop();
                        drawCursor(cursor);
                    }
                }
            } else if (keyCode === 13) {
                evt.preventDefault();
                clearCursor(cursor);
                cursor.textX = startTextX;
                cursor.textY = Math.min(editor.getRows() - 1, cursor.textY + 1);
                drawCursor(cursor);
            } else if (keyCode >= 32 && keyCode <= 126) {
                evt.preventDefault();
                editor.startOfFreehand();
                clearCursor(cursor);
                textBlock = editor.getTextBlock(cursor.textX, cursor.textY);
                editor.setChar(textBlock, keyCode, currentColor);
                cursorPositions.push({"textX": cursor.textX, "textY": cursor.textY});
                cursor.textX += 1;
                if (cursor.textX === editor.getColumns()) {
                    cursor.textX = 0;
                    cursor.textY = Math.min(editor.getRows() - 1, cursor.textY + 1);
                }
                drawCursor(cursor);
            }
        }
    }

    function keydown(evt) {
        var keyCode;
        keyCode = evt.keyCode || evt.which;
        if (keyCode === 8 && textEntryMode) {
            evt.preventDefault();
            keypress(evt);
        }
    }

    function canvasDown(coord) {
        leaveTextEntryMode(keypress, keydown);
        updateCursorPos(coord);
    }

    function canvasDrag(coord) {
        updateCursorPos(coord);
    }

    function canvasUp(coord) {
        storeCursorPos(coord.textX, coord.textY);
        enterTextEntryMode(keypress, keydown);
    }

    function colorChange(col) {
        currentColor = col;
        if (cursor) {
            drawCursor(cursor);
        }
    }

    createCanvas();

    editor.addOverlayChangeListener(createCanvas);

    function init() {
        editor.addMouseDownListener(canvasDown);
        editor.addMouseDragListener(canvasDrag);
        editor.addMouseUpListener(canvasUp);
        editor.addColorChangeListener(colorChange);
        currentColor = editor.getCurrentColor();
        editor.addOverlay(textOverlay, "text", function () {
            return textOverlay;
        }, 1);
        return true;
    }

    function remove() {
        editor.removeMouseDownListener(canvasDown);
        editor.removeMouseDragListener(canvasDrag);
        editor.removeMouseUpListener(canvasUp);
        editor.removeColorChangeListener(colorChange);
        if (textEntryMode) {
            leaveTextEntryMode(keypress);
        }
        editor.removeOverlay("text");
    }

    function toString() {
        return "Text";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "text"
    };
}

AnsiEditController.addTool(textTool, "tools-right", 116);